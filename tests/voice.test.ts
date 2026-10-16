import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceController, type SubmitResult, type VoiceOptions, type VoicePhase, type VoiceProblem } from "@/lib/voice/controller";
import { bargeInDecision, isMostlyEcho, stripEchoPrefix } from "@/lib/voice/echo";
import { isIOS, isTouchFirst, onDeviceAvailable, pickVoice, recognitionConstructor, recognitionLanguage, voiceSupport } from "@/lib/voice/support";
import {
  cleanForSpeech,
  clipToLimit,
  DEFAULT_TIMING,
  endsMidThought,
  endsOnOperand,
  endsWithHold,
  isAcknowledgementOnly,
  isBareOkay,
  isFillerOnly,
  isStallOnly,
  joinText,
  SentenceSplitter,
  silenceDelay,
  splitLong,
  words,
} from "@/lib/voice/text";
import { dedupeCumulative, readResults } from "@/lib/voice/transcript";
import { FakeRecognition, FakeSynth, FakeUtterance } from "./helpers/fake-speech";

// Voice mode in the interview room (lib/voice/). The browser parts are faked, so these
// check the logic: when a turn ends, when the interviewer is interrupted, that its own
// voice is never sent as an answer, and how browsers' quirks are handled.

describe("voice text helpers", () => {
  it("compares words without case, accents or punctuation", () => {
    expect(words("Cafés, it's £1.5m!")).toEqual(["cafes", "its", "1", "5m"]);
    expect(joinText(" so the ", "", "costs  rose ")).toBe("so the costs rose");
  });

  it("cuts a streamed reply into sentences as soon as each one is complete", () => {
    const s = new SentenceSplitter();
    expect(s.push("Good ques")).toEqual([]);
    expect(s.push("tion. Harbour")).toEqual(["Good question."]);
    expect(s.push("line has 120 cafés across the UK. How would")).toEqual(["Harbourline has 120 cafés across the UK."]);
    expect(s.push(" you structure it?")).toEqual([]); // the end of the reply may still be coming
    expect(s.flush()).toEqual(["How would you structure it?"]);
  });

  it("does not end a sentence inside a number, an abbreviation or an initial", () => {
    const s = new SentenceSplitter();
    expect(s.push("Revenue was £1.")).toEqual([]);
    expect(s.push("5m last year, e.g. from J. Smith's shops. No. 3 is next! Really?")).toEqual([
      "Revenue was £1.5m last year, e.g. from J. Smith's shops.",
      "No. 3 is next!",
    ]);
    expect(s.flush()).toEqual(["Really?"]);
  });

  it("ends a sentence at a line break and after closing quotes, and skips empty pieces", () => {
    const s = new SentenceSplitter();
    expect(s.push('Two things:\n- rent\n- wages\n\nShe said "yes." Then')).toEqual(["Two things:", "- rent", "- wages", 'She said "yes."']);
    expect(s.flush()).toEqual(["Then"]);
    expect(new SentenceSplitter().flush()).toEqual([]);
  });

  it("breaks a very long sentence at a comma so browsers do not cut it off", () => {
    const long = `${"The cafés in the north have seen costs rise for three years in a row".repeat(2)}, and ${"the ones in the south have held prices steady while footfall fell".repeat(2)}.`;
    const parts = splitLong(long, 200);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(200);
    expect(joinText(...parts)).toBe(long);
    expect(splitLong("Short.", 200)).toEqual(["Short."]);
  });

  it("tidies text for speaking", () => {
    expect(cleanForSpeech("**Revenue** fell to £1.2m, e.g. in London; costs were $300k and €2bn.")).toBe(
      "Revenue fell to £1.2 million, for example in London; costs were $300 thousand and €2 billion.",
    );
    expect(cleanForSpeech("- rent\n* wages")).toBe("rent wages");
    expect(cleanForSpeech("i.e. the margin")).toBe("that is the margin");
  });

  it("caps a spoken answer at the same length as a typed one", () => {
    expect(clipToLimit("abcdef", 10)).toEqual({ text: "abcdef", clipped: false });
    expect(clipToLimit("abcdef", 4)).toEqual({ text: "abcd", clipped: true });
  });

  it("waits longer before sending when the answer stops mid-thought", () => {
    expect(silenceDelay("the costs rose", true)).toBe(DEFAULT_TIMING.finalSilenceMs);
    expect(silenceDelay("the costs rose", false)).toBe(DEFAULT_TIMING.interimSilenceMs);
    expect(endsMidThought("so the costs rose and")).toBe(true);
    expect(endsMidThought("it is about 40 percent um")).toBe(true);
    expect(endsMidThought("the costs rose")).toBe(false);
    expect(silenceDelay("the costs rose and", true)).toBe(Math.round(DEFAULT_TIMING.finalSilenceMs * DEFAULT_TIMING.midThoughtFactor));
  });
});

