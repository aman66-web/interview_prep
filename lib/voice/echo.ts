import { removeNods, words } from "./text";

// Telling the student's voice apart from the interviewer's own voice coming back through
// the microphone (echo), and deciding when the student has really started to talk over
// the interviewer (barge-in). Pure functions (tests/voice.test.ts).
//
// For interruptions, "spoken" should be only what the interviewer has said very recently
// (a few sentences, see the controller), not the whole reply: a long reply contains so many
// everyday words that comparing against all of it would mistake the student for an echo.
// For the echo that is left over once the interviewer has finished, the whole reply is used.

// Short sounds people make while listening. On their own they never interrupt.
const BACKCHANNEL = new Set([
  "ok", "okay", "yeah", "yes", "yep", "yup", "right", "sure", "mm", "mmm", "mhm", "hmm", "uh", "huh", "um", "er", "erm",
  "uhhuh", "aha", "ah", "oh", "got", "it", "cool", "great", "fine", "alright", "no", "nope", "thanks", "thank", "you",
  "understood", "interesting", "perfect", "nice", "noted", "gotcha", "agreed", "true", "exactly", "absolutely", "definitely", "indeed",
]);

// Words that answer a question. With other words they are a real answer, never an echo.
const ANSWER_WORDS = new Set(["yes", "yeah", "yep", "yup", "no", "nope", "sure", "correct", "exactly", "definitely", "absolutely"]);

// Words that ask the interviewer to stop. One is enough.
const INTERRUPT = new Set(["stop", "wait", "sorry", "pardon", "hold", "hang", "excuse", "pause", "actually"]);

// Spoken numbers: a voice reading "120" can come back as "one hundred and twenty".
const NUMBER_WORDS = new Set([
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty",
  "seventy", "eighty", "ninety", "hundred", "thousand", "million", "billion", "point", "percent", "per", "cent", "pounds",
  "pound", "pence", "dollars", "dollar", "euros", "euro", "and",
]);

/** Whether a heard word was (probably) said by the interviewer: the same word, or part of a joined-up one. */
function knownWord(w: string, spoken: string[], spokenSet: Set<string>): boolean {
  if (spokenSet.has(w)) return true;
  if (w.length < 4) return false;
  // "Harbourline" read aloud can come back as "harbour line", and the other way round.
  return spoken.some((s) => s.length >= 4 && (s.includes(w) || w.includes(s)));
}

function analyse(heard: string, spokenText: string, withoutNods = false) {
  const spoken = words(spokenText);
  const spokenSet = new Set(spoken);
  // "I see", "that makes sense": phrases made of everyday words that are only a nod.
  const all = withoutNods ? removeNods(words(heard)).rest : words(heard);
  const known = all.filter((w) => knownWord(w, spoken, spokenSet));
  const novel = all.filter((w) => !knownWord(w, spoken, spokenSet) && !BACKCHANNEL.has(w) && !NUMBER_WORDS.has(w) && !/^\d/.test(w));
  const interrupt = all.some((w) => INTERRUPT.has(w) && !knownWord(w, spoken, spokenSet));
  const answers = all.filter((w) => ANSWER_WORDS.has(w) && !knownWord(w, spoken, spokenSet));
  return { all, knownShare: all.length ? known.length / all.length : 1, novel, interrupt, answers };
}

/** True when what was heard is most likely the interviewer's own voice (or nothing worth keeping). */
export function isMostlyEcho(heard: string, spokenText: string): boolean {
  const a = analyse(heard, spokenText);
  if (a.all.length === 0) return true;
  if (a.interrupt) return false;
  // "Yes, only in the UK": a yes or no the interviewer did not say, with other words, is an answer.
  if (a.answers.length > 0 && a.all.length >= 2) return false;
  return a.knownShare >= 0.6 && a.novel.length < 2;
}

/**
 * While the interviewer is talking: should it stop and listen?
 * Yes for a stop word ("sorry", "wait") or at least two new words that are not the
 * interviewer's own; no for echo, "mm-hmm", "okay", "I see", "that makes sense" and numbers
 * read back.
 */
export function bargeInDecision(heard: string, spokenText: string): "barge-in" | "ignore" {
  const a = analyse(heard, spokenText, true);
  if (a.all.length === 0) return "ignore";
  if (a.interrupt) return "barge-in";
  if (a.all.length >= 3 && a.knownShare >= 0.6) return "ignore";
  return a.novel.length >= 2 ? "barge-in" : "ignore";
}

/**
 * Removes the interviewer's words from the start of what was heard, when the browser joined
 * the tail of the interviewer's sentence and the student's first words into one piece
 * ("across the UK sorry can I ask" -> "sorry can I ask"). Only a run of at least `minRun`
 * words that the interviewer said in that order is removed, so a student who happens to
 * start with one of the interviewer's words keeps it.
 */
export function stripEchoPrefix(heard: string, spokenText: string, minRun = 3): string {
  const tokens = heard.trim().split(/\s+/).filter(Boolean);
  const norm = tokens.map((t) => words(t).join(""));
  const spoken = spokenText.split(/\s+/).map((t) => words(t).join("")).filter(Boolean);
  // Positions of the tokens that have letters or digits (punctuation-only tokens are skipped).
  const real = norm.flatMap((w, i) => (w ? [i] : []));
  let best = 0;
  for (let s = 0; s < spoken.length; s++) {
    let k = 0;
    while (k < real.length && s + k < spoken.length && norm[real[k]] === spoken[s + k]) k++;
    if (k > best) best = k;
  }
  if (best < minRun) return tokens.join(" ");
  const cutAt = best < real.length ? real[best] : tokens.length;
  return tokens.slice(cutAt).join(" ");
}
