import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import { metadata as universitiesMetadata } from "@/app/for-universities/page";
import { metadata as toolsMetadata } from "@/app/tools/page";
import { DEFAULT_SHARE_IMAGE } from "@/components/learn/seo";
import { NUMBER_INPUT_PROPS } from "@/components/tools/fields";
import { toolMetadata } from "@/components/tools/tool-page";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { TOOLS } from "@/lib/tools";
import { relatedLinks, TOOL_RELATIONS } from "@/lib/tools/related";
import { siteConfig } from "@/site.config";

// The free tool pages: one folder per tool in lib/tools.ts, and every "keep practising"
// link points somewhere real.

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("tools: pages", () => {
  it("has a page for every tool in lib/tools.ts, using its metadata", () => {
    for (const tool of TOOLS) {
      const path = `app/tools/${tool.slug}/page.tsx`;
      expect(existsSync(join(root, path)), path).toBe(true);
      const text = read(path);
      expect(text).toContain(`const SLUG = "${tool.slug}"`);
      expect(text).toContain("toolMetadata(SLUG)");
    }
  });

  it("links every tool to a real drill category, guide and case page", () => {
    for (const tool of TOOLS) {
      expect(TOOL_RELATIONS[tool.slug], tool.slug).toBeDefined();
      const links = relatedLinks(tool.slug);
      expect(links.length).toBe(3);
      const [drill, guide, caseLink] = links;
      expect((DRILL_CATEGORIES as readonly string[]).map((c) => `/drills/${c}`)).toContain(drill.href);
      const guideSlug = guide.href.replace(/^\/guides\//, "");
      expect(existsSync(join(root, "content/guides", `${guideSlug}.json`)), guide.href).toBe(true);
      expect(caseLink.href === "/cases" || caseLink.href.startsWith("/cases/")).toBe(true);
    }
  });

  it("only links to a case people can see", () => {
    const before = process.env.SHOW_DRAFT_CONTENT;
    try {
      process.env.SHOW_DRAFT_CONTENT = "";
      // With drafts hidden (production today), a draft case is never linked.
      for (const tool of TOOLS) {
        const caseLink = relatedLinks(tool.slug)[2];
        if (caseLink.href !== "/cases") {
          const slug = caseLink.href.replace("/cases/", "");
          const file = JSON.parse(read(`content/cases/${slug}.json`));
          expect(file.status).toBe("reviewed");
        }
      }
      process.env.SHOW_DRAFT_CONTENT = "1";
      expect(relatedLinks("break-even-calculator")[2].href).toBe("/cases/harbourline-bakeries"); // the free starter case
    } finally {
      process.env.SHOW_DRAFT_CONTENT = before;
    }
  });

  it("gives number boxes the full keyboard, so -3, 12% and 4.8bn can be typed on a phone", () => {
    expect(NUMBER_INPUT_PROPS.inputMode).toBe("text");
    for (const file of ["market-sizing-calculator", "break-even-calculator", "mental-maths-trainer", "growth-rate-calculator", "fields"]) {
      const text = read(`components/tools/${file}.tsx`);
      expect(text, file).not.toMatch(/inputMode="(decimal|numeric)"/);
    }
    expect(read("components/tools/mental-maths-trainer.tsx")).toContain("{...NUMBER_INPUT_PROPS}");
  });

  it("keeps the client tools free of server code and browser storage", () => {
    for (const file of ["market-sizing-calculator", "break-even-calculator", "mental-maths-trainer", "growth-rate-calculator", "fields"]) {
      const text = read(`components/tools/${file}.tsx`);
      expect(text.startsWith('"use client"'), file).toBe(true);
      expect(text, file).not.toMatch(/lib\/supabase|lib\/env|lib\/content\/cases|lib\/drills["/](index)?["']|fetch\(|localStorage|sessionStorage/);
    }
  });
});

// Search results show about 60 characters of a title and 155-160 of a description.
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const shown = (m: Metadata) => `${m.title as string} | ${siteConfig.brandName}`;

describe("tools: page titles, descriptions and share cards", () => {
  const pages: [string, Metadata][] = [
    ["/tools", toolsMetadata],
    ["/for-universities", universitiesMetadata],
    ...TOOLS.map((t): [string, Metadata] => [`/tools/${t.slug}`, toolMetadata(t.slug)]),
  ];

  for (const [path, m] of pages) {
    it(`${path}: a title and description that fit in search results`, () => {
      expect(typeof m.title).toBe("string");
      expect(shown(m).length, shown(m)).toBeLessThanOrEqual(TITLE_MAX);
      const description = m.description ?? "";
      expect(description.length, description).toBeGreaterThan(50);
      expect(description.length, description).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(description).toMatch(/\.$/);
    });

    it(`${path}: shares with the site's picture, name and type`, () => {
      const og = m.openGraph as Record<string, unknown> | undefined;
      expect(og, path).toBeDefined();
      expect(og!.images).toEqual([DEFAULT_SHARE_IMAGE]);
      expect(og!.siteName).toBe(siteConfig.brandName);
      expect(og!.type).toBe("website");
      expect(og!.url).toBe(path);
      expect(og!.description).toBe(m.description);
    });
  }
});
