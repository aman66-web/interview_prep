import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleLeadPost, MAX_BODY_BYTES, type LeadDeps } from "@/lib/leads/handler";
import { fieldsFromQuery, firstQueryValue, knownLeadErrorMessage, LEAD_ERROR_MESSAGES, leadErrorMessage } from "@/lib/leads/messages";
import { clientAddress, createRateLimiter } from "@/lib/leads/rate-limit";
import { GROUP_SIZES, parseLead, stripControl, type Lead } from "@/lib/leads/schema";
import { createLeadStore, LeadStoreError } from "@/lib/leads/store-supabase";

const SITE = "http://localhost:3077";
const EMAIL = "careers@example.ac.uk";

type Init = { body?: string; headers?: Record<string, string> };

function post({ body = "", headers = {} }: Init = {}) {
  return new NextRequest(`${SITE}/api/leads`, {
    method: "POST",
    headers: { origin: SITE, host: "localhost:3077", "content-type": "application/x-www-form-urlencoded", ...headers },
    body,
  });
}

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
const valid = { org: "Example University Consulting Society", email: EMAIL, size: "26 to 50", message: "We have about 40 members.", website: "" };

function fakeDeps(overrides: Partial<LeadDeps> = {}) {
  const saved: Lead[] = [];
  const deps: LeadDeps = {
    save: async (lead) => {
      saved.push(lead);
    },
    ...overrides,
  };
  return { deps, saved };
}

afterEach(() => vi.restoreAllMocks());

