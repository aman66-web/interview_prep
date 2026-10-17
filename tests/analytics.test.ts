import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEventRow, cleanPath, EVENT_RETENTION_DAYS, isSupabaseConfigured, recordEvent, type EventsDb } from "@/lib/analytics/events";
import {
  casePathForId,
  purchaseClaimKey,
  recordCaseCompleted,
  recordPurchaseOnce,
  recordSignupOnce,
  recordStartOutcome,
} from "@/lib/analytics/funnel";
import { appendUtm, cleanUtmValue, parseStoredUtm, utmFromFormData, utmFromSearchParams } from "@/lib/analytics/utm";
import { allCases } from "@/lib/content/cases";

// Funnel events (SPEC sections 9, 10 and 12), tested against a fake database client.

type Call = { table: string; op: string; payload?: unknown; filters: unknown[][]; returning?: string };
type Reply = { data?: unknown; error?: { code?: string; message: string } | null; count?: number };

/** A pretend Supabase client: records each query and answers with `reply`. */
function fakeDb(reply: (call: Call) => Reply = () => ({ data: null, error: null })) {
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
        insert: (payload: unknown) => ((call.op = "insert"), (call.payload = payload), chain),
        update: (payload: unknown) => ((call.op = "update"), (call.payload = payload), chain),
        delete: () => ((call.op = "delete"), chain),
        select: (cols: string) => (call.op === "select" ? call.filters.push(["select", cols]) : (call.returning = cols), chain),
        eq: step("eq"),
        is: step("is"),
        lt: step("lt"),
        gte: step("gte"),
        not: step("not"),
        order: step("order"),
        limit: step("limit"),
        range: step("range"),
        then: (resolve: (v: Reply) => unknown, reject: (e: unknown) => unknown) => {
          calls.push(call);
          return Promise.resolve()
            .then(() => reply(call))
            .then((r) => ({ data: null, error: null, ...r }))
            .then(resolve, reject);
        },
      });
      return chain;
    },
  };
  return { db: db as unknown as EventsDb, calls };
}

const USER = "11111111-2222-4333-8444-555555555555";
const NOW = new Date("2026-10-15T12:00:00Z");

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_for_tests");
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("campaign tags (UTM)", () => {
  it("keeps the four tags, trimmed and shortened, and drops the rest", () => {
    const utm = utmFromSearchParams(new URLSearchParams("utm_source=%20linkedin%20&utm_medium=social&utm_content=x&utm_campaign=autumn&ref=y"));
    expect(utm).toEqual({ utm_source: "linkedin", utm_medium: "social", utm_campaign: "autumn" });
    expect(cleanUtmValue("a".repeat(500))).toHaveLength(100);
    expect(utmFromSearchParams(new URLSearchParams("ref=y"))).toBeNull();
  });

  it("drops anything that looks like an email address and control characters (rule 2.7)", () => {
    expect(cleanUtmValue("someone@example.com")).toBeNull();
    expect(cleanUtmValue("a\u0000b\nc")).toBe("a b c");
    expect(cleanUtmValue("   ")).toBeNull();
    expect(cleanUtmValue(42)).toBeNull();
  });

  it("reads tags from a form, from Next.js searchParams and from storage", () => {
    const form = new FormData();
    form.set("utm_source", "newsletter");
    form.set("utm_term", "case interview");
    expect(utmFromFormData(form)).toEqual({ utm_source: "newsletter", utm_term: "case interview" });
    expect(utmFromSearchParams({ utm_source: ["a", "b"], utm_medium: undefined })).toEqual({ utm_source: "a" });
    expect(parseStoredUtm('{"utm_source":"x","utm_medium":"me@example.com","evil":"y"}')).toEqual({ utm_source: "x" });
    expect(parseStoredUtm("not json")).toBeNull();
    expect(parseStoredUtm("[1,2]")).toBeNull();
  });

  it("carries tags through a sign-in link", () => {
    const params = appendUtm(new URLSearchParams("next=%2Fapp"), { utm_source: "x", utm_campaign: "launch" });
    expect(params.toString()).toBe("next=%2Fapp&utm_source=x&utm_campaign=launch");
  });
});

