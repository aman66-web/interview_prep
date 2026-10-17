import type { Case } from "@/lib/content/schema";

// Maths checks (rule 2.9). The model only reads the candidate's numbers; this
// code decides whether each one is right, using the expected answers in the case.

export type MathCheck = { math_id: string; given: number; expected: number; correct: boolean };

export type ExtractedAnswer = { math_id: string; value: number };

/** True when `given` is within `tolerancePct` percent of `expected`. */
export function withinTolerance(given: number, expected: number, tolerancePct: number): boolean {
  if (!Number.isFinite(given) || !Number.isFinite(expected)) return false;
  const allowed = Math.max(1e-9, (Math.abs(expected) * tolerancePct) / 100);
  return Math.abs(given - expected) <= allowed;
}

/**
 * Turns the numbers the model extracted from the candidate's message into
 * checked results. Ignores unknown question ids, repeats (the last one wins) and
 * any reply when the candidate's message contains no digit at all (so the model
 * cannot "find" an answer that was never given).
 */
export function checkMathAnswers(c: Case, answers: ExtractedAnswer[], candidateMessage: string): MathCheck[] {
  if (!/\d/.test(candidateMessage)) return [];
  const byId = new Map<string, MathCheck>();
  for (const answer of answers) {
    const question = c.math.find((m) => m.id === answer.math_id);
    if (!question || !Number.isFinite(answer.value)) continue;
    byId.set(question.id, {
      math_id: question.id,
      given: answer.value,
      expected: question.expected,
      correct: withinTolerance(answer.value, question.expected, question.tolerance_pct),
    });
  }
  return [...byId.values()];
}

/** Share of attempted maths questions answered correctly, as 1 to 5 (null if none were attempted). */
export function mathsScore(checks: Pick<MathCheck, "correct">[]): number | null {
  if (checks.length === 0) return null;
  const share = checks.filter((c) => c.correct).length / checks.length;
  return Math.round(1 + 4 * share);
}
