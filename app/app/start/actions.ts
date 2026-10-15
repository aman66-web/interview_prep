"use server";

import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/access";
import { recordStartOutcome } from "@/lib/analytics/funnel";
import { startInterview } from "@/lib/ai/interview";
import { isAiConfigured } from "@/lib/ai/llm";
import { createInterviewStore } from "@/lib/ai/server";
import { requireUser } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/auth/entitlement";
import { findVisibleCase } from "@/lib/content/cases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Starts (or resumes) an AI interview for the signed-in user, then opens it. */
export async function startInterviewAction(formData: FormData) {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const c = findVisibleCase(slug);
  if (!c) redirect("/cases");
  if (!isAiConfigured()) redirect(`/app/start/${slug}?notice=unavailable`);

  const paid = hasAccess(await getEntitlement(await createClient()), "all_cases");
  const outcome = await startInterview({ store: createInterviewStore(createAdminClient()) }, { userId: user.id, c, paid });
  await recordStartOutcome(createAdminClient, outcome, { userId: user.id, slug }); // funnel: case_started or paywall_viewed

  switch (outcome.status) {
    case "started":
    case "resumed":
      redirect(`/app/interview/${outcome.sessionId}`);
    case "needs_upgrade":
      redirect(`/app/start/${slug}?notice=upgrade`);
    case "blocked":
      redirect(`/app/start/${slug}?notice=${outcome.blocked}`);
  }
}
