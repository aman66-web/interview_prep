import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Every page below also checks the user itself: layouts are not re-run on
  // every navigation, so this is not the only gate.
  await requireUser();

  return (
    <div>
      <nav aria-label="Account" className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-2 text-sm">
          <Link href="/app" className="underline">
            Dashboard
          </Link>
          <Link href="/app/account" className="underline">
            Account
          </Link>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="underline">
              Log out
            </button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}
