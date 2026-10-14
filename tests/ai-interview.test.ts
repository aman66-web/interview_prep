import { describe, expect, it } from "vitest";
import { startInterview, runTurn, type Deps, type TurnEvent, type TurnInput } from "@/lib/ai/interview";
import { isAiConfigured, type LlmCall } from "@/lib/ai/llm";
import { estimateCostUsd } from "@/lib/ai/pricing";
import { storedDebriefSchema } from "@/lib/ai/schema";
import { SESSION_CAPS } from "@/lib/ai/limits";
import { allCases } from "@/lib/content/cases";
import { MemoryStore } from "./helpers/memory-store";
import { json, ScriptedLlm, stageOf, type Scripted } from "./helpers/scripted-llm";

const bakery = allCases.find((c) => c.slug === "harbourline-bakeries")!; // the free starter
const aurora = allCases.find((c) => c.slug === "aurora-kitchen-uk-entry")!; // not the free starter

const reply = (over: Record<string, unknown> = {}) =>
  json({ reply: "Okay.", next_stage: null, reveal_exhibit_id: null, numeric_answers: [], ...over });

const debrief = json({
  scores: { structure: 4, analysis: 4, business_judgement: 3, communication: 4, synthesis: 4 },
  strengths: [
    { title: "Clear hypothesis", quote: "my hypothesis is that costs rose, not revenue", detail: "You committed early." },
    { title: "Used the exhibit", quote: "ingredients explain about 66.7 percent", detail: "Good reading of the data." },
    { title: "Made a recommendation", quote: "I recommend supplier action", detail: "Answer first." },
  ],
  fixes: [
    { title: "Check your arithmetic", quote: "total profit is 12 million", detail: "Re-check units.", drill_category: "mental-maths" },
    { title: "Quote the interviewer", quote: "this was never said by the candidate", detail: "n/a", drill_category: "frameworks" },
    { title: "Structure", quote: "", detail: "Be more MECE.", drill_category: "frameworks" },
  ],
  summary: "A solid, structured attempt with one maths slip.",
});

function setup(script: (call: LlmCall, index: number) => Scripted) {
  const store = new MemoryStore();
  const llm = new ScriptedLlm(script);
  const deps: Deps = { store, llm, findCase: (id) => allCases.find((c) => c.id === id) };
  return { store, llm, deps };
}

async function begin(deps: Deps, userId = "u1", paid = false, c = bakery) {
  const out = await startInterview(deps, { userId, c, paid });
  if (out.status !== "started") throw new Error(`could not start: ${out.status}`);
  return out.sessionId;
}

async function turn(deps: Deps, sessionId: string, message: string | undefined, over: Partial<TurnInput> = {}) {
  const events: TurnEvent[] = [];
  await runTurn(deps, { sessionId, userId: "u1", action: "message", message, ...over }, (e) => events.push(e));
  return events;
}

const states = (events: TurnEvent[]) => events.filter((e): e is Extract<TurnEvent, { t: "state" }> => e.t === "state");
const errors = (events: TurnEvent[]) => events.filter((e): e is Extract<TurnEvent, { t: "error" }> => e.t === "error");
const streamedText = (events: TurnEvent[]) => events.flatMap((e) => (e.t === "delta" ? [e.text] : [])).join("");

