-- P3: AI interviewer state.
--
-- * case_sessions remembers which exhibits have been shown to the candidate, and how
--   many messages the rolling summary of older turns already covers.
-- * start_interview_session() creates a session AND enforces the usage limits in
--   one step, so two quick clicks cannot sneak past a limit.
-- * commit_interview_turn() saves one turn (the candidate's message, the
--   interviewer's reply, the new stage, exhibits and maths checks) atomically,
--   and refuses if another request got there first.
--
-- Both functions are for the server only (the secret key / service_role). Browsers
-- cannot call them.

alter table public.case_sessions
  add column revealed_exhibits text[] not null default '{}',
  add column summary_covers integer not null default 0 check (summary_covers >= 0);

-- ---------------------------------------------------------------------------
-- Start a session, subject to limits. Returns {"session_id": ...} or {"blocked": "total"|"day"|"month"}.
-- A limit of null means "no limit of that kind".
-- ---------------------------------------------------------------------------
create function public.start_interview_session(
  p_user_id uuid,
  p_case_id text,
  p_first_message text,
  p_max_total integer,
  p_max_per_day integer,
  p_max_per_month integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_day integer;
  v_month integer;
  v_id uuid;
begin
  -- Serialise starts for one user so counting and inserting cannot interleave.
  perform pg_advisory_xact_lock(hashtext('start_interview:' || p_user_id::text));

  select count(*) into v_total from public.case_sessions where user_id = p_user_id;
  if p_max_total is not null and v_total >= p_max_total then
    return jsonb_build_object('blocked', 'total');
  end if;

  select count(*) into v_day from public.case_sessions
    where user_id = p_user_id and started_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if p_max_per_day is not null and v_day >= p_max_per_day then
    return jsonb_build_object('blocked', 'day');
  end if;

  select count(*) into v_month from public.case_sessions
    where user_id = p_user_id and started_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  if p_max_per_month is not null and v_month >= p_max_per_month then
    return jsonb_build_object('blocked', 'month');
  end if;

  insert into public.case_sessions (user_id, case_id, stage)
    values (p_user_id, p_case_id, 'intro')
    returning id into v_id;
  insert into public.session_messages (session_id, role, content, created_at)
    values (v_id, 'assistant', p_first_message, clock_timestamp());

  return jsonb_build_object('session_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Save one turn. Returns false (and changes nothing) if the session has moved on.
-- p_user_message is null for turns that have no candidate message (e.g. the opening).
-- p_math is a JSON array of {math_id, given, expected, correct}.
-- ---------------------------------------------------------------------------
create function public.commit_interview_turn(
  p_session_id uuid,
  p_expected_turns integer,
  p_user_message text,
  p_assistant_message text,
  p_stage text,
  p_revealed text[],
  p_summary text,
  p_summary_covers integer,
  p_math jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.case_sessions;
begin
  select * into s from public.case_sessions where id = p_session_id for update;
  if not found or s.turns <> p_expected_turns or s.completed_at is not null then
    return false;
  end if;

  -- clock_timestamp() (not now()) so the two messages sort in the order they were written.
  if p_user_message is not null then
    insert into public.session_messages (session_id, role, content, created_at)
      values (p_session_id, 'user', p_user_message, clock_timestamp());
  end if;
  insert into public.session_messages (session_id, role, content, created_at)
    values (p_session_id, 'assistant', p_assistant_message, clock_timestamp());

  update public.case_sessions
    set turns = turns + case when p_user_message is not null then 1 else 0 end,
        stage = p_stage,
        revealed_exhibits = p_revealed,
        summary = coalesce(p_summary, summary),
        summary_covers = coalesce(p_summary_covers, summary_covers)
    where id = p_session_id;

  insert into public.math_checks (session_id, math_id, given, expected, correct)
    select p_session_id, m ->> 'math_id', (m ->> 'given')::numeric, (m ->> 'expected')::numeric, (m ->> 'correct')::boolean
    from jsonb_array_elements(coalesce(p_math, '[]'::jsonb)) as m
  on conflict (session_id, math_id) do update
    set given = excluded.given, expected = excluded.expected, correct = excluded.correct;

  return true;
end;
$$;

-- Server only.
revoke execute on function public.start_interview_session(uuid, text, text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.commit_interview_turn(uuid, integer, text, text, text, text[], text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.start_interview_session(uuid, text, text, integer, integer, integer) to service_role;
grant execute on function public.commit_interview_turn(uuid, integer, text, text, text, text[], text, integer, jsonb) to service_role;
