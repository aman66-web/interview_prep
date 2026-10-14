"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteState = { error?: string };

/**
 * Permanently deletes the signed-in user. Deleting the login also deletes
 * every row that belongs to them (the database cascades; see the migration).
 * P4 must also cancel their Stripe subscription before this runs.
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

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
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
