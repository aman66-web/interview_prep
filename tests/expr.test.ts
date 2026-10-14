import { describe, expect, it } from "vitest";
import { evaluate, variablesIn } from "@/lib/content/expr";

describe("evaluate", () => {
  it("does arithmetic with the usual order of operations", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 - 4 - 3")).toBe(3);
    expect(evaluate("100 / 4 / 5")).toBe(5);
    expect(evaluate("0.5 * 8")).toBe(4);
    expect(evaluate(".5 + 1.25")).toBe(1.75);
  });

  it("handles powers and negatives", () => {
    expect(evaluate("2 ^ 3")).toBe(8);
    expect(evaluate("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluate("-2 ^ 2")).toBe(-4);
    expect(evaluate("2 ^ -1")).toBe(0.5);
    expect(evaluate("1.1 ^ 2 * 200")).toBeCloseTo(242, 10);
    expect(evaluate("-(3 + 4)")).toBe(-7);
    expect(evaluate("5 - -2")).toBe(7);
  });

  it("uses named variables", () => {
    expect(evaluate("cafes * profit / 1000", { cafes: 120, profit: 80 })).toBeCloseTo(9.6, 10);
    expect(evaluate("a_1 + B2", { a_1: 1, B2: 2 })).toBe(3);
  });

  it.each([
    ["unknown variable", "x + 1", {}],
    ["division by zero", "1 / 0", {}],
    ["empty input", "", {}],
    ["dangling operator", "2 +", {}],
    ["missing bracket", "(2 + 3", {}],
    ["extra bracket", "2 + 3)", {}],
    ["two numbers in a row", "2 3", {}],
    ["a function call", "Math.max(1, 2)", {}],
    ["code", "constructor", {}],
    ["a prototype name", "toString", {}],
    ["a symbol", "2 % 3", {}],
    ["not finite", "10 ^ 1000", {}],
  ])("rejects %s", (_label, expression, vars) => {
    expect(() => evaluate(expression, vars)).toThrow();
  });

  it("cannot reach built-in object properties through variable names", () => {
    expect(() => evaluate("__proto__", {})).toThrow();
    expect(() => evaluate("hasOwnProperty", {})).toThrow();
  });
});

describe("variablesIn", () => {
  it("lists each name once, in order", () => {
    expect(variablesIn("a * b + a / c")).toEqual(["a", "b", "c"]);
    expect(variablesIn("2 + 3")).toEqual([]);
  });
});
