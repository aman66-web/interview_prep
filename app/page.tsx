import type { Metadata } from "next";
import Link from "next/link";
import { CaseCard } from "@/components/marketing/case-card";
import { FirmLibrary } from "@/components/marketing/firm-library";
import { MOCK_EXAMPLE, MockDebrief, MockExhibit, MockInterview, MockMathsCheck, MockStageBar } from "@/components/marketing/mocks";
import { Eyebrow, Kicker, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import { Faq, faqJsonLd, JsonLd, type FaqItem } from "@/components/ui/faq";
import {
  ArrowUpRight,
  Book,
  Bolt,
  Calculator,
  ChartBars,
  Chat,
  Check,
  Clock,
  Layers,
  Lock,
  Notes,
  Shield,
  Sparkle,
  Target,
  Users,
} from "@/components/ui/icons";
import { absoluteUrl } from "@/components/learn/seo";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Marquee } from "@/components/ui/marquee";
import { Photo } from "@/components/ui/photo";
import { visibleCases } from "@/lib/content/cases";
import { CASE_TYPE_LABELS } from "@/lib/content/labels";
import { toCaseSummary } from "@/lib/content/public";
import { allDrills, CATEGORY_INFO, DRILL_CATEGORIES, drillsByCategory } from "@/lib/drills";
import { homeImage } from "@/lib/images";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/ui/cn";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The home page. Every number on it is counted from the content or read from
// site.config.ts (rule 2.4: no invented users, ratings or results). The product pictures
// use the worked example from the free profitability guide (MOCK_EXAMPLE), never a case
// from the library, so the home page gives away no case's exhibits or maths answers.

const EXAMPLE_GUIDE = `/guides/${MOCK_EXAMPLE.guide}`;

const PRACTISE = [
  ...Object.entries(CASE_TYPE_LABELS)
    .filter(([key]) => key !== "other")
    .map(([, label]) => label),
  "Mental maths",
  "Chart reading",
  "Structuring",
  "Brainstorming",
  "Synthesis",
  "Recommendations",
];

const STAGES = [
  { name: "Clarify", text: "Ask the questions that pin down the goal before you build anything." },
  { name: "Structure", text: "Lay out your approach. The interviewer pushes on gaps and overlaps." },
  { name: "Analysis", text: "Ask for data, read the exhibits, do the maths out loud." },
  { name: "Brainstorm", text: "Generate ideas that are wide, sorted and relevant to the client." },
  { name: "Recommend", text: "Give an answer first, with reasons, risks and next steps." },
];

