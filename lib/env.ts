import { z } from "zod";

// Reads settings from environment variables and fails with a clear message
// (names only, never values) when one is missing. See docs/SETUP.md.

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const secretSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

function read<S extends z.ZodType>(schema: S, input: Record<string, unknown>): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const names = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid environment variable(s): ${names}. See docs/SETUP.md.`,
    );
  }
  return result.data;
}

/** Safe for the browser: only NEXT_PUBLIC_* values. */
export function getPublicEnv() {
  return read(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

/** Server only. Never import this from a client component (rule 2.5). */
export function getSecretEnv() {
  return read(secretSchema, {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}
