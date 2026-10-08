-- ===================================================================
-- VibeTours Database Migration - Part 5: Tour Ratings and Reviews Sync
-- Description: RPC and automated triggers to calculate and synchronize
--              tour rating and review_count atomically upon review changes.
-- ===================================================================

-- 1. RPC: Recalculate and update tour rating and review_count
create or replace function public.update_tour_rating(p_tour_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3,2);
  v_count integer;
begin
  if p_tour_id is null then
    return;
  end if;

  select
    coalesce(round(avg(rating)::numeric, 2), 0.0),
    count(*)
  into v_avg, v_count
  from public.tour_comments
  where tour_id = p_tour_id
    and rating is not null
    and rating between 1 and 5;

  update public.tours
  set
    rating = coalesce(v_avg, 0.0),
    review_count = coalesce(v_count, 0)
  where id = p_tour_id;
end;
$$;

comment on function public.update_tour_rating(uuid) is
  'Recalculates average rating and review_count for a tour using SECURITY DEFINER so regular reviewers can update metrics.';

-- 2. Trigger function to keep ratings synced automatically
create or replace function public.trg_sync_tour_rating_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform public.update_tour_rating(new.tour_id);
  end if;

  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.tour_id is distinct from new.tour_id) then
    perform public.update_tour_rating(old.tour_id);
  end if;

  return null;
end;
$$;

-- 3. Attach trigger to tour_comments
drop trigger if exists tour_comments_sync_rating_trigger on public.tour_comments;
create trigger tour_comments_sync_rating_trigger
  after insert or update or delete
  on public.tour_comments
  for each row
  execute function public.trg_sync_tour_rating_on_comment();

-- 4. Grant execution permissions
revoke all on function public.update_tour_rating(uuid) from public;
grant execute on function public.update_tour_rating(uuid) to authenticated, anon;

-- 5. One-time initial synchronization of existing tour ratings
do $$
declare
  r record;
begin
  for r in select distinct tour_id from public.tour_comments loop
    perform public.update_tour_rating(r.tour_id);
  end loop;
end $$;
