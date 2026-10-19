import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { createStripeApi, isStripeConfigured, StripeError } from "@/lib/stripe/client";
import { createPaymentsStore } from "@/lib/stripe/store-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// Opens Stripe's billing portal (change card, cancel, see invoices) for the signed-in user.

function back(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const user = await getUser();
  if (!user) return back(request, "/login?next=%2Fapp%2Faccount");
  if (!isStripeConfigured()) return back(request, "/app/account?notice=unavailable");

  try {
    const customerId = await createPaymentsStore(createAdminClient()).customerIdForUser(user.id);
    if (!customerId) return back(request, "/app/account?notice=no_billing");
    const portal = await createStripeApi().createPortalSession(customerId, `${request.nextUrl.origin}/app/account`);
    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    console.error("stripe: could not open the billing portal", error instanceof StripeError ? { status: error.status, code: error.code } : "unexpected error");
    return back(request, "/app/account?notice=error");
  }
}
