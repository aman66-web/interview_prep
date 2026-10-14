import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

// Placeholder. The dashboard (skill scores, recent sessions, next case) is
// built in P6, once cases and the AI interviewer exist.
export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">You&rsquo;re signed in</h1>
      <p className="mt-2 text-muted">
        Signed in as <strong>{user.email}</strong>. Practice cases and drills
        will appear here as they are built.
      </p>
    </div>
  );
}
