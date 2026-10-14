import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getSecretEnv } from "@/lib/env";

/**
 * Supabase client that uses the SECRET key and ignores Row Level Security.
 * Server only (rule 2.5): use it for the things a browser must never do, such
 * as deleting an account or reading answer keys for a finished debrief.
 * Always check who the caller is before using it, and only touch their rows.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("The admin client must never run in the browser.");
  }
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SECRET_KEY } = getSecretEnv();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
