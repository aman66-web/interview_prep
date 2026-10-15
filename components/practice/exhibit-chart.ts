import type { PublicExhibit } from "@/lib/content/public";
import type { ChartSpec } from "@/lib/drills/types";

// Turns a case exhibit marked "bar" or "line" into a chart spec, when its data is a
// simple label-and-number series (two columns, a number in every second cell).
// Anything else is shown as a table. tests/practice-pages.test.ts covers this.

/** "Customers who would stay (%)" -> { name: "Customers who would stay", unit: "%" }. */
export function splitUnit(column: string): { name: string; unit: string | null } {
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(column);
  if (!m || !m[1]) return { name: column.trim(), unit: null };
  return { name: m[1].trim(), unit: m[2].trim() };
}

export function exhibitChartSpec(exhibit: Pick<PublicExhibit, "kind" | "columns" | "rows">): ChartSpec | null {
  if (exhibit.kind === "table") return null;
  if (exhibit.columns.length !== 2 || exhibit.rows.length < 2) return null;
  if (!exhibit.rows.every((r) => r.length === 2 && typeof r[1] === "number" && Number.isFinite(r[1]) && r[1] >= 0)) return null;
  const { name, unit } = splitUnit(exhibit.columns[1]);
  return {
    kind: exhibit.kind,
    title: name,
    unit: unit ?? "value",
    points: exhibit.rows.map((r) => ({ label: String(r[0]), value: r[1] as number })),
  };
}
