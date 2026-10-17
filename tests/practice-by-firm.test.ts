import { afterEach, describe, expect, it, vi } from "vitest";
import { allCases } from "@/lib/content/cases";
import { practiceCases, practiceFirms, practiceSections, practiceSources } from "@/lib/content/practice";
import { allFirms } from "@/lib/content/writing";
import { firmSchema } from "@/lib/content/writing-schema";

// Firm-style practice pages (/practice/<firm>, app/practice/): what a firm says about its
// interviews, sourced, next to our own cases. Rules 2.2 and 2.3 apply.

afterEach(() => vi.unstubAllEnvs());

const withPractice = allFirms().filter((f) => f.practice);

describe("practice blocks in the firm guides", () => {
  it("exist for at least the three original firm guides", () => {
    expect(withPractice.map((f) => f.slug)).toEqual(expect.arrayContaining(["mckinsey", "bcg", "bain"]));
  });

  it.each(withPractice.map((f) => [f.slug, f] as const))("%s: lists real cases, once each, with the free starter first if listed", (_slug, firm) => {
    const slugs = firm.practice!.cases;
    expect(new Set(slugs).size, "no case twice").toBe(slugs.length);
    for (const s of slugs) expect(allCases.some((c) => c.slug === s), s).toBe(true);
    const starter = allCases.find((c) => c.free_starter)!;
    if (slugs.includes(starter.slug)) expect(slugs[0]).toBe(starter.slug);
  });

  it.each(withPractice.map((f) => [f.slug, f] as const))("%s: picks cases from the firm's own sector", (_slug, firm) => {
    // Bank pages lead with bank case studies; consulting pages use consulting cases only.
    const tracks = firm.practice!.cases.map((s) => allCases.find((c) => c.slug === s)!.track);
    if (firm.sector === "consulting") expect(tracks.every((t) => t === "consulting")).toBe(true);
    else expect(tracks.filter((t) => t === "banking").length).toBeGreaterThanOrEqual(3);
  });

  it.each(withPractice.map((f) => [f.slug, f] as const))("%s: titles describe, never claim the firm's own cases (rule 2.3)", (_slug, firm) => {
    const { seo_title, description, intro } = firm.practice!;
    expect(seo_title).toMatch(/-style\b|\bpractice for\b/i);
    for (const text of [seo_title, description, intro]) {
      expect(text, text).not.toMatch(/\b(real|actual|official|leaked|genuine)\b[^.]*\b(case|question|interview)s?\b/i);
      expect(text, text).not.toMatch(/\b(endorsed|approved|partnered|in partnership)\b/i);
    }
  });

  it("only shows sourced facts: every line on a practice page points at a listed source", () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "1");
    for (const firm of practiceFirms()) {
      const sources = new Set(practiceSources(firm).map((s) => s.id));
      const items = practiceSections(firm).flatMap((s) => s.items);
      expect(items.length, firm.slug).toBeGreaterThan(0);
      for (const item of items) expect(sources.has(item.source), `${firm.slug}: ${item.source}`).toBe(true);
    }
  });
});

describe("the schema", () => {
  const base = allFirms().find((f) => f.slug === "mckinsey")!;

  it("refuses a practice title that reads like the firm's own material", () => {
    const bad = { ...base, practice: { ...base.practice!, seo_title: "McKinsey case interview practice" } };
    expect(firmSchema.safeParse(bad).success).toBe(false);
  });

  it("refuses show_sections that are not headings of the guide", () => {
    const bad = { ...base, practice: { ...base.practice!, show_sections: ["Not a heading"] } };
    expect(firmSchema.safeParse(bad).success).toBe(false);
  });
});

describe("which practice pages exist", () => {
  it("on the live site: only ready firm guides with at least one reviewed case", () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "");
    for (const firm of practiceFirms()) {
      expect(firm.status, firm.slug).toBe("ready");
      const cases = practiceCases(firm);
      expect(cases.length, firm.slug).toBeGreaterThan(0);
      for (const c of cases) expect(c.status, c.slug).toBe("reviewed");
    }
  });

  it("on previews: every firm guide with a practice block", () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "1");
    expect(practiceFirms().map((f) => f.slug).sort()).toEqual(withPractice.map((f) => f.slug).sort());
  });

  it("are in the sitemap only when they exist", async () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "");
    const { default: sitemap } = await import("@/app/sitemap");
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    const live = practiceFirms().map((f) => `/practice/${f.slug}`);
    for (const f of withPractice) expect(paths.includes(`/practice/${f.slug}`), f.slug).toBe(live.includes(`/practice/${f.slug}`));
    expect(paths.includes("/practice")).toBe(live.length > 0);
  });
});
