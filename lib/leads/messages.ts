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

export function leadErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return (LEAD_ERROR_MESSAGES as Record<string, string>)[code] ?? LEAD_ERROR_MESSAGES.unsupported;
}

/** Field names from the ?fields= list of a form post that failed, known names only. */
export function fieldsFromQuery(value: string | undefined): LeadField[] {
  if (!value) return [];
  const known: LeadField[] = ["org", "email", "size", "message"];
  return value.split(",").filter((f): f is LeadField => (known as string[]).includes(f));
}
