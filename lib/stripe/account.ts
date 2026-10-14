import type { StripeApi } from "./client";
import type { PaymentsStore } from "./store";

/** Billing cannot be closed because Stripe is not reachable or not set up, so the account must not be deleted yet. */
export class BillingCleanupError extends Error {}

/**
 * Part of deleting an account (UK GDPR, rule 2.7): delete the person's Stripe customer, which also
 * cancels any subscription so nobody keeps being charged. Stripe keeps the payment records it is
 * legally required to keep; our own rows go when the login is deleted.
 * If the person has billing and it cannot be removed, this throws and nothing else should be deleted.
 */
export async function removeBilling(
  deps: { store: PaymentsStore; stripe: StripeApi },
  userId: string,
  stripeConfigured: boolean,
): Promise<"none" | "removed"> {
  const customerId = await deps.store.customerIdForUser(userId);
  if (!customerId) return "none";
  if (!stripeConfigured) throw new BillingCleanupError("Stripe is not configured.");
  try {
    await deps.stripe.deleteCustomer(customerId);
  } catch (error) {
    throw new BillingCleanupError(error instanceof Error ? error.message : "Stripe failed.");
  }
  return "removed";
}
