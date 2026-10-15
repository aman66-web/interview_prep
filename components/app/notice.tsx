import type { ReactNode } from "react";
import { Alert, Check, Info } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

// A notice box in a status tone (docs/DESIGN.md "Notices"): a soft panel with a round
// icon. role="status" for news ("Your plan is active"), role="alert" for problems.

export type NoticeTone = "info" | "success" | "warning" | "danger";

const tones: Record<NoticeTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "bg-sky", icon: "bg-surface text-brand", Icon: Info },
  success: { box: "bg-success-soft", icon: "bg-success text-white dark:text-[#0b0b0d]", Icon: Check },
  warning: { box: "bg-warning-soft", icon: "bg-warning text-white dark:text-[#0b0b0d]", Icon: Alert },
  danger: { box: "bg-danger-soft", icon: "bg-danger text-white dark:text-[#0b0b0d]", Icon: Alert },
};

export function Notice({
  tone = "info",
  role = "status",
  title,
  children,
  className,
}: {
  tone?: NoticeTone;
  role?: "status" | "alert" | "note";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-2xl p-4 text-[15px] leading-relaxed text-ink", t.box, className)}>
      <span aria-hidden="true" className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", t.icon)}>
        <t.Icon size={15} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title ? "mt-0.5 text-ink/80" : "")}>{children}</div>
      </div>
    </div>
  );
}
