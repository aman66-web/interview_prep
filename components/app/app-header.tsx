import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/badge";
import { Container } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import type { Photo as PhotoData } from "@/lib/images";
import { cn } from "@/lib/ui/cn";

// The top of a signed-in page: a compact version of PageHeader (aurora panel, eyebrow,
// h1, intro), with an optional panel on the right (`aside`) and content under the
// heading (`children`). On a phone the aside comes straight after the heading, so the
// main action is near the top; on wide screens it sits on the right. An optional `image`
// (the dashboard's welcome band) is a soft decorative strip across the top of the panel.

export function AppHeader({
  eyebrow,
  title,
  intro,
  aside,
  children,
  image,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  image?: PhotoData;
  className?: string;
}) {
  return (
    <Container className={cn("pt-5", className)}>
      <div className={cn("bg-aurora relative overflow-hidden rounded-[2rem] p-5 ring-1 ring-inset ring-line sm:p-8 lg:p-10", image && "pt-0 sm:pt-0 lg:pt-0")}>
        <div
          aria-hidden="true"
          className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(55%_70%_at_20%_10%,black,transparent)]"
        />
        {/* After the dot texture, so the dots never sit on the photo. */}
        {image ? (
          <Photo
            photo={image}
            decorative
            preload
            ring={false}
            backdrop={false}
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-mx-5 mb-2 h-24 [mask-image:linear-gradient(to_bottom,black_45%,transparent)] sm:-mx-8 sm:h-32 lg:-mx-10 lg:mb-0 lg:h-36"
          />
        ) : null}
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
