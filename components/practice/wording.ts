// Small helpers for putting case names and labels into running text.
// tests/practice-pages.test.ts covers them.

/** "Harbourline Bakeries: why did profit fall?" -> "Harbourline Bakeries" (the company, for running text). */
export function caseShortName(title: string): string {
  const at = title.indexOf(":");
  return at > 0 ? title.slice(0, at).trim() : title.trim();
}

/** Lower-cases a label for use mid-sentence, unless it starts with an acronym: "Food retail" -> "food retail", "M&A" stays. */
export function lowerFirst(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;
}

/** "a profitability case", "an M&A case", "an operations case". */
export function caseOfType(typeLabel: string): string {
  const word = lowerFirst(typeLabel);
  return `${/^(?:[aeiou]|M&A)/i.test(word) ? "an" : "a"} ${word} case`;
}
