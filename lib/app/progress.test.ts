import { describe, expect, it } from "vitest";
import type { StoredDebrief } from "@/lib/ai/schema";
import { formatDay, nextStep, recommendCase, summariseProgress, toProgressSessions, usageCounts, type CaseLite, type ProgressSession, type SessionRow } from "./progress";
import { formatScore, overallScore, SKILLS, strongestSkill, weakestSkill } from "./skills";

function debrief(scores: StoredDebrief["scores"], maths = { attempted: 1, correct: 1, total: 2 }): StoredDebrief {
  return { version: 1, scores, strengths: [], fixes: [], summary: "A summary.", maths: { ...maths, items: [] } };
}

const s1 = { structure: 4, analysis_maths: 3, business_judgement: 4, communication: 3, synthesis: 2 };
const s2 = { structure: 2, analysis_maths: 5, business_judgement: 4, communication: 3, synthesis: 4 };

const CASES: CaseLite[] = [
  { id: "case-001", slug: "starter", type: "profitability", difficulty: 1, free_starter: true },
  { id: "case-002", slug: "entry-hard", type: "market_entry", difficulty: 3, free_starter: false },
  { id: "case-003", slug: "entry-easy", type: "market_entry", difficulty: 2, free_starter: false },
  { id: "case-004", slug: "profit-two", type: "profitability", difficulty: 1, free_starter: false },
  { id: "case-005", slug: "pricing", type: "pricing", difficulty: 2, free_starter: false },
];

const session = (id: string, caseId: string, startedAt: string, d: StoredDebrief | null, done = d !== null): ProgressSession => ({
  id,
  caseId,
  startedAt,
  completedAt: done ? startedAt : null,
  debrief: d,
});

