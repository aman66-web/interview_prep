import Link from "next/link";
import { CASE_TYPE_TONES, DIFFICULTY_LABELS } from "@/components/marketing/case-card";
import { Tag, type TagTone } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, Building, ChevronRight, Clock, Coins, Layers, Lock, Target, TrendUp } from "@/components/ui/icons";
import { Container, SectionHeading } from "@/components/ui/layout";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { practiceCases, practiceFirms, type PracticeFirm } from "@/lib/content/practice";
import { toCaseSummary, type CaseSummary } from "@/lib/content/public";
import { minutesRange, roleCases, rolesForFirm, rolesForTrack, TRACK_LABELS, type Role } from "@/lib/content/roles";
import type { Case, Track } from "@/lib/content/schema";
import type { Firm } from "@/lib/content/writing-schema";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

// The signed-in library, in two parts (founder, 26 Oct 2026):
//   Companies  browse by company. A company opens its page, where you choose the role you are
//              applying for, and then the cases for that company and role.
//   Cases      browse by role. A role opens its page with every case that suits it.
// Every case row opens its start page (/app/start/<case>). Firm names are plain text,
// "McKinsey-style" (rule 2.3): no firm logos. Roles are our own grouping (lib/content/roles.ts).

const SECTORS: Firm["sector"][] = ["consulting", "banking"];
const GROUP_LABEL: Record<Firm["sector"], string> = { consulting: "Consulting firms", banking: "Banks" };

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink">
      <ArrowLeft size={15} aria-hidden="true" />
      {children}
    </Link>
  );
}

export function NotAffiliated({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-2xl text-sm leading-relaxed text-subtle", className)}>
      {siteConfig.disclaimer} Every practice interview is our own original case, not a firm&rsquo;s.
    </p>
  );
}

// ---- Companies ------------------------------------------------------------------------

function CompanyCard({ firm }: { firm: PracticeFirm }) {
  const cases = practiceCases(firm);
  const roles = rolesForFirm(firm);
  const banking = firm.sector === "banking";
  return (
    <li className="w-[17.75rem] shrink-0 snap-start sm:w-[19.5rem]">
      <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-300 focus-within:shadow-float hover:-translate-y-0.5 hover:shadow-float sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className={cn("grid size-11 place-items-center rounded-2xl text-ink", banking ? "bg-sky" : "bg-lavender")}>
            {banking ? <Coins size={20} /> : <Building size={20} />}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-inset ring-line">
            <Clock size={13} aria-hidden="true" />
            {minutesRange(cases)}
          </span>
        </div>
        <h4 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          <Link
            href={`/app/library/${firm.slug}`}
            className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-brand"
          >
            {firm.short_name}-style
          </Link>
        </h4>
        <p className="mt-1 text-sm text-muted">
          {cases.length} practice {banking ? "interviews" : "case interviews"}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Roles">
          {roles.map(({ role }) => (
            <li key={role.slug}>
              <Tag>{role.label}</Tag>
            </li>
          ))}
        </ul>
        <span className="mt-5 inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-ink">
          Choose your role
          <span
            aria-hidden="true"
            className="ml-auto grid size-9 place-items-center rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-all duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-ink-contrast"
          >
            <ArrowUpRight size={16} />
          </span>
        </span>
      </article>
    </li>
  );
}

