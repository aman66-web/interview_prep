"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import type { CaseSummary } from "@/lib/content/public";

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easier", 2: "Medium", 3: "Harder" };

const selectClass = "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2";

export function CaseBrowser({ cases }: { cases: CaseSummary[] }) {
  const [type, setType] = useState("");
  const [industry, setIndustry] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const types = useMemo(() => [...new Set(cases.map((c) => c.type))].sort(), [cases]);
  const industries = useMemo(() => [...new Set(cases.map((c) => c.industry))].sort(), [cases]);

  const shown = cases.filter(
    (c) =>
      (!type || c.type === type) &&
      (!industry || c.industry === industry) &&
      (!difficulty || String(c.difficulty) === difficulty),
  );
  const filtering = Boolean(type || industry || difficulty);

  return (
    <div>
      <form className="grid gap-4 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()} aria-label="Filter cases">
        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium">
            Type
          </label>
          <select id="filter-type" value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {CASE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-industry" className="block text-sm font-medium">
            Industry
          </label>
          <select id="filter-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-difficulty" className="block text-sm font-medium">
            Difficulty
          </label>
          <select id="filter-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
            <option value="">Any difficulty</option>
            {[1, 2, 3].map((d) => (
              <option key={d} value={String(d)}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        Showing {shown.length} of {cases.length} cases
        {filtering ? (
          <>
            {" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                setType("");
                setIndustry("");
                setDifficulty("");
              }}
            >
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {shown.map((c) => (
          <li key={c.slug} className="rounded-md border border-border p-4">
            <h2 className="text-lg font-semibold">
              <Link href={`/cases/${c.slug}`} className="underline">
                {c.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {CASE_TYPE_LABELS[c.type]} · {c.industry} · {DIFFICULTY_LABELS[c.difficulty]} · about {c.estMinutes} min
            </p>
            <p className="mt-2 flex flex-wrap gap-2 text-xs">
              {c.freeStarter ? <span className="rounded bg-accent px-2 py-0.5 text-accent-foreground">Free full interview</span> : null}
              {c.freePreview && !c.freeStarter ? <span className="rounded border border-border px-2 py-0.5">Free preview</span> : null}
              {c.isDraft ? <span className="rounded border border-border px-2 py-0.5">Draft, not yet reviewed</span> : null}
            </p>
          </li>
        ))}
      </ul>

      {shown.length === 0 ? <p className="mt-6">No cases match those filters.</p> : null}
    </div>
  );
}