describe("skills", () => {
  it("lists the five debrief skills in the debrief's order, each with a drill and a guide", () => {
    expect(SKILLS.map((s) => s.label)).toEqual(["Structure", "Analysis and maths", "Business judgement", "Communication", "Recommendation"]);
    for (const s of SKILLS) {
      expect(s.drill).toBeTruthy();
      expect(s.guide.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("averages, and finds the weakest and strongest skill (first listed wins a tie)", () => {
    expect(overallScore(s1)).toBe(3.2);
    expect(weakestSkill(s1)).toBe("synthesis");
    expect(strongestSkill(s1)).toBe("structure");
    expect(weakestSkill({ structure: 3, analysis_maths: 3, business_judgement: 3, communication: 3, synthesis: 3 })).toBe("structure");
  });

  it("formats scores with at most one decimal place", () => {
    expect(formatScore(4)).toBe("4");
    expect(formatScore(3.5)).toBe("3.5");
    expect(formatScore(3.25)).toBe("3.3");
  });
});

describe("toProgressSessions", () => {
  it("reads stored debriefs only for finished sessions, and ignores anything malformed", () => {
    const rows: SessionRow[] = [
      { id: "a", case_id: "case-001", started_at: "2026-10-01T10:00:00Z", completed_at: "2026-10-01T10:30:00Z", scores: debrief(s1) },
      { id: "b", case_id: "case-002", started_at: "2026-10-02T10:00:00Z", completed_at: null, scores: debrief(s1) },
      { id: "c", case_id: "case-003", started_at: "2026-10-03T10:00:00Z", completed_at: "2026-10-03T10:30:00Z", scores: { version: 1, scores: { structure: 9 } } },
    ];
    const [a, b, c] = toProgressSessions(rows);
    expect(a.debrief?.scores.structure).toBe(4);
    expect(b.debrief).toBeNull();
    expect(c.debrief).toBeNull();
    expect(c.completedAt).not.toBeNull();
  });
});

describe("summariseProgress", () => {
  it("has no averages before the first debrief", () => {
    const p = summariseProgress([session("x", "case-001", "2026-10-01T10:00:00Z", null)]);
    expect(p.averages).toBeNull();
    expect(p.overall).toBeNull();
    expect(p.inProgress).toHaveLength(1);
    expect(p.maths).toEqual({ correct: 0, attempted: 0 });
  });

  it("averages each skill across finished interviews and sums the code-checked maths", () => {
    const p = summariseProgress([
      session("old", "case-001", "2026-10-01T10:00:00Z", debrief(s1, { attempted: 2, correct: 1, total: 3 })),
      session("new", "case-004", "2026-10-05T10:00:00Z", debrief(s2, { attempted: 1, correct: 1, total: 2 })),
      session("open", "case-002", "2026-10-06T10:00:00Z", null),
    ]);
    expect(p.scored.map((s) => s.id)).toEqual(["new", "old"]);
    expect(p.averages).toEqual({ structure: 3, analysis_maths: 4, business_judgement: 4, communication: 3, synthesis: 3 });
    expect(p.overall).toBe(3.4);
    expect(p.maths).toEqual({ correct: 2, attempted: 3 });
    expect(p.inProgress.map((s) => s.id)).toEqual(["open"]);
  });
});

describe("usageCounts", () => {
  it("counts by UTC day and month, like the database limit check", () => {
    const now = new Date("2026-10-15T09:00:00Z");
    const counts = usageCounts(
      [
        { startedAt: "2026-10-15T00:00:00Z" },
        { startedAt: "2026-10-14T23:59:59Z" },
        { startedAt: "2026-10-01T00:00:00Z" },
        { startedAt: "2026-09-30T23:59:59Z" },
      ],
      now,
    );
    expect(counts).toEqual({ total: 4, today: 1, month: 3 });
  });
});

describe("recommendCase", () => {
  it("prefers a case type not tried yet, then the easiest, then library order", () => {
    const played = [{ caseId: "case-001" }];
    expect(recommendCase(CASES, played, true)).toEqual({ case: CASES[2], newType: true });
  });

  it("falls back to an unplayed case of a type already tried", () => {
    const played = ["case-001", "case-002", "case-003", "case-005"].map((caseId) => ({ caseId }));
    expect(recommendCase(CASES, played, true)).toEqual({ case: CASES[3], newType: false });
  });

  it("never offers free users the free starter, and returns null when everything is played", () => {
    expect(recommendCase(CASES.slice(0, 1), [], false)).toBeNull();
    expect(recommendCase(CASES, CASES.map((c) => ({ caseId: c.id })), true)).toBeNull();
  });
});

describe("nextStep", () => {
  it("offers a new free user the free starter case", () => {
    expect(nextStep({ sessions: [], cases: CASES, paid: false, freeAllowance: 1 })).toEqual({ kind: "start_free", caseId: "case-001", slug: "starter" });
  });

  it("sends anyone with an unfinished interview back to it first", () => {
    const sessions = [session("open", "case-001", "2026-10-02T10:00:00Z", null), session("done", "case-004", "2026-10-01T10:00:00Z", debrief(s1))];
    expect(nextStep({ sessions, cases: CASES, paid: true, freeAllowance: 1 })).toEqual({ kind: "continue", sessionId: "open", caseId: "case-001" });
  });

  it("ignores an unfinished interview whose case is no longer shown", () => {
    const sessions = [session("gone", "case-999", "2026-10-02T10:00:00Z", null)];
    expect(nextStep({ sessions, cases: CASES, paid: true, freeAllowance: 1 }).kind).toBe("case");
  });

  it("after the free interview, suggests a locked case of a new type", () => {
    const sessions = [session("done", "case-001", "2026-10-01T10:00:00Z", debrief(s1))];
    expect(nextStep({ sessions, cases: CASES, paid: false, freeAllowance: 1 })).toEqual({ kind: "case", caseId: "case-003", slug: "entry-easy", locked: true, newType: true });
  });

  it("suggests upgrading or browsing when nothing is left to recommend", () => {
    const all = CASES.map((c, i) => session(`s${i}`, c.id, `2026-10-0${i + 1}T10:00:00Z`, debrief(s1)));
    expect(nextStep({ sessions: all, cases: CASES, paid: false, freeAllowance: 1 }).kind).toBe("upgrade");
    expect(nextStep({ sessions: all, cases: CASES, paid: true, freeAllowance: 1 }).kind).toBe("browse");
  });
});

describe("formatDay", () => {
  it("writes dates the British way", () => {
    expect(formatDay("2026-10-15T12:00:00Z")).toBe("15 Oct 2026");
  });
});
