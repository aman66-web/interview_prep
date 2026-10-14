import { evaluate, variablesIn } from "./expr";
import type { Case } from "./schema";

// Checks that go beyond the shape of a case: the maths must be right (rule 2.9),
// exhibits must agree with the maths, and ids must be unique.

/** Relative difference between the expected answer and what the expression gives. */
function sameNumber(a: number, b: number) {
  return Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-4);
}

/** Problems with one case. An empty list means the case is sound. */
export function checkCase(c: Case): string[] {
  const problems: string[] = [];
  const where = (what: string) => `${c.slug}: ${what}`;

  const exhibitIds = c.exhibits.map((e) => e.id);
  if (new Set(exhibitIds).size !== exhibitIds.length) problems.push(where("duplicate exhibit id"));

  const mathIds = c.math.map((m) => m.id);
  if (new Set(mathIds).size !== mathIds.length) problems.push(where("duplicate math id"));

  for (const m of c.math) {
    const label = where(`math "${m.id}"`);

    // The expression must use exactly the inputs given.
    let used: string[] = [];
    try {
      used = variablesIn(m.expression);
    } catch (error) {
      problems.push(`${label}: cannot read expression (${(error as Error).message})`);
      continue;
    }
    const given = Object.keys(m.inputs);
    for (const name of used) {
      if (!given.includes(name)) problems.push(`${label}: expression uses "${name}" which is not in inputs`);
    }
    for (const name of given) {
      if (!used.includes(name)) problems.push(`${label}: input "${name}" is never used in the expression`);
    }

    // Recompute the expected answer.
    try {
      const computed = evaluate(m.expression, m.inputs);
      if (!sameNumber(computed, m.expected)) {
        problems.push(`${label}: expected ${m.expected} but the expression gives ${computed}`);
      }
    } catch (error) {
      problems.push(`${label}: expression failed (${(error as Error).message})`);
    }

    // Numbers taken from exhibits must match the exhibit.
    for (const source of m.input_sources ?? []) {
      const exhibit = c.exhibits.find((e) => e.id === source.exhibit_id);
      if (!exhibit) {
        problems.push(`${label}: input_sources points at unknown exhibit "${source.exhibit_id}"`);
        continue;
      }
      if (!(source.input in m.inputs)) {
        problems.push(`${label}: input_sources names "${source.input}" which is not in inputs`);
        continue;
      }
      const columnIndex = exhibit.data.columns.indexOf(source.column);
      const row = exhibit.data.rows[source.row];
      if (columnIndex === -1 || !row) {
        problems.push(`${label}: input_sources "${source.input}" points outside exhibit "${exhibit.id}"`);
        continue;
      }
      const cell = row[columnIndex];
      if (typeof cell !== "number" || !sameNumber(cell, m.inputs[source.input])) {
        problems.push(
          `${label}: input "${source.input}" is ${m.inputs[source.input]} but exhibit "${exhibit.id}" says ${String(cell)}`,
        );
      }
    }
  }

  if (c.free_starter && c.status === "reviewed" && !c.free_preview) {
    // Not an error, but the starter case is always previewable.
  }
  return problems;
}

/** Problems across the whole library: unique ids and slugs, one free starter. */
export function checkLibrary(cases: Case[]): string[] {
  const problems: string[] = [];
  const dupes = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i);

  for (const id of new Set(dupes(cases.map((c) => c.id)))) problems.push(`duplicate case id "${id}"`);
  for (const slug of new Set(dupes(cases.map((c) => c.slug)))) problems.push(`duplicate case slug "${slug}"`);

  const starters = cases.filter((c) => c.free_starter);
  if (starters.length !== 1) problems.push(`there must be exactly 1 free_starter case, found ${starters.length}`);

  for (const c of cases) problems.push(...checkCase(c));
  return problems;
}
