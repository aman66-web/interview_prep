import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/cleanup/route";
import { storedDebriefSchema, type StoredDebrief } from "@/lib/ai/schema";
import { EVENT_RETENTION_DAYS } from "@/lib/analytics/events";
import { nextStep, summariseProgress, toProgressSessions, type CaseLite } from "@/lib/app/progress";
import { checkCronAuth } from "@/lib/retention/auth";
import { cutoff, runRetentionCleanup, type RetentionStore, type SessionToRedact } from "@/lib/retention/cleanup";
import {
  closedUnfinishedMessage,
  closedUnfinishedScores,
  isClosedUnfinished,
  isExpiredUnfinished,
  transcriptCutoff,
} from "@/lib/retention/expired";
import { isRedacted, REDACTED_DETAIL, redactDebrief } from "@/lib/retention/redact";
import { createRetentionStore } from "@/lib/retention/store-supabase";
import { siteConfig } from "@/site.config";

// The retention clean-up (SPEC section 9, rule 2.7).

const NOW = new Date("2026-10-15T03:17:00Z");
const DAY = 86_400_000;

const debrief: StoredDebrief = {
  version: 1,
  scores: { structure: 4, analysis_maths: 3, business_judgement: 4, communication: 5, synthesis: 3 },
  strengths: [{ title: "Clear structure", quote: "I'd split it into revenue and costs", detail: "You said revenue and costs early." }],
  fixes: [
    {
      title: "Check the maths aloud",
      quote: "about 2 million I think",
      detail: "You guessed the total.",
      drill_category: "mental-maths" as StoredDebrief["fixes"][number]["drill_category"],
    },
  ],
  summary: "A solid start: the candidate said they would look at the bakery's costs first.",
  maths: {
    attempted: 1,
    correct: 0,
    total: 2,
    items: [{ math_id: "m1", question: "What share of the fall is ingredients?", given: 0.5, expected: 0.667, correct: false, working: "80 / 120" }],
  },
};

describe("redactDebrief", () => {
  it("removes quotes, written feedback and the summary, and keeps every number", () => {
    const out = redactDebrief(debrief, NOW) as Record<string, unknown>;
    const text = JSON.stringify(out);
    for (const said of ["split it into revenue", "about 2 million", "You said revenue", "You guessed", "the candidate said"]) {
      expect(text).not.toContain(said);
    }
    const parsed = storedDebriefSchema.parse(out); // the debrief page can still show it
    expect(parsed.scores).toEqual(debrief.scores);
    expect(parsed.maths).toEqual(debrief.maths);
    expect(parsed.strengths).toEqual([{ title: "Clear structure", quote: null, detail: REDACTED_DETAIL }]);
    expect(parsed.fixes[0]).toMatchObject({ title: "Check the maths aloud", quote: null, drill_category: debrief.fixes[0].drill_category });
    expect(parsed.summary).toContain(String(siteConfig.transcriptRetentionDays));
    expect(out.redacted_at).toBe(NOW.toISOString());
    expect(isRedacted(out)).toBe(true);
    expect(isRedacted(debrief)).toBe(false);
  });

  it("is safe to run twice", () => {
    const once = redactDebrief(debrief, NOW);
    const twice = redactDebrief(once, NOW);
    expect(twice).toEqual(once);
  });

  it("keeps only plain numbers from a debrief it does not recognise", () => {
    const out = redactDebrief(
      { version: 0, scores: { structure: 2, note: "said x" }, quotes: ["I said x"], maths: { correct: 1, items: ["y"] } },
      NOW,
    );
    expect(out).toEqual({ version: 0, scores: { structure: 2 }, maths: { correct: 1 }, redacted_at: NOW.toISOString() });
    expect(redactDebrief("free text", NOW)).toEqual({ redacted_at: NOW.toISOString() });
    expect(redactDebrief(null, NOW)).toBeNull();
  });
});