describe("telling the student from the interviewer's echo", () => {
  const spoken = "Harbourline has 120 cafés across the UK. How would you like to structure your approach?";

  it("recognises the interviewer's own words coming back, even split or joined differently", () => {
    expect(isMostlyEcho("harbour line has 120 cafes across the uk", spoken)).toBe(true);
    expect(isMostlyEcho("how would you like to structure", spoken)).toBe(true);
    expect(isMostlyEcho("", spoken)).toBe(true);
    expect(isMostlyEcho("I would start with revenue and costs", spoken)).toBe(false);
  });

  it("interrupts for a stop word or real new words, not for echo, nods or numbers read back", () => {
    expect(bargeInDecision("harbour line has 120 cafes", spoken)).toBe("ignore");
    expect(bargeInDecision("one hundred and twenty cafes", spoken)).toBe("ignore");
    expect(bargeInDecision("okay", spoken)).toBe("ignore");
    expect(bargeInDecision("mm hmm yeah", spoken)).toBe("ignore");
    expect(bargeInDecision("got it", spoken)).toBe("ignore");
    expect(bargeInDecision("wait", spoken)).toBe("barge-in");
    expect(bargeInDecision("sorry", spoken)).toBe("barge-in");
    expect(bargeInDecision("could we look at costs first", spoken)).toBe("barge-in");
    expect(bargeInDecision("", spoken)).toBe("ignore");
  });

  it("does not treat the interviewer's own stop word as an interruption", () => {
    expect(bargeInDecision("sorry I lost my train", "Sorry, I lost my train of thought for a moment.")).toBe("ignore");
  });

  it("removes the interviewer's words from the start of what was heard", () => {
    expect(stripEchoPrefix("across the UK sorry can I ask", spoken)).toBe("sorry can I ask");
    expect(stripEchoPrefix("structure your approach, I think revenue", spoken)).toBe("I think revenue");
    // A short overlap is kept: the student may simply start with the same word.
    expect(stripEchoPrefix("the UK market is small", spoken)).toBe("the UK market is small");
    expect(stripEchoPrefix("the UK market is small", spoken, 4)).toBe("the UK market is small");
    expect(stripEchoPrefix("across the UK", spoken)).toBe("");
  });
});

