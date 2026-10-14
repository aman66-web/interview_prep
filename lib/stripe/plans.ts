import { isPaid, type Entitlement } from "@/lib/access";
import { siteConfig } from "@/site.config";

// The two things that can be bought (kit section 8). Amounts come from
// site.config.ts. If STRIPE_PRICE_MONTHLY / STRIPE_PRICE_PASS90 are set, Checkout
// uses those Stripe prices; otherwise it creates the price inline from the amount here.

export const PLANS = ["monthly", "pass90"] as const;
export type PlanId = (typeof PLANS)[number];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

/** How long one 90-Day Pass lasts. */
export const PASS_DAYS = 90;

/** After a subscription's paid period ends we keep access for this long, in case a renewal message is late. */
export const SUBSCRIPTION_GRACE_DAYS = 3;

export const PLAN_INFO: Record<PlanId, { name: string; mode: "subscription" | "payment"; amountUsd: number }> = {
  monthly: { name: "Monthly", mode: "subscription", amountUsd: siteConfig.prices.monthly },
  pass90: { name: "90-Day Pass", mode: "payment", amountUsd: siteConfig.prices.pass90 },
};

export type PurchaseCheck = { ok: true } | { ok: false; reason: "group" | "already_monthly" | "pass_running" };

/**
 * Stops someone paying for something that would clash with what they already have:
 * a second subscription, a subscription on top of a running pass, or anything on a group plan.
 * Buying another 90-Day Pass while one runs is allowed: it extends it.
 */
export function checkPurchase(plan: PlanId, entitlement: Entitlement, now: Date = new Date()): PurchaseCheck {
  if (!isPaid(entitlement, now) || !entitlement) return { ok: true };
  if (entitlement.plan === "group") return { ok: false, reason: "group" };
  if (entitlement.plan === "monthly") return { ok: false, reason: "already_monthly" };
  // A running pass.
  return plan === "pass90" ? { ok: true } : { ok: false, reason: "pass_running" };
}

export const PURCHASE_NOTICES: Record<string, string> = {
  unavailable: "Payments aren't switched on yet. We're finishing setting them up, so please check back soon.",
  cancelled: "No payment was taken. You can pick a plan whenever you're ready.",
  invalid: "That plan wasn't recognised. Please choose one of the plans below.",
  error: "We couldn't start the payment just now. Nothing was charged. Please try again in a minute.",
  group: "Your account is on a group plan, so there's nothing to buy. Contact support if you think that's wrong.",
  already_monthly: "You already have the Monthly plan. You can manage or cancel it from your account.",
  pass_running: "Your 90-Day Pass is still running. You can buy another pass to extend it, or choose Monthly once it ends.",
};
