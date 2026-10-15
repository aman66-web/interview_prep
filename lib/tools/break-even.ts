// The break-even calculator's maths (rule 2.9: tested in tests/tools-break-even.test.ts).
//
//   contribution per unit = price - variable cost per unit
//   contribution margin   = contribution per unit / price
//   break-even volume     = fixed costs / contribution per unit
//   break-even revenue    = fixed costs / contribution margin   (= break-even volume x price)
//   profit at a volume    = volume x contribution per unit - fixed costs
//   payback               = upfront investment / yearly profit
//
// Fixed costs and the expected volume are per year, so payback comes out in years.

export type BreakEvenInput = {
  fixedCosts: number;
  price: number;
  variableCost: number;
  /** Upfront investment to pay back. 0 or null when there is none. */
  investment?: number | null;
  /** Expected units sold per year. null when not given. */
  expectedVolume?: number | null;
};

export type BreakEvenIssue = { field: keyof BreakEvenInput; message: string };

export type Payback =
  | { kind: "no-investment" }
  | { kind: "needs-volume" }
  | { kind: "never"; yearlyProfit: number }
  | { kind: "years"; years: number; yearlyProfit: number };

export type BreakEvenResult =
  | { ok: false; issues: BreakEvenIssue[] }
  /** Each unit makes nothing or loses money, so no volume breaks even. */
  | { ok: true; breaksEven: false; contribution: number; contributionMargin: number | null; profitAtExpected: number | null }
  | {
      ok: true;
      breaksEven: true;
      contribution: number;
      /** a fraction: 0.4 means 40% of the price */
      contributionMargin: number;
      /** exact volume (can be a fraction of a unit) */
      breakEvenUnits: number;
      /** whole units you need to sell to cover the fixed costs */
      breakEvenUnitsWhole: number;
      breakEvenRevenue: number;
      profitAtExpected: number | null;
      /** how far expected sales could fall before a loss, as a fraction of expected sales; null without a volume */
      marginOfSafety: number | null;
      payback: Payback;
    };

function nonNegative(value: number | null | undefined, field: keyof BreakEvenInput, label: string, issues: BreakEvenIssue[], required: boolean) {
  if (value === null || value === undefined) {
    if (required) issues.push({ field, message: `Enter the ${label}.` });
    return;
  }
  if (!Number.isFinite(value)) issues.push({ field, message: `Enter the ${label} as a number.` });
  else if (value < 0) issues.push({ field, message: `The ${label} can't be negative.` });
}

export function validateBreakEven(input: BreakEvenInput): BreakEvenIssue[] {
  const issues: BreakEvenIssue[] = [];
  nonNegative(input.fixedCosts, "fixedCosts", "fixed costs", issues, true);
  nonNegative(input.price, "price", "price per unit", issues, true);
  nonNegative(input.variableCost, "variableCost", "variable cost per unit", issues, true);
  nonNegative(input.investment, "investment", "investment", issues, false);
  nonNegative(input.expectedVolume, "expectedVolume", "expected volume", issues, false);
  return issues;
}

/** Whole units: 7,999.0000001 (floating-point dust) stays 8,000, a real fraction rounds up. */
export function wholeUnitsNeeded(units: number): number {
  const nearest = Math.round(units);
  return Math.abs(units - nearest) < 1e-9 ? nearest : Math.ceil(units);
}

export function breakEven(input: BreakEvenInput): BreakEvenResult {
  const issues = validateBreakEven(input);
  if (issues.length > 0) return { ok: false, issues };

  const { fixedCosts, price, variableCost } = input;
  const contribution = price - variableCost;
  const volume = input.expectedVolume ?? null;
  const profitAtExpected = volume === null ? null : volume * contribution - fixedCosts;

  if (contribution <= 0) {
    return {
      ok: true,
      breaksEven: false,
      contribution,
      contributionMargin: price > 0 ? contribution / price : null,
      profitAtExpected,
    };
  }

  const contributionMargin = contribution / price; // price > variable cost >= 0, so price > 0
  const breakEvenUnits = fixedCosts / contribution;
  const breakEvenRevenue = fixedCosts / contributionMargin;

  const investment = input.investment ?? 0;
  let payback: Payback;
  if (investment === 0) payback = { kind: "no-investment" };
  else if (profitAtExpected === null) payback = { kind: "needs-volume" };
  else if (profitAtExpected <= 0) payback = { kind: "never", yearlyProfit: profitAtExpected };
  else payback = { kind: "years", years: investment / profitAtExpected, yearlyProfit: profitAtExpected };

  return {
    ok: true,
    breaksEven: true,
    contribution,
    contributionMargin,
    breakEvenUnits,
    breakEvenUnitsWhole: wholeUnitsNeeded(breakEvenUnits),
    breakEvenRevenue,
    profitAtExpected,
    marginOfSafety: volume !== null && volume > 0 ? (volume - breakEvenUnits) / volume : null,
    payback,
  };
}

/** Points for the cost-and-revenue picture: revenue and total cost from 0 to `maxUnits`. */
export function breakEvenLines(input: Pick<BreakEvenInput, "fixedCosts" | "price" | "variableCost">, maxUnits: number) {
  return {
    revenueAt: (units: number) => units * input.price,
    costAt: (units: number) => input.fixedCosts + units * input.variableCost,
    maxUnits,
    maxMoney: Math.max(maxUnits * input.price, input.fixedCosts + maxUnits * input.variableCost),
  };
}
