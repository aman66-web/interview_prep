import { cn } from "@/lib/ui/cn";
import { Calculator, ChartBars, Check, Clock, Notes, Sparkle } from "@/components/ui/icons";

// Illustrations of the real product, drawn in code. They use the free starter case
// (Harbourline Bakeries) so every number shown is a real number from a real case.
// They are decorative: callers wrap them in a <figure> with a text description,
// and the mocks themselves are hidden from screen readers.

const SCORES = [
  { label: "Structure", value: 4 },
  { label: "Analysis and maths", value: 4 },
  { label: "Business judgement", value: 3 },
  { label: "Communication", value: 4 },
  { label: "Recommendation", value: 3 },
];

export function MockStageBar({ active = 2, className }: { active?: number; className?: string }) {
  const stages = ["Clarify", "Structure", "Analysis", "Brainstorm", "Recommend"];
  return (
    <div aria-hidden="true" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {stages.map((s, i) => (
        <span
          key={s}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
            i < active && "bg-surface-2 text-ink ring-1 ring-inset ring-line",
            i === active && "bg-ink text-ink-contrast",
            i > active && "text-subtle ring-1 ring-inset ring-line",
          )}
        >
          {i < active ? <Check size={11} strokeWidth={2.6} /> : null}
          {s}
        </span>
      ))}
    </div>
  );
}

function Bubble({ who, children, className }: { who: "you" | "interviewer"; children: React.ReactNode; className?: string }) {
  const you = who === "you";
  return (
    <div className={cn("flex", you ? "justify-end" : "justify-start", className)}>
      <div className={cn("max-w-[85%]", you && "text-right")}>
        <p className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-subtle">{you ? "You" : "Interviewer"}</p>
        <p
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-snug",
            you ? "rounded-tr-md bg-ink text-ink-contrast" : "rounded-tl-md bg-surface-2 text-ink ring-1 ring-inset ring-line",
          )}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

/** The interview room: stage bar, a short exchange, the side tools. */
export function MockInterview({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("rounded-[1.75rem] bg-surface p-4 shadow-float ring-1 ring-inset ring-line sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-subtle">Profitability · Harbourline Bakeries</p>
          <p className="text-sm font-semibold text-ink">Why did profit fall?</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-inset ring-line">
          <Clock size={12} /> 12:40
        </span>
      </div>
      <MockStageBar className="mt-3" />
      <div className="mt-4 space-y-3">
        <Bubble who="interviewer">Profit per café fell from £200k to £80k, with the same customers and prices. How would you approach this?</Bubble>
        <Bubble who="you">I&rsquo;d split profit into revenue and costs. Revenue held at £2.0m, so which cost lines moved?</Bubble>
        <Bubble who="interviewer">Good. Here&rsquo;s the profit and loss per café. What stands out?</Bubble>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        {[
          { icon: <ChartBars size={14} />, label: "Exhibit" },
          { icon: <Notes size={14} />, label: "Notes" },
          { icon: <Calculator size={14} />, label: "Calculator" },
        ].map((t) => (
          <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
            {t.icon}
            {t.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1" aria-hidden="true">
          <span className="size-1.5 animate-pulse rounded-full bg-subtle" />
          <span className="size-1.5 animate-pulse rounded-full bg-subtle [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-subtle [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}

/** The scored debrief: five skills out of 5, and the next thing to practise. */
export function MockDebrief({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("rounded-[1.75rem] bg-surface p-5 shadow-float ring-1 ring-inset ring-line", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Your debrief</p>
        <span className="rounded-full bg-lavender px-2 py-0.5 text-[10.5px] font-medium text-ink">Example</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {(compact ? SCORES.slice(0, 3) : SCORES).map((s) => (
          <li key={s.label}>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-muted">{s.label}</span>
              <span className="font-semibold tabular-nums text-ink">{s.value}/5</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c5cf5]" style={{ width: `${s.value * 20}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {compact ? null : (
        <div className="mt-4 rounded-2xl bg-peach p-3">
          <p className="text-[11px] font-semibold text-ink">Fix next</p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink/80">Say each step of your maths out loud before the answer.</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink">
            <Sparkle size={12} /> Mental maths drills
          </p>
        </div>
      )}
    </div>
  );
}

/** A maths answer checked by code. */
export function MockMathsCheck({ className, solid = false }: { className?: string; solid?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("rounded-2xl p-3.5 shadow-float ring-1 ring-inset ring-line", solid ? "bg-surface" : "glass", className)}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-lime text-lime-ink">
          <Check size={16} strokeWidth={2.6} />
        </span>
        <div>
          <p className="text-[11px] font-medium text-subtle">Maths check</p>
          <p className="text-[13px] font-semibold text-ink">⅔ of the fall: ingredients</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">£80k of the £120k drop · checked by code</p>
    </div>
  );
}

/** The case's first exhibit as a small grouped bar chart (£ thousand per café). */
export function MockExhibit({ className }: { className?: string }) {
  const rows = [
    { label: "Ingredients", last: 560, now: 640 },
    { label: "Labour", last: 640, now: 680 },
    { label: "Rent", last: 400, now: 400 },
    { label: "Other", last: 200, now: 200 },
  ];
  const max = 700;
  return (
    <div aria-hidden="true" className={cn("rounded-[1.5rem] bg-surface p-4 ring-1 ring-inset ring-line", className)}>
      <p className="text-[12px] font-semibold text-ink">Costs per café (£k)</p>
      <div className="mt-3 flex h-28 items-end gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-24 w-full items-end justify-center gap-1">
              <div className="w-2.5 rounded-t bg-surface-3" style={{ height: `${(r.last / max) * 100}%` }} />
              <div className={cn("w-2.5 rounded-t", r.now > r.last ? "bg-brand" : "bg-line-strong")} style={{ height: `${(r.now / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-muted">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-surface-3 ring-1 ring-inset ring-line" /> Last year
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-brand" /> This year
        </span>
      </div>
    </div>
  );
}
