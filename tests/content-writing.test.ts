import { existsSync, readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rawFirms, rawGuides, rawPages } from "@/lib/content/all-writing";
import type { Block } from "@/lib/content/blocks";
import { allCases } from "@/lib/content/cases";
import { evaluate, variablesIn } from "@/lib/content/expr";
import { CASE_TYPE_GUIDES } from "@/lib/content/guide-links";
import { allFirms, allGuides, findFirm, findPage, glossary, LEGAL_SLUGS, visibleFirms } from "@/lib/content/writing";
import { firmSchema, glossarySchema, guideSchema, pageSchema } from "@/lib/content/writing-schema";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { TOOLS } from "@/lib/tools";

// `npm run content:check` runs this file too. It checks every written page (guides,
// firm guides, about/FAQ/legal pages and the glossary) against its format, recomputes
// every worked number in a guide example (rule 2.9), and checks that every fact in a
// firm guide points at a listed source (rule 2.2).

function jsonFiles(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => `${dir}/${f}`) : [];
}
const read = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));
const slugOf = (file: string) => file.split("/").pop()!.replace(/\.json$/, "");

const guideFiles = jsonFiles("content/guides");
const firmFiles = jsonFiles("content/firms");
const pageFiles = jsonFiles("content/pages");
const today = new Date().toISOString().slice(0, 10);

function checkBlocks(blocks: Block[]): string[] {
  const problems: string[] = [];
  const ids = blocks.flatMap((b) => (b.type === "h2" ? [b.id] : []));
  if (new Set(ids).size !== ids.length) problems.push("two h2 blocks share an id");
  for (const b of blocks) {
    if (b.type !== "example") continue;
    for (const check of b.checks) {
      try {
        const used = variablesIn(check.expression);
        const given = Object.keys(check.inputs);
        for (const name of used) if (!given.includes(name)) problems.push(`${check.label}: "${name}" is not in inputs`);
        const value = evaluate(check.expression, check.inputs);
        if (Math.abs(value - check.expected) > Math.max(1e-9, Math.abs(check.expected) * 1e-4)) {
          problems.push(`${check.label}: expected ${check.expected} but the expression gives ${value}`);
        }
      } catch (error) {
        problems.push(`${check.label}: ${(error as Error).message}`);
      }
    }
  }
  return problems;
}

describe.runIf(guideFiles.length > 0)("guides", () => {
  it.each(guideFiles)("%s matches the guide format and its maths is right", (file) => {
    const parsed = guideSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug, "the file name must match the slug").toBe(slugOf(file));
    expect(parsed.data.updated <= today, "updated cannot be in the future").toBe(true);
    expect(checkBlocks(parsed.data.blocks)).toEqual([]);
  });

  it("has at most one case-type guide per case type", () => {
    const types = guideFiles
      .map((f) => guideSchema.safeParse(read(f)))
      .flatMap((r) => (r.success && r.data.kind === "case_type" ? [r.data.case_type] : []));
    expect(new Set(types).size).toBe(types.length);
  });
});

describe.runIf(firmFiles.length > 0)("firm guides", () => {
  it.each(firmFiles)("%s: every fact points at a listed source (rule 2.2)", (file) => {
    const parsed = firmSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug).toBe(slugOf(file));
    const ids = parsed.data.sources.map((s) => s.id);
    expect(new Set(ids).size, "source ids must be unique").toBe(ids.length);
    const missing = parsed.data.sections.flatMap((s) => s.items.filter((i) => !ids.includes(i.source)).map((i) => i.source));
    expect(missing).toEqual([]);
    for (const s of parsed.data.sources) expect(s.checked <= today, `${s.id}: checked date is in the future`).toBe(true);
  });
});

describe.runIf(pageFiles.length > 0)("pages", () => {
  it.each(pageFiles)("%s matches the page format", (file) => {
    const parsed = pageSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug).toBe(slugOf(file));
    expect(checkBlocks(parsed.data.blocks)).toEqual([]);
  });
});

describe.runIf(existsSync("content/glossary.json"))("glossary", () => {
  it("matches the glossary format, with unique terms", () => {
    const parsed = glossarySchema.safeParse(read("content/glossary.json"));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    const slugs = parsed.data.terms.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const guides = guideFiles.map(slugOf);
    const unknown = parsed.data.terms.flatMap((t) => (t.related_guide && !guides.includes(t.related_guide) ? [t.related_guide] : []));
    expect(unknown, "related_guide must name a guide in content/guides").toEqual([]);
  });
});

describe("the written-content registry (lib/content/all-writing.ts)", () => {
  const slugsIn = (raw: unknown[]) => raw.map((r) => (r as { slug: string }).slug).sort();

  it("registers every guide, firm guide and page file", () => {
    expect(slugsIn(rawGuides), "add new guide files to lib/content/all-writing.ts").toEqual(guideFiles.map(slugOf).sort());
    expect(slugsIn(rawFirms), "add new firm files to lib/content/all-writing.ts").toEqual(firmFiles.map(slugOf).sort());
    expect(slugsIn(rawPages), "add new page files to lib/content/all-writing.ts").toEqual(pageFiles.map(slugOf).sort());
    expect(allGuides()).toHaveLength(guideFiles.length);
    expect(allFirms()).toHaveLength(firmFiles.length);
  });

  it("has a guide for every case type that lib/content/guide-links.ts links to", () => {
    const guides = allGuides();
    for (const [type, slug] of Object.entries(CASE_TYPE_GUIDES)) {
      const guide = guides.find((g) => g.slug === slug);
      expect(guide, `${type} links to /guides/${slug}, which does not exist`).toBeDefined();
      expect(guide?.kind, slug).toBe("case_type");
      expect(guide?.case_type, slug).toBe(type);
    }
  });

  it("has every page the site links to: about, FAQ and the four legal pages", () => {
    for (const slug of ["about", "faq", ...LEGAL_SLUGS]) expect(findPage(slug), slug).toBeDefined();
  });
});

