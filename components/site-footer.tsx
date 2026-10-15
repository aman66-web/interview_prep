import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/site.config";
import { AccountLink, OutsideApp } from "./site-nav";

const COLUMNS = [
  {
    title: "Practise",
    links: [
      { href: "/cases", label: "Case library" },
      { href: "/drills", label: "Drills" },
      { href: "/tools", label: "Free tools" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/guides", label: "Case guides" },
      { href: "/guides#firms", label: "Firm guides" },
      { href: "/glossary", label: "Glossary" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: `About ${siteConfig.brandName}` },
      { href: "/for-universities", label: "For universities and clubs" },
      { href: "/login", label: "Log in", account: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/refunds", label: "Refunds" },
      { href: "/legal/disclaimer", label: "Disclaimer" },
    ],
  },
];

const FOOTER_LINK = "text-[15px] text-white/85 transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="px-3 pb-3 pt-8 sm:px-4 sm:pt-10">
      <div className="bg-night-glow relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2rem] text-on-night">
        <div className="mx-auto max-w-[76rem] px-6 pt-14 sm:px-10 sm:pt-20">
          {/* The sign-up banner, left out on the signed-in pages (they already have an account). */}
          <OutsideApp>
            <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="text-3xl font-medium leading-tight tracking-tight text-white sm:text-[2.6rem]">
                  Your next case interview <span className="serif-accent text-lime">starts here.</span>
                </p>
                <p className="mt-4 text-on-night-muted">Your first full AI interview and scored debrief are free. No card needed.</p>
              </div>
              <ButtonLink href="/login" variant="inverse" size="lg" arrow>
                Start practising free
              </ButtonLink>
            </div>
          </OutsideApp>

          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div className="max-w-xs">
              <Logo onNight />
              <p className="mt-4 text-sm leading-relaxed text-on-night-muted">{siteConfig.tagline}</p>
              {siteConfig.supportEmail ? (
                <p className="mt-4 text-sm">
                  <a className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white" href={`mailto:${siteConfig.supportEmail}`}>
                    {siteConfig.supportEmail}
                  </a>
                </p>
              ) : null}
            </div>
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-on-night-muted">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"account" in link ? (
                        <AccountLink className={FOOTER_LINK} />
                      ) : (
                        <Link href={link.href} className={FOOTER_LINK}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 py-8 text-sm text-on-night-muted md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl space-y-2">
              <p>{siteConfig.disclaimer}</p>
              <p>
                {siteConfig.brandName} is run by {siteConfig.operator.legalName}, a company registered in {siteConfig.operator.registeredIn}{" "}
                (company number {siteConfig.operator.companyNumber}). Registered office: {siteConfig.operator.registeredOffice}.
              </p>
            </div>
            <p className="shrink-0">
              &copy; {new Date().getFullYear()} {siteConfig.operator.legalName}
            </p>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="wordmark pointer-events-none -mb-[0.2em] select-none text-center text-[13vw] font-semibold leading-none tracking-[-0.06em] min-[1400px]:text-[11.5rem]"
        >
          {siteConfig.brandName}
        </p>
      </div>
    </footer>
  );
}
