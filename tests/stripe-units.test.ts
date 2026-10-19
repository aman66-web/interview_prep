import { describe, expect, it } from "vitest";
import { isPaid } from "@/lib/access";
import { buildCheckoutParams } from "@/lib/stripe/checkout";
import { encodeForm } from "@/lib/stripe/form";
import { checkPurchase } from "@/lib/stripe/plans";
import { signPayload, verifySignature } from "@/lib/stripe/signature";

describe("form encoding", () => {
  it("writes nested objects and lists the way Stripe expects", () => {
    expect(
      decodeURIComponent(
        encodeForm({
          mode: "payment",
          line_items: [{ price_data: { unit_amount: 9900, product_data: { name: "A & B" } }, quantity: 1 }],
          automatic_tax: { enabled: true },
          skipped: undefined,
          nothing: null,
        }),
      ),
    ).toBe(
      "mode=payment&line_items[0][price_data][unit_amount]=9900&line_items[0][price_data][product_data][name]=A & B&line_items[0][quantity]=1&automatic_tax[enabled]=true",
    );
  });

  it("escapes characters that would break out of a value", () => {
    const body = encodeForm({ email: "a+b@example.com&mode=subscription" });
    expect(body).toBe("email=a%2Bb%40example.com%26mode%3Dsubscription");
  });

  it("keeps the {CHECKOUT_SESSION_ID} placeholder readable to Stripe", () => {
    const params = new URLSearchParams(encodeForm({ success_url: "https://x.test/return?session_id={CHECKOUT_SESSION_ID}" }));
    expect(params.get("success_url")).toBe("https://x.test/return?session_id={CHECKOUT_SESSION_ID}");
  });
});

describe("webhook signature", () => {
  const secret = "whsec_test_secret_value";
  const body = JSON.stringify({ id: "evt_1", type: "x", data: { object: {} } });
  const now = 1_800_000_000;

  it("accepts a correctly signed message", () => {
    expect(verifySignature(body, signPayload(body, secret, now), secret, now)).toEqual({ ok: true });
  });

  it("refuses a message signed with another secret, or a changed body", () => {
    expect(verifySignature(body, signPayload(body, "whsec_other", now), secret, now)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifySignature(body + " ", signPayload(body, secret, now), secret, now)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("refuses a message with no signature, a broken header or an old timestamp", () => {
    expect(verifySignature(body, null, secret, now)).toEqual({ ok: false, reason: "missing" });
    expect(verifySignature(body, "garbage", secret, now)).toEqual({ ok: false, reason: "malformed" });
    expect(verifySignature(body, "t=abc,v1=zz", secret, now)).toEqual({ ok: false, reason: "malformed" });
    expect(verifySignature(body, signPayload(body, secret, now - 301), secret, now)).toEqual({ ok: false, reason: "too_old" });
    expect(verifySignature(body, signPayload(body, secret, now + 301), secret, now)).toEqual({ ok: false, reason: "too_old" });
  });

  it("accepts when any one of several signatures matches (Stripe sends two while a secret is being rolled)", () => {
    const good = signPayload(body, secret, now).split(",v1=")[1];
    const header = `t=${now},v1=${"0".repeat(64)},v1=${good}`;
    expect(verifySignature(body, header, secret, now)).toEqual({ ok: true });
  });

  it("an empty secret never verifies by accident", () => {
    expect(verifySignature(body, signPayload(body, "", now), "real_secret", now).ok).toBe(false);
  });
});

describe("what can be bought", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  const future = new Date("2026-12-01T12:00:00Z").toISOString();
  const past = new Date("2026-10-01T12:00:00Z").toISOString();

  it("lets a free user buy either plan", () => {
    expect(checkPurchase("monthly", { plan: "free", status: "active", expires_at: null }, now)).toEqual({ ok: true });
    expect(checkPurchase("pass90", null, now)).toEqual({ ok: true });
  });

  it("stops a second subscription, and a pass on top of a subscription", () => {
    const monthly = { plan: "monthly" as const, status: "active", expires_at: future };
    expect(checkPurchase("monthly", monthly, now)).toEqual({ ok: false, reason: "already_monthly" });
    expect(checkPurchase("pass90", monthly, now)).toEqual({ ok: false, reason: "already_monthly" });
  });

  it("lets a pass be extended but not turned into a subscription while it runs", () => {
    const pass = { plan: "pass90" as const, status: "active", expires_at: future };
    expect(checkPurchase("pass90", pass, now)).toEqual({ ok: true });
    expect(checkPurchase("monthly", pass, now)).toEqual({ ok: false, reason: "pass_running" });
  });

  it("treats an ended or cancelled plan like no plan", () => {
    expect(checkPurchase("monthly", { plan: "pass90", status: "active", expires_at: past }, now)).toEqual({ ok: true });
    expect(checkPurchase("pass90", { plan: "monthly", status: "canceled", expires_at: future }, now)).toEqual({ ok: true });
  });

  it("never sells anything to a group plan", () => {
    expect(checkPurchase("pass90", { plan: "group", status: "active", expires_at: null }, now)).toEqual({ ok: false, reason: "group" });
  });

  it("agrees with hasAccess about who is paid", () => {
    expect(isPaid({ plan: "monthly", status: "past_due", expires_at: future }, now)).toBe(false);
  });
});

describe("the checkout request", () => {
  const base = {
    userId: "11111111-2222-3333-4444-555555555555",
    email: "student@example.test",
    customerId: null,
    origin: "https://app.example.test",
    priceIds: {},
    taxEnabled: false,
  };

  it("builds a monthly subscription with the price created inline", () => {
    const p = buildCheckoutParams({ ...base, plan: "monthly" });
    expect(p.mode).toBe("subscription");
    expect(p.client_reference_id).toBe(base.userId);
    expect(p.line_items[0]).toMatchObject({ quantity: 1, price_data: { currency: "usd", unit_amount: 3900, recurring: { interval: "month" } } });
    expect(p.subscription_data).toEqual({ metadata: { user_id: base.userId, plan: "monthly" } });
    expect(p.customer_email).toBe("student@example.test");
    expect(p.success_url).toBe("https://app.example.test/api/stripe/return?session_id={CHECKOUT_SESSION_ID}");
    expect(p.cancel_url).toBe("https://app.example.test/pricing?notice=cancelled");
    expect(p).not.toHaveProperty("automatic_tax");
  });

  it("builds a one-time pass that makes a customer and tags the payment", () => {
    const p = buildCheckoutParams({ ...base, plan: "pass90" });
    expect(p.mode).toBe("payment");
    expect(p.line_items[0]).toMatchObject({ price_data: { unit_amount: 9900 } });
    expect(p.line_items[0]).not.toHaveProperty("price_data.recurring");
    expect(p).toMatchObject({ customer_creation: "always", payment_intent_data: { metadata: { user_id: base.userId, plan: "pass90" } } });
  });

  it("uses a Stripe price id when one is configured, and a known customer instead of an email", () => {
    const p = buildCheckoutParams({ ...base, plan: "pass90", customerId: "cus_123", priceIds: { pass90: " price_abc " } });
    expect(p.line_items[0]).toEqual({ price: "price_abc", quantity: 1 });
    expect(p).toMatchObject({ customer: "cus_123" });
    expect(p).not.toHaveProperty("customer_email");
    expect(p).not.toHaveProperty("customer_creation");
  });

  it("switches on Stripe Tax only when the flag is on", () => {
    expect(buildCheckoutParams({ ...base, plan: "monthly", taxEnabled: true })).toMatchObject({ automatic_tax: { enabled: true } });
  });
});
