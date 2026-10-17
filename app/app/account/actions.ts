"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createStripeApi, isStripeConfigured } from "@/lib/stripe/client";
import { BillingCleanupError, removeBilling } from "@/lib/stripe/account";
import { createPaymentsStore } from "@/lib/stripe/store-supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteState = { error?: string };

/**
 * Permanently deletes the signed-in user. Deleting the login also deletes
 * every row that belongs to them (the database cascades; see the migration).
 * Their Stripe customer is deleted first, which also cancels any subscription, so nobody
 * keeps being charged after their account is gone. If that fails, nothing is deleted.
 */
export async function deleteAccount(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const user = await requireUser();

  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) {
    return { error: "That doesn't match your email address, so nothing was deleted." };
  }

  const admin = createAdminClient();
  try {
    await removeBilling({ store: createPaymentsStore(admin), stripe: createStripeApi() }, user.id, isStripeConfigured());
  } catch (error) {
    console.error("deleteAccount: could not close billing", error instanceof BillingCleanupError ? "billing" : "unexpected error");
    return {
      error: "We couldn't close your billing record, so nothing was deleted. Please try again in a minute, or contact support.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("deleteUser failed", { code: error.code, status: error.status });
    return {
      error: "We couldn't delete your account. Please try again, or contact support.",
    };
  }

  // Clear the login cookies. The user no longer exists, so a failure here is expected.
  try {
    await (await createClient()).auth.signOut();
  } catch {
    // ignore
  }
  redirect("/account-deleted");
}
