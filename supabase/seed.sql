-- DIR (ድር) THE FOUNDATION starter data.
-- Apply after migrations 0001 through 0006. Values are stored in Ethiopian
-- birr cents (paisa): 249900 = ETB 2,499.00.
-- Safe to run again: all seed rows use fixed IDs and upserts.

begin;

insert into public.orgs (id, name, slug, vertical, plan, enabled_modules, currency, country, timezone, phone, email, address, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'DIR (ድር) THE FOUNDATION', 'dir-the-foundation', 'ecommerce', 'pro',
  array['catalog','orders','cms','storefront']::text[],
  'ETB', 'ET', 'Africa/Addis_Ababa', '0911000000', 'hello@dirfoundation.et', 'Addis Ababa, Ethiopia', true
)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, vertical = excluded.vertical, plan = excluded.plan,
  enabled_modules = excluded.enabled_modules, currency = excluded.currency, country = excluded.country,
  timezone = excluded.timezone, phone = excluded.phone, email = excluded.email, address = excluded.address,
  is_active = excluded.is_active, updated_at = now();

insert into public.doc_sequences (org_id, doc_type, prefix, next_no, padding)
values ('00000000-0000-0000-0000-000000000001', 'order', 'ORD-', 1, 4)
on conflict (org_id, doc_type) do update set prefix = excluded.prefix, padding = excluded.padding;

insert into public.org_settings (org_id, key, value)
values
  ('00000000-0000-0000-0000-000000000001', 'storefront.announcement', '"Complimentary delivery in Addis Ababa on qualifying orders"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'storefront.whatsapp_number', '"251911000000"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'storefront.primary_color', '"#171717"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'delivery.default_zone_fallback', '35000'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'checkout.min_order', '0'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'payments.instructions',
   '[{"name":"Telebirr","type":"mobile_wallet","phone":"09XXXXXXXX","account_name":"DIR (ድር) THE FOUNDATION"},{"name":"CBE Bank","type":"bank","account_number":"XXXXXXXXXXXX","account_name":"DIR (ድር) THE FOUNDATION"}]'::jsonb)
on conflict (org_id, key) do update set value = excluded.value, updated_at = now();

insert into public.categories (id, org_id, name, slug, sort_order)
values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Women''s Clothing', 'women', 1),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Men''s Clothing', 'men', 2),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Kids'' Clothing', 'kids', 3)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, sort_order = excluded.sort_order;

-- Product stock_qty is the aggregate of the size-level quantities below.
insert into public.products (id, org_id, name, slug, description, category_id, status, price, compare_at_price, tags, track_stock, stock_qty, position, sale_ends_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Satin Wrap Dress', 'satin-wrap-dress', 'A fluid satin wrap dress with a softly defined waist and easy drape.', 'c0000000-0000-0000-0000-000000000001', 'active', 349900, 429900, array['SALE'], true, 25, 1, now() + interval '7 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Structured Knit Cardigan', 'structured-knit-cardigan', 'A refined knit layer with a clean shape for everyday styling.', 'c0000000-0000-0000-0000-000000000001', 'active', 289900, null, array['NEW'], true, 24, 2, null),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Pleated Midi Skirt', 'pleated-midi-skirt', 'A versatile pleated midi skirt with movement and an easy high waist.', 'c0000000-0000-0000-0000-000000000001', 'active', 239900, null, array['BEST SELLER'], true, 29, 3, null),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Oxford Cotton Shirt', 'oxford-cotton-shirt', 'A crisp cotton shirt cut for a relaxed, considered fit.', 'c0000000-0000-0000-0000-000000000002', 'active', 219900, null, array['NEW'], true, 32, 4, null),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Tailored Linen Trousers', 'tailored-linen-trousers', 'Breathable linen trousers with a clean straight-leg silhouette.', 'c0000000-0000-0000-0000-000000000002', 'active', 279900, null, array['ESSENTIAL'], true, 26, 5, null),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Heavyweight Jersey Tee', 'heavyweight-jersey-tee', 'A premium cotton jersey tee with a substantial feel and everyday shape.', 'c0000000-0000-0000-0000-000000000002', 'active', 149900, null, array['EVERYDAY'], true, 38, 6, null),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Kids Cloud Fleece Set', 'kids-cloud-fleece-set', 'A soft matching fleece set made for play, rest, and cool mornings.', 'c0000000-0000-0000-0000-000000000003', 'active', 189900, null, array['KIDS','NEW'], true, 23, 7, null),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Kids Everyday Cotton Dress', 'kids-everyday-cotton-dress', 'A comfortable cotton dress with an easy shape for every day.', 'c0000000-0000-0000-0000-000000000003', 'active', 159900, null, array['KIDS'], true, 26, 8, null),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Kids Mini Denim Jacket', 'kids-mini-denim-jacket', 'A light denim jacket designed for simple layering through the season.', 'c0000000-0000-0000-0000-000000000003', 'active', 209900, 239900, array['KIDS','SALE'], true, 22, 9, now() + interval '10 days')
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description, category_id = excluded.category_id,
  status = excluded.status, price = excluded.price, compare_at_price = excluded.compare_at_price, tags = excluded.tags,
  track_stock = excluded.track_stock, stock_qty = excluded.stock_qty, position = excluded.position, sale_ends_at = excluded.sale_ends_at;

