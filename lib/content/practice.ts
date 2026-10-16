import { findVisibleCase } from "./cases";
import type { Case } from "./schema";
import { visibleFirms } from "./writing";
import type { Firm } from "./writing-schema";

// Firm-style practice pages (/practice/<firm>): a firm guide's sourced facts about its
// interviews, next to our own original cases that suit that kind of interview. A page
// exists only for a visible firm guide with a `practice` block and at least one case
// a visitor may see (drafts show only where SHOW_DRAFT_CONTENT=1).

export type PracticeFirm = Firm & { practice: NonNullable<Firm["practice"]> };

/** The firm's chosen cases that this visitor may see, in the order the guide lists them. */
export function practiceCases(firm: Firm): Case[] {
  return (firm.practice?.cases ?? []).map((slug) => findVisibleCase(slug)).filter((c): c is Case => c !== undefined);
}

export function practiceFirms(): PracticeFirm[] {
  return visibleFirms().filter((f): f is PracticeFirm => f.practice !== undefined && practiceCases(f).length > 0);
}

export function findPracticeFirm(slug: string): PracticeFirm | undefined {
  return practiceFirms().find((f) => f.slug === slug);
}

/** The guide's sourced facts that the practice page repeats, section by section. */
export function practiceSections(firm: PracticeFirm): Firm["sections"] {
  return firm.practice.show_sections.map((heading) => firm.sections.find((s) => s.heading === heading)).filter((s): s is Firm["sections"][number] => s !== undefined);
}

/** The sources the practice page cites, in the guide's own order (so numbers match the guide). */
export function practiceSources(firm: PracticeFirm): Firm["sources"] {
  const used = new Set(practiceSections(firm).flatMap((s) => s.items.map((i) => i.source)));
  return firm.sources.filter((s) => used.has(s.id));
}

export const SECTOR_LABELS: Record<Firm["sector"], { group: string; interview: string }> = {
  consulting: { group: "Consulting firms", interview: "case interview" },
  banking: { group: "Banks", interview: "interview and case study" },
};
