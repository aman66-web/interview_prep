"use client";

import { useId, useState, type ReactNode } from "react";
import { IconBadge } from "@/components/ui/card";
import { Clock, Percent, TrendUp } from "@/components/ui/icons";
import { GROWTH_EXAMPLE } from "@/lib/tools/examples";
import { formatCompact, formatNumber, formatPercent, invalidNumberMessage, parseNumberInput } from "@/lib/tools/format";
import { cagr, compareDoubling, DOUBLING_TABLE_RATES, futureValue, type Outcome } from "@/lib/tools/growth";
import { cn } from "@/lib/ui/cn";
import { Announcer, NumberField, ScrollRegion } from "./fields";

// The growth rate calculator (/tools/growth-rate-calculator): CAGR, future value and
// doubling time, worked out in the browser from lib/tools/growth.ts as you type.

type Read = { value: number | null; error: string | null };

function read(raw: string): Read {
  const p = parseNumberInput(raw);
  if (p.kind === "number") return { value: p.value, error: null };
  return { value: null, error: p.kind === "empty" ? "Enter a number." : invalidNumberMessage(p, "Enter a number, like 40 or 12.5.") };
}

const show = (n: number) => (Math.abs(n) >= 1e6 ? formatCompact(n) : formatNumber(n, 2));

function Panel({ icon, title, intro, children, className, labelledBy }: { icon: ReactNode; title: string; intro: string; children: ReactNode; className?: string; labelledBy: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("flex flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-7", className)}>
      <div className="flex items-start gap-4">
        <IconBadge tone="ink">{icon}</IconBadge>
        <div>
          <h2 id={labelledBy} className="text-xl font-medium tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Answer({ label, outcome, render, detail }: { label: string; outcome: Outcome<number> | null; render: (n: number) => string; detail?: (n: number) => ReactNode }) {
  return (
    <div className="mt-auto pt-6">
      <div className="rounded-2xl bg-night p-5 text-on-night">
        <p className="text-sm text-on-night-muted">{label}</p>
        {outcome?.ok ? (
          <>
            <p className="mt-1 text-4xl font-medium tracking-tight text-white tabular-nums">{render(outcome.value)}</p>
            {detail ? <p className="mt-1.5 text-sm text-on-night-muted">{detail(outcome.value)}</p> : null}
          </>
        ) : (
          <p className="mt-1 text-base text-white">{outcome ? outcome.message : "Fix the highlighted fields."}</p>
        )}
      </div>
    </div>
  );
}

