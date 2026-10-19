import { bargeInDecision, isMostlyEcho, stripEchoPrefix } from "./echo";
import { pickVoice, type VoiceLike } from "./support";
import {
  cleanForSpeech,
  clipToLimit,
  DEFAULT_TIMING,
  isAcknowledgementOnly,
  isFillerOnly,
  isStallOnly,
  joinText,
  SentenceSplitter,
  silenceDelay,
  type TurnTiming,
  words,
} from "./text";
import { dedupeCumulative, readResults, type ResultListLike, type Segment } from "./transcript";

// Hands-free voice mode for the interview room, using only the browser's Web Speech API.
//
// It listens all the time while it is on. What the student says appears in the reply box
// as they speak, and a short silence sends it, exactly as if they had typed it and pressed
// Send. The interviewer's reply is read aloud sentence by sentence as it streams in. If the
// student starts talking while the interviewer is speaking, the interviewer stops at once
// and listens (barge-in). The interviewer's own voice coming back through the microphone
// is recognised and never sent as an answer.
//
// This class only drives the browser objects it is given and calls back into the room;
// it never talks to our server. The room sends the text through its normal Send path, so
// every limit and check stays the same (lib/ai is untouched). It has no React and no
// window, so tests drive it with fake recognition and speech objects (tests/voice.test.ts).

export type VoicePhase = "off" | "listening" | "thinking" | "speaking" | "paused";

/** Why voice mode had to switch itself off. */
export type VoiceProblem = "blocked" | "speech-off" | "no-microphone" | "network" | "language" | "stopped";

export type RecognitionEventLike = { readonly resultIndex: number; readonly results: ResultListLike };

/** The parts of SpeechRecognition that voice mode uses. */
export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  /** Newer browsers: recognise speech on the device, so the audio never leaves it. */
  processLocally?: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/** The parts of SpeechSynthesisUtterance that voice mode uses. */
