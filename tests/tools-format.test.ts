import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  formatYearsMonths,
  NOT_A_NUMBER,
  numberOrNull,
  parseNumberInput,
} from "@/lib/tools/format";

describe("tools: reading typed numbers", () => {
  it("reads plain numbers, separators, signs and symbols", () => {
    expect(parseNumberInput("1200")).toEqual({ kind: "number", value: 1200 });
    expect(parseNumberInput(" 1,200,000 ")).toEqual({ kind: "number", value: 1_200_000 });
    expect(parseNumberInput("$4.50")).toEqual({ kind: "number", value: 4.5 });
    expect(parseNumberInput("£96 000")).toEqual({ kind: "number", value: 96_000 });
    expect(parseNumberInput("12.5%")).toEqual({ kind: "number", value: 12.5 });
    expect(parseNumberInput(".5")).toEqual({ kind: "number", value: 0.5 });
    expect(parseNumberInput("-3")).toEqual({ kind: "number", value: -3 });
    expect(parseNumberInput("−3")).toEqual({ kind: "number", value: -3 });
    expect(parseNumberInput("-0")).toEqual({ kind: "number", value: 0 });
  });

  it("reads short forms for thousands, millions and billions", () => {
    expect(numberOrNull("250k")).toBe(250_000);
    expect(numberOrNull("4m")).toBe(4_000_000);
    expect(numberOrNull("4 million")).toBe(4_000_000);
    expect(numberOrNull("4.8bn")).toBe(4_800_000_000);
    expect(numberOrNull("1.2 Billion")).toBe(1_200_000_000);
    expect(numberOrNull("2tn")).toBe(2e12);
  });

  it("tells empty from wrong", () => {
    expect(parseNumberInput("")).toEqual({ kind: "empty" });
    expect(parseNumberInput("   ")).toEqual({ kind: "empty" });
    for (const bad of ["abc", "1.2.3", "4 apples", "1e6", "--2", "12%%", "%", "$", "4x"]) {
      expect(parseNumberInput(bad), bad).toEqual({ kind: "invalid" });
    }
    expect(numberOrNull("")).toBeNull();
    expect(numberOrNull("nope")).toBeNull();
  });
});

describe("tools: showing numbers", () => {
  it("adds thousands separators and trims floating-point dust", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.89");
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(-0.0000001)).toBe("0");
    expect(formatNumber(2.5, 0)).toBe("3");
  });

  it("never shows NaN or Infinity", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(formatNumber(bad)).toBe(NOT_A_NUMBER);
      expect(formatCompact(bad)).toBe(NOT_A_NUMBER);
      expect(formatMoney(bad)).toBe(NOT_A_NUMBER);
      expect(formatMoneyCompact(bad)).toBe(NOT_A_NUMBER);
      expect(formatPercent(bad)).toBe(NOT_A_NUMBER);
      expect(formatYearsMonths(bad)).toBe(NOT_A_NUMBER);
    }
  });

  it("writes big numbers in words", () => {
    expect(formatCompact(1_200_000)).toBe("1.2 million");
    expect(formatCompact(60_000_000)).toBe("60 million");
    expect(formatCompact(4_800_000_000)).toBe("4.8 billion");
    expect(formatCompact(999_999_999)).toBe("1 billion");
    expect(formatCompact(857_142.857)).toBe("857,143");
    expect(formatCompact(42.857)).toBe("42.9");
    expect(formatCompact(-2_500_000)).toBe("-2.5 million");
    expect(formatCompact(0)).toBe("0");
  });

  it("formats money and percentages", () => {
    expect(formatMoney(96000)).toBe("$96,000");
    expect(formatMoney(1.6)).toBe("$1.60");
    expect(formatMoney(-1200, "£")).toBe("-£1,200");
    expect(formatMoney(-0)).toBe("$0");
    expect(formatMoneyCompact(60_000_000)).toBe("$60 million");
    expect(formatMoneyCompact(-42_857_142.86)).toBe("-$42.9 million");
    expect(formatMoneyCompact(160_000)).toBe("$160,000");
    expect(formatMoneyCompact(141_176.47)).toBe("$141,176");
    expect(formatMoneyCompact(-24_000.4)).toBe("-$24,000");
    expect(formatMoneyCompact(2.4)).toBe("$2.40");
    expect(formatPercent(11.8427)).toBe("11.8%");
    expect(formatPercent(60)).toBe("60%");
  });

  it("writes years as years and months", () => {
    expect(formatYearsMonths(1.25)).toBe("1 year 3 months");
    expect(formatYearsMonths(2)).toBe("2 years");
    expect(formatYearsMonths(0.5)).toBe("6 months");
    expect(formatYearsMonths(1 / 12)).toBe("1 month");
    expect(formatYearsMonths(0.01)).toBe("less than a month");
    expect(formatYearsMonths(-1)).toBe(NOT_A_NUMBER);
  });
});
