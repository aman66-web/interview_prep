// Campaign tags (utm_source and friends) from a visitor's first page in this tab.
// SPEC section 10: held in this tab's session storage (no cookies) and attached to the signup
// event. This file is pure and safe in the browser: the capture component, the
// hidden form fields and the server all use the same cleaning rules.

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

/** The session-storage key (read and written only through lib/client/use-session-storage.ts). */
export const UTM_STORAGE_KEY = "casespar:first-utm";

const MAX_LENGTH = 100;

/**
 * A tag value we are willing to keep: a short string with no control characters.
 * Anything that looks like an email address is dropped, so a badly built campaign
 * link can never put personal data into the events table (rule 2.7).
 */
export function cleanUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LENGTH)
    .trim();
  if (cleaned === "" || cleaned.includes("@")) return null;
  return cleaned;
}

function fromGetter(get: (key: UtmKey) => unknown): Utm | null {
  const out: Utm = {};
  for (const key of UTM_KEYS) {
    const value = cleanUtmValue(get(key));
    if (value) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

type ParamsLike = URLSearchParams | Record<string, string | string[] | undefined>;

/** Tags from a URL's query string (or Next.js searchParams). */
export function utmFromSearchParams(params: ParamsLike | null | undefined): Utm | null {
  if (!params) return null;
  if (params instanceof URLSearchParams) return fromGetter((k) => params.get(k));
  return fromGetter((k) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  });
}

/** Tags posted by <UtmFields /> inside a form. */
export function utmFromFormData(form: FormData | null | undefined): Utm | null {
  if (!form) return null;
  return fromGetter((k) => form.get(k));
}

/** What the capture component saved (JSON), cleaned again because storage can be edited. */
export function parseStoredUtm(text: string | null | undefined): Utm | null {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    return fromGetter((k) => record[k]);
  } catch {
    return null;
  }
}

/** Adds the tags to a URL's query string (to carry them through a sign-in link). */
export function appendUtm(params: URLSearchParams, utm: Utm | null | undefined): URLSearchParams {
  if (!utm) return params;
  for (const key of UTM_KEYS) {
    const value = cleanUtmValue(utm[key]);
    if (value) params.set(key, value);
  }
  return params;
}
