-- ===================================================================
-- VibeTours - Seed Data: Parte 3: Las 5 Modalidades de Viaje (Tours 31 - 50) (Parte 3 de 3)
-- Creator: Emotiva VibeTours (7b767010-fc97-4299-9ae3-5a4985da1da3)
-- Generated: 2026-09-08T16:21:54.296Z
-- Total Tours in this script: 20
-- ===================================================================

BEGIN;

-- 1. Ensure Creator Account exists in auth.users and public.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '7b767010-fc97-4299-9ae3-5a4985da1da3') THEN
      INSERT INTO auth.users (
        id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '7b767010-fc97-4299-9ae3-5a4985da1da3',
        'authenticated',
        'authenticated',
        'emotiva.vibetours@gmail.com',
        crypt('VibeTours2025!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Emotiva VibeTours"}'::jsonb,
        now(),
        now()
      );
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '7b767010-fc97-4299-9ae3-5a4985da1da3') THEN
    INSERT INTO public.users (
      id, email, full_name, avatar_url, bio, country, role, created_at, updated_at
    ) VALUES (
      '7b767010-fc97-4299-9ae3-5a4985da1da3',
      'emotiva.vibetours@gmail.com',
      'Emotiva VibeTours',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'Creador oficial y curador de experiencias y rutas exclusivas para VibeTours.',
      'Colombia',
      'admin',
      now(),
      now()
    );
  ELSE
    UPDATE public.users
    SET full_name = 'Emotiva VibeTours',
        role = 'admin',
        updated_at = now()
    WHERE id = '7b767010-fc97-4299-9ae3-5a4985da1da3';
  END IF;
END $$;

-- Ensure required image_metadata column exists on tour_stops
ALTER TABLE public.tour_stops ADD COLUMN IF NOT EXISTS image_metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Remove any previous versions of these tours (cascades to days, stops, comments)
DELETE FROM public.tours WHERE slug IN (
  'vibetour-bogota-inmersiva-capitalina-4d',
  'vibetour-roma-eterna-al-detalle-5d',
  'vibetour-nueva-york-manhattan-brooklyn-6d',
  'vibetour-barcelona-gaudi-mediterraneo-5d',
  'vibetour-minca-sierra-nevada-3d',
  'vibetour-pnn-los-nevados-4d',
  'vibetour-rio-claro-cavernas-doradal-3d',
  'vibetour-desierto-tatacoa-villavieja-3d',
  'vibetour-golfo-morrosquillo-san-bernardo-4d',
  'vibetour-san-andres-providencia-cayos-6d',
  'vibetour-cancun-cozumel-isla-mujeres-5d',
  'vibetour-napoles-capri-costa-amalfitana-6d',
  'vibetour-road-trip-barranquilla-santa-marta-4d',
  'vibetour-travesia-medellin-bogota-pueblos-5d',
  'vibetour-pacific-coast-highway-california-7d',
  'vibetour-pueblos-blancos-sevilla-ronda-malaga-5d',
  'vibetour-duo-iberico-espana-portugal-10d',
  'vibetour-triangulo-nordico-escandinavia-11d',
  'vibetour-sureste-asiatico-tailandia-camboya-vietnam-14d',
  'vibetour-gran-travesia-cono-sur-chile-argentina-12d'
);

-- 3. Insert Tours, Tour Days, georeferenced Stops, and Verified Reviews

