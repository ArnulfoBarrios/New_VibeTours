-- Migration to create tour_participants table and set up RLS policies
create table if not exists public.tour_participants (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(tour_id, user_id)
);

alter table public.tour_participants enable row level security;

-- RLS Policies for tour_participants
drop policy if exists "Allow select for authenticated users" on public.tour_participants;
create policy "Allow select for authenticated users"
on public.tour_participants for select to authenticated
using (true);

drop policy if exists "Allow insert for own user id" on public.tour_participants;
create policy "Allow insert for own user id"
on public.tour_participants for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Allow delete for own user id" on public.tour_participants;
create policy "Allow delete for own user id"
on public.tour_participants for delete to authenticated
using ((select auth.uid()) = user_id);
