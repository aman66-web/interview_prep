import { describe, expect, it } from "vitest";
import { allCases } from "@/lib/content/cases";
import { assembleDebrief } from "@/lib/ai/debrief";
import { planHistory, type ChatMessage } from "@/lib/ai/history";
import { blockedMessage, canStartCase, limitsFor, SESSION_CAPS } from "@/lib/ai/limits";
import { checkMathAnswers, mathsScore, withinTolerance } from "@/lib/ai/maths";
import { CACHE_READ_MULTIPLIER, estimateCostUsd, priceFor, totalInputTokens } from "@/lib/ai/pricing";
import { buildSystemPrompt, buildTurnContent, caseMaterials, debriefSystem, openingMessage, type TurnNotes } from "@/lib/ai/prompt";
import { verifyQuote } from "@/lib/ai/quotes";
import { checkReply, debriefModelSchema, interviewerReplySchema } from "@/lib/ai/schema";
import { applyProposedStage, nextStage, STAGES } from "@/lib/ai/stages";

const bakery = allCases.find((c) => c.slug === "harbourline-bakeries")!;

describe("stages", () => {
  it("run in the order the kit describes", () => {
    expect([...STAGES]).toEqual(["intro", "clarifying", "structure", "analysis", "brainstorm", "synthesis", "debrief"]);
    expect(nextStage("intro")).toBe("clarifying");
    expect(nextStage("synthesis")).toBe("debrief");
    expect(nextStage("debrief")).toBeNull();
  });

  it("accept only the very next stage from the model", () => {
    expect(applyProposedStage("clarifying", "structure")).toBe("structure");
    expect(applyProposedStage("clarifying", "analysis")).toBe("clarifying"); // skipping ahead
    expect(applyProposedStage("analysis", "structure")).toBe("analysis"); // going back
    expect(applyProposedStage("analysis", null)).toBe("analysis");
    expect(applyProposedStage("analysis", "analysis")).toBe("analysis");
    expect(applyProposedStage("clarifying", "debrief")).toBe("clarifying");
  });
});

describe("maths checks (rule 2.9: code decides, not the model)", () => {
  const q = bakery.math.find((m) => m.id === "ingredients-share-of-fall")!; // expected 66.6667, tolerance 2%

  it("accepts answers within the tolerance and rejects the rest", () => {
    expect(withinTolerance(66.7, q.expected, q.tolerance_pct)).toBe(true);
    expect(withinTolerance(65.5, q.expected, q.tolerance_pct)).toBe(true);
    expect(withinTolerance(64, q.expected, q.tolerance_pct)).toBe(false);
    expect(withinTolerance(70, q.expected, q.tolerance_pct)).toBe(false);
    expect(withinTolerance(NaN, q.expected, q.tolerance_pct)).toBe(false);
    expect(withinTolerance(0, 0, 1)).toBe(true); // a right answer of zero needs a zero
    expect(withinTolerance(0.001, 0, 1)).toBe(false);
  });

  it("checks each answer against the case's expected number", () => {
    const checks = checkMathAnswers(bakery, [{ math_id: q.id, value: 66.7 }, { math_id: "total-profit-this-year", value: 12 }], "about 66.7 percent and 12 million");
    expect(checks).toEqual([
      { math_id: q.id, given: 66.7, expected: q.expected, correct: true },
      { math_id: "total-profit-this-year", given: 12, expected: 9.6, correct: false },
    ]);
  });

  it("ignores unknown questions, repeats (last wins) and replies when the candidate gave no number", () => {
    expect(checkMathAnswers(bakery, [{ math_id: "made-up", value: 1 }], "it is 1")).toEqual([]);
    const repeated = checkMathAnswers(bakery, [{ math_id: q.id, value: 10 }, { math_id: q.id, value: 66.7 }], "10, no wait 66.7");
    expect(repeated).toHaveLength(1);
    expect(repeated[0].correct).toBe(true);
    expect(checkMathAnswers(bakery, [{ math_id: q.id, value: 66.7 }], "no numbers in this message at all")).toEqual([]);
    expect(checkMathAnswers(bakery, [{ math_id: q.id, value: Infinity }], "1")).toEqual([]);
  });

  it("turns results into a 1 to 5 score", () => {
    expect(mathsScore([])).toBeNull();
    expect(mathsScore([{ correct: true }, { correct: true }])).toBe(5);
    expect(mathsScore([{ correct: false }, { correct: false }])).toBe(1);
    expect(mathsScore([{ correct: true }, { correct: false }])).toBe(3);
  });
});

