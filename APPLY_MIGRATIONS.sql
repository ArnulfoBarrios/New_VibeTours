-- ===================================================================
-- VibeTours Admin Panel Migrations - Apply in Supabase SQL Editor
-- ===================================================================
-- This script adds the missing columns and functions to make the
-- admin panel work. Copy and paste the entire content into:
-- https://app.supabase.com → Your Project → SQL Editor
-- ===================================================================

-- Step 1: Create the singleton admin_account table
create table if not exists public.admin_account (
  id boolean primary key default true check (id),
  user_id uuid unique references public.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_account_has_identity check (
    user_id is not null or nullif(trim(email), '') is not null
  )
);

alter table public.admin_account enable row level security;

revoke all on public.admin_account from anon;
grant select on public.admin_account to authenticated;

drop trigger if exists admin_account_set_updated_at on public.admin_account;
create trigger admin_account_set_updated_at
before update on public.admin_account
for each row execute function public.set_updated_at();

drop policy if exists "Admin account reads own record" on public.admin_account;
create policy "Admin account reads own record"
on public.admin_account
for select
to authenticated
using (
  user_id = (select auth.uid())
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Step 2: Add missing columns to tours table for moderation workflow
alter table public.tours
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested')),
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
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
  add column if not exists short_summary text not null default '',
  add column if not exists subcategories text[] not null default '{}'::text[],
  add column if not exists featured_experience text not null default '',
  add column if not exists place_history text not null default '',
  add column if not exists cultural_context text not null default '',
  add column if not exists meeting_point_info jsonb not null default '{}'::jsonb;

-- Add missing columns to tour_stops
alter table public.tour_stops
  add column if not exists position integer not null default 1,
  add column if not exists curious_facts text[] not null default '{}'::text[],
  add column if not exists location_info jsonb not null default '{}'::jsonb,
  add column if not exists images text[] not null default '{}'::text[];

-- Step 3: Set existing published tours as approved
update public.tours
set moderation_status = 'approved'
where is_published = true
  and moderation_status <> 'approved';

-- Step 4: Create indexes for performance
create index if not exists idx_tours_moderation_status
  on public.tours (moderation_status, created_at desc);

-- Step 5: Set up admin account with your email
-- ⚠️  IMPORTANT: Replace 'your-admin-email@example.com' with your actual admin email
insert into public.admin_account (email)
values ('your-admin-email@example.com')
on conflict (id) do update
set email = 'your-admin-email@example.com',
    updated_at = now();

-- Step 6: Create the is_admin() function that checks if user is admin
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
      )
  );
$$;

-- Step 7: Create RPC function to fetch pending tours for admin
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

-- Step 8: Create RPC function to moderate tours (approve/reject)
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

-- Step 9: Grant permissions to functions
revoke all on function public.admin_pending_tours() from public;
revoke all on function public.admin_moderate_tour(uuid, boolean) from public;
grant execute on function public.admin_pending_tours() to authenticated;
grant execute on function public.admin_moderate_tour(uuid, boolean) to authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Step 10: Update RLS policies to allow admins full access
drop policy if exists "Admins manage tours" on public.tours;
create policy "Admins manage tours"
on public.tours
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage tour stops" on public.tour_stops;
create policy "Admins manage tour stops"
on public.tour_stops
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage tour days" on public.tour_days;
create policy "Admins manage tour days"
on public.tour_days
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ===================================================================
-- ✅ Migrations Complete!
-- Next:
-- 1. Update 'your-admin-email@example.com' above with your email
-- 2. Restart your app to test the admin panel
-- ===================================================================
