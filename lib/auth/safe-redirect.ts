/**
 * Where to send someone after they log in. Only same-site paths are allowed,
 * so a crafted link such as /login?next=https://evil.example cannot bounce a
 * freshly logged-in user to another website.
 *
 * Browsers treat "//host" and "/\host" as another website, and a URL parser
 * turns dot segments, backslashes and some percent-encodings into slashes
 * ("/.//evil.example", "/a/..//evil.example" and "/%2e%2e//evil.example" all
 * become "//evil.example"). So the value is checked raw, decoded once, and
 * again after it has been normalised, and the normalised form is what is
 * returned. Anything odd falls back to `fallback`.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback; // a broken percent-encoding such as "/%E0%A4%A"
  }

  // The raw value and its decoded form must both be a plain same-site path.
  if (!isSameSitePath(value) || !isSameSitePath(decoded)) return fallback;

  const out = normalise(value);
  if (out === null || !isSameSitePath(out)) return fallback;

  // The decoded form must stay on this site after normalising too, so an encoded
  // "/%2e%2e%2f%2fevil.example" (which decodes to "/..//evil.example") is refused.
  const outDecoded = normalise(decoded);
  if (outDecoded === null || !isSameSitePath(outDecoded)) return fallback;

  // And the result, decoded once more, must not start a new host either ("/%2F%2Fevil").
  let resultDecoded: string;
  try {
    resultDecoded = decodeURIComponent(out);
  } catch {
    return fallback;
  }
  if (!isSameSitePath(resultDecoded)) return fallback;

  return out;
}

const MAX_LENGTH = 2048;

// Control characters (C0, DEL and C1). Browsers strip tabs and newlines from URLs,
// so "/\t/evil.example" would otherwise become "//evil.example".
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;

/** One leading "/", not followed by "/" or "\", and no control characters. */
function isSameSitePath(path: string): boolean {
  if (CONTROL_CHARS.test(path)) return false;
  if (!path.startsWith("/")) return false;
  const second = path.charAt(1);
  return second !== "/" && second !== "\\";
}

/** The path, query and fragment as a browser would resolve them on this site, or null. */
function normalise(path: string): string | null {
  try {
    const parsed = new URL(path, "http://localhost");
    if (parsed.origin !== "http://localhost") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
