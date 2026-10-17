import type { SupabaseClient } from "@supabase/supabase-js";
import { createStripeApi } from "./client";
import type { PaymentsDeps } from "./events";
import { createPaymentsStore } from "./store-supabase";

// Wires the payment code to the real database and the real Stripe. The caller passes in the
// admin client, so only server actions and route handlers (the only places allowed to
// create one) can build this.

export function createPaymentsDeps(admin: SupabaseClient): PaymentsDeps {
  return { store: createPaymentsStore(admin), stripe: createStripeApi() };
}
