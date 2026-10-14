import { createHmac, timingSafeEqual } from "node:crypto";

// Checks that a webhook really came from Stripe (docs: "Verify webhook signatures").
// The header looks like "t=1700000000,v1=<hex>,v1=<hex>". Stripe signs "<t>.<raw body>"
// with the endpoint's signing secret. We also refuse old timestamps, so a captured
// message cannot be replayed later.

export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SignatureResult = { ok: true } | { ok: false; reason: "missing" | "malformed" | "too_old" | "mismatch" };

export function signPayload(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function verifySignature(
  payload: string,
  header: string | null | undefined,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = SIGNATURE_TOLERANCE_SECONDS,
): SignatureResult {
  if (!header) return { ok: false, reason: "missing" };

  let timestamp: number | null = null;
  const candidates: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t" && value && /^\d{1,12}$/.test(value)) timestamp = Number(value);
    if (key === "v1" && value && /^[0-9a-f]{64}$/i.test(value)) candidates.push(value.toLowerCase());
  }
  if (timestamp === null || candidates.length === 0) return { ok: false, reason: "malformed" };
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return { ok: false, reason: "too_old" };

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  const matches = candidates.some((candidate) => {
    const given = Buffer.from(candidate, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  return matches ? { ok: true } : { ok: false, reason: "mismatch" };
}
