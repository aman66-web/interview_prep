"use client";

import { useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Plus, Trash } from "@/components/ui/icons";
import { SIZING_EXAMPLE } from "@/lib/tools/examples";
import { formatCompact, formatMoneyCompact, formatNumber, formatPercent, invalidNumberMessage, parseNumberInput } from "@/lib/tools/format";
import { MAX_STEPS, RANGE_OPTIONS, sizeMarket, STEP_OPS, type SizingInput, type SizingResult, type StepOp } from "@/lib/tools/market-sizing";
import { cn } from "@/lib/ui/cn";
import { Announcer, CURRENCIES, type CurrencySymbol, NumberField, ScrollRegion, SelectField, TextField } from "./fields";

// The market sizing calculator (/tools/market-sizing-calculator). A chain of steps
// the visitor names and edits, worked out in the browser by lib/tools/market-sizing.ts.

type StepState = { id: number; label: string; op: StepOp; value: string; range: number };

const RANGE_SELECT = RANGE_OPTIONS.map((r) => ({ value: r, label: r === 0 ? "Sure (±0%)" : `±${r}%` }));
const OP_SELECT = STEP_OPS.map((o) => ({ value: o.value, label: o.label }));

function readValue(raw: string): { value: number | null; error: string | null } {
  const p = parseNumberInput(raw);
  if (p.kind === "number") return { value: p.value, error: null };
  return { value: null, error: p.kind === "empty" ? "Enter a number." : invalidNumberMessage(p, "Enter a number, like 50,000,000 or 50m.") };
}

