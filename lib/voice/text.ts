// Text helpers for voice mode: comparing what was heard with what was said, cutting a
// streamed reply into sentences to read aloud, and tidying text so it sounds right.
// Pure functions, no browser needed (tests/voice.test.ts).

/** Lower-case words with accents and punctuation removed ("Cafés," -> "cafes"). */
export function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Joins pieces of an answer with single spaces. */
export function joinText(...parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

/** Cuts an answer to the longest message the room accepts, the same cap a typed answer has. */
export function clipToLimit(text: string, max: number): { text: string; clipped: boolean } {
  return text.length <= max ? { text, clipped: false } : { text: text.slice(0, max), clipped: true };
}

// Words that, at the end of what someone has said so far, usually mean they are mid-thought
// ("and the costs are, um ..."), so voice mode waits a little longer before sending.
const MID_THOUGHT = new Set([
  "and", "but", "so", "or", "because", "um", "uh", "er", "erm", "hmm", "like", "the", "a", "an", "of", "to",
  "with", "is", "are", "then", "which", "that", "if", "by", "for", "in", "on", "at", "from", "plus", "minus",
  "times", "over", "divided", "multiplied", "equals", "about", "around", "roughly", "maybe", "my", "our", "their",
]);

// Thinking sounds with no content. An answer made only of these is never sent on its own.
const FILLER = new Set(["um", "umm", "uhm", "uh", "er", "erm", "hm", "hmm", "hmmm", "mm", "mmm", "mhm", "ah", "oh", "huh"]);

export function isFillerOnly(text: string): boolean {
  const all = words(text);
  return all.length > 0 && all.every((w) => FILLER.has(w));
}

export function endsMidThought(text: string): boolean {
  const last = words(text).at(-1);
  return last !== undefined && MID_THOUGHT.has(last);
}

// ---------------------------------------------------------------------------
// Thinking aloud, hold phrases and nods
//
// A student who works a number out goes quiet, and often says so first ("give me a moment",
// "let me think about that"). Those words are not an answer: sending them would use one of
// the interview's turns and make the interviewer talk while the student is working.
// ---------------------------------------------------------------------------

const joined = (text: string) => words(text).join(" ");

// Spoken ways to ask for time. Used to wait much longer, and never to send them alone.
// "Give me a moment to work this out": the reason for the wait can follow.
const HOLD_REASON = "(?: (?:to|so i can|while i) (?:think|work|figure|calculate|do|sort|crunch)(?: (?:about|through|on))?(?: (?:that|this|it|things|the|some|a|my|these|those|numbers|number|maths|math|sums))*(?: (?:out|through|up))?)?";
const HOLD_PATTERNS = [
  "(?:let me|lets|ill|i will|i ll|let us) (?:just |quickly |take a )?(?:think|have a think|work|calculate|do|figure|see|try|crunch|compute|check|structure|organise|organize|gather|collect)(?: (?:about|through|on|over))?(?: (?:that|this|it|the|some|a|my|these|those|numbers|number|maths|math|calculation|calculations|sums|sum|figures|thoughts|thinking))*(?: (?:out|through|up|down|first|quickly|please))*",
  "(?:give me |just |wait |hold on |hang on )?(?:a |one |another )(?:moment|second|sec|minute|beat|bit)(?: or two)?(?: please)?" + HOLD_REASON,
  "give me (?:a |one )?(?:couple of |few )?(?:moment|moments|second|seconds|sec|minute|minutes|time)(?: please)?" + HOLD_REASON,
  "(?:hold|hang) on(?: a (?:moment|second|sec|minute))?(?: please)?",
  "bear with me",
];
const HOLD_ANYWHERE = HOLD_PATTERNS.map((p) => new RegExp(`(?:^| )${p}(?= |$)`, "g"));
const HOLD_AT_END = new RegExp(`(?:^| )(?:${HOLD_PATTERNS.join("|")})$`);

// Words that open or pad an answer without saying anything.
const LEAD_IN = /(?:^| )(?:so|okay|ok|well|right|alright|now|and|then|please|just|actually|um|umm|er|erm|uh|uhm|hmm|hmmm|mm|mmm)(?= |$)/g;
// On their own these two can be a real answer ("Ready to start?" - "Okay"), so they are
// sent, after a long wait. Two or more lead-ins together ("okay so") never are.
const BARE_OK = new Set(["okay", "ok", "right", "alright"]);
// Asking the interviewer to stop is not an answer either.
const STOP_WORDS = /(?:^| )(?:wait|stop|sorry|excuse me)(?= |$)/g;

/** The answer ends by asking for time ("... give me a moment"). */
export function endsWithHold(text: string): boolean {
  return HOLD_AT_END.test(joined(text));
}

/** Only an opener or a request for time ("okay so", "let me think about that", "hold on"): not an answer. */
export function isStallOnly(text: string): boolean {
  const all = words(text);
  if (all.length === 0 || all.length > 12) return false;
  let rest = all.join(" ");
  let matched = 0;
  for (const re of [...HOLD_ANYWHERE, STOP_WORDS]) {
    rest = rest.replace(re, () => {
      matched++;
      return " ";
    });
  }
  let leads = 0;
  let lone = "";
  rest = rest.replace(LEAD_IN, (m) => {
    leads++;
    lone = m.trim();
    return " ";
  });
  if (rest.trim() !== "") return false;
  if (matched > 0 || leads >= 2) return true;
  return leads === 1 && !BARE_OK.has(lone);
}

/** A bare "okay" or "right": possibly the answer to "ready to start?", so it waits long before sending. */
export function isBareOkay(text: string): boolean {
  const all = words(text);
  return all.length > 0 && all.length <= 2 && all.every((w) => BARE_OK.has(w));
}

// Nods while listening: "I see", "that makes sense", "yeah that's fair". They are not answers.
const NOD_PHRASES = [
  "thats a good point", "thats a fair point", "that is a good point", "that is a fair point", "that makes sense", "it makes sense",
  "makes sense", "i see", "thats fair", "that is fair", "fair enough", "fair point", "good point", "sounds good", "sounds right",
  "i understand", "i agree", "i get it", "of course", "thats interesting", "that is interesting", "thats true", "that is true",
  "got it", "thank you",
].map((p) => p.split(" "));
const NOD_WORDS = new Set(["understood", "interesting", "noted", "gotcha", "great", "cool", "nice", "perfect", "thanks", "mhm", "aha", "oh", "ah", "huh"]);
// What can stay around a nod without making it an answer.
const NOD_COMPANIONS = new Set(["yeah", "yes", "yep", "yup", "okay", "ok", "right", "sure", "so", "well", "and", "mm", "mmm", "hmm", "um", "uh"]);
const NOD_BY_LENGTH = [...NOD_PHRASES].sort((a, b) => b.length - a.length);

/** Takes the nod phrases (and, if `singles`, single nod words) out of a list of words. */
export function removeNods(all: string[], singles = false): { rest: string[]; removed: number } {
  const rest: string[] = [];
  let removed = 0;
  for (let i = 0; i < all.length; ) {
    const phrase = NOD_BY_LENGTH.find((p) => p.every((w, k) => all[i + k] === w));
    if (phrase) {
      i += phrase.length;
      removed++;
      continue;
    }
    if (singles && NOD_WORDS.has(all[i])) {
      i++;
      removed++;
      continue;
    }
    rest.push(all[i]);
    i++;
  }
  return { rest, removed };
}

/** Only a nod ("I see", "that makes sense", "yeah, that's fair"): never sent as an answer. */
export function isAcknowledgementOnly(text: string): boolean {
  const { rest, removed } = removeNods(words(text), true);
  return removed > 0 && rest.every((w) => NOD_COMPANIONS.has(w));
}

// Spoken arithmetic that is not finished: "120 times 4" is not yet "480".
const OPERATORS = new Set(["times", "multiplied", "divided", "plus", "minus", "x"]);
const NUMBERISH = /^(?:\d[\d.,]*[a-z%]*|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|point|percent|k|m|bn|and|a|about|around|roughly)$/;

const NOT_A_NUMBER_END = new Set(["and", "a", "about", "around", "roughly", "point"]);

/** The answer stops straight after a number that follows "times", "divided by", "plus" and so on. */
export function endsOnOperand(text: string): boolean {
  const all = words(text);
  if (all.length === 0 || NOT_A_NUMBER_END.has(all[all.length - 1])) return false;
  let i = all.length;
  while (i > 0 && all.length - i < 8 && NUMBERISH.test(all[i - 1])) i--;
  if (i === all.length) return false; // does not end in a number
  const prev = all[i - 1];
  if (prev === undefined) return false;
  if (prev === "by") return all[i - 2] === "multiplied" || all[i - 2] === "divided" || all[i - 2] === "times";
  return OPERATORS.has(prev);
}

export type TurnTiming = {
  /** Quiet time after the browser's final words before the answer is sent. */
  finalSilenceMs: number;
  /** Quiet time when the browser has only given provisional words (some browsers are slow to finalise). */
  interimSilenceMs: number;
  /** How many times longer to wait when the answer seems to stop mid-sentence or mid-sum. */
  midThoughtFactor: number;
  /** Quiet time when the answer ends by asking for time ("give me a moment", "let me think"). */
  holdSilenceMs: number;
  /** Quiet time after a bare "okay" or "right". */
  stallSilenceMs: number;
  /** Answers shorter than this (after trimming) are never sent on their own (a digit is enough). */
  minAnswerChars: number;
};

// Case interviews are full of silent working: a student reads a table, does a sum in their
// head, and then speaks. Sending after a short pause would answer half a thought and use up
// one of the 40 turns, so voice mode waits a few seconds. Chrome finalises words after about
// a second of quiet by itself, so the real wait is a little longer than these numbers.
export const DEFAULT_TIMING: TurnTiming = {
  finalSilenceMs: 2500,
  interimSilenceMs: 3500,
  midThoughtFactor: 2.5,
  holdSilenceMs: 14_000,
  stallSilenceMs: 7000,
  minAnswerChars: 2,
};

/** How long to wait in silence before the answer heard so far is sent. */
export function silenceDelay(answer: string, lastIsFinal: boolean, timing: TurnTiming = DEFAULT_TIMING): number {
  const base = lastIsFinal ? timing.finalSilenceMs : timing.interimSilenceMs;
  if (endsWithHold(answer)) return Math.max(base, timing.holdSilenceMs);
  if (isBareOkay(answer)) return Math.max(base, timing.stallSilenceMs);
  return Math.round(endsMidThought(answer) || endsOnOperand(answer) ? base * timing.midThoughtFactor : base);
}

// ---------------------------------------------------------------------------
// Reading replies aloud
// ---------------------------------------------------------------------------

// A full stop after one of these is not the end of a sentence.
const ABBREVIATIONS = new Set(["e.g", "i.e", "eg", "ie", "vs", "mr", "mrs", "ms", "dr", "st", "approx", "cf", "incl", "est"]);
const CLOSERS = new Set(['"', "'", "”", "’", ")", "]"]);
const ENDERS = new Set([".", "!", "?", "…"]);

function isAbbreviation(before: string, after: string): boolean {
  const token = (/(\S+)$/.exec(before)?.[1] ?? "").replace(/^[("'“‘[]+/, "");
  if (ABBREVIATIONS.has(token.toLowerCase())) return true;
  if (/^[A-Z]$/.test(token)) return true; // an initial, as in "J. Smith"
  if (/^no$/i.test(token) && /^\s*\d/.test(after)) return true; // "No. 3"
  return false;
}

/**
 * Cuts a reply that arrives in pieces into whole sentences, so speaking can start as soon
 * as the first sentence is complete. A sentence ends at . ! ? or … followed by a space, or
 * at a line break. "1.5", "e.g." and "£1.2m" do not end a sentence.
 */
export class SentenceSplitter {
  private buffer = "";

  push(text: string): string[] {
    this.buffer += text;
    return this.take(false);
  }

  /** The rest of the reply, once it has all arrived. */
  flush(): string[] {
    return this.take(true);
  }

  private take(final: boolean): string[] {
    const out: string[] = [];
    let start = 0;
    let i = 0;
    const b = this.buffer;
    while (i < b.length) {
      const ch = b[i];
      if (ch === "\n") {
        out.push(b.slice(start, i));
        start = i + 1;
        i++;
        continue;
      }
      if (ENDERS.has(ch)) {
        let j = i + 1;
        while (j < b.length && (ENDERS.has(b[j]) || CLOSERS.has(b[j]))) j++;
        if (j === b.length) break; // cannot tell yet: "1." might become "1.5"
        if (/\s/.test(b[j]) && !(ch === "." && j === i + 1 && isAbbreviation(b.slice(start, i), b.slice(j)))) {
          out.push(b.slice(start, j));
          start = j;
        }
        i = j;
        continue;
      }
      i++;
    }
    this.buffer = b.slice(start);
    if (final) {
      out.push(this.buffer);
      this.buffer = "";
    }
    return out.flatMap((s) => splitLong(s.trim())).filter((s) => /[\p{L}\p{N}]/u.test(s));
  }
}

/** Breaks a very long sentence at a comma or similar, because some browsers cut off long speech. */
export function splitLong(sentence: string, max = 200): string[] {
  const out: string[] = [];
  let rest = sentence.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = -1;
    for (const mark of [", ", "; ", ": ", " – ", " — ", " - "]) {
      const at = window.lastIndexOf(mark);
      if (at >= 60 && at + mark.length > cut) cut = at + mark.length;
    }
    if (cut < 0) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

const SCALE: Record<string, string> = { k: "thousand", m: "million", bn: "billion" };

/** Tidies text for a speech voice: no markdown symbols or list bullets, money short forms said in full. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/^\s*[-•*]\s+/gm, "")
    .replace(/\*\*|__|[*`#]/g, "")
    .replace(/([£$€]\s?\d[\d,]*(?:\.\d+)?)\s?(k|m|bn)\b/gi, (_, amount: string, unit: string) => `${amount} ${SCALE[unit.toLowerCase()]}`)
    .replace(/\be\.g\.(?=[\s,]|$)/gi, "for example")
    .replace(/\bi\.e\.(?=[\s,]|$)/gi, "that is")
    .replace(/\s+/g, " ")
    .trim();
}
