import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCheckoutParams, hasAcceptedTerms, TERMS_CONSENT } from "@/lib/stripe/checkout";

// H1: before checkout the buyer ticks "I agree to the terms and conditions." (the 14-day
// right to cancel and starting straight away are written in the terms, founder 27 Oct 2026;
// UK Consumer Contracts Regulations 2013). The real route file runs here with the
// login, Stripe and the admin client replaced by fakes.

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "student@example.test" };
const getUser = vi.fn();
const createCheckoutSession = vi.fn();
const events: { name: string; path: string }[] = [];

vi.mock("@/lib/auth/session", () => ({ getUser: () => getUser() }));
vi.mock("@/lib/stripe/store-supabase", () => ({
  createPaymentsStore: () => ({ getEntitlement: async () => null, customerIdForUser: async () => null }),
}));
vi.mock("@/lib/stripe/client", async (original) => ({
  ...(await original<typeof import("@/lib/stripe/client")>()),
  isStripeConfigured: () => true,
  createStripeApi: () => ({ createCheckoutSession }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      let row: { name: string; path: string } | null = null;
      const filters: [string, unknown][] = [];
      const chain = {
        select: () => chain,
        insert: (r: { name: string; path: string }) => ((row = r), chain),
        eq: (col: string, value: unknown) => (filters.push([col, value]), chain),
        gte: () => chain,
        limit: () => chain,
        then(resolve: (v: unknown) => unknown) {
          if (row) events.push(row);
          const found = events.filter((e) => filters.every(([col, value]) => col === "user_id" || e[col as keyof typeof e] === value));
          return Promise.resolve(row ? { data: null, error: null } : { data: found.slice(0, 1), error: null }).then(resolve);
        },
      };
      return chain;
    },
  }),
}));

const { POST } = await import("@/app/api/stripe/checkout/route");

const SITE = "http://localhost:3077";
function post(fields: Record<string, string>) {
  return new NextRequest(`${SITE}/api/stripe/checkout`, {
    method: "POST",
    headers: { origin: SITE, host: "localhost:3077", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}
const location = (r: Response) => r.headers.get("location") ?? "";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_for_tests");
  getUser.mockReset();
  getUser.mockResolvedValue(USER);
  createCheckoutSession.mockReset();
  createCheckoutSession.mockResolvedValue({ id: "cs_test_123456", url: "https://checkout.stripe.test/pay/cs_test_123456" });
  events.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("the terms-and-conditions tick", () => {
  it("uses the agreed wording, with a version", () => {
    expect(TERMS_CONSENT.text).toBe("I agree to the terms and conditions.");
    expect(TERMS_CONSENT.text).toContain(TERMS_CONSENT.linkText);
    expect(TERMS_CONSENT.version).toBe("terms-v1");
  });

  it("counts only a ticked box carrying the current version", () => {
    const form = (value?: string) => {
      const f = new FormData();
      if (value !== undefined) f.set(TERMS_CONSENT.field, value);
      return f;
    };
    expect(hasAcceptedTerms(form(TERMS_CONSENT.version))).toBe(true);
    for (const value of [undefined, "", "on", "yes", "true", "terms-v0"]) expect(hasAcceptedTerms(form(value))).toBe(false);
    expect(hasAcceptedTerms(null)).toBe(false);
  });

  it("is stored in the Checkout Session's metadata only", () => {
    const p = buildCheckoutParams({
      plan: "monthly",
      userId: USER.id,
      email: USER.email,
      customerId: null,
      origin: SITE,
      priceIds: {},
      taxEnabled: false,
      termsAccepted: TERMS_CONSENT.version,
    });
    expect(p.metadata).toEqual({ user_id: USER.id, plan: "monthly", terms_accepted: "terms-v1" });
    expect(p.subscription_data).toEqual({ metadata: { user_id: USER.id, plan: "monthly" } });
  });
});

describe("POST /api/stripe/checkout", () => {
  it("refuses a checkout without the tick and sends the buyer back with a notice", async () => {
    const attempts: Record<string, string>[] = [{ plan: "pass90" }, { plan: "pass90", terms_accepted: "on" }, { plan: "monthly", terms_accepted: "" }];
    for (const fields of attempts) {
      const r = await POST(post(fields));
      expect(r.status).toBe(303);
      expect(location(r)).toBe(`${SITE}/pricing?notice=consent`);
    }
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("starts Stripe Checkout when ticked, recording the wording version", async () => {
    const r = await POST(post({ plan: "pass90", terms_accepted: TERMS_CONSENT.version }));
    expect(r.status).toBe(303);
    expect(location(r)).toBe("https://checkout.stripe.test/pay/cs_test_123456");
    expect(createCheckoutSession).toHaveBeenCalledOnce();
    const params = createCheckoutSession.mock.calls[0][0];
    expect(params.metadata).toEqual({ user_id: USER.id, plan: "pass90", terms_accepted: "terms-v1" });
    expect(params.payment_intent_data.metadata).toEqual({ user_id: USER.id, plan: "pass90" });
  });

  it("still sends a signed-out visitor to sign in, and refuses an unknown plan first", async () => {
    getUser.mockResolvedValue(null);
    expect(location(await POST(post({ plan: "pass90", terms_accepted: TERMS_CONSENT.version })))).toBe(`${SITE}/login?next=%2Fpricing`);
    getUser.mockResolvedValue(USER);
    expect(location(await POST(post({ plan: "lifetime" })))).toBe(`${SITE}/pricing?notice=invalid`);
  });

  it("records checkout_started once per plan per day, however often the form is posted", async () => {
    for (let i = 0; i < 5; i++) await POST(post({ plan: "pass90", terms_accepted: TERMS_CONSENT.version }));
    await POST(post({ plan: "monthly", terms_accepted: TERMS_CONSENT.version }));
    expect(createCheckoutSession).toHaveBeenCalledTimes(6);
    expect(events.map((e) => [e.name, e.path])).toEqual([
      ["checkout_started", "/pricing?plan=pass90"],
      ["checkout_started", "/pricing?plan=monthly"],
    ]);
  });
});