describe("recordEvent", () => {
  it("writes one clean row to events", async () => {
    const { db, calls } = fakeDb();
    expect(await recordEvent("case_started", { userId: USER, path: "/cases/x", utm: { utm_source: "li" } }, db)).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ table: "events", op: "insert" });
    expect(calls[0].payload).toEqual({
      name: "case_started",
      user_id: USER,
      path: "/cases/x",
      utm_source: "li",
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
    });
  });

  it("does nothing when Supabase is not configured, and never creates the client then", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    const factory = vi.fn();
    expect(await recordEvent("signup", { userId: USER }, factory)).toBe(false);
    expect(factory).not.toHaveBeenCalled();
  });

  it("calls a client factory lazily", async () => {
    const { db, calls } = fakeDb();
    const factory = vi.fn(() => db);
    expect(await recordEvent("purchase", { userId: USER }, factory)).toBe(true);
    expect(factory).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(1);
  });

  it("never throws: database errors, thrown errors and a broken factory all return false", async () => {
    const failing = fakeDb(() => ({ error: { code: "42501", message: "permission denied" } }));
    expect(await recordEvent("signup", { userId: USER }, failing.db)).toBe(false);
    const throwing = fakeDb(() => {
      throw new Error("network down");
    });
    expect(await recordEvent("signup", { userId: USER }, throwing.db)).toBe(false);
    expect(
      await recordEvent("signup", { userId: USER }, () => {
        throw new Error("missing env");
      }),
    ).toBe(false);
    expect(await recordEvent("not_an_event" as never, {}, fakeDb().db)).toBe(false);
  });

  it("logs only fixed words and error codes, never ids or addresses", async () => {
    await recordEvent("signup", { userId: USER, path: "/x" }, fakeDb(() => ({ error: { code: "XX000", message: `user ${USER} a@b.c` } })).db);
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).toContain("XX000");
    expect(logged).not.toContain(USER);
    expect(logged).not.toContain("@");
  });

  it("refuses odd paths and user ids", () => {
    expect(cleanPath("https://evil.example/")).toBeNull();
    expect(cleanPath("//evil.example")).toBeNull();
    expect(cleanPath("/login?email=a@b.c")).toBeNull();
    expect(cleanPath("/cases/harbourline")).toBe("/cases/harbourline");
    expect(buildEventRow("signup", { userId: "not-a-uuid" }).user_id).toBeNull();
  });
});

