import type { MathCheck } from "@/lib/ai/maths";
import type { CommitTurn, InterviewStore, MessageRow, SessionRow, StartResult, UsageRow } from "@/lib/ai/store";

/** An in-memory InterviewStore that behaves like the database functions (same limits, same locking). */
export class MemoryStore implements InterviewStore {
  sessions = new Map<string, SessionRow>();
  messages = new Map<string, MessageRow[]>();
  maths = new Map<string, Map<string, MathCheck>>();
  usage: UsageRow[] = [];
  /** Total tokens to report for sessionTokens(), on top of logged usage. */
  extraTokens = 0;
  /** Make the next commitTurn() lose the race, as if another request got there first. */
  loseNextCommit = false;
  now = () => new Date();
  private counter = 0;

  async getSession(id: string) {
    const s = this.sessions.get(id);
    return s ? structuredClone(s) : null;
  }

  async listMessages(sessionId: string) {
    return structuredClone(this.messages.get(sessionId) ?? []);
  }

  async getMathChecks(sessionId: string) {
    return [...(this.maths.get(sessionId)?.values() ?? [])].map((m) => ({ ...m }));
  }

  async sessionTokens(sessionId: string) {
    return this.extraTokens + this.usage.filter((u) => u.sessionId === sessionId).reduce((n, u) => n + u.inputTokens + u.outputTokens, 0);
  }

  async logUsage(usage: UsageRow) {
    this.usage.push({ ...usage });
  }

  async commitTurn(turn: CommitTurn) {
    const s = this.sessions.get(turn.sessionId);
    if (this.loseNextCommit) {
      this.loseNextCommit = false;
      return false;
    }
    if (!s || s.turns !== turn.expectedTurns || s.completed_at) return false;
    const list = this.messages.get(s.id) ?? [];
    if (turn.userMessage !== null) list.push({ role: "user", content: turn.userMessage });
    list.push({ role: "assistant", content: turn.assistantMessage });
    this.messages.set(s.id, list);
    s.turns += turn.userMessage !== null ? 1 : 0;
    s.stage = turn.stage;
    s.revealed_exhibits = [...turn.revealedExhibits];
    if (turn.summary !== null) s.summary = turn.summary;
    if (turn.summaryCovers !== null) s.summary_covers = turn.summaryCovers;
    const byId = this.maths.get(s.id) ?? new Map<string, MathCheck>();
    for (const m of turn.mathChecks) byId.set(m.math_id, { ...m });
    this.maths.set(s.id, byId);
    return true;
  }

  async completeSession({ sessionId, scores, summary }: { sessionId: string; scores: unknown; summary: string }) {
    const s = this.sessions.get(sessionId)!;
    s.scores = scores;
    s.summary = summary;
    s.stage = "debrief";
    s.completed_at = this.now().toISOString();
  }

  async findActiveSession(userId: string, caseId: string) {
    const found = [...this.sessions.values()].filter((s) => s.user_id === userId && s.case_id === caseId && !s.completed_at);
    return found.length ? found[found.length - 1].id : null;
  }

  async startSession(args: {
    userId: string;
    caseId: string;
    firstMessage: string;
    maxTotal: number | null;
    maxPerDay: number | null;
    maxPerMonth: number | null;
  }): Promise<StartResult> {
    const mine = [...this.sessions.values()].filter((s) => s.user_id === args.userId);
    const now = this.now();
    const sameDay = (d: Date) => d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    const sameMonth = (d: Date) => d.toISOString().slice(0, 7) === now.toISOString().slice(0, 7);
    if (args.maxTotal !== null && mine.length >= args.maxTotal) return { blocked: "total" };
    if (args.maxPerDay !== null && mine.filter((s) => sameDay(new Date(s.started_at))).length >= args.maxPerDay) return { blocked: "day" };
    if (args.maxPerMonth !== null && mine.filter((s) => sameMonth(new Date(s.started_at))).length >= args.maxPerMonth) return { blocked: "month" };
    const id = `00000000-0000-0000-0000-${String(++this.counter).padStart(12, "0")}`;
    this.sessions.set(id, {
      id,
      user_id: args.userId,
      case_id: args.caseId,
      stage: "intro",
      turns: 0,
      started_at: now.toISOString(),
      completed_at: null,
      scores: null,
      summary: null,
      summary_covers: 0,
      revealed_exhibits: [],
    });
    this.messages.set(id, [{ role: "assistant", content: args.firstMessage }]);
    return { sessionId: id };
  }
}
