import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Practise free, or go unlimited from $${siteConfig.prices.monthly} a month or $${siteConfig.prices.pass90} for a 90-day pass.`,
};

// Placeholder pricing page. Checkout buttons arrive in P4 (payments).
export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 text-lg text-muted">Start free, no card needed. Upgrade only if it helps you.</p>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <li className="rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-semibold">$0</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>{siteConfig.limits.free.drillsPerDay} drills a day</li>
            <li>One full AI mock case with a scored debrief</li>
            <li>Read every case prompt</li>
          </ul>
          <Link href="/login" className="mt-4 inline-block underline">
            Start free
          </Link>
        </li>
        <li className="rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">Monthly</h2>
          <p className="mt-1 text-2xl font-semibold">
            ${siteConfig.prices.monthly}
            <span className="text-base font-normal text-muted"> a month</span>
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Every case and unlimited drills</li>
            <li>AI interviews (fair-use limits)</li>
            <li>Progress tracking and model answers</li>
            <li>Cancel anytime</li>
          </ul>
          <p className="mt-4 text-sm text-muted">Available soon.</p>
        </li>
        <li className="rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">90-Day Pass</h2>
          <p className="mt-1 text-2xl font-semibold">
            ${siteConfig.prices.pass90}
            <span className="text-base font-normal text-muted"> one time</span>
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Everything in Monthly for 90 days</li>
            <li>Never renews automatically</li>
          </ul>
          <p className="mt-4 text-sm text-muted">Available soon.</p>
        </li>
      </ul>

      <p className="mt-8 text-sm text-muted">{siteConfig.disclaimer}</p>
    </div>
  );
}