describe("signup: once per new account", () => {
  const newUser = { id: USER, created_at: "2026-10-15T11:58:00Z" };

  it("records the first sign-in of a new account, with its campaign tags", async () => {
    const { db, calls } = fakeDb((c) => (c.op === "select" ? { data: [] } : {}));
    expect(await recordSignupOnce(db, newUser, { utm: { utm_source: "linkedin" }, now: NOW })).toBe(true);
    expect(calls.map((c) => c.op)).toEqual(["select", "insert"]);
    expect(calls[0].filters).toContainEqual(["eq", "name", "signup"]);
    expect(calls[0].filters).toContainEqual(["eq", "user_id", USER]);
    expect(calls[1].payload).toMatchObject({ name: "signup", user_id: USER, utm_source: "linkedin", path: "/login" });
  });

  it("does not count the same account twice", async () => {
    const { db, calls } = fakeDb((c) => (c.op === "select" ? { data: [{ id: "e1" }] } : {}));
    expect(await recordSignupOnce(db, newUser, { now: NOW })).toBe(false);
    expect(calls.filter((c) => c.op === "insert")).toHaveLength(0);
  });

  it(`never counts accounts older than the ${EVENT_RETENTION_DAYS}-day event window (their first event may be deleted)`, async () => {
    const { db, calls } = fakeDb(() => ({ data: [] }));
    const old = { id: USER, created_at: new Date(NOW.getTime() - EVENT_RETENTION_DAYS * 86_400_000).toISOString() };
    expect(await recordSignupOnce(db, old, { now: NOW })).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("skips when unsure: a failed check, no user or no creation date", async () => {
    const failing = fakeDb((c) => (c.op === "select" ? { error: { code: "57014", message: "timeout" } } : {}));
    expect(await recordSignupOnce(failing.db, newUser, { now: NOW })).toBe(false);
    expect(failing.calls.filter((c) => c.op === "insert")).toHaveLength(0);
    expect(await recordSignupOnce(fakeDb().db, null)).toBe(false);
    expect(await recordSignupOnce(fakeDb().db, { id: USER })).toBe(false);
  });
});

describe("case_started and paywall_viewed", () => {
  it("records a new interview as case_started with the case page as path", async () => {
    const { db, calls } = fakeDb();
    await recordStartOutcome(db, { status: "started", sessionId: "s" }, { userId: USER, slug: "harbourline-bakeries" });
    expect(calls[0].payload).toMatchObject({ name: "case_started", path: "/cases/harbourline-bakeries" });
  });

  it("records a plan refusal as paywall_viewed (once a day: see tests/funnel-once.test.ts)", async () => {
    for (const outcome of [{ status: "needs_upgrade" } as const, { status: "blocked", blocked: "total" } as const]) {
      const { db, calls } = fakeDb((c) => (c.op === "select" ? { data: [] } : {}));
      expect(await recordStartOutcome(db, outcome, { userId: USER, slug: "x" })).toBe(true);
      expect(calls.map((c) => c.op)).toEqual(["select", "insert"]);
      expect(calls[1].payload).toMatchObject({ name: "paywall_viewed", path: "/app/start/x" });
    }
  });

  it("records nothing for a resumed interview or a paid plan's daily or monthly limit", async () => {
    const { db, calls } = fakeDb();
    await recordStartOutcome(db, { status: "resumed", sessionId: "s" }, { userId: USER, slug: "x" });
    await recordStartOutcome(db, { status: "blocked", blocked: "day" }, { userId: USER, slug: "x" });
    await recordStartOutcome(db, { status: "blocked", blocked: "month" }, { userId: USER, slug: "x" });
    expect(calls).toHaveLength(0);
  });
});

describe("case_completed", () => {
  it("uses the case page as path", async () => {
    const c = allCases[0];
    expect(casePathForId(c.id)).toBe(`/cases/${c.slug}`);
    expect(casePathForId("no-such-case")).toBeNull();
    const { db, calls } = fakeDb();
    await recordCaseCompleted(db, { user_id: USER, case_id: c.id });
    expect(calls[0].payload).toMatchObject({ name: "case_completed", user_id: USER, path: `/cases/${c.slug}` });
  });
});

describe("purchase: once per paid checkout", () => {
  const checkout = { id: "cs_test_abcdef123", client_reference_id: USER, payment_status: "paid", metadata: { plan: "pass90", user_id: USER } };

  it("claims the checkout in stripe_events, then records the purchase with its plan", async () => {
    const { db, calls } = fakeDb();
    expect(await recordPurchaseOnce(db, checkout)).toBe(true);
    expect(calls[0]).toMatchObject({ table: "stripe_events", op: "insert", payload: { id: purchaseClaimKey(checkout.id), type: "purchase_event" } });
    expect(calls[1].payload).toMatchObject({ name: "purchase", user_id: USER, path: "/pricing?plan=pass90" });
  });

  it("records nothing when the webhook or the return page already did (unique key clash)", async () => {
    const { db, calls } = fakeDb((c) => (c.table === "stripe_events" ? { error: { code: "23505", message: "duplicate key" } } : {}));
    expect(await recordPurchaseOnce(db, checkout)).toBe(false);
    expect(calls.filter((c) => c.table === "events")).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("works across both callers: only the first of two calls writes an event", async () => {
    const claimed = new Set<string>();
    const { db, calls } = fakeDb((c) => {
      if (c.table !== "stripe_events") return {};
      const id = (c.payload as { id: string }).id;
      if (claimed.has(id)) return { error: { code: "23505", message: "duplicate" } };
      claimed.add(id);
      return {};
    });
    await recordPurchaseOnce(db, checkout); // the return page
    await recordPurchaseOnce(db, checkout); // the webhook, later
    expect(calls.filter((c) => c.table === "events")).toHaveLength(1);
  });

  it("does not count unpaid or free (100% discount) checkouts, or ones without a user", async () => {
    for (const bad of [
      { ...checkout, payment_status: "unpaid" },
      { ...checkout, payment_status: "no_payment_required" },
      { ...checkout, client_reference_id: null, metadata: {} },
      { ...checkout, id: "not-a-checkout" },
      null,
    ]) {
      const { db, calls } = fakeDb();
      expect(await recordPurchaseOnce(db, bad)).toBe(false);
      expect(calls).toHaveLength(0);
    }
  });
});
