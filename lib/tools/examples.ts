import type { BreakEvenInput } from "./break-even";
import type { SizingInput } from "./market-sizing";

// The invented example numbers each calculator starts with. The worked examples on
// the tool pages are computed from these same inputs by the same functions, and the
// tests check the results by hand (rule 2.9). They describe no real company or market.

export const SIZING_EXAMPLE: SizingInput & { title: string; unitLabel: string; currency: string } = {
  title: "Yearly bike helmet sales in an invented country",
  unitLabel: "helmets a year",
  currency: "$",
  start: { label: "People in the country", value: 50_000_000, rangePct: 5 },
  steps: [
    { label: "Share who ride a bike at least once a month", op: "percent", value: 20, rangePct: 25 },
    { label: "Share of those riders who own a helmet", op: "percent", value: 60, rangePct: 20 },
    { label: "Years before a helmet is replaced", op: "divide", value: 5, rangePct: 40 },
  ],
  price: { value: 50, rangePct: 20 },
};

export const BREAK_EVEN_EXAMPLE: Required<{ [K in keyof BreakEvenInput]: number }> & { title: string; currency: string } = {
  title: "An invented coffee kiosk at a train station",
  currency: "$",
  fixedCosts: 96_000,
  price: 4,
  variableCost: 1.6,
  investment: 60_000,
  expectedVolume: 60_000,
};

export const GROWTH_EXAMPLE = {
  cagr: { title: "An invented online shop's revenue", start: 40, end: 70, years: 5, unit: "$ million" },
  future: { title: "The same shop if it keeps growing at 12% a year", value: 70, ratePct: 12, years: 5, unit: "$ million" },
  doubling: { ratePct: 8 },
} as const;