describe("what the browser supports", () => {
  class Ctor {}
  const synth = { speak() {}, cancel() {} };
  const chrome = { webkitSpeechRecognition: Ctor, speechSynthesis: synth, SpeechSynthesisUtterance: Ctor, isSecureContext: true, navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/141" } };

  it("finds the standard or the webkit-prefixed recognition", () => {
    expect(recognitionConstructor({ SpeechRecognition: Ctor })).toBe(Ctor);
    expect(recognitionConstructor({ webkitSpeechRecognition: Ctor })).toBe(Ctor);
    expect(recognitionConstructor({})).toBeNull();
    expect(recognitionConstructor({ SpeechRecognition: "nope" })).toBeNull();
  });

  it("offers voice only with both listening and speaking, over HTTPS", () => {
    expect(voiceSupport(chrome)).toEqual({ supported: true, halfDuplex: false });
    // Firefox: speaking but no listening.
    expect(voiceSupport({ ...chrome, webkitSpeechRecognition: undefined }).supported).toBe(false);
    expect(voiceSupport({ ...chrome, speechSynthesis: undefined }).supported).toBe(false);
    expect(voiceSupport({ ...chrome, isSecureContext: false }).supported).toBe(false);
  });

  it("turns the microphone off while speaking on iPhone and iPad only", () => {
    const iphone = { ...chrome, navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1", maxTouchPoints: 5 } };
    const ipad = { ...chrome, navigator: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", maxTouchPoints: 5 } };
    const mac = { ...chrome, navigator: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", maxTouchPoints: 0 } };
    expect(voiceSupport(iphone)).toEqual({ supported: true, halfDuplex: true });
    expect(voiceSupport(ipad).halfDuplex).toBe(true);
    expect(voiceSupport(mac).halfDuplex).toBe(false);
    expect(isIOS(undefined)).toBe(false);
  });

  it("uses on-device listening only when the browser says it is ready", async () => {
    const calls: unknown[] = [];
    const make = (answer: string | Error) =>
      Object.assign(class {}, {
        available: async (options: unknown) => {
          calls.push(options);
          if (answer instanceof Error) throw answer;
          return answer;
        },
      });
    expect(await onDeviceAvailable(make("available"), "en-GB")).toBe(true);
    expect(calls[0]).toEqual({ langs: ["en-GB"], processLocally: true });
    expect(await onDeviceAvailable(make("downloadable"), "en-GB")).toBe(false);
    expect(await onDeviceAvailable(make(new Error("not fully active")), "en-GB")).toBe(false);
    expect(await onDeviceAvailable(Ctor, "en-GB")).toBe(false);
    expect(await onDeviceAvailable(null, "en-GB")).toBe(false);
  });

  it("listens in the browser's own English, or British English", () => {
    expect(recognitionLanguage("en-US")).toBe("en-US");
    expect(recognitionLanguage("en_in")).toBe("en-IN");
    expect(recognitionLanguage("en")).toBe("en-GB");
    expect(recognitionLanguage("fr-FR")).toBe("en-GB");
    expect(recognitionLanguage(undefined)).toBe("en-GB");
  });

  it("picks a natural British English voice where there is one", () => {
    const chromeVoices = [
      { name: "Google US English", lang: "en-US" },
      { name: "Microsoft Hazel - English (United Kingdom)", lang: "en-GB", localService: true },
      { name: "Google UK English Female", lang: "en-GB" },
      { name: "Google Deutsch", lang: "de-DE" },
    ];
    expect(pickVoice(chromeVoices)?.name).toBe("Google UK English Female");
    const edgeVoices = [
      { name: "Microsoft George - English (United Kingdom)", lang: "en-GB" },
      { name: "Microsoft Sonia Online (Natural) - English (United Kingdom)", lang: "en-GB" },
    ];
    expect(pickVoice(edgeVoices)?.name).toContain("Sonia");
    const appleVoices = [
      { name: "Bubbles", lang: "en-GB" },
      { name: "Samantha", lang: "en-US" },
      { name: "Daniel", lang: "en_GB" },
    ];
    expect(pickVoice(appleVoices)?.name).toBe("Daniel");
    expect(pickVoice([{ name: "Samantha", lang: "en-US" }])?.name).toBe("Samantha");
    expect(pickVoice([{ name: "Amélie", lang: "fr-CA" }])).toBeNull();
    expect(pickVoice([])).toBeNull();
  });
});

describe("reading recognition results", () => {
  it("reads the browser's result list", () => {
    const results = { length: 2, 0: { isFinal: true, 0: { transcript: " so the " } }, 1: { isFinal: false, 0: { transcript: "costs" } } };
    expect(readResults(results)).toEqual([
      { text: "so the", isFinal: true },
      { text: "costs", isFinal: false },
    ]);
  });

  it("keeps only the longest of results that repeat the earlier words (Android)", () => {
    expect(dedupeCumulative(["so the", "so the costs", "so the costs rose"])).toEqual(["so the costs rose"]);
    expect(dedupeCumulative(["so the costs", "rose by 10%"])).toEqual(["so the costs", "rose by 10%"]);
    expect(dedupeCumulative(["the", "there is more"])).toEqual(["the", "there is more"]);
  });
});

// ---------------------------------------------------------------------------
// The controller, driven with a pretend browser
// ---------------------------------------------------------------------------

type Setup = {
  ctrl: VoiceController;
  rec: () => FakeRecognition;
  synth: FakeSynth;
  phases: VoicePhase[];
  transcripts: { text: string; clipped: boolean }[];
  submits: string[];
  problems: VoiceProblem[];
  lastTranscript: () => string;
  submitResults: SubmitResult[];
  held: boolean[];
};

function setup(options: Partial<VoiceOptions> = {}): Setup {
  const synth = new FakeSynth();
  const recs: FakeRecognition[] = [];
  const phases: VoicePhase[] = [];
  const transcripts: { text: string; clipped: boolean }[] = [];
  const submits: string[] = [];
  const problems: VoiceProblem[] = [];
  const submitResults: SubmitResult[] = [];
  const held: boolean[] = [];
  const ctrl: VoiceController = new VoiceController(
    {
      createRecognition: () => {
        const r = new FakeRecognition();
        recs.push(r);
        return r;
      },
      synth,
      createUtterance: (text) => new FakeUtterance(text),
    },
    { maxChars: 2000, halfDuplex: false, listenLang: "en-GB", ...options },
    {
      onPhase: (p) => phases.push(p),
      onTranscript: (text, clipped) => transcripts.push({ text, clipped }),
      onSubmit: (text) => {
        submits.push(text);
        const result = submitResults.shift() ?? "sent";
        // Like the room: sending starts the turn.
        if (result === "sent") ctrl.turnStarted();
        return result;
      },
      onProblem: (p) => problems.push(p),
      onHeld: (h) => held.push(h),
    },
  );
  return {
    ctrl,
    rec: () => {
      expect(recs.length).toBe(1); // one recognition object, started again as needed
      return recs[0];
    },
    synth,
    phases,
    transcripts,
    submits,
    problems,
    lastTranscript: () => transcripts.at(-1)?.text ?? "",
    submitResults,
    held,
  };
}

describe("voice mode turn-taking", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts listening continuously, in English, with live words", () => {
    const s = setup();
    s.ctrl.start();
    const rec = s.rec();
    expect(s.ctrl.state).toBe("listening");
    expect(rec.running).toBe(true);
    expect(rec.continuous).toBe(true);
    expect(rec.interimResults).toBe(true);
    expect(rec.lang).toBe("en-GB");
    // A silent sentence during the click lets iPhones speak later.
    expect(s.synth.utterances[0]).toMatchObject({ volume: 0 });
    expect(s.synth.spoken).toEqual([]);
  });

  it("shows the words as they are heard and sends them after a short silence", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("so the");
    expect(s.lastTranscript()).toBe("so the");
    s.rec().hear("so the costs went up", true);
    expect(s.lastTranscript()).toBe("so the costs went up");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs - 1);
    expect(s.submits).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(s.submits).toEqual(["so the costs went up"]);
    expect(s.ctrl.state).toBe("thinking");
  });

  it("keeps waiting while the student keeps talking", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("revenue is flat", true);
    vi.advanceTimersByTime(1000);
    s.rec().hear("but costs are up", true);
    vi.advanceTimersByTime(1000);
    expect(s.submits).toEqual([]);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs - 1000);
    expect(s.submits).toEqual(["revenue is flat but costs are up"]);
  });

  it("sends provisional words too if the browser never finalises them, after a longer wait", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("I would split it into revenue and cost drivers");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual([]);
    vi.advanceTimersByTime(DEFAULT_TIMING.interimSilenceMs - DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["I would split it into revenue and cost drivers"]);
  });

  it("waits longer when the student stops mid-sentence", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("the margin fell because", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual([]);
    vi.advanceTimersByTime(silenceDelay("the margin fell because", true) - DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["the margin fell because"]);
  });

  it("caps a long spoken answer at the room's limit", () => {
    const s = setup({ maxChars: 20 });
    s.ctrl.start();
    s.rec().hear("this answer is far too long for the box", true);
    expect(s.transcripts.at(-1)).toEqual({ text: "this answer is far t", clipped: true });
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["this answer is far t"]);
  });

  it("reads the reply aloud from its first full sentence, then listens again", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    expect(s.ctrl.state).toBe("thinking");
    s.ctrl.replyDelta("Good question. Harbour");
    expect(s.ctrl.state).toBe("speaking");
    expect(s.synth.spoken).toEqual(["Good question."]);
    s.ctrl.replyDelta("line has 120 cafés. What next?");
    s.ctrl.replyEnded();
    s.synth.finish();
    expect(s.synth.spoken).toEqual(["Good question.", "Harbourline has 120 cafés."]);
    s.synth.finish();
    s.synth.finish();
    expect(s.synth.spoken.at(-1)).toBe("What next?");
    expect(s.ctrl.state).toBe("listening");
    // The microphone stayed on the whole time (it is needed to hear an interruption).
    expect(s.rec().starts).toBe(1);
  });

  it("uses a British English voice at a normal rate", () => {
    const s = setup();
    s.synth.voices = [
      { name: "Google US English", lang: "en-US" },
      { name: "Google UK English Male", lang: "en-GB" },
    ];
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Hello there. ");
    const u = s.synth.current!;
    expect(u.voice?.name).toBe("Google UK English Male");
    expect(u.lang).toBe("en-GB");
    expect(u.rate).toBe(1);
  });

  it("listens straight away when the reply has nothing to read", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyEnded();
    expect(s.ctrl.state).toBe("listening");
  });

  it("stops speaking at once when the student talks over the interviewer (barge-in)", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Harbourline has 120 cafés across the UK. Profit fell by a fifth last year. ");
    expect(s.synth.spoken).toEqual(["Harbourline has 120 cafés across the UK."]);
    const cancelsBefore = s.synth.cancels;
    s.rec().hear("sorry can I ask about rent");
    expect(s.synth.cancels).toBe(cancelsBefore + 1);
    expect(s.synth.current).toBeNull();
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("sorry can I ask about rent");
    // The rest of the reply is still shown on screen by the room, but not read out.
    s.ctrl.replyDelta("What would you look at first?");
    s.ctrl.replyEnded();
    expect(s.synth.spoken).toEqual(["Harbourline has 120 cafés across the UK."]);
    s.rec().hear("sorry can I ask about rent costs", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["sorry can I ask about rent costs"]);
  });

  it("keeps the student's words but not the interviewer's when the browser joins them", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Harbourline has 120 cafés across the UK. ");
    s.rec().hear("cafes across the UK could we look at costs");
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("could we look at costs");
  });

  it("does not listen to itself: its own voice is never sent as an answer", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Harbourline has 120 cafés across the UK. ");
    s.rec().hear("harbour line has 120");
    s.rec().hear("harbour line has 120 cafes across the UK", true);
    expect(s.ctrl.state).toBe("speaking");
    s.ctrl.replyEnded();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    // A late piece of echo, just after the voice stopped.
    s.rec().hear("across the UK", true);
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual([]);
    expect(s.lastTranscript()).toBe("");
    // The student's own answer is heard normally.
    s.rec().hear("I would start with costs", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["I would start with costs"]);
  });

  it("keeps a nod or an 'okay' while listening to the interviewer out of the answer", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Harbourline has 120 cafés across the UK. ");
    s.rec().hear("okay", true);
    expect(s.ctrl.state).toBe("speaking");
    s.ctrl.replyEnded();
    s.synth.finish();
    s.rec().hear("so first the revenue", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["so first the revenue"]);
  });

  it("keeps what the student says while the interviewer is thinking as the start of the next answer", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("fifteen percent of eight million", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["fifteen percent of eight million"]);
    expect(s.ctrl.state).toBe("thinking");
    // The reply takes a few seconds to start: the student finishes the sum meanwhile.
    s.rec().hear("one point two million", true);
    expect(s.lastTranscript()).not.toBe("one point two million"); // not shown while still waiting
    s.ctrl.replyDelta("Go on. What does that tell you? ");
    expect(s.ctrl.state).toBe("speaking");
    expect(s.lastTranscript()).toBe("one point two million");
    s.ctrl.replyEnded();
    s.synth.finish();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("one point two million");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["fifteen percent of eight million", "one point two million"]);
  });

  it("keeps what was said while thinking even when the reply has nothing to read", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("my answer", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    s.rec().hear("and one more thing", true);
    s.ctrl.replyEnded();
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("and one more thing");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["my answer", "and one more thing"]);
  });

  it("lets a student who keeps talking through the thinking pause interrupt the reply", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("revenue is two hundred", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    s.rec().hear("and costs are", false); // still being said when the reply starts
    s.ctrl.replyDelta("Thanks. Harbourline has 120 cafés. ");
    expect(s.ctrl.state).toBe("speaking");
    const cancels = s.synth.cancels;
    s.rec().hear("and costs are around one hundred and fifty thousand pounds a month", false);
    expect(s.synth.cancels).toBe(cancels + 1);
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("and costs are around one hundred and fifty thousand pounds a month");
  });

  it("reads the interviewer's latest message aloud when switched on, if asked", () => {
    const s = setup();
    s.ctrl.start({ readAloud: "Here is the case. A bakery chain has seen profit fall." });
    expect(s.ctrl.state).toBe("speaking");
    expect(s.synth.spoken).toEqual(["Here is the case."]);
    expect(s.rec().running).toBe(true); // listening for an interruption from the start
    s.synth.finish();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
  });

  it("keeps words already in the box when switched on", () => {
    const s = setup();
    s.ctrl.start({ prefix: "I typed this" });
    s.rec().hear("and said this", true);
    expect(s.lastTranscript()).toBe("I typed this and said this");
  });

  it("'Stop speaking' skips the rest of the reply and listens", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("One. Two. Three. ");
    s.ctrl.stopSpeaking();
    expect(s.ctrl.state).toBe("listening");
    expect(s.synth.spoken).toEqual(["One."]);
  });

  it("gives up waiting for an utterance whose end the browser never reports", () => {
    const s = setup();
    s.synth.neverEnds = true;
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("First sentence. Second sentence. ");
    s.ctrl.replyEnded();
    s.synth.finish(); // the audio ends but no "end" event comes
    expect(s.synth.spoken).toEqual(["First sentence."]);
    vi.advanceTimersByTime(10_000);
    expect(s.synth.spoken).toEqual(["First sentence.", "Second sentence."]);
  });
});

