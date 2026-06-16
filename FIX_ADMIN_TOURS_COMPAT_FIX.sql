-- SOLUTION: Rewrite RLS policies with simpler logic

-- 1. Remove the broken admin policies
drop policy if exists "Admins read all tours" on public.tours;
drop policy if exists "Admins update all tours" on public.tours;

-- 2. Create a simple policy: everyone can see published tours + their own tours
drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public"
on public.tours
for select
to authenticated, anon
using (
  is_published = true
  or owner_id = (select auth.uid())
);

-- 3. Create a separate policy just for the admin user
create policy "Admin user can see all tours"
on public.tours
for select
to authenticated
using (
  (select auth.uid()) = '4839590e-30eb-4fa3-977c-f01afbb8d01b'::uuid
);

-- 4. Create a policy for admin to update (moderate) tours
create policy "Admin user can update tours"
on public.tours
for update
to authenticated
using (
  (select auth.uid()) = '4839590e-30eb-4fa3-977c-f01afbb8d01b'::uuid
)
with check (
  (select auth.uid()) = '4839590e-30eb-4fa3-977c-f01afbb8d01b'::uuid
);

-- 5. Test: Can the admin see all tours?
select count(*) as tours_visible_to_admin
from public.tours;

-- 6. Test: Can admin see pending tours specifically?
select count(*) as pending_tours
from public.tours
where moderation_status = 'pending';
