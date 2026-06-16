-- Compatibilidad para bases de datos que quedaron a medio migrar.
-- Asegura que el flujo de creacion de tours, moderacion y admin tenga las
-- columnas y la cuenta base que espera la app actual.

alter table public.tours
  add column if not exists creation_json jsonb not null default '{}'::jsonb,
  add column if not exists available_languages text[] not null default '{}'::text[],
  add column if not exists recommended_audience text[] not null default '{}'::text[],
  add column if not exists best_season text not null default '',
  add column if not exists recommended_schedule text not null default '',
  add column if not exists meeting_point text not null default '',
  add column if not exists includes text[] not null default '{}'::text[],
  add column if not exists excludes text[] not null default '{}'::text[],
  add column if not exists recommendations text[] not null default '{}'::text[],
  add column if not exists what_to_bring text[] not null default '{}'::text[],
  add column if not exists tour_rules text[] not null default '{}'::text[],
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists main_category text not null default '',
  add column if not exists budget jsonb not null default '{}'::jsonb,
  add column if not exists additional_info jsonb not null default '{}'::jsonb,
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested')),
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.tour_stops
  add column if not exists position integer not null default 1,
  add column if not exists curious_facts text[] not null default '{}'::text[],
  add column if not exists location_info jsonb not null default '{}'::jsonb,
  add column if not exists images text[] not null default '{}'::text[];

insert into public.admin_account (id, email)
values (true, 'admin@vibetours.app')
on conflict (id) do update
set email = excluded.email,
    updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account account
    where account.id is true
      and (
        account.user_id = (select auth.uid())
        or lower(account.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
        or coalesce(lower((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') in ('admin', 'super_admin')
      )
  );
$$;

grant select on public.admin_account to authenticated;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Users create own profile" on public.users;
create policy "Users create own profile"
on public.users
for insert
to authenticated
with check ((select auth.uid()) = id);

create or replace function public.admin_pending_tours()
returns setof public.tours
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.tours t
  where t.moderation_status = 'pending'
  order by t.created_at desc
  limit 100;
$$;

create or replace function public.admin_moderate_tour(p_tour_id uuid, p_approved boolean)
returns public.tours
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_tour public.tours;
begin
  update public.tours
  set
    is_published = p_approved,
    moderation_status = case when p_approved then 'approved' else 'rejected' end,
    reviewed_at = now()
  where id = p_tour_id
  returning * into updated_tour;

  if not found then
    raise exception 'Tour not found';
  end if;

  return updated_tour;
end;
$$;

revoke all on function public.admin_pending_tours() from public;
revoke all on function public.admin_moderate_tour(uuid, boolean) from public;
grant execute on function public.admin_pending_tours() to authenticated;
grant execute on function public.admin_moderate_tour(uuid, boolean) to authenticated;
