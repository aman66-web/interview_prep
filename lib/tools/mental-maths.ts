import { makeRng, pick, type Rng } from "@/lib/drills/rng";
import { formatCompact, formatNumber, invalidNumberMessage, parseNumberInput } from "./format";

// Questions for the free mental maths trainer (/tools/mental-maths-trainer). They are
// generated in the visitor's browser, so this file is separate from the drills on
// /drills (whose answers stay on the server). Every question keeps the inputs it was
// built from, and tests/tools-mental-maths.test.ts recomputes each answer from them
// with its own formula (rule 2.9).

export type Topic = "percentages" | "growth" | "margins" | "zeros" | "break-even";

export const TOPICS: { id: Topic; label: string; blurb: string }[] = [
  { id: "percentages", label: "Percentages", blurb: "Shares, percentage change and fractions" },
  { id: "growth", label: "Growth", blurb: "Compound growth over two years" },
  { id: "margins", label: "Margins", blurb: "Profit margin and profit per unit" },
  { id: "zeros", label: "Big numbers", blurb: "Multiplying and dividing with lots of zeros" },
  { id: "break-even", label: "Break-even", blurb: "Break-even volume, price and payback" },
];

export const ALL_TOPICS: Topic[] = TOPICS.map((t) => t.id);

export const ROUND_LENGTHS = [60, 120, 180] as const;

export type QuestionKind =
  | "percent-of"
  | "percent-change"
  | "fraction"
  | "two-years"
  | "up-then-down"
  | "yearly-rate"
  | "margin"
  | "profit-per-unit"
  | "divide"
  | "multiply"
  | "breakeven-units"
  | "breakeven-price"
  | "payback";

export type Unit = "" | "%" | "$" | "$ million" | "units" | "years";

export type MathsQuestion = {
  topic: Topic;
  kind: QuestionKind;
  prompt: string;
  answer: number;
  unit: Unit;
  /** The answer is counted in this many: 1e6 for "$ million". Typing the full number (or 484m) is accepted too. */
  scale: number;
  /** An answer is right when it is within this many of the answer (absolute), or this fraction of it (relative). */
  tolerance: { abs: number; rel: number };
  explanation: string;
  inputs: Record<string, number>;
};

const EXACT = { abs: 1e-9, rel: 1e-9 };
const n = (x: number, digits = 2) => formatNumber(x, digits);
const isWhole = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
const clean = (x: number) => Math.round(x * 1e9) / 1e9;

/**
 * A big number in words that is exactly the number, never rounded: 1.125 billion, not
 * 1.13 billion (the trainer marks answers exactly, so a rounded short form would be
 * marked wrong if typed). Falls back to the full number if no short form is exact.
 */
export function exactShort(x: number): string {
  for (const [size, word] of [
    [1e9, "billion"],
    [1e6, "million"],
  ] as const) {
    if (Math.abs(x) < size) continue;
    const text = `${n(x / size, 6)} ${word}`;
    const back = parseNumberInput(text);
    if (back.kind === "number" && Math.abs(back.value - x) < 1e-6) return text;
  }
  return n(x);
}

type Maker = (rng: Rng) => MathsQuestion | null;

