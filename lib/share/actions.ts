"use server";

import { z } from "zod";
import { storedDebriefSchema } from "@/lib/ai/schema";
import { getUser } from "@/lib/auth/session";
import { allCases } from "@/lib/content/cases";
import { createClient } from "@/lib/supabase/server";
import { cleanFirstName, shareSigningKey, signShareCard } from "./token";

// Makes a share link for one finished interview. Only its owner can: the session is
// read with the signed-in person's own database client, so Row Level Security returns
// nothing for anyone else's interview. The link carries only the five scores, the case,
// the day and (if typed) a first name. The name is checked by cleanFirstName (only
// letters the share picture's font can draw, see lib/share/token.ts) and is never logged.

export type ShareLinkState =
  | { status: "idle" }
  | { status: "ready"; path: string; imagePath: string; firstName: string | null }
  | { status: "error"; message: string };

const sessionIdSchema = z.uuid();

export async function createShareLink(_prev: ShareLinkState, form: FormData): Promise<ShareLinkState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Please log in again to share your scores." };

  const sessionId = sessionIdSchema.safeParse(form.get("sessionId"));
  if (!sessionId.success) return { status: "error", message: "We couldn't find that interview." };

  const name = cleanFirstName(form.get("firstName"));
  if (!name.ok) return { status: "error", message: name.reason };

  const key = shareSigningKey();
  if (!key) return { status: "error", message: "Sharing isn't switched on yet. Please try again later." };

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("case_sessions")
    .select("id, user_id, case_id, completed_at, scores")
    .eq("id", sessionId.data)
    .maybeSingle();
  if (error) {
    console.error("share: could not read the interview", { code: error.code });
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  if (!session || session.user_id !== user.id) return { status: "error", message: "We couldn't find that interview." };
  if (!session.completed_at) return { status: "error", message: "Finish the interview first, then share your scores." };

  const debrief = storedDebriefSchema.safeParse(session.scores);
  const c = allCases.find((x) => x.id === session.case_id);
  if (!debrief.success || !c) return { status: "error", message: "These scores can't be shared." };

  let token: string;
  try {
    token = signShareCard(
      {
        scores: debrief.data.scores,
        caseSlug: c.slug,
        date: new Date(session.completed_at).toISOString().slice(0, 10),
        ...(name.name ? { firstName: name.name } : {}),
      },
      key,
    );
  } catch {
    // Not logged: the card being signed may hold the person's first name.
    return { status: "error", message: "These scores can't be shared." };
  }
  return {
    status: "ready",
    path: `/share/${token}`,
    imagePath: `/api/og/score?t=${encodeURIComponent(token)}`,
    firstName: name.name,
  };
}
