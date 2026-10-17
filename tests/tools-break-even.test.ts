import { describe, expect, it } from "vitest";
import { breakEven, breakEvenLines, wholeUnitsNeeded } from "@/lib/tools/break-even";
import { BREAK_EVEN_EXAMPLE } from "@/lib/tools/examples";

const close = (a: number | null | undefined, b: number) => expect(a).toBeCloseTo(b, 6);

describe("tools: break-even", () => {
  it("works out the worked example on the page", () => {
    // Coffee at $4, costs $1.60 a cup, $96,000 a year of fixed costs, $60,000 to set up, 60,000 cups expected.
    const r = breakEven(BREAK_EVEN_EXAMPLE);
    if (!r.ok || !r.breaksEven) throw new Error("expected a break-even");
    close(r.contribution, 2.4);
    close(r.contributionMargin, 0.6);
    close(r.breakEvenUnits, 40_000);
    expect(r.breakEvenUnitsWhole).toBe(40_000);
    close(r.breakEvenRevenue, 160_000);
    close(r.profitAtExpected, 48_000); // 60,000 x 2.40 - 96,000
    close(r.marginOfSafety, 1 / 3); // (60,000 - 40,000) / 60,000
    expect(r.payback.kind).toBe("years");
    if (r.payback.kind === "years") close(r.payback.years, 1.25); // 60,000 / 48,000
  });

  it("rounds a fractional break-even volume up to whole units", () => {
    const r = breakEven({ fixedCosts: 100, price: 7, variableCost: 4 });
    if (!r.ok || !r.breaksEven) throw new Error("expected a break-even");
    close(r.breakEvenUnits, 100 / 3);
    expect(r.breakEvenUnitsWhole).toBe(34);
    close(r.breakEvenRevenue, 100 / (3 / 7));
    expect(wholeUnitsNeeded(7999.9999999999)).toBe(8000);
    expect(wholeUnitsNeeded(8000.4)).toBe(8001);
    expect(wholeUnitsNeeded(0)).toBe(0);
  });

  it("breaks even at zero units when there are no fixed costs", () => {
    const r = breakEven({ fixedCosts: 0, price: 10, variableCost: 4, expectedVolume: 0 });
    if (!r.ok || !r.breaksEven) throw new Error("expected a break-even");
    expect(r.breakEvenUnits).toBe(0);
    expect(r.breakEvenRevenue).toBe(0);
    expect(r.profitAtExpected).toBe(0);
    expect(r.marginOfSafety).toBeNull(); // no sales expected: nothing to measure against
  });

  it("never breaks even when the price is at or below the variable cost", () => {
    for (const [price, variableCost] of [
      [5, 5],
      [4, 6],
      [0, 0],
      [0, 3],
    ]) {
      const r = breakEven({ fixedCosts: 1000, price, variableCost, expectedVolume: 100 });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.breaksEven).toBe(false);
      expect(Number.isFinite(r.contribution)).toBe(true);
      expect(r.profitAtExpected).toBe(100 * (price - variableCost) - 1000);
      if (price === 0) expect(r.contributionMargin).toBeNull();
      else close(r.contributionMargin, (price - variableCost) / price);
    }
  });

  it("explains payback when it can't be worked out", () => {
    const base = { fixedCosts: 96_000, price: 4, variableCost: 1.6 };
    const none = breakEven({ ...base, investment: 0, expectedVolume: 60_000 });
    const noVolume = breakEven({ ...base, investment: 60_000 });
    const loss = breakEven({ ...base, investment: 60_000, expectedVolume: 30_000 });
    const exact = breakEven({ ...base, investment: 60_000, expectedVolume: 40_000 });
    if (!none.ok || !none.breaksEven || !noVolume.ok || !noVolume.breaksEven || !loss.ok || !loss.breaksEven || !exact.ok || !exact.breaksEven) {
      throw new Error("expected break-evens");
    }
    expect(none.payback).toEqual({ kind: "no-investment" });
    expect(noVolume.payback).toEqual({ kind: "needs-volume" });
    expect(noVolume.marginOfSafety).toBeNull();
    expect(loss.payback.kind).toBe("never");
    if (loss.payback.kind === "never") close(loss.payback.yearlyProfit, -24_000); // 30,000 x 2.40 - 96,000
    close(loss.marginOfSafety, -1 / 3);
    expect(exact.payback.kind).toBe("never"); // exactly break-even: no profit to pay anything back
  });

  it("refuses negative, missing and non-numbers", () => {
    const r = breakEven({ fixedCosts: -1, price: NaN, variableCost: 2, investment: -5, expectedVolume: Infinity });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.issues.map((i) => i.field)).toEqual(["fixedCosts", "price", "investment", "expectedVolume"]);
    const missing = breakEven({ fixedCosts: null as unknown as number, price: 1, variableCost: 0 });
    expect(missing.ok).toBe(false);
    expect(breakEven({ fixedCosts: 10, price: 2, variableCost: 1, investment: null, expectedVolume: null }).ok).toBe(true);
  });

  it("draws revenue and total cost lines that cross at break-even", () => {
    const lines = breakEvenLines(BREAK_EVEN_EXAMPLE, 80_000);
    close(lines.revenueAt(40_000), lines.costAt(40_000));
    close(lines.costAt(0), 96_000);
    close(lines.maxMoney, 320_000);
  });
});
