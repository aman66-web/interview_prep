import { NextResponse } from "next/server";
import { buildAccountExport } from "@/lib/account/export";
import { supabaseExportSource } from "@/lib/account/export-source";
import { getUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

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
