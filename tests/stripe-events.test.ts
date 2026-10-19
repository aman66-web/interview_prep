import { beforeEach, describe, expect, it } from "vitest";
import { isPaid } from "@/lib/access";
import { applyCheckoutSession, handleStripeEvent, parseEvent, type PaymentsDeps, type StripeEvent } from "@/lib/stripe/events";
import { MemoryPaymentsStore } from "./helpers/memory-payments-store";
import { FakeStripe } from "./helpers/fake-stripe";

const USER = "11111111-2222-3333-4444-555555555555";
const OTHER = "99999999-8888-7777-6666-555555555555";
const NOW = new Date("2026-11-01T12:00:00Z");
const DAY = 86_400_000;

let store: MemoryPaymentsStore;
let stripe: FakeStripe;
let deps: PaymentsDeps;
let n = 0;

beforeEach(() => {
  store = new MemoryPaymentsStore([USER, OTHER]);
  stripe = new FakeStripe();
  deps = { store, stripe };
});

const event = (type: string, object: Record<string, unknown>): StripeEvent => ({ id: `evt_${++n}`, type, data: { object } });
const paidSession = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  mode: "payment",
  payment_status: "paid",
  client_reference_id: USER,
  customer: "cus_1",
  payment_intent: `pi_${id}`,
  metadata: { user_id: USER, plan: "pass90" },
  ...extra,
});
const subscription = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  customer: "cus_1",
  metadata: { user_id: USER, plan: "monthly" },
  current_period_end: Math.floor(NOW.getTime() / 1000) + 30 * 86_400,
  ...extra,
});
const ent = async (user = USER) => store.entitlements.get(user);

describe("events: parsing", () => {
  it("accepts a normal event and refuses anything else", () => {
    expect(parseEvent({ id: "evt_1", type: "a.b", data: { object: {} } })).not.toBeNull();
    expect(parseEvent({ type: "a.b", data: { object: {} } })).toBeNull();
    expect(parseEvent({ id: "evt_1", type: "a.b" })).toBeNull();
    expect(parseEvent("nope")).toBeNull();
  });
});

describe("events: the 90-Day Pass", () => {
  it("gives 90 days for a paid checkout and remembers the customer", async () => {
    const outcome = await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1")));
    expect(outcome).toBe("handled");
    const e = await ent();
    expect(e).toMatchObject({ plan: "pass90", status: "active", stripe_ref: "pi_cs_1" });
    expect(e!.expires_at!.getTime()).toBe(NOW.getTime() + 90 * DAY);
    expect(await store.customerIdForUser(USER)).toBe("cus_1");
    expect(isPaid(await store.getEntitlement(USER), NOW)).toBe(true);
  });

  it("counts a repeated message once, whether it carries the same event id or a new one", async () => {
    const first = event("checkout.session.completed", paidSession("cs_1"));
    await handleStripeEvent(deps, first);
    expect(await handleStripeEvent(deps, first)).toBe("duplicate");
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1"))); // same checkout, new event id
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 90 * DAY);
  });

  it("extends from the current end date when bought again", async () => {
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1")));
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_2")));
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 180 * DAY);
  });

  it("gives nothing for a checkout that was not paid, or is not a pass", async () => {
    expect(await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1", { payment_status: "unpaid" })))).toBe("ignored");
    expect(await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_2", { metadata: { user_id: USER, plan: "something" } })))).toBe("ignored");
    expect(await ent()).toBeUndefined();
  });

  it("accepts a 100%-off checkout (Stripe calls it no_payment_required)", async () => {
    expect(await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1", { payment_status: "no_payment_required" })))).toBe("handled");
    expect((await ent())!.plan).toBe("pass90");
  });

  it("does not trust a session whose two user tags disagree, or that has none", async () => {
    expect(await applyCheckoutSession(deps, paidSession("cs_1", { metadata: { user_id: OTHER, plan: "pass90" } }) as never)).toBe(false);
    expect(await applyCheckoutSession(deps, paidSession("cs_2", { client_reference_id: null, metadata: { plan: "pass90" } }) as never)).toBe(false);
    expect(await applyCheckoutSession(deps, paidSession("cs_3", { client_reference_id: "not-a-uuid", metadata: {} }) as never)).toBe(false);
    expect(store.entitlements.size).toBe(0);
  });

  it("does not throw when the person has since deleted their account", async () => {
    store.users.delete(USER);
    const e = event("checkout.session.completed", paidSession("cs_1"));
    expect(await handleStripeEvent(deps, e)).toBe("ignored");
    expect(await store.hasEvent(e.id)).toBe(true); // recorded, so Stripe is not asked to retry for ever
  });

  it("leaves a group plan alone", async () => {
    store.entitlements.set(USER, { plan: "group", status: "active", expires_at: null, stripe_ref: null });
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1")));
    expect((await ent())!.plan).toBe("group");
  });
});

describe("events: refunds", () => {
  beforeEach(async () => {
    store.customers.set(USER, "cus_1");
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1")));
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_2")));
  });
  const refund = (chargeId: string, extra: Record<string, unknown> = {}) =>
    event("charge.refunded", { id: chargeId, refunded: true, customer: "cus_1", payment_intent: "pi_x", metadata: { plan: "pass90", user_id: USER }, ...extra });

  it("takes back 90 days for one fully refunded purchase, once", async () => {
    await handleStripeEvent(deps, refund("ch_2"));
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 90 * DAY);
    await handleStripeEvent(deps, refund("ch_2")); // new event id, same charge
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 90 * DAY);
  });

  it("ends access when everything has been refunded", async () => {
    await handleStripeEvent(deps, refund("ch_1"));
    await handleStripeEvent(deps, refund("ch_2"));
    const e = await ent();
    expect(e!.status).toBe("refunded");
    expect(isPaid(await store.getEntitlement(USER), NOW)).toBe(false);
  });

  it("ignores a partial refund", async () => {
    expect(await handleStripeEvent(deps, refund("ch_1", { refunded: false }))).toBe("ignored");
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 180 * DAY);
  });

  it("asks Stripe for the payment's own tags when the charge has none", async () => {
    stripe.paymentIntents.set("pi_x", { id: "pi_x", metadata: { plan: "pass90", user_id: USER } });
    await handleStripeEvent(deps, refund("ch_2", { metadata: {} }));
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 90 * DAY);
  });

  it("does not touch the plan for a refunded subscription payment", async () => {
    expect(await handleStripeEvent(deps, refund("ch_9", { metadata: { plan: "monthly", user_id: USER } }))).toBe("ignored");
    expect((await ent())!.expires_at!.getTime()).toBe(NOW.getTime() + 180 * DAY);
  });
});

