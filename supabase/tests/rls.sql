-- Row Level Security checks (kit section 9).
--
-- Proves that:
--   * a logged-in user can read only their own rows, and cannot change
--     anything that decides money, limits or scores;
--   * a visitor who is not logged in can read nothing private;
--   * the secret-key role (service_role) can still do the server's work;
--   * deleting a user deletes all of their data.
--
-- Everything runs inside one transaction that is rolled back at the end, so it
-- leaves no trace. It is plain SQL: run it with psql (npm test does this), or
-- paste it into the Supabase SQL editor to check a real project.
-- A failed check stops the script with "FAIL: ...".

begin;

create schema rls_test;
grant usage on schema rls_test to anon, authenticated, service_role;

-- Switch who we are pretending to be for the rest of the transaction.
create function rls_test.become(r text, uid uuid default null)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims',
    case when uid is null then '' else json_build_object('sub', uid, 'role', r)::text end, true);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  if r <> 'postgres' then
    execute format('set local role %I', r);
  end if;
end;
$$;

create function rls_test.check(ok boolean, msg text)
returns void
language plpgsql
as $$
begin
  if ok is not true then
    raise exception 'FAIL: %', msg;
  end if;
  raise notice 'PASS: %', msg;
end;
$$;

-- How many rows can the current role see for this query?
create function rls_test.visible(q text)
returns bigint
language plpgsql
as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) t', q) into n;
  return n;
end;
$$;

-- Is this statement refused (no privilege, or blocked by a row policy)?
create function rls_test.refused(stmt text)
returns boolean
language plpgsql
as $$
begin
  execute stmt;
  return false;
exception when insufficient_privilege then
  return true;
end;
$$;

-- How many rows did this statement change?
create function rls_test.changed(stmt text)
returns bigint
language plpgsql
as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Setup: two users, each with data in every table (done as the database owner)
-- ---------------------------------------------------------------------------

select rls_test.become('postgres');

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rls-user-a@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rls-user-b@example.test');

select rls_test.check(
  (select count(*) from public.profiles
    where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) = 2,
  'signing up creates a profile for each new user');

select rls_test.check(
  (select count(*) from public.entitlements
    where user_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
      and plan = 'free' and status = 'active') = 2,
  'signing up gives each new user the free plan');

insert into public.case_sessions (id, user_id, case_id) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'case-a'),
  ('b1b1b1b1-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'case-b');

insert into public.session_messages (session_id, role, content) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'user', 'message from A'),
  ('b1b1b1b1-0000-0000-0000-000000000001', 'user', 'message from B');

insert into public.math_checks (session_id, math_id, given, expected, correct) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'm1', 10, 10, true),
  ('b1b1b1b1-0000-0000-0000-000000000001', 'm1', 5, 10, false);

insert into public.drill_attempts (user_id, drill_id, correct) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'drill-a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'drill-b', true);

insert into public.ai_usage (user_id, session_id, input_tokens, output_tokens) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-0000-0000-0000-000000000001', 1, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1b1b1b1-0000-0000-0000-000000000001', 1, 1);

insert into public.stripe_customers (user_id, stripe_customer_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cus_rls_test_a'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cus_rls_test_b');

insert into public.stripe_events (id, type) values ('evt_rls_test_1', 'invoice.paid');

insert into public.leads (org, email) values ('RLS Test University', 'lead@example.test');

insert into public.events (name, user_id) values
  ('signup', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('signup', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- ---------------------------------------------------------------------------
-- Structure: nothing was left unprotected
-- ---------------------------------------------------------------------------

select rls_test.check(
  not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  ),
  'Row Level Security is switched on for every table');

select rls_test.check(
  not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  ),
  'every table has an explicit policy (even if it is deny-all)');

select rls_test.check(
  not has_function_privilege('anon', 'public.handle_new_user()', 'execute')
  and not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'browsers cannot call the new-user function directly');

-- ---------------------------------------------------------------------------
-- A logged-in user (A) sees only their own data
-- ---------------------------------------------------------------------------

