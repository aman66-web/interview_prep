// Everything brand- or business-specific lives here, so it can change
// without touching the rest of the app (kit section 4).
// Prices here are for display only; the real prices come from Stripe.

export const siteConfig = {
  brandName: "CaseSpar",
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
    // Visitors without an account may try this many drills per browser tab
    // before being asked to sign up (a nudge, not a security limit: drills cost us nothing to serve).
    anonymous: {
      drillsPerSession: 5,
    },
    candidateTurnsPerSession: 40,
  },

  // No refunds (founder, 15 Oct 2026): all sales are final, except where the law
  // requires a refund. The first full interview is free, so people can try before paying.
  refunds: "final-sale",

  transcriptRetentionDays: 365,

  // University and club enquiries (the /for-universities form) are deleted after this many days (about 24 months).
  leadRetentionDays: 730,

  // The company that runs the site (founder, 15 Oct 2026). UK company websites must show
  // these; the footer, terms and privacy policy read them from here.
  operator: {
    legalName: "MARTZEY LTD",
    companyNumber: "14466643",
    registeredIn: "England and Wales",
    registeredOffice: "86-90 Paul Street, London, England, EC2A 4NE",
  },

  // Users must be at least this old (founder, 15 Oct 2026); used in the terms and privacy policy.
  minimumAge: 18,

  // "banking": bank-style case studies (founder, 16 Oct 2026). Phase 2 adds "data".
  tracksEnabled: ["consulting", "banking"],

  // Rule 2.3: shown in the footer, on every firm page and on the pricing page.
  disclaimer:
    "Not affiliated with or endorsed by McKinsey & Company, Boston Consulting Group, Bain & Company or any other firm named on this site.",

  // The founder turns this on after talking to an accountant.
  stripeTaxEnabled: false,
} as const;

export type SiteConfig = typeof siteConfig;