describe("draft firm guides", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("are hidden unless drafts are shown, and ready ones are always visible", () => {
    const drafts = allFirms().filter((f) => f.status === "draft");
    const ready = allFirms().filter((f) => f.status === "ready");
    vi.stubEnv("SHOW_DRAFT_CONTENT", "");
    expect(visibleFirms().map((f) => f.slug)).toEqual(ready.map((f) => f.slug));
    for (const d of drafts) expect(findFirm(d.slug), d.slug).toBeUndefined();
    vi.stubEnv("SHOW_DRAFT_CONTENT", "1");
    expect(visibleFirms()).toHaveLength(allFirms().length);
    for (const d of drafts) expect(findFirm(d.slug), d.slug).toBeDefined();
  });

  it("keeps McKinsey a draft until its own careers pages have been read (docs/RESEARCH_TODO.md)", () => {
    expect(allFirms().find((f) => f.slug === "mckinsey")?.status).toBe("draft");
  });
});

describe("links inside written content", () => {
  // Pages that exist (or are being built) at fixed paths, plus every page made from data.
  const known = new Set<string>([
    "/cases",
    "/drills",
    "/guides",
    "/tools",
    "/pricing",
    "/login",
    "/faq",
    "/about",
    "/for-universities",
    "/glossary",
    ...allCases.map((c) => `/cases/${c.slug}`),
    ...DRILL_CATEGORIES.map((c) => `/drills/${c}`),
    ...allGuides().map((g) => `/guides/${g.slug}`),
    // Only ready firm guides: a link to a draft would 404 on the live site.
    ...allFirms()
      .filter((f) => f.status === "ready")
      .map((f) => `/guides/firms/${f.slug}`),
    ...TOOLS.map((t) => `/tools/${t.slug}`),
    ...LEGAL_SLUGS.map((s) => `/legal/${s}`),
  ]);
  const terms = new Set(glossary().terms.map((t) => t.slug));

  function linksIn(blocks: Block[]): string[] {
    return blocks.flatMap((b) => (b.type === "links" ? b.items.map((i) => i.href) : []));
  }
  const sources = [
    ...allGuides().map((g) => ({ name: `guides/${g.slug}`, links: linksIn(g.blocks) })),
    ...pageFiles.map((f) => ({ name: `pages/${slugOf(f)}`, links: linksIn(pageSchema.parse(read(f)).blocks) })),
  ];

  it.each(sources)("$name links only to pages that exist", ({ links }) => {
    const broken = links.filter((href) => {
      const [path, hash] = href.split("#");
      if (!known.has(path)) return true;
      if (path === "/glossary" && hash) return !terms.has(hash);
      return false;
    });
    expect(broken).toEqual([]);
  });
});

describe("placeholders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("fills [support email] only once the support email is set, and leaves the others visible", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
    vi.resetModules();
    const before = await import("@/lib/content/writing");
    expect(JSON.stringify(before.findPage("privacy"))).toContain("[support email]");

    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "help@example.com");
    vi.resetModules();
    const after = await import("@/lib/content/writing");
    const text = JSON.stringify(after.findPage("privacy"));
    expect(text).not.toContain("[support email]");
    expect(text).toContain("help@example.com");
    expect(text).toContain("[legal entity name]");
    expect(after.fillPlaceholders("From [effective date].", { effective: "2026-11-01" })).toBe("From 1 November 2026.");
    expect(after.fillPlaceholders("From [effective date].", {})).toBe("From [effective date].");
  });
});

describe("sitemap.xml and robots.txt", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("list every public learn page and leave out drafts on the live site", async () => {
    vi.stubEnv("SHOW_DRAFT_CONTENT", "");
    const { default: sitemap } = await import("@/app/sitemap");
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    expect(new Set(paths).size, "no duplicates").toBe(paths.length);
    for (const g of allGuides()) expect(paths).toContain(`/guides/${g.slug}`);
    for (const s of LEGAL_SLUGS) expect(paths).toContain(`/legal/${s}`);
    for (const p of ["/", "/guides", "/glossary", "/about", "/faq", "/tools", "/cases", "/drills"]) expect(paths).toContain(p);
    for (const f of allFirms()) expect(paths.includes(`/guides/firms/${f.slug}`), f.slug).toBe(f.status === "ready");
    for (const c of allCases) expect(paths.includes(`/cases/${c.slug}`), c.slug).toBe(c.status === "reviewed");
  });

  it("keep crawlers out of the app, the API, sign-in links and admin", async () => {
    const { default: robots } = await import("@/app/robots");
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow;
    expect(disallow).toEqual(expect.arrayContaining(["/app", "/api", "/auth", "/admin"]));
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("search titles and descriptions", () => {
  it("are unique across guides, firm guides and pages", () => {
    const pages = pageFiles.map((f) => pageSchema.parse(read(f)));
    const all = [...allGuides(), ...allFirms(), ...pages];
    const titles = all.map((x) => x.seo_title.toLowerCase());
    const descriptions = all.map((x) => x.description.toLowerCase());
    expect(titles.filter((t, i) => titles.indexOf(t) !== i), "duplicate seo_title").toEqual([]);
    expect(descriptions.filter((d, i) => descriptions.indexOf(d) !== i), "duplicate description").toEqual([]);
  });
});