select rls_test.become('authenticated', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select rls_test.check(rls_test.visible('select * from public.profiles') = 1,
  'A sees exactly one profile');
select rls_test.check(
  rls_test.visible($q$select * from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$q$) = 0,
  'A cannot see the profile of B');
select rls_test.check(
  rls_test.changed($q$update public.profiles set country = 'GB' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$q$) = 1,
  'A can update their own country');
select rls_test.check(
  rls_test.changed($q$update public.profiles set country = 'US' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$q$) = 0,
  'A cannot update the profile of B');
select rls_test.check(
  rls_test.refused($q$update public.profiles set created_at = now() where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$q$),
  'A cannot edit profile columns other than country and marketing choice');
select rls_test.check(
  rls_test.refused($q$insert into public.profiles (id) values (gen_random_uuid())$q$),
  'A cannot create profiles');
select rls_test.check(
  rls_test.refused($q$delete from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$q$),
  'A cannot delete their profile row directly');

select rls_test.check(rls_test.visible('select * from public.entitlements') = 1,
  'A sees exactly one entitlement');
select rls_test.check(
  rls_test.refused($q$update public.entitlements set plan = 'pass90' where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$q$),
  'A cannot give themselves a paid plan');
select rls_test.check(
  rls_test.refused($q$insert into public.entitlements (user_id, plan) values (gen_random_uuid(), 'group')$q$),
  'A cannot create entitlements');
select rls_test.check(
  rls_test.refused($q$delete from public.entitlements$q$),
  'A cannot delete entitlements');

select rls_test.check(rls_test.visible('select * from public.case_sessions') = 1,
  'A sees only their own case session');
select rls_test.check(
  rls_test.visible($q$select * from public.case_sessions where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$q$) = 0,
  'A cannot see the case sessions of B');
select rls_test.check(
  rls_test.refused($q$delete from public.case_sessions$q$),
  'A cannot delete sessions (that would reset the free-case limit)');
select rls_test.check(
  rls_test.refused($q$update public.case_sessions set turns = 0$q$),
  'A cannot edit sessions (that would get around the turn limit)');
select rls_test.check(
  rls_test.refused($q$insert into public.case_sessions (user_id, case_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x')$q$),
  'A cannot create sessions directly (the server enforces limits)');

select rls_test.check(rls_test.visible('select * from public.session_messages') = 1,
  'A sees only the messages of their own sessions');
select rls_test.check(
  rls_test.visible($q$select * from public.session_messages where content = 'message from B'$q$) = 0,
  'A cannot read the messages of B');
select rls_test.check(
  rls_test.refused($q$insert into public.session_messages (session_id, role, content) values ('a1a1a1a1-0000-0000-0000-000000000001', 'user', 'forged')$q$),
  'A cannot write session messages directly');
select rls_test.check(
  rls_test.refused($q$delete from public.session_messages$q$),
  'A cannot delete session messages');

select rls_test.check(rls_test.visible('select * from public.drill_attempts') = 1,
  'A sees only their own drill attempts');
select rls_test.check(
  rls_test.changed($q$insert into public.drill_attempts (user_id, drill_id, correct) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'drill-a2', false)$q$) = 1,
  'A can record their own drill attempt');
select rls_test.check(
  rls_test.refused($q$insert into public.drill_attempts (user_id, drill_id, correct) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'forged', true)$q$),
  'A cannot record a drill attempt as B');
select rls_test.check(
  rls_test.refused($q$delete from public.drill_attempts$q$),
  'A cannot delete drill attempts (that would reset the daily limit)');
select rls_test.check(
  rls_test.refused($q$update public.drill_attempts set correct = true$q$),
  'A cannot edit drill attempts');

-- Tables that hold answer keys, costs, payments or internal data: no access at all.
do $$
declare t text;
begin
  foreach t in array array['math_checks', 'ai_usage', 'stripe_customers', 'stripe_events', 'leads', 'events'] loop
    perform rls_test.check(
      rls_test.refused(format('select * from public.%I', t)),
      format('A cannot read %s', t));
    perform rls_test.check(
      rls_test.refused(format('delete from public.%I', t)),
      format('A cannot delete from %s', t));
  end loop;
  perform rls_test.check(
    rls_test.refused($q$insert into public.leads (org, email) values ('x', 'x@example.test')$q$),
    'A cannot write leads directly (they go through the server)');
  perform rls_test.check(
    rls_test.refused($q$insert into public.events (name) values ('signup')$q$),
    'A cannot write events directly');
end $$;

-- ---------------------------------------------------------------------------
-- A visitor who is not logged in (anon) can read nothing
-- ---------------------------------------------------------------------------

select rls_test.become('anon');

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'entitlements', 'case_sessions', 'session_messages', 'math_checks',
    'drill_attempts', 'ai_usage', 'stripe_customers', 'stripe_events', 'leads', 'events'
  ] loop
    perform rls_test.check(
      rls_test.refused(format('select * from public.%I', t)),
      format('a visitor cannot read %s', t));
  end loop;
  perform rls_test.check(
    rls_test.refused($q$insert into public.leads (org, email) values ('x', 'x@example.test')$q$),
    'a visitor cannot write leads directly');
  perform rls_test.check(
    rls_test.refused($q$insert into public.events (name) values ('signup')$q$),
    'a visitor cannot write events directly');
  perform rls_test.check(
    rls_test.refused($q$insert into public.drill_attempts (user_id, drill_id, correct) values (gen_random_uuid(), 'x', true)$q$),
    'a visitor cannot write drill attempts');
