import { NextResponse } from "next/server";
import { buildAccountExport } from "@/lib/account/export";
import { supabaseExportSource } from "@/lib/account/export-source";
import { getUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// What Google or Apple sent with the sign-in: the sign-in methods, and a name and picture if they gave them.
function providerDetails(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const providers = user.app_metadata?.providers;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  const meta = user.user_metadata ?? {};
  return {
    sign_in_methods: Array.isArray(providers) ? providers.filter((p): p is string => typeof p === "string") : [],
    provider_profile: { name: text(meta.full_name) ?? text(meta.name), picture: text(meta.avatar_url) ?? text(meta.picture) },
  };
}

// Downloads everything we hold about the signed-in user as a JSON file.
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const data = await buildAccountExport(supabaseExportSource(createAdminClient()), {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      ...providerDetails(user),
    });

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="my-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("account export failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "We couldn't prepare your data. Please try again." },
      { status: 500 },
    );
  }
}
