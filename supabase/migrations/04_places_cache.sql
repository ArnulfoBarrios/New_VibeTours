-- ===================================================================
-- VibeTours Database Migration - Part 4: Places Cache
-- Description: Persistent cache for validated POIs and stops to minimize
--              third-party geocoding API calls and guarantee exact coordinates.
-- ===================================================================

create table if not exists public.places_cache (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  city text not null default '',
  normalized_city text not null default '',
  address text default '',
  latitude double precision not null,
  longitude double precision not null,
  place_id text default '',
  source text not null default 'manual', -- 'osm', 'mapbox', 'geoapify', 'ai_address', 'manual'
  confidence double precision not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_cache_unique_name_city unique (normalized_name, normalized_city)
);

-- Performance lookup index
create index if not exists idx_places_cache_lookup
  on public.places_cache (normalized_city, normalized_name);

create index if not exists idx_places_cache_coords
  on public.places_cache (latitude, longitude);

-- Enable Row Level Security
alter table public.places_cache enable row level security;

-- Security Policies
drop policy if exists "Places cache is publicly readable" on public.places_cache;
create policy "Places cache is publicly readable"
  on public.places_cache for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can insert into places cache" on public.places_cache;
create policy "Authenticated users can insert into places cache"
  on public.places_cache for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update places cache" on public.places_cache;
create policy "Authenticated users can update places cache"
  on public.places_cache for update
  to authenticated
  using (true)
  with check (true);