describe("voice mode on phones and in awkward browsers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("on iPhone, turns the microphone off while speaking and back on afterwards", () => {
    const s = setup({ halfDuplex: true });
    s.ctrl.start({ readAloud: "This is not read on iPhone at the start." });
    expect(s.ctrl.state).toBe("listening");
    s.rec().hear("my answer", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.rec().running).toBe(false);
    s.ctrl.replyDelta("Thanks. Next question? ");
    expect(s.ctrl.state).toBe("speaking");
    expect(s.rec().running).toBe(false);
    s.ctrl.replyEnded();
    s.synth.finish();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    expect(s.rec().running).toBe(true);
    expect(s.rec().starts).toBe(2);
  });

  it("starts listening again when the browser stops on its own, keeping the words so far", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("first part", true);
    s.rec().endByItself();
    expect(s.rec().running).toBe(false);
    vi.advanceTimersByTime(300);
    expect(s.rec().running).toBe(true);
    s.rec().hear("second part", true);
    expect(s.lastTranscript()).toBe("first part second part");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["first part second part"]);
  });

  it("keeps listening after a quiet spell ('no-speech')", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().fail("no-speech");
    vi.advanceTimersByTime(300);
    expect(s.rec().running).toBe(true);
    expect(s.problems).toEqual([]);
  });

  it("switches off with a clear reason when the microphone is blocked", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().fail("not-allowed");
    expect(s.problems).toEqual(["blocked"]);
    expect(s.ctrl.state).toBe("off");
    vi.advanceTimersByTime(5000);
    expect(s.rec().running).toBe(false);
  });

  it("switches off when the browser's speech service keeps failing (for example Brave)", () => {
    const s = setup();
    s.ctrl.start();
    for (let i = 0; i < 3; i++) {
      s.rec().fail("network");
      vi.advanceTimersByTime(300);
    }
    expect(s.problems).toEqual(["network"]);
    expect(s.ctrl.state).toBe("off");
  });

  it("switches off instead of restarting forever when listening keeps ending at once", () => {
    const s = setup();
    s.ctrl.start();
    for (let i = 0; i < 10; i++) {
      s.rec().endByItself();
      vi.advanceTimersByTime(300);
    }
    expect(s.problems).toEqual(["stopped"]);
    expect(s.ctrl.state).toBe("off");
  });

  it("listens on the device when the browser can, and falls back to its usual service if not", () => {
    const s = setup({ onDevice: true });
    s.ctrl.start();
    expect(s.rec().processLocally).toBe(true);
    s.rec().fail("language-not-supported");
    expect(s.problems).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(s.rec().running).toBe(true);
    expect(s.rec().processLocally).toBe(false);
    s.rec().fail("language-not-supported");
    expect(s.problems).toEqual(["language"]);

    const t = setup();
    t.ctrl.start();
    expect(t.rec().processLocally).toBeUndefined();
  });

  it("switches off when there is no microphone", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().fail("audio-capture");
    expect(s.problems).toEqual(["no-microphone"]);
  });
});

