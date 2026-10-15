import { FUNNEL_EVENTS, type FunnelEvent } from "./events";

// Pure sums for the /admin page: the rows come in, the numbers go out. Nothing here
// touches the database, so every figure on the page can be tested.
//
// Windows are whole UTC days: "the last 7 days" means today plus the 6 days before it.
// Funnel steps count people (distinct accounts), with the number of events alongside.
// Visits are not tracked (no cookies, rule 2.7), so the funnel starts at signup.

const DAY_MS = 86_400_000;

export type EventFact = {
  name: string;
  user_id: string | null;
  path: string | null;
  utm_source: string | null;
  created_at: string;
};
export type UsageFact = {
  created_at: string;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_estimate_usd: number | string | null;
};
export type CompletedFact = { completed_at: string | null };
export type LeadFact = { created_at: string };

export type DashboardInput = {
  events: EventFact[];
  usage: UsageFact[];
  completed: CompletedFact[];
  leads: LeadFact[];
};

export const FUNNEL_LABELS: Record<FunnelEvent, string> = {
  signup: "Signed up",
  case_started: "Started a case",
  case_completed: "Finished a case",
  paywall_viewed: "Saw the paywall",
  checkout_started: "Started checkout",
  purchase: "Paid",
};

export type FunnelStep = {
  key: FunnelEvent;
  label: string;
  people: number;
  events: number;
  /** people at this step / people at the step before (null for the first step, or when the step before is 0). */
  fromPrevious: number | null;
};

export type DayPoint = { date: string; costUsd: number; tokens: number; calls: number };

export type WindowStats = {
  days: number;
  /** First moment counted (start of the first UTC day), ISO. */
  since: string;
  funnel: FunnelStep[];
  signups: number;
  payingPeople: number;
  /** Paying people / signups in the same window. */
  signupToPaid: number | null;
  purchasesByPlan: { monthly: number; pass90: number; other: number };
  signupsBySource: { source: string; people: number }[];
  ai: {
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    calls: number;
    perDay: DayPoint[];
    finishedInterviews: number;
    /** All AI cost in the window / interviews finished in the window. */
    costPerFinished: number | null;
  };
  leads: number;
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function utcDay(iso: string | Date): string {
  return (typeof iso === "string" ? new Date(iso) : iso).toISOString().slice(0, 10);
}

/** Start of the window: midnight UTC, (days - 1) days before today. */
export function windowStart(now: Date, days: number): Date {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(today - (Math.max(1, Math.floor(days)) - 1) * DAY_MS);
}

function inWindow(iso: string | null | undefined, since: number, until: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= since && t <= until;
}

function distinctPeople(rows: EventFact[]): number {
  const ids = new Set<string>();
  rows.forEach((r, i) => ids.add(r.user_id ?? `no-account-${i}`));
  return ids.size;
}

function planOf(path: string | null): "monthly" | "pass90" | "other" {
  const m = /[?&]plan=(monthly|pass90)\b/.exec(path ?? "");
  return (m?.[1] as "monthly" | "pass90" | undefined) ?? "other";
}

export function summariseWindow(input: DashboardInput, days: number, now: Date = new Date()): WindowStats {
  const start = windowStart(now, days);
  const since = start.getTime();
  const until = now.getTime();

  const events = input.events.filter((e) => inWindow(e.created_at, since, until));
  const byName = new Map<string, EventFact[]>();
  for (const e of events) {
    const list = byName.get(e.name);
    if (list) list.push(e);
    else byName.set(e.name, [e]);
  }

  let previous: number | null = null;
  const funnel: FunnelStep[] = FUNNEL_EVENTS.map((key) => {
    const rows = byName.get(key) ?? [];
    const people = distinctPeople(rows);
    const fromPrevious: number | null = previous === null || previous === 0 ? null : people / previous;
    previous = people;
    return { key, label: FUNNEL_LABELS[key], people, events: rows.length, fromPrevious };
  });

  const signups = funnel[0].people;
  const payingPeople = funnel[funnel.length - 1].people;

  const purchasesByPlan = { monthly: 0, pass90: 0, other: 0 };
  for (const p of byName.get("purchase") ?? []) purchasesByPlan[planOf(p.path)] += 1;

  const sources = new Map<string, Set<string>>();
  (byName.get("signup") ?? []).forEach((e, i) => {
    const key = e.utm_source?.trim() || "(no campaign tag)";
    const set = sources.get(key) ?? new Set<string>();
    set.add(e.user_id ?? `no-account-${i}`);
    sources.set(key, set);
  });
  const signupsBySource = [...sources.entries()]
    .map(([source, set]) => ({ source, people: set.size }))
    .sort((a, b) => b.people - a.people || a.source.localeCompare(b.source))
    .slice(0, 8);

  // AI usage, with one bar per UTC day (empty days included, so gaps show).
  const perDayMap = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const date = utcDay(new Date(since + i * DAY_MS));
    perDayMap.set(date, { date, costUsd: 0, tokens: 0, calls: 0 });
  }
  let costUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let calls = 0;
  for (const u of input.usage) {
    if (!inWindow(u.created_at, since, until)) continue;
    const cost = num(u.cost_estimate_usd);
    const inTok = num(u.input_tokens);
    const outTok = num(u.output_tokens);
    costUsd += cost;
    inputTokens += inTok;
    outputTokens += outTok;
    calls += 1;
    const day = perDayMap.get(utcDay(u.created_at));
    if (day) {
      day.costUsd += cost;
      day.tokens += inTok + outTok;
      day.calls += 1;
    }
  }
  const finishedInterviews = input.completed.filter((c) => inWindow(c.completed_at, since, until)).length;

  return {
    days,
    since: start.toISOString(),
    funnel,
    signups,
    payingPeople,
    signupToPaid: signups > 0 ? payingPeople / signups : null,
    purchasesByPlan,
    signupsBySource,
    ai: {
      costUsd,
      inputTokens,
      outputTokens,
      calls,
      perDay: [...perDayMap.values()],
      finishedInterviews,
      costPerFinished: finishedInterviews > 0 ? costUsd / finishedInterviews : null,
    },
    leads: input.leads.filter((l) => inWindow(l.created_at, since, until)).length,
  };
}

