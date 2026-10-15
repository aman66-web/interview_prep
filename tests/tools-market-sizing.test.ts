import { describe, expect, it } from "vitest";
import { SIZING_EXAMPLE } from "@/lib/tools/examples";
import { chainUnits, MAX_STEPS, nudge, sizeMarket, stepFactor, type SizingInput } from "@/lib/tools/market-sizing";

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe("tools: market sizing chain", () => {
  it("applies each kind of step", () => {
    expect(stepFactor("percent", 25)).toBe(0.25);
    expect(stepFactor("multiply", 4)).toBe(4);
    expect(stepFactor("divide", 5)).toBe(0.2);
    expect(chainUnits(1000, [{ op: "percent", value: 50 }, { op: "multiply", value: 3 }, { op: "divide", value: 2 }])).toBe(750);
    expect(chainUnits(1000, [])).toBe(1000);
  });

  it("works out the worked example on the page, step by step", () => {
    const r = sizeMarket(SIZING_EXAMPLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 50m people x 20% = 10m riders x 60% = 6m helmet owners / 5 years = 1.2m helmets a year x $50 = $60m
    expect(r.chain.map((c) => c.runningTotal)).toEqual([50_000_000, 10_000_000, 6_000_000, 1_200_000]);
    close(r.units, 1_200_000);
    close(r.marketValue!, 60_000_000);
    close(r.base, 60_000_000);
  });

  it("finds the assumption the example is most sensitive to", () => {
    const r = sizeMarket(SIZING_EXAMPLE);
    if (!r.ok) throw new Error("expected a result");
    const byLabel = Object.fromEntries(r.sensitivity.map((s) => [s.label, s]));
    // People +-5%: $57m to $63m
    close(byLabel["People in the country"].low, 57_000_000);
    close(byLabel["People in the country"].high, 63_000_000);
    // Riders 20% +-25% = 15% to 25%: $45m to $75m
    close(byLabel["Share who ride a bike at least once a month"].low, 45_000_000);
    close(byLabel["Share who ride a bike at least once a month"].high, 75_000_000);
    // Owners 60% +-20% = 48% to 72%: $48m to $72m
    close(byLabel["Share of those riders who own a helmet"].swing, 24_000_000);
    // Replaced every 5 years +-40% = 3 to 7 years: $42.86m to $100m (dividing makes it lopsided)
    const replace = byLabel["Years before a helmet is replaced"];
    close(replace.low, 6_000_000 / 7 * 50);
    close(replace.high, 100_000_000);
    close(replace.swingPct, ((100_000_000 - 300_000_000 / 7) / 60_000_000) * 100);
    // Price $50 +-20%: $48m to $72m
    close(byLabel["Average price"].swing, 24_000_000);
    expect(r.sensitivity[r.mostSensitive!].label).toBe("Years before a helmet is replaced");
    expect(r.allEqual).toBe(false);
  });

  it("says when every step moves the answer equally (a pure multiplication chain)", () => {
    const input: SizingInput = {
      start: { label: "Households", value: 1_000_000, rangePct: 10 },
      steps: [
        { label: "Own a dog", op: "percent", value: 30, rangePct: 10 },
        { label: "Walks bought a week", op: "multiply", value: 2, rangePct: 10 },
      ],
    };
    const r = sizeMarket(input);
    if (!r.ok) throw new Error("expected a result");
    expect(r.marketValue).toBeNull();
    close(r.units, 600_000);
    for (const row of r.sensitivity) close(row.swing, 120_000);
    expect(r.allEqual).toBe(true);
  });

  it("keeps a share at or under 100% when nudging it up", () => {
    expect(nudge(95, "percent", 0.1)).toBe(100);
    expect(nudge(50, "percent", 0.1)).toBeCloseTo(55, 9);
    expect(nudge(10, "multiply", -0.5)).toBe(5);
    expect(nudge(10, "divide", -1)).toBe(0);
    const r = sizeMarket({ start: { label: "People", value: 100, rangePct: 0 }, steps: [{ label: "Almost all", op: "percent", value: 95, rangePct: 10 }] });
    if (!r.ok) throw new Error("expected a result");
    close(r.sensitivity[1].low, 85.5);
    close(r.sensitivity[1].high, 100);
  });

  it("ignores assumptions with no range", () => {
    const r = sizeMarket({ start: { label: "People", value: 100, rangePct: 0 }, steps: [] });
    if (!r.ok) throw new Error("expected a result");
    expect(r.sensitivity[0].swing).toBe(0);
    expect(r.mostSensitive).toBeNull();
    expect(r.allEqual).toBe(false);
  });

  it("handles a zero anywhere in the chain without dividing by zero", () => {
    const r = sizeMarket({ start: { label: "People", value: 100, rangePct: 10 }, steps: [{ label: "None", op: "percent", value: 0, rangePct: 10 }], price: { value: 5, rangePct: 10 } });
    if (!r.ok) throw new Error("expected a result");
    expect(r.units).toBe(0);
    expect(r.marketValue).toBe(0);
    for (const row of r.sensitivity) {
      expect(Number.isFinite(row.swingPct)).toBe(true);
      expect(row.swingPct).toBe(0);
    }
  });
});

describe("tools: market sizing refuses impossible inputs", () => {
  const ok = { label: "People", value: 100, rangePct: 10 };

  it("refuses dividing by zero", () => {
    const r = sizeMarket({ start: ok, steps: [{ label: "Per", op: "divide", value: 0, rangePct: 10 }] });
    expect(r).toEqual({ ok: false, issues: [{ field: 0, message: "You can't divide by zero." }] });
  });

  it("refuses negatives, shares over 100% and numbers that aren't numbers", () => {
    const r = sizeMarket({
      start: { ...ok, value: -5 },
      steps: [
        { label: "Share", op: "percent", value: 120, rangePct: 10 },
        { label: "Times", op: "multiply", value: NaN, rangePct: 10 },
        { label: "Fine", op: "multiply", value: 2, rangePct: 10 },
      ],
      price: { value: Infinity, rangePct: 10 },
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.issues.map((i) => i.field)).toEqual(["start", 0, 1, "price"]);
  });

  it("refuses ranges of 100% or more, and too many steps", () => {
    expect(sizeMarket({ start: { ...ok, rangePct: 100 }, steps: [] }).ok).toBe(false);
    expect(sizeMarket({ start: { ...ok, rangePct: -1 }, steps: [] }).ok).toBe(false);
    const steps = Array.from({ length: MAX_STEPS + 1 }, (_, i) => ({ label: `Step ${i}`, op: "multiply" as const, value: 1, rangePct: 0 }));
    expect(sizeMarket({ start: ok, steps }).ok).toBe(false);
    expect(sizeMarket({ start: ok, steps: steps.slice(0, MAX_STEPS) }).ok).toBe(true);
  });
});
