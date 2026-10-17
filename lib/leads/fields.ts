// The enquiry form's fields and limits, with no validation library, so the browser form
// can use them without loading zod. The limits match the checks on the `leads` table
// (supabase/migrations/20261014140000_initial_schema.sql).

export const LEAD_LIMITS = { org: 200, email: 320, message: 5000 } as const;

export const GROUP_SIZES = ["Fewer than 10", "10 to 25", "26 to 50", "51 to 100", "More than 100", "Not sure yet"] as const;
export type GroupSize = (typeof GROUP_SIZES)[number];

/** The form's field names. `website` is the honeypot: hidden from people, filled in by bots. */
export const LEAD_FIELDS = { org: "org", email: "email", size: "size", message: "message", honeypot: "website" } as const;

export type LeadField = "org" | "email" | "size" | "message";