describe("events: subscriptions", () => {
  it("starts the monthly plan from a completed checkout, with a short grace after the period ends", async () => {
    stripe.subscriptions.set("sub_1", subscription("sub_1", "active") as never);
    const session = { id: "cs_s", mode: "subscription", client_reference_id: USER, customer: "cus_1", subscription: "sub_1", metadata: { user_id: USER, plan: "monthly" } };
    expect(await handleStripeEvent(deps, event("checkout.session.completed", session))).toBe("handled");
    const e = await ent();
    expect(e).toMatchObject({ plan: "monthly", status: "active", stripe_ref: "sub_1" });
    expect(e!.expires_at!.getTime()).toBe(NOW.getTime() + 33 * DAY);
    expect(isPaid(await store.getEntitlement(USER), NOW)).toBe(true);
  });

  it("reads the period end from the new place Stripe keeps it", async () => {
    const end = Math.floor(NOW.getTime() / 1000) + 10 * 86_400;
    stripe.subscriptions.set("sub_1", subscription("sub_1", "active", { current_period_end: undefined, items: { data: [{ current_period_end: end }] } }) as never);
    await handleStripeEvent(deps, event("customer.subscription.created", { id: "sub_1" }));
    expect((await ent())!.expires_at!.getTime()).toBe((end + 3 * 86_400) * 1000);
  });

  it("follows the subscription through a failed payment, a recovery and a cancellation", async () => {
    for (const [status, type] of [["active", "customer.subscription.created"], ["past_due", "invoice.payment_failed"], ["active", "invoice.paid"], ["canceled", "customer.subscription.deleted"]] as const) {
      stripe.subscriptions.set("sub_1", subscription("sub_1", status) as never);
      const object = type.startsWith("invoice") ? { id: "in_1", subscription: "sub_1" } : { id: "sub_1" };
      await handleStripeEvent(deps, event(type, object));
      expect((await ent())!.status).toBe(status);
    }
    expect(isPaid(await store.getEntitlement(USER), NOW)).toBe(false);
  });

  it("copes with a late message: it uses Stripe's current state, not the old message", async () => {
    stripe.subscriptions.set("sub_1", subscription("sub_1", "active") as never);
    await handleStripeEvent(deps, event("customer.subscription.updated", { id: "sub_1", status: "past_due" })); // stale content
    expect((await ent())!.status).toBe("active");
  });

  it("finds the new invoice layout's subscription", async () => {
    stripe.subscriptions.set("sub_1", subscription("sub_1", "active") as never);
    await handleStripeEvent(deps, event("invoice.paid", { id: "in_1", parent: { subscription_details: { subscription: "sub_1" } } }));
    expect((await ent())!.stripe_ref).toBe("sub_1");
  });

  it("finds the person by their Stripe customer when the subscription carries no tag", async () => {
    store.customers.set(USER, "cus_1");
    stripe.subscriptions.set("sub_1", subscription("sub_1", "active", { metadata: {} }) as never);
    await handleStripeEvent(deps, event("customer.subscription.updated", { id: "sub_1" }));
    expect((await ent())!.plan).toBe("monthly");
  });

  it("ignores a subscription it cannot attribute to anyone", async () => {
    stripe.subscriptions.set("sub_x", subscription("sub_x", "active", { metadata: {}, customer: "cus_unknown" }) as never);
    expect(await handleStripeEvent(deps, event("customer.subscription.updated", { id: "sub_x" }))).toBe("ignored");
  });

  it("uses the message's own content if the subscription is already gone at Stripe", async () => {
    await handleStripeEvent(deps, event("customer.subscription.deleted", subscription("sub_gone", "canceled")));
    expect((await ent())!.status).toBe("canceled");
  });

  it("a new subscription is not undone by a late message about an old one", async () => {
    stripe.subscriptions.set("sub_old", subscription("sub_old", "canceled") as never);
    stripe.subscriptions.set("sub_new", subscription("sub_new", "active") as never);
    await handleStripeEvent(deps, event("customer.subscription.created", { id: "sub_new" }));
    await handleStripeEvent(deps, event("customer.subscription.deleted", { id: "sub_old" }));
    expect(await ent()).toMatchObject({ status: "active", stripe_ref: "sub_new" });
  });

  it("a running pass survives a subscription ending", async () => {
    await handleStripeEvent(deps, event("checkout.session.completed", paidSession("cs_1")));
    stripe.subscriptions.set("sub_1", subscription("sub_1", "canceled") as never);
    await handleStripeEvent(deps, event("customer.subscription.deleted", { id: "sub_1" }));
    expect(await ent()).toMatchObject({ plan: "pass90", status: "active" });
  });

  it("records an unknown status as incomplete rather than failing", async () => {
    stripe.subscriptions.set("sub_1", subscription("sub_1", "something_new") as never);
    await handleStripeEvent(deps, event("customer.subscription.updated", { id: "sub_1" }));
    expect((await ent())!.status).toBe("incomplete");
  });
});

