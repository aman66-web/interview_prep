import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventsDb } from "@/lib/analytics/events";
import { paywallPath, recordOncePerDay, recordPaywallViewed, recordStartOutcome, utcDayStart } from "@/lib/analytics/funnel";

// paywall_viewed and checkout_started are recorded at most once per person per UTC day
// (S5), and paywall_viewed is recorded where the paywall is really shown (C1).

type Row = { name: string; user_id: string | null; path: string | null; created_at: string };

/**
 * A pretend events table that understands the few filters the funnel uses
 * (eq, gte on created_at, limit), so repeated calls can be counted.
 */
function eventsTable(clock: { now: Date }, options: { failSelect?: boolean } = {}) {
  const rows: Row[] = [];
  const selects: unknown[][][] = [];
  const db = {
    from(table: string) {
      expect(table).toBe("events");
      const filters: unknown[][] = [];
      let insertRow: Omit<Row, "created_at"> | null = null;
      const chain = {
        select: () => chain,
        insert: (row: Omit<Row, "created_at">) => ((insertRow = row), chain),
        eq: (col: string, value: unknown) => (filters.push(["eq", col, value]), chain),
        gte: (col: string, value: unknown) => (filters.push(["gte", col, value]), chain),
        limit: (n: number) => (filters.push(["limit", n]), chain),
        then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
          return Promise.resolve()
            .then(() => {
              if (insertRow) {
                rows.push({ ...insertRow, created_at: clock.now.toISOString() });
                return { data: null, error: null };
              }
              selects.push(filters);
              if (options.failSelect) return { data: null, error: { code: "57014", message: "timeout" } };
              const found = rows.filter((r) =>
                filters.every(([op, col, value]) => {
                  if (op === "eq") return r[col as keyof Row] === value;
                  if (op === "gte") return r[col as keyof Row]! >= (value as string);
                  return true;
                }),
              );
              return { data: found.slice(0, 1).map(() => ({ id: "e" })), error: null };
            })
            .then(resolve, reject);
        },
      };
      return chain;
    },
  };
  return { db: db as unknown as EventsDb, rows, selects };
}

const USER = "11111111-2222-4333-8444-555555555555";
const OTHER = "11111111-2222-4333-8444-666666666666";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_for_tests");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("recordOncePerDay", () => {
  it("records the first one of the UTC day and checks from midnight UTC", async () => {
    const clock = { now: new Date("2026-10-15T23:30:00Z") };
    const t = eventsTable(clock);
    expect(await recordOncePerDay(t.db, "paywall_viewed", { userId: USER, path: "/pricing", now: clock.now })).toBe(true);
    expect(t.rows).toHaveLength(1);
    expect(t.rows[0]).toMatchObject({ name: "paywall_viewed", user_id: USER, path: "/pricing" });
    expect(t.selects[0]).toContainEqual(["eq", "name", "paywall_viewed"]);
    expect(t.selects[0]).toContainEqual(["eq", "user_id", USER]);
    expect(t.selects[0]).toContainEqual(["gte", "created_at", "2026-10-15T00:00:00.000Z"]);
    expect(t.selects[0]).not.toContainEqual(expect.arrayContaining(["path"]));
  });

  it("a free user who keeps seeing the paywall is counted once a day, wherever they see it", async () => {
    const clock = { now: new Date("2026-10-15T09:00:00Z") };
    const t = eventsTable(clock);
    for (const path of ["/app/start/bramblecup-uk-supermarket-deal", "/app/start/bramblecup-uk-supermarket-deal", "/pricing", "/app", "/pricing"]) {
      await recordPaywallViewed(t.db, { userId: USER, path, now: clock.now });
      clock.now = new Date(clock.now.getTime() + 60_000);
    }
    expect(t.rows).toHaveLength(1);
    expect(t.rows[0].path).toBe("/app/start/bramblecup-uk-supermarket-deal");

    // Another person is counted separately, and the next UTC day counts again.
    await recordPaywallViewed(t.db, { userId: OTHER, path: "/pricing", now: clock.now });
    clock.now = new Date("2026-10-16T00:00:01Z");
    await recordPaywallViewed(t.db, { userId: USER, path: "/pricing", now: clock.now });
    expect(t.rows.map((r) => [r.user_id, r.path])).toEqual([
      [USER, "/app/start/bramblecup-uk-supermarket-deal"],
      [OTHER, "/pricing"],
      [USER, "/pricing"],
    ]);
  });

  it("with perPath, counts once per path per day (checkout_started per plan)", async () => {
    const clock = { now: new Date("2026-10-15T09:00:00Z") };
    const t = eventsTable(clock);
    for (let i = 0; i < 50; i++) {
      await recordOncePerDay(t.db, "checkout_started", { userId: USER, path: "/pricing?plan=pass90", perPath: true, now: clock.now });
    }
    await recordOncePerDay(t.db, "checkout_started", { userId: USER, path: "/pricing?plan=monthly", perPath: true, now: clock.now });
    expect(t.rows.map((r) => r.path)).toEqual(["/pricing?plan=pass90", "/pricing?plan=monthly"]);
    expect(t.selects[0]).toContainEqual(["eq", "path", "/pricing?plan=pass90"]);
  });

  it("skips when unsure, for unknown accounts, odd paths, or without Supabase", async () => {
    const clock = { now: new Date("2026-10-15T09:00:00Z") };
    const failing = eventsTable(clock, { failSelect: true });
    expect(await recordOncePerDay(failing.db, "paywall_viewed", { userId: USER, path: "/pricing" })).toBe(false);
    expect(failing.rows).toHaveLength(0);

    const t = eventsTable(clock);
    expect(await recordOncePerDay(t.db, "paywall_viewed", { userId: "not-a-uuid", path: "/pricing" })).toBe(false);
    expect(await recordOncePerDay(t.db, "paywall_viewed", { userId: USER, path: "//evil.example" })).toBe(false);
    expect(t.selects).toHaveLength(0);

    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const factory = vi.fn(() => t.db);
    expect(await recordOncePerDay(factory, "paywall_viewed", { userId: USER, path: "/pricing" })).toBe(false);
    expect(factory).not.toHaveBeenCalled();
  });

  it("never throws", async () => {
    const throwing = {
      from() {
        throw new Error("network down");
      },
    } as unknown as EventsDb;
    expect(await recordOncePerDay(throwing, "paywall_viewed", { userId: USER, path: "/pricing" })).toBe(false);
  });

  it("works out midnight UTC", () => {
    expect(utcDayStart(new Date("2026-10-15T00:00:00Z")).toISOString()).toBe("2026-10-15T00:00:00.000Z");
    expect(utcDayStart(new Date("2026-10-15T23:59:59.999Z")).toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });
});