end $$;

-- ---------------------------------------------------------------------------
-- The server (secret key / service_role) can still do its job
-- ---------------------------------------------------------------------------

select rls_test.become('service_role');

select rls_test.check(rls_test.visible('select * from public.case_sessions') >= 2,
  'the server can read all case sessions');
select rls_test.check(
  rls_test.changed($q$update public.entitlements set plan = 'pass90' where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$q$) = 1,
  'the server can change an entitlement');
select rls_test.check(
  rls_test.changed($q$insert into public.leads (org, email) values ('Server Lead', 'server@example.test')$q$) = 1,
  'the server can save a lead');

-- ---------------------------------------------------------------------------
-- The interview functions: server only, limits enforced, one save at a time
-- ---------------------------------------------------------------------------

select rls_test.become('postgres');

insert into auth.users (id, email) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'rls-user-c@example.test');

select rls_test.check(
  not has_function_privilege('anon', 'public.start_interview_session(uuid,text,text,integer,integer,integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.start_interview_session(uuid,text,text,integer,integer,integer)', 'execute')
  and not has_function_privilege('anon', 'public.commit_interview_turn(uuid,integer,text,text,text,text[],text,integer,jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.commit_interview_turn(uuid,integer,text,text,text,text[],text,integer,jsonb)', 'execute'),
  'browsers cannot call the interview functions');

select rls_test.check(
  has_function_privilege('service_role', 'public.start_interview_session(uuid,text,text,integer,integer,integer)', 'execute')
  and has_function_privilege('service_role', 'public.commit_interview_turn(uuid,integer,text,text,text,text[],text,integer,jsonb)', 'execute'),
  'the server can call the interview functions');

