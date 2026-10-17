import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd } from "@/components/learn/seo";
import { clipText, DESCRIPTION_MAX, pageTitle } from "@/components/practice/metadata";
import { Tag } from "@/components/ui/badge";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Book, ChevronRight, Sparkle } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { allGuides, splitTitle } from "@/lib/content/writing";
import { CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory, isDrillCategory, toPublicDrill } from "@/lib/drills";
import { findTool } from "@/lib/tools";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { DrillRunner } from "./drill-runner";

export const dynamicParams = false;

export function generateStaticParams() {
  return DRILL_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  if (!isDrillCategory(category)) return {};
  const info = CATEGORY_INFO[category];
  return {
    // Fitted to what search results show: "Frameworks and structure drills for case interviews"
    // drops the brand suffix rather than run past 60 characters.
    title: pageTitle(`${info.title} drills for case interviews`),
    description: clipText(`${info.blurb} Free practice with instant feedback.`, DESCRIPTION_MAX),
    alternates: { canonical: `/drills/${category}` },
  };
}

/** "Frameworks and structure" -> ["Frameworks and ", "structure"], so the last word can take the serif accent. */
function splitLastWord(title: string): [string, string] {
  const at = title.lastIndexOf(" ");
  return at < 0 ? ["", title] : [title.slice(0, at + 1), title.slice(at + 1)];
}

export default async function DrillCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isDrillCategory(category)) notFound();

  const info = CATEGORY_INFO[category];
  // Only the public view is sent to the browser: answers are checked on the server.
  const drills = drillsByCategory(category).map(toPublicDrill);
  const [lead, last] = splitLastWord(info.title);
  // Skill guides (maths, structuring) first, then the case-type guides that use this skill.
  const guides = allGuides()
    .filter((g) => g.related_drills.includes(category))
    .sort((a, b) => Number(Boolean(a.case_type)) - Number(Boolean(b.case_type)))
    .slice(0, 3);
  const trainer = category === "mental-maths" ? findTool("mental-maths-trainer") : undefined;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Drills", path: "/drills" },
          { name: info.title, path: `/drills/${category}` },
        ])}
      />
      <Container className="pt-6 sm:pt-8">
        <div className="bg-aurora relative overflow-hidden rounded-[2rem] px-6 py-9 ring-1 ring-inset ring-line sm:px-10 sm:py-12">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/drills" className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                  All drills
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li aria-current="page">{info.title}</li>
            </ol>
          </nav>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                {lead}
                <span className="serif-accent">{last}</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{info.blurb}</p>
            </div>
            <Tag tone="neutral" className="h-8 shrink-0 self-start px-3 text-sm sm:self-end">
              {drills.length} drills
            </Tag>
          </div>
        </div>
      </Container>

      <Container className="mb-16 mt-6 sm:mb-24 sm:mt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
          <div className="min-w-0">
            <DrillRunner
              category={category}
              drills={drills}
              dailyLimit={siteConfig.limits.free.drillsPerDay}
              anonymousLimit={siteConfig.limits.anonymous.drillsPerSession}
            />
          </div>

          <aside aria-label="More practice" className="space-y-4">
            <nav aria-label="Drill types" className="rounded-[1.75rem] bg-surface p-3 ring-1 ring-inset ring-line">
              <p className="px-3 pb-2 pt-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Drill types</p>
              <ul>
                {DRILL_CATEGORIES.map((c) => {
                  const current = c === category;
                  return (
                    <li key={c}>
                      <Link
                        href={`/drills/${c}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                          current ? "bg-ink font-medium text-ink-contrast" : "text-ink hover:bg-surface-2",
                        )}
                      >
                        {CATEGORY_INFO[c].title}
                        <span className={cn("text-xs tabular-nums", current ? "opacity-70" : "text-muted")}>{drillsByCategory(c).length}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {trainer ? (
              <Link
                href={`/tools/${trainer.slug}`}
                className="group block rounded-[1.75rem] bg-butter p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="flex items-start justify-between">
                  <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-surface text-ink ring-1 ring-inset ring-line">
                    <Sparkle size={18} />
                  </span>
                  <ArrowUpRight size={18} className="text-ink/60 transition-transform duration-300 group-hover:rotate-45" />
                </div>
                <p className="mt-5 font-medium text-ink">{trainer.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">{trainer.short}</p>
              </Link>
            ) : null}

            {guides.length > 0 ? (
              <div className="rounded-[1.75rem] bg-surface-2 p-5 ring-1 ring-inset ring-line">
                <p className="px-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Learn the method</p>
                <ul className="mt-3 space-y-2">
                  {guides.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/guides/${g.slug}`}
                        className="group flex items-start gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-inset ring-line transition-colors hover:ring-line-strong"
                      >
                        <Book size={17} className="mt-0.5 shrink-0 text-muted" />
                        <span className="flex-1">
                          <span className="block text-sm font-medium leading-snug text-ink">{splitTitle(g.title).main}</span>
                          <span className="mt-0.5 block text-xs text-muted">{g.reading_minutes} min read</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </>
  );
}
