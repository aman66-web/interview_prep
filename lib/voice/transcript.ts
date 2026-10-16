import { words } from "./text";

// Reading the browser's speech recognition results into plain text pieces.

export type Segment = { text: string; isFinal: boolean };

/** The shape of SpeechRecognitionEvent.results that voice mode reads. */
export type ResultListLike = {
  readonly length: number;
  readonly [index: number]: { readonly isFinal: boolean; readonly [alt: number]: { readonly transcript: string } | undefined };
};

export function readResults(results: ResultListLike): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    out.push({ text: (r?.[0]?.transcript ?? "").trim(), isFinal: Boolean(r?.isFinal) });
  }
  return out;
}

function startsWithWords(longer: string[], shorter: string[]): boolean {
  return shorter.length > 0 && shorter.length <= longer.length && shorter.every((w, i) => longer[i] === w);
}

/**
 * Chrome on Android (and sometimes Safari) repeats the earlier words in each new result
 * ("so the", "so the costs", "so the costs rose"). Keep only the longest of such a run.
 */
export function dedupeCumulative(parts: string[]): string[] {
  const out: string[] = [];
  for (const part of parts) {
    const prev = out.at(-1);
    if (prev !== undefined) {
      const a = words(prev);
      const b = words(part);
      if (startsWithWords(b, a)) {
        out[out.length - 1] = part;
        continue;
      }
      if (startsWithWords(a, b)) continue;
    }
    out.push(part);
  }
  return out;
}
