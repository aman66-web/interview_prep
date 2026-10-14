"use server";

import { redirect } from "next/navigation";
import { parseSignInOtpType } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function confirmSignIn(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = parseSignInOtpType(formData.get("type"));
  const next = safeNextPath(formData.get("next"));

  if (typeof tokenHash !== "string" || tokenHash === "" || !type) {
    redirect("/login?error=link_invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) redirect("/login?error=link_invalid");

  redirect(next);
}
