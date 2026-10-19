import { StripeError, type StripeApi, type StripeCheckoutSession, type StripePaymentIntent, type StripeSubscription } from "@/lib/stripe/client";

/** A stand-in for Stripe's API that returns whatever the test has put in it. */
export class FakeStripe implements StripeApi {
  subscriptions = new Map<string, StripeSubscription>();
  sessions = new Map<string, StripeCheckoutSession>();
  paymentIntents = new Map<string, StripePaymentIntent>();
  deletedCustomers: string[] = [];
  portalCalls: { customerId: string; returnUrl: string }[] = [];
  created: Record<string, unknown>[] = [];
  failDelete = false;

  async createCheckoutSession(params: Record<string, unknown>) {
    this.created.push(params);
    return { id: "cs_new", url: "https://checkout.stripe.test/c/cs_new" };
  }
  async retrieveCheckoutSession(id: string) {
    const s = this.sessions.get(id);
    if (!s) throw new StripeError("no such session", 404, "resource_missing");
    return s;
  }
  async retrieveSubscription(id: string) {
    const s = this.subscriptions.get(id);
    if (!s) throw new StripeError("no such subscription", 404, "resource_missing");
    return s;
  }
  async retrievePaymentIntent(id: string) {
    const p = this.paymentIntents.get(id);
    if (!p) throw new StripeError("no such payment intent", 404, "resource_missing");
    return p;
  }
  async createPortalSession(customerId: string, returnUrl: string) {
    this.portalCalls.push({ customerId, returnUrl });
    return { url: "https://billing.stripe.test/p/session" };
  }
  async deleteCustomer(customerId: string) {
    if (this.failDelete) throw new StripeError("boom", 500);
    this.deletedCustomers.push(customerId);
  }
}
