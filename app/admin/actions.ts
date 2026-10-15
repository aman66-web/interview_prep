"use server";

import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/analytics/admin-access";
import { summariseWindow, type CompletedFact, type EventFact, type LeadFact, type UsageFact, type WindowStats } from "@/lib/analytics/dashboard";
import { isSupabaseConfigured } from "@/lib/analytics/events";
import { fetchAllRows } from "@/lib/analytics/fetch-all";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// Reads everything the /admin page shows. It uses the admin (secret key) client, so it
// first checks the caller is signed in and listed in ADMIN_EMAILS; anyone else gets a
// plain "not found", as if the page did not exist. Only counts and sums leave this
// function, plus the latest few university enquiries (shown on the admin page only,
// never logged).

export type LatestLead = { org: string; email: string; size: string | null; created_at: string };

export type AdminDashboard =
  | { configured: false }
  | {
      configured: true;
      generatedAt: string;
      week: WindowStats;
      month: WindowStats;
      latestLeads: LatestLead[];
      /** True if a table had more rows than the page reads; the figures are then a lower bound. */
      partial: boolean;
    };

const DAY_MS = 86_400_000;

export async function loadAdminDashboard(): Promise<AdminDashboard> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();
  if (!isSupabaseConfigured()) return { configured: false };

  const db = createAdminClient();
  const now = new Date();
  // A little more than 30 days, so the oldest whole UTC day is complete.
  const since = new Date(now.getTime() - 31 * DAY_MS).toISOString();

  // Newest rows first: if a table ever has more rows than fetchAllRows reads, the cap
  // drops the oldest days of the 30-day window, never the latest signups and purchases.
  const NEWEST = { ascending: false } as const;
  const [events, usage, completed, leads, latest] = await Promise.all([
    fetchAllRows<EventFact>((from, to) =>
      db
        .from("events")
        .select("name, user_id, path, utm_source, created_at")
        .gte("created_at", since)
        .order("created_at", NEWEST)
        .order("id", NEWEST)
        .range(from, to),
    ),
    fetchAllRows<UsageFact>((from, to) =>
      db
        .from("ai_usage")
        .select("created_at, input_tokens, output_tokens, cost_estimate_usd")
        .gte("created_at", since)
        .order("created_at", NEWEST)
        .order("id", NEWEST)
        .range(from, to),
    ),
    fetchAllRows<CompletedFact>((from, to) =>
      db.from("case_sessions").select("completed_at").gte("completed_at", since).order("completed_at", NEWEST).order("id", NEWEST).range(from, to),
    ),
    fetchAllRows<LeadFact>((from, to) =>
      db.from("leads").select("created_at").gte("created_at", since).order("created_at", NEWEST).order("id", NEWEST).range(from, to),
    ),
    db.from("leads").select("org, email, size, created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  if (latest.error) throw new Error(`Database error while reading enquiries: ${latest.error.code ?? latest.error.message}`);

  const input = { events: events.rows, usage: usage.rows, completed: completed.rows, leads: leads.rows };
  return {
    configured: true,
    generatedAt: now.toISOString(),
    week: summariseWindow(input, 7, now),
    month: summariseWindow(input, 30, now),
    latestLeads: (latest.data ?? []) as LatestLead[],
    partial: [events, usage, completed, leads].some((r) => r.truncated),
  };
}
