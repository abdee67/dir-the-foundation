-- A subscription must be associated with a teaser that is live at the moment
-- it is persisted. This closes the gap between a separate application-level
-- phase check and insert while keeping all table access private behind RLS.

create or replace function public.subscribe_to_active_drop_waitlist(
  p_drop_id uuid,
  p_email text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(btrim(p_email));
begin
  if normalized_email = '' or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return 'invalid';
  end if;

  if not exists (
    select 1
    from public.drops
    where id = p_drop_id
      and status = 'active'
      and current_phase = 'teaser'
  ) then
    return 'inactive';
  end if;

  insert into public.drop_waitlist (drop_id, email)
  values (p_drop_id, normalized_email)
  on conflict do nothing;

  if found then
    return 'joined';
  end if;

  return 'duplicate';
end;
$$;

revoke all on function public.subscribe_to_active_drop_waitlist(uuid, text) from public, anon, authenticated;
grant execute on function public.subscribe_to_active_drop_waitlist(uuid, text) to service_role;
