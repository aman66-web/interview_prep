// Number parsing and formatting shared by the free tools (/tools). Pure functions,
// safe in the browser. Nothing here ever returns "NaN" or "Infinity" for display:
// a number that cannot be shown becomes an en dash.

export const NOT_A_NUMBER = "–";

/**
 * What a typed number reads as. An invalid entry says why: "comma" when a comma is used
 * other than to separate thousands (4,5 or 12,5%), so the field can ask for a decimal point
 * instead of guessing; "format" for anything else that isn't a number.
 */
export type Parsed = { kind: "empty" } | { kind: "invalid"; reason: "format" | "comma" } | { kind: "number"; value: number };

/** What to show under a field when someone uses a comma as a decimal point. */
export const COMMA_DECIMAL_MESSAGE = "Use a point for decimals, like 4.5. A comma can only separate thousands, like 1,200.";

/** The message for a field that couldn't be read: the comma advice, or the field's own example. */
export function invalidNumberMessage(parsed: Extract<Parsed, { kind: "invalid" }>, example: string): string {
  return parsed.reason === "comma" ? COMMA_DECIMAL_MESSAGE : example;
}

// A Map, so only these words count: a typed "constructor" is not a suffix.
const SUFFIXES = new Map<string, number>([
  ["k", 1e3],
  ["thousand", 1e3],
  ["m", 1e6],
  ["mn", 1e6],
  ["mil", 1e6],
  ["million", 1e6],
  ["b", 1e9],
  ["bn", 1e9],
  ["billion", 1e9],
  ["t", 1e12],
  ["tn", 1e12],
  ["trillion", 1e12],
]);

const invalid = (reason: "format" | "comma"): Parsed => ({ kind: "invalid", reason });

/**
 * Reads what someone typed into a number field. Accepts spaces, a currency sign, a
 * trailing % and short forms such as 4.8bn, 250k or 3 million. A leading minus (hyphen
 * or the typographic minus) makes it negative. A comma counts only as a thousands
 * separator (1,200 or 1,234.5); a decimal comma such as 4,5 is refused, never read as 45.
 */
export function parseNumberInput(raw: string): Parsed {
  if (raw.trim() === "") return { kind: "empty" };
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/[−–]/g, "-")
    .replace(/[\s\u00a0\u202f_]/g, "")
    .replace(/[$£€]/g, "")
    .replace(/%$/, "");
  const match = /^(-?)([\d,]*\.?\d*)([a-z]*)$/.exec(text);
  if (!match) return invalid(text.includes(",") ? "comma" : "format");
  const [, sign, written, suffix] = match;
  let digits = written;
  if (digits.includes(",")) {
    // Thousands groups only: 1-3 digits, then groups of exactly 3, then an optional decimal part.
    if (!/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(digits)) return invalid("comma");
    digits = digits.replace(/,/g, "");
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(digits)) return invalid("format");
  let multiplier = 1;
  if (suffix) {
    const scale = SUFFIXES.get(suffix);
    if (scale === undefined) return invalid("format");
    multiplier = scale;
  }
  const value = Number(digits) * multiplier * (sign ? -1 : 1);
  if (!Number.isFinite(value)) return invalid("format");
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