export function GrowthRateCalculator() {
  const id = useId();
  const ex = GROWTH_EXAMPLE;
  const [c, setC] = useState({ start: String(ex.cagr.start), end: String(ex.cagr.end), years: String(ex.cagr.years) });
  const [f, setF] = useState({ value: String(ex.future.value), rate: String(ex.future.ratePct), years: String(ex.future.years) });
  const [rateText, setRateText] = useState(String(ex.doubling.ratePct));

  const cs = { start: read(c.start), end: read(c.end), years: read(c.years) };
  const cagrOut = cs.start.value !== null && cs.end.value !== null && cs.years.value !== null ? cagr(cs.start.value, cs.end.value, cs.years.value) : null;

  const fs = { value: read(f.value), rate: read(f.rate), years: read(f.years) };
  const fvOut = fs.value.value !== null && fs.rate.value !== null && fs.years.value !== null ? futureValue(fs.value.value, fs.rate.value, fs.years.value) : null;

  const rate = read(rateText);
  const doubling = rate.value !== null ? compareDoubling(rate.value) : null;

  const summary = [
    cagrOut?.ok ? `Growth rate ${formatPercent(cagrOut.value, 2)} a year.` : null,
    fvOut?.ok ? `Future value ${show(fvOut.value)}.` : null,
    doubling?.ok ? `Doubles in ${formatNumber(doubling.value.exact, 1)} years; the rule of 72 says ${formatNumber(doubling.value.rule72, 1)}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Announcer text={summary} />

      <Panel labelledBy={`${id}-cagr`} icon={<TrendUp size={20} />} title="Growth rate (CAGR)" intro="The steady yearly rate that takes the start value to the end value.">
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField id={`${id}-cs`} label="Start value" value={c.start} onChange={(v) => setC({ ...c, start: v })} error={cs.start.error} />
          <NumberField id={`${id}-ce`} label="End value" value={c.end} onChange={(v) => setC({ ...c, end: v })} error={cs.end.error} />
          <NumberField id={`${id}-cy`} className="col-span-2 sm:col-span-1" label="Years" suffix="years" value={c.years} onChange={(v) => setC({ ...c, years: v })} error={cs.years.error} />
        </div>
        <p className="mt-3 text-xs text-muted">Any unit works, as long as start and end use the same one: dollars, customers, stores.</p>
        <Answer
          label="Compound annual growth rate"
          outcome={cagrOut}
          render={(v) => formatPercent(v, 2)}
          detail={() =>
            cs.start.value !== null && cs.end.value !== null && cs.start.value > 0
              ? `A ${formatNumber(cs.end.value / cs.start.value, 2)}× change in total (${formatPercent((cs.end.value / cs.start.value - 1) * 100, 1)}), spread over ${formatNumber(cs.years.value ?? 0, 2)} years.`
              : null
          }
        />
      </Panel>

      <Panel labelledBy={`${id}-fv`} icon={<Percent size={20} />} title="Future value" intro="What a value grows to at a steady yearly rate.">
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField id={`${id}-fv-v`} label="Value today" value={f.value} onChange={(v) => setF({ ...f, value: v })} error={fs.value.error} />
          <NumberField id={`${id}-fv-r`} label="Growth a year" suffix="%" value={f.rate} onChange={(v) => setF({ ...f, rate: v })} error={fs.rate.error} hint="Negative for a fall." />
          <NumberField id={`${id}-fv-y`} className="col-span-2 sm:col-span-1" label="Years" suffix="years" value={f.years} onChange={(v) => setF({ ...f, years: v })} error={fs.years.error} />
        </div>
        <Answer
          label="Future value"
          outcome={fvOut}
          render={show}
          detail={(v) => (fs.value.value ? `${formatNumber(v / fs.value.value, 2)}× today's value.` : null)}
        />
      </Panel>

      <Panel
        labelledBy={`${id}-dbl`}
        className="lg:col-span-2"
        icon={<Clock size={20} />}
        title="Doubling time"
        intro="How long something growing at a steady rate takes to double: worked out exactly, and with the rule of 72."
      >
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
          <div>
            <NumberField id={`${id}-dr`} label="Growth a year" suffix="%" value={rateText} onChange={setRateText} error={rate.error} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-night p-4 text-on-night">
                <p className="text-sm text-on-night-muted">Exact</p>
                <p className="mt-1 text-3xl font-medium tracking-tight text-white tabular-nums">{doubling?.ok ? formatNumber(doubling.value.exact, 2) : "–"}</p>
                <p className="text-xs text-on-night-muted">years</p>
              </div>
              <div className="rounded-2xl bg-lime p-4 text-lime-ink">
                <p className="text-sm text-lime-ink/75">Rule of 72</p>
                <p className="mt-1 text-3xl font-medium tracking-tight tabular-nums">{doubling?.ok ? formatNumber(doubling.value.rule72, 2) : "–"}</p>
                <p className="text-xs text-lime-ink/75">years</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted" aria-live="off">
              {doubling?.ok
                ? Math.abs(doubling.value.errorPct) < 0.5
                  ? "At this rate the rule of 72 is almost exact."
                  : `The rule of 72 is ${formatPercent(Math.abs(doubling.value.errorPct), 1)} ${doubling.value.errorPct > 0 ? "too long" : "too short"} at this rate.`
                : (doubling?.message ?? "Enter a growth rate.")}
            </p>
          </div>
          <ScrollRegion label="Doubling time at common growth rates">
            <table className="w-full text-sm">
              <caption className="sr-only">Doubling time at common growth rates, exact and by the rule of 72</caption>
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left font-medium sm:px-4">
                    Growth a year
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
                    Exact (years)
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
                    Rule of 72
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
                    Rule is off by
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {DOUBLING_TABLE_RATES.map((r) => {
                  const row = compareDoubling(r);
                  if (!row.ok) return null;
                  const current = rate.value !== null && Math.abs(rate.value - r) < 1e-9;
                  return (
                    <tr key={r} className={cn(current && "bg-lime/40 dark:bg-lime/10")} aria-current={current ? "true" : undefined}>
                      <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink tabular-nums sm:px-4">
                        {r}%
                      </th>
                      <td className="px-3 py-2.5 text-right text-ink tabular-nums sm:px-4">{formatNumber(row.value.exact, 2, 2)}</td>
                      <td className="px-3 py-2.5 text-right text-ink tabular-nums sm:px-4">{formatNumber(row.value.rule72, 2, 2)}</td>
                      <td className="px-3 py-2.5 text-right text-muted tabular-nums sm:px-4">{formatNumber(Math.abs(row.value.errorPct), 1, 1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollRegion>
        </div>
      </Panel>
    </div>
  );
}
