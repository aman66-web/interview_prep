import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccentTitle, DraftNotice, splitSections } from "@/components/learn/article";
import { absoluteUrl, pageOpenGraph } from "@/components/learn/seo";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/faq";
import { Container, PageHeader } from "@/components/ui/layout";
import { Prose } from "@/components/ui/prose";
import { visibleCases } from "@/lib/content/cases";
import { allGuides, findPage, formatDate } from "@/lib/content/writing";
import { allDrills } from "@/lib/drills";
import { siteConfig } from "@/site.config";
import { pageImage } from "@/lib/images";

const SLUG = "about";

export function generateMetadata(): Metadata {
  const page = findPage(SLUG);
  if (!page) return {};
  return {
    title: { absolute: page.seo_title },
    description: page.description,
    alternates: { canonical: "/about" },
    openGraph: pageOpenGraph({ title: page.seo_title, description: page.description, path: "/about" }),
    // A draft still holds the founder's square-bracket notes: keep it out of search
    // results (and the sitemap) until it is approved.
    ...(page.status === "draft" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function AboutPage() {
  const page = findPage(SLUG);
  if (!page) notFound();
  const { lead, sections } = splitSections(page.blocks);
  const caseCount = visibleCases().length;

  // Product facts counted from the content (rule 2.4: no user counts or ratings).
  const facts = [
    ...(caseCount > 0 ? [{ value: String(caseCount), label: "original practice cases, written for this site" }] : []),
    { value: String(allDrills.length), label: "drills in mental maths, sizing, structure and charts" },
    { value: String(allGuides().length), label: "free guides with checked worked examples" },
    { value: "5", label: "skills scored out of 5 in every debrief" },
  ];

  return (
    <>
      <PageHeader image={pageImage("about")} eyebrow="About" title={<AccentTitle title={page.title} />} intro={page.intro}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/login" size="lg" arrow>
            Start free, no card needed
          </ButtonLink>
          <ButtonLink href="/cases" size="lg" variant="secondary">
            Browse the cases
          </ButtonLink>
        </div>
      </PageHeader>

      {/* Shown on the live site too while the page is a draft (like the legal pages). */}
      {page.status === "draft" ? (
        <Container className="mt-6">
          <DraftNotice />
        </Container>
      ) : null}

      <Container className="mt-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-line ring-1 ring-inset ring-line lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col-reverse justify-end gap-1 bg-surface p-6 sm:p-7">
              <dt className="text-sm leading-snug text-muted">{f.label}</dt>
              <dd className="text-4xl font-medium tracking-tight text-ink tabular-nums sm:text-5xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container className="mt-14 sm:mt-20">
        {lead.length > 0 ? <Prose blocks={lead} className="mb-12 max-w-3xl" /> : null}
        {sections.map((section, i) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="grid gap-5 border-t border-line py-10 sm:py-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,44rem)] lg:justify-between lg:gap-14"
          >
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="font-mono text-xs text-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h2 id={section.id} className="mt-2 scroll-mt-28 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[2rem]">
                {section.title}
              </h2>
            </div>
            <Prose blocks={section.blocks} className="min-w-0" />
          </section>
        ))}
        <p className="border-t border-line pt-6 text-sm text-subtle">
          Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
        </p>
        <div className="h-16 sm:h-24" />
      </Container>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: page.title,
          description: page.description,
          url: absoluteUrl("/about"),
          dateModified: page.updated,
          about: { "@type": "Organization", name: siteConfig.brandName, url: absoluteUrl("/") },
        }}
      />
    </>
  );
}
