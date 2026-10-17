import type { z } from "zod";
import type { TokenUsage } from "./pricing";

// The one interface the rest of the app uses to talk to a model. The real
// implementation (llm-anthropic.ts) is the only file that imports the Anthropic
// SDK; tests use a scripted stand-in.

export type LlmMessage = { role: "user" | "assistant"; content: string };

export type LlmCall = {
  /** What this call is for, written to the usage log. */
  purpose: "turn" | "retry" | "summary" | "debrief";
  system: string;
  messages: LlmMessage[];
  maxTokens: number;
  /** When set, the model must answer with JSON matching this schema (structured output). */
  schema?: z.ZodType;
  effort: "low" | "medium" | "high";
  /** Called with each new piece of text as it arrives. */
  onText?: (delta: string) => void;
};

export type LlmResult = {
  text: string;
  /** Why the model stopped, for example "end_turn", "max_tokens" or "refusal". */
  stopReason: string | null;
  usage: TokenUsage;
  model: string;
};

export interface Llm {
  readonly model: string;
  complete(call: LlmCall): Promise<LlmResult>;
}

export class AiConfigError extends Error {}

/** True when the interviewer can run: an Anthropic key and a model are both set. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim()) && Boolean(process.env.ANTHROPIC_MODEL?.trim());
}