describe("a whole interview on the free starter case", () => {
  const candidate = [
    "Hello! Can you tell me a bit about the business?",
    "Thanks. I'm ready to structure it now.",
    "My hypothesis is that costs rose, not revenue. I'd look at revenue then each cost line.",
    "Ingredients explain about 66.7 percent of the fall.",
    "Total profit is 12 million. Let's brainstorm.",
    "I'd renegotiate dairy contracts and raise prices on bread only.",
    "I recommend supplier action first, then a small price rise, because ingredients drive two thirds of the fall.",
  ];
  const interviewer = [
    reply({ reply: "We have 120 company-owned cafés across the UK." }),
    reply({ reply: "Great. Take me through your structure.", next_stage: "structure" }),
    reply({ reply: "Good. Let me share some numbers.", next_stage: "analysis", reveal_exhibit_id: "pl-per-cafe" }),
    reply({ reply: "That matches what I have.", numeric_answers: [{ math_id: "ingredients-share-of-fall", value: 66.7 }] }),
    reply({ reply: "Let's double-check that one. How did you get there?", numeric_answers: [{ math_id: "total-profit-this-year", value: 12 }], next_stage: "brainstorm" }),
    reply({ reply: "Nice. Anything else?", next_stage: "synthesis" }),
    reply({ reply: "Thank you, that's a clear recommendation.", next_stage: "debrief" }),
  ];

  it("works from the first question to a stored, scored debrief", async () => {
    let n = 0;
    const { store, llm, deps } = setup((call) => (call.purpose === "debrief" ? debrief : interviewer[n++]));
    const sessionId = await begin(deps);
    const all: TurnEvent[] = [];
    const stageAfter: string[] = [];

    for (const message of candidate) {
      const events = await turn(deps, sessionId, message);
      all.push(...events);
      expect(errors(events)).toEqual([]);
      stageAfter.push(states(events).at(-1)!.stage);
      // What the candidate sees streaming in is the saved reply, word for word.
      const saved = (await store.listMessages(sessionId)).at(-1) ?? { content: "" };
      if (stageAfter.length < candidate.length) expect(streamedText(events)).toBe(saved.content);
    }

    // The stages advance exactly as the model asked, one at a time, ending in the debrief.
    expect(stageAfter).toEqual(["clarifying", "structure", "analysis", "analysis", "brainstorm", "synthesis", "debrief"]);

    const session = (await store.getSession(sessionId))!;
    expect(session.turns).toBe(7);
    expect(session.stage).toBe("debrief");
    expect(session.completed_at).not.toBeNull();
    expect(session.revealed_exhibits).toEqual(["pl-per-cafe"]);

    // 1 opening message + 7 candidate messages + 7 interviewer replies.
    const messages = await store.listMessages(sessionId);
    expect(messages).toHaveLength(15);
    expect(messages[0].role).toBe("assistant");
    expect(messages.filter((m) => m.role === "user").map((m) => m.content)).toEqual(candidate);

    // Maths was checked by code: one right, one wrong.
    const maths = await store.getMathChecks(sessionId);
    expect(maths.map((m) => [m.math_id, m.correct])).toEqual([
      ["ingredients-share-of-fall", true],
      ["total-profit-this-year", false],
    ]);

    // The debrief: valid, quotes checked against what the candidate really said, maths from code.
    const stored = storedDebriefSchema.parse(session.scores);
    expect(stored.scores.analysis_maths).toBe(4); // (4 from the model + 3 from one-of-two maths right) / 2 = 3.5 -> 4
    expect(stored.strengths).toHaveLength(3);
    expect(stored.strengths[0].quote).toBe("my hypothesis is that costs rose, not revenue");
    expect(stored.fixes[0].quote).toBe("total profit is 12 million");
    expect(stored.fixes[1].quote).toBeNull(); // the model invented this quote
    expect(stored.fixes[2].quote).toBeNull();
    expect(stored.maths).toMatchObject({ attempted: 2, correct: 1, total: bakery.math.length });
    expect(stored.maths.items.map((m) => [m.math_id, m.correct])).toEqual([
      ["ingredients-share-of-fall", true],
      ["total-profit-this-year", false],
    ]);
    expect(session.summary).toBe("A solid, structured attempt with one maths slip.");

    // Every model call was logged with a cost estimate (rule 2.8): 7 turns + 1 debrief.
    expect(llm.calls.map((c) => c.purpose)).toEqual([...Array(7).fill("turn"), "debrief"]);
    expect(store.usage).toHaveLength(8);
    for (const u of store.usage) {
      expect(u).toMatchObject({ userId: "u1", sessionId, inputTokens: 1500, outputTokens: 120 });
      expect(u.costUsd).toBeCloseTo(estimateCostUsd("claude-sonnet-5-5", { input: 1500, output: 120, cacheRead: 0, cacheWrite: 0 }), 6);
    }

    // The candidate never receives an answer key, only the exhibit's numbers.
    const everything = JSON.stringify(all);
    expect(everything).not.toContain(bakery.exhibits[0].insight);
    expect(everything).not.toContain(bakery.exhibits[0].reveal_hint);
    expect(everything).not.toContain("expected");
    for (const m of bakery.math) expect(everything).not.toContain(m.working);
    const lastState = states(all).filter((s) => s.exhibits.length > 0).at(-1)!;
    expect(lastState.exhibits[0]).toEqual({
      id: "pl-per-cafe",
      title: bakery.exhibits[0].title,
      kind: "table",
      columns: bakery.exhibits[0].data.columns,
      rows: bakery.exhibits[0].data.rows,
    });
    expect(Object.keys(lastState.exhibits[0]).sort()).toEqual(["columns", "id", "kind", "rows", "title"]);
  });

  it("sends the same system prompt every turn, and well-formed conversations", async () => {
    let n = 0;
    const { llm, deps } = setup((call) => (call.purpose === "debrief" ? debrief : interviewer[n++]));
    const sessionId = await begin(deps);
    for (const message of candidate.slice(0, 4)) await turn(deps, sessionId, message);

    const turns = llm.calls.filter((c) => c.purpose === "turn");
    expect(new Set(turns.map((c) => c.system)).size).toBe(1); // stable, so it can be cached
    for (const call of turns) {
      const roles = call.messages.map((m) => m.role);
      expect(roles[0]).toBe("user");
      expect(roles.at(-1)).toBe("user");
      roles.forEach((role, i) => i > 0 && expect(role).not.toBe(roles[i - 1]));
      expect(call.maxTokens).toBe(SESSION_CAPS.maxReplyTokens);
    }
    // The candidate's latest words reach the model after the "Candidate says:" marker.
    expect(turns[3].messages.at(-1)!.content.endsWith(`Candidate says: ${candidate[3]}`)).toBe(true);
  });
});