describe("leads: the enquiry fields", () => {
  it("accepts a full enquiry and tidies it", () => {
    const parsed = parseLead({ org: "  Example Club  ", email: " Careers@Example.AC.UK ", size: "10 to 25", message: "  Hello  " });
    expect(parsed).toEqual({ ok: true, lead: { org: "Example Club", email: "careers@example.ac.uk", size: "10 to 25", message: "Hello" } });
  });

  it("treats a blank size and message as not given", () => {
    expect(parseLead({ org: "Club", email: EMAIL, size: "", message: "   " })).toEqual({ ok: true, lead: { org: "Club", email: EMAIL, size: null, message: null } });
    expect(parseLead({ org: "Club", email: EMAIL })).toEqual({ ok: true, lead: { org: "Club", email: EMAIL, size: null, message: null } });
  });

  it("needs an organisation and a valid email", () => {
    const parsed = parseLead({ org: "   ", email: "not-an-email" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.fields).sort()).toEqual(["email", "org"]);
      expect(parsed.fields.email).toMatch(/valid email/);
    }
    expect(parseLead({ org: "Club", email: "" }).ok).toBe(false);
  });

  it("keeps to the database's length limits", () => {
    expect(parseLead({ org: "x".repeat(200), email: EMAIL }).ok).toBe(true);
    expect(parseLead({ org: "x".repeat(201), email: EMAIL }).ok).toBe(false);
    expect(parseLead({ org: "Club", email: EMAIL, message: "y".repeat(5000) }).ok).toBe(true);
    expect(parseLead({ org: "Club", email: EMAIL, message: "y".repeat(5001) }).ok).toBe(false);
    expect(parseLead({ org: "Club", email: `${"a".repeat(310)}@example.com` }).ok).toBe(false);
  });

  it("only takes group sizes from the list", () => {
    for (const size of GROUP_SIZES) expect(parseLead({ org: "Club", email: EMAIL, size }).ok).toBe(true);
    for (const size of GROUP_SIZES) expect(size.length).toBeLessThanOrEqual(100);
    const parsed = parseLead({ org: "Club", email: EMAIL, size: "a million" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(Object.keys(parsed.fields)).toEqual(["size"]);
  });

  it("refuses values that are not text", () => {
    expect(parseLead({ org: 42, email: EMAIL }).ok).toBe(false);
    expect(parseLead({ org: "Club", email: ["a@b.co"] }).ok).toBe(false);
  });

  it("removes characters the database can't store", () => {
    expect(stripControl("a\u0000b\u0007c\nd\te")).toBe("abc\nd\te");
    const parsed = parseLead({ org: "Club\u0000", email: EMAIL, message: "Line one\nLine two\u0000" });
    expect(parsed).toMatchObject({ ok: true, lead: { org: "Club", message: "Line one\nLine two" } });
  });
});

describe("leads: POST /api/leads as a plain form", () => {
  it("saves a valid enquiry and sends the visitor back with ?sent=1", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form(valid) }), deps);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${SITE}/for-universities?sent=1#enquiry`);
    expect(saved).toEqual([{ org: valid.org, email: EMAIL, size: "26 to 50", message: valid.message }]);
  });

  it("sends an invalid enquiry back with the fields to fix, and saves nothing", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form({ org: "", email: "nope" }) }), deps);
    expect(res.status).toBe(303);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/for-universities");
    expect(location.searchParams.get("error")).toBe("invalid");
    expect(location.searchParams.get("fields")?.split(",").sort()).toEqual(["email", "org"]);
    expect(location.search).not.toContain("nope"); // what was typed never goes into the address
    expect(saved).toEqual([]);
  });

  it("quietly drops an enquiry with the honeypot filled in, and still says thanks", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form({ ...valid, website: "https://spam.example" }) }), deps);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("sent=1");
    expect(saved).toEqual([]);
  });

  it("drops a honeypot submission even when the rest is invalid", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form({ website: "x" }) }), deps);
    expect(res.headers.get("location")).toContain("sent=1");
    expect(saved).toEqual([]);
  });

  it("refuses a post from another website", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form(valid), headers: { origin: "https://evil.example" } }), deps);
    expect(res.status).toBe(403);
    expect(saved).toEqual([]);
  });

  it("refuses a post with no Origin header", async () => {
    const { deps, saved } = fakeDeps();
    const req = new NextRequest(`${SITE}/api/leads`, {
      method: "POST",
      headers: { host: "localhost:3077", "content-type": "application/x-www-form-urlencoded" },
      body: form(valid),
    });
    expect((await handleLeadPost(req, deps)).status).toBe(403);
    expect(saved).toEqual([]);
  });

  it("reports a database error with a generic message and never logs the email or message", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps } = fakeDeps({
      save: async () => {
        throw new LeadStoreError("23514");
      },
    });
    const res = await handleLeadPost(post({ body: form(valid) }), deps);
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("server");
    expect(errors).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(errors.mock.calls);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(valid.message);
    expect(logged).not.toContain(valid.org);
    expect(logged).toContain("23514");
  });

  it("treats an unexpected failure (such as missing settings) the same way", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps } = fakeDeps({
      save: async () => {
        throw new Error(`Missing SUPABASE_SECRET_KEY for ${EMAIL}`);
      },
    });
    const res = await handleLeadPost(post({ body: form(valid) }), deps);
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("server");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(EMAIL);
  });

  it("refuses a body that is too big before reading it", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form(valid), headers: { "content-length": String(MAX_BODY_BYTES + 1), accept: "application/json" } }), deps);
    expect(res.status).toBe(413);
    expect(saved).toEqual([]);
  });

  it("refuses a body that grows past the limit while it is read, even with no Content-Length (chunked)", async () => {
    const { deps, saved } = fakeDeps();
    const big = JSON.stringify({ org: "Club", email: EMAIL, message: "x".repeat(200 * 1024) });
    const chunked = (body: string, type: string) => {
      const bytes = new TextEncoder().encode(body);
      let at = 0;
      let pulled = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (at >= bytes.length) return controller.close();
          controller.enqueue(bytes.slice(at, at + 8192));
          at += 8192;
          pulled++;
        },
      });
      const req = new NextRequest(`${SITE}/api/leads`, {
        method: "POST",
        headers: { origin: SITE, host: "localhost:3077", "content-type": type, accept: "application/json" },
        body: stream,
        // A stream body needs duplex "half" in Node; Next's RequestInit type doesn't list it.
        duplex: "half",
      } as ConstructorParameters<typeof NextRequest>[1]);
      return { req, pulled: () => pulled };
    };
    const json = chunked(big, "application/json");
    expect(json.req.headers.get("content-length")).toBeNull();
    const res = await handleLeadPost(json.req, deps);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ ok: false, error: "too-large" });
    // It stopped reading soon after the limit instead of taking the whole 200 KB.
    expect(json.pulled() * 8192).toBeLessThanOrEqual(MAX_BODY_BYTES + 2 * 8192);

    const formBody = form({ ...valid, message: "y".repeat(100 * 1024) });
    const plain = await handleLeadPost(chunked(formBody, "application/x-www-form-urlencoded").req, deps);
    expect(plain.status).toBe(413);

    // A small chunked body is read normally.
    const small = await handleLeadPost(chunked(JSON.stringify({ org: "Club", email: EMAIL }), "application/json").req, deps);
    expect(small.status).toBe(200);
    expect(saved).toEqual([{ org: "Club", email: EMAIL, size: null, message: null }]);
  });

  it("refuses a multipart upload with a big file part, and ignores small file parts", async () => {
    const { deps, saved } = fakeDeps();
    const big = new FormData();
    big.set("org", "Club");
    big.set("email", EMAIL);
    big.set("attachment", new Blob(["z".repeat(MAX_BODY_BYTES + 1)]), "big.txt");
    const res = await handleLeadPost(new NextRequest(`${SITE}/api/leads`, { method: "POST", headers: { origin: SITE, host: "localhost:3077", accept: "application/json" }, body: big }), deps);
    expect(res.status).toBe(413);

    const small = new FormData();
    small.set("org", "Club");
    small.set("email", EMAIL);
    small.set("website", new Blob(["not text"]), "honeypot.txt"); // a file is not a filled-in honeypot
    small.set("message", new Blob(["hello"]), "message.txt"); // nor a message
    const ok = await handleLeadPost(new NextRequest(`${SITE}/api/leads`, { method: "POST", headers: { origin: SITE, host: "localhost:3077" }, body: small }), deps);
    expect(ok.status).toBe(303);
    expect(saved).toEqual([{ org: "Club", email: EMAIL, size: null, message: null }]);
  });

  it("treats fields named like object built-ins as unknown fields", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: `__proto__=x&constructor=y&toString=z&${form({ org: "Club", email: EMAIL })}` }), deps);
    expect(new URL(res.headers.get("location")!).searchParams.get("sent")).toBe("1");
    expect(saved).toEqual([{ org: "Club", email: EMAIL, size: null, message: null }]);
  });

  it("refuses a body that is neither a form nor JSON", async () => {
    const { deps } = fakeDeps();
    const res = await handleLeadPost(post({ body: "org=x", headers: { "content-type": "text/plain", accept: "application/json" } }), deps);
    expect(res.status).toBe(415);
  });

  it("uses the first value when a field is sent twice", async () => {
    const { deps, saved } = fakeDeps();
    await handleLeadPost(post({ body: `org=First&org=Second&email=${encodeURIComponent(EMAIL)}` }), deps);
    expect(saved[0]?.org).toBe("First");
  });

  it("accepts multipart form data", async () => {
    const { deps, saved } = fakeDeps();
    const data = new FormData();
    data.set("org", "Club");
    data.set("email", EMAIL);
    const req = new NextRequest(`${SITE}/api/leads`, { method: "POST", headers: { origin: SITE, host: "localhost:3077" }, body: data });
    const res = await handleLeadPost(req, deps);
    expect(res.status).toBe(303);
    expect(saved).toHaveLength(1);
  });
});

