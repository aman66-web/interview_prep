"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

const ITEMS = [
  { href: "/app", label: "Dashboard", exact: true },
  { href: "/app/library", label: "Library", exact: false },
  { href: "/app/account", label: "Account", exact: false },
] as const;

/** The signed-in area's tabs (Dashboard, Library, Account), as a segmented pill control. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-inset ring-line">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
                active ? "bg-ink text-ink-contrast" : "text-muted hover:text-ink",
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
