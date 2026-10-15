import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccentTitle, DraftNotice, slugify } from "@/components/learn/article";
import { pageOpenGraph } from "@/components/learn/seo";
import { Faq, faqJsonLd, JsonLd } from "@/components/ui/faq";
import { ArrowUpRight, Mail } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { findPage, formatDate, withoutPlaceholders } from "@/lib/content/writing";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

const SLUG = "faq";

export function generateMetadata(): Metadata {
  const page = findPage(SLUG);
  if (!page) return {};
  return {
    title: { absolute: page.seo_title },
    description: page.description,
    alternates: { canonical: "/faq" },
    openGraph: pageOpenGraph({ title: page.seo_title, description: page.description, path: "/faq" }),
    // A draft still holds the founder's square-bracket notes: keep it out of search
    // results (and the sitemap) until it is approved.
    ...(page.status === "draft" ? { robots: { index: false, follow: true } } : {}),
  };
}

function ContactCard() {
  return (
    <div className="rounded-[1.75rem] bg-night-glow p-6 text-on-night">
      <span className="grid size-10 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20">
        <Mail size={18} />
      </span>
      <p className="mt-4 text-lg font-medium text-white">Still have a question?</p>
      {siteConfig.supportEmail ? (
        <p className="mt-1.5 text-sm leading-relaxed text-on-night-muted">
          Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-on-night-muted">These pages go into more detail.</p>
      )}
    </div>
  );
}

function MoreLinks({ links, className }: { links: { label: string; href: string }[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label="More detail" className={className}>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted transition-colors hover:bg-surface hover:text-ink">
              {l.label}
              <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:rotate-45" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function FaqPage() {
  const page = findPage(SLUG);
  if (!page) notFound();
  const groups = page.faq.map((g) => ({ ...g, id: slugify(g.heading) }));
  const links = page.blocks.flatMap((b) => (b.type === "links" ? b.items : []));
  // Search engines get only finished answers: one still holding a square-bracket note
  // (or an unfilled "[support email]") stays on the page but out of the structured data.
  const finishedItems = withoutPlaceholders(groups.flatMap((g) => g.items));

  return (
    <>
      <PageHeader eyebrow="FAQ" title={<AccentTitle title={page.title} />} intro={page.intro} />

      {/* Shown on the live site too while the page is a draft (like the legal pages). */}
      {page.status === "draft" ? (
        <Container className="mt-6">
          <DraftNotice />
        </Container>
      ) : null}

      <Container className="mt-8 sm:mt-14">
        <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
          {/* Wide screens: a sticky column with the topics, contact and related pages. */}
          <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <nav aria-label="Topics" className="rounded-[1.75rem] bg-surface p-5 ring-1 ring-inset ring-line">
              <p className="px-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Topics</p>
              <ul className="mt-3 space-y-1">
                {groups.map((g) => (
                  <li key={g.id}>
                    <a href={`#${g.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2">
                      {g.heading}
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted tabular-nums ring-1 ring-inset ring-line">{g.items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4">
              <ContactCard />
            </div>
            <MoreLinks links={links} className="mt-4" />
          </aside>

          <div className="min-w-0">
            {/* Phones: the topics as a row of chips, then the questions straight away. */}
            <nav aria-label="Topics" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
              <ul className="flex w-max gap-2">
                {groups.map((g) => (
                  <li key={g.id}>
                    <a href={`#${g.id}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-ink ring-1 ring-inset ring-line">
                      {g.heading}
                      <span className="text-xs text-muted tabular-nums">{g.items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-10 space-y-14 lg:mt-0">
              {groups.map((g, i) => (
                <section key={g.id} aria-labelledby={g.id} className={cn(i === 0 && "lg:-mt-1")}>
                  <h2 id={g.id} className="scroll-mt-28 text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">
                    {g.heading}
                  </h2>
                  <Faq items={g.items} className="mt-5" />
                </section>
              ))}
            </div>

            <div className="mt-14 space-y-4 lg:hidden">
              <ContactCard />
              <MoreLinks links={links} />
            </div>

            <p className="mt-10 text-sm text-subtle">
              Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
            </p>
          </div>
        </div>
        <div className="h-16 sm:h-24" />
      </Container>

      {finishedItems.length > 0 ? <JsonLd data={faqJsonLd(finishedItems)} /> : null}
    </>
  );
}