-- -------------------------------------------------------------
-- Tour: Bogotá Inmersiva y Capitalina: Cerros, Museos y Vanguardia (Bogotá, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-bogota-inmersiva-capitalina-4d',
  'Bogotá Inmersiva y Capitalina: Cerros, Museos y Vanguardia',
  'Colombia',
  'Bogotá',
  'urban',
  'Recorrido urbano de 4 días por la capital colombiana. Del funicular de Monserrate a 3.152 metros y la Candelaria colonial, hasta el arte moderno del MAMBO y la gastronomía de autor en Chapinero.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  45000,
  'easy',
  'es',
  4.93,
  98,
  310,
  ARRAY['Bogotá', 'Capital', 'Urbano', 'Monserrate', 'La Candelaria', 'Gastronomía']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":280000,"estimatedPerPersonMax":620000}'::jsonb,
  ARRAY['Viajeros urbanos', 'Amantes del arte', 'Foodies']::text[],
  'Todo el año',
  'Mañanas de museos y tardes de cafés',
  'Plaza de Bolívar, Bogotá',
  ARRAY['Ruta urbana completa', 'Guía de transporte TransMilenio / taxi', 'Selección de cafés de especialidad']::text[],
  ARRAY['Funicular Monserrate', 'Entradas a museos', 'Alimentación']::text[],
  ARRAY['Llevar abrigo y paraguas; el clima bogotano es cambiante', 'Probar el ajiaco santafereño']::text[],
  ARRAY['Chaqueta abrigada', 'Calzado cómodo', 'Paraguas']::text[],
  ARRAY['Cuidar pertenencias en zonas concurridas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"single_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5c3ccfa4-fec7-87cb-0180-56dc98859080',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  1,
  'Día 1: La Candelaria y Museo Botero',
  'Arquitectura colonial y arte contemporáneo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '70720a1e-f8a5-3e3d-ab38-509ec1d7ab42',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '5c3ccfa4-fec7-87cb-0180-56dc98859080',
  1,
  1,
  'Museo Botero y La Candelaria',
  4.5968,
  -74.0732,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Casona colonial con patio claustrado que alberga más de 120 obras donadas por Fernando Botero junto a lienzos de Picasso, Monet y Dalí.',
  ARRAY['Visitar la colección permanente del Museo Botero (Entrada gratuita)', 'Almorzar ajiaco en La Puerta Falsa ($28.000 COP)']::text[],
  ARRAY['Cierra los martes; entrada 100% gratuita todos los días de apertura']::text[],
  ARRAY['La Puerta Falsa opera desde 1816 y es el restaurante más antiguo de Bogotá']::text[],
  '{"address":"Calle 11 # 4-41, La Candelaria","priceRange":"$ - Entrada libre","dia":1,"day":1}'::jsonb,
  150,
  '{"dia":1,"day":1,"activities":["Visitar la colección permanente del Museo Botero (Entrada gratuita)","Almorzar ajiaco en La Puerta Falsa ($28.000 COP)"],"datos_curiosos":["La Puerta Falsa opera desde 1816 y es el restaurante más antiguo de Bogotá"],"consejos":["Cierra los martes; entrada 100% gratuita todos los días de apertura"],"location_info":{"address":"Calle 11 # 4-41, La Candelaria","priceRange":"$ - Entrada libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '97c6bec9-c74e-053e-a6dc-12d4142fdb69',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  2,
  'Día 2: Cerro de Monserrate y Sabores de Chapinero',
  'Vistas panorámicas y gastronomía.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '34bd3971-fb9a-d672-2e8e-872a53956390',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '97c6bec9-c74e-053e-a6dc-12d4142fdb69',
  2,
  2,
  'Cerro de Monserrate y Chapinero Alto',
  4.6056,
  -74.0555,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Ascenso en teleférico a 3.152 metros sobre el nivel del mar con vista completa de la sabana y tarde en el distrito culinario de Chapinero.',
  ARRAY['Subida en teleférico ($27.000 COP ida y vuelta)', 'Cata de café especial en Chapinero ($12.000 COP)']::text[],
  ARRAY['Subir en la mañana para cielo despejado']::text[],
  ARRAY['El sendero peatonal de Monserrate tiene 1.605 escalones de piedra']::text[],
  '{"address":"Cerro de Monserrate, Bogotá","priceRange":"$ - Funicular","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Subida en teleférico ($27.000 COP ida y vuelta)","Cata de café especial en Chapinero ($12.000 COP)"],"datos_curiosos":["El sendero peatonal de Monserrate tiene 1.605 escalones de piedra"],"consejos":["Subir en la mañana para cielo despejado"],"location_info":{"address":"Cerro de Monserrate, Bogotá","priceRange":"$ - Funicular","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '149345d5-0fc8-7c98-4a62-b5dec1bf027a',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  3,
  'Día 3: Jardín Botánico de Bogotá y Parque Simón Bolívar',
  'Naturaleza y pulmón verde.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a5e49a1f-820d-00ba-e552-9d70d04ad943',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '149345d5-0fc8-7c98-4a62-b5dec1bf027a',
  3,
  3,
  'Jardín Botánico José Celestino Mutis',
  4.6675,
  -74.101,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El jardín botánico más grande de Colombia con el Tropicario, domo de cristal que recrea los 5 ecosistemas del país.',
  ARRAY['Recorrer el Tropicario (Entrada jardín + Tropicario: $14.000 COP)', 'Picnic en el Parque Simón Bolívar (Gratis)']::text[],
  ARRAY['El domo de páramo tiene niebla y vegetación real de frailejones']::text[],
  ARRAY['Alberga más de 5.000 orquídeas nativas colombianas']::text[],
  '{"address":"Avenida Calle 63 # 68-95","priceRange":"$ - Entrada $14.000 COP","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Recorrer el Tropicario (Entrada jardín + Tropicario: $14.000 COP)","Picnic en el Parque Simón Bolívar (Gratis)"],"datos_curiosos":["Alberga más de 5.000 orquídeas nativas colombianas"],"consejos":["El domo de páramo tiene niebla y vegetación real de frailejones"],"location_info":{"address":"Avenida Calle 63 # 68-95","priceRange":"$ - Entrada $14.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '77d2d303-a323-c09d-90d7-fd05927ada43',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  4,
  'Día 4: Mercado de Pulgas de Usaquén y Despedida',
  'Artesanías y ambiente bohemio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4e2d82e3-626f-03d8-66b5-3755c9bc1222',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '77d2d303-a323-c09d-90d7-fd05927ada43',
  4,
  4,
  'Plaza de Usaquén y Mercado de Pulgas',
  4.6935,
  -74.0325,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Antiguo pueblo colonial absorbido por Bogotá con calles empedradas, anticuarios, joyerías y restaurantes de autor.',
  ARRAY['Compras de diseño y artesanías finas ($20.000 - $80.000 COP)', 'Almuerzo campestre en casonas de Usaquén ($35.000 - $65.000 COP)']::text[],
  ARRAY['El mercado de pulgas funciona los domingos y festivos con gran animación']::text[],
  ARRAY['Usaquén fue un municipio independiente hasta que fue integrado a Bogotá en 1954']::text[],
  '{"address":"Carrera 6 con Calle 119, Usaquén","priceRange":"$ - Libre","dia":4,"day":4}'::jsonb,
  150,
  '{"dia":4,"day":4,"activities":["Compras de diseño y artesanías finas ($20.000 - $80.000 COP)","Almuerzo campestre en casonas de Usaquén ($35.000 - $65.000 COP)"],"datos_curiosos":["Usaquén fue un municipio independiente hasta que fue integrado a Bogotá en 1954"],"consejos":["El mercado de pulgas funciona los domingos y festivos con gran animación"],"location_info":{"address":"Carrera 6 con Calle 119, Usaquén","priceRange":"$ - Libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '7ca1b4a9-59f6-74bf-4500-083aec10797a',
  '93d7c9c2-f0f5-ab6b-5ebe-bbef78dfabb2',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Roma Eterna al Detalle: Catacumbas, Foros y Plazas Barrocas (Roma, Italia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-roma-eterna-al-detalle-5d',
  'Roma Eterna al Detalle: Catacumbas, Foros y Plazas Barrocas',
  'Italia',
  'Roma',
  'historical',
  'Circuito monográfico de 5 días concentrado exclusivamente en la Ciudad Eterna. De los subterráneos del Coliseo a las Catacumbas de San Calixto en la Vía Apia y los jardines de Villa Borghese.',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  48000,
  'moderate',
  'es',
  4.97,
  145,
  480,
  ARRAY['Roma', 'Coliseo', 'Catacumbas', 'Italia', 'Histórico', 'Ciudad Única']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":350,"estimatedPerPersonMax":750}'::jsonb,
  ARRAY['Amantes de la arqueología', 'Caminantes urbanos']::text[],
  'Primavera y Otoño',
  'Salidas tempranas a monumentos',
  'Piazza del Colosseo, Roma',
  ARRAY['Ruta urbana detallada', 'Localización de fuentes públicas de agua potable']::text[],
  ARRAY['Boleto Coliseo', 'Catacumbas', 'Transporte']::text[],
  ARRAY['Llevar calzado con amortiguación para caminar sobre adoquines romanos']::text[],
  ARRAY['Ropa cómoda', 'Botella de agua recargable']::text[],
  ARRAY['Hombros cubiertos en basílicas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"single_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4dae0d26-3824-fe40-925c-b5ac4c6d6279',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  1,
  'Día 1: Coliseo y Foro Romano',
  'El poder del Imperio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '911444db-016d-a00f-f879-1d5e0ebfb939',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  '4dae0d26-3824-fe40-925c-b5ac4c6d6279',
  1,
  1,
  'Coliseo y Foro Romano',
  41.8902,
  12.4922,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'El anfiteatro de los gladiadores y el centro político de la antigüedad.',
  ARRAY['Entrada combinada (€18)', 'Fotos en el Arco de Constantino']::text[],
  ARRAY['Reservar online']::text[],
  ARRAY['Tenía toldo retráctil accionado por marineros']::text[],
  '{"address":"Piazza del Colosseo","priceRange":"$$ - €18","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Entrada combinada (€18)","Fotos en el Arco de Constantino"],"datos_curiosos":["Tenía toldo retráctil accionado por marineros"],"consejos":["Reservar online"],"location_info":{"address":"Piazza del Colosseo","priceRange":"$$ - €18","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f565c2cc-f0f0-aae7-5aae-f503c1594cab',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  2,
  'Día 2: Fontana di Trevi y Panteón',
  'Monedas de la suerte y el óculo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '33f672b1-f0ba-647e-de1a-1784edd81d28',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  'f565c2cc-f0f0-aae7-5aae-f503c1594cab',
  2,
  2,
  'Fontana di Trevi y Panteón de Agripa',
  41.9009,
  12.4833,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'La fuente barroca de travertino y la cúpula de hormigón de 2.000 años.',
  ARRAY['Lanzar moneda (Gratis)', 'Entrada al Panteón (€5)', 'Gelato artesanal (€4)']::text[],
  ARRAY['Probar helado en Giolitti']::text[],
  ARRAY['El óculo del Panteón mide 9 metros de diámetro']::text[],
  '{"address":"Piazza della Rotonda","priceRange":"$ - €5","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Lanzar moneda (Gratis)","Entrada al Panteón (€5)","Gelato artesanal (€4)"],"datos_curiosos":["El óculo del Panteón mide 9 metros de diámetro"],"consejos":["Probar helado en Giolitti"],"location_info":{"address":"Piazza della Rotonda","priceRange":"$ - €5","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '69623b28-d2c5-d5b4-7e45-15e1d4eb19f6',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  3,
  'Día 3: Museos Vaticanos y Basílica de San Pedro',
  'Capilla Sixtina y la cúpula.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '45bf1f97-7228-7a31-f6f2-7e204c277973',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  '69623b28-d2c5-d5b4-7e45-15e1d4eb19f6',
  3,
  3,
  'Museos Vaticanos y San Pedro',
  41.9029,
  12.4534,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'Frescos de Miguel Ángel y La Piedad.',
  ARRAY['Capilla Sixtina (€25)', 'Subida a la cúpula (€10)']::text[],
  ARRAY['Hombros y rodillas cubiertos']::text[],
  ARRAY['La Piedad es la única obra que Miguel Ángel firmó']::text[],
  '{"address":"Vaticano","priceRange":"$$ - €25","dia":3,"day":3}'::jsonb,
  270,
  '{"dia":3,"day":3,"activities":["Capilla Sixtina (€25)","Subida a la cúpula (€10)"],"datos_curiosos":["La Piedad es la única obra que Miguel Ángel firmó"],"consejos":["Hombros y rodillas cubiertos"],"location_info":{"address":"Vaticano","priceRange":"$$ - €25","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4b9319ea-1c36-a7e0-19c0-bed5c144b3aa',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  4,
  'Día 4: Vía Apia Antigua y Catacumbas de San Calixto',
  'Túneles subterráneos de los primeros cristianos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ba47c47b-2406-c072-c3c9-536b84c42532',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  '4b9319ea-1c36-a7e0-19c0-bed5c144b3aa',
  4,
  4,
  'Catacumbas de San Calixto y Vía Apia',
  41.855,
  12.508,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'Más de 20 km de galerías subterráneas donde fueron enterrados decenas de mártires y 16 papas.',
  ARRAY['Visita guiada subterránea (€10)', 'Paseo en bicicleta por los adoquines de la Vía Apia (€15)']::text[],
  ARRAY['Llevar chaqueta; en las catacumbas hay 15°C constantes']::text[],
  ARRAY['La Vía Apia fue la primera calzada pavimentada de Roma construida en el 312 a.C.']::text[],
  '{"address":"Via Appia Antica 110","priceRange":"$ - €10","dia":4,"day":4}'::jsonb,
  210,
  '{"dia":4,"day":4,"activities":["Visita guiada subterránea (€10)","Paseo en bicicleta por los adoquines de la Vía Apia (€15)"],"datos_curiosos":["La Vía Apia fue la primera calzada pavimentada de Roma construida en el 312 a.C."],"consejos":["Llevar chaqueta; en las catacumbas hay 15°C constantes"],"location_info":{"address":"Via Appia Antica 110","priceRange":"$ - €10","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e99358ac-41a7-edac-e1b3-dc5e7fb10a6b',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  5,
  'Día 5: Villa Borghese y Plaza del Popolo',
  'Galería de arte y jardines con lago.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '48625103-57a7-35ad-bec5-f2088846316b',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  'e99358ac-41a7-edac-e1b3-dc5e7fb10a6b',
  5,
  5,
  'Galería Borghese y Terraza del Pincio',
  41.9142,
  12.4922,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'Esculturas maestras de Bernini como "Apolo y Dafne" y mirador al atardecer sobre Piazza del Popolo.',
  ARRAY['Esculturas de Bernini (€15)', 'Paseo en barca en el lago (€5)']::text[],
  ARRAY['Reserva anticipada obligatoria en Galería Borghese']::text[],
  ARRAY['Bernini esculpió las hojas de laurel de Dafne tan finas que la luz pasa a través del mármol']::text[],
  '{"address":"Piazzale Scipione Borghese 5","priceRange":"$$ - €15","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Esculturas de Bernini (€15)","Paseo en barca en el lago (€5)"],"datos_curiosos":["Bernini esculpió las hojas de laurel de Dafne tan finas que la luz pasa a través del mármol"],"consejos":["Reserva anticipada obligatoria en Galería Borghese"],"location_info":{"address":"Piazzale Scipione Borghese 5","priceRange":"$$ - €15","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'e0eb5751-3695-a8b0-31f3-3525b295b6cb',
  '1ccfe595-76c2-cc7d-27fc-b8274bed1716',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Nueva York: De los Rascacielos de Manhattan al Alma de Brooklyn (Nueva York, Estados Unidos)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-nueva-york-manhattan-brooklyn-6d',
  'Nueva York: De los Rascacielos de Manhattan al Alma de Brooklyn',
  'Estados Unidos',
  'Nueva York',
  'urban',
  'Inmersión urbana de 6 días en la Gran Manzana. Cruce del Puente de Brooklyn, paseos por Central Park, rascacielos Art Déco, museos de talla mundial y el High Line de Chelsea.',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  65000,
  'moderate',
  'es',
  4.95,
  180,
  590,
  ARRAY['Nueva York', 'Manhattan', 'Brooklyn', 'Central Park', 'Urbano', 'High Line', 'Times Square']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":600,"estimatedPerPersonMax":1400}'::jsonb,
  ARRAY['Viajeros cosmopolitas', 'Amantes de la fotografía urbana']::text[],
  'Abril a Junio y Septiembre a Noviembre',
  'Museos matutinos y rascacielos al atardecer',
  'Times Square / Broadway, Nueva York',
  ARRAY['Ruta completa en metro', 'Guía de miradores gratuitos y parques', 'Ruta de pizzas icónicas de Brooklyn']::text[],
  ARRAY['Boleto a observatorios (Summit / Top of the Rock)', 'MetroCard', 'Entradas a espectáculos de Broadway']::text[],
  ARRAY['Usar el pago OMNY contactless en el metro', 'Cruzar el puente de Brooklyn caminando al atardecer']::text[],
  ARRAY['Calzado cómodo para caminar 15 km al día', 'Tarjeta de crédito contactless']::text[],
  ARRAY['No obstruir el carril bici en puentes']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"single_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'bbb029d0-d8a6-8e9d-2589-67ddef8b606e',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  1,
  'Día 1: Midtown: Times Square, Central Park y Quinta Avenida',
  'El ritmo vibrante del corazón de Manhattan.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '44de880f-2b9a-b034-4c0d-3894b6d00375',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  'bbb029d0-d8a6-8e9d-2589-67ddef8b606e',
  1,
  1,
  'Times Square y Central Park',
  40.758,
  -73.9855,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Las pantallas gigantes de Times Square y el remanso verde de Central Park.',
  ARRAY['Paseo por The Mall y Bethesda Terrace en Central Park (Gratis)', 'Porción de pizza clásica estilo NY de $3 USD']::text[],
  ARRAY['Times Square es más impactante de noche con los neones']::text[],
  ARRAY['Central Park fue el primer parque público ajardinado de Estados Unidos en 1858']::text[],
  '{"address":"Broadway & 7th Ave","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Paseo por The Mall y Bethesda Terrace en Central Park (Gratis)","Porción de pizza clásica estilo NY de $3 USD"],"datos_curiosos":["Central Park fue el primer parque público ajardinado de Estados Unidos en 1858"],"consejos":["Times Square es más impactante de noche con los neones"],"location_info":{"address":"Broadway & 7th Ave","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '217820bc-0322-bd83-1375-6eceff7abe43',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  2,
  'Día 2: High Line elevado y Chelsea Market',
  'Antigua vía de tren convertida en parque colgante.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3cd06169-ce54-5398-ec31-70bf388e90af',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  '217820bc-0322-bd83-1375-6eceff7abe43',
  2,
  2,
  'The High Line y Chelsea Market',
  40.748,
  -74.0048,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Parque elevado construido sobre antiguas vías de mercancías rodeado de rascacielos de diseño y comida gourmet en Chelsea Market.',
  ARRAY['Caminar los 2.3 km del High Line (Gratis)', 'Comer un Lobster Roll de langosta en Chelsea Market ($22 USD)']::text[],
  ARRAY['Terminar en Hudson Yards para ver la escultura The Vessel']::text[],
  ARRAY['En las vías del High Line se preservan tramos originales donde crecieron flores silvestres']::text[],
  '{"address":"Chelsea, Manhattan","priceRange":"$$ - Moderado","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Caminar los 2.3 km del High Line (Gratis)","Comer un Lobster Roll de langosta en Chelsea Market ($22 USD)"],"datos_curiosos":["En las vías del High Line se preservan tramos originales donde crecieron flores silvestres"],"consejos":["Terminar en Hudson Yards para ver la escultura The Vessel"],"location_info":{"address":"Chelsea, Manhattan","priceRange":"$$ - Moderado","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a3bd1ff5-2113-e341-2190-35eda16705b8',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  3,
  'Día 3: El Mirador Summit One Vanderbilt y Grand Central',
  'Espejos infinitos y la estación más cinematográfica.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '43c0b911-656a-c055-c8c1-3b8de445d813',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  'a3bd1ff5-2113-e341-2190-35eda16705b8',
  3,
  3,
  'Summit One Vanderbilt y Grand Central Terminal',
  40.7527,
  -73.9772,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Experiencia inmersiva en salas de espejos con vista al Empire State y Chrysler Building.',
  ARRAY['Entrada al mirador Summit ($43 - $52 USD)', 'Ver el techo celeste astronómico de Grand Central (Gratis)']::text[],
  ARRAY['Llevar gafas de sol para el mirador; el reflejo de la luz en los espejos es deslumbrante']::text[],
  ARRAY['El techo de Grand Central tiene las constelaciones pintadas al revés respecto al cielo real']::text[],
  '{"address":"45 E 42nd St","priceRange":"$$$ - Mirador $43+","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Entrada al mirador Summit ($43 - $52 USD)","Ver el techo celeste astronómico de Grand Central (Gratis)"],"datos_curiosos":["El techo de Grand Central tiene las constelaciones pintadas al revés respecto al cielo real"],"consejos":["Llevar gafas de sol para el mirador; el reflejo de la luz en los espejos es deslumbrante"],"location_info":{"address":"45 E 42nd St","priceRange":"$$$ - Mirador $43+","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1469d21f-1d9b-d5e4-5e20-712b22238624',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  4,
  'Día 4: Puente de Brooklyn y DUMBO',
  'Cruzar el puente histórico de piedra y cables de acero.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0effc326-a541-e5a3-4480-3a65ce143472',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  '1469d21f-1d9b-d5e4-5e20-712b22238624',
  4,
  4,
  'Puente de Brooklyn y barrio DUMBO',
  40.7061,
  -73.9969,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Caminar sobre el puente de 1883 y tomar la clásica foto de Washington Street en DUMBO enmarcando el Empire State bajo el Manhattan Bridge.',
  ARRAY['Cruce a pie del puente hacia Brooklyn (Gratis)', 'Pizza en Grimaldi''s o Juliana''s ($25 - $35 USD)']::text[],
  ARRAY['Cruzar de Brooklyn a Manhattan si se quiere ver el skyline de frente']::text[],
  ARRAY['Para demostrar que el puente era seguro tras su inauguración, el circo P.T. Barnum desfiló con 21 elefantes sobre él']::text[],
  '{"address":"DUMBO, Brooklyn","priceRange":"$ - Acceso libre","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Cruce a pie del puente hacia Brooklyn (Gratis)","Pizza en Grimaldi''s o Juliana''s ($25 - $35 USD)"],"datos_curiosos":["Para demostrar que el puente era seguro tras su inauguración, el circo P.T. Barnum desfiló con 21 elefantes sobre él"],"consejos":["Cruzar de Brooklyn a Manhattan si se quiere ver el skyline de frente"],"location_info":{"address":"DUMBO, Brooklyn","priceRange":"$ - Acceso libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '64ce2c57-b5d4-bb77-cce5-175e4c19b9c3',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  5,
  'Día 5: Museo Metropolitano de Arte (MET) y SoHo',
  'El templo del Templo de Dendur egipcio y tiendas de hierro fundido.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '279e4849-88bb-fc0e-5c10-6dbdbab0b5e0',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  '64ce2c57-b5d4-bb77-cce5-175e4c19b9c3',
  5,
  5,
  'The Metropolitan Museum of Art (MET) y SoHo',
  40.7794,
  -73.9632,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los museos más grandes del mundo con el Templo de Dendur egipcio original y armaduras medievales.',
  ARRAY['Entrada al MET ($30 USD)', 'Caminata por los edificios Cast-Iron de SoHo (Gratis)']::text[],
  ARRAY['Subir a la terraza del tejado del MET en verano para vistas de Central Park']::text[],
  ARRAY['Egipto donó el Templo de Dendur a EE.UU. en agradecimiento por salvar monumentos de Nubia']::text[],
  '{"address":"1000 5th Ave","priceRange":"$$ - Entrada $30","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Entrada al MET ($30 USD)","Caminata por los edificios Cast-Iron de SoHo (Gratis)"],"datos_curiosos":["Egipto donó el Templo de Dendur a EE.UU. en agradecimiento por salvar monumentos de Nubia"],"consejos":["Subir a la terraza del tejado del MET en verano para vistas de Central Park"],"location_info":{"address":"1000 5th Ave","priceRange":"$$ - Entrada $30","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'daad83e7-1bb6-628f-8dcd-73d35813c964',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  6,
  'Día 6: Ferry Gratuito de Staten Island (Estatua de la Libertad) y Despedida',
  'La Estatua de la Libertad desde el agua y Wall Street.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c6dceb9a-94a1-9dfc-7bdd-b2992f59b405',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  'daad83e7-1bb6-628f-8dcd-73d35813c964',
  6,
  6,
  'Ferry de Staten Island y Toro de Wall Street',
  40.704,
  -74.013,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'El ferry público de color naranja cruza la bahía pasando junto a la Estatua de la Libertad con vistas a los rascacielos del World Trade Center.',
  ARRAY['Viaje de ida y vuelta en el ferry gratuito de Staten Island ($0)', 'Foto con el Charging Bull de Wall Street (Gratis)', 'Memorial del 11 de Septiembre (Gratis)']::text[],
  ARRAY['El ferry de Staten Island es 100% gratis las 24 horas del día; no pagar a revendedores en la calle']::text[],
  ARRAY['La Estatua de la Libertad fue un regalo del pueblo francés en 1886 por el centenario de la independencia']::text[],
  '{"address":"Whitehall Terminal, Manhattan","priceRange":"$ - Ferry gratis","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Viaje de ida y vuelta en el ferry gratuito de Staten Island ($0)","Foto con el Charging Bull de Wall Street (Gratis)","Memorial del 11 de Septiembre (Gratis)"],"datos_curiosos":["La Estatua de la Libertad fue un regalo del pueblo francés en 1886 por el centenario de la independencia"],"consejos":["El ferry de Staten Island es 100% gratis las 24 horas del día; no pagar a revendedores en la calle"],"location_info":{"address":"Whitehall Terminal, Manhattan","priceRange":"$ - Ferry gratis","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'b50679f6-fcc3-3e9f-181b-002702e6978f',
  'bca85b4f-4a45-ec5c-183e-6911323737ef',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Barcelona de Gaudí y el Mediterráneo: Modernismo y Playas (Barcelona, España)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-barcelona-gaudi-mediterraneo-5d',
  'Barcelona de Gaudí y el Mediterráneo: Modernismo y Playas',
  'España',
  'Barcelona',
  'cultural',
  'Recorrido de 5 días enfocado en la arquitectura modernista de Gaudí, los callejones del Barrio Gótico y el sabor marinero de la Barceloneta.',
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  42000,
  'easy',
  'es',
  4.96,
  165,
  530,
  ARRAY['Barcelona', 'Gaudí', 'Sagrada Familia', 'Park Güell', 'Mediterráneo', 'España', 'Urbano']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":320,"estimatedPerPersonMax":700}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes de la arquitectura']::text[],
  'Abril a Junio y Septiembre a Octubre',
  'Monumentos de Gaudí por la mañana y playas por la tarde',
  'Plaça de Catalunya, Barcelona',
  ARRAY['Ruta urbana completa', 'Guía de metro T-Casual']::text[],
  ARRAY['Sagrada Familia', 'Park Güell', 'Comidas']::text[],
  ARRAY['Comprar entradas a monumentos de Gaudí con semanas de anticipación']::text[],
  ARRAY['Calzado cómodo', 'Protector solar']::text[],
  ARRAY['Cuidar bolsos y móviles en zonas turísticas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"single_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3c327da5-2d31-99cd-4431-6b2b74fff7e9',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  1,
  'Día 1: Sagrada Familia y Paseo de Gracia',
  'El templo expiatorio y las casas modernistas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c3b22af7-7a64-cf3c-54fc-d3aa1f8795cc',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '3c327da5-2d31-99cd-4431-6b2b74fff7e9',
  1,
  1,
  'Sagrada Familia y Casa Batlló',
  41.4036,
  2.1744,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'El bosque de columnas de Gaudí y la fachada de escamas de dragón de Casa Batlló.',
  ARRAY['Visita a la Sagrada Familia (€26)', 'Fotos en Casa Batlló']::text[],
  ARRAY['Entrada con audioguía incluida en la app']::text[],
  ARRAY['Gaudí está enterrado en la cripta de la basílica']::text[],
  '{"address":"Carrer de Mallorca 401","priceRange":"$$ - €26","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Visita a la Sagrada Familia (€26)","Fotos en Casa Batlló"],"datos_curiosos":["Gaudí está enterrado en la cripta de la basílica"],"consejos":["Entrada con audioguía incluida en la app"],"location_info":{"address":"Carrer de Mallorca 401","priceRange":"$$ - €26","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5cee6c85-6de4-6d7b-521f-04320b5fd4d4',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  2,
  'Día 2: Park Güell y Barrio de Gracia',
  'Mosaicos de trencadís y plazas bohemias.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '87d579ea-29e9-101c-312a-7f428a919fdc',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '5cee6c85-6de4-6d7b-521f-04320b5fd4d4',
  2,
  2,
  'Park Güell y Plaza del Sol en Gracia',
  41.4145,
  2.1527,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'El dragón de mosaicos y el banco ondulado con vista a Barcelona y al mar.',
  ARRAY['Entrada al Park Güell (€10)', 'Tapas y vermut en el barrio de Gracia (€15)']::text[],
  ARRAY['Llegar en metro Lesseps']::text[],
  ARRAY['El banco ondulado fue moldeado sentando a un operario desnudo en yeso fresco para copiar la curva de la columna']::text[],
  '{"address":"Park Güell","priceRange":"$ - €10","dia":2,"day":2}'::jsonb,
  200,
  '{"dia":2,"day":2,"activities":["Entrada al Park Güell (€10)","Tapas y vermut en el barrio de Gracia (€15)"],"datos_curiosos":["El banco ondulado fue moldeado sentando a un operario desnudo en yeso fresco para copiar la curva de la columna"],"consejos":["Llegar en metro Lesseps"],"location_info":{"address":"Park Güell","priceRange":"$ - €10","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '79f0c14d-d708-80a3-13ee-105586e4d9c4',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  3,
  'Día 3: Barrio Gótico y Mercado de la Boquería',
  'Callejones medievales y tapas en Las Ramblas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '763e6084-baf7-d418-1efc-1241f5620499',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '79f0c14d-d708-80a3-13ee-105586e4d9c4',
  3,
  3,
  'Barrio Gótico y Mercado de la Boquería',
  41.3833,
  2.175,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Murallas romanas, la catedral y los puestos de mariscos de La Boquería.',
  ARRAY['Caminata gótica (Gratis)', 'Tapas en La Boquería (€18)']::text[],
  ARRAY['Cuidar bolsillos en Las Ramblas']::text[],
  ARRAY['La Boquería era antiguamente un mercado de carne de cabra al aire libre extramuros']::text[],
  '{"address":"La Rambla 91","priceRange":"$$ - Tapas","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Caminata gótica (Gratis)","Tapas en La Boquería (€18)"],"datos_curiosos":["La Boquería era antiguamente un mercado de carne de cabra al aire libre extramuros"],"consejos":["Cuidar bolsillos en Las Ramblas"],"location_info":{"address":"La Rambla 91","priceRange":"$$ - Tapas","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e4d141dd-170d-a22d-da35-38b8906a838f',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  4,
  'Día 4: Montjuïc: Castillo, Fundación Miró y Fuentes Mágicas',
  'Vistas panorámicas sobre el puerto y arte moderno.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '09eb86c8-7ecd-d91c-b166-e9a9ee7f39e9',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  'e4d141dd-170d-a22d-da35-38b8906a838f',
  4,
  4,
  'Castillo de Montjuïc y Teleférico',
  41.363,
  2.166,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Fortaleza militar del siglo XVII con vistas de 360 grados sobre la ciudad y el mar.',
  ARRAY['Teleférico de Montjuïc (€10)', 'Entrada al castillo (€9)']::text[],
  ARRAY['Subir en el funicular de Montjuïc integrado en el metro']::text[],
  ARRAY['Desde el castillo se midió el meridiano que definió la longitud exacta de un metro en 1792']::text[],
  '{"address":"Carretera de Montjuïc 66","priceRange":"$ - €9","dia":4,"day":4}'::jsonb,
  200,
  '{"dia":4,"day":4,"activities":["Teleférico de Montjuïc (€10)","Entrada al castillo (€9)"],"datos_curiosos":["Desde el castillo se midió el meridiano que definió la longitud exacta de un metro en 1792"],"consejos":["Subir en el funicular de Montjuïc integrado en el metro"],"location_info":{"address":"Carretera de Montjuïc 66","priceRange":"$ - €9","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0dbdde01-d249-ac87-ee31-6d0e17c63d80',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  5,
  'Día 5: Playas de la Barceloneta y Paella Marinera',
  'Descanso frente al mar y despedida.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9c41d667-620e-434a-f791-2a1bb362e07b',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '0dbdde01-d249-ac87-ee31-6d0e17c63d80',
  5,
  5,
  'La Barceloneta y Playa de San Sebastián',
  41.378,
  2.192,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Paseo marítimo bordeado de palmeras y chiringuitos de pescado fresco.',
  ARRAY['Paseo en bicicleta por la costa (€12)', 'Paella marinera con sangría (€25 - €35)']::text[],
  ARRAY['Tomar el Aerobús en Plaza Cataluña al terminar']::text[],
  ARRAY['El barrio fue construido en el siglo XVIII para realojar a los habitantes de la Ribera cuyas casas fueron demolidas para la Ciudadela']::text[],
  '{"address":"Passeig Marítim","priceRange":"$$ - Paella","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Paseo en bicicleta por la costa (€12)","Paella marinera con sangría (€25 - €35)"],"datos_curiosos":["El barrio fue construido en el siglo XVIII para realojar a los habitantes de la Ribera cuyas casas fueron demolidas para la Ciudadela"],"consejos":["Tomar el Aerobús en Plaza Cataluña al terminar"],"location_info":{"address":"Passeig Marítim","priceRange":"$$ - Paella","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '2de913dd-4ee4-c955-c62a-65926d329c13',
  'b0db9f9c-5f65-11af-631f-df7e07d9aacd',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Minca y la Sierra Nevada: Aves, Cafetales y Cascadas (Minca, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-minca-sierra-nevada-3d',
  'Minca y la Sierra Nevada: Aves, Cafetales y Cascadas',
  'Colombia',
  'Minca',
  'ecological',
  'Escapada ecológica de 3 días a la capital del avistamiento de aves en la Sierra Nevada de Santa Marta. Cascadas de Marinka, Pozo Azul y fincas cafeteras tradicionales a 650 metros de altitud.',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80']::text[],
  4320,
  28000,
  'moderate',
  'es',
  4.94,
  82,
  270,
  ARRAY['Minca', 'Sierra Nevada', 'Ecológico', 'Cascadas', 'Café', 'Microdestino']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":220000,"estimatedPerPersonMax":480000}'::jsonb,
  ARRAY['Ecoturistas', 'Avistadores de aves', 'Mochileros']::text[],
  'Diciembre a Abril',
  'Madrugar para avistamiento de aves a las 6:00 AM',
  'Iglesia de Minca, Magdalena',
  ARRAY['Ruta de senderismo', 'Guía de aves endémicas']::text[],
  ARRAY['Moto-taxi local', 'Entradas']::text[],
  ARRAY['Llevar calzado con agarre para barro y traje de baño']::text[],
  ARRAY['Repelente', 'Binoculares', 'Toalla']::text[],
  ARRAY['No dejar basura en senderos']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '77e84d17-2347-bd3c-f6f2-4e8633fa4b78',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  1,
  'Día 1: Pueblo de Minca y Pozo Azul',
  'Pozas naturales de agua cristalina de montaña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '793922cc-c0c6-f3aa-bb52-c9e615e00dc1',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  '77e84d17-2347-bd3c-f6f2-4e8633fa4b78',
  1,
  1,
  'Pozo Azul en Minca',
  11.141,
  -74.112,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Piscinas naturales formadas por el río Minca entre rocas gigantes.',
  ARRAY['Baño en pozas frías (Gratis)', 'Almuerzo campestre ($22.000 COP)']::text[],
  ARRAY['Llegar antes de las 10:00 AM para evitar aglomeraciones']::text[],
  ARRAY['El agua proviene directamente de los picos nevados Colón y Bolívar']::text[],
  '{"address":"Minca, Magdalena","priceRange":"$ - Libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Baño en pozas frías (Gratis)","Almuerzo campestre ($22.000 COP)"],"datos_curiosos":["El agua proviene directamente de los picos nevados Colón y Bolívar"],"consejos":["Llegar antes de las 10:00 AM para evitar aglomeraciones"],"location_info":{"address":"Minca, Magdalena","priceRange":"$ - Libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '100c4771-721b-de97-7a6e-8ef422651540',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  2,
  'Día 2: Finca Cafetera La Victoria y Mirador Los Pinos',
  'Maquinaria hidráulica de 1892 y vista al mar Caribe desde la montaña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c03cd794-9c5c-a4de-02fe-3ed1a9737ed3',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  '100c4771-721b-de97-7a6e-8ef422651540',
  2,
  2,
  'Hacienda La Victoria y Los Pinos',
  11.1442,
  -74.1165,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las fincas cafeteras más antiguas de Colombia impulsada por agua de montaña.',
  ARRAY['Tour del café orgánico ($25.000 COP)', 'Cerveza artesanal de café ($14.000 COP)']::text[],
  ARRAY['Subir en moto-taxi local ($20.000 COP)']::text[],
  ARRAY['Toda la maquinaria funciona sin electricidad de la red']::text[],
  '{"address":"El Campano, Minca","priceRange":"$ - Tour $25.000 COP","dia":2,"day":2}'::jsonb,
  210,
  '{"dia":2,"day":2,"activities":["Tour del café orgánico ($25.000 COP)","Cerveza artesanal de café ($14.000 COP)"],"datos_curiosos":["Toda la maquinaria funciona sin electricidad de la red"],"consejos":["Subir en moto-taxi local ($20.000 COP)"],"location_info":{"address":"El Campano, Minca","priceRange":"$ - Tour $25.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9b35328f-42f6-fbaa-4916-6bf02f1190c9',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  3,
  'Día 3: Cascadas de Marinka y Hamacas Gigantes',
  'Relajación en redes suspendidas sobre el cañón.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '09b776a2-f493-0a55-f1b2-3a487aa3d0f6',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  '9b35328f-42f6-fbaa-4916-6bf02f1190c9',
  3,
  3,
  'Cascadas de Marinka',
  11.135,
  -74.108,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Dos cascadas gemelas con piscinas naturales y redes colgantes panorámicas.',
  ARRAY['Baño en cascada (Entrada: $10.000 COP)', 'Foto en las hamacas gigantes ($5.000 COP)']::text[],
  ARRAY['Llevar calzado de agua para piedras resbalosas']::text[],
  ARRAY['En este valle habitan más de 300 especies de aves registradas']::text[],
  '{"address":"Vereda Marinka, Minca","priceRange":"$ - Entrada $10.000 COP","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Baño en cascada (Entrada: $10.000 COP)","Foto en las hamacas gigantes ($5.000 COP)"],"datos_curiosos":["En este valle habitan más de 300 especies de aves registradas"],"consejos":["Llevar calzado de agua para piedras resbalosas"],"location_info":{"address":"Vereda Marinka, Minca","priceRange":"$ - Entrada $10.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '48e74470-4ce7-01fa-ebd8-88828502d2b8',
  'df07786e-ab88-4cee-16e0-9fc77703502f',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Parque Nacional Natural Los Nevados: Glaciares, Frailejones y Termales (Manizales, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-pnn-los-nevados-4d',
  'Parque Nacional Natural Los Nevados: Glaciares, Frailejones y Termales',
  'Colombia',
  'Manizales',
  'sports',
  'Expedición de alta montaña de 4 días por el macizo volcánico de la Cordillera Central. Ecosistema de páramo con miles de frailejones, el borde del glaciar del Nevado del Ruiz a 4.800 metros y descanso en aguas termales volcánicas.',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  95000,
  'intense',
  'es',
  4.96,
  75,
  310,
  ARRAY['PNN Los Nevados', 'Nevado del Ruiz', 'Alta Montaña', 'Páramo', 'Termales', 'Microdestino']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":450000,"estimatedPerPersonMax":950000}'::jsonb,
  ARRAY['Montañistas', 'Aventureros en buena forma física']::text[],
  'Diciembre a Marzo y Julio a Agosto',
  'Ingresos al parque antes de las 8:00 AM',
  'Plaza de Bolívar de Manizales / Sector Brisas',
  ARRAY['Ruta de alta montaña', 'Puntos de control de Parques Nacionales']::text[],
  ARRAY['Boleto PNN Los Nevados', 'Guía obligatorio de alta montaña', 'Vehículo 4x4']::text[],
  ARRAY['Aclimatarse el primer día a 2.100 msnm; la cumbre supera los 4.800 msnm', 'Llevar abrigo térmico invernal']::text[],
  ARRAY['Chaqueta térmica de pluma', 'Guantes y pasamontañas', 'Protector solar labial y facial']::text[],
  ARRAY['Obligatorio ingresar con guía certificado de montaña y póliza de seguro']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '074d7965-dcbb-66d7-5eed-e763f342cff0',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  1,
  'Día 1: Manizales y Aclimatación en Termales del Ruiz',
  'Ascenso suave y aguas termales a 3.500 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'bb4b3ecc-3d2c-d872-cbd9-620399004df2',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '074d7965-dcbb-66d7-5eed-e763f342cff0',
  1,
  1,
  'Termales del Ruiz y Sendero de Colibríes',
  4.958,
  -75.362,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Piscinas termales minerales en medio del bosque altoandino frecuentadas por colibríes de alta montaña.',
  ARRAY['Baño termal medicinal ($50.000 COP)', 'Avistamiento del colibrí de páramo (Gratis)']::text[],
  ARRAY['No beber alcohol para facilitar la aclimatación']::text[],
  ARRAY['Las aguas brotan a más de 60°C de fallas volcánicas profundas']::text[],
  '{"address":"Vía Manizales - Murillo Km 28","priceRange":"$$ - Termales","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Baño termal medicinal ($50.000 COP)","Avistamiento del colibrí de páramo (Gratis)"],"datos_curiosos":["Las aguas brotan a más de 60°C de fallas volcánicas profundas"],"consejos":["No beber alcohol para facilitar la aclimatación"],"location_info":{"address":"Vía Manizales - Murillo Km 28","priceRange":"$$ - Termales","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '27a470cb-1e4e-3ce2-e2f7-f44b0d4db672',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  2,
  'Día 2: Borde de Glaciar del Nevado del Ruiz (Sector Brisas)',
  'Ascenso hasta los 4.800 metros en el glaciar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cfad21d6-0450-4fb2-e164-7d44a953a65f',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '27a470cb-1e4e-3ce2-e2f7-f44b0d4db672',
  2,
  2,
  'Valle de las Fracciones y Borde de Nieve del Ruiz',
  4.892,
  -75.318,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Páramo lunar de ceniza volcánica y nieves perpetuas.',
  ARRAY['Caminata guiada al borde de nieve (Entrada parque: ~$40.000 COP + guía)', 'Foto en el Valle de los Lunares']::text[],
  ARRAY['Caminar muy despacio y con respiración controlada por la escasez de oxígeno']::text[],
  ARRAY['El Nevado del Ruiz es un estratovolcán activo conocido por los pueblos indígenas como Kumanday']::text[],
  '{"address":"Sector Brisas, PNN Los Nevados","priceRange":"$$ - Entrada y guía","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Caminata guiada al borde de nieve (Entrada parque: ~$40.000 COP + guía)","Foto en el Valle de los Lunares"],"datos_curiosos":["El Nevado del Ruiz es un estratovolcán activo conocido por los pueblos indígenas como Kumanday"],"consejos":["Caminar muy despacio y con respiración controlada por la escasez de oxígeno"],"location_info":{"address":"Sector Brisas, PNN Los Nevados","priceRange":"$$ - Entrada y guía","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0ff2fcff-d444-7a6d-1f88-2926a328268e',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  3,
  'Día 3: Laguna Negra y Desierto de Ceniza',
  'Espejo de agua glaciar rodeado de frailejones centenarios.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '52b3455a-c3da-974f-f917-edadbc74ff47',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '0ff2fcff-d444-7a6d-1f88-2926a328268e',
  3,
  3,
  'Laguna Negra y Páramo de Frailejones',
  4.938,
  -75.335,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Laguna de origen glaciar a 3.700 metros donde se refleja el nevado.',
  ARRAY['Fotografía de frailejones gigantes (Gratis)', 'Agua de panela con queso caliente en parador andino ($8.000 COP)']::text[],
  ARRAY['Los frailejones crecen apenas 1 centímetro al año; no pisarlos ni tocarlos']::text[],
  ARRAY['Los frailejones retienen hasta 40 veces su peso en agua actuando como esponjas que originan los ríos de Colombia']::text[],
  '{"address":"Carretera al Ruiz","priceRange":"$ - Libre","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Fotografía de frailejones gigantes (Gratis)","Agua de panela con queso caliente en parador andino ($8.000 COP)"],"datos_curiosos":["Los frailejones retienen hasta 40 veces su peso en agua actuando como esponjas que originan los ríos de Colombia"],"consejos":["Los frailejones crecen apenas 1 centímetro al año; no pisarlos ni tocarlos"],"location_info":{"address":"Carretera al Ruiz","priceRange":"$ - Libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4333e8fb-7b97-f100-ad58-021fe6e7ce58',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  4,
  'Día 4: Termales Santa Rosa de Cabal y Retorno',
  'Descanso muscular bajo la cascada de 95 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd9f09e9f-39b3-fba3-8a5f-03841b7b40c3',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '4333e8fb-7b97-f100-ad58-021fe6e7ce58',
  4,
  4,
  'Termales Balneario Santa Rosa de Cabal',
  4.862,
  -75.548,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Cascada de agua fría y piscinas termales humeantes en medio del cañón verde.',
  ARRAY['Baño hidrotermal de recuperación muscular ($55.000 COP)', 'Chorizo santarrosano tradicional ($18.000 COP)']::text[],
  ARRAY['Llevar traje de baño y sandalias']::text[],
  ARRAY['La combinación de choque térmico entre la cascada fría y la piscina caliente reactiva la circulación']::text[],
  '{"address":"Santa Rosa de Cabal, Risaralda","priceRange":"$$ - Entrada termales","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Baño hidrotermal de recuperación muscular ($55.000 COP)","Chorizo santarrosano tradicional ($18.000 COP)"],"datos_curiosos":["La combinación de choque térmico entre la cascada fría y la piscina caliente reactiva la circulación"],"consejos":["Llevar traje de baño y sandalias"],"location_info":{"address":"Santa Rosa de Cabal, Risaralda","priceRange":"$$ - Entrada termales","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '8e67c6bd-1655-ded3-f941-3c55bf5dec5c',
  '13f30a75-a05e-2704-6dd6-832d19c62c67',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Cañón del Río Claro: Mármol, Rafting y Cavernas Naturales (Doradal, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-rio-claro-cavernas-doradal-3d',
  'Cañón del Río Claro: Mármol, Rafting y Cavernas Naturales',
  'Colombia',
  'Doradal',
  'sports',
  'Aventura kárstica de 3 días en la Reserva Natural Cañón del Río Claro. Lecho fluvial tallado en roca de mármol pulido blanco, aguas cristalinas para rafting, espeleología en la Caverna de los Guácharos y aldea estilo mediterráneo de Doradal.',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  4320,
  32000,
  'moderate',
  'es',
  4.92,
  65,
  240,
  ARRAY['Río Claro', 'Doradal', 'Cañón', 'Rafting', 'Mármol', 'Espeleología', 'Microdestino']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":260000,"estimatedPerPersonMax":550000}'::jsonb,
  ARRAY['Aventureros', 'Jóvenes y grupos']::text[],
  'Diciembre a Abril y Julio a Agosto',
  'Actividades acuáticas matutinas',
  'Entrada Reserva Cañón del Río Claro, Autopista Medellín - Bogotá',
  ARRAY['Ruta de senderos kársticos', 'Puntos de baño en mármol']::text[],
  ARRAY['Tarifa de entrada a la reserva', 'Espeleología en caverna', 'Rafting']::text[],
  ARRAY['Llevar calzado deportivo acuático para las piedras de mármol']::text[],
  ARRAY['Aquashoes', 'Linterna frontal', 'Bolsa impermeable']::text[],
  ARRAY['Prohibido extraer estalactitas o piezas de mármol']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b5cdfd02-22ab-56ec-1323-d6f64f06a1ad',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  1,
  'Día 1: Playa de Mármol y Sendero Kárstico',
  'Caminata sobre el lecho de mármol blanco bajo el dosel selvático.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '26c08ef4-1c5f-f20b-701d-50b5d11b2d73',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  'b5cdfd02-22ab-56ec-1323-d6f64f06a1ad',
  1,
  1,
  'Playa Mármol y Sendero Geológico',
  5.898,
  -74.858,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Cañón de paredes verticales de mármol de 100 metros de altura con lecho de río tallado en roca caliza blanca cristalina.',
  ARRAY['Entrada a la reserva ($25.000 COP)', 'Baño en el río sobre losas de mármol sumergidas (Gratis)']::text[],
  ARRAY['El agua es fresca y extremadamente transparente']::text[],
  ARRAY['Las paredes de mármol se formaron hace millones de años por sedimentación de antiguos arrecifes marinos fósiles']::text[],
  '{"address":"Autopista Medellín - Bogotá Km 152","priceRange":"$ - Entrada reserva","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Entrada a la reserva ($25.000 COP)","Baño en el río sobre losas de mármol sumergidas (Gratis)"],"datos_curiosos":["Las paredes de mármol se formaron hace millones de años por sedimentación de antiguos arrecifes marinos fósiles"],"consejos":["El agua es fresca y extremadamente transparente"],"location_info":{"address":"Autopista Medellín - Bogotá Km 152","priceRange":"$ - Entrada reserva","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1fd5c024-78d7-eabc-80d5-6c8b9a8c39d8',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  2,
  'Día 2: Espeleología en la Caverna de los Guácharos y Rafting',
  'Aventura dentro de la cueva subterránea de aves nocturnas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6d89bb10-61b2-c2fb-e4e5-d234c4081bec',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  '1fd5c024-78d7-eabc-80d5-6c8b9a8c39d8',
  2,
  2,
  'Caverna de los Guácharos y Descenso en Balsa',
  5.894,
  -74.855,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Cueva kárstica natural atravesada por un río subterráneo habitada por miles de guácharos, aves nocturnas que se orientan por ecolocalización.',
  ARRAY['Espeleología con casco y linterna dentro de la caverna ($35.000 COP)', 'Rafting en río transparente entre cañones de mármol ($40.000 COP)']::text[],
  ARRAY['La caverna requiere cruzar tramos donde el agua llega al pecho; llevar ropa que se pueda mojar']::text[],
  ARRAY['Los guácharos emiten chasquidos sonoros audibles por el ser humano para mapear la cueva en la oscuridad absoluta']::text[],
  '{"address":"Reserva Natural Río Claro","priceRange":"$$ - Actividades de aventura","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Espeleología con casco y linterna dentro de la caverna ($35.000 COP)","Rafting en río transparente entre cañones de mármol ($40.000 COP)"],"datos_curiosos":["Los guácharos emiten chasquidos sonoros audibles por el ser humano para mapear la cueva en la oscuridad absoluta"],"consejos":["La caverna requiere cruzar tramos donde el agua llega al pecho; llevar ropa que se pueda mojar"],"location_info":{"address":"Reserva Natural Río Claro","priceRange":"$$ - Actividades de aventura","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd94df155-cdf4-6fde-763d-45446c0da626',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  3,
  'Día 3: Aldea Doradal: El Santoríni Colombiano y Despedida',
  'Casas blancas y cúpulas azules sobre colinas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd855ffb1-94ff-b40f-9568-1c88c7d8fdbb',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  'd94df155-cdf4-6fde-763d-45446c0da626',
  3,
  3,
  'Aldea Doradal (El Santoríni Colombiano)',
  5.922,
  -74.733,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Complejo urbanístico construido en la ladera de una colina inspirado en la arquitectura griega de las islas Cícladas con casas blancas y escalinatas de piedra.',
  ARRAY['Paseo fotográfico por las callejuelas blancas y miradores (Gratis)', 'Almuerzo campestre con pescado fresco del río Magdalena ($25.000 COP)']::text[],
  ARRAY['Llevar cámara con batería completa para fotos de arquitectura']::text[],
  ARRAY['Fue construida en los años 80 evocando los pueblos de las islas griegas del mar Egeo']::text[],
  '{"address":"Doradal, Puerto Triunfo, Antioquia","priceRange":"$ - Libre","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Paseo fotográfico por las callejuelas blancas y miradores (Gratis)","Almuerzo campestre con pescado fresco del río Magdalena ($25.000 COP)"],"datos_curiosos":["Fue construida en los años 80 evocando los pueblos de las islas griegas del mar Egeo"],"consejos":["Llevar cámara con batería completa para fotos de arquitectura"],"location_info":{"address":"Doradal, Puerto Triunfo, Antioquia","priceRange":"$ - Libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '371a8f15-4bcd-adf6-54a0-e6b7c61ab6b1',
  '3c266c2b-1b1b-dfda-e7cd-75558b98351b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Desierto de la Tatacoa: Laberinto Rojo, Gris y Cielos Estelares (Villavieja, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-desierto-tatacoa-villavieja-3d',
  'Desierto de la Tatacoa: Laberinto Rojo, Gris y Cielos Estelares',
  'Colombia',
  'Villavieja',
  'ecological',
  'Expedición de 3 días al bosque seco tropical de la Tatacoa en el Huila. Cañones rojizos erosionados en el sector del Cusco, formaciones lunares grises en Los Hoyos y observación astronómica de constelaciones sin contaminación lumínica.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  4320,
  45000,
  'moderate',
  'es',
  4.93,
  90,
  340,
  ARRAY['Desierto de la Tatacoa', 'Cusco', 'Los Hoyos', 'Astronomía', 'Huila', 'Microdestino']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":240000,"estimatedPerPersonMax":520000}'::jsonb,
  ARRAY['Fotógrafos nocturnos', 'Amantes de la geología', 'Aventureros']::text[],
  'Junio a Septiembre y Diciembre a Marzo (cielos despejados para estrellas)',
  'Caminatas a las 6:30 AM y observación astronómica a las 7:30 PM',
  'Parque Principal de Villavieja, Huila',
  ARRAY['Ruta de senderos Cusco y Los Hoyos', 'Horarios de observatorios astronómicos']::text[],
  ARRAY['Entrada al Observatorio Astronómico', 'Alquiler de mototaxi / tuc-tuc', 'Piscina mineral']::text[],
  ARRAY['Llevar al menos 3 litros de agua potable por persona al día (temperaturas diurnas de 38°C)', 'Usar sombrero de ala ancha']::text[],
  ARRAY['Linterna con luz roja para no deslumbrar en observatorios', 'Protector solar 50+', 'Ropa fresca']::text[],
  ARRAY['No pisar los bordes de los zanjones frágiles de arcilla']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '457920b0-c23c-2e5a-3844-bfb70873c5ba',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  1,
  'Día 1: Laberinto Rojo del Cusco y Observatorio Astronómico',
  'Tierra arcillosa rojiza y telescopios bajo el cielo nocturno.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '99605161-c7b0-a081-5ace-85e886367dac',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  '457920b0-c23c-2e5a-3844-bfb70873c5ba',
  1,
  1,
  'Sector El Cusco y Observatorio de la Tatacoa',
  3.232,
  -75.165,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Paisaje de cañones y montículos rojizos de arcilla y hierro esculpidos por el viento y la lluvia. De noche, charla con telescopios profesionales en el observatorio astronómico.',
  ARRAY['Caminata por el laberinto rojo del Cusco (Gratis)', 'Sesión guiada de observación de planetas y nebulosas con telescopio ($15.000 COP)', 'Cena de chivo asado o sancocho en posada del desierto ($22.000 - $35.000 COP)']::text[],
  ARRAY['Hacer la caminata antes de las 9:00 AM o después de las 4:30 PM para evitar golpes de calor']::text[],
  ARRAY['La Tatacoa no es técnicamente un desierto sino un bosque seco tropical que en épocas prehistóricas era un mar interior']::text[],
  '{"address":"Sector Cusco, Villavieja","priceRange":"$ - Observatorio $15.000 COP","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Caminata por el laberinto rojo del Cusco (Gratis)","Sesión guiada de observación de planetas y nebulosas con telescopio ($15.000 COP)","Cena de chivo asado o sancocho en posada del desierto ($22.000 - $35.000 COP)"],"datos_curiosos":["La Tatacoa no es técnicamente un desierto sino un bosque seco tropical que en épocas prehistóricas era un mar interior"],"consejos":["Hacer la caminata antes de las 9:00 AM o después de las 4:30 PM para evitar golpes de calor"],"location_info":{"address":"Sector Cusco, Villavieja","priceRange":"$ - Observatorio $15.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '02082186-fee5-0fbf-71ee-45073245a2d5',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  2,
  'Día 2: Sector Los Hoyos (Zona Gris) y Piscina Mineral',
  'Paisaje fantasmal color ceniza y oasis en el desierto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8de00f90-db09-ad3d-6f20-64fa50ebe681',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  '02082186-fee5-0fbf-71ee-45073245a2d5',
  2,
  2,
  'Sector Los Hoyos y Piscina Oasis',
  3.253,
  -75.176,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Zona lunar de formaciones de arcilla grisácea conocida como el "Valle de los Fantasmas". En el fondo se encuentra una piscina natural de agua de manantial subterráneo.',
  ARRAY['Sendero por las gargantas grises de Los Hoyos (Gratis)', 'Baño refrescante en la piscina mineral del oasis ($10.000 COP)', 'Probar dulce artesanal de leche de cabra y cactus ($8.000 COP)']::text[],
  ARRAY['Llevar traje de baño puesto para la piscina']::text[],
  ARRAY['En Los Hoyos se han hallado fósiles de tortugas gigantes de más de dos metros y perezosos terrestres gigantes']::text[],
  '{"address":"Los Hoyos, Desierto de la Tatacoa","priceRange":"$ - Piscina $10.000 COP","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Sendero por las gargantas grises de Los Hoyos (Gratis)","Baño refrescante en la piscina mineral del oasis ($10.000 COP)","Probar dulce artesanal de leche de cabra y cactus ($8.000 COP)"],"datos_curiosos":["En Los Hoyos se han hallado fósiles de tortugas gigantes de más de dos metros y perezosos terrestres gigantes"],"consejos":["Llevar traje de baño puesto para la piscina"],"location_info":{"address":"Los Hoyos, Desierto de la Tatacoa","priceRange":"$ - Piscina $10.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '57fa097e-cf5c-025a-65ec-0f3e5cf01119',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  3,
  'Día 3: Museo Paleontológico de Villavieja y Despedida',
  'Fósiles de 13 millones de años y retorno a Neiva.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ec7317ca-a55e-0d12-08a3-0dfbd9dedb28',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  '57fa097e-cf5c-025a-65ec-0f3e5cf01119',
  3,
  3,
  'Museo Paleontológico de Villavieja',
  3.22,
  -75.218,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Alberga más de 950 piezas fósiles halladas en el desierto, incluyendo restos de armadillos gigantes, cocodrilos prehistóricos y monos del Mioceno.',
  ARRAY['Visita guiada al museo con piezas fósiles originales (Entrada: $6.000 COP)', 'Paseo en canoa por el río Magdalena desde el puerto de Villavieja ($15.000 COP)', 'Probar el quesillo de hoja y la achira tradicional huilense ($8.000 COP)']::text[],
  ARRAY['Villavieja queda a solo 45 minutos en carretera pavimentada desde Neiva']::text[],
  ARRAY['La Tatacoa es el yacimiento de fósiles de mamíferos del Mioceno más rico de toda América del Sur']::text[],
  '{"address":"Parque Principal, Villavieja, Huila","priceRange":"$ - Entrada $6.000 COP","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Visita guiada al museo con piezas fósiles originales (Entrada: $6.000 COP)","Paseo en canoa por el río Magdalena desde el puerto de Villavieja ($15.000 COP)","Probar el quesillo de hoja y la achira tradicional huilense ($8.000 COP)"],"datos_curiosos":["La Tatacoa es el yacimiento de fósiles de mamíferos del Mioceno más rico de toda América del Sur"],"consejos":["Villavieja queda a solo 45 minutos en carretera pavimentada desde Neiva"],"location_info":{"address":"Parque Principal, Villavieja, Huila","priceRange":"$ - Entrada $6.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'efc307ef-b852-9e66-cc43-4a40da3e6b17',
  '5232c9c7-2fd2-ee8c-9160-289b4f173457',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Golfo de Morrosquillo: Tolú, Coveñas e Islas de San Bernardo (Tolú, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-golfo-morrosquillo-san-bernardo-4d',
  'Golfo de Morrosquillo: Tolú, Coveñas e Islas de San Bernardo',
  'Colombia',
  'Tolú',
  'romantic',
  'Circuito costero de 4 días que une las playas continentales del Golfo de Morrosquillo con el archipiélago de ensueño de San Bernardo: Isla Múcura, Tintipán y Santa Cruz del Islote, la isla más densamente poblada del planeta.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  62000,
  'easy',
  'es',
  4.93,
  110,
  380,
  ARRAY['Tolú', 'Coveñas', 'San Bernardo', 'Isla Múcura', 'Tintipán', 'Playas', 'Costero e Islas']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":380000,"estimatedPerPersonMax":820000}'::jsonb,
  ARRAY['Parejas', 'Amantes del mar tranquilo', 'Familias']::text[],
  'Diciembre a Abril y Julio a Agosto',
  'Zarpe en lancha a las 8:00 AM desde el muelle de Tolú',
  'Malecón Turístico de Tolú, Sucre',
  ARRAY['Ruta costera y puntos de embarque', 'Guía del archipiélago de San Bernardo']::text[],
  ARRAY['Pasaje en lancha rápida', 'Impuesto de muelle', 'Alojamiento en islas']::text[],
  ARRAY['Llevar efectivo suficiente; en las islas no hay cajeros automáticos ni datáfonos estables']::text[],
  ARRAY['Protector solar biodegradable', 'Zapatos para agua', 'Toalla de microfibra']::text[],
  ARRAY['No arrojar residuos al mar ni tocar los corales']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4eda2fc3-2f57-4823-3530-45cd9b99979a',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  1,
  'Día 1: Playas de Coveñas y Paseo en Bicitaxi en Tolú',
  'Arena fina, olas mansas y gastronomía caribeña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a59d14a4-d23d-e320-abb8-97a3b3c82bc7',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '4eda2fc3-2f57-4823-3530-45cd9b99979a',
  1,
  1,
  'Playas de la Primera Ensenada en Coveñas',
  9.408,
  -75.685,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Playas kilométricas de aguas poco profundas y cálidas ideales para nadar sin oleaje fuerte.',
  ARRAY['Baño de mar relajante (Gratis)', 'Almuerzo de pargo platinado con patacón y arroz de coco ($32.000 COP)', 'Paseo en bicitaxi decorado con música en el malecón de Tolú ($10.000 COP)']::text[],
  ARRAY['El golfo de Morrosquillo se caracteriza por un mar plano tipo piscina']::text[],
  ARRAY['Tolú fue una de las villas hispánicas más antiguas del Caribe colombiano, fundada en 1535']::text[],
  '{"address":"Coveñas, Sucre","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Baño de mar relajante (Gratis)","Almuerzo de pargo platinado con patacón y arroz de coco ($32.000 COP)","Paseo en bicitaxi decorado con música en el malecón de Tolú ($10.000 COP)"],"datos_curiosos":["Tolú fue una de las villas hispánicas más antiguas del Caribe colombiano, fundada en 1535"],"consejos":["El golfo de Morrosquillo se caracteriza por un mar plano tipo piscina"],"location_info":{"address":"Coveñas, Sucre","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '98810270-da42-7bee-3877-a0c5a981b415',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  2,
  'Día 2: Archipiélago de San Bernardo: Isla Múcura',
  'Aguas azul turquesa transparente y playas de arena blanca de coral.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f38e37d1-578e-95e4-2843-986f67a14fb2',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '98810270-da42-7bee-3877-a0c5a981b415',
  2,
  2,
  'Isla Múcura en el Archipiélago de San Bernardo',
  9.785,
  -75.875,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Isla paradisíaca perteneciente al Parque Nacional Natural Corales del Rosario y San Bernardo con fondos de arena coralina blanca.',
  ARRAY['Lancha rápida desde Tolú (Pasadía: ~$90.000 - $140.000 COP ida y vuelta)', 'Snorkel en arrecife de coral ($35.000 COP)', 'Almuerzo de langosta o pescado fresco en la playa ($45.000 - $70.000 COP)']::text[],
  ARRAY['Pagar la tasa portuaria en el muelle de Tolú ($12.000 COP en efectivo)']::text[],
  ARRAY['Por la noche en las lagunas de manglar de la isla se aprecia el fenómeno de bioluminiscencia marina']::text[],
  '{"address":"Isla Múcura, Golfo de Morrosquillo","priceRange":"$$ - Pasadía en lancha","dia":2,"day":2}'::jsonb,
  360,
  '{"dia":2,"day":2,"activities":["Lancha rápida desde Tolú (Pasadía: ~$90.000 - $140.000 COP ida y vuelta)","Snorkel en arrecife de coral ($35.000 COP)","Almuerzo de langosta o pescado fresco en la playa ($45.000 - $70.000 COP)"],"datos_curiosos":["Por la noche en las lagunas de manglar de la isla se aprecia el fenómeno de bioluminiscencia marina"],"consejos":["Pagar la tasa portuaria en el muelle de Tolú ($12.000 COP en efectivo)"],"location_info":{"address":"Isla Múcura, Golfo de Morrosquillo","priceRange":"$$ - Pasadía en lancha","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9fe6c5a3-699a-459d-d83d-e45c5ac2ea26',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  3,
  'Día 3: Santa Cruz del Islote e Isla Tintipán',
  'La isla más poblada del mundo y los canales de manglar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '38c8b4c5-5be6-042a-d280-7a9a1ff55c9a',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '9fe6c5a3-699a-459d-d83d-e45c5ac2ea26',
  3,
  3,
  'Santa Cruz del Islote e Isla Tintipán',
  9.789,
  -75.856,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Islote artificial de coral de apenas una hectárea donde conviven más de 800 habitantes sin calles ni policías. Luego, Tintipán con sus playas de ensueño y manglares.',
  ARRAY['Recorrido cultural guiado por los estrechos callejones del islote ($10.000 COP aporte)', 'Nadar con tiburones nodriza inofensivos en el acuario comunitario ($15.000 COP)', 'Descanso en las aguas turquesas de Tintipán (Gratis)']::text[],
  ARRAY['Llevar caramelos o útiles escolares para los niños del islote']::text[],
  ARRAY['En Santa Cruz del Islote no hay mosquitos porque no hay manglares ni agua dulce estancada']::text[],
  '{"address":"Santa Cruz del Islote / Tintipán","priceRange":"$ - Aporte local","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Recorrido cultural guiado por los estrechos callejones del islote ($10.000 COP aporte)","Nadar con tiburones nodriza inofensivos en el acuario comunitario ($15.000 COP)","Descanso en las aguas turquesas de Tintipán (Gratis)"],"datos_curiosos":["En Santa Cruz del Islote no hay mosquitos porque no hay manglares ni agua dulce estancada"],"consejos":["Llevar caramelos o útiles escolares para los niños del islote"],"location_info":{"address":"Santa Cruz del Islote / Tintipán","priceRange":"$ - Aporte local","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '907f4ad9-cc87-b75f-fa2d-d83ca7f83078',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  4,
  'Día 4: Ciénaga de la Caimanera y Despedida',
  'Paseo en canoa a remo entre túneles de manglares y casa flotante.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5016bbb0-ac38-6c97-14d4-4b780ec37c24',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '907f4ad9-cc87-b75f-fa2d-d83ca7f83078',
  4,
  4,
  'Ciénaga de la Caimanera',
  9.45,
  -75.64,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Reserva ecológica costera de manglares donde los pescadores guían canoas a remo silenciosas hasta una casa flotante en medio de la ciénaga.',
  ARRAY['Paseo ecológico en canoa a remo ($20.000 COP)', 'Probar ostras frescas extraídas del manglar con limón en la casa flotante ($15.000 COP docena)', 'Compras de artesanías de caña flecha antes de salir ($15.000 - $40.000 COP)']::text[],
  ARRAY['Las canoas van sin motor para no alterar la fauna de aves acuáticas']::text[],
  ARRAY['En la ciénaga habitan caimanes aguja protegidos y cuatro tipos distintos de manglares']::text[],
  '{"address":"Coveñas, Sucre","priceRange":"$ - Paseo en canoa","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Paseo ecológico en canoa a remo ($20.000 COP)","Probar ostras frescas extraídas del manglar con limón en la casa flotante ($15.000 COP docena)","Compras de artesanías de caña flecha antes de salir ($15.000 - $40.000 COP)"],"datos_curiosos":["En la ciénaga habitan caimanes aguja protegidos y cuatro tipos distintos de manglares"],"consejos":["Las canoas van sin motor para no alterar la fauna de aves acuáticas"],"location_info":{"address":"Coveñas, Sucre","priceRange":"$ - Paseo en canoa","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '82490a63-080a-bcf6-b7dc-860f35da1dfb',
  '37f88edb-f27c-af22-d2b4-3325cae05925',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Archipiélago de San Andrés y Providencia: El Mar de los Siete Colores (San Andrés, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '1411b297-1294-7f32-caad-4807ffc0d565',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-san-andres-providencia-cayos-6d',
  'Archipiélago de San Andrés y Providencia: El Mar de los Siete Colores',
  'Colombia',
  'San Andrés',
  'romantic',
  'Circuito caribeño de 6 días en la Reserva de la Biósfera Seaflower. Vuelta a la isla de San Andrés en carro de golf o mula, snorkel en Johnny Cay y el Acuario, y salto a la paradisíaca e intacta isla de Providencia.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  110000,
  'easy',
  'es',
  4.97,
  155,
  530,
  ARRAY['San Andrés', 'Providencia', 'Johnny Cay', 'Seaflower', 'Caribe', 'Costero e Islas', 'Cayos']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":650000,"estimatedPerPersonMax":1400000}'::jsonb,
  ARRAY['Parejas', 'Amantes del snorkel', 'Buceadores']::text[],
  'Diciembre a Mayo',
  'Zarpes a los cayos a primera hora de la mañana',
  'Playa Principal de Spratt Bight, San Andrés',
  ARRAY['Ruta completa de cayos y playas', 'Guía de alquiler de vehículos de golf']::text[],
  ARRAY['Tarjeta de turismo OCCRE', 'Vuelo o catamarán San Andrés - Providencia']::text[],
  ARRAY['Pagar la tarjeta turística OCCRE en el aeropuerto de origen antes de abordar el vuelo a San Andrés']::text[],
  ARRAY['Zapatos de agua', 'Equipo de snorkel', 'Protector solar reef-safe']::text[],
  ARRAY['Prohibido extraer caracoles pala o estrellas de mar']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c07578cb-481f-26fb-c920-ef410f2684dd',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  1,
  'Día 1: Playa de Spratt Bight y Vuelta a la Isla en Mula',
  'Alquiler de carrito de golf bordeando el mar azul turquesa.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2ec2ff2d-916b-2415-2f1a-6f240935d541',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  'c07578cb-481f-26fb-c920-ef410f2684dd',
  1,
  1,
  'Spratt Bight y Vuelta a la Isla',
  12.585,
  -81.7,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Recorrido de 30 km bordeando la costa con paradas en La Piscinita, el Hoyo Soplador y las playas de San Luis.',
  ARRAY['Alquiler de carrito de golf por día ($180.000 - $250.000 COP)', 'Snorkel en La Piscinita rodeado de peces sargento ($10.000 COP)', 'Ver el chorro de agua del Hoyo Soplador (Gratis)']::text[],
  ARRAY['Respetar los límites de velocidad en el carrito de golf']::text[],
  ARRAY['El mar exhibe hasta 7 tonalidades distintas de azul debido a las diferentes profundidades y arrecifes de coral']::text[],
  '{"address":"San Andrés Isla","priceRange":"$$ - Alquiler carrito","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Alquiler de carrito de golf por día ($180.000 - $250.000 COP)","Snorkel en La Piscinita rodeado de peces sargento ($10.000 COP)","Ver el chorro de agua del Hoyo Soplador (Gratis)"],"datos_curiosos":["El mar exhibe hasta 7 tonalidades distintas de azul debido a las diferentes profundidades y arrecifes de coral"],"consejos":["Respetar los límites de velocidad en el carrito de golf"],"location_info":{"address":"San Andrés Isla","priceRange":"$$ - Alquiler carrito","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '558ac119-0bfd-cfe1-f87d-315b051686d8',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  2,
  'Día 2: Johnny Cay y el Acuario Natural de Haynes Cay',
  'Palmeras gigantes, rayas marinas y peces de arrecife.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e912bb7a-94aa-0686-4e64-5af1c305648a',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  '558ac119-0bfd-cfe1-f87d-315b051686d8',
  2,
  2,
  'Cayo Johnny Cay y Acuario Rose Cay',
  12.5992,
  -81.6897,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Cayo de arena blanca con palmeras gigantes y un acuario natural donde el agua llega a la cintura y se nada con mantarrayas.',
  ARRAY['Lancha combinada Johnny Cay + Acuario ($45.000 - $65.000 COP)', 'Almuerzo de pargo rojo con coco en Johnny Cay ($38.000 - $55.000 COP)', 'Caminar sobre el banco de arena entre Rose Cay y Haynes Cay (Gratis)']::text[],
  ARRAY['Usar zapatos de agua obligatorios en el Acuario por piedras de coral']::text[],
  ARRAY['Johnny Cay está habitado por cientos de iguanas de gran tamaño que pasean entre los turistas']::text[],
  '{"address":"Cayos de San Andrés","priceRange":"$$ - Lancha y almuerzo","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Lancha combinada Johnny Cay + Acuario ($45.000 - $65.000 COP)","Almuerzo de pargo rojo con coco en Johnny Cay ($38.000 - $55.000 COP)","Caminar sobre el banco de arena entre Rose Cay y Haynes Cay (Gratis)"],"datos_curiosos":["Johnny Cay está habitado por cientos de iguanas de gran tamaño que pasean entre los turistas"],"consejos":["Usar zapatos de agua obligatorios en el Acuario por piedras de coral"],"location_info":{"address":"Cayos de San Andrés","priceRange":"$$ - Lancha y almuerzo","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'de57868b-5fcf-86f5-863d-f6f74042d382',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  3,
  'Día 3: El Paraíso Escondido: Vuelo a la Isla de Providencia',
  'Salto a la joya virgen de la arquitectura isleña de madera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '13a93795-f3ac-7e25-894f-9b5f2cf52687',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  'de57868b-5fcf-86f5-863d-f6f74042d382',
  3,
  3,
  'Llegada a Providencia y Bahía de Santa Catalina',
  13.355,
  -81.372,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo panorámico de 20 minutos en avioneta o catamarán. Providencia es un paraíso sin cadenas hoteleras, habitado por la comunidad raizal en casas tradicionales de madera.',
  ARRAY['Cruzar a pie el Puente de los Enamorados que une Providencia con Santa Catalina (Gratis)', 'Caminar hasta la Cabeza de Morgan en Santa Catalina (Gratis)', 'Cena de muelas de cangrejo negro o rondón raizal ($40.000 - $65.000 COP)']::text[],
  ARRAY['Providencia cuenta con cupos limitados diarios; reservar vuelo con mucha anticipación']::text[],
  ARRAY['El Puente de los Enamorados es una pasarela flotante de madera de colores sobre un canal marino transparente']::text[],
  '{"address":"Santa Isabel, Providencia","priceRange":"$$$ - Vuelo interno","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Cruzar a pie el Puente de los Enamorados que une Providencia con Santa Catalina (Gratis)","Caminar hasta la Cabeza de Morgan en Santa Catalina (Gratis)","Cena de muelas de cangrejo negro o rondón raizal ($40.000 - $65.000 COP)"],"datos_curiosos":["El Puente de los Enamorados es una pasarela flotante de madera de colores sobre un canal marino transparente"],"consejos":["Providencia cuenta con cupos limitados diarios; reservar vuelo con mucha anticipación"],"location_info":{"address":"Santa Isabel, Providencia","priceRange":"$$$ - Vuelo interno","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c5311b5c-d86b-65ed-b073-84029cd1c72c',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  4,
  'Día 4: Cayo Cangrejo y Parque Nacional McBean Lagoon',
  'El santuario marino más espectacular de Colombia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'bd5d7d4c-a426-7f1c-6c53-16d02c962646',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  'c5311b5c-d86b-65ed-b073-84029cd1c72c',
  4,
  4,
  'Cayo Cangrejo (Crab Cay)',
  13.366,
  -81.355,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Un peñón rocoso solitario en medio de una piscina gigante de agua esmeralda de 360 grados donde habitan tortugas marinas y corales cerebro.',
  ARRAY['Lancha hacia Cayo Cangrejo ($40.000 COP ida y vuelta)', 'Entrada al Parque Nacional McBean Lagoon ($22.000 COP)', 'Snorkel con tortugas carey y peces loro (Gratis con equipo propio)']::text[],
  ARRAY['Subir a la cima de la roca de Cayo Cangrejo para una de las mejores vistas panorámicas de todo el Caribe']::text[],
  ARRAY['La barrera arrecifal de Providencia es la segunda más larga del hemisferio occidental después de la de Belice']::text[],
  '{"address":"PNN Old Providence McBean Lagoon","priceRange":"$$ - Excursión cayo","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Lancha hacia Cayo Cangrejo ($40.000 COP ida y vuelta)","Entrada al Parque Nacional McBean Lagoon ($22.000 COP)","Snorkel con tortugas carey y peces loro (Gratis con equipo propio)"],"datos_curiosos":["La barrera arrecifal de Providencia es la segunda más larga del hemisferio occidental después de la de Belice"],"consejos":["Subir a la cima de la roca de Cayo Cangrejo para una de las mejores vistas panorámicas de todo el Caribe"],"location_info":{"address":"PNN Old Providence McBean Lagoon","priceRange":"$$ - Excursión cayo","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b5a4d257-143b-7b3d-14eb-57abdabd6a3f',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  5,
  'Día 5: Bahía Suroeste y Atardecer con Reggae',
  'Carreras tradicionales de caballos en la playa y música caribeña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '02f40e02-21b8-af1b-5dcc-643e82f838e0',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  'b5a4d257-143b-7b3d-14eb-57abdabd6a3f',
  5,
  5,
  'South West Bay y Freshwater Bay',
  13.332,
  -81.391,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'La playa más extensa de Providencia bordeada de cocoteros y restaurantes de pescadores donde suena música reggae y calipso.',
  ARRAY['Descanso en la playa de aguas calmas (Gratis)', 'Almuerzo en el restaurante de mariscos de Richard ($45.000 COP)', 'Ver carreras de caballos en la arena los sábados por la tarde (Gratis)']::text[],
  ARRAY['Alquilar una moto scooter para recorrer Providencia a su propio ritmo ($90.000 COP/día)']::text[],
  ARRAY['Los habitantes de Providencia hablan fluidamente inglés criollo caribeño (creole), español e inglés estándar']::text[],
  '{"address":"South West Bay, Providencia","priceRange":"$ - Libre","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Descanso en la playa de aguas calmas (Gratis)","Almuerzo en el restaurante de mariscos de Richard ($45.000 COP)","Ver carreras de caballos en la arena los sábados por la tarde (Gratis)"],"datos_curiosos":["Los habitantes de Providencia hablan fluidamente inglés criollo caribeño (creole), español e inglés estándar"],"consejos":["Alquilar una moto scooter para recorrer Providencia a su propio ritmo ($90.000 COP/día)"],"location_info":{"address":"South West Bay, Providencia","priceRange":"$ - Libre","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f8cc1856-dfa3-87c1-7707-eb06f821e54d',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  6,
  'Día 6: Retorno a San Andrés y Compras Libres de Impuestos',
  'Vuelo de regreso y compras en el centro comercial libre de impuestos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2d03e683-0d4b-837b-f319-2b025976e59e',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  'f8cc1856-dfa3-87c1-7707-eb06f821e54d',
  6,
  6,
  'Centro Comercial de San Andrés y Despedida',
  12.583,
  -81.698,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Zona de puerto libre de impuestos en el centro de San Andrés con perfumes, chocolates y licores importados a precios preferenciales.',
  ARRAY['Compras duty free en la Avenida Providencia ($30.000 - $120.000 COP)', 'Último baño en la playa de Spratt Bight frente al hotel (Gratis)', 'Traslado al aeropuerto Gustavo Rojas Pinilla (a solo 5 minutos en taxi: $18.000 COP)']::text[],
  ARRAY['Revisar el cupo aduanero permitido para llevar licores y perfumes a Colombia continental']::text[],
  ARRAY['San Andrés goza de régimen aduanero especial de puerto libre desde el año 1953']::text[],
  '{"address":"Avenida Providencia, San Andrés","priceRange":"$ - Compras duty free","dia":6,"day":6}'::jsonb,
  150,
  '{"dia":6,"day":6,"activities":["Compras duty free en la Avenida Providencia ($30.000 - $120.000 COP)","Último baño en la playa de Spratt Bight frente al hotel (Gratis)","Traslado al aeropuerto Gustavo Rojas Pinilla (a solo 5 minutos en taxi: $18.000 COP)"],"datos_curiosos":["San Andrés goza de régimen aduanero especial de puerto libre desde el año 1953"],"consejos":["Revisar el cupo aduanero permitido para llevar licores y perfumes a Colombia continental"],"location_info":{"address":"Avenida Providencia, San Andrés","priceRange":"$ - Compras duty free","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '043bbaeb-b62b-5cfc-4f64-659e284762ae',
  '1411b297-1294-7f32-caad-4807ffc0d565',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Riviera Mexicana: Cancún, Arrecifes de Cozumel e Isla Mujeres (Cancún, México)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-cancun-cozumel-isla-mujeres-5d',
  'Riviera Mexicana: Cancún, Arrecifes de Cozumel e Isla Mujeres',
  'México',
  'Cancún',
  'romantic',
  'Circuito caribeño de 5 días combinando las playas de arena de coral blanco de Cancún, el buceo en los arrecifes de Cozumel y el ambiente relajado en carrito de golf en Isla Mujeres.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  140000,
  'easy',
  'es',
  4.95,
  140,
  490,
  ARRAY['Cancún', 'Cozumel', 'Isla Mujeres', 'Caribe Mexicano', 'Arrecifes', 'Costero e Islas']::text[],
  true,
  'approved',
  '{"currency":"MXN","estimatedPerPersonMin":3500,"estimatedPerPersonMax":7800}'::jsonb,
  ARRAY['Parejas', 'Amantes del snorkel', 'Buceadores']::text[],
  'Diciembre a Mayo',
  'Ferris matutinos a las islas',
  'Playa Delfines, Cancún',
  ARRAY['Ruta costera e insular', 'Horarios de ferris Ultramar']::text[],
  ARRAY['Billetes de ferry', 'Snorkel en Cozumel']::text[],
  ARRAY['Comprar los billetes de ferry Ultramar ida y vuelta']::text[],
  ARRAY['Protector solar biodegradable', 'Zapatos de agua']::text[],
  ARRAY['No tocar las estrellas de mar en El Cielo']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b7596342-46fb-3ca7-c97a-9d1315c2476b',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  1,
  'Día 1: Cancún: Playa Delfines y el Mirador',
  'Las letras monumentales de Cancún y olas turquesas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '83fdc4c2-e3b9-16c2-2fc3-d4bf2d1d579b',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  'b7596342-46fb-3ca7-c97a-9d1315c2476b',
  1,
  1,
  'Playa Delfines (El Mirador)',
  21.06,
  -86.779,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Playa pública certificada Blue Flag con las letras icónicas de Cancún y mar azul eléctrico.',
  ARRAY['Foto en el letrero de Cancún (Gratis)', 'Baño en el mar (Gratis)', 'Tacos de pescado en la orilla ($150 MXN)']::text[],
  ARRAY['Tomar el autobús de la zona hotelera R-1 o R-2 ($12 MXN)']::text[],
  ARRAY['La arena blanca de Cancún es de origen coralino y nunca se calienta con el sol']::text[],
  '{"address":"Zona Hotelera Km 19.5, Cancún","priceRange":"$ - Libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Foto en el letrero de Cancún (Gratis)","Baño en el mar (Gratis)","Tacos de pescado en la orilla ($150 MXN)"],"datos_curiosos":["La arena blanca de Cancún es de origen coralino y nunca se calienta con el sol"],"consejos":["Tomar el autobús de la zona hotelera R-1 o R-2 ($12 MXN)"],"location_info":{"address":"Zona Hotelera Km 19.5, Cancún","priceRange":"$ - Libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '10f6e233-1e3f-69c6-19c9-f816dcde064b',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  2,
  'Día 2: Isla Mujeres: Carrito de Golf y Playa Norte',
  'Una de las 10 mejores playas del mundo según TripAdvisor.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a785c5de-52db-6909-5188-6d75733b6293',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  '10f6e233-1e3f-69c6-19c9-f816dcde064b',
  2,
  2,
  'Playa Norte y Punta Sur en Isla Mujeres',
  21.258,
  -86.748,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Ferry de 20 minutos desde Puerto Juárez. Playa Norte es una piscina gigante de agua cristalina sin olas con palmeras.',
  ARRAY['Ferry Ultramar ($540 MXN ida y vuelta)', 'Alquiler de carrito de golf por día ($1.000 MXN)', 'Nadar en Playa Norte (Gratis)']::text[],
  ARRAY['Llegar a Punta Sur para ver los acantilados donde tocan los primeros rayos de sol en México']::text[],
  ARRAY['Los conquistadores la llamaron Isla Mujeres por las figuras femeninas dedicadas a la diosa maya Ixchel']::text[],
  '{"address":"Isla Mujeres, Quintana Roo","priceRange":"$$ - Ferry y carrito","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Ferry Ultramar ($540 MXN ida y vuelta)","Alquiler de carrito de golf por día ($1.000 MXN)","Nadar en Playa Norte (Gratis)"],"datos_curiosos":["Los conquistadores la llamaron Isla Mujeres por las figuras femeninas dedicadas a la diosa maya Ixchel"],"consejos":["Llegar a Punta Sur para ver los acantilados donde tocan los primeros rayos de sol en México"],"location_info":{"address":"Isla Mujeres, Quintana Roo","priceRange":"$$ - Ferry y carrito","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0fa3a26c-9070-3ef0-1ece-35b15668d0f9',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  3,
  'Día 3: Cozumel: El Cielo y Snorkel en Palancar',
  'Bancos de arena con estrellas de mar y rayas águila.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2189af47-4d00-5646-3df7-be57f8860755',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  '0fa3a26c-9070-3ef0-1ece-35b15668d0f9',
  3,
  3,
  'Arrecife Palancar y El Cielo en Cozumel',
  20.35,
  -87.03,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Cozumel es la meca mundial del buceo recomendada por Jacques Cousteau. "El Cielo" es un banco de arena transparente tapizado de estrellas de mar gigantes.',
  ARRAY['Ferry de Playa del Carmen a Cozumel ($560 MXN ida y vuelta)', 'Tour en catamarán con snorkel en Palancar y El Cielo ($1.200 - $1.600 MXN)']::text[],
  ARRAY['No tocar jamás las estrellas de mar; sacarlas del agua las asfixia en segundos']::text[],
  ARRAY['La visibilidad submarina en los arrecifes de Cozumel supera habitualmente los 30 metros']::text[],
  '{"address":"Cozumel, Quintana Roo","priceRange":"$$$ - Tour El Cielo","dia":3,"day":3}'::jsonb,
  360,
  '{"dia":3,"day":3,"activities":["Ferry de Playa del Carmen a Cozumel ($560 MXN ida y vuelta)","Tour en catamarán con snorkel en Palancar y El Cielo ($1.200 - $1.600 MXN)"],"datos_curiosos":["La visibilidad submarina en los arrecifes de Cozumel supera habitualmente los 30 metros"],"consejos":["No tocar jamás las estrellas de mar; sacarlas del agua las asfixia en segundos"],"location_info":{"address":"Cozumel, Quintana Roo","priceRange":"$$$ - Tour El Cielo","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '37e5c63d-050c-2ce1-b85b-8e8931f0cd31',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  4,
  'Día 4: Museo Subacuático de Arte (MUSA)',
  'Cientos de esculturas sumergidas que forman arrecifes artificiales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'dabc0ece-f1c8-3734-13da-fcc9cc1804e5',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  '37e5c63d-050c-2ce1-b85b-8e8931f0cd31',
  4,
  4,
  'MUSA (Museo Subacuático de Arte)',
  21.18,
  -86.75,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Más de 500 esculturas de tamaño real sumergidas en el fondo del mar diseñadas con cemento marino neutro para colonización de corales.',
  ARRAY['Snorkel en el MUSA con lancha y guía ($950 MXN)', 'Cena marinera en la laguna Nichupté con vista al atardecer ($450 MXN)']::text[],
  ARRAY['Excelente para snorkel y buceo de iniciación a poca profundidad']::text[],
  ARRAY['Las esculturas fueron creadas por el artista británico Jason deCaires Taylor']::text[],
  '{"address":"Cancún / Isla Mujeres","priceRange":"$$ - Tour MUSA","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Snorkel en el MUSA con lancha y guía ($950 MXN)","Cena marinera en la laguna Nichupté con vista al atardecer ($450 MXN)"],"datos_curiosos":["Las esculturas fueron creadas por el artista británico Jason deCaires Taylor"],"consejos":["Excelente para snorkel y buceo de iniciación a poca profundidad"],"location_info":{"address":"Cancún / Isla Mujeres","priceRange":"$$ - Tour MUSA","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd365e781-58f0-48a3-ad02-06ad7eca47bc',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  5,
  'Día 5: Mercado 28 y Despedida Caribeña',
  'Gastronomía yucateca, recuerdos y traslado al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '547295fd-f180-d69f-fb0f-51898423401c',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  'd365e781-58f0-48a3-ad02-06ad7eca47bc',
  5,
  5,
  'Mercado 28 en Cancún Centro',
  21.161,
  -86.833,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Gran mercado tradicional de artesanías mexicanas, plata de Taxco y comida típica en el centro de Cancún.',
  ARRAY['Comprar recuerdos y artesanías ($100 - $300 MXN)', 'Almuerzo de ceviche mixto con michelada ($180 MXN)']::text[],
  ARRAY['Regatear con cordialidad en los puestos de artesanías']::text[],
  ARRAY['Cancún significa "nido de serpientes" en lengua maya prehispánica']::text[],
  '{"address":"Mercado 28, Cancún Centro","priceRange":"$ - Compras locales","dia":5,"day":5}'::jsonb,
  150,
  '{"dia":5,"day":5,"activities":["Comprar recuerdos y artesanías ($100 - $300 MXN)","Almuerzo de ceviche mixto con michelada ($180 MXN)"],"datos_curiosos":["Cancún significa \"nido de serpientes\" en lengua maya prehispánica"],"consejos":["Regatear con cordialidad en los puestos de artesanías"],"location_info":{"address":"Mercado 28, Cancún Centro","priceRange":"$ - Compras locales","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '335915e8-d372-d147-c599-78a66a5d442a',
  '2303fb3f-6fa8-b31d-fe9e-c49cc8d01228',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Nápoles, Capri y la Costa Amalfitana: El Paraíso Tirreno (Nápoles, Italia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-napoles-capri-costa-amalfitana-6d',
  'Nápoles, Capri y la Costa Amalfitana: El Paraíso Tirreno',
  'Italia',
  'Nápoles',
  'romantic',
  'Circuito de 6 días que combina la auténtica pizza napolitana en Nápoles, la travesía en barco hacia los Farallones y la Gruta Azul de Capri, y los pueblos de postal colgados de los acantilados de Positano y Amalfi.',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  130000,
  'moderate',
  'es',
  4.97,
  170,
  580,
  ARRAY['Nápoles', 'Capri', 'Costa Amalfitana', 'Positano', 'Amalfi', 'Italia', 'Costero e Islas']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":550,"estimatedPerPersonMax":1200}'::jsonb,
  ARRAY['Parejas', 'Viajeros gourmet', 'Fotógrafos de costa']::text[],
  'Mayo a Octubre',
  'Ferris matutinos entre islas y pueblos costeros',
  'Piazza del Plebiscito / Muelle Beverello, Nápoles',
  ARRAY['Ruta completa de costa e islas', 'Horarios de hidroalas a Capri']::text[],
  ARRAY['Billetes de ferry hidroala', 'Barca Gruta Azul', 'Autobuses SITA']::text[],
  ARRAY['En la Costa Amalfitana moverse en ferry marítimo para evitar los atascos de la estrecha carretera']::text[],
  ARRAY['Calzado con buen agarre para escaleras empinadas', 'Gafas de sol', 'Bañador']::text[],
  ARRAY['No bañarse en las fuentes de las plazas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '00f944eb-bbd6-0ce6-adc3-1b37ed83a4f2',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  1,
  'Día 1: Nápoles Histórico y la Pizza Margarita Original',
  'Spaccanapoli, el Cristo Velado y la cuna de la pizza.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f49389cd-643b-7af4-faca-0b9cdd35231d',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '00f944eb-bbd6-0ce6-adc3-1b37ed83a4f2',
  1,
  1,
  'Spaccanapoli y Pizzería Da Michele',
  40.85,
  14.258,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'La calle recta que divide el casco antiguo de Nápoles. Pizzería Da Michele opera desde 1870 sirviendo exclusivamente pizza Margarita y Marinara.',
  ARRAY['Caminar por Spaccanapoli (Gratis)', 'Pizza Margarita auténtica en Da Michele (€5.50)', 'Ver el Cristo Velado en la Capilla Sansevero (€10)']::text[],
  ARRAY['En Da Michele tomar número en la entrada y esperar turno pacientemente']::text[],
  ARRAY['La pizza Margarita fue inventada en 1889 en honor a la reina Margarita de Saboya con los colores de la bandera italiana (tomate rojo, mozzarella blanca y albahaca verde)']::text[],
  '{"address":"Via Cesare Sersale 1, Napoli","priceRange":"$ - Pizza €5.50","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Caminar por Spaccanapoli (Gratis)","Pizza Margarita auténtica en Da Michele (€5.50)","Ver el Cristo Velado en la Capilla Sansevero (€10)"],"datos_curiosos":["La pizza Margarita fue inventada en 1889 en honor a la reina Margarita de Saboya con los colores de la bandera italiana (tomate rojo, mozzarella blanca y albahaca verde)"],"consejos":["En Da Michele tomar número en la entrada y esperar turno pacientemente"],"location_info":{"address":"Via Cesare Sersale 1, Napoli","priceRange":"$ - Pizza €5.50","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '97693b3b-cba1-61a4-ea32-034a9b6b44a8',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  2,
  'Día 2: Isla de Capri: Farallones y la Gruta Azul',
  'Ferry a la isla del glamour y caverna marina resplandeciente.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5fd7e938-ff14-7e0b-d2ba-e88bfdd6dd10',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '97693b3b-cba1-61a4-ea32-034a9b6b44a8',
  2,
  2,
  'Farallones de Capri y Gruta Azul (Grotta Azzurra)',
  40.5507,
  14.2426,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Isla de piedra caliza con sus tres gigantescos monolitos en el mar (Faraglioni) y la mágica Gruta Azul donde la luz del sol entra por una abertura submarina.',
  ARRAY['Hidroala de Nápoles a Capri (€24 ida)', 'Tour en barca de remos entrando a la Gruta Azul (€18)', 'Vistas desde los Jardines de Augusto (€1.50)']::text[],
  ARRAY['La Gruta Azul cierra si hay marea alta o marejada fuerte']::text[],
  ARRAY['El emperador romano Tiberio gobernó todo el Imperio Romano desde su villa imperial en Capri durante sus últimos 10 años de vida']::text[],
  '{"address":"Marina Grande, Capri","priceRange":"$$$ - Excursión isla","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Hidroala de Nápoles a Capri (€24 ida)","Tour en barca de remos entrando a la Gruta Azul (€18)","Vistas desde los Jardines de Augusto (€1.50)"],"datos_curiosos":["El emperador romano Tiberio gobernó todo el Imperio Romano desde su villa imperial en Capri durante sus últimos 10 años de vida"],"consejos":["La Gruta Azul cierra si hay marea alta o marejada fuerte"],"location_info":{"address":"Marina Grande, Capri","priceRange":"$$$ - Excursión isla","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1446c0a4-14ab-f132-adf3-04df1ef7e529',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  3,
  'Día 3: Sorrento: Jardines de Limones y Terrazas sobre el Mar',
  'Cuna del Limoncello y mirador al Vesubio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '909b9bf8-9622-21e1-aa58-120ebc3046cd',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '1446c0a4-14ab-f132-adf3-04df1ef7e529',
  3,
  3,
  'Piazza Tasso y Claustro de San Francisco en Sorrento',
  40.626,
  14.375,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Ciudad sobre acantilados de toba con vistas al volcán Vesubio. Conocida por sus plantaciones de limones gigantes y licor de Limoncello artesanal.',
  ARRAY['Paseo por los huertos de limones y degustación gratuita de Limoncello', 'Almuerzo de gnocchi alla sorrentina (€14 - €20)']::text[],
  ARRAY['Sorrento es el punto neurálgico ideal para conectar Nápoles con la Costa Amalfitana']::text[],
  ARRAY['Los limones de Sorrento cuentan con denominación IGP y su piel es tan rica en aceites que se usa para perfumería']::text[],
  '{"address":"Piazza Tasso, Sorrento","priceRange":"$ - Degustación libre","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Paseo por los huertos de limones y degustación gratuita de Limoncello","Almuerzo de gnocchi alla sorrentina (€14 - €20)"],"datos_curiosos":["Los limones de Sorrento cuentan con denominación IGP y su piel es tan rica en aceites que se usa para perfumería"],"consejos":["Sorrento es el punto neurálgico ideal para conectar Nápoles con la Costa Amalfitana"],"location_info":{"address":"Piazza Tasso, Sorrento","priceRange":"$ - Degustación libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f48c5075-9095-74b1-62fa-cf52ab1b5355',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  4,
  'Día 4: Positano: Casas de Colores Colgadas del Acantilado',
  'La joya vertical de la Costa Amalfitana.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '95945828-527b-8af1-351d-f00ecbdf6769',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  'f48c5075-9095-74b1-62fa-cf52ab1b5355',
  4,
  4,
  'Pueblo de Positano y Playa Grande',
  40.6281,
  14.485,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo vertical construido en una ladera empinadísima con casas de tonos pastel, buganvillas y la cúpula de mayólica de Santa María Asunta.',
  ARRAY['Bajar por las callejuelas escalonadas hacia Spiaggia Grande (Gratis)', 'Tomar un sorbete de limón servido dentro de un limón congelado gigante (€8)', 'Fotografía de la cascada de casas desde el muelle']::text[],
  ARRAY['Llegar en ferry marítimo para tener la vista más imponente de Positano desde el agua']::text[],
  ARRAY['El escritor John Steinbeck escribió en 1953: "Positano te cala hondo. Es un lugar de ensueño que no parece real mientras estás allí"']::text[],
  '{"address":"Positano, Salerno","priceRange":"$$ - Ferry y consumos","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Bajar por las callejuelas escalonadas hacia Spiaggia Grande (Gratis)","Tomar un sorbete de limón servido dentro de un limón congelado gigante (€8)","Fotografía de la cascada de casas desde el muelle"],"datos_curiosos":["El escritor John Steinbeck escribió en 1953: \"Positano te cala hondo. Es un lugar de ensueño que no parece real mientras estás allí\""],"consejos":["Llegar en ferry marítimo para tener la vista más imponente de Positano desde el agua"],"location_info":{"address":"Positano, Salerno","priceRange":"$$ - Ferry y consumos","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7656bc41-01ed-7376-66a8-45ececf4f4a1',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  5,
  'Día 5: Amalfi y Ravello: La Catedral de San Andrés y Villa Rufolo',
  'La antigua república marinera y jardines con vistas al infinito.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ea19cdea-0841-0f43-b0fc-a04095530007',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '7656bc41-01ed-7376-66a8-45ececf4f4a1',
  5,
  5,
  'Catedral de Amalfi y Villa Rufolo en Ravello',
  40.634,
  14.6027,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Amalfi fue una poderosa república marítima medieval con su catedral de 62 escalones de mármol rayado. Arriba en la montaña, Ravello deslumbra con los jardines de Villa Rufolo que inspiraron a Wagner.',
  ARRAY['Subir la escalinata monumental del Duomo di Amalfi (Entrada claustro: €3)', 'Pasear por los jardines sobre el abismo de Villa Rufolo en Ravello (€7)', 'Probar el dulce tradicional *Delizia al Limone* en pastelería Pansa (€5)']::text[],
  ARRAY['El autobús local conecta Amalfi con Ravello en 25 minutos (€1.50)']::text[],
  ARRAY['Amalfi inventó las *Tablas Amalfitanas*, el primer código de derecho marítimo del mundo medieval']::text[],
  '{"address":"Piazza Duomo, Amalfi","priceRange":"$ - Entradas accesibles","dia":5,"day":5}'::jsonb,
  270,
  '{"dia":5,"day":5,"activities":["Subir la escalinata monumental del Duomo di Amalfi (Entrada claustro: €3)","Pasear por los jardines sobre el abismo de Villa Rufolo en Ravello (€7)","Probar el dulce tradicional *Delizia al Limone* en pastelería Pansa (€5)"],"datos_curiosos":["Amalfi inventó las *Tablas Amalfitanas*, el primer código de derecho marítimo del mundo medieval"],"consejos":["El autobús local conecta Amalfi con Ravello en 25 minutos (€1.50)"],"location_info":{"address":"Piazza Duomo, Amalfi","priceRange":"$ - Entradas accesibles","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '79c721b9-1a3b-7a26-aa07-7ff481169b4a',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  6,
  'Día 6: Retorno a Nápoles y Despedida con Vistas al Castel dell''Ovo',
  'El castillo del huevo sobre el mar y despedida.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6a1976c9-a9a0-3850-c8e0-da91b5c6d2b1',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '79c721b9-1a3b-7a26-aa07-7ff481169b4a',
  6,
  6,
  'Castel dell''Ovo y Paseo Marítimo Caracciolo',
  40.828,
  14.2475,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'La fortaleza más antigua de Nápoles erigida sobre el islote de Megaride. Paseo marítimo con vistas al golfo y al Vesubio.',
  ARRAY['Paseo por el puente de piedra hacia el castillo (Gratis)', 'Último café espresso napolitano con sfogliatella caliente (€3)', 'Tren Alibus directo desde Piazza Garibaldi hacia el aeropuerto Capodichino (€5)']::text[],
  ARRAY['La sfogliatella puede ser *riccia* (hojaldrada) o *frolla* (masa quebrada)']::text[],
  ARRAY['La leyenda cuenta que el poeta Virgilio escondió un huevo mágico en los cimientos del castillo; si se rompe, el castillo y Nápoles se hundirán']::text[],
  '{"address":"Via Eldorado 3, Napoli","priceRange":"$ - Acceso libre","dia":6,"day":6}'::jsonb,
  150,
  '{"dia":6,"day":6,"activities":["Paseo por el puente de piedra hacia el castillo (Gratis)","Último café espresso napolitano con sfogliatella caliente (€3)","Tren Alibus directo desde Piazza Garibaldi hacia el aeropuerto Capodichino (€5)"],"datos_curiosos":["La leyenda cuenta que el poeta Virgilio escondió un huevo mágico en los cimientos del castillo; si se rompe, el castillo y Nápoles se hundirán"],"consejos":["La sfogliatella puede ser *riccia* (hojaldrada) o *frolla* (masa quebrada)"],"location_info":{"address":"Via Eldorado 3, Napoli","priceRange":"$ - Acceso libre","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'c07273ef-523d-235e-f73d-a497ae099e53',
  '4ffb7bc7-7ee8-5fdc-e17d-c7207e182260',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Road Trip Caribeño: De Barranquilla a Santa Marta por la Vía Parque (Barranquilla, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-road-trip-barranquilla-santa-marta-4d',
  'Road Trip Caribeño: De Barranquilla a Santa Marta por la Vía Parque',
  'Colombia',
  'Barranquilla',
  'cultural',
  'Road trip de 4 días por el litoral caribeño colombiano. Desde el Gran Malecón del Río y la Ventana al Mundo en Barranquilla, cruzando el puente Pumarejo sobre el río Magdalena, la Ciénaga Grande y pueblos palafitos, hasta la bahía de Santa Marta.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  105000,
  'easy',
  'es',
  4.91,
  85,
  290,
  ARRAY['Barranquilla', 'Santa Marta', 'Ciénaga', 'Road Trip', 'Caribe', 'city_to_city']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":290000,"estimatedPerPersonMax":650000}'::jsonb,
  ARRAY['Amantes de los road trips', 'Familias', 'Fotógrafos']::text[],
  'Diciembre a Abril',
  'Conducción diurna para disfrutar del paisaje entre ciénaga y mar',
  'Gran Malecón del Río, Barranquilla',
  ARRAY['Ruta por carretera con paradas intermedias', 'Guía de paradores gastronómicos']::text[],
  ARRAY['Alquiler de vehículo / peajes', 'Paseo en lancha en Ciénaga Grande']::text[],
  ARRAY['Parar a desayunar arepa de huevo tradicional en paradores de carretera']::text[],
  ARRAY['Gafas de sol', 'Ropa fresca', 'Efectivo para peajes']::text[],
  ARRAY['Respetar los límites de velocidad en la Vía Parque Isla de Salamanca']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '678f9faf-3dcb-c6bd-b4e1-7220b6f8bd64',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  1,
  'Día 1: Barranquilla: Gran Malecón del Río y Caimán del Río',
  'Paseo junto al río Magdalena y monumento Ventana al Mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a773f339-8ff8-07b1-1566-88e3b43fd3a6',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  '678f9faf-3dcb-c6bd-b4e1-7220b6f8bd64',
  1,
  1,
  'Gran Malecón del Río y Ventana al Mundo',
  11.0191,
  -74.8007,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Paseo peatonal de 5 km junto al río Magdalena con el mercado gastronómico Caimán del Río y el monumento de vidrio de 47 metros.',
  ARRAY['Caminar junto al río Magdalena (Gratis)', 'Cena de comida típica caribeña en Caimán del Río ($25.000 - $45.000 COP)']::text[],
  ARRAY['La brisa del río es más agradable a partir de las 5:00 PM']::text[],
  ARRAY['La Ventana al Mundo fue construida con más de 2.000 m² de vidrio laminado de colores']::text[],
  '{"address":"Gran Malecón, Barranquilla","priceRange":"$ - Libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Caminar junto al río Magdalena (Gratis)","Cena de comida típica caribeña en Caimán del Río ($25.000 - $45.000 COP)"],"datos_curiosos":["La Ventana al Mundo fue construida con más de 2.000 m² de vidrio laminado de colores"],"consejos":["La brisa del río es más agradable a partir de las 5:00 PM"],"location_info":{"address":"Gran Malecón, Barranquilla","priceRange":"$ - Libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f71b620d-de49-a10f-14d2-cbfc2391afdb',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  2,
  'Día 2: Puente Pumarejo y Vía Parque Isla de Salamanca',
  'Cruce del gran río y reserva de manglares y aves.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3c460de1-b27f-a5aa-6bb2-c6b324ac5ac8',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  'f71b620d-de49-a10f-14d2-cbfc2391afdb',
  2,
  2,
  'Nuevo Puente Pumarejo y Parque Isla de Salamanca',
  10.958,
  -74.748,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los puentes atirantados más anchos del mundo que cruza el río Magdalena hacia el santuario de flora y fauna.',
  ARRAY['Cruce del puente panorámico (Gratis)', 'Senderismo en pasarelas de madera en Isla de Salamanca ($15.000 COP)']::text[],
  ARRAY['Parar a comprar cocadas y dulces tradicionales a la orilla de la carretera']::text[],
  ARRAY['El puente Pumarejo tiene 45 metros de gálibo para permitir el paso de barcos de gran calado']::text[],
  '{"address":"Vía Barranquilla - Santa Marta","priceRange":"$ - Peaje ~$16.000 COP","dia":2,"day":2}'::jsonb,
  150,
  '{"dia":2,"day":2,"activities":["Cruce del puente panorámico (Gratis)","Senderismo en pasarelas de madera en Isla de Salamanca ($15.000 COP)"],"datos_curiosos":["El puente Pumarejo tiene 45 metros de gálibo para permitir el paso de barcos de gran calado"],"consejos":["Parar a comprar cocadas y dulces tradicionales a la orilla de la carretera"],"location_info":{"address":"Vía Barranquilla - Santa Marta","priceRange":"$ - Peaje ~$16.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '040374c8-fd13-d742-6ae9-843e73adf66d',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  3,
  'Día 3: Ciénaga Patrimonial: Arquitectura Bananera y Realismo Mágico',
  'La plaza de la Masacre de las Bananeras que inspiró a García Márquez.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3737ca1f-a7d6-308b-a140-b3a22dad1294',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  '040374c8-fd13-d742-6ae9-843e73adf66d',
  3,
  3,
  'Plaza del Centenario y Ciénaga Colonial',
  11.006,
  -74.25,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo patrimonio con palacetes republicanos de la bonanza bananera y el templete neoclásico.',
  ARRAY['Fotografiar las casonas de estilo masónico y republicano (Gratis)', 'Almorzar pescado lebranche con patacón frente al mar en Costa Verde ($25.000 COP)']::text[],
  ARRAY['Ciénaga es el epicentro histórico de *Cien años de soledad*']::text[],
  ARRAY['El templete de la plaza fue diseñado imitando el estilo de los templos de la Roma clásica']::text[],
  '{"address":"Plaza del Centenario, Ciénaga","priceRange":"$ - Libre","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Fotografiar las casonas de estilo masónico y republicano (Gratis)","Almorzar pescado lebranche con patacón frente al mar en Costa Verde ($25.000 COP)"],"datos_curiosos":["El templete de la plaza fue diseñado imitando el estilo de los templos de la Roma clásica"],"consejos":["Ciénaga es el epicentro histórico de *Cien años de soledad*"],"location_info":{"address":"Plaza del Centenario, Ciénaga","priceRange":"$ - Libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7715f2e6-03ce-b06c-bcd6-c21864288ca1',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  4,
  'Día 4: Llegada a Santa Marta: Bahía, Marina y Despedida',
  'Fin de la ruta costera en la ciudad hispánica más antigua.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6f66abb4-08bc-d146-8513-66599493281b',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  '7715f2e6-03ce-b06c-bcd6-c21864288ca1',
  4,
  4,
  'Marina Internacional y Malecón de Santa Marta',
  11.2435,
  -74.2144,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El muelle de veleros y yates con restaurantes sobre el mar y vista al morro de Santa Marta.',
  ARRAY['Atardecer en la Marina con jugo de corozo ($12.000 COP)', 'Cena en el Parque de los Novios ($35.000 COP)']::text[],
  ARRAY['Excelente punto final para continuar hacia Tayrona']::text[],
  ARRAY['Santa Marta fue fundada por Rodrigo de Bastidas en 1525']::text[],
  '{"address":"Carrera 1, Santa Marta","priceRange":"$$ - Moderado","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Atardecer en la Marina con jugo de corozo ($12.000 COP)","Cena en el Parque de los Novios ($35.000 COP)"],"datos_curiosos":["Santa Marta fue fundada por Rodrigo de Bastidas en 1525"],"consejos":["Excelente punto final para continuar hacia Tayrona"],"location_info":{"address":"Carrera 1, Santa Marta","priceRange":"$$ - Moderado","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '998b3713-bdb3-67c4-6f5d-5d497795e837',
  'efa7d07b-70de-b049-76ab-070f09c80b84',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Travesía Andina: De Medellín a Bogotá por la Ruta de los Pueblos (Medellín, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-travesia-medellin-bogota-pueblos-5d',
  'Travesía Andina: De Medellín a Bogotá por la Ruta de los Pueblos',
  'Colombia',
  'Medellín',
  'cultural',
  'Road trip de 5 días cruzando la cordillera y el río Magdalena. Salida de Medellín hacia El Peñol y Guatapé, Cañón del Río Claro, la histórica ciudad de los puentes de Honda y la villa colonial de Guaduas hacia la sabana de Bogotá.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  420000,
  'moderate',
  'es',
  4.93,
  75,
  260,
  ARRAY['Medellín', 'Bogotá', 'Honda', 'Guaduas', 'Ruta Pueblos', 'Road Trip', 'city_to_city']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":380000,"estimatedPerPersonMax":820000}'::jsonb,
  ARRAY['Amantes de los viajes por carretera', 'Viajeros culturales']::text[],
  'Diciembre a Marzo y Julio a Agosto',
  'Jornadas de conducción matutinas',
  'Medellín / Salida Autopista Medellín - Bogotá',
  ARRAY['Ruta carretera detallada', 'Paradas patrimoniales intermedias']::text[],
  ARRAY['Vehículo y peajes', 'Alojamiento en ruta']::text[],
  ARRAY['Revisar frenos antes de descender la cordillera hacia el río Magdalena']::text[],
  ARRAY['Ropa para clima caliente (Honda 34°C) y clima frío (Bogotá 12°C)']::text[],
  ARRAY['Conducir con precaución en curvas de montaña']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'eb419867-4037-6271-93b7-8c20b36ba316',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  1,
  'Día 1: Medellín a Guatapé y la Piedra del Peñol',
  'Monolito de 740 escalones y pueblo de zócalos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '14b4964d-44ad-84e0-640c-d76507c36dcb',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  'eb419867-4037-6271-93b7-8c20b36ba316',
  1,
  1,
  'Piedra del Peñol y Guatapé',
  6.2206,
  -75.1785,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Ascenso a la gran roca y almuerzo paisa en el pueblo de los zócalos.',
  ARRAY['Subida a la piedra ($25.000 COP)', 'Almuerzo de trucha ($35.000 COP)']::text[],
  ARRAY['Subir temprano antes del mediodía']::text[],
  ARRAY['La piedra tiene una hendidura natural por donde se encajó la escalera de hormigón']::text[],
  '{"address":"Guatapé, Antioquia","priceRange":"$$ - Moderado","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Subida a la piedra ($25.000 COP)","Almuerzo de trucha ($35.000 COP)"],"datos_curiosos":["La piedra tiene una hendidura natural por donde se encajó la escalera de hormigón"],"consejos":["Subir temprano antes del mediodía"],"location_info":{"address":"Guatapé, Antioquia","priceRange":"$$ - Moderado","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fe6af348-b1d5-027d-31d1-9c1f6ae452f9',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  2,
  'Día 2: Cañón del Río Claro: El Paraíso de Mármol',
  'Baño en aguas cristalinas sobre roca de mármol.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4095148e-80c0-791c-8fb7-d2a3cb60e547',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  'fe6af348-b1d5-027d-31d1-9c1f6ae452f9',
  2,
  2,
  'Reserva Natural Río Claro',
  5.898,
  -74.858,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Parada en el cañón de mármol blanco para descansar y nadar.',
  ARRAY['Entrada a la reserva ($25.000 COP)', 'Baño en el río (Gratis)']::text[],
  ARRAY['Ideal para pernoctar en las cabañas ecológicas sobre el cañón']::text[],
  ARRAY['En el cañón habitan monos tití gris endémicos de Colombia']::text[],
  '{"address":"Autopista Km 152","priceRange":"$ - Entrada reserva","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Entrada a la reserva ($25.000 COP)","Baño en el río (Gratis)"],"datos_curiosos":["En el cañón habitan monos tití gris endémicos de Colombia"],"consejos":["Ideal para pernoctar en las cabañas ecológicas sobre el cañón"],"location_info":{"address":"Autopista Km 152","priceRange":"$ - Entrada reserva","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2489d217-d598-e618-8d42-12ac3ce54d42',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  3,
  'Día 3: Honda: La Ciudad de los Puentes sobre el Río Magdalena',
  'Pueblo patrimonio fluvial colonial con más de 40 puentes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ceca20b8-c561-c77f-3dbb-ff6696d88f40',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  '2489d217-d598-e618-8d42-12ac3ce54d42',
  3,
  3,
  'Puente Navarro y Calle de las Trampas en Honda',
  5.205,
  -74.741,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Principal puerto fluvial del Virreinato. Destaca el Puente Navarro de hierro de 1898 y la empinada Calle de las Trampas de piedra.',
  ARRAY['Cruzar el Puente Navarro histórico sobre el río Magdalena ($2.000 COP)', 'Visitar el Museo del Río Magdalena ($6.000 COP)', 'Probar viudo de pescado bocachico ($25.000 COP)']::text[],
  ARRAY['Honda es calurosa (34°C); llevar ropa muy fresca e hidratación']::text[],
  ARRAY['El Puente Navarro es el puente metálico colgante más antiguo de toda América del Sur']::text[],
  '{"address":"Centro Histórico de Honda, Tolima","priceRange":"$ - Libre","dia":3,"day":3}'::jsonb,
  210,
  '{"dia":3,"day":3,"activities":["Cruzar el Puente Navarro histórico sobre el río Magdalena ($2.000 COP)","Visitar el Museo del Río Magdalena ($6.000 COP)","Probar viudo de pescado bocachico ($25.000 COP)"],"datos_curiosos":["El Puente Navarro es el puente metálico colgante más antiguo de toda América del Sur"],"consejos":["Honda es calurosa (34°C); llevar ropa muy fresca e hidratación"],"location_info":{"address":"Centro Histórico de Honda, Tolima","priceRange":"$ - Libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f26c0edd-7125-548c-60ce-84ccb47071da',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  4,
  'Día 4: Guaduas Colonial y la Ruta de Policarpa Salavarrieta',
  'Pueblo de la heroína de la independencia y Camino Real.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '72e89ddd-c67f-8ef0-d9ff-aca1d8d5b0c8',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  'f26c0edd-7125-548c-60ce-84ccb47071da',
  4,
  4,
  'Casa Museo Policarpa Salavarrieta y Mirador Piedra Capira',
  5.068,
  -74.596,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Caserío colonial de bahareque donde nació la heroína "La Pola". El mirador de Piedra Capira ofrece vista a los tres nevados del Ruiz, Tolima y Santa Isabel.',
  ARRAY['Visitar la casa natal de La Pola (Entrada: $5.000 COP)', 'Mirador de Piedra Capira sobre el valle del Magdalena (Gratis)', 'Probar pan de yuca recién horneado con chocolate caliente ($6.000 COP)']::text[],
  ARRAY['El clima en Guaduas es templado y primaveral (24°C)']::text[],
  ARRAY['Por este Camino Real pasó la Real Expedición Botánica de José Celestino Mutis en 1783']::text[],
  '{"address":"Plaza Principal, Guaduas, Cundinamarca","priceRange":"$ - Entrada museo","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Visitar la casa natal de La Pola (Entrada: $5.000 COP)","Mirador de Piedra Capira sobre el valle del Magdalena (Gratis)","Probar pan de yuca recién horneado con chocolate caliente ($6.000 COP)"],"datos_curiosos":["Por este Camino Real pasó la Real Expedición Botánica de José Celestino Mutis en 1783"],"consejos":["El clima en Guaduas es templado y primaveral (24°C)"],"location_info":{"address":"Plaza Principal, Guaduas, Cundinamarca","priceRange":"$ - Entrada museo","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e46a4e3a-5bef-b3fb-e0d2-6cfc0c9fdb16',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  5,
  'Día 5: Ascenso a la Sabana y Llegada a Bogotá',
  'Subida por el Alto del Trigo y fin del road trip en la capital.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ce0a358f-7227-dcd0-4b6e-e06dd305caa9',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  'e46a4e3a-5bef-b3fb-e0d2-6cfc0c9fdb16',
  5,
  5,
  'Llegada a Bogotá por la Calle 80',
  4.711,
  -74.113,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Ascenso desde el calor del valle hasta los 2.600 metros de la sabana de Bogotá.',
  ARRAY['Cena de celebración de fin de ruta en la Zona G de Bogotá ($50.000 - $90.000 COP)']::text[],
  ARRAY['Entrar a Bogotá antes de las 4:00 PM para evitar congestiones de tráfico']::text[],
  ARRAY['La carretera asciende más de 2.000 metros de desnivel en tan solo 60 kilómetros']::text[],
  '{"address":"Bogotá D.C.","priceRange":"$$ - Cena final","dia":5,"day":5}'::jsonb,
  120,
  '{"dia":5,"day":5,"activities":["Cena de celebración de fin de ruta en la Zona G de Bogotá ($50.000 - $90.000 COP)"],"datos_curiosos":["La carretera asciende más de 2.000 metros de desnivel en tan solo 60 kilómetros"],"consejos":["Entrar a Bogotá antes de las 4:00 PM para evitar congestiones de tráfico"],"location_info":{"address":"Bogotá D.C.","priceRange":"$$ - Cena final","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'd8cd9fe9-f4ae-b244-f1af-45fc66c59d77',
  '090ef616-a222-ccf5-51d5-e1e4024c7a72',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Pacific Coast Highway: De San Francisco a Los Ángeles por la Highway 1 (San Francisco, Estados Unidos)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-pacific-coast-highway-california-7d',
  'Pacific Coast Highway: De San Francisco a Los Ángeles por la Highway 1',
  'Estados Unidos',
  'San Francisco',
  'sports',
  'El road trip costero más famoso del mundo durante 7 días. El puente Golden Gate en San Francisco, los cipreses de Monterey y Carmel-by-the-Sea, los acantilados salvajes de Big Sur con el Bixby Creek Bridge, elefantes marinos y el muelle de Santa Mónica en Los Ángeles.',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80']::text[],
  10080,
  750000,
  'easy',
  'es',
  4.98,
  210,
  720,
  ARRAY['Highway 1', 'San Francisco', 'Big Sur', 'Los Ángeles', 'California', 'Road Trip', 'Pacific Coast']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":850,"estimatedPerPersonMax":1900}'::jsonb,
  ARRAY['Amantes de los road trips', 'Parejas', 'Fotógrafos de paisajes']::text[],
  'Mayo a Octubre',
  'Conducción relajada de norte a sur para circular por el carril junto al océano',
  'Golden Gate Bridge / Presidio, San Francisco',
  ARRAY['Ruta GPS completa de la Highway 1', 'Puntos panorámicos de parada en Big Sur']::text[],
  ARRAY['Alquiler de coche convertible o SUV', 'Gasolina y peajes', 'Alojamiento en ruta']::text[],
  ARRAY['Conducir en sentido Norte a Sur (de SF a LA) para circular por el lado del océano Pacífico con accesos directos a los miradores']::text[],
  ARRAY['Chaqueta cortavientos', 'Gafas de sol polarizadas', 'Música para carretera']::text[],
  ARRAY['No acampar en zonas no autorizadas de Big Sur']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '38f9c4c3-30e7-0b83-abc3-1a77cd41b2ed',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  1,
  'Día 1: San Francisco: Golden Gate y Fisherman''s Wharf',
  'El puente rojo sobre la bahía y leones marinos en el Muelle 39.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '45bdbbaf-9dca-7c2d-2bfb-fbd4384718f8',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '38f9c4c3-30e7-0b83-abc3-1a77cd41b2ed',
  1,
  1,
  'Golden Gate Bridge y Pier 39',
  37.8199,
  -122.4783,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'El puente colgante de color naranja internacional inaugurado en 1937 y los leones marinos del Pier 39.',
  ARRAY['Cruzar el Golden Gate caminando o en bicicleta (Gratis peatonal / peaje coche hacia el sur: $9.75 USD)', 'Sopa Clam Chowder en pan de masa madre Boudin ($14 USD)']::text[],
  ARRAY['Abrigarse; la niebla marina *Karl the Fog* suele bajar al atardecer']::text[],
  ARRAY['Su color oficial es "International Orange", elegido porque resaltaba a través de la niebla']::text[],
  '{"address":"Golden Gate Bridge, San Francisco","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Cruzar el Golden Gate caminando o en bicicleta (Gratis peatonal / peaje coche hacia el sur: $9.75 USD)","Sopa Clam Chowder en pan de masa madre Boudin ($14 USD)"],"datos_curiosos":["Su color oficial es \"International Orange\", elegido porque resaltaba a través de la niebla"],"consejos":["Abrigarse; la niebla marina *Karl the Fog* suele bajar al atardecer"],"location_info":{"address":"Golden Gate Bridge, San Francisco","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '00f1b140-40b3-daa8-845c-49c4b4b4879f',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  2,
  'Día 2: Monterey y Carmel-by-the-Sea',
  '17-Mile Drive, cipreses solitarios y galerías de arte.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b90c930e-69f5-6a8d-ed9e-28d531bd7713',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '00f1b140-40b3-daa8-845c-49c4b4b4879f',
  2,
  2,
  '17-Mile Drive y The Lone Cypress',
  36.568,
  -121.965,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Carretera panorámica privada entre bosques de cipreses y campos de golf de Pebble Beach frente al océano.',
  ARRAY['Paseo por 17-Mile Drive (Peaje coche: $11.75 USD)', 'Caminar por las casas de cuento de hadas de Carmel-by-the-Sea (Gratis)']::text[],
  ARRAY['Carmel no tiene parquímetros ni números de calle formales']::text[],
  ARRAY['El actor Clint Eastwood fue alcalde de Carmel-by-the-Sea en los años 80']::text[],
  '{"address":"Pebble Beach / Carmel, CA","priceRange":"$ - Peaje $11.75","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Paseo por 17-Mile Drive (Peaje coche: $11.75 USD)","Caminar por las casas de cuento de hadas de Carmel-by-the-Sea (Gratis)"],"datos_curiosos":["El actor Clint Eastwood fue alcalde de Carmel-by-the-Sea en los años 80"],"consejos":["Carmel no tiene parquímetros ni números de calle formales"],"location_info":{"address":"Pebble Beach / Carmel, CA","priceRange":"$ - Peaje $11.75","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8489c4c4-a1af-d7ce-65b5-e010c5992102',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  3,
  'Día 3: Big Sur: El Icónico Puente Bixby Creek y Acantilados',
  'El tramo costero más salvaje e impresionante de Norteamérica.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ad6845da-c626-1424-c48d-7b417b07db96',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '8489c4c4-a1af-d7ce-65b5-e010c5992102',
  3,
  3,
  'Bixby Creek Bridge y McWay Falls',
  36.3714,
  -121.9018,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'El puente de arco de hormigón de 1932 sobre un abismo de 80 metros. Más al sur, la cascada McWay que cae directamente sobre la arena virgen de una cala.',
  ARRAY['Foto clásica del puente Bixby desde el mirador norte (Gratis)', 'Sendero hacia el mirador de la cascada McWay Falls en Julia Pfeiffer Burns State Park ($10 USD aparcamiento)']::text[],
  ARRAY['En Big Sur no hay cobertura de telefonía móvil durante 50 km; descargar mapas offline previamente']::text[],
  ARRAY['El puente Bixby es uno de los puentes de arco de un solo tramo de hormigón más fotografiados del planeta']::text[],
  '{"address":"Highway 1, Big Sur, CA","priceRange":"$ - Mirador libre","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Foto clásica del puente Bixby desde el mirador norte (Gratis)","Sendero hacia el mirador de la cascada McWay Falls en Julia Pfeiffer Burns State Park ($10 USD aparcamiento)"],"datos_curiosos":["El puente Bixby es uno de los puentes de arco de un solo tramo de hormigón más fotografiados del planeta"],"consejos":["En Big Sur no hay cobertura de telefonía móvil durante 50 km; descargar mapas offline previamente"],"location_info":{"address":"Highway 1, Big Sur, CA","priceRange":"$ - Mirador libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2fe897a2-20f9-eaa0-9335-dd7b68f37465',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  4,
  'Día 4: Elefantes Marinos de San Simeon y Castillo Hearst',
  'Colonia salvaje de mamíferos marinos gigantes y palacio de la prensa.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0ff6d8cd-d3c4-95f5-4191-a923d18ad64d',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '2fe897a2-20f9-eaa0-9335-dd7b68f37465',
  4,
  4,
  'Elephant Seal Vista Point y Hearst Castle',
  35.663,
  -121.257,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Pasarelas sobre la playa donde reposan miles de elefantes marinos de hasta 2 toneladas. En la colina se alza la mansión de 165 habitaciones de William Randolph Hearst.',
  ARRAY['Avistamiento gratuito de elefantes marinos en San Simeon (Gratis)', 'Tour por el Castillo Hearst y su piscina romana de mosaicos de oro ($30 USD)']::text[],
  ARRAY['Llevar prismáticos para ver las crías y peleas de machos en la playa']::text[],
  ARRAY['Hearst inspiró el personaje de Charles Foster Kane en la película *Ciudadano Kane* de Orson Welles']::text[],
  '{"address":"San Simeon, CA 93452","priceRange":"$$ - Tour castillo","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Avistamiento gratuito de elefantes marinos en San Simeon (Gratis)","Tour por el Castillo Hearst y su piscina romana de mosaicos de oro ($30 USD)"],"datos_curiosos":["Hearst inspiró el personaje de Charles Foster Kane en la película *Ciudadano Kane* de Orson Welles"],"consejos":["Llevar prismáticos para ver las crías y peleas de machos en la playa"],"location_info":{"address":"San Simeon, CA 93452","priceRange":"$$ - Tour castillo","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '07220275-4380-bcea-9aad-7e2a711d0410',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  5,
  'Día 5: Santa Bárbara: La Riviera Americana',
  'Arquitectura de tejas rojas y misión colonial española.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cdbd3d21-4d98-1dd9-6860-55c44987ff4e',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '07220275-4380-bcea-9aad-7e2a711d0410',
  5,
  5,
  'Misión de Santa Bárbara y Muelle Stearns Wharf',
  34.438,
  -119.713,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Elegante ciudad de estilo colonial español con palmeras, edificios de adobe encalado y el histórico muelle de madera Stearns Wharf de 1872.',
  ARRAY['Visitar la Misión de Santa Bárbara de 1786 ($15 USD)', 'Paseo por el muelle de madera Stearns Wharf comiendo mariscos frescos ($25 - $40 USD)']::text[],
  ARRAY['Subir a la torre del Palacio de Justicia (Courthouse) para vista panorámica gratuita de los tejados rojos y el mar']::text[],
  ARRAY['Tras el terremoto de 1925, la ciudad aprobó una ley que obligó a que toda nueva construcción tuviera estilo colonial español']::text[],
  '{"address":"Santa Barbara, CA","priceRange":"$$ - Moderado","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Visitar la Misión de Santa Bárbara de 1786 ($15 USD)","Paseo por el muelle de madera Stearns Wharf comiendo mariscos frescos ($25 - $40 USD)"],"datos_curiosos":["Tras el terremoto de 1925, la ciudad aprobó una ley que obligó a que toda nueva construcción tuviera estilo colonial español"],"consejos":["Subir a la torre del Palacio de Justicia (Courthouse) para vista panorámica gratuita de los tejados rojos y el mar"],"location_info":{"address":"Santa Barbara, CA","priceRange":"$$ - Moderado","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e4e10e2a-fab3-1986-b989-e37002d69fc5',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  6,
  'Día 6: Malibú y el Fin de la Ruta en Santa Mónica',
  'Playas de surferos y el cartel del final de la histórica Ruta 66.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5312336b-b80a-e019-a7ce-b49b2a84e3ce',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  'e4e10e2a-fab3-1986-b989-e37002d69fc5',
  6,
  6,
  'Muelle de Santa Mónica (Santa Monica Pier) y Malibú',
  34.0099,
  -118.496,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'El célebre muelle de madera sobre el Pacífico con su parque de atracciones retro y el cartel oficial que marca el final de la mítica Ruta 66.',
  ARRAY['Foto en el cartel "End of the Trail" de la Ruta 66 en el muelle (Gratis)', 'Pasear en bicicleta por el sendero costero hasta Venice Beach ($15 USD alquiler)', 'Subir a la noria solar de Pacific Park en el muelle ($12 USD)']::text[],
  ARRAY['El atardecer en el muelle de Santa Mónica con las luces de la noria es una postal californiana inolvidable']::text[],
  ARRAY['La noria de Pacific Park es la única noria del mundo que funciona íntegramente con energía solar']::text[],
  '{"address":"200 Santa Monica Pier, Santa Monica","priceRange":"$ - Acceso muelle libre","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Foto en el cartel \"End of the Trail\" de la Ruta 66 en el muelle (Gratis)","Pasear en bicicleta por el sendero costero hasta Venice Beach ($15 USD alquiler)","Subir a la noria solar de Pacific Park en el muelle ($12 USD)"],"datos_curiosos":["La noria de Pacific Park es la única noria del mundo que funciona íntegramente con energía solar"],"consejos":["El atardecer en el muelle de Santa Mónica con las luces de la noria es una postal californiana inolvidable"],"location_info":{"address":"200 Santa Monica Pier, Santa Monica","priceRange":"$ - Acceso muelle libre","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b2622431-f67a-e89a-5ccd-c1285bdb528e',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  7,
  'Día 7: Los Ángeles: Hollywood, Beverly Hills y Despedida',
  'El Paseo de la Fama y traslado al aeropuerto LAX.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8c4ed6d7-9355-032e-f294-86c4f240e78c',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  'b2622431-f67a-e89a-5ccd-c1285bdb528e',
  7,
  7,
  'Hollywood Walk of Fame y Rodeo Drive',
  34.1016,
  -118.3268,
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80']::text[],
  'Las estrellas de las celebridades en el pavimento de Hollywood Boulevard y las boutiques de lujo de Beverly Hills antes de volar desde LAX.',
  ARRAY['Buscar la estrella de sus artistas favoritos en el Paseo de la Fama (Gratis)', 'Ver las huellas de manos en cemento en el TCL Chinese Theatre (Gratis)', 'Hamburguesa clásica en In-N-Out Burger cerca del aeropuerto ($8 USD)']::text[],
  ARRAY['Calcular al menos 1 hora y media para el trayecto hacia el aeropuerto LAX debido al tráfico de Los Ángeles']::text[],
  ARRAY['El Paseo de la Fama tiene más de 2.700 estrellas de bronce y terrazo rosa']::text[],
  '{"address":"Hollywood Blvd, Los Angeles, CA","priceRange":"$ - Libre","dia":7,"day":7}'::jsonb,
  180,
  '{"dia":7,"day":7,"activities":["Buscar la estrella de sus artistas favoritos en el Paseo de la Fama (Gratis)","Ver las huellas de manos en cemento en el TCL Chinese Theatre (Gratis)","Hamburguesa clásica en In-N-Out Burger cerca del aeropuerto ($8 USD)"],"datos_curiosos":["El Paseo de la Fama tiene más de 2.700 estrellas de bronce y terrazo rosa"],"consejos":["Calcular al menos 1 hora y media para el trayecto hacia el aeropuerto LAX debido al tráfico de Los Ángeles"],"location_info":{"address":"Hollywood Blvd, Los Angeles, CA","priceRange":"$ - Libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '9069a4db-34be-eb44-4d13-f77f08e4b154',
  '17bf5612-6e9f-e5e5-f148-a256e6d1fe66',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Ruta de los Pueblos Blancos: De Sevilla a Ronda y el Mediterráneo de Málaga (Sevilla, España)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-pueblos-blancos-sevilla-ronda-malaga-5d',
  'Ruta de los Pueblos Blancos: De Sevilla a Ronda y el Mediterráneo de Málaga',
  'España',
  'Sevilla',
  'cultural',
  'Road trip andaluz de 5 días cruzando la Sierra de Grazalema. Desde la Plaza de España de Sevilla hasta los pueblos encalados de Arcos de la Frontera, el desfiladero vertiginoso del Tajo de Ronda y las playas de Málaga.',
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  220000,
  'moderate',
  'es',
  4.96,
  130,
  450,
  ARRAY['Pueblos Blancos', 'Sevilla', 'Ronda', 'Málaga', 'Andalucía', 'Road Trip', 'El Tajo']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":350,"estimatedPerPersonMax":780}'::jsonb,
  ARRAY['Amantes de los paisajes pintorescos', 'Parejas', 'Viajeros gastronómicos']::text[],
  'Marzo a Junio y Septiembre a Noviembre',
  'Conducción escénica por puertos de montaña por la mañana',
  'Plaza de España, Sevilla',
  ARRAY['Ruta completa de la Sierra de Cádiz y Ronda', 'Miradores del Tajo de Ronda']::text[],
  ARRAY['Alquiler de coche / combustible', 'Entradas monumentales']::text[],
  ARRAY['En los pueblos blancos estacionar en los aparcamientos exteriores; las calles del casco antiguo son extremadamente estrechas']::text[],
  ARRAY['Calzado para caminar en empedrado', 'Gafas de sol']::text[],
  ARRAY['Conducir con precaución en curvas de sierra']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd396710c-eac2-a600-9edd-98b890e5c526',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  1,
  'Día 1: Sevilla Monumental y Salida hacia Arcos de la Frontera',
  'La catedral de Sevilla y llegada a la puerta de los pueblos blancos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ece03376-4a28-a0f4-e50e-663b7d626156',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  'd396710c-eac2-a600-9edd-98b890e5c526',
  1,
  1,
  'Arcos de la Frontera sobre la Peña',
  36.748,
  -5.808,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo encalado de blanco encaramado a un vertiginoso tajo de arenisca sobre el río Guadalete.',
  ARRAY['Caminar por las callejuelas encaladas con cal viva (Gratis)', 'Asomarse al Balcón del Coño en la Plaza del Cabildo (Gratis)']::text[],
  ARRAY['El mirador se llama popularmente así por la exclamación que sueltan todos los que miran al abismo']::text[],
  ARRAY['Las casas se encalan de blanco cada primavera para reflejar la radiación solar y mantener el interior fresco']::text[],
  '{"address":"Plaza del Cabildo, Arcos de la Frontera","priceRange":"$ - Libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Caminar por las callejuelas encaladas con cal viva (Gratis)","Asomarse al Balcón del Coño en la Plaza del Cabildo (Gratis)"],"datos_curiosos":["Las casas se encalan de blanco cada primavera para reflejar la radiación solar y mantener el interior fresco"],"consejos":["El mirador se llama popularmente así por la exclamación que sueltan todos los que miran al abismo"],"location_info":{"address":"Plaza del Cabildo, Arcos de la Frontera","priceRange":"$ - Libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '006f99b3-d158-0c52-abc7-d11f4771dca6',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  2,
  'Día 2: Parque Natural Sierra de Grazalema y Zahara de la Sierra',
  'El embalse turquesa a los pies del castillo nazarí.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '73003dc1-ab34-8042-e597-e9e482acf10b',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '006f99b3-d158-0c52-abc7-d11f4771dca6',
  2,
  2,
  'Zahara de la Sierra y Mirador del Pinsapar',
  36.84,
  -5.39,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo coronado por una torre nazarí sobre un peñón que domina las aguas color turquesa del embalse de Zahara.',
  ARRAY['Subir a la Torre del Homenaje del castillo nazarí (€3.50)', 'Probar el queso Payoyo artesanal de cabra y oveja (€10 - €15)']::text[],
  ARRAY['La carretera cruza el Puerto de las Palomas a 1.357 metros con vistas espectaculares']::text[],
  ARRAY['Grazalema ostenta el índice pluviométrico más alto de toda la Península Ibérica']::text[],
  '{"address":"Zahara de la Sierra, Cádiz","priceRange":"$ - Entrada castillo","dia":2,"day":2}'::jsonb,
  210,
  '{"dia":2,"day":2,"activities":["Subir a la Torre del Homenaje del castillo nazarí (€3.50)","Probar el queso Payoyo artesanal de cabra y oveja (€10 - €15)"],"datos_curiosos":["Grazalema ostenta el índice pluviométrico más alto de toda la Península Ibérica"],"consejos":["La carretera cruza el Puerto de las Palomas a 1.357 metros con vistas espectaculares"],"location_info":{"address":"Zahara de la Sierra, Cádiz","priceRange":"$ - Entrada castillo","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '09782bf5-e6d2-ce81-32d0-261635b610bc',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  3,
  'Día 3: Setenil de las Bodegas: El Pueblo Bajo las Rocas',
  'Casas construidas dentro de cuevas naturales en el cañón.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '90543010-26ae-75f3-80f3-007e853051cc',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '09782bf5-e6d2-ce81-32d0-261635b610bc',
  3,
  3,
  'Calle Cuevas del Sol en Setenil de las Bodegas',
  36.864,
  -5.181,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Único en el mundo: los habitantes aprovecharon el saliente natural de la roca del cañón del río Trejo para construir las fachadas de sus casas bajo la piedra viva.',
  ARRAY['Caminar por las calles Cuevas del Sol y Cuevas de la Sombra bajo miles de toneladas de roca (Gratis)', 'Tapear sopa cortijera o chacinas ibéricas en las terrazas bajo la roca (€12 - €18)']::text[],
  ARRAY['En Cuevas del Sol da el sol todo el día; en Cuevas de la Sombra la roca cubre la calle como un túnel natural']::text[],
  ARRAY['El nombre "Setenil" proviene del latín *septem nihil* ("siete veces nada"), en alusión a los siete asedios que resistió antes de ser tomada por los Reyes Católicos']::text[],
  '{"address":"Calle Cuevas del Sol, Setenil","priceRange":"$ - Tapas","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Caminar por las calles Cuevas del Sol y Cuevas de la Sombra bajo miles de toneladas de roca (Gratis)","Tapear sopa cortijera o chacinas ibéricas en las terrazas bajo la roca (€12 - €18)"],"datos_curiosos":["El nombre \"Setenil\" proviene del latín *septem nihil* (\"siete veces nada\"), en alusión a los siete asedios que resistió antes de ser tomada por los Reyes Católicos"],"consejos":["En Cuevas del Sol da el sol todo el día; en Cuevas de la Sombra la roca cubre la calle como un túnel natural"],"location_info":{"address":"Calle Cuevas del Sol, Setenil","priceRange":"$ - Tapas","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7ef4ef85-1d96-0a97-6a87-4401ec9b4fcb',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  4,
  'Día 4: Ronda Monumental: El Puente Nuevo sobre el Tajo',
  'El abismo de 100 metros y la cuna de la tauromaquia moderna.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '888eaec4-e08e-ecaf-7d12-a5af3609498c',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '7ef4ef85-1d96-0a97-6a87-4401ec9b4fcb',
  4,
  4,
  'Puente Nuevo y Tajo de Ronda',
  36.7408,
  -5.166,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra maestra de ingeniería del siglo XVIII con 98 metros de altura que une la ciudad vieja con la moderna sobre la garganta del río Guadalevín.',
  ARRAY['Bajar por el sendero al fondo del Tajo para la foto clásica del puente desde abajo (Gratis)', 'Visitar la Plaza de Toros de la Real Maestranza de Ronda de 1785 (€9)', 'Cena con vistas al abismo en el Parador de Ronda (€35 - €50)']::text[],
  ARRAY['El mirador del puente al atardecer es una de las experiencias visuales más impactantes de España']::text[],
  ARRAY['Ernest Hemingway y Orson Welles se enamoraron de Ronda; las cenizas de Welles reposan en una finca de la localidad']::text[],
  '{"address":"Plaza de España, Ronda, Málaga","priceRange":"$ - Mirador libre","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Bajar por el sendero al fondo del Tajo para la foto clásica del puente desde abajo (Gratis)","Visitar la Plaza de Toros de la Real Maestranza de Ronda de 1785 (€9)","Cena con vistas al abismo en el Parador de Ronda (€35 - €50)"],"datos_curiosos":["Ernest Hemingway y Orson Welles se enamoraron de Ronda; las cenizas de Welles reposan en una finca de la localidad"],"consejos":["El mirador del puente al atardecer es una de las experiencias visuales más impactantes de España"],"location_info":{"address":"Plaza de España, Ronda, Málaga","priceRange":"$ - Mirador libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '71cb38ea-b8e9-2bdd-2115-4c343e56028f',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  5,
  'Día 5: Llegada a Málaga: La Alcazaba y Museo Picasso',
  'Descenso al mar Mediterráneo, espetos de sardinas y despedida.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af09841b-a2c5-78cd-cb24-258c2c4a7980',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '71cb38ea-b8e9-2bdd-2115-4c343e56028f',
  5,
  5,
  'Alcazaba de Málaga y Teatro Romano',
  36.721,
  -4.416,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio fortaleza musulmán del siglo XI con vistas al puerto mediterráneo y el teatro romano a sus pies. A pocos pasos, el Museo Picasso.',
  ARRAY['Visitar la Alcazaba y sus jardines de acequias (€3.50 / gratis domingos tarde)', 'Comer espetos de sardinas asadas a la leña en una barca en la playa de Pedregalejo (€6 - €10)', 'Paseo por el Muelle Uno antes del traslado al aeropuerto de Málaga (€3 cercanías C1)']::text[],
  ARRAY['Málaga cuenta con tren de cercanías directo que llega a la terminal del aeropuerto en 12 minutos']::text[],
  ARRAY['Pablo Picasso nació en Málaga en 1881 en la casona de la Plaza de la Merced']::text[],
  '{"address":"Calle Alcazabilla 2, Málaga","priceRange":"$ - Entrada €3.50","dia":5,"day":5}'::jsonb,
  210,
  '{"dia":5,"day":5,"activities":["Visitar la Alcazaba y sus jardines de acequias (€3.50 / gratis domingos tarde)","Comer espetos de sardinas asadas a la leña en una barca en la playa de Pedregalejo (€6 - €10)","Paseo por el Muelle Uno antes del traslado al aeropuerto de Málaga (€3 cercanías C1)"],"datos_curiosos":["Pablo Picasso nació en Málaga en 1881 en la casona de la Plaza de la Merced"],"consejos":["Málaga cuenta con tren de cercanías directo que llega a la terminal del aeropuerto en 12 minutos"],"location_info":{"address":"Calle Alcazabilla 2, Málaga","priceRange":"$ - Entrada €3.50","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '64a13de5-2a2c-d1f4-1b2a-63c8fb458031',
  '248e225b-85b1-2532-96bb-ee4ee1d81b39',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Dúo Ibérico: De los Palacios de Madrid y Toledo a los Tranvías de Lisboa y Oporto (Madrid, España y Portugal)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-duo-iberico-espana-portugal-10d',
  'Dúo Ibérico: De los Palacios de Madrid y Toledo a los Tranvías de Lisboa y Oporto',
  'España y Portugal',
  'Madrid',
  'cultural',
  'Circuito internacional de 10 días por la Península Ibérica. Museos reales en Madrid, Toledo medieval, vuelo a Lisboa con su Torre de Belém y tranvía 28, los palacios de colores de Sintra y las bodegas de vino de ribera en Oporto.',
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80']::text[],
  14400,
  1150000,
  'moderate',
  'es',
  4.97,
  225,
  780,
  ARRAY['España', 'Portugal', 'Madrid', 'Toledo', 'Lisboa', 'Sintra', 'Oporto', 'international_multicity']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":800,"estimatedPerPersonMax":1700}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes de la historia ibérica y el vino']::text[],
  'Abril a Junio y Septiembre a Octubre',
  'Jornadas de monumentos y tardes de fado y gastronomía',
  'Puerta del Sol, Madrid',
  ARRAY['Ruta completa interconectada', 'Puntos clave de trenes y ferris']::text[],
  ARRAY['Vuelo Madrid - Lisboa', 'Tren Alfa Pendular Lisboa - Oporto']::text[],
  ARRAY['Comprar los pasteles de nata calientes en Pastéis de Belém de 1837']::text[],
  ARRAY['Calzado cómodo para empedrado portugués (*calçada portuguesa*)']::text[],
  ARRAY['Respetar normas de silencio en monasterios']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"international_multicity","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c6918ec7-347f-c2ff-bc50-3c98c153a3a9',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  1,
  'Día 1: Madrid de los Austrias y Museo del Prado',
  'Plaza Mayor y Las Meninas de Velázquez.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4954adb9-8f60-162d-c0b5-73651787e5c2',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  'c6918ec7-347f-c2ff-bc50-3c98c153a3a9',
  1,
  1,
  'Museo del Prado y Plaza Mayor',
  40.4138,
  -3.6921,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Las obras maestras del arte europeo en el Prado y el casco histórico madrileño.',
  ARRAY['Entrada al Prado (€15)', 'Tapas en la Plaza Mayor']::text[],
  ARRAY['Reservar horario online']::text[],
  ARRAY['El Prado cumplió dos siglos en 2019']::text[],
  '{"address":"Madrid","priceRange":"$$ - €15","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Entrada al Prado (€15)","Tapas en la Plaza Mayor"],"datos_curiosos":["El Prado cumplió dos siglos en 2019"],"consejos":["Reservar horario online"],"location_info":{"address":"Madrid","priceRange":"$$ - €15","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0668b007-4ac2-c16d-542c-10803baadeee',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  2,
  'Día 2: Toledo Imperial y Vuelo a Lisboa',
  'La ciudad de las tres culturas y llegada a Portugal.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a612db40-664d-d7a5-4e07-78b99ce944a9',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '0668b007-4ac2-c16d-542c-10803baadeee',
  2,
  2,
  'Catedral de Toledo y Llegada a Lisboa',
  39.8571,
  -4.0244,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Catedral gótica de Toledo y vuelo de 1 hora a Lisboa.',
  ARRAY['Visita catedral (€10)', 'Vuelo Madrid - Lisboa']::text[],
  ARRAY['El tren Avant tarda solo 33 minutos a Toledo']::text[],
  ARRAY['Portugal y España comparten el huso horario ibérico con 1 hora de diferencia']::text[],
  '{"address":"Toledo / Lisboa","priceRange":"$$ - Tren y vuelo","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Visita catedral (€10)","Vuelo Madrid - Lisboa"],"datos_curiosos":["Portugal y España comparten el huso horario ibérico con 1 hora de diferencia"],"consejos":["El tren Avant tarda solo 33 minutos a Toledo"],"location_info":{"address":"Toledo / Lisboa","priceRange":"$$ - Tren y vuelo","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9761afcc-cf70-17aa-6e31-a9382d348389',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  3,
  'Día 3: Lisboa: Alfama, Tranvía 28 y Miradores',
  'El barrio morisco del Fado y las cuestas históricas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0f42468b-ac78-fb82-b842-ac1a1e95163e',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '9761afcc-cf70-17aa-6e31-a9382d348389',
  3,
  3,
  'Barrio de Alfama y Mirador de Santa Luzia',
  38.7118,
  -9.1306,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Calles laberínticas medievales con azulejos, ropa tendida y sonido de guitarras de fado.',
  ARRAY['Paseo en el histórico tranvía 28 amarillo (€3)', 'Mirador de Santa Luzia sobre el río Tajo (Gratis)', 'Cena con espectáculo de fado en vivo (€25 - €40)']::text[],
  ARRAY['Subir al tranvía 28 a primera hora en Martim Moniz para conseguir asiento']::text[],
  ARRAY['Alfama fue el único barrio de Lisboa que sobrevivió casi intacto al gran terremoto de 1755']::text[],
  '{"address":"Alfama, Lisboa","priceRange":"$ - Libre","dia":3,"day":3}'::jsonb,
  210,
  '{"dia":3,"day":3,"activities":["Paseo en el histórico tranvía 28 amarillo (€3)","Mirador de Santa Luzia sobre el río Tajo (Gratis)","Cena con espectáculo de fado en vivo (€25 - €40)"],"datos_curiosos":["Alfama fue el único barrio de Lisboa que sobrevivió casi intacto al gran terremoto de 1755"],"consejos":["Subir al tranvía 28 a primera hora en Martim Moniz para conseguir asiento"],"location_info":{"address":"Alfama, Lisboa","priceRange":"$ - Libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e1575006-e802-022f-a993-3d67019b53cd',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  4,
  'Día 4: Belém: Monasterio de los Jerónimos y Torre de Belém',
  'Arquitectura manuelina de la era de los descubrimientos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '91e97a34-bf20-defe-b029-6bee7b6d2689',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  'e1575006-e802-022f-a993-3d67019b53cd',
  4,
  4,
  'Monasterio de los Jerónimos y Pastéis de Belém',
  38.6979,
  -9.2067,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Patrimonio de la Humanidad por la UNESCO. Claustro manuelino con motivos marineros y la tumba de Vasco da Gama.',
  ARRAY['Claustro de los Jerónimos (€10)', 'Pastel de nata caliente con canela en Pastéis de Belém (€1.40)', 'Torre de Belém sobre el río Tajo (€9)']::text[],
  ARRAY['Comprar la entrada combinada online']::text[],
  ARRAY['La receta secreta de los pasteles de Belém solo la conocen seis maestros pasteleros en todo el mundo']::text[],
  '{"address":"Praça do Império, Belém","priceRange":"$ - Entradas €10","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Claustro de los Jerónimos (€10)","Pastel de nata caliente con canela en Pastéis de Belém (€1.40)","Torre de Belém sobre el río Tajo (€9)"],"datos_curiosos":["La receta secreta de los pasteles de Belém solo la conocen seis maestros pasteleros en todo el mundo"],"consejos":["Comprar la entrada combinada online"],"location_info":{"address":"Praça do Império, Belém","priceRange":"$ - Entradas €10","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3f1e3524-8536-4c2d-42a7-f81f666cc2ce',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  5,
  'Día 5: Sintra de Cuento: Palacio da Pena y Quinta da Regaleira',
  'Palacio de colores romántico y el Pozo Iniciático masónico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '63079026-6bba-53e5-df02-43ec29331a6c',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '3f1e3524-8536-4c2d-42a7-f81f666cc2ce',
  5,
  5,
  'Palacio Nacional da Pena y Quinta da Regaleira',
  38.7878,
  -9.3906,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio amarillo y rojo en la cima de la sierra de Sintra y los jardines esotéricos con pozos subterráneos de la Regaleira.',
  ARRAY['Entrada al Palacio da Pena (€14)', 'Descenso por la escalera de caracol del Pozo Iniciático de Regaleira (€12)']::text[],
  ARRAY['Tren de cercanías directo desde la estación Rossio de Lisboa a Sintra (40 minutos - €2.40)']::text[],
  ARRAY['Lord Byron describió a Sintra como el "glorioso Edén" en sus poemas']::text[],
  '{"address":"Estrada da Pena, Sintra","priceRange":"$$ - Entradas palacios","dia":5,"day":5}'::jsonb,
  300,
  '{"dia":5,"day":5,"activities":["Entrada al Palacio da Pena (€14)","Descenso por la escalera de caracol del Pozo Iniciático de Regaleira (€12)"],"datos_curiosos":["Lord Byron describió a Sintra como el \"glorioso Edén\" en sus poemas"],"consejos":["Tren de cercanías directo desde la estación Rossio de Lisboa a Sintra (40 minutos - €2.40)"],"location_info":{"address":"Estrada da Pena, Sintra","priceRange":"$$ - Entradas palacios","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c6f8dcb6-191d-015a-cd0e-e7c12f216380',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  6,
  'Día 6: Tren Rápido a Oporto: La Ciudad de los Azulejos y el Duero',
  'Estación de São Bento y la librería Lello.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '93153f23-ceec-1fe8-7adb-0e86307a8841',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  'c6f8dcb6-191d-015a-cd0e-e7c12f216380',
  6,
  6,
  'Estación de São Bento y Librería Lello en Oporto',
  41.1456,
  -8.6109,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Tren Alfa Pendular desde Lisboa a Oporto (2h 50m). El vestíbulo de São Bento luce 20.000 azulejos históricos y Lello su escalera roja neogótica.',
  ARRAY['Admirar los 20.000 azulejos de la estación São Bento (Gratis)', 'Entrar a la Librería Lello (€8 deducible en compra de libros)', 'Comer una Francesinha tradicional con salsa picante (€12 - €16)']::text[],
  ARRAY['Reservar turno online para Livraria Lello']::text[],
  ARRAY['El pintor Jorge Colaço tardó 11 años en colocar los azulejos de São Bento']::text[],
  '{"address":"Praça de Almeida Garrett, Porto","priceRange":"$ - Entrada Lello €8","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Admirar los 20.000 azulejos de la estación São Bento (Gratis)","Entrar a la Librería Lello (€8 deducible en compra de libros)","Comer una Francesinha tradicional con salsa picante (€12 - €16)"],"datos_curiosos":["El pintor Jorge Colaço tardó 11 años en colocar los azulejos de São Bento"],"consejos":["Reservar turno online para Livraria Lello"],"location_info":{"address":"Praça de Almeida Garrett, Porto","priceRange":"$ - Entrada Lello €8","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '946087c9-da87-3da0-eb75-f41a982815b9',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  7,
  'Día 7: Puente Don Luis I y Bodegas de Vino de Oporto en Gaia',
  'Cata de vino dulce de Oporto con barcos rabelo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3b99b5d8-50ff-d920-51ed-43cb7c8cba0d',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '946087c9-da87-3da0-eb75-f41a982815b9',
  7,
  7,
  'Puente Dom Luís I y Bodegas de Vila Nova de Gaia',
  41.14,
  -8.613,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Puente de hierro de dos pisos diseñado por Théophile Seyrig (socio de Eiffel). Enfrente, las bodegas centenarias de vino fortificado (Sandeman, Taylor''s, Cálem).',
  ARRAY['Cruzar a pie el piso superior del puente con vistas al río Duero (Gratis)', 'Cata guiada de 3 vinos de Oporto (Tawny, Ruby y Blanco) en bodega histórica (€15 - €25)', 'Paseo en barco tradicional rabelo por los 6 puentes del río Duero (€15)']::text[],
  ARRAY['El mirador del Monasterio de la Sierra del Pilar ofrece la mejor foto del puente al atardecer']::text[],
  ARRAY['El vino de Oporto se fortificaba con aguardiente vínico para que no se avinagrara en las bodegas de los barcos que navegaban hacia Inglaterra']::text[],
  '{"address":"Vila Nova de Gaia / Ribeira, Porto","priceRange":"$$ - Cata de vino","dia":7,"day":7}'::jsonb,
  270,
  '{"dia":7,"day":7,"activities":["Cruzar a pie el piso superior del puente con vistas al río Duero (Gratis)","Cata guiada de 3 vinos de Oporto (Tawny, Ruby y Blanco) en bodega histórica (€15 - €25)","Paseo en barco tradicional rabelo por los 6 puentes del río Duero (€15)"],"datos_curiosos":["El vino de Oporto se fortificaba con aguardiente vínico para que no se avinagrara en las bodegas de los barcos que navegaban hacia Inglaterra"],"consejos":["El mirador del Monasterio de la Sierra del Pilar ofrece la mejor foto del puente al atardecer"],"location_info":{"address":"Vila Nova de Gaia / Ribeira, Porto","priceRange":"$$ - Cata de vino","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '42ce7269-269e-fbd5-d591-5c882874a3e6',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  8,
  'Día 8: Palacio de la Bolsa y Barrio de la Ribeira',
  'Salón Árabe dorado y fachadas de colores frente al agua.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '399df296-61fe-bc88-5abe-513325d84740',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '42ce7269-269e-fbd5-d591-5c882874a3e6',
  8,
  8,
  'Palácio da Bolsa e Igreja de São Francisco',
  41.1415,
  -8.6155,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Monumento del siglo XIX con su Salón Árabe inspirado en la Alhambra. Al lado, San Francisco cubierto por más de 300 kilos de polvo de oro tallado en madera.',
  ARRAY['Visita guiada al Salón Árabe del Palacio de la Bolsa (€12)', 'Entrada a la iglesia dorada de San Francisco (€8)', 'Cena de bacalao a la brasa con vino verde en la Ribeira (€20 - €32)']::text[],
  ARRAY['La visita al Palacio de la Bolsa es obligatoriamente guiada; reservar turno temprano']::text[],
  ARRAY['El Salón Árabe tardó 18 años en completarse con intrincadas yeserías moriscas']::text[],
  '{"address":"Rua de Ferreira Borges, Porto","priceRange":"$$ - Entrada palacio","dia":8,"day":8}'::jsonb,
  210,
  '{"dia":8,"day":8,"activities":["Visita guiada al Salón Árabe del Palacio de la Bolsa (€12)","Entrada a la iglesia dorada de San Francisco (€8)","Cena de bacalao a la brasa con vino verde en la Ribeira (€20 - €32)"],"datos_curiosos":["El Salón Árabe tardó 18 años en completarse con intrincadas yeserías moriscas"],"consejos":["La visita al Palacio de la Bolsa es obligatoriamente guiada; reservar turno temprano"],"location_info":{"address":"Rua de Ferreira Borges, Porto","priceRange":"$$ - Entrada palacio","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '658dc8c5-4c1a-c2e9-a452-fbb1ff083ae1',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  9,
  'Día 9: Foz do Douro: Paseo Marítimo donde el Río se une al Océano Atlántico',
  'El faro de Felgueiras y olas rompiendo en el rompeolas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c7561b2f-424e-9671-a84e-d7cbe983766f',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '658dc8c5-4c1a-c2e9-a452-fbb1ff083ae1',
  9,
  9,
  'Foz do Douro y Faro de Felgueiras',
  41.148,
  -8.672,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Donde las aguas del río Duero desembocan en el bravío Océano Atlántico. Paseo con jardines de pérgolas de hormigón y el faro de granito de 1886.',
  ARRAY['Tomar el tranvía histórico de madera línea 1 junto al río hacia Foz (€3.50)', 'Caminar por el espigón del faro de Felgueiras (Gratis)', 'Tomar un café con vistas a las olas atlánticas (€3)']::text[],
  ARRAY['Si hay temporal marítimo no avanzar por el espigón por seguridad']::text[],
  ARRAY['El tranvía línea 1 funciona con vagones históricos de madera de 1920 con manivelas de bronce originales']::text[],
  '{"address":"Passeio Alegre, Foz do Douro","priceRange":"$ - Libre","dia":9,"day":9}'::jsonb,
  180,
  '{"dia":9,"day":9,"activities":["Tomar el tranvía histórico de madera línea 1 junto al río hacia Foz (€3.50)","Caminar por el espigón del faro de Felgueiras (Gratis)","Tomar un café con vistas a las olas atlánticas (€3)"],"datos_curiosos":["El tranvía línea 1 funciona con vagones históricos de madera de 1920 con manivelas de bronce originales"],"consejos":["Si hay temporal marítimo no avanzar por el espigón por seguridad"],"location_info":{"address":"Passeio Alegre, Foz do Douro","priceRange":"$ - Libre","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f8631d60-80f7-06ec-80ef-f39f211c552b',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  10,
  'Día 10: Mercado de Bolhão y Despedida Ibérica',
  'Quesos de la Sierra de la Estrella, bacalao seco y traslado al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '23e5a658-7711-f833-4802-7b4ef37ac602',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  'f8631d60-80f7-06ec-80ef-f39f211c552b',
  10,
  10,
  'Mercado do Bolhão y Despedida',
  41.149,
  -8.6065,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Mercado neoclásico de dos plantas recién restaurado con puestos de flores, aceitunas, quesos curados y pan caliente.',
  ARRAY['Comprar quesos de Azeitão y latas de sardinas de diseño retro (€10 - €25)', 'Metro línea violeta E directo desde Trindade al aeropuerto Francisco Sá Carneiro (€2.60 / 25 minutos)']::text[],
  ARRAY['Excelente para compras gastronómicas de última hora antes de volar']::text[],
  ARRAY['El mercado abrió originalmente en 1839 sobre un terreno pantanoso donde brotaba agua (*bolhão*)']::text[],
  '{"address":"Rua Formosa 322, Porto","priceRange":"$ - Compras locales","dia":10,"day":10}'::jsonb,
  150,
  '{"dia":10,"day":10,"activities":["Comprar quesos de Azeitão y latas de sardinas de diseño retro (€10 - €25)","Metro línea violeta E directo desde Trindade al aeropuerto Francisco Sá Carneiro (€2.60 / 25 minutos)"],"datos_curiosos":["El mercado abrió originalmente en 1839 sobre un terreno pantanoso donde brotaba agua (*bolhão*)"],"consejos":["Excelente para compras gastronómicas de última hora antes de volar"],"location_info":{"address":"Rua Formosa 322, Porto","priceRange":"$ - Compras locales","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '3ff0487d-4b24-c465-bc8b-16ed59c327d2',
  '321011d9-09d3-9b13-c96b-7bff9bb93d47',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Triángulo Nórdico: Copenhague, Estocolmo y Fiordos de Noruega (Copenhague, Dinamarca, Suecia y Noruega)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-triangulo-nordico-escandinavia-11d',
  'Triángulo Nórdico: Copenhague, Estocolmo y Fiordos de Noruega',
  'Dinamarca, Suecia y Noruega',
  'Copenhague',
  'cultural',
  'Circuito escandinavo de 11 días por las tres capitales y los fiordos. Nyhavn en Copenhague, el puente de Øresund, la ciudad sobre islas de Estocolmo con el galeón del Museo Vasa, y la naturaleza de Oslo y el fiordo de Bergen.',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80']::text[],
  15840,
  1350000,
  'moderate',
  'es',
  4.97,
  175,
  620,
  ARRAY['Escandinavia', 'Copenhague', 'Estocolmo', 'Oslo', 'Bergen', 'Fiordos', 'international_multicity']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":1100,"estimatedPerPersonMax":2400}'::jsonb,
  ARRAY['Amantes de la naturaleza nórdica y el diseño', 'Viajeros de grandes circuitos']::text[],
  'Junio a Agosto (sol de medianoche y días casi eternos)',
  'Aprovechar las horas de luz de verano',
  'Canal de Nyhavn, Copenhague',
  ARRAY['Ruta interconectada de trenes y ferris', 'Guía de fiordos']::text[],
  ARRAY['Trenes SJ y tren escénico Flåm Railway', 'Entradas museos']::text[],
  ARRAY['En los países nórdicos casi no se usa efectivo; el 99% de las transacciones son con tarjeta de crédito o débito']::text[],
  ARRAY['Chaqueta cortavientos impermeable', 'Antifaz para dormir (hay luz hasta medianoche)']::text[],
  ARRAY['Respetar el derecho de acceso público a la naturaleza (*Allemansrätten*)']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"international_multicity","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '33237a00-bfc4-9beb-70df-03cf64d4387f',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  1,
  'Día 1: Copenhague: Canal de Nyhavn y La Sirenita',
  'Casas de colores del puerto y cuento de Hans Christian Andersen.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e7c26cd9-863c-8ca9-cbe3-99adb486d821',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '33237a00-bfc4-9beb-70df-03cf64d4387f',
  1,
  1,
  'Canal de Nyhavn y Estatua de La Sirenita',
  55.6797,
  12.5908,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'El puerto histórico con casas de entramado del siglo XVII donde vivió Andersen. En el paseo marítimo de Langelinie reposa la estatua de bronce de La Sirenita.',
  ARRAY['Paseo en barco por los canales de Copenhague (€12)', 'Foto con La Sirenita (Gratis)', 'Comer un Smørrebrød tradicional de arenque o salmón (€15)']::text[],
  ARRAY['Alquilar una bicicleta; Copenhague es la capital mundial de la bici']::text[],
  ARRAY['Andersen escribió sus cuentos en los números 18, 20 y 67 de Nyhavn']::text[],
  '{"address":"Nyhavn, København","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Paseo en barco por los canales de Copenhague (€12)","Foto con La Sirenita (Gratis)","Comer un Smørrebrød tradicional de arenque o salmón (€15)"],"datos_curiosos":["Andersen escribió sus cuentos en los números 18, 20 y 67 de Nyhavn"],"consejos":["Alquilar una bicicleta; Copenhague es la capital mundial de la bici"],"location_info":{"address":"Nyhavn, København","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '13c4861b-c1bc-6740-e29e-58de31c1cf42',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  2,
  'Día 2: Palacio de Christiansborg y Jardines Tivoli',
  'El parlamento danés y el parque de atracciones más antiguo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cedf32aa-43f1-c5b7-80a7-d45c30836e33',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '13c4861b-c1bc-6740-e29e-58de31c1cf42',
  2,
  2,
  'Palacio de Christiansborg y Tivoli Gardens',
  55.6736,
  12.5683,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Sede del parlamento y salas reales. Por la tarde, los Jardines Tivoli de 1843 con lámparas de feria y arquitectura oriental que inspiraron a Walt Disney.',
  ARRAY['Subir a la torre de Christiansborg para vista panorámica gratuita de la ciudad (Gratis)', 'Entrada a los Jardines Tivoli iluminados (€20)']::text[],
  ARRAY['Tivoli tiene un encanto especial al anochecer']::text[],
  ARRAY['Tivoli cuenta con una de las montañas rusas de madera en funcionamiento más antiguas del mundo (1914)']::text[],
  '{"address":"Vesterbrogade 3, København","priceRange":"$$ - Entrada Tivoli","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Subir a la torre de Christiansborg para vista panorámica gratuita de la ciudad (Gratis)","Entrada a los Jardines Tivoli iluminados (€20)"],"datos_curiosos":["Tivoli cuenta con una de las montañas rusas de madera en funcionamiento más antiguas del mundo (1914)"],"consejos":["Tivoli tiene un encanto especial al anochecer"],"location_info":{"address":"Vesterbrogade 3, København","priceRange":"$$ - Entrada Tivoli","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e4fefb64-9fc4-cdb7-65da-d82ec4e17172',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  3,
  'Día 3: Cruce del Puente de Øresund y Tren a Estocolmo',
  'El colosal puente que une Dinamarca con Suecia sobre el mar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ba2aa5b4-6297-9a8f-f8dc-1eeadd7d8c7b',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  'e4fefb64-9fc4-cdb7-65da-d82ec4e17172',
  3,
  3,
  'Puente de Øresund y Tren SJ a Estocolmo',
  55.57,
  12.82,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra maestra de ingeniería de 8 km que combina puente atirantado, isla artificial y túnel submarino cruzando a Malmö, seguido de tren de alta velocidad hacia Estocolmo.',
  ARRAY['Viaje en tren sobre el puente de Øresund (€15)', 'Tren SJ X2000 a Estocolmo Central (4 horas y media - €35 - €60)']::text[],
  ARRAY['Tener el pasaporte a mano para el control fronterizo en Hyllie']::text[],
  ARRAY['El puente inspiró la célebre serie policiaca escandinava *Bron / The Bridge*']::text[],
  '{"address":"Øresund / Stockholm Central","priceRange":"$$ - Trenes nórdicos","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Viaje en tren sobre el puente de Øresund (€15)","Tren SJ X2000 a Estocolmo Central (4 horas y media - €35 - €60)"],"datos_curiosos":["El puente inspiró la célebre serie policiaca escandinava *Bron / The Bridge*"],"consejos":["Tener el pasaporte a mano para el control fronterizo en Hyllie"],"location_info":{"address":"Øresund / Stockholm Central","priceRange":"$$ - Trenes nórdicos","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b2cef110-2b42-8677-367b-89041e6d16c9',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  4,
  'Día 4: Estocolmo: Gamla Stan y el Increíble Museo Vasa',
  'La ciudad vieja medieval y el barco de guerra del siglo XVII rescatado intacto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e2b513da-7a16-e4ae-f5f6-5c97331b4fec',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  'b2cef110-2b42-8677-367b-89041e6d16c9',
  4,
  4,
  'Gamla Stan y Museo Vasa (Vasamuseet)',
  59.328,
  18.0914,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Gamla Stan es la isla fundacional con callejuelas adoquinadas de color ocre. El Museo Vasa alberga el único barco del siglo XVII conservado en el mundo (98% original), rescatado del fondo del mar.',
  ARRAY['Asombrarse ante el colosal buque real de guerra Vasa de 69 metros (Entrada: ~190 SEK / €17)', 'Caminar por la plaza Stortorget en Gamla Stan (Gratis)', 'Probar albóndigas suecas tradicionales *Köttbullar* con puré y mermelada de arándanos (€18)']::text[],
  ARRAY['El museo Vasa tiene temperatura controlada de 18°C; llevar una chaqueta']::text[],
  ARRAY['El Vasa se hundió en su viaje inaugural en 1628 tras navegar apenas 1.300 metros por un exceso de peso en sus cañones']::text[],
  '{"address":"Galärvarvsvägen 14, Stockholm","priceRange":"$$ - Entrada museo","dia":4,"day":4}'::jsonb,
  270,
  '{"dia":4,"day":4,"activities":["Asombrarse ante el colosal buque real de guerra Vasa de 69 metros (Entrada: ~190 SEK / €17)","Caminar por la plaza Stortorget en Gamla Stan (Gratis)","Probar albóndigas suecas tradicionales *Köttbullar* con puré y mermelada de arándanos (€18)"],"datos_curiosos":["El Vasa se hundió en su viaje inaugural en 1628 tras navegar apenas 1.300 metros por un exceso de peso en sus cañones"],"consejos":["El museo Vasa tiene temperatura controlada de 18°C; llevar una chaqueta"],"location_info":{"address":"Galärvarvsvägen 14, Stockholm","priceRange":"$$ - Entrada museo","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '996a1f0f-d762-8c05-d4ef-e099691ea336',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  5,
  'Día 5: Ayuntamiento de Estocolmo y Metro de Arte',
  'El Salón Dorado de los Premios Nobel y la galería de arte subterránea.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1584ccf8-fe64-7384-3b2d-ab727231ccf3',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '996a1f0f-d762-8c05-d4ef-e099691ea336',
  5,
  5,
  'Ayuntamiento de Estocolmo (Stadshuset) y Metro Art',
  59.3275,
  18.0544,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'El Salón Azul donde se celebra el banquete anual de los Premios Nobel y el Salón Dorado con 18 millones de azulejos de oro. El metro de Estocolmo está considerado la galería de arte más larga del mundo.',
  ARRAY['Tour guiado por el Salón de los Nobel del Ayuntamiento (€13)', 'Ruta en metro explorando las estaciones talladas en roca como T-Centralen y Solna Centrum (€4)', 'Tomar el café tradicional sueco con bollo de canela *Fika* (€7)']::text[],
  ARRAY['La pausa del café *Fika* es una institución social sagrada en Suecia']::text[],
  ARRAY['El Salón Azul no es azul sino de ladrillo rojo; el arquitecto cambió de idea al ver la belleza del ladrillo desnudo']::text[],
  '{"address":"Hantverkargatan 1, Stockholm","priceRange":"$ - Entrada tour","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Tour guiado por el Salón de los Nobel del Ayuntamiento (€13)","Ruta en metro explorando las estaciones talladas en roca como T-Centralen y Solna Centrum (€4)","Tomar el café tradicional sueco con bollo de canela *Fika* (€7)"],"datos_curiosos":["El Salón Azul no es azul sino de ladrillo rojo; el arquitecto cambió de idea al ver la belleza del ladrillo desnudo"],"consejos":["La pausa del café *Fika* es una institución social sagrada en Suecia"],"location_info":{"address":"Hantverkargatan 1, Stockholm","priceRange":"$ - Entrada tour","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '65a101d1-9334-1075-5c89-0911086146bb',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  6,
  'Día 6: Hacia Noruega: Tren a Oslo y Parque Vigeland',
  'Las más de 200 esculturas desnudas de granito y bronce.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c0720b7e-bc07-91be-f2ee-ed47cf483d8a',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '65a101d1-9334-1075-5c89-0911086146bb',
  6,
  6,
  'Parque de Esculturas de Vigeland en Oslo',
  59.927,
  10.7008,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Tren a la capital noruega. El parque de Vigeland es el mayor parque de esculturas creadas por un solo artista en el mundo, con 212 figuras humanas en granito y el colosal Monolito de 14 metros.',
  ARRAY['Pasear entre las esculturas del ciclo vital humano (Gratis)', 'Foto con la famosa escultura del "Niño enojado" (*Sinnataggen*) (Gratis)', 'Caminar por el tejado inclinado de mármol blanco de la Ópera de Oslo frente al fiordo (Gratis)']::text[],
  ARRAY['El tejado de la Ópera de Oslo está diseñado expresamente para que la gente camine sobre él hasta la orilla del agua']::text[],
  ARRAY['Gustav Vigeland dedicó más de 40 años de su vida a esculpir todas las figuras del parque']::text[],
  '{"address":"Nobels gate 32, Oslo","priceRange":"$ - Parque público libre","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Pasear entre las esculturas del ciclo vital humano (Gratis)","Foto con la famosa escultura del \"Niño enojado\" (*Sinnataggen*) (Gratis)","Caminar por el tejado inclinado de mármol blanco de la Ópera de Oslo frente al fiordo (Gratis)"],"datos_curiosos":["Gustav Vigeland dedicó más de 40 años de su vida a esculpir todas las figuras del parque"],"consejos":["El tejado de la Ópera de Oslo está diseñado expresamente para que la gente camine sobre él hasta la orilla del agua"],"location_info":{"address":"Nobels gate 32, Oslo","priceRange":"$ - Parque público libre","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'aaeb98f6-01f0-fa4f-8ae8-03b7a2226058',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  7,
  'Día 7: Museo Munch y Barco del Fiordo de Oslo',
  '"El Grito" de Edvard Munch y el paseo marítimo de Aker Brygge.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4c404a3b-8ec5-9426-e6a4-9f8754cc6f24',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  'aaeb98f6-01f0-fa4f-8ae8-03b7a2226058',
  7,
  7,
  'Museo MUNCH y Aker Brygge',
  59.9055,
  10.755,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Torre inclinada de 13 plantas que custodia las versiones de "El Grito" de Edvard Munch. A orillas del fiordo, Aker Brygge combina antiguos astilleros con terrazas gastronómicas.',
  ARRAY['Ver "El Grito" original de Munch (Entrada: ~160 NOK / €14)', 'Almorzar salmón noruego fresco a la plancha en Aker Brygge (€25 - €40)', 'Paseo en ferry eléctrico por las islas del fiordo de Oslo (€4)']::text[],
  ARRAY['El museo rota cada hora entre la versión de pintura, pastel y litografía de El Grito para protegerlas de la luz']::text[],
  ARRAY['Munch pintó cuatro versiones de "El Grito" para capturar la angustia cósmica de la naturaleza']::text[],
  '{"address":"Edvard Munchs Plass 1, Oslo","priceRange":"$$ - Entrada museo","dia":7,"day":7}'::jsonb,
  210,
  '{"dia":7,"day":7,"activities":["Ver \"El Grito\" original de Munch (Entrada: ~160 NOK / €14)","Almorzar salmón noruego fresco a la plancha en Aker Brygge (€25 - €40)","Paseo en ferry eléctrico por las islas del fiordo de Oslo (€4)"],"datos_curiosos":["Munch pintó cuatro versiones de \"El Grito\" para capturar la angustia cósmica de la naturaleza"],"consejos":["El museo rota cada hora entre la versión de pintura, pastel y litografía de El Grito para protegerlas de la luz"],"location_info":{"address":"Edvard Munchs Plass 1, Oslo","priceRange":"$$ - Entrada museo","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8734b40f-57bf-6bb5-0668-8a48fc0ab901',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  8,
  'Día 8: La Gran Ruta de los Fiordos: Norway in a Nutshell',
  'El tren de alta montaña Bergen Railway y el crucero en fiordo de Aurland.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a7e66744-8b23-52cf-f70f-389cf3750db3',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '8734b40f-57bf-6bb5-0668-8a48fc0ab901',
  8,
  8,
  'Nærøyfjord y Tren Escénico de Flåm (Flåmsbana)',
  60.86,
  7.11,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Considerado el viaje panorámico más espectacular de Europa. Tren de montaña a Myrdal, descenso en el vertiginoso tren de Flåm entre cascadas y navegación en barco silencioso por el estrecho Nærøyfjord (UNESCO).',
  ARRAY['Descenso de 20 km en el tren Flåmsbana con parada en la cascada Kjosfossen (Billete incluido en pase: ~$65 USD)', 'Crucero en barco eléctrico silencioso por las aguas verdes del Nærøyfjord entre paredes de 1.000 metros (Incluido)', 'Llegada en tren nocturno a Bergen']::text[],
  ARRAY['Llevar abrigo; en el crucero por el fiordo el viento entre los cañones es frío incluso en verano']::text[],
  ARRAY['El Nærøyfjord tiene tramos de solo 250 metros de ancho con montañas que caen en vertical a plomo sobre el agua']::text[],
  '{"address":"Flåm / Nærøyfjord, Noruega","priceRange":"$$$ - Pase escénico","dia":8,"day":8}'::jsonb,
  360,
  '{"dia":8,"day":8,"activities":["Descenso de 20 km en el tren Flåmsbana con parada en la cascada Kjosfossen (Billete incluido en pase: ~$65 USD)","Crucero en barco eléctrico silencioso por las aguas verdes del Nærøyfjord entre paredes de 1.000 metros (Incluido)","Llegada en tren nocturno a Bergen"],"datos_curiosos":["El Nærøyfjord tiene tramos de solo 250 metros de ancho con montañas que caen en vertical a plomo sobre el agua"],"consejos":["Llevar abrigo; en el crucero por el fiordo el viento entre los cañones es frío incluso en verano"],"location_info":{"address":"Flåm / Nærøyfjord, Noruega","priceRange":"$$$ - Pase escénico","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '31375b4e-2ff2-b577-7f74-fa00bdc64648',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  9,
  'Día 9: Bergen: Muelle Hanseático de Bryggen y Mercado de Pescado',
  'Las casas de madera de colores de los comerciantes hanseáticos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a35761a0-36ce-341d-489e-a6965ebccfcc',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '31375b4e-2ff2-b577-7f74-fa00bdc64648',
  9,
  9,
  'Muelle de Bryggen y Fisketorget en Bergen',
  60.3975,
  5.3245,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Patrimonio de la Humanidad UNESCO. Hilera de almacenes comerciales medievales de madera inclinada de la Liga Hanseática. En el muelle, el bullicioso mercado de pescado al aire libre.',
  ARRAY['Caminar por los pasadizos oscuros de madera de Bryggen (Gratis)', 'Subir en el funicular Fløibanen al mirador del Monte Fløyen (€14 ida y vuelta)', 'Degustar cangrejo real rey del Ártico y salmón salvaje en el mercado de pescado (€25 - €45)']::text[],
  ARRAY['Bergen es célebre por su lluvia; llevar siempre impermeable']::text[],
  ARRAY['Bryggen se ha incendiado y reconstruido varias veces a lo largo de 800 años, manteniendo siempre sus planos de madera medievales originales']::text[],
  '{"address":"Bryggen, 5003 Bergen","priceRange":"$$ - Funicular y marisco","dia":9,"day":9}'::jsonb,
  240,
  '{"dia":9,"day":9,"activities":["Caminar por los pasadizos oscuros de madera de Bryggen (Gratis)","Subir en el funicular Fløibanen al mirador del Monte Fløyen (€14 ida y vuelta)","Degustar cangrejo real rey del Ártico y salmón salvaje en el mercado de pescado (€25 - €45)"],"datos_curiosos":["Bryggen se ha incendiado y reconstruido varias veces a lo largo de 800 años, manteniendo siempre sus planos de madera medievales originales"],"consejos":["Bergen es célebre por su lluvia; llevar siempre impermeable"],"location_info":{"address":"Bryggen, 5003 Bergen","priceRange":"$$ - Funicular y marisco","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5ea201fe-2de9-ce01-9167-b7a47d7402d2',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  10,
  'Día 10: Senderismo en el Monte Fløyen y Bosque de los Trolls',
  'Naturaleza nórdica con lagos y leyendas de seres mágicos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '880f4dd7-c172-0ad5-3eee-8f2faea08df7',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '5ea201fe-2de9-ce01-9167-b7a47d7402d2',
  10,
  10,
  'Monte Fløyen y Bosque de los Trolls (Trollskogen)',
  60.395,
  5.34,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Senderos en la montaña que domina Bergen poblados de figuras de madera de trolls mitológicos entre abetos y lagos de montaña cristalinos.',
  ARRAY['Senderismo suave por el lago Skomakerdiket con canoas gratuitas en verano (Gratis)', 'Fotografiar las esculturas de trolls gigantes con nariz larga (Gratis)', 'Comer gofres noruegos en forma de corazón con queso marrón dulce *Brunost* (€6)']::text[],
  ARRAY['Bajar a pie desde la cumbre hasta Bergen en una caminata de 45 minutos entre bosques']::text[],
  ARRAY['El queso marrón noruego *Brunost* es caramelizado y tiene un inconfundible sabor dulce a tofe salado']::text[],
  '{"address":"Fløyfjellet, Bergen","priceRange":"$ - Libre","dia":10,"day":10}'::jsonb,
  210,
  '{"dia":10,"day":10,"activities":["Senderismo suave por el lago Skomakerdiket con canoas gratuitas en verano (Gratis)","Fotografiar las esculturas de trolls gigantes con nariz larga (Gratis)","Comer gofres noruegos en forma de corazón con queso marrón dulce *Brunost* (€6)"],"datos_curiosos":["El queso marrón noruego *Brunost* es caramelizado y tiene un inconfundible sabor dulce a tofe salado"],"consejos":["Bajar a pie desde la cumbre hasta Bergen en una caminata de 45 minutos entre bosques"],"location_info":{"address":"Fløyfjellet, Bergen","priceRange":"$ - Libre","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'caa38f03-49ba-b7db-5089-b1406a136e8e',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  11,
  'Día 11: Despedida Nórdica en Bergen',
  'Últimas postales de fiordo y traslado al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd43078b0-82cd-b85c-c61f-0127af65eace',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  'caa38f03-49ba-b7db-5089-b1406a136e8e',
  11,
  11,
  'Puerto de Bergen y Despedida',
  60.391,
  5.321,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Último paseo por el muelle antes de tomar el tren ligero Bybanen directo al aeropuerto de Bergen Flesland (45 minutos - €4).',
  ARRAY['Comprar jerséis de lana pura noruega con patrones de copos de nieve (€60 - €120)', 'Café caliente y despedida de Escandinavia']::text[],
  ARRAY['El Bybanen línea 1 sale cada 10 minutos desde el centro']::text[],
  ARRAY['Bergen fue la capital del reino de Noruega en los siglos XII y XIII antes que Oslo']::text[],
  '{"address":"Bergen Sentrum","priceRange":"$ - Compras","dia":11,"day":11}'::jsonb,
  120,
  '{"dia":11,"day":11,"activities":["Comprar jerséis de lana pura noruega con patrones de copos de nieve (€60 - €120)","Café caliente y despedida de Escandinavia"],"datos_curiosos":["Bergen fue la capital del reino de Noruega en los siglos XII y XIII antes que Oslo"],"consejos":["El Bybanen línea 1 sale cada 10 minutos desde el centro"],"location_info":{"address":"Bergen Sentrum","priceRange":"$ - Compras","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'cc66cc05-948f-149f-f3a3-22bc283cf7a6',
  '8e4f3df5-ad83-0bd5-0282-f7b5684c9b9e',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Sureste Asiático Conectado: De los Templos de Bangkok y Angkor Wat a la Bahía de Ha Long (Bangkok, Tailandia, Camboya y Vietnam)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '240d973e-0944-d7da-1712-7db300571e6d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-sureste-asiatico-tailandia-camboya-vietnam-14d',
  'Sureste Asiático Conectado: De los Templos de Bangkok y Angkor Wat a la Bahía de Ha Long',
  'Tailandia, Camboya y Vietnam',
  'Bangkok',
  'cultural',
  'La gran expedición de 14 días por la península indochina. Palacios reales en Bangkok, las ruinas colosales devoradas por la selva en Angkor Wat (Camboya), el barrio antiguo de Hanói y un crucero con noche a bordo entre los miles de islotes kársticos de la Bahía de Ha Long (Vietnam).',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  20160,
  1850000,
  'moderate',
  'es',
  4.99,
  260,
  940,
  ARRAY['Sureste Asiático', 'Bangkok', 'Angkor Wat', 'Siem Reap', 'Hanói', 'Ha Long Bay', 'international_multicity']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":950,"estimatedPerPersonMax":1900}'::jsonb,
  ARRAY['Grandes expedicionarios', 'Amantes de la arqueología y la selva', 'Fotógrafos']::text[],
  'Noviembre a Marzo (temporada seca y menos calurosa)',
  'Amanecer en Angkor Wat a las 5:00 AM',
  'Gran Palacio de Bangkok, Tailandia',
  ARRAY['Ruta completa de 3 países', 'Itinerario de Angkor Wat y Bahía de Ha Long']::text[],
  ARRAY['Visados de Camboya y Vietnam', 'Pase de Angkor Wat ($37 USD)', 'Crucero Ha Long']::text[],
  ARRAY['Tramitar el visado electrónico (e-Visa) para Camboya y Vietnam antes de viajar', 'Para templos de Camboya y Tailandia es obligatorio llevar hombros y rodillas cubiertos']::text[],
  ARRAY['Ropa transpirable', 'Repelente de mosquitos fuerte con DEET', 'Dólares estadounidenses en efectivo sin roturas (muy usados en Camboya)']::text[],
  ARRAY['No subirse a las raíces de los árboles en Ta Prohm']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"international_multicity","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '45db4f64-d348-c848-c234-1d440c5bc427',
  '240d973e-0944-d7da-1712-7db300571e6d',
  1,
  'Día 1: Bangkok: El Gran Palacio y Wat Phra Kaew',
  'Inicio en la capital de Tailandia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4b504e86-fb1e-887e-3cea-4f8d081b8aa9',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '45db4f64-d348-c848-c234-1d440c5bc427',
  1,
  1,
  'Gran Palacio de Bangkok',
  13.75,
  100.4913,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El templo del Buda de Esmeralda y los palacios reales tailandeses.',
  ARRAY['Entrada oficial (500 THB)', 'Paseo en barco por el río Chao Phraya']::text[],
  ARRAY['Llevar pantalones largos']::text[],
  ARRAY['El complejo mide más de 200.000 m²']::text[],
  '{"address":"Bangkok","priceRange":"$$ - Entrada","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Entrada oficial (500 THB)","Paseo en barco por el río Chao Phraya"],"datos_curiosos":["El complejo mide más de 200.000 m²"],"consejos":["Llevar pantalones largos"],"location_info":{"address":"Bangkok","priceRange":"$$ - Entrada","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'dfc77d8f-a6a3-8b1a-8f1d-cb635c1ed0db',
  '240d973e-0944-d7da-1712-7db300571e6d',
  2,
  'Día 2: Wat Pho y Vuelo a Siem Reap (Camboya)',
  'El Buda reclinado de 46 metros y vuelo a la tierra de los jemeres.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '83a42198-6c5b-9e32-35aa-5c1f41847cb7',
  '240d973e-0944-d7da-1712-7db300571e6d',
  'dfc77d8f-a6a3-8b1a-8f1d-cb635c1ed0db',
  2,
  2,
  'Wat Pho y Vuelo a Siem Reap',
  13.7437,
  100.4889,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Visita matutina a Wat Pho y vuelo de 1 hora a Siem Reap.',
  ARRAY['Buda reclinado (300 THB)', 'Vuelo internacional a Camboya']::text[],
  ARRAY['Llevar 30 USD en billete intacto para la tasa de visa on arrival si no tiene e-visa']::text[],
  ARRAY['Los pies del Buda están decorados con 108 símbolos sagrados en madreperla']::text[],
  '{"address":"Bangkok / Siem Reap","priceRange":"$$ - Vuelo","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Buda reclinado (300 THB)","Vuelo internacional a Camboya"],"datos_curiosos":["Los pies del Buda están decorados con 108 símbolos sagrados en madreperla"],"consejos":["Llevar 30 USD en billete intacto para la tasa de visa on arrival si no tiene e-visa"],"location_info":{"address":"Bangkok / Siem Reap","priceRange":"$$ - Vuelo","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '53c58ded-1e39-9a92-122f-6106750e56b0',
  '240d973e-0944-d7da-1712-7db300571e6d',
  3,
  'Día 3: El Amanecer Mágico en Angkor Wat',
  'El monumento religioso más grande del mundo reflejado en el estanque.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7dd8d51a-325f-8126-71bb-5f06e83274af',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '53c58ded-1e39-9a92-122f-6106750e56b0',
  3,
  3,
  'Santuario de Angkor Wat',
  13.4125,
  103.867,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Construido en el siglo XII por Suryavarman II. Sus cinco torres estilizadas simbolizan los picos del monte Meru rodeados por un foso de agua.',
  ARRAY['Ver amanecer tras las torres de Angkor Wat (Pase Angkor 1 día: $37 USD / 3 días: $62 USD)', 'Alquiler de tuk-tuk con conductor todo el día ($18 - $25 USD)', 'Cruzar las galerías con bajorrelieves del batido del océano de leche']::text[],
  ARRAY['Llegar a la orilla del estanque izquierdo a las 5:15 AM para la foto clásica con reflejo en el agua']::text[],
  ARRAY['Angkor Wat es el único templo jemer orientado hacia el oeste, punto cardinal asociado a la puesta de sol y la vida futura']::text[],
  '{"address":"Parque Arqueológico de Angkor, Siem Reap","priceRange":"$$$ - Pase $37 USD","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Ver amanecer tras las torres de Angkor Wat (Pase Angkor 1 día: $37 USD / 3 días: $62 USD)","Alquiler de tuk-tuk con conductor todo el día ($18 - $25 USD)","Cruzar las galerías con bajorrelieves del batido del océano de leche"],"datos_curiosos":["Angkor Wat es el único templo jemer orientado hacia el oeste, punto cardinal asociado a la puesta de sol y la vida futura"],"consejos":["Llegar a la orilla del estanque izquierdo a las 5:15 AM para la foto clásica con reflejo en el agua"],"location_info":{"address":"Parque Arqueológico de Angkor, Siem Reap","priceRange":"$$$ - Pase $37 USD","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '05f84b68-7fc9-f2d2-ebaa-d21a82fc3361',
  '240d973e-0944-d7da-1712-7db300571e6d',
  4,
  'Día 4: Angkor Thom: Las Caras de Bayón y Ta Prohm (Tomb Raider)',
  'Rostros de piedra gigantes y árboles estranguladores sobre los muros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c475cb9c-c88c-1b43-f45d-ea1e4c0bce48',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '05f84b68-7fc9-f2d2-ebaa-d21a82fc3361',
  4,
  4,
  'Templo de Bayón y Templo de Ta Prohm',
  13.435,
  103.889,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Bayón cuenta con 54 torres decoradas con más de 200 rostros gigantes sonrientes de piedra. Ta Prohm fue dejado intencionadamente tal como se descubrió, devorado por las raíces aéreas de higueras gigantes y árboles de seda.',
  ARRAY['Contemplar las enigmáticas sonrisas de piedra de Bayón (Incluido en pase)', 'Fotografiar las raíces colosales abrazando las puertas de piedra de Ta Prohm (Gratis con pase)', 'Cena de pescado Amok al vapor en hoja de plátano en Pub Street ($6 - $12 USD)']::text[],
  ARRAY['El templo de Ta Prohm se hizo mundialmente famoso en la película de Lara Croft *Tomb Raider*']::text[],
  ARRAY['Las raíces de los árboles han crecido durante siglos fusionándose con la estructura; talar los árboles hoy causaría el derrumbe de los muros']::text[],
  '{"address":"Angkor Thom / Ta Prohm","priceRange":"$$ - Incluido en pase","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Contemplar las enigmáticas sonrisas de piedra de Bayón (Incluido en pase)","Fotografiar las raíces colosales abrazando las puertas de piedra de Ta Prohm (Gratis con pase)","Cena de pescado Amok al vapor en hoja de plátano en Pub Street ($6 - $12 USD)"],"datos_curiosos":["Las raíces de los árboles han crecido durante siglos fusionándose con la estructura; talar los árboles hoy causaría el derrumbe de los muros"],"consejos":["El templo de Ta Prohm se hizo mundialmente famoso en la película de Lara Croft *Tomb Raider*"],"location_info":{"address":"Angkor Thom / Ta Prohm","priceRange":"$$ - Incluido en pase","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '204b918e-be81-e4d3-a03c-862d7a72c0a0',
  '240d973e-0944-d7da-1712-7db300571e6d',
  5,
  'Día 5: Aldeas Flotantes del Lago Tonlé Sap y Vuelo a Hanói (Vietnam)',
  'Casas sobre pilotes en el mayor lago de agua dulce del sureste asiático.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '20ff2c0c-ca57-346f-9034-4ab9e8fa2ec1',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '204b918e-be81-e4d3-a03c-862d7a72c0a0',
  5,
  5,
  'Pueblo Flotante de Kompong Phluk y Vuelo a Hanói',
  13.2,
  103.98,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Aldea construida sobre pilotes de madera de 10 metros de altura para adaptarse a las gigantescas crecidas anuales del lago. Por la tarde, vuelo a Hanói, capital de Vietnam.',
  ARRAY['Paseo en barca tradicional de madera por la aldea y bosque inundado de manglares ($20 USD)', 'Vuelo de Siem Reap a Hanói (~$120 USD)', 'Primer paseo nocturno alrededor del lago Hoan Kiem en Hanói (Gratis)']::text[],
  ARRAY['En época de lluvias el lago Tonlé Sap quintuplica su tamaño habitual debido a que el río Mekong invierte su curso']::text[],
  ARRAY['Tonlé Sap es una de las fuentes de pesca de agua dulce más productivas del planeta']::text[],
  '{"address":"Tonlé Sap / Hanói","priceRange":"$$ - Tour y vuelo","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Paseo en barca tradicional de madera por la aldea y bosque inundado de manglares ($20 USD)","Vuelo de Siem Reap a Hanói (~$120 USD)","Primer paseo nocturno alrededor del lago Hoan Kiem en Hanói (Gratis)"],"datos_curiosos":["Tonlé Sap es una de las fuentes de pesca de agua dulce más productivas del planeta"],"consejos":["En época de lluvias el lago Tonlé Sap quintuplica su tamaño habitual debido a que el río Mekong invierte su curso"],"location_info":{"address":"Tonlé Sap / Hanói","priceRange":"$$ - Tour y vuelo","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3d2f358a-b80a-4224-3536-a763341fc7d0',
  '240d973e-0944-d7da-1712-7db300571e6d',
  6,
  'Día 6: Hanói Colonial: Las 36 Calles del Old Quarter y Café de Huevo',
  'Callejones gremiales, arquitectura francesa y tren atravesando la calle.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e77cb903-1213-6e30-9aa6-a0019adb4a53',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '3d2f358a-b80a-4224-3536-a763341fc7d0',
  6,
  6,
  'Old Quarter de Hanói y Train Street',
  21.0285,
  105.8542,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El barrio histórico donde cada calle lleva el nombre de la mercancía que vendía hace siglos (seda, plata, estaño). Train Street es un callejón estrecho donde el tren de pasajeros pasa rozando las mesas de las cafeterías.',
  ARRAY['Tomar el famoso café con crema de yema de huevo (*Cà phê trứng*) en Cafe Giảng (~35.000 VND / ~$1.40 USD)', 'Comer una sopa Phở de ternera humeante en banquitos de plástico en la calle (~50.000 VND / ~$2 USD)', 'Pasear por el Templo de la Literatura de 1070 dedicado a Confucio (30.000 VND)']::text[],
  ARRAY['Para ver pasar el tren en Train Street es obligatorio sentarse en una de las cafeterías de la vía']::text[],
  ARRAY['El café de huevo fue inventado en Hanói en la década de 1940 cuando escaseaba la leche fresca y un camarero del hotel Metropole batió yemas de huevo con azúcar para emulsionarlo']::text[],
  '{"address":"Hoan Kiem District, Hanoi","priceRange":"$ - Gastronomía callejera barata","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Tomar el famoso café con crema de yema de huevo (*Cà phê trứng*) en Cafe Giảng (~35.000 VND / ~$1.40 USD)","Comer una sopa Phở de ternera humeante en banquitos de plástico en la calle (~50.000 VND / ~$2 USD)","Pasear por el Templo de la Literatura de 1070 dedicado a Confucio (30.000 VND)"],"datos_curiosos":["El café de huevo fue inventado en Hanói en la década de 1940 cuando escaseaba la leche fresca y un camarero del hotel Metropole batió yemas de huevo con azúcar para emulsionarlo"],"consejos":["Para ver pasar el tren en Train Street es obligatorio sentarse en una de las cafeterías de la vía"],"location_info":{"address":"Hoan Kiem District, Hanoi","priceRange":"$ - Gastronomía callejera barata","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '94dc1937-c86c-b462-f2d1-c37443e61088',
  '240d973e-0944-d7da-1712-7db300571e6d',
  7,
  'Día 7: Bahía de Ha Long: Zarpe en Crucero y Noche entre Islotes',
  'Más de 1.600 torres de roca caliza esmeralda emergiendo del mar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5169fb3d-bed1-94a7-0fdb-00034fd960d3',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '94dc1937-c86c-b462-f2d1-c37443e61088',
  7,
  7,
  'Crucero en la Bahía de Ha Long (UNESCO)',
  20.91,
  107.18,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las Nuevas 7 Maravillas Naturales del Mundo. Navegación en junco tradicional entre miles de monolitos de piedra kárstica cubiertos de vegetación selvática que se alzan del agua verde.',
  ARRAY['Embarque en crucero tradicional con camarote privado y pensión completa (~$140 - $220 USD por 2 días / 1 noche)', 'Paseo en kayak doble navegando bajo túneles de roca naturales (Incluido en el crucero)', 'Pesca de calamares con caña en la popa del barco al anochecer']::text[],
  ARRAY['Llevar bañador para nadar en calas de aguas calmas entre los islotes']::text[],
  ARRAY['Ha Long significa "donde el dragón desciende al mar"; la leyenda cuenta que los islotes fueron creados por un dragón celestial para frenar a los invasores navales']::text[],
  '{"address":"Ha Long Bay, Quang Ninh","priceRange":"$$$ - Crucero noche a bordo","dia":7,"day":7}'::jsonb,
  360,
  '{"dia":7,"day":7,"activities":["Embarque en crucero tradicional con camarote privado y pensión completa (~$140 - $220 USD por 2 días / 1 noche)","Paseo en kayak doble navegando bajo túneles de roca naturales (Incluido en el crucero)","Pesca de calamares con caña en la popa del barco al anochecer"],"datos_curiosos":["Ha Long significa \"donde el dragón desciende al mar\"; la leyenda cuenta que los islotes fueron creados por un dragón celestial para frenar a los invasores navales"],"consejos":["Llevar bañador para nadar en calas de aguas calmas entre los islotes"],"location_info":{"address":"Ha Long Bay, Quang Ninh","priceRange":"$$$ - Crucero noche a bordo","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'de408784-ea44-b248-e04a-8f4bb9295e90',
  '240d973e-0944-d7da-1712-7db300571e6d',
  8,
  'Día 8: Cueva de la Sorpresa (Sung Sot) y Regreso a Hanói',
  'Caverna monumental de estalactitas iluminada en la bahía.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cc465a93-fd77-16aa-94de-a0e1799b89fc',
  '240d973e-0944-d7da-1712-7db300571e6d',
  'de408784-ea44-b248-e04a-8f4bb9295e90',
  8,
  8,
  'Cueva Sung Sot y Desembarque',
  20.84,
  107.09,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'La mayor caverna de la bahía descubierta por exploradores franceses en 1901 con salas gigantescas repletas de estalagmitas que parecen esculturas.',
  ARRAY['Recorrido a pie por las pasarelas dentro de la cueva iluminada (Incluido en el crucero)', 'Clase de Tai Chi matutina en la cubierta del barco al amanecer', 'Regreso en autobús hacia Hanói (2 horas y media por autopista moderna)']::text[],
  ARRAY['La subida a la cueva tiene unos 100 escalones de piedra; llevar calzado cómodo']::text[],
  ARRAY['Los franceses la bautizaron "Grotte des Surprises" por la asombrosa inmensidad de su cámara interior']::text[],
  '{"address":"Ha Long Bay / Hanói","priceRange":"$$ - Incluido en crucero","dia":8,"day":8}'::jsonb,
  240,
  '{"dia":8,"day":8,"activities":["Recorrido a pie por las pasarelas dentro de la cueva iluminada (Incluido en el crucero)","Clase de Tai Chi matutina en la cubierta del barco al amanecer","Regreso en autobús hacia Hanói (2 horas y media por autopista moderna)"],"datos_curiosos":["Los franceses la bautizaron \"Grotte des Surprises\" por la asombrosa inmensidad de su cámara interior"],"consejos":["La subida a la cueva tiene unos 100 escalones de piedra; llevar calzado cómodo"],"location_info":{"address":"Ha Long Bay / Hanói","priceRange":"$$ - Incluido en crucero","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '99e5d2a8-9300-1578-e64a-ce8d2339c33d',
  '240d973e-0944-d7da-1712-7db300571e6d',
  9,
  'Día 9: Tam Coc (Ninh Binh): "La Bahía de Ha Long en Tierra"',
  'Paseo en barca remada con los pies entre arrozales y picos de roca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2420ce29-6a16-3710-1ee8-92efe2d657f0',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '99e5d2a8-9300-1578-e64a-ce8d2339c33d',
  9,
  9,
  'Tam Coc y Cueva de Mua en Ninh Binh',
  20.218,
  105.937,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Paseo en bote tradicional por el río Ngo Dong donde los remeros locales reman hábilmente con los pies mientras la barca cruza tres cuevas naturales bajo montañas kársticas.',
  ARRAY['Paseo en barca remada con los pies por Tam Coc (200.000 VND / ~$8 USD)', 'Subir los 500 escalones del dragón en Hang Mua para la panorámica del río y arrozales (100.000 VND)', 'Paseo en bicicleta entre campos de arroz y búfalos de agua (Gratis / alquiler $2 USD)']::text[],
  ARRAY['En mayo y junio los arrozales a ambos lados del río están dorados para la cosecha']::text[],
  ARRAY['Los barqueros reman con los pies para descansar la espalda y los brazos durante los largos recorridos diarios']::text[],
  '{"address":"Ninh Binh, Vietnam","priceRange":"$ - Excursión accesible","dia":9,"day":9}'::jsonb,
  300,
  '{"dia":9,"day":9,"activities":["Paseo en barca remada con los pies por Tam Coc (200.000 VND / ~$8 USD)","Subir los 500 escalones del dragón en Hang Mua para la panorámica del río y arrozales (100.000 VND)","Paseo en bicicleta entre campos de arroz y búfalos de agua (Gratis / alquiler $2 USD)"],"datos_curiosos":["Los barqueros reman con los pies para descansar la espalda y los brazos durante los largos recorridos diarios"],"consejos":["En mayo y junio los arrozales a ambos lados del río están dorados para la cosecha"],"location_info":{"address":"Ninh Binh, Vietnam","priceRange":"$ - Excursión accesible","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '92280047-246c-6764-4f68-8a6aa5414b2c',
  '240d973e-0944-d7da-1712-7db300571e6d',
  10,
  'Día 10: Tren Nocturno o Vuelo a Da Nang y la Ciudad de las Linternas: Hoi An',
  'Pueblo patrimonio iluminado por miles de farolillos de seda.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '984720d5-19b5-dd36-2dd7-30d674fef4d4',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '92280047-246c-6764-4f68-8a6aa5414b2c',
  10,
  10,
  'Casco Antiguo de Hoi An y Puente Japonés',
  15.8801,
  108.338,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Antiguo puerto comercial del siglo XVI donde no circulan automóviles. Calles peatonales amarillas adornadas con miles de farolillos de seda artesanales y el Puente Japonés cubierto de madera.',
  ARRAY['Paseo nocturno en barca soltando una vela encendida de papel en el río Thu Bon (100.000 VND / ~$4 USD)', 'Comer fideos Cao Lau tradicionales con cerdo crujiente (40.000 VND)', 'Encargar ropa a medida en las sastrerías exprés de la ciudad ($30 - $70 USD en 24 horas)']::text[],
  ARRAY['La noche de luna llena apagan todas las luces eléctricas del centro para iluminar solo con farolillos de seda']::text[],
  ARRAY['El Puente Japonés tiene una pagoda en su interior y esculturas de perros y monos que marcan el inicio y fin de su construcción según el horóscopo chino']::text[],
  '{"address":"Old Town, Hoi An, Quang Nam","priceRange":"$ - Entrada patrimonio ~€5","dia":10,"day":10}'::jsonb,
  270,
  '{"dia":10,"day":10,"activities":["Paseo nocturno en barca soltando una vela encendida de papel en el río Thu Bon (100.000 VND / ~$4 USD)","Comer fideos Cao Lau tradicionales con cerdo crujiente (40.000 VND)","Encargar ropa a medida en las sastrerías exprés de la ciudad ($30 - $70 USD en 24 horas)"],"datos_curiosos":["El Puente Japonés tiene una pagoda en su interior y esculturas de perros y monos que marcan el inicio y fin de su construcción según el horóscopo chino"],"consejos":["La noche de luna llena apagan todas las luces eléctricas del centro para iluminar solo con farolillos de seda"],"location_info":{"address":"Old Town, Hoi An, Quang Nam","priceRange":"$ - Entrada patrimonio ~€5","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '242a7121-55d2-1310-d615-680b76c8e16f',
  '240d973e-0944-d7da-1712-7db300571e6d',
  11,
  'Día 11: Ba Na Hills: El Puente de las Manos Gigantes (Golden Bridge)',
  'Pasarela dorada sostenida por dos colosales manos de piedra en las nubes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '595ad861-374f-4595-b9e3-af611c155c3f',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '242a7121-55d2-1310-d615-680b76c8e16f',
  11,
  11,
  'Golden Bridge (Cầu Vàng) en Ba Na Hills',
  15.995,
  107.996,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Puente peatonal de 150 metros a 1.400 metros de altitud que parece flotar en el aire sostenido por dos manos gigantes de piedra envejecida que emergen de la montaña.',
  ARRAY['Subir en el teleférico de un solo cable más largo del mundo (Entrada parque + teleférico: ~900.000 VND / ~$36 USD)', 'Caminar sobre el puente dorado entre las manos gigantes (Gratis con entrada)', 'Vistas de la costa de Da Nang desde la cumbre']::text[],
  ARRAY['Subir en el primer teleférico de las 7:30 AM para cruzar el puente sin cientos de turistas']::text[],
  ARRAY['Las manos parecen esculpidas en piedra milenaria, pero en realidad están hechas de una estructura de acero recubierta de fibra de vidrio y musgo artificial']::text[],
  '{"address":"Sun World Ba Na Hills, Da Nang","priceRange":"$$ - Entrada $36 USD","dia":11,"day":11}'::jsonb,
  240,
  '{"dia":11,"day":11,"activities":["Subir en el teleférico de un solo cable más largo del mundo (Entrada parque + teleférico: ~900.000 VND / ~$36 USD)","Caminar sobre el puente dorado entre las manos gigantes (Gratis con entrada)","Vistas de la costa de Da Nang desde la cumbre"],"datos_curiosos":["Las manos parecen esculpidas en piedra milenaria, pero en realidad están hechas de una estructura de acero recubierta de fibra de vidrio y musgo artificial"],"consejos":["Subir en el primer teleférico de las 7:30 AM para cruzar el puente sin cientos de turistas"],"location_info":{"address":"Sun World Ba Na Hills, Da Nang","priceRange":"$$ - Entrada $36 USD","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f752a87e-bf57-348a-ff85-4741d511f832',
  '240d973e-0944-d7da-1712-7db300571e6d',
  12,
  'Día 12: Vuelo a Ho Chi Minh (Saigón) y Túneles de Cu Chi',
  'La red subterránea secreta de 250 km de la guerra de Vietnam.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a05039d0-9893-afd6-7f07-35bf1bd52d9d',
  '240d973e-0944-d7da-1712-7db300571e6d',
  'f752a87e-bf57-348a-ff85-4741d511f832',
  12,
  12,
  'Túneles de Cu Chi y Saigón',
  11.143,
  106.463,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo a la bulliciosa metrópoli del sur. En Cu Chi se visita la asombrosa red de túneles subterráneos excavados a mano por el Viet Cong con cocinas sin humo, hospitales y trampas ocultas.',
  ARRAY['Gatear por un tramo ensanchado de 20 metros de túnel bajo tierra (Entrada: 125.000 VND / ~$5 USD)', 'Ver las trampas de bambú y trampillas secretas camufladas en la selva (Gratis con entrada)', 'Probar yuca cocida con azúcar y sal como comían los guerrilleros']::text[],
  ARRAY['No entrar al túnel si sufre de claustrofobia; se puede recorrer todo el museo al aire libre']::text[],
  ARRAY['Los túneles contaban con tres niveles subterráneos capaces de resistir bombardeos de aviones B-52']::text[],
  '{"address":"Cu Chi, Ciudad Ho Chi Minh","priceRange":"$ - Entrada $5 USD","dia":12,"day":12}'::jsonb,
  270,
  '{"dia":12,"day":12,"activities":["Gatear por un tramo ensanchado de 20 metros de túnel bajo tierra (Entrada: 125.000 VND / ~$5 USD)","Ver las trampas de bambú y trampillas secretas camufladas en la selva (Gratis con entrada)","Probar yuca cocida con azúcar y sal como comían los guerrilleros"],"datos_curiosos":["Los túneles contaban con tres niveles subterráneos capaces de resistir bombardeos de aviones B-52"],"consejos":["No entrar al túnel si sufre de claustrofobia; se puede recorrer todo el museo al aire libre"],"location_info":{"address":"Cu Chi, Ciudad Ho Chi Minh","priceRange":"$ - Entrada $5 USD","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ccf3f8a9-230b-ffa2-63c0-b094da8776e7',
  '240d973e-0944-d7da-1712-7db300571e6d',
  13,
  'Día 13: Delta del Río Mekong: Frutas Tropicales y Mercados Flotantes',
  'Los nueve brazos del río dragón donde la vida transcurre en el agua.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '72aa0063-a431-4644-93ab-30fce5f86064',
  '240d973e-0944-d7da-1712-7db300571e6d',
  'ccf3f8a9-230b-ffa2-63c0-b094da8776e7',
  13,
  13,
  'Delta del Mekong (My Tho y Ben Tre)',
  10.35,
  106.36,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El granero de arroz de Vietnam. Navegación en barcas de remo por canales estrechos cubiertos por palmeras de agua *dừa nước*, talleres de caramelos de coco y música tradicional del sur.',
  ARRAY['Paseo en canoa tradicional a remo bajo túneles de palmeras acuáticas (Tour día completo: ~$20 - $35 USD)', 'Degustación de frutas exóticas (pitahaya, rambután, ojo de dragón) con miel de abejas silvestre', 'Visitar taller artesanal donde elaboran caramelos blandos de leche de coco caliente']::text[],
  ARRAY['Llevar sombrero cónico tradicional vietnamita (*nón lá*) para protegerse del sol']::text[],
  ARRAY['El Mekong nace en la meseta tibetana y recorre seis países antes de desembocar en este delta en nueve brazos llamados "los nueve dragones"']::text[],
  '{"address":"My Tho, Ben Tre","priceRange":"$ - Excursión accesible","dia":13,"day":13}'::jsonb,
  300,
  '{"dia":13,"day":13,"activities":["Paseo en canoa tradicional a remo bajo túneles de palmeras acuáticas (Tour día completo: ~$20 - $35 USD)","Degustación de frutas exóticas (pitahaya, rambután, ojo de dragón) con miel de abejas silvestre","Visitar taller artesanal donde elaboran caramelos blandos de leche de coco caliente"],"datos_curiosos":["El Mekong nace en la meseta tibetana y recorre seis países antes de desembocar en este delta en nueve brazos llamados \"los nueve dragones\""],"consejos":["Llevar sombrero cónico tradicional vietnamita (*nón lá*) para protegerse del sol"],"location_info":{"address":"My Tho, Ben Tre","priceRange":"$ - Excursión accesible","dia":13,"day":13}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '66eaa8ee-3821-f0f3-c577-372877fada84',
  '240d973e-0944-d7da-1712-7db300571e6d',
  14,
  'Día 14: Catedral de Notre-Dame de Saigón, Mercado Ben Thanh y Despedida',
  'Últimas compras de café de filtro vietnamita y vuelo internacional.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '02b77d62-6bce-fe3a-6c5d-e9de25d24ec6',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '66eaa8ee-3821-f0f3-c577-372877fada84',
  14,
  14,
  'Mercado Ben Thanh y Oficina Central de Correos de Saigón',
  10.7725,
  106.698,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'La emblemática Oficina de Correos con estructura de hierro diseñada por Gustave Eiffel y el vibrante mercado Ben Thanh para comprar recuerdos.',
  ARRAY['Enviar una postal desde la histórica oficina de correos de madera y hierro (€1.50)', 'Comprar café Robusta con filtro tradicional Phin y dulces de coco en Ben Thanh ($10 - $20 USD)', 'Último sándwich Bánh Mì crujiente con paté y cilantro antes del traslado al aeropuerto de Tan Son Nhat ($2 USD)']::text[],
  ARRAY['El aeropuerto internacional de Saigón (SGN) queda dentro de la ciudad a solo 30 minutos en taxi']::text[],
  ARRAY['Vietnam es el segundo mayor exportador de café de todo el planeta, solo por detrás de Brasil']::text[],
  '{"address":"District 1, Ho Chi Minh City","priceRange":"$ - Compras locales","dia":14,"day":14}'::jsonb,
  180,
  '{"dia":14,"day":14,"activities":["Enviar una postal desde la histórica oficina de correos de madera y hierro (€1.50)","Comprar café Robusta con filtro tradicional Phin y dulces de coco en Ben Thanh ($10 - $20 USD)","Último sándwich Bánh Mì crujiente con paté y cilantro antes del traslado al aeropuerto de Tan Son Nhat ($2 USD)"],"datos_curiosos":["Vietnam es el segundo mayor exportador de café de todo el planeta, solo por detrás de Brasil"],"consejos":["El aeropuerto internacional de Saigón (SGN) queda dentro de la ciudad a solo 30 minutos en taxi"],"location_info":{"address":"District 1, Ho Chi Minh City","priceRange":"$ - Compras locales","dia":14,"day":14}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'd72bbc40-359f-f2ae-c66d-4f5bc86ef820',
  '240d973e-0944-d7da-1712-7db300571e6d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Gran Travesía Cono Sur: De los Viñedos de Chile al Tango de Buenos Aires y Cataratas del Iguazú (Santiago de Chile, Chile y Argentina)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-gran-travesia-cono-sur-chile-argentina-12d',
  'Gran Travesía Cono Sur: De los Viñedos de Chile al Tango de Buenos Aires y Cataratas del Iguazú',
  'Chile y Argentina',
  'Santiago de Chile',
  'cultural',
  'Expedición de 12 días por el Cono Sur de América. La cordillera nevada en Santiago de Chile y los cerros de Valparaíso, cruce andino a Mendoza con sus bodegas de Malbec, la vida porteña de Buenos Aires y la potencia atronadora de las Cataratas del Iguazú.',
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80']::text[],
  17280,
  1950000,
  'moderate',
  'es',
  4.98,
  240,
  830,
  ARRAY['Cono Sur', 'Santiago', 'Valparaíso', 'Mendoza', 'Buenos Aires', 'Iguazú', 'Vino', 'international_multicity']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":950,"estimatedPerPersonMax":2100}'::jsonb,
  ARRAY['Amantes del vino y la gastronomía', 'Viajeros de grandes paisajes', 'Parejas']::text[],
  'Octubre a Abril',
  'Jornadas de bodegas al mediodía y espectáculos culturales de noche',
  'Plaza de Armas de Santiago de Chile',
  ARRAY['Ruta completa de 2 países', 'Coordenadas de bodegas y pasarelas de Iguazú']::text[],
  ARRAY['Vuelos internos', 'Entradas a parques nacionales']::text[],
  ARRAY['Llevar muda de ropa seca para las Cataratas del Iguazú (el rocío empapa completamente)']::text[],
  ARRAY['Ropa cómoda', 'Chaqueta ligera para la noche andina', 'Capa impermeable']::text[],
  ARRAY['No alimentar a los coatíes en las pasarelas de Iguazú']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"international_multicity","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '82a21124-7e88-2f31-2940-98d3dfdce704',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  1,
  'Día 1: Santiago de Chile: Cerro Santa Lucía y Barrio Bellavista',
  'Panorámica de los Andes y casona de Pablo Neruda.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2eb6c879-2ef6-4e4f-d100-c3ac1a5d5653',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '82a21124-7e88-2f31-2940-98d3dfdce704',
  1,
  1,
  'Cerro Santa Lucía y La Chascona en Bellavista',
  -33.441,
  -70.643,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Cerro fortaleza donde Pedro de Valdivia fundó Santiago en 1541. Al pie, el barrio bohemio con La Chascona, casa del poeta Pablo Neruda.',
  ARRAY['Subir a la torre mirador del Castillo Hidalgo (Gratis)', 'Entrada a la casa museo de Neruda ($9.500 CLP / ~$10 USD)', 'Empanada chilena de pino con copa de vino Carménère ($8 USD)']::text[],
  ARRAY['Subir al mirador Sky Costanera para ver el atardecer sobre la cordillera nevada']::text[],
  ARRAY['La cepa de uva Carménère se creía extinguida en el mundo hasta que fue redescubierta en Chile en 1994']::text[],
  '{"address":"Santiago Centro","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Subir a la torre mirador del Castillo Hidalgo (Gratis)","Entrada a la casa museo de Neruda ($9.500 CLP / ~$10 USD)","Empanada chilena de pino con copa de vino Carménère ($8 USD)"],"datos_curiosos":["La cepa de uva Carménère se creía extinguida en el mundo hasta que fue redescubierta en Chile en 1994"],"consejos":["Subir al mirador Sky Costanera para ver el atardecer sobre la cordillera nevada"],"location_info":{"address":"Santiago Centro","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9df72482-9017-2613-7605-a88270593f7b',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  2,
  'Día 2: Valparaíso Bohemio: Funiculares y Murales de Colores',
  'Cerro Alegre, Cerro Concepción y vista al océano Pacífico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f649cf75-a6e1-9746-4a55-a890daba6f6c',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '9df72482-9017-2613-7605-a88270593f7b',
  2,
  2,
  'Cerros Alegre y Concepción en Valparaíso',
  -33.045,
  -71.628,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Patrimonio de la Humanidad UNESCO. Puerto sobre colinas con ascensores funiculares de madera de 1883 y galerías de murales al aire libre.',
  ARRAY['Subir en el centenario Ascensor Reina Victoria ($100 CLP / ~$0.15 USD)', 'Paseo por el Pasaje Gálvez admirando murales (Gratis)', 'Almorzar caldillo de congrio o mariscos en el puerto ($15 - $25 USD)']::text[],
  ARRAY['El autobús desde Santiago a Valparaíso tarda solo 1 hora y 30 minutos ($6 USD)']::text[],
  ARRAY['Valparaíso llegó a tener más de 30 funiculares activos a vapor para conectar los cerros con el plan de la ciudad']::text[],
  '{"address":"Cerro Alegre, Valparaíso","priceRange":"$ - Funicular accesible","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Subir en el centenario Ascensor Reina Victoria ($100 CLP / ~$0.15 USD)","Paseo por el Pasaje Gálvez admirando murales (Gratis)","Almorzar caldillo de congrio o mariscos en el puerto ($15 - $25 USD)"],"datos_curiosos":["Valparaíso llegó a tener más de 30 funiculares activos a vapor para conectar los cerros con el plan de la ciudad"],"consejos":["El autobús desde Santiago a Valparaíso tarda solo 1 hora y 30 minutos ($6 USD)"],"location_info":{"address":"Cerro Alegre, Valparaíso","priceRange":"$ - Funicular accesible","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4ce9d3a5-b906-7ea9-c206-801745fffbfd',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  3,
  'Día 3: El Cruce de los Andes hacia Mendoza (Argentina)',
  'Paso cordillerano a más de 3.000 metros viendo el colosal Monte Aconcagua.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af824ad6-6669-0bac-28bd-2d9fe1f48136',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '4ce9d3a5-b906-7ea9-c206-801745fffbfd',
  3,
  3,
  'Paso Los Libertadores y Vista al Aconcagua',
  -32.825,
  -69.945,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los pasos montañosos más espectaculares del planeta. La famosa curva de "Los Caracoles" asciende hacia el túnel fronterizo con vista al Aconcagua (6.961 m), la montaña más alta del continente.',
  ARRAY['Viaje en bus panorámico o coche cruzando la cordillera ($35 - $50 USD)', 'Parada en el Puente del Inca con aguas termales ferruginosas amarillas (Gratis)', 'Llegada a Mendoza y cena con corte de carne asada y vino Malbec ($25 USD)']::text[],
  ARRAY['El paso puede cerrar temporalmente en invierno por nevadas; en verano la ruta está despejada']::text[],
  ARRAY['El Aconcagua es el pico más alto de la Tierra fuera de la cordillera del Himalaya en Asia']::text[],
  '{"address":"Cordillera de los Andes / Mendoza","priceRange":"$$ - Traslado internacional","dia":3,"day":3}'::jsonb,
  360,
  '{"dia":3,"day":3,"activities":["Viaje en bus panorámico o coche cruzando la cordillera ($35 - $50 USD)","Parada en el Puente del Inca con aguas termales ferruginosas amarillas (Gratis)","Llegada a Mendoza y cena con corte de carne asada y vino Malbec ($25 USD)"],"datos_curiosos":["El Aconcagua es el pico más alto de la Tierra fuera de la cordillera del Himalaya en Asia"],"consejos":["El paso puede cerrar temporalmente en invierno por nevadas; en verano la ruta está despejada"],"location_info":{"address":"Cordillera de los Andes / Mendoza","priceRange":"$$ - Traslado internacional","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '059bebdb-6c9c-acf0-b4f6-dce435524a2d',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  4,
  'Día 4: Mendoza: Ruta del Vino Malbec en Valle de Uco / Luján de Cuyo',
  'Bodegas de renombre mundial al pie de los picos nevados.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e03503e0-ec49-d0f9-861a-073a19a2c27e',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '059bebdb-6c9c-acf0-b4f6-dce435524a2d',
  4,
  4,
  'Bodegas de Luján de Cuyo y Valle de Uco',
  -33.005,
  -68.875,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Cuna del Malbec argentino. Viñedos de altura irrigados por agua pura de deshielo andino con bodegas de arquitectura vanguardista.',
  ARRAY['Visita y cata de 4 vinos de alta gama en bodega tradicional ($25 - $45 USD)', 'Almuerzo maridaje de 5 pasos en viñedo con vista a la cordillera ($60 - $110 USD)']::text[],
  ARRAY['Contratar conductor o tour guiado para disfrutar de las catas con total tranquilidad']::text[],
  ARRAY['Mendoza es una de las 11 Grandes Capitales Mundiales del Vino (*Great Wine Capitals*)']::text[],
  '{"address":"Luján de Cuyo, Mendoza","priceRange":"$$$ - Bodegas y catas","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Visita y cata de 4 vinos de alta gama en bodega tradicional ($25 - $45 USD)","Almuerzo maridaje de 5 pasos en viñedo con vista a la cordillera ($60 - $110 USD)"],"datos_curiosos":["Mendoza es una de las 11 Grandes Capitales Mundiales del Vino (*Great Wine Capitals*)"],"consejos":["Contratar conductor o tour guiado para disfrutar de las catas con total tranquilidad"],"location_info":{"address":"Luján de Cuyo, Mendoza","priceRange":"$$$ - Bodegas y catas","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f789f368-a44d-452e-76de-44ab3a79b60b',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  5,
  'Día 5: Vuelo a Buenos Aires y Noche Tanguera en San Telmo',
  'Llegada a la capital porteña y cena show de tango.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8f818215-6db6-b91a-bd22-db315a0ca6bf',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  'f789f368-a44d-452e-76de-44ab3a79b60b',
  5,
  5,
  'San Telmo y Plaza Dorrego',
  -34.621,
  -58.373,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de 1 hora y 45 minutos a Buenos Aires. San Telmo deslumbra con faroles coloniales y compases de bandoneón.',
  ARRAY['Caminar por las calles empedradas de San Telmo (Gratis)', 'Cena show de tango con orquesta en vivo ($65 - $100 USD)']::text[],
  ARRAY['Probar el bife de chorizo con chimichurri']::text[],
  ARRAY['El tango fue declarado Patrimonio Cultural Inmaterial de la Humanidad en 2009']::text[],
  '{"address":"San Telmo, Buenos Aires","priceRange":"$$$ - Show de tango","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Caminar por las calles empedradas de San Telmo (Gratis)","Cena show de tango con orquesta en vivo ($65 - $100 USD)"],"datos_curiosos":["El tango fue declarado Patrimonio Cultural Inmaterial de la Humanidad en 2009"],"consejos":["Probar el bife de chorizo con chimichurri"],"location_info":{"address":"San Telmo, Buenos Aires","priceRange":"$$$ - Show de tango","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '941d3870-745e-0f2a-e2ca-94fed1f54496',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  6,
  'Día 6: Recoleta, Teatro Colón y Librería El Ateneo',
  'La arquitectura palaciega de estilo francés de Buenos Aires.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'dfb14b3e-61ff-072f-5221-da4729cfa9eb',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '941d3870-745e-0f2a-e2ca-94fed1f54496',
  6,
  6,
  'Cementerio de la Recoleta y Librería El Ateneo',
  -34.5875,
  -58.393,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Mausoleos de mármol de presidentes y Eva Perón, y el antiguo teatro convertido en la librería más bella del mundo.',
  ARRAY['Mausoleo de Evita en Recoleta ($15 USD)', 'Café sobre el escenario de El Ateneo ($6 USD)']::text[],
  ARRAY['Apreciar la cúpula pintada al óleo de El Ateneo']::text[],
  ARRAY['Buenos Aires es la ciudad con mayor número de librerías por habitante del mundo']::text[],
  '{"address":"Recoleta, Buenos Aires","priceRange":"$$ - Moderado","dia":6,"day":6}'::jsonb,
  210,
  '{"dia":6,"day":6,"activities":["Mausoleo de Evita en Recoleta ($15 USD)","Café sobre el escenario de El Ateneo ($6 USD)"],"datos_curiosos":["Buenos Aires es la ciudad con mayor número de librerías por habitante del mundo"],"consejos":["Apreciar la cúpula pintada al óleo de El Ateneo"],"location_info":{"address":"Recoleta, Buenos Aires","priceRange":"$$ - Moderado","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '71c4a4e1-3f48-6c0b-4cea-243e311c7673',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  7,
  'Día 7: La Boca: Caminito y Puerto Madero Moderno',
  'Conventillos de chapa pintada y el Puente de la Mujer.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b089e9ec-d942-52ba-a1df-0d10bcabd041',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '71c4a4e1-3f48-6c0b-4cea-243e311c7673',
  7,
  7,
  'Caminito y Puente de la Mujer en Puerto Madero',
  -34.6395,
  -58.3625,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'El callejón colorido de los inmigrantes genoveses y los muelles de ladrillo rojo de Puerto Madero.',
  ARRAY['Fotos en Caminito (Gratis)', 'Paseo por el Puente de la Mujer (Gratis)', 'Helado artesanal dulce de leche en Rapanui ($5 USD)']::text[],
  ARRAY['No salir del perímetro vigilado de Caminito hacia las calles laterales']::text[],
  ARRAY['El Puente de la Mujer de Santiago Calatrava representa a una pareja bailando tango']::text[],
  '{"address":"La Boca / Puerto Madero","priceRange":"$ - Libre","dia":7,"day":7}'::jsonb,
  210,
  '{"dia":7,"day":7,"activities":["Fotos en Caminito (Gratis)","Paseo por el Puente de la Mujer (Gratis)","Helado artesanal dulce de leche en Rapanui ($5 USD)"],"datos_curiosos":["El Puente de la Mujer de Santiago Calatrava representa a una pareja bailando tango"],"consejos":["No salir del perímetro vigilado de Caminito hacia las calles laterales"],"location_info":{"address":"La Boca / Puerto Madero","priceRange":"$ - Libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '303c70bd-80a2-cd25-11b8-bdd2852c45fe',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  8,
  'Día 8: Vuelo a las Cataratas del Iguazú: Parque Nacional Lado Argentino',
  'Llegada a la selva subtropical misionera y el rugido de 275 saltos de agua.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cd7e21da-dfd1-d909-78ca-a78a59881eaf',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '303c70bd-80a2-cd25-11b8-bdd2852c45fe',
  8,
  8,
  'Parque Nacional Iguazú y Tren de la Selva',
  -25.6953,
  -54.4367,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de 1h 50m a Puerto Iguazú. El Parque Nacional Iguazú (Maravilla de la Naturaleza) cuenta con el Tren ecológico de la Selva y circuitos de pasarelas superiores e inferiores.',
  ARRAY['Recorrer las pasarelas del Circuito Superior e Inferior (Entrada parque: ~$20.000 ARS / ~$20 USD)', 'Paseo en lancha "Gran Aventura" que se mete literalmente bajo las cascadas ($60 USD opcional)']::text[],
  ARRAY['Guardar la comida; los coatíes son muy hábiles abriendo mochilas en los descansos']::text[],
  ARRAY['Las cataratas se extienden a lo largo de 2.7 kilómetros con 275 saltos de agua individuales']::text[],
  '{"address":"Puerto Iguazú, Misiones","priceRange":"$$ - Entrada parque","dia":8,"day":8}'::jsonb,
  360,
  '{"dia":8,"day":8,"activities":["Recorrer las pasarelas del Circuito Superior e Inferior (Entrada parque: ~$20.000 ARS / ~$20 USD)","Paseo en lancha \"Gran Aventura\" que se mete literalmente bajo las cascadas ($60 USD opcional)"],"datos_curiosos":["Las cataratas se extienden a lo largo de 2.7 kilómetros con 275 saltos de agua individuales"],"consejos":["Guardar la comida; los coatíes son muy hábiles abriendo mochilas en los descansos"],"location_info":{"address":"Puerto Iguazú, Misiones","priceRange":"$$ - Entrada parque","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fa95c45e-ab8d-6705-40cb-e8a998a44890',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  9,
  'Día 9: La Garganta del Diablo: La Mayor Furia de Agua del Planeta',
  'Pasarela sobre el río que desemboca en el abismo atronador de 80 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9313b51e-8c82-67e2-0287-f2e377e9cdb2',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  'fa95c45e-ab8d-6705-40cb-e8a998a44890',
  9,
  9,
  'Balcón de la Garganta del Diablo',
  -25.695,
  -54.444,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El salto de mayor caudal y dramatismo del mundo en forma de herradura con 80 metros de caída libre que genera una nube permanente de vapor y arcoíris dobles.',
  ARRAY['Caminar por la pasarela flotante de 1.100 metros sobre el río Iguazú superior (Incluido en entrada)', 'Sentir el rugido ensordecedor y la bruma de la Garganta del Diablo', 'Fotografiar decenas de mariposas tropicales de colores posándose en las manos']::text[],
  ARRAY['Llevar funda impermeable para el móvil; el rocío del salto empapa por completo en el mirador']::text[],
  ARRAY['Por la Garganta del Diablo caen más de 1.500 metros cúbicos de agua por segundo']::text[],
  '{"address":"Garganta del Diablo, Iguazú","priceRange":"$ - Incluido en parque","dia":9,"day":9}'::jsonb,
  240,
  '{"dia":9,"day":9,"activities":["Caminar por la pasarela flotante de 1.100 metros sobre el río Iguazú superior (Incluido en entrada)","Sentir el rugido ensordecedor y la bruma de la Garganta del Diablo","Fotografiar decenas de mariposas tropicales de colores posándose en las manos"],"datos_curiosos":["Por la Garganta del Diablo caen más de 1.500 metros cúbicos de agua por segundo"],"consejos":["Llevar funda impermeable para el móvil; el rocío del salto empapa por completo en el mirador"],"location_info":{"address":"Garganta del Diablo, Iguazú","priceRange":"$ - Incluido en parque","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3aa09586-458f-b353-9d42-25ebb204ef5f',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  10,
  'Día 10: Cataratas del Lado Brasileño: La Vista Panorámica Completa',
  'Cruce de frontera a Foz do Iguaçu para la visión de conjunto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'dc08aded-52a0-e0df-19d1-6a126ad39b6a',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '3aa09586-458f-b353-9d42-25ebb204ef5f',
  10,
  10,
  'Parque Nacional do Iguaçu (Lado Brasileño)',
  -25.688,
  -54.44,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Si el lado argentino ofrece la vivencia inmersiva dentro del agua, el lado brasileño regala la postal panorámica perfecta de todo el frente de cascadas.',
  ARRAY['Pasarela panorámica de Brasil que avanza sobre la base de los saltos (Entrada: ~$18 USD)', 'Subida en ascensor panorámico de cristal con vista al cañón', 'Almuerzo buffet en restaurante Porto Canoas sobre el río ($25 USD)']::text[],
  ARRAY['Tener a mano el pasaporte para el paso fronterizo entre Argentina y Brasil']::text[],
  ARRAY['Eleanor Roosevelt al ver las Cataratas del Iguazú exclamó: "¡Pobre Niágara!"']::text[],
  '{"address":"Foz do Iguaçu, Brasil","priceRange":"$$ - Entrada lado brasileño","dia":10,"day":10}'::jsonb,
  240,
  '{"dia":10,"day":10,"activities":["Pasarela panorámica de Brasil que avanza sobre la base de los saltos (Entrada: ~$18 USD)","Subida en ascensor panorámico de cristal con vista al cañón","Almuerzo buffet en restaurante Porto Canoas sobre el río ($25 USD)"],"datos_curiosos":["Eleanor Roosevelt al ver las Cataratas del Iguazú exclamó: \"¡Pobre Niágara!\""],"consejos":["Tener a mano el pasaporte para el paso fronterizo entre Argentina y Brasil"],"location_info":{"address":"Foz do Iguaçu, Brasil","priceRange":"$$ - Entrada lado brasileño","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '19b7c21a-7634-82da-f8af-520b57eadcb8',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  11,
  'Día 11: Parque de las Aves y Retorno a Buenos Aires',
  'Tucanes, guacamayos y vuelo de regreso a la capital.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1bfe72ab-7b7c-7e88-f6fc-27abb3750747',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '19b7c21a-7634-82da-f8af-520b57eadcb8',
  11,
  11,
  'Parque das Aves en Foz do Iguaçu',
  -25.615,
  -54.482,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Santuario de rescate de aves selváticas donde los visitantes caminan dentro de inmensos aviarios rodeados de cientos de tucanes y guacamayos libres.',
  ARRAY['Entrar a los aviarios de inmersión con tucanes de pico amarillo ($15 USD)', 'Vuelo de retorno a Buenos Aires (~$70 - $110 USD)', 'Paseo nocturno por el barrio de Palermo Soho']::text[],
  ARRAY['Las aves no están enjauladas; el visitante entra a su propio hábitat de selva']::text[],
  ARRAY['Más del 50% de las aves del parque fueron rescatadas del tráfico ilegal de fauna silvestre']::text[],
  '{"address":"Foz do Iguaçu / Buenos Aires","priceRange":"$$ - Entrada y vuelo","dia":11,"day":11}'::jsonb,
  180,
  '{"dia":11,"day":11,"activities":["Entrar a los aviarios de inmersión con tucanes de pico amarillo ($15 USD)","Vuelo de retorno a Buenos Aires (~$70 - $110 USD)","Paseo nocturno por el barrio de Palermo Soho"],"datos_curiosos":["Más del 50% de las aves del parque fueron rescatadas del tráfico ilegal de fauna silvestre"],"consejos":["Las aves no están enjauladas; el visitante entra a su propio hábitat de selva"],"location_info":{"address":"Foz do Iguaçu / Buenos Aires","priceRange":"$$ - Entrada y vuelo","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '53d1fa6f-e6a4-378b-17b8-c373e9c6c11a',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  12,
  'Día 12: Despedida del Cono Sur: Alfajores y Vuelo Internacional',
  'Últimas compras porteñas y traslado a Ezeiza.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9734ddc9-3ec2-b4a6-354e-51c7f71c0b8e',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '53d1fa6f-e6a4-378b-17b8-c373e9c6c11a',
  12,
  12,
  'Galerías Pacífico y Despedida',
  -34.5995,
  -58.375,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Centro comercial histórico con cúpula decorada con murales de Antonio Berni y Spilimbergo en la peatonal Florida.',
  ARRAY['Comprar alfajores artesanales Havanna o Cachafaz y dulce de leche ($15 - $30 USD)', 'Último almuerzo de milanesa con papas fritas ($12 USD)', 'Traslado al aeropuerto internacional Ministro Pistarini (Ezeiza)']::text[],
  ARRAY['El taxi o transfer a Ezeiza toma aproximadamente 45 minutos por autopista']::text[],
  ARRAY['La cúpula de Galerías Pacífico es considerada la Capilla Sixtina del muralismo argentino']::text[],
  '{"address":"Florida 753, Buenos Aires","priceRange":"$ - Compras","dia":12,"day":12}'::jsonb,
  150,
  '{"dia":12,"day":12,"activities":["Comprar alfajores artesanales Havanna o Cachafaz y dulce de leche ($15 - $30 USD)","Último almuerzo de milanesa con papas fritas ($12 USD)","Traslado al aeropuerto internacional Ministro Pistarini (Ezeiza)"],"datos_curiosos":["La cúpula de Galerías Pacífico es considerada la Capilla Sixtina del muralismo argentino"],"consejos":["El taxi o transfer a Ezeiza toma aproximadamente 45 minutos por autopista"],"location_info":{"address":"Florida 753, Buenos Aires","priceRange":"$ - Compras","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'c168b3cf-86fb-711d-32ee-32f24b4036d2',
  'bc00338e-7ba8-209c-585f-afe1defb00c3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

COMMIT;

-- ===================================================================
-- End of Seed Data: 20 Tours, 122 Days, 122 Stops.
-- ===================================================================