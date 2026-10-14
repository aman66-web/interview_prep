import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory, isDrillCategory, toPublicDrill } from "@/lib/drills";
import { siteConfig } from "@/site.config";
import { DrillRunner } from "./drill-runner";

export const dynamicParams = false;

export function generateStaticParams() {
  return DRILL_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  if (!isDrillCategory(category)) return {};
  const info = CATEGORY_INFO[category];
  return {
    title: `${info.title} drills for case interviews`,
    description: `${info.blurb} Free practice with instant feedback.`,
  };
}

export default async function DrillCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isDrillCategory(category)) notFound();

  const info = CATEGORY_INFO[category];
  // Only the public view is sent to the browser: answers are checked on the server.
  const drills = drillsByCategory(category).map(toPublicDrill);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-sm">
        <Link href="/drills" className="underline">
          All drills
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{info.title}</h1>
      <p className="mt-2 text-muted">{info.blurb}</p>

      <div className="mt-8">
        <DrillRunner
          category={category}
          drills={drills}
          dailyLimit={siteConfig.limits.free.drillsPerDay}
          anonymousLimit={siteConfig.limits.anonymous.drillsPerSession}
        />
      </div>
    </div>
  );
}
