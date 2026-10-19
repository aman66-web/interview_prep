import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccentTitle, ArticleHeader, MetaRow, Notice, PractiseCta, slugify } from "@/components/learn/article";
import { breadcrumbJsonLd, pageOpenGraph } from "@/components/learn/seo";
import { SourcedFactList, SourceList } from "@/components/learn/sourced-facts";
import { CaseCard } from "@/components/marketing/case-card";
import { Eyebrow, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Book, Check, Clock } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { findPracticeFirm, practiceCases, practiceFirms, practiceSections, practiceSources, SECTOR_LABELS } from "@/lib/content/practice";
import { toCaseSummary } from "@/lib/content/public";
import { siteConfig } from "@/site.config";

// A firm-style practice page: what the firm itself says about its interviews (sourced,
// rule 2.2) next to our own original cases that suit that kind of interview. The firm's
// name is used only to describe (rule 2.3): the disclaimer sits in the page body, and the
// page says plainly that the cases are ours, not the firm's.

export const dynamicParams = false;

export function generateStaticParams() {
  return practiceFirms().map((f) => ({ firm: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ firm: string }> }): Promise<Metadata> {
  const { firm: slug } = await params;
  const firm = findPracticeFirm(slug);
  if (!firm) return {};
  const path = `/practice/${firm.slug}`;
  return {
    title: { absolute: firm.practice.seo_title },
    description: firm.practice.description,
    alternates: { canonical: path },
    openGraph: pageOpenGraph({ title: firm.practice.seo_title, description: firm.practice.description, path }),
    ...(firm.status === "draft" ? { robots: { index: false, follow: false } } : {}),
  };
}

const STEPS = [
  { title: "Clarify", text: "Ask the questions you would ask in the room. The interviewer answers only what you ask." },
  { title: "Structure", text: "Lay out your approach out loud. The interviewer probes it like a real one would." },
  { title: "Analyse", text: "Ask for data, read the exhibits and do the maths by hand. Code checks every number." },
  { title: "Brainstorm", text: "Generate ideas, then organise and prioritise them." },
  { title: "Recommend", text: "Give the answer first, then the reasons, risks and next steps." },
  { title: "Debrief", text: "Get scores on five skills, three strengths and three fixes, each tied to what you said." },
];

export default async function FirmPracticePage({ params }: { params: Promise<{ firm: string }> }) {
  const { firm: slug } = await params;
  const firm = findPracticeFirm(slug);
  if (!firm) notFound();

  const path = `/practice/${firm.slug}`;
  const cases = practiceCases(firm).map(toCaseSummary);
  const sections = practiceSections(firm);
  const sources = practiceSources(firm);
  const facts = sections.reduce((n, s) => n + s.items.length, 0);
  const label = SECTOR_LABELS[firm.sector];
  const starter = cases.find((c) => c.freeStarter);
  const others = practiceFirms().filter((f) => f.slug !== firm.slug && f.sector === firm.sector);

  return (
    <>
      <ArticleHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice by firm" },
        ]}
        current={firm.short_name}
        eyebrow={
          <>
            <Eyebrow tone="brand">Practice by firm</Eyebrow>
            {firm.status === "draft" ? <Tag tone="warning">Draft, preview only</Tag> : null}
          </>
        }
        title={<AccentTitle title={firm.practice.seo_title} words={1} />}
        meta={
          <MetaRow
            items={[
              { icon: <Check size={15} />, label: `${cases.length} practice case${cases.length === 1 ? "" : "s"}` },
              { icon: <Book size={15} />, label: `${facts} sourced fact${facts === 1 ? "" : "s"} from ${firm.short_name}` },
              { icon: <Clock size={15} />, label: "First full interview free" },
            ]}
          />
        }
      >
        <p>{firm.practice.intro}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href={starter ? `/app/start/${starter.slug}` : "/login"} arrow>
            {starter ? "Start the free interview" : "Start free, no card needed"}
          </ButtonLink>
          <ButtonLink href="#cases" variant="secondary">
            See the cases
          </ButtonLink>
        </div>
      </ArticleHeader>

      <Container className="mt-8 sm:mt-10">
        <div className="mx-auto max-w-[48rem] space-y-3">
          {firm.status === "draft" ? (
            <Notice tone="warning" title="Draft page, shown on preview sites only">
              The facts on this page come from a draft firm guide that is not yet live.
            </Notice>
          ) : null}
          <Notice title="Independent practice">
            {siteConfig.disclaimer} These are {siteConfig.brandName}&rsquo;s own original cases, not {firm.short_name}&rsquo;s, and we have no inside
            knowledge of its interviews. We use {firm.short_name}&rsquo;s name only to describe what it publishes about its process.
          </Notice>
        </div>
      </Container>

      <Container size="narrow" className="mt-14 space-y-16 sm:mt-20">
        <section aria-labelledby="what-firm-says">
          <h2 id="what-firm-says" className="text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
            What {firm.short_name} <span className="serif-accent">says</span> about its {label.interviews}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            In {firm.short_name}&rsquo;s own words, summarised. Each line links to the page it comes from.
          </p>
          {sections.map((section) => (
            <div key={section.heading} className="mt-8">
              <h3 id={`fact-${slugify(section.heading)}`} className="text-lg font-semibold tracking-tight text-ink">
                {section.heading}
              </h3>
              <SourcedFactList items={section.items} sources={sources} />
            </div>
          ))}
          <p className="mt-6 text-sm">
            <Link href={`/guides/firms/${firm.slug}`} className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              Read the full {firm.short_name} guide <ArrowUpRight size={14} />
            </Link>
          </p>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section id="cases" aria-labelledby="cases-title" className="scroll-mt-24">
          <div className="max-w-3xl">
            <h2 id="cases-title" className="text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
              Practise with <span className="serif-accent">these cases</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Our own cases, picked because they suit this kind of {label.kind}. Run any of them as a live interview with the AI interviewer.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <li key={c.slug}>
                <CaseCard c={c} />
              </li>
            ))}
          </ul>
        </section>
      </Container>

      <Container size="narrow" className="mt-16 space-y-16 sm:mt-24">
        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
            How a practice <span className="serif-accent">session</span> works
          </h2>
          <ol className="mt-6 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3.5 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-line">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-ink-contrast tabular-nums">{i + 1}</span>
                <span className="pt-0.5 text-[15.5px] leading-relaxed text-ink">
                  <strong className="font-semibold">{step.title}.</strong> {step.text}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="practise-tips" className="rounded-[1.75rem] bg-mint p-6 sm:p-8">
          <h2 id="practise-tips" className="text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
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
        </section>

        <section aria-labelledby="sources">
          <h2 id="sources" className="scroll-mt-28 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
            Sources
          </h2>
          <SourceList sources={sources} />
          <p className="mt-6 text-sm leading-relaxed text-muted">Firms change their processes, so check the firm&rsquo;s own pages before you apply.</p>
        </section>

        {others.length > 0 ? (
          <nav aria-label={`Practice for other ${firm.sector === "banking" ? "banks" : "firms"}`} className="border-t border-line pt-8">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Practice for other {firm.sector === "banking" ? "banks" : "firms"}
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {others.map((f) => (
                <li key={f.slug}>
                  <Link
                    href={`/practice/${f.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-shadow hover:shadow-float"
                  >
                    <span className="font-medium text-ink">{f.practice.seo_title}</span>
                    <ArrowUpRight size={16} className="shrink-0 text-subtle transition-transform group-hover:rotate-45 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </Container>

      <Container className="mt-20 sm:mt-28">
        <PractiseCta
          title={
            <>
              Practise out loud, <span className="serif-accent">get scored</span>
            </>
          }
          text="Run a realistic case with an AI interviewer that pushes back and checks your maths, then get a scored debrief. Your first full interview is free."
          primary={{ href: starter ? `/app/start/${starter.slug}` : "/login", label: "Start free, no card needed" }}
          secondary={{ href: "/pricing", label: "See plans" }}
        />
      </Container>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Practice by firm", path: "/practice" },
          { name: firm.short_name, path },
        ])}
      />
    </>
  );
}
