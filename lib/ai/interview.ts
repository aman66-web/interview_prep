import type { Case } from "@/lib/content/schema";
import { assembleDebrief } from "./debrief";
import { planHistory, type ChatMessage } from "./history";
import { canStartCase, limitsFor, SESSION_CAPS, type Blocked } from "./limits";
import type { Llm, LlmCall, LlmMessage, LlmResult } from "./llm";
import { checkMathAnswers, type MathCheck } from "./maths";
import { estimateCostUsd, totalInputTokens } from "./pricing";
import {
  buildPastCandidateContent,
  buildSummaryRequest,
  buildSystemPrompt,
  buildTurnContent,
  casePresentation,
  debriefRequest,
  debriefSystem,
  openingMessage,
  showsCase,
  SUMMARY_SYSTEM,
  type TurnNotes,
  warmupOpening,
} from "./prompt";
import { ReplyExtractor } from "./reply-stream";
import { checkReply, debriefModelSchema, interviewerReplySchema, type DebriefModelOutput, type InterviewerReply } from "./schema";
import { applyProposedStage, nextStage, type Stage } from "./stages";
import type { InterviewStore, SessionRow } from "./store";

// Runs the interview: one function per thing that happens (start, a turn, finish).
// Every model call goes through `call()` below, which logs usage and cost to
// ai_usage (rule 2.8). The stage rules, caps, maths checks and scoring all live
// here in code; the model only writes words and reads numbers.

export type Deps = {
  store: InterviewStore;
  llm: Llm;
  findCase: (caseId: string) => Case | undefined;
};

export type PublicExhibitData = {
  id: string;
  title: string;
  kind: "table" | "bar" | "line";
  columns: string[];
  rows: (string | number)[][];
};

export type ErrorCode =
  | "not_found"
  | "empty"
  | "too_long"
  | "too_few_turns"
  | "busy"
  | "model_error"
  | "debrief_failed";

export type TurnEvent =
  | { t: "delta"; text: string }
  | { t: "notice"; message: string }
  | { t: "state"; stage: Stage; turns: number; turnsMax: number; exhibits: PublicExhibitData[]; finished: boolean }
  | { t: "error"; code: ErrorCode; message: string };

export type TurnInput = {
  sessionId: string;
  userId: string;
  action: "message" | "advance" | "finish";
  message?: string;
};

/** The exhibit data a candidate may see: the numbers, never the insight or the hint. */
export function toPublicExhibit(c: Case, id: string): PublicExhibitData | null {
  const e = c.exhibits.find((x) => x.id === id);
  return e ? { id: e.id, title: e.title, kind: e.kind, columns: e.data.columns, rows: e.data.rows } : null;
}

export function publicExhibits(c: Case, ids: string[]): PublicExhibitData[] {
  return ids.flatMap((id) => {
    const e = toPublicExhibit(c, id);
    return e ? [e] : [];
  });
}

// ---------------------------------------------------------------------------
// Calling the model, with usage logging
// ---------------------------------------------------------------------------

