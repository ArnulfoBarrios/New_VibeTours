create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  followers_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tourist_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  interests text[] not null default '{}',
  preferred_pace text not null default 'balanced',
  favorite_countries text[] not null default '{}',
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete set null,
  slug text unique,
  title text not null,
  country text not null,
  city text not null,
  type text not null check (type in ('urban','historical','gastronomic','cultural','ecological','romantic','sports','night','family','custom')),
  description text not null,
  cover_url text not null,
  gallery text[] not null default '{}',
  duration_minutes integer not null default 180,
  distance_meters integer not null default 0,
  difficulty text not null default 'easy' check (difficulty in ('easy','moderate','intense')),
  language text not null default 'es',
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  likes_count integer not null default 0,
  views_count integer not null default 0,
  tags text[] not null default '{}',
  is_ai_generated boolean not null default false,
  is_published boolean not null default false,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_days (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_number integer not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (tour_id, day_number)
);

create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_id uuid references public.tour_days(id) on delete set null,
  stop_order integer not null default 0,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  image_url text,
  description text not null,
  activities text[] not null default '{}',
  tips text[] not null default '{}',
  suggested_minutes integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_likes (
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tour_id, user_id)
);

create table if not exists public.tour_comments (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_favorites (
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tour_id, user_id)
);

create table if not exists public.tour_views (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  device_id text,
  viewed_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  country text,
  city text not null,
  category text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  latitude double precision,
  longitude double precision,
  image_url text,
  source text not null default 'overpass',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  tour_id uuid references public.tours(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pqrs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('petition','complaint','claim','suggestion')),
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists idx_tours_public_rating on public.tours (is_published, rating desc);
create index if not exists idx_tours_country_city on public.tours (country, city);
create index if not exists idx_tours_type on public.tours (type);
create index if not exists idx_tour_stops_tour_order on public.tour_stops (tour_id, stop_order);
create index if not exists idx_events_city_starts on public.events (city, starts_at);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists tourist_profiles_set_updated_at on public.tourist_profiles;
create trigger tourist_profiles_set_updated_at before update on public.tourist_profiles
for each row execute function public.set_updated_at();

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at before update on public.tours
for each row execute function public.set_updated_at();

drop trigger if exists tour_comments_set_updated_at on public.tour_comments;
create trigger tour_comments_set_updated_at before update on public.tour_comments
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists pqrs_set_updated_at on public.pqrs;
create trigger pqrs_set_updated_at before update on public.pqrs
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();

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

alter table public.users enable row level security;
alter table public.tourist_profiles enable row level security;
alter table public.tours enable row level security;
alter table public.tour_days enable row level security;
alter table public.tour_stops enable row level security;
alter table public.tour_likes enable row level security;
alter table public.tour_comments enable row level security;
alter table public.tour_favorites enable row level security;
alter table public.tour_views enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.pqrs enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Public profiles are readable" on public.users;
create policy "Public profiles are readable" on public.users
for select to anon, authenticated
using (true);

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile" on public.users
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Tourist profiles own read" on public.tourist_profiles;
create policy "Tourist profiles own read" on public.tourist_profiles
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Tourist profiles own update" on public.tourist_profiles;
create policy "Tourist profiles own update" on public.tourist_profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public" on public.tours
for select to anon, authenticated
using (is_published = true or owner_id = (select auth.uid()));

drop policy if exists "Authenticated users create tours" on public.tours;
create policy "Authenticated users create tours" on public.tours
for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners manage own tours" on public.tours;
create policy "Owners manage own tours" on public.tours
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners delete own tours" on public.tours;
create policy "Owners delete own tours" on public.tours
for delete to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Tour stops follow visible tours" on public.tour_stops;
create policy "Tour stops follow visible tours" on public.tour_stops
for select to anon, authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()))
));

drop policy if exists "Owners manage stops" on public.tour_stops;
create policy "Owners manage stops" on public.tour_stops
for all to authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.tours t
  where t.id = tour_id and t.owner_id = (select auth.uid())
));

drop policy if exists "Tour days follow visible tours" on public.tour_days;
create policy "Tour days follow visible tours" on public.tour_days
for select to anon, authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()))
));

drop policy if exists "Owners manage tour days" on public.tour_days;
create policy "Owners manage tour days" on public.tour_days
for all to authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.tours t
  where t.id = tour_id and t.owner_id = (select auth.uid())
));

drop policy if exists "Users manage own likes" on public.tour_likes;
create policy "Users manage own likes" on public.tour_likes
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own favorites" on public.tour_favorites;
create policy "Users manage own favorites" on public.tour_favorites
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Comments are public for published tours" on public.tour_comments;
create policy "Comments are public for published tours" on public.tour_comments
for select to anon, authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and t.is_published = true
));

drop policy if exists "Users create own comments" on public.tour_comments;
create policy "Users create own comments" on public.tour_comments
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own comments" on public.tour_comments;
create policy "Users update own comments" on public.tour_comments
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Anyone can create tour views" on public.tour_views;
create policy "Anyone can create tour views" on public.tour_views
for insert to anon, authenticated
with check (true);

drop policy if exists "Events are public" on public.events;
create policy "Events are public" on public.events
for select to anon, authenticated
using (true);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own settings" on public.settings;
create policy "Users manage own settings" on public.settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports" on public.reports
for insert to authenticated
with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users create pqrs" on public.pqrs;
create policy "Users create pqrs" on public.pqrs
for insert to authenticated
with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "Users read own pqrs" on public.pqrs;
create policy "Users read own pqrs" on public.pqrs
for select to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tour-covers', 'tour-covers', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('tour-galleries', 'tour-galleries', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public tour media read" on storage.objects;
create policy "Public tour media read" on storage.objects
for select to anon, authenticated
using (bucket_id in ('tour-covers','tour-galleries','avatars'));

drop policy if exists "Authenticated upload tour media" on storage.objects;
create policy "Authenticated upload tour media" on storage.objects
for insert to authenticated
with check (bucket_id in ('tour-covers','tour-galleries','avatars'));

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
