import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findVisibleCase, visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toPublicCase } from "@/lib/content/public";
import { siteConfig } from "@/site.config";

export const dynamicParams = false;

export function generateStaticParams() {
  return visibleCases().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = findVisibleCase(slug);
  if (!found) return {};
  return {
    title: found.title,
    description: `${CASE_TYPE_LABELS[found.type]} case interview practice: ${found.prompt.slice(0, 140).trim()}…`,
  };
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easier", 2: "Medium", 3: "Harder" };

// The stages after the prompt are locked (kit section 5). Listed so people know what they get.
const LOCKED_STAGES = [
  "Ask clarifying questions and get answers from the case facts",
  "Lay out your structure and defend it",
  "Analyse exhibits, do the maths and spot the insight",
  "Brainstorm ideas",
  "Give a recommendation and get a scored debrief",
];

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findVisibleCase(slug);
  if (!found) notFound();
  const c = toPublicCase(found);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-sm">
        <Link href="/cases" className="underline">
          All cases
        </Link>
      </p>

      {c.isDraft ? (
        <p role="note" className="mt-4 rounded-md border border-border p-3 text-sm">
          <strong>Draft case.</strong> It has not yet been reviewed by someone with consulting experience, so it is only
          visible on preview sites.
        </p>
      ) : null}

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-muted">
        {CASE_TYPE_LABELS[c.type]} · {c.industry} · {DIFFICULTY_LABELS[c.difficulty]} · about {c.estMinutes} minutes
      </p>

      <section aria-labelledby="prompt" className="mt-8">
        <h2 id="prompt" className="text-xl font-semibold">
          The case
        </h2>
        <p className="mt-3 text-lg leading-8">{c.prompt}</p>
        <p className="mt-3 text-sm text-muted">
          Think about how you would structure this before reading on. In a real interview you would say it out loud.
        </p>
      </section>

      {c.previewExhibit ? (
        <section aria-labelledby="exhibit" className="mt-8">
          <h2 id="exhibit" className="text-xl font-semibold">
            Free preview: {c.previewExhibit.title}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  {c.previewExhibit.columns.map((column) => (
                    <th key={column} scope="col" className="border-b border-border px-3 py-2 text-sm font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.previewExhibit.rows.map((row) => (
                  <tr key={String(row[0])}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="border-b border-border px-3 py-2 font-medium">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="border-b border-border px-3 py-2">
                          {typeof cell === "number" ? cell.toLocaleString("en-US") : cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-muted">What does this tell you? What would you check next?</p>
        </section>
      ) : null}

      <section aria-labelledby="locked" className="mt-10 rounded-md border border-border p-5">
        <h2 id="locked" className="text-xl font-semibold">
          {c.freeStarter ? "Run this case with an AI interviewer, free" : "Practise the full case"}
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          {LOCKED_STAGES.map((stage) => (
            <li key={stage}>{stage}</li>
          ))}
        </ol>
        <p className="mt-4 text-muted">
          {c.freeStarter
            ? "Your first full AI interview and scored debrief are free. No card needed."
            : `The full interview is part of the paid plans (from $${siteConfig.prices.monthly} a month).`}
        </p>
        <Link
          href={`/login?next=/cases/${c.slug}`}
          className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground"
        >
          Create a free account
        </Link>
      </section>
    </div>
  );
}