const FAQ: FaqItem[] = [
  {
    q: "What is a case interview?",
    a: "A case interview is a business problem you work through out loud with an interviewer, the way consulting firms assess candidates. You clarify the question, build a structure, analyse data and finish with a recommendation.",
  },
  {
    q: "How does the AI interviewer work?",
    a: "It runs a written case with you stage by stage. It answers clarifying questions, pushes back on weak structures and shares exhibits during the analysis, when you ask for relevant data or when it moves the case on. At the end it asks for your recommendation. Then it scores five skills and tells you what to fix next.",
  },
  {
    q: "Is the maths in the debrief marked by the AI?",
    a: "No. Every numeric question has an expected answer that our tests recompute, and your answers are checked by code against it. The AI comments on how you explained the maths, not on whether the number was right.",
  },
  {
    q: "Are the cases copied from casebooks?",
    a: "No. Every case is written for this site, with invented companies and numbers that add up. We never copy or paraphrase cases from casebooks, books, forums or other prep sites.",
  },
  {
    q: "What do I get for free?",
    a: `One full AI mock case with a scored debrief, ${siteConfig.limits.free.drillsPerDay} drills a day, every case prompt, and all the guides and free tools. No card needed.`,
  },
  {
    q: `Is ${siteConfig.brandName} linked to any consulting firm?`,
    a: siteConfig.disclaimer,
  },
];

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="px-3 pt-4 sm:px-4">
      <div className="bg-aurora relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2.25rem] ring-1 ring-inset ring-line">
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(60%_60%_at_70%_40%,black,transparent)]" />
        <div className="relative mx-auto grid max-w-[76rem] items-center gap-14 px-6 pb-20 pt-14 sm:px-10 sm:pt-20 lg:grid-cols-[1.08fr_1fr] lg:gap-8 lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <Eyebrow tone="lime" icon={<Sparkle size={14} />}>
              Your first full interview is free
            </Eyebrow>
            {/* The headline says what it is in plain words (the same sentence as siteConfig.tagline), so the page makes sense in a second. */}
            <h1 id="hero-title" className="mt-6 text-[2.5rem] font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:text-[3.5rem] xl:text-[3.9rem]">
              Practise <span className="serif-accent">consulting case interviews</span> with an{" "}
              <span className="text-gradient whitespace-nowrap">AI interviewer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              <strong className="font-medium text-ink">No practice partner needed.</strong> It pushes back, shows exhibits and checks your
              maths, then gives you a scored debrief that shows exactly what to fix.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/login" size="lg" arrow>
                Start free, no card needed
              </ButtonLink>
              <ButtonLink href="/cases" variant="secondary" size="lg">
                Browse the cases
              </ButtonLink>
            </div>
            <ul className="mt-9 grid gap-2.5 text-sm font-medium text-ink sm:grid-cols-3 sm:gap-3">
              {[
                { icon: <Users size={16} />, text: "Practise any time, no partner needed" },
                { icon: <Calculator size={16} />, text: "Every maths answer checked by code" },
                { icon: <Target size={16} />, text: "Scored debrief with your next fix" },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-2.5 rounded-2xl bg-surface p-2.5 shadow-soft ring-1 ring-inset ring-line sm:items-start sm:p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">{b.icon}</span>
                  <span className="leading-snug sm:pt-0.5">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative mx-auto w-full max-w-xl sm:pb-28 lg:max-w-none lg:pl-6">
            <div aria-hidden="true" className="absolute -inset-6 -z-0 rounded-[3rem] bg-gradient-to-br from-[#4f46e5]/15 via-transparent to-[#d6f55c]/25 blur-2xl" />
            <MockInterview className="relative z-10 sm:mr-8" />
            <MockMathsCheck solid className="relative z-20 mt-4 sm:absolute sm:bottom-2 sm:left-0 sm:mt-0 sm:w-64 sm:animate-float lg:-left-2" />
            <MockDebrief compact className="relative z-20 mt-4 hidden sm:absolute sm:-bottom-6 sm:right-0 sm:mt-0 sm:block sm:w-60 sm:rotate-2" />
            <figcaption className="sr-only">
              {`An example of the interview room, using the worked example from our free profitability guide (${MOCK_EXAMPLE.company}, an invented cinema chain whose profit fell from £${MOCK_EXAMPLE.profitLast}m to £${MOCK_EXAMPLE.profitNow}m): the stage bar, a short exchange with the interviewer, a maths check and part of an example scored debrief.`}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Facts({ drillCount }: { drillCount: number }) {
  const facts = [
    { value: "5", label: "interview stages, from clarifying to recommending" },
    { value: "5", label: "skills scored out of 5 in every debrief" },
    { value: String(drillCount), label: "drills in mental maths, sizing, structure and charts" },
    { value: "100%", label: "original cases, written for this site" },
  ];
  return (
    <Container className="mt-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-line ring-1 ring-inset ring-line lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col-reverse justify-end gap-1 bg-surface p-6 sm:p-7">
            <dt className="text-sm leading-snug text-muted">{f.label}</dt>
            <dd className="text-4xl font-medium tracking-tight text-ink tabular-nums sm:text-5xl">{f.value}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}

/** Two chairs across a table, with a short example exchange floating over the wall above them. */
function InterviewerPicture() {
  const photo = homeImage("interviewer");
  const bubbles = (
    <div aria-hidden="true" className="space-y-2.5">
      <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-[13px] text-ink-contrast shadow-soft">
        I&rsquo;d look at revenue and costs separately.
      </p>
      <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 text-[13px] text-ink shadow-soft ring-1 ring-inset ring-line">
        Fine, but ticket sales didn&rsquo;t move. Where else could £{MOCK_EXAMPLE.profitLast - MOCK_EXAMPLE.profitNow}m
        have gone, and where would you look first?
      </p>
    </div>
  );
  if (!photo) return <div className="rounded-[1.5rem] bg-surface-2 p-4 ring-1 ring-inset ring-line">{bubbles}</div>;
  return (
    <div className="relative min-h-[19rem] overflow-hidden rounded-[1.5rem] sm:min-h-[21rem] lg:h-full">
      <Photo
        photo={photo}
        sizes="(min-width: 1024px) 400px, (min-width: 768px) 60vw, calc(100vw - 5rem)"
        className="absolute inset-0 rounded-[1.5rem]"
      />
      <div className="relative p-3 sm:p-4">{bubbles}</div>
    </div>
  );
}

/** The exhibits card's picture: a hand pointing at printed charts, with the example exhibit laid over the lower edge. */
function ExhibitsPicture() {
  const photo = homeImage("exhibits");
  if (!photo) return <MockExhibit className="mt-6" />;
  return (
    <div className="mt-6">
      <Photo
        photo={photo}
        sizes="(min-width: 1024px) 340px, (min-width: 768px) 30vw, calc(100vw - 5rem)"
        className="aspect-[2/1] rounded-2xl"
        objectPosition="62% 42%"
      />
      <MockExhibit className="relative mx-2 -mt-10 shadow-float" />
    </div>
  );
}

function Why({ drillCount }: { drillCount: number }) {
  return (
    <Section id="why" labelledBy="why-title">
      <Container>
        <SectionHeading
          id="why-title"
          eyebrow="Why it works"
          title={
            <>
              Practice that feels like the{" "}
              <span className="serif-accent">real thing</span>
            </>
          }
          intro="Reading casebooks teaches you what a good answer looks like. Practising out loud, under a little pressure, is what makes you give one."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Card className="md:col-span-4" padding="none">
            <div className="grid h-full gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <IconBadge tone="ink">
                  <Chat size={20} />
                </IconBadge>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">An interviewer that pushes back</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  It answers clarifying questions, asks you to defend your structure and moves you on when you stall,
                  just like a person across the table would. It never gives you the answer.
                </p>
              </div>
              <InterviewerPicture />
            </div>
          </Card>

          <Card tone="lime" className="md:col-span-2">
            <IconBadge tone="surface">
              <Calculator size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight">Maths marked by code</h3>
            <p className="mt-3 leading-relaxed text-lime-ink/80">
              Every numeric answer is checked against an expected value our tests recompute. No model opinions on
              whether 3 divided by 4 is three quarters.
            </p>
          </Card>

          <Card tone="soft" className="flex flex-col md:col-span-2">
            <IconBadge>
              <ChartBars size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight">Exhibits during the analysis</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Tables and charts appear in the analysis, when you ask for relevant data or when the interviewer moves the case on.
            </p>
            <ExhibitsPicture />
          </Card>

          <Card tone="night" className="flex flex-col md:col-span-2">
            <IconBadge tone="glass">
              <Target size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight text-white">A debrief you can act on</h3>
            <p className="mt-3 leading-relaxed text-on-night-muted">
              Five skills scored out of 5 with quotes from your own answers, the best moment, the biggest miss and one
              thing to practise next.
            </p>
            <div className="mt-auto space-y-2 pt-6" aria-hidden="true">
              {[
                ["Structure", 4],
                ["Analysis and maths", 4],
                ["Business judgement", 3],
                ["Communication", 4],
                ["Recommendation", 3],
              ].map(([label, v]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-xs text-on-night-muted">
                    <span>{label}</span>
                    <span className="text-white">{v}/5</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${(v as number) * 20}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col md:col-span-2">
            <IconBadge>
              <Notes size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight">Notes, calculator, timer</h3>
            <p className="mt-3 leading-relaxed text-muted">A scratchpad beside the chat, a calculator for checking, and a clock so you learn the pace.</p>
            <div className="mt-auto pt-6">
              <div aria-hidden="true" className="rounded-2xl bg-butter p-4 font-mono text-[12px] leading-relaxed text-ink/80">
                <p>Visits flat at {MOCK_EXAMPLE.visitsM}m</p>
                <p>Profit down £{MOCK_EXAMPLE.profitLast - MOCK_EXAMPLE.profitNow}m</p>
                <p>
                  Food &amp; drink −£{MOCK_EXAMPLE.foodContributionLast - MOCK_EXAMPLE.foodContributionNow}m{" "}
                  <span className="rounded bg-surface px-1 text-ink">¾ of fall</span>
                </p>
                <p>Fixed costs +£{MOCK_EXAMPLE.fixedNow - MOCK_EXAMPLE.fixedLast}m</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
                {[
                  { i: <Notes size={14} />, t: "Notes" },
                  { i: <Calculator size={14} />, t: "Calculator" },
                  { i: <Clock size={14} />, t: "25:00" },
                ].map((x) => (
                  <span key={x.t} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
                    {x.i}
                    {x.t}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card tone="lavender" className="md:col-span-3">
            <IconBadge tone="surface">
              <Bolt size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight">Drills for the gaps</h3>
            <p className="mt-3 max-w-md leading-relaxed text-ink/75">
              {drillCount} short drills in mental maths, market sizing, frameworks and chart reading. Five minutes on the
              bus beats an hour you never find.
            </p>
            <Link href="/drills" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              Try a drill, no account needed <ArrowUpRight size={15} />
            </Link>
          </Card>

          <Card tone="sky" className="md:col-span-3">
            <IconBadge tone="surface">
              <Shield size={20} />
            </IconBadge>
            <h3 className="mt-5 text-2xl font-medium tracking-tight">Honest by design</h3>
            <p className="mt-3 max-w-md leading-relaxed text-ink/75">
              Original cases with numbers that add up, firm guides that cite official sources, no fake reviews and no ad trackers. Your transcripts are deleted after {siteConfig.transcriptRetentionDays} days.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              How we build {siteConfig.brandName} <ArrowUpRight size={15} />
            </Link>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function HowItWorks() {
  const desk = homeImage("practice-desk");
  return (
    <section aria-labelledby="how-title" className="px-3 sm:px-4">
      <div className="bg-night-glow relative mx-auto w-full max-w-[88rem] overflow-hidden rounded-[2.25rem] text-on-night">
        <Container className="py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <Kicker onNight>How it works</Kicker>
              <h2 id="how-title" className="mt-5 text-[2rem] font-medium leading-[1.08] tracking-tight text-white sm:text-5xl">
                One case, five stages,{" "}
                <span className="serif-accent text-lime">one clear next step.</span>
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-on-night-muted lg:justify-self-end">
              Each interview follows the shape of a real case. The stage bar shows where you are, and the debrief
              scores each part, so you know which stage costs you the most.
            </p>
          </div>

          <ol className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {STAGES.map((s, i) => (
              <li key={s.name} className="relative rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10 transition-colors last:col-span-2 hover:bg-white/[0.07] sm:p-6 lg:last:col-span-1">
                <span className="font-mono text-xs text-on-night-muted">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-medium text-white">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-night-muted">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className={cn("mt-14 grid gap-4", desk ? "lg:grid-cols-[1.15fr_1fr]" : "lg:grid-cols-3")}>
            {desk ? (
              <Photo
                photo={desk}
                backdrop={false}
                sizes="(min-width: 1024px) 600px, calc(100vw - 4rem)"
                className="aspect-[3/2] rounded-[1.5rem] lg:aspect-auto lg:h-full lg:min-h-[20rem]"
              />
            ) : null}
            <div className={desk ? "grid gap-3" : "contents"}>
              {[
                { n: "1", t: "Pick a case", d: "Choose by type, industry and difficulty, or start with the free starter case." },
                { n: "2", t: "Talk it through", d: "Type your answers as you would say them. Ask for data, use the calculator, take notes." },
                { n: "3", t: "Read your debrief", d: "Scores for five skills, your maths checked by code, and the one drill to do next." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 rounded-[1.5rem] bg-white p-6 text-[#0b1020]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime font-semibold text-lime-ink">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#4a4f63]">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

function DebriefShowcase() {
  const blocks = homeImage("debrief");
  const points = [
    "Five skills scored out of 5: structure, analysis and maths, business judgement, communication and recommendation",
    "Quotes from your own answers, so every score has a reason",
    "Each maths answer marked right or wrong by code, with the working",
    "One thing to fix next, linked to the drill that practises it",
  ];
  return (
    <Section labelledBy="debrief-title">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            {blocks ? (
              // Wooden blocks like a bar chart behind the example debrief; the cards leave the blocks in view at the bottom.
              <Photo photo={blocks} decorative sizes="(min-width: 1024px) 620px, 100vw" className="absolute -inset-4 rounded-[2.5rem]" />
            ) : (
              <div aria-hidden="true" className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#ece8ff] via-[#e5efff] to-[#e2f5e8] opacity-80 dark:opacity-20" />
            )}
            <div className={cn("relative grid gap-4 p-2 sm:grid-cols-[1fr_0.8fr] sm:p-6", blocks && "pb-40 sm:pb-48")}>
              <MockDebrief />
              <div className="flex flex-col gap-4">
                <MockMathsCheck />
                <div aria-hidden="true" className="rounded-2xl bg-surface p-4 shadow-float ring-1 ring-inset ring-line">
                  <p className="text-[11px] font-medium text-subtle">Best moment</p>
                  <p className="mt-1 text-[13px] leading-snug text-ink">
                    &ldquo;Ticket sales held at £{MOCK_EXAMPLE.ticketSales}m, so the drop came from food and drink or from costs.&rdquo;
                  </p>
                </div>
                <div aria-hidden="true" className="rounded-2xl bg-surface p-4 shadow-float ring-1 ring-inset ring-line">
                  <p className="text-[11px] font-medium text-subtle">Stage reached</p>
                  <MockStageBar active={4} className="mt-2" />
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              id="debrief-title"
              eyebrow="The debrief"
              title={
                <>
                  Know exactly <span className="serif-accent">what to fix</span>
                </>
              }
              intro="Most practice ends with “that was fine”. Yours ends with a scorecard, evidence from your own words, and a next step."
            />
            <ul className="mt-8 space-y-3.5">
              {points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                    <Check size={13} strokeWidth={2.8} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-subtle">
              The pictures on this page use the worked example from our free{" "}
              <Link href={EXAMPLE_GUIDE} className="underline underline-offset-4 hover:text-ink">
                profitability guide
              </Link>
              , not a case from the library. The scores are an example.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

const DRILL_TONES = ["butter", "sky", "mint", "peach"] as const;
const DRILL_ICONS = [<Calculator key="c" size={20} />, <Target key="t" size={20} />, <Layers key="l" size={20} />, <ChartBars key="b" size={20} />];

function Drills() {
  const photo = homeImage("drills");
  return (
    <Section labelledBy="drills-title" className="pt-0 sm:pt-0">
      <Container className={cn(photo && "grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12")}>
        <div className={cn(photo && "flex flex-col")}>
          <div className={cn("flex flex-col justify-between gap-6", !photo && "md:flex-row md:items-end")}>
            <SectionHeading
              align="left"
              id="drills-title"
              eyebrow="Drills"
              title={
                <>
                  Sharpen the basics in <span className="serif-accent">five minutes</span>
                </>
              }
              intro="Quick questions with instant feedback. Try a few without an account."
            />
            <div className="shrink-0">
              <ButtonLink href="/drills" variant="secondary" arrow>
                All drills
              </ButtonLink>
            </div>
          </div>
          {photo ? (
            <Photo
              photo={photo}
              sizes="(min-width: 1024px) 520px, calc(100vw - 2rem)"
              className="mt-10 aspect-[4/3] rounded-[1.75rem] lg:aspect-auto lg:min-h-[16rem] lg:flex-1"
            />
          ) : null}
        </div>
        <ul className={cn("grid gap-4 sm:grid-cols-2", !photo && "mt-12 lg:grid-cols-4")}>
          {DRILL_CATEGORIES.map((cat, i) => (
            <li key={cat}>
              <Link
                href={`/drills/${cat}`}
                className={cn(
                  "group flex h-full flex-col rounded-[1.75rem] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float",
                  {
                    butter: "bg-butter",
                    sky: "bg-sky",
                    mint: "bg-mint",
                    peach: "bg-peach",
                  }[DRILL_TONES[i % DRILL_TONES.length]],
                )}
              >
                <div className="flex items-center justify-between">
                  <IconBadge tone="surface">{DRILL_ICONS[i]}</IconBadge>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink tabular-nums">{drillsByCategory(cat).length} drills</span>
                </div>
                <h3 className="mt-8 text-xl font-medium tracking-tight text-ink">{CATEGORY_INFO[cat].title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{CATEGORY_INFO[cat].blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-ink">
                  Start <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:rotate-45" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function CasesTeaser() {
  const cases = visibleCases();
  const featured = [...cases].sort((a, b) => Number(b.free_starter) - Number(a.free_starter) || Number(b.free_preview) - Number(a.free_preview)).slice(0, 6);
  return (
    <Section labelledBy="cases-title" className="pt-0 sm:pt-0">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            id="cases-title"
            eyebrow="The case library"
            title={
              <>
                Original cases, <span className="serif-accent">numbers that add up</span>
              </>
            }
            intro="Written for this site with invented companies. Every exhibit and every answer is recalculated by our tests."
          />
          <ButtonLink href="/cases" variant="secondary" arrow>
            {cases.length > 0 ? `All ${cases.length} cases` : "The case library"}
          </ButtonLink>
        </div>
        {featured.length > 0 ? (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <li key={c.slug}>
                <CaseCard c={toCaseSummary(c)} />
              </li>
            ))}
          </ul>
        ) : (
          <Card tone="soft" className="mt-12">
            <h3 className="text-xl font-medium">Cases are being checked</h3>
            <p className="mt-2 max-w-2xl text-muted">
              Every case is checked by a human reviewer before it appears here. The drills, guides and
              free tools are ready now.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(CASE_TYPE_LABELS)
                .filter(([k]) => k !== "other")
                .map(([k, label]) => (
                  <Tag key={k}>{label}</Tag>
                ))}
            </div>
          </Card>
        )}
      </Container>
    </Section>
  );
}

function PricingTeaser() {
  return (
    <Section labelledBy="pricing-title" className="pt-0 sm:pt-0">
      <Container>
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          title={
            <>
              Start free. <span className="serif-accent">Upgrade if it helps.</span>
            </>
          }
          intro="Your first full interview and debrief cost nothing. Pay only when you want more practice."
        />
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li key={plan.id}>
              <Card tone={plan.highlight ? "night" : "surface"} className={cn("flex h-full flex-col", plan.highlight && "shadow-float ring-2 ring-inset ring-brand/50")} padding="lg">
                <div className="flex items-center justify-between gap-3">
                  <h3 className={cn("text-lg font-medium", plan.highlight && "text-white")}>{plan.name}</h3>
                  {plan.highlight ? <Tag tone="lime">Most flexible</Tag> : null}
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
                  <ButtonLink href={plan.id === "free" ? "/login" : "/pricing"} variant={plan.highlight ? "inverse" : plan.id === "free" ? "primary" : "secondary"} full arrow>
                    {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                  </ButtonLink>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted">
          Prices in US dollars. Payments by Stripe; we never see your card. <Link href="/pricing" className="underline underline-offset-4">Full pricing and terms</Link>
        </p>
      </Container>
    </Section>
  );
}

function Learn() {
  const items = [
    { href: "/guides", icon: <Book size={20} />, title: "Case guides", text: "How each case type works, with worked examples whose maths is checked." },
    { href: "/tools", icon: <Calculator size={20} />, title: "Free tools", text: "Market sizing, break-even and growth calculators, plus a mental maths trainer." },
    { href: "/glossary", icon: <Layers size={20} />, title: "Glossary", text: "Plain-English definitions of the terms interviewers expect you to know." },
    { href: "/for-universities", icon: <Users size={20} />, title: "For clubs and careers teams", text: "Group access for university consulting clubs and careers services." },
  ];
  return (
    <Section labelledBy="learn-title" className="pt-0 sm:pt-0">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card tone="brand" padding="lg" className="flex flex-col">
            <Kicker className="text-white/70 [&>span]:bg-lime">Free to read</Kicker>
            <h2 id="learn-title" className="mt-5 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Learn the method, <span className="serif-accent">then practise it.</span>
            </h2>
            <p className="mt-4 leading-relaxed text-white/80">Guides, tools and a glossary that are free for everyone, no account needed.</p>
            <div className="mt-auto pt-8">
              <ButtonLink href="/guides" variant="inverse" arrow>
                Read the guides
              </ButtonLink>
            </div>
          </Card>
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className="group flex h-full flex-col rounded-[1.75rem] bg-surface p-6 ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-7"
                >
                  <div className="flex items-start justify-between">
                    <IconBadge>{it.icon}</IconBadge>
                    <ArrowUpRight size={18} className="text-subtle transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
                  </div>
                  <h3 className="mt-6 text-lg font-medium tracking-tight text-ink">{it.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{it.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

function FaqSection() {
  return (
    <Section labelledBy="faq-title" className="pt-0 sm:pt-0">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading align="left" id="faq-title" eyebrow="FAQ" title="Questions, answered" intro="Anything else? The full FAQ covers plans, privacy and how the interviewer works." />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/faq" variant="secondary" arrow>
                Read the full FAQ
              </ButtonLink>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-muted">
              <Lock size={16} />
              <span>No ad trackers. Cookies only to keep you logged in.</span>
            </div>
          </div>
          <Faq items={FAQ} />
        </div>
      </Container>
      <JsonLd data={faqJsonLd(FAQ)} />
    </Section>
  );
}

export default function Home() {
  const drillCount = allDrills.length;
  return (
    <>
      {/* The home page always shows the dark look (see data-force-dark in app/globals.css). */}
      <span hidden data-force-dark="" />
      <Hero />
      <Facts drillCount={drillCount} />
      <FirmLibrary />
      <div className="mt-16 sm:mt-20">
        <p className="mb-5 text-center font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">What you can practise</p>
        <Marquee
          label="What you can practise"
          items={PRACTISE.map((p, i) => (
            <span
              key={p}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-medium",
                i % 3 === 0 ? "bg-ink text-ink-contrast" : "bg-surface text-ink ring-1 ring-inset ring-line",
              )}
            >
              <Sparkle size={14} className={i % 3 === 0 ? "text-lime" : "text-brand"} />
              {p}
            </span>
          ))}
        />
      </div>
      <Why drillCount={drillCount} />
      <HowItWorks />
      <DebriefShowcase />
      <Drills />
      <CasesTeaser />
      <PricingTeaser />
      <Learn />
      <FaqSection />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.brandName,
          url: absoluteUrl("/"),
          description: siteConfig.tagline,
        }}
      />
    </>
  );
}
