-- ===================================================================
-- VibeTours Database Migration - Tour Quotas
-- Description: Adds weekly tour quota tracking columns to public.users
-- ===================================================================

alter table public.users
  add column if not exists weekly_tours_created integer not null default 0,
  add column if not exists weekly_bonus_tours integer not null default 0,
  add column if not exists weekly_tours_reset_at timestamptz not null default now();

comment on column public.users.weekly_tours_created is 'Number of tours created by user in the current 7-day cycle';
comment on column public.users.weekly_bonus_tours is 'Number of bonus tours earned via rewarded ads in the current 7-day cycle (max 2)';
comment on column public.users.weekly_tours_reset_at is 'Timestamp indicating the start of the current 7-day quota cycle';
