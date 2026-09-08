// Tours 1 - 10: Colombia (3 a 14 días)
export const colombiaTours = [
  {
    slug: 'vibetour-cartagena-islas-del-rosario-3d',
    title: 'Cartagena & Islas del Rosario: Magia Colonial y Caribe Esmeralda',
    country: 'Colombia',
    city: 'Cartagena',
    type: 'romantic',
    tourScope: 'coastal_islands',
    description: 'Recorrido inolvidable de 3 días que combina el encanto romántico y colonial del Centro Amurallado de Cartagena con las aguas turquesas y arrecifes coralinos de las Islas del Rosario. Diseñado para parejas y viajeros que buscan historia, baluartes al atardecer y descanso caribeño de primera categoría.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 2880,
    distance_meters: 42000,
    difficulty: 'easy',
    rating: 4.95,
    review_count: 148,
    likes_count: 420,
    tags: ['Cartagena', 'Islas del Rosario', 'Caribe', 'Colonial', 'Romántico', 'Playa'],
    recommended_audience: ['Parejas', 'Amantes de la fotografía', 'Viajeros culturales'],
    best_season: 'Diciembre a Abril (temporada seca y brisa constante)',
    recommended_schedule: 'Salida matutina para aprovechar la luz y navegación temprana',
    meeting_point: 'Torre del Reloj, Plaza de la Paz, Cartagena',
    includes: ['Itinerario georreferenciado día a día', 'Guía de paradas con datos curiosos', 'Recomendaciones de restaurantes románticos', 'Coordenadas de muelles y puntos de embarque'],
    excludes: ['Boletos de lancha hacia las islas', 'Consumos en clubes de playa', 'Impuesto de muelle'],
    recommendations: ['Llevar calzado cómodo para adoquines', 'Usar bloqueador solar biodegradable para no dañar los corales', 'Llevar sombrero o gorra y efectivo para artesanos'],
    what_to_bring: ['Ropa ligera de lino o algodón', 'Traje de baño', 'Cámara fotográfica', 'Protector solar reef-safe'],
    tour_rules: ['Respetar la arquitectura colonial sin alterar fachadas', 'No tocar ni pisar las formaciones de coral'],
    budget: { currency: 'COP', estimatedPerPersonMin: 450000, estimatedPerPersonMax: 950000, notes: 'Incluye lancha a islas, entradas y cenas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: El Alma Colonial y Murallas al Atardecer',
        notes: 'Caminata relajada por el recinto amurallado, visitas a plazas históricas y cena romántica en Getsemaní.',
        stops: [
          {
            stop_order: 1,
            name: 'Torre del Reloj y Plaza de los Coches',
            latitude: 10.4236,
            longitude: -75.5501,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Antigua entrada principal a la ciudad fortificada conocida originalmente como Boca del Puente. Esta imponente puerta barroca se abre hacia la Plaza de los Coches, flanqueada por casonas coloniales con balcones de madera tallada.',
            activities: ['Fotografiar la fachada de la Torre del Reloj (Gratis)', 'Probar dulces típicos en el Portal de los Dulces ($5.000 - $12.000 COP)', 'Apreciar la estatua de Pedro de Heredia (Gratis)'],
            tips: ['Visitar a primera hora de la mañana para evitar tumultos', 'Llevar monedas o billetes pequeños para los dulceros tradicionales'],
            curious_facts: ['Originalmente contaba con un puente levadizo que salvaba el foso entre Getsemaní y el centro', 'El reloj suizo actual fue instalado a principios del siglo XX en reemplazo del mecanismo colonial'],
            suggested_minutes: 45,
            location_info: { address: 'Plaza de los Coches, Centro Histórico', priceRange: '$ - Gratis acceso a plaza' }
          },
          {
            stop_order: 2,
            name: 'Las Bóvedas y Baluarte de Santa Catalina',
            latitude: 10.4285,
            longitude: -75.5458,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Estructura militar monumental de 47 arcos y 23 bóvedas construida a finales del siglo XVIII por Antonio de Arévalo. Inicialmente sirvió como almacén de municiones y luego como prisión durante las guerras de independencia; hoy alberga talleres de artesanías selectas.',
            activities: ['Caminar sobre el parapeto de la muralla con vista al Mar Caribe (Gratis)', 'Comprar artesanías locales y café gourmet ($20.000 - $80.000 COP)', 'Observar los cañones coloniales originales (Gratis)'],
            tips: ['La brisa marina en lo alto de la muralla es perfecta entre las 4:30 PM y 6:00 PM', 'Subir la rampa de piedra con calzado antideslizante'],
            curious_facts: ['Durante las mareas altas coloniales el agua del mar llegaba casi hasta la base de las celdas', 'Fue la última gran obra militar edificada por los españoles en Cartagena antes de su emancipación'],
            suggested_minutes: 60,
            location_info: { address: 'Calle Zerrezuela, San Diego', priceRange: '$ - Entrada libre' }
          },
          {
            stop_order: 3,
            name: 'Baluarte de Santo Domingo y Calle del Santísimo',
            latitude: 10.4228,
            longitude: -75.5539,
            image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'],
            description: 'El punto más icónico de la ciudad para contemplar el sol ocultándose en el horizonte caribeño. Las troneras de cañón y las garitas coloniales ofrecen un telón de fondo romántico inigualable mientras cae la tarde.',
            activities: ['Disfrutar de un cóctel caribeño o copa de vino al atardecer ($35.000 - $55.000 COP)', 'Fotografía romántica de siluetas sobre las murallas (Gratis)', 'Recorrido nocturno por las farolas coloniales de Santo Domingo (Gratis)'],
            tips: ['Llegar sobre las 5:00 PM para asegurar buena ubicación frente al mar', 'Las calles adyacentes son ideales para una cena a la luz de las velas'],
            curious_facts: ['Este baluarte resistió el feroz ataque del barón de Pointis en 1697', 'Gabriel García Márquez situó varias escenas de sus novelas en estas esquinas empedradas'],
            suggested_minutes: 90,
            location_info: { address: 'Baluarte de Santo Domingo, Muralla Oeste', priceRange: '$$ - Consumos opcionales' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Fortalezas Subterráneas y Cerro de La Popa',
        notes: 'Exploración de la ingeniería militar española, vistas de 360 grados de la bahía y noche gastronómica en San Diego.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo San Felipe de Barajas',
            latitude: 10.4230,
            longitude: -75.5385,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'La mayor obra de ingeniería militar construida por la corona española en el continente americano. Emplazado sobre la colina de San Lázaro, este complejo cuenta con un laberinto de túneles subterráneos diseñados con propósitos de defensa y acústica táctica.',
            activities: ['Recorrer el laberinto de túneles subterráneos (Entrada general: $30.000 COP / $7.5 USD)', 'Alquiler de audioguía interactiva ($15.000 COP)', 'Fotografiar la bandera monumental y la panorámica del mar (Gratis con entrada)'],
            tips: ['Llevar agua y protector solar, no hay sombra en las explanadas superiores', 'Los túneles son estrechos; si sufre de claustrofobia use las rampas exteriores'],
            curious_facts: ['Los túneles fueron diseñados para que los pasos de los soldados invasores resonaran con eco, delatando su posición', 'Nunca fue tomado por asalto militar directo tras su reconstrucción en 1762'],
            suggested_minutes: 120,
            location_info: { address: 'Pie del Cerro, Avenida Antonio de Arévalo', priceRange: '$$ - Entrada $30.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Convento y Mirador de La Popa',
            latitude: 10.4194,
            longitude: -75.5262,
            image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80'],
            description: 'Situado en la cima del cerro más elevado de la ciudad (150 metros sobre el nivel del mar), el Convento de Nuestra Señora de la Candelaria ofrece un patio claustrado repleto de flores tropicales y la panorámica más completa de la bahía y el mar.',
            activities: ['Visita guiada al claustro colonial y capilla de la Virgen de la Candelaria (Entrada: $15.000 COP)', 'Mirador panorámico de 360 grados sobre toda Cartagena (Gratis con entrada)', 'Compra de recuerdos religiosos y postales ($10.000 - $30.000 COP)'],
            tips: ['Subir en taxi de confianza o transporte contratado (aprox. $25.000 COP ida y vuelta)', 'No subir a pie por razones de seguridad en el tramo de la colina'],
            curious_facts: ['Los marineros coloniales la llamaban La Popa porque desde la distancia el cerro parecía la popa de una gigantesca carabela', 'El libertador Simón Bolívar pernoctó en sus celdas durante sus campañas militares'],
            suggested_minutes: 75,
            location_info: { address: 'Cerro de La Popa', priceRange: '$ - Entrada $15.000 COP' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Aguas Turquesas en las Islas del Rosario',
        notes: 'Día completo de sol y navegación por el archipiélago coralino, snorkel y gastronomía fresca de mar.',
        stops: [
          {
            stop_order: 1,
            name: 'Isla Grande y Arrecifes del Parque Nacional Corales del Rosario',
            latitude: 10.1802,
            longitude: -75.7314,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'La isla principal del Parque Nacional Natural Corales del Rosario. Rodeada de lagunas de manglar, fondos de arena blanca y formaciones coralinas rebosantes de peces loro, mantarrayas y tortugas carey.',
            activities: ['Sesión de snorkel en arrecife protegido con guía certificado ($50.000 - $70.000 COP)', 'Paseo en kayak transparente por los túneles de manglar ($40.000 COP)', 'Almuerzo caribeño: pescado frito, arroz de coco y patacones ($45.000 - $75.000 COP)'],
            tips: ['Las lanchas salen temprano (entre 8:00 AM y 8:30 AM) desde el Muelle de La Bodeguita', 'Pagar la tasa portuaria en efectivo en el muelle ($26.500 COP)'],
            curious_facts: ['El archipiélago está compuesto por 28 islas de origen coralino emergido', 'Por la noche algunas de sus lagunas internas presentan el fenómeno de bioluminiscencia marina'],
            suggested_minutes: 300,
            location_info: { address: 'Parque Nacional Natural Corales del Rosario', priceRange: '$$$ - Pasadía $160.000 - $280.000 COP con lancha' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-santa-marta-tayrona-minca-4d',
    title: 'Santa Marta, Minca y Parque Tayrona: Selva, Montaña y Mar',
    country: 'Colombia',
    city: 'Santa Marta',
    type: 'ecological',
    tourScope: 'micro_destination',
    description: 'Circuito de 4 días por el departamento del Magdalena. Combina el rumor de la selva y las playas vírgenes de arena dorada del Parque Nacional Natural Tayrona con los cafetales nubosos y cascadas de Minca en la Sierra Nevada.',
    cover_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 5760,
    distance_meters: 68000,
    difficulty: 'moderate',
    rating: 4.92,
    review_count: 112,
    likes_count: 389,
    tags: ['Santa Marta', 'Tayrona', 'Minca', 'Ecológico', 'Sierra Nevada', 'Naturaleza'],
    recommended_audience: ['Senderistas', 'Amantes de la naturaleza', 'Aventureros'],
    best_season: 'Enero a Mayo y Julio a Septiembre',
    recommended_schedule: 'Inicio temprano para evitar las horas de mayor calor en los senderos',
    meeting_point: 'Parque de Los Novios, Santa Marta',
    includes: ['Itinerario de senderismo detallado', 'Ubicaciones de entradas oficiales', 'Recomendaciones de posadas y guías locales'],
    excludes: ['Tarifa de entrada a Parques Nacionales', 'Seguro médico obligatorio Tayrona', 'Transporte interurbano'],
    recommendations: ['Llevar calzado de trekking con buen agarre', 'Llevar repelente ecológico y termo reutilizable', 'Tener efectivo para transporte local en moto o jeep'],
    what_to_bring: ['Botas o tenis para caminar', 'Ropa de secado rápido', 'Impermeable ligero', 'Linterna frontal'],
    tour_rules: ['Prohibido el ingreso de plásticos de un solo uso en Parques Nacionales', 'No extraer conchas ni piedras de las reservas'],
    budget: { currency: 'COP', estimatedPerPersonMin: 380000, estimatedPerPersonMax: 780000, notes: 'Entradas, transportes en van/lancha y alimentación' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Centro Histórico de Santa Marta y Bahía',
        notes: 'Recorrido por la ciudad hispánica más antigua conservada en Colombia continental.',
        stops: [
          {
            stop_order: 1,
            name: 'Quinta de San Pedro Alejandrino',
            latitude: 11.2291,
            longitude: -74.1818,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Antigua hacienda azucarera y lugar de reposo final del Libertador Simón Bolívar en diciembre de 1830. Conserva el trapiche original, jardines centenarios y el Museo Bolivariano de Arte Contemporáneo.',
            activities: ['Visita histórica guiada a la alcoba de Bolívar (Entrada: $23.000 COP)', 'Observación de iguanas gigantes y ceibas en el Jardín Botánico (Gratis con entrada)', 'Recorrido por el Altar de la Patria (Gratis con entrada)'],
            tips: ['Llevar agua y protector solar para recorrer los jardines botánicos', 'Contratar los guías locales acreditados en la taquilla'],
            curious_facts: ['El reloj de la alcoba principal permanece detenido a la 1:03 PM, hora exacta del deceso de Bolívar', 'Sus árboles de ceiba tienen más de dos siglos de antigüedad'],
            suggested_minutes: 110,
            location_info: { address: 'Avenida del Libertador s/n', priceRange: '$ - Entrada $23.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Parque de Los Novios y Malecón de Bastidas',
            latitude: 11.2435,
            longitude: -74.2144,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El corazón vibrante de la vida social y nocturna samaria. Rodeado de casonas restauradas con cafés gourmet, cervecerías artesanales y restaurantes de comida de mar a pocos metros de la playa de la bahía.',
            activities: ['Caminata al atardecer por el Malecón de Bastidas (Gratis)', 'Cena marinera de cazuela de mariscos ($35.000 - $60.000 COP)', 'Música en vivo y coctelería tropical en el Parque de los Novios ($20.000 - $35.000 COP)'],
            tips: ['La brisa baja desde la Sierra al atardecer refrescando el centro', 'Excelente punto para cambiar divisas o retirar efectivo antes de ir a Tayrona'],
            curious_facts: ['El parque solía llamarse Plaza Santander, pero la tradición popular de parejas paseando lo rebautizó oficialmente'],
            suggested_minutes: 90,
            location_info: { address: 'Calle 19 con Carrera 3, Centro Histórico', priceRange: '$$ - Acceso libre, consumos moderados' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Senderos Mágicos del Parque Tayrona (Sector Zaino a Cabo San Juan)',
        notes: 'Inmersión en el bosque húmedo tropical, avistamiento de monos aulladores y playas vírgenes.',
        stops: [
          {
            stop_order: 1,
            name: 'Playa Cañaveral y Sendero de Piedra',
            latitude: 11.3142,
            longitude: -73.9318,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Punto de partida del sendero ecológico del Parque Tayrona tras cruzar la entrada Zaino. Destaca por sus formaciones rocosas gigantes de granito y su vegetación selvática exuberante.',
            activities: ['Registro en la taquilla de Parques Nacionales (Entrada nacional: ~$35.000 COP / extranjero: ~$73.500 COP)', 'Adquisición del seguro de asistencia médica obligatorio ($6.000 COP/día)', 'Senderismo guiado por caminos elevados de madera (Gratis con entrada)'],
            tips: ['Llegar antes de las 8:00 AM para evitar aglomeraciones en taquilla', 'En Playa Cañaveral el oleaje es peligroso; está estrictamente prohibido nadar allí'],
            curious_facts: ['Los senderos siguen las antiguas calzadas empedradas trazadas por los pueblos indígenas Tayrona hace más de 500 años'],
            suggested_minutes: 120,
            location_info: { address: 'Entrada Zaino, Vía Santa Marta - Riohacha', priceRange: '$$ - Entrada oficial' }
          },
          {
            stop_order: 2,
            name: 'Cabo San Juan del Guía y La Piscina',
            latitude: 11.3288,
            longitude: -73.9555,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'La postal más célebre de Colombia en el mundo: una doble bahía de arena dorada coronada por una choza de paja sobre un promontorio rocoso rodeado de aguas color esmeralda.',
            activities: ['Baño y natación segura en las aguas calmas de La Piscina y Cabo San Juan (Gratis)', 'Fotografía panorámica desde el mirador de la colina rocosa (Gratis)', 'Almuerzo en el restaurante del campamento: arroz con coco y pescado ($38.000 - $55.000 COP)'],
            tips: ['El regreso a pie toma 2 horas y media; comenzar el retorno hacia Zaino a más tardar a las 3:00 PM o tomar lancha a Taganga ($80.000 COP)'],
            curious_facts: ['La choza en lo alto del Cabo dispone de hamacas donde los viajeros pueden pernoctar con vista al mar abierto'],
            suggested_minutes: 240,
            location_info: { address: 'Sector Cabo San Juan, PNN Tayrona', priceRange: '$$ - Consumos en restaurante' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Refugio Cafetero de Minca en la Sierra Nevada',
        notes: 'Ascenso a 650 metros de altura hacia la capital ecológica de la Sierra Nevada de Santa Marta.',
        stops: [
          {
            stop_order: 1,
            name: 'Pueblo de Minca y Finca Cafetera La Victoria',
            latitude: 11.1442,
            longitude: -74.1165,
            image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las haciendas cafeteras más antiguas de Colombia (fundada en 1892), que todavía funciona completamente con energía hidroeléctrica y maquinaria hidráulica traída de Inglaterra y Alemania en el siglo XIX.',
            activities: ['Tour del café orgánico y maquinaria histórica ($25.000 COP)', 'Degustación de café especial de altura ($5.000 - $10.000 COP)', 'Probar la cerveza artesanal local elaborada con café o cacao ($12.000 - $16.000 COP)'],
            tips: ['El clima en Minca es más templado y fresco que en la costa (22-26°C)', 'Se puede subir desde el pueblo de Minca en moto-taxi ($20.000 COP) o en caminata escénica'],
            curious_facts: ['La maquinaria de la finca funciona sin electricidad de la red pública, impulsada únicamente por caídas de agua de montaña'],
            suggested_minutes: 120,
            location_info: { address: 'Vereda El Campano, Minca', priceRange: '$ - Tour $25.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Cascadas de Marinka y Pozo Azul',
            latitude: 11.1350,
            longitude: -74.1080,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Hermosas caídas de agua pura de deshielo y manantial rodeadas de helechos gigantes y bosque nublado. Dispone de piscinas naturales de agua cristalina y hamacas suspendidas gigantes.',
            activities: ['Baño refrescante en las pozas naturales (Entrada ecológica Marinka: $10.000 COP)', 'Descanso en las redes colgantes gigantes con vista al cañón ($5.000 COP)', 'Avistamiento de tucanes y colibríes en los comederos naturales (Gratis)'],
            tips: ['El agua es fresca de montaña (unos 18°C); llevar toalla y muda seca de ropa', 'Evitar pisar piedras resbalosas descalzo'],
            curious_facts: ['Minca es considerada un paraíso mundial para ornitólogos con más de 300 especies de aves registradas en su microclima'],
            suggested_minutes: 150,
            location_info: { address: 'Cascadas de Marinka, Minca', priceRange: '$ - Entrada $10.000 COP' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Atardecer en Taganga y Despedida Marina',
        notes: 'Pueblo tradicional de pescadores rodeado de cerros áridos y mirador al mar.',
        stops: [
          {
            stop_order: 1,
            name: 'Mirador y Ensenada de Taganga',
            latitude: 11.2678,
            longitude: -74.1925,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Pintoresca ensenada marina donde las montañas de la Sierra Nevada se hunden abruptamente en el Caribe. Famosa por sus centros de buceo certificados y su tradición de pesca artesanal.',
            activities: ['Fotografía desde el mirador de la colina de acceso a Taganga (Gratis)', 'Almuerzo de pargo rojo con patacones frente a la playa ($30.000 - $45.000 COP)', 'Bautizo de buceo o snorkel guiado opcional ($120.000 - $180.000 COP)'],
            tips: ['Tomar un taxi desde Santa Marta hasta el mirador toma solo 15 minutos ($15.000 COP)', 'Las tardes son espectaculares para ver regresar las faenas de pesca artesanal'],
            curious_facts: ['Taganga fue originalmente un asentamiento indígena de pescadores de la etnia Taganga antes de la llegada de los colonizadores'],
            suggested_minutes: 180,
            location_info: { address: 'Bahía de Taganga, Magdalena', priceRange: '$$ - Entrada libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-cali-buga-san-cipriano-4d',
    title: 'Cali, Buga y Río San Cipriano: Salsa, Mística y Naturaleza',
    country: 'Colombia',
    city: 'Cali',
    type: 'cultural',
    tourScope: 'city_to_city',
    description: 'Circuito de 4 días que explora la alegría musical y cultural de Santiago de Cali (capital mundial de la salsa), el fervor histórico y arquitectónico de la Basílica de Buga, y la aventura ecológica en las brujitas sobre rieles hacia las aguas cristalinas de San Cipriano.',
    cover_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 5760,
    distance_meters: 140000,
    difficulty: 'moderate',
    rating: 4.88,
    review_count: 94,
    likes_count: 310,
    tags: ['Cali', 'Buga', 'San Cipriano', 'Salsa', 'Cultural', 'Valle del Cauca'],
    recommended_audience: ['Amantes de la música y baile', 'Viajeros culturales', 'Ecoturistas'],
    best_season: 'Todo el año; diciembre es excepcional por la Feria de Cali',
    recommended_schedule: 'Actividades culturales por el día y clubes de salsa en la noche',
    meeting_point: 'Plazoleta Jairo Varela, Cali',
    includes: ['Ruta completa georreferenciada', 'Puntos clave de escuelas de salsa y museos', 'Contacto de guías locales en San Cipriano'],
    excludes: ['Paseo en brujita sobre rieles', 'Clases privadas de baile', 'Alimentación'],
    recommendations: ['Llevar calzado deportivo para caminar y bailar', 'Probar las delicias locales: lulada, champús y marranitas'],
    what_to_bring: ['Ropa fresca y cómoda', 'Traje de baño para San Cipriano', 'Zapatos para agua'],
    tour_rules: ['Respetar la tranquilidad de la comunidad de San Cipriano', 'No arrojar residuos al río'],
    budget: { currency: 'COP', estimatedPerPersonMin: 320000, estimatedPerPersonMax: 650000, notes: 'Transportes, entradas, brujitas y gastronomía' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Cali Colonial, Barrio San Antonio y Brisa del Río',
        notes: 'Exploración del centro histórico, artesanías tradicionales y gastronomía vallecaucana.',
        stops: [
          {
            stop_order: 1,
            name: 'Barrio y Colina de San Antonio',
            latitude: 3.4475,
            longitude: -76.5412,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El barrio colonial más emblemático de Cali, caracterizado por calles empinadas de piedra, casas blancas con balcones de madera, talleres de artesanos, anticuarios y la centenaria capilla de San Antonio de 1747.',
            activities: ['Subir a la colina de San Antonio para la panorámica de la ciudad (Gratis)', 'Degustar empanadas vallunas con ají y lulada tradicional ($12.000 - $22.000 COP)', 'Visitar las tiendas de cuero y cerámica artesanal (Gratis)'],
            tips: ['A las 5:00 PM la colina se llena de cuenteros tradicionales y brisa refrescante', 'Caminar con calzado cómodo por los adoquines'],
            curious_facts: ['La capilla fue construida gracias a una donación de 1.000 patacones de oro en honor a San Antonio de Padua en 1747'],
            suggested_minutes: 120,
            location_info: { address: 'Carrera 10 con Calle 1 Oeste, San Antonio', priceRange: '$ - Acceso libre' }
          },
          {
            stop_order: 2,
            name: 'Bulevar del Río y Gato de Tejada',
            latitude: 3.4542,
            longitude: -76.5365,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Paseo peatonal ribereño arbolado sobre el túnel vehicular de la Avenida Colombia. Exhibe la monumental escultura en bronce de "El Gato del Río" donada por Hernando Tejada y sus 20 "gatas" intervenidas por destacados artistas colombianos.',
            activities: ['Caminata fotográfica por el paseo de las gatas (Gratis)', 'Disfrutar de un raspao de hielo con leche condensada ($6.000 COP)', 'Visita a la Iglesia Ermita de estilo neogótico frente al río (Gratis)'],
            tips: ['La brisa que baja del cañón del río Cali al final de la tarde es célebre por su frescura', 'Zona vigilada y muy segura para pasear en familia'],
            curious_facts: ['El Gato de Tejada pesa más de 3 toneladas y fue transportado e instalado en 1996 como símbolo de reconciliación urbana'],
            suggested_minutes: 90,
            location_info: { address: 'Avenida del Río Cali', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Salsa Viva en Juanchito y Alameda',
        notes: 'Día dedicado al patrimonio sonoro: instrumentos, museos y pasos de salsa caleña.',
        stops: [
          {
            stop_order: 1,
            name: 'Plazoleta Jairo Varela y Museo de la Salsa',
            latitude: 3.4560,
            longitude: -76.5330,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Homenaje al fundador del legendario Grupo Niche. La plaza luce un monumento sonoro monumental de trompetas de bronce gigantes donde los visitantes se ubican debajo para escuchar las canciones más icónicas de la salsa colombiana.',
            activities: ['Ubicarse bajo las campanas de las trompetas para escuchar las pistas sonoras (Gratis)', 'Visitar la sala museo de Jairo Varela con partituras y trajes originales (Gratis)', 'Clase exprés de pasos básicos de salsa estilo caleño ($25.000 - $40.000 COP)'],
            tips: ['Alrededor de la plaza hay cafés con aire acondicionado y wifi para descansar'],
            curious_facts: ['Las cuatro trompetas forman las letras de la palabra N-I-C-H-E cuando se observan en perspectiva'],
            suggested_minutes: 90,
            location_info: { address: 'Avenida 2 Norte con Calle 10', priceRange: '$ - Acceso libre' }
          },
          {
            stop_order: 2,
            name: 'Mercado de la Alameda y Noche en La Topa Tolondra',
            latitude: 3.4370,
            longitude: -76.5360,
            image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'],
            description: 'La galería de mercado más vibrante para saborear la gastronomía del Pacífico (piangua, cazuelas de mariscos, encocaos) seguido de la noche en el templo de la salsa tradicional caleña.',
            activities: ['Almorzar cazuela de mariscos o sancocho de gallina en Alameda ($25.000 - $45.000 COP)', 'Noche de baile social de salsa en La Topa Tolondra (Entrada: $15.000 - $25.000 COP)', 'Apreciar bailarines profesionales de salsa en pista viva'],
            tips: ['En Alameda pedir el jugo de borojó o chontaduro con miel', 'En La Topa llevar ropa ligera porque el baile es continuo y caluroso'],
            curious_facts: ['Cali ostenta el título de Capital Mundial de la Salsa por tener más de 120 escuelas de baile activas y orquestas vivas'],
            suggested_minutes: 200,
            location_info: { address: 'Calle 8 con Carrera 26, Alameda', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: La Basílica del Señor de los Milagros en Buga',
        notes: 'Excursión hacia Guadalajara de Buga, joya religiosa y pueblo patrimonio de Colombia.',
        stops: [
          {
            stop_order: 1,
            name: 'Basílica del Señor de los Milagros de Buga',
            latitude: 3.9015,
            longitude: -76.3025,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Imponente templo basilical que acoge la imagen milagrosa del Cristo Negro hallada en el siglo XVI en el río Guadalajara. Uno de los mayores centros de peregrinación de América Latina.',
            activities: ['Visita a la nave central y camarín del Señor de los Milagros (Gratis)', 'Recorrido por el museo de exvotos y objetos históricos ($8.000 COP)', 'Degustación del manjar blanco de Buga tradicional en calabaza ($10.000 - $18.000 COP)'],
            tips: ['Buga queda a solo 1 hora y 15 minutos en bus expreso desde el terminal de Cali ($18.000 COP)', 'Los fines de semana hay gran afluencia; los días entre semana son ideales para visitas tranquilas'],
            curious_facts: ['Según la leyenda de 1580, una humilde lavandera indígena encontró la pequeña cruz que luego creció milagrosamente en tamaño'],
            suggested_minutes: 150,
            location_info: { address: 'Carrera 14 # 3-62, Buga', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Aventura en Brujita y Aguas Cristalinas de San Cipriano',
        notes: 'Viaje en transporte artesanal sobre rieles de tren abandonados hacia una reserva natural virgen.',
        stops: [
          {
            stop_order: 1,
            name: 'Reserva Natural San Cipriano y Paseo en Brujita',
            latitude: 3.8290,
            longitude: -76.8850,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Paraíso selvático del Chocó biogeográfico famoso por tener uno de los ríos con aguas más puras y transparentes del mundo. Se accede únicamente a través de "brujitas": plataformas de madera montadas sobre rieles de ferrocarril impulsadas por motocicletas modificadas.',
            activities: ['Paseo emocionante en brujita sobre la vía férrea (Pasaje ida y vuelta: $20.000 COP)', 'Tubing: descenso suave por el río en neumáticos gigantes inflados ($15.000 - $20.000 COP)', 'Almuerzo afrodescendiente de encocao de pescado fresco ($25.000 - $35.000 COP)'],
            tips: ['Llevar bolsa impermeable para proteger teléfonos y pertenencias de salpicaduras', 'El agua del río es refrescante y cristalina, perfecta para nadar con gafas de snorkel'],
            curious_facts: ['Las brujitas fueron inventadas ingeniosamente por los propios lugareños para no quedar aislados tras el cierre de la línea férrea del Pacífico'],
            suggested_minutes: 300,
            location_info: { address: 'Córdoba / San Cipriano, Valle del Cauca', priceRange: '$$ - Costos de brujita y actividades' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-la-guajira-mistica-4d',
    title: 'La Guajira Mística: Travesía 4x4, Dunas y Cabo de la Vela',
    country: 'Colombia',
    city: 'Riohacha',
    type: 'sports',
    tourScope: 'micro_destination',
    description: 'Expedición de 4 días en vehículo 4x4 por la península más septentrional de Suramérica. Recorre el desierto donde la arena dorada se encuentra directamente con el azul profundo del mar Caribe, durmiendo en rancherías indígenas Wayúu bajo cielos tapizados de estrellas.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 5760,
    distance_meters: 320000,
    difficulty: 'intense',
    rating: 4.90,
    review_count: 85,
    likes_count: 290,
    tags: ['La Guajira', 'Cabo de la Vela', 'Manaure', 'Desierto', 'Wayúu', 'Aventura'],
    recommended_audience: ['Aventureros', 'Fotógrafos', 'Viajeros culturales'],
    best_season: 'Diciembre a Abril y Julio a Agosto (menos lluvias en desierto)',
    recommended_schedule: 'Expedición en convoy 4x4 con guías y conductores Wayúu certificados',
    meeting_point: 'Muelle Turístico de Riohacha',
    includes: ['Ruta GPS de dunas y salinas', 'Puntos de contacto de rancherías comunitarias', 'Protocolo cultural Wayúu'],
    excludes: ['Alquiler de vehículo todoterreno 4x4', 'Consumos en rancherías', 'Alojamiento en chinchorro'],
    recommendations: ['Llevar suficiente agua potable embotellada (no hay acueducto en el desierto)', 'Llevar pañuelo o bandana contra el viento y la arena', 'Tener dinero en efectivo, no hay cajeros automáticos en el Cabo'],
    what_to_bring: ['Mochila ligera', 'Linterna frontal', 'Gafas de sol polarizadas', 'Toalla de microfibra'],
    tour_rules: ['Pedir permiso a las autoridades tradicionales Wayúu antes de fotografiar personas', 'No dejar residuos plásticos en el desierto'],
    budget: { currency: 'COP', estimatedPerPersonMin: 500000, estimatedPerPersonMax: 1100000, notes: 'Camioneta 4x4 compartida, comidas tradicionales y chinchorro' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Riohacha y Salinas Marinas de Manaure',
        notes: 'Encuentro con las tejedoras Wayúu y montañas blancas de sal marina.',
        stops: [
          {
            stop_order: 1,
            name: 'Camellón de Riohacha y Artesanías Wayúu',
            latitude: 11.5450,
            longitude: -72.9070,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Avenida costera frente al mar donde las artesanas de los clanes Wayúu tejen sus famosas mochilas de hilo silvestre con patrones geométricos kanasú que relatan el origen de su cosmovisión.',
            activities: ['Comprar mochilas auténticas directamente a las tejedoras ($50.000 - $120.000 COP)', 'Paseo por el muelle de madera histórica sobre el mar (Gratis)', 'Desayuno guajiro con arepa de chichimoya y café ($12.000 COP)'],
            tips: ['Comprar las artesanías directamente a las mujeres locales para apoyar la economía familiar', 'Asegurarse de llevar billetes de baja denominación'],
            curious_facts: ['Los patrones kanasú representan animales, constelaciones y elementos del desierto inspirados en la araña mítica Wale’kerü'],
            suggested_minutes: 90,
            location_info: { address: 'Avenida La Marina, Riohacha', priceRange: '$ - Compras artesanales' }
          },
          {
            stop_order: 2,
            name: 'Salinas Marítimas de Manaure',
            latitude: 11.7760,
            longitude: -72.4450,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El mayor complejo de explotación de sal marina a cielo abierto en Colombia. Enormes piscinas de evaporación donde el agua marina pasa de azul a tonos rosados intensos coronadas por pirámides de sal reluciente.',
            activities: ['Tour guiado por las charcas salineras con guía Wayúu local ($10.000 COP)', 'Fotografía de los flamencos rosados y las montañas de sal blanca (Gratis)', 'Explicación del proceso ancestral de cosecha manual de sal'],
            tips: ['El resplandor del sol sobre la sal es extremo; usar gafas de sol con protección UV alta', 'No caminar sobre las piscinas activas de evaporación'],
            curious_facts: ['Manaure produce más del 70% de la sal marina que se consume en todo el territorio colombiano'],
            suggested_minutes: 75,
            location_info: { address: 'Complejo Salinero, Manaure', priceRange: '$ - Tour local $10.000 COP' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Cabo de la Vela y el Faro del Atardecer',
        notes: 'Llegada al Cabo de la Vela y ascenso al faro para el atardecer desértico.',
        stops: [
          {
            stop_order: 1,
            name: 'Pilón de Azúcar (Kamaici)',
            latitude: 12.2380,
            longitude: -72.1520,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Colina cónica sagrada para el pueblo Wayúu que emerge solitaria frente al mar Caribe. La cima ofrece una vista sobrecogedora del desierto dorado fundiéndose en las olas turquesas.',
            activities: ['Subida a pie a la cima del cerro sagrado (Gratis - 15 minutos)', 'Baño de mar en Playa Dorada a los pies del cerro (Gratis)', 'Almuerzo de langosta fresca o chivo asado en ranchería ($35.000 - $60.000 COP)'],
            tips: ['El viento en la cima es sumamente fuerte; asegurar sombreros y lentes', 'Llevar calzado cerrado para subir por el sendero rocoso'],
            curious_facts: ['Para la cosmogonía Wayúu, este cerro (llamado Kamaici) es el portal por donde transitan las almas de los difuntos hacia Jepirra'],
            suggested_minutes: 120,
            location_info: { address: 'Cabo de la Vela, Uribia', priceRange: '$ - Entrada libre' }
          },
          {
            stop_order: 2,
            name: 'El Faro del Cabo de la Vela',
            latitude: 12.2190,
            longitude: -72.1760,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Pequeña estructura de vigía marítima erigida sobre un acantilado rocoso. Es el lugar más famoso de La Guajira para contemplar la puesta de sol en silencio absoluto sobre el mar.',
            activities: ['Contemplar la puesta de sol sobre el horizonte infinito (Gratis)', 'Fotografía de paisajes acantilados (Gratis)', 'Dormir en chinchorro Wayúu en ranchería tradicional ($25.000 - $40.000 COP por noche)'],
            tips: ['Llegar 40 minutos antes del ocaso para encontrar buen sitio en las rocas', 'Llevar una linterna para descender hacia la ranchería una vez oscurezca'],
            curious_facts: ['Por la noche la ausencia casi total de contaminación lumínica permite ver la Vía Láctea a simple vista con absoluta nitidez'],
            suggested_minutes: 90,
            location_info: { address: 'Acantilado del Faro, Cabo de la Vela', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Dunas de Taroa y Punta Gallinas',
        notes: 'Avanzando hasta el punto más al norte de América del Sur continental.',
        stops: [
          {
            stop_order: 1,
            name: 'Dunas de Taroa en Punta Gallinas',
            latitude: 12.4550,
            longitude: -71.6980,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Montañas colosales de arena fina de más de 40 metros de altura que mueren directamente en las aguas bravas del Caribe. El contraste visual entre el desierto ardiente y la espuma de las olas es inolvidable.',
            activities: ['Sandboarding o rodar por las pendientes de arena hacia la orilla del mar (Gratis / alquiler tabla $20.000 COP)', 'Baño en el mar caribeño al pie de la duna (Gratis)', 'Fotografiar el Faro de Punta Gallinas, extremo norte de Suramérica (Gratis)'],
            tips: ['Subir la duna sin zapatos para mejor tracción en la arena suave', 'El trayecto en camioneta 4x4 cruza arenales profundos; no intentar ir sin guía local experto'],
            curious_facts: ['Punta Gallinas se encuentra a 12° 27′ de latitud norte, marcando el límite físico superior de toda la masa continental sudamericana'],
            suggested_minutes: 180,
            location_info: { address: 'Dunas de Taroa, Punta Gallinas', priceRange: '$$ - Costos de expedición 4x4' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Retorno por Uribia y Regreso',
        notes: 'Paso por la capital indígena de Colombia y retorno a Riohacha.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de Uribia: Capital Indígena de Colombia',
            latitude: 11.7140,
            longitude: -72.2660,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Municipio epicentro del pueblo Wayúu, declarado Capital Indígena de Colombia. Un lugar para conocer la vida cotidiana de las comunidades, su lengua wayuunaiki y su comercio tradicional.',
            activities: ['Probar el friche de chivo tradicional con arepa de maíz ($18.000 - $28.000 COP)', 'Observar el comercio de tejidos y chinchorros de doble faz', 'Despedida de la travesía desértica antes de tomar el transporte de regreso'],
            tips: ['Comprar café o agua para el trayecto final de carretera hacia Riohacha'],
            curious_facts: ['En Uribia más del 90% de la población pertenece a la etnia Wayúu y conserva sus clanes matrilineales'],
            suggested_minutes: 90,
            location_info: { address: 'Plaza Principal, Uribia', priceRange: '$ - Comida típica' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-eje-cafetero-cocora-salento-5d',
    title: 'Eje Cafetero Tradicional: Salento, Cocora y Fincas Vivas',
    country: 'Colombia',
    city: 'Salento',
    type: 'family',
    tourScope: 'micro_destination',
    description: 'Circuito familiar de 5 días por el corazón del Paisaje Cultural Cafetero, declarado Patrimonio Mundial por la UNESCO. Caminatas entre las palmas de cera más altas del planeta en el Valle de Cocora, pueblos coloridos con arquitectura de bahareque y catas de café en haciendas tradicionales.',
    cover_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 85000,
    difficulty: 'easy',
    rating: 4.96,
    review_count: 175,
    likes_count: 530,
    tags: ['Eje Cafetero', 'Salento', 'Cocora', 'Café', 'Familiar', 'UNESCO', 'Filandia'],
    recommended_audience: ['Familias', 'Niños y adultos mayores', 'Amantes del café'],
    best_season: 'Todo el año; clima primaveral constante (17-23°C)',
    recommended_schedule: 'Mañanas de caminatas campestres y tardes de café en plazas coloniales',
    meeting_point: 'Plaza Bolívar de Salento, Quindío',
    includes: ['Ruta completa de senderos y miradores', 'Guía de fincas con cata de café especial', 'Horarios de jeeps Willys tradicionales'],
    excludes: ['Paseo a caballo opcional', 'Alquiler de botas de caucho', 'Comidas no estipuladas'],
    recommendations: ['Llevar impermeable liviano para lluvias sorpresivas de montaña', 'Calzar tenis o botas con buena suela', 'Subirse a un Jeep Willys tradicional en la plaza'],
    what_to_bring: ['Chaqueta cortavientos', 'Sombrero campesino', 'Cámara fotográfica', 'Termo de agua'],
    tour_rules: ['Prohibido cortar o dañar la palma de cera (árbol nacional protegido)', 'No alimentar la fauna silvestre'],
    budget: { currency: 'COP', estimatedPerPersonMin: 420000, estimatedPerPersonMax: 880000, notes: 'Willys, entradas a reservas, tours de café y restaurantes' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Salento Colonial y Mirador del Valle',
        notes: 'Llegada al pueblo más antiguo del Quindío, arquitectura de zócalos y artesanías.',
        stops: [
          {
            stop_order: 1,
            name: 'Calle Real y Mirador Alto de la Cruz',
            latitude: 4.6375,
            longitude: -75.5705,
            image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80'],
            description: 'Calle peatonal adoquinada flanqueada por casas coloniales de bahareque pintadas de vivos colores con balcones cuajados de flores. Al final, una escalinata asciende hasta el mirador panorámico sobre el Valle de Cocora.',
            activities: ['Subir los 253 escalones hasta el mirador con vista al cañón (Gratis)', 'Comprar artesanías en guadua y madera de café ($15.000 - $50.000 COP)', 'Tomar un café campesino preparado en prensa o máquina de espresso ($5.000 - $12.000 COP)'],
            tips: ['Subir al mirador al atardecer cuando la neblina comienza a descender sobre la montaña', 'Probar el postre tradicional de arequipe con queso campesino'],
            curious_facts: ['Salento fue fundado en 1842 por colonos antioqueños y sirvió de paso crucial en la histórica Ruta del Quindío transitada por Humboldt y Bolívar'],
            suggested_minutes: 120,
            location_info: { address: 'Calle Real, Salento', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Bosque de Palmas de Cera en el Valle de Cocora',
        notes: 'Senderismo entre las palmas más altas del mundo en su hábitat de niebla.',
        stops: [
          {
            stop_order: 1,
            name: 'Valle de Cocora y Bosque de Niebla',
            latitude: 4.6430,
            longitude: -75.4980,
            image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'],
            description: 'Cuna del árbol nacional de Colombia, la Palma de Cera del Quindío (*Ceroxylon quindiuense*), que puede alcanzar hasta 60 metros de altura en laderas andinas cubiertas de pastizales y bosques nubosos.',
            activities: ['Paseo en Jeep Willys colectivo desde la plaza de Salento ($5.000 COP por trayecto)', 'Entrada al sendero de las palmas gigantes ($10.000 - $20.000 COP)', 'Almuerzo de trucha al ajillo servida sobre patacón gigante ($30.000 - $48.000 COP)'],
            tips: ['Alquilar botas de caucho en la entrada si ha llovido ($6.000 COP)', 'Hacer el circuito corto de 2 horas si va con niños o adultos mayores'],
            curious_facts: ['La palma de cera puede vivir más de 200 años y es el hogar exclusivo del loro orejiamarillo, especie en peligro de extinción'],
            suggested_minutes: 240,
            location_info: { address: 'Valle de Cocora, Salento', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: La Alquimia del Café en Finca Tradicional',
        notes: 'Proceso interactivo desde la semilla hasta la taza en hacienda cafetera.',
        stops: [
          {
            stop_order: 1,
            name: 'Finca Cafetera Ocaso / Las Acacias',
            latitude: 4.6210,
            longitude: -75.5920,
            image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'],
            description: 'Hacienda tradicional enclavada entre laderas cafeteras donde se enseña de manera práctica la recolección selectiva manual de cerezas rojas, el beneficio, secado al sol y el tueste artesanal.',
            activities: ['Vestirse con canasto campesino y recolectar granos maduros (Tour: $45.000 COP)', 'Taller de cata sensorial de perfiles de café (Gratis con el tour)', 'Comprar café tostado en grano recién empacado para llevar ($25.000 - $45.000 COP)'],
            tips: ['Llevar pantalón largo y repelente para caminar entre los cafetales', 'Preguntar por las variedades Geisha y Borbón Rosado'],
            curious_facts: ['En Colombia el café se recolecta exclusivamente a mano grano a grano para garantizar que solo las cerezas en su punto óptimo de azúcar se procesen'],
            suggested_minutes: 150,
            location_info: { address: 'Vereda Palestina, Salento', priceRange: '$$ - Tour $45.000 COP' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Filandia: Cestería y la Colina Iluminada',
        notes: 'El pueblo más lindo del Quindío, famoso por su cestería en bejuco y gastronomía.',
        stops: [
          {
            stop_order: 1,
            name: 'Mirador Colina Iluminada y Barrio de los Artesanos',
            latitude: 4.6750,
            longitude: -75.6620,
            image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80'],
            description: 'Pueblo vecino a Salento que conserva una atmósfera apacible y arquitectura impecable. Cuenta con una torre mirador de madera de 27 metros construida con maderas nativas y guadua.',
            activities: ['Subir al Mirador Colina Iluminada con vista a los tres departamentos del Eje Cafetero ($10.000 COP)', 'Conocer a los maestros cesteros del bejuco en el Centro de Interpretación ($5.000 COP)', 'Almorzar en el célebre restaurante Helena Adentro ($40.000 - $75.000 COP)'],
            tips: ['Filandia queda a solo 30 minutos de Salento en Willys o taxi ($10.000 COP pasaje colectivo)', 'Reservar mesa con anticipación en Helena Adentro para fines de semana'],
            curious_facts: ['El nombre de Filandia proviene del latín *Filia* (hija) y del inglés *Andia* (Andes), significando "Hija de los Andes"'],
            suggested_minutes: 180,
            location_info: { address: 'Mirador Colina Iluminada, Filandia', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Termales de Santa Rosa de Cabal y Despedida',
        notes: 'Relajación absoluta en piscinas termales naturales rodeadas de cascadas frías.',
        stops: [
          {
            stop_order: 1,
            name: 'Termales Balneario Santa Rosa de Cabal',
            latitude: 4.8620,
            longitude: -75.5480,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Aguas termales minerales que brotan de la tierra volcánica a más de 40°C, rodeadas por una cascada natural de agua fría de 95 metros de caída libre que desciende por la montaña verde.',
            activities: ['Baño hidrotermal en piscinas escalonadas (Entrada: $45.000 - $65.000 COP según temporada)', 'Contraste térmico bajo el rocío de la cascada natural (Gratis con entrada)', 'Probar el famoso chorizo santarrosano tradicional con arepa ($15.000 - $22.000 COP)'],
            tips: ['Llevar sandalias antideslizantes y toalla', 'Ideal visitar en la mañana o al atardecer para una experiencia relajante'],
            curious_facts: ['Las aguas termales de Santa Rosa son telúricas, inodoras y ricas en minerales alcalinos beneficiosos para la piel y articulaciones'],
            suggested_minutes: 240,
            location_info: { address: 'Kilómetro 4 Vereda San Ramón, Santa Rosa de Cabal', priceRange: '$$ - Entrada $45.000 - $65.000 COP' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-bogota-villa-de-leyva-5d',
    title: 'Bogotá Histórica y Villa de Leyva: Tesoros Andinos y Fósiles',
    country: 'Colombia',
    city: 'Bogotá',
    type: 'historical',
    tourScope: 'city_to_city',
    description: 'Travesía histórica de 5 días desde la cosmopolita capital andina hasta la villa colonial empedrada más majestuosa de Colombia. Incluye el Museo del Oro, el santuario de Monserrate, la Catedral de Sal de Zipaquirá y los misterios paleontológicos de Villa de Leyva.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 190000,
    difficulty: 'easy',
    rating: 4.93,
    review_count: 130,
    likes_count: 410,
    tags: ['Bogotá', 'Villa de Leyva', 'Zipaquirá', 'Historia', 'Cultura', 'Colonial'],
    recommended_audience: ['Viajeros culturales', 'Historiadores', 'Familias'],
    best_season: 'Diciembre a Marzo y Julio a Agosto (menos lluvias en sabana)',
    recommended_schedule: 'Salidas matutinas para optimizar trayectos intermunicipales',
    meeting_point: 'Plaza de Bolívar, Bogotá',
    includes: ['Itinerario histórico documentado', 'Información de boletería de museos y catedral subterránea', 'Ruta de casonas coloniales'],
    excludes: ['Boletos de teleférico / funicular Monserrate', 'Entrada a Catedral de Sal', 'Transportes interurbanos'],
    recommendations: ['Llevar abrigo y paraguas (el clima en Bogotá y Villa de Leyva refresca bastante por las noches: 8-14°C)', 'Aclimatarse al llegar (Bogotá está a 2.600 msnm)'],
    what_to_bring: ['Chaqueta o suéter abrigado', 'Zapatos cómodos para empedrado', 'Gafas de sol', 'Cámara'],
    tour_rules: ['No tocar las piezas orfebres ni los fósiles en exhibición'],
    budget: { currency: 'COP', estimatedPerPersonMin: 400000, estimatedPerPersonMax: 850000, notes: 'Entradas museos, funicular, Catedral de Sal y bus intermunicipal' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Centro Histórico de La Candelaria y Museo del Oro',
        notes: 'Exploración del corazón fundacional de Bogotá y su legado precolombino.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo del Oro del Banco de la República',
            latitude: 4.6018,
            longitude: -74.0720,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Alberga la colección de orfebrería prehispánica más grande del planeta con más de 34.000 piezas maestras de oro y tumbaga de las culturas Muisca, Quimbaya, Calima y Tayrona.',
            activities: ['Admirar la mítica Balsa Muisca de la leyenda de El Dorado (Entrada: $5.000 COP / domingos gratis)', 'Experimentar la sala oscura de la Ofrenda con cantos ceremoniales (Gratis con entrada)', 'Comprar réplicas certificadas en la tienda oficial del museo ($30.000 - $120.000 COP)'],
            tips: ['Cierra los días lunes; planificar la visita de martes a domingo', 'Alquilar la audioguía multilingüe para profundizar en la cosmovisión indígena ($10.000 COP)'],
            curious_facts: ['La Balsa Muisca fue encontrada en 1969 por tres campesinos dentro de una cueva en el municipio de Pasca dentro de una vasija de barro'],
            suggested_minutes: 120,
            location_info: { address: 'Carrera 6 # 15-88, Parque Santander', priceRange: '$ - Entrada $5.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Plaza de Bolívar y Callejón del Chorro de Quevedo',
            latitude: 4.5981,
            longitude: -74.0760,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Centro cívico e histórico de Colombia, rodeado por el Capitolio Nacional, el Palacio de Justicia, la Catedral Primada y la Alcaldía Mayor. A pocas cuadras se encuentra el Chorro de Quevedo, rincón bohemio fundacional.',
            activities: ['Fotografiar la arquitectura neoclásica y republicana de la plaza (Gratis)', 'Probar un ajiaco santafereño tradicional con alcaparras y crema de leche ($28.000 - $45.000 COP)', 'Disfrutar de un vaso de chicha de maíz en el Chorro de Quevedo ($5.000 COP)'],
            tips: ['El Chorro de Quevedo tiene gran vida universitaria y cuenteros al atardecer', 'Cuidar pertenencias en zonas concurridas'],
            curious_facts: ['En el Chorro de Quevedo estableció Gonzalo Jiménez de Quesada su guarnición militar con 12 chozas en 1538'],
            suggested_minutes: 120,
            location_info: { address: 'Carrera 7 con Calle 11, La Candelaria', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Cerro de Monserrate y Sabores Andinos',
        notes: 'Ascenso a 3.152 metros con vista panorámica de toda la sabana de Bogotá.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario del Señor Caído de Monserrate',
            latitude: 4.6056,
            longitude: -74.0555,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Guardián tutelar de la capital, coronado por una basílica blanca del siglo XVII que custodia la venerada imagen del Señor Caído. Ofrece un mirador inigualable sobre la inmensa urbe de 8 millones de habitantes.',
            activities: ['Subida en teleférico o funicular panorámico (Ticket ida y vuelta: ~$27.000 COP)', 'Visita al santuario y recorrido por las estaciones del viacrucis en bronce (Gratis)', 'Probar agua de panela con queso y almojábana en los puestos del mirador ($8.000 - $14.000 COP)'],
            tips: ['Subir en la mañana para encontrar el cielo despejado antes de que bajen nubes', 'Llevar abrigo; en la cumbre la temperatura suele rondar los 10°C con viento'],
            curious_facts: ['Los cerros de Monserrate y Guadalupe eran considerados lugares sagrados por los muiscas mucho antes de la colonia, asociados a los solsticios'],
            suggested_minutes: 150,
            location_info: { address: 'Cerro de Monserrate', priceRange: '$ - Funicular $27.000 COP' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Catedral de Sal de Zipaquirá (Camino a Villa de Leyva)',
        notes: 'La primera maravilla arquitectónica de Colombia excavada en una mina de sal.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral de Sal de Zipaquirá',
            latitude: 5.0190,
            longitude: -74.0090,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Monumento arquitectónico subterráneo construido en el interior de una mina de sal a 180 metros bajo tierra. Cuenta con un monumental vía crucis tallado en roca salina y una cruz central de 16 metros de altura iluminada.',
            activities: ['Recorrido subterráneo con audioguía oficial (Entrada general: ~$60.000 COP / extranjero: ~$98.000 COP)', 'Show de luces LED en la nave central de la catedral (Gratis con entrada)', 'Probar obleas con arequipe y mora en el parque central de Zipaquirá ($6.000 COP)'],
            tips: ['La temperatura dentro de la mina es constante a 14°C; llevar chaqueta cómoda', 'El bus desde el Portal Norte de Bogotá a Zipaquirá tarda 45 minutos ($8.500 COP)'],
            curious_facts: ['Los depósitos de sal de Zipaquirá se formaron hace más de 250 millones de años por la evaporación de un antiguo mar interior cretácico'],
            suggested_minutes: 180,
            location_info: { address: 'Parque de la Sal, Zipaquirá', priceRange: '$$ - Entrada oficial' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Villa de Leyva: La Gran Plaza y Calles Empedradas',
        notes: 'Llegada a la joya colonial de Boyacá, arquitectura blanca y aire seco.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza Mayor de Villa de Leyva',
            latitude: 5.6325,
            longitude: -73.5245,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Con 14.000 metros cuadrados completamente empedrados con cantos rodados, es una de las plazas coloniales más extensas de toda Hispanoamérica. Está rodeada de casonas encaladas de blanco, balcones de madera y la iglesia parroquial de 1608.',
            activities: ['Caminar por la inmensidad empedrada de la plaza y tomar fotos panorámicas (Gratis)', 'Cena gourmet con vino boyacense en los restaurantes de los arcos ($45.000 - $80.000 COP)', 'Degustar amasijos típicos: almojábanas, garullas y pan de yuca ($5.000 - $10.000 COP)'],
            tips: ['Usar zapatos planos y cómodos; los cantos rodados pueden ser difíciles de caminar con tacones o calzado liso', 'En la noche la iluminación tenue de los faroles coloniales crea un ambiente mágico'],
            curious_facts: ['La pila de agua de piedra tallada en el centro de la plaza surtió de agua potable a los habitantes durante más de cuatro siglos'],
            suggested_minutes: 120,
            location_info: { address: 'Plaza Mayor, Villa de Leyva, Boyacá', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Paleontología, Fósiles y Pozos Azules',
        notes: 'Misterios de los dinosaurios marinos que habitaron la región hace 110 millones de años.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo El Fósil y Pozos Azules',
            latitude: 5.6450,
            longitude: -73.5480,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Museo comunitario erigido alrededor del esqueleto casi completo de un *Kronosaurus boyacensis*, un reptil marino carnívoro gigante de 115 millones de años hallado *in situ* por campesinos en 1977. Cerca se encuentran los Pozos Azules, piscinas artificiales en medio del desierto.',
            activities: ['Observar el fósil gigante preservado en la misma roca donde murió (Entrada: $12.000 COP)', 'Caminata escénica por los senderos de los Pozos Azules ($15.000 COP)', 'Visita a la singular Casa Terracota, la cerámica habitable más grande del mundo ($20.000 COP)'],
            tips: ['Se puede alquilar bicicleta o cuatrimoto para recorrer el circuito de los fósiles ($40.000 - $70.000 COP/hora)', 'Llevar protector solar; el sol en el valle es intenso'],
            curious_facts: ['El Kronosaurus medía casi 10 metros de largo y poseía mandíbulas más poderosas que las de un tiranosaurio rex'],
            suggested_minutes: 180,
            location_info: { address: 'Vereda Monquirá, Villa de Leyva', priceRange: '$ - Entradas combinadas ~$30.000 COP' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-santander-extremo-sangil-barichara-5d',
    title: 'Santander Extremo: San Gil, Cañón del Chicamocha y Barichara',
    country: 'Colombia',
    city: 'San Gil',
    type: 'sports',
    tourScope: 'city_to_city',
    description: 'Circuito de 5 días por la tierra de los comuneros. Combina deportes extremos de clase mundial (rafting en rápidos clase IV, parapente en cañones colosales) con la serenidad pétrea y artística de Barichara, catalogado como el pueblo más bello de Colombia.',
    cover_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 160000,
    difficulty: 'intense',
    rating: 4.94,
    review_count: 140,
    likes_count: 450,
    tags: ['Santander', 'San Gil', 'Chicamocha', 'Barichara', 'Deportes Extremos', 'Rafting', 'Aventura'],
    recommended_audience: ['Aventureros', 'Jóvenes y grupos de amigos', 'Amantes de la adrenalina'],
    best_season: 'Diciembre a Marzo y Junio a Agosto (condiciones óptimas de viento y río)',
    recommended_schedule: 'Actividades de aventura por la mañana temprano por clima y vientos',
    meeting_point: 'Parque El Gallineral, San Gil',
    includes: ['Ruta completa de deportes de aventura', 'Coordenadas de agencias certificadas', 'Guía arquitectónica del Camino Real de Barichara'],
    excludes: ['Vuelo en parapente', 'Descenso de rafting', 'Alquiler de equipos'],
    recommendations: ['Contratar agencias de aventura con sellos de certificación de turismo activo vigentes', 'Llevar zapatillas deportivas que se puedan mojar'],
    what_to_bring: ['Ropa deportiva de secado rápido', 'Protector solar resistente al agua', 'Muda de ropa extra', 'Gorra con cordón'],
    tour_rules: ['Obligatorio uso de casco y chaleco salvavidas en todas las actividades acuáticas y aéreas'],
    budget: { currency: 'COP', estimatedPerPersonMin: 450000, estimatedPerPersonMax: 980000, notes: 'Rafting Río Fonce, teleférico Chicamocha, parapente y posadas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: San Gil: Capital de la Aventura y Parque El Gallineral',
        notes: 'Llegada a San Gil y aclimatación entre ceibas centenarias y musgo barba de viejo.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Natural El Gallineral',
            latitude: 6.5540,
            longitude: -73.1360,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Hermosa isla natural de 4 hectáreas formada por dos brazos del río Fonce. Está poblada por gigantescos árboles de gallinero cubiertos por lánguidas cortinas de musgo plateado ("barba de viejo") que crean un ambiente casi fantástico.',
            activities: ['Caminata por senderos ecológicos bajo las barbas de viejo (Entrada: $6.000 COP)', 'Piscina natural alimentada por aguas del manantial (Gratis con entrada)', 'Probar carne oreada santandereana con arepa de maíz pelado ($22.000 - $35.000 COP)'],
            tips: ['Llevar repelente de insectos para la caminata ribereña', 'Excelente lugar para descansar tras el viaje por carretera'],
            curious_facts: ['El musgo "barba de viejo" (*Tillandsia usneoides*) es un bioindicador de aire puro; solo crece donde no hay polución industrial'],
            suggested_minutes: 120,
            location_info: { address: 'Malecón Turístico, San Gil', priceRange: '$ - Entrada $6.000 COP' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Descenso en Rafting por el Río Fonce',
        notes: 'Adrenalina en los rápidos de agua viva y tarde de café.',
        stops: [
          {
            stop_order: 1,
            name: 'Río Fonce: Rápidos Clase III',
            latitude: 6.5500,
            longitude: -73.1400,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'El cauce natural más popular de Colombia para rafting comercial seguro y emocionante. Un recorrido de 11 kilómetros con rápidos de clase III ("La Curva", "El Remolino") rodeados de naturaleza verde.',
            activities: ['Descenso guiado en balsa inflable con instructores certificados ($50.000 - $65.000 COP por persona)', 'Saltos de prueba al agua en pozas mansas (Incluido en el tour)', 'Reportaje fotográfico digital de acción ($20.000 COP opcional)'],
            tips: ['No llevar joyas, anillos ni relojes que puedan perderse en el río', 'Usar tenis viejos amarrados, no chancletas ni sandalias sueltas'],
            curious_facts: ['San Gil fue declarada oficialmente Capital Turística de Santander en 2004 gracias a su desarrollo pionero de deportes de aventura'],
            suggested_minutes: 180,
            location_info: { address: 'Punto de partida El Arenal, Río Fonce', priceRange: '$$ - Actividad ~$55.000 COP' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Majestuoso Cañón del Chicamocha y Teleférico',
        notes: 'Uno de los cañones más profundos del mundo y vistas colosales de la cordillera.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Nacional del Chicamocha (PANACHI)',
            latitude: 6.7890,
            longitude: -73.0030,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Abismo geológico colosal con más de 2.000 metros de profundidad. Cuenta con un teleférico de 6.3 kilómetros que cruza de lado a lado el abismo hasta la Mesa de los Santos, y el Monumento a la Santandereanidad erigido sobre una hoja de tabaco.',
            activities: ['Cruce en teleférico sobre el cañón (Entrada Parque + Teleférico: ~$65.000 COP)', 'Vuelo en parapente tándem sobre el abismo del cañón ($200.000 - $250.000 COP)', 'Almuerzo típico de cabro con pepitoria ($30.000 - $45.000 COP)'],
            tips: ['Llevar sombrero con barboquejo para que no se vuele con el viento huracanado del mirador', 'El teleférico puede suspenderse temporalmente por ráfagas de viento fuertes; tener paciencia'],
            curious_facts: ['El Cañón del Chicamocha es más profundo que el Gran Cañón del Colorado, superando los dos kilómetros desde la cima hasta el lecho del río'],
            suggested_minutes: 240,
            location_info: { address: 'Kilómetro 54 Vía Bucaramanga - San Gil', priceRange: '$$$ - Parque y atracciones' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Barichara: Arquitectura de Piedra y Escultores',
        notes: 'El pueblo más lindo de Colombia, tallado en piedra amarilla por maestros canteros.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral de la Inmaculada Concepción y Mirador del Río Suárez',
            latitude: 6.6360,
            longitude: -73.2240,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Monumento nacional de piedra caliza dorada que adquiere tonos ocres y dorados intensos con la luz del atardecer. Sus calles de tapia pisada albergan talleres de talladores de piedra, tejedores y papel artesanal de fique.',
            activities: ['Visitar el interior de la catedral sostenida por 10 columnas monolíticas (Gratis)', 'Caminar hasta el Mirador de Barichara sobre el cañón del río Suárez (Gratis)', 'Taller práctico en la Fundación San Lorenzo de elaboración de papel de fique ($15.000 COP)'],
            tips: ['Barichara queda a solo 30 minutos de San Gil en bus local ($6.000 COP)', 'Al atardecer la temperatura es perfecta para pasear por las calles desiertas'],
            curious_facts: ['Toda la catedral y las calles fueron labradas a mano por canteros locales con piedra extraída de las canteras amarillas de la meseta'],
            suggested_minutes: 180,
            location_info: { address: 'Plaza Principal, Barichara', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Senderismo por el Camino Real de Lengerke a Guane',
        notes: 'Caminata histórica empedrada del siglo XIX hacia el pueblo fósil de Guane.',
        stops: [
          {
            stop_order: 1,
            name: 'Camino Real de Barichara a Guane',
            latitude: 6.6450,
            longitude: -73.2380,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Sendero histórico empedrado de 5.5 kilómetros construido a mediados del siglo XIX por el ingeniero alemán Geo von Lengerke. Desciende suavemente por la falda de la meseta ofreciendo vistas imponentes de la cordillera hasta el diminuto y colonial caserío de Guane.',
            activities: ['Caminata ecológica y fotográfica de 2 horas por el sendero histórico (Gratis)', 'Visita al Museo Arqueológico y Paleontológico de Guane ($8.000 COP)', 'Probar el sabajón casero de Guane y helados artesanales ($6.000 - $12.000 COP)'],
            tips: ['Iniciar la caminata antes de las 8:30 AM para evitar el calor sofocante del mediodía', 'Para regresar de Guane a Barichara se puede tomar el bus chiva local ($4.000 COP)'],
            curious_facts: ['En el museo de Guane se conserva la momia indígena Guane de una mujer joven con deformación craneal ritual prehispánica'],
            suggested_minutes: 180,
            location_info: { address: 'Salida Glorieta de Barichara hacia Guane', priceRange: '$ - Senderismo libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-medellin-guatape-santafe-5d',
    title: 'Medellín Innovadora, Guatapé y Santa Fe de Antioquia',
    country: 'Colombia',
    city: 'Medellín',
    type: 'urban',
    tourScope: 'city_to_city',
    description: 'Circuito de 5 días que captura la vibrante transformación urbana y social de Medellín (la Ciudad de la Eterna Primavera), combinada con la subida a los 740 escalones del monolito de Guatapé y el viaje al pasado colonial de Santa Fe de Antioquia.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 175000,
    difficulty: 'moderate',
    rating: 4.96,
    review_count: 188,
    likes_count: 590,
    tags: ['Medellín', 'Guatapé', 'Comuna 13', 'Santa Fe de Antioquia', 'Urbano', 'Metrocable'],
    recommended_audience: ['Viajeros cosmopolitas', 'Amantes del arte urbano', 'Aventureros'],
    best_season: 'Todo el año; agosto es sensacional por la Feria de las Flores',
    recommended_schedule: 'Tours urbanos matutinos y tarde/noche en Provenza y El Poblado',
    meeting_point: 'Estación Metro San Antonio / Plaza Botero',
    includes: ['Ruta completa del sistema integrado Metro y Metrocable', 'Itinerario del Graffitour comunitario', 'Ruta de zócalos de Guatapé'],
    excludes: ['Boleto de ascenso a la Piedra del Peñol', 'Paseo en lancha en represa', 'Tarjeta Cívica Metro'],
    recommendations: ['Comprar la tarjeta Cívica Eventual en cualquier taquilla del Metro ($10.000 COP)', 'Llevar calzado deportivo para subir los escalones del Peñol'],
    what_to_bring: ['Ropa cómoda y ligera', 'Chaqueta liviana para la noche', 'Gafas de sol', 'Cámara fotográfica'],
    tour_rules: ['Respetar la memoria de las víctimas en los recorridos de memoria histórica de la Comuna 13'],
    budget: { currency: 'COP', estimatedPerPersonMin: 390000, estimatedPerPersonMax: 820000, notes: 'Metro, entradas a museos, subida al Peñol y gastronomía paisa' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Medellín Cultural: Plaza Botero y Metrocable Arví',
        notes: 'Las esculturas monumentales de Fernando Botero y el vuelo en teleférico sobre el valle.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza Botero y Museo de Antioquia',
            latitude: 6.2526,
            longitude: -75.5683,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Parque urbano al aire libre que reúne 23 esculturas monumentales en bronce donadas por el maestro Fernando Botero. Flanqueado por el imponente Palacio de la Cultura Rafael Uribe Uribe y el Museo de Antioquia.',
            activities: ['Fotografiar las 23 esculturas de Botero en la plaza pública (Gratis)', 'Entrar a las salas de pintura del maestro Botero y Pedro Nel Gómez en el Museo de Antioquia (Entrada: $24.000 COP)', 'Tomar un tinto campesino en los cafés tradicionales del centro ($3.000 COP)'],
            tips: ['Visitar en la mañana cuando la plaza está activa y vigilada por la policía turística', 'El Palacio de la Cultura tiene una terraza mirador de acceso libre'],
            curious_facts: ['Botero donó personalmente las esculturas con la condición expresa de que estuvieran en un parque público al alcance del pueblo'],
            suggested_minutes: 120,
            location_info: { address: 'Carrera 52 # 52-43, Centro', priceRange: '$ - Museo $24.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Metrocable Línea K y Parque Arví',
            latitude: 6.2820,
            longitude: -75.5450,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'El primer sistema de teleférico de transporte masivo urbano del mundo integrado a un metro. Sobrevuela las laderas nororientales de la ciudad hasta internarse en la reserva forestal ecológica del Parque Arví.',
            activities: ['Vuelo panorámico sobre las comunas de Medellín en Metrocable (Pasaje integrado Metro: ~$3.600 COP)', 'Cruce de la niebla en el cable turístico hacia Arví ($13.500 COP)', 'Mercado campesino de frutas del bosque, fresas con crema y miel en la estación Arví ($10.000 - $20.000 COP)'],
            tips: ['Los lunes el Parque Arví está cerrado por mantenimiento del cable (excepto lunes festivos)'],
            curious_facts: ['El Metrocable de Medellín redujo los tiempos de viaje de los habitantes de las laderas de 2 horas a tan solo 20 minutos'],
            suggested_minutes: 150,
            location_info: { address: 'Estación Acevedo / Santo Domingo / Arví', priceRange: '$ - Pasaje integrado' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Resiliencia y Arte Urbano: Graffitour en Comuna 13',
        notes: 'Historia viva de transformación social a través del hip-hop, muralismo y escaleras eléctricas.',
        stops: [
          {
            stop_order: 1,
            name: 'Escaleras Eléctricas y Graffitour Comuna 13',
            latitude: 6.2540,
            longitude: -75.6190,
            image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'],
            description: 'El símbolo mundial de innovación social de Medellín. Un sistema de seis tramos de escaleras mecánicas al aire libre que reemplazaron más de 350 escalones empinados, rodeadas de galerías vivas de arte urbano, batallas de freestyle y breakdance.',
            activities: ['Tour guiado con líderes juveniles locales del barrio ($35.000 - $50.000 COP)', 'Probar las célebres paletas artesanales de mango biche con sal y limón ($5.000 COP)', 'Presenciar los shows de danza urbana y rap en los miradores (Propina voluntaria)'],
            tips: ['Tomar el Metro hasta San Javier y luego el autobús alimentador o taxi ($10.000 COP)', 'Comprar arte directamente a los grafiteros locales en sus galerías'],
            curious_facts: ['Las escaleras eléctricas son públicas y completamente gratuitas para los vecinos de la comunidad'],
            suggested_minutes: 180,
            location_info: { address: 'Barrio Las Independencias, Comuna 13', priceRange: '$ - Tour local accesible' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Monolito Sagrado de Guatapé y el Peñol',
        notes: 'Ascenso a la gigantesca roca de 220 metros y pueblo de zócalos artísticos.',
        stops: [
          {
            stop_order: 1,
            name: 'Piedra del Peñol',
            latitude: 6.2206,
            longitude: -75.1785,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Monolito gigantesco de piedra de 220 metros de altura que domina el laberinto de islas verdes del embalse de Guatapé. Se corona a través de una impresionante escalera de mampostería de 740 peldaños incrustada en su grieta natural.',
            activities: ['Ascender los 740 escalones hasta el mirador de la cumbre (Entrada: $25.000 COP)', 'Tomar una michelada o jugo de maracuyá en la cima mientras se contempla el embalse ($12.000 - $18.000 COP)', 'Fotografía panorámica de 360 grados sobre el archipiélago de la represa (Gratis)'],
            tips: ['Subir a paso constante y llevar agua; hay descansos numerados cada 50 escalones', 'Los buses salen cada 20 minutos desde la Terminal del Norte de Medellín ($19.000 COP)'],
            curious_facts: ['La piedra pesa más de 10 millones de toneladas y fue escalada por primera vez de manera oficial en 1954 por Luis Eduardo Villegas'],
            suggested_minutes: 150,
            location_info: { address: 'Vereda La Piedra, Guatapé', priceRange: '$$ - Entrada $25.000 COP' }
          },
          {
            stop_order: 2,
            name: 'Pueblo de los Zócalos y Plazoleta de los Zócalos',
            latitude: 6.2330,
            longitude: -75.1580,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Pueblo lacustre famoso porque cada una de sus casas exhibe zócalos tridimensionales de yeso y cemento tallados en sus bases, que narran anécdotas, oficios y animales de las familias que las habitan.',
            activities: ['Caminar por la Calle del Recuerdo y la Plazoleta de los Zócalos (Gratis)', 'Paseo en lancha rápida o barco rumbero por el embalse ($25.000 - $40.000 COP)', 'Almorzar bandeja paisa con chicharrón crocante y frijoles ($32.000 - $45.000 COP)'],
            tips: ['Tomar un motocarro decorado para moverse entre la Piedra y el pueblo de Guatapé ($12.000 COP)', 'Comprar café gourmet local cultivado alrededor del embalse'],
            curious_facts: ['La tradición de los zócalos comenzó a principios del siglo XX cuando don José María Parra empezó a adornar la fachada de su casa con figuras de borregos'],
            suggested_minutes: 180,
            location_info: { address: 'Centro de Guatapé, Antioquia', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Santa Fe de Antioquia y el Puente de Occidente',
        notes: 'Viaje a la antigua capital colonial de Antioquia y joya de la arquitectura de madera.',
        stops: [
          {
            stop_order: 1,
            name: 'Puente Colgante de Occidente',
            latitude: 6.5770,
            longitude: -75.7980,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra maestra de la ingeniería del siglo XIX diseñada por el ingeniero José María Villa (quien participó en el puente de Brooklyn). Cruza el caudaloso río Cauca con una estructura de madera, cables de acero y torres piramidales de 291 metros de longitud.',
            activities: ['Cruzar a pie el puente histórico de madera sobre el río Cauca ($3.000 COP)', 'Paseo en mototaxi tradicional desde el parque de Santa Fe ($15.000 COP)', 'Probar frutas exóticas locales como tamarindo y zapote con sal ($5.000 COP)'],
            tips: ['El clima en Santa Fe de Antioquia es cálido y soleado (28-34°C); llevar ropa muy fresca y protector solar', 'En el puente no transitan automóviles particulares grandes, solo mototaxis y peatones'],
            curious_facts: ['En el momento de su inauguración en 1895 era considerado el séptimo puente colgante más largo del mundo'],
            suggested_minutes: 90,
            location_info: { address: 'Río Cauca, Vía Olaya - Santa Fe', priceRange: '$ - Acceso simbólico' }
          },
          {
            stop_order: 2,
            name: 'Centro Histórico de Santa Fe de Antioquia',
            latitude: 6.5570,
            longitude: -75.8280,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Monumento nacional fundado en 1541 que fue capital del departamento de Antioquia hasta 1826. Posee siete iglesias coloniales, casonas solariegas con patios centrales y joyerías dedicadas a la filigrana en oro.',
            activities: ['Visitar la Catedral Basílica de la Inmaculada Concepción (Gratis)', 'Conocer los talleres de orfebres de filigrana en oro y plata de la región', 'Tomar una cerveza helada o jugo de tamarindo en la Plaza Mayor ($5.000 - $8.000 COP)'],
            tips: ['Santa Fe de Antioquia queda a solo 1 hora y 15 minutos de Medellín gracias al Túnel de Occidente'],
            curious_facts: ['Sus calles empedradas conservan el nombre original de la época colonial como la Calle de la Amargura y la Calle del Medio'],
            suggested_minutes: 120,
            location_info: { address: 'Parque Principal Simón Bolívar, Santa Fe de Antioquia', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Medellín Moderno: El Poblado, Provenza y Despedida',
        notes: 'Gastronomía de autor, cafés de especialidad y ambiente cosmopolita.',
        stops: [
          {
            stop_order: 1,
            name: 'Barrio Provenza y Parque Lleras',
            latitude: 6.2085,
            longitude: -75.5680,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'El epicentro gastronómico y de diseño de Medellín. Calles peatonales rodeadas de vegetación tropical, boutiques de diseñadores independientes, cafeterías de cafés de origen y restaurantes galardonados internacionalmente.',
            activities: ['Cata de cafés especiales filtrados en Pergamino Café o Café Velvet ($8.000 - $16.000 COP)', 'Almuerzo de cocina colombiana contemporánea ($45.000 - $90.000 COP)', 'Paseo por las tiendas de moda urbana colombiana'],
            tips: ['Zona peatonal muy segura y agradable para caminar a cualquier hora del día', 'Ideal para comprar café de especialidad empacado al vacío para el vuelo de regreso'],
            curious_facts: ['La revista británica *Time Out* clasificó a Provenza como una de las calles más "cool" y atractivas del planeta en su ranking mundial'],
            suggested_minutes: 150,
            location_info: { address: 'Carrera 35 con Calle 8A, El Poblado', priceRange: '$$ - Restaurantes y cafés' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-amazonas-profundo-leticia-tarapoto-6d',
    title: 'Amazonas Colombiano Profundo: Selva, Delfines Rosados y Etnias',
    country: 'Colombia',
    city: 'Leticia',
    type: 'ecological',
    tourScope: 'micro_destination',
    description: 'Expedición ecológica de 6 días en el pulmón del mundo. Navegación por el río más caudaloso de la Tierra, avistamiento de delfines rosados en los Lagos de Tarapoto, caminatas nocturnas en selva virgen y convivencia con comunidades indígenas Ticuna y Yagua.',
    cover_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 8640,
    distance_meters: 120000,
    difficulty: 'moderate',
    rating: 4.95,
    review_count: 78,
    likes_count: 320,
    tags: ['Amazonas', 'Leticia', 'Puerto Nariño', 'Delfines Rosados', 'Ecológico', 'Selva'],
    recommended_audience: ['Ecoturistas', 'Fotógrafos de vida silvestre', 'Biólogos y aventureros'],
    best_season: 'Julio a Noviembre (temporada de aguas bajas con playas de río)',
    recommended_schedule: 'Expediciones fluviales matutinas y safaris nocturnos de selva',
    meeting_point: 'Parque Santander de Leticia',
    includes: ['Ruta fluvial río arriba georreferenciada', 'Puntos de reserva natural y contacto comunitario', 'Guía de fauna amazónica'],
    excludes: ['Tarjeta de turismo de entrada a Leticia', 'Vacuna de fiebre amarilla (obligatoria)', 'Lanchas rápidas'],
    recommendations: ['Tener aplicada la vacuna contra la fiebre amarilla con mínimo 10 días de anticipación', 'Llevar botas de caucho altas para caminar en el fango selvático', 'Llevar repelente de alta concentración'],
    what_to_bring: ['Ropa de manga larga y secado rápido', 'Pantalones de trekking ligeros', 'Linterna frontal potente con baterías', 'Capa impermeable'],
    tour_rules: ['Prohibido el uso de flash directo al fotografiar aves y monos', 'No tocar especies vegetales sin indicación del guía indígena'],
    budget: { currency: 'COP', estimatedPerPersonMin: 650000, estimatedPerPersonMax: 1400000, notes: 'Lanchas fluviales compartidas, reserva comunitaria y comidas típicas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Leticia y el Enjambre de Loros en Parque Santander',
        notes: 'Llegada a la triple frontera (Colombia, Brasil, Perú) y espectáculo aéreo al atardecer.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Santander y Mirador de la Iglesia',
            latitude: -4.2153,
            longitude: -69.9405,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Plaza principal de Leticia donde cada tarde, exactamente a las 5:30 PM, miles de pequeños loros y pericos salvajes llegan en bandadas coordinadas desde la selva para pernoctar en las copas de los árboles del parque.',
            activities: ['Subir a la torre campanario de la iglesia parroquial para ver el enjambre de loros ($5.000 COP)', 'Probar el pez pirarucú ahumado o frito con fariña en los restaurantes del muelle ($25.000 - $40.000 COP)', 'Caminar cruzando la frontera seca hacia Tabatinga (Brasil) sin trámites aduaneros (Gratis)'],
            tips: ['Llevar sombrilla durante el espectáculo de los loros para protegerse de las deposiciones de las aves', 'Pagar el impuesto de turismo de Leticia al aterrizar en el aeropuerto (~$38.000 COP)'],
            curious_facts: ['Se calcula que más de 50.000 pericos de la especie *Brotogeris versicolurus* llegan al parque cada tarde en menos de media hora'],
            suggested_minutes: 120,
            location_info: { address: 'Carrera 11 con Calle 8, Leticia', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Flor de Loto Victoria Regia y Reserva Marasha',
        notes: 'Navegación fluvial hacia lagunas de nenúfares gigantes y pesca de pirañas.',
        stops: [
          {
            stop_order: 1,
            name: 'Reserva Natural Victoria Regia',
            latitude: -4.1850,
            longitude: -69.9820,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Laguna amazónica donde crece la flor de loto más grande del mundo (*Victoria amazonica*), cuyas hojas circulares flotantes pueden alcanzar hasta dos metros de diámetro y soportar más de 30 kilos de peso.',
            activities: ['Observar las gigantescas hojas de la Victoria Regia flotando sobre el agua (Entrada: $15.000 COP)', 'Paseo en canoa de madera entre los lagos de nenúfares (Gratis con entrada)', 'Probar frutos amazónicos exóticos como copoazú, arazá y camu-camu ($8.000 COP)'],
            tips: ['Las flores de la Victoria Regia se abren al anochecer y cambian de color blanco a rosado en 48 horas', 'Llevar repelente y protector solar para el paseo en bote'],
            curious_facts: ['La estructura inferior de la hoja de la Victoria Regia inspiró el diseño estructural del Crystal Palace de Londres en el siglo XIX'],
            suggested_minutes: 150,
            location_info: { address: 'Río Amazonas, margen izquierda', priceRange: '$ - Entrada $15.000 COP' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Puerto Nariño: El Pesebre Ecológico de Colombia',
        notes: 'Pueblo modelo sostenible donde no existen automóviles ni motocicletas.',
        stops: [
          {
            stop_order: 1,
            name: 'Pueblo de Puerto Nariño y Mirador Naipata',
            latitude: -3.7725,
            longitude: -70.3830,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Localidad modelo a 75 kilómetros río arriba de Leticia, habitada mayoritariamente por la etnia Ticuna. Es célebre por su urbanismo peatonal sin vehículos de combustión, sus senderos ajardinados y su mirador en forma de árbol que domina la selva.',
            activities: ['Subir a la torre mirador Naipata para vista panorámica del río Loretoyacu ($5.000 COP)', 'Visitar el Centro de Interpretación Natütama dedicado a la conservación de manatíes ($12.000 COP)', 'Almorzar pescado gamitana o sábalo asado en hoja de plátano ($22.000 - $35.000 COP)'],
            tips: ['La lancha rápida desde Leticia a Puerto Nariño tarda 1 hora y 45 minutos ($42.000 COP por trayecto)', 'En Puerto Nariño todo el transporte es a pie'],
            curious_facts: ['Es considerado el primer municipio certificado como destino turístico sostenible de Colombia por su manejo ecológico de residuos'],
            suggested_minutes: 180,
            location_info: { address: 'Puerto Nariño, Amazonas', priceRange: '$ - Entrada al pueblo $10.000 COP' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Lagos de Tarapoto y los Delfines Rosados',
        notes: 'Humedal Ramsar protegido donde nadan delfines rosados y grises de agua dulce.',
        stops: [
          {
            stop_order: 1,
            name: 'Complejo de Humedales Lagos de Tarapoto',
            latitude: -3.7910,
            longitude: -70.4320,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Espejo de agua protegido como humedal de importancia internacional Ramsar. Hábitat de los emblemáticos delfines rosados (*Inia geoffrensis*) y delfines grises (*Sotalia fluviatilis*), caimanes negros y el pez pirarucú.',
            activities: ['Navegación lenta en bote artesanal para avistar delfines rosados emergiendo a respirar ($60.000 - $90.000 COP por bote)', 'Baño en aguas cálidas y tranquilas del lago (Gratis)', 'Senderismo de interpretación de árboles gigantes de ceiba y matapalo con guía nativo ($25.000 COP)'],
            tips: ['Apagar el motor del bote para escuchar el soplido característico del delfín al respirar', 'No intentar tocar a los delfines para no alterar su conducta silvestre'],
            curious_facts: ['Los delfines rosados del Amazonas poseen vértebras cervicales no fusionadas, lo que les permite girar el cuello 90 grados para cazar entre los troncos sumergidos'],
            suggested_minutes: 240,
            location_info: { address: 'Lagos de Tarapoto, Puerto Nariño', priceRange: '$$ - Excursión en lancha' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Tradición Ancestral en Comunidad Indígena Ticuna',
        notes: 'Intercambio cultural respetuoso, medicina tradicional y tintes naturales.',
        stops: [
          {
            stop_order: 1,
            name: 'Comunidad Indígena Ticuna de San Martín de Amacayacu',
            latitude: -3.7320,
            longitude: -70.3210,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Asentamiento tradicional en las riberas del río Amacayacu. Los abuelos y artesanos enseñan el tejido con fibra de chambira, el tallado de madera de palo de sangre y la preparación de remedios con plantas medicinales de selva.',
            activities: ['Taller de tejido con fibra de chambira con mujeres artesanas ($15.000 COP)', 'Demostración de tiro con cerbatana tradicional indígena ($10.000 COP)', 'Alquiler de artesanías talladas en palo de sangre ($20.000 - $60.000 COP)'],
            tips: ['Preguntar siempre respetuosamente antes de tomar fotografías a los miembros de la comunidad', 'Aportar directamente comprando artesanías familiares'],
            curious_facts: ['La fibra de chambira proviene de una palmera espinosa y se tiñe exclusivamente con raíces, frutos y barro silvestre'],
            suggested_minutes: 180,
            location_info: { address: 'Comunidad San Martín, Parque Amacayacu', priceRange: '$ - Aporte comunitario' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Retorno a Leticia y Mercado Fluvial de Tabatinga',
        notes: 'Últimas compras de especias amazónicas y regreso.',
        stops: [
          {
            stop_order: 1,
            name: 'Muelle Fluvial de Leticia y Mercado de Tabatinga',
            latitude: -4.2180,
            longitude: -69.9360,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'El muelle donde convergen lanchas, botes de carga y canoas que conectan comunidades de Perú, Brasil y Colombia. El mercado es un festín sensorial de pescados gigantes, chontaduros y fariña tostada.',
            activities: ['Comprar bombones de chocolate con acai y copoazú en Tabatinga ($15.000 - $30.000 COP)', 'Desayuno de tapioca brasileña con queso y café con leche en Tabatinga ($12.000 COP)', 'Fotografía de la confluencia fronteriza sobre el río Amazonas (Gratis)'],
            tips: ['En Tabatinga se puede pagar en pesos colombianos, reales brasileños o dólares', 'Verificar el peso del equipaje antes de dirigirse al aeropuerto Vásquez Cobo'],
            curious_facts: ['En esta triple frontera la gente habla cotidianamente el "portuñol", una mezcla fluida de español y portugués sin barreras lingüísticas'],
            suggested_minutes: 120,
            location_info: { address: 'Malecón Fluvial, Leticia', priceRange: '$ - Compras locales' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-la-gran-vuelta-a-colombia-14d',
    title: 'La Gran Vuelta a Colombia: De los Andes al Caribe Mágico',
    country: 'Colombia',
    city: 'Bogotá',
    type: 'custom',
    tourScope: 'city_to_city',
    description: 'La expedición definitiva de 14 días por Colombia. Conecta los altiplanos andinos y museos dorados de Bogotá, los aromas y palmas de cera gigantes del Eje Cafetero, la innovación urbana y arte de Medellín, la selva y mar del Parque Tayrona, y el romanticismo colonial amurallado de Cartagena.',
    cover_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 20160,
    distance_meters: 1450000,
    difficulty: 'moderate',
    rating: 4.98,
    review_count: 215,
    likes_count: 740,
    tags: ['Gran Colombia', 'Bogotá', 'Eje Cafetero', 'Medellín', 'Santa Marta', 'Cartagena', 'Mega Tour'],
    recommended_audience: ['Viajeros internacionales', 'Grandes exploradores', 'Amantes de la cultura integral'],
    best_season: 'Diciembre a Abril y Julio a Septiembre',
    recommended_schedule: 'Itinerario balanceado con traslados aéreos domésticos eficientes y jornadas libres',
    meeting_point: 'Aeropuerto Internacional El Dorado / Centro Histórico, Bogotá',
    includes: ['Itinerario completo de 14 días interconectado', 'Guía de conexiones aéreas y terrestres', 'Selección de experiencias patrimoniales'],
    excludes: ['Vuelos domésticos internos', 'Entradas a parques nacionales', 'Gastos personales'],
    recommendations: ['Empacar para dos climas: frío andino (Bogotá 10-18°C) y calor caribeño (Medellín/Costa 26-32°C)', 'Mantener copias digitales del pasaporte y seguro médico'],
    what_to_bring: ['Maleta versátil con ropa de abrigo y ropa de playa', 'Calzado de trekking y sandalias', 'Protector solar y sombrero'],
    tour_rules: ['Cumplir con las normativas locales de sostenibilidad y respeto al patrimonio'],
    budget: { currency: 'COP', estimatedPerPersonMin: 1800000, estimatedPerPersonMax: 3600000, notes: 'Vuelos internos, entradas, tours guiados y gastronomía completa' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Bienvenida en Bogotá y Museo del Oro',
        notes: 'Arribo a la capital andina y primera inmersión en la orfebrería precolombina.',
        stops: [
          {
            stop_order: 1,
            name: 'Centro Histórico y Museo del Oro',
            latitude: 4.6018,
            longitude: -74.0720,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Recorrido por la joya museográfica de Colombia con más de 34.000 piezas maestras de oro sagrado.',
            activities: ['Visita a la Balsa Muisca (Entrada: $5.000 COP)', 'Caminata por la Plaza de Bolívar (Gratis)', 'Cena de ajiaco santafereño ($32.000 COP)'],
            tips: ['Aclimatarse con calma a los 2.600 metros de altitud de Bogotá'],
            curious_facts: ['La Plaza de Bolívar ha sido testigo de los eventos republicanos más cruciales de Colombia desde 1819'],
            suggested_minutes: 150,
            location_info: { address: 'La Candelaria, Bogotá', priceRange: '$ - Entrada $5.000 COP' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Panorámica en Monserrate y Sabores Capitalinos',
        notes: 'Subida al cerro tutelar y tarde gastronómica en Chapinero.',
        stops: [
          {
            stop_order: 1,
            name: 'Cerro de Monserrate',
            latitude: 4.6056,
            longitude: -74.0555,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Santuario a 3.152 metros con la mejor vista panorámica de la sabana bogotana.',
            activities: ['Subida en funicular o teleférico ($27.000 COP)', 'Mirador panorámico (Gratis)', 'Café de altura con almojábana ($10.000 COP)'],
            tips: ['Subir en la mañana para evitar las lloviznas de la tarde'],
            curious_facts: ['El templo alberga una talla del siglo XVII atribuida al escultor Pedro de Lugo y Albarracín'],
            suggested_minutes: 120,
            location_info: { address: 'Monserrate, Bogotá', priceRange: '$ - Funicular' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Catedral de Sal de Zipaquirá y Vuelo al Eje Cafetero',
        notes: 'Monumento subterráneo de sal y vuelo hacia Armenia o Pereira.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral de Sal de Zipaquirá',
            latitude: 5.0190,
            longitude: -74.0090,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Templo monumental tallado en la roca salina de una mina subterránea activa.',
            activities: ['Recorrido guiado subterráneo (Entrada: ~$60.000 COP)', 'Traslado al aeropuerto El Dorado para vuelo al Quindío'],
            tips: ['Llevar abrigo ligero para la mina (14°C)'],
            curious_facts: ['Contiene 14 estaciones que representan el viacrucis talladas directamente en la sal'],
            suggested_minutes: 150,
            location_info: { address: 'Zipaquirá, Cundinamarca', priceRange: '$$ - Entrada' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Salento y Bosque de Palmas en el Valle de Cocora',
        notes: 'Senderismo entre las palmas de cera más altas del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Valle de Cocora',
            latitude: 4.6430,
            longitude: -75.4980,
            image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'],
            description: 'Paisaje de ensueño en los Andes colombianos poblado por palmas de 60 metros.',
            activities: ['Jeep Willys colectivo ($5.000 COP)', 'Caminata entre palmas ($15.000 COP)', 'Almuerzo de trucha con patacón ($35.000 COP)'],
            tips: ['Llevar calzado con buen agarre para el sendero húmedo'],
            curious_facts: ['La palma de cera era utilizada por los indígenas para extraer cera de alumbrado ceremonial'],
            suggested_minutes: 240,
            location_info: { address: 'Valle de Cocora, Salento', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Hacienda Cafetera y Traslado Panorámico a Medellín',
        notes: 'Cata de café de origen y viaje por autopista andina hacia Medellín.',
        stops: [
          {
            stop_order: 1,
            name: 'Finca Cafetera Tradicional',
            latitude: 4.6210,
            longitude: -75.5920,
            image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'],
            description: 'Recorrido por los cafetales aprendiendo el arte de la taza perfecta.',
            activities: ['Tour de café especial ($45.000 COP)', 'Degustación y cata guiada (Gratis con tour)'],
            tips: ['Comprar café recién tostado en la finca'],
            curious_facts: ['El café colombiano es suave por su altitud de cultivo y recolección manual'],
            suggested_minutes: 120,
            location_info: { address: 'Salento, Quindío', priceRange: '$$ - Tour' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Medellín: Esculturas de Botero y Metrocable Arví',
        notes: 'Cultura en el centro de Medellín y vuelo sobre las montañas.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza Botero y Metrocable',
            latitude: 6.2526,
            longitude: -75.5683,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Las 23 esculturas monumentales de Botero y el viaje en teleférico integrado.',
            activities: ['Fotos en la plaza (Gratis)', 'Entrada al Museo de Antioquia ($24.000 COP)', 'Metrocable al Parque Arví ($13.500 COP)'],
            tips: ['Disfrutar de las frutas exóticas del mercado campesino en Arví'],
            curious_facts: ['Medellín fue nombrada Ciudad Más Innovadora del Mundo por el Wall Street Journal'],
            suggested_minutes: 200,
            location_info: { address: 'Plaza Botero, Medellín', priceRange: '$ - Moderado' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Comuna 13 y Tarde en El Poblado',
        notes: 'El milagro del arte urbano en las escaleras eléctricas y noche en Provenza.',
        stops: [
          {
            stop_order: 1,
            name: 'Comuna 13 Graffitour',
            latitude: 6.2540,
            longitude: -75.6190,
            image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'],
            description: 'Recorrido por la galería al aire libre más famosa de arte urbano y resiliencia.',
            activities: ['Tour guiado con líderes locales ($40.000 COP)', 'Paleta de mango con limón ($5.000 COP)'],
            tips: ['Usar ropa ligera; hay muchas escaleras mecánicas y miradores'],
            curious_facts: ['El hip-hop salvó a cientos de jóvenes de la violencia barrial'],
            suggested_minutes: 180,
            location_info: { address: 'Comuna 13, Medellín', priceRange: '$ - Tour' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Excursión al Peñol de Guatapé y Vuelo al Caribe',
        notes: 'Subida a la roca de 740 escalones y vuelo hacia Santa Marta.',
        stops: [
          {
            stop_order: 1,
            name: 'Piedra del Peñol y Pueblo de Zócalos',
            latitude: 6.2206,
            longitude: -75.1785,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Ascenso al monolito y paseo por el pueblo más colorido de Colombia.',
            activities: ['Subida a la piedra ($25.000 COP)', 'Fotos en la Plazoleta de los Zócalos (Gratis)', 'Vuelo nocturno Medellín - Santa Marta'],
            tips: ['Tomar transporte temprano para llegar a tiempo al aeropuerto de Rionegro'],
            curious_facts: ['La represa de Guatapé produce cerca del 15% de la electricidad de Colombia'],
            suggested_minutes: 240,
            location_info: { address: 'Guatapé, Antioquia', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Santa Marta Histórica y Quinta de San Pedro Alejandrino',
        notes: 'Historia de la ciudad más antigua y descanso de Simón Bolívar.',
        stops: [
          {
            stop_order: 1,
            name: 'Quinta de San Pedro Alejandrino',
            latitude: 11.2291,
            longitude: -74.1818,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Hacienda histórica donde falleció el Libertador en 1830 rodeada de jardines botánicos.',
            activities: ['Tour histórico ($23.000 COP)', 'Atardecer en el Parque de los Novios (Gratis)'],
            tips: ['Probar la limonada de coco típica de la costa'],
            curious_facts: ['La quinta conserva el árbol de tamarindo bajo cuya sombra solía reposar Bolívar'],
            suggested_minutes: 120,
            location_info: { address: 'Santa Marta, Magdalena', priceRange: '$ - Entrada' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Senderismo y Playas Vírgenes del Parque Tayrona',
        notes: 'Caminata entre selva tropical y mar esmeralda en Cabo San Juan.',
        stops: [
          {
            stop_order: 1,
            name: 'Cabo San Juan del Guía en PNN Tayrona',
            latitude: 11.3288,
            longitude: -73.9555,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El paisaje de playa virgen más famoso de Colombia rodeado de rocas gigantes.',
            activities: ['Entrada al parque (~$35.000 / $73.500 COP)', 'Baño en La Piscina y Cabo San Juan (Gratis)', 'Almuerzo de pescado frito ($38.000 COP)'],
            tips: ['Llevar suficiente agua y comenzar el regreso a media tarde'],
            curious_facts: ['La Sierra Nevada de Santa Marta es la montaña costera más alta del mundo'],
            suggested_minutes: 300,
            location_info: { address: 'PNN Tayrona, Magdalena', priceRange: '$$ - Entrada oficial' }
          }
        ]
      },
      {
        day_number: 11,
        title: 'Día 11: Ruta Costera hacia Cartagena de Indias',
        notes: 'Viaje terrestre por el litoral caribeño y llegada a la ciudad amurallada.',
        stops: [
          {
            stop_order: 1,
            name: 'Llegada a Cartagena y Baluarte de Santo Domingo',
            latitude: 10.4228,
            longitude: -75.5539,
            image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80'],
            description: 'Primer atardecer sobre las murallas coloniales frente al mar.',
            activities: ['Cóctel al atardecer sobre las murallas ($35.000 COP)', 'Caminata nocturna por Getsemaní (Gratis)'],
            tips: ['Getsemaní es el epicentro de la música caribeña y vida nocturna'],
            curious_facts: ['Las murallas de Cartagena tienen más de 11 kilómetros de longitud conservada'],
            suggested_minutes: 120,
            location_info: { address: 'Santo Domingo, Cartagena', priceRange: '$$ - Consumos' }
          }
        ]
      },
      {
        day_number: 12,
        title: 'Día 12: Fortalezas Militares: Castillo San Felipe de Barajas',
        notes: 'Exploración de la ingeniería militar española y laberintos subterráneos.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo San Felipe de Barajas',
            latitude: 10.4230,
            longitude: -75.5385,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'La fortaleza colonial más imponente de toda América.',
            activities: ['Túneles subterráneos (Entrada: $30.000 COP)', 'Fotografía panorámica del mar y la ciudad antigua (Gratis)'],
            tips: ['Visitar a primera hora de la mañana para evitar el calor intenso'],
            curious_facts: ['La fortaleza fue construida con una mezcla de cal, arena y sangre de ganado para mayor resistencia'],
            suggested_minutes: 120,
            location_info: { address: 'Pie del Cerro, Cartagena', priceRange: '$ - Entrada $30.000 COP' }
          }
        ]
      },
      {
        day_number: 13,
        title: 'Día 13: Islas del Rosario: Arrecifes y Descanso Tropical',
        notes: 'Navegación en lancha hacia Isla Grande y aguas cristalinas.',
        stops: [
          {
            stop_order: 1,
            name: 'Isla Grande en Islas del Rosario',
            latitude: 10.1802,
            longitude: -75.7314,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Aguas cristalinas y corales vivos en el parque nacional marino.',
            activities: ['Snorkel en arrecife de coral ($50.000 COP)', 'Almuerzo de mariscos ($45.000 COP)', 'Descanso bajo las palmeras'],
            tips: ['Llevar protector solar ecológico reef-safe'],
            curious_facts: ['El parque marino protege más de 120.000 hectáreas de ecosistemas coralinos submarinos'],
            suggested_minutes: 300,
            location_info: { address: 'PNN Corales del Rosario', priceRange: '$$$ - Pasadía en lancha' }
          }
        ]
      },
      {
        day_number: 14,
        title: 'Día 14: Torre del Reloj, Compras de Esmeraldas y Despedida',
        notes: 'Últimas postales de la joya caribeña antes de tomar el vuelo internacional.',
        stops: [
          {
            stop_order: 1,
            name: 'Torre del Reloj y Las Bóvedas',
            latitude: 10.4236,
            longitude: -75.5501,
            image_url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80'],
            description: 'Despedida por los 47 arcos coloniales de Las Bóvedas y la Torre del Reloj.',
            activities: ['Comprar artesanías finas y café gourmet ($25.000 - $80.000 COP)', 'Último almuerzo caribeño de despedida ($40.000 COP)'],
            tips: ['Tomar taxi con tarifa regulada hacia el aeropuerto Rafael Núñez (15 minutos)'],
            curious_facts: ['Cartagena de Indias fue declarada Patrimonio de la Humanidad por la UNESCO en 1984'],
            suggested_minutes: 120,
            location_info: { address: 'Centro Histórico, Cartagena', priceRange: '$ - Libre' }
          }
        ]
      }
    ]
  }
]
