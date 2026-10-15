import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Eyebrow } from "./badge";

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

/** The standard top of an inner page: eyebrow, h1 and intro, on a soft panel. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
  align = "left",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Container className="pt-6 sm:pt-8">
      <div className="bg-aurora relative overflow-hidden rounded-[2rem] px-6 py-12 ring-1 ring-inset ring-line sm:px-12 sm:py-16">
        <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl")}>
          {eyebrow ? <div className={cn("mb-5", align === "center" && "flex justify-center")}>{typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow}</div> : null}
          <h1 className="text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">{title}</h1>
          {intro ? <p className={cn("mt-5 text-base leading-relaxed text-muted sm:text-lg", align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")}>{intro}</p> : null}
          {children ? <div className={cn("mt-8", align === "center" && "flex justify-center")}>{children}</div> : null}
        </div>
      </div>
    </Container>
  );
}
