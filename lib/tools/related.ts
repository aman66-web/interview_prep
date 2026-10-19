import { visibleCases } from "@/lib/content/cases";
import { guideHrefForCaseType } from "@/lib/content/guide-links";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { CATEGORY_INFO, type DrillCategory } from "@/lib/drills/types";

// Where each free tool sends people next: a drill category, a guide and a case.
// Server only (it reads the case list). A case appears only once it is visible
// (reviewed, or on a preview with drafts shown); otherwise the link goes to the library.

export type RelatedLink = { href: string; kicker: string; title: string; text: string };

export type ToolRelations = { drill: DrillCategory; caseType: string; guide?: { href: string; title: string } };

export const TOOL_RELATIONS: Record<string, ToolRelations> = {
  "market-sizing-calculator": { drill: "market-sizing", caseType: "market_sizing" },
  "break-even-calculator": { drill: "mental-maths", caseType: "profitability" },
  "mental-maths-trainer": {
    drill: "mental-maths",
    caseType: "profitability",
    guide: { href: "/guides/case-interview-maths", title: "Case interview maths" },
  },
  "growth-rate-calculator": { drill: "mental-maths", caseType: "growth" },
};

/** The case to suggest for a type: the free full interview first, then a free preview, then any. */
export function relatedCase(caseType: string): { slug: string; title: string; free: boolean } | null {
  const ofType = visibleCases().filter((c) => c.type === caseType);
  const best =
    ofType.find((c) => c.free_starter) ?? ofType.find((c) => c.free_preview) ?? ofType[0];
  return best ? { slug: best.slug, title: best.title, free: best.free_starter || best.free_preview } : null;
}

export function relatedLinks(toolSlug: string): RelatedLink[] {
  const rel = TOOL_RELATIONS[toolSlug];
  if (!rel) return [];
  const label = CASE_TYPE_LABELS[rel.caseType] ?? "Case";
  const links: RelatedLink[] = [
    {
      href: `/drills/${rel.drill}`,
      kicker: "Drill",
      title: `${CATEGORY_INFO[rel.drill].title} drills`,
      text: CATEGORY_INFO[rel.drill].blurb,
    },
  ];
  const guideHref = rel.guide?.href ?? guideHrefForCaseType(rel.caseType);
  if (guideHref) {
    links.push({
      href: guideHref,
      kicker: "Guide",
      title: rel.guide?.title ?? `${label} case interviews`,
      text: rel.guide ? "The maths case interviews use, with worked examples to try in your head." : `How ${label.toLowerCase()} cases work, step by step, with a worked example.`,
    });
  }
  const c = relatedCase(rel.caseType);
  links.push(
    c
      ? { href: `/cases/${c.slug}`, kicker: `${label} case`, title: c.title, text: c.free ? "Free to try with the AI interviewer." : "Read the prompt, then practise it with the AI interviewer." }
      : { href: "/cases", kicker: "Cases", title: "The case library", text: "Original cases with invented numbers that add up, checked by our tests." },
  );
  return links;
}
