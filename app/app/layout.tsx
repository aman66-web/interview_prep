import Link from "next/link";
import type { ReactNode } from "react";
import { AccountBar } from "@/components/app/account-bar";
import { AppNav } from "@/components/app-nav";
import { Logout, Sparkle } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { isPaid, type Entitlement } from "@/lib/access";
import { getEntitlement } from "@/lib/auth/entitlement";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/ui/cn";
import { signOut } from "./actions";

const PLAN_NAMES: Record<string, string> = { monthly: "Monthly plan", pass90: "90-Day Pass", group: "Group plan" };

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Every page below also checks the user itself: layouts are not re-run on
  // every navigation, so this is not the only gate.
  await requireUser();

  // The plan badge is a nicety: if the plan cannot be read, show nothing rather than fail the page.
  let entitlement: Entitlement | undefined;
  try {
    entitlement = await getEntitlement(await createClient());
  } catch {
    entitlement = undefined;
  }
  const paid = entitlement !== undefined && isPaid(entitlement);

  return (
    <div>
      <AccountBar>
        <Container className="pt-5">
          <nav aria-label="Account" className="flex flex-wrap items-center justify-between gap-3">
            <AppNav />
            <div className="flex items-center gap-2">
              {entitlement !== undefined ? (
                paid ? (
                  <span className="hidden h-9 items-center gap-1.5 rounded-full bg-lime px-3.5 text-sm font-medium text-lime-ink sm:inline-flex">
                    <Sparkle size={14} />
                    {PLAN_NAMES[entitlement?.plan ?? ""] ?? "Paid plan"}
                  </span>
                ) : (
                  <span className="inline-flex h-9 items-center gap-1 rounded-full bg-surface pl-1 pr-1 text-sm sm:pl-3.5 text-muted ring-1 ring-inset ring-line">
                    <span className="hidden sm:inline">Free plan</span>
                    <Link
                      href="/pricing"
                      className="inline-flex h-7 items-center gap-1 rounded-full bg-lime px-3 text-[13px] font-medium text-lime-ink transition-[filter] hover:brightness-95"
                    >
                      Upgrade
                    </Link>
                  </span>
                )
              ) : null}
              <form action={signOut}>
                <button
                  type="submit"
                  className={cn(
                    "inline-flex size-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-muted ring-1 ring-inset ring-line transition-colors sm:w-auto sm:px-3.5",
                    "hover:bg-surface hover:text-ink",
                  )}
                >
                  <Logout size={15} />
                  <span className="sr-only sm:not-sr-only">Log out</span>
                </button>
              </form>
            </div>
          </nav>
        </Container>
      </AccountBar>
      {children}
    </div>
  );
}
