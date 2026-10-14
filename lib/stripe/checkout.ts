import { siteConfig } from "@/site.config";
import type { FormValue } from "./form";
import { PASS_DAYS, PLAN_INFO, type PlanId } from "./plans";

// Builds the request that starts a Stripe Checkout page. Pure, so it is easy to test.

export type CheckoutInput = {
  plan: PlanId;
  userId: string;
  email: string | undefined;
  /** The user's Stripe customer id if they have bought before. */
  customerId: string | null;
  /** The site's own address, for the pages Stripe sends the person back to. */
  origin: string;
  /** Stripe price ids from the environment (optional). */
  priceIds: { monthly?: string; pass90?: string };
  taxEnabled: boolean;
};

export type CheckoutParams = {
  mode: "subscription" | "payment";
  client_reference_id: string;
  line_items: { [key: string]: FormValue }[];
  success_url: string;
  cancel_url: string;
  [field: string]: FormValue;
};

export function buildCheckoutParams(input: CheckoutInput): CheckoutParams {
  const info = PLAN_INFO[input.plan];
  const metadata = { user_id: input.userId, plan: input.plan };
  const priceId = input.priceIds[input.plan]?.trim();

  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: siteConfig.prices.currency.toLowerCase(),
          unit_amount: Math.round(info.amountUsd * 100),
          product_data: { name: `${siteConfig.brandName} ${info.name}` },
          ...(info.mode === "subscription" ? { recurring: { interval: "month" } } : {}),
        },
      };

  return {
    mode: info.mode,
    client_reference_id: input.userId,
    line_items: [lineItem],
    metadata,
    allow_promotion_codes: true,
    success_url: `${input.origin}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/pricing?notice=cancelled`,
    ...(info.mode === "subscription"
      ? { subscription_data: { metadata } }
      : {
          payment_intent_data: { metadata, description: `${siteConfig.brandName} ${info.name} (${PASS_DAYS} days)` },
          ...(input.customerId ? {} : { customer_creation: "always" }),
        }),
    ...(input.customerId ? { customer: input.customerId } : input.email ? { customer_email: input.email } : {}),
    ...(input.taxEnabled
      ? { automatic_tax: { enabled: true }, ...(input.customerId ? { customer_update: { address: "auto" } } : {}) }
      : {}),
  };
}
