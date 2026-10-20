import { existsSync, readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rawFirms, rawGuides, rawPages } from "@/lib/content/all-writing";
import type { Block } from "@/lib/content/blocks";
import { allCases } from "@/lib/content/cases";
import { evaluate, variablesIn } from "@/lib/content/expr";
import { CASE_TYPE_GUIDES } from "@/lib/content/guide-links";
import { DEFAULT_SHARE_IMAGE, pageOpenGraph } from "@/components/learn/seo";
import { MOCK_EXAMPLE } from "@/components/marketing/mocks";
import {
  allFirms,
  allGuides,
  fillPlaceholders,
  FILLABLE_PLACEHOLDERS,
  findFirm,
  findPage,
  glossary,
  LEGAL_SLUGS,
  unfilledPlaceholders,
  visibleFirms,
  withoutPlaceholders,
} from "@/lib/content/writing";
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

  it("builds each firm guide only from that firm's own careers pages (rule 2.2)", () => {
    // Each firm's own sites. Hosts on a recruiting platform (Pinpoint, Oracle) are the
    // firm's own job pages there, linked from its careers site; adding a host here needs
    // that same check.
    const domains: Record<string, string[]> = {
      bain: ["www.bain.com"],
      bcg: ["careers.bcg.com"],
      mckinsey: ["www.mckinsey.com"],
      deloitte: ["www.deloitte.com", "usrecruiting.deloitte.com"],
      accenture: ["www.accenture.com", "accenture.pinpointhq.com"],
      "pwc-strategy": ["www.pwc.co.uk", "www.pwc.com", "www.strategyand.pwc.com"],
      "ey-parthenon": ["www.ey.com", "ukstudents.ey.com"],
      "jp-morgan": ["www.jpmorganchase.com", "careers.jpmorgan.com", "privatebank.jpmorgan.com", "jpmc.fa.oraclecloud.com"],
      "goldman-sachs": ["www.goldmansachs.com"],
      hsbc: ["www.hsbc.com"],
      "oliver-wyman": ["www.oliverwyman.com", "www.oliverwyman.de", "mmc.wd1.myworkdayjobs.com"],
      lek: ["www.lek.com", "lek.tal.net"],
      occ: ["www.occstrategy.com", "careers.occstrategy.com"],
      barclays: ["search.jobs.barclays", "tbcdn.talentbrew.com"],
      "morgan-stanley": ["www.morganstanley.com"],
      citi: ["jobs.citi.com"],
    };
    for (const firm of allFirms()) {
      const hosts = domains[firm.slug];
      expect(hosts, firm.slug).toBeDefined();
      for (const source of firm.sources) expect(hosts, `${firm.slug}: ${source.url}`).toContain(new URL(source.url).host);
    }
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
    // Company details and the minimum age come from site.config.ts.
    expect(text).not.toContain("[legal entity name]");
    expect(text).toContain("MARTZEY LTD");
    // Approved pages carry no note for a person to fill in, so nothing in square brackets is left.
    for (const slug of ["terms", "privacy", "refunds", "disclaimer", "about", "faq"]) {
      const page = after.findPage(slug);
      expect(page?.status, slug).toBe("approved");
      expect(after.unfilledPlaceholders(page), slug).toEqual([]);
    }
    expect(after.fillPlaceholders("From [effective date].", { effective: "2026-11-01" })).toBe("From 1 November 2026.");
    expect(after.fillPlaceholders("From [effective date].", {})).toBe("From [effective date].");
  });

  it("finds every square-bracket note left in a value, in strings, lists and objects", () => {
    expect(unfilledPlaceholders("Nothing to fill.")).toEqual([]);
    expect(unfilledPlaceholders({ a: "Run by [legal entity name].", b: ["[Founder to confirm.]", "ok"], c: { d: "[Lawyer to confirm.]" } }).sort()).toEqual(
      ["[Founder to confirm.]", "[Lawyer to confirm.]", "[legal entity name]"].sort(),
    );
    expect(unfilledPlaceholders(["[support email]", "[support email]"])).toEqual(["[support email]"]);
    expect(withoutPlaceholders([{ q: "Ready?", a: "Yes." }, { q: "Refunds?", a: "[Founder to confirm.]" }])).toEqual([{ q: "Ready?", a: "Yes." }]);
  });

  it("leaves no founder or lawyer notes in a page once it is approved (rule 2.2)", () => {
    // Drafts may hold "[Founder to confirm ...]" notes: they carry a visible draft banner.
    // An approved page is shown as final text, so only the placeholders filled from
    // config may remain, and "[effective date]" only if the page has an effective date.
    for (const file of pageFiles) {
      const page = pageSchema.parse(read(file));
      if (page.status !== "approved") continue;
      const left = unfilledPlaceholders(fillPlaceholders(page, page)).filter((p) => p !== "[support email]");
      expect(left, `${file} is approved but still has placeholders`).toEqual([]);
    }
  });

  it("only fills the placeholders it lists (company details and age come from site.config.ts)", () => {
    expect(FILLABLE_PLACEHOLDERS).toEqual([
      "[support email]",
      "[effective date]",
      "[legal entity name]",
      "[company number]",
      "[registered address]",
      "[England and Wales, founder to confirm]",
      "[minimum age, founder to confirm, for example 18]",
      "[minimum age, founder to confirm]",
    ]);
  });
});

