import type { Metadata } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site-url";
import { siteConfig } from "@/site.config";

// Page titles, descriptions and structured data for the case and drill pages.
// Search results cut titles at about 60 characters and descriptions at about 160,
// so text built from case data is fitted here, never cut mid-word.
// tests/practice-pages.test.ts covers these helpers and every real page's metadata.

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/** The suffix the root layout's title template adds ("%s | Mock Partner"). */
export const TITLE_SUFFIX = ` | ${siteConfig.brandName}`;

// A cut at a sentence end is only used if it keeps at least this share of the room,
// so a long description is not reduced to its first short sentence.
const MIN_SENTENCE_SHARE = 0.6;

// Text ending in an abbreviation ("e.g", "U.S", "Dr"): the full stop after it does not end a sentence.
const ENDS_IN_ABBREVIATION = /(?:\b(?:[a-z]\.)+[a-z]|\b(?:approx|cf|vs|Dr|Mr|Mrs|Ms|St))$/i;

/**
 * Fits text into `max` characters. Text that fits is returned as it is. Otherwise it is
 * cut after the last full sentence that fits (if that keeps most of the room), or else at
 * the last word boundary with "…" added. Never cuts inside a word.
 */
export function clipText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  // The last sentence end (". ", "? ", "! ") that fits, counted without the space.
  let sentenceEnd = -1;
  for (const m of clean.matchAll(/[.?!](?= )/g)) {
    const end = (m.index ?? 0) + 1;
    if (end > max) break;
    if (m[0] === "." && ENDS_IN_ABBREVIATION.test(clean.slice(0, end - 1))) continue;
    sentenceEnd = end;
  }
  if (sentenceEnd >= Math.ceil(max * MIN_SENTENCE_SHARE)) return clean.slice(0, sentenceEnd);

  // Leave one character for the ellipsis, cut at the last space, and drop dangling punctuation.
  const room = clean.slice(0, max); // max - 1 characters of text plus the character after them
  const lastSpace = room.lastIndexOf(" ");
  const cut = lastSpace > 0 ? clean.slice(0, lastSpace) : clean.slice(0, max - 1);
  return `${cut.replace(/[\s,;:(–—-]+$/u, "")}…`;
}

/**
 * The title for a page under the root layout's "%s | Mock Partner" template. It keeps the brand
 * suffix when the whole title fits in 60 characters; otherwise it shows the title alone,
 * shortened at a word boundary if it is still too long.
 */
export function pageTitle(title: string): NonNullable<Metadata["title"]> {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length + TITLE_SUFFIX.length <= TITLE_MAX) return clean;
  return { absolute: clipText(clean, TITLE_MAX) };
}

/** The title as it appears in the browser tab and search results. */
export function renderedTitle(title: Metadata["title"]): string {
  if (typeof title === "string") return `${title}${TITLE_SUFFIX}`;
  if (title && typeof title === "object" && "absolute" in title) return title.absolute;
  return "";
}

/** "Profitability case interview practice: Harbourline is a UK chain…", fitted to 160 characters. */
export function caseDescription(typeLabel: string, prompt: string): string {
  return clipText(`${typeLabel} case interview practice: ${prompt}`, DESCRIPTION_MAX);
}

/** "profitability, market entry, M&A and operations": a list in running text. */
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * CollectionPage structured data for a list page (the case library, the drills page),
 * with an ItemList of what it links to. The list is left out when there is nothing in it.
 */
export function collectionPageJsonLd({ name, description, path, items }: { name: string; description: string; path: string; items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: siteConfig.brandName, url: siteUrl() },
    ...(items.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: absoluteUrl(item.path) })),
          },
        }
      : {}),
  };
}
