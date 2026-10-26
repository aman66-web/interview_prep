import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { PaywallSeen } from "@/components/app/paywall-seen";
import { ScoreBars, ScoreRing } from "@/components/app/score-bars";
import { CASE_TYPE_TONES, DIFFICULTY_LABELS } from "@/components/marketing/case-card";
import { FirmLibraryApp } from "@/components/marketing/firm-library";
import { Kicker, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { ArrowUpRight, Book, Calculator, ChartBars, Check, Clock, Layers, Lock, Target } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { hasAccess, isPaid } from "@/lib/access";
import { formatDay, nextStep, summariseProgress, toProgressSessions, usageCounts, type SessionRow } from "@/lib/app/progress";
import { focusSkill, formatScore, overallScore, SKILLS, skillInfo, type SkillKey, type SkillScores } from "@/lib/app/skills";
import { getEntitlement } from "@/lib/auth/entitlement";
import { requireUser } from "@/lib/auth/session";
import { visibleCases } from "@/lib/content/cases";
import { pageImage } from "@/lib/images";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory, type DrillCategory } from "@/lib/drills";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const PLAN_NAMES: Record<string, string> = { monthly: "Monthly", pass90: "90-Day Pass", group: "Group" };
const DRILL_TONES: Record<DrillCategory, string> = {
  "mental-maths": "bg-butter",
  "market-sizing": "bg-sky",
  frameworks: "bg-mint",
  "chart-reading": "bg-peach",
};
const DRILL_ICONS: Record<DrillCategory, React.ReactNode> = {
  "mental-maths": <Calculator size={20} />,
  "market-sizing": <Target size={20} />,
  frameworks: <Layers size={20} />,
  "chart-reading": <ChartBars size={20} />,
};

