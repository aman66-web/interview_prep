import { describe, expect, it } from "vitest";
import { filterCases, isFiltering, NO_FILTERS, relatedCases, typeCounts, typeFacets } from "@/components/practice/case-list";
import { exhibitChartSpec, splitUnit } from "@/components/practice/exhibit-chart";
import { caseOfType, caseShortName, lowerFirst } from "@/components/practice/wording";
import { allCases } from "@/lib/content/cases";
import { toCaseSummary, toPublicCase, type CaseSummary } from "@/lib/content/public";

// The logic behind the case library and case pages (components/practice/).

const make = (slug: string, type: string, industry: string, difficulty: 1 | 2 | 3): CaseSummary => ({
  slug,
  title: slug,
  type: type as CaseSummary["type"],
  industry,
  difficulty,
  estMinutes: 25,
  freeStarter: false,
  freePreview: false,
  isDraft: false,
});

const cases: CaseSummary[] = [
  make("a", "profitability", "Retail", 1),
  make("b", "pricing", "Software", 3),
  make("c", "profitability", "Software", 2),
  make("d", "growth", "Retail", 2),
  make("e", "pricing", "Retail", 2),
  make("f", "profitability", "Retail", 3),
];

describe("the case library filters", () => {
  it("show everything with no filters", () => {
    expect(filterCases(cases, NO_FILTERS)).toHaveLength(6);
    expect(isFiltering(NO_FILTERS)).toBe(false);
  });

  it("combine type, industry and difficulty", () => {
    expect(filterCases(cases, { type: "pricing", industry: "", difficulty: "" }).map((c) => c.slug)).toEqual(["b", "e"]);
    expect(filterCases(cases, { type: "", industry: "Retail", difficulty: "2" }).map((c) => c.slug)).toEqual(["d", "e"]);
    expect(filterCases(cases, { type: "pricing", industry: "Software", difficulty: "1" })).toEqual([]);
    expect(isFiltering({ type: "", industry: "Retail", difficulty: "" })).toBe(true);
  });

  it("count each type given the other filters, ignoring the type already chosen", () => {
    const facets = typeFacets(cases, { type: "pricing", industry: "Retail", difficulty: "" });
    expect(facets.all).toBe(4);
    expect(facets.byType).toEqual({ profitability: 2, growth: 1, pricing: 1 });
  });

  it("count cases by type in the site's type order, leaving out empty types", () => {
    expect(typeCounts(cases)).toEqual([
      { type: "profitability", count: 3 },
      { type: "pricing", count: 2 },
      { type: "growth", count: 1 },
    ]);
  });
});

describe("case names in running text", () => {
  it("use the company name before the colon", () => {
    expect(caseShortName("Harbourline Bakeries: why did profit fall?")).toBe("Harbourline Bakeries");
    expect(caseShortName("How many public EV chargers will a city need?")).toBe("How many public EV chargers will a city need?");
  });

  it("lower-case labels mid-sentence without breaking acronyms", () => {
    expect(lowerFirst("Food retail")).toBe("food retail");
    expect(lowerFirst("Software (SaaS)")).toBe("software (SaaS)");
    expect(lowerFirst("M&A")).toBe("M&A");
    expect(caseOfType("Profitability")).toBe("a profitability case");
    expect(caseOfType("M&A")).toBe("an M&A case");
    expect(caseOfType("Operations")).toBe("an operations case");
  });
});

describe("related cases", () => {
  it("put the same type first, then the same difficulty, never the case itself", () => {
    expect(relatedCases(cases[0], cases, 3).map((c) => c.slug)).toEqual(["c", "f", "b"]);
  });

  it("fill up with the same difficulty before anything else", () => {
    expect(relatedCases(cases[3], cases, 3).map((c) => c.slug)).toEqual(["c", "e", "a"]);
  });

  it("work for every real case", () => {
    const all = allCases.map(toCaseSummary);
    for (const c of all) {
      const related = relatedCases(c, all, 3);
      expect(related.length).toBe(Math.min(3, all.length - 1));
      expect(related.find((r) => r.slug === c.slug)).toBeUndefined();
    }
  });
});

describe("exhibit charts", () => {
  it("split a unit off a column name", () => {
    expect(splitUnit("Customers who would stay (%)")).toEqual({ name: "Customers who would stay", unit: "%" });
    expect(splitUnit("Revenue")).toEqual({ name: "Revenue", unit: null });
  });

  it("chart a two-column bar or line series, and leave tables as tables", () => {
    const series = { columns: ["Monthly price ($)", "Customers who would stay (%)"], rows: [[60, 100], [65, 95]] };
    expect(exhibitChartSpec({ kind: "line", ...series })).toEqual({
      kind: "line",
      title: "Customers who would stay",
      unit: "%",
      points: [
        { label: "60", value: 100 },
        { label: "65", value: 95 },
      ],
    });
    expect(exhibitChartSpec({ kind: "table", ...series })).toBeNull();
    expect(exhibitChartSpec({ kind: "bar", columns: ["A", "B", "C"], rows: [["x", 1, 2], ["y", 3, 4]] })).toBeNull();
    expect(exhibitChartSpec({ kind: "bar", columns: ["A", "B"], rows: [["x", "n/a"], ["y", 3]] })).toBeNull();
  });

  it("keep every real preview exhibit's numbers when it is charted", () => {
    for (const c of allCases.map(toPublicCase)) {
      const e = c.previewExhibit;
      if (!e) continue;
      const spec = exhibitChartSpec(e);
      if (spec) expect(spec.points.map((p) => p.value)).toEqual(e.rows.map((r) => r[1]));
    }
  });
});
