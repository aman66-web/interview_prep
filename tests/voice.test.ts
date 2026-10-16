import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceController, type SubmitResult, type VoiceOptions, type VoicePhase, type VoiceProblem } from "@/lib/voice/controller";
import { bargeInDecision, isMostlyEcho, stripEchoPrefix } from "@/lib/voice/echo";
import { isIOS, onDeviceAvailable, pickVoice, recognitionConstructor, recognitionLanguage, voiceSupport } from "@/lib/voice/support";
import { cleanForSpeech, clipToLimit, DEFAULT_TIMING, endsMidThought, joinText, SentenceSplitter, silenceDelay, splitLong, words } from "@/lib/voice/text";
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
    expect(stripEchoPrefix("the UK market is small", spoken, 2)).toBe("market is small");
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
};

function setup(options: Partial<VoiceOptions> = {}): Setup {
  const synth = new FakeSynth();
  const recs: FakeRecognition[] = [];
  const phases: VoicePhase[] = [];
  const transcripts: { text: string; clipped: boolean }[] = [];
  const submits: string[] = [];
  const problems: VoiceProblem[] = [];
  const submitResults: SubmitResult[] = [];
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

  it("ignores what is heard while the interviewer is thinking", () => {
    const s = setup();
    s.ctrl.start();
    s.rec().hear("my answer", true);
    vi.advanceTimersByTime(DEFAULT_TIMING.finalSilenceMs);
    expect(s.ctrl.state).toBe("thinking");
    s.rec().hear("talking to myself", true);
    s.ctrl.replyEnded();
    expect(s.ctrl.state).toBe("listening");
    vi.advanceTimersByTime(10_000);
    expect(s.submits).toEqual(["my answer"]);
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
