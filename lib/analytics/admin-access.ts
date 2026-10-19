// Who may open /admin (SPEC section 12): the email addresses in ADMIN_EMAILS,
// separated by commas. Spaces and letter case are ignored. An empty or missing
// list means nobody.

export function parseAdminEmails(raw: string | null | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isAdminEmail(email: string | null | undefined, raw: string | null | undefined = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).has(email.trim().toLowerCase());
}