describe("cost estimates (rule 2.8)", () => {
  it("prices a call from tokens and the model's published rates", () => {
    // Sonnet 5.5 is $2 in / $10 out per million tokens.
    expect(estimateCostUsd("claude-sonnet-5-5", { input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 })).toBe(2);
    expect(estimateCostUsd("claude-sonnet-5-5", { input: 0, output: 1_000_000, cacheRead: 0, cacheWrite: 0 })).toBe(10);
    // Cached reads cost a tenth, cache writes 1.25x.
    expect(estimateCostUsd("claude-sonnet-5-5", { input: 0, output: 0, cacheRead: 1_000_000, cacheWrite: 0 })).toBeCloseTo(2 * CACHE_READ_MULTIPLIER, 6);
    expect(estimateCostUsd("claude-sonnet-5-5", { input: 0, output: 0, cacheRead: 0, cacheWrite: 1_000_000 })).toBe(2.5);
    expect(estimateCostUsd("claude-opus-5-5", { input: 10_000, output: 1_000, cacheRead: 0, cacheWrite: 0 })).toBeCloseTo(0.04 + 0.02, 6);
  });

  it("never under-estimates a model it does not know", () => {
    const unknown = priceFor("some-future-model");
    for (const known of ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"]) {
      expect(unknown.input).toBeGreaterThanOrEqual(priceFor(known).input);
      expect(unknown.output).toBeGreaterThanOrEqual(priceFor(known).output);
    }
  });

  it("counts every kind of input token", () => {
    expect(totalInputTokens({ input: 1, output: 9, cacheRead: 20, cacheWrite: 300 })).toBe(321);
  });
});

describe("limits (kit sections 4 and 6)", () => {
  it("give free users one case in total and paid users 3 a day and 60 a month", () => {
    expect(limitsFor(false)).toEqual({ maxTotal: 1, maxPerDay: null, maxPerMonth: null });
    expect(limitsFor(true)).toEqual({ maxTotal: null, maxPerDay: 3, maxPerMonth: 60 });
  });

  it("let free users start only the free starter case", () => {
    expect(canStartCase({ free_starter: true }, false)).toBe(true);
    expect(canStartCase({ free_starter: false }, false)).toBe(false);
    expect(canStartCase({ free_starter: false }, true)).toBe(true);
  });

  it("explain each refusal in plain words", () => {
    expect(blockedMessage("total")).toMatch(/free AI interview/);
    expect(blockedMessage("day")).toMatch(/today/);
    expect(blockedMessage("month")).toMatch(/month/);
  });

  it("cap a session at 40 candidate turns", () => {
    expect(SESSION_CAPS.maxTurns).toBe(40);
  });
});

describe("history compaction", () => {
  const make = (n: number, size: number): ChatMessage[] =>
    Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? "assistant" : "user", content: "x".repeat(size) }));

  it("sends everything while it is short", () => {
    const plan = planHistory(make(10, 100), 0, 5000, 6);
    expect(plan.window).toHaveLength(10);
    expect(plan.toFold).toHaveLength(0);
    expect(plan.newCovers).toBe(0);
  });

  it("folds the oldest messages into the summary when too long, keeping the recent ones", () => {
    const plan = planHistory(make(20, 1000), 0, 6500, 6);
    expect(plan.window.length).toBeLessThanOrEqual(6);
    expect(plan.window.length).toBeGreaterThanOrEqual(6);
    expect(plan.toFold.length + plan.window.length).toBe(20);
    expect(plan.newCovers).toBe(plan.toFold.length);
  });

  it("starts after what the summary already covers", () => {
    const messages = make(20, 1000);
    const plan = planHistory(messages, 10, 20_000, 6);
    expect(plan.window).toHaveLength(10);
    expect(plan.toFold).toHaveLength(0);
    expect(plan.newCovers).toBe(10);
  });

  it("never drops below the minimum number of recent messages", () => {
    const plan = planHistory(make(8, 50_000), 0, 100, 6);
    expect(plan.window).toHaveLength(6);
  });
});

