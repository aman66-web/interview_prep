import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleHeader, MetaRow, Notice, tocFromBlocks } from "@/components/learn/article";
import { DesktopToc, MobileToc } from "@/components/learn/article-toc";
import { pageOpenGraph } from "@/components/learn/seo";
import { Eyebrow } from "@/components/ui/badge";
import { Clock, Refresh, Shield } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { Prose } from "@/components/ui/prose";
import type { Block } from "@/lib/content/blocks";
import { findPage, formatDate, isLegalSlug, LEGAL_SLUGS } from "@/lib/content/writing";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

// Terms, privacy, refunds and disclaimer. While a page's status is "draft" it carries a
// prominent notice that it is not in force. Square-bracket placeholders stay visible for
// the founder to fill in, except "[support email]" once NEXT_PUBLIC_SUPPORT_EMAIL is set.

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

function legalPage(slug: string) {
  return isLegalSlug(slug) ? findPage(slug) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPage(slug);
  if (!page) return {};
  const path = `/legal/${page.slug}`;
  return {
    title: { absolute: page.seo_title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: pageOpenGraph({ title: page.seo_title, description: page.description, path }),
  };
}

/** Words a reader sees: every text value in the blocks, not their keys, ids or links. */
function wordCount(blocks: Block[]): number {
  const skip = new Set(["type", "id", "tone", "href"]);
  const walk = (v: unknown): number => {
    if (typeof v === "string") return v.split(/\s+/).filter(Boolean).length;
    if (Array.isArray(v)) return v.reduce((n: number, x) => n + walk(x), 0);
    if (v && typeof v === "object") return Object.entries(v).reduce((n, [k, x]) => n + (skip.has(k) ? 0 : walk(x)), 0);
    return 0;
  };
  return walk(blocks);
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalPage(slug);
  if (!page) notFound();

  const tabs = LEGAL_SLUGS.map((s) => ({ slug: s, title: findPage(s)?.title ?? s }));
  const toc = tocFromBlocks(page.blocks);
  const minutes = Math.max(1, Math.round(wordCount(page.blocks) / 220));
  const isDraft = page.status === "draft";

  return (
    <>
      <ArticleHeader
        crumbs={[{ href: "/", label: "Home" }]}
        current={page.title}
        eyebrow={<Eyebrow icon={<Shield size={13} />}>Legal</Eyebrow>}
        title={page.title}
        meta={
          <MetaRow
            items={[
              { icon: <Refresh size={15} />, label: <time dateTime={page.updated}>Updated {formatDate(page.updated, "short")}</time> },
              {
                icon: <Shield size={15} />,
                label:
                  page.effective && !isDraft ? <time dateTime={page.effective}>In force from {formatDate(page.effective, "short")}</time> : "Not yet in force",
              },
              { icon: <Clock size={15} />, label: `${minutes} min read` },
            ]}
          />
        }
      >
        {page.intro ? <p>{page.intro}</p> : null}
      </ArticleHeader>

      <Container className="mt-6">
        <div className="mx-auto lg:max-w-[61.5rem] xl:max-w-[63rem]">
          <nav aria-label="Legal pages" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max gap-1 rounded-full bg-surface p-1.5 ring-1 ring-inset ring-line">
              {tabs.map((t) => {
                const active = t.slug === page.slug;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/legal/${t.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                        active ? "bg-ink text-ink-contrast" : "text-muted hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      {t.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </Container>

      {isDraft ? (
        <Container className="mt-6">
          <Notice tone="warning" title="Draft: being reviewed before launch. Not yet in force." className="mx-auto lg:max-w-[61.5rem] xl:max-w-[63rem]">
            Text in square brackets is still to be filled in or confirmed.
          </Notice>
        </Container>
      ) : null}

      <Container className="mt-10 sm:mt-14">
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,44rem)] lg:justify-center lg:gap-14 xl:gap-20">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <DesktopToc items={toc} />
            </div>
          </aside>
          <div className="min-w-0">
            <MobileToc items={toc} className="mb-10 lg:hidden" />
            <article aria-label={page.title}>
              <Prose blocks={page.blocks} />
            </article>
            <div className="mt-14 border-t border-line pt-6 text-sm leading-relaxed text-muted">
              <p>
                Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>.
                {siteConfig.supportEmail ? (
                  <>
                    {" "}
                    Questions about this page? Email{" "}
                    <a href={`mailto:${siteConfig.supportEmail}`} className="text-ink underline underline-offset-4">
                      {siteConfig.supportEmail}
                    </a>
                    .
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
        <div className="h-16 sm:h-24" />
      </Container>
    </>
  );
}
