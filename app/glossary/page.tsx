import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, pageOpenGraph } from "@/components/learn/seo";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Book } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { findGuide, formatDate, glossary, splitTitle } from "@/lib/content/writing";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { pageImage } from "@/lib/images";

const termCount = glossary().terms.length;

export const metadata: Metadata = {
  title: `Case interview glossary: ${termCount} terms explained`,
  description: `Plain-English definitions of ${termCount} consulting case interview terms, from MECE and issue trees to contribution margin and CAGR, each with a short example.`,
  alternates: { canonical: "/glossary" },
  openGraph: pageOpenGraph({
    title: `Case interview glossary: ${termCount} terms explained`,
    description: "Plain-English definitions of consulting case interview terms, each with a short example.",
    path: "/glossary",
  }),
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** "80/20 rule" files under "#"; everything else under its first letter. */
function groupOf(term: string): string {
  const first = term.trim().charAt(0).toUpperCase();
  return LETTERS.includes(first) ? first : "#";
}

const groupId = (group: string) => (group === "#" ? "numbers" : `letter-${group.toLowerCase()}`);

export default function GlossaryPage() {
  const data = glossary();
  const terms = [...data.terms].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base", numeric: true }));
  const groups = new Map<string, typeof terms>();
  for (const t of terms) {
    const g = groupOf(t.term);
    groups.set(g, [...(groups.get(g) ?? []), t]);
  }
  const order = [...(groups.has("#") ? ["#"] : []), ...LETTERS.filter((l) => groups.has(l))];
  const jump = [...(groups.has("#") ? ["#"] : []), ...LETTERS];

  return (
    <>
      <PageHeader
        image={pageImage("glossary")}
        eyebrow="Glossary"
        title={
          <>
            Case interview terms, <span className="serif-accent">in plain English</span>
          </>
        }
        intro={`${terms.length} terms interviewers expect you to know, each with a short example and a link to the guide that puts it to work.`}
      >
        <p className="text-sm text-muted">
          Updated <time dateTime={data.updated}>{formatDate(data.updated)}</time>
        </p>
      </PageHeader>

      <div className="sticky top-[5.25rem] z-30 mt-6 px-3 sm:px-4">
        <nav aria-label="Jump to a letter" className="mx-auto w-full max-w-[76rem] overflow-hidden rounded-full bg-surface/95 shadow-soft ring-1 ring-inset ring-line backdrop-blur-md">
          <ol className="flex gap-0.5 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] lg:justify-between [&::-webkit-scrollbar]:hidden">
            {jump.map((letter) => (
              <li key={letter} className="shrink-0">
                {groups.has(letter) ? (
                  <a
                    href={`#${groupId(letter)}`}
                    aria-label={letter === "#" ? "0–9 (numbers)" : undefined}
                    className="grid size-9 place-items-center rounded-full text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-ink-contrast"
                  >
                    {letter === "#" ? "0–9" : letter}
                  </a>
                ) : (
                  <span aria-hidden="true" className="grid size-9 place-items-center text-sm text-subtle/50">
                    {letter}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <Container className="mt-6">
        {order.map((group, gi) => {
          const items = groups.get(group) ?? [];
          return (
            <section
              key={group}
              aria-labelledby={groupId(group)}
              className={cn("grid gap-6 py-10 sm:py-12 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-10", gi > 0 && "border-t border-line")}
            >
              <div className="lg:sticky lg:top-44 lg:self-start">
                <h2 id={groupId(group)} className="scroll-mt-44 text-5xl font-medium tracking-tight text-ink sm:text-6xl">
                  {group === "#" ? (
                    <>
                      <span aria-hidden="true">0–9</span>
                      <span className="sr-only">Numbers</span>
                    </>
                  ) : (
                    group
                  )}
                </h2>
                <p className="mt-2 font-mono text-xs text-muted tabular-nums">
                  {items.length} term{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {items.map((t) => {
                  const guide = t.related_guide ? findGuide(t.related_guide) : undefined;
                  return (
                    <li key={t.slug} className="min-w-0">
                      <article
                        id={t.slug}
                        aria-labelledby={`${t.slug}-term`}
                        className="flex h-full scroll-mt-44 flex-col rounded-[1.5rem] bg-surface p-6 ring-1 ring-inset ring-line transition-shadow target:shadow-float target:ring-2 target:ring-brand sm:p-7"
                      >
                        <h3 id={`${t.slug}-term`} className="text-xl font-medium leading-snug tracking-tight text-ink">
                          <a href={`#${t.slug}`} className="group inline-flex items-baseline gap-2 hover:underline hover:decoration-line-strong hover:underline-offset-4">
                            {t.term}
                            <span aria-hidden="true" className="text-base text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                              #
                            </span>
                          </a>
                        </h3>
                        <p className="mt-3 text-[15.5px] leading-relaxed text-ink/85">{t.definition}</p>
                        {t.example ? (
                          <div className="mt-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-inset ring-line">
                            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">Example</p>
                            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink/85">{t.example}</p>
                          </div>
                        ) : null}
                        {guide ? (
                          <Link
                            href={`/guides/${guide.slug}`}
                            className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                          >
                            <Book size={15} className="text-muted" />
                            {splitTitle(guide.title).main}
                            <ArrowUpRight size={14} />
                          </Link>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-surface-2 p-7 ring-1 ring-inset ring-line sm:flex-row sm:items-center sm:p-9">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-ink">
              See the terms <span className="serif-accent">in action</span>
            </h2>
            <p className="mt-2 leading-relaxed text-muted">The guides use these terms in worked examples, so you learn when each one matters in a case.</p>
          </div>
          <ButtonLink href="/guides" arrow>
            Read the guides
          </ButtonLink>
        </div>
        <div className="h-16 sm:h-24" />
      </Container>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          "@id": absoluteUrl("/glossary"),
          name: `${siteConfig.brandName} case interview glossary`,
          url: absoluteUrl("/glossary"),
          hasDefinedTerm: terms.map((t) => ({
            "@type": "DefinedTerm",
            "@id": absoluteUrl(`/glossary#${t.slug}`),
            name: t.term,
            description: t.definition,
            url: absoluteUrl(`/glossary#${t.slug}`),
            inDefinedTermSet: absoluteUrl("/glossary"),
          })),
        }}
      />
    </>
  );
}
