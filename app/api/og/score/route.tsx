import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { cardView, siteHost } from "@/lib/share/card";
import { IMAGE_SIZE, ScoreCardImage } from "@/lib/share/images";
import { shareSigningKey, verifyShareToken } from "@/lib/share/token";

// The share-card picture (1200 x 630), drawn from a signed token: /api/og/score?t=<token>.
// Everything on it comes from the token, which holds no personal data unless the
// person chose to add a first name. A token can never change, so the picture is cached.

export async function GET(request: NextRequest) {
  const card = verifyShareToken(request.nextUrl.searchParams.get("t"), shareSigningKey());
  if (!card) {
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  return new ImageResponse(<ScoreCardImage view={cardView(card)} host={siteHost(request.nextUrl.origin)} />, {
    ...IMAGE_SIZE,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
