import { describe, expect, it } from "vitest";
import { buildAccountExport, type ExportSource } from "@/lib/account/export";

type Row = Record<string, unknown>;

// A tiny in-memory stand-in for the database.
function fakeSource(tables: Record<string, Row[]>) {
  const calls: { table: string; column: string; values: string[] }[] = [];
  const source: ExportSource = {
    async rowsFor(table, column, values) {
      calls.push({ table, column, values });
      return (tables[table] ?? []).filter((row) => values.includes(String(row[column])));
    },
  };
  return { source, calls };
}

const me = { id: "u1", email: "me@example.test", created_at: "2026-01-01T00:00:00Z" };
const now = new Date("2026-10-14T12:00:00Z");

const tables: Record<string, Row[]> = {
  profiles: [
    { id: "u1", country: "GB" },
    { id: "u2", country: "US" },
  ],
  entitlements: [
    { user_id: "u1", plan: "free" },
    { user_id: "u2", plan: "monthly" },
  ],
  case_sessions: [
    { id: "s-done", user_id: "u1", completed_at: "2026-02-01T00:00:00Z" },
    { id: "s-open", user_id: "u1", completed_at: null },
    { id: "s-other", user_id: "u2", completed_at: "2026-02-01T00:00:00Z" },
  ],
  session_messages: [
    { id: "m1", session_id: "s-done", content: "mine" },
    { id: "m2", session_id: "s-open", content: "mine too" },
    { id: "m3", session_id: "s-other", content: "someone else" },
  ],
  math_checks: [
    { session_id: "s-done", math_id: "a", expected: 10 },
    { session_id: "s-open", math_id: "a", expected: 20 },
    { session_id: "s-other", math_id: "a", expected: 30 },
  ],
  drill_attempts: [
    { id: "d1", user_id: "u1" },
    { id: "d2", user_id: "u2" },
  ],
  ai_usage: [{ id: "x1", user_id: "u1" }],
  stripe_customers: [{ user_id: "u1", stripe_customer_id: "cus_1" }],
  events: [
    { id: "e1", user_id: "u1", name: "signup" },
    { id: "e2", user_id: "u2", name: "signup" },
  ],
};

describe("buildAccountExport", () => {
  it("includes only the requesting user's data", async () => {
    const { source } = fakeSource(tables);
    const out = await buildAccountExport(source, me, now);

    expect(out.account).toEqual({ id: "u1", email: "me@example.test", created_at: "2026-01-01T00:00:00Z" });
    expect(out.profile).toEqual({ id: "u1", country: "GB" });
    expect(out.entitlement).toEqual({ user_id: "u1", plan: "free" });
    expect(out.case_sessions.map((s) => s.id)).toEqual(["s-done", "s-open"]);
    expect(out.session_messages.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(out.drill_attempts.map((d) => d.id)).toEqual(["d1"]);
    expect(out.ai_usage).toHaveLength(1);
    expect(out.stripe_customer).toEqual({ user_id: "u1", stripe_customer_id: "cus_1" });
    expect(out.events.map((e) => e.id)).toEqual(["e1"]);
    expect(JSON.stringify(out)).not.toContain("someone else");
    expect(JSON.stringify(out)).not.toContain("u2");
  });

  it("includes maths answers for finished cases only", async () => {
    const { source } = fakeSource(tables);
    const out = await buildAccountExport(source, me, now);
    expect(out.math_checks).toEqual([{ session_id: "s-done", math_id: "a", expected: 10 }]);
  });

  it("stamps the export time", async () => {
    const { source } = fakeSource(tables);
    const out = await buildAccountExport(source, me, now);
    expect(out.exported_at).toBe("2026-10-14T12:00:00.000Z");
  });

  it("copes with a brand-new user who has nothing yet", async () => {
    const { source, calls } = fakeSource({});
    const out = await buildAccountExport(source, { id: "new" }, now);
    expect(out.profile).toBeNull();
    expect(out.entitlement).toBeNull();
    expect(out.stripe_customer).toBeNull();
    expect(out.case_sessions).toEqual([]);
    expect(out.session_messages).toEqual([]);
    expect(out.math_checks).toEqual([]);
    expect(out.account.email).toBeNull();
    // With no sessions there is nothing to look up messages or maths for.
    expect(calls.some((c) => c.table === "session_messages")).toBe(false);
    expect(calls.some((c) => c.table === "math_checks")).toBe(false);
  });

  it("only ever asks for rows belonging to the user's own sessions", async () => {
    const { source, calls } = fakeSource(tables);
    await buildAccountExport(source, me, now);
    const messages = calls.find((c) => c.table === "session_messages");
    expect(messages?.values).toEqual(["s-done", "s-open"]);
  });
});
