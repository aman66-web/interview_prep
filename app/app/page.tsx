import type { Metadata } from "next";
import Link from "next/link";
import { storedDebriefSchema } from "@/lib/ai/schema";
import { requireUser } from "@/lib/auth/session";
import { visibleCases } from "@/lib/content/cases";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

type SessionSummary = { id: string; case_id: string; started_at: string; completed_at: string | null; scores: unknown };

// A simple dashboard for now: your interviews and where to go next. The full
// progress view (skill scores over time, next case suggestions) is built in P6.
export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_sessions")
    .select("id, case_id, started_at, completed_at, scores")
    .order("started_at", { ascending: false })
    .limit(10);
  const sessions = (data ?? []) as SessionSummary[];
  const cases = visibleCases();
  const starter = cases.find((c) => c.free_starter);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your dashboard</h1>
      <p className="mt-2 text-muted">
        Signed in as <strong>{user.email}</strong>.
      </p>

      <section aria-labelledby="interviews" className="mt-10">
        <h2 id="interviews" className="text-xl font-semibold">
          Your interviews
        </h2>
        {sessions.length === 0 ? (
          <div className="mt-3">
            <p className="text-muted">You haven&rsquo;t done an AI interview yet. Your first one is free.</p>
            {starter ? (
              <Link href={`/app/start/${starter.slug}`} className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground">
                Start the free starter case
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border">
            {sessions.map((s) => {
              const c = cases.find((x) => x.id === s.case_id);
              const debrief = s.completed_at ? storedDebriefSchema.safeParse(s.scores) : null;
              const average = debrief?.success
                ? Object.values(debrief.data.scores).reduce((a, b) => a + b, 0) / Object.values(debrief.data.scores).length
                : null;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{c?.title ?? "A case that is no longer available"}</p>
                    <p className="text-sm text-muted">
                      {s.completed_at ? "Finished" : "In progress"} ·{" "}
                      {new Date(s.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {average !== null ? ` · average ${average.toFixed(1)} out of 5` : ""}
                    </p>
                  </div>
                  {c ? (
                    <Link href={s.completed_at ? `/app/debrief/${s.id}` : `/app/interview/${s.id}`} className="underline">
                      {s.completed_at ? "See the debrief" : "Continue"}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="next" className="mt-10">
        <h2 id="next" className="text-xl font-semibold">
          Keep practising
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <Link href="/drills" className="underline">
              Drills: mental maths, market sizing, frameworks and charts
            </Link>
          </li>
          <li>
            <Link href="/cases" className="underline">
              Browse the case library
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