describe("leads: POST /api/leads from the page's script (JSON answers)", () => {
  const json = { accept: "application/json" };

  it("answers ok for a valid enquiry", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: form(valid), headers: json }), deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(saved).toHaveLength(1);
  });

  it("names the fields to fix", async () => {
    const { deps } = fakeDeps();
    const res = await handleLeadPost(post({ body: form({ org: "Club", email: "bad" }), headers: json }), deps);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("invalid");
    expect(Object.keys(body.fields)).toEqual(["email"]);
  });

  it("accepts a JSON body too", async () => {
    const { deps, saved } = fakeDeps();
    const res = await handleLeadPost(post({ body: JSON.stringify({ org: "Club", email: EMAIL }), headers: { ...json, "content-type": "application/json" } }), deps);
    expect(res.status).toBe(200);
    expect(saved).toEqual([{ org: "Club", email: EMAIL, size: null, message: null }]);
    const broken = await handleLeadPost(post({ body: "[1,2]", headers: { ...json, "content-type": "application/json" } }), deps);
    expect(broken.status).toBe(400);
  });

  it("answers 500 with a generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps } = fakeDeps({
      save: async () => {
        throw new LeadStoreError(undefined);
      },
    });
    const res = await handleLeadPost(post({ body: form(valid), headers: json }), deps);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "server" });
  });

  it("slows down one address sending many enquiries", async () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now });
    const { deps, saved } = fakeDeps({ limiter });
    const from = (ip: string) => post({ body: form(valid), headers: { ...json, "x-forwarded-for": `${ip}, 10.0.0.1` } });
    expect((await handleLeadPost(from("203.0.113.5"), deps)).status).toBe(200);
    expect((await handleLeadPost(from("203.0.113.5"), deps)).status).toBe(200);
    const third = await handleLeadPost(from("203.0.113.5"), deps);
    expect(third.status).toBe(429);
    expect(await third.json()).toEqual({ ok: false, error: "busy" });
    expect((await handleLeadPost(from("198.51.100.7"), deps)).status).toBe(200); // someone else is fine
    now = 60_000;
    expect((await handleLeadPost(from("203.0.113.5"), deps)).status).toBe(200); // a new window
    expect(saved).toHaveLength(4);
  });
});

