import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCheckoutParams, CANCEL_WAIVER, hasCancelWaiver } from "@/lib/stripe/checkout";

// H1: before checkout the buyer ticks "I want access to start straight away ..."
// (UK Consumer Contracts Regulations 2013). The real route file runs here with the
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

describe("the 'start straight away' acknowledgement", () => {
  it("uses the agreed wording, with a version", () => {
    expect(CANCEL_WAIVER.text).toBe(
      "I want access to start straight away. I understand that I lose my 14-day right to cancel once I start using my plan.",
    );
    expect(CANCEL_WAIVER.version).toBe("cancel-waiver-v1");
  });

  it("counts only a ticked box carrying the current version", () => {
    const form = (value?: string) => {
      const f = new FormData();
      if (value !== undefined) f.set(CANCEL_WAIVER.field, value);
      return f;
    };
    expect(hasCancelWaiver(form(CANCEL_WAIVER.version))).toBe(true);
    for (const value of [undefined, "", "on", "yes", "true", "cancel-waiver-v0"]) expect(hasCancelWaiver(form(value))).toBe(false);
    expect(hasCancelWaiver(null)).toBe(false);
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
      cancelWaiver: CANCEL_WAIVER.version,
    });
    expect(p.metadata).toEqual({ user_id: USER.id, plan: "monthly", cancel_waiver: "cancel-waiver-v1" });
    expect(p.subscription_data).toEqual({ metadata: { user_id: USER.id, plan: "monthly" } });
  });
});

describe("POST /api/stripe/checkout", () => {
  it("refuses a checkout without the tick and sends the buyer back with a notice", async () => {
    const attempts: Record<string, string>[] = [{ plan: "pass90" }, { plan: "pass90", cancel_waiver: "on" }, { plan: "monthly", cancel_waiver: "" }];
    for (const fields of attempts) {
      const r = await POST(post(fields));
      expect(r.status).toBe(303);
      expect(location(r)).toBe(`${SITE}/pricing?notice=consent`);
    }
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("starts Stripe Checkout when ticked, recording the wording version", async () => {
    const r = await POST(post({ plan: "pass90", cancel_waiver: CANCEL_WAIVER.version }));
    expect(r.status).toBe(303);
    expect(location(r)).toBe("https://checkout.stripe.test/pay/cs_test_123456");
    expect(createCheckoutSession).toHaveBeenCalledOnce();
    const params = createCheckoutSession.mock.calls[0][0];
    expect(params.metadata).toEqual({ user_id: USER.id, plan: "pass90", cancel_waiver: "cancel-waiver-v1" });
    expect(params.payment_intent_data.metadata).toEqual({ user_id: USER.id, plan: "pass90" });
  });

  it("still sends a signed-out visitor to sign in, and refuses an unknown plan first", async () => {
    getUser.mockResolvedValue(null);
    expect(location(await POST(post({ plan: "pass90", cancel_waiver: CANCEL_WAIVER.version })))).toBe(`${SITE}/login?next=%2Fpricing`);
    getUser.mockResolvedValue(USER);
    expect(location(await POST(post({ plan: "lifetime" })))).toBe(`${SITE}/pricing?notice=invalid`);
  });

  it("records checkout_started once per plan per day, however often the form is posted", async () => {
    for (let i = 0; i < 5; i++) await POST(post({ plan: "pass90", cancel_waiver: CANCEL_WAIVER.version }));
    await POST(post({ plan: "monthly", cancel_waiver: CANCEL_WAIVER.version }));
    expect(createCheckoutSession).toHaveBeenCalledTimes(6);
    expect(events.map((e) => [e.name, e.path])).toEqual([
      ["checkout_started", "/pricing?plan=pass90"],
      ["checkout_started", "/pricing?plan=monthly"],
    ]);
  });
});
