import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// "Continue with Google / Apple": the server step that starts the sign-in, and the route
// the person lands on when they come back.

const fakes = vi.hoisted(() => ({
  oauthCalls: [] as unknown[],
  oauthResult: { data: { url: "https://proj.supabase.co/auth/v1/authorize?provider=google" }, error: null } as { data: { url: string | null }; error: unknown },
  exchange: { data: { user: { id: "u1" } }, error: null } as { data: { user: unknown }; error: unknown },
  exchanged: [] as string[],
  redirectedTo: null as string | null,
  signups: [] as unknown[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithOAuth: async (args: unknown) => {
        fakes.oauthCalls.push(args);
        return fakes.oauthResult;
      },
      exchangeCodeForSession: async (code: string) => {
        fakes.exchanged.push(code);
        return fakes.exchange;
      },
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/analytics/funnel", () => ({
  recordSignupOnce: async (_s: unknown, user: unknown) => {
    fakes.signups.push(user);
    return true;
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "casespar.app" }) }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    fakes.redirectedTo = to;
    throw new Error("NEXT_REDIRECT");
  },
}));

import { signInWithProvider } from "@/app/login/actions";
import { GET } from "@/app/auth/confirm/route";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const start = async (fields: Record<string, string>) => {
  await expect(signInWithProvider(form(fields))).rejects.toThrow("NEXT_REDIRECT");
  return fakes.redirectedTo;
};

beforeEach(() => {
  fakes.oauthCalls = [];
  fakes.oauthResult = { data: { url: "https://proj.supabase.co/auth/v1/authorize?provider=google" }, error: null };
  fakes.exchange = { data: { user: { id: "u1" } }, error: null };
  fakes.exchanged = [];
  fakes.redirectedTo = null;
  fakes.signups = [];
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SIGNIN_PROVIDERS", "google,apple");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("starting a sign-in with Google or Apple", () => {
  it("sends the person to the provider's address that Supabase gave, coming back through /auth/confirm", async () => {
    expect(await start({ provider: "google", next: "/app/cases" })).toBe("https://proj.supabase.co/auth/v1/authorize?provider=google");
    const call = fakes.oauthCalls[0] as { provider: string; options: { redirectTo: string; queryParams?: Record<string, string> } };
    expect(call.provider).toBe("google");
    const back = new URL(call.options.redirectTo);
    expect(back.origin + back.pathname).toBe("https://casespar.app/auth/confirm");
    expect(back.searchParams.get("next")).toBe("/app/cases");
    expect(call.options.queryParams).toEqual({ prompt: "select_account" });
  });

  it("works for Apple, without Google's account picker", async () => {
    await start({ provider: "apple", next: "/app" });
    const call = fakes.oauthCalls[0] as { provider: string; options: { queryParams?: unknown } };
    expect(call.provider).toBe("apple");
    expect(call.options.queryParams).toBeUndefined();
  });

  it("carries the visit's campaign tags back, so the signup is counted against them", async () => {
    await start({ provider: "google", next: "/app", utm_source: "linkedin", utm_campaign: "launch" });
    const call = fakes.oauthCalls[0] as { options: { redirectTo: string } };
    const back = new URL(call.options.redirectTo);
    expect(back.searchParams.get("utm_source")).toBe("linkedin");
    expect(back.searchParams.get("utm_campaign")).toBe("launch");
  });

  it("never sends the person to another website after sign-in", async () => {
    await start({ provider: "google", next: "https://evil.example/steal" });
    const back = new URL((fakes.oauthCalls[0] as { options: { redirectTo: string } }).options.redirectTo);
    expect(back.searchParams.get("next")).toBe("/app");
  });

  it("refuses a provider that is not switched on, a made-up one, and none at all, without calling Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIGNIN_PROVIDERS", "google");
    expect(await start({ provider: "apple" })).toBe("/login?error=provider_unavailable");
    expect(await start({ provider: "github" })).toBe("/login?error=provider_unavailable");
    expect(await start({})).toBe("/login?error=provider_unavailable");
    vi.stubEnv("NEXT_PUBLIC_SIGNIN_PROVIDERS", "");
    expect(await start({ provider: "google" })).toBe("/login?error=provider_unavailable");
    expect(fakes.oauthCalls).toHaveLength(0);
  });

  it("goes back to the login page with a plain message when Supabase fails, and logs no personal details", async () => {
    fakes.oauthResult = { data: { url: null }, error: { code: "validation_failed", status: 400 } };
    expect(await start({ provider: "google" })).toBe("/login?error=provider_failed");
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toMatch(/@/);
  });
});

describe("coming back from Google or Apple (/auth/confirm)", () => {
  const visit = (query: string) => GET(new NextRequest(`https://casespar.app/auth/confirm?${query}`));

  it("swaps the code for a session, records the signup, and goes to the page they wanted", async () => {
    const res = await visit("code=abc&next=%2Fapp%2Fcases&utm_source=linkedin");
    expect(fakes.exchanged).toEqual(["abc"]);
    expect(fakes.signups).toHaveLength(1);
    expect(res.headers.get("location")).toBe("https://casespar.app/app/cases");
  });

  it("sends a cancelled sign-in back to the login page with its own message, without trying the code", async () => {
    const res = await visit("error=access_denied&error_description=User+cancelled&code=abc");
    expect(res.headers.get("location")).toBe("https://casespar.app/login?error=provider_cancelled");
    expect(fakes.exchanged).toHaveLength(0);
  });

  it("sends any other provider error back with the general message", async () => {
    const res = await visit("error=server_error&error_description=Unable+to+exchange+external+code");
    expect(res.headers.get("location")).toBe("https://casespar.app/login?error=provider_failed");
    expect(fakes.exchanged).toHaveLength(0);
  });

  it("keeps the old message for an expired email link", async () => {
    const res = await visit("error=access_denied&error_code=otp_expired&error_description=expired");
    expect(res.headers.get("location")).toBe("https://casespar.app/login?error=link_invalid");
  });

  it("sends a bad or used code back to the login page", async () => {
    fakes.exchange = { data: { user: null }, error: { status: 400 } };
    const res = await visit("code=bad");
    expect(res.headers.get("location")).toBe("https://casespar.app/login?error=link_invalid");
  });
});
