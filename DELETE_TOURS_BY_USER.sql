-- ===================================================================
-- VibeTours - Eliminar tours del usuario de demostración
-- Usuario ID: d6952401-9180-4e60-af92-47943cea18d3
-- ===================================================================
-- Ejecuta este script en:
-- https://app.supabase.com → Tu Proyecto → SQL Editor
-- ===================================================================

-- Paso 1: Verificar cuántos tours se van a eliminar ANTES de borrar
SELECT
  COUNT(*) AS total_a_eliminar,
  ARRAY_AGG(title ORDER BY created_at) AS titulos_a_eliminar
FROM public.tours
WHERE owner_id = 'd6952401-9180-4e60-af92-47943cea18d3';

-- ===================================================================
-- ⚠️  Solo continúa si el listado de títulos de arriba es correcto.
-- ===================================================================

-- Paso 2: Eliminar todos los tours de ese usuario
-- Las paradas, comentarios y participantes vinculados
-- se eliminan automáticamente por ON DELETE CASCADE.

DELETE FROM public.tours
WHERE owner_id = 'd6952401-9180-4e60-af92-47943cea18d3';

-- Paso 3: Verificar que ya no queda ninguno
SELECT COUNT(*) AS tours_restantes_del_usuario
FROM public.tours
WHERE owner_id = 'd6952401-9180-4e60-af92-47943cea18d3';

-- ===================================================================
-- ✅ Si el Paso 3 devuelve 0, los tours fueron eliminados con éxito.
-- ===================================================================
