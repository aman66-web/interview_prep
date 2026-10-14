import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasAccess } from "@/lib/access";
import { blockedMessage, canStartCase, type Blocked } from "@/lib/ai/limits";
import { isAiConfigured } from "@/lib/ai/llm";
import { requireUser } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/auth/entitlement";
import { findVisibleCase } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/site.config";
import { startInterviewAction } from "../actions";

export const metadata: Metadata = { title: "Start an interview", robots: { index: false } };

const notices: Record<string, string> = {
  unavailable: "The AI interviewer isn't switched on yet. We're finishing setting it up, so please check back soon.",
  upgrade: "This case is part of the paid plans. Your free AI interview is the free starter case.",
  total: blockedMessage("total"),
  day: blockedMessage("day"),
  month: blockedMessage("month"),
};

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const { notice } = await searchParams;
  const c = findVisibleCase(slug);
  if (!c) notFound();

  const supabase = await createClient();
  const paid = hasAccess(await getEntitlement(supabase), "all_cases");
  const { data: sessions } = await supabase
    .from("case_sessions")
    .select("id, case_id, completed_at")
    .order("started_at", { ascending: false });
  const mine = (sessions ?? []) as { id: string; case_id: string; completed_at: string | null }[];
  const active = mine.find((s) => s.case_id === c.id && !s.completed_at);
  const finished = mine.find((s) => s.case_id === c.id && s.completed_at);
  const usedFreeAllowance = !paid && mine.length >= siteConfig.limits.free.aiCasesTotal && !active;

  const allowed = canStartCase(c, paid);
  const message = notice ? notices[notice] : undefined;
  const blocked: Blocked | null = usedFreeAllowance ? "total" : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <p className="text-sm">
        <Link href={`/cases/${c.slug}`} className="underline">
          Back to the case
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-muted">
        {CASE_TYPE_LABELS[c.type]} · about {c.est_minutes} minutes · up to {siteConfig.limits.candidateTurnsPerSession} turns
      </p>

      {message ? (
        <p role="alert" className="mt-6 rounded-md border border-border p-4">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-md border border-border p-5">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>You chat with an AI interviewer, as in a real case interview.</li>
          <li>Ask clarifying questions, lay out your structure, analyse the data and do the maths.</li>
          <li>Give a recommendation. Then you get a scored debrief with what to fix next.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Calculator, notes and a timer are on the side. Don&rsquo;t share personal details in the chat.
        </p>
      </section>

      <div className="mt-8">
        {!isAiConfigured() ? (
          <p className="text-muted">{notices.unavailable}</p>
        ) : !allowed ? (
          <>
            <p>{notices.upgrade}</p>
            <Link href="/pricing" className="mt-4 inline-block underline">
              See plans
            </Link>
          </>
        ) : active ? (
          <Link
            href={`/app/interview/${active.id}`}
            className="inline-block rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground"
          >
            Continue your interview
          </Link>
        ) : blocked ? (
          <>
            <p>{blockedMessage(blocked)}</p>
            <div className="mt-4 flex gap-4">
              {finished ? (
                <Link href={`/app/debrief/${finished.id}`} className="underline">
                  See your debrief
                </Link>
              ) : null}
              <Link href="/pricing" className="underline">
                See plans
              </Link>
            </div>
          </>
        ) : (
          <form action={startInterviewAction}>
            <input type="hidden" name="slug" value={c.slug} />
            <button type="submit" className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground">
              Start the interview
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
