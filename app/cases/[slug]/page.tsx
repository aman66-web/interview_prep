import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseCard, CASE_TYPE_TONES, DifficultyMeter } from "@/components/marketing/case-card";
import { breadcrumbJsonLd } from "@/components/learn/seo";
import { relatedCases } from "@/components/practice/case-list";
import { ExhibitView } from "@/components/practice/exhibit-view";
import { caseDescription, pageTitle } from "@/components/practice/metadata";
import { caseOfType, caseShortName, lowerFirst } from "@/components/practice/wording";
import { Eyebrow, Kicker, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Book, Calculator, ChartBars, Check, ChevronRight, Clock, Lightbulb, Lock, Notes } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { findVisibleCase, visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_GUIDES, guideHrefForCaseType } from "@/lib/content/guide-links";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toCaseSummary, toPublicCase, type PublicCase } from "@/lib/content/public";
import { findGuide, splitTitle } from "@/lib/content/writing";
import { caseImage } from "@/lib/images";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

// One case. Everything shown comes from the public view (lib/content/public.ts):
// the prompt and, for free-preview cases, the first exhibit's data. Facts, insights,
// maths and model answers stay on the server.

export const dynamicParams = false;

export function generateStaticParams() {
  return visibleCases().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = findVisibleCase(slug);
  if (!found) return {};
  return {
    // Fitted to what search results show (components/practice/metadata.ts): no brand suffix
    // when it would push the title past 60 characters, and the prompt cut at a sentence or word.
    title: pageTitle(found.title),
    description: caseDescription(CASE_TYPE_LABELS[found.type] ?? found.type, found.prompt),
    alternates: { canonical: `/cases/${found.slug}` },
  };
}

const STYLE: Record<PublicCase["style"], { label: string; text: string }> = {
  interviewer_led: {
    label: "Interviewer-led",
    text: "The interviewer steers: they ask the next question and hand over data at the right moment.",
  },
  candidate_led: {
    label: "Candidate-led",
    text: "You drive: ask for the data you need and decide what to look at next. The interviewer answers and probes.",
  },
};

// The stages after the prompt are locked (kit section 5). Listed so people know what they get.
const STAGES = [
  { name: "Clarify", text: "Ask about the goal and the facts. The interviewer answers from the case." },
  { name: "Structure", text: "Lay out how you would break the problem down, then defend it." },
  { name: "Analysis", text: "Ask for data, read the exhibits and do the maths out loud." },
  { name: "Brainstorm", text: "Give ideas that are wide, sorted and relevant to this client." },
  { name: "Recommend", text: "Answer first, with reasons, risks and next steps. Then read your debrief." },
];

const UNLOCKS = [
  "Answers to your clarifying questions, from the case facts",
  "Exhibits during the analysis, when you ask for data or the case moves on",
  "Maths questions, with your answers checked by code",
  "A scored debrief: five skills out of 5 and one thing to fix next",
];

// The guide card takes the case type's colour.
const GUIDE_BG: Record<string, string> = {
  lavender: "bg-lavender",
  sky: "bg-sky",
  butter: "bg-butter",
  peach: "bg-peach",
  mint: "bg-mint",
  lime: "bg-lime text-lime-ink",
  neutral: "bg-surface-2 ring-1 ring-inset ring-line",
};

function startLabel(c: PublicCase) {
  return c.freeStarter ? "Start the interview (free account)" : "Practise this case";
}