export function MarketSizingCalculator() {
  const id = useId();
  const ex = SIZING_EXAMPLE;
  const [title, setTitle] = useState(ex.title);
  const [unitLabel, setUnitLabel] = useState(ex.unitLabel);
  const [currency, setCurrency] = useState<CurrencySymbol>("$");
  const [startLabel, setStartLabel] = useState(ex.start.label);
  const [startValue, setStartValue] = useState(formatNumber(ex.start.value));
  const [startRange, setStartRange] = useState<number>(ex.start.rangePct);
  const [steps, setSteps] = useState<StepState[]>(() => ex.steps.map((s, i) => ({ id: i + 1, label: s.label, op: s.op, value: formatNumber(s.value), range: s.rangePct })));
  const [priceValue, setPriceValue] = useState(ex.price ? formatNumber(ex.price.value) : "");
  const [priceRange, setPriceRange] = useState<number>(ex.price?.rangePct ?? 10);
  const addRef = useRef<HTMLButtonElement>(null);

  const update = (stepId: number, patch: Partial<StepState>) => setSteps((all) => all.map((s) => (s.id === stepId ? { ...s, ...patch } : s)));

  function addStep() {
    if (steps.length >= MAX_STEPS) return;
    const newId = Math.max(0, ...steps.map((s) => s.id)) + 1;
    setSteps((all) => [...all, { id: newId, label: `Step ${all.length + 1}`, op: "percent", value: "50", range: 10 }]);
    // Move focus to the new step's name once it is on screen.
    requestAnimationFrame(() => {
      const field = document.getElementById(`${id}-step-${newId}-label`);
      if (field instanceof HTMLInputElement) {
        field.focus();
        field.select();
      }
    });
  }

  function removeStep(stepId: number) {
    setSteps((all) => all.filter((s) => s.id !== stepId));
    requestAnimationFrame(() => addRef.current?.focus());
  }

  // Read every field; the maths runs only when they are all numbers.
  const start = readValue(startValue);
  const stepReads = steps.map((s) => readValue(s.value));
  const price = parseNumberInput(priceValue);
  const priceError = price.kind === "invalid" ? invalidNumberMessage(price, "Enter a number, or leave it empty for a count only.") : null;
  const allRead = start.value !== null && stepReads.every((r) => r.value !== null) && !priceError;

  let result: SizingResult | null = null;
  if (allRead) {
    const input: SizingInput = {
      start: { label: startLabel.trim() || "Starting number", value: start.value!, rangePct: startRange },
      steps: steps.map((s, i) => ({ label: s.label.trim() || `Step ${i + 1}`, op: s.op, value: stepReads[i].value!, rangePct: s.range })),
      price: price.kind === "number" ? { value: price.value, rangePct: priceRange } : null,
    };
    result = sizeMarket(input);
  }
  const issueFor = (field: "start" | "price" | number) => (result && !result.ok ? (result.issues.find((i) => i.field === field)?.message ?? null) : null);

  const unit = unitLabel.trim() || "units";
  const showMoney = (n: number) => formatMoneyCompact(n, currency);
  const showBase = (n: number) => (result?.ok && result.marketValue !== null ? showMoney(n) : `${formatCompact(n)}`);

  let summary = "Fix the highlighted fields to see the market size.";
  if (result?.ok) {
    const top = result.mostSensitive !== null ? result.sensitivity[result.mostSensitive] : null;
    summary = `Market size: ${formatCompact(result.units)} ${unit}${result.marketValue !== null ? `, worth ${showMoney(result.marketValue)}` : ""}.${
      result.allEqual ? " Every assumption moves the answer by the same amount." : top ? ` Most sensitive to: ${top.label}.` : ""
    }`;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Announcer text={summary} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <form onSubmit={(e) => e.preventDefault()} aria-labelledby={`${id}-in`} className="min-w-0 rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line sm:p-8">
          <h2 id={`${id}-in`} className="text-xl font-medium tracking-tight text-ink">
            Your estimate
          </h2>
          <p className="mt-1 text-sm text-muted">Example numbers are filled in. Change anything; the answer updates as you type.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <TextField id={`${id}-title`} label="What are you sizing?" value={title} onChange={setTitle} />
            <TextField id={`${id}-unit`} label="Counted in" value={unitLabel} onChange={setUnitLabel} placeholder="units a year" />
          </div>

          <ol className="relative mt-8 space-y-3">
            <span aria-hidden="true" className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-line-strong" />
            <li className="relative rounded-[1.5rem] bg-surface-2 p-4 ring-1 ring-inset ring-line sm:p-5">
              <StepHeader symbol="=" title="Start with" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1.5fr_1fr_0.9fr]">
                <TextField id={`${id}-start-label`} className="col-span-2 sm:col-span-1" label="Name" value={startLabel} onChange={setStartLabel} />
                <NumberField id={`${id}-start-value`} label="Number" value={startValue} onChange={setStartValue} error={start.error ?? issueFor("start")} />
                <SelectField id={`${id}-start-range`} label="Could be off by" value={startRange} options={RANGE_SELECT} onChange={setStartRange} />
              </div>
            </li>

            {steps.map((s, i) => {
              const read = stepReads[i];
              const op = STEP_OPS.find((o) => o.value === s.op)!;
              return (
                <li key={s.id} className="relative rounded-[1.5rem] bg-surface p-4 ring-1 ring-inset ring-line sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <StepHeader symbol={op.symbol} title={`Step ${i + 1}`} />
                    <div className="flex items-center gap-3">
                      {result?.ok ? (
                        <span className="rounded-full bg-surface-2 px-3 py-1 text-sm text-ink ring-1 ring-inset ring-line tabular-nums" aria-hidden="true">
                          = {formatCompact(result.chain[i + 1].runningTotal)}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeStep(s.id)}
                        className="grid size-10 shrink-0 place-items-center rounded-full text-muted ring-1 ring-inset ring-line transition-colors hover:bg-danger-soft hover:text-danger"
                        aria-label={`Remove step ${i + 1}: ${s.label || "unnamed"}`}
                      >
                        <Trash size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1.15fr_1fr_1fr]">
                    <TextField id={`${id}-step-${s.id}-label`} className="col-span-2 sm:col-span-3" label="Name" value={s.label} onChange={(v) => update(s.id, { label: v })} />
                    <SelectField id={`${id}-step-${s.id}-op`} label="Do this" value={s.op} options={OP_SELECT} onChange={(v) => update(s.id, { op: v })} />
                    <NumberField
                      id={`${id}-step-${s.id}-value`}
                      label={s.op === "percent" ? "Share" : s.op === "divide" ? "Divide by" : "Multiply by"}
                      suffix={s.op === "percent" ? "%" : undefined}
                      value={s.value}
                      onChange={(v) => update(s.id, { value: v })}
                      error={read.error ?? issueFor(i)}
                    />
                    <SelectField
                      id={`${id}-step-${s.id}-range`}
                      className="col-span-2 sm:col-span-1"
                      label="Could be off by"
                      value={s.range}
                      options={RANGE_SELECT}
                      onChange={(v) => update(s.id, { range: v })}
                    />
                  </div>
                </li>
              );
            })}

            <li className="relative pl-[0.65rem]">
              <button ref={addRef} type="button" onClick={addStep} disabled={steps.length >= MAX_STEPS} className={cn(buttonClasses({ variant: "secondary" }), "relative")}>
                <Plus size={16} /> Add a step
              </button>
              {steps.length >= MAX_STEPS ? <p className="mt-2 text-sm text-muted">That&rsquo;s the most steps the calculator takes ({MAX_STEPS}).</p> : null}
            </li>

            <li className="relative rounded-[1.5rem] bg-butter p-4 sm:p-5">
              <StepHeader symbol={currency} title="Average price (to get a value)" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <NumberField
                  id={`${id}-price`}
                  label="Price per unit"
                  optional
                  prefix={currency}
                  value={priceValue}
                  onChange={setPriceValue}
                  error={priceError ?? issueFor("price")}
                />
                <SelectField id={`${id}-price-range`} label="Could be off by" value={priceRange} options={RANGE_SELECT} onChange={setPriceRange} />
                <SelectField id={`${id}-cur`} className="col-span-2 sm:col-span-1" label="Currency" value={currency} options={CURRENCIES} onChange={setCurrency} />
              </div>
            </li>
          </ol>
        </form>

        <ResultPanel title={title} unit={unit} result={result} showMoney={showMoney} showBase={showBase} />
      </div>

      {result?.ok ? <Sensitivity result={result} show={showBase} /> : null}
    </div>
  );
}

