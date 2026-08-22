-- Phase 2 Reveal: preserve server-verified configuration per line without
-- changing the shared checkout, payment, or inventory architecture.
alter table public.order_items
  add column if not exists configuration jsonb not null default '{}'::jsonb;
