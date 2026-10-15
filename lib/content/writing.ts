import { siteConfig } from "@/site.config";
import { rawFirms, rawGlossary, rawGuides, rawPages } from "./all-writing";
import { showDrafts } from "./cases";
import { firmSchema, glossarySchema, guideSchema, pageSchema, type Firm, type Glossary, type Guide, type Page } from "./writing-schema";

// Typed loaders for the written pages. Every file is validated once when this module
// loads, so a malformed guide, firm guide, page or glossary stops the build.

const guides: Guide[] = rawGuides.map((raw) => guideSchema.parse(raw));
const firms: Firm[] = rawFirms.map((raw) => firmSchema.parse(raw));
const pages: Page[] = rawPages.map((raw) => pageSchema.parse(raw));
const glossaryData: Glossary = glossarySchema.parse(rawGlossary);

// ---- Guides -------------------------------------------------------------------

/** Every guide: the case-type guides first, then the skill guides (the order in all-writing.ts). */
export function allGuides(): Guide[] {
  return guides;
}

export function findGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

/** "Profitability case interviews: how to find why profit fell" -> { main, rest }. */
export function splitTitle(title: string): { main: string; rest: string | null } {
  const at = title.indexOf(":");
  if (at < 0) return { main: title, rest: null };
  return { main: title.slice(0, at).trim(), rest: title.slice(at + 1).trim() || null };
}

// ---- Firm guides ----------------------------------------------------------------

/** Every firm guide, drafts included. For tests and tooling; pages use visibleFirms() and findFirm(). */
export function allFirms(): Firm[] {
  return firms;
}

/** Ready firm guides, plus drafts where SHOW_DRAFT_CONTENT=1 (previews and local work). */
export function visibleFirms(): Firm[] {
  return firms.filter((f) => f.status === "ready" || showDrafts());
}

/** A firm guide visitors may see: a draft is not found unless drafts are shown. */
export function findFirm(slug: string): Firm | undefined {
  return visibleFirms().find((f) => f.slug === slug);
}

/** The most recent date any of the firm's sources was checked. */
export function lastChecked(firm: Firm): string {
  return firm.sources.map((s) => s.checked).sort().at(-1) ?? firm.updated;
}

// ---- Pages and glossary -----------------------------------------------------------

/** About, FAQ and the legal pages. Placeholders are filled where we can (see fillPlaceholders). */
export function findPage(slug: string): Page | undefined {
  const page = pages.find((p) => p.slug === slug);
  return page ? fillPlaceholders(page, page) : undefined;
}

export const LEGAL_SLUGS = ["terms", "privacy", "refunds", "disclaimer"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug);
}

export function glossary(): Glossary {
  return glossaryData;
}

// ---- Helpers ------------------------------------------------------------------------

/** "2026-10-15" -> "15 October 2026" (UTC, so the server and browser always agree). */
export function formatDate(iso: string, month: "long" | "short" = "long"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month, year: "numeric", timeZone: "UTC" });
}

/** The placeholders fillPlaceholders() can fill from config; every other "[...]" is for a person to fill. */
/** Placeholders filled from site.config.ts (always available) rather than by the founder editing the page. */
const CONFIG_PLACEHOLDERS: [string, string][] = [
  ["[legal entity name]", siteConfig.operator.legalName],
  ["[company number]", siteConfig.operator.companyNumber],
  ["[registered address]", siteConfig.operator.registeredOffice],
  ["[England and Wales, founder to confirm]", siteConfig.operator.registeredIn],
  ["[minimum age, founder to confirm, for example 18]", String(siteConfig.minimumAge)],
  ["[minimum age, founder to confirm]", String(siteConfig.minimumAge)],
];

export const FILLABLE_PLACEHOLDERS = ["[support email]", "[effective date]", ...CONFIG_PLACEHOLDERS.map(([from]) => from)] as const;

/**
 * Every square-bracket note still in a value's text, such as "[Founder to confirm ...]",
 * "[legal entity name]" or an unfilled "[support email]". Walks strings, arrays and
 * objects; keys are not read. Run it on a page after findPage() to see what is left.
 */
export function unfilledPlaceholders(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === "string") for (const m of v.matchAll(/\[[^[\]]+\]/g)) found.add(m[0]);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return [...found];
}

/** Only the items with no square-bracket note left in them, e.g. FAQ answers fit for structured data. */
export function withoutPlaceholders<T>(items: T[]): T[] {
  return items.filter((item) => unfilledPlaceholders(item).length === 0);
}

/**
 * Replaces the placeholders we can fill from config: the company details and minimum age
 * (site.config.ts), "[support email]" once NEXT_PUBLIC_SUPPORT_EMAIL is set, and
 * "[effective date]" once a page has `effective`. Every other square-bracket placeholder
 * stays visible for the founder to fill in.
 */
export function fillPlaceholders<T>(value: T, page?: Pick<Page, "effective">): T {
  const replacements: [string, string][] = [...CONFIG_PLACEHOLDERS];
  if (siteConfig.supportEmail) replacements.push(["[support email]", siteConfig.supportEmail]);
  if (page?.effective) replacements.push(["[effective date]", formatDate(page.effective)]);
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return replacements.reduce((s, [from, to]) => s.split(from).join(to), v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, inner]) => [k, walk(inner)]));
    return v;
  };
  return walk(value) as T;
}
