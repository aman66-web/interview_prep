import Link from "next/link";
import { DIFFICULTY_LABELS } from "@/components/marketing/case-card";
import { ButtonLink } from "@/components/ui/button";
import { ArrowUpRight, Building, ChevronRight, Clock, Coins } from "@/components/ui/icons";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { practiceCases, practiceFirms, SECTOR_LABELS, type PracticeFirm } from "@/lib/content/practice";
import { toCaseSummary } from "@/lib/content/public";
import type { Firm } from "@/lib/content/writing-schema";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

// The home page's interview library: one card per firm or bank, in a sideways-scrolling row
// for consulting firms and another for banks. Each card lists a few of our own practice
// interviews with their length. Everything comes from the content files (practice pages,
// case minutes and difficulty), so nothing here is invented.
//
// Firm names appear as plain text, "McKinsey-style" (rule 2.3). There are no firm logos:
// tests/repo-rules.test.ts blocks them, and a logo would suggest the firm is involved.

const SECTORS: Firm["sector"][] = ["consulting", "banking"];

const GROUP_LABEL: Record<Firm["sector"], string> = { consulting: "Consulting firms", banking: "Banks" };

/** "N min" when every case is the same length, otherwise "A–B min". */
function minutesLabel(minutes: number[]): string {
  const lo = Math.min(...minutes);
  const hi = Math.max(...minutes);
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
}

function FirmCard({ firm }: { firm: PracticeFirm }) {
  const cases = practiceCases(firm).map(toCaseSummary);
  const shown = cases.slice(0, 3);
  const more = cases.length - shown.length;
  const banking = firm.sector === "banking";
  const kind = SECTOR_LABELS[firm.sector].interviews;
  return (
    <li className="w-[17.75rem] shrink-0 snap-start sm:w-[19.5rem]">
      <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-300 focus-within:shadow-float hover:-translate-y-0.5 hover:shadow-float sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className={cn("grid size-11 place-items-center rounded-2xl text-ink", banking ? "bg-sky" : "bg-lavender")}>
            {banking ? <Coins size={20} /> : <Building size={20} />}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-inset ring-line">
            <Clock size={13} aria-hidden="true" />
            {minutesLabel(cases.map((c) => c.estMinutes))}
          </span>
        </div>

        <h4 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          <Link
            href={`/practice/${firm.slug}`}
            className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-brand"
          >
            {firm.short_name}-style
          </Link>
        </h4>
        <p className="mt-1 text-sm text-muted">
          {cases.length} practice {kind}
        </p>

        <ul className="mt-5 space-y-3 border-t border-line pt-4">
          {shown.map((c) => (
            <li key={c.slug}>
              <p className="truncate text-[13.5px] font-medium text-ink">{c.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {c.estMinutes} minute interview · {CASE_TYPE_LABELS[c.type]} · {DIFFICULTY_LABELS[c.difficulty]}
              </p>
            </li>
          ))}
        </ul>
        {more > 0 ? <p className="mt-3 text-xs text-subtle">+ {more} more</p> : null}

        <span
          aria-hidden="true"
          className="mt-auto grid size-9 place-items-center self-end rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-all duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-ink-contrast"
        >
          <ArrowUpRight size={16} />
        </span>
      </article>
    </li>
  );
}

export function FirmLibrary() {
  const firms = practiceFirms();
  if (firms.length === 0) return null;
  return (
    <Section id="interviews" labelledBy="library-title">
      <Container>
        <SectionHeading
          id="library-title"
          eyebrow="The interview library"
          title={
            <>
              Pick the interview you&rsquo;re <span className="serif-accent">preparing for</span>
            </>
          }
          intro="Original practice interviews, grouped by the firm whose style they follow. Choose one, run it with the AI interviewer, and get a scored debrief."
        />

        <div className="mt-12 space-y-12">
          {SECTORS.map((sector) => {
            const group = firms.filter((f) => f.sector === sector);
            if (group.length === 0) return null;
            const id = `library-${sector}`;
            return (
              <div key={sector}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 id={id} className="text-xl font-medium tracking-tight text-ink sm:text-2xl">
                    {GROUP_LABEL[sector]} <span className="ml-1 font-mono text-sm text-subtle tabular-nums">{group.length}</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 text-sm text-subtle sm:hidden" aria-hidden="true">
                    Swipe <ChevronRight size={14} />
                  </span>
                </div>
                <div
                  role="region"
                  aria-labelledby={id}
                  tabIndex={0}
                  className="-mx-4 mt-5 overflow-x-auto px-4 pb-5 [scrollbar-width:thin] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                >
                  <ul className="flex snap-x snap-mandatory scroll-px-4 gap-4 sm:scroll-px-6 lg:scroll-px-8">
                    {group.map((f) => (
                      <FirmCard key={f.slug} firm={f} />
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/practice" arrow>
            Browse every interview
          </ButtonLink>
          <ButtonLink href="/cases" variant="secondary">
            See the full case library
          </ButtonLink>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-subtle">
          {siteConfig.disclaimer} Every practice interview is our own original case, not a firm&rsquo;s.
        </p>
      </Container>
    </Section>
  );
}
