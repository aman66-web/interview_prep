import type { Metadata } from "next";
import Link from "next/link";
import { MockDebrief } from "@/components/marketing/mocks";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { Faq, faqJsonLd, JsonLd, type FaqItem } from "@/components/ui/faq";
import { Bolt, Calculator, Chat, Check, GraduationCap, Lock, Mail, Shield } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { allDrills } from "@/lib/drills";
import { fieldsFromQuery, leadErrorMessage } from "@/lib/leads/messages";
import { siteConfig } from "@/site.config";
import { EnquiryForm } from "./enquiry-form";

export const metadata: Metadata = {
  title: "For universities, consulting clubs and careers services",
  description:
    "Group access to CaseSpar for university consulting clubs and careers services: every case and drill, plus the AI case interviewer with a scored debrief for each member. Pricing agreed by email.",
  alternates: { canonical: "/for-universities" },
};

// Rule 2.4: no university or club logos, no "used by" claims and no quotes from users here.
// Every statement is about what the product does today; group prices are agreed by email.

const { limits, prices, transcriptRetentionDays } = siteConfig;

const FAQ: FaqItem[] = [
  {
    q: "How much does group access cost?",
    a: `Group pricing is agreed by email, based on how many members need access and for how long. For comparison, an individual plan is $${prices.monthly} a month or $${prices.pass90} for a 90-day pass.`,
  },
  {
    q: "What does each member get?",
    a: `The same as a paid individual plan: every case, unlimited drills, up to ${limits.paid.aiCasesPerDay} AI interviews a day (${limits.paid.aiCasesPerMonth} a month) with a scored debrief after each one, model answers and progress tracking.`,
  },
  {
    q: "Can members try it before we commit?",
    a: `Yes. Anyone can start free with one full AI mock case and a scored debrief, plus ${limits.free.drillsPerDay} drills a day. No card is needed.`,
  },
  {
    q: "Can the club or careers team see members' interviews?",
    a: `No. Each member's transcripts and debriefs are private to their own account, and there is no organiser view of them. Transcripts are deleted after ${transcriptRetentionDays} days, and members can export or delete their data from their account page at any time.`,
  },
  {
    q: "Do members need their own accounts?",
    a: "Yes. Each member signs in with their own email address, using a sign-in link or code, so there is no password to remember or share.",
  },
  {
    q: "Are the cases copied from casebooks?",
    a: "No. Every case is written for this site with invented companies and numbers, and our tests recheck all of the maths. We never copy or paraphrase casebooks, books or other prep sites, so the cases work alongside your own club's material.",
  },
  {
    q: `Is ${siteConfig.brandName} linked to any consulting firm?`,
    a: siteConfig.disclaimer,
  },
];

const STEPS = [
  { t: "Tell us about your group", d: "Send the form below with your organisation and roughly how many members need access." },
  { t: "We agree the details by email", d: "We reply to agree the number of places, how long access lasts and the price. There is no fixed group price list." },
  { t: "Members sign in and practise", d: "Each member signs in with their own email address, and we switch on group access for their account." },
];