describe("events: everything else", () => {
  it("acknowledges event types it does not use", async () => {
    expect(await handleStripeEvent(deps, event("customer.created", { id: "cus_1" }))).toBe("ignored");
  });

  it("does not record an event whose handling failed, so Stripe will retry it", async () => {
    stripe.subscriptions.clear();
    const e = event("invoice.paid", { id: "in_1", subscription: "sub_unknown" });
    await expect(handleStripeEvent(deps, e)).rejects.toThrow(); // the webhook answers 500 and Stripe tries again
    expect(await store.hasEvent(e.id)).toBe(false);
  });
});

describe("deleting an account", () => {
  it("does nothing for someone who never paid", async () => {
    const { removeBilling } = await import("@/lib/stripe/account");
    expect(await removeBilling(deps, USER, true)).toBe("none");
    expect(stripe.deletedCustomers).toEqual([]);
  });

  it("deletes their Stripe customer, which cancels any subscription", async () => {
    const { removeBilling } = await import("@/lib/stripe/account");
    store.customers.set(USER, "cus_1");
    expect(await removeBilling(deps, USER, true)).toBe("removed");
    expect(stripe.deletedCustomers).toEqual(["cus_1"]);
  });

  it("stops the deletion if Stripe cannot be reached, or is not set up while billing exists", async () => {
    const { removeBilling, BillingCleanupError } = await import("@/lib/stripe/account");
    store.customers.set(USER, "cus_1");
    stripe.failDelete = true;
    await expect(removeBilling(deps, USER, true)).rejects.toBeInstanceOf(BillingCleanupError);
    stripe.failDelete = false;
    await expect(removeBilling(deps, USER, false)).rejects.toBeInstanceOf(BillingCleanupError);
    expect(stripe.deletedCustomers).toEqual([]);
  });
});
