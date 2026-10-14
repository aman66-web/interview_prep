import { describe, expect, it } from "vitest";
import { hasAccess, isPaid, type Entitlement } from "@/lib/access";

const now = new Date("2026-10-14T12:00:00Z");
const future = "2026-12-01T00:00:00Z";
const past = "2026-09-01T00:00:00Z";

describe("isPaid", () => {
  it("is false for nobody, the free plan, and anything not active", () => {
    expect(isPaid(null, now)).toBe(false);
    expect(isPaid({ plan: "free", status: "active", expires_at: null }, now)).toBe(false);
    expect(isPaid({ plan: "monthly", status: "canceled", expires_at: future }, now)).toBe(false);
    expect(isPaid({ plan: "monthly", status: "past_due", expires_at: future }, now)).toBe(false);
  });

  it("is true for an active subscription, with or without a period end in the future", () => {
    expect(isPaid({ plan: "monthly", status: "active", expires_at: null }, now)).toBe(true);
    expect(isPaid({ plan: "monthly", status: "active", expires_at: future }, now)).toBe(true);
    expect(isPaid({ plan: "group", status: "active", expires_at: null }, now)).toBe(true);
  });

  it("ends a pass when its 90 days run out", () => {
    expect(isPaid({ plan: "pass90", status: "active", expires_at: future }, now)).toBe(true);
    expect(isPaid({ plan: "pass90", status: "active", expires_at: past }, now)).toBe(false);
    expect(isPaid({ plan: "monthly", status: "active", expires_at: past }, now)).toBe(false);
  });

  it("never treats a pass with no end date as paid", () => {
    expect(isPaid({ plan: "pass90", status: "active", expires_at: null }, now)).toBe(false);
  });
});

describe("hasAccess", () => {
  const paid: Entitlement = { plan: "monthly", status: "active", expires_at: future };
  const free: Entitlement = { plan: "free", status: "active", expires_at: null };

  it("gives paid users every paid feature", () => {
    for (const f of ["unlimited_drills", "all_cases", "ai_sessions_paid", "model_answers", "progress_tracking"] as const) {
      expect(hasAccess(paid, f, now), f).toBe(true);
    }
  });

  it("gives free users and visitors none of them", () => {
    for (const f of ["unlimited_drills", "all_cases", "ai_sessions_paid", "model_answers", "progress_tracking"] as const) {
      expect(hasAccess(free, f, now), f).toBe(false);
      expect(hasAccess(null, f, now), f).toBe(false);
    }
  });
});
