import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/analytics/events";
import { checkCronAuth } from "@/lib/retention/auth";
import { runRetentionCleanup } from "@/lib/retention/cleanup";
import { createRetentionStore } from "@/lib/retention/store-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// The daily retention clean-up (vercel.json schedules it). Only Vercel Cron, which
// sends CRON_SECRET, may run it. Answers with counts only, never any content.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const auth = checkCronAuth(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (auth === "not_configured") return NextResponse.json({ error: "The clean-up is not set up." }, { status: 503, headers: noStore });
  if (auth !== "ok") return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: noStore });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The database is not set up." }, { status: 503, headers: noStore });

  const result = await runRetentionCleanup(createRetentionStore(createAdminClient()));
  return NextResponse.json(result, { status: result.ok ? 200 : 500, headers: noStore });
}