describe("voice mode and the room", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("pauses so the student can edit, then adds new words after the edited text", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("revenue fell by ten", true);
    s.ctrl.pause();
    expect(s.ctrl.state).toBe("paused");
    expect(s.rec().running).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual([]);
    s.ctrl.resume("Revenue fell by 10%");
    expect(s.ctrl.state).toBe("listening");
    vi.advanceTimersByTime(300);
    s.rec().hear("mostly in the north", true);
    expect(s.lastTranscript()).toBe("Revenue fell by 10% mostly in the north");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["Revenue fell by 10% mostly in the north"]);
  });

  it("pauses when the student starts typing, so their typing is not overwritten", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("abc", true);
    s.ctrl.userTyped();
    expect(s.ctrl.state).toBe("paused");
  });

  it("keeps the words and pauses if the turn fails", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Half a sentence. ");
    s.ctrl.turnFailed();
    expect(s.ctrl.state).toBe("paused");
    expect(s.synth.current).toBeNull();
  });

  it("tries again shortly if the room is still busy, and pauses if it cannot send at all", () => {
    const s = setup();
    s.submitResults.push("busy");
    s.ctrl.start();
    s.rec().hear("my answer", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["my answer"]);
    expect(s.ctrl.state).toBe("listening");
    vi.advanceTimersByTime(400);
    expect(s.submits).toEqual(["my answer", "my answer"]);
    expect(s.ctrl.state).toBe("thinking");

    const t = setup();
    t.submitResults.push("refused");
    t.ctrl.start();
    t.rec().hear("too late", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(t.ctrl.state).toBe("paused");
  });

  it("does not send a lone sound", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("a", true);
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual([]);
  });

  it("does not use up a turn on thinking sounds alone, and sends once real words follow", () => {
    expect(isFillerOnly("Um.")).toBe(true);
    expect(isFillerOnly("hmm uh")).toBe(true);
    expect(isFillerOnly("um yes")).toBe(false);
    expect(isFillerOnly("")).toBe(false);
    const s = setup();
    s.ctrl.start();
    s.rec().hear("hmm", true);
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual([]);
    expect(s.ctrl.state).toBe("listening");
    s.rec().hear("I would start with costs", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["hmm I would start with costs"]);
  });

  it("does not give up when the student pauses and resumes several times", () => {
    const s = setup();
    s.ctrl.start();
    for (let i = 0; i < 8; i++) {
      s.ctrl.pause();
      s.ctrl.resume("");
      vi.advanceTimersByTime(300);
    }
    expect(s.problems).toEqual([]);
    expect(s.ctrl.state).toBe("listening");
    expect(s.rec().running).toBe(true);
  });

  it("stops everything when switched off, and ignores anything after", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("Something to say. ");
    s.ctrl.stop();
    expect(s.ctrl.state).toBe("off");
    expect(s.synth.current).toBeNull();
    expect(s.rec().running).toBe(false);
    s.ctrl.replyDelta("More. ");
    s.ctrl.replyEnded();
    vi.advanceTimersByTime(10_000);
    expect(s.rec().running).toBe(false);
    expect(s.synth.spoken).toEqual(["Something to say."]);
    expect(s.phases.at(-1)).toBe("off");
  });
});

