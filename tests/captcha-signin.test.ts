import { beforeEach, describe, expect, it, vi } from "vitest";

// The bot check (Cloudflare Turnstile) on the email sign-in box: off until a site key is set;
// when on, the form needs a token and passes it to Supabase.

const fakes = vi.hoisted(() => ({
  otpCalls: [] as { email: string; options?: Record<string, unknown> }[],
  otpResult: { error: null } as { error: null | { code?: string; status?: number } },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithOtp: async (args: { email: string; options?: Record<string, unknown> }) => {
        fakes.otpCalls.push(args);
        return fakes.otpResult;
      },
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/analytics/funnel", () => ({ recordSignupOnce: async () => true }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "casespar.app" }) }));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));

import { requestSignInEmail } from "@/app/login/actions";
import { captchaTokenFrom, TURNSTILE_FIELD, turnstileSiteKey } from "@/lib/auth/captcha";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const send = (fields: Record<string, string>) => requestSignInEmail({ step: "email" }, form({ email: "student@example.com", ...fields }));

beforeEach(() => {
  fakes.otpCalls = [];
  fakes.otpResult = { error: null };
  vi.unstubAllEnvs();
  vi.stubEnv("PREVIEW_QUICK_LOGIN", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("captcha helpers", () => {
  it("reads the site key and trims it; blank means off", () => {
    expect(turnstileSiteKey()).toBe("");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "  0x4AAA  ");
    expect(turnstileSiteKey()).toBe("0x4AAA");
  });

  it("takes a token only from the Turnstile field, and ignores blanks, files and giant values", () => {
    expect(captchaTokenFrom(form({ [TURNSTILE_FIELD]: " tok " }))).toBe("tok");
    expect(captchaTokenFrom(form({ [TURNSTILE_FIELD]: "   " }))).toBeUndefined();
    expect(captchaTokenFrom(form({ other: "tok" }))).toBeUndefined();
    expect(captchaTokenFrom(form({ [TURNSTILE_FIELD]: "x".repeat(5000) }))).toBeUndefined();
    const withFile = new FormData();
    withFile.set(TURNSTILE_FIELD, new Blob(["x"]), "x.txt");
    expect(captchaTokenFrom(withFile)).toBeUndefined();
  });
});

describe("requesting a sign-in email", () => {
  it("works without a token while the check is off, and sends none to Supabase", async () => {
    expect(await send({})).toEqual({ step: "code", email: "student@example.com" });
    expect(fakes.otpCalls).toHaveLength(1);
    expect(fakes.otpCalls[0].options).not.toHaveProperty("captchaToken");
  });

  it("with the check on, refuses a missing token before anything is sent", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAA");
    const result = await send({});
    expect(result.step).toBe("email");
    expect(result.error).toMatch(/finish the check/i);
    expect(fakes.otpCalls).toHaveLength(0);
  });

  it("with the check on, passes the token to Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAA");
    expect(await send({ [TURNSTILE_FIELD]: "good-token" })).toEqual({ step: "code", email: "student@example.com" });
    expect(fakes.otpCalls[0].options).toMatchObject({ captchaToken: "good-token", shouldCreateUser: true });
  });

  it("still passes a token if one arrives while the site key is unset (harmless to Supabase)", async () => {
    await send({ [TURNSTILE_FIELD]: "t" });
    expect(fakes.otpCalls[0].options).toMatchObject({ captchaToken: "t" });
  });

  it("tells the person when Supabase rejects the check, without leaking the email", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAA");
    fakes.otpResult = { error: { code: "captcha_failed", status: 400 } };
    const result = await send({ [TURNSTILE_FIELD]: "stale" });
    expect(result).toMatchObject({ step: "email", email: "student@example.com" });
    expect(result.error).toMatch(/check didn't pass/i);
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain("student@example.com");
  });
});
