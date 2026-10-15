"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordSignupOnce } from "@/lib/analytics/funnel";
import { appendUtm, utmFromFormData } from "@/lib/analytics/utm";
import { emailSchema, otpCodeSchema } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  error?: string;
};

// The address this request came in on, so sign-in links return to the same
// site (production, a Vercel preview, or localhost). Supabase only honours
// addresses on its Redirect URLs allow-list, so a spoofed host gains nothing.
async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Step 1: email a one-time link and code. Creates the account on first use. */
export async function requestSignInEmail(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { step: "email", error: "Enter a valid email address." };
  }
  const email = parsed.data;
  const next = safeNextPath(formData.get("next"));
  const origin = await requestOrigin();

  // The link carries the visit's campaign tags (no personal data) so the signup
  // event can be attributed when the link is opened (SPEC section 10).
  const redirectTo = new URL(`${origin}/auth/confirm`);
  redirectTo.searchParams.set("next", next);
  appendUtm(redirectTo.searchParams, utmFromFormData(formData));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Log the reason but never the email address (personal data).
    console.error("signInWithOtp failed", { code: error.code, status: error.status });
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        step: "email",
        email,
        error: "Too many sign-in emails were requested. Please wait a minute and try again.",
      };
    }
    return {
      step: "email",
      email,
      error: "We couldn't send the email. Please check the address and try again.",
    };
  }

  return { step: "code", email };
}

/** Step 2 (alternative to the link): sign in with the code from the email. */
export async function verifySignInCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const token = otpCodeSchema.safeParse(formData.get("code"));
  if (!email.success) return { step: "email", error: "Enter your email address again." };
  if (!token.success) {
    return { step: "code", email: email.data, error: "Enter the numeric code from the email." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });
  if (error || !data.user) {
    return {
      step: "code",
      email: email.data,
      error:
        "That code is wrong or has expired. Check the newest email, or go back to request a new one.",
    };
  }

  await recordSignupOnce(createAdminClient, data.user, { utm: utmFromFormData(formData) }); // funnel: first sign-in only

  redirect(safeNextPath(formData.get("next")));
}
