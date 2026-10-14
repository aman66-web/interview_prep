// Everything brand- or business-specific lives here, so it can change
// without touching the rest of the app (kit section 4).
// Prices here are for display only; the real prices come from Stripe.

export const siteConfig = {
  brandName: "TODO Brand",
  tagline:
    "Practise consulting case interviews with an AI interviewer that scores you.",
  // Set NEXT_PUBLIC_SUPPORT_EMAIL; an empty value hides the email address.
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",

  prices: {
    currency: "USD",
    monthly: 39,
    pass90: 99,
  },

  limits: {
    free: {
      aiCasesTotal: 1,
      drillsPerDay: 20,
    },
    paid: {
      aiCasesPerDay: 3,
      aiCasesPerMonth: 60,
    },
    candidateTurnsPerSession: 40,
  },

  // Refund applies only if the user has used this many AI sessions or fewer.
  refundWindowDays: 7,
  refundMaxAiSessions: 2,

  transcriptRetentionDays: 365,

  // Phase 2 adds "data".
  tracksEnabled: ["consulting"],

  // Rule 2.3: shown in the footer, on every firm page and on the pricing page.
  disclaimer:
    "Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site.",

  // The founder turns this on after talking to an accountant.
  stripeTaxEnabled: false,
} as const;

export type SiteConfig = typeof siteConfig;
