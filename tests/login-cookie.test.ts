import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/me/route";
import { hasLoginCookie } from "@/lib/auth/login-cookie";
import { NextRequest } from "next/server";

describe("hasLoginCookie", () => {
  it("is true for the Supabase login cookie, including its numbered chunks", () => {
    expect(hasLoginCookie(["sb-jkvnarskslswdwrdzefa-auth-token"])).toBe(true);
    expect(hasLoginCookie(["a", "sb-abc123-auth-token.0", "sb-abc123-auth-token.1"])).toBe(true);
  });

  it("is false for anything else, including look-alikes", () => {
    expect(hasLoginCookie([])).toBe(false);
    expect(hasLoginCookie(["theme", "sb-abc123-auth-token-code-verifier", "xsb-abc123-auth-token", "sb--auth-token"])).toBe(false);
  });
});

describe("GET /api/auth/me", () => {
  const ask = (cookie?: string) => GET(new NextRequest("https://casespar.app/api/auth/me", cookie ? { headers: { cookie } } : undefined));

  it("says true only when a login cookie is present, and is never cached", async () => {
    const yes = await ask("sb-abc123-auth-token=base64-x; theme=dark");
    expect(await yes.json()).toEqual({ signedIn: true });
    expect(yes.headers.get("cache-control")).toBe("private, no-store");

    const no = await ask("theme=dark");
    expect(await no.json()).toEqual({ signedIn: false });
    expect(await (await ask()).json()).toEqual({ signedIn: false });
  });

  it("reveals nothing but the yes or no", async () => {
    const res = await ask("sb-abc123-auth-token=secret-value-123");
    expect(JSON.stringify(await res.json())).not.toContain("secret-value-123");
  });
});
