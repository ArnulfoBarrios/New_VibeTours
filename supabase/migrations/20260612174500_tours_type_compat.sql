-- Compatibilidad de tipos de tour.
-- Algunas bases existentes guardan tipos legacy (eco, historic, adventure,
-- nightlife) mientras que la app actual usa los nombres modernos.
-- Permitimos ambos para que el formulario pueda guardar sin romperse.

alter table public.tours
  drop constraint if exists tours_type_check;

alter table public.tours
  add constraint tours_type_check
  check (
    type in (
      'urban',
      'historical',
      'gastronomic',
      'cultural',
      'ecological',
      'romantic',
      'sports',
      'night',
      'family',
      'custom',
      'eco',
      'historic',
      'adventure',
      'nightlife'
    )
  );
