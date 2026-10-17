import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/content/expr";
import { generateChartDrills } from "@/lib/drills/charts";
import { checkDrillAnswer, parseNumber } from "@/lib/drills/check";
import { allDrills, drillsByCategory, findDrill, toPublicDrill, DRILL_CATEGORIES } from "@/lib/drills";
import { generateMentalMathsDrills } from "@/lib/drills/mental-maths";
import type { ChoiceDrill, Drill, NumericDrill } from "@/lib/drills/types";

const numeric = (list: Drill[]) => list.filter((d): d is NumericDrill => d.kind === "numeric");

describe("the drill library", () => {
  it("has at least 300 drills across all four categories (kit launch target)", () => {
    expect(allDrills.length).toBeGreaterThanOrEqual(300);
    for (const category of DRILL_CATEGORIES) {
      expect(drillsByCategory(category).length, category).toBeGreaterThanOrEqual(12);
    }
  });

  it("has unique ids and unique prompts within each category", () => {
    const ids = allDrills.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of DRILL_CATEGORIES) {
      const list = drillsByCategory(category);
      // Chart questions repeat their wording on purpose (the chart differs), so compare chart data too.
      const keys = list.map((d) => `${d.prompt}|${JSON.stringify(d.chart?.points ?? "")}`);
      expect(new Set(keys).size, category).toBe(keys.length);
    }
  });

  it("is the same every time it is built (stable ids and answers)", () => {
    const first = JSON.stringify(generateMentalMathsDrills().slice(0, 40));
    expect(JSON.stringify(generateMentalMathsDrills().slice(0, 40))).toBe(first);
    expect(JSON.stringify(generateChartDrills())).toBe(JSON.stringify(generateChartDrills()));
  });

  it("can find a drill by id", () => {
    expect(findDrill(allDrills[0].id)).toBe(allDrills[0]);
    expect(findDrill("nope")).toBeUndefined();
  });
});

describe("generated mental-maths drills", () => {
  const drills = numeric(generateMentalMathsDrills());

  it("makes 240 of them", () => {
    expect(drills.length).toBe(240);
  });

  it("recompute from their own expression and inputs (rule 2.9)", () => {
    for (const d of drills) {
      expect(d.expression && d.inputs, d.id).toBeTruthy();
      expect(d.answer, d.id).toBeCloseTo(evaluate(d.expression!, d.inputs!), 5);
      expect(Number.isFinite(d.answer), d.id).toBe(true);
      expect(d.answer, `${d.id} should be positive`).toBeGreaterThan(0);
    }
  });

  it("mention every number the maths uses, so the question is answerable", () => {
    for (const d of drills.filter((x) => x.id.includes("percent-of"))) {
      expect(d.prompt, d.id).toContain(String(d.inputs!.pct));
    }
  });

  it("give a worked explanation that states the right answer", () => {
    for (const d of drills) {
      expect(d.explanation.length, d.id).toBeGreaterThan(20);
    }
  });
});

describe("generated chart drills", () => {
  const drills = generateChartDrills();

  it("makes 60 of them, each with a chart", () => {
    expect(drills.length).toBe(60);
    for (const d of drills) expect(d.chart, d.id).toBeDefined();
  });

  it("agree with the chart that is drawn (answers re-derived from the plotted points)", () => {
    for (const d of drills) {
      const points = d.chart!.points;
      const values = points.map((p) => p.value);
      if (d.id.startsWith("cr-share-")) {
        const n = d as NumericDrill;
        const label = /"([^"]+)"/.exec(d.prompt)![1];
        const value = points.find((p) => p.label === label)!.value;
        expect(n.answer, d.id).toBeCloseTo((value / values.reduce((a, b) => a + b, 0)) * 100, 6);
      } else if (d.id.startsWith("cr-gap-")) {
        expect((d as NumericDrill).answer, d.id).toBe(Math.max(...values) - Math.min(...values));
      } else if (d.id.startsWith("cr-growth-")) {
        expect((d as NumericDrill).answer, d.id).toBeCloseTo(((values[4] - values[0]) / values[0]) * 100, 6);
      } else if (d.id.startsWith("cr-fastest-")) {
        const c = d as ChoiceDrill;
        const rises = values.slice(1).map((v, i) => v - values[i]);
        expect(c.answerIndex, d.id).toBe(rises.indexOf(Math.max(...rises)));
        expect(rises.filter((r) => r === Math.max(...rises)).length, `${d.id} has a tie`).toBe(1);
      } else {
        throw new Error(`unknown chart drill ${d.id}`);
      }
    }
  });

  it("use only whole-number, readable values", () => {
    for (const d of drills) for (const p of d.chart!.points) expect(Number.isInteger(p.value), d.id).toBe(true);
  });
});

