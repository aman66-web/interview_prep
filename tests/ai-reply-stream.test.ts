import { describe, expect, it } from "vitest";
import { ReplyExtractor } from "@/lib/ai/reply-stream";
import { makeRng, pickInt } from "@/lib/drills/rng";

/** Feeds `text` in the given chunk sizes and returns everything extracted. */
function extract(text: string, sizes: number[]): string {
  const extractor = new ReplyExtractor();
  let out = "";
  let i = 0;
  let k = 0;
  while (i < text.length) {
    const size = sizes[k++ % sizes.length];
    out += extractor.feed(text.slice(i, i + size));
    i += size;
  }
  return out;
}

const wrap = (reply: string) =>
  JSON.stringify({ reply, next_stage: null, reveal_exhibit_id: null, numeric_answers: [{ math_id: "m", value: 1 }] });

describe("ReplyExtractor", () => {
  it("returns the reply text, one piece at a time, when the JSON arrives in pieces", () => {
    const json = wrap("Good question. There are 120 cafés.");
    expect(extract(json, [1])).toBe("Good question. There are 120 cafés.");
    expect(extract(json, [3, 5, 2])).toBe("Good question. There are 120 cafés.");
    expect(extract(json, [json.length])).toBe("Good question. There are 120 cafés.");
  });

  it("decodes JSON escapes, even when an escape is split between two pieces", () => {
    const reply = 'He said "hold on".\nNew line, a backslash \\ and a tab\t. £ and é and emoji 😀 and 日本';
    const json = wrap(reply);
    for (const size of [1, 2, 3, 4, 7, 13]) expect(extract(json, [size])).toBe(reply);
  });

  it("decodes \\u escapes written out by the model", () => {
    const json = '{"reply":"caf\\u00e9 \\ud83d\\ude00 ok","next_stage":null}';
    expect(extract(json, [1])).toBe("café 😀 ok");
    expect(extract(json, [5])).toBe("café 😀 ok");
  });

  it("stops at the end of the reply and ignores the other fields", () => {
    const extractor = new ReplyExtractor();
    const json = wrap("Short.");
    const out = extractor.feed(json);
    expect(out).toBe("Short.");
    expect(extractor.finished).toBe(true);
    expect(extractor.feed('{"reply":"second"}')).toBe("");
  });

  it("returns nothing until the reply field starts", () => {
    const extractor = new ReplyExtractor();
    expect(extractor.feed('{"next_stage":null,"rep')).toBe("");
    expect(extractor.feed('ly":"Hi')).toBe("Hi");
    expect(extractor.feed(' there"}')).toBe(" there");
  });

  it("handles a space before the colon and the value", () => {
    expect(extract('{ "reply" : "spaced out" }', [2])).toBe("spaced out");
  });

  it("copes with a reply cut short (the final JSON check catches it)", () => {
    expect(extract('{"reply":"Half a sent', [4])).toBe("Half a sent");
  });

  it("gives exactly the reply for lots of random replies and random chunk sizes", () => {
    const rng = makeRng(12345);
    const alphabet = ['a', 'b', ' ', '"', '\\', '\n', '\t', 'é', '£', '😀', '日', '/', '{', '}', ':', ','];
    for (let n = 0; n < 300; n++) {
      const length = pickInt(rng, 0, 120);
      let reply = "";
      for (let i = 0; i < length; i++) reply += alphabet[pickInt(rng, 0, alphabet.length - 1)];
      const json = wrap(reply);
      const sizes = Array.from({ length: 5 }, () => pickInt(rng, 1, 9));
      expect(extract(json, sizes), JSON.stringify(reply)).toBe(reply);
    }
  });
});
