import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreBars, ScoreRing } from "@/components/app/score-bars";
import { ShareScore } from "@/components/share-score";
import { Kicker, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Award, Calculator, Check, Cross, Lock, Share, Sparkle, Target } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { hasAccess } from "@/lib/access";
import { storedDebriefSchema } from "@/lib/ai/schema";
import { closedUnfinishedMessage, isClosedUnfinished, isExpiredUnfinished } from "@/lib/retention/expired";
import { formatDay } from "@/lib/app/progress";
import { focusSkill, formatScore, overallScore, SKILLS, skillInfo, strongestSkill } from "@/lib/app/skills";
import { getEntitlement } from "@/lib/auth/entitlement";
import { requireUser } from "@/lib/auth/session";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { CATEGORY_INFO } from "@/lib/drills/types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/ui/cn";

export const metadata: Metadata = { title: "Your debrief", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function BackLink() {
  return (
    <Container className="pt-5">
      <Link href="/app" className="inline-flex h-9 items-center gap-1.5 rounded-full pr-3 text-sm font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft size={16} />
        Your dashboard
      </Link>
    </Container>
  );
}

export default async function DebriefPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireUser();
  const { sessionId } = await params;
  if (!UUID.test(sessionId)) notFound();

  // Read as the signed-in user: Row Level Security means only their own sessions come back.
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("case_sessions")
    .select("id, case_id, started_at, completed_at, scores")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  const c = visibleCases().find((x) => x.id === session.case_id);
  if (!c) notFound();

  // Never finished and past the retention period: the transcript is gone (or about to be),
  // so there is nothing to continue and no debrief to show (lib/retention/expired.ts).
  if (isClosedUnfinished(session.scores) || isExpiredUnfinished({ startedAt: session.started_at, completedAt: session.completed_at })) {
    return (
      <>
        <BackLink />
        <Container size="narrow" className="pt-2">
          <Card padding="lg">
            <h1 className="text-3xl font-medium tracking-tight text-ink">{c.title}</h1>
            <p className="mt-4 text-muted">{closedUnfinishedMessage()}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/cases/${c.slug}`} arrow>
                Try this case again
              </ButtonLink>
              <ButtonLink href="/app" variant="secondary">
                Back to your dashboard
              </ButtonLink>
            </div>
          </Card>
        </Container>
        <div className="h-10" />
      </>
    );
  }

  if (!session.completed_at) {
    return (
      <>
        <BackLink />
        <Container size="narrow" className="pt-2">
          <Card padding="lg" className="text-center">
            <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-lime text-lime-ink">
              <Sparkle size={22} />
            </span>
            <h1 className="mt-5 text-3xl font-medium tracking-tight text-ink">This interview isn&rsquo;t finished yet</h1>
            <p className="mx-auto mt-3 max-w-md text-muted">{c.title}. Finish it to get your scored debrief.</p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href={`/app/interview/${session.id}`} arrow size="lg">
                Continue the interview
              </ButtonLink>
            </div>
          </Card>
        </Container>
        <div className="h-10" />
      </>
    );
  }

  const parsed = storedDebriefSchema.safeParse(session.scores);
  if (!parsed.success) {
    return (
      <>
        <BackLink />
        <Container size="narrow" className="pt-2">
          <Card padding="lg">
            <h1 className="text-3xl font-medium tracking-tight text-ink">{c.title}</h1>
            <p className="mt-4 text-muted">We couldn&rsquo;t show this debrief. Please contact support and mention this interview.</p>
            <div className="mt-8">
              <ButtonLink href="/app" variant="secondary" arrow>
                Back to your dashboard
              </ButtonLink>
            </div>
          </Card>
        </Container>
        <div className="h-10" />
      </>
    );
  }
  const d = parsed.data;
  const paid = hasAccess(await getEntitlement(supabase), "model_answers");
  const overall = overallScore(d.scores);
  const values = SKILLS.map((s) => d.scores[s.key]);
  const spread = Math.max(...values) > Math.min(...values);
  // "Strongest" only when one skill is clearly ahead; "Focus next" goes to the lowest (first listed on a tie).
  const strongest = spread && values.filter((v) => v === Math.max(...values)).length === 1 ? strongestSkill(d.scores) : null;
  const weakest = focusSkill(d.scores); // null when all five scores are equal
  const focus = weakest ? skillInfo(weakest) : null;

  return (
    <>
      <BackLink />

      {/* Score hero */}
      <section aria-labelledby="debrief-title" className="px-3 pt-2 sm:px-4">
        <div className="bg-night-glow relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2.25rem] text-on-night">
          <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <Kicker onNight>
                Debrief · {CASE_TYPE_LABELS[c.type]} · {formatDay(session.completed_at)}
              </Kicker>
              <h1 id="debrief-title" className="mt-5 text-[2rem] font-medium leading-[1.06] tracking-tight text-white sm:text-5xl">
                {c.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-on-night-muted sm:text-lg">{d.summary}</p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative grid place-items-center">
                    <ScoreRing value={overall} size={104} onNight />
                    <span className="absolute text-center">
                      <span className="block font-mono text-3xl font-medium tabular-nums text-white">{formatScore(overall)}</span>
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-on-night-muted">
                    <span className="block text-base font-medium text-white">{formatScore(overall)} out of 5</span>
                    Average of the five skills
                  </p>
                </div>
                {d.maths.attempted > 0 ? (
                  <a
                    href="#maths"
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 text-sm text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/[0.12]"
                  >
                    <Calculator size={15} className="text-lime" />
                    Maths: {d.maths.correct} of {d.maths.attempted} right
                  </a>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#share"
                  className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
                >
                  <Share size={16} /> Share your scores
                </Link>
                {focus ? (
                  <ButtonLink href="#fixes" variant="inverse" arrow>
                    See what to fix next
                  </ButtonLink>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-surface p-6 text-ink shadow-float ring-1 ring-inset ring-line sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="scores" className="text-xl font-medium tracking-tight text-ink">
                  Your scores
                </h2>
                <span className="font-mono text-xs text-subtle">1 needs work · 5 strong</span>
              </div>
              <ScoreBars
                className="mt-6"
                items={SKILLS.map((s) => ({
                  key: s.key,
                  label: s.label,
                  value: d.scores[s.key],
                  display: String(d.scores[s.key]),
                  ariaLabel: `${s.label}: ${d.scores[s.key]} out of 5`,
                  flag:
                    s.key === strongest
                      ? { text: "Strongest", tone: "strong" as const }
                      : s.key === weakest
                        ? { text: "Focus next", tone: "focus" as const }
                        : undefined,
                }))}
              />
              <p className="mt-6 flex gap-2 rounded-2xl bg-surface-2 p-3.5 text-sm leading-relaxed text-muted ring-1 ring-inset ring-line">
                <Check size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-success" />
                <span>
                  Scores run from 1 (needs work) to 5 (strong). The maths part is checked by code against the case numbers, not by the AI&rsquo;s opinion.
                </span>
              </p>
            </div>
          </Container>
        </div>
      </section>

      <Container className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby="strengths">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-mint text-ink">
              <Award size={20} />
            </span>
            <h2 id="strengths" className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              What went well
            </h2>
          </div>
          {d.strengths.length === 0 ? (
            <Card tone="soft" className="mt-5">
              <p className="text-muted">Nothing stood out this time. Try the interview again and aim to say your reasoning out loud.</p>
            </Card>
          ) : (
            <ul className="mt-5 space-y-3">
              {d.strengths.map((s) => (
                <li key={s.title} className="rounded-[1.75rem] bg-mint p-6">
                  <h3 className="text-lg font-medium tracking-tight text-ink">{s.title}</h3>
                  {s.quote ? (
                    <blockquote className="mt-3 rounded-2xl bg-surface/70 px-4 py-3 text-[15.5px] italic leading-relaxed text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
                  ) : null}
                  <p className="mt-3 leading-relaxed text-ink/80">{s.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="fixes" className="scroll-mt-28">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-peach text-ink">
              <Target size={20} />
            </span>
            <h2 id="fixes" className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              What to fix next
            </h2>
          </div>
          {d.fixes.length === 0 ? (
            <Card tone="soft" className="mt-5">
              <p className="text-muted">No big fixes this time. Try a harder case.</p>
            </Card>
          ) : (
            <ul className="mt-5 space-y-3">
              {d.fixes.map((f) => (
                <li key={f.title} className="rounded-[1.75rem] bg-peach p-6">
                  <h3 className="text-lg font-medium tracking-tight text-ink">{f.title}</h3>
                  {f.quote ? (
                    <blockquote className="mt-3 rounded-2xl bg-surface/70 px-4 py-3 text-[15.5px] italic leading-relaxed text-ink">&ldquo;{f.quote}&rdquo;</blockquote>
                  ) : null}
                  <p className="mt-3 leading-relaxed text-ink/80">{f.detail}</p>
                  <div className="mt-5">
                    <ButtonLink href={`/drills/${f.drill_category}`} size="sm" arrow>
                      Practise: {CATEGORY_INFO[f.drill_category].title}
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {focus ? (
            <p className="mt-4 text-sm text-muted">
              Your lowest score was {focus.label.toLowerCase()}.{" "}
              <Link href={`/guides/${focus.guide.slug}`} className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Read: {focus.guide.title}
              </Link>
            </p>
          ) : null}
        </section>
      </Container>

      <Container className="mt-12 sm:mt-16">
        <section aria-labelledby="maths" className="scroll-mt-28">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-lime text-lime-ink">
              <Calculator size={20} />
            </span>
            <h2 id="maths" className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              The maths
            </h2>
            <Tag tone="success">Checked by code</Tag>
          </div>
          {d.maths.items.length === 0 ? (
            <Card tone="soft" className="mt-5">
              <p className="text-ink">
                You didn&rsquo;t give a number for any of the {d.maths.total} calculation{d.maths.total === 1 ? "" : "s"} in this case. In a real interview, always state the number you worked out.
              </p>
            </Card>
          ) : (
            <>
              <p className="mt-4 text-muted">
                You got {d.maths.correct} of {d.maths.attempted} answered calculation{d.maths.attempted === 1 ? "" : "s"} right (the case had {d.maths.total}).
              </p>
              <ul className={cn("mt-5 grid gap-3", d.maths.items.length > 1 ? "md:grid-cols-2" : "max-w-2xl")}>
                {d.maths.items.map((m) => (
                  <li key={m.math_id} className="flex flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={cn("grid size-9 shrink-0 place-items-center rounded-full", m.correct ? "bg-lime text-lime-ink" : "bg-peach text-ink")}
                      >
                        {m.correct ? <Check size={17} strokeWidth={2.6} /> : <Cross size={16} strokeWidth={2.4} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium leading-snug text-ink">{m.question}</h3>
                        <Tag tone={m.correct ? "success" : "warning"} className="mt-2">
                          {m.correct ? "Correct" : "Not quite"}
                        </Tag>
                      </div>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
                        <dt className="text-xs text-muted">You said</dt>
                        <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{m.given.toLocaleString("en-US")}</dd>
                      </div>
                      <div className="rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
                        <dt className="text-xs text-muted">Answer</dt>
                        <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{m.expected.toLocaleString("en-US")}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-subtle">How the numbers work</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{m.working}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </Container>

      <Container className="mt-12 sm:mt-16">
        <section aria-labelledby="model">
          {paid ? (
            <Card tone="lavender" padding="lg">
              <Kicker>Model answer</Kicker>
              <h2 id="model" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                A strong answer <span className="serif-accent">looks like this</span>
              </h2>
              <ol className="mt-6 space-y-3">
                {c.model_answer_outline.map((line, i) => (
                  <li key={line} className="flex gap-3 text-[15.5px] leading-relaxed text-ink">
                    <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-surface font-mono text-xs text-ink">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </Card>
          ) : (
            <Card tone="soft" padding="lg" className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Kicker>Model answer</Kicker>
                <h2 id="model" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                  A strong answer looks like this
                </h2>
                <p className="mt-3 flex items-start gap-2 text-muted">
                  <Lock size={17} className="mt-1 shrink-0" />
                  <span>
                    The model answer for each case is part of the paid plans.{" "}
                    <Link href="/pricing" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                      See plans
                    </Link>
                  </span>
                </p>
              </div>
              <div aria-hidden="true" className="hidden w-64 space-y-2 md:block">
                {[92, 78, 85, 64].map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="size-5 shrink-0 rounded-full bg-surface-3" />
                    <span className="h-2.5 rounded-full bg-surface-3" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      </Container>

      <Container className="mt-12 sm:mt-16">
        <div id="share" className="scroll-mt-28">
          <ShareScore sessionId={session.id} />
        </div>
      </Container>

      <Container className="mt-10 flex flex-wrap gap-3 sm:mt-12">
        <ButtonLink href="/app" arrow>
          Back to your dashboard
        </ButtonLink>
        <ButtonLink href="/cases" variant="secondary">
          Browse cases
        </ButtonLink>
      </Container>
      <div className="h-6 sm:h-10" />
    </>
  );
}
