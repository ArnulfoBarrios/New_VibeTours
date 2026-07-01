-- ===================================================================
-- FIX: Tour Comments RLS Policies & Rating Function
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com → Your Project → SQL Editor
-- ===================================================================

-- 1. Redefinir la política de lectura (select) de la tabla tour_comments
-- Permite ver los comentarios si el tour está publicado O si eres el creador del comentario O el dueño del tour.
drop policy if exists "Comments are public for published tours" on public.tour_comments;
create policy "Comments are public for published tours"
on public.tour_comments
for select
to anon, authenticated
using (
  exists (
    select 1 from public.tours t
    where t.id = tour_id and (t.is_published = true or t.owner_id = (select auth.uid()) or (select public.is_admin()))
  )
  or user_id = (select auth.uid())
);

-- 2. Crear la función stored procedure RPC (security definer) para actualizar el promedio y conteo de ratings
-- Al ejecutarse con privilegios de creador (security definer), puede actualizar tours omitiendo la restricción RLS
create or replace function public.update_tour_rating(p_tour_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating numeric(3,2);
  v_count integer;
begin
  -- Calcular promedio y conteo
  select coalesce(avg(rating), 0), count(*)
  into v_rating, v_count
  from public.tour_comments
  where tour_id = p_tour_id;

  -- Actualizar la tabla tours omitiendo RLS
  update public.tours
  set rating = v_rating,
      review_count = v_count
  where id = p_tour_id;
end;
$$;

-- Otorgar permisos de ejecución para usuarios autenticados y anónimos
grant execute on function public.update_tour_rating(uuid) to authenticated, anon;

-- Mensaje de éxito
select 'RLS y RPC de calificaciones configuradas con exito!' as status;
