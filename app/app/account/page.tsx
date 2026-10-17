import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Notice, type NoticeTone } from "@/components/app/notice";
import { Kicker, Tag } from "@/components/ui/badge";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { Download, Lock, Shield, Trash } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { isPaid } from "@/lib/access";
import { ownValue } from "@/lib/app/own-key";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

const planNames: Record<string, string> = {
  free: "Free",
  monthly: "Monthly",
  pass90: "90-Day Pass",
  group: "Group",
};

const notices: Record<string, string> = {
  unavailable: "Billing isn't switched on yet.",
  no_billing: "There is no billing to manage yet. Choose a plan on the pricing page first.",
  error: "We couldn't open billing just now. Please try again in a minute.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; notice?: string }>;
}) {
  const user = await requireUser();
  const { checkout, notice } = await searchParams;

  // Read as the user (not the admin), so Row Level Security applies.
  const supabase = await createClient();
  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("plan, status, expires_at, stripe_ref")
    .maybeSingle();

  const paid = isPaid(entitlement ?? null);
  const plan = paid ? (planNames[entitlement?.plan ?? "free"] ?? "Free") : "Free";
  const expires =
    paid && entitlement?.expires_at
      ? new Date(entitlement.expires_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const hasBilling = Boolean(entitlement?.stripe_ref);
  const message =
    checkout === "success"
      ? paid
        ? "Thank you! Your plan is active."
        : "Thank you! We're confirming your payment. Refresh this page in a minute."
      : checkout === "pending"
        ? "Thank you! We're confirming your payment. Refresh this page in a minute."
        : ownValue(notices, notice);
  const messageTone: NoticeTone = checkout === "success" && paid ? "success" : checkout ? "info" : "warning";

  return (
    <>
      <AppHeader
        eyebrow="Settings"
        title={
          <>
            Your plan and <span className="serif-accent">your data</span>
          </>
        }
        intro={<p>Manage billing, download everything we hold about you, or delete your account.</p>}
      />

      <Container className="mt-4 space-y-4">
        {message ? <Notice tone={messageTone}>{message}</Notice> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card tone={paid ? "lavender" : "surface"} className="lg:col-span-2" padding="none">
            <section aria-labelledby="details" className="flex h-full flex-col p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="details" className="text-2xl font-medium tracking-tight text-ink">
                  Your details
                </h2>
                {paid ? <Tag tone="lime">Active</Tag> : <Tag>Free plan</Tag>}
              </div>
              <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3.5 sm:px-5">
                  <dt className="text-sm text-muted">Email</dt>
                  <dd className="min-w-0 break-all font-medium text-ink">{user.email}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3.5 sm:px-5">
                  <dt className="text-sm text-muted">Plan</dt>
                  <dd className="font-medium text-ink">
                    {plan}
                    {expires ? (entitlement?.plan === "monthly" ? ` (paid until ${expires})` : ` (until ${expires})`) : ""}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted">
                {paid
                  ? entitlement?.plan === "monthly"
                    ? "Your Monthly plan renews each month. You can cancel any time from Manage billing."
                    : entitlement?.plan === "pass90"
                      ? "Your pass never renews by itself. Buy another to add 90 more days."
                      : "Your plan is managed by your group."
                  : `One full AI interview with a scored debrief and ${siteConfig.limits.free.drillsPerDay} drills a day. Upgrade for every case.`}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                {!paid || entitlement?.plan === "pass90" ? (
                  <ButtonLink href="/pricing" arrow>
                    {paid ? "Add 90 more days" : "See plans"}
                  </ButtonLink>
                ) : null}
                {hasBilling ? (
                  <form method="post" action="/api/stripe/portal">
                    <Button type="submit" variant="secondary">
                      Manage billing
                    </Button>
                  </form>
                ) : null}
              </div>
            </section>
          </Card>

          <Card className="flex flex-col" padding="none">
            <section aria-labelledby="export" className="flex h-full flex-col p-6 sm:p-8">
              <IconBadge>
                <Download size={20} />
              </IconBadge>
              <h2 id="export" className="mt-5 text-xl font-medium tracking-tight text-ink">
                Download your data
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Get a copy of everything we hold about you as a JSON file.</p>
              <div className="mt-auto pt-6">
                <a href="/api/account/export" className={cn(buttonClasses({ variant: "secondary", full: true }))}>
                  <Download size={17} />
                  Download my data
                </a>
              </div>
            </section>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card tone="butter" className="flex flex-col">
            <Kicker>Privacy</Kicker>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/80">
              <li className="flex gap-2.5">
                <Shield size={17} className="mt-0.5 shrink-0" />
                <span>No ad trackers. Cookies only to keep you logged in.</span>
              </li>
              <li className="flex gap-2.5">
                <Lock size={17} className="mt-0.5 shrink-0" />
                <span>Payments are taken by Stripe, so we never see or store your card details.</span>
              </li>
            </ul>
            <p className="mt-auto pt-5 text-sm">
              <Link href="/legal/privacy" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Read the privacy policy
              </Link>
            </p>
          </Card>

          <section aria-labelledby="delete" className="rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-danger/40 sm:p-8 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-danger-soft text-danger">
                <Trash size={19} />
              </span>
              <h2 id="delete" className="text-xl font-medium tracking-tight text-ink">
                Delete your account
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This permanently deletes your account, your practice history and your interview transcripts. It cannot be
              undone.{hasBilling ? " Any subscription is cancelled first, so you are not charged again." : ""}
            </p>
            <DeleteAccountForm email={user.email ?? ""} />
          </section>
        </div>
      </Container>
      <div className="h-6 sm:h-10" />
    </>
  );
}
