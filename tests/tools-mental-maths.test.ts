import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/drills/rng";
import { COMMA_DECIMAL_MESSAGE, parseNumberInput } from "@/lib/tools/format";
import {
  ALL_TOPICS,
  checkAnswer,
  exactShort,
  exampleQuestions,
  formatAnswer,
  kindsForTopics,
  makeQuestion,
  nextQuestion,
  QUESTION_KINDS,
  randomSeed,
  TOPICS,
  type MathsQuestion,
  type QuestionKind,
} from "@/lib/tools/mental-maths";

// Rule 2.9: every generated answer is recomputed here with its own formula, from the
// inputs the question was built from.
const RECOMPUTE: Record<QuestionKind, (i: Record<string, number>) => number> = {
  "percent-of": (i) => (i.base * i.pct) / 100,
  "percent-change": (i) => (Math.abs(i.after - i.before) / i.before) * 100,
  fraction: (i) => (i.num / i.den) * 100,
  "two-years": (i) => i.start * (1 + i.rate / 100) ** 2,
  "up-then-down": (i) => i.start * (1 + i.up / 100) * (1 - i.down / 100),
  "yearly-rate": (i) => (Math.sqrt(i.end / i.start) - 1) * 100,
  margin: (i) => ((i.revenue - i.costs) / i.revenue) * 100,
  "profit-per-unit": (i) => (i.price * i.margin) / 100,
  divide: (i) => i.total / i.count,
  multiply: (i) => i.people * i.spend,
  "breakeven-units": (i) => i.fixed / (i.price - i.variable),
  "breakeven-price": (i) => i.variable + i.fixed / i.volume,
  payback: (i) => i.investment / i.profit,
};

function many(kind: QuestionKind, count = 300): MathsQuestion[] {
  const rng = makeRng(kind.length * 7919);
  return Array.from({ length: count }, () => makeQuestion(rng, kind));
}

