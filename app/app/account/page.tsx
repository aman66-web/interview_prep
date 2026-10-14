import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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

export default async function AccountPage() {
  const user = await requireUser();

  // Read as the user (not the admin), so Row Level Security applies.
  const supabase = await createClient();
  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("plan, status, expires_at")
    .maybeSingle();

  const plan = planNames[entitlement?.plan ?? "free"] ?? "Free";
  const expires = entitlement?.expires_at
    ? new Date(entitlement.expires_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

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
            {expires ? ` (until ${expires})` : ""}
          </dd>
        </dl>
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
