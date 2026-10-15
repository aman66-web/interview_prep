import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Account deleted",
  robots: { index: false },
};

export default function AccountDeletedPage() {
  return (
    <section aria-labelledby="deleted-title" className="px-3 pt-4 sm:px-4">
      <div className="bg-aurora relative mx-auto w-full max-w-[76rem] overflow-hidden rounded-[2.25rem] px-4 py-16 ring-1 ring-inset ring-line sm:py-24">
        <div className="relative mx-auto max-w-md rounded-[1.75rem] bg-surface p-7 text-center shadow-float ring-1 ring-inset ring-line sm:p-10">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-lime text-lime-ink">
            <Check size={26} strokeWidth={2.4} />
          </span>
          <h1 id="deleted-title" className="mt-6 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Your account has been <span className="serif-accent">deleted</span>
          </h1>
          <p className="mt-3 text-muted">Your account and your data have been removed. You are welcome back any time.</p>
          <div className="mt-8 flex flex-col gap-2">
            <ButtonLink href="/" size="lg" full arrow>
              Back to the home page
            </ButtonLink>
            <ButtonLink href="/drills" variant="ghost" full>
              Try a drill, no account needed
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
