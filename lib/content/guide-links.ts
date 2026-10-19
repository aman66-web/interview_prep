// Which guide explains each case type. Shared by the case pages, drills and guides,
// so links stay consistent. tests/content-writing.test.ts checks every slug exists.

export const CASE_TYPE_GUIDES: Record<string, string> = {
  profitability: "profitability-case-interview",
  market_entry: "market-entry-case-interview",
  market_sizing: "market-sizing-case-interview",
  m_and_a: "mergers-and-acquisitions-case-interview",
  pricing: "pricing-case-interview",
  growth: "growth-case-interview",
  operations: "operations-case-interview",
};

export function guideHrefForCaseType(type: string): string | null {
  const slug = CASE_TYPE_GUIDES[type];
  return slug ? `/guides/${slug}` : null;
}
