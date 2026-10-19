import { EVENT_RETENTION_DAYS } from "@/lib/analytics/events";
import { siteConfig } from "@/site.config";
import { closedUnfinishedScores, type ClosedUnfinishedScores } from "./expired";
import { redactDebrief } from "./redact";

// The daily clean-up (SPEC section 9, rule 2.7), run by Vercel Cron through
// /api/cron/cleanup:
//   1. close interviews started more than siteConfig.transcriptRetentionDays ago that
//      were never finished: their transcript goes in step 2, so they can no longer be
//      continued (lib/retention/expired.ts says how a closed interview looks);
//   2. delete interview messages older than that;
//   3. for interviews that old, remove the transcript quotes, feedback text and
//      summaries from case_sessions (scores and maths results stay);
//   4. delete funnel events older than 180 days.
// Every step is safe to repeat. A failed step does not stop the others; the result
// says which failed so the cron run is marked as failed and runs again tomorrow.

const DAY_MS = 86_400_000;

export type SessionToRedact = { id: string; scores: unknown; summary: string | null };

export interface RetentionStore {
  /**
   * Closes every unfinished session started before the cutoff: completed_at becomes the
   * cutoff, scores the given marker, and the summary is cleared (summary_covers back to 0).
   * Only sessions still unfinished are touched. Returns how many were closed.
   */
  closeUnfinishedBefore(cutoffIso: string, scores: ClosedUnfinishedScores): Promise<number>;
  /** Deletes session_messages created before the cutoff; returns how many. */
  deleteMessagesBefore(cutoffIso: string): Promise<number>;
  /** Sessions started before the cutoff that still hold transcript text (a summary, or a debrief not yet redacted). */
  listSessionsToRedact(cutoffIso: string, limit: number): Promise<SessionToRedact[]>;
  saveRedactedSession(id: string, scores: unknown): Promise<void>;
  /** Deletes events created before the cutoff; returns how many. */
  deleteEventsBefore(cutoffIso: string): Promise<number>;
}

export type CleanupOptions = {
  now?: Date;
  transcriptDays?: number;
  eventDays?: number;
  batchSize?: number;
  maxBatches?: number;
};

export type CleanupResult = {
  ok: boolean;
  transcriptCutoff: string;
  eventCutoff: string;
  /** Unfinished interviews closed because their transcript is being deleted. */
  sessionsClosed: number;
  messagesDeleted: number;
  sessionsRedacted: number;
  eventsDeleted: number;
  /** True when there were more old sessions than one run handles; the next run continues. */
  moreSessionsLeft: boolean;
  failed: ("closing" | "messages" | "sessions" | "events")[];
};

export function cutoff(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

export async function runRetentionCleanup(store: RetentionStore, options: CleanupOptions = {}): Promise<CleanupResult> {
  const now = options.now ?? new Date();
  const transcriptDays = options.transcriptDays ?? siteConfig.transcriptRetentionDays;
  const eventDays = options.eventDays ?? EVENT_RETENTION_DAYS;
  const batchSize = options.batchSize ?? 200;
  const maxBatches = options.maxBatches ?? 25;

  const result: CleanupResult = {
    ok: true,
    transcriptCutoff: cutoff(now, transcriptDays),
    eventCutoff: cutoff(now, eventDays),
    sessionsClosed: 0,
    messagesDeleted: 0,
    sessionsRedacted: 0,
    eventsDeleted: 0,
    moreSessionsLeft: false,
    failed: [],
  };

  // First, so no one can carry on an interview whose transcript is about to go.
  try {
    result.sessionsClosed = await store.closeUnfinishedBefore(result.transcriptCutoff, closedUnfinishedScores(now));
  } catch (error) {
    report("closing", error, result);
  }

  try {
    result.messagesDeleted = await store.deleteMessagesBefore(result.transcriptCutoff);
  } catch (error) {
    report("messages", error, result);
  }

  try {
    const seen = new Set<string>();
    for (let batch = 0; batch < maxBatches; batch++) {
      const sessions = (await store.listSessionsToRedact(result.transcriptCutoff, batchSize)).filter((s) => !seen.has(s.id));
      if (sessions.length === 0) break;
      for (const s of sessions) {
        seen.add(s.id);
        await store.saveRedactedSession(s.id, redactDebrief(s.scores, now, transcriptDays));
        result.sessionsRedacted += 1;
      }
      if (batch === maxBatches - 1) result.moreSessionsLeft = true;
    }
  } catch (error) {
    report("sessions", error, result);
  }

  try {
    result.eventsDeleted = await store.deleteEventsBefore(result.eventCutoff);
  } catch (error) {
    report("events", error, result);
  }

  return result;
}

function report(step: CleanupResult["failed"][number], error: unknown, result: CleanupResult) {
  result.ok = false;
  result.failed.push(step);
  console.error(`retention: the ${step} step failed`, error instanceof Error ? error.message : "unknown error");
}
