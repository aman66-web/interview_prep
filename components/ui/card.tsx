import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// The card used everywhere: large radius, generous padding, a hairline ring.
// Tones give the bento grids their colour; keep to one or two coloured cards per row.

export type CardTone = "surface" | "soft" | "lime" | "lavender" | "mint" | "peach" | "sky" | "butter" | "night" | "brand";

const tones: Record<CardTone, string> = {
  surface: "bg-surface text-ink ring-1 ring-inset ring-line",
  soft: "bg-surface-2 text-ink ring-1 ring-inset ring-line",
  lime: "bg-lime text-lime-ink",
  lavender: "bg-lavender text-ink",
  mint: "bg-mint text-ink",
  peach: "bg-peach text-ink",
  sky: "bg-sky text-ink",
  butter: "bg-butter text-ink",
  night: "bg-night text-on-night ring-1 ring-inset ring-white/5",
  brand: "bg-gradient-to-br from-[#4f46e5] to-[#7c5cf5] text-white",
};

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
  as?: ElementType;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
};

const paddings = { none: "", sm: "p-5", md: "p-6 sm:p-7", lg: "p-7 sm:p-10" };

export function Card({ children, tone = "surface", className, as: Tag = "div", padding = "md", interactive = false }: CardProps) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-[1.75rem]",
        tones[tone],
        paddings[padding],
        interactive && "transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** A round icon holder for the top of a feature card. */
export function IconBadge({ children, tone = "surface", className }: { children: ReactNode; tone?: "surface" | "ink" | "lime" | "glass"; className?: string }) {
  const t = {
    surface: "bg-surface text-ink ring-1 ring-inset ring-line",
    ink: "bg-ink text-ink-contrast",
    lime: "bg-lime text-lime-ink",
    glass: "bg-white/15 text-white ring-1 ring-inset ring-white/20",
  }[tone];
  return <span className={cn("grid size-11 place-items-center rounded-2xl", t, className)}>{children}</span>;
}
