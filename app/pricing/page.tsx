import type { Metadata } from "next";
import Link from "next/link";
import { PURCHASE_NOTICES } from "@/lib/stripe/plans";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Practise free, or go unlimited from $${siteConfig.prices.monthly} a month or $${siteConfig.prices.pass90} for a 90-day pass.`,
};

function BuyButton({ plan, children }: { plan: "monthly" | "pass90"; children: React.ReactNode }) {
  // A plain form post: it works without JavaScript. Signed-out visitors are sent to sign in first.
  return (
    <form method="post" action="/api/stripe/checkout" className="mt-4">
      <input type="hidden" name="plan" value={plan} />
      <button type="submit" className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground">
        {children}
      </button>
    </form>
  );
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const message = notice ? PURCHASE_NOTICES[notice] : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 text-lg text-muted">Start free, no card needed. Upgrade only if it helps you.</p>

      {message ? (
        <p role="status" className="mt-6 rounded-md border border-border p-4">
          {message}
        </p>
      ) : null}

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <li className="flex flex-col rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-semibold">$0</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>{siteConfig.limits.free.drillsPerDay} drills a day</li>
            <li>One full AI mock case with a scored debrief</li>
            <li>Read every case prompt</li>
          </ul>
          <Link href="/login" className="mt-auto inline-block pt-4 underline">
            Start free
          </Link>
        </li>
        <li className="flex flex-col rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">Monthly</h2>
          <p className="mt-1 text-2xl font-semibold">
            ${siteConfig.prices.monthly}
            <span className="text-base font-normal text-muted"> a month</span>
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Every case and unlimited drills</li>
            <li>
              Up to {siteConfig.limits.paid.aiCasesPerDay} AI interviews a day ({siteConfig.limits.paid.aiCasesPerMonth} a month)
            </li>
            <li>Progress tracking and model answers</li>
            <li>Renews each month. Cancel anytime</li>
          </ul>
          <div className="mt-auto">
            <BuyButton plan="monthly">Choose Monthly</BuyButton>
          </div>
        </li>
        <li className="flex flex-col rounded-md border border-border p-5">
          <h2 className="text-xl font-semibold">90-Day Pass</h2>
          <p className="mt-1 text-2xl font-semibold">
            ${siteConfig.prices.pass90}
            <span className="text-base font-normal text-muted"> one time</span>
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Everything in Monthly for 90 days</li>
            <li>Never renews automatically</li>
            <li>Buy again to add another 90 days</li>
          </ul>
          <div className="mt-auto">
            <BuyButton plan="pass90">Get the 90-Day Pass</BuyButton>
          </div>
        </li>
      </ul>

      <section aria-labelledby="small-print" className="mt-10 space-y-2 text-sm text-muted">
        <h2 id="small-print" className="text-base font-semibold text-foreground">
          Good to know
        </h2>
        <p>Prices are in US dollars. Payments are taken by Stripe, so we never see or store your card details.</p>
        <p>
          Not happy? Ask for a refund within {siteConfig.refundWindowDays} days if you have used {siteConfig.refundMaxAiSessions} or fewer AI interviews
          {siteConfig.supportEmail ? (
            <>
              : email <a className="underline" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
            </>
          ) : (
            ". Use the support address on this site."
          )}
        </p>
        <p>{siteConfig.disclaimer}</p>
      </section>
    </div>
  );
}