// ---------------------------------------------------------------------------
// The founder's 30-day bar (SPEC section 12). These are targets, not results.
// ---------------------------------------------------------------------------

export const DECISION_TARGETS = {
  go: { signups: 300, paying: 15, payingShare: 0.03 },
  adjust: { signupsFrom: 100, signupsTo: 299, payingFrom: 5, payingTo: 14 },
  stop: { signupsUnder: 100, payingUnder: 5 },
} as const;

export type DecisionBand = "go" | "adjust" | "stop";

/**
 * Where a pair of numbers sits against the bar:
 *  Go     300+ signups and (15+ paying, or 3%+ of signups paying)
 *  Stop   under 100 signups and under 5 paying
 *  Adjust 100-299 signups or 5-14 paying
 * The bands in the spec leave a gap (for example 300+ signups with under 5 paying);
 * that gap is shown as Adjust with `exact: false`, so the page can say so.
 */
export function decisionReading(signups: number, paying: number): { band: DecisionBand; exact: boolean; payingShare: number | null } {
  const t = DECISION_TARGETS;
  const payingShare = signups > 0 ? paying / signups : null;
  if (signups >= t.go.signups && (paying >= t.go.paying || (payingShare ?? 0) >= t.go.payingShare)) {
    return { band: "go", exact: true, payingShare };
  }
  if (signups < t.stop.signupsUnder && paying < t.stop.payingUnder) return { band: "stop", exact: true, payingShare };
  const inAdjust =
    (signups >= t.adjust.signupsFrom && signups <= t.adjust.signupsTo) || (paying >= t.adjust.payingFrom && paying <= t.adjust.payingTo);
  return { band: "adjust", exact: inAdjust, payingShare };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Dollars: cents for amounts of a dollar or more, otherwise enough digits to see small costs. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0.00";
  if (Math.abs(value) >= 1) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (Math.abs(value) < 0.0001) return "<$0.0001";
  return `$${value.toFixed(4).replace(/0{1,2}$/, "")}`;
}

/** 950, 12.4K, 3.1M. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs < 1_000) return String(Math.round(value));
  if (abs < 1_000_000) return `${(value / 1_000).toFixed(abs < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(value / 1_000_000).toFixed(abs < 10_000_000 ? 1 : 0).replace(/\.0$/, "")}M`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "–";
  const pct = value * 100;
  return `${pct >= 10 || pct === 0 ? Math.round(pct) : pct.toFixed(1).replace(/\.0$/, "")}%`;
}
