import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Eyebrow, Kicker, Tag } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, Building, ChartBars, Coins, Info, Users } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { isAdminEmail } from "@/lib/analytics/admin-access";
import {
  decisionReading,
  DECISION_TARGETS,
  formatCompact,
  formatPercent,
  formatUsd,
  type DayPoint,
  type FunnelStep,
  type WindowStats,
} from "@/lib/analytics/dashboard";
import { EVENT_RETENTION_DAYS } from "@/lib/analytics/events";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/ui/cn";
import { loadAdminDashboard, type LatestLead } from "./actions";

// The founder's dashboard (SPEC section 12): the funnel, AI cost and university
// enquiries for the last 7 or 30 days, and the 30-day go/stop targets. Only for the
// addresses in ADMIN_EMAILS; everyone else gets "not found". Never indexed.

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

type Range = "7" | "30";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const shortDay = (day: string) => dateFmt.format(new Date(`${day}T00:00:00Z`));

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();

  const { range: rawRange } = await searchParams;
  const range: Range = rawRange === "7" ? "7" : "30";
  const data = await loadAdminDashboard();

  return (
    <Container className="pb-20 pt-6 sm:pt-8">
      <header className="bg-aurora relative overflow-hidden rounded-[2rem] px-6 py-10 ring-1 ring-inset ring-line sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow tone="brand">Admin</Eyebrow>
            <h1 className="mt-5 text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
              How it&rsquo;s <span className="serif-accent">going</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Signups through to payments, what the AI interviewer costs, and enquiries from universities. Only the addresses in ADMIN_EMAILS can see
              this page.
            </p>
          </div>
          <RangeSwitch range={range} />
        </div>
      </header>

      {data.configured ? (
        <Dashboard
          stats={range === "7" ? data.week : data.month}
          month={data.month}
          latestLeads={data.latestLeads}
          partial={data.partial}
          generatedAt={data.generatedAt}
        />
      ) : (
        <Card tone="soft" className="mt-6">
          <p className="text-ink">The database isn&rsquo;t connected here, so there are no numbers to show yet.</p>
        </Card>
      )}
    </Container>
  );
}

