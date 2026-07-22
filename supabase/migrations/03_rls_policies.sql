-- ===================================================================
-- VibeTours Database Consolidation - Part 3: Row Level Security (RLS)
-- Description: Enables RLS on all tables and defines granular security
--              policies for tourists, creators, and system admins.
-- ===================================================================

-- 1. Enable RLS on all tables
alter table public.users enable row level security;
alter table public.admin_account enable row level security;
alter table public.tourist_profiles enable row level security;
alter table public.tours enable row level security;
alter table public.tour_days enable row level security;
alter table public.tour_stops enable row level security;
alter table public.tour_likes enable row level security;
alter table public.tour_comments enable row level security;
alter table public.tour_favorites enable row level security;
alter table public.tour_participants enable row level security;
alter table public.tour_views enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.pqrs enable row level security;
alter table public.blocked_users enable row level security;
alter table public.settings enable row level security;
alter table public.chat_sessions enable row level security;

-- ===================================================================
-- Table Security Policies
-- ===================================================================

-- Users table
drop policy if exists "Public profiles are readable" on public.users;
create policy "Public profiles are readable"
  on public.users for select
  to anon, authenticated
  using (true);

drop policy if exists "Users create own profile" on public.users;
create policy "Users create own profile"
  on public.users for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


-- Admin Account table
drop policy if exists "Admin account reads own record" on public.admin_account;
create policy "Admin account reads own record"
  on public.admin_account for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );


-- Tourist Profiles table
drop policy if exists "Tourist profiles own read" on public.tourist_profiles;
create policy "Tourist profiles own read"
  on public.tourist_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Tourist profiles own update" on public.tourist_profiles;
create policy "Tourist profiles own update"
  on public.tourist_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Tours table
drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public"
  on public.tours for select
  to anon, authenticated
  using (
    is_published = true
    or owner_id = (select auth.uid())
    or created_by = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "Owners read own tours" on public.tours;
create policy "Owners read own tours"
  on public.tours for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or created_by = (select auth.uid())
  );

drop policy if exists "Authenticated users create tours" on public.tours;
create policy "Authenticated users create tours"
  on public.tours for insert
  to authenticated
  with check (
    (
      owner_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
    and is_published = false
    and moderation_status = 'pending'
  );

drop policy if exists "Owners manage own tours" on public.tours;
create policy "Owners manage own tours"
  on public.tours for update
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
    and is_published = false
    and moderation_status in ('pending', 'changes_requested', 'rejected')
  )
  with check (
    (
      owner_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
    and is_published = false
    and moderation_status in ('pending', 'changes_requested')
  );

drop policy if exists "Owners delete own tours" on public.tours;
create policy "Owners delete own tours"
  on public.tours for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    or created_by = (select auth.uid())
  );

drop policy if exists "Admins manage tours" on public.tours;
create policy "Admins manage tours"
  on public.tours for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- Tour Stops table
drop policy if exists "Tour stops follow visible tours" on public.tour_stops;
create policy "Tour stops follow visible tours"
  on public.tour_stops for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.is_published = true
          or t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

drop policy if exists "Owners manage own tour stops" on public.tour_stops;
create policy "Owners manage own tour stops"
  on public.tour_stops for all
  to authenticated
  using (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
        )
        and t.is_published = false
    )
  )
  with check (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
        )
        and t.is_published = false
    )
  );

drop policy if exists "Admins manage tour stops" on public.tour_stops;
create policy "Admins manage tour stops"
  on public.tour_stops for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- Tour Days table
drop policy if exists "Tour days follow visible tours" on public.tour_days;
create policy "Tour days follow visible tours"
  on public.tour_days for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.is_published = true
          or t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

drop policy if exists "Owners manage own tour days" on public.tour_days;
create policy "Owners manage own tour days"
  on public.tour_days for all
  to authenticated
  using (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
        )
        and t.is_published = false
    )
  )
  with check (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id
        and (
          t.owner_id = (select auth.uid())
          or t.created_by = (select auth.uid())
        )
        and t.is_published = false
    )
  );

drop policy if exists "Admins manage tour days" on public.tour_days;
create policy "Admins manage tour days"
  on public.tour_days for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- Tour Likes table
drop policy if exists "Users manage own likes" on public.tour_likes;
create policy "Users manage own likes"
  on public.tour_likes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Tour Comments table
drop policy if exists "Comments are public for published tours" on public.tour_comments;
create policy "Comments are public for published tours"
  on public.tour_comments for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.tours t
      where t.id = tour_id and t.is_published = true
    )
  );

drop policy if exists "Users create own comments" on public.tour_comments;
create policy "Users create own comments"
  on public.tour_comments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own comments" on public.tour_comments;
create policy "Users update own comments"
  on public.tour_comments for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Tour Favorites table
drop policy if exists "Users manage own favorites" on public.tour_favorites;
create policy "Users manage own favorites"
  on public.tour_favorites for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Tour Participants table
drop policy if exists "Allow select for authenticated users" on public.tour_participants;
create policy "Allow select for authenticated users"
  on public.tour_participants for select
  to authenticated
  using (true);

drop policy if exists "Allow insert for own user id" on public.tour_participants;
create policy "Allow insert for own user id"
  on public.tour_participants for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Allow delete for own user id" on public.tour_participants;
create policy "Allow delete for own user id"
  on public.tour_participants for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- Tour Views table
drop policy if exists "Anyone can create tour views" on public.tour_views;
create policy "Anyone can create tour views"
  on public.tour_views for insert
  to anon, authenticated
  with check (true);


-- Events table
drop policy if exists "Events are public" on public.events;
create policy "Events are public"
  on public.events for select
  to anon, authenticated
  using (true);


-- Notifications table
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);


-- Reports table
drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports"
  on public.reports for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);


-- PQRS table
drop policy if exists "Users create pqrs" on public.pqrs;
create policy "Users create pqrs"
  on public.pqrs for insert
  to authenticated
  with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "Users read own pqrs" on public.pqrs;
create policy "Users read own pqrs"
  on public.pqrs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins read pqrs" on public.pqrs;
create policy "Admins read pqrs"
  on public.pqrs for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins respond pqrs" on public.pqrs;
create policy "Admins respond pqrs"
  on public.pqrs for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- Blocked Users table
drop policy if exists "Users can manage their own blocked list" on public.blocked_users;
create policy "Users can manage their own blocked list"
  on public.blocked_users for all
  to authenticated
  using ((select auth.uid()) = blocker_id)
  with check ((select auth.uid()) = blocker_id);


-- Settings table
drop policy if exists "Users manage own settings" on public.settings;
create policy "Users manage own settings"
  on public.settings for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- Chat Sessions table
drop policy if exists "Service role can manage all chat_sessions" on public.chat_sessions;
create policy "Service role can manage all chat_sessions"
  on public.chat_sessions for all
  using (true)
  with check (true);


-- Storage Objects Security
drop policy if exists "Public tour media read" on storage.objects;
create policy "Public tour media read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('tour-covers', 'tour-galleries', 'avatars'));

drop policy if exists "Authenticated upload tour media" on storage.objects;
create policy "Authenticated upload tour media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('tour-covers', 'tour-galleries', 'avatars'));
