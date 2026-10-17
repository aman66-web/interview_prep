import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/learn/article";
import { breadcrumbJsonLd, pageOpenGraph } from "@/components/learn/seo";
import { Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/faq";
import { ArrowUpRight } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { practiceCases, practiceFirms, SECTOR_LABELS } from "@/lib/content/practice";
import type { Firm } from "@/lib/content/writing-schema";
import { siteConfig } from "@/site.config";

// The list of firm-style practice pages, consulting firms first, then banks.

const TITLE = "Case interview practice by firm and bank";
const DESCRIPTION =
  "Practise for the firm you are applying to: what each firm says about its interviews, with sources, next to original practice cases you can run with an AI interviewer.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/practice" },
  openGraph: pageOpenGraph({ title: TITLE, description: DESCRIPTION, path: "/practice" }),
};

const SECTORS: Firm["sector"][] = ["consulting", "banking"];

export default function PracticeByFirmPage() {
  const firms = practiceFirms();

  return (
    <>
      <PageHeader
        eyebrow="Practice by firm"
        title={
          <>
            Practise for the firm <span className="serif-accent">you want</span>
          </>
        }
        intro="Each page sums up what the firm itself publishes about its interviews, with a link to every source, and picks our own practice cases that suit that kind of interview."
      >
        <ButtonLink href="/cases" variant="secondary" arrow>
          Browse every case
        </ButtonLink>
      </PageHeader>

      <Container className="mt-8 sm:mt-10">
        <Notice title="Independent practice" className="mx-auto max-w-[48rem]">
          {siteConfig.disclaimer} Every case on {siteConfig.brandName} is our own original case, not a firm&rsquo;s.
        </Notice>
      </Container>

      {firms.length === 0 ? (
        <Container size="narrow" className="mt-14">
          <p className="rounded-[1.75rem] bg-surface-2 p-6 text-center text-ink ring-1 ring-inset ring-line">
            Firm pages appear here once their cases have been checked by a reviewer.
          </p>
        </Container>
      ) : (
        SECTORS.map((sector) => {
          const group = firms.filter((f) => f.sector === sector);
          if (group.length === 0) return null;
          const id = `sector-${sector}`;
          return (
            <Container key={sector} className="mt-14 sm:mt-20">
              <section aria-labelledby={id}>
                <h2 id={id} className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                  {SECTOR_LABELS[sector].group}
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((f) => {
                    const count = practiceCases(f).length;
                    return (
                      <li key={f.slug}>
                        <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-300 focus-within:shadow-float hover:-translate-y-0.5 hover:shadow-float">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag tone={sector === "banking" ? "sky" : "lavender"}>{f.short_name}</Tag>
                            {f.status === "draft" ? <Tag tone="warning">Draft</Tag> : null}
                          </div>
                          <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-ink">
                            <Link
                              href={`/practice/${f.slug}`}
                              className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-brand"
                            >
                              {f.practice.seo_title}
                            </Link>
                          </h3>
                          <p className="mt-1.5 text-sm text-muted">
                            {count} practice case{count === 1 ? "" : "s"}
                          </p>
                          <span
                            aria-hidden="true"
                            className="mt-auto grid size-9 place-items-center self-end rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-all duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-ink-contrast"
                          >
                            <ArrowUpRight size={16} />
                          </span>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Container>
          );
        })
      )}

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Practice by firm", path: "/practice" },
        ])}
      />
    </>
  );
}