type MemorySession = SessionToRedact & { started_at: string; completed_at: string | null; summary_covers: number };

/** An in-memory database for the clean-up. */
function memoryStore() {
  const db = {
    messages: [] as { id: string; created_at: string }[],
    sessions: [] as MemorySession[],
    events: [] as { id: string; created_at: string }[],
    leads: [] as { id: string; created_at: string }[],
    saves: 0,
    steps: [] as string[],
  };
  const store: RetentionStore = {
    async closeUnfinishedBefore(c, scores) {
      db.steps.push("close");
      let closed = 0;
      for (const s of db.sessions) {
        if (s.completed_at === null && s.started_at < c) {
          Object.assign(s, { completed_at: c, scores, summary: null, summary_covers: 0 });
          closed++;
        }
      }
      return closed;
    },
    async deleteMessagesBefore(c) {
      db.steps.push("messages");
      const before = db.messages.length;
      db.messages = db.messages.filter((m) => m.created_at >= c);
      return before - db.messages.length;
    },
    async listSessionsToRedact(c, limit) {
      return db.sessions.filter((s) => s.started_at < c && (s.summary !== null || (s.scores !== null && !isRedacted(s.scores)))).slice(0, limit);
    },
    async saveRedactedSession(id, scores) {
      db.saves++;
      const s = db.sessions.find((x) => x.id === id)!;
      s.scores = scores;
      s.summary = null;
    },
    async deleteEventsBefore(c) {
      const before = db.events.length;
      db.events = db.events.filter((e) => e.created_at >= c);
      return before - db.events.length;
    },
    async deleteLeadsBefore(c) {
      const before = db.leads.length;
      db.leads = db.leads.filter((l) => l.created_at >= c);
      return before - db.leads.length;
    },
  };
  return { db, store };
}

const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

/** A session row for the memory store: finished (with a debrief) unless `finished` is false. */
function row(id: string, startedDaysAgo: number, opts: { finished?: boolean; summary?: string | null; covers?: number } = {}): MemorySession {
  const finished = opts.finished ?? true;
  return {
    id,
    started_at: ago(startedDaysAgo),
    completed_at: finished ? ago(startedDaysAgo - 0.01) : null,
    scores: finished ? debrief : null,
    summary: opts.summary ?? null,
    summary_covers: opts.covers ?? 0,
  };
}

