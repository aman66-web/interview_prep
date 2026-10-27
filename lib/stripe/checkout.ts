import { siteConfig } from "@/site.config";
import type { FormValue } from "./form";
import { PASS_DAYS, PLAN_INFO, type PlanId } from "./plans";

// Builds the request that starts a Stripe Checkout page. Pure, so it is easy to test.

/**
 * The terms-and-conditions tick every buyer makes before checkout (founder, 27 Oct 2026:
 * the box only asks for the terms; the "start straight away" request and the loss of the
 * 14-day right to cancel are written in the terms themselves, `content/pages/terms.json`
 * and `refunds.json`). The box sits above each Buy button on /pricing; /api/stripe/checkout
 * refuses a checkout without it and records `version` in the Checkout Session's metadata.
 * Give the wording a new version whenever it changes.
 */
export const TERMS_CONSENT = {
  field: "terms_accepted",
  version: "terms-v1",
  text: "I agree to the terms and conditions.",
  /** The part of `text` that links to the terms. */
  linkText: "terms and conditions",
  /** Shown on /pricing?notice=consent when the box was not ticked. */
  notice: "Please tick the box above the button to agree to the terms and conditions. Nothing was charged.",
} as const;

/** True only when the form carries the current version of the tick (a ticked box). */
export function hasAcceptedTerms(form: Pick<FormData, "get"> | null | undefined): boolean {
  return form?.get(TERMS_CONSENT.field) === TERMS_CONSENT.version;
}

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
  /** The version of the terms tick the buyer made, kept in the session's metadata. */
  termsAccepted?: string;
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
    // The session keeps a record of the tick; the subscription and payment keep only who and what.
    metadata: input.termsAccepted ? { ...metadata, terms_accepted: input.termsAccepted } : metadata,
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
