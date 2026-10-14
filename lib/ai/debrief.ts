import type { Case } from "@/lib/content/schema";
import { mathsScore, type MathCheck } from "./maths";
import { verifyQuote } from "./quotes";
import type { DebriefModelOutput, StoredDebrief } from "./schema";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

/**
 * Combines the model's debrief with what code knows for certain (kit section 6):
 *  - "Analysis & maths" is half the model's judgement of the candidate's analysis
 *    and half the share of maths answers that code found correct. If no maths
 *    answer was recorded, it is the model's judgement alone.
 *  - Every quote must really appear in something the candidate said, otherwise
 *    it is dropped (the feedback stays, the quote does not).
 *  - Three strengths and three fixes at most.
 */
export function assembleDebrief(
  model: DebriefModelOutput,
  maths: MathCheck[],
  candidateMessages: string[],
  c: Pick<Case, "math">,
): StoredDebrief {
  const analysis = clampScore(model.scores.analysis);
  const fromMaths = mathsScore(maths);
  const analysisMaths = fromMaths === null ? analysis : clampScore((analysis + fromMaths) / 2);

  return {
    version: 1,
    scores: {
      structure: clampScore(model.scores.structure),
      analysis_maths: analysisMaths,
      business_judgement: clampScore(model.scores.business_judgement),
      communication: clampScore(model.scores.communication),
      synthesis: clampScore(model.scores.synthesis),
    },
    strengths: model.strengths.slice(0, 3).map((s) => ({
      title: s.title.trim(),
      quote: verifyQuote(s.quote, candidateMessages),
      detail: s.detail.trim(),
    })),
    fixes: model.fixes.slice(0, 3).map((f) => ({
      title: f.title.trim(),
      quote: verifyQuote(f.quote, candidateMessages),
      detail: f.detail.trim(),
      drill_category: f.drill_category,
    })),
    summary: model.summary.trim(),
    maths: {
      attempted: maths.length,
      correct: maths.filter((m) => m.correct).length,
      total: c.math.length,
      items: maths.flatMap((m) => {
        const q = c.math.find((x) => x.id === m.math_id);
        return q ? [{ math_id: m.math_id, question: q.question, given: m.given, expected: m.expected, correct: m.correct, working: q.working }] : [];
      }),
    },
  };
}
