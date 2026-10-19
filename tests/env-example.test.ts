import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lines = readFileSync(".env.example", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l !== "" && !l.startsWith("#"));

// Rule 2.5: .env.example holds names only, so it is safe to commit.
describe(".env.example", () => {
  it("contains variable names with no values", () => {
    for (const line of lines) {
      expect(line, `"${line}" must be NAME= with nothing after it`).toMatch(
        /^[A-Z][A-Z0-9_]*=$/,
      );
    }
  });

  it("lists the variables from the kit", () => {
    const names = lines.map((l) => l.slice(0, -1));
    expect(names).toEqual(
      expect.arrayContaining([
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_SECRET_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_MONTHLY",
        "STRIPE_PRICE_PASS90",
        "ANTHROPIC_API_KEY",
        "ANTHROPIC_MODEL",
        "CRON_SECRET",
        "ADMIN_EMAILS",
        "NEXT_PUBLIC_SUPPORT_EMAIL",
      ]),
    );
  });
});
