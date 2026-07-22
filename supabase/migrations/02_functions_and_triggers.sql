-- ===================================================================
-- VibeTours Database Consolidation - Part 2: Functions & Triggers
-- Description: Automated timestamp handlers, user creation triggers,
--              normalization rules, admin RPCs, and execution permissions.
-- ===================================================================

-- 1. Automatic updated_at Timestamp Handler
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply set_updated_at trigger across all relevant tables
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists admin_account_set_updated_at on public.admin_account;
create trigger admin_account_set_updated_at
  before update on public.admin_account
  for each row execute function public.set_updated_at();

drop trigger if exists tourist_profiles_set_updated_at on public.tourist_profiles;
create trigger tourist_profiles_set_updated_at
  before update on public.tourist_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

drop trigger if exists tour_comments_set_updated_at on public.tour_comments;
create trigger tour_comments_set_updated_at
  before update on public.tour_comments
  for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists pqrs_set_updated_at on public.pqrs;
create trigger pqrs_set_updated_at
  before update on public.pqrs
  for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();


-- 2. Difficulty Normalization Trigger
create or replace function public.normalize_tour_difficulty()
returns trigger
language plpgsql
as $$
begin
  new.difficulty := case lower(trim(coalesce(new.difficulty, '')))
    when 'easy' then 'easy'
    when 'facil' then 'easy'
    when 'moderate' then 'moderate'
    when 'media' then 'moderate'
    when 'intense' then 'intense'
    when 'intensa' then 'intense'
    else 'easy'
  end;
  return new;
end;
$$;

drop trigger if exists trg_normalize_tour_difficulty on public.tours;
create trigger trg_normalize_tour_difficulty
  before insert or update of difficulty
  on public.tours
  for each row execute function public.normalize_tour_difficulty();


-- 3. Automatic User Sync Trigger on Signup (auth.users -> public.users)
create or replace function public.handle_new_vibetours_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  insert into public.tourist_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists vibetours_on_auth_user_created on auth.users;
create trigger vibetours_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_vibetours_user();


-- 4. Admin Verification Helper Function
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


-- 5. RPC: Fetch Pending Tours for Admin Review
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


-- 6. RPC: Admin Moderate Tour (Approve/Reject + Send Notification)
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

  -- Create a notification for the owner of the tour
  if updated_tour.owner_id is not null then
    if p_approved then
      insert into public.notifications (user_id, title, body, type)
      values (
        updated_tour.owner_id,
        'Tour aprobado',
        '¡Felicidades! Tu tour "' || updated_tour.title || '" ha sido aprobado y ya está publicado.',
        'success'
      );
    else
      insert into public.notifications (user_id, title, body, type)
      values (
        updated_tour.owner_id,
        'Tour rechazado',
        'Tu tour "' || updated_tour.title || '" no fue aceptado. Puedes volver a enviarlo o eliminarlo.',
        'warning'
      );
    end if;
  end if;

  return updated_tour;
end;
$$;


-- 7. RPC: Self-Account Deletion for Authenticated User
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;


-- ===================================================================
-- Permissions & Grants Setup
-- ===================================================================
grant usage on schema public to anon, authenticated;

grant select on public.tours to anon;
grant select, insert, update, delete on public.tours to authenticated;

grant select on public.tour_stops to anon;
grant select, insert, update, delete on public.tour_stops to authenticated;

grant select on public.tour_days to anon;
grant select, insert, update, delete on public.tour_days to authenticated;

grant select on public.admin_account to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.admin_pending_tours() from public;
grant execute on function public.admin_pending_tours() to authenticated;

revoke all on function public.admin_moderate_tour(uuid, boolean) from public;
grant execute on function public.admin_moderate_tour(uuid, boolean) to authenticated;

revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
