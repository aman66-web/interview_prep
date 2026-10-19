import { afterEach, describe, expect, it } from "vitest";
import { allCases, findVisibleCase, visibleCases } from "@/lib/content/cases";
import { toCaseSummary, toPublicCase } from "@/lib/content/public";
import type { Case } from "@/lib/content/schema";

// Rule: the browser never receives answer keys, idea banks or model answers.

/** Every piece of text in a case that must stay on the server. */
function secretsOf(c: Case): string[] {
  const secrets: string[] = [
    ...c.facts.map((f) => f.answer),
    ...c.structure_rubric.key_buckets,
    ...c.structure_rubric.good_signs,
    ...c.structure_rubric.red_flags,
    ...c.exhibits.flatMap((e) => [e.insight, e.reveal_hint]),
    ...c.math.flatMap((m) => [m.working, m.question]),
    ...c.brainstorm.idea_bank,
    ...c.synthesis_rubric.must_mention,
    ...c.synthesis_rubric.good_signs,
    ...c.model_answer_outline,
  ];
  return secrets.filter((s) => s.length >= 20);
}

describe("public view of a case", () => {
  it.each(allCases.map((c) => [c.slug, c] as const))("%s leaks no answer keys", (_slug, c) => {
    const json = JSON.stringify(toPublicCase(c));
    for (const secret of secretsOf(c)) {
      expect(json.includes(secret), `leaked: ${secret.slice(0, 60)}`).toBe(false);
    }
    const fieldNames = Object.keys(toPublicCase(c));
    for (const banned of ["facts", "structure_rubric", "math", "brainstorm", "synthesis_rubric", "model_answer_outline", "insight", "expected", "idea_bank"]) {
      expect(fieldNames).not.toContain(banned);
    }
  });

  it("also leaks nothing through the list summary", () => {
    for (const c of allCases) {
      const json = JSON.stringify(toCaseSummary(c));
      expect(json).not.toContain(c.prompt);
      for (const secret of secretsOf(c)) expect(json.includes(secret)).toBe(false);
    }
  });

  it("shows an exhibit only for free-preview cases, and never its insight", () => {
    for (const c of allCases) {
      const pub = toPublicCase(c);
      if (c.free_preview && c.exhibits.length > 0) {
        expect(pub.previewExhibit?.id).toBe(c.exhibits[0].id);
        expect(JSON.stringify(pub.previewExhibit)).not.toContain(c.exhibits[0].insight);
      } else {
        expect(pub.previewExhibit).toBeNull();
      }
    }
  });

  it("always shows the prompt, which is the first stage (kit section 5)", () => {
    for (const c of allCases) expect(toPublicCase(c).prompt).toBe(c.prompt);
  });
});

describe("draft visibility", () => {
  const original = process.env.SHOW_DRAFT_CONTENT;
  afterEach(() => {
    if (original === undefined) delete process.env.SHOW_DRAFT_CONTENT;
    else process.env.SHOW_DRAFT_CONTENT = original;
  });

  it("hides drafts from real visitors", () => {
    delete process.env.SHOW_DRAFT_CONTENT;
    expect(visibleCases().every((c) => c.status === "reviewed")).toBe(true);
    for (const c of allCases.filter((x) => x.status === "draft")) {
      expect(findVisibleCase(c.slug)).toBeUndefined();
    }
  });

  it("shows drafts only when SHOW_DRAFT_CONTENT is exactly 1", () => {
    process.env.SHOW_DRAFT_CONTENT = "true";
    expect(visibleCases().length).toBe(allCases.filter((c) => c.status === "reviewed").length);
    process.env.SHOW_DRAFT_CONTENT = "1";
    expect(visibleCases().length).toBe(allCases.length);
  });
});
