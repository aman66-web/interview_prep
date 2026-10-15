import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// A share card's contents travel inside its link, signed so nobody can change them:
//   the five skill scores (whole numbers 1 to 5), the case's slug, the day of the
//   interview, and, only if the person typed one, a first name.
// Nothing else: no user id, session id or email (SPEC section 10).
//
// Token: base64url(JSON) + "." + base64url(HMAC-SHA256). The key is SHARE_SIGNING_SECRET
// when set; otherwise it is derived from SUPABASE_SECRET_KEY with HMAC and a fixed
// label, so the secret key itself is never used directly and never leaves the server.
// Server only (rule 2.5).

export const SKILL_KEYS = ["structure", "analysis_maths", "business_judgement", "communication", "synthesis"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
  structure: "Structure",
  analysis_maths: "Analysis and maths",
  business_judgement: "Business judgement",
  communication: "Communication",
  synthesis: "Recommendation",
};

export const FIRST_NAME_MAX = 30;
const TOKEN_MAX = 600;
const KEY_LABEL = "casespar:share-card-signing-key:v1";

const score = z.number().int().min(1).max(5);

/** Letters (any alphabet), spaces, hyphens and apostrophes; starts with a letter. */
const NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’-]*$/u;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRealDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const shareCardSchema = z
  .object({
    scores: z.object({
      structure: score,
      analysis_maths: score,
      business_judgement: score,
      communication: score,
      synthesis: score,
    }),
    caseSlug: z.string().max(80).regex(SLUG_PATTERN),
    date: z.string().refine(isRealDay, "a day as YYYY-MM-DD"),
    firstName: z.string().min(1).max(FIRST_NAME_MAX).regex(NAME_PATTERN).optional(),
  })
  .strict();
export type ShareCard = z.infer<typeof shareCardSchema>;

/** The compact form inside the token. */
const wireSchema = z
  .object({
    v: z.literal(1),
    s: z.array(score).length(SKILL_KEYS.length),
    c: z.string(),
    d: z.string(),
    n: z.string().optional(),
  })
  .strict();

/**
 * Tidies what the person typed: trims, joins repeated spaces, normalises accents.
 * Empty means "no name". Anything else that breaks the rules is refused, not altered.
 */
export function cleanFirstName(input: unknown): { ok: true; name: string | null } | { ok: false; reason: string } {
  if (input === null || input === undefined) return { ok: true, name: null };
  if (typeof input !== "string") return { ok: false, reason: "That name could not be read." };
  const name = input.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name === "") return { ok: true, name: null };
  if (name.length > FIRST_NAME_MAX) return { ok: false, reason: `Keep the name to ${FIRST_NAME_MAX} characters or fewer.` };
  if (!NAME_PATTERN.test(name)) return { ok: false, reason: "Use letters, spaces, hyphens and apostrophes only." };
  return { ok: true, name };
}

/** The signing key, or null when neither secret is set (share links are then switched off). */
export function shareSigningKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const own = env.SHARE_SIGNING_SECRET?.trim();
  if (own) return Buffer.from(own, "utf8");
  const base = env.SUPABASE_SECRET_KEY?.trim();
  if (!base) return null;
  return createHmac("sha256", base).update(KEY_LABEL).digest();
}

const sign = (body: string, key: Buffer) => createHmac("sha256", key).update(body).digest("base64url");

export function signShareCard(card: ShareCard, key: Buffer): string {
  const valid = shareCardSchema.parse(card);
  const wire = {
    v: 1 as const,
    s: SKILL_KEYS.map((k) => valid.scores[k]),
    c: valid.caseSlug,
    d: valid.date,
    ...(valid.firstName ? { n: valid.firstName } : {}),
  };
  const body = Buffer.from(JSON.stringify(wire), "utf8").toString("base64url");
  return `${body}.${sign(body, key)}`;
}

/** The card, or null if the token is malformed, tampered with or signed with another key. */
export function verifyShareToken(token: unknown, key: Buffer | null): ShareCard | null {
  if (!key || typeof token !== "string" || token.length > TOKEN_MAX) return null;
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const [, body, signature] = match;
  const expected = Buffer.from(sign(body, key), "utf8");
  const given = Buffer.from(signature, "utf8");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const wire = wireSchema.safeParse(raw);
  if (!wire.success) return null;
  const card = shareCardSchema.safeParse({
    scores: Object.fromEntries(SKILL_KEYS.map((k, i) => [k, wire.data.s[i]])),
    caseSlug: wire.data.c,
    date: wire.data.d,
    ...(wire.data.n !== undefined ? { firstName: wire.data.n } : {}),
  });
  return card.success ? card.data : null;
}

/** Average of the five scores, to one decimal place. */
export function overallScore(card: Pick<ShareCard, "scores">): number {
  const total = SKILL_KEYS.reduce((sum, k) => sum + card.scores[k], 0);
  return Math.round((total / SKILL_KEYS.length) * 10) / 10;
}
