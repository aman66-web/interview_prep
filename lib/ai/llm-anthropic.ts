import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiConfigError, type Llm, type LlmCall, type LlmResult } from "./llm";

// The ONLY file that talks to Anthropic (rule 2.8; tests/repo-rules.test.ts
// checks nothing else imports the SDK). It reads ANTHROPIC_API_KEY and
// ANTHROPIC_MODEL from the environment; the key never leaves the server.

/** ANTHROPIC_EFFORT=none leaves the effort setting out, for older models that reject it. */
function effortSetting(requested: LlmCall["effort"]): { effort: LlmCall["effort"] } | Record<string, never> {
  return process.env.ANTHROPIC_EFFORT?.trim().toLowerCase() === "none" ? {} : { effort: requested };
}

export function createAnthropicLlm(): Llm {
  const model = process.env.ANTHROPIC_MODEL?.trim();
  if (!model) throw new AiConfigError("ANTHROPIC_MODEL is not set.");
  if (!process.env.ANTHROPIC_API_KEY?.trim()) throw new AiConfigError("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic({ maxRetries: 2, timeout: 90_000 });

  return {
    model,
    async complete(call: LlmCall): Promise<LlmResult> {
      const stream = client.messages.stream({
        model,
        max_tokens: call.maxTokens,
        // The system prompt is long and identical for every turn of a case, so it is cached.
        system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
        messages: call.messages,
        output_config: {
          ...effortSetting(call.effort),
          ...(call.schema ? { format: zodOutputFormat(call.schema) } : {}),
        },
      });
      if (call.onText) stream.on("text", call.onText);

      const message = await stream.finalMessage();
      const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
      return {
        text,
        stopReason: message.stop_reason,
        model: message.model ?? model,
        usage: {
          input: message.usage.input_tokens ?? 0,
          output: message.usage.output_tokens ?? 0,
          cacheRead: message.usage.cache_read_input_tokens ?? 0,
          cacheWrite: message.usage.cache_creation_input_tokens ?? 0,
        },
      };
    },
  };
}
