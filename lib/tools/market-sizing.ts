// The market sizing calculator's maths (rule 2.9: every formula here is unit-tested in
// tests/tools-market-sizing.test.ts). A top-down estimate is a chain: a starting
// number, then steps that multiply by a share (%), multiply by a number, or divide
// by a number. An optional average price turns units into money.
//
// Sensitivity: each assumption carries a range ("could be off by ±20%"). Moving one
// assumption to the bottom and top of its range, with everything else held still,
// gives a low and a high answer. The assumption with the widest swing is the one
// the answer is most sensitive to.

export type StepOp = "percent" | "multiply" | "divide";

export const STEP_OPS: { value: StepOp; label: string; symbol: string }[] = [
  { value: "percent", label: "× a share (%)", symbol: "×" },
  { value: "multiply", label: "× a number", symbol: "×" },
  { value: "divide", label: "÷ a number", symbol: "÷" },
];

/** How far off each assumption could be, as offered in the calculator. */
export const RANGE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 40, 50] as const;

export const MAX_STEPS = 10;

export type SizingStep = { label: string; op: StepOp; value: number; rangePct: number };

export type SizingInput = {
  start: { label: string; value: number; rangePct: number };
  steps: SizingStep[];
  /** Average price per unit. Leave out (or null) for a count only. */
  price?: { value: number; rangePct: number } | null;
};

export type SizingIssue = { field: "start" | "price" | number; message: string };

export type ChainRow = { label: string; op: StepOp | "start"; value: number; factor: number; runningTotal: number };

export type SensitivityRow = {
  field: "start" | "price" | number;
  label: string;
  rangePct: number;
  low: number;
  high: number;
  /** high minus low, always zero or more */
  swing: number;
  /** the swing as a share of the base answer, in percent */
  swingPct: number;
};

export type SizingResult =
  | {
      ok: true;
      chain: ChainRow[];
      units: number;
      marketValue: number | null;
      /** the figure the sensitivity is measured on: the market value if there is a price, otherwise units */
      base: number;
      sensitivity: SensitivityRow[];
      /** index into `sensitivity` of the widest swing, or null if nothing moves the answer */
      mostSensitive: number | null;
      /** true when every assumption with a range moves the answer by the same amount */
      allEqual: boolean;
    }
  | { ok: false; issues: SizingIssue[] };

/** The multiplier a step applies to the running total. */
export function stepFactor(op: StepOp, value: number): number {
  switch (op) {
    case "percent":
      return value / 100;
    case "multiply":
      return value;
    case "divide":
      return 1 / value;
  }
}

function checkValue(value: number, op: StepOp | "start" | "price"): string | null {
  if (!Number.isFinite(value)) return "Enter a number.";
  if (value < 0) return "Use a number of zero or more.";
  if (op === "percent" && value > 100) return "A share can't be more than 100%. To scale up, choose \"× a number\".";
  if (op === "divide" && value === 0) return "You can't divide by zero.";
  return null;
}

function checkRange(rangePct: number): string | null {
  if (!Number.isFinite(rangePct) || rangePct < 0 || rangePct >= 100) return "The range must be at least 0% and below 100%.";
  return null;
}

export function validateSizing(input: SizingInput): SizingIssue[] {
  const issues: SizingIssue[] = [];
  const startProblem = checkValue(input.start.value, "start") ?? checkRange(input.start.rangePct);
  if (startProblem) issues.push({ field: "start", message: startProblem });
  if (input.steps.length > MAX_STEPS) issues.push({ field: input.steps.length - 1, message: `Use at most ${MAX_STEPS} steps.` });
  input.steps.forEach((step, i) => {
    const problem = checkValue(step.value, step.op) ?? checkRange(step.rangePct);
    if (problem) issues.push({ field: i, message: problem });
  });
  if (input.price) {
    const priceProblem = checkValue(input.price.value, "price") ?? checkRange(input.price.rangePct);
    if (priceProblem) issues.push({ field: "price", message: priceProblem });
  }
  return issues;
}

/** Units at the end of the chain. Assumes the input has been validated. */
export function chainUnits(startValue: number, steps: Pick<SizingStep, "op" | "value">[]): number {
  return steps.reduce((total, step) => total * stepFactor(step.op, step.value), startValue);
}

/** A value moved by a fraction of itself, kept inside what the step allows (a share stays at or under 100%). */
export function nudge(value: number, op: StepOp | "start" | "price", fraction: number): number {
  const moved = value * (1 + fraction);
  return op === "percent" ? Math.min(100, Math.max(0, moved)) : Math.max(0, moved);
}

function answerWith(input: SizingInput, field: "start" | "price" | number, value: number): number {
  const start = field === "start" ? value : input.start.value;
  const steps = input.steps.map((s, i) => (i === field ? { ...s, value } : s));
  const units = chainUnits(start, steps);
  if (!input.price) return units;
  return units * (field === "price" ? value : input.price.value);
}

export function sizeMarket(input: SizingInput): SizingResult {
  const issues = validateSizing(input);
  if (issues.length > 0) return { ok: false, issues };

  const chain: ChainRow[] = [{ label: input.start.label, op: "start", value: input.start.value, factor: 1, runningTotal: input.start.value }];
  let total = input.start.value;
  for (const step of input.steps) {
    const factor = stepFactor(step.op, step.value);
    total *= factor;
    chain.push({ label: step.label, op: step.op, value: step.value, factor, runningTotal: total });
  }
  const units = total;
  const marketValue = input.price ? units * input.price.value : null;
  const base = marketValue ?? units;

  const assumptions: { field: "start" | "price" | number; label: string; value: number; op: StepOp | "start" | "price"; rangePct: number }[] = [
    { field: "start", label: input.start.label, value: input.start.value, op: "start", rangePct: input.start.rangePct },
    ...input.steps.map((s, i) => ({ field: i, label: s.label, value: s.value, op: s.op, rangePct: s.rangePct })),
    ...(input.price ? [{ field: "price" as const, label: "Average price", value: input.price.value, op: "price" as const, rangePct: input.price.rangePct }] : []),
  ];

  const sensitivity: SensitivityRow[] = assumptions.map((a) => {
    const r = a.rangePct / 100;
    const down = answerWith(input, a.field, nudge(a.value, a.op, -r));
    const up = answerWith(input, a.field, nudge(a.value, a.op, r));
    const low = Math.min(down, up);
    const high = Math.max(down, up);
    const swing = high - low;
    return { field: a.field, label: a.label, rangePct: a.rangePct, low, high, swing, swingPct: base > 0 ? (swing / base) * 100 : 0 };
  });

  let mostSensitive: number | null = null;
  sensitivity.forEach((row, i) => {
    if (row.swing <= 0) return;
    if (mostSensitive === null || row.swing > sensitivity[mostSensitive].swing * (1 + 1e-9)) mostSensitive = i;
  });
  const moving = sensitivity.filter((r) => r.swing > 0);
  const allEqual = moving.length > 1 && moving.every((r) => Math.abs(r.swing - moving[0].swing) <= Math.abs(moving[0].swing) * 1e-9);

  return { ok: true, chain, units, marketValue, base, sensitivity, mostSensitive, allEqual };
}
