import type { NextRequest } from "next/server";
import { handleLeadPost } from "@/lib/leads/handler";
import { createRateLimiter } from "@/lib/leads/rate-limit";
import { createLeadStore } from "@/lib/leads/store-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// Saves a university, club or careers-service enquiry (/for-universities).
// The checks live in lib/leads/handler.ts; this file only wires in the database.
// Browsers cannot write to the leads table themselves, so the admin client is used,
// and only for this one insert. No login is needed: anyone may send an enquiry.

// At most 5 enquiries per address per 10 minutes, per server instance (see rate-limit.ts).
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(request: NextRequest) {
  return handleLeadPost(request, {
    save: (lead) => createLeadStore(createAdminClient()).save(lead),
    limiter,
  });
}
