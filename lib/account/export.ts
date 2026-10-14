// "Download my data" (UK GDPR / rule 2.7): everything we hold about one user.

type Row = Record<string, unknown>;

/** Reads rows where `column` is one of `values`. Real data comes from Supabase; tests pass a fake. */
export interface ExportSource {
  rowsFor(table: string, column: string, values: string[]): Promise<Row[]>;
}

export interface ExportUser {
  id: string;
  email?: string | null;
  created_at?: string | null;
}

export async function buildAccountExport(
  source: ExportSource,
  user: ExportUser,
  now: Date = new Date(),
) {
  const me = [user.id];

  const [profiles, entitlements, sessions, drillAttempts, aiUsage, stripeCustomers, events] =
    await Promise.all([
      source.rowsFor("profiles", "id", me),
      source.rowsFor("entitlements", "user_id", me),
      source.rowsFor("case_sessions", "user_id", me),
      source.rowsFor("drill_attempts", "user_id", me),
      source.rowsFor("ai_usage", "user_id", me),
      source.rowsFor("stripe_customers", "user_id", me),
      source.rowsFor("events", "user_id", me),
    ]);

  const sessionIds = sessions.map((s) => String(s.id));
  // Expected answers are answer keys, so they are only included once a case is finished.
  const finishedIds = sessions.filter((s) => s.completed_at).map((s) => String(s.id));

  const [sessionMessages, mathChecks] = await Promise.all([
    sessionIds.length ? source.rowsFor("session_messages", "session_id", sessionIds) : [],
    finishedIds.length ? source.rowsFor("math_checks", "session_id", finishedIds) : [],
  ]);

  return {
    exported_at: now.toISOString(),
    notes: [
      "Interview transcripts are deleted automatically after the retention period.",
      "Maths check results are included for finished cases only.",
    ],
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
    },
    profile: profiles[0] ?? null,
    entitlement: entitlements[0] ?? null,
    stripe_customer: stripeCustomers[0] ?? null,
    case_sessions: sessions,
    session_messages: sessionMessages,
    math_checks: mathChecks,
    drill_attempts: drillAttempts,
    ai_usage: aiUsage,
    events,
  };
}
