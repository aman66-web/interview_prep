// The "prove you are a person" check on the email sign-in box: Cloudflare Turnstile (founder's
// yes, 19 Oct 2026). It stops bots using the form to send emails to strangers. It is off until
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; Supabase's CAPTCHA protection is switched on only
// after that (docs/CHROME_SETUP.md, part M), because Supabase then refuses sign-ins that carry
// no token. The site key is public. The secret key lives only in Supabase.

/** The hidden field Turnstile adds to the form once a person has passed. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

export function turnstileSiteKey(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
}

/** The token from the form, or undefined when there is none (a real one is a few hundred characters). */
export function captchaTokenFrom(formData: FormData): string | undefined {
  const value = formData.get(TURNSTILE_FIELD);
  if (typeof value !== "string") return undefined;
  const token = value.trim();
  return token && token.length <= 4096 ? token : undefined;
}
