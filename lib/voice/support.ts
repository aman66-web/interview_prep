// What the browser can do for voice mode, and which voice to read replies with.
// Voice mode uses only the browser's built-in Web Speech API: SpeechRecognition (or
// webkitSpeechRecognition in Chrome, Edge and Safari) to listen, and speechSynthesis to
// speak. Nothing is installed and no paid service is used. Pure functions that take the
// window or navigator as an argument, so tests can pass fakes (tests/voice.test.ts).

export type RecognitionCtor = new () => unknown;

/** The parts of `window` this module looks at. */
export type SpeechWindowLike = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
  speechSynthesis?: unknown;
  SpeechSynthesisUtterance?: unknown;
  isSecureContext?: boolean;
  navigator?: NavigatorLike;
  matchMedia?: (query: string) => { matches: boolean };
};

export type NavigatorLike = {
  userAgent?: string;
  maxTouchPoints?: number;
  language?: string;
  platform?: string;
  userAgentData?: { mobile?: boolean };
};

export function recognitionConstructor(w: SpeechWindowLike): RecognitionCtor | null {
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as RecognitionCtor) : null;
}

export function hasSpeechSynthesis(w: SpeechWindowLike): boolean {
  const synth = w.speechSynthesis as { speak?: unknown; cancel?: unknown } | undefined;
  return typeof synth?.speak === "function" && typeof synth.cancel === "function" && typeof w.SpeechSynthesisUtterance === "function";
}

/** iPhone and iPad (iPadOS reports itself as a Mac, but with a touch screen). */
export function isIOS(nav: NavigatorLike | undefined): boolean {
  const ua = nav?.userAgent ?? "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && (nav?.maxTouchPoints ?? 0) > 1;
}

/**
 * A phone or tablet: the loudspeaker sits next to the microphone and, unlike in a call, the
 * browser's speech recognition does not remove the loudspeaker's sound, so the interviewer's
 * voice would be heard as the student's. iPhone and iPad, Android, anything the browser calls
 * mobile, and anything whose main pointer is a finger.
 */
export function isTouchFirst(w: SpeechWindowLike): boolean {
  const nav = w.navigator;
  if (isIOS(nav) || /Android/i.test(nav?.userAgent ?? "") || nav?.userAgentData?.mobile === true) return true;
  try {
    return w.matchMedia?.("(pointer: coarse)").matches === true;
  } catch {
    return false;
  }
}

export type VoiceSupport = {
  supported: boolean;
  /**
   * Stop listening while the interviewer speaks. Used on phones and tablets, where the
   * interviewer's voice would be picked up by the microphone as the student's (and on
   * iPhone and iPad, reading aloud while the microphone is on is unreliable); the student
   * taps "Stop speaking" to interrupt there. On a computer the microphone stays on so the
   * student can talk over the interviewer.
   */
  halfDuplex: boolean;
};

export function voiceSupport(w: SpeechWindowLike): VoiceSupport {
  // Browsers only give a page the microphone over HTTPS (or on localhost).
  const supported = w.isSecureContext !== false && recognitionConstructor(w) !== null && hasSpeechSynthesis(w);
  return { supported, halfDuplex: supported && isTouchFirst(w) };
}

/**
 * The language to listen in: the browser's own English variant if it has one (so an
 * American or Indian accent is heard with the right model), otherwise British English.
 */
export function recognitionLanguage(browserLanguage: string | undefined): string {
  const m = /^en(?:[-_]([a-z]{2}))?$/i.exec(browserLanguage ?? "");
  if (!m) return "en-GB";
  return m[1] ? `en-${m[1].toUpperCase()}` : "en-GB";
}

export type VoiceLike = { name: string; lang: string; localService?: boolean; default?: boolean };

// Joke and robotic voices that macOS and iOS list next to the real ones.
const NOVELTY =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|ralph|fred|junior|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;

function voiceScore(v: VoiceLike, lang: string): number {
  const l = v.lang.replace("_", "-").toLowerCase();
  const want = lang.toLowerCase();
  let score: number;
  if (l === want) score = 100;
  else if (l === "en-ie" || l === "en-au" || l === "en-nz") score = 45;
  else if (l === "en" || l.startsWith("en-")) score = 40;
  else return -Infinity;
  if (/natural|neural|enhanced|premium|online/i.test(v.name)) score += 30;
  if (/google/i.test(v.name)) score += 15;
  if (NOVELTY.test(v.name)) score -= 80;
  if (v.default) score += 2;
  return score;
}

/** The most natural English voice, preferring British English. Null to let the browser choose. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang = "en-GB"): V | null {
  let best: V | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const s = voiceScore(v, lang);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return bestScore === -Infinity ? null : best;
}

/**
 * Whether the browser can turn English speech into text on the device itself, so the audio
 * never leaves it (SpeechRecognition.available, in newer browsers). Never downloads anything.
 */
export async function onDeviceAvailable(ctor: RecognitionCtor | null, lang: string): Promise<boolean> {
  const available = (ctor as { available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string> } | null)?.available;
  if (typeof available !== "function") return false;
  try {
    return (await available.call(ctor, { langs: [lang], processLocally: true })) === "available";
  } catch {
    return false;
  }
}
