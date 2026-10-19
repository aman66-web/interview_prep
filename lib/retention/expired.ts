import { siteConfig } from "@/site.config";

// Interviews left unfinished for longer than the retention period
// (siteConfig.transcriptRetentionDays). The daily clean-up deletes their transcript
// (rule 2.7), so there is nothing left to continue: it also closes them (see
// runRetentionCleanup). There is no "abandoned" status in the database
// (supabase/migrations), so a closed interview has completed_at set (to the clean-up's
// cutoff, a year back, so it never counts as "finished recently") and, in place of a
// debrief, scores of { unfinished: true, redacted_at } (closedUnfinishedScores).
// A closed interview must not look finished: use isClosedUnfinished(scores).
//
// Pure functions with no database access, so pages and the dashboard can use them too.

const DAY_MS = 86_400_000;

/** Interviews started before this moment are past the retention period. */
export function transcriptCutoff(now: Date = new Date(), days: number = siteConfig.transcriptRetentionDays): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

/**
 * True for an interview that was never finished and is past the retention period, so
 * its transcript is (or is about to be) deleted. The clean-up closes these once a day;
 * this lets the app treat one as closed even before that run, or if a run failed.
 */
export function isExpiredUnfinished(
  session: { startedAt: string; completedAt: string | null },
  now: Date = new Date(),
  days: number = siteConfig.transcriptRetentionDays,
): boolean {
  if (session.completedAt !== null) return false;
  const started = Date.parse(session.startedAt);
  return Number.isFinite(started) && started < transcriptCutoff(now, days).getTime();
}

export type ClosedUnfinishedScores = { unfinished: true; redacted_at: string };

/** What the clean-up stores in case_sessions.scores when it closes an unfinished interview. */
export function closedUnfinishedScores(now: Date = new Date()): ClosedUnfinishedScores {
  return { unfinished: true, redacted_at: now.toISOString() };
}

/** True for an interview the clean-up closed because it was never finished (there is no debrief). */
export function isClosedUnfinished(scores: unknown): scores is ClosedUnfinishedScores {
  return (
    typeof scores === "object" &&
    scores !== null &&
    !Array.isArray(scores) &&
    (scores as { unfinished?: unknown }).unfinished === true &&
    typeof (scores as { redacted_at?: unknown }).redacted_at === "string"
  );
}

/** Plain-English explanation for a closed interview (rule 2.13 style), for the dashboard and debrief page. */
export function closedUnfinishedMessage(days: number = siteConfig.transcriptRetentionDays): string {
  return `This interview was never finished. It was more than ${days} days old, so its transcript was deleted, as our privacy policy says, and it can no longer be continued.`;
}
