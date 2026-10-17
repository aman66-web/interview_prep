import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real route file, with the admin (secret key) client replaced by a fake.
// The handler's own checks are covered in tests/leads.test.ts; this proves the
// route wires them to the leads table.

const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const createAdminClient = vi.fn(() => ({ from }));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

const { POST } = await import("@/app/api/leads/route");

const SITE = "http://localhost:3077";

function post(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return new NextRequest(`${SITE}/api/leads`, {
    method: "POST",
    headers: { origin: SITE, host: "localhost:3077", "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(fields).toString(),
  });
}

beforeEach(() => {
  insert.mockReset();
  from.mockClear();
  createAdminClient.mockClear();
  insert.mockResolvedValue({ error: null });
});

describe("POST /api/leads (the route file)", () => {
  it("saves a valid enquiry through the admin client and redirects with ?sent=1", async () => {
    const res = await POST(post({ org: "Example Careers Service", email: "team@example.ac.uk", size: "More than 100", message: "Hello" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${SITE}/for-universities?sent=1#enquiry`);
    expect(from).toHaveBeenCalledWith("leads");
    expect(insert).toHaveBeenCalledWith({ org: "Example Careers Service", email: "team@example.ac.uk", size: "More than 100", message: "Hello" });
  });

  it("does not touch the database for a honeypot, an invalid or a cross-site post", async () => {
    await POST(post({ org: "Bot", email: "bot@example.com", website: "filled" }));
    await POST(post({ org: "", email: "x" }));
    const cross = await POST(post({ org: "Club", email: "a@example.com" }, { origin: "https://evil.example" }));
    expect(cross.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("answers with a generic error when the insert fails, without logging personal details", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    insert.mockResolvedValue({ error: { code: "XX000", message: "boom" } });
    const res = await POST(post({ org: "Club", email: "private@example.ac.uk", message: "secret plans" }, { accept: "application/json" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "server" });
    const logged = JSON.stringify(errors.mock.calls);
    expect(logged).not.toContain("private@example.ac.uk");
    expect(logged).not.toContain("secret plans");
    errors.mockRestore();
  });

  it("answers with a generic error when the admin client can't be created", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    createAdminClient.mockImplementationOnce(() => {
      throw new Error("Missing or invalid environment variable(s): SUPABASE_SECRET_KEY.");
    });
    const res = await POST(post({ org: "Club", email: "a@example.ac.uk" }));
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("server");
    errors.mockRestore();
  });
});
