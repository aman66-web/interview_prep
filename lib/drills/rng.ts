// A small seeded random number generator, so generated drills are the same
// every time (stable ids, stable answers, reproducible tests).

export type Rng = () => number;

/** mulberry32: tiny, fast, good enough for picking drill numbers. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** A seeded Fisher-Yates shuffle that behaves the same in every JavaScript engine. */
export function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Formats a number the way people read it: 1,200 and 2.5, never 1200.0000001. */
export function fmt(n: number): string {
  const rounded = Math.round(n * 1e6) / 1e6;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/** Removes floating-point dust such as 18.000000000000004. */
export function clean(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function isWhole(n: number): boolean {
  return Math.abs(n - Math.round(n)) < 1e-9;
}
