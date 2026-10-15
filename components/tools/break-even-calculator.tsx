"use client";

import { useId, useState } from "react";
import { breakEven, type BreakEvenIssue, type BreakEvenResult } from "@/lib/tools/break-even";
import { BREAK_EVEN_EXAMPLE } from "@/lib/tools/examples";
import { formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatYearsMonths, parseNumberInput } from "@/lib/tools/format";
import { Announcer, CURRENCIES, type CurrencySymbol, NumberField, SelectField, Stat } from "./fields";

// The break-even calculator (/tools/break-even-calculator). Everything is worked out
// in the browser from lib/tools/break-even.ts as you type; nothing is sent or stored.

type Field = "fixedCosts" | "price" | "variableCost" | "investment" | "expectedVolume";
const REQUIRED: Field[] = ["fixedCosts", "price", "variableCost"];

const start = (n: number) => formatNumber(n, 2);

function read(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};
  const numbers: Partial<Record<Field, number | null>> = {};
  for (const field of Object.keys(values) as Field[]) {
    const parsed = parseNumberInput(values[field]);
    if (parsed.kind === "number") numbers[field] = parsed.value;
    else if (parsed.kind === "invalid") errors[field] = "Enter a number, like 1,200 or 4.50.";
    else if (REQUIRED.includes(field)) errors[field] = "Enter a number.";
    else numbers[field] = null;
  }
  return { errors, numbers };
}

