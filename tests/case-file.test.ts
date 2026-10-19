import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { caseSchema } from "@/lib/content/schema";
import { checkCase } from "@/lib/content/validate";

// Checks ONE case file while it is being written, before it is added to
// lib/content/all-cases.ts:
//
//   CASE_FILE=content/cases/my-case.json npx vitest run tests/case-file.test.ts
//
// It runs the same checks as content:check (format, maths recomputed, exhibit
// numbers) plus uniqueness against every other case file. Without CASE_FILE it skips.

const file = process.env.CASE_FILE;

describe.runIf(Boolean(file))("one case file", () => {
  it("exists", () => {
    expect(existsSync(file!), `${file} not found`).toBe(true);
  });

  it("matches the case format, and its maths and exhibits agree", () => {
    const parsed = caseSchema.safeParse(JSON.parse(readFileSync(file!, "utf8")));
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
    if (!parsed.success) return;
    expect(file!.endsWith(`/${parsed.data.slug}.json`), "the file name must be <slug>.json").toBe(true);
    expect(checkCase(parsed.data)).toEqual([]);
  });

  it("does not reuse another case's id, slug or title", () => {
    const mine = JSON.parse(readFileSync(file!, "utf8")) as { id: string; slug: string; title: string };
    const others = readdirSync("content/cases")
      .filter((f) => f.endsWith(".json") && `content/cases/${f}` !== file)
      .map((f) => JSON.parse(readFileSync(`content/cases/${f}`, "utf8")) as { id: string; slug: string; title: string });
    expect(others.filter((o) => o.id === mine.id).map((o) => o.slug), "id already used").toEqual([]);
    expect(others.filter((o) => o.slug === mine.slug).map((o) => o.id), "slug already used").toEqual([]);
    expect(others.filter((o) => o.title === mine.title).map((o) => o.slug), "title already used").toEqual([]);
  });
});
