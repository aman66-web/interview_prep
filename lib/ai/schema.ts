import { z } from "zod";
import { DRILL_CATEGORIES } from "@/lib/drills/types";
import { STAGES } from "./stages";

// The shapes the model must answer in. They are given to the API as a JSON
// schema (structured output) and then checked again here with zod, because the
// code never trusts the model's output (kit section 6).

/** One interviewer turn. `reply` comes first so it can be streamed to the candidate as it is written. */
export const interviewerReplySchema = z.object({
  reply: z.string(),
  next_stage: z.enum(STAGES).nullable(),
  reveal_exhibit_id: z.string().nullable(),
  numeric_answers: z.array(z.object({ math_id: z.string(), value: z.number() })),
});
export type InterviewerReply = z.infer<typeof interviewerReplySchema>;

/** Stricter checks applied after the API has returned a reply. */
export function checkReply(reply: InterviewerReply): InterviewerReply | null {
  const text = reply.reply.trim();
  if (text.length === 0 || text.length > 4000) return null;
  return { ...reply, reply: text };
}

const debriefItem = z.object({
  title: z.string(),
  quote: z.string(),
  detail: z.string(),
});

/** The debrief as the model returns it (before code adds the maths results). */
export const debriefModelSchema = z.object({
  scores: z.object({
    structure: z.number(),
    analysis: z.number(),
    business_judgement: z.number(),
    communication: z.number(),
    synthesis: z.number(),
  }),
  strengths: z.array(debriefItem),
  fixes: z.array(debriefItem.extend({ drill_category: z.enum(DRILL_CATEGORIES) })),
  summary: z.string(),
});
export type DebriefModelOutput = z.infer<typeof debriefModelSchema>;

/** What is stored in case_sessions.scores and shown on the debrief page. */
export const storedDebriefSchema = z.object({
  version: z.literal(1),
  scores: z.object({
    structure: z.number().int().min(1).max(5),
    analysis_maths: z.number().int().min(1).max(5),
    business_judgement: z.number().int().min(1).max(5),
    communication: z.number().int().min(1).max(5),
    synthesis: z.number().int().min(1).max(5),
  }),
  strengths: z.array(z.object({ title: z.string(), quote: z.string().nullable(), detail: z.string() })),
  fixes: z.array(
    z.object({ title: z.string(), quote: z.string().nullable(), detail: z.string(), drill_category: z.enum(DRILL_CATEGORIES) }),
  ),
  summary: z.string(),
  maths: z.object({
    attempted: z.number().int().min(0),
    correct: z.number().int().min(0),
    total: z.number().int().min(0),
    /** Each maths answer the candidate gave, checked by code. Shown only once the interview is over. */
    items: z.array(
      z.object({
        math_id: z.string(),
        question: z.string(),
        given: z.number(),
        expected: z.number(),
        correct: z.boolean(),
        working: z.string(),
      }),
    ),
  }),
});
export type StoredDebrief = z.infer<typeof storedDebriefSchema>;
