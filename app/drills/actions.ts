"use server";

import { z } from "zod";
import { hasAccess, type Entitlement } from "@/lib/access";
import { getUser } from "@/lib/auth/session";
import { checkDrillAnswer } from "@/lib/drills/check";
import { findDrill } from "@/lib/drills";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/site.config";

export type CheckDrillResult =
  | {
      status: "checked";
      correct: boolean;
      correctAnswer: string;
      explanation: string;
      signedIn: boolean;
      /** Free drills left today, or null when there is no limit (paid, or not logged in). */
      remainingToday: number | null;
    }
  | { status: "invalid"; message: string }
  | { status: "limit"; limit: number }
  | { status: "error"; message: string };

const inputSchema = z.object({
  drillId: z.string().min(1).max(64),
  response: z.string().max(40),
  elapsedMs: z.number().int().min(0).max(3_600_000).optional(),
});

/**
 * Checks a drill answer on the server, so answers and explanations never reach
 * the browser before someone has tried. For logged-in users it also records the
 * attempt and enforces the free daily limit (siteConfig.limits.free.drillsPerDay).
 */
export async function checkDrill(input: z.input<typeof inputSchema>): Promise<CheckDrillResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Something went wrong. Please reload the page." };
  const { drillId, response, elapsedMs } = parsed.data;

  const drill = findDrill(drillId);
  if (!drill) return { status: "error", message: "That drill no longer exists. Please reload the page." };

  const outcome = checkDrillAnswer(drill, response);
  if (!outcome.valid) return { status: "invalid", message: outcome.message };

  // Who is this? A failure to find out (for example, login not set up yet on a
  // preview site) just means we treat them as a visitor.
  let user = null;
  try {
    user = await getUser();
  } catch (error) {
    console.error("drill check: could not read login", error instanceof Error ? error.message : "unknown");
  }

  if (!user) {
    return {
      status: "checked",
      correct: outcome.correct,
      correctAnswer: outcome.correctAnswer,
      explanation: outcome.explanation,
      signedIn: false,
      remainingToday: null,
    };
  }

  try {
    // Read as the user (not the admin), so Row Level Security applies.
    const supabase = await createClient();
    const { data: entitlement } = await supabase
      .from("entitlements")
      .select("plan, status, expires_at")
      .maybeSingle();
    const unlimited = hasAccess(entitlement as Entitlement, "unlimited_drills");

    let used = 0;
    if (!unlimited) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from("drill_attempts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());
      if (error) throw error;
      used = count ?? 0;
      if (used >= siteConfig.limits.free.drillsPerDay) {
        return { status: "limit", limit: siteConfig.limits.free.drillsPerDay };
      }
    }

    const { error: insertError } = await supabase.from("drill_attempts").insert({
      user_id: user.id,
      drill_id: drillId,
      correct: outcome.correct,
      ms: elapsedMs ?? null,
    });
    if (insertError) throw insertError;

    return {
      status: "checked",
      correct: outcome.correct,
      correctAnswer: outcome.correctAnswer,
      explanation: outcome.explanation,
      signedIn: true,
      remainingToday: unlimited ? null : Math.max(0, siteConfig.limits.free.drillsPerDay - used - 1),
    };
  } catch (error) {
    console.error("drill check: could not record attempt", error instanceof Error ? error.message : "unknown");
    return { status: "error", message: "We couldn't save that attempt. Please try again." };
  }
}