// ---------------------------------------------------------------------------
// Review round 2
// ---------------------------------------------------------------------------

describe("nods, openers and requests for time (helpers)", () => {
  it("does not take a nod for an interruption, but still takes real words and stop words", () => {
    const spoken = "Harbourline has 120 cafés across the UK. How would you like to structure your approach?";
    for (const nod of ["i see", "I see.", "that makes sense", "yeah thats fair", "good point", "fair enough", "mm hmm, I see", "understood"]) {
      expect(bargeInDecision(nod, spoken)).toBe("ignore");
    }
    expect(bargeInDecision("i see sorry", spoken)).toBe("barge-in");
    expect(bargeInDecision("I disagree", spoken)).toBe("barge-in");
    expect(bargeInDecision("could we look at costs first", spoken)).toBe("barge-in");
  });

  it("knows an opener or a request for time from an answer", () => {
    for (const stall of [
      "okay so", "Okay so... um", "So", "well", "let me think about that", "Let me think", "So, let me think", "Right, one moment",
      "give me a moment to work this out", "give me a second", "hold on", "hang on a sec", "just a moment please", "bear with me",
      "let's see", "let me work that out", "let me do the maths", "wait", "sorry",
    ]) {
      expect(isStallOnly(stall), stall).toBe(true);
    }
    for (const answer of [
      "okay", "right", "yes", "no", "Profitability", "Sure, go ahead", "okay so revenue is 200 times 5", "Let me think, it is 10 percent",
      "let me think the margin is 12", "I would wait for the second quarter", "one moment of silence is fine", "",
    ]) {
      expect(isStallOnly(answer), answer).toBe(false);
    }
  });

  it("knows a nod from an answer that starts with a nod", () => {
    for (const nod of ["I see", "that makes sense", "yeah that's fair", "okay great", "Thanks, understood", "mm hmm I see"]) {
      expect(isAcknowledgementOnly(nod), nod).toBe(true);
    }
    for (const answer of ["yes", "I see three drivers", "that makes sense because costs are fixed", "yeah only in the UK", "", "okay"]) {
      expect(isAcknowledgementOnly(answer), answer).toBe(false);
    }
  });

  it("spots a request for time at the end of an answer, a sum left half-done, and a bare okay", () => {
    expect(endsWithHold("fixed costs are 1.2 million, give me a moment")).toBe(true);
    expect(endsWithHold("So... let me think about that")).toBe(true);
    expect(endsWithHold("give me a moment to work this out")).toBe(true);
    expect(endsWithHold("hold on")).toBe(true);
    expect(endsWithHold("the customers wait")).toBe(false);
    expect(endsWithHold("I need a moment of silence in the shops")).toBe(false);
    expect(endsOnOperand("so the revenue is 120 times 4")).toBe(true);
    expect(endsOnOperand("that is 12 million divided by 15 percent")).toBe(true);
    expect(endsOnOperand("one hundred and twenty plus forty")).toBe(true);
    expect(endsOnOperand("so the revenue is 480")).toBe(false);
    expect(endsOnOperand("the margin is over 15")).toBe(false);
    expect(endsOnOperand("120 times")).toBe(false); // already counted as mid-thought
    expect(endsOnOperand("")).toBe(false);
    expect(isBareOkay("Okay")).toBe(true);
    expect(isBareOkay("okay so")).toBe(false);
  });

  it("waits longer for a request for time, a half-done sum or a bare okay", () => {
    const t = DEFAULT_TIMING;
    expect(silenceDelay("the revenue is 480", true)).toBe(t.finalSilenceMs);
    expect(silenceDelay("so the revenue is 120 times 4", true)).toBe(Math.round(t.finalSilenceMs * t.midThoughtFactor));
    expect(silenceDelay("costs are 1.2 million, give me a moment", true)).toBe(t.holdSilenceMs);
    expect(silenceDelay("costs are 1.2 million, give me a moment", false)).toBe(t.holdSilenceMs);
    expect(silenceDelay("okay", true)).toBe(t.stallSilenceMs);
    // The defaults are patient: several seconds, not one.
    expect(t.finalSilenceMs).toBeGreaterThanOrEqual(2500);
    expect(t.holdSilenceMs).toBeGreaterThanOrEqual(12_000);
  });
});

describe("telling echo from the student's own words (helpers)", () => {
  it("treats a yes or no the interviewer did not say, with other words, as an answer", () => {
    const q = "Does Harbourline sell only in the UK?";
    expect(isMostlyEcho("yes only in the UK", q)).toBe(false);
    expect(isMostlyEcho("no it sells in Ireland too", q)).toBe(false);
    expect(isMostlyEcho("only in the UK", q)).toBe(true);
  });
});

