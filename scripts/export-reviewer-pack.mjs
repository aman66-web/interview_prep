// Writes one readable file per case for the human reviewer: the prompt, the facts the
// interviewer may give, the exhibits, the maths with working, and the model answer.
// Usage: node scripts/export-reviewer-pack.mjs
// Batch 1 goes in docs/reviewer-pack/, every other case in docs/reviewer-pack/later/.
// These files hold answer keys: keep them private (the repository is private).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const casesDir = join(root, "content/cases");
const BATCH_1 = ["harbourline-bakeries", "wrenfield-hotels-profit", "us-dog-walking-market", "hollinsway-pet-insurance", "flexora-gym-software-pricing"];

const list = (items) => items.map((x) => `- ${x}`).join("\n");
const cell = (v) => String(v).replace(/\|/g, "\\|");
function table(columns, rows) {
  return [`| ${columns.map(cell).join(" | ")} |`, `| ${columns.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
}

function render(c) {
  const out = [];
  out.push(`# ${c.title}`, "");
  out.push(`Case type: ${c.type} · Industry: ${c.industry} · Difficulty ${c.difficulty} of 3 · About ${c.est_minutes} minutes · Style: ${c.style}`, "");
  out.push(`Status: ${c.status} (draft until you sign it off). Page on the preview site: /cases/${c.slug}`, "");
  out.push("## 1. What the candidate is told", "", c.prompt, "");
  out.push("## 2. Facts the interviewer gives only when asked", "");
  for (const f of c.facts) out.push(`**${f.question_topic}.** ${f.answer}`, "");
  out.push("## 3. What a good structure includes", "");
  out.push("Key buckets:", list(c.structure_rubric.key_buckets), "", "Good signs:", list(c.structure_rubric.good_signs), "", "Red flags:", list(c.structure_rubric.red_flags), "");
  out.push("## 4. Exhibits (shown when the candidate asks for the right data)", "");
  if (!c.exhibits.length) out.push("This case has no exhibits: it is worked through by estimating.", "");
  for (const e of c.exhibits) {
    out.push(`### ${e.title}`, "", `Shown when the candidate: ${e.reveal_hint}`, "");
    if (e.data?.columns && e.data?.rows) out.push(table(e.data.columns, e.data.rows), "");
    else out.push("```json", JSON.stringify(e.data, null, 1), "```", "");
    out.push(`What the data says: ${e.insight}`, "");
  }
  out.push("## 5. The maths, with working", "");
  c.math.forEach((m, i) => {
    out.push(`**Question ${i + 1}.** ${m.question}`, "", `Inputs: ${Object.entries(m.inputs).map(([k, v]) => `${k} = ${v}`).join(", ")}`, `Expected answer: ${m.expected} (accepted within ${m.tolerance_pct}%)`, `Working: ${m.working}`, "");
  });
  out.push("## 6. Brainstorm", "", c.brainstorm.question, "", "Ideas a strong candidate might raise:", list(c.brainstorm.idea_bank), "");
  out.push("## 7. What a good recommendation includes", "", "Must mention:", list(c.synthesis_rubric.must_mention), "", "Good signs:", list(c.synthesis_rubric.good_signs), "");
  out.push("## 8. Model answer outline", "", c.model_answer_outline.map((s, i) => `${i + 1}. ${s}`).join("\n"), "");
  out.push("---", "", "## Your review (please fill in)", "",
    "1. Realistic? \n2. Clear? \n3. Fair? \n4. The answer: \n5. Difficulty and time: \n6. Verdict (Sign off as it is / Sign off after these small changes / Needs rework): ", "");
  return out.join("\n");
}

mkdirSync(join(root, "docs/reviewer-pack/later"), { recursive: true });
let n1 = 0, n2 = 0;
for (const file of readdirSync(casesDir).filter((f) => f.endsWith(".json")).sort()) {
  const c = JSON.parse(readFileSync(join(casesDir, file), "utf8"));
  const batch1 = BATCH_1.includes(c.slug);
  writeFileSync(join(root, "docs/reviewer-pack", batch1 ? "" : "later", `${c.slug}.md`), render(c));
  if (batch1) n1++;
  else n2++;
}
console.log(`Wrote ${n1} batch-1 files and ${n2} later files.`);
