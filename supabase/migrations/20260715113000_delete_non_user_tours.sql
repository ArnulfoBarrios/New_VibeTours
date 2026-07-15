-- Migración para eliminar todos los tours que no han sido creados por usuarios
-- Elimina los tours donde owner_id es nulo (tours de semilla del sistema)

DELETE FROM tours WHERE owner_id IS NULL;
