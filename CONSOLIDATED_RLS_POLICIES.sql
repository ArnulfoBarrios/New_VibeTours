-- ===================================================================
-- CONSOLIDATED RLS POLICIES FOR VIBETOURS
-- Ejecutar este script completo en el editor SQL de Supabase
-- ===================================================================

-- Habilitar RLS en todas las tablas
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

-- ==========================================
-- 1. TABLA: admin_account & FUNCIONES DE ADMIN
-- ==========================================

-- Asegurar que la función is_admin existe y es segura
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account account
    where account.id is true
      and (
        account.user_id = (select auth.uid())
        or lower(account.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
  );
$$;

-- Otorgar permisos de ejecución
grant execute on function public.is_admin() to authenticated, anon;

-- ==========================================
-- 2. TABLA: users (Perfiles públicos)
-- ==========================================
drop policy if exists "Public profiles are readable" on public.users;
create policy "Public profiles are readable" 
on public.users for select to anon, authenticated
using (true);

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile" 
on public.users for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ==========================================
-- 3. TABLA: tourist_profiles (Intereses)
-- ==========================================
drop policy if exists "Tourist profiles own read" on public.tourist_profiles;
create policy "Tourist profiles own read" 
on public.tourist_profiles for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "Tourist profiles own update" on public.tourist_profiles;
create policy "Tourist profiles own update" 
on public.tourist_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ==========================================
-- 4. TABLA: tours
-- ==========================================
drop policy if exists "Published tours are public" on public.tours;
create policy "Published tours are public" 
on public.tours for select to anon, authenticated
using (is_published = true or owner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Authenticated users create tours" on public.tours;
create policy "Authenticated users create tours" 
on public.tours for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners manage own tours" on public.tours;
create policy "Owners manage own tours" 
on public.tours for update to authenticated
using ((select auth.uid()) = owner_id or (select public.is_admin()))
with check ((select auth.uid()) = owner_id or (select public.is_admin()));

drop policy if exists "Owners delete own tours" on public.tours;
create policy "Owners delete own tours" 
on public.tours for delete to authenticated
using ((select auth.uid()) = owner_id or (select public.is_admin()));

-- ==========================================
-- 5. TABLA: tour_stops
-- ==========================================
drop policy if exists "Tour stops follow visible tours" on public.tour_stops;
create policy "Tour stops follow visible tours" 
on public.tour_stops for select to anon, authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()) or (select public.is_admin()))
));

drop policy if exists "Owners manage stops" on public.tour_stops;
create policy "Owners manage stops" 
on public.tour_stops for all to authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.owner_id = (select auth.uid()) or (select public.is_admin()))
))
with check (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.owner_id = (select auth.uid()) or (select public.is_admin()))
));

-- ==========================================
-- 6. TABLA: tour_days
-- ==========================================
drop policy if exists "Tour days follow visible tours" on public.tour_days;
create policy "Tour days follow visible tours" 
on public.tour_days for select to anon, authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()) or (select public.is_admin()))
));

drop policy if exists "Owners manage tour days" on public.tour_days;
create policy "Owners manage tour days" 
on public.tour_days for all to authenticated
using (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.owner_id = (select auth.uid()) or (select public.is_admin()))
))
with check (exists (
  select 1 from public.tours t
  where t.id = tour_id and (t.owner_id = (select auth.uid()) or (select public.is_admin()))
));

-- ==========================================
-- 7. TABLA: tour_comments (Comentarios y valoraciones)
-- ==========================================
drop policy if exists "Comments are public for published tours" on public.tour_comments;
create policy "Comments are public for published tours" 
on public.tour_comments for select to anon, authenticated
using (
  exists (
    select 1 from public.tours t
    where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()) or (select public.is_admin()))
  )
  or user_id = (select auth.uid())
);

drop policy if exists "Users create own comments" on public.tour_comments;
create policy "Users create own comments" 
on public.tour_comments for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own comments" on public.tour_comments;
create policy "Users update own comments" 
on public.tour_comments for update to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()))
with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "Users delete own comments" on public.tour_comments;
create policy "Users delete own comments" 
on public.tour_comments for delete to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ==========================================
-- 8. TABLAS: Likes y Favoritos
-- ==========================================
drop policy if exists "Users manage own likes" on public.tour_likes;
create policy "Users manage own likes" 
on public.tour_likes for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own favorites" on public.tour_favorites;
create policy "Users manage own favorites" 
on public.tour_favorites for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ==========================================
-- 9. TABLA: PQRS (Quejas y reclamos)
-- ==========================================
drop policy if exists "Users read own pqrs" on public.pqrs;
create policy "Users read own pqrs" 
on public.pqrs for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "Users create pqrs" on public.pqrs;
create policy "Users create pqrs" 
on public.pqrs for insert to authenticated
with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "Admins update pqrs" on public.pqrs;
create policy "Admins update pqrs" 
on public.pqrs for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ==========================================
-- 10. TABLA: Settings (Configuración del usuario)
-- ==========================================
drop policy if exists "Users manage own settings" on public.settings;
create policy "Users manage own settings" 
on public.settings for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ==========================================
-- 11. STORAGE: Control de Archivos / Media
-- ==========================================
drop policy if exists "Public tour media read" on storage.objects;
create policy "Public tour media read" 
on storage.objects for select to anon, authenticated
using (bucket_id in ('tour-covers', 'tour-galleries', 'avatars'));

drop policy if exists "Authenticated upload tour media" on storage.objects;
create policy "Authenticated upload tour media" 
on storage.objects for insert to authenticated
with check (bucket_id in ('tour-covers', 'tour-galleries', 'avatars'));

drop policy if exists "Authenticated delete own tour media" on storage.objects;
create policy "Authenticated delete own tour media" 
on storage.objects for delete to authenticated
using (bucket_id in ('tour-covers', 'tour-galleries', 'avatars'));
