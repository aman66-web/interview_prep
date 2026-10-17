import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entitlement } from "@/lib/access";

/** The signed-in user's plan. Read as the user, so Row Level Security applies. */
export async function getEntitlement(supabase: SupabaseClient): Promise<Entitlement> {
  const { data, error } = await supabase.from("entitlements").select("plan, status, expires_at").maybeSingle();
  if (error) throw new Error(`Could not read the plan: ${error.message}`);
  return (data as Entitlement) ?? null;
}
