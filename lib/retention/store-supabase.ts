import type { SupabaseClient } from "@supabase/supabase-js";
import type { RetentionStore, SessionToRedact } from "./cleanup";

// The clean-up's database side. Uses the admin (secret key) client, which only the
// cron route handler creates after checking CRON_SECRET.

function fail(what: string, error: { message: string; code?: string }): never {
  throw new Error(`Database error while ${what}: ${error.code ?? error.message}`);
}

export function createRetentionStore(db: Pick<SupabaseClient, "from">): RetentionStore {
  return {
    async closeUnfinishedBefore(cutoffIso, scores) {
      // One statement, so it cannot race an interview being finished at the same moment:
      // only rows still unfinished match. completed_at is the cutoff (a year back), not
      // today, so the admin page's "finished in the last 30 days" never counts these.
      const { count, error } = await db
        .from("case_sessions")
        .update({ completed_at: cutoffIso, scores, summary: null, summary_covers: 0 }, { count: "exact" })
        .is("completed_at", null)
        .lt("started_at", cutoffIso);
      if (error) fail("closing old unfinished sessions", error);
      return count ?? 0;
    },

    async deleteMessagesBefore(cutoffIso) {
      const { count, error } = await db.from("session_messages").delete({ count: "exact" }).lt("created_at", cutoffIso);
      if (error) fail("deleting old messages", error);
      return count ?? 0;
    },

    async listSessionsToRedact(cutoffIso, limit) {
      // Two simple queries rather than one "or" filter: sessions with a summary, and
      // sessions with a debrief that has not been redacted yet.
      const withSummary = await db
        .from("case_sessions")
        .select("id, scores, summary")
        .lt("started_at", cutoffIso)
        .not("summary", "is", null)
        .order("started_at", { ascending: true })
        .limit(limit);
      if (withSummary.error) fail("listing old sessions", withSummary.error);
      const withDebrief = await db
        .from("case_sessions")
        .select("id, scores, summary")
        .lt("started_at", cutoffIso)
        .not("scores", "is", null)
        .is("scores->>redacted_at", null)
        .order("started_at", { ascending: true })
        .limit(limit);
      if (withDebrief.error) fail("listing old debriefs", withDebrief.error);

      const byId = new Map<string, SessionToRedact>();
      for (const row of [...(withSummary.data ?? []), ...(withDebrief.data ?? [])] as SessionToRedact[]) byId.set(row.id, row);
      return [...byId.values()].slice(0, limit);
    },

    async saveRedactedSession(id, scores) {
      const { error } = await db.from("case_sessions").update({ scores, summary: null }).eq("id", id);
      if (error) fail("redacting a session", error);
    },

    async deleteEventsBefore(cutoffIso) {
      const { count, error } = await db.from("events").delete({ count: "exact" }).lt("created_at", cutoffIso);
      if (error) fail("deleting old events", error);
      return count ?? 0;
    },
  };
}
