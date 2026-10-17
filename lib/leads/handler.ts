import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/http/same-origin";
import { clientAddress, type RateLimiter } from "./rate-limit";
import { isHoneypotFilled, parseLead, type Lead, type LeadField } from "./schema";
import { LeadStoreError } from "./store-supabase";

// POST /api/leads: a university, club or careers-service enquiry.
//
// It works as a plain HTML form (the answer is a 303 redirect back to the page with
// ?sent=1 or ?error=...) and as a fetch with "Accept: application/json" (the answer
// is JSON), so the form works with or without JavaScript.
//
// Rule 2.7: the email address and message are saved for the founder to reply to,
// and never logged. Errors shown to visitors are generic.

export const LEADS_PAGE = "/for-universities";
export const MAX_BODY_BYTES = 64 * 1024;

export type LeadErrorCode = "invalid" | "busy" | "server" | "forbidden" | "unsupported" | "too-large";

export type LeadDeps = {
  /** Saves the enquiry; throws if it can't. */
  save: (lead: Lead) => Promise<void>;
  limiter?: RateLimiter | null;
};

const STATUS: Record<LeadErrorCode, number> = { invalid: 400, busy: 429, server: 500, forbidden: 403, unsupported: 415, "too-large": 413 };

function wantsJson(request: NextRequest): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

function backTo(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`${LEADS_PAGE}?${query}#enquiry`, request.nextUrl.origin), 303);
}

function success(request: NextRequest) {
  return wantsJson(request) ? NextResponse.json({ ok: true }) : backTo(request, "sent=1");
}

function failure(request: NextRequest, error: LeadErrorCode, fields?: Partial<Record<LeadField, string>>) {
  if (wantsJson(request) || error === "forbidden") {
    return NextResponse.json({ ok: false, error, ...(fields ? { fields } : {}) }, { status: STATUS[error] });
  }
  const names = fields ? Object.keys(fields).join(",") : "";
  return backTo(request, `error=${error}${names ? `&fields=${names}` : ""}`);
}

type Body = { ok: true; fields: Record<string, unknown> } | { ok: false; error: "unsupported" | "invalid" | "too-large" };

/**
 * Reads the body, counting bytes as they arrive, and stops at `max`. The Content-Length
 * check alone isn't enough: a chunked upload has no Content-Length. Null means too big.
 */
async function readLimited(request: NextRequest, max: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return bytes;
}

async function readBody(request: NextRequest): Promise<Body> {
  // The original header, not lower-cased: a multipart boundary is case-sensitive.
  const header = request.headers.get("content-type") ?? "";
  const type = header.toLowerCase();
  const json = type.includes("application/json");
  const form = type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data");
  if (!json && !form) return { ok: false, error: "unsupported" };

  const bytes = await readLimited(request, MAX_BODY_BYTES).catch(() => undefined);
  if (bytes === null) return { ok: false, error: "too-large" };
  if (bytes === undefined) return { ok: false, error: "invalid" };

  if (json) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return { ok: false, error: "invalid" };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, error: "invalid" };
    return { ok: true, fields: parsed as Record<string, unknown> };
  }

  const data = await new Response(bytes as BodyInit, { headers: { "content-type": header } }).formData().catch(() => null);
  if (!data) return { ok: false, error: "invalid" };
  // Text values only (an uploaded file is dropped), first value wins. A prototype-free
  // object, so a field named __proto__ or constructor is just an unknown field.
  const fields: Record<string, unknown> = Object.create(null);
  for (const [key, value] of data.entries()) if (typeof value === "string" && !Object.hasOwn(fields, key)) fields[key] = value;
  return { ok: true, fields };
}

export async function handleLeadPost(request: NextRequest, deps: LeadDeps): Promise<NextResponse> {
  if (!isSameOrigin(request.headers)) return failure(request, "forbidden");

  // A quick refusal when the size is declared; readBody() enforces the limit either way.
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return failure(request, "too-large");

  const address = clientAddress(request.headers);
  if (deps.limiter && address && !deps.limiter.take(address)) return failure(request, "busy");

  const body = await readBody(request);
  if (!body.ok) return failure(request, body.error);

  // A bot filled in the hidden field: say thank you and drop it, so it learns nothing.
  if (isHoneypotFilled(body.fields)) return success(request);

  const parsed = parseLead(body.fields);
  if (!parsed.ok) return failure(request, "invalid", parsed.fields);

  try {
    await deps.save(parsed.lead);
  } catch (error) {
    console.error("leads: could not save an enquiry", { code: error instanceof LeadStoreError ? error.code : "unexpected" });
    return failure(request, "server");
  }
  return success(request);
}