describe("tools: mental maths questions", () => {
  it("covers every topic, and every kind belongs to a topic", () => {
    expect(TOPICS.map((t) => t.id)).toEqual(ALL_TOPICS);
    expect(kindsForTopics(ALL_TOPICS).sort()).toEqual([...QUESTION_KINDS].sort());
    for (const topic of ALL_TOPICS) expect(kindsForTopics([topic]).length).toBeGreaterThan(0);
  });

  for (const kind of QUESTION_KINDS) {
    it(`${kind}: every answer is right, recomputed from its inputs`, () => {
      for (const q of many(kind)) {
        expect(q.kind).toBe(kind);
        expect(Number.isFinite(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeCloseTo(RECOMPUTE[kind](q.inputs), 6);
        expect(q.prompt).not.toMatch(/NaN|Infinity|undefined/);
        expect(q.explanation).not.toMatch(/NaN|Infinity|undefined/);
        // The worked line ends at the right answer.
        expect(q.explanation.replace(/,/g, "")).toContain(String(Math.round(q.answer * 100) / 100));
      }
    });

    it(`${kind}: the correct answer is accepted, as shown and typed plainly`, () => {
      for (const q of many(kind, 60)) {
        expect(checkAnswer(q, formatAnswer(q)).valid && checkAnswer(q, formatAnswer(q))).toMatchObject({ correct: true });
        expect(checkAnswer(q, String(q.answer))).toMatchObject({ valid: true, correct: true });
        const wrong = q.answer * 1.1 + 1;
        expect(checkAnswer(q, String(wrong))).toMatchObject({ valid: true, correct: false });
      }
    });
  }

  it("accepts short forms for big numbers", () => {
    const rng = makeRng(42);
    const divide = makeQuestion(rng, "divide");
    expect(checkAnswer(divide, `${divide.answer / 1000}k`)).toMatchObject({ correct: true });
    const multiply = makeQuestion(rng, "multiply");
    expect(checkAnswer(multiply, `${multiply.answer / 1e6}m`)).toMatchObject({ correct: true });
    expect(checkAnswer(multiply, `${multiply.answer / 1e6} million`)).toMatchObject({ correct: true });
    expect(checkAnswer(multiply, `${multiply.answer / 1e5}m`)).toMatchObject({ correct: false }); // a slipped zero is wrong
  });

  it("writes big numbers in words only when the words are exact (rule 2.9)", () => {
    expect(exactShort(1_125_000_000)).toBe("1.125 billion");
    expect(exactShort(1_875_000_000)).toBe("1.875 billion");
    expect(exactShort(37_500_000)).toBe("37.5 million");
    expect(exactShort(6_000_000)).toBe("6 million");
    expect(exactShort(450_000)).toBe("450,000");
  });

  for (const kind of ["multiply", "divide"] as const) {
    it(`${kind}: every figure in words in the working is exact, and typing it counts as right`, () => {
      for (const q of many(kind, 3000)) {
        const exact = new Set([q.answer, q.inputs.total, q.inputs.people].filter((v) => v !== undefined));
        const figures = [...q.explanation.matchAll(/(\d[\d,]*(?:\.\d+)?) (million|billion)/g)];
        expect(figures.length, q.explanation).toBeGreaterThan(0);
        for (const [text] of figures) {
          const parsed = parseNumberInput(text);
          expect(parsed.kind, text).toBe("number");
          const value = parsed.kind === "number" ? parsed.value : NaN;
          expect([...exact].some((v) => Math.abs(v - value) < 1e-6), `${text} in: ${q.explanation}`).toBe(true);
          if (Math.abs(value - q.answer) < 1e-6) expect(checkAnswer(q, text.replace(" ", ""))).toMatchObject({ valid: true, correct: true });
        }
        // The short form the working suggests typing ("1,125m") counts as right too.
        const suggested = /You can type it as ([\d,.]+m)\./.exec(q.explanation);
        if (kind === "multiply") expect(checkAnswer(q, suggested![1]), q.explanation).toMatchObject({ valid: true, correct: true });
      }
    });
  }

  it("the multiply working never shows a rounded figure (45 × 25 million is $1.125 billion, not $1.13 billion)", () => {
    const seen = new Set<string>();
    for (const q of many("multiply", 3000)) seen.add(`${q.inputs.people}x${q.inputs.spend}`);
    // 16 audiences × 11 spends: the generator reaches every combination in 3,000 tries.
    expect(seen.size).toBe(176);
    const q = many("multiply", 3000).find((m) => m.inputs.people === 45e6 && m.inputs.spend === 25)!;
    expect(q.explanation).toContain("$1.125 billion, or $1,125,000,000");
    expect(q.explanation).not.toContain("1.13 billion");
  });

  it("asks for a decimal point when an answer uses a decimal comma, instead of reading 82,5 as 825", () => {
    const q = makeQuestion(makeRng(11), "up-then-down");
    expect(checkAnswer(q, "82,5")).toEqual({ valid: false, message: COMMA_DECIMAL_MESSAGE });
    expect(checkAnswer(q, "1,125m")).toMatchObject({ valid: true });
  });

  it("accepts a $ million answer typed as millions or in full", () => {
    const q = makeQuestion(makeRng(7), "two-years");
    expect(q.unit).toBe("$ million");
    expect(checkAnswer(q, String(q.answer))).toMatchObject({ correct: true });
    expect(checkAnswer(q, `${q.answer}m`)).toMatchObject({ correct: true });
    expect(checkAnswer(q, String(q.answer * 1e6))).toMatchObject({ correct: true });
    expect(checkAnswer(q, String(q.answer * 1e3))).toMatchObject({ correct: false });
  });

  it("allows rounding only where the answer needs it", () => {
    const twoThirds: MathsQuestion = { ...makeQuestion(makeRng(1), "fraction"), answer: 200 / 3, inputs: { num: 2, den: 3 }, tolerance: { abs: 0.5, rel: 0 } };
    for (const typed of ["66.7", "66.67", "67", "66.5", "67%"]) expect(checkAnswer(twoThirds, typed), typed).toMatchObject({ correct: true });
    for (const typed of ["66", "68", "0.667"]) expect(checkAnswer(twoThirds, typed), typed).toMatchObject({ correct: false });
    // Every repeating fraction allows half a point; exact ones a twentieth.
    for (const q of many("fraction")) {
      const repeating = Math.abs(q.answer * 100 - Math.round(q.answer * 100)) > 1e-9;
      expect(q.tolerance.abs).toBe(repeating ? 0.5 : 0.05);
    }
    const exact = makeQuestion(makeRng(3), "percent-of");
    expect(checkAnswer(exact, String(exact.answer + 1))).toMatchObject({ correct: false });
  });

  it("says what is wrong with an answer that is not a number", () => {
    const q = makeQuestion(makeRng(5), "margin");
    expect(checkAnswer(q, "")).toMatchObject({ valid: false });
    expect(checkAnswer(q, "about twenty")).toMatchObject({ valid: false });
  });

  it("formats answers the way people say them", () => {
    expect(formatAnswer({ answer: 15, unit: "%" })).toBe("15%");
    expect(formatAnswer({ answer: 4_000_000, unit: "$" })).toBe("$4,000,000");
    expect(formatAnswer({ answer: 484, unit: "$ million" })).toBe("$484 million");
    expect(formatAnswer({ answer: 8000, unit: "units" })).toBe("8,000 units");
    expect(formatAnswer({ answer: 1, unit: "years" })).toBe("1 year");
    expect(formatAnswer({ answer: 2.5, unit: "years" })).toBe("2.5 years");
    expect(formatAnswer({ answer: 54, unit: "" })).toBe("54");
  });

  it("picks only from the chosen topics and avoids repeats in a round", () => {
    const rng = makeRng(99);
    const asked = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const q = nextQuestion(rng, ["margins", "break-even"], asked);
      expect(["margins", "break-even"]).toContain(q.topic);
      expect(asked.has(q.prompt)).toBe(false);
      asked.add(q.prompt);
    }
    // No topics chosen means all of them.
    const topics = new Set(Array.from({ length: 200 }, () => nextQuestion(rng, []).topic));
    expect([...topics].sort()).toEqual([...ALL_TOPICS].sort());
  });

  it("gives the same worked examples every time, one per topic", () => {
    const a = exampleQuestions();
    expect(a.map((q) => q.prompt)).toEqual(exampleQuestions().map((q) => q.prompt));
    expect(new Set(a.map((q) => q.topic)).size).toBe(a.length);
    for (const q of a) expect(q.answer).toBeCloseTo(RECOMPUTE[q.kind](q.inputs), 6);
  });

  it("makes fresh seeds", () => {
    const seeds = new Set(Array.from({ length: 20 }, () => randomSeed()));
    expect(seeds.size).toBeGreaterThan(15);
  });
});
