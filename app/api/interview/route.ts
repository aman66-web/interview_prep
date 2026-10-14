import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runTurn, type TurnEvent } from "@/lib/ai/interview";
import { isAiConfigured } from "@/lib/ai/llm";
import { createInterviewDeps } from "@/lib/ai/server";
import { getUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

// One turn of the AI interview. The reply streams back as newline-separated JSON
// events (see TurnEvent in lib/ai/interview.ts) so the candidate watches it being
// written. Everything is checked here and in lib/ai before the model is called.

export const maxDuration = 60;

const bodySchema = z.object({
  sessionId: z.uuid(),
  action: z.enum(["message", "advance", "finish"]),
  message: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That request was not understood." }, { status: 400 });

  if (!isAiConfigured()) {
    return NextResponse.json({ error: "The AI interviewer isn't switched on yet." }, { status: 503 });
  }

  const deps = createInterviewDeps(createAdminClient());
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // If the browser goes away mid-reply (a reload, a closed tab), carry on and save the turn anyway:
      // the model has already been paid for, and the candidate sees the reply when they come back.
      let open = true;
      const send = (event: TurnEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      try {
        await runTurn(deps, { sessionId: parsed.data.sessionId, userId: user.id, action: parsed.data.action, message: parsed.data.message }, send);
      } catch (error) {
        console.error("interview: turn failed", error instanceof Error ? error.message : "unknown");
        send({ t: "error", code: "model_error", message: "Something went wrong on our side. Please try again." });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed because the browser left
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