describe("starting an interview (kit sections 4 and 6)", () => {
  it("lets a free user start the free starter once, and resume it, but not start a second", async () => {
    const { store, deps } = setup(() => reply());
    const first = await startInterview(deps, { userId: "u1", c: bakery, paid: false });
    expect(first.status).toBe("started");
    const again = await startInterview(deps, { userId: "u1", c: bakery, paid: false });
    expect(again).toEqual({ status: "resumed", sessionId: (first as { sessionId: string }).sessionId });

    // Finish it, and the free allowance is gone.
    const session = store.sessions.get((first as { sessionId: string }).sessionId)!;
    session.completed_at = new Date().toISOString();
    expect(await startInterview(deps, { userId: "u1", c: bakery, paid: false })).toEqual({ status: "blocked", blocked: "total" });
  });

  it("keeps the other cases for paid users", async () => {
    const { deps } = setup(() => reply());
    expect(await startInterview(deps, { userId: "free", c: aurora, paid: false })).toEqual({ status: "needs_upgrade" });
    expect((await startInterview(deps, { userId: "paid", c: aurora, paid: true })).status).toBe("started");
  });

  it("gives paid users 3 interviews a day", async () => {
    const { store, deps } = setup(() => reply());
    for (const c of allCases.slice(0, 3)) {
      const out = await startInterview(deps, { userId: "paid", c, paid: true });
      expect(out.status).toBe("started");
      store.sessions.get((out as { sessionId: string }).sessionId)!.completed_at = new Date().toISOString();
    }
    expect(await startInterview(deps, { userId: "paid", c: allCases[3], paid: true })).toEqual({ status: "blocked", blocked: "day" });
    // Another user is not affected.
    expect((await startInterview(deps, { userId: "someone-else", c: allCases[3], paid: true })).status).toBe("started");
  });

  it("opens by presenting the case", async () => {
    const { store, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    const [opening] = await store.listMessages(sessionId);
    expect(opening.role).toBe("assistant");
    expect(opening.content).toContain(bakery.prompt);
  });
});

describe("the rules the code enforces, whatever the model says", () => {
  it("lets the model move on only one stage at a time", async () => {
    const proposals = ["analysis", "structure", "analysis", "structure"];
    let n = 0;
    const { store, deps } = setup(() => reply({ next_stage: proposals[n++] }));
    const sessionId = await begin(deps);
    const stages: string[] = [];
    for (let i = 0; i < 4; i++) stages.push(states(await turn(deps, sessionId, `message ${i + 1}`)).at(-1)!.stage);
    // intro -> clarifying (automatic); "analysis" skips ahead (ignored); "structure" is next (accepted);
    // "analysis" is next (accepted); "structure" goes back (ignored).
    expect(stages).toEqual(["clarifying", "structure", "analysis", "analysis"]);
    expect((await store.getSession(sessionId))!.stage).toBe("analysis");
  });

  it("shows an exhibit only in the analysis stage, once, and only a real one", async () => {
    const script = [
      reply({ reveal_exhibit_id: "pl-per-cafe" }), // clarifying: too early
      reply({ next_stage: "structure" }),
      reply({ next_stage: "analysis", reveal_exhibit_id: "pl-per-cafe" }), // moving into analysis: allowed
      reply({ reveal_exhibit_id: "pl-per-cafe" }), // already shown
      reply({ reveal_exhibit_id: "made-up-exhibit" }), // not in this case
      reply({ reveal_exhibit_id: "ingredients-by-category" }), // a second real one
    ];
    let n = 0;
    const { store, deps } = setup(() => script[n++]);
    const sessionId = await begin(deps);
    const shown: string[][] = [];
    for (let i = 0; i < script.length; i++) shown.push(states(await turn(deps, sessionId, `message ${i + 1}`)).at(-1)!.exhibits.map((e) => e.id));
    expect(shown).toEqual([
      [],
      [],
      ["pl-per-cafe"],
      ["pl-per-cafe"],
      ["pl-per-cafe"],
      ["pl-per-cafe", "ingredients-by-category"],
    ]);
    expect((await store.getSession(sessionId))!.revealed_exhibits).toEqual(["pl-per-cafe", "ingredients-by-category"]);
  });

  it("records maths only for real questions and only when the candidate gave a number", async () => {
    const script = [
      reply({ numeric_answers: [{ math_id: "ingredients-share-of-fall", value: 66.7 }] }), // candidate message has no digits
      reply({ numeric_answers: [{ math_id: "no-such-question", value: 5 }] }),
      reply({ numeric_answers: [{ math_id: "ingredients-share-of-fall", value: 66.7 }] }),
    ];
    let n = 0;
    const { store, deps } = setup(() => script[n++]);
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "Ingredients explain the fall"); // no digits
    await turn(deps, sessionId, "It is 5");
    expect(await store.getMathChecks(sessionId)).toEqual([]);
    await turn(deps, sessionId, "It is 66.7 percent");
    expect(await store.getMathChecks(sessionId)).toHaveLength(1);
  });

  it("includes the candidate's request to move on, and moves the stage itself", async () => {
    const { llm, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, undefined, { action: "advance" });
    expect(states(events).at(-1)!.stage).toBe("structure"); // intro -> clarifying -> structure
    const sent = llm.calls[0].messages.at(-1)!.content;
    expect(sent).toContain("Current stage: structure");
    expect(sent).toContain("chose the 'Move to next stage' button");
    const saved = await deps.store.listMessages(sessionId);
    expect(saved.at(-2)).toEqual({ role: "user", content: "(I'd like to move on to the next stage.)" });
  });

  it("finishes the interview if the candidate moves on from the recommendation stage", async () => {
    const { store, deps, llm } = setup((call) => (call.purpose === "debrief" ? debrief : reply()));
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "Hello there, 1 question");
    store.sessions.get(sessionId)!.stage = "synthesis";
    const events = await turn(deps, sessionId, undefined, { action: "advance" });
    expect(states(events).at(-1)).toMatchObject({ stage: "debrief", finished: true });
    expect(llm.calls.at(-1)!.purpose).toBe("debrief");
    expect((await store.getSession(sessionId))!.completed_at).not.toBeNull();
  });
});

