# Clothing store seed

`../seed.sql` is the single executable demo seed for this project. It creates one
active clothing store, the Women and Men categories, size-level inventory, basic
payment instructions, and one CMS-managed homepage. Run it only on a fresh local
or demo database after migrations `0001` through `0006`.

After running the seed, assign your Supabase Auth user as the store owner using
the commented statement at the end of `../seed.sql`.