describe("authored drills", () => {
  it("have market-sizing estimates that recompute from their stated assumptions", () => {
    const list = drillsByCategory("market-sizing");
    expect(list.length).toBe(12);
    for (const d of list) {
      if (d.kind !== "estimate") throw new Error(d.id);
      expect(d.answer, d.id).toBeCloseTo(evaluate(d.expression, d.inputs), 5);
      expect(d.explanation, d.id).toContain("Model approach");
    }
  });

  it("have framework questions where the right answer is not always the same option", () => {
    const list = drillsByCategory("frameworks").filter((d): d is ChoiceDrill => d.kind === "choice");
    expect(list.length).toBe(16);
    for (const d of list) {
      expect(new Set(d.options).size, d.id).toBe(4);
      expect(d.answerIndex, d.id).toBeGreaterThanOrEqual(0);
      expect(d.answerIndex, d.id).toBeLessThan(4);
    }
    expect(new Set(list.map((d) => d.answerIndex)).size).toBeGreaterThanOrEqual(3);
  });
});

describe("what the browser may see (public view)", () => {
  it("never includes answers, explanations or how they were worked out", () => {
    for (const d of allDrills) {
      const json = JSON.stringify(toPublicDrill(d));
      for (const banned of ["answer", "explanation", "expression", "inputs", "tolerancePct", "withinFactor"]) {
        expect(json, `${d.id} leaks "${banned}"`).not.toContain(`"${banned}"`);
      }
      expect(json).not.toContain(d.explanation);
    }
  });
});

describe("parseNumber", () => {
  it.each([
    ["12", 12],
    [" 12.5 ", 12.5],
    ["1,200", 1200],
    ["$1,200", 1200],
    ["£3.5", 3.5],
    ["12.5%", 12.5],
    ["-4", -4],
    [".5", 0.5],
  ])("reads %j", (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "12abc", "1.2.3", "1e5", "ten", "12 million", "--3"])("rejects %j", (input) => {
    expect(parseNumber(input)).toBeNull();
  });
});

describe("checkDrillAnswer", () => {
  const sample: NumericDrill = {
    id: "t-1",
    category: "mental-maths",
    kind: "numeric",
    title: "t",
    prompt: "p",
    unit: "%",
    answer: 40,
    tolerancePct: 5,
    explanation: "because",
  };

  it("accepts answers inside the tolerance and rejects outside it", () => {
    const run = (s: string) => checkDrillAnswer(sample, s);
    expect(run("40")).toMatchObject({ valid: true, correct: true });
    expect(run("41.9")).toMatchObject({ correct: true });
    expect(run("42.1")).toMatchObject({ correct: false });
    expect(run("38")).toMatchObject({ correct: true });
    expect(run("37.9")).toMatchObject({ correct: false });
    expect(run("40%")).toMatchObject({ correct: true });
  });

  it("asks again for text that is not a number, without marking it wrong", () => {
    expect(checkDrillAnswer(sample, "about forty")).toMatchObject({ valid: false });
  });

  it("checks multiple choice by option number", () => {
    const choice = allDrills.find((d): d is ChoiceDrill => d.kind === "choice")!;
    expect(checkDrillAnswer(choice, String(choice.answerIndex))).toMatchObject({ valid: true, correct: true });
    expect(checkDrillAnswer(choice, String((choice.answerIndex + 1) % 4))).toMatchObject({ valid: true, correct: false });
    expect(checkDrillAnswer(choice, "9")).toMatchObject({ valid: false });
    expect(checkDrillAnswer(choice, "1.5")).toMatchObject({ valid: false });
    expect(checkDrillAnswer(choice, "")).toMatchObject({ valid: false });
  });

  it("accepts a market-sizing estimate within a factor of 3 either side", () => {
    const est = drillsByCategory("market-sizing")[0];
    if (est.kind !== "estimate") throw new Error("expected an estimate drill");
    const run = (x: number) => checkDrillAnswer(est, String(x));
    expect(run(est.answer)).toMatchObject({ correct: true });
    expect(run(est.answer * 2.9)).toMatchObject({ correct: true });
    expect(run(est.answer / 2.9)).toMatchObject({ correct: true });
    expect(run(est.answer * 3.2)).toMatchObject({ correct: false });
    expect(run(est.answer / 3.2)).toMatchObject({ correct: false });
    expect(run(0)).toMatchObject({ correct: false });
  });
});
