import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as ogScore } from "@/app/api/og/score/route";
import { cardView, caseTitleForSlug, siteHost } from "@/lib/share/card";
import { cleanFirstName, overallScore, shareSigningKey, signShareCard, verifyShareToken, type ShareCard } from "@/lib/share/token";
import { allCases } from "@/lib/content/cases";

// The share card (SPEC section 10): a signed link holding only scores, the case, the
// day and an optional first name.

const KEY = Buffer.from("test-share-key-0123456789abcdef");
const card: ShareCard = {
  scores: { structure: 4, analysis_maths: 3, business_judgement: 4, communication: 5, synthesis: 3 },
  caseSlug: "harbourline-bakeries",
  date: "2026-10-14",
};

/** Re-signs a hand-made body with the right key, to test what verify accepts after the signature passes. */
function forge(wire: unknown, key = KEY) {
  const body = Buffer.from(JSON.stringify(wire)).toString("base64url");
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
}

describe("share tokens", () => {
  it("round-trip the card, with and without a first name", () => {
    const token = signShareCard(card, KEY);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
    expect(verifyShareToken(token, KEY)).toEqual(card);
    const named = { ...card, firstName: "Siân O’Neil-Kaur" };
    expect(verifyShareToken(signShareCard(named, KEY), KEY)).toEqual(named);
  });

  it("hold nothing but the scores, case, day and optional name", () => {
    const token = signShareCard(card, KEY);
    const wire = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
    expect(wire).toEqual({ v: 1, s: [4, 3, 4, 5, 3], c: "harbourline-bakeries", d: "2026-10-14" });
  });

  it("reject tampering with the body or the signature, and other keys", () => {
    const token = signShareCard(card, KEY);
    const [body, sig] = token.split(".");
    const better = Buffer.from(JSON.stringify({ v: 1, s: [5, 5, 5, 5, 5], c: "harbourline-bakeries", d: "2026-10-14" })).toString("base64url");
    expect(verifyShareToken(`${better}.${sig}`, KEY)).toBeNull();
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(verifyShareToken(`${body}.${flipped}`, KEY)).toBeNull();
    expect(verifyShareToken(token, Buffer.from("another-key"))).toBeNull();
    expect(verifyShareToken(token, null)).toBeNull();
    for (const junk of ["", "abc", `${body}.`, `.${sig}`, `${body}.${sig}.x`, "x".repeat(700), 42, null]) {
      expect(verifyShareToken(junk, KEY)).toBeNull();
    }
  });

  it("reject bad scores even when correctly signed", () => {
    for (const s of [
      [0, 3, 3, 3, 3],
      [6, 3, 3, 3, 3],
      [3.5, 3, 3, 3, 3],
      [3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3],
      ["3", 3, 3, 3, 3],
    ]) {
      expect(verifyShareToken(forge({ v: 1, s, c: "case", d: "2026-10-14" }), KEY)).toBeNull();
    }
    expect(() => signShareCard({ ...card, scores: { ...card.scores, synthesis: 9 } }, KEY)).toThrow();
  });

  it("reject long or odd names, bad slugs, impossible days and extra fields, even when signed", () => {
    const base = { v: 1, s: [3, 3, 3, 3, 3], c: "case", d: "2026-10-14" };
    expect(verifyShareToken(forge({ ...base, n: "A".repeat(31) }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, n: "<script>" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, n: "me@example.com" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, c: "../etc" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, d: "2026-02-30" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, d: "2026-10-14T10:00:00Z" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, email: "me@example.com" }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, v: 2 }), KEY)).toBeNull();
    expect(verifyShareToken(forge({ ...base, n: "A".repeat(30) }), KEY)).toMatchObject({ firstName: "A".repeat(30) });
  });
});

describe("first names", () => {
  it("tidies spacing and treats empty as no name", () => {
    expect(cleanFirstName("  Mary   Ann ")).toEqual({ ok: true, name: "Mary Ann" });
    expect(cleanFirstName("")).toEqual({ ok: true, name: null });
    expect(cleanFirstName("   ")).toEqual({ ok: true, name: null });
    expect(cleanFirstName(null)).toEqual({ ok: true, name: null });
    expect(cleanFirstName("Zoë")).toEqual({ ok: true, name: "Zoë" });
    expect(cleanFirstName("D'Arcy")).toEqual({ ok: true, name: "D'Arcy" });
  });

  it("refuses names over 30 characters, and anything but letters, spaces, hyphens and apostrophes", () => {
    expect(cleanFirstName("A".repeat(31)).ok).toBe(false);
    expect(cleanFirstName("A".repeat(30))).toEqual({ ok: true, name: "A".repeat(30) });
    for (const bad of ["R2D2", "me@example.com", "Ann!", "-Ann", "<b>Ann</b>", "Ann 🎉", 5]) {
      expect(cleanFirstName(bad).ok, String(bad)).toBe(false);
    }
  });
});

