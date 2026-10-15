import type { DrillCategory } from "@/lib/drills/types";

// The five skills every debrief scores (kit section 6), in the order they are shown,
// with the drill and guide that practise each one. Shared by the debrief and the
// dashboard. No zod or case data here, so client components may import it too.

export type SkillKey = "structure" | "analysis_maths" | "business_judgement" | "communication" | "synthesis";

export type Skill = {
  key: SkillKey;
  label: string;
  /** The drill category that practises this skill. */
  drill: DrillCategory;
  /** The guide (under /guides/) that explains it. */
  guide: { slug: string; title: string };
};

export const SKILLS: readonly Skill[] = [
  {
    key: "structure",
    label: "Structure",
    drill: "frameworks",
    guide: { slug: "how-to-structure-a-case-interview", title: "How to structure a case interview" },
  },
  {
    key: "analysis_maths",
    label: "Analysis and maths",
    drill: "mental-maths",
    guide: { slug: "case-interview-maths", title: "Case interview maths" },
  },
  {
    key: "business_judgement",
    label: "Business judgement",
    drill: "market-sizing",
    guide: { slug: "market-sizing-case-interview", title: "Market sizing case interviews" },
  },
  {
    key: "communication",
    label: "Communication",
    drill: "frameworks",
    guide: { slug: "how-to-practise-case-interviews-alone", title: "How to practise case interviews alone" },
  },
  {
    key: "synthesis",
    label: "Recommendation",
    drill: "frameworks",
    guide: { slug: "how-to-structure-a-case-interview", title: "How to structure a case interview" },
  },
];

export const SKILL_KEYS: readonly SkillKey[] = SKILLS.map((s) => s.key);

export function skillInfo(key: SkillKey): Skill {
  const found = SKILLS.find((s) => s.key === key);
  if (!found) throw new Error(`Unknown skill: ${key}`);
  return found;
}

export type SkillScores = Record<SkillKey, number>;

/** The mean of the five scores, to one decimal place. */
export function overallScore(scores: SkillScores): number {
  const values = SKILL_KEYS.map((k) => scores[k]);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** The lowest-scored skill; on a tie, the one listed first. */
export function weakestSkill(scores: SkillScores): SkillKey {
  return SKILL_KEYS.reduce((low, k) => (scores[k] < scores[low] ? k : low), SKILL_KEYS[0]);
}

/** The highest-scored skill; on a tie, the one listed first. */
export function strongestSkill(scores: SkillScores): SkillKey {
  return SKILL_KEYS.reduce((high, k) => (scores[k] > scores[high] ? k : high), SKILL_KEYS[0]);
}

/** "4", "3.5": one decimal place, without a trailing ".0". */
export function formatScore(value: number): string {
  return (Math.round(value * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });
}
