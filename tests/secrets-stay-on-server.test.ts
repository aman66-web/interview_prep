import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Rule 2.5: secret keys never reach the browser. These checks look at the
// source code, so a slip is caught before it ships.

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|mjs)$/.test(name) ? [path] : [];
  });
}

const files = ["app", "components", "lib"].flatMap(sourceFiles);
const read = (f: string) => readFileSync(f, "utf8");
const isClientFile = (text: string) => /^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(text);

const SECRET_NAMES = [
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
];

describe("secrets stay on the server", () => {
  it("finds the source files to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("no client component mentions a secret or imports server-only code", () => {
    const offences: string[] = [];
    for (const file of files) {
      const text = read(file);
      if (!isClientFile(text)) continue;
      for (const name of SECRET_NAMES) {
        if (text.includes(name)) offences.push(`${file} mentions ${name}`);
      }
      for (const forbidden of ["lib/supabase/admin", "lib/supabase/server", "lib/ai", "lib/env"]) {
        if (text.includes(forbidden)) offences.push(`${file} imports ${forbidden}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it("the admin client is only used from server actions and route handlers", () => {
    const importers = files.filter((f) => read(f).includes("lib/supabase/admin") && !f.endsWith("admin.ts"));
    for (const file of importers) {
      const text = read(file);
      const isServerAction = /^\s*["']use server["']/.test(text);
      const isRouteHandler = /\/route\.ts$/.test(file);
      expect(isServerAction || isRouteHandler, `${file} must be a server action or route handler`).toBe(true);
    }
  });

  it("no secret is exposed through a NEXT_PUBLIC_ variable", () => {
    const publicSecrets = files
      .flatMap((f) => (read(f).match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? []).map((n) => `${f}: ${n}`))
      .filter((hit) => /SECRET|PRIVATE|SERVICE_ROLE|API_KEY/.test(hit));
    expect(publicSecrets).toEqual([]);

    const envExample = readFileSync(".env.example", "utf8");
    const exposed = envExample
      .split("\n")
      .filter((l) => l.startsWith("NEXT_PUBLIC_"))
      .filter((l) => /SECRET|PRIVATE|SERVICE_ROLE/.test(l));
    expect(exposed).toEqual([]);
  });
});
