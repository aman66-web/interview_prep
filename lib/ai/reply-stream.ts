/**
 * Pulls the text of the "reply" field out of a JSON object that is arriving in
 * pieces, so the candidate sees the interviewer "typing" while the rest of the
 * structured reply is still being written.
 *
 *   {"reply":"Good question. The chain has 120 cafés...","next_stage":null,...}
 *
 * Feed it every text chunk; it returns only the NEW reply characters from that
 * chunk. It understands JSON escapes, including ones split across chunks.
 * The complete JSON is still validated afterwards: this is only for display.
 */
export class ReplyExtractor {
  private buffer = "";
  private state: "searching" | "in_string" | "done" = "searching";
  private pos = 0; // how much of buffer has been consumed
  private pendingHighSurrogate = "";

  feed(chunk: string): string {
    this.buffer += chunk;
    let out = "";

    if (this.state === "searching") {
      const match = /"reply"\s*:\s*"/.exec(this.buffer);
      if (!match) return "";
      this.pos = match.index + match[0].length;
      this.state = "in_string";
    }

    while (this.state === "in_string" && this.pos < this.buffer.length) {
      const ch = this.buffer[this.pos];

      if (ch === '"') {
        this.state = "done";
        this.pos++;
        break;
      }

      if (ch !== "\\") {
        out += ch;
        this.pos++;
        continue;
      }

      // An escape: wait until the whole escape sequence has arrived.
      const next = this.buffer[this.pos + 1];
      if (next === undefined) break;
      if (next === "u") {
        if (this.pos + 6 > this.buffer.length) break;
        const hex = this.buffer.slice(this.pos + 2, this.pos + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          this.state = "done"; // malformed: stop quietly, final validation will catch it
          break;
        }
        const code = parseInt(hex, 16);
        const unit = String.fromCharCode(code);
        if (code >= 0xd800 && code <= 0xdbff) {
          this.pendingHighSurrogate = unit; // wait for the low half
        } else {
          out += this.pendingHighSurrogate + unit;
          this.pendingHighSurrogate = "";
        }
        this.pos += 6;
        continue;
      }

      const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\", "/": "/" };
      out += simple[next] ?? "";
      this.pos += 2;
    }

    // Free what has been read so the buffer does not grow with a long reply.
    if (this.pos > 4096) {
      this.buffer = this.buffer.slice(this.pos);
      this.pos = 0;
    }
    return out;
  }

  get finished(): boolean {
    return this.state === "done";
  }
}
