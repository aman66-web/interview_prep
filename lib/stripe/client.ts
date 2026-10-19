import { encodeForm } from "./form";

// The ONLY file that talks to Stripe (rule 2.8's twin for money; tests/repo-rules.test.ts
// checks nothing else mentions Stripe's address). It uses Stripe's REST API directly,
// so there is no extra package to keep up to date. STRIPE_SECRET_KEY stays on the
// server (rule 2.5) and is never logged. Error messages carry Stripe's status and
// error code only, never request bodies (they can hold an email address).

export class StripeConfigError extends Error {}

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Tests point this at a fake Stripe. It is ignored on the real production site. */
function apiBase(): string {
  const override = process.env.STRIPE_API_BASE?.trim();
  if (override && process.env.VERCEL_ENV !== "production") return override.replace(/\/$/, "");
  return "https://api.stripe.com";
}

type Params = Parameters<typeof encodeForm>[0];

async function request<T>(method: "GET" | "POST" | "DELETE", path: string, params?: Params): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new StripeConfigError("STRIPE_SECRET_KEY is not set.");

  const query = method === "GET" && params ? `?${encodeForm(params)}` : "";
  const response = await fetch(`${apiBase()}/v1${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" && params ? encodeForm(params) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // not JSON: handled below
  }

  if (!response.ok) {
    const error = (json as { error?: { code?: string; type?: string } } | null)?.error;
    throw new StripeError(`Stripe answered ${response.status}${error?.code ? ` (${error.code})` : ""}.`, response.status, error?.code);
  }
  return json as T;
}

// --- The few Stripe objects we read. Only the fields we use are listed. ---

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  mode?: "payment" | "subscription" | "setup";
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  client_reference_id?: string | null;
  customer?: string | null;
  subscription?: string | null;
  payment_intent?: string | null;
  metadata?: Record<string, string> | null;
};

export type StripeSubscription = {
  id: string;
  status: string;
  customer?: string | null;
  metadata?: Record<string, string> | null;
  current_period_end?: number | null;
  items?: { data?: { current_period_end?: number | null }[] } | null;
};

export type StripePaymentIntent = { id: string; metadata?: Record<string, string> | null };

/** What the payment code needs from Stripe. Tests swap in a fake. */
export interface StripeApi {
  createCheckoutSession(params: Params): Promise<StripeCheckoutSession>;
  retrieveCheckoutSession(id: string): Promise<StripeCheckoutSession>;
  retrieveSubscription(id: string): Promise<StripeSubscription>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntent>;
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
  /** Deletes the customer, which also cancels their subscriptions. Already gone counts as done. */
  deleteCustomer(customerId: string): Promise<void>;
}

export function createStripeApi(): StripeApi {
  return {
    createCheckoutSession: (params) => request<StripeCheckoutSession>("POST", "/checkout/sessions", params),
    retrieveCheckoutSession: (id) => request<StripeCheckoutSession>("GET", `/checkout/sessions/${encodeURIComponent(id)}`),
    retrieveSubscription: (id) => request<StripeSubscription>("GET", `/subscriptions/${encodeURIComponent(id)}`),
    retrievePaymentIntent: (id) => request<StripePaymentIntent>("GET", `/payment_intents/${encodeURIComponent(id)}`),
    createPortalSession: (customerId, returnUrl) =>
      request<{ url: string }>("POST", "/billing_portal/sessions", { customer: customerId, return_url: returnUrl }),
    async deleteCustomer(customerId) {
      try {
        await request("DELETE", `/customers/${encodeURIComponent(customerId)}`);
      } catch (error) {
        if (error instanceof StripeError && error.status === 404) return;
        throw error;
      }
    },
  };
}