describe("quotes", () => {
  const said = ["I would split this into revenue and costs first.", "Dairy looks like the main driver, maybe 70% of the rise."];

  it("keeps a quote the candidate really said (ignoring case, quotes and spacing)", () => {
    expect(verifyQuote('"I would split this into revenue and costs"', said)).toBe('"I would split this into revenue and costs"');
    expect(verifyQuote("dairy looks like  the main driver", said)).not.toBeNull();
  });

  it("allows an ellipsis for a gap in the middle", () => {
    expect(verifyQuote("I would split this ... revenue and costs first", said)).not.toBeNull();
    expect(verifyQuote("revenue and costs ... I would split", said)).toBeNull(); // wrong order
  });

  it("drops invented, paraphrased or too-short quotes", () => {
    expect(verifyQuote("I would start with the price rise", said)).toBeNull();
    expect(verifyQuote("revenue", said)).toBeNull();
    expect(verifyQuote("", said)).toBeNull();
  });
});

describe("debrief assembly", () => {
  const model = debriefModelSchema.parse({
    scores: { structure: 4, analysis: 4, business_judgement: 3, communication: 5, synthesis: 2.6 },
    strengths: [
      { title: "Clear structure", quote: "I would split this into revenue and costs first", detail: "Good start." },
      { title: "Ignored", quote: "something never said", detail: "x" },
      { title: "Third", quote: "", detail: "y" },
      { title: "Fourth", quote: "", detail: "dropped: only three are kept" },
    ],
    fixes: [{ title: "Do the maths aloud", quote: "maybe 70% of the rise", detail: "Show steps.", drill_category: "mental-maths" }],
    summary: " A solid effort. ",
  });
  const said = ["I would split this into revenue and costs first.", "Dairy looks like the main driver, maybe 70% of the rise."];

  it("blends the model's analysis score with the maths code found (half each)", () => {
    const right = [{ math_id: "a", given: 1, expected: 1, correct: true }];
    const wrong = [{ math_id: "a", given: 1, expected: 2, correct: false }];
    expect(assembleDebrief(model, right, said, bakery).scores.analysis_maths).toBe(5); // (4 + 5) / 2 = 4.5 -> 5
    expect(assembleDebrief(model, wrong, said, bakery).scores.analysis_maths).toBe(3); // (4 + 1) / 2 = 2.5 -> 3
    expect(assembleDebrief(model, [], said, bakery).scores.analysis_maths).toBe(4); // no maths recorded: the model's score alone
  });

  it("rounds and limits scores to 1 to 5, and keeps three strengths at most", () => {
    const out = assembleDebrief(model, [], said, bakery);
    expect(out.scores.synthesis).toBe(3);
    expect(out.strengths).toHaveLength(3);
    const wild = debriefModelSchema.parse({ ...model, scores: { structure: 99, analysis: -4, business_judgement: 0, communication: 4.4, synthesis: 1 } });
    const clamped = assembleDebrief(wild, [], said, bakery).scores;
    expect(clamped).toMatchObject({ structure: 5, analysis_maths: 1, business_judgement: 1, communication: 4, synthesis: 1 });
  });

  it("keeps only quotes the candidate really said, and tidies the text", () => {
    const out = assembleDebrief(model, [], said, bakery);
    expect(out.strengths[0].quote).toBe("I would split this into revenue and costs first");
    expect(out.strengths[1].quote).toBeNull();
    expect(out.fixes[0].quote).toBe("maybe 70% of the rise");
    expect(out.summary).toBe("A solid effort.");
  });

  it("records how many maths questions were attempted and right", () => {
    const out = assembleDebrief(model, [{ math_id: "a", given: 1, expected: 1, correct: true }, { math_id: "b", given: 1, expected: 2, correct: false }], said, bakery);
    expect(out.maths).toMatchObject({ attempted: 2, correct: 1, total: bakery.math.length });
  });
});

