import { NextResponse, type NextRequest } from "next/server";
import { recordPurchaseOnce } from "@/lib/analytics/funnel";
import { getUser } from "@/lib/auth/session";
import { createStripeApi, isStripeConfigured, StripeError } from "@/lib/stripe/client";
import { applyCheckoutSession } from "@/lib/stripe/events";
import { createPaymentsDeps } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Where Stripe sends people after they pay. We ask Stripe about the checkout and apply it
// straight away, so the plan is active the moment they arrive instead of whenever the
// webhook lands. Applying is safe to repeat: a purchase is only ever counted once.

function back(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin), 303);
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return back(request, "/login?next=%2Fapp%2Faccount");

  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]{6,200}$/.test(sessionId) || !isStripeConfigured()) return back(request, "/app/account");

  try {
    const deps = createPaymentsDeps(createAdminClient());
    const session = await createStripeApi().retrieveCheckoutSession(sessionId);
    // Only the person who started this checkout may apply it.
    if (session.client_reference_id !== user.id) return back(request, "/app/account");
    if (await applyCheckoutSession(deps, session)) await recordPurchaseOnce(createAdminClient, session); // funnel: once per paid checkout
    return back(request, "/app/account?checkout=success");
  } catch (error) {
    console.error("stripe: could not confirm a checkout", error instanceof StripeError ? { status: error.status, code: error.code } : "unexpected error");
    // The webhook will still deliver it; the account page says so.
    return back(request, "/app/account?checkout=pending");
  }
}
