-- Supabase's security advisor (lint 0008, rls_enabled_no_policy) flags tables that
-- have Row Level Security switched on but no policy at all.
--
-- For these tables that is intentional: browsers (anon, authenticated) have no
-- privileges on them, and only the server (the secret key, service_role, which
-- bypasses Row Level Security) reads or writes. This migration states the intent
-- with an explicit deny-all policy per table, which clears the notice. It does not
-- change who can do what: access was already denied.

create policy "deny all to browsers" on public.math_checks
  for all to anon, authenticated using (false) with check (false);

create policy "deny all to browsers" on public.ai_usage
  for all to anon, authenticated using (false) with check (false);

create policy "deny all to browsers" on public.stripe_customers
  for all to anon, authenticated using (false) with check (false);

create policy "deny all to browsers" on public.stripe_events
  for all to anon, authenticated using (false) with check (false);

create policy "deny all to browsers" on public.leads
  for all to anon, authenticated using (false) with check (false);

create policy "deny all to browsers" on public.events
  for all to anon, authenticated using (false) with check (false);
