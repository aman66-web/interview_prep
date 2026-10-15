import { describe, expect, it } from "vitest";
import { GROWTH_EXAMPLE } from "@/lib/tools/examples";
import { cagr, compareDoubling, DOUBLING_TABLE_RATES, doublingTimeExact, doublingTimeRule72, futureValue, type Outcome } from "@/lib/tools/growth";

function value(o: Outcome<number>): number {
  if (!o.ok) throw new Error(o.message);
  return o.value;
}

describe("tools: CAGR", () => {
  it("matches hand calculations", () => {
    expect(value(cagr(100, 121, 2))).toBeCloseTo(10, 9);
    expect(value(cagr(100, 200, 1))).toBeCloseTo(100, 9);
    expect(value(cagr(100, 100, 7))).toBeCloseTo(0, 9);
    expect(value(cagr(200, 50, 2))).toBeCloseTo(-50, 9); // halves each year
    expect(value(cagr(100, 0, 3))).toBeCloseTo(-100, 9);
    expect(value(cagr(100, 150, 0.5))).toBeCloseTo(125, 9); // half a year: 1.5 ^ 2 = 2.25
  });

  it("works out the worked example: $40m to $70m in 5 years", () => {
    const { start, end, years } = GROWTH_EXAMPLE.cagr;
    const rate = value(cagr(start, end, years));
    expect(rate).toBeCloseTo((Math.pow(1.75, 0.2) - 1) * 100, 9);
    expect(rate).toBeCloseTo(11.8427, 3);
    // and growing at that rate gets you back to the end value
    expect(value(futureValue(start, rate, years))).toBeCloseTo(end, 9);
  });

  it("refuses a zero or negative start, a negative end, and no time", () => {
    expect(cagr(0, 100, 5).ok).toBe(false);
    expect(cagr(-10, 100, 5).ok).toBe(false);
    expect(cagr(100, -1, 5).ok).toBe(false);
    expect(cagr(100, 200, 0).ok).toBe(false);
    expect(cagr(100, 200, -2).ok).toBe(false);
    expect(cagr(NaN, 200, 2).ok).toBe(false);
  });
});

describe("tools: future value", () => {
  it("compounds the rate", () => {
    expect(value(futureValue(1000, 10, 2))).toBeCloseTo(1210, 9);
    expect(value(futureValue(1000, -10, 2))).toBeCloseTo(810, 9);
    expect(value(futureValue(1000, 0, 30))).toBe(1000);
    expect(value(futureValue(1000, 8, 0))).toBe(1000);
    expect(value(futureValue(0, 50, 10))).toBe(0);
  });

  it("works out the worked example: $70m growing 12% a year for 5 years", () => {
    const { value: v, ratePct, years } = GROWTH_EXAMPLE.future;
    expect(value(futureValue(v, ratePct, years))).toBeCloseTo(70 * 1.12 ** 5, 9);
    expect(value(futureValue(v, ratePct, years))).toBeCloseTo(123.3639, 3);
  });

  it("refuses falls of 100% or more, negative years and overflow", () => {
    expect(futureValue(100, -100, 2).ok).toBe(false);
    expect(futureValue(100, -150, 2).ok).toBe(false);
    expect(futureValue(100, 10, -1).ok).toBe(false);
    expect(futureValue(1, 1000, 1000).ok).toBe(false);
  });
});

describe("tools: doubling time", () => {
  it("is exact with logarithms", () => {
    expect(value(doublingTimeExact(100))).toBeCloseTo(1, 9);
    expect(value(doublingTimeExact(8))).toBeCloseTo(Math.log(2) / Math.log(1.08), 9);
    expect(value(doublingTimeExact(8))).toBeCloseTo(9.006, 3);
    // check: growing for the doubling time really does double
    for (const rate of DOUBLING_TABLE_RATES) {
      expect(value(futureValue(1, rate, value(doublingTimeExact(rate))))).toBeCloseTo(2, 9);
    }
  });

  it("estimates with the rule of 72", () => {
    expect(value(doublingTimeRule72(8))).toBe(9);
    expect(value(doublingTimeRule72(12))).toBe(6);
    const c = compareDoubling(8);
    if (!c.ok) throw new Error(c.message);
    expect(c.value.rule72).toBe(9);
    expect(c.value.errorPct).toBeCloseTo(((9 - c.value.exact) / c.value.exact) * 100, 9);
    expect(Math.abs(c.value.errorPct)).toBeLessThan(0.1); // the rule is very close at 8%
  });

  it("is close for everyday rates and drifts for very high ones", () => {
    for (const rate of [4, 6, 8, 10, 12]) {
      const c = compareDoubling(rate);
      if (!c.ok) throw new Error(c.message);
      expect(Math.abs(c.value.errorPct)).toBeLessThan(3);
    }
    const high = compareDoubling(50);
    if (!high.ok) throw new Error(high.message);
    expect(high.value.errorPct).toBeLessThan(-15); // 1.44 years against 1.71
  });

  it("never doubles at zero or negative growth", () => {
    for (const rate of [0, -5, NaN]) {
      expect(doublingTimeExact(rate).ok).toBe(false);
      expect(doublingTimeRule72(rate).ok).toBe(false);
      expect(compareDoubling(rate).ok).toBe(false);
    }
  });
});
