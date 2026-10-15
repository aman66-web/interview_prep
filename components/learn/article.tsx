import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, ArrowUpRight, ChevronRight, Info } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import type { Block } from "@/lib/content/blocks";
import { cn } from "@/lib/ui/cn";
import type { TocItem } from "./article-toc";

// Shared pieces of the reading pages (guides, firm guides, about, FAQ and legal).

export type Crumb = { href: string; label: string };

/** "Home / Guides / Profitability". The last item is the current page and is not a link. */
export function Breadcrumbs({ items, current }: { items: Crumb[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <Link href={item.href} className="rounded-md transition-colors hover:text-ink">
              {item.label}
            </Link>
            <ChevronRight size={14} className="text-subtle" />
          </li>
        ))}
        <li aria-current="page" className="max-w-[16rem] truncate text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/**
 * The top of a reading page: the aurora panel, breadcrumbs, eyebrow, h1 and a meta row,
 * with an optional floating card beside it (the guide's short answer, a firm's sources).
 */
export function ArticleHeader({
  crumbs,
  current,
  eyebrow,
  title,
  meta,
  aside,
  children,
}: {
  crumbs: Crumb[];
  current: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Container className="pt-6 sm:pt-8">
      <div className="bg-aurora relative overflow-hidden rounded-[2rem] ring-1 ring-inset ring-line">
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(55%_70%_at_80%_30%,black,transparent)]" />
        <div className={cn("relative grid gap-10 px-6 py-10 sm:px-12 sm:py-14", aside ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-14" : undefined)}>
          <div className="min-w-0">
            <Breadcrumbs items={crumbs} current={current} />
            {eyebrow ? <div className="mt-7 flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            <h1 className="mt-5 text-[2.15rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-[3.25rem]">{title}</h1>
            {children ? <div className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{children}</div> : null}
            {meta ? <div className="mt-7">{meta}</div> : null}
          </div>
          {aside ? <div className="min-w-0">{aside}</div> : null}
        </div>
      </div>
    </Container>
  );
}

/** A row of small facts about the page: reading time, dates, counts. */
export function MetaRow({ items }: { items: { icon?: ReactNode; label: ReactNode }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li key={i} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface/80 px-3.5 text-[13.5px] font-medium text-ink ring-1 ring-inset ring-line">
          {item.icon ? <span className="text-muted">{item.icon}</span> : null}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** A status notice: warning for drafts, info for the affiliation disclaimer. */
export function Notice({ tone = "info", title, children, className }: { tone?: "info" | "warning"; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3.5 rounded-[1.5rem] p-5 sm:p-6",
        tone === "warning" ? "bg-warning-soft text-ink ring-1 ring-inset ring-warning/25" : "bg-surface-2 text-ink ring-1 ring-inset ring-line",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone === "warning" ? "bg-warning/15 text-warning" : "bg-brand-soft text-brand-ink")}
      >
        {tone === "warning" ? <Alert size={18} /> : <Info size={18} />}
      </span>
      <div className="min-w-0 pt-1 text-[15px] leading-relaxed">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-1 text-muted" : "text-ink/85")}>{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * The banner on a page whose status is still "draft" (about, FAQ and the legal pages).
 * It shows on the live site too, so nobody mistakes the founder's square-bracket notes
 * for final text. Legal pages also say they are not yet in force.
 */
export function DraftNotice({ legal = false, className }: { legal?: boolean; className?: string }) {
  return (
    <Notice tone="warning" title={legal ? "Draft: being reviewed before launch. Not yet in force." : "Draft: being reviewed before launch."} className={className}>
      Text in square brackets is still to be filled in or confirmed.
    </Notice>
  );
}

/** Splits content blocks at each h2, for pages laid out section by section. */
export function splitSections(blocks: Block[]): { lead: Block[]; sections: { id: string; title: string; blocks: Block[] }[] } {
  const lead: Block[] = [];
  const sections: { id: string; title: string; blocks: Block[] }[] = [];
  for (const block of blocks) {
    if (block.type === "h2") sections.push({ id: block.id, title: block.text, blocks: [] });
    else if (sections.length > 0) sections[sections.length - 1].blocks.push(block);
    else lead.push(block);
  }
  return { lead, sections };
}

export function tocFromBlocks(blocks: Block[]): TocItem[] {
  return blocks.flatMap((b) => (b.type === "h2" ? [{ id: b.id, text: b.text }] : []));
}

/** "How to apply" -> "how-to-apply", for headings that come without an id. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The closing call to action on the reading pages: one lime card, one main button. */
export function PractiseCta({ title, text, primary, secondary }: { title: ReactNode; text: ReactNode; primary: Crumb; secondary?: Crumb }) {
  return (
    <section aria-labelledby="practise-cta" className="relative overflow-hidden rounded-[2rem] bg-lime px-6 py-12 text-lime-ink sm:px-12 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#4f46e5]/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <h2 id="practise-cta" className="text-[2rem] font-medium leading-[1.08] tracking-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-lime-ink/80 sm:text-lg">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Fixed colours: the lime card looks the same in both themes, so its buttons must too. */}
          <Link
            href={primary.href}
            className="group/btn inline-flex h-13 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[#0d0d10] pl-6 pr-2 text-base font-medium text-white shadow-soft transition-opacity hover:opacity-90"
          >
            <span>{primary.label}</span>
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-lime text-lime-ink transition-transform duration-200 group-hover/btn:rotate-45">
              <ArrowUpRight size={18} strokeWidth={2} />
            </span>
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex h-13 items-center justify-center whitespace-nowrap rounded-full bg-white/55 px-6 text-base font-medium text-lime-ink ring-1 ring-inset ring-lime-ink/15 transition-colors hover:bg-white/80"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}


/** Sets the last `words` words of a heading in the italic serif: "About <i>Mock Partner</i>". */
export function AccentTitle({ title, words = 1 }: { title: string; words?: number }) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= words) return <>{title}</>;
  return (
    <>
      {parts.slice(0, -words).join(" ")} <span className="serif-accent">{parts.slice(-words).join(" ")}</span>
    </>
  );
}
