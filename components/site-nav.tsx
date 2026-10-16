"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Cross, Grid, Menu } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

// The client parts of the site header and footer. They read only the current path
// (no login lookup), so every page stays static: inside the signed-in area (/app and
// /admin, which check the login themselves) the header offers "Dashboard" instead of
// "Log in" and "Start free", and the footer drops its "Start practising free" banner.

type NavItem = { readonly href: string; readonly label: string };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** True on the signed-in pages: /app, /admin and everything under them. */
export function isAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ["/app", "/admin"].some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

/** Desktop links with a soft pill behind the current section. */
export function NavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium transition-colors",
                active ? "bg-surface-2 text-ink ring-1 ring-inset ring-line" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The header's buttons: "Log in" and "Start free", or "Dashboard" on the signed-in pages. */
export function HeaderActions() {
  const inApp = isAppPath(usePathname());
  if (inApp) {
    return (
      <Link href="/app" className={cn(buttonClasses({ size: "sm" }), "gap-2")}>
        <Grid size={15} />
        Dashboard
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/login"
        className="hidden h-10 items-center rounded-full px-4 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2 sm:inline-flex"
      >
        Log in
      </Link>
      <ButtonLink href="/login" size="sm" arrow>
        Start free
      </ButtonLink>
    </>
  );
}

/** Shows its children everywhere except the signed-in pages (the footer's sign-up banner). */
export function OutsideApp({ children }: { children: ReactNode }) {
  return isAppPath(usePathname()) ? null : <>{children}</>;
}

/**
 * The layout of the footer's "Start practising free" banner. On the home page it also shows
 * the closing photo (IMAGE_BRIEF H7), beside the text on wide screens and above it on phones;
 * elsewhere it is the text and the button on one row.
 */
export function FooterSignUp({ text, action, homePhoto }: { text: ReactNode; action: ReactNode; homePhoto?: ReactNode }) {
  const onHome = usePathname() === "/";
  if (homePhoto && onHome) {
    return (
      <div className="grid gap-8 border-b border-white/10 pb-12 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-12">
        <div className="md:order-2">{homePhoto}</div>
        <div className="flex flex-col items-start gap-8">
          {text}
          {action}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end">
      {text}
      {action}
    </div>
  );
}

/** The footer's "Log in" link, which reads "Dashboard" on the signed-in pages. */
export function AccountLink({ className }: { className?: string }) {
  const inApp = isAppPath(usePathname());
  return (
    <Link href={inApp ? "/app" : "/login"} className={className}>
      {inApp ? "Dashboard" : "Log in"}
    </Link>
  );
}

/** The phone menu: a button that opens a panel under the header. Closes on navigation and Escape. */
export function MobileMenu({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const inApp = isAppPath(pathname);
  const [open, setOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu after a navigation (the header persists across pages).
  if (open && openedOn !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-[56rem]:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => {
          setOpenedOn(pathname);
          setOpen((o) => !o);
        }}
        className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink ring-1 ring-inset ring-line"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        {open ? <Cross size={18} /> : <Menu size={18} />}
      </button>
      {/* A solid panel: it lies over page text, so it must not let that text show through. */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-3 top-[4.75rem] rounded-[1.75rem] bg-surface p-3 shadow-float ring-1 ring-inset ring-line sm:inset-x-4"
      >
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex h-12 items-center rounded-2xl px-4 text-base font-medium text-ink hover:bg-surface-2 aria-[current=page]:bg-surface-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-3 border-t border-line pt-3">
          {inApp ? (
            <Link href="/app" className={buttonClasses({ variant: "primary", full: true })}>
              <Grid size={16} />
              Dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" className={buttonClasses({ variant: "secondary", full: true })}>
                Log in
              </Link>
              <Link href="/login" className={buttonClasses({ variant: "primary", full: true })}>
                Start free
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
