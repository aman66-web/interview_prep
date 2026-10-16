import type { RecognitionEventLike, RecognitionLike, SynthLike, UtteranceLike } from "@/lib/voice/controller";
import type { VoiceLike } from "@/lib/voice/support";

// Pretend versions of the browser's SpeechRecognition and speechSynthesis, for driving
// lib/voice/controller.ts in tests without a browser or a microphone.

type Seg = { text: string; isFinal: boolean };

export class FakeRecognition implements RecognitionLike {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  processLocally?: boolean;
  onstart: (() => void) | null = null;
  onresult: ((event: RecognitionEventLike) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  running = false;
  starts = 0;
  aborts = 0;
  private segs: Seg[] = [];

  start(): void {
    if (this.running) throw new Error("InvalidStateError: already started");
    this.running = true;
    this.starts++;
    this.segs = [];
    this.onstart?.();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onend?.();
  }

  abort(): void {
    if (!this.running) return;
    this.aborts++;
    this.running = false;
    this.onerror?.({ error: "aborted" });
    this.onend?.();
  }

  /** The browser hears words: they update the piece still being heard, or start a new one. */
  hear(text: string, isFinal = false): void {
    if (!this.running) throw new Error("not listening");
    const last = this.segs.at(-1);
    let index: number;
    if (last && !last.isFinal) {
      last.text = text;
      last.isFinal = isFinal;
      index = this.segs.length - 1;
    } else {
      this.segs.push({ text, isFinal });
      index = this.segs.length - 1;
    }
    this.emit(index);
  }

  /** The browser ends listening on its own (as Safari and Chrome do after a while). */
  endByItself(): void {
    if (!this.running) return;
    this.running = false;
    this.onend?.();
  }

  /** The browser reports an error, then ends. */
  fail(code: string): void {
    this.onerror?.({ error: code });
    this.endByItself();
  }

  private emit(resultIndex: number): void {
    const results = this.segs.map((s) => ({ isFinal: s.isFinal, length: 1, 0: { transcript: s.text } }));
    this.onresult?.({ resultIndex, results });
  }
}

export class FakeUtterance implements UtteranceLike {
  lang = "";
  rate = 1;
  volume = 1;
  voice: VoiceLike | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

export class FakeSynth implements SynthLike {
  speaking = false;
  /** Every sentence that started playing, in order (silent ones left out). */
  spoken: string[] = [];
  utterances: FakeUtterance[] = [];
  cancels = 0;
  voices: VoiceLike[] = [];
  /** Set to make utterances never report their end (a browser bug the controller guards against). */
  neverEnds = false;
  private queue: FakeUtterance[] = [];
  current: FakeUtterance | null = null;

  speak(u: UtteranceLike): void {
    this.queue.push(u as FakeUtterance);
    this.pump();
  }

  cancel(): void {
    this.cancels++;
    const u = this.current;
    this.queue = [];
    this.current = null;
    this.speaking = false;
    u?.onerror?.(); // browsers report "interrupted" or "canceled" for the sentence that was playing
  }

  getVoices(): VoiceLike[] {
    return this.voices;
  }

  /** The sentence that is playing comes to its end. */
  finish(): void {
    const u = this.current;
    if (!u) throw new Error("nothing is being spoken");
    this.current = null;
    this.speaking = false;
    if (!this.neverEnds) u.onend?.();
    this.pump();
  }

  private pump(): void {
    while (!this.current && this.queue.length) {
      const u = this.queue.shift()!;
      this.utterances.push(u);
      if (!u.text.trim() || u.volume === 0) {
        u.onend?.(); // a silent "unlock" sentence ends at once
        continue;
      }
      this.current = u;
      this.speaking = true;
      this.spoken.push(u.text);
    }
  }
}
