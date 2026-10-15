// Number parsing and formatting shared by the free tools (/tools). Pure functions,
// safe in the browser. Nothing here ever returns "NaN" or "Infinity" for display:
// a number that cannot be shown becomes an en dash.

export const NOT_A_NUMBER = "–";

export type Parsed = { kind: "empty" } | { kind: "invalid" } | { kind: "number"; value: number };

const SUFFIXES: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  mn: 1e6,
  mil: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  tn: 1e12,
  trillion: 1e12,
};

/**
 * Reads what someone typed into a number field. Accepts thousands separators,
 * spaces, a currency sign, a trailing % and short forms such as 4.8bn, 250k or
 * 3 million. A leading minus (hyphen or the typographic minus) makes it negative.
 */
export function parseNumberInput(raw: string): Parsed {
  if (raw.trim() === "") return { kind: "empty" };
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/[−–]/g, "-")
    .replace(/[\s  ,_]/g, "")
    .replace(/[$£€]/g, "")
    .replace(/%$/, "");
  const match = /^(-?)(\d+\.?\d*|\.\d+)([a-z]*)$/.exec(text);
  if (!match) return { kind: "invalid" };
  const [, sign, digits, suffix] = match;
  let multiplier = 1;
  if (suffix) {
    if (!(suffix in SUFFIXES)) return { kind: "invalid" };
    multiplier = SUFFIXES[suffix];
  }
  const value = Number(digits) * multiplier * (sign ? -1 : 1);
  if (!Number.isFinite(value)) return { kind: "invalid" };
  return { kind: "number", value: value === 0 ? 0 : value };
}

/** The number, or null when the field is empty or not a number. */
export function numberOrNull(raw: string): number | null {
  const parsed = parseNumberInput(raw);
  return parsed.kind === "number" ? parsed.value : null;
}

/** Removes floating-point dust such as 0.30000000000000004 before rounding for display. */
export function tidy(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}

/** 1,234,567.89 with up to `maxDigits` decimals; an en dash if the number can't be shown. */
export function formatNumber(n: number, maxDigits = 2, minDigits = 0): string {
  if (!Number.isFinite(n)) return NOT_A_NUMBER;
  const out = tidy(n).toLocaleString("en-US", { maximumFractionDigits: maxDigits, minimumFractionDigits: minDigits });
  return out === "-0" ? "0" : out;
}

/** Short form for big numbers: 4.2 million, 60 million, 1.25 billion. Below a million, the full number. */
export function formatCompact(n: number, significant = 3): string {
  if (!Number.isFinite(n)) return NOT_A_NUMBER;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const scales: [number, string][] = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
  ];
  for (const [size, word] of scales) {
    // Round first, so 999,999,999 shows as "1 billion" rather than "1,000 million".
    const rounded = Number((abs / size).toPrecision(significant));
    if (rounded >= 1) {
      if (rounded >= 1000 && word !== "trillion") continue;
      return `${sign}${formatNumber(rounded, 2)} ${word}`;
    }
  }
  return `${sign}${formatNumber(abs, abs < 10 ? 2 : abs < 1000 ? 1 : 0)}`;
}

/** $1,234.50 style. Whole amounts lose the pennies; negative amounts read -$1,200. */
export function formatMoney(n: number, symbol = "$", maxDigits = 2): string {
  if (!Number.isFinite(n)) return NOT_A_NUMBER;
  const abs = Math.abs(tidy(n));
  const whole = Number.isInteger(abs);
  const digits = whole ? 0 : maxDigits;
  const body = abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${n < 0 && abs !== 0 ? "-" : ""}${symbol}${body}`;
}

/** $4.2 million style for big amounts; whole units from 1,000 up ($141,176), pennies below. */
export function formatMoneyCompact(n: number, symbol = "$"): string {
  if (!Number.isFinite(n)) return NOT_A_NUMBER;
  if (Math.abs(n) < 1000) return formatMoney(n, symbol);
  if (Math.abs(n) < 1e6) return formatMoney(Math.round(n), symbol);
  const compact = formatCompact(Math.abs(n));
  return `${n < 0 ? "-" : ""}${symbol}${compact}`;
}

/** A percentage given in percent units: formatPercent(11.84) is "11.8%". */
export function formatPercent(pct: number, maxDigits = 1): string {
  if (!Number.isFinite(pct)) return NOT_A_NUMBER;
  return `${formatNumber(pct, maxDigits)}%`;
}

/** 2.4 years as "2 years 5 months"; under a month as "less than a month". */
export function formatYearsMonths(years: number): string {
  if (!Number.isFinite(years) || years < 0) return NOT_A_NUMBER;
  const totalMonths = Math.round(years * 12);
  if (totalMonths === 0) return "less than a month";
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? "month" : "months"}`);
  return parts.join(" ");
}
