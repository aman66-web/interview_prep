import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MockDebrief, MockStageBar } from "@/components/marketing/mocks";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { Check, Lock, Sparkle } from "@/components/ui/icons";
import { ownValue } from "@/lib/app/own-key";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { getUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in or sign up",
  robots: { index: false },
};

const notices: Record<string, string> = {
  link_invalid:
    "That sign-in link has expired or was already used. Enter your email to get a new one.",
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
              No password and no card. We email you a one-time sign-in link; new accounts are created automatically.
            </p>
            <div className="mt-8 rounded-[1.75rem] bg-surface p-5 shadow-float ring-1 ring-inset ring-line sm:p-6">
              <LoginForm next={next} notice={ownValue(notices, params.error)} />
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Lock size={15} className="shrink-0" />
              No ad trackers. Cookies only to keep you logged in.
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
        </div>
      </div>
    </section>
  );
}
