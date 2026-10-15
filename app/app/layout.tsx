import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { Container } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Every page below also checks the user itself: layouts are not re-run on
  // every navigation, so this is not the only gate.
  await requireUser();

  return (
    <div>
      <Container className="pt-5">
        <nav aria-label="Account" className="flex flex-wrap items-center justify-between gap-3">
          <AppNav />
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:bg-surface hover:text-ink"
            >
              Log out
            </button>
          </form>
        </nav>
      </Container>
      {children}
    </div>
  );
}
