alter table public.tour_stops
  add column if not exists is_fallback_image boolean not null default false;
