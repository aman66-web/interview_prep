"use server";

import { isPaid } from "@/lib/access";
import { paywallPath, recordPaywallViewed, type PaywallPlace } from "@/lib/analytics/funnel";
import { getEntitlement } from "@/lib/auth/entitlement";
import { getUser } from "@/lib/auth/session";
import { findVisibleCase } from "@/lib/content/cases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * The funnel's "saw the paywall" step (SPEC section 12). Called once, after the page
 * has loaded, by <PaywallSeen> where a signed-in free user is shown the paid plans:
 * the pricing page, the dashboard's locked next step and the start page of a case they
 * cannot run. It is a POST (a server action), never a side effect of loading a page,
 * so link prefetching cannot record it. Guests and paying users record nothing. The
 * path is chosen from a fixed list, and each person is counted at most once a day.
 */
export async function notePaywallSeen(place: PaywallPlace, slug?: string): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;
    const path = paywallPath(place, slug, (s) => findVisibleCase(s) !== undefined);
    if (!path) return;
    if (isPaid(await getEntitlement(await createClient()))) return;
    await recordPaywallViewed(createAdminClient, { userId: user.id, path });
  } catch {
    // Counting must never get in the way of the page.
  }
}
