-- P4: payments.
--
-- * entitlements.status gets a check now that the Stripe states are known.
-- * Three functions change a user's plan. Each is atomic and server only
--   (the secret key / service_role); browsers cannot call them.
--     grant_pass_purchase()      adds 90 days for one paid checkout, exactly once
--     revoke_pass_purchase()     takes those days back after a full refund, exactly once
--     set_subscription_state()   copies a Stripe subscription's current state
--   The "exactly once" claims reuse stripe_events, keyed 'pass:<checkout session>'
--   and 'refund:<charge>', so a repeated webhook can never add or remove days twice.

alter table public.entitlements
  add constraint entitlements_status_check
  check (status in (
    'active', 'trialing', 'past_due', 'unpaid', 'canceled',
    'incomplete', 'incomplete_expired', 'paused', 'refunded'
  ));

-- ---------------------------------------------------------------------------
-- A paid 90-day pass. Buying again extends from the current end date.
-- Returns true if the days were added, false if this purchase was already counted.
-- Raises a foreign-key error (23503) if the user no longer exists; nothing is kept then.
-- ---------------------------------------------------------------------------
create function public.grant_pass_purchase(
  p_user_id uuid,
  p_ref text,          -- the Checkout Session id
  p_payment_ref text,  -- the payment id, kept in entitlements.stripe_ref
  p_days integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e public.entitlements;
  n integer;
  base timestamptz;
begin
  insert into public.stripe_events (id, type) values ('pass:' || p_ref, 'pass_purchase')
    on conflict (id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then
    return false;
  end if;

  insert into public.entitlements (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into e from public.entitlements where user_id = p_user_id for update;

  -- A group plan is set by hand; a purchase never replaces it.
  if e.plan = 'group' and e.status = 'active' then
    return true;
  end if;

  base := now();
  if e.plan = 'pass90' and e.status = 'active' and e.expires_at is not null and e.expires_at > base then
    base := e.expires_at;
  end if;

  update public.entitlements
    set plan = 'pass90', status = 'active', expires_at = base + make_interval(days => p_days), stripe_ref = p_payment_ref
    where user_id = p_user_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- A fully refunded pass purchase: take its days back (never below "now").
-- ---------------------------------------------------------------------------
create function public.revoke_pass_purchase(
  p_user_id uuid,
  p_ref text,          -- the refunded charge id
  p_days integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e public.entitlements;
  n integer;
  remaining timestamptz;
begin
  insert into public.stripe_events (id, type) values ('refund:' || p_ref, 'pass_refund')
    on conflict (id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then
    return false;
  end if;

  select * into e from public.entitlements where user_id = p_user_id for update;
  if not found or e.plan <> 'pass90' then
    return true;
  end if;

  remaining := coalesce(e.expires_at, now()) - make_interval(days => p_days);
  if remaining <= now() then
    update public.entitlements set status = 'refunded', expires_at = now() where user_id = p_user_id;
  else
    update public.entitlements set expires_at = remaining where user_id = p_user_id;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Copy a Stripe subscription's state. p_expires is the end of the paid period plus a
-- short grace, so access still lapses if a cancellation message never arrives.
-- ---------------------------------------------------------------------------
create function public.set_subscription_state(
  p_user_id uuid,
  p_subscription_id text,
  p_status text,
  p_expires timestamptz
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e public.entitlements;
  live constant text[] := array['active', 'trialing'];
begin
  insert into public.entitlements (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into e from public.entitlements where user_id = p_user_id for update;

  -- A group plan is set by hand.
  if e.plan = 'group' and e.status = 'active' then
    return;
  end if;
  -- A running pass is not ended by news of an old subscription ending.
  if e.plan = 'pass90' and e.status = 'active' and e.expires_at > now() and not (p_status = any (live)) then
    return;
  end if;
  -- A late message about an older subscription must not overwrite a newer live one.
  if e.plan = 'monthly' and e.status = any (live)
     and e.stripe_ref is distinct from p_subscription_id and not (p_status = any (live)) then
    return;
  end if;

  update public.entitlements
    set plan = 'monthly', status = p_status, expires_at = p_expires, stripe_ref = p_subscription_id
    where user_id = p_user_id;
end;
$$;

revoke execute on function public.grant_pass_purchase(uuid, text, text, integer) from public, anon, authenticated;
revoke execute on function public.revoke_pass_purchase(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.set_subscription_state(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.grant_pass_purchase(uuid, text, text, integer) to service_role;
grant execute on function public.revoke_pass_purchase(uuid, text, integer) to service_role;
grant execute on function public.set_subscription_state(uuid, text, text, timestamptz) to service_role;
