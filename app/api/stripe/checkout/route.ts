import { NextResponse, type NextRequest } from "next/server";
import { recordOncePerDay } from "@/lib/analytics/funnel";
import { getUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { buildCheckoutParams, CANCEL_WAIVER, hasCancelWaiver } from "@/lib/stripe/checkout";
import { isStripeConfigured, StripeError } from "@/lib/stripe/client";
import { checkPurchase, isPlanId } from "@/lib/stripe/plans";
import { createStripeApi } from "@/lib/stripe/client";
import { createPaymentsStore } from "@/lib/stripe/store-supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/site.config";

// Starts a Stripe Checkout for the signed-in user. It is a plain form post, so it works
// without JavaScript; the answer is always a redirect (to Stripe, or back to /pricing with a notice).

function back(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const user = await getUser();
  if (!user) return back(request, "/login?next=%2Fpricing");

  const form = await request.formData().catch(() => null);
  const plan = form?.get("plan");
  if (!isPlanId(plan)) return back(request, "/pricing?notice=invalid");
  // The buyer must ask for access to start straight away and accept losing the 14-day right to cancel.
  if (!hasCancelWaiver(form)) return back(request, "/pricing?notice=consent");
  if (!isStripeConfigured()) return back(request, "/pricing?notice=unavailable");

  try {
    const store = createPaymentsStore(createAdminClient());
    const check = checkPurchase(plan, await store.getEntitlement(user.id));
    if (!check.ok) return back(request, `/pricing?notice=${check.reason}`);

    const session = await createStripeApi().createCheckoutSession(
      buildCheckoutParams({
        plan,
        userId: user.id,
        email: user.email ?? undefined,
        customerId: await store.customerIdForUser(user.id),
        origin: request.nextUrl.origin,
        priceIds: { monthly: process.env.STRIPE_PRICE_MONTHLY, pass90: process.env.STRIPE_PRICE_PASS90 },
        taxEnabled: siteConfig.stripeTaxEnabled,
        cancelWaiver: CANCEL_WAIVER.version,
      }),
    );
    if (!session.url) throw new Error("Stripe returned no checkout address.");
    // funnel: at most once per person, plan and UTC day, so repeated posts cannot flood the events table
    await recordOncePerDay(createAdminClient, "checkout_started", { userId: user.id, path: `/pricing?plan=${plan}`, perPath: true });
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("stripe: could not start checkout", error instanceof StripeError ? { status: error.status, code: error.code } : "unexpected error");
    return back(request, "/pricing?notice=error");
  }
}
