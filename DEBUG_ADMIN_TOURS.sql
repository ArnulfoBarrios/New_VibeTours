-- Deep diagnostic: Find what's blocking admin from seeing tours

-- 1. List ALL policies on tours table to see conflicts
select policyname, qual, with_check, cmd
from pg_policies
where tablename = 'tours'
order by policyname;

-- 2. Try to see how many tours exist total (ignoring RLS)
select count(*) as total_tours_in_db from public.tours;

-- 3. Try the RPC directly - does it return ANY tours?
select count(*) as tours_from_rpc
from public.admin_pending_tours();

-- 4. Check if there's a conflict with "Published tours are public" policy
select count(*) as published_tours
from public.tours
where is_published = true;

-- 5. Check if tours have tour_stops (sometimes RLS on related tables blocks parent)
select count(*) as tours_with_stops
from public.tours t
where exists (select 1 from public.tour_stops ts where ts.tour_id = t.id);

-- 6. Verify the email matches exactly (case matters)
select lower(auth.jwt() ->> 'email') as current_user_email,
       lower(email) as admin_email,
       auth.uid() as current_uid,
       user_id as admin_uid
from public.admin_account
where id is true;
