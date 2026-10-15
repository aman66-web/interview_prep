import type { ReactElement } from "react";
import { siteConfig } from "@/site.config";
import type { CardView } from "./card";

// The two social images, drawn for next/og (Satori): the score share card and the
// site's default preview. Satori supports flexbox and inline styles only, so these
// use plain style objects. Colours are the design system's night palette
// (docs/DESIGN.md: white and raw hex are fine inside night panels). The default
// font that ships with next/og is used, so nothing is fetched from the internet.
// No firm names or logos (rule 2.3).

export const IMAGE_SIZE = { width: 1200, height: 630 } as const;

const C = {
  night: "#0b1020",
  night2: "#141b31",
  lime: "#d6f55c",
  limeInk: "#1b2300",
  white: "#ffffff",
  onNight: "#f5f6fa",
  muted: "#a9afc4",
  faint: "rgba(255,255,255,0.10)",
  line: "rgba(255,255,255,0.12)",
} as const;

const glow =
  "radial-gradient(circle at 50% -20%, rgba(79,70,229,0.60) 0%, rgba(79,70,229,0) 55%), radial-gradient(circle at 100% 100%, rgba(124,92,245,0.30) 0%, rgba(124,92,245,0) 45%)";

function Mark({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#0d0d10" stroke="rgba(255,255,255,0.18)" />
      <path d="M10.5 21.5 21 11" stroke={C.lime} strokeWidth="3" strokeLinecap="round" />
      <path d="M13 10.5h8.5V19" stroke={C.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Brand({ size = 52, fontSize = 34 }: { size?: number; fontSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Mark size={size} />
      <div style={{ display: "flex", fontSize, color: C.white, letterSpacing: -0.5 }}>{siteConfig.brandName}</div>
    </div>
  );
}

function Kicker({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, letterSpacing: 4, color: C.muted, textTransform: "uppercase" }}>
      <div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: C.lime }} />
      {children}
    </div>
  );
}

function Frame({ children }: { children: ReactElement | ReactElement[] }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.night,
        backgroundImage: glow,
        color: C.onNight,
        padding: "56px 64px",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

/** The share card: five bars, the overall score and the case. */
export function ScoreCardImage({ view, host }: { view: CardView; host: string }): ReactElement {
  return (
    <Frame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={48} fontSize={30} />
        <div
          style={{
            display: "flex",
            padding: "10px 22px",
            borderRadius: 999,
            background: C.lime,
            color: C.limeInk,
            fontSize: 20,
            letterSpacing: 0.5,
          }}
        >
          Practice score
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, marginTop: 30, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 500 }}>
          <Kicker>{view.heading}</Kicker>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: view.caseTitle.length > 28 ? 46 : 56,
              lineHeight: 1.08,
              color: C.white,
              letterSpacing: -1.5,
            }}
          >
            {view.caseTitle}
          </div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 22, color: C.muted }}>{`Mock case interview · ${view.dateLabel}`}</div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: "auto", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 132, lineHeight: 1, color: C.lime, letterSpacing: -6 }}>{view.overallLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", paddingBottom: 14, fontSize: 24, color: C.muted }}>
              <div style={{ display: "flex" }}>out of 5</div>
              <div style={{ display: "flex" }}>overall</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 15,
            padding: "24px 32px",
            borderRadius: 32,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${C.line}`,
          }}
        >
          {view.skills.map((s) => (
            <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, lineHeight: 1.2 }}>
                <div style={{ display: "flex", color: C.onNight }}>{s.label}</div>
                <div style={{ display: "flex", color: C.white }}>{`${s.score}/5`}</div>
              </div>
              <div style={{ display: "flex", height: 12, borderRadius: 999, background: C.faint }}>
                <div style={{ display: "flex", width: `${s.score * 20}%`, height: 12, borderRadius: 999, background: C.lime }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 26,
          paddingTop: 20,
          borderTop: `1px solid ${C.line}`,
          fontSize: 21,
          color: C.muted,
        }}
      >
        <div style={{ display: "flex" }}>{`Practice score on ${siteConfig.brandName} · scored by AI in a mock interview`}</div>
        <div style={{ display: "flex", color: C.white }}>{host}</div>
      </div>
    </Frame>
  );
}

const STAGES = ["Clarify", "Structure", "Analysis", "Brainstorm", "Recommend"];

/** The site's default preview: name, tagline and a drawn stage bar. */
export function BrandImage(): ReactElement {
  const active = 2;
  return (
    <Frame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={48} fontSize={30} />
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, color: C.muted, textTransform: "uppercase" }}>Case interview practice</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontSize: 150, lineHeight: 1, color: C.white, letterSpacing: -7 }}>{siteConfig.brandName}</div>
        <div style={{ display: "flex", marginTop: 26, maxWidth: 940, fontSize: 40, lineHeight: 1.25, color: C.muted, letterSpacing: -0.5 }}>
          {siteConfig.tagline}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 999,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${C.line}`,
          alignSelf: "flex-start",
        }}
      >
        {STAGES.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 24px",
                borderRadius: 999,
                fontSize: 24,
                background: current ? C.lime : done ? "rgba(255,255,255,0.10)" : "transparent",
                color: current ? C.limeInk : done ? C.white : C.muted,
                border: current ? `1px solid ${C.lime}` : `1px solid ${done ? "rgba(255,255,255,0.10)" : C.line}`,
              }}
            >
              {done ? (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M5 12.5 10 17.5 19 7.5" stroke={C.lime} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {stage}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
