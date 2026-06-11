alter table if exists public.tours
  add column if not exists creation_json jsonb not null default '{}'::jsonb,
  add column if not exists available_languages text[] not null default '{}'::text[],
  add column if not exists recommended_audience text[] not null default '{}'::text[],
  add column if not exists best_season text not null default '',
  add column if not exists recommended_schedule text not null default '',
  add column if not exists meeting_point text not null default '',
  add column if not exists includes text[] not null default '{}'::text[],
  add column if not exists excludes text[] not null default '{}'::text[],
  add column if not exists recommendations text[] not null default '{}'::text[],
  add column if not exists additional_info jsonb not null default '{}'::jsonb;

alter table if exists public.tour_stops
  add column if not exists curious_facts text[] not null default '{}'::text[],
  add column if not exists location_info jsonb not null default '{}'::jsonb,
  add column if not exists images text[] not null default '{}'::text[];

create index if not exists tours_creation_json_gin_idx
  on public.tours using gin (creation_json);

create index if not exists tour_stops_location_info_gin_idx
  on public.tour_stops using gin (location_info);
