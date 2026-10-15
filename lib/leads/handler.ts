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

type Body = { ok: true; fields: Record<string, unknown> } | { ok: false; error: "unsupported" | "invalid" };

async function readBody(request: NextRequest): Promise<Body> {
  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  if (type.includes("application/json")) {
    const json: unknown = await request.json().catch(() => null);
    if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, error: "invalid" };
    return { ok: true, fields: json as Record<string, unknown> };
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { ok: false, error: "invalid" };
    const fields: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) if (!(key in fields)) fields[key] = value;
    return { ok: true, fields };
  }
  return { ok: false, error: "unsupported" };
}

export async function handleLeadPost(request: NextRequest, deps: LeadDeps): Promise<NextResponse> {
  if (!isSameOrigin(request.headers)) return failure(request, "forbidden");

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
