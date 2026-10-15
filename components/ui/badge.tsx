import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Small labels.
//   Eyebrow  the rounded label above a section heading ("How it works")
//   Kicker   a quieter mono label with a dot ("• ABOUT")
//   Tag      a compact chip on cards (case type, difficulty, "Example")

type EyebrowTone = "default" | "lime" | "brand" | "night";

const eyebrowTones: Record<EyebrowTone, string> = {
  default: "bg-surface text-muted ring-line",
  lime: "bg-lime text-lime-ink ring-transparent",
  brand: "bg-brand-soft text-brand-ink ring-transparent",
  night: "bg-white/10 text-on-night ring-white/15",
};

export function Eyebrow({ children, tone = "default", icon, className }: { children: ReactNode; tone?: EyebrowTone; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-[0_1px_0_rgb(0_0_0/0.02)] ring-1 ring-inset",
        eyebrowTones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Kicker({ children, className, onNight = false }: { children: ReactNode; className?: string; onNight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em]",
        onNight ? "text-on-night-muted" : "text-muted",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", onNight ? "bg-lime" : "bg-ink")} />
      {children}
    </span>
  );
}

export type TagTone = "neutral" | "lime" | "lavender" | "mint" | "peach" | "sky" | "butter" | "ink" | "brand" | "success" | "warning" | "danger";

const tagTones: Record<TagTone, string> = {
  neutral: "bg-surface-2 text-muted ring-1 ring-inset ring-line",
  lime: "bg-lime text-lime-ink",
  lavender: "bg-lavender text-ink",
  mint: "bg-mint text-ink",
  peach: "bg-peach text-ink",
  sky: "bg-sky text-ink",
  butter: "bg-butter text-ink",
  ink: "bg-ink text-ink-contrast",
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Tag({ children, tone = "neutral", className }: { children: ReactNode; tone?: TagTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tagTones[tone], className)}>
      {children}
    </span>
  );
}
