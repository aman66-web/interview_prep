import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { practiceCases, practiceFirms } from "@/lib/content/practice";

// The home page's interview library (components/marketing/firm-library.tsx) names firms as
// plain text. Rule 2.3: never a firm logo, and the not-affiliated line stays on the page.

const source = readFileSync("components/marketing/firm-library.tsx", "utf8");

describe("the home page interview library", () => {
  it("shows no pictures at all, so no firm logo can appear in it (rule 2.3)", () => {
    expect(source).not.toMatch(/next\/image|<img|<Image|<Photo|\.(png|jpe?g|svg|webp|gif)\b/i);
  });

  it("carries the not-affiliated line", () => {
    expect(source).toContain("siteConfig.disclaimer");
  });

  it("takes its firms and minutes from the content, not from numbers typed into the page", () => {
    expect(source).toContain("practiceFirms()");
    expect(source).toContain("estMinutes");
    expect(source).not.toMatch(/\b(25|30|35)\s*min/);
  });

  it("has firms to show, each with at least one case that has a sensible length", () => {
    const firms = practiceFirms();
    expect(firms.length).toBeGreaterThan(0);
    for (const f of firms) {
      const cases = practiceCases(f);
      expect(cases.length, f.slug).toBeGreaterThan(0);
      for (const c of cases) expect(c.est_minutes, `${f.slug}/${c.slug}`).toBeGreaterThanOrEqual(10);
    }
  });
});
