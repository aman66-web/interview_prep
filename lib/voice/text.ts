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

export function endsMidThought(text: string): boolean {
  const last = words(text).at(-1);
  return last !== undefined && MID_THOUGHT.has(last);
}

export type TurnTiming = {
  /** Quiet time after the browser's final words before the answer is sent. */
  finalSilenceMs: number;
  /** Quiet time when the browser has only given provisional words (some browsers are slow to finalise). */
  interimSilenceMs: number;
  /** Extra wait when the answer seems to stop mid-sentence. */
  midThoughtFactor: number;
  /** Answers shorter than this (after trimming) are never sent on their own. */
  minAnswerChars: number;
};

export const DEFAULT_TIMING: TurnTiming = {
  finalSilenceMs: 1300,
  interimSilenceMs: 2200,
  midThoughtFactor: 1.8,
  minAnswerChars: 2,
};

/** How long to wait in silence before the answer heard so far is sent. */
export function silenceDelay(answer: string, lastIsFinal: boolean, timing: TurnTiming = DEFAULT_TIMING): number {
  const base = lastIsFinal ? timing.finalSilenceMs : timing.interimSilenceMs;
  return Math.round(endsMidThought(answer) ? base * timing.midThoughtFactor : base);
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
