import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { collectionPageJsonLd } from "@/components/practice/metadata";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Bolt, Book, Calculator, ChartBars, Check, Layers, Lock, Sparkle, Target } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { allGuides, splitTitle } from "@/lib/content/writing";
import { allDrills, CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory, type DrillCategory } from "@/lib/drills";
import { findTool } from "@/lib/tools";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { drillImage, pageImage } from "@/lib/images";

const TITLE = "Case interview drills";
const DESCRIPTION =
  "Practise the skills case interviews test: mental maths, market sizing, structuring problems and reading charts. Free to try, with instant feedback.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/drills" },
};

// Every count here comes from the drills themselves or site.config.ts (rule 2.4).

const CARD: Record<DrillCategory, { bg: string; icon: ReactNode }> = {
  "mental-maths": { bg: "bg-butter", icon: <Calculator size={20} /> },
  "market-sizing": { bg: "bg-sky", icon: <Target size={20} /> },
  frameworks: { bg: "bg-mint", icon: <Layers size={20} /> },
  "chart-reading": { bg: "bg-peach", icon: <ChartBars size={20} /> },
};

/** A small decorative picture for each kind of drill. Hidden from screen readers; the card text says it all. */
function Illustration({ category }: { category: DrillCategory }) {
  const tile = "rounded-xl bg-surface/80 ring-1 ring-inset ring-line";
  const dark = "rounded-xl bg-ink text-ink-contrast";
  switch (category) {
    case "mental-maths":
      return (
        <div aria-hidden="true" className="flex flex-wrap gap-2 font-mono text-[13px] text-ink">
          {["15% of 240", "1.2m ÷ 40", "+8% on 350", "margin 30%"].map((t, i) => (
            <span key={t} className={cn(i === 1 ? dark : tile, "px-3 py-2")}>
              {t}
            </span>
          ))}
        </div>
      );
    case "market-sizing":
      return (
        <div aria-hidden="true" className="space-y-1.5 text-[12px] text-ink/80">
          {[
            ["Population", 100],
            ["× who buy", 72],
            ["× how often", 50],
            ["× price", 34],
          ].map(([label, w]) => (
            <div key={label as string} className="flex items-center gap-3">
              <span className={cn(tile, "h-6")} style={{ width: `${w}%` }} />
              <span className="shrink-0">{label}</span>
            </div>
          ))}
        </div>
      );
    case "frameworks":
      return (
        <div aria-hidden="true" className="flex flex-col items-start gap-2 text-[12px] font-medium text-ink">
          <span className={cn(dark, "px-3 py-1.5")}>Profit</span>
          <div className="ml-4 flex gap-2 border-l-2 border-ink/15 pl-3">
            <div className="flex flex-col gap-1.5">
              <span className={cn(tile, "px-3 py-1.5")}>Revenue</span>
              <span className="ml-3 text-ink/60">price × volume</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={cn(tile, "px-3 py-1.5")}>Costs</span>
              <span className="ml-3 text-ink/60">fixed + variable</span>
            </div>
          </div>
        </div>
      );
    case "chart-reading":
      return (
        <div aria-hidden="true" className="flex h-20 items-end gap-2">
          {[45, 70, 38, 92, 60].map((h, i) => (
            <span key={i} className={cn("w-7 rounded-t-lg", i === 3 ? "bg-ink" : "bg-surface/80 ring-1 ring-inset ring-line")} style={{ height: `${h}%` }} />
          ))}
        </div>
      );
  }
}

