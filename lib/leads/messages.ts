import type { LeadErrorCode } from "./handler";
import type { LeadField } from "./fields";

// What the enquiry form says after a submission. Safe in the browser (no server code).

export const LEAD_ERROR_MESSAGES: Record<LeadErrorCode, string> = {
  invalid: "Please check the form: we need the name of your organisation and a valid work email address.",
  busy: "We've had several enquiries from your connection in the last few minutes. Please wait a little and try again.",
  server: "Sorry, we couldn't send your enquiry just now. Please try again in a few minutes.",
  "too-large": "That message is too long. Please shorten it and try again.",
  unsupported: "Sorry, that didn't work. Please try again.",
  forbidden: "Sorry, that didn't work. Please reload the page and try again.",
};

export const LEAD_FIELD_HINTS: Record<LeadField, string> = {
  org: "Enter the name of your university, club or careers service.",
  email: "Enter a valid email address, like name@university.ac.uk.",
  size: "Choose a group size from the list, or leave it blank.",
  message: "Keep the message under 5,000 characters.",
};

/**
 * The message for an error code we know, or undefined. Only the map's own keys count, so a
 * crafted ?error=__proto__ or ?error=toString can't pull in an inherited object or function.
 */
export function knownLeadErrorMessage(code: string | undefined): string | undefined {
  return code && Object.hasOwn(LEAD_ERROR_MESSAGES, code) ? LEAD_ERROR_MESSAGES[code as LeadErrorCode] : undefined;
}

/** A query value as a page receives it: a repeated parameter (?a=1&a=2) arrives as a list. */
export type QueryValue = string | string[] | undefined;

/** The first value of a query parameter, so a repeated one can't crash the page. */
export function firstQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The message for ?error= on the page: null when there is none, a general one for a code we don't know. */
export function leadErrorMessage(value: QueryValue): string | null {
  const code = firstQueryValue(value);
  if (!code) return null;
  return knownLeadErrorMessage(code) ?? LEAD_ERROR_MESSAGES.unsupported;
}

/** Field names from the ?fields= list of a form post that failed, known names only, each once. */
export function fieldsFromQuery(value: QueryValue): LeadField[] {
  const text = Array.isArray(value) ? value.join(",") : value;
  if (!text) return [];
  const known: LeadField[] = ["org", "email", "size", "message"];
  return [...new Set(text.split(","))].filter((f): f is LeadField => (known as string[]).includes(f));
}
