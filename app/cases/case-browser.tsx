"use client";

import { useMemo, useState } from "react";
import { CaseCard, DIFFICULTY_LABELS } from "@/components/marketing/case-card";
import { filterCases, isFiltering, NO_FILTERS, typeCounts, typeFacets, type CaseFilters } from "@/components/practice/case-list";
import { SelectField } from "@/components/practice/select-field";
import { Button } from "@/components/ui/button";
import { Cross, Search } from "@/components/ui/icons";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import type { CaseSummary } from "@/lib/content/public";
import { cn } from "@/lib/ui/cn";

// The filterable case grid on /cases. Type is a row of toggle buttons with counts
// (counted with the other filters applied); industry and difficulty are selects.

function TypeButton({ label, count, pressed, onClick }: { label: string; count: number; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-4 pr-1.5 text-sm font-medium transition-[background-color,box-shadow,color] duration-200",
        pressed
          ? "bg-ink text-ink-contrast shadow-soft"
          : "bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2 hover:ring-line-strong",
        count === 0 && !pressed && "text-subtle",
      )}
    >
      {label}
      <span
        className={cn(
          "grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-semibold tabular-nums",
          pressed ? "bg-ink-contrast/15 text-ink-contrast" : "bg-surface-2 text-muted ring-1 ring-inset ring-line",
        )}
      >
        {count}
        <span className="sr-only"> {count === 1 ? "case" : "cases"}</span>
      </span>
    </button>
  );
}

export function CaseBrowser({ cases }: { cases: CaseSummary[] }) {
  const [filters, setFilters] = useState<CaseFilters>(NO_FILTERS);
  const set = (patch: Partial<CaseFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const types = useMemo(() => typeCounts(cases).map((t) => t.type), [cases]);
  const industries = useMemo(() => [...new Set(cases.map((c) => c.industry))].sort(), [cases]);
  const difficulties = useMemo(() => [...new Set(cases.map((c) => c.difficulty))].sort(), [cases]);

  const shown = filterCases(cases, filters);
  const facets = typeFacets(cases, filters);
  const filtering = isFiltering(filters);

  return (
    <div>
      <form
        className="rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line sm:p-6"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filter cases"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,17rem)_minmax(0,13rem)] lg:items-end">
          <div className="min-w-0">
            <p id="filter-type-label" className="text-sm font-medium text-ink">
              Type
            </p>
            <div
              role="group"
              aria-labelledby="filter-type-label"
              className="-mx-5 mt-1 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
              <TypeButton label="All types" count={facets.all} pressed={!filters.type} onClick={() => set({ type: "" })} />
              {types.map((t) => (
                <TypeButton
                  key={t}
                  label={CASE_TYPE_LABELS[t] ?? t}
                  count={facets.byType[t] ?? 0}
                  pressed={filters.type === t}
                  onClick={() => set({ type: filters.type === t ? "" : t })}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:contents">
            <SelectField
              id="filter-industry"
              label="Industry"
              value={filters.industry}
              onChange={(industry) => set({ industry })}
              options={[{ value: "", label: "All industries" }, ...industries.map((i) => ({ value: i, label: i }))]}
            />
            <SelectField
              id="filter-difficulty"
              label="Difficulty"
              value={filters.difficulty}
              onChange={(difficulty) => set({ difficulty })}
              options={[
                { value: "", label: "Any difficulty" },
                ...difficulties.map((d) => ({ value: String(d), label: DIFFICULTY_LABELS[d] })),
              ]}
            />
          </div>
        </div>
      </form>

      <div className="mt-6 flex min-h-10 flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted" role="status" aria-live="polite">
          Showing <span className="font-semibold text-ink tabular-nums">{shown.length}</span> of{" "}
          <span className="tabular-nums">{cases.length}</span> cases
        </p>
        {filtering ? (
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-2 hover:ring-line-strong"
          >
            <Cross size={14} strokeWidth={2.2} />
            Clear filters
          </button>
        ) : null}
      </div>

      {shown.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.slug}>
              <CaseCard c={c} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-5 rounded-[1.75rem] bg-surface-2 p-7 ring-1 ring-inset ring-line sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-muted ring-1 ring-inset ring-line">
              <Search size={20} />
            </span>
            <div>
              <p className="text-lg font-medium text-ink">No cases match those filters.</p>
              <p className="mt-1 text-sm text-muted">Try another type or difficulty, or go back to every case.</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setFilters(NO_FILTERS)}>
            Show all cases
          </Button>
        </div>
      )}
    </div>
  );
}
