alter table if exists public.tours
  add column if not exists short_summary text not null default '',
  add column if not exists subcategories text[] not null default '{}'::text[],
  add column if not exists featured_experience text not null default '',
  add column if not exists place_history text not null default '',
  add column if not exists cultural_context text not null default '',
  add column if not exists meeting_point_info jsonb not null default '{}'::jsonb,
  add column if not exists what_to_bring text[] not null default '{}'::text[],
  add column if not exists tour_rules text[] not null default '{}'::text[],
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists main_category text not null default '',
  add column if not exists budget jsonb not null default '{}'::jsonb;

create index if not exists tours_budget_gin_idx
  on public.tours using gin (budget);

create index if not exists tours_keywords_gin_idx
  on public.tours using gin (keywords);
