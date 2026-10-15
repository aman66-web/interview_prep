import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/cleanup/route";
import { storedDebriefSchema, type StoredDebrief } from "@/lib/ai/schema";
import { EVENT_RETENTION_DAYS } from "@/lib/analytics/events";
import { checkCronAuth } from "@/lib/retention/auth";
import { cutoff, runRetentionCleanup, type RetentionStore, type SessionToRedact } from "@/lib/retention/cleanup";
import { isRedacted, REDACTED_DETAIL, redactDebrief } from "@/lib/retention/redact";
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

/** An in-memory database for the clean-up. */
function memoryStore() {
  const db = {
    messages: [] as { id: string; created_at: string }[],
    sessions: [] as (SessionToRedact & { started_at: string })[],
    events: [] as { id: string; created_at: string }[],
    saves: 0,
  };
  const store: RetentionStore = {
    async deleteMessagesBefore(c) {
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
  };
  return { db, store };
}

const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

describe("runRetentionCleanup", () => {
  it("deletes old messages and events and redacts old interviews, leaving recent ones alone", async () => {
    const { db, store } = memoryStore();
    const keep = siteConfig.transcriptRetentionDays - 1;
    const old = siteConfig.transcriptRetentionDays + 1;
    db.messages.push({ id: "m-old", created_at: ago(old) }, { id: "m-new", created_at: ago(keep) });
    db.sessions.push(
      { id: "s-old", started_at: ago(old), scores: debrief, summary: "rolling summary of what they said" },
      { id: "s-abandoned", started_at: ago(old), scores: null, summary: "they said hello" },
      { id: "s-new", started_at: ago(keep), scores: debrief, summary: "recent" },
    );
    db.events.push({ id: "e-old", created_at: ago(EVENT_RETENTION_DAYS + 1) }, { id: "e-new", created_at: ago(EVENT_RETENTION_DAYS - 1) });

    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result).toMatchObject({ ok: true, messagesDeleted: 1, sessionsRedacted: 2, eventsDeleted: 1, moreSessionsLeft: false, failed: [] });
    expect(result.transcriptCutoff).toBe(cutoff(NOW, siteConfig.transcriptRetentionDays));
    expect(result.eventCutoff).toBe(ago(EVENT_RETENTION_DAYS));
    expect(db.messages.map((m) => m.id)).toEqual(["m-new"]);
    expect(db.events.map((e) => e.id)).toEqual(["e-new"]);

    const [sOld, sAbandoned, sNew] = db.sessions;
    expect(sOld.summary).toBeNull();
    expect(storedDebriefSchema.parse(sOld.scores).scores).toEqual(debrief.scores);
    expect(isRedacted(sOld.scores)).toBe(true);
    expect(sAbandoned).toMatchObject({ scores: null, summary: null });
    expect(sNew).toMatchObject({ scores: debrief, summary: "recent" });

    // A second run has nothing left to do.
    const again = await runRetentionCleanup(store, { now: NOW });
    expect(again).toMatchObject({ ok: true, messagesDeleted: 0, sessionsRedacted: 0, eventsDeleted: 0 });
  });

  it("works through many old interviews in batches, and stops at the per-run limit", async () => {
    const { db, store } = memoryStore();
    for (let i = 0; i < 25; i++) db.sessions.push({ id: `s${i}`, started_at: ago(400), scores: debrief, summary: null });
    const first = await runRetentionCleanup(store, { now: NOW, batchSize: 5, maxBatches: 3 });
    expect(first).toMatchObject({ sessionsRedacted: 15, moreSessionsLeft: true });
    const second = await runRetentionCleanup(store, { now: NOW, batchSize: 5, maxBatches: 3 });
    expect(second).toMatchObject({ sessionsRedacted: 10, moreSessionsLeft: false });
  });

  it("never loops forever if a save does not stick", async () => {
    const { db, store } = memoryStore();
    db.sessions.push({ id: "stuck", started_at: ago(400), scores: debrief, summary: "x" });
    store.saveRedactedSession = async () => {}; // pretend the update matched nothing
    const result = await runRetentionCleanup(store, { now: NOW });
    expect(result.sessionsRedacted).toBe(1);
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
