"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordSignupOnce } from "@/lib/analytics/funnel";
import { appendUtm, utmFromFormData } from "@/lib/analytics/utm";
import { captchaTokenFrom, turnstileSiteKey } from "@/lib/auth/captcha";
import { enabledOAuthProviders, parseProvider } from "@/lib/auth/providers";
import { emailSchema, otpCodeSchema } from "@/lib/auth/schemas";
import { previewQuickLoginAllowed, quickSignIn } from "@/lib/auth/preview-login";
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

/** Step 1: email a one-time code (and, with Supabase's default template, a link). Creates the account on first use. */
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

  // Private previews only, for the founder's own address: sign straight in with
  // no email (lib/auth/preview-login.ts). Kept outside any try/catch, because
  // redirect() works by throwing.
  if (previewQuickLoginAllowed(email)) {
    const quick = await quickSignIn(email, createAdminClient);
    if (quick.status === "ok") {
      await recordSignupOnce(createAdminClient, quick.user, { utm: utmFromFormData(formData) }); // funnel: first sign-in only
      redirect(next);
    }
    if (quick.status === "failed") {
      return { step: "email", email, error: "Quick sign-in didn't work. Please wait a minute and try again." };
    }
    // "no-token": nothing was tried, so send the normal email below.
  }

  // The bot check (Cloudflare Turnstile), when it is switched on: no token, no email.
  const captchaToken = captchaTokenFrom(formData);
  if (turnstileSiteKey() && !captchaToken) {
    return { step: "email", email, error: "Please finish the check below, then press the button again." };
  }

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
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (error) {
    // Log the reason but never the email address (personal data).
    console.error("signInWithOtp failed", { code: error.code, status: error.status });
    if (error.code === "captcha_failed") {
      return { step: "email", email, error: "The check didn't pass. Please try it again." };
    }
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

/**
 * "Continue with Google" / "Continue with Apple". Supabase starts the sign-in and, when the
 * person comes back, /auth/confirm swaps the one-time code for a session, exactly as it does
 * for an email link. Only providers listed in NEXT_PUBLIC_SIGNIN_PROVIDERS are accepted.
 */
export async function signInWithProvider(formData: FormData) {
  const provider = parseProvider(formData.get("provider"));
  const next = safeNextPath(formData.get("next"));
  if (!provider || !enabledOAuthProviders().includes(provider)) redirect("/login?error=provider_unavailable");

  const origin = await requestOrigin();
  const redirectTo = new URL(`${origin}/auth/confirm`);
  redirectTo.searchParams.set("next", next);
  appendUtm(redirectTo.searchParams, utmFromFormData(formData)); // campaign tags for the signup event

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
      // Google: always let the person pick the account, so a student with a university and a
      // personal account does not get signed in with the wrong one.
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });
  if (error || !data.url) {
    // The reason is logged, never the person's details.
    console.error("signInWithOAuth failed", { provider, code: error?.code, status: error?.status });
    redirect("/login?error=provider_failed");
  }
  redirect(data.url);
}

/** Step 2: sign in with the code from the email. Works on any device, unlike the link. */
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
