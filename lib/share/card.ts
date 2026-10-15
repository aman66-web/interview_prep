import { allCases } from "@/lib/content/cases";
import { siteConfig } from "@/site.config";
import { isDrawableName, overallScore, SKILL_KEYS, SKILL_LABELS, type ShareCard } from "./token";

// What a share card shows, worked out once for the image, the share page and its
// metadata, so all three always agree.

export type CardView = {
  caseTitle: string;
  heading: string;
  dateLabel: string;
  overall: number;
  overallLabel: string;
  skills: { key: (typeof SKILL_KEYS)[number]; label: string; score: number }[];
  /** One sentence describing the card, used as the image's alt text. */
  description: string;
};

function titleFromSlug(slug: string): string {
  const words = slug.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function caseTitleForSlug(slug: string): string {
  return allCases.find((c) => c.slug === slug)?.title ?? titleFromSlug(slug);
}

export function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}

export function cardView(card: ShareCard): CardView {
  const caseTitle = caseTitleForSlug(card.caseSlug);
  const overall = overallScore(card);
  const overallLabel = overall.toFixed(1);
  const skills = SKILL_KEYS.map((key) => ({ key, label: SKILL_LABELS[key], score: card.scores[key] }));
  const heading = card.firstName ? `${possessive(card.firstName)} practice scores` : "Practice scores";
  const description = `${heading} for the ${caseTitle} case on ${siteConfig.brandName}: ${overallLabel} out of 5 overall. ${skills
    .map((s) => `${s.label} ${s.score} out of 5`)
    .join(", ")}.`;
  return { caseTitle, heading, dateLabel: formatDay(card.date), overall, overallLabel, skills, description };
}

/**
 * The card as the picture draws it. A token can only hold a name the bundled font can
 * draw (lib/share/token.ts), but this checks again just before drawing: a name with
 * any other character is left off the picture (it then says "Practice scores"), so
 * next/og never fetches a font from Google with the name in the request, and never
 * logs the name when that fetch fails.
 */
export function imageCardView(card: ShareCard): CardView {
  if (card.firstName === undefined || isDrawableName(card.firstName)) return cardView(card);
  return cardView({ scores: card.scores, caseSlug: card.caseSlug, date: card.date });
}

/** "mockpartner.com" style host for the card's footer: the configured site address, else the one this request came in on. */
export function siteHost(requestUrl?: string): string {
  for (const candidate of [process.env.NEXT_PUBLIC_SITE_URL, requestUrl]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).host.replace(/^www\./, "");
    } catch {
      // try the next one
    }
  }
  return siteConfig.brandName;
}
