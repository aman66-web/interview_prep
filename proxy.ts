import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 calls this file "proxy" (it used to be called "middleware").
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the pages that need a login session. Public marketing pages skip it,
// so they stay fast and cacheable.
export const config = {
  matcher: ["/app/:path*", "/login", "/auth/:path*"],
};
