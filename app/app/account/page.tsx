import type { Metadata } from "next";
import { isPaid } from "@/lib/access";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
        : notice
          ? notices[notice]
          : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      {message ? (
        <p role="status" className="mt-4 rounded-md border border-border p-4">
          {message}
        </p>
      ) : null}

      <section aria-labelledby="details" className="mt-8">
        <h2 id="details" className="text-lg font-semibold">
          Your details
        </h2>
        <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted">Plan</dt>
          <dd>
            {plan}
            {expires ? (entitlement?.plan === "monthly" ? ` (paid until ${expires})` : ` (until ${expires})`) : ""}
          </dd>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {!paid || entitlement?.plan === "pass90" ? (
            <Link href="/pricing" className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground">
              {paid ? "Add 90 more days" : "See plans"}
            </Link>
          ) : null}
          {hasBilling ? (
            <form method="post" action="/api/stripe/portal">
              <button type="submit" className="rounded-md border border-border px-4 py-2 font-medium">
                Manage billing
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="export" className="mt-10">
        <h2 id="export" className="text-lg font-semibold">
          Download your data
        </h2>
        <p className="mt-2 text-muted">
          Get a copy of everything we hold about you as a JSON file.
        </p>
        <a
          href="/api/account/export"
          className="mt-4 inline-block rounded-md border border-border px-4 py-2 font-medium"
        >
          Download my data
        </a>
      </section>

      <section aria-labelledby="delete" className="mt-10">
        <h2 id="delete" className="text-lg font-semibold">
          Delete your account
        </h2>
        <p className="mt-2 text-muted">
          This permanently deletes your account, your practice history and your
          interview transcripts. It cannot be undone.
        </p>
        <DeleteAccountForm email={user.email ?? ""} />
      </section>
    </div>
  );
}
