import { storedDebriefSchema, type StoredDebrief } from "@/lib/ai/schema";
import { overallScore, SKILL_KEYS, type SkillScores } from "./skills";

// The dashboard's progress view, worked out from the user's own case_sessions rows
// (read with Row Level Security, so only their sessions arrive here). Pure functions,
// so they are unit tested (lib/app/progress.test.ts). The numbers shown are only ever
// the user's own stored debrief scores: nothing here invents or estimates a result.

/** A case_sessions row as the dashboard selects it. */
export type SessionRow = {
  id: string;
  case_id: string;
  started_at: string;
  completed_at: string | null;
  scores: unknown;
};

export type ProgressSession = {
  id: string;
  caseId: string;
  startedAt: string;
  completedAt: string | null;
  /** The stored debrief, or null while the interview is unfinished (or if it cannot be read). */
  debrief: StoredDebrief | null;
};

/** What the recommendation needs to know about a case (no answer keys). */
export type CaseLite = {
  id: string;
  slug: string;
  type: string;
  difficulty: number;
  free_starter: boolean;
};

export function toProgressSessions(rows: SessionRow[]): ProgressSession[] {
  return rows.map((r) => {
    const parsed = r.completed_at ? storedDebriefSchema.safeParse(r.scores) : null;
    return {
      id: r.id,
      caseId: r.case_id,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      debrief: parsed?.success ? parsed.data : null,
    };
  });
}

const newestFirst = (a: ProgressSession, b: ProgressSession) => Date.parse(b.startedAt) - Date.parse(a.startedAt);

export type Progress = {
  /** Finished interviews with a readable debrief, newest first. */
  scored: (ProgressSession & { debrief: StoredDebrief })[];
  /** Interviews not finished yet, newest first. */
  inProgress: ProgressSession[];
  /** Mean score per skill across every scored interview, or null before the first debrief. */
  averages: SkillScores | null;
  /** The mean of those averages, to one decimal place. */
  overall: number | null;
  /** Maths answers checked by code, summed across scored interviews. */
  maths: { correct: number; attempted: number };
};

export function summariseProgress(sessions: ProgressSession[]): Progress {
  const sorted = [...sessions].sort(newestFirst);
  const scored = sorted.filter((s): s is ProgressSession & { debrief: StoredDebrief } => s.completedAt !== null && s.debrief !== null);
  const inProgress = sorted.filter((s) => s.completedAt === null);

  let averages: SkillScores | null = null;
  if (scored.length > 0) {
    averages = Object.fromEntries(
      SKILL_KEYS.map((k) => [k, scored.reduce((sum, s) => sum + s.debrief.scores[k], 0) / scored.length]),
    ) as SkillScores;
  }

  return {
    scored,
    inProgress,
    averages,
    overall: averages ? overallScore(averages) : null,
    maths: scored.reduce(
      (acc, s) => ({ correct: acc.correct + s.debrief.maths.correct, attempted: acc.attempted + s.debrief.maths.attempted }),
      { correct: 0, attempted: 0 },
    ),
  };
}

/**
 * Interviews started in total, today and this month, counted the same way as the
 * database function that enforces the limits (start_interview_session: UTC day and month).
 */
export function usageCounts(sessions: Pick<ProgressSession, "startedAt">[], now: Date = new Date()) {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const times = sessions.map((s) => Date.parse(s.startedAt));
  return {
    total: times.length,
    today: times.filter((t) => t >= dayStart).length,
    month: times.filter((t) => t >= monthStart).length,
  };
}

/**
 * The case to suggest next: one not played yet, preferring a case type the user has
 * not tried, then the easiest, then library order. Free users are never offered the
 * free starter here (their one free interview is handled separately).
 */
export function recommendCase(
  cases: CaseLite[],
  sessions: Pick<ProgressSession, "caseId">[],
  paid: boolean,
): { case: CaseLite; newType: boolean } | null {
  const played = new Set(sessions.map((s) => s.caseId));
  const triedTypes = new Set(cases.filter((c) => played.has(c.id)).map((c) => c.type));
  const candidates = cases
    .map((c, order) => ({ c, order, newType: !triedTypes.has(c.type) }))
    .filter(({ c }) => !played.has(c.id) && (paid || !c.free_starter))
    .sort((a, b) => Number(b.newType) - Number(a.newType) || a.c.difficulty - b.c.difficulty || a.order - b.order);
  const best = candidates[0];
  return best ? { case: best.c, newType: best.newType } : null;
}

export type NextStep =
  | { kind: "continue"; sessionId: string; caseId: string }
  | { kind: "start_free"; caseId: string; slug: string }
  | { kind: "case"; caseId: string; slug: string; locked: boolean; newType: boolean }
  | { kind: "upgrade" }
  | { kind: "browse" };

/** The one thing the dashboard suggests doing next. */
export function nextStep({
  sessions,
  cases,
  paid,
  freeAllowance,
}: {
  sessions: ProgressSession[];
  cases: CaseLite[];
  paid: boolean;
  /** How many AI interviews a free account may start in total (site.config.ts). */
  freeAllowance: number;
}): NextStep {
  const visible = new Set(cases.map((c) => c.id));
  const active = [...sessions].sort(newestFirst).find((s) => s.completedAt === null && visible.has(s.caseId));
  if (active) return { kind: "continue", sessionId: active.id, caseId: active.caseId };

  if (!paid) {
    const starter = cases.find((c) => c.free_starter);
    if (starter && sessions.length < freeAllowance && !sessions.some((s) => s.caseId === starter.id)) {
      return { kind: "start_free", caseId: starter.id, slug: starter.slug };
    }
  }

  const rec = recommendCase(cases, sessions, paid);
  if (rec) return { kind: "case", caseId: rec.case.id, slug: rec.case.slug, locked: !paid, newType: rec.newType };
  return paid ? { kind: "browse" } : { kind: "upgrade" };
}

/** "15 Oct 2026". */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