describe("the signing key", () => {
  it("prefers SHARE_SIGNING_SECRET", () => {
    expect(shareSigningKey({ SHARE_SIGNING_SECRET: "own-secret", SUPABASE_SECRET_KEY: "sb" })?.toString()).toBe("own-secret");
  });

  it("otherwise derives a key from SUPABASE_SECRET_KEY, never using it directly", () => {
    const key = shareSigningKey({ SUPABASE_SECRET_KEY: "sb_secret_example" });
    expect(key).not.toBeNull();
    expect(key!.toString("utf8")).not.toContain("sb_secret_example");
    expect(key!.equals(Buffer.from("sb_secret_example"))).toBe(false);
    expect(key!.equals(shareSigningKey({ SUPABASE_SECRET_KEY: "sb_secret_example" })!)).toBe(true);
    expect(key!.equals(shareSigningKey({ SUPABASE_SECRET_KEY: "another" })!)).toBe(false);
  });

  it("switches sharing off when neither is set", () => {
    expect(shareSigningKey({})).toBeNull();
  });
});

describe("what the card shows", () => {
  it("works out the overall score, heading and description", () => {
    expect(overallScore(card)).toBe(3.8);
    const c = allCases[0];
    const view = cardView({ ...card, caseSlug: c.slug, firstName: "James" });
    expect(view.caseTitle).toBe(c.title);
    expect(view.heading).toBe("James’ practice scores");
    expect(view.overallLabel).toBe("3.8");
    expect(view.dateLabel).toBe("14 October 2026");
    expect(view.skills.map((s) => s.label)).toEqual(["Structure", "Analysis and maths", "Business judgement", "Communication", "Recommendation"]);
    expect(view.description).toContain("3.8 out of 5 overall");
    expect(cardView(card).heading).toBe("Practice scores");
  });

  it("falls back to a readable title for a case that no longer exists", () => {
    expect(caseTitleForSlug("old-retired-case")).toBe("Old retired case");
  });

  it("shows the site's host in the footer", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.casespar.com");
    expect(siteHost("http://localhost:3077")).toBe("casespar.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteHost("http://localhost:3077")).toBe("localhost:3077");
    vi.unstubAllEnvs();
  });
});

describe("GET /api/og/score", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses a missing or forged token with 404", async () => {
    vi.stubEnv("SHARE_SIGNING_SECRET", "route-test-secret");
    for (const t of ["", "nonsense", signShareCard(card, Buffer.from("not-the-route-key"))]) {
      const res = await ogScore(new NextRequest(`http://localhost/api/og/score?t=${encodeURIComponent(t)}`));
      expect(res.status).toBe(404);
    }
  });

  it("draws a 1200 x 630 PNG for a valid token", async () => {
    vi.stubEnv("SHARE_SIGNING_SECRET", "route-test-secret");
    const token = signShareCard({ ...card, firstName: "Aman" }, Buffer.from("route-test-secret"));
    const res = await ogScore(new NextRequest(`http://localhost/api/og/score?t=${token}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }, 30_000);
});

describe("the share pieces stay honest and private", () => {
  const files = ["lib/share/images.tsx", "app/share/[token]/page.tsx", "components/share-score.tsx", "app/opengraph-image.tsx"];

  it("name no firm on the cards or the share page (rule 2.3)", () => {
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/mckinsey|boston consulting|\bbcg\b|\bbain\b/i);
  });

  it("say the scores are practice scores, not a prediction", () => {
    expect(readFileSync("app/share/[token]/page.tsx", "utf8")).toMatch(/not a prediction/);
    expect(readFileSync("lib/share/images.tsx", "utf8")).toMatch(/Practice score on/);
  });

  it("load no scripts from LinkedIn or X: plain links only", () => {
    const text = readFileSync("components/share-score.tsx", "utf8");
    expect(text).toContain("https://www.linkedin.com/sharing/share-offsite/?url=");
    expect(text).toContain("https://x.com/intent/tweet?");
    expect(text).not.toMatch(/<script|platform\.(twitter|linkedin)|widgets\.js/);
    expect(text).toMatch(/rel="noopener noreferrer"/);
  });

  it("check ownership with the signed-in person's own client, not the admin client", () => {
    const text = readFileSync("lib/share/actions.ts", "utf8");
    expect(text).toContain('from "@/lib/supabase/server"');
    expect(text).not.toContain("supabase/admin");
    expect(text).toMatch(/session\.user_id !== user\.id/);
    expect(text).toMatch(/!session\.completed_at/);
  });
});
