import { hasAccess } from "@/lib/access";
import { getEntitlement } from "@/lib/auth/entitlement";
import { createClient } from "@/lib/supabase/server";

/** Whether the signed-in user's plan opens every case (so the library shows no lock). Read as the user (Row Level Security). */
export async function libraryAllCases(): Promise<boolean> {
  const supabase = await createClient();
  return hasAccess(await getEntitlement(supabase), "all_cases");
}
