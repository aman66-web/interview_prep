import { NextResponse, type NextRequest } from "next/server";
import { hasLoginCookie } from "@/lib/auth/login-cookie";

// Answers one yes or no: does this browser carry a login cookie? The site header asks
// after the page loads, so every page can stay static and cacheable. It reads cookie
// names only: no database call, nothing stored, nothing about who the person is.

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const signedIn = hasLoginCookie(request.cookies.getAll().map((c) => c.name));
  return NextResponse.json({ signedIn }, { headers: { "Cache-Control": "private, no-store" } });
}