export function BreakEvenCalculator() {
  const id = useId();
  const [currency, setCurrency] = useState<CurrencySymbol>("$");
  const [values, setValues] = useState<Record<Field, string>>({
    fixedCosts: start(BREAK_EVEN_EXAMPLE.fixedCosts),
    price: start(BREAK_EVEN_EXAMPLE.price),
    variableCost: start(BREAK_EVEN_EXAMPLE.variableCost),
    investment: start(BREAK_EVEN_EXAMPLE.investment),
    expectedVolume: start(BREAK_EVEN_EXAMPLE.expectedVolume),
  });
  const set = (field: Field) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  const { errors, numbers } = read(values);
  const ready = Object.keys(errors).length === 0;
  const result: BreakEvenResult | null = ready
    ? breakEven({
        fixedCosts: numbers.fixedCosts as number,
        price: numbers.price as number,
        variableCost: numbers.variableCost as number,
        investment: numbers.investment ?? null,
        expectedVolume: numbers.expectedVolume ?? null,
      })
    : null;
  const issues: Partial<Record<Field, string>> = { ...errors };
  if (result && !result.ok) for (const issue of result.issues as BreakEvenIssue[]) issues[issue.field as Field] ??= issue.message;

  const money = (n: number) => formatMoney(n, currency);
  const big = (n: number) => formatMoneyCompact(n, currency);
  const spoken = result?.ok ? sayIt(result, numbers.fixedCosts as number, numbers.variableCost as number, numbers.expectedVolume ?? null, numbers.investment ?? null, money) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <form className="flex flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line sm:p-8" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${id}-in`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id={`${id}-in`} className="text-xl font-medium tracking-tight text-ink">
              Your numbers
            </h2>
            <p className="mt-1 text-sm text-muted">Costs and volumes per year. Example numbers are filled in.</p>
          </div>
          <SelectField id={`${id}-cur`} label="Currency" value={currency} options={CURRENCIES} onChange={setCurrency} className="w-44" />
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <NumberField
            id={`${id}-fixed`}
            className="sm:col-span-2"
            label="Fixed costs per year"
            prefix={currency}
            value={values.fixedCosts}
            onChange={set("fixedCosts")}
            error={issues.fixedCosts}
            hint="Costs that don't change with how much you sell: rent, salaries, insurance."
          />
          <NumberField id={`${id}-price`} label="Price per unit" prefix={currency} value={values.price} onChange={set("price")} error={issues.price} />
          <NumberField
            id={`${id}-var`}
            label="Variable cost per unit"
            prefix={currency}
            value={values.variableCost}
            onChange={set("variableCost")}
            error={issues.variableCost}
            hint="What each extra unit costs to make or serve."
          />
          <NumberField
            id={`${id}-inv`}
            label="Upfront investment"
            optional
            prefix={currency}
            value={values.investment}
            onChange={set("investment")}
            error={issues.investment}
            hint="Paid once at the start. Used for payback."
          />
          <NumberField
            id={`${id}-vol`}
            label="Expected sales per year"
            optional
            suffix="units"
            value={values.expectedVolume}
            onChange={set("expectedVolume")}
            error={issues.expectedVolume}
            hint="Used for profit, payback and margin of safety."
          />
        </div>
        {spoken ? (
          <div className="mt-8 rounded-2xl bg-surface-2 p-5 ring-1 ring-inset ring-line lg:mt-auto">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Say it like this</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">&ldquo;{spoken}&rdquo;</p>
          </div>
        ) : null}
      </form>

      <Results result={result} money={money} big={big} expectedVolume={numbers.expectedVolume ?? null} lines={ready ? { fixed: numbers.fixedCosts as number, price: numbers.price as number, variable: numbers.variableCost as number } : null} />
    </div>
  );
}

/** The answer as you might say it in an interview, built from the live numbers. */
function sayIt(result: Extract<BreakEvenResult, { ok: true }>, fixed: number, variable: number, expected: number | null, investment: number | null, money: (n: number) => string): string {
  if (!result.breaksEven) {
    return `Each unit ${result.contribution === 0 ? "makes nothing" : `loses ${money(-result.contribution)}`} before we count fixed costs, so no volume breaks even. The price has to be above ${money(variable)} first.`;
  }
  const units = formatNumber(result.breakEvenUnitsWhole, 0);
  let out = `Each unit contributes ${money(result.contribution)}, so covering ${money(fixed)} of fixed costs takes ${units} units a year, or ${money(result.breakEvenRevenue)} of revenue.`;
  if (expected !== null && result.profitAtExpected !== null) {
    const vs = expected >= result.breakEvenUnits ? "above" : "below";
    out += ` We expect ${formatNumber(expected, 0)}, which is ${vs} that, so we ${result.profitAtExpected >= 0 ? `make ${money(result.profitAtExpected)}` : `lose ${money(-result.profitAtExpected)}`} a year`;
    out += result.payback.kind === "years" && investment ? ` and earn back the ${money(investment)} in ${formatYearsMonths(result.payback.years)}.` : ".";
  }
  return out;
}

type Lines = { fixed: number; price: number; variable: number };

function Results({
  result,
  money,
  big,
  lines,
  expectedVolume,
}: {
  result: BreakEvenResult | null;
  money: (n: number) => string;
  big: (n: number) => string;
  lines: Lines | null;
  expectedVolume: number | null;
}) {
  let summary = "Fix the highlighted fields to see the break-even point.";
  if (result?.ok && result.breaksEven) {
    summary = `Break-even at ${formatNumber(result.breakEvenUnitsWhole, 0)} units a year, or ${money(result.breakEvenRevenue)} of revenue. Each unit contributes ${money(result.contribution)}.`;
  } else if (result?.ok) {
    summary = "The price doesn't cover the variable cost, so no volume breaks even.";
  }

  return (
    <section aria-label="Results" className="bg-night-glow relative overflow-hidden rounded-[1.75rem] p-6 text-on-night sm:p-8">
      <Announcer text={summary} />
      {!result || !result.ok ? (
        <div className="flex h-full min-h-64 flex-col justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Results</p>
          <p className="mt-3 max-w-sm text-lg text-white">Fix the highlighted fields to see the break-even point.</p>
        </div>
      ) : !result.breaksEven ? (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Results</p>
          <p className="mt-4 text-3xl font-medium tracking-tight text-white sm:text-4xl">No break-even point</p>
          <div className="mt-5 rounded-2xl bg-white/[0.06] p-4 text-sm leading-relaxed text-on-night ring-1 ring-inset ring-white/10" role="note">
            {result.contribution === 0
              ? "Each unit sells for exactly what it costs to make, so selling more never covers the fixed costs."
              : `Each unit loses ${money(-result.contribution)} before any fixed costs, so selling more only makes the loss bigger.`}{" "}
            Raise the price above the variable cost, or cut the variable cost.
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <Stat onNight label="Contribution per unit" value={money(result.contribution)} />
            {result.profitAtExpected !== null ? <Stat onNight label="Profit at expected sales" value={money(result.profitAtExpected)} detail="a loss, every year" /> : null}
          </dl>
        </div>
      ) : (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">Break-even volume</p>
          <p className="mt-3 text-[2.75rem] font-medium leading-none tracking-tight text-white tabular-nums sm:text-6xl">
            {formatNumber(result.breakEvenUnitsWhole, 0)}
            <span className="ml-2 text-lg font-normal text-on-night-muted sm:text-xl">units a year</span>
          </p>
          {Math.abs(result.breakEvenUnits - result.breakEvenUnitsWhole) > 1e-9 ? (
            <p className="mt-2 text-sm text-on-night-muted">Exactly {formatNumber(result.breakEvenUnits, 2)}, rounded up to whole units.</p>
          ) : null}
          <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-white/10 pt-6">
            <Stat onNight label="Break-even revenue" value={big(result.breakEvenRevenue)} />
            <Stat onNight label="Contribution per unit" value={money(result.contribution)} />
            <Stat onNight label="Contribution margin" value={formatPercent(result.contributionMargin * 100)} detail="of the price" />
            <Stat
              onNight
              label="Profit at expected sales"
              value={result.profitAtExpected === null ? "–" : big(result.profitAtExpected)}
              detail={result.profitAtExpected === null ? "Add expected sales" : result.profitAtExpected < 0 ? "a loss" : "a year"}
            />
          </dl>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
              <p className="text-sm text-on-night-muted">Payback</p>
              <p className="mt-1 text-lg font-medium text-white">{paybackText(result, money)}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
              <p className="text-sm text-on-night-muted">Margin of safety</p>
              <p className="mt-1 text-lg font-medium text-white">
                {result.marginOfSafety === null
                  ? "Add expected sales"
                  : result.marginOfSafety >= 0
                    ? `Sales can fall ${formatPercent(result.marginOfSafety * 100, 0)}`
                    : `${formatPercent(-result.marginOfSafety * 100, 0)} short of break-even`}
              </p>
            </div>
          </div>
          {lines ? <BreakEvenChart result={result} lines={lines} expected={expectedVolume} /> : null}
        </div>
      )}
    </section>
  );
}

function paybackText(result: Extract<BreakEvenResult, { breaksEven: true }>, money: (n: number) => string): string {
  switch (result.payback.kind) {
    case "no-investment":
      return "No investment entered";
    case "needs-volume":
      return "Add expected sales";
    case "never":
      return result.payback.yearlyProfit === 0 ? "Never: no profit at that volume" : `Never: loses ${money(-result.payback.yearlyProfit)} a year`;
    case "years":
      return `${formatNumber(result.payback.years, 2)} years (${formatYearsMonths(result.payback.years)})`;
  }
}

/** Revenue and total cost against volume, with the break-even point. Decorative: the numbers are all in the text above. */
function BreakEvenChart({ result, lines, expected }: { result: Extract<BreakEvenResult, { breaksEven: true }>; lines: Lines; expected: number | null }) {
  const { fixed, price, variable } = lines;
  const maxUnits = Math.max(result.breakEvenUnits * 2, (expected ?? 0) * 1.2, 1);
  const maxMoney = Math.max(maxUnits * price, fixed + maxUnits * variable, 1);
  const W = 320;
  const H = 150;
  const x = (u: number) => (u / maxUnits) * W;
  const y = (m: number) => H - (m / maxMoney) * H;
  const be = { x: x(result.breakEvenUnits), y: y(result.breakEvenRevenue) };
  const end = { rev: y(maxUnits * price), cost: y(fixed + maxUnits * variable) };

  return (
    <figure className="mt-6 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/10">
      <svg viewBox={`-4 -6 ${W + 8} ${H + 12}`} className="h-auto w-full" aria-hidden="true">
        <line x1={0} y1={H} x2={W} y2={H} className="stroke-white/20" strokeWidth={1} />
        <polygon points={`0,${y(fixed)} ${be.x},${be.y} 0,${H}`} className="fill-[#f87171]/15" />
        <polygon points={`${be.x},${be.y} ${W},${end.rev} ${W},${end.cost}`} className="fill-lime/20" />
        <line x1={0} y1={y(fixed)} x2={W} y2={y(fixed)} className="stroke-white/25" strokeDasharray="3 4" strokeWidth={1} />
        <line x1={0} y1={y(fixed)} x2={W} y2={end.cost} className="stroke-[#a9afc4]" strokeWidth={2} />
        <line x1={0} y1={H} x2={W} y2={end.rev} className="stroke-lime" strokeWidth={2.5} />
        {expected !== null && expected > 0 ? (
          <line x1={x(expected)} y1={0} x2={x(expected)} y2={H} className="stroke-white/40" strokeDasharray="2 3" strokeWidth={1} />
        ) : null}
        <circle cx={be.x} cy={be.y} r={5} className="fill-white" />
        <circle cx={be.x} cy={be.y} r={9} className="fill-white/15" />
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-on-night-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-lime" /> Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#a9afc4]" /> Total costs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-white" /> Break-even
        </span>
        {expected !== null && expected > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0 border-l border-dashed border-white/60" /> Expected sales
          </span>
        ) : null}
        <span className="sr-only">
          A chart of revenue and total costs against units sold. The lines cross at the break-even point. Losses are shaded below it and profit above it.
        </span>
      </figcaption>
    </figure>
  );
}
