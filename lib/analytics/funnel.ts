import { allCases } from "@/lib/content/cases";
import { cleanPath, EVENT_RETENTION_DAYS, recordEvent, resolveDb, warn, type DbSource, type FunnelEvent } from "./events";
import type { Utm } from "./utm";

// The funnel steps that need more than a plain recordEvent() call, each recorded
// exactly once however many times the code around it runs.

const DAY_MS = 86_400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// signup: the first successful sign-in of a new account
// ---------------------------------------------------------------------------

/**
 * A new account is counted the first time it signs in (not when an email is merely
 * requested, which anyone can do for any address). It is counted once:
 *  * if a signup event already exists for this user, nothing is added;
 *  * accounts created before the event retention window are never counted, because
 *    their first signup event (if any) may already have been deleted by the clean-up.
 * Signing in twice at the very same moment is not possible: the link and the code in
 * a sign-in email are the same one-time token, so only one of them can succeed.
 */
export async function recordSignupOnce(
  source: DbSource | null | undefined,
  user: { id?: string | null; created_at?: string | null } | null | undefined,
  options: { utm?: Utm | null; path?: string | null; now?: Date } = {},
): Promise<boolean> {
  try {
    if (!user?.id || !UUID.test(user.id)) return false;
    const now = options.now ?? new Date();
    const created = Date.parse(user.created_at ?? "");
    if (!Number.isFinite(created)) return false;
    if (created < now.getTime() - (EVENT_RETENTION_DAYS - 1) * DAY_MS) return false;

    const db = resolveDb(source);
    if (!db) return false;
    const { data, error } = await db.from("events").select("id").eq("name", "signup").eq("user_id", user.id).limit(1);
    if (error) {
      // Unsure whether it was counted already: better to miss one than count one twice.
      warn("could not check for an earlier signup", error.code);
      return false;
    }
    if ((data ?? []).length > 0) return false;
    return recordEvent("signup", { userId: user.id, path: options.path ?? "/login", utm: options.utm }, db);
  } catch {
    warn("could not record signup");
    return false;
  }
}

// ---------------------------------------------------------------------------
// paywall_viewed and checkout_started: at most once per person per UTC day
// ---------------------------------------------------------------------------

/** Midnight UTC at the start of the day `now` falls in. */
export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Records `name` for this account at most once per UTC day (with `perPath`, once per
 * path per day). These steps can be triggered again and again by a signed-in person
 * (reloading a page, posting a form), so without this one scripted account could fill
 * the events table. The funnel counts people, so nothing is lost by keeping one row a day.
 * Like recordSignupOnce, it skips when unsure (a failed check). Two requests at the very
 * same moment could both pass the check; that is one extra row, not a flood.
 */
export async function recordOncePerDay(
  source: DbSource | null | undefined,
  name: Extract<FunnelEvent, "paywall_viewed" | "checkout_started">,
  options: { userId: string; path: string; perPath?: boolean; now?: Date },
): Promise<boolean> {
  try {
    if (!UUID.test(options.userId)) return false; // only real accounts can be counted once
    const path = cleanPath(options.path);
    if (!path) return false;
    const db = resolveDb(source);
    if (!db) return false;

    const since = utcDayStart(options.now ?? new Date()).toISOString();
    let query = db.from("events").select("id").eq("name", name).eq("user_id", options.userId).gte("created_at", since);
    if (options.perPath) query = query.eq("path", path);
    const { data, error } = await query.limit(1);
    if (error) {
      warn(`could not check for an earlier ${name}`, error.code);
      return false;
    }
    if ((data ?? []).length > 0) return false;
    return recordEvent(name, { userId: options.userId, path }, db);
  } catch {
    warn(`could not record ${name}`);
    return false;
  }
}

