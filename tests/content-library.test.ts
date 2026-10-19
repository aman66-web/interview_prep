import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rawCases } from "@/lib/content/all-cases";
import { allCases } from "@/lib/content/cases";
import { caseSchema } from "@/lib/content/schema";
import { checkCase, checkLibrary } from "@/lib/content/validate";

// `npm run content:check` runs this file and content-public.test.ts. It
// validates every case and recomputes all case maths (rule 2.9).

const files = readdirSync("content/cases").filter((f) => f.endsWith(".json"));

describe("case files", () => {
  it("are all registered in lib/content/all-cases.ts", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(rawCases.length, "add new case files to lib/content/all-cases.ts").toBe(files.length);
    const registeredSlugs = allCases.map((c) => c.slug).sort();
    const fileSlugs = files.map((f) => (JSON.parse(readFileSync(`content/cases/${f}`, "utf8")) as { slug: string }).slug).sort();
    expect(registeredSlugs).toEqual(fileSlugs);
  });

  it.each(files)("%s matches the case format", (file) => {
    const result = caseSchema.safeParse(JSON.parse(readFileSync(`content/cases/${file}`, "utf8")));
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues, null, 2)).toBe(true);
  });

  it.each(files)("%s file name matches its slug", (file) => {
    const slug = (JSON.parse(readFileSync(`content/cases/${file}`, "utf8")) as { slug: string }).slug;
    expect(file).toBe(`${slug}.json`);
  });
});

describe("case library", () => {
  it("has unique ids and slugs and exactly one free starter", () => {
    const problems = checkLibrary(allCases).filter((p) => /duplicate|free_starter/.test(p));
    expect(problems).toEqual([]);
  });

  it("recomputes every maths answer and every exhibit number it relies on", () => {
    expect(allCases.flatMap(checkCase)).toEqual([]);
  });

  it("has maths in the cases that are meant to test it", () => {
    for (const c of allCases) expect(c.math.length, `${c.slug} has no maths questions`).toBeGreaterThan(0);
  });

  it("never marks a case reviewed without a named human reviewer", () => {
    for (const c of allCases.filter((x) => x.status === "reviewed")) {
      expect(c.reviewed_by, c.slug).toBeTruthy();
      expect(c.reviewed_on, c.slug).toBeTruthy();
    }
  });

  it("has at least one case of each type that the library claims to cover", () => {
    const types = new Set(allCases.map((c) => c.type));
    for (const t of ["profitability", "market_entry", "market_sizing", "pricing", "growth"]) {
      expect(types.has(t as never), t).toBe(true);
    }
  });
});

describe("the checks themselves catch mistakes", () => {
  const base = allCases[0];

  it("catches a wrong expected answer", () => {
    const broken = structuredClone(base);
    broken.math[0].expected = broken.math[0].expected + 5;
    expect(checkCase(broken).join("\n")).toMatch(/expected .* but the expression gives/);
  });

  it("catches a number that disagrees with its exhibit", () => {
    const broken = structuredClone(base);
    const withSource = broken.math.find((m) => m.input_sources?.length);
    expect(withSource).toBeDefined();
    const source = withSource!.input_sources![0];
    withSource!.inputs[source.input] += 1;
    expect(checkCase(broken).join("\n")).toMatch(/exhibit .* says/);
  });

  it("catches an input that the expression never uses", () => {
    const broken = structuredClone(base);
    broken.math[0].inputs["unused_number"] = 1;
    expect(checkCase(broken).join("\n")).toMatch(/never used/);
  });

  it("catches an expression that uses a missing input", () => {
    const broken = structuredClone(base);
    broken.math[0].expression += " + missing_name";
    expect(checkCase(broken).join("\n")).toMatch(/not in inputs/);
  });

  it("catches duplicate slugs and a missing or second free starter", () => {
    const twin = structuredClone(base);
    expect(checkLibrary([base, twin]).join("\n")).toMatch(/duplicate case slug/);
    const none = allCases.map((c) => ({ ...c, free_starter: false }));
    expect(checkLibrary(none).join("\n")).toMatch(/exactly 1 free_starter/);
  });

  it("rejects a reviewed case with no reviewer, and unknown fields", () => {
    const raw = JSON.parse(readFileSync(`content/cases/${files[0]}`, "utf8"));
    expect(caseSchema.safeParse({ ...raw, status: "reviewed", reviewed_by: null, reviewed_on: null }).success).toBe(false);
    expect(caseSchema.safeParse({ ...raw, surprise: true }).success).toBe(false);
  });
});
