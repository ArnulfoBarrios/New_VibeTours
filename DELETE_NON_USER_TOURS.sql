-- ===================================================================
-- VibeTours - Eliminar Tours de Demostración (Sin Dueño)
-- ===================================================================
-- Ejecuta este script en:
-- https://app.supabase.com → Tu Proyecto → SQL Editor
-- ===================================================================

-- Paso 1: Verificar cuántos tours se van a eliminar ANTES de borrar
-- (Ejecuta esto primero para revisar el impacto)
SELECT
  COUNT(*) AS total_a_eliminar,
  ARRAY_AGG(title ORDER BY created_at) AS titulos_a_eliminar
FROM public.tours
WHERE owner_id IS NULL;

-- ===================================================================
-- ⚠️  IMPORTANTE: Solo continúa si el conteo anterior es correcto.
--     Comenta el SELECT anterior y descomenta el DELETE de abajo.
-- ===================================================================

-- Paso 2: Eliminar los tours sin dueño (tours de demostración)
-- Las paradas (tour_stops), comentarios y participantes
-- vinculados se eliminan automáticamente por ON DELETE CASCADE.

DELETE FROM public.tours
WHERE owner_id IS NULL;

-- Paso 3: Verificar que ya no queda ninguno
SELECT COUNT(*) AS tours_sin_dueno_restantes
FROM public.tours
WHERE owner_id IS NULL;

-- ===================================================================
-- ✅ Listo! Si el resultado de la verificación es 0, se borraron
--    correctamente todos los tours de demostración.
-- ===================================================================
