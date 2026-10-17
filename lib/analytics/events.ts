import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanUtmValue, type Utm } from "./utm";

// Funnel events (SPEC sections 9 and 12): one row in `events` per step a person
// takes. Rows hold the event name, the page path, campaign tags and the user id;
// never an IP address, email or anything typed by the user (rule 2.7).
//
// Recording an event must never break what the person is doing, so recordEvent()
// never throws: on any problem it logs a short message (no personal data) and
// carries on. Without Supabase settings (a local checkout, a test) it does nothing.
//
// The events table is server-only (no browser grants), so writes use the admin
// client. That client may only be created in server actions and route handlers
// (tests/secrets-stay-on-server.test.ts), so the caller hands it in, usually as
// the factory itself: recordEvent("case_started", { userId }, createAdminClient).

export const FUNNEL_EVENTS = ["signup", "case_started", "case_completed", "paywall_viewed", "checkout_started", "purchase"] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/** Event rows are deleted after this many days (SPEC section 9; lib/retention). */
export const EVENT_RETENTION_DAYS = 180;

/** Just enough of a Supabase client to read and write rows; tests pass a fake. */
export type EventsDb = Pick<SupabaseClient, "from">;
/** A client, or a function that makes one (only called when Supabase is configured). */
export type DbSource = EventsDb | (() => EventsDb);

export type EventOptions = {
  userId?: string | null;
  path?: string | null;
  utm?: Utm | null;
};

export type EventRow = {
  name: FunnelEvent;
  user_id: string | null;
  path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === "string" && (FUNNEL_EVENTS as readonly string[]).includes(value);
}

/** A same-site path such as "/cases/harbourline", or null. Long or odd values are dropped. */
export function cleanPath(path: unknown): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.length > 300) return null;
  if (/[\u0000-\u001f\u007f\s@]/.test(trimmed)) return null;
  return trimmed;
}

export function buildEventRow(name: FunnelEvent, options: EventOptions = {}): EventRow {
  const utm = options.utm ?? {};
  return {
    name,
    user_id: typeof options.userId === "string" && UUID.test(options.userId) ? options.userId : null,
    path: cleanPath(options.path),
    utm_source: cleanUtmValue(utm.utm_source),
    utm_medium: cleanUtmValue(utm.utm_medium),
    utm_campaign: cleanUtmValue(utm.utm_campaign),
    utm_term: cleanUtmValue(utm.utm_term),
  };
}

/** True when the server has what it needs to write to Supabase. */
export function isSupabaseConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.SUPABASE_SECRET_KEY?.trim());
}

/** Resolves the client, or null if Supabase is not set up or the client cannot be made. */
export function resolveDb(source: DbSource | null | undefined): EventsDb | null {
  if (!source || !isSupabaseConfigured()) return null;
  try {
    return typeof source === "function" ? source() : source;
  } catch {
    warn("could not create a database client");
    return null;
  }
}

/** A short log line. Only fixed words and error codes; never anything about the person. */
export function warn(what: string, code?: string | null) {
  if (code) console.warn(`analytics: ${what}`, { code });
  else console.warn(`analytics: ${what}`);
}

/** Records one funnel event. Never throws; returns true if the row was written. */
export async function recordEvent(name: FunnelEvent, options: EventOptions, source: DbSource | null | undefined): Promise<boolean> {
  try {
    if (!isFunnelEvent(name)) return false;
    const db = resolveDb(source);
    if (!db) return false;
    const { error } = await db.from("events").insert(buildEventRow(name, options));
    if (error) {
      warn(`could not record ${name}`, error.code);
      return false;
    }
    return true;
  } catch {
    warn(`could not record ${name}`);
    return false;
  }
}
