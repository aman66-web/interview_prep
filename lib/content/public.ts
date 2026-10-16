import type { Case, CaseType, Track } from "./schema";

// What a visitor (even one who is not logged in) may see of a case. This is an
// allow-list: only the fields named here are copied, so answer keys, facts,
// rubrics, the idea bank, insights, maths and model answers can never leak by
// accident when a new field is added to the case format.
// tests/content-public.test.ts checks this against every case.

export type PublicExhibit = {
  id: string;
  title: string;
  kind: "table" | "bar" | "line";
  columns: string[];
  rows: (string | number)[][];
};

export type PublicCase = {
  slug: string;
  title: string;
  track: Track;
  type: CaseType;
  industry: string;
  difficulty: 1 | 2 | 3;
  style: "interviewer_led" | "candidate_led";
  estMinutes: number;
  prompt: string;
  freeStarter: boolean;
  freePreview: boolean;
  isDraft: boolean;
  /** Only for cases marked free_preview: the first exhibit's data, never its insight. */
  previewExhibit: PublicExhibit | null;
};

export type CaseSummary = Pick<
  PublicCase,
  "slug" | "title" | "track" | "type" | "industry" | "difficulty" | "estMinutes" | "freeStarter" | "freePreview" | "isDraft"
>;

export function toCaseSummary(c: Case): CaseSummary {
  return {
    slug: c.slug,
    title: c.title,
    track: c.track,
    type: c.type,
    industry: c.industry,
    difficulty: c.difficulty,
    estMinutes: c.est_minutes,
    freeStarter: c.free_starter,
    freePreview: c.free_preview,
    isDraft: c.status === "draft",
  };
}

export function toPublicCase(c: Case): PublicCase {
  const first = c.free_preview ? c.exhibits[0] : undefined;
  return {
    ...toCaseSummary(c),
    style: c.style,
    prompt: c.prompt,
    previewExhibit: first
      ? {
          id: first.id,
          title: first.title,
          kind: first.kind,
          columns: first.data.columns,
          rows: first.data.rows,
        }
      : null,
  };
}
