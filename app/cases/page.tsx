import type { Metadata } from "next";
import { CASE_TYPE_TONES } from "@/components/marketing/case-card";
import { typeCounts } from "@/components/practice/case-list";
import { collectionPageJsonLd, joinWithAnd } from "@/components/practice/metadata";
import { caseShortName, lowerFirst } from "@/components/practice/wording";
import { Eyebrow, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/faq";
import { Check, Coins, Layers, Search, Sparkle } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toCaseSummary } from "@/lib/content/public";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { CaseBrowser } from "./case-browser";

// Every case type the library is built for, in the site's order (tests check it stays within 160 characters).
const TYPE_LIST = joinWithAnd(
  Object.entries(CASE_TYPE_LABELS)
    .filter(([type]) => type !== "other")
    .map(([, label]) => lowerFirst(label)),
);

const TITLE = "Case interview library";
const DESCRIPTION = `Original ${TYPE_LIST} cases. Read any prompt free, then practise with an AI interviewer.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cases" },
};

// Every number on this page is counted from the case files (rule 2.4).

// Pastel tiles for the "cases by type" strip, matching each type's tag colour.
const TILE: Record<string, string> = {
  lavender: "bg-lavender",
  sky: "bg-sky",
  butter: "bg-butter",
  peach: "bg-peach",
  mint: "bg-mint",
  lime: "bg-lime text-lime-ink",
  neutral: "bg-surface-2 ring-1 ring-inset ring-line",
};

const freeInterviews = siteConfig.limits.free.aiCasesTotal;

function TypeStrip({ counts, total }: { counts: { type: string; count: number }[]; total: number }) {
  const tile = "flex flex-col-reverse justify-end gap-0.5 rounded-2xl p-3 sm:gap-1 sm:p-4";
  return (
    <section aria-labelledby="library-mix">
      <h2 id="library-mix" className="sr-only">
        Cases by type
      </h2>
      <dl className="grid grid-cols-4 gap-2 lg:grid-cols-8">
        <div className={cn(tile, "bg-ink text-ink-contrast")}>
          <dt className="text-xs leading-tight opacity-70 sm:text-sm">cases in all</dt>
          <dd className="text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">{total}</dd>
        </div>
        {counts.map(({ type, count }) => (
          <div key={type} className={cn(tile, "text-ink", TILE[CASE_TYPE_TONES[type] ?? "neutral"])}>
            <dt className="text-xs leading-tight opacity-75 sm:text-sm">{CASE_TYPE_LABELS[type] ?? type}</dt>
            <dd className="text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">{count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ClosingCta({ starter }: { starter: { title: string; slug: string } | null }) {
  return (
    <section aria-labelledby="cases-cta" className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <Card tone="lime" padding="lg" className="flex flex-col">
        <IconBadge tone="surface">
          <Sparkle size={20} />
        </IconBadge>
        <h2 id="cases-cta" className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Run your first case <span className="serif-accent">for free</span>
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-lime-ink/80">
          {starter
            ? `${caseShortName(starter.title)} runs as a full interview with the AI interviewer, then a scored debrief. A free account is all you need, no card.`
            : `A free account includes ${freeInterviews === 1 ? "one full AI interview" : `${freeInterviews} full AI interviews`} with a scored debrief. No card needed.`}
        </p>
        <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
          <ButtonLink href="/login" arrow>
            Start free
          </ButtonLink>
          {starter ? (
            <ButtonLink href={`/cases/${starter.slug}`} variant="secondary">
              Read the starter case
            </ButtonLink>
          ) : null}
        </div>
      </Card>
      <Card padding="lg" className="flex flex-col">
        <IconBadge>
          <Coins size={20} />
        </IconBadge>
        <h3 className="mt-6 text-2xl font-medium tracking-tight">Want every case?</h3>
        <p className="mt-3 leading-relaxed text-muted">
          The paid plans open every case and unlimited drills, with up to {siteConfig.limits.paid.aiCasesPerDay} AI
          interviews a day. From ${siteConfig.prices.monthly} a month, or ${siteConfig.prices.pass90} for 90 days.
        </p>
        <div className="mt-auto pt-8">
          <ButtonLink href="/pricing" variant="secondary" arrow>
            See pricing
          </ButtonLink>
        </div>
      </Card>
    </section>
  );
}

export default function CasesPage() {
  const cases = visibleCases().map(toCaseSummary);
  const starter = cases.find((c) => c.freeStarter) ?? null;
  const previews = cases.filter((c) => c.freePreview).length;
  const counts = typeCounts(cases);

  const points = [
    "Read every case prompt free",
    ...(previews > 0 ? [`${previews} ${previews === 1 ? "case shows" : "cases show"} an exhibit free`] : []),
    freeInterviews === 1 ? "One full AI interview free" : `${freeInterviews} full AI interviews free`,
  ];

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          path: "/cases",
          items: cases.map((c) => ({ name: c.title, path: `/cases/${c.slug}` })),
        })}
      />
      <PageHeader
        eyebrow={<Eyebrow icon={<Layers size={14} />}>{cases.length > 0 ? `${cases.length} original cases` : "The case library"}</Eyebrow>}
        title={
          <>
            Case interview <span className="serif-accent">library</span>
          </>
        }
        intro={`Practice cases written for this site, with invented companies and numbers that add up. Read any prompt for free. With a free account you can run ${starter ? `the starter case, ${caseShortName(starter.title)},` : "one case"} as a full interview with an AI interviewer and get a scored debrief.`}
      >
        <p className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted">
          {points.map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-ink text-ink-contrast">
                <Check size={12} strokeWidth={2.8} />
              </span>
              {t}
            </span>
          ))}
        </p>
      </PageHeader>

      {cases.length === 0 ? (
        <Container className="mt-10">
          <div className="flex flex-col items-start gap-6 rounded-[1.75rem] bg-surface-2 p-7 ring-1 ring-inset ring-line sm:p-10">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-surface text-muted ring-1 ring-inset ring-line">
              <Search size={20} />
            </span>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-ink">Cases are being checked</h2>
              <p className="mt-2 max-w-2xl text-muted">
                Every case is checked by a human reviewer before it appears here. In the meantime, the drills are ready
                to use.
              </p>
            </div>
            <p className="flex flex-wrap gap-2">
              {Object.entries(CASE_TYPE_LABELS)
                .filter(([k]) => k !== "other")
                .map(([k, label]) => (
                  <Tag key={k} tone={CASE_TYPE_TONES[k] ?? "neutral"}>
                    {label}
                  </Tag>
                ))}
            </p>
            <ButtonLink href="/drills" arrow>
              Try the drills
            </ButtonLink>
          </div>
        </Container>
      ) : (
        <>
          <Container className="mt-4">
            <TypeStrip counts={counts} total={cases.length} />
          </Container>
          <Container className="mt-10">
            <CaseBrowser cases={cases} />
          </Container>
        </>
      )}

      <Container className="mb-16 mt-16 sm:mb-24 sm:mt-24">
        <ClosingCta starter={starter ? { title: starter.title, slug: starter.slug } : null} />
      </Container>
    </>
  );
}