describe("draft about and FAQ pages", () => {
  const source = (path: string) => readFileSync(path, "utf8");

  it("show their draft banner on the live site too, not only on previews", () => {
    for (const path of ["app/about/page.tsx", "app/faq/page.tsx"]) {
      const text = source(path);
      expect(text, path).toContain('page.status === "draft"');
      expect(text, path).toContain("<DraftNotice");
      expect(text, path).not.toContain("showDrafts()");
    }
  });

  it("stay out of search results while they are drafts, and are indexed once approved", async () => {
    const about = await import("@/app/about/page");
    const faq = await import("@/app/faq/page");
    for (const [slug, meta] of [
      ["about", about.generateMetadata()],
      ["faq", faq.generateMetadata()],
    ] as const) {
      const robots = meta.robots as { index?: boolean } | undefined;
      if (findPage(slug)?.status === "draft") expect(robots?.index, slug).toBe(false);
      else expect(robots, slug).toBeUndefined();
    }
  });

  it("keep founder notes out of the FAQ's structured data", () => {
    const faq = findPage("faq");
    expect(faq).toBeDefined();
    const items = faq!.faq.flatMap((g) => g.items);
    const finished = withoutPlaceholders(items);
    expect(unfilledPlaceholders(finished)).toEqual([]);
    expect(source("app/faq/page.tsx")).toContain("faqJsonLd(finishedItems)");
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
    for (const p of ["/", "/guides", "/glossary", "/tools", "/cases", "/drills"]) expect(paths).toContain(p);
    // About and FAQ are noindex while drafts, so they are listed only once approved.
    for (const slug of ["about", "faq"]) expect(paths.includes(`/${slug}`), slug).toBe(findPage(slug)?.status === "approved");
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

  it("let social sites fetch the share-card pictures under /api/og/", async () => {
    const { default: robots } = await import("@/app/robots");
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const allow = ([] as string[]).concat(rule.allow ?? []);
    expect(allow).toContain("/");
    // The longest matching rule wins, so this must be longer than "/api".
    expect(allow).toContain("/api/og/");
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

describe("share pictures for pages with their own Open Graph", () => {
  // A page's openGraph replaces the layout's, picture and all, so pageOpenGraph adds it back.
  it("always include the site's default share picture", () => {
    for (const og of [
      pageOpenGraph({ title: "T", description: "D", path: "/about" }),
      pageOpenGraph({ type: "article", title: "T", description: "D", path: "/guides/x", modifiedTime: "2026-10-15" }),
    ]) {
      expect(og.images).toEqual([DEFAULT_SHARE_IMAGE]);
      expect(og.siteName).toBe("CaseSpar");
    }
    expect(DEFAULT_SHARE_IMAGE.url).toBe("/opengraph-image");
    expect(existsSync("app/opengraph-image.tsx"), "the picture DEFAULT_SHARE_IMAGE points at").toBe(true);
  });

  it("are set on the about, FAQ, legal, guides and glossary pages", async () => {
    const about = (await import("@/app/about/page")).generateMetadata();
    const faq = (await import("@/app/faq/page")).generateMetadata();
    const legal = await (await import("@/app/legal/[slug]/page")).generateMetadata({ params: Promise.resolve({ slug: "privacy" }) });
    const guides = (await import("@/app/guides/page")).metadata;
    const glossaryPage = (await import("@/app/glossary/page")).metadata;
    for (const [name, meta] of Object.entries({ about, faq, legal, guides, glossaryPage })) {
      expect((meta.openGraph as { images?: unknown }).images, name).toEqual([DEFAULT_SHARE_IMAGE]);
    }
  });
});

describe("the home page's product pictures", () => {
  // They must not give away any case: the numbers come from the free profitability
  // guide's worked example, which is public and recomputed above.
  const guide = allGuides().find((g) => g.slug === MOCK_EXAMPLE.guide);
  const checks = new Map(
    (guide?.blocks ?? []).flatMap((b) => (b.type === "example" ? b.checks : [])).map((c) => [c.label, c.expected] as const),
  );
  const expected = (label: string) => {
    expect(checks.has(label), `the guide has no check called "${label}"`).toBe(true);
    return checks.get(label);
  };

  it("use the guide's worked example, number for number", () => {
    expect(guide, `content/guides/${MOCK_EXAMPLE.guide}.json`).toBeDefined();
    expect(expected("Ticket sales (£m)")).toBe(MOCK_EXAMPLE.ticketSales);
    expect(expected("Food and drink sales last year (£m)")).toBe(MOCK_EXAMPLE.foodSalesLast);
    expect(expected("Food and drink sales this year (£m)")).toBe(MOCK_EXAMPLE.foodSalesNow);
    expect(expected("Profit last year (£m)")).toBe(MOCK_EXAMPLE.profitLast);
    expect(expected("Profit this year (£m)")).toBe(MOCK_EXAMPLE.profitNow);
    expect(expected("Food and drink contribution last year (£m)")).toBe(MOCK_EXAMPLE.foodContributionLast);
    expect(expected("Food and drink contribution this year (£m)")).toBe(MOCK_EXAMPLE.foodContributionNow);
    expect(expected("Share of the profit fall from food and drink")).toBe(MOCK_EXAMPLE.shareOfFall);
    expect(expected("Net rise in fixed costs (£m)")).toBe(MOCK_EXAMPLE.fixedNow - MOCK_EXAMPLE.fixedLast);
    const example = JSON.stringify(guide?.blocks);
    for (const text of [MOCK_EXAMPLE.company.split(" ")[0], `${MOCK_EXAMPLE.visitsM} million`, `£${MOCK_EXAMPLE.filmHire}m film hire`, `£${MOCK_EXAMPLE.fixedLast}m fixed costs`]) {
      expect(example, text).toContain(text);
    }
  });

  it("name no case from the library and show none of its insights", () => {
    const files = ["app/page.tsx", "components/marketing/mocks.tsx"];
    const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
    for (const c of allCases) {
      const company = c.title.split(":")[0].trim();
      expect(text, `${company} (${c.slug}) appears in the home page pictures`).not.toContain(company);
      for (const e of c.exhibits) expect(text, `${c.slug} exhibit insight`).not.toContain(e.insight);
    }
  });
});
