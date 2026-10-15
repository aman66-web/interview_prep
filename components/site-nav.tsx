"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Cross, Menu } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

type NavItem = { readonly href: string; readonly label: string };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
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

/** The phone menu: a button that opens a panel under the header. Closes on navigation and Escape. */
export function MobileMenu({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
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
    <div className="lg:hidden">
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
      <div
        id="mobile-menu"
        hidden={!open}
        className="glass absolute inset-x-3 top-[4.75rem] rounded-[1.75rem] p-3 shadow-float ring-1 ring-inset ring-line sm:inset-x-4"
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
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Link href="/login" className={buttonClasses({ variant: "secondary", full: true })}>
            Log in
          </Link>
          <Link href="/login" className={buttonClasses({ variant: "primary", full: true })}>
            Start free
          </Link>
        </div>
      </div>
    </div>
  );
}
