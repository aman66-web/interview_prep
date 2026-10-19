import type { Case } from "@/lib/content/schema";
import { siteConfig } from "@/site.config";

// Who may start an AI interview, and how many (kit sections 4 and 6). The numbers
// come from site.config.ts. The database function start_interview_session()
// enforces them without races; this module says what to pass to it and how to
// explain a refusal.

export type SessionLimits = {
  maxTotal: number | null;
  maxPerDay: number | null;
  maxPerMonth: number | null;
};

export function limitsFor(paid: boolean): SessionLimits {
  if (paid) {
    return {
      maxTotal: null,
      maxPerDay: siteConfig.limits.paid.aiCasesPerDay,
      maxPerMonth: siteConfig.limits.paid.aiCasesPerMonth,
    };
  }
  return { maxTotal: siteConfig.limits.free.aiCasesTotal, maxPerDay: null, maxPerMonth: null };
}

/** Free users get the free starter case only; paid users get every case. */
export function canStartCase(c: Pick<Case, "free_starter">, paid: boolean): boolean {
  return paid || c.free_starter;
}

export type Blocked = "total" | "day" | "month";

export function blockedMessage(blocked: Blocked): string {
  switch (blocked) {
    case "total":
      return `You've used your free AI interview. Upgrade to practise every case (up to ${siteConfig.limits.paid.aiCasesPerDay} a day).`;
    case "day":
      return `You've reached today's limit of ${siteConfig.limits.paid.aiCasesPerDay} AI interviews. Come back tomorrow.`;
    case "month":
      return `You've reached this month's limit of ${siteConfig.limits.paid.aiCasesPerMonth} AI interviews. It resets at the start of next month.`;
  }
}

/** Hard caps on one session, so a single conversation can never run up an unbounded bill. */
export const SESSION_CAPS = {
  /** Candidate turns (kit: 40). */
  maxTurns: siteConfig.limits.candidateTurnsPerSession,
  /** Longest single candidate message, in characters. */
  maxMessageChars: 2000,
  /** Tokens (input + output, cached or not) across all calls in one session. */
  maxTotalTokens: 900_000,
  /** The most the interviewer may write in one reply. */
  maxReplyTokens: 1_200,
  /** The most a debrief may take. */
  maxDebriefTokens: 3_000,
  /** The most a summary of older turns may take. */
  maxSummaryTokens: 500,
  /** Past this many characters of transcript, older turns are folded into a summary. */
  maxHistoryChars: 24_000,
  /** The most recent messages always sent in full. */
  minRecentMessages: 6,
} as const;
