import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Notice, type NoticeTone } from "@/components/app/notice";
import { PaywallSeen } from "@/components/app/paywall-seen";
import { Kicker, Tag } from "@/components/ui/badge";
import { Button, ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Faq, faqJsonLd, JsonLd, type FaqItem } from "@/components/ui/faq";
import { Check, Lock, Shield, Sparkle } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { ownValue } from "@/lib/app/own-key";
import { PLANS, type PlanId } from "@/lib/plans";
import { CANCEL_WAIVER } from "@/lib/stripe/checkout";
import { pageOpenGraph } from "@/components/learn/seo";
import { PURCHASE_NOTICES } from "@/lib/stripe/plans";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

const PRICING_DESCRIPTION = `Practise free, or go unlimited from $${siteConfig.prices.monthly} a month or $${siteConfig.prices.pass90} for a 90-day pass.`;

export const metadata: Metadata = {
  title: "Pricing",
  description: PRICING_DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: pageOpenGraph({ title: `${siteConfig.brandName} pricing`, description: PRICING_DESCRIPTION, path: "/pricing" }),
};

const { limits, prices } = siteConfig;

const NOTICES: Record<string, string> = { ...PURCHASE_NOTICES, consent: CANCEL_WAIVER.notice };

const NOTICE_TONES: Record<string, NoticeTone> = {
  unavailable: "warning",
  invalid: "warning",
  consent: "warning",
  error: "danger",
};

function BuyButton({
  plan,
  variant,
  onNight = false,
  children,
}: {
  plan: "monthly" | "pass90";
  variant: ButtonVariant;
  onNight?: boolean;
  children: ReactNode;
}) {
  // A plain form post: it works without JavaScript. Signed-out visitors are sent to sign in first.
  // The tick box is required here and checked again by /api/stripe/checkout.
  const id = `cancel-waiver-${plan}`;
  return (
    <form method="post" action="/api/stripe/checkout">
      <input type="hidden" name="plan" value={plan} />
      <label htmlFor={id} className={cn("mb-4 flex cursor-pointer items-start gap-3 text-[13px] leading-snug", onNight ? "text-on-night-muted" : "text-muted")}>
        <input
          id={id}
          type="checkbox"
          name={CANCEL_WAIVER.field}
          value={CANCEL_WAIVER.version}
          required
          className={cn("mt-px size-5 shrink-0 cursor-pointer rounded", onNight ? "accent-lime" : "accent-ink")}
        />
        <span>{CANCEL_WAIVER.text}</span>
      </label>
      <Button type="submit" variant={variant} full arrow size="lg">
        {children}
      </Button>
    </form>
  );
}

function PlanAction({ id }: { id: PlanId }) {
  if (id === "monthly")
    return (
      <BuyButton plan="monthly" variant="inverse" onNight>
        Choose Monthly
      </BuyButton>
    );
  if (id === "pass90") return <BuyButton plan="pass90" variant="primary">Get the 90-Day Pass</BuyButton>;
  return (
    <ButtonLink href="/login" variant="secondary" full arrow size="lg">
      Start free
    </ButtonLink>
  );
}

// Free compared with the paid plans (Monthly and the 90-Day Pass include the same things).
const YES = { yes: true } as const;
const NO = { yes: false } as const;
type Cell = string | { yes: boolean };
const COMPARISON: { feature: string; free: Cell; paid: Cell }[] = [
  { feature: "AI mock interviews with a scored debrief", free: "1, the free starter case", paid: `Up to ${limits.paid.aiCasesPerDay} a day (${limits.paid.aiCasesPerMonth} a month)` },
  { feature: "Cases you can run with the AI interviewer", free: "The free starter case", paid: "Every case" },
  { feature: "Read every case prompt", free: YES, paid: YES },
  { feature: "Drills", free: `${limits.free.drillsPerDay} a day`, paid: "Unlimited" },
  { feature: "Maths checked by code in every debrief", free: YES, paid: YES },
  { feature: "Model answer outline for each case", free: NO, paid: YES },
  { feature: "Progress across all your interviews", free: NO, paid: YES },
  { feature: "Guides and free tools", free: YES, paid: YES },
  { feature: "Renews", free: "Nothing to renew", paid: "Monthly renews each month; the pass never does" },
];

