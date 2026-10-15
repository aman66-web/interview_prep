import { storedDebriefSchema } from "@/lib/ai/schema";
import { siteConfig } from "@/site.config";

// After the retention period (siteConfig.transcriptRetentionDays) an interview's
// transcript is deleted (rule 2.7). Its debrief, kept in case_sessions.scores, also
// holds words from that transcript: quotes of what the candidate said, plus feedback
// and a summary written about it. Those are removed here. What stays is everything
// numeric, so the dashboard and progress charts keep working:
//   * the five skill scores,
//   * the maths results (the numbers given and expected, with the case's own
//     question and working, which come from our case file, not from the candidate),
//   * each strength's and fix's short title and, for fixes, the drill to practise.
// The result still matches storedDebriefSchema, so the debrief page can show it.

export const REDACTED_DETAIL = "The details of this point were deleted with the transcript.";

export function redactedSummary(days: number = siteConfig.transcriptRetentionDays) {
  return `This interview was more than ${days} days old, so its transcript, the quotes from it and the written feedback were deleted, as our privacy policy says. Your scores are kept.`;
}

/** True when the clean-up has already been through this debrief. */
export function isRedacted(scores: unknown): boolean {
  return typeof scores === "object" && scores !== null && typeof (scores as { redacted_at?: unknown }).redacted_at === "string";
}

function onlyNumbers(value: unknown): Record<string, number> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  return out;
}

/** The debrief with every piece of transcript-derived text removed. Safe to run twice. */
export function redactDebrief(
  scores: unknown,
  now: Date = new Date(),
  days: number = siteConfig.transcriptRetentionDays,
): Record<string, unknown> | null {
  if (scores === null || scores === undefined) return null;
  const redacted_at = now.toISOString();

  const parsed = storedDebriefSchema.safeParse(scores);
  if (parsed.success) {
    const d = parsed.data;
    return {
      ...d,
      strengths: d.strengths.map((s) => ({ title: s.title, quote: null, detail: REDACTED_DETAIL })),
      fixes: d.fixes.map((f) => ({ title: f.title, quote: null, detail: REDACTED_DETAIL, drill_category: f.drill_category })),
      summary: redactedSummary(days),
      redacted_at,
    };
  }

  // A shape we do not recognise (an older or broken debrief): keep only plain numbers.
  const record = typeof scores === "object" && !Array.isArray(scores) ? (scores as Record<string, unknown>) : {};
  const maths = onlyNumbers(record.maths);
  return {
    ...(typeof record.version === "number" ? { version: record.version } : {}),
    ...(onlyNumbers(record.scores) ? { scores: onlyNumbers(record.scores) } : {}),
    ...(maths && Object.keys(maths).length > 0 ? { maths } : {}),
    redacted_at,
  };
}
