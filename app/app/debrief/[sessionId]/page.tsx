import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasAccess } from "@/lib/access";
import { storedDebriefSchema } from "@/lib/ai/schema";
import { getEntitlement } from "@/lib/auth/entitlement";
import { requireUser } from "@/lib/auth/session";
import { visibleCases } from "@/lib/content/cases";
import { CATEGORY_INFO } from "@/lib/drills/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your debrief", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SKILLS = [
  ["structure", "Structure"],
  ["analysis_maths", "Analysis and maths"],
  ["business_judgement", "Business judgement"],
  ["communication", "Communication"],
  ["synthesis", "Recommendation"],
] as const;

export default async function DebriefPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireUser();
  const { sessionId } = await params;
  if (!UUID.test(sessionId)) notFound();

  // Read as the signed-in user: Row Level Security means only their own sessions come back.
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("case_sessions")
    .select("id, case_id, completed_at, scores")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  const c = visibleCases().find((x) => x.id === session.case_id);
  if (!c) notFound();

  if (!session.completed_at) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">This interview isn&rsquo;t finished yet</h1>
        <Link href={`/app/interview/${session.id}`} className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground">
          Continue the interview
        </Link>
      </div>
    );
  }

  const parsed = storedDebriefSchema.safeParse(session.scores);
  if (!parsed.success) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-4 text-muted">We couldn&rsquo;t show this debrief. Please contact support and mention this interview.</p>
        <Link href="/app" className="mt-4 inline-block underline">
          Back to your dashboard
        </Link>
      </div>
    );
  }
  const d = parsed.data;
  const paid = hasAccess(await getEntitlement(supabase), "model_answers");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <p className="text-sm text-muted">Debrief</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-4">{d.summary}</p>

      <section aria-labelledby="scores" className="mt-10">
        <h2 id="scores" className="text-xl font-semibold">
          Your scores
        </h2>
        <ul className="mt-4 space-y-4">
          {SKILLS.map(([key, label]) => {
            const score = d.scores[key];
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{label}</span>
                  <span className="tabular-nums">{score} out of 5</span>
                </div>
                <div
                  role="img"
                  aria-label={`${label}: ${score} out of 5`}
                  className="mt-1 h-3 w-full overflow-hidden rounded-full border border-border"
                >
                  <div className="h-full bg-accent" style={{ width: `${(score / 5) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Scores run from 1 (needs work) to 5 (strong). The maths part is checked by code against the case numbers, not by the AI&rsquo;s opinion.
        </p>
      </section>

      <section aria-labelledby="strengths" className="mt-10">
        <h2 id="strengths" className="text-xl font-semibold">
          What went well
        </h2>
        {d.strengths.length === 0 ? (
          <p className="mt-3 text-muted">Nothing stood out this time. Try the interview again and aim to say your reasoning out loud.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {d.strengths.map((s) => (
              <li key={s.title} className="rounded-md border border-border p-4">
                <h3 className="font-medium">{s.title}</h3>
                {s.quote ? <blockquote className="mt-2 border-l-2 border-border pl-3 text-muted">&ldquo;{s.quote}&rdquo;</blockquote> : null}
                <p className="mt-2">{s.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fixes" className="mt-10">
        <h2 id="fixes" className="text-xl font-semibold">
          What to fix next
        </h2>
        {d.fixes.length === 0 ? (
          <p className="mt-3 text-muted">No big fixes this time. Try a harder case.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {d.fixes.map((f) => (
              <li key={f.title} className="rounded-md border border-border p-4">
                <h3 className="font-medium">{f.title}</h3>
                {f.quote ? <blockquote className="mt-2 border-l-2 border-border pl-3 text-muted">&ldquo;{f.quote}&rdquo;</blockquote> : null}
                <p className="mt-2">{f.detail}</p>
                <p className="mt-3">
                  <Link href={`/drills/${f.drill_category}`} className="underline">
                    Practise: {CATEGORY_INFO[f.drill_category].title}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="maths" className="mt-10">
        <h2 id="maths" className="text-xl font-semibold">
          The maths
        </h2>
        {d.maths.items.length === 0 ? (
          <p className="mt-3 text-muted">
            You didn&rsquo;t give a number for any of the {d.maths.total} calculation{d.maths.total === 1 ? "" : "s"} in this case. In a real interview, always state the number you worked out.
          </p>
        ) : (
          <>
            <p className="mt-3">
              You got {d.maths.correct} of {d.maths.attempted} answered calculation{d.maths.attempted === 1 ? "" : "s"} right (the case had {d.maths.total}).
            </p>
            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="border-b border-border px-3 py-2 font-medium">Question</th>
                    <th scope="col" className="border-b border-border px-3 py-2 font-medium">You said</th>
                    <th scope="col" className="border-b border-border px-3 py-2 font-medium">Answer</th>
                    <th scope="col" className="border-b border-border px-3 py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {d.maths.items.map((m) => (
                    <tr key={m.math_id}>
                      <th scope="row" className="border-b border-border px-3 py-2 font-medium">{m.question}</th>
                      <td className="border-b border-border px-3 py-2 tabular-nums">{m.given.toLocaleString("en-US")}</td>
                      <td className="border-b border-border px-3 py-2 tabular-nums">{m.expected.toLocaleString("en-US")}</td>
                      <td className="border-b border-border px-3 py-2">{m.correct ? "Correct" : "Not quite"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">How the numbers work</summary>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {d.maths.items.map((m) => (
                  <li key={m.math_id}>{m.working}</li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>

      <section aria-labelledby="model" className="mt-10">
        <h2 id="model" className="text-xl font-semibold">
          A strong answer looks like this
        </h2>
        {paid ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {c.model_answer_outline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-muted">
            The model answer for each case is part of the paid plans.{" "}
            <Link href="/pricing" className="underline">
              See plans
            </Link>
          </p>
        )}
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/app" className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground">
          Back to your dashboard
        </Link>
        <Link href="/cases" className="rounded-md border border-border px-5 py-2.5">
          Browse cases
        </Link>
      </div>
    </div>
  );
}
