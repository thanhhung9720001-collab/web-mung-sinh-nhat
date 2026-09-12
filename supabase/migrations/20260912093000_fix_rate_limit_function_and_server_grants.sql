-- The first function version used a variable name that PostgreSQL resolved as
-- the CURRENT_TIME keyword inside SQL expressions. Replace it with an
-- unambiguous name and explicitly grant trusted backend table privileges.
create or replace function public.check_contribution_rate_limit(
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
  v_now timestamptz := clock_timestamp();
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
  values (p_key_hash, v_now, 1, v_now)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    attempt_count = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else limits.attempt_count + 1
    end,
    updated_at = v_now
  returning attempt_count into current_count;

  return current_count <= p_max_attempts;
end;
$$;

grant select, insert, update, delete on table public.wishes to service_role;
grant select, insert, update, delete on table public.contribution_rate_limits
  to service_role;
