import { z } from "zod";
import { emailSchema } from "@/lib/auth/schemas";
import { GROUP_SIZES, LEAD_FIELDS, LEAD_LIMITS, type GroupSize, type LeadField } from "./fields";

// Validation for the university and club enquiry form (/for-universities). The limits
// match the checks on the `leads` table (see fields.ts).
// Rule 2.7: only what we need to reply. No names, phone numbers or job titles.

export { GROUP_SIZES, LEAD_FIELDS, LEAD_LIMITS, type GroupSize, type LeadField };

/** Removes characters a database text column refuses (NUL) and other invisible control characters, keeping new lines and tabs. */
export function stripControl(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

const text = z.string().transform(stripControl);

export const leadSchema = z.object({
  org: text.pipe(
    z
      .string()
      .trim()
      .min(1, "Enter the name of your university, club or careers service.")
      .max(LEAD_LIMITS.org, `Keep the name under ${LEAD_LIMITS.org} characters.`),
  ),
  email: text.pipe(z.string().trim().min(1, "Enter your work email address.").pipe(emailSchema)),
  size: z
    .union([z.enum(GROUP_SIZES), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  message: text
    .pipe(z.string().trim().max(LEAD_LIMITS.message, `Keep the message under ${LEAD_LIMITS.message.toLocaleString("en-US")} characters.`))
    .optional()
    .transform((v) => (v ? v : null)),
});

export type Lead = { org: string; email: string; size: GroupSize | null; message: string | null };

export type LeadParse = { ok: true; lead: Lead } | { ok: false; fields: Partial<Record<LeadField, string>> };

const FALLBACK: Record<LeadField, string> = {
  org: "Enter the name of your university, club or careers service.",
  email: "Enter a valid email address, like name@university.ac.uk.",
  size: "Choose a group size from the list, or leave it blank.",
  message: `Keep the message under ${LEAD_LIMITS.message.toLocaleString("en-US")} characters.`,
};

/** Validates the raw fields. Values that are not strings (a file upload, say) count as wrong. */
export function parseLead(raw: Record<string, unknown>): LeadParse {
  const input = {
    org: typeof raw.org === "string" ? raw.org : "",
    email: typeof raw.email === "string" ? raw.email : "",
    size: raw.size === undefined || raw.size === null ? undefined : raw.size,
    message: raw.message === undefined || raw.message === null ? undefined : raw.message,
  };
  const result = leadSchema.safeParse(input);
  if (result.success) return { ok: true, lead: result.data };
  const fields: Partial<Record<LeadField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === "org" || field === "email" || field === "size" || field === "message") {
      if (fields[field]) continue;
      // Our own messages are kept; zod's built-in ones (wrong type, bad email) get a friendly fallback.
      fields[field] = /^(Enter|Keep|Choose)/.test(issue.message) ? issue.message : FALLBACK[field];
    }
  }
  return { ok: false, fields };
}

/** True when the hidden honeypot field has anything in it. */
export function isHoneypotFilled(raw: Record<string, unknown>): boolean {
  const value = raw[LEAD_FIELDS.honeypot];
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}