export interface UtteranceLike {
  text: string;
  lang: string;
  rate: number;
  volume: number;
  voice: VoiceLike | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

/** The parts of window.speechSynthesis that voice mode uses. */
export interface SynthLike {
  readonly speaking: boolean;
  speak(utterance: UtteranceLike): void;
  cancel(): void;
  resume?(): void;
  getVoices(): VoiceLike[];
}

export type VoiceDeps = {
  createRecognition: () => RecognitionLike;
  synth: SynthLike;
  createUtterance: (text: string) => UtteranceLike;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type VoiceOptions = {
  /** The longest answer the room accepts (the same cap as typing). */
  maxChars: number;
  /** Turn the microphone off while the interviewer speaks (iPhone and iPad). */
  halfDuplex: boolean;
  listenLang: string;
  speakLang: string;
  rate: number;
  timing: TurnTiming;
  /**
   * Speech that started while the interviewer was talking, or within this long after it
   * stopped, is checked for the interviewer's own echo. Speech that starts later is the
   * student's, even if it repeats the question's words.
   */
  echoTailMs: number;
  /** The browser has said it can recognise this language on the device (SpeechRecognition.available). */
  onDevice: boolean;
};

export type VoiceCallbacks = {
  onPhase: (phase: VoicePhase) => void;
  /** The answer heard so far, already cut to maxChars (`clipped` says whether it was cut). */
  onTranscript: (text: string, clipped: boolean) => void;
  /**
   * Send the answer, as if typed. "sent": the room started the turn. "busy": the room is
   * still busy with the last turn, so try again shortly. "refused": it cannot be sent now
   * (for example the interview has finished), so keep the words in the box.
   */
  onSubmit: (text: string) => SubmitResult;
  onProblem: (problem: VoiceProblem) => void;
  /**
   * What was heard has been kept in the box but not sent (a lone "okay so", "give me a
   * moment", a nod), so the room can say why nothing is happening. `false` when that ends.
   */
  onHeld?: (held: boolean) => void;
};

export type SubmitResult = "sent" | "busy" | "refused";

export const DEFAULT_VOICE_OPTIONS: Omit<VoiceOptions, "maxChars" | "halfDuplex" | "listenLang"> = {
  speakLang: "en-GB",
  rate: 1,
  timing: DEFAULT_TIMING,
  echoTailMs: 400,
  onDevice: false,
};

const RESTART_DELAY_MS = 250;
const BUSY_RETRY_MS = 400;
const MAX_STARTS_WITHOUT_RESULT = 6; // within 10 seconds
const MAX_SERVICE_ERRORS = 3; // within 30 seconds
// Interruptions are judged on the last few words heard, against the last few sentences read.
const BARGE_WINDOW_WORDS = 10;
const BARGE_REFERENCE_WORDS = 36;
// Only a run this long, in the interviewer's order, is cut from the start of an answer.
const ECHO_PREFIX_MIN_RUN = 4;

type RecState = "idle" | "starting" | "running" | "stopping";

export class VoiceController {
  private phase: VoicePhase = "off";
  private readonly opts: VoiceOptions;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  // Listening
  private rec: RecognitionLike | null = null;
  private recState: RecState = "idle";
  private wantRec = false;
  private fatal = false;
  private onDevice: boolean;
  private restartTimer: unknown = null;
  private starts: number[] = [];
  private serviceErrors: number[] = [];
  /** What the browser has heard in the current listening session. */
  private segs: Segment[] = [];
  private firstSeen: number[] = [];
  /** Segments before this index were heard before the current turn began (or were kept from it). */
  private speakFrom = 0;
  /** Words said while the interviewer was thinking have been moved into `carried`. */
  private thinkKept = false;
  /** Something was kept from the thinking phase, so it is sent after the usual quiet even if nothing new is said. */
  private keptPending = false;
  /** The box holds words that were deliberately not sent. */
  private held = false;
  /** The current answer starts at this segment. */
  private listenFrom = 0;
  /** Answer text from before this listening session, or already in the box. */
  private carried = "";
  /** The answer as last shown in the box. */
  private answer = "";
  private silenceTimer: unknown = null;

  // Speaking
  private splitter = new SentenceSplitter();
  private queue: string[] = [];
  private current: UtteranceLike | null = null;
  /** Every sentence of the current reply that has started playing, in order. */
  private replySentences: string[] = [];
  private speechGen = 0;
  private replyOpen = false;
  private muted = false;
  private speechEndedAt = -Infinity;
  private tailText = "";
  private watchdog: unknown = null;
  private voice: VoiceLike | null = null;

  constructor(
    private readonly deps: VoiceDeps,
    options: Pick<VoiceOptions, "maxChars" | "halfDuplex" | "listenLang"> & Partial<VoiceOptions>,
    private readonly cb: VoiceCallbacks,
  ) {
    this.opts = { ...DEFAULT_VOICE_OPTIONS, ...options };
    this.onDevice = this.opts.onDevice;
    this.now = deps.now ?? (() => Date.now());
    this.setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  get state(): VoicePhase {
    return this.phase;
  }

  // -------------------------------------------------------------------------
  // What the room calls
  // -------------------------------------------------------------------------

  /**
   * Switches voice mode on. Call it from a click, so the browser can ask for the microphone
   * and allow speech. `prefix` is any text already in the box; `readAloud` (optional) is the
   * interviewer's latest message, read out before listening.
   */
  start({ prefix = "", readAloud = "" }: { prefix?: string; readAloud?: string } = {}): void {
    if (this.phase !== "off") return;
    this.fatal = false;
    this.starts = [];
    this.serviceErrors = [];
    this.carried = prefix.trim();
    this.answer = this.carried;
    this.muted = false;
    this.speechEndedAt = -Infinity;
    this.safe(() => this.deps.synth.cancel()); // clear anything a previous page left queued
    // Asking for the microphone here, inside the click, is what lets the browser show its prompt.
    this.setPhase("thinking");
    this.ensureRec();
    if (readAloud.trim() && !this.opts.halfDuplex) {
      this.beginReply();
      this.replyDelta(readAloud);
      this.replyEnded();
      return;
    }
    this.unlockSpeech();
    this.toListening();
  }

  /** Switches everything off: no microphone, no speech, no timers. */
  stop(): void {
    if (this.phase === "off") return;
    this.clearSilence();
    this.cancelSpeech();
    this.halt();
    this.replyOpen = false;
    this.muted = false;
    this.keptPending = false;
    this.setHeld(false);
    this.setPhase("off");
  }

  /**
   * Stops listening so the student can edit the words in the box. Also used when the tab is
   * hidden, so the microphone is never left on in the background.
   */
  pause(): void {
    if (this.phase !== "listening" && this.phase !== "speaking" && this.phase !== "thinking") return;
    if (this.phase !== "listening") {
      this.muted = true;
      this.cancelSpeech();
    }
    this.clearSilence();
    this.carried = this.answer;
    this.keptPending = false;
    this.setHeld(false);
    this.halt();
    this.setPhase("paused");
  }

  /** Starts listening again; new words are added after `prefix` (the box as it is now). */
  resume(prefix: string): void {
    if (this.phase !== "paused") return;
    // The student chose to listen again, so earlier quick restarts (pausing and resuming
    // a few times while editing) must not count as the browser failing to listen.
    this.starts = [];
    this.carried = prefix.trim();
    this.answer = this.carried;
    this.speakFrom = this.segs.length;
    this.toListening(this.segs.length);
  }

  /** The student typed in the box: stop listening (and talking) so their typing is not overwritten. */
  userTyped(): void {
    if (this.phase === "listening" || this.phase === "speaking") this.pause();
  }

  /** The "Stop speaking" button: skip the rest of the reply and listen. */
  stopSpeaking(): void {
    if (this.phase !== "speaking") return;
    this.tailText = this.replySpoken();
    this.muted = true;
    this.cancelSpeech();
    this.speechEndedAt = this.now();
    this.toListening();
  }

  /** A turn has been sent (by voice, Send, or a button such as "Ask for data"). */
  turnStarted(): void {
    if (this.phase === "off") return;
    this.clearSilence();
    this.cancelSpeech();
    this.carried = "";
    this.answer = "";
    this.keptPending = false;
    this.setHeld(false);
    this.speakFrom = this.segs.length;
    this.beginReply();
    this.setPhase("thinking");
    if (this.opts.halfDuplex) this.halt();
    else this.ensureRec();
  }

  /** A piece of the interviewer's reply has arrived. */
  replyDelta(text: string): void {
    if ((this.phase !== "thinking" && this.phase !== "speaking") || this.muted) return;
    for (const sentence of this.splitter.push(text)) this.enqueue(sentence);
  }

  /** The whole reply has arrived. */
  replyEnded(): void {
    if (this.phase !== "thinking" && this.phase !== "speaking") return;
    this.replyOpen = false;
    if (!this.muted) for (const sentence of this.splitter.flush()) this.enqueue(sentence);
    if (!this.current && this.queue.length === 0) this.speechDone();
  }

  /** The turn failed (the room shows the error and puts the answer back in the box). */
  turnFailed(): void {
    if (this.phase === "off") return;
    this.clearSilence();
    this.cancelSpeech();
    this.replyOpen = false;
    this.halt();
    this.setPhase("paused");
  }

  // -------------------------------------------------------------------------
  // Listening
  // -------------------------------------------------------------------------

  private toListening(from?: number): void {
    this.clearSilence();
    this.keepThinkingWords(); // a reply that never spoke still ends the thinking phase
    this.listenFrom = from ?? this.trailingStart();
    this.muted = false;
    this.setPhase("listening");
    this.ensureRec();
    this.update();
  }

  /** Where a new answer starts: after every finished piece, keeping one still being heard. */
  private trailingStart(): number {
    let i = this.segs.length;
    while (i > this.speakFrom && !this.segs[i - 1].isFinal) i--;
    return i;
  }

  /**
   * What the student said while the interviewer was thinking (after their answer was sent,
   * before the reply began) is the start of their next answer, not noise: they may have
   * finished a sum out loud just after the pause that sent the first half. The finished
   * pieces move into `carried` and show in the box; a piece still being spoken stays where
   * it is, so it can interrupt the reply or join the answer as it grows. Pieces heard while
   * the interviewer speaks are left to the echo and interruption checks.
   */
  private keepThinkingWords(): void {
    if (this.thinkKept) return;
    this.thinkKept = true;
    let end = this.segs.length;
    while (end > this.speakFrom && !this.segs[end - 1].isFinal) end--;
    const kept = dedupeCumulative(this.segs.slice(this.speakFrom, end).map((s) => s.text).filter((t) => t.trim()));
    this.speakFrom = end;
    if (kept.length === 0) return;
    const { text } = clipToLimit(joinText(this.carried, ...kept), this.opts.maxChars);
    this.carried = text;
    this.keptPending = true;
    if (text !== this.answer) {
      this.answer = text;
      this.cb.onTranscript(text, false);
    }
  }

  private ensureRec(): void {
    if (this.phase === "off" || this.fatal) return;
    this.wantRec = true;
    if (this.recState === "idle" && this.restartTimer === null) this.startRec();
  }

  private halt(): void {
    this.wantRec = false;
    this.clearRestart();
    if (this.rec && (this.recState === "starting" || this.recState === "running")) {
      this.recState = "stopping";
      this.safe(() => this.rec?.abort(), () => (this.recState = "idle"));
    }
  }

  private startRec(): void {
    if (!this.rec) {
      const rec = this.deps.createRecognition();
      rec.lang = this.opts.listenLang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      if (this.onDevice) rec.processLocally = true;
      rec.onstart = () => {
        if (this.recState === "starting") this.recState = "running";
      };
      rec.onresult = (event) => this.onResult(event);
      rec.onerror = (event) => this.onRecError(event?.error ?? "");
      rec.onend = () => this.onRecEnd();
      this.rec = rec;
    }
    // A browser that ends listening straight away, again and again, is not going to work.
    const t = this.now();
    this.starts = this.starts.filter((s) => t - s < 10_000);
    if (this.starts.length >= MAX_STARTS_WITHOUT_RESULT) {
      this.giveUp("stopped");
      return;
    }
    this.starts.push(t);
    this.resetSession();
    this.recState = "starting";
    const rec = this.rec;
    this.safe(
      () => rec.start(),
      () => {
        this.recState = "idle";
        this.scheduleRestart();
      },
    );
  }

  private resetSession(): void {
    this.segs = [];
    this.firstSeen = [];
    this.speakFrom = 0;
    this.listenFrom = 0;
  }

  private scheduleRestart(): void {
    if (this.restartTimer !== null) return;
    this.restartTimer = this.setTimer(() => {
      this.restartTimer = null;
      if (this.phase !== "off" && this.wantRec && !this.fatal && this.recState === "idle") this.startRec();
    }, RESTART_DELAY_MS);
  }

  private clearRestart(): void {
    if (this.restartTimer !== null) this.clearTimer(this.restartTimer);
    this.restartTimer = null;
  }

  private onResult(event: RecognitionEventLike): void {
    if (this.phase === "off" || this.recState === "stopping") return;
    this.recState = "running";
    this.starts = [];
    const list = readResults(event.results);
    const t = this.now();
    this.firstSeen = this.firstSeen.slice(0, list.length);
    while (this.firstSeen.length < list.length) this.firstSeen.push(t);
    this.segs = list;
    if (this.phase === "speaking") this.checkBargeIn(event.resultIndex ?? 0);
    else if (this.phase === "listening") this.update();
    // Thinking: kept for the next answer when the reply begins (keepThinkingWords). Paused: not part of an answer.
  }

  private onRecError(code: string): void {
    if (this.phase === "off") return;
    if (code === "no-speech" || code === "aborted") return; // normal: listening restarts by itself
    if (code === "not-allowed") return this.giveUp("blocked");
    // The microphone may be fine: the device's own speech recognition (for example Dictation
    // or Siri on Apple devices) is switched off or not allowed.
    if (code === "service-not-allowed") return this.giveUp("speech-off");
    if (code === "audio-capture") return this.giveUp("no-microphone");
    if (code === "language-not-supported") {
      // On-device listening turned out not to be ready: use the browser's usual service instead.
      if (this.onDevice && this.rec) {
        this.onDevice = false;
        this.rec.processLocally = false;
        return;
      }
      return this.giveUp("language");
    }
    // "network" and anything unexpected: the browser's speech service did not answer.
    const t = this.now();
    this.serviceErrors = [...this.serviceErrors.filter((s) => t - s < 30_000), t];
    if (this.serviceErrors.length >= MAX_SERVICE_ERRORS) this.giveUp("network");
  }

  private onRecEnd(): void {
    // Browsers end listening on their own (after a silence, a minute, or a hiccup; Safari
    // on iPhone does it often). Keep what was heard and listen again while voice mode is on.
    if (this.phase === "listening") this.carried = this.answer;
    this.recState = "idle";
    this.resetSession();
    if (this.phase !== "off" && this.wantRec && !this.fatal) this.scheduleRestart();
  }

  private giveUp(problem: VoiceProblem): void {
    this.fatal = true;
    this.stop();
    this.cb.onProblem(problem);
  }

  /** The answer: what was carried over plus what has been heard since it started. */
  private computeAnswer(): { text: string; heard: boolean; lastFinal: boolean } {
    const parts: string[] = [];
    let lastFinal = true;
    for (let i = this.listenFrom; i < this.segs.length; i++) {
      const seg = this.segs[i];
      let text = seg.text;
      // The microphone may still be catching the interviewer's voice: for a piece that began
      // while it was talking, or a moment after. A piece that began later is the student's,
      // even if it repeats the question ("yes, only in the UK"). On iPhone, iPad and other
      // phones the microphone is off while the interviewer speaks, so there is no echo.
      const began = this.firstSeen[i] <= this.speechEndedAt;
      const echoable = !this.opts.halfDuplex && this.firstSeen[i] <= this.speechEndedAt + this.opts.echoTailMs;
      if (echoable) {
        if (isMostlyEcho(text, this.tailText)) continue;
        if (began && parts.length === 0) text = stripEchoPrefix(text, this.tailText, ECHO_PREFIX_MIN_RUN);
      }
      if (!text.trim()) continue;
      parts.push(text);
      lastFinal = seg.isFinal;
    }
    return { text: joinText(this.carried, ...dedupeCumulative(parts)), heard: parts.length > 0, lastFinal };
  }

  private update(): void {
    const { text, heard, lastFinal } = this.computeAnswer();
    const { text: shown, clipped } = clipToLimit(text, this.opts.maxChars);
    if (shown !== this.answer) {
      this.answer = shown;
      this.setHeld(false); // new words: the note about the last ones no longer applies
      this.cb.onTranscript(shown, clipped);
    }
    if (heard) this.keptPending = false;
    if (heard || this.keptPending) this.armSilence(heard ? lastFinal : true);
  }

  private armSilence(lastFinal: boolean): void {
    this.clearSilence();
    this.silenceTimer = this.setTimer(() => this.silenceElapsed(), silenceDelay(this.answer, lastFinal, this.opts.timing));
  }

  private clearSilence(): void {
    if (this.silenceTimer !== null) this.clearTimer(this.silenceTimer);
    this.silenceTimer = null;
  }

  private silenceElapsed(): void {
    this.silenceTimer = null;
    if (this.phase !== "listening") return;
    const text = this.answer.trim();
    // Some things are never sent on their own, because they would use up one of the
    // interview's turns and make the interviewer talk while the student is still working:
    // a lone letter (a lone digit is fine), "um" and "hmm", an opener or a request for time
    // ("okay so", "let me think about that", "give me a moment"), and a nod ("I see").
    // The words stay in the box and the next words join them.
    const tooShort = text.length < this.opts.timing.minAnswerChars && !/\d/.test(text);
    if (tooShort || isFillerOnly(text) || isStallOnly(text) || isAcknowledgementOnly(text)) return this.setHeld(true);
    const result = this.cb.onSubmit(text);
    if (this.phase !== "listening") return; // the room started the turn
    if (result === "sent") this.turnStarted();
    else if (result === "busy") this.silenceTimer = this.setTimer(() => this.silenceElapsed(), BUSY_RETRY_MS);
    else this.pause(); // keep the words in the box
  }

  private setHeld(held: boolean): void {
    if (held === this.held) return;
    this.held = held;
    this.cb.onHeld?.(held);
  }

  private checkBargeIn(changedFrom: number): void {
    if (this.opts.halfDuplex) return;
    const from = Math.max(changedFrom, this.speakFrom);
    if (from >= this.segs.length) return;
    // The last few words heard, whatever shape the browser reports them in: one piece that
    // keeps growing (Chrome on a computer) or pieces that each repeat the earlier words
    // (Chrome on Android). Only these are compared with what was said just now, so the
    // interviewer's own earlier sentences never look like new words from the student.
    const pieces = dedupeCumulative(this.segs.slice(this.speakFrom).map((s) => s.text).filter((t) => t.trim()));
    const recent = (pieces.at(-1) ?? "").trim().split(/\s+/).slice(-BARGE_WINDOW_WORDS).join(" ");
    if (bargeInDecision(recent, this.recentlySpoken()) !== "barge-in") return;
    this.tailText = this.replySpoken();
    this.muted = true;
    this.cancelSpeech();
    this.speechEndedAt = this.now();
    this.toListening(from);
  }

  // -------------------------------------------------------------------------
  // Speaking
  // -------------------------------------------------------------------------

  private beginReply(): void {
    this.splitter = new SentenceSplitter();
    this.replyOpen = true;
    this.muted = false;
    this.replySentences = [];
    this.thinkKept = false;
  }

  private enqueue(sentence: string): void {
    const text = cleanForSpeech(sentence);
    if (!/[\p{L}\p{N}]/u.test(text)) return;
    this.queue.push(text);
    if (!this.current) this.speakNext();
  }

  private speakNext(): void {
    this.clearWatchdog();
    const text = this.queue.shift();
    if (text === undefined) {
      this.current = null;
      if (!this.replyOpen) this.speechDone();
      return;
    }
    if (this.phase !== "speaking") {
      this.keepThinkingWords();
      this.setPhase("speaking");
      if (this.opts.halfDuplex) this.halt();
    }
    this.replySentences.push(text);
    const gen = this.speechGen;
    const u = this.deps.createUtterance(text);
    u.lang = this.opts.speakLang;
    u.rate = this.opts.rate;
    const voice = this.chooseVoice();
    if (voice) u.voice = voice;
    const done = () => {
      if (gen !== this.speechGen || this.current !== u) return;
      this.current = null;
      this.speakNext();
    };
    u.onend = done;
    u.onerror = done;
    this.current = u;
    this.armWatchdog(u, gen, done);
    this.safe(() => {
      this.deps.synth.resume?.(); // Chrome can be left paused, which would block the queue
      this.deps.synth.speak(u);
    }, done);
  }

  /** Some browsers occasionally never report the end of a sentence; do not wait forever. */
  private armWatchdog(u: UtteranceLike, gen: number, done: () => void, rearms = 0): void {
    const expected = Math.round((u.text.length * 85) / Math.max(0.5, u.rate)) + 4000;
    this.watchdog = this.setTimer(() => {
      this.watchdog = null;
      if (gen !== this.speechGen || this.current !== u) return;
      if (this.deps.synth.speaking && rearms < 1) {
        this.armWatchdog(u, gen, done, rearms + 1);
        return;
      }
      // Stuck: clear the browser's speech queue too, or the next sentence would wait behind it.
      this.safe(() => this.deps.synth.cancel());
      done();
    }, expected);
  }

  private clearWatchdog(): void {
    if (this.watchdog !== null) this.clearTimer(this.watchdog);
    this.watchdog = null;
  }

  private chooseVoice(): VoiceLike | null {
    if (!this.voice) {
      let voices: VoiceLike[] = [];
      this.safe(() => (voices = this.deps.synth.getVoices()));
      this.voice = pickVoice(voices, this.opts.speakLang);
    }
    return this.voice;
  }

  /** Everything of the current reply that has started playing (the voice's echo can be any of it). */
  private replySpoken(): string {
    return joinText(...this.replySentences);
  }

  /**
   * What the interviewer has said very recently: the sentence being read and enough of the
   * ones before it to cover the last few words heard (the microphone lags a little). Not the
   * whole reply: a long reply holds so many everyday words that a student's interruption
   * would look like echo.
   */
  private recentlySpoken(): string {
    let count = 0;
    let i = this.replySentences.length;
    while (i > 0 && (this.replySentences.length - i < 2 || count < BARGE_REFERENCE_WORDS)) {
      i--;
      count += words(this.replySentences[i]).length;
    }
    return joinText(...this.replySentences.slice(i));
  }

  private speechDone(): void {
    this.speechEndedAt = this.now();
    this.tailText = this.replySpoken();
    this.toListening();
  }

  private cancelSpeech(): void {
    this.speechGen++;
    this.queue = [];
    this.current = null;
    this.clearWatchdog();
    this.safe(() => this.deps.synth.cancel());
  }

  /** iPhone and iPad only allow speech after a tap; a silent sentence during the tap unlocks it. */
  private unlockSpeech(): void {
    this.safe(() => {
      const u = this.deps.createUtterance(" ");
      u.volume = 0;
      this.deps.synth.speak(u);
    });
  }

  // -------------------------------------------------------------------------

  private setPhase(phase: VoicePhase): void {
    if (phase === this.phase) return;
    this.phase = phase;
    this.cb.onPhase(phase);
  }

  private safe(fn: () => void, onError?: () => void): void {
    try {
      fn();
    } catch {
      onError?.();
    }
  }
}
