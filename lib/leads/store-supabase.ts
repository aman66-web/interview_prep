import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "./schema";

// Saves an enquiry to the `leads` table. The route handler passes in the admin
// client (browsers can't write to `leads`; see supabase/tests/rls.sql).

export class LeadStoreError extends Error {
  constructor(readonly code: string | undefined) {
    super("The enquiry could not be saved.");
    this.name = "LeadStoreError";
  }
}

export function createLeadStore(client: Pick<SupabaseClient, "from">) {
  return {
    async save(lead: Lead): Promise<void> {
      const { error } = await client.from("leads").insert({ org: lead.org, email: lead.email, size: lead.size, message: lead.message });
      if (error) throw new LeadStoreError(error.code);
    },
  };
}
