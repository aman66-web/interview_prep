import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MockDebrief, MockStageBar } from "@/components/marketing/mocks";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { Check, Lock, Sparkle } from "@/components/ui/icons";
import { Photo } from "@/components/ui/photo";
import { ownValue } from "@/lib/app/own-key";
import { enabledOAuthProviders, PROVIDER_LABELS } from "@/lib/auth/providers";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { getUser } from "@/lib/auth/session";
import { siteConfig } from "@/site.config";
import { pageImage } from "@/lib/images";
import { turnstileSiteKey } from "@/lib/auth/captcha";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in or sign up",
  robots: { index: false },
};

const notices: Record<string, string> = {
  link_invalid:
    "That sign-in link has expired, was already used, or was opened in a different browser from the one you started in. Enter your email to get a code instead.",
  provider_cancelled: "You cancelled that sign-in. Try again, or enter your email to get a code instead.",
  provider_failed: "We couldn't sign you in with that account. Try again, or enter your email to get a code instead.",
  provider_unavailable: "That sign-in option isn't switched on yet. Enter your email to get a code instead.",
};

const POINTS = [
  "An AI interviewer that pushes back, stage by stage",
  "Exhibits during the analysis, when you ask for data or the case moves on",
  "Maths checked by code, not by opinion",
  "A debrief that scores five skills out of 5",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  if (await getUser()) redirect(next);
  const photo = pageImage("login");
  const providers = enabledOAuthProviders();
  const names = providers.map((p) => PROVIDER_LABELS[p]).join(" or ");

  return (
    <section aria-labelledby="login-title" className="px-3 pt-4 sm:px-4">
      <div className="mx-auto grid w-full max-w-[76rem] overflow-hidden rounded-[2.25rem] bg-surface ring-1 ring-inset ring-line lg:grid-cols-[1fr_1.05fr]">
        <div className="bg-aurora flex flex-col justify-center px-5 py-10 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto w-full max-w-md">
            <Eyebrow tone="lime" icon={<Sparkle size={14} />}>
              Your first full interview is free
            </Eyebrow>
            <h1 id="login-title" className="mt-6 text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Log in or <span className="serif-accent">sign up</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">
              No password and no card. {names ? `Sign in with ${names}, or we email you a one-time code` : "We email you a one-time code to sign in"}; new accounts are created automatically.
            </p>
            <div className="mt-8 rounded-[1.75rem] bg-surface p-5 shadow-float ring-1 ring-inset ring-line sm:p-6">
              <LoginForm next={next} notice={ownValue(notices, params.error)} providers={providers} captchaSiteKey={turnstileSiteKey()} />
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Lock size={15} className="shrink-0" />
              No ad trackers. Cookies only to keep you logged in.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              By continuing you agree to the{" "}
              <Link href="/legal/terms" className="underline underline-offset-4 hover:text-ink">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-ink">
                Privacy policy
              </Link>
              . You must be {siteConfig.minimumAge} or over.
            </p>
          </div>
        </div>

        <div className="bg-night-glow relative hidden flex-col justify-between overflow-hidden px-12 py-16 text-on-night lg:flex lg:px-14">
          <div>
            <Kicker onNight>What you get</Kicker>
            <p className="mt-5 max-w-md text-[2rem] font-medium leading-[1.1] tracking-tight text-white">
              Practise the case, <span className="serif-accent text-lime">then fix what matters.</span>
            </p>
            <ul className="mt-8 space-y-3">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                  <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                    <Check size={13} strokeWidth={2.8} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {photo ? (
            // A desk lamp at night (decorative), with part of an example debrief laid over it. It is the
            // largest picture on a wide screen, so it is preloaded; phones hide the panel and fetch only a
            // tiny copy (sizes ends in 1px).
            <figure className="relative mt-12 min-h-[22rem] flex-1">
              <Photo
                photo={photo}
                decorative
                preload
                backdrop={false}
                sizes="(min-width: 1280px) 520px, (min-width: 1024px) 42vw, 1px"
                className="absolute inset-0 rounded-[1.75rem]"
                objectPosition="40% 72%"
              />
              <MockDebrief compact className="absolute bottom-5 right-5 w-60 rotate-1" />
              <figcaption className="sr-only">An example debrief from the free starter case: skills scored out of 5.</figcaption>
            </figure>
          ) : (
            <figure className="relative mt-12">
              <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#4f46e5]/30 via-transparent to-[#d6f55c]/20 blur-2xl" />
              <div className="relative grid gap-3 sm:grid-cols-[1fr_0.9fr] sm:items-end">
                <MockDebrief className="sm:-rotate-1" />
                <div aria-hidden="true" className="rounded-2xl bg-surface p-4 text-ink shadow-float ring-1 ring-inset ring-line sm:rotate-2">
                  <p className="text-[11px] font-medium text-subtle">Stage reached</p>
                  <MockStageBar active={4} className="mt-2" />
                </div>
              </div>
              <figcaption className="sr-only">
                An example debrief from the free starter case: five skills scored out of 5 and one thing to practise next.
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
