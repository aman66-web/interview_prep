"use client";

import { useEffect, useRef } from "react";
import { notePaywallSeen } from "@/app/app/funnel-actions";
import type { PaywallPlace } from "@/lib/analytics/funnel";

// Tells the server, once the page is on screen, that a signed-in free user was shown
// the paid plans (the funnel's "saw the paywall" step). Renders nothing. The server
// decides whether to count it (signed in, on the free plan, at most once a day), so
// this sends no personal data and is safe to render for anyone.

export function PaywallSeen({ place, slug }: { place: PaywallPlace; slug?: string }) {
  const sent = useRef(false); // React runs effects twice in development; send once
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    notePaywallSeen(place, slug).catch(() => {});
  }, [place, slug]);
  return null;
}
