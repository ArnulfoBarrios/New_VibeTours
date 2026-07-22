-- ===================================================================
-- VibeTours Database Consolidation - Part 1: Schema and Tables
-- Description: Consolidated tables, constraints, indexes, storage buckets,
--              and realtime setup for the VibeTours application.
-- ===================================================================

-- Enable necessary extensions
create extension if not exists pgcrypto;

-- 1. Users table (linked to auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  role text not null default 'traveler' check (role in ('traveler', 'admin', 'super_admin')),
  followers_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Singleton Admin Account table
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

comment on table public.admin_account is
  'Singleton table. Insert exactly one row with the VIBETOURS administrator user_id or email using a privileged backend/service role.';

-- 3. Tourist Profiles table
create table if not exists public.tourist_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  interests text[] not null default '{}',
  preferred_pace text not null default 'balanced',
  favorite_countries text[] not null default '{}',
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Main Tours table
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  slug text unique,
  title text not null default 'Tour sin titulo',
  country text not null default 'Global',
  city text not null default 'Global',
  type text not null default 'custom' check (
    type in (
      'urban', 'historical', 'gastronomic', 'cultural', 'ecological',
      'romantic', 'sports', 'night', 'family', 'custom',
      'eco', 'historic', 'adventure', 'nightlife'
    )
  ),
  description text not null default '',
  cover_url text not null default '',
  gallery text[] not null default '{}',
  duration_minutes integer not null default 180,
  distance_meters integer not null default 0,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'moderate', 'intense')),
  language text not null default 'es',
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  likes_count integer not null default 0,
  views_count integer not null default 0,
  tags text[] not null default '{}',
  is_ai_generated boolean not null default false,
  is_published boolean not null default false,
  is_private boolean not null default false,
  creation_json jsonb not null default '{}'::jsonb,
  available_languages text[] not null default '{}'::text[],
  recommended_audience text[] not null default '{}'::text[],
  best_season text not null default '',
  recommended_schedule text not null default '',
  meeting_point text not null default '',
  includes text[] not null default '{}'::text[],
  excludes text[] not null default '{}'::text[],
  recommendations text[] not null default '{}'::text[],
  what_to_bring text[] not null default '{}'::text[],
  tour_rules text[] not null default '{}'::text[],
  keywords text[] not null default '{}'::text[],
  main_category text not null default '',
  budget jsonb not null default '{}'::jsonb,
  additional_info jsonb not null default '{}'::jsonb,
  short_summary text not null default '',
  subcategories text[] not null default '{}'::text[],
  featured_experience text not null default '',
  place_history text not null default '',
  cultural_context text not null default '',
  meeting_point_info jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Tour Days table
create table if not exists public.tour_days (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_number integer not null default 1,
  title text not null default 'Dia 1',
  notes text,
  created_at timestamptz not null default now(),
  unique (tour_id, day_number)
);

-- 6. Tour Stops table
create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_id uuid references public.tour_days(id) on delete set null,
  stop_order integer not null default 0,
  position integer not null default 1,
  name text not null default 'Parada',
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  image_url text,
  description text not null default '',
  activities text[] not null default '{}',
  tips text[] not null default '{}',
  curious_facts text[] not null default '{}'::text[],
  location_info jsonb not null default '{}'::jsonb,
  images text[] not null default '{}'::text[],
  suggested_minutes integer not null default 30,
  is_fallback_image boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. Tour Likes table
create table if not exists public.tour_likes (
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tour_id, user_id)
);

-- 8. Tour Comments table
create table if not exists public.tour_comments (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  body text not null default '',
  photos text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.tour_comments.photos is 'Array of photo URLs or base64 data URLs uploaded by the tourist for this review';

-- 9. Tour Favorites table
create table if not exists public.tour_favorites (
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tour_id, user_id)
);

-- 10. Tour Participants table
create table if not exists public.tour_participants (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (tour_id, user_id)
);

-- 11. Tour Views table
create table if not exists public.tour_views (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  device_id text,
  viewed_at timestamptz not null default now()
);

-- 12. Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Evento',
  country text,
  city text not null default 'Global',
  category text not null default 'cultural',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  latitude double precision,
  longitude double precision,
  image_url text,
  source text not null default 'overpass',
  created_at timestamptz not null default now()
);

-- 13. Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Notificacion',
  body text not null default '',
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 14. Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  tour_id uuid references public.tours(id) on delete cascade,
  reported_user_id uuid references public.users(id) on delete set null,
  comment_id uuid references public.tour_comments(id) on delete set null,
  report_type text not null default 'tour' check (report_type in ('tour', 'user', 'comment')),
  reason text not null default 'other',
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. PQRS table
create table if not exists public.pqrs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null default 'petition' check (kind in ('petition','complaint','claim','suggestion')),
  subject text not null default '',
  body text not null default '',
  status text not null default 'open' check (status in ('open','answered','closed')),
  admin_response text,
  responded_by uuid references public.users(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. Blocked Users table
create table if not exists public.blocked_users (
  blocker_id uuid references public.users(id) on delete cascade,
  blocked_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- 17. User Settings table
create table if not exists public.settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  locale text not null default 'es',
  appearance text not null default 'system',
  refresh_rate text not null default '120hz',
  notifications_enabled boolean not null default true,
  map_style text not null default 'https://demotiles.maplibre.org/style.json',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. Chat Sessions table (AI Assistant State)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  current_state text not null default 'WELCOME',
  collected_data jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===================================================================
-- Indexes for Query Performance
-- ===================================================================
create unique index if not exists tourist_profiles_user_id_unique on public.tourist_profiles (user_id);
create unique index if not exists settings_user_id_unique on public.settings (user_id);

create index if not exists idx_tours_public_rating on public.tours (is_published, rating desc);
create index if not exists idx_tours_country_city on public.tours (country, city);
create index if not exists idx_tours_type on public.tours (type);
create index if not exists idx_tours_moderation_status on public.tours (moderation_status, created_at desc);

create index if not exists tours_creation_json_gin_idx on public.tours using gin (creation_json);
create index if not exists tours_budget_gin_idx on public.tours using gin (budget);
create index if not exists tours_keywords_gin_idx on public.tours using gin (keywords);

create index if not exists idx_tour_stops_tour_order on public.tour_stops (tour_id, stop_order);
create index if not exists tour_stops_location_info_gin_idx on public.tour_stops using gin (location_info);

create index if not exists idx_events_city_starts on public.events (city, starts_at);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read_at);

-- ===================================================================
-- Storage Buckets Configuration
-- ===================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tour-covers', 'tour-covers', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('tour-galleries', 'tour-galleries', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public;

-- ===================================================================
-- Realtime Subscriptions
-- ===================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.tours;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.tour_comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
