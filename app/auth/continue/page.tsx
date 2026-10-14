import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parseSignInOtpType } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { siteConfig } from "@/site.config";
import { confirmSignIn } from "./actions";

export const metadata: Metadata = {
  title: "Confirm sign in",
  robots: { index: false },
};

export default async function ContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const params = await searchParams;
  const type = parseSignInOtpType(params.type);
  if (!params.token_hash || !type) redirect("/login?error=link_invalid");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">One more step</h1>
      <p className="mt-2 text-muted">
        Press the button to finish signing in to {siteConfig.brandName}.
      </p>
      <form action={confirmSignIn} className="mt-8">
        <input type="hidden" name="token_hash" value={params.token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={safeNextPath(params.next)} />
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-3 font-medium text-accent-foreground"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
