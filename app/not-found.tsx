import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";
import { ArrowUpRight, Book, Bolt, Calculator, Layers } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { pageImage } from "@/lib/images";

// The 404 page, for unknown addresses and for anything a page hides with notFound()
// (a draft case or firm guide on the live site, a mistyped case link). It renders inside
// the root layout, so the header and footer are there too. Next.js adds a noindex tag.

export const metadata: Metadata = {
  title: "Page not found",
  description: "We couldn't find that page. Try the case library, the guides, the drills or the free tools.",
};

const PLACES = [
  { href: "/cases", icon: <Layers size={20} />, title: "Case library", text: "Every case prompt, free to read." },
  { href: "/guides", icon: <Book size={20} />, title: "Guides", text: "How each case type works, with worked examples." },
  { href: "/drills", icon: <Bolt size={20} />, title: "Drills", text: "Mental maths, sizing, frameworks and charts." },
  { href: "/tools", icon: <Calculator size={20} />, title: "Free tools", text: "Calculators and a mental maths trainer." },
];

export default function NotFound() {
  return (
    <>
      <PageHeader
        image={pageImage("not-found")}
        eyebrow="404"
        title={
          <>
            We couldn&rsquo;t find <span className="serif-accent">that page</span>
          </>
        }
        intro="The link may be old or mistyped, or the page may have moved. These are good places to carry on."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/" size="lg" arrow>
            Go to the home page
          </ButtonLink>
          <ButtonLink href="/cases" size="lg" variant="secondary">
            Browse the cases
          </ButtonLink>
        </div>
      </PageHeader>

      <Container className="mt-6 pb-16 sm:pb-24">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLACES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="flex items-start justify-between">
                  <IconBadge>{p.icon}</IconBadge>
                  <ArrowUpRight size={18} className="text-subtle transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
                </div>
                <h2 className="mt-6 text-lg font-medium tracking-tight text-ink">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