describe("runRetentionCleanup", () => {
  it("deletes old messages and events and redacts old interviews, leaving recent ones alone", async () => {
    const { db, store } = memoryStore();
    const keep = siteConfig.transcriptRetentionDays - 1;
    const old = siteConfig.transcriptRetentionDays + 1;
    db.messages.push({ id: "m-old", created_at: ago(old) }, { id: "m-new", created_at: ago(keep) });
    db.sessions.push(
      row("s-old", old, { summary: "rolling summary of what they said" }),
      row("s-abandoned", old, { finished: false, summary: "they said hello", covers: 4 }),
      row("s-new", keep, { summary: "recent" }),
    );
    db.events.push({ id: "e-old", created_at: ago(EVENT_RETENTION_DAYS + 1) }, { id: "e-new", created_at: ago(EVENT_RETENTION_DAYS - 1) });
    db.leads.push({ id: "l-old", created_at: ago(siteConfig.leadRetentionDays + 1) }, { id: "l-new", created_at: ago(siteConfig.leadRetentionDays - 1) });

    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({
      ok: true,
      sessionsClosed: 1,
      messagesDeleted: 1,
      sessionsRedacted: 1,
      eventsDeleted: 1,
      leadsDeleted: 1,
      moreSessionsLeft: false,
      failed: [],
    });
    expect(result.transcriptCutoff).toBe(cutoff(NOW, siteConfig.transcriptRetentionDays));
    expect(result.eventCutoff).toBe(ago(EVENT_RETENTION_DAYS));
    expect(db.messages.map((m) => m.id)).toEqual(["m-new"]);
    expect(db.events.map((e) => e.id)).toEqual(["e-new"]);
    expect(db.leads.map((l) => l.id)).toEqual(["l-new"]);
    expect(result.leadCutoff).toBe(ago(siteConfig.leadRetentionDays));

    const [sOld, sAbandoned, sNew] = db.sessions;
    expect(sOld.summary).toBeNull();
    expect(storedDebriefSchema.parse(sOld.scores).scores).toEqual(debrief.scores);
    expect(isRedacted(sOld.scores)).toBe(true);
    expect(sAbandoned).toMatchObject({ completed_at: result.transcriptCutoff, summary: null, summary_covers: 0 });
    expect(isClosedUnfinished(sAbandoned.scores)).toBe(true);
    expect(sNew).toMatchObject({ scores: debrief, summary: "recent" });

    // A second run has nothing left to do.
    const again = await runRetentionCleanup(store, { now: NOW });
    expect(again).toMatchObject({ ok: true, sessionsClosed: 0, messagesDeleted: 0, sessionsRedacted: 0, eventsDeleted: 0, leadsDeleted: 0 });
  });

  it("works through many old interviews in batches, and stops at the per-run limit", async () => {
    const { db, store } = memoryStore();
    for (let i = 0; i < 25; i++) db.sessions.push(row(`s${i}`, 400));
    const first = await runRetentionCleanup(store, { now: NOW, batchSize: 5, maxBatches: 3 });
    expect(first).toMatchObject({ sessionsRedacted: 15, moreSessionsLeft: true });
    const second = await runRetentionCleanup(store, { now: NOW, batchSize: 5, maxBatches: 3 });
    expect(second).toMatchObject({ sessionsRedacted: 10, moreSessionsLeft: false });
  });

  it("never loops forever if a save does not stick", async () => {
    const { db, store } = memoryStore();
    db.sessions.push(row("stuck", 400, { summary: "x" }));
    store.saveRedactedSession = async () => {}; // pretend the update matched nothing
    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result.sessionsRedacted).toBe(1);
  });

  it("reports a failed enquiries step without stopping the rest", async () => {
    const { store } = memoryStore();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    store.deleteLeadsBefore = async () => {
      throw new Error("Database error while deleting old enquiries: 57014");
    };
    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({ ok: false, failed: ["leads"], leadsDeleted: 0 });
    error.mockRestore();
  });

  it("carries on after a failed step and reports it", async () => {
    const { store } = memoryStore();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    store.deleteMessagesBefore = async () => {
      throw new Error("Database error while deleting old messages: 57014");
    };
    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({ ok: false, failed: ["messages"], eventsDeleted: 0 });
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});

describe("closing interviews that were never finished (their transcript is deleted)", () => {
  const days = siteConfig.transcriptRetentionDays;

  it("closes every unfinished interview past the retention period before deleting any messages", async () => {
    const { db, store } = memoryStore();
    db.sessions.push(
      row("old-unfinished-short", days + 3, { finished: false }), // no summary: the redaction step alone never touched it
      row("old-unfinished-long", days + 30, { finished: false, summary: "what they said so far", covers: 12 }),
      row("recent-unfinished", days - 1, { finished: false, summary: "still going", covers: 2 }),
      row("old-finished", days + 3),
    );
    db.messages.push({ id: "m1", created_at: ago(days + 3) });

    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({ ok: true, sessionsClosed: 2, failed: [] });
    expect(db.steps.slice(0, 2)).toEqual(["close", "messages"]);

    for (const id of ["old-unfinished-short", "old-unfinished-long"]) {
      const s = db.sessions.find((x) => x.id === id)!;
      expect(s, id).toMatchObject({ completed_at: result.transcriptCutoff, summary: null, summary_covers: 0 });
      expect(s.scores, id).toEqual(closedUnfinishedScores(NOW));
      expect(isClosedUnfinished(s.scores), id).toBe(true);
      expect(isRedacted(s.scores), id).toBe(true); // so the redaction step leaves it alone
      expect(storedDebriefSchema.safeParse(s.scores).success, id).toBe(false); // never shown as a debrief
      expect(Date.parse(s.completed_at!)).toBeGreaterThan(Date.parse(s.started_at));
    }
    expect(db.sessions.find((x) => x.id === "recent-unfinished")).toMatchObject({ completed_at: null, summary: "still going", summary_covers: 2 });
    expect(db.sessions.find((x) => x.id === "old-finished")!.completed_at).toBe(ago(days + 3 - 0.01));
  });

  it("is no longer offered on the dashboard as an interview to continue", async () => {
    const { db, store } = memoryStore();
    db.sessions.push(row("old-unfinished", days + 3, { finished: false }));
    const cases: CaseLite[] = [{ id: "case-001", slug: "harbourline-bakeries", type: "profitability", difficulty: 1, free_starter: true }];
    const sessions = () =>
      toProgressSessions(
        db.sessions.map((s) => ({ id: s.id, case_id: "case-001", started_at: s.started_at, completed_at: s.completed_at, scores: s.scores })),
        NOW,
      );

    // Past the retention period it is treated as closed even before the clean-up runs.
    expect(nextStep({ sessions: sessions(), cases, paid: true, freeAllowance: 1 }).kind).not.toBe("continue");
    expect(sessions()[0].closed).toBe(true);
    await runRetentionCleanup(store, { now: NOW });
    expect(nextStep({ sessions: sessions(), cases, paid: true, freeAllowance: 1 }).kind).not.toBe("continue");
    const progress = summariseProgress(sessions());
    expect(progress.inProgress).toEqual([]);
    expect(progress.scored).toEqual([]); // closed, but never scored
  });

  it("carries on with the other steps if closing fails", async () => {
    const { db, store } = memoryStore();
    db.messages.push({ id: "m1", created_at: ago(days + 3) });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    store.closeUnfinishedBefore = async () => {
      throw new Error("Database error while closing old unfinished sessions: 57014");
    };
    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({ ok: false, failed: ["closing"], sessionsClosed: 0, messagesDeleted: 1 });
    error.mockRestore();
  });

  it("knows which unfinished interviews are past the retention period, for pages that run before the clean-up", () => {
    const cut = transcriptCutoff(NOW, days);
    expect(cut.toISOString()).toBe(cutoff(NOW, days));
    const at = (ms: number) => new Date(ms).toISOString();
    expect(isExpiredUnfinished({ startedAt: at(cut.getTime() - 1), completedAt: null }, NOW)).toBe(true);
    expect(isExpiredUnfinished({ startedAt: at(cut.getTime()), completedAt: null }, NOW)).toBe(false);
    expect(isExpiredUnfinished({ startedAt: ago(days - 1), completedAt: null }, NOW)).toBe(false);
    expect(isExpiredUnfinished({ startedAt: ago(days + 50), completedAt: ago(days + 49) }, NOW)).toBe(false);
    expect(isExpiredUnfinished({ startedAt: "not a date", completedAt: null }, NOW)).toBe(false);
    expect(isExpiredUnfinished({ startedAt: ago(40), completedAt: null }, NOW, 30)).toBe(true);
  });

  it("marks a closed interview so it is never mistaken for a debrief or a finished one", () => {
    expect(isClosedUnfinished(closedUnfinishedScores(NOW))).toBe(true);
    for (const other of [null, undefined, "x", [], debrief, redactDebrief(debrief, NOW), { unfinished: true }, { redacted_at: "x" }]) {
      expect(isClosedUnfinished(other)).toBe(false);
    }
    expect(closedUnfinishedMessage(365)).toMatch(/never finished.*365 days.*transcript was deleted/);
  });
});

describe("the clean-up's database queries", () => {
  type Call = { table: string; op: string; payload?: unknown; options?: unknown; filters: unknown[][] };
  function fakeDb(reply: (call: Call) => { count?: number; error?: { code?: string; message: string } | null }) {
    const calls: Call[] = [];
    const db = {
      from(table: string) {
        const call: Call = { table, op: "select", filters: [] };
        const chain: Record<string, unknown> = {};
        const step =
          (name: string) =>
          (...args: unknown[]) => {
            call.filters.push([name, ...args]);
            return chain;
          };
        Object.assign(chain, {
          update: (payload: unknown, options?: unknown) => ((call.op = "update"), (call.payload = payload), (call.options = options), chain),
          is: step("is"),
          lt: step("lt"),
          eq: step("eq"),
          then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
            calls.push(call);
            return Promise.resolve()
              .then(() => ({ data: null, error: null, count: null, ...reply(call) }))
              .then(resolve, reject);
          },
        });
        return chain;
      },
    };
    return { db: db as unknown as Parameters<typeof createRetentionStore>[0], calls };
  }

  it("closes only unfinished sessions started before the cutoff, in one update", async () => {
    const { db, calls } = fakeDb(() => ({ count: 3 }));
    const marker = closedUnfinishedScores(NOW);
    const cut = cutoff(NOW, siteConfig.transcriptRetentionDays);
    expect(await createRetentionStore(db).closeUnfinishedBefore(cut, marker)).toBe(3);
    expect(calls).toEqual([
      {
        table: "case_sessions",
        op: "update",
        payload: { completed_at: cut, scores: marker, summary: null, summary_covers: 0 },
        options: { count: "exact" },
        filters: [
          ["is", "completed_at", null],
          ["lt", "started_at", cut],
        ],
      },
    ]);
  });

  it("reports a database error by its code only", async () => {
    const { db } = fakeDb(() => ({ error: { code: "57014", message: "canceling statement due to statement timeout" } }));
    await expect(createRetentionStore(db).closeUnfinishedBefore("2025-10-15T00:00:00.000Z", closedUnfinishedScores(NOW))).rejects.toThrow(
      "Database error while closing old unfinished sessions: 57014",
    );
  });
});

