"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

// The contents list beside a long page. On wide screens it sits in a sticky column and
// marks the section you are reading; on phones it folds into one "On this page" row.
// The links are ordinary #anchors, so it works before (and without) JavaScript.

export type TocItem = { id: string; text: string };

/** Which heading is in view: the last one whose top has scrolled past the header. */
function useActiveHeading(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = items.map((i) => i.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 160) current = id;
        else break;
      }
      // At the very bottom, the last section may never reach the top: mark it anyway.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ids.at(-1) ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);
  return active;
}

export function DesktopToc({ items, label = "On this page", className }: { items: TocItem[]; label?: string; className?: string }) {
  const active = useActiveHeading(items);
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className={className}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
      <ol className="mt-4 space-y-px border-l border-line">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 pl-4 text-[14px] leading-snug transition-colors",
                  isActive ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileToc({ items, label = "On this page", className }: { items: TocItem[]; label?: string; className?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  if (items.length < 2) return null;
  return (
    <details ref={ref} className={cn("group rounded-[1.5rem] bg-surface ring-1 ring-inset ring-line", className)}>
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 text-[15px] font-medium text-ink">
        <span>
          {label} <span className="font-normal text-muted">· {items.length} sections</span>
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-surface-2 ring-1 ring-inset ring-line transition-transform duration-200 group-open:rotate-180">
          <ChevronDown size={16} />
        </span>
      </summary>
      <nav aria-label={label} className="border-t border-line px-3 pb-3 pt-2">
        <ol>
          {items.map((item, n) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => ref.current?.removeAttribute("open")}
                className="flex gap-3 rounded-xl px-2 py-2.5 text-[15px] leading-snug text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <span className="w-5 shrink-0 font-mono text-xs leading-6 text-subtle tabular-nums">{String(n + 1).padStart(2, "0")}</span>
                <span>{item.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
