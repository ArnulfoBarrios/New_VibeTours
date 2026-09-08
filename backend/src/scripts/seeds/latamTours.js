// Tours 11 - 16: Latinoamérica y el Caribe (5 a 15 días)
export const latamTours = [
  {
    slug: 'vibetour-ciudad-de-mexico-teotihuacan-5d',
    title: 'Ciudad de México y Valle de los Dioses: Tenochtitlán y Arte Vivo',
    country: 'México',
    city: 'Ciudad de México',
    type: 'cultural',
    tourScope: 'single_city',
    description: 'Inmersión cultural de 5 días en la metrópoli más antigua de América. Desde las ruinas del Templo Mayor azteca y los colosales murales de Diego Rivera, hasta las pirámides prehispánicas de Teotihuacán y el bohemio barrio de Frida Kahlo en Coyoacán.',
    cover_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 95000,
    difficulty: 'easy',
    rating: 4.94,
    review_count: 165,
    likes_count: 490,
    tags: ['México', 'CDMX', 'Teotihuacán', 'Coyoacán', 'Frida Kahlo', 'Cultural', 'Muralismo'],
    recommended_audience: ['Viajeros culturales', 'Amantes del arte', 'Foodies'],
    best_season: 'Octubre a Abril (menos lluvias y agradable temperatura)',
    recommended_schedule: 'Museos y pirámides por la mañana, tardes gastronómicas en la Roma y Condesa',
    meeting_point: 'Zócalo Capitalino (Plaza de la Constitución), CDMX',
    includes: ['Itinerario arqueológico detallado', 'Guía de transporte Metro y Metrobús', 'Recomendación de taquerías tradicionales de autor'],
    excludes: ['Boleto a Museo Frida Kahlo (reserva digital obligatoria previa)', 'Acceso a Teotihuacán', 'Consumos personales'],
    recommendations: ['Comprar las entradas al Museo Frida Kahlo por internet con al menos dos semanas de anticipación', 'Llevar sombrero para la zona arqueológica de Teotihuacán'],
    what_to_bring: ['Calzado cómodo para caminar', 'Chaqueta ligera para la noche', 'Protector solar', 'Efectivo en pesos mexicanos'],
    tour_rules: ['Prohibido subir a las pirámides del Sol y la Luna para preservación arqueológica'],
    budget: { currency: 'MXN', estimatedPerPersonMin: 2200, estimatedPerPersonMax: 4800, notes: 'Entradas a museos, transporte público / Didi y gastronomía mexicana' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: El Corazón Azteca y Virreinal: Zócalo y Templo Mayor',
        notes: 'Exploración de la plaza central, la Catedral Metropolitana y los cimientos de Tenochtitlán.',
        stops: [
          {
            stop_order: 1,
            name: 'Zócalo, Catedral Metropolitana y Templo Mayor',
            latitude: 19.4326,
            longitude: -99.1332,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'La plaza central de México, construida sobre el centro ceremonial mexica. A un costado se erigen las ruinas excavadas del Templo Mayor y la monumental Catedral Metropolitana levantada con piedras prehispánicas.',
            activities: ['Visitar la zona arqueológica y museo del Templo Mayor (Entrada: $95 MXN)', 'Entrar a la Catedral Metropolitana y apreciar sus retablos dorados (Gratis)', 'Probar tacos al pastor con piña en taquería tradicional ($60 - $120 MXN)'],
            tips: ['Los domingos el acceso a museos del INAH es gratuito para residentes nacionales; entre semana es más tranquilo', 'No perderse la enorme escultura del monolito de Coyolxauhqui en el museo'],
            curious_facts: ['La Catedral se hunde varios centímetros cada año debido al suelo blando del antiguo lecho lacustre de Texcoco'],
            suggested_minutes: 180,
            location_info: { address: 'Plaza de la Constitución S/N, Centro Histórico', priceRange: '$ - Museo $95 MXN' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Las Colosales Pirámides de Teotihuacán',
        notes: 'Viaje a la Ciudad de los Dioses: Pirámide del Sol, de la Luna y Calzada de los Muertos.',
        stops: [
          {
            stop_order: 1,
            name: 'Zona Arqueológica de Teotihuacán',
            latitude: 19.6925,
            longitude: -98.8438,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Uno de los complejos arqueológicos más impresionantes de la humanidad. La Calzada de los Muertos conecta la monumental Pirámide del Sol (65 metros de altura) con la Pirámide de la Luna y el Templo de la Serpiente Emplumada.',
            activities: ['Recorrido por la Calzada de los Muertos (Entrada general INAH: $95 MXN)', 'Visita al Palacio de Quetzalpapálotl con murales originales (Gratis con entrada)', 'Almorzar dentro de una cueva volcánica en el restaurante La Gruta ($450 - $800 MXN)'],
            tips: ['Tomar el autobús desde la Terminal de Autobuses del Norte (Autobuses Teotihuacán: $120 MXN ida y vuelta)', 'Llegar a las 8:30 AM cuando abren para evitar el sol abrasador del mediodía'],
            curious_facts: ['Cuando los aztecas encontraron Teotihuacán en el siglo XIV, la ciudad ya llevaba más de 600 años abandonada y la creyeron obra de gigantes'],
            suggested_minutes: 240,
            location_info: { address: 'San Juan Teotihuacán, Estado de México', priceRange: '$$ - Entrada oficial + transporte' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Bellas Artes, Alameda y Murales de Diego Rivera',
        notes: 'El esplendor del mármol de Carrara y la historia de México contada en murales.',
        stops: [
          {
            stop_order: 1,
            name: 'Palacio de Bellas Artes y Museo Mural Diego Rivera',
            latitude: 19.4352,
            longitude: -99.1412,
            image_url: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra cumbre de la arquitectura Art Nouveau y Art Déco en México revestida en mármol blanco. Custodia los murales históricos de Diego Rivera, David Alfaro Siqueiros y José Clemente Orozco.',
            activities: ['Contemplar el mural "El hombre controlador del universo" de Rivera (Entrada museo: $90 MXN)', 'Subir a la cafetería del Sears frente al palacio para la mejor foto aérea (Consumo de café: $60 MXN)', 'Caminar por la arbolada Alameda Central con sus fuentes barrocas (Gratis)'],
            tips: ['La cortina del teatro de Bellas Artes está hecha con cerca de un millón de piezas de cristal por Tiffany de Nueva York', 'Comprar churros calientes con chocolate en la legendaria Churrería El Moro ($70 MXN)'],
            curious_facts: ['Diego Rivera recreó aquí el famoso mural que Nelson Rockefeller ordenó destruir en el Rockefeller Center de Nueva York por incluir el rostro de Lenin'],
            suggested_minutes: 150,
            location_info: { address: 'Avenida Juárez S/N, Centro Histórico', priceRange: '$ - Entrada $90 MXN' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Coyoacán Bohemio y la Casa Azul de Frida Kahlo',
        notes: 'Calles empedradas virreinales, aroma a café tostado y la intimidad de Frida.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo Frida Kahlo (Casa Azul) y Plaza Hidalgo',
            latitude: 19.3551,
            longitude: -99.1626,
            image_url: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80'],
            description: 'La casona azul cobalto donde nació, vivió y murió la célebre pintora mexicana. Exhibe sus lienzos, su caballete sobre la silla de ruedas, vestimentas tehuánas originales y su jardín lleno de flora tropical e ídolos prehispánicos.',
            activities: ['Recorrido por las habitaciones y el estudio de arte de Frida (Entrada general extranjero: ~$320 MXN / nacional: ~$130 MXN)', 'Paseo por la Plaza Hidalgo y el Jardín Centenario en Coyoacán (Gratis)', 'Degustar tostadas de tinga y aguas frescas en el Mercado de Coyoacán ($80 - $140 MXN)'],
            tips: ['No venden boletos en taquilla física; es estrictamente necesario reservar en línea con horario asignado', 'El permiso para tomar fotografías sin flash dentro de la casa cuesta $30 MXN adicionales'],
            curious_facts: ['La urna con las cenizas de Frida Kahlo reposa en su dormitorio principal dentro de una figura de barro en forma de sapo'],
            suggested_minutes: 180,
            location_info: { address: 'Londres 247, Del Carmen, Coyoacán', priceRange: '$$ - Entrada $320 MXN' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Bosque y Castillo de Chapultepec y Museo de Antropología',
        notes: 'El único castillo real de América y la colección antropológica más valiosa del continente.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Chapultepec y Museo Nacional de Antropología',
            latitude: 19.4204,
            longitude: -99.1819,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Suntuoso palacio neoclásico que albergó al emperador Maximiliano de Habsburgo y a los presidentes mexicanos. A unos pasos, el Museo Nacional de Antropología custodia maravillas mundiales como la colosal Piedra del Sol azteca y las cabezas olmecas.',
            activities: ['Visitar los salones imperiales y jardines colgantes del Castillo (Entrada: $95 MXN)', 'Asombrarse ante el monolito de la Piedra del Sol azteca en el Museo de Antropología (Entrada: $95 MXN)', 'Caminar bajo el enorme paraguas de agua del patio central del museo'],
            tips: ['El Museo de Antropología es inmenso; dedicar al menos 2 horas a las salas Mexica y Maya', 'Cierra los lunes; planear la visita de martes a domingo'],
            curious_facts: ['Chapultepec es el parque urbano más antiguo de América, con ahuehuetes plantados por el rey Nezahualcóyotl en el siglo XV'],
            suggested_minutes: 240,
            location_info: { address: 'Bosque de Chapultepec I Sección', priceRange: '$$ - Entradas combinadas $190 MXN' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-cusco-valle-sagrado-machu-picchu-6d',
    title: 'Cusco Sagrado y Machu Picchu: El Corazón del Imperio Inca',
    country: 'Perú',
    city: 'Cusco',
    type: 'historical',
    tourScope: 'micro_destination',
    description: 'Expedición de 6 días por la capital imperial del Tahuantinsuyo. Murallas ciclópeas en Sacsayhuamán, mercados andinos y terrazas agrícolas en el Valle Sagrado, y la llegada cumbre en tren escénico a la ciudadela sagrada de Machu Picchu entre las nubes.',
    cover_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 8640,
    distance_meters: 210000,
    difficulty: 'moderate',
    rating: 4.99,
    review_count: 240,
    likes_count: 820,
    tags: ['Perú', 'Cusco', 'Machu Picchu', 'Valle Sagrado', 'Inca', 'Arqueología', 'Maravilla del Mundo'],
    recommended_audience: ['Amantes de la historia', 'Senderistas', 'Exploradores del mundo'],
    best_season: 'Mayo a Octubre (temporada seca con cielos azules despejados)',
    recommended_schedule: 'Madrugar para los circuitos arqueológicos y aclimatación suave el primer día',
    meeting_point: 'Plaza de Armas del Cusco, frente a la Fuente del Inca',
    includes: ['Ruta arqueológica georreferenciada', 'Información de circuitos oficiales de Machu Picchu', 'Puntos estratégicos para aclimatación a la altura'],
    excludes: ['Boleto Turístico del Cusco (BTC)', 'Boleto oficial Machu Picchu', 'Tren escénico Inca Rail / PeruRail'],
    recommendations: ['El primer día tomar té de coca y no hacer esfuerzos físicos bruscos (Cusco está a 3.400 msnm)', 'Comprar con meses de anticipación el boleto a Machu Picchu por la alta demanda'],
    what_to_bring: ['Pasaporte original (obligatorio para ingresar a Machu Picchu)', 'Ropa por capas (frío por la mañana/noche y sol fuerte de mediodía)', 'Zapatos de trekking cómodos', 'Pastillas para el soroche (mal de altura)'],
    tour_rules: ['Prohibido el uso de trípodes profesionales, drones y bastones con punta metálica en la ciudadela'],
    budget: { currency: 'USD', estimatedPerPersonMin: 450, estimatedPerPersonMax: 850, notes: 'BTC (~$35 USD), boleto Machu Picchu (~$41 USD), tren ida/vuelta (~$140 USD) y bus Consettur (~$24 USD)' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Aclimatación en Cusco: Plaza de Armas y Piedra de los 12 Ángulos',
        notes: 'Caminata lenta por el ombligo del mundo andino y arquitectura lítica inca.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de Armas y Qorikancha (Templo del Sol)',
            latitude: -13.5167,
            longitude: -71.9788,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'El centro neurálgico del imperio incaico. El Qorikancha era el santuario más reverenciado del Sol, sobre cuyos muros de piedra pulida milimétricamente los españoles levantaron el Convento de Santo Domingo.',
            activities: ['Visitar los recintos incas de piedra pulida dentro del Qorikancha (Entrada: 15 PEN / ~$4 USD)', 'Tocar con respeto la célebre Piedra de los 12 Ángulos en la calle Hatun Rumiyoc (Gratis)', 'Tomar té de muña o coca en una cafetería colonial de la plaza (8 PEN / ~$2 USD)'],
            tips: ['Caminar muy despacio y comer ligero durante las primeras 24 horas para evitar el soroche', 'No apoyarse bruscamente sobre las piedras incas patrimoniales'],
            curious_facts: ['Los muros del Qorikancha estaban originalmente recubiertos de planchas de oro macizo que fueron arrancadas para pagar el rescate del inca Atahualpa'],
            suggested_minutes: 150,
            location_info: { address: 'Avenida El Sol con Calle Santo Domingo, Cusco', priceRange: '$ - Entrada 15 PEN' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: La Fortaleza Colosal de Sacsayhuamán',
        notes: 'Bloques de piedra ciclópeos de más de 120 toneladas encajados a la perfección.',
        stops: [
          {
            stop_order: 1,
            name: 'Complejo Arqueológico de Sacsayhuamán',
            latitude: -13.5048,
            longitude: -71.9818,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Fortaleza ceremonial inca situada en una colina que domina Cusco. Sus murallas zigzagueantes están formadas por megalitos de piedra caliza labrada, algunos con más de 5 metros de alto y 128 toneladas de peso.',
            activities: ['Recorrido por las murallas megalíticas con el Boleto Turístico BTC (Boleto Turístico Parcial: 70 PEN / Integral: 130 PEN)', 'Deslizarse por las formaciones de rodaderos naturales de Suchuna (Gratis)', 'Fotografía de la vista panorámica de la ciudad de Cusco en forma de puma (Gratis)'],
            tips: ['Se puede subir en taxi desde la Plaza de Armas por 10 PEN o en caminata empinada de 25 minutos', 'Llevar sombrero de ala ancha y bloqueador solar'],
            curious_facts: ['Cada 24 de junio se escenifica en su explanada principal el milenario Inti Raymi (Fiesta del Sol)'],
            suggested_minutes: 180,
            location_info: { address: 'Sacsayhuamán, Cusco', priceRange: '$$ - Incluido en Boleto Turístico' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Valle Sagrado: Písac y las Terrazas Agrícolas',
        notes: 'Andenerías colgadas sobre el río Urubamba y mercado tradicional andino.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Arqueológico y Mercado de Písac',
            latitude: -13.4210,
            longitude: -71.8490,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'Ciudadela inca en lo alto de un espolón rocoso con cientos de terrazas agrícolas andinas y el mayor cementerio prehispánico conocido de Sudamérica. En el pueblo, su mercado artesanal estalla de colores textiles.',
            activities: ['Caminar entre los recintos militares y el reloj solar Intihuatana de Písac (Incluido en Boleto Turístico)', 'Comprar chompas de alpaca y platería en el mercado dominical (40 - 150 PEN)', 'Probar empanadas calientes recién horneadas en los hornos de barro coloniales (5 PEN)'],
            tips: ['El Valle Sagrado se encuentra a 2.800 msnm (600 metros más bajo que Cusco), lo que facilita respirar mejor'],
            curious_facts: ['Las andenerías agrícolas incas no solo evitaban la erosión de las laderas, sino que sus piedras absorbían el calor diurno para irradiarlo de noche contra las heladas'],
            suggested_minutes: 200,
            location_info: { address: 'Písac, Valle Sagrado', priceRange: '$$ - Boleto Turístico' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Fortaleza de Ollantaytambo y Tren hacia Aguas Calientes',
        notes: 'El pueblo inca viviente y viaje en tren panorámico a la selva alta.',
        stops: [
          {
            stop_order: 1,
            name: 'Fortaleza de Ollantaytambo y Estación de Tren',
            latitude: -13.2580,
            longitude: -72.2630,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Colosal bastión militar y religioso donde los incas derrotaron a los conquistadores españoles en 1537. Sus terrazas ciclópeas custodian el inconcluso Templo del Sol. El pueblo conserva el trazado urbano original inca.',
            activities: ['Subir las escalinatas de piedra hacia los seis monolitos gigantes de pórfido rosa (Boleto Turístico)', 'Abordar el tren escénico con techos panorámicos hacia Aguas Calientes (~$70 - $90 USD)', 'Cena andina en Aguas Calientes (lomo saltado con cerveza cusqueña: 40 - 65 PEN)'],
            tips: ['El equipaje grande se deja en el hotel de Cusco; al tren solo se permite subir con mochila de mano de hasta 5 kilos', 'Apreciar cómo el paisaje cambia de cordillera árida a selva tropical exuberante durante el trayecto en tren'],
            curious_facts: ['Ollantaytambo es la única ciudad inca que ha permanecido continuamente habitada por los mismos linajes desde el siglo XV'],
            suggested_minutes: 240,
            location_info: { address: 'Ollantaytambo, Valle Sagrado', priceRange: '$$$ - Tren a Machu Picchu' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: La Maravilla del Mundo: Santuario Sagrado de Machu Picchu',
        notes: 'Amanecer entre la niebla en la ciudadela de piedra más famosa de la Tierra.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario Histórico de Machu Picchu',
            latitude: -13.1631,
            longitude: -72.5450,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra cumbre de la arquitectura y la ingeniería incaica encaramada a 2.430 metros de altura en una cresta montañosa entre los picos Machu Picchu y Huayna Picchu. Descubierta científicamente para el mundo por Hiram Bingham en 1911.',
            activities: ['Recorrido guiado de 2.5 horas por el Circuito clásico: Casa del Guardián, Templo del Sol y Plaza Sagrada (Entrada oficial: 152 PEN / ~$41 USD)', 'Subida en autobús ecológico Consettur desde Aguas Calientes ($24 USD ida y vuelta)', 'Fotografía icónica de postal clásica frente al Huayna Picchu (Gratis con entrada)'],
            tips: ['Es obligatorio ingresar acompañado de un guía oficial colegiado en el primer ingreso', 'Llevar el pasaporte original físicamente en mano; hay un sello conmemorativo de Machu Picchu en la salida'],
            curious_facts: ['La ciudadela está construida con un sistema antisísmico de piedras machihembradas sin argamasa que rebotan y vuelven a su lugar durante los terremotos'],
            suggested_minutes: 300,
            location_info: { address: 'Santuario Histórico de Machu Picchu, Cusco', priceRange: '$$$ - Entrada oficial + tren' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Barrio de San Blas y Mercado San Pedro en Cusco',
        notes: 'El barrio de los artesanos tradicionales y despedida gastronómica.',
        stops: [
          {
            stop_order: 1,
            name: 'Barrio de San Blas y Mercado Central de San Pedro',
            latitude: -13.5180,
            longitude: -71.9825,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Barrio bohemio en cuesta empinada conocido como el barrio de los escultores y talladores (familia Mendívil). Luego, el bullicioso mercado de San Pedro diseñado por Gustave Eiffel, repleto de frutas andinas, quesos y remedios chamánicos.',
            activities: ['Caminar por las callejuelas estrechas y talleres de imaginería de San Blas (Gratis)', 'Desayunar jugo fresco de lúcuma o chirimoya en el Mercado San Pedro (6 - 10 PEN)', 'Últimas compras de chocolate amargo cusqueño de Quillabamba y sal de Maras (15 - 30 PEN)'],
            tips: ['Tomar un mate de coca antes del traslado al aeropuerto Alejandro Velasco Astete'],
            curious_facts: ['El mercado de San Pedro fue inaugurado en 1925 y su estructura de vigas de hierro fue diseñada en los talleres franceses de Eiffel'],
            suggested_minutes: 150,
            location_info: { address: 'Calle Tupac Yupanqui, Cusco', priceRange: '$ - Acceso libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-costa-rica-pura-vida-7d',
    title: 'Costa Rica Pura Vida: Volcanes, Bosque Nuboso y Playas',
    country: 'Costa Rica',
    city: 'San José',
    type: 'ecological',
    tourScope: 'micro_destination',
    description: 'Aventura ecológica de 7 días por el país líder en biodiversidad y sostenibilidad. Conoce el imponente cono perfecto del Volcán Arenal, camina sobre puentes colgantes en las copas de los árboles de Monteverde y sumérgete en las aguas esmeralda del Parque Nacional Manuel Antonio.',
    cover_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 10080,
    distance_meters: 380000,
    difficulty: 'moderate',
    rating: 4.96,
    review_count: 142,
    likes_count: 480,
    tags: ['Costa Rica', 'Arenal', 'Monteverde', 'Manuel Antonio', 'Ecológico', 'Pura Vida', 'Naturaleza'],
    recommended_audience: ['Ecoturistas', 'Familias activas', 'Amantes de la fauna'],
    best_season: 'Diciembre a Abril (temporada seca con senderos firmes)',
    recommended_schedule: 'Tours de observación de aves y monos a primera hora del día (6:00 AM)',
    meeting_point: 'Teatro Nacional de Costa Rica, San José',
    includes: ['Ruta completa de parques nacionales', 'Guía de observación de perezosos y tucanes', 'Ubicación de termales naturales'],
    excludes: ['Boletos oficiales SINAC a parques nacionales', 'Alquiler de coche o transfers interprovinciales'],
    recommendations: ['Comprar las entradas al Parque Nacional Manuel Antonio exclusivamente por el portal web del SINAC con antelación', 'Llevar prismáticos o binoculares para avistar fauna en el dosel'],
    what_to_bring: ['Chaqueta impermeable ligera', 'Botas de senderismo transpirables', 'Traje de baño', 'Bolsa seca'],
    tour_rules: ['Prohibido ingresar alimentos al Parque Manuel Antonio para no alimentar a los monos capuchinos'],
    budget: { currency: 'USD', estimatedPerPersonMin: 480, estimatedPerPersonMax: 950, notes: 'Entradas SINAC, termales de La Fortuna, puentes colgantes y comidas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: San José: Teatro Nacional y Valle Central',
        notes: 'Bienvenida cultural y arquitectura cafetalera del siglo XIX.',
        stops: [
          {
            stop_order: 1,
            name: 'Teatro Nacional de Costa Rica y Barrio Amón',
            latitude: 9.9333,
            longitude: -84.0772,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Joya arquitectónica de 1897 construida con impuestos voluntarios que se autoimpusieron los barones del café. Mármol italiano, pinturas de estilo parisino y el histórico Barrio Amón con sus casonas victorianas de madera.',
            activities: ['Tour guiado por el foyer y sala principal del teatro ($12 USD)', 'Tomar un café chorreado tradicional con pastel de maracuyá en la cafetería del teatro ($6 USD)', 'Paseo por las galerías de arte de Barrio Amón (Gratis)'],
            tips: ['Excelente punto de inicio para descansar tras el vuelo internacional'],
            curious_facts: ['La célebre pintura del techo "Alegoría al café y al banano" muestra a un hombre sosteniendo un racimo de plátanos al revés, pues el artista italiano nunca había visto un banano en planta real'],
            suggested_minutes: 120,
            location_info: { address: 'Avenida 2, Calle 1, San José', priceRange: '$ - Tour $12 USD' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Imponente Volcán Arenal y La Fortuna',
        notes: 'Llegada a las faldas del cono volcánico y senderos de lava.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Nacional Volcán Arenal',
            latitude: 10.4620,
            longitude: -84.7030,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Estratovolcán activo de silueta cónica casi perfecta que se eleva a 1.670 metros sobre los bosques tropicales de La Fortuna. Los senderos cruzan las coladas de lava solidificada de la histórica erupción de 1968.',
            activities: ['Caminata por el Sendero Colada 1968 con vista directa al cráter (Entrada: $15 USD)', 'Avistamiento de tucanes pico iris y pizotes (coatíes) silvestres (Gratis con entrada)', 'Probar el casado costarricense en una soda tradicional ($8 - $12 USD)'],
            tips: ['Llevar agua y poncho impermeable; las nubes volcánicas pueden dejar lloviznas rápidas', 'El trayecto desde San José toma unas 3 horas por carretera escénica'],
            curious_facts: ['El volcán permaneció dormido durante más de 400 años hasta que despertó súbitamente en julio de 1968 creando tres nuevos cráteres'],
            suggested_minutes: 180,
            location_info: { address: 'La Fortuna de San Carlos, Alajuela', priceRange: '$$ - Entrada $15 USD' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Aguas Termales Volcánicas y Catarata La Fortuna',
        notes: 'Río de aguas termales calientes en la selva y cascada de 70 metros.',
        stops: [
          {
            stop_order: 1,
            name: 'Catarata La Fortuna y Termales del Río Tabacón',
            latitude: 10.4430,
            longitude: -84.6720,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Espectacular caída de agua pura de 70 metros que desciende al fondo de un cañón esmeralda. Por la tarde, relajación en las aguas termales minerales calentadas naturalmente por el magma del Arenal.',
            activities: ['Descender los 500 escalones hacia la poza cristalina de la catarata (Entrada: $18 USD)', 'Baño en el río termal público Chollín (Gratis) o balneario termal privado ($40 - $85 USD)', 'Cena típica en La Fortuna con batido de guanábana ($15 - $25 USD)'],
            tips: ['Llevar calzado de agua para caminar sobre las piedras del río termal'],
            curious_facts: ['Las aguas termales de La Fortuna se enriquecen con minerales a más de 1.000 metros bajo tierra antes de emerger a la superficie'],
            suggested_minutes: 240,
            location_info: { address: 'La Fortuna, Alajuela', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Bosque Nuboso de Monteverde: Puentes Colgantes en el Dosel',
        notes: 'El misterioso reino de la niebla, orquídeas salvajes y quetzales.',
        stops: [
          {
            stop_order: 1,
            name: 'Reserva Biológica Bosque Nuboso Monteverde',
            latitude: 10.3015,
            longitude: -84.7920,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Santuario a 1.400 metros sobre el nivel del mar donde las nubes se condensan continuamente sobre los árboles. Alberga el 2.5% de toda la biodiversidad del planeta, con más de 500 especies de orquídeas y el hábitat del mítico quetzal resplandeciente.',
            activities: ['Caminata sobre 8 puentes colgantes suspendidos sobre la copa de los árboles (Entrada: $26 USD)', 'Tour de canopy / tirolesa más larga de Centroamérica ($50 USD opcional)', 'Visita al jardín de colibríes donde revolotean decenas a centímetros de los visitantes ($6 USD)'],
            tips: ['Monteverde es fresco y húmedo (15-20°C); llevar impermeable y chaqueta abrigada'],
            curious_facts: ['El bosque nuboso fue fundado y protegido inicialmente en la década de 1950 por un grupo de familias cuáqueras pacifistas de Alabama'],
            suggested_minutes: 240,
            location_info: { address: 'Monteverde, Puntarenas', priceRange: '$$ - Puentes colgantes $26 USD' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Ruta hacia el Pacífico: Parque Nacional Manuel Antonio',
        notes: 'Descenso hacia las costas del Pacífico central y primer baño de playa.',
        stops: [
          {
            stop_order: 1,
            name: 'Playa Espadilla Norte y Pueblo de Quepos',
            latitude: 9.3890,
            longitude: -84.1530,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Extensa playa pública de arena dorada y olas suaves bordeada por palmeras y restaurantes costeros. Excelente para descansar y ver el atardecer sobre el Pacífico.',
            activities: ['Atardecer y natación en Playa Espadilla (Gratis)', 'Ceviche tico de corvina con platanitos fritos en la orilla ($10 - $18 USD)', 'Paseo por la Marina Pez Vela en Quepos (Gratis)'],
            tips: ['Playa Espadilla es pública y no requiere boleto de entrada a diferencia del interior del parque nacional'],
            curious_facts: ['Manuel Antonio es el parque nacional más pequeño de Costa Rica, pero a su vez el más visitado por la concentración increíble de perezosos'],
            suggested_minutes: 180,
            location_info: { address: 'Manuel Antonio, Puntarenas', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Manuel Antonio: Perezosos, Monos y Playas Vírgenes',
        notes: 'Encuentro cercano con la vida silvestre entre la jungla y el mar.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Nacional Manuel Antonio: Playas Manuel Antonio y Gemelas',
            latitude: 9.3810,
            longitude: -84.1450,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El paraíso donde la jungla costera desemboca directamente en caletas de arena blanca con aguas calmas y transparentes. En los senderos es común cruzarse con perezosos de dos y tres dedos, monos capuchinos cariblancos e iguanas.',
            activities: ['Senderismo por el Sendero Punta Catedral (Entrada SINAC: $18 USD por adulto)', 'Baño de mar en la bahía protegida de Playa Manuel Antonio (Gratis con entrada)', 'Snorkel entre rocas volcánicas para ver peces loro y mantarrayas (Gratis con equipo propio)'],
            tips: ['Cierra los martes por conservación; reservar entrada online en la web del SINAC con fecha exacta', 'Cuidar las mochilas en la arena: los monos capuchinos y mapaches saben abrir cremalleras para buscar comida'],
            curious_facts: ['Punta Catedral era antiguamente una isla que quedó unida a tierra firme por una barra de arena formando un tómbolo geológico perfecto'],
            suggested_minutes: 300,
            location_info: { address: 'Parque Nacional Manuel Antonio', priceRange: '$$ - Entrada $18 USD' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Puente de Tárcoles (Cocodrilos Gigantes) y Retorno',
        notes: 'Avistamiento de cocodrilos de 4 metros y regreso al aeropuerto.',
        stops: [
          {
            stop_order: 1,
            name: 'Puente del Río Tárcoles y Retorno a San José',
            latitude: 9.8005,
            longitude: -84.6060,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Parada clásica en la carretera Costanera sobre el río Tárcoles. Desde la pasarela peatonal del puente se pueden observar decenas de gigantescos cocodrilos americanos soleándose en las playas de lodo.',
            activities: ['Avistamiento seguro de cocodrilos desde lo alto del puente (Gratis)', 'Comprar café gourmet costarricense (Tarrazú) en las tiendas artesanales ($8 - $15 USD)', 'Almuerzo de gallo pinto tradicional antes de llegar al aeropuerto Juan Santamaría ($10 USD)'],
            tips: ['El puente tiene acera protegida con baranda peatonal; mantenerse siempre detrás de ella'],
            curious_facts: ['El río Tárcoles alberga una de las poblaciones de cocodrilo americano (*Crocodylus acutus*) más densas del mundo'],
            suggested_minutes: 90,
            location_info: { address: 'Puente Río Tárcoles, Garabito', priceRange: '$ - Parada libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-ruta-maya-yucatan-8d',
    title: 'Ruta Maya de Yucatán: Chichén Itzá, Cenotes y Tulum',
    country: 'México',
    city: 'Mérida',
    type: 'cultural',
    tourScope: 'coastal_islands',
    description: 'Circuito de 8 días que une el mundo misterioso de los mayas en Chichén Itzá y Uxmal, el baño sagrado en cenotes de aguas cristalinas bajo cavernas milenarias, la elegancia colonial de Mérida y las ruinas fortificadas de Tulum frente al mar Caribe turquesa.',
    cover_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 11520,
    distance_meters: 520000,
    difficulty: 'easy',
    rating: 4.97,
    review_count: 180,
    likes_count: 610,
    tags: ['México', 'Yucatán', 'Chichén Itzá', 'Cenotes', 'Mérida', 'Tulum', 'Ruta Maya'],
    recommended_audience: ['Viajeros culturales', 'Amantes de la arqueología', 'Familias'],
    best_season: 'Noviembre a Abril (clima templado y menos humedad en selva)',
    recommended_schedule: 'Zonas arqueológicas a las 8:00 AM y cenotes al mediodía para refrescarse',
    meeting_point: 'Plaza Grande de Mérida, Yucatán',
    includes: ['Ruta completa de ciudades mayas', 'Ubicación de cenotes abiertos y semi-caverna', 'Itinerario de gastronomía yucateca'],
    excludes: ['Boletos INAH + CULTUR a Chichén Itzá', 'Entradas a cenotes comunitarios', 'Alquiler de coche'],
    recommendations: ['No usar bloqueador solar ni repelente químico antes de nadar en los cenotes para proteger el acuífero', 'Llevar calzado para agua (aquashoes)'],
    what_to_bring: ['Ropa fresca de lino o algodón', 'Traje de baño', 'Gorra o sombrero', 'Gafas de snorkel'],
    tour_rules: ['Prohibido tocar estucos o pinturas murales mayas'],
    budget: { currency: 'MXN', estimatedPerPersonMin: 4500, estimatedPerPersonMax: 9500, notes: 'Chichén Itzá (~$614 MXN), cenotes (~$150-$250 MXN c/u), Tulum (~$95 MXN) y comida yucateca' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Mérida Colonial: Paseo de Montejo y Plaza Grande',
        notes: 'La Ciudad Blanca: palacetes porfirianos y gastronomía de cochinita pibil.',
        stops: [
          {
            stop_order: 1,
            name: 'Paseo de Montejo y Plaza Grande de Mérida',
            latitude: 20.9674,
            longitude: -89.6237,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Elegante avenida inspirada en los Campos Elíseos de París flanqueada por mansiones señoriales del auge del henequén. En el centro histórico se alza la Catedral de San Ildefonso de 1598.',
            activities: ['Caminata nocturna por Paseo de Montejo y Monumento a la Patria (Gratis)', 'Cena yucateca en Museo de la Gastronomía Yucateca: cochinita pibil y panuchos ($250 - $450 MXN)', 'Probar una marquesita de queso de bola en el parque ($45 MXN)'],
            tips: ['Los domingos Paseo de Montejo se vuelve peatonal para bicicletas (Bici-ruta Mérida)'],
            curious_facts: ['Mérida fue llamada Ciudad Blanca por el encalado tradicional de sus muros coloniales y la piedra caliza que refleja la luz'],
            suggested_minutes: 150,
            location_info: { address: 'Paseo de Montejo, Mérida', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Uxmal y la Ruta Puuc: Pirámide del Adivino',
        notes: 'Arquitectura maya refinada con mosaicos de piedra dedicados a Chaac.',
        stops: [
          {
            stop_order: 1,
            name: 'Zona Arqueológica de Uxmal',
            latitude: 20.3600,
            longitude: -89.7710,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Patrimonio de la Humanidad por la UNESCO y joya del estilo arquitectónico Puuc. Destaca la Pirámide del Adivino con su inusual planta elíptica y el Cuadrángulo de las Monjas cubierto de miles de máscaras del dios de la lluvia Chaac.',
            activities: ['Recorrido guiado por el Cuadrángulo de las Monjas y Palacio del Gobernador (Entrada: ~$530 MXN total INAH+CULTUR)', 'Fotografiar los mascarones geométricos de Chaac (Gratis con entrada)', 'Visita al Museo del Chocolate Choco-Story frente a la zona arqueológica ($190 MXN)'],
            tips: ['Uxmal es mucho menos concurrida que Chichén Itzá, permitiendo apreciar los detalles en paz'],
            curious_facts: ['La leyenda maya relata que la Pirámide del Adivino fue construida en una sola noche por un enano nacido de un huevo'],
            suggested_minutes: 200,
            location_info: { address: 'Carretera Federal 261, Uxmal', priceRange: '$$ - Entrada $530 MXN' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: La Maravilla Maya: Chichén Itzá y el Templo de Kukulcán',
        notes: 'La pirámide del dios serpiente emplumada y el gran juego de pelota.',
        stops: [
          {
            stop_order: 1,
            name: 'Zona Arqueológica de Chichén Itzá',
            latitude: 20.6843,
            longitude: -88.5678,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las Nuevas 7 Maravillas del Mundo Moderno. La Pirámide de Kukulcán (El Castillo) es un monumento calendárico perfecto donde durante los equinoccios se proyecta la sombra de una serpiente ondulante descendiendo hacia la tierra.',
            activities: ['Aplaudir frente a la escalinata de El Castillo para escuchar el eco acústico que imita el canto del quetzal (Gratis)', 'Visitar el Gran Juego de Pelota, el más grande de Mesoamérica (Gratis con entrada)', 'Ver el Cenote Sagrado de los sacrificios (Gratis con entrada)'],
            tips: ['Llegar a las 8:00 AM en punto para entrar antes de que lleguen los autobuses de Cancún a las 10:30 AM', 'Costo de entrada para extranjeros: $614 MXN / nacionales: $272 MXN'],
            curious_facts: ['La pirámide cuenta con 91 escalones en cada uno de sus 4 lados, sumando con la plataforma superior exactamente 365 días del año solar maya'],
            suggested_minutes: 240,
            location_info: { address: 'Pisté, Yucatán', priceRange: '$$$ - Entrada oficial' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Cenotes Sagrados de Valladolid: Ik Kil y Suytun',
        notes: 'Baño sagrado en cavernas subterráneas iluminadas por rayos de sol.',
        stops: [
          {
            stop_order: 1,
            name: 'Cenote Ik Kil y Cenote Suytun',
            latitude: 20.6605,
            longitude: -88.5500,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Ik Kil es un cenote abierto de 60 metros de diámetro rodeado de lianas colgantes que caen 26 metros hacia aguas de color azul cobalto. Suytun es una caverna subterránea con una pasarela circular de piedra bajo un haz de luz cenital místico.',
            activities: ['Nadar en las aguas frescas del cenote Ik Kil (Entrada: $180 MXN con chaleco)', 'Fotografía en la plataforma central de Cenote Suytun ($200 MXN)', 'Paseo por el zócalo de Valladolid colonial y cata de marquesitas ($50 MXN)'],
            tips: ['Obligatorio ducharse antes de ingresar al cenote para no contaminar el agua con lociones o cremas'],
            curious_facts: ['Para los sacerdotes mayas los cenotes eran el *Xibalbá*, el portal sagrado hacia el inframundo'],
            suggested_minutes: 210,
            location_info: { address: 'Valladolid, Yucatán', priceRange: '$$ - Entradas cenotes' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Ciudad Amarilla de Izamal y Convento Franciscano',
        notes: 'Pueblo mágico pintado completamente de amarillo ocre y pirámide Kinich Kakmó.',
        stops: [
          {
            stop_order: 1,
            name: 'Convento de San Antonio de Padua y Pirámide Kinich Kakmó',
            latitude: 20.9320,
            longitude: -89.0190,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Conocida como la Ciudad de las Tres Culturas. Cada casa, tienda y fachada está pintada de amarillo brillante y blanco. Su convento cuenta con el segundo atrio cerrado más grande del mundo después de la Plaza de San Pedro en el Vaticano.',
            activities: ['Subir a la pirámide maya Kinich Kakmó en medio del pueblo (Entrada libre INAH)', 'Caminar por el atrio monumental del convento de 1561 (Gratis)', 'Almorzar sopa de lima y poc chuc en el restaurante Kinich ($250 - $400 MXN)'],
            tips: ['Hacer un paseo en calesa tirada por caballo para recorrer las calles amarillas ($200 MXN)'],
            curious_facts: ['El pueblo se pintó de amarillo en 1993 en honor a los colores pontificios del Vaticano con motivo de la visita del Papa Juan Pablo II'],
            suggested_minutes: 180,
            location_info: { address: 'Izamal, Yucatán', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Hacia el Caribe: Cobá en Bicicleta y Selva Alta',
        notes: 'Exploración sobre dos ruedas entre la espesa selva de Quintana Roo.',
        stops: [
          {
            stop_order: 1,
            name: 'Zona Arqueológica de Cobá',
            latitude: 20.4900,
            longitude: -87.7330,
            image_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80'],
            description: 'Antigua metrópoli maya inmersa en la selva virgen conectada por una red de 50 calzadas blancas prehispánicas (*sacbés*). Custodia la pirámide Nohoch Mul de 42 metros de altura.',
            activities: ['Alquilar una bicicleta en la entrada para recorrer los sacbés de la selva ($65 MXN)', 'Entrada a la zona arqueológica de Cobá ($95 MXN)', 'Probar ceviche de caracol o camarón a orillas de la laguna de Cobá ($180 - $280 MXN)'],
            tips: ['El recorrido en bici es plano, sombreado y muy agradable entre la selva'],
            curious_facts: ['Cobá posee el sacbé (camino blanco de piedra) más largo del mundo maya, extendiéndose por más de 100 kilómetros hasta Yaxuná'],
            suggested_minutes: 180,
            location_info: { address: 'Cobá, Quintana Roo', priceRange: '$ - Entrada $95 MXN' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: La Ciudadela Amurallada de Tulum sobre el Mar Caribe',
        notes: 'La postal maya más hermosa: templos de piedra sobre acantilados y playa turquesa.',
        stops: [
          {
            stop_order: 1,
            name: 'Zona Arqueológica de Tulum',
            latitude: 20.2150,
            longitude: -87.4290,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El único puerto marítimo amurallado construido por los mayas. El Templo de El Castillo se eleva sobre un acantilado de 12 metros coronando una ensenada de arena blanca y mar Caribe color turquesa intenso.',
            activities: ['Fotografiar el Templo de los Frescos y El Castillo frente al mar (Entrada INAH: $95 MXN + acceso parque Jaguar)', 'Bajar a nadar a la playa al pie de las ruinas si el oleaje lo permite (Gratis)', 'Almuerzo de mariscos en el pueblo bohemio de Tulum ($250 - $500 MXN)'],
            tips: ['Llegar a las 8:00 AM para evitar las altas temperaturas y las largas filas turísticas', 'Llevar traje de baño puesto debajo de la ropa'],
            curious_facts: ['Su nombre original era *Zamá*, que en maya significa "amanecer", pues sus templos miran directamente hacia donde sale el sol sobre el Caribe'],
            suggested_minutes: 180,
            location_info: { address: 'Carretera Federal 307 Km 128, Tulum', priceRange: '$$ - Entrada oficial' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Reserva de la Biósfera de Sian Ka\'an y Despedida',
        notes: 'Canales de manglar cristalinos y descanso final frente al arrecife.',
        stops: [
          {
            stop_order: 1,
            name: 'Reserva de Sian Ka\'an y Laguna de Muyil',
            latitude: 20.0810,
            longitude: -87.6180,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Reserva de la Biósfera Patrimonio de la Humanidad por la UNESCO. Canales naturales abiertos en el manglar por los comerciantes mayas prehispánicos con aguas dulces transparentes donde se puede flotar río abajo con chaleco.',
            activities: ['Flotación relajante con chaleco por los canales de corriente suave de manglar ($850 - $1.200 MXN tour comunitario en lancha)', 'Subir a la torre mirador de madera sobre el dosel de la selva (Gratis con entrada)', 'Despedida caribeña antes del traslado al aeropuerto de Tulum o Cancún'],
            tips: ['La corriente del canal es lenta y tranquila; solo hay que dejarse llevar boca arriba contemplando el cielo'],
            curious_facts: ['En lengua maya Sian Ka\'an significa "Puerta del cielo" o "Lugar donde nace el cielo"'],
            suggested_minutes: 240,
            location_info: { address: 'Muyil, Reserva de Sian Ka\'an', priceRange: '$$$ - Tour de manglar' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-buenos-aires-patagonia-glaciares-9d',
    title: 'Buenos Aires Romántica y Glaciares de la Patagonia',
    country: 'Argentina',
    city: 'Buenos Aires',
    type: 'romantic',
    tourScope: 'city_to_city',
    description: 'Circuito de 9 días que combina la elegancia europea, librerías históricas, milongas de tango y bistrós de Buenos Aires con la majestuosidad de los campos de hielo patagónicos en El Calafate y el estruendo sobrecogedor del Glaciar Perito Moreno.',
    cover_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 12960,
    distance_meters: 2800000,
    difficulty: 'moderate',
    rating: 4.96,
    review_count: 155,
    likes_count: 530,
    tags: ['Argentina', 'Buenos Aires', 'Patagonia', 'Perito Moreno', 'Tango', 'Romántico', 'Glaciares'],
    recommended_audience: ['Parejas', 'Viajeros de grandes paisajes', 'Amantes de la gastronomía y vino'],
    best_season: 'Octubre a Abril (primavera y verano austral para Patagonia)',
    recommended_schedule: 'Jornadas culturales y de tango en Buenos Aires; navegaciones glaciares temprano',
    meeting_point: 'Plaza de Mayo / Casa Rosada, Buenos Aires',
    includes: ['Ruta urbana completa de Buenos Aires', 'Itinerario de pasarelas del Glaciar Perito Moreno', 'Recomendación de bodegas y cortes de carne'],
    excludes: ['Vuelo doméstico Buenos Aires - El Calafate', 'Entrada al Parque Nacional Los Glaciares', 'Minitrekking sobre el glaciar'],
    recommendations: ['Llevar ropa térmica de abrigo para la Patagonia (cortavientos, guantes y gorro)', 'Reservar la cena show de tango en San Telmo con antelación'],
    what_to_bring: ['Chaqueta impermeable de montaña', 'Ropa elegante para la noche porteña', 'Lentes de sol con protección UV alta (el reflejo del glaciar es intenso)'],
    tour_rules: ['No traspasar las barandas de seguridad en las pasarelas del glaciar'],
    budget: { currency: 'USD', estimatedPerPersonMin: 650, estimatedPerPersonMax: 1350, notes: 'Vuelo interno, entrada Los Glaciares (~$35 USD), navegación y gastronomía' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Buenos Aires Histórica: Plaza de Mayo y San Telmo',
        notes: 'Casa Rosada, arquitectura europea y calles adoquinadas tangueras.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de Mayo, Casa Rosada y San Telmo',
            latitude: -34.6083,
            longitude: -58.3712,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El corazón político de Argentina donde Eva Perón habló desde los balcones de la Casa Rosada. Hacia el sur, las calles empedradas de San Telmo albergan casas de antigüedades y parejas bailando tango al aire libre.',
            activities: ['Caminata por Plaza de Mayo y Catedral Metropolitana donde reposa San Martín (Gratis)', 'Tomar un café con medialunas en el histórico Café Tortoni de 1858 ($8 USD)', 'Paseo por la Feria de Antigüedades de Plaza Dorrego en San Telmo (Gratis)'],
            tips: ['El Café Tortoni suele tener fila en la tarde; ir sobre las 10:00 AM para entrar directo'],
            curious_facts: ['La Casa Rosada debe su color característico del siglo XIX a una mezcla de cal con sangre de buey para impermeabilizar las paredes'],
            suggested_minutes: 180,
            location_info: { address: 'Plaza de Mayo, Buenos Aires', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Recoleta Elegante y Librería El Ateneo Grand Splendid',
        notes: 'Palacios de estilo francés, la tumba de Evita y la librería más bella del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Cementerio de la Recoleta y El Ateneo Grand Splendid',
            latitude: -34.5875,
            longitude: -58.3930,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Museo escultórico al aire libre con mausoleos de mármol donde descansan presidentes y Eva Perón. Cerca se encuentra El Ateneo Grand Splendid, un antiguo teatro de 1919 convertido en una monumental librería donde el escenario es un café.',
            activities: ['Visitar el mausoleo de Eva Perón en el Cementerio de la Recoleta (Entrada turista no residente: ~$15 USD)', 'Tomar un café sobre el escenario del teatro rodeado de miles de libros ($6 USD)', 'Almorzar un bife de chorizo en una parrilla tradicional de Recoleta ($25 - $40 USD)'],
            tips: ['La librería National Geographic clasificó a El Ateneo como la librería comercial más hermosa del mundo'],
            curious_facts: ['La cúpula del Ateneo conserva los frescos originales pintados por Nazareno Orlandi en 1919 celebrando el fin de la Primera Guerra Mundial'],
            suggested_minutes: 180,
            location_info: { address: 'Avenida Santa Fe 1860, Recoleta', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: La Boca, Caminito y Noche de Tango en Puerto Madero',
        notes: 'Los conventillos de chapa pintada de colores y cena show romántica.',
        stops: [
          {
            stop_order: 1,
            name: 'Callejón Caminito en La Boca y Puerto Madero',
            latitude: -34.6395,
            longitude: -58.3625,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Museo a cielo abierto de conventillos de inmigrantes genoveses pintados con sobrantes de pintura de barcos. Al caer la noche, los modernos muelles de ladrillo de Puerto Madero acogen las mejores casas de tango.',
            activities: ['Fotografiar los conventillos de chapa y bailarines de Caminito (Gratis)', 'Cena show de tango con orquesta en vivo y vino Malbec ($70 - $110 USD)', 'Caminar por el Puente de la Mujer iluminado diseñado por Santiago Calatrava (Gratis)'],
            tips: ['En La Boca mantenerse dentro del perímetro turístico vigilado de Caminito'],
            curious_facts: ['Caminito fue transformado en museo peatonal por iniciativa del célebre pintor boquense Benito Quinquela Martín en los años 50'],
            suggested_minutes: 200,
            location_info: { address: 'Caminito, La Boca / Puerto Madero', priceRange: '$$$ - Cena Show Tango' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Vuelo a la Patagonia: El Calafate y Lago Argentino',
        notes: 'Llegada a la capital de los glaciares y cordero patagónico al asador.',
        stops: [
          {
            stop_order: 1,
            name: 'Pueblo de El Calafate y Laguna Nimez',
            latitude: -50.3380,
            longitude: -72.2640,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Acogedora villa patagónica a orillas del inmenso Lago Argentino de aguas lechosas alimentadas por el deshielo glaciar. Cuenta con una reserva natural donde habitan cientos de flamencos australes.',
            activities: ['Caminar por la Avenida del Libertador y probar chocolates artesanales (Gratis / compra $10 USD)', 'Avistamiento de flamencos patagónicos en la Reserva Laguna Nimez ($10 USD)', 'Cena tradicional de cordero patagónico al palo con copa de Pinot Noir ($30 - $45 USD)'],
            tips: ['El vuelo desde Buenos Aires a El Calafate dura 3 horas y 15 minutos'],
            curious_facts: ['La leyenda dice que quien come el fruto silvestre del calafate siempre regresa a la Patagonia'],
            suggested_minutes: 150,
            location_info: { address: 'El Calafate, Santa Cruz', priceRange: '$$ - Restaurantes' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: La Maravilla de Hielo: Glaciar Perito Moreno y Pasarelas',
        notes: 'Pared de hielo azul de 70 metros de altura y desprendimientos atronadores.',
        stops: [
          {
            stop_order: 1,
            name: 'Pasarelas del Glaciar Perito Moreno',
            latitude: -50.4950,
            longitude: -73.0500,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Uno de los espectáculos naturales más imponentes de la Tierra. Un frente glaciar de 5 kilómetros de ancho que avanza sobre el Lago Argentino con paredes de hielo de 70 metros de altura sobre el agua que crujen y se desprenden con estruendos colosales.',
            activities: ['Recorrer los 4 kilómetros de pasarelas escalonadas frente al glaciar (Entrada Parque Nacional: ~$35 USD)', 'Safaris náuticos en catamarán acercándose a 300 metros de la pared de hielo ($35 USD)', 'Escuchar en silencio los sobrecogedores estruendos de fractura del hielo milenario (Gratis)'],
            tips: ['Llevar guantes y bufanda; la brisa que emana del glaciar es gélida incluso en verano', 'El espectáculo es aún más activo en las horas de sol de la tarde cuando el deshielo genera más desprendimientos'],
            curious_facts: ['A diferencia de la mayoría de los glaciares del planeta, el Perito Moreno se encuentra en equilibrio dinámico y no retrocede'],
            suggested_minutes: 300,
            location_info: { address: 'Parque Nacional Los Glaciares, Santa Cruz', priceRange: '$$$ - Parque y navegación' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Minitrekking sobre el Hielo Glaciar',
        notes: 'Caminata con grampones sobre las grietas y lagunas azules del glaciar.',
        stops: [
          {
            stop_order: 1,
            name: 'Minitrekking sobre el Glaciar Perito Moreno',
            latitude: -50.4850,
            longitude: -73.0800,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Experiencia cumbre que permite calzarse grampones de acero y caminar directamente sobre la masa de hielo fósil, descubriendo sumideros de agua turquesa profunda, seracs y grietas translúcidas.',
            activities: ['Caminata guiada de 1.5 horas sobre el hielo con guías de montaña de alta cota ($250 - $350 USD con traslados)', 'Brindis final con whisky servido con hielo milenario recién picado del glaciar (Incluido en la excursión)', 'Almuerzo tipo picnic frente a la morrena glaciar'],
            tips: ['Requiere calzado de trekking firme para ajustar los grampones', 'Edad permitida para el minitrekking: 8 a 65 años'],
            curious_facts: ['El hielo más profundo del glaciar tiene miles de años y es tan denso que absorbe todas las longitudes de onda de la luz excepto el azul brillante'],
            suggested_minutes: 300,
            location_info: { address: 'Sector Sur, Glaciar Perito Moreno', priceRange: '$$$$ - Excursión exclusiva' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Glaciares Upsala y Spegazzini en Catamarán',
        notes: 'Navegación entre icebergs gigantes que flotan en el Lago Argentino.',
        stops: [
          {
            stop_order: 1,
            name: 'Glaciares Spegazzini y Upsala (Canal de los Témpanos)',
            latitude: -50.2100,
            longitude: -73.2800,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Navegación por los brazos norte del lago sorteando témpanos flotantes gigantescos más grandes que un edificio. El Glaciar Spegazzini posee la pared más alta del parque, elevándose a 135 metros sobre el nivel del lago.',
            activities: ['Navegación de día completo en catamarán moderno con cubierta panorámica ($120 - $160 USD)', 'Almuerzo en el refugio mirador frente al Glaciar Spegazzini ($25 USD)', 'Fotografiar los témpanos azules esculpidos por el viento y el agua'],
            tips: ['Las salidas se realizan desde Puerto Bandera, a 45 km de El Calafate'],
            curious_facts: ['El Glaciar Upsala es uno de los más extensos de Sudamérica con casi 60 kilómetros de longitud'],
            suggested_minutes: 360,
            location_info: { address: 'Puerto Bandera, Lago Argentino', priceRange: '$$$ - Navegación lacustre' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Regreso a Buenos Aires y Tarde Bohemia en Palermo',
        notes: 'Vuelo de regreso y paseo por los bosques y pasajes de diseño de Palermo Soho.',
        stops: [
          {
            stop_order: 1,
            name: 'Palermo Soho y Rosedal de Palermo',
            latitude: -34.5880,
            longitude: -58.4230,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El barrio más vanguardista de la capital argentina. Pasajes arbolados adoquinados con murales urbanos, tiendas de diseñadores independientes, cafeterías de autor y parques con miles de rosas perfumadas.',
            activities: ['Paseo por el Rosedal de Palermo y sus puentes de estilo griego (Gratis)', 'Compras de diseño y cuero argentino en Plaza Serrano ($30 - $100 USD)', 'Cena en un bodegón porteño: milanesa napolitana con papas fritas ($15 - $25 USD)'],
            tips: ['Palermo Soho es ideal para recorrer a pie sin prisa al final de la tarde'],
            curious_facts: ['El Rosedal alberga más de 18.000 rosales de 93 especies distintas en cuatro hectáreas diseñadas por el paisajista Carlos Thays'],
            suggested_minutes: 180,
            location_info: { address: 'Plaza Serrano / Parque Tres de Febrero', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Teatro Colón y Despedida Porteña',
        notes: 'Uno de los teatros líricos con mejor acústica del planeta y compras de alfajores.',
        stops: [
          {
            stop_order: 1,
            name: 'Teatro Colón y Avenida Corrientes',
            latitude: -34.6012,
            longitude: -58.3831,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Considerado por maestros como Luciano Pavarotti como el teatro con la acústica perfecta para ópera en el mundo. Su sala en herradura, palcos dorados y lámpara central de cristal de Baccarat son deslumbrantes.',
            activities: ['Visita guiada oficial por el Salón Dorado y la sala principal del Teatro Colón (Entrada: ~$25 USD)', 'Caminar por la calle de los teatros de Avenida Corrientes y el Obelisco (Gratis)', 'Comprar cajas de alfajores de dulce de leche (Havanna o Cachafaz) para llevar ($12 - $20 USD)'],
            tips: ['Reservar la visita al Teatro Colón con horario específico en su web oficial'],
            curious_facts: ['Su acústica es tan perfecta que cualquier susurro emitido desde el escenario se escucha con claridad en el último piso a 28 metros de altura'],
            suggested_minutes: 150,
            location_info: { address: 'Cerrito 628, San Nicolás, Buenos Aires', priceRange: '$$ - Visita $25 USD' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-gran-ruta-andina-peru-15d',
    title: 'La Gran Ruta Andina del Perú: Del Océano Pacífico al Lago Sagrado Titicaca',
    country: 'Perú',
    city: 'Lima',
    type: 'custom',
    tourScope: 'city_to_city',
    description: 'La expedición definitiva de 15 días por el corazón de la civilización andina. Gastronomía marina en Lima, desierto costero y lobos marinos en Paracas, la Ciudad Blanca de Arequipa y el vuelo del cóndor en el Cañón del Colca, el Cusco Imperial con Machu Picchu, y la navegación sobre las islas flotantes de totora del Lago Titicaca.',
    cover_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 21600,
    distance_meters: 1650000,
    difficulty: 'intense',
    rating: 4.99,
    review_count: 280,
    likes_count: 910,
    tags: ['Perú', 'Lima', 'Arequipa', 'Colca', 'Cusco', 'Machu Picchu', 'Lago Titicaca', 'Mega Tour'],
    recommended_audience: ['Grandes expedicionarios', 'Amantes de la arqueología', 'Fotógrafos de alta montaña'],
    best_season: 'Abril a Noviembre (cielos despejados en la sierra y menos lluvias)',
    recommended_schedule: 'Itinerario de aclimatación gradual desde el nivel del mar hasta los 3.800 metros',
    meeting_point: 'Malecón de Miraflores / Parque del Amor, Lima',
    includes: ['Ruta completa de 15 días con coordenadas GPS exactas', 'Puntos de conexión en bus turístico y tren', 'Protocolo de aclimatación al mal de altura'],
    excludes: ['Boletos turísticos regionales', 'Entrada oficial a Machu Picchu y tren', 'Vuelos internos'],
    recommendations: ['El itinerario está planificado de menor a mayor altitud (Lima 0m -> Arequipa 2.300m -> Colca 3.600m -> Cusco 3.400m -> Puno 3.800m) para una aclimatación óptima', 'Beber mate de coca y mantenerse hidratado'],
    what_to_bring: ['Ropa térmica de abrigo y cortavientos', 'Gorra para sol y gafas oscuras', 'Botas de trekking', 'Pasaporte original'],
    tour_rules: ['Respetar la cultura milenaria de las comunidades flotantes de los Uros y Taquile'],
    budget: { currency: 'USD', estimatedPerPersonMin: 1100, estimatedPerPersonMax: 2200, notes: 'Entradas arqueológicas, boleto Machu Picchu con tren, tour Colca y Lago Titicaca' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Lima: Malecón de Miraflores y Barranco Bohemio',
        notes: 'Bienvenida en la capital gastronómica de América frente al Océano Pacífico.',
        stops: [
          {
            stop_order: 1,
            name: 'Malecón de Miraflores y Puente de los Suspiros en Barranco',
            latitude: -12.1320,
            longitude: -77.0310,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Acantilados sobre la Costa Verde limeña con vista a surfistas y parapentes. Al lado, el distrito bohemio de Barranco con casonas de madera de inicios del siglo XX y el célebre Puente de los Suspiros.',
            activities: ['Caminata por el Parque del Amor con mosaicos poéticos (Gratis)', 'Cruzar el Puente de los Suspiros aguantando la respiración para pedir un deseo (Gratis)', 'Almuerzo ceviche clásico de corvina con camote glaseado y chicha morada (45 - 80 PEN)'],
            tips: ['Probar un pisco sour en las tabernas centenarias de Barranco como el Bar Juanito'],
            curious_facts: ['Lima es la única capital de Sudamérica ubicada directamente frente a la costa del océano'],
            suggested_minutes: 180,
            location_info: { address: 'Malecón Balta / Barranco, Lima', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Centro Histórico de Lima y Catacumbas de San Francisco',
        notes: 'Balcones coloniales de madera tallada y criptas subterráneas virreinales.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza Mayor y Basílica y Convento de San Francisco',
            latitude: -12.0460,
            longitude: -77.0305,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El núcleo de la Ciudad de los Reyes virreinal. El convento de San Francisco custodia una biblioteca de 25.000 libros raros y catacumbas subterráneas con osarios que albergan más de 25.000 osamentas humanas.',
            activities: ['Recorrido guiado por las catacumbas subterráneas (Entrada: 15 PEN / ~$4 USD)', 'Ver el cambio de guardia en el Palacio de Gobierno a mediodía (Gratis)', 'Probar churros rellenos de manjar blanco en la calle Lampa (5 PEN)'],
            tips: ['Las catacumbas tienen techos bajos en algunos tramos; caminar con atención'],
            curious_facts: ['Las catacumbas sirvieron como el primer cementerio público de Lima colonial hasta principios del siglo XIX'],
            suggested_minutes: 150,
            location_info: { address: 'Jirón Lampa, Centro Histórico de Lima', priceRange: '$ - Entrada 15 PEN' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Islas Ballestas y Huacachina en Ica',
        notes: 'Leones marinos, pingüinos de Humboldt y oasis en medio de dunas gigantes.',
        stops: [
          {
            stop_order: 1,
            name: 'Reserva Marina Islas Ballestas y Oasis de Huacachina',
            latitude: -13.7380,
            longitude: -76.3980,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Conocidas como las "Galápagos peruanas" por su increíble concentración de fauna marina salvaje. Más al sur, el oasis natural de Huacachina rodeado por las dunas de arena más altas de Sudamérica.',
            activities: ['Tour en lancha rápida por los arcos de piedra de las Ballestas (50 PEN / ~$14 USD + tasa marina)', 'Ver el misterioso geoglifo de El Candelabro grabado en la colina costera (Gratis con tour)', 'Paseo en buggy arenero y sandboard por las dunas de Huacachina (40 - 60 PEN)'],
            tips: ['Llevar cortavientos para la lancha; el viento marino puede ser frío en la mañana'],
            curious_facts: ['Las islas fueron la mayor fuente de riqueza del Perú en el siglo XIX por la explotación del guano de aves marinas'],
            suggested_minutes: 240,
            location_info: { address: 'Paracas / Huacachina, Ica', priceRange: '$$ - Tours combinados' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Arequipa: La Ciudad Blanca y el Volcán Misti',
        notes: 'Monumentos labrados en sillar blanco volcánico a 2.325 metros.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de Armas de Arequipa y Monasterio de Santa Catalina',
            latitude: -16.3989,
            longitude: -71.5369,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Arequipa está construida con sillar, piedra volcánica blanca extraída de las canteras del volcán Misti. El Monasterio de Santa Catalina es una ciudadela dentro de la ciudad con claustros pintados de azul y terracota.',
            activities: ['Visita guiada al interior del Monasterio de Santa Catalina (Entrada: 45 PEN / ~$12 USD)', 'Mirador de la plaza con el volcán Misti de fondo coronado de nieve (Gratis)', 'Almorzar en una picantería tradicional: rocoto relleno con pastel de papa (35 - 55 PEN)'],
            tips: ['Arequipa es la parada intermedia perfecta para aclimatarse a la altura antes del Colca y Cusco'],
            curious_facts: ['El convento de Santa Catalina funcionó como clausura absoluta durante cuatro siglos sin contacto con el mundo exterior'],
            suggested_minutes: 210,
            location_info: { address: 'Santa Catalina 301, Arequipa', priceRange: '$$ - Entrada convento' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: El Cañón del Colca: El Vuelo Solemne del Cóndor',
        notes: 'Uno de los cañones más profundos del mundo y avistamiento del ave sagrada.',
        stops: [
          {
            stop_order: 1,
            name: 'Mirador Cruz del Cóndor en el Cañón del Colca',
            latitude: -15.6110,
            longitude: -71.9050,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Abismo geológico colosal que supera los 3.200 metros de profundidad. En el mirador de la Cruz del Cóndor, las corrientes térmicas matutinas permiten ver a cóndores andinos gigantes planear a escasos metros de los visitantes.',
            activities: ['Avistamiento de cóndores andinos con envergadura de más de 3 metros (Boleto Turístico del Colca: 70 PEN)', 'Baño en los termales medicinales de La Calera en Chivay (15 PEN)', 'Fotografiar manadas de vicuñas y alpacas en la Reserva de Salinas y Aguada Blanca'],
            tips: ['Los cóndores planean entre las 8:00 AM y las 10:00 AM; madrugar desde Chivay a las 6:00 AM', 'Llevar abrigo grueso; en el mirador la mañana es helada'],
            curious_facts: ['El cóndor andino casi no aletea; aprovecha las corrientes ascendentes de aire caliente del cañón para planear durante horas enteras'],
            suggested_minutes: 240,
            location_info: { address: 'Chivay / Cabanaconde, Arequipa', priceRange: '$$ - Boleto turístico' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Ruta Panorámica hacia Cusco: Cordillera y Alpacas',
        notes: 'Viaje a través del altiplano y llegada a la capital del imperio inca.',
        stops: [
          {
            stop_order: 1,
            name: 'Mirador de los Volcanes de Patapampa (4.910 msnm) y Llegada a Cusco',
            latitude: -15.7500,
            longitude: -71.5800,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'El punto más alto de la carretera andina donde se contemplan volcanes como el Sabancaya activo y el Ampato. Al final de la tarde, descenso y llegada al valle sagrado del Cusco.',
            activities: ['Fotografía de los volcanes nevados desde el punto geodésico más alto (Gratis)', 'Hacer una apacheta (torre ritual de piedras) en ofrenda a la Pachamama (Gratis)', 'Llegada y cena reconfortante de sopa de quinua en Cusco (25 PEN)'],
            tips: ['La parada en Patapampa dura solo 15 minutos debido a la extrema altitud para no marearse'],
            curious_facts: ['En las faldas del volcán Ampato fue hallada en 1995 la Dama de Ampato (la momia Juanita), doncella inca congelada intacta'],
            suggested_minutes: 120,
            location_info: { address: 'Paso de Patapampa / Cusco', priceRange: '$ - Ruta escénica' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Cusco Monumental: Qorikancha y Sacsayhuamán',
        notes: 'La piedra de los doce ángulos y los megalitos de piedra caliza.',
        stops: [
          {
            stop_order: 1,
            name: 'Sacsayhuamán y Templo del Sol Qorikancha',
            latitude: -13.5048,
            longitude: -71.9818,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Recorrido por la arquitectura maestra del Tahuantinsuyo: megalitos ciclópeos y muros pulidos que sobrevivieron a terremotos.',
            activities: ['Muros de Sacsayhuamán (Boleto Turístico Integral: 130 PEN)', 'Qorikancha (15 PEN)', 'Piedra de los 12 Ángulos (Gratis)'],
            tips: ['Llevar calzado deportivo con buena suela para caminar en cuestas empedradas'],
            curious_facts: ['Las piedras encajan con tal precisión milimétrica que no se puede pasar una hoja de papel entre ellas'],
            suggested_minutes: 200,
            location_info: { address: 'Cusco Histórico', priceRange: '$$ - Boleto turístico' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Valle Sagrado: Mercado de Písac y Salineras de Maras',
        notes: 'Miles de pozas de sal rosada milenarias y terrazas concéntricas de Moray.',
        stops: [
          {
            stop_order: 1,
            name: 'Salineras de Maras y Terrazas de Moray',
            latitude: -13.3030,
            longitude: -72.1550,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'Maras está formado por más de 3.000 pozas de sal rosada alimentadas por un manantial hipersalino subterráneo. Moray exhibe colosales terrazas agrícolas circulares concéntricas que funcionaron como laboratorio botánico inca.',
            activities: ['Fotografiar el mosaico blanco y rosado de las Salineras de Maras (Entrada comunitaria: 20 PEN)', 'Caminar por los bordes de los cráteres agrícolas de Moray (Boleto Turístico)', 'Comprar sales gourmet con especias andinas (10 - 25 PEN)'],
            tips: ['Por razones de salubridad y conservación no se permite caminar dentro de las pozas activas de sal'],
            curious_facts: ['En Moray la diferencia de temperatura entre la terraza superior y la más profunda del fondo llega a ser de hasta 15°C creando múltiples microclimas'],
            suggested_minutes: 210,
            location_info: { address: 'Maras y Moray, Urubamba', priceRange: '$ - Entrada 20 PEN' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Fortaleza de Ollantaytambo y Tren hacia Aguas Calientes',
        notes: 'Pueblo inca viviente y viaje en tren a la puerta de Machu Picchu.',
        stops: [
          {
            stop_order: 1,
            name: 'Ollantaytambo y Tren Escénico',
            latitude: -13.2580,
            longitude: -72.2630,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'Terrazas defensivas y viaje en tren a orillas del río Urubamba hacia el pueblo de Machu Picchu.',
            activities: ['Subir a los monolitos de Ollantaytambo (Boleto Turístico)', 'Tren hacia Aguas Calientes (~$75 USD)', 'Noche en Aguas Calientes'],
            tips: ['Dejar las maletas grandes en Cusco y viajar ligero'],
            curious_facts: ['Las aguas termales de Aguas Calientes le dan el nombre al pueblo al pie del santuario'],
            suggested_minutes: 240,
            location_info: { address: 'Ollantaytambo / Aguas Calientes', priceRange: '$$$ - Tren' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: La Ciudadela Sagrada de Machu Picchu',
        notes: 'El día cumbre: amanecer y circuito completo en la joya del Tahuantinsuyo.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario Histórico de Machu Picchu',
            latitude: -13.1631,
            longitude: -72.5450,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'La maravilla mundial construida por el inca Pachacútec en el siglo XV rodeada de montañas verdes que rozan las nubes.',
            activities: ['Circuito guiado oficial por la ciudadela sagrada (Entrada: 152 PEN / ~$41 USD)', 'Subida en bus ecológico Consettur ($24 USD ida y vuelta)', 'Retorno en tren por la tarde hacia Cusco'],
            tips: ['Llevar pasaporte físico y agua en cantimplora no descartable'],
            curious_facts: ['Machu Picchu nunca fue descubierta por los conquistadores españoles, lo que permitió que sobreviviera intacta hasta el siglo XX'],
            suggested_minutes: 300,
            location_info: { address: 'Machu Picchu, Cusco', priceRange: '$$$ - Entrada oficial' }
          }
        ]
      },
      {
        day_number: 11,
        title: 'Día 11: Montaña de los 7 Colores (Vinicunca)',
        notes: 'Trekking temprano a 5.036 msnm frente al arcoíris mineral de los Andes.',
        stops: [
          {
            stop_order: 1,
            name: 'Montaña de Siete Colores Vinicunca',
            latitude: -13.8690,
            longitude: -71.3030,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'Formación geológica única donde franjas minerales de óxidos de hierro, azufre y magnesio crearon capas multicolores turquesa, dorado, rojo y fucsia.',
            activities: ['Caminata de ascenso de 1.5 horas hasta el mirador a 5.036 metros (Entrada comunitaria: 25 PEN / ~$7 USD)', 'Alquiler de caballo con arriero local si se siente cansancio (60 - 80 PEN opcional)', 'Fotografía panorámica del nevado sagrado Ausangate (Gratis)'],
            tips: ['La salida desde Cusco es a las 4:00 AM; llevar ropa muy abrigada pues en la cima hay viento helado'],
            curious_facts: ['La montaña permaneció oculta bajo capas de nieve perpetua hasta que el cambio climático derritió la cubierta helada hace apenas una década'],
            suggested_minutes: 300,
            location_info: { address: 'Cusipata / Pitumarca, Canchis', priceRange: '$$ - Excursión ~$35 USD' }
          }
        ]
      },
      {
        day_number: 12,
        title: 'Día 12: La Ruta del Sol hacia Puno: Raqch\'i y Andahuaylillas',
        notes: 'Viaje en bus turístico atravesando el paso de La Raya a 4.335 metros.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo del Dios Wiracocha en Raqch\'i y Capilla de Andahuaylillas',
            latitude: -14.1950,
            longitude: -71.3710,
            image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80'],
            description: 'La Ruta del Sol une Cusco con Puno. Visita la iglesia de San Pedro de Andahuaylillas (la "Capilla Sixtina de América") por sus frescos y pan de oro, y el colosal Templo de Raqch\'i con muros de 14 metros de adobe y piedra.',
            activities: ['Visitar la Capilla Sixtina andina de Andahuaylillas (15 PEN)', 'Recorrer las columnas del Templo de Wiracocha en Raqch\'i (15 PEN)', 'Foto en el hito de La Raya a 4.335 msnm divisando la cordillera (Gratis)'],
            tips: ['Los buses turísticos de La Ruta del Sol incluyen almuerzo buffet andino en Sicuani'],
            curious_facts: ['Wiracocha era para los incas el dios creador supremo del universo, el sol y la luna'],
            suggested_minutes: 360,
            location_info: { address: 'Ruta del Sol Cusco - Puno', priceRange: '$$ - Bus turístico con paradas' }
          }
        ]
      },
      {
        day_number: 13,
        title: 'Día 13: El Lago Sagrado Titicaca y las Islas Flotantes de los Uros',
        notes: 'Navegación a 3.812 metros sobre islas artificiales hechas de caña de totora.',
        stops: [
          {
            stop_order: 1,
            name: 'Islas Flotantes de Totora de los Uros',
            latitude: -15.8200,
            longitude: -69.9700,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El lago navegable más alto del planeta (3.812 msnm). El pueblo ancestral Uro vive sobre plataformas flotantes hechas enteramente de capas trenzadas de raíces y cañas de totora que renuevan periódicamente.',
            activities: ['Caminar sobre el suelo elástico de totora y conocer la vivienda tradicional (Tour en lancha: 40 - 70 PEN)', 'Paseo en balsa tradicional de totora llamada "Mercedes Benz del lago" (15 PEN opcional)', 'Probar el tallo dulce comestible de la totora llamado *chullo* (Gratis)'],
            tips: ['La radiación solar en el Titicaca es sumamente intensa; usar sombrero y bloqueador potente'],
            curious_facts: ['Los Uros construyeron sus islas flotantes en el lago para escapar del avance militar y los tributos de los incas'],
            suggested_minutes: 180,
            location_info: { address: 'Lago Titicaca, Bahía de Puno', priceRange: '$ - Tour comunitario' }
          }
        ]
      },
      {
        day_number: 14,
        title: 'Día 14: Isla de Taquile: Arte Textil UNESCO y Vistas al Horizonte',
        notes: 'Isla donde los hombres tejen y las tradiciones comunitarias son ley.',
        stops: [
          {
            stop_order: 1,
            name: 'Isla de Taquile y Plaza de la Comunidad',
            latitude: -15.7720,
            longitude: -69.6860,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Isla natural del lago donde la comunidad conserva un estilo de vida prehispánico comunal sin policías ni automóviles. Su arte textil fue proclamado Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad por la UNESCO.',
            activities: ['Subir los 530 escalones empedrados hasta la plaza principal con vistas al lago infinito (Gratis)', 'Apreciar el tejido manual en telar de cintura que realizan exclusivamente los varones', 'Almuerzo comunitario de trucha a la plancha con papas andinas y sopa de quinua (30 PEN)'],
            tips: ['El color y forma del gorro (*chullo*) de los hombres indica si son solteros, casados o autoridades comunales'],
            curious_facts: ['En Taquile los varones aprenden a tejer desde niños y deben tejer un chullo tan fino que pueda retener agua sin filtrarse para demostrar su maestría'],
            suggested_minutes: 240,
            location_info: { address: 'Isla Taquile, Lago Titicaca', priceRange: '$$ - Excursión lacustre' }
          }
        ]
      },
      {
        day_number: 15,
        title: 'Día 15: Necrópolis de Sillustani y Despedida Andina',
        notes: 'Torres funerarias preincas frente a la mística Laguna Umayo.',
        stops: [
          {
            stop_order: 1,
            name: 'Chullpas Funerarias de Sillustani',
            latitude: -15.7210,
            longitude: -70.1600,
            image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80'],
            description: 'Cementerio sagrado de la cultura Kolla e Inca emplazado en una península sobre la laguna Umayo. Destaca por sus *chullpas*: torres funerarias cilíndricas de piedra tallada de hasta 12 metros de altura donde eran sepultados los nobles momificados.',
            activities: ['Recorrido por las torres funerarias circulares (Entrada: 15 PEN / ~$4 USD)', 'Contemplar el silencio y las aves acuáticas de la Laguna Umayo (Gratis)', 'Traslado al aeropuerto de Juliaca para el vuelo de regreso a Lima y conexión internacional'],
            tips: ['Sillustani queda de camino entre Puno y el aeropuerto de Juliaca, lo que optimiza los traslados'],
            curious_facts: ['La entrada de cada torre funeraria apunta exactamente hacia el este, por donde nace el sol cada mañana, simbolizando el renacimiento del alma'],
            suggested_minutes: 120,
            location_info: { address: 'Laguna Umayo, Atuncolla, Puno', priceRange: '$ - Entrada 15 PEN' }
          }
        ]
      }
    ]
  }
]
