import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { HeaderActions, MobileMenu, NavLinks } from "./site-nav";

// The floating pill header. It never looks up the login, so pages stay static and fast;
// signed-in visitors who press "Log in" go straight to /app. On the signed-in pages
// (/app and /admin) its buttons read the path and offer "Dashboard" instead.
// It is nearly opaque (.glass-bar), so page text never shows through it.

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
      <div className="glass-bar mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between gap-3 rounded-full px-3 pl-4 shadow-soft ring-1 ring-inset ring-line sm:pl-5">
        <Link href="/" className="rounded-full" aria-label="CaseSpar home">
          <Logo />
        </Link>
        {/* The links fit from about 900px wide (checked at 896px); narrower screens get the menu button. */}
        <nav aria-label="Main" className="hidden min-[56rem]:block">
          <NavLinks items={MAIN_NAV} />
        </nav>
        <div className="flex items-center gap-1.5">
          <HeaderActions />
          <MobileMenu items={MAIN_NAV} />
        </div>
      </div>
    </header>
  );
}
