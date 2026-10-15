import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as ogScore } from "@/app/api/og/score/route";
import { createShareLink } from "@/lib/share/actions";
import { cardView, caseTitleForSlug, imageCardView, siteHost } from "@/lib/share/card";
import { estimateLines, ScoreCardImage, titleFontSize } from "@/lib/share/images";
import {
  cleanFirstName,
  isDrawableName,
  NAME_JOINERS,
  NAME_LETTER_RANGES,
  NAME_RULE_MESSAGE,
  overallScore,
  shareSigningKey,
  signShareCard,
  verifyShareToken,
  type ShareCard,
} from "@/lib/share/token";
import { allCases } from "@/lib/content/cases";

// The share action reads the signed-in user and their interview; both are faked here.
const fakes = vi.hoisted(() => ({
  user: null as { id: string } | null,
  session: null as Record<string, unknown> | null,
  reads: 0,
}));
vi.mock("@/lib/auth/session", () => ({ getUser: async () => fakes.user }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => {
          fakes.reads++;
          return { data: fakes.session, error: null };
        },
      };
      return chain;
    },
  }),
}));

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

  it("accepts Latin letters with accents and Cyrillic letters, which the card's font can draw", () => {
    for (const good of ["Zoë", "Łukasz", "Siân O’Neil-Kaur", "Søren", "Ştefan", "Ștefan", "Şükrü", "İlkay", "Gwenllïan", "Nguyễn", "Phương", "Ərtoğrul", "Иван", "Олександра", "Ґанна", "Әлия", "Ẃyn"]) {
      expect(cleanFirstName(good), good).toEqual({ ok: true, name: good });
    }
    // An accent typed as a separate mark is joined to its letter first.
    expect(cleanFirstName("Zoe\u0308")).toEqual({ ok: true, name: "Zoë" });
  });

  it("refuses letters the card's font cannot draw, with a plain reason, so no font is ever fetched for them", () => {
    for (const bad of ["Αλέξανδρος", "محمد", "太郎", "प्रिया", "김민준", "יעל", "สมชาย", "Chŏng", "q\u0303", "Zoe\u0301\u0301"]) {
      const result = cleanFirstName(bad);
      expect(result, bad).toEqual({ ok: false, reason: NAME_RULE_MESSAGE });
      expect(isDrawableName(bad), bad).toBe(false);
    }
    expect(NAME_RULE_MESSAGE).toMatch(/A to Z/);
  });
});

/** The characters a TrueType font file can draw, read from its cmap table (formats 4 and 12). */
function fontCharacters(file: string): Set<number> {
  const font = readFileSync(file);
  const tables = new Map<string, number>();
  for (let i = 0, n = font.readUInt16BE(4); i < n; i++) {
    tables.set(font.toString("latin1", 12 + 16 * i, 16 + 16 * i), font.readUInt32BE(20 + 16 * i));
  }
  const cmap = tables.get("cmap");
  if (cmap === undefined) throw new Error("no cmap table");
  const chars = new Set<number>();
  for (let i = 0, n = font.readUInt16BE(cmap + 2); i < n; i++) {
    const sub = cmap + font.readUInt32BE(cmap + 8 + 8 * i);
    const format = font.readUInt16BE(sub);
    if (format === 4) {
      const segs = font.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + 2 * segs + 2;
      const deltas = starts + 2 * segs;
      const offsets = deltas + 2 * segs;
      for (let k = 0; k < segs; k++) {
        const start = font.readUInt16BE(starts + 2 * k);
        const end = font.readUInt16BE(ends + 2 * k);
        const delta = font.readInt16BE(deltas + 2 * k);
        const offset = font.readUInt16BE(offsets + 2 * k);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let glyph: number;
          if (offset === 0) glyph = (c + delta) & 0xffff;
          else {
            glyph = font.readUInt16BE(offsets + 2 * k + offset + 2 * (c - start));
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) chars.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0, groups = font.readUInt32BE(sub + 12); g < groups; g++) {
        const at = sub + 16 + 12 * g;
        for (let c = font.readUInt32BE(at); c <= font.readUInt32BE(at + 4); c++) chars.add(c);
      }
    }
  }
  return chars;
}

describe("the share picture never fetches a font (rule 2.7: a first name must not go to Google)", () => {
  // The font next/og draws with when no other font is given (as in lib/share/images.tsx).
  const GEIST = "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf";

  it("allows only letters the bundled font has", () => {
    const has = fontCharacters(GEIST);
    expect(has.has(0x41) && has.has(0x2019)).toBe(true); // the parser works: "A" and the curly apostrophe
    expect(has.has(0x3b1)).toBe(false); // Greek alpha is not in the font
    const missing: string[] = [];
    for (const [from, to] of NAME_LETTER_RANGES) {
      for (let c = from; c <= to; c++) {
        // The picture shows the name in capitals (the heading is uppercased), so check those too.
        for (const ch of String.fromCodePoint(c) + String.fromCodePoint(c).toUpperCase()) {
          if (!has.has(ch.codePointAt(0)!)) missing.push(`U+${ch.codePointAt(0)!.toString(16).toUpperCase()}`);
        }
        expect(isDrawableName(String.fromCodePoint(c)), `U+${c.toString(16)}`).toBe(true);
      }
    }
    for (const ch of NAME_JOINERS) if (!has.has(ch.codePointAt(0)!)) missing.push(ch);
    expect(missing).toEqual([]);
  });

  it("allows nothing outside those letters, spaces, hyphens and apostrophes", () => {
    const allowed = new Set<number>([...NAME_JOINERS].map((ch) => ch.codePointAt(0)!));
    for (const [from, to] of NAME_LETTER_RANGES) for (let c = from; c <= to; c++) allowed.add(c);
    const extra: string[] = [];
    for (let c = 0x20; c <= 0x2fff; c++) {
      if (allowed.has(c)) continue;
      // A single joiner is not a name; test each other character after a letter.
      if (isDrawableName(`A${String.fromCodePoint(c)}`)) extra.push(`U+${c.toString(16).toUpperCase()}`);
    }
    expect(extra).toEqual([]);
  });

  describe("with the internet switched off", () => {
    const realFetch = globalThis.fetch;
    /** Every request for something on the internet (next/og loads its own layout engine from a data: address, which stays allowed). */
    let netRequests: string[];
    let consoleCalls: unknown[][];
    beforeEach(() => {
      netRequests = [];
      vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.startsWith("data:")) return realFetch(input, init);
        netRequests.push(url);
        throw new Error("no internet in this test");
      });
      consoleCalls = [];
      for (const level of ["error", "warn", "log", "info", "debug"] as const) {
        vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
          consoleCalls.push(args);
        });
      }
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
    });

    const names = ["Zoë", "Łukasz", "Siân O’Neil-Kaur", "Nguyễn Thị Phương", "Иван", "Ştefan", "Gwenllïan", "Ẃyn", "Søren", "Әлия"];

    it("draws every case with an accepted first name without fetching anything or logging the name", async () => {
      vi.stubEnv("SHARE_SIGNING_SECRET", "route-test-secret");
      const key = Buffer.from("route-test-secret");
      for (const [i, c] of allCases.entries()) {
        const firstName = names[i % names.length];
        const token = signShareCard({ ...card, caseSlug: c.slug, firstName }, key);
        const res = await ogScore(new NextRequest(`http://localhost/api/og/score?t=${token}`));
        expect(res.status, c.slug).toBe(200);
        expect((await res.arrayBuffer()).byteLength, c.slug).toBeGreaterThan(1000);
      }
      expect(netRequests).toEqual([]);
      expect(consoleCalls).toEqual([]);
    }, 60_000);

    it("would fetch a font for a name outside the font, which is why such names are refused (a check on this test)", async () => {
      const greek = "Ξενοφών";
      expect(cleanFirstName(greek).ok).toBe(false);
      // Bypass every guard and draw it anyway, to prove the test above would notice a fetch.
      const view = { ...cardView(card), heading: `${greek}’s practice scores` };
      const res = new ImageResponse(createElement(ScoreCardImage, { view, host: "localhost" }), { width: 1200, height: 630 });
      await res.arrayBuffer().catch(() => null);
      expect(netRequests.length).toBeGreaterThan(0);
      expect(netRequests[0]).toContain("fonts.googleapis.com");
    }, 30_000);
  });

  it("leaves a name off the picture if it ever reaches the drawing step with a letter the font lacks", () => {
    expect(imageCardView({ ...card, firstName: "Łukasz" }).heading).toBe("Łukasz’s practice scores");
    const forced = { ...card, firstName: "Αλέξανδρος" } as ShareCard; // a token can no longer hold this
    expect(imageCardView(forced).heading).toBe("Practice scores");
    expect(imageCardView(forced).description).not.toContain("Αλέξανδρος");
  });

  it("refuses a signed token whose name the font cannot draw", () => {
    const base = { v: 1, s: [3, 3, 3, 3, 3], c: "case", d: "2026-10-14" };
    for (const n of ["Αλέξανδρος", "محمد", "太郎"]) expect(verifyShareToken(forge({ ...base, n }), KEY), n).toBeNull();
    expect(() => signShareCard({ ...card, firstName: "Αλέξανδρος" }, KEY)).toThrow();
    expect(verifyShareToken(forge({ ...base, n: "Иван" }), KEY)).toMatchObject({ firstName: "Иван" });
  });
});

describe("the share action", () => {
  const SESSION = "6f1c2a4e-8b7d-4c3e-9a1f-2b3c4d5e6f70";
  const USER = "11111111-2222-4333-8444-555555555555";
  const form = (firstName: string) => {
    const f = new FormData();
    f.set("sessionId", SESSION);
    f.set("firstName", firstName);
    return f;
  };
  beforeEach(() => {
    vi.stubEnv("SHARE_SIGNING_SECRET", "action-test-secret");
    fakes.user = { id: USER };
    fakes.reads = 0;
    fakes.session = {
      id: SESSION,
      user_id: USER,
      case_id: allCases[0].id,
      completed_at: "2026-10-14T10:00:00Z",
      scores: {
        version: 1,
        scores: card.scores,
        strengths: [],
        fixes: [],
        summary: "x",
        maths: { attempted: 0, correct: 0, total: 0, items: [] },
      },
    };
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses a name the card cannot draw before reading anything, and logs nothing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const state = await createShareLink({ status: "idle" }, form("Αλέξανδρος"));
    expect(state).toEqual({ status: "error", message: NAME_RULE_MESSAGE });
    expect(fakes.reads).toBe(0);
    expect(logged).not.toHaveBeenCalled();
  });

  it("makes a link holding an accepted name", async () => {
    const state = await createShareLink({ status: "idle" }, form("  Łukasz "));
    expect(state).toMatchObject({ status: "ready", firstName: "Łukasz" });
    const token = (state as { path: string }).path.replace("/share/", "");
    expect(verifyShareToken(token, Buffer.from("action-test-secret"))).toMatchObject({ firstName: "Łukasz", caseSlug: allCases[0].slug });
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

describe("the share picture's layout", () => {
  const view = (caseSlug: string, firstName?: string) => cardView({ ...card, caseSlug, ...(firstName ? { firstName } : {}) });
  const longNames = ["Alexandra", "Siân O’Neil-Kaur", "Christopher-James", "Олександра Петренко", "Maximiliana-Josephine O’Brien", "W".repeat(30)];

  it("estimates line wrapping the way the picture really wraps (checked against rendered cards)", () => {
    // The heading is drawn in capitals, 20 px with 4 px letter spacing, in a 478 px wide space.
    const heading = (name?: string) => estimateLines(view("x", name).heading.toUpperCase(), 478, 20, 4);
    expect(heading()).toBe(1);
    expect(heading("Alexandra")).toBe(1);
    expect(heading("Siân O’Neil-Kaur")).toBe(2);
    expect(heading("Maximiliana-Josephine O’Brien")).toBe(2);
    expect(heading("W".repeat(30))).toBe(3);
    // Case titles at 46 px with -1.5 px letter spacing, 500 px wide.
    expect(estimateLines("Harbourline Bakeries: why did profit fall?", 500, 46, -1.5)).toBe(2);
    expect(estimateLines("Brinmoor Bike Share: why are so many bikes out of service?", 500, 46, -1.5)).toBe(3);
  });

  it("keeps each case's usual title size when there is no name or a short one", () => {
    for (const c of allCases) {
      const usual = c.title.length > 28 ? 46 : 56;
      expect(titleFontSize(view(c.slug)), c.slug).toBe(usual);
      expect(titleFontSize(view(c.slug, "Zoë")), c.slug).toBe(usual);
    }
  });

  it("makes a long title smaller when a long name needs two lines, so the date never runs over it", () => {
    const brinmoor = allCases.find((c) => c.title.startsWith("Brinmoor"));
    expect(brinmoor).toBeDefined();
    expect(titleFontSize(view(brinmoor!.slug, "Siân O’Neil-Kaur"))).toBeLessThan(46);
    for (const c of allCases) {
      for (const name of longNames) {
        const size = titleFontSize(view(c.slug, name));
        expect(size, `${c.slug} ${name}`).toBeGreaterThanOrEqual(34); // still easy to read
        expect(size, `${c.slug} ${name}`).toBeLessThanOrEqual(titleFontSize(view(c.slug)));
      }
    }
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
