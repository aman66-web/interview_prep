import type { MathCheck } from "./maths";
import type { Stage } from "./stages";

// Everything the interviewer reads from and writes to the database goes through
// this interface, so the whole interview can be tested without a database.

export type SessionRow = {
  id: string;
  user_id: string;
  case_id: string;
  stage: Stage;
  turns: number;
  started_at: string;
  completed_at: string | null;
  scores: unknown;
  summary: string | null;
  summary_covers: number;
  revealed_exhibits: string[];
};

export type MessageRow = { role: "user" | "assistant"; content: string };

export type UsageRow = {
  userId: string;
  sessionId: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type CommitTurn = {
  sessionId: string;
  expectedTurns: number;
  /** The candidate's message, or null for a turn with no candidate message. */
  userMessage: string | null;
  assistantMessage: string;
  stage: Stage;
  revealedExhibits: string[];
  summary: string | null;
  summaryCovers: number | null;
  mathChecks: MathCheck[];
};

export type StartResult = { sessionId: string } | { blocked: "total" | "day" | "month" };

export interface InterviewStore {
  getSession(id: string): Promise<SessionRow | null>;
  /** All messages of a session, oldest first. */
  listMessages(sessionId: string): Promise<MessageRow[]>;
  getMathChecks(sessionId: string): Promise<MathCheck[]>;
  /** Input plus output tokens used so far by this session, across every call. */
  sessionTokens(sessionId: string): Promise<number>;
  logUsage(usage: UsageRow): Promise<void>;
  /** Saves one turn atomically. Returns false if the session had already moved on. */
  commitTurn(turn: CommitTurn): Promise<boolean>;
  /** Marks the session finished and stores the debrief. */
  completeSession(args: { sessionId: string; scores: unknown; summary: string }): Promise<void>;
  /** An unfinished session this user already has for this case, if any. */
  findActiveSession(userId: string, caseId: string): Promise<string | null>;
  startSession(args: {
    userId: string;
    caseId: string;
    firstMessage: string;
    maxTotal: number | null;
    maxPerDay: number | null;
    maxPerMonth: number | null;
  }): Promise<StartResult>;
}