export default async function ForUniversitiesPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; fields?: string }> }) {
  const { sent, error, fields } = await searchParams;
  const drillCount = allDrills.length;

  return (
    <>
      <PageHeader
        eyebrow={
          <Eyebrow tone="lime" icon={<GraduationCap size={14} />}>
            For universities and clubs
          </Eyebrow>
        }
        title={
          <>
            Case practice for your <span className="serif-accent">whole club</span>
          </>
        }
        intro="Group access for university consulting clubs and careers services. Every member gets the full case library, the drills, and the AI interviewer with a scored debrief after each case."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="#enquiry" size="lg" arrow>
            Send an enquiry
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg">
            Try it free first
          </ButtonLink>
        </div>
      </PageHeader>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="gets-title">
          <div className="max-w-2xl">
            <Kicker>What a group gets</Kicker>
            <h2 id="gets-title" className="mt-4 text-[2rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Everything, for <span className="serif-accent">every member</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Shared access on one agreement, with each member on their own account. Group pricing is agreed by email.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <Card className="md:col-span-4" padding="none">
              <div className="grid h-full gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <IconBadge tone="ink">
                    <Chat size={20} />
                  </IconBadge>
                  <h3 className="mt-5 text-2xl font-medium tracking-tight text-ink">The AI interviewer for each member</h3>
                  <p className="mt-3 leading-relaxed text-muted">
                    Realistic mock cases, run stage by stage: clarifying, structure, analysis, brainstorm and recommendation. Up to{" "}
                    {limits.paid.aiCasesPerDay} interviews a day ({limits.paid.aiCasesPerMonth} a month) each, and a scored debrief after every one.
                  </p>
                </div>
                <MockDebrief compact className="w-full max-w-xs justify-self-center lg:rotate-1" />
              </div>
            </Card>

            <Card tone="lime" className="flex flex-col md:col-span-2">
              <IconBadge tone="surface">
                <Bolt size={20} />
              </IconBadge>
              <h3 className="mt-5 text-2xl font-medium tracking-tight">Every case and drill</h3>
              <p className="mt-3 leading-relaxed text-lime-ink/80">
                The whole case library and unlimited drills: {drillCount} questions in mental maths, market sizing, frameworks and chart reading.
              </p>
              <ul className="mt-auto flex flex-wrap gap-1.5 pt-6" aria-label="Case types">
                {Object.entries(CASE_TYPE_LABELS)
                  .filter(([key]) => key !== "other")
                  .map(([key, label]) => (
                    <li key={key} className="rounded-full bg-lime-ink/[0.08] px-2.5 py-1 text-xs font-medium text-lime-ink">
                      {label}
                    </li>
                  ))}
              </ul>
            </Card>

            <Card tone="night" className="md:col-span-2">
              <IconBadge tone="glass">
                <Lock size={20} />
              </IconBadge>
              <h3 className="mt-5 text-2xl font-medium tracking-tight text-white">Private by default</h3>
              <p className="mt-3 leading-relaxed text-on-night-muted">
                Members&rsquo; interviews belong to them. There is no organiser view of transcripts, and transcripts are deleted after{" "}
                {transcriptRetentionDays} days.
              </p>
            </Card>

            <Card tone="lavender" className="md:col-span-2">
              <IconBadge tone="surface">
                <Calculator size={20} />
              </IconBadge>
              <h3 className="mt-5 text-2xl font-medium tracking-tight">Maths marked by code</h3>
              <p className="mt-3 leading-relaxed text-ink/75">
                Every numeric answer is checked against an expected value our tests recompute, so members get a straight right or wrong.
              </p>
            </Card>

            <Card tone="sky" className="md:col-span-2">
              <IconBadge tone="surface">
                <Shield size={20} />
              </IconBadge>
              <h3 className="mt-5 text-2xl font-medium tracking-tight">Original cases</h3>
              <p className="mt-3 leading-relaxed text-ink/75">
                Written for this site with invented companies and numbers, so they sit alongside your own casebook rather than repeating it.
              </p>
            </Card>
          </div>
        </section>
      </Container>

      <section aria-labelledby="how-title" className="mt-16 px-3 sm:mt-24 sm:px-4">
        <div className="bg-night-glow relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2.25rem] text-on-night">
          <Container className="py-16 sm:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <Kicker onNight>How it works</Kicker>
                <h2 id="how-title" className="mt-5 text-[2rem] font-medium leading-[1.08] tracking-tight text-white sm:text-5xl">
                  Three steps, <span className="serif-accent text-lime">all by email.</span>
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-on-night-muted lg:justify-self-end">
                Tell us what you need, and we work out the places, dates and price with you by email.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-4 rounded-[1.5rem] bg-white p-6 text-[#0b1020]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime font-semibold text-lime-ink">{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#4a4f63]">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </div>
      </section>

      <Container className="mt-16 sm:mt-24">
        <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-28 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <Kicker>Enquiry</Kicker>
            <h2 id="enquiry-title" className="mt-4 text-[2rem] font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Tell us about <span className="serif-accent">your group</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">We&rsquo;ll reply by email to agree the places, dates and price for your group.</p>
            <ul className="mt-8 space-y-3.5">
              {[
                "For consulting clubs, careers services and student societies",
                "Members keep their own private accounts",
                "Pricing agreed by email, for the places and time you need",
              ].map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                    <Check size={13} strokeWidth={2.8} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            {siteConfig.supportEmail ? (
              <p className="mt-8 flex items-center gap-2 text-sm text-muted">
                <Mail size={16} /> Prefer email?{" "}
                <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                  {siteConfig.supportEmail}
                </a>
              </p>
            ) : null}
          </div>
          <EnquiryForm initialSent={sent === "1"} initialError={sent === "1" ? null : leadErrorMessage(error)} initialFields={fieldsFromQuery(fields)} />
        </section>
      </Container>

      <Container className="mb-20 mt-16 sm:mb-28 sm:mt-24">
        <section aria-labelledby="faq-title" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <Kicker>FAQ</Kicker>
            <h2 id="faq-title" className="mt-4 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Questions from <span className="serif-accent">clubs and careers teams</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Anything else? Ask in your enquiry, or read the{" "}
              <Link href="/faq" className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                full FAQ
              </Link>
              .
            </p>
          </div>
          <Faq items={FAQ} />
        </section>
        <JsonLd data={faqJsonLd(FAQ)} />
      </Container>
    </>
  );
}
