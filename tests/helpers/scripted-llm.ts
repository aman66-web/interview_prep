import type { Llm, LlmCall, LlmResult } from "@/lib/ai/llm";

export type Scripted = string | { text: string; stopReason?: string | null; throws?: boolean; usage?: Partial<LlmResult["usage"]> };

/**
 * A stand-in for the model. `script` decides what to answer for each call; the
 * answer is streamed to `onText` in small pieces, the way the real API does, so
 * the reply extractor and the streaming path are exercised too.
 */
export class ScriptedLlm implements Llm {
  readonly model: string;
  calls: LlmCall[] = [];
  chunkSize = 7;

  constructor(
    private script: (call: LlmCall, index: number) => Scripted,
    model = "claude-sonnet-5-5",
  ) {
    this.model = model;
  }

  async complete(call: LlmCall): Promise<LlmResult> {
    const index = this.calls.length;
    this.calls.push(call);
    const out = this.script(call, index);
    const scripted = typeof out === "string" ? { text: out } : out;
    if (scripted.throws) throw new Error("scripted failure");
    if (call.onText) {
      for (let i = 0; i < scripted.text.length; i += this.chunkSize) call.onText(scripted.text.slice(i, i + this.chunkSize));
    }
    return {
      text: scripted.text,
      stopReason: scripted.stopReason === undefined ? "end_turn" : scripted.stopReason,
      model: this.model,
      usage: { input: 1500, output: 120, cacheRead: 0, cacheWrite: 0, ...scripted.usage },
    };
  }
}

export const json = (value: unknown) => JSON.stringify(value);

/** The stage the interviewer was told it is in, read back out of the turn notes. */
export function stageOf(call: LlmCall): string {
  const last = call.messages[call.messages.length - 1].content;
  return /Current stage: (\w+)/.exec(last)?.[1] ?? "unknown";
}
