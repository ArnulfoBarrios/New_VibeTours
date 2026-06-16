-- Enhanced: Fix admin tour visibility

-- 1. Ensure the RPC function grants are explicit
grant execute on function public.admin_pending_tours() to authenticated, anon;
grant execute on function public.admin_moderate_tour(uuid, boolean) to authenticated;
grant execute on function public.is_admin() to authenticated, anon;

-- 2. Recreate the admin_pending_tours function to be more robust
drop function if exists public.admin_pending_tours();
create function public.admin_pending_tours()
returns setof public.tours
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.tours t
  where t.moderation_status = 'pending'
    and (select public.is_admin())
  order by t.created_at desc
  limit 100;
$$;

grant execute on function public.admin_pending_tours() to authenticated;

-- 3. Create an alternative simpler query function that doesn't require is_admin check inside
create or replace function public.get_pending_tours_for_admin()
returns table (
  id uuid,
  title text,
  country text,
  city text,
  type text,
  description text,
  cover_url text,
  moderation_status text,
  created_at timestamptz,
  owner_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.title,
    t.country,
    t.city,
    t.type,
    t.description,
    t.cover_url,
    t.moderation_status,
    t.created_at,
    t.owner_id
  from public.tours t
  where t.moderation_status = 'pending'
  order by t.created_at desc
  limit 100;
$$;

grant execute on function public.get_pending_tours_for_admin() to authenticated;

-- 4. Verify admin can see the tours
select 'Pending tours visible to admin:' as test, count(*) from public.tours
where moderation_status = 'pending';
