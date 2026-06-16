alter table public.tours
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested')),
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

update public.tours
set moderation_status = 'approved'
where is_published = true
  and moderation_status <> 'approved';

create index if not exists idx_tours_moderation_status
  on public.tours (moderation_status, created_at desc);

grant usage on schema public to anon, authenticated;
grant select on public.tours to anon;
grant select, insert, update, delete on public.tours to authenticated;
grant select on public.tour_stops to anon;
grant select, insert, update, delete on public.tour_stops to authenticated;
grant select on public.tour_days to anon;
grant select, insert, update, delete on public.tour_days to authenticated;
grant select on public.admin_account to authenticated;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public"
on public.tours
for select
to anon, authenticated
using (
  is_published = true
  or owner_id = (select auth.uid())
  or (select public.is_admin())
);

drop policy if exists "Authenticated users create tours" on public.tours;
create policy "Authenticated users create tours"
on public.tours
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and is_published = false
  and moderation_status = 'pending'
);

drop policy if exists "Owners manage own tours" on public.tours;
create policy "Owners manage own tours"
on public.tours
for update
to authenticated
using (
  (select auth.uid()) = owner_id
  and is_published = false
  and moderation_status in ('pending', 'changes_requested', 'rejected')
)
with check (
  (select auth.uid()) = owner_id
  and is_published = false
  and moderation_status in ('pending', 'changes_requested')
);

drop policy if exists "Admins manage tours" on public.tours;
create policy "Admins manage tours"
on public.tours
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

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
      and t.owner_id = (select auth.uid())
      and t.is_published = false
  )
)
with check (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and t.owner_id = (select auth.uid())
      and t.is_published = false
  )
);

drop policy if exists "Admins manage tour stops" on public.tour_stops;
create policy "Admins manage tour stops"
on public.tour_stops
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

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
      and t.owner_id = (select auth.uid())
      and t.is_published = false
  )
)
with check (
  exists (
    select 1
    from public.tours t
    where t.id = tour_id
      and t.owner_id = (select auth.uid())
      and t.is_published = false
  )
);

drop policy if exists "Admins manage tour days" on public.tour_days;
create policy "Admins manage tour days"
on public.tour_days
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