const FAQ: FaqItem[] = [
  {
    q: "What do I get for free?",
    a: `One full AI mock case with a scored debrief, ${limits.free.drillsPerDay} drills a day, every case prompt, and all the guides and free tools. No card needed.`,
  },
  {
    q: "Can I cancel the Monthly plan?",
    a: "Yes. Open Manage billing on your account page to cancel at any time.",
  },
  {
    q: "Does the 90-Day Pass renew?",
    a: "No. It is one payment and never renews by itself. Buying another pass adds 90 more days.",
  },
  {
    q: "Which plan should I choose?",
    a: `Monthly suits steady practice through a recruiting season. The 90-Day Pass suits a fixed prep sprint, and costs less than three months of Monthly ($${prices.pass90} against $${prices.monthly * 3}).`,
  },
];

function CellView({ value, paid = false }: { value: Cell; paid?: boolean }) {
  if (typeof value === "string") return <span className={paid ? "font-medium text-ink" : "text-ink/80"}>{value}</span>;
  return value.yes ? (
    <span className={cn("inline-grid size-6 place-items-center rounded-full", paid ? "bg-lime text-lime-ink" : "bg-ink text-ink-contrast")}>
      <Check size={13} strokeWidth={2.8} />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="text-subtle">
      <span aria-hidden="true">–</span>
      <span className="sr-only">Not included</span>
    </span>
  );
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const message = ownValue(NOTICES, notice);

  return (
    <>
      <PageHeader
        align="center"
        eyebrow="Pricing"
        title={
          <>
            Simple pricing, <span className="serif-accent">no surprises</span>
          </>
        }
        intro="Start free, no card needed. Upgrade only if it helps you."
      />

      <Container className="mt-6">
        {/* Counts a signed-in free user seeing the plans (the server ignores guests and paying users). */}
        <PaywallSeen place="pricing" />
        {message ? (
          <Notice tone={ownValue(NOTICE_TONES, notice) ?? "info"} className="mx-auto mb-6 max-w-3xl">
            {message}
          </Notice>
        ) : null}

        <ul className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li key={plan.id}>
              <Card tone={plan.highlight ? "night" : "surface"} className={cn("flex h-full flex-col", plan.highlight && "bg-night-glow shadow-float")} padding="lg">
                <div className="flex items-center justify-between gap-3">
                  <h2 className={cn("text-lg font-medium", plan.highlight && "text-white")}>{plan.name}</h2>
                  {plan.highlight ? <Tag tone="lime">Most flexible</Tag> : plan.id === "free" ? <Tag>No card needed</Tag> : <Tag tone="lavender">Never renews</Tag>}
                </div>
                <p className={cn("mt-6 flex items-baseline gap-2", plan.highlight ? "text-white" : "text-ink")}>
                  <span className="text-5xl font-medium tracking-tight">{plan.price}</span>
                  <span className={cn("text-sm", plan.highlight ? "text-on-night-muted" : "text-muted")}>{plan.cadence}</span>
                </p>
                <p className={cn("mt-3 text-sm leading-relaxed", plan.highlight ? "text-on-night-muted" : "text-muted")}>{plan.blurb}</p>
                <ul className={cn("mt-6 space-y-3 border-t pt-6 text-sm leading-snug", plan.highlight ? "border-white/10" : "border-line")}>
                  {plan.features.map((f) => (
                    <li key={f} className={cn("flex gap-2.5", plan.highlight ? "text-white/90" : "text-ink")}>
                      <Check size={16} strokeWidth={2.4} className={cn("mt-0.5 shrink-0", plan.highlight ? "text-lime" : "text-brand")} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <PlanAction id={plan.id} />
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {[
            { icon: <Lock size={15} />, text: "Payments by Stripe" },
            { icon: <Shield size={15} />, text: "We never see your card" },
            { icon: <Sparkle size={15} />, text: "Prices in US dollars" },
          ].map((t) => (
            <li key={t.text} className="inline-flex items-center gap-2">
              {t.icon}
              {t.text}
            </li>
          ))}
        </ul>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="compare-title">
          <div className="mx-auto max-w-3xl text-center">
            <Kicker>Compare</Kicker>
            <h2 id="compare-title" className="mt-4 text-[2rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Free or paid, <span className="serif-accent">side by side</span>
            </h2>
            <p className="mt-4 text-muted sm:text-lg">Monthly and the 90-Day Pass include the same things. Only how you pay differs.</p>
          </div>
          {/* Phones: one card per feature, with both plans side by side, so the paid column is never off screen. */}
          <ul className="mt-10 divide-y divide-line overflow-hidden rounded-[1.5rem] bg-surface ring-1 ring-inset ring-line sm:hidden">
            {[...COMPARISON, { feature: "Price", free: "$0", paid: `$${prices.monthly} a month, or $${prices.pass90} once` } as const].map((row) => (
              <li key={row.feature} className="px-4 py-4">
                <p className="font-medium text-ink">{row.feature}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-surface-2 p-3 ring-1 ring-inset ring-line">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">Free</dt>
                    <dd className="mt-1.5">
                      <CellView value={row.free} />
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-lime/25 p-3 ring-1 ring-inset ring-lime/60">
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink/70">Monthly or Pass</dt>
                    <dd className="mt-1.5">
                      <CellView value={row.paid} paid />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="relative mt-10 hidden overflow-x-auto rounded-[1.5rem] bg-surface ring-1 ring-inset ring-line sm:block">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
              <caption className="sr-only">What the free plan and the paid plans include</caption>
              <thead>
                <tr className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="px-5 py-3.5 font-medium sm:px-6">
                    What you get
                  </th>
                  <th scope="col" className="w-[28%] px-5 py-3.5 font-medium">
                    Free
                  </th>
                  <th scope="col" className="w-[34%] bg-lime/40 px-5 py-3.5 font-medium text-ink">
                    Monthly or 90-Day Pass
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="px-5 py-4 font-medium text-ink sm:px-6">
                      {row.feature}
                    </th>
                    <td className="px-5 py-4 align-middle">
                      <CellView value={row.free} />
                    </td>
                    <td className="bg-lime/10 px-5 py-4 align-middle">
                      <CellView value={row.paid} paid />
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-5 py-4 font-medium text-ink sm:px-6">
                    Price
                  </th>
                  <td className="px-5 py-4 font-mono tabular-nums text-ink">$0</td>
                  <td className="bg-lime/10 px-5 py-4 font-mono tabular-nums text-ink">
                    ${prices.monthly} a month, or ${prices.pass90} once
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </Container>

      <Container className="mt-16 grid gap-4 sm:mt-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Card tone="butter" padding="lg">
          <section aria-labelledby="small-print">
            <Kicker>Small print</Kicker>
            <h2 id="small-print" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Good to know
            </h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/80">
              <p>Prices are in US dollars. Payments are taken by Stripe, so we never see or store your card details.</p>
              <p>
                Your first full interview is free, so you can try it properly first. After that, all sales are final: we don&rsquo;t offer refunds,
                except where the law requires them. This does not affect your legal rights.
              </p>
              <p>
                Monthly renews each month until you cancel. Cancel any time in Manage billing on your account page; you keep access until the end
                of the month you&rsquo;ve paid for. The 90-Day Pass never renews.
              </p>
              <p>
                Details are on the{" "}
                <Link href="/legal/refunds" className="font-medium text-ink underline underline-offset-4">
                  refund policy
                </Link>
                {siteConfig.supportEmail ? (
                  <>
                    . Questions? Email{" "}
                    <a className="font-medium text-ink underline underline-offset-4" href={`mailto:${siteConfig.supportEmail}`}>
                      {siteConfig.supportEmail}
                    </a>
                  </>
                ) : null}
                .
              </p>
              <p className="border-t border-ink/10 pt-4 text-sm text-ink/70">{siteConfig.disclaimer}</p>
            </div>
          </section>
        </Card>
        <section aria-labelledby="pricing-faq-title">
          <h2 id="pricing-faq-title" className="sr-only">
            Questions about paying
          </h2>
          <Faq items={FAQ} />
          <JsonLd data={faqJsonLd(FAQ)} />
        </section>
      </Container>
      <div className="h-6 sm:h-10" />
    </>
  );
}
