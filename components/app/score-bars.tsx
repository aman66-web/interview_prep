import { cn } from "@/lib/ui/cn";

// Horizontal bars for the five skill scores (out of 5). Each bar is an image with a
// spoken label ("Structure: 4 out of 5"), so screen readers get the same numbers.

export type ScoreBarItem = {
  key: string;
  label: string;
  value: number;
  /** The visible number, e.g. "4" or "3.5". */
  display: string;
  /** What a screen reader hears for the bar. */
  ariaLabel: string;
  /** Marks the weakest or strongest skill. */
  flag?: { text: string; tone: "focus" | "strong" };
};

export function ScoreBars({
  items,
  max = 5,
  onNight = false,
  className,
}: {
  items: ScoreBarItem[];
  max?: number;
  onNight?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn("flex min-w-0 items-center gap-2 text-sm font-medium", onNight ? "text-on-night" : "text-ink")}>
              <span className="truncate">{item.label}</span>
              {item.flag ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    item.flag.tone === "focus" ? "bg-peach text-ink" : "bg-lime text-lime-ink",
                  )}
                >
                  {item.flag.text}
                </span>
              ) : null}
            </span>
            <span className={cn("shrink-0 font-mono text-sm tabular-nums", onNight ? "text-white" : "text-ink")}>
              {item.display}
              <span className={onNight ? "text-on-night-muted" : "text-subtle"}>/{max}</span>
            </span>
          </div>
          <div
            role="img"
            aria-label={item.ariaLabel}
            className={cn("relative mt-2 h-2.5 w-full overflow-hidden rounded-full", onNight ? "bg-white/10" : "bg-surface-3")}
          >
            <div
              className={cn(
                "h-full rounded-full",
                onNight ? "bg-lime" : "bg-gradient-to-r from-brand to-brand-2",
              )}
              style={{ width: `${Math.max(0, Math.min(1, item.value / max)) * 100}%` }}
            />
            {/* Faint marks at 1, 2, 3 and 4 so the scale is easy to read. */}
            {Array.from({ length: max - 1 }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn("absolute inset-y-0 w-0.5", onNight ? "bg-night" : "bg-surface")}
                style={{ left: `calc(${((i + 1) / max) * 100}% - 1px)` }}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A round gauge for an overall score out of 5. Decorative: put the number in text nearby. */
export function ScoreRing({ value, max = 5, size = 120, onNight = false, className }: { value: number; max?: number; size?: number; onNight?: boolean; className?: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = Math.max(0, Math.min(1, value / max));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className={cn("-rotate-90", className)}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={onNight ? "stroke-white/10" : "stroke-surface-3"} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * share} ${c}`}
        className={onNight ? "stroke-lime" : "stroke-brand"}
      />
    </svg>
  );
}