export function CompaniesSection() {
  const firms = practiceFirms();
  if (firms.length === 0) return null;
  return (
    <section id="companies" aria-labelledby="companies-title">
      <Container>
        <SectionHeading
          align="left"
          id="companies-title"
          eyebrow="Browse by company"
          title="Companies"
          intro="Pick the firm you are applying to. Next you choose the role, then the case."
        />
        <div className="mt-10 space-y-10">
          {SECTORS.map((sector) => {
            const group = firms.filter((f) => f.sector === sector);
            if (group.length === 0) return null;
            const id = `companies-${sector}`;
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
                      <CompanyCard key={f.slug} firm={f} />
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ---- Roles ----------------------------------------------------------------------------

const ROLE_TONES = ["bg-lavender", "bg-mint", "bg-butter", "bg-sky", "bg-peach", "bg-mint"];
const ROLE_ICONS = [<TrendUp key="s" size={20} />, <Layers key="o" size={20} />, <Target key="d" size={20} />, <Coins key="i" size={20} />, <Building key="c" size={20} />, <Coins key="r" size={20} />];

/** A role as a coloured card. `href` and the counts are the caller's: all of the role's cases, or one company's. */
export function RoleCard({ role, index, count, minutes, href }: { role: Role; index: number; count: number; minutes: string; href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float",
        ROLE_TONES[index % ROLE_TONES.length],
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-surface text-ink ring-1 ring-inset ring-line">{ROLE_ICONS[index % ROLE_ICONS.length]}</span>
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-ink">
          {count} {count === 1 ? "case" : "cases"}
        </span>
      </div>
      <h4 className="mt-6 text-xl font-medium tracking-tight text-ink">{role.label}</h4>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{role.blurb}</p>
      <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-medium text-ink">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden="true" />
          {minutes}
        </span>
        <span className="inline-flex items-center gap-1.5">
          See cases <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </span>
    </Link>
  );
}

export function CasesSection() {
  const groups = (["consulting", "banking"] as Track[])
    .map((track) => ({
      track,
      roles: rolesForTrack(track)
        .map((role) => ({ role, cases: roleCases(role) }))
        .filter((r) => r.cases.length > 0),
    }))
    .filter((g) => g.roles.length > 0);
  if (groups.length === 0) return null;
  let index = 0;
  return (
    <section id="cases" aria-labelledby="cases-title">
      <Container>
        <SectionHeading
          align="left"
          id="cases-title"
          eyebrow="Browse by role"
          title="Cases"
          intro="Know the role you are going for? Pick it to see every practice case that suits it."
        />
        <div className="mt-10 space-y-10">
          {groups.map((g) => (
            <div key={g.track}>
              <h3 className="text-xl font-medium tracking-tight text-ink sm:text-2xl">{TRACK_LABELS[g.track]}</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.roles.map(({ role, cases }) => (
                  <li key={role.slug}>
                    <RoleCard role={role} index={index++} count={cases.length} minutes={minutesRange(cases)} href={`/app/library/roles/${role.slug}`} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ---- Both, for the dashboard and the Library tab --------------------------------------

export function LibrarySections({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-16 sm:space-y-20", className)}>
      <CompaniesSection />
      <CasesSection />
      <Container>
        <NotAffiliated />
      </Container>
    </div>
  );
}

// ---- A list of cases to start ---------------------------------------------------------

/** The cases of one company and role, or of one role. Free accounts see a lock on cases that need a plan. */
export function CaseList({ cases, paid }: { cases: Case[]; paid: boolean }) {
  const rows: CaseSummary[] = cases.map(toCaseSummary);
  return (
    <ul className="grid gap-3">
      {rows.map((c) => {
        const locked = !paid && !c.freeStarter;
        const tone: TagTone = CASE_TYPE_TONES[c.type] ?? "neutral";
        return (
          <li key={c.slug}>
            <Link
              href={`/app/start/${c.slug}`}
              className="group flex items-start justify-between gap-4 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-6"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <Tag tone={tone}>{CASE_TYPE_LABELS[c.type]}</Tag>
                  <Tag>{c.industry}</Tag>
                  {c.freeStarter ? <Tag tone="lime">Free</Tag> : null}
                  {locked ? (
                    <Tag tone="warning">
                      <Lock size={11} aria-hidden="true" /> Paid plan
                    </Tag>
                  ) : null}
                </span>
                <span className="mt-3 block text-lg font-medium leading-snug tracking-tight text-ink">{c.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {c.estMinutes} minute interview · {DIFFICULTY_LABELS[c.difficulty]}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-all duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-ink-contrast"
              >
                <ArrowUpRight size={17} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
