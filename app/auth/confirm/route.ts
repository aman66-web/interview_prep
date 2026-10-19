import { NextResponse, type NextRequest } from "next/server";
import { recordSignupOnce } from "@/lib/analytics/funnel";
import { appendUtm, utmFromSearchParams } from "@/lib/analytics/utm";
import { parseSignInOtpType } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Where the link in the sign-in email lands.
//  * token_hash + type: our own email template. We do NOT use the token here;
//    we send the person to /auth/continue to press a button first, because
//    some university and company email systems open every link in an email
//    to scan it, which would use up the one-time token before the student does.
//  * code: Supabase's default email template (same-browser sign-in).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  // Google or Apple sent the person back with an error (they pressed Cancel, or the provider
  // is not set up). An expired email link is reported the same way.
  if (searchParams.get("error") || searchParams.get("error_description")) {
    const expired = searchParams.get("error_code") === "otp_expired";
    const cancelled = searchParams.get("error") === "access_denied" && !expired;
    const reason = expired ? "link_invalid" : cancelled ? "provider_cancelled" : "provider_failed";
    return NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
  }
  const tokenHash = searchParams.get("token_hash");
  const type = parseSignInOtpType(searchParams.get("type"));

  if (tokenHash && type) {
    const url = new URL("/auth/continue", origin);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", type);
    url.searchParams.set("next", next);
    appendUtm(url.searchParams, utmFromSearchParams(searchParams)); // campaign tags for the signup event, if the link carries them
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await recordSignupOnce(createAdminClient, data.user, { utm: utmFromSearchParams(searchParams) }); // funnel: first sign-in only
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link_invalid", origin));
}
