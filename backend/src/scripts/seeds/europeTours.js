// Tours 17 - 23: Europa Monumental y Romántica (6 a 12 días)
export const europeTours = [
  {
    slug: 'vibetour-ruta-romantica-baviera-6d',
    title: 'Ruta Romántica de Baviera: Castillos de Cuento y Pueblos Medievales',
    country: 'Alemania',
    city: 'Múnich',
    type: 'family',
    tourScope: 'city_to_city',
    description: 'Viaje de ensueño de 6 días por los paisajes bávaros que inspiraron los cuentos de hadas. Desde los jardines cerveceros de Múnich hasta el idílico castillo de Neuschwanstein y las murallas de Rothenburg ob der Tauber.',
    cover_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 8640,
    distance_meters: 340000,
    difficulty: 'easy',
    rating: 4.95,
    review_count: 125,
    likes_count: 420,
    tags: ['Alemania', 'Baviera', 'Neuschwanstein', 'Múnich', 'Rothenburg', 'Castillos', 'Familiar'],
    recommended_audience: ['Familias con niños', 'Parejas', 'Fotógrafos de paisajes'],
    best_season: 'Mayo a Octubre (primavera/verano verde) o Diciembre (mercados navideños)',
    recommended_schedule: 'Tours de castillos por la mañana y paseos vespertinos en centros históricos',
    meeting_point: 'Marienplatz frente al Nuevo Ayuntamiento, Múnich',
    includes: ['Ruta en coche / tren de la Romantische Straße', 'Horarios de apertura y miradores libres', 'Recomendación de posadas bávaras'],
    excludes: ['Boleto al interior del Castillo de Neuschwanstein', 'Alquiler de coche o billetes de tren Bayern Ticket'],
    recommendations: ['Reservar la entrada al castillo de Neuschwanstein con semanas de anticipación en el portal oficial', 'Llevar calzado cómodo para caminar en cuestas'],
    what_to_bring: ['Ropa abrigada por capas', 'Chubasquero o paraguas compacto', 'Cámara fotográfica'],
    tour_rules: ['Prohibido fotografiar con flash dentro de los salones reales'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 550, estimatedPerPersonMax: 1100, notes: 'Bayern Ticket tren (~€29 para grupos), entradas castillos (~€18 c/u) y gastronomía bávara' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Múnich Clásico: Marienplatz, Carrillón y Cervecerías',
        notes: 'Exploración del casco antiguo de la capital de Baviera.',
        stops: [
          {
            stop_order: 1,
            name: 'Marienplatz, Glockenspiel y Hofbräuhaus',
            latitude: 48.1371,
            longitude: 11.5754,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Plaza principal de Múnich presidida por el Neues Rathaus de estilo neogótico flamígero. Su famoso Glockenspiel hace bailar a figuras mecánicas al ritmo de campanas. A pocas cuadras se encuentra la cervecería Hofbräuhaus fundada en 1589.',
            activities: ['Ver el espectáculo mecánico del Glockenspiel a las 11:00 AM o 12:00 PM (Gratis)', 'Subir a la torre de la Iglesia de San Pedro (Alter Peter) para ver los Alpes (€5)', 'Almorzar salchichas blancas Weißwurst con pretzel y cerveza en Hofbräuhaus (€18 - €28)'],
            tips: ['Las salchichas Weißwurst se comen tradicionalmente antes de las 12:00 del mediodía'],
            curious_facts: ['Durante la construcción de la vecina catedral Frauenkirche el constructor engañó al diablo dejándolo mirar desde un punto donde no se veían ventanas ("la pisada del diablo")'],
            suggested_minutes: 180,
            location_info: { address: 'Marienplatz 1, München', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Castillo de Cuento de Hadas: Neuschwanstein en Hohenschwangau',
        notes: 'El castillo que inspiró el palacio de la Cenicienta y el logo de Walt Disney.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Neuschwanstein y Puente Marienbrücke',
            latitude: 47.5576,
            longitude: 10.7498,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Construido en lo alto de un desfiladero rocoso por el rey Luis II de Baviera ("el Rey Loco") en homenaje a las óperas de Richard Wagner. Sus torres estilizadas y salones neobizantinos inspiraron directamente el castillo de Disney.',
            activities: ['Visita guiada oficial al interior del castillo (Entrada: €17.50)', 'Cruzar el puente colgante Marienbrücke suspendido sobre la cascada Pöllat para la foto clásica (Gratis)', 'Subida escénica en carruaje de caballos o caminata de 30 minutos por el bosque (€8 carruaje)'],
            tips: ['Llegar con 1 hora de anticipación a la hora impresa en el boleto; si se pasa el minuto exacto del turno de acceso, el boleto expira automáticamente'],
            curious_facts: ['A pesar de su apariencia medieval, el castillo contaba en 1886 con calefacción central de aire caliente, inodoros con descarga automática y teléfono'],
            suggested_minutes: 240,
            location_info: { address: 'Neuschwansteinstraße 20, Schwangau', priceRange: '$$ - Entrada oficial €17.50' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Palacio de Linderhof y Monasterio de Ettal',
        notes: 'La joya rococó favorita de Luis II y los licores benedictinos de Ettal.',
        stops: [
          {
            stop_order: 1,
            name: 'Palacio de Linderhof y Abadía de Ettal',
            latitude: 47.5700,
            longitude: 10.9560,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El único palacio que Luis II vio completamente terminado. Inspirado en el Versalles de Luis XIV de Francia, cuenta con jardines en terrazas barrocas, fuentes doradas que lanzan chorros de 22 metros y la deslumbrante Gruta de Venus.',
            activities: ['Tour guiado por los salones de espejos del palacio (Entrada: €10)', 'Pasear por los jardines y ver el encendido del géiser de la fuente dorada (Gratis con entrada)', 'Comprar licor de hierbas artesanal elaborado por los monjes de la Abadía de Ettal (€14 - €25)'],
            tips: ['La Gruta de Venus puede estar en restauración; consultar disponibilidad al comprar el ticket'],
            curious_facts: ['Linderhof poseía una mesa comedor mecánica ("la mesa que se sirve sola") que bajaba por una trampilla a la cocina para que el rey no tuviera que ver a los sirvientes'],
            suggested_minutes: 180,
            location_info: { address: 'Linderhof 12, Ettal', priceRange: '$ - Entrada €10' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Rothenburg ob der Tauber: Murallas Medievales Intactas',
        notes: 'El pueblo medieval mejor conservado de Europa, calle Plönlein y Museo de Navidad.',
        stops: [
          {
            stop_order: 1,
            name: 'Plönlein y Murallas de Rothenburg ob der Tauber',
            latitude: 49.3745,
            longitude: 10.1789,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El rincón más fotografiado de Alemania: la pequeña casa de entramado de madera con dos torres medievales a los lados. Toda la ciudadela está rodeada por murallas con torres de guardia del siglo XIV totalmente transitables a pie.',
            activities: ['Caminar sobre el adarve cubierto de las murallas medievales (Gratis)', 'Entrar a la tienda de Navidad Käthe Wohlfahrt y su museo del adorno navideño (€5 museo)', 'Probar el dulce tradicional Schneeball (bola de nieve de masa frita con azúcar y canela: €4)'],
            tips: ['Hacer el recorrido nocturno con el Sereno de la Ciudad (Night Watchman Tour) en inglés o alemán a las 8:00 PM (€9)'],
            curious_facts: ['Durante la Segunda Guerra Mundial la ciudad se salvó de la destrucción total gracias a que el subsecretario de guerra estadounidense conocía la belleza histórica del pueblo y ordenó negociar la rendición'],
            suggested_minutes: 240,
            location_info: { address: 'Plönlein, Rothenburg ob der Tauber', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Wurzburgo: Residencia Barroca y Viñedos de Franconia',
        notes: 'El fin de la Ruta Romántica: el mayor fresco de techo del mundo y puente del vino.',
        stops: [
          {
            stop_order: 1,
            name: 'Residencia de Wurzburgo y Puente Viejo del Meno',
            latitude: 49.7928,
            longitude: 9.9388,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Palacio de los príncipes-obispos declarado Patrimonio Mundial por la UNESCO. Su escalera imperial luce el fresco continuo más grande del mundo pintado por Tiepolo en 1753. En el puente de piedra del siglo XV, la gente se reúne a beber vino Silvaner en copa de cristal.',
            activities: ['Admirar el fresco monumental de los cuatro continentes de Tiepolo (Entrada: €9)', 'Tomar una copa de vino blanco de Franconia de pie sobre el Puente Viejo con vista a la fortaleza Marienberg (€6)', 'Pasear por los jardines cortesanos de la Residencia (Gratis)'],
            tips: ['La botella de vino típica de Franconia tiene una forma ovalada única llamada Bocksbeutel'],
            curious_facts: ['La bóveda de la escalera sobrevivió milagrosamente a los bombardeos de 1945 gracias a la genialidad estructural del arquitecto Balthasar Neumann'],
            suggested_minutes: 180,
            location_info: { address: 'Residenzplatz 2, Würzburg', priceRange: '$ - Entrada €9' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Núremberg Imperial y Retorno a Múnich',
        notes: 'El castillo imperial sobre la roca, casa de Durero y salchichas a la leña.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo Imperial de Núremberg (Kaiserburg) y Mercado Central',
            latitude: 49.4578,
            longitude: 11.0772,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Sólida fortaleza que albergó las dietas imperiales de los emperadores del Sacro Imperio Romano Germánico. En el Hauptmarkt se alza la Fuente Hermosa (Schöner Brunnen) con su famoso anillo dorado giratorio de la suerte.',
            activities: ['Girar el anillo dorado de latón de la Schöner Brunnen para atraer la fortuna (Gratis)', 'Comer las famosas 6 o 12 Nürnberger Rostbratwürste asadas a la leña de haya con chucrut (€12 - €16)', 'Comprar el auténtico pan de especias Lebkuchen de Núremberg (€6 - €15)'],
            tips: ['El tren ICE conecta Núremberg con Múnich en solo 1 hora y 5 minutos'],
            curious_facts: ['Por ley imperial de 1356 (Bula de Oro), cada nuevo emperador electo debía celebrar su primera Dieta oficial en Núremberg'],
            suggested_minutes: 180,
            location_info: { address: 'Burg 17, Nürnberg', priceRange: '$ - Acceso libre al patio' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-paris-bohemio-castillos-loira-7d',
    title: 'París Bohemio y Castillos del Valle del Loira: Arte, Luz y Realeza',
    country: 'Francia',
    city: 'París',
    type: 'romantic',
    tourScope: 'city_to_city',
    description: 'Circuito romántico de 7 días que combina la magia de París (Montmartre, el Museo del Louvre, la Torre Eiffel iluminada y crucero por el Sena) con los suntuosos castillos renacentistas del Valle del Loira como Chenonceau sobre el agua y Chambord.',
    cover_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 10080,
    distance_meters: 460000,
    difficulty: 'easy',
    rating: 4.97,
    review_count: 198,
    likes_count: 670,
    tags: ['Francia', 'París', 'Valle del Loira', 'Chambord', 'Chenonceau', 'Romántico', 'Louvre', 'Torre Eiffel'],
    recommended_audience: ['Parejas', 'Amantes del arte y la arquitectura', 'Viajeros gourmet'],
    best_season: 'Abril a Octubre (jardines florecidos y fuentes activas)',
    recommended_schedule: 'Museos con reserva horaria matutina y cenas románticas en bistrós',
    meeting_point: 'Plaza del Trocadero, París',
    includes: ['Ruta urbana de París y circuito del Valle del Loira', 'Recomendación de trenes TGV y cruceros fluviales', 'Guía de miradores románticos'],
    excludes: ['Boletos al Museo del Louvre', 'Entradas a los castillos de Chenonceau y Chambord', 'Subida a la cima de la Torre Eiffel'],
    recommendations: ['Comprar la entrada al Louvre con hora exacta por internet; las taquillas físicas no garantizan acceso', 'Llevar candado si desea visitar puentes románticos'],
    what_to_bring: ['Ropa elegante y cómoda', 'Paraguas plegable', 'Zapatos cómodos para adoquines y gravilla de castillos'],
    tour_rules: ['Prohibido el uso de trípodes dentro de salas de museos estatales'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 650, estimatedPerPersonMax: 1300, notes: 'Louvre (~€22), Chenonceau (~€17), Chambord (~€16), TGV a Tours y gastronomía' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Montmartre Bohemio: Sacré-Cœur y Plaza de los Pintores',
        notes: 'El rincón de los artistas impresionistas y vistas panorámicas de París.',
        stops: [
          {
            stop_order: 1,
            name: 'Basílica del Sagrado Corazón y Place du Tertre',
            latitude: 48.8867,
            longitude: 2.3431,
            image_url: 'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80'],
            description: 'En la cima de la colina más alta de París. La basílica de piedra blanca de travertino domina toda la metrópoli. A espaldas, la Place du Tertre conserva a retratistas y pintores de caballete al aire libre como en los tiempos de Picasso y Renoir.',
            activities: ['Entrar a la basílica y apreciar el inmenso mosaico dorado del Cristo en majestad (Gratis)', 'Hacerse un retrato o caricatura al carboncillo en la Place du Tertre (€30 - €60)', 'Visitar el Muro de los Te Quiero (Le mur des je t’aime) en la plaza Jehan Rictus (Gratis)'],
            tips: ['Subir en el funicular de Montmartre usando un billete sencillo de metro Ticket t+ (€2.15)', 'Cuidar carteras y mochilas de los carteristas en las escalinatas'],
            curious_facts: ['La piedra de Château-Landon con la que está construida la basílica secreta calcita al llover, lo que hace que se limpie sola y se mantenga blanca'],
            suggested_minutes: 180,
            location_info: { address: '35 Rue du Chevalier de la Barre, Paris', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Museo del Louvre y Jardines de las Tullerías',
        notes: 'La Gioconda, la Victoria de Samotracia y el palacio de los reyes de Francia.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo del Louvre y Pirámide de Cristal de I.M. Pei',
            latitude: 48.8606,
            longitude: 2.3376,
            image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'],
            description: 'El museo de arte más visitado del mundo ubicado en el antiguo palacio real. Custodia más de 35.000 obras maestras que van desde la estatuaria griega clásica hasta la pintura renacentista de Leonardo da Vinci.',
            activities: ['Ver de cerca la Mona Lisa y la Venus de Milo (Entrada: €22 con reserva horaria obligatoria)', 'Fotografía simétrica bajo la pirámide de cristal en el patio Napoleón (Gratis)', 'Paseo relajado por el Jardín de las Tullerías y tomar un chocolate caliente Angelina (€9)'],
            tips: ['Ingresar por el centro comercial subterráneo Carrousel du Louvre para evitar las colas de la pirámide exterior', 'Cierra los martes; planificar la visita de miércoles a lunes'],
            curious_facts: ['Si una persona dedicara solo 30 segundos a cada obra expuesta en el Louvre, tardaría 100 días ininterrumpidos en ver toda la colección'],
            suggested_minutes: 240,
            location_info: { address: 'Rue de Rivoli, 75001 Paris', priceRange: '$$ - Entrada €22' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: La Dama de Hierro y Crucero al Atardecer por el Sena',
        notes: 'La Torre Eiffel, el Campo de Marte y las luces de los puentes parisinos.',
        stops: [
          {
            stop_order: 1,
            name: 'Torre Eiffel y Crucero en Bateaux-Mouches',
            latitude: 48.8584,
            longitude: 2.2945,
            image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80'],
            description: 'El emblema indiscutible de Francia erigido por Gustave Eiffel para la Exposición Universal de 1889 con 330 metros de hierro pudelado. A sus pies, los barcos panorámicos navegan bajo los puentes históricos del Sena.',
            activities: ['Subir en ascensor al segundo piso o cima de la Torre Eiffel (€18.80 - €29.40 según nivel)', 'Crucero panorámico de 1 hora por el río Sena pasando bajo Notre-Dame y el Puente Alejandro III (€17)', 'Ver el destello de miles de luces doradas de la torre que titilan durante 5 minutos cada hora al anochecer'],
            tips: ['La mejor panorámica fotográfica de la torre completa se obtiene desde la Plaza del Trocadero al atardecer'],
            curious_facts: ['La Torre Eiffel se contrae y dilata con la temperatura: en verano puede crecer hasta 15 centímetros de altura debido a la dilatación térmica del hierro'],
            suggested_minutes: 210,
            location_info: { address: 'Champ de Mars, 5 Av. Anatole France', priceRange: '$$ - Ascenso y crucero' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Viaje al Valle del Loira: Castillo de Chambord',
        notes: 'El castillo renacentista más colosal del mundo y su escalera de doble hélice.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Chambord',
            latitude: 47.6160,
            longitude: 1.5170,
            image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra cumbre encargada por el rey Francisco I rodeada por el mayor parque forestal cerrado de Europa (del tamaño del centro de París). Cuenta con 440 estancias, 365 chimeneas y una revolucionaria escalera de caracol de doble hélice diseñada por Leonardo da Vinci.',
            activities: ['Subir y bajar la escalera de doble hélice donde dos personas ascienden sin cruzarse jamás (Entrada: €16)', 'Pasear por la terraza del tejado entre un bosque de linternas de piedra y chimeneas (Gratis con entrada)', 'Alquilar un bote eléctrico para navegar por el foso del castillo (€18 por 30 minutos)'],
            tips: ['El tren regional TER desde París Austerlitz hasta Blois o Mer toma 1 hora y 20 minutos con conexión de lanzadera al castillo'],
            curious_facts: ['Francisco I mandó construir este inmenso castillo solo como pabellón de caza y apenas habitó en él 72 días en toda su vida'],
            suggested_minutes: 240,
            location_info: { address: 'Château, 41250 Chambord', priceRange: '$$ - Entrada €16' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Castillo de Chenonceau: El Castillo de las Damas sobre el Río Cher',
        notes: 'Galería flotante de arcos sobre el agua y rivalidad entre Diana de Poitiers y Catalina de Médici.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Chenonceau y Jardines Reales',
            latitude: 47.3249,
            longitude: 1.0703,
            image_url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80'],
            description: 'El castillo más romántico de Francia, edificado literalmente como un puente que cruza el río Cher. Diseñado, protegido y embellecido casi exclusivamente por mujeres, entre ellas Diana de Poitiers y la reina Catalina de Médici.',
            activities: ['Recorrer la gran galería de 60 metros que cruza sobre el agua (Entrada con folleto: €17)', 'Pasear por los jardines enfrentados de Diana de Poitiers y Catalina de Médici (Gratis con entrada)', 'Almorzar en el antiguo invernadero l\'Orangerie con vinos AOC Touraine (€35 - €55)'],
            tips: ['Visitar la gran cocina renacentista ubicada en los pilares del puente sobre el agua con sus ollas de cobre originales'],
            curious_facts: ['Durante la Segunda Guerra Mundial la galería del castillo sirvió como vía clandestina de escape, pues un extremo estaba en la Francia ocupada y el otro en la zona libre'],
            suggested_minutes: 240,
            location_info: { address: '37150 Chenonceaux', priceRange: '$$ - Entrada €17' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Castillo y Jardines de Villandry: La Sinfonía Vegetal',
        notes: 'Los jardines renacentistas más espectaculares del mundo y huerto decorativo.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo y Jardines de Villandry',
            latitude: 47.3400,
            longitude: 0.5130,
            image_url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=800&q=80'],
            description: 'El último de los grandes castillos renacentistas construidos a orillas del Loira. Famoso en el mundo entero por sus 6 jardines aterrazados que incluyen el Jardín del Amor con boj recortado en formas alegóricas y el Huerto Decorativo con verduras multicolores.',
            activities: ['Subir a la torre del homenaje para admirar el tapiz geométrico de los jardines desde arriba (Entrada: €13 castillo + jardines / €8 solo jardines)', 'Descifrar los cuatro cuadrados del Jardín del Amor (Tierno, Apasionado, Voluble y Trágico)', 'Cata de quesos de cabra Sainte-Maure de Touraine con vino blanco (€15)'],
            tips: ['La primavera y el verano muestran el esplendor máximo de las flores y verduras ornamentales'],
            curious_facts: ['Los jardines son cuidados íntegramente de manera orgánica sin pesticidas químicos por un equipo de 10 jardineros dedicados'],
            suggested_minutes: 180,
            location_info: { address: '3 Rue Principale, 37510 Villandry', priceRange: '$ - Entrada €13' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Retorno a París: Barrio Latino, Notre-Dame y Despedida',
        notes: 'Librería Shakespeare and Company, la catedral renacida y despedida.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral de Notre-Dame y Shakespeare and Company',
            latitude: 48.8530,
            longitude: 2.3499,
            image_url: 'https://images.unsplash.com/photo-1478860409698-8707f313ee8b?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1478860409698-8707f313ee8b?auto=format&fit=crop&w=800&q=80'],
            description: 'La isla de la Cité es la cuna de París. La catedral de Notre-Dame se alza junto al Sena, mientras al cruzar el puente hacia el Barrio Latino se encuentra la mítica librería en madera que acogió a Ernest Hemingway y James Joyce.',
            activities: ['Fotografiar la fachada gótica restaurada y rosetones de Notre-Dame (Gratis)', 'Comprar un libro sellado en la librería histórica Shakespeare and Company (€10 - €25)', 'Último almuerzo parisino en una terraza: croissant con café au lait y quiche lorraine (€15)'],
            tips: ['Tomar el tren RER B directo desde la estación Saint-Michel Notre-Dame hacia el aeropuerto Charles de Gaulle (40 minutos, €11.80)'],
            curious_facts: ['En el atrio de Notre-Dame se encuentra el "Punto Cero" de Francia, desde el cual se miden todas las distancias en kilómetros de las carreteras del país'],
            suggested_minutes: 150,
            location_info: { address: '6 Rue de la Bûcherie, 75005 Paris', priceRange: '$ - Acceso libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-grecia-clasica-islas-egeo-8d',
    title: 'Grecia Clásica e Islas del Egeo: Dioses, Templos y Santorini',
    country: 'Grecia',
    city: 'Atenas',
    type: 'historical',
    tourScope: 'coastal_islands',
    description: 'Circuito inolvidable de 8 días que une la cuna de la democracia y la filosofía en la Acrópolis de Atenas con la magia encalada, las cúpulas azules y las calderas volcánicas de Mykonos y Santorini sobre el mar Egeo.',
    cover_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 11520,
    distance_meters: 390000,
    difficulty: 'moderate',
    rating: 4.97,
    review_count: 172,
    likes_count: 590,
    tags: ['Grecia', 'Atenas', 'Santorini', 'Mykonos', 'Acrópolis', 'Partenón', 'Egeo', 'Mitología'],
    recommended_audience: ['Viajeros románticos', 'Apasionados de la historia antigua', 'Fotógrafos'],
    best_season: 'Mayo a Junio y Septiembre a Octubre (mar cálido y sin multitudes agobiantes)',
    recommended_schedule: 'Acrópolis a las 8:00 AM para evitar calor y atardeceres sagrados en Oia',
    meeting_point: 'Plaza Syntagma / Parlamento Helénico, Atenas',
    includes: ['Ruta completa continental e insular', 'Guía de ferris rápidos entre islas del Egeo', 'Ubicación de miradores de cúpulas azules'],
    excludes: ['Boleto combinado Acrópolis de Atenas', 'Billetes de ferry Pireo - Mykonos - Santorini', 'Consumos personales'],
    recommendations: ['Llevar calzado con suela de goma antideslizante para caminar sobre el mármol pulido y desgastado de la Acrópolis', 'Llevar sombrero y protector solar potente'],
    what_to_bring: ['Ropa blanca o de lino para fotos', 'Gafas de sol polarizadas', 'Traje de baño', 'Adaptador europeo'],
    tour_rules: ['Prohibido recoger o tocar fragmentos de mármol antiguo del suelo en los sitios arqueológicos'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 700, estimatedPerPersonMax: 1500, notes: 'Acrópolis (~€20), ferris entre islas (~€70-€90 tramo) y gastronomía griega' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Atenas: La Roca Sagrada de la Acrópolis y Plaka',
        notes: 'El Partenón, las Cariátides del Erecteion y el barrio más antiguo a sus faldas.',
        stops: [
          {
            stop_order: 1,
            name: 'Acrópolis de Atenas y Partenón',
            latitude: 37.9715,
            longitude: 23.7257,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'El monumento más célebre de la civilización clásica occidental, edificado en el siglo V a.C. bajo Pericles. El Partenón, templo dórico dedicado a Atenea Pártenos, y el Erecteion con el pórtico de las seis doncellas Cariátides.',
            activities: ['Subir los Propileos y contemplar el Partenón de mármol pentélico (Entrada: €20)', 'Fotografiar las Cariátides del Erecteion y el Olivo Sagrado de Atenea (Gratis con entrada)', 'Pasear por las callejuelas empedradas del pintoresco barrio de Plaka (€0)'],
            tips: ['Entrar a las 8:00 AM para evitar las masas de cruceros y el calor reflejado en el mármol', 'Comprar el boleto combinado de 7 sitios arqueológicos (€30) si estará varios días en Atenas'],
            curious_facts: ['El Partenón no tiene una sola línea recta; todas sus columnas y arquitrabes tienen curvaturas e inclinaciones sutiles calculadas para corregir las ilusiones ópticas del ojo humano'],
            suggested_minutes: 200,
            location_info: { address: 'Acrópolis, Atenas', priceRange: '$$ - Entrada €20' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Museo de la Acrópolis y el Ágora Antigua',
        notes: 'El Templo de Hefesto mejor conservado y las Cariátides originales.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo de la Acrópolis y Ágora Antigua de Atenas',
            latitude: 37.9684,
            longitude: 23.7285,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'Museo ultramoderno construido sobre ruinas excavadas visibles a través de suelos de cristal. Exhibe las cinco Cariátides originales y el friso del Partenón orientado con vista directa a la roca sagrada. El Ágora era el corazón cívico donde debatían Sócrates y Platón.',
            activities: ['Admirar las Cariátides originales a centímetros de distancia en el museo (Entrada: €15)', 'Visitar el Templo de Hefesto en el Ágora Antigua, el más intacto de Grecia (€10)', 'Almorzar moussaka tradicional con ensalada griega con queso feta en Monastiraki (€15 - €22)'],
            tips: ['La terraza del restaurante del museo ofrece una de las vistas más limpias del Partenón'],
            curious_facts: ['La sexta Cariátide que falta fue arrancada por Lord Elgin en 1801 y permanece en el Museo Británico de Londres'],
            suggested_minutes: 210,
            location_info: { address: 'Dionysiou Areopagitou 15, Athina', priceRange: '$$ - Entrada museo' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Ferry a Mykonos: Molinos de Viento y Little Venice',
        notes: 'Travesía marítima por el Egeo hacia la isla blanca de los molinos.',
        stops: [
          {
            stop_order: 1,
            name: 'Molinos de Kato Mili y Pequeña Venecia (Little Venice)',
            latitude: 37.4445,
            longitude: 25.3255,
            image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'],
            description: 'Los famosos molinos de viento harineros del siglo XVI con techos de paja que saludan al mar. Abajo, Little Venice con casas de capitanes del siglo XVIII construidas literalmente sobre el agua con balcones coloridos donde rompen las olas.',
            activities: ['Tomar un cóctel al atardecer en los bares con terraza sobre el agua en Little Venice (€18 - €25)', 'Fotografiar los cinco molinos de viento con la luz dorada del Egeo (Gratis)', 'Perderse en el laberinto blanco de callejuelas encaladas de Chora (Gratis)'],
            tips: ['El ferry rápido desde el Pireo (Seajets) tarda 2 horas y media hacia Mykonos (~€85)'],
            curious_facts: ['El pueblo de Chora fue diseñado deliberadamente como un laberinto confuso para desorientar a los piratas invasores que desembarcaban en la isla'],
            suggested_minutes: 200,
            location_info: { address: 'Mykonos Town (Chora)', priceRange: '$$ - Moderado a alto' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Santuario de Apolo en la Sagrada Isla de Delos',
        notes: 'Patrimonio de la Humanidad: el lugar de nacimiento mitológico de los dioses Apolo y Artemisa.',
        stops: [
          {
            stop_order: 1,
            name: 'Isla Arqueológica de Delos',
            latitude: 37.3970,
            longitude: 25.2670,
            image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'],
            description: 'Isla sagrada deshabitada donde según la mitología nacieron los dioses gemelos Apolo y Artemisa. Cuenta con la famosa Terraza de los Leones de mármol, templos dóricos y mosaicos de Dionisio intactos.',
            activities: ['Excursión en barco desde el puerto de Mykonos (Barco ida y vuelta: €22 + Entrada sitio: €8)', 'Recorrer la Terraza de los Leones arcaicos de Naxos (Gratis con entrada)', 'Subir al Monte Cintos para una panorámica de todas las islas Cícladas circundantes'],
            tips: ['En Delos no hay sombra ni árboles; llevar sombrilla o gorra, gafas de sol y abundante agua'],
            curious_facts: ['En la antigüedad era un crimen sagrado nacer o morir en Delos; las mujeres embarazadas y enfermos terminales eran evacuados a islas vecinas'],
            suggested_minutes: 240,
            location_info: { address: 'Isla de Delos, Cícladas', priceRange: '$$ - Excursión marítima' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Llegada a Santorini: La Caldera Volcánica y Fira',
        notes: 'Ferry hacia la isla volcánica más espectacular del mundo y caminata por el acantilado.',
        stops: [
          {
            stop_order: 1,
            name: 'Fira y Sendero al Borde de la Caldera',
            latitude: 36.4166,
            longitude: 25.4324,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'Capital de Santorini colgada de un acantilado de roca volcánica negra y roja a 260 metros sobre la caldera inundada por el mar. Casas blancas de estilo troglodita, iglesias ortodoxas y restaurantes con vistas vertiginosas.',
            activities: ['Caminata panorámica por el sendero peatonal que une Fira con Firostefani e Imerovigli (Gratis)', 'Subir en el teleférico desde el Puerto Viejo hasta Fira (€6)', 'Cena con pescado fresco y vino blanco volcánico Assyrtiko (€35 - €60)'],
            tips: ['No montar en los burros del puerto viejo por razones de bienestar animal; usar el teleférico o las escaleras a pie'],
            curious_facts: ['La gigantesca erupción de Thera hace 3.600 años hundió el centro de la isla originando la leyenda de la Atlántida descrita por Platón'],
            suggested_minutes: 210,
            location_info: { address: 'Fira, Santorini', priceRange: '$$ - Restaurantes panorámicos' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Oia: Las Cúpulas Azules y el Atardecer Más Célebre del Mundo',
        notes: 'El pueblo de postal de Santorini en el extremo norte de la caldera.',
        stops: [
          {
            stop_order: 1,
            name: 'Pueblo de Oia y Ruinas del Castillo Bizantino',
            latitude: 36.4618,
            longitude: 25.3753,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'La estampa más famosa de Grecia en el mundo: callejuelas de mármol blanco, iglesias con cúpulas azul cobalto y campanarios asomados al abismo marino. Al final del pueblo, el viejo castillo de San Nicolás acoge a miles para ver la puesta de sol.',
            activities: ['Fotografiar las Tres Cúpulas Azules desde el mirador clásico (Gratis)', 'Ubicarse en las ruinas del Castillo de Oia para contemplar la caída del sol en el Egeo (Gratis)', 'Bajar los 200 escalones hacia la caleta de Ammoudi para comer calamares frescos a orillas del agua (€30 - €50)'],
            tips: ['Llegar al castillo al menos 1 hora y media antes del atardecer para asegurar sitio', 'Respetar los carteles de propiedad privada en los tejados de las casas'],
            curious_facts: ['Las casas de Oia llamadas *yposkafa* están excavadas directamente en la ceniza volcánica compacta, lo que las mantiene frescas en verano y cálidas en invierno'],
            suggested_minutes: 240,
            location_info: { address: 'Oia, Santorini', priceRange: '$$$ - Pueblo icónico' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: La Pompeya del Egeo: Ruinas de Akrotiri y Playa Roja',
        notes: 'Ciudad minoica congelada bajo ceniza volcánica hace 3.600 años y arena volcánica roja.',
        stops: [
          {
            stop_order: 1,
            name: 'Yacimiento Arqueológico de Akrotiri y Red Beach',
            latitude: 36.3510,
            longitude: 25.4030,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'Asentamiento urbano minoico de la Edad del Bronce preservado bajo capas de ceniza volcánica con edificios de tres plantas, sistemas de drenaje avanzado y frescos murales intactos. A pocos minutos, los acantilados de roca volcánica roja de Red Beach.',
            activities: ['Caminar sobre las pasarelas techadas de la ciudad prehistórica excavada (Entrada: €12)', 'Mirador fotográfico sobre la imponente arena y roca roja de Red Beach (Gratis)', 'Cata de vinos en Bodega Santo Wines sobre el acantilado (€30 por vuelo de 6 vinos)'],
            tips: ['Akrotiri es un sitio completamente techado y protegido del sol'],
            curious_facts: ['En Akrotiri no se hallaron esqueletos humanos ni joyas de oro, lo que demuestra que los habitantes evacuaron ordenadamente con sus riquezas antes de la erupción catastrófica'],
            suggested_minutes: 200,
            location_info: { address: 'Akrotiri, Santorini', priceRange: '$$ - Entrada €12' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Retorno a Atenas y Despedida Olímpica',
        notes: 'Vuelo o ferry de regreso a Atenas y visita al Estadio Panatenaico.',
        stops: [
          {
            stop_order: 1,
            name: 'Estadio Panatenaico (Kallimarmaro) y Despedida',
            latitude: 37.9683,
            longitude: 23.7411,
            image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
            description: 'El único estadio del mundo construido enteramente en mármol blanco. Sede de los primeros Juegos Olímpicos de la era moderna en 1896.',
            activities: ['Correr sobre la pista de ceniza original y subir al podio de campeones (Entrada: €10)', 'Comprar aceite de oliva extra virgen de Kalamata y miel de tomillo para llevar (€10 - €20)', 'Traslado al aeropuerto internacional Eleftherios Venizelos en metro línea 3 (€9)'],
            tips: ['El boleto del estadio incluye audioguía multilingüe que narra la historia del maratón olímpico'],
            curious_facts: ['Tiene capacidad para 50.000 espectadores sentados en graderías de mármol sin ningún elemento de hormigón'],
            suggested_minutes: 120,
            location_info: { address: 'Leof. Vasileos Konstantinou, Athina', priceRange: '$ - Entrada €10' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-tesoros-del-danubio-praga-viena-budapest-9d',
    title: 'Tesoros del Danubio y Europa Central: Praga, Viena y Budapest',
    country: 'República Checa',
    city: 'Praga',
    type: 'cultural',
    tourScope: 'international_multicity',
    description: 'La gran trilogía imperial de Europa Central durante 9 días. Las agujas góticas y el Puente de Carlos en Praga, los palacios de los Habsburgo y la música clásica en Viena, y el Parlamento dorado reflejado en las aguas del Danubio y balnearios termales en Budapest.',
    cover_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 12960,
    distance_meters: 530000,
    difficulty: 'easy',
    rating: 4.98,
    review_count: 210,
    likes_count: 680,
    tags: ['Europa Central', 'Praga', 'Viena', 'Budapest', 'Danubio', 'Castillos', 'Música Clásica', 'Termas'],
    recommended_audience: ['Viajeros culturales', 'Amantes de la música y arquitectura', 'Parejas'],
    best_season: 'Abril a Octubre o Diciembre (famosos mercados de Adviento navideños)',
    recommended_schedule: 'Caminatas urbanas diurnas y conciertos o baños termales al caer la noche',
    meeting_point: 'Plaza de la Ciudad Vieja frente al Reloj Astronómico, Praga',
    includes: ['Itinerario interconectado por trenes Railjet', 'Guía de palacios y baños termales históricos', 'Ruta de cafés de la Belle Époque'],
    excludes: ['Billetes de tren Praga - Viena y Viena - Budapest', 'Entrada a baños Széchenyi en Budapest', 'Boletos de ópera'],
    recommendations: ['Comprar los billetes de tren Railjet por la web de ÖBB o České dráhy con semanas de anticipación para tarifas promo desde €15-€25', 'Llevar bañador y toalla para las termas de Budapest'],
    what_to_bring: ['Calzado cómodo para adoquines', 'Ropa elegante para cafés o conciertos', 'Monedas locales (Coronas checas y Forintos húngaros, aunque casi todo acepta tarjeta)'],
    tour_rules: ['Respetar las normas de silencio y etiqueta en los salones de conciertos y salas palaciegas'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 600, estimatedPerPersonMax: 1250, notes: 'Castillo de Praga, Schönbrunn, Termas Széchenyi, trenes Railjet y gastronomía centroeuropea' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Praga Gótica: Reloj Astronómico y Puente de Carlos',
        notes: 'El corazón medieval de la Ciudad de las Cien Torres.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de la Ciudad Vieja y Puente de Carlos',
            latitude: 50.0875,
            longitude: 14.4210,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'La plaza medieval más bella de Europa Central presidida por la Iglesia de Nuestra Señora de Týn y el Reloj Astronómico de 1410. A pasos, el histórico Puente de Carlos de piedra del siglo XIV adornado por 30 estatuas barrocas sobre el río Moldava.',
            activities: ['Ver el desfile mecánico de los doce apóstoles del Reloj Astronómico a cada hora en punto (Gratis)', 'Cruzar el Puente de Carlos y tocar el relieve de bronce de San Juan Nepomuceno para la suerte (Gratis)', 'Probar goulash checo servido en hogaza de pan con cerveza Pilsner Urquell (€12 - €18)'],
            tips: ['Cruzar el Puente de Carlos al amanecer (6:30 AM) para disfrutarlo en soledad y silencio mágico'],
            curious_facts: ['Cuenta la leyenda que a los concejales de Praga les gustó tanto el reloj astronómico que cegaron a su maestro relojero Hanuš para que nunca pudiera construir otro igual'],
            suggested_minutes: 180,
            location_info: { address: 'Staroměstské náměstí, Praha', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Castillo de Praga, Catedral de San Vito y Callejón del Oro',
        notes: 'El complejo palaciego medieval más grande del mundo y la casa de Franz Kafka.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Praga y Catedral de San Vito',
            latitude: 50.0908,
            longitude: 14.4005,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Monumento que domina la ciudad desde una colina. La Catedral de San Vito tardó casi 600 años en completarse con vitrales diseñados por Alfons Mucha. Al lado, el Callejón del Oro con diminutas casitas de alquimistas y orfebres de colores pastel.',
            activities: ['Visitar la nave gótica de la Catedral de San Vito y la tumba de San Venceslao (Entrada circuito castillo: ~250 CZK / €10)', 'Entrar a la casa número 22 del Callejón del Oro donde vivió y escribió Franz Kafka (Incluido en circuito)', 'Subir en el tranvía histórico 22 hasta la parada Pražský hrad (€1.50)'],
            tips: ['El cambio de guardia solemne con fanfarria militar se realiza a las 12:00 del mediodía en el primer patio'],
            curious_facts: ['El libro Guinness de los récords certifica al Castillo de Praga como el castillo antiguo coherente más grande del planeta con 70.000 m²'],
            suggested_minutes: 240,
            location_info: { address: 'Hradčany, 119 08 Praha 1', priceRange: '$ - Entrada ~€10' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Barrio Judío de Josefov y Tren Rápido a Viena',
        notes: 'Sinagogas históricas, el cementerio judío medieval y viaje en tren hacia la capital austriaca.',
        stops: [
          {
            stop_order: 1,
            name: 'Antiguo Cementerio Judío de Praga y Tren Railjet a Viena',
            latitude: 50.0895,
            longitude: 14.4175,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Cementerio con más de 12.000 lápidas amontonadas en capas debido a la falta de espacio en el gueto durante siglos. Luego, viaje en el moderno tren Railjet cruzando Bohemia y Moravia hasta Viena.',
            activities: ['Visitar la Sinagoga Vieja-Nueva, la más antigua activa de Europa (Entrada museo judío: ~350 CZK / €14)', 'Abordar el tren Railjet en la estación central Praha hlavní nádraží hacia Viena (€20 - €35 - 4 horas)', 'Llegada a Viena y primer paseo nocturno por la Ringstraße iluminada (Gratis)'],
            tips: ['El tren cuenta con wifi de alta velocidad, restaurante a bordo y vagones silenciosos'],
            curious_facts: ['Según la leyenda de Praga, en el ático de la Sinagoga Vieja-Nueva reposan los restos de barro del Golem creado por el rabino Judah Loew en el siglo XVI'],
            suggested_minutes: 240,
            location_info: { address: 'Široká, Josefov / Hlavní nádraží', priceRange: '$$ - Tren a Viena' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Viena Imperial: Palacio de Schönbrunn y la Catedral de San Esteban',
        notes: 'La residencia de verano de Sissi Emperatriz y cafés históricos de la Ringstraße.',
        stops: [
          {
            stop_order: 1,
            name: 'Palacio de Schönbrunn y Catedral de San Esteban (Stephansdom)',
            latitude: 48.1848,
            longitude: 16.3122,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'El Versalles austriaco donde vivieron María Teresa, Francisco José y Sissi. Salones rococó con espejos dorados y jardines barrocos con la Glorieta. En el centro histórico se alza la catedral gótica de San Esteban con su tejado de mosaicos de colores.',
            activities: ['Grand Tour de los 40 aposentos de Estado del Palacio de Schönbrunn (Entrada: €24)', 'Subir a la colina de la Glorieta en los jardines para la vista panorámica de Viena (Gratis los jardines)', 'Tomar un café Melange tradicional con tarta Sacher original en el Café Central o Café Sacher (€14)'],
            tips: ['Tomar la línea U4 del metro directo desde el centro hasta la estación Schönbrunn (€2.40)'],
            curious_facts: ['En el Salón de los Espejos de Schönbrunn, un prodigioso niño de 6 años llamado Wolfgang Amadeus Mozart dio su primer concierto ante la emperatriz María Teresa en 1762'],
            suggested_minutes: 240,
            location_info: { address: 'Schönbrunner Schloßstraße 47, Wien', priceRange: '$$ - Entrada €24' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Palacio de Belvedere: "El Beso" de Klimt y Ópera de Viena',
        notes: 'Pintura de oro modernista, jardines en terrazas y música de Mozart.',
        stops: [
          {
            stop_order: 1,
            name: 'Palacio de Belvedere Superior y Ópera Estatal de Viena',
            latitude: 48.1915,
            longitude: 16.3808,
            image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'],
            description: 'Palacio barroco del Príncipe Eugenio de Saboya que custodia la colección cumbre del modernismo vienés, incluyendo la célebre pintura "El Beso" y "Judith" de Gustav Klimt cubiertas de pan de oro.',
            activities: ['Admirar "El Beso" de Klimt en la sala principal del Belvedere Superior (Entrada: €17.50)', 'Pasear por los jardines barrocos de cascadas entre el Belvedere Superior y el Inferior (Gratis)', 'Probar el Wiener Schnitzel auténtico (escalope vienés de ternera gigante) en Figlmüller (€22 - €28)'],
            tips: ['Reservar mesa con semanas de antelación en Figlmüller Wollzeile', 'En la Ópera de Viena se pueden comprar entradas de pie por solo €10 a €15 dos horas antes de la función'],
            curious_facts: ['Klimt utilizó auténticas hojas de oro batido mezcladas con pintura al óleo inspirándose en los mosaicos bizantinos que contempló en Rávena'],
            suggested_minutes: 200,
            location_info: { address: 'Prinz-Eugen-Straße 27, Wien', priceRange: '$$ - Entrada museo' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Tren a Budapest y el Majestuoso Parlamento sobre el Danubio',
        notes: 'Llegada a la Perla del Danubio y crucero nocturno entre palacios iluminados.',
        stops: [
          {
            stop_order: 1,
            name: 'Parlamento de Hungría y Zapatos en el Paseo del Danubio',
            latitude: 47.5070,
            longitude: 19.0455,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Uno de los edificios gubernamentales más colosales del mundo, de estilo neogótico con 691 salas y 268 metros de largo a orillas del río Danubio. A pocos metros, el sobrecogedor monumento de los "Zapatos en el Danubio" recuerda a las víctimas del Holocausto.',
            activities: ['Tren Railjet de Viena a Budapest (2 horas y media - €18)', 'Visita guiada al interior del Parlamento y la Santa Corona de Hungría (Entrada UE: ~€13 / no UE: ~€28)', 'Crucero nocturno en barco por el Danubio contemplando los puentes y el parlamento iluminado en oro (€16)'],
            tips: ['La vista más espectacular del Parlamento iluminado se obtiene desde el otro lado del río (Bastión de los Pescadores o desde el barco)'],
            curious_facts: ['Para decorar el interior del Parlamento húngaro se utilizaron más de 40 kilos de oro de 22 quilates'],
            suggested_minutes: 240,
            location_info: { address: 'Kossuth Lajos tér 1-3, Budapest', priceRange: '$$ - Tren y crucero' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: La Colina de Buda: Bastión de los Pescadores e Iglesia de Matías',
        notes: 'Torres de cuento de hadas con vista panorámica de Pest y el Puente de las Cadenas.',
        stops: [
          {
            stop_order: 1,
            name: 'Bastión de los Pescadores y Castillo de Buda',
            latitude: 47.5020,
            longitude: 19.0345,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Mirador neorrománico con 7 torres blancas que conmemoran las 7 tribus magiares que fundaron Hungría. La Iglesia de Matías luce tejados de tejas barnizadas de porcelana Zsolnay de vivos colores geométricos.',
            activities: ['Pasear por las terrazas y arcos del Bastión de los Pescadores (Planta principal gratis / torrecillas superiores ~€3)', 'Entrar a la Iglesia de Matías donde fue coronado el emperador Francisco José (Entrada: ~€8)', 'Cruzar a pie el centenario Puente de las Cadenas sobre el Danubio (Gratis)'],
            tips: ['Subir a la colina de Buda en el histórico funicular de madera Budavári Sikló (€10)'],
            curious_facts: ['El nombre "Bastión de los Pescadores" se debe a que el gremio de pescadores de la ciudad era el encargado de defender este tramo de la muralla en la Edad Media'],
            suggested_minutes: 210,
            location_info: { address: 'Szentháromság tér, Budapest', priceRange: '$ - Acceso casi libre' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Relajación en las Termas Széchenyi y Ruin Bars',
        notes: 'El mayor balneario termal medicinal de Europa y los singulares bares en ruinas.',
        stops: [
          {
            stop_order: 1,
            name: 'Balneario Termal Széchenyi y Szimpla Kert',
            latitude: 47.5180,
            longitude: 19.0820,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Palacio neobarroco de color amarillo que alberga 15 piscinas termales interiores y 3 gigantescas piscinas exteriores humeantes a 38°C alimentadas por manantiales subterráneos. Por la noche, el barrio judío cobra vida en los *ruin bars* instalados en edificios abandonados decorados con arte vintage.',
            activities: ['Baño en las piscinas termales exteriores y ver a los ancianos locales jugar al ajedrez en el agua (Entrada día completo con taquilla: ~10.500 HUF / €27)', 'Pasear por la Plaza de los Héroes (Hősök tere) a la salida del parque (Gratis)', 'Noche de copas en Szimpla Kert, el "ruin bar" más famoso del mundo (€4 - €8 cerveza local)'],
            tips: ['Llevar chanclas/sandalias obligatorias para caminar en el borde de las piscinas'],
            curious_facts: ['El agua brota a más de 75°C desde 1.250 metros de profundidad y es tan rica en sulfatos y calcio que también alimenta el lago de los hipopótamos del zoo vecino'],
            suggested_minutes: 300,
            location_info: { address: 'Állatkerti krt. 9-11, Budapest', priceRange: '$$ - Entrada termas ~€27' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Gran Mercado Central de Budapest y Despedida',
        notes: 'Gastronomía magiar, páprika aromática y despedida junto al río.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Mercado Central de Budapest (Nagy Vásárcsarnok)',
            latitude: 47.4870,
            longitude: 19.0585,
            image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'],
            description: 'Impresionante edificio del siglo XIX con estructura de hierro forjado y tejado de tejas policromadas Zsolnay. Es el mejor lugar para probar la comida callejera magiar y comprar recuerdos de Hungría.',
            activities: ['Probar un Lángos caliente con crema agria y queso rallado en la planta alta (~1.500 HUF / €4)', 'Comprar latas de páprika dulce húngara en polvo y vino dulce Tokaji para regalo (€5 - €15)', 'Caminar por la calle peatonal comercial Váci Utca antes del traslado al aeropuerto'],
            tips: ['Los domingos el mercado está cerrado; los sábados abre hasta las 3:00 PM'],
            curious_facts: ['Antiguamente el mercado contaba con un canal subterráneo por donde los barcos descargaban directamente los productos frescos desde el Danubio'],
            suggested_minutes: 150,
            location_info: { address: 'Vámház krt. 1-3, Budapest', priceRange: '$ - Compras locales' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-gran-italia-monumental-10d',
    title: 'La Gran Italia Monumental: Roma, Florencia, Toscana y Canales de Venecia',
    country: 'Italia',
    city: 'Roma',
    type: 'historical',
    tourScope: 'city_to_city',
    description: 'El viaje clásico definitivo de 10 días por la cuna del Imperio Romano y el Renacimiento. Gladiadores en el Coliseo, arte divino en el Vaticano y la Capilla Sixtina, el David de Miguel Ángel y los Uffizi en Florencia, viñedos en las colinas toscanas y navegación en góndola por los canales de Venecia.',
    cover_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 14400,
    distance_meters: 620000,
    difficulty: 'moderate',
    rating: 4.99,
    review_count: 265,
    likes_count: 890,
    tags: ['Italia', 'Roma', 'Florencia', 'Venecia', 'Toscana', 'Coliseo', 'Vaticano', 'Góndola'],
    recommended_audience: ['Amantes del arte y la historia', 'Parejas', 'Viajeros primerizos en Europa'],
    best_season: 'Marzo a Junio y Septiembre a Noviembre (evitar el calor sofocante de julio y agosto)',
    recommended_schedule: 'Monumentos clave temprano por la mañana para evitar colas de dos horas',
    meeting_point: 'Piazza del Colosseo, Roma',
    includes: ['Ruta completa conectada por trenes de alta velocidad Frecciarossa', 'Coordenadas GPS de basílicas, museos y miradores', 'Guía de platos regionales auténticos'],
    excludes: ['Boleto al Coliseo y Foro Romano', 'Entrada a Museos Vaticanos y Capilla Sixtina', 'Galería Uffizi', 'Paseo en góndola'],
    recommendations: ['Es IMPRESCINDIBLE reservar las entradas a Museos Vaticanos, Coliseo y Galería Uffizi con 1 o 2 meses de anticipación en sus webs oficiales', 'Para ingresar a basílicas es obligatorio cubrir hombros y rodillas'],
    what_to_bring: ['Calzado para caminar 12-15 km diarios sobre adoquines (*sampietrini*)', 'Botella de agua recargable (Roma tiene fuentes de agua potable fría *nasoni* en cada esquina)', 'Pañuelo para cubrirse hombros'],
    tour_rules: ['Prohibido sentarse en los escalones de la Plaza de España de Roma para preservación'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 850, estimatedPerPersonMax: 1800, notes: 'Coliseo (€18), Vaticano (€20-€25), Uffizi (€25), trenes bala y gastronomía italiana' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: La Roma Imperial: Coliseo, Foro Romano y Monte Palatino',
        notes: 'El anfiteatro de los emperadores y el centro político de la antigüedad.',
        stops: [
          {
            stop_order: 1,
            name: 'Coliseo Romano, Foro Romano y Palatino',
            latitude: 41.8902,
            longitude: 12.4922,
            image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'],
            description: 'El Anfiteatro Flavio inaugurado en el año 80 d.C. donde combatían gladiadores ante 50.000 espectadores. El Foro Romano al lado era el epicentro del mundo antiguo con arcos de triunfo y templos marmóreos.',
            activities: ['Recorrido por la cávea y vista a la arena del Coliseo (Entrada combinada oficial: €18)', 'Caminar por la Vía Sacra del Foro Romano hasta el Templo de Julio César (Incluido en la entrada)', 'Subir a la colina del Palatino donde Rómulo fundó Roma y se construyeron los palacios imperiales'],
            tips: ['Comprar la entrada nominativa en la web de Parco Archeologico del Colosseo', 'Llevar botella de agua para rellenar en las fuentes del interior'],
            curious_facts: ['Durante la inauguración del Coliseo se celebraron 100 días ininterrumpidos de juegos en los que murieron más de 5.000 animales salvajes traídos de África'],
            suggested_minutes: 240,
            location_info: { address: 'Piazza del Colosseo 1, Roma', priceRange: '$$ - Entrada €18' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Roma Barroca: Fontana di Trevi, Panteón y Trastevere',
        notes: 'Monedas al agua, la cúpula de hormigón más grande y pasta fresca.',
        stops: [
          {
            stop_order: 1,
            name: 'Fontana di Trevi, Panteón de Agripa y Piazza Navona',
            latitude: 41.9009,
            longitude: 12.4833,
            image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'],
            description: 'La fuente más famosa del cine barroco tallada en mármol travertino con el dios Océano. El Panteón de Agripa conserva intacta su cúpula de hormigón de 2.000 años con un óculo central abierto al cielo.',
            activities: ['Lanzar una moneda con la mano derecha sobre el hombro izquierdo a la Fontana di Trevi para asegurar el regreso a Roma (Gratis)', 'Entrar al Panteón y contemplar la tumba del pintor Rafael (Entrada: €5)', 'Cenar pasta Carbonara o Cacio e Pepe auténtica en una trattoria de Trastevere (€14 - €22)'],
            tips: ['La Fontana di Trevi está iluminada de manera mágica a las 11:00 PM con mucha menos gente que durante el día'],
            curious_facts: ['Cada día se recogen más de €3.000 euros en monedas del fondo de la Fontana di Trevi, donados íntegramente a la organización benéfica Cáritas'],
            suggested_minutes: 210,
            location_info: { address: 'Piazza di Trevi, Roma', priceRange: '$ - Entrada Panteón €5' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Vaticano: Capilla Sixtina y Basílica de San Pedro',
        notes: 'El Juicio Final de Miguel Ángel y el templo católico más imponente de la Tierra.',
        stops: [
          {
            stop_order: 1,
            name: 'Museos Vaticanos, Capilla Sixtina y San Pedro',
            latitude: 41.9029,
            longitude: 12.4534,
            image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'],
            description: 'El Estado más pequeño del mundo custodia una de las mayores concentraciones de arte de la historia. Las Estancias de Rafael, la Capilla Sixtina con los frescos sublimes de Miguel Ángel y la Basílica con La Piedad.',
            activities: ['Contemplar la bóveda del Génesis y el Juicio Final en silencio en la Capilla Sixtina (Entrada oficial: €20 + €5 reserva)', 'Entrar a la Basílica de San Pedro y maravillarse con La Piedad esculpida en mármol blanco por Miguel Ángel a los 24 años (Entrada basílica gratis)', 'Subir a la cúpula de San Pedro para la vista circular de la Plaza de Bernini (€10 ascensor)'],
            tips: ['Estrictamente obligatorio llevar hombros cubiertos y pantalones o faldas por debajo de la rodilla; no dejan pasar con tirantes ni bermudas cortas', 'Prohibido hablar y tomar fotos dentro de la Capilla Sixtina'],
            curious_facts: ['Miguel Ángel pintó la bóveda de la Capilla Sixtina de pie sobre andamios de madera durante cuatro años de trabajo extenuante que casi le costó la vista'],
            suggested_minutes: 300,
            location_info: { address: 'Viale Vaticano, Ciudad del Vaticano', priceRange: '$$ - Entrada €25' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Tren Bala a Florencia: La Cuna del Renacimiento y el Duomo',
        notes: 'Viaje en Frecciarossa y la cúpula arquitectónica de Brunelleschi.',
        stops: [
          {
            stop_order: 1,
            name: 'Piazza del Duomo y Catedral Santa Maria del Fiore',
            latitude: 43.7731,
            longitude: 11.2560,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'Florencia es un museo al aire libre. Su catedral destaca por la fachada de mármol blanco, verde y rosa y la gigantesca cúpula de ladrillo rojo de Filippo Brunelleschi erigida en el siglo XV sin andamios de soporte.',
            activities: ['Tren Frecciarossa Roma Termini - Firenze Santa Maria Novella (1 hora y 35 minutos - €25 - €45)', 'Ver la fachada del Duomo y las Puertas del Paraíso en bronce dorado del Baptisterio (Gratis exterior)', 'Tomar un panini gourmet con embutidos toscanos en All\'Antico Vinaio (€7 - €9)'],
            tips: ['Subir los 463 escalones de la Cúpula de Brunelleschi requiere comprar el Brunelleschi Pass con reserva anticipada (€30)'],
            curious_facts: ['Brunelleschi inventó nuevas máquinas elevadoras e ideó una disposición de ladrillos en espina de pez que permitió construir la mayor cúpula de albañilería del mundo sin cimbras de madera'],
            suggested_minutes: 200,
            location_info: { address: 'Piazza del Duomo, Firenze', priceRange: '$ - Acceso exterior libre' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: El David de Miguel Ángel y la Galería Uffizi',
        notes: 'Las dos joyas artísticas más sublimes de Florencia y atardecer en Ponte Vecchio.',
        stops: [
          {
            stop_order: 1,
            name: 'Galería de la Academia y Galería de los Uffizi',
            latitude: 43.7687,
            longitude: 11.2556,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'La estatua más perfecta de la historia del arte: el David original de 5.17 metros tallado en un solo bloque de mármol de Carrara. En los Uffizi, las obras cumbres de Botticelli como "El Nacimiento de Venus" y "La Primavera".',
            activities: ['Quedarse sin palabras ante el David original en la Galería de la Academia (Entrada: €16 + €4 reserva)', 'Recorrer las salas de Botticelli, Da Vinci y Caravaggio en Uffizi (Entrada: €25)', 'Caminar al atardecer sobre el Ponte Vecchio con sus joyerías de oro suspendidas sobre el río Arno (Gratis)'],
            tips: ['Cruzar el río Arno y subir al Piazzale Michelangelo para la postal más bella del atardecer con el Duomo recortado en el cielo'],
            curious_facts: ['El bloque de mármol del David había sido abandonado y declarado inservible por otros escultores durante 40 años hasta que Miguel Ángel lo asumió a sus 26 años'],
            suggested_minutes: 270,
            location_info: { address: 'Piazzale degli Uffizi / Via Ricasoli 60, Firenze', priceRange: '$$$ - Entradas museos' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: La Campiña Toscana: Siena y las Torres de San Gimignano',
        notes: 'Colinas de cipreses, vino Chianti y la plaza medieval del Palio.',
        stops: [
          {
            stop_order: 1,
            name: 'Piazza del Campo en Siena y San Gimignano',
            latitude: 43.3188,
            longitude: 11.3317,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'Siena cautiva con su Piazza del Campo en forma de concha donde se corre la histórica carrera de caballos del Palio. Luego, San Gimignano ("el Manhattan medieval") con sus 14 torres de piedra que despuntan sobre viñedos de Vernaccia.',
            activities: ['Sentarse en el suelo de ladrillos de la Piazza del Campo en Siena (Gratis)', 'Entrar a la Catedral de Siena con sus suelos de mármol incrustado (€8)', 'Tomar el helado galardonado como mejor del mundo en la Gelateria Dondoli de San Gimignano (€3 - €6)'],
            tips: ['Excursión en autobús de día completo desde Florencia (€55 - €80 con almuerzo y cata en bodega de Chianti)'],
            curious_facts: ['Las familias nobles de San Gimignano competían por construir la torre más alta como símbolo de poder y riqueza económica'],
            suggested_minutes: 300,
            location_info: { address: 'Siena y San Gimignano, Toscana', priceRange: '$$ - Excursión toscana' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Llegada a Venecia: Piazza San Marco y Palacio Ducal',
        notes: 'El tren entra en la laguna sobre el mar hacia la ciudad sin automóviles.',
        stops: [
          {
            stop_order: 1,
            name: 'Piazza San Marco y Palacio Ducal',
            latitude: 45.4342,
            longitude: 12.3389,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'Tren Frecciarossa desde Florencia a Venezia Santa Lucia (2 horas). Al salir de la estación se abre el Gran Canal con sus vaporettos. San Marcos deslumbra con los mosaicos dorados de la Basílica y el gótico veneciano del Palacio de los Dogos.',
            activities: ['Vaporetto línea 1 recorriendo todo el Gran Canal hasta San Marcos (€9.50 billete sencillo)', 'Visita a la Basílica de San Marcos con sus 8.000 m² de mosaicos en pan de oro (Entrada: €3)', 'Cruzar el Puente de los Suspiros desde los calabozos del Palacio Ducal (Entrada palacio: €30)'],
            tips: ['Comprar el pase de transporte ilimitado de Vaporetto ACTV de 48 o 72 horas para ahorrar (€35 - €45)'],
            curious_facts: ['El Puente de los Suspiros no debe su nombre a los enamorados, sino a los suspiros de los prisioneros que veían por última vez el cielo y el mar antes de ser encerrados'],
            suggested_minutes: 240,
            location_info: { address: 'Piazza San Marco, Venezia', priceRange: '$$ - Palacio y transporte' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Paseo en Góndola por los Canales y Puente de Rialto',
        notes: 'Navegación tradicional a remo por canales estrechos y puentes de piedra.',
        stops: [
          {
            stop_order: 1,
            name: 'Paseo en Góndola y Puente de Rialto',
            latitude: 45.4380,
            longitude: 12.3358,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'El puente más antiguo y famoso que cruza el Gran Canal con arcadas llenas de tiendas. A sus pies, embarque en una góndola tradicional guiada por un gondolero de camiseta a rayas navegando por canales silenciosos bajo puentes colgantes.',
            activities: ['Paseo clásico en góndola de 30 minutos por canales interiores y Gran Canal (Tarifa oficial municipal regulada: €90 de día / €110 de noche por góndola hasta 5 personas)', 'Fotografía del tráfico de góndolas y barcos desde la cima del Puente de Rialto (Gratis)', 'Tomar *cicchetti* (tapas venecianas de bacalao mantecato) con una copa de vino blanco *ombra* en una osteria tradicional (€12 - €18)'],
            tips: ['Pagar la tarifa oficial fijada por la ciudad y exigir los 30 minutos completos de navegación'],
            curious_facts: ['La góndola es asimétrica: su lado izquierdo es 24 centímetros más ancho que el derecho para compensar el peso del gondolero y el remo'],
            suggested_minutes: 180,
            location_info: { address: 'Ponte di Rialto / Canales de San Polo', priceRange: '$$$ - Góndola oficial €90' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Las Islas de la Laguna: Murano (Cristal) y Burano (Color)',
        notes: 'Hornos de vidrio soplado artesanal y las casas de colores más vivas del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Isla de Murano e Isla de Burano',
            latitude: 45.4854,
            longitude: 12.4167,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'Excursión en vaporetto por la laguna veneciana. En Murano se asiste a la forja en vivo de esculturas de vidrio candente en hornos a 1.200°C. En Burano, cada casa de pescadores está pintada de un color brillante diferente con encajes tradicionales.',
            activities: ['Demostración en vivo de maestro soplador de vidrio en fábrica de Murano (€5)', 'Paseo fotográfico entre las casas de colores arcoíris y canales de Burano (Gratis)', 'Probar las galletas tradicionales en forma de S llamadas *Bussolà de Burano* en una panadería artesanal (€5)'],
            tips: ['Tomar el Vaporetto línea 12 desde Fondamente Nove hacia Murano y Burano (40 minutos)'],
            curious_facts: ['En la antigüedad la República de Venecia prohibía a los maestros vidrieros salir de la isla de Murano bajo pena de muerte para que ningún otro país descubriera el secreto del cristal transparente'],
            suggested_minutes: 270,
            location_info: { address: 'Laguna de Venecia (Murano y Burano)', priceRange: '$$ - Transporte vaporetto' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Mirador Fondaco dei Tedeschi y Despedida Veneciana',
        notes: 'Terraza panorámica sobre el Gran Canal y despedida con Spritz.',
        stops: [
          {
            stop_order: 1,
            name: 'Terraza T Fondaco dei Tedeschi y Campo Santa Margherita',
            latitude: 45.4375,
            longitude: 12.3365,
            image_url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'],
            description: 'Antiguo almacén de comerciantes alemanes del siglo XIII convertido en galería de lujo. Su terraza en la azotea ofrece la mejor vista gratuita de 360 grados de los tejados, campanarios y la gran curva en S del Gran Canal.',
            activities: ['Subida a la terraza mirador panorámica de madera sobre el tejado (Acceso gratuito con reserva previa online obligatoria de turno de 15 minutos)', 'Brindis final de despedida con Aperol Spritz con aceituna en Campo Santa Margherita (€5)', 'Traslado en autobús acuático Alilaguna directo hacia el aeropuerto Marco Polo (€15)'],
            tips: ['Reservar el turno de la terraza en la web oficial de DFS Fondaco dei Tedeschi con al menos una semana de antelación'],
            curious_facts: ['El Spritz nació en el siglo XIX cuando los soldados austriacos en Venecia encontraban el vino local demasiado fuerte y pedían que lo rociaran (*spritzen*) con un chorro de agua con gas'],
            suggested_minutes: 150,
            location_info: { address: 'Calle del Fontego dei Tedeschi, Venezia', priceRange: '$ - Terraza gratuita' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-reino-unido-londres-highlands-10d',
    title: 'Reino Unido de Leyenda: De los Palacios de Londres a las Tierras Altas de Escocia',
    country: 'Reino Unido',
    city: 'Londres',
    type: 'family',
    tourScope: 'city_to_city',
    description: 'Aventura legendaria de 10 días para todas las edades. Los tesoros reales y museos gratuitos de Londres, el cambio de guardia, la misteriosa Torre de Londres, el tren expreso a Edimburgo con su castillo sobre roca volcánica, y la búsqueda de Nessie en las Tierras Altas de Escocia.',
    cover_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 14400,
    distance_meters: 890000,
    difficulty: 'moderate',
    rating: 4.95,
    review_count: 185,
    likes_count: 610,
    tags: ['Reino Unido', 'Londres', 'Escocia', 'Edimburgo', 'Loch Ness', 'Castillos', 'Highlands', 'Familiar'],
    recommended_audience: ['Familias', 'Amantes de la historia británica', 'Fans de leyendas y castillos'],
    best_season: 'Mayo a Septiembre (días largos con hasta 17 horas de luz y temperaturas amables)',
    recommended_schedule: 'Museos y palacios por la mañana; paseos por parques reales por la tarde',
    meeting_point: 'Big Ben / Westminster Bridge, Londres',
    includes: ['Ruta completa de Londres y conexión a Escocia en tren LNER', 'Ubicación de museos con entrada gratuita', 'Itinerario por el Lago Ness y Castillo de Urquhart'],
    excludes: ['Boleto de tren Londres King\'s Cross - Edimburgo', 'Entrada al Castillo de Edimburgo y Torre de Londres', 'Paseo en barco por Loch Ness'],
    recommendations: ['En Londres casi todos los museos nacionales principales (British Museum, Natural History, Science) son 100% de entrada gratuita', 'Usar tarjeta contactless o smartphone para el metro de Londres (Oyster cap)'],
    what_to_bring: ['Chaqueta impermeable ligera', 'Ropa por capas', 'Zapatos cómodos para caminar', 'Adaptador de enchufe británico (tipo G)'],
    tour_rules: ['No tocar las joyas de la corona en la Torre de Londres'],
    budget: { currency: 'GBP', estimatedPerPersonMin: 800, estimatedPerPersonMax: 1600, notes: 'Torre de Londres (~£34), Castillo de Edimburgo (~£19.50), tren LNER (~£45-£75) y gastronomía británica' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Londres Real: Big Ben, Abadía de Westminster y Buckingham',
        notes: 'El corazón de la monarquía británica y el río Támesis.',
        stops: [
          {
            stop_order: 1,
            name: 'Big Ben, Abadía de Westminster y Palacio de Buckingham',
            latitude: 51.5007,
            longitude: -0.1246,
            image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'],
            description: 'El reloj más famoso del planeta integrado en el Parlamento británico junto al Támesis. A unos pasos se erige la Abadía de Westminster donde han sido coronados los reyes desde Guillermo el Conquistador en 1066. Por Saint James\'s Park se llega al Palacio de Buckingham.',
            activities: ['Fotografiar el Big Ben desde el puente de Westminster (Gratis)', 'Presenciar el Cambio de Guardia en Buckingham a las 11:00 AM en días programados (Gratis)', 'Almorzar Fish & Chips tradicional con puré de guisantes en un pub histórico (£14 - £20)'],
            tips: ['Revisar el calendario oficial del Cambio de Guardia antes de ir; no se celebra todos los días en invierno'],
            curious_facts: ['Big Ben no es el nombre de la torre ni del reloj, sino el apodo de la campana mayor de 13.7 toneladas que marca las horas en su interior'],
            suggested_minutes: 210,
            location_info: { address: 'Westminster, London SW1A', priceRange: '$ - Acceso exterior libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Joyas de la Corona en la Torre de Londres y Tower Bridge',
        notes: 'Mil años de historia feudal, cuervos sagrados y el puente levadizo victoriano.',
        stops: [
          {
            stop_order: 1,
            name: 'Torre de Londres y Puente de la Torre (Tower Bridge)',
            latitude: 51.5081,
            longitude: -0.0759,
            image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'],
            description: 'Fortaleza medieval construida en 1078 por Guillermo el Conquistador que ha servido de palacio real, prisión y lugar de ejecuciones como la de Ana Bolena. Custodia las deslumbrantes Joyas de la Corona de la monarquía británica.',
            activities: ['Ver la corona imperial de Estado y el cetro con el diamante Cullinan I (Entrada: £34.80 adulto)', 'Hacer el tour guiado por los alabarderos ceremoniales vestidos de rojo conocidos como Yeoman Warders / Beefeaters (Incluido con entrada)', 'Cruzar la pasarela peatonal de cristal a 42 metros de altura sobre el Tower Bridge (£12.30)'],
            tips: ['Llegar a la apertura a las 9:00 AM e ir directamente a la sala de las Joyas de la Corona para no hacer fila'],
            curious_facts: ['Cuenta la leyenda que si los seis cuervos residentes abandonan la Torre de Londres, la fortaleza caerá y con ella la corona y el Imperio británico'],
            suggested_minutes: 240,
            location_info: { address: 'Tower of London, London EC3N 4AB', priceRange: '$$ - Entrada £34.80' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Museo Británico y Covent Garden',
        notes: 'La Piedra de Rosetta, momias egipcias y teatro callejero.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo Británico (British Museum) y Covent Garden',
            latitude: 51.5194,
            longitude: -0.1270,
            image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'],
            description: 'Uno de los museos más extraordinarios de la humanidad bajo una colosal cúpula de cristal y acero. Custodia la Piedra de Rosetta que permitió descifrar los jeroglíficos egipcios, esculturas del Partenón y momias faraónicas.',
            activities: ['Ver la auténtica Piedra de Rosetta que descifró Champollion (Entrada: Gratuita para todos)', 'Asombrarse con las esculturas colosales de los toros alados asirios (Gratis)', 'Disfrutar de los espectáculos callejeros y mercadillos en la plaza techada de Covent Garden (Gratis)'],
            tips: ['Aunque la entrada es gratis, es recomendable reservar el ticket horario gratuito en la web oficial para asegurar entrada rápida'],
            curious_facts: ['La Gran Corte techada del museo diseñada por Norman Foster es la plaza pública cubierta más grande de Europa'],
            suggested_minutes: 210,
            location_info: { address: 'Great Russell St, London WC1B', priceRange: '$ - Entrada gratuita' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Tren Expreso a Edimburgo (LNER) y la Milla Real',
        notes: 'Viaje en tren a través de la costa inglesa hacia la capital de Escocia.',
        stops: [
          {
            stop_order: 1,
            name: 'Viaje en Tren y la Royal Mile de Edimburgo',
            latitude: 55.9505,
            longitude: -3.1905,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Salida en tren rápido LNER desde London King\'s Cross (donde está el andén 9 ¾ de Harry Potter) hacia Edimburgo (4 horas y 20 minutos con vistas al Mar del Norte). La Royal Mile es la arteria empedrada medieval que une el castillo con el palacio real.',
            activities: ['Foto en el Carrito de Harry Potter en King\'s Cross antes de abordar el tren (Gratis)', 'Caminar por la Royal Mile escuchando a gaiteros escoceses vestidos con kilt tradicional (Gratis)', 'Cena de estofado tradicional escocés o haggis con puré de nabos y patatas (£15 - £24)'],
            tips: ['Reservar asiento en el lado derecho del tren en sentido de marcha para contemplar los acantilados marinos de Northumberland'],
            curious_facts: ['Edimburgo fue la primera ciudad del mundo en tener su propio cuerpo de bomberos municipal formal en 1824'],
            suggested_minutes: 240,
            location_info: { address: 'Royal Mile, Old Town, Edinburgh', priceRange: '$$ - Tren LNER' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: El Castillo de Edimburgo y Calton Hill',
        notes: 'La fortaleza sobre la roca volcánica y vistas de la Ciudad Vieja y Nueva.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Edimburgo y Colina de Calton Hill',
            latitude: 55.9486,
            longitude: -3.1999,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Inexpugnable fortaleza erigida en lo alto de Castle Rock, un tapón volcánico extinto de 700 millones de años que domina la ciudad. Custodia las Joyas de la Corona escocesa (los Honores de Escocia) y la milenaria Piedra del Destino.',
            activities: ['Ver el disparo tradicional del cañón de la una en punto (One O\'Clock Gun) que se realiza desde 1861 (Entrada: £19.50)', 'Ver la mítica Piedra de Scone sobre la que eran coronados los reyes escoceses (Gratis con entrada)', 'Subir a Calton Hill al atardecer para la postal panorámica clásica con el monumento a Dugald Stewart (Gratis)'],
            tips: ['Reservar el boleto online del castillo con antelación porque suele agotarse en verano'],
            curious_facts: ['El castillo de Edimburgo ostenta el récord de haber sido el lugar más asediado militarmente de Gran Bretaña con 26 asedios documentados en su historia'],
            suggested_minutes: 240,
            location_info: { address: 'Castlehill, Edinburgh EH1 2NG', priceRange: '$$ - Entrada £19.50' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Hacia las Highlands: El Valle Sagrado de Glen Coe',
        notes: 'Las montañas volcánicas más dramáticas y cinematográficas de Escocia.',
        stops: [
          {
            stop_order: 1,
            name: 'Valle de Glen Coe y las Tres Hermanas (Three Sisters)',
            latitude: 56.6826,
            longitude: -5.1023,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Un valle glaciar colosal esculpido por erupciones volcánicas y glaciares. Escenario de películas como James Bond (*Skyfall*) y *Harry Potter*. Las Tres Hermanas son tres imponentes crestas rocosas que caen a plomo sobre el valle.',
            activities: ['Parada fotográfica en el mirador de las Three Sisters (Gratis)', 'Caminata corta por los senderos de turba y cascadas de montaña (Gratis)', 'Degustación de whisky escocés de malta en una destilería de montaña (£8 - £15)'],
            tips: ['Llevar calzado impermeable de trekking; el suelo de turba en las Highlands siempre está húmedo'],
            curious_facts: ['Glen Coe fue escenario de la trágica Masacre de Glencoe de 1692, donde el clan Campbell traicionó y asesinó a sus anfitriones del clan MacDonald'],
            suggested_minutes: 180,
            location_info: { address: 'Glen Coe, Ballachulish', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: El Mítico Lago Ness y el Castillo de Urquhart',
        notes: 'Las ruinas de la fortaleza frente a las aguas oscuras y la leyenda de Nessie.',
        stops: [
          {
            stop_order: 1,
            name: 'Loch Ness y Castillo de Urquhart',
            latitude: 57.3241,
            longitude: -4.4423,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'El lago de agua dulce con mayor volumen de las islas británicas (contiene más agua que todos los lagos de Inglaterra y Gales juntos). En un promontorio sobre sus oscuras aguas de turba se alzan las ruinas del castillo medieval de Urquhart.',
            activities: ['Paseo en barco con sonar de detección submarina por el lago (£16 - £25)', 'Explorar la torre de cinco pisos del Castillo de Urquhart (Entrada: £13)', 'Visita al Loch Ness Centre & Exhibition para conocer la leyenda del monstruo (£9)'],
            tips: ['El agua del lago es negra como el café debido al alto contenido de turba en suspensión'],
            curious_facts: ['La primera mención escrita sobre un monstruo en el lago data del año 565 d.C. en la biografía de San Columba'],
            suggested_minutes: 240,
            location_info: { address: 'Drumnadrochit, Inverness', priceRange: '$$ - Castillo y barco' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Viaducto de Glenfinnan: El Tren de Harry Potter',
        notes: 'El tren a vapor Jacobite cruzando el colosal viaducto de 21 arcos.',
        stops: [
          {
            stop_order: 1,
            name: 'Viaducto de Glenfinnan y Monumento Jacobita',
            latitude: 56.8763,
            longitude: -5.4316,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Impresionante viaducto ferroviario curvo de hormigón de 21 arcos construido en 1901. Famoso en todo el mundo por las películas de Harry Potter, donde el Expreso de Hogwarts lo cruza rodeado de lagos y montañas.',
            activities: ['Subir al sendero mirador de la colina para ver pasar el tren a vapor Jacobite soltando humo blanco (Gratis - pasa sobre las 10:45 AM y 3:15 PM)', 'Visitar el monumento a la rebelión jacobita de Bonnie Prince Charlie a orillas del Loch Shiel (Gratis)', 'Tomar té con scones en el antiguo vagón restaurante de la estación (£7)'],
            tips: ['Llegar al sendero mirador al menos 40 minutos antes del paso del tren para encontrar buen sitio'],
            curious_facts: ['El viaducto fue uno de los primeros del mundo construidos enteramente con hormigón en masa sin refuerzo de varillas de acero'],
            suggested_minutes: 180,
            location_info: { address: 'Glenfinnan, Highland PH37 4LT', priceRange: '$ - Mirador gratuito' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Castillo de Stirling: El Corazón de William Wallace',
        notes: 'La llave de Escocia donde se forjó la leyenda de Braveheart.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Stirling y Monumento a William Wallace',
            latitude: 56.1235,
            longitude: -3.9460,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Palacio fortaleza donde fue coronada la reina María Estuardo de Escocia. Emplazado sobre un risco volcánico inexpugnable que controla el cruce del río Forth. Cerca se alza la torre neogótica en memoria del héroe William Wallace.',
            activities: ['Recorrido por el Gran Salón Dorado y los aposentos reales renacentistas (Entrada: £16.50)', 'Ver la enorme espada de combate de 1.68 metros atribuida a William Wallace en su monumento (£10.50)', 'Almuerzo tradicional en una taberna histórica de Stirling (£15)'],
            tips: ['Stirling queda a medio camino entre las Highlands y Edimburgo, siendo parada obligada'],
            curious_facts: ['En la batalla del Puente de Stirling de 1297, William Wallace derrotó a un ejército inglés muy superior aprovechando el estrecho paso de madera del puente'],
            suggested_minutes: 200,
            location_info: { address: 'Castle Wynd, Stirling FK8 1EJ', priceRange: '$$ - Entrada castillo' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Retorno a Edimburgo / Londres y Despedida Británica',
        notes: 'Últimas compras de tartán de cachemira y té tradicional antes del vuelo.',
        stops: [
          {
            stop_order: 1,
            name: 'Princes Street Gardens y Despedida',
            latitude: 55.9500,
            longitude: -3.2000,
            image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'],
            description: 'Jardines victorianos que separan la Ciudad Vieja de la Ciudad Nueva con vista directa a la muralla del castillo. El lugar ideal para pasear antes de tomar el tranvía hacia el aeropuerto.',
            activities: ['Comprar bufandas de lana pura de cordero o cachemira con tartán de clan (£20 - £45)', 'Tomar el té de la tarde inglés (Afternoon Tea) con sándwiches y pastas (£22 - £35)', 'Tranvía directo al aeropuerto de Edimburgo (£7.50 / 30 minutos)'],
            tips: ['Conservar los comprobantes de compra si aplica a devolución de impuestos'],
            curious_facts: ['Donde hoy están los tranquilos jardines de Princes Street existió antiguamente el Nor Loch, un lago pantanoso artificial usado como foso defensivo'],
            suggested_minutes: 120,
            location_info: { address: 'Princes St, Edinburgh', priceRange: '$ - Compras locales' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-la-gran-espana-madrid-andalucia-barcelona-12d',
    title: 'La Gran España Monumental: De Madrid a Andalucía y el Genio de Gaudí',
    country: 'España',
    city: 'Madrid',
    type: 'cultural',
    tourScope: 'city_to_city',
    description: 'La gran travesía española de 12 días en trenes de alta velocidad AVE. El Madrid de los Austrias y el Museo del Prado, la ciudad de las tres culturas en Toledo, el duende del flamenco y la Giralda en Sevilla, la magia nazarí de la Alhambra de Granada y la culminación modernista de la Sagrada Familia de Gaudí en Barcelona.',
    cover_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 17280,
    distance_meters: 1400000,
    difficulty: 'moderate',
    rating: 4.99,
    review_count: 290,
    likes_count: 940,
    tags: ['España', 'Madrid', 'Toledo', 'Sevilla', 'Granada', 'Alhambra', 'Barcelona', 'Sagrada Familia', 'AVE'],
    recommended_audience: ['Viajeros culturales', 'Amantes de la gastronomía y el vino', 'Exploradores del patrimonio'],
    best_season: 'Marzo a Junio y Septiembre a Noviembre (clima primaveral idóneo para Andalucía)',
    recommended_schedule: 'Tours matutinos de palacios y tarde/noche de tapeo y tablaos de flamenco',
    meeting_point: 'Puerta del Sol (Kilómetro Cero), Madrid',
    includes: ['Ruta completa conectada por trenes AVE de Renfe', 'Ubicación de monumentos y taquillas oficiales', 'Guía de barrios de tapeo tradicional'],
    excludes: ['Boleto oficial a la Alhambra de Granada (reserva indispensable)', 'Entrada a la Sagrada Familia de Barcelona', 'Billetes de tren AVE'],
    recommendations: ['Comprar la entrada a la Alhambra con 2 meses de anticipación; las entradas a los Palacios Nazaríes son nominativas con DNI/pasaporte', 'Disfrutar del rito del tapeo: pedir una caña o vino y disfrutar de la tapa'],
    what_to_bring: ['Calzado cómodo para empedrado y cuestas', 'Gorra y gafas de sol', 'Pasaporte físico original para ingresar a la Alhambra'],
    tour_rules: ['Cumplir estrictamente el horario de media hora asignado para entrar a los Palacios Nazaríes en Granada'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 900, estimatedPerPersonMax: 1900, notes: 'Museo del Prado, Alhambra (€19), Sagrada Familia (€26), trenes AVE y gastronomía de tapas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: El Madrid de los Austrias: Plaza Mayor y Palacio Real',
        notes: 'El corazón castizo y el palacio real más grande de Europa Occidental.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza Mayor, Puerta del Sol y Palacio Real de Madrid',
            latitude: 40.4155,
            longitude: -3.7074,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'La histórica Plaza Mayor porticada con la estatua ecuestre de Felipe III, la Puerta del Sol con el Oso y el Madroño, y el monumental Palacio Real con más de 3.400 estancias suntuosas de la corte española.',
            activities: ['Foto en el Kilómetro Cero de las carreteras radiales de España en Puerta del Sol (Gratis)', 'Visita a los salones oficiales, Salón del Trono y Real Armería del Palacio Real (Entrada: €14)', 'Probar el castizo bocadillo de calamares con una caña bien tirada en la Plaza Mayor (€4.50)'],
            tips: ['La chocolatería San Ginés de 1894 queda a 2 minutos de la plaza; abierta 24 horas para churros con chocolate caliente'],
            curious_facts: ['El Palacio Real de Madrid duplica en superficie al Palacio de Versalles o al de Buckingham, siendo el mayor palacio real en funcionamiento de Europa'],
            suggested_minutes: 210,
            location_info: { address: 'Calle de Bailén s/n, Madrid', priceRange: '$ - Entrada palacio €14' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Triángulo del Arte: Museo del Prado y Parque del Retiro',
        notes: 'Las Meninas de Velázquez, Goya, el Jardín de las Delicias y el Palacio de Cristal.',
        stops: [
          {
            stop_order: 1,
            name: 'Museo Nacional del Prado y Parque de El Retiro',
            latitude: 40.4138,
            longitude: -3.6921,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las pinacotecas más sublimes del planeta (Paisaje de la Luz, UNESCO). Custodia obras cumbres como "Las Meninas" de Velázquez, las Pinturas Negras de Goya y el tríptico de El Bosco. Al lado, el señorial Parque del Retiro con su estanque y Palacio de Cristal.',
            activities: ['Admirar "Las Meninas" y "El 3 de mayo en Madrid" (Entrada general: €15 / gratis de lunes a sábado de 18:00 a 20:00)', 'Paseo en barca de remos por el estanque grande de El Retiro (€6 - €8)', 'Fotografiar el Palacio de Cristal rodeado de cipreses calvos en el agua (Gratis)'],
            tips: ['El Prado es inmenso; solicitar en la entrada el plano gratuito de las "50 obras maestras" para optimizar el recorrido'],
            curious_facts: ['Durante la Guerra Civil española, las obras más valiosas del Prado fueron evacuadas en camiones protegidas con colchones hasta Ginebra para salvarlas de los bombardeos'],
            suggested_minutes: 240,
            location_info: { address: 'Paseo del Prado s/n, Madrid', priceRange: '$$ - Entrada €15' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Toledo: La Ciudad Imperial de las Tres Culturas',
        notes: 'Convivencia histórica de cristianos, musulmanes y judíos sobre el Tajo.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral Primada de Toledo y Mirador del Valle',
            latitude: 39.8571,
            longitude: -4.0244,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'Antigua capital de España rodeada por un meandro del río Tajo. Su catedral gótica es una de las más ricas del orbe católico. Sus callejones empinados albergan sinagogas medievales, mezquitas califales y tiendas de espadas de acero toledano.',
            activities: ['Tren Avant de alta velocidad desde Madrid Atocha a Toledo (33 minutos - €14 ida)', 'Visita a la Catedral Primada y su sacristía con cuadros originales de El Greco (Entrada: €10)', 'Vista panorámica inolvidable de la ciudad amurallada desde el Mirador del Valle (Gratis)'],
            tips: ['Tomar un taxi o el autobús turístico hasta el Mirador del Valle para la foto de postal completa de la ciudad sobre el río'],
            curious_facts: ['Toledo fue el taller de armas blancas más reputado de Europa; el acero toledano era templado en las aguas del río Tajo con una técnica secreta legendaria'],
            suggested_minutes: 240,
            location_info: { address: 'Plaza del Consistorio 1, Toledo', priceRange: '$$ - Tren Avant y catedral' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: AVE a Sevilla: La Giralda y el Real Alcázar',
        notes: 'Llegada a Andalucía: arte mudéjar, azulejos y palacios de reyes.',
        stops: [
          {
            stop_order: 1,
            name: 'Catedral de Sevilla, La Giralda y Real Alcázar',
            latitude: 37.3858,
            longitude: -5.9931,
            image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            description: 'El AVE conecta Madrid con Sevilla en solo 2 horas y 30 minutos. La Catedral de Sevilla es la catedral gótica más grande del mundo, con la tumba de Cristóbal Colón. La Giralda, antiguo alminar almohade, y el Real Alcázar con sus jardines y palacios de yeserías mudéjares.',
            activities: ['Subir las 35 rampas de la Giralda para contemplar Sevilla a vista de pájaro (Entrada catedral + Giralda: €12)', 'Visitar el Palacio de Don Pedro I y los Baños de Doña María de Padilla en el Real Alcázar (€14.50)', 'Tardeo de tapas por el laberíntico Barrio de Santa Cruz: salmorejo, jamón ibérico de bellota y espinacas con garbanzos (€15 - €25)'],
            tips: ['La Giralda no tiene escalones sino rampas para que el sultán pudiera subir a caballo'],
            curious_facts: ['El Real Alcázar es el palacio real en uso más antiguo de Europa y sirvió como los Jardines del Agua de Dorne en la serie *Juego de Tronos*'],
            suggested_minutes: 270,
            location_info: { address: 'Patio de Banderas s/n, Sevilla', priceRange: '$$ - Entradas históricas' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Plaza de España, Parque de María Luisa y Noche de Flamenco',
        notes: 'El monumento regionalista más grandioso de España y el duende gitano en Triana.',
        stops: [
          {
            stop_order: 1,
            name: 'Plaza de España y Tablao Flamenco en Triana',
            latitude: 37.3772,
            longitude: -5.9869,
            image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra maestra de Aníbal González para la Exposición Iberoamericana de 1929 con 50.000 m² de arquerías semicirculares, azulejos de todas las provincias de España y un canal navegable con 4 puentes de cerámica.',
            activities: ['Alquilar una barquita de remos en el canal de la Plaza de España (€6)', 'Fotografiar los bancos de azulejos de cerámica de su provincia favorita (Gratis)', 'Espectáculo de flamenco auténtico en vivo con cante jondo y baile en Triana (€25 - €40)'],
            tips: ['La Plaza de España apareció en películas como *Star Wars: El Ataque de los Clones* como el palacio del planeta Naboo'],
            curious_facts: ['Los cuatro puentes que cruzan el canal representan los cuatro antiguos reinos que formaron la Corona de España: Castilla, León, Aragón y Navarra'],
            suggested_minutes: 210,
            location_info: { address: 'Avenida de Isabel la Católica, Sevilla', priceRange: '$$ - Acceso plaza libre + tablao' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Hacia Granada: La Magia Nazarí de la Alhambra',
        notes: 'El Patio de los Leones, el Generalife y las celosías del reino nazarí.',
        stops: [
          {
            stop_order: 1,
            name: 'La Alhambra de Granada y Palacios Nazaríes',
            latitude: 37.1773,
            longitude: -3.5897,
            image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            description: 'El palacio fortaleza hispanomusulmán más hermoso del mundo erigido sobre la colina de la Sabika frente a las cumbres nevadas de Sierra Nevada. Destaca el Patio de los Leones, el Salón de Embajadores con techos de mocárabes y los jardines del Generalife.',
            activities: ['Recorrido por los Palacios Nazaríes respetando la franja horaria impresa en el boleto (Entrada general: €19.09)', 'Pasear entre las fuentes y cipreses del Generalife (Gratis con entrada)', 'Subir a la Torre de la Vela en la Alcazaba militar para vista panorámica del Albaicín'],
            tips: ['Llevar el pasaporte o documento de identidad físico original; se escanea en varios puntos de acceso interno del recinto'],
            curious_facts: ['Las inscripciones caligráficas en árabe grabadas en los muros de yeso repiten miles de veces la frase: *Wa-la galiba illa-Llah* ("No hay vencedor sino Alá")'],
            suggested_minutes: 270,
            location_info: { address: 'Calle Real de la Alhambra s/n, Granada', priceRange: '$$ - Entrada oficial €19' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: El Albaicín, Mirador de San Nicolás y Tradición de Tapas',
        notes: 'El atardecer más famoso del mundo y tapas gratis con cada consumición.',
        stops: [
          {
            stop_order: 1,
            name: 'Mirador de San Nicolás y Barrio del Albaicín',
            latitude: 37.1811,
            longitude: -3.5927,
            image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            description: 'Antiguo barrio musulmán de casas blancas con jardines interiores (*cármenes*), aljibes y olor a jazmín. El mirador de San Nicolás ofrece la postal legendaria de la Alhambra con el telón de fondo de Sierra Nevada.',
            activities: ['Ver ponerse el sol tiñendo de rojo las murallas de la Alhambra mientras tocan guitarra flamenca (Gratis)', 'Ruta de tapas por Calle Navas o Calle Elvira (en Granada la tapa es gratuita y generosa con cada bebida: €2.80 - €3.50)', 'Tomar un té moruno con hierbabuena y dulces árabes en las teterías de Calderería Nueva (€4 - €7)'],
            tips: ['Bill Clinton declaró en 1997 en San Nicolás que era "la puesta de sol más hermosa del mundo"'],
            curious_facts: ['Granada es una de las pocas ciudades de España donde por ley tradicional cada caña o copa incluye obligatoriamente una tapa caliente gratis a elección'],
            suggested_minutes: 210,
            location_info: { address: 'Plaza Mirador de San Nicolás, Granada', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Mezquita-Catedral de Córdoba y AVE a Barcelona',
        notes: 'El bosque de 850 columnas bicolores y viaje en alta velocidad a Cataluña.',
        stops: [
          {
            stop_order: 1,
            name: 'Mezquita-Catedral de Córdoba y Calleja de las Flores',
            latitude: 37.8789,
            longitude: -4.7794,
            image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            description: 'Parada en la joya del Califato omeya. Un laberinto sagrado de más de 850 columnas de jaspe, granito y mármol unidas por arcos dobles de herradura bicolores rojo y blanco, en cuyo centro se levantó la catedral renacentista.',
            activities: ['Perderse en el bosque de columnas y admirar el Mihrab dorado califal (Entrada: €13)', 'Fotografiar la torre campanario enmarcada por geranios en la Calleja de las Flores (Gratis)', 'Tren AVE directo desde Córdoba a Barcelona Sants (4 horas y 40 minutos en alta velocidad cruzando media España - €45 - €85)'],
            tips: ['Dejar el equipaje en las consignas de la estación de tren de Córdoba mientras se visita la mezquita (a 15 minutos a pie)'],
            curious_facts: ['El emperador Carlos V, al ver la catedral construida dentro de la mezquita, exclamó: "Habéis destruido lo que era único en el mundo para construir lo que se puede ver en cualquier parte"'],
            suggested_minutes: 240,
            location_info: { address: 'Calle del Cardenal Herrero 1, Córdoba', priceRange: '$$ - Entrada mezquita y AVE' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Barcelona de Gaudí: La Sagrada Familia y Paseo de Gracia',
        notes: 'El templo expiatorio que toca el cielo y las casas modernistas.',
        stops: [
          {
            stop_order: 1,
            name: 'Basílica de la Sagrada Familia, Casa Batlló y La Pedrera',
            latitude: 41.4036,
            longitude: 2.1744,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'La obra cumbre inacabada de Antoni Gaudí iniciada en 1882. Su interior es un bosque de columnas ramificadas como árboles de piedra con vitrales que inundan el espacio de luz arcoíris. En el Paseo de Gracia, la Casa Batlló con su tejado de dragón y Casa Milà (La Pedrera).',
            activities: ['Visitar el interior de la Sagrada Familia y sus torres (Entrada con audioguía: €26 / con torres: €36)', 'Fotografiar las fachadas onduladas de Casa Batlló y La Pedrera en Paseo de Gracia (Gratis exterior)', 'Probar pan con tomate (pa amb tomàquet) y embutidos ibéricos en una bodega modernista (€15 - €25)'],
            tips: ['Comprar la entrada a la Sagrada Familia con semanas de anticipación en la app oficial; no hay taquillas de venta en el templo'],
            curious_facts: ['Gaudí sabía que no vería terminada la basílica en vida y solía decir: "Mi cliente (Dios) no tiene prisa"'],
            suggested_minutes: 270,
            location_info: { address: 'Carrer de Mallorca 401, Barcelona', priceRange: '$$$ - Entrada €26' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Park Güell y Vistas del Mediterráneo',
        notes: 'El dragón de trencadís y el mirador ondulado sobre toda Barcelona.',
        stops: [
          {
            stop_order: 1,
            name: 'Park Güell y el Dragón de Mosaicos',
            latitude: 41.4145,
            longitude: 2.1527,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'Parque público monumental donde la naturaleza y la arquitectura orgánica de Gaudí se funden. La escalinata con la famosa salamandra (*El Drac*) hecha de fragmentos de cerámica rota (*trencadís*) y el banco ondulado panorámico con vista a la ciudad y el mar.',
            activities: ['Foto con la salamandra de mosaicos en la escalinata principal (Entrada zona monumental: €10)', 'Sentarse en el banco ergonómico ondulado de la Plaza de la Naturaleza (Gratis con entrada)', 'Pasear por el viaducto de columnas inclinadas de piedra natural (Gratis con entrada)'],
            tips: ['Llegar en metro L3 (estación Lesseps o Vallcarca) y subir las escaleras mecánicas hacia el parque'],
            curious_facts: ['Originalmente el proyecto estaba planeado como una urbanización privada residencial de lujo para la burguesía catalana, pero fracasó comercialmente y se convirtió en parque público'],
            suggested_minutes: 180,
            location_info: { address: '08024 Barcelona', priceRange: '$ - Entrada €10' }
          }
        ]
      },
      {
        day_number: 11,
        title: 'Día 11: Barrio Gótico, El Born y el Mercado de La Boquería',
        notes: 'Callejuelas medievales, restos romanos y el templo gastronómico de Las Ramblas.',
        stops: [
          {
            stop_order: 1,
            name: 'Barrio Gótico, Catedral de Santa Eulalia y Mercado de la Boquería',
            latitude: 41.3833,
            longitude: 2.1750,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'El núcleo más antiguo de Barcelona con restos de murallas romanas y palacios góticos como la Plaza del Rey. Al cruzar Las Ramblas se accede a La Boquería, célebre mercado de mariscos frescos, jamones y zumos exóticos.',
            activities: ['Caminar por el Puente del Obispo en la calle del Bisbe y buscar la calavera esculpida (Gratis)', 'Visitar el claustro de la Catedral de Barcelona con sus 13 ocas blancas sagradas (€9)', 'Probar tapas de mariscos al momento en los bares de taburete de La Boquería (€18 - €30)'],
            tips: ['Cuidar bolsos y móviles en Las Ramblas y zonas concurridas de La Boquería'],
            curious_facts: ['Las 13 ocas del claustro de la catedral conmemoran los 13 años que tenía la patrona Santa Eulalia cuando fue martirizada'],
            suggested_minutes: 210,
            location_info: { address: 'La Rambla 91 / Pla de la Seu, Barcelona', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 12,
        title: 'Día 12: Playas de la Barceloneta y Despedida Mediterránea',
        notes: 'Paseo marítimo, arroz marinero frente al mar y traslado al aeropuerto.',
        stops: [
          {
            stop_order: 1,
            name: 'Paseo Marítimo de la Barceloneta y Hotel W',
            latitude: 41.3780,
            longitude: 2.1920,
            image_url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80'],
            description: 'Antiguo barrio marinero con playas urbanas de arena dorada, esculturas públicas frente al mar y restaurantes donde saborear una auténtica paella de mariscos con sangría.',
            activities: ['Paseo a pie o en bicicleta por el paseo marítimo hasta la torre en forma de vela del Hotel W (Gratis)', 'Almuerzo de despedida: paella marinera con gambas y mejillones (€22 - €35)', 'Tomar el tren Aeroport R2 Nord desde Passeig de Gràcia o Aerobús hacia la T1/T2 (€6.75)'],
            tips: ['El Aerobús sale cada 5 minutos desde Plaza Cataluña y llega al aeropuerto El Prat en 35 minutos'],
            curious_facts: ['Las playas de Barcelona no existían como tales hasta antes de los Juegos Olímpicos de 1992, cuando la ciudad derribó viejas naves industriales para abrirse completamente al mar'],
            suggested_minutes: 150,
            location_info: { address: 'Passeig Marítim de la Barceloneta', priceRange: '$$ - Almuerzo paella' }
          }
        ]
      }
    ]
  }
]
