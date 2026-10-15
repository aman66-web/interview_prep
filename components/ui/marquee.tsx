import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * A slow, endless strip of items (CSS only). The second copy is hidden from screen
 * readers; hovering pauses it, and visitors who prefer reduced motion see it still.
 */
export function Marquee({ items, className, label }: { items: ReactNode[]; className?: string; label: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 pr-3">
      {items.map((item, i) => (
        <li key={i} className="shrink-0">
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
