-- Tabla para usuarios bloqueados
create table if not exists public.blocked_users (
  blocker_id uuid references public.users(id) on delete cascade,
  blocked_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "Users can manage their own blocked list" on public.blocked_users;
create policy "Users can manage their own blocked list" on public.blocked_users
for all to authenticated
using ((select auth.uid()) = blocker_id)
with check ((select auth.uid()) = blocker_id);

-- Ampliación de tabla de reportes
alter table public.reports
  add column if not exists reported_user_id uuid references public.users(id) on delete set null,
  add column if not exists comment_id uuid references public.tour_comments(id) on delete set null,
  add column if not exists report_type text not null default 'tour' check (report_type in ('tour', 'user', 'comment'));
