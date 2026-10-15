import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Block } from "@/lib/content/blocks";
import { evaluate, variablesIn } from "@/lib/content/expr";
import { firmSchema, glossarySchema, guideSchema, pageSchema } from "@/lib/content/writing-schema";

// `npm run content:check` runs this file too. It checks every written page (guides,
// firm guides, about/FAQ/legal pages and the glossary) against its format, recomputes
// every worked number in a guide example (rule 2.9), and checks that every fact in a
// firm guide points at a listed source (rule 2.2).

function jsonFiles(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => `${dir}/${f}`) : [];
}
const read = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));
const slugOf = (file: string) => file.split("/").pop()!.replace(/\.json$/, "");

const guideFiles = jsonFiles("content/guides");
const firmFiles = jsonFiles("content/firms");
const pageFiles = jsonFiles("content/pages");
const today = new Date().toISOString().slice(0, 10);

function checkBlocks(blocks: Block[]): string[] {
  const problems: string[] = [];
  const ids = blocks.flatMap((b) => (b.type === "h2" ? [b.id] : []));
  if (new Set(ids).size !== ids.length) problems.push("two h2 blocks share an id");
  for (const b of blocks) {
    if (b.type !== "example") continue;
    for (const check of b.checks) {
      try {
        const used = variablesIn(check.expression);
        const given = Object.keys(check.inputs);
        for (const name of used) if (!given.includes(name)) problems.push(`${check.label}: "${name}" is not in inputs`);
        const value = evaluate(check.expression, check.inputs);
        if (Math.abs(value - check.expected) > Math.max(1e-9, Math.abs(check.expected) * 1e-4)) {
          problems.push(`${check.label}: expected ${check.expected} but the expression gives ${value}`);
        }
      } catch (error) {
        problems.push(`${check.label}: ${(error as Error).message}`);
      }
    }
  }
  return problems;
}

describe.runIf(guideFiles.length > 0)("guides", () => {
  it.each(guideFiles)("%s matches the guide format and its maths is right", (file) => {
    const parsed = guideSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug, "the file name must match the slug").toBe(slugOf(file));
    expect(parsed.data.updated <= today, "updated cannot be in the future").toBe(true);
    expect(checkBlocks(parsed.data.blocks)).toEqual([]);
  });

  it("has at most one case-type guide per case type", () => {
    const types = guideFiles
      .map((f) => guideSchema.safeParse(read(f)))
      .flatMap((r) => (r.success && r.data.kind === "case_type" ? [r.data.case_type] : []));
    expect(new Set(types).size).toBe(types.length);
  });
});

describe.runIf(firmFiles.length > 0)("firm guides", () => {
  it.each(firmFiles)("%s: every fact points at a listed source (rule 2.2)", (file) => {
    const parsed = firmSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug).toBe(slugOf(file));
    const ids = parsed.data.sources.map((s) => s.id);
    expect(new Set(ids).size, "source ids must be unique").toBe(ids.length);
    const missing = parsed.data.sections.flatMap((s) => s.items.filter((i) => !ids.includes(i.source)).map((i) => i.source));
    expect(missing).toEqual([]);
    for (const s of parsed.data.sources) expect(s.checked <= today, `${s.id}: checked date is in the future`).toBe(true);
  });
});

describe.runIf(pageFiles.length > 0)("pages", () => {
  it.each(pageFiles)("%s matches the page format", (file) => {
    const parsed = pageSchema.safeParse(read(file));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug).toBe(slugOf(file));
    expect(checkBlocks(parsed.data.blocks)).toEqual([]);
  });
});

describe.runIf(existsSync("content/glossary.json"))("glossary", () => {
  it("matches the glossary format, with unique terms", () => {
    const parsed = glossarySchema.safeParse(read("content/glossary.json"));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    const slugs = parsed.data.terms.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const guides = guideFiles.map(slugOf);
    const unknown = parsed.data.terms.flatMap((t) => (t.related_guide && !guides.includes(t.related_guide) ? [t.related_guide] : []));
    expect(unknown, "related_guide must name a guide in content/guides").toEqual([]);
  });
});
