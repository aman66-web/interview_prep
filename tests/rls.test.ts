import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Runs the database migrations and supabase/tests/rls.sql against a throwaway
// Postgres database and fails if any security check fails.
//
// Needs RLS_TEST_DATABASE_URL, e.g.
//   postgres://postgres:postgres@localhost:5432/postgres
// (any Postgres where this user may create databases). Without it the checks
// are skipped on a laptop, but GitHub Actions (CI=true) refuses to skip them.

const adminUrl = process.env.RLS_TEST_DATABASE_URL;

function psql(url: string, args: string[]) {
  const result = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-q", ...args], {
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.error) throw result.error;
  return { ok: result.status === 0, output };
}

function urlForDatabase(base: string, name: string) {
  const u = new URL(base);
  u.pathname = `/${name}`;
  return u.toString();
}

describe("database setup", () => {
  it("is configured when running in CI", () => {
    if (process.env.CI) {
      expect(
        adminUrl,
        "RLS_TEST_DATABASE_URL must be set in CI so the security checks cannot be skipped",
      ).toBeTruthy();
    }
  });
});

describe.runIf(Boolean(adminUrl))("row level security", () => {
  const dbName = `rls_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  let dbUrl = "";

  beforeAll(() => {
    const base = adminUrl as string;
    const created = psql(base, ["-c", `create database ${dbName}`]);
    expect(created.ok, created.output).toBe(true);
    dbUrl = urlForDatabase(base, dbName);

    const shim = psql(dbUrl, ["-f", "supabase/tests/local_shim.sql"]);
    expect(shim.ok, shim.output).toBe(true);

    const migrations = readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort();
    expect(migrations.length).toBeGreaterThan(0);
    for (const file of migrations) {
      const applied = psql(dbUrl, ["-f", `supabase/migrations/${file}`]);
      expect(applied.ok, `${file}\n${applied.output}`).toBe(true);
    }
  });

  afterAll(() => {
    if (adminUrl) {
      psql(adminUrl, ["-c", `drop database if exists ${dbName} with (force)`]);
    }
  });

  it("passes every security check in supabase/tests/rls.sql", () => {
    const run = psql(dbUrl, ["-f", "supabase/tests/rls.sql"]);
    expect(run.ok, run.output).toBe(true);
    expect(run.output).toContain("ALL RLS CHECKS PASSED");
    expect(run.output).not.toContain("FAIL:");
  });
});
