"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Pause, Play } from "./icons";

/**
 * A slow, endless strip of items (CSS animation). The second copy is hidden from screen
 * readers. Hovering pauses it, and a Pause button below lets keyboard and touch users
 * stop it too (WCAG 2.2.2). Visitors who prefer reduced motion see it still, so the
 * button is hidden for them.
 */
export function Marquee({ items, className, label }: { items: ReactNode[]; className?: string; label: string }) {
  const [paused, setPaused] = useState(false);
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
    <div className={className}>
      <div
        role="region"
        aria-label={label}
        className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        <div className={cn("flex w-max animate-marquee group-hover:[animation-play-state:paused]", paused && "[animation-play-state:paused]")}>
          {row(false)}
          {row(true)}
        </div>
      </div>
      <div className="mt-4 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? "Play" : "Pause"}
          <span className="sr-only"> the moving list</span>
        </button>
      </div>
    </div>
  );
}
