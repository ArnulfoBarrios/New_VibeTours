-- ===================================================================
-- VibeTours - Seed Data: Parte 1: Colombia & Latinoamérica (Tours 1 - 16) (Parte 1 de 3)
-- Creator: Emotiva VibeTours (7b767010-fc97-4299-9ae3-5a4985da1da3)
-- Generated: 2026-09-08T16:21:54.281Z
-- Total Tours in this script: 16
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
  'vibetour-cartagena-islas-del-rosario-3d',
  'vibetour-santa-marta-tayrona-minca-4d',
  'vibetour-cali-buga-san-cipriano-4d',
  'vibetour-la-guajira-mistica-4d',
  'vibetour-eje-cafetero-cocora-salento-5d',
  'vibetour-bogota-villa-de-leyva-5d',
  'vibetour-santander-extremo-sangil-barichara-5d',
  'vibetour-medellin-guatape-santafe-5d',
  'vibetour-amazonas-profundo-leticia-tarapoto-6d',
  'vibetour-la-gran-vuelta-a-colombia-14d',
  'vibetour-ciudad-de-mexico-teotihuacan-5d',
  'vibetour-cusco-valle-sagrado-machu-picchu-6d',
  'vibetour-costa-rica-pura-vida-7d',
  'vibetour-ruta-maya-yucatan-8d',
  'vibetour-buenos-aires-patagonia-glaciares-9d',
  'vibetour-gran-ruta-andina-peru-15d'
);

-- 3. Insert Tours, Tour Days, georeferenced Stops, and Verified Reviews

