// "Continue with Google" and "Continue with Apple" (founder's request, 18 Oct 2026).
// Supabase does the sign-in (Authentication, Providers); this file only says which of the
// two buttons to show. A button is shown only once its provider is set up in Supabase,
// so nobody is offered a button that fails. NEXT_PUBLIC_SIGNIN_PROVIDERS lists them, for
// example "google,apple". It holds no secret.

export const OAUTH_PROVIDERS = ["google", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<OAuthProvider, string> = { google: "Google", apple: "Apple" };

export function parseProvider(value: unknown): OAuthProvider | null {
  return typeof value === "string" && (OAUTH_PROVIDERS as readonly string[]).includes(value) ? (value as OAuthProvider) : null;
}

/** The providers switched on in the settings, in a fixed order, each once. Unknown names are ignored. */
export function enabledOAuthProviders(setting: string | undefined = process.env.NEXT_PUBLIC_SIGNIN_PROVIDERS): OAuthProvider[] {
  const named = new Set((setting ?? "").split(",").map((s) => s.trim().toLowerCase()));
  return OAUTH_PROVIDERS.filter((p) => named.has(p));
}
