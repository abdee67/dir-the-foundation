-- Single-store clothing workflow hardening. Additive and safe on existing installs.
-- Run after 0001-0005.

begin;

-- Prevent invalid inventory states at the database boundary, including writes
-- outside the Next.js application.
alter table public.products
  add constraint products_stock_qty_nonnegative check (stock_qty >= 0);
alter table public.product_variants
  add constraint product_variants_stock_qty_nonnegative check (stock_qty >= 0);

-- Checkout filters variants by product, option size, and availability.
create index if not exists product_variants_product_size_stock_idx
  on public.product_variants (product_id, ((options ->> 'size')), stock_qty);

-- Speeds the payment-verification queue and order tracking lookup.
create index if not exists payments_pending_queue_idx
  on public.payments (org_id, created_at desc) where status = 'pending';
create index if not exists orders_tracking_lookup_idx
  on public.orders (order_no, customer_phone);

-- Public product reads must be limited to an active organisation. This retains
-- the public storefront while preventing inactive-store catalogue leakage.
drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products
  for select to anon
  using (
    status = 'active' and exists (
      select 1 from public.orgs o where o.id = products.org_id and o.is_active = true
    )
  );

commit;
