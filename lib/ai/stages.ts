// The stages of a case interview (kit section 6). The current stage is stored in
// case_sessions.stage. Code, not the model, decides which moves are allowed.

export const STAGES = ["intro", "clarifying", "structure", "analysis", "brainstorm", "synthesis", "debrief"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  intro: "Intro",
  clarifying: "Clarifying",
  structure: "Structure",
  analysis: "Analysis",
  brainstorm: "Brainstorm",
  synthesis: "Recommendation",
  debrief: "Debrief",
};

/** The stages the candidate moves through, in order, for the progress indicator. */
export const PROGRESS_STAGES: Stage[] = ["clarifying", "structure", "analysis", "brainstorm", "synthesis"];

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

/** The stage after this one, or null at the end. */
export function nextStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

/**
 * Applies a stage the model proposed. Only the very next stage is allowed, so a
 * confused or manipulated reply can never skip ahead or jump back.
 */
export function applyProposedStage(current: Stage, proposed: Stage | null | undefined): Stage {
  if (!proposed || proposed === current) return current;
  return proposed === nextStage(current) ? proposed : current;
}
