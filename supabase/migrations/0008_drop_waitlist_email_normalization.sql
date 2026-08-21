-- Keep waitlist subscription uniqueness intuitive and case-insensitive.
-- Public clients still have no table policy: the scoped server action is the
-- only public write path, while RLS protects reads and direct mutations.

create unique index if not exists drop_waitlist_drop_lower_email_key
  on public.drop_waitlist (drop_id, lower(email));
