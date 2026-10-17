import { z } from "zod";
import type { StripeApi, StripeCheckoutSession, StripeSubscription } from "./client";
import { PASS_DAYS, SUBSCRIPTION_GRACE_DAYS } from "./plans";
import { UserGoneError, type PaymentsStore } from "./store";

// What happens when Stripe tells us something (kit section 8). Each handler copies
// Stripe's current state into our database, so a late or repeated message is harmless:
//  * subscription messages are never trusted for their contents: we ask Stripe for the
//    subscription's current state instead, so out-of-order messages cannot undo a newer one;
//  * adding or removing pass days is done by database functions that count each checkout
//    or refund exactly once;
//  * every event id is recorded after it succeeds, so a repeat is skipped.

export type PaymentsDeps = {
  store: PaymentsStore;
  stripe: StripeApi;
  now?: () => Date;
};

const eventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.object({ object: z.record(z.string(), z.unknown()) }),
});
export type StripeEvent = z.infer<typeof eventSchema>;

export function parseEvent(raw: unknown): StripeEvent | null {
  const parsed = eventSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type EventOutcome = "handled" | "ignored" | "duplicate";

const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

/** Which of our users a Stripe object belongs to: our own tag first, then the customer. */
async function userFor(store: PaymentsStore, metadata: Record<string, string> | null | undefined, customer: string | null | undefined) {
  const tagged = metadata?.user_id;
  if (tagged && UUID.test(tagged)) return tagged;
  return customer ? store.userIdForCustomer(customer) : null;
}

function periodEnd(sub: StripeSubscription): number | null {
  return sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
}

export async function applySubscription(deps: PaymentsDeps, subscriptionId: string, fallback?: StripeSubscription): Promise<boolean> {
  let sub: StripeSubscription;
  try {
    sub = await deps.stripe.retrieveSubscription(subscriptionId);
  } catch (error) {
    // A subscription that no longer exists at Stripe: use what the message told us.
    if (fallback && typeof error === "object" && error !== null && "status" in error && (error as { status: number }).status === 404) sub = fallback;
    else throw error;
  }

  const userId = await userFor(deps.store, sub.metadata, str(sub.customer));
  if (!userId) return false;

  const status = SUBSCRIPTION_STATUSES.includes(sub.status) ? sub.status : "incomplete";
  const end = periodEnd(sub);
  const expiresAt = end ? new Date((end + SUBSCRIPTION_GRACE_DAYS * 86_400) * 1000) : null;
  await deps.store.setSubscriptionState({ userId, subscriptionId: sub.id, status, expiresAt });
  return true;
}

/** A finished Checkout page: used by the webhook and by the page people land on after paying. */
export async function applyCheckoutSession(deps: PaymentsDeps, session: StripeCheckoutSession): Promise<boolean> {
  const userId = str(session.client_reference_id) ?? str(session.metadata?.user_id);
  if (!userId || !UUID.test(userId)) return false;
  if (session.metadata?.user_id && session.metadata.user_id !== userId) return false;

  const customer = str(session.customer);
  if (customer) await deps.store.saveCustomer(userId, customer);

  if (session.mode === "subscription") {
    const subscriptionId = str(session.subscription);
    if (!subscriptionId) return false;
    return applySubscription(deps, subscriptionId);
  }

  if (session.mode === "payment") {
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!paid || session.metadata?.plan !== "pass90") return false;
    await deps.store.grantPass({
      userId,
      checkoutSessionId: session.id,
      paymentRef: str(session.payment_intent) ?? session.id,
      days: PASS_DAYS,
    });
    return true;
  }
  return false;
}

async function applyRefund(deps: PaymentsDeps, charge: Record<string, unknown>): Promise<boolean> {
  // Only a full refund of a 90-Day Pass takes days back. A subscription refund is a
  // decision for the founder (cancel in Stripe); partial refunds change nothing.
  if (charge.refunded !== true) return false;
  const chargeId = str(charge.id);
  if (!chargeId) return false;

  const metadata = (charge.metadata ?? null) as Record<string, string> | null;
  let plan = metadata?.plan;
  let tagged = metadata;
  const paymentIntent = str(charge.payment_intent);
  if (!plan && paymentIntent) {
    const pi = await deps.stripe.retrievePaymentIntent(paymentIntent);
    plan = pi.metadata?.plan;
    tagged = pi.metadata ?? null;
  }
  if (plan !== "pass90") return false;

  const userId = await userFor(deps.store, tagged, str(charge.customer));
  if (!userId) return false;
  await deps.store.revokePass({ userId, chargeId, days: PASS_DAYS });
  return true;
}

export async function handleStripeEvent(deps: PaymentsDeps, event: StripeEvent): Promise<EventOutcome> {
  if (await deps.store.hasEvent(event.id)) return "duplicate";

  const object = event.data.object;
  let handled = false;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        handled = await applyCheckoutSession(deps, object as unknown as StripeCheckoutSession);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const id = str(object.id);
        if (id) handled = await applySubscription(deps, id, object as unknown as StripeSubscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const parent = object.parent as { subscription_details?: { subscription?: unknown } } | undefined;
        const id = str(object.subscription) ?? str(parent?.subscription_details?.subscription);
        if (id) handled = await applySubscription(deps, id);
        break;
      }
      case "charge.refunded":
        handled = await applyRefund(deps, object);
        break;
      default:
        break;
    }
  } catch (error) {
    // Their account is gone: nothing to update, and retrying would never succeed.
    if (!(error instanceof UserGoneError)) throw error;
  }

  await deps.store.recordEvent(event.id, event.type);
  return handled ? "handled" : "ignored";
}
