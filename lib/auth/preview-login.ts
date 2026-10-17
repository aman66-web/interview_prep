import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/analytics/admin-access";
import { parseSignInOtpType, type SignInOtpType } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * A temporary shortcut the founder asked for (16 Oct 2026), until real sign-in
 * emails work on his own domain: on the private PREVIEW site only, typing an
 * address listed in ADMIN_EMAILS on the login page signs straight in, with no
 * email and no code.
 *
 * All of these must be true:
 *  - VERCEL_ENV is exactly "preview" (never production, never local development);
 *  - PREVIEW_QUICK_LOGIN is "1" (a Vercel setting for Preview only; delete it to
 *    switch the shortcut off);
 *  - the address is in ADMIN_EMAILS.
 * Previews are behind Vercel's own login, so only the founder can reach them.
 * Switch it off before sharing a preview link with anyone (docs/REVIEWER_GUIDE.md).
 */
export function previewQuickLoginAllowed(
  email: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.VERCEL_ENV !== "preview") return false;
  if (env.PREVIEW_QUICK_LOGIN !== "1") return false;
  return isAdminEmail(email, env.ADMIN_EMAILS);
}

/** How a quick sign-in went: signed in, nothing tried yet (no token could be made), or failed part-way. */
export type QuickSignInResult =
  | { status: "ok"; user: User }
  | { status: "no-token" }
  | { status: "failed" };

/**
 * Signs `email` in on this request without sending anything: the secret-key
 * client (passed in by the server action, so only server actions and route
 * handlers ever import it) makes a one-time sign-in token, and the user's own
 * client uses it at once, which sets the login cookies. Only call it after
 * previewQuickLoginAllowed(email) is true.
 *
 * "no-token" means nothing reached Supabase's email clock, so the caller can
 * send the normal email instead. "failed" means a token was made but not used:
 * making it counts as an email for Supabase's once-a-minute limit, so sending
 * the normal email straight away would only be refused.
 */
export async function quickSignIn(email: string, adminClient: () => SupabaseClient): Promise<QuickSignInResult> {
  let tokenHash: string | undefined;
  let type: SignInOtpType = "magiclink";
  try {
    const admin = adminClient();
    let link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error) {
      // The account may not exist yet: create it, already confirmed, and try once more.
      await admin.auth.admin.createUser({ email, email_confirm: true });
      link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    }
    tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) {
      // Never log the email address (personal data).
      console.error("preview quick login: no token", { code: link.error?.code, status: link.error?.status });
      return { status: "no-token" };
    }
    type = parseSignInOtpType(link.data?.properties?.verification_type) ?? "magiclink";
  } catch {
    // For example SUPABASE_SECRET_KEY missing.
    console.error("preview quick login: unavailable");
    return { status: "no-token" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error || !data.user) {
      console.error("preview quick login: sign-in failed", { code: error?.code, status: error?.status });
      return { status: "failed" };
    }
    return { status: "ok", user: data.user };
  } catch {
    console.error("preview quick login: sign-in failed");
    return { status: "failed" };
  }
}
