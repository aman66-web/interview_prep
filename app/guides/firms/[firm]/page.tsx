import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleHeader, MetaRow, Notice, PractiseCta, slugify } from "@/components/learn/article";
import { DesktopToc, MobileToc } from "@/components/learn/article-toc";
import { articleJsonLd, breadcrumbJsonLd, pageOpenGraph } from "@/components/learn/seo";
import { Eyebrow, Tag } from "@/components/ui/badge";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Book, Check, ExternalLink, Refresh } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { findFirm, formatDate, lastChecked, visibleFirms } from "@/lib/content/writing";
import type { Firm } from "@/lib/content/writing-schema";
import { siteConfig } from "@/site.config";

// A firm guide: every fact carries a numbered link to its source (rule 2.2), the
// non-affiliation notice sits in the page body (rule 2.3), and draft guides exist only
// where SHOW_DRAFT_CONTENT=1 (previews), with a notice saying so.

export const dynamicParams = false;

export function generateStaticParams() {
  return visibleFirms().map((f) => ({ firm: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ firm: string }> }): Promise<Metadata> {
  const { firm: slug } = await params;
  const firm = findFirm(slug);
  if (!firm) return {};
  const path = `/guides/firms/${firm.slug}`;
  return {
    title: { absolute: firm.seo_title },
    description: firm.description,
    alternates: { canonical: path },
    openGraph: pageOpenGraph({ type: "article", title: firm.seo_title, description: firm.description, path, modifiedTime: firm.updated }),
    ...(firm.status === "draft" ? { robots: { index: false, follow: false } } : {}),
  };
}

function sectionIds(firm: Firm): string[] {
  const seen = new Set<string>();
  return firm.sections.map((s, i) => {
    let id = slugify(s.heading) || `section-${i + 1}`;
    if (seen.has(id) || id === "sources" || id === "practise") id = `${id}-${i + 1}`;
    seen.add(id);
    return id;
  });
}

function displayUrl(url: string): string {
  const u = new URL(url);
  return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
}

export default async function FirmGuidePage({ params }: { params: Promise<{ firm: string }> }) {
  const { firm: slug } = await params;
  const firm = findFirm(slug);
  if (!firm) notFound();

  const path = `/guides/firms/${firm.slug}`;
  const ids = sectionIds(firm);
  const sourceNumber = new Map(firm.sources.map((s, i) => [s.id, i + 1]));
  const sourceById = new Map(firm.sources.map((s) => [s.id, s]));
  const facts = firm.sections.reduce((n, s) => n + s.items.length, 0);
  const checked = lastChecked(firm);
  const publishers = [...new Set(firm.sources.map((s) => s.publisher))];
  const others = visibleFirms().filter((f) => f.slug !== firm.slug);
  const toc = [
    ...firm.sections.map((s, i) => ({ id: ids[i], text: s.heading })),
    { id: "practise", text: "How to practise" },
    { id: "sources", text: "Sources" },
  ];

  return (
    <>
      <ArticleHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          { href: "/guides#firms", label: "Firm guides" },
        ]}
        current={firm.short_name}
        eyebrow={
          <>
            <Eyebrow tone="brand">Firm guide</Eyebrow>
            {firm.status === "draft" ? <Tag tone="warning">Draft, preview only</Tag> : null}
          </>
        }
        title={
          <>
            {firm.name}: <span className="serif-accent">what to expect</span>
          </>
        }
        meta={
          <MetaRow
            items={[
              { icon: <Check size={15} />, label: `${facts} sourced facts` },
              { icon: <Book size={15} />, label: `${firm.sources.length} source${firm.sources.length === 1 ? "" : "s"}` },
              { icon: <Refresh size={15} />, label: <time dateTime={checked}>Last checked {formatDate(checked, "short")}</time> },
            ]}
          />
        }
        aside={
          <div className="rounded-[1.5rem] bg-surface p-6 shadow-float ring-1 ring-inset ring-line sm:p-7">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-lime ring-2 ring-lime/30" />
              How this guide works
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
              Every line comes from {publishers.join(" and ")}. The small number after each line links to its source, with the date we checked it.
            </p>
            <a href="#sources" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              See the sources
            </a>
          </div>
        }
      >
        <p>{firm.intro}</p>
      </ArticleHeader>

      <Container className="mt-8 sm:mt-10">
        <div className="mx-auto space-y-3 lg:max-w-[61.5rem] xl:max-w-[63rem]">
          {firm.status === "draft" ? (
            <Notice tone="warning" title="Draft guide, shown on preview sites only">
              This guide is incomplete. It stays hidden on the live site until its facts can be checked against {firm.short_name}&rsquo;s own careers pages.
            </Notice>
          ) : null}
          <Notice title="Independent guide">
            {siteConfig.disclaimer} We use {firm.short_name}&rsquo;s name only to describe its published process.
          </Notice>
        </div>
      </Container>

      <Container className="mt-10 sm:mt-14">
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,44rem)] lg:justify-center lg:gap-14 xl:gap-20">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <DesktopToc items={toc} />
            </div>
          </aside>

          <div className="min-w-0">
            <MobileToc items={toc} className="mb-10 lg:hidden" />

            <article aria-label={`${firm.name}: what to expect`} className="space-y-14">
              {firm.sections.map((section, i) => (
                <section key={ids[i]} aria-labelledby={ids[i]}>
                  <h2 id={ids[i]} className="scroll-mt-28 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
                    {section.heading}
                  </h2>
                  <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[1.5rem] bg-surface ring-1 ring-inset ring-line">
                    {section.items.map((item) => {
                      const n = sourceNumber.get(item.source);
                      const source = sourceById.get(item.source);
                      return (
                        <li key={item.text} className="flex gap-3.5 px-5 py-4 sm:px-6">
                          <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand" />
                          <p className="text-[16px] leading-[1.7] text-ink/90">
                            {item.text}
                            {n && source ? (
                              <sup className="ml-1 align-super">
                                <a
                                  href={`#source-${source.id}`}
                                  aria-label={`Source ${n}: ${source.title}`}
                                  className="inline-grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-brand-soft px-1 text-[10.5px] font-semibold leading-none text-brand-ink no-underline transition-colors hover:bg-brand hover:text-white"
                                >
                                  {n}
                                </a>
                              </sup>
                            ) : null}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <section aria-labelledby="practise" className="rounded-[1.75rem] bg-mint p-6 sm:p-8">
                <h2 id="practise" className="scroll-mt-28 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
                  How to <span className="serif-accent">practise</span>
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/75">General advice in our own words, not a statement of what {firm.short_name} looks for.</p>
                <ol className="mt-6 space-y-3">
                  {firm.practice_advice.map((advice, i) => (
                    <li key={advice} className="flex gap-3.5 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-ink-contrast tabular-nums">{i + 1}</span>
                      <span className="pt-0.5 text-[15.5px] leading-relaxed text-ink">{advice}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
                  {[
                    { href: "/drills", label: "Try the drills" },
                    { href: "/cases", label: "Browse the practice cases" },
                    { href: "/guides/how-to-structure-a-case-interview", label: "How to structure a case" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                      {l.label} <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>

              <section aria-labelledby="sources">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 id="sources" className="scroll-mt-28 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
                    Sources
                  </h2>
                  <p className="text-sm text-muted">
                    Last checked <time dateTime={checked}>{formatDate(checked)}</time>
                  </p>
                </div>
                <ol className="mt-5 space-y-3">
                  {firm.sources.map((s, i) => (
                    <li
                      key={s.id}
                      id={`source-${s.id}`}
                      className="flex scroll-mt-28 gap-4 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-shadow target:ring-2 target:ring-brand sm:p-6"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink tabular-nums">{i + 1}</span>
                      <div className="min-w-0">
                        <a href={s.url} rel="noopener noreferrer" className="group inline-flex items-start gap-1.5 font-medium leading-snug text-ink hover:underline hover:underline-offset-4">
                          {s.title}
                          <ExternalLink size={14} className="mt-1 shrink-0 text-subtle group-hover:text-ink" />
                          <span className="sr-only">(opens the source)</span>
                        </a>
                        <p className="mt-1 text-sm text-muted">
                          {s.publisher} · checked <time dateTime={s.checked}>{formatDate(s.checked)}</time>
                        </p>
                        <p className="mt-1.5 break-all font-mono text-xs text-subtle">{displayUrl(s.url)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm leading-relaxed text-muted">
                  Firms change their processes, so check the firm&rsquo;s own pages before you apply.
                  {siteConfig.supportEmail ? (
                    <>
                      {" "}
                      Spotted a line that is out of date? Email{" "}
                      <a href={`mailto:${siteConfig.supportEmail}`} className="text-ink underline underline-offset-4">
                        {siteConfig.supportEmail}
                      </a>
                      .
                    </>
                  ) : null}
                  {firm.updated !== checked ? <> This guide was last edited on {formatDate(firm.updated)}.</> : null}
                </p>
              </section>
            </article>

            {others.length > 0 ? (
              <nav aria-label="Other firm guides" className="mt-16 border-t border-line pt-8">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Other firm guides</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {others.map((f) => (
                    <li key={f.slug}>
                      <Link
                        href={`/guides/firms/${f.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-shadow hover:shadow-float"
                      >
                        <span className="font-medium text-ink">
                          {f.name}
                          {f.status === "draft" ? <span className="ml-2 text-xs font-medium text-warning">Draft</span> : null}
                        </span>
                        <ArrowUpRight size={16} className="shrink-0 text-subtle transition-transform group-hover:rotate-45 group-hover:text-ink" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        </div>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <PractiseCta
          title={
            <>
              Get ready for the case, <span className="serif-accent">whichever firm</span>
            </>
          }
          text="Run a realistic case with an AI interviewer that pushes back and checks your maths, then get a scored debrief. Your first full interview is free."
          primary={{ href: "/login", label: "Start free, no card needed" }}
          secondary={{ href: "/cases", label: "Browse the cases" }}
        />
      </Container>

      <JsonLd data={articleJsonLd({ headline: `${firm.name}: what to expect`, description: firm.description, path, dateModified: firm.updated })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: firm.short_name, path },
        ])}
      />
    </>
  );
}
