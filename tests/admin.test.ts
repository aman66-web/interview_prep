import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/analytics/admin-access";
import {
  decisionReading,
  formatCompact,
  formatPercent,
  formatUsd,
  summariseWindow,
  windowStart,
  type DashboardInput,
  type EventFact,
} from "@/lib/analytics/dashboard";
import { fetchAllRows } from "@/lib/analytics/fetch-all";

// The /admin page (SPEC section 12): who may see it, and the sums it shows.

const NOW = new Date("2026-10-15T12:00:00Z");
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "aaaaaaaa-0000-4000-8000-000000000002";
const C = "aaaaaaaa-0000-4000-8000-000000000003";

const ev = (name: string, user: string | null, created_at: string, extra: Partial<EventFact> = {}): EventFact => ({
  name,
  user_id: user,
  path: null,
  utm_source: null,
  created_at,
  ...extra,
});

describe("who may open /admin", () => {
  it("reads ADMIN_EMAILS as a comma-separated list, ignoring spaces and case", () => {
    expect([...parseAdminEmails(" Founder@Example.com , ops@example.com,,not-an-email ")]).toEqual(["founder@example.com", "ops@example.com"]);
    expect(isAdminEmail("FOUNDER@example.com ", "founder@example.com")).toBe(true);
    expect(isAdminEmail("someone@example.com", "founder@example.com")).toBe(false);
  });

  it("lets nobody in when the list is empty or the user has no email", () => {
    expect(isAdminEmail("founder@example.com", "")).toBe(false);
    expect(isAdminEmail("founder@example.com", undefined)).toBe(false);
    expect(isAdminEmail(null, "founder@example.com")).toBe(false);
    expect(isAdminEmail("", ",")).toBe(false);
  });

  it("checks the caller on the page and again in the server action, and keeps the page out of search", () => {
    const page = readFileSync("app/admin/page.tsx", "utf8");
    const action = readFileSync("app/admin/actions.ts", "utf8");
    for (const text of [page, action]) {
      expect(text).toMatch(/requireUser\(\)/);
      expect(text).toMatch(/if \(!isAdminEmail\(user\.email\)\) notFound\(\)/);
    }
    expect(page).toMatch(/index: false/);
    expect(action.indexOf("notFound()")).toBeLessThan(action.indexOf("createAdminClient()"));
  });
});

describe("summariseWindow", () => {
  const input: DashboardInput = {
    events: [
      ev("signup", A, "2026-10-14T09:00:00Z", { utm_source: "linkedin" }),
      ev("signup", B, "2026-10-12T09:00:00Z"),
      ev("signup", C, "2026-09-20T09:00:00Z", { utm_source: "linkedin" }), // only in the 30-day window
      ev("case_started", A, "2026-10-14T09:10:00Z"),
      ev("case_started", A, "2026-10-14T10:10:00Z"), // same person again
      ev("case_started", B, "2026-10-13T09:10:00Z"),
      ev("case_completed", A, "2026-10-14T09:40:00Z"),
      ev("paywall_viewed", A, "2026-10-14T09:50:00Z"),
      ev("checkout_started", A, "2026-10-14T09:55:00Z", { path: "/pricing?plan=pass90" }),
      ev("purchase", A, "2026-10-14T09:58:00Z", { path: "/pricing?plan=pass90" }),
      ev("purchase", C, "2026-09-21T09:58:00Z", { path: "/pricing?plan=monthly" }),
      ev("signup", A, "2026-10-16T09:00:00Z"), // in the future: ignored
    ],
    usage: [
      { created_at: "2026-10-14T09:11:00Z", input_tokens: 1000, output_tokens: 200, cost_estimate_usd: "0.004" },
      { created_at: "2026-10-14T09:12:00Z", input_tokens: 3000, output_tokens: 300, cost_estimate_usd: 0.006 },
      { created_at: "2026-10-09T09:12:00Z", input_tokens: 500, output_tokens: 50, cost_estimate_usd: 0.01 }, // day 1 of 7
      { created_at: "2026-10-08T23:59:59Z", input_tokens: 9, output_tokens: 9, cost_estimate_usd: 1 }, // just before the 7-day window
    ],
    completed: [{ completed_at: "2026-10-14T09:40:00Z" }, { completed_at: "2026-09-20T10:00:00Z" }, { completed_at: null }],
    leads: [{ created_at: "2026-10-01T10:00:00Z" }, { created_at: "2026-10-15T08:00:00Z" }],
  };

  it("uses whole UTC days including today", () => {
    expect(windowStart(NOW, 7).toISOString()).toBe("2026-10-09T00:00:00.000Z");
    expect(windowStart(NOW, 30).toISOString()).toBe("2026-09-16T00:00:00.000Z");
  });

  it("counts people per funnel step, with events and step-to-step conversion", () => {
    const week = summariseWindow(input, 7, NOW);
    expect(week.funnel.map((s) => [s.key, s.people, s.events])).toEqual([
      ["signup", 2, 2],
      ["case_started", 2, 3],
      ["case_completed", 1, 1],
      ["paywall_viewed", 1, 1],
      ["checkout_started", 1, 1],
      ["purchase", 1, 1],
    ]);
    expect(week.funnel[0].fromPrevious).toBeNull();
    expect(week.funnel[1].fromPrevious).toBe(1);
    expect(week.funnel[2].fromPrevious).toBe(0.5);
    expect(week.signups).toBe(2);
    expect(week.payingPeople).toBe(1);
    expect(week.signupToPaid).toBe(0.5);
    expect(week.purchasesByPlan).toEqual({ monthly: 0, pass90: 1, other: 0 });
  });

  it("widens to 30 days", () => {
    const month = summariseWindow(input, 30, NOW);
    expect(month.signups).toBe(3);
    expect(month.payingPeople).toBe(2);
    expect(month.purchasesByPlan).toEqual({ monthly: 1, pass90: 1, other: 0 });
    expect(month.signupsBySource).toEqual([
      { source: "linkedin", people: 2 },
      { source: "(no campaign tag)", people: 1 },
    ]);
    expect(month.leads).toBe(2);
    expect(month.ai.finishedInterviews).toBe(2);
  });

  it("adds up AI cost and tokens, with one bar per day and cost per finished interview", () => {
    const week = summariseWindow(input, 7, NOW);
    expect(week.ai.costUsd).toBeCloseTo(0.02, 10);
    expect(week.ai.inputTokens).toBe(4500);
    expect(week.ai.outputTokens).toBe(550);
    expect(week.ai.calls).toBe(3);
    expect(week.ai.perDay).toHaveLength(7);
    expect(week.ai.perDay[0]).toMatchObject({ date: "2026-10-09", calls: 1, tokens: 550 });
    expect(week.ai.perDay.find((d) => d.date === "2026-10-14")).toMatchObject({ calls: 2, tokens: 4500 });
    expect(week.ai.perDay.at(-1)).toMatchObject({ date: "2026-10-15", calls: 0, costUsd: 0 });
    expect(week.ai.finishedInterviews).toBe(1);
    expect(week.ai.costPerFinished).toBeCloseTo(0.02, 10);
    expect(week.leads).toBe(1);
  });

  it("copes with an empty database", () => {
    const empty = summariseWindow({ events: [], usage: [], completed: [], leads: [] }, 7, NOW);
    expect(empty.funnel.every((s) => s.people === 0 && s.fromPrevious === null)).toBe(true);
    expect(empty.signupToPaid).toBeNull();
    expect(empty.ai.costPerFinished).toBeNull();
    expect(empty.signupsBySource).toEqual([]);
  });
});

