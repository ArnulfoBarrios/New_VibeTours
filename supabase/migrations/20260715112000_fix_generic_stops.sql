-- Migración para corregir nombres de paradas genéricas o vacías
-- Renombra sistemáticamente a "Atracción [N] de: [Título del Tour]"

UPDATE tour_stops ts
SET name = 'Atracción ' || (ts.stop_order + 1) || ' de: ' || t.title
FROM tours t
WHERE ts.tour_id = t.id
  AND (ts.name = 'Parada' OR ts.name IS NULL OR TRIM(ts.name) = '');

-- Opcionalmente, también corrige descripciones genéricas o vacías
UPDATE tour_stops ts
SET description = 'Descubre los detalles y la historia de ' || ts.name || ' durante nuestro recorrido por ' || t.city || '.'
FROM tours t
WHERE ts.tour_id = t.id
  AND (ts.description = 'Parada' OR ts.description = 'Parada turistica' OR ts.description IS NULL OR TRIM(ts.description) = '');
