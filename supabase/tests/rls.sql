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
