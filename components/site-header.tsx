import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { MobileMenu, NavLinks } from "./site-nav";

// The floating pill header. It is the same for everyone (no login lookup), so pages
// stay static and fast; signed-in visitors who press "Log in" go straight to /app.

export const MAIN_NAV = [
  { href: "/cases", label: "Cases" },
  { href: "/drills", label: "Drills" },
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Free tools" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="glass mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between gap-3 rounded-full px-3 pl-4 shadow-soft ring-1 ring-inset ring-line sm:pl-5">
        <Link href="/" className="rounded-full" aria-label="CaseSpar home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={MAIN_NAV} />
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-full px-4 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2 sm:inline-flex"
          >
            Log in
          </Link>
          <ButtonLink href="/login" size="sm" arrow className="hidden sm:inline-flex">
            Start free
          </ButtonLink>
          <MobileMenu items={MAIN_NAV} />
        </div>
      </div>
    </header>
  );
}
