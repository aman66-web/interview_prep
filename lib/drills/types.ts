export const DRILL_CATEGORIES = ["mental-maths", "market-sizing", "frameworks", "chart-reading"] as const;
export type DrillCategory = (typeof DRILL_CATEGORIES)[number];

export const CATEGORY_INFO: Record<DrillCategory, { title: string; blurb: string }> = {
  "mental-maths": {
    title: "Mental maths",
    blurb: "Percentages, growth, margins and break-even without a calculator, the way case interviews expect.",
  },
  "market-sizing": {
    title: "Market sizing",
    blurb: "Estimate a number from a few sensible assumptions, then compare your approach with a model one.",
  },
  frameworks: {
    title: "Frameworks and structure",
    blurb: "Pick the best way to break a problem down, and spot what makes a structure clear and complete.",
  },
  "chart-reading": {
    title: "Chart reading",
    blurb: "Read the numbers off a chart quickly and accurately, then do the maths on them.",
  },
};

export type ChartSpec = {
  kind: "bar" | "line";
  title: string;
  unit: string;
  points: { label: string; value: number }[];
};

type Base = {
  id: string;
  category: DrillCategory;
  title: string;
  prompt: string;
  chart?: ChartSpec;
};

/** The answer must be a number within a percentage of the right one. */
export type NumericDrill = Base & {
  kind: "numeric";
  unit: string; // shown next to the input, e.g. "%" or "$ million"
  answer: number;
  tolerancePct: number;
  explanation: string;
  /** For generated drills: how the answer was produced, so tests can recompute it. */
  expression?: string;
  inputs?: Record<string, number>;
};

export type ChoiceDrill = Base & {
  kind: "choice";
  options: string[];
  answerIndex: number;
  explanation: string;
};

/** A market-sizing estimate: right if within a factor of the model estimate. */
export type EstimateDrill = Base & {
  kind: "estimate";
  unit: string;
  answer: number;
  withinFactor: number;
  explanation: string;
  expression: string;
  inputs: Record<string, number>;
};

export type Drill = NumericDrill | ChoiceDrill | EstimateDrill;

/** What the browser may see before answering: no answers, no explanations. */
export type PublicDrill =
  | Pick<NumericDrill, "id" | "category" | "kind" | "title" | "prompt" | "unit" | "chart">
  | Pick<ChoiceDrill, "id" | "category" | "kind" | "title" | "prompt" | "options" | "chart">
  | Pick<EstimateDrill, "id" | "category" | "kind" | "title" | "prompt" | "unit" | "chart">;
