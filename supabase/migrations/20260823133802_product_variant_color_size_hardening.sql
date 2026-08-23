-- Color × size variants are durable inventory records. Removed options are
-- archived rather than deleted so order and inventory history remains intact.
alter table public.product_variants
  add column if not exists is_active boolean not null default true;

-- Legacy data may contain duplicate combinations. Keep the oldest record
-- active and archive the rest before enforcing the new invariant.
with ranked_variants as (
  select
    id,
    row_number() over (
      partition by
        product_id,
        lower(btrim(options ->> 'color')),
        upper(btrim(options ->> 'size'))
      order by created_at asc, id asc
    ) as row_number
  from public.product_variants
  where is_active
    and nullif(btrim(options ->> 'color'), '') is not null
    and nullif(btrim(options ->> 'size'), '') is not null
)
update public.product_variants variants
set is_active = false,
    is_default = false
from ranked_variants ranked
where variants.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists product_variants_active_color_size_key
  on public.product_variants (
    product_id,
    lower(btrim(options ->> 'color')),
    upper(btrim(options ->> 'size'))
  )
  where is_active
    and nullif(btrim(options ->> 'color'), '') is not null
    and nullif(btrim(options ->> 'size'), '') is not null;

create index if not exists product_variants_product_active_position_idx
  on public.product_variants (product_id, position)
  where is_active;

-- Keep replace-set edits atomic. A product must never be left with only some
-- variants archived/inserted if a later write in the same save fails.
create or replace function public.replace_product_variants(
  p_org_id uuid,
  p_product_id uuid,
  p_variants jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  variant jsonb;
  variant_id uuid;
begin
  if jsonb_typeof(p_variants) <> 'array' then
    raise exception 'Variants must be an array';
  end if;

  if not exists (
    select 1
    from public.products
    where id = p_product_id and org_id = p_org_id
  ) then
    raise exception 'Product not found';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_variants) as incoming(options jsonb)
    where nullif(btrim(incoming.options ->> 'color'), '') is not null
      and nullif(btrim(incoming.options ->> 'size'), '') is null
  ) then
    raise exception 'Color variants must include a size';
  end if;

  if exists (
    select 1
    from (
      select
        lower(btrim(options ->> 'color')) as color,
        upper(btrim(options ->> 'size')) as size,
        count(*) as count
      from jsonb_to_recordset(p_variants) as incoming(options jsonb)
      where nullif(btrim(options ->> 'color'), '') is not null
        and nullif(btrim(options ->> 'size'), '') is not null
      group by 1, 2
      having count(*) > 1
    ) as duplicates
  ) then
    raise exception 'Duplicate color and size combination';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_variants) as incoming(id uuid)
    where incoming.id is not null
      and not exists (
        select 1 from public.product_variants variants
        where variants.id = incoming.id
          and variants.product_id = p_product_id
          and variants.org_id = p_org_id
      )
  ) then
    raise exception 'A selected variant does not belong to this product';
  end if;

  update public.product_variants variants
  set is_active = false,
      is_default = false
  where variants.org_id = p_org_id
    and variants.product_id = p_product_id
    and variants.is_active
    and not exists (
      select 1
      from jsonb_to_recordset(p_variants) as incoming(id uuid)
      where incoming.id = variants.id
    );

  for variant in select value from jsonb_array_elements(p_variants)
  loop
    variant_id := nullif(variant ->> 'id', '')::uuid;
    if variant_id is null then
      insert into public.product_variants (
        org_id, product_id, name, price, compare_at_price, stock_qty,
        options, is_active, is_default, position
      ) values (
        p_org_id,
        p_product_id,
        variant ->> 'name',
        (variant ->> 'price')::bigint,
        nullif(variant ->> 'compare_at_price', '')::bigint,
        (variant ->> 'stock_qty')::int,
        coalesce(variant -> 'options', '{}'::jsonb),
        true,
        coalesce((variant ->> 'is_default')::boolean, false),
        coalesce((variant ->> 'position')::int, 0)
      );
    else
      update public.product_variants
      set name = variant ->> 'name',
          price = (variant ->> 'price')::bigint,
          compare_at_price = nullif(variant ->> 'compare_at_price', '')::bigint,
          stock_qty = (variant ->> 'stock_qty')::int,
          options = coalesce(variant -> 'options', '{}'::jsonb),
          is_active = true,
          is_default = coalesce((variant ->> 'is_default')::boolean, false),
          position = coalesce((variant ->> 'position')::int, 0)
      where id = variant_id and org_id = p_org_id and product_id = p_product_id;
    end if;
  end loop;

  update public.products products
  set stock_qty = coalesce((
    select sum(variants.stock_qty)
    from public.product_variants variants
    where variants.product_id = p_product_id
      and variants.org_id = p_org_id
      and variants.is_active
  ), 0)
  where products.id = p_product_id and products.org_id = p_org_id;
end;
$$;

revoke all on function public.replace_product_variants(uuid, uuid, jsonb) from public;
grant execute on function public.replace_product_variants(uuid, uuid, jsonb) to authenticated;
