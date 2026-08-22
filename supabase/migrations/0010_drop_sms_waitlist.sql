-- Replace the initial email waitlist with a phone-based SMS waitlist.
-- Existing email-only entries are retained for audit but marked failed because
-- there is no safe way to infer a mobile number from an email address.

alter table public.drops
  add column if not exists launch_message text;

alter table public.drop_waitlist
  rename column email to phone_number;

alter table public.drop_waitlist
  rename column notification_error to last_error;

alter table public.drop_waitlist
  add column if not exists provider_message_id text,
  add column if not exists provider_campaign_id text;

update public.drop_waitlist
set notification_status = 'queued'
where notification_status = 'sending';

alter table public.drop_waitlist
  drop constraint if exists drop_waitlist_notification_status_check;

alter table public.drop_waitlist
  add constraint drop_waitlist_notification_status_check
  check (notification_status in ('waiting', 'queued', 'sent', 'failed'));

-- Keep pre-SMS records private and make them ineligible for a bulk send.
update public.drop_waitlist
set notification_status = 'failed',
    last_error = coalesce(last_error, 'Legacy email subscription cannot receive SMS.')
where phone_number !~ '^\+2519[0-9]{8}$';

alter table public.drop_waitlist
  drop constraint if exists drop_waitlist_drop_id_email_key;
drop index if exists public.drop_waitlist_drop_lower_email_key;
create unique index if not exists drop_waitlist_drop_phone_number_key
  on public.drop_waitlist (drop_id, phone_number);
create index if not exists drop_waitlist_campaign_idx
  on public.drop_waitlist (provider_campaign_id)
  where provider_campaign_id is not null;

drop function if exists public.subscribe_to_active_drop_waitlist(uuid, text);

create function public.subscribe_to_active_drop_waitlist(
  p_drop_id uuid,
  p_phone_number text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_phone text := regexp_replace(btrim(p_phone_number), '[[:space:]().-]', '', 'g');
begin
  if normalized_phone ~ '^09[0-9]{8}$' then
    normalized_phone := '+251' || substr(normalized_phone, 2);
  elsif normalized_phone ~ '^9[0-9]{8}$' then
    normalized_phone := '+251' || normalized_phone;
  elsif normalized_phone ~ '^2519[0-9]{8}$' then
    normalized_phone := '+' || normalized_phone;
  end if;

  if normalized_phone !~ '^\+2519[0-9]{8}$' then
    return 'invalid';
  end if;

  if not exists (
    select 1 from public.drops
    where id = p_drop_id and status = 'active' and current_phase = 'teaser'
  ) then
    return 'inactive';
  end if;

  insert into public.drop_waitlist (drop_id, phone_number)
  values (p_drop_id, normalized_phone)
  on conflict do nothing;

  if found then return 'joined'; end if;
  return 'duplicate';
end;
$$;

revoke all on function public.subscribe_to_active_drop_waitlist(uuid, text) from public, anon, authenticated;
grant execute on function public.subscribe_to_active_drop_waitlist(uuid, text) to service_role;
