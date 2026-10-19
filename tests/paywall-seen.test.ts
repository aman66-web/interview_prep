import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The "saw the paywall" server action (C1), with the login, the plan and the admin
// client replaced by fakes. Who is counted, with which path, and how often.

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "student@example.test" };
const getUser = vi.fn();
const getEntitlement = vi.fn();
const inserts: { name: string; user_id: string; path: string }[] = [];
let selects = 0;

/** A pretend events table: answers "already recorded today?" from what was inserted. */
const fakeAdmin = () => ({
  from: () => {
    let insertRow: (typeof inserts)[number] | null = null;
    const filters: [string, unknown][] = [];
    const chain = {
      select: () => chain,
      insert: (row: (typeof inserts)[number]) => ((insertRow = row), chain),
      eq: (col: string, value: unknown) => (filters.push([col, value]), chain),
      gte: () => chain,
      limit: () => chain,
      then(resolve: (v: unknown) => unknown) {
        if (insertRow) {
          inserts.push(insertRow);
          return Promise.resolve({ data: null, error: null }).then(resolve);
        }
        selects++;
        const found = inserts.filter((r) => filters.every(([col, value]) => r[col as keyof typeof r] === value));
        return Promise.resolve({ data: found.slice(0, 1), error: null }).then(resolve);
      },
    };
    return chain;
  },
});

vi.mock("@/lib/auth/session", () => ({ getUser: () => getUser() }));
vi.mock("@/lib/auth/entitlement", () => ({ getEntitlement: () => getEntitlement() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeAdmin() }));

const { notePaywallSeen } = await import("@/app/app/funnel-actions");

const PAID_CASE = "bramblecup-uk-supermarket-deal";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_for_tests");
  vi.stubEnv("SHOW_DRAFT_CONTENT", "1");
  inserts.length = 0;
  selects = 0;
  getUser.mockReset();
  getEntitlement.mockReset();
  getEntitlement.mockResolvedValue(null); // free plan
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("notePaywallSeen", () => {
  it("records nothing for a guest", async () => {
    getUser.mockResolvedValue(null);
    await notePaywallSeen("pricing");
    await notePaywallSeen("start", PAID_CASE);
    expect(inserts).toEqual([]);
    expect(selects).toBe(0);
  });

  it("gives a free user on a locked case exactly one paywall_viewed a day", async () => {
    getUser.mockResolvedValue(USER);
    for (let i = 0; i < 5; i++) await notePaywallSeen("start", PAID_CASE);
    await notePaywallSeen("pricing");
    await notePaywallSeen("dashboard");
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ name: "paywall_viewed", user_id: USER.id, path: `/app/start/${PAID_CASE}` });
    expect(JSON.stringify(inserts)).not.toContain("@");
  });

  it("records nothing for a paying user", async () => {
    getUser.mockResolvedValue(USER);
    getEntitlement.mockResolvedValue({ plan: "pass90", status: "active", expires_at: new Date(Date.now() + 86_400_000).toISOString() });
    await notePaywallSeen("pricing");
    expect(inserts).toEqual([]);
  });

  it("accepts only known places and real cases, so the path cannot be chosen by the caller", async () => {
    getUser.mockResolvedValue(USER);
    await notePaywallSeen("admin" as never);
    await notePaywallSeen("start", "no-such-case");
    await notePaywallSeen("start", "../../admin");
    expect(inserts).toEqual([]);
  });

  it("never throws, even when the plan cannot be read", async () => {
    getUser.mockResolvedValue(USER);
    getEntitlement.mockRejectedValue(new Error("database down"));
    await expect(notePaywallSeen("pricing")).resolves.toBeUndefined();
    expect(inserts).toEqual([]);
  });
});

describe("where the paywall is shown", () => {
  it("the start page, the dashboard's locked next step and /pricing all report it", () => {
    const start = readFileSync("app/app/start/[slug]/page.tsx", "utf8");
    expect(start.match(/<PaywallSeen place="start" slug=\{c\.slug\} \/>/g)).toHaveLength(2); // a paid case, and the free interview used up
    expect(readFileSync("app/app/page.tsx", "utf8")).toMatch(/<PaywallSeen place="dashboard" \/>/);
    expect(readFileSync("app/pricing/page.tsx", "utf8")).toMatch(/<PaywallSeen place="pricing" \/>/);
  });

  it("is reported by a POST after the page loads, never by loading a page (links can be prefetched)", () => {
    const beacon = readFileSync("components/app/paywall-seen.tsx", "utf8");
    expect(beacon).toMatch(/^"use client";/);
    expect(beacon).toMatch(/useEffect\(/);
    expect(readFileSync("app/app/funnel-actions.ts", "utf8")).toMatch(/^"use server";/);
  });
});
