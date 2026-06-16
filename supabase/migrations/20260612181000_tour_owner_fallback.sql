-- Compatibilidad para tours creados antes de que owner_id se consolidara.
-- Permite que owner_id o created_by identifiquen al autor real del tour.

alter table public.tours
  add column if not exists created_by uuid references public.users(id) on delete set null;

insert into public.admin_account (id, user_id, email)
values (true, '4839590e-30eb-4fa3-977c-f01afbb8d01b', 'admin@vibetours.app')
on conflict (id) do update
set user_id = excluded.user_id,
    email = excluded.email,
    updated_at = now();

update public.tours
set owner_id = created_by
where owner_id is null
  and created_by is not null;

drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public"
on public.tours
for select
to anon, authenticated
using (
  is_published = true
  or owner_id = (select auth.uid())
  or created_by = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "Authenticated users create tours" on public.tours;
create policy "Authenticated users create tours"
on public.tours
for insert
to authenticated
with check (
  (
    owner_id = (select auth.uid())
    or created_by = (select auth.uid())
  )
  and is_published = false
  and moderation_status = 'pending'
);

drop policy if exists "Owners manage own tours" on public.tours;
create policy "Owners manage own tours"
on public.tours
for update
to authenticated
using (
  (
    owner_id = (select auth.uid())
    or created_by = (select auth.uid())
  )
  and is_published = false
  and moderation_status in ('pending', 'changes_requested', 'rejected')
)
with check (
  (
    owner_id = (select auth.uid())
    or created_by = (select auth.uid())
  )
  and is_published = false
  and moderation_status in ('pending', 'changes_requested')
);

drop policy if exists "Owners delete own tours" on public.tours;
create policy "Owners delete own tours"
on public.tours
for delete
to authenticated
using (
  owner_id = (select auth.uid())
  or created_by = (select auth.uid())
);

drop policy if exists "Tour stops follow visible tours" on public.tour_stops;
create policy "Tour stops follow visible tours"
on public.tour_stops
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.is_published = true
        or t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
        or (select public.is_admin())
      )
  )
);

drop policy if exists "Owners manage own tour stops" on public.tour_stops;
create policy "Owners manage own tour stops"
on public.tour_stops
for all
to authenticated
using (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
      )
      and t.is_published = false
  )
)
with check (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
      )
      and t.is_published = false
  )
);

drop policy if exists "Tour days follow visible tours" on public.tour_days;
create policy "Tour days follow visible tours"
on public.tour_days
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.is_published = true
        or t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
        or (select public.is_admin())
      )
  )
);

drop policy if exists "Owners manage own tour days" on public.tour_days;
create policy "Owners manage own tour days"
on public.tour_days
for all
to authenticated
using (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
      )
      and t.is_published = false
  )
)
with check (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and (
        t.owner_id = (select auth.uid())
        or t.created_by = (select auth.uid())
      )
      and t.is_published = false
  )
);
