-- 0004_storefront_public_org_read.sql — fixes two public-storefront read gaps left by 0001/0002/0003.
--
-- 1) orgs — docs/architecture.md §6 requires: "storefront: anon; org resolved from [org] slug
--    param server-side." But 0001_core.sql only grants orgs SELECT to `authenticated` org
--    members (orgs_select_members) — there is no `anon` policy on orgs at all. That breaks:
--      a) storefront org-by-slug resolution itself (every (store)/s/[org]/** page).
--      b) 0002's categories_public_select and 0003's menus_anon_select_active_org, which both
--         gate on `exists (select 1 from orgs o where o.id = ... and o.is_active = true)` — a
--         subquery that is ITSELF subject to orgs' RLS for the `anon` role, so with zero anon
--         policies on orgs those subqueries silently matched 0 rows regardless of is_active.
--         (products/product_variants/product_images/reviews/courses/listings are unaffected —
--         they gate on their own status column, not an orgs subquery.)
--
-- 2) media — 0002's product_images_public_select correctly grants anon SELECT on product_images
--    rows, but every storefront image lookup embeds the joined media row to get the actual
--    storage path (`select ..., media:media_id(path)`), and that embedded join is ITSELF subject
--    to media's own RLS for the querying role. 0001_core.sql only grants media SELECT to
--    `authenticated` (media_select_members) — so for `anon`, every embedded `media:media_id(path)`
--    join silently resolves to null, meaning no product image would ever render on the storefront.
--    This exposes nothing new: the `media` storage bucket is already unconditionally public-read
--    (media_bucket_public_read on storage.objects, 0001_core.sql) — the file content behind every
--    path is already fetchable by anyone who has/guesses the path. Granting anon SELECT on the
--    lightweight row metadata (path/name/dimensions/alt) matches that existing reality.
--
-- Additive only: does not touch any existing policy. Mirrors the existing
-- products_public_select / listings_anon_select_active style (status/flag-gated anon SELECT).

begin;

create policy orgs_anon_select_active on public.orgs
  for select to anon
  using (is_active = true);

create policy media_anon_select on public.media
  for select to anon
  using (true);

commit;