select rls_test.become('authenticated', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
select rls_test.check(
  rls_test.refused($q$select public.start_interview_session('cccccccc-cccc-cccc-cccc-cccccccccccc', 'case-c', 'hi', null, null, null)$q$),
  'a logged-in user cannot start an interview by calling the function directly (limits would be skipped)');

select rls_test.become('service_role');

do $$
declare
  c constant uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  r jsonb;
  sid uuid;
  ok boolean;
  n integer;
  row_s public.case_sessions;
begin
  -- Free-plan style limit: 1 session in total.
  r := public.start_interview_session(c, 'case-c', 'Welcome to the case.', 1, null, null);
  perform rls_test.check(r ? 'session_id', 'a first interview can be started');
  sid := (r ->> 'session_id')::uuid;
  select * into row_s from public.case_sessions where id = sid;
  perform rls_test.check(row_s.stage = 'intro' and row_s.turns = 0 and row_s.user_id = c and row_s.revealed_exhibits = '{}',
    'a new session starts at the intro stage with no turns and no exhibits shown');
  perform rls_test.check((select count(*) from public.session_messages where session_id = sid and role = 'assistant') = 1,
    'the interviewer''s opening message is saved with the session');

  perform rls_test.check(public.start_interview_session(c, 'case-c2', 'x', 1, null, null) ->> 'blocked' = 'total',
    'a second interview is refused when the total limit is 1');
  perform rls_test.check(public.start_interview_session(c, 'case-c2', 'x', null, 1, null) ->> 'blocked' = 'day',
    'a second interview today is refused when the daily limit is 1');
  perform rls_test.check(public.start_interview_session(c, 'case-c2', 'x', null, null, 1) ->> 'blocked' = 'month',
    'a second interview this month is refused when the monthly limit is 1');
  perform rls_test.check((select count(*) from public.case_sessions where user_id = c) = 1,
    'refused starts create nothing');

  r := public.start_interview_session(c, 'case-c3', 'Welcome.', null, 3, 60);
  perform rls_test.check(r ? 'session_id', 'a paid-style limit (3 a day, 60 a month) lets a second interview start');

  -- Saving a turn.
  ok := public.commit_interview_turn(sid, 5, 'my answer', 'reply', 'clarifying', '{}', null, null, '[]'::jsonb);
  perform rls_test.check(ok = false, 'saving a turn with the wrong turn number is refused');
  perform rls_test.check((select count(*) from public.session_messages where session_id = sid) = 1,
    'a refused save changes nothing');

  ok := public.commit_interview_turn(sid, 0, 'my first message', 'interviewer reply', 'clarifying', array['ex1'], 'summary so far', 2,
    '[{"math_id":"m1","given":10,"expected":12,"correct":false}]'::jsonb);
  select * into row_s from public.case_sessions where id = sid;
  perform rls_test.check(ok and row_s.turns = 1 and row_s.stage = 'clarifying' and row_s.revealed_exhibits = array['ex1'] and row_s.summary = 'summary so far' and row_s.summary_covers = 2,
    'saving a turn updates turns, stage, exhibits shown and summary');
  perform rls_test.check((select array_agg(role order by created_at) from public.session_messages where session_id = sid) = array['assistant','user','assistant'],
    'messages come back in the order they were written');
  perform rls_test.check((select count(*) from public.session_messages where session_id = sid) = 3,
    'saving a turn stores the candidate message and the interviewer reply');

  ok := public.commit_interview_turn(sid, 0, 'a duplicate', 'reply', 'clarifying', '{}', null, null, '[]'::jsonb);
  perform rls_test.check(ok = false, 'a second save for the same turn is refused (no double replies)');

  ok := public.commit_interview_turn(sid, 1, 'second message', 'second reply', 'analysis', array['ex1'], null, null,
    '[{"math_id":"m1","given":12,"expected":12,"correct":true}]'::jsonb);
  perform rls_test.check((select given from public.math_checks where session_id = sid and math_id = 'm1') = 12
    and (select correct from public.math_checks where session_id = sid and math_id = 'm1')
    and (select count(*) from public.math_checks where session_id = sid) = 1,
    'a new answer to the same maths question replaces the old one');
  perform rls_test.check((select summary from public.case_sessions where id = sid) = 'summary so far',
    'a save without a new summary keeps the earlier one');

  ok := public.commit_interview_turn(sid, 2, null, 'a nudge from the interviewer', 'analysis', array['ex1'], null, null, '[]'::jsonb);
  perform rls_test.check(ok and (select turns from public.case_sessions where id = sid) = 2,
    'an interviewer-only message does not count as a candidate turn');

  update public.case_sessions set completed_at = now() where id = sid;
  ok := public.commit_interview_turn(sid, 2, 'too late', 'reply', 'analysis', '{}', null, null, '[]'::jsonb);
  perform rls_test.check(ok = false, 'a finished session accepts no more turns');
end $$;

select rls_test.become('postgres');

-- ---------------------------------------------------------------------------
-- Payments: who can change a plan, and how purchases and refunds add up
-- ---------------------------------------------------------------------------

select rls_test.become('postgres');

select rls_test.check(
  not has_function_privilege('anon', 'public.grant_pass_purchase(uuid,text,text,integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.grant_pass_purchase(uuid,text,text,integer)', 'execute')
  and not has_function_privilege('anon', 'public.revoke_pass_purchase(uuid,text,integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.revoke_pass_purchase(uuid,text,integer)', 'execute')
  and not has_function_privilege('anon', 'public.set_subscription_state(uuid,text,text,timestamptz)', 'execute')
  and not has_function_privilege('authenticated', 'public.set_subscription_state(uuid,text,text,timestamptz)', 'execute'),
  'browsers cannot call the payment functions');

select rls_test.check(
  has_function_privilege('service_role', 'public.grant_pass_purchase(uuid,text,text,integer)', 'execute')
  and has_function_privilege('service_role', 'public.revoke_pass_purchase(uuid,text,integer)', 'execute')
  and has_function_privilege('service_role', 'public.set_subscription_state(uuid,text,text,timestamptz)', 'execute'),
  'the server can call the payment functions');

do $$
declare
  rejected boolean := false;
begin
  begin
    update public.entitlements set status = 'made_up' where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  exception when check_violation then
    rejected := true;
  end;
  perform rls_test.check(rejected, 'an entitlement status Stripe does not use is refused');
end $$;

insert into auth.users (id, email) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'rls-user-d@example.test'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'rls-user-e@example.test'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'rls-user-f@example.test');

