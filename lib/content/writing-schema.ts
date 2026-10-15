import { z } from "zod";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { blockSchema, slugLike, text } from "./blocks";
import { CASE_TYPES } from "./schema";

// Formats for the written pages (kit sections 5 and 10). Files live in:
//   content/guides/<slug>.json   one guide per case type, plus a few skill guides
//   content/firms/<slug>.json    firm guides: every fact carries a source (rule 2.2)
//   content/pages/<slug>.json    about, FAQ and the legal pages
//   content/glossary.json        the glossary
// tests/content-writing.test.ts checks every file against these schemas.

const isoDate = z.iso.date();
const seoTitle = text.max(60, "keep titles to 60 characters so search results don't cut them");
const seoDescription = text.min(70).max(160, "keep descriptions between 70 and 160 characters");
const faqItem = z.object({ q: text, a: text }).strict();

export const guideSchema = z
  .object({
    slug: slugLike,
    kind: z.enum(["case_type", "skill"]),
    /** Set for case-type guides, so the guide can list matching cases. */
    case_type: z.enum(CASE_TYPES).optional(),
    title: text,
    seo_title: seoTitle,
    description: seoDescription,
    updated: isoDate,
    reading_minutes: z.number().int().min(2).max(30),
    /** A plain, direct answer to the page's main question, shown first. */
    summary: text,
    blocks: z.array(blockSchema).min(8),
    faq: z.array(faqItem).max(8).default([]),
    related_drills: z.array(z.enum(DRILL_CATEGORIES)).default([]),
  })
  .strict()
  .refine((g) => g.kind !== "case_type" || g.case_type !== undefined, {
    message: "a case-type guide needs case_type",
    path: ["case_type"],
  });
export type Guide = z.infer<typeof guideSchema>;

/** Firm guides: nothing is stated without a source from the firm's own pages or a reputable publisher (rule 2.2). */
export const firmSchema = z
  .object({
    slug: slugLike,
    name: text,
    /**
     * "draft" guides are hidden on the live site (404, not listed, not in the sitemap) and shown,
     * with a draft notice, only where SHOW_DRAFT_CONTENT=1. Set "ready" once every fact is sourced.
     */
    status: z.enum(["draft", "ready"]),
    short_name: text,
    seo_title: seoTitle,
    description: seoDescription,
    updated: isoDate,
    intro: text,
    sections: z
      .array(
        z
          .object({
            heading: text,
            items: z.array(z.object({ text, source: slugLike }).strict()).min(1),
          })
          .strict(),
      )
      .min(1),
    sources: z
      .array(
        z
          .object({
            id: slugLike,
            title: text,
            publisher: text,
            url: z.url().startsWith("https://"),
            checked: isoDate,
          })
          .strict(),
      )
      .min(1),
    /** General practice advice in our own words. Must not state facts about the firm. */
    practice_advice: z.array(text).min(1),
  })
  .strict();
export type Firm = z.infer<typeof firmSchema>;

export const pageSchema = z
  .object({
    slug: slugLike,
    title: text,
    seo_title: seoTitle,
    description: seoDescription,
    updated: isoDate,
    /** Legal pages start as drafts; the founder (and ideally a lawyer) approves them. */
    status: z.enum(["draft", "approved"]),
    /** When the page takes effect (legal pages). Fills the "[effective date]" placeholder once set. */
    effective: isoDate.optional(),
    intro: text.optional(),
    blocks: z.array(blockSchema).default([]),
    faq: z
      .array(z.object({ heading: text, items: z.array(faqItem).min(1) }).strict())
      .default([]),
  })
  .strict()
  .refine((p) => p.blocks.length > 0 || p.faq.length > 0, { message: "a page needs blocks or faq" });
export type Page = z.infer<typeof pageSchema>;

export const glossarySchema = z
  .object({
    updated: isoDate,
    terms: z
      .array(
        z
          .object({
            slug: slugLike,
            term: text,
            definition: text,
            example: text.optional(),
            related_guide: slugLike.optional(),
          })
          .strict(),
      )
      .min(20),
  })
  .strict();
export type Glossary = z.infer<typeof glossarySchema>;