describe("cron authorisation", () => {
  it("accepts only the exact bearer secret", () => {
    expect(checkCronAuth("Bearer s3cret-value", "s3cret-value")).toBe("ok");
    expect(checkCronAuth("Bearer s3cret-valuX", "s3cret-value")).toBe("unauthorized");
    expect(checkCronAuth("Bearer s3cret", "s3cret-value")).toBe("unauthorized");
    expect(checkCronAuth("s3cret-value", "s3cret-value")).toBe("unauthorized");
    expect(checkCronAuth(null, "s3cret-value")).toBe("unauthorized");
    expect(checkCronAuth("Bearer ", "s3cret-value")).toBe("unauthorized");
  });

  it("is switched off without a secret", () => {
    expect(checkCronAuth("Bearer anything", undefined)).toBe("not_configured");
    expect(checkCronAuth("Bearer ", "  ")).toBe("not_configured");
  });
});

describe("GET /api/cron/cleanup", () => {
  afterEach(() => vi.unstubAllEnvs());
  const call = (auth?: string) => GET(new NextRequest("http://localhost/api/cron/cleanup", auth ? { headers: { authorization: auth } } : undefined));

  it("answers 503 when CRON_SECRET is not set", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer x")).status).toBe(503);
  });

  it("answers 401 to a missing or wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron_test_secret");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
  });

  it("answers 503 with the right secret when the database is not set up", async () => {
    vi.stubEnv("CRON_SECRET", "cron_test_secret");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const res = await call("Bearer cron_test_secret");
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("is scheduled once a day by vercel.json (the Hobby plan allows daily runs)", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };
    expect(config.crons).toEqual([{ path: "/api/cron/cleanup", schedule: expect.stringMatching(/^\d{1,2} \d{1,2} \* \* \*$/) }]);
  });
});