const makers: Record<QuestionKind, { topic: Topic; make: Maker }> = {
  "percent-of": {
    topic: "percentages",
    make(rng) {
      const pct = pick(rng, [5, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 60, 75]);
      const base = pick(rng, [40, 60, 80, 120, 160, 240, 320, 360, 480, 640, 800, 1200, 1600, 2400, 3600, 4800]);
      const answer = clean((base * pct) / 100);
      if (!isWhole(answer)) return null;
      return {
        topic: "percentages",
        kind: "percent-of",
        prompt: `What is ${n(pct)}% of ${n(base)}?`,
        answer,
        unit: "",
        scale: 1,
        tolerance: EXACT,
        explanation: `10% of ${n(base)} is ${n(base / 10)}, so ${n(pct)}% is ${n(base / 10)} × ${n(pct / 10)} = ${n(answer)}.`,
        inputs: { pct, base },
      };
    },
  },
  "percent-change": {
    topic: "percentages",
    make(rng) {
      const before = pick(rng, [40, 50, 60, 80, 120, 160, 200, 250, 400, 500]);
      const pct = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
      const up = rng() < 0.5;
      const after = clean(before * (1 + (up ? pct : -pct) / 100));
      if (!isWhole(after)) return null;
      return {
        topic: "percentages",
        kind: "percent-change",
        prompt: `Sales ${up ? "rose" : "fell"} from $${n(before)}m to $${n(after)}m. By what percentage did they ${up ? "rise" : "fall"}?`,
        answer: pct,
        unit: "%",
        scale: 1,
        tolerance: { abs: 0.05, rel: 0 },
        explanation: `The change is $${n(Math.abs(after - before))}m. Divide by where you started: ${n(Math.abs(after - before))} ÷ ${n(before)} = ${n(pct)}%.`,
        inputs: { before, after },
      };
    },
  },
  fraction: {
    topic: "percentages",
    make(rng) {
      const [num, den] = pick(rng, [
        [1, 3],
        [2, 3],
        [1, 6],
        [5, 6],
        [1, 8],
        [3, 8],
        [5, 8],
        [7, 8],
        [3, 4],
        [2, 5],
        [3, 20],
        [7, 20],
        [1, 12],
        [1, 16],
      ] as const);
      const answer = (num / den) * 100;
      const repeating = !isWhole(answer * 100);
      return {
        topic: "percentages",
        kind: "fraction",
        prompt: `What is ${num}/${den} as a percentage?`,
        answer,
        unit: "%",
        scale: 1,
        // A repeating decimal is fine to round: 66.7 or 67 for two thirds.
        tolerance: repeating ? { abs: 0.5, rel: 0 } : { abs: 0.05, rel: 0 },
        explanation: `${num} ÷ ${den} = ${n(answer / 100, 4)}, which is ${n(answer)}%.${repeating ? " Rounding to one decimal place is fine." : ""}`,
        inputs: { num, den },
      };
    },
  },
  "two-years": {
    topic: "growth",
    make(rng) {
      const start = pick(rng, [100, 200, 250, 300, 400, 500, 800, 1000]);
      const rate = pick(rng, [10, 20, 50]);
      const answer = clean(start * Math.pow(1 + rate / 100, 2));
      if (!isWhole(answer * 10)) return null;
      const year1 = clean(start * (1 + rate / 100));
      return {
        topic: "growth",
        kind: "two-years",
        prompt: `Revenue is $${n(start)}m and grows ${rate}% a year. What is it after 2 years, in $ million?`,
        answer,
        unit: "$ million",
        scale: 1e6,
        tolerance: EXACT,
        explanation: `Year 1: ${n(start)} × ${n(1 + rate / 100)} = ${n(year1)}. Year 2: ${n(year1)} × ${n(1 + rate / 100)} = ${n(answer)}. Growth compounds, so the answer is more than adding ${rate}% twice ($${n(start * (1 + (2 * rate) / 100))}m).`,
        inputs: { start, rate },
      };
    },
  },
  "up-then-down": {
    topic: "growth",
    make(rng) {
      const start = pick(rng, [100, 200, 400, 500, 800]);
      const up = pick(rng, [10, 20, 25, 50]);
      const down = pick(rng, [10, 20, 25, 50]);
      const answer = clean(start * (1 + up / 100) * (1 - down / 100));
      if (!isWhole(answer * 10)) return null;
      return {
        topic: "growth",
        kind: "up-then-down",
        prompt: `Sales of $${n(start)}m rise ${up}% one year, then fall ${down}% the next. What are sales now, in $ million?`,
        answer,
        unit: "$ million",
        scale: 1e6,
        tolerance: EXACT,
        explanation: `Multiply the two changes: ${n(start)} × ${n(1 + up / 100)} × ${n(1 - down / 100)} = ${n(answer)}. A rise and a fall of similar size never cancel out exactly.`,
        inputs: { start, up, down },
      };
    },
  },
  "yearly-rate": {
    topic: "growth",
    make(rng) {
      const start = pick(rng, [100, 200, 400, 500]);
      const rate = pick(rng, [10, 20, 50]);
      const end = clean(start * Math.pow(1 + rate / 100, 2));
      if (!isWhole(end)) return null;
      const multiple = clean(end / start);
      return {
        topic: "growth",
        kind: "yearly-rate",
        prompt: `A market grew from $${n(start)}m to $${n(end)}m over 2 years at a steady rate. What was the yearly growth rate?`,
        answer: rate,
        unit: "%",
        scale: 1,
        tolerance: { abs: 0.05, rel: 0 },
        explanation: `${n(end)} ÷ ${n(start)} = ${n(multiple)}, and ${n(multiple)} = ${n(1 + rate / 100)} × ${n(1 + rate / 100)}, so ${rate}% a year. Halving the total growth (${n(((multiple - 1) * 100) / 2)}%) overstates it.`,
        inputs: { start, end },
      };
    },
  },
  margin: {
    topic: "margins",
    make(rng) {
      const revenue = pick(rng, [200, 250, 400, 500, 800, 1000, 1200]);
      const margin = pick(rng, [5, 8, 10, 12, 15, 20, 25, 30, 40]);
      const costs = clean((revenue * (100 - margin)) / 100);
      if (!isWhole(costs)) return null;
      return {
        topic: "margins",
        kind: "margin",
        prompt: `Revenue is $${n(revenue)}m and total costs are $${n(costs)}m. What is the profit margin?`,
        answer: margin,
        unit: "%",
        scale: 1,
        tolerance: { abs: 0.05, rel: 0 },
        explanation: `Profit is ${n(revenue)} − ${n(costs)} = $${n(revenue - costs)}m. Margin is profit ÷ revenue: ${n(revenue - costs)} ÷ ${n(revenue)} = ${n(margin)}%.`,
        inputs: { revenue, costs },
      };
    },
  },
  "profit-per-unit": {
    topic: "margins",
    make(rng) {
      const price = pick(rng, [20, 40, 50, 60, 80, 120, 150, 200]);
      const margin = pick(rng, [10, 15, 20, 25, 30, 40, 50, 60]);
      const answer = clean((price * margin) / 100);
      if (!isWhole(answer * 2)) return null;
      return {
        topic: "margins",
        kind: "profit-per-unit",
        prompt: `A product sells for $${n(price)} at a ${margin}% profit margin. What is the profit on each one, in $?`,
        answer,
        unit: "$",
        scale: 1,
        tolerance: EXACT,
        explanation: `The margin is a share of the price: ${margin}% of $${n(price)} = $${n(answer)}. The cost is the rest, $${n(price - answer)}.`,
        inputs: { price, margin },
      };
    },
  },
  divide: {
    topic: "zeros",
    make(rng) {
      const each = pick(rng, [2, 3, 4, 5, 6, 8, 12, 15, 20, 25, 40, 50, 75]) * pick(rng, [1e3, 1e4, 1e5, 1e6]);
      const count = pick(rng, [200, 300, 400, 500, 600, 800, 1200, 1500, 2000, 2500, 4000, 5000]);
      const total = each * count;
      const shown = formatCompact(total);
      const back = parseNumberInput(shown.replace(" ", ""));
      // Only use totals whose short form is exact, so the question is fair.
      if (back.kind !== "number" || Math.abs(back.value - total) > 1e-6 || total < 1e6) return null;
      const template = pick(rng, [
        (c: string) => `Sales of $${shown} are split across ${c} stores. What are sales per store, in $?`,
        (c: string) => `A budget of $${shown} is shared equally by ${c} branches. How much does each branch get, in $?`,
        (c: string) => `Spending of $${shown} is spread evenly across ${c} hospitals. How much is that per hospital, in $?`,
      ]);
      return {
        topic: "zeros",
        kind: "divide",
        prompt: template(n(count)),
        answer: each,
        unit: "$",
        scale: 1,
        tolerance: EXACT,
        explanation: `$${shown} ÷ ${n(count)} = $${n(each)}${each >= 1e6 ? ` (${exactShort(each)})` : ""}. Divide the digits first, then count the zeros. Check: ${n(count)} × $${n(each)} gets you back to $${shown}.`,
        inputs: { total, count },
      };
    },
  },
  multiply: {
    topic: "zeros",
    make(rng) {
      const millions = pick(rng, [1.5, 2, 3, 4, 6, 8, 12, 15, 20, 25, 30, 40, 45, 60, 75, 80]);
      const spend = pick(rng, [4, 5, 6, 8, 12, 15, 20, 25, 30, 40, 50]);
      const people = millions * 1e6;
      const answer = people * spend;
      return {
        topic: "zeros",
        kind: "multiply",
        prompt: `${n(millions)} million customers each spend $${n(spend)} a year. What do they spend in total a year, in $?`,
        answer,
        unit: "$",
        scale: 1,
        tolerance: EXACT,
        explanation: `${n(millions)} × ${n(spend)} = ${n(millions * spend)}, and the millions carry over: $${exactShort(answer)}, or $${n(answer)}. You can type it as ${n(millions * spend)}m.`,
        inputs: { people, spend },
      };
    },
  },
  "breakeven-units": {
    topic: "break-even",
    make(rng) {
      const fixed = pick(rng, [60000, 90000, 120000, 150000, 180000, 240000, 300000, 360000, 480000, 600000]);
      const price = pick(rng, [30, 40, 50, 60, 80, 100, 120]);
      const contribution = pick(rng, [10, 15, 20, 25, 30, 40, 60]);
      if (contribution >= price) return null;
      const units = fixed / contribution;
      if (!isWhole(units)) return null;
      const variable = price - contribution;
      return {
        topic: "break-even",
        kind: "breakeven-units",
        prompt: `Fixed costs are $${n(fixed)} a year. Each unit sells for $${n(price)} and costs $${n(variable)} to make. How many units a year break even?`,
        answer: units,
        unit: "units",
        scale: 1,
        tolerance: EXACT,
        explanation: `Each unit contributes $${n(price)} − $${n(variable)} = $${n(contribution)}. Break-even = fixed costs ÷ contribution = ${n(fixed)} ÷ ${n(contribution)} = ${n(units)} units.`,
        inputs: { fixed, price, variable },
      };
    },
  },
  "breakeven-price": {
    topic: "break-even",
    make(rng) {
      const fixed = pick(rng, [100000, 150000, 200000, 240000, 300000, 400000, 500000, 600000]);
      const volume = pick(rng, [5000, 8000, 10000, 20000, 25000, 40000, 50000]);
      const variable = pick(rng, [5, 8, 10, 12, 15, 20, 25, 30]);
      const perUnit = fixed / volume;
      if (!isWhole(perUnit * 2)) return null;
      const answer = clean(variable + perUnit);
      return {
        topic: "break-even",
        kind: "breakeven-price",
        prompt: `A firm expects to sell ${n(volume)} units a year. Fixed costs are $${n(fixed)} a year and each unit costs $${n(variable)} to make. What is the lowest price that breaks even, in $?`,
        answer,
        unit: "$",
        scale: 1,
        tolerance: { abs: 0.005, rel: 0 },
        explanation: `Spread the fixed costs over the volume: ${n(fixed)} ÷ ${n(volume)} = $${n(perUnit)} a unit. Add the variable cost: $${n(perUnit)} + $${n(variable)} = $${n(answer)}.`,
        inputs: { fixed, volume, variable },
      };
    },
  },
  payback: {
    topic: "break-even",
    make(rng) {
      const investment = pick(rng, [20, 30, 45, 60, 80, 90, 120, 150, 200, 240]);
      const profit = pick(rng, [5, 10, 15, 20, 30, 40]);
      const years = investment / profit;
      if (!isWhole(years * 2) || years > 12) return null;
      return {
        topic: "break-even",
        kind: "payback",
        prompt: `A project costs $${n(investment)}m up front and adds $${n(profit)}m of profit a year. How many years until it pays back?`,
        answer: clean(years),
        unit: "years",
        scale: 1,
        tolerance: { abs: 0.05, rel: 0 },
        explanation: `Payback = investment ÷ yearly profit = ${n(investment)} ÷ ${n(profit)} = ${n(years)} years.`,
        inputs: { investment, profit },
      };
    },
  },
};