/** Where a signed-in free user can be shown the paywall (the paths recorded for paywall_viewed). */
export const PAYWALL_PLACES = ["pricing", "dashboard", "start"] as const;
export type PaywallPlace = (typeof PAYWALL_PLACES)[number];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The fixed path recorded for a paywall view, or null. Only known places are accepted;
 * a case page needs the slug of a case that exists (checked by the caller's `caseExists`).
 */
export function paywallPath(place: unknown, slug: unknown, caseExists: (slug: string) => boolean): string | null {
  if (place === "pricing") return "/pricing";
  if (place === "dashboard") return "/app";
  if (place === "start" && typeof slug === "string" && slug.length <= 120 && SLUG.test(slug) && caseExists(slug)) {
    return `/app/start/${slug}`;
  }
  return null;
}

/** A free user was shown the paywall: recorded at most once per person per UTC day. */
export async function recordPaywallViewed(
  source: DbSource | null | undefined,
  context: { userId: string; path: string; now?: Date },
): Promise<boolean> {
  return recordOncePerDay(source, "paywall_viewed", context);
}

// ---------------------------------------------------------------------------
// case_started and paywall_viewed: what happened when someone pressed "Start"
// ---------------------------------------------------------------------------

export type StartOutcomeLike =
  | { status: "started" | "resumed"; sessionId: string }
  | { status: "needs_upgrade" }
  | { status: "blocked"; blocked: "total" | "day" | "month" };

/**
 * A new interview is a case_started. Being refused because of the plan (a paid case
 * on the free plan, or the free interview already used) is a paywall_viewed: the
 * start page then shows the upgrade button. That only happens in a race (a stale tab,
 * or a plan that ended between loading the page and pressing Start), because the start
 * page shows the paywall instead of the Start button and records the view itself
 * (components/app/paywall-seen.tsx). Like that view, it counts once per person per day.
 * Resuming, or a paid plan's daily or monthly limit, records nothing.
 */
export async function recordStartOutcome(
  source: DbSource | null | undefined,
  outcome: StartOutcomeLike,
  context: { userId: string; slug: string; now?: Date },
): Promise<boolean> {
  if (outcome.status === "started") {
    return recordEvent("case_started", { userId: context.userId, path: `/cases/${context.slug}` }, source);
  }
  if (outcome.status === "needs_upgrade" || (outcome.status === "blocked" && outcome.blocked === "total")) {
    return recordPaywallViewed(source, { userId: context.userId, path: `/app/start/${context.slug}`, now: context.now });
  }
  return false;
}

// ---------------------------------------------------------------------------
// case_completed
// ---------------------------------------------------------------------------

/** The public page of a case, from its id, so the funnel can be read per case. */
export function casePathForId(caseId: string): string | null {
  const c = allCases.find((x) => x.id === caseId);
  return c ? `/cases/${c.slug}` : null;
}

/** Called only by the request that actually finished the interview (see lib/ai/store-supabase.ts). */
export async function recordCaseCompleted(source: DbSource | null | undefined, row: { user_id: string; case_id: string }): Promise<boolean> {
  return recordEvent("case_completed", { userId: row.user_id, path: casePathForId(row.case_id) }, source);
}

// ---------------------------------------------------------------------------
// purchase: once per paid checkout
// ---------------------------------------------------------------------------

export type CheckoutLike = {
  id: string;
  client_reference_id?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
};

/** The key that marks a checkout's purchase event as recorded, in stripe_events. */
export function purchaseClaimKey(checkoutSessionId: string) {
  return `purchase-event:${checkoutSessionId}`;
}

/**
 * The webhook and the page people land on after paying both see the same finished
 * checkout, in either order, possibly more than once. The first to arrive claims the
 * checkout in stripe_events (the table the payment code already uses to do things
 * exactly once; its rows are never deleted), and only that one writes the event.
 * Orders that cost nothing (a 100% discount code) are not counted as purchases.
 */
export async function recordPurchaseOnce(source: DbSource | null | undefined, checkout: CheckoutLike | null | undefined): Promise<boolean> {
  try {
    if (!checkout || typeof checkout.id !== "string" || !/^cs_[A-Za-z0-9_]{6,200}$/.test(checkout.id)) return false;
    if (checkout.payment_status !== "paid") return false;
    const userId = checkout.client_reference_id ?? checkout.metadata?.user_id ?? null;
    if (!userId || !UUID.test(userId)) return false;
    const plan = checkout.metadata?.plan;
    const path = plan === "monthly" || plan === "pass90" ? `/pricing?plan=${plan}` : "/pricing";

    const db = resolveDb(source);
    if (!db) return false;
    const { error } = await db.from("stripe_events").insert({ id: purchaseClaimKey(checkout.id), type: "purchase_event" });
    if (error) {
      if (error.code !== "23505") warn("could not claim a purchase", error.code); // 23505: already counted
      return false;
    }
    return recordEvent("purchase", { userId, path }, db);
  } catch {
    warn("could not record purchase");
    return false;
  }
}
