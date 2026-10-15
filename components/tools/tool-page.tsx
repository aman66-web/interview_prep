import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { IconBadge } from "@/components/ui/card";
import { Faq, faqJsonLd, JsonLd, type FaqItem } from "@/components/ui/faq";
import { ArrowLeft, ArrowUpRight, Book, Bolt, Lock, Sparkle, Target } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { findTool, TOOLS, type ToolInfo } from "@/lib/tools";
import { relatedLinks } from "@/lib/tools/related";
import { cn } from "@/lib/ui/cn";
import { TOOL_ICONS, TOOL_TONES } from "./tool-meta";

// The shared frame for each free tool page: header, the tool, how it works (with the
// formula), a worked example computed by the same functions as the tool, links to a
// drill, a guide and a case, and an FAQ with FAQPage data for exactly those questions.

export function getTool(slug: string): ToolInfo {
  const tool = findTool(slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}

export function toolMetadata(slug: string): Metadata {
  const tool = getTool(slug);
  return {
    title: `${tool.title} for case interviews`,
    description: tool.description,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: `Free ${tool.title.toLowerCase()} | case interview practice`, description: tool.description, url: `/tools/${tool.slug}` },
  };
}

export type Formula = { name: string; formula: string };

type ToolPageProps = {
  slug: string;
  /** The h1, with one serif-accent phrase. */
  title: ReactNode;
  intro: ReactNode;
  children: ReactNode;
  how: ReactNode;
  formulas: Formula[];
  /** `prose` shows the working as sentences rather than as a line of sums. */
  example: { title: string; intro: ReactNode; steps: { label: ReactNode; working: ReactNode; answer?: string }[]; conclusion?: ReactNode; note?: string; prose?: boolean };
  faq?: FaqItem[];
};

const RELATED_STYLE = [
  { tone: "bg-butter", icon: <Bolt size={20} /> },
  { tone: "bg-mint", icon: <Book size={20} /> },
  { tone: "bg-sky", icon: <Target size={20} /> },
];

export function ToolPage({ slug, title, intro, children, how, formulas, example, faq }: ToolPageProps) {
  const tool = getTool(slug);
  const related = relatedLinks(slug);
  const others = TOOLS.filter((t) => t.slug !== slug);

  return (
    <>
      <PageHeader
        eyebrow={
          <Eyebrow tone="lime" icon={<Sparkle size={14} />}>
            Free tool, no login
          </Eyebrow>
        }
        title={title}
        intro={intro}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted">
          <Link href="/tools" className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
            <ArrowLeft size={15} /> All free tools
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <Lock size={15} /> Runs in your browser. Nothing you type is sent or saved.
          </span>
        </div>
      </PageHeader>

      <Container className="mt-6">{children}</Container>

      <Container className="mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <section aria-labelledby="how-title">
            <Kicker>How it works</Kicker>
            <h2 id="how-title" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              The maths, <span className="serif-accent">in plain English</span>
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted [&_strong]:font-medium [&_strong]:text-ink">{how}</div>
          </section>
          <section aria-labelledby="formula-title" className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-8">
            <h2 id="formula-title" className="text-lg font-medium tracking-tight text-ink">
              The formulas
            </h2>
            <dl className="mt-5 divide-y divide-line">
              {formulas.map((f) => (
                <div key={f.name} className="py-3.5 first:pt-0 last:pb-0">
                  <dt className="text-sm text-muted">{f.name}</dt>
                  <dd className="mt-1 font-mono text-[14px] leading-relaxed text-ink">{f.formula}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </Container>

      <Container className="mt-10">
        <section aria-labelledby="example-title" className="rounded-[2rem] bg-lavender p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Kicker>Worked example</Kicker>
              <h2 id="example-title" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                {example.title}
              </h2>
              <div className="mt-4 text-[15px] leading-relaxed text-ink/75">{example.intro}</div>
              <p className="mt-4 text-xs text-ink/60">{example.note ?? "Invented numbers. The calculator above starts with them, and our tests check every figure here."}</p>
            </div>
            <div>
              <ol className="space-y-2.5">
                {example.steps.map((s, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-inset ring-line">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs text-ink-contrast">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{s.label}</p>
                      {s.answer ? (
                        <p className="mt-1.5">
                          <span className="inline-flex rounded-full bg-lime px-2.5 py-0.5 text-xs font-medium text-lime-ink">Answer: {s.answer}</span>
                        </p>
                      ) : null}
                      <p className={cn("text-muted [overflow-wrap:anywhere]", example.prose ? "mt-1.5 text-sm leading-relaxed" : "mt-0.5 font-mono text-[13px] leading-relaxed")}>{s.working}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {example.conclusion ? <p className="mt-4 rounded-2xl bg-ink p-4 text-sm leading-relaxed text-ink-contrast">{example.conclusion}</p> : null}
            </div>
          </div>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="next-title">
          <Kicker>Keep practising</Kicker>
          <h2 id="next-title" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            Now use it <span className="serif-accent">in a case</span>
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {related.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn("group flex h-full flex-col rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float", RELATED_STYLE[i % 3].tone)}
                >
                  <div className="flex items-start justify-between">
                    <IconBadge tone="surface">{RELATED_STYLE[i % 3].icon}</IconBadge>
                    <ArrowUpRight size={18} className="text-ink/50 transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
                  </div>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">{link.kicker}</p>
                  <h3 className="mt-1.5 text-lg font-medium leading-snug tracking-tight text-ink">{link.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{link.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {faq && faq.length > 0 ? (
        <Container className="mt-16 sm:mt-24">
          <section aria-labelledby="faq-title" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <Kicker>FAQ</Kicker>
              <h2 id="faq-title" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                Questions about the <span className="serif-accent">{tool.title.toLowerCase()}</span>
              </h2>
            </div>
            <Faq items={faq} />
          </section>
          <JsonLd data={faqJsonLd(faq)} />
        </Container>
      ) : null}

      <Container className="mb-20 mt-16 sm:mb-28 sm:mt-24">
        <nav aria-labelledby="other-tools" className="rounded-[2rem] bg-surface-2 p-6 ring-1 ring-inset ring-line sm:p-8">
          <h2 id="other-tools" className="text-lg font-medium tracking-tight text-ink">
            Other free tools
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {others.map((t) => {
              const Icon = TOOL_ICONS[t.slug];
              return (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="group flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-inset ring-line transition-shadow hover:shadow-soft">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-ink", TOOL_TONES[t.slug])}>{Icon ? <Icon size={18} /> : null}</span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{t.title}</span>
                    <ArrowUpRight size={16} className="shrink-0 text-subtle transition-transform duration-300 group-hover:rotate-45" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </>
  );
}
