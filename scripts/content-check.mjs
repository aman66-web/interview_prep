// Placeholder for `npm run content:check`.
// P2 replaces this with the real check: validate every case against the zod
// schema and recompute all case maths (rule 2.9).
import { existsSync, readdirSync } from "node:fs";

const dir = "content/cases";
const files = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith(".json"))
  : [];

if (files.length > 0) {
  console.error(
    `content:check is still a placeholder but found ${files.length} case file(s) in ${dir}. ` +
      "Build the real check (milestone P2) before adding cases.",
  );
  process.exit(1);
}

console.log("content:check: no cases yet, nothing to check (real check arrives in P2).");
