-- Fix Admin Panel: Tours Moderation
-- This allows admins to see and manage pending tours

-- 1. Fix: Grant admin full access to call the RPC
grant execute on function public.admin_pending_tours() to authenticated;
grant execute on function public.admin_moderate_tour(uuid, boolean) to authenticated;

-- 2. Fix: Update RLS policy so admin can see ALL tours (published and pending)
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

-- 3. Test that the RPC returns tours
-- Run this to verify pending tours are visible:
select count(*) as pending_tours_visible_to_admin
from public.tours
where moderation_status = 'pending';
