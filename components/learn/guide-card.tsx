import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Clock } from "@/components/ui/icons";
import { splitTitle } from "@/lib/content/writing";
import type { Guide } from "@/lib/content/writing-schema";
import { cn } from "@/lib/ui/cn";

// One guide in the /guides bento grid. The whole card is the link (the heading's link
// stretches over it), and every number on it is counted from the content.

export type GuideTone = "lavender" | "sky" | "butter" | "peach" | "mint" | "surface" | "night";

const toneClasses: Record<GuideTone, { card: string; muted: string; chip: string; bubble: string }> = {
  lavender: { card: "bg-lavender text-ink", muted: "text-ink/70", chip: "bg-surface text-ink", bubble: "bg-ink text-ink-contrast" },
  sky: { card: "bg-sky text-ink", muted: "text-ink/70", chip: "bg-surface text-ink", bubble: "bg-ink text-ink-contrast" },
  butter: { card: "bg-butter text-ink", muted: "text-ink/70", chip: "bg-surface text-ink", bubble: "bg-ink text-ink-contrast" },
  peach: { card: "bg-peach text-ink", muted: "text-ink/70", chip: "bg-surface text-ink", bubble: "bg-ink text-ink-contrast" },
  mint: { card: "bg-mint text-ink", muted: "text-ink/70", chip: "bg-surface text-ink", bubble: "bg-ink text-ink-contrast" },
  surface: { card: "bg-surface text-ink ring-1 ring-inset ring-line", muted: "text-muted", chip: "bg-surface-2 text-ink ring-1 ring-inset ring-line", bubble: "bg-ink text-ink-contrast" },
  night: { card: "bg-night-glow text-on-night", muted: "text-on-night-muted", chip: "bg-white/10 text-white ring-1 ring-inset ring-white/15", bubble: "bg-lime text-lime-ink" },
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function GuideCard({
  guide,
  label,
  tone,
  footnote,
  size = "md",
  visual,
  icon,
}: {
  guide: Guide;
  label: string;
  tone: GuideTone;
  footnote?: string;
  size?: "md" | "lg";
  visual?: ReactNode;
  /** An IconBadge shown above the label, for the skill guides. */
  icon?: ReactNode;
}) {
  const t = toneClasses[tone];
  const { main, rest } = splitTitle(guide.title);
  const onNight = tone === "night";
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 focus-within:shadow-float hover:-translate-y-0.5 hover:shadow-float sm:p-7",
        t.card,
      )}
    >
      <div className={cn("flex h-full flex-col", size === "lg" && "lg:grid lg:grid-cols-[1fr_0.95fr] lg:gap-8")}>
        <div className="flex flex-1 flex-col">
          {icon ? <div className="mb-6">{icon}</div> : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", t.chip)}>{label}</span>
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium", t.muted)}>
              <Clock size={13} /> {guide.reading_minutes} min read
            </span>
          </div>
          <h3 className={cn("mt-6 font-medium leading-tight tracking-tight", size === "lg" ? "text-[1.75rem] sm:text-[2rem]" : "text-[1.35rem]", onNight && "text-white")}>
            <Link href={`/guides/${guide.slug}`} className="after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:outline-none">
              {main}
            </Link>
          </h3>
          {rest ? <p className={cn("mt-1.5 font-medium", size === "lg" ? "text-lg" : "text-[15px]", onNight ? "text-white/85" : "text-ink/80")}>{capitalise(rest)}</p> : null}
          <p className={cn("mt-4 text-[14.5px] leading-relaxed", t.muted, size === "lg" ? "line-clamp-4" : "line-clamp-3")}>{guide.summary}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-7">
            <span className={cn("text-sm font-medium", onNight ? "text-white" : "text-ink")}>{footnote ?? "Read the guide"}</span>
            <span aria-hidden="true" className={cn("grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45", t.bubble)}>
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
        {visual ? <div className="mt-7 lg:mt-0">{visual}</div> : null}
      </div>
    </article>
  );
}

/** A small picture of a guide's first framework, for the large card. Decorative: the guide has the real text. */
export function FrameworkPreview({ title, root, branches }: { title: string; root: string; branches: { name: string; items: string[] }[] }) {
  // "Price: list price, discounts" -> "Price", so each branch shows its parts in a few words.
  const hint = (items: string[]) => items.map((item) => item.split(":")[0].trim()).join(" · ");
  return (
    <div aria-hidden="true" className="flex h-full flex-col rounded-[1.4rem] bg-surface p-5 shadow-soft ring-1 ring-inset ring-line">
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">{title}</p>
      <div className="mt-4 flex justify-center">
        <span className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-ink-contrast">{root}</span>
      </div>
      <div className="mx-auto h-4 w-px bg-line-strong" />
      <div className="grid flex-1 grid-cols-2 gap-2.5 border-t border-line-strong pt-4">
        {branches.map((b, i) => (
          <div key={b.name} className={cn("rounded-2xl px-3.5 py-3", i === 0 ? "bg-lime text-lime-ink" : "bg-surface-2 text-ink ring-1 ring-inset ring-line")}>
            <p className="text-[13px] font-semibold leading-snug">{b.name}</p>
            <p className={cn("mt-1 line-clamp-2 text-[11.5px] leading-snug", i === 0 ? "text-lime-ink/75" : "text-muted")}>{hint(b.items)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
