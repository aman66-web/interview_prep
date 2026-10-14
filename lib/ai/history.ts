export type ChatMessage = { role: "user" | "assistant"; content: string };

const chars = (messages: ChatMessage[]) => messages.reduce((n, m) => n + m.content.length, 0);

export type HistoryPlan = {
  /** Messages to send in full. */
  window: ChatMessage[];
  /** Older messages that the summary does not cover yet and that must be folded into it first. */
  toFold: ChatMessage[];
  /** How many messages (from the start) the summary will cover once `toFold` has been added. */
  newCovers: number;
};

/**
 * Keeps each model call within a token cap (kit section 6). Older turns are
 * represented by a rolling summary; recent turns are sent in full.
 *
 * `covers` is how many messages from the start the stored summary already covers.
 * If what is left is longer than `maxChars`, the oldest of it is folded into the
 * summary too, always keeping at least `minRecent` messages in full.
 */
export function planHistory(messages: ChatMessage[], covers: number, maxChars: number, minRecent: number): HistoryPlan {
  const start = Math.min(Math.max(covers, 0), messages.length);
  let split = start;
  while (messages.length - split > minRecent && chars(messages.slice(split)) > maxChars) split++;
  return { window: messages.slice(split), toFold: messages.slice(start, split), newCovers: split };
}
