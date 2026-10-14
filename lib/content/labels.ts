// Display labels for case types. Kept apart from schema.ts so client components
// can use them without pulling the whole case format (zod) into the browser.

export const CASE_TYPE_LABELS: Record<string, string> = {
  profitability: "Profitability",
  market_entry: "Market entry",
  market_sizing: "Market sizing",
  m_and_a: "M&A",
  pricing: "Pricing",
  growth: "Growth",
  operations: "Operations",
  other: "Other",
};
