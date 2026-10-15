import Link from "next/link";
import { Tag, type TagTone } from "@/components/ui/badge";
import { ArrowUpRight, Clock } from "@/components/ui/icons";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import type { CaseSummary } from "@/lib/content/public";
import { cn } from "@/lib/ui/cn";

// One case in a grid. Safe in client components (no zod, no case data beyond the summary).

export const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easier", 2: "Medium", 3: "Harder" };

export const CASE_TYPE_TONES: Record<string, TagTone> = {
  profitability: "lavender",
  market_entry: "sky",
  market_sizing: "butter",
  m_and_a: "peach",
  pricing: "mint",
  growth: "lime",
  operations: "neutral",
  other: "neutral",
};

/** Three small bars, filled up to the difficulty. */
export function DifficultyMeter({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted", className)}>
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("w-1 rounded-full", n <= level ? "bg-ink" : "bg-line-strong")} style={{ height: `${4 + n * 3}px` }} />
        ))}
      </span>
      {DIFFICULTY_LABELS[level]}
    </span>
  );
}

export function CaseCard({ c, headingLevel = "h3" }: { c: CaseSummary; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line transition-[box-shadow,transform] duration-300 focus-within:shadow-float hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={CASE_TYPE_TONES[c.type] ?? "neutral"}>{CASE_TYPE_LABELS[c.type]}</Tag>
        {c.freeStarter ? <Tag tone="ink">Free full interview</Tag> : null}
        {c.freePreview && !c.freeStarter ? <Tag tone="brand">Free preview</Tag> : null}
        {c.isDraft ? <Tag tone="warning">Draft, not yet reviewed</Tag> : null}
      </div>
      <Heading className="mt-5 text-lg font-semibold leading-snug tracking-tight text-ink">
        {/* The link's ::after covers the whole card, so the keyboard focus outline goes on it (around the card)
            instead of round the title text. Same 2px brand outline as the global :focus-visible rule. */}
        <Link
          href={`/cases/${c.slug}`}
          className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-brand"
        >
          {c.title}
        </Link>
      </Heading>
      <p className="mt-1.5 text-sm text-muted">{c.industry}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <div className="flex items-center gap-4">
          <DifficultyMeter level={c.difficulty} />
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock size={13} /> about {c.estMinutes} min
          </span>
        </div>
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-all duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-ink-contrast"
        >
          <ArrowUpRight size={16} />
        </span>
      </div>
    </article>
  );
}
