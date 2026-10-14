// What Anthropic charges, used to estimate the cost of each call for ai_usage
// (rule 2.8). Prices are US dollars per million tokens, from Anthropic's
// published model table (cached 6 Oct 2026). They are estimates for budgeting
// and limits; Anthropic's invoice is the source of truth.
//
// Prompt caching: reading cached input costs 0.1x the input price, and writing it
// costs 1.25x (5-minute cache).

export type Price = { input: number; output: number };

export const PRICES: Record<string, Price> = {
  "claude-fable-5-1": { input: 10, output: 50 },
  "claude-fable-5": { input: 10, output: 50 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** For a model we do not know, assume the most expensive price so cost is never under-estimated. */
const UNKNOWN_MODEL_PRICE: Price = { input: 10, output: 50 };

export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = 1.25;

export type TokenUsage = {
  /** Fresh input tokens (not read from or written to the cache). */
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
};

export function priceFor(model: string): Price {
  return PRICES[model] ?? UNKNOWN_MODEL_PRICE;
}

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const price = priceFor(model);
  const dollars =
    (usage.input * price.input +
      usage.cacheRead * price.input * CACHE_READ_MULTIPLIER +
      usage.cacheWrite * price.input * CACHE_WRITE_MULTIPLIER +
      usage.output * price.output) /
    1_000_000;
  return Math.round(dollars * 1e6) / 1e6;
}

/** All input-side tokens, for the ai_usage table and per-session caps. */
export function totalInputTokens(usage: TokenUsage): number {
  return usage.input + usage.cacheRead + usage.cacheWrite;
}