select rls_test.become('service_role');

do $$
declare
  d constant uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  e constant uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  f constant uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  row_e public.entitlements;
  first_end timestamptz;
  missing_ok boolean := false;
begin
  -- A first pass: 90 days from now.
  perform rls_test.check(public.grant_pass_purchase(d, 'cs_1', 'pi_1', 90), 'a paid pass is added');
  select * into row_e from public.entitlements where user_id = d;
  first_end := row_e.expires_at;
  perform rls_test.check(row_e.plan = 'pass90' and row_e.status = 'active' and row_e.stripe_ref = 'pi_1'
    and first_end between now() + interval '89 days 23 hours' and now() + interval '90 days 1 hour',
    'a pass lasts 90 days from now');

  -- The same checkout twice adds nothing.
  perform rls_test.check(public.grant_pass_purchase(d, 'cs_1', 'pi_1', 90) = false, 'the same checkout is not counted twice');
  perform rls_test.check((select expires_at from public.entitlements where user_id = d) = first_end,
    'a repeated message leaves the end date alone');

  -- Buying again extends from the current end date.
  perform rls_test.check(public.grant_pass_purchase(d, 'cs_2', 'pi_2', 90), 'a second pass is added');
  perform rls_test.check((select expires_at from public.entitlements where user_id = d) = first_end + interval '90 days',
    'buying again extends the pass by 90 more days');

  -- A full refund of one purchase takes its 90 days back, once.
  perform rls_test.check(public.revoke_pass_purchase(d, 'ch_2', 90), 'a refunded pass is taken back');
  perform rls_test.check((select expires_at from public.entitlements where user_id = d) = first_end
    and (select status from public.entitlements where user_id = d) = 'active',
    'refunding the second purchase leaves the first 90 days');
  perform rls_test.check(public.revoke_pass_purchase(d, 'ch_2', 90) = false, 'the same refund is not applied twice');
  perform rls_test.check((select expires_at from public.entitlements where user_id = d) = first_end,
    'a repeated refund message changes nothing');
  perform rls_test.check(public.revoke_pass_purchase(d, 'ch_1', 90), 'refunding the first purchase too');
  select * into row_e from public.entitlements where user_id = d;
  perform rls_test.check(row_e.status = 'refunded' and row_e.expires_at <= now(), 'a fully refunded pass ends access now');

  -- A group plan is never replaced by a purchase.
  update public.entitlements set plan = 'group', status = 'active' where user_id = e;
  perform rls_test.check(public.grant_pass_purchase(e, 'cs_3', 'pi_3', 90), 'a purchase by a group member is accepted');
  perform rls_test.check((select plan from public.entitlements where user_id = e) = 'group', 'and the group plan stays');

  -- Subscriptions.
  perform public.set_subscription_state(f, 'sub_1', 'active', now() + interval '33 days');
  select * into row_e from public.entitlements where user_id = f;
  perform rls_test.check(row_e.plan = 'monthly' and row_e.status = 'active' and row_e.stripe_ref = 'sub_1', 'a subscription starts the monthly plan');
  perform public.set_subscription_state(f, 'sub_1', 'past_due', now() + interval '33 days');
  perform rls_test.check((select status from public.entitlements where user_id = f) = 'past_due', 'a failed payment is copied across');
  perform public.set_subscription_state(f, 'sub_1', 'canceled', now());
  perform rls_test.check((select status from public.entitlements where user_id = f) = 'canceled', 'a cancelled subscription ends the plan');

  -- A new subscription is not undone by a late message about the old one.
  perform public.set_subscription_state(f, 'sub_2', 'active', now() + interval '33 days');
  perform public.set_subscription_state(f, 'sub_1', 'canceled', now());
  select * into row_e from public.entitlements where user_id = f;
  perform rls_test.check(row_e.status = 'active' and row_e.stripe_ref = 'sub_2', 'an old subscription ending does not end the new one');

  -- A running pass is not ended by an old subscription ending.
  perform rls_test.check(public.grant_pass_purchase(f, 'cs_4', 'pi_4', 90), 'a subscriber can still buy a pass');
  perform public.set_subscription_state(f, 'sub_2', 'canceled', now());
  select * into row_e from public.entitlements where user_id = f;
  perform rls_test.check(row_e.plan = 'pass90' and row_e.status = 'active', 'a running pass survives its subscriber cancelling');

  -- A user who has been deleted: the purchase is refused and nothing is kept.
  begin
    perform public.grant_pass_purchase('99999999-9999-9999-9999-999999999999', 'cs_gone', 'pi_gone', 90);
  exception when foreign_key_violation then
    missing_ok := true;
  end;
  perform rls_test.check(missing_ok, 'a purchase for a deleted user is refused');
  perform rls_test.check(not exists (select 1 from public.stripe_events where id = 'pass:cs_gone'),
    'and its claim is rolled back, so Stripe can retry safely');
end $$;

select rls_test.become('postgres');

-- ---------------------------------------------------------------------------
-- Deleting a user deletes all of their data (and only theirs)
-- ---------------------------------------------------------------------------

select rls_test.become('postgres');

delete from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select rls_test.check(
  (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.entitlements where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.case_sessions where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.session_messages where session_id = 'a1a1a1a1-0000-0000-0000-000000000001')
  + (select count(*) from public.math_checks where session_id = 'a1a1a1a1-0000-0000-0000-000000000001')
  + (select count(*) from public.drill_attempts where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.ai_usage where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.stripe_customers where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.events where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 0,
  'deleting user A deletes every row that belongs to A');

select rls_test.check(
  (select count(*) from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1
  and (select count(*) from public.case_sessions where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1
  and (select count(*) from public.session_messages where session_id = 'b1b1b1b1-0000-0000-0000-000000000001') = 1
  and (select count(*) from public.math_checks where session_id = 'b1b1b1b1-0000-0000-0000-000000000001') = 1
  and (select count(*) from public.stripe_customers where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1,
  'deleting user A leaves the data of B untouched');

select 'ALL RLS CHECKS PASSED' as result;

rollback;
