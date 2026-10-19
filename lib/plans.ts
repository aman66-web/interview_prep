import { siteConfig } from "@/site.config";

// What each plan includes, shown on the pricing page and the home page teaser.
// Display only: what a person can actually do is decided on the server (lib/access.ts).

export type PlanId = "free" | "monthly" | "pass90";

export type PlanCard = {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

const { prices, limits } = siteConfig;

export const PLANS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Try a full interview and see your debrief before you spend anything.",
    features: [
      "One full AI mock case with a scored debrief",
      `${limits.free.drillsPerDay} drills a day`,
      "Read every case prompt",
      "Every guide and free tool",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: `$${prices.monthly}`,
    cadence: "a month",
    blurb: "For steady practice through a recruiting season.",
    features: [
      "Every case and unlimited drills",
      `Up to ${limits.paid.aiCasesPerDay} AI interviews a day (${limits.paid.aiCasesPerMonth} a month)`,
      "Progress tracking and model answers",
      "Renews each month. Cancel anytime",
    ],
    highlight: true,
  },
  {
    id: "pass90",
    name: "90-Day Pass",
    price: `$${prices.pass90}`,
    cadence: "one time",
    blurb: "One payment for a full prep sprint. Never renews.",
    features: [
      "Everything in Monthly for 90 days",
      "Never renews automatically",
      "Buy again to add another 90 days",
    ],
  },
];