describe("when the model's reply cannot be read (kit section 6)", () => {
  it("retries once, invisibly, when nothing had reached the candidate", async () => {
    const { store, llm, deps } = setup((_call, i) => (i === 0 ? "this is not json at all {" : reply({ reply: "Second try works." })));
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, "Hello");
    expect(llm.calls.map((c) => c.purpose)).toEqual(["turn", "retry"]);
    expect(streamedText(events)).toBe("Second try works.");
    expect(store.usage).toHaveLength(2); // both attempts are paid for, so both are logged
    expect((await store.listMessages(sessionId)).at(-1)!.content).toBe("Second try works.");
  });

  it("falls back to the text already streamed when the reply is cut off, without retrying", async () => {
    const { store, llm, deps } = setup(() => ({ text: '{"reply":"Here is a long thought that gets cut', stopReason: "max_tokens" }));
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, "Hello");
    expect(llm.calls).toHaveLength(1);
    expect(streamedText(events)).toBe("Here is a long thought that gets cut");
    expect((await store.listMessages(sessionId)).at(-1)!.content).toBe("Here is a long thought that gets cut");
    expect((await store.getSession(sessionId))!.stage).toBe("clarifying");
  });

  it("uses plain prose if the model ignores the format twice, and an apology if it wrote broken JSON", async () => {
    const prose = setup(() => "Good question. Take a moment to think about it.");
    const a = await begin(prose.deps);
    expect(streamedText(await turn(prose.deps, a, "Hello"))).toBe("Good question. Take a moment to think about it.");
    expect(prose.llm.calls).toHaveLength(2);

    const broken = setup(() => '{"oops": true}');
    const b = await begin(broken.deps);
    expect(streamedText(await turn(broken.deps, b, "Hello"))).toMatch(/lost my train of thought/);
  });

  it("answers a refusal in role, without retrying", async () => {
    const { llm, deps } = setup(() => ({ text: "", stopReason: "refusal" }));
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, "Hello");
    expect(llm.calls).toHaveLength(1);
    expect(streamedText(events)).toMatch(/get back to the case/);
  });

  it("changes nothing and says so when the model call fails", async () => {
    const { store, deps } = setup(() => ({ text: "", throws: true }));
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, "Hello");
    expect(errors(events)).toHaveLength(1);
    expect(errors(events)[0].code).toBe("model_error");
    expect(errors(events)[0].message).toMatch(/not sent/);
    expect((await store.getSession(sessionId))!.turns).toBe(0);
    expect(await store.listMessages(sessionId)).toHaveLength(1); // only the opening message
  });

  it("does not fail the turn if usage logging fails", async () => {
    const { store, deps } = setup(() => reply({ reply: "Fine." }));
    store.logUsage = async () => {
      throw new Error("database down");
    };
    const sessionId = await begin(deps);
    const events = await turn(deps, sessionId, "Hello");
    expect(errors(events)).toEqual([]);
    expect(streamedText(events)).toBe("Fine.");
  });
});

