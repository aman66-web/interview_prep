import type { Metadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as caseMetadata } from "@/app/cases/[slug]/page";
import { metadata as casesMetadata } from "@/app/cases/page";
import { generateMetadata as drillMetadata } from "@/app/drills/[category]/page";
import { metadata as drillsMetadata } from "@/app/drills/page";
import { filterCases, isFiltering, NO_FILTERS, relatedCases, typeCounts, typeFacets } from "@/components/practice/case-list";
import { exhibitChartSpec, splitUnit } from "@/components/practice/exhibit-chart";
import { caseDescription, clipText, collectionPageJsonLd, DESCRIPTION_MAX, joinWithAnd, pageTitle, renderedTitle, TITLE_MAX } from "@/components/practice/metadata";
import { caseOfType, caseShortName, lowerFirst } from "@/components/practice/wording";
import { allCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toCaseSummary, toPublicCase, type CaseSummary } from "@/lib/content/public";
import { DRILL_CATEGORIES } from "@/lib/drills";
import { siteUrl } from "@/lib/site-url";

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

/** True when `clipped` is `full` cut at a sentence end or a word boundary (never inside a word). */
function cutCleanly(full: string, clipped: string): boolean {
  if (clipped === full) return true;
  if (clipped.endsWith("…")) {
    const kept = clipped.slice(0, -1);
    return full.startsWith(kept) && /^[\s,;:(–—-]*\s/u.test(full.slice(kept.length));
  }
  return full.startsWith(clipped) && /[.?!]$/.test(clipped) && full[clipped.length] === " ";
}

describe("fitting titles and descriptions to search results", () => {
  const text = "Harbourline is a UK chain of 120 bakery-cafés. Last year the average café made a profit of £200,000. This year it made far less.";

  it("leave text that fits alone", () => {
    expect(clipText("Short and sweet.", 160)).toBe("Short and sweet.");
    expect(clipText("  extra   spaces  ", 160)).toBe("extra spaces");
  });

  it("cut after the last full sentence that fits, with no ellipsis", () => {
    expect(clipText(text, 110)).toBe("Harbourline is a UK chain of 120 bakery-cafés. Last year the average café made a profit of £200,000.");
  });

  it("otherwise cut at a word boundary and add an ellipsis, never mid-word", () => {
    const clipped = clipText(text, 40);
    expect(clipped).toBe("Harbourline is a UK chain of 120…");
    expect(clipped.length).toBeLessThanOrEqual(40);
    for (let max = 20; max < text.length; max++) {
      const c = clipText(text, max);
      expect(c.length).toBeLessThanOrEqual(max);
      expect(cutCleanly(text, c)).toBe(true);
    }
  });

  it("do not take the full stop of an abbreviation for the end of a sentence", () => {
    expect(clipText("Gyms sell many extras to members, e.g. towels, lockers and drinks.", 50)).toBe("Gyms sell many extras to members, e.g. towels…");
    expect(clipText("We met Dr. Patel and Mr. Jones about it today.", 24)).toBe("We met Dr. Patel and…");
    expect(clipText("Costs rose in the U.S. and in Canada this year.", 30)).toBe("Costs rose in the U.S. and in…");
    // A one-letter word can still end a sentence.
    expect(clipText("Plan A. Then plan B follows a long way after that one.", 10)).toBe("Plan A.");
    // And the cut still falls on the real sentence end after an abbreviation.
    expect(clipText("Gyms sell extras, e.g. towels. Most members never buy any of them at all.", 40)).toBe("Gyms sell extras, e.g. towels.");
  });

  it("drop punctuation left dangling before the ellipsis", () => {
    expect(clipText("One, two, three, four, five", 12)).toBe("One, two…");
  });

  it("keep the brand suffix only while the whole title fits in 60 characters", () => {
    expect(pageTitle("Case interview library")).toBe("Case interview library");
    expect(renderedTitle(pageTitle("Case interview library"))).toBe("Case interview library | Mock Partner");
    const long = "Brinmoor Bike Share: why are so many bikes out of service?";
    expect(pageTitle(long)).toEqual({ absolute: long });
    const tooLong = "A very long case title that goes on and on well past the sixty character limit";
    const t = renderedTitle(pageTitle(tooLong));
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(cutCleanly(tooLong, t)).toBe(true);
  });

  it("join a list in running text", () => {
    expect(joinWithAnd([])).toBe("");
    expect(joinWithAnd(["pricing"])).toBe("pricing");
    expect(joinWithAnd(["pricing", "growth", "M&A"])).toBe("pricing, growth and M&A");
  });
});

describe("case and drill page metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const check = (m: Metadata, canonical: string) => {
    const title = renderedTitle(m.title);
    expect(title.length, title).toBeGreaterThan(0);
    expect(title.length, title).toBeLessThanOrEqual(TITLE_MAX);
    const description = String(m.description ?? "");
    expect(description.length, description).toBeGreaterThan(50);
    expect(description.length, description).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(m.alternates?.canonical).toBe(canonical);
  };

  it("fit every case page and cut its prompt cleanly", async () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "1");
    for (const c of allCases) {
      const m = await caseMetadata({ params: Promise.resolve({ slug: c.slug }) });
      check(m, `/cases/${c.slug}`);
      const full = `${CASE_TYPE_LABELS[c.type]} case interview practice: ${c.prompt.replace(/\s+/g, " ").trim()}`;
      expect(m.description).toBe(caseDescription(CASE_TYPE_LABELS[c.type], c.prompt));
      expect(cutCleanly(full, String(m.description)), String(m.description)).toBe(true);
    }
  });

  it("give hidden or unknown cases no metadata", async () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "");
    const draft = allCases.find((c) => c.status !== "reviewed");
    if (draft) expect(await caseMetadata({ params: Promise.resolve({ slug: draft.slug }) })).toEqual({});
    expect(await caseMetadata({ params: Promise.resolve({ slug: "does-not-exist" }) })).toEqual({});
  });

  it("describe the case library with every case type it holds", () => {
    check(casesMetadata, "/cases");
    for (const type of new Set(allCases.map((c) => c.type))) {
      expect(String(casesMetadata.description)).toContain(lowerFirst(CASE_TYPE_LABELS[type]));
    }
  });

  it("fit the drills pages", async () => {
    check(drillsMetadata, "/drills");
    for (const category of DRILL_CATEGORIES) {
      check(await drillMetadata({ params: Promise.resolve({ category }) }), `/drills/${category}`);
    }
  });
});

describe("structured data for list pages", () => {
  it("list each item with an absolute address, in order", () => {
    const data = collectionPageJsonLd({ name: "Cases", description: "All cases", path: "/cases", items: [{ name: "A", path: "/cases/a" }, { name: "B", path: "/cases/b" }] });
    expect(data["@type"]).toBe("CollectionPage");
    expect(data.url).toBe(`${siteUrl()}/cases`);
    expect(data.mainEntity?.numberOfItems).toBe(2);
    expect(data.mainEntity?.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "A", url: `${siteUrl()}/cases/a` },
      { "@type": "ListItem", position: 2, name: "B", url: `${siteUrl()}/cases/b` },
    ]);
  });

  it("leave the list out when there is nothing in it", () => {
    expect(collectionPageJsonLd({ name: "Cases", description: "None yet", path: "/cases", items: [] })).not.toHaveProperty("mainEntity");
  });
});
