import type { SupabaseClient } from "@supabase/supabase-js";
import type { MathCheck } from "./maths";
import type { Stage } from "./stages";
import type { CommitTurn, InterviewStore, MessageRow, SessionRow, StartResult, UsageRow } from "./store";

// The real store, using the admin (secret key) client. Server only. Callers
// must already have checked who the user is; every read here is by session id
// and the orchestrator verifies the session belongs to that user.

function fail(what: string, error: { message: string }): never {
  throw new Error(`Database error while ${what}: ${error.message}`);
}

export function createSupabaseStore(db: SupabaseClient): InterviewStore {
  return {
    async getSession(id) {
      const { data, error } = await db.from("case_sessions").select("*").eq("id", id).maybeSingle();
      if (error) fail("reading the session", error);
      return (data as SessionRow | null) ?? null;
    },

    async listMessages(sessionId) {
      const { data, error } = await db
        .from("session_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) fail("reading messages", error);
      return (data ?? []) as MessageRow[];
    },

    async getMathChecks(sessionId) {
      const { data, error } = await db
        .from("math_checks")
        .select("math_id, given, expected, correct")
        .eq("session_id", sessionId);
      if (error) fail("reading maths checks", error);
      return ((data ?? []) as { math_id: string; given: number | string; expected: number | string; correct: boolean }[]).map(
        (r): MathCheck => ({ math_id: r.math_id, given: Number(r.given), expected: Number(r.expected), correct: r.correct }),
      );
    },

    async sessionTokens(sessionId) {
      const { data, error } = await db.from("ai_usage").select("input_tokens, output_tokens").eq("session_id", sessionId);
      if (error) fail("reading usage", error);
      return ((data ?? []) as { input_tokens: number; output_tokens: number }[]).reduce(
        (sum, r) => sum + r.input_tokens + r.output_tokens,
        0,
      );
    },

    async logUsage(usage: UsageRow) {
      const { error } = await db.from("ai_usage").insert({
        user_id: usage.userId,
        session_id: usage.sessionId,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cost_estimate_usd: usage.costUsd,
      });
      if (error) fail("logging usage", error);
    },

    async commitTurn(turn: CommitTurn) {
      const { data, error } = await db.rpc("commit_interview_turn", {
        p_session_id: turn.sessionId,
        p_expected_turns: turn.expectedTurns,
        p_user_message: turn.userMessage,
        p_assistant_message: turn.assistantMessage,
        p_stage: turn.stage,
        p_revealed: turn.revealedExhibits,
        p_summary: turn.summary,
        p_summary_covers: turn.summaryCovers,
        p_math: turn.mathChecks,
      });
      if (error) fail("saving the turn", error);
      return data === true;
    },

    async completeSession({ sessionId, scores, summary }) {
      const { error } = await db
        .from("case_sessions")
        .update({ scores, summary, stage: "debrief" satisfies Stage, completed_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) fail("finishing the session", error);
    },

    async findActiveSession(userId, caseId) {
      const { data, error } = await db
        .from("case_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("case_id", caseId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) fail("looking for an unfinished session", error);
      return (data as { id: string } | null)?.id ?? null;
    },

    async startSession(args): Promise<StartResult> {
      const { data, error } = await db.rpc("start_interview_session", {
        p_user_id: args.userId,
        p_case_id: args.caseId,
        p_first_message: args.firstMessage,
        p_max_total: args.maxTotal,
        p_max_per_day: args.maxPerDay,
        p_max_per_month: args.maxPerMonth,
      });
      if (error) fail("starting the session", error);
      const result = data as { session_id?: string; blocked?: "total" | "day" | "month" } | null;
      if (result?.session_id) return { sessionId: result.session_id };
      if (result?.blocked) return { blocked: result.blocked };
      throw new Error("Database error while starting the session: unexpected reply");
    },
  };
}