describe("the 30-day bar (targets from SPEC section 12)", () => {
  it("reads Go, Adjust and Stop as the plan defines them", () => {
    expect(decisionReading(300, 15)).toMatchObject({ band: "go", exact: true });
    expect(decisionReading(400, 12)).toMatchObject({ band: "go", exact: true }); // 3% of signups paying
    expect(decisionReading(150, 2)).toMatchObject({ band: "adjust", exact: true });
    expect(decisionReading(60, 7)).toMatchObject({ band: "adjust", exact: true });
    expect(decisionReading(99, 4)).toMatchObject({ band: "stop", exact: true });
    expect(decisionReading(0, 0)).toMatchObject({ band: "stop", payingShare: null });
  });

  it("marks the gap between the bands as not exact", () => {
    expect(decisionReading(350, 3)).toEqual({ band: "adjust", exact: false, payingShare: 3 / 350 });
  });
});

describe("formatting", () => {
  it("shows dollars with enough digits for small AI costs", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0.1)).toBe("$0.10");
    expect(formatUsd(0.12)).toBe("$0.12");
    expect(formatUsd(0.0123)).toBe("$0.0123");
    expect(formatUsd(0.00001)).toBe("<$0.0001");
  });

  it("shortens big numbers and percentages", () => {
    expect(formatCompact(950)).toBe("950");
    expect(formatCompact(12_400)).toBe("12K");
    expect(formatCompact(1_500)).toBe("1.5K");
    expect(formatCompact(3_100_000)).toBe("3.1M");
    expect(formatPercent(0.5)).toBe("50%");
    expect(formatPercent(0.034)).toBe("3.4%");
    expect(formatPercent(null)).toBe("–");
  });
});

describe("fetchAllRows", () => {
  it("reads page after page until a short page", async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i);
    const asked: [number, number][] = [];
    const { rows, truncated } = await fetchAllRows((from, to) => {
      asked.push([from, to]);
      return Promise.resolve({ data: all.slice(from, to + 1), error: null });
    });
    expect(rows).toHaveLength(2500);
    expect(truncated).toBe(false);
    expect(asked).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("stops at the limit and says the figures are partial", async () => {
    const { rows, truncated } = await fetchAllRows(
      (from, to) => Promise.resolve({ data: Array.from({ length: to - from + 1 }, () => 1), error: null }),
      {
        pageSize: 10,
        maxRows: 25,
      },
    );
    expect(rows).toHaveLength(25);
    expect(truncated).toBe(true);
  });

  it("fails loudly on a database error", async () => {
    await expect(fetchAllRows(() => Promise.resolve({ data: null, error: { message: "boom", code: "XX000" } }))).rejects.toThrow("XX000");
  });
});