export const QUESTION_KINDS = Object.keys(makers) as QuestionKind[];

export function kindsForTopics(topics: readonly Topic[]): QuestionKind[] {
  return QUESTION_KINDS.filter((k) => topics.includes(makers[k].topic));
}

/** One question of a given kind (tries until the numbers come out clean). */
export function makeQuestion(rng: Rng, kind: QuestionKind): MathsQuestion {
  for (let i = 0; i < 500; i++) {
    const q = makers[kind].make(rng);
    if (q) return q;
  }
  throw new Error(`Could not make a ${kind} question.`);
}

/**
 * The next question for a round: a random topic from those chosen, avoiding
 * prompts already asked this round where possible.
 */
export function nextQuestion(rng: Rng, topics: readonly Topic[], asked: ReadonlySet<string> = new Set()): MathsQuestion {
  const chosen = topics.length > 0 ? topics : ALL_TOPICS;
  let last: MathsQuestion | null = null;
  for (let i = 0; i < 40; i++) {
    const topic = pick(rng, chosen);
    const q = makeQuestion(rng, pick(rng, kindsForTopics([topic])));
    if (!asked.has(q.prompt)) return q;
    last = q;
  }
  return last!;
}

export type AnswerCheck = { valid: false; message: string } | { valid: true; correct: boolean; given: number };

