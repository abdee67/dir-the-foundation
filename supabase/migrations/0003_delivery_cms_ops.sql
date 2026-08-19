-- Delivery pricing zones and CMS content for the single clothing store.
-- No COD, riders, couriers, delivery records, or courier tracking.

begin;

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  districts text[] not null default '{}'::text[],
  charge bigint not null default 0 check (charge >= 0),
  eta_text text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index delivery_zones_org_active_position_idx on public.delivery_zones(org_id, is_active, position);
alter table public.delivery_zones enable row level security;
create policy delivery_zones_select_members on public.delivery_zones for select to authenticated using (public.is_org_member(org_id));
create policy delivery_zones_write_admin on public.delivery_zones for all to authenticated using (public.has_org_role(org_id, array['owner','admin','manager'])) with check (public.has_org_role(org_id, array['owner','admin','manager']));

alter table public.orders add constraint orders_delivery_zone_id_fkey foreign key (delivery_zone_id) references public.delivery_zones(id) on delete set null;

create table public.cms_pages (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, slug text not null, type text not null default 'page' check (type in ('page','home','policy')),
  blocks jsonb not null default '[]'::jsonb, draft_blocks jsonb, status text not null default 'draft' check (status in ('draft','published')),
  seo jsonb, published_at timestamptz, updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(org_id, slug)
);
create table public.cms_revisions (
  id bigint generated always as identity primary key, org_id uuid not null references public.orgs(id) on delete cascade,
  page_id uuid not null references public.cms_pages(id) on delete cascade, blocks jsonb not null default '[]'::jsonb,
  saved_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.menus (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references public.orgs(id) on delete cascade,
  handle text not null check (handle in ('header','footer')), items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), unique(org_id, handle)
);
alter table public.cms_pages enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.menus enable row level security;
create policy cms_pages_member_read on public.cms_pages for select to authenticated using (public.is_org_member(org_id));
create policy cms_pages_admin_write on public.cms_pages for all to authenticated using (public.has_org_role(org_id, array['owner','admin','manager'])) with check (public.has_org_role(org_id, array['owner','admin','manager']));
create policy cms_pages_public_read on public.cms_pages for select to anon using (status = 'published');
create policy cms_revisions_member_read on public.cms_revisions for select to authenticated using (public.is_org_member(org_id));
create policy cms_revisions_admin_write on public.cms_revisions for all to authenticated using (public.has_org_role(org_id, array['owner','admin','manager'])) with check (public.has_org_role(org_id, array['owner','admin','manager']));
create policy menus_member_read on public.menus for select to authenticated using (public.is_org_member(org_id));
create policy menus_admin_write on public.menus for all to authenticated using (public.has_org_role(org_id, array['owner','admin','manager'])) with check (public.has_org_role(org_id, array['owner','admin','manager']));
create policy menus_public_read on public.menus for select to anon using (exists (select 1 from public.orgs o where o.id = menus.org_id and o.is_active));

commit;