function RangeSwitch({ range }: { range: Range }) {
  const options: { value: Range; label: string }[] = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
  ];
  return (
    <nav aria-label="Time period" className="inline-flex w-fit shrink-0 rounded-full bg-surface p-1 shadow-soft ring-1 ring-inset ring-line">
      {options.map((o) => {
        const current = o.value === range;
        return (
          <Link
            key={o.value}
            href={o.value === "30" ? "/admin" : "/admin?range=7"}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
              current ? "bg-ink text-ink-contrast" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Dashboard({
  stats,
  month,
  latestLeads,
  partial,
  generatedAt,
}: {
  stats: WindowStats;
  month: WindowStats;
  latestLeads: LatestLead[];
  partial: boolean;
  generatedAt: string;
}) {
  const period = `the last ${stats.days} days`;
  return (
    <>
      {partial ? (
        <p role="status" className="mt-6 flex gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning">
          <Alert size={18} className="mt-0.5 shrink-0" />
          There were more rows than this page reads at once, so some totals below are lower than the real figures.
        </p>
      ) : null}

      <section aria-labelledby="headline-title" className="mt-6">
        <h2 id="headline-title" className="sr-only">
          Headline numbers for {period}
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-line ring-1 ring-inset ring-line lg:grid-cols-4">
          <StatTile icon={<Users size={18} />} label="Signups" value={stats.signups.toLocaleString("en-US")} note={`New accounts in ${period}`} />
          <StatTile
            icon={<Coins size={18} />}
            label="Paying customers"
            value={stats.payingPeople.toLocaleString("en-US")}
            note={stats.signupToPaid === null ? "No signups yet" : `${formatPercent(stats.signupToPaid)} of signups in this period`}
          />
          <StatTile
            icon={<ChartBars size={18} />}
            label="AI cost"
            value={formatUsd(stats.ai.costUsd)}
            note={`${formatCompact(stats.ai.inputTokens + stats.ai.outputTokens)} tokens, ${stats.ai.calls.toLocaleString("en-US")} calls`}
          />
          <StatTile
            icon={<Building size={18} />}
            label="University enquiries"
            value={stats.leads.toLocaleString("en-US")}
            note="From the universities form"
          />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <FunnelCard steps={stats.funnel} period={period} />
        <AiCostCard stats={stats} />
      </div>

      <DecisionPanel month={month} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <LeadsCard leads={latestLeads} count={stats.leads} period={period} />
        <SourcesCard stats={stats} period={period} />
      </div>

      <div className="mt-8 flex gap-3 text-sm leading-relaxed text-muted">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          Visits are not tracked (the site sets no tracking cookies), so the funnel starts at signup. Each step counts people, with the number of
          events beside it; someone can reach a later step in this period after signing up earlier, so a step can be larger than the one before. Days
          are UTC and include today. Event rows are deleted after {EVENT_RETENTION_DAYS} days. Updated {dateTimeFmt.format(new Date(generatedAt))}{" "}
          UTC.
        </p>
      </div>
    </>
  );
}

function StatTile({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="flex flex-col bg-surface p-5 sm:p-7">
      <dt className="flex items-center gap-2 text-sm font-medium text-muted">
        <span className="text-subtle">{icon}</span>
        {label}
      </dt>
      <dd className="mt-3 text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-[2.6rem] sm:leading-none">{value}</dd>
      <dd className="mt-2 text-xs leading-snug text-subtle sm:text-sm">{note}</dd>
    </div>
  );
}

function CardHeading({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Kicker>{kicker}</Kicker>
        <h2 id={id} className="mt-2 text-2xl font-medium tracking-tight text-ink">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function FunnelCard({ steps, period }: { steps: FunnelStep[]; period: string }) {
  const max = Math.max(1, ...steps.map((s) => s.people));
  const empty = steps.every((s) => s.events === 0);
  return (
    <section aria-labelledby="funnel-title" className="h-full min-w-0">
      <Card padding="lg" className="h-full">
        <CardHeading id="funnel-title" kicker="Funnel" title={`From signup to paid, ${period}`} />
        {empty ? (
          <p className="mt-8 rounded-2xl bg-surface-2 p-5 text-sm text-muted ring-1 ring-inset ring-line">No funnel events in this period yet.</p>
        ) : (
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={s.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2.5 text-[15px] font-medium text-ink">
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                    {s.label}
                  </span>
                  <span className="text-sm text-muted tabular-nums">
                    {s.fromPrevious === null ? (i === 0 ? "" : "–") : `${formatPercent(s.fromPrevious)} of the step before`}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-5 flex-1 overflow-hidden rounded-r-[4px] bg-surface-3" aria-hidden="true">
                    <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${(s.people / max) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-sm tabular-nums text-ink">
                    <span className="font-semibold">{s.people.toLocaleString("en-US")}</span>
                    <span className="text-subtle"> {s.people === 1 ? "person" : "people"}</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-subtle tabular-nums">
                  {s.events.toLocaleString("en-US")} {s.events === 1 ? "event" : "events"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}

function AiCostCard({ stats }: { stats: WindowStats }) {
  const { ai } = stats;
  const max = Math.max(0, ...ai.perDay.map((d) => d.costUsd));
  const rows: [string, string][] = [
    ["Total cost", formatUsd(ai.costUsd)],
    ["Input tokens", ai.inputTokens.toLocaleString("en-US")],
    ["Output tokens", ai.outputTokens.toLocaleString("en-US")],
    ["AI calls", ai.calls.toLocaleString("en-US")],
    ["Interviews finished", ai.finishedInterviews.toLocaleString("en-US")],
    ["Per finished interview", ai.costPerFinished === null ? "–" : formatUsd(ai.costPerFinished)],
  ];
  return (
    <section aria-labelledby="ai-title" className="h-full min-w-0">
      <Card padding="lg" className="h-full">
        <CardHeading id="ai-title" kicker="AI cost" title="Cost per day">
          <Tag tone="neutral">Estimated, from our price table</Tag>
        </CardHeading>
        <CostChart days={ai.perDay} max={max} />
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight text-ink tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Cost per finished interview is all AI cost in the period divided by the interviews finished in it, so unfinished interviews are included in
          the cost. Anthropic&rsquo;s invoice is the real figure.
        </p>
      </Card>
    </section>
  );
}

function CostChart({ days, max }: { days: DayPoint[]; max: number }) {
  if (max === 0) {
    return <p className="mt-8 rounded-2xl bg-surface-2 p-5 text-sm text-muted ring-1 ring-inset ring-line">No AI usage in this period yet.</p>;
  }
  const middle = days[Math.floor((days.length - 1) / 2)];
  return (
    <figure className="mt-8">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2" aria-hidden="true">
          <span className="text-[11px] text-subtle tabular-nums">{formatUsd(max)}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex h-44 items-end gap-[2px] border-b border-line pt-6" aria-hidden="true">
          {days.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-6 rounded-t-[4px] bg-brand transition-opacity group-hover:opacity-80"
                style={{ height: d.costUsd > 0 ? `max(2px, ${(d.costUsd / max) * 100}%)` : "0" }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs text-ink-contrast shadow-float group-hover:block">
                <span className="font-medium">{shortDay(d.date)}</span>
                <span className="block tabular-nums opacity-80">
                  {formatUsd(d.costUsd)} · {formatCompact(d.tokens)} tokens
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-subtle" aria-hidden="true">
        <span>{shortDay(days[0].date)}</span>
        {days.length > 2 ? <span>{shortDay(middle.date)}</span> : null}
        <span>{shortDay(days[days.length - 1].date)}</span>
      </div>
      <figcaption className="sr-only">AI cost per day; the same figures are in the table below.</figcaption>
      <details className="mt-4 text-sm">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-1 font-medium text-brand hover:underline">
          Show as a table
        </summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-[1.25rem] ring-1 ring-inset ring-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Day
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Cost
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Tokens
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Calls
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-2 text-ink">{shortDay(d.date)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">{formatUsd(d.costUsd)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{d.tokens.toLocaleString("en-US")}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{d.calls.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

const BAND_TEXT = {
  go: { name: "Go", tone: "lime" as const },
  adjust: { name: "Adjust", tone: "butter" as const },
  stop: { name: "Stop or pivot", tone: "peach" as const },
};

/** The reading sits on an always-white panel, so its pill uses the light-mode colours in both themes. */
const READING_PILL = {
  go: "bg-[#d6f55c] text-[#1b2300]",
  adjust: "bg-[#fff6d6] text-[#0b1020] ring-1 ring-inset ring-[#ecdca0]",
  stop: "bg-[#ffe8dc] text-[#0b1020] ring-1 ring-inset ring-[#f3cdb9]",
};

function DecisionPanel({ month }: { month: WindowStats }) {
  const t = DECISION_TARGETS;
  const reading = decisionReading(month.signups, month.payingPeople);
  const bands = [
    {
      key: "go" as const,
      text: `${t.go.signups}+ free signups and ${t.go.paying}+ paying customers, or ${t.go.payingShare * 100}%+ of signups paying.`,
    },
    {
      key: "adjust" as const,
      text: `${t.adjust.signupsFrom}–${t.adjust.signupsTo} signups or ${t.adjust.payingFrom}–${t.adjust.payingTo} paying. Fix the funnel and run 2 more weeks.`,
    },
    { key: "stop" as const, text: `Under ${t.stop.signupsUnder} signups and under ${t.stop.payingUnder} paying.` },
  ];
  return (
    <section aria-labelledby="decision-title" className="bg-night-glow mt-6 overflow-hidden rounded-[2rem] p-6 text-on-night sm:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Kicker onNight>The 30-day decision</Kicker>
          <h2 id="decision-title" className="mt-4 text-[1.75rem] font-medium leading-tight tracking-tight text-white sm:text-4xl">
            Targets for day 30 <span className="serif-accent text-lime">after launch</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-on-night-muted">
          These are the founder&rsquo;s targets from the plan (SPEC section 12). They are goals, not results.
        </p>
      </div>

      <ul className="mt-8 grid gap-3 md:grid-cols-3">
        {bands.map((b) => (
          <li key={b.key} className="rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10">
            <Tag tone={BAND_TEXT[b.key].tone}>Target: {BAND_TEXT[b.key].name}</Tag>
            <p className="mt-3 text-sm leading-relaxed text-on-night">{b.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 rounded-[1.5rem] bg-white p-6 text-[#0b1020] sm:p-7 lg:grid-cols-[1fr_1fr_0.9fr] lg:items-center">
        <Meter label="Signups in the last 30 days" value={month.signups} target={t.go.signups} />
        <Meter label="Paying customers in the last 30 days" value={month.payingPeople} target={t.go.paying} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#4a4f63]">If today were day 30</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex rounded-full px-3 py-1 text-sm font-medium", READING_PILL[reading.band])}>
              {BAND_TEXT[reading.band].name}
            </span>
            <span className="text-sm text-[#4a4f63] tabular-nums">
              {reading.payingShare === null ? "" : `${formatPercent(reading.payingShare)} of signups paying`}
            </span>
          </p>
          {!reading.exact ? <p className="mt-2 text-xs leading-snug text-[#4a4f63]">Between the bands in the plan; closest to Adjust.</p> : null}
        </div>
      </div>
    </section>
  );
}

function Meter({ label, value, target }: { label: string; value: number; target: number }) {
  const share = Math.min(1, value / target);
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#4a4f63]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value.toLocaleString("en-US")}
        <span className="text-base font-normal text-[#4a4f63]"> of {target} for Go</span>
      </p>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(value, target)}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e9ebf2]"
      >
        <div className="h-full rounded-full bg-[#0b1020]" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

function LeadsCard({ leads, count, period }: { leads: LatestLead[]; count: number; period: string }) {
  return (
    <section aria-labelledby="leads-title" className="min-w-0">
      <Card padding="lg">
        <CardHeading id="leads-title" kicker="Universities and clubs" title="Latest enquiries">
          <Tag tone="lavender">
            {count} in {period}
          </Tag>
        </CardHeading>
        {leads.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-surface-2 p-5 text-sm text-muted ring-1 ring-inset ring-line">No enquiries yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[1.5rem] ring-1 ring-inset ring-line">
            {leads.map((l) => (
              <li
                key={`${l.created_at}-${l.org}`}
                className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:items-center sm:gap-6 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink">{l.org}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="font-mono tabular-nums">{shortDay(l.created_at.slice(0, 10))}</span>
                    {l.size ? <span> · {l.size}</span> : null}
                  </p>
                </div>
                <a
                  href={`mailto:${l.email}`}
                  className="min-w-0 truncate text-sm text-brand underline-offset-4 hover:underline sm:max-w-[16rem] sm:text-right"
                >
                  {l.email}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-subtle">Shown here only. Emails are never written to logs.</p>
      </Card>
    </section>
  );
}

function SourcesCard({ stats, period }: { stats: WindowStats; period: string }) {
  const max = Math.max(1, ...stats.signupsBySource.map((s) => s.people));
  const plans = stats.purchasesByPlan;
  return (
    <section aria-labelledby="sources-title" className="min-w-0">
      <Card padding="lg">
        <CardHeading id="sources-title" kicker="Where signups came from" title="Campaign tags" />
        <p className="mt-2 text-sm text-muted">The utm_source of each signup&rsquo;s first visit, {period}.</p>
        {stats.signupsBySource.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-surface-2 p-5 text-sm text-muted ring-1 ring-inset ring-line">No signups in this period yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {stats.signupsBySource.map((s) => (
              <li key={s.source}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{s.source}</span>
                  <span className="tabular-nums text-muted">{s.people}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-r-[4px] bg-surface-3" aria-hidden="true">
                  <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${(s.people / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink">Purchases by plan</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            <li>
              <Tag tone="sky">Monthly: {plans.monthly}</Tag>
            </li>
            <li>
              <Tag tone="mint">90-Day Pass: {plans.pass90}</Tag>
            </li>
            {plans.other > 0 ? (
              <li>
                <Tag>Other: {plans.other}</Tag>
              </li>
            ) : null}
          </ul>
        </div>
      </Card>
    </section>
  );
}
