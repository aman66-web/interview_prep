import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory } from "@/lib/drills";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Case interview drills",
  description:
    "Practise the skills case interviews test: mental maths, market sizing, structuring problems and reading charts. Free to try, with instant feedback.",
};

export default function DrillsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Case interview drills</h1>
      <p className="mt-3 text-lg text-muted">
        Short practice questions for the skills case interviews test. Try a few with no account; a free account gives
        you {siteConfig.limits.free.drillsPerDay} drills a day.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {DRILL_CATEGORIES.map((category) => {
          const info = CATEGORY_INFO[category];
          const count = drillsByCategory(category).length;
          return (
            <li key={category} className="rounded-md border border-border p-4">
              <h2 className="text-lg font-semibold">
                <Link href={`/drills/${category}`} className="underline">
                  {info.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted">{count} drills</p>
              <p className="mt-2">{info.blurb}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