function StepHeader({ symbol, title }: { symbol: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-base text-ink-contrast">
        {symbol}
      </span>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{title}</p>
    </div>
  );
}

function ResultPanel({
  title,
  unit,
  result,
  showMoney,
  showBase,
}: {
  title: string;
  unit: string;
  result: SizingResult | null;
  showMoney: (n: number) => string;
  showBase: (n: number) => string;
}) {
  const top = result?.ok && result.mostSensitive !== null ? result.sensitivity[result.mostSensitive] : null;
  return (
    <section aria-label="Results" className="bg-night-glow min-w-0 rounded-[1.75rem] p-6 text-on-night sm:p-8 lg:sticky lg:top-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-night-muted">{title.trim() || "Market size"}</p>
      {!result || !result.ok ? (
        <p className="mt-4 text-lg text-white">Fix the highlighted fields to see the market size.</p>
      ) : (
        <>
          <dl className="mt-5 space-y-6">
            <div>
              <dt className="text-sm text-on-night-muted">Market size</dt>
              <dd className="mt-1 text-[2.5rem] font-medium leading-none tracking-tight text-white tabular-nums sm:text-5xl">{formatCompact(result.units)}</dd>
              <dd className="mt-2 text-sm text-on-night-muted">
                {unit} <span className="tabular-nums">({formatNumber(result.units, 0)})</span>
              </dd>
            </div>
            {result.marketValue !== null ? (
              <div className="border-t border-white/10 pt-6">
                <dt className="text-sm text-on-night-muted">Market value</dt>
                <dd className="mt-1 text-4xl font-medium tracking-tight text-lime tabular-nums">{showMoney(result.marketValue)}</dd>
                <dd className="mt-2 text-sm text-on-night-muted">market size × average price</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-6 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
            <p className="text-sm text-on-night-muted">Most sensitive to</p>
            {result.allEqual ? (
              <p className="mt-1 text-[15px] leading-snug text-white">
                Every assumption moves the answer by the same amount, because the steps multiply. Check the one you are least sure of.
              </p>
            ) : top ? (
              <p className="mt-1 text-[15px] leading-snug text-white">
                <strong className="font-medium">{top.label}</strong>{" "}
                <span className="text-on-night-muted">
                  (±{top.rangePct}%) moves it between {showBase(top.low)} and {showBase(top.high)}, a swing of {formatPercent(top.swingPct, 0)}.
                </span>
              </p>
            ) : (
              <p className="mt-1 text-[15px] leading-snug text-white">Give an assumption a range to see what moves the answer.</p>
            )}
          </div>
          <ol className="mt-6 space-y-2 text-sm" aria-label="The chain">
            {result.chain.map((row, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] pb-2 last:border-0">
                <span className="min-w-0 truncate text-on-night-muted">
                  {i === 0 ? "" : row.op === "divide" ? "÷ " : "× "}
                  {i === 0 ? formatNumber(row.value) : row.op === "percent" ? `${formatNumber(row.value)}%` : formatNumber(row.value)}{" "}
                  <span className="text-on-night-muted/80">{row.label}</span>
                </span>
                <span className="shrink-0 text-white tabular-nums">{formatCompact(row.runningTotal)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function Sensitivity({ result, show }: { result: Extract<SizingResult, { ok: true }>; show: (n: number) => string }) {
  const titleId = useId();
  const rows = result.sensitivity.map((r, i) => ({ ...r, i })).sort((a, b) => b.swing - a.swing);
  const min = Math.min(result.base, ...rows.map((r) => r.low));
  const max = Math.max(result.base, ...rows.map((r) => r.high));
  const span = max - min || 1;
  const pos = (v: number) => ((v - min) / span) * 100;
  return (
    <section aria-labelledby={titleId} className="min-w-0 rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line sm:p-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 id={titleId} className="text-xl font-medium tracking-tight text-ink">
            What moves the answer
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Each assumption moved to the bottom and top of its range, with the others held still. The widest bar is the one to check first.
          </p>
        </div>
        <p className="text-sm text-muted">
          Your answer: <span className="font-medium text-ink tabular-nums">{show(result.base)}</span>
        </p>
      </div>
      {/* Phones and tablets: one card per assumption, so the low and high answers are never off
          screen and long names are never cut short. The table needs a laptop-wide screen. */}
      <ol className="mt-6 space-y-3 lg:hidden" aria-label="The answer at the low and high end of each assumption’s range, widest swing first">
        {rows.map((r, rank) => {
          const biggest = rank === 0 && r.swing > 0 && !result.allEqual;
          return (
            <li key={r.i} className="rounded-[1.25rem] bg-surface-2 p-4 ring-1 ring-inset ring-line">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-medium leading-snug text-ink [overflow-wrap:anywhere]">
                  {biggest ? <span className="mr-2 inline-block rounded-full bg-lime px-2 py-0.5 align-[1px] text-[11px] font-medium text-lime-ink">Biggest</span> : null}
                  {r.label}
                </p>
                <p className="shrink-0 text-sm text-muted tabular-nums">
                  <span className="sr-only">Could be off by </span>±{r.rangePct}%
                </p>
              </div>
              <div className="mt-3" aria-hidden="true">
                <SwingBar low={pos(r.low)} high={pos(r.high)} base={pos(result.base)} strong={biggest} />
              </div>
              <dl className="mt-2.5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Low</dt>
                  <dd className="text-ink tabular-nums">{show(r.low)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-muted">High</dt>
                  <dd className="text-ink tabular-nums">{show(r.high)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
      <ScrollRegion label="Table of what moves the answer" className="mt-6 hidden lg:block">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">The answer at the low and high end of each assumption&rsquo;s range, widest swing first</caption>
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Assumption
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Range
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Low
              </th>
              <th scope="col" className="w-[30%] px-4 py-3 font-medium">
                <span className="sr-only">Swing</span>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                High
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, rank) => (
              <tr key={r.i}>
                <th scope="row" className="max-w-[16rem] px-4 py-3 text-left font-medium text-ink">
                  <span className="flex items-center gap-2">
                    {rank === 0 && r.swing > 0 && !result.allEqual ? <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-medium text-lime-ink">Biggest</span> : null}
                    <span className="min-w-0 [overflow-wrap:anywhere]">{r.label}</span>
                  </span>
                </th>
                <td className="px-4 py-3 text-right text-muted tabular-nums">±{r.rangePct}%</td>
                <td className="px-4 py-3 text-right text-ink tabular-nums">{show(r.low)}</td>
                <td className="px-4 py-3" aria-hidden="true">
                  <SwingBar low={pos(r.low)} high={pos(r.high)} base={pos(result.base)} strong={rank === 0 && !result.allEqual} />
                </td>
                <td className="px-4 py-3 text-right text-ink tabular-nums">{show(r.high)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </section>
  );
}

/** One assumption's swing: a bar from its low to its high answer, with a tick at your answer. Positions in percent. */
function SwingBar({ low, high, base, strong }: { low: number; high: number; base: number; strong: boolean }) {
  return (
    <div className="relative h-3 rounded-full bg-surface-3">
      <div className={cn("absolute top-0 h-3 rounded-full", strong ? "bg-brand" : "bg-ink/70")} style={{ left: `${low}%`, width: `${Math.max(0.8, high - low)}%` }} />
      <div className="absolute -top-1 h-5 w-0.5 rounded bg-ink" style={{ left: `calc(${base}% - 1px)` }} />
    </div>
  );
}