describe("debrief maths detail", () => {
  it("lists each answer with the question, what was said, the right answer and the working", () => {
    const q = bakery.math[0];
    const model = debriefModelSchema.parse({
      scores: { structure: 3, analysis: 3, business_judgement: 3, communication: 3, synthesis: 3 },
      strengths: [], fixes: [], summary: "ok",
    });
    const out = assembleDebrief(model, [{ math_id: q.id, given: 70, expected: q.expected, correct: false }, { math_id: "unknown", given: 1, expected: 1, correct: true }], ["hi 70"], bakery);
    expect(out.maths.items).toEqual([{ math_id: q.id, question: q.question, given: 70, expected: q.expected, correct: false, working: q.working }]);
  });
});

describe("reply format", () => {
  it("accepts a well-formed reply and rejects malformed ones", () => {
    const good = { reply: "Good question.", next_stage: null, reveal_exhibit_id: null, numeric_answers: [] };
    expect(interviewerReplySchema.safeParse(good).success).toBe(true);
    expect(interviewerReplySchema.safeParse({ ...good, next_stage: "somewhere" }).success).toBe(false);
    expect(interviewerReplySchema.safeParse({ ...good, numeric_answers: [{ math_id: "a", value: "12" }] }).success).toBe(false);
    expect(interviewerReplySchema.safeParse({ reply: "no other fields" }).success).toBe(false);
  });

  it("rejects an empty or enormous reply after the API has answered", () => {
    const base = { next_stage: null, reveal_exhibit_id: null, numeric_answers: [] };
    expect(checkReply({ reply: "   ", ...base })).toBeNull();
    expect(checkReply({ reply: "x".repeat(5000), ...base })).toBeNull();
    expect(checkReply({ reply: "  fine  ", ...base })?.reply).toBe("fine");
  });
});

describe("prompts", () => {
  const notes: TurnNotes = {
    stage: "analysis",
    turnsUsed: 12,
    turnsMax: 40,
    revealedExhibits: ["pl-per-cafe"],
    mathStatus: [{ math_id: "ingredients-share-of-fall", status: "correct" }],
    advanceRequested: false,
    stageJustChanged: false,
    summary: null,
  };

  it("tells the model to stay in role and never reveal the confidential material", () => {
    const system = buildSystemPrompt(bakery);
    expect(system).toMatch(/Stay in role/);
    expect(system).toMatch(/confidential/i);
    expect(system).toMatch(/Never reveal/);
    expect(system).toMatch(/untrusted/);
  });

  it("plays a consultant for consulting cases and a banker for bank case studies", () => {
    expect(buildSystemPrompt(bakery)).toMatch(/senior consultant/);
    const bankCase = { ...bakery, track: "banking" as const };
    const system = buildSystemPrompt(bankCase);
    expect(system).toMatch(/senior banker/);
    expect(system).not.toMatch(/senior consultant/);
    expect(debriefSystem(bankCase)).toMatch(/experienced banker/);
    expect(debriefSystem(bakery)).toMatch(/experienced consulting interviewer/);
  });

  it("is identical every time for a case, so it can be cached", () => {
    expect(buildSystemPrompt(bakery)).toBe(buildSystemPrompt(bakery));
  });

  it("gives the interviewer everything it needs about the case", () => {
    const materials = caseMaterials(bakery);
    for (const f of bakery.facts) expect(materials).toContain(f.answer);
    for (const e of bakery.exhibits) expect(materials).toContain(e.id);
    for (const m of bakery.math) expect(materials).toContain(m.id);
    expect(materials).toContain(bakery.prompt);
  });

  it("puts the changing state and the candidate's words in the turn message, clearly separated", () => {
    const text = buildTurnContent(notes, "I think ingredients are 67% of the fall");
    expect(text).toContain("Current stage: analysis");
    expect(text).toContain("Candidate turns used: 12 of 40");
    expect(text).toContain("Exhibits already shared: pl-per-cafe");
    expect(text).toContain("ingredients-share-of-fall correct");
    expect(text.endsWith("Candidate says: I think ingredients are 67% of the fall")).toBe(true);
  });

  it("opens by presenting the case", () => {
    expect(openingMessage(bakery)).toContain(bakery.prompt);
  });
});
