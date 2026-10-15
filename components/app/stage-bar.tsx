import { Check } from "@/components/ui/icons";
import { PROGRESS_STAGES, STAGE_LABELS, type Stage } from "@/lib/ai/stages";
import { cn } from "@/lib/ui/cn";

// The interview's stage indicator: Clarifying → Structure → Analysis → Brainstorm →
// Recommendation. Done stages get a tick, the current one is a dark pill, and exactly
// one step carries aria-current="step". On a phone the other stages shrink to numbered
// dots (their names stay available to screen readers), so the bar fits on one line.

export function StageBar({ stage, className }: { stage: Stage; className?: string }) {
  const at = stage === "intro" ? "clarifying" : stage;
  const index = stage === "debrief" ? PROGRESS_STAGES.length : PROGRESS_STAGES.indexOf(at);
  return (
    <nav aria-label="Interview progress" className={className}>
      <ol className="flex flex-wrap items-center gap-y-2">
        {PROGRESS_STAGES.map((s, i) => {
          const current = i === index;
          const done = i < index;
          return (
            <li key={s} aria-current={current ? "step" : undefined} className="flex items-center">
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors",
                  current && "bg-ink pl-1 pr-3.5 text-ink-contrast shadow-soft",
                  done && "bg-surface-2 text-ink ring-1 ring-inset ring-line sm:pl-1 sm:pr-3",
                  !current && !done && "text-subtle ring-1 ring-inset ring-line sm:pl-1 sm:pr-3",
                  !current && "w-8 justify-center sm:w-auto sm:justify-start",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px]",
                    current && "bg-lime text-lime-ink",
                    done && "bg-ink text-ink-contrast",
                    !current && !done && "bg-surface-2",
                  )}
                >
                  {done ? <Check size={12} strokeWidth={2.8} /> : i + 1}
                </span>
                <span className={current ? "" : "sr-only sm:not-sr-only"}>
                  {STAGE_LABELS[s]}
                  {done ? <span className="sr-only"> (done)</span> : null}
                </span>
              </span>
              {i < PROGRESS_STAGES.length - 1 ? (
                <span aria-hidden="true" className={cn("mx-1 h-px w-3 sm:mx-1.5 sm:w-4", i < index ? "bg-ink/40" : "bg-line-strong")} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
