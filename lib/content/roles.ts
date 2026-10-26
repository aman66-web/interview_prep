import { visibleCases } from "./cases";
import { practiceCases, practiceFirms, type PracticeFirm } from "./practice";
import type { Case, CaseType, Track } from "./schema";
import type { Firm } from "./writing-schema";

// Roles: "what are you applying for?" in the signed-in library. A role is OUR OWN grouping of
// practice cases by the kind of work they practise, so people can browse by role (rule 2.2: we
// make no claim here about which jobs any firm offers or how it hires). A case belongs to a role
// when it is on the role's track and its type is one of the role's `types` or its slug is one of
// the role's `slugs`. New cases join a role by type; tests/library-roles.test.ts fails if a
// visible case ends up in no role, so a new case is never left out of the library.

export type Role = {
  slug: string;
  label: string;
  track: Track;
  /** One line on the role's card: what its cases practise. */
  blurb: string;
  types?: CaseType[];
  slugs?: string[];
};

export const ROLES: Role[] = [
  {
    slug: "strategy-consulting",
    label: "Strategy consulting",
    track: "consulting",
    blurb: "Where should the client play, and how big is the prize? Market entry, growth, pricing and market sizing.",
    types: ["market_entry", "growth", "pricing", "market_sizing"],
  },
  {
    slug: "operations-and-performance",
    label: "Operations and performance",
    track: "consulting",
    blurb: "Why did profit fall, and how do we fix it? Profitability, costs and day-to-day operations.",
    types: ["profitability", "operations"],
  },
  {
    slug: "deals-and-due-diligence",
    label: "Deals and due diligence",
    track: "consulting",
    blurb: "Should the client buy, and at what price? Acquisitions, deal logic and the numbers behind them.",
    types: ["m_and_a"],
  },
  {
    slug: "investment-banking",
    label: "Investment banking",
    track: "banking",
    blurb: "Mergers, sales and stock market listings: weighing up a deal and advising on it.",
    types: ["m_and_a"],
  },
  {
    slug: "corporate-banking",
    label: "Corporate and commercial banking",
    track: "banking",
    blurb: "Lending and risk for business clients: loans, currency exposure and cash.",
    slugs: ["quillmere-packaging-term-loan", "calder-instruments-currency-risk"],
  },
  {
    slug: "retail-banking",
    label: "Retail banking",
    track: "banking",
    blurb: "Everyday customers: savings products, branches and what makes them profitable.",
    types: ["market_entry", "profitability"],
  },
];

export const TRACK_LABELS: Record<Track, string> = { consulting: "Consulting roles", banking: "Banking roles" };

export function findRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}

export function rolesForTrack(track: Track): Role[] {
  return ROLES.filter((r) => r.track === track);
}

/** The track a firm's roles come from: banks use banking roles, consulting firms consulting roles. */
export function trackOfFirm(firm: Pick<Firm, "sector">): Track {
  return firm.sector === "banking" ? "banking" : "consulting";
}

export function inRole(role: Role, c: Pick<Case, "track" | "type" | "slug">): boolean {
  if (c.track !== role.track) return false;
  return (role.types?.includes(c.type) ?? false) || (role.slugs?.includes(c.slug) ?? false);
}

/** Every case this visitor may see in the role. */
export function roleCases(role: Role): Case[] {
  return visibleCases().filter((c) => inRole(role, c));
}

/** The firm's practice cases that belong to the role, in the firm's own order. */
export function firmRoleCases(firm: Firm, role: Role): Case[] {
  return practiceCases(firm).filter((c) => inRole(role, c));
}

/** The roles that have at least one of the firm's practice cases, with those cases. */
export function rolesForFirm(firm: Firm): { role: Role; cases: Case[] }[] {
  return rolesForTrack(trackOfFirm(firm))
    .map((role) => ({ role, cases: firmRoleCases(firm, role) }))
    .filter((r) => r.cases.length > 0);
}

/** The firms whose practice pages include this case. */
export function firmsUsingCase(slug: string): PracticeFirm[] {
  return practiceFirms().filter((f) => practiceCases(f).some((c) => c.slug === slug));
}

/** "30 min" when every case is the same length, otherwise "25–35 min". */
export function minutesRange(cases: Pick<Case, "est_minutes">[]): string {
  const minutes = cases.map((c) => c.est_minutes);
  const lo = Math.min(...minutes);
  const hi = Math.max(...minutes);
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
}
