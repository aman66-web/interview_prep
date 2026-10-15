import { z } from "zod";

// A small, safe format for written pages (guides, firm guides, legal pages, FAQ).
// Content is plain text in typed blocks: no HTML and no Markdown, so nothing in a
// content file can inject markup, and every page is rendered by the same component
// (components/prose.tsx) in the site's own style.

export const text = z.string().trim().min(1);
export const slugLike = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use lowercase letters, numbers and hyphens");

/** Pages a content file may link to. Anything else is refused by the content tests. */
export const INTERNAL_LINK_PREFIXES = [
  "/cases",
  "/drills",
  "/guides",
  "/tools",
  "/pricing",
  "/login",
  "/faq",
  "/about",
  "/for-universities",
  "/legal",
  "/glossary",
] as const;

const internalHref = z
  .string()
  .regex(/^\/[a-z0-9\-/]*(#[a-z0-9-]+)?$/, "an internal path such as /drills/mental-maths")
  .refine((href) => INTERNAL_LINK_PREFIXES.some((p) => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}#`)), {
    message: `must start with one of: ${INTERNAL_LINK_PREFIXES.join(", ")}`,
  });

/** A worked number in an example: the tests recompute it (rule 2.9). */
export const checkedNumberSchema = z
  .object({
    label: text,
    inputs: z.record(z.string(), z.number()),
    expression: text,
    expected: z.number(),
  })
  .strict();

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text }).strict(),
  z.object({ type: z.literal("h2"), id: slugLike, text }).strict(),
  z.object({ type: z.literal("h3"), text }).strict(),
  z.object({ type: z.literal("ul"), items: z.array(text).min(1) }).strict(),
  z.object({ type: z.literal("ol"), items: z.array(text).min(1) }).strict(),
  z
    .object({
      type: z.literal("callout"),
      tone: z.enum(["tip", "warning", "key"]),
      title: text.optional(),
      text,
    })
    .strict(),
  z
    .object({
      type: z.literal("steps"),
      items: z.array(z.object({ title: text, text }).strict()).min(2),
    })
    .strict(),
  z
    .object({
      type: z.literal("framework"),
      title: text,
      branches: z.array(z.object({ name: text, items: z.array(text).min(1) }).strict()).min(2),
    })
    .strict(),
  z
    .object({
      type: z.literal("table"),
      caption: text,
      columns: z.array(text).min(2),
      rows: z.array(z.array(text)).min(1),
    })
    .strict()
    .refine((t) => t.rows.every((r) => r.length === t.columns.length), {
      message: "every row must have one value per column",
    }),
  z
    .object({
      type: z.literal("example"),
      title: text,
      question: text,
      answer: z.array(text).min(1),
      checks: z.array(checkedNumberSchema).default([]),
    })
    .strict(),
  z
    .object({
      type: z.literal("links"),
      title: text.optional(),
      items: z.array(z.object({ label: text, href: internalHref }).strict()).min(1),
    })
    .strict(),
]);

export type Block = z.infer<typeof blockSchema>;
export type CheckedNumber = z.infer<typeof checkedNumberSchema>;