insert into public.product_variants (id, org_id, product_id, name, price, stock_qty, options, is_default, position)
values
  ('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','S',349900,5,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','M',349900,9,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','L',349900,8,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','XL',349900,3,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','S',289900,6,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','M',289900,8,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','L',289900,6,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','XL',289900,4,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','S',239900,7,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','M',239900,10,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','L',239900,8,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','XL',239900,4,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','S',219900,8,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','M',219900,10,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','L',219900,9,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','XL',219900,5,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000017','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','S',279900,7,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000018','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','M',279900,8,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','L',279900,7,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','XL',279900,4,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','S',149900,10,'{"size":"S"}',true,1),
  ('11000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','M',149900,12,'{"size":"M"}',false,2),
  ('11000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','L',149900,9,'{"size":"L"}',false,3),
  ('11000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','XL',149900,7,'{"size":"XL"}',false,4),
  ('11000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000007','2-3 Years',189900,5,'{"size":"2-3 Years"}',true,1),
  ('11000000-0000-0000-0000-000000000026','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000007','4-5 Years',189900,7,'{"size":"4-5 Years"}',false,2),
  ('11000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000007','6-7 Years',189900,6,'{"size":"6-7 Years"}',false,3),
  ('11000000-0000-0000-0000-000000000028','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000007','8-9 Years',189900,5,'{"size":"8-9 Years"}',false,4),
  ('11000000-0000-0000-0000-000000000029','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000008','2-3 Years',159900,6,'{"size":"2-3 Years"}',true,1),
  ('11000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000008','4-5 Years',159900,8,'{"size":"4-5 Years"}',false,2),
  ('11000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000008','6-7 Years',159900,7,'{"size":"6-7 Years"}',false,3),
  ('11000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000008','8-9 Years',159900,5,'{"size":"8-9 Years"}',false,4),
  ('11000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000009','2-3 Years',209900,5,'{"size":"2-3 Years"}',true,1),
  ('11000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000009','4-5 Years',209900,7,'{"size":"4-5 Years"}',false,2),
  ('11000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000009','6-7 Years',209900,6,'{"size":"6-7 Years"}',false,3),
  ('11000000-0000-0000-0000-000000000036','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000009','8-9 Years',209900,4,'{"size":"8-9 Years"}',false,4)
on conflict (id) do update set
  product_id = excluded.product_id, name = excluded.name, price = excluded.price, stock_qty = excluded.stock_qty,
  options = excluded.options, is_default = excluded.is_default, position = excluded.position;

-- ETB 150 inside Addis Ababa; ETB 350 for the major-city / nationwide rate.
-- The checkout selector reads these district labels directly from this table.
insert into public.delivery_zones (id, org_id, name, districts, charge, eta_text, is_active, position)
values
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Inside Addis Ababa',
   array['Addis Ketema','Akaky Kaliti','Arada','Bole','Gulele','Kirkos','Kolfe Keranio','Lemi Kura','Lideta','Nifas Silk-Lafto','Yeka'],
   15000, 'Delivery within Addis Ababa: 1-2 business days.', true, 1),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Outside Addis Ababa',
   array['Adama','Addis Ababa Surrounding Area','Adigrat','Arba Minch','Asella','Assosa','Bahir Dar','Bale Robe','Bishoftu','Debre Birhan','Debre Markos','Dessie','Dilla','Dire Dawa','Gambela','Gondar','Harar','Hawassa','Jijiga','Jimma','Kombolcha','Mekelle','Nekemte','Other Ethiopia location','Semera','Shashamane','Wolaita Sodo','Wolkite'],
   35000, 'Delivery outside Addis Ababa: 3-7 business days.', true, 2)
on conflict (id) do update set
  name = excluded.name, districts = excluded.districts, charge = excluded.charge, eta_text = excluded.eta_text,
  is_active = excluded.is_active, position = excluded.position;

insert into public.cms_pages (id, org_id, title, slug, type, status, published_at, blocks)
values
  ('70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Home','home','home','published',now(),
   '[{"_key":"hero-1","_type":"hero","heading":"Considered pieces for every day","subheading":"New arrivals from DIR (ድር) THE FOUNDATION.","image":"","ctaLabel":"Shop the collection","ctaHref":"/products"},{"_key":"new-1","_type":"productGrid","title":"New arrivals","mode":"manual","productIds":[],"limit":8}]'::jsonb),
  ('70000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','About us','about','page','published',now(),'[]'::jsonb),
  ('70000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Contact us','contact','page','published',now(),'[]'::jsonb)
on conflict (id) do update set title = excluded.title, slug = excluded.slug, type = excluded.type, status = excluded.status, published_at = excluded.published_at, blocks = excluded.blocks;

insert into public.menus (id, org_id, handle, items)
values
  ('80000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','header',
   '[{"label":"Women","href":"/category/women"},{"label":"Men","href":"/category/men"},{"label":"Kids","href":"/category/kids"},{"label":"About us","href":"/about"},{"label":"Contact us","href":"/contact"}]'::jsonb),
  ('80000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','footer',
   '[{"label":"About us","href":"/about"},{"label":"Contact us","href":"/contact"},{"label":"Track order","href":"/track"},{"label":"Delivery information","href":"/checkout"}]'::jsonb)
on conflict (id) do update set items = excluded.items;

commit;

-- Create your administrator in Supabase Auth first, then run this separately
-- with that user's UUID (do not place a placeholder UUID in the seed):
-- insert into public.org_members (org_id, user_id, role)
-- values ('00000000-0000-0000-0000-000000000001', '<AUTH_USER_UUID>', 'owner')
-- on conflict (org_id, user_id) do update set role = excluded.role;
