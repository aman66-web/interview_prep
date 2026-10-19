// The growth rate calculator's maths (rule 2.9: tested in tests/tools-growth.test.ts).
// Rates go in and come out in percent units (8 means 8% a year).
//
//   CAGR          = (end / start) ^ (1 / years) - 1
//   future value  = value x (1 + rate) ^ years
//   doubling time = ln 2 / ln(1 + rate)          (exact)
//   rule of 72    = 72 / rate in %               (quick estimate)

export type Outcome<T> = { ok: true; value: T } | { ok: false; message: string };

function fail<T>(message: string): Outcome<T> {
  return { ok: false, message };
}

const isNum = (n: number) => Number.isFinite(n);

/** Compound annual growth rate, in %. */
export function cagr(start: number, end: number, years: number): Outcome<number> {
  if (![start, end, years].every(isNum)) return fail("Enter all three numbers.");
  if (start <= 0) return fail("The start value must be above zero (growth from zero can't be measured as a rate).");
  if (end < 0) return fail("The end value can't be negative.");
  if (years <= 0) return fail("The number of years must be above zero.");
  return { ok: true, value: (Math.pow(end / start, 1 / years) - 1) * 100 };
}

/** What a value grows to after `years` at `ratePct` a year. */
export function futureValue(value: number, ratePct: number, years: number): Outcome<number> {
  if (![value, ratePct, years].every(isNum)) return fail("Enter all three numbers.");
  if (ratePct <= -100) return fail("A yearly fall can't be 100% or more.");
  if (years < 0) return fail("The number of years can't be negative.");
  const result = value * Math.pow(1 + ratePct / 100, years);
  if (!isNum(result)) return fail("That number is too big to show. Try fewer years or a lower rate.");
  return { ok: true, value: result };
}

/** Years for something growing at `ratePct` a year to double, exactly. */
export function doublingTimeExact(ratePct: number): Outcome<number> {
  if (!isNum(ratePct)) return fail("Enter a growth rate.");
  if (ratePct <= 0) return fail("Only a positive growth rate ever doubles.");
  return { ok: true, value: Math.LN2 / Math.log1p(ratePct / 100) };
}

/** The rule of 72: a quick estimate of the doubling time in years. */
export function doublingTimeRule72(ratePct: number): Outcome<number> {
  if (!isNum(ratePct)) return fail("Enter a growth rate.");
  if (ratePct <= 0) return fail("Only a positive growth rate ever doubles.");
  return { ok: true, value: 72 / ratePct };
}

/** Exact and rule-of-72 doubling times side by side, with how far the rule is off (in % of the exact answer). */
export function compareDoubling(ratePct: number): Outcome<{ exact: number; rule72: number; errorPct: number }> {
  const exact = doublingTimeExact(ratePct);
  const rule = doublingTimeRule72(ratePct);
  if (!exact.ok) return exact;
  if (!rule.ok) return rule;
  return { ok: true, value: { exact: exact.value, rule72: rule.value, errorPct: ((rule.value - exact.value) / exact.value) * 100 } };
}

/** Rates shown in the comparison table on the growth page. */
export const DOUBLING_TABLE_RATES = [2, 4, 6, 8, 10, 12, 15, 20, 25, 35, 50] as const;
