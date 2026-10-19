import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The logged-in user, or null. Asks Supabase to validate the login every time
 * (unlike reading the cookie), so it is safe to base access decisions on.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Use at the top of every page, action and route that needs a login. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
