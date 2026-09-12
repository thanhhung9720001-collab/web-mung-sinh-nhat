-- Keep contribution throttling in Postgres so all serverless instances share the
-- same counters. Only an HMAC digest is stored; raw visitor IPs never enter the
-- database.
create table public.contribution_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  attempt_count integer not null,
  updated_at timestamptz not null default now(),

  constraint contribution_rate_limits_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint contribution_rate_limits_attempt_count_check
    check (attempt_count > 0)
);

alter table public.contribution_rate_limits enable row level security;

revoke all on table public.contribution_rate_limits
  from public, anon, authenticated;

create function public.check_contribution_rate_limit(
  p_key_hash text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_count integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key';
  end if;

  if p_max_attempts < 1 or p_max_attempts > 100 then
    raise exception 'Invalid maximum attempt count';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window';
  end if;

  insert into public.contribution_rate_limits as limits (
    key_hash,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (p_key_hash, current_time, 1, current_time)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at <= current_time - make_interval(secs => p_window_seconds)
        then current_time
      else limits.window_started_at
    end,
    attempt_count = case
      when limits.window_started_at <= current_time - make_interval(secs => p_window_seconds)
        then 1
      else limits.attempt_count + 1
    end,
    updated_at = current_time
  returning attempt_count into current_count;

  return current_count <= p_max_attempts;
end;
$$;

revoke all on function public.check_contribution_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_contribution_rate_limit(text, integer, integer)
  to service_role;

comment on table public.contribution_rate_limits is
  'Shared contribution throttling counters keyed by a server-generated HMAC digest.';

comment on function public.check_contribution_rate_limit(text, integer, integer) is
  'Atomically consumes one contribution attempt and reports whether it is allowed.';
