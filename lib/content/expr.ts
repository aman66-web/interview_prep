// A tiny, safe maths evaluator for case and drill answers (rule 2.9).
// It understands numbers, named variables, + - * / ^ and brackets, and nothing
// else, so content files can never run code. Written in-house so there is no
// extra dependency to keep patched.

export type Vars = Readonly<Record<string, number>>;

type Token =
  | { kind: "num"; value: number }
  | { kind: "id"; name: string }
  | { kind: "op"; op: "+" | "-" | "*" | "/" | "^" | "(" | ")" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^(\d+\.?\d*|\.\d+)/.exec(input.slice(i));
      if (!match) throw new Error(`Bad number at position ${i}`);
      tokens.push({ kind: "num", value: Number(match[1]) });
      i += match[1].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(input.slice(i));
      if (!match) throw new Error(`Bad name at position ${i}`);
      tokens.push({ kind: "id", name: match[0] });
      i += match[0].length;
    } else if ("+-*/^()".includes(ch)) {
      tokens.push({ kind: "op", op: ch as "+" | "-" | "*" | "/" | "^" | "(" | ")" });
      i++;
    } else {
      throw new Error(`Unexpected character "${ch}"`);
    }
  }
  return tokens;
}

/** Names used in an expression, in order of first appearance. */
export function variablesIn(expression: string): string[] {
  const names: string[] = [];
  for (const token of tokenize(expression)) {
    if (token.kind === "id" && !names.includes(token.name)) names.push(token.name);
  }
  return names;
}

/**
 * Evaluates an expression such as "stores * profit_per_store / 1000".
 * Throws on unknown variables, division by zero, or any result that is not a finite number.
 */
export function evaluate(expression: string, vars: Vars = {}): number {
  const tokens = tokenize(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const takeOp = (op: string) => {
    const t = peek();
    if (t?.kind === "op" && t.op === op) {
      pos++;
      return true;
    }
    return false;
  };

  // expr := term (("+" | "-") term)*
  function parseExpr(): number {
    let value = parseTerm();
    for (;;) {
      if (takeOp("+")) value += parseTerm();
      else if (takeOp("-")) value -= parseTerm();
      else return value;
    }
  }

  // term := unary (("*" | "/") unary)*
  function parseTerm(): number {
    let value = parseUnary();
    for (;;) {
      if (takeOp("*")) {
        value *= parseUnary();
      } else if (takeOp("/")) {
        const divisor = parseUnary();
        if (divisor === 0) throw new Error("Division by zero");
        value /= divisor;
      } else {
        return value;
      }
    }
  }

  // unary := ("-" | "+") unary | power
  function parseUnary(): number {
    if (takeOp("-")) return -parseUnary();
    if (takeOp("+")) return parseUnary();
    return parsePower();
  }

  // power := atom ("^" unary)?     (so 2^3^2 = 2^(3^2) and 2^-1 works)
  function parsePower(): number {
    const base = parseAtom();
    if (takeOp("^")) return Math.pow(base, parseUnary());
    return base;
  }

  // atom := number | name | "(" expr ")"
  function parseAtom(): number {
    const t = tokens[pos++];
    if (!t) throw new Error("Expression ended unexpectedly");
    if (t.kind === "num") return t.value;
    if (t.kind === "id") {
      if (!Object.prototype.hasOwnProperty.call(vars, t.name)) {
        throw new Error(`Unknown variable "${t.name}"`);
      }
      return vars[t.name];
    }
    if (t.op === "(") {
      const value = parseExpr();
      if (!takeOp(")")) throw new Error("Missing closing bracket");
      return value;
    }
    throw new Error(`Unexpected "${t.op}"`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("Unexpected extra input");
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number");
  return result;
}
