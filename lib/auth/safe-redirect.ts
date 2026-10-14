/**
 * Where to send someone after they log in. Only same-site paths are allowed,
 * so a crafted link such as /login?next=https://evil.example cannot bounce a
 * freshly logged-in user to another website.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  // "//host" and "/\host" are treated by browsers as other websites.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