describe("recordStartOutcome uses the same daily limit for the paywall", () => {
  it("records a refused Start once a day however often it is pressed", async () => {
    const clock = { now: new Date("2026-10-15T09:00:00Z") };
    const t = eventsTable(clock);
    for (let i = 0; i < 20; i++) {
      await recordStartOutcome(t.db, { status: "needs_upgrade" }, { userId: USER, slug: "x", now: clock.now });
    }
    expect(t.rows).toHaveLength(1);
  });
});

describe("paywallPath", () => {
  const exists = (slug: string) => slug === "bramblecup-uk-supermarket-deal";

  it("maps each place to a fixed path", () => {
    expect(paywallPath("pricing", undefined, exists)).toBe("/pricing");
    expect(paywallPath("dashboard", "ignored", exists)).toBe("/app");
    expect(paywallPath("start", "bramblecup-uk-supermarket-deal", exists)).toBe("/app/start/bramblecup-uk-supermarket-deal");
  });

  it.each([
    ["start", "no-such-case"],
    ["start", undefined],
    ["start", "../admin"],
    ["start", "a b"],
    ["start", "__proto__"],
    ["start", "bramblecup-uk-supermarket-deal?x=1"],
    ["admin", undefined],
    ["__proto__", undefined],
    [42, undefined],
    [null, undefined],
  ])("refuses place %j with slug %j", (place, slug) => {
    expect(paywallPath(place, slug, exists)).toBeNull();
  });
});

describe("the admin dashboard's row cap", () => {
  it("reads every table newest first, so a cap drops the oldest rows, not the latest", async () => {
    const { readFileSync } = await import("node:fs");
    const text = readFileSync("app/admin/actions.ts", "utf8");
    const reads = text.split("fetchAllRows<").slice(1);
    expect(reads).toHaveLength(4);
    for (const read of reads) {
      const orders = read.slice(0, read.indexOf("range(")).match(/\.order\([^)]*\)/g) ?? [];
      expect(orders.length).toBeGreaterThan(0);
      for (const order of orders) expect(order).toMatch(/NEWEST|ascending: false/);
    }
    expect(text).toMatch(/const NEWEST = \{ ascending: false \} as const;/);
  });

  it("keeps the newest rows when the cap is hit", async () => {
    const { fetchAllRows } = await import("@/lib/analytics/fetch-all");
    // 30 rows, newest first (as the admin queries ask for them); the cap is 25.
    const rows = Array.from({ length: 30 }, (_, i) => ({ created_at: new Date(Date.UTC(2026, 9, 30 - i)).toISOString() }));
    const { rows: got, truncated } = await fetchAllRows((from, to) => Promise.resolve({ data: rows.slice(from, to + 1), error: null }), { pageSize: 10, maxRows: 25 });
    expect(truncated).toBe(true);
    expect(got[0].created_at).toBe("2026-10-30T00:00:00.000Z");
    expect(got.at(-1)!.created_at).toBe("2026-10-06T00:00:00.000Z");
  });
});
