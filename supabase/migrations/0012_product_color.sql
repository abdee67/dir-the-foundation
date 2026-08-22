-- A product-level colour is useful for one-colour clothing pieces. Variants
-- retain their options JSON for pieces that genuinely need colour selection.
alter table public.products
  add column if not exists color text;

alter table public.products
  add constraint products_color_length check (color is null or char_length(color) <= 80);