describe("leads: the rate limit", () => {
  it("counts per key within a window", () => {
    let now = 1000;
    const limiter = createRateLimiter({ limit: 3, windowMs: 100, now: () => now });
    expect([limiter.take("a"), limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([true, true, true, false]);
    expect(limiter.take("b")).toBe(true);
    now = 1099;
    expect(limiter.take("a")).toBe(false);
    now = 1100;
    expect(limiter.take("a")).toBe(true);
  });

  it("never holds more than its maximum number of addresses", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000_000, now: () => now, maxKeys: 50 });
    for (let i = 0; i < 500; i++) {
      now = i;
      limiter.take(`10.0.${Math.floor(i / 256)}.${i % 256}`);
    }
    expect(limiter.size()).toBeLessThanOrEqual(50);
  });

  it("forgets an address within two windows, even when no one else posts from it", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 5, windowMs: 600_000, now: () => now });
    limiter.take("203.0.113.5");
    now = 599_999;
    limiter.take("198.51.100.7");
    expect(limiter.size()).toBe(2);
    now = 1_199_998; // the first window has ended; the next attempt clears it
    limiter.take("192.0.2.1");
    expect(limiter.size()).toBe(2); // 203.0.113.5 is gone; 198.51.100.7's window is still open
    now = 1_800_000;
    limiter.take("192.0.2.1");
    expect(limiter.size()).toBe(1);
  });

  it("reads the caller's address from the platform's headers", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    expect(clientAddress(h({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientAddress(h({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientAddress(h({}))).toBeNull();
  });
});

describe("leads: saving to the database", () => {
  it("inserts exactly the four columns into leads", async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    await createLeadStore({ from } as never).save({ org: "Club", email: EMAIL, size: null, message: "Hi" });
    expect(from).toHaveBeenCalledWith("leads");
    expect(insert).toHaveBeenCalledWith({ org: "Club", email: EMAIL, size: null, message: "Hi" });
  });

  it("turns a database error into a LeadStoreError carrying only the code", async () => {
    const from = () => ({ insert: async () => ({ error: { code: "42501", message: `denied for ${EMAIL}` } }) });
    const error = await createLeadStore({ from } as never)
      .save({ org: "Club", email: EMAIL, size: null, message: null })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LeadStoreError);
    expect((error as LeadStoreError).code).toBe("42501");
    expect((error as Error).message).not.toContain(EMAIL);
  });
});

describe("leads: messages on the page", () => {
  it("has a message for every error and ignores unknown field names", () => {
    for (const code of ["invalid", "busy", "server", "too-large", "unsupported", "forbidden"]) expect(leadErrorMessage(code)).toBeTruthy();
    expect(leadErrorMessage(undefined)).toBeNull();
    expect(leadErrorMessage("<script>")).toBe(leadErrorMessage("unsupported"));
    // Inherited object keys are not error codes (a crafted ?error= must not crash the page).
    for (const code of ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"]) {
      expect(leadErrorMessage(code), code).toBe(LEAD_ERROR_MESSAGES.unsupported);
      expect(knownLeadErrorMessage(code), code).toBeUndefined();
    }
    expect(knownLeadErrorMessage("busy")).toBe(LEAD_ERROR_MESSAGES.busy);
    expect(knownLeadErrorMessage(undefined)).toBeUndefined();
    expect(fieldsFromQuery("__proto__,constructor,email")).toEqual(["email"]);
    expect(fieldsFromQuery("org,email,evil")).toEqual(["org", "email"]);
    expect(fieldsFromQuery(undefined)).toEqual([]);
  });

  it("copes with a parameter sent twice (?fields=org&fields=email arrives as a list)", () => {
    expect(fieldsFromQuery(["org", "email"])).toEqual(["org", "email"]);
    expect(fieldsFromQuery(["org,email", "email", "toString"])).toEqual(["org", "email"]);
    expect(fieldsFromQuery([])).toEqual([]);
    expect(leadErrorMessage(["busy", "invalid"])).toBe(LEAD_ERROR_MESSAGES.busy);
    expect(leadErrorMessage(["__proto__"])).toBe(LEAD_ERROR_MESSAGES.unsupported);
    expect(leadErrorMessage([])).toBeNull();
    expect(firstQueryValue(["1", "2"])).toBe("1");
    expect(firstQueryValue("1")).toBe("1");
    expect(firstQueryValue(undefined)).toBeUndefined();
  });
});
