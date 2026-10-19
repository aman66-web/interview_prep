import { ExternalLink } from "@/components/ui/icons";
import { formatDate } from "@/lib/content/writing";
import type { Firm } from "@/lib/content/writing-schema";

// Sourced firm facts (rule 2.2): each line carries a small number that links to its
// source in the list at the bottom of the page. Used by the firm guides and the
// firm-style practice pages.

type Section = Firm["sections"][number];
type Source = Firm["sources"][number];

function displayUrl(url: string): string {
  const u = new URL(url);
  return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
}

/** One section's facts as a card list. `sources` sets the numbering (its order is the page's source list). */
export function SourcedFactList({ items, sources }: { items: Section["items"]; sources: Source[] }) {
  const number = new Map(sources.map((s, i) => [s.id, i + 1]));
  const byId = new Map(sources.map((s) => [s.id, s]));
  return (
    <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[1.5rem] bg-surface ring-1 ring-inset ring-line">
      {items.map((item) => {
        const n = number.get(item.source);
        const source = byId.get(item.source);
        return (
          <li key={item.text} className="flex gap-3.5 px-5 py-4 sm:px-6">
            <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand" />
            <p className="text-[16px] leading-[1.7] text-ink/90">
              {item.text}
              {n && source ? (
                <sup className="ml-1 align-super">
                  <a
                    href={`#source-${source.id}`}
                    aria-label={`Source ${n}: ${source.title}`}
                    className="inline-grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-brand-soft px-1 text-[10.5px] font-semibold leading-none text-brand-ink no-underline transition-colors hover:bg-brand hover:text-white"
                  >
                    {n}
                  </a>
                </sup>
              ) : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** The numbered source list that the facts link to. */
export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ol className="mt-5 space-y-3">
      {sources.map((s, i) => (
        <li
          key={s.id}
          id={`source-${s.id}`}
          className="flex scroll-mt-28 gap-4 rounded-[1.5rem] bg-surface p-5 ring-1 ring-inset ring-line transition-shadow target:ring-2 target:ring-brand sm:p-6"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink tabular-nums">{i + 1}</span>
          <div className="min-w-0">
            <a href={s.url} rel="noopener noreferrer" className="group inline-flex items-start gap-1.5 font-medium leading-snug text-ink hover:underline hover:underline-offset-4">
              {s.title}
              <ExternalLink size={14} className="mt-1 shrink-0 text-subtle group-hover:text-ink" />
              <span className="sr-only">(opens the source)</span>
            </a>
            <p className="mt-1 text-sm text-muted">
              {s.publisher} · checked <time dateTime={s.checked}>{formatDate(s.checked)}</time>
            </p>
            <p className="mt-1.5 break-all font-mono text-xs text-subtle">{displayUrl(s.url)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
