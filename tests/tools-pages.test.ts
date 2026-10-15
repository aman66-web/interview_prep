import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { TOOLS } from "@/lib/tools";
import { relatedLinks, TOOL_RELATIONS } from "@/lib/tools/related";

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

  it("keeps the client tools free of server code and browser storage", () => {
    for (const file of ["market-sizing-calculator", "break-even-calculator", "mental-maths-trainer", "growth-rate-calculator", "fields"]) {
      const text = read(`components/tools/${file}.tsx`);
      expect(text.startsWith('"use client"'), file).toBe(true);
      expect(text, file).not.toMatch(/lib\/supabase|lib\/env|lib\/content\/cases|lib\/drills["/](index)?["']|fetch\(|localStorage|sessionStorage/);
    }
  });
});
