-- ===================================================================
-- FIX: Admin Panel RLS Policies
-- Run this in Supabase SQL Editor to fix the admin panel
-- ===================================================================

-- Fix 1: Ensure admin can READ all pending tours
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

-- Fix 2: Ensure admin can READ pqrs table
drop policy if exists "Admins can read all pqrs" on public.pqrs;
create policy "Admins can read all pqrs"
on public.pqrs
for select
to authenticated
using ((select public.is_admin()));

-- Fix 3: Keep user PQRS policy but allow admins to override
drop policy if exists "Users read own pqrs" on public.pqrs;
create policy "Users read own pqrs"
on public.pqrs
for select
to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

-- Fix 4: Allow admin to UPDATE pqrs for responding
drop policy if exists "Admins update pqrs" on public.pqrs;
create policy "Admins update pqrs"
on public.pqrs
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Verify the admin is set up correctly
select 'Admin email:', email from public.admin_account where id is true;
