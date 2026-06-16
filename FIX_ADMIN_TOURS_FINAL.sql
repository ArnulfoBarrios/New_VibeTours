-- FIX: Direct admin check without relying on is_admin() in RLS context

-- 1. Drop the problematic policy
drop policy if exists "Admins manage tours" on public.tours;

-- 2. Create a new policy that directly checks admin_account instead of calling is_admin()
create policy "Admins read all tours"
on public.tours
for select
to authenticated
using (
  is_published = true
  or owner_id = (select auth.uid())
  or exists (
    select 1
    from public.admin_account
    where id is true
      and (
        user_id = (select auth.uid())
        or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
  )
);

-- 3. Create a policy for admin to moderate tours
create policy "Admins update all tours"
on public.tours
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_account
    where id is true
      and (
        user_id = (select auth.uid())
        or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
  )
)
with check (
  exists (
    select 1
    from public.admin_account
    where id is true
      and (
        user_id = (select auth.uid())
        or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
  )
);

-- 4. Test: Can admin see all tours now?
select count(*) as all_tours_visible_to_admin
from public.tours;

-- 5. Test: Can admin see pending tours?
select count(*) as pending_tours_visible_to_admin
from public.tours
where moderation_status = 'pending';

-- 6. Verify admin account
select id, email, user_id from public.admin_account where id is true;
