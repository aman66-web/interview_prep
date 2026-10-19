import Link from "next/link";
import type { Block } from "@/lib/content/blocks";
import { cn } from "@/lib/ui/cn";
import { ArrowUpRight, Check, Sparkle } from "./icons";

// Renders the typed content blocks (lib/content/blocks.ts) used by guides, firm
// guides and the legal pages, in the site's style. Content is plain text, so
// nothing here uses dangerouslySetInnerHTML.

const calloutTones = {
  tip: { box: "bg-mint", label: "Tip" },
  warning: { box: "bg-peach", label: "Watch out" },
  key: { box: "bg-lavender", label: "Key point" },
} as const;

export function Prose({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("space-y-5 text-[16.5px] leading-[1.75] text-ink/90", className)}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return (
        <h2 id={block.id} className="scroll-mt-28 pt-6 text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.75rem]">
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="pt-2 text-lg font-semibold tracking-tight text-ink">{block.text}</h3>;
    case "ul":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="space-y-2.5">
          {block.items.map((item, n) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink ring-1 ring-inset ring-line">
                {n + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const tone = calloutTones[block.tone];
      return (
        <aside className={cn("rounded-3xl p-5 sm:p-6", tone.box)}>
          <p className="text-sm font-semibold text-ink">{block.title ?? tone.label}</p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">{block.text}</p>
        </aside>
      );
    }
    case "steps":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {block.items.map((step, n) => (
            <li key={step.title} className="rounded-3xl bg-surface p-5 ring-1 ring-inset ring-line">
              <span className="font-mono text-xs font-medium text-muted">Step {String(n + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-semibold leading-snug text-ink">{step.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      );
    case "framework":
      return (
        <figure className="rounded-[1.75rem] bg-night p-5 text-on-night sm:p-7">
          <figcaption className="flex items-center gap-2 text-sm font-semibold">
            <Sparkle size={16} className="text-lime" />
            {block.title}
          </figcaption>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {block.branches.map((branch) => (
              <div key={branch.name} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
                <p className="text-[15px] font-semibold text-white">{branch.name}</p>
                <ul className="mt-2 space-y-1.5 text-[14.5px] leading-relaxed text-on-night-muted">
                  {branch.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">–</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </figure>
      );
    case "table":
      return (
        <figure className="overflow-hidden rounded-3xl bg-surface ring-1 ring-inset ring-line">
          <figcaption className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">{block.caption}</figcaption>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[14.5px]">
              <thead>
                <tr>
                  {block.columns.map((c) => (
                    <th key={c} scope="col" className="border-b border-line bg-surface-2 px-5 py-2.5 font-medium text-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-b border-line last:border-0">
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="px-5 py-2.5 font-medium text-ink">
                          {cell}
                        </th>
                      ) : (
                        <td key={c} className="px-5 py-2.5 tabular-nums text-ink/85">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
    case "example":
      return (
        <figure className="rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line sm:p-7">
          <span className="inline-flex rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-lime-ink">Worked example</span>
          <figcaption className="mt-3 text-lg font-semibold tracking-tight text-ink">{block.title}</figcaption>
          <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{block.question}</p>
          <ol className="mt-4 space-y-2.5 border-l-2 border-line pl-4">
            {block.answer.map((line) => (
              <li key={line} className="text-[15.5px] leading-relaxed text-ink/90">
                {line}
              </li>
            ))}
          </ol>
          {block.checks.length > 0 ? (
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-success">
              <Check size={14} strokeWidth={2.4} />
              Every number in this example is recalculated by our tests.
            </p>
          ) : null}
        </figure>
      );
    case "links":
      return (
        <nav aria-label={block.title ?? "Related pages"} className="rounded-[1.75rem] bg-surface-2 p-5 ring-1 ring-inset ring-line sm:p-6">
          <p className="text-sm font-semibold text-ink">{block.title ?? "Keep going"}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {block.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-[15px] font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:ring-line-strong"
                >
                  {item.label}
                  <ArrowUpRight size={16} className="shrink-0 text-muted transition-transform group-hover:rotate-45" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      );
  }
}

/** A contents list built from a page's h2 blocks. */
export function TableOfContents({ blocks, className }: { blocks: Block[]; className?: string }) {
  const headings = blocks.flatMap((b) => (b.type === "h2" ? [b] : []));
  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className={cn("rounded-3xl bg-surface p-5 ring-1 ring-inset ring-line", className)}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">On this page</p>
      <ol className="mt-3 space-y-1.5 text-[14.5px]">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="block rounded-lg py-1 text-muted transition-colors hover:text-ink">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