describe("limits and protection", () => {
  it("rejects empty and over-long messages without calling the model", async () => {
    const { llm, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    expect(errors(await turn(deps, sessionId, "   "))[0].code).toBe("empty");
    expect(errors(await turn(deps, sessionId, "x".repeat(SESSION_CAPS.maxMessageChars + 1)))[0].code).toBe("too_long");
    expect(llm.calls).toHaveLength(0);
  });

  it("only lets a session's owner talk to it", async () => {
    const { llm, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    expect(errors(await turn(deps, sessionId, "Hello", { userId: "someone-else" }))[0].code).toBe("not_found");
    expect(errors(await turn(deps, "00000000-0000-0000-0000-999999999999", "Hello"))[0].code).toBe("not_found");
    expect(llm.calls).toHaveLength(0);
  });

  it("reports a finished session as finished, without calling the model", async () => {
    const { store, llm, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    store.sessions.get(sessionId)!.completed_at = new Date().toISOString();
    expect(states(await turn(deps, sessionId, "Hello")).at(-1)).toMatchObject({ finished: true });
    expect(llm.calls).toHaveLength(0);
  });

  it("wraps up with a debrief when the turn limit is reached", async () => {
    const { store, deps, llm } = setup((call) => (call.purpose === "debrief" ? debrief : reply()));
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "First message with 1 number");
    store.sessions.get(sessionId)!.turns = SESSION_CAPS.maxTurns;
    const events = await turn(deps, sessionId, "One more please");
    expect(events.some((e) => e.t === "notice")).toBe(true);
    expect(states(events).at(-1)).toMatchObject({ finished: true });
    expect(llm.calls.filter((c) => c.purpose === "turn")).toHaveLength(1); // no extra reply was bought
  });

  it("wraps up when a session has used its token allowance", async () => {
    const { store, deps, llm } = setup((call) => (call.purpose === "debrief" ? debrief : reply()));
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "First message");
    store.extraTokens = SESSION_CAPS.maxTotalTokens;
    const events = await turn(deps, sessionId, "Second message");
    expect(states(events).at(-1)).toMatchObject({ finished: true });
    expect(llm.calls.filter((c) => c.purpose === "turn")).toHaveLength(1);
  });

  it("refuses to save a turn that crossed with another one", async () => {
    const { store, deps } = setup(() => reply());
    const sessionId = await begin(deps);
    store.loseNextCommit = true;
    const events = await turn(deps, sessionId, "Hello");
    expect(errors(events)[0].code).toBe("busy");
    expect((await store.getSession(sessionId))!.turns).toBe(0);
  });
});

describe("long conversations are summarised, not cut off", () => {
  async function longSession() {
    const script = (call: LlmCall) => (call.purpose === "summary" ? "SUMMARY OF EARLIER TURNS" : reply({ reply: "Noted." }));
    const { store, deps, llm } = setup(script);
    const sessionId = await begin(deps);
    const list = await store.listMessages(sessionId);
    for (let i = 0; i < 30; i++) list.push({ role: i % 2 === 0 ? "user" : "assistant", content: `message ${i} ${"y".repeat(1500)}` });
    store.messages.set(sessionId, list);
    store.sessions.get(sessionId)!.turns = 15;
    return { store, deps, llm, sessionId };
  }

  it("folds older turns into a summary once the transcript is too long, and remembers what it covers", async () => {
    const { store, llm, deps, sessionId } = await longSession();
    await turn(deps, sessionId, "Next message");
    expect(llm.calls.map((c) => c.purpose)).toEqual(["summary", "turn"]);
    const session = (await store.getSession(sessionId))!;
    expect(session.summary).toBe("SUMMARY OF EARLIER TURNS");
    expect(session.summary_covers).toBeGreaterThan(0);

    const sent = llm.calls[1].messages;
    expect(sent.reduce((n, m) => n + m.content.length, 0)).toBeLessThan(SESSION_CAPS.maxHistoryChars + 5000);
    expect(sent.at(-1)!.content).toContain("Summary of the earlier conversation: SUMMARY OF EARLIER TURNS");
  });

  it("does not summarise again on the next turn", async () => {
    const { llm, deps, sessionId } = await longSession();
    await turn(deps, sessionId, "Next message");
    await turn(deps, sessionId, "And another");
    expect(llm.calls.map((c) => c.purpose)).toEqual(["summary", "turn", "turn"]);
  });

  it("carries on with the longer history if summarising fails", async () => {
    const script = (call: LlmCall): Scripted => (call.purpose === "summary" ? { text: "", throws: true } : reply({ reply: "Noted." }));
    const { store, deps, llm } = setup(script);
    const sessionId = await begin(deps);
    const list = await store.listMessages(sessionId);
    for (let i = 0; i < 30; i++) list.push({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i} ${"y".repeat(1500)}` });
    store.messages.set(sessionId, list);
    const events = await turn(deps, sessionId, "Next message");
    expect(errors(events)).toEqual([]);
    expect(llm.calls.map((c) => c.purpose)).toEqual(["summary", "turn"]);
    expect((await store.getSession(sessionId))!.summary).toBeNull();
  });
});

describe("the debrief", () => {
  it("needs the candidate to have said something", async () => {
    const { deps } = setup(() => debrief);
    const sessionId = await begin(deps);
    expect(errors(await turn(deps, sessionId, undefined, { action: "finish" }))[0].code).toBe("too_few_turns");
  });

  it("can be asked for at any time with Finish", async () => {
    const { store, deps } = setup((call) => (call.purpose === "debrief" ? debrief : reply()));
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "I would start with revenue");
    const events = await turn(deps, sessionId, undefined, { action: "finish" });
    expect(states(events).at(-1)).toMatchObject({ stage: "debrief", finished: true });
    expect((await store.getSession(sessionId))!.scores).toBeTruthy();
  });

  it("retries once, then leaves the interview open so the candidate can press Finish again", async () => {
    let attempts = 0;
    const { store, deps, llm } = setup((call) => {
      if (call.purpose !== "debrief") return reply();
      attempts++;
      return attempts <= 2 ? "not a debrief" : debrief;
    });
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "I would start with revenue");

    const failed = await turn(deps, sessionId, undefined, { action: "finish" });
    expect(errors(failed)[0].code).toBe("debrief_failed");
    expect(llm.calls.filter((c) => c.purpose === "debrief")).toHaveLength(2);
    expect((await store.getSession(sessionId))!.completed_at).toBeNull();

    const retried = await turn(deps, sessionId, undefined, { action: "finish" });
    expect(states(retried).at(-1)).toMatchObject({ finished: true });
  });

  it("is never shown the candidate's quotes unless they are real (no invented quotes reach the page)", async () => {
    const { store, deps } = setup((call) => (call.purpose === "debrief" ? debrief : reply()));
    const sessionId = await begin(deps);
    await turn(deps, sessionId, "I would start with revenue and then costs");
    await turn(deps, sessionId, undefined, { action: "finish" });
    const stored = storedDebriefSchema.parse((await store.getSession(sessionId))!.scores);
    for (const item of [...stored.strengths, ...stored.fixes]) expect(item.quote).toBeNull(); // none of the scripted quotes were said
  });
});

describe("configuration", () => {
  it("says the interviewer is available only when a key and a model are set", () => {
    const keep = { key: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL };
    try {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_MODEL;
      expect(isAiConfigured()).toBe(false);
      process.env.ANTHROPIC_API_KEY = "x";
      expect(isAiConfigured()).toBe(false);
      process.env.ANTHROPIC_MODEL = "claude-sonnet-5-5";
      expect(isAiConfigured()).toBe(true);
      process.env.ANTHROPIC_API_KEY = "   ";
      expect(isAiConfigured()).toBe(false);
    } finally {
      if (keep.key === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = keep.key;
      if (keep.model === undefined) delete process.env.ANTHROPIC_MODEL;
      else process.env.ANTHROPIC_MODEL = keep.model;
    }
  });

  it("is only ever reached through lib/ai (stageOf helper sanity)", () => {
    expect(stageOf({ messages: [{ role: "user", content: "x\nCurrent stage: analysis (Analysis)" }] } as LlmCall)).toBe("analysis");
  });
});
