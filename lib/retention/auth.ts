import { createHash, timingSafeEqual } from "node:crypto";

// Vercel Cron calls the clean-up with "Authorization: Bearer <CRON_SECRET>".
// Compared in constant time (on SHA-256 digests, so different lengths take the same
// time too), so the secret cannot be guessed one character at a time.

export type CronAuth = "ok" | "not_configured" | "unauthorized";

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

export function checkCronAuth(header: string | null | undefined, secret: string | null | undefined): CronAuth {
  const expected = secret?.trim();
  if (!expected) return "not_configured";
  const match = /^Bearer (.+)$/.exec(header ?? "");
  if (!match) return "unauthorized";
  return timingSafeEqual(digest(match[1]), digest(expected)) ? "ok" : "unauthorized";
}
