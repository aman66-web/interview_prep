import { rawCases } from "./all-cases";
import { caseSchema, type Case } from "./schema";

// Validated once when the module loads: a malformed case stops the build.
export const allCases: Case[] = rawCases.map((raw) => caseSchema.parse(raw));

/**
 * Drafts are hidden from real visitors. They are shown only where
 * SHOW_DRAFT_CONTENT=1 (Vercel previews and local work), so the founder and
 * a consulting reviewer can read them before anyone marks a case "reviewed".
 */
export function showDrafts() {
  return process.env.SHOW_DRAFT_CONTENT === "1";
}

export function visibleCases(): Case[] {
  return allCases.filter((c) => c.status === "reviewed" || showDrafts());
}

export function findVisibleCase(slug: string): Case | undefined {
  return visibleCases().find((c) => c.slug === slug);
}