function within(given: number, q: MathsQuestion) {
  const allowed = Math.max(q.tolerance.abs, Math.abs(q.answer) * q.tolerance.rel, 1e-9);
  return Math.abs(given - q.answer) <= allowed + 1e-12;
}

/** Checks a typed answer. 4m, 4 million and 4,000,000 all count, and so do 15 and 15%. */
export function checkAnswer(q: MathsQuestion, raw: string): AnswerCheck {
  // "8,000 units" and "2.5 years" are fine: the unit word is dropped before reading the number.
  const parsed = parseNumberInput(raw.replace(/\s*(units?|years?|yrs?)\s*$/i, ""));
  if (parsed.kind === "empty") return { valid: false, message: "Type an answer first, or press Skip." };
  if (parsed.kind === "invalid") return { valid: false, message: invalidNumberMessage(parsed, "Type a number, such as 120, 12.5 or 4m.") };
  const given = parsed.value;
  const correct = within(given, q) || (q.scale !== 1 && within(given / q.scale, q));
  return { valid: true, correct, given };
}

/** The right answer as people would say it: 15%, $4,000,000, $484 million, 8,000 units. */
export function formatAnswer(q: Pick<MathsQuestion, "answer" | "unit">): string {
  const value = n(q.answer);
  switch (q.unit) {
    case "%":
      return `${value}%`;
    case "$":
      return `$${value}`;
    case "$ million":
      return `$${value} million`;
    case "units":
      return `${value} units`;
    case "years":
      return `${value} ${q.answer === 1 ? "year" : "years"}`;
    default:
      return value;
  }
}

/** One example of each topic, the same every time (the worked examples on the trainer's page). */
export function exampleQuestions(): MathsQuestion[] {
  const rng = makeRng(20261015);
  const kinds: QuestionKind[] = ["percent-of", "two-years", "margin", "divide", "breakeven-units"];
  return kinds.map((k) => makeQuestion(rng, k));
}

/** A fresh, unpredictable seed for a round (browser or Node). */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0];
}
