import { authoredFrameworkDrills, authoredMarketSizingDrills } from "./authored";
import { generateChartDrills } from "./charts";
import { generateMentalMathsDrills } from "./mental-maths";
import { DRILL_CATEGORIES, type Drill, type DrillCategory, type PublicDrill } from "./types";

export * from "./types";

/** Every drill, built once. Order within a category is the order users meet them. */
export const allDrills: Drill[] = [
  ...generateMentalMathsDrills(),
  ...authoredMarketSizingDrills(),
  ...authoredFrameworkDrills(),
  ...generateChartDrills(),
];

const byId = new Map(allDrills.map((d) => [d.id, d]));

export function findDrill(id: string): Drill | undefined {
  return byId.get(id);
}

export function drillsByCategory(category: DrillCategory): Drill[] {
  return allDrills.filter((d) => d.category === category);
}

export function isDrillCategory(value: string): value is DrillCategory {
  return (DRILL_CATEGORIES as readonly string[]).includes(value);
}

/** What the browser may see before answering. An allow-list: answers and explanations are never copied. */
export function toPublicDrill(d: Drill): PublicDrill {
  switch (d.kind) {
    case "numeric":
      return { id: d.id, category: d.category, kind: d.kind, title: d.title, prompt: d.prompt, unit: d.unit, chart: d.chart };
    case "estimate":
      return { id: d.id, category: d.category, kind: d.kind, title: d.title, prompt: d.prompt, unit: d.unit, chart: d.chart };
    case "choice":
      return { id: d.id, category: d.category, kind: d.kind, title: d.title, prompt: d.prompt, options: d.options, chart: d.chart };
  }
}
