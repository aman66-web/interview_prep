import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import type { CaseSummary } from "@/lib/content/public";

// Pure helpers for the case library: filtering, counts by type and "related cases".
// No zod and no full case data, so they are safe in client components.
// tests/practice-pages.test.ts covers them.

export type CaseFilters = { type: string; industry: string; difficulty: string };

export const NO_FILTERS: CaseFilters = { type: "", industry: "", difficulty: "" };

/** Case types in the order the site always lists them (the label order). */
export const TYPE_ORDER = Object.keys(CASE_TYPE_LABELS);

function matches(c: CaseSummary, f: CaseFilters, ignore?: keyof CaseFilters): boolean {
  return (
    (ignore === "type" || !f.type || c.type === f.type) &&
    (ignore === "industry" || !f.industry || c.industry === f.industry) &&
    (ignore === "difficulty" || !f.difficulty || String(c.difficulty) === f.difficulty)
  );
}

export function filterCases(cases: CaseSummary[], f: CaseFilters): CaseSummary[] {
  return cases.filter((c) => matches(c, f));
}

export function isFiltering(f: CaseFilters): boolean {
  return Boolean(f.type || f.industry || f.difficulty);
}

/** How many cases of each type there are, in the site's type order, leaving out types with none. */
export function typeCounts(cases: CaseSummary[]): { type: string; count: number }[] {
  return TYPE_ORDER.map((type) => ({ type, count: cases.filter((c) => c.type === type).length })).filter((t) => t.count > 0);
}

/**
 * For the type buttons: how many cases each type would show, given the industry and
 * difficulty already chosen. `all` is the count for "All types".
 */
export function typeFacets(cases: CaseSummary[], f: CaseFilters): { all: number; byType: Record<string, number> } {
  const pool = cases.filter((c) => matches(c, f, "type"));
  const byType: Record<string, number> = {};
  for (const c of pool) byType[c.type] = (byType[c.type] ?? 0) + 1;
  return { all: pool.length, byType };
}

/**
 * Up to `n` other cases to try next: the same type first, then the same difficulty,
 * then the rest, each group in library order.
 */
export function relatedCases(current: Pick<CaseSummary, "slug" | "type" | "difficulty">, all: CaseSummary[], n = 3): CaseSummary[] {
  const others = all.filter((c) => c.slug !== current.slug);
  const rank = (c: CaseSummary) => (c.type === current.type ? 0 : c.difficulty === current.difficulty ? 1 : 2);
  return others
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
    .slice(0, n)
    .map((x) => x.c);
}
