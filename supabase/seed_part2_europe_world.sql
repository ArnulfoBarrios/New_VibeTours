-- ===================================================================
-- VibeTours - Seed Data: Parte 2: Europa, Asia, África & Oceanía (Tours 17 - 30) (Parte 2 de 3)
-- Creator: Emotiva VibeTours (7b767010-fc97-4299-9ae3-5a4985da1da3)
-- Generated: 2026-09-08T16:21:54.286Z
-- Total Tours in this script: 14
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
  'vibetour-ruta-romantica-baviera-6d',
  'vibetour-paris-bohemio-castillos-loira-7d',
  'vibetour-grecia-clasica-islas-egeo-8d',
  'vibetour-tesoros-del-danubio-praga-viena-budapest-9d',
  'vibetour-gran-italia-monumental-10d',
  'vibetour-reino-unido-londres-highlands-10d',
  'vibetour-la-gran-espana-madrid-andalucia-barcelona-12d',
  'vibetour-dubai-abu-dhabi-nocturno-5d',
  'vibetour-japon-esencial-tokio-kioto-nara-7d',
  'vibetour-tailandia-culinaria-bangkok-krabi-9d',
  'vibetour-turquia-oriente-a-occidente-10d',
  'vibetour-la-gran-travesia-nipona-14d',
  'vibetour-egipto-faraonico-guiza-luxor-nilo-8d',
  'vibetour-australia-extrema-barrera-sydney-12d'
);

-- 3. Insert Tours, Tour Days, georeferenced Stops, and Verified Reviews

-- -------------------------------------------------------------
-- Tour: Ruta Romántica de Baviera: Castillos de Cuento y Pueblos Medievales (Múnich, Alemania)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-ruta-romantica-baviera-6d',
  'Ruta Romántica de Baviera: Castillos de Cuento y Pueblos Medievales',
  'Alemania',
  'Múnich',
  'family',
  'Viaje de ensueño de 6 días por los paisajes bávaros que inspiraron los cuentos de hadas. Desde los jardines cerveceros de Múnich hasta el idílico castillo de Neuschwanstein y las murallas de Rothenburg ob der Tauber.',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  8640,
  340000,
  'easy',
  'es',
  4.95,
  125,
  420,
  ARRAY['Alemania', 'Baviera', 'Neuschwanstein', 'Múnich', 'Rothenburg', 'Castillos', 'Familiar']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":550,"estimatedPerPersonMax":1100,"notes":"Bayern Ticket tren (~€29 para grupos), entradas castillos (~€18 c/u) y gastronomía bávara"}'::jsonb,
  ARRAY['Familias con niños', 'Parejas', 'Fotógrafos de paisajes']::text[],
  'Mayo a Octubre (primavera/verano verde) o Diciembre (mercados navideños)',
  'Tours de castillos por la mañana y paseos vespertinos en centros históricos',
  'Marienplatz frente al Nuevo Ayuntamiento, Múnich',
  ARRAY['Ruta en coche / tren de la Romantische Straße', 'Horarios de apertura y miradores libres', 'Recomendación de posadas bávaras']::text[],
  ARRAY['Boleto al interior del Castillo de Neuschwanstein', 'Alquiler de coche o billetes de tren Bayern Ticket']::text[],
  ARRAY['Reservar la entrada al castillo de Neuschwanstein con semanas de anticipación en el portal oficial', 'Llevar calzado cómodo para caminar en cuestas']::text[],
  ARRAY['Ropa abrigada por capas', 'Chubasquero o paraguas compacto', 'Cámara fotográfica']::text[],
  ARRAY['Prohibido fotografiar con flash dentro de los salones reales']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '18aaf965-de94-a5b2-a7f3-35c7cab0c095',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  1,
  'Día 1: Múnich Clásico: Marienplatz, Carrillón y Cervecerías',
  'Exploración del casco antiguo de la capital de Baviera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a8ba2a05-6453-b905-3632-6396fb28d7c4',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  '18aaf965-de94-a5b2-a7f3-35c7cab0c095',
  1,
  1,
  'Marienplatz, Glockenspiel y Hofbräuhaus',
  48.1371,
  11.5754,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Plaza principal de Múnich presidida por el Neues Rathaus de estilo neogótico flamígero. Su famoso Glockenspiel hace bailar a figuras mecánicas al ritmo de campanas. A pocas cuadras se encuentra la cervecería Hofbräuhaus fundada en 1589.',
  ARRAY['Ver el espectáculo mecánico del Glockenspiel a las 11:00 AM o 12:00 PM (Gratis)', 'Subir a la torre de la Iglesia de San Pedro (Alter Peter) para ver los Alpes (€5)', 'Almorzar salchichas blancas Weißwurst con pretzel y cerveza en Hofbräuhaus (€18 - €28)']::text[],
  ARRAY['Las salchichas Weißwurst se comen tradicionalmente antes de las 12:00 del mediodía']::text[],
  ARRAY['Durante la construcción de la vecina catedral Frauenkirche el constructor engañó al diablo dejándolo mirar desde un punto donde no se veían ventanas ("la pisada del diablo")']::text[],
  '{"address":"Marienplatz 1, München","priceRange":"$$ - Moderado","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Ver el espectáculo mecánico del Glockenspiel a las 11:00 AM o 12:00 PM (Gratis)","Subir a la torre de la Iglesia de San Pedro (Alter Peter) para ver los Alpes (€5)","Almorzar salchichas blancas Weißwurst con pretzel y cerveza en Hofbräuhaus (€18 - €28)"],"datos_curiosos":["Durante la construcción de la vecina catedral Frauenkirche el constructor engañó al diablo dejándolo mirar desde un punto donde no se veían ventanas (\"la pisada del diablo\")"],"consejos":["Las salchichas Weißwurst se comen tradicionalmente antes de las 12:00 del mediodía"],"location_info":{"address":"Marienplatz 1, München","priceRange":"$$ - Moderado","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b397b6a6-b008-2508-47be-4ed87975f537',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  2,
  'Día 2: El Castillo de Cuento de Hadas: Neuschwanstein en Hohenschwangau',
  'El castillo que inspiró el palacio de la Cenicienta y el logo de Walt Disney.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a042c1bd-05eb-227f-0f84-a52ef0ab6a0c',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  'b397b6a6-b008-2508-47be-4ed87975f537',
  2,
  2,
  'Castillo de Neuschwanstein y Puente Marienbrücke',
  47.5576,
  10.7498,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Construido en lo alto de un desfiladero rocoso por el rey Luis II de Baviera ("el Rey Loco") en homenaje a las óperas de Richard Wagner. Sus torres estilizadas y salones neobizantinos inspiraron directamente el castillo de Disney.',
  ARRAY['Visita guiada oficial al interior del castillo (Entrada: €17.50)', 'Cruzar el puente colgante Marienbrücke suspendido sobre la cascada Pöllat para la foto clásica (Gratis)', 'Subida escénica en carruaje de caballos o caminata de 30 minutos por el bosque (€8 carruaje)']::text[],
  ARRAY['Llegar con 1 hora de anticipación a la hora impresa en el boleto; si se pasa el minuto exacto del turno de acceso, el boleto expira automáticamente']::text[],
  ARRAY['A pesar de su apariencia medieval, el castillo contaba en 1886 con calefacción central de aire caliente, inodoros con descarga automática y teléfono']::text[],
  '{"address":"Neuschwansteinstraße 20, Schwangau","priceRange":"$$ - Entrada oficial €17.50","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Visita guiada oficial al interior del castillo (Entrada: €17.50)","Cruzar el puente colgante Marienbrücke suspendido sobre la cascada Pöllat para la foto clásica (Gratis)","Subida escénica en carruaje de caballos o caminata de 30 minutos por el bosque (€8 carruaje)"],"datos_curiosos":["A pesar de su apariencia medieval, el castillo contaba en 1886 con calefacción central de aire caliente, inodoros con descarga automática y teléfono"],"consejos":["Llegar con 1 hora de anticipación a la hora impresa en el boleto; si se pasa el minuto exacto del turno de acceso, el boleto expira automáticamente"],"location_info":{"address":"Neuschwansteinstraße 20, Schwangau","priceRange":"$$ - Entrada oficial €17.50","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f9c22afe-e26f-bdd2-de3e-9dd4fd7b4f5f',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  3,
  'Día 3: Palacio de Linderhof y Monasterio de Ettal',
  'La joya rococó favorita de Luis II y los licores benedictinos de Ettal.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd307f19d-9fa4-6118-f90c-565a8da805f1',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  'f9c22afe-e26f-bdd2-de3e-9dd4fd7b4f5f',
  3,
  3,
  'Palacio de Linderhof y Abadía de Ettal',
  47.57,
  10.956,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El único palacio que Luis II vio completamente terminado. Inspirado en el Versalles de Luis XIV de Francia, cuenta con jardines en terrazas barrocas, fuentes doradas que lanzan chorros de 22 metros y la deslumbrante Gruta de Venus.',
  ARRAY['Tour guiado por los salones de espejos del palacio (Entrada: €10)', 'Pasear por los jardines y ver el encendido del géiser de la fuente dorada (Gratis con entrada)', 'Comprar licor de hierbas artesanal elaborado por los monjes de la Abadía de Ettal (€14 - €25)']::text[],
  ARRAY['La Gruta de Venus puede estar en restauración; consultar disponibilidad al comprar el ticket']::text[],
  ARRAY['Linderhof poseía una mesa comedor mecánica ("la mesa que se sirve sola") que bajaba por una trampilla a la cocina para que el rey no tuviera que ver a los sirvientes']::text[],
  '{"address":"Linderhof 12, Ettal","priceRange":"$ - Entrada €10","dia":3,"day":3}'::jsonb,
  180,
  '{"dia":3,"day":3,"activities":["Tour guiado por los salones de espejos del palacio (Entrada: €10)","Pasear por los jardines y ver el encendido del géiser de la fuente dorada (Gratis con entrada)","Comprar licor de hierbas artesanal elaborado por los monjes de la Abadía de Ettal (€14 - €25)"],"datos_curiosos":["Linderhof poseía una mesa comedor mecánica (\"la mesa que se sirve sola\") que bajaba por una trampilla a la cocina para que el rey no tuviera que ver a los sirvientes"],"consejos":["La Gruta de Venus puede estar en restauración; consultar disponibilidad al comprar el ticket"],"location_info":{"address":"Linderhof 12, Ettal","priceRange":"$ - Entrada €10","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e257c94b-63a9-d52c-b1bb-79ce62b76bd7',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  4,
  'Día 4: Rothenburg ob der Tauber: Murallas Medievales Intactas',
  'El pueblo medieval mejor conservado de Europa, calle Plönlein y Museo de Navidad.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '79a4884c-8abd-3e79-21c3-c9ef0ff3265c',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  'e257c94b-63a9-d52c-b1bb-79ce62b76bd7',
  4,
  4,
  'Plönlein y Murallas de Rothenburg ob der Tauber',
  49.3745,
  10.1789,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El rincón más fotografiado de Alemania: la pequeña casa de entramado de madera con dos torres medievales a los lados. Toda la ciudadela está rodeada por murallas con torres de guardia del siglo XIV totalmente transitables a pie.',
  ARRAY['Caminar sobre el adarve cubierto de las murallas medievales (Gratis)', 'Entrar a la tienda de Navidad Käthe Wohlfahrt y su museo del adorno navideño (€5 museo)', 'Probar el dulce tradicional Schneeball (bola de nieve de masa frita con azúcar y canela: €4)']::text[],
  ARRAY['Hacer el recorrido nocturno con el Sereno de la Ciudad (Night Watchman Tour) en inglés o alemán a las 8:00 PM (€9)']::text[],
  ARRAY['Durante la Segunda Guerra Mundial la ciudad se salvó de la destrucción total gracias a que el subsecretario de guerra estadounidense conocía la belleza histórica del pueblo y ordenó negociar la rendición']::text[],
  '{"address":"Plönlein, Rothenburg ob der Tauber","priceRange":"$ - Acceso libre","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Caminar sobre el adarve cubierto de las murallas medievales (Gratis)","Entrar a la tienda de Navidad Käthe Wohlfahrt y su museo del adorno navideño (€5 museo)","Probar el dulce tradicional Schneeball (bola de nieve de masa frita con azúcar y canela: €4)"],"datos_curiosos":["Durante la Segunda Guerra Mundial la ciudad se salvó de la destrucción total gracias a que el subsecretario de guerra estadounidense conocía la belleza histórica del pueblo y ordenó negociar la rendición"],"consejos":["Hacer el recorrido nocturno con el Sereno de la Ciudad (Night Watchman Tour) en inglés o alemán a las 8:00 PM (€9)"],"location_info":{"address":"Plönlein, Rothenburg ob der Tauber","priceRange":"$ - Acceso libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7173c664-38d7-c233-c2ea-10100460bd16',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  5,
  'Día 5: Wurzburgo: Residencia Barroca y Viñedos de Franconia',
  'El fin de la Ruta Romántica: el mayor fresco de techo del mundo y puente del vino.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '867df73e-843b-b611-9b8b-b8ba55a412d0',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  '7173c664-38d7-c233-c2ea-10100460bd16',
  5,
  5,
  'Residencia de Wurzburgo y Puente Viejo del Meno',
  49.7928,
  9.9388,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio de los príncipes-obispos declarado Patrimonio Mundial por la UNESCO. Su escalera imperial luce el fresco continuo más grande del mundo pintado por Tiepolo en 1753. En el puente de piedra del siglo XV, la gente se reúne a beber vino Silvaner en copa de cristal.',
  ARRAY['Admirar el fresco monumental de los cuatro continentes de Tiepolo (Entrada: €9)', 'Tomar una copa de vino blanco de Franconia de pie sobre el Puente Viejo con vista a la fortaleza Marienberg (€6)', 'Pasear por los jardines cortesanos de la Residencia (Gratis)']::text[],
  ARRAY['La botella de vino típica de Franconia tiene una forma ovalada única llamada Bocksbeutel']::text[],
  ARRAY['La bóveda de la escalera sobrevivió milagrosamente a los bombardeos de 1945 gracias a la genialidad estructural del arquitecto Balthasar Neumann']::text[],
  '{"address":"Residenzplatz 2, Würzburg","priceRange":"$ - Entrada €9","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Admirar el fresco monumental de los cuatro continentes de Tiepolo (Entrada: €9)","Tomar una copa de vino blanco de Franconia de pie sobre el Puente Viejo con vista a la fortaleza Marienberg (€6)","Pasear por los jardines cortesanos de la Residencia (Gratis)"],"datos_curiosos":["La bóveda de la escalera sobrevivió milagrosamente a los bombardeos de 1945 gracias a la genialidad estructural del arquitecto Balthasar Neumann"],"consejos":["La botella de vino típica de Franconia tiene una forma ovalada única llamada Bocksbeutel"],"location_info":{"address":"Residenzplatz 2, Würzburg","priceRange":"$ - Entrada €9","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '77d601f4-6069-b2e7-0e62-d7ffd2e325c6',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  6,
  'Día 6: Núremberg Imperial y Retorno a Múnich',
  'El castillo imperial sobre la roca, casa de Durero y salchichas a la leña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1cb8aa2f-e5fc-9deb-93a8-ba78a8f6bda7',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  '77d601f4-6069-b2e7-0e62-d7ffd2e325c6',
  6,
  6,
  'Castillo Imperial de Núremberg (Kaiserburg) y Mercado Central',
  49.4578,
  11.0772,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Sólida fortaleza que albergó las dietas imperiales de los emperadores del Sacro Imperio Romano Germánico. En el Hauptmarkt se alza la Fuente Hermosa (Schöner Brunnen) con su famoso anillo dorado giratorio de la suerte.',
  ARRAY['Girar el anillo dorado de latón de la Schöner Brunnen para atraer la fortuna (Gratis)', 'Comer las famosas 6 o 12 Nürnberger Rostbratwürste asadas a la leña de haya con chucrut (€12 - €16)', 'Comprar el auténtico pan de especias Lebkuchen de Núremberg (€6 - €15)']::text[],
  ARRAY['El tren ICE conecta Núremberg con Múnich en solo 1 hora y 5 minutos']::text[],
  ARRAY['Por ley imperial de 1356 (Bula de Oro), cada nuevo emperador electo debía celebrar su primera Dieta oficial en Núremberg']::text[],
  '{"address":"Burg 17, Nürnberg","priceRange":"$ - Acceso libre al patio","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Girar el anillo dorado de latón de la Schöner Brunnen para atraer la fortuna (Gratis)","Comer las famosas 6 o 12 Nürnberger Rostbratwürste asadas a la leña de haya con chucrut (€12 - €16)","Comprar el auténtico pan de especias Lebkuchen de Núremberg (€6 - €15)"],"datos_curiosos":["Por ley imperial de 1356 (Bula de Oro), cada nuevo emperador electo debía celebrar su primera Dieta oficial en Núremberg"],"consejos":["El tren ICE conecta Núremberg con Múnich en solo 1 hora y 5 minutos"],"location_info":{"address":"Burg 17, Nürnberg","priceRange":"$ - Acceso libre al patio","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '985ea961-a7bd-7f33-ab8e-9ab920058d87',
  'f8692232-7388-8a18-4925-1fa2d5ba871c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: París Bohemio y Castillos del Valle del Loira: Arte, Luz y Realeza (París, Francia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-paris-bohemio-castillos-loira-7d',
  'París Bohemio y Castillos del Valle del Loira: Arte, Luz y Realeza',
  'Francia',
  'París',
  'romantic',
  'Circuito romántico de 7 días que combina la magia de París (Montmartre, el Museo del Louvre, la Torre Eiffel iluminada y crucero por el Sena) con los suntuosos castillos renacentistas del Valle del Loira como Chenonceau sobre el agua y Chambord.',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80']::text[],
  10080,
  460000,
  'easy',
  'es',
  4.97,
  198,
  670,
  ARRAY['Francia', 'París', 'Valle del Loira', 'Chambord', 'Chenonceau', 'Romántico', 'Louvre', 'Torre Eiffel']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":650,"estimatedPerPersonMax":1300,"notes":"Louvre (~€22), Chenonceau (~€17), Chambord (~€16), TGV a Tours y gastronomía"}'::jsonb,
  ARRAY['Parejas', 'Amantes del arte y la arquitectura', 'Viajeros gourmet']::text[],
  'Abril a Octubre (jardines florecidos y fuentes activas)',
  'Museos con reserva horaria matutina y cenas románticas en bistrós',
  'Plaza del Trocadero, París',
  ARRAY['Ruta urbana de París y circuito del Valle del Loira', 'Recomendación de trenes TGV y cruceros fluviales', 'Guía de miradores románticos']::text[],
  ARRAY['Boletos al Museo del Louvre', 'Entradas a los castillos de Chenonceau y Chambord', 'Subida a la cima de la Torre Eiffel']::text[],
  ARRAY['Comprar la entrada al Louvre con hora exacta por internet; las taquillas físicas no garantizan acceso', 'Llevar candado si desea visitar puentes románticos']::text[],
  ARRAY['Ropa elegante y cómoda', 'Paraguas plegable', 'Zapatos cómodos para adoquines y gravilla de castillos']::text[],
  ARRAY['Prohibido el uso de trípodes dentro de salas de museos estatales']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3fd421ee-9bf3-7808-8fbc-ea241d305e71',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  1,
  'Día 1: Montmartre Bohemio: Sacré-Cœur y Plaza de los Pintores',
  'El rincón de los artistas impresionistas y vistas panorámicas de París.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c53e170c-0133-3543-442a-ca3f8282717a',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '3fd421ee-9bf3-7808-8fbc-ea241d305e71',
  1,
  1,
  'Basílica del Sagrado Corazón y Place du Tertre',
  48.8867,
  2.3431,
  'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80']::text[],
  'En la cima de la colina más alta de París. La basílica de piedra blanca de travertino domina toda la metrópoli. A espaldas, la Place du Tertre conserva a retratistas y pintores de caballete al aire libre como en los tiempos de Picasso y Renoir.',
  ARRAY['Entrar a la basílica y apreciar el inmenso mosaico dorado del Cristo en majestad (Gratis)', 'Hacerse un retrato o caricatura al carboncillo en la Place du Tertre (€30 - €60)', 'Visitar el Muro de los Te Quiero (Le mur des je t’aime) en la plaza Jehan Rictus (Gratis)']::text[],
  ARRAY['Subir en el funicular de Montmartre usando un billete sencillo de metro Ticket t+ (€2.15)', 'Cuidar carteras y mochilas de los carteristas en las escalinatas']::text[],
  ARRAY['La piedra de Château-Landon con la que está construida la basílica secreta calcita al llover, lo que hace que se limpie sola y se mantenga blanca']::text[],
  '{"address":"35 Rue du Chevalier de la Barre, Paris","priceRange":"$ - Entrada libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Entrar a la basílica y apreciar el inmenso mosaico dorado del Cristo en majestad (Gratis)","Hacerse un retrato o caricatura al carboncillo en la Place du Tertre (€30 - €60)","Visitar el Muro de los Te Quiero (Le mur des je t’aime) en la plaza Jehan Rictus (Gratis)"],"datos_curiosos":["La piedra de Château-Landon con la que está construida la basílica secreta calcita al llover, lo que hace que se limpie sola y se mantenga blanca"],"consejos":["Subir en el funicular de Montmartre usando un billete sencillo de metro Ticket t+ (€2.15)","Cuidar carteras y mochilas de los carteristas en las escalinatas"],"location_info":{"address":"35 Rue du Chevalier de la Barre, Paris","priceRange":"$ - Entrada libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '6a2fff05-7a2f-3a2a-3c27-047115bcbefc',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  2,
  'Día 2: El Museo del Louvre y Jardines de las Tullerías',
  'La Gioconda, la Victoria de Samotracia y el palacio de los reyes de Francia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5129db6f-f775-ef66-e342-69e4a5cbaae7',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '6a2fff05-7a2f-3a2a-3c27-047115bcbefc',
  2,
  2,
  'Museo del Louvre y Pirámide de Cristal de I.M. Pei',
  48.8606,
  2.3376,
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80']::text[],
  'El museo de arte más visitado del mundo ubicado en el antiguo palacio real. Custodia más de 35.000 obras maestras que van desde la estatuaria griega clásica hasta la pintura renacentista de Leonardo da Vinci.',
  ARRAY['Ver de cerca la Mona Lisa y la Venus de Milo (Entrada: €22 con reserva horaria obligatoria)', 'Fotografía simétrica bajo la pirámide de cristal en el patio Napoleón (Gratis)', 'Paseo relajado por el Jardín de las Tullerías y tomar un chocolate caliente Angelina (€9)']::text[],
  ARRAY['Ingresar por el centro comercial subterráneo Carrousel du Louvre para evitar las colas de la pirámide exterior', 'Cierra los martes; planificar la visita de miércoles a lunes']::text[],
  ARRAY['Si una persona dedicara solo 30 segundos a cada obra expuesta en el Louvre, tardaría 100 días ininterrumpidos en ver toda la colección']::text[],
  '{"address":"Rue de Rivoli, 75001 Paris","priceRange":"$$ - Entrada €22","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Ver de cerca la Mona Lisa y la Venus de Milo (Entrada: €22 con reserva horaria obligatoria)","Fotografía simétrica bajo la pirámide de cristal en el patio Napoleón (Gratis)","Paseo relajado por el Jardín de las Tullerías y tomar un chocolate caliente Angelina (€9)"],"datos_curiosos":["Si una persona dedicara solo 30 segundos a cada obra expuesta en el Louvre, tardaría 100 días ininterrumpidos en ver toda la colección"],"consejos":["Ingresar por el centro comercial subterráneo Carrousel du Louvre para evitar las colas de la pirámide exterior","Cierra los martes; planificar la visita de miércoles a lunes"],"location_info":{"address":"Rue de Rivoli, 75001 Paris","priceRange":"$$ - Entrada €22","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b87ea7aa-4164-a2ef-422e-54b57964974f',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  3,
  'Día 3: La Dama de Hierro y Crucero al Atardecer por el Sena',
  'La Torre Eiffel, el Campo de Marte y las luces de los puentes parisinos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'cb474833-65cd-ce2d-52fa-e2d1f29a8be1',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  'b87ea7aa-4164-a2ef-422e-54b57964974f',
  3,
  3,
  'Torre Eiffel y Crucero en Bateaux-Mouches',
  48.8584,
  2.2945,
  'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80']::text[],
  'El emblema indiscutible de Francia erigido por Gustave Eiffel para la Exposición Universal de 1889 con 330 metros de hierro pudelado. A sus pies, los barcos panorámicos navegan bajo los puentes históricos del Sena.',
  ARRAY['Subir en ascensor al segundo piso o cima de la Torre Eiffel (€18.80 - €29.40 según nivel)', 'Crucero panorámico de 1 hora por el río Sena pasando bajo Notre-Dame y el Puente Alejandro III (€17)', 'Ver el destello de miles de luces doradas de la torre que titilan durante 5 minutos cada hora al anochecer']::text[],
  ARRAY['La mejor panorámica fotográfica de la torre completa se obtiene desde la Plaza del Trocadero al atardecer']::text[],
  ARRAY['La Torre Eiffel se contrae y dilata con la temperatura: en verano puede crecer hasta 15 centímetros de altura debido a la dilatación térmica del hierro']::text[],
  '{"address":"Champ de Mars, 5 Av. Anatole France","priceRange":"$$ - Ascenso y crucero","dia":3,"day":3}'::jsonb,
  210,
  '{"dia":3,"day":3,"activities":["Subir en ascensor al segundo piso o cima de la Torre Eiffel (€18.80 - €29.40 según nivel)","Crucero panorámico de 1 hora por el río Sena pasando bajo Notre-Dame y el Puente Alejandro III (€17)","Ver el destello de miles de luces doradas de la torre que titilan durante 5 minutos cada hora al anochecer"],"datos_curiosos":["La Torre Eiffel se contrae y dilata con la temperatura: en verano puede crecer hasta 15 centímetros de altura debido a la dilatación térmica del hierro"],"consejos":["La mejor panorámica fotográfica de la torre completa se obtiene desde la Plaza del Trocadero al atardecer"],"location_info":{"address":"Champ de Mars, 5 Av. Anatole France","priceRange":"$$ - Ascenso y crucero","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3353bb9f-3f4d-2bbc-46d6-ad777e599f8a',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  4,
  'Día 4: Viaje al Valle del Loira: Castillo de Chambord',
  'El castillo renacentista más colosal del mundo y su escalera de doble hélice.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1092fe8c-935d-8247-64bd-ae0e43c9fe8e',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '3353bb9f-3f4d-2bbc-46d6-ad777e599f8a',
  4,
  4,
  'Castillo de Chambord',
  47.616,
  1.517,
  'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra cumbre encargada por el rey Francisco I rodeada por el mayor parque forestal cerrado de Europa (del tamaño del centro de París). Cuenta con 440 estancias, 365 chimeneas y una revolucionaria escalera de caracol de doble hélice diseñada por Leonardo da Vinci.',
  ARRAY['Subir y bajar la escalera de doble hélice donde dos personas ascienden sin cruzarse jamás (Entrada: €16)', 'Pasear por la terraza del tejado entre un bosque de linternas de piedra y chimeneas (Gratis con entrada)', 'Alquilar un bote eléctrico para navegar por el foso del castillo (€18 por 30 minutos)']::text[],
  ARRAY['El tren regional TER desde París Austerlitz hasta Blois o Mer toma 1 hora y 20 minutos con conexión de lanzadera al castillo']::text[],
  ARRAY['Francisco I mandó construir este inmenso castillo solo como pabellón de caza y apenas habitó en él 72 días en toda su vida']::text[],
  '{"address":"Château, 41250 Chambord","priceRange":"$$ - Entrada €16","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Subir y bajar la escalera de doble hélice donde dos personas ascienden sin cruzarse jamás (Entrada: €16)","Pasear por la terraza del tejado entre un bosque de linternas de piedra y chimeneas (Gratis con entrada)","Alquilar un bote eléctrico para navegar por el foso del castillo (€18 por 30 minutos)"],"datos_curiosos":["Francisco I mandó construir este inmenso castillo solo como pabellón de caza y apenas habitó en él 72 días en toda su vida"],"consejos":["El tren regional TER desde París Austerlitz hasta Blois o Mer toma 1 hora y 20 minutos con conexión de lanzadera al castillo"],"location_info":{"address":"Château, 41250 Chambord","priceRange":"$$ - Entrada €16","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9c2f1558-bbe8-195b-59e5-5bf42e93404b',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  5,
  'Día 5: Castillo de Chenonceau: El Castillo de las Damas sobre el Río Cher',
  'Galería flotante de arcos sobre el agua y rivalidad entre Diana de Poitiers y Catalina de Médici.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '714db491-4047-2ddb-8785-3d58524e9235',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '9c2f1558-bbe8-195b-59e5-5bf42e93404b',
  5,
  5,
  'Castillo de Chenonceau y Jardines Reales',
  47.3249,
  1.0703,
  'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80']::text[],
  'El castillo más romántico de Francia, edificado literalmente como un puente que cruza el río Cher. Diseñado, protegido y embellecido casi exclusivamente por mujeres, entre ellas Diana de Poitiers y la reina Catalina de Médici.',
  ARRAY['Recorrer la gran galería de 60 metros que cruza sobre el agua (Entrada con folleto: €17)', 'Pasear por los jardines enfrentados de Diana de Poitiers y Catalina de Médici (Gratis con entrada)', 'Almorzar en el antiguo invernadero l''Orangerie con vinos AOC Touraine (€35 - €55)']::text[],
  ARRAY['Visitar la gran cocina renacentista ubicada en los pilares del puente sobre el agua con sus ollas de cobre originales']::text[],
  ARRAY['Durante la Segunda Guerra Mundial la galería del castillo sirvió como vía clandestina de escape, pues un extremo estaba en la Francia ocupada y el otro en la zona libre']::text[],
  '{"address":"37150 Chenonceaux","priceRange":"$$ - Entrada €17","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Recorrer la gran galería de 60 metros que cruza sobre el agua (Entrada con folleto: €17)","Pasear por los jardines enfrentados de Diana de Poitiers y Catalina de Médici (Gratis con entrada)","Almorzar en el antiguo invernadero l''Orangerie con vinos AOC Touraine (€35 - €55)"],"datos_curiosos":["Durante la Segunda Guerra Mundial la galería del castillo sirvió como vía clandestina de escape, pues un extremo estaba en la Francia ocupada y el otro en la zona libre"],"consejos":["Visitar la gran cocina renacentista ubicada en los pilares del puente sobre el agua con sus ollas de cobre originales"],"location_info":{"address":"37150 Chenonceaux","priceRange":"$$ - Entrada €17","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1daf3e47-5a1e-ab01-d33e-dde9e3246402',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  6,
  'Día 6: Castillo y Jardines de Villandry: La Sinfonía Vegetal',
  'Los jardines renacentistas más espectaculares del mundo y huerto decorativo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3e51684a-1beb-175f-2813-1c481297cbaf',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '1daf3e47-5a1e-ab01-d33e-dde9e3246402',
  6,
  6,
  'Castillo y Jardines de Villandry',
  47.34,
  0.513,
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=800&q=80']::text[],
  'El último de los grandes castillos renacentistas construidos a orillas del Loira. Famoso en el mundo entero por sus 6 jardines aterrazados que incluyen el Jardín del Amor con boj recortado en formas alegóricas y el Huerto Decorativo con verduras multicolores.',
  ARRAY['Subir a la torre del homenaje para admirar el tapiz geométrico de los jardines desde arriba (Entrada: €13 castillo + jardines / €8 solo jardines)', 'Descifrar los cuatro cuadrados del Jardín del Amor (Tierno, Apasionado, Voluble y Trágico)', 'Cata de quesos de cabra Sainte-Maure de Touraine con vino blanco (€15)']::text[],
  ARRAY['La primavera y el verano muestran el esplendor máximo de las flores y verduras ornamentales']::text[],
  ARRAY['Los jardines son cuidados íntegramente de manera orgánica sin pesticidas químicos por un equipo de 10 jardineros dedicados']::text[],
  '{"address":"3 Rue Principale, 37510 Villandry","priceRange":"$ - Entrada €13","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Subir a la torre del homenaje para admirar el tapiz geométrico de los jardines desde arriba (Entrada: €13 castillo + jardines / €8 solo jardines)","Descifrar los cuatro cuadrados del Jardín del Amor (Tierno, Apasionado, Voluble y Trágico)","Cata de quesos de cabra Sainte-Maure de Touraine con vino blanco (€15)"],"datos_curiosos":["Los jardines son cuidados íntegramente de manera orgánica sin pesticidas químicos por un equipo de 10 jardineros dedicados"],"consejos":["La primavera y el verano muestran el esplendor máximo de las flores y verduras ornamentales"],"location_info":{"address":"3 Rue Principale, 37510 Villandry","priceRange":"$ - Entrada €13","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1a102a9f-912b-15eb-fdf2-74838ef3a5ca',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  7,
  'Día 7: Retorno a París: Barrio Latino, Notre-Dame y Despedida',
  'Librería Shakespeare and Company, la catedral renacida y despedida.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6fa72f8f-052d-0aab-dd5d-6561075de73a',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '1a102a9f-912b-15eb-fdf2-74838ef3a5ca',
  7,
  7,
  'Catedral de Notre-Dame y Shakespeare and Company',
  48.853,
  2.3499,
  'https://images.unsplash.com/photo-1478860409698-8707f313ee8b?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1478860409698-8707f313ee8b?auto=format&fit=crop&w=800&q=80']::text[],
  'La isla de la Cité es la cuna de París. La catedral de Notre-Dame se alza junto al Sena, mientras al cruzar el puente hacia el Barrio Latino se encuentra la mítica librería en madera que acogió a Ernest Hemingway y James Joyce.',
  ARRAY['Fotografiar la fachada gótica restaurada y rosetones de Notre-Dame (Gratis)', 'Comprar un libro sellado en la librería histórica Shakespeare and Company (€10 - €25)', 'Último almuerzo parisino en una terraza: croissant con café au lait y quiche lorraine (€15)']::text[],
  ARRAY['Tomar el tren RER B directo desde la estación Saint-Michel Notre-Dame hacia el aeropuerto Charles de Gaulle (40 minutos, €11.80)']::text[],
  ARRAY['En el atrio de Notre-Dame se encuentra el "Punto Cero" de Francia, desde el cual se miden todas las distancias en kilómetros de las carreteras del país']::text[],
  '{"address":"6 Rue de la Bûcherie, 75005 Paris","priceRange":"$ - Acceso libre","dia":7,"day":7}'::jsonb,
  150,
  '{"dia":7,"day":7,"activities":["Fotografiar la fachada gótica restaurada y rosetones de Notre-Dame (Gratis)","Comprar un libro sellado en la librería histórica Shakespeare and Company (€10 - €25)","Último almuerzo parisino en una terraza: croissant con café au lait y quiche lorraine (€15)"],"datos_curiosos":["En el atrio de Notre-Dame se encuentra el \"Punto Cero\" de Francia, desde el cual se miden todas las distancias en kilómetros de las carreteras del país"],"consejos":["Tomar el tren RER B directo desde la estación Saint-Michel Notre-Dame hacia el aeropuerto Charles de Gaulle (40 minutos, €11.80)"],"location_info":{"address":"6 Rue de la Bûcherie, 75005 Paris","priceRange":"$ - Acceso libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'fd7a89c2-92f6-2f65-5516-4b20009531c4',
  '60d4e125-e850-e889-8e0b-8575a7625a0c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Grecia Clásica e Islas del Egeo: Dioses, Templos y Santorini (Atenas, Grecia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-grecia-clasica-islas-egeo-8d',
  'Grecia Clásica e Islas del Egeo: Dioses, Templos y Santorini',
  'Grecia',
  'Atenas',
  'historical',
  'Circuito inolvidable de 8 días que une la cuna de la democracia y la filosofía en la Acrópolis de Atenas con la magia encalada, las cúpulas azules y las calderas volcánicas de Mykonos y Santorini sobre el mar Egeo.',
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80']::text[],
  11520,
  390000,
  'moderate',
  'es',
  4.97,
  172,
  590,
  ARRAY['Grecia', 'Atenas', 'Santorini', 'Mykonos', 'Acrópolis', 'Partenón', 'Egeo', 'Mitología']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":700,"estimatedPerPersonMax":1500,"notes":"Acrópolis (~€20), ferris entre islas (~€70-€90 tramo) y gastronomía griega"}'::jsonb,
  ARRAY['Viajeros románticos', 'Apasionados de la historia antigua', 'Fotógrafos']::text[],
  'Mayo a Junio y Septiembre a Octubre (mar cálido y sin multitudes agobiantes)',
  'Acrópolis a las 8:00 AM para evitar calor y atardeceres sagrados en Oia',
  'Plaza Syntagma / Parlamento Helénico, Atenas',
  ARRAY['Ruta completa continental e insular', 'Guía de ferris rápidos entre islas del Egeo', 'Ubicación de miradores de cúpulas azules']::text[],
  ARRAY['Boleto combinado Acrópolis de Atenas', 'Billetes de ferry Pireo - Mykonos - Santorini', 'Consumos personales']::text[],
  ARRAY['Llevar calzado con suela de goma antideslizante para caminar sobre el mármol pulido y desgastado de la Acrópolis', 'Llevar sombrero y protector solar potente']::text[],
  ARRAY['Ropa blanca o de lino para fotos', 'Gafas de sol polarizadas', 'Traje de baño', 'Adaptador europeo']::text[],
  ARRAY['Prohibido recoger o tocar fragmentos de mármol antiguo del suelo en los sitios arqueológicos']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7b0519e1-8f32-21da-df88-45fa4a546c84',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  1,
  'Día 1: Atenas: La Roca Sagrada de la Acrópolis y Plaka',
  'El Partenón, las Cariátides del Erecteion y el barrio más antiguo a sus faldas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6432fe96-a852-36f2-3f34-0d3889558cd6',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '7b0519e1-8f32-21da-df88-45fa4a546c84',
  1,
  1,
  'Acrópolis de Atenas y Partenón',
  37.9715,
  23.7257,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'El monumento más célebre de la civilización clásica occidental, edificado en el siglo V a.C. bajo Pericles. El Partenón, templo dórico dedicado a Atenea Pártenos, y el Erecteion con el pórtico de las seis doncellas Cariátides.',
  ARRAY['Subir los Propileos y contemplar el Partenón de mármol pentélico (Entrada: €20)', 'Fotografiar las Cariátides del Erecteion y el Olivo Sagrado de Atenea (Gratis con entrada)', 'Pasear por las callejuelas empedradas del pintoresco barrio de Plaka (€0)']::text[],
  ARRAY['Entrar a las 8:00 AM para evitar las masas de cruceros y el calor reflejado en el mármol', 'Comprar el boleto combinado de 7 sitios arqueológicos (€30) si estará varios días en Atenas']::text[],
  ARRAY['El Partenón no tiene una sola línea recta; todas sus columnas y arquitrabes tienen curvaturas e inclinaciones sutiles calculadas para corregir las ilusiones ópticas del ojo humano']::text[],
  '{"address":"Acrópolis, Atenas","priceRange":"$$ - Entrada €20","dia":1,"day":1}'::jsonb,
  200,
  '{"dia":1,"day":1,"activities":["Subir los Propileos y contemplar el Partenón de mármol pentélico (Entrada: €20)","Fotografiar las Cariátides del Erecteion y el Olivo Sagrado de Atenea (Gratis con entrada)","Pasear por las callejuelas empedradas del pintoresco barrio de Plaka (€0)"],"datos_curiosos":["El Partenón no tiene una sola línea recta; todas sus columnas y arquitrabes tienen curvaturas e inclinaciones sutiles calculadas para corregir las ilusiones ópticas del ojo humano"],"consejos":["Entrar a las 8:00 AM para evitar las masas de cruceros y el calor reflejado en el mármol","Comprar el boleto combinado de 7 sitios arqueológicos (€30) si estará varios días en Atenas"],"location_info":{"address":"Acrópolis, Atenas","priceRange":"$$ - Entrada €20","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '52bc12a8-92de-83c2-1b1c-1acf0e6db8b8',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  2,
  'Día 2: Museo de la Acrópolis y el Ágora Antigua',
  'El Templo de Hefesto mejor conservado y las Cariátides originales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '78a83416-56d6-2a3e-feb4-286928eb14ca',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '52bc12a8-92de-83c2-1b1c-1acf0e6db8b8',
  2,
  2,
  'Museo de la Acrópolis y Ágora Antigua de Atenas',
  37.9684,
  23.7285,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'Museo ultramoderno construido sobre ruinas excavadas visibles a través de suelos de cristal. Exhibe las cinco Cariátides originales y el friso del Partenón orientado con vista directa a la roca sagrada. El Ágora era el corazón cívico donde debatían Sócrates y Platón.',
  ARRAY['Admirar las Cariátides originales a centímetros de distancia en el museo (Entrada: €15)', 'Visitar el Templo de Hefesto en el Ágora Antigua, el más intacto de Grecia (€10)', 'Almorzar moussaka tradicional con ensalada griega con queso feta en Monastiraki (€15 - €22)']::text[],
  ARRAY['La terraza del restaurante del museo ofrece una de las vistas más limpias del Partenón']::text[],
  ARRAY['La sexta Cariátide que falta fue arrancada por Lord Elgin en 1801 y permanece en el Museo Británico de Londres']::text[],
  '{"address":"Dionysiou Areopagitou 15, Athina","priceRange":"$$ - Entrada museo","dia":2,"day":2}'::jsonb,
  210,
  '{"dia":2,"day":2,"activities":["Admirar las Cariátides originales a centímetros de distancia en el museo (Entrada: €15)","Visitar el Templo de Hefesto en el Ágora Antigua, el más intacto de Grecia (€10)","Almorzar moussaka tradicional con ensalada griega con queso feta en Monastiraki (€15 - €22)"],"datos_curiosos":["La sexta Cariátide que falta fue arrancada por Lord Elgin en 1801 y permanece en el Museo Británico de Londres"],"consejos":["La terraza del restaurante del museo ofrece una de las vistas más limpias del Partenón"],"location_info":{"address":"Dionysiou Areopagitou 15, Athina","priceRange":"$$ - Entrada museo","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'bd10484a-fae1-b3b2-21c3-8df440131794',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  3,
  'Día 3: Ferry a Mykonos: Molinos de Viento y Little Venice',
  'Travesía marítima por el Egeo hacia la isla blanca de los molinos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c65968be-03f7-c7d8-c602-5b45f89a6fcb',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  'bd10484a-fae1-b3b2-21c3-8df440131794',
  3,
  3,
  'Molinos de Kato Mili y Pequeña Venecia (Little Venice)',
  37.4445,
  25.3255,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Los famosos molinos de viento harineros del siglo XVI con techos de paja que saludan al mar. Abajo, Little Venice con casas de capitanes del siglo XVIII construidas literalmente sobre el agua con balcones coloridos donde rompen las olas.',
  ARRAY['Tomar un cóctel al atardecer en los bares con terraza sobre el agua en Little Venice (€18 - €25)', 'Fotografiar los cinco molinos de viento con la luz dorada del Egeo (Gratis)', 'Perderse en el laberinto blanco de callejuelas encaladas de Chora (Gratis)']::text[],
  ARRAY['El ferry rápido desde el Pireo (Seajets) tarda 2 horas y media hacia Mykonos (~€85)']::text[],
  ARRAY['El pueblo de Chora fue diseñado deliberadamente como un laberinto confuso para desorientar a los piratas invasores que desembarcaban en la isla']::text[],
  '{"address":"Mykonos Town (Chora)","priceRange":"$$ - Moderado a alto","dia":3,"day":3}'::jsonb,
  200,
  '{"dia":3,"day":3,"activities":["Tomar un cóctel al atardecer en los bares con terraza sobre el agua en Little Venice (€18 - €25)","Fotografiar los cinco molinos de viento con la luz dorada del Egeo (Gratis)","Perderse en el laberinto blanco de callejuelas encaladas de Chora (Gratis)"],"datos_curiosos":["El pueblo de Chora fue diseñado deliberadamente como un laberinto confuso para desorientar a los piratas invasores que desembarcaban en la isla"],"consejos":["El ferry rápido desde el Pireo (Seajets) tarda 2 horas y media hacia Mykonos (~€85)"],"location_info":{"address":"Mykonos Town (Chora)","priceRange":"$$ - Moderado a alto","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '639fb88d-2505-2354-b12d-cdff7639f9e0',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  4,
  'Día 4: Santuario de Apolo en la Sagrada Isla de Delos',
  'Patrimonio de la Humanidad: el lugar de nacimiento mitológico de los dioses Apolo y Artemisa.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '29afc30d-9873-9e20-80c0-8afe2d6a14a6',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '639fb88d-2505-2354-b12d-cdff7639f9e0',
  4,
  4,
  'Isla Arqueológica de Delos',
  37.397,
  25.267,
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80']::text[],
  'Isla sagrada deshabitada donde según la mitología nacieron los dioses gemelos Apolo y Artemisa. Cuenta con la famosa Terraza de los Leones de mármol, templos dóricos y mosaicos de Dionisio intactos.',
  ARRAY['Excursión en barco desde el puerto de Mykonos (Barco ida y vuelta: €22 + Entrada sitio: €8)', 'Recorrer la Terraza de los Leones arcaicos de Naxos (Gratis con entrada)', 'Subir al Monte Cintos para una panorámica de todas las islas Cícladas circundantes']::text[],
  ARRAY['En Delos no hay sombra ni árboles; llevar sombrilla o gorra, gafas de sol y abundante agua']::text[],
  ARRAY['En la antigüedad era un crimen sagrado nacer o morir en Delos; las mujeres embarazadas y enfermos terminales eran evacuados a islas vecinas']::text[],
  '{"address":"Isla de Delos, Cícladas","priceRange":"$$ - Excursión marítima","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Excursión en barco desde el puerto de Mykonos (Barco ida y vuelta: €22 + Entrada sitio: €8)","Recorrer la Terraza de los Leones arcaicos de Naxos (Gratis con entrada)","Subir al Monte Cintos para una panorámica de todas las islas Cícladas circundantes"],"datos_curiosos":["En la antigüedad era un crimen sagrado nacer o morir en Delos; las mujeres embarazadas y enfermos terminales eran evacuados a islas vecinas"],"consejos":["En Delos no hay sombra ni árboles; llevar sombrilla o gorra, gafas de sol y abundante agua"],"location_info":{"address":"Isla de Delos, Cícladas","priceRange":"$$ - Excursión marítima","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '357cfbb2-2679-9e58-1128-9914d20e4a41',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  5,
  'Día 5: Llegada a Santorini: La Caldera Volcánica y Fira',
  'Ferry hacia la isla volcánica más espectacular del mundo y caminata por el acantilado.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '73a3fe9e-9bf4-bd62-e3d7-ee97f7811a98',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '357cfbb2-2679-9e58-1128-9914d20e4a41',
  5,
  5,
  'Fira y Sendero al Borde de la Caldera',
  36.4166,
  25.4324,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'Capital de Santorini colgada de un acantilado de roca volcánica negra y roja a 260 metros sobre la caldera inundada por el mar. Casas blancas de estilo troglodita, iglesias ortodoxas y restaurantes con vistas vertiginosas.',
  ARRAY['Caminata panorámica por el sendero peatonal que une Fira con Firostefani e Imerovigli (Gratis)', 'Subir en el teleférico desde el Puerto Viejo hasta Fira (€6)', 'Cena con pescado fresco y vino blanco volcánico Assyrtiko (€35 - €60)']::text[],
  ARRAY['No montar en los burros del puerto viejo por razones de bienestar animal; usar el teleférico o las escaleras a pie']::text[],
  ARRAY['La gigantesca erupción de Thera hace 3.600 años hundió el centro de la isla originando la leyenda de la Atlántida descrita por Platón']::text[],
  '{"address":"Fira, Santorini","priceRange":"$$ - Restaurantes panorámicos","dia":5,"day":5}'::jsonb,
  210,
  '{"dia":5,"day":5,"activities":["Caminata panorámica por el sendero peatonal que une Fira con Firostefani e Imerovigli (Gratis)","Subir en el teleférico desde el Puerto Viejo hasta Fira (€6)","Cena con pescado fresco y vino blanco volcánico Assyrtiko (€35 - €60)"],"datos_curiosos":["La gigantesca erupción de Thera hace 3.600 años hundió el centro de la isla originando la leyenda de la Atlántida descrita por Platón"],"consejos":["No montar en los burros del puerto viejo por razones de bienestar animal; usar el teleférico o las escaleras a pie"],"location_info":{"address":"Fira, Santorini","priceRange":"$$ - Restaurantes panorámicos","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd702cdce-9293-282d-2d96-d7692644698f',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  6,
  'Día 6: Oia: Las Cúpulas Azules y el Atardecer Más Célebre del Mundo',
  'El pueblo de postal de Santorini en el extremo norte de la caldera.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '96ddbde5-fdba-7b41-e30a-99ea6dab25a1',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  'd702cdce-9293-282d-2d96-d7692644698f',
  6,
  6,
  'Pueblo de Oia y Ruinas del Castillo Bizantino',
  36.4618,
  25.3753,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'La estampa más famosa de Grecia en el mundo: callejuelas de mármol blanco, iglesias con cúpulas azul cobalto y campanarios asomados al abismo marino. Al final del pueblo, el viejo castillo de San Nicolás acoge a miles para ver la puesta de sol.',
  ARRAY['Fotografiar las Tres Cúpulas Azules desde el mirador clásico (Gratis)', 'Ubicarse en las ruinas del Castillo de Oia para contemplar la caída del sol en el Egeo (Gratis)', 'Bajar los 200 escalones hacia la caleta de Ammoudi para comer calamares frescos a orillas del agua (€30 - €50)']::text[],
  ARRAY['Llegar al castillo al menos 1 hora y media antes del atardecer para asegurar sitio', 'Respetar los carteles de propiedad privada en los tejados de las casas']::text[],
  ARRAY['Las casas de Oia llamadas *yposkafa* están excavadas directamente en la ceniza volcánica compacta, lo que las mantiene frescas en verano y cálidas en invierno']::text[],
  '{"address":"Oia, Santorini","priceRange":"$$$ - Pueblo icónico","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Fotografiar las Tres Cúpulas Azules desde el mirador clásico (Gratis)","Ubicarse en las ruinas del Castillo de Oia para contemplar la caída del sol en el Egeo (Gratis)","Bajar los 200 escalones hacia la caleta de Ammoudi para comer calamares frescos a orillas del agua (€30 - €50)"],"datos_curiosos":["Las casas de Oia llamadas *yposkafa* están excavadas directamente en la ceniza volcánica compacta, lo que las mantiene frescas en verano y cálidas en invierno"],"consejos":["Llegar al castillo al menos 1 hora y media antes del atardecer para asegurar sitio","Respetar los carteles de propiedad privada en los tejados de las casas"],"location_info":{"address":"Oia, Santorini","priceRange":"$$$ - Pueblo icónico","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b7c4da04-861a-bff9-f261-bd2369c7f001',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  7,
  'Día 7: La Pompeya del Egeo: Ruinas de Akrotiri y Playa Roja',
  'Ciudad minoica congelada bajo ceniza volcánica hace 3.600 años y arena volcánica roja.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '779134f3-eff2-a1f7-cde7-4abbdb53f07a',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  'b7c4da04-861a-bff9-f261-bd2369c7f001',
  7,
  7,
  'Yacimiento Arqueológico de Akrotiri y Red Beach',
  36.351,
  25.403,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'Asentamiento urbano minoico de la Edad del Bronce preservado bajo capas de ceniza volcánica con edificios de tres plantas, sistemas de drenaje avanzado y frescos murales intactos. A pocos minutos, los acantilados de roca volcánica roja de Red Beach.',
  ARRAY['Caminar sobre las pasarelas techadas de la ciudad prehistórica excavada (Entrada: €12)', 'Mirador fotográfico sobre la imponente arena y roca roja de Red Beach (Gratis)', 'Cata de vinos en Bodega Santo Wines sobre el acantilado (€30 por vuelo de 6 vinos)']::text[],
  ARRAY['Akrotiri es un sitio completamente techado y protegido del sol']::text[],
  ARRAY['En Akrotiri no se hallaron esqueletos humanos ni joyas de oro, lo que demuestra que los habitantes evacuaron ordenadamente con sus riquezas antes de la erupción catastrófica']::text[],
  '{"address":"Akrotiri, Santorini","priceRange":"$$ - Entrada €12","dia":7,"day":7}'::jsonb,
  200,
  '{"dia":7,"day":7,"activities":["Caminar sobre las pasarelas techadas de la ciudad prehistórica excavada (Entrada: €12)","Mirador fotográfico sobre la imponente arena y roca roja de Red Beach (Gratis)","Cata de vinos en Bodega Santo Wines sobre el acantilado (€30 por vuelo de 6 vinos)"],"datos_curiosos":["En Akrotiri no se hallaron esqueletos humanos ni joyas de oro, lo que demuestra que los habitantes evacuaron ordenadamente con sus riquezas antes de la erupción catastrófica"],"consejos":["Akrotiri es un sitio completamente techado y protegido del sol"],"location_info":{"address":"Akrotiri, Santorini","priceRange":"$$ - Entrada €12","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '69626a80-51a2-8bb7-17aa-09e2e8c2d4ff',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  8,
  'Día 8: Retorno a Atenas y Despedida Olímpica',
  'Vuelo o ferry de regreso a Atenas y visita al Estadio Panatenaico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '14511aad-4071-ff72-3ea5-9304316b2bd6',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '69626a80-51a2-8bb7-17aa-09e2e8c2d4ff',
  8,
  8,
  'Estadio Panatenaico (Kallimarmaro) y Despedida',
  37.9683,
  23.7411,
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80']::text[],
  'El único estadio del mundo construido enteramente en mármol blanco. Sede de los primeros Juegos Olímpicos de la era moderna en 1896.',
  ARRAY['Correr sobre la pista de ceniza original y subir al podio de campeones (Entrada: €10)', 'Comprar aceite de oliva extra virgen de Kalamata y miel de tomillo para llevar (€10 - €20)', 'Traslado al aeropuerto internacional Eleftherios Venizelos en metro línea 3 (€9)']::text[],
  ARRAY['El boleto del estadio incluye audioguía multilingüe que narra la historia del maratón olímpico']::text[],
  ARRAY['Tiene capacidad para 50.000 espectadores sentados en graderías de mármol sin ningún elemento de hormigón']::text[],
  '{"address":"Leof. Vasileos Konstantinou, Athina","priceRange":"$ - Entrada €10","dia":8,"day":8}'::jsonb,
  120,
  '{"dia":8,"day":8,"activities":["Correr sobre la pista de ceniza original y subir al podio de campeones (Entrada: €10)","Comprar aceite de oliva extra virgen de Kalamata y miel de tomillo para llevar (€10 - €20)","Traslado al aeropuerto internacional Eleftherios Venizelos en metro línea 3 (€9)"],"datos_curiosos":["Tiene capacidad para 50.000 espectadores sentados en graderías de mármol sin ningún elemento de hormigón"],"consejos":["El boleto del estadio incluye audioguía multilingüe que narra la historia del maratón olímpico"],"location_info":{"address":"Leof. Vasileos Konstantinou, Athina","priceRange":"$ - Entrada €10","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'efe7a928-b961-16da-c1ff-98f601d887b8',
  '0537d9bb-683e-7bf2-7efc-77fc31bf2c3b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Tesoros del Danubio y Europa Central: Praga, Viena y Budapest (Praga, República Checa)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-tesoros-del-danubio-praga-viena-budapest-9d',
  'Tesoros del Danubio y Europa Central: Praga, Viena y Budapest',
  'República Checa',
  'Praga',
  'cultural',
  'La gran trilogía imperial de Europa Central durante 9 días. Las agujas góticas y el Puente de Carlos en Praga, los palacios de los Habsburgo y la música clásica en Viena, y el Parlamento dorado reflejado en las aguas del Danubio y balnearios termales en Budapest.',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  12960,
  530000,
  'easy',
  'es',
  4.98,
  210,
  680,
  ARRAY['Europa Central', 'Praga', 'Viena', 'Budapest', 'Danubio', 'Castillos', 'Música Clásica', 'Termas']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":600,"estimatedPerPersonMax":1250,"notes":"Castillo de Praga, Schönbrunn, Termas Széchenyi, trenes Railjet y gastronomía centroeuropea"}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes de la música y arquitectura', 'Parejas']::text[],
  'Abril a Octubre o Diciembre (famosos mercados de Adviento navideños)',
  'Caminatas urbanas diurnas y conciertos o baños termales al caer la noche',
  'Plaza de la Ciudad Vieja frente al Reloj Astronómico, Praga',
  ARRAY['Itinerario interconectado por trenes Railjet', 'Guía de palacios y baños termales históricos', 'Ruta de cafés de la Belle Époque']::text[],
  ARRAY['Billetes de tren Praga - Viena y Viena - Budapest', 'Entrada a baños Széchenyi en Budapest', 'Boletos de ópera']::text[],
  ARRAY['Comprar los billetes de tren Railjet por la web de ÖBB o České dráhy con semanas de anticipación para tarifas promo desde €15-€25', 'Llevar bañador y toalla para las termas de Budapest']::text[],
  ARRAY['Calzado cómodo para adoquines', 'Ropa elegante para cafés o conciertos', 'Monedas locales (Coronas checas y Forintos húngaros, aunque casi todo acepta tarjeta)']::text[],
  ARRAY['Respetar las normas de silencio y etiqueta en los salones de conciertos y salas palaciegas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"international_multicity","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fa8318c4-7bf2-ebb8-f911-2f7348a7f4fa',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  1,
  'Día 1: Praga Gótica: Reloj Astronómico y Puente de Carlos',
  'El corazón medieval de la Ciudad de las Cien Torres.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4bd5554e-1897-5c32-c379-38b6e7c5e3d6',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  'fa8318c4-7bf2-ebb8-f911-2f7348a7f4fa',
  1,
  1,
  'Plaza de la Ciudad Vieja y Puente de Carlos',
  50.0875,
  14.421,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'La plaza medieval más bella de Europa Central presidida por la Iglesia de Nuestra Señora de Týn y el Reloj Astronómico de 1410. A pasos, el histórico Puente de Carlos de piedra del siglo XIV adornado por 30 estatuas barrocas sobre el río Moldava.',
  ARRAY['Ver el desfile mecánico de los doce apóstoles del Reloj Astronómico a cada hora en punto (Gratis)', 'Cruzar el Puente de Carlos y tocar el relieve de bronce de San Juan Nepomuceno para la suerte (Gratis)', 'Probar goulash checo servido en hogaza de pan con cerveza Pilsner Urquell (€12 - €18)']::text[],
  ARRAY['Cruzar el Puente de Carlos al amanecer (6:30 AM) para disfrutarlo en soledad y silencio mágico']::text[],
  ARRAY['Cuenta la leyenda que a los concejales de Praga les gustó tanto el reloj astronómico que cegaron a su maestro relojero Hanuš para que nunca pudiera construir otro igual']::text[],
  '{"address":"Staroměstské náměstí, Praha","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Ver el desfile mecánico de los doce apóstoles del Reloj Astronómico a cada hora en punto (Gratis)","Cruzar el Puente de Carlos y tocar el relieve de bronce de San Juan Nepomuceno para la suerte (Gratis)","Probar goulash checo servido en hogaza de pan con cerveza Pilsner Urquell (€12 - €18)"],"datos_curiosos":["Cuenta la leyenda que a los concejales de Praga les gustó tanto el reloj astronómico que cegaron a su maestro relojero Hanuš para que nunca pudiera construir otro igual"],"consejos":["Cruzar el Puente de Carlos al amanecer (6:30 AM) para disfrutarlo en soledad y silencio mágico"],"location_info":{"address":"Staroměstské náměstí, Praha","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5e82e287-9119-43c1-9edd-968988a4b488',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  2,
  'Día 2: Castillo de Praga, Catedral de San Vito y Callejón del Oro',
  'El complejo palaciego medieval más grande del mundo y la casa de Franz Kafka.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '88be06e8-a85c-3500-c376-bde42a8f6dfc',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '5e82e287-9119-43c1-9edd-968988a4b488',
  2,
  2,
  'Castillo de Praga y Catedral de San Vito',
  50.0908,
  14.4005,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Monumento que domina la ciudad desde una colina. La Catedral de San Vito tardó casi 600 años en completarse con vitrales diseñados por Alfons Mucha. Al lado, el Callejón del Oro con diminutas casitas de alquimistas y orfebres de colores pastel.',
  ARRAY['Visitar la nave gótica de la Catedral de San Vito y la tumba de San Venceslao (Entrada circuito castillo: ~250 CZK / €10)', 'Entrar a la casa número 22 del Callejón del Oro donde vivió y escribió Franz Kafka (Incluido en circuito)', 'Subir en el tranvía histórico 22 hasta la parada Pražský hrad (€1.50)']::text[],
  ARRAY['El cambio de guardia solemne con fanfarria militar se realiza a las 12:00 del mediodía en el primer patio']::text[],
  ARRAY['El libro Guinness de los récords certifica al Castillo de Praga como el castillo antiguo coherente más grande del planeta con 70.000 m²']::text[],
  '{"address":"Hradčany, 119 08 Praha 1","priceRange":"$ - Entrada ~€10","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Visitar la nave gótica de la Catedral de San Vito y la tumba de San Venceslao (Entrada circuito castillo: ~250 CZK / €10)","Entrar a la casa número 22 del Callejón del Oro donde vivió y escribió Franz Kafka (Incluido en circuito)","Subir en el tranvía histórico 22 hasta la parada Pražský hrad (€1.50)"],"datos_curiosos":["El libro Guinness de los récords certifica al Castillo de Praga como el castillo antiguo coherente más grande del planeta con 70.000 m²"],"consejos":["El cambio de guardia solemne con fanfarria militar se realiza a las 12:00 del mediodía en el primer patio"],"location_info":{"address":"Hradčany, 119 08 Praha 1","priceRange":"$ - Entrada ~€10","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '43ce37d2-43ca-3e87-c0cc-ba143a79c8de',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  3,
  'Día 3: El Barrio Judío de Josefov y Tren Rápido a Viena',
  'Sinagogas históricas, el cementerio judío medieval y viaje en tren hacia la capital austriaca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '560924e4-302a-878b-2d9d-5b636ca7998d',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '43ce37d2-43ca-3e87-c0cc-ba143a79c8de',
  3,
  3,
  'Antiguo Cementerio Judío de Praga y Tren Railjet a Viena',
  50.0895,
  14.4175,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Cementerio con más de 12.000 lápidas amontonadas en capas debido a la falta de espacio en el gueto durante siglos. Luego, viaje en el moderno tren Railjet cruzando Bohemia y Moravia hasta Viena.',
  ARRAY['Visitar la Sinagoga Vieja-Nueva, la más antigua activa de Europa (Entrada museo judío: ~350 CZK / €14)', 'Abordar el tren Railjet en la estación central Praha hlavní nádraží hacia Viena (€20 - €35 - 4 horas)', 'Llegada a Viena y primer paseo nocturno por la Ringstraße iluminada (Gratis)']::text[],
  ARRAY['El tren cuenta con wifi de alta velocidad, restaurante a bordo y vagones silenciosos']::text[],
  ARRAY['Según la leyenda de Praga, en el ático de la Sinagoga Vieja-Nueva reposan los restos de barro del Golem creado por el rabino Judah Loew en el siglo XVI']::text[],
  '{"address":"Široká, Josefov / Hlavní nádraží","priceRange":"$$ - Tren a Viena","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Visitar la Sinagoga Vieja-Nueva, la más antigua activa de Europa (Entrada museo judío: ~350 CZK / €14)","Abordar el tren Railjet en la estación central Praha hlavní nádraží hacia Viena (€20 - €35 - 4 horas)","Llegada a Viena y primer paseo nocturno por la Ringstraße iluminada (Gratis)"],"datos_curiosos":["Según la leyenda de Praga, en el ático de la Sinagoga Vieja-Nueva reposan los restos de barro del Golem creado por el rabino Judah Loew en el siglo XVI"],"consejos":["El tren cuenta con wifi de alta velocidad, restaurante a bordo y vagones silenciosos"],"location_info":{"address":"Široká, Josefov / Hlavní nádraží","priceRange":"$$ - Tren a Viena","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'cc9fa97e-ddae-4b90-3343-804dffdd15ce',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  4,
  'Día 4: Viena Imperial: Palacio de Schönbrunn y la Catedral de San Esteban',
  'La residencia de verano de Sissi Emperatriz y cafés históricos de la Ringstraße.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8c52e4e4-9a01-0b04-2f8e-1df29652973b',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  'cc9fa97e-ddae-4b90-3343-804dffdd15ce',
  4,
  4,
  'Palacio de Schönbrunn y Catedral de San Esteban (Stephansdom)',
  48.1848,
  16.3122,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'El Versalles austriaco donde vivieron María Teresa, Francisco José y Sissi. Salones rococó con espejos dorados y jardines barrocos con la Glorieta. En el centro histórico se alza la catedral gótica de San Esteban con su tejado de mosaicos de colores.',
  ARRAY['Grand Tour de los 40 aposentos de Estado del Palacio de Schönbrunn (Entrada: €24)', 'Subir a la colina de la Glorieta en los jardines para la vista panorámica de Viena (Gratis los jardines)', 'Tomar un café Melange tradicional con tarta Sacher original en el Café Central o Café Sacher (€14)']::text[],
  ARRAY['Tomar la línea U4 del metro directo desde el centro hasta la estación Schönbrunn (€2.40)']::text[],
  ARRAY['En el Salón de los Espejos de Schönbrunn, un prodigioso niño de 6 años llamado Wolfgang Amadeus Mozart dio su primer concierto ante la emperatriz María Teresa en 1762']::text[],
  '{"address":"Schönbrunner Schloßstraße 47, Wien","priceRange":"$$ - Entrada €24","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Grand Tour de los 40 aposentos de Estado del Palacio de Schönbrunn (Entrada: €24)","Subir a la colina de la Glorieta en los jardines para la vista panorámica de Viena (Gratis los jardines)","Tomar un café Melange tradicional con tarta Sacher original en el Café Central o Café Sacher (€14)"],"datos_curiosos":["En el Salón de los Espejos de Schönbrunn, un prodigioso niño de 6 años llamado Wolfgang Amadeus Mozart dio su primer concierto ante la emperatriz María Teresa en 1762"],"consejos":["Tomar la línea U4 del metro directo desde el centro hasta la estación Schönbrunn (€2.40)"],"location_info":{"address":"Schönbrunner Schloßstraße 47, Wien","priceRange":"$$ - Entrada €24","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4758bafa-9506-6bc3-4a2c-7fec26caa882',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  5,
  'Día 5: Palacio de Belvedere: "El Beso" de Klimt y Ópera de Viena',
  'Pintura de oro modernista, jardines en terrazas y música de Mozart.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af630e56-c100-2db2-0931-a82caf4931f9',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '4758bafa-9506-6bc3-4a2c-7fec26caa882',
  5,
  5,
  'Palacio de Belvedere Superior y Ópera Estatal de Viena',
  48.1915,
  16.3808,
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio barroco del Príncipe Eugenio de Saboya que custodia la colección cumbre del modernismo vienés, incluyendo la célebre pintura "El Beso" y "Judith" de Gustav Klimt cubiertas de pan de oro.',
  ARRAY['Admirar "El Beso" de Klimt en la sala principal del Belvedere Superior (Entrada: €17.50)', 'Pasear por los jardines barrocos de cascadas entre el Belvedere Superior y el Inferior (Gratis)', 'Probar el Wiener Schnitzel auténtico (escalope vienés de ternera gigante) en Figlmüller (€22 - €28)']::text[],
  ARRAY['Reservar mesa con semanas de antelación en Figlmüller Wollzeile', 'En la Ópera de Viena se pueden comprar entradas de pie por solo €10 a €15 dos horas antes de la función']::text[],
  ARRAY['Klimt utilizó auténticas hojas de oro batido mezcladas con pintura al óleo inspirándose en los mosaicos bizantinos que contempló en Rávena']::text[],
  '{"address":"Prinz-Eugen-Straße 27, Wien","priceRange":"$$ - Entrada museo","dia":5,"day":5}'::jsonb,
  200,
  '{"dia":5,"day":5,"activities":["Admirar \"El Beso\" de Klimt en la sala principal del Belvedere Superior (Entrada: €17.50)","Pasear por los jardines barrocos de cascadas entre el Belvedere Superior y el Inferior (Gratis)","Probar el Wiener Schnitzel auténtico (escalope vienés de ternera gigante) en Figlmüller (€22 - €28)"],"datos_curiosos":["Klimt utilizó auténticas hojas de oro batido mezcladas con pintura al óleo inspirándose en los mosaicos bizantinos que contempló en Rávena"],"consejos":["Reservar mesa con semanas de antelación en Figlmüller Wollzeile","En la Ópera de Viena se pueden comprar entradas de pie por solo €10 a €15 dos horas antes de la función"],"location_info":{"address":"Prinz-Eugen-Straße 27, Wien","priceRange":"$$ - Entrada museo","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0854b200-81f1-eb04-c3b4-09a790478c32',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  6,
  'Día 6: Tren a Budapest y el Majestuoso Parlamento sobre el Danubio',
  'Llegada a la Perla del Danubio y crucero nocturno entre palacios iluminados.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9c99a80b-e46f-3d8d-763e-eb58b0f9b07f',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '0854b200-81f1-eb04-c3b4-09a790478c32',
  6,
  6,
  'Parlamento de Hungría y Zapatos en el Paseo del Danubio',
  47.507,
  19.0455,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los edificios gubernamentales más colosales del mundo, de estilo neogótico con 691 salas y 268 metros de largo a orillas del río Danubio. A pocos metros, el sobrecogedor monumento de los "Zapatos en el Danubio" recuerda a las víctimas del Holocausto.',
  ARRAY['Tren Railjet de Viena a Budapest (2 horas y media - €18)', 'Visita guiada al interior del Parlamento y la Santa Corona de Hungría (Entrada UE: ~€13 / no UE: ~€28)', 'Crucero nocturno en barco por el Danubio contemplando los puentes y el parlamento iluminado en oro (€16)']::text[],
  ARRAY['La vista más espectacular del Parlamento iluminado se obtiene desde el otro lado del río (Bastión de los Pescadores o desde el barco)']::text[],
  ARRAY['Para decorar el interior del Parlamento húngaro se utilizaron más de 40 kilos de oro de 22 quilates']::text[],
  '{"address":"Kossuth Lajos tér 1-3, Budapest","priceRange":"$$ - Tren y crucero","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Tren Railjet de Viena a Budapest (2 horas y media - €18)","Visita guiada al interior del Parlamento y la Santa Corona de Hungría (Entrada UE: ~€13 / no UE: ~€28)","Crucero nocturno en barco por el Danubio contemplando los puentes y el parlamento iluminado en oro (€16)"],"datos_curiosos":["Para decorar el interior del Parlamento húngaro se utilizaron más de 40 kilos de oro de 22 quilates"],"consejos":["La vista más espectacular del Parlamento iluminado se obtiene desde el otro lado del río (Bastión de los Pescadores o desde el barco)"],"location_info":{"address":"Kossuth Lajos tér 1-3, Budapest","priceRange":"$$ - Tren y crucero","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4e0b1622-17cb-935b-53c5-f2fb22a8a2e3',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  7,
  'Día 7: La Colina de Buda: Bastión de los Pescadores e Iglesia de Matías',
  'Torres de cuento de hadas con vista panorámica de Pest y el Puente de las Cadenas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5a2a3b5b-3910-8aa8-3299-9a73813113fb',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '4e0b1622-17cb-935b-53c5-f2fb22a8a2e3',
  7,
  7,
  'Bastión de los Pescadores y Castillo de Buda',
  47.502,
  19.0345,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Mirador neorrománico con 7 torres blancas que conmemoran las 7 tribus magiares que fundaron Hungría. La Iglesia de Matías luce tejados de tejas barnizadas de porcelana Zsolnay de vivos colores geométricos.',
  ARRAY['Pasear por las terrazas y arcos del Bastión de los Pescadores (Planta principal gratis / torrecillas superiores ~€3)', 'Entrar a la Iglesia de Matías donde fue coronado el emperador Francisco José (Entrada: ~€8)', 'Cruzar a pie el centenario Puente de las Cadenas sobre el Danubio (Gratis)']::text[],
  ARRAY['Subir a la colina de Buda en el histórico funicular de madera Budavári Sikló (€10)']::text[],
  ARRAY['El nombre "Bastión de los Pescadores" se debe a que el gremio de pescadores de la ciudad era el encargado de defender este tramo de la muralla en la Edad Media']::text[],
  '{"address":"Szentháromság tér, Budapest","priceRange":"$ - Acceso casi libre","dia":7,"day":7}'::jsonb,
  210,
  '{"dia":7,"day":7,"activities":["Pasear por las terrazas y arcos del Bastión de los Pescadores (Planta principal gratis / torrecillas superiores ~€3)","Entrar a la Iglesia de Matías donde fue coronado el emperador Francisco José (Entrada: ~€8)","Cruzar a pie el centenario Puente de las Cadenas sobre el Danubio (Gratis)"],"datos_curiosos":["El nombre \"Bastión de los Pescadores\" se debe a que el gremio de pescadores de la ciudad era el encargado de defender este tramo de la muralla en la Edad Media"],"consejos":["Subir a la colina de Buda en el histórico funicular de madera Budavári Sikló (€10)"],"location_info":{"address":"Szentháromság tér, Budapest","priceRange":"$ - Acceso casi libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '129cdd66-37c8-2f1e-7dcd-f0e80962352d',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  8,
  'Día 8: Relajación en las Termas Széchenyi y Ruin Bars',
  'El mayor balneario termal medicinal de Europa y los singulares bares en ruinas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '87f6c048-9a93-c19d-bd30-11062c894894',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '129cdd66-37c8-2f1e-7dcd-f0e80962352d',
  8,
  8,
  'Balneario Termal Széchenyi y Szimpla Kert',
  47.518,
  19.082,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio neobarroco de color amarillo que alberga 15 piscinas termales interiores y 3 gigantescas piscinas exteriores humeantes a 38°C alimentadas por manantiales subterráneos. Por la noche, el barrio judío cobra vida en los *ruin bars* instalados en edificios abandonados decorados con arte vintage.',
  ARRAY['Baño en las piscinas termales exteriores y ver a los ancianos locales jugar al ajedrez en el agua (Entrada día completo con taquilla: ~10.500 HUF / €27)', 'Pasear por la Plaza de los Héroes (Hősök tere) a la salida del parque (Gratis)', 'Noche de copas en Szimpla Kert, el "ruin bar" más famoso del mundo (€4 - €8 cerveza local)']::text[],
  ARRAY['Llevar chanclas/sandalias obligatorias para caminar en el borde de las piscinas']::text[],
  ARRAY['El agua brota a más de 75°C desde 1.250 metros de profundidad y es tan rica en sulfatos y calcio que también alimenta el lago de los hipopótamos del zoo vecino']::text[],
  '{"address":"Állatkerti krt. 9-11, Budapest","priceRange":"$$ - Entrada termas ~€27","dia":8,"day":8}'::jsonb,
  300,
  '{"dia":8,"day":8,"activities":["Baño en las piscinas termales exteriores y ver a los ancianos locales jugar al ajedrez en el agua (Entrada día completo con taquilla: ~10.500 HUF / €27)","Pasear por la Plaza de los Héroes (Hősök tere) a la salida del parque (Gratis)","Noche de copas en Szimpla Kert, el \"ruin bar\" más famoso del mundo (€4 - €8 cerveza local)"],"datos_curiosos":["El agua brota a más de 75°C desde 1.250 metros de profundidad y es tan rica en sulfatos y calcio que también alimenta el lago de los hipopótamos del zoo vecino"],"consejos":["Llevar chanclas/sandalias obligatorias para caminar en el borde de las piscinas"],"location_info":{"address":"Állatkerti krt. 9-11, Budapest","priceRange":"$$ - Entrada termas ~€27","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '66f6cc48-2377-8955-c5d1-00ee26016fb8',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  9,
  'Día 9: Gran Mercado Central de Budapest y Despedida',
  'Gastronomía magiar, páprika aromática y despedida junto al río.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '95ea8ae6-0744-662e-6378-23bcfa399fd8',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '66f6cc48-2377-8955-c5d1-00ee26016fb8',
  9,
  9,
  'Gran Mercado Central de Budapest (Nagy Vásárcsarnok)',
  47.487,
  19.0585,
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80']::text[],
  'Impresionante edificio del siglo XIX con estructura de hierro forjado y tejado de tejas policromadas Zsolnay. Es el mejor lugar para probar la comida callejera magiar y comprar recuerdos de Hungría.',
  ARRAY['Probar un Lángos caliente con crema agria y queso rallado en la planta alta (~1.500 HUF / €4)', 'Comprar latas de páprika dulce húngara en polvo y vino dulce Tokaji para regalo (€5 - €15)', 'Caminar por la calle peatonal comercial Váci Utca antes del traslado al aeropuerto']::text[],
  ARRAY['Los domingos el mercado está cerrado; los sábados abre hasta las 3:00 PM']::text[],
  ARRAY['Antiguamente el mercado contaba con un canal subterráneo por donde los barcos descargaban directamente los productos frescos desde el Danubio']::text[],
  '{"address":"Vámház krt. 1-3, Budapest","priceRange":"$ - Compras locales","dia":9,"day":9}'::jsonb,
  150,
  '{"dia":9,"day":9,"activities":["Probar un Lángos caliente con crema agria y queso rallado en la planta alta (~1.500 HUF / €4)","Comprar latas de páprika dulce húngara en polvo y vino dulce Tokaji para regalo (€5 - €15)","Caminar por la calle peatonal comercial Váci Utca antes del traslado al aeropuerto"],"datos_curiosos":["Antiguamente el mercado contaba con un canal subterráneo por donde los barcos descargaban directamente los productos frescos desde el Danubio"],"consejos":["Los domingos el mercado está cerrado; los sábados abre hasta las 3:00 PM"],"location_info":{"address":"Vámház krt. 1-3, Budapest","priceRange":"$ - Compras locales","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'f9d47c9a-0a94-e660-02fa-cecb70ea028e',
  '8eabb0b4-7908-3a31-8b55-31d46ab02c3d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Gran Italia Monumental: Roma, Florencia, Toscana y Canales de Venecia (Roma, Italia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-gran-italia-monumental-10d',
  'La Gran Italia Monumental: Roma, Florencia, Toscana y Canales de Venecia',
  'Italia',
  'Roma',
  'historical',
  'El viaje clásico definitivo de 10 días por la cuna del Imperio Romano y el Renacimiento. Gladiadores en el Coliseo, arte divino en el Vaticano y la Capilla Sixtina, el David de Miguel Ángel y los Uffizi en Florencia, viñedos en las colinas toscanas y navegación en góndola por los canales de Venecia.',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1200&q=80']::text[],
  14400,
  620000,
  'moderate',
  'es',
  4.99,
  265,
  890,
  ARRAY['Italia', 'Roma', 'Florencia', 'Venecia', 'Toscana', 'Coliseo', 'Vaticano', 'Góndola']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":850,"estimatedPerPersonMax":1800,"notes":"Coliseo (€18), Vaticano (€20-€25), Uffizi (€25), trenes bala y gastronomía italiana"}'::jsonb,
  ARRAY['Amantes del arte y la historia', 'Parejas', 'Viajeros primerizos en Europa']::text[],
  'Marzo a Junio y Septiembre a Noviembre (evitar el calor sofocante de julio y agosto)',
  'Monumentos clave temprano por la mañana para evitar colas de dos horas',
  'Piazza del Colosseo, Roma',
  ARRAY['Ruta completa conectada por trenes de alta velocidad Frecciarossa', 'Coordenadas GPS de basílicas, museos y miradores', 'Guía de platos regionales auténticos']::text[],
  ARRAY['Boleto al Coliseo y Foro Romano', 'Entrada a Museos Vaticanos y Capilla Sixtina', 'Galería Uffizi', 'Paseo en góndola']::text[],
  ARRAY['Es IMPRESCINDIBLE reservar las entradas a Museos Vaticanos, Coliseo y Galería Uffizi con 1 o 2 meses de anticipación en sus webs oficiales', 'Para ingresar a basílicas es obligatorio cubrir hombros y rodillas']::text[],
  ARRAY['Calzado para caminar 12-15 km diarios sobre adoquines (*sampietrini*)', 'Botella de agua recargable (Roma tiene fuentes de agua potable fría *nasoni* en cada esquina)', 'Pañuelo para cubrirse hombros']::text[],
  ARRAY['Prohibido sentarse en los escalones de la Plaza de España de Roma para preservación']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0bda5507-7c0b-0f13-9e2a-f4626bdae7e2',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  1,
  'Día 1: La Roma Imperial: Coliseo, Foro Romano y Monte Palatino',
  'El anfiteatro de los emperadores y el centro político de la antigüedad.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '84913fd1-582c-943b-489e-a52286300d19',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '0bda5507-7c0b-0f13-9e2a-f4626bdae7e2',
  1,
  1,
  'Coliseo Romano, Foro Romano y Palatino',
  41.8902,
  12.4922,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'El Anfiteatro Flavio inaugurado en el año 80 d.C. donde combatían gladiadores ante 50.000 espectadores. El Foro Romano al lado era el epicentro del mundo antiguo con arcos de triunfo y templos marmóreos.',
  ARRAY['Recorrido por la cávea y vista a la arena del Coliseo (Entrada combinada oficial: €18)', 'Caminar por la Vía Sacra del Foro Romano hasta el Templo de Julio César (Incluido en la entrada)', 'Subir a la colina del Palatino donde Rómulo fundó Roma y se construyeron los palacios imperiales']::text[],
  ARRAY['Comprar la entrada nominativa en la web de Parco Archeologico del Colosseo', 'Llevar botella de agua para rellenar en las fuentes del interior']::text[],
  ARRAY['Durante la inauguración del Coliseo se celebraron 100 días ininterrumpidos de juegos en los que murieron más de 5.000 animales salvajes traídos de África']::text[],
  '{"address":"Piazza del Colosseo 1, Roma","priceRange":"$$ - Entrada €18","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Recorrido por la cávea y vista a la arena del Coliseo (Entrada combinada oficial: €18)","Caminar por la Vía Sacra del Foro Romano hasta el Templo de Julio César (Incluido en la entrada)","Subir a la colina del Palatino donde Rómulo fundó Roma y se construyeron los palacios imperiales"],"datos_curiosos":["Durante la inauguración del Coliseo se celebraron 100 días ininterrumpidos de juegos en los que murieron más de 5.000 animales salvajes traídos de África"],"consejos":["Comprar la entrada nominativa en la web de Parco Archeologico del Colosseo","Llevar botella de agua para rellenar en las fuentes del interior"],"location_info":{"address":"Piazza del Colosseo 1, Roma","priceRange":"$$ - Entrada €18","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '29d17a35-9583-eb08-9e70-c05e68fdc2aa',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  2,
  'Día 2: Roma Barroca: Fontana di Trevi, Panteón y Trastevere',
  'Monedas al agua, la cúpula de hormigón más grande y pasta fresca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e2be63c5-1108-9433-20bd-2ab462aefd0a',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '29d17a35-9583-eb08-9e70-c05e68fdc2aa',
  2,
  2,
  'Fontana di Trevi, Panteón de Agripa y Piazza Navona',
  41.9009,
  12.4833,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'La fuente más famosa del cine barroco tallada en mármol travertino con el dios Océano. El Panteón de Agripa conserva intacta su cúpula de hormigón de 2.000 años con un óculo central abierto al cielo.',
  ARRAY['Lanzar una moneda con la mano derecha sobre el hombro izquierdo a la Fontana di Trevi para asegurar el regreso a Roma (Gratis)', 'Entrar al Panteón y contemplar la tumba del pintor Rafael (Entrada: €5)', 'Cenar pasta Carbonara o Cacio e Pepe auténtica en una trattoria de Trastevere (€14 - €22)']::text[],
  ARRAY['La Fontana di Trevi está iluminada de manera mágica a las 11:00 PM con mucha menos gente que durante el día']::text[],
  ARRAY['Cada día se recogen más de €3.000 euros en monedas del fondo de la Fontana di Trevi, donados íntegramente a la organización benéfica Cáritas']::text[],
  '{"address":"Piazza di Trevi, Roma","priceRange":"$ - Entrada Panteón €5","dia":2,"day":2}'::jsonb,
  210,
  '{"dia":2,"day":2,"activities":["Lanzar una moneda con la mano derecha sobre el hombro izquierdo a la Fontana di Trevi para asegurar el regreso a Roma (Gratis)","Entrar al Panteón y contemplar la tumba del pintor Rafael (Entrada: €5)","Cenar pasta Carbonara o Cacio e Pepe auténtica en una trattoria de Trastevere (€14 - €22)"],"datos_curiosos":["Cada día se recogen más de €3.000 euros en monedas del fondo de la Fontana di Trevi, donados íntegramente a la organización benéfica Cáritas"],"consejos":["La Fontana di Trevi está iluminada de manera mágica a las 11:00 PM con mucha menos gente que durante el día"],"location_info":{"address":"Piazza di Trevi, Roma","priceRange":"$ - Entrada Panteón €5","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a8ccf2e6-4d01-6fbe-324b-7af220626cf0',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  3,
  'Día 3: El Vaticano: Capilla Sixtina y Basílica de San Pedro',
  'El Juicio Final de Miguel Ángel y el templo católico más imponente de la Tierra.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0b5e1d4f-8a72-12e4-c010-3a3103e6ada9',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  'a8ccf2e6-4d01-6fbe-324b-7af220626cf0',
  3,
  3,
  'Museos Vaticanos, Capilla Sixtina y San Pedro',
  41.9029,
  12.4534,
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80']::text[],
  'El Estado más pequeño del mundo custodia una de las mayores concentraciones de arte de la historia. Las Estancias de Rafael, la Capilla Sixtina con los frescos sublimes de Miguel Ángel y la Basílica con La Piedad.',
  ARRAY['Contemplar la bóveda del Génesis y el Juicio Final en silencio en la Capilla Sixtina (Entrada oficial: €20 + €5 reserva)', 'Entrar a la Basílica de San Pedro y maravillarse con La Piedad esculpida en mármol blanco por Miguel Ángel a los 24 años (Entrada basílica gratis)', 'Subir a la cúpula de San Pedro para la vista circular de la Plaza de Bernini (€10 ascensor)']::text[],
  ARRAY['Estrictamente obligatorio llevar hombros cubiertos y pantalones o faldas por debajo de la rodilla; no dejan pasar con tirantes ni bermudas cortas', 'Prohibido hablar y tomar fotos dentro de la Capilla Sixtina']::text[],
  ARRAY['Miguel Ángel pintó la bóveda de la Capilla Sixtina de pie sobre andamios de madera durante cuatro años de trabajo extenuante que casi le costó la vista']::text[],
  '{"address":"Viale Vaticano, Ciudad del Vaticano","priceRange":"$$ - Entrada €25","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Contemplar la bóveda del Génesis y el Juicio Final en silencio en la Capilla Sixtina (Entrada oficial: €20 + €5 reserva)","Entrar a la Basílica de San Pedro y maravillarse con La Piedad esculpida en mármol blanco por Miguel Ángel a los 24 años (Entrada basílica gratis)","Subir a la cúpula de San Pedro para la vista circular de la Plaza de Bernini (€10 ascensor)"],"datos_curiosos":["Miguel Ángel pintó la bóveda de la Capilla Sixtina de pie sobre andamios de madera durante cuatro años de trabajo extenuante que casi le costó la vista"],"consejos":["Estrictamente obligatorio llevar hombros cubiertos y pantalones o faldas por debajo de la rodilla; no dejan pasar con tirantes ni bermudas cortas","Prohibido hablar y tomar fotos dentro de la Capilla Sixtina"],"location_info":{"address":"Viale Vaticano, Ciudad del Vaticano","priceRange":"$$ - Entrada €25","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '44d4d8a6-cd93-8d88-daa6-08b37f6a36d5',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  4,
  'Día 4: Tren Bala a Florencia: La Cuna del Renacimiento y el Duomo',
  'Viaje en Frecciarossa y la cúpula arquitectónica de Brunelleschi.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'eea382b1-18fd-faf0-521c-971bf717117d',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '44d4d8a6-cd93-8d88-daa6-08b37f6a36d5',
  4,
  4,
  'Piazza del Duomo y Catedral Santa Maria del Fiore',
  43.7731,
  11.256,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'Florencia es un museo al aire libre. Su catedral destaca por la fachada de mármol blanco, verde y rosa y la gigantesca cúpula de ladrillo rojo de Filippo Brunelleschi erigida en el siglo XV sin andamios de soporte.',
  ARRAY['Tren Frecciarossa Roma Termini - Firenze Santa Maria Novella (1 hora y 35 minutos - €25 - €45)', 'Ver la fachada del Duomo y las Puertas del Paraíso en bronce dorado del Baptisterio (Gratis exterior)', 'Tomar un panini gourmet con embutidos toscanos en All''Antico Vinaio (€7 - €9)']::text[],
  ARRAY['Subir los 463 escalones de la Cúpula de Brunelleschi requiere comprar el Brunelleschi Pass con reserva anticipada (€30)']::text[],
  ARRAY['Brunelleschi inventó nuevas máquinas elevadoras e ideó una disposición de ladrillos en espina de pez que permitió construir la mayor cúpula de albañilería del mundo sin cimbras de madera']::text[],
  '{"address":"Piazza del Duomo, Firenze","priceRange":"$ - Acceso exterior libre","dia":4,"day":4}'::jsonb,
  200,
  '{"dia":4,"day":4,"activities":["Tren Frecciarossa Roma Termini - Firenze Santa Maria Novella (1 hora y 35 minutos - €25 - €45)","Ver la fachada del Duomo y las Puertas del Paraíso en bronce dorado del Baptisterio (Gratis exterior)","Tomar un panini gourmet con embutidos toscanos en All''Antico Vinaio (€7 - €9)"],"datos_curiosos":["Brunelleschi inventó nuevas máquinas elevadoras e ideó una disposición de ladrillos en espina de pez que permitió construir la mayor cúpula de albañilería del mundo sin cimbras de madera"],"consejos":["Subir los 463 escalones de la Cúpula de Brunelleschi requiere comprar el Brunelleschi Pass con reserva anticipada (€30)"],"location_info":{"address":"Piazza del Duomo, Firenze","priceRange":"$ - Acceso exterior libre","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'cb78382c-56c4-4160-5947-999b6419978c',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  5,
  'Día 5: El David de Miguel Ángel y la Galería Uffizi',
  'Las dos joyas artísticas más sublimes de Florencia y atardecer en Ponte Vecchio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4bcda182-e02f-d803-41b9-7263dbd51471',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  'cb78382c-56c4-4160-5947-999b6419978c',
  5,
  5,
  'Galería de la Academia y Galería de los Uffizi',
  43.7687,
  11.2556,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'La estatua más perfecta de la historia del arte: el David original de 5.17 metros tallado en un solo bloque de mármol de Carrara. En los Uffizi, las obras cumbres de Botticelli como "El Nacimiento de Venus" y "La Primavera".',
  ARRAY['Quedarse sin palabras ante el David original en la Galería de la Academia (Entrada: €16 + €4 reserva)', 'Recorrer las salas de Botticelli, Da Vinci y Caravaggio en Uffizi (Entrada: €25)', 'Caminar al atardecer sobre el Ponte Vecchio con sus joyerías de oro suspendidas sobre el río Arno (Gratis)']::text[],
  ARRAY['Cruzar el río Arno y subir al Piazzale Michelangelo para la postal más bella del atardecer con el Duomo recortado en el cielo']::text[],
  ARRAY['El bloque de mármol del David había sido abandonado y declarado inservible por otros escultores durante 40 años hasta que Miguel Ángel lo asumió a sus 26 años']::text[],
  '{"address":"Piazzale degli Uffizi / Via Ricasoli 60, Firenze","priceRange":"$$$ - Entradas museos","dia":5,"day":5}'::jsonb,
  270,
  '{"dia":5,"day":5,"activities":["Quedarse sin palabras ante el David original en la Galería de la Academia (Entrada: €16 + €4 reserva)","Recorrer las salas de Botticelli, Da Vinci y Caravaggio en Uffizi (Entrada: €25)","Caminar al atardecer sobre el Ponte Vecchio con sus joyerías de oro suspendidas sobre el río Arno (Gratis)"],"datos_curiosos":["El bloque de mármol del David había sido abandonado y declarado inservible por otros escultores durante 40 años hasta que Miguel Ángel lo asumió a sus 26 años"],"consejos":["Cruzar el río Arno y subir al Piazzale Michelangelo para la postal más bella del atardecer con el Duomo recortado en el cielo"],"location_info":{"address":"Piazzale degli Uffizi / Via Ricasoli 60, Firenze","priceRange":"$$$ - Entradas museos","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7c7e5705-62b8-5223-f82e-692f197e35c0',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  6,
  'Día 6: La Campiña Toscana: Siena y las Torres de San Gimignano',
  'Colinas de cipreses, vino Chianti y la plaza medieval del Palio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '573cabc9-4ff6-0774-cfd1-50dfbb19013b',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '7c7e5705-62b8-5223-f82e-692f197e35c0',
  6,
  6,
  'Piazza del Campo en Siena y San Gimignano',
  43.3188,
  11.3317,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'Siena cautiva con su Piazza del Campo en forma de concha donde se corre la histórica carrera de caballos del Palio. Luego, San Gimignano ("el Manhattan medieval") con sus 14 torres de piedra que despuntan sobre viñedos de Vernaccia.',
  ARRAY['Sentarse en el suelo de ladrillos de la Piazza del Campo en Siena (Gratis)', 'Entrar a la Catedral de Siena con sus suelos de mármol incrustado (€8)', 'Tomar el helado galardonado como mejor del mundo en la Gelateria Dondoli de San Gimignano (€3 - €6)']::text[],
  ARRAY['Excursión en autobús de día completo desde Florencia (€55 - €80 con almuerzo y cata en bodega de Chianti)']::text[],
  ARRAY['Las familias nobles de San Gimignano competían por construir la torre más alta como símbolo de poder y riqueza económica']::text[],
  '{"address":"Siena y San Gimignano, Toscana","priceRange":"$$ - Excursión toscana","dia":6,"day":6}'::jsonb,
  300,
  '{"dia":6,"day":6,"activities":["Sentarse en el suelo de ladrillos de la Piazza del Campo en Siena (Gratis)","Entrar a la Catedral de Siena con sus suelos de mármol incrustado (€8)","Tomar el helado galardonado como mejor del mundo en la Gelateria Dondoli de San Gimignano (€3 - €6)"],"datos_curiosos":["Las familias nobles de San Gimignano competían por construir la torre más alta como símbolo de poder y riqueza económica"],"consejos":["Excursión en autobús de día completo desde Florencia (€55 - €80 con almuerzo y cata en bodega de Chianti)"],"location_info":{"address":"Siena y San Gimignano, Toscana","priceRange":"$$ - Excursión toscana","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e971d98f-c3eb-e547-3785-f4955acb4fb1',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  7,
  'Día 7: Llegada a Venecia: Piazza San Marco y Palacio Ducal',
  'El tren entra en la laguna sobre el mar hacia la ciudad sin automóviles.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2053b26c-9750-2312-aa85-a52d27e99865',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  'e971d98f-c3eb-e547-3785-f4955acb4fb1',
  7,
  7,
  'Piazza San Marco y Palacio Ducal',
  45.4342,
  12.3389,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'Tren Frecciarossa desde Florencia a Venezia Santa Lucia (2 horas). Al salir de la estación se abre el Gran Canal con sus vaporettos. San Marcos deslumbra con los mosaicos dorados de la Basílica y el gótico veneciano del Palacio de los Dogos.',
  ARRAY['Vaporetto línea 1 recorriendo todo el Gran Canal hasta San Marcos (€9.50 billete sencillo)', 'Visita a la Basílica de San Marcos con sus 8.000 m² de mosaicos en pan de oro (Entrada: €3)', 'Cruzar el Puente de los Suspiros desde los calabozos del Palacio Ducal (Entrada palacio: €30)']::text[],
  ARRAY['Comprar el pase de transporte ilimitado de Vaporetto ACTV de 48 o 72 horas para ahorrar (€35 - €45)']::text[],
  ARRAY['El Puente de los Suspiros no debe su nombre a los enamorados, sino a los suspiros de los prisioneros que veían por última vez el cielo y el mar antes de ser encerrados']::text[],
  '{"address":"Piazza San Marco, Venezia","priceRange":"$$ - Palacio y transporte","dia":7,"day":7}'::jsonb,
  240,
  '{"dia":7,"day":7,"activities":["Vaporetto línea 1 recorriendo todo el Gran Canal hasta San Marcos (€9.50 billete sencillo)","Visita a la Basílica de San Marcos con sus 8.000 m² de mosaicos en pan de oro (Entrada: €3)","Cruzar el Puente de los Suspiros desde los calabozos del Palacio Ducal (Entrada palacio: €30)"],"datos_curiosos":["El Puente de los Suspiros no debe su nombre a los enamorados, sino a los suspiros de los prisioneros que veían por última vez el cielo y el mar antes de ser encerrados"],"consejos":["Comprar el pase de transporte ilimitado de Vaporetto ACTV de 48 o 72 horas para ahorrar (€35 - €45)"],"location_info":{"address":"Piazza San Marco, Venezia","priceRange":"$$ - Palacio y transporte","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '27be0dfa-f5f5-901f-d9c0-0bd134b99aad',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  8,
  'Día 8: Paseo en Góndola por los Canales y Puente de Rialto',
  'Navegación tradicional a remo por canales estrechos y puentes de piedra.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6212a2c8-4a10-23ab-4146-263efe726fb8',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '27be0dfa-f5f5-901f-d9c0-0bd134b99aad',
  8,
  8,
  'Paseo en Góndola y Puente de Rialto',
  45.438,
  12.3358,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'El puente más antiguo y famoso que cruza el Gran Canal con arcadas llenas de tiendas. A sus pies, embarque en una góndola tradicional guiada por un gondolero de camiseta a rayas navegando por canales silenciosos bajo puentes colgantes.',
  ARRAY['Paseo clásico en góndola de 30 minutos por canales interiores y Gran Canal (Tarifa oficial municipal regulada: €90 de día / €110 de noche por góndola hasta 5 personas)', 'Fotografía del tráfico de góndolas y barcos desde la cima del Puente de Rialto (Gratis)', 'Tomar *cicchetti* (tapas venecianas de bacalao mantecato) con una copa de vino blanco *ombra* en una osteria tradicional (€12 - €18)']::text[],
  ARRAY['Pagar la tarifa oficial fijada por la ciudad y exigir los 30 minutos completos de navegación']::text[],
  ARRAY['La góndola es asimétrica: su lado izquierdo es 24 centímetros más ancho que el derecho para compensar el peso del gondolero y el remo']::text[],
  '{"address":"Ponte di Rialto / Canales de San Polo","priceRange":"$$$ - Góndola oficial €90","dia":8,"day":8}'::jsonb,
  180,
  '{"dia":8,"day":8,"activities":["Paseo clásico en góndola de 30 minutos por canales interiores y Gran Canal (Tarifa oficial municipal regulada: €90 de día / €110 de noche por góndola hasta 5 personas)","Fotografía del tráfico de góndolas y barcos desde la cima del Puente de Rialto (Gratis)","Tomar *cicchetti* (tapas venecianas de bacalao mantecato) con una copa de vino blanco *ombra* en una osteria tradicional (€12 - €18)"],"datos_curiosos":["La góndola es asimétrica: su lado izquierdo es 24 centímetros más ancho que el derecho para compensar el peso del gondolero y el remo"],"consejos":["Pagar la tarifa oficial fijada por la ciudad y exigir los 30 minutos completos de navegación"],"location_info":{"address":"Ponte di Rialto / Canales de San Polo","priceRange":"$$$ - Góndola oficial €90","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '1f5ba34e-13f3-3db1-b359-99c27b4d30e9',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  9,
  'Día 9: Las Islas de la Laguna: Murano (Cristal) y Burano (Color)',
  'Hornos de vidrio soplado artesanal y las casas de colores más vivas del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'efdc5220-8763-1454-049e-d478c25285ab',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '1f5ba34e-13f3-3db1-b359-99c27b4d30e9',
  9,
  9,
  'Isla de Murano e Isla de Burano',
  45.4854,
  12.4167,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'Excursión en vaporetto por la laguna veneciana. En Murano se asiste a la forja en vivo de esculturas de vidrio candente en hornos a 1.200°C. En Burano, cada casa de pescadores está pintada de un color brillante diferente con encajes tradicionales.',
  ARRAY['Demostración en vivo de maestro soplador de vidrio en fábrica de Murano (€5)', 'Paseo fotográfico entre las casas de colores arcoíris y canales de Burano (Gratis)', 'Probar las galletas tradicionales en forma de S llamadas *Bussolà de Burano* en una panadería artesanal (€5)']::text[],
  ARRAY['Tomar el Vaporetto línea 12 desde Fondamente Nove hacia Murano y Burano (40 minutos)']::text[],
  ARRAY['En la antigüedad la República de Venecia prohibía a los maestros vidrieros salir de la isla de Murano bajo pena de muerte para que ningún otro país descubriera el secreto del cristal transparente']::text[],
  '{"address":"Laguna de Venecia (Murano y Burano)","priceRange":"$$ - Transporte vaporetto","dia":9,"day":9}'::jsonb,
  270,
  '{"dia":9,"day":9,"activities":["Demostración en vivo de maestro soplador de vidrio en fábrica de Murano (€5)","Paseo fotográfico entre las casas de colores arcoíris y canales de Burano (Gratis)","Probar las galletas tradicionales en forma de S llamadas *Bussolà de Burano* en una panadería artesanal (€5)"],"datos_curiosos":["En la antigüedad la República de Venecia prohibía a los maestros vidrieros salir de la isla de Murano bajo pena de muerte para que ningún otro país descubriera el secreto del cristal transparente"],"consejos":["Tomar el Vaporetto línea 12 desde Fondamente Nove hacia Murano y Burano (40 minutos)"],"location_info":{"address":"Laguna de Venecia (Murano y Burano)","priceRange":"$$ - Transporte vaporetto","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8f7e7309-a5cb-163f-410a-707b4a1aae27',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  10,
  'Día 10: Mirador Fondaco dei Tedeschi y Despedida Veneciana',
  'Terraza panorámica sobre el Gran Canal y despedida con Spritz.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '83a244d5-4e66-1851-e99b-2d7f50cff533',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '8f7e7309-a5cb-163f-410a-707b4a1aae27',
  10,
  10,
  'Terraza T Fondaco dei Tedeschi y Campo Santa Margherita',
  45.4375,
  12.3365,
  'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80']::text[],
  'Antiguo almacén de comerciantes alemanes del siglo XIII convertido en galería de lujo. Su terraza en la azotea ofrece la mejor vista gratuita de 360 grados de los tejados, campanarios y la gran curva en S del Gran Canal.',
  ARRAY['Subida a la terraza mirador panorámica de madera sobre el tejado (Acceso gratuito con reserva previa online obligatoria de turno de 15 minutos)', 'Brindis final de despedida con Aperol Spritz con aceituna en Campo Santa Margherita (€5)', 'Traslado en autobús acuático Alilaguna directo hacia el aeropuerto Marco Polo (€15)']::text[],
  ARRAY['Reservar el turno de la terraza en la web oficial de DFS Fondaco dei Tedeschi con al menos una semana de antelación']::text[],
  ARRAY['El Spritz nació en el siglo XIX cuando los soldados austriacos en Venecia encontraban el vino local demasiado fuerte y pedían que lo rociaran (*spritzen*) con un chorro de agua con gas']::text[],
  '{"address":"Calle del Fontego dei Tedeschi, Venezia","priceRange":"$ - Terraza gratuita","dia":10,"day":10}'::jsonb,
  150,
  '{"dia":10,"day":10,"activities":["Subida a la terraza mirador panorámica de madera sobre el tejado (Acceso gratuito con reserva previa online obligatoria de turno de 15 minutos)","Brindis final de despedida con Aperol Spritz con aceituna en Campo Santa Margherita (€5)","Traslado en autobús acuático Alilaguna directo hacia el aeropuerto Marco Polo (€15)"],"datos_curiosos":["El Spritz nació en el siglo XIX cuando los soldados austriacos en Venecia encontraban el vino local demasiado fuerte y pedían que lo rociaran (*spritzen*) con un chorro de agua con gas"],"consejos":["Reservar el turno de la terraza en la web oficial de DFS Fondaco dei Tedeschi con al menos una semana de antelación"],"location_info":{"address":"Calle del Fontego dei Tedeschi, Venezia","priceRange":"$ - Terraza gratuita","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'f8a992eb-505c-5b82-2b1e-b8c7b8930908',
  '3bf597d5-a65d-bceb-693e-0b7136517ed4',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Reino Unido de Leyenda: De los Palacios de Londres a las Tierras Altas de Escocia (Londres, Reino Unido)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-reino-unido-londres-highlands-10d',
  'Reino Unido de Leyenda: De los Palacios de Londres a las Tierras Altas de Escocia',
  'Reino Unido',
  'Londres',
  'family',
  'Aventura legendaria de 10 días para todas las edades. Los tesoros reales y museos gratuitos de Londres, el cambio de guardia, la misteriosa Torre de Londres, el tren expreso a Edimburgo con su castillo sobre roca volcánica, y la búsqueda de Nessie en las Tierras Altas de Escocia.',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80']::text[],
  14400,
  890000,
  'moderate',
  'es',
  4.95,
  185,
  610,
  ARRAY['Reino Unido', 'Londres', 'Escocia', 'Edimburgo', 'Loch Ness', 'Castillos', 'Highlands', 'Familiar']::text[],
  true,
  'approved',
  '{"currency":"GBP","estimatedPerPersonMin":800,"estimatedPerPersonMax":1600,"notes":"Torre de Londres (~£34), Castillo de Edimburgo (~£19.50), tren LNER (~£45-£75) y gastronomía británica"}'::jsonb,
  ARRAY['Familias', 'Amantes de la historia británica', 'Fans de leyendas y castillos']::text[],
  'Mayo a Septiembre (días largos con hasta 17 horas de luz y temperaturas amables)',
  'Museos y palacios por la mañana; paseos por parques reales por la tarde',
  'Big Ben / Westminster Bridge, Londres',
  ARRAY['Ruta completa de Londres y conexión a Escocia en tren LNER', 'Ubicación de museos con entrada gratuita', 'Itinerario por el Lago Ness y Castillo de Urquhart']::text[],
  ARRAY['Boleto de tren Londres King''s Cross - Edimburgo', 'Entrada al Castillo de Edimburgo y Torre de Londres', 'Paseo en barco por Loch Ness']::text[],
  ARRAY['En Londres casi todos los museos nacionales principales (British Museum, Natural History, Science) son 100% de entrada gratuita', 'Usar tarjeta contactless o smartphone para el metro de Londres (Oyster cap)']::text[],
  ARRAY['Chaqueta impermeable ligera', 'Ropa por capas', 'Zapatos cómodos para caminar', 'Adaptador de enchufe británico (tipo G)']::text[],
  ARRAY['No tocar las joyas de la corona en la Torre de Londres']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'bb2e7fbe-6385-4c43-25ea-ab1b210e9bdf',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  1,
  'Día 1: Londres Real: Big Ben, Abadía de Westminster y Buckingham',
  'El corazón de la monarquía británica y el río Támesis.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c4e45f9e-4031-2fc4-2a46-9268cfbff2cd',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  'bb2e7fbe-6385-4c43-25ea-ab1b210e9bdf',
  1,
  1,
  'Big Ben, Abadía de Westminster y Palacio de Buckingham',
  51.5007,
  -0.1246,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'El reloj más famoso del planeta integrado en el Parlamento británico junto al Támesis. A unos pasos se erige la Abadía de Westminster donde han sido coronados los reyes desde Guillermo el Conquistador en 1066. Por Saint James''s Park se llega al Palacio de Buckingham.',
  ARRAY['Fotografiar el Big Ben desde el puente de Westminster (Gratis)', 'Presenciar el Cambio de Guardia en Buckingham a las 11:00 AM en días programados (Gratis)', 'Almorzar Fish & Chips tradicional con puré de guisantes en un pub histórico (£14 - £20)']::text[],
  ARRAY['Revisar el calendario oficial del Cambio de Guardia antes de ir; no se celebra todos los días en invierno']::text[],
  ARRAY['Big Ben no es el nombre de la torre ni del reloj, sino el apodo de la campana mayor de 13.7 toneladas que marca las horas en su interior']::text[],
  '{"address":"Westminster, London SW1A","priceRange":"$ - Acceso exterior libre","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Fotografiar el Big Ben desde el puente de Westminster (Gratis)","Presenciar el Cambio de Guardia en Buckingham a las 11:00 AM en días programados (Gratis)","Almorzar Fish & Chips tradicional con puré de guisantes en un pub histórico (£14 - £20)"],"datos_curiosos":["Big Ben no es el nombre de la torre ni del reloj, sino el apodo de la campana mayor de 13.7 toneladas que marca las horas en su interior"],"consejos":["Revisar el calendario oficial del Cambio de Guardia antes de ir; no se celebra todos los días en invierno"],"location_info":{"address":"Westminster, London SW1A","priceRange":"$ - Acceso exterior libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3b717645-587c-9130-d66b-31f548daf04b',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  2,
  'Día 2: Joyas de la Corona en la Torre de Londres y Tower Bridge',
  'Mil años de historia feudal, cuervos sagrados y el puente levadizo victoriano.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2d205e5a-55bd-27f9-c8f1-c6df4f189277',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '3b717645-587c-9130-d66b-31f548daf04b',
  2,
  2,
  'Torre de Londres y Puente de la Torre (Tower Bridge)',
  51.5081,
  -0.0759,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Fortaleza medieval construida en 1078 por Guillermo el Conquistador que ha servido de palacio real, prisión y lugar de ejecuciones como la de Ana Bolena. Custodia las deslumbrantes Joyas de la Corona de la monarquía británica.',
  ARRAY['Ver la corona imperial de Estado y el cetro con el diamante Cullinan I (Entrada: £34.80 adulto)', 'Hacer el tour guiado por los alabarderos ceremoniales vestidos de rojo conocidos como Yeoman Warders / Beefeaters (Incluido con entrada)', 'Cruzar la pasarela peatonal de cristal a 42 metros de altura sobre el Tower Bridge (£12.30)']::text[],
  ARRAY['Llegar a la apertura a las 9:00 AM e ir directamente a la sala de las Joyas de la Corona para no hacer fila']::text[],
  ARRAY['Cuenta la leyenda que si los seis cuervos residentes abandonan la Torre de Londres, la fortaleza caerá y con ella la corona y el Imperio británico']::text[],
  '{"address":"Tower of London, London EC3N 4AB","priceRange":"$$ - Entrada £34.80","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Ver la corona imperial de Estado y el cetro con el diamante Cullinan I (Entrada: £34.80 adulto)","Hacer el tour guiado por los alabarderos ceremoniales vestidos de rojo conocidos como Yeoman Warders / Beefeaters (Incluido con entrada)","Cruzar la pasarela peatonal de cristal a 42 metros de altura sobre el Tower Bridge (£12.30)"],"datos_curiosos":["Cuenta la leyenda que si los seis cuervos residentes abandonan la Torre de Londres, la fortaleza caerá y con ella la corona y el Imperio británico"],"consejos":["Llegar a la apertura a las 9:00 AM e ir directamente a la sala de las Joyas de la Corona para no hacer fila"],"location_info":{"address":"Tower of London, London EC3N 4AB","priceRange":"$$ - Entrada £34.80","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '6207c12e-eb7a-77f5-8d19-22b035e51d3f',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  3,
  'Día 3: El Museo Británico y Covent Garden',
  'La Piedra de Rosetta, momias egipcias y teatro callejero.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8c4ddc7f-7bed-a892-c0ae-64f8c565ad3e',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '6207c12e-eb7a-77f5-8d19-22b035e51d3f',
  3,
  3,
  'Museo Británico (British Museum) y Covent Garden',
  51.5194,
  -0.127,
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los museos más extraordinarios de la humanidad bajo una colosal cúpula de cristal y acero. Custodia la Piedra de Rosetta que permitió descifrar los jeroglíficos egipcios, esculturas del Partenón y momias faraónicas.',
  ARRAY['Ver la auténtica Piedra de Rosetta que descifró Champollion (Entrada: Gratuita para todos)', 'Asombrarse con las esculturas colosales de los toros alados asirios (Gratis)', 'Disfrutar de los espectáculos callejeros y mercadillos en la plaza techada de Covent Garden (Gratis)']::text[],
  ARRAY['Aunque la entrada es gratis, es recomendable reservar el ticket horario gratuito en la web oficial para asegurar entrada rápida']::text[],
  ARRAY['La Gran Corte techada del museo diseñada por Norman Foster es la plaza pública cubierta más grande de Europa']::text[],
  '{"address":"Great Russell St, London WC1B","priceRange":"$ - Entrada gratuita","dia":3,"day":3}'::jsonb,
  210,
  '{"dia":3,"day":3,"activities":["Ver la auténtica Piedra de Rosetta que descifró Champollion (Entrada: Gratuita para todos)","Asombrarse con las esculturas colosales de los toros alados asirios (Gratis)","Disfrutar de los espectáculos callejeros y mercadillos en la plaza techada de Covent Garden (Gratis)"],"datos_curiosos":["La Gran Corte techada del museo diseñada por Norman Foster es la plaza pública cubierta más grande de Europa"],"consejos":["Aunque la entrada es gratis, es recomendable reservar el ticket horario gratuito en la web oficial para asegurar entrada rápida"],"location_info":{"address":"Great Russell St, London WC1B","priceRange":"$ - Entrada gratuita","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9f5ea9b5-a03d-4c3a-acda-b248d29c5e5b',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  4,
  'Día 4: Tren Expreso a Edimburgo (LNER) y la Milla Real',
  'Viaje en tren a través de la costa inglesa hacia la capital de Escocia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '28ea003a-b608-a7b7-6a3f-8cfbc83c16b8',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '9f5ea9b5-a03d-4c3a-acda-b248d29c5e5b',
  4,
  4,
  'Viaje en Tren y la Royal Mile de Edimburgo',
  55.9505,
  -3.1905,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Salida en tren rápido LNER desde London King''s Cross (donde está el andén 9 ¾ de Harry Potter) hacia Edimburgo (4 horas y 20 minutos con vistas al Mar del Norte). La Royal Mile es la arteria empedrada medieval que une el castillo con el palacio real.',
  ARRAY['Foto en el Carrito de Harry Potter en King''s Cross antes de abordar el tren (Gratis)', 'Caminar por la Royal Mile escuchando a gaiteros escoceses vestidos con kilt tradicional (Gratis)', 'Cena de estofado tradicional escocés o haggis con puré de nabos y patatas (£15 - £24)']::text[],
  ARRAY['Reservar asiento en el lado derecho del tren en sentido de marcha para contemplar los acantilados marinos de Northumberland']::text[],
  ARRAY['Edimburgo fue la primera ciudad del mundo en tener su propio cuerpo de bomberos municipal formal en 1824']::text[],
  '{"address":"Royal Mile, Old Town, Edinburgh","priceRange":"$$ - Tren LNER","dia":4,"day":4}'::jsonb,
  240,
  '{"dia":4,"day":4,"activities":["Foto en el Carrito de Harry Potter en King''s Cross antes de abordar el tren (Gratis)","Caminar por la Royal Mile escuchando a gaiteros escoceses vestidos con kilt tradicional (Gratis)","Cena de estofado tradicional escocés o haggis con puré de nabos y patatas (£15 - £24)"],"datos_curiosos":["Edimburgo fue la primera ciudad del mundo en tener su propio cuerpo de bomberos municipal formal en 1824"],"consejos":["Reservar asiento en el lado derecho del tren en sentido de marcha para contemplar los acantilados marinos de Northumberland"],"location_info":{"address":"Royal Mile, Old Town, Edinburgh","priceRange":"$$ - Tren LNER","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4032c414-bb00-bef2-4723-036c06718a20',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  5,
  'Día 5: El Castillo de Edimburgo y Calton Hill',
  'La fortaleza sobre la roca volcánica y vistas de la Ciudad Vieja y Nueva.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b753eac9-6a0d-4dc3-c811-e03b0120c48b',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '4032c414-bb00-bef2-4723-036c06718a20',
  5,
  5,
  'Castillo de Edimburgo y Colina de Calton Hill',
  55.9486,
  -3.1999,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Inexpugnable fortaleza erigida en lo alto de Castle Rock, un tapón volcánico extinto de 700 millones de años que domina la ciudad. Custodia las Joyas de la Corona escocesa (los Honores de Escocia) y la milenaria Piedra del Destino.',
  ARRAY['Ver el disparo tradicional del cañón de la una en punto (One O''Clock Gun) que se realiza desde 1861 (Entrada: £19.50)', 'Ver la mítica Piedra de Scone sobre la que eran coronados los reyes escoceses (Gratis con entrada)', 'Subir a Calton Hill al atardecer para la postal panorámica clásica con el monumento a Dugald Stewart (Gratis)']::text[],
  ARRAY['Reservar el boleto online del castillo con antelación porque suele agotarse en verano']::text[],
  ARRAY['El castillo de Edimburgo ostenta el récord de haber sido el lugar más asediado militarmente de Gran Bretaña con 26 asedios documentados en su historia']::text[],
  '{"address":"Castlehill, Edinburgh EH1 2NG","priceRange":"$$ - Entrada £19.50","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Ver el disparo tradicional del cañón de la una en punto (One O''Clock Gun) que se realiza desde 1861 (Entrada: £19.50)","Ver la mítica Piedra de Scone sobre la que eran coronados los reyes escoceses (Gratis con entrada)","Subir a Calton Hill al atardecer para la postal panorámica clásica con el monumento a Dugald Stewart (Gratis)"],"datos_curiosos":["El castillo de Edimburgo ostenta el récord de haber sido el lugar más asediado militarmente de Gran Bretaña con 26 asedios documentados en su historia"],"consejos":["Reservar el boleto online del castillo con antelación porque suele agotarse en verano"],"location_info":{"address":"Castlehill, Edinburgh EH1 2NG","priceRange":"$$ - Entrada £19.50","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '97ec8d6b-fb7a-73a4-fb31-a4d18a2a4c38',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  6,
  'Día 6: Hacia las Highlands: El Valle Sagrado de Glen Coe',
  'Las montañas volcánicas más dramáticas y cinematográficas de Escocia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '395f1969-1dc5-38c5-85cc-e61d89901b25',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '97ec8d6b-fb7a-73a4-fb31-a4d18a2a4c38',
  6,
  6,
  'Valle de Glen Coe y las Tres Hermanas (Three Sisters)',
  56.6826,
  -5.1023,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Un valle glaciar colosal esculpido por erupciones volcánicas y glaciares. Escenario de películas como James Bond (*Skyfall*) y *Harry Potter*. Las Tres Hermanas son tres imponentes crestas rocosas que caen a plomo sobre el valle.',
  ARRAY['Parada fotográfica en el mirador de las Three Sisters (Gratis)', 'Caminata corta por los senderos de turba y cascadas de montaña (Gratis)', 'Degustación de whisky escocés de malta en una destilería de montaña (£8 - £15)']::text[],
  ARRAY['Llevar calzado impermeable de trekking; el suelo de turba en las Highlands siempre está húmedo']::text[],
  ARRAY['Glen Coe fue escenario de la trágica Masacre de Glencoe de 1692, donde el clan Campbell traicionó y asesinó a sus anfitriones del clan MacDonald']::text[],
  '{"address":"Glen Coe, Ballachulish","priceRange":"$ - Acceso libre","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Parada fotográfica en el mirador de las Three Sisters (Gratis)","Caminata corta por los senderos de turba y cascadas de montaña (Gratis)","Degustación de whisky escocés de malta en una destilería de montaña (£8 - £15)"],"datos_curiosos":["Glen Coe fue escenario de la trágica Masacre de Glencoe de 1692, donde el clan Campbell traicionó y asesinó a sus anfitriones del clan MacDonald"],"consejos":["Llevar calzado impermeable de trekking; el suelo de turba en las Highlands siempre está húmedo"],"location_info":{"address":"Glen Coe, Ballachulish","priceRange":"$ - Acceso libre","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3c4c6f98-a333-43fd-2c11-0f9ea654a30f',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  7,
  'Día 7: El Mítico Lago Ness y el Castillo de Urquhart',
  'Las ruinas de la fortaleza frente a las aguas oscuras y la leyenda de Nessie.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4a498209-03ac-5109-1a87-207e6c59de79',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '3c4c6f98-a333-43fd-2c11-0f9ea654a30f',
  7,
  7,
  'Loch Ness y Castillo de Urquhart',
  57.3241,
  -4.4423,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'El lago de agua dulce con mayor volumen de las islas británicas (contiene más agua que todos los lagos de Inglaterra y Gales juntos). En un promontorio sobre sus oscuras aguas de turba se alzan las ruinas del castillo medieval de Urquhart.',
  ARRAY['Paseo en barco con sonar de detección submarina por el lago (£16 - £25)', 'Explorar la torre de cinco pisos del Castillo de Urquhart (Entrada: £13)', 'Visita al Loch Ness Centre & Exhibition para conocer la leyenda del monstruo (£9)']::text[],
  ARRAY['El agua del lago es negra como el café debido al alto contenido de turba en suspensión']::text[],
  ARRAY['La primera mención escrita sobre un monstruo en el lago data del año 565 d.C. en la biografía de San Columba']::text[],
  '{"address":"Drumnadrochit, Inverness","priceRange":"$$ - Castillo y barco","dia":7,"day":7}'::jsonb,
  240,
  '{"dia":7,"day":7,"activities":["Paseo en barco con sonar de detección submarina por el lago (£16 - £25)","Explorar la torre de cinco pisos del Castillo de Urquhart (Entrada: £13)","Visita al Loch Ness Centre & Exhibition para conocer la leyenda del monstruo (£9)"],"datos_curiosos":["La primera mención escrita sobre un monstruo en el lago data del año 565 d.C. en la biografía de San Columba"],"consejos":["El agua del lago es negra como el café debido al alto contenido de turba en suspensión"],"location_info":{"address":"Drumnadrochit, Inverness","priceRange":"$$ - Castillo y barco","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a3486254-ccd9-87c5-a7f9-fc9a0a52193c',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  8,
  'Día 8: Viaducto de Glenfinnan: El Tren de Harry Potter',
  'El tren a vapor Jacobite cruzando el colosal viaducto de 21 arcos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '641e4a23-d9e0-85c7-c545-ce2f2cbb6e77',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  'a3486254-ccd9-87c5-a7f9-fc9a0a52193c',
  8,
  8,
  'Viaducto de Glenfinnan y Monumento Jacobita',
  56.8763,
  -5.4316,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Impresionante viaducto ferroviario curvo de hormigón de 21 arcos construido en 1901. Famoso en todo el mundo por las películas de Harry Potter, donde el Expreso de Hogwarts lo cruza rodeado de lagos y montañas.',
  ARRAY['Subir al sendero mirador de la colina para ver pasar el tren a vapor Jacobite soltando humo blanco (Gratis - pasa sobre las 10:45 AM y 3:15 PM)', 'Visitar el monumento a la rebelión jacobita de Bonnie Prince Charlie a orillas del Loch Shiel (Gratis)', 'Tomar té con scones en el antiguo vagón restaurante de la estación (£7)']::text[],
  ARRAY['Llegar al sendero mirador al menos 40 minutos antes del paso del tren para encontrar buen sitio']::text[],
  ARRAY['El viaducto fue uno de los primeros del mundo construidos enteramente con hormigón en masa sin refuerzo de varillas de acero']::text[],
  '{"address":"Glenfinnan, Highland PH37 4LT","priceRange":"$ - Mirador gratuito","dia":8,"day":8}'::jsonb,
  180,
  '{"dia":8,"day":8,"activities":["Subir al sendero mirador de la colina para ver pasar el tren a vapor Jacobite soltando humo blanco (Gratis - pasa sobre las 10:45 AM y 3:15 PM)","Visitar el monumento a la rebelión jacobita de Bonnie Prince Charlie a orillas del Loch Shiel (Gratis)","Tomar té con scones en el antiguo vagón restaurante de la estación (£7)"],"datos_curiosos":["El viaducto fue uno de los primeros del mundo construidos enteramente con hormigón en masa sin refuerzo de varillas de acero"],"consejos":["Llegar al sendero mirador al menos 40 minutos antes del paso del tren para encontrar buen sitio"],"location_info":{"address":"Glenfinnan, Highland PH37 4LT","priceRange":"$ - Mirador gratuito","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'acc774f6-d766-9b89-3860-b15226798a54',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  9,
  'Día 9: Castillo de Stirling: El Corazón de William Wallace',
  'La llave de Escocia donde se forjó la leyenda de Braveheart.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0ba9da8e-adec-20ed-b041-ec4873eac07a',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  'acc774f6-d766-9b89-3860-b15226798a54',
  9,
  9,
  'Castillo de Stirling y Monumento a William Wallace',
  56.1235,
  -3.946,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Palacio fortaleza donde fue coronada la reina María Estuardo de Escocia. Emplazado sobre un risco volcánico inexpugnable que controla el cruce del río Forth. Cerca se alza la torre neogótica en memoria del héroe William Wallace.',
  ARRAY['Recorrido por el Gran Salón Dorado y los aposentos reales renacentistas (Entrada: £16.50)', 'Ver la enorme espada de combate de 1.68 metros atribuida a William Wallace en su monumento (£10.50)', 'Almuerzo tradicional en una taberna histórica de Stirling (£15)']::text[],
  ARRAY['Stirling queda a medio camino entre las Highlands y Edimburgo, siendo parada obligada']::text[],
  ARRAY['En la batalla del Puente de Stirling de 1297, William Wallace derrotó a un ejército inglés muy superior aprovechando el estrecho paso de madera del puente']::text[],
  '{"address":"Castle Wynd, Stirling FK8 1EJ","priceRange":"$$ - Entrada castillo","dia":9,"day":9}'::jsonb,
  200,
  '{"dia":9,"day":9,"activities":["Recorrido por el Gran Salón Dorado y los aposentos reales renacentistas (Entrada: £16.50)","Ver la enorme espada de combate de 1.68 metros atribuida a William Wallace en su monumento (£10.50)","Almuerzo tradicional en una taberna histórica de Stirling (£15)"],"datos_curiosos":["En la batalla del Puente de Stirling de 1297, William Wallace derrotó a un ejército inglés muy superior aprovechando el estrecho paso de madera del puente"],"consejos":["Stirling queda a medio camino entre las Highlands y Edimburgo, siendo parada obligada"],"location_info":{"address":"Castle Wynd, Stirling FK8 1EJ","priceRange":"$$ - Entrada castillo","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '270c162b-3c4e-2706-4357-92a0de4eb645',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  10,
  'Día 10: Retorno a Edimburgo / Londres y Despedida Británica',
  'Últimas compras de tartán de cachemira y té tradicional antes del vuelo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7a1fb5ac-13f2-de73-0ca7-fdae22a7a274',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '270c162b-3c4e-2706-4357-92a0de4eb645',
  10,
  10,
  'Princes Street Gardens y Despedida',
  55.95,
  -3.2,
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80']::text[],
  'Jardines victorianos que separan la Ciudad Vieja de la Ciudad Nueva con vista directa a la muralla del castillo. El lugar ideal para pasear antes de tomar el tranvía hacia el aeropuerto.',
  ARRAY['Comprar bufandas de lana pura de cordero o cachemira con tartán de clan (£20 - £45)', 'Tomar el té de la tarde inglés (Afternoon Tea) con sándwiches y pastas (£22 - £35)', 'Tranvía directo al aeropuerto de Edimburgo (£7.50 / 30 minutos)']::text[],
  ARRAY['Conservar los comprobantes de compra si aplica a devolución de impuestos']::text[],
  ARRAY['Donde hoy están los tranquilos jardines de Princes Street existió antiguamente el Nor Loch, un lago pantanoso artificial usado como foso defensivo']::text[],
  '{"address":"Princes St, Edinburgh","priceRange":"$ - Compras locales","dia":10,"day":10}'::jsonb,
  120,
  '{"dia":10,"day":10,"activities":["Comprar bufandas de lana pura de cordero o cachemira con tartán de clan (£20 - £45)","Tomar el té de la tarde inglés (Afternoon Tea) con sándwiches y pastas (£22 - £35)","Tranvía directo al aeropuerto de Edimburgo (£7.50 / 30 minutos)"],"datos_curiosos":["Donde hoy están los tranquilos jardines de Princes Street existió antiguamente el Nor Loch, un lago pantanoso artificial usado como foso defensivo"],"consejos":["Conservar los comprobantes de compra si aplica a devolución de impuestos"],"location_info":{"address":"Princes St, Edinburgh","priceRange":"$ - Compras locales","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'b2b9f28b-a7e8-3cfa-04de-0e8cf453d100',
  'cf3871be-e96e-0355-95ec-267ee24beb00',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Gran España Monumental: De Madrid a Andalucía y el Genio de Gaudí (Madrid, España)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-la-gran-espana-madrid-andalucia-barcelona-12d',
  'La Gran España Monumental: De Madrid a Andalucía y el Genio de Gaudí',
  'España',
  'Madrid',
  'cultural',
  'La gran travesía española de 12 días en trenes de alta velocidad AVE. El Madrid de los Austrias y el Museo del Prado, la ciudad de las tres culturas en Toledo, el duende del flamenco y la Giralda en Sevilla, la magia nazarí de la Alhambra de Granada y la culminación modernista de la Sagrada Familia de Gaudí en Barcelona.',
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80']::text[],
  17280,
  1400000,
  'moderate',
  'es',
  4.99,
  290,
  940,
  ARRAY['España', 'Madrid', 'Toledo', 'Sevilla', 'Granada', 'Alhambra', 'Barcelona', 'Sagrada Familia', 'AVE']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":900,"estimatedPerPersonMax":1900,"notes":"Museo del Prado, Alhambra (€19), Sagrada Familia (€26), trenes AVE y gastronomía de tapas"}'::jsonb,
  ARRAY['Viajeros culturales', 'Amantes de la gastronomía y el vino', 'Exploradores del patrimonio']::text[],
  'Marzo a Junio y Septiembre a Noviembre (clima primaveral idóneo para Andalucía)',
  'Tours matutinos de palacios y tarde/noche de tapeo y tablaos de flamenco',
  'Puerta del Sol (Kilómetro Cero), Madrid',
  ARRAY['Ruta completa conectada por trenes AVE de Renfe', 'Ubicación de monumentos y taquillas oficiales', 'Guía de barrios de tapeo tradicional']::text[],
  ARRAY['Boleto oficial a la Alhambra de Granada (reserva indispensable)', 'Entrada a la Sagrada Familia de Barcelona', 'Billetes de tren AVE']::text[],
  ARRAY['Comprar la entrada a la Alhambra con 2 meses de anticipación; las entradas a los Palacios Nazaríes son nominativas con DNI/pasaporte', 'Disfrutar del rito del tapeo: pedir una caña o vino y disfrutar de la tapa']::text[],
  ARRAY['Calzado cómodo para empedrado y cuestas', 'Gorra y gafas de sol', 'Pasaporte físico original para ingresar a la Alhambra']::text[],
  ARRAY['Cumplir estrictamente el horario de media hora asignado para entrar a los Palacios Nazaríes en Granada']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0a37e835-a92e-aa8d-b1e5-83780a09c2fc',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  1,
  'Día 1: El Madrid de los Austrias: Plaza Mayor y Palacio Real',
  'El corazón castizo y el palacio real más grande de Europa Occidental.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fbe2500a-0666-d4a9-7d25-e6e451d1edc4',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  '0a37e835-a92e-aa8d-b1e5-83780a09c2fc',
  1,
  1,
  'Plaza Mayor, Puerta del Sol y Palacio Real de Madrid',
  40.4155,
  -3.7074,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'La histórica Plaza Mayor porticada con la estatua ecuestre de Felipe III, la Puerta del Sol con el Oso y el Madroño, y el monumental Palacio Real con más de 3.400 estancias suntuosas de la corte española.',
  ARRAY['Foto en el Kilómetro Cero de las carreteras radiales de España en Puerta del Sol (Gratis)', 'Visita a los salones oficiales, Salón del Trono y Real Armería del Palacio Real (Entrada: €14)', 'Probar el castizo bocadillo de calamares con una caña bien tirada en la Plaza Mayor (€4.50)']::text[],
  ARRAY['La chocolatería San Ginés de 1894 queda a 2 minutos de la plaza; abierta 24 horas para churros con chocolate caliente']::text[],
  ARRAY['El Palacio Real de Madrid duplica en superficie al Palacio de Versalles o al de Buckingham, siendo el mayor palacio real en funcionamiento de Europa']::text[],
  '{"address":"Calle de Bailén s/n, Madrid","priceRange":"$ - Entrada palacio €14","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Foto en el Kilómetro Cero de las carreteras radiales de España en Puerta del Sol (Gratis)","Visita a los salones oficiales, Salón del Trono y Real Armería del Palacio Real (Entrada: €14)","Probar el castizo bocadillo de calamares con una caña bien tirada en la Plaza Mayor (€4.50)"],"datos_curiosos":["El Palacio Real de Madrid duplica en superficie al Palacio de Versalles o al de Buckingham, siendo el mayor palacio real en funcionamiento de Europa"],"consejos":["La chocolatería San Ginés de 1894 queda a 2 minutos de la plaza; abierta 24 horas para churros con chocolate caliente"],"location_info":{"address":"Calle de Bailén s/n, Madrid","priceRange":"$ - Entrada palacio €14","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ddb28540-3e89-8f30-214a-e7f976ba15a1',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  2,
  'Día 2: El Triángulo del Arte: Museo del Prado y Parque del Retiro',
  'Las Meninas de Velázquez, Goya, el Jardín de las Delicias y el Palacio de Cristal.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '293ca3e9-44de-d942-a88b-65c1f5a68369',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'ddb28540-3e89-8f30-214a-e7f976ba15a1',
  2,
  2,
  'Museo Nacional del Prado y Parque de El Retiro',
  40.4138,
  -3.6921,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las pinacotecas más sublimes del planeta (Paisaje de la Luz, UNESCO). Custodia obras cumbres como "Las Meninas" de Velázquez, las Pinturas Negras de Goya y el tríptico de El Bosco. Al lado, el señorial Parque del Retiro con su estanque y Palacio de Cristal.',
  ARRAY['Admirar "Las Meninas" y "El 3 de mayo en Madrid" (Entrada general: €15 / gratis de lunes a sábado de 18:00 a 20:00)', 'Paseo en barca de remos por el estanque grande de El Retiro (€6 - €8)', 'Fotografiar el Palacio de Cristal rodeado de cipreses calvos en el agua (Gratis)']::text[],
  ARRAY['El Prado es inmenso; solicitar en la entrada el plano gratuito de las "50 obras maestras" para optimizar el recorrido']::text[],
  ARRAY['Durante la Guerra Civil española, las obras más valiosas del Prado fueron evacuadas en camiones protegidas con colchones hasta Ginebra para salvarlas de los bombardeos']::text[],
  '{"address":"Paseo del Prado s/n, Madrid","priceRange":"$$ - Entrada €15","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Admirar \"Las Meninas\" y \"El 3 de mayo en Madrid\" (Entrada general: €15 / gratis de lunes a sábado de 18:00 a 20:00)","Paseo en barca de remos por el estanque grande de El Retiro (€6 - €8)","Fotografiar el Palacio de Cristal rodeado de cipreses calvos en el agua (Gratis)"],"datos_curiosos":["Durante la Guerra Civil española, las obras más valiosas del Prado fueron evacuadas en camiones protegidas con colchones hasta Ginebra para salvarlas de los bombardeos"],"consejos":["El Prado es inmenso; solicitar en la entrada el plano gratuito de las \"50 obras maestras\" para optimizar el recorrido"],"location_info":{"address":"Paseo del Prado s/n, Madrid","priceRange":"$$ - Entrada €15","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '78bfe8a4-517d-96dd-31f9-6930705e137f',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  3,
  'Día 3: Toledo: La Ciudad Imperial de las Tres Culturas',
  'Convivencia histórica de cristianos, musulmanes y judíos sobre el Tajo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a65deead-9444-5a07-0de4-f542558feab8',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  '78bfe8a4-517d-96dd-31f9-6930705e137f',
  3,
  3,
  'Catedral Primada de Toledo y Mirador del Valle',
  39.8571,
  -4.0244,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Antigua capital de España rodeada por un meandro del río Tajo. Su catedral gótica es una de las más ricas del orbe católico. Sus callejones empinados albergan sinagogas medievales, mezquitas califales y tiendas de espadas de acero toledano.',
  ARRAY['Tren Avant de alta velocidad desde Madrid Atocha a Toledo (33 minutos - €14 ida)', 'Visita a la Catedral Primada y su sacristía con cuadros originales de El Greco (Entrada: €10)', 'Vista panorámica inolvidable de la ciudad amurallada desde el Mirador del Valle (Gratis)']::text[],
  ARRAY['Tomar un taxi o el autobús turístico hasta el Mirador del Valle para la foto de postal completa de la ciudad sobre el río']::text[],
  ARRAY['Toledo fue el taller de armas blancas más reputado de Europa; el acero toledano era templado en las aguas del río Tajo con una técnica secreta legendaria']::text[],
  '{"address":"Plaza del Consistorio 1, Toledo","priceRange":"$$ - Tren Avant y catedral","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Tren Avant de alta velocidad desde Madrid Atocha a Toledo (33 minutos - €14 ida)","Visita a la Catedral Primada y su sacristía con cuadros originales de El Greco (Entrada: €10)","Vista panorámica inolvidable de la ciudad amurallada desde el Mirador del Valle (Gratis)"],"datos_curiosos":["Toledo fue el taller de armas blancas más reputado de Europa; el acero toledano era templado en las aguas del río Tajo con una técnica secreta legendaria"],"consejos":["Tomar un taxi o el autobús turístico hasta el Mirador del Valle para la foto de postal completa de la ciudad sobre el río"],"location_info":{"address":"Plaza del Consistorio 1, Toledo","priceRange":"$$ - Tren Avant y catedral","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c12fc01d-124d-4d27-ccf5-825230558e6e',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  4,
  'Día 4: AVE a Sevilla: La Giralda y el Real Alcázar',
  'Llegada a Andalucía: arte mudéjar, azulejos y palacios de reyes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5d247f3c-45c6-b696-43eb-61122eb4cf76',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'c12fc01d-124d-4d27-ccf5-825230558e6e',
  4,
  4,
  'Catedral de Sevilla, La Giralda y Real Alcázar',
  37.3858,
  -5.9931,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'El AVE conecta Madrid con Sevilla en solo 2 horas y 30 minutos. La Catedral de Sevilla es la catedral gótica más grande del mundo, con la tumba de Cristóbal Colón. La Giralda, antiguo alminar almohade, y el Real Alcázar con sus jardines y palacios de yeserías mudéjares.',
  ARRAY['Subir las 35 rampas de la Giralda para contemplar Sevilla a vista de pájaro (Entrada catedral + Giralda: €12)', 'Visitar el Palacio de Don Pedro I y los Baños de Doña María de Padilla en el Real Alcázar (€14.50)', 'Tardeo de tapas por el laberíntico Barrio de Santa Cruz: salmorejo, jamón ibérico de bellota y espinacas con garbanzos (€15 - €25)']::text[],
  ARRAY['La Giralda no tiene escalones sino rampas para que el sultán pudiera subir a caballo']::text[],
  ARRAY['El Real Alcázar es el palacio real en uso más antiguo de Europa y sirvió como los Jardines del Agua de Dorne en la serie *Juego de Tronos*']::text[],
  '{"address":"Patio de Banderas s/n, Sevilla","priceRange":"$$ - Entradas históricas","dia":4,"day":4}'::jsonb,
  270,
  '{"dia":4,"day":4,"activities":["Subir las 35 rampas de la Giralda para contemplar Sevilla a vista de pájaro (Entrada catedral + Giralda: €12)","Visitar el Palacio de Don Pedro I y los Baños de Doña María de Padilla en el Real Alcázar (€14.50)","Tardeo de tapas por el laberíntico Barrio de Santa Cruz: salmorejo, jamón ibérico de bellota y espinacas con garbanzos (€15 - €25)"],"datos_curiosos":["El Real Alcázar es el palacio real en uso más antiguo de Europa y sirvió como los Jardines del Agua de Dorne en la serie *Juego de Tronos*"],"consejos":["La Giralda no tiene escalones sino rampas para que el sultán pudiera subir a caballo"],"location_info":{"address":"Patio de Banderas s/n, Sevilla","priceRange":"$$ - Entradas históricas","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'dc2db9f8-fae6-17ff-5c20-787fe1d231ad',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  5,
  'Día 5: Plaza de España, Parque de María Luisa y Noche de Flamenco',
  'El monumento regionalista más grandioso de España y el duende gitano en Triana.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8db79ae8-3979-7336-0d55-3d679ffb5048',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'dc2db9f8-fae6-17ff-5c20-787fe1d231ad',
  5,
  5,
  'Plaza de España y Tablao Flamenco en Triana',
  37.3772,
  -5.9869,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra maestra de Aníbal González para la Exposición Iberoamericana de 1929 con 50.000 m² de arquerías semicirculares, azulejos de todas las provincias de España y un canal navegable con 4 puentes de cerámica.',
  ARRAY['Alquilar una barquita de remos en el canal de la Plaza de España (€6)', 'Fotografiar los bancos de azulejos de cerámica de su provincia favorita (Gratis)', 'Espectáculo de flamenco auténtico en vivo con cante jondo y baile en Triana (€25 - €40)']::text[],
  ARRAY['La Plaza de España apareció en películas como *Star Wars: El Ataque de los Clones* como el palacio del planeta Naboo']::text[],
  ARRAY['Los cuatro puentes que cruzan el canal representan los cuatro antiguos reinos que formaron la Corona de España: Castilla, León, Aragón y Navarra']::text[],
  '{"address":"Avenida de Isabel la Católica, Sevilla","priceRange":"$$ - Acceso plaza libre + tablao","dia":5,"day":5}'::jsonb,
  210,
  '{"dia":5,"day":5,"activities":["Alquilar una barquita de remos en el canal de la Plaza de España (€6)","Fotografiar los bancos de azulejos de cerámica de su provincia favorita (Gratis)","Espectáculo de flamenco auténtico en vivo con cante jondo y baile en Triana (€25 - €40)"],"datos_curiosos":["Los cuatro puentes que cruzan el canal representan los cuatro antiguos reinos que formaron la Corona de España: Castilla, León, Aragón y Navarra"],"consejos":["La Plaza de España apareció en películas como *Star Wars: El Ataque de los Clones* como el palacio del planeta Naboo"],"location_info":{"address":"Avenida de Isabel la Católica, Sevilla","priceRange":"$$ - Acceso plaza libre + tablao","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f6ce4cc7-0ddc-3db7-bec5-2911447a1ce7',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  6,
  'Día 6: Hacia Granada: La Magia Nazarí de la Alhambra',
  'El Patio de los Leones, el Generalife y las celosías del reino nazarí.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0f6c841c-f437-ea7a-7fed-85c5f4043cdf',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'f6ce4cc7-0ddc-3db7-bec5-2911447a1ce7',
  6,
  6,
  'La Alhambra de Granada y Palacios Nazaríes',
  37.1773,
  -3.5897,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'El palacio fortaleza hispanomusulmán más hermoso del mundo erigido sobre la colina de la Sabika frente a las cumbres nevadas de Sierra Nevada. Destaca el Patio de los Leones, el Salón de Embajadores con techos de mocárabes y los jardines del Generalife.',
  ARRAY['Recorrido por los Palacios Nazaríes respetando la franja horaria impresa en el boleto (Entrada general: €19.09)', 'Pasear entre las fuentes y cipreses del Generalife (Gratis con entrada)', 'Subir a la Torre de la Vela en la Alcazaba militar para vista panorámica del Albaicín']::text[],
  ARRAY['Llevar el pasaporte o documento de identidad físico original; se escanea en varios puntos de acceso interno del recinto']::text[],
  ARRAY['Las inscripciones caligráficas en árabe grabadas en los muros de yeso repiten miles de veces la frase: *Wa-la galiba illa-Llah* ("No hay vencedor sino Alá")']::text[],
  '{"address":"Calle Real de la Alhambra s/n, Granada","priceRange":"$$ - Entrada oficial €19","dia":6,"day":6}'::jsonb,
  270,
  '{"dia":6,"day":6,"activities":["Recorrido por los Palacios Nazaríes respetando la franja horaria impresa en el boleto (Entrada general: €19.09)","Pasear entre las fuentes y cipreses del Generalife (Gratis con entrada)","Subir a la Torre de la Vela en la Alcazaba militar para vista panorámica del Albaicín"],"datos_curiosos":["Las inscripciones caligráficas en árabe grabadas en los muros de yeso repiten miles de veces la frase: *Wa-la galiba illa-Llah* (\"No hay vencedor sino Alá\")"],"consejos":["Llevar el pasaporte o documento de identidad físico original; se escanea en varios puntos de acceso interno del recinto"],"location_info":{"address":"Calle Real de la Alhambra s/n, Granada","priceRange":"$$ - Entrada oficial €19","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b4c622f4-0d35-ad1e-186c-dfae4a5ab20f',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  7,
  'Día 7: El Albaicín, Mirador de San Nicolás y Tradición de Tapas',
  'El atardecer más famoso del mundo y tapas gratis con cada consumición.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1094e4a4-c38e-1d32-984e-3075f48f8159',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'b4c622f4-0d35-ad1e-186c-dfae4a5ab20f',
  7,
  7,
  'Mirador de San Nicolás y Barrio del Albaicín',
  37.1811,
  -3.5927,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Antiguo barrio musulmán de casas blancas con jardines interiores (*cármenes*), aljibes y olor a jazmín. El mirador de San Nicolás ofrece la postal legendaria de la Alhambra con el telón de fondo de Sierra Nevada.',
  ARRAY['Ver ponerse el sol tiñendo de rojo las murallas de la Alhambra mientras tocan guitarra flamenca (Gratis)', 'Ruta de tapas por Calle Navas o Calle Elvira (en Granada la tapa es gratuita y generosa con cada bebida: €2.80 - €3.50)', 'Tomar un té moruno con hierbabuena y dulces árabes en las teterías de Calderería Nueva (€4 - €7)']::text[],
  ARRAY['Bill Clinton declaró en 1997 en San Nicolás que era "la puesta de sol más hermosa del mundo"']::text[],
  ARRAY['Granada es una de las pocas ciudades de España donde por ley tradicional cada caña o copa incluye obligatoriamente una tapa caliente gratis a elección']::text[],
  '{"address":"Plaza Mirador de San Nicolás, Granada","priceRange":"$ - Acceso libre","dia":7,"day":7}'::jsonb,
  210,
  '{"dia":7,"day":7,"activities":["Ver ponerse el sol tiñendo de rojo las murallas de la Alhambra mientras tocan guitarra flamenca (Gratis)","Ruta de tapas por Calle Navas o Calle Elvira (en Granada la tapa es gratuita y generosa con cada bebida: €2.80 - €3.50)","Tomar un té moruno con hierbabuena y dulces árabes en las teterías de Calderería Nueva (€4 - €7)"],"datos_curiosos":["Granada es una de las pocas ciudades de España donde por ley tradicional cada caña o copa incluye obligatoriamente una tapa caliente gratis a elección"],"consejos":["Bill Clinton declaró en 1997 en San Nicolás que era \"la puesta de sol más hermosa del mundo\""],"location_info":{"address":"Plaza Mirador de San Nicolás, Granada","priceRange":"$ - Acceso libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e81b7dfc-1a9c-6c52-0c63-ed3ab62da612',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  8,
  'Día 8: Mezquita-Catedral de Córdoba y AVE a Barcelona',
  'El bosque de 850 columnas bicolores y viaje en alta velocidad a Cataluña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a63fe8a1-1cd4-8082-7510-8d0ebebe178f',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'e81b7dfc-1a9c-6c52-0c63-ed3ab62da612',
  8,
  8,
  'Mezquita-Catedral de Córdoba y Calleja de las Flores',
  37.8789,
  -4.7794,
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80']::text[],
  'Parada en la joya del Califato omeya. Un laberinto sagrado de más de 850 columnas de jaspe, granito y mármol unidas por arcos dobles de herradura bicolores rojo y blanco, en cuyo centro se levantó la catedral renacentista.',
  ARRAY['Perderse en el bosque de columnas y admirar el Mihrab dorado califal (Entrada: €13)', 'Fotografiar la torre campanario enmarcada por geranios en la Calleja de las Flores (Gratis)', 'Tren AVE directo desde Córdoba a Barcelona Sants (4 horas y 40 minutos en alta velocidad cruzando media España - €45 - €85)']::text[],
  ARRAY['Dejar el equipaje en las consignas de la estación de tren de Córdoba mientras se visita la mezquita (a 15 minutos a pie)']::text[],
  ARRAY['El emperador Carlos V, al ver la catedral construida dentro de la mezquita, exclamó: "Habéis destruido lo que era único en el mundo para construir lo que se puede ver en cualquier parte"']::text[],
  '{"address":"Calle del Cardenal Herrero 1, Córdoba","priceRange":"$$ - Entrada mezquita y AVE","dia":8,"day":8}'::jsonb,
  240,
  '{"dia":8,"day":8,"activities":["Perderse en el bosque de columnas y admirar el Mihrab dorado califal (Entrada: €13)","Fotografiar la torre campanario enmarcada por geranios en la Calleja de las Flores (Gratis)","Tren AVE directo desde Córdoba a Barcelona Sants (4 horas y 40 minutos en alta velocidad cruzando media España - €45 - €85)"],"datos_curiosos":["El emperador Carlos V, al ver la catedral construida dentro de la mezquita, exclamó: \"Habéis destruido lo que era único en el mundo para construir lo que se puede ver en cualquier parte\""],"consejos":["Dejar el equipaje en las consignas de la estación de tren de Córdoba mientras se visita la mezquita (a 15 minutos a pie)"],"location_info":{"address":"Calle del Cardenal Herrero 1, Córdoba","priceRange":"$$ - Entrada mezquita y AVE","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '154a1fa7-ce1a-d8c8-f425-31274074bad3',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  9,
  'Día 9: Barcelona de Gaudí: La Sagrada Familia y Paseo de Gracia',
  'El templo expiatorio que toca el cielo y las casas modernistas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a6ccd06d-3a35-f513-b781-bbcf7f6a816d',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  '154a1fa7-ce1a-d8c8-f425-31274074bad3',
  9,
  9,
  'Basílica de la Sagrada Familia, Casa Batlló y La Pedrera',
  41.4036,
  2.1744,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'La obra cumbre inacabada de Antoni Gaudí iniciada en 1882. Su interior es un bosque de columnas ramificadas como árboles de piedra con vitrales que inundan el espacio de luz arcoíris. En el Paseo de Gracia, la Casa Batlló con su tejado de dragón y Casa Milà (La Pedrera).',
  ARRAY['Visitar el interior de la Sagrada Familia y sus torres (Entrada con audioguía: €26 / con torres: €36)', 'Fotografiar las fachadas onduladas de Casa Batlló y La Pedrera en Paseo de Gracia (Gratis exterior)', 'Probar pan con tomate (pa amb tomàquet) y embutidos ibéricos en una bodega modernista (€15 - €25)']::text[],
  ARRAY['Comprar la entrada a la Sagrada Familia con semanas de anticipación en la app oficial; no hay taquillas de venta en el templo']::text[],
  ARRAY['Gaudí sabía que no vería terminada la basílica en vida y solía decir: "Mi cliente (Dios) no tiene prisa"']::text[],
  '{"address":"Carrer de Mallorca 401, Barcelona","priceRange":"$$$ - Entrada €26","dia":9,"day":9}'::jsonb,
  270,
  '{"dia":9,"day":9,"activities":["Visitar el interior de la Sagrada Familia y sus torres (Entrada con audioguía: €26 / con torres: €36)","Fotografiar las fachadas onduladas de Casa Batlló y La Pedrera en Paseo de Gracia (Gratis exterior)","Probar pan con tomate (pa amb tomàquet) y embutidos ibéricos en una bodega modernista (€15 - €25)"],"datos_curiosos":["Gaudí sabía que no vería terminada la basílica en vida y solía decir: \"Mi cliente (Dios) no tiene prisa\""],"consejos":["Comprar la entrada a la Sagrada Familia con semanas de anticipación en la app oficial; no hay taquillas de venta en el templo"],"location_info":{"address":"Carrer de Mallorca 401, Barcelona","priceRange":"$$$ - Entrada €26","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'aee6a887-b24d-6386-2b42-40fe8d90d294',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  10,
  'Día 10: Park Güell y Vistas del Mediterráneo',
  'El dragón de trencadís y el mirador ondulado sobre toda Barcelona.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '8feb6a09-bcb6-38ac-6356-ee2a66e880a4',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'aee6a887-b24d-6386-2b42-40fe8d90d294',
  10,
  10,
  'Park Güell y el Dragón de Mosaicos',
  41.4145,
  2.1527,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Parque público monumental donde la naturaleza y la arquitectura orgánica de Gaudí se funden. La escalinata con la famosa salamandra (*El Drac*) hecha de fragmentos de cerámica rota (*trencadís*) y el banco ondulado panorámico con vista a la ciudad y el mar.',
  ARRAY['Foto con la salamandra de mosaicos en la escalinata principal (Entrada zona monumental: €10)', 'Sentarse en el banco ergonómico ondulado de la Plaza de la Naturaleza (Gratis con entrada)', 'Pasear por el viaducto de columnas inclinadas de piedra natural (Gratis con entrada)']::text[],
  ARRAY['Llegar en metro L3 (estación Lesseps o Vallcarca) y subir las escaleras mecánicas hacia el parque']::text[],
  ARRAY['Originalmente el proyecto estaba planeado como una urbanización privada residencial de lujo para la burguesía catalana, pero fracasó comercialmente y se convirtió en parque público']::text[],
  '{"address":"08024 Barcelona","priceRange":"$ - Entrada €10","dia":10,"day":10}'::jsonb,
  180,
  '{"dia":10,"day":10,"activities":["Foto con la salamandra de mosaicos en la escalinata principal (Entrada zona monumental: €10)","Sentarse en el banco ergonómico ondulado de la Plaza de la Naturaleza (Gratis con entrada)","Pasear por el viaducto de columnas inclinadas de piedra natural (Gratis con entrada)"],"datos_curiosos":["Originalmente el proyecto estaba planeado como una urbanización privada residencial de lujo para la burguesía catalana, pero fracasó comercialmente y se convirtió en parque público"],"consejos":["Llegar en metro L3 (estación Lesseps o Vallcarca) y subir las escaleras mecánicas hacia el parque"],"location_info":{"address":"08024 Barcelona","priceRange":"$ - Entrada €10","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'bd8226e7-7360-7db7-a43c-3b5848b0a440',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  11,
  'Día 11: Barrio Gótico, El Born y el Mercado de La Boquería',
  'Callejuelas medievales, restos romanos y el templo gastronómico de Las Ramblas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e0bb250b-c11f-3973-cc62-0211f9bad237',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'bd8226e7-7360-7db7-a43c-3b5848b0a440',
  11,
  11,
  'Barrio Gótico, Catedral de Santa Eulalia y Mercado de la Boquería',
  41.3833,
  2.175,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'El núcleo más antiguo de Barcelona con restos de murallas romanas y palacios góticos como la Plaza del Rey. Al cruzar Las Ramblas se accede a La Boquería, célebre mercado de mariscos frescos, jamones y zumos exóticos.',
  ARRAY['Caminar por el Puente del Obispo en la calle del Bisbe y buscar la calavera esculpida (Gratis)', 'Visitar el claustro de la Catedral de Barcelona con sus 13 ocas blancas sagradas (€9)', 'Probar tapas de mariscos al momento en los bares de taburete de La Boquería (€18 - €30)']::text[],
  ARRAY['Cuidar bolsos y móviles en Las Ramblas y zonas concurridas de La Boquería']::text[],
  ARRAY['Las 13 ocas del claustro de la catedral conmemoran los 13 años que tenía la patrona Santa Eulalia cuando fue martirizada']::text[],
  '{"address":"La Rambla 91 / Pla de la Seu, Barcelona","priceRange":"$$ - Moderado","dia":11,"day":11}'::jsonb,
  210,
  '{"dia":11,"day":11,"activities":["Caminar por el Puente del Obispo en la calle del Bisbe y buscar la calavera esculpida (Gratis)","Visitar el claustro de la Catedral de Barcelona con sus 13 ocas blancas sagradas (€9)","Probar tapas de mariscos al momento en los bares de taburete de La Boquería (€18 - €30)"],"datos_curiosos":["Las 13 ocas del claustro de la catedral conmemoran los 13 años que tenía la patrona Santa Eulalia cuando fue martirizada"],"consejos":["Cuidar bolsos y móviles en Las Ramblas y zonas concurridas de La Boquería"],"location_info":{"address":"La Rambla 91 / Pla de la Seu, Barcelona","priceRange":"$$ - Moderado","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f14d4bad-24f2-fbdd-6abc-d1a4c1298f5b',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  12,
  'Día 12: Playas de la Barceloneta y Despedida Mediterránea',
  'Paseo marítimo, arroz marinero frente al mar y traslado al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b50eeb95-889c-24d1-7e22-01049e5857c9',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  'f14d4bad-24f2-fbdd-6abc-d1a4c1298f5b',
  12,
  12,
  'Paseo Marítimo de la Barceloneta y Hotel W',
  41.378,
  2.192,
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80']::text[],
  'Antiguo barrio marinero con playas urbanas de arena dorada, esculturas públicas frente al mar y restaurantes donde saborear una auténtica paella de mariscos con sangría.',
  ARRAY['Paseo a pie o en bicicleta por el paseo marítimo hasta la torre en forma de vela del Hotel W (Gratis)', 'Almuerzo de despedida: paella marinera con gambas y mejillones (€22 - €35)', 'Tomar el tren Aeroport R2 Nord desde Passeig de Gràcia o Aerobús hacia la T1/T2 (€6.75)']::text[],
  ARRAY['El Aerobús sale cada 5 minutos desde Plaza Cataluña y llega al aeropuerto El Prat en 35 minutos']::text[],
  ARRAY['Las playas de Barcelona no existían como tales hasta antes de los Juegos Olímpicos de 1992, cuando la ciudad derribó viejas naves industriales para abrirse completamente al mar']::text[],
  '{"address":"Passeig Marítim de la Barceloneta","priceRange":"$$ - Almuerzo paella","dia":12,"day":12}'::jsonb,
  150,
  '{"dia":12,"day":12,"activities":["Paseo a pie o en bicicleta por el paseo marítimo hasta la torre en forma de vela del Hotel W (Gratis)","Almuerzo de despedida: paella marinera con gambas y mejillones (€22 - €35)","Tomar el tren Aeroport R2 Nord desde Passeig de Gràcia o Aerobús hacia la T1/T2 (€6.75)"],"datos_curiosos":["Las playas de Barcelona no existían como tales hasta antes de los Juegos Olímpicos de 1992, cuando la ciudad derribó viejas naves industriales para abrirse completamente al mar"],"consejos":["El Aerobús sale cada 5 minutos desde Plaza Cataluña y llega al aeropuerto El Prat en 35 minutos"],"location_info":{"address":"Passeig Marítim de la Barceloneta","priceRange":"$$ - Almuerzo paella","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '23bf4b17-e69f-5ee3-09ef-4524dc1f9875',
  '5c494fe7-38cd-d529-0804-66361a72c65d',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Dubái & Abu Dhabi de Vanguardia: Rascacielos Iluminados y Desierto (Dubái, Emiratos Árabes Unidos)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '2b35778f-e532-240f-7e7f-9661353ee469',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-dubai-abu-dhabi-nocturno-5d',
  'Dubái & Abu Dhabi de Vanguardia: Rascacielos Iluminados y Desierto',
  'Emiratos Árabes Unidos',
  'Dubái',
  'night',
  'Experiencia deslumbrante de 5 días en los Emiratos Árabes Unidos. Vistas desde el rascacielos más alto del planeta (Burj Khalifa), el espectáculo nocturno de fuentes danzantes, safari por las dunas al atardecer y la majestuosidad marmórea de la Mezquita Sheikh Zayed en Abu Dhabi.',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  7200,
  180000,
  'easy',
  'es',
  4.96,
  160,
  510,
  ARRAY['Dubái', 'Abu Dhabi', 'Burj Khalifa', 'Lujo', 'Nocturno', 'Rascacielos', 'Desierto']::text[],
  true,
  'approved',
  '{"currency":"AED","estimatedPerPersonMin":900,"estimatedPerPersonMax":2200,"notes":"Burj Khalifa (~179 AED), safari desierto (~180 AED), taxi/metro y cenas con vistas"}'::jsonb,
  ARRAY['Viajeros modernos', 'Amantes de la arquitectura futurista', 'Parejas']::text[],
  'Noviembre a Marzo (invierno árabe con agradables 22-28°C)',
  'Tardes y noches para aprovechar el encendido de luces y evitar el calor diurno',
  'Dubai Mall / Explanada del Burj Khalifa, Dubái',
  ARRAY['Ruta completa en Dubái y Abu Dhabi', 'Guía de observación de fuentes danzantes', 'Horarios de mezquitas y miradores']::text[],
  ARRAY['Boleto a la cima del Burj Khalifa (piso 124/125)', 'Safari en 4x4 por el desierto', 'Transporte privado']::text[],
  ARRAY['En la Mezquita de Abu Dhabi las mujeres deben llevar túnica abaya que cubra cabello, brazos y tobillos (se puede alquilar o comprar en el centro comercial de acceso)', 'Para el Burj Khalifa reservar horario de puesta de sol (5:00 PM) con semanas de antelación']::text[],
  ARRAY['Ropa elegante para la noche', 'Ropa respetuosa para templos', 'Gafas de sol', 'Cámara con buen rendimiento nocturno']::text[],
  ARRAY['Respetar las leyes locales sobre muestras públicas de afecto y consumo de alcohol en lugares autorizados']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2ea2ea84-4c59-ee29-aa96-6223149b8597',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  1,
  'Día 1: El Gigante del Mundo: Burj Khalifa y Fuentes de Dubái',
  'Ascenso al piso 124 a 452 metros y espectáculo de chorros de agua iluminados.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0132caf9-108c-d9aa-b0de-cbf826c47e0e',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  '2ea2ea84-4c59-ee29-aa96-6223149b8597',
  1,
  1,
  'Burj Khalifa y The Dubai Fountain',
  25.1972,
  55.2744,
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80']::text[],
  'El rascacielos más alto del planeta con 828 metros de altura. En su base se extiende un lago artificial donde el sistema de fuentes coreografiadas más grande del mundo lanza chorros de 150 metros al compás de música árabe y clásica con miles de luces LED.',
  ARRAY['Subir en el ascensor ultrarrápido al mirador At the Top piso 124/125 (Entrada: ~179 AED / ~$48 USD)', 'Ver el show de fuentes sincronizadas que se celebra gratis cada 30 minutos a partir de las 6:00 PM (Gratis)', 'Cenar shawarma gourmet o mariscos en las terrazas de Souk Al Bahar frente al espectáculo (80 - 160 AED)']::text[],
  ARRAY['Los mejores sitios gratuitos para ver las fuentes son el puente que cruza a Souk Al Bahar y la terraza de Apple Dubai Mall']::text[],
  ARRAY['Los ascensores del Burj Khalifa suben a 10 metros por segundo (36 km/h), tardando solo 60 segundos en llegar al piso 124']::text[],
  '{"address":"1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai","priceRange":"$$$ - Mirador y cenas","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Subir en el ascensor ultrarrápido al mirador At the Top piso 124/125 (Entrada: ~179 AED / ~$48 USD)","Ver el show de fuentes sincronizadas que se celebra gratis cada 30 minutos a partir de las 6:00 PM (Gratis)","Cenar shawarma gourmet o mariscos en las terrazas de Souk Al Bahar frente al espectáculo (80 - 160 AED)"],"datos_curiosos":["Los ascensores del Burj Khalifa suben a 10 metros por segundo (36 km/h), tardando solo 60 segundos en llegar al piso 124"],"consejos":["Los mejores sitios gratuitos para ver las fuentes son el puente que cruza a Souk Al Bahar y la terraza de Apple Dubai Mall"],"location_info":{"address":"1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai","priceRange":"$$$ - Mirador y cenas","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a18231ed-69f8-91f7-d27b-48b4d016a992',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  2,
  'Día 2: Marina de Dubái Iluminada y Playa de JBR',
  'Canal artificial rodeado de rascacielos iluminados y paseo costero.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2a31a423-e287-fff6-c713-a29feb1ff9e9',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  'a18231ed-69f8-91f7-d27b-48b4d016a992',
  2,
  2,
  'Dubai Marina Walk y Ain Dubai',
  25.0805,
  55.1403,
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80']::text[],
  'El puerto deportivo artificial más grande del mundo flanqueado por más de 200 rascacielos residenciales iluminados de noche. Paseo peatonal de 7 kilómetros bordeado de yates de lujo, lounges al aire libre y la rueda de la fortuna gigante Ain Dubai.',
  ARRAY['Crucero nocturno en dhow tradicional de madera con cena buffet navegando por la Marina (120 - 180 AED)', 'Caminar por The Walk en Jumeirah Beach Residence junto a la playa (Gratis)', 'Tomar un cóctel sin alcohol o té helado en un rooftop lounge con vistas panorámicas (45 - 80 AED)']::text[],
  ARRAY['Tomar el tranvía de Dubái que conecta la Marina con el metro y la estación de monorraíl de la Palmera']::text[],
  ARRAY['La Marina de Dubái fue excavada completamente en el desierto trayendo el agua de mar del Golfo Pérsico a través de un canal de 3 kilómetros']::text[],
  '{"address":"Dubai Marina Walk, Dubai","priceRange":"$$ - Moderado","dia":2,"day":2}'::jsonb,
  210,
  '{"dia":2,"day":2,"activities":["Crucero nocturno en dhow tradicional de madera con cena buffet navegando por la Marina (120 - 180 AED)","Caminar por The Walk en Jumeirah Beach Residence junto a la playa (Gratis)","Tomar un cóctel sin alcohol o té helado en un rooftop lounge con vistas panorámicas (45 - 80 AED)"],"datos_curiosos":["La Marina de Dubái fue excavada completamente en el desierto trayendo el agua de mar del Golfo Pérsico a través de un canal de 3 kilómetros"],"consejos":["Tomar el tranvía de Dubái que conecta la Marina con el metro y la estación de monorraíl de la Palmera"],"location_info":{"address":"Dubai Marina Walk, Dubai","priceRange":"$$ - Moderado","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b41438d6-7fd2-df1c-5cd0-ff8f214cdd34',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  3,
  'Día 3: Safari en las Dunas Rojas y Campamento Beduino Nocturno',
  'Adrenalina en 4x4 al atardecer, cena árabe y estrellas en el desierto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '6ea2a67b-607d-f8d4-70ac-f570d23993b2',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  'b41438d6-7fd2-df1c-5cd0-ff8f214cdd34',
  3,
  3,
  'Desierto de Al Lahbab (Dunas Rojas) y Campamento',
  24.95,
  55.6,
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80']::text[],
  'Expedición hacia el desierto de arena roja en vehículos todoterreno 4x4 practicando *dune bashing* (derrapes sobre dunas de 30 metros). Al anochecer, descanso en un campamento beduino tradicional bajo las estrellas.',
  ARRAY['Dune bashing en 4x4 y sandboarding por las dunas rojas (Tour completo con cena: 150 - 250 AED / ~$40 - $68 USD)', 'Paseo en camello al atardecer (Incluido en el safari)', 'Cena barbacoa árabe con espectáculo de danza Tanoura y fuego bajo las estrellas']::text[],
  ARRAY['No comer pesado antes del safari en 4x4 para evitar mareos con los movimientos bruscos en las dunas']::text[],
  ARRAY['La arena del desierto de Al Lahbab es intensamente roja debido a una alta concentración de óxido de hierro natural en los granos de cuarzo']::text[],
  '{"address":"Al Lahbab Desert, Dubai","priceRange":"$$ - Safari todo incluido","dia":3,"day":3}'::jsonb,
  360,
  '{"dia":3,"day":3,"activities":["Dune bashing en 4x4 y sandboarding por las dunas rojas (Tour completo con cena: 150 - 250 AED / ~$40 - $68 USD)","Paseo en camello al atardecer (Incluido en el safari)","Cena barbacoa árabe con espectáculo de danza Tanoura y fuego bajo las estrellas"],"datos_curiosos":["La arena del desierto de Al Lahbab es intensamente roja debido a una alta concentración de óxido de hierro natural en los granos de cuarzo"],"consejos":["No comer pesado antes del safari en 4x4 para evitar mareos con los movimientos bruscos en las dunas"],"location_info":{"address":"Al Lahbab Desert, Dubai","priceRange":"$$ - Safari todo incluido","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f6dab0f8-7238-e6e5-72b7-6f7a4143bb12',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  4,
  'Día 4: Abu Dhabi: La Colosal Gran Mezquita Sheikh Zayed',
  'Mármol de Carrara blanco, lámparas de cristal de Swarovski y alfombra de récord.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '633d327b-c8f5-6611-5a8f-3afdfb472ddd',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  'f6dab0f8-7238-e6e5-72b7-6f7a4143bb12',
  4,
  4,
  'Gran Mezquita Sheikh Zayed y Museo Louvre Abu Dhabi',
  24.4128,
  54.475,
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las mezquitas más suntuosas del planeta con 82 cúpulas de mármol blanco, estanques reflectantes y columnas con incrustaciones de nácar y piedras semipreciosas. En la isla Saadiyat, la impresionante cúpula flotante de lluvia de luz del Louvre Abu Dhabi.',
  ARRAY['Entrar a la Gran Mezquita y descalzarse sobre la mayor alfombra de nudo hecha a mano del mundo (Entrada gratuita con reserva previa online)', 'Admirar las lámparas de araña de cristal de Swarovski bañado en oro de 24 quilates (Gratis)', 'Visitar el Louvre Abu Dhabi diseñado por Jean Nouvel (Entrada: 63 AED / ~$17 USD)']::text[],
  ARRAY['Abu Dhabi queda a 1 hora y 15 minutos en autobús o taxi desde Dubái', 'La mezquita iluminada en tonos azules al anochecer según las fases de la luna es indescriptible']::text[],
  ARRAY['La alfombra de la sala principal de oración pesa 35 toneladas y fue tejida a mano por 1.200 artesanas iraníes durante dos años de trabajo']::text[],
  '{"address":"Al Rawdah, Abu Dhabi","priceRange":"$ - Mezquita gratis","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Entrar a la Gran Mezquita y descalzarse sobre la mayor alfombra de nudo hecha a mano del mundo (Entrada gratuita con reserva previa online)","Admirar las lámparas de araña de cristal de Swarovski bañado en oro de 24 quilates (Gratis)","Visitar el Louvre Abu Dhabi diseñado por Jean Nouvel (Entrada: 63 AED / ~$17 USD)"],"datos_curiosos":["La alfombra de la sala principal de oración pesa 35 toneladas y fue tejida a mano por 1.200 artesanas iraníes durante dos años de trabajo"],"consejos":["Abu Dhabi queda a 1 hora y 15 minutos en autobús o taxi desde Dubái","La mezquita iluminada en tonos azules al anochecer según las fases de la luna es indescriptible"],"location_info":{"address":"Al Rawdah, Abu Dhabi","priceRange":"$ - Mezquita gratis","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'b554f902-ac35-3974-fbc6-f3cafece75ae',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  5,
  'Día 5: Dubái Tradicional: Zocos del Oro y las Especias en Deira',
  'Cruce del canal en barca tradicional abra y despedida cosmopolita.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd601debb-4f5c-7ca1-5277-aa955ad8ac35',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  'b554f902-ac35-3974-fbc6-f3cafece75ae',
  5,
  5,
  'Zoco del Oro, Zoco de las Especias y Paseo en Abra',
  25.2697,
  55.2974,
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80']::text[],
  'El contraste con la modernidad: el Dubái antiguo a orillas de la ría Dubai Creek. Escaparates con cientos de kilos de oro macizo de 22 y 24 quilates en el Gold Souk, aromas a azafrán y cardamomo en el Spice Souk, y barcas de madera cruzando el agua.',
  ARRAY['Cruzar la ría en una barca de madera tradicional *abra* (Pasaje: 1 AED / ~$0.27 USD)', 'Ver el anillo de oro más pesado del mundo (*Najmat Taiba* de 64 kilos) en el Zoco del Oro (Gratis)', 'Comprar dátiles rellenos de almendra bañados en chocolate y té de azafrán (25 - 60 AED)']::text[],
  ARRAY['En los zocos de especias y souvenirs es tradicional y esperado regatear amablemente los precios']::text[],
  ARRAY['Todo el oro vendido en el Gold Souk está estrictamente controlado e inspeccionado por el gobierno de Dubái garantizando su autenticidad']::text[],
  '{"address":"Deira, Al Sabkha, Dubai","priceRange":"$ - Abra 1 AED","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Cruzar la ría en una barca de madera tradicional *abra* (Pasaje: 1 AED / ~$0.27 USD)","Ver el anillo de oro más pesado del mundo (*Najmat Taiba* de 64 kilos) en el Zoco del Oro (Gratis)","Comprar dátiles rellenos de almendra bañados en chocolate y té de azafrán (25 - 60 AED)"],"datos_curiosos":["Todo el oro vendido en el Gold Souk está estrictamente controlado e inspeccionado por el gobierno de Dubái garantizando su autenticidad"],"consejos":["En los zocos de especias y souvenirs es tradicional y esperado regatear amablemente los precios"],"location_info":{"address":"Deira, Al Sabkha, Dubai","priceRange":"$ - Abra 1 AED","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'f8732e4f-727c-4524-c7d8-6563eaa56f6a',
  '2b35778f-e532-240f-7e7f-9661353ee469',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Japón Esencial: Del Neón Futurista de Tokio a los Santuarios Zen de Kioto (Tokio, Japón)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'c39621f2-73b4-1060-1481-02996f41b185',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-japon-esencial-tokio-kioto-nara-7d',
  'Japón Esencial: Del Neón Futurista de Tokio a los Santuarios Zen de Kioto',
  'Japón',
  'Tokio',
  'urban',
  'Semana completa que resume la esencia fascinante de Japón. Cruces hipertecnológicos y templos en Tokio, el viaje en tren bala Shinkansen con vistas al Monte Fuji, los diez mil toriis bermellones de Fushimi Inari en Kioto, el bosque de bambú de Arashiyama y los ciervos sagrados libres de Nara.',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80']::text[],
  10080,
  580000,
  'moderate',
  'es',
  4.99,
  275,
  920,
  ARRAY['Japón', 'Tokio', 'Kioto', 'Nara', 'Shibuya', 'Fushimi Inari', 'Shinkansen', 'Urbano']::text[],
  true,
  'approved',
  '{"currency":"JPY","estimatedPerPersonMin":45000,"estimatedPerPersonMax":95000,"notes":"Shinkansen (~14.000 JPY), Shibuya Sky (~2.500 JPY), entradas templos y ramen/sushi"}'::jsonb,
  ARRAY['Viajeros del mundo', 'Fans de la cultura japonesa', 'Amantes de la gastronomía']::text[],
  'Marzo a Mayo (cerezos en flor / Sakura) y Octubre a Noviembre (momiji de otoño)',
  'Templos budistas a primera hora del día (7:30 AM) y barrios de neón por la noche',
  'Cruce de Shibuya frente a la estatua de Hachiko, Tokio',
  ARRAY['Ruta completa conectada por tren bala Shinkansen', 'Guía de transporte con tarjetas Suica / Pasmo', 'Protocolo de templos y santuarios']::text[],
  ARRAY['Boleto de Shinkansen Tokio - Kioto', 'Mirador Shibuya Sky', 'Alquiler de kimono']::text[],
  ARRAY['Llevar calzado que sea fácil de poner y quitar, ya que en muchos templos y restaurantes tradicionales se entra descalzo', 'Llevar efectivo en yenes (muchas tiendas tradicionales y templos no aceptan tarjetas)']::text[],
  ARRAY['Calcetines limpios y sin roturas', 'Batería externa para el móvil', 'Monedero para monedas japonesas', 'Tarjeta Suica digital en el móvil']::text[],
  ARRAY['No comer ni beber mientras se camina por la calle; comer parado junto a la máquina expendedora o local']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'cb66e62a-8d38-a9ba-ca02-df2ca0053c60',
  'c39621f2-73b4-1060-1481-02996f41b185',
  1,
  'Día 1: Tokio Eléctrico: Cruce de Shibuya, Hachiko y Mirador Shibuya Sky',
  'El cruce peatonal más transitado del mundo y la estatua del perro leal.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5a5cae0f-936c-5cfe-0938-b6515741a057',
  'c39621f2-73b4-1060-1481-02996f41b185',
  'cb66e62a-8d38-a9ba-ca02-df2ca0053c60',
  1,
  1,
  'Cruce de Shibuya y Estatua de Hachiko',
  35.6595,
  139.7005,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'El corazón palpitante del Tokio moderno. Hasta 3.000 personas cruzan simultáneamente en cada cambio de semáforo rodeadas de pantallas gigantescas de neón. Junto a la estación, la entrañable estatua de bronce de Hachiko.',
  ARRAY['Cruzar el paso de cebra de Shibuya en diagonal sintiendo la marea humana (Gratis)', 'Foto con la estatua de bronce del perro Hachiko (Gratis)', 'Subir al mirador al aire libre Shibuya Sky en el piso 47 para la vista vertiginosa del cruce (Entrada: ~2.200 - 2.500 JPY / ~$15 USD)']::text[],
  ARRAY['Reservar Shibuya Sky en el horario de las 5:00 PM para ver el atardecer y el encendido de los neones nocturnos']::text[],
  ARRAY['Hachiko esperó diariamente en esta misma salida de la estación a su dueño, el profesor Ueno, durante casi 10 años después de que este falleciera repentinamente']::text[],
  '{"address":"Shibuya City, Tokyo 150-0043","priceRange":"$ - Acceso libre","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Cruzar el paso de cebra de Shibuya en diagonal sintiendo la marea humana (Gratis)","Foto con la estatua de bronce del perro Hachiko (Gratis)","Subir al mirador al aire libre Shibuya Sky en el piso 47 para la vista vertiginosa del cruce (Entrada: ~2.200 - 2.500 JPY / ~$15 USD)"],"datos_curiosos":["Hachiko esperó diariamente en esta misma salida de la estación a su dueño, el profesor Ueno, durante casi 10 años después de que este falleciera repentinamente"],"consejos":["Reservar Shibuya Sky en el horario de las 5:00 PM para ver el atardecer y el encendido de los neones nocturnos"],"location_info":{"address":"Shibuya City, Tokyo 150-0043","priceRange":"$ - Acceso libre","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '384139d7-9575-d8a8-4f59-ef97c22ab55a',
  'c39621f2-73b4-1060-1481-02996f41b185',
  2,
  'Día 2: Tradición y Tecnología: Asakusa (Sensō-ji) y Akihabara',
  'El templo más antiguo de Tokio, faroles rojos gigantes y el reino del anime.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd59bcb90-83f4-b6ba-7a95-382693463a29',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '384139d7-9575-d8a8-4f59-ef97c22ab55a',
  2,
  2,
  'Templo Sensō-ji y Distrito de Akihabara',
  35.7148,
  139.7967,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Sensō-ji fue fundado en el año 645 y es el templo budista más venerado de Tokio. Su puerta Kaminarimon luce un farol rojo gigante de 700 kilos. Por la tarde, Akihabara deslumbra con tiendas de electrónica de 8 plantas, manga y figuras de colección.',
  ARRAY['Purificarse con el humo de incienso medicinal frente a la pagoda de Sensō-ji (Gratis)', 'Probar dulces tradicionales de melón pan caliente y dango en la calle Nakamise (200 - 500 JPY)', 'Explorar las tiendas de electrónica y recreativas de Akihabara como Mandarake y Radio Kaikan (Gratis)']::text[],
  ARRAY['Sacar un papel de la fortuna *Omikuji* en el templo echando una moneda de 100 JPY; si sale mala fortuna se ata a un alambre para dejarla atrás']::text[],
  ARRAY['El templo fue erigido después de que dos hermanos pescadores hallaran en el río Sumida una estatua de oro de la diosa Kannon que nunca volvió a sumergirse']::text[],
  '{"address":"2 Chome-3-1 Asakusa, Taito City","priceRange":"$ - Entrada templo gratis","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Purificarse con el humo de incienso medicinal frente a la pagoda de Sensō-ji (Gratis)","Probar dulces tradicionales de melón pan caliente y dango en la calle Nakamise (200 - 500 JPY)","Explorar las tiendas de electrónica y recreativas de Akihabara como Mandarake y Radio Kaikan (Gratis)"],"datos_curiosos":["El templo fue erigido después de que dos hermanos pescadores hallaran en el río Sumida una estatua de oro de la diosa Kannon que nunca volvió a sumergirse"],"consejos":["Sacar un papel de la fortuna *Omikuji* en el templo echando una moneda de 100 JPY; si sale mala fortuna se ata a un alambre para dejarla atrás"],"location_info":{"address":"2 Chome-3-1 Asakusa, Taito City","priceRange":"$ - Entrada templo gratis","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '02190042-48eb-fc23-113c-62c0c68f490b',
  'c39621f2-73b4-1060-1481-02996f41b185',
  3,
  'Día 3: Santuario Meiji Jingu en el Bosque y Harajuku',
  'Paz sintoísta entre 100.000 árboles donados y la moda callejera de Takeshita Street.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '11e82c9c-e7b5-41d3-50eb-e37dcc86537f',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '02190042-48eb-fc23-113c-62c0c68f490b',
  3,
  3,
  'Santuario Meiji Jingu y Calle Takeshita',
  35.6764,
  139.6993,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Enorme oasis boscoso de 70 hectáreas en el centro de Tokio. El santuario sintoísta está dedicado al emperador Meiji. A la salida de la estación Harajuku, la calle Takeshita explota con moda juvenil extravagante y crepes dulces gigantes.',
  ARRAY['Cruzar bajo el colosal torii de madera de ciprés japonés de 1.500 años (Gratis)', 'Fotografiar el muro ceremonial de barriles de sake decorados donados al emperador (Gratis)', 'Comer una crepe japonesa enrollada con fresas, nata y tarta de queso en Takeshita (600 - 900 JPY)']::text[],
  ARRAY['Los fines de semana por la mañana es muy habitual presenciar procesiones solemnes de bodas sintoístas tradicionales con novios en kimono blanco y negro']::text[],
  ARRAY['El bosque no existía de forma natural; fue plantado artificialmente en 1920 con más de 100.000 árboles donados por ciudadanos de todo Japón']::text[],
  '{"address":"1-1 Yoyogikamizonocho, Shibuya","priceRange":"$ - Acceso libre","dia":3,"day":3}'::jsonb,
  200,
  '{"dia":3,"day":3,"activities":["Cruzar bajo el colosal torii de madera de ciprés japonés de 1.500 años (Gratis)","Fotografiar el muro ceremonial de barriles de sake decorados donados al emperador (Gratis)","Comer una crepe japonesa enrollada con fresas, nata y tarta de queso en Takeshita (600 - 900 JPY)"],"datos_curiosos":["El bosque no existía de forma natural; fue plantado artificialmente en 1920 con más de 100.000 árboles donados por ciudadanos de todo Japón"],"consejos":["Los fines de semana por la mañana es muy habitual presenciar procesiones solemnes de bodas sintoístas tradicionales con novios en kimono blanco y negro"],"location_info":{"address":"1-1 Yoyogikamizonocho, Shibuya","priceRange":"$ - Acceso libre","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '76623a0f-566e-ac19-fc08-bdce17fcdf71',
  'c39621f2-73b4-1060-1481-02996f41b185',
  4,
  'Día 4: Tren Bala Shinkansen a Kioto y los 10.000 Toriis de Fushimi Inari',
  'Viaje a 300 km/h viendo el Monte Fuji y el túnel rojo sagrado.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '0372f4cc-fc6a-1edf-0fd5-4a8fd4bc9ee3',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '76623a0f-566e-ac19-fc08-bdce17fcdf71',
  4,
  4,
  'Tren Shinkansen y Santuario Fushimi Inari-taisha',
  34.9671,
  135.7727,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Tren bala Shinkansen Tokaido desde Tokio a Kioto (2 horas y 15 minutos). Fushimi Inari es el santuario sintoísta dedicado al dios del arroz y los negocios, famoso por sus túneles serpenteantes de más de 10.000 puertas torii de color bermellón que trepan por la montaña sagrada.',
  ARRAY['Comprar un bento en la estación de Tokio para almorzar en el tren bala (~1.200 JPY)', 'Caminar bajo los túneles de toriis bermellones custodiados por estatuas del zorro Kitsune (Entrada gratuita)', 'Paseo al atardecer por las calles de casas de madera de Gion buscando geishas (Gratis)']::text[],
  ARRAY['Reservar asiento en el lado derecho (fila E) del tren bala desde Tokio para divisar el Monte Fuji a los 45 minutos de trayecto', 'El santuario nunca cierra; visitarlo al atardecer o noche con farolillos encendidos es una experiencia mágica']::text[],
  ARRAY['Cada una de las 10.000 puertas torii fue donada por una empresa o familia japonesa, y lleva grabado en negro el nombre del donante y la fecha']::text[],
  '{"address":"68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto","priceRange":"$$ - Tren bala ~14.000 JPY","dia":4,"day":4}'::jsonb,
  270,
  '{"dia":4,"day":4,"activities":["Comprar un bento en la estación de Tokio para almorzar en el tren bala (~1.200 JPY)","Caminar bajo los túneles de toriis bermellones custodiados por estatuas del zorro Kitsune (Entrada gratuita)","Paseo al atardecer por las calles de casas de madera de Gion buscando geishas (Gratis)"],"datos_curiosos":["Cada una de las 10.000 puertas torii fue donada por una empresa o familia japonesa, y lleva grabado en negro el nombre del donante y la fecha"],"consejos":["Reservar asiento en el lado derecho (fila E) del tren bala desde Tokio para divisar el Monte Fuji a los 45 minutos de trayecto","El santuario nunca cierra; visitarlo al atardecer o noche con farolillos encendidos es una experiencia mágica"],"location_info":{"address":"68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto","priceRange":"$$ - Tren bala ~14.000 JPY","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '271629b8-5cbd-27f2-fd99-c10bfa6f1898',
  'c39621f2-73b4-1060-1481-02996f41b185',
  5,
  'Día 5: Kinkaku-ji (Pabellón Dorado) y Bosque de Bambú de Arashiyama',
  'El templo cubierto de láminas de oro y el susurro del bambú verde.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a2aebd3e-ecce-0b26-bc1a-b76775596d07',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '271629b8-5cbd-27f2-fd99-c10bfa6f1898',
  5,
  5,
  'Kinkaku-ji (Pabellón Dorado) y Arashiyama Bamboo Grove',
  35.0394,
  135.7292,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Kinkaku-ji es un templo zen de tres plantas cuyas dos plantas superiores están totalmente recubiertas de hojas de oro puro, reflejándose sobre el estanque Kyoko-chi. En Arashiyama, los senderos serpentean entre altísimas cañas de bambú que se mecen con la brisa.',
  ARRAY['Fotografiar el reflejo dorado del templo sobre las aguas del estanque (Entrada: 500 JPY / ~$3.5 USD)', 'Pasear en silencio por el sendero del bosque de bambú de Arashiyama (Gratis)', 'Probar helado artesanal de té verde matcha con galleta en el pueblo (450 JPY)']::text[],
  ARRAY['Llegar al bosque de bambú antes de las 8:30 AM para disfrutarlo sin muchedumbres y escuchar el crujido del viento entre las cañas']::text[],
  ARRAY['El sonido del viento balanceando las cañas de bambú de Arashiyama fue incluido por el Ministerio de Medio Ambiente de Japón en la lista oficial de los "100 paisajes sonoros a preservar"']::text[],
  '{"address":"1 Kinkakujicho, Kita Ward, Kyoto","priceRange":"$ - Entrada 500 JPY","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Fotografiar el reflejo dorado del templo sobre las aguas del estanque (Entrada: 500 JPY / ~$3.5 USD)","Pasear en silencio por el sendero del bosque de bambú de Arashiyama (Gratis)","Probar helado artesanal de té verde matcha con galleta en el pueblo (450 JPY)"],"datos_curiosos":["El sonido del viento balanceando las cañas de bambú de Arashiyama fue incluido por el Ministerio de Medio Ambiente de Japón en la lista oficial de los \"100 paisajes sonoros a preservar\""],"consejos":["Llegar al bosque de bambú antes de las 8:30 AM para disfrutarlo sin muchedumbres y escuchar el crujido del viento entre las cañas"],"location_info":{"address":"1 Kinkakujicho, Kita Ward, Kyoto","priceRange":"$ - Entrada 500 JPY","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2aa461b6-31f4-73fe-d9ac-cf0dec206f1a',
  'c39621f2-73b4-1060-1481-02996f41b185',
  6,
  'Día 6: Los Ciervos Sagrados de Nara y el Gran Buda de Tōdai-ji',
  'Más de mil ciervos libres que se inclinan en reverencia y el coloso de bronce.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ee7b1b19-19d4-11fe-76b0-101a2a985653',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '2aa461b6-31f4-73fe-d9ac-cf0dec206f1a',
  6,
  6,
  'Parque de Nara y Templo Tōdai-ji (Daibutsu)',
  34.6851,
  135.8398,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Nara fue la primera capital permanente de Japón (710 d.C.). Más de 1.200 ciervos sika dóciles deambulan libres por el parque como mensajeros de los dioses. El templo Tōdai-ji es el edificio de madera más grande del mundo y alberga el Gran Buda de bronce de 15 metros.',
  ARRAY['Comprar galletas de arroz *shika-senbei* para alimentar a los ciervos que hacen reverencias (200 JPY)', 'Entrar a la nave colosal de Tōdai-ji y admirar la estatua de 500 toneladas del Gran Buda (Entrada: 600 JPY)', 'Pasar por el agujero del pilar de madera del templo que otorga iluminación espiritual (Gratis con entrada)']::text[],
  ARRAY['El tren Kintetsu desde Kioto llega a la estación Kintetsu-Nara en 35 minutos (760 JPY)']::text[],
  ARRAY['Los ciervos de Nara han aprendido a imitar el saludo tradicional japonés inclinando la cabeza antes de recibir su galleta']::text[],
  '{"address":"406-1 Zoshicho, Nara, 630-8211","priceRange":"$ - Entrada 600 JPY","dia":6,"day":6}'::jsonb,
  240,
  '{"dia":6,"day":6,"activities":["Comprar galletas de arroz *shika-senbei* para alimentar a los ciervos que hacen reverencias (200 JPY)","Entrar a la nave colosal de Tōdai-ji y admirar la estatua de 500 toneladas del Gran Buda (Entrada: 600 JPY)","Pasar por el agujero del pilar de madera del templo que otorga iluminación espiritual (Gratis con entrada)"],"datos_curiosos":["Los ciervos de Nara han aprendido a imitar el saludo tradicional japonés inclinando la cabeza antes de recibir su galleta"],"consejos":["El tren Kintetsu desde Kioto llega a la estación Kintetsu-Nara en 35 minutos (760 JPY)"],"location_info":{"address":"406-1 Zoshicho, Nara, 630-8211","priceRange":"$ - Entrada 600 JPY","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c42b89b6-55f4-e619-171b-ea174f48d512',
  'c39621f2-73b4-1060-1481-02996f41b185',
  7,
  'Día 7: Mercado de Nishiki en Kioto y Despedida Japonesa',
  'La cocina de Kioto: brochetas de wagyu, dulces tradicionales y retorno.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e15b4bc0-94b5-734d-d55f-af1bb588fd76',
  'c39621f2-73b4-1060-1481-02996f41b185',
  'c42b89b6-55f4-e619-171b-ea174f48d512',
  7,
  7,
  'Mercado de Nishiki y Despedida',
  35.005,
  135.7645,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Galería techada estrecha de cinco cuadras con más de 130 puestos que opera desde hace más de 400 años. Famoso por sus encurtidos tradicionales, mariscos en brocheta, brochetas de ternera wagyu y té verde ceremonial.',
  ARRAY['Degustar brocheta de ternera wagyu tierna A5 flambeada al momento (800 - 1.500 JPY)', 'Comprar latas de té verde matcha ceremonial Uji de primera cosecha (1.000 - 2.500 JPY)', 'Traslado en tren Haruka directo al aeropuerto internacional de Kansai (KIX) o Shinkansen de retorno a Tokio']::text[],
  ARRAY['En el mercado está prohibido caminar mientras se come; consumir los alimentos delante del puesto donde se compraron']::text[],
  ARRAY['El mercado prosperó en este lugar gracias al agua subterránea fría natural que permitía conservar los pescados frescos antes de la refrigeración eléctrica']::text[],
  '{"address":"Nakagyo Ward, Kyoto","priceRange":"$$ - Gastronomía callejera","dia":7,"day":7}'::jsonb,
  150,
  '{"dia":7,"day":7,"activities":["Degustar brocheta de ternera wagyu tierna A5 flambeada al momento (800 - 1.500 JPY)","Comprar latas de té verde matcha ceremonial Uji de primera cosecha (1.000 - 2.500 JPY)","Traslado en tren Haruka directo al aeropuerto internacional de Kansai (KIX) o Shinkansen de retorno a Tokio"],"datos_curiosos":["El mercado prosperó en este lugar gracias al agua subterránea fría natural que permitía conservar los pescados frescos antes de la refrigeración eléctrica"],"consejos":["En el mercado está prohibido caminar mientras se come; consumir los alimentos delante del puesto donde se compraron"],"location_info":{"address":"Nakagyo Ward, Kyoto","priceRange":"$$ - Gastronomía callejera","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '27f8e838-46a8-3018-7d29-37a06a9e1f36',
  'c39621f2-73b4-1060-1481-02996f41b185',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Tailandia de Sabores y Playas: De los Mercados de Bangkok a los Acantilados de Krabi (Bangkok, Tailandia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-tailandia-culinaria-bangkok-krabi-9d',
  'Tailandia de Sabores y Playas: De los Mercados de Bangkok a los Acantilados de Krabi',
  'Tailandia',
  'Bangkok',
  'gastronomic',
  'Circuito de 9 días que sumerge los sentidos en el reino de Siam. La efervescencia culinaria de los puestos callejeros con estrella Michelin de Bangkok, el Gran Palacio de Buda Esmeralda, los mercados sobre las vías del tren y flotantes, y el paraíso kárstico de aguas turquesas en Railay Beach y las islas Phi Phi.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  12960,
  840000,
  'easy',
  'es',
  4.96,
  190,
  650,
  ARRAY['Tailandia', 'Bangkok', 'Krabi', 'Phi Phi', 'Gastronómico', 'Playas', 'Street Food', 'Templos']::text[],
  true,
  'approved',
  '{"currency":"THB","estimatedPerPersonMin":12000,"estimatedPerPersonMax":26000,"notes":"Gran Palacio (~500 THB), lancha Phi Phi (~1.500 THB), masajes tradicionales y street food"}'::jsonb,
  ARRAY['Foodies', 'Amantes de la playa y snorkel', 'Mochileros de lujo']::text[],
  'Noviembre a Abril (temporada seca con mar calmo y cielos despejados)',
  'Templos y palacios a primera hora de la mañana; tours gastronómicos nocturnos',
  'Wat Phra Kaew / Gran Palacio Real, Bangkok',
  ARRAY['Ruta completa de templos y street food', 'Coordenadas de muelles y lanchas tradicionales longtail', 'Itinerario de playas de Krabi']::text[],
  ARRAY['Boleto al Gran Palacio de Bangkok', 'Vuelo doméstico Bangkok - Krabi', 'Tour en lancha rápida a Islas Phi Phi']::text[],
  ARRAY['Para entrar a los templos reales es obligatorio cubrir hombros y llevar pantalones largos (no valen pañuelos atados)', 'Beber siempre agua embotellada sellada y disfrutar del street food donde haya rotación de clientes locales']::text[],
  ARRAY['Ropa de algodón muy ligera y transpirable', 'Pantalones tipo pescador o lino', 'Bolsa estanca impermeable', 'Protector solar marino']::text[],
  ARRAY['Prohibido subirse o tocar las estatuas sagradas de Buda']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"coastal_islands","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f29904c8-a5d4-a666-1e00-709c09be0e3d',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  1,
  'Día 1: Bangkok Real: El Gran Palacio y el Buda de Esmeralda',
  'Mosaicos de cristal de oro, agujas puntiagudas y el Buda más sagrado de Tailandia.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a3de34a3-b55a-bcd6-5a4a-4d726acf6d55',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'f29904c8-a5d4-a666-1e00-709c09be0e3d',
  1,
  1,
  'Gran Palacio Real y Wat Phra Kaew',
  13.75,
  100.4913,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El conjunto arquitectónico más sagrado y resplandeciente del país fundado en 1782. Alberga el Wat Phra Kaew con la pequeña estatua tallada en un solo bloque de jade del Buda de Esmeralda y guardianes míticos gigantes de porcelana policromada.',
  ARRAY['Visitar el recinto real y el Buda de Esmeralda con vestiduras de oro cambiadas por el rey (Entrada: 500 THB / ~$14 USD)', 'Probar el auténtico Pad Thai con gambas frescas y cacahuete molido en un puesto callejero (60 - 100 THB / ~$2 USD)', 'Paseo en barco público de bandera naranja por el río Chao Phraya (16 THB)']::text[],
  ARRAY['Estricto código de vestimenta: no se permite entrar con camisetas sin mangas, mallas ajustadas ni pantalones cortos']::text[],
  ARRAY['El rey de Tailandia en persona cambia tres veces al año las vestiduras de oro del Buda de Esmeralda para marcar el inicio del verano, el invierno y la temporada de lluvias']::text[],
  '{"address":"Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok","priceRange":"$$ - Entrada 500 THB","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Visitar el recinto real y el Buda de Esmeralda con vestiduras de oro cambiadas por el rey (Entrada: 500 THB / ~$14 USD)","Probar el auténtico Pad Thai con gambas frescas y cacahuete molido en un puesto callejero (60 - 100 THB / ~$2 USD)","Paseo en barco público de bandera naranja por el río Chao Phraya (16 THB)"],"datos_curiosos":["El rey de Tailandia en persona cambia tres veces al año las vestiduras de oro del Buda de Esmeralda para marcar el inicio del verano, el invierno y la temporada de lluvias"],"consejos":["Estricto código de vestimenta: no se permite entrar con camisetas sin mangas, mallas ajustadas ni pantalones cortos"],"location_info":{"address":"Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok","priceRange":"$$ - Entrada 500 THB","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7bdc8753-86ba-30be-6c58-2099248488f2',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  2,
  'Día 2: Wat Pho (Buda Reclinado) y el Templo del Amanecer (Wat Arun)',
  'El Buda dorado de 46 metros, cuna del masaje tailandés y torres de cerámica.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'db646103-0519-b024-b5c0-225e72636ec4',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  '7bdc8753-86ba-30be-6c58-2099248488f2',
  2,
  2,
  'Wat Pho y Wat Arun sobre el Río Chao Phraya',
  13.7437,
  100.4889,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Wat Pho alberga el colosal Buda Reclinado recubierto de pan de oro de 46 metros de largo con pies incrustados de nácar. Al otro lado del río se eleva la torre prang de 82 metros de Wat Arun cubierta con miles de piezas de porcelana china.',
  ARRAY['Admirar los pies de nácar del Buda y depositar monedas en los 108 cuencos de bronce (Entrada: 300 THB)', 'Disfrutar de un masaje tradicional tailandés de 1 hora en la escuela de masaje del templo (350 - 500 THB)', 'Cruzar en ferry local por 5 THB para subir las escalinatas de Wat Arun (Entrada: 100 THB)']::text[],
  ARRAY['El atardecer contemplando la silueta de Wat Arun desde los bares ribereños del lado opuesto es inolvidable']::text[],
  ARRAY['Wat Pho es la sede de la primera universidad pública de Tailandia y la cuna histórica donde se sistematizó el masaje tailandés tradicional reconocido por la UNESCO']::text[],
  '{"address":"Sanam Chai Rd, Wat Arun, Bangkok","priceRange":"$ - Entradas accesibles","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Admirar los pies de nácar del Buda y depositar monedas en los 108 cuencos de bronce (Entrada: 300 THB)","Disfrutar de un masaje tradicional tailandés de 1 hora en la escuela de masaje del templo (350 - 500 THB)","Cruzar en ferry local por 5 THB para subir las escalinatas de Wat Arun (Entrada: 100 THB)"],"datos_curiosos":["Wat Pho es la sede de la primera universidad pública de Tailandia y la cuna histórica donde se sistematizó el masaje tailandés tradicional reconocido por la UNESCO"],"consejos":["El atardecer contemplando la silueta de Wat Arun desde los bares ribereños del lado opuesto es inolvidable"],"location_info":{"address":"Sanam Chai Rd, Wat Arun, Bangkok","priceRange":"$ - Entradas accesibles","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '61b04bb0-8f91-aa28-0bdd-4befdcfba2a7',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  3,
  'Día 3: El Mercado del Tren de Maeklong y Mercado Flotante',
  'Puestos de frutas sobre vías activas del tren y canoas cargadas de mangos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '3db73691-c25b-45c0-6857-26c98a556858',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  '61b04bb0-8f91-aa28-0bdd-4befdcfba2a7',
  3,
  3,
  'Mercado del Tren (Rom Hup) y Mercado Flotante Damnoen Saduak',
  13.516,
  99.958,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'En Maeklong los vendedores instalan sus toldos directamente sobre la vía del ferrocarril; cuando suena la campana del tren, recogen los toldos en 30 segundos mientras el convoy pasa rozando las frutas. Cerca, el mercado flotante tradicional con canoas de madera.',
  ARRAY['Ver pasar el tren a centímetros de los canastos de fruta (Gratis)', 'Paseo en canoa de madera por los canales del mercado flotante comiendo fideos de bote (200 - 300 THB)', 'Probar el postre nacional Mango Sticky Rice con leche de coco tibia (60 - 100 THB)']::text[],
  ARRAY['El tren pasa a horarios exactos (aprox. 8:30, 11:10, 14:30); coordinar la excursión para coincidir']::text[],
  ARRAY['Los toldos y toldillos se repliegan tan sincronizadamente que el mercado es apodado popularmente *Talat Rom Hup* ("el mercado de los toldos que se cierran")']::text[],
  '{"address":"Samut Songkhram / Ratchaburi","priceRange":"$$ - Excursión compartida","dia":3,"day":3}'::jsonb,
  270,
  '{"dia":3,"day":3,"activities":["Ver pasar el tren a centímetros de los canastos de fruta (Gratis)","Paseo en canoa de madera por los canales del mercado flotante comiendo fideos de bote (200 - 300 THB)","Probar el postre nacional Mango Sticky Rice con leche de coco tibia (60 - 100 THB)"],"datos_curiosos":["Los toldos y toldillos se repliegan tan sincronizadamente que el mercado es apodado popularmente *Talat Rom Hup* (\"el mercado de los toldos que se cierran\")"],"consejos":["El tren pasa a horarios exactos (aprox. 8:30, 11:10, 14:30); coordinar la excursión para coincidir"],"location_info":{"address":"Samut Songkhram / Ratchaburi","priceRange":"$$ - Excursión compartida","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e21793fc-c4e4-39f9-aa48-dd5a2e492dc8',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  4,
  'Día 4: Street Food en Chinatown (Yaowarat) y Noche en Sukhumvit',
  'El epicentro mundial del street food callejero y luces de rascacielos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '9f6a30e2-32c3-cb72-9cf7-fa28c18c0612',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'e21793fc-c4e4-39f9-aa48-dd5a2e492dc8',
  4,
  4,
  'Calle Yaowarat en Chinatown y Wat Traimit',
  13.738,
  100.513,
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80']::text[],
  'Al anochecer la avenida Yaowarat se transforma en un río de puestos de comida iluminados por letreros de neón chinos. Sopa de fideos Tom Yum, brochetas satay con salsa de cacahuete y helado de coco en cáscara natural.',
  ARRAY['Ver el Buda de Oro macizo de 5.5 toneladas en Wat Traimit (Entrada: 100 THB)', 'Safari gastronómico de puesto en puesto probando dumplings, mariscos salteados y fideos al wok (200 - 400 THB por banquete completo)', 'Paseo nocturno en tuk-tuk con luces de colores por las avenidas de la ciudad (150 - 250 THB)']::text[],
  ARRAY['Acordar el precio del tuk-tuk antes de subirse para evitar malentendidos']::text[],
  ARRAY['El Buda de oro macizo de Wat Traimit estuvo recubierto de yeso durante dos siglos para ocultarlo de los invasores birmanos; su verdadero oro se descubrió accidentalmente en 1955 cuando cayó de una grúa']::text[],
  '{"address":"Yaowarat Rd, Samphanthawong, Bangkok","priceRange":"$ - Gastronomía callejera","dia":4,"day":4}'::jsonb,
  210,
  '{"dia":4,"day":4,"activities":["Ver el Buda de Oro macizo de 5.5 toneladas en Wat Traimit (Entrada: 100 THB)","Safari gastronómico de puesto en puesto probando dumplings, mariscos salteados y fideos al wok (200 - 400 THB por banquete completo)","Paseo nocturno en tuk-tuk con luces de colores por las avenidas de la ciudad (150 - 250 THB)"],"datos_curiosos":["El Buda de oro macizo de Wat Traimit estuvo recubierto de yeso durante dos siglos para ocultarlo de los invasores birmanos; su verdadero oro se descubrió accidentalmente en 1955 cuando cayó de una grúa"],"consejos":["Acordar el precio del tuk-tuk antes de subirse para evitar malentendidos"],"location_info":{"address":"Yaowarat Rd, Samphanthawong, Bangkok","priceRange":"$ - Gastronomía callejera","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '09f9b09d-d2ce-62bc-aa54-f9be570fa714',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  5,
  'Día 5: Vuelo al Paraíso Marino de Krabi y Playa de Ao Nang',
  'Vuelo doméstico hacia las costas del mar de Andamán y acantilados kársticos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd6786488-2b68-91de-32db-f606576512c3',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  '09f9b09d-d2ce-62bc-aa54-f9be570fa714',
  5,
  5,
  'Ao Nang Beach y Atardecer en el Mar de Andamán',
  8.0333,
  98.825,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de 1 hora y 15 minutos desde Bangkok hacia Krabi. Ao Nang es la base costera rodeada por gigantescas formaciones kársticas de roca caliza que se sumergen verticalmente en el mar turquesa.',
  ARRAY['Caminata por la playa de Ao Nang contemplando las lanchas tradicionales longtail amarradas (Gratis)', 'Cena marinera frente al mar: pescado entero al vapor con lima y chile o curry verde tailandés (250 - 450 THB)', 'Masaje de pies con aceites aromáticos junto a la playa (200 THB / ~$6 USD)']::text[],
  ARRAY['El taxi regulado desde el aeropuerto de Krabi hasta Ao Nang cuesta 600 THB (fijo)']::text[],
  ARRAY['Las montañas kársticas de Krabi son restos de un antiguo arrecife de coral prehistórico que emergió hace millones de años']::text[],
  '{"address":"Ao Nang, Mueang Krabi District","priceRange":"$$ - Restaurantes de playa","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Caminata por la playa de Ao Nang contemplando las lanchas tradicionales longtail amarradas (Gratis)","Cena marinera frente al mar: pescado entero al vapor con lima y chile o curry verde tailandés (250 - 450 THB)","Masaje de pies con aceites aromáticos junto a la playa (200 THB / ~$6 USD)"],"datos_curiosos":["Las montañas kársticas de Krabi son restos de un antiguo arrecife de coral prehistórico que emergió hace millones de años"],"consejos":["El taxi regulado desde el aeropuerto de Krabi hasta Ao Nang cuesta 600 THB (fijo)"],"location_info":{"address":"Ao Nang, Mueang Krabi District","priceRange":"$$ - Restaurantes de playa","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd88c0ae9-636d-dbaa-b830-ed3a0469f859',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  6,
  'Día 6: Península Inaccesible de Railay Beach y Cueva Phra Nang',
  'Solo accesible en barca: escalada mundial, arena blanca y monos salvajes.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f96b214c-c06c-2055-1d5d-7ba91a3a541a',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'd88c0ae9-636d-dbaa-b830-ed3a0469f859',
  6,
  6,
  'Railay Beach West y Cueva de la Princesa (Phra Nang Beach)',
  8.011,
  98.839,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Península aislada del continente por acantilados infranqueables a la que solo se puede llegar en barca tradicional longtail. Aguas tranquilas color verde esmeralda, playas de arena finísima y santuarios de pescadores.',
  ARRAY['Travesía de 10 minutos en longtail boat desde Ao Nang hasta Railay (100 THB por trayecto)', 'Nadar bajo los acantilados de Phra Nang Beach (Gratis)', 'Alquiler de kayak para rodear los islotes kársticos (200 THB por hora)']::text[],
  ARRAY['Para subir a la barca longtail se camina unos pasos dentro del agua hasta las rodillas; llevar calzado de agua o descalzarse']::text[],
  ARRAY['La cueva de Phra Nang alberga un santuario donde los pescadores locales dejan ofrendas de madera para pedir buena pesca y protección marina']::text[],
  '{"address":"Railay Beach, Krabi","priceRange":"$ - Barca 100 THB","dia":6,"day":6}'::jsonb,
  300,
  '{"dia":6,"day":6,"activities":["Travesía de 10 minutos en longtail boat desde Ao Nang hasta Railay (100 THB por trayecto)","Nadar bajo los acantilados de Phra Nang Beach (Gratis)","Alquiler de kayak para rodear los islotes kársticos (200 THB por hora)"],"datos_curiosos":["La cueva de Phra Nang alberga un santuario donde los pescadores locales dejan ofrendas de madera para pedir buena pesca y protección marina"],"consejos":["Para subir a la barca longtail se camina unos pasos dentro del agua hasta las rodillas; llevar calzado de agua o descalzarse"],"location_info":{"address":"Railay Beach, Krabi","priceRange":"$ - Barca 100 THB","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd8fe561b-0804-1081-9aff-10e7937a1fff',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  7,
  'Día 7: La Leyenda de las Islas Phi Phi: Maya Bay y Pileh Lagoon',
  'La playa de la película de Leonardo DiCaprio y aguas turquesas rodeadas de acantilados.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '4cf3b933-e906-2531-61eb-cd7332773bfc',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'd8fe561b-0804-1081-9aff-10e7937a1fff',
  7,
  7,
  'Maya Bay y Laguna de Pileh (Phi Phi Leh)',
  7.6775,
  98.7665,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El archipiélago más icónico del mar de Andamán. Maya Bay, protegida por acantilados de 100 metros de altura donde se filmó la película *La Playa*, y la Laguna de Pileh, una piscina natural esmeralda donde el agua parece vidrio fundido.',
  ARRAY['Excursión en lancha rápida de día completo desde Krabi con snorkel (1.400 - 2.000 THB + tasa Parque Nacional 400 THB)', 'Snorkel con peces ángel, peces payaso y tiburones punta negra de arrecife inofensivos (Incluido en el tour)', 'Saltar al agua transparente desde la barca en Pileh Lagoon']::text[],
  ARRAY['En Maya Bay está estrictamente prohibido bañarse más allá de los tobillos para proteger el ecosistema de tiburones bebé que regresaron tras años de cierre ecológico']::text[],
  ARRAY['Maya Bay estuvo cerrada al turismo durante más de tres años para permitir la regeneración total de sus arrecifes de coral dañados']::text[],
  '{"address":"Ko Phi Phi Leh, Parque Nacional Marino","priceRange":"$$$ - Tour en lancha","dia":7,"day":7}'::jsonb,
  360,
  '{"dia":7,"day":7,"activities":["Excursión en lancha rápida de día completo desde Krabi con snorkel (1.400 - 2.000 THB + tasa Parque Nacional 400 THB)","Snorkel con peces ángel, peces payaso y tiburones punta negra de arrecife inofensivos (Incluido en el tour)","Saltar al agua transparente desde la barca en Pileh Lagoon"],"datos_curiosos":["Maya Bay estuvo cerrada al turismo durante más de tres años para permitir la regeneración total de sus arrecifes de coral dañados"],"consejos":["En Maya Bay está estrictamente prohibido bañarse más allá de los tobillos para proteger el ecosistema de tiburones bebé que regresaron tras años de cierre ecológico"],"location_info":{"address":"Ko Phi Phi Leh, Parque Nacional Marino","priceRange":"$$$ - Tour en lancha","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e5786c15-501a-d9a4-2953-675241a8e783',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  8,
  'Día 8: Las Cuatro Islas de Krabi y la Barra de Arena de Koh Poda',
  'Paseo en lancha tradicional por bancos de arena blanca y snorkel.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a2960495-bade-e9b9-bbc7-d52898bc335e',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'e5786c15-501a-d9a4-2953-675241a8e783',
  8,
  8,
  'Tup Island, Chicken Island y Koh Poda',
  7.97,
  98.81,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Tour clásico por las islas cercanas de la bahía. Destaca el fenómeno de la marea baja en Tup Island, donde emerge una lengua de arena blanca que une dos islas permitiendo caminar sobre el mar. Koh Poda deslumbra con su monolito de piedra solitario.',
  ARRAY['Caminar sobre el banco de arena entre las islas durante la marea baja (*Talay Waek*) (Gratis)', 'Descanso bajo los pinos marítimos de la playa de Koh Poda', 'Almuerzo tipo picnic tailandés servido en la arena con curry Massaman y fruta fresca (Incluido en el tour: ~800 - 1.200 THB)']::text[],
  ARRAY['Llevar calzado de agua para cruzar el banco de arena entre piedras y corales rotos']::text[],
  ARRAY['Chicken Island (Koh Kai) recibe su nombre por una caprichosa formación de roca caliza en su extremo que se asemeja con asombrosa precisión a la cabeza de un pollo gigante']::text[],
  '{"address":"Four Islands, Krabi","priceRange":"$$ - Excursión 4 Islas","dia":8,"day":8}'::jsonb,
  300,
  '{"dia":8,"day":8,"activities":["Caminar sobre el banco de arena entre las islas durante la marea baja (*Talay Waek*) (Gratis)","Descanso bajo los pinos marítimos de la playa de Koh Poda","Almuerzo tipo picnic tailandés servido en la arena con curry Massaman y fruta fresca (Incluido en el tour: ~800 - 1.200 THB)"],"datos_curiosos":["Chicken Island (Koh Kai) recibe su nombre por una caprichosa formación de roca caliza en su extremo que se asemeja con asombrosa precisión a la cabeza de un pollo gigante"],"consejos":["Llevar calzado de agua para cruzar el banco de arena entre piedras y corales rotos"],"location_info":{"address":"Four Islands, Krabi","priceRange":"$$ - Excursión 4 Islas","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'baafdeb2-df2d-8e8b-c5af-acbf001f5b65',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  9,
  'Día 9: Templo de la Cueva del Tigre (Wat Tham Suea) y Despedida',
  'Ascenso de 1.260 escalones hasta la cumbre panorámica y regreso.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ca117c6a-796e-757c-8e6f-ba51c0448bfd',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  'baafdeb2-df2d-8e8b-c5af-acbf001f5b65',
  9,
  9,
  'Wat Tham Suea (Tiger Cave Temple) y Despedida',
  8.1278,
  98.9242,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Santuario budista enclavado en la selva con una cueva sagrada. En la cima de un risco calizo se alza una colosal estatua dorada de Buda a la que se llega tras subir 1.260 empinados escalones con vistas de 360 grados sobre toda la provincia.',
  ARRAY['Subida de superación personal por los 1.260 escalones hasta el santuario de la cima (Entrada gratuita)', 'Ver la huella de tigre en la roca dentro de la cueva sagrada (Gratis)', 'Comprar pasta de curry casera y aceite de coco virgen antes del traslado al aeropuerto']::text[],
  ARRAY['Subir temprano a las 7:30 AM con abundante agua; la subida es muy empinada y exigente físicamente pero la vista lo recompensa con creces']::text[],
  ARRAY['La cueva toma su nombre de una leyenda según la cual un monje que meditaba en el bosque vivía en armonía con un tigre que habitaba la cueva natural']::text[],
  '{"address":"Krabi Noi, Mueang Krabi District","priceRange":"$ - Entrada libre","dia":9,"day":9}'::jsonb,
  180,
  '{"dia":9,"day":9,"activities":["Subida de superación personal por los 1.260 escalones hasta el santuario de la cima (Entrada gratuita)","Ver la huella de tigre en la roca dentro de la cueva sagrada (Gratis)","Comprar pasta de curry casera y aceite de coco virgen antes del traslado al aeropuerto"],"datos_curiosos":["La cueva toma su nombre de una leyenda según la cual un monje que meditaba en el bosque vivía en armonía con un tigre que habitaba la cueva natural"],"consejos":["Subir temprano a las 7:30 AM con abundante agua; la subida es muy empinada y exigente físicamente pero la vista lo recompensa con creces"],"location_info":{"address":"Krabi Noi, Mueang Krabi District","priceRange":"$ - Entrada libre","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '6515f373-bef9-378f-0055-7f1929a27932',
  '7a8e8bd7-813e-9182-ac0f-eef333e5af9c',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Turquía de Oriente a Occidente: Estambul, Capadocia y Éfeso (Estambul, Turquía)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-turquia-oriente-a-occidente-10d',
  'Turquía de Oriente a Occidente: Estambul, Capadocia y Éfeso',
  'Turquía',
  'Estambul',
  'historical',
  'La gran encrucijada de imperios durante 10 días. Mezquita Azul y Santa Sofía en el Bósforo, el vuelo mágico en globo aerostático al amanecer sobre las chimeneas de hadas de Capadocia, las terrazas de travertino blanco de Pamukkale y las ruinas grecorromanas de Éfeso.',
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  14400,
  1100000,
  'moderate',
  'es',
  4.98,
  220,
  730,
  ARRAY['Turquía', 'Estambul', 'Capadocia', 'Pamukkale', 'Éfeso', 'Globos', 'Santa Sofía', 'Bósforo']::text[],
  true,
  'approved',
  '{"currency":"EUR","estimatedPerPersonMin":800,"estimatedPerPersonMax":1700,"notes":"Santa Sofía (€25), globo Capadocia (~€150-€240), Pamukkale (€30), Éfeso (€40) y vuelos domésticos"}'::jsonb,
  ARRAY['Amantes de la historia antigua', 'Fotógrafos', 'Viajeros culturales']::text[],
  'Abril a Mayo y Septiembre a Octubre (clima templado perfecto para vuelos en globo)',
  'Monumentos tempranos y vuelos en globo a las 5:00 AM para ver el amanecer',
  'Plaza de Sultanahmet frente a Santa Sofía, Estambul',
  ARRAY['Ruta completa de 10 días georreferenciada', 'Información de vuelos en globo certificados', 'Protocolo de vestimenta en mezquitas']::text[],
  ARRAY['Vuelo en globo aerostático en Capadocia', 'Vuelos internos Estambul - Capadocia - Esmirna', 'Entradas oficiales']::text[],
  ARRAY['Llevar pañuelo para la cabeza las mujeres para ingresar a mezquitas activas y calzado fácil de descalzar', 'Reservar el vuelo en globo para la primera mañana en Capadocia; si se cancela por viento, se puede reprogramar para la siguiente']::text[],
  ARRAY['Ropa abrigada para el amanecer en globo (las mañanas en Capadocia son frías)', 'Zapatos con buen agarre para roca volcánica']::text[],
  ARRAY['Respetar los momentos de oración musulmana en las mezquitas']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0ddde764-d9fe-520d-4a65-5ea16f8da522',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  1,
  'Día 1: Estambul: Santa Sofía y la Mezquita Azul',
  'La cúpula bizantina del siglo VI y los azulejos de Iznik en Sultanahmet.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '385ed3c4-acef-0178-498c-1d6cc90f3b3a',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  '0ddde764-d9fe-520d-4a65-5ea16f8da522',
  1,
  1,
  'Santa Sofía (Hagia Sophia) y Mezquita Azul (Sultanahmet)',
  41.0086,
  28.9802,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'La maravilla bizantina erigida en el 537 d.C. por Justiniano con su colosal cúpula suspendida. Frente a ella se alza la Mezquita Azul del sultán Ahmet I con sus seis minaretes y más de 20.000 azulejos de cerámica turquesa pintados a mano.',
  ARRAY['Visitar la galería superior de Santa Sofía y admirar los mosaicos de Cristo Pantocrátor (Entrada: €25)', 'Entrar a la Mezquita Azul descalzándose sobre las alfombras rojas (Entrada gratuita)', 'Tomar té turco en vaso de tulipán con un kebab tradicional de cordero (€8 - €15)']::text[],
  ARRAY['Las mujeres deben cubrir su cabello con velo para ingresar; si no llevan, en la entrada prestan o venden pañuelos']::text[],
  ARRAY['Santa Sofía fue la iglesia catedral más grande del mundo cristiano durante casi mil años hasta la construcción de la Catedral de Sevilla en 1520']::text[],
  '{"address":"Sultan Ahmet, Fatih, İstanbul","priceRange":"$$ - Entrada Santa Sofía €25","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Visitar la galería superior de Santa Sofía y admirar los mosaicos de Cristo Pantocrátor (Entrada: €25)","Entrar a la Mezquita Azul descalzándose sobre las alfombras rojas (Entrada gratuita)","Tomar té turco en vaso de tulipán con un kebab tradicional de cordero (€8 - €15)"],"datos_curiosos":["Santa Sofía fue la iglesia catedral más grande del mundo cristiano durante casi mil años hasta la construcción de la Catedral de Sevilla en 1520"],"consejos":["Las mujeres deben cubrir su cabello con velo para ingresar; si no llevan, en la entrada prestan o venden pañuelos"],"location_info":{"address":"Sultan Ahmet, Fatih, İstanbul","priceRange":"$$ - Entrada Santa Sofía €25","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ffc0ae06-f18a-104d-0448-8784e2f0e140',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  2,
  'Día 2: Palacio de Topkapi, Cisterna Basílica y Gran Bazar',
  'El tesoro del sultán con el diamante Cucharero y el laberinto de 4.000 tiendas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '99aa2064-c45e-6ac5-2e6f-62489b1253f9',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'ffc0ae06-f18a-104d-0448-8784e2f0e140',
  2,
  2,
  'Palacio de Topkapi, Cisterna Basílica y Gran Bazar',
  41.0115,
  28.9833,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Sede de los sultanes otomanos durante 400 años con vistas al Bósforo y el Harén real. Cerca, la subterránea Cisterna Basílica con 336 columnas de mármol iluminadas sobre el agua y cabezas de Medusa. El Gran Bazar es el mercado cubierto más antiguo del mundo.',
  ARRAY['Visitar las salas de armas y el diamante Cucharero de 86 quilates en Topkapi (Entrada combinada: ~€45)', 'Caminar sobre las pasarelas de la Cisterna Basílica con su atmósfera mágica (Entrada: ~€20)', 'Perderse por las 60 calles del Gran Bazar regateando lámparas de mosaico y especias (Gratis)']::text[],
  ARRAY['En el Gran Bazar regatear con respeto: comenzar ofreciendo alrededor del 50-60% del precio inicial pedido']::text[],
  ARRAY['Dos de las columnas de la Cisterna Basílica se apoyan sobre bloques de mármol tallados con el rostro de Medusa colocados deliberadamente boca abajo y de lado']::text[],
  '{"address":"Cankurtaran / Beyazıt, Fatih","priceRange":"$$$ - Entradas históricas","dia":2,"day":2}'::jsonb,
  300,
  '{"dia":2,"day":2,"activities":["Visitar las salas de armas y el diamante Cucharero de 86 quilates en Topkapi (Entrada combinada: ~€45)","Caminar sobre las pasarelas de la Cisterna Basílica con su atmósfera mágica (Entrada: ~€20)","Perderse por las 60 calles del Gran Bazar regateando lámparas de mosaico y especias (Gratis)"],"datos_curiosos":["Dos de las columnas de la Cisterna Basílica se apoyan sobre bloques de mármol tallados con el rostro de Medusa colocados deliberadamente boca abajo y de lado"],"consejos":["En el Gran Bazar regatear con respeto: comenzar ofreciendo alrededor del 50-60% del precio inicial pedido"],"location_info":{"address":"Cankurtaran / Beyazıt, Fatih","priceRange":"$$$ - Entradas históricas","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a6b48e8b-eadd-c152-677b-ea8474e4940d',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  3,
  'Día 3: Crucero por el Bósforo y Vuelo a Capadocia',
  'Navegando entre Europa y Asia y vuelo nocturno a la tierra de las rocas lunares.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'f461c85e-d1a8-7a99-70b2-ba43c9078489',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'a6b48e8b-eadd-c152-677b-ea8474e4940d',
  3,
  3,
  'Crucero por el Estrecho del Bósforo y Torre Gálata',
  41.0256,
  28.9741,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'El Bósforo separa físicamente Europa de Asia. Navegación en barco pasando junto a palacios otomanos de madera (*yalıs*) y fortalezas medievales. Por la tarde, traslado al aeropuerto para el vuelo a Kayseri o Nevşehir en Capadocia.',
  ARRAY['Crucero de 1.5 horas por el Bósforo en ferry público o barco panorámico (€5 - €15)', 'Subir a la Torre Gálata genovesa de 1348 para vista de 360 grados del Cuerno de Oro (€30)', 'Probar el sándwich de pescado a la plancha *balık ekmek* junto al puente de Gálata (€4)']::text[],
  ARRAY['Tomar el vuelo de última hora de la tarde a Capadocia para dormir ya en un hotel cueva en Göreme']::text[],
  ARRAY['El Bósforo es la única vía fluvial navegable que conecta el Mar Negro con el Mar Mediterráneo']::text[],
  '{"address":"Eminönü / Karaköy, İstanbul","priceRange":"$$ - Ferry y vuelo","dia":3,"day":3}'::jsonb,
  240,
  '{"dia":3,"day":3,"activities":["Crucero de 1.5 horas por el Bósforo en ferry público o barco panorámico (€5 - €15)","Subir a la Torre Gálata genovesa de 1348 para vista de 360 grados del Cuerno de Oro (€30)","Probar el sándwich de pescado a la plancha *balık ekmek* junto al puente de Gálata (€4)"],"datos_curiosos":["El Bósforo es la única vía fluvial navegable que conecta el Mar Negro con el Mar Mediterráneo"],"consejos":["Tomar el vuelo de última hora de la tarde a Capadocia para dormir ya en un hotel cueva en Göreme"],"location_info":{"address":"Eminönü / Karaköy, İstanbul","priceRange":"$$ - Ferry y vuelo","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'da877d94-f2ac-1e44-d456-1bf34e150712',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  4,
  'Día 4: Capadocia: Vuelo en Globo Aerostático al Amanecer y Göreme',
  'Cientos de globos sobrevolando los valles de toba volcánica y Museo al Aire Libre.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ea1014c0-c06e-5aaf-442b-e20e53262928',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'da877d94-f2ac-1e44-d456-1bf34e150712',
  4,
  4,
  'Vuelo en Globo sobre Göreme y Museo al Aire Libre',
  38.6431,
  34.8289,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'La postal cumbre de Turquía. A las 5:30 AM más de 150 globos aerostáticos ascienden simultáneamente sobre el paisaje lunar de Capadocia. Luego, visita al Museo al Aire Libre de Göreme con iglesias rupestres excavadas en la roca con frescos bizantinos del siglo X.',
  ARRAY['Vuelo en globo aerostático de 1 hora al amanecer con brindis con champán (€150 - €240 según temporada)', 'Visitar las iglesias rupestres de San Onofre y la Iglesia Oscura (Entrada: €20)', 'Cena tradicional en restaurante cueva: testi kebab (carne cocinada dentro de una vasija de barro sellada que se rompe con fuego ante el comensal: €15 - €25)']::text[],
  ARRAY['Abrigarse bien para el despegue matutino del globo; en la cesta a 800 metros de altura hace frío antes de que salga el sol']::text[],
  ARRAY['El paisaje de Capadocia se formó por las cenizas volcánicas de los volcanes Erciyes y Hasan hace millones de años, erosionadas por el viento y la lluvia en forma de chimeneas de hadas']::text[],
  '{"address":"Göreme, Nevşehir, Capadocia","priceRange":"$$$$ - Vuelo en globo","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Vuelo en globo aerostático de 1 hora al amanecer con brindis con champán (€150 - €240 según temporada)","Visitar las iglesias rupestres de San Onofre y la Iglesia Oscura (Entrada: €20)","Cena tradicional en restaurante cueva: testi kebab (carne cocinada dentro de una vasija de barro sellada que se rompe con fuego ante el comensal: €15 - €25)"],"datos_curiosos":["El paisaje de Capadocia se formó por las cenizas volcánicas de los volcanes Erciyes y Hasan hace millones de años, erosionadas por el viento y la lluvia en forma de chimeneas de hadas"],"consejos":["Abrigarse bien para el despegue matutino del globo; en la cesta a 800 metros de altura hace frío antes de que salga el sol"],"location_info":{"address":"Göreme, Nevşehir, Capadocia","priceRange":"$$$$ - Vuelo en globo","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ad62f8c9-ff8f-f154-707d-395d8cd6fcdf',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  5,
  'Día 5: Ciudad Subterránea de Derinkuyu y Valle de Ihlara',
  'Ocho pisos bajo tierra para 20.000 personas y cañón con río.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'c56b5fe3-1155-d895-8832-fd0e7dbd789b',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'ad62f8c9-ff8f-f154-707d-395d8cd6fcdf',
  5,
  5,
  'Ciudad Subterránea de Derinkuyu y Cañón de Ihlara',
  38.3736,
  34.7347,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Asombrosa obra de ingeniería subterránea que desciende hasta 85 metros de profundidad con 8 niveles visitables. Albergaba establos, pozos de ventilación, capillas y almazaras para proteger a los cristianos primitivos de las invasiones árabes.',
  ARRAY['Descender por los túneles estrechos de Derinkuyu cerrados por muelas de molino gigantes de piedra (Entrada: €13)', 'Caminata de 4 km a orillas del río por el cañón de Ihlara con iglesias en los acantilados (€15)', 'Almorzar sobre plataformas de madera flotantes en el río Melendiz (€12)']::text[],
  ARRAY['No recomendado para personas con claustrofobia severa debido a los pasadizos angostos']::text[],
  ARRAY['Derinkuyu fue descubierta por casualidad en 1963 cuando un habitante local derribó una pared de su sótano y halló una misteriosa habitación que conducía al laberinto subterráneo']::text[],
  '{"address":"Derinkuyu, Nevşehir","priceRange":"$$ - Excursión tour verde","dia":5,"day":5}'::jsonb,
  270,
  '{"dia":5,"day":5,"activities":["Descender por los túneles estrechos de Derinkuyu cerrados por muelas de molino gigantes de piedra (Entrada: €13)","Caminata de 4 km a orillas del río por el cañón de Ihlara con iglesias en los acantilados (€15)","Almorzar sobre plataformas de madera flotantes en el río Melendiz (€12)"],"datos_curiosos":["Derinkuyu fue descubierta por casualidad en 1963 cuando un habitante local derribó una pared de su sótano y halló una misteriosa habitación que conducía al laberinto subterráneo"],"consejos":["No recomendado para personas con claustrofobia severa debido a los pasadizos angostos"],"location_info":{"address":"Derinkuyu, Nevşehir","priceRange":"$$ - Excursión tour verde","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fabe92b9-881e-86ce-2983-64139afce7f4',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  6,
  'Día 6: Valle del Amor y Castillo de Uçhisar',
  'Chimeneas gigantes y el punto más alto de Capadocia tallado en la montaña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '61e4c713-9beb-7120-cf40-acd41f194b7e',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'fabe92b9-881e-86ce-2983-64139afce7f4',
  6,
  6,
  'Castillo de Uçhisar y Love Valley (Valle del Amor)',
  38.63,
  34.805,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Enorme peñasco de roca volcánica horadado por cientos de pasadizos que sirvió de fortaleza militar. La cima ofrece la vista panorámica más completa de los valles circundantes.',
  ARRAY['Subir a pie a la cima del castillo para contemplar todo el valle de Göreme (€4)', 'Caminata escénica por el Valle del Amor entre chimeneas de hadas de 40 metros (Gratis)', 'Taller artesanal de cerámica en el pueblo alfarero de Avanos (€10)']::text[],
  ARRAY['La caminata por el Valle del Amor es plana y accesible; llevar agua y sombrero']::text[],
  ARRAY['Las chimeneas de hadas tienen una roca dura de basalto en la punta que protege como un sombrero la toba blanda inferior de la lluvia']::text[],
  '{"address":"Uçhisar, Nevşehir","priceRange":"$ - Entrada €4","dia":6,"day":6}'::jsonb,
  200,
  '{"dia":6,"day":6,"activities":["Subir a pie a la cima del castillo para contemplar todo el valle de Göreme (€4)","Caminata escénica por el Valle del Amor entre chimeneas de hadas de 40 metros (Gratis)","Taller artesanal de cerámica en el pueblo alfarero de Avanos (€10)"],"datos_curiosos":["Las chimeneas de hadas tienen una roca dura de basalto en la punta que protege como un sombrero la toba blanda inferior de la lluvia"],"consejos":["La caminata por el Valle del Amor es plana y accesible; llevar agua y sombrero"],"location_info":{"address":"Uçhisar, Nevşehir","priceRange":"$ - Entrada €4","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'd8e76d82-9140-29bb-5dcd-a54044472484',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  7,
  'Día 7: Pamukkale: El Castillo de Algodón y Hierápolis',
  'Terrazas de travertino blanco con aguas termales y la piscina de Cleopatra.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '11a2f8dc-a204-7bf9-db77-319c714004af',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'd8e76d82-9140-29bb-5dcd-a54044472484',
  7,
  7,
  'Travertinos de Pamukkale y Piscina Antigua de Cleopatra',
  37.925,
  29.12,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Cascada petrificada de terrazas escalonadas de carbonato de calcio blanco como la nieve que contienen piscinas de aguas termales azul turquesa. Arriba reposan las ruinas de la ciudad balnearia romana de Hierápolis y su teatro monumental.',
  ARRAY['Caminar descalzo sobre las terrazas de travertino blanco bañándose en el agua termal a 36°C (Entrada combinada: €30)', 'Nadar entre columnas romanas antiguas sumergidas en la Piscina Antigua de Cleopatra (€10 suplemento)', 'Visitar el teatro romano de Hierápolis con capacidad para 15.000 espectadores']::text[],
  ARRAY['Es estrictamente obligatorio descalzarse antes de pisar las terrazas de travertino blanco para no manchar el mineral']::text[],
  ARRAY['Las aguas ricas en calcio de Pamukkale se han depositado a lo largo de 14.000 años creando más de 3 kilómetros de terrazas blancas']::text[],
  '{"address":"Pamukkale, Denizli","priceRange":"$$ - Entrada €30","dia":7,"day":7}'::jsonb,
  240,
  '{"dia":7,"day":7,"activities":["Caminar descalzo sobre las terrazas de travertino blanco bañándose en el agua termal a 36°C (Entrada combinada: €30)","Nadar entre columnas romanas antiguas sumergidas en la Piscina Antigua de Cleopatra (€10 suplemento)","Visitar el teatro romano de Hierápolis con capacidad para 15.000 espectadores"],"datos_curiosos":["Las aguas ricas en calcio de Pamukkale se han depositado a lo largo de 14.000 años creando más de 3 kilómetros de terrazas blancas"],"consejos":["Es estrictamente obligatorio descalzarse antes de pisar las terrazas de travertino blanco para no manchar el mineral"],"location_info":{"address":"Pamukkale, Denizli","priceRange":"$$ - Entrada €30","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '37ed1e21-8030-5d5c-ff85-896d4eae3786',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  8,
  'Día 8: Éfeso: La Biblioteca de Celso y el Gran Teatro Romano',
  'La metrópoli clásica mejor conservada del Mediterráneo oriental.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a8721b2a-8f8b-5fd0-bddb-084fa6f68856',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  '37ed1e21-8030-5d5c-ff85-896d4eae3786',
  8,
  8,
  'Ciudad Arqueológica de Éfeso y Casa de la Virgen María',
  37.94,
  27.34,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las doce ciudades jónicas de la antigüedad. Su monumento cumbre es la monumental fachada de dos plantas de la Biblioteca de Celso de mármol tallado y el Gran Teatro con capacidad para 25.000 personas donde predicó San Pablo.',
  ARRAY['Fotografiar la fachada restaurada de la Biblioteca de Celso (Entrada Éfeso: €40)', 'Caminar por la Vía de los Curetes sobre losas de mármol originales (Gratis con entrada)', 'Visita a la humilde Casa de la Virgen María en la colina de Bülbüldağı (€10)']::text[],
  ARRAY['Visitar a primera hora de la mañana; no hay sombra en las calles de mármol blanco de Éfeso y el sol refleja fuertemente']::text[],
  ARRAY['Éfeso albergaba antiguamente el Templo de Artemisa, una de las Siete Maravillas del Mundo Antiguo original, del que hoy solo sobrevive una solitaria columna']::text[],
  '{"address":"Selçuk, İzmir","priceRange":"$$ - Entrada €40","dia":8,"day":8}'::jsonb,
  240,
  '{"dia":8,"day":8,"activities":["Fotografiar la fachada restaurada de la Biblioteca de Celso (Entrada Éfeso: €40)","Caminar por la Vía de los Curetes sobre losas de mármol originales (Gratis con entrada)","Visita a la humilde Casa de la Virgen María en la colina de Bülbüldağı (€10)"],"datos_curiosos":["Éfeso albergaba antiguamente el Templo de Artemisa, una de las Siete Maravillas del Mundo Antiguo original, del que hoy solo sobrevive una solitaria columna"],"consejos":["Visitar a primera hora de la mañana; no hay sombra en las calles de mármol blanco de Éfeso y el sol refleja fuertemente"],"location_info":{"address":"Selçuk, İzmir","priceRange":"$$ - Entrada €40","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9144c0ef-4c6b-1388-72dd-173fbd0f124a',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  9,
  'Día 9: Retorno a Estambul y el Barrio Moderno de Karaköy',
  'Vuelo a Estambul, arte contemporáneo y baklava de pistacho en Karaköy Güllüoğlu.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'e3c47b6f-e988-0380-6777-18110edb4bda',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  '9144c0ef-4c6b-1388-72dd-173fbd0f124a',
  9,
  9,
  'Barrio de Karaköy y Museo de Arte Moderno de Estambul',
  41.023,
  28.98,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de retorno desde Esmirna a Estambul. Karaköy es el distrito más moderno y vibrante a orillas del Bósforo, repleto de cafés de especialidad, galerías de arte en antiguos almacenes portuarios y la cuna del mejor baklava del mundo.',
  ARRAY['Degustar el auténtico baklava de pistacho de Gaziantep con té turco en Karaköy Güllüoğlu (€6 - €12)', 'Pasear por el complejo costero peatonal de Galataport frente a los barcos (Gratis)', 'Compras de delicias turcas (*lokum*) y cerámica artesanal en las boutiques de Karaköy (€15 - €30)']::text[],
  ARRAY['En Karaköy Güllüoğlu pedir el "Havuç Dilimi" (triángulo gigante de baklava relleno de helado de leche de cabra)']::text[],
  ARRAY['Karaköy Güllüoğlu produce más de 2 toneladas de baklava artesanal al día con 40 capas de masa filo estirada a mano tan fina que se puede leer un periódico a través de ella']::text[],
  '{"address":"Kemankeş Karamustafa Paşa, Beyoğlu, İstanbul","priceRange":"$$ - Cafés y dulces","dia":9,"day":9}'::jsonb,
  180,
  '{"dia":9,"day":9,"activities":["Degustar el auténtico baklava de pistacho de Gaziantep con té turco en Karaköy Güllüoğlu (€6 - €12)","Pasear por el complejo costero peatonal de Galataport frente a los barcos (Gratis)","Compras de delicias turcas (*lokum*) y cerámica artesanal en las boutiques de Karaköy (€15 - €30)"],"datos_curiosos":["Karaköy Güllüoğlu produce más de 2 toneladas de baklava artesanal al día con 40 capas de masa filo estirada a mano tan fina que se puede leer un periódico a través de ella"],"consejos":["En Karaköy Güllüoğlu pedir el \"Havuç Dilimi\" (triángulo gigante de baklava relleno de helado de leche de cabra)"],"location_info":{"address":"Kemankeş Karamustafa Paşa, Beyoğlu, İstanbul","priceRange":"$$ - Cafés y dulces","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f9de630e-f1c5-710f-e020-8dd72e78c53a',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  10,
  'Día 10: Bazar de las Especias (Mısır Çarşısı) y Despedida',
  'Aroma a azafrán, canela y té de manzana antes del traslado al aeropuerto.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '1200db17-8338-c169-5ab8-b2d6779c7084',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  'f9de630e-f1c5-710f-e020-8dd72e78c53a',
  10,
  10,
  'Bazar de las Especias (Mercado Egipcio)',
  41.0166,
  28.9705,
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80']::text[],
  'Construido en 1660 con los impuestos del comercio otomano con Egipto. Un festival para los sentidos con montañas cónicas de curry, azafrán iraní, caviar, frutos secos y flores de té que se abren en el agua.',
  ARRAY['Comprar té de granada y especias envasadas al vacío para llevar en el equipaje (€10 - €25)', 'Tomar el último café turco preparado sobre arena caliente con una porción de lokum de rosas (€3)', 'Traslado en metro M11 o autobús Havaist al nuevo Aeropuerto Internacional de Estambul (IST) (€6)']::text[],
  ARRAY['Hacer que envasen al vacío los quesos y delicias turcas para que no desprendan aroma en el avión']::text[],
  ARRAY['Se llamó Mercado Egipcio porque fue financiado con los ingresos y tributos procedentes del eyalato otomano de Egipto']::text[],
  '{"address":"Rüstem Paşa, Fatih, İstanbul","priceRange":"$ - Compras locales","dia":10,"day":10}'::jsonb,
  150,
  '{"dia":10,"day":10,"activities":["Comprar té de granada y especias envasadas al vacío para llevar en el equipaje (€10 - €25)","Tomar el último café turco preparado sobre arena caliente con una porción de lokum de rosas (€3)","Traslado en metro M11 o autobús Havaist al nuevo Aeropuerto Internacional de Estambul (IST) (€6)"],"datos_curiosos":["Se llamó Mercado Egipcio porque fue financiado con los ingresos y tributos procedentes del eyalato otomano de Egipto"],"consejos":["Hacer que envasen al vacío los quesos y delicias turcas para que no desprendan aroma en el avión"],"location_info":{"address":"Rüstem Paşa, Fatih, İstanbul","priceRange":"$ - Compras locales","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'f8895372-ece7-c66c-5abd-6e809cd61e62',
  '0ebbdb5c-4e26-038c-6e92-9b4d3adf1fbe',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: La Gran Travesía Nipona: De Tokio al Monte Fuji, Alpes, Kioto e Hiroshima (Tokio, Japón)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-la-gran-travesia-nipona-14d',
  'La Gran Travesía Nipona: De Tokio al Monte Fuji, Alpes, Kioto e Hiroshima',
  'Japón',
  'Tokio',
  'custom',
  'La expedición maestra de 14 días a través de Japón. Megalópolis futurista en Tokio, la silueta sagrada del Monte Fuji en los lagos de Hakone, la aldea feudal de Shirakawa-go en los Alpes Japoneses, la milenaria Kioto, el castillo negro de Matsumoto, la gastronomía callejera de Osaka y el Parque Memorial de la Paz en Hiroshima.',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80']::text[],
  20160,
  1750000,
  'moderate',
  'es',
  4.99,
  310,
  980,
  ARRAY['Japón', 'Tokio', 'Monte Fuji', 'Shirakawa-go', 'Kioto', 'Osaka', 'Hiroshima', 'Mega Tour']::text[],
  true,
  'approved',
  '{"currency":"JPY","estimatedPerPersonMin":120000,"estimatedPerPersonMax":260000,"notes":"Trenes bala (~45.000 JPY total), ryokan tradicional con cena kaiseki, entradas y gastronomía"}'::jsonb,
  ARRAY['Viajeros épicos', 'Apasionados de la cultura oriental', 'Fotógrafos']::text[],
  'Marzo a Mayo y Octubre a Noviembre',
  'Itinerario fluido conectado por tren bala Shinkansen y pases regionales',
  'Estación de Tokio / Marunouchi Central, Tokio',
  ARRAY['Ruta completa de 14 días interconectada por Shinkansen', 'Puntos estratégicos para divisar el Monte Fuji', 'Guía de aldeas tradicionales gassho-zukuri']::text[],
  ARRAY['Pase de tren JR Pass / billetes de tren bala', 'Entrada al Castillo de Matsumoto y miradores', 'Gastos personales']::text[],
  ARRAY['Utilizar el servicio de envío de equipaje de hotel a hotel (*Takkyubin*) para viajar solo con mochila de mano en los tramos de montaña', 'Reservar los ryokan con aguas termales onsen con meses de antelación']::text[],
  ARRAY['Adaptador eléctrico de 2 clavijas planas (tipo A)', 'Calzado fácil de descalzar', 'Ropa por capas para los Alpes Japoneses']::text[],
  ARRAY['Tatuajes: en muchos onsen tradicionales está prohibido el acceso a personas con tatuajes visibles; cubrir con parches o reservar baño privado']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'da8faba7-c670-f35f-2535-e94bdbbdbcb7',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  1,
  'Día 1: Tokio: Shibuya y Mirador Shibuya Sky',
  'Llegada y primer contacto con el neón futurista de Tokio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b8b1dabf-b4bf-37b7-f7f6-8868e6f2dfc4',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'da8faba7-c670-f35f-2535-e94bdbbdbcb7',
  1,
  1,
  'Cruce de Shibuya y Shibuya Sky',
  35.6595,
  139.7005,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'El célebre cruce diagonal iluminado y el mirador más alto de Shibuya.',
  ARRAY['Cruzar el paso de cebra de Shibuya (Gratis)', 'Subir a Shibuya Sky (2.500 JPY)', 'Ramen tonkotsu en Ichiran (1.000 JPY)']::text[],
  ARRAY['Descansar para superar el desfase horario (jet lag)']::text[],
  ARRAY['Shibuya registra más de 2 millones de pasajeros diarios en su estación']::text[],
  '{"address":"Shibuya, Tokio","priceRange":"$$ - Mirador","dia":1,"day":1}'::jsonb,
  180,
  '{"dia":1,"day":1,"activities":["Cruzar el paso de cebra de Shibuya (Gratis)","Subir a Shibuya Sky (2.500 JPY)","Ramen tonkotsu en Ichiran (1.000 JPY)"],"datos_curiosos":["Shibuya registra más de 2 millones de pasajeros diarios en su estación"],"consejos":["Descansar para superar el desfase horario (jet lag)"],"location_info":{"address":"Shibuya, Tokio","priceRange":"$$ - Mirador","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'eb499395-61a3-8f00-a9f8-ea12d51ff1d5',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  2,
  'Día 2: Tokio Histórico: Templo Sensō-ji y Akihabara',
  'El farol rojo de Asakusa y la cultura del anime.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2c7f735d-675b-1010-7d44-461df696207b',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'eb499395-61a3-8f00-a9f8-ea12d51ff1d5',
  2,
  2,
  'Templo Sensō-ji y Akihabara',
  35.7148,
  139.7967,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'El templo más antiguo de Tokio y la meca de la tecnología.',
  ARRAY['Visitar Sensō-ji (Gratis)', 'Probar melón pan caliente (300 JPY)', 'Tiendas de figuras en Akihabara (Gratis)']::text[],
  ARRAY['Tirar monedas de 5 yenes (go-en) para la buena suerte']::text[],
  ARRAY['La moneda de 5 yenes tiene un agujero y simboliza la conexión de destino con las personas']::text[],
  '{"address":"Asakusa / Akihabara","priceRange":"$ - Entrada gratis","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Visitar Sensō-ji (Gratis)","Probar melón pan caliente (300 JPY)","Tiendas de figuras en Akihabara (Gratis)"],"datos_curiosos":["La moneda de 5 yenes tiene un agujero y simboliza la conexión de destino con las personas"],"consejos":["Tirar monedas de 5 yenes (go-en) para la buena suerte"],"location_info":{"address":"Asakusa / Akihabara","priceRange":"$ - Entrada gratis","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4cdf84a3-3b80-c601-0fea-71f8b885672b',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  3,
  'Día 3: El Volcán Sagrado: Hakone y Vistas al Monte Fuji',
  'Crucero en barco pirata por el lago Ashi y aguas termales sulfurosas de Owakudani.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af40493b-760f-d388-c5e6-3c2ea3c002f9',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '4cdf84a3-3b80-c601-0fea-71f8b885672b',
  3,
  3,
  'Lago Ashi y Valle Volcánico de Owakudani',
  35.241,
  139.02,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Hakone ofrece las vistas más célebres del cono nevado del Monte Fuji reflejado en el lago Ashi. Teleférico sobre fumarolas de azufre activas en Owakudani.',
  ARRAY['Crucero por el lago Ashi con el Hakone Freepass (~5.000 JPY pase completo)', 'Comer los famosos huevos negros (*Kuro-tamago*) cocidos en aguas termales (500 JPY)', 'Ver el torii rojo en el agua del Santuario de Hakone (Gratis)']::text[],
  ARRAY['La tradición dice que comer un huevo negro añade 7 años de vida']::text[],
  ARRAY['La cáscara del huevo se vuelve negra como el carbón por la reacción del hierro y azufre del agua volcánica']::text[],
  '{"address":"Hakone, Kanagawa","priceRange":"$$ - Hakone Pass","dia":3,"day":3}'::jsonb,
  270,
  '{"dia":3,"day":3,"activities":["Crucero por el lago Ashi con el Hakone Freepass (~5.000 JPY pase completo)","Comer los famosos huevos negros (*Kuro-tamago*) cocidos en aguas termales (500 JPY)","Ver el torii rojo en el agua del Santuario de Hakone (Gratis)"],"datos_curiosos":["La cáscara del huevo se vuelve negra como el carbón por la reacción del hierro y azufre del agua volcánica"],"consejos":["La tradición dice que comer un huevo negro añade 7 años de vida"],"location_info":{"address":"Hakone, Kanagawa","priceRange":"$$ - Hakone Pass","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f7f88523-a088-3c46-b408-27ddeddda78a',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  4,
  'Día 4: El Castillo del Cuervo Negro: Matsumoto',
  'Uno de los 12 castillos originales de madera de la era samurái.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'ecbb7b1f-c4a2-5db1-10de-7e4f2701da56',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'f7f88523-a088-3c46-b408-27ddeddda78a',
  4,
  4,
  'Castillo de Matsumoto',
  36.2388,
  137.9691,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Apodado el "Cuervo Negro" por sus muros de madera oscura. Es el castillo de cinco plantas más antiguo conservado de Japón (construido en 1594).',
  ARRAY['Subir las empinadas escaleras de madera del castillo original (Entrada: 700 JPY)', 'Pasear por el foso lleno de carpas koi con los Alpes Japoneses de fondo (Gratis)', 'Probar fideos de soba de trigo sarraceno artesanal (900 - 1.400 JPY)']::text[],
  ARRAY['Las escaleras interiores tienen una inclinación de hasta 61 grados; subir con cuidado']::text[],
  ARRAY['A diferencia de muchos castillos japoneses que fueron reconstruidos en hormigón tras la guerra, Matsumoto conserva sus vigas de pino de 400 años intactas']::text[],
  '{"address":"4-1 Marunouchi, Matsumoto, Nagano","priceRange":"$ - Entrada 700 JPY","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Subir las empinadas escaleras de madera del castillo original (Entrada: 700 JPY)","Pasear por el foso lleno de carpas koi con los Alpes Japoneses de fondo (Gratis)","Probar fideos de soba de trigo sarraceno artesanal (900 - 1.400 JPY)"],"datos_curiosos":["A diferencia de muchos castillos japoneses que fueron reconstruidos en hormigón tras la guerra, Matsumoto conserva sus vigas de pino de 400 años intactas"],"consejos":["Las escaleras interiores tienen una inclinación de hasta 61 grados; subir con cuidado"],"location_info":{"address":"4-1 Marunouchi, Matsumoto, Nagano","priceRange":"$ - Entrada 700 JPY","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ec1d4882-a4de-77a9-c515-3d7c917a3355',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  5,
  'Día 5: Los Alpes Japoneses: Aldea Tradicional de Shirakawa-go',
  'Casas de tejados de paja empinados gassho-zukuri rodeadas de arrozales.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '2c587088-a45d-d06f-588b-272908cad0e1',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'ec1d4882-a4de-77a9-c515-3d7c917a3355',
  5,
  5,
  'Aldea Histórica de Shirakawa-go (Ogimachi)',
  36.2562,
  136.9066,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Patrimonio de la Humanidad por la UNESCO. Aldea aislada en las montañas con casas de madera construidas con techos de paja inclinados a 60 grados para soportar las nevadas más pesadas de Japón.',
  ARRAY['Subir al mirador Shiroyama para ver la panorámica de toda la aldea (Gratis)', 'Entrar a la histórica Casa Wada de tres pisos de madera (Entrada: 400 JPY)', 'Probar ternera Hida a la parrilla sobre hoja de magnolia con miso (1.500 - 2.500 JPY)']::text[],
  ARRAY['El autobús Nohi Bus conecta Takayama con Shirakawa-go en 50 minutos']::text[],
  ARRAY['Gassho-zukuri significa "construido como manos en oración", recordando la forma de las manos unidas rezando']::text[],
  '{"address":"Ogimachi, Shirakawa, Gifu","priceRange":"$ - Acceso aldea libre","dia":5,"day":5}'::jsonb,
  240,
  '{"dia":5,"day":5,"activities":["Subir al mirador Shiroyama para ver la panorámica de toda la aldea (Gratis)","Entrar a la histórica Casa Wada de tres pisos de madera (Entrada: 400 JPY)","Probar ternera Hida a la parrilla sobre hoja de magnolia con miso (1.500 - 2.500 JPY)"],"datos_curiosos":["Gassho-zukuri significa \"construido como manos en oración\", recordando la forma de las manos unidas rezando"],"consejos":["El autobús Nohi Bus conecta Takayama con Shirakawa-go en 50 minutos"],"location_info":{"address":"Ogimachi, Shirakawa, Gifu","priceRange":"$ - Acceso aldea libre","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e06d715a-7359-2e36-a674-c58fef8b8db8',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  6,
  'Día 6: La Ciudad de los Samuráis: Kanazawa y Jardín Kenroku-en',
  'Uno de los tres jardines más perfectos de Japón y pan de oro comestible.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '38ef5556-f535-4136-0aa6-e350457ed2c5',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'e06d715a-7359-2e36-a674-c58fef8b8db8',
  6,
  6,
  'Jardín Kenroku-en y Barrio de Geishas Higashi Chaya',
  36.5621,
  136.6625,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Kenroku-en cumple las seis cualidades ideales del paisajismo clásico: espacio, serenidad, artificio, antigüedad, cursos de agua y magníficas vistas. En Higashi Chaya, las casas de té conservan celosías de madera.',
  ARRAY['Pasear por los estanques y puentes de piedra de Kenroku-en (Entrada: 320 JPY)', 'Comer un helado cubierto con una hoja entera de pan de oro auténtico (1.000 JPY)', 'Visitar una casa de geishas histórica Shima en Higashi Chaya (500 JPY)']::text[],
  ARRAY['Kanazawa produce el 99% de todo el pan de oro artesanal de Japón']::text[],
  ARRAY['En invierno los pinos del jardín se sostienen con conos de cuerdas llamados *Yukitsuri* para que el peso de la nieve no quiebre sus ramas']::text[],
  '{"address":"1 Kenrokumachi, Kanazawa, Ishikawa","priceRange":"$ - Entrada jardín 320 JPY","dia":6,"day":6}'::jsonb,
  210,
  '{"dia":6,"day":6,"activities":["Pasear por los estanques y puentes de piedra de Kenroku-en (Entrada: 320 JPY)","Comer un helado cubierto con una hoja entera de pan de oro auténtico (1.000 JPY)","Visitar una casa de geishas histórica Shima en Higashi Chaya (500 JPY)"],"datos_curiosos":["En invierno los pinos del jardín se sostienen con conos de cuerdas llamados *Yukitsuri* para que el peso de la nieve no quiebre sus ramas"],"consejos":["Kanazawa produce el 99% de todo el pan de oro artesanal de Japón"],"location_info":{"address":"1 Kenrokumachi, Kanazawa, Ishikawa","priceRange":"$ - Entrada jardín 320 JPY","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '9d74fbd3-4d51-e7ae-8c3d-a17dcd807644',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  7,
  'Día 7: Tren Shinkansen a Kioto: Los 10.000 Toriis de Fushimi Inari',
  'Llegada a la capital imperial y el sendero místico en la montaña.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '945bed59-eeb3-56da-ff67-c0befbd6e229',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '9d74fbd3-4d51-e7ae-8c3d-a17dcd807644',
  7,
  7,
  'Santuario Fushimi Inari-taisha',
  34.9671,
  135.7727,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Túneles bermellones infinitos en la montaña sagrada.',
  ARRAY['Caminata bajo los toriis (Gratis)', 'Fotografías al atardecer', 'Cena en Gion']::text[],
  ARRAY['Llevar calzado deportivo para subir los tramos de escaleras']::text[],
  ARRAY['Fushimi Inari cuenta con más de 30.000 santuarios filiales repartidos por todo Japón']::text[],
  '{"address":"Fushimi Inari, Kioto","priceRange":"$ - Entrada libre","dia":7,"day":7}'::jsonb,
  200,
  '{"dia":7,"day":7,"activities":["Caminata bajo los toriis (Gratis)","Fotografías al atardecer","Cena en Gion"],"datos_curiosos":["Fushimi Inari cuenta con más de 30.000 santuarios filiales repartidos por todo Japón"],"consejos":["Llevar calzado deportivo para subir los tramos de escaleras"],"location_info":{"address":"Fushimi Inari, Kioto","priceRange":"$ - Entrada libre","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '01711d35-2f73-3668-a01e-0200017a5195',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  8,
  'Día 8: Kioto Sagrado: Pabellón Dorado y Templo Kiyomizu-dera',
  'El pabellón de oro sobre el estanque y la terraza de madera sin clavos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '771a16a8-fb83-dddf-57c1-08f157c0acb4',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '01711d35-2f73-3668-a01e-0200017a5195',
  8,
  8,
  'Kinkaku-ji y Templo Kiyomizu-dera',
  34.9949,
  135.785,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Kiyomizu-dera ("Templo del Agua Pura") posee una terraza monumental de vigas de madera de zelkova construida en la ladera sin usar un solo clavo metálico.',
  ARRAY['Visitar Kinkaku-ji (500 JPY)', 'Beber de las aguas de la cascada Otowa en Kiyomizu-dera para salud, amor o éxito académico (Entrada: 400 JPY)', 'Pasear por las cuestas empedradas de Ninenzaka y Sannenzaka (Gratis)']::text[],
  ARRAY['En la cascada Otowa solo se debe beber de uno de los tres chorros; beber de los tres se considera avaricia']::text[],
  ARRAY['La expresión japonesa "saltar desde la terraza de Kiyomizu" equivale en español a "tomar una decisión valiente y definitiva"']::text[],
  '{"address":"1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto","priceRange":"$ - Entradas templos","dia":8,"day":8}'::jsonb,
  270,
  '{"dia":8,"day":8,"activities":["Visitar Kinkaku-ji (500 JPY)","Beber de las aguas de la cascada Otowa en Kiyomizu-dera para salud, amor o éxito académico (Entrada: 400 JPY)","Pasear por las cuestas empedradas de Ninenzaka y Sannenzaka (Gratis)"],"datos_curiosos":["La expresión japonesa \"saltar desde la terraza de Kiyomizu\" equivale en español a \"tomar una decisión valiente y definitiva\""],"consejos":["En la cascada Otowa solo se debe beber de uno de los tres chorros; beber de los tres se considera avaricia"],"location_info":{"address":"1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto","priceRange":"$ - Entradas templos","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4498a39d-0517-767a-ea68-768fd3099e79',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  9,
  'Día 9: Bosque de Bambú de Arashiyama y Castillo Nijo',
  'El piso de ruiseñor que canta al pisarlo para alertar de asesinos ninjas.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fc8a5181-c993-0447-7d8d-55bd02891688',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '4498a39d-0517-767a-ea68-768fd3099e79',
  9,
  9,
  'Castillo Nijo y Arashiyama',
  35.0142,
  135.7482,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80']::text[],
  'Residencia en Kioto del shōgun Tokugawa Ieyasu. Su palacio Ninomaru cuenta con el célebre "suelo de ruiseñor" (*uguisubari*), tablas de madera que chirrían emitiendo el canto de un pájaro al caminar sobre ellas para evitar ataques sorpresa.',
  ARRAY['Caminar descalzo escuchando el canto del suelo de ruiseñor (Entrada: 800 JPY)', 'Paseo por el bosque de bambú de Arashiyama (Gratis)', 'Cruzar el puente histórico Togetsukyo sobre el río Oi']::text[],
  ARRAY['Apreciar las pinturas murales originales de tigres en pan de oro de la escuela Kano']::text[],
  ARRAY['Las grapas metálicas bajo las tablas rozan los clavos al pisarlas generando el sonido intencionado']::text[],
  '{"address":"541 Nijojocho, Nakagyo Ward, Kyoto","priceRange":"$ - Entrada 800 JPY","dia":9,"day":9}'::jsonb,
  240,
  '{"dia":9,"day":9,"activities":["Caminar descalzo escuchando el canto del suelo de ruiseñor (Entrada: 800 JPY)","Paseo por el bosque de bambú de Arashiyama (Gratis)","Cruzar el puente histórico Togetsukyo sobre el río Oi"],"datos_curiosos":["Las grapas metálicas bajo las tablas rozan los clavos al pisarlas generando el sonido intencionado"],"consejos":["Apreciar las pinturas murales originales de tigres en pan de oro de la escuela Kano"],"location_info":{"address":"541 Nijojocho, Nakagyo Ward, Kyoto","priceRange":"$ - Entrada 800 JPY","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fe3e79b7-fa1e-a43b-f430-a51adcfaf109',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  10,
  'Día 10: Ciervos de Nara y Llegada a Osaka de Noche',
  'El Gran Buda de Tōdai-ji y las luces deslumbrantes de Dotonbori.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '413263b4-018e-6cf0-0d7d-82b5d510b0e5',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'fe3e79b7-fa1e-a43b-f430-a51adcfaf109',
  10,
  10,
  'Gran Buda de Tōdai-ji y Barrio Dotonbori en Osaka',
  34.6687,
  135.5013,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Mañana en Nara alimentando a los ciervos y tarde en Osaka, la capital gastronómica de Japón. El canal de Dotonbori estalla de noche con el neón del Glico Man corriendo y figuras tridimensionales gigantes de cangrejos y pulpos.',
  ARRAY['Alimentar a los ciervos de Nara y ver el Gran Buda (600 JPY)', 'Foto clásica imitando la pose del atleta de Glico Man en el puente Ebisubashi (Gratis)', 'Comer bolitas calientes de pulpo *Takoyaki* y brochetas fritas *Kushikatsu* (600 - 1.200 JPY)']::text[],
  ARRAY['Cuidado con los takoyaki recién hechos: el interior está hirviendo']::text[],
  ARRAY['En Osaka la gente saluda diciendo "¿Kari makka?" que significa literalmente "¿Cómo van los negocios?", reflejando su espíritu mercantil histórico']::text[],
  '{"address":"Dotonbori, Chuo Ward, Osaka","priceRange":"$$ - Comida callejera","dia":10,"day":10}'::jsonb,
  270,
  '{"dia":10,"day":10,"activities":["Alimentar a los ciervos de Nara y ver el Gran Buda (600 JPY)","Foto clásica imitando la pose del atleta de Glico Man en el puente Ebisubashi (Gratis)","Comer bolitas calientes de pulpo *Takoyaki* y brochetas fritas *Kushikatsu* (600 - 1.200 JPY)"],"datos_curiosos":["En Osaka la gente saluda diciendo \"¿Kari makka?\" que significa literalmente \"¿Cómo van los negocios?\", reflejando su espíritu mercantil histórico"],"consejos":["Cuidado con los takoyaki recién hechos: el interior está hirviendo"],"location_info":{"address":"Dotonbori, Chuo Ward, Osaka","priceRange":"$$ - Comida callejera","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '30c98c5b-dd9b-4889-95d3-62d3a5dbaf17',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  11,
  'Día 11: Castillo de Osaka y Shinsekai Retro',
  'La fortaleza de Toyotomi Hideyoshi y el barrio nostálgico de la Torre Tsutenkaku.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '582626af-64d7-0a3e-e261-de4c166d7bc9',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '30c98c5b-dd9b-4889-95d3-62d3a5dbaf17',
  11,
  11,
  'Castillo de Osaka y Barrio de Shinsekai',
  34.6873,
  135.5262,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Imponente castillo rodeado de fosos de agua colosales y murallas de bloques de granito ciclópeos. Shinsekai ("Nuevo Mundo") es un barrio retro de 1912 inspirado en París y Coney Island.',
  ARRAY['Subir al mirador del Castillo de Osaka con vista a los rascacielos (Entrada: 600 JPY)', 'Tocar las plantas de los pies del dios de la felicidad Billiken en Shinsekai para la buena suerte (Gratis)', 'Comer *Okonomiyaki* (pizza/tortilla japonesa a la plancha) preparado en la mesa (900 - 1.400 JPY)']::text[],
  ARRAY['Los fosos del castillo cuentan con árboles de cerezo espectaculares en primavera']::text[],
  ARRAY['La piedra más grande del muro del castillo (*Takoishi*) pesa 108 toneladas y fue transportada desde la isla de Shodoshima']::text[],
  '{"address":"1-1 Osakajo, Chuo Ward, Osaka","priceRange":"$ - Entrada 600 JPY","dia":11,"day":11}'::jsonb,
  210,
  '{"dia":11,"day":11,"activities":["Subir al mirador del Castillo de Osaka con vista a los rascacielos (Entrada: 600 JPY)","Tocar las plantas de los pies del dios de la felicidad Billiken en Shinsekai para la buena suerte (Gratis)","Comer *Okonomiyaki* (pizza/tortilla japonesa a la plancha) preparado en la mesa (900 - 1.400 JPY)"],"datos_curiosos":["La piedra más grande del muro del castillo (*Takoishi*) pesa 108 toneladas y fue transportada desde la isla de Shodoshima"],"consejos":["Los fosos del castillo cuentan con árboles de cerezo espectaculares en primavera"],"location_info":{"address":"1-1 Osakajo, Chuo Ward, Osaka","priceRange":"$ - Entrada 600 JPY","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '59667b92-7510-cf22-c305-5856fbace579',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  12,
  'Día 12: Hiroshima: El Parque Conmemorativo de la Paz y la Cúpula Genbaku',
  'Memoria histórica, la llama de la paz eterna y el mensaje de desarme nuclear.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '28723600-6218-7fce-fd06-4a4667c79d46',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '59667b92-7510-cf22-c305-5856fbace579',
  12,
  12,
  'Cúpula de la Bomba Atómica y Museo Memorial de la Paz de Hiroshima',
  34.3955,
  132.4536,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Shinkansen desde Osaka a Hiroshima (1 hora y 25 minutos). La Cúpula de la Bomba Atómica (Genbaku Dome) es la única estructura que resistió en pie cerca del epicentro del 6 de agosto de 1945, preservada exactamente como quedó.',
  ARRAY['Contemplar en silencio las ruinas de la Cúpula Genbaku (Patrimonio de la Humanidad UNESCO - Gratis)', 'Visitar el conmovedor Museo Conmemorativo de la Paz (Entrada: 200 JPY / ~$1.40 USD)', 'Hacer una grulla de papel origami en el monumento a la niña Sadako Sasaki (Gratis)']::text[],
  ARRAY['El museo es de alto impacto emocional; dedicar tiempo para procesar la visita en los jardines del parque']::text[],
  ARRAY['La Llama de la Paz arde ininterrumpidamente en el parque desde 1964 y solo se apagará cuando todas las armas nucleares del mundo hayan sido destruidas']::text[],
  '{"address":"1-2 Nakajimacho, Naka Ward, Hiroshima","priceRange":"$ - Entrada museo 200 JPY","dia":12,"day":12}'::jsonb,
  240,
  '{"dia":12,"day":12,"activities":["Contemplar en silencio las ruinas de la Cúpula Genbaku (Patrimonio de la Humanidad UNESCO - Gratis)","Visitar el conmovedor Museo Conmemorativo de la Paz (Entrada: 200 JPY / ~$1.40 USD)","Hacer una grulla de papel origami en el monumento a la niña Sadako Sasaki (Gratis)"],"datos_curiosos":["La Llama de la Paz arde ininterrumpidamente en el parque desde 1964 y solo se apagará cuando todas las armas nucleares del mundo hayan sido destruidas"],"consejos":["El museo es de alto impacto emocional; dedicar tiempo para procesar la visita en los jardines del parque"],"location_info":{"address":"1-2 Nakajimacho, Naka Ward, Hiroshima","priceRange":"$ - Entrada museo 200 JPY","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '4d376560-d16c-f76e-b922-a5e3e00b40c8',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  13,
  'Día 13: La Isla Sagrada de Miyajima y el Torii Flotante',
  'Santuario Itsukushima construido sobre pilotes en el mar y ciervos costeros.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '727264d2-d404-288c-9fc5-5588df176bf4',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '4d376560-d16c-f76e-b922-a5e3e00b40c8',
  13,
  13,
  'Santuario Itsukushima y el Gran Torii en el Mar (Miyajima)',
  34.296,
  132.3197,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Isla sagrada a 10 minutos en ferry desde Hiroshima. Su santuario sintoísta y su colosal torii bermellón de 16 metros de altura están construidos sobre el mar, pareciendo flotar mágicamente durante la marea alta.',
  ARRAY['Ferry a la isla de Miyajima (Incluido con JR Pass o 200 JPY)', 'Visitar las pasarelas sobre el agua del santuario Itsukushima (Entrada: 300 JPY)', 'Probar ostras frescas a la parrilla y el pastelito *Momiji Manju* en forma de hoja de arce (300 - 600 JPY)']::text[],
  ARRAY['Durante la marea baja se puede caminar a pie hasta la base del torii; durante la marea alta parece flotar en el agua']::text[],
  ARRAY['La isla entera era considerada tan sagrada que antiguamente no se permitían nacimientos ni entierros en su territorio para no mancillar la pureza']::text[],
  '{"address":"Miyajimacho, Hatsukaichi, Hiroshima","priceRange":"$ - Entrada 300 JPY","dia":13,"day":13}'::jsonb,
  270,
  '{"dia":13,"day":13,"activities":["Ferry a la isla de Miyajima (Incluido con JR Pass o 200 JPY)","Visitar las pasarelas sobre el agua del santuario Itsukushima (Entrada: 300 JPY)","Probar ostras frescas a la parrilla y el pastelito *Momiji Manju* en forma de hoja de arce (300 - 600 JPY)"],"datos_curiosos":["La isla entera era considerada tan sagrada que antiguamente no se permitían nacimientos ni entierros en su territorio para no mancillar la pureza"],"consejos":["Durante la marea baja se puede caminar a pie hasta la base del torii; durante la marea alta parece flotar en el agua"],"location_info":{"address":"Miyajimacho, Hatsukaichi, Hiroshima","priceRange":"$ - Entrada 300 JPY","dia":13,"day":13}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'c00ccd96-405f-19f3-7ee9-7e5175dd3fe4',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  14,
  'Día 14: Retorno a Tokio en Shinkansen y Despedida en Ginza',
  'El elegante barrio de Ginza, compras de artesanía japonesa y regreso.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '64d0bcf4-d59b-7662-34a8-9b0421fca8ad',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  'c00ccd96-405f-19f3-7ee9-7e5175dd3fe4',
  14,
  14,
  'Distrito de Ginza y Estación de Tokio',
  35.6719,
  139.765,
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80']::text[],
  'Viaje en tren bala Shinkansen de regreso a Tokio. Ginza es el distrito de tiendas insignia, galerías de arte y almacenes centenarios como Wako con su torre de reloj.',
  ARRAY['Caminar por Ginza Six y admirar las instalaciones de arte de vanguardia (Gratis)', 'Comprar cuchillos de cocina de acero japonés forjados a mano en Tsukiji (8.000 - 20.000 JPY)', 'Último almuerzo de sushi tradicional nigiri servido por maestro itamae (2.500 - 5.000 JPY)']::text[],
  ARRAY['Tomar el tren Narita Express (N''EX) desde la estación de Tokio al aeropuerto de Narita (1 hora) o monorraíl a Haneda (25 minutos)']::text[],
  ARRAY['Ginza significa literalmente "Lugar de la plata", pues aquí se ubicaba la ceca donde se acuñaban las monedas de plata del shogunato en el siglo XVII']::text[],
  '{"address":"Ginza, Chuo City, Tokyo","priceRange":"$$ - Compras finales","dia":14,"day":14}'::jsonb,
  180,
  '{"dia":14,"day":14,"activities":["Caminar por Ginza Six y admirar las instalaciones de arte de vanguardia (Gratis)","Comprar cuchillos de cocina de acero japonés forjados a mano en Tsukiji (8.000 - 20.000 JPY)","Último almuerzo de sushi tradicional nigiri servido por maestro itamae (2.500 - 5.000 JPY)"],"datos_curiosos":["Ginza significa literalmente \"Lugar de la plata\", pues aquí se ubicaba la ceca donde se acuñaban las monedas de plata del shogunato en el siglo XVII"],"consejos":["Tomar el tren Narita Express (N''EX) desde la estación de Tokio al aeropuerto de Narita (1 hora) o monorraíl a Haneda (25 minutos)"],"location_info":{"address":"Ginza, Chuo City, Tokyo","priceRange":"$$ - Compras finales","dia":14,"day":14}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  'f0928890-4163-cb71-a7ee-4be8e797729d',
  'f3aa2653-44ed-d3fe-7990-f38bfd8abded',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Egipto Faraónico: Pirámides de Guiza, Valle de los Reyes y Crucero por el Nilo (El Cairo, Egipto)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-egipto-faraonico-guiza-luxor-nilo-8d',
  'Egipto Faraónico: Pirámides de Guiza, Valle de los Reyes y Crucero por el Nilo',
  'Egipto',
  'El Cairo',
  'historical',
  'Expedición de 8 días a través de cinco mil años de historia. Las colosales Pirámides de Guiza y la Gran Esfinge, el Gran Museo Egipcio en El Cairo, crucero por el río Nilo entre templos de dioses y faraones, el Valle de los Reyes en Luxor y la majestuosidad de Abu Simbel rescatado de las aguas.',
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80']::text[],
  11520,
  980000,
  'moderate',
  'es',
  4.97,
  230,
  810,
  ARRAY['Egipto', 'El Cairo', 'Guiza', 'Pirámides', 'Nilo', 'Luxor', 'Karnak', 'Abu Simbel', 'Faraones']::text[],
  true,
  'approved',
  '{"currency":"USD","estimatedPerPersonMin":650,"estimatedPerPersonMax":1400,"notes":"Pirámides (~$15 USD), Karnak (~$12 USD), Valle de los Reyes (~$16 USD), crucero Nilo y vuelos"}'::jsonb,
  ARRAY['Apasionados de la arqueología', 'Grandes viajeros', 'Aventureros']::text[],
  'Octubre a Abril (invierno templado; evitar el calor abrasador de verano que supera 45°C)',
  'Madrugar mucho para visitar templos y pirámides entre las 6:30 AM y las 11:00 AM',
  'Complejo de las Pirámides de Guiza, El Cairo',
  ARRAY['Ruta completa de Guiza a Luxor y Asuán', 'Guía egiptológica de templos faraónicos', 'Ubicación de miradores de pirámides']::text[],
  ARRAY['Boleto de acceso al interior de la Gran Pirámide de Keops', 'Entrada a la tumba de Tutankamón', 'Crucero por el Nilo']::text[],
  ARRAY['Llevar siempre sombrero de ala ancha, gafas de sol y agua en abundancia', 'Tener billetes pequeños de libras egipcias para propinas (*baksheesh*), una costumbre arraigada en el país']::text[],
  ARRAY['Ropa transpirable de lino en colores claros', 'Calzado cómodo cerrado para arena y piedra', 'Protector solar potente']::text[],
  ARRAY['Prohibido escalar o subirse a los bloques de las pirámides (estricta sanción policial)']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '13b04032-f721-6823-020c-0ae3c89c5713',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  1,
  'Día 1: La Única Maravilla Antigua en Pie: Pirámides de Guiza y la Esfinge',
  'Keops, Kefrén, Micerino y la guardiana con cuerpo de león y rostro humano.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '5240ee10-ff06-43d3-1473-1944c96c468c',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  '13b04032-f721-6823-020c-0ae3c89c5713',
  1,
  1,
  'Pirámides de Guiza y la Gran Esfinge',
  29.9792,
  31.1342,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'La Gran Pirámide de Keops fue construida hace más de 4.500 años con 2.3 millones de bloques de piedra caliza y es la única de las Siete Maravillas del Mundo Antiguo que sobrevive. A sus pies vigila la Gran Esfinge tallada en un solo bloque monolítico.',
  ARRAY['Caminar alrededor de la Gran Pirámide de Keops (Entrada recinto Guiza: ~540 EGP / ~$11 USD)', 'Entrar a la galería interior de la pirámide de Keops (~900 EGP / ~$19 USD opcional)', 'Fotografiar la Esfinge desde el Templo del Valle de Kefrén (Gratis con entrada)']::text[],
  ARRAY['Llegar a las 7:00 AM para entrar en cuanto abren las puertas y evitar los autobuses masivos y el calor ardiente']::text[],
  ARRAY['La Gran Pirámide fue la estructura más alta construida por el ser humano durante más de 3.800 años hasta la construcción de la Catedral de Lincoln en 1311']::text[],
  '{"address":"Al Haram, Giza Governorate","priceRange":"$$ - Entrada recinto","dia":1,"day":1}'::jsonb,
  240,
  '{"dia":1,"day":1,"activities":["Caminar alrededor de la Gran Pirámide de Keops (Entrada recinto Guiza: ~540 EGP / ~$11 USD)","Entrar a la galería interior de la pirámide de Keops (~900 EGP / ~$19 USD opcional)","Fotografiar la Esfinge desde el Templo del Valle de Kefrén (Gratis con entrada)"],"datos_curiosos":["La Gran Pirámide fue la estructura más alta construida por el ser humano durante más de 3.800 años hasta la construcción de la Catedral de Lincoln en 1311"],"consejos":["Llegar a las 7:00 AM para entrar en cuanto abren las puertas y evitar los autobuses masivos y el calor ardiente"],"location_info":{"address":"Al Haram, Giza Governorate","priceRange":"$$ - Entrada recinto","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'fba847ee-c2b7-7663-dcec-53ca712a740f',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  2,
  'Día 2: El Gran Museo Egipcio y Barrio Copto de El Cairo',
  'La máscara de oro de Tutankamón y la iglesia colgante del cristianismo primitivo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '7fe97675-3462-7096-0cd0-e5b8ac4b8224',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  'fba847ee-c2b7-7663-dcec-53ca712a740f',
  2,
  2,
  'Gran Museo Egipcio (GEM) e Iglesia Colgante (Barrio Copto)',
  30.005,
  31.119,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'El mayor museo arqueológico del mundo dedicado a una sola civilización. Custodia el ajuar funerario completo del faraón Tutankamón con más de 5.000 piezas intactas. En el viejo Cairo, el Barrio Copto alberga callejuelas amuralladas e iglesias cristianas del siglo IV.',
  ARRAY['Admirar la colosal estatua de Ramsés II de 3.200 años en el atrio del museo (Entrada GEM: ~1.200 EGP / ~$25 USD)', 'Visitar la cripta de la Iglesia de San Sergio donde se refugió la Sagrada Familia en Egipto (Gratis)', 'Probar el plato nacional Koshari (arroz, lentejas, garbanzos, pasta y salsa picante: ~$2 USD)']::text[],
  ARRAY['Comprar las entradas al Gran Museo Egipcio en su portal web oficial']::text[],
  ARRAY['La máscara funeraria de Tutankamón está hecha de 11 kilos de oro macizo de 23 quilates con incrustaciones de lapislázuli, cornalina y obsidiana']::text[],
  '{"address":"Giza / Coptic Cairo","priceRange":"$$ - Entrada GEM","dia":2,"day":2}'::jsonb,
  270,
  '{"dia":2,"day":2,"activities":["Admirar la colosal estatua de Ramsés II de 3.200 años en el atrio del museo (Entrada GEM: ~1.200 EGP / ~$25 USD)","Visitar la cripta de la Iglesia de San Sergio donde se refugió la Sagrada Familia en Egipto (Gratis)","Probar el plato nacional Koshari (arroz, lentejas, garbanzos, pasta y salsa picante: ~$2 USD)"],"datos_curiosos":["La máscara funeraria de Tutankamón está hecha de 11 kilos de oro macizo de 23 quilates con incrustaciones de lapislázuli, cornalina y obsidiana"],"consejos":["Comprar las entradas al Gran Museo Egipcio en su portal web oficial"],"location_info":{"address":"Giza / Coptic Cairo","priceRange":"$$ - Entrada GEM","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '2b909da5-8e2d-8854-ff22-faf34ad247b3',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  3,
  'Día 3: Vuelo a Luxor: El Templo de Karnak y el Bosque de Columnas',
  'El complejo religioso más colosal jamás construido por la humanidad.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '86af27d2-49af-3181-e805-938246a94d9d',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  '2b909da5-8e2d-8854-ff22-faf34ad247b3',
  3,
  3,
  'Templo de Karnak y Templo de Luxor',
  25.7188,
  32.6573,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'Karnak fue ampliado durante 2.000 años por más de 30 faraones dedicados al dios Amón-Ra. Su Gran Sala Hipóstila cuenta con 134 columnas gigantescas de 24 metros cubiertas de jeroglíficos. De noche, el Templo de Luxor se ilumina junto al río Nilo.',
  ARRAY['Caminar entre las 134 columnas de la Sala Hipóstila de Karnak (Entrada: ~450 EGP / ~$9 USD)', 'Pasear por la recién restaurada Avenida de las Esfinges de 3 kilómetros que une Karnak con Luxor (Gratis con entrada)', 'Visitar el Templo de Luxor iluminado en la noche (~400 EGP)']::text[],
  ARRAY['Tocar el escarabajo sagrado de piedra de Karnak y darle 7 vueltas en sentido contrario al reloj para pedir un deseo']::text[],
  ARRAY['En la Sala Hipóstila de Karnak cabría holgadamente la Catedral de Notre-Dame de París completa']::text[],
  '{"address":"Karnak, Luxor","priceRange":"$$ - Entradas templos","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Caminar entre las 134 columnas de la Sala Hipóstila de Karnak (Entrada: ~450 EGP / ~$9 USD)","Pasear por la recién restaurada Avenida de las Esfinges de 3 kilómetros que une Karnak con Luxor (Gratis con entrada)","Visitar el Templo de Luxor iluminado en la noche (~400 EGP)"],"datos_curiosos":["En la Sala Hipóstila de Karnak cabría holgadamente la Catedral de Notre-Dame de París completa"],"consejos":["Tocar el escarabajo sagrado de piedra de Karnak y darle 7 vueltas en sentido contrario al reloj para pedir un deseo"],"location_info":{"address":"Karnak, Luxor","priceRange":"$$ - Entradas templos","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'a3e20b2c-e4a9-f7cb-b007-e3bc9be9b47e',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  4,
  'Día 4: El Valle de los Reyes y Templo Funerario de Hatshepsut',
  'Tumbas subterráneas excavadas en la montaña desértica con colores vivos intactos.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'fd186bca-9631-935d-3f90-6d2d87ea39ec',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  'a3e20b2c-e4a9-f7cb-b007-e3bc9be9b47e',
  4,
  4,
  'Valle de los Reyes y Templo de Hatshepsut',
  25.7402,
  32.6014,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'Necrópolis secreta donde fueron sepultados los faraones del Imperio Nuevo (Tutankamón, Ramsés II, Seti I). Sus pinturas murales de pigmentos minerales conservan colores brillantes como si hubieran sido pintadas ayer. El Templo de la reina Hatshepsut se integra en tres terrazas colosales al acantilado.',
  ARRAY['Descender a 3 tumbas reales incluidas en el boleto general (Entrada: ~600 EGP / ~$12 USD)', 'Entrada especial a la tumba de Tutankamón (KV62) con su momia real en urna de cristal (~500 EGP suplemento)', 'Fotografiar los dos Colosos de Memnón de 18 metros en la llanura (Gratis)']::text[],
  ARRAY['La tumba de Ramsés IV y Merenptah tienen corredores amplios y techos astronómicos azules espectaculares']::text[],
  ARRAY['Howard Carter descubrió la tumba de Tutankamón en 1922 gracias a que la entrada había quedado sepultada bajo los escombros de la construcción de la tumba vecina de Ramsés VI']::text[],
  '{"address":"West Bank, Luxor","priceRange":"$$ - Entrada Valle de los Reyes","dia":4,"day":4}'::jsonb,
  300,
  '{"dia":4,"day":4,"activities":["Descender a 3 tumbas reales incluidas en el boleto general (Entrada: ~600 EGP / ~$12 USD)","Entrada especial a la tumba de Tutankamón (KV62) con su momia real en urna de cristal (~500 EGP suplemento)","Fotografiar los dos Colosos de Memnón de 18 metros en la llanura (Gratis)"],"datos_curiosos":["Howard Carter descubrió la tumba de Tutankamón en 1922 gracias a que la entrada había quedado sepultada bajo los escombros de la construcción de la tumba vecina de Ramsés VI"],"consejos":["La tumba de Ramsés IV y Merenptah tienen corredores amplios y techos astronómicos azules espectaculares"],"location_info":{"address":"West Bank, Luxor","priceRange":"$$ - Entrada Valle de los Reyes","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'db0eece2-3d85-c1f8-4d25-8e1ade9e205a',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  5,
  'Día 5: Navegación por el Nilo: Templo de Horus en Edfu',
  'El templo faraónico mejor conservado de Egipto dedicado al dios halcón.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b6438fa5-6e82-b73e-12a0-226a68407c19',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  'db0eece2-3d85-c1f8-4d25-8e1ade9e205a',
  5,
  5,
  'Templo de Horus en Edfu',
  24.978,
  32.8735,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'Crucero navegando hacia el sur. El templo de Edfu es el monumento de la época ptolemaica más completo de todo Egipto, conservando su techo de piedra original, el pilono de entrada con colosales relieves de Horus y la barca sagrada de cedro en el santuario interior.',
  ARRAY['Llegada en carruaje tradicional de caballos desde el muelle del crucero al templo (Incluido en excursiones)', 'Ver la estatua en granito negro del dios halcón Horus con la doble corona del Alto y Bajo Egipto (Entrada: ~450 EGP)', 'Navegar sobre la cubierta del crucero viendo pasar palmerales y pescadores en falucas']::text[],
  ARRAY['Subir a la cubierta del barco por la tarde para presenciar el paso por la esclusa de Esna']::text[],
  ARRAY['El templo permaneció enterrado bajo 12 metros de arena del desierto y lodo del Nilo durante siglos, lo que lo protegió de la erosión y el expolio']::text[],
  '{"address":"Edfu, Aswan Governorate","priceRange":"$$ - Incluido en crucero","dia":5,"day":5}'::jsonb,
  180,
  '{"dia":5,"day":5,"activities":["Llegada en carruaje tradicional de caballos desde el muelle del crucero al templo (Incluido en excursiones)","Ver la estatua en granito negro del dios halcón Horus con la doble corona del Alto y Bajo Egipto (Entrada: ~450 EGP)","Navegar sobre la cubierta del crucero viendo pasar palmerales y pescadores en falucas"],"datos_curiosos":["El templo permaneció enterrado bajo 12 metros de arena del desierto y lodo del Nilo durante siglos, lo que lo protegió de la erosión y el expolio"],"consejos":["Subir a la cubierta del barco por la tarde para presenciar el paso por la esclusa de Esna"],"location_info":{"address":"Edfu, Aswan Governorate","priceRange":"$$ - Incluido en crucero","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'eaa2370d-a2b2-f5a6-1d60-0e045aabec38',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  6,
  'Día 6: Templo Doble de Kom Ombo y Llegada a Asuán',
  'Dedicado simultáneamente al dios cocodrilo Sobek y al dios halcón Haroeris.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'be2896e9-a6c2-ed22-3786-afd93b622650',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  'eaa2370d-a2b2-f5a6-1d60-0e045aabec38',
  6,
  6,
  'Templo de Kom Ombo y Museo de los Cocodrilos',
  24.452,
  32.928,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'Edificado en una curva del Nilo donde en la antigüedad se concentraban los cocodrilos sagrados. Su arquitectura es simétrica perfecta con dos entradas, dos santuarios y relieves quirúrgicos de instrumental médico romano antiguo.',
  ARRAY['Visita nocturna al templo iluminado a pocos pasos del muelle del crucero (Entrada: ~360 EGP)', 'Entrar al Museo de los Cocodrilos y ver más de 20 momias gigantes de cocodrilos reales del Nilo (Gratis con entrada)', 'Paseo en faluca tradicional de vela blanca por las islas de Asuán al atardecer ($10 - $15 USD)']::text[],
  ARRAY['Los relieves de la pared trasera del templo muestran los instrumentos quirúrgicos más antiguos documentados: bisturís, fórceps y tijeras']::text[],
  ARRAY['Los sacerdotes de Kom Ombo criaban cocodrilos en estanques sagrados que eran alimentados con carne y vino y adornados con joyas de oro']::text[],
  '{"address":"Kom Ombo, Aswan Governorate","priceRange":"$ - Entrada templo","dia":6,"day":6}'::jsonb,
  180,
  '{"dia":6,"day":6,"activities":["Visita nocturna al templo iluminado a pocos pasos del muelle del crucero (Entrada: ~360 EGP)","Entrar al Museo de los Cocodrilos y ver más de 20 momias gigantes de cocodrilos reales del Nilo (Gratis con entrada)","Paseo en faluca tradicional de vela blanca por las islas de Asuán al atardecer ($10 - $15 USD)"],"datos_curiosos":["Los sacerdotes de Kom Ombo criaban cocodrilos en estanques sagrados que eran alimentados con carne y vino y adornados con joyas de oro"],"consejos":["Los relieves de la pared trasera del templo muestran los instrumentos quirúrgicos más antiguos documentados: bisturís, fórceps y tijeras"],"location_info":{"address":"Kom Ombo, Aswan Governorate","priceRange":"$ - Entrada templo","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'f2c51fd5-cff1-06bc-d3e7-15b741f024db',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  7,
  'Día 7: La Cumbre de Ramsés II: Los Templos Colosales de Abu Simbel',
  'Los cuatro colosos de 20 metros tallados en la montaña rescatados por la UNESCO.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd8a8d8e8-7f0d-7cc8-aea4-470b949973b2',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  'f2c51fd5-cff1-06bc-d3e7-15b741f024db',
  7,
  7,
  'Gran Templo de Ramsés II y Templo de Nefertari en Abu Simbel',
  22.3372,
  31.6258,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'La mayor hazaña propagandística y de ingeniería de Ramsés II. Cuatro colosos sedentes de 20 metros tallados en el acantilado frente a Nubia. Al lado, el templo de su amada esposa Nefertari. En los años 60, toda la montaña fue cortada en bloques y reubicada 65 metros más arriba para salvarla del lago Nasser.',
  ARRAY['Asombrarse ante la colosal fachada de Ramsés II (Entrada Abu Simbel: ~600 EGP / ~$12 USD)', 'Entrar al santuario interior donde el sol ilumina las estatuas de los dioses solo dos veces al año (Gratis con entrada)', 'Pasear por la orilla del inmenso Lago Nasser']::text[],
  ARRAY['La excursión sale en convoy desde Asuán a las 4:00 AM (3 horas por carretera en el desierto) o en vuelo corto de 40 minutos']::text[],
  ARRAY['La UNESCO cortó los templos en más de 1.000 bloques gigantes de hasta 30 toneladas cada uno para reensamblarlos milimétricamente en una colina artificial de hormigón']::text[],
  '{"address":"Abu Simbel, Aswan Governorate","priceRange":"$$$ - Excursión desde Asuán","dia":7,"day":7}'::jsonb,
  240,
  '{"dia":7,"day":7,"activities":["Asombrarse ante la colosal fachada de Ramsés II (Entrada Abu Simbel: ~600 EGP / ~$12 USD)","Entrar al santuario interior donde el sol ilumina las estatuas de los dioses solo dos veces al año (Gratis con entrada)","Pasear por la orilla del inmenso Lago Nasser"],"datos_curiosos":["La UNESCO cortó los templos en más de 1.000 bloques gigantes de hasta 30 toneladas cada uno para reensamblarlos milimétricamente en una colina artificial de hormigón"],"consejos":["La excursión sale en convoy desde Asuán a las 4:00 AM (3 horas por carretera en el desierto) o en vuelo corto de 40 minutos"],"location_info":{"address":"Abu Simbel, Aswan Governorate","priceRange":"$$$ - Excursión desde Asuán","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8ebcc446-8484-e5b1-6e61-39f065cc685f',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  8,
  'Día 8: Poblado Nubio de Asuán y Retorno a El Cairo',
  'Casas de colores en el Nilo, especias africanas y vuelo internacional.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a516f4a6-082f-0f66-ce22-79c97cea83e6',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  '8ebcc446-8484-e5b1-6e61-39f065cc685f',
  8,
  8,
  'Aldea Nubia de Gharb Soheil y Retorno',
  24.055,
  32.87,
  'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80']::text[],
  'Pueblo tradicional del pueblo nubio a orillas de la primera catarata del Nilo con casas abovedadas pintadas de vivos azules, amarillos y blancos, donde se conservan tradiciones y música ancestral.',
  ARRAY['Paseo en lancha a motor cruzando los rápidos de la primera catarata hacia el poblado ($15 USD)', 'Tomar té de hibisco (*karkadeh*) en una casa tradicional nubia (€2)', 'Vuelo de retorno de Asuán a El Cairo para conexión internacional']::text[],
  ARRAY['Excelente lugar para comprar especias de alta calidad como comino negro, incienso y henna natural']::text[],
  ARRAY['En muchas casas nubias los habitantes crían pequeños cocodrilos en estanques como símbolo de protección contra el mal de ojo']::text[],
  '{"address":"Gharb Soheil, Aswan","priceRange":"$ - Visita comunitaria","dia":8,"day":8}'::jsonb,
  180,
  '{"dia":8,"day":8,"activities":["Paseo en lancha a motor cruzando los rápidos de la primera catarata hacia el poblado ($15 USD)","Tomar té de hibisco (*karkadeh*) en una casa tradicional nubia (€2)","Vuelo de retorno de Asuán a El Cairo para conexión internacional"],"datos_curiosos":["En muchas casas nubias los habitantes crían pequeños cocodrilos en estanques como símbolo de protección contra el mal de ojo"],"consejos":["Excelente lugar para comprar especias de alta calidad como comino negro, incienso y henna natural"],"location_info":{"address":"Gharb Soheil, Aswan","priceRange":"$ - Visita comunitaria","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '0ad453fb-404c-59b1-4d2f-57dc6e7c0167',
  '59a0c0fb-690f-db85-206f-87b595fdd84b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

-- -------------------------------------------------------------
-- Tour: Australia Extrema: De la Ópera de Sídney a la Gran Barrera de Coral y Selva Tropical (Sídney, Australia)
-- -------------------------------------------------------------
INSERT INTO public.tours (
  id, owner_id, created_by, slug, title, country, city, type,
  description, cover_url, gallery, duration_minutes, distance_meters,
  difficulty, language, rating, review_count, likes_count, tags,
  is_published, moderation_status, budget, recommended_audience,
  best_season, recommended_schedule, meeting_point, includes, excludes,
  recommendations, what_to_bring, tour_rules, creation_json, created_at, updated_at
) VALUES (
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  'vibetour-australia-extrema-barrera-sydney-12d',
  'Australia Extrema: De la Ópera de Sídney a la Gran Barrera de Coral y Selva Tropical',
  'Australia',
  'Sídney',
  'sports',
  'La gran aventura australiana de 12 días. La emblemática Ópera de Sídney y las olas de Bondi Beach, senderismo en las Montañas Azules, buceo y snorkel en el mayor arrecife de coral del planeta en Cairns, y expedición en la milenaria selva tropical de Daintree.',
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80']::text[],
  17280,
  2450000,
  'moderate',
  'es',
  4.98,
  215,
  760,
  ARRAY['Australia', 'Sídney', 'Gran Barrera de Coral', 'Cairns', 'Bondi Beach', 'Koalas', 'Aventura', 'Snorkel']::text[],
  true,
  'approved',
  '{"currency":"AUD","estimatedPerPersonMin":1400,"estimatedPerPersonMax":2900,"notes":"Catamarán Gran Barrera (~$250 AUD), vuelos internos, entradas y gastronomía aussie"}'::jsonb,
  ARRAY['Aventureros', 'Amantes de la fauna marina', 'Buceadores y surfistas']::text[],
  'Mayo a Octubre (menos humedad y mejor visibilidad submarina en la Gran Barrera)',
  'Actividades al aire libre y deportes acuáticos en las horas de sol',
  'Sydney Opera House / Circular Quay, Sídney',
  ARRAY['Ruta completa de Sídney y Queensland tropical', 'Coordenadas de arrecifes protegidos de la Gran Barrera', 'Guía de senderos costeros y fauna autóctona']::text[],
  ARRAY['Vuelo doméstico Sídney - Cairns', 'Bautizo de buceo con botella en arrecife exterior', 'Ferry y teleférico Skyrail']::text[],
  ARRAY['El sol en Australia es sumamente fuerte debido a la capa de ozono; usar protector solar 50+ cada dos horas', 'Llevar traje de neopreno/lycra para nadar en el norte tropical']::text[],
  ARRAY['Gafas de sol polarizadas', 'Traje de baño', 'Calzado de trekking ligero', 'Adaptador australiano (tipo I)']::text[],
  ARRAY['Estrictamente prohibido tocar o pisar las formaciones de coral vivo en la Gran Barrera']::text[],
  '{"source":"vibetours_official_curated_seed","scope":"city_to_city","curated_by":"Emotiva VibeTours"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '8eaac9e6-9e69-d463-5217-7ca58990d581',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  1,
  'Día 1: Sídney Icónico: Circular Quay, Ópera y Puente del Puerto',
  'Las velas de concha de la Ópera y la bahía natural más hermosa del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '87af9d49-ac76-91f2-341d-a398a8ca8730',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '8eaac9e6-9e69-d463-5217-7ca58990d581',
  1,
  1,
  'Sydney Opera House y Sydney Harbour Bridge',
  -33.8568,
  151.2153,
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80']::text[],
  'Obra cumbre de la arquitectura del siglo XX diseñada por Jørn Utzon con sus velas cerámicas sobre el agua. Enfrente, el colosal arco de acero del Sydney Harbour Bridge ("el perchero").',
  ARRAY['Tour guiado por el interior de las salas de conciertos de la Ópera ($43 AUD)', 'Caminar sobre la pasarela peatonal del Harbour Bridge para vista panorámica gratuita de la bahía (Gratis)', 'Tomar una cerveza artesanal australiana en el Opera Bar junto al agua ($12 - $16 AUD)']::text[],
  ARRAY['La caminata peatonal por el puente del puerto es completamente gratuita y ofrece una de las mejores vistas del mundo']::text[],
  ARRAY['Las conchas del tejado de la Ópera están cubiertas por más de 1.056.000 azulejos de cerámica sueca autolimpiables']::text[],
  '{"address":"Bennelong Point, Sydney NSW 2000","priceRange":"$$ - Tour ópera","dia":1,"day":1}'::jsonb,
  210,
  '{"dia":1,"day":1,"activities":["Tour guiado por el interior de las salas de conciertos de la Ópera ($43 AUD)","Caminar sobre la pasarela peatonal del Harbour Bridge para vista panorámica gratuita de la bahía (Gratis)","Tomar una cerveza artesanal australiana en el Opera Bar junto al agua ($12 - $16 AUD)"],"datos_curiosos":["Las conchas del tejado de la Ópera están cubiertas por más de 1.056.000 azulejos de cerámica sueca autolimpiables"],"consejos":["La caminata peatonal por el puente del puerto es completamente gratuita y ofrece una de las mejores vistas del mundo"],"location_info":{"address":"Bennelong Point, Sydney NSW 2000","priceRange":"$$ - Tour ópera","dia":1,"day":1}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '5926fb11-c225-ca14-f75d-92e4603237d3',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  2,
  'Día 2: Surf y Sendero Costero: Bondi to Coogee Walk',
  'La piscina marina de Bondi Icebergs y acantilados sobre el océano Pacífico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af348712-0c9c-ec5d-5170-2c41434b2ce7',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '5926fb11-c225-ca14-f75d-92e4603237d3',
  2,
  2,
  'Playa de Bondi y Sendero Costero Bondi to Coogee',
  -33.8915,
  151.2767,
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80']::text[],
  'La playa de surf más célebre de Australia. A su costado, la icónica piscina de agua salada de Bondi Icebergs donde rompen las olas del mar. El sendero costero de 6 kilómetros bordea acantilados dorados y calas vírgenes.',
  ARRAY['Nadar en la piscina oceánica de Bondi Icebergs (Entrada: $10 AUD)', 'Caminata escénica de 2 horas por los acantilados de Bondi a Coogee (Gratis)', 'Clase de surf para principiantes en las olas de Bondi ($80 - $110 AUD)']::text[],
  ARRAY['Nadar siempre estrictamente entre las banderas rojas y amarillas patrulladas por los salvavidas']::text[],
  ARRAY['Bondi Beach es la cuna del primer club de salvamento marítimo del mundo (*Surf Life Saving Club*), fundado en 1907']::text[],
  '{"address":"Bondi Beach, NSW 2026","priceRange":"$ - Acceso libre","dia":2,"day":2}'::jsonb,
  240,
  '{"dia":2,"day":2,"activities":["Nadar en la piscina oceánica de Bondi Icebergs (Entrada: $10 AUD)","Caminata escénica de 2 horas por los acantilados de Bondi a Coogee (Gratis)","Clase de surf para principiantes en las olas de Bondi ($80 - $110 AUD)"],"datos_curiosos":["Bondi Beach es la cuna del primer club de salvamento marítimo del mundo (*Surf Life Saving Club*), fundado en 1907"],"consejos":["Nadar siempre estrictamente entre las banderas rojas y amarillas patrulladas por los salvavidas"],"location_info":{"address":"Bondi Beach, NSW 2026","priceRange":"$ - Acceso libre","dia":2,"day":2}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'ac91ab80-beab-ec43-1ad7-f43e66b50988',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  3,
  'Día 3: Blue Mountains: Las Tres Hermanas y Valles de Eucaliptos',
  'El cañón azul de niebla de eucalipto y el tren más inclinado del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'a148ac56-c061-e3ca-877f-9c1faaae8106',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  'ac91ab80-beab-ec43-1ad7-f43e66b50988',
  3,
  3,
  'Three Sisters en Echo Point (Blue Mountains)',
  -33.732,
  150.312,
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80']::text[],
  'Parque Nacional a 2 horas en tren desde Sídney. Famoso por las tres agujas de arenisca conocidas como las "Tres Hermanas" que dominan el valle Jamison cubierto por millones de árboles de eucalipto que emiten una bruma azulada.',
  ARRAY['Mirador panorámico de Echo Point sobre las Tres Hermanas (Gratis)', 'Bajar al valle en Scenic Railway, el tren de pasajeros más empinado del mundo con 52 grados de pendiente ($55 AUD pase Scenic World)', 'Senderismo entre cascadas en Wentworth Falls (Gratis)']::text[],
  ARRAY['El tren de cercanías de NSW TrainLink sale cada hora desde Sydney Central hasta Katoomba ($7 AUD con tarjeta Opal)']::text[],
  ARRAY['El color azul que da nombre a las montañas se debe a la evaporación del aceite de las hojas de millones de eucaliptos, que dispersa la luz azul en la atmósfera']::text[],
  '{"address":"Echo Point Rd, Katoomba NSW 2780","priceRange":"$$ - Tren y miradores","dia":3,"day":3}'::jsonb,
  300,
  '{"dia":3,"day":3,"activities":["Mirador panorámico de Echo Point sobre las Tres Hermanas (Gratis)","Bajar al valle en Scenic Railway, el tren de pasajeros más empinado del mundo con 52 grados de pendiente ($55 AUD pase Scenic World)","Senderismo entre cascadas en Wentworth Falls (Gratis)"],"datos_curiosos":["El color azul que da nombre a las montañas se debe a la evaporación del aceite de las hojas de millones de eucaliptos, que dispersa la luz azul en la atmósfera"],"consejos":["El tren de cercanías de NSW TrainLink sale cada hora desde Sydney Central hasta Katoomba ($7 AUD con tarjeta Opal)"],"location_info":{"address":"Echo Point Rd, Katoomba NSW 2780","priceRange":"$$ - Tren y miradores","dia":3,"day":3}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '382484aa-b24c-a8ae-0276-4b867186c4dc',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  4,
  'Día 4: Vuelo al Norte Tropical: Cairns y la Laguna Costera',
  'Llegada a Queensland tropical y piscina artificial en el malecón.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'aeb55780-1277-ec43-269e-7a11b583a532',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '382484aa-b24c-a8ae-0276-4b867186c4dc',
  4,
  4,
  'Cairns Esplanade Lagoon',
  -16.9186,
  145.778,
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de 3 horas de Sídney a Cairns, la puerta de entrada a la Gran Barrera de Coral. Su malecón cuenta con una inmensa piscina de agua salada de 4.800 m² pública y segura con arena blanca.',
  ARRAY['Baño gratuito en la laguna pública de la Explanada de Cairns (Gratis)', 'Cena de pescado barramundi a la parrilla con ensalada tropical ($30 - $45 AUD)', 'Visitar el mercado nocturno Cairns Night Markets para artesanías aborígenes ($10 - $30 AUD)']::text[],
  ARRAY['En la costa de Cairns no se debe nadar en el mar abierto por presencia de cocodrilos marinos y medusas; usar siempre la laguna artificial protegida']::text[],
  ARRAY['La laguna de Cairns cuenta con agua de mar filtrada y salvavidas permanentes abierta todo el año sin costo alguno']::text[],
  '{"address":"Esplanade, Cairns QLD 4870","priceRange":"$ - Acceso gratuito","dia":4,"day":4}'::jsonb,
  180,
  '{"dia":4,"day":4,"activities":["Baño gratuito en la laguna pública de la Explanada de Cairns (Gratis)","Cena de pescado barramundi a la parrilla con ensalada tropical ($30 - $45 AUD)","Visitar el mercado nocturno Cairns Night Markets para artesanías aborígenes ($10 - $30 AUD)"],"datos_curiosos":["La laguna de Cairns cuenta con agua de mar filtrada y salvavidas permanentes abierta todo el año sin costo alguno"],"consejos":["En la costa de Cairns no se debe nadar en el mar abierto por presencia de cocodrilos marinos y medusas; usar siempre la laguna artificial protegida"],"location_info":{"address":"Esplanade, Cairns QLD 4870","priceRange":"$ - Acceso gratuito","dia":4,"day":4}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7c57c54e-7226-3512-ee6a-adcc85575dcd',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  5,
  'Día 5: La Maravilla Viva: Snorkel en la Gran Barrera de Coral Exterior',
  'El mayor ser vivo de la Tierra visible desde el espacio.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b63b9f84-ba4b-bb90-909c-438401f03e1a',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '7c57c54e-7226-3512-ee6a-adcc85575dcd',
  5,
  5,
  'Gran Barrera de Coral: Arrecifes Hastings y Saxon',
  -16.516,
  145.983,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'El mayor ecosistema de arrecifes del planeta, con 2.300 kilómetros de longitud. Navegación en catamarán de alta velocidad hasta el arrecife exterior con jardines de coral duros y blandos, tortugas marinas verdes, peces payaso y almejas gigantes.',
  ARRAY['Snorkel guiado con biólogo marino en el arrecife exterior (Tour catamarán de día completo con almuerzo: ~$220 - $280 AUD)', 'Bautizo de buceo con botella para principiantes con instructor ($80 AUD opcional)', 'Paseo en semisumergible con fondo de cristal para ver los fondos sin mojarse (Incluido en el tour)']::text[],
  ARRAY['Tomar una pastilla contra el mareo antes de zarpar en el catamarán; el trayecto por mar abierto puede tener oleaje']::text[],
  ARRAY['La Gran Barrera de Coral no es un solo arrecife, sino un laberinto colosal de casi 3.000 arrecifes individuales y 900 islas']::text[],
  '{"address":"Outer Great Barrier Reef, QLD","priceRange":"$$$$ - Tour arrecife","dia":5,"day":5}'::jsonb,
  360,
  '{"dia":5,"day":5,"activities":["Snorkel guiado con biólogo marino en el arrecife exterior (Tour catamarán de día completo con almuerzo: ~$220 - $280 AUD)","Bautizo de buceo con botella para principiantes con instructor ($80 AUD opcional)","Paseo en semisumergible con fondo de cristal para ver los fondos sin mojarse (Incluido en el tour)"],"datos_curiosos":["La Gran Barrera de Coral no es un solo arrecife, sino un laberinto colosal de casi 3.000 arrecifes individuales y 900 islas"],"consejos":["Tomar una pastilla contra el mareo antes de zarpar en el catamarán; el trayecto por mar abierto puede tener oleaje"],"location_info":{"address":"Outer Great Barrier Reef, QLD","priceRange":"$$$$ - Tour arrecife","dia":5,"day":5}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '086291f4-e91b-ae81-e69c-77a301a0ae16',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  6,
  'Día 6: Isla Verde (Green Island): Cayo de Coral en la Selva Marina',
  'Cayo de coral con bosque tropical y playas de arena blanca.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd1bed03c-cd01-384a-ab58-c2905d6feb08',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '086291f4-e91b-ae81-e69c-77a301a0ae16',
  6,
  6,
  'Green Island y Paseo de Selva Tropical Marina',
  -16.76,
  145.974,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80']::text[],
  'Un cayo de arena coralina de 6.000 años de antigüedad que alberga una densa selva tropical en su interior rodeada por arrecifes de coral a escasos metros de la playa.',
  ARRAY['Ferry rápido de 45 minutos desde Cairns hasta Green Island ($110 AUD ida y vuelta)', 'Nadar directamente desde la playa entre tortugas marinas que pastan praderas de pastos marinos (Gratis con equipo de snorkel)', 'Caminata autoguiada por el paseo de madera bajo el dosel del bosque tropical (Gratis)']::text[],
  ARRAY['Ideal para familias o viajeros que prefieren hacer snorkel desde la comodidad de la playa']::text[],
  ARRAY['Es uno de los únicos 300 cayos de coral del mundo que ha desarrollado su propio bosque tropical completo']::text[],
  '{"address":"Green Island, Great Barrier Reef","priceRange":"$$ - Ferry a la isla","dia":6,"day":6}'::jsonb,
  270,
  '{"dia":6,"day":6,"activities":["Ferry rápido de 45 minutos desde Cairns hasta Green Island ($110 AUD ida y vuelta)","Nadar directamente desde la playa entre tortugas marinas que pastan praderas de pastos marinos (Gratis con equipo de snorkel)","Caminata autoguiada por el paseo de madera bajo el dosel del bosque tropical (Gratis)"],"datos_curiosos":["Es uno de los únicos 300 cayos de coral del mundo que ha desarrollado su propio bosque tropical completo"],"consejos":["Ideal para familias o viajeros que prefieren hacer snorkel desde la comodidad de la playa"],"location_info":{"address":"Green Island, Great Barrier Reef","priceRange":"$$ - Ferry a la isla","dia":6,"day":6}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '37d17b06-177a-1fb0-f2e0-79162197499a',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  7,
  'Día 7: Teleférico Skyrail y Pueblo Bohemio de Kuranda',
  'Vuelo en teleférico sobre las copas de la selva tropical más antigua del mundo.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'eae240ed-a146-4f77-4604-63ca1bae9bb5',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '37d17b06-177a-1fb0-f2e0-79162197499a',
  7,
  7,
  'Skyrail Rainforest Cableway y Cascada Barron Falls',
  -16.85,
  145.67,
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80']::text[],
  'Teleférico de 7.5 kilómetros que sobrevuela a escasos metros las copas de los árboles de la selva tropical húmeda declarada Patrimonio Mundial. Paradas en pasarelas sobre la garganta de las cataratas Barron.',
  ARRAY['Vuelo panorámico en teleférico Skyrail con cabina de suelo de cristal ($62 AUD)', 'Mirador de la garganta profunda de Barron Falls (Gratis con el teleférico)', 'Pasear por el mercado artesanal de Kuranda y ver koalas en Kuranda Koala Gardens ($22 AUD)']::text[],
  ARRAY['Hacer la subida en el teleférico Skyrail y el regreso en el histórico tren escénico Kuranda Scenic Railway de madera']::text[],
  ARRAY['La selva tropical de Queensland tiene más de 135 millones de años, siendo significativamente más antigua que la selva del Amazonas']::text[],
  '{"address":"Kuranda, Queensland","priceRange":"$$ - Teleférico","dia":7,"day":7}'::jsonb,
  300,
  '{"dia":7,"day":7,"activities":["Vuelo panorámico en teleférico Skyrail con cabina de suelo de cristal ($62 AUD)","Mirador de la garganta profunda de Barron Falls (Gratis con el teleférico)","Pasear por el mercado artesanal de Kuranda y ver koalas en Kuranda Koala Gardens ($22 AUD)"],"datos_curiosos":["La selva tropical de Queensland tiene más de 135 millones de años, siendo significativamente más antigua que la selva del Amazonas"],"consejos":["Hacer la subida en el teleférico Skyrail y el regreso en el histórico tren escénico Kuranda Scenic Railway de madera"],"location_info":{"address":"Kuranda, Queensland","priceRange":"$$ - Teleférico","dia":7,"day":7}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  'e5890daa-6ac8-4d78-3645-d85ec9bebdec',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  8,
  'Día 8: Selva Tropical de Daintree y Cabo Tribulación',
  'Donde la selva tropical se encuentra directamente con el arrecife de coral.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '499f6236-d5b0-7a3c-7d38-d2ff0190a803',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  'e5890daa-6ac8-4d78-3645-d85ec9bebdec',
  8,
  8,
  'Parque Nacional Daintree y Cape Tribulation',
  -16.0833,
  145.4667,
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80']::text[],
  'El único lugar de la Tierra donde dos patrimonios mundiales de la UNESCO se tocan físicamente: el arrecife de coral y la selva tropical de Daintree. Hogar del casuario, ave prehistórica gigante en peligro de extinción.',
  ARRAY['Crucero de avistamiento de cocodrilos de agua salada salvajes en el río Daintree ($35 AUD)', 'Caminar por las pasarelas de Dubuji entre manglares y helechos milenarios (Gratis)', 'Fotografía en el mirador de Cape Tribulation donde desembarcó el Capitán Cook en 1770 (Gratis)']::text[],
  ARRAY['Cruzar el río Daintree a bordo del transbordador por cable Daintree River Ferry ($47 AUD por vehículo ida y vuelta)']::text[],
  ARRAY['El casuario (*Casuarius*) desciende directamente de los dinosaurios terópodos y posee una cresta ósea y garras afiladas de 12 centímetros']::text[],
  '{"address":"Cape Tribulation Rd, QLD 4873","priceRange":"$$ - Excursión selva","dia":8,"day":8}'::jsonb,
  360,
  '{"dia":8,"day":8,"activities":["Crucero de avistamiento de cocodrilos de agua salada salvajes en el río Daintree ($35 AUD)","Caminar por las pasarelas de Dubuji entre manglares y helechos milenarios (Gratis)","Fotografía en el mirador de Cape Tribulation donde desembarcó el Capitán Cook en 1770 (Gratis)"],"datos_curiosos":["El casuario (*Casuarius*) desciende directamente de los dinosaurios terópodos y posee una cresta ósea y garras afiladas de 12 centímetros"],"consejos":["Cruzar el río Daintree a bordo del transbordador por cable Daintree River Ferry ($47 AUD por vehículo ida y vuelta)"],"location_info":{"address":"Cape Tribulation Rd, QLD 4873","priceRange":"$$ - Excursión selva","dia":8,"day":8}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '7e00a267-5a00-6c89-008e-6c145ee8754d',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  9,
  'Día 9: Vuelo a Melbourne: Callejones de Arte Urbano y Cafés de Especialidad',
  'La capital cultural de Australia: grafitis en Hosier Lane y tranvía histórico.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'af58b18c-b8a2-287a-9aa4-52340185696f',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '7e00a267-5a00-6c89-008e-6c145ee8754d',
  9,
  9,
  'Hosier Lane, Federation Square y Flinders Street Station',
  -37.8167,
  144.969,
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80']::text[],
  'Vuelo de Cairns a Melbourne. La ciudad de los callejones laberínticos (*laneways*) famosos por su arte urbano cambiante como Hosier Lane, su cultura obsesiva por el café de especialidad y la icónica fachada amarilla de la estación de Flinders Street.',
  ARRAY['Fotografiar los murales de arte urbano en constante renovación en Hosier Lane (Gratis)', 'Pedir un café Flat White auténtico en Brother Baba Budan o Patricia Coffee Brewers ($5 AUD)', 'Pasear en el tranvía histórico gratuito City Circle Tram número 35 (Gratis)']::text[],
  ARRAY['En el centro de Melbourne (CBD) todo el transporte en tranvía dentro de la "Free Tram Zone" es 100% gratuito']::text[],
  ARRAY['Melbourne ha sido elegida siete veces consecutivas como la ciudad con mejor calidad de vida del planeta según el ranking de *The Economist*']::text[],
  '{"address":"Hosier Ln, Melbourne VIC 3000","priceRange":"$ - Acceso libre","dia":9,"day":9}'::jsonb,
  210,
  '{"dia":9,"day":9,"activities":["Fotografiar los murales de arte urbano en constante renovación en Hosier Lane (Gratis)","Pedir un café Flat White auténtico en Brother Baba Budan o Patricia Coffee Brewers ($5 AUD)","Pasear en el tranvía histórico gratuito City Circle Tram número 35 (Gratis)"],"datos_curiosos":["Melbourne ha sido elegida siete veces consecutivas como la ciudad con mejor calidad de vida del planeta según el ranking de *The Economist*"],"consejos":["En el centro de Melbourne (CBD) todo el transporte en tranvía dentro de la \"Free Tram Zone\" es 100% gratuito"],"location_info":{"address":"Hosier Ln, Melbourne VIC 3000","priceRange":"$ - Acceso libre","dia":9,"day":9}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '0865312a-78e4-eb8d-9fc2-2010f5ae0384',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  10,
  'Día 10: La Gran Ruta Oceánica: Los Doce Apóstoles en el Océano Austral',
  'Columnas gigantes de piedra caliza que resisten la furia del mar salvaje.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  '21f0fb66-5f8c-3ce8-99d9-26a322d91cac',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '0865312a-78e4-eb8d-9fc2-2010f5ae0384',
  10,
  10,
  'Los Doce Apóstoles (Twelve Apostles) en Great Ocean Road',
  -38.6658,
  143.1044,
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80']::text[],
  'Una de las carreteras escénicas costeras más espectaculares del mundo. En Port Campbell se alzan monumentales agujas de roca caliza de hasta 45 metros de altura aisladas en el mar batiendo contra las olas gigantes del Océano Austral.',
  ARRAY['Caminar por las pasarelas del mirador de los Doce Apóstoles al atardecer (Gratis)', 'Bajar por los escalones Gibson Steps hasta la arena al pie de los acantilados (Gratis)', 'Avistar koalas salvajes durmiendo en las ramas de eucalipto en Kennett River']::text[],
  ARRAY['Excursión de día completo desde Melbourne (aprox. 12 horas con paradas escénicas en tour o coche de alquiler: ~$130 - $180 AUD)']::text[],
  ARRAY['La Great Ocean Road fue construida a pico y pala por soldados que regresaron de la Primera Guerra Mundial entre 1919 y 1932 como monumento conmemorativo a sus compañeros caídos']::text[],
  '{"address":"Great Ocean Rd, Princetown VIC 3269","priceRange":"$$ - Excursión costera","dia":10,"day":10}'::jsonb,
  360,
  '{"dia":10,"day":10,"activities":["Caminar por las pasarelas del mirador de los Doce Apóstoles al atardecer (Gratis)","Bajar por los escalones Gibson Steps hasta la arena al pie de los acantilados (Gratis)","Avistar koalas salvajes durmiendo en las ramas de eucalipto en Kennett River"],"datos_curiosos":["La Great Ocean Road fue construida a pico y pala por soldados que regresaron de la Primera Guerra Mundial entre 1919 y 1932 como monumento conmemorativo a sus compañeros caídos"],"consejos":["Excursión de día completo desde Melbourne (aprox. 12 horas con paradas escénicas en tour o coche de alquiler: ~$130 - $180 AUD)"],"location_info":{"address":"Great Ocean Rd, Princetown VIC 3269","priceRange":"$$ - Excursión costera","dia":10,"day":10}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '3d9d9190-b44d-df25-687d-204fd8d46056',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  11,
  'Día 11: Los Pingüinos Pequeños de Phillip Island al Atardecer',
  'Cientos de pingüinos diminutos regresando del mar a sus madrigueras en la arena.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'd5a25dd2-5b01-6d8d-29ee-fe024b813178',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '3d9d9190-b44d-df25-687d-204fd8d46056',
  11,
  11,
  'Phillip Island: El Desfile de Pingüinos (Penguin Parade)',
  -38.508,
  145.147,
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80']::text[],
  'Santuario natural en una isla unida por puente a 90 minutos de Melbourne. Cada día al caer el sol, cientos de pequeños pingüinos azules (*Eudyptula minor*), la especie de pingüino más diminuta del planeta (33 cm), salen del mar en grupos coordinados para alimentar a sus crías.',
  ARRAY['Ver el desfile de pingüinos desde las gradas de la playa al anochecer (Entrada general: $30 AUD)', 'Paseo por las pasarelas de Nobbies con vista a los lobos marinos (Gratis)', 'Cena con pescado fresco en el pueblo de Cowes ($25 AUD)']::text[],
  ARRAY['Está estrictamente prohibido tomar fotos o vídeos durante el desfile de pingüinos para proteger los ojos sensibles de las aves del flash']::text[],
  ARRAY['Los pingüinos azules pesan apenas un kilo y pasan hasta semanas enteras nadando en el mar abierto pescando antes de regresar a tierra']::text[],
  '{"address":"1019 Ventnor Rd, Summerlands VIC 3922","priceRange":"$$ - Entrada $30 AUD","dia":11,"day":11}'::jsonb,
  240,
  '{"dia":11,"day":11,"activities":["Ver el desfile de pingüinos desde las gradas de la playa al anochecer (Entrada general: $30 AUD)","Paseo por las pasarelas de Nobbies con vista a los lobos marinos (Gratis)","Cena con pescado fresco en el pueblo de Cowes ($25 AUD)"],"datos_curiosos":["Los pingüinos azules pesan apenas un kilo y pasan hasta semanas enteras nadando en el mar abierto pescando antes de regresar a tierra"],"consejos":["Está estrictamente prohibido tomar fotos o vídeos durante el desfile de pingüinos para proteger los ojos sensibles de las aves del flash"],"location_info":{"address":"1019 Ventnor Rd, Summerlands VIC 3922","priceRange":"$$ - Entrada $30 AUD","dia":11,"day":11}}'::jsonb,
  now()
);

INSERT INTO public.tour_days (
  id, tour_id, day_number, title, notes, created_at
) VALUES (
  '22adb74d-331a-969e-7670-35183e04c331',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  12,
  'Día 12: Real Jardín Botánico de Melbourne y Despedida Australiana',
  'Pícnic bajo árboles milenarios y traslado al aeropuerto de Tullamarine.',
  now()
);
INSERT INTO public.tour_stops (
  id, tour_id, day_id, stop_order, position, name, latitude, longitude,
  image_url, images, description, activities, tips, curious_facts,
  location_info, suggested_minutes, image_metadata, created_at
) VALUES (
  'b455ea28-e381-0944-8d6d-0e4d1f90c6f5',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '22adb74d-331a-969e-7670-35183e04c331',
  12,
  12,
  'Royal Botanic Gardens Victoria y Despedida',
  -37.8304,
  144.9796,
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  ARRAY['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80']::text[],
  'Uno de los jardines botánicos más hermosos del mundo con 38 hectáreas de colinas ajardinadas, lagos ornamentales y más de 8.500 especies de plantas de todo el planeta a orillas del río Yarra.',
  ARRAY['Paseo por el sendero patrimonial de los aborígenes en el jardín botánico (Gratis)', 'Comprar cremas de aceite de árbol de té y miel de eucalipto de Tasmania ($15 - $35 AUD)', 'Autobús SkyBus directo desde Southern Cross Station hacia el aeropuerto de Melbourne ($22 AUD)']::text[],
  ARRAY['El acceso a los jardines botánicos es libre y gratuito todos los días']::text[],
  ARRAY['Los jardines fueron fundados en 1846 y conservan árboles plantados en la época victoriana por exploradores botánicos legendarios']::text[],
  '{"address":"Birdwood Ave, South Yarra VIC 3141","priceRange":"$ - Acceso libre","dia":12,"day":12}'::jsonb,
  150,
  '{"dia":12,"day":12,"activities":["Paseo por el sendero patrimonial de los aborígenes en el jardín botánico (Gratis)","Comprar cremas de aceite de árbol de té y miel de eucalipto de Tasmania ($15 - $35 AUD)","Autobús SkyBus directo desde Southern Cross Station hacia el aeropuerto de Melbourne ($22 AUD)"],"datos_curiosos":["Los jardines fueron fundados en 1846 y conservan árboles plantados en la época victoriana por exploradores botánicos legendarios"],"consejos":["El acceso a los jardines botánicos es libre y gratuito todos los días"],"location_info":{"address":"Birdwood Ave, South Yarra VIC 3141","priceRange":"$ - Acceso libre","dia":12,"day":12}}'::jsonb,
  now()
);

INSERT INTO public.tour_comments (
  id, tour_id, user_id, rating, body, photos, created_at, updated_at
) VALUES (
  '40b89010-39c2-0d24-1c15-71f4fce1396e',
  '33de4528-0b6d-3c54-b961-a7db04250c1b',
  '7b767010-fc97-4299-9ae3-5a4985da1da3',
  5,
  'Ruta oficial curada y verificada por Emotiva VibeTours. ¡Una experiencia inolvidable!',
  '{}'::text[],
  now(),
  now()
);

COMMIT;

-- ===================================================================
-- End of Seed Data: 14 Tours, 127 Days, 127 Stops.
-- ===================================================================