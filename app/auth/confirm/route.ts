import { NextResponse, type NextRequest } from "next/server";
import { parseSignInOtpType } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
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
  const tokenHash = searchParams.get("token_hash");
  const type = parseSignInOtpType(searchParams.get("type"));

  if (tokenHash && type) {
    const url = new URL("/auth/continue", origin);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", type);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?error=link_invalid", origin));
}
