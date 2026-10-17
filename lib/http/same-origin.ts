/**
 * True when a browser request came from this same website. Every state-changing
 * API request is checked with this, so another site cannot make a logged-in
 * user's browser send requests to us (cross-site request forgery).
 * Browsers always send an Origin header on a POST; a missing one is refused.
 */
export function isSameOrigin(headers: { get(name: string): string | null }): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
