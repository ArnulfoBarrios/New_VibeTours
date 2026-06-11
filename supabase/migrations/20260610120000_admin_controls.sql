alter table public.users
add column if not exists role text not null default 'traveler'
check (role in ('traveler', 'admin', 'super_admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
    or exists (
      select 1
      from public.users
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.tours
add column if not exists moderation_status text not null default 'pending'
check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested')),
add column if not exists reviewed_by uuid references public.users(id) on delete set null,
add column if not exists reviewed_at timestamptz;

alter table public.pqrs
add column if not exists admin_response text,
add column if not exists responded_by uuid references public.users(id) on delete set null,
add column if not exists responded_at timestamptz;

drop policy if exists "Admins manage tours" on public.tours;
create policy "Admins manage tours" on public.tours
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins read pqrs" on public.pqrs;
create policy "Admins read pqrs" on public.pqrs
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins respond pqrs" on public.pqrs;
create policy "Admins respond pqrs" on public.pqrs
for update to authenticated
using (public.is_admin())
with check (public.is_admin());
