-- Initial schema (kit section 9).
--
-- Security model:
--   * Row Level Security is switched on for every table.
--   * Nobody gets access by default: all table privileges are revoked from
--     `anon` (visitors) and `authenticated` (logged-in users), then the few
--     things users genuinely need are granted back, one by one.
--   * Anything that decides money, limits or scores (entitlements, sessions,
--     usage, math checks, Stripe data, events, leads) is written only by the
--     server with the secret key (`service_role`), never by the browser.
--   * Deleting a user in auth.users deletes all of their rows (UK GDPR
--     "delete my account and data").
--
-- supabase/tests/rls.sql proves the above; keep it in step with this file.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  country text,
  marketing_opt_in boolean not null default false
);

-- One row per user. P4 adds a check on `status` once the Stripe states are known.
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'monthly', 'pass90', 'group')),
  status text not null default 'active',
  expires_at timestamptz,
  stripe_ref text
);

create table public.case_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id text not null,
  stage text not null default 'intro'
    check (stage in ('intro', 'clarifying', 'structure', 'analysis', 'brainstorm', 'synthesis', 'debrief')),
  turns integer not null default 0 check (turns >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  scores jsonb,
  summary text
);
create index case_sessions_user_idx on public.case_sessions (user_id, started_at desc);

-- Deleted after the retention period (siteConfig.transcriptRetentionDays).
create table public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.case_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index session_messages_session_idx on public.session_messages (session_id, created_at);
create index session_messages_created_idx on public.session_messages (created_at);

-- `expected` is an answer key, so browsers can never read this table directly.
-- The server shows it on the debrief page after a session is finished.
create table public.math_checks (
  session_id uuid not null references public.case_sessions (id) on delete cascade,
  math_id text not null,
  given numeric not null,
  expected numeric not null,
  correct boolean not null,
  primary key (session_id, math_id)
);

create table public.drill_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  drill_id text not null,
  correct boolean not null,
  ms integer check (ms >= 0),
  created_at timestamptz not null default now()
);
create index drill_attempts_user_idx on public.drill_attempts (user_id, created_at desc);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.case_sessions (id) on delete set null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_estimate_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_user_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_created_idx on public.ai_usage (created_at);

create table public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique
);

-- Not linked to a user. Lets the webhook skip events it has already handled.
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- University and club enquiries, written by /api/leads. Length limits keep a
-- public form from being used to fill the database.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org text not null check (char_length(org) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  size text check (char_length(size) <= 100),
  message text check (char_length(message) <= 5000),
  created_at timestamptz not null default now()
);

-- Funnel events. No IP addresses are stored. Deleted after 180 days.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (name in ('signup', 'case_started', 'case_completed', 'paywall_viewed', 'checkout_started', 'purchase')),
  path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete cascade
);
create index events_created_idx on public.events (created_at);
create index events_name_created_idx on public.events (name, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security on every table
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.case_sessions enable row level security;
alter table public.session_messages enable row level security;
alter table public.math_checks enable row level security;
alter table public.drill_attempts enable row level security;
alter table public.ai_usage enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.stripe_events enable row level security;
alter table public.leads enable row level security;
alter table public.events enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, grant back only what users need
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

-- Tables created in future migrations start locked as well.
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (country, marketing_opt_in) on public.profiles to authenticated;
grant select on public.entitlements to authenticated;
grant select on public.case_sessions to authenticated;
grant select on public.session_messages to authenticated;
grant select, insert on public.drill_attempts to authenticated;

-- ---------------------------------------------------------------------------
-- Policies (the `select auth.uid()` form lets Postgres evaluate it once per query)
-- ---------------------------------------------------------------------------

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "entitlements: read own" on public.entitlements
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "case_sessions: read own" on public.case_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "session_messages: read own" on public.session_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.case_sessions s
      where s.id = session_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy "drill_attempts: read own" on public.drill_attempts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "drill_attempts: insert own" on public.drill_attempts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- New user -> profile + free entitlement
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.entitlements (user_id) values (new.id);
  return new;
end;
$$;

-- Only the trigger should ever run this, never a browser.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