describe("what the browser supports on phones", () => {
  class Ctor {}
  const base = { webkitSpeechRecognition: Ctor, speechSynthesis: { speak() {}, cancel() {} }, SpeechSynthesisUtterance: Ctor, isSecureContext: true };

  it("turns the microphone off while speaking on any phone or touch-first device, not only iPhone", () => {
    const android = { ...base, navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/141 Mobile Safari/537.36" } };
    expect(voiceSupport(android)).toEqual({ supported: true, halfDuplex: true });
    expect(voiceSupport({ ...base, navigator: { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/141", userAgentData: { mobile: true } } }).halfDuplex).toBe(true);
    const coarse = { ...base, navigator: { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/141" }, matchMedia: (q: string) => ({ matches: q === "(pointer: coarse)" }) };
    expect(isTouchFirst(coarse)).toBe(true);
    // A laptop or desktop keeps the microphone on, so the student can talk over the interviewer.
    const desktop = { ...base, navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/141", userAgentData: { mobile: false } }, matchMedia: () => ({ matches: false }) };
    expect(voiceSupport(desktop)).toEqual({ supported: true, halfDuplex: false });
    expect(isTouchFirst({ ...desktop, matchMedia: () => { throw new Error("no"); } })).toBe(false);
    expect(voiceSupport({ ...android, webkitSpeechRecognition: undefined }).halfDuplex).toBe(false);
  });
});

// A four-sentence reply, as read aloud one sentence at a time.
const REPLY = "Harbourline has 120 cafes across the UK. Profit fell by a fifth last year. Rent rose faster than sales. What would you look at first? ";
const SENTENCES = ["Harbourline has 120 cafes across the UK.", "Profit fell by a fifth last year.", "Rent rose faster than sales.", "What would you look at first?"];

function startReply(s: Setup): void {
  s.ctrl.start();
  s.ctrl.turnStarted();
  s.ctrl.replyDelta(REPLY);
  s.ctrl.replyEnded();
  expect(s.synth.spoken).toEqual([SENTENCES[0]]);
}

describe("the interviewer's own voice over several sentences", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is not mistaken for the student when the browser hears it as one growing piece", () => {
    const s = setup();
    startReply(s);
    const cancels = s.synth.cancels;
    let heard = "";
    for (let i = 0; i < SENTENCES.length; i++) {
      // The echo of each sentence arrives while the next one is already playing (the microphone lags).
      heard = joinText(heard, SENTENCES[i].replace(/[.?]/g, "").toLowerCase());
      s.rec().hear(heard);
      expect(s.ctrl.state).toBe("speaking");
      if (i < SENTENCES.length - 1) s.synth.finish();
    }
    expect(s.synth.cancels).toBe(cancels); // the interviewer was never cut off
    expect(s.synth.spoken).toEqual(SENTENCES);
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    s.rec().hear(heard, true);
    vi.advanceTimersByTime(30_000);
    expect(s.submits).toEqual([]);
    expect(s.lastTranscript()).toBe("");
  });

  it("is not mistaken for the student when each piece repeats the earlier words (Android)", () => {
    const s = setup();
    startReply(s);
    const cancels = s.synth.cancels;
    const pieces: { text: string; isFinal: boolean }[] = [];
    let heard = "";
    for (let i = 0; i < SENTENCES.length; i++) {
      heard = joinText(heard, SENTENCES[i].replace(/[.?]/g, "").toLowerCase());
      if (pieces.length) pieces[pieces.length - 1].isFinal = true;
      pieces.push({ text: heard, isFinal: false });
      s.rec().hearList(pieces, pieces.length - 1);
      expect(s.ctrl.state).toBe("speaking");
      if (i < SENTENCES.length - 1) s.synth.finish();
    }
    expect(s.synth.cancels).toBe(cancels);
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    pieces[pieces.length - 1].isFinal = true;
    s.rec().hearList(pieces);
    vi.advanceTimersByTime(30_000);
    expect(s.submits).toEqual([]);
    expect(s.lastTranscript()).toBe("");
  });

  it("is not sent even when the echo of the whole reply only finishes after the voice stops", () => {
    const s = setup();
    startReply(s);
    for (let i = 0; i < SENTENCES.length - 1; i++) s.synth.finish();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    s.rec().hear(joinText(...SENTENCES).replace(/[.?]/g, "").toLowerCase(), true);
    vi.advanceTimersByTime(30_000);
    expect(s.submits).toEqual([]);
  });

  it("still lets the student interrupt in the middle of the reply", () => {
    const s = setup();
    startReply(s);
    const echo = joinText(SENTENCES[0], SENTENCES[1]).replace(/[.?]/g, "").toLowerCase();
    s.synth.finish();
    s.synth.finish();
    s.rec().hear(echo);
    expect(s.ctrl.state).toBe("speaking");
    const cancels = s.synth.cancels;
    s.rec().hear(`${echo} sorry can I ask about rent`);
    expect(s.synth.cancels).toBe(cancels + 1);
    expect(s.ctrl.state).toBe("listening");
    expect(s.lastTranscript()).toBe("sorry can I ask about rent");
    s.rec().hear(`${echo} sorry can I ask about rent costs`, true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["sorry can I ask about rent costs"]);
  });
});

describe("nods while the interviewer is talking", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each(["I see", "that makes sense", "yeah that's fair"])("'%s' does not stop the interviewer or get sent", (nod) => {
    const s = setup();
    startReply(s);
    const cancels = s.synth.cancels;
    s.rec().hear(nod, true);
    expect(s.ctrl.state).toBe("speaking");
    expect(s.synth.cancels).toBe(cancels);
    for (let i = 0; i < SENTENCES.length; i++) s.synth.finish();
    expect(s.synth.spoken).toEqual(SENTENCES); // the whole question was heard
    vi.advanceTimersByTime(30_000);
    expect(s.submits).toEqual([]);
  });

  it("a nod said after the interviewer has finished is kept in the box but never sent", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("I see", true);
    vi.advanceTimersByTime(60_000);
    expect(s.submits).toEqual([]);
    expect(s.lastTranscript()).toBe("I see");
    expect(s.held.at(-1)).toBe(true);
    // Real words after the nod go as one answer, and the note goes away.
    s.rec().hear("so costs first", true);
    expect(s.held.at(-1)).toBe(false);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["I see so costs first"]);
  });
});

describe("thinking aloud is not an answer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each(["okay so", "let me think about that", "give me a moment to work this out", "So, let me think", "Right, one moment", "Okay so... um", "hold on"])(
    "'%s' is not sent, and is shown as held",
    (said) => {
      const s = setup();
      s.ctrl.start();
      s.rec().hear(said, true);
      vi.advanceTimersByTime(120_000);
      expect(s.submits).toEqual([]);
      expect(s.ctrl.state).toBe("listening");
      expect(s.lastTranscript()).toBe(said);
      expect(s.held.at(-1)).toBe(true);
    },
  );

  it("sends an opener followed by real words, and a request for time followed by the answer, as one answer", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("okay so revenue is 200 times 5", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs - 1);
    expect(s.submits).toEqual([]); // a half-done sum: waits longer
    vi.advanceTimersByTime(Math.round(DEFAULT_TIMING.finalSilenceMs * DEFAULT_TIMING.midThoughtFactor));
    expect(s.submits).toEqual(["okay so revenue is 200 times 5"]);

    const t = setup();
    t.ctrl.start();
    t.rec().hear("let me think about that", true);
    vi.advanceTimersByTime(30_000);
    t.rec().hear("the margin is twelve percent", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(t.submits).toEqual(["let me think about that the margin is twelve percent"]);
  });

  it("waits a long time after an answer that ends by asking for time", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("fixed costs are 1.2 million, give me a moment", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.holdSilenceMs - 1);
    expect(s.submits).toEqual([]);
    s.rec().hear("so that gives 480", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["fixed costs are 1.2 million, give me a moment so that gives 480"]);
  });

  it("does not cut off a student who works a sum out in silence", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("so fixed costs are 1.2 million", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs - 100); // four seconds of working, nearly
    s.rec().hear("divided by a margin of 15 percent", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["so fixed costs are 1.2 million divided by a margin of 15 percent"]);
  });

  it("sends a bare okay (the answer to 'ready to start?') only after a long wait, and a yes at the normal time", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("okay", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.stallSilenceMs - 1);
    expect(s.submits).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(s.submits).toEqual(["okay"]);

    const t = setup();
    t.ctrl.start();
    t.rec().hear("Yes", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(t.submits).toEqual(["Yes"]);
  });

  it("sends a single digit such as '3'", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("3", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.submits).toEqual(["3"]);
  });

  it("says why when a lone letter is held back", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("a", true);
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual([]);
    expect(s.held.at(-1)).toBe(true);
  });
});