async function call(deps: Deps, userId: string, sessionId: string | null, spec: LlmCall): Promise<LlmResult> {
  const result = await deps.llm.complete(spec);
  try {
    await deps.store.logUsage({
      userId,
      sessionId,
      inputTokens: totalInputTokens(result.usage),
      outputTokens: result.usage.output,
      costUsd: estimateCostUsd(result.model, result.usage),
    });
  } catch (error) {
    // The reply was already paid for; do not fail the turn because logging failed.
    console.error("ai usage: could not log", error instanceof Error ? error.message : "unknown");
  }
  return result;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function parseReply(result: LlmResult): InterviewerReply | null {
  if (result.stopReason === "refusal" || result.stopReason === "max_tokens") return null;
  const parsed = interviewerReplySchema.safeParse(parseJson(result.text));
  return parsed.success ? checkReply(parsed.data) : null;
}

const REFUSAL_REPLY = "I can't help with that, but let's get back to the case. Where would you like to pick up?";
const LOST_THREAD_REPLY = "Sorry, I lost my train of thought for a moment. Could you say that again?";

/** Last resort when the structured reply could not be read: use plain prose if the model wrote prose. */
function plainFallback(text: string): string {
  const trimmed = text.trim();
  if (trimmed && !/^[\[{]/.test(trimmed) && trimmed.length <= 1500) return trimmed;
  return LOST_THREAD_REPLY;
}

// ---------------------------------------------------------------------------
// Starting
// ---------------------------------------------------------------------------

export type StartOutcome =
  | { status: "started" | "resumed"; sessionId: string }
  | { status: "needs_upgrade" }
  | { status: "blocked"; blocked: Blocked };

/** How an interview begins: the full interview (a short hello first), or straight to the case. */
export type StartMode = "full" | "case";

/** Candidate turns of warm-up after which the interviewer hands over the case whatever the chat is doing. */
export const WARMUP_MAX_TURNS = 3;

export async function startInterview(
  deps: Pick<Deps, "store">,
  args: { userId: string; c: Case; paid: boolean; mode?: StartMode },
): Promise<StartOutcome> {
  if (!canStartCase(args.c, args.paid)) return { status: "needs_upgrade" };

  const existing = await deps.store.findActiveSession(args.userId, args.c.id);
  if (existing) return { status: "resumed", sessionId: existing };

  const limits = limitsFor(args.paid);
  const result = await deps.store.startSession({
    userId: args.userId,
    caseId: args.c.id,
    firstMessage: args.mode === "case" ? openingMessage(args.c) : warmupOpening(),
    maxTotal: limits.maxTotal,
    maxPerDay: limits.maxPerDay,
    maxPerMonth: limits.maxPerMonth,
  });
  return "sessionId" in result ? { status: "started", sessionId: result.sessionId } : { status: "blocked", blocked: result.blocked };
}

// ---------------------------------------------------------------------------
// One turn
// ---------------------------------------------------------------------------

function stateEvent(c: Case, stage: Stage, turns: number, revealed: string[], finished: boolean): TurnEvent {
  return { t: "state", stage, turns, turnsMax: SESSION_CAPS.maxTurns, exhibits: publicExhibits(c, revealed), finished };
}

const error = (code: ErrorCode, message: string): TurnEvent => ({ t: "error", code, message });

export async function runTurn(deps: Deps, input: TurnInput, emit: (event: TurnEvent) => void): Promise<void> {
  const { store } = deps;

  const session = await store.getSession(input.sessionId);
  const c = session ? deps.findCase(session.case_id) : undefined;
  if (!session || !c || session.user_id !== input.userId) {
    emit(error("not_found", "We couldn't find that interview."));
    return;
  }
  if (session.completed_at) {
    emit(stateEvent(c, "debrief", session.turns, session.revealed_exhibits, true));
    return;
  }

  const stored = await store.listMessages(session.id);

  if (input.action === "finish") return finish(deps, session, c, stored, emit);

  if (session.turns >= SESSION_CAPS.maxTurns) {
    emit({ t: "notice", message: `You've used all ${SESSION_CAPS.maxTurns} turns, so let's wrap up. Preparing your debrief…` });
    return finish(deps, session, c, stored, emit);
  }
  if ((await store.sessionTokens(session.id)) >= SESSION_CAPS.maxTotalTokens) {
    emit({ t: "notice", message: "This interview has reached its length limit, so let's wrap up. Preparing your debrief…" });
    return finish(deps, session, c, stored, emit);
  }

  // What the candidate said, and which stage this turn is in.
  const typed = (input.message ?? "").trim();
  if (input.action === "message" && typed.length === 0) {
    emit(error("empty", "Type a message first."));
    return;
  }
  if (typed.length > SESSION_CAPS.maxMessageChars) {
    emit(error("too_long", `That message is too long. Please keep it under ${SESSION_CAPS.maxMessageChars} characters.`));
    return;
  }

  // The intro stage is the warm-up, and it lasts only until the case has been shown. A session
  // that began with "straight to the case" (or an older one) already shows the case in its first
  // message, so its first turn simply moves on to clarifying.
  const caseShownBefore = stored.some((m) => m.role === "assistant" && showsCase(m.content, c));
  const warmingUp = session.stage === "intro" && !caseShownBefore;
  let stage: Stage = session.stage;
  let stageJustChanged = false;
  let presentNow = false;
  if (stage === "intro" && caseShownBefore) {
    stage = "clarifying";
    stageJustChanged = true;
  }
  const advance = input.action === "advance";
  if (warmingUp) {
    // Skipping the warm-up, or a chat that has run long, hands over the case this turn.
    if (advance || session.turns >= WARMUP_MAX_TURNS) {
      stage = "clarifying";
      stageJustChanged = true;
      presentNow = true;
    }
  } else if (advance) {
    const following = nextStage(stage);
    if (stage === "synthesis" || !following || following === "debrief") return finish(deps, session, c, stored, emit);
    stage = following;
    stageJustChanged = true;
  }
  const candidateText = typed || (warmingUp && advance ? "(I'd like to skip the chat and see the case.)" : "(I'd like to move on to the next stage.)");
  const lastAssistant = stored.filter((m) => m.role === "assistant").at(-1);
  const caseJustPresented = !!lastAssistant && showsCase(lastAssistant.content, c); // its text already explained clarifying

  // Keep the conversation within the token cap: fold older turns into a summary.
  const chat: ChatMessage[] = stored.map((m) => ({ role: m.role, content: m.content }));
  const plan = planHistory(chat, session.summary_covers, SESSION_CAPS.maxHistoryChars, SESSION_CAPS.minRecentMessages);
  let summary = session.summary;
  let summaryCovers = session.summary_covers;
  let window = plan.window;
  let summaryChanged = false;
  if (plan.toFold.length > 0) {
    try {
      const folded = await call(deps, input.userId, session.id, {
        purpose: "summary",
        system: SUMMARY_SYSTEM,
        messages: [{ role: "user", content: buildSummaryRequest(session.summary, plan.toFold) }],
        maxTokens: SESSION_CAPS.maxSummaryTokens,
        effort: "low",
      });
      if (folded.text.trim()) {
        summary = folded.text.trim();
        summaryCovers = plan.newCovers;
        summaryChanged = true;
      } else {
        window = chat.slice(session.summary_covers); // nothing usable: send the longer history instead
      }
    } catch (e) {
      console.error("interview: could not summarise older turns", e instanceof Error ? e.message : "unknown");
      window = chat.slice(session.summary_covers);
    }
  }

  const priorMaths = await store.getMathChecks(session.id);
  const notes: TurnNotes = {
    stage,
    turnsUsed: session.turns,
    turnsMax: SESSION_CAPS.maxTurns,
    revealedExhibits: session.revealed_exhibits,
    mathStatus: priorMaths.map((m) => ({ math_id: m.math_id, status: m.correct ? "correct" : "incorrect" })),
    advanceRequested: advance,
    stageJustChanged,
    summary,
    caseShown: !warmingUp,
    presentNow,
    stageExplained: caseJustPresented,
    warmupTurns: warmingUp ? session.turns : undefined,
  };

  const messages: LlmMessage[] = [];
  if (window[0]?.role === "assistant") {
    messages.push({
      role: "user",
      content: `[Interviewer notes from the system, not from the candidate]\n${summaryCovers === 0 ? "The session has just started." : "The conversation is under way; see the summary in the later notes."}`,
    });
  }
  for (const m of window) {
    messages.push({ role: m.role, content: m.role === "user" ? buildPastCandidateContent(m.content) : m.content });
  }
  messages.push({ role: "user", content: buildTurnContent(notes, candidateText) });

  // Ask the model, streaming the reply text to the candidate as it is written.
  // Each attempt gets a fresh extractor, so a retry streams cleanly too.
  let streamed = "";
  const makeOnText = () => {
    const extractor = new ReplyExtractor();
    return (chunk: string) => {
      const piece = extractor.feed(chunk);
      if (piece) {
        streamed += piece;
        emit({ t: "delta", text: piece });
      }
    };
  };
  const base: Omit<LlmCall, "purpose" | "onText"> = {
    system: buildSystemPrompt(c),
    messages,
    maxTokens: SESSION_CAPS.maxReplyTokens,
    schema: interviewerReplySchema,
    effort: "low",
  };

  let result: LlmResult;
  let reply: InterviewerReply | null;
  try {
    result = await call(deps, input.userId, session.id, { ...base, purpose: "turn", onText: makeOnText() });
    reply = parseReply(result);
    if (!reply && !streamed && result.stopReason !== "refusal") {
      // Nothing reached the candidate yet, so one clean retry is invisible to them.
      result = await call(deps, input.userId, session.id, { ...base, purpose: "retry", onText: makeOnText() });
      reply = parseReply(result);
    }
  } catch (e) {
    console.error("interview: model call failed", e instanceof Error ? e.message : "unknown");
    emit(error("model_error", "The interviewer isn't responding right now. Your message was not sent; please try again in a moment."));
    return;
  }

  // Could not read a structured reply: fall back to a plain reply and change nothing else.
  let replyText: string;
  let applied: InterviewerReply;
  if (reply) {
    replyText = reply.reply;
    applied = reply;
  } else {
    replyText = result.stopReason === "refusal" ? REFUSAL_REPLY : streamed || plainFallback(result.text);
    applied = { reply: replyText, next_stage: null, reveal_exhibit_id: null, numeric_answers: [] };
    if (!streamed) emit({ t: "delta", text: replyText });
  }

  // Apply what the model asked for, but only what the rules allow.
  let newStage = applyProposedStage(stage, applied.next_stage);
  if (warmingUp && newStage !== "intro") {
    // Leaving the warm-up always lands on clarifying, with the case shown word for word. The
    // system adds the case itself (the interviewer is told not to), so it can never be misquoted.
    newStage = "clarifying";
    if (!showsCase(replyText, c)) {
      const addition = `\n\n${casePresentation(c)}`;
      replyText += addition;
      emit({ t: "delta", text: addition });
    }
  }
  const revealed = [...session.revealed_exhibits];
  const wanted = applied.reveal_exhibit_id;
  if (wanted && c.exhibits.some((e) => e.id === wanted) && !revealed.includes(wanted) && (stage === "analysis" || newStage === "analysis")) {
    revealed.push(wanted);
  }
  const mathChecks: MathCheck[] = checkMathAnswers(c, applied.numeric_answers, candidateText);

  const saved = await store.commitTurn({
    sessionId: session.id,
    expectedTurns: session.turns,
    userMessage: candidateText,
    assistantMessage: replyText,
    stage: newStage,
    revealedExhibits: revealed,
    summary: summaryChanged ? summary : null,
    summaryCovers: summaryChanged ? summaryCovers : null,
    mathChecks,
  });
  if (!saved) {
    emit(error("busy", "That message crossed with another one. Please reload the page and try again."));
    return;
  }

  const turns = session.turns + 1;
  if (newStage === "debrief") {
    emit({ t: "notice", message: "That's the end of the interview. Preparing your debrief…" });
    const fresh = await store.getSession(session.id);
    if (fresh) return finish(deps, fresh, c, [...stored, { role: "user", content: candidateText }, { role: "assistant", content: replyText }], emit);
  }
  emit(stateEvent(c, newStage, turns, revealed, false));
}

// ---------------------------------------------------------------------------
// Finishing: the scored debrief
// ---------------------------------------------------------------------------

async function finish(
  deps: Deps,
  session: SessionRow,
  c: Case,
  messages: { role: "user" | "assistant"; content: string }[],
  emit: (event: TurnEvent) => void,
): Promise<void> {
  const candidateMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  if (session.stage === "intro" && !messages.some((m) => m.role === "assistant" && showsCase(m.content, c))) {
    emit(error("too_few_turns", "Let's see the case first. Press Skip to the case, work on it for a while, then finish."));
    return;
  }
  if (candidateMessages.length === 0) {
    emit(error("too_few_turns", "Have at least one exchange with the interviewer before finishing."));
    return;
  }

  const maths = await deps.store.getMathChecks(session.id);
  const base: Omit<LlmCall, "purpose"> = {
    system: debriefSystem(c),
    messages: [{ role: "user", content: debriefRequest(messages, maths) }],
    maxTokens: SESSION_CAPS.maxDebriefTokens,
    schema: debriefModelSchema,
    effort: "medium",
  };

  let model: DebriefModelOutput | null = null;
  try {
    for (const purpose of ["debrief", "debrief"] as const) {
      const result = await call(deps, session.user_id, session.id, { ...base, purpose });
      if (result.stopReason === "refusal") break;
      const parsed = debriefModelSchema.safeParse(parseJson(result.text));
      if (parsed.success) {
        model = parsed.data;
        break;
      }
    }
  } catch (e) {
    console.error("interview: debrief call failed", e instanceof Error ? e.message : "unknown");
  }
  if (!model) {
    emit(error("debrief_failed", "We couldn't prepare your debrief just now. Your interview is saved: press Finish again in a moment."));
    return;
  }

  const stored = assembleDebrief(model, maths, candidateMessages, c);
  await deps.store.completeSession({ sessionId: session.id, scores: stored, summary: stored.summary });
  emit(stateEvent(c, "debrief", session.turns, session.revealed_exhibits, true));
}
