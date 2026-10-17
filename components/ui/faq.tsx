import { cn } from "@/lib/ui/cn";
import { Plus } from "./icons";

export type FaqItem = { q: string; a: string };

/**
 * An accessible FAQ list built on <details>, so it works without JavaScript.
 * Pair it with faqJsonLd() only when the questions are shown on the page.
 */
export function Faq({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-[1.75rem] bg-surface ring-1 ring-inset ring-line", className)}>
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-6 px-6 py-5 text-left text-base font-medium text-ink transition-colors hover:bg-surface-2 sm:px-8">
            <span>{item.q}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line transition-transform duration-200 group-open:rotate-45">
              <Plus size={16} />
            </span>
          </summary>
          <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted sm:px-8">
            <p>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data. Only use it for questions that are visible on the same page. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Renders JSON-LD safely (escapes "<" so the JSON can never close the script tag). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