describe("the student's words are not taken for the interviewer's echo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** The interviewer asks `question`, finishes, and the student starts `afterMs` later. */
  function askAndAnswer(question: string, said: string, afterMs: number, options: Partial<VoiceOptions> = {}) {
    const s = setup(options);
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta(question);
    s.ctrl.replyEnded();
    s.synth.finish();
    expect(s.ctrl.state).toBe("listening");
    vi.advanceTimersByTime(afterMs);
    s.rec().hear(said, true);
    return s;
  }

  it("keeps an answer that repeats the question's words, and sends it whole", () => {
    const a = askAndAnswer("Does Harbourline sell only in the UK?", "yes only in the UK", 500);
    expect(a.lastTranscript()).toBe("yes only in the UK");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(a.submits).toEqual(["yes only in the UK"]);

    const b = askAndAnswer("What is the profit margin?", "profit margin is around twelve percent", 500);
    expect(b.lastTranscript()).toBe("profit margin is around twelve percent");
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(b.submits).toEqual(["profit margin is around twelve percent"]);

    const c = askAndAnswer("Which costs would you look at first?", "costs first", 600);
    expect(c.lastTranscript()).toBe("costs first");

    const d = askAndAnswer("How would you estimate the market size for coffee in London?", "the market size for coffee in London", 600);
    expect(d.lastTranscript()).toBe("the market size for coffee in London");
    const e = askAndAnswer("What would you look at first?", "look at the costs first", 600);
    expect(e.lastTranscript()).toBe("look at the costs first");
  });

  it("still drops a late scrap of the interviewer's own voice right after it stops", () => {
    const s = askAndAnswer("Harbourline has 120 cafés across the UK.", "across the UK", 100);
    vi.advanceTimersByTime(30_000);
    expect(s.submits).toEqual([]);
    expect(s.lastTranscript()).toBe("");
  });

  it("does not filter at all when the microphone is off while the interviewer speaks", () => {
    const s = askAndAnswer("Harbourline has 120 cafés across the UK.", "across the UK", 100, { halfDuplex: true });
    expect(s.lastTranscript()).toBe("across the UK");
  });
});

describe("voice mode problems and the speech queue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("blames the microphone only when the microphone is refused", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().fail("service-not-allowed");
    expect(s.problems).toEqual(["speech-off"]);
    expect(s.ctrl.state).toBe("off");
  });

  it("moves on from a sentence that never ends, and clears the browser's speech queue", () => {
    const s = setup();
    s.ctrl.start();
    s.ctrl.turnStarted();
    s.ctrl.replyDelta("First sentence. Second sentence. Third sentence. ");
    s.ctrl.replyEnded();
    expect(s.synth.spoken).toEqual(["First sentence."]);
    const cancels = s.synth.cancels;
    // The first sentence is stuck: the test never calls finish(), so speaking stays true.
    vi.advanceTimersByTime(15_000);
    expect(s.synth.cancels).toBeGreaterThan(cancels);
    expect(s.synth.spoken).toEqual(["First sentence.", "Second sentence."]);
    vi.advanceTimersByTime(15_000);
    expect(s.synth.spoken).toEqual(["First sentence.", "Second sentence.", "Third sentence."]);
    vi.advanceTimersByTime(15_000);
    expect(s.ctrl.state).toBe("listening");
  });
});
