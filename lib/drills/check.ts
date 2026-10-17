import { fmt } from "./rng";
import type { Drill } from "./types";

export type DrillOutcome =
  | { valid: false; message: string }
  | { valid: true; correct: boolean; correctAnswer: string; explanation: string };

/** Turns what someone typed into a number, or null. Accepts 1,200 and $1,200 and 12.5%. */
export function parseNumber(input: string): number | null {
  const cleaned = input.trim().replace(/[,\s$£€%]/g, "");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Checks a response against a drill. Pure, so it is easy to test. */
export function checkDrillAnswer(drill: Drill, response: string): DrillOutcome {
  if (drill.kind === "choice") {
    const trimmed = response.trim();
    const index = /^\d+$/.test(trimmed) ? Number(trimmed) : -1;
    if (index < 0 || index >= drill.options.length) {
      return { valid: false, message: "Choose one of the options." };
    }
    return {
      valid: true,
      correct: index === drill.answerIndex,
      correctAnswer: drill.options[drill.answerIndex],
      explanation: drill.explanation,
    };
  }

  const given = parseNumber(response);
  if (given === null) {
    return { valid: false, message: "Enter a number, for example 12.5 (no units or words)." };
  }

  const unit = drill.unit ? ` ${drill.unit}` : "";
  if (drill.kind === "numeric") {
    const allowed = Math.max(1e-9, (Math.abs(drill.answer) * drill.tolerancePct) / 100);
    return {
      valid: true,
      correct: Math.abs(given - drill.answer) <= allowed,
      correctAnswer: `${fmt(drill.answer)}${unit}`,
      explanation: drill.explanation,
    };
  }

  // estimate: within a factor of the model answer, either side
  const ratio = given > 0 ? given / drill.answer : 0;
  return {
    valid: true,
    correct: ratio >= 1 / drill.withinFactor && ratio <= drill.withinFactor,
    correctAnswer: `about ${fmt(drill.answer)}${unit} (model estimate)`,
    explanation: drill.explanation,
  };
}
