// The free tools at /tools (no login). Shared by the tools pages, the sitemap and links elsewhere.

export type ToolInfo = {
  slug: string;
  title: string;
  short: string;
  description: string;
};

export const TOOLS: ToolInfo[] = [
  {
    slug: "market-sizing-calculator",
    title: "Market sizing calculator",
    short: "Build a top-down estimate step by step and see how each assumption moves the answer.",
    description: "A free market sizing calculator for case interviews: chain population, share and price assumptions and see which one moves the answer most.",
  },
  {
    slug: "break-even-calculator",
    title: "Break-even calculator",
    short: "Fixed costs, price and variable cost in; break-even volume and revenue out.",
    description: "A free break-even calculator for case interviews: work out break-even volume, revenue and payback from fixed costs, price and variable cost.",
  },
  {
    slug: "mental-maths-trainer",
    title: "Mental maths trainer",
    short: "Timed rounds of percentages, growth and margins, with instant feedback.",
    description: "A free mental maths trainer for case interviews: timed rounds of percentages, growth rates, margins and break-even, with instant feedback.",
  },
  {
    slug: "growth-rate-calculator",
    title: "Growth rate calculator",
    short: "CAGR, doubling time and future value, with the rule of 72 for quick checks.",
    description: "A free growth rate calculator for case interviews: compound annual growth rate, doubling time and future value, with the rule of 72.",
  },
];

export function findTool(slug: string): ToolInfo | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
