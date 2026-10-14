import { NextResponse, type NextRequest } from "next/server";
import { createStripeApi, StripeError } from "@/lib/stripe/client";
import { handleStripeEvent, parseEvent } from "@/lib/stripe/events";
import { verifySignature } from "@/lib/stripe/signature";
import { createPaymentsDeps } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe tells us about payments here. Nothing is believed until the signature checks out
// against STRIPE_WEBHOOK_SECRET. A 200 means "got it"; a 500 makes Stripe try again later.

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: "Payments are not set up." }, { status: 503 });
  }

  // The signature covers the exact bytes Stripe sent, so read the body as text, untouched.
  const payload = await request.text();
  const signature = verifySignature(payload, request.headers.get("stripe-signature"), secret);
  if (!signature.ok) {
    console.warn("stripe: refused a webhook", { reason: signature.reason });
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }
  const event = parseEvent(json);
  if (!event) return NextResponse.json({ error: "Not an event." }, { status: 400 });

  try {
    const outcome = await handleStripeEvent({ ...createPaymentsDeps(createAdminClient()), stripe: createStripeApi() }, event);
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    console.error("stripe: could not handle an event", { type: event.type, ...(error instanceof StripeError ? { status: error.status, code: error.code } : {}) });
    return NextResponse.json({ error: "Could not handle the event." }, { status: 500 });
  }
}
