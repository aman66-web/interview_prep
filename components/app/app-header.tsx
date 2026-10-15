import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/layout";
import { cn } from "@/lib/ui/cn";

// The top of a signed-in page: a compact version of PageHeader (aurora panel, eyebrow,
// h1, intro), with an optional panel on the right (`aside`) and content under the
// heading (`children`). On a phone the aside comes straight after the heading, so the
// main action is near the top; on wide screens it sits on the right.

export function AppHeader({
  eyebrow,
  title,
  intro,
  aside,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Container className={cn("pt-5", className)}>
      <div className="bg-aurora relative overflow-hidden rounded-[2rem] p-5 ring-1 ring-inset ring-line sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(55%_70%_at_20%_10%,black,transparent)]"
        />
        <div
          className={cn(
            "relative grid gap-6",
            aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-8" : null,
          )}
        >
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            {eyebrow ? <div className="mb-4">{typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow}</div> : null}
            <h1 className="text-[2rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-[2.75rem]">{title}</h1>
            {intro ? <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-[17px]">{intro}</div> : null}
          </div>
          {aside ? <div className="flex min-w-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1">{aside}</div> : null}
          {children ? <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-end">{children}</div> : null}
        </div>
      </div>
    </Container>
  );
}
