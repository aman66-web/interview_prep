import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FrameworkPreview, GuideCard, type GuideTone } from "@/components/learn/guide-card";
import { pageOpenGraph } from "@/components/learn/seo";
import { Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { ArrowUpRight, Book, Calculator, Check, Info, Layers, Target } from "@/components/ui/icons";
import { Container, PageHeader, SectionHeading } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { practiceFirms, SECTOR_LABELS } from "@/lib/content/practice";
import { allGuides, formatDate, glossary, lastChecked, visibleFirms } from "@/lib/content/writing";
import type { Guide } from "@/lib/content/writing-schema";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { pageImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Case interview guides",
  description:
    "Free guides to the seven common consulting case types, plus structuring, case maths and practising alone. Worked examples with every number checked.",
  alternates: { canonical: "/guides" },
  openGraph: pageOpenGraph({
    title: "Case interview guides",
    description: "Free guides to the seven common consulting case types, plus structuring, case maths and practising alone.",
    path: "/guides",
  }),
};

// The bento layout for the seven case-type guides, in the order of lib/content/all-writing.ts.
const CASE_TYPE_LAYOUT: { tone: GuideTone; span: string }[] = [
  { tone: "lavender", span: "md:col-span-2 lg:col-span-4" },
  { tone: "sky", span: "lg:col-span-2" },
  { tone: "butter", span: "lg:col-span-2" },
  { tone: "peach", span: "lg:col-span-2" },
  { tone: "mint", span: "lg:col-span-2" },
  { tone: "surface", span: "lg:col-span-3" },
  { tone: "night", span: "lg:col-span-3" },
];

const SKILL_ICONS: Record<string, ReactNode> = {
  "how-to-structure-a-case-interview": <Layers size={20} />,
  "case-interview-maths": <Calculator size={20} />,
  "how-to-practise-case-interviews-alone": <Target size={20} />,
};

function caseCountLabel(n: number) {
  return n === 0 ? "Read the guide" : `${n} practice case${n === 1 ? "" : "s"}`;
}

function firstFramework(guide: Guide) {
  const block = guide.blocks.find((b) => b.type === "framework");
  return block?.type === "framework" ? block : undefined;
}

export default function GuidesPage() {
  const guides = allGuides();
  const caseTypeGuides = guides.filter((g) => g.kind === "case_type");
  const skillGuides = guides.filter((g) => g.kind === "skill");
  const firms = visibleFirms();
  const firmGroups = (["consulting", "banking"] as const)
    .map((sector) => ({ sector, items: firms.filter((f) => f.sector === sector) }))
    .filter((g) => g.items.length > 0);
  const hasPractice = practiceFirms().length > 0;
  const cases = visibleCases();
  const terms = glossary().terms;
  const checkedExamples = guides.reduce((n, g) => n + g.blocks.filter((b) => b.type === "example" && b.checks.length > 0).length, 0);
  const sampleTerms = ["mece", "issue-tree", "contribution-margin", "break-even-point", "cagr", "synergies", "price-elasticity", "so-what"]
    .map((slug) => terms.find((t) => t.slug === slug))
    .filter((t) => t !== undefined)
    .slice(0, 8);
  const shownTerms = sampleTerms.length >= 4 ? sampleTerms : terms.slice(0, 8);
  const firmPhoto = pageImage("firm-guides");

  return (
    <>
      <PageHeader
        image={pageImage("guides")}
        eyebrow="Guides"
        title={
          <>
            Learn the method <span className="serif-accent">behind every case</span>
          </>
        }
        intro="Free, plain-English guides to the seven common case types and the skills underneath them. Each one has a starting structure, the maths you will need and worked examples."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/guides/how-to-structure-a-case-interview" size="lg" arrow>
            Start with structure
          </ButtonLink>
          <ButtonLink href="/glossary" size="lg" variant="secondary">
            Browse the glossary
          </ButtonLink>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted">
          {[`${guides.length} free guides, no account needed`, `${checkedExamples} worked examples with maths checked by our tests`, `${terms.length} glossary terms`].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-ink text-ink-contrast">
                <Check size={12} strokeWidth={2.8} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </PageHeader>

      <section aria-labelledby="case-types-title">
        <Container className="mt-16 sm:mt-24">
          <SectionHeading
            align="left"
            id="case-types-title"
            eyebrow="Case types"
            title={
              <>
                Seven case types, <span className="serif-accent">one clear approach each</span>
              </>
            }
            intro="What each type of case asks, a structure to start from, the maths it tends to need and the mistakes that cost candidates most."
          />
          <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {caseTypeGuides.map((g, i) => {
              const layout = CASE_TYPE_LAYOUT[i % CASE_TYPE_LAYOUT.length];
              const type = g.case_type ?? "other";
              const count = cases.filter((c) => c.type === type).length;
              const framework = i === 0 ? firstFramework(g) : undefined;
              return (
                <li key={g.slug} className={layout.span}>
                  <GuideCard
                    guide={g}
                    label={CASE_TYPE_LABELS[type] ?? "Case type"}
                    tone={layout.tone}
                    size={i === 0 ? "lg" : "md"}
                    footnote={caseCountLabel(count)}
                    visual={
                      framework ? (
                        <FrameworkPreview
                          title={framework.title}
                          root={type === "profitability" ? "Profit" : CASE_TYPE_LABELS[type] ?? "Case"}
                          branches={framework.branches.slice(0, 4)}
                        />
                      ) : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="skills-title">
        <Container className="mt-20 sm:mt-28">
          <SectionHeading
            align="left"
            id="skills-title"
            eyebrow="Skills"
            title={
              <>
                The skills <span className="serif-accent">underneath</span> every case
              </>
            }
            intro="Structuring, case maths and a way to practise on your own. Read these first if you are new to case interviews."
          />
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {skillGuides.map((g) => (
              <li key={g.slug}>
                <GuideCard guide={g} label="Skill" tone="surface" icon={<IconBadge tone="ink">{SKILL_ICONS[g.slug] ?? <Book size={20} />}</IconBadge>} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="firms" aria-labelledby="firms-title" className="mt-20 scroll-mt-24 px-3 sm:mt-28 sm:px-4">
        <div className="bg-night-glow relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2.25rem] text-on-night">
          <Container className="py-16 sm:py-24">
            <div className={cn("grid gap-8 lg:grid-cols-[1fr_1fr]", firmPhoto ? "lg:items-center lg:gap-12" : "lg:items-end")}>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-on-night ring-1 ring-inset ring-white/15">Firm guides</span>
                <h2 id="firms-title" className="mt-5 text-[2rem] font-medium leading-[1.08] tracking-tight text-white sm:text-5xl">
                  What the firms say, <span className="serif-accent text-lime">sourced line by line</span>
                </h2>
                {firmPhoto ? (
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-on-night-muted">
                    Each firm guide sums up what the firm publishes about applying, online tests and interviews. Every line links to its source, with the date we checked it.
                  </p>
                ) : null}
              </div>
              {firmPhoto ? (
                // A generic lobby, shown as decoration only: it is no firm's office (rule 2.3).
                <Photo photo={firmPhoto} decorative backdrop={false} sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, calc(100vw - 4rem)" className="aspect-[16/9] rounded-[1.75rem]" />
              ) : (
                <p className="max-w-xl text-lg leading-relaxed text-on-night-muted lg:justify-self-end">
                  Each firm guide sums up what the firm publishes about applying, online tests and interviews. Every line links to its source, with the date we checked it.
                </p>
              )}
            </div>

            {firms.length > 0 ? (
              <div className="mt-12 space-y-12">
                {firmGroups.map((group) => (
                  <div key={group.sector}>
                    <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-on-night-muted">{SECTOR_LABELS[group.sector].group}</h3>
                  <ul className={cn("mt-5 grid gap-4", group.items.length > 1 && "md:grid-cols-2", group.items.length > 2 && "lg:grid-cols-3")}>
                    {group.items.map((f) => (
                      <li key={f.slug}>
                        {/* The title's link covers the card; the card shows a lime focus outline for it (brand indigo is too dark on night). */}
                        <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-white/[0.05] p-6 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.09] has-[a:focus-visible]:bg-white/[0.09] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-lime has-[a:focus-visible]:outline-solid sm:p-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/15">
                              {f.sources.length} source{f.sources.length === 1 ? "" : "s"}
                            </span>
                            {f.status === "draft" ? <Tag tone="warning">Draft, preview only</Tag> : null}
                          </div>
                          <h4 className="mt-8 text-[1.6rem] font-medium leading-tight tracking-tight text-white">
                            <Link href={`/guides/firms/${f.slug}`} className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none">
                              {f.name}
                            </Link>
                          </h4>
                          <p className="mt-3 text-[14.5px] leading-relaxed text-on-night-muted">{f.description}</p>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                            <span className="text-sm text-on-night-muted">Checked {formatDate(lastChecked(f), "short")}</span>
                            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-lime text-lime-ink transition-transform duration-300 group-hover:rotate-45">
                              <ArrowUpRight size={16} />
                            </span>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                  </div>
                ))}
                {hasPractice ? (
                  <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                    Practice cases picked for each firm and bank <ArrowUpRight size={14} />
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="mt-12 rounded-[1.75rem] bg-white/[0.05] p-6 text-on-night-muted ring-1 ring-inset ring-white/10">
                Firm guides are being checked against the firms&rsquo; own pages and will appear here once every fact has a source.
              </p>
            )}

            <p className="mt-8 flex max-w-3xl gap-3 text-sm leading-relaxed text-on-night-muted">
              <Info size={18} className="mt-0.5 shrink-0 text-lime" />
              <span>
                {siteConfig.disclaimer} We add a firm only when its facts can be checked against its own pages or a reputable publisher.
              </span>
            </p>
          </Container>
        </div>
      </section>

      <section aria-labelledby="more-title">
        <Container className="mt-20 sm:mt-28">
          <h2 id="more-title" className="sr-only">
            More free resources
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card tone="soft" padding="lg" className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <IconBadge>
                  <Layers size={20} />
                </IconBadge>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-ink ring-1 ring-inset ring-line">{terms.length} terms</span>
              </div>
              <h3 className="mt-6 text-2xl font-medium tracking-tight">
                The <span className="serif-accent">glossary</span>
              </h3>
              <p className="mt-2 max-w-md leading-relaxed text-muted">Plain-English definitions of the terms interviewers expect you to know, each with a short example.</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {shownTerms.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/glossary#${t.slug}`}
                      className="inline-flex h-9 items-center rounded-full bg-surface px-3.5 text-sm font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:ring-line-strong"
                    >
                      {t.term}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <ButtonLink href="/glossary" variant="secondary" arrow>
                  Open the glossary
                </ButtonLink>
              </div>
            </Card>

            <Card padding="lg" className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <IconBadge tone="lime">
                  <Calculator size={20} />
                </IconBadge>
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-inset ring-line">No login</span>
              </div>
              <h3 className="mt-6 text-2xl font-medium tracking-tight">
                Free <span className="serif-accent">tools</span>
              </h3>
              <p className="mt-2 max-w-md leading-relaxed text-muted">Calculators and a trainer for the maths that comes up in almost every case.</p>
              <ul className="mt-6 divide-y divide-line rounded-[1.25rem] ring-1 ring-inset ring-line">
                {TOOLS.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/tools/${tool.slug}`} className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2">
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-ink">{tool.title}</span>
                        <span className="mt-0.5 block truncate text-sm text-muted">{tool.short}</span>
                      </span>
                      <ArrowUpRight size={16} className="shrink-0 text-subtle transition-transform group-hover:rotate-45 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <ButtonLink href="/tools" variant="secondary" arrow>
                  All free tools
                </ButtonLink>
              </div>
            </Card>
          </div>
        </Container>
      </section>
      <div className="h-16 sm:h-24" />
    </>
  );
}

