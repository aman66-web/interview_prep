import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { publicExhibits } from "@/lib/ai/interview";
import { SESSION_CAPS } from "@/lib/ai/limits";
import { isStage } from "@/lib/ai/stages";
import { requireUser } from "@/lib/auth/session";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { createClient } from "@/lib/supabase/server";
import { InterviewRoom } from "./interview-room";

export const metadata: Metadata = { title: "Interview", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireUser();
  const { sessionId } = await params;
  if (!UUID.test(sessionId)) notFound();

  // Read as the signed-in user: Row Level Security means only their own sessions come back.
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("case_sessions")
    .select("id, case_id, stage, turns, started_at, completed_at, revealed_exhibits")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  if (session.completed_at) redirect(`/app/debrief/${sessionId}`);

  const c = visibleCases().find((x) => x.id === session.case_id);
  if (!c || !isStage(session.stage)) notFound();

  const { data: messages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <InterviewRoom
      sessionId={session.id}
      caseTitle={c.title}
      caseType={CASE_TYPE_LABELS[c.type] ?? "Case"}
      estMinutes={c.est_minutes}
      startedAt={session.started_at}
      initialMessages={((messages ?? []) as { role: "user" | "assistant"; content: string }[]).map((m) => ({
        role: m.role,
        content: m.content,
      }))}
      initialStage={session.stage}
      initialTurns={session.turns}
      turnsMax={SESSION_CAPS.maxTurns}
      maxChars={SESSION_CAPS.maxMessageChars}
      initialExhibits={publicExhibits(c, (session.revealed_exhibits as string[] | null) ?? [])}
    />
  );
}
