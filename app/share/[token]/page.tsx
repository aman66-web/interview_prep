import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eyebrow, Kicker } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkle } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { Container } from "@/components/ui/layout";
import { cardView } from "@/lib/share/card";
import { shareSigningKey, verifyShareToken } from "@/lib/share/token";
import { siteConfig } from "@/site.config";

// A public page for one share card (SPEC section 10). Everything on it comes from the
// signed token in the address: practice scores, the case and the day, plus a first
// name only if the person typed one. Kept out of search results.

type Props = { params: Promise<{ token: string }> };

async function load(params: Props["params"]) {
  const { token: raw } = await params;
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const card = verifyShareToken(token, shareSigningKey());
  return card ? { token, view: cardView(card) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Share card not found", robots: { index: false, follow: false } };
  const { token, view } = found;
  const title = `${view.heading} on ${view.caseTitle}`;
  const description = `${view.overallLabel} out of 5 overall in an AI-scored mock case interview on ${siteConfig.brandName}. Practice scores, not a prediction of any real interview.`;
  const image = { url: `/api/og/score?t=${encodeURIComponent(token)}`, width: 1200, height: 630, alt: view.description };
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: "website", siteName: siteConfig.brandName, title, description, url: `/share/${token}`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharePage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { view } = found;

  return (
    <Container className="pt-6 sm:pt-8">
      <div className="bg-aurora relative overflow-hidden rounded-[2rem] px-5 py-10 ring-1 ring-inset ring-line sm:px-12 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <Eyebrow tone="lime" icon={<Sparkle size={14} />}>
              Practice score
            </Eyebrow>
          </div>
          <h1 className="mt-5 text-[2.25rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {view.heading} on <span className="serif-accent">{view.caseTitle}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            From a mock case interview on {siteConfig.brandName}, scored by an AI interviewer on {view.dateLabel}.
          </p>
        </div>

        {/* The card, drawn in HTML so it is crisp and readable by screen readers. */}
        <Card tone="night" padding="none" className="bg-night-glow mx-auto mt-10 max-w-4xl shadow-float">
          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_1.15fr] md:items-stretch">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <LogoMark size={30} />
                <span className="text-[1.05rem] font-semibold tracking-tight text-white">{siteConfig.brandName}</span>
              </div>
              <Kicker onNight className="mt-8">
                Mock case interview
              </Kicker>
              <p className="mt-3 text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl">{view.caseTitle}</p>
              <p className="mt-2 text-sm text-on-night-muted">{view.dateLabel}</p>
              <p className="mt-8 flex items-end gap-3 md:mt-auto">
                <span className="text-7xl font-medium leading-none tracking-tighter text-lime tabular-nums sm:text-8xl">{view.overallLabel}</span>
                <span className="pb-2 text-sm leading-tight text-on-night-muted">
                  out of 5
                  <br />
                  overall
                </span>
              </p>
            </div>
            <ul className="space-y-4 rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10 sm:p-7" aria-label="Scores for each skill">
              {view.skills.map((s) => (
                <li key={s.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-on-night">{s.label}</span>
                    <span className="font-mono text-white tabular-nums">{s.score}/5</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-white/10" aria-hidden="true">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${s.score * 20}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted">
          These are practice scores from an AI-scored mock case interview. They are not a prediction of how any real interview will go, and not an
          offer or assessment from any firm.
        </p>
      </div>

      <section aria-labelledby="try-title" className="mt-6">
        <Card padding="lg" className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h2 id="try-title" className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Practise a case <span className="serif-accent">yourself</span>
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">
              Run a full mock case with an AI interviewer that asks follow-up questions, hands you exhibits and checks your maths. Your first
              interview and its scored debrief are free.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login" arrow>
                Practise free
              </ButtonLink>
              <ButtonLink href="/cases" variant="secondary">
                Browse the cases
              </ButtonLink>
            </div>
          </div>
          <ul className="space-y-3 text-[15px] text-ink">
            {["No card needed", "Five skills scored out of 5", "Maths checked by code, not by the AI"].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                  <Check size={13} strokeWidth={2.8} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Container>
  );
}