/** `solid` when it overlaps the case photo, so its text never sits on a see-through panel. */
function FactsCard({ c, solid = false }: { c: PublicCase; solid?: boolean }) {
  const rows = [
    { k: "Industry", v: <span>{c.industry}</span> },
    { k: "Difficulty", v: <DifficultyMeter level={c.difficulty} className="text-sm text-ink" /> },
    {
      k: "Time",
      v: (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={15} className="text-muted" /> about {c.estMinutes} minutes
        </span>
      ),
    },
    { k: "Style", v: <span>{STYLE[c.style].label}</span> },
    { k: "Full interview", v: <span>{c.freeStarter ? "Free with an account" : "Paid plans"}</span> },
  ];
  return (
    <div className={cn("rounded-[1.75rem] p-5 shadow-float ring-1 ring-inset ring-line sm:p-6", solid ? "bg-surface" : "glass")}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">At a glance</p>
      <dl className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-muted">{r.k}</dt>
            <dd className="text-right font-medium text-ink">{r.v}</dd>
          </div>
        ))}
      </dl>
      <ButtonLink href={`/app/start/${c.slug}`} arrow full className="mt-4">
        {/* On a phone the card is too narrow for "(free account)"; the line under the button says it. */}
        {c.freeStarter ? (
          <>
            Start the interview<span className="hidden sm:inline"> (free account)</span>
          </>
        ) : (
          startLabel(c)
        )}
      </ButtonLink>
      <p className="mt-3 text-center text-xs text-muted">
        {c.freeStarter ? "Free account, no card needed." : `From $${siteConfig.prices.monthly} a month.`}
      </p>
    </div>
  );
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findVisibleCase(slug);
  if (!found) notFound();
  const c = toPublicCase(found);

  const all = visibleCases().map(toCaseSummary);
  const related = relatedCases(c, all, 3);
  const allSameType = related.length > 0 && related.every((r) => r.type === c.type);
  const starter = c.freeStarter ? null : (all.find((x) => x.freeStarter) ?? null);
  const typeLabel = CASE_TYPE_LABELS[c.type] ?? c.type;
  const tone = CASE_TYPE_TONES[c.type] ?? "neutral";

  const guideHref = guideHrefForCaseType(c.type);
  const guide = CASE_TYPE_GUIDES[c.type] ? findGuide(CASE_TYPE_GUIDES[c.type]) : undefined;
  const guideName = guide ? splitTitle(guide.title).main : `${typeLabel} case interviews`;
  const photo = caseImage(c.slug);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Cases", path: "/cases" },
          { name: c.title, path: `/cases/${c.slug}` },
        ])}
      />
      {/* Hero */}
      <Container className="pt-6 sm:pt-8">
        <div className="bg-aurora relative overflow-hidden rounded-[2rem] px-6 py-10 ring-1 ring-inset ring-line sm:px-10 sm:py-14 lg:px-12">
          <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(55%_60%_at_80%_30%,black,transparent)]" />
          <div className={cn("relative grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-14", photo && "xl:grid-cols-[1fr_24rem]")}>
            <div>
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                  <li>
                    <Link href="/cases" className="rounded-full font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                      Cases
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <ChevronRight size={14} />
                  </li>
                  <li>{typeLabel}</li>
                </ol>
              </nav>
              <h1 className="mt-6 text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">{c.title}</h1>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Tag tone={tone}>{typeLabel}</Tag>
                {c.freeStarter ? <Tag tone="ink">Free full interview</Tag> : null}
                {c.freePreview && !c.freeStarter ? <Tag tone="brand">Free preview</Tag> : null}
                {c.isDraft ? <Tag tone="warning">Draft, not yet reviewed</Tag> : null}
              </div>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                {caseOfType(typeLabel).replace(/^a/, "A")} in {lowerFirst(c.industry)}. {STYLE[c.style].text}
              </p>
            </div>
            {photo ? (
              // The case's photo with the facts card overlapping its lower edge (no text sits on the photo).
              <div className="min-w-0">
                <Photo
                  photo={photo}
                  preload
                  sizes="(min-width: 1280px) 384px, (min-width: 1024px) 352px, (min-width: 640px) calc(100vw - 8rem), calc(100vw - 5rem)"
                  className="aspect-[16/10] rounded-[1.5rem]"
                />
                <div className="relative -mt-20 sm:px-4">
                  <FactsCard c={c} solid />
                </div>
              </div>
            ) : (
              <FactsCard c={c} />
            )}
          </div>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          <div className="min-w-0 space-y-8 sm:space-y-10">
            {c.isDraft ? (
              <p role="note" className="flex items-start gap-3 rounded-2xl bg-warning-soft p-4 text-sm leading-relaxed text-ink">
                <span aria-hidden="true" className="mt-0.5 size-2 shrink-0 rounded-full bg-warning" />
                <span>
                  <strong>Draft case.</strong> It has not been checked by a human reviewer yet, so it is only visible on
                  preview sites.
                </span>
              </p>
            ) : null}

            {/* The prompt */}
            <section aria-labelledby="prompt" className="relative overflow-hidden rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-10">
              <span aria-hidden="true" className="serif-accent pointer-events-none absolute -top-6 right-6 text-[9rem] leading-none text-brand/10 sm:right-10">
                &ldquo;
              </span>
              <Kicker>Read it like the interviewer said it</Kicker>
              <h2 id="prompt" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                The case
              </h2>
              <p className="mt-5 text-lg leading-[1.65] text-ink sm:text-[1.35rem] sm:leading-[1.6]">{c.prompt}</p>
              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-butter p-4 text-sm leading-relaxed text-ink">
                <Lightbulb size={18} className="mt-0.5 shrink-0" />
                <p>Think about how you would structure this before reading on. In a real interview you would say it out loud.</p>
              </div>
            </section>

            {/* Free preview exhibit: the first exhibit's data only, never its insight */}
            {c.previewExhibit ? (
              <section aria-labelledby="exhibit" className="rounded-[1.75rem] bg-surface-2 p-5 ring-1 ring-inset ring-line sm:p-8">
                <Eyebrow tone="brand" icon={<ChartBars size={14} />}>
                  Free preview
                </Eyebrow>
                <h2 id="exhibit" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                  <span className="sr-only">Free preview: </span>
                  {c.previewExhibit.title}
                </h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                  The first exhibit from this case, shown before you start. What does it tell you, and what would you check
                  next?
                </p>
                <div className="mt-6">
                  <ExhibitView exhibit={c.previewExhibit} caption="Exhibit 1" />
                </div>
              </section>
            ) : null}

            {/* What happens */}
            <section aria-labelledby="stages" className="bg-night-glow relative overflow-hidden rounded-[1.75rem] p-6 text-on-night sm:p-10">
              <Kicker onNight>Five stages</Kicker>
              <h2 id="stages" className="mt-4 text-2xl font-medium tracking-tight text-white sm:text-3xl">
                What happens in the <span className="serif-accent text-lime">interview</span>
              </h2>
              <ol className="mt-8 space-y-0">
                {STAGES.map((s, i) => (
                  <li key={s.name} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < STAGES.length - 1 ? (
                      <span aria-hidden="true" className="absolute left-[1.0625rem] top-10 bottom-1 w-px bg-white/15" />
                    ) : null}
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs text-white ring-1 ring-inset ring-white/15">
                      0{i + 1}
                    </span>
                    <div className="pt-1.5">
                      <h3 className="font-medium text-white">{s.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-on-night-muted">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Locked: what an account unlocks. No answers are shown here. */}
            <section aria-labelledby="locked" className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-10">
              <div className="grid gap-8 md:grid-cols-[1fr_15rem] md:items-start">
                <div>
                  <IconBadge tone="ink">
                    <Lock size={20} />
                  </IconBadge>
                  <h2 id="locked" className="mt-5 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                    {c.freeStarter ? "Run this case with an AI interviewer, free" : "Practise the full case"}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">
                    The rest of the case stays hidden until you start the interview, so you meet it the way you would on
                    the day.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {UNLOCKS.map((u) => (
                      <li key={u} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                        <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                          <Check size={13} strokeWidth={2.8} />
                        </span>
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
                <div aria-hidden="true" className="hidden space-y-2.5 md:block">
                  {["Exhibit 2", "Maths check", "Your debrief"].map((t, i) => (
                    <div key={t} className="rounded-2xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
                      <div className="flex items-center justify-between text-[11px] font-medium text-subtle">
                        {t}
                        <Lock size={12} />
                      </div>
                      <div className="mt-2.5 space-y-1.5">
                        <div className="h-2 rounded-full bg-surface-3" style={{ width: `${88 - i * 12}%` }} />
                        <div className="h-2 rounded-full bg-surface-3" style={{ width: `${62 + i * 9}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-medium text-ink">
                    {c.freeStarter
                      ? "Your first full AI interview and scored debrief are free. No card needed."
                      : `The full interview is part of the paid plans (from $${siteConfig.prices.monthly} a month).`}
                  </p>
                  <p className="mt-1 text-muted">You will be asked to sign in first.</p>
                </div>
                <ButtonLink href={`/app/start/${c.slug}`} size="lg" arrow>
                  {startLabel(c)}
                </ButtonLink>
              </div>
              {starter ? (
                <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm text-muted ring-1 ring-inset ring-line">
                  New here? The free full interview is the starter case,{" "}
                  <Link href={`/cases/${starter.slug}`} className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    {caseShortName(starter.title)}
                  </Link>
                  .
                </p>
              ) : null}
            </section>
          </div>

          {/* Side column: learn the type, and what is in the room */}
          <aside aria-label="More about this case" className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {guideHref ? (
              <Link
                href={guideHref}
                className={cn(
                  "group relative block overflow-hidden rounded-[1.75rem] p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-float",
                  GUIDE_BG[tone] ?? GUIDE_BG.neutral,
                )}
              >
                <div className="flex items-start justify-between">
                  <IconBadge tone="surface">
                    <Book size={20} />
                  </IconBadge>
                  <ArrowUpRight size={18} className="opacity-60 transition-transform duration-300 group-hover:rotate-45" />
                </div>
                <p className="mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">Learn this case type</p>
                <p className="mt-2 text-xl font-medium leading-snug tracking-tight">{guideName}</p>
                <p className="mt-2 text-sm opacity-75">
                  The free guide{guide ? `, about ${guide.reading_minutes} minutes to read` : ""}.
                </p>
              </Link>
            ) : null}

            <Card padding="sm" className="p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">In the interview room</p>
              <ul className="mt-4 space-y-3 text-sm text-ink">
                {[
                  { icon: <Notes size={16} />, t: "A notes box beside the chat" },
                  { icon: <Calculator size={16} />, t: "A calculator for checking" },
                  { icon: <Clock size={16} />, t: "A timer, so you learn the pace" },
                  { icon: <ChartBars size={16} />, t: `Up to ${siteConfig.limits.candidateTurnsPerSession} turns per interview` },
                ].map((x) => (
                  <li key={x.t} className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted ring-1 ring-inset ring-line">
                      {x.icon}
                    </span>
                    {x.t}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </Container>

      {related.length > 0 ? (
        <Container className="mb-16 mt-16 sm:mb-24 sm:mt-20">
          <section aria-labelledby="related">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <Kicker>Keep practising</Kicker>
                <h2 id="related" className="mt-3 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                  {allSameType ? (
                    <>
                      More <span className="serif-accent">{lowerFirst(typeLabel)}</span> cases
                    </>
                  ) : (
                    <>
                      More cases to <span className="serif-accent">try next</span>
                    </>
                  )}
                </h2>
              </div>
              <ButtonLink href="/cases" variant="secondary" arrow>
                All cases
              </ButtonLink>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <CaseCard c={r} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      ) : (
        <div className="mb-16 sm:mb-24" />
      )}
    </>
  );
}
