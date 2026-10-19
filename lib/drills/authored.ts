import { z } from "zod";
import { evaluate } from "@/lib/content/expr";
import frameworksRaw from "@/content/drills/frameworks.json";
import marketSizingRaw from "@/content/drills/market-sizing.json";
import { clean, fmt, makeRng, seedFromString, shuffled } from "./rng";
import type { ChoiceDrill, EstimateDrill } from "./types";

// Hand-written drills (market sizing and frameworks) live in content/drills/*.json.

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z]{2}-\d{2}$/);

const marketSizingSchema = z.array(
  z
    .object({
      id,
      title: text,
      prompt: text,
      unit: text,
      inputs: z.record(z.string(), z.number()),
      expression: text,
      approach: z.array(text).min(3),
    })
    .strict(),
);

const frameworksSchema = z.array(
  z
    .object({
      id,
      title: text,
      prompt: text,
      options: z.array(text).length(4),
      answer_index: z.number().int().min(0).max(3),
      explanation: text,
    })
    .strict(),
);

/** An estimate counts as good if it is within this factor of the model estimate. */
export const ESTIMATE_FACTOR = 3;

export function authoredMarketSizingDrills(): EstimateDrill[] {
  return marketSizingSchema.parse(marketSizingRaw).map((item) => {
    const answer = clean(evaluate(item.expression, item.inputs));
    return {
      id: item.id,
      category: "market-sizing",
      kind: "estimate",
      title: item.title,
      prompt: `${item.prompt} Give your best single estimate.`,
      unit: item.unit,
      answer,
      withinFactor: ESTIMATE_FACTOR,
      explanation: `Model approach: ${item.approach.join(" ")} Model estimate: about ${fmt(answer)} ${item.unit}. Your own assumptions will differ, which is fine: an estimate within about ${ESTIMATE_FACTOR}x of the model one is reasonable, and a clear structure matters more than the exact number.`,
      expression: item.expression,
      inputs: item.inputs,
    };
  });
}

export function authoredFrameworkDrills(): ChoiceDrill[] {
  return frameworksSchema.parse(frameworksRaw).map((item) => {
    // The files list the right answer first. Shuffle (the same way every time)
    // so the right answer is not always option A.
    const order = shuffled(makeRng(seedFromString(`framework:${item.id}`)), [0, 1, 2, 3]);
    return {
      id: item.id,
      category: "frameworks",
      kind: "choice",
      title: item.title,
      prompt: item.prompt,
      options: order.map((i) => item.options[i]),
      answerIndex: order.indexOf(item.answer_index),
      explanation: item.explanation,
    };
  });
}
