import { z } from "zod";

// The case file format (docs/CONTENT.md). Cases live in content/cases/*.json.
// `.strict()` everywhere so a typo in a field name is an error, not silently ignored.

const text = z.string().trim().min(1);
const slugLike = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use lowercase letters, numbers and hyphens");

export const CASE_TYPES = [
  "profitability",
  "market_entry",
  "market_sizing",
  "m_and_a",
  "pricing",
  "growth",
  "operations",
  "other",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

const exhibitSchema = z
  .object({
    id: slugLike,
    title: text,
    kind: z.enum(["table", "bar", "line"]),
    data: z
      .object({
        columns: z.array(text).min(2),
        rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1),
      })
      .strict(),
    reveal_hint: text, // what the candidate has to ask for to see this exhibit
    insight: text, // what the exhibit shows (an answer key: never sent to browsers)
  })
  .strict()
  .refine((e) => e.data.rows.every((row) => row.length === e.data.columns.length), {
    message: "every row must have one value per column",
    path: ["data", "rows"],
  });

// Where a number used in the maths comes from, so tests can prove the exhibit
// and the maths agree (P2 addition to the kit's format; optional).
const inputSourceSchema = z
  .object({
    input: text,
    exhibit_id: slugLike,
    row: z.number().int().min(0),
    column: text,
  })
  .strict();

const mathSchema = z
  .object({
    id: slugLike,
    question: text,
    inputs: z.record(z.string(), z.number()),
    expression: text,
    expected: z.number(),
    tolerance_pct: z.number().positive().max(50),
    working: text,
    input_sources: z.array(inputSourceSchema).optional(),
  })
  .strict();

export const caseSchema = z
  .object({
    id: slugLike,
    slug: slugLike,
    title: text,
    track: z.literal("consulting"),
    type: z.enum(CASE_TYPES),
    industry: text,
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    style: z.enum(["interviewer_led", "candidate_led"]),
    est_minutes: z.number().int().min(10).max(60),
    prompt: text,
    facts: z.array(z.object({ question_topic: text, answer: text }).strict()).min(6),
    structure_rubric: z
      .object({
        key_buckets: z.array(text).min(3),
        good_signs: z.array(text).min(3),
        red_flags: z.array(text).min(2),
      })
      .strict(),
    exhibits: z.array(exhibitSchema),
    math: z.array(mathSchema),
    brainstorm: z
      .object({ question: text, idea_bank: z.array(text).min(6) })
      .strict(),
    synthesis_rubric: z
      .object({ must_mention: z.array(text).min(2), good_signs: z.array(text).min(2) })
      .strict(),
    model_answer_outline: z.array(text).min(4), // paid only
    free_starter: z.boolean().default(false),
    free_preview: z.boolean().default(false),
    status: z.enum(["draft", "reviewed"]),
    reviewed_by: z.string().trim().min(1).nullable(),
    reviewed_on: z.iso.date().nullable(),
  })
  .strict()
  .refine((c) => c.status === "draft" || (c.reviewed_by !== null && c.reviewed_on !== null), {
    message: "a reviewed case needs reviewed_by and reviewed_on",
    path: ["status"],
  });

export type Case = z.infer<typeof caseSchema>;
export type Exhibit = Case["exhibits"][number];
export type MathQuestion = Case["math"][number];
