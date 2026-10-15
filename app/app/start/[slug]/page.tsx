import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { Notice } from "@/components/app/notice";
import { CASE_TYPE_TONES, DifficultyMeter } from "@/components/marketing/case-card";
import { Kicker, Tag } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calculator, ChartBars, Chat, Clock, Lock, Notes, Shield } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { hasAccess } from "@/lib/access";
import { blockedMessage, canStartCase, SESSION_CAPS, type Blocked } from "@/lib/ai/limits";
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

const STAGES = [
  { name: "Clarify", text: "Ask the questions that pin down the goal. Answers come from the case facts." },
  { name: "Structure", text: "Lay out your approach. Expect to be pushed on gaps and overlaps." },
  { name: "Analysis", text: "Ask for the data you need, read the exhibits and do the maths out loud." },
  { name: "Brainstorm", text: "Give ideas that are wide, sorted and relevant to the client." },
  { name: "Recommend", text: "Answer first, then your reasons, risks and next steps." },
];

const TOOLS = [
  { icon: <ChartBars size={16} />, name: "Exhibits", text: "Shared when you ask for the right data" },
  { icon: <Notes size={16} />, name: "Notes", text: "A scratchpad kept in this browser tab only" },
  { icon: <Calculator size={16} />, name: "Calculator", text: "For checking, not for thinking" },
  { icon: <Clock size={16} />, name: "Timer", text: "So you learn the pace" },
];

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { notice } = await searchParams;
  const c = findVisibleCase(slug);
  if (!c) notFound();

  const supabase = await createClient();
  const paid = hasAccess(await getEntitlement(supabase), "all_cases");
  const { data: sessions } = await supabase
    .from("case_sessions")
    .select("id, case_id, completed_at")
    .eq("user_id", user.id) // Row Level Security already limits this to the user; the filter is belt and braces.
    .order("started_at", { ascending: false });
  const mine = (sessions ?? []) as { id: string; case_id: string; completed_at: string | null }[];
  const active = mine.find((s) => s.case_id === c.id && !s.completed_at);
  const finished = mine.find((s) => s.case_id === c.id && s.completed_at);
  const usedFreeAllowance = !paid && mine.length >= siteConfig.limits.free.aiCasesTotal && !active;

  const allowed = canStartCase(c, paid);
  const message = notice ? notices[notice] : undefined;
  const blocked: Blocked | null = usedFreeAllowance ? "total" : null;
  const configured = isAiConfigured();

  // What the action panel already says, so a notice in the address never repeats it.
  const panelText = !configured ? notices.unavailable : !allowed ? notices.upgrade : active ? null : blocked ? blockedMessage(blocked) : null;

  return (
    <>
      <Container className="pt-5">
        <Link
          href={`/cases/${c.slug}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full pr-3 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to the case
        </Link>
      </Container>

      <AppHeader
        className="pt-2"
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={CASE_TYPE_TONES[c.type] ?? "neutral"}>{CASE_TYPE_LABELS[c.type]}</Tag>
            {c.free_starter ? <Tag tone="ink">Free full interview</Tag> : null}
            {c.status === "draft" ? <Tag tone="warning">Draft, not yet reviewed</Tag> : null}
          </div>
        }
        title={c.title}
        intro={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span>{c.industry}</span>
            <DifficultyMeter level={c.difficulty} />
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} /> about {c.est_minutes} minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Chat size={15} /> up to {siteConfig.limits.candidateTurnsPerSession} turns
            </span>
          </div>
        }
        aside={
          <Card className="flex h-full flex-col shadow-float" padding="md">
            <Kicker>Your interview</Kicker>
            {message && message !== panelText ? (
              <Notice role="alert" tone="warning" className="mt-4">
                {message}
              </Notice>
            ) : null}
            <div className="mt-4 flex flex-1 flex-col">
              {!configured ? (
                <Notice tone="info">{notices.unavailable}</Notice>
              ) : !allowed ? (
                <>
                  <p className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                    <span aria-hidden="true" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lavender text-ink">
                      <Lock size={14} />
                    </span>
                    {notices.upgrade}
                  </p>
                  <div className="mt-auto pt-6">
                    <ButtonLink href="/pricing" full arrow>
                      See plans
                    </ButtonLink>
                  </div>
                </>
              ) : active ? (
                <>
                  <p className="text-[15px] leading-relaxed text-ink">
                    You have this interview in progress. Everything you have said so far is saved.
                  </p>
                  <div className="mt-auto pt-6">
                    <ButtonLink href={`/app/interview/${active.id}`} full arrow size="lg">
                      Continue your interview
                    </ButtonLink>
                  </div>
                </>
              ) : blocked ? (
                <>
                  <p className="text-[15px] leading-relaxed text-ink">{blockedMessage(blocked)}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-6">
                    {finished ? (
                      <ButtonLink href={`/app/debrief/${finished.id}`} variant="secondary" full arrow>
                        See your debrief
                      </ButtonLink>
                    ) : null}
                    <ButtonLink href="/pricing" full arrow>
                      See plans
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-relaxed text-ink">
                    The interviewer opens with the case. Take a moment, then answer as you would out loud.
                  </p>
                  {!paid && c.free_starter ? (
                    <p className="mt-3 rounded-2xl bg-lime/60 px-4 py-3 text-sm text-lime-ink">
                      This uses your free AI interview, with a full scored debrief.
                    </p>
                  ) : null}
                  <form action={startInterviewAction} className="mt-auto pt-6">
                    <input type="hidden" name="slug" value={c.slug} />
                    <Button type="submit" size="lg" full arrow>
                      Start the interview
                    </Button>
                  </form>
                  <p className="mt-3 text-center text-xs text-subtle">You can leave and come back: each reply is saved.</p>
                </>
              )}
            </div>
          </Card>
        }
      >
        <figure className="rounded-[1.5rem] bg-surface/85 p-5 ring-1 ring-inset ring-line sm:p-6">
          <figcaption className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">The case</figcaption>
          <blockquote className="mt-3 text-[17px] leading-relaxed text-ink sm:text-lg">{c.prompt}</blockquote>
        </figure>
      </AppHeader>

      <Container className="mt-4 grid gap-4 lg:grid-cols-3">
        <section aria-labelledby="stages-title" className="bg-night-glow relative overflow-hidden rounded-[1.75rem] p-6 text-on-night sm:p-8 lg:col-span-2">
          <Kicker onNight>What to expect</Kicker>
          <h2 id="stages-title" className="mt-4 text-2xl font-medium tracking-tight text-white sm:text-3xl">
            Five stages, <span className="serif-accent text-lime">like the real thing</span>
          </h2>
          <ol className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {STAGES.map((s, i) => (
              <li key={s.name} className="flex gap-3 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-inset ring-white/10 sm:last:col-span-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime font-mono text-xs font-semibold text-lime-ink">{i + 1}</span>
                <span>
                  <span className="block font-medium text-white">{s.name}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-on-night-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-on-night-muted">
            At the end you get a debrief that scores five skills out of 5. Your maths is checked by code against the case numbers.
          </p>
        </section>

        <div className="grid gap-4">
          <Card>
            <h2 className="text-lg font-medium tracking-tight text-ink">Tools beside the chat</h2>
            <ul className="mt-4 space-y-3">
              {TOOLS.map((t) => (
                <li key={t.name} className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink ring-1 ring-inset ring-line">
                    {t.icon}
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium text-ink">{t.name}</span>
                    <span className="block text-muted">{t.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="butter">
            <h2 className="text-lg font-medium tracking-tight text-ink">Good to know</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80">
              <li>Up to {siteConfig.limits.candidateTurnsPerSession} replies, {SESSION_CAPS.maxMessageChars.toLocaleString("en-US")} characters each.</li>
              <li>A real case interview usually lasts 25 to 40 minutes.</li>
              <li className="flex gap-2">
                <Shield size={16} className="mt-0.5 shrink-0" />
                <span>Don&rsquo;t share personal details in the chat.</span>
              </li>
            </ul>
          </Card>
        </div>
      </Container>
      <div className="h-6 sm:h-10" />
    </>
  );
}
