import type { ElementType, ReactNode } from "react";
import type { Photo as PhotoData } from "@/lib/images";
import { cn } from "@/lib/ui/cn";
import { Eyebrow } from "./badge";
import { Photo } from "./photo";

// Page structure: a centred container, vertical section rhythm, and the standard
// section heading (eyebrow pill, big tight heading, short intro).

export function Container({ children, className, size = "default" }: { children: ReactNode; className?: string; size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "narrow" ? "max-w-3xl" : size === "wide" ? "max-w-[88rem]" : "max-w-[76rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({ children, className, id, labelledBy }: { children: ReactNode; className?: string; id?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-16 sm:py-24", className)}>
      {children}
    </section>
  );
}

type HeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  as?: ElementType;
  id?: string;
  className?: string;
  size?: "md" | "lg";
};

/** h2 by default. Use a <span className="serif-accent"> or .text-gradient inside the title for one accent phrase. */
export function SectionHeading({ eyebrow, title, intro, align = "center", as: Tag = "h2", id, className, size = "lg" }: HeadingProps) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow ? <div className={cn("mb-4", align === "center" && "flex justify-center")}>{typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow}</div> : null}
      <Tag
        id={id}
        className={cn(
          "font-medium tracking-tight text-ink",
          size === "lg" ? "text-[2rem] leading-[1.08] sm:text-5xl" : "text-2xl leading-tight sm:text-3xl",
        )}
      >
        {title}
      </Tag>
      {intro ? <p className={cn("mt-4 text-base leading-relaxed text-muted sm:text-lg", align === "center" && "mx-auto max-w-2xl")}>{intro}</p> : null}
    </div>
  );
}

/**
 * The standard top of an inner page: eyebrow, h1 and intro, on a soft panel. With an
 * `image` (a page banner from lib/images.ts) the photo sits beside the text on wide
 * screens and under it on phones; it is the page's first picture, so it is preloaded.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
  align = "left",
  image,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  image?: PhotoData;
}) {
  // A banner photo needs the text on the left beside it.
  const centred = align === "center" && !image;
  return (
    <Container className="pt-6 sm:pt-8">
      <div
        className={cn(
          "bg-aurora relative overflow-hidden rounded-[2rem] px-6 py-12 ring-1 ring-inset ring-line sm:px-12 sm:py-16",
          image && "pb-6 sm:pb-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:py-8 lg:pl-12 lg:pr-8",
        )}
      >
        <div className={cn(centred ? "mx-auto max-w-3xl text-center" : "max-w-3xl", image && "lg:self-center lg:py-8")}>
          {eyebrow ? <div className={cn("mb-5", centred && "flex justify-center")}>{typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow}</div> : null}
          <h1 className="text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">{title}</h1>
          {intro ? <p className={cn("mt-5 text-base leading-relaxed text-muted sm:text-lg", centred ? "mx-auto max-w-2xl" : "max-w-2xl")}>{intro}</p> : null}
          {children ? <div className={cn("mt-8", centred && "flex justify-center")}>{children}</div> : null}
        </div>
        {image ? (
          <Photo
            photo={image}
            preload
            sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, (min-width: 640px) calc(100vw - 8rem), calc(100vw - 4rem)"
            className="mt-10 aspect-[16/9] rounded-[1.5rem] lg:mt-0 lg:aspect-auto lg:min-h-[20rem]"
          />
        ) : null}
      </div>
    </Container>
  );
}
