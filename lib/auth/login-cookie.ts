// Whether a request carries a Supabase login cookie. Used only to decide what the header
// button says ("Dashboard" instead of "Log in"). It is not a login check: pages that need
// a login still call requireUser() themselves, and an expired cookie just sends the
// visitor to /login from /app.

const LOGIN_COOKIE = /^sb-[a-z0-9]+-auth-token(\.\d+)?$/i;

export function hasLoginCookie(names: readonly string[]): boolean {
  return names.some((name) => LOGIN_COOKIE.test(name));
}
