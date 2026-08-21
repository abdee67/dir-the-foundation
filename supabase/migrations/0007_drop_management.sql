-- =====================================================================
-- 0007_drop_management.sql
-- Premium drop lifecycle control. All customer-facing phase decisions are
-- made server-side from these timestamptz values or an explicit manual phase.
-- =====================================================================

begin;

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  drop_number text not null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','scheduled','active','completed','archived')),
  current_phase text not null default 'teaser' check (current_phase in ('teaser','reveal','store')),
  teaser_hero_media_id uuid references public.media(id) on delete set null,
  teaser_starts_at timestamptz,
  teaser_ends_at timestamptz,
  reveal_product_id uuid references public.products(id) on delete set null,
  mens_campaign_media_id uuid references public.media(id) on delete set null,
  womens_campaign_media_id uuid references public.media(id) on delete set null,
  store_starts_at timestamptz,
  automatic_transitions_enabled boolean not null default true,
  manual_phase_override text check (manual_phase_override in ('teaser','reveal','store')),
  launch_notification_sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, drop_number),
  constraint drops_teaser_timing_valid check (
    teaser_starts_at is null or teaser_ends_at is null or teaser_ends_at > teaser_starts_at
  ),
  constraint drops_store_timing_valid check (
    teaser_ends_at is null or store_starts_at is null or store_starts_at > teaser_ends_at
  )
);

-- A database guarantee; the application also confirms the replacement to the
-- administrator before it changes a live drop.
create unique index drops_one_active_per_org_idx on public.drops(org_id) where status = 'active';
create index drops_org_status_updated_idx on public.drops(org_id, status, updated_at desc);

-- The live-drop swap is atomic: an error cannot complete the old campaign
-- without activating the next one. The advisory lock serializes per-org swaps.
create or replace function public.activate_drop(p_drop_id uuid, p_actor_id uuid)
returns table (replaced_drop_id uuid, is_scheduled boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.drops%rowtype; replaced_id uuid; next_phase text;
begin
  select * into target from public.drops where id = p_drop_id for update;
  if not found then raise exception 'drop_not_found'; end if;
  if target.status in ('archived', 'completed') then raise exception 'drop_cannot_activate'; end if;
  if target.teaser_hero_media_id is null or target.teaser_starts_at is null or target.teaser_ends_at is null or target.store_starts_at is null then raise exception 'drop_schedule_incomplete'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target.org_id::text, 0));
  if now() < target.teaser_starts_at then
    update public.drops set status = 'scheduled', current_phase = 'teaser', manual_phase_override = null, updated_by = p_actor_id, updated_at = now() where id = target.id;
    return query select null::uuid, true;
    return;
  end if;
  next_phase := case when now() < target.teaser_ends_at then 'teaser' when now() < target.store_starts_at then 'reveal' else 'store' end;
  if next_phase = 'reveal' then
    if target.reveal_product_id is null or target.mens_campaign_media_id is null or target.womens_campaign_media_id is null then raise exception 'drop_reveal_incomplete'; end if;
    if not exists (select 1 from public.products p where p.id = target.reveal_product_id and p.org_id = target.org_id and p.status = 'active') then raise exception 'drop_reveal_product_inactive'; end if;
  end if;
  select id into replaced_id from public.drops where org_id = target.org_id and status = 'active' and id <> target.id for update;
  if replaced_id is not null then update public.drops set status = 'completed', updated_by = p_actor_id, updated_at = now() where id = replaced_id; end if;
  update public.drops set status = 'active', current_phase = next_phase, manual_phase_override = null, updated_by = p_actor_id, updated_at = now() where id = target.id;
  return query select replaced_id, false;
end;
$$;
revoke all on function public.activate_drop(uuid, uuid) from public, anon, authenticated;
grant execute on function public.activate_drop(uuid, uuid) to service_role;

create table public.drop_waitlist (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops(id) on delete cascade,
  email text not null,
  notification_status text not null default 'waiting' check (notification_status in ('waiting','sending','sent','failed')),
  notified_at timestamptz,
  notification_error text,
  created_at timestamptz not null default now(),
  unique(drop_id, email)
);
create index drop_waitlist_drop_status_idx on public.drop_waitlist(drop_id, notification_status, created_at desc);

create table public.drop_phase_events (
  id bigint generated always as identity primary key,
  drop_id uuid not null references public.drops(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  from_phase text check (from_phase in ('teaser','reveal','store')),
  to_phase text not null check (to_phase in ('teaser','reveal','store')),
  transition_type text not null check (transition_type in ('automatic','manual','notification')),
  triggered_by uuid references auth.users(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index drop_phase_events_drop_created_idx on public.drop_phase_events(drop_id, created_at desc);

alter table public.drops enable row level security;
alter table public.drop_waitlist enable row level security;
alter table public.drop_phase_events enable row level security;

create policy drops_select_members on public.drops for select to authenticated
  using (public.is_org_member(org_id));
-- Mutations are intentionally service-role-only through the server actions.
-- This prevents a browser client from bypassing lifecycle confirmation and
-- single-active-drop handling, while the app enforces its role checks.

create policy drop_waitlist_select_manager_up on public.drop_waitlist for select to authenticated
  using (exists (select 1 from public.drops d where d.id = drop_waitlist.drop_id and public.has_org_role(d.org_id, array['owner','admin','manager'])));
-- Waitlist writes likewise go through trusted server code. A public subscribe
-- action can be added later without granting anonymous table access.

create policy drop_phase_events_select_members on public.drop_phase_events for select to authenticated
  using (public.is_org_member(org_id));
-- Appends happen only in trusted server actions/service role; no direct write policy.

-- Drops are a first-class admin capability for the existing single-store org.
-- Preserve custom module selections while making the new control room visible.
update public.orgs
set enabled_modules = array_append(enabled_modules, 'drops')
where not ('drops' = any(enabled_modules));

commit;