export default function DrillsPage() {
  const { free, anonymous } = siteConfig.limits;
  const trainer = findTool("mental-maths-trainer");
  const guides = allGuides().filter((g) => g.kind === "skill");

  const how = [
    { icon: <Bolt size={18} />, title: "Instant feedback", text: "Check your answer and see the worked explanation straight away." },
    { icon: <Sparkle size={18} />, title: "No account to start", text: `Try ${anonymous.drillsPerSession} drills before we ask you to sign up.` },
    { icon: <Check size={18} />, title: `${free.drillsPerDay} a day, free`, text: "A free account gives you a daily allowance and keeps your history." },
    { icon: <Lock size={18} />, title: "Unlimited on paid plans", text: `Every paid plan includes unlimited drills, from $${siteConfig.prices.monthly} a month.` },
  ];

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          path: "/drills",
          items: DRILL_CATEGORIES.map((category) => ({ name: `${CATEGORY_INFO[category].title} drills`, path: `/drills/${category}` })),
        })}
      />
      <PageHeader
        image={pageImage("drills")}
        eyebrow={<Eyebrow icon={<Bolt size={14} />}>{allDrills.length} drills, free to try</Eyebrow>}
        title={
          <>
            Case interview <span className="serif-accent">drills</span>
          </>
        }
        intro={`Short practice questions for the skills case interviews test, with instant feedback. Try a few with no account; a free account gives you ${free.drillsPerDay} drills a day.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/drills/${DRILL_CATEGORIES[0]}`} size="lg" arrow>
            Start with {CATEGORY_INFO[DRILL_CATEGORIES[0]].title.toLowerCase()}
          </ButtonLink>
          <ButtonLink href="/cases" variant="secondary" size="lg">
            Practise a full case
          </ButtonLink>
        </div>
      </PageHeader>

      {/* The four kinds of drill */}
      <Container className="mt-10 sm:mt-14">
        <ul className="grid gap-4 md:grid-cols-2">
          {DRILL_CATEGORIES.map((category) => {
            const info = CATEGORY_INFO[category];
            const count = drillsByCategory(category).length;
            const photo = drillImage(category);
            return (
              <li key={category}>
                <Link
                  href={`/drills/${category}`}
                  className={cn(
                    "group flex h-full flex-col rounded-[1.75rem] p-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float",
                    CARD[category].bg,
                  )}
                >
                  {/* The photo, or (for a kind of drill without one) a dotted panel with its icon. Inside the link, so decorative. */}
                  {photo ? (
                    <Photo
                      photo={photo}
                      decorative
                      sizes="(min-width: 1280px) 580px, (min-width: 768px) calc(50vw - 3rem), calc(100vw - 3rem)"
                      className="h-44 rounded-[1.4rem] sm:h-52"
                      imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div aria-hidden="true" className="relative grid h-44 place-items-center overflow-hidden rounded-[1.4rem] bg-surface/45 sm:h-52">
                      <div className="bg-dots absolute inset-0 opacity-80 [mask-image:radial-gradient(70%_85%_at_50%_50%,black,transparent)]" />
                      <span className="relative text-ink/20 [&>svg]:size-16">{CARD[category].icon}</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="relative -mt-6 flex items-end justify-between gap-3 pl-1">
                      <IconBadge tone="surface" className="shadow-soft">
                        {CARD[category].icon}
                      </IconBadge>
                      <span data-drill-count className="rounded-full bg-surface px-3 py-1 text-sm font-medium tabular-nums text-ink">
                        {count} drills
                      </span>
                    </div>
                    <h2 className="mt-6 text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">{info.title}</h2>
                    <p className="mt-2 max-w-sm leading-relaxed text-ink/70">{info.blurb}</p>
                    <div className="mt-6 sm:mt-8">
                      <Illustration category={category} />
                    </div>
                    <span className="mt-auto inline-flex items-center gap-2 pt-8 text-[15px] font-medium text-ink">
                      Start practising
                      <span className="grid size-8 place-items-center rounded-full bg-ink text-ink-contrast transition-transform duration-300 group-hover:rotate-45">
                        <ArrowUpRight size={15} />
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>

      {/* How drills work */}
      <Container className="mt-16 sm:mt-20">
        <section aria-labelledby="how-drills" className="bg-night-glow relative overflow-hidden rounded-[2rem] px-6 py-12 text-on-night sm:px-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:items-start">
            <div>
              <Kicker onNight>How drills work</Kicker>
              <h2 id="how-drills" className="mt-4 text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">
                Five minutes, <span className="serif-accent text-lime">instant feedback</span>
              </h2>
              <p className="mt-4 leading-relaxed text-on-night-muted">
                Answers are checked on our server, so you only see the working once you have had a go.
              </p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {how.map((h) => (
                <div key={h.title} className="rounded-[1.5rem] bg-white/[0.05] p-5 ring-1 ring-inset ring-white/10">
                  <dt className="flex items-center gap-3 font-medium text-white">
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-white/10 text-lime ring-1 ring-inset ring-white/15">
                      {h.icon}
                    </span>
                    {h.title}
                  </dt>
                  <dd className="mt-3 text-sm leading-relaxed text-on-night-muted">{h.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Container>

      {/* Keep going: the trainer and the guides */}
      <Container className="mb-16 mt-16 sm:mb-24 sm:mt-20">
        <section aria-labelledby="keep-going">
          <Kicker>Keep going</Kicker>
          <h2 id="keep-going" className="mt-3 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Learn the method, <span className="serif-accent">then drill it</span>
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            {trainer ? (
              <Link
                href={`/tools/${trainer.slug}`}
                className="group flex flex-col rounded-[1.75rem] bg-lime p-7 text-lime-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <IconBadge tone="surface">
                    <Calculator size={20} />
                  </IconBadge>
                  <ArrowUpRight size={20} className="opacity-60 transition-transform duration-300 group-hover:rotate-45" />
                </div>
                <p className="mt-8 font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">Free tool</p>
                <p className="mt-2 text-2xl font-medium tracking-tight">{trainer.title}</p>
                <p className="mt-2 leading-relaxed opacity-80">{trainer.short}</p>
              </Link>
            ) : null}
            <ul className="grid gap-3">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group flex h-full items-center gap-4 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-6"
                  >
                    <IconBadge>
                      <Book size={20} />
                    </IconBadge>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug text-ink">{splitTitle(g.title).main}</span>
                      <span className="mt-1 block text-sm text-muted">Guide · {g.reading_minutes} min read</span>
                    </span>
                    <ArrowUpRight size={18} className="shrink-0 text-subtle transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Container>
    </>
  );
}
