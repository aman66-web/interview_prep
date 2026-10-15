import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { parseSignInOtpType } from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { siteConfig } from "@/site.config";
import { confirmSignIn } from "./actions";
import { UtmFields } from "@/components/utm-fields";

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
    <section aria-labelledby="continue-title" className="px-3 pt-4 sm:px-4">
      <div className="bg-aurora relative mx-auto w-full max-w-[76rem] overflow-hidden rounded-[2.25rem] px-4 py-16 ring-1 ring-inset ring-line sm:py-24">
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(50%_60%_at_50%_40%,black,transparent)]" />
        <div className="relative mx-auto max-w-md rounded-[1.75rem] bg-surface p-7 text-center shadow-float ring-1 ring-inset ring-line sm:p-10">
          <LogoMark size={48} className="mx-auto" />
          <h1 id="continue-title" className="mt-6 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            One more <span className="serif-accent">step</span>
          </h1>
          <p className="mt-3 text-muted">Press the button to finish signing in to {siteConfig.brandName}.</p>
          <form action={confirmSignIn} className="mt-8">
            <UtmFields />
            <input type="hidden" name="token_hash" value={params.token_hash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={safeNextPath(params.next)} />
            <Button type="submit" size="lg" full arrow>
              Continue
            </Button>
          </form>
          <p className="mt-5 flex items-start justify-center gap-2 text-left text-xs leading-relaxed text-subtle">
            <Shield size={15} className="mt-px shrink-0" />
            This extra step stops email scanners from using up your link before you do.
          </p>
        </div>
      </div>
    </section>
  );
}
