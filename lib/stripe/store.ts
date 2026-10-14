import type { Entitlement } from "@/lib/access";

// Everything the payment code reads from and writes to the database goes through this
// interface, so it can be tested without a database. The real one (store-supabase.ts) calls
// the atomic database functions from supabase/migrations/20261014170000_payments.sql.

/** The person this payment belongs to has deleted their account, so there is nothing to update. */
export class UserGoneError extends Error {}

export interface PaymentsStore {
  hasEvent(eventId: string): Promise<boolean>;
  recordEvent(eventId: string, type: string): Promise<void>;
  userIdForCustomer(customerId: string): Promise<string | null>;
  customerIdForUser(userId: string): Promise<string | null>;
  saveCustomer(userId: string, customerId: string): Promise<void>;
  /** Adds days for one paid checkout, once. False if this checkout was already counted. */
  grantPass(args: { userId: string; checkoutSessionId: string; paymentRef: string; days: number }): Promise<boolean>;
  /** Takes days back for one fully refunded charge, once. */
  revokePass(args: { userId: string; chargeId: string; days: number }): Promise<boolean>;
  setSubscriptionState(args: { userId: string; subscriptionId: string; status: string; expiresAt: Date | null }): Promise<void>;
  getEntitlement(userId: string): Promise<Entitlement>;
}