// The signed-in home: the plan, the next step, skill scores across finished interviews
// (progress tracking), recent interviews and quick links. Everything is read as the
// signed-in user (Row Level Security), and every number is the user's own stored
// debrief: nothing here is estimated or invented. The logic is in lib/app/progress.ts.
export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_sessions")
    .select("id, case_id, started_at, completed_at, scores")
    .eq("user_id", user.id) // Row Level Security already limits this to the user; the filter is belt and braces.
    .order("started_at", { ascending: false })
    .limit(200);
  const sessions = toProgressSessions((data ?? []) as SessionRow[]);
  const entitlement = await getEntitlement(supabase);
  const paid = isPaid(entitlement);
  const tracking = hasAccess(entitlement, "progress_tracking");

  const cases = visibleCases();
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const progress = summariseProgress(sessions);
  const usage = usageCounts(sessions);
  const finishedCount = sessions.filter((s) => s.completedAt !== null && !s.closed).length;
  const step = nextStep({ sessions, cases, paid, freeAllowance: siteConfig.limits.free.aiCasesTotal });
  const freeUsed = usage.total >= siteConfig.limits.free.aiCasesTotal;

  // Paid plans see averages across every finished interview; free accounts see their latest debrief.
  const latest = progress.scored[0];
  const shown: SkillScores | null = tracking ? progress.averages : (latest?.debrief.scores ?? null);
  const shownOverall = shown ? overallScore(shown) : null;
  // The lowest skill, or null when all five are level (the debrief page does the same).
  const focus = shown ? focusSkill(shown) : null;

  return (
    <>
      <AppHeader
        image={pageImage("dashboard")}
        eyebrow="Your practice"
        title={
          sessions.length === 0 ? (
            <>
              Let&rsquo;s run your <span className="serif-accent">first case</span>
            </>
          ) : (
            <>
              Welcome back. <span className="serif-accent">Keep sparring.</span>
            </>
          )
        }
        intro={
          <p>
            Signed in as <strong className="font-medium text-ink">{user.email}</strong>.
          </p>
        }
        aside={<NextStepCard step={step} caseById={caseById} sessions={sessions} freeUsed={freeUsed} />}
      >
        <ul className="mb-4 flex flex-wrap gap-2 text-sm text-muted">
          {(sessions.length === 0
            ? ["Five stages, from clarifying to recommending", "Maths checked by code", "Five skills scored"]
            : [
                `Last interview ${formatDay(sessions[0].startedAt)}`,
                ...(progress.inProgress.length > 0 ? [`${progress.inProgress.length} in progress`] : []),
              ]
          ).map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 ring-1 ring-inset ring-line">
              <Check size={13} strokeWidth={2.6} className="text-brand" />
              {t}
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Interviews finished", value: String(finishedCount), hint: null },
            {
              label: tracking ? "Average score" : "Latest score",
              value: shownOverall !== null ? formatScore(shownOverall) : "–",
              hint: shownOverall !== null ? "/5" : null,
            },
            {
              label: "Maths right",
              value: progress.maths.attempted > 0 ? `${progress.maths.correct}/${progress.maths.attempted}` : "–",
              hint: null,
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-1 rounded-2xl bg-surface p-3.5 ring-1 ring-inset ring-line sm:p-5">
              <dt className="text-xs leading-snug text-muted sm:text-sm">{s.label}</dt>
              <dd className="text-2xl font-medium tracking-tight text-ink tabular-nums sm:text-4xl">
                {s.value}
                {s.hint ? <span className="text-base text-subtle sm:text-xl">{s.hint}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </AppHeader>

      <Container className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Skills: the progress chart */}
        <Card className="lg:col-span-2" padding="none">
          <section aria-labelledby="skills-title" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="skills-title" className="text-2xl font-medium tracking-tight text-ink">
                  Your skills
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {shown
                    ? tracking
                      ? `Average across ${progress.scored.length} finished interview${progress.scored.length === 1 ? "" : "s"}, out of 5.`
                      : "From your latest debrief, out of 5."
                    : "Scored out of 5 in every debrief."}
                </p>
              </div>
              {shownOverall !== null ? (
                <div className="flex items-center gap-3">
                  <div className="relative grid place-items-center">
                    <ScoreRing value={shownOverall} size={72} />
                    <span className="absolute font-mono text-lg font-medium tabular-nums text-ink">{formatScore(shownOverall)}</span>
                  </div>
                  <p className="text-sm leading-snug text-muted">
                    {tracking ? "Average" : "Overall"}
                    <br />
                    out of 5
                  </p>
                </div>
              ) : null}
            </div>

            {shown ? (
              <ScoreBars
                className="mt-7"
                items={SKILLS.map((s) => ({
                  key: s.key,
                  label: s.label,
                  value: shown[s.key],
                  display: formatScore(shown[s.key]),
                  ariaLabel: `${s.label}: ${formatScore(shown[s.key])} out of 5${tracking ? " on average" : ""}`,
                  flag: s.key === focus ? { text: "Focus next", tone: "focus" as const } : undefined,
                }))}
              />
            ) : (
              <div className="mt-7">
                <ul aria-hidden="true" className="space-y-4">
                  {SKILLS.map((s, i) => (
                    <li key={s.key}>
                      <div className="flex justify-between text-sm text-subtle">
                        <span>{s.label}</span>
                        <span className="font-mono">–/5</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-line-strong/50" style={{ width: `${[64, 48, 72, 56, 40][i]}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-2xl bg-surface-2 p-4 text-sm text-muted ring-1 ring-inset ring-line">
                  Your scores for each skill appear here after your first debrief.
                </p>
              </div>
            )}
            {shown && !tracking && progress.scored.length > 1 ? (
              <p className="mt-6 text-sm text-muted">
                Averages across all your interviews come with the paid plans.{" "}
                <Link href="/pricing" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  Compare plans
                </Link>
              </p>
            ) : null}
          </section>
        </Card>

        <PlanCard
          paid={paid}
          planName={paid ? (PLAN_NAMES[entitlement?.plan ?? ""] ?? "Paid") : "Free"}
          planId={entitlement?.plan ?? "free"}
          expires={paid && entitlement?.expires_at ? formatDay(entitlement.expires_at) : null}
          usage={usage}
          freeUsed={freeUsed}
          freeInProgress={progress.inProgress.length > 0}
          freeNotOpen={step.kind === "starter_unavailable"}
        />

        {/* Recent interviews */}
        <Card className="flex flex-col lg:col-span-2" padding="none">
          <section aria-labelledby="interviews-title" className="flex flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 px-6 pt-6 sm:px-8 sm:pt-8">
              <h2 id="interviews-title" className="text-2xl font-medium tracking-tight text-ink">
                Recent interviews
              </h2>
              {sessions.length > 0 ? (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-line">
                  {sessions.length} in total
                </span>
              ) : null}
            </div>
            {sessions.length === 0 ? (
              <div className="m-6 mt-5 rounded-2xl bg-surface-2 p-5 ring-1 ring-inset ring-line sm:m-8 sm:mt-5">
                <p className="text-[15px] text-ink">
                  You haven&rsquo;t done an AI interview yet.{paid ? "" : " Your first one is free."}
                </p>
                <p className="mt-1 text-sm text-muted">Each interview you do appears here, with its score and a link to the debrief.</p>
                <Link href="/cases" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  Browse the cases <ArrowUpRight size={15} />
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {[...sessions]
                  .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
                  .slice(0, 6)
                  .map((s) => {
                    const c = caseById.get(s.caseId);
                    const score = s.debrief ? overallScore(s.debrief.scores) : null;
                    const title = c?.title ?? "A case that is no longer available";
                    return (
                      <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4 sm:flex-nowrap sm:px-8">
                        <div className="min-w-0 grow basis-full sm:basis-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {c ? <Tag tone={CASE_TYPE_TONES[c.type] ?? "neutral"}>{CASE_TYPE_LABELS[c.type]}</Tag> : null}
                            {s.closed ? <Tag>Closed, not finished</Tag> : s.completedAt ? null : <Tag tone="warning">In progress</Tag>}
                          </div>
                          <p className="mt-1.5 truncate font-medium text-ink">{title}</p>
                          <p className="text-sm text-muted">
                            {s.completedAt ? "Finished" : "Started"} {formatDay(s.completedAt ?? s.startedAt)}
                          </p>
                        </div>
                        {score !== null ? (
                          <div className="flex w-28 shrink-0 flex-col gap-1.5" aria-label={`Overall ${formatScore(score)} out of 5`} role="img">
                            <span className="text-right font-mono text-sm tabular-nums text-ink">
                              {formatScore(score)}
                              <span className="text-subtle">/5</span>
                            </span>
                            <span className="h-1.5 rounded-full bg-surface-3">
                              <span className="block h-full rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${(score / 5) * 100}%` }} />
                            </span>
                          </div>
                        ) : null}
                        {c && !s.closed ? (
                          <Link
                            href={s.completedAt ? `/app/debrief/${s.id}` : `/app/interview/${s.id}`}
                            className={cn(
                              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                              s.completedAt
                                ? "bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2"
                                : "bg-ink text-ink-contrast hover:opacity-90",
                            )}
                          >
                            {s.completedAt ? "See the debrief" : "Continue"}
                            <span className="sr-only"> for {title}</span>
                            <ArrowUpRight size={14} />
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            )}
            {sessions.length > 0 ? (
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
                <p className="text-sm text-muted">Scores are each interview&rsquo;s average of the five skills.</p>
                <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  Browse the cases <ArrowUpRight size={15} />
                </Link>
              </div>
            ) : null}
          </section>
        </Card>

        <FocusCard focus={focus} score={focus && shown ? shown[focus] : null} levelScore={shown && !focus ? shown.structure : null} averaged={tracking} />
      </Container>

      <FirmLibraryApp className="mt-12 sm:mt-16" />

      <Container className="mt-12 sm:mt-16">
        <section aria-labelledby="practise-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 id="practise-title" className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                Keep practising <span className="serif-accent">between cases</span>
              </h2>
              <p className="mt-2 text-muted">
                Short drills with instant feedback{paid ? ", unlimited on your plan." : `: ${siteConfig.limits.free.drillsPerDay} a day on the free plan.`}
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DRILL_CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/drills/${cat}`}
                  className={cn(
                    "group flex h-full flex-col rounded-[1.75rem] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float",
                    DRILL_TONES[cat],
                  )}
                >
                  <div className="flex items-center justify-between">
                    <IconBadge tone="surface">{DRILL_ICONS[cat]}</IconBadge>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink tabular-nums">{drillsByCategory(cat).length} drills</span>
                  </div>
                  <h3 className="mt-6 text-lg font-medium tracking-tight text-ink">{CATEGORY_INFO[cat].title}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-ink">
                    Start <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/cases", icon: <Layers size={20} />, title: "The case library", text: `${cases.length} original cases with numbers that add up.` },
              { href: "/guides", icon: <Book size={20} />, title: "Case guides", text: "How each case type works, with worked examples." },
            ].map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className="group flex items-center gap-4 rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float"
                >
                  <IconBadge>{it.icon}</IconBadge>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{it.title}</span>
                    <span className="block text-sm text-muted">{it.text}</span>
                  </span>
                  <ArrowUpRight size={18} className="shrink-0 text-subtle transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>
      <div className="h-6 sm:h-10" />
    </>
  );
}

type CaseInfo = ReturnType<typeof visibleCases>[number];

/** The night panel in the header: the one thing to do next. */
function NextStepCard({
  step,
  caseById,
  sessions,
  freeUsed,
}: {
  step: ReturnType<typeof nextStep>;
  caseById: Map<string, CaseInfo>;
  sessions: { id: string; startedAt: string }[];
  /** Whether this account has started as many interviews as the free plan allows. */
  freeUsed: boolean;
}) {
  let title: React.ReactNode;
  let text: React.ReactNode;
  let c: CaseInfo | undefined;
  let action: { href: string; label: string };
  let secondary: { href: string; label: string } | null = null;

  switch (step.kind) {
    case "continue": {
      c = caseById.get(step.caseId);
      const started = sessions.find((s) => s.id === step.sessionId)?.startedAt;
      title = "Pick up where you left off";
      text = `Your interview is saved after every reply${started ? `. You started it on ${formatDay(started)}` : ""}.`;
      action = { href: `/app/interview/${step.sessionId}`, label: "Continue your interview" };
      break;
    }
    case "start_free":
      c = caseById.get(step.caseId);
      title = "Your free interview is ready";
      text = "A full AI mock case with a scored debrief. No card needed.";
      action = { href: `/app/start/${step.slug}`, label: "Start the free starter case" };
      break;
    case "case":
      c = caseById.get(step.caseId);
      if (step.locked) {
        title = "Ready for the next case?";
        text = freeUsed
          ? "You've used your free AI interview. A paid plan opens every case, like this one:"
          : "A paid plan opens every case, like this one:";
        action = { href: "/pricing", label: "Compare plans" };
        secondary = { href: `/cases/${step.slug}`, label: "Read the case" };
      } else {
        title = step.newType && c ? `Try a ${CASE_TYPE_LABELS[c.type].toLowerCase()} case next` : "Your next case";
        text = step.newType ? "A case type you haven't tried yet, so you practise a new shape of problem." : "A case you haven't tried yet.";
        action = { href: `/app/start/${step.slug}`, label: "Open the case" };
      }
      break;
    case "upgrade":
      title = freeUsed ? "You've used your free interview" : "Ready for more cases?";
      text = "A paid plan opens every case, unlimited drills and progress across interviews.";
      action = { href: "/pricing", label: "Compare plans" };
      break;
    case "starter_unavailable":
      title = "Your free interview isn't open yet";
      text = "The free starter case is still being checked before it goes live, so your free interview is unused. Warm up with the drills in the meantime.";
      action = { href: "/drills", label: "Try the drills" };
      if (caseById.size > 0) secondary = { href: "/cases", label: "Read the case prompts" };
      break;
    case "browse":
      title = "You've tried every case";
      text = "Run one again to see how your scores move, or sharpen a skill with drills.";
      action = { href: "/cases", label: "Browse the cases" };
      break;
  }

  const paywall = step.kind === "upgrade" || (step.kind === "case" && step.locked);

  return (
    <section aria-labelledby="next-title" className="bg-night-glow relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 text-on-night shadow-float sm:p-7">
      {paywall ? <PaywallSeen place="dashboard" /> : null}
      <Kicker onNight>Up next</Kicker>
      <h2 id="next-title" className="mt-4 text-2xl font-medium leading-tight tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-on-night-muted">{text}</p>
      {c ? (
        <div className="mt-5 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
          <div className="flex flex-wrap items-center gap-2 text-xs text-on-night-muted">
            <span className="rounded-full bg-lime px-2.5 py-0.5 font-medium text-lime-ink">{CASE_TYPE_LABELS[c.type]}</span>
            <span>{DIFFICULTY_LABELS[c.difficulty]}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> about {c.est_minutes} min
            </span>
            {step.kind === "case" && step.locked ? (
              <span className="inline-flex items-center gap-1">
                <Lock size={13} /> Paid plans
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-medium leading-snug text-white">{c.title}</p>
          <p className="text-sm text-on-night-muted">{c.industry}</p>
        </div>
      ) : null}
      <div className="mt-auto flex flex-col gap-2 pt-6">
        <ButtonLink href={action.href} variant="inverse" arrow full>
          {action.label}
        </ButtonLink>
        {secondary ? (
          <Link href={secondary.href} className="inline-flex h-10 items-center justify-center rounded-full text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function PlanCard({
  paid,
  planName,
  planId,
  expires,
  usage,
  freeUsed,
  freeInProgress,
  freeNotOpen,
}: {
  paid: boolean;
  planName: string;
  planId: string;
  expires: string | null;
  usage: { total: number; today: number; month: number };
  freeUsed: boolean;
  freeInProgress: boolean;
  /** The free starter case is not shown yet, so the free interview cannot be started. */
  freeNotOpen: boolean;
}) {
  const { limits } = siteConfig;
  return (
    <Card tone={paid ? "lavender" : "surface"} className="flex flex-col">
      <section aria-labelledby="plan-title" className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <Kicker>Your plan</Kicker>
          {paid ? <Tag tone="lime">Active</Tag> : null}
        </div>
        <h2 id="plan-title" className="mt-4 text-3xl font-medium tracking-tight text-ink">
          {planName}
        </h2>
        {expires ? (
          <p className="mt-1 text-sm text-ink/70">
            {planId === "monthly" ? "Paid until" : "Until"} {expires}
          </p>
        ) : null}

        {paid ? (
          <div className="mt-6 space-y-4">
            <Meter label="AI interviews today" used={usage.today} max={limits.paid.aiCasesPerDay} />
            <Meter label="AI interviews this month" used={usage.month} max={limits.paid.aiCasesPerMonth} />
            <p className="flex items-center gap-2 text-sm text-ink/80">
              <Check size={16} strokeWidth={2.4} className="text-brand" /> Every case and unlimited drills
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
              <span className="text-ink">Free AI interview</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  freeUsed || (freeNotOpen && !freeInProgress) ? "bg-surface-3 text-muted" : "bg-lime text-lime-ink",
                )}
              >
                {freeInProgress ? "In progress" : freeUsed ? "Used" : freeNotOpen ? "Not open yet" : "Ready"}
              </span>
            </li>
            <li className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
              <span className="text-ink">Drills</span>
              <span className="shrink-0 text-muted">{limits.free.drillsPerDay} a day</span>
            </li>
            <li className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
              <span className="text-ink">Case prompts</span>
              <span className="shrink-0 text-muted">Read them all</span>
            </li>
          </ul>
        )}

        <div className="mt-auto pt-6">
          {paid ? (
            <ButtonLink href="/app/account" variant="secondary" full arrow>
              Manage your plan
            </ButtonLink>
          ) : (
            <ButtonLink href="/pricing" variant="primary" full arrow>
              See the paid plans
            </ButtonLink>
          )}
        </div>
      </section>
    </Card>
  );
}

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink/80">{label}</span>
        <span className="font-mono tabular-nums text-ink">
          {used} of {max}
        </span>
      </div>
      <div aria-hidden="true" className="mt-1.5 h-1.5 rounded-full bg-surface/70">
        <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(1, used / max) * 100}%` }} />
      </div>
    </div>
  );
}

function FocusCard({
  focus,
  score,
  levelScore,
  averaged,
}: {
  focus: SkillKey | null;
  score: number | null;
  /** Set when there are scores but all five are equal: then no skill is the lowest. */
  levelScore: number | null;
  averaged: boolean;
}) {
  if (levelScore !== null) {
    return (
      <Card tone="peach" className="flex flex-col">
        <section aria-labelledby="focus-title" className="flex h-full flex-col">
          <Kicker>Practise next</Kicker>
          <h2 id="focus-title" className="mt-4 text-2xl font-medium tracking-tight text-ink">
            Your five skills are level
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            All five scored {formatScore(levelScore)} out of 5{averaged ? " on average" : ""}, so no one skill is behind the others. Pick any
            drill, or try a case type you haven&rsquo;t done yet.
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href="/drills" variant="primary" full arrow>
              Browse the drills
            </ButtonLink>
          </div>
        </section>
      </Card>
    );
  }
  if (!focus || score === null) {
    return (
      <Card tone="peach" className="flex flex-col">
        <section aria-labelledby="focus-title" className="flex h-full flex-col">
          <Kicker>Warm up</Kicker>
          <h2 id="focus-title" className="mt-4 text-2xl font-medium tracking-tight text-ink">
            Sharpen the basics first
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Five minutes of mental maths before your first case makes the analysis stage feel easier. After your first
            debrief, this card shows the skill to work on next.
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href="/drills/mental-maths" variant="primary" full arrow>
              Mental maths drills
            </ButtonLink>
          </div>
        </section>
      </Card>
    );
  }
  const skill = skillInfo(focus);
  return (
    <Card tone="peach" className="flex flex-col">
      <section aria-labelledby="focus-title" className="flex h-full flex-col">
        <Kicker>Practise next</Kicker>
        <h2 id="focus-title" className="mt-4 text-2xl font-medium tracking-tight text-ink">
          {skill.label}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          Your lowest score so far ({formatScore(score)} out of 5). A few drills on it before your next case will help most.
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <ButtonLink href={`/drills/${skill.drill}`} variant="primary" full arrow>
            {CATEGORY_INFO[skill.drill].title} drills
          </ButtonLink>
          <Link
            href={`/guides/${skill.guide.slug}`}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-center text-sm font-medium text-ink transition-colors hover:bg-surface/60"
          >
            Read: {skill.guide.title}
          </Link>
        </div>
      </section>
    </Card>
  );
}
