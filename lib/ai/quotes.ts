// The debrief must quote the candidate's own words (kit section 6). The model
// sometimes paraphrases a quote, so code checks it really appears in what the
// candidate said, and drops it if not.

function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** The quote with surrounding quotation marks and ellipses removed. */
function strip(quote: string) {
  return normalise(quote).replace(/^["'.…\s]+|["'.…\s]+$/g, "");
}

/** Returns the quote if the candidate really said it, otherwise null. */
export function verifyQuote(quote: string, candidateMessages: string[]): string | null {
  const wanted = strip(quote);
  if (wanted.length < 8) return null;
  // Allow "start ... end" quotes where the middle was left out.
  const parts = wanted.split(/\s*(?:\.{3}|…)\s*/).filter((p) => p.length >= 4);
  if (parts.length === 0) return null;
  const said = candidateMessages.map(normalise);
  const found = said.some((message) => {
    let from = 0;
    for (const part of parts) {
      const at = message.indexOf(part, from);
      if (at === -1) return false;
      from = at + part.length;
    }
    return true;
  });
  return found ? quote.trim() : null;
}
