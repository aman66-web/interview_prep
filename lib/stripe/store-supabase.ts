import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entitlement } from "@/lib/access";
import { UserGoneError, type PaymentsStore } from "./store";

// The real payments store, using the admin (secret key) client. Server only. Callers must
// already have checked who is asking (a signed-in user, or a signed Stripe webhook).

const FOREIGN_KEY_VIOLATION = "23503";

function fail(what: string, error: { message: string; code?: string }): never {
  if (error.code === FOREIGN_KEY_VIOLATION) throw new UserGoneError(what);
  throw new Error(`Database error while ${what}: ${error.message}`);
}

export function createPaymentsStore(db: SupabaseClient): PaymentsStore {
  return {
    async hasEvent(eventId) {
      const { data, error } = await db.from("stripe_events").select("id").eq("id", eventId).maybeSingle();
      if (error) fail("checking a Stripe event", error);
      return data !== null;
    },

    async recordEvent(eventId, type) {
      const { error } = await db.from("stripe_events").upsert({ id: eventId, type }, { onConflict: "id", ignoreDuplicates: true });
      if (error) fail("recording a Stripe event", error);
    },

    async userIdForCustomer(customerId) {
      const { data, error } = await db.from("stripe_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (error) fail("finding a customer", error);
      return (data as { user_id: string } | null)?.user_id ?? null;
    },

    async customerIdForUser(userId) {
      const { data, error } = await db.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
      if (error) fail("finding a customer", error);
      return (data as { stripe_customer_id: string } | null)?.stripe_customer_id ?? null;
    },

    async saveCustomer(userId, customerId) {
      const { error } = await db
        .from("stripe_customers")
        .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: "user_id", ignoreDuplicates: true });
      if (error) fail("saving a customer", error);
    },

    async grantPass({ userId, checkoutSessionId, paymentRef, days }) {
      const { data, error } = await db.rpc("grant_pass_purchase", {
        p_user_id: userId,
        p_ref: checkoutSessionId,
        p_payment_ref: paymentRef,
        p_days: days,
      });
      if (error) fail("adding a pass", error);
      return data === true;
    },

    async revokePass({ userId, chargeId, days }) {
      const { data, error } = await db.rpc("revoke_pass_purchase", { p_user_id: userId, p_ref: chargeId, p_days: days });
      if (error) fail("taking back a pass", error);
      return data === true;
    },

    async setSubscriptionState({ userId, subscriptionId, status, expiresAt }) {
      const { error } = await db.rpc("set_subscription_state", {
        p_user_id: userId,
        p_subscription_id: subscriptionId,
        p_status: status,
        p_expires: expiresAt ? expiresAt.toISOString() : null,
      });
      if (error) fail("updating a subscription", error);
    },

    async getEntitlement(userId) {
      const { data, error } = await db.from("entitlements").select("plan, status, expires_at").eq("user_id", userId).maybeSingle();
      if (error) fail("reading the plan", error);
      return (data as Entitlement) ?? null;
    },
  };
}
