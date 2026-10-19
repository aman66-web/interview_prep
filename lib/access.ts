// The single place that decides who gets what (kit section 8). Every paywall
// asks hasAccess(); nothing else looks at plans directly.

export type Plan = "free" | "monthly" | "pass90" | "group";

export type Entitlement = {
  plan: Plan;
  status: string;
  expires_at: string | null;
} | null;

export type Feature =
  | "unlimited_drills"
  | "all_cases"
  | "ai_sessions_paid"
  | "model_answers"
  | "progress_tracking";

/** Statuses in which a paid plan still counts. Stripe's other states (past due, canceled, ...) do not. */
const ACTIVE_STATUSES = ["active", "trialing"];

/** True when this entitlement is a paid plan that is in force right now. */
export function isPaid(entitlement: Entitlement, now: Date = new Date()): boolean {
  if (!entitlement || entitlement.plan === "free") return false;
  if (!ACTIVE_STATUSES.includes(entitlement.status)) return false;
  if (entitlement.expires_at === null) return entitlement.plan !== "pass90"; // a 90-day pass always has an end date
  return new Date(entitlement.expires_at).getTime() > now.getTime();
}

const PAID_ONLY: readonly Feature[] = [
  "unlimited_drills",
  "all_cases",
  "ai_sessions_paid",
  "model_answers",
  "progress_tracking",
];

export function hasAccess(entitlement: Entitlement, feature: Feature, now: Date = new Date()): boolean {
  if (!PAID_ONLY.includes(feature)) return true;
  return isPaid(entitlement, now);
}
