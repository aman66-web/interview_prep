"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSessionText } from "@/lib/client/use-session-storage";
import { UTM_STORAGE_KEY, utmFromSearchParams } from "@/lib/analytics/utm";

// Remembers the campaign tags (utm_source, utm_medium, utm_campaign, utm_term) of the
// first page opened in this browser tab, so they can be attached to the signup event
// (SPEC section 10). Kept in the tab's session storage (only through
// lib/client/use-session-storage.ts), which disappears when the tab closes: no cookies,
// nothing sent anywhere until the person signs up (rule 2.7). Renders nothing.
// Mount once, in the root layout.

const noSubscription = () => () => {};

export function UtmCapture() {
  const [stored, setStored] = useSessionText(UTM_STORAGE_KEY);
  // False during the server render and hydration (when the stored value cannot be seen
  // yet), true afterwards, so an earlier visit's tags are never overwritten.
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated || stored) return; // the first visit's tags win
    const utm = utmFromSearchParams(new URLSearchParams(window.location.search));
    if (utm) setStored(JSON.stringify(utm));
  }, [hydrated, stored, setStored]);

  return null;
}
