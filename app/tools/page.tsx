import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageOpenGraph } from "@/components/learn/seo";
import { TOOL_ICONS } from "@/components/tools/tool-meta";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { IconBadge } from "@/components/ui/card";
import { ArrowUpRight, Bolt, Book, Lock, Sparkle } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { allDrills } from "@/lib/drills";
import { findTool, type ToolInfo } from "@/lib/tools";
import { breakEven } from "@/lib/tools/break-even";
import { BREAK_EVEN_EXAMPLE, GROWTH_EXAMPLE, SIZING_EXAMPLE } from "@/lib/tools/examples";
import { formatCompact, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/tools/format";
import { cagr, compareDoubling } from "@/lib/tools/growth";
import { sizeMarket } from "@/lib/tools/market-sizing";
import { exampleQuestions } from "@/lib/tools/mental-maths";
import { cn } from "@/lib/ui/cn";

// Kept to about 60 characters (title) and 160 (description); tests/tools-pages.test.ts checks.
const DESCRIPTION =
  "Free tools for case interview maths: market sizing, break-even and growth rate calculators, plus a timed mental maths trainer. No login needed.";

export const metadata: Metadata = {
  title: "Free case interview tools",
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: pageOpenGraph({ title: "Free case interview tools", description: DESCRIPTION, path: "/tools" }),
};

// The pictures on each card are drawn from the tools' own example numbers, worked out
// by the same functions the tools use. They are decorative (hidden from screen readers).

function SizingPreview() {
  const r = sizeMarket(SIZING_EXAMPLE);
  if (!r.ok || r.marketValue === null) return null;
  const max = r.chain[0].runningTotal;
  const rows = [
    ...r.chain.map((c) => ({ label: c.label, value: formatCompact(c.runningTotal), share: c.runningTotal / max })),
  ];
  return (
    <div aria-hidden="true" className="rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-inset ring-ink/5 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Example chain</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((row, i) => (
          <li key={i}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-muted">{row.label}</span>
              <span className="shrink-0 font-medium text-ink tabular-nums">{row.value}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(4, Math.sqrt(row.share) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">Market value</span>
        <span className="font-medium text-ink tabular-nums">{formatMoneyCompact(r.marketValue)} a year</span>
      </p>
    </div>
  );
}

function BreakEvenPreview() {
  const ex = BREAK_EVEN_EXAMPLE;
  const r = breakEven(ex);
  if (!r.ok || !r.breaksEven) return null;
  const maxUnits = r.breakEvenUnits * 2;
  const maxMoney = Math.max(maxUnits * ex.price, ex.fixedCosts + maxUnits * ex.variableCost);
  const x = (u: number) => (u / maxUnits) * 200;
  const y = (m: number) => 78 - (m / maxMoney) * 72;
  return (
    <div aria-hidden="true" className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-ink/5">
      <svg viewBox="0 0 200 80" className="h-auto w-full">
        <line x1="0" y1="78" x2="200" y2="78" className="stroke-line-strong" />
        <line x1="0" y1={y(ex.fixedCosts)} x2="200" y2={y(ex.fixedCosts + maxUnits * ex.variableCost)} className="stroke-subtle" strokeWidth="2" />
        <line x1="0" y1={y(0)} x2="200" y2={y(maxUnits * ex.price)} className="stroke-brand" strokeWidth="2.5" />
        <circle cx={x(r.breakEvenUnits)} cy={y(r.breakEvenRevenue)} r="4.5" className="fill-ink" />
      </svg>
      <p className="mt-2 font-mono text-xs text-muted">
        Break-even <span className="text-ink">{formatNumber(r.breakEvenUnitsWhole)} units</span>
      </p>
    </div>
  );
}

function TrainerPreview() {
  const q = exampleQuestions()[0];
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex rounded-full bg-lime px-3 py-1 font-mono text-sm text-lime-ink">0:47</span>
        <span className="text-xs text-on-night-muted">6 right · 1 wrong</span>
      </div>
      <p className="rounded-2xl bg-white/[0.07] px-4 py-3 text-[15px] text-white ring-1 ring-inset ring-white/10">{q.prompt}</p>
      <p className="rounded-2xl bg-[#4ade80]/10 px-4 py-2.5 text-xs leading-relaxed text-on-night ring-1 ring-inset ring-[#4ade80]/25">
        Right. {q.explanation}
      </p>
    </div>
  );
}

function GrowthPreview() {
  const rate = cagr(GROWTH_EXAMPLE.cagr.start, GROWTH_EXAMPLE.cagr.end, GROWTH_EXAMPLE.cagr.years);
  const d = compareDoubling(GROWTH_EXAMPLE.doubling.ratePct);
  if (!rate.ok || !d.ok) return null;
  const pts = Array.from({ length: 11 }, (_, i) => {
    const x = i * 20;
    const y = 74 - (Math.pow(1 + rate.value / 100, i) - 1) * 33;
    return `${x},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
      <div className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-ink/5">
        <svg viewBox="0 0 200 80" className="h-auto w-full">
          <polyline points={pts} fill="none" className="stroke-brand" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="78" x2="200" y2="78" className="stroke-line-strong" />
        </svg>
        <p className="mt-2 font-mono text-xs text-muted">
          CAGR <span className="text-ink">{formatPercent(rate.value, 2)}</span>
        </p>
      </div>
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-inset ring-ink/5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Doubles at {GROWTH_EXAMPLE.doubling.ratePct}% a year</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-2xl font-medium tracking-tight text-ink tabular-nums">{formatNumber(d.value.exact, 2)}</p>
            <p className="text-xs text-muted">years, exact</p>
          </div>
          <div>
            <p className="text-2xl font-medium tracking-tight text-ink tabular-nums">{formatNumber(d.value.rule72, 2)}</p>
            <p className="text-xs text-muted">rule of 72</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, tone, className, preview, onNight = false, wide = false }: { tool: ToolInfo; tone: string; className?: string; preview: ReactNode; onNight?: boolean; wide?: boolean }) {
  const Icon = TOOL_ICONS[tool.slug];
  const open = <OpenPill onNight={onNight} />;
  return (
    <li className={className}>
      <Link
        href={`/tools/${tool.slug}`}
        className={cn(
          "group flex h-full flex-col gap-8 rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-8",
          wide && "lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-10",
          tone,
        )}
      >
        <div className={cn(wide && "lg:flex lg:flex-col")}>
          <div className="flex items-start justify-between gap-4">
            <IconBadge tone={onNight ? "glass" : "surface"}>{Icon ? <Icon size={20} /> : null}</IconBadge>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", onNight ? "bg-white/10 text-on-night" : "bg-surface/70 text-ink")}>Free, no login</span>
          </div>
          <h2 className={cn("mt-6 text-2xl font-medium tracking-tight", onNight ? "text-white" : "text-ink")}>{tool.title}</h2>
          <p className={cn("mt-2 max-w-md leading-relaxed", onNight ? "text-on-night-muted" : "text-ink/70")}>{tool.short}</p>
          {wide ? <div className="mt-auto hidden pt-8 lg:block">{open}</div> : null}
        </div>
        <div className={cn("mt-auto space-y-6", wide && "lg:mt-0 lg:self-end")}>
          {preview}
          <div className={cn(wide && "lg:hidden")}>{open}</div>
        </div>
      </Link>
    </li>
  );
}

function OpenPill({ onNight }: { onNight: boolean }) {
  return (
    <span className={cn("inline-flex h-11 items-center gap-2.5 rounded-full pl-5 pr-1.5 text-[15px] font-medium", onNight ? "bg-white text-[#0b1020]" : "bg-ink text-ink-contrast")}>
      Open tool
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-full transition-transform duration-200 group-hover:rotate-45",
          onNight ? "bg-[#0b1020] text-white" : "bg-ink-contrast text-ink",
        )}
      >
        <ArrowUpRight size={16} strokeWidth={2} />
      </span>
    </span>
  );
}

export default function ToolsPage() {
  const tool = (slug: string) => {
    const t = findTool(slug);
    if (!t) throw new Error(`Unknown tool ${slug}`);
    return t;
  };
  return (
    <>
      <PageHeader
        eyebrow={
          <Eyebrow tone="lime" icon={<Sparkle size={14} />}>
            Free tools
          </Eyebrow>
        }
        title={
          <>
            Tools for the maths <span className="serif-accent">cases run on</span>
          </>
        }
        intro="Three calculators and a timed trainer for the numbers case interviews ask for: market sizes, break-even, growth rates and quick mental maths."
      />

      <Container className="mt-6">
        <ul className="grid gap-4 md:grid-cols-6 [&>*]:min-w-0">
          <ToolCard tool={tool("market-sizing-calculator")} tone="bg-butter" className="md:col-span-4" preview={<SizingPreview />} wide />
          <ToolCard tool={tool("break-even-calculator")} tone="bg-mint" className="md:col-span-2" preview={<BreakEvenPreview />} />
          <ToolCard tool={tool("mental-maths-trainer")} tone="bg-night-glow" className="md:col-span-2" preview={<TrainerPreview />} onNight />
          <ToolCard tool={tool("growth-rate-calculator")} tone="bg-sky" className="md:col-span-4" preview={<GrowthPreview />} wide />
        </ul>

        <p className="mt-6 flex items-start gap-3 rounded-2xl bg-surface px-5 py-4 text-sm leading-relaxed text-muted ring-1 ring-inset ring-line sm:items-center">
          <Lock size={18} className="mt-0.5 shrink-0 text-ink sm:mt-0" />
          <span>
            <strong className="font-medium text-ink">All four are free, with no login.</strong> They run in your browser, so nothing you type is sent to us or saved.
          </span>
        </p>
      </Container>

      <Container className="mb-20 mt-16 sm:mb-28 sm:mt-24">
        <Kicker>Keep practising</Kicker>
        <h2 className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
          From calculator <span className="serif-accent">to case</span>
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              href: "/drills",
              icon: <Bolt size={20} />,
              title: "Drills",
              text: `${allDrills.length} short questions in mental maths, market sizing, frameworks and chart reading, each with a worked explanation.`,
              cta: "Try a drill",
              tone: "bg-lavender",
            },
            {
              href: "/guides",
              icon: <Book size={20} />,
              title: "Case guides",
              text: "How each type of case works, step by step, with worked examples whose maths our tests check.",
              cta: "Read the guides",
              tone: "bg-surface ring-1 ring-inset ring-line",
            },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("group flex h-full flex-col rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-8", item.tone)}
              >
                <IconBadge tone={item.tone.startsWith("bg-surface") ? "ink" : "surface"}>{item.icon}</IconBadge>
                <h3 className="mt-6 text-xl font-medium tracking-tight text-ink">{item.title}</h3>
                <p className="mt-2 max-w-lg leading-relaxed text-ink/70">{item.text}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  {item.cta} <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