-- -------------------------------------------------------------
-- Tour: Cartagena & Islas del Rosario: Magia Colonial y Caribe Esmeralda (Cartagena, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-cartagena-islas-del-rosario-3d',
  'Cartagena & Islas del Rosario: Magia Colonial y Caribe Esmeralda',
  'Colombia',
  'Cartagena',
  'romantic',
  'Recorrido inolvidable de 3 días que combina el encanto romántico y colonial del Centro Amurallado de Cartagena con las aguas turquesas y arrecifes coralinos de las Islas del Rosario. Diseñado para parejas y viajeros que buscan historia, baluartes al atardecer y descanso caribeño de primera categoría.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80']::text[],
  2880,
  42000,
  'easy',
  'es',
  4.95,
  148,
  420,
  ARRAY['Cartagena', 'Islas del Rosario', 'Caribe', 'Colonial', 'Romántico', 'Playa']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":450000,"estimatedPerPersonMax":950000,"notes":"Incluye lancha a islas, entradas y cenas"}'::jsonb,
  ARRAY['Parejas', 'Amantes de la fotografía', 'Viajeros culturales']::text[],
  'Diciembre a Abril (temporada seca y brisa constante)',
  'Salida matutina para aprovechar la luz y navegación temprana',
  'Torre del Reloj, Plaza de la Paz, Cartagena',
  ARRAY['Itinerario georreferenciado día a día', 'Guía de paradas con datos curiosos', 'Recomendaciones de restaurantes románticos', 'Coordenadas de muelles y puntos de embarque']::text[],
  ARRAY['Boletos de lancha hacia las islas', 'Consumos en clubes de playa', 'Impuesto de muelle']::text[],
  ARRAY['Llevar calzado cómodo para adoquines', 'Usar bloqueador solar biodegradable para no dañar los corales', 'Llevar sombrero o gorra y efectivo para artesanos']::text[],
  ARRAY['Ropa ligera de lino o algodón', 'Traje de baño', 'Cámara fotográfica', 'Protector solar reef-safe']::text[],
  ARRAY['Respetar la arquitectura colonial sin alterar fachadas', 'No tocar ni pisar las formaciones de coral']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8a75db70-ea86-5fd7-fbc1-5bc2b03a503f',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  1,
  'Día 1: El Alma Colonial y Murallas al Atardecer',
  'Caminata relajada por el recinto amurallado, visitas a plazas históricas y cena romántica en Getsemaní.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7fa2db96-512a-9e1b-a3af-422a11f37543',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '8a75db70-ea86-5fd7-fbc1-5bc2b03a503f',
  1,
  1,
  'Torre del Reloj y Plaza de los Coches',
  10.4236,
  -75.5501,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Antigua entrada principal a la ciudad fortificada conocida originalmente como Boca del Puente. Esta imponente puerta barroca se abre hacia la Plaza de los Coches, flanqueada por casonas coloniales con balcones de madera tallada.',
  ARRAY['Fotografiar la fachada de la Torre del Reloj (Gratis)', 'Probar dulces típicos en el Portal de los Dulces ($5.000 - $12.000 COP)', 'Apreciar la estatua de Pedro de Heredia (Gratis)']::text[],
  ARRAY['Visitar a primera hora de la mañana para evitar tumultos', 'Llevar monedas o billetes pequeños para los dulceros tradicionales']::text[],
  ARRAY['Originalmente contaba con un puente levadizo que salvaba el foso entre Getsemaní y el centro', 'El reloj suizo actual fue instalado a principios del siglo XX en reemplazo del mecanismo colonial']::text[],
  '{"address":"Plaza de los Coches, Centro Histórico","priceRange":"$ - Gratis acceso a plaza","dia":1,"day":1}'::jsonb,
  45,
  '{"dia":1,"day":1,"activities":["Fotografiar la fachada de la Torre del Reloj (Gratis)","Probar dulces típicos en el Portal de los Dulces ($5.000 - $12.000 COP)","Apreciar la estatua de Pedro de Heredia (Gratis)"],"datos_curiosos":["Originalmente contaba con un puente levadizo que salvaba el foso entre Getsemaní y el centro","El reloj suizo actual fue instalado a principios del siglo XX en reemplazo del mecanismo colonial"],"consejos":["Visitar a primera hora de la mañana para evitar tumultos","Llevar monedas o billetes pequeños para los dulceros tradicionales"],"location_info":{"address":"Plaza de los Coches, Centro Histórico","priceRange":"$ - Gratis acceso a plaza","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4e75019d-df81-6f96-2b95-ebb08e1acaf0',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '8a75db70-ea86-5fd7-fbc1-5bc2b03a503f',
  2,
  2,
  'Las Bóvedas y Baluarte de Santa Catalina',
  10.4285,
  -75.5458,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Estructura militar monumental de 47 arcos y 23 bóvedas construida a finales del siglo XVIII por Antonio de Arévalo. Inicialmente sirvió como almacén de municiones y luego como prisión durante las guerras de independencia; hoy alberga talleres de artesanías selectas.',
  ARRAY['Caminar sobre el parapeto de la muralla con vista al Mar Caribe (Gratis)', 'Comprar artesanías locales y café gourmet ($20.000 - $80.000 COP)', 'Observar los cañones coloniales originales (Gratis)']::text[],
  ARRAY['La brisa marina en lo alto de la muralla es perfecta entre las 4:30 PM y 6:00 PM', 'Subir la rampa de piedra con calzado antideslizante']::text[],
  ARRAY['Durante las mareas altas coloniales el agua del mar llegaba casi hasta la base de las celdas', 'Fue la última gran obra militar edificada por los españoles en Cartagena antes de su emancipación']::text[],
  '{"address":"Calle Zerrezuela, San Diego","priceRange":"$ - Entrada libre","dia":1,"day":1}'::jsonb,
  60,
  '{"dia":1,"day":1,"activities":["Caminar sobre el parapeto de la muralla con vista al Mar Caribe (Gratis)","Comprar artesanías locales y café gourmet ($20.000 - $80.000 COP)","Observar los cañones coloniales originales (Gratis)"],"datos_curiosos":["Durante las mareas altas coloniales el agua del mar llegaba casi hasta la base de las celdas","Fue la última gran obra militar edificada por los españoles en Cartagena antes de su emancipación"],"consejos":["La brisa marina en lo alto de la muralla es perfecta entre las 4:30 PM y 6:00 PM","Subir la rampa de piedra con calzado antideslizante"],"location_info":{"address":"Calle Zerrezuela, San Diego","priceRange":"$ - Entrada libre","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7a90deda-b8fd-9f41-c979-0e7e02bd1f3f',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '8a75db70-ea86-5fd7-fbc1-5bc2b03a503f',
  3,
  3,
  'Baluarte de Santo Domingo y Calle del Santísimo',
  10.4228,
  -75.5539,
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80']::text[],
  'El punto más icónico de la ciudad para contemplar el sol ocultándose en el horizonte caribeño. Las troneras de cañón y las garitas coloniales ofrecen un telón de fondo romántico inigualable mientras cae la tarde.',
  ARRAY['Disfrutar de un cóctel caribeño o copa de vino al atardecer ($35.000 - $55.000 COP)', 'Fotografía romántica de siluetas sobre las murallas (Gratis)', 'Recorrido nocturno por las farolas coloniales de Santo Domingo (Gratis)']::text[],
  ARRAY['Llegar sobre las 5:00 PM para asegurar buena ubicación frente al mar', 'Las calles adyacentes son ideales para una cena a la luz de las velas']::text[],
  ARRAY['Este baluarte resistió el feroz ataque del barón de Pointis en 1697', 'Gabriel García Márquez situó varias escenas de sus novelas en estas esquinas empedradas']::text[],
  '{"address":"Baluarte de Santo Domingo, Muralla Oeste","priceRange":"$$ - Consumos opcionales","dia":1,"day":1}'::jsonb,
  90,
  '{"dia":1,"day":1,"activities":["Disfrutar de un cóctel caribeño o copa de vino al atardecer ($35.000 - $55.000 COP)","Fotografía romántica de siluetas sobre las murallas (Gratis)","Recorrido nocturno por las farolas coloniales de Santo Domingo (Gratis)"],"datos_curiosos":["Este baluarte resistió el feroz ataque del barón de Pointis en 1697","Gabriel García Márquez situó varias escenas de sus novelas en estas esquinas empedradas"],"consejos":["Llegar sobre las 5:00 PM para asegurar buena ubicación frente al mar","Las calles adyacentes son ideales para una cena a la luz de las velas"],"location_info":{"address":"Baluarte de Santo Domingo, Muralla Oeste","priceRange":"$$ - Consumos opcionales","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5d08d05d-5045-c573-f009-0f2a4484dc18',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  2,
  'Día 2: Fortalezas Subterráneas y Cerro de La Popa',
  'Exploración de la ingeniería militar española, vistas de 360 grados de la bahía y noche gastronómica en San Diego.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fc5aacb7-cc4c-05c4-b4de-c6bb3fb8ae75',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '5d08d05d-5045-c573-f009-0f2a4484dc18',
  4,
  4,
  'Castillo San Felipe de Barajas',
  10.423,
  -75.5385,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'La mayor obra de ingeniería militar construida por la corona española en el continente americano. Emplazado sobre la colina de San Lázaro, este complejo cuenta con un laberinto de túneles subterráneos diseñados con propósitos de defensa y acústica táctica.',
  ARRAY['Recorrer el laberinto de túneles subterráneos (Entrada general: $30.000 COP / $7.5 USD)', 'Alquiler de audioguía interactiva ($15.000 COP)', 'Fotografiar la bandera monumental y la panorámica del mar (Gratis con entrada)']::text[],
  ARRAY['Llevar agua y protector solar, no hay sombra en las explanadas superiores', 'Los túneles son estrechos; si sufre de claustrofobia use las rampas exteriores']::text[],
  ARRAY['Los túneles fueron diseñados para que los pasos de los soldados invasores resonaran con eco, delatando su posición', 'Nunca fue tomado por asalto militar directo tras su reconstrucción en 1762']::text[],
  '{"address":"Pie del Cerro, Avenida Antonio de Arévalo","priceRange":"$$ - Entrada $30.000 COP","dia":2,"day":2}'::jsonb,
  120,
  '{"dia":2,"day":2,"activities":["Recorrer el laberinto de túneles subterráneos (Entrada general: $30.000 COP / $7.5 USD)","Alquiler de audioguía interactiva ($15.000 COP)","Fotografiar la bandera monumental y la panorámica del mar (Gratis con entrada)"],"datos_curiosos":["Los túneles fueron diseñados para que los pasos de los soldados invasores resonaran con eco, delatando su posición","Nunca fue tomado por asalto militar directo tras su reconstrucción en 1762"],"consejos":["Llevar agua y protector solar, no hay sombra en las explanadas superiores","Los túneles son estrechos; si sufre de claustrofobia use las rampas exteriores"],"location_info":{"address":"Pie del Cerro, Avenida Antonio de Arévalo","priceRange":"$$ - Entrada $30.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5f3f1438-1f49-1ccf-64d3-f13feeee2b93',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '5d08d05d-5045-c573-f009-0f2a4484dc18',
  5,
  5,
  'Convento y Mirador de La Popa',
  10.4194,
  -75.5262,
  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80']::text[],
  'Situado en la cima del cerro más elevado de la ciudad (150 metros sobre el nivel del mar), el Convento de Nuestra Señora de la Candelaria ofrece un patio claustrado repleto de flores tropicales y la panorámica más completa de la bahía y el mar.',
  ARRAY['Visita guiada al claustro colonial y capilla de la Virgen de la Candelaria (Entrada: $15.000 COP)', 'Mirador panorámico de 360 grados sobre toda Cartagena (Gratis con entrada)', 'Compra de recuerdos religiosos y postales ($10.000 - $30.000 COP)']::text[],
  ARRAY['Subir en taxi de confianza o transporte contratado (aprox. $25.000 COP ida y vuelta)', 'No subir a pie por razones de seguridad en el tramo de la colina']::text[],
  ARRAY['Los marineros coloniales la llamaban La Popa porque desde la distancia el cerro parecía la popa de una gigantesca carabela', 'El libertador Simón Bolívar pernoctó en sus celdas durante sus campañas militares']::text[],
  '{"address":"Cerro de La Popa","priceRange":"$ - Entrada $15.000 COP","dia":2,"day":2}'::jsonb,
  75,
  '{"dia":2,"day":2,"activities":["Visita guiada al claustro colonial y capilla de la Virgen de la Candelaria (Entrada: $15.000 COP)","Mirador panorámico de 360 grados sobre toda Cartagena (Gratis con entrada)","Compra de recuerdos religiosos y postales ($10.000 - $30.000 COP)"],"datos_curiosos":["Los marineros coloniales la llamaban La Popa porque desde la distancia el cerro parecía la popa de una gigantesca carabela","El libertador Simón Bolívar pernoctó en sus celdas durante sus campañas militares"],"consejos":["Subir en taxi de confianza o transporte contratado (aprox. $25.000 COP ida y vuelta)","No subir a pie por razones de seguridad en el tramo de la colina"],"location_info":{"address":"Cerro de La Popa","priceRange":"$ - Entrada $15.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1ee984f7-d63b-83c2-e259-c050e9011746',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  3,
  'Día 3: Aguas Turquesas en las Islas del Rosario',
  'Día completo de sol y navegación por el archipiélago coralino, snorkel y gastronomía fresca de mar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '02e4f469-5418-dbcf-face-a5e52f0cdf2e',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '1ee984f7-d63b-83c2-e259-c050e9011746',
  6,
  6,
  'Isla Grande y Arrecifes del Parque Nacional Corales del Rosario',
  10.1802,
  -75.7314,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'La isla principal del Parque Nacional Natural Corales del Rosario. Rodeada de lagunas de manglar, fondos de arena blanca y formaciones coralinas rebosantes de peces loro, mantarrayas y tortugas carey.',
  ARRAY['Sesión de snorkel en arrecife protegido con guía certificado ($50.000 - $70.000 COP)', 'Paseo en kayak transparente por los túneles de manglar ($40.000 COP)', 'Almuerzo caribeño: pescado frito, arroz de coco y patacones ($45.000 - $75.000 COP)']::text[],
  ARRAY['Las lanchas salen temprano (entre 8:00 AM y 8:30 AM) desde el Muelle de La Bodeguita', 'Pagar la tasa portuaria en efectivo en el muelle ($26.500 COP)']::text[],
  ARRAY['El archipiélago está compuesto por 28 islas de origen coralino emergido', 'Por la noche algunas de sus lagunas internas presentan el fenómeno de bioluminiscencia marina']::text[],
  '{"address":"Parque Nacional Natural Corales del Rosario","priceRange":"$$$ - Pasadía $160.000 - $280.000 COP con lancha","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Sesión de snorkel en arrecife protegido con guía certificado ($50.000 - $70.000 COP)","Paseo en kayak transparente por los túneles de manglar ($40.000 COP)","Almuerzo caribeño: pescado frito, arroz de coco y patacones ($45.000 - $75.000 COP)"],"datos_curiosos":["El archipiélago está compuesto por 28 islas de origen coralino emergido","Por la noche algunas de sus lagunas internas presentan el fenómeno de bioluminiscencia marina"],"consejos":["Las lanchas salen temprano (entre 8:00 AM y 8:30 AM) desde el Muelle de La Bodeguita","Pagar la tasa portuaria en efectivo en el muelle ($26.500 COP)"],"location_info":{"address":"Parque Nacional Natural Corales del Rosario","priceRange":"$$$ - Pasadía $160.000 - $280.000 COP con lancha","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '66dd68a0-30e4-f162-f59c-85f3527322ed',
  'ea0f7061-68d8-13e7-f2af-c8c0c22e76c2',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Santa Marta, Minca y Parque Tayrona: Selva, Montaña y Mar (Santa Marta, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-santa-marta-tayrona-minca-4d',
  'Santa Marta, Minca y Parque Tayrona: Selva, Montaña y Mar',
  'Colombia',
  'Santa Marta',
  'ecological',
  'Circuito de 4 días por el departamento del Magdalena. Combina el rumor de la selva y las playas vírgenes de arena dorada del Parque Nacional Natural Tayrona con los cafetales nubosos y cascadas de Minca en la Sierra Nevada.',
  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  68000,
  'moderate',
  'es',
  4.92,
  112,
  389,
  ARRAY['Santa Marta', 'Tayrona', 'Minca', 'Ecológico', 'Sierra Nevada', 'Naturaleza']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":380000,"estimatedPerPersonMax":780000,"notes":"Entradas, transportes en van/lancha y alimentación"}'::jsonb,
  ARRAY['Senderistas', 'Amantes de la naturaleza', 'Aventureros']::text[],
  'Enero a Mayo y Julio a Septiembre',
  'Inicio temprano para evitar las horas de mayor calor en los senderos',
  'Parque de Los Novios, Santa Marta',
  ARRAY['Itinerario de senderismo detallado', 'Ubicaciones de entradas oficiales', 'Recomendaciones de posadas y guías locales']::text[],
  ARRAY['Tarifa de entrada a Parques Nacionales', 'Seguro médico obligatorio Tayrona', 'Transporte interurbano']::text[],
  ARRAY['Llevar calzado de trekking con buen agarre', 'Llevar repelente ecológico y termo reutilizable', 'Tener efectivo para transporte local en moto o jeep']::text[],
  ARRAY['Botas o tenis para caminar', 'Ropa de secado rápido', 'Impermeable ligero', 'Linterna frontal']::text[],
  ARRAY['Prohibido el ingreso de plásticos de un solo uso en Parques Nacionales', 'No extraer conchas ni piedras de las reservas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a91bbf8f-9926-24e7-09b5-17852e185a20',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  1,
  'Día 1: Centro Histórico de Santa Marta y Bahía',
  'Recorrido por la ciudad hispánica más antigua conservada en Colombia continental.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7f6fc29c-feb3-5608-dc3a-5ea4d5a833f5',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  'a91bbf8f-9926-24e7-09b5-17852e185a20',
  1,
  1,
  'Quinta de San Pedro Alejandrino',
  11.2291,
  -74.1818,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Antigua hacienda azucarera y lugar de reposo final del Libertador Simón Bolívar en diciembre de 1830. Conserva el trapiche original, jardines centenarios y el Museo Bolivariano de Arte Contemporáneo.',
  ARRAY['Visita histórica guiada a la alcoba de Bolívar (Entrada: $23.000 COP)', 'Observación de iguanas gigantes y ceibas en el Jardín Botánico (Gratis con entrada)', 'Recorrido por el Altar de la Patria (Gratis con entrada)']::text[],
  ARRAY['Llevar agua y protector solar para recorrer los jardines botánicos', 'Contratar los guías locales acreditados en la taquilla']::text[],
  ARRAY['El reloj de la alcoba principal permanece detenido a la 1:03 PM, hora exacta del deceso de Bolívar', 'Sus árboles de ceiba tienen más de dos siglos de antigüedad']::text[],
  '{"address":"Avenida del Libertador s/n","priceRange":"$ - Entrada $23.000 COP","dia":1,"day":1}'::jsonb,
  110,
  '{"dia":1,"day":1,"activities":["Visita histórica guiada a la alcoba de Bolívar (Entrada: $23.000 COP)","Observación de iguanas gigantes y ceibas en el Jardín Botánico (Gratis con entrada)","Recorrido por el Altar de la Patria (Gratis con entrada)"],"datos_curiosos":["El reloj de la alcoba principal permanece detenido a la 1:03 PM, hora exacta del deceso de Bolívar","Sus árboles de ceiba tienen más de dos siglos de antigüedad"],"consejos":["Llevar agua y protector solar para recorrer los jardines botánicos","Contratar los guías locales acreditados en la taquilla"],"location_info":{"address":"Avenida del Libertador s/n","priceRange":"$ - Entrada $23.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd7b18600-2a11-f915-7b77-40eb8b540576',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  'a91bbf8f-9926-24e7-09b5-17852e185a20',
  2,
  2,
  'Parque de Los Novios y Malecón de Bastidas',
  11.2435,
  -74.2144,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El corazón vibrante de la vida social y nocturna samaria. Rodeado de casonas restauradas con cafés gourmet, cervecerías artesanales y restaurantes de comida de mar a pocos metros de la playa de la bahía.',
  ARRAY['Caminata al atardecer por el Malecón de Bastidas (Gratis)', 'Cena marinera de cazuela de mariscos ($35.000 - $60.000 COP)', 'Música en vivo y coctelería tropical en el Parque de los Novios ($20.000 - $35.000 COP)']::text[],
  ARRAY['La brisa baja desde la Sierra al atardecer refrescando el centro', 'Excelente punto para cambiar divisas o retirar efectivo antes de ir a Tayrona']::text[],
  ARRAY['El parque solía llamarse Plaza Santander, pero la tradición popular de parejas paseando lo rebautizó oficialmente']::text[],
  '{"address":"Calle 19 con Carrera 3, Centro Histórico","priceRange":"$$ - Acceso libre, consumos moderados","dia":1,"day":1}'::jsonb,
  90,
  '{"dia":1,"day":1,"activities":["Caminata al atardecer por el Malecón de Bastidas (Gratis)","Cena marinera de cazuela de mariscos ($35.000 - $60.000 COP)","Música en vivo y coctelería tropical en el Parque de los Novios ($20.000 - $35.000 COP)"],"datos_curiosos":["El parque solía llamarse Plaza Santander, pero la tradición popular de parejas paseando lo rebautizó oficialmente"],"consejos":["La brisa baja desde la Sierra al atardecer refrescando el centro","Excelente punto para cambiar divisas o retirar efectivo antes de ir a Tayrona"],"location_info":{"address":"Calle 19 con Carrera 3, Centro Histórico","priceRange":"$$ - Acceso libre, consumos moderados","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a8302c61-f42c-7076-c2d1-fbe55434dfec',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  2,
  'Día 2: Senderos Mágicos del Parque Tayrona (Sector Zaino a Cabo San Juan)',
  'Inmersión en el bosque húmedo tropical, avistamiento de monos aulladores y playas vírgenes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '73c2f92c-b49f-444f-ee6b-eae6b59618de',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  'a8302c61-f42c-7076-c2d1-fbe55434dfec',
  3,
  3,
  'Playa Cañaveral y Sendero de Piedra',
  11.3142,
  -73.9318,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Punto de partida del sendero ecológico del Parque Tayrona tras cruzar la entrada Zaino. Destaca por sus formaciones rocosas gigantes de granito y su vegetación selvática exuberante.',
  ARRAY['Registro en la taquilla de Parques Nacionales (Entrada nacional: ~$35.000 COP / extranjero: ~$73.500 COP)', 'Adquisición del seguro de asistencia médica obligatorio ($6.000 COP/día)', 'Senderismo guiado por caminos elevados de madera (Gratis con entrada)']::text[],
  ARRAY['Llegar antes de las 8:00 AM para evitar aglomeraciones en taquilla', 'En Playa Cañaveral el oleaje es peligroso; está estrictamente prohibido nadar allí']::text[],
  ARRAY['Los senderos siguen las antiguas calzadas empedradas trazadas por los pueblos indígenas Tayrona hace más de 500 años']::text[],
  '{"address":"Entrada Zaino, Vía Santa Marta - Riohacha","priceRange":"$$ - Entrada oficial","dia":2,"day":2}'::jsonb,
  120,
  '{"dia":2,"day":2,"activities":["Registro en la taquilla de Parques Nacionales (Entrada nacional: ~$35.000 COP / extranjero: ~$73.500 COP)","Adquisición del seguro de asistencia médica obligatorio ($6.000 COP/día)","Senderismo guiado por caminos elevados de madera (Gratis con entrada)"],"datos_curiosos":["Los senderos siguen las antiguas calzadas empedradas trazadas por los pueblos indígenas Tayrona hace más de 500 años"],"consejos":["Llegar antes de las 8:00 AM para evitar aglomeraciones en taquilla","En Playa Cañaveral el oleaje es peligroso; está estrictamente prohibido nadar allí"],"location_info":{"address":"Entrada Zaino, Vía Santa Marta - Riohacha","priceRange":"$$ - Entrada oficial","dia":2,"day":2}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '41bb534f-e0e4-514f-f4f3-2d7e3608640e',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  'a8302c61-f42c-7076-c2d1-fbe55434dfec',
  4,
  4,
  'Cabo San Juan del Guía y La Piscina',
  11.3288,
  -73.9555,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'La postal más célebre de Colombia en el mundo: una doble bahía de arena dorada coronada por una choza de paja sobre un promontorio rocoso rodeado de aguas color esmeralda.',
  ARRAY['Baño y natación segura en las aguas calmas de La Piscina y Cabo San Juan (Gratis)', 'Fotografía panorámica desde el mirador de la colina rocosa (Gratis)', 'Almuerzo en el restaurante del campamento: arroz con coco y pescado ($38.000 - $55.000 COP)']::text[],
  ARRAY['El regreso a pie toma 2 horas y media; comenzar el retorno hacia Zaino a más tardar a las 3:00 PM o tomar lancha a Taganga ($80.000 COP)']::text[],
  ARRAY['La choza en lo alto del Cabo dispone de hamacas donde los viajeros pueden pernoctar con vista al mar abierto']::text[],
  '{"address":"Sector Cabo San Juan, PNN Tayrona","priceRange":"$$ - Consumos en restaurante","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Baño y natación segura en las aguas calmas de La Piscina y Cabo San Juan (Gratis)","Fotografía panorámica desde el mirador de la colina rocosa (Gratis)","Almuerzo en el restaurante del campamento: arroz con coco y pescado ($38.000 - $55.000 COP)"],"datos_curiosos":["La choza en lo alto del Cabo dispone de hamacas donde los viajeros pueden pernoctar con vista al mar abierto"],"consejos":["El regreso a pie toma 2 horas y media; comenzar el retorno hacia Zaino a más tardar a las 3:00 PM o tomar lancha a Taganga ($80.000 COP)"],"location_info":{"address":"Sector Cabo San Juan, PNN Tayrona","priceRange":"$$ - Consumos en restaurante","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '318faef9-77e8-4616-4c62-a6787622d8db',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  3,
  'Día 3: El Refugio Cafetero de Minca en la Sierra Nevada',
  'Ascenso a 650 metros de altura hacia la capital ecológica de la Sierra Nevada de Santa Marta.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2f695c2d-3973-1fb3-8905-a462617d2294',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  '318faef9-77e8-4616-4c62-a6787622d8db',
  5,
  5,
  'Pueblo de Minca y Finca Cafetera La Victoria',
  11.1442,
  -74.1165,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las haciendas cafeteras más antiguas de Colombia (fundada en 1892), que todavía funciona completamente con energía hidroeléctrica y maquinaria hidráulica traída de Inglaterra y Alemania en el siglo XIX.',
  ARRAY['Tour del café orgánico y maquinaria histórica ($25.000 COP)', 'Degustación de café especial de altura ($5.000 - $10.000 COP)', 'Probar la cerveza artesanal local elaborada con café o cacao ($12.000 - $16.000 COP)']::text[],
  ARRAY['El clima en Minca es más templado y fresco que en la costa (22-26°C)', 'Se puede subir desde el pueblo de Minca en moto-taxi ($20.000 COP) o en caminata escénica']::text[],
  ARRAY['La maquinaria de la finca funciona sin electricidad de la red pública, impulsada únicamente por caídas de agua de montaña']::text[],
  '{"address":"Vereda El Campano, Minca","priceRange":"$ - Tour $25.000 COP","dia":3,"day":3}'::jsonb,
  120,
  '{"dia":3,"day":3,"activities":["Tour del café orgánico y maquinaria histórica ($25.000 COP)","Degustación de café especial de altura ($5.000 - $10.000 COP)","Probar la cerveza artesanal local elaborada con café o cacao ($12.000 - $16.000 COP)"],"datos_curiosos":["La maquinaria de la finca funciona sin electricidad de la red pública, impulsada únicamente por caídas de agua de montaña"],"consejos":["El clima en Minca es más templado y fresco que en la costa (22-26°C)","Se puede subir desde el pueblo de Minca en moto-taxi ($20.000 COP) o en caminata escénica"],"location_info":{"address":"Vereda El Campano, Minca","priceRange":"$ - Tour $25.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0c3dc822-1746-9c46-f0ea-37fec6d578e5',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  '318faef9-77e8-4616-4c62-a6787622d8db',
  6,
  6,
  'Cascadas de Marinka y Pozo Azul',
  11.135,
  -74.108,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Hermosas caídas de agua pura de deshielo y manantial rodeadas de helechos gigantes y bosque nublado. Dispone de piscinas naturales de agua cristalina y hamacas suspendidas gigantes.',
  ARRAY['Baño refrescante en las pozas naturales (Entrada ecológica Marinka: $10.000 COP)', 'Descanso en las redes colgantes gigantes con vista al cañón ($5.000 COP)', 'Avistamiento de tucanes y colibríes en los comederos naturales (Gratis)']::text[],
  ARRAY['El agua es fresca de montaña (unos 18°C); llevar toalla y muda seca de ropa', 'Evitar pisar piedras resbalosas descalzo']::text[],
  ARRAY['Minca es considerada un paraíso mundial para ornitólogos con más de 300 especies de aves registradas en su microclima']::text[],
  '{"address":"Cascadas de Marinka, Minca","priceRange":"$ - Entrada $10.000 COP","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Baño refrescante en las pozas naturales (Entrada ecológica Marinka: $10.000 COP)","Descanso en las redes colgantes gigantes con vista al cañón ($5.000 COP)","Avistamiento de tucanes y colibríes en los comederos naturales (Gratis)"],"datos_curiosos":["Minca es considerada un paraíso mundial para ornitólogos con más de 300 especies de aves registradas en su microclima"],"consejos":["El agua es fresca de montaña (unos 18°C); llevar toalla y muda seca de ropa","Evitar pisar piedras resbalosas descalzo"],"location_info":{"address":"Cascadas de Marinka, Minca","priceRange":"$ - Entrada $10.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '652563c5-37e7-b444-423e-55f6367fbcc2',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  4,
  'Día 4: Atardecer en Taganga y Despedida Marina',
  'Pueblo tradicional de pescadores rodeado de cerros áridos y mirador al mar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f8ae49d3-8e69-2f3d-9676-c4822b7cd042',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  '652563c5-37e7-b444-423e-55f6367fbcc2',
  7,
  7,
  'Mirador y Ensenada de Taganga',
  11.2678,
  -74.1925,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Pintoresca ensenada marina donde las montañas de la Sierra Nevada se hunden abruptamente en el Caribe. Famosa por sus centros de buceo certificados y su tradición de pesca artesanal.',
  ARRAY['Fotografía desde el mirador de la colina de acceso a Taganga (Gratis)', 'Almuerzo de pargo rojo con patacones frente a la playa ($30.000 - $45.000 COP)', 'Bautizo de buceo o snorkel guiado opcional ($120.000 - $180.000 COP)']::text[],
  ARRAY['Tomar un taxi desde Santa Marta hasta el mirador toma solo 15 minutos ($15.000 COP)', 'Las tardes son espectaculares para ver regresar las faenas de pesca artesanal']::text[],
  ARRAY['Taganga fue originalmente un asentamiento indígena de pescadores de la etnia Taganga antes de la llegada de los colonizadores']::text[],
  '{"address":"Bahía de Taganga, Magdalena","priceRange":"$$ - Entrada libre","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Fotografía desde el mirador de la colina de acceso a Taganga (Gratis)","Almuerzo de pargo rojo con patacones frente a la playa ($30.000 - $45.000 COP)","Bautizo de buceo o snorkel guiado opcional ($120.000 - $180.000 COP)"],"datos_curiosos":["Taganga fue originalmente un asentamiento indígena de pescadores de la etnia Taganga antes de la llegada de los colonizadores"],"consejos":["Tomar un taxi desde Santa Marta hasta el mirador toma solo 15 minutos ($15.000 COP)","Las tardes son espectaculares para ver regresar las faenas de pesca artesanal"],"location_info":{"address":"Bahía de Taganga, Magdalena","priceRange":"$$ - Entrada libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '2348cf68-6559-6497-44cb-18c5ce3ca3f1',
  'c034e473-6b1a-fc0b-a2af-0abe309f7276',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Cali, Buga y Río San Cipriano: Salsa, Mística y Naturaleza (Cali, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-cali-buga-san-cipriano-4d',
  'Cali, Buga y Río San Cipriano: Salsa, Mística y Naturaleza',
  'Colombia',
  'Cali',
  'cultural',
  'Circuito de 4 días que explora la alegría musical y cultural de Santiago de Cali (capital mundial de la salsa), el fervor histórico y arquitectónico de la Basílica de Buga, y la aventura ecológica en las brujitas sobre rieles hacia las aguas cristalinas de San Cipriano.',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  140000,
  'moderate',
  'es',
  4.88,
  94,
  310,
  ARRAY['Cali', 'Buga', 'San Cipriano', 'Salsa', 'Cultural', 'Valle del Cauca']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":320000,"estimatedPerPersonMax":650000,"notes":"Transportes, entradas, brujitas y gastronomía"}'::jsonb,
  ARRAY['Amantes de la música y baile', 'Viajeros culturales', 'Ecoturistas']::text[],
  'Todo el año; diciembre es excepcional por la Feria de Cali',
  'Actividades culturales por el día y clubes de salsa en la noche',
  'Plazoleta Jairo Varela, Cali',
  ARRAY['Ruta completa georreferenciada', 'Puntos clave de escuelas de salsa y museos', 'Contacto de guías locales en San Cipriano']::text[],
  ARRAY['Paseo en brujita sobre rieles', 'Clases privadas de baile', 'Alimentación']::text[],
  ARRAY['Llevar calzado deportivo para caminar y bailar', 'Probar las delicias locales: lulada, champús y marranitas']::text[],
  ARRAY['Ropa fresca y cómoda', 'Traje de baño para San Cipriano', 'Zapatos para agua']::text[],
  ARRAY['Respetar la tranquilidad de la comunidad de San Cipriano', 'No arrojar residuos al río']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1e62e0ba-ee5f-efb2-879b-58d6b058e459',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  1,
  'Día 1: Cali Colonial, Barrio San Antonio y Brisa del Río',
  'Exploración del centro histórico, artesanías tradicionales y gastronomía vallecaucana.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cf93a44b-f51d-038f-31ba-25c52363480f',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  '1e62e0ba-ee5f-efb2-879b-58d6b058e459',
  1,
  1,
  'Barrio y Colina de San Antonio',
  3.4475,
  -76.5412,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El barrio colonial más emblemático de Cali, caracterizado por calles empinadas de piedra, casas blancas con balcones de madera, talleres de artesanos, anticuarios y la centenaria capilla de San Antonio de 1747.',
  ARRAY['Subir a la colina de San Antonio para la panorámica de la ciudad (Gratis)', 'Degustar empanadas vallunas con ají y lulada tradicional ($12.000 - $22.000 COP)', 'Visitar las tiendas de cuero y cerámica artesanal (Gratis)']::text[],
  ARRAY['A las 5:00 PM la colina se llena de cuenteros tradicionales y brisa refrescante', 'Caminar con calzado cómodo por los adoquines']::text[],
  ARRAY['La capilla fue construida gracias a una donación de 1.000 patacones de oro en honor a San Antonio de Padua en 1747']::text[],
  '{"address":"Carrera 10 con Calle 1 Oeste, San Antonio","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Subir a la colina de San Antonio para la panorámica de la ciudad (Gratis)","Degustar empanadas vallunas con ají y lulada tradicional ($12.000 - $22.000 COP)","Visitar las tiendas de cuero y cerámica artesanal (Gratis)"],"datos_curiosos":["La capilla fue construida gracias a una donación de 1.000 patacones de oro en honor a San Antonio de Padua en 1747"],"consejos":["A las 5:00 PM la colina se llena de cuenteros tradicionales y brisa refrescante","Caminar con calzado cómodo por los adoquines"],"location_info":{"address":"Carrera 10 con Calle 1 Oeste, San Antonio","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a77bea02-88d7-78ba-071e-3d36030300ec',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  '1e62e0ba-ee5f-efb2-879b-58d6b058e459',
  2,
  2,
  'Bulevar del Río y Gato de Tejada',
  3.4542,
  -76.5365,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Paseo peatonal ribereño arbolado sobre el túnel vehicular de la Avenida Colombia. Exhibe la monumental escultura en bronce de "El Gato del Río" donada por Hernando Tejada y sus 20 "gatas" intervenidas por destacados artistas colombianos.',
  ARRAY['Caminata fotográfica por el paseo de las gatas (Gratis)', 'Disfrutar de un raspao de hielo con leche condensada ($6.000 COP)', 'Visita a la Iglesia Ermita de estilo neogótico frente al río (Gratis)']::text[],
  ARRAY['La brisa que baja del cañón del río Cali al final de la tarde es célebre por su frescura', 'Zona vigilada y muy segura para pasear en familia']::text[],
  ARRAY['El Gato de Tejada pesa más de 3 toneladas y fue transportado e instalado en 1996 como símbolo de reconciliación urbana']::text[],
  '{"address":"Avenida del Río Cali","priceRange":"$ - Entrada libre","dia":1,"day":1}'::jsonb,
  90,
  '{"dia":1,"day":1,"activities":["Caminata fotográfica por el paseo de las gatas (Gratis)","Disfrutar de un raspao de hielo con leche condensada ($6.000 COP)","Visita a la Iglesia Ermita de estilo neogótico frente al río (Gratis)"],"datos_curiosos":["El Gato de Tejada pesa más de 3 toneladas y fue transportado e instalado en 1996 como símbolo de reconciliación urbana"],"consejos":["La brisa que baja del cañón del río Cali al final de la tarde es célebre por su frescura","Zona vigilada y muy segura para pasear en familia"],"location_info":{"address":"Avenida del Río Cali","priceRange":"$ - Entrada libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c8165de4-2d15-c600-98c9-aafd2d036715',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  2,
  'Día 2: Salsa Viva en Juanchito y Alameda',
  'Día dedicado al patrimonio sonoro: instrumentos, museos y pasos de salsa caleña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fd88174b-c4b2-b7f8-f376-0e329e4a3cc5',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  'c8165de4-2d15-c600-98c9-aafd2d036715',
  3,
  3,
  'Plazoleta Jairo Varela y Museo de la Salsa',
  3.456,
  -76.533,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Homenaje al fundador del legendario Grupo Niche. La plaza luce un monumento sonoro monumental de trompetas de bronce gigantes donde los visitantes se ubican debajo para escuchar las canciones más icónicas de la salsa colombiana.',
  ARRAY['Ubicarse bajo las campanas de las trompetas para escuchar las pistas sonoras (Gratis)', 'Visitar la sala museo de Jairo Varela con partituras y trajes originales (Gratis)', 'Clase exprés de pasos básicos de salsa estilo caleño ($25.000 - $40.000 COP)']::text[],
  ARRAY['Alrededor de la plaza hay cafés con aire acondicionado y wifi para descansar']::text[],
  ARRAY['Las cuatro trompetas forman las letras de la palabra N-I-C-H-E cuando se observan en perspectiva']::text[],
  '{"address":"Avenida 2 Norte con Calle 10","priceRange":"$ - Acceso libre","dia":2,"day":2}'::jsonb,
  90,
  '{"dia":2,"day":2,"activities":["Ubicarse bajo las campanas de las trompetas para escuchar las pistas sonoras (Gratis)","Visitar la sala museo de Jairo Varela con partituras y trajes originales (Gratis)","Clase exprés de pasos básicos de salsa estilo caleño ($25.000 - $40.000 COP)"],"datos_curiosos":["Las cuatro trompetas forman las letras de la palabra N-I-C-H-E cuando se observan en perspectiva"],"consejos":["Alrededor de la plaza hay cafés con aire acondicionado y wifi para descansar"],"location_info":{"address":"Avenida 2 Norte con Calle 10","priceRange":"$ - Acceso libre","dia":2,"day":2}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f54574df-45bb-72de-a09f-0c3a159fb7cc',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  'c8165de4-2d15-c600-98c9-aafd2d036715',
  4,
  4,
  'Mercado de la Alameda y Noche en La Topa Tolondra',
  3.437,
  -76.536,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80']::text[],
  'La galería de mercado más vibrante para saborear la gastronomía del Pacífico (piangua, cazuelas de mariscos, encocaos) seguido de la noche en el templo de la salsa tradicional caleña.',
  ARRAY['Almorzar cazuela de mariscos o sancocho de gallina en Alameda ($25.000 - $45.000 COP)', 'Noche de baile social de salsa en La Topa Tolondra (Entrada: $15.000 - $25.000 COP)', 'Apreciar bailarines profesionales de salsa en pista viva']::text[],
  ARRAY['En Alameda pedir el jugo de borojó o chontaduro con miel', 'En La Topa llevar ropa ligera porque el baile es continuo y caluroso']::text[],
  ARRAY['Cali ostenta el título de Capital Mundial de la Salsa por tener más de 120 escuelas de baile activas y orquestas vivas']::text[],
  '{"address":"Calle 8 con Carrera 26, Alameda","priceRange":"$$ - Moderado","dia":2,"day":2}'::jsonb,
  200,
  '{"dia":2,"day":2,"activities":["Almorzar cazuela de mariscos o sancocho de gallina en Alameda ($25.000 - $45.000 COP)","Noche de baile social de salsa en La Topa Tolondra (Entrada: $15.000 - $25.000 COP)","Apreciar bailarines profesionales de salsa en pista viva"],"datos_curiosos":["Cali ostenta el título de Capital Mundial de la Salsa por tener más de 120 escuelas de baile activas y orquestas vivas"],"consejos":["En Alameda pedir el jugo de borojó o chontaduro con miel","En La Topa llevar ropa ligera porque el baile es continuo y caluroso"],"location_info":{"address":"Calle 8 con Carrera 26, Alameda","priceRange":"$$ - Moderado","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ff384ed1-3111-aa8d-20bf-113a62915c2a',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  3,
  'Día 3: La Basílica del Señor de los Milagros en Buga',
  'Excursión hacia Guadalajara de Buga, joya religiosa y pueblo patrimonio de Colombia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '163cc521-fbec-0004-ecb1-7c5f19eb9ac0',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  'ff384ed1-3111-aa8d-20bf-113a62915c2a',
  5,
  5,
  'Basílica del Señor de los Milagros de Buga',
  3.9015,
  -76.3025,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Imponente templo basilical que acoge la imagen milagrosa del Cristo Negro hallada en el siglo XVI en el río Guadalajara. Uno de los mayores centros de peregrinación de América Latina.',
  ARRAY['Visita a la nave central y camarín del Señor de los Milagros (Gratis)', 'Recorrido por el museo de exvotos y objetos históricos ($8.000 COP)', 'Degustación del manjar blanco de Buga tradicional en calabaza ($10.000 - $18.000 COP)']::text[],
  ARRAY['Buga queda a solo 1 hora y 15 minutos en bus expreso desde el terminal de Cali ($18.000 COP)', 'Los fines de semana hay gran afluencia; los días entre semana son ideales para visitas tranquilas']::text[],
  ARRAY['Según la leyenda de 1580, una humilde lavandera indígena encontró la pequeña cruz que luego creció milagrosamente en tamaño']::text[],
  '{"address":"Carrera 14 # 3-62, Buga","priceRange":"$ - Entrada libre","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Visita a la nave central y camarín del Señor de los Milagros (Gratis)","Recorrido por el museo de exvotos y objetos históricos ($8.000 COP)","Degustación del manjar blanco de Buga tradicional en calabaza ($10.000 - $18.000 COP)"],"datos_curiosos":["Según la leyenda de 1580, una humilde lavandera indígena encontró la pequeña cruz que luego creció milagrosamente en tamaño"],"consejos":["Buga queda a solo 1 hora y 15 minutos en bus expreso desde el terminal de Cali ($18.000 COP)","Los fines de semana hay gran afluencia; los días entre semana son ideales para visitas tranquilas"],"location_info":{"address":"Carrera 14 # 3-62, Buga","priceRange":"$ - Entrada libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8517c8af-ca62-0b0f-7b3d-3ac949f22379',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  4,
  'Día 4: Aventura en Brujita y Aguas Cristalinas de San Cipriano',
  'Viaje en transporte artesanal sobre rieles de tren abandonados hacia una reserva natural virgen.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f4154582-edb1-355c-73ee-5b4e442398c7',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  '8517c8af-ca62-0b0f-7b3d-3ac949f22379',
  6,
  6,
  'Reserva Natural San Cipriano y Paseo en Brujita',
  3.829,
  -76.885,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Paraíso selvático del Chocó biogeográfico famoso por tener uno de los ríos con aguas más puras y transparentes del mundo. Se accede únicamente a través de "brujitas": plataformas de madera montadas sobre rieles de ferrocarril impulsadas por motocicletas modificadas.',
  ARRAY['Paseo emocionante en brujita sobre la vía férrea (Pasaje ida y vuelta: $20.000 COP)', 'Tubing: descenso suave por el río en neumáticos gigantes inflados ($15.000 - $20.000 COP)', 'Almuerzo afrodescendiente de encocao de pescado fresco ($25.000 - $35.000 COP)']::text[],
  ARRAY['Llevar bolsa impermeable para proteger teléfonos y pertenencias de salpicaduras', 'El agua del río es refrescante y cristalina, perfecta para nadar con gafas de snorkel']::text[],
  ARRAY['Las brujitas fueron inventadas ingeniosamente por los propios lugareños para no quedar aislados tras el cierre de la línea férrea del Pacífico']::text[],
  '{"address":"Córdoba / San Cipriano, Valle del Cauca","priceRange":"$$ - Costos de brujita y actividades","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Paseo emocionante en brujita sobre la vía férrea (Pasaje ida y vuelta: $20.000 COP)","Tubing: descenso suave por el río en neumáticos gigantes inflados ($15.000 - $20.000 COP)","Almuerzo afrodescendiente de encocao de pescado fresco ($25.000 - $35.000 COP)"],"datos_curiosos":["Las brujitas fueron inventadas ingeniosamente por los propios lugareños para no quedar aislados tras el cierre de la línea férrea del Pacífico"],"consejos":["Llevar bolsa impermeable para proteger teléfonos y pertenencias de salpicaduras","El agua del río es refrescante y cristalina, perfecta para nadar con gafas de snorkel"],"location_info":{"address":"Córdoba / San Cipriano, Valle del Cauca","priceRange":"$$ - Costos de brujita y actividades","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'a4410b65-b07f-9393-d324-9716e0f74e6e',
  'd43896e1-4ebd-e59f-e94c-1a357b19c937',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Guajira Mística: Travesía 4x4, Dunas y Cabo de la Vela (Riohacha, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-la-guajira-mistica-4d',
  'La Guajira Mística: Travesía 4x4, Dunas y Cabo de la Vela',
  'Colombia',
  'Riohacha',
  'sports',
  'Expedición de 4 días en vehículo 4x4 por la península más septentrional de Suramérica. Recorre el desierto donde la arena dorada se encuentra directamente con el azul profundo del mar Caribe, durmiendo en rancherías indígenas Wayúu bajo cielos tapizados de estrellas.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80']::text[],
  5760,
  320000,
  'intense',
  'es',
  4.9,
  85,
  290,
  ARRAY['La Guajira', 'Cabo de la Vela', 'Manaure', 'Desierto', 'Wayúu', 'Aventura']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":500000,"estimatedPerPersonMax":1100000,"notes":"Camioneta 4x4 compartida, comidas tradicionales y chinchorro"}'::jsonb,
  ARRAY['Aventureros', 'Fotógrafos', 'Viajeros culturales']::text[],
  'Diciembre a Abril y Julio a Agosto (menos lluvias en desierto)',
  'Expedición en convoy 4x4 con guías y conductores Wayúu certificados',
  'Muelle Turístico de Riohacha',
  ARRAY['Ruta GPS de dunas y salinas', 'Puntos de contacto de rancherías comunitarias', 'Protocolo cultural Wayúu']::text[],
  ARRAY['Alquiler de vehículo todoterreno 4x4', 'Consumos en rancherías', 'Alojamiento en chinchorro']::text[],
  ARRAY['Llevar suficiente agua potable embotellada (no hay acueducto en el desierto)', 'Llevar pañuelo o bandana contra el viento y la arena', 'Tener dinero en efectivo, no hay cajeros automáticos en el Cabo']::text[],
  ARRAY['Mochila ligera', 'Linterna frontal', 'Gafas de sol polarizadas', 'Toalla de microfibra']::text[],
  ARRAY['Pedir permiso a las autoridades tradicionales Wayúu antes de fotografiar personas', 'No dejar residuos plásticos en el desierto']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '72bebeea-3c81-fd35-9372-dd29514e9098',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  1,
  'Día 1: Riohacha y Salinas Marinas de Manaure',
  'Encuentro con las tejedoras Wayúu y montañas blancas de sal marina.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ed1f5181-65cb-f094-3d2a-7a916ae87ef9',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  '72bebeea-3c81-fd35-9372-dd29514e9098',
  1,
  1,
  'Camellón de Riohacha y Artesanías Wayúu',
  11.545,
  -72.907,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Avenida costera frente al mar donde las artesanas de los clanes Wayúu tejen sus famosas mochilas de hilo silvestre con patrones geométricos kanasú que relatan el origen de su cosmovisión.',
  ARRAY['Comprar mochilas auténticas directamente a las tejedoras ($50.000 - $120.000 COP)', 'Paseo por el muelle de madera histórica sobre el mar (Gratis)', 'Desayuno guajiro con arepa de chichimoya y café ($12.000 COP)']::text[],
  ARRAY['Comprar las artesanías directamente a las mujeres locales para apoyar la economía familiar', 'Asegurarse de llevar billetes de baja denominación']::text[],
  ARRAY['Los patrones kanasú representan animales, constelaciones y elementos del desierto inspirados en la araña mítica Wale’kerü']::text[],
  '{"address":"Avenida La Marina, Riohacha","priceRange":"$ - Compras artesanales","dia":1,"day":1}'::jsonb,
  90,
  '{"dia":1,"day":1,"activities":["Comprar mochilas auténticas directamente a las tejedoras ($50.000 - $120.000 COP)","Paseo por el muelle de madera histórica sobre el mar (Gratis)","Desayuno guajiro con arepa de chichimoya y café ($12.000 COP)"],"datos_curiosos":["Los patrones kanasú representan animales, constelaciones y elementos del desierto inspirados en la araña mítica Wale’kerü"],"consejos":["Comprar las artesanías directamente a las mujeres locales para apoyar la economía familiar","Asegurarse de llevar billetes de baja denominación"],"location_info":{"address":"Avenida La Marina, Riohacha","priceRange":"$ - Compras artesanales","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7dba1ea5-ebe1-aebf-527b-f75e31a7f218',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  '72bebeea-3c81-fd35-9372-dd29514e9098',
  2,
  2,
  'Salinas Marítimas de Manaure',
  11.776,
  -72.445,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El mayor complejo de explotación de sal marina a cielo abierto en Colombia. Enormes piscinas de evaporación donde el agua marina pasa de azul a tonos rosados intensos coronadas por pirámides de sal reluciente.',
  ARRAY['Tour guiado por las charcas salineras con guía Wayúu local ($10.000 COP)', 'Fotografía de los flamencos rosados y las montañas de sal blanca (Gratis)', 'Explicación del proceso ancestral de cosecha manual de sal']::text[],
  ARRAY['El resplandor del sol sobre la sal es extremo; usar gafas de sol con protección UV alta', 'No caminar sobre las piscinas activas de evaporación']::text[],
  ARRAY['Manaure produce más del 70% de la sal marina que se consume en todo el territorio colombiano']::text[],
  '{"address":"Complejo Salinero, Manaure","priceRange":"$ - Tour local $10.000 COP","dia":1,"day":1}'::jsonb,
  75,
  '{"dia":1,"day":1,"activities":["Tour guiado por las charcas salineras con guía Wayúu local ($10.000 COP)","Fotografía de los flamencos rosados y las montañas de sal blanca (Gratis)","Explicación del proceso ancestral de cosecha manual de sal"],"datos_curiosos":["Manaure produce más del 70% de la sal marina que se consume en todo el territorio colombiano"],"consejos":["El resplandor del sol sobre la sal es extremo; usar gafas de sol con protección UV alta","No caminar sobre las piscinas activas de evaporación"],"location_info":{"address":"Complejo Salinero, Manaure","priceRange":"$ - Tour local $10.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f70f2365-4043-66e6-b2af-bcd64bb8b95c',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  2,
  'Día 2: Cabo de la Vela y el Faro del Atardecer',
  'Llegada al Cabo de la Vela y ascenso al faro para el atardecer desértico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fcf8afd0-32ed-0f38-a599-d6fd80617da1',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  'f70f2365-4043-66e6-b2af-bcd64bb8b95c',
  3,
  3,
  'Pilón de Azúcar (Kamaici)',
  12.238,
  -72.152,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Colina cónica sagrada para el pueblo Wayúu que emerge solitaria frente al mar Caribe. La cima ofrece una vista sobrecogedora del desierto dorado fundiéndose en las olas turquesas.',
  ARRAY['Subida a pie a la cima del cerro sagrado (Gratis - 15 minutos)', 'Baño de mar en Playa Dorada a los pies del cerro (Gratis)', 'Almuerzo de langosta fresca o chivo asado en ranchería ($35.000 - $60.000 COP)']::text[],
  ARRAY['El viento en la cima es sumamente fuerte; asegurar sombreros y lentes', 'Llevar calzado cerrado para subir por el sendero rocoso']::text[],
  ARRAY['Para la cosmogonía Wayúu, este cerro (llamado Kamaici) es el portal por donde transitan las almas de los difuntos hacia Jepirra']::text[],
  '{"address":"Cabo de la Vela, Uribia","priceRange":"$ - Entrada libre","dia":2,"day":2}'::jsonb,
  120,
  '{"dia":2,"day":2,"activities":["Subida a pie a la cima del cerro sagrado (Gratis - 15 minutos)","Baño de mar en Playa Dorada a los pies del cerro (Gratis)","Almuerzo de langosta fresca o chivo asado en ranchería ($35.000 - $60.000 COP)"],"datos_curiosos":["Para la cosmogonía Wayúu, este cerro (llamado Kamaici) es el portal por donde transitan las almas de los difuntos hacia Jepirra"],"consejos":["El viento en la cima es sumamente fuerte; asegurar sombreros y lentes","Llevar calzado cerrado para subir por el sendero rocoso"],"location_info":{"address":"Cabo de la Vela, Uribia","priceRange":"$ - Entrada libre","dia":2,"day":2}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7c043c7d-7f19-da1c-e597-6fc95f1021ae',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  'f70f2365-4043-66e6-b2af-bcd64bb8b95c',
  4,
  4,
  'El Faro del Cabo de la Vela',
  12.219,
  -72.176,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Pequeña estructura de vigía marítima erigida sobre un acantilado rocoso. Es el lugar más famoso de La Guajira para contemplar la puesta de sol en silencio absoluto sobre el mar.',
  ARRAY['Contemplar la puesta de sol sobre el horizonte infinito (Gratis)', 'Fotografía de paisajes acantilados (Gratis)', 'Dormir en chinchorro Wayúu en ranchería tradicional ($25.000 - $40.000 COP por noche)']::text[],
  ARRAY['Llegar 40 minutos antes del ocaso para encontrar buen sitio en las rocas', 'Llevar una linterna para descender hacia la ranchería una vez oscurezca']::text[],
  ARRAY['Por la noche la ausencia casi total de contaminación lumínica permite ver la Vía Láctea a simple vista con absoluta nitidez']::text[],
  '{"address":"Acantilado del Faro, Cabo de la Vela","priceRange":"$ - Entrada libre","dia":2,"day":2}'::jsonb,
  90,
  '{"dia":2,"day":2,"activities":["Contemplar la puesta de sol sobre el horizonte infinito (Gratis)","Fotografía de paisajes acantilados (Gratis)","Dormir en chinchorro Wayúu en ranchería tradicional ($25.000 - $40.000 COP por noche)"],"datos_curiosos":["Por la noche la ausencia casi total de contaminación lumínica permite ver la Vía Láctea a simple vista con absoluta nitidez"],"consejos":["Llegar 40 minutos antes del ocaso para encontrar buen sitio en las rocas","Llevar una linterna para descender hacia la ranchería una vez oscurezca"],"location_info":{"address":"Acantilado del Faro, Cabo de la Vela","priceRange":"$ - Entrada libre","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b050e845-6a30-db36-cf32-57ebb3995abd',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  3,
  'Día 3: Dunas de Taroa y Punta Gallinas',
  'Avanzando hasta el punto más al norte de América del Sur continental.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b2e7ee63-f507-fca2-763d-0b8cef4bc663',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  'b050e845-6a30-db36-cf32-57ebb3995abd',
  5,
  5,
  'Dunas de Taroa en Punta Gallinas',
  12.455,
  -71.698,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Montañas colosales de arena fina de más de 40 metros de altura que mueren directamente en las aguas bravas del Caribe. El contraste visual entre el desierto ardiente y la espuma de las olas es inolvidable.',
  ARRAY['Sandboarding o rodar por las pendientes de arena hacia la orilla del mar (Gratis / alquiler tabla $20.000 COP)', 'Baño en el mar caribeño al pie de la duna (Gratis)', 'Fotografiar el Faro de Punta Gallinas, extremo norte de Suramérica (Gratis)']::text[],
  ARRAY['Subir la duna sin zapatos para mejor tracción en la arena suave', 'El trayecto en camioneta 4x4 cruza arenales profundos; no intentar ir sin guía local experto']::text[],
  ARRAY['Punta Gallinas se encuentra a 12° 27′ de latitud norte, marcando el límite físico superior de toda la masa continental sudamericana']::text[],
  '{"address":"Dunas de Taroa, Punta Gallinas","priceRange":"$$ - Costos de expedición 4x4","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Sandboarding o rodar por las pendientes de arena hacia la orilla del mar (Gratis / alquiler tabla $20.000 COP)","Baño en el mar caribeño al pie de la duna (Gratis)","Fotografiar el Faro de Punta Gallinas, extremo norte de Suramérica (Gratis)"],"datos_curiosos":["Punta Gallinas se encuentra a 12° 27′ de latitud norte, marcando el límite físico superior de toda la masa continental sudamericana"],"consejos":["Subir la duna sin zapatos para mejor tracción en la arena suave","El trayecto en camioneta 4x4 cruza arenales profundos; no intentar ir sin guía local experto"],"location_info":{"address":"Dunas de Taroa, Punta Gallinas","priceRange":"$$ - Costos de expedición 4x4","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd2400079-432c-0263-0fb7-1a564089df1f',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  4,
  'Día 4: Retorno por Uribia y Regreso',
  'Paso por la capital indígena de Colombia y retorno a Riohacha.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9c066aa1-3a6c-1348-e23a-6aa59fdcc16d',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  'd2400079-432c-0263-0fb7-1a564089df1f',
  6,
  6,
  'Plaza de Uribia: Capital Indígena de Colombia',
  11.714,
  -72.266,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Municipio epicentro del pueblo Wayúu, declarado Capital Indígena de Colombia. Un lugar para conocer la vida cotidiana de las comunidades, su lengua wayuunaiki y su comercio tradicional.',
  ARRAY['Probar el friche de chivo tradicional con arepa de maíz ($18.000 - $28.000 COP)', 'Observar el comercio de tejidos y chinchorros de doble faz', 'Despedida de la travesía desértica antes de tomar el transporte de regreso']::text[],
  ARRAY['Comprar café o agua para el trayecto final de carretera hacia Riohacha']::text[],
  ARRAY['En Uribia más del 90% de la población pertenece a la etnia Wayúu y conserva sus clanes matrilineales']::text[],
  '{"address":"Plaza Principal, Uribia","priceRange":"$ - Comida típica","dia":4,"day":4}'::jsonb,
  90,
  '{"dia":4,"day":4,"activities":["Probar el friche de chivo tradicional con arepa de maíz ($18.000 - $28.000 COP)","Observar el comercio de tejidos y chinchorros de doble faz","Despedida de la travesía desértica antes de tomar el transporte de regreso"],"datos_curiosos":["En Uribia más del 90% de la población pertenece a la etnia Wayúu y conserva sus clanes matrilineales"],"consejos":["Comprar café o agua para el trayecto final de carretera hacia Riohacha"],"location_info":{"address":"Plaza Principal, Uribia","priceRange":"$ - Comida típica","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'a2bedada-7da6-275a-fd99-ff317d10640f',
  '2a656d80-85a5-6629-8c73-d4c09e388129',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Eje Cafetero Tradicional: Salento, Cocora y Fincas Vivas (Salento, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-eje-cafetero-cocora-salento-5d',
  'Eje Cafetero Tradicional: Salento, Cocora y Fincas Vivas',
  'Colombia',
  'Salento',
  'family',
  'Circuito familiar de 5 días por el corazón del Paisaje Cultural Cafetero, declarado Patrimonio Mundial por la UNESCO. Caminatas entre las palmas de cera más altas del planeta en el Valle de Cocora, pueblos coloridos con arquitectura de bahareque y catas de café en haciendas tradicionales.',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  85000,
  'easy',
  'es',
  4.96,
  175,
  530,
  ARRAY['Eje Cafetero', 'Salento', 'Cocora', 'Café', 'Familiar', 'UNESCO', 'Filandia']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":420000,"estimatedPerPersonMax":880000,"notes":"Willys, entradas a reservas, tours de café y restaurantes"}'::jsonb,
  ARRAY['Familias', 'Niños y adultos mayores', 'Amantes del café']::text[],
  'Todo el año; clima primaveral constante (17-23°C)',
  'Mañanas de caminatas campestres y tardes de café en plazas coloniales',
  'Plaza Bolívar de Salento, Quindío',
  ARRAY['Ruta completa de senderos y miradores', 'Guía de fincas con cata de café especial', 'Horarios de jeeps Willys tradicionales']::text[],
  ARRAY['Paseo a caballo opcional', 'Alquiler de botas de caucho', 'Comidas no estipuladas']::text[],
  ARRAY['Llevar impermeable liviano para lluvias sorpresivas de montaña', 'Calzar tenis o botas con buena suela', 'Subirse a un Jeep Willys tradicional en la plaza']::text[],
  ARRAY['Chaqueta cortavientos', 'Sombrero campesino', 'Cámara fotográfica', 'Termo de agua']::text[],
  ARRAY['Prohibido cortar o dañar la palma de cera (árbol nacional protegido)', 'No alimentar la fauna silvestre']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9c2f6063-6959-7991-134b-f16a045371e0',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  1,
  'Día 1: Salento Colonial y Mirador del Valle',
  'Llegada al pueblo más antiguo del Quindío, arquitectura de zócalos y artesanías.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9f1f986e-67f6-1dae-4f9f-1683b3b40123',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  '9c2f6063-6959-7991-134b-f16a045371e0',
  1,
  1,
  'Calle Real y Mirador Alto de la Cruz',
  4.6375,
  -75.5705,
  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80']::text[],
  'Calle peatonal adoquinada flanqueada por casas coloniales de bahareque pintadas de vivos colores con balcones cuajados de flores. Al final, una escalinata asciende hasta el mirador panorámico sobre el Valle de Cocora.',
  ARRAY['Subir los 253 escalones hasta el mirador con vista al cañón (Gratis)', 'Comprar artesanías en guadua y madera de café ($15.000 - $50.000 COP)', 'Tomar un café campesino preparado en prensa o máquina de espresso ($5.000 - $12.000 COP)']::text[],
  ARRAY['Subir al mirador al atardecer cuando la neblina comienza a descender sobre la montaña', 'Probar el postre tradicional de arequipe con queso campesino']::text[],
  ARRAY['Salento fue fundado en 1842 por colonos antioqueños y sirvió de paso crucial en la histórica Ruta del Quindío transitada por Humboldt y Bolívar']::text[],
  '{"address":"Calle Real, Salento","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Subir los 253 escalones hasta el mirador con vista al cañón (Gratis)","Comprar artesanías en guadua y madera de café ($15.000 - $50.000 COP)","Tomar un café campesino preparado en prensa o máquina de espresso ($5.000 - $12.000 COP)"],"datos_curiosos":["Salento fue fundado en 1842 por colonos antioqueños y sirvió de paso crucial en la histórica Ruta del Quindío transitada por Humboldt y Bolívar"],"consejos":["Subir al mirador al atardecer cuando la neblina comienza a descender sobre la montaña","Probar el postre tradicional de arequipe con queso campesino"],"location_info":{"address":"Calle Real, Salento","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '37837502-1259-5f48-3f9e-fc1092246c42',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  2,
  'Día 2: El Bosque de Palmas de Cera en el Valle de Cocora',
  'Senderismo entre las palmas más altas del mundo en su hábitat de niebla.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e5019537-9648-0d6c-8658-dca90b0db6a4',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  '37837502-1259-5f48-3f9e-fc1092246c42',
  2,
  2,
  'Valle de Cocora y Bosque de Niebla',
  4.643,
  -75.498,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Cuna del árbol nacional de Colombia, la Palma de Cera del Quindío (*Ceroxylon quindiuense*), que puede alcanzar hasta 60 metros de altura en laderas andinas cubiertas de pastizales y bosques nubosos.',
  ARRAY['Paseo en Jeep Willys colectivo desde la plaza de Salento ($5.000 COP por trayecto)', 'Entrada al sendero de las palmas gigantes ($10.000 - $20.000 COP)', 'Almuerzo de trucha al ajillo servida sobre patacón gigante ($30.000 - $48.000 COP)']::text[],
  ARRAY['Alquilar botas de caucho en la entrada si ha llovido ($6.000 COP)', 'Hacer el circuito corto de 2 horas si va con niños o adultos mayores']::text[],
  ARRAY['La palma de cera puede vivir más de 200 años y es el hogar exclusivo del loro orejiamarillo, especie en peligro de extinción']::text[],
  '{"address":"Valle de Cocora, Salento","priceRange":"$$ - Moderado","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Paseo en Jeep Willys colectivo desde la plaza de Salento ($5.000 COP por trayecto)","Entrada al sendero de las palmas gigantes ($10.000 - $20.000 COP)","Almuerzo de trucha al ajillo servida sobre patacón gigante ($30.000 - $48.000 COP)"],"datos_curiosos":["La palma de cera puede vivir más de 200 años y es el hogar exclusivo del loro orejiamarillo, especie en peligro de extinción"],"consejos":["Alquilar botas de caucho en la entrada si ha llovido ($6.000 COP)","Hacer el circuito corto de 2 horas si va con niños o adultos mayores"],"location_info":{"address":"Valle de Cocora, Salento","priceRange":"$$ - Moderado","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd16922cd-9734-da38-8f55-91ebbcd57c45',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  3,
  'Día 3: La Alquimia del Café en Finca Tradicional',
  'Proceso interactivo desde la semilla hasta la taza en hacienda cafetera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '88d68fa1-9090-1e41-f2fb-5bd8bcba8b46',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  'd16922cd-9734-da38-8f55-91ebbcd57c45',
  3,
  3,
  'Finca Cafetera Ocaso / Las Acacias',
  4.621,
  -75.592,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Hacienda tradicional enclavada entre laderas cafeteras donde se enseña de manera práctica la recolección selectiva manual de cerezas rojas, el beneficio, secado al sol y el tueste artesanal.',
  ARRAY['Vestirse con canasto campesino y recolectar granos maduros (Tour: $45.000 COP)', 'Taller de cata sensorial de perfiles de café (Gratis con el tour)', 'Comprar café tostado en grano recién empacado para llevar ($25.000 - $45.000 COP)']::text[],
  ARRAY['Llevar pantalón largo y repelente para caminar entre los cafetales', 'Preguntar por las variedades Geisha y Borbón Rosado']::text[],
  ARRAY['En Colombia el café se recolecta exclusivamente a mano grano a grano para garantizar que solo las cerezas en su punto óptimo de azúcar se procesen']::text[],
  '{"address":"Vereda Palestina, Salento","priceRange":"$$ - Tour $45.000 COP","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Vestirse con canasto campesino y recolectar granos maduros (Tour: $45.000 COP)","Taller de cata sensorial de perfiles de café (Gratis con el tour)","Comprar café tostado en grano recién empacado para llevar ($25.000 - $45.000 COP)"],"datos_curiosos":["En Colombia el café se recolecta exclusivamente a mano grano a grano para garantizar que solo las cerezas en su punto óptimo de azúcar se procesen"],"consejos":["Llevar pantalón largo y repelente para caminar entre los cafetales","Preguntar por las variedades Geisha y Borbón Rosado"],"location_info":{"address":"Vereda Palestina, Salento","priceRange":"$$ - Tour $45.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'be99239f-0f5c-abbd-2b48-9d49da17e186',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  4,
  'Día 4: Filandia: Cestería y la Colina Iluminada',
  'El pueblo más lindo del Quindío, famoso por su cestería en bejuco y gastronomía.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e355fc3e-ecec-4c22-c190-832d5e1cda79',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  'be99239f-0f5c-abbd-2b48-9d49da17e186',
  4,
  4,
  'Mirador Colina Iluminada y Barrio de los Artesanos',
  4.675,
  -75.662,
  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo vecino a Salento que conserva una atmósfera apacible y arquitectura impecable. Cuenta con una torre mirador de madera de 27 metros construida con maderas nativas y guadua.',
  ARRAY['Subir al Mirador Colina Iluminada con vista a los tres departamentos del Eje Cafetero ($10.000 COP)', 'Conocer a los maestros cesteros del bejuco en el Centro de Interpretación ($5.000 COP)', 'Almorzar en el célebre restaurante Helena Adentro ($40.000 - $75.000 COP)']::text[],
  ARRAY['Filandia queda a solo 30 minutos de Salento en Willys o taxi ($10.000 COP pasaje colectivo)', 'Reservar mesa con anticipación en Helena Adentro para fines de semana']::text[],
  ARRAY['El nombre de Filandia proviene del latín *Filia* (hija) y del inglés *Andia* (Andes), significando "Hija de los Andes"']::text[],
  '{"address":"Mirador Colina Iluminada, Filandia","priceRange":"$$ - Moderado","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Subir al Mirador Colina Iluminada con vista a los tres departamentos del Eje Cafetero ($10.000 COP)","Conocer a los maestros cesteros del bejuco en el Centro de Interpretación ($5.000 COP)","Almorzar en el célebre restaurante Helena Adentro ($40.000 - $75.000 COP)"],"datos_curiosos":["El nombre de Filandia proviene del latín *Filia* (hija) y del inglés *Andia* (Andes), significando \"Hija de los Andes\""],"consejos":["Filandia queda a solo 30 minutos de Salento en Willys o taxi ($10.000 COP pasaje colectivo)","Reservar mesa con anticipación en Helena Adentro para fines de semana"],"location_info":{"address":"Mirador Colina Iluminada, Filandia","priceRange":"$$ - Moderado","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '91858df9-34ba-ddec-1f53-266aef7888bf',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  5,
  'Día 5: Termales de Santa Rosa de Cabal y Despedida',
  'Relajación absoluta en piscinas termales naturales rodeadas de cascadas frías.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0d1250ad-2e35-ca00-8dfb-2f36505118fe',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  '91858df9-34ba-ddec-1f53-266aef7888bf',
  5,
  5,
  'Termales Balneario Santa Rosa de Cabal',
  4.862,
  -75.548,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Aguas termales minerales que brotan de la tierra volcánica a más de 40°C, rodeadas por una cascada natural de agua fría de 95 metros de caída libre que desciende por la montaña verde.',
  ARRAY['Baño hidrotermal en piscinas escalonadas (Entrada: $45.000 - $65.000 COP según temporada)', 'Contraste térmico bajo el rocío de la cascada natural (Gratis con entrada)', 'Probar el famoso chorizo santarrosano tradicional con arepa ($15.000 - $22.000 COP)']::text[],
  ARRAY['Llevar sandalias antideslizantes y toalla', 'Ideal visitar en la mañana o al atardecer para una experiencia relajante']::text[],
  ARRAY['Las aguas termales de Santa Rosa son telúricas, inodoras y ricas en minerales alcalinos beneficiosos para la piel y articulaciones']::text[],
  '{"address":"Kilómetro 4 Vereda San Ramón, Santa Rosa de Cabal","priceRange":"$$ - Entrada $45.000 - $65.000 COP","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Baño hidrotermal en piscinas escalonadas (Entrada: $45.000 - $65.000 COP según temporada)","Contraste térmico bajo el rocío de la cascada natural (Gratis con entrada)","Probar el famoso chorizo santarrosano tradicional con arepa ($15.000 - $22.000 COP)"],"datos_curiosos":["Las aguas termales de Santa Rosa son telúricas, inodoras y ricas en minerales alcalinos beneficiosos para la piel y articulaciones"],"consejos":["Llevar sandalias antideslizantes y toalla","Ideal visitar en la mañana o al atardecer para una experiencia relajante"],"location_info":{"address":"Kilómetro 4 Vereda San Ramón, Santa Rosa de Cabal","priceRange":"$$ - Entrada $45.000 - $65.000 COP","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '20ee0cb9-f46c-ff92-0507-02a3338bbc58',
  'e60779c4-4813-9e7b-ae82-9764e6a9d363',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Bogotá Histórica y Villa de Leyva: Tesoros Andinos y Fósiles (Bogotá, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-bogota-villa-de-leyva-5d',
  'Bogotá Histórica y Villa de Leyva: Tesoros Andinos y Fósiles',
  'Colombia',
  'Bogotá',
  'historical',
  'Travesía histórica de 5 días desde la cosmopolita capital andina hasta la villa colonial empedrada más majestuosa de Colombia. Incluye el Museo del Oro, el santuario de Monserrate, la Catedral de Sal de Zipaquirá y los misterios paleontológicos de Villa de Leyva.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  190000,
  'easy',
  'es',
  4.93,
  130,
  410,
  ARRAY['Bogotá', 'Villa de Leyva', 'Zipaquirá', 'Historia', 'Cultura', 'Colonial']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":400000,"estimatedPerPersonMax":850000,"notes":"Entradas museos, funicular, Catedral de Sal y bus intermunicipal"}'::jsonb,
  ARRAY['Viajeros culturales', 'Historiadores', 'Familias']::text[],
  'Diciembre a Marzo y Julio a Agosto (menos lluvias en sabana)',
  'Salidas matutinas para optimizar trayectos intermunicipales',
  'Plaza de Bolívar, Bogotá',
  ARRAY['Itinerario histórico documentado', 'Información de boletería de museos y catedral subterránea', 'Ruta de casonas coloniales']::text[],
  ARRAY['Boletos de teleférico / funicular Monserrate', 'Entrada a Catedral de Sal', 'Transportes interurbanos']::text[],
  ARRAY['Llevar abrigo y paraguas (el clima en Bogotá y Villa de Leyva refresca bastante por las noches: 8-14°C)', 'Aclimatarse al llegar (Bogotá está a 2.600 msnm)']::text[],
  ARRAY['Chaqueta o suéter abrigado', 'Zapatos cómodos para empedrado', 'Gafas de sol', 'Cámara']::text[],
  ARRAY['No tocar las piezas orfebres ni los fósiles en exhibición']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '67068456-d668-1b42-8941-ba84bb60f220',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  1,
  'Día 1: Centro Histórico de La Candelaria y Museo del Oro',
  'Exploración del corazón fundacional de Bogotá y su legado precolombino.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '735568a6-645f-3d9a-e82e-4be9b061a064',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '67068456-d668-1b42-8941-ba84bb60f220',
  1,
  1,
  'Museo del Oro del Banco de la República',
  4.6018,
  -74.072,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Alberga la colección de orfebrería prehispánica más grande del planeta con más de 34.000 piezas maestras de oro y tumbaga de las culturas Muisca, Quimbaya, Calima y Tayrona.',
  ARRAY['Admirar la mítica Balsa Muisca de la leyenda de El Dorado (Entrada: $5.000 COP / domingos gratis)', 'Experimentar la sala oscura de la Ofrenda con cantos ceremoniales (Gratis con entrada)', 'Comprar réplicas certificadas en la tienda oficial del museo ($30.000 - $120.000 COP)']::text[],
  ARRAY['Cierra los días lunes; planificar la visita de martes a domingo', 'Alquilar la audioguía multilingüe para profundizar en la cosmovisión indígena ($10.000 COP)']::text[],
  ARRAY['La Balsa Muisca fue encontrada en 1969 por tres campesinos dentro de una cueva en el municipio de Pasca dentro de una vasija de barro']::text[],
  '{"address":"Carrera 6 # 15-88, Parque Santander","priceRange":"$ - Entrada $5.000 COP","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Admirar la mítica Balsa Muisca de la leyenda de El Dorado (Entrada: $5.000 COP / domingos gratis)","Experimentar la sala oscura de la Ofrenda con cantos ceremoniales (Gratis con entrada)","Comprar réplicas certificadas en la tienda oficial del museo ($30.000 - $120.000 COP)"],"datos_curiosos":["La Balsa Muisca fue encontrada en 1969 por tres campesinos dentro de una cueva en el municipio de Pasca dentro de una vasija de barro"],"consejos":["Cierra los días lunes; planificar la visita de martes a domingo","Alquilar la audioguía multilingüe para profundizar en la cosmovisión indígena ($10.000 COP)"],"location_info":{"address":"Carrera 6 # 15-88, Parque Santander","priceRange":"$ - Entrada $5.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c145061e-c428-e0e0-3c09-d1dae45a145a',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '67068456-d668-1b42-8941-ba84bb60f220',
  2,
  2,
  'Plaza de Bolívar y Callejón del Chorro de Quevedo',
  4.5981,
  -74.076,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Centro cívico e histórico de Colombia, rodeado por el Capitolio Nacional, el Palacio de Justicia, la Catedral Primada y la Alcaldía Mayor. A pocas cuadras se encuentra el Chorro de Quevedo, rincón bohemio fundacional.',
  ARRAY['Fotografiar la arquitectura neoclásica y republicana de la plaza (Gratis)', 'Probar un ajiaco santafereño tradicional con alcaparras y crema de leche ($28.000 - $45.000 COP)', 'Disfrutar de un vaso de chicha de maíz en el Chorro de Quevedo ($5.000 COP)']::text[],
  ARRAY['El Chorro de Quevedo tiene gran vida universitaria y cuenteros al atardecer', 'Cuidar pertenencias en zonas concurridas']::text[],
  ARRAY['En el Chorro de Quevedo estableció Gonzalo Jiménez de Quesada su guarnición militar con 12 chozas en 1538']::text[],
  '{"address":"Carrera 7 con Calle 11, La Candelaria","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Fotografiar la arquitectura neoclásica y republicana de la plaza (Gratis)","Probar un ajiaco santafereño tradicional con alcaparras y crema de leche ($28.000 - $45.000 COP)","Disfrutar de un vaso de chicha de maíz en el Chorro de Quevedo ($5.000 COP)"],"datos_curiosos":["En el Chorro de Quevedo estableció Gonzalo Jiménez de Quesada su guarnición militar con 12 chozas en 1538"],"consejos":["El Chorro de Quevedo tiene gran vida universitaria y cuenteros al atardecer","Cuidar pertenencias en zonas concurridas"],"location_info":{"address":"Carrera 7 con Calle 11, La Candelaria","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1ef43644-a144-8e07-488f-a9b028033ea9',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  2,
  'Día 2: Cerro de Monserrate y Sabores Andinos',
  'Ascenso a 3.152 metros con vista panorámica de toda la sabana de Bogotá.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '49a14420-fb6e-fdcc-cd0d-66a5aaec8e58',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '1ef43644-a144-8e07-488f-a9b028033ea9',
  3,
  3,
  'Santuario del Señor Caído de Monserrate',
  4.6056,
  -74.0555,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Guardián tutelar de la capital, coronado por una basílica blanca del siglo XVII que custodia la venerada imagen del Señor Caído. Ofrece un mirador inigualable sobre la inmensa urbe de 8 millones de habitantes.',
  ARRAY['Subida en teleférico o funicular panorámico (Ticket ida y vuelta: ~$27.000 COP)', 'Visita al santuario y recorrido por las estaciones del viacrucis en bronce (Gratis)', 'Probar agua de panela con queso y almojábana en los puestos del mirador ($8.000 - $14.000 COP)']::text[],
  ARRAY['Subir en la mañana para encontrar el cielo despejado antes de que bajen nubes', 'Llevar abrigo; en la cumbre la temperatura suele rondar los 10°C con viento']::text[],
  ARRAY['Los cerros de Monserrate y Guadalupe eran considerados lugares sagrados por los muiscas mucho antes de la colonia, asociados a los solsticios']::text[],
  '{"address":"Cerro de Monserrate","priceRange":"$ - Funicular $27.000 COP","dia":2,"day":2}'::jsonb,
  150,
  '{"dia":2,"day":2,"activities":["Subida en teleférico o funicular panorámico (Ticket ida y vuelta: ~$27.000 COP)","Visita al santuario y recorrido por las estaciones del viacrucis en bronce (Gratis)","Probar agua de panela con queso y almojábana en los puestos del mirador ($8.000 - $14.000 COP)"],"datos_curiosos":["Los cerros de Monserrate y Guadalupe eran considerados lugares sagrados por los muiscas mucho antes de la colonia, asociados a los solsticios"],"consejos":["Subir en la mañana para encontrar el cielo despejado antes de que bajen nubes","Llevar abrigo; en la cumbre la temperatura suele rondar los 10°C con viento"],"location_info":{"address":"Cerro de Monserrate","priceRange":"$ - Funicular $27.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '318f0f64-c8e1-6285-9542-12fb7b1c5b87',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  3,
  'Día 3: Catedral de Sal de Zipaquirá (Camino a Villa de Leyva)',
  'La primera maravilla arquitectónica de Colombia excavada en una mina de sal.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '78fda7db-a588-0f04-e017-a866b09bd312',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '318f0f64-c8e1-6285-9542-12fb7b1c5b87',
  4,
  4,
  'Catedral de Sal de Zipaquirá',
  5.019,
  -74.009,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Monumento arquitectónico subterráneo construido en el interior de una mina de sal a 180 metros bajo tierra. Cuenta con un monumental vía crucis tallado en roca salina y una cruz central de 16 metros de altura iluminada.',
  ARRAY['Recorrido subterráneo con audioguía oficial (Entrada general: ~$60.000 COP / extranjero: ~$98.000 COP)', 'Show de luces LED en la nave central de la catedral (Gratis con entrada)', 'Probar obleas con arequipe y mora en el parque central de Zipaquirá ($6.000 COP)']::text[],
  ARRAY['La temperatura dentro de la mina es constante a 14°C; llevar chaqueta cómoda', 'El bus desde el Portal Norte de Bogotá a Zipaquirá tarda 45 minutos ($8.500 COP)']::text[],
  ARRAY['Los depósitos de sal de Zipaquirá se formaron hace más de 250 millones de años por la evaporación de un antiguo mar interior cretácico']::text[],
  '{"address":"Parque de la Sal, Zipaquirá","priceRange":"$$ - Entrada oficial","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Recorrido subterráneo con audioguía oficial (Entrada general: ~$60.000 COP / extranjero: ~$98.000 COP)","Show de luces LED en la nave central de la catedral (Gratis con entrada)","Probar obleas con arequipe y mora en el parque central de Zipaquirá ($6.000 COP)"],"datos_curiosos":["Los depósitos de sal de Zipaquirá se formaron hace más de 250 millones de años por la evaporación de un antiguo mar interior cretácico"],"consejos":["La temperatura dentro de la mina es constante a 14°C; llevar chaqueta cómoda","El bus desde el Portal Norte de Bogotá a Zipaquirá tarda 45 minutos ($8.500 COP)"],"location_info":{"address":"Parque de la Sal, Zipaquirá","priceRange":"$$ - Entrada oficial","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '669b343c-49c4-f9de-a7e4-e4e5f695705c',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  4,
  'Día 4: Villa de Leyva: La Gran Plaza y Calles Empedradas',
  'Llegada a la joya colonial de Boyacá, arquitectura blanca y aire seco.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c6799be6-6a15-2ff9-8504-d5cf7fdc8759',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '669b343c-49c4-f9de-a7e4-e4e5f695705c',
  5,
  5,
  'Plaza Mayor de Villa de Leyva',
  5.6325,
  -73.5245,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Con 14.000 metros cuadrados completamente empedrados con cantos rodados, es una de las plazas coloniales más extensas de toda Hispanoamérica. Está rodeada de casonas encaladas de blanco, balcones de madera y la iglesia parroquial de 1608.',
  ARRAY['Caminar por la inmensidad empedrada de la plaza y tomar fotos panorámicas (Gratis)', 'Cena gourmet con vino boyacense en los restaurantes de los arcos ($45.000 - $80.000 COP)', 'Degustar amasijos típicos: almojábanas, garullas y pan de yuca ($5.000 - $10.000 COP)']::text[],
  ARRAY['Usar zapatos planos y cómodos; los cantos rodados pueden ser difíciles de caminar con tacones o calzado liso', 'En la noche la iluminación tenue de los faroles coloniales crea un ambiente mágico']::text[],
  ARRAY['La pila de agua de piedra tallada en el centro de la plaza surtió de agua potable a los habitantes durante más de cuatro siglos']::text[],
  '{"address":"Plaza Mayor, Villa de Leyva, Boyacá","priceRange":"$ - Acceso libre","dia":4,"day":4}'::jsonb,
  120,
  '{"dia":4,"day":4,"activities":["Caminar por la inmensidad empedrada de la plaza y tomar fotos panorámicas (Gratis)","Cena gourmet con vino boyacense en los restaurantes de los arcos ($45.000 - $80.000 COP)","Degustar amasijos típicos: almojábanas, garullas y pan de yuca ($5.000 - $10.000 COP)"],"datos_curiosos":["La pila de agua de piedra tallada en el centro de la plaza surtió de agua potable a los habitantes durante más de cuatro siglos"],"consejos":["Usar zapatos planos y cómodos; los cantos rodados pueden ser difíciles de caminar con tacones o calzado liso","En la noche la iluminación tenue de los faroles coloniales crea un ambiente mágico"],"location_info":{"address":"Plaza Mayor, Villa de Leyva, Boyacá","priceRange":"$ - Acceso libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b7f26ecd-f9a6-eb94-17db-b82ba6acb27a',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  5,
  'Día 5: Paleontología, Fósiles y Pozos Azules',
  'Misterios de los dinosaurios marinos que habitaron la región hace 110 millones de años.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'dfb6eb96-3009-3410-2e10-890ab8877403',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  'b7f26ecd-f9a6-eb94-17db-b82ba6acb27a',
  6,
  6,
  'Museo El Fósil y Pozos Azules',
  5.645,
  -73.548,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Museo comunitario erigido alrededor del esqueleto casi completo de un *Kronosaurus boyacensis*, un reptil marino carnívoro gigante de 115 millones de años hallado *in situ* por campesinos en 1977. Cerca se encuentran los Pozos Azules, piscinas artificiales en medio del desierto.',
  ARRAY['Observar el fósil gigante preservado en la misma roca donde murió (Entrada: $12.000 COP)', 'Caminata escénica por los senderos de los Pozos Azules ($15.000 COP)', 'Visita a la singular Casa Terracota, la cerámica habitable más grande del mundo ($20.000 COP)']::text[],
  ARRAY['Se puede alquilar bicicleta o cuatrimoto para recorrer el circuito de los fósiles ($40.000 - $70.000 COP/hora)', 'Llevar protector solar; el sol en el valle es intenso']::text[],
  ARRAY['El Kronosaurus medía casi 10 metros de largo y poseía mandíbulas más poderosas que las de un tiranosaurio rex']::text[],
  '{"address":"Vereda Monquirá, Villa de Leyva","priceRange":"$ - Entradas combinadas ~$30.000 COP","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Observar el fósil gigante preservado en la misma roca donde murió (Entrada: $12.000 COP)","Caminata escénica por los senderos de los Pozos Azules ($15.000 COP)","Visita a la singular Casa Terracota, la cerámica habitable más grande del mundo ($20.000 COP)"],"datos_curiosos":["El Kronosaurus medía casi 10 metros de largo y poseía mandíbulas más poderosas que las de un tiranosaurio rex"],"consejos":["Se puede alquilar bicicleta o cuatrimoto para recorrer el circuito de los fósiles ($40.000 - $70.000 COP/hora)","Llevar protector solar; el sol en el valle es intenso"],"location_info":{"address":"Vereda Monquirá, Villa de Leyva","priceRange":"$ - Entradas combinadas ~$30.000 COP","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '6a971b1d-82d7-6fb5-d3fe-7c737969a064',
  'ca2cebb2-dce5-3769-236f-f1532a178303',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Santander Extremo: San Gil, Cañón del Chicamocha y Barichara (San Gil, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-santander-extremo-sangil-barichara-5d',
  'Santander Extremo: San Gil, Cañón del Chicamocha y Barichara',
  'Colombia',
  'San Gil',
  'sports',
  'Circuito de 5 días por la tierra de los comuneros. Combina deportes extremos de clase mundial (rafting en rápidos clase IV, parapente en cañones colosales) con la serenidad pétrea y artística de Barichara, catalogado como el pueblo más bello de Colombia.',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  160000,
  'intense',
  'es',
  4.94,
  140,
  450,
  ARRAY['Santander', 'San Gil', 'Chicamocha', 'Barichara', 'Deportes Extremos', 'Rafting', 'Aventura']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":450000,"estimatedPerPersonMax":980000,"notes":"Rafting Río Fonce, teleférico Chicamocha, parapente y posadas"}'::jsonb,
  ARRAY['Aventureros', 'Jóvenes y grupos de amigos', 'Amantes de la adrenalina']::text[],
  'Diciembre a Marzo y Junio a Agosto (condiciones óptimas de viento y río)',
  'Actividades de aventura por la mañana temprano por clima y vientos',
  'Parque El Gallineral, San Gil',
  ARRAY['Ruta completa de deportes de aventura', 'Coordenadas de agencias certificadas', 'Guía arquitectónica del Camino Real de Barichara']::text[],
  ARRAY['Vuelo en parapente', 'Descenso de rafting', 'Alquiler de equipos']::text[],
  ARRAY['Contratar agencias de aventura con sellos de certificación de turismo activo vigentes', 'Llevar zapatillas deportivas que se puedan mojar']::text[],
  ARRAY['Ropa deportiva de secado rápido', 'Protector solar resistente al agua', 'Muda de ropa extra', 'Gorra con cordón']::text[],
  ARRAY['Obligatorio uso de casco y chaleco salvavidas en todas las actividades acuáticas y aéreas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '324434eb-89c1-f415-8a6b-3487c6cda219',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  1,
  'Día 1: San Gil: Capital de la Aventura y Parque El Gallineral',
  'Llegada a San Gil y aclimatación entre ceibas centenarias y musgo barba de viejo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '40717a74-3cb6-487f-496a-ad8f18908da9',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  '324434eb-89c1-f415-8a6b-3487c6cda219',
  1,
  1,
  'Parque Natural El Gallineral',
  6.554,
  -73.136,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Hermosa isla natural de 4 hectáreas formada por dos brazos del río Fonce. Está poblada por gigantescos árboles de gallinero cubiertos por lánguidas cortinas de musgo plateado ("barba de viejo") que crean un ambiente casi fantástico.',
  ARRAY['Caminata por senderos ecológicos bajo las barbas de viejo (Entrada: $6.000 COP)', 'Piscina natural alimentada por aguas del manantial (Gratis con entrada)', 'Probar carne oreada santandereana con arepa de maíz pelado ($22.000 - $35.000 COP)']::text[],
  ARRAY['Llevar repelente de insectos para la caminata ribereña', 'Excelente lugar para descansar tras el viaje por carretera']::text[],
  ARRAY['El musgo "barba de viejo" (*Tillandsia usneoides*) es un bioindicador de aire puro; solo crece donde no hay polución industrial']::text[],
  '{"address":"Malecón Turístico, San Gil","priceRange":"$ - Entrada $6.000 COP","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Caminata por senderos ecológicos bajo las barbas de viejo (Entrada: $6.000 COP)","Piscina natural alimentada por aguas del manantial (Gratis con entrada)","Probar carne oreada santandereana con arepa de maíz pelado ($22.000 - $35.000 COP)"],"datos_curiosos":["El musgo \"barba de viejo\" (*Tillandsia usneoides*) es un bioindicador de aire puro; solo crece donde no hay polución industrial"],"consejos":["Llevar repelente de insectos para la caminata ribereña","Excelente lugar para descansar tras el viaje por carretera"],"location_info":{"address":"Malecón Turístico, San Gil","priceRange":"$ - Entrada $6.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4438d63d-dad1-46d4-9d96-e922c0e5090f',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  2,
  'Día 2: Descenso en Rafting por el Río Fonce',
  'Adrenalina en los rápidos de agua viva y tarde de café.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5a73c573-dc86-ca3c-8e00-35740ba4a178',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  '4438d63d-dad1-46d4-9d96-e922c0e5090f',
  2,
  2,
  'Río Fonce: Rápidos Clase III',
  6.55,
  -73.14,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El cauce natural más popular de Colombia para rafting comercial seguro y emocionante. Un recorrido de 11 kilómetros con rápidos de clase III ("La Curva", "El Remolino") rodeados de naturaleza verde.',
  ARRAY['Descenso guiado en balsa inflable con instructores certificados ($50.000 - $65.000 COP por persona)', 'Saltos de prueba al agua en pozas mansas (Incluido en el tour)', 'Reportaje fotográfico digital de acción ($20.000 COP opcional)']::text[],
  ARRAY['No llevar joyas, anillos ni relojes que puedan perderse en el río', 'Usar tenis viejos amarrados, no chancletas ni sandalias sueltas']::text[],
  ARRAY['San Gil fue declarada oficialmente Capital Turística de Santander en 2004 gracias a su desarrollo pionero de deportes de aventura']::text[],
  '{"address":"Punto de partida El Arenal, Río Fonce","priceRange":"$$ - Actividad ~$55.000 COP","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Descenso guiado en balsa inflable con instructores certificados ($50.000 - $65.000 COP por persona)","Saltos de prueba al agua en pozas mansas (Incluido en el tour)","Reportaje fotográfico digital de acción ($20.000 COP opcional)"],"datos_curiosos":["San Gil fue declarada oficialmente Capital Turística de Santander en 2004 gracias a su desarrollo pionero de deportes de aventura"],"consejos":["No llevar joyas, anillos ni relojes que puedan perderse en el río","Usar tenis viejos amarrados, no chancletas ni sandalias sueltas"],"location_info":{"address":"Punto de partida El Arenal, Río Fonce","priceRange":"$$ - Actividad ~$55.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b2dd64c4-8616-4e11-ac62-167de08797b2',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  3,
  'Día 3: El Majestuoso Cañón del Chicamocha y Teleférico',
  'Uno de los cañones más profundos del mundo y vistas colosales de la cordillera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7dbfd30b-826f-fbb0-03c8-65e0bd8c8921',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  'b2dd64c4-8616-4e11-ac62-167de08797b2',
  3,
  3,
  'Parque Nacional del Chicamocha (PANACHI)',
  6.789,
  -73.003,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Abismo geológico colosal con más de 2.000 metros de profundidad. Cuenta con un teleférico de 6.3 kilómetros que cruza de lado a lado el abismo hasta la Mesa de los Santos, y el Monumento a la Santandereanidad erigido sobre una hoja de tabaco.',
  ARRAY['Cruce en teleférico sobre el cañón (Entrada Parque + Teleférico: ~$65.000 COP)', 'Vuelo en parapente tándem sobre el abismo del cañón ($200.000 - $250.000 COP)', 'Almuerzo típico de cabro con pepitoria ($30.000 - $45.000 COP)']::text[],
  ARRAY['Llevar sombrero con barboquejo para que no se vuele con el viento huracanado del mirador', 'El teleférico puede suspenderse temporalmente por ráfagas de viento fuertes; tener paciencia']::text[],
  ARRAY['El Cañón del Chicamocha es más profundo que el Gran Cañón del Colorado, superando los dos kilómetros desde la cima hasta el lecho del río']::text[],
  '{"address":"Kilómetro 54 Vía Bucaramanga - San Gil","priceRange":"$$$ - Parque y atracciones","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Cruce en teleférico sobre el cañón (Entrada Parque + Teleférico: ~$65.000 COP)","Vuelo en parapente tándem sobre el abismo del cañón ($200.000 - $250.000 COP)","Almuerzo típico de cabro con pepitoria ($30.000 - $45.000 COP)"],"datos_curiosos":["El Cañón del Chicamocha es más profundo que el Gran Cañón del Colorado, superando los dos kilómetros desde la cima hasta el lecho del río"],"consejos":["Llevar sombrero con barboquejo para que no se vuele con el viento huracanado del mirador","El teleférico puede suspenderse temporalmente por ráfagas de viento fuertes; tener paciencia"],"location_info":{"address":"Kilómetro 54 Vía Bucaramanga - San Gil","priceRange":"$$$ - Parque y atracciones","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd26e3caa-91fe-5b3a-e500-06a31f50adfa',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  4,
  'Día 4: Barichara: Arquitectura de Piedra y Escultores',
  'El pueblo más lindo de Colombia, tallado en piedra amarilla por maestros canteros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3dd06a68-fd4f-6e49-893f-e713141bd0e8',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  'd26e3caa-91fe-5b3a-e500-06a31f50adfa',
  4,
  4,
  'Catedral de la Inmaculada Concepción y Mirador del Río Suárez',
  6.636,
  -73.224,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Monumento nacional de piedra caliza dorada que adquiere tonos ocres y dorados intensos con la luz del atardecer. Sus calles de tapia pisada albergan talleres de talladores de piedra, tejedores y papel artesanal de fique.',
  ARRAY['Visitar el interior de la catedral sostenida por 10 columnas monolíticas (Gratis)', 'Caminar hasta el Mirador de Barichara sobre el cañón del río Suárez (Gratis)', 'Taller práctico en la Fundación San Lorenzo de elaboración de papel de fique ($15.000 COP)']::text[],
  ARRAY['Barichara queda a solo 30 minutos de San Gil en bus local ($6.000 COP)', 'Al atardecer la temperatura es perfecta para pasear por las calles desiertas']::text[],
  ARRAY['Toda la catedral y las calles fueron labradas a mano por canteros locales con piedra extraída de las canteras amarillas de la meseta']::text[],
  '{"address":"Plaza Principal, Barichara","priceRange":"$ - Acceso libre","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Visitar el interior de la catedral sostenida por 10 columnas monolíticas (Gratis)","Caminar hasta el Mirador de Barichara sobre el cañón del río Suárez (Gratis)","Taller práctico en la Fundación San Lorenzo de elaboración de papel de fique ($15.000 COP)"],"datos_curiosos":["Toda la catedral y las calles fueron labradas a mano por canteros locales con piedra extraída de las canteras amarillas de la meseta"],"consejos":["Barichara queda a solo 30 minutos de San Gil en bus local ($6.000 COP)","Al atardecer la temperatura es perfecta para pasear por las calles desiertas"],"location_info":{"address":"Plaza Principal, Barichara","priceRange":"$ - Acceso libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '52a5a145-474f-10b2-fa8e-1066079b110f',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  5,
  'Día 5: Senderismo por el Camino Real de Lengerke a Guane',
  'Caminata histórica empedrada del siglo XIX hacia el pueblo fósil de Guane.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b6414aef-0db0-14fa-65cf-d2cab9f3e577',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  '52a5a145-474f-10b2-fa8e-1066079b110f',
  5,
  5,
  'Camino Real de Barichara a Guane',
  6.645,
  -73.238,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Sendero histórico empedrado de 5.5 kilómetros construido a mediados del siglo XIX por el ingeniero alemán Geo von Lengerke. Desciende suavemente por la falda de la meseta ofreciendo vistas imponentes de la cordillera hasta el diminuto y colonial caserío de Guane.',
  ARRAY['Caminata ecológica y fotográfica de 2 horas por el sendero histórico (Gratis)', 'Visita al Museo Arqueológico y Paleontológico de Guane ($8.000 COP)', 'Probar el sabajón casero de Guane y helados artesanales ($6.000 - $12.000 COP)']::text[],
  ARRAY['Iniciar la caminata antes de las 8:30 AM para evitar el calor sofocante del mediodía', 'Para regresar de Guane a Barichara se puede tomar el bus chiva local ($4.000 COP)']::text[],
  ARRAY['En el museo de Guane se conserva la momia indígena Guane de una mujer joven con deformación craneal ritual prehispánica']::text[],
  '{"address":"Salida Glorieta de Barichara hacia Guane","priceRange":"$ - Senderismo libre","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Caminata ecológica y fotográfica de 2 horas por el sendero histórico (Gratis)","Visita al Museo Arqueológico y Paleontológico de Guane ($8.000 COP)","Probar el sabajón casero de Guane y helados artesanales ($6.000 - $12.000 COP)"],"datos_curiosos":["En el museo de Guane se conserva la momia indígena Guane de una mujer joven con deformación craneal ritual prehispánica"],"consejos":["Iniciar la caminata antes de las 8:30 AM para evitar el calor sofocante del mediodía","Para regresar de Guane a Barichara se puede tomar el bus chiva local ($4.000 COP)"],"location_info":{"address":"Salida Glorieta de Barichara hacia Guane","priceRange":"$ - Senderismo libre","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '661085cc-ca34-0db8-e87f-48b153a962a2',
  '7383dfe0-8d25-584c-b93c-8b0b1863494d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Medellín Innovadora, Guatapé y Santa Fe de Antioquia (Medellín, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-medellin-guatape-santafe-5d',
  'Medellín Innovadora, Guatapé y Santa Fe de Antioquia',
  'Colombia',
  'Medellín',
  'urban',
  'Circuito de 5 días que captura la vibrante transformación urbana y social de Medellín (la Ciudad de la Eterna Primavera), combinada con la subida a los 740 escalones del monolito de Guatapé y el viaje al pasado colonial de Santa Fe de Antioquia.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  175000,
  'moderate',
  'es',
  4.96,
  188,
  590,
  ARRAY['Medellín', 'Guatapé', 'Comuna 13', 'Santa Fe de Antioquia', 'Urbano', 'Metrocable']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":390000,"estimatedPerPersonMax":820000,"notes":"Metro, entradas a museos, subida al Peñol y gastronomía paisa"}'::jsonb,
  ARRAY['Viajeros cosmopolitas', 'Amantes del arte urbano', 'Aventureros']::text[],
  'Todo el año; agosto es sensacional por la Feria de las Flores',
  'Tours urbanos matutinos y tarde/noche en Provenza y El Poblado',
  'Estación Metro San Antonio / Plaza Botero',
  ARRAY['Ruta completa del sistema integrado Metro y Metrocable', 'Itinerario del Graffitour comunitario', 'Ruta de zócalos de Guatapé']::text[],
  ARRAY['Boleto de ascenso a la Piedra del Peñol', 'Paseo en lancha en represa', 'Tarjeta Cívica Metro']::text[],
  ARRAY['Comprar la tarjeta Cívica Eventual en cualquier taquilla del Metro ($10.000 COP)', 'Llevar calzado deportivo para subir los escalones del Peñol']::text[],
  ARRAY['Ropa cómoda y ligera', 'Chaqueta liviana para la noche', 'Gafas de sol', 'Cámara fotográfica']::text[],
  ARRAY['Respetar la memoria de las víctimas en los recorridos de memoria histórica de la Comuna 13']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1c8c0fc0-c582-195f-8f49-f8fb4e984446',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  1,
  'Día 1: Medellín Cultural: Plaza Botero y Metrocable Arví',
  'Las esculturas monumentales de Fernando Botero y el vuelo en teleférico sobre el valle.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a84137d3-50d3-ea25-a7cd-6d7ae72c8349',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  '1c8c0fc0-c582-195f-8f49-f8fb4e984446',
  1,
  1,
  'Plaza Botero y Museo de Antioquia',
  6.2526,
  -75.5683,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Parque urbano al aire libre que reúne 23 esculturas monumentales en bronce donadas por el maestro Fernando Botero. Flanqueado por el imponente Palacio de la Cultura Rafael Uribe Uribe y el Museo de Antioquia.',
  ARRAY['Fotografiar las 23 esculturas de Botero en la plaza pública (Gratis)', 'Entrar a las salas de pintura del maestro Botero y Pedro Nel Gómez en el Museo de Antioquia (Entrada: $24.000 COP)', 'Tomar un tinto campesino en los cafés tradicionales del centro ($3.000 COP)']::text[],
  ARRAY['Visitar en la mañana cuando la plaza está activa y vigilada por la policía turística', 'El Palacio de la Cultura tiene una terraza mirador de acceso libre']::text[],
  ARRAY['Botero donó personalmente las esculturas con la condición expresa de que estuvieran en un parque público al alcance del pueblo']::text[],
  '{"address":"Carrera 52 # 52-43, Centro","priceRange":"$ - Museo $24.000 COP","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Fotografiar las 23 esculturas de Botero en la plaza pública (Gratis)","Entrar a las salas de pintura del maestro Botero y Pedro Nel Gómez en el Museo de Antioquia (Entrada: $24.000 COP)","Tomar un tinto campesino en los cafés tradicionales del centro ($3.000 COP)"],"datos_curiosos":["Botero donó personalmente las esculturas con la condición expresa de que estuvieran en un parque público al alcance del pueblo"],"consejos":["Visitar en la mañana cuando la plaza está activa y vigilada por la policía turística","El Palacio de la Cultura tiene una terraza mirador de acceso libre"],"location_info":{"address":"Carrera 52 # 52-43, Centro","priceRange":"$ - Museo $24.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '12f1f0e5-2409-5cd0-29fa-5669133991fb',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  '1c8c0fc0-c582-195f-8f49-f8fb4e984446',
  2,
  2,
  'Metrocable Línea K y Parque Arví',
  6.282,
  -75.545,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El primer sistema de teleférico de transporte masivo urbano del mundo integrado a un metro. Sobrevuela las laderas nororientales de la ciudad hasta internarse en la reserva forestal ecológica del Parque Arví.',
  ARRAY['Vuelo panorámico sobre las comunas de Medellín en Metrocable (Pasaje integrado Metro: ~$3.600 COP)', 'Cruce de la niebla en el cable turístico hacia Arví ($13.500 COP)', 'Mercado campesino de frutas del bosque, fresas con crema y miel en la estación Arví ($10.000 - $20.000 COP)']::text[],
  ARRAY['Los lunes el Parque Arví está cerrado por mantenimiento del cable (excepto lunes festivos)']::text[],
  ARRAY['El Metrocable de Medellín redujo los tiempos de viaje de los habitantes de las laderas de 2 horas a tan solo 20 minutos']::text[],
  '{"address":"Estación Acevedo / Santo Domingo / Arví","priceRange":"$ - Pasaje integrado","dia":1,"day":1}'::jsonb,
  150,
  '{"dia":1,"day":1,"activities":["Vuelo panorámico sobre las comunas de Medellín en Metrocable (Pasaje integrado Metro: ~$3.600 COP)","Cruce de la niebla en el cable turístico hacia Arví ($13.500 COP)","Mercado campesino de frutas del bosque, fresas con crema y miel en la estación Arví ($10.000 - $20.000 COP)"],"datos_curiosos":["El Metrocable de Medellín redujo los tiempos de viaje de los habitantes de las laderas de 2 horas a tan solo 20 minutos"],"consejos":["Los lunes el Parque Arví está cerrado por mantenimiento del cable (excepto lunes festivos)"],"location_info":{"address":"Estación Acevedo / Santo Domingo / Arví","priceRange":"$ - Pasaje integrado","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ba865b59-aa08-3f1e-a03e-6894a5721c43',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  2,
  'Día 2: Resiliencia y Arte Urbano: Graffitour en Comuna 13',
  'Historia viva de transformación social a través del hip-hop, muralismo y escaleras eléctricas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8dcb11bf-cdae-e86f-0a5e-bb61bac6eddc',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'ba865b59-aa08-3f1e-a03e-6894a5721c43',
  3,
  3,
  'Escaleras Eléctricas y Graffitour Comuna 13',
  6.254,
  -75.619,
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80']::text[],
  'El símbolo mundial de innovación social de Medellín. Un sistema de seis tramos de escaleras mecánicas al aire libre que reemplazaron más de 350 escalones empinados, rodeadas de galerías vivas de arte urbano, batallas de freestyle y breakdance.',
  ARRAY['Tour guiado con líderes juveniles locales del barrio ($35.000 - $50.000 COP)', 'Probar las célebres paletas artesanales de mango biche con sal y limón ($5.000 COP)', 'Presenciar los shows de danza urbana y rap en los miradores (Propina voluntaria)']::text[],
  ARRAY['Tomar el Metro hasta San Javier y luego el autobús alimentador o taxi ($10.000 COP)', 'Comprar arte directamente a los grafiteros locales en sus galerías']::text[],
  ARRAY['Las escaleras eléctricas son públicas y completamente gratuitas para los vecinos de la comunidad']::text[],
  '{"address":"Barrio Las Independencias, Comuna 13","priceRange":"$ - Tour local accesible","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Tour guiado con líderes juveniles locales del barrio ($35.000 - $50.000 COP)","Probar las célebres paletas artesanales de mango biche con sal y limón ($5.000 COP)","Presenciar los shows de danza urbana y rap en los miradores (Propina voluntaria)"],"datos_curiosos":["Las escaleras eléctricas son públicas y completamente gratuitas para los vecinos de la comunidad"],"consejos":["Tomar el Metro hasta San Javier y luego el autobús alimentador o taxi ($10.000 COP)","Comprar arte directamente a los grafiteros locales en sus galerías"],"location_info":{"address":"Barrio Las Independencias, Comuna 13","priceRange":"$ - Tour local accesible","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a5174d28-5b19-1f63-b97e-fbf2942e2c1e',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  3,
  'Día 3: El Monolito Sagrado de Guatapé y el Peñol',
  'Ascenso a la gigantesca roca de 220 metros y pueblo de zócalos artísticos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f253b04d-0e64-a88e-3374-0404594172c8',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'a5174d28-5b19-1f63-b97e-fbf2942e2c1e',
  4,
  4,
  'Piedra del Peñol',
  6.2206,
  -75.1785,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Monolito gigantesco de piedra de 220 metros de altura que domina el laberinto de islas verdes del embalse de Guatapé. Se corona a través de una impresionante escalera de mampostería de 740 peldaños incrustada en su grieta natural.',
  ARRAY['Ascender los 740 escalones hasta el mirador de la cumbre (Entrada: $25.000 COP)', 'Tomar una michelada o jugo de maracuyá en la cima mientras se contempla el embalse ($12.000 - $18.000 COP)', 'Fotografía panorámica de 360 grados sobre el archipiélago de la represa (Gratis)']::text[],
  ARRAY['Subir a paso constante y llevar agua; hay descansos numerados cada 50 escalones', 'Los buses salen cada 20 minutos desde la Terminal del Norte de Medellín ($19.000 COP)']::text[],
  ARRAY['La piedra pesa más de 10 millones de toneladas y fue escalada por primera vez de manera oficial en 1954 por Luis Eduardo Villegas']::text[],
  '{"address":"Vereda La Piedra, Guatapé","priceRange":"$$ - Entrada $25.000 COP","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Ascender los 740 escalones hasta el mirador de la cumbre (Entrada: $25.000 COP)","Tomar una michelada o jugo de maracuyá en la cima mientras se contempla el embalse ($12.000 - $18.000 COP)","Fotografía panorámica de 360 grados sobre el archipiélago de la represa (Gratis)"],"datos_curiosos":["La piedra pesa más de 10 millones de toneladas y fue escalada por primera vez de manera oficial en 1954 por Luis Eduardo Villegas"],"consejos":["Subir a paso constante y llevar agua; hay descansos numerados cada 50 escalones","Los buses salen cada 20 minutos desde la Terminal del Norte de Medellín ($19.000 COP)"],"location_info":{"address":"Vereda La Piedra, Guatapé","priceRange":"$$ - Entrada $25.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a53a0bad-f58f-022a-530d-4485ba8f5d71',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'a5174d28-5b19-1f63-b97e-fbf2942e2c1e',
  5,
  5,
  'Pueblo de los Zócalos y Plazoleta de los Zócalos',
  6.233,
  -75.158,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo lacustre famoso porque cada una de sus casas exhibe zócalos tridimensionales de yeso y cemento tallados en sus bases, que narran anécdotas, oficios y animales de las familias que las habitan.',
  ARRAY['Caminar por la Calle del Recuerdo y la Plazoleta de los Zócalos (Gratis)', 'Paseo en lancha rápida o barco rumbero por el embalse ($25.000 - $40.000 COP)', 'Almorzar bandeja paisa con chicharrón crocante y frijoles ($32.000 - $45.000 COP)']::text[],
  ARRAY['Tomar un motocarro decorado para moverse entre la Piedra y el pueblo de Guatapé ($12.000 COP)', 'Comprar café gourmet local cultivado alrededor del embalse']::text[],
  ARRAY['La tradición de los zócalos comenzó a principios del siglo XX cuando don José María Parra empezó a adornar la fachada de su casa con figuras de borregos']::text[],
  '{"address":"Centro de Guatapé, Antioquia","priceRange":"$ - Entrada libre","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Caminar por la Calle del Recuerdo y la Plazoleta de los Zócalos (Gratis)","Paseo en lancha rápida o barco rumbero por el embalse ($25.000 - $40.000 COP)","Almorzar bandeja paisa con chicharrón crocante y frijoles ($32.000 - $45.000 COP)"],"datos_curiosos":["La tradición de los zócalos comenzó a principios del siglo XX cuando don José María Parra empezó a adornar la fachada de su casa con figuras de borregos"],"consejos":["Tomar un motocarro decorado para moverse entre la Piedra y el pueblo de Guatapé ($12.000 COP)","Comprar café gourmet local cultivado alrededor del embalse"],"location_info":{"address":"Centro de Guatapé, Antioquia","priceRange":"$ - Entrada libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a1237d6e-14bf-7ea9-f79c-a7295c34b1ac',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  4,
  'Día 4: Santa Fe de Antioquia y el Puente de Occidente',
  'Viaje a la antigua capital colonial de Antioquia y joya de la arquitectura de madera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '513ef7fb-1fe7-b5f5-fdb4-98c043e39740',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'a1237d6e-14bf-7ea9-f79c-a7295c34b1ac',
  6,
  6,
  'Puente Colgante de Occidente',
  6.577,
  -75.798,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra maestra de la ingeniería del siglo XIX diseñada por el ingeniero José María Villa (quien participó en el puente de Brooklyn). Cruza el caudaloso río Cauca con una estructura de madera, cables de acero y torres piramidales de 291 metros de longitud.',
  ARRAY['Cruzar a pie el puente histórico de madera sobre el río Cauca ($3.000 COP)', 'Paseo en mototaxi tradicional desde el parque de Santa Fe ($15.000 COP)', 'Probar frutas exóticas locales como tamarindo y zapote con sal ($5.000 COP)']::text[],
  ARRAY['El clima en Santa Fe de Antioquia es cálido y soleado (28-34°C); llevar ropa muy fresca y protector solar', 'En el puente no transitan automóviles particulares grandes, solo mototaxis y peatones']::text[],
  ARRAY['En el momento de su inauguración en 1895 era considerado el séptimo puente colgante más largo del mundo']::text[],
  '{"address":"Río Cauca, Vía Olaya - Santa Fe","priceRange":"$ - Acceso simbólico","dia":4,"day":4}'::jsonb,
  90,
  '{"dia":4,"day":4,"activities":["Cruzar a pie el puente histórico de madera sobre el río Cauca ($3.000 COP)","Paseo en mototaxi tradicional desde el parque de Santa Fe ($15.000 COP)","Probar frutas exóticas locales como tamarindo y zapote con sal ($5.000 COP)"],"datos_curiosos":["En el momento de su inauguración en 1895 era considerado el séptimo puente colgante más largo del mundo"],"consejos":["El clima en Santa Fe de Antioquia es cálido y soleado (28-34°C); llevar ropa muy fresca y protector solar","En el puente no transitan automóviles particulares grandes, solo mototaxis y peatones"],"location_info":{"address":"Río Cauca, Vía Olaya - Santa Fe","priceRange":"$ - Acceso simbólico","dia":4,"day":4}}'::jsonb,
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e84433d7-1729-efd4-35be-febd85620fcc',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'a1237d6e-14bf-7ea9-f79c-a7295c34b1ac',
  7,
  7,
  'Centro Histórico de Santa Fe de Antioquia',
  6.557,
  -75.828,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Monumento nacional fundado en 1541 que fue capital del departamento de Antioquia hasta 1826. Posee siete iglesias coloniales, casonas solariegas con patios centrales y joyerías dedicadas a la filigrana en oro.',
  ARRAY['Visitar la Catedral Basílica de la Inmaculada Concepción (Gratis)', 'Conocer los talleres de orfebres de filigrana en oro y plata de la región', 'Tomar una cerveza helada o jugo de tamarindo en la Plaza Mayor ($5.000 - $8.000 COP)']::text[],
  ARRAY['Santa Fe de Antioquia queda a solo 1 hora y 15 minutos de Medellín gracias al Túnel de Occidente']::text[],
  ARRAY['Sus calles empedradas conservan el nombre original de la época colonial como la Calle de la Amargura y la Calle del Medio']::text[],
  '{"address":"Parque Principal Simón Bolívar, Santa Fe de Antioquia","priceRange":"$ - Acceso libre","dia":4,"day":4}'::jsonb,
  120,
  '{"dia":4,"day":4,"activities":["Visitar la Catedral Basílica de la Inmaculada Concepción (Gratis)","Conocer los talleres de orfebres de filigrana en oro y plata de la región","Tomar una cerveza helada o jugo de tamarindo en la Plaza Mayor ($5.000 - $8.000 COP)"],"datos_curiosos":["Sus calles empedradas conservan el nombre original de la época colonial como la Calle de la Amargura y la Calle del Medio"],"consejos":["Santa Fe de Antioquia queda a solo 1 hora y 15 minutos de Medellín gracias al Túnel de Occidente"],"location_info":{"address":"Parque Principal Simón Bolívar, Santa Fe de Antioquia","priceRange":"$ - Acceso libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e4f7f856-6cad-b8fa-4e0d-7082aef86b9c',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  5,
  'Día 5: Medellín Moderno: El Poblado, Provenza y Despedida',
  'Gastronomía de autor, cafés de especialidad y ambiente cosmopolita.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f41c6b25-4ce8-bbbd-6d5e-7e9470d5bd08',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  'e4f7f856-6cad-b8fa-4e0d-7082aef86b9c',
  8,
  8,
  'Barrio Provenza y Parque Lleras',
  6.2085,
  -75.568,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El epicentro gastronómico y de diseño de Medellín. Calles peatonales rodeadas de vegetación tropical, boutiques de diseñadores independientes, cafeterías de cafés de origen y restaurantes galardonados internacionalmente.',
  ARRAY['Cata de cafés especiales filtrados en Pergamino Café o Café Velvet ($8.000 - $16.000 COP)', 'Almuerzo de cocina colombiana contemporánea ($45.000 - $90.000 COP)', 'Paseo por las tiendas de moda urbana colombiana']::text[],
  ARRAY['Zona peatonal muy segura y agradable para caminar a cualquier hora del día', 'Ideal para comprar café de especialidad empacado al vacío para el vuelo de regreso']::text[],
  ARRAY['La revista británica *Time Out* clasificó a Provenza como una de las calles más "cool" y atractivas del planeta en su ranking mundial']::text[],
  '{"address":"Carrera 35 con Calle 8A, El Poblado","priceRange":"$$ - Restaurantes y cafés","dia":5,"day":5}'::jsonb,
  150,
  '{"dia":5,"day":5,"activities":["Cata de cafés especiales filtrados en Pergamino Café o Café Velvet ($8.000 - $16.000 COP)","Almuerzo de cocina colombiana contemporánea ($45.000 - $90.000 COP)","Paseo por las tiendas de moda urbana colombiana"],"datos_curiosos":["La revista británica *Time Out* clasificó a Provenza como una de las calles más \"cool\" y atractivas del planeta en su ranking mundial"],"consejos":["Zona peatonal muy segura y agradable para caminar a cualquier hora del día","Ideal para comprar café de especialidad empacado al vacío para el vuelo de regreso"],"location_info":{"address":"Carrera 35 con Calle 8A, El Poblado","priceRange":"$$ - Restaurantes y cafés","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '98c37700-700a-2e0e-ba0a-2520b6c0e998',
  '1b3fbbe3-5740-c62b-fa2b-545502e04733',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Amazonas Colombiano Profundo: Selva, Delfines Rosados y Etnias (Leticia, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '366ad79d-3237-74ee-ed03-238efaf38045',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-amazonas-profundo-leticia-tarapoto-6d',
  'Amazonas Colombiano Profundo: Selva, Delfines Rosados y Etnias',
  'Colombia',
  'Leticia',
  'ecological',
  'Expedición ecológica de 6 días en el pulmón del mundo. Navegación por el río más caudaloso de la Tierra, avistamiento de delfines rosados en los Lagos de Tarapoto, caminatas nocturnas en selva virgen y convivencia con comunidades indígenas Ticuna y Yagua.',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  120000,
  'moderate',
  'es',
  4.95,
  78,
  320,
  ARRAY['Amazonas', 'Leticia', 'Puerto Nariño', 'Delfines Rosados', 'Ecológico', 'Selva']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":650000,"estimatedPerPersonMax":1400000,"notes":"Lanchas fluviales compartidas, reserva comunitaria y comidas típicas"}'::jsonb,
  ARRAY['Ecoturistas', 'Fotógrafos de vida silvestre', 'Biólogos y aventureros']::text[],
  'Julio a Noviembre (temporada de aguas bajas con playas de río)',
  'Expediciones fluviales matutinas y safaris nocturnos de selva',
  'Parque Santander de Leticia',
  ARRAY['Ruta fluvial río arriba georreferenciada', 'Puntos de reserva natural y contacto comunitario', 'Guía de fauna amazónica']::text[],
  ARRAY['Tarjeta de turismo de entrada a Leticia', 'Vacuna de fiebre amarilla (obligatoria)', 'Lanchas rápidas']::text[],
  ARRAY['Tener aplicada la vacuna contra la fiebre amarilla con mínimo 10 días de anticipación', 'Llevar botas de caucho altas para caminar en el fango selvático', 'Llevar repelente de alta concentración']::text[],
  ARRAY['Ropa de manga larga y secado rápido', 'Pantalones de trekking ligeros', 'Linterna frontal potente con baterías', 'Capa impermeable']::text[],
  ARRAY['Prohibido el uso de flash directo al fotografiar aves y monos', 'No tocar especies vegetales sin indicación del guía indígena']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c913d56c-4c51-e6d8-a191-01e824765ec7',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  1,
  'Día 1: Leticia y el Enjambre de Loros en Parque Santander',
  'Llegada a la triple frontera (Colombia, Brasil, Perú) y espectáculo aéreo al atardecer.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '59fb7f72-b990-bd7f-9551-346e807bc3f6',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  'c913d56c-4c51-e6d8-a191-01e824765ec7',
  1,
  1,
  'Parque Santander y Mirador de la Iglesia',
  -4.2153,
  -69.9405,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Plaza principal de Leticia donde cada tarde, exactamente a las 5:30 PM, miles de pequeños loros y pericos salvajes llegan en bandadas coordinadas desde la selva para pernoctar en las copas de los árboles del parque.',
  ARRAY['Subir a la torre campanario de la iglesia parroquial para ver el enjambre de loros ($5.000 COP)', 'Probar el pez pirarucú ahumado o frito con fariña en los restaurantes del muelle ($25.000 - $40.000 COP)', 'Caminar cruzando la frontera seca hacia Tabatinga (Brasil) sin trámites aduaneros (Gratis)']::text[],
  ARRAY['Llevar sombrilla durante el espectáculo de los loros para protegerse de las deposiciones de las aves', 'Pagar el impuesto de turismo de Leticia al aterrizar en el aeropuerto (~$38.000 COP)']::text[],
  ARRAY['Se calcula que más de 50.000 pericos de la especie *Brotogeris versicolurus* llegan al parque cada tarde en menos de media hora']::text[],
  '{"address":"Carrera 11 con Calle 8, Leticia","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Subir a la torre campanario de la iglesia parroquial para ver el enjambre de loros ($5.000 COP)","Probar el pez pirarucú ahumado o frito con fariña en los restaurantes del muelle ($25.000 - $40.000 COP)","Caminar cruzando la frontera seca hacia Tabatinga (Brasil) sin trámites aduaneros (Gratis)"],"datos_curiosos":["Se calcula que más de 50.000 pericos de la especie *Brotogeris versicolurus* llegan al parque cada tarde en menos de media hora"],"consejos":["Llevar sombrilla durante el espectáculo de los loros para protegerse de las deposiciones de las aves","Pagar el impuesto de turismo de Leticia al aterrizar en el aeropuerto (~$38.000 COP)"],"location_info":{"address":"Carrera 11 con Calle 8, Leticia","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '712575eb-8a48-d2f1-7bfd-692533a0d318',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  2,
  'Día 2: Flor de Loto Victoria Regia y Reserva Marasha',
  'Navegación fluvial hacia lagunas de nenúfares gigantes y pesca de pirañas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9fb8be34-37e9-7db2-cc07-d9835fed42ac',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  '712575eb-8a48-d2f1-7bfd-692533a0d318',
  2,
  2,
  'Reserva Natural Victoria Regia',
  -4.185,
  -69.982,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Laguna amazónica donde crece la flor de loto más grande del mundo (*Victoria amazonica*), cuyas hojas circulares flotantes pueden alcanzar hasta dos metros de diámetro y soportar más de 30 kilos de peso.',
  ARRAY['Observar las gigantescas hojas de la Victoria Regia flotando sobre el agua (Entrada: $15.000 COP)', 'Paseo en canoa de madera entre los lagos de nenúfares (Gratis con entrada)', 'Probar frutos amazónicos exóticos como copoazú, arazá y camu-camu ($8.000 COP)']::text[],
  ARRAY['Las flores de la Victoria Regia se abren al anochecer y cambian de color blanco a rosado en 48 horas', 'Llevar repelente y protector solar para el paseo en bote']::text[],
  ARRAY['La estructura inferior de la hoja de la Victoria Regia inspiró el diseño estructural del Crystal Palace de Londres en el siglo XIX']::text[],
  '{"address":"Río Amazonas, margen izquierda","priceRange":"$ - Entrada $15.000 COP","dia":2,"day":2}'::jsonb,
  150,
  '{"dia":2,"day":2,"activities":["Observar las gigantescas hojas de la Victoria Regia flotando sobre el agua (Entrada: $15.000 COP)","Paseo en canoa de madera entre los lagos de nenúfares (Gratis con entrada)","Probar frutos amazónicos exóticos como copoazú, arazá y camu-camu ($8.000 COP)"],"datos_curiosos":["La estructura inferior de la hoja de la Victoria Regia inspiró el diseño estructural del Crystal Palace de Londres en el siglo XIX"],"consejos":["Las flores de la Victoria Regia se abren al anochecer y cambian de color blanco a rosado en 48 horas","Llevar repelente y protector solar para el paseo en bote"],"location_info":{"address":"Río Amazonas, margen izquierda","priceRange":"$ - Entrada $15.000 COP","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '85603d5d-f1fe-06f3-0839-592c08bf215c',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  3,
  'Día 3: Puerto Nariño: El Pesebre Ecológico de Colombia',
  'Pueblo modelo sostenible donde no existen automóviles ni motocicletas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c4bba2e1-1b71-a44b-4845-0392186c79c3',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  '85603d5d-f1fe-06f3-0839-592c08bf215c',
  3,
  3,
  'Pueblo de Puerto Nariño y Mirador Naipata',
  -3.7725,
  -70.383,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Localidad modelo a 75 kilómetros río arriba de Leticia, habitada mayoritariamente por la etnia Ticuna. Es célebre por su urbanismo peatonal sin vehículos de combustión, sus senderos ajardinados y su mirador en forma de árbol que domina la selva.',
  ARRAY['Subir a la torre mirador Naipata para vista panorámica del río Loretoyacu ($5.000 COP)', 'Visitar el Centro de Interpretación Natütama dedicado a la conservación de manatíes ($12.000 COP)', 'Almorzar pescado gamitana o sábalo asado en hoja de plátano ($22.000 - $35.000 COP)']::text[],
  ARRAY['La lancha rápida desde Leticia a Puerto Nariño tarda 1 hora y 45 minutos ($42.000 COP por trayecto)', 'En Puerto Nariño todo el transporte es a pie']::text[],
  ARRAY['Es considerado el primer municipio certificado como destino turístico sostenible de Colombia por su manejo ecológico de residuos']::text[],
  '{"address":"Puerto Nariño, Amazonas","priceRange":"$ - Entrada al pueblo $10.000 COP","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Subir a la torre mirador Naipata para vista panorámica del río Loretoyacu ($5.000 COP)","Visitar el Centro de Interpretación Natütama dedicado a la conservación de manatíes ($12.000 COP)","Almorzar pescado gamitana o sábalo asado en hoja de plátano ($22.000 - $35.000 COP)"],"datos_curiosos":["Es considerado el primer municipio certificado como destino turístico sostenible de Colombia por su manejo ecológico de residuos"],"consejos":["La lancha rápida desde Leticia a Puerto Nariño tarda 1 hora y 45 minutos ($42.000 COP por trayecto)","En Puerto Nariño todo el transporte es a pie"],"location_info":{"address":"Puerto Nariño, Amazonas","priceRange":"$ - Entrada al pueblo $10.000 COP","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c783f63f-ed87-1dcf-1e8d-995cfb4cf25b',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  4,
  'Día 4: Lagos de Tarapoto y los Delfines Rosados',
  'Humedal Ramsar protegido donde nadan delfines rosados y grises de agua dulce.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '173a630b-473e-d102-c441-72c1a54234f3',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  'c783f63f-ed87-1dcf-1e8d-995cfb4cf25b',
  4,
  4,
  'Complejo de Humedales Lagos de Tarapoto',
  -3.791,
  -70.432,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Espejo de agua protegido como humedal de importancia internacional Ramsar. Hábitat de los emblemáticos delfines rosados (*Inia geoffrensis*) y delfines grises (*Sotalia fluviatilis*), caimanes negros y el pez pirarucú.',
  ARRAY['Navegación lenta en bote artesanal para avistar delfines rosados emergiendo a respirar ($60.000 - $90.000 COP por bote)', 'Baño en aguas cálidas y tranquilas del lago (Gratis)', 'Senderismo de interpretación de árboles gigantes de ceiba y matapalo con guía nativo ($25.000 COP)']::text[],
  ARRAY['Apagar el motor del bote para escuchar el soplido característico del delfín al respirar', 'No intentar tocar a los delfines para no alterar su conducta silvestre']::text[],
  ARRAY['Los delfines rosados del Amazonas poseen vértebras cervicales no fusionadas, lo que les permite girar el cuello 90 grados para cazar entre los troncos sumergidos']::text[],
  '{"address":"Lagos de Tarapoto, Puerto Nariño","priceRange":"$$ - Excursión en lancha","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Navegación lenta en bote artesanal para avistar delfines rosados emergiendo a respirar ($60.000 - $90.000 COP por bote)","Baño en aguas cálidas y tranquilas del lago (Gratis)","Senderismo de interpretación de árboles gigantes de ceiba y matapalo con guía nativo ($25.000 COP)"],"datos_curiosos":["Los delfines rosados del Amazonas poseen vértebras cervicales no fusionadas, lo que les permite girar el cuello 90 grados para cazar entre los troncos sumergidos"],"consejos":["Apagar el motor del bote para escuchar el soplido característico del delfín al respirar","No intentar tocar a los delfines para no alterar su conducta silvestre"],"location_info":{"address":"Lagos de Tarapoto, Puerto Nariño","priceRange":"$$ - Excursión en lancha","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'cd3b6ee5-32d6-fae0-70f2-77783040cdd4',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  5,
  'Día 5: Tradición Ancestral en Comunidad Indígena Ticuna',
  'Intercambio cultural respetuoso, medicina tradicional y tintes naturales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b9a4efe4-430e-6d88-a62c-cdd13139327d',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  'cd3b6ee5-32d6-fae0-70f2-77783040cdd4',
  5,
  5,
  'Comunidad Indígena Ticuna de San Martín de Amacayacu',
  -3.732,
  -70.321,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Asentamiento tradicional en las riberas del río Amacayacu. Los abuelos y artesanos enseñan el tejido con fibra de chambira, el tallado de madera de palo de sangre y la preparación de remedios con plantas medicinales de selva.',
  ARRAY['Taller de tejido con fibra de chambira con mujeres artesanas ($15.000 COP)', 'Demostración de tiro con cerbatana tradicional indígena ($10.000 COP)', 'Alquiler de artesanías talladas en palo de sangre ($20.000 - $60.000 COP)']::text[],
  ARRAY['Preguntar siempre respetuosamente antes de tomar fotografías a los miembros de la comunidad', 'Aportar directamente comprando artesanías familiares']::text[],
  ARRAY['La fibra de chambira proviene de una palmera espinosa y se tiñe exclusivamente con raíces, frutos y barro silvestre']::text[],
  '{"address":"Comunidad San Martín, Parque Amacayacu","priceRange":"$ - Aporte comunitario","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Taller de tejido con fibra de chambira con mujeres artesanas ($15.000 COP)","Demostración de tiro con cerbatana tradicional indígena ($10.000 COP)","Alquiler de artesanías talladas en palo de sangre ($20.000 - $60.000 COP)"],"datos_curiosos":["La fibra de chambira proviene de una palmera espinosa y se tiñe exclusivamente con raíces, frutos y barro silvestre"],"consejos":["Preguntar siempre respetuosamente antes de tomar fotografías a los miembros de la comunidad","Aportar directamente comprando artesanías familiares"],"location_info":{"address":"Comunidad San Martín, Parque Amacayacu","priceRange":"$ - Aporte comunitario","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'dcb26e7d-21f1-c768-f49c-1b256d00d1f7',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  6,
  'Día 6: Retorno a Leticia y Mercado Fluvial de Tabatinga',
  'Últimas compras de especias amazónicas y regreso.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f867b788-cd9e-cdf5-bb8e-85dfcb48ce41',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  'dcb26e7d-21f1-c768-f49c-1b256d00d1f7',
  6,
  6,
  'Muelle Fluvial de Leticia y Mercado de Tabatinga',
  -4.218,
  -69.936,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'El muelle donde convergen lanchas, botes de carga y canoas que conectan comunidades de Perú, Brasil y Colombia. El mercado es un festín sensorial de pescados gigantes, chontaduros y fariña tostada.',
  ARRAY['Comprar bombones de chocolate con acai y copoazú en Tabatinga ($15.000 - $30.000 COP)', 'Desayuno de tapioca brasileña con queso y café con leche en Tabatinga ($12.000 COP)', 'Fotografía de la confluencia fronteriza sobre el río Amazonas (Gratis)']::text[],
  ARRAY['En Tabatinga se puede pagar en pesos colombianos, reales brasileños o dólares', 'Verificar el peso del equipaje antes de dirigirse al aeropuerto Vásquez Cobo']::text[],
  ARRAY['En esta triple frontera la gente habla cotidianamente el "portuñol", una mezcla fluida de español y portugués sin barreras lingüísticas']::text[],
  '{"address":"Malecón Fluvial, Leticia","priceRange":"$ - Compras locales","dia":6,"day":6}'::jsonb,
  120,
  '{"dia":6,"day":6,"activities":["Comprar bombones de chocolate con acai y copoazú en Tabatinga ($15.000 - $30.000 COP)","Desayuno de tapioca brasileña con queso y café con leche en Tabatinga ($12.000 COP)","Fotografía de la confluencia fronteriza sobre el río Amazonas (Gratis)"],"datos_curiosos":["En esta triple frontera la gente habla cotidianamente el \"portuñol\", una mezcla fluida de español y portugués sin barreras lingüísticas"],"consejos":["En Tabatinga se puede pagar en pesos colombianos, reales brasileños o dólares","Verificar el peso del equipaje antes de dirigirse al aeropuerto Vásquez Cobo"],"location_info":{"address":"Malecón Fluvial, Leticia","priceRange":"$ - Compras locales","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'e8606563-dd07-26db-b3c7-fe6a03b5e4e8',
  '366ad79d-3237-74ee-ed03-238efaf38045',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Gran Vuelta a Colombia: De los Andes al Caribe Mágico (Bogotá, Colombia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-la-gran-vuelta-a-colombia-14d',
  'La Gran Vuelta a Colombia: De los Andes al Caribe Mágico',
  'Colombia',
  'Bogotá',
  'custom',
  'La expedición definitiva de 14 días por Colombia. Conecta los altiplanos andinos y museos dorados de Bogotá, los aromas y palmas de cera gigantes del Eje Cafetero, la innovación urbana y arte de Medellín, la selva y mar del Parque Tayrona, y el romanticismo colonial amurallado de Cartagena.',
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  20160,
  1450000,
  'moderate',
  'es',
  4.98,
  215,
  740,
  ARRAY['Gran Colombia', 'Bogotá', 'Eje Cafetero', 'Medellín', 'Santa Marta', 'Cartagena', 'Mega Tour']::text[],
  true,
  'approved',
  '{"currency":"COP","estimatedPerPersonMin":1800000,"estimatedPerPersonMax":3600000,"notes":"Vuelos internos, entradas, tours guiados y gastronomía completa"}'::jsonb,
  ARRAY['Viajeros internacionales', 'Grandes exploradores', 'Amantes de la cultura integral']::text[],
  'Diciembre a Abril y Julio a Septiembre',
  'Itinerario balanceado con traslados aéreos domésticos eficientes y jornadas libres',
  'Aeropuerto Internacional El Dorado / Centro Histórico, Bogotá',
  ARRAY['Itinerario completo de 14 días interconectado', 'Guía de conexiones aéreas y terrestres', 'Selección de experiencias patrimoniales']::text[],
  ARRAY['Vuelos domésticos internos', 'Entradas a parques nacionales', 'Gastos personales']::text[],
  ARRAY['Empacar para dos climas: frío andino (Bogotá 10-18°C) y calor caribeño (Medellín/Costa 26-32°C)', 'Mantener copias digitales del pasaporte y seguro médico']::text[],
  ARRAY['Maleta versátil con ropa de abrigo y ropa de playa', 'Calzado de trekking y sandalias', 'Protector solar y sombrero']::text[],
  ARRAY['Cumplir con las normativas locales de sostenibilidad y respeto al patrimonio']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '59bfe62a-bcdf-2d75-d86b-dbac7bbdb297',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  1,
  'Día 1: Bienvenida en Bogotá y Museo del Oro',
  'Arribo a la capital andina y primera inmersión en la orfebrería precolombina.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3a5618ac-5e10-abbd-daa2-33a00fffe8f6',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '59bfe62a-bcdf-2d75-d86b-dbac7bbdb297',
  1,
  1,
  'Centro Histórico y Museo del Oro',
  4.6018,
  -74.072,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Recorrido por la joya museográfica de Colombia con más de 34.000 piezas maestras de oro sagrado.',
  ARRAY['Visita a la Balsa Muisca (Entrada: $5.000 COP)', 'Caminata por la Plaza de Bolívar (Gratis)', 'Cena de ajiaco santafereño ($32.000 COP)']::text[],
  ARRAY['Aclimatarse con calma a los 2.600 metros de altitud de Bogotá']::text[],
  ARRAY['La Plaza de Bolívar ha sido testigo de los eventos republicanos más cruciales de Colombia desde 1819']::text[],
  '{"address":"La Candelaria, Bogotá","priceRange":"$ - Entrada $5.000 COP","dia":1,"day":1}'::jsonb,
  150,
  '{"dia":1,"day":1,"activities":["Visita a la Balsa Muisca (Entrada: $5.000 COP)","Caminata por la Plaza de Bolívar (Gratis)","Cena de ajiaco santafereño ($32.000 COP)"],"datos_curiosos":["La Plaza de Bolívar ha sido testigo de los eventos republicanos más cruciales de Colombia desde 1819"],"consejos":["Aclimatarse con calma a los 2.600 metros de altitud de Bogotá"],"location_info":{"address":"La Candelaria, Bogotá","priceRange":"$ - Entrada $5.000 COP","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4b4e9c4a-294f-fa23-76da-f8a67280b0b1',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  2,
  'Día 2: Panorámica en Monserrate y Sabores Capitalinos',
  'Subida al cerro tutelar y tarde gastronómica en Chapinero.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1f6e8da4-c34a-e824-d215-2951bd74cfd0',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '4b4e9c4a-294f-fa23-76da-f8a67280b0b1',
  2,
  2,
  'Cerro de Monserrate',
  4.6056,
  -74.0555,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Santuario a 3.152 metros con la mejor vista panorámica de la sabana bogotana.',
  ARRAY['Subida en funicular o teleférico ($27.000 COP)', 'Mirador panorámico (Gratis)', 'Café de altura con almojábana ($10.000 COP)']::text[],
  ARRAY['Subir en la mañana para evitar las lloviznas de la tarde']::text[],
  ARRAY['El templo alberga una talla del siglo XVII atribuida al escultor Pedro de Lugo y Albarracín']::text[],
  '{"address":"Monserrate, Bogotá","priceRange":"$ - Funicular","dia":2,"day":2}'::jsonb,
  120,
  '{"dia":2,"day":2,"activities":["Subida en funicular o teleférico ($27.000 COP)","Mirador panorámico (Gratis)","Café de altura con almojábana ($10.000 COP)"],"datos_curiosos":["El templo alberga una talla del siglo XVII atribuida al escultor Pedro de Lugo y Albarracín"],"consejos":["Subir en la mañana para evitar las lloviznas de la tarde"],"location_info":{"address":"Monserrate, Bogotá","priceRange":"$ - Funicular","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '195bb09b-14e8-00c7-4f5c-e99d538cd8dc',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  3,
  'Día 3: Catedral de Sal de Zipaquirá y Vuelo al Eje Cafetero',
  'Monumento subterráneo de sal y vuelo hacia Armenia o Pereira.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f18e11ab-464a-a468-0d9b-688d0e359527',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '195bb09b-14e8-00c7-4f5c-e99d538cd8dc',
  3,
  3,
  'Catedral de Sal de Zipaquirá',
  5.019,
  -74.009,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Templo monumental tallado en la roca salina de una mina subterránea activa.',
  ARRAY['Recorrido guiado subterráneo (Entrada: ~$60.000 COP)', 'Traslado al aeropuerto El Dorado para vuelo al Quindío']::text[],
  ARRAY['Llevar abrigo ligero para la mina (14°C)']::text[],
  ARRAY['Contiene 14 estaciones que representan el viacrucis talladas directamente en la sal']::text[],
  '{"address":"Zipaquirá, Cundinamarca","priceRange":"$$ - Entrada","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Recorrido guiado subterráneo (Entrada: ~$60.000 COP)","Traslado al aeropuerto El Dorado para vuelo al Quindío"],"datos_curiosos":["Contiene 14 estaciones que representan el viacrucis talladas directamente en la sal"],"consejos":["Llevar abrigo ligero para la mina (14°C)"],"location_info":{"address":"Zipaquirá, Cundinamarca","priceRange":"$$ - Entrada","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '94fe19f6-eab4-081c-5608-1e9a70e847f0',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  4,
  'Día 4: Salento y Bosque de Palmas en el Valle de Cocora',
  'Senderismo entre las palmas de cera más altas del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '55fa42b9-1fef-7f67-872a-3b8a0ee18c8d',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '94fe19f6-eab4-081c-5608-1e9a70e847f0',
  4,
  4,
  'Valle de Cocora',
  4.643,
  -75.498,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Paisaje de ensueño en los Andes colombianos poblado por palmas de 60 metros.',
  ARRAY['Jeep Willys colectivo ($5.000 COP)', 'Caminata entre palmas ($15.000 COP)', 'Almuerzo de trucha con patacón ($35.000 COP)']::text[],
  ARRAY['Llevar calzado con buen agarre para el sendero húmedo']::text[],
  ARRAY['La palma de cera era utilizada por los indígenas para extraer cera de alumbrado ceremonial']::text[],
  '{"address":"Valle de Cocora, Salento","priceRange":"$$ - Moderado","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Jeep Willys colectivo ($5.000 COP)","Caminata entre palmas ($15.000 COP)","Almuerzo de trucha con patacón ($35.000 COP)"],"datos_curiosos":["La palma de cera era utilizada por los indígenas para extraer cera de alumbrado ceremonial"],"consejos":["Llevar calzado con buen agarre para el sendero húmedo"],"location_info":{"address":"Valle de Cocora, Salento","priceRange":"$$ - Moderado","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fcc847d6-ef0c-0527-b336-cbfaded6900d',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  5,
  'Día 5: Hacienda Cafetera y Traslado Panorámico a Medellín',
  'Cata de café de origen y viaje por autopista andina hacia Medellín.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ae4a568c-3063-44c5-e485-d37265877686',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'fcc847d6-ef0c-0527-b336-cbfaded6900d',
  5,
  5,
  'Finca Cafetera Tradicional',
  4.621,
  -75.592,
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80']::text[],
  'Recorrido por los cafetales aprendiendo el arte de la taza perfecta.',
  ARRAY['Tour de café especial ($45.000 COP)', 'Degustación y cata guiada (Gratis con tour)']::text[],
  ARRAY['Comprar café recién tostado en la finca']::text[],
  ARRAY['El café colombiano es suave por su altitud de cultivo y recolección manual']::text[],
  '{"address":"Salento, Quindío","priceRange":"$$ - Tour","dia":5,"day":5}'::jsonb,
  120,
  '{"dia":5,"day":5,"activities":["Tour de café especial ($45.000 COP)","Degustación y cata guiada (Gratis con tour)"],"datos_curiosos":["El café colombiano es suave por su altitud de cultivo y recolección manual"],"consejos":["Comprar café recién tostado en la finca"],"location_info":{"address":"Salento, Quindío","priceRange":"$$ - Tour","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f21bccc1-134b-6eb7-97f4-773f263eba44',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  6,
  'Día 6: Medellín: Esculturas de Botero y Metrocable Arví',
  'Cultura en el centro de Medellín y vuelo sobre las montañas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'dd69a54b-cd5b-ab61-00f3-f8c1fd072697',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'f21bccc1-134b-6eb7-97f4-773f263eba44',
  6,
  6,
  'Plaza Botero y Metrocable',
  6.2526,
  -75.5683,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Las 23 esculturas monumentales de Botero y el viaje en teleférico integrado.',
  ARRAY['Fotos en la plaza (Gratis)', 'Entrada al Museo de Antioquia ($24.000 COP)', 'Metrocable al Parque Arví ($13.500 COP)']::text[],
  ARRAY['Disfrutar de las frutas exóticas del mercado campesino en Arví']::text[],
  ARRAY['Medellín fue nombrada Ciudad Más Innovadora del Mundo por el Wall Street Journal']::text[],
  '{"address":"Plaza Botero, Medellín","priceRange":"$ - Moderado","dia":6,"day":6}'::jsonb,
  200,
  '{"dia":6,"day":6,"activities":["Fotos en la plaza (Gratis)","Entrada al Museo de Antioquia ($24.000 COP)","Metrocable al Parque Arví ($13.500 COP)"],"datos_curiosos":["Medellín fue nombrada Ciudad Más Innovadora del Mundo por el Wall Street Journal"],"consejos":["Disfrutar de las frutas exóticas del mercado campesino en Arví"],"location_info":{"address":"Plaza Botero, Medellín","priceRange":"$ - Moderado","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '88e51fb2-baf1-3d8a-874c-2598f0eeb38a',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  7,
  'Día 7: Comuna 13 y Tarde en El Poblado',
  'El milagro del arte urbano en las escaleras eléctricas y noche en Provenza.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4682d4b4-8419-f8a6-abb3-d4c271985a64',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '88e51fb2-baf1-3d8a-874c-2598f0eeb38a',
  7,
  7,
  'Comuna 13 Graffitour',
  6.254,
  -75.619,
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80']::text[],
  'Recorrido por la galería al aire libre más famosa de arte urbano y resiliencia.',
  ARRAY['Tour guiado con líderes locales ($40.000 COP)', 'Paleta de mango con limón ($5.000 COP)']::text[],
  ARRAY['Usar ropa ligera; hay muchas escaleras mecánicas y miradores']::text[],
  ARRAY['El hip-hop salvó a cientos de jóvenes de la violencia barrial']::text[],
  '{"address":"Comuna 13, Medellín","priceRange":"$ - Tour","dia":7,"day":7}'::jsonb,
  180,
  '{"dia":7,"day":7,"activities":["Tour guiado con líderes locales ($40.000 COP)","Paleta de mango con limón ($5.000 COP)"],"datos_curiosos":["El hip-hop salvó a cientos de jóvenes de la violencia barrial"],"consejos":["Usar ropa ligera; hay muchas escaleras mecánicas y miradores"],"location_info":{"address":"Comuna 13, Medellín","priceRange":"$ - Tour","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e7802583-95b0-47b7-1931-d8dfd97c9faf',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  8,
  'Día 8: Excursión al Peñol de Guatapé y Vuelo al Caribe',
  'Subida a la roca de 740 escalones y vuelo hacia Santa Marta.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '82a223b4-6c2f-b0dd-e05d-2bbe59f7b04c',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'e7802583-95b0-47b7-1931-d8dfd97c9faf',
  8,
  8,
  'Piedra del Peñol y Pueblo de Zócalos',
  6.2206,
  -75.1785,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Ascenso al monolito y paseo por el pueblo más colorido de Colombia.',
  ARRAY['Subida a la piedra ($25.000 COP)', 'Fotos en la Plazoleta de los Zócalos (Gratis)', 'Vuelo nocturno Medellín - Santa Marta']::text[],
  ARRAY['Tomar transporte temprano para llegar a tiempo al aeropuerto de Rionegro']::text[],
  ARRAY['La represa de Guatapé produce cerca del 15% de la electricidad de Colombia']::text[],
  '{"address":"Guatapé, Antioquia","priceRange":"$$ - Moderado","dia":8,"day":8}'::jsonb,
  240,
  '{"dia":8,"day":8,"activities":["Subida a la piedra ($25.000 COP)","Fotos en la Plazoleta de los Zócalos (Gratis)","Vuelo nocturno Medellín - Santa Marta"],"datos_curiosos":["La represa de Guatapé produce cerca del 15% de la electricidad de Colombia"],"consejos":["Tomar transporte temprano para llegar a tiempo al aeropuerto de Rionegro"],"location_info":{"address":"Guatapé, Antioquia","priceRange":"$$ - Moderado","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'be9c98ec-6069-1b6d-a63e-c5ef3fa1c6ad',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  9,
  'Día 9: Santa Marta Histórica y Quinta de San Pedro Alejandrino',
  'Historia de la ciudad más antigua y descanso de Simón Bolívar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd783bffe-e196-5ea5-5450-9fbdbb09a892',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'be9c98ec-6069-1b6d-a63e-c5ef3fa1c6ad',
  9,
  9,
  'Quinta de San Pedro Alejandrino',
  11.2291,
  -74.1818,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Hacienda histórica donde falleció el Libertador en 1830 rodeada de jardines botánicos.',
  ARRAY['Tour histórico ($23.000 COP)', 'Atardecer en el Parque de los Novios (Gratis)']::text[],
  ARRAY['Probar la limonada de coco típica de la costa']::text[],
  ARRAY['La quinta conserva el árbol de tamarindo bajo cuya sombra solía reposar Bolívar']::text[],
  '{"address":"Santa Marta, Magdalena","priceRange":"$ - Entrada","dia":9,"day":9}'::jsonb,
  120,
  '{"dia":9,"day":9,"activities":["Tour histórico ($23.000 COP)","Atardecer en el Parque de los Novios (Gratis)"],"datos_curiosos":["La quinta conserva el árbol de tamarindo bajo cuya sombra solía reposar Bolívar"],"consejos":["Probar la limonada de coco típica de la costa"],"location_info":{"address":"Santa Marta, Magdalena","priceRange":"$ - Entrada","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd52ca3ff-5ea0-0dee-ca19-c3bc65494dbd',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  10,
  'Día 10: Senderismo y Playas Vírgenes del Parque Tayrona',
  'Caminata entre selva tropical y mar esmeralda en Cabo San Juan.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e18102e2-224a-8853-f3cc-f2848148d33b',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'd52ca3ff-5ea0-0dee-ca19-c3bc65494dbd',
  10,
  10,
  'Cabo San Juan del Guía en PNN Tayrona',
  11.3288,
  -73.9555,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El paisaje de playa virgen más famoso de Colombia rodeado de rocas gigantes.',
  ARRAY['Entrada al parque (~$35.000 / $73.500 COP)', 'Baño en La Piscina y Cabo San Juan (Gratis)', 'Almuerzo de pescado frito ($38.000 COP)']::text[],
  ARRAY['Llevar suficiente agua y comenzar el regreso a media tarde']::text[],
  ARRAY['La Sierra Nevada de Santa Marta es la montaña costera más alta del mundo']::text[],
  '{"address":"PNN Tayrona, Magdalena","priceRange":"$$ - Entrada oficial","dia":10,"day":10}'::jsonb,
  300,
  '{"dia":10,"day":10,"activities":["Entrada al parque (~$35.000 / $73.500 COP)","Baño en La Piscina y Cabo San Juan (Gratis)","Almuerzo de pescado frito ($38.000 COP)"],"datos_curiosos":["La Sierra Nevada de Santa Marta es la montaña costera más alta del mundo"],"consejos":["Llevar suficiente agua y comenzar el regreso a media tarde"],"location_info":{"address":"PNN Tayrona, Magdalena","priceRange":"$$ - Entrada oficial","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a1599e42-a03a-1926-199b-1bb5c119836b',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  11,
  'Día 11: Ruta Costera hacia Cartagena de Indias',
  'Viaje terrestre por el litoral caribeño y llegada a la ciudad amurallada.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6a39d87d-e835-bfc7-862b-8b5b8ade86cc',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  'a1599e42-a03a-1926-199b-1bb5c119836b',
  11,
  11,
  'Llegada a Cartagena y Baluarte de Santo Domingo',
  10.4228,
  -75.5539,
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80']::text[],
  'Primer atardecer sobre las murallas coloniales frente al mar.',
  ARRAY['Cóctel al atardecer sobre las murallas ($35.000 COP)', 'Caminata nocturna por Getsemaní (Gratis)']::text[],
  ARRAY['Getsemaní es el epicentro de la música caribeña y vida nocturna']::text[],
  ARRAY['Las murallas de Cartagena tienen más de 11 kilómetros de longitud conservada']::text[],
  '{"address":"Santo Domingo, Cartagena","priceRange":"$$ - Consumos","dia":11,"day":11}'::jsonb,
  120,
  '{"dia":11,"day":11,"activities":["Cóctel al atardecer sobre las murallas ($35.000 COP)","Caminata nocturna por Getsemaní (Gratis)"],"datos_curiosos":["Las murallas de Cartagena tienen más de 11 kilómetros de longitud conservada"],"consejos":["Getsemaní es el epicentro de la música caribeña y vida nocturna"],"location_info":{"address":"Santo Domingo, Cartagena","priceRange":"$$ - Consumos","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2dea893e-0484-7ad9-c53c-a29ad2e4661b',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  12,
  'Día 12: Fortalezas Militares: Castillo San Felipe de Barajas',
  'Exploración de la ingeniería militar española y laberintos subterráneos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cf1254db-ae3d-0b76-b603-8f5c504cd7e5',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '2dea893e-0484-7ad9-c53c-a29ad2e4661b',
  12,
  12,
  'Castillo San Felipe de Barajas',
  10.423,
  -75.5385,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'La fortaleza colonial más imponente de toda América.',
  ARRAY['Túneles subterráneos (Entrada: $30.000 COP)', 'Fotografía panorámica del mar y la ciudad antigua (Gratis)']::text[],
  ARRAY['Visitar a primera hora de la mañana para evitar el calor intenso']::text[],
  ARRAY['La fortaleza fue construida con una mezcla de cal, arena y sangre de ganado para mayor resistencia']::text[],
  '{"address":"Pie del Cerro, Cartagena","priceRange":"$ - Entrada $30.000 COP","dia":12,"day":12}'::jsonb,
  120,
  '{"dia":12,"day":12,"activities":["Túneles subterráneos (Entrada: $30.000 COP)","Fotografía panorámica del mar y la ciudad antigua (Gratis)"],"datos_curiosos":["La fortaleza fue construida con una mezcla de cal, arena y sangre de ganado para mayor resistencia"],"consejos":["Visitar a primera hora de la mañana para evitar el calor intenso"],"location_info":{"address":"Pie del Cerro, Cartagena","priceRange":"$ - Entrada $30.000 COP","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3f187d51-b5eb-1d74-8009-32cd0b45f20e',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  13,
  'Día 13: Islas del Rosario: Arrecifes y Descanso Tropical',
  'Navegación en lancha hacia Isla Grande y aguas cristalinas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5b925cce-8f18-a33c-0b27-4442f0da1a6c',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '3f187d51-b5eb-1d74-8009-32cd0b45f20e',
  13,
  13,
  'Isla Grande en Islas del Rosario',
  10.1802,
  -75.7314,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Aguas cristalinas y corales vivos en el parque nacional marino.',
  ARRAY['Snorkel en arrecife de coral ($50.000 COP)', 'Almuerzo de mariscos ($45.000 COP)', 'Descanso bajo las palmeras']::text[],
  ARRAY['Llevar protector solar ecológico reef-safe']::text[],
  ARRAY['El parque marino protege más de 120.000 hectáreas de ecosistemas coralinos submarinos']::text[],
  '{"address":"PNN Corales del Rosario","priceRange":"$$$ - Pasadía en lancha","dia":13,"day":13}'::jsonb,
  300,
  '{"dia":13,"day":13,"activities":["Snorkel en arrecife de coral ($50.000 COP)","Almuerzo de mariscos ($45.000 COP)","Descanso bajo las palmeras"],"datos_curiosos":["El parque marino protege más de 120.000 hectáreas de ecosistemas coralinos submarinos"],"consejos":["Llevar protector solar ecológico reef-safe"],"location_info":{"address":"PNN Corales del Rosario","priceRange":"$$$ - Pasadía en lancha","dia":13,"day":13}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '78e85d05-4ba7-30bd-313b-d5be4331117f',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  14,
  'Día 14: Torre del Reloj, Compras de Esmeraldas y Despedida',
  'Últimas postales de la joya caribeña antes de tomar el vuelo internacional.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3ddbe48a-3084-a3e0-89d2-b546dbfb32a3',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '78e85d05-4ba7-30bd-313b-d5be4331117f',
  14,
  14,
  'Torre del Reloj y Las Bóvedas',
  10.4236,
  -75.5501,
  'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80']::text[],
  'Despedida por los 47 arcos coloniales de Las Bóvedas y la Torre del Reloj.',
  ARRAY['Comprar artesanías finas y café gourmet ($25.000 - $80.000 COP)', 'Último almuerzo caribeño de despedida ($40.000 COP)']::text[],
  ARRAY['Tomar taxi con tarifa regulada hacia el aeropuerto Rafael Núñez (15 minutos)']::text[],
  ARRAY['Cartagena de Indias fue declarada Patrimonio de la Humanidad por la UNESCO en 1984']::text[],
  '{"address":"Centro Histórico, Cartagena","priceRange":"$ - Libre","dia":14,"day":14}'::jsonb,
  120,
  '{"dia":14,"day":14,"activities":["Comprar artesanías finas y café gourmet ($25.000 - $80.000 COP)","Último almuerzo caribeño de despedida ($40.000 COP)"],"datos_curiosos":["Cartagena de Indias fue declarada Patrimonio de la Humanidad por la UNESCO en 1984"],"consejos":["Tomar taxi con tarifa regulada hacia el aeropuerto Rafael Núñez (15 minutos)"],"location_info":{"address":"Centro Histórico, Cartagena","priceRange":"$ - Libre","dia":14,"day":14}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '6cc2b98b-4d98-90e8-e7c7-08021f679ef2',
  'e26c05af-2ee1-14af-f967-a72bb5751fc1',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Ciudad de México y Valle de los Dioses: Tenochtitlán y Arte Vivo (Ciudad de México, México)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '6b554568-596a-022f-f605-e77f5abf6739',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-ciudad-de-mexico-teotihuacan-5d',
  'Ciudad de México y Valle de los Dioses: Tenochtitlán y Arte Vivo',
  'México',
  'Ciudad de México',
  'cultural',
  'Inmersión cultural de 5 días en la metrópoli más antigua de América. Desde las ruinas del Templo Mayor azteca y los colosales murales de Diego Rivera, hasta las pirámides prehispánicas de Teotihuacán y el bohemio barrio de Frida Kahlo en Coyoacán.',
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  95000,
  'easy',
  'es',
  4.94,
  165,
  490,
  ARRAY['México', 'CDMX', 'Teotihuacán', 'Coyoacán', 'Frida Kahlo', 'Cultural', 'Muralismo']::text[],
  true,
  'approved',
  '{"currency":"MXN","estimatedPerPersonMin":2200,"estimatedPerPersonMax":4800,"notes":"Entradas a museos, transporte público / Didi y gastronomía mexicana"}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes del arte', 'Foodies']::text[],
  'Octubre a Abril (menos lluvias y agradable temperatura)',
  'Museos y pirámides por la mañana, tardes gastronómicas en la Roma y Condesa',
  'Zócalo Capitalino (Plaza de la Constitución), CDMX',
  ARRAY['Itinerario arqueológico detallado', 'Guía de transporte Metro y Metrobús', 'Recomendación de taquerías tradicionales de autor']::text[],
  ARRAY['Boleto a Museo Frida Kahlo (reserva digital obligatoria previa)', 'Acceso a Teotihuacán', 'Consumos personales']::text[],
  ARRAY['Comprar las entradas al Museo Frida Kahlo por internet con al menos dos semanas de anticipación', 'Llevar sombrero para la zona arqueológica de Teotihuacán']::text[],
  ARRAY['Calzado cómodo para caminar', 'Chaqueta ligera para la noche', 'Protector solar', 'Efectivo en pesos mexicanos']::text[],
  ARRAY['Prohibido subir a las pirámides del Sol y la Luna para preservación arqueológica']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"single_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a2b51c5a-04f3-3a7b-864b-56a5e48beeb7',
  '6b554568-596a-022f-f605-e77f5abf6739',
  1,
  'Día 1: El Corazón Azteca y Virreinal: Zócalo y Templo Mayor',
  'Exploración de la plaza central, la Catedral Metropolitana y los cimientos de Tenochtitlán.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0ea3816a-a3c9-cb3b-6f95-61f27a8f7f6c',
  '6b554568-596a-022f-f605-e77f5abf6739',
  'a2b51c5a-04f3-3a7b-864b-56a5e48beeb7',
  1,
  1,
  'Zócalo, Catedral Metropolitana y Templo Mayor',
  19.4326,
  -99.1332,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'La plaza central de México, construida sobre el centro ceremonial mexica. A un costado se erigen las ruinas excavadas del Templo Mayor y la monumental Catedral Metropolitana levantada con piedras prehispánicas.',
  ARRAY['Visitar la zona arqueológica y museo del Templo Mayor (Entrada: $95 MXN)', 'Entrar a la Catedral Metropolitana y apreciar sus retablos dorados (Gratis)', 'Probar tacos al pastor con piña en taquería tradicional ($60 - $120 MXN)']::text[],
  ARRAY['Los domingos el acceso a museos del INAH es gratuito para residentes nacionales; entre semana es más tranquilo', 'No perderse la enorme escultura del monolito de Coyolxauhqui en el museo']::text[],
  ARRAY['La Catedral se hunde varios centímetros cada año debido al suelo blando del antiguo lecho lacustre de Texcoco']::text[],
  '{"address":"Plaza de la Constitución S/N, Centro Histórico","priceRange":"$ - Museo $95 MXN","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Visitar la zona arqueológica y museo del Templo Mayor (Entrada: $95 MXN)","Entrar a la Catedral Metropolitana y apreciar sus retablos dorados (Gratis)","Probar tacos al pastor con piña en taquería tradicional ($60 - $120 MXN)"],"datos_curiosos":["La Catedral se hunde varios centímetros cada año debido al suelo blando del antiguo lecho lacustre de Texcoco"],"consejos":["Los domingos el acceso a museos del INAH es gratuito para residentes nacionales; entre semana es más tranquilo","No perderse la enorme escultura del monolito de Coyolxauhqui en el museo"],"location_info":{"address":"Plaza de la Constitución S/N, Centro Histórico","priceRange":"$ - Museo $95 MXN","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '80c8c3a7-4f0d-fa91-d383-fdb2a04a6da6',
  '6b554568-596a-022f-f605-e77f5abf6739',
  2,
  'Día 2: Las Colosales Pirámides de Teotihuacán',
  'Viaje a la Ciudad de los Dioses: Pirámide del Sol, de la Luna y Calzada de los Muertos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e83dee74-4294-4be8-72e5-2154ca4bd428',
  '6b554568-596a-022f-f605-e77f5abf6739',
  '80c8c3a7-4f0d-fa91-d383-fdb2a04a6da6',
  2,
  2,
  'Zona Arqueológica de Teotihuacán',
  19.6925,
  -98.8438,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los complejos arqueológicos más impresionantes de la humanidad. La Calzada de los Muertos conecta la monumental Pirámide del Sol (65 metros de altura) con la Pirámide de la Luna y el Templo de la Serpiente Emplumada.',
  ARRAY['Recorrido por la Calzada de los Muertos (Entrada general INAH: $95 MXN)', 'Visita al Palacio de Quetzalpapálotl con murales originales (Gratis con entrada)', 'Almorzar dentro de una cueva volcánica en el restaurante La Gruta ($450 - $800 MXN)']::text[],
  ARRAY['Tomar el autobús desde la Terminal de Autobuses del Norte (Autobuses Teotihuacán: $120 MXN ida y vuelta)', 'Llegar a las 8:30 AM cuando abren para evitar el sol abrasador del mediodía']::text[],
  ARRAY['Cuando los aztecas encontraron Teotihuacán en el siglo XIV, la ciudad ya llevaba más de 600 años abandonada y la creyeron obra de gigantes']::text[],
  '{"address":"San Juan Teotihuacán, Estado de México","priceRange":"$$ - Entrada oficial + transporte","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Recorrido por la Calzada de los Muertos (Entrada general INAH: $95 MXN)","Visita al Palacio de Quetzalpapálotl con murales originales (Gratis con entrada)","Almorzar dentro de una cueva volcánica en el restaurante La Gruta ($450 - $800 MXN)"],"datos_curiosos":["Cuando los aztecas encontraron Teotihuacán en el siglo XIV, la ciudad ya llevaba más de 600 años abandonada y la creyeron obra de gigantes"],"consejos":["Tomar el autobús desde la Terminal de Autobuses del Norte (Autobuses Teotihuacán: $120 MXN ida y vuelta)","Llegar a las 8:30 AM cuando abren para evitar el sol abrasador del mediodía"],"location_info":{"address":"San Juan Teotihuacán, Estado de México","priceRange":"$$ - Entrada oficial + transporte","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e5080c34-460a-ce95-7d6f-af91fda377b7',
  '6b554568-596a-022f-f605-e77f5abf6739',
  3,
  'Día 3: Bellas Artes, Alameda y Murales de Diego Rivera',
  'El esplendor del mármol de Carrara y la historia de México contada en murales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '951f6c88-e98f-d330-490e-d95d696ac443',
  '6b554568-596a-022f-f605-e77f5abf6739',
  'e5080c34-460a-ce95-7d6f-af91fda377b7',
  3,
  3,
  'Palacio de Bellas Artes y Museo Mural Diego Rivera',
  19.4352,
  -99.1412,
  'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra cumbre de la arquitectura Art Nouveau y Art Déco en México revestida en mármol blanco. Custodia los murales históricos de Diego Rivera, David Alfaro Siqueiros y José Clemente Orozco.',
  ARRAY['Contemplar el mural "El hombre controlador del universo" de Rivera (Entrada museo: $90 MXN)', 'Subir a la cafetería del Sears frente al palacio para la mejor foto aérea (Consumo de café: $60 MXN)', 'Caminar por la arbolada Alameda Central con sus fuentes barrocas (Gratis)']::text[],
  ARRAY['La cortina del teatro de Bellas Artes está hecha con cerca de un millón de piezas de cristal por Tiffany de Nueva York', 'Comprar churros calientes con chocolate en la legendaria Churrería El Moro ($70 MXN)']::text[],
  ARRAY['Diego Rivera recreó aquí el famoso mural que Nelson Rockefeller ordenó destruir en el Rockefeller Center de Nueva York por incluir el rostro de Lenin']::text[],
  '{"address":"Avenida Juárez S/N, Centro Histórico","priceRange":"$ - Entrada $90 MXN","dia":3,"day":3}'::jsonb,
  150,
  '{"dia":3,"day":3,"activities":["Contemplar el mural \"El hombre controlador del universo\" de Rivera (Entrada museo: $90 MXN)","Subir a la cafetería del Sears frente al palacio para la mejor foto aérea (Consumo de café: $60 MXN)","Caminar por la arbolada Alameda Central con sus fuentes barrocas (Gratis)"],"datos_curiosos":["Diego Rivera recreó aquí el famoso mural que Nelson Rockefeller ordenó destruir en el Rockefeller Center de Nueva York por incluir el rostro de Lenin"],"consejos":["La cortina del teatro de Bellas Artes está hecha con cerca de un millón de piezas de cristal por Tiffany de Nueva York","Comprar churros calientes con chocolate en la legendaria Churrería El Moro ($70 MXN)"],"location_info":{"address":"Avenida Juárez S/N, Centro Histórico","priceRange":"$ - Entrada $90 MXN","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd796adf5-15e1-2e3f-87c2-12e018ec3901',
  '6b554568-596a-022f-f605-e77f5abf6739',
  4,
  'Día 4: Coyoacán Bohemio y la Casa Azul de Frida Kahlo',
  'Calles empedradas virreinales, aroma a café tostado y la intimidad de Frida.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '858027b1-725a-8f2e-6e92-7cd46cd71601',
  '6b554568-596a-022f-f605-e77f5abf6739',
  'd796adf5-15e1-2e3f-87c2-12e018ec3901',
  4,
  4,
  'Museo Frida Kahlo (Casa Azul) y Plaza Hidalgo',
  19.3551,
  -99.1626,
  'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80']::text[],
  'La casona azul cobalto donde nació, vivió y murió la célebre pintora mexicana. Exhibe sus lienzos, su caballete sobre la silla de ruedas, vestimentas tehuánas originales y su jardín lleno de flora tropical e ídolos prehispánicos.',
  ARRAY['Recorrido por las habitaciones y el estudio de arte de Frida (Entrada general extranjero: ~$320 MXN / nacional: ~$130 MXN)', 'Paseo por la Plaza Hidalgo y el Jardín Centenario en Coyoacán (Gratis)', 'Degustar tostadas de tinga y aguas frescas en el Mercado de Coyoacán ($80 - $140 MXN)']::text[],
  ARRAY['No venden boletos en taquilla física; es estrictamente necesario reservar en línea con horario asignado', 'El permiso para tomar fotografías sin flash dentro de la casa cuesta $30 MXN adicionales']::text[],
  ARRAY['La urna con las cenizas de Frida Kahlo reposa en su dormitorio principal dentro de una figura de barro en forma de sapo']::text[],
  '{"address":"Londres 247, Del Carmen, Coyoacán","priceRange":"$$ - Entrada $320 MXN","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Recorrido por las habitaciones y el estudio de arte de Frida (Entrada general extranjero: ~$320 MXN / nacional: ~$130 MXN)","Paseo por la Plaza Hidalgo y el Jardín Centenario en Coyoacán (Gratis)","Degustar tostadas de tinga y aguas frescas en el Mercado de Coyoacán ($80 - $140 MXN)"],"datos_curiosos":["La urna con las cenizas de Frida Kahlo reposa en su dormitorio principal dentro de una figura de barro en forma de sapo"],"consejos":["No venden boletos en taquilla física; es estrictamente necesario reservar en línea con horario asignado","El permiso para tomar fotografías sin flash dentro de la casa cuesta $30 MXN adicionales"],"location_info":{"address":"Londres 247, Del Carmen, Coyoacán","priceRange":"$$ - Entrada $320 MXN","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e14fc665-23e1-10b6-d67e-a965f5d198aa',
  '6b554568-596a-022f-f605-e77f5abf6739',
  5,
  'Día 5: Bosque y Castillo de Chapultepec y Museo de Antropología',
  'El único castillo real de América y la colección antropológica más valiosa del continente.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '36e4a4fa-f8f9-185c-0b46-e9d61116d569',
  '6b554568-596a-022f-f605-e77f5abf6739',
  'e14fc665-23e1-10b6-d67e-a965f5d198aa',
  5,
  5,
  'Castillo de Chapultepec y Museo Nacional de Antropología',
  19.4204,
  -99.1819,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Suntuoso palacio neoclásico que albergó al emperador Maximiliano de Habsburgo y a los presidentes mexicanos. A unos pasos, el Museo Nacional de Antropología custodia maravillas mundiales como la colosal Piedra del Sol azteca y las cabezas olmecas.',
  ARRAY['Visitar los salones imperiales y jardines colgantes del Castillo (Entrada: $95 MXN)', 'Asombrarse ante el monolito de la Piedra del Sol azteca en el Museo de Antropología (Entrada: $95 MXN)', 'Caminar bajo el enorme paraguas de agua del patio central del museo']::text[],
  ARRAY['El Museo de Antropología es inmenso; dedicar al menos 2 horas a las salas Mexica y Maya', 'Cierra los lunes; planear la visita de martes a domingo']::text[],
  ARRAY['Chapultepec es el parque urbano más antiguo de América, con ahuehuetes plantados por el rey Nezahualcóyotl en el siglo XV']::text[],
  '{"address":"Bosque de Chapultepec I Sección","priceRange":"$$ - Entradas combinadas $190 MXN","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Visitar los salones imperiales y jardines colgantes del Castillo (Entrada: $95 MXN)","Asombrarse ante el monolito de la Piedra del Sol azteca en el Museo de Antropología (Entrada: $95 MXN)","Caminar bajo el enorme paraguas de agua del patio central del museo"],"datos_curiosos":["Chapultepec es el parque urbano más antiguo de América, con ahuehuetes plantados por el rey Nezahualcóyotl en el siglo XV"],"consejos":["El Museo de Antropología es inmenso; dedicar al menos 2 horas a las salas Mexica y Maya","Cierra los lunes; planear la visita de martes a domingo"],"location_info":{"address":"Bosque de Chapultepec I Sección","priceRange":"$$ - Entradas combinadas $190 MXN","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'd016ebef-511f-e4be-1cf6-15b9c10091d0',
  '6b554568-596a-022f-f605-e77f5abf6739',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Cusco Sagrado y Machu Picchu: El Corazón del Imperio Inca (Cusco, Perú)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-cusco-valle-sagrado-machu-picchu-6d',
  'Cusco Sagrado y Machu Picchu: El Corazón del Imperio Inca',
  'Perú',
  'Cusco',
  'historical',
  'Expedición de 6 días por la capital imperial del Tahuantinsuyo. Murallas ciclópeas en Sacsayhuamán, mercados andinos y terrazas agrícolas en el Valle Sagrado, y la llegada cumbre en tren escénico a la ciudadela sagrada de Machu Picchu entre las nubes.',
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  210000,
  'moderate',
  'es',
  4.99,
  240,
  820,
  ARRAY['Perú', 'Cusco', 'Machu Picchu', 'Valle Sagrado', 'Inca', 'Arqueología', 'Maravilla del Mundo']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":450,"estimatedPerPersonMax":850,"notes":"BTC (~$35 USD), boleto Machu Picchu (~$41 USD), tren ida/vuelta (~$140 USD) y bus Consettur (~$24 USD)"}'::jsonb,
  ARRAY['Amantes de la historia', 'Senderistas', 'Exploradores del mundo']::text[],
  'Mayo a Octubre (temporada seca con cielos azules despejados)',
  'Madrugar para los circuitos arqueológicos y aclimatación suave el primer día',
  'Plaza de Armas del Cusco, frente a la Fuente del Inca',
  ARRAY['Ruta arqueológica georreferenciada', 'Información de circuitos oficiales de Machu Picchu', 'Puntos estratégicos para aclimatación a la altura']::text[],
  ARRAY['Boleto Turístico del Cusco (BTC)', 'Boleto oficial Machu Picchu', 'Tren escénico Inca Rail / PeruRail']::text[],
  ARRAY['El primer día tomar té de coca y no hacer esfuerzos físicos bruscos (Cusco está a 3.400 msnm)', 'Comprar con meses de anticipación el boleto a Machu Picchu por la alta demanda']::text[],
  ARRAY['Pasaporte original (obligatorio para ingresar a Machu Picchu)', 'Ropa por capas (frío por la mañana/noche y sol fuerte de mediodía)', 'Zapatos de trekking cómodos', 'Pastillas para el soroche (mal de altura)']::text[],
  ARRAY['Prohibido el uso de trípodes profesionales, drones y bastones con punta metálica en la ciudadela']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd5c02e8f-81b6-fad6-0a7d-137a865f3c0f',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  1,
  'Día 1: Aclimatación en Cusco: Plaza de Armas y Piedra de los 12 Ángulos',
  'Caminata lenta por el ombligo del mundo andino y arquitectura lítica inca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '96fb9603-517b-b423-ab3b-35f4ae9eca73',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  'd5c02e8f-81b6-fad6-0a7d-137a865f3c0f',
  1,
  1,
  'Plaza de Armas y Qorikancha (Templo del Sol)',
  -13.5167,
  -71.9788,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'El centro neurálgico del imperio incaico. El Qorikancha era el santuario más reverenciado del Sol, sobre cuyos muros de piedra pulida milimétricamente los españoles levantaron el Convento de Santo Domingo.',
  ARRAY['Visitar los recintos incas de piedra pulida dentro del Qorikancha (Entrada: 15 PEN / ~$4 USD)', 'Tocar con respeto la célebre Piedra de los 12 Ángulos en la calle Hatun Rumiyoc (Gratis)', 'Tomar té de muña o coca en una cafetería colonial de la plaza (8 PEN / ~$2 USD)']::text[],
  ARRAY['Caminar muy despacio y comer ligero durante las primeras 24 horas para evitar el soroche', 'No apoyarse bruscamente sobre las piedras incas patrimoniales']::text[],
  ARRAY['Los muros del Qorikancha estaban originalmente recubiertos de planchas de oro macizo que fueron arrancadas para pagar el rescate del inca Atahualpa']::text[],
  '{"address":"Avenida El Sol con Calle Santo Domingo, Cusco","priceRange":"$ - Entrada 15 PEN","dia":1,"day":1}'::jsonb,
  150,
  '{"dia":1,"day":1,"activities":["Visitar los recintos incas de piedra pulida dentro del Qorikancha (Entrada: 15 PEN / ~$4 USD)","Tocar con respeto la célebre Piedra de los 12 Ángulos en la calle Hatun Rumiyoc (Gratis)","Tomar té de muña o coca en una cafetería colonial de la plaza (8 PEN / ~$2 USD)"],"datos_curiosos":["Los muros del Qorikancha estaban originalmente recubiertos de planchas de oro macizo que fueron arrancadas para pagar el rescate del inca Atahualpa"],"consejos":["Caminar muy despacio y comer ligero durante las primeras 24 horas para evitar el soroche","No apoyarse bruscamente sobre las piedras incas patrimoniales"],"location_info":{"address":"Avenida El Sol con Calle Santo Domingo, Cusco","priceRange":"$ - Entrada 15 PEN","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7326dc4a-bdaa-58d5-1fa0-522ccb793fa8',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  2,
  'Día 2: La Fortaleza Colosal de Sacsayhuamán',
  'Bloques de piedra ciclópeos de más de 120 toneladas encajados a la perfección.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '38784661-9036-8c96-48a4-3c1d8e66c54e',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '7326dc4a-bdaa-58d5-1fa0-522ccb793fa8',
  2,
  2,
  'Complejo Arqueológico de Sacsayhuamán',
  -13.5048,
  -71.9818,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Fortaleza ceremonial inca situada en una colina que domina Cusco. Sus murallas zigzagueantes están formadas por megalitos de piedra caliza labrada, algunos con más de 5 metros de alto y 128 toneladas de peso.',
  ARRAY['Recorrido por las murallas megalíticas con el Boleto Turístico BTC (Boleto Turístico Parcial: 70 PEN / Integral: 130 PEN)', 'Deslizarse por las formaciones de rodaderos naturales de Suchuna (Gratis)', 'Fotografía de la vista panorámica de la ciudad de Cusco en forma de puma (Gratis)']::text[],
  ARRAY['Se puede subir en taxi desde la Plaza de Armas por 10 PEN o en caminata empinada de 25 minutos', 'Llevar sombrero de ala ancha y bloqueador solar']::text[],
  ARRAY['Cada 24 de junio se escenifica en su explanada principal el milenario Inti Raymi (Fiesta del Sol)']::text[],
  '{"address":"Sacsayhuamán, Cusco","priceRange":"$$ - Incluido en Boleto Turístico","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Recorrido por las murallas megalíticas con el Boleto Turístico BTC (Boleto Turístico Parcial: 70 PEN / Integral: 130 PEN)","Deslizarse por las formaciones de rodaderos naturales de Suchuna (Gratis)","Fotografía de la vista panorámica de la ciudad de Cusco en forma de puma (Gratis)"],"datos_curiosos":["Cada 24 de junio se escenifica en su explanada principal el milenario Inti Raymi (Fiesta del Sol)"],"consejos":["Se puede subir en taxi desde la Plaza de Armas por 10 PEN o en caminata empinada de 25 minutos","Llevar sombrero de ala ancha y bloqueador solar"],"location_info":{"address":"Sacsayhuamán, Cusco","priceRange":"$$ - Incluido en Boleto Turístico","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '150a3025-6961-3ab7-901f-d945552f6f1f',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  3,
  'Día 3: El Valle Sagrado: Písac y las Terrazas Agrícolas',
  'Andenerías colgadas sobre el río Urubamba y mercado tradicional andino.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2794d44d-ca44-3c7a-26d4-eb6b932cd7cd',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '150a3025-6961-3ab7-901f-d945552f6f1f',
  3,
  3,
  'Parque Arqueológico y Mercado de Písac',
  -13.421,
  -71.849,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'Ciudadela inca en lo alto de un espolón rocoso con cientos de terrazas agrícolas andinas y el mayor cementerio prehispánico conocido de Sudamérica. En el pueblo, su mercado artesanal estalla de colores textiles.',
  ARRAY['Caminar entre los recintos militares y el reloj solar Intihuatana de Písac (Incluido en Boleto Turístico)', 'Comprar chompas de alpaca y platería en el mercado dominical (40 - 150 PEN)', 'Probar empanadas calientes recién horneadas en los hornos de barro coloniales (5 PEN)']::text[],
  ARRAY['El Valle Sagrado se encuentra a 2.800 msnm (600 metros más bajo que Cusco), lo que facilita respirar mejor']::text[],
  ARRAY['Las andenerías agrícolas incas no solo evitaban la erosión de las laderas, sino que sus piedras absorbían el calor diurno para irradiarlo de noche contra las heladas']::text[],
  '{"address":"Písac, Valle Sagrado","priceRange":"$$ - Boleto Turístico","dia":3,"day":3}'::jsonb,
  200,
  '{"dia":3,"day":3,"activities":["Caminar entre los recintos militares y el reloj solar Intihuatana de Písac (Incluido en Boleto Turístico)","Comprar chompas de alpaca y platería en el mercado dominical (40 - 150 PEN)","Probar empanadas calientes recién horneadas en los hornos de barro coloniales (5 PEN)"],"datos_curiosos":["Las andenerías agrícolas incas no solo evitaban la erosión de las laderas, sino que sus piedras absorbían el calor diurno para irradiarlo de noche contra las heladas"],"consejos":["El Valle Sagrado se encuentra a 2.800 msnm (600 metros más bajo que Cusco), lo que facilita respirar mejor"],"location_info":{"address":"Písac, Valle Sagrado","priceRange":"$$ - Boleto Turístico","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '40856487-ffe5-a9d3-d911-11c89504b0f8',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  4,
  'Día 4: Fortaleza de Ollantaytambo y Tren hacia Aguas Calientes',
  'El pueblo inca viviente y viaje en tren panorámico a la selva alta.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '265b011c-e9ce-d0a3-0385-f60f90fead5c',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '40856487-ffe5-a9d3-d911-11c89504b0f8',
  4,
  4,
  'Fortaleza de Ollantaytambo y Estación de Tren',
  -13.258,
  -72.263,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Colosal bastión militar y religioso donde los incas derrotaron a los conquistadores españoles en 1537. Sus terrazas ciclópeas custodian el inconcluso Templo del Sol. El pueblo conserva el trazado urbano original inca.',
  ARRAY['Subir las escalinatas de piedra hacia los seis monolitos gigantes de pórfido rosa (Boleto Turístico)', 'Abordar el tren escénico con techos panorámicos hacia Aguas Calientes (~$70 - $90 USD)', 'Cena andina en Aguas Calientes (lomo saltado con cerveza cusqueña: 40 - 65 PEN)']::text[],
  ARRAY['El equipaje grande se deja en el hotel de Cusco; al tren solo se permite subir con mochila de mano de hasta 5 kilos', 'Apreciar cómo el paisaje cambia de cordillera árida a selva tropical exuberante durante el trayecto en tren']::text[],
  ARRAY['Ollantaytambo es la única ciudad inca que ha permanecido continuamente habitada por los mismos linajes desde el siglo XV']::text[],
  '{"address":"Ollantaytambo, Valle Sagrado","priceRange":"$$$ - Tren a Machu Picchu","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Subir las escalinatas de piedra hacia los seis monolitos gigantes de pórfido rosa (Boleto Turístico)","Abordar el tren escénico con techos panorámicos hacia Aguas Calientes (~$70 - $90 USD)","Cena andina en Aguas Calientes (lomo saltado con cerveza cusqueña: 40 - 65 PEN)"],"datos_curiosos":["Ollantaytambo es la única ciudad inca que ha permanecido continuamente habitada por los mismos linajes desde el siglo XV"],"consejos":["El equipaje grande se deja en el hotel de Cusco; al tren solo se permite subir con mochila de mano de hasta 5 kilos","Apreciar cómo el paisaje cambia de cordillera árida a selva tropical exuberante durante el trayecto en tren"],"location_info":{"address":"Ollantaytambo, Valle Sagrado","priceRange":"$$$ - Tren a Machu Picchu","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9364a7dd-020c-f00d-6184-6296869b1095',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  5,
  'Día 5: La Maravilla del Mundo: Santuario Sagrado de Machu Picchu',
  'Amanecer entre la niebla en la ciudadela de piedra más famosa de la Tierra.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '279b17ed-17e7-0b97-8ceb-77aeda105a05',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '9364a7dd-020c-f00d-6184-6296869b1095',
  5,
  5,
  'Santuario Histórico de Machu Picchu',
  -13.1631,
  -72.545,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra cumbre de la arquitectura y la ingeniería incaica encaramada a 2.430 metros de altura en una cresta montañosa entre los picos Machu Picchu y Huayna Picchu. Descubierta científicamente para el mundo por Hiram Bingham en 1911.',
  ARRAY['Recorrido guiado de 2.5 horas por el Circuito clásico: Casa del Guardián, Templo del Sol y Plaza Sagrada (Entrada oficial: 152 PEN / ~$41 USD)', 'Subida en autobús ecológico Consettur desde Aguas Calientes ($24 USD ida y vuelta)', 'Fotografía icónica de postal clásica frente al Huayna Picchu (Gratis con entrada)']::text[],
  ARRAY['Es obligatorio ingresar acompañado de un guía oficial colegiado en el primer ingreso', 'Llevar el pasaporte original físicamente en mano; hay un sello conmemorativo de Machu Picchu en la salida']::text[],
  ARRAY['La ciudadela está construida con un sistema antisísmico de piedras machihembradas sin argamasa que rebotan y vuelven a su lugar durante los terremotos']::text[],
  '{"address":"Santuario Histórico de Machu Picchu, Cusco","priceRange":"$$$ - Entrada oficial + tren","dia":5,"day":5}'::jsonb,
  300,
  '{"dia":5,"day":5,"activities":["Recorrido guiado de 2.5 horas por el Circuito clásico: Casa del Guardián, Templo del Sol y Plaza Sagrada (Entrada oficial: 152 PEN / ~$41 USD)","Subida en autobús ecológico Consettur desde Aguas Calientes ($24 USD ida y vuelta)","Fotografía icónica de postal clásica frente al Huayna Picchu (Gratis con entrada)"],"datos_curiosos":["La ciudadela está construida con un sistema antisísmico de piedras machihembradas sin argamasa que rebotan y vuelven a su lugar durante los terremotos"],"consejos":["Es obligatorio ingresar acompañado de un guía oficial colegiado en el primer ingreso","Llevar el pasaporte original físicamente en mano; hay un sello conmemorativo de Machu Picchu en la salida"],"location_info":{"address":"Santuario Histórico de Machu Picchu, Cusco","priceRange":"$$$ - Entrada oficial + tren","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5c773930-ff71-d4a9-5a0f-34c0f3a56094',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  6,
  'Día 6: Barrio de San Blas y Mercado San Pedro en Cusco',
  'El barrio de los artesanos tradicionales y despedida gastronómica.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '42b11140-8851-6545-152b-39effb929afe',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '5c773930-ff71-d4a9-5a0f-34c0f3a56094',
  6,
  6,
  'Barrio de San Blas y Mercado Central de San Pedro',
  -13.518,
  -71.9825,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Barrio bohemio en cuesta empinada conocido como el barrio de los escultores y talladores (familia Mendívil). Luego, el bullicioso mercado de San Pedro diseñado por Gustave Eiffel, repleto de frutas andinas, quesos y remedios chamánicos.',
  ARRAY['Caminar por las callejuelas estrechas y talleres de imaginería de San Blas (Gratis)', 'Desayunar jugo fresco de lúcuma o chirimoya en el Mercado San Pedro (6 - 10 PEN)', 'Últimas compras de chocolate amargo cusqueño de Quillabamba y sal de Maras (15 - 30 PEN)']::text[],
  ARRAY['Tomar un mate de coca antes del traslado al aeropuerto Alejandro Velasco Astete']::text[],
  ARRAY['El mercado de San Pedro fue inaugurado en 1925 y su estructura de vigas de hierro fue diseñada en los talleres franceses de Eiffel']::text[],
  '{"address":"Calle Tupac Yupanqui, Cusco","priceRange":"$ - Acceso libre","dia":6,"day":6}'::jsonb,
  150,
  '{"dia":6,"day":6,"activities":["Caminar por las callejuelas estrechas y talleres de imaginería de San Blas (Gratis)","Desayunar jugo fresco de lúcuma o chirimoya en el Mercado San Pedro (6 - 10 PEN)","Últimas compras de chocolate amargo cusqueño de Quillabamba y sal de Maras (15 - 30 PEN)"],"datos_curiosos":["El mercado de San Pedro fue inaugurado en 1925 y su estructura de vigas de hierro fue diseñada en los talleres franceses de Eiffel"],"consejos":["Tomar un mate de coca antes del traslado al aeropuerto Alejandro Velasco Astete"],"location_info":{"address":"Calle Tupac Yupanqui, Cusco","priceRange":"$ - Acceso libre","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '5204cb43-fd96-b46c-a888-177d9da401d3',
  'eb7b8162-92d8-1691-b3d8-4c8e59a5b4e4',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Costa Rica Pura Vida: Volcanes, Bosque Nuboso y Playas (San José, Costa Rica)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-costa-rica-pura-vida-7d',
  'Costa Rica Pura Vida: Volcanes, Bosque Nuboso y Playas',
  'Costa Rica',
  'San José',
  'ecological',
  'Aventura ecológica de 7 días por el país líder en biodiversidad y sostenibilidad. Conoce el imponente cono perfecto del Volcán Arenal, camina sobre puentes colgantes en las copas de los árboles de Monteverde y sumérgete en las aguas esmeralda del Parque Nacional Manuel Antonio.',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  10080,
  380000,
  'moderate',
  'es',
  4.96,
  142,
  480,
  ARRAY['Costa Rica', 'Arenal', 'Monteverde', 'Manuel Antonio', 'Ecológico', 'Pura Vida', 'Naturaleza']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":480,"estimatedPerPersonMax":950,"notes":"Entradas SINAC, termales de La Fortuna, puentes colgantes y comidas"}'::jsonb,
  ARRAY['Ecoturistas', 'Familias activas', 'Amantes de la fauna']::text[],
  'Diciembre a Abril (temporada seca con senderos firmes)',
  'Tours de observación de aves y monos a primera hora del día (6:00 AM)',
  'Teatro Nacional de Costa Rica, San José',
  ARRAY['Ruta completa de parques nacionales', 'Guía de observación de perezosos y tucanes', 'Ubicación de termales naturales']::text[],
  ARRAY['Boletos oficiales SINAC a parques nacionales', 'Alquiler de coche o transfers interprovinciales']::text[],
  ARRAY['Comprar las entradas al Parque Nacional Manuel Antonio exclusivamente por el portal web del SINAC con antelación', 'Llevar prismáticos o binoculares para avistar fauna en el dosel']::text[],
  ARRAY['Chaqueta impermeable ligera', 'Botas de senderismo transpirables', 'Traje de baño', 'Bolsa seca']::text[],
  ARRAY['Prohibido ingresar alimentos al Parque Manuel Antonio para no alimentar a los monos capuchinos']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"micro_destination","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '48f077b2-0c34-07b4-845b-38b7a579fa7f',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  1,
  'Día 1: San José: Teatro Nacional y Valle Central',
  'Bienvenida cultural y arquitectura cafetalera del siglo XIX.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1e66a1f6-d347-8864-2e11-fba1571c338c',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  '48f077b2-0c34-07b4-845b-38b7a579fa7f',
  1,
  1,
  'Teatro Nacional de Costa Rica y Barrio Amón',
  9.9333,
  -84.0772,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Joya arquitectónica de 1897 construida con impuestos voluntarios que se autoimpusieron los barones del café. Mármol italiano, pinturas de estilo parisino y el histórico Barrio Amón con sus casonas victorianas de madera.',
  ARRAY['Tour guiado por el foyer y sala principal del teatro ($12 USD)', 'Tomar un café chorreado tradicional con pastel de maracuyá en la cafetería del teatro ($6 USD)', 'Paseo por las galerías de arte de Barrio Amón (Gratis)']::text[],
  ARRAY['Excelente punto de inicio para descansar tras el vuelo internacional']::text[],
  ARRAY['La célebre pintura del techo "Alegoría al café y al banano" muestra a un hombre sosteniendo un racimo de plátanos al revés, pues el artista italiano nunca había visto un banano en planta real']::text[],
  '{"address":"Avenida 2, Calle 1, San José","priceRange":"$ - Tour $12 USD","dia":1,"day":1}'::jsonb,
  120,
  '{"dia":1,"day":1,"activities":["Tour guiado por el foyer y sala principal del teatro ($12 USD)","Tomar un café chorreado tradicional con pastel de maracuyá en la cafetería del teatro ($6 USD)","Paseo por las galerías de arte de Barrio Amón (Gratis)"],"datos_curiosos":["La célebre pintura del techo \"Alegoría al café y al banano\" muestra a un hombre sosteniendo un racimo de plátanos al revés, pues el artista italiano nunca había visto un banano en planta real"],"consejos":["Excelente punto de inicio para descansar tras el vuelo internacional"],"location_info":{"address":"Avenida 2, Calle 1, San José","priceRange":"$ - Tour $12 USD","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fdd4ceff-d5b7-4747-b7e0-f86cfd7f7717',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  2,
  'Día 2: El Imponente Volcán Arenal y La Fortuna',
  'Llegada a las faldas del cono volcánico y senderos de lava.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7253d48f-dbb0-a29e-cba7-ca7bb16495eb',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  'fdd4ceff-d5b7-4747-b7e0-f86cfd7f7717',
  2,
  2,
  'Parque Nacional Volcán Arenal',
  10.462,
  -84.703,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Estratovolcán activo de silueta cónica casi perfecta que se eleva a 1.670 metros sobre los bosques tropicales de La Fortuna. Los senderos cruzan las coladas de lava solidificada de la histórica erupción de 1968.',
  ARRAY['Caminata por el Sendero Colada 1968 con vista directa al cráter (Entrada: $15 USD)', 'Avistamiento de tucanes pico iris y pizotes (coatíes) silvestres (Gratis con entrada)', 'Probar el casado costarricense en una soda tradicional ($8 - $12 USD)']::text[],
  ARRAY['Llevar agua y poncho impermeable; las nubes volcánicas pueden dejar lloviznas rápidas', 'El trayecto desde San José toma unas 3 horas por carretera escénica']::text[],
  ARRAY['El volcán permaneció dormido durante más de 400 años hasta que despertó súbitamente en julio de 1968 creando tres nuevos cráteres']::text[],
  '{"address":"La Fortuna de San Carlos, Alajuela","priceRange":"$$ - Entrada $15 USD","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Caminata por el Sendero Colada 1968 con vista directa al cráter (Entrada: $15 USD)","Avistamiento de tucanes pico iris y pizotes (coatíes) silvestres (Gratis con entrada)","Probar el casado costarricense en una soda tradicional ($8 - $12 USD)"],"datos_curiosos":["El volcán permaneció dormido durante más de 400 años hasta que despertó súbitamente en julio de 1968 creando tres nuevos cráteres"],"consejos":["Llevar agua y poncho impermeable; las nubes volcánicas pueden dejar lloviznas rápidas","El trayecto desde San José toma unas 3 horas por carretera escénica"],"location_info":{"address":"La Fortuna de San Carlos, Alajuela","priceRange":"$$ - Entrada $15 USD","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1f178df0-6d7d-289a-3e36-b53be9ec8996',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  3,
  'Día 3: Aguas Termales Volcánicas y Catarata La Fortuna',
  'Río de aguas termales calientes en la selva y cascada de 70 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '78f2dfa1-c0b5-e309-77cd-def49217b428',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  '1f178df0-6d7d-289a-3e36-b53be9ec8996',
  3,
  3,
  'Catarata La Fortuna y Termales del Río Tabacón',
  10.443,
  -84.672,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Espectacular caída de agua pura de 70 metros que desciende al fondo de un cañón esmeralda. Por la tarde, relajación en las aguas termales minerales calentadas naturalmente por el magma del Arenal.',
  ARRAY['Descender los 500 escalones hacia la poza cristalina de la catarata (Entrada: $18 USD)', 'Baño en el río termal público Chollín (Gratis) o balneario termal privado ($40 - $85 USD)', 'Cena típica en La Fortuna con batido de guanábana ($15 - $25 USD)']::text[],
  ARRAY['Llevar calzado de agua para caminar sobre las piedras del río termal']::text[],
  ARRAY['Las aguas termales de La Fortuna se enriquecen con minerales a más de 1.000 metros bajo tierra antes de emerger a la superficie']::text[],
  '{"address":"La Fortuna, Alajuela","priceRange":"$$ - Moderado","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Descender los 500 escalones hacia la poza cristalina de la catarata (Entrada: $18 USD)","Baño en el río termal público Chollín (Gratis) o balneario termal privado ($40 - $85 USD)","Cena típica en La Fortuna con batido de guanábana ($15 - $25 USD)"],"datos_curiosos":["Las aguas termales de La Fortuna se enriquecen con minerales a más de 1.000 metros bajo tierra antes de emerger a la superficie"],"consejos":["Llevar calzado de agua para caminar sobre las piedras del río termal"],"location_info":{"address":"La Fortuna, Alajuela","priceRange":"$$ - Moderado","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c8be7c0e-0d8c-3650-71ee-52058385a432',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  4,
  'Día 4: Bosque Nuboso de Monteverde: Puentes Colgantes en el Dosel',
  'El misterioso reino de la niebla, orquídeas salvajes y quetzales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '05f38e86-2318-e8de-2493-7f0e554358e5',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  'c8be7c0e-0d8c-3650-71ee-52058385a432',
  4,
  4,
  'Reserva Biológica Bosque Nuboso Monteverde',
  10.3015,
  -84.792,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Santuario a 1.400 metros sobre el nivel del mar donde las nubes se condensan continuamente sobre los árboles. Alberga el 2.5% de toda la biodiversidad del planeta, con más de 500 especies de orquídeas y el hábitat del mítico quetzal resplandeciente.',
  ARRAY['Caminata sobre 8 puentes colgantes suspendidos sobre la copa de los árboles (Entrada: $26 USD)', 'Tour de canopy / tirolesa más larga de Centroamérica ($50 USD opcional)', 'Visita al jardín de colibríes donde revolotean decenas a centímetros de los visitantes ($6 USD)']::text[],
  ARRAY['Monteverde es fresco y húmedo (15-20°C); llevar impermeable y chaqueta abrigada']::text[],
  ARRAY['El bosque nuboso fue fundado y protegido inicialmente en la década de 1950 por un grupo de familias cuáqueras pacifistas de Alabama']::text[],
  '{"address":"Monteverde, Puntarenas","priceRange":"$$ - Puentes colgantes $26 USD","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Caminata sobre 8 puentes colgantes suspendidos sobre la copa de los árboles (Entrada: $26 USD)","Tour de canopy / tirolesa más larga de Centroamérica ($50 USD opcional)","Visita al jardín de colibríes donde revolotean decenas a centímetros de los visitantes ($6 USD)"],"datos_curiosos":["El bosque nuboso fue fundado y protegido inicialmente en la década de 1950 por un grupo de familias cuáqueras pacifistas de Alabama"],"consejos":["Monteverde es fresco y húmedo (15-20°C); llevar impermeable y chaqueta abrigada"],"location_info":{"address":"Monteverde, Puntarenas","priceRange":"$$ - Puentes colgantes $26 USD","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '11ed88fb-bea9-49c1-c87e-be049e2458aa',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  5,
  'Día 5: Ruta hacia el Pacífico: Parque Nacional Manuel Antonio',
  'Descenso hacia las costas del Pacífico central y primer baño de playa.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0e93a59b-58b4-36d6-98cc-46fc4ca055be',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  '11ed88fb-bea9-49c1-c87e-be049e2458aa',
  5,
  5,
  'Playa Espadilla Norte y Pueblo de Quepos',
  9.389,
  -84.153,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Extensa playa pública de arena dorada y olas suaves bordeada por palmeras y restaurantes costeros. Excelente para descansar y ver el atardecer sobre el Pacífico.',
  ARRAY['Atardecer y natación en Playa Espadilla (Gratis)', 'Ceviche tico de corvina con platanitos fritos en la orilla ($10 - $18 USD)', 'Paseo por la Marina Pez Vela en Quepos (Gratis)']::text[],
  ARRAY['Playa Espadilla es pública y no requiere boleto de entrada a diferencia del interior del parque nacional']::text[],
  ARRAY['Manuel Antonio es el parque nacional más pequeño de Costa Rica, pero a su vez el más visitado por la concentración increíble de perezosos']::text[],
  '{"address":"Manuel Antonio, Puntarenas","priceRange":"$ - Acceso libre","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Atardecer y natación en Playa Espadilla (Gratis)","Ceviche tico de corvina con platanitos fritos en la orilla ($10 - $18 USD)","Paseo por la Marina Pez Vela en Quepos (Gratis)"],"datos_curiosos":["Manuel Antonio es el parque nacional más pequeño de Costa Rica, pero a su vez el más visitado por la concentración increíble de perezosos"],"consejos":["Playa Espadilla es pública y no requiere boleto de entrada a diferencia del interior del parque nacional"],"location_info":{"address":"Manuel Antonio, Puntarenas","priceRange":"$ - Acceso libre","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fba62c23-18ee-e4ed-effd-a2d69098cc9a',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  6,
  'Día 6: Manuel Antonio: Perezosos, Monos y Playas Vírgenes',
  'Encuentro cercano con la vida silvestre entre la jungla y el mar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b350c9a4-b6fc-d5ef-9d9e-68c19b28d8bb',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  'fba62c23-18ee-e4ed-effd-a2d69098cc9a',
  6,
  6,
  'Parque Nacional Manuel Antonio: Playas Manuel Antonio y Gemelas',
  9.381,
  -84.145,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El paraíso donde la jungla costera desemboca directamente en caletas de arena blanca con aguas calmas y transparentes. En los senderos es común cruzarse con perezosos de dos y tres dedos, monos capuchinos cariblancos e iguanas.',
  ARRAY['Senderismo por el Sendero Punta Catedral (Entrada SINAC: $18 USD por adulto)', 'Baño de mar en la bahía protegida de Playa Manuel Antonio (Gratis con entrada)', 'Snorkel entre rocas volcánicas para ver peces loro y mantarrayas (Gratis con equipo propio)']::text[],
  ARRAY['Cierra los martes por conservación; reservar entrada online en la web del SINAC con fecha exacta', 'Cuidar las mochilas en la arena: los monos capuchinos y mapaches saben abrir cremalleras para buscar comida']::text[],
  ARRAY['Punta Catedral era antiguamente una isla que quedó unida a tierra firme por una barra de arena formando un tómbolo geológico perfecto']::text[],
  '{"address":"Parque Nacional Manuel Antonio","priceRange":"$$ - Entrada $18 USD","dia":6,"day":6}'::jsonb,
  300,
  '{"dia":6,"day":6,"activities":["Senderismo por el Sendero Punta Catedral (Entrada SINAC: $18 USD por adulto)","Baño de mar en la bahía protegida de Playa Manuel Antonio (Gratis con entrada)","Snorkel entre rocas volcánicas para ver peces loro y mantarrayas (Gratis con equipo propio)"],"datos_curiosos":["Punta Catedral era antiguamente una isla que quedó unida a tierra firme por una barra de arena formando un tómbolo geológico perfecto"],"consejos":["Cierra los martes por conservación; reservar entrada online en la web del SINAC con fecha exacta","Cuidar las mochilas en la arena: los monos capuchinos y mapaches saben abrir cremalleras para buscar comida"],"location_info":{"address":"Parque Nacional Manuel Antonio","priceRange":"$$ - Entrada $18 USD","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ea8720af-90f4-560a-3bb4-8ea8f6b70cc3',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  7,
  'Día 7: Puente de Tárcoles (Cocodrilos Gigantes) y Retorno',
  'Avistamiento de cocodrilos de 4 metros y regreso al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7d7ea65e-40ef-bb37-8780-6c08b25cd161',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  'ea8720af-90f4-560a-3bb4-8ea8f6b70cc3',
  7,
  7,
  'Puente del Río Tárcoles y Retorno a San José',
  9.8005,
  -84.606,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Parada clásica en la carretera Costanera sobre el río Tárcoles. Desde la pasarela peatonal del puente se pueden observar decenas de gigantescos cocodrilos americanos soleándose en las playas de lodo.',
  ARRAY['Avistamiento seguro de cocodrilos desde lo alto del puente (Gratis)', 'Comprar café gourmet costarricense (Tarrazú) en las tiendas artesanales ($8 - $15 USD)', 'Almuerzo de gallo pinto tradicional antes de llegar al aeropuerto Juan Santamaría ($10 USD)']::text[],
  ARRAY['El puente tiene acera protegida con baranda peatonal; mantenerse siempre detrás de ella']::text[],
  ARRAY['El río Tárcoles alberga una de las poblaciones de cocodrilo americano (*Crocodylus acutus*) más densas del mundo']::text[],
  '{"address":"Puente Río Tárcoles, Garabito","priceRange":"$ - Parada libre","dia":7,"day":7}'::jsonb,
  90,
  '{"dia":7,"day":7,"activities":["Avistamiento seguro de cocodrilos desde lo alto del puente (Gratis)","Comprar café gourmet costarricense (Tarrazú) en las tiendas artesanales ($8 - $15 USD)","Almuerzo de gallo pinto tradicional antes de llegar al aeropuerto Juan Santamaría ($10 USD)"],"datos_curiosos":["El río Tárcoles alberga una de las poblaciones de cocodrilo americano (*Crocodylus acutus*) más densas del mundo"],"consejos":["El puente tiene acera protegida con baranda peatonal; mantenerse siempre detrás de ella"],"location_info":{"address":"Puente Río Tárcoles, Garabito","priceRange":"$ - Parada libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '73276279-f2a4-4b92-c00f-5a9593278686',
  '91187e57-361a-5f69-08dc-5ed1578c6702',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Ruta Maya de Yucatán: Chichén Itzá, Cenotes y Tulum (Mérida, México)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-ruta-maya-yucatan-8d',
  'Ruta Maya de Yucatán: Chichén Itzá, Cenotes y Tulum',
  'México',
  'Mérida',
  'cultural',
  'Circuito de 8 días que une el mundo misterioso de los mayas en Chichén Itzá y Uxmal, el baño sagrado en cenotes de aguas cristalinas bajo cavernas milenarias, la elegancia colonial de Mérida y las ruinas fortificadas de Tulum frente al mar Caribe turquesa.',
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']::text[],
  11520,
  520000,
  'easy',
  'es',
  4.97,
  180,
  610,
  ARRAY['México', 'Yucatán', 'Chichén Itzá', 'Cenotes', 'Mérida', 'Tulum', 'Ruta Maya']::text[],
  true,
  'approved',
  '{"currency":"MXN","estimatedPerPersonMin":4500,"estimatedPerPersonMax":9500,"notes":"Chichén Itzá (~$614 MXN), cenotes (~$150-$250 MXN c/u), Tulum (~$95 MXN) y comida yucateca"}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes de la arqueología', 'Familias']::text[],
  'Noviembre a Abril (clima templado y menos humedad en selva)',
  'Zonas arqueológicas a las 8:00 AM y cenotes al mediodía para refrescarse',
  'Plaza Grande de Mérida, Yucatán',
  ARRAY['Ruta completa de ciudades mayas', 'Ubicación de cenotes abiertos y semi-caverna', 'Itinerario de gastronomía yucateca']::text[],
  ARRAY['Boletos INAH + CULTUR a Chichén Itzá', 'Entradas a cenotes comunitarios', 'Alquiler de coche']::text[],
  ARRAY['No usar bloqueador solar ni repelente químico antes de nadar en los cenotes para proteger el acuífero', 'Llevar calzado para agua (aquashoes)']::text[],
  ARRAY['Ropa fresca de lino o algodón', 'Traje de baño', 'Gorra o sombrero', 'Gafas de snorkel']::text[],
  ARRAY['Prohibido tocar estucos o pinturas murales mayas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a7be3d17-c2e4-0039-47c2-62afdffab4e8',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  1,
  'Día 1: Mérida Colonial: Paseo de Montejo y Plaza Grande',
  'La Ciudad Blanca: palacetes porfirianos y gastronomía de cochinita pibil.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '163cc578-727a-9769-371d-37fb547d8032',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  'a7be3d17-c2e4-0039-47c2-62afdffab4e8',
  1,
  1,
  'Paseo de Montejo y Plaza Grande de Mérida',
  20.9674,
  -89.6237,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Elegante avenida inspirada en los Campos Elíseos de París flanqueada por mansiones señoriales del auge del henequén. En el centro histórico se alza la Catedral de San Ildefonso de 1598.',
  ARRAY['Caminata nocturna por Paseo de Montejo y Monumento a la Patria (Gratis)', 'Cena yucateca en Museo de la Gastronomía Yucateca: cochinita pibil y panuchos ($250 - $450 MXN)', 'Probar una marquesita de queso de bola en el parque ($45 MXN)']::text[],
  ARRAY['Los domingos Paseo de Montejo se vuelve peatonal para bicicletas (Bici-ruta Mérida)']::text[],
  ARRAY['Mérida fue llamada Ciudad Blanca por el encalado tradicional de sus muros coloniales y la piedra caliza que refleja la luz']::text[],
  '{"address":"Paseo de Montejo, Mérida","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  150,
  '{"dia":1,"day":1,"activities":["Caminata nocturna por Paseo de Montejo y Monumento a la Patria (Gratis)","Cena yucateca en Museo de la Gastronomía Yucateca: cochinita pibil y panuchos ($250 - $450 MXN)","Probar una marquesita de queso de bola en el parque ($45 MXN)"],"datos_curiosos":["Mérida fue llamada Ciudad Blanca por el encalado tradicional de sus muros coloniales y la piedra caliza que refleja la luz"],"consejos":["Los domingos Paseo de Montejo se vuelve peatonal para bicicletas (Bici-ruta Mérida)"],"location_info":{"address":"Paseo de Montejo, Mérida","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0d97bcee-f71c-fb14-ff21-832f1e0548e3',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  2,
  'Día 2: Uxmal y la Ruta Puuc: Pirámide del Adivino',
  'Arquitectura maya refinada con mosaicos de piedra dedicados a Chaac.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fd7ef293-c6be-16f5-1c06-e602727cc30a',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '0d97bcee-f71c-fb14-ff21-832f1e0548e3',
  2,
  2,
  'Zona Arqueológica de Uxmal',
  20.36,
  -89.771,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Patrimonio de la Humanidad por la UNESCO y joya del estilo arquitectónico Puuc. Destaca la Pirámide del Adivino con su inusual planta elíptica y el Cuadrángulo de las Monjas cubierto de miles de máscaras del dios de la lluvia Chaac.',
  ARRAY['Recorrido guiado por el Cuadrángulo de las Monjas y Palacio del Gobernador (Entrada: ~$530 MXN total INAH+CULTUR)', 'Fotografiar los mascarones geométricos de Chaac (Gratis con entrada)', 'Visita al Museo del Chocolate Choco-Story frente a la zona arqueológica ($190 MXN)']::text[],
  ARRAY['Uxmal es mucho menos concurrida que Chichén Itzá, permitiendo apreciar los detalles en paz']::text[],
  ARRAY['La leyenda maya relata que la Pirámide del Adivino fue construida en una sola noche por un enano nacido de un huevo']::text[],
  '{"address":"Carretera Federal 261, Uxmal","priceRange":"$$ - Entrada $530 MXN","dia":2,"day":2}'::jsonb,
  200,
  '{"dia":2,"day":2,"activities":["Recorrido guiado por el Cuadrángulo de las Monjas y Palacio del Gobernador (Entrada: ~$530 MXN total INAH+CULTUR)","Fotografiar los mascarones geométricos de Chaac (Gratis con entrada)","Visita al Museo del Chocolate Choco-Story frente a la zona arqueológica ($190 MXN)"],"datos_curiosos":["La leyenda maya relata que la Pirámide del Adivino fue construida en una sola noche por un enano nacido de un huevo"],"consejos":["Uxmal es mucho menos concurrida que Chichén Itzá, permitiendo apreciar los detalles en paz"],"location_info":{"address":"Carretera Federal 261, Uxmal","priceRange":"$$ - Entrada $530 MXN","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e841a114-55af-70a0-4339-90db57ad3a79',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  3,
  'Día 3: La Maravilla Maya: Chichén Itzá y el Templo de Kukulcán',
  'La pirámide del dios serpiente emplumada y el gran juego de pelota.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '022ad976-b94f-b4c5-66a7-769758fab778',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  'e841a114-55af-70a0-4339-90db57ad3a79',
  3,
  3,
  'Zona Arqueológica de Chichén Itzá',
  20.6843,
  -88.5678,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las Nuevas 7 Maravillas del Mundo Moderno. La Pirámide de Kukulcán (El Castillo) es un monumento calendárico perfecto donde durante los equinoccios se proyecta la sombra de una serpiente ondulante descendiendo hacia la tierra.',
  ARRAY['Aplaudir frente a la escalinata de El Castillo para escuchar el eco acústico que imita el canto del quetzal (Gratis)', 'Visitar el Gran Juego de Pelota, el más grande de Mesoamérica (Gratis con entrada)', 'Ver el Cenote Sagrado de los sacrificios (Gratis con entrada)']::text[],
  ARRAY['Llegar a las 8:00 AM en punto para entrar antes de que lleguen los autobuses de Cancún a las 10:30 AM', 'Costo de entrada para extranjeros: $614 MXN / nacionales: $272 MXN']::text[],
  ARRAY['La pirámide cuenta con 91 escalones en cada uno de sus 4 lados, sumando con la plataforma superior exactamente 365 días del año solar maya']::text[],
  '{"address":"Pisté, Yucatán","priceRange":"$$$ - Entrada oficial","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Aplaudir frente a la escalinata de El Castillo para escuchar el eco acústico que imita el canto del quetzal (Gratis)","Visitar el Gran Juego de Pelota, el más grande de Mesoamérica (Gratis con entrada)","Ver el Cenote Sagrado de los sacrificios (Gratis con entrada)"],"datos_curiosos":["La pirámide cuenta con 91 escalones en cada uno de sus 4 lados, sumando con la plataforma superior exactamente 365 días del año solar maya"],"consejos":["Llegar a las 8:00 AM en punto para entrar antes de que lleguen los autobuses de Cancún a las 10:30 AM","Costo de entrada para extranjeros: $614 MXN / nacionales: $272 MXN"],"location_info":{"address":"Pisté, Yucatán","priceRange":"$$$ - Entrada oficial","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'cfcf6ae5-2f8f-bd60-3576-7a21dbf64c95',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  4,
  'Día 4: Cenotes Sagrados de Valladolid: Ik Kil y Suytun',
  'Baño sagrado en cavernas subterráneas iluminadas por rayos de sol.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cadf023c-610b-2e26-d15c-3467589a459d',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  'cfcf6ae5-2f8f-bd60-3576-7a21dbf64c95',
  4,
  4,
  'Cenote Ik Kil y Cenote Suytun',
  20.6605,
  -88.55,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Ik Kil es un cenote abierto de 60 metros de diámetro rodeado de lianas colgantes que caen 26 metros hacia aguas de color azul cobalto. Suytun es una caverna subterránea con una pasarela circular de piedra bajo un haz de luz cenital místico.',
  ARRAY['Nadar en las aguas frescas del cenote Ik Kil (Entrada: $180 MXN con chaleco)', 'Fotografía en la plataforma central de Cenote Suytun ($200 MXN)', 'Paseo por el zócalo de Valladolid colonial y cata de marquesitas ($50 MXN)']::text[],
  ARRAY['Obligatorio ducharse antes de ingresar al cenote para no contaminar el agua con lociones o cremas']::text[],
  ARRAY['Para los sacerdotes mayas los cenotes eran el *Xibalbá*, el portal sagrado hacia el inframundo']::text[],
  '{"address":"Valladolid, Yucatán","priceRange":"$$ - Entradas cenotes","dia":4,"day":4}'::jsonb,
  210,
  '{"dia":4,"day":4,"activities":["Nadar en las aguas frescas del cenote Ik Kil (Entrada: $180 MXN con chaleco)","Fotografía en la plataforma central de Cenote Suytun ($200 MXN)","Paseo por el zócalo de Valladolid colonial y cata de marquesitas ($50 MXN)"],"datos_curiosos":["Para los sacerdotes mayas los cenotes eran el *Xibalbá*, el portal sagrado hacia el inframundo"],"consejos":["Obligatorio ducharse antes de ingresar al cenote para no contaminar el agua con lociones o cremas"],"location_info":{"address":"Valladolid, Yucatán","priceRange":"$$ - Entradas cenotes","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7079fbbb-0fcb-f323-0348-576d67fa6d14',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  5,
  'Día 5: Ciudad Amarilla de Izamal y Convento Franciscano',
  'Pueblo mágico pintado completamente de amarillo ocre y pirámide Kinich Kakmó.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e6194b3e-c721-2e10-faba-ed81e946e9c3',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '7079fbbb-0fcb-f323-0348-576d67fa6d14',
  5,
  5,
  'Convento de San Antonio de Padua y Pirámide Kinich Kakmó',
  20.932,
  -89.019,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Conocida como la Ciudad de las Tres Culturas. Cada casa, tienda y fachada está pintada de amarillo brillante y blanco. Su convento cuenta con el segundo atrio cerrado más grande del mundo después de la Plaza de San Pedro en el Vaticano.',
  ARRAY['Subir a la pirámide maya Kinich Kakmó en medio del pueblo (Entrada libre INAH)', 'Caminar por el atrio monumental del convento de 1561 (Gratis)', 'Almorzar sopa de lima y poc chuc en el restaurante Kinich ($250 - $400 MXN)']::text[],
  ARRAY['Hacer un paseo en calesa tirada por caballo para recorrer las calles amarillas ($200 MXN)']::text[],
  ARRAY['El pueblo se pintó de amarillo en 1993 en honor a los colores pontificios del Vaticano con motivo de la visita del Papa Juan Pablo II']::text[],
  '{"address":"Izamal, Yucatán","priceRange":"$ - Entrada libre","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Subir a la pirámide maya Kinich Kakmó en medio del pueblo (Entrada libre INAH)","Caminar por el atrio monumental del convento de 1561 (Gratis)","Almorzar sopa de lima y poc chuc en el restaurante Kinich ($250 - $400 MXN)"],"datos_curiosos":["El pueblo se pintó de amarillo en 1993 en honor a los colores pontificios del Vaticano con motivo de la visita del Papa Juan Pablo II"],"consejos":["Hacer un paseo en calesa tirada por caballo para recorrer las calles amarillas ($200 MXN)"],"location_info":{"address":"Izamal, Yucatán","priceRange":"$ - Entrada libre","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '81cbc025-2108-4f29-e2b3-b15d9010fb05',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  6,
  'Día 6: Hacia el Caribe: Cobá en Bicicleta y Selva Alta',
  'Exploración sobre dos ruedas entre la espesa selva de Quintana Roo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '43765a62-c50a-1e15-f851-bd757cd22e33',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '81cbc025-2108-4f29-e2b3-b15d9010fb05',
  6,
  6,
  'Zona Arqueológica de Cobá',
  20.49,
  -87.733,
  'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80']::text[],
  'Antigua metrópoli maya inmersa en la selva virgen conectada por una red de 50 calzadas blancas prehispánicas (*sacbés*). Custodia la pirámide Nohoch Mul de 42 metros de altura.',
  ARRAY['Alquilar una bicicleta en la entrada para recorrer los sacbés de la selva ($65 MXN)', 'Entrada a la zona arqueológica de Cobá ($95 MXN)', 'Probar ceviche de caracol o camarón a orillas de la laguna de Cobá ($180 - $280 MXN)']::text[],
  ARRAY['El recorrido en bici es plano, sombreado y muy agradable entre la selva']::text[],
  ARRAY['Cobá posee el sacbé (camino blanco de piedra) más largo del mundo maya, extendiéndose por más de 100 kilómetros hasta Yaxuná']::text[],
  '{"address":"Cobá, Quintana Roo","priceRange":"$ - Entrada $95 MXN","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Alquilar una bicicleta en la entrada para recorrer los sacbés de la selva ($65 MXN)","Entrada a la zona arqueológica de Cobá ($95 MXN)","Probar ceviche de caracol o camarón a orillas de la laguna de Cobá ($180 - $280 MXN)"],"datos_curiosos":["Cobá posee el sacbé (camino blanco de piedra) más largo del mundo maya, extendiéndose por más de 100 kilómetros hasta Yaxuná"],"consejos":["El recorrido en bici es plano, sombreado y muy agradable entre la selva"],"location_info":{"address":"Cobá, Quintana Roo","priceRange":"$ - Entrada $95 MXN","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fc6ccac0-546a-21c9-ba06-a1504494e6c8',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  7,
  'Día 7: La Ciudadela Amurallada de Tulum sobre el Mar Caribe',
  'La postal maya más hermosa: templos de piedra sobre acantilados y playa turquesa.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6ec3c328-cafe-bf30-2b27-951340206715',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  'fc6ccac0-546a-21c9-ba06-a1504494e6c8',
  7,
  7,
  'Zona Arqueológica de Tulum',
  20.215,
  -87.429,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El único puerto marítimo amurallado construido por los mayas. El Templo de El Castillo se eleva sobre un acantilado de 12 metros coronando una ensenada de arena blanca y mar Caribe color turquesa intenso.',
  ARRAY['Fotografiar el Templo de los Frescos y El Castillo frente al mar (Entrada INAH: $95 MXN + acceso parque Jaguar)', 'Bajar a nadar a la playa al pie de las ruinas si el oleaje lo permite (Gratis)', 'Almuerzo de mariscos en el pueblo bohemio de Tulum ($250 - $500 MXN)']::text[],
  ARRAY['Llegar a las 8:00 AM para evitar las altas temperaturas y las largas filas turísticas', 'Llevar traje de baño puesto debajo de la ropa']::text[],
  ARRAY['Su nombre original era *Zamá*, que en maya significa "amanecer", pues sus templos miran directamente hacia donde sale el sol sobre el Caribe']::text[],
  '{"address":"Carretera Federal 307 Km 128, Tulum","priceRange":"$$ - Entrada oficial","dia":7,"day":7}'::jsonb,
  180,
  '{"dia":7,"day":7,"activities":["Fotografiar el Templo de los Frescos y El Castillo frente al mar (Entrada INAH: $95 MXN + acceso parque Jaguar)","Bajar a nadar a la playa al pie de las ruinas si el oleaje lo permite (Gratis)","Almuerzo de mariscos en el pueblo bohemio de Tulum ($250 - $500 MXN)"],"datos_curiosos":["Su nombre original era *Zamá*, que en maya significa \"amanecer\", pues sus templos miran directamente hacia donde sale el sol sobre el Caribe"],"consejos":["Llegar a las 8:00 AM para evitar las altas temperaturas y las largas filas turísticas","Llevar traje de baño puesto debajo de la ropa"],"location_info":{"address":"Carretera Federal 307 Km 128, Tulum","priceRange":"$$ - Entrada oficial","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '302de88b-e7f1-a0f7-e298-ce9e3c6ba5d4',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  8,
  'Día 8: Reserva de la Biósfera de Sian Ka''an y Despedida',
  'Canales de manglar cristalinos y descanso final frente al arrecife.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2426f0bc-cb62-3bc8-ff2c-57b87a8f06ed',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '302de88b-e7f1-a0f7-e298-ce9e3c6ba5d4',
  8,
  8,
  'Reserva de Sian Ka''an y Laguna de Muyil',
  20.081,
  -87.618,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Reserva de la Biósfera Patrimonio de la Humanidad por la UNESCO. Canales naturales abiertos en el manglar por los comerciantes mayas prehispánicos con aguas dulces transparentes donde se puede flotar río abajo con chaleco.',
  ARRAY['Flotación relajante con chaleco por los canales de corriente suave de manglar ($850 - $1.200 MXN tour comunitario en lancha)', 'Subir a la torre mirador de madera sobre el dosel de la selva (Gratis con entrada)', 'Despedida caribeña antes del traslado al aeropuerto de Tulum o Cancún']::text[],
  ARRAY['La corriente del canal es lenta y tranquila; solo hay que dejarse llevar boca arriba contemplando el cielo']::text[],
  ARRAY['En lengua maya Sian Ka''an significa "Puerta del cielo" o "Lugar donde nace el cielo"']::text[],
  '{"address":"Muyil, Reserva de Sian Ka''an","priceRange":"$$$ - Tour de manglar","dia":8,"day":8}'::jsonb,
  240,
  '{"dia":8,"day":8,"activities":["Flotación relajante con chaleco por los canales de corriente suave de manglar ($850 - $1.200 MXN tour comunitario en lancha)","Subir a la torre mirador de madera sobre el dosel de la selva (Gratis con entrada)","Despedida caribeña antes del traslado al aeropuerto de Tulum o Cancún"],"datos_curiosos":["En lengua maya Sian Ka''an significa \"Puerta del cielo\" o \"Lugar donde nace el cielo\""],"consejos":["La corriente del canal es lenta y tranquila; solo hay que dejarse llevar boca arriba contemplando el cielo"],"location_info":{"address":"Muyil, Reserva de Sian Ka''an","priceRange":"$$$ - Tour de manglar","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'aff5d860-5778-5df3-87ca-d5eec1fe6dcb',
  '64b0b824-8955-82ed-7787-6f6825f1cd62',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Buenos Aires Romántica y Glaciares de la Patagonia (Buenos Aires, Argentina)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-buenos-aires-patagonia-glaciares-9d',
  'Buenos Aires Romántica y Glaciares de la Patagonia',
  'Argentina',
  'Buenos Aires',
  'romantic',
  'Circuito de 9 días que combina la elegancia europea, librerías históricas, milongas de tango y bistrós de Buenos Aires con la majestuosidad de los campos de hielo patagónicos en El Calafate y el estruendo sobrecogedor del Glaciar Perito Moreno.',
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  12960,
  2800000,
  'moderate',
  'es',
  4.96,
  155,
  530,
  ARRAY['Argentina', 'Buenos Aires', 'Patagonia', 'Perito Moreno', 'Tango', 'Romántico', 'Glaciares']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":650,"estimatedPerPersonMax":1350,"notes":"Vuelo interno, entrada Los Glaciares (~$35 USD), navegación y gastronomía"}'::jsonb,
  ARRAY['Parejas', 'Viajeros de grandes paisajes', 'Amantes de la gastronomía y vino']::text[],
  'Octubre a Abril (primavera y verano austral para Patagonia)',
  'Jornadas culturales y de tango en Buenos Aires; navegaciones glaciares temprano',
  'Plaza de Mayo / Casa Rosada, Buenos Aires',
  ARRAY['Ruta urbana completa de Buenos Aires', 'Itinerario de pasarelas del Glaciar Perito Moreno', 'Recomendación de bodegas y cortes de carne']::text[],
  ARRAY['Vuelo doméstico Buenos Aires - El Calafate', 'Entrada al Parque Nacional Los Glaciares', 'Minitrekking sobre el glaciar']::text[],
  ARRAY['Llevar ropa térmica de abrigo para la Patagonia (cortavientos, guantes y gorro)', 'Reservar la cena show de tango en San Telmo con antelación']::text[],
  ARRAY['Chaqueta impermeable de montaña', 'Ropa elegante para la noche porteña', 'Lentes de sol con protección UV alta (el reflejo del glaciar es intenso)']::text[],
  ARRAY['No traspasar las barandas de seguridad en las pasarelas del glaciar']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8ea09623-fa47-282a-c9ba-5ecfbdddcfa7',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  1,
  'Día 1: Buenos Aires Histórica: Plaza de Mayo y San Telmo',
  'Casa Rosada, arquitectura europea y calles adoquinadas tangueras.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '41851bb5-6e97-c514-772a-177e7dfa0a2b',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '8ea09623-fa47-282a-c9ba-5ecfbdddcfa7',
  1,
  1,
  'Plaza de Mayo, Casa Rosada y San Telmo',
  -34.6083,
  -58.3712,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El corazón político de Argentina donde Eva Perón habló desde los balcones de la Casa Rosada. Hacia el sur, las calles empedradas de San Telmo albergan casas de antigüedades y parejas bailando tango al aire libre.',
  ARRAY['Caminata por Plaza de Mayo y Catedral Metropolitana donde reposa San Martín (Gratis)', 'Tomar un café con medialunas en el histórico Café Tortoni de 1858 ($8 USD)', 'Paseo por la Feria de Antigüedades de Plaza Dorrego en San Telmo (Gratis)']::text[],
  ARRAY['El Café Tortoni suele tener fila en la tarde; ir sobre las 10:00 AM para entrar directo']::text[],
  ARRAY['La Casa Rosada debe su color característico del siglo XIX a una mezcla de cal con sangre de buey para impermeabilizar las paredes']::text[],
  '{"address":"Plaza de Mayo, Buenos Aires","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Caminata por Plaza de Mayo y Catedral Metropolitana donde reposa San Martín (Gratis)","Tomar un café con medialunas en el histórico Café Tortoni de 1858 ($8 USD)","Paseo por la Feria de Antigüedades de Plaza Dorrego en San Telmo (Gratis)"],"datos_curiosos":["La Casa Rosada debe su color característico del siglo XIX a una mezcla de cal con sangre de buey para impermeabilizar las paredes"],"consejos":["El Café Tortoni suele tener fila en la tarde; ir sobre las 10:00 AM para entrar directo"],"location_info":{"address":"Plaza de Mayo, Buenos Aires","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'db4c00fb-83a8-2b60-28e4-c21d7fb7f321',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  2,
  'Día 2: Recoleta Elegante y Librería El Ateneo Grand Splendid',
  'Palacios de estilo francés, la tumba de Evita y la librería más bella del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '58aa4c95-2d90-100a-ed2a-b77515890827',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  'db4c00fb-83a8-2b60-28e4-c21d7fb7f321',
  2,
  2,
  'Cementerio de la Recoleta y El Ateneo Grand Splendid',
  -34.5875,
  -58.393,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Museo escultórico al aire libre con mausoleos de mármol donde descansan presidentes y Eva Perón. Cerca se encuentra El Ateneo Grand Splendid, un antiguo teatro de 1919 convertido en una monumental librería donde el escenario es un café.',
  ARRAY['Visitar el mausoleo de Eva Perón en el Cementerio de la Recoleta (Entrada turista no residente: ~$15 USD)', 'Tomar un café sobre el escenario del teatro rodeado de miles de libros ($6 USD)', 'Almorzar un bife de chorizo en una parrilla tradicional de Recoleta ($25 - $40 USD)']::text[],
  ARRAY['La librería National Geographic clasificó a El Ateneo como la librería comercial más hermosa del mundo']::text[],
  ARRAY['La cúpula del Ateneo conserva los frescos originales pintados por Nazareno Orlandi en 1919 celebrando el fin de la Primera Guerra Mundial']::text[],
  '{"address":"Avenida Santa Fe 1860, Recoleta","priceRange":"$$ - Moderado","dia":2,"day":2}'::jsonb,
  180,
  '{"dia":2,"day":2,"activities":["Visitar el mausoleo de Eva Perón en el Cementerio de la Recoleta (Entrada turista no residente: ~$15 USD)","Tomar un café sobre el escenario del teatro rodeado de miles de libros ($6 USD)","Almorzar un bife de chorizo en una parrilla tradicional de Recoleta ($25 - $40 USD)"],"datos_curiosos":["La cúpula del Ateneo conserva los frescos originales pintados por Nazareno Orlandi en 1919 celebrando el fin de la Primera Guerra Mundial"],"consejos":["La librería National Geographic clasificó a El Ateneo como la librería comercial más hermosa del mundo"],"location_info":{"address":"Avenida Santa Fe 1860, Recoleta","priceRange":"$$ - Moderado","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '76241d7b-a9b9-f956-6a3b-86796ca06e77',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  3,
  'Día 3: La Boca, Caminito y Noche de Tango en Puerto Madero',
  'Los conventillos de chapa pintada de colores y cena show romántica.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8ddaa7f0-655d-bd32-127a-b84f29fa15e6',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '76241d7b-a9b9-f956-6a3b-86796ca06e77',
  3,
  3,
  'Callejón Caminito en La Boca y Puerto Madero',
  -34.6395,
  -58.3625,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Museo a cielo abierto de conventillos de inmigrantes genoveses pintados con sobrantes de pintura de barcos. Al caer la noche, los modernos muelles de ladrillo de Puerto Madero acogen las mejores casas de tango.',
  ARRAY['Fotografiar los conventillos de chapa y bailarines de Caminito (Gratis)', 'Cena show de tango con orquesta en vivo y vino Malbec ($70 - $110 USD)', 'Caminar por el Puente de la Mujer iluminado diseñado por Santiago Calatrava (Gratis)']::text[],
  ARRAY['En La Boca mantenerse dentro del perímetro turístico vigilado de Caminito']::text[],
  ARRAY['Caminito fue transformado en museo peatonal por iniciativa del célebre pintor boquense Benito Quinquela Martín en los años 50']::text[],
  '{"address":"Caminito, La Boca / Puerto Madero","priceRange":"$$$ - Cena Show Tango","dia":3,"day":3}'::jsonb,
  200,
  '{"dia":3,"day":3,"activities":["Fotografiar los conventillos de chapa y bailarines de Caminito (Gratis)","Cena show de tango con orquesta en vivo y vino Malbec ($70 - $110 USD)","Caminar por el Puente de la Mujer iluminado diseñado por Santiago Calatrava (Gratis)"],"datos_curiosos":["Caminito fue transformado en museo peatonal por iniciativa del célebre pintor boquense Benito Quinquela Martín en los años 50"],"consejos":["En La Boca mantenerse dentro del perímetro turístico vigilado de Caminito"],"location_info":{"address":"Caminito, La Boca / Puerto Madero","priceRange":"$$$ - Cena Show Tango","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '58a63b7b-397a-6d42-13e3-42db7ed4cda7',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  4,
  'Día 4: Vuelo a la Patagonia: El Calafate y Lago Argentino',
  'Llegada a la capital de los glaciares y cordero patagónico al asador.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '17f2852a-2f43-2e93-f0a4-ce31f3ef6062',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '58a63b7b-397a-6d42-13e3-42db7ed4cda7',
  4,
  4,
  'Pueblo de El Calafate y Laguna Nimez',
  -50.338,
  -72.264,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Acogedora villa patagónica a orillas del inmenso Lago Argentino de aguas lechosas alimentadas por el deshielo glaciar. Cuenta con una reserva natural donde habitan cientos de flamencos australes.',
  ARRAY['Caminar por la Avenida del Libertador y probar chocolates artesanales (Gratis / compra $10 USD)', 'Avistamiento de flamencos patagónicos en la Reserva Laguna Nimez ($10 USD)', 'Cena tradicional de cordero patagónico al palo con copa de Pinot Noir ($30 - $45 USD)']::text[],
  ARRAY['El vuelo desde Buenos Aires a El Calafate dura 3 horas y 15 minutos']::text[],
  ARRAY['La leyenda dice que quien come el fruto silvestre del calafate siempre regresa a la Patagonia']::text[],
  '{"address":"El Calafate, Santa Cruz","priceRange":"$$ - Restaurantes","dia":4,"day":4}'::jsonb,
  150,
  '{"dia":4,"day":4,"activities":["Caminar por la Avenida del Libertador y probar chocolates artesanales (Gratis / compra $10 USD)","Avistamiento de flamencos patagónicos en la Reserva Laguna Nimez ($10 USD)","Cena tradicional de cordero patagónico al palo con copa de Pinot Noir ($30 - $45 USD)"],"datos_curiosos":["La leyenda dice que quien come el fruto silvestre del calafate siempre regresa a la Patagonia"],"consejos":["El vuelo desde Buenos Aires a El Calafate dura 3 horas y 15 minutos"],"location_info":{"address":"El Calafate, Santa Cruz","priceRange":"$$ - Restaurantes","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '6db5c1ca-a978-4e85-b134-3039c0877087',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  5,
  'Día 5: La Maravilla de Hielo: Glaciar Perito Moreno y Pasarelas',
  'Pared de hielo azul de 70 metros de altura y desprendimientos atronadores.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0a994927-1ae9-c6a8-a1be-6a2a23bf6d36',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '6db5c1ca-a978-4e85-b134-3039c0877087',
  5,
  5,
  'Pasarelas del Glaciar Perito Moreno',
  -50.495,
  -73.05,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los espectáculos naturales más imponentes de la Tierra. Un frente glaciar de 5 kilómetros de ancho que avanza sobre el Lago Argentino con paredes de hielo de 70 metros de altura sobre el agua que crujen y se desprenden con estruendos colosales.',
  ARRAY['Recorrer los 4 kilómetros de pasarelas escalonadas frente al glaciar (Entrada Parque Nacional: ~$35 USD)', 'Safaris náuticos en catamarán acercándose a 300 metros de la pared de hielo ($35 USD)', 'Escuchar en silencio los sobrecogedores estruendos de fractura del hielo milenario (Gratis)']::text[],
  ARRAY['Llevar guantes y bufanda; la brisa que emana del glaciar es gélida incluso en verano', 'El espectáculo es aún más activo en las horas de sol de la tarde cuando el deshielo genera más desprendimientos']::text[],
  ARRAY['A diferencia de la mayoría de los glaciares del planeta, el Perito Moreno se encuentra en equilibrio dinámico y no retrocede']::text[],
  '{"address":"Parque Nacional Los Glaciares, Santa Cruz","priceRange":"$$$ - Parque y navegación","dia":5,"day":5}'::jsonb,
  300,
  '{"dia":5,"day":5,"activities":["Recorrer los 4 kilómetros de pasarelas escalonadas frente al glaciar (Entrada Parque Nacional: ~$35 USD)","Safaris náuticos en catamarán acercándose a 300 metros de la pared de hielo ($35 USD)","Escuchar en silencio los sobrecogedores estruendos de fractura del hielo milenario (Gratis)"],"datos_curiosos":["A diferencia de la mayoría de los glaciares del planeta, el Perito Moreno se encuentra en equilibrio dinámico y no retrocede"],"consejos":["Llevar guantes y bufanda; la brisa que emana del glaciar es gélida incluso en verano","El espectáculo es aún más activo en las horas de sol de la tarde cuando el deshielo genera más desprendimientos"],"location_info":{"address":"Parque Nacional Los Glaciares, Santa Cruz","priceRange":"$$$ - Parque y navegación","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'eecf1e1c-c117-769f-4727-89faf312845e',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  6,
  'Día 6: Minitrekking sobre el Hielo Glaciar',
  'Caminata con grampones sobre las grietas y lagunas azules del glaciar.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a4148ec7-d57e-3520-8f20-99d7b37a3dc6',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  'eecf1e1c-c117-769f-4727-89faf312845e',
  6,
  6,
  'Minitrekking sobre el Glaciar Perito Moreno',
  -50.485,
  -73.08,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Experiencia cumbre que permite calzarse grampones de acero y caminar directamente sobre la masa de hielo fósil, descubriendo sumideros de agua turquesa profunda, seracs y grietas translúcidas.',
  ARRAY['Caminata guiada de 1.5 horas sobre el hielo con guías de montaña de alta cota ($250 - $350 USD con traslados)', 'Brindis final con whisky servido con hielo milenario recién picado del glaciar (Incluido en la excursión)', 'Almuerzo tipo picnic frente a la morrena glaciar']::text[],
  ARRAY['Requiere calzado de trekking firme para ajustar los grampones', 'Edad permitida para el minitrekking: 8 a 65 años']::text[],
  ARRAY['El hielo más profundo del glaciar tiene miles de años y es tan denso que absorbe todas las longitudes de onda de la luz excepto el azul brillante']::text[],
  '{"address":"Sector Sur, Glaciar Perito Moreno","priceRange":"$$$$ - Excursión exclusiva","dia":6,"day":6}'::jsonb,
  300,
  '{"dia":6,"day":6,"activities":["Caminata guiada de 1.5 horas sobre el hielo con guías de montaña de alta cota ($250 - $350 USD con traslados)","Brindis final con whisky servido con hielo milenario recién picado del glaciar (Incluido en la excursión)","Almuerzo tipo picnic frente a la morrena glaciar"],"datos_curiosos":["El hielo más profundo del glaciar tiene miles de años y es tan denso que absorbe todas las longitudes de onda de la luz excepto el azul brillante"],"consejos":["Requiere calzado de trekking firme para ajustar los grampones","Edad permitida para el minitrekking: 8 a 65 años"],"location_info":{"address":"Sector Sur, Glaciar Perito Moreno","priceRange":"$$$$ - Excursión exclusiva","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '50e5ab2f-9b07-3b97-d4c4-a52f55bd5fbe',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  7,
  'Día 7: Glaciares Upsala y Spegazzini en Catamarán',
  'Navegación entre icebergs gigantes que flotan en el Lago Argentino.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b19c6759-4464-ed8c-5364-a2172258c081',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '50e5ab2f-9b07-3b97-d4c4-a52f55bd5fbe',
  7,
  7,
  'Glaciares Spegazzini y Upsala (Canal de los Témpanos)',
  -50.21,
  -73.28,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Navegación por los brazos norte del lago sorteando témpanos flotantes gigantescos más grandes que un edificio. El Glaciar Spegazzini posee la pared más alta del parque, elevándose a 135 metros sobre el nivel del lago.',
  ARRAY['Navegación de día completo en catamarán moderno con cubierta panorámica ($120 - $160 USD)', 'Almuerzo en el refugio mirador frente al Glaciar Spegazzini ($25 USD)', 'Fotografiar los témpanos azules esculpidos por el viento y el agua']::text[],
  ARRAY['Las salidas se realizan desde Puerto Bandera, a 45 km de El Calafate']::text[],
  ARRAY['El Glaciar Upsala es uno de los más extensos de Sudamérica con casi 60 kilómetros de longitud']::text[],
  '{"address":"Puerto Bandera, Lago Argentino","priceRange":"$$$ - Navegación lacustre","dia":7,"day":7}'::jsonb,
  360,
  '{"dia":7,"day":7,"activities":["Navegación de día completo en catamarán moderno con cubierta panorámica ($120 - $160 USD)","Almuerzo en el refugio mirador frente al Glaciar Spegazzini ($25 USD)","Fotografiar los témpanos azules esculpidos por el viento y el agua"],"datos_curiosos":["El Glaciar Upsala es uno de los más extensos de Sudamérica con casi 60 kilómetros de longitud"],"consejos":["Las salidas se realizan desde Puerto Bandera, a 45 km de El Calafate"],"location_info":{"address":"Puerto Bandera, Lago Argentino","priceRange":"$$$ - Navegación lacustre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '45a796a0-f45a-9c85-44a4-12a807e06ce2',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  8,
  'Día 8: Regreso a Buenos Aires y Tarde Bohemia en Palermo',
  'Vuelo de regreso y paseo por los bosques y pasajes de diseño de Palermo Soho.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '60fce7e2-14e8-08bc-e720-1811ed2474e6',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '45a796a0-f45a-9c85-44a4-12a807e06ce2',
  8,
  8,
  'Palermo Soho y Rosedal de Palermo',
  -34.588,
  -58.423,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El barrio más vanguardista de la capital argentina. Pasajes arbolados adoquinados con murales urbanos, tiendas de diseñadores independientes, cafeterías de autor y parques con miles de rosas perfumadas.',
  ARRAY['Paseo por el Rosedal de Palermo y sus puentes de estilo griego (Gratis)', 'Compras de diseño y cuero argentino en Plaza Serrano ($30 - $100 USD)', 'Cena en un bodegón porteño: milanesa napolitana con papas fritas ($15 - $25 USD)']::text[],
  ARRAY['Palermo Soho es ideal para recorrer a pie sin prisa al final de la tarde']::text[],
  ARRAY['El Rosedal alberga más de 18.000 rosales de 93 especies distintas en cuatro hectáreas diseñadas por el paisajista Carlos Thays']::text[],
  '{"address":"Plaza Serrano / Parque Tres de Febrero","priceRange":"$$ - Moderado","dia":8,"day":8}'::jsonb,
  180,
  '{"dia":8,"day":8,"activities":["Paseo por el Rosedal de Palermo y sus puentes de estilo griego (Gratis)","Compras de diseño y cuero argentino en Plaza Serrano ($30 - $100 USD)","Cena en un bodegón porteño: milanesa napolitana con papas fritas ($15 - $25 USD)"],"datos_curiosos":["El Rosedal alberga más de 18.000 rosales de 93 especies distintas en cuatro hectáreas diseñadas por el paisajista Carlos Thays"],"consejos":["Palermo Soho es ideal para recorrer a pie sin prisa al final de la tarde"],"location_info":{"address":"Plaza Serrano / Parque Tres de Febrero","priceRange":"$$ - Moderado","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '94c7ea7e-40c6-e877-e0cb-8f0f71e8c3ef',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  9,
  'Día 9: Teatro Colón y Despedida Porteña',
  'Uno de los teatros líricos con mejor acústica del planeta y compras de alfajores.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0ee349c6-cc76-20b1-d9c8-f22ac839b76d',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '94c7ea7e-40c6-e877-e0cb-8f0f71e8c3ef',
  9,
  9,
  'Teatro Colón y Avenida Corrientes',
  -34.6012,
  -58.3831,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Considerado por maestros como Luciano Pavarotti como el teatro con la acústica perfecta para ópera en el mundo. Su sala en herradura, palcos dorados y lámpara central de cristal de Baccarat son deslumbrantes.',
  ARRAY['Visita guiada oficial por el Salón Dorado y la sala principal del Teatro Colón (Entrada: ~$25 USD)', 'Caminar por la calle de los teatros de Avenida Corrientes y el Obelisco (Gratis)', 'Comprar cajas de alfajores de dulce de leche (Havanna o Cachafaz) para llevar ($12 - $20 USD)']::text[],
  ARRAY['Reservar la visita al Teatro Colón con horario específico en su web oficial']::text[],
  ARRAY['Su acústica es tan perfecta que cualquier susurro emitido desde el escenario se escucha con claridad en el último piso a 28 metros de altura']::text[],
  '{"address":"Cerrito 628, San Nicolás, Buenos Aires","priceRange":"$$ - Visita $25 USD","dia":9,"day":9}'::jsonb,
  150,
  '{"dia":9,"day":9,"activities":["Visita guiada oficial por el Salón Dorado y la sala principal del Teatro Colón (Entrada: ~$25 USD)","Caminar por la calle de los teatros de Avenida Corrientes y el Obelisco (Gratis)","Comprar cajas de alfajores de dulce de leche (Havanna o Cachafaz) para llevar ($12 - $20 USD)"],"datos_curiosos":["Su acústica es tan perfecta que cualquier susurro emitido desde el escenario se escucha con claridad en el último piso a 28 metros de altura"],"consejos":["Reservar la visita al Teatro Colón con horario específico en su web oficial"],"location_info":{"address":"Cerrito 628, San Nicolás, Buenos Aires","priceRange":"$$ - Visita $25 USD","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '4bc523cd-d750-eafc-2626-d13dd8825e45',
  'bf13aff0-ff75-927e-6cfe-ba070026a565',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Gran Ruta Andina del Perú: Del Océano Pacífico al Lago Sagrado Titicaca (Lima, Perú)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-gran-ruta-andina-peru-15d',
  'La Gran Ruta Andina del Perú: Del Océano Pacífico al Lago Sagrado Titicaca',
  'Perú',
  'Lima',
  'custom',
  'La expedición definitiva de 15 días por el corazón de la civilización andina. Gastronomía marina en Lima, desierto costero y lobos marinos en Paracas, la Ciudad Blanca de Arequipa y el vuelo del cóndor en el Cañón del Colca, el Cusco Imperial con Machu Picchu, y la navegación sobre las islas flotantes de totora del Lago Titicaca.',
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  21600,
  1650000,
  'intense',
  'es',
  4.99,
  280,
  910,
  ARRAY['Perú', 'Lima', 'Arequipa', 'Colca', 'Cusco', 'Machu Picchu', 'Lago Titicaca', 'Mega Tour']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":1100,"estimatedPerPersonMax":2200,"notes":"Entradas arqueológicas, boleto Machu Picchu con tren, tour Colca y Lago Titicaca"}'::jsonb,
  ARRAY['Grandes expedicionarios', 'Amantes de la arqueología', 'Fotógrafos de alta montaña']::text[],
  'Abril a Noviembre (cielos despejados en la sierra y menos lluvias)',
  'Itinerario de aclimatación gradual desde el nivel del mar hasta los 3.800 metros',
  'Malecón de Miraflores / Parque del Amor, Lima',
  ARRAY['Ruta completa de 15 días con coordenadas GPS exactas', 'Puntos de conexión en bus turístico y tren', 'Protocolo de aclimatación al mal de altura']::text[],
  ARRAY['Boletos turísticos regionales', 'Entrada oficial a Machu Picchu y tren', 'Vuelos internos']::text[],
  ARRAY['El itinerario está planificado de menor a mayor altitud (Lima 0m -> Arequipa 2.300m -> Colca 3.600m -> Cusco 3.400m -> Puno 3.800m) para una aclimatación óptima', 'Beber mate de coca y mantenerse hidratado']::text[],
  ARRAY['Ropa térmica de abrigo y cortavientos', 'Gorra para sol y gafas oscuras', 'Botas de trekking', 'Pasaporte original']::text[],
  ARRAY['Respetar la cultura milenaria de las comunidades flotantes de los Uros y Taquile']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '87834b67-bcf3-79e2-2d87-e4cf53337261',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  1,
  'Día 1: Lima: Malecón de Miraflores y Barranco Bohemio',
  'Bienvenida en la capital gastronómica de América frente al Océano Pacífico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '18c81ba4-d5b5-aa41-bba6-e694e2f8f34c',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '87834b67-bcf3-79e2-2d87-e4cf53337261',
  1,
  1,
  'Malecón de Miraflores y Puente de los Suspiros en Barranco',
  -12.132,
  -77.031,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Acantilados sobre la Costa Verde limeña con vista a surfistas y parapentes. Al lado, el distrito bohemio de Barranco con casonas de madera de inicios del siglo XX y el célebre Puente de los Suspiros.',
  ARRAY['Caminata por el Parque del Amor con mosaicos poéticos (Gratis)', 'Cruzar el Puente de los Suspiros aguantando la respiración para pedir un deseo (Gratis)', 'Almuerzo ceviche clásico de corvina con camote glaseado y chicha morada (45 - 80 PEN)']::text[],
  ARRAY['Probar un pisco sour en las tabernas centenarias de Barranco como el Bar Juanito']::text[],
  ARRAY['Lima es la única capital de Sudamérica ubicada directamente frente a la costa del océano']::text[],
  '{"address":"Malecón Balta / Barranco, Lima","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Caminata por el Parque del Amor con mosaicos poéticos (Gratis)","Cruzar el Puente de los Suspiros aguantando la respiración para pedir un deseo (Gratis)","Almuerzo ceviche clásico de corvina con camote glaseado y chicha morada (45 - 80 PEN)"],"datos_curiosos":["Lima es la única capital de Sudamérica ubicada directamente frente a la costa del océano"],"consejos":["Probar un pisco sour en las tabernas centenarias de Barranco como el Bar Juanito"],"location_info":{"address":"Malecón Balta / Barranco, Lima","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f8178501-90ad-fb44-71e2-0dfe67ac4125',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  2,
  'Día 2: Centro Histórico de Lima y Catacumbas de San Francisco',
  'Balcones coloniales de madera tallada y criptas subterráneas virreinales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2cc45344-c26a-2a1d-4fa6-27cf7372b9b4',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'f8178501-90ad-fb44-71e2-0dfe67ac4125',
  2,
  2,
  'Plaza Mayor y Basílica y Convento de San Francisco',
  -12.046,
  -77.0305,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El núcleo de la Ciudad de los Reyes virreinal. El convento de San Francisco custodia una biblioteca de 25.000 libros raros y catacumbas subterráneas con osarios que albergan más de 25.000 osamentas humanas.',
  ARRAY['Recorrido guiado por las catacumbas subterráneas (Entrada: 15 PEN / ~$4 USD)', 'Ver el cambio de guardia en el Palacio de Gobierno a mediodía (Gratis)', 'Probar churros rellenos de manjar blanco en la calle Lampa (5 PEN)']::text[],
  ARRAY['Las catacumbas tienen techos bajos en algunos tramos; caminar con atención']::text[],
  ARRAY['Las catacumbas sirvieron como el primer cementerio público de Lima colonial hasta principios del siglo XIX']::text[],
  '{"address":"Jirón Lampa, Centro Histórico de Lima","priceRange":"$ - Entrada 15 PEN","dia":2,"day":2}'::jsonb,
  150,
  '{"dia":2,"day":2,"activities":["Recorrido guiado por las catacumbas subterráneas (Entrada: 15 PEN / ~$4 USD)","Ver el cambio de guardia en el Palacio de Gobierno a mediodía (Gratis)","Probar churros rellenos de manjar blanco en la calle Lampa (5 PEN)"],"datos_curiosos":["Las catacumbas sirvieron como el primer cementerio público de Lima colonial hasta principios del siglo XIX"],"consejos":["Las catacumbas tienen techos bajos en algunos tramos; caminar con atención"],"location_info":{"address":"Jirón Lampa, Centro Histórico de Lima","priceRange":"$ - Entrada 15 PEN","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e841a3df-8b04-73d5-0fd7-cebf6240745f',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  3,
  'Día 3: Islas Ballestas y Huacachina en Ica',
  'Leones marinos, pingüinos de Humboldt y oasis en medio de dunas gigantes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '69041287-a4bc-b4b5-1b76-b069ed43e2cd',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'e841a3df-8b04-73d5-0fd7-cebf6240745f',
  3,
  3,
  'Reserva Marina Islas Ballestas y Oasis de Huacachina',
  -13.738,
  -76.398,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Conocidas como las "Galápagos peruanas" por su increíble concentración de fauna marina salvaje. Más al sur, el oasis natural de Huacachina rodeado por las dunas de arena más altas de Sudamérica.',
  ARRAY['Tour en lancha rápida por los arcos de piedra de las Ballestas (50 PEN / ~$14 USD + tasa marina)', 'Ver el misterioso geoglifo de El Candelabro grabado en la colina costera (Gratis con tour)', 'Paseo en buggy arenero y sandboard por las dunas de Huacachina (40 - 60 PEN)']::text[],
  ARRAY['Llevar cortavientos para la lancha; el viento marino puede ser frío en la mañana']::text[],
  ARRAY['Las islas fueron la mayor fuente de riqueza del Perú en el siglo XIX por la explotación del guano de aves marinas']::text[],
  '{"address":"Paracas / Huacachina, Ica","priceRange":"$$ - Tours combinados","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Tour en lancha rápida por los arcos de piedra de las Ballestas (50 PEN / ~$14 USD + tasa marina)","Ver el misterioso geoglifo de El Candelabro grabado en la colina costera (Gratis con tour)","Paseo en buggy arenero y sandboard por las dunas de Huacachina (40 - 60 PEN)"],"datos_curiosos":["Las islas fueron la mayor fuente de riqueza del Perú en el siglo XIX por la explotación del guano de aves marinas"],"consejos":["Llevar cortavientos para la lancha; el viento marino puede ser frío en la mañana"],"location_info":{"address":"Paracas / Huacachina, Ica","priceRange":"$$ - Tours combinados","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '14943f59-d9e5-7acc-52bd-75a71bf6a54e',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  4,
  'Día 4: Arequipa: La Ciudad Blanca y el Volcán Misti',
  'Monumentos labrados en sillar blanco volcánico a 2.325 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '640a98e8-a160-4f67-4063-e06aada2401d',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '14943f59-d9e5-7acc-52bd-75a71bf6a54e',
  4,
  4,
  'Plaza de Armas de Arequipa y Monasterio de Santa Catalina',
  -16.3989,
  -71.5369,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Arequipa está construida con sillar, piedra volcánica blanca extraída de las canteras del volcán Misti. El Monasterio de Santa Catalina es una ciudadela dentro de la ciudad con claustros pintados de azul y terracota.',
  ARRAY['Visita guiada al interior del Monasterio de Santa Catalina (Entrada: 45 PEN / ~$12 USD)', 'Mirador de la plaza con el volcán Misti de fondo coronado de nieve (Gratis)', 'Almorzar en una picantería tradicional: rocoto relleno con pastel de papa (35 - 55 PEN)']::text[],
  ARRAY['Arequipa es la parada intermedia perfecta para aclimatarse a la altura antes del Colca y Cusco']::text[],
  ARRAY['El convento de Santa Catalina funcionó como clausura absoluta durante cuatro siglos sin contacto con el mundo exterior']::text[],
  '{"address":"Santa Catalina 301, Arequipa","priceRange":"$$ - Entrada convento","dia":4,"day":4}'::jsonb,
  210,
  '{"dia":4,"day":4,"activities":["Visita guiada al interior del Monasterio de Santa Catalina (Entrada: 45 PEN / ~$12 USD)","Mirador de la plaza con el volcán Misti de fondo coronado de nieve (Gratis)","Almorzar en una picantería tradicional: rocoto relleno con pastel de papa (35 - 55 PEN)"],"datos_curiosos":["El convento de Santa Catalina funcionó como clausura absoluta durante cuatro siglos sin contacto con el mundo exterior"],"consejos":["Arequipa es la parada intermedia perfecta para aclimatarse a la altura antes del Colca y Cusco"],"location_info":{"address":"Santa Catalina 301, Arequipa","priceRange":"$$ - Entrada convento","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fd3cf84f-f700-02e6-a0e7-b7785264aab6',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  5,
  'Día 5: El Cañón del Colca: El Vuelo Solemne del Cóndor',
  'Uno de los cañones más profundos del mundo y avistamiento del ave sagrada.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '42c95589-18c3-1d3f-e938-579258f0e130',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'fd3cf84f-f700-02e6-a0e7-b7785264aab6',
  5,
  5,
  'Mirador Cruz del Cóndor en el Cañón del Colca',
  -15.611,
  -71.905,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Abismo geológico colosal que supera los 3.200 metros de profundidad. En el mirador de la Cruz del Cóndor, las corrientes térmicas matutinas permiten ver a cóndores andinos gigantes planear a escasos metros de los visitantes.',
  ARRAY['Avistamiento de cóndores andinos con envergadura de más de 3 metros (Boleto Turístico del Colca: 70 PEN)', 'Baño en los termales medicinales de La Calera en Chivay (15 PEN)', 'Fotografiar manadas de vicuñas y alpacas en la Reserva de Salinas y Aguada Blanca']::text[],
  ARRAY['Los cóndores planean entre las 8:00 AM y las 10:00 AM; madrugar desde Chivay a las 6:00 AM', 'Llevar abrigo grueso; en el mirador la mañana es helada']::text[],
  ARRAY['El cóndor andino casi no aletea; aprovecha las corrientes ascendentes de aire caliente del cañón para planear durante horas enteras']::text[],
  '{"address":"Chivay / Cabanaconde, Arequipa","priceRange":"$$ - Boleto turístico","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Avistamiento de cóndores andinos con envergadura de más de 3 metros (Boleto Turístico del Colca: 70 PEN)","Baño en los termales medicinales de La Calera en Chivay (15 PEN)","Fotografiar manadas de vicuñas y alpacas en la Reserva de Salinas y Aguada Blanca"],"datos_curiosos":["El cóndor andino casi no aletea; aprovecha las corrientes ascendentes de aire caliente del cañón para planear durante horas enteras"],"consejos":["Los cóndores planean entre las 8:00 AM y las 10:00 AM; madrugar desde Chivay a las 6:00 AM","Llevar abrigo grueso; en el mirador la mañana es helada"],"location_info":{"address":"Chivay / Cabanaconde, Arequipa","priceRange":"$$ - Boleto turístico","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '823d8ad1-11f8-e415-2a5e-ad949cf88de7',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  6,
  'Día 6: Ruta Panorámica hacia Cusco: Cordillera y Alpacas',
  'Viaje a través del altiplano y llegada a la capital del imperio inca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0753f886-10d7-5fe1-8941-e512fc430d90',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '823d8ad1-11f8-e415-2a5e-ad949cf88de7',
  6,
  6,
  'Mirador de los Volcanes de Patapampa (4.910 msnm) y Llegada a Cusco',
  -15.75,
  -71.58,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'El punto más alto de la carretera andina donde se contemplan volcanes como el Sabancaya activo y el Ampato. Al final de la tarde, descenso y llegada al valle sagrado del Cusco.',
  ARRAY['Fotografía de los volcanes nevados desde el punto geodésico más alto (Gratis)', 'Hacer una apacheta (torre ritual de piedras) en ofrenda a la Pachamama (Gratis)', 'Llegada y cena reconfortante de sopa de quinua en Cusco (25 PEN)']::text[],
  ARRAY['La parada en Patapampa dura solo 15 minutos debido a la extrema altitud para no marearse']::text[],
  ARRAY['En las faldas del volcán Ampato fue hallada en 1995 la Dama de Ampato (la momia Juanita), doncella inca congelada intacta']::text[],
  '{"address":"Paso de Patapampa / Cusco","priceRange":"$ - Ruta escénica","dia":6,"day":6}'::jsonb,
  120,
  '{"dia":6,"day":6,"activities":["Fotografía de los volcanes nevados desde el punto geodésico más alto (Gratis)","Hacer una apacheta (torre ritual de piedras) en ofrenda a la Pachamama (Gratis)","Llegada y cena reconfortante de sopa de quinua en Cusco (25 PEN)"],"datos_curiosos":["En las faldas del volcán Ampato fue hallada en 1995 la Dama de Ampato (la momia Juanita), doncella inca congelada intacta"],"consejos":["La parada en Patapampa dura solo 15 minutos debido a la extrema altitud para no marearse"],"location_info":{"address":"Paso de Patapampa / Cusco","priceRange":"$ - Ruta escénica","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '6be49a13-021a-86ff-914e-e2e24c238117',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  7,
  'Día 7: Cusco Monumental: Qorikancha y Sacsayhuamán',
  'La piedra de los doce ángulos y los megalitos de piedra caliza.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'eed92551-9908-1678-e54a-7d9e9db6cbf4',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '6be49a13-021a-86ff-914e-e2e24c238117',
  7,
  7,
  'Sacsayhuamán y Templo del Sol Qorikancha',
  -13.5048,
  -71.9818,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Recorrido por la arquitectura maestra del Tahuantinsuyo: megalitos ciclópeos y muros pulidos que sobrevivieron a terremotos.',
  ARRAY['Muros de Sacsayhuamán (Boleto Turístico Integral: 130 PEN)', 'Qorikancha (15 PEN)', 'Piedra de los 12 Ángulos (Gratis)']::text[],
  ARRAY['Llevar calzado deportivo con buena suela para caminar en cuestas empedradas']::text[],
  ARRAY['Las piedras encajan con tal precisión milimétrica que no se puede pasar una hoja de papel entre ellas']::text[],
  '{"address":"Cusco Histórico","priceRange":"$$ - Boleto turístico","dia":7,"day":7}'::jsonb,
  200,
  '{"dia":7,"day":7,"activities":["Muros de Sacsayhuamán (Boleto Turístico Integral: 130 PEN)","Qorikancha (15 PEN)","Piedra de los 12 Ángulos (Gratis)"],"datos_curiosos":["Las piedras encajan con tal precisión milimétrica que no se puede pasar una hoja de papel entre ellas"],"consejos":["Llevar calzado deportivo con buena suela para caminar en cuestas empedradas"],"location_info":{"address":"Cusco Histórico","priceRange":"$$ - Boleto turístico","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2a0595a2-11fa-e4bd-ad0f-a00f3aae4321',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  8,
  'Día 8: Valle Sagrado: Mercado de Písac y Salineras de Maras',
  'Miles de pozas de sal rosada milenarias y terrazas concéntricas de Moray.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd9b20bde-355b-e2c5-5a46-767a679bb879',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '2a0595a2-11fa-e4bd-ad0f-a00f3aae4321',
  8,
  8,
  'Salineras de Maras y Terrazas de Moray',
  -13.303,
  -72.155,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'Maras está formado por más de 3.000 pozas de sal rosada alimentadas por un manantial hipersalino subterráneo. Moray exhibe colosales terrazas agrícolas circulares concéntricas que funcionaron como laboratorio botánico inca.',
  ARRAY['Fotografiar el mosaico blanco y rosado de las Salineras de Maras (Entrada comunitaria: 20 PEN)', 'Caminar por los bordes de los cráteres agrícolas de Moray (Boleto Turístico)', 'Comprar sales gourmet con especias andinas (10 - 25 PEN)']::text[],
  ARRAY['Por razones de salubridad y conservación no se permite caminar dentro de las pozas activas de sal']::text[],
  ARRAY['En Moray la diferencia de temperatura entre la terraza superior y la más profunda del fondo llega a ser de hasta 15°C creando múltiples microclimas']::text[],
  '{"address":"Maras y Moray, Urubamba","priceRange":"$ - Entrada 20 PEN","dia":8,"day":8}'::jsonb,
  210,
  '{"dia":8,"day":8,"activities":["Fotografiar el mosaico blanco y rosado de las Salineras de Maras (Entrada comunitaria: 20 PEN)","Caminar por los bordes de los cráteres agrícolas de Moray (Boleto Turístico)","Comprar sales gourmet con especias andinas (10 - 25 PEN)"],"datos_curiosos":["En Moray la diferencia de temperatura entre la terraza superior y la más profunda del fondo llega a ser de hasta 15°C creando múltiples microclimas"],"consejos":["Por razones de salubridad y conservación no se permite caminar dentro de las pozas activas de sal"],"location_info":{"address":"Maras y Moray, Urubamba","priceRange":"$ - Entrada 20 PEN","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '66874b03-da25-ebcf-6c11-e8dfe622f228',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  9,
  'Día 9: Fortaleza de Ollantaytambo y Tren hacia Aguas Calientes',
  'Pueblo inca viviente y viaje en tren a la puerta de Machu Picchu.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8e43cb83-3865-db6b-3d42-4cb3846852eb',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '66874b03-da25-ebcf-6c11-e8dfe622f228',
  9,
  9,
  'Ollantaytambo y Tren Escénico',
  -13.258,
  -72.263,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'Terrazas defensivas y viaje en tren a orillas del río Urubamba hacia el pueblo de Machu Picchu.',
  ARRAY['Subir a los monolitos de Ollantaytambo (Boleto Turístico)', 'Tren hacia Aguas Calientes (~$75 USD)', 'Noche en Aguas Calientes']::text[],
  ARRAY['Dejar las maletas grandes en Cusco y viajar ligero']::text[],
  ARRAY['Las aguas termales de Aguas Calientes le dan el nombre al pueblo al pie del santuario']::text[],
  '{"address":"Ollantaytambo / Aguas Calientes","priceRange":"$$$ - Tren","dia":9,"day":9}'::jsonb,
  240,
  '{"dia":9,"day":9,"activities":["Subir a los monolitos de Ollantaytambo (Boleto Turístico)","Tren hacia Aguas Calientes (~$75 USD)","Noche en Aguas Calientes"],"datos_curiosos":["Las aguas termales de Aguas Calientes le dan el nombre al pueblo al pie del santuario"],"consejos":["Dejar las maletas grandes en Cusco y viajar ligero"],"location_info":{"address":"Ollantaytambo / Aguas Calientes","priceRange":"$$$ - Tren","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd7c4006f-aa4b-dd49-78ae-b10a2dd30795',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  10,
  'Día 10: La Ciudadela Sagrada de Machu Picchu',
  'El día cumbre: amanecer y circuito completo en la joya del Tahuantinsuyo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '70b04c44-3f8b-8746-0ef3-d524b2fc045d',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'd7c4006f-aa4b-dd49-78ae-b10a2dd30795',
  10,
  10,
  'Santuario Histórico de Machu Picchu',
  -13.1631,
  -72.545,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'La maravilla mundial construida por el inca Pachacútec en el siglo XV rodeada de montañas verdes que rozan las nubes.',
  ARRAY['Circuito guiado oficial por la ciudadela sagrada (Entrada: 152 PEN / ~$41 USD)', 'Subida en bus ecológico Consettur ($24 USD ida y vuelta)', 'Retorno en tren por la tarde hacia Cusco']::text[],
  ARRAY['Llevar pasaporte físico y agua en cantimplora no descartable']::text[],
  ARRAY['Machu Picchu nunca fue descubierta por los conquistadores españoles, lo que permitió que sobreviviera intacta hasta el siglo XX']::text[],
  '{"address":"Machu Picchu, Cusco","priceRange":"$$$ - Entrada oficial","dia":10,"day":10}'::jsonb,
  300,
  '{"dia":10,"day":10,"activities":["Circuito guiado oficial por la ciudadela sagrada (Entrada: 152 PEN / ~$41 USD)","Subida en bus ecológico Consettur ($24 USD ida y vuelta)","Retorno en tren por la tarde hacia Cusco"],"datos_curiosos":["Machu Picchu nunca fue descubierta por los conquistadores españoles, lo que permitió que sobreviviera intacta hasta el siglo XX"],"consejos":["Llevar pasaporte físico y agua en cantimplora no descartable"],"location_info":{"address":"Machu Picchu, Cusco","priceRange":"$$$ - Entrada oficial","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8cbf69fe-dbee-50c3-9490-ac8e795483e1',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  11,
  'Día 11: Montaña de los 7 Colores (Vinicunca)',
  'Trekking temprano a 5.036 msnm frente al arcoíris mineral de los Andes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9b014168-2a35-b893-91e6-a00e63ae2bd1',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '8cbf69fe-dbee-50c3-9490-ac8e795483e1',
  11,
  11,
  'Montaña de Siete Colores Vinicunca',
  -13.869,
  -71.303,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'Formación geológica única donde franjas minerales de óxidos de hierro, azufre y magnesio crearon capas multicolores turquesa, dorado, rojo y fucsia.',
  ARRAY['Caminata de ascenso de 1.5 horas hasta el mirador a 5.036 metros (Entrada comunitaria: 25 PEN / ~$7 USD)', 'Alquiler de caballo con arriero local si se siente cansancio (60 - 80 PEN opcional)', 'Fotografía panorámica del nevado sagrado Ausangate (Gratis)']::text[],
  ARRAY['La salida desde Cusco es a las 4:00 AM; llevar ropa muy abrigada pues en la cima hay viento helado']::text[],
  ARRAY['La montaña permaneció oculta bajo capas de nieve perpetua hasta que el cambio climático derritió la cubierta helada hace apenas una década']::text[],
  '{"address":"Cusipata / Pitumarca, Canchis","priceRange":"$$ - Excursión ~$35 USD","dia":11,"day":11}'::jsonb,
  300,
  '{"dia":11,"day":11,"activities":["Caminata de ascenso de 1.5 horas hasta el mirador a 5.036 metros (Entrada comunitaria: 25 PEN / ~$7 USD)","Alquiler de caballo con arriero local si se siente cansancio (60 - 80 PEN opcional)","Fotografía panorámica del nevado sagrado Ausangate (Gratis)"],"datos_curiosos":["La montaña permaneció oculta bajo capas de nieve perpetua hasta que el cambio climático derritió la cubierta helada hace apenas una década"],"consejos":["La salida desde Cusco es a las 4:00 AM; llevar ropa muy abrigada pues en la cima hay viento helado"],"location_info":{"address":"Cusipata / Pitumarca, Canchis","priceRange":"$$ - Excursión ~$35 USD","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f1595de5-de0a-49d1-50de-a44814819438',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  12,
  'Día 12: La Ruta del Sol hacia Puno: Raqch''i y Andahuaylillas',
  'Viaje en bus turístico atravesando el paso de La Raya a 4.335 metros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a4edea85-6942-343b-6dba-3c95e86b522c',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'f1595de5-de0a-49d1-50de-a44814819438',
  12,
  12,
  'Templo del Dios Wiracocha en Raqch''i y Capilla de Andahuaylillas',
  -14.195,
  -71.371,
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80']::text[],
  'La Ruta del Sol une Cusco con Puno. Visita la iglesia de San Pedro de Andahuaylillas (la "Capilla Sixtina de América") por sus frescos y pan de oro, y el colosal Templo de Raqch''i con muros de 14 metros de adobe y piedra.',
  ARRAY['Visitar la Capilla Sixtina andina de Andahuaylillas (15 PEN)', 'Recorrer las columnas del Templo de Wiracocha en Raqch''i (15 PEN)', 'Foto en el hito de La Raya a 4.335 msnm divisando la cordillera (Gratis)']::text[],
  ARRAY['Los buses turísticos de La Ruta del Sol incluyen almuerzo buffet andino en Sicuani']::text[],
  ARRAY['Wiracocha era para los incas el dios creador supremo del universo, el sol y la luna']::text[],
  '{"address":"Ruta del Sol Cusco - Puno","priceRange":"$$ - Bus turístico con paradas","dia":12,"day":12}'::jsonb,
  360,
  '{"dia":12,"day":12,"activities":["Visitar la Capilla Sixtina andina de Andahuaylillas (15 PEN)","Recorrer las columnas del Templo de Wiracocha en Raqch''i (15 PEN)","Foto en el hito de La Raya a 4.335 msnm divisando la cordillera (Gratis)"],"datos_curiosos":["Wiracocha era para los incas el dios creador supremo del universo, el sol y la luna"],"consejos":["Los buses turísticos de La Ruta del Sol incluyen almuerzo buffet andino en Sicuani"],"location_info":{"address":"Ruta del Sol Cusco - Puno","priceRange":"$$ - Bus turístico con paradas","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c92abc09-d09f-3d02-3228-6b18ff6dfbc2',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  13,
  'Día 13: El Lago Sagrado Titicaca y las Islas Flotantes de los Uros',
  'Navegación a 3.812 metros sobre islas artificiales hechas de caña de totora.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7dcb5796-ee69-229a-31ba-d7f138e3ea0d',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  'c92abc09-d09f-3d02-3228-6b18ff6dfbc2',
  13,
  13,
  'Islas Flotantes de Totora de los Uros',
  -15.82,
  -69.97,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El lago navegable más alto del planeta (3.812 msnm). El pueblo ancestral Uro vive sobre plataformas flotantes hechas enteramente de capas trenzadas de raíces y cañas de totora que renuevan periódicamente.',
  ARRAY['Caminar sobre el suelo elástico de totora y conocer la vivienda tradicional (Tour en lancha: 40 - 70 PEN)', 'Paseo en balsa tradicional de totora llamada "Mercedes Benz del lago" (15 PEN opcional)', 'Probar el tallo dulce comestible de la totora llamado *chullo* (Gratis)']::text[],
  ARRAY['La radiación solar en el Titicaca es sumamente intensa; usar sombrero y bloqueador potente']::text[],
  ARRAY['Los Uros construyeron sus islas flotantes en el lago para escapar del avance militar y los tributos de los incas']::text[],
  '{"address":"Lago Titicaca, Bahía de Puno","priceRange":"$ - Tour comunitario","dia":13,"day":13}'::jsonb,
  180,
  '{"dia":13,"day":13,"activities":["Caminar sobre el suelo elástico de totora y conocer la vivienda tradicional (Tour en lancha: 40 - 70 PEN)","Paseo en balsa tradicional de totora llamada \"Mercedes Benz del lago\" (15 PEN opcional)","Probar el tallo dulce comestible de la totora llamado *chullo* (Gratis)"],"datos_curiosos":["Los Uros construyeron sus islas flotantes en el lago para escapar del avance militar y los tributos de los incas"],"consejos":["La radiación solar en el Titicaca es sumamente intensa; usar sombrero y bloqueador potente"],"location_info":{"address":"Lago Titicaca, Bahía de Puno","priceRange":"$ - Tour comunitario","dia":13,"day":13}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '753180bb-e75a-3765-4c58-6858a2db32d9',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  14,
  'Día 14: Isla de Taquile: Arte Textil UNESCO y Vistas al Horizonte',
  'Isla donde los hombres tejen y las tradiciones comunitarias son ley.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '39a0cf5c-8c27-e250-5699-8afda894bf95',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '753180bb-e75a-3765-4c58-6858a2db32d9',
  14,
  14,
  'Isla de Taquile y Plaza de la Comunidad',
  -15.772,
  -69.686,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Isla natural del lago donde la comunidad conserva un estilo de vida prehispánico comunal sin policías ni automóviles. Su arte textil fue proclamado Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad por la UNESCO.',
  ARRAY['Subir los 530 escalones empedrados hasta la plaza principal con vistas al lago infinito (Gratis)', 'Apreciar el tejido manual en telar de cintura que realizan exclusivamente los varones', 'Almuerzo comunitario de trucha a la plancha con papas andinas y sopa de quinua (30 PEN)']::text[],
  ARRAY['El color y forma del gorro (*chullo*) de los hombres indica si son solteros, casados o autoridades comunales']::text[],
  ARRAY['En Taquile los varones aprenden a tejer desde niños y deben tejer un chullo tan fino que pueda retener agua sin filtrarse para demostrar su maestría']::text[],
  '{"address":"Isla Taquile, Lago Titicaca","priceRange":"$$ - Excursión lacustre","dia":14,"day":14}'::jsonb,
  240,
  '{"dia":14,"day":14,"activities":["Subir los 530 escalones empedrados hasta la plaza principal con vistas al lago infinito (Gratis)","Apreciar el tejido manual en telar de cintura que realizan exclusivamente los varones","Almuerzo comunitario de trucha a la plancha con papas andinas y sopa de quinua (30 PEN)"],"datos_curiosos":["En Taquile los varones aprenden a tejer desde niños y deben tejer un chullo tan fino que pueda retener agua sin filtrarse para demostrar su maestría"],"consejos":["El color y forma del gorro (*chullo*) de los hombres indica si son solteros, casados o autoridades comunales"],"location_info":{"address":"Isla Taquile, Lago Titicaca","priceRange":"$$ - Excursión lacustre","dia":14,"day":14}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9db92c49-9003-ebd0-36a1-1600d1689944',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  15,
  'Día 15: Necrópolis de Sillustani y Despedida Andina',
  'Torres funerarias preincas frente a la mística Laguna Umayo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1cceae88-5a09-a69a-9b3a-5a304285a7b4',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '9db92c49-9003-ebd0-36a1-1600d1689944',
  15,
  15,
  'Chullpas Funerarias de Sillustani',
  -15.721,
  -70.16,
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80']::text[],
  'Cementerio sagrado de la cultura Kolla e Inca emplazado en una península sobre la laguna Umayo. Destaca por sus *chullpas*: torres funerarias cilíndricas de piedra tallada de hasta 12 metros de altura donde eran sepultados los nobles momificados.',
  ARRAY['Recorrido por las torres funerarias circulares (Entrada: 15 PEN / ~$4 USD)', 'Contemplar el silencio y las aves acuáticas de la Laguna Umayo (Gratis)', 'Traslado al aeropuerto de Juliaca para el vuelo de regreso a Lima y conexión internacional']::text[],
  ARRAY['Sillustani queda de camino entre Puno y el aeropuerto de Juliaca, lo que optimiza los traslados']::text[],
  ARRAY['La entrada de cada torre funeraria apunta exactamente hacia el este, por donde nace el sol cada mañana, simbolizando el renacimiento del alma']::text[],
  '{"address":"Laguna Umayo, Atuncolla, Puno","priceRange":"$ - Entrada 15 PEN","dia":15,"day":15}'::jsonb,
  120,
  '{"dia":15,"day":15,"activities":["Recorrido por las torres funerarias circulares (Entrada: 15 PEN / ~$4 USD)","Contemplar el silencio y las aves acuáticas de la Laguna Umayo (Gratis)","Traslado al aeropuerto de Juliaca para el vuelo de regreso a Lima y conexión internacional"],"datos_curiosos":["La entrada de cada torre funeraria apunta exactamente hacia el este, por donde nace el sol cada mañana, simbolizando el renacimiento del alma"],"consejos":["Sillustani queda de camino entre Puno y el aeropuerto de Juliaca, lo que optimiza los traslados"],"location_info":{"address":"Laguna Umayo, Atuncolla, Puno","priceRange":"$ - Entrada 15 PEN","dia":15,"day":15}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '20a5bfd3-d889-5959-91ea-276737b4ac96',
  '95ccb650-a015-d6b1-d2d9-3c0175818705',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

COMMIT;

-- ===================================================================
-- End of Seed Data: 16 Tours, 105 Days, 119 Stops.
-- ===================================================================