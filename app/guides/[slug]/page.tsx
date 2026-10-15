import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArticleHeader, MetaRow, PractiseCta, tocFromBlocks } from "@/components/learn/article";
import { DesktopToc, MobileToc } from "@/components/learn/article-toc";
import { articleJsonLd, breadcrumbJsonLd, pageOpenGraph } from "@/components/learn/seo";
import { CaseCard } from "@/components/marketing/case-card";
import { Eyebrow } from "@/components/ui/badge";
import { IconBadge } from "@/components/ui/card";
import { Faq, faqJsonLd, JsonLd } from "@/components/ui/faq";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bolt, Calculator, ChartBars, Clock, Layers, Refresh, Target } from "@/components/ui/icons";
import { Container, SectionHeading } from "@/components/ui/layout";
import { Prose } from "@/components/ui/prose";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toCaseSummary } from "@/lib/content/public";
import { allGuides, findGuide, formatDate, splitTitle } from "@/lib/content/writing";
import { CATEGORY_INFO, drillsByCategory, type DrillCategory } from "@/lib/drills";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

export const dynamicParams = false;

export function generateStaticParams() {
  return allGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  const path = `/guides/${guide.slug}`;
  return {
    title: { absolute: guide.seo_title },
    description: guide.description,
    alternates: { canonical: path },
    openGraph: pageOpenGraph({ type: "article", title: guide.seo_title, description: guide.description, path, modifiedTime: guide.updated }),
  };
}

const DRILL_TONES: Record<DrillCategory, string> = {
  "mental-maths": "bg-butter",
  "market-sizing": "bg-sky",
  frameworks: "bg-mint",
  "chart-reading": "bg-peach",
};

const DRILL_ICONS: Record<DrillCategory, ReactNode> = {
  "mental-maths": <Calculator size={20} />,
  "market-sizing": <Target size={20} />,
  frameworks: <Layers size={20} />,
  "chart-reading": <ChartBars size={20} />,
};

/** "a profitability case", "an M&A case", "an operations case". */
function aCaseOf(label: string | undefined): string {
  if (!label) return "a full case";
  const noun = label === "M&A" ? label : label.toLowerCase();
  return `${/^(?:[aeiou]|M&A)/i.test(noun) ? "an" : "a"} ${noun} case`;
}

/** "Title: rest" -> the rest in the italic serif; "Title (aside)" -> the aside in the serif. */
function GuideTitle({ title }: { title: string }) {
  const { main, rest } = splitTitle(title);
  if (rest) {
    return (
      <>
        {main}: <span className="serif-accent">{rest}</span>
      </>
    );
  }
  const paren = /^(.*?)\s*(\([^)]*\))$/.exec(title);
  if (paren) {
    return (
      <>
        {paren[1]} <span className="serif-accent">{paren[2]}</span>
      </>
    );
  }
  return <>{title}</>;
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  const guides = allGuides();
  const index = guides.findIndex((g) => g.slug === guide.slug);
  const previous = index > 0 ? guides[index - 1] : undefined;
  const next = index < guides.length - 1 ? guides[index + 1] : undefined;

  const path = `/guides/${guide.slug}`;
  const { main } = splitTitle(guide.title);
  const typeLabel = guide.case_type ? CASE_TYPE_LABELS[guide.case_type] : undefined;
  const examples = guide.blocks.filter((b) => b.type === "example").length;
  const toc = [...tocFromBlocks(guide.blocks), ...(guide.faq.length > 0 ? [{ id: "faq", text: "Common questions" }] : [])];

  const cases = guide.case_type
    ? visibleCases()
        .filter((c) => c.type === guide.case_type)
        .sort((a, b) => Number(b.free_starter) - Number(a.free_starter) || Number(b.free_preview) - Number(a.free_preview) || a.difficulty - b.difficulty)
        .slice(0, 3)
    : [];
  const drills = guide.related_drills;
  const hasPractice = drills.length > 0 || cases.length > 0;

  return (
    <>
      <ArticleHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
        ]}
        current={main}
        eyebrow={<Eyebrow tone="brand">{typeLabel ? `Case type · ${typeLabel}` : "Skill guide"}</Eyebrow>}
        title={<GuideTitle title={guide.title} />}
        meta={
          <MetaRow
            items={[
              { icon: <Clock size={15} />, label: `${guide.reading_minutes} min read` },
              { icon: <Refresh size={15} />, label: <time dateTime={guide.updated}>Updated {formatDate(guide.updated, "short")}</time> },
              ...(examples > 0 ? [{ icon: <Calculator size={15} />, label: `${examples} worked example${examples === 1 ? "" : "s"}` }] : []),
            ]}
          />
        }
        aside={
          <div className="rounded-[1.5rem] bg-surface p-6 shadow-float ring-1 ring-inset ring-line sm:p-7">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-lime ring-2 ring-lime/30" />
              The short answer
            </p>
            <p className="mt-3 text-[16px] leading-relaxed text-ink">{guide.summary}</p>
          </div>
        }
      />

      <Container className="mt-10 sm:mt-14">
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,44rem)] lg:justify-center lg:gap-14 xl:gap-20">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <DesktopToc items={toc} />
              {hasPractice ? (
                <div className="rounded-[1.5rem] bg-surface-2 p-5 ring-1 ring-inset ring-line">
                  <p className="text-sm font-semibold text-ink">Practise it</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">Reading helps. Saying it out loud to an interviewer is what sticks.</p>
                  <Link href="#practise" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    Cases and drills <ArrowRight size={14} />
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            <MobileToc items={toc} className="mb-10 lg:hidden" />
            <article aria-label={guide.title}>
              <Prose blocks={guide.blocks} />
            </article>

            {guide.faq.length > 0 ? (
              <section aria-labelledby="faq" className="mt-16">
                <h2 id="faq" className="scroll-mt-28 text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">
                  Common questions
                </h2>
                <Faq items={guide.faq} className="mt-6" />
                <JsonLd data={faqJsonLd(guide.faq)} />
              </section>
            ) : null}

            <nav aria-label="More guides" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
              {previous ? (
                <Link href={`/guides/${previous.slug}`} className="group rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-shadow hover:shadow-float">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                    <ArrowLeft size={14} /> Previous guide
                  </span>
                  <span className="mt-2 block font-medium leading-snug text-ink">{splitTitle(previous.title).main}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link href={`/guides/${next.slug}`} className="group rounded-[1.5rem] bg-surface p-5 text-right ring-1 ring-inset ring-line transition-shadow hover:shadow-float">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                    Next guide <ArrowRight size={14} />
                  </span>
                  <span className="mt-2 block font-medium leading-snug text-ink">{splitTitle(next.title).main}</span>
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      </Container>

      {hasPractice ? (
        <section id="practise" aria-labelledby="practise-title" className="scroll-mt-24">
          <Container className="mt-20 sm:mt-28">
            <SectionHeading
              align="left"
              id="practise-title"
              eyebrow="Put it into practice"
              title={
                <>
                  Now <span className="serif-accent">try it</span> yourself
                </>
              }
              intro={
                cases.length > 0
                  ? `Short drills for the skills in this guide, then ${aCaseOf(typeLabel)} to run with the AI interviewer.`
                  : "Short drills for the skills in this guide, with instant feedback. Try a few without an account."
              }
            />

            {drills.length > 0 ? (
              <ul className={cn("mt-10 grid gap-4 sm:grid-cols-2", drills.length === 3 ? "lg:grid-cols-3" : drills.length >= 4 ? "lg:grid-cols-4" : undefined)}>
                {drills.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/drills/${cat}`}
                      className={cn("group flex h-full flex-col rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float", DRILL_TONES[cat])}
                    >
                      <div className="flex items-center justify-between">
                        <IconBadge tone="surface">{DRILL_ICONS[cat] ?? <Bolt size={20} />}</IconBadge>
                        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-ink">{drillsByCategory(cat).length} drills</span>
                      </div>
                      <h3 className="mt-7 text-lg font-medium tracking-tight text-ink">{CATEGORY_INFO[cat].title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{CATEGORY_INFO[cat].blurb}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-ink">
                        Start <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {cases.length > 0 ? (
              <div className="mt-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h3 className="text-xl font-medium tracking-tight text-ink">{typeLabel} cases to practise</h3>
                  <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    All cases <ArrowUpRight size={15} />
                  </Link>
                </div>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cases.map((c) => (
                    <li key={c.slug}>
                      <CaseCard c={toCaseSummary(c)} headingLevel="h3" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      <Container className="mt-20 sm:mt-28">
        <PractiseCta
          title={
            <>
              Practise {aCaseOf(typeLabel)} <span className="serif-accent">out loud</span>
            </>
          }
          text={`Run a realistic case with an AI interviewer that pushes back and checks your maths, then get a scored debrief. Your first full interview is free, with ${siteConfig.limits.free.drillsPerDay} drills a day.`}
          primary={{ href: "/login", label: "Start free, no card needed" }}
          secondary={{ href: "/cases", label: "Browse the cases" }}
        />
      </Container>

      <JsonLd data={articleJsonLd({ headline: guide.title, description: guide.description, path, dateModified: guide.updated })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: main, path },
        ])}
      />
    </>
  );
}
