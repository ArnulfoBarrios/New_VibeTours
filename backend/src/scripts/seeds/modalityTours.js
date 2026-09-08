// Tours 31 - 50: Las 5 Modalidades de Viaje (20 Tours: 4 de cada modalidad)
export const modalityTours = [
  // 1. Ciudad Única (single_city) [Tours 31 - 34]
  {
    slug: 'vibetour-bogota-inmersiva-capitalina-4d',
    title: 'Bogotá Inmersiva y Capitalina: Cerros, Museos y Vanguardia',
    country: 'Colombia',
    city: 'Bogotá',
    type: 'urban',
    tourScope: 'single_city',
    description: 'Recorrido urbano de 4 días por la capital colombiana. Del funicular de Monserrate a 3.152 metros y la Candelaria colonial, hasta el arte moderno del MAMBO y la gastronomía de autor en Chapinero.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 5760, distance_meters: 45000, difficulty: 'easy', rating: 4.93, review_count: 98, likes_count: 310,
    tags: ['Bogotá', 'Capital', 'Urbano', 'Monserrate', 'La Candelaria', 'Gastronomía'],
    recommended_audience: ['Viajeros urbanos', 'Amantes del arte', 'Foodies'],
    best_season: 'Todo el año', recommended_schedule: 'Mañanas de museos y tardes de cafés',
    meeting_point: 'Plaza de Bolívar, Bogotá',
    includes: ['Ruta urbana completa', 'Guía de transporte TransMilenio / taxi', 'Selección de cafés de especialidad'],
    excludes: ['Funicular Monserrate', 'Entradas a museos', 'Alimentación'],
    recommendations: ['Llevar abrigo y paraguas; el clima bogotano es cambiante', 'Probar el ajiaco santafereño'],
    what_to_bring: ['Chaqueta abrigada', 'Calzado cómodo', 'Paraguas'], tour_rules: ['Cuidar pertenencias en zonas concurridas'],
    budget: { currency: 'COP', estimatedPerPersonMin: 280000, estimatedPerPersonMax: 620000 },
    days: [
      {
        day_number: 1, title: 'Día 1: La Candelaria y Museo Botero', notes: 'Arquitectura colonial y arte contemporáneo.',
        stops: [
          {
            stop_order: 1, name: 'Museo Botero y La Candelaria', latitude: 4.5968, longitude: -74.0732,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Casona colonial con patio claustrado que alberga más de 120 obras donadas por Fernando Botero junto a lienzos de Picasso, Monet y Dalí.',
            activities: ['Visitar la colección permanente del Museo Botero (Entrada gratuita)', 'Almorzar ajiaco en La Puerta Falsa ($28.000 COP)'],
            tips: ['Cierra los martes; entrada 100% gratuita todos los días de apertura'],
            curious_facts: ['La Puerta Falsa opera desde 1816 y es el restaurante más antiguo de Bogotá'], suggested_minutes: 150,
            location_info: { address: 'Calle 11 # 4-41, La Candelaria', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 2, title: 'Día 2: Cerro de Monserrate y Sabores de Chapinero', notes: 'Vistas panorámicas y gastronomía.',
        stops: [
          {
            stop_order: 1, name: 'Cerro de Monserrate y Chapinero Alto', latitude: 4.6056, longitude: -74.0555,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Ascenso en teleférico a 3.152 metros sobre el nivel del mar con vista completa de la sabana y tarde en el distrito culinario de Chapinero.',
            activities: ['Subida en teleférico ($27.000 COP ida y vuelta)', 'Cata de café especial en Chapinero ($12.000 COP)'],
            tips: ['Subir en la mañana para cielo despejado'],
            curious_facts: ['El sendero peatonal de Monserrate tiene 1.605 escalones de piedra'], suggested_minutes: 180,
            location_info: { address: 'Cerro de Monserrate, Bogotá', priceRange: '$ - Funicular' }
          }
        ]
      },
      {
        day_number: 3, title: 'Día 3: Jardín Botánico de Bogotá y Parque Simón Bolívar', notes: 'Naturaleza y pulmón verde.',
        stops: [
          {
            stop_order: 1, name: 'Jardín Botánico José Celestino Mutis', latitude: 4.6675, longitude: -74.1010,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'El jardín botánico más grande de Colombia con el Tropicario, domo de cristal que recrea los 5 ecosistemas del país.',
            activities: ['Recorrer el Tropicario (Entrada jardín + Tropicario: $14.000 COP)', 'Picnic en el Parque Simón Bolívar (Gratis)'],
            tips: ['El domo de páramo tiene niebla y vegetación real de frailejones'],
            curious_facts: ['Alberga más de 5.000 orquídeas nativas colombianas'], suggested_minutes: 180,
            location_info: { address: 'Avenida Calle 63 # 68-95', priceRange: '$ - Entrada $14.000 COP' }
          }
        ]
      },
      {
        day_number: 4, title: 'Día 4: Mercado de Pulgas de Usaquén y Despedida', notes: 'Artesanías y ambiente bohemio.',
        stops: [
          {
            stop_order: 1, name: 'Plaza de Usaquén y Mercado de Pulgas', latitude: 4.6935, longitude: -74.0325,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Antiguo pueblo colonial absorbido por Bogotá con calles empedradas, anticuarios, joyerías y restaurantes de autor.',
            activities: ['Compras de diseño y artesanías finas ($20.000 - $80.000 COP)', 'Almuerzo campestre en casonas de Usaquén ($35.000 - $65.000 COP)'],
            tips: ['El mercado de pulgas funciona los domingos y festivos con gran animación'],
            curious_facts: ['Usaquén fue un municipio independiente hasta que fue integrado a Bogotá en 1954'], suggested_minutes: 150,
            location_info: { address: 'Carrera 6 con Calle 119, Usaquén', priceRange: '$ - Libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-roma-eterna-al-detalle-5d',
    title: 'Roma Eterna al Detalle: Catacumbas, Foros y Plazas Barrocas',
    country: 'Italia',
    city: 'Roma',
    type: 'historical',
    tourScope: 'single_city',
    description: 'Circuito monográfico de 5 días concentrado exclusivamente en la Ciudad Eterna. De los subterráneos del Coliseo a las Catacumbas de San Calixto en la Vía Apia y los jardines de Villa Borghese.',
    cover_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 7200, distance_meters: 48000, difficulty: 'moderate', rating: 4.97, review_count: 145, likes_count: 480,
    tags: ['Roma', 'Coliseo', 'Catacumbas', 'Italia', 'Histórico', 'Ciudad Única'],
    recommended_audience: ['Amantes de la arqueología', 'Caminantes urbanos'],
    best_season: 'Primavera y Otoño', recommended_schedule: 'Salidas tempranas a monumentos',
    meeting_point: 'Piazza del Colosseo, Roma',
    includes: ['Ruta urbana detallada', 'Localización de fuentes públicas de agua potable'],
    excludes: ['Boleto Coliseo', 'Catacumbas', 'Transporte'],
    recommendations: ['Llevar calzado con amortiguación para caminar sobre adoquines romanos'],
    what_to_bring: ['Ropa cómoda', 'Botella de agua recargable'], tour_rules: ['Hombros cubiertos en basílicas'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 350, estimatedPerPersonMax: 750 },
    days: [
      {
        day_number: 1, title: 'Día 1: Coliseo y Foro Romano', notes: 'El poder del Imperio.',
        stops: [{ stop_order: 1, name: 'Coliseo y Foro Romano', latitude: 41.8902, longitude: 12.4922, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'], description: 'El anfiteatro de los gladiadores y el centro político de la antigüedad.', activities: ['Entrada combinada (€18)', 'Fotos en el Arco de Constantino'], tips: ['Reservar online'], curious_facts: ['Tenía toldo retráctil accionado por marineros'], suggested_minutes: 210, location_info: { address: 'Piazza del Colosseo', priceRange: '$$ - €18' } }]
      },
      {
        day_number: 2, title: 'Día 2: Fontana di Trevi y Panteón', notes: 'Monedas de la suerte y el óculo.',
        stops: [{ stop_order: 1, name: 'Fontana di Trevi y Panteón de Agripa', latitude: 41.9009, longitude: 12.4833, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'], description: 'La fuente barroca de travertino y la cúpula de hormigón de 2.000 años.', activities: ['Lanzar moneda (Gratis)', 'Entrada al Panteón (€5)', 'Gelato artesanal (€4)'], tips: ['Probar helado en Giolitti'], curious_facts: ['El óculo del Panteón mide 9 metros de diámetro'], suggested_minutes: 180, location_info: { address: 'Piazza della Rotonda', priceRange: '$ - €5' } }]
      },
      {
        day_number: 3, title: 'Día 3: Museos Vaticanos y Basílica de San Pedro', notes: 'Capilla Sixtina y la cúpula.',
        stops: [{ stop_order: 1, name: 'Museos Vaticanos y San Pedro', latitude: 41.9029, longitude: 12.4534, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'], description: 'Frescos de Miguel Ángel y La Piedad.', activities: ['Capilla Sixtina (€25)', 'Subida a la cúpula (€10)'], tips: ['Hombros y rodillas cubiertos'], curious_facts: ['La Piedad es la única obra que Miguel Ángel firmó'], suggested_minutes: 270, location_info: { address: 'Vaticano', priceRange: '$$ - €25' } }]
      },
      {
        day_number: 4, title: 'Día 4: Vía Apia Antigua y Catacumbas de San Calixto', notes: 'Túneles subterráneos de los primeros cristianos.',
        stops: [{ stop_order: 1, name: 'Catacumbas de San Calixto y Vía Apia', latitude: 41.8550, longitude: 12.5080, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'], description: 'Más de 20 km de galerías subterráneas donde fueron enterrados decenas de mártires y 16 papas.', activities: ['Visita guiada subterránea (€10)', 'Paseo en bicicleta por los adoquines de la Vía Apia (€15)'], tips: ['Llevar chaqueta; en las catacumbas hay 15°C constantes'], curious_facts: ['La Vía Apia fue la primera calzada pavimentada de Roma construida en el 312 a.C.'], suggested_minutes: 210, location_info: { address: 'Via Appia Antica 110', priceRange: '$ - €10' } }]
      },
      {
        day_number: 5, title: 'Día 5: Villa Borghese y Plaza del Popolo', notes: 'Galería de arte y jardines con lago.',
        stops: [{ stop_order: 1, name: 'Galería Borghese y Terraza del Pincio', latitude: 41.9142, longitude: 12.4922, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'], description: 'Esculturas maestras de Bernini como "Apolo y Dafne" y mirador al atardecer sobre Piazza del Popolo.', activities: ['Esculturas de Bernini (€15)', 'Paseo en barca en el lago (€5)'], tips: ['Reserva anticipada obligatoria en Galería Borghese'], curious_facts: ['Bernini esculpió las hojas de laurel de Dafne tan finas que la luz pasa a través del mármol'], suggested_minutes: 180, location_info: { address: 'Piazzale Scipione Borghese 5', priceRange: '$$ - €15' } }]
      }
    ]
  },
  {
    slug: 'vibetour-nueva-york-manhattan-brooklyn-6d',
    title: 'Nueva York: De los Rascacielos de Manhattan al Alma de Brooklyn',
    country: 'Estados Unidos',
    city: 'Nueva York',
    type: 'urban',
    tourScope: 'single_city',
    description: 'Inmersión urbana de 6 días en la Gran Manzana. Cruce del Puente de Brooklyn, paseos por Central Park, rascacielos Art Déco, museos de talla mundial y el High Line de Chelsea.',
    cover_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 8640, distance_meters: 65000, difficulty: 'moderate', rating: 4.95, review_count: 180, likes_count: 590,
    tags: ['Nueva York', 'Manhattan', 'Brooklyn', 'Central Park', 'Urbano', 'High Line', 'Times Square'],
    recommended_audience: ['Viajeros cosmopolitas', 'Amantes de la fotografía urbana'],
    best_season: 'Abril a Junio y Septiembre a Noviembre', recommended_schedule: 'Museos matutinos y rascacielos al atardecer',
    meeting_point: 'Times Square / Broadway, Nueva York',
    includes: ['Ruta completa en metro', 'Guía de miradores gratuitos y parques', 'Ruta de pizzas icónicas de Brooklyn'],
    excludes: ['Boleto a observatorios (Summit / Top of the Rock)', 'MetroCard', 'Entradas a espectáculos de Broadway'],
    recommendations: ['Usar el pago OMNY contactless en el metro', 'Cruzar el puente de Brooklyn caminando al atardecer'],
    what_to_bring: ['Calzado cómodo para caminar 15 km al día', 'Tarjeta de crédito contactless'], tour_rules: ['No obstruir el carril bici en puentes'],
    budget: { currency: 'USD', estimatedPerPersonMin: 600, estimatedPerPersonMax: 1400 },
    days: [
      {
        day_number: 1, title: 'Día 1: Midtown: Times Square, Central Park y Quinta Avenida', notes: 'El ritmo vibrante del corazón de Manhattan.',
        stops: [{ stop_order: 1, name: 'Times Square y Central Park', latitude: 40.7580, longitude: -73.9855, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Las pantallas gigantes de Times Square y el remanso verde de Central Park.', activities: ['Paseo por The Mall y Bethesda Terrace en Central Park (Gratis)', 'Porción de pizza clásica estilo NY de $3 USD'], tips: ['Times Square es más impactante de noche con los neones'], curious_facts: ['Central Park fue el primer parque público ajardinado de Estados Unidos en 1858'], suggested_minutes: 210, location_info: { address: 'Broadway & 7th Ave', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: High Line elevado y Chelsea Market', notes: 'Antigua vía de tren convertida en parque colgante.',
        stops: [{ stop_order: 1, name: 'The High Line y Chelsea Market', latitude: 40.7480, longitude: -74.0048, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Parque elevado construido sobre antiguas vías de mercancías rodeado de rascacielos de diseño y comida gourmet en Chelsea Market.', activities: ['Caminar los 2.3 km del High Line (Gratis)', 'Comer un Lobster Roll de langosta en Chelsea Market ($22 USD)'], tips: ['Terminar en Hudson Yards para ver la escultura The Vessel'], curious_facts: ['En las vías del High Line se preservan tramos originales donde crecieron flores silvestres'], suggested_minutes: 180, location_info: { address: 'Chelsea, Manhattan', priceRange: '$$ - Moderado' } }]
      },
      {
        day_number: 3, title: 'Día 3: El Mirador Summit One Vanderbilt y Grand Central', notes: 'Espejos infinitos y la estación más cinematográfica.',
        stops: [{ stop_order: 1, name: 'Summit One Vanderbilt y Grand Central Terminal', latitude: 40.7527, longitude: -73.9772, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Experiencia inmersiva en salas de espejos con vista al Empire State y Chrysler Building.', activities: ['Entrada al mirador Summit ($43 - $52 USD)', 'Ver el techo celeste astronómico de Grand Central (Gratis)'], tips: ['Llevar gafas de sol para el mirador; el reflejo de la luz en los espejos es deslumbrante'], curious_facts: ['El techo de Grand Central tiene las constelaciones pintadas al revés respecto al cielo real'], suggested_minutes: 180, location_info: { address: '45 E 42nd St', priceRange: '$$$ - Mirador $43+' } }]
      },
      {
        day_number: 4, title: 'Día 4: Puente de Brooklyn y DUMBO', notes: 'Cruzar el puente histórico de piedra y cables de acero.',
        stops: [{ stop_order: 1, name: 'Puente de Brooklyn y barrio DUMBO', latitude: 40.7061, longitude: -73.9969, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Caminar sobre el puente de 1883 y tomar la clásica foto de Washington Street en DUMBO enmarcando el Empire State bajo el Manhattan Bridge.', activities: ['Cruce a pie del puente hacia Brooklyn (Gratis)', 'Pizza en Grimaldi\'s o Juliana\'s ($25 - $35 USD)'], tips: ['Cruzar de Brooklyn a Manhattan si se quiere ver el skyline de frente'], curious_facts: ['Para demostrar que el puente era seguro tras su inauguración, el circo P.T. Barnum desfiló con 21 elefantes sobre él'], suggested_minutes: 240, location_info: { address: 'DUMBO, Brooklyn', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 5, title: 'Día 5: Museo Metropolitano de Arte (MET) y SoHo', notes: 'El templo del Templo de Dendur egipcio y tiendas de hierro fundido.',
        stops: [{ stop_order: 1, name: 'The Metropolitan Museum of Art (MET) y SoHo', latitude: 40.7794, longitude: -73.9632, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Uno de los museos más grandes del mundo con el Templo de Dendur egipcio original y armaduras medievales.', activities: ['Entrada al MET ($30 USD)', 'Caminata por los edificios Cast-Iron de SoHo (Gratis)'], tips: ['Subir a la terraza del tejado del MET en verano para vistas de Central Park'], curious_facts: ['Egipto donó el Templo de Dendur a EE.UU. en agradecimiento por salvar monumentos de Nubia'], suggested_minutes: 240, location_info: { address: '1000 5th Ave', priceRange: '$$ - Entrada $30' } }]
      },
      {
        day_number: 6, title: 'Día 6: Ferry Gratuito de Staten Island (Estatua de la Libertad) y Despedida', notes: 'La Estatua de la Libertad desde el agua y Wall Street.',
        stops: [{ stop_order: 1, name: 'Ferry de Staten Island y Toro de Wall Street', latitude: 40.7040, longitude: -74.0130, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'El ferry público de color naranja cruza la bahía pasando junto a la Estatua de la Libertad con vistas a los rascacielos del World Trade Center.', activities: ['Viaje de ida y vuelta en el ferry gratuito de Staten Island ($0)', 'Foto con el Charging Bull de Wall Street (Gratis)', 'Memorial del 11 de Septiembre (Gratis)'], tips: ['El ferry de Staten Island es 100% gratis las 24 horas del día; no pagar a revendedores en la calle'], curious_facts: ['La Estatua de la Libertad fue un regalo del pueblo francés en 1886 por el centenario de la independencia'], suggested_minutes: 180, location_info: { address: 'Whitehall Terminal, Manhattan', priceRange: '$ - Ferry gratis' } }]
      }
    ]
  },
  {
    slug: 'vibetour-barcelona-gaudi-mediterraneo-5d',
    title: 'Barcelona de Gaudí y el Mediterráneo: Modernismo y Playas',
    country: 'España',
    city: 'Barcelona',
    type: 'cultural',
    tourScope: 'single_city',
    description: 'Recorrido de 5 días enfocado en la arquitectura modernista de Gaudí, los callejones del Barrio Gótico y el sabor marinero de la Barceloneta.',
    cover_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 7200, distance_meters: 42000, difficulty: 'easy', rating: 4.96, review_count: 165, likes_count: 530,
    tags: ['Barcelona', 'Gaudí', 'Sagrada Familia', 'Park Güell', 'Mediterráneo', 'España', 'Urbano'],
    recommended_audience: ['Viajeros culturales', 'Amantes de la arquitectura'],
    best_season: 'Abril a Junio y Septiembre a Octubre', recommended_schedule: 'Monumentos de Gaudí por la mañana y playas por la tarde',
    meeting_point: 'Plaça de Catalunya, Barcelona',
    includes: ['Ruta urbana completa', 'Guía de metro T-Casual'], excludes: ['Sagrada Familia', 'Park Güell', 'Comidas'],
    recommendations: ['Comprar entradas a monumentos de Gaudí con semanas de anticipación'], what_to_bring: ['Calzado cómodo', 'Protector solar'],
    tour_rules: ['Cuidar bolsos y móviles en zonas turísticas'], budget: { currency: 'EUR', estimatedPerPersonMin: 320, estimatedPerPersonMax: 700 },
    days: [
      {
        day_number: 1, title: 'Día 1: Sagrada Familia y Paseo de Gracia', notes: 'El templo expiatorio y las casas modernistas.',
        stops: [{ stop_order: 1, name: 'Sagrada Familia y Casa Batlló', latitude: 41.4036, longitude: 2.1744, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'El bosque de columnas de Gaudí y la fachada de escamas de dragón de Casa Batlló.', activities: ['Visita a la Sagrada Familia (€26)', 'Fotos en Casa Batlló'], tips: ['Entrada con audioguía incluida en la app'], curious_facts: ['Gaudí está enterrado en la cripta de la basílica'], suggested_minutes: 240, location_info: { address: 'Carrer de Mallorca 401', priceRange: '$$ - €26' } }]
      },
      {
        day_number: 2, title: 'Día 2: Park Güell y Barrio de Gracia', notes: 'Mosaicos de trencadís y plazas bohemias.',
        stops: [{ stop_order: 1, name: 'Park Güell y Plaza del Sol en Gracia', latitude: 41.4145, longitude: 2.1527, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'El dragón de mosaicos y el banco ondulado con vista a Barcelona y al mar.', activities: ['Entrada al Park Güell (€10)', 'Tapas y vermut en el barrio de Gracia (€15)'], tips: ['Llegar en metro Lesseps'], curious_facts: ['El banco ondulado fue moldeado sentando a un operario desnudo en yeso fresco para copiar la curva de la columna'], suggested_minutes: 200, location_info: { address: 'Park Güell', priceRange: '$ - €10' } }]
      },
      {
        day_number: 3, title: 'Día 3: Barrio Gótico y Mercado de la Boquería', notes: 'Callejones medievales y tapas en Las Ramblas.',
        stops: [{ stop_order: 1, name: 'Barrio Gótico y Mercado de la Boquería', latitude: 41.3833, longitude: 2.1750, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Murallas romanas, la catedral y los puestos de mariscos de La Boquería.', activities: ['Caminata gótica (Gratis)', 'Tapas en La Boquería (€18)'], tips: ['Cuidar bolsillos en Las Ramblas'], curious_facts: ['La Boquería era antiguamente un mercado de carne de cabra al aire libre extramuros'], suggested_minutes: 180, location_info: { address: 'La Rambla 91', priceRange: '$$ - Tapas' } }]
      },
      {
        day_number: 4, title: 'Día 4: Montjuïc: Castillo, Fundación Miró y Fuentes Mágicas', notes: 'Vistas panorámicas sobre el puerto y arte moderno.',
        stops: [{ stop_order: 1, name: 'Castillo de Montjuïc y Teleférico', latitude: 41.3630, longitude: 2.1660, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Fortaleza militar del siglo XVII con vistas de 360 grados sobre la ciudad y el mar.', activities: ['Teleférico de Montjuïc (€10)', 'Entrada al castillo (€9)'], tips: ['Subir en el funicular de Montjuïc integrado en el metro'], curious_facts: ['Desde el castillo se midió el meridiano que definió la longitud exacta de un metro en 1792'], suggested_minutes: 200, location_info: { address: 'Carretera de Montjuïc 66', priceRange: '$ - €9' } }]
      },
      {
        day_number: 5, title: 'Día 5: Playas de la Barceloneta y Paella Marinera', notes: 'Descanso frente al mar y despedida.',
        stops: [{ stop_order: 1, name: 'La Barceloneta y Playa de San Sebastián', latitude: 41.3780, longitude: 2.1920, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Paseo marítimo bordeado de palmeras y chiringuitos de pescado fresco.', activities: ['Paseo en bicicleta por la costa (€12)', 'Paella marinera con sangría (€25 - €35)'], tips: ['Tomar el Aerobús en Plaza Cataluña al terminar'], curious_facts: ['El barrio fue construido en el siglo XVIII para realojar a los habitantes de la Ribera cuyas casas fueron demolidas para la Ciudadela'], suggested_minutes: 180, location_info: { address: 'Passeig Marítim', priceRange: '$$ - Paella' } }]
      }
    ]
  },

  // 2. Microdestinos / Parques Naturales (micro_destination) [Tours 35 - 38]
  {
    slug: 'vibetour-minca-sierra-nevada-3d',
    title: 'Minca y la Sierra Nevada: Aves, Cafetales y Cascadas',
    country: 'Colombia', city: 'Minca', type: 'ecological', tourScope: 'micro_destination',
    description: 'Escapada ecológica de 3 días a la capital del avistamiento de aves en la Sierra Nevada de Santa Marta. Cascadas de Marinka, Pozo Azul y fincas cafeteras tradicionales a 650 metros de altitud.',
    cover_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 4320, distance_meters: 28000, difficulty: 'moderate', rating: 4.94, review_count: 82, likes_count: 270,
    tags: ['Minca', 'Sierra Nevada', 'Ecológico', 'Cascadas', 'Café', 'Microdestino'],
    recommended_audience: ['Ecoturistas', 'Avistadores de aves', 'Mochileros'], best_season: 'Diciembre a Abril', recommended_schedule: 'Madrugar para avistamiento de aves a las 6:00 AM',
    meeting_point: 'Iglesia de Minca, Magdalena', includes: ['Ruta de senderismo', 'Guía de aves endémicas'], excludes: ['Moto-taxi local', 'Entradas'],
    recommendations: ['Llevar calzado con agarre para barro y traje de baño'], what_to_bring: ['Repelente', 'Binoculares', 'Toalla'], tour_rules: ['No dejar basura en senderos'],
    budget: { currency: 'COP', estimatedPerPersonMin: 220000, estimatedPerPersonMax: 480000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Pueblo de Minca y Pozo Azul', notes: 'Pozas naturales de agua cristalina de montaña.',
        stops: [{ stop_order: 1, name: 'Pozo Azul en Minca', latitude: 11.1410, longitude: -74.1120, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Piscinas naturales formadas por el río Minca entre rocas gigantes.', activities: ['Baño en pozas frías (Gratis)', 'Almuerzo campestre ($22.000 COP)'], tips: ['Llegar antes de las 10:00 AM para evitar aglomeraciones'], curious_facts: ['El agua proviene directamente de los picos nevados Colón y Bolívar'], suggested_minutes: 180, location_info: { address: 'Minca, Magdalena', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Finca Cafetera La Victoria y Mirador Los Pinos', notes: 'Maquinaria hidráulica de 1892 y vista al mar Caribe desde la montaña.',
        stops: [{ stop_order: 1, name: 'Hacienda La Victoria y Los Pinos', latitude: 11.1442, longitude: -74.1165, image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'], description: 'Una de las fincas cafeteras más antiguas de Colombia impulsada por agua de montaña.', activities: ['Tour del café orgánico ($25.000 COP)', 'Cerveza artesanal de café ($14.000 COP)'], tips: ['Subir en moto-taxi local ($20.000 COP)'], curious_facts: ['Toda la maquinaria funciona sin electricidad de la red'], suggested_minutes: 210, location_info: { address: 'El Campano, Minca', priceRange: '$ - Tour $25.000 COP' } }]
      },
      {
        day_number: 3, title: 'Día 3: Cascadas de Marinka y Hamacas Gigantes', notes: 'Relajación en redes suspendidas sobre el cañón.',
        stops: [{ stop_order: 1, name: 'Cascadas de Marinka', latitude: 11.1350, longitude: -74.1080, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Dos cascadas gemelas con piscinas naturales y redes colgantes panorámicas.', activities: ['Baño en cascada (Entrada: $10.000 COP)', 'Foto en las hamacas gigantes ($5.000 COP)'], tips: ['Llevar calzado de agua para piedras resbalosas'], curious_facts: ['En este valle habitan más de 300 especies de aves registradas'], suggested_minutes: 180, location_info: { address: 'Vereda Marinka, Minca', priceRange: '$ - Entrada $10.000 COP' } }]
      }
    ]
  },
  {
    slug: 'vibetour-pnn-los-nevados-4d',
    title: 'Parque Nacional Natural Los Nevados: Glaciares, Frailejones y Termales',
    country: 'Colombia', city: 'Manizales', type: 'sports', tourScope: 'micro_destination',
    description: 'Expedición de alta montaña de 4 días por el macizo volcánico de la Cordillera Central. Ecosistema de páramo con miles de frailejones, el borde del glaciar del Nevado del Ruiz a 4.800 metros y descanso en aguas termales volcánicas.',
    cover_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 5760, distance_meters: 95000, difficulty: 'intense', rating: 4.96, review_count: 75, likes_count: 310,
    tags: ['PNN Los Nevados', 'Nevado del Ruiz', 'Alta Montaña', 'Páramo', 'Termales', 'Microdestino'],
    recommended_audience: ['Montañistas', 'Aventureros en buena forma física'], best_season: 'Diciembre a Marzo y Julio a Agosto', recommended_schedule: 'Ingresos al parque antes de las 8:00 AM',
    meeting_point: 'Plaza de Bolívar de Manizales / Sector Brisas', includes: ['Ruta de alta montaña', 'Puntos de control de Parques Nacionales'], excludes: ['Boleto PNN Los Nevados', 'Guía obligatorio de alta montaña', 'Vehículo 4x4'],
    recommendations: ['Aclimatarse el primer día a 2.100 msnm; la cumbre supera los 4.800 msnm', 'Llevar abrigo térmico invernal'], what_to_bring: ['Chaqueta térmica de pluma', 'Guantes y pasamontañas', 'Protector solar labial y facial'], tour_rules: ['Obligatorio ingresar con guía certificado de montaña y póliza de seguro'],
    budget: { currency: 'COP', estimatedPerPersonMin: 450000, estimatedPerPersonMax: 950000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Manizales y Aclimatación en Termales del Ruiz', notes: 'Ascenso suave y aguas termales a 3.500 metros.',
        stops: [{ stop_order: 1, name: 'Termales del Ruiz y Sendero de Colibríes', latitude: 4.9580, longitude: -75.3620, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Piscinas termales minerales en medio del bosque altoandino frecuentadas por colibríes de alta montaña.', activities: ['Baño termal medicinal ($50.000 COP)', 'Avistamiento del colibrí de páramo (Gratis)'], tips: ['No beber alcohol para facilitar la aclimatación'], curious_facts: ['Las aguas brotan a más de 60°C de fallas volcánicas profundas'], suggested_minutes: 240, location_info: { address: 'Vía Manizales - Murillo Km 28', priceRange: '$$ - Termales' } }]
      },
      {
        day_number: 2, title: 'Día 2: Borde de Glaciar del Nevado del Ruiz (Sector Brisas)', notes: 'Ascenso hasta los 4.800 metros en el glaciar.',
        stops: [{ stop_order: 1, name: 'Valle de las Fracciones y Borde de Nieve del Ruiz', latitude: 4.8920, longitude: -75.3180, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Páramo lunar de ceniza volcánica y nieves perpetuas.', activities: ['Caminata guiada al borde de nieve (Entrada parque: ~$40.000 COP + guía)', 'Foto en el Valle de los Lunares'], tips: ['Caminar muy despacio y con respiración controlada por la escasez de oxígeno'], curious_facts: ['El Nevado del Ruiz es un estratovolcán activo conocido por los pueblos indígenas como Kumanday'], suggested_minutes: 300, location_info: { address: 'Sector Brisas, PNN Los Nevados', priceRange: '$$ - Entrada y guía' } }]
      },
      {
        day_number: 3, title: 'Día 3: Laguna Negra y Desierto de Ceniza', notes: 'Espejo de agua glaciar rodeado de frailejones centenarios.',
        stops: [{ stop_order: 1, name: 'Laguna Negra y Páramo de Frailejones', latitude: 4.9380, longitude: -75.3350, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Laguna de origen glaciar a 3.700 metros donde se refleja el nevado.', activities: ['Fotografía de frailejones gigantes (Gratis)', 'Agua de panela con queso caliente en parador andino ($8.000 COP)'], tips: ['Los frailejones crecen apenas 1 centímetro al año; no pisarlos ni tocarlos'], curious_facts: ['Los frailejones retienen hasta 40 veces su peso en agua actuando como esponjas que originan los ríos de Colombia'], suggested_minutes: 180, location_info: { address: 'Carretera al Ruiz', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Termales Santa Rosa de Cabal y Retorno', notes: 'Descanso muscular bajo la cascada de 95 metros.',
        stops: [{ stop_order: 1, name: 'Termales Balneario Santa Rosa de Cabal', latitude: 4.8620, longitude: -75.5480, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Cascada de agua fría y piscinas termales humeantes en medio del cañón verde.', activities: ['Baño hidrotermal de recuperación muscular ($55.000 COP)', 'Chorizo santarrosano tradicional ($18.000 COP)'], tips: ['Llevar traje de baño y sandalias'], curious_facts: ['La combinación de choque térmico entre la cascada fría y la piscina caliente reactiva la circulación'], suggested_minutes: 240, location_info: { address: 'Santa Rosa de Cabal, Risaralda', priceRange: '$$ - Entrada termales' } }]
      }
    ]
  },
  {
    slug: 'vibetour-rio-claro-cavernas-doradal-3d',
    title: 'Cañón del Río Claro: Mármol, Rafting y Cavernas Naturales',
    country: 'Colombia', city: 'Doradal', type: 'sports', tourScope: 'micro_destination',
    description: 'Aventura kárstica de 3 días en la Reserva Natural Cañón del Río Claro. Lecho fluvial tallado en roca de mármol pulido blanco, aguas cristalinas para rafting, espeleología en la Caverna de los Guácharos y aldea estilo mediterráneo de Doradal.',
    cover_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 4320, distance_meters: 32000, difficulty: 'moderate', rating: 4.92, review_count: 65, likes_count: 240,
    tags: ['Río Claro', 'Doradal', 'Cañón', 'Rafting', 'Mármol', 'Espeleología', 'Microdestino'],
    recommended_audience: ['Aventureros', 'Jóvenes y grupos'], best_season: 'Diciembre a Abril y Julio a Agosto', recommended_schedule: 'Actividades acuáticas matutinas',
    meeting_point: 'Entrada Reserva Cañón del Río Claro, Autopista Medellín - Bogotá', includes: ['Ruta de senderos kársticos', 'Puntos de baño en mármol'], excludes: ['Tarifa de entrada a la reserva', 'Espeleología en caverna', 'Rafting'],
    recommendations: ['Llevar calzado deportivo acuático para las piedras de mármol'], what_to_bring: ['Aquashoes', 'Linterna frontal', 'Bolsa impermeable'], tour_rules: ['Prohibido extraer estalactitas o piezas de mármol'],
    budget: { currency: 'COP', estimatedPerPersonMin: 260000, estimatedPerPersonMax: 550000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Playa de Mármol y Sendero Kárstico', notes: 'Caminata sobre el lecho de mármol blanco bajo el dosel selvático.',
        stops: [{ stop_order: 1, name: 'Playa Mármol y Sendero Geológico', latitude: 5.8980, longitude: -74.8580, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Cañón de paredes verticales de mármol de 100 metros de altura con lecho de río tallado en roca caliza blanca cristalina.', activities: ['Entrada a la reserva ($25.000 COP)', 'Baño en el río sobre losas de mármol sumergidas (Gratis)'], tips: ['El agua es fresca y extremadamente transparente'], curious_facts: ['Las paredes de mármol se formaron hace millones de años por sedimentación de antiguos arrecifes marinos fósiles'], suggested_minutes: 240, location_info: { address: 'Autopista Medellín - Bogotá Km 152', priceRange: '$ - Entrada reserva' } }]
      },
      {
        day_number: 2, title: 'Día 2: Espeleología en la Caverna de los Guácharos y Rafting', notes: 'Aventura dentro de la cueva subterránea de aves nocturnas.',
        stops: [{ stop_order: 1, name: 'Caverna de los Guácharos y Descenso en Balsa', latitude: 5.8940, longitude: -74.8550, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Cueva kárstica natural atravesada por un río subterráneo habitada por miles de guácharos, aves nocturnas que se orientan por ecolocalización.', activities: ['Espeleología con casco y linterna dentro de la caverna ($35.000 COP)', 'Rafting en río transparente entre cañones de mármol ($40.000 COP)'], tips: ['La caverna requiere cruzar tramos donde el agua llega al pecho; llevar ropa que se pueda mojar'], curious_facts: ['Los guácharos emiten chasquidos sonoros audibles por el ser humano para mapear la cueva en la oscuridad absoluta'], suggested_minutes: 300, location_info: { address: 'Reserva Natural Río Claro', priceRange: '$$ - Actividades de aventura' } }]
      },
      {
        day_number: 3, title: 'Día 3: Aldea Doradal: El Santoríni Colombiano y Despedida', notes: 'Casas blancas y cúpulas azules sobre colinas.',
        stops: [{ stop_order: 1, name: 'Aldea Doradal (El Santoríni Colombiano)', latitude: 5.9220, longitude: -74.7330, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Complejo urbanístico construido en la ladera de una colina inspirado en la arquitectura griega de las islas Cícladas con casas blancas y escalinatas de piedra.', activities: ['Paseo fotográfico por las callejuelas blancas y miradores (Gratis)', 'Almuerzo campestre con pescado fresco del río Magdalena ($25.000 COP)'], tips: ['Llevar cámara con batería completa para fotos de arquitectura'], curious_facts: ['Fue construida en los años 80 evocando los pueblos de las islas griegas del mar Egeo'], suggested_minutes: 150, location_info: { address: 'Doradal, Puerto Triunfo, Antioquia', priceRange: '$ - Libre' } }]
      }
    ]
  },
  {
    slug: 'vibetour-desierto-tatacoa-villavieja-3d',
    title: 'Desierto de la Tatacoa: Laberinto Rojo, Gris y Cielos Estelares',
    country: 'Colombia', city: 'Villavieja', type: 'ecological', tourScope: 'micro_destination',
    description: 'Expedición de 3 días al bosque seco tropical de la Tatacoa en el Huila. Cañones rojizos erosionados en el sector del Cusco, formaciones lunares grises en Los Hoyos y observación astronómica de constelaciones sin contaminación lumínica.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 4320, distance_meters: 45000, difficulty: 'moderate', rating: 4.93, review_count: 90, likes_count: 340,
    tags: ['Desierto de la Tatacoa', 'Cusco', 'Los Hoyos', 'Astronomía', 'Huila', 'Microdestino'],
    recommended_audience: ['Fotógrafos nocturnos', 'Amantes de la geología', 'Aventureros'], best_season: 'Junio a Septiembre y Diciembre a Marzo (cielos despejados para estrellas)', recommended_schedule: 'Caminatas a las 6:30 AM y observación astronómica a las 7:30 PM',
    meeting_point: 'Parque Principal de Villavieja, Huila', includes: ['Ruta de senderos Cusco y Los Hoyos', 'Horarios de observatorios astronómicos'], excludes: ['Entrada al Observatorio Astronómico', 'Alquiler de mototaxi / tuc-tuc', 'Piscina mineral'],
    recommendations: ['Llevar al menos 3 litros de agua potable por persona al día (temperaturas diurnas de 38°C)', 'Usar sombrero de ala ancha'], what_to_bring: ['Linterna con luz roja para no deslumbrar en observatorios', 'Protector solar 50+', 'Ropa fresca'], tour_rules: ['No pisar los bordes de los zanjones frágiles de arcilla'],
    budget: { currency: 'COP', estimatedPerPersonMin: 240000, estimatedPerPersonMax: 520000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Laberinto Rojo del Cusco y Observatorio Astronómico', notes: 'Tierra arcillosa rojiza y telescopios bajo el cielo nocturno.',
        stops: [{ stop_order: 1, name: 'Sector El Cusco y Observatorio de la Tatacoa', latitude: 3.2320, longitude: -75.1650, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Paisaje de cañones y montículos rojizos de arcilla y hierro esculpidos por el viento y la lluvia. De noche, charla con telescopios profesionales en el observatorio astronómico.', activities: ['Caminata por el laberinto rojo del Cusco (Gratis)', 'Sesión guiada de observación de planetas y nebulosas con telescopio ($15.000 COP)', 'Cena de chivo asado o sancocho en posada del desierto ($22.000 - $35.000 COP)'], tips: ['Hacer la caminata antes de las 9:00 AM o después de las 4:30 PM para evitar golpes de calor'], curious_facts: ['La Tatacoa no es técnicamente un desierto sino un bosque seco tropical que en épocas prehistóricas era un mar interior'], suggested_minutes: 240, location_info: { address: 'Sector Cusco, Villavieja', priceRange: '$ - Observatorio $15.000 COP' } }]
      },
      {
        day_number: 2, title: 'Día 2: Sector Los Hoyos (Zona Gris) y Piscina Mineral', notes: 'Paisaje fantasmal color ceniza y oasis en el desierto.',
        stops: [{ stop_order: 1, name: 'Sector Los Hoyos y Piscina Oasis', latitude: 3.2530, longitude: -75.1760, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Zona lunar de formaciones de arcilla grisácea conocida como el "Valle de los Fantasmas". En el fondo se encuentra una piscina natural de agua de manantial subterráneo.', activities: ['Sendero por las gargantas grises de Los Hoyos (Gratis)', 'Baño refrescante en la piscina mineral del oasis ($10.000 COP)', 'Probar dulce artesanal de leche de cabra y cactus ($8.000 COP)'], tips: ['Llevar traje de baño puesto para la piscina'], curious_facts: ['En Los Hoyos se han hallado fósiles de tortugas gigantes de más de dos metros y perezosos terrestres gigantes'], suggested_minutes: 240, location_info: { address: 'Los Hoyos, Desierto de la Tatacoa', priceRange: '$ - Piscina $10.000 COP' } }]
      },
      {
        day_number: 3, title: 'Día 3: Museo Paleontológico de Villavieja y Despedida', notes: 'Fósiles de 13 millones de años y retorno a Neiva.',
        stops: [{ stop_order: 1, name: 'Museo Paleontológico de Villavieja', latitude: 3.2200, longitude: -75.2180, image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'], description: 'Alberga más de 950 piezas fósiles halladas en el desierto, incluyendo restos de armadillos gigantes, cocodrilos prehistóricos y monos del Mioceno.', activities: ['Visita guiada al museo con piezas fósiles originales (Entrada: $6.000 COP)', 'Paseo en canoa por el río Magdalena desde el puerto de Villavieja ($15.000 COP)', 'Probar el quesillo de hoja y la achira tradicional huilense ($8.000 COP)'], tips: ['Villavieja queda a solo 45 minutos en carretera pavimentada desde Neiva'], curious_facts: ['La Tatacoa es el yacimiento de fósiles de mamíferos del Mioceno más rico de toda América del Sur'], suggested_minutes: 150, location_info: { address: 'Parque Principal, Villavieja, Huila', priceRange: '$ - Entrada $6.000 COP' } }]
      }
    ]
  },

  // 3. Costero e Islas (coastal_islands) [Tours 39 - 42]
  {
    slug: 'vibetour-golfo-morrosquillo-san-bernardo-4d',
    title: 'Golfo de Morrosquillo: Tolú, Coveñas e Islas de San Bernardo',
    country: 'Colombia', city: 'Tolú', type: 'romantic', tourScope: 'coastal_islands',
    description: 'Circuito costero de 4 días que une las playas continentales del Golfo de Morrosquillo con el archipiélago de ensueño de San Bernardo: Isla Múcura, Tintipán y Santa Cruz del Islote, la isla más densamente poblada del planeta.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 5760, distance_meters: 62000, difficulty: 'easy', rating: 4.93, review_count: 110, likes_count: 380,
    tags: ['Tolú', 'Coveñas', 'San Bernardo', 'Isla Múcura', 'Tintipán', 'Playas', 'Costero e Islas'],
    recommended_audience: ['Parejas', 'Amantes del mar tranquilo', 'Familias'], best_season: 'Diciembre a Abril y Julio a Agosto', recommended_schedule: 'Zarpe en lancha a las 8:00 AM desde el muelle de Tolú',
    meeting_point: 'Malecón Turístico de Tolú, Sucre', includes: ['Ruta costera y puntos de embarque', 'Guía del archipiélago de San Bernardo'], excludes: ['Pasaje en lancha rápida', 'Impuesto de muelle', 'Alojamiento en islas'],
    recommendations: ['Llevar efectivo suficiente; en las islas no hay cajeros automáticos ni datáfonos estables'], what_to_bring: ['Protector solar biodegradable', 'Zapatos para agua', 'Toalla de microfibra'], tour_rules: ['No arrojar residuos al mar ni tocar los corales'],
    budget: { currency: 'COP', estimatedPerPersonMin: 380000, estimatedPerPersonMax: 820000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Playas de Coveñas y Paseo en Bicitaxi en Tolú', notes: 'Arena fina, olas mansas y gastronomía caribeña.',
        stops: [{ stop_order: 1, name: 'Playas de la Primera Ensenada en Coveñas', latitude: 9.4080, longitude: -75.6850, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Playas kilométricas de aguas poco profundas y cálidas ideales para nadar sin oleaje fuerte.', activities: ['Baño de mar relajante (Gratis)', 'Almuerzo de pargo platinado con patacón y arroz de coco ($32.000 COP)', 'Paseo en bicitaxi decorado con música en el malecón de Tolú ($10.000 COP)'], tips: ['El golfo de Morrosquillo se caracteriza por un mar plano tipo piscina'], curious_facts: ['Tolú fue una de las villas hispánicas más antiguas del Caribe colombiano, fundada en 1535'], suggested_minutes: 240, location_info: { address: 'Coveñas, Sucre', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Archipiélago de San Bernardo: Isla Múcura', notes: 'Aguas azul turquesa transparente y playas de arena blanca de coral.',
        stops: [{ stop_order: 1, name: 'Isla Múcura en el Archipiélago de San Bernardo', latitude: 9.7850, longitude: -75.8750, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Isla paradisíaca perteneciente al Parque Nacional Natural Corales del Rosario y San Bernardo con fondos de arena coralina blanca.', activities: ['Lancha rápida desde Tolú (Pasadía: ~$90.000 - $140.000 COP ida y vuelta)', 'Snorkel en arrecife de coral ($35.000 COP)', 'Almuerzo de langosta o pescado fresco en la playa ($45.000 - $70.000 COP)'], tips: ['Pagar la tasa portuaria en el muelle de Tolú ($12.000 COP en efectivo)'], curious_facts: ['Por la noche en las lagunas de manglar de la isla se aprecia el fenómeno de bioluminiscencia marina'], suggested_minutes: 360, location_info: { address: 'Isla Múcura, Golfo de Morrosquillo', priceRange: '$$ - Pasadía en lancha' } }]
      },
      {
        day_number: 3, title: 'Día 3: Santa Cruz del Islote e Isla Tintipán', notes: 'La isla más poblada del mundo y los canales de manglar.',
        stops: [{ stop_order: 1, name: 'Santa Cruz del Islote e Isla Tintipán', latitude: 9.7890, longitude: -75.8560, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Islote artificial de coral de apenas una hectárea donde conviven más de 800 habitantes sin calles ni policías. Luego, Tintipán con sus playas de ensueño y manglares.', activities: ['Recorrido cultural guiado por los estrechos callejones del islote ($10.000 COP aporte)', 'Nadar con tiburones nodriza inofensivos en el acuario comunitario ($15.000 COP)', 'Descanso en las aguas turquesas de Tintipán (Gratis)'], tips: ['Llevar caramelos o útiles escolares para los niños del islote'], curious_facts: ['En Santa Cruz del Islote no hay mosquitos porque no hay manglares ni agua dulce estancada'], suggested_minutes: 300, location_info: { address: 'Santa Cruz del Islote / Tintipán', priceRange: '$ - Aporte local' } }]
      },
      {
        day_number: 4, title: 'Día 4: Ciénaga de la Caimanera y Despedida', notes: 'Paseo en canoa a remo entre túneles de manglares y casa flotante.',
        stops: [{ stop_order: 1, name: 'Ciénaga de la Caimanera', latitude: 9.4500, longitude: -75.6400, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Reserva ecológica costera de manglares donde los pescadores guían canoas a remo silenciosas hasta una casa flotante en medio de la ciénaga.', activities: ['Paseo ecológico en canoa a remo ($20.000 COP)', 'Probar ostras frescas extraídas del manglar con limón en la casa flotante ($15.000 COP docena)', 'Compras de artesanías de caña flecha antes de salir ($15.000 - $40.000 COP)'], tips: ['Las canoas van sin motor para no alterar la fauna de aves acuáticas'], curious_facts: ['En la ciénaga habitan caimanes aguja protegidos y cuatro tipos distintos de manglares'], suggested_minutes: 180, location_info: { address: 'Coveñas, Sucre', priceRange: '$ - Paseo en canoa' } }]
      }
    ]
  },
  {
    slug: 'vibetour-san-andres-providencia-cayos-6d',
    title: 'Archipiélago de San Andrés y Providencia: El Mar de los Siete Colores',
    country: 'Colombia', city: 'San Andrés', type: 'romantic', tourScope: 'coastal_islands',
    description: 'Circuito caribeño de 6 días en la Reserva de la Biósfera Seaflower. Vuelta a la isla de San Andrés en carro de golf o mula, snorkel en Johnny Cay y el Acuario, y salto a la paradisíaca e intacta isla de Providencia.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 8640, distance_meters: 110000, difficulty: 'easy', rating: 4.97, review_count: 155, likes_count: 530,
    tags: ['San Andrés', 'Providencia', 'Johnny Cay', 'Seaflower', 'Caribe', 'Costero e Islas', 'Cayos'],
    recommended_audience: ['Parejas', 'Amantes del snorkel', 'Buceadores'], best_season: 'Diciembre a Mayo', recommended_schedule: 'Zarpes a los cayos a primera hora de la mañana',
    meeting_point: 'Playa Principal de Spratt Bight, San Andrés', includes: ['Ruta completa de cayos y playas', 'Guía de alquiler de vehículos de golf'], excludes: ['Tarjeta de turismo OCCRE', 'Vuelo o catamarán San Andrés - Providencia'],
    recommendations: ['Pagar la tarjeta turística OCCRE en el aeropuerto de origen antes de abordar el vuelo a San Andrés'], what_to_bring: ['Zapatos de agua', 'Equipo de snorkel', 'Protector solar reef-safe'], tour_rules: ['Prohibido extraer caracoles pala o estrellas de mar'],
    budget: { currency: 'COP', estimatedPerPersonMin: 650000, estimatedPerPersonMax: 1400000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Playa de Spratt Bight y Vuelta a la Isla en Mula', notes: 'Alquiler de carrito de golf bordeando el mar azul turquesa.',
        stops: [{ stop_order: 1, name: 'Spratt Bight y Vuelta a la Isla', latitude: 12.5850, longitude: -81.7000, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Recorrido de 30 km bordeando la costa con paradas en La Piscinita, el Hoyo Soplador y las playas de San Luis.', activities: ['Alquiler de carrito de golf por día ($180.000 - $250.000 COP)', 'Snorkel en La Piscinita rodeado de peces sargento ($10.000 COP)', 'Ver el chorro de agua del Hoyo Soplador (Gratis)'], tips: ['Respetar los límites de velocidad en el carrito de golf'], curious_facts: ['El mar exhibe hasta 7 tonalidades distintas de azul debido a las diferentes profundidades y arrecifes de coral'], suggested_minutes: 240, location_info: { address: 'San Andrés Isla', priceRange: '$$ - Alquiler carrito' } }]
      },
      {
        day_number: 2, title: 'Día 2: Johnny Cay y el Acuario Natural de Haynes Cay', notes: 'Palmeras gigantes, rayas marinas y peces de arrecife.',
        stops: [{ stop_order: 1, name: 'Cayo Johnny Cay y Acuario Rose Cay', latitude: 12.5992, longitude: -81.6897, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Cayo de arena blanca con palmeras gigantes y un acuario natural donde el agua llega a la cintura y se nada con mantarrayas.', activities: ['Lancha combinada Johnny Cay + Acuario ($45.000 - $65.000 COP)', 'Almuerzo de pargo rojo con coco en Johnny Cay ($38.000 - $55.000 COP)', 'Caminar sobre el banco de arena entre Rose Cay y Haynes Cay (Gratis)'], tips: ['Usar zapatos de agua obligatorios en el Acuario por piedras de coral'], curious_facts: ['Johnny Cay está habitado por cientos de iguanas de gran tamaño que pasean entre los turistas'], suggested_minutes: 300, location_info: { address: 'Cayos de San Andrés', priceRange: '$$ - Lancha y almuerzo' } }]
      },
      {
        day_number: 3, title: 'Día 3: El Paraíso Escondido: Vuelo a la Isla de Providencia', notes: 'Salto a la joya virgen de la arquitectura isleña de madera.',
        stops: [{ stop_order: 1, name: 'Llegada a Providencia y Bahía de Santa Catalina', latitude: 13.3550, longitude: -81.3720, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Vuelo panorámico de 20 minutos en avioneta o catamarán. Providencia es un paraíso sin cadenas hoteleras, habitado por la comunidad raizal en casas tradicionales de madera.', activities: ['Cruzar a pie el Puente de los Enamorados que une Providencia con Santa Catalina (Gratis)', 'Caminar hasta la Cabeza de Morgan en Santa Catalina (Gratis)', 'Cena de muelas de cangrejo negro o rondón raizal ($40.000 - $65.000 COP)'], tips: ['Providencia cuenta con cupos limitados diarios; reservar vuelo con mucha anticipación'], curious_facts: ['El Puente de los Enamorados es una pasarela flotante de madera de colores sobre un canal marino transparente'], suggested_minutes: 240, location_info: { address: 'Santa Isabel, Providencia', priceRange: '$$$ - Vuelo interno' } }]
      },
      {
        day_number: 4, title: 'Día 4: Cayo Cangrejo y Parque Nacional McBean Lagoon', notes: 'El santuario marino más espectacular de Colombia.',
        stops: [{ stop_order: 1, name: 'Cayo Cangrejo (Crab Cay)', latitude: 13.3660, longitude: -81.3550, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Un peñón rocoso solitario en medio de una piscina gigante de agua esmeralda de 360 grados donde habitan tortugas marinas y corales cerebro.', activities: ['Lancha hacia Cayo Cangrejo ($40.000 COP ida y vuelta)', 'Entrada al Parque Nacional McBean Lagoon ($22.000 COP)', 'Snorkel con tortugas carey y peces loro (Gratis con equipo propio)'], tips: ['Subir a la cima de la roca de Cayo Cangrejo para una de las mejores vistas panorámicas de todo el Caribe'], curious_facts: ['La barrera arrecifal de Providencia es la segunda más larga del hemisferio occidental después de la de Belice'], suggested_minutes: 300, location_info: { address: 'PNN Old Providence McBean Lagoon', priceRange: '$$ - Excursión cayo' } }]
      },
      {
        day_number: 5, title: 'Día 5: Bahía Suroeste y Atardecer con Reggae', notes: 'Carreras tradicionales de caballos en la playa y música caribeña.',
        stops: [{ stop_order: 1, name: 'South West Bay y Freshwater Bay', latitude: 13.3320, longitude: -81.3910, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'La playa más extensa de Providencia bordeada de cocoteros y restaurantes de pescadores donde suena música reggae y calipso.', activities: ['Descanso en la playa de aguas calmas (Gratis)', 'Almuerzo en el restaurante de mariscos de Richard ($45.000 COP)', 'Ver carreras de caballos en la arena los sábados por la tarde (Gratis)'], tips: ['Alquilar una moto scooter para recorrer Providencia a su propio ritmo ($90.000 COP/día)'], curious_facts: ['Los habitantes de Providencia hablan fluidamente inglés criollo caribeño (creole), español e inglés estándar'], suggested_minutes: 240, location_info: { address: 'South West Bay, Providencia', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 6, title: 'Día 6: Retorno a San Andrés y Compras Libres de Impuestos', notes: 'Vuelo de regreso y compras en el centro comercial libre de impuestos.',
        stops: [{ stop_order: 1, name: 'Centro Comercial de San Andrés y Despedida', latitude: 12.5830, longitude: -81.6980, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Zona de puerto libre de impuestos en el centro de San Andrés con perfumes, chocolates y licores importados a precios preferenciales.', activities: ['Compras duty free en la Avenida Providencia ($30.000 - $120.000 COP)', 'Último baño en la playa de Spratt Bight frente al hotel (Gratis)', 'Traslado al aeropuerto Gustavo Rojas Pinilla (a solo 5 minutos en taxi: $18.000 COP)'], tips: ['Revisar el cupo aduanero permitido para llevar licores y perfumes a Colombia continental'], curious_facts: ['San Andrés goza de régimen aduanero especial de puerto libre desde el año 1953'], suggested_minutes: 150, location_info: { address: 'Avenida Providencia, San Andrés', priceRange: '$ - Compras duty free' } }]
      }
    ]
  },
  {
    slug: 'vibetour-cancun-cozumel-isla-mujeres-5d',
    title: 'Riviera Mexicana: Cancún, Arrecifes de Cozumel e Isla Mujeres',
    country: 'México', city: 'Cancún', type: 'romantic', tourScope: 'coastal_islands',
    description: 'Circuito caribeño de 5 días combinando las playas de arena de coral blanco de Cancún, el buceo en los arrecifes de Cozumel y el ambiente relajado en carrito de golf en Isla Mujeres.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 7200, distance_meters: 140000, difficulty: 'easy', rating: 4.95, review_count: 140, likes_count: 490,
    tags: ['Cancún', 'Cozumel', 'Isla Mujeres', 'Caribe Mexicano', 'Arrecifes', 'Costero e Islas'],
    recommended_audience: ['Parejas', 'Amantes del snorkel', 'Buceadores'], best_season: 'Diciembre a Mayo', recommended_schedule: 'Ferris matutinos a las islas',
    meeting_point: 'Playa Delfines, Cancún', includes: ['Ruta costera e insular', 'Horarios de ferris Ultramar'], excludes: ['Billetes de ferry', 'Snorkel en Cozumel'],
    recommendations: ['Comprar los billetes de ferry Ultramar ida y vuelta'], what_to_bring: ['Protector solar biodegradable', 'Zapatos de agua'], tour_rules: ['No tocar las estrellas de mar en El Cielo'],
    budget: { currency: 'MXN', estimatedPerPersonMin: 3500, estimatedPerPersonMax: 7800 },
    days: [
      {
        day_number: 1, title: 'Día 1: Cancún: Playa Delfines y el Mirador', notes: 'Las letras monumentales de Cancún y olas turquesas.',
        stops: [{ stop_order: 1, name: 'Playa Delfines (El Mirador)', latitude: 21.0600, longitude: -86.7790, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Playa pública certificada Blue Flag con las letras icónicas de Cancún y mar azul eléctrico.', activities: ['Foto en el letrero de Cancún (Gratis)', 'Baño en el mar (Gratis)', 'Tacos de pescado en la orilla ($150 MXN)'], tips: ['Tomar el autobús de la zona hotelera R-1 o R-2 ($12 MXN)'], curious_facts: ['La arena blanca de Cancún es de origen coralino y nunca se calienta con el sol'], suggested_minutes: 180, location_info: { address: 'Zona Hotelera Km 19.5, Cancún', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Isla Mujeres: Carrito de Golf y Playa Norte', notes: 'Una de las 10 mejores playas del mundo según TripAdvisor.',
        stops: [{ stop_order: 1, name: 'Playa Norte y Punta Sur en Isla Mujeres', latitude: 21.2580, longitude: -86.7480, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Ferry de 20 minutos desde Puerto Juárez. Playa Norte es una piscina gigante de agua cristalina sin olas con palmeras.', activities: ['Ferry Ultramar ($540 MXN ida y vuelta)', 'Alquiler de carrito de golf por día ($1.000 MXN)', 'Nadar en Playa Norte (Gratis)'], tips: ['Llegar a Punta Sur para ver los acantilados donde tocan los primeros rayos de sol en México'], curious_facts: ['Los conquistadores la llamaron Isla Mujeres por las figuras femeninas dedicadas a la diosa maya Ixchel'], suggested_minutes: 300, location_info: { address: 'Isla Mujeres, Quintana Roo', priceRange: '$$ - Ferry y carrito' } }]
      },
      {
        day_number: 3, title: 'Día 3: Cozumel: El Cielo y Snorkel en Palancar', notes: 'Bancos de arena con estrellas de mar y rayas águila.',
        stops: [{ stop_order: 1, name: 'Arrecife Palancar y El Cielo en Cozumel', latitude: 20.3500, longitude: -87.0300, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Cozumel es la meca mundial del buceo recomendada por Jacques Cousteau. "El Cielo" es un banco de arena transparente tapizado de estrellas de mar gigantes.', activities: ['Ferry de Playa del Carmen a Cozumel ($560 MXN ida y vuelta)', 'Tour en catamarán con snorkel en Palancar y El Cielo ($1.200 - $1.600 MXN)'], tips: ['No tocar jamás las estrellas de mar; sacarlas del agua las asfixia en segundos'], curious_facts: ['La visibilidad submarina en los arrecifes de Cozumel supera habitualmente los 30 metros'], suggested_minutes: 360, location_info: { address: 'Cozumel, Quintana Roo', priceRange: '$$$ - Tour El Cielo' } }]
      },
      {
        day_number: 4, title: 'Día 4: Museo Subacuático de Arte (MUSA)', notes: 'Cientos de esculturas sumergidas que forman arrecifes artificiales.',
        stops: [{ stop_order: 1, name: 'MUSA (Museo Subacuático de Arte)', latitude: 21.1800, longitude: -86.7500, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Más de 500 esculturas de tamaño real sumergidas en el fondo del mar diseñadas con cemento marino neutro para colonización de corales.', activities: ['Snorkel en el MUSA con lancha y guía ($950 MXN)', 'Cena marinera en la laguna Nichupté con vista al atardecer ($450 MXN)'], tips: ['Excelente para snorkel y buceo de iniciación a poca profundidad'], curious_facts: ['Las esculturas fueron creadas por el artista británico Jason deCaires Taylor'], suggested_minutes: 240, location_info: { address: 'Cancún / Isla Mujeres', priceRange: '$$ - Tour MUSA' } }]
      },
      {
        day_number: 5, title: 'Día 5: Mercado 28 y Despedida Caribeña', notes: 'Gastronomía yucateca, recuerdos y traslado al aeropuerto.',
        stops: [{ stop_order: 1, name: 'Mercado 28 en Cancún Centro', latitude: 21.1610, longitude: -86.8330, image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'], description: 'Gran mercado tradicional de artesanías mexicanas, plata de Taxco y comida típica en el centro de Cancún.', activities: ['Comprar recuerdos y artesanías ($100 - $300 MXN)', 'Almuerzo de ceviche mixto con michelada ($180 MXN)'], tips: ['Regatear con cordialidad en los puestos de artesanías'], curious_facts: ['Cancún significa "nido de serpientes" en lengua maya prehispánica'], suggested_minutes: 150, location_info: { address: 'Mercado 28, Cancún Centro', priceRange: '$ - Compras locales' } }]
      }
    ]
  },
  {
    slug: 'vibetour-napoles-capri-costa-amalfitana-6d',
    title: 'Nápoles, Capri y la Costa Amalfitana: El Paraíso Tirreno',
    country: 'Italia', city: 'Nápoles', type: 'romantic', tourScope: 'coastal_islands',
    description: 'Circuito de 6 días que combina la auténtica pizza napolitana en Nápoles, la travesía en barco hacia los Farallones y la Gruta Azul de Capri, y los pueblos de postal colgados de los acantilados de Positano y Amalfi.',
    cover_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 8640, distance_meters: 130000, difficulty: 'moderate', rating: 4.97, review_count: 170, likes_count: 580,
    tags: ['Nápoles', 'Capri', 'Costa Amalfitana', 'Positano', 'Amalfi', 'Italia', 'Costero e Islas'],
    recommended_audience: ['Parejas', 'Viajeros gourmet', 'Fotógrafos de costa'], best_season: 'Mayo a Octubre', recommended_schedule: 'Ferris matutinos entre islas y pueblos costeros',
    meeting_point: 'Piazza del Plebiscito / Muelle Beverello, Nápoles', includes: ['Ruta completa de costa e islas', 'Horarios de hidroalas a Capri'], excludes: ['Billetes de ferry hidroala', 'Barca Gruta Azul', 'Autobuses SITA'],
    recommendations: ['En la Costa Amalfitana moverse en ferry marítimo para evitar los atascos de la estrecha carretera'], what_to_bring: ['Calzado con buen agarre para escaleras empinadas', 'Gafas de sol', 'Bañador'], tour_rules: ['No bañarse en las fuentes de las plazas'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 550, estimatedPerPersonMax: 1200 },
    days: [
      {
        day_number: 1, title: 'Día 1: Nápoles Histórico y la Pizza Margarita Original', notes: 'Spaccanapoli, el Cristo Velado y la cuna de la pizza.',
        stops: [{ stop_order: 1, name: 'Spaccanapoli y Pizzería Da Michele', latitude: 40.8500, longitude: 14.2580, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'La calle recta que divide el casco antiguo de Nápoles. Pizzería Da Michele opera desde 1870 sirviendo exclusivamente pizza Margarita y Marinara.', activities: ['Caminar por Spaccanapoli (Gratis)', 'Pizza Margarita auténtica en Da Michele (€5.50)', 'Ver el Cristo Velado en la Capilla Sansevero (€10)'], tips: ['En Da Michele tomar número en la entrada y esperar turno pacientemente'], curious_facts: ['La pizza Margarita fue inventada en 1889 en honor a la reina Margarita de Saboya con los colores de la bandera italiana (tomate rojo, mozzarella blanca y albahaca verde)'], suggested_minutes: 210, location_info: { address: 'Via Cesare Sersale 1, Napoli', priceRange: '$ - Pizza €5.50' } }]
      },
      {
        day_number: 2, title: 'Día 2: Isla de Capri: Farallones y la Gruta Azul', notes: 'Ferry a la isla del glamour y caverna marina resplandeciente.',
        stops: [{ stop_order: 1, name: 'Farallones de Capri y Gruta Azul (Grotta Azzurra)', latitude: 40.5507, longitude: 14.2426, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'Isla de piedra caliza con sus tres gigantescos monolitos en el mar (Faraglioni) y la mágica Gruta Azul donde la luz del sol entra por una abertura submarina.', activities: ['Hidroala de Nápoles a Capri (€24 ida)', 'Tour en barca de remos entrando a la Gruta Azul (€18)', 'Vistas desde los Jardines de Augusto (€1.50)'], tips: ['La Gruta Azul cierra si hay marea alta o marejada fuerte'], curious_facts: ['El emperador romano Tiberio gobernó todo el Imperio Romano desde su villa imperial en Capri durante sus últimos 10 años de vida'], suggested_minutes: 300, location_info: { address: 'Marina Grande, Capri', priceRange: '$$$ - Excursión isla' } }]
      },
      {
        day_number: 3, title: 'Día 3: Sorrento: Jardines de Limones y Terrazas sobre el Mar', notes: 'Cuna del Limoncello y mirador al Vesubio.',
        stops: [{ stop_order: 1, name: 'Piazza Tasso y Claustro de San Francisco en Sorrento', latitude: 40.6260, longitude: 14.3750, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'Ciudad sobre acantilados de toba con vistas al volcán Vesubio. Conocida por sus plantaciones de limones gigantes y licor de Limoncello artesanal.', activities: ['Paseo por los huertos de limones y degustación gratuita de Limoncello', 'Almuerzo de gnocchi alla sorrentina (€14 - €20)'], tips: ['Sorrento es el punto neurálgico ideal para conectar Nápoles con la Costa Amalfitana'], curious_facts: ['Los limones de Sorrento cuentan con denominación IGP y su piel es tan rica en aceites que se usa para perfumería'], suggested_minutes: 180, location_info: { address: 'Piazza Tasso, Sorrento', priceRange: '$ - Degustación libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Positano: Casas de Colores Colgadas del Acantilado', notes: 'La joya vertical de la Costa Amalfitana.',
        stops: [{ stop_order: 1, name: 'Pueblo de Positano y Playa Grande', latitude: 40.6281, longitude: 14.4850, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'Pueblo vertical construido en una ladera empinadísima con casas de tonos pastel, buganvillas y la cúpula de mayólica de Santa María Asunta.', activities: ['Bajar por las callejuelas escalonadas hacia Spiaggia Grande (Gratis)', 'Tomar un sorbete de limón servido dentro de un limón congelado gigante (€8)', 'Fotografía de la cascada de casas desde el muelle'], tips: ['Llegar en ferry marítimo para tener la vista más imponente de Positano desde el agua'], curious_facts: ['El escritor John Steinbeck escribió en 1953: "Positano te cala hondo. Es un lugar de ensueño que no parece real mientras estás allí"'], suggested_minutes: 240, location_info: { address: 'Positano, Salerno', priceRange: '$$ - Ferry y consumos' } }]
      },
      {
        day_number: 5, title: 'Día 5: Amalfi y Ravello: La Catedral de San Andrés y Villa Rufolo', notes: 'La antigua república marinera y jardines con vistas al infinito.',
        stops: [{ stop_order: 1, name: 'Catedral de Amalfi y Villa Rufolo en Ravello', latitude: 40.6340, longitude: 14.6027, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'Amalfi fue una poderosa república marítima medieval con su catedral de 62 escalones de mármol rayado. Arriba en la montaña, Ravello deslumbra con los jardines de Villa Rufolo que inspiraron a Wagner.', activities: ['Subir la escalinata monumental del Duomo di Amalfi (Entrada claustro: €3)', 'Pasear por los jardines sobre el abismo de Villa Rufolo en Ravello (€7)', 'Probar el dulce tradicional *Delizia al Limone* en pastelería Pansa (€5)'], tips: ['El autobús local conecta Amalfi con Ravello en 25 minutos (€1.50)'], curious_facts: ['Amalfi inventó las *Tablas Amalfitanas*, el primer código de derecho marítimo del mundo medieval'], suggested_minutes: 270, location_info: { address: 'Piazza Duomo, Amalfi', priceRange: '$ - Entradas accesibles' } }]
      },
      {
        day_number: 6, title: 'Día 6: Retorno a Nápoles y Despedida con Vistas al Castel dell\'Ovo', notes: 'El castillo del huevo sobre el mar y despedida.',
        stops: [{ stop_order: 1, name: 'Castel dell\'Ovo y Paseo Marítimo Caracciolo', latitude: 40.8280, longitude: 14.2475, image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'], description: 'La fortaleza más antigua de Nápoles erigida sobre el islote de Megaride. Paseo marítimo con vistas al golfo y al Vesubio.', activities: ['Paseo por el puente de piedra hacia el castillo (Gratis)', 'Último café espresso napolitano con sfogliatella caliente (€3)', 'Tren Alibus directo desde Piazza Garibaldi hacia el aeropuerto Capodichino (€5)'], tips: ['La sfogliatella puede ser *riccia* (hojaldrada) o *frolla* (masa quebrada)'], curious_facts: ['La leyenda cuenta que el poeta Virgilio escondió un huevo mágico en los cimientos del castillo; si se rompe, el castillo y Nápoles se hundirán'], suggested_minutes: 150, location_info: { address: 'Via Eldorado 3, Napoli', priceRange: '$ - Acceso libre' } }]
      }
    ]
  },

  // 4. Ruta de Ciudad a Ciudad / Road Trip (city_to_city) [Tours 43 - 46]
  {
    slug: 'vibetour-road-trip-barranquilla-santa-marta-4d',
    title: 'Road Trip Caribeño: De Barranquilla a Santa Marta por la Vía Parque',
    country: 'Colombia', city: 'Barranquilla', type: 'cultural', tourScope: 'city_to_city',
    description: 'Road trip de 4 días por el litoral caribeño colombiano. Desde el Gran Malecón del Río y la Ventana al Mundo en Barranquilla, cruzando el puente Pumarejo sobre el río Magdalena, la Ciénaga Grande y pueblos palafitos, hasta la bahía de Santa Marta.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 5760, distance_meters: 105000, difficulty: 'easy', rating: 4.91, review_count: 85, likes_count: 290,
    tags: ['Barranquilla', 'Santa Marta', 'Ciénaga', 'Road Trip', 'Caribe', 'city_to_city'],
    recommended_audience: ['Amantes de los road trips', 'Familias', 'Fotógrafos'], best_season: 'Diciembre a Abril', recommended_schedule: 'Conducción diurna para disfrutar del paisaje entre ciénaga y mar',
    meeting_point: 'Gran Malecón del Río, Barranquilla', includes: ['Ruta por carretera con paradas intermedias', 'Guía de paradores gastronómicos'], excludes: ['Alquiler de vehículo / peajes', 'Paseo en lancha en Ciénaga Grande'],
    recommendations: ['Parar a desayunar arepa de huevo tradicional en paradores de carretera'], what_to_bring: ['Gafas de sol', 'Ropa fresca', 'Efectivo para peajes'], tour_rules: ['Respetar los límites de velocidad en la Vía Parque Isla de Salamanca'],
    budget: { currency: 'COP', estimatedPerPersonMin: 290000, estimatedPerPersonMax: 650000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Barranquilla: Gran Malecón del Río y Caimán del Río', notes: 'Paseo junto al río Magdalena y monumento Ventana al Mundo.',
        stops: [{ stop_order: 1, name: 'Gran Malecón del Río y Ventana al Mundo', latitude: 11.0191, longitude: -74.8007, image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'], description: 'Paseo peatonal de 5 km junto al río Magdalena con el mercado gastronómico Caimán del Río y el monumento de vidrio de 47 metros.', activities: ['Caminar junto al río Magdalena (Gratis)', 'Cena de comida típica caribeña en Caimán del Río ($25.000 - $45.000 COP)'], tips: ['La brisa del río es más agradable a partir de las 5:00 PM'], curious_facts: ['La Ventana al Mundo fue construida con más de 2.000 m² de vidrio laminado de colores'], suggested_minutes: 180, location_info: { address: 'Gran Malecón, Barranquilla', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Puente Pumarejo y Vía Parque Isla de Salamanca', notes: 'Cruce del gran río y reserva de manglares y aves.',
        stops: [{ stop_order: 1, name: 'Nuevo Puente Pumarejo y Parque Isla de Salamanca', latitude: 10.9580, longitude: -74.7480, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Uno de los puentes atirantados más anchos del mundo que cruza el río Magdalena hacia el santuario de flora y fauna.', activities: ['Cruce del puente panorámico (Gratis)', 'Senderismo en pasarelas de madera en Isla de Salamanca ($15.000 COP)'], tips: ['Parar a comprar cocadas y dulces tradicionales a la orilla de la carretera'], curious_facts: ['El puente Pumarejo tiene 45 metros de gálibo para permitir el paso de barcos de gran calado'], suggested_minutes: 150, location_info: { address: 'Vía Barranquilla - Santa Marta', priceRange: '$ - Peaje ~$16.000 COP' } }]
      },
      {
        day_number: 3, title: 'Día 3: Ciénaga Patrimonial: Arquitectura Bananera y Realismo Mágico', notes: 'La plaza de la Masacre de las Bananeras que inspiró a García Márquez.',
        stops: [{ stop_order: 1, name: 'Plaza del Centenario y Ciénaga Colonial', latitude: 11.0060, longitude: -74.2500, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Pueblo patrimonio con palacetes republicanos de la bonanza bananera y el templete neoclásico.', activities: ['Fotografiar las casonas de estilo masónico y republicano (Gratis)', 'Almorzar pescado lebranche con patacón frente al mar en Costa Verde ($25.000 COP)'], tips: ['Ciénaga es el epicentro histórico de *Cien años de soledad*'], curious_facts: ['El templete de la plaza fue diseñado imitando el estilo de los templos de la Roma clásica'], suggested_minutes: 150, location_info: { address: 'Plaza del Centenario, Ciénaga', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Llegada a Santa Marta: Bahía, Marina y Despedida', notes: 'Fin de la ruta costera en la ciudad hispánica más antigua.',
        stops: [{ stop_order: 1, name: 'Marina Internacional y Malecón de Santa Marta', latitude: 11.2435, longitude: -74.2144, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'El muelle de veleros y yates con restaurantes sobre el mar y vista al morro de Santa Marta.', activities: ['Atardecer en la Marina con jugo de corozo ($12.000 COP)', 'Cena en el Parque de los Novios ($35.000 COP)'], tips: ['Excelente punto final para continuar hacia Tayrona'], curious_facts: ['Santa Marta fue fundada por Rodrigo de Bastidas en 1525'], suggested_minutes: 180, location_info: { address: 'Carrera 1, Santa Marta', priceRange: '$$ - Moderado' } }]
      }
    ]
  },
  {
    slug: 'vibetour-travesia-medellin-bogota-pueblos-5d',
    title: 'Travesía Andina: De Medellín a Bogotá por la Ruta de los Pueblos',
    country: 'Colombia', city: 'Medellín', type: 'cultural', tourScope: 'city_to_city',
    description: 'Road trip de 5 días cruzando la cordillera y el río Magdalena. Salida de Medellín hacia El Peñol y Guatapé, Cañón del Río Claro, la histórica ciudad de los puentes de Honda y la villa colonial de Guaduas hacia la sabana de Bogotá.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 7200, distance_meters: 420000, difficulty: 'moderate', rating: 4.93, review_count: 75, likes_count: 260,
    tags: ['Medellín', 'Bogotá', 'Honda', 'Guaduas', 'Ruta Pueblos', 'Road Trip', 'city_to_city'],
    recommended_audience: ['Amantes de los viajes por carretera', 'Viajeros culturales'], best_season: 'Diciembre a Marzo y Julio a Agosto', recommended_schedule: 'Jornadas de conducción matutinas',
    meeting_point: 'Medellín / Salida Autopista Medellín - Bogotá', includes: ['Ruta carretera detallada', 'Paradas patrimoniales intermedias'], excludes: ['Vehículo y peajes', 'Alojamiento en ruta'],
    recommendations: ['Revisar frenos antes de descender la cordillera hacia el río Magdalena'], what_to_bring: ['Ropa para clima caliente (Honda 34°C) y clima frío (Bogotá 12°C)'], tour_rules: ['Conducir con precaución en curvas de montaña'],
    budget: { currency: 'COP', estimatedPerPersonMin: 380000, estimatedPerPersonMax: 820000 },
    days: [
      {
        day_number: 1, title: 'Día 1: Medellín a Guatapé y la Piedra del Peñol', notes: 'Monolito de 740 escalones y pueblo de zócalos.',
        stops: [{ stop_order: 1, name: 'Piedra del Peñol y Guatapé', latitude: 6.2206, longitude: -75.1785, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Ascenso a la gran roca y almuerzo paisa en el pueblo de los zócalos.', activities: ['Subida a la piedra ($25.000 COP)', 'Almuerzo de trucha ($35.000 COP)'], tips: ['Subir temprano antes del mediodía'], curious_facts: ['La piedra tiene una hendidura natural por donde se encajó la escalera de hormigón'], suggested_minutes: 240, location_info: { address: 'Guatapé, Antioquia', priceRange: '$$ - Moderado' } }]
      },
      {
        day_number: 2, title: 'Día 2: Cañón del Río Claro: El Paraíso de Mármol', notes: 'Baño en aguas cristalinas sobre roca de mármol.',
        stops: [{ stop_order: 1, name: 'Reserva Natural Río Claro', latitude: 5.8980, longitude: -74.8580, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Parada en el cañón de mármol blanco para descansar y nadar.', activities: ['Entrada a la reserva ($25.000 COP)', 'Baño en el río (Gratis)'], tips: ['Ideal para pernoctar en las cabañas ecológicas sobre el cañón'], curious_facts: ['En el cañón habitan monos tití gris endémicos de Colombia'], suggested_minutes: 240, location_info: { address: 'Autopista Km 152', priceRange: '$ - Entrada reserva' } }]
      },
      {
        day_number: 3, title: 'Día 3: Honda: La Ciudad de los Puentes sobre el Río Magdalena', notes: 'Pueblo patrimonio fluvial colonial con más de 40 puentes.',
        stops: [{ stop_order: 1, name: 'Puente Navarro y Calle de las Trampas en Honda', latitude: 5.2050, longitude: -74.7410, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Principal puerto fluvial del Virreinato. Destaca el Puente Navarro de hierro de 1898 y la empinada Calle de las Trampas de piedra.', activities: ['Cruzar el Puente Navarro histórico sobre el río Magdalena ($2.000 COP)', 'Visitar el Museo del Río Magdalena ($6.000 COP)', 'Probar viudo de pescado bocachico ($25.000 COP)'], tips: ['Honda es calurosa (34°C); llevar ropa muy fresca e hidratación'], curious_facts: ['El Puente Navarro es el puente metálico colgante más antiguo de toda América del Sur'], suggested_minutes: 210, location_info: { address: 'Centro Histórico de Honda, Tolima', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Guaduas Colonial y la Ruta de Policarpa Salavarrieta', notes: 'Pueblo de la heroína de la independencia y Camino Real.',
        stops: [{ stop_order: 1, name: 'Casa Museo Policarpa Salavarrieta y Mirador Piedra Capira', latitude: 5.0680, longitude: -74.5960, image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'], description: 'Caserío colonial de bahareque donde nació la heroína "La Pola". El mirador de Piedra Capira ofrece vista a los tres nevados del Ruiz, Tolima y Santa Isabel.', activities: ['Visitar la casa natal de La Pola (Entrada: $5.000 COP)', 'Mirador de Piedra Capira sobre el valle del Magdalena (Gratis)', 'Probar pan de yuca recién horneado con chocolate caliente ($6.000 COP)'], tips: ['El clima en Guaduas es templado y primaveral (24°C)'], curious_facts: ['Por este Camino Real pasó la Real Expedición Botánica de José Celestino Mutis en 1783'], suggested_minutes: 180, location_info: { address: 'Plaza Principal, Guaduas, Cundinamarca', priceRange: '$ - Entrada museo' } }]
      },
      {
        day_number: 5, title: 'Día 5: Ascenso a la Sabana y Llegada a Bogotá', notes: 'Subida por el Alto del Trigo y fin del road trip en la capital.',
        stops: [{ stop_order: 1, name: 'Llegada a Bogotá por la Calle 80', latitude: 4.7110, longitude: -74.1130, image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'], description: 'Ascenso desde el calor del valle hasta los 2.600 metros de la sabana de Bogotá.', activities: ['Cena de celebración de fin de ruta en la Zona G de Bogotá ($50.000 - $90.000 COP)'], tips: ['Entrar a Bogotá antes de las 4:00 PM para evitar congestiones de tráfico'], curious_facts: ['La carretera asciende más de 2.000 metros de desnivel en tan solo 60 kilómetros'], suggested_minutes: 120, location_info: { address: 'Bogotá D.C.', priceRange: '$$ - Cena final' } }]
      }
    ]
  },
  {
    slug: 'vibetour-pacific-coast-highway-california-7d',
    title: 'Pacific Coast Highway: De San Francisco a Los Ángeles por la Highway 1',
    country: 'Estados Unidos', city: 'San Francisco', type: 'sports', tourScope: 'city_to_city',
    description: 'El road trip costero más famoso del mundo durante 7 días. El puente Golden Gate en San Francisco, los cipreses de Monterey y Carmel-by-the-Sea, los acantilados salvajes de Big Sur con el Bixby Creek Bridge, elefantes marinos y el muelle de Santa Mónica en Los Ángeles.',
    cover_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 10080, distance_meters: 750000, difficulty: 'easy', rating: 4.98, review_count: 210, likes_count: 720,
    tags: ['Highway 1', 'San Francisco', 'Big Sur', 'Los Ángeles', 'California', 'Road Trip', 'Pacific Coast'],
    recommended_audience: ['Amantes de los road trips', 'Parejas', 'Fotógrafos de paisajes'], best_season: 'Mayo a Octubre', recommended_schedule: 'Conducción relajada de norte a sur para circular por el carril junto al océano',
    meeting_point: 'Golden Gate Bridge / Presidio, San Francisco', includes: ['Ruta GPS completa de la Highway 1', 'Puntos panorámicos de parada en Big Sur'], excludes: ['Alquiler de coche convertible o SUV', 'Gasolina y peajes', 'Alojamiento en ruta'],
    recommendations: ['Conducir en sentido Norte a Sur (de SF a LA) para circular por el lado del océano Pacífico con accesos directos a los miradores'], what_to_bring: ['Chaqueta cortavientos', 'Gafas de sol polarizadas', 'Música para carretera'], tour_rules: ['No acampar en zonas no autorizadas de Big Sur'],
    budget: { currency: 'USD', estimatedPerPersonMin: 850, estimatedPerPersonMax: 1900 },
    days: [
      {
        day_number: 1, title: 'Día 1: San Francisco: Golden Gate y Fisherman\'s Wharf', notes: 'El puente rojo sobre la bahía y leones marinos en el Muelle 39.',
        stops: [{ stop_order: 1, name: 'Golden Gate Bridge y Pier 39', latitude: 37.8199, longitude: -122.4783, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'El puente colgante de color naranja internacional inaugurado en 1937 y los leones marinos del Pier 39.', activities: ['Cruzar el Golden Gate caminando o en bicicleta (Gratis peatonal / peaje coche hacia el sur: $9.75 USD)', 'Sopa Clam Chowder en pan de masa madre Boudin ($14 USD)'], tips: ['Abrigarse; la niebla marina *Karl the Fog* suele bajar al atardecer'], curious_facts: ['Su color oficial es "International Orange", elegido porque resaltaba a través de la niebla'], suggested_minutes: 240, location_info: { address: 'Golden Gate Bridge, San Francisco', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Monterey y Carmel-by-the-Sea', notes: '17-Mile Drive, cipreses solitarios y galerías de arte.',
        stops: [{ stop_order: 1, name: '17-Mile Drive y The Lone Cypress', latitude: 36.5680, longitude: -121.9650, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Carretera panorámica privada entre bosques de cipreses y campos de golf de Pebble Beach frente al océano.', activities: ['Paseo por 17-Mile Drive (Peaje coche: $11.75 USD)', 'Caminar por las casas de cuento de hadas de Carmel-by-the-Sea (Gratis)'], tips: ['Carmel no tiene parquímetros ni números de calle formales'], curious_facts: ['El actor Clint Eastwood fue alcalde de Carmel-by-the-Sea en los años 80'], suggested_minutes: 240, location_info: { address: 'Pebble Beach / Carmel, CA', priceRange: '$ - Peaje $11.75' } }]
      },
      {
        day_number: 3, title: 'Día 3: Big Sur: El Icónico Puente Bixby Creek y Acantilados', notes: 'El tramo costero más salvaje e impresionante de Norteamérica.',
        stops: [{ stop_order: 1, name: 'Bixby Creek Bridge y McWay Falls', latitude: 36.3714, longitude: -121.9018, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'El puente de arco de hormigón de 1932 sobre un abismo de 80 metros. Más al sur, la cascada McWay que cae directamente sobre la arena virgen de una cala.', activities: ['Foto clásica del puente Bixby desde el mirador norte (Gratis)', 'Sendero hacia el mirador de la cascada McWay Falls en Julia Pfeiffer Burns State Park ($10 USD aparcamiento)'], tips: ['En Big Sur no hay cobertura de telefonía móvil durante 50 km; descargar mapas offline previamente'], curious_facts: ['El puente Bixby es uno de los puentes de arco de un solo tramo de hormigón más fotografiados del planeta'], suggested_minutes: 300, location_info: { address: 'Highway 1, Big Sur, CA', priceRange: '$ - Mirador libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Elefantes Marinos de San Simeon y Castillo Hearst', notes: 'Colonia salvaje de mamíferos marinos gigantes y palacio de la prensa.',
        stops: [{ stop_order: 1, name: 'Elephant Seal Vista Point y Hearst Castle', latitude: 35.6630, longitude: -121.2570, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Pasarelas sobre la playa donde reposan miles de elefantes marinos de hasta 2 toneladas. En la colina se alza la mansión de 165 habitaciones de William Randolph Hearst.', activities: ['Avistamiento gratuito de elefantes marinos en San Simeon (Gratis)', 'Tour por el Castillo Hearst y su piscina romana de mosaicos de oro ($30 USD)'], tips: ['Llevar prismáticos para ver las crías y peleas de machos en la playa'], curious_facts: ['Hearst inspiró el personaje de Charles Foster Kane en la película *Ciudadano Kane* de Orson Welles'], suggested_minutes: 240, location_info: { address: 'San Simeon, CA 93452', priceRange: '$$ - Tour castillo' } }]
      },
      {
        day_number: 5, title: 'Día 5: Santa Bárbara: La Riviera Americana', notes: 'Arquitectura de tejas rojas y misión colonial española.',
        stops: [{ stop_order: 1, name: 'Misión de Santa Bárbara y Muelle Stearns Wharf', latitude: 34.4380, longitude: -119.7130, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Elegante ciudad de estilo colonial español con palmeras, edificios de adobe encalado y el histórico muelle de madera Stearns Wharf de 1872.', activities: ['Visitar la Misión de Santa Bárbara de 1786 ($15 USD)', 'Paseo por el muelle de madera Stearns Wharf comiendo mariscos frescos ($25 - $40 USD)'], tips: ['Subir a la torre del Palacio de Justicia (Courthouse) para vista panorámica gratuita de los tejados rojos y el mar'], curious_facts: ['Tras el terremoto de 1925, la ciudad aprobó una ley que obligó a que toda nueva construcción tuviera estilo colonial español'], suggested_minutes: 180, location_info: { address: 'Santa Barbara, CA', priceRange: '$$ - Moderado' } }]
      },
      {
        day_number: 6, title: 'Día 6: Malibú y el Fin de la Ruta en Santa Mónica', notes: 'Playas de surferos y el cartel del final de la histórica Ruta 66.',
        stops: [{ stop_order: 1, name: 'Muelle de Santa Mónica (Santa Monica Pier) y Malibú', latitude: 34.0099, longitude: -118.4960, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'El célebre muelle de madera sobre el Pacífico con su parque de atracciones retro y el cartel oficial que marca el final de la mítica Ruta 66.', activities: ['Foto en el cartel "End of the Trail" de la Ruta 66 en el muelle (Gratis)', 'Pasear en bicicleta por el sendero costero hasta Venice Beach ($15 USD alquiler)', 'Subir a la noria solar de Pacific Park en el muelle ($12 USD)'], tips: ['El atardecer en el muelle de Santa Mónica con las luces de la noria es una postal californiana inolvidable'], curious_facts: ['La noria de Pacific Park es la única noria del mundo que funciona íntegramente con energía solar'], suggested_minutes: 240, location_info: { address: '200 Santa Monica Pier, Santa Monica', priceRange: '$ - Acceso muelle libre' } }]
      },
      {
        day_number: 7, title: 'Día 7: Los Ángeles: Hollywood, Beverly Hills y Despedida', notes: 'El Paseo de la Fama y traslado al aeropuerto LAX.',
        stops: [{ stop_order: 1, name: 'Hollywood Walk of Fame y Rodeo Drive', latitude: 34.1016, longitude: -118.3268, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'], description: 'Las estrellas de las celebridades en el pavimento de Hollywood Boulevard y las boutiques de lujo de Beverly Hills antes de volar desde LAX.', activities: ['Buscar la estrella de sus artistas favoritos en el Paseo de la Fama (Gratis)', 'Ver las huellas de manos en cemento en el TCL Chinese Theatre (Gratis)', 'Hamburguesa clásica en In-N-Out Burger cerca del aeropuerto ($8 USD)'], tips: ['Calcular al menos 1 hora y media para el trayecto hacia el aeropuerto LAX debido al tráfico de Los Ángeles'], curious_facts: ['El Paseo de la Fama tiene más de 2.700 estrellas de bronce y terrazo rosa'], suggested_minutes: 180, location_info: { address: 'Hollywood Blvd, Los Angeles, CA', priceRange: '$ - Libre' } }]
      }
    ]
  },
  {
    slug: 'vibetour-pueblos-blancos-sevilla-ronda-malaga-5d',
    title: 'Ruta de los Pueblos Blancos: De Sevilla a Ronda y el Mediterráneo de Málaga',
    country: 'España', city: 'Sevilla', type: 'cultural', tourScope: 'city_to_city',
    description: 'Road trip andaluz de 5 días cruzando la Sierra de Grazalema. Desde la Plaza de España de Sevilla hasta los pueblos encalados de Arcos de la Frontera, el desfiladero vertiginoso del Tajo de Ronda y las playas de Málaga.',
    cover_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 7200, distance_meters: 220000, difficulty: 'moderate', rating: 4.96, review_count: 130, likes_count: 450,
    tags: ['Pueblos Blancos', 'Sevilla', 'Ronda', 'Málaga', 'Andalucía', 'Road Trip', 'El Tajo'],
    recommended_audience: ['Amantes de los paisajes pintorescos', 'Parejas', 'Viajeros gastronómicos'], best_season: 'Marzo a Junio y Septiembre a Noviembre', recommended_schedule: 'Conducción escénica por puertos de montaña por la mañana',
    meeting_point: 'Plaza de España, Sevilla', includes: ['Ruta completa de la Sierra de Cádiz y Ronda', 'Miradores del Tajo de Ronda'], excludes: ['Alquiler de coche / combustible', 'Entradas monumentales'],
    recommendations: ['En los pueblos blancos estacionar en los aparcamientos exteriores; las calles del casco antiguo son extremadamente estrechas'], what_to_bring: ['Calzado para caminar en empedrado', 'Gafas de sol'], tour_rules: ['Conducir con precaución en curvas de sierra'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 350, estimatedPerPersonMax: 780 },
    days: [
      {
        day_number: 1, title: 'Día 1: Sevilla Monumental y Salida hacia Arcos de la Frontera', notes: 'La catedral de Sevilla y llegada a la puerta de los pueblos blancos.',
        stops: [{ stop_order: 1, name: 'Arcos de la Frontera sobre la Peña', latitude: 36.7480, longitude: -5.8080, image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'], description: 'Pueblo encalado de blanco encaramado a un vertiginoso tajo de arenisca sobre el río Guadalete.', activities: ['Caminar por las callejuelas encaladas con cal viva (Gratis)', 'Asomarse al Balcón del Coño en la Plaza del Cabildo (Gratis)'], tips: ['El mirador se llama popularmente así por la exclamación que sueltan todos los que miran al abismo'], curious_facts: ['Las casas se encalan de blanco cada primavera para reflejar la radiación solar y mantener el interior fresco'], suggested_minutes: 180, location_info: { address: 'Plaza del Cabildo, Arcos de la Frontera', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Parque Natural Sierra de Grazalema y Zahara de la Sierra', notes: 'El embalse turquesa a los pies del castillo nazarí.',
        stops: [{ stop_order: 1, name: 'Zahara de la Sierra y Mirador del Pinsapar', latitude: 36.8400, longitude: -5.3900, image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'], description: 'Pueblo coronado por una torre nazarí sobre un peñón que domina las aguas color turquesa del embalse de Zahara.', activities: ['Subir a la Torre del Homenaje del castillo nazarí (€3.50)', 'Probar el queso Payoyo artesanal de cabra y oveja (€10 - €15)'], tips: ['La carretera cruza el Puerto de las Palomas a 1.357 metros con vistas espectaculares'], curious_facts: ['Grazalema ostenta el índice pluviométrico más alto de toda la Península Ibérica'], suggested_minutes: 210, location_info: { address: 'Zahara de la Sierra, Cádiz', priceRange: '$ - Entrada castillo' } }]
      },
      {
        day_number: 3, title: 'Día 3: Setenil de las Bodegas: El Pueblo Bajo las Rocas', notes: 'Casas construidas dentro de cuevas naturales en el cañón.',
        stops: [{ stop_order: 1, name: 'Calle Cuevas del Sol en Setenil de las Bodegas', latitude: 36.8640, longitude: -5.1810, image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'], description: 'Único en el mundo: los habitantes aprovecharon el saliente natural de la roca del cañón del río Trejo para construir las fachadas de sus casas bajo la piedra viva.', activities: ['Caminar por las calles Cuevas del Sol y Cuevas de la Sombra bajo miles de toneladas de roca (Gratis)', 'Tapear sopa cortijera o chacinas ibéricas en las terrazas bajo la roca (€12 - €18)'], tips: ['En Cuevas del Sol da el sol todo el día; en Cuevas de la Sombra la roca cubre la calle como un túnel natural'], curious_facts: ['El nombre "Setenil" proviene del latín *septem nihil* ("siete veces nada"), en alusión a los siete asedios que resistió antes de ser tomada por los Reyes Católicos'], suggested_minutes: 180, location_info: { address: 'Calle Cuevas del Sol, Setenil', priceRange: '$ - Tapas' } }]
      },
      {
        day_number: 4, title: 'Día 4: Ronda Monumental: El Puente Nuevo sobre el Tajo', notes: 'El abismo de 100 metros y la cuna de la tauromaquia moderna.',
        stops: [{ stop_order: 1, name: 'Puente Nuevo y Tajo de Ronda', latitude: 36.7408, longitude: -5.1660, image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'], description: 'Obra maestra de ingeniería del siglo XVIII con 98 metros de altura que une la ciudad vieja con la moderna sobre la garganta del río Guadalevín.', activities: ['Bajar por el sendero al fondo del Tajo para la foto clásica del puente desde abajo (Gratis)', 'Visitar la Plaza de Toros de la Real Maestranza de Ronda de 1785 (€9)', 'Cena con vistas al abismo en el Parador de Ronda (€35 - €50)'], tips: ['El mirador del puente al atardecer es una de las experiencias visuales más impactantes de España'], curious_facts: ['Ernest Hemingway y Orson Welles se enamoraron de Ronda; las cenizas de Welles reposan en una finca de la localidad'], suggested_minutes: 240, location_info: { address: 'Plaza de España, Ronda, Málaga', priceRange: '$ - Mirador libre' } }]
      },
      {
        day_number: 5, title: 'Día 5: Llegada a Málaga: La Alcazaba y Museo Picasso', notes: 'Descenso al mar Mediterráneo, espetos de sardinas y despedida.',
        stops: [{ stop_order: 1, name: 'Alcazaba de Málaga y Teatro Romano', latitude: 36.7210, longitude: -4.4160, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Palacio fortaleza musulmán del siglo XI con vistas al puerto mediterráneo y el teatro romano a sus pies. A pocos pasos, el Museo Picasso.', activities: ['Visitar la Alcazaba y sus jardines de acequias (€3.50 / gratis domingos tarde)', 'Comer espetos de sardinas asadas a la leña en una barca en la playa de Pedregalejo (€6 - €10)', 'Paseo por el Muelle Uno antes del traslado al aeropuerto de Málaga (€3 cercanías C1)'], tips: ['Málaga cuenta con tren de cercanías directo que llega a la terminal del aeropuerto en 12 minutos'], curious_facts: ['Pablo Picasso nació en Málaga en 1881 en la casona de la Plaza de la Merced'], suggested_minutes: 210, location_info: { address: 'Calle Alcazabilla 2, Málaga', priceRange: '$ - Entrada €3.50' } }]
      }
    ]
  },

  // 5. Multiciudad / Internacional (international_multicity) [Tours 47 - 50]
  {
    slug: 'vibetour-duo-iberico-espana-portugal-10d',
    title: 'Dúo Ibérico: De los Palacios de Madrid y Toledo a los Tranvías de Lisboa y Oporto',
    country: 'España y Portugal', city: 'Madrid', type: 'cultural', tourScope: 'international_multicity',
    description: 'Circuito internacional de 10 días por la Península Ibérica. Museos reales en Madrid, Toledo medieval, vuelo a Lisboa con su Torre de Belém y tranvía 28, los palacios de colores de Sintra y las bodegas de vino de ribera en Oporto.',
    cover_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 14400, distance_meters: 1150000, difficulty: 'moderate', rating: 4.97, review_count: 225, likes_count: 780,
    tags: ['España', 'Portugal', 'Madrid', 'Toledo', 'Lisboa', 'Sintra', 'Oporto', 'international_multicity'],
    recommended_audience: ['Viajeros culturales', 'Amantes de la historia ibérica y el vino'], best_season: 'Abril a Junio y Septiembre a Octubre', recommended_schedule: 'Jornadas de monumentos y tardes de fado y gastronomía',
    meeting_point: 'Puerta del Sol, Madrid', includes: ['Ruta completa interconectada', 'Puntos clave de trenes y ferris'], excludes: ['Vuelo Madrid - Lisboa', 'Tren Alfa Pendular Lisboa - Oporto'],
    recommendations: ['Comprar los pasteles de nata calientes en Pastéis de Belém de 1837'], what_to_bring: ['Calzado cómodo para empedrado portugués (*calçada portuguesa*)'], tour_rules: ['Respetar normas de silencio en monasterios'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 800, estimatedPerPersonMax: 1700 },
    days: [
      {
        day_number: 1, title: 'Día 1: Madrid de los Austrias y Museo del Prado', notes: 'Plaza Mayor y Las Meninas de Velázquez.',
        stops: [{ stop_order: 1, name: 'Museo del Prado y Plaza Mayor', latitude: 40.4138, longitude: -3.6921, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Las obras maestras del arte europeo en el Prado y el casco histórico madrileño.', activities: ['Entrada al Prado (€15)', 'Tapas en la Plaza Mayor'], tips: ['Reservar horario online'], curious_facts: ['El Prado cumplió dos siglos en 2019'], suggested_minutes: 240, location_info: { address: 'Madrid', priceRange: '$$ - €15' } }]
      },
      {
        day_number: 2, title: 'Día 2: Toledo Imperial y Vuelo a Lisboa', notes: 'La ciudad de las tres culturas y llegada a Portugal.',
        stops: [{ stop_order: 1, name: 'Catedral de Toledo y Llegada a Lisboa', latitude: 39.8571, longitude: -4.0244, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Catedral gótica de Toledo y vuelo de 1 hora a Lisboa.', activities: ['Visita catedral (€10)', 'Vuelo Madrid - Lisboa'], tips: ['El tren Avant tarda solo 33 minutos a Toledo'], curious_facts: ['Portugal y España comparten el huso horario ibérico con 1 hora de diferencia'], suggested_minutes: 240, location_info: { address: 'Toledo / Lisboa', priceRange: '$$ - Tren y vuelo' } }]
      },
      {
        day_number: 3, title: 'Día 3: Lisboa: Alfama, Tranvía 28 y Miradores', notes: 'El barrio morisco del Fado y las cuestas históricas.',
        stops: [{ stop_order: 1, name: 'Barrio de Alfama y Mirador de Santa Luzia', latitude: 38.7118, longitude: -9.1306, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Calles laberínticas medievales con azulejos, ropa tendida y sonido de guitarras de fado.', activities: ['Paseo en el histórico tranvía 28 amarillo (€3)', 'Mirador de Santa Luzia sobre el río Tajo (Gratis)', 'Cena con espectáculo de fado en vivo (€25 - €40)'], tips: ['Subir al tranvía 28 a primera hora en Martim Moniz para conseguir asiento'], curious_facts: ['Alfama fue el único barrio de Lisboa que sobrevivió casi intacto al gran terremoto de 1755'], suggested_minutes: 210, location_info: { address: 'Alfama, Lisboa', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 4, title: 'Día 4: Belém: Monasterio de los Jerónimos y Torre de Belém', notes: 'Arquitectura manuelina de la era de los descubrimientos.',
        stops: [{ stop_order: 1, name: 'Monasterio de los Jerónimos y Pastéis de Belém', latitude: 38.6979, longitude: -9.2067, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Patrimonio de la Humanidad por la UNESCO. Claustro manuelino con motivos marineros y la tumba de Vasco da Gama.', activities: ['Claustro de los Jerónimos (€10)', 'Pastel de nata caliente con canela en Pastéis de Belém (€1.40)', 'Torre de Belém sobre el río Tajo (€9)'], tips: ['Comprar la entrada combinada online'], curious_facts: ['La receta secreta de los pasteles de Belém solo la conocen seis maestros pasteleros en todo el mundo'], suggested_minutes: 240, location_info: { address: 'Praça do Império, Belém', priceRange: '$ - Entradas €10' } }]
      },
      {
        day_number: 5, title: 'Día 5: Sintra de Cuento: Palacio da Pena y Quinta da Regaleira', notes: 'Palacio de colores romántico y el Pozo Iniciático masónico.',
        stops: [{ stop_order: 1, name: 'Palacio Nacional da Pena y Quinta da Regaleira', latitude: 38.7878, longitude: -9.3906, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Palacio amarillo y rojo en la cima de la sierra de Sintra y los jardines esotéricos con pozos subterráneos de la Regaleira.', activities: ['Entrada al Palacio da Pena (€14)', 'Descenso por la escalera de caracol del Pozo Iniciático de Regaleira (€12)'], tips: ['Tren de cercanías directo desde la estación Rossio de Lisboa a Sintra (40 minutos - €2.40)'], curious_facts: ['Lord Byron describió a Sintra como el "glorioso Edén" en sus poemas'], suggested_minutes: 300, location_info: { address: 'Estrada da Pena, Sintra', priceRange: '$$ - Entradas palacios' } }]
      },
      {
        day_number: 6, title: 'Día 6: Tren Rápido a Oporto: La Ciudad de los Azulejos y el Duero', notes: 'Estación de São Bento y la librería Lello.',
        stops: [{ stop_order: 1, name: 'Estación de São Bento y Librería Lello en Oporto', latitude: 41.1456, longitude: -8.6109, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Tren Alfa Pendular desde Lisboa a Oporto (2h 50m). El vestíbulo de São Bento luce 20.000 azulejos históricos y Lello su escalera roja neogótica.', activities: ['Admirar los 20.000 azulejos de la estación São Bento (Gratis)', 'Entrar a la Librería Lello (€8 deducible en compra de libros)', 'Comer una Francesinha tradicional con salsa picante (€12 - €16)'], tips: ['Reservar turno online para Livraria Lello'], curious_facts: ['El pintor Jorge Colaço tardó 11 años en colocar los azulejos de São Bento'], suggested_minutes: 240, location_info: { address: 'Praça de Almeida Garrett, Porto', priceRange: '$ - Entrada Lello €8' } }]
      },
      {
        day_number: 7, title: 'Día 7: Puente Don Luis I y Bodegas de Vino de Oporto en Gaia', notes: 'Cata de vino dulce de Oporto con barcos rabelo.',
        stops: [{ stop_order: 1, name: 'Puente Dom Luís I y Bodegas de Vila Nova de Gaia', latitude: 41.1400, longitude: -8.6130, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Puente de hierro de dos pisos diseñado por Théophile Seyrig (socio de Eiffel). Enfrente, las bodegas centenarias de vino fortificado (Sandeman, Taylor\'s, Cálem).', activities: ['Cruzar a pie el piso superior del puente con vistas al río Duero (Gratis)', 'Cata guiada de 3 vinos de Oporto (Tawny, Ruby y Blanco) en bodega histórica (€15 - €25)', 'Paseo en barco tradicional rabelo por los 6 puentes del río Duero (€15)'], tips: ['El mirador del Monasterio de la Sierra del Pilar ofrece la mejor foto del puente al atardecer'], curious_facts: ['El vino de Oporto se fortificaba con aguardiente vínico para que no se avinagrara en las bodegas de los barcos que navegaban hacia Inglaterra'], suggested_minutes: 270, location_info: { address: 'Vila Nova de Gaia / Ribeira, Porto', priceRange: '$$ - Cata de vino' } }]
      },
      {
        day_number: 8, title: 'Día 8: Palacio de la Bolsa y Barrio de la Ribeira', notes: 'Salón Árabe dorado y fachadas de colores frente al agua.',
        stops: [{ stop_order: 1, name: 'Palácio da Bolsa e Igreja de São Francisco', latitude: 41.1415, longitude: -8.6155, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Monumento del siglo XIX con su Salón Árabe inspirado en la Alhambra. Al lado, San Francisco cubierto por más de 300 kilos de polvo de oro tallado en madera.', activities: ['Visita guiada al Salón Árabe del Palacio de la Bolsa (€12)', 'Entrada a la iglesia dorada de San Francisco (€8)', 'Cena de bacalao a la brasa con vino verde en la Ribeira (€20 - €32)'], tips: ['La visita al Palacio de la Bolsa es obligatoriamente guiada; reservar turno temprano'], curious_facts: ['El Salón Árabe tardó 18 años en completarse con intrincadas yeserías moriscas'], suggested_minutes: 210, location_info: { address: 'Rua de Ferreira Borges, Porto', priceRange: '$$ - Entrada palacio' } }]
      },
      {
        day_number: 9, title: 'Día 9: Foz do Douro: Paseo Marítimo donde el Río se une al Océano Atlántico', notes: 'El faro de Felgueiras y olas rompiendo en el rompeolas.',
        stops: [{ stop_order: 1, name: 'Foz do Douro y Faro de Felgueiras', latitude: 41.1480, longitude: -8.6720, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Donde las aguas del río Duero desembocan en el bravío Océano Atlántico. Paseo con jardines de pérgolas de hormigón y el faro de granito de 1886.', activities: ['Tomar el tranvía histórico de madera línea 1 junto al río hacia Foz (€3.50)', 'Caminar por el espigón del faro de Felgueiras (Gratis)', 'Tomar un café con vistas a las olas atlánticas (€3)'], tips: ['Si hay temporal marítimo no avanzar por el espigón por seguridad'], curious_facts: ['El tranvía línea 1 funciona con vagones históricos de madera de 1920 con manivelas de bronce originales'], suggested_minutes: 180, location_info: { address: 'Passeio Alegre, Foz do Douro', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 10, title: 'Día 10: Mercado de Bolhão y Despedida Ibérica', notes: 'Quesos de la Sierra de la Estrella, bacalao seco y traslado al aeropuerto.',
        stops: [{ stop_order: 1, name: 'Mercado do Bolhão y Despedida', latitude: 41.1490, longitude: -8.6065, image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'], description: 'Mercado neoclásico de dos plantas recién restaurado con puestos de flores, aceitunas, quesos curados y pan caliente.', activities: ['Comprar quesos de Azeitão y latas de sardinas de diseño retro (€10 - €25)', 'Metro línea violeta E directo desde Trindade al aeropuerto Francisco Sá Carneiro (€2.60 / 25 minutos)'], tips: ['Excelente para compras gastronómicas de última hora antes de volar'], curious_facts: ['El mercado abrió originalmente en 1839 sobre un terreno pantanoso donde brotaba agua (*bolhão*)'], suggested_minutes: 150, location_info: { address: 'Rua Formosa 322, Porto', priceRange: '$ - Compras locales' } }]
      }
    ]
  },
  {
    slug: 'vibetour-triangulo-nordico-escandinavia-11d',
    title: 'Triángulo Nórdico: Copenhague, Estocolmo y Fiordos de Noruega',
    country: 'Dinamarca, Suecia y Noruega', city: 'Copenhague', type: 'cultural', tourScope: 'international_multicity',
    description: 'Circuito escandinavo de 11 días por las tres capitales y los fiordos. Nyhavn en Copenhague, el puente de Øresund, la ciudad sobre islas de Estocolmo con el galeón del Museo Vasa, y la naturaleza de Oslo y el fiordo de Bergen.',
    cover_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 15840, distance_meters: 1350000, difficulty: 'moderate', rating: 4.97, review_count: 175, likes_count: 620,
    tags: ['Escandinavia', 'Copenhague', 'Estocolmo', 'Oslo', 'Bergen', 'Fiordos', 'international_multicity'],
    recommended_audience: ['Amantes de la naturaleza nórdica y el diseño', 'Viajeros de grandes circuitos'], best_season: 'Junio a Agosto (sol de medianoche y días casi eternos)', recommended_schedule: 'Aprovechar las horas de luz de verano',
    meeting_point: 'Canal de Nyhavn, Copenhague', includes: ['Ruta interconectada de trenes y ferris', 'Guía de fiordos'], excludes: ['Trenes SJ y tren escénico Flåm Railway', 'Entradas museos'],
    recommendations: ['En los países nórdicos casi no se usa efectivo; el 99% de las transacciones son con tarjeta de crédito o débito'], what_to_bring: ['Chaqueta cortavientos impermeable', 'Antifaz para dormir (hay luz hasta medianoche)'], tour_rules: ['Respetar el derecho de acceso público a la naturaleza (*Allemansrätten*)'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 1100, estimatedPerPersonMax: 2400 },
    days: [
      {
        day_number: 1, title: 'Día 1: Copenhague: Canal de Nyhavn y La Sirenita', notes: 'Casas de colores del puerto y cuento de Hans Christian Andersen.',
        stops: [{ stop_order: 1, name: 'Canal de Nyhavn y Estatua de La Sirenita', latitude: 55.6797, longitude: 12.5908, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'El puerto histórico con casas de entramado del siglo XVII donde vivió Andersen. En el paseo marítimo de Langelinie reposa la estatua de bronce de La Sirenita.', activities: ['Paseo en barco por los canales de Copenhague (€12)', 'Foto con La Sirenita (Gratis)', 'Comer un Smørrebrød tradicional de arenque o salmón (€15)'], tips: ['Alquilar una bicicleta; Copenhague es la capital mundial de la bici'], curious_facts: ['Andersen escribió sus cuentos en los números 18, 20 y 67 de Nyhavn'], suggested_minutes: 240, location_info: { address: 'Nyhavn, København', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Palacio de Christiansborg y Jardines Tivoli', notes: 'El parlamento danés y el parque de atracciones más antiguo.',
        stops: [{ stop_order: 1, name: 'Palacio de Christiansborg y Tivoli Gardens', latitude: 55.6736, longitude: 12.5683, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Sede del parlamento y salas reales. Por la tarde, los Jardines Tivoli de 1843 con lámparas de feria y arquitectura oriental que inspiraron a Walt Disney.', activities: ['Subir a la torre de Christiansborg para vista panorámica gratuita de la ciudad (Gratis)', 'Entrada a los Jardines Tivoli iluminados (€20)'], tips: ['Tivoli tiene un encanto especial al anochecer'], curious_facts: ['Tivoli cuenta con una de las montañas rusas de madera en funcionamiento más antiguas del mundo (1914)'], suggested_minutes: 240, location_info: { address: 'Vesterbrogade 3, København', priceRange: '$$ - Entrada Tivoli' } }]
      },
      {
        day_number: 3, title: 'Día 3: Cruce del Puente de Øresund y Tren a Estocolmo', notes: 'El colosal puente que une Dinamarca con Suecia sobre el mar.',
        stops: [{ stop_order: 1, name: 'Puente de Øresund y Tren SJ a Estocolmo', latitude: 55.5700, longitude: 12.8200, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Obra maestra de ingeniería de 8 km que combina puente atirantado, isla artificial y túnel submarino cruzando a Malmö, seguido de tren de alta velocidad hacia Estocolmo.', activities: ['Viaje en tren sobre el puente de Øresund (€15)', 'Tren SJ X2000 a Estocolmo Central (4 horas y media - €35 - €60)'], tips: ['Tener el pasaporte a mano para el control fronterizo en Hyllie'], curious_facts: ['El puente inspiró la célebre serie policiaca escandinava *Bron / The Bridge*'], suggested_minutes: 300, location_info: { address: 'Øresund / Stockholm Central', priceRange: '$$ - Trenes nórdicos' } }]
      },
      {
        day_number: 4, title: 'Día 4: Estocolmo: Gamla Stan y el Increíble Museo Vasa', notes: 'La ciudad vieja medieval y el barco de guerra del siglo XVII rescatado intacto.',
        stops: [{ stop_order: 1, name: 'Gamla Stan y Museo Vasa (Vasamuseet)', latitude: 59.3280, longitude: 18.0914, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Gamla Stan es la isla fundacional con callejuelas adoquinadas de color ocre. El Museo Vasa alberga el único barco del siglo XVII conservado en el mundo (98% original), rescatado del fondo del mar.', activities: ['Asombrarse ante el colosal buque real de guerra Vasa de 69 metros (Entrada: ~190 SEK / €17)', 'Caminar por la plaza Stortorget en Gamla Stan (Gratis)', 'Probar albóndigas suecas tradicionales *Köttbullar* con puré y mermelada de arándanos (€18)'], tips: ['El museo Vasa tiene temperatura controlada de 18°C; llevar una chaqueta'], curious_facts: ['El Vasa se hundió en su viaje inaugural en 1628 tras navegar apenas 1.300 metros por un exceso de peso en sus cañones'], suggested_minutes: 270, location_info: { address: 'Galärvarvsvägen 14, Stockholm', priceRange: '$$ - Entrada museo' } }]
      },
      {
        day_number: 5, title: 'Día 5: Ayuntamiento de Estocolmo y Metro de Arte', notes: 'El Salón Dorado de los Premios Nobel y la galería de arte subterránea.',
        stops: [{ stop_order: 1, name: 'Ayuntamiento de Estocolmo (Stadshuset) y Metro Art', latitude: 59.3275, longitude: 18.0544, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'El Salón Azul donde se celebra el banquete anual de los Premios Nobel y el Salón Dorado con 18 millones de azulejos de oro. El metro de Estocolmo está considerado la galería de arte más larga del mundo.', activities: ['Tour guiado por el Salón de los Nobel del Ayuntamiento (€13)', 'Ruta en metro explorando las estaciones talladas en roca como T-Centralen y Solna Centrum (€4)', 'Tomar el café tradicional sueco con bollo de canela *Fika* (€7)'], tips: ['La pausa del café *Fika* es una institución social sagrada en Suecia'], curious_facts: ['El Salón Azul no es azul sino de ladrillo rojo; el arquitecto cambió de idea al ver la belleza del ladrillo desnudo'], suggested_minutes: 240, location_info: { address: 'Hantverkargatan 1, Stockholm', priceRange: '$ - Entrada tour' } }]
      },
      {
        day_number: 6, title: 'Día 6: Hacia Noruega: Tren a Oslo y Parque Vigeland', notes: 'Las más de 200 esculturas desnudas de granito y bronce.',
        stops: [{ stop_order: 1, name: 'Parque de Esculturas de Vigeland en Oslo', latitude: 59.9270, longitude: 10.7008, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Tren a la capital noruega. El parque de Vigeland es el mayor parque de esculturas creadas por un solo artista en el mundo, con 212 figuras humanas en granito y el colosal Monolito de 14 metros.', activities: ['Pasear entre las esculturas del ciclo vital humano (Gratis)', 'Foto con la famosa escultura del "Niño enojado" (*Sinnataggen*) (Gratis)', 'Caminar por el tejado inclinado de mármol blanco de la Ópera de Oslo frente al fiordo (Gratis)'], tips: ['El tejado de la Ópera de Oslo está diseñado expresamente para que la gente camine sobre él hasta la orilla del agua'], curious_facts: ['Gustav Vigeland dedicó más de 40 años de su vida a esculpir todas las figuras del parque'], suggested_minutes: 240, location_info: { address: 'Nobels gate 32, Oslo', priceRange: '$ - Parque público libre' } }]
      },
      {
        day_number: 7, title: 'Día 7: Museo Munch y Barco del Fiordo de Oslo', notes: '"El Grito" de Edvard Munch y el paseo marítimo de Aker Brygge.',
        stops: [{ stop_order: 1, name: 'Museo MUNCH y Aker Brygge', latitude: 59.9055, longitude: 10.7550, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Torre inclinada de 13 plantas que custodia las versiones de "El Grito" de Edvard Munch. A orillas del fiordo, Aker Brygge combina antiguos astilleros con terrazas gastronómicas.', activities: ['Ver "El Grito" original de Munch (Entrada: ~160 NOK / €14)', 'Almorzar salmón noruego fresco a la plancha en Aker Brygge (€25 - €40)', 'Paseo en ferry eléctrico por las islas del fiordo de Oslo (€4)'], tips: ['El museo rota cada hora entre la versión de pintura, pastel y litografía de El Grito para protegerlas de la luz'], curious_facts: ['Munch pintó cuatro versiones de "El Grito" para capturar la angustia cósmica de la naturaleza'], suggested_minutes: 210, location_info: { address: 'Edvard Munchs Plass 1, Oslo', priceRange: '$$ - Entrada museo' } }]
      },
      {
        day_number: 8, title: 'Día 8: La Gran Ruta de los Fiordos: Norway in a Nutshell', notes: 'El tren de alta montaña Bergen Railway y el crucero en fiordo de Aurland.',
        stops: [{ stop_order: 1, name: 'Nærøyfjord y Tren Escénico de Flåm (Flåmsbana)', latitude: 60.8600, longitude: 7.1100, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Considerado el viaje panorámico más espectacular de Europa. Tren de montaña a Myrdal, descenso en el vertiginoso tren de Flåm entre cascadas y navegación en barco silencioso por el estrecho Nærøyfjord (UNESCO).', activities: ['Descenso de 20 km en el tren Flåmsbana con parada en la cascada Kjosfossen (Billete incluido en pase: ~$65 USD)', 'Crucero en barco eléctrico silencioso por las aguas verdes del Nærøyfjord entre paredes de 1.000 metros (Incluido)', 'Llegada en tren nocturno a Bergen'], tips: ['Llevar abrigo; en el crucero por el fiordo el viento entre los cañones es frío incluso en verano'], curious_facts: ['El Nærøyfjord tiene tramos de solo 250 metros de ancho con montañas que caen en vertical a plomo sobre el agua'], suggested_minutes: 360, location_info: { address: 'Flåm / Nærøyfjord, Noruega', priceRange: '$$$ - Pase escénico' } }]
      },
      {
        day_number: 9, title: 'Día 9: Bergen: Muelle Hanseático de Bryggen y Mercado de Pescado', notes: 'Las casas de madera de colores de los comerciantes hanseáticos.',
        stops: [{ stop_order: 1, name: 'Muelle de Bryggen y Fisketorget en Bergen', latitude: 60.3975, longitude: 5.3245, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Patrimonio de la Humanidad UNESCO. Hilera de almacenes comerciales medievales de madera inclinada de la Liga Hanseática. En el muelle, el bullicioso mercado de pescado al aire libre.', activities: ['Caminar por los pasadizos oscuros de madera de Bryggen (Gratis)', 'Subir en el funicular Fløibanen al mirador del Monte Fløyen (€14 ida y vuelta)', 'Degustar cangrejo real rey del Ártico y salmón salvaje en el mercado de pescado (€25 - €45)'], tips: ['Bergen es célebre por su lluvia; llevar siempre impermeable'], curious_facts: ['Bryggen se ha incendiado y reconstruido varias veces a lo largo de 800 años, manteniendo siempre sus planos de madera medievales originales'], suggested_minutes: 240, location_info: { address: 'Bryggen, 5003 Bergen', priceRange: '$$ - Funicular y marisco' } }]
      },
      {
        day_number: 10, title: 'Día 10: Senderismo en el Monte Fløyen y Bosque de los Trolls', notes: 'Naturaleza nórdica con lagos y leyendas de seres mágicos.',
        stops: [{ stop_order: 1, name: 'Monte Fløyen y Bosque de los Trolls (Trollskogen)', latitude: 60.3950, longitude: 5.3400, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Senderos en la montaña que domina Bergen poblados de figuras de madera de trolls mitológicos entre abetos y lagos de montaña cristalinos.', activities: ['Senderismo suave por el lago Skomakerdiket con canoas gratuitas en verano (Gratis)', 'Fotografiar las esculturas de trolls gigantes con nariz larga (Gratis)', 'Comer gofres noruegos en forma de corazón con queso marrón dulce *Brunost* (€6)'], tips: ['Bajar a pie desde la cumbre hasta Bergen en una caminata de 45 minutos entre bosques'], curious_facts: ['El queso marrón noruego *Brunost* es caramelizado y tiene un inconfundible sabor dulce a tofe salado'], suggested_minutes: 210, location_info: { address: 'Fløyfjellet, Bergen', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 11, title: 'Día 11: Despedida Nórdica en Bergen', notes: 'Últimas postales de fiordo y traslado al aeropuerto.',
        stops: [{ stop_order: 1, name: 'Puerto de Bergen y Despedida', latitude: 60.3910, longitude: 5.3210, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'], description: 'Último paseo por el muelle antes de tomar el tren ligero Bybanen directo al aeropuerto de Bergen Flesland (45 minutos - €4).', activities: ['Comprar jerséis de lana pura noruega con patrones de copos de nieve (€60 - €120)', 'Café caliente y despedida de Escandinavia'], tips: ['El Bybanen línea 1 sale cada 10 minutos desde el centro'], curious_facts: ['Bergen fue la capital del reino de Noruega en los siglos XII y XIII antes que Oslo'], suggested_minutes: 120, location_info: { address: 'Bergen Sentrum', priceRange: '$ - Compras' } }]
      }
    ]
  },
  {
    slug: 'vibetour-sureste-asiatico-tailandia-camboya-vietnam-14d',
    title: 'Sureste Asiático Conectado: De los Templos de Bangkok y Angkor Wat a la Bahía de Ha Long',
    country: 'Tailandia, Camboya y Vietnam', city: 'Bangkok', type: 'cultural', tourScope: 'international_multicity',
    description: 'La gran expedición de 14 días por la península indochina. Palacios reales en Bangkok, las ruinas colosales devoradas por la selva en Angkor Wat (Camboya), el barrio antiguo de Hanói y un crucero con noche a bordo entre los miles de islotes kársticos de la Bahía de Ha Long (Vietnam).',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 20160, distance_meters: 1850000, difficulty: 'moderate', rating: 4.99, review_count: 260, likes_count: 940,
    tags: ['Sureste Asiático', 'Bangkok', 'Angkor Wat', 'Siem Reap', 'Hanói', 'Ha Long Bay', 'international_multicity'],
    recommended_audience: ['Grandes expedicionarios', 'Amantes de la arqueología y la selva', 'Fotógrafos'], best_season: 'Noviembre a Marzo (temporada seca y menos calurosa)', recommended_schedule: 'Amanecer en Angkor Wat a las 5:00 AM',
    meeting_point: 'Gran Palacio de Bangkok, Tailandia', includes: ['Ruta completa de 3 países', 'Itinerario de Angkor Wat y Bahía de Ha Long'], excludes: ['Visados de Camboya y Vietnam', 'Pase de Angkor Wat ($37 USD)', 'Crucero Ha Long'],
    recommendations: ['Tramitar el visado electrónico (e-Visa) para Camboya y Vietnam antes de viajar', 'Para templos de Camboya y Tailandia es obligatorio llevar hombros y rodillas cubiertos'], what_to_bring: ['Ropa transpirable', 'Repelente de mosquitos fuerte con DEET', 'Dólares estadounidenses en efectivo sin roturas (muy usados en Camboya)'], tour_rules: ['No subirse a las raíces de los árboles en Ta Prohm'],
    budget: { currency: 'USD', estimatedPerPersonMin: 950, estimatedPerPersonMax: 1900 },
    days: [
      {
        day_number: 1, title: 'Día 1: Bangkok: El Gran Palacio y Wat Phra Kaew', notes: 'Inicio en la capital de Tailandia.',
        stops: [{ stop_order: 1, name: 'Gran Palacio de Bangkok', latitude: 13.7500, longitude: 100.4913, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'El templo del Buda de Esmeralda y los palacios reales tailandeses.', activities: ['Entrada oficial (500 THB)', 'Paseo en barco por el río Chao Phraya'], tips: ['Llevar pantalones largos'], curious_facts: ['El complejo mide más de 200.000 m²'], suggested_minutes: 180, location_info: { address: 'Bangkok', priceRange: '$$ - Entrada' } }]
      },
      {
        day_number: 2, title: 'Día 2: Wat Pho y Vuelo a Siem Reap (Camboya)', notes: 'El Buda reclinado de 46 metros y vuelo a la tierra de los jemeres.',
        stops: [{ stop_order: 1, name: 'Wat Pho y Vuelo a Siem Reap', latitude: 13.7437, longitude: 100.4889, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Visita matutina a Wat Pho y vuelo de 1 hora a Siem Reap.', activities: ['Buda reclinado (300 THB)', 'Vuelo internacional a Camboya'], tips: ['Llevar 30 USD en billete intacto para la tasa de visa on arrival si no tiene e-visa'], curious_facts: ['Los pies del Buda están decorados con 108 símbolos sagrados en madreperla'], suggested_minutes: 240, location_info: { address: 'Bangkok / Siem Reap', priceRange: '$$ - Vuelo' } }]
      },
      {
        day_number: 3, title: 'Día 3: El Amanecer Mágico en Angkor Wat', notes: 'El monumento religioso más grande del mundo reflejado en el estanque.',
        stops: [{ stop_order: 1, name: 'Santuario de Angkor Wat', latitude: 13.4125, longitude: 103.8670, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Construido en el siglo XII por Suryavarman II. Sus cinco torres estilizadas simbolizan los picos del monte Meru rodeados por un foso de agua.', activities: ['Ver amanecer tras las torres de Angkor Wat (Pase Angkor 1 día: $37 USD / 3 días: $62 USD)', 'Alquiler de tuk-tuk con conductor todo el día ($18 - $25 USD)', 'Cruzar las galerías con bajorrelieves del batido del océano de leche'], tips: ['Llegar a la orilla del estanque izquierdo a las 5:15 AM para la foto clásica con reflejo en el agua'], curious_facts: ['Angkor Wat es el único templo jemer orientado hacia el oeste, punto cardinal asociado a la puesta de sol y la vida futura'], suggested_minutes: 300, location_info: { address: 'Parque Arqueológico de Angkor, Siem Reap', priceRange: '$$$ - Pase $37 USD' } }]
      },
      {
        day_number: 4, title: 'Día 4: Angkor Thom: Las Caras de Bayón y Ta Prohm (Tomb Raider)', notes: 'Rostros de piedra gigantes y árboles estranguladores sobre los muros.',
        stops: [{ stop_order: 1, name: 'Templo de Bayón y Templo de Ta Prohm', latitude: 13.4350, longitude: 103.8890, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Bayón cuenta con 54 torres decoradas con más de 200 rostros gigantes sonrientes de piedra. Ta Prohm fue dejado intencionadamente tal como se descubrió, devorado por las raíces aéreas de higueras gigantes y árboles de seda.', activities: ['Contemplar las enigmáticas sonrisas de piedra de Bayón (Incluido en pase)', 'Fotografiar las raíces colosales abrazando las puertas de piedra de Ta Prohm (Gratis con pase)', 'Cena de pescado Amok al vapor en hoja de plátano en Pub Street ($6 - $12 USD)'], tips: ['El templo de Ta Prohm se hizo mundialmente famoso en la película de Lara Croft *Tomb Raider*'], curious_facts: ['Las raíces de los árboles han crecido durante siglos fusionándose con la estructura; talar los árboles hoy causaría el derrumbe de los muros'], suggested_minutes: 300, location_info: { address: 'Angkor Thom / Ta Prohm', priceRange: '$$ - Incluido en pase' } }]
      },
      {
        day_number: 5, title: 'Día 5: Aldeas Flotantes del Lago Tonlé Sap y Vuelo a Hanói (Vietnam)', notes: 'Casas sobre pilotes en el mayor lago de agua dulce del sureste asiático.',
        stops: [{ stop_order: 1, name: 'Pueblo Flotante de Kompong Phluk y Vuelo a Hanói', latitude: 13.2000, longitude: 103.9800, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Aldea construida sobre pilotes de madera de 10 metros de altura para adaptarse a las gigantescas crecidas anuales del lago. Por la tarde, vuelo a Hanói, capital de Vietnam.', activities: ['Paseo en barca tradicional de madera por la aldea y bosque inundado de manglares ($20 USD)', 'Vuelo de Siem Reap a Hanói (~$120 USD)', 'Primer paseo nocturno alrededor del lago Hoan Kiem en Hanói (Gratis)'], tips: ['En época de lluvias el lago Tonlé Sap quintuplica su tamaño habitual debido a que el río Mekong invierte su curso'], curious_facts: ['Tonlé Sap es una de las fuentes de pesca de agua dulce más productivas del planeta'], suggested_minutes: 240, location_info: { address: 'Tonlé Sap / Hanói', priceRange: '$$ - Tour y vuelo' } }]
      },
      {
        day_number: 6, title: 'Día 6: Hanói Colonial: Las 36 Calles del Old Quarter y Café de Huevo', notes: 'Callejones gremiales, arquitectura francesa y tren atravesando la calle.',
        stops: [{ stop_order: 1, name: 'Old Quarter de Hanói y Train Street', latitude: 21.0285, longitude: 105.8542, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'El barrio histórico donde cada calle lleva el nombre de la mercancía que vendía hace siglos (seda, plata, estaño). Train Street es un callejón estrecho donde el tren de pasajeros pasa rozando las mesas de las cafeterías.', activities: ['Tomar el famoso café con crema de yema de huevo (*Cà phê trứng*) en Cafe Giảng (~35.000 VND / ~$1.40 USD)', 'Comer una sopa Phở de ternera humeante en banquitos de plástico en la calle (~50.000 VND / ~$2 USD)', 'Pasear por el Templo de la Literatura de 1070 dedicado a Confucio (30.000 VND)'], tips: ['Para ver pasar el tren en Train Street es obligatorio sentarse en una de las cafeterías de la vía'], curious_facts: ['El café de huevo fue inventado en Hanói en la década de 1940 cuando escaseaba la leche fresca y un camarero del hotel Metropole batió yemas de huevo con azúcar para emulsionarlo'], suggested_minutes: 240, location_info: { address: 'Hoan Kiem District, Hanoi', priceRange: '$ - Gastronomía callejera barata' } }]
      },
      {
        day_number: 7, title: 'Día 7: Bahía de Ha Long: Zarpe en Crucero y Noche entre Islotes', notes: 'Más de 1.600 torres de roca caliza esmeralda emergiendo del mar.',
        stops: [{ stop_order: 1, name: 'Crucero en la Bahía de Ha Long (UNESCO)', latitude: 20.9100, longitude: 107.1800, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Una de las Nuevas 7 Maravillas Naturales del Mundo. Navegación en junco tradicional entre miles de monolitos de piedra kárstica cubiertos de vegetación selvática que se alzan del agua verde.', activities: ['Embarque en crucero tradicional con camarote privado y pensión completa (~$140 - $220 USD por 2 días / 1 noche)', 'Paseo en kayak doble navegando bajo túneles de roca naturales (Incluido en el crucero)', 'Pesca de calamares con caña en la popa del barco al anochecer'], tips: ['Llevar bañador para nadar en calas de aguas calmas entre los islotes'], curious_facts: ['Ha Long significa "donde el dragón desciende al mar"; la leyenda cuenta que los islotes fueron creados por un dragón celestial para frenar a los invasores navales'], suggested_minutes: 360, location_info: { address: 'Ha Long Bay, Quang Ninh', priceRange: '$$$ - Crucero noche a bordo' } }]
      },
      {
        day_number: 8, title: 'Día 8: Cueva de la Sorpresa (Sung Sot) y Regreso a Hanói', notes: 'Caverna monumental de estalactitas iluminada en la bahía.',
        stops: [{ stop_order: 1, name: 'Cueva Sung Sot y Desembarque', latitude: 20.8400, longitude: 107.0900, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'La mayor caverna de la bahía descubierta por exploradores franceses en 1901 con salas gigantescas repletas de estalagmitas que parecen esculturas.', activities: ['Recorrido a pie por las pasarelas dentro de la cueva iluminada (Incluido en el crucero)', 'Clase de Tai Chi matutina en la cubierta del barco al amanecer', 'Regreso en autobús hacia Hanói (2 horas y media por autopista moderna)'], tips: ['La subida a la cueva tiene unos 100 escalones de piedra; llevar calzado cómodo'], curious_facts: ['Los franceses la bautizaron "Grotte des Surprises" por la asombrosa inmensidad de su cámara interior'], suggested_minutes: 240, location_info: { address: 'Ha Long Bay / Hanói', priceRange: '$$ - Incluido en crucero' } }]
      },
      {
        day_number: 9, title: 'Día 9: Tam Coc (Ninh Binh): "La Bahía de Ha Long en Tierra"', notes: 'Paseo en barca remada con los pies entre arrozales y picos de roca.',
        stops: [{ stop_order: 1, name: 'Tam Coc y Cueva de Mua en Ninh Binh', latitude: 20.2180, longitude: 105.9370, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Paseo en bote tradicional por el río Ngo Dong donde los remeros locales reman hábilmente con los pies mientras la barca cruza tres cuevas naturales bajo montañas kársticas.', activities: ['Paseo en barca remada con los pies por Tam Coc (200.000 VND / ~$8 USD)', 'Subir los 500 escalones del dragón en Hang Mua para la panorámica del río y arrozales (100.000 VND)', 'Paseo en bicicleta entre campos de arroz y búfalos de agua (Gratis / alquiler $2 USD)'], tips: ['En mayo y junio los arrozales a ambos lados del río están dorados para la cosecha'], curious_facts: ['Los barqueros reman con los pies para descansar la espalda y los brazos durante los largos recorridos diarios'], suggested_minutes: 300, location_info: { address: 'Ninh Binh, Vietnam', priceRange: '$ - Excursión accesible' } }]
      },
      {
        day_number: 10, title: 'Día 10: Tren Nocturno o Vuelo a Da Nang y la Ciudad de las Linternas: Hoi An', notes: 'Pueblo patrimonio iluminado por miles de farolillos de seda.',
        stops: [{ stop_order: 1, name: 'Casco Antiguo de Hoi An y Puente Japonés', latitude: 15.8801, longitude: 108.3380, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Antiguo puerto comercial del siglo XVI donde no circulan automóviles. Calles peatonales amarillas adornadas con miles de farolillos de seda artesanales y el Puente Japonés cubierto de madera.', activities: ['Paseo nocturno en barca soltando una vela encendida de papel en el río Thu Bon (100.000 VND / ~$4 USD)', 'Comer fideos Cao Lau tradicionales con cerdo crujiente (40.000 VND)', 'Encargar ropa a medida en las sastrerías exprés de la ciudad ($30 - $70 USD en 24 horas)'], tips: ['La noche de luna llena apagan todas las luces eléctricas del centro para iluminar solo con farolillos de seda'], curious_facts: ['El Puente Japonés tiene una pagoda en su interior y esculturas de perros y monos que marcan el inicio y fin de su construcción según el horóscopo chino'], suggested_minutes: 270, location_info: { address: 'Old Town, Hoi An, Quang Nam', priceRange: '$ - Entrada patrimonio ~€5' } }]
      },
      {
        day_number: 11, title: 'Día 11: Ba Na Hills: El Puente de las Manos Gigantes (Golden Bridge)', notes: 'Pasarela dorada sostenida por dos colosales manos de piedra en las nubes.',
        stops: [{ stop_order: 1, name: 'Golden Bridge (Cầu Vàng) en Ba Na Hills', latitude: 15.9950, longitude: 107.9960, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Puente peatonal de 150 metros a 1.400 metros de altitud que parece flotar en el aire sostenido por dos manos gigantes de piedra envejecida que emergen de la montaña.', activities: ['Subir en el teleférico de un solo cable más largo del mundo (Entrada parque + teleférico: ~900.000 VND / ~$36 USD)', 'Caminar sobre el puente dorado entre las manos gigantes (Gratis con entrada)', 'Vistas de la costa de Da Nang desde la cumbre'], tips: ['Subir en el primer teleférico de las 7:30 AM para cruzar el puente sin cientos de turistas'], curious_facts: ['Las manos parecen esculpidas en piedra milenaria, pero en realidad están hechas de una estructura de acero recubierta de fibra de vidrio y musgo artificial'], suggested_minutes: 240, location_info: { address: 'Sun World Ba Na Hills, Da Nang', priceRange: '$$ - Entrada $36 USD' } }]
      },
      {
        day_number: 12, title: 'Día 12: Vuelo a Ho Chi Minh (Saigón) y Túneles de Cu Chi', notes: 'La red subterránea secreta de 250 km de la guerra de Vietnam.',
        stops: [{ stop_order: 1, name: 'Túneles de Cu Chi y Saigón', latitude: 11.1430, longitude: 106.4630, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'Vuelo a la bulliciosa metrópoli del sur. En Cu Chi se visita la asombrosa red de túneles subterráneos excavados a mano por el Viet Cong con cocinas sin humo, hospitales y trampas ocultas.', activities: ['Gatear por un tramo ensanchado de 20 metros de túnel bajo tierra (Entrada: 125.000 VND / ~$5 USD)', 'Ver las trampas de bambú y trampillas secretas camufladas en la selva (Gratis con entrada)', 'Probar yuca cocida con azúcar y sal como comían los guerrilleros'], tips: ['No entrar al túnel si sufre de claustrofobia; se puede recorrer todo el museo al aire libre'], curious_facts: ['Los túneles contaban con tres niveles subterráneos capaces de resistir bombardeos de aviones B-52'], suggested_minutes: 270, location_info: { address: 'Cu Chi, Ciudad Ho Chi Minh', priceRange: '$ - Entrada $5 USD' } }]
      },
      {
        day_number: 13, title: 'Día 13: Delta del Río Mekong: Frutas Tropicales y Mercados Flotantes', notes: 'Los nueve brazos del río dragón donde la vida transcurre en el agua.',
        stops: [{ stop_order: 1, name: 'Delta del Mekong (My Tho y Ben Tre)', latitude: 10.3500, longitude: 106.3600, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'El granero de arroz de Vietnam. Navegación en barcas de remo por canales estrechos cubiertos por palmeras de agua *dừa nước*, talleres de caramelos de coco y música tradicional del sur.', activities: ['Paseo en canoa tradicional a remo bajo túneles de palmeras acuáticas (Tour día completo: ~$20 - $35 USD)', 'Degustación de frutas exóticas (pitahaya, rambután, ojo de dragón) con miel de abejas silvestre', 'Visitar taller artesanal donde elaboran caramelos blandos de leche de coco caliente'], tips: ['Llevar sombrero cónico tradicional vietnamita (*nón lá*) para protegerse del sol'], curious_facts: ['El Mekong nace en la meseta tibetana y recorre seis países antes de desembocar en este delta en nueve brazos llamados "los nueve dragones"'], suggested_minutes: 300, location_info: { address: 'My Tho, Ben Tre', priceRange: '$ - Excursión accesible' } }]
      },
      {
        day_number: 14, title: 'Día 14: Catedral de Notre-Dame de Saigón, Mercado Ben Thanh y Despedida', notes: 'Últimas compras de café de filtro vietnamita y vuelo internacional.',
        stops: [{ stop_order: 1, name: 'Mercado Ben Thanh y Oficina Central de Correos de Saigón', latitude: 10.7725, longitude: 106.6980, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'], description: 'La emblemática Oficina de Correos con estructura de hierro diseñada por Gustave Eiffel y el vibrante mercado Ben Thanh para comprar recuerdos.', activities: ['Enviar una postal desde la histórica oficina de correos de madera y hierro (€1.50)', 'Comprar café Robusta con filtro tradicional Phin y dulces de coco en Ben Thanh ($10 - $20 USD)', 'Último sándwich Bánh Mì crujiente con paté y cilantro antes del traslado al aeropuerto de Tan Son Nhat ($2 USD)'], tips: ['El aeropuerto internacional de Saigón (SGN) queda dentro de la ciudad a solo 30 minutos en taxi'], curious_facts: ['Vietnam es el segundo mayor exportador de café de todo el planeta, solo por detrás de Brasil'], suggested_minutes: 180, location_info: { address: 'District 1, Ho Chi Minh City', priceRange: '$ - Compras locales' } }]
      }
    ]
  },
  {
    slug: 'vibetour-gran-travesia-cono-sur-chile-argentina-12d',
    title: 'Gran Travesía Cono Sur: De los Viñedos de Chile al Tango de Buenos Aires y Cataratas del Iguazú',
    country: 'Chile y Argentina', city: 'Santiago de Chile', type: 'cultural', tourScope: 'international_multicity',
    description: 'Expedición de 12 días por el Cono Sur de América. La cordillera nevada en Santiago de Chile y los cerros de Valparaíso, cruce andino a Mendoza con sus bodegas de Malbec, la vida porteña de Buenos Aires y la potencia atronadora de las Cataratas del Iguazú.',
    cover_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80'],
    duration_minutes: 17280, distance_meters: 1950000, difficulty: 'moderate', rating: 4.98, review_count: 240, likes_count: 830,
    tags: ['Cono Sur', 'Santiago', 'Valparaíso', 'Mendoza', 'Buenos Aires', 'Iguazú', 'Vino', 'international_multicity'],
    recommended_audience: ['Amantes del vino y la gastronomía', 'Viajeros de grandes paisajes', 'Parejas'], best_season: 'Octubre a Abril', recommended_schedule: 'Jornadas de bodegas al mediodía y espectáculos culturales de noche',
    meeting_point: 'Plaza de Armas de Santiago de Chile', includes: ['Ruta completa de 2 países', 'Coordenadas de bodegas y pasarelas de Iguazú'], excludes: ['Vuelos internos', 'Entradas a parques nacionales'],
    recommendations: ['Llevar muda de ropa seca para las Cataratas del Iguazú (el rocío empapa completamente)'], what_to_bring: ['Ropa cómoda', 'Chaqueta ligera para la noche andina', 'Capa impermeable'], tour_rules: ['No alimentar a los coatíes en las pasarelas de Iguazú'],
    budget: { currency: 'USD', estimatedPerPersonMin: 950, estimatedPerPersonMax: 2100 },
    days: [
      {
        day_number: 1, title: 'Día 1: Santiago de Chile: Cerro Santa Lucía y Barrio Bellavista', notes: 'Panorámica de los Andes y casona de Pablo Neruda.',
        stops: [{ stop_order: 1, name: 'Cerro Santa Lucía y La Chascona en Bellavista', latitude: -33.4410, longitude: -70.6430, image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'], description: 'Cerro fortaleza donde Pedro de Valdivia fundó Santiago en 1541. Al pie, el barrio bohemio con La Chascona, casa del poeta Pablo Neruda.', activities: ['Subir a la torre mirador del Castillo Hidalgo (Gratis)', 'Entrada a la casa museo de Neruda ($9.500 CLP / ~$10 USD)', 'Empanada chilena de pino con copa de vino Carménère ($8 USD)'], tips: ['Subir al mirador Sky Costanera para ver el atardecer sobre la cordillera nevada'], curious_facts: ['La cepa de uva Carménère se creía extinguida en el mundo hasta que fue redescubierta en Chile en 1994'], suggested_minutes: 210, location_info: { address: 'Santiago Centro', priceRange: '$ - Acceso libre' } }]
      },
      {
        day_number: 2, title: 'Día 2: Valparaíso Bohemio: Funiculares y Murales de Colores', notes: 'Cerro Alegre, Cerro Concepción y vista al océano Pacífico.',
        stops: [{ stop_order: 1, name: 'Cerros Alegre y Concepción en Valparaíso', latitude: -33.0450, longitude: -71.6280, image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'], description: 'Patrimonio de la Humanidad UNESCO. Puerto sobre colinas con ascensores funiculares de madera de 1883 y galerías de murales al aire libre.', activities: ['Subir en el centenario Ascensor Reina Victoria ($100 CLP / ~$0.15 USD)', 'Paseo por el Pasaje Gálvez admirando murales (Gratis)', 'Almorzar caldillo de congrio o mariscos en el puerto ($15 - $25 USD)'], tips: ['El autobús desde Santiago a Valparaíso tarda solo 1 hora y 30 minutos ($6 USD)'], curious_facts: ['Valparaíso llegó a tener más de 30 funiculares activos a vapor para conectar los cerros con el plan de la ciudad'], suggested_minutes: 240, location_info: { address: 'Cerro Alegre, Valparaíso', priceRange: '$ - Funicular accesible' } }]
      },
      {
        day_number: 3, title: 'Día 3: El Cruce de los Andes hacia Mendoza (Argentina)', notes: 'Paso cordillerano a más de 3.000 metros viendo el colosal Monte Aconcagua.',
        stops: [{ stop_order: 1, name: 'Paso Los Libertadores y Vista al Aconcagua', latitude: -32.8250, longitude: -69.9450, image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'], description: 'Uno de los pasos montañosos más espectaculares del planeta. La famosa curva de "Los Caracoles" asciende hacia el túnel fronterizo con vista al Aconcagua (6.961 m), la montaña más alta del continente.', activities: ['Viaje en bus panorámico o coche cruzando la cordillera ($35 - $50 USD)', 'Parada en el Puente del Inca con aguas termales ferruginosas amarillas (Gratis)', 'Llegada a Mendoza y cena con corte de carne asada y vino Malbec ($25 USD)'], tips: ['El paso puede cerrar temporalmente en invierno por nevadas; en verano la ruta está despejada'], curious_facts: ['El Aconcagua es el pico más alto de la Tierra fuera de la cordillera del Himalaya en Asia'], suggested_minutes: 360, location_info: { address: 'Cordillera de los Andes / Mendoza', priceRange: '$$ - Traslado internacional' } }]
      },
      {
        day_number: 4, title: 'Día 4: Mendoza: Ruta del Vino Malbec en Valle de Uco / Luján de Cuyo', notes: 'Bodegas de renombre mundial al pie de los picos nevados.',
        stops: [{ stop_order: 1, name: 'Bodegas de Luján de Cuyo y Valle de Uco', latitude: -33.0050, longitude: -68.8750, image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'], description: 'Cuna del Malbec argentino. Viñedos de altura irrigados por agua pura de deshielo andino con bodegas de arquitectura vanguardista.', activities: ['Visita y cata de 4 vinos de alta gama en bodega tradicional ($25 - $45 USD)', 'Almuerzo maridaje de 5 pasos en viñedo con vista a la cordillera ($60 - $110 USD)'], tips: ['Contratar conductor o tour guiado para disfrutar de las catas con total tranquilidad'], curious_facts: ['Mendoza es una de las 11 Grandes Capitales Mundiales del Vino (*Great Wine Capitals*)'], suggested_minutes: 300, location_info: { address: 'Luján de Cuyo, Mendoza', priceRange: '$$$ - Bodegas y catas' } }]
      },
      {
        day_number: 5, title: 'Día 5: Vuelo a Buenos Aires y Noche Tanguera en San Telmo', notes: 'Llegada a la capital porteña y cena show de tango.',
        stops: [{ stop_order: 1, name: 'San Telmo y Plaza Dorrego', latitude: -34.6210, longitude: -58.3730, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Vuelo de 1 hora y 45 minutos a Buenos Aires. San Telmo deslumbra con faroles coloniales y compases de bandoneón.', activities: ['Caminar por las calles empedradas de San Telmo (Gratis)', 'Cena show de tango con orquesta en vivo ($65 - $100 USD)'], tips: ['Probar el bife de chorizo con chimichurri'], curious_facts: ['El tango fue declarado Patrimonio Cultural Inmaterial de la Humanidad en 2009'], suggested_minutes: 240, location_info: { address: 'San Telmo, Buenos Aires', priceRange: '$$$ - Show de tango' } }]
      },
      {
        day_number: 6, title: 'Día 6: Recoleta, Teatro Colón y Librería El Ateneo', notes: 'La arquitectura palaciega de estilo francés de Buenos Aires.',
        stops: [{ stop_order: 1, name: 'Cementerio de la Recoleta y Librería El Ateneo', latitude: -34.5875, longitude: -58.3930, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Mausoleos de mármol de presidentes y Eva Perón, y el antiguo teatro convertido en la librería más bella del mundo.', activities: ['Mausoleo de Evita en Recoleta ($15 USD)', 'Café sobre el escenario de El Ateneo ($6 USD)'], tips: ['Apreciar la cúpula pintada al óleo de El Ateneo'], curious_facts: ['Buenos Aires es la ciudad con mayor número de librerías por habitante del mundo'], suggested_minutes: 210, location_info: { address: 'Recoleta, Buenos Aires', priceRange: '$$ - Moderado' } }]
      },
      {
        day_number: 7, title: 'Día 7: La Boca: Caminito y Puerto Madero Moderno', notes: 'Conventillos de chapa pintada y el Puente de la Mujer.',
        stops: [{ stop_order: 1, name: 'Caminito y Puente de la Mujer en Puerto Madero', latitude: -34.6395, longitude: -58.3625, image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'], description: 'El callejón colorido de los inmigrantes genoveses y los muelles de ladrillo rojo de Puerto Madero.', activities: ['Fotos en Caminito (Gratis)', 'Paseo por el Puente de la Mujer (Gratis)', 'Helado artesanal dulce de leche en Rapanui ($5 USD)'], tips: ['No salir del perímetro vigilado de Caminito hacia las calles laterales'], curious_facts: ['El Puente de la Mujer de Santiago Calatrava representa a una pareja bailando tango'], suggested_minutes: 210, location_info: { address: 'La Boca / Puerto Madero', priceRange: '$ - Libre' } }]
      },
      {
        day_number: 8, title: 'Día 8: Vuelo a las Cataratas del Iguazú: Parque Nacional Lado Argentino', notes: 'Llegada a la selva subtropical misionera y el rugido de 275 saltos de agua.',
        stops: [{ stop_order: 1, name: 'Parque Nacional Iguazú y Tren de la Selva', latitude: -25.6953, longitude: -54.4367, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Vuelo de 1h 50m a Puerto Iguazú. El Parque Nacional Iguazú (Maravilla de la Naturaleza) cuenta con el Tren ecológico de la Selva y circuitos de pasarelas superiores e inferiores.', activities: ['Recorrer las pasarelas del Circuito Superior e Inferior (Entrada parque: ~$20.000 ARS / ~$20 USD)', 'Paseo en lancha "Gran Aventura" que se mete literalmente bajo las cascadas ($60 USD opcional)'], tips: ['Guardar la comida; los coatíes son muy hábiles abriendo mochilas en los descansos'], curious_facts: ['Las cataratas se extienden a lo largo de 2.7 kilómetros con 275 saltos de agua individuales'], suggested_minutes: 360, location_info: { address: 'Puerto Iguazú, Misiones', priceRange: '$$ - Entrada parque' } }]
      },
      {
        day_number: 9, title: 'Día 9: La Garganta del Diablo: La Mayor Furia de Agua del Planeta', notes: 'Pasarela sobre el río que desemboca en el abismo atronador de 80 metros.',
        stops: [{ stop_order: 1, name: 'Balcón de la Garganta del Diablo', latitude: -25.6950, longitude: -54.4440, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'El salto de mayor caudal y dramatismo del mundo en forma de herradura con 80 metros de caída libre que genera una nube permanente de vapor y arcoíris dobles.', activities: ['Caminar por la pasarela flotante de 1.100 metros sobre el río Iguazú superior (Incluido en entrada)', 'Sentir el rugido ensordecedor y la bruma de la Garganta del Diablo', 'Fotografiar decenas de mariposas tropicales de colores posándose en las manos'], tips: ['Llevar funda impermeable para el móvil; el rocío del salto empapa por completo en el mirador'], curious_facts: ['Por la Garganta del Diablo caen más de 1.500 metros cúbicos de agua por segundo'], suggested_minutes: 240, location_info: { address: 'Garganta del Diablo, Iguazú', priceRange: '$ - Incluido en parque' } }]
      },
      {
        day_number: 10, title: 'Día 10: Cataratas del Lado Brasileño: La Vista Panorámica Completa', notes: 'Cruce de frontera a Foz do Iguaçu para la visión de conjunto.',
        stops: [{ stop_order: 1, name: 'Parque Nacional do Iguaçu (Lado Brasileño)', latitude: -25.6880, longitude: -54.4400, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Si el lado argentino ofrece la vivencia inmersiva dentro del agua, el lado brasileño regala la postal panorámica perfecta de todo el frente de cascadas.', activities: ['Pasarela panorámica de Brasil que avanza sobre la base de los saltos (Entrada: ~$18 USD)', 'Subida en ascensor panorámico de cristal con vista al cañón', 'Almuerzo buffet en restaurante Porto Canoas sobre el río ($25 USD)'], tips: ['Tener a mano el pasaporte para el paso fronterizo entre Argentina y Brasil'], curious_facts: ['Eleanor Roosevelt al ver las Cataratas del Iguazú exclamó: "¡Pobre Niágara!"'], suggested_minutes: 240, location_info: { address: 'Foz do Iguaçu, Brasil', priceRange: '$$ - Entrada lado brasileño' } }]
      },
      {
        day_number: 11, title: 'Día 11: Parque de las Aves y Retorno a Buenos Aires', notes: 'Tucanes, guacamayos y vuelo de regreso a la capital.',
        stops: [{ stop_order: 1, name: 'Parque das Aves en Foz do Iguaçu', latitude: -25.6150, longitude: -54.4820, image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'], description: 'Santuario de rescate de aves selváticas donde los visitantes caminan dentro de inmensos aviarios rodeados de cientos de tucanes y guacamayos libres.', activities: ['Entrar a los aviarios de inmersión con tucanes de pico amarillo ($15 USD)', 'Vuelo de retorno a Buenos Aires (~$70 - $110 USD)', 'Paseo nocturno por el barrio de Palermo Soho'], tips: ['Las aves no están enjauladas; el visitante entra a su propio hábitat de selva'], curious_facts: ['Más del 50% de las aves del parque fueron rescatadas del tráfico ilegal de fauna silvestre'], suggested_minutes: 180, location_info: { address: 'Foz do Iguaçu / Buenos Aires', priceRange: '$$ - Entrada y vuelo' } }]
      },
      {
        day_number: 12, title: 'Día 12: Despedida del Cono Sur: Alfajores y Vuelo Internacional', notes: 'Últimas compras porteñas y traslado a Ezeiza.',
        stops: [{ stop_order: 1, name: 'Galerías Pacífico y Despedida', latitude: -34.5995, longitude: -58.3750, image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'], description: 'Centro comercial histórico con cúpula decorada con murales de Antonio Berni y Spilimbergo en la peatonal Florida.', activities: ['Comprar alfajores artesanales Havanna o Cachafaz y dulce de leche ($15 - $30 USD)', 'Último almuerzo de milanesa con papas fritas ($12 USD)', 'Traslado al aeropuerto internacional Ministro Pistarini (Ezeiza)'], tips: ['El taxi o transfer a Ezeiza toma aproximadamente 45 minutos por autopista'], curious_facts: ['La cúpula de Galerías Pacífico es considerada la Capilla Sixtina del muralismo argentino'], suggested_minutes: 150, location_info: { address: 'Florida 753, Buenos Aires', priceRange: '$ - Compras' } }]
      }
    ]
  }
]
