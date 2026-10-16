import { beforeEach, describe, expect, it, vi } from "vitest";

// The preview-only shortcut (lib/auth/preview-login.ts): the founder's own address
// signs straight in on a private preview, and nowhere else.

const fakes = vi.hoisted(() => ({
  calls: [] as string[],
  linkResults: [] as Array<{ data: unknown; error: unknown }>,
  verify: { data: { user: { id: "u1" } }, error: null } as { data: { user: unknown }; error: unknown },
  verifyArgs: null as unknown,
  adminThrows: false,
  redirectedTo: null as string | null,
  otpSent: 0,
  signups: [] as unknown[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (fakes.adminThrows) throw new Error("SUPABASE_SECRET_KEY is not set");
    return {
      auth: {
        admin: {
          generateLink: async () => {
            fakes.calls.push("generateLink");
            return fakes.linkResults.shift() ?? { data: null, error: { code: "x", status: 500 } };
          },
          createUser: async () => {
            fakes.calls.push("createUser");
            return { data: {}, error: null };
          },
        },
      },
    };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      verifyOtp: async (args: unknown) => {
        fakes.calls.push("verifyOtp");
        fakes.verifyArgs = args;
        return fakes.verify;
      },
      signInWithOtp: async () => {
        fakes.otpSent++;
        return { error: null };
      },
    },
  }),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  recordSignupOnce: async (_source: unknown, user: unknown) => {
    fakes.signups.push(user);
    return true;
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "example.vercel.app" }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    fakes.redirectedTo = to;
    throw new Error("NEXT_REDIRECT");
  },
}));

import { previewQuickLoginAllowed, quickSignIn } from "@/lib/auth/preview-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestSignInEmail } from "@/app/login/actions";

const ON = { VERCEL_ENV: "preview", PREVIEW_QUICK_LOGIN: "1", ADMIN_EMAILS: "Founder@Example.com, other@example.com" };
const goodLink = { data: { properties: { hashed_token: "hash123", verification_type: "magiclink" } }, error: null };

beforeEach(() => {
  fakes.calls = [];
  fakes.linkResults = [];
  fakes.verify = { data: { user: { id: "u1" } }, error: null };
  fakes.verifyArgs = null;
  fakes.adminThrows = false;
  fakes.redirectedTo = null;
  fakes.otpSent = 0;
  fakes.signups = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("previewQuickLoginAllowed", () => {
  it("lets an admin address in on a preview with the switch on", () => {
    expect(previewQuickLoginAllowed("founder@example.com", ON)).toBe(true);
    expect(previewQuickLoginAllowed(" FOUNDER@example.com ", ON)).toBe(true);
  });

  it.each([
    ["production", "production"],
    ["development", "development"],
    ["unset", undefined],
    ["a near miss", "Preview"],
  ])("is off when VERCEL_ENV is %s", (_label, value) => {
    expect(previewQuickLoginAllowed("founder@example.com", { ...ON, VERCEL_ENV: value })).toBe(false);
  });

  it.each([undefined, "", "0", "true", "yes", " 1"])("is off when PREVIEW_QUICK_LOGIN is %j", (value) => {
    expect(previewQuickLoginAllowed("founder@example.com", { ...ON, PREVIEW_QUICK_LOGIN: value })).toBe(false);
  });

  it("never lets in an address that is not in ADMIN_EMAILS", () => {
    expect(previewQuickLoginAllowed("someone@example.com", ON)).toBe(false);
    expect(previewQuickLoginAllowed("founder@example.com.evil.test", ON)).toBe(false);
    expect(previewQuickLoginAllowed("founder@example.com", { ...ON, ADMIN_EMAILS: "" })).toBe(false);
    expect(previewQuickLoginAllowed("founder@example.com", { ...ON, ADMIN_EMAILS: undefined })).toBe(false);
  });

  it("is off with the real environment of this test run", () => {
    expect(previewQuickLoginAllowed("founder@example.com")).toBe(false);
  });
});

describe("quickSignIn", () => {
  it("makes a one-time token with the secret key and uses it at once", async () => {
    fakes.linkResults = [goodLink];
    await expect(quickSignIn("founder@example.com", createAdminClient)).resolves.toEqual({ status: "ok", user: { id: "u1" } });
    expect(fakes.calls).toEqual(["generateLink", "verifyOtp"]);
    expect(fakes.verifyArgs).toEqual({ type: "magiclink", token_hash: "hash123" });
  });

  it("creates the account first if it does not exist yet", async () => {
    fakes.linkResults = [{ data: null, error: { code: "user_not_found", status: 404 } }, goodLink];
    await expect(quickSignIn("founder@example.com", createAdminClient)).resolves.toMatchObject({ status: "ok" });
    expect(fakes.calls).toEqual(["generateLink", "createUser", "generateLink", "verifyOtp"]);
  });

  it("uses the token type Supabase reports, and only known types", async () => {
    fakes.linkResults = [{ data: { properties: { hashed_token: "h", verification_type: "signup" } }, error: null }];
    await quickSignIn("founder@example.com", createAdminClient);
    expect(fakes.verifyArgs).toEqual({ type: "signup", token_hash: "h" });

    fakes.linkResults = [{ data: { properties: { hashed_token: "h", verification_type: "recovery" } }, error: null }];
    await quickSignIn("founder@example.com", createAdminClient);
    expect(fakes.verifyArgs).toEqual({ type: "magiclink", token_hash: "h" });
  });

  it("reports no-token when no token can be made", async () => {
    fakes.linkResults = [
      { data: null, error: { code: "x", status: 500 } },
      { data: null, error: { code: "x", status: 500 } },
    ];
    await expect(quickSignIn("founder@example.com", createAdminClient)).resolves.toEqual({ status: "no-token" });
    expect(fakes.calls).not.toContain("verifyOtp");
  });

  it("reports failed when the token was made but the sign-in step fails", async () => {
    fakes.linkResults = [goodLink];
    fakes.verify = { data: { user: null }, error: { code: "otp_expired", status: 403 } };
    await expect(quickSignIn("founder@example.com", createAdminClient)).resolves.toEqual({ status: "failed" });
  });

  it("reports no-token (and does not throw) when the secret key is missing", async () => {
    fakes.adminThrows = true;
    await expect(quickSignIn("founder@example.com", createAdminClient)).resolves.toEqual({ status: "no-token" });
  });

  it("never logs the email address", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fakes.linkResults = [
      { data: null, error: { code: "x", status: 500 } },
      { data: null, error: { code: "x", status: 500 } },
    ];
    await quickSignIn("founder@example.com", createAdminClient);
    fakes.adminThrows = true;
    await quickSignIn("founder@example.com", createAdminClient);
    expect(JSON.stringify(spy.mock.calls)).not.toContain("founder@example.com");
  });
});

describe("the login form's first step", () => {
  function form(email: string, next?: string) {
    const fd = new FormData();
    fd.set("email", email);
    if (next) fd.set("next", next);
    return fd;
  }

  it("emails a code as usual when the shortcut is off", async () => {
    // The test environment is not a Vercel preview, so the shortcut stays off.
    const state = await requestSignInEmail({ step: "email" }, form("founder@example.com"));
    expect(state).toEqual({ step: "code", email: "founder@example.com" });
    expect(fakes.otpSent).toBe(1);
    expect(fakes.calls).toEqual([]);
  });

  describe("on a preview with the switch on", () => {
    beforeEach(() => {
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.stubEnv("PREVIEW_QUICK_LOGIN", "1");
      vi.stubEnv("ADMIN_EMAILS", "founder@example.com");
      return () => vi.unstubAllEnvs();
    });

    it("signs the founder straight in and opens the dashboard, with no email", async () => {
      fakes.linkResults = [goodLink];
      await expect(requestSignInEmail({ step: "email" }, form("Founder@Example.com"))).rejects.toThrow("NEXT_REDIRECT");
      expect(fakes.redirectedTo).toBe("/app");
      expect(fakes.otpSent).toBe(0);
      expect(fakes.signups).toEqual([{ id: "u1" }]); // counted like any other first sign-in
    });

    it("keeps the safe next page", async () => {
      fakes.linkResults = [goodLink];
      await expect(
        requestSignInEmail({ step: "email" }, form("founder@example.com", "https://evil.example")),
      ).rejects.toThrow("NEXT_REDIRECT");
      expect(fakes.redirectedTo).toBe("/app");

      fakes.linkResults = [goodLink];
      await expect(requestSignInEmail({ step: "email" }, form("founder@example.com", "/app/account"))).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(fakes.redirectedTo).toBe("/app/account");
    });

    it("still emails a code to anyone else", async () => {
      const state = await requestSignInEmail({ step: "email" }, form("student@example.com"));
      expect(state).toEqual({ step: "code", email: "student@example.com" });
      expect(fakes.calls).toEqual([]);
      expect(fakes.otpSent).toBe(1);
    });

    it("falls back to the email if no token could be made", async () => {
      fakes.adminThrows = true;
      const state = await requestSignInEmail({ step: "email" }, form("founder@example.com"));
      expect(state).toEqual({ step: "code", email: "founder@example.com" });
      expect(fakes.otpSent).toBe(1);
      expect(fakes.redirectedTo).toBeNull();
    });

    it("asks to try again (and sends no email) if the token was made but not used", async () => {
      // Making the token counts as an email for Supabase's once-a-minute limit,
      // so an email now would only be refused.
      fakes.linkResults = [goodLink];
      fakes.verify = { data: { user: null }, error: { code: "otp_expired", status: 403 } };
      const state = await requestSignInEmail({ step: "email" }, form("founder@example.com"));
      expect(state).toMatchObject({ step: "email", email: "founder@example.com" });
      expect(state.error).toMatch(/try again/);
      expect(fakes.otpSent).toBe(0);
      expect(fakes.redirectedTo).toBeNull();
      expect(fakes.signups).toEqual([]);
    });
  });
});
