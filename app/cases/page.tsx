import type { Metadata } from "next";
import Link from "next/link";
import { visibleCases } from "@/lib/content/cases";
import { toCaseSummary } from "@/lib/content/public";
import { CaseBrowser } from "./case-browser";

export const metadata: Metadata = {
  title: "Case interview library",
  description:
    "Original practice cases for consulting interviews: profitability, market entry, market sizing, pricing and growth. Read the prompt free, then practise with an AI interviewer.",
};

export default function CasesPage() {
  const cases = visibleCases().map(toCaseSummary);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Case interview library</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Original practice cases written for this site, with invented companies and numbers. Read any case prompt for
        free. Create a free account to run one full case with an AI interviewer and get a scored debrief.
      </p>

      {cases.length === 0 ? (
        <div className="mt-8 rounded-md border border-border p-6">
          <h2 className="text-lg font-semibold">Cases are being checked</h2>
          <p className="mt-2 text-muted">
            Every case is read by someone with consulting experience before it appears here. In the meantime, the
            drills are ready to use.
          </p>
          <Link href="/drills" className="mt-4 inline-block underline">
            Try the drills
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CaseBrowser cases={cases} />
        </div>
      )}
    </div>
  );
}
