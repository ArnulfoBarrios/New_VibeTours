// Tours 24 - 30: Asia, Medio Oriente, África y Oceanía (5 a 14 días)
export const worldTours = [
  {
    slug: 'vibetour-dubai-abu-dhabi-nocturno-5d',
    title: 'Dubái & Abu Dhabi de Vanguardia: Rascacielos Iluminados y Desierto',
    country: 'Emiratos Árabes Unidos',
    city: 'Dubái',
    type: 'night',
    tourScope: 'city_to_city',
    description: 'Experiencia deslumbrante de 5 días en los Emiratos Árabes Unidos. Vistas desde el rascacielos más alto del planeta (Burj Khalifa), el espectáculo nocturno de fuentes danzantes, safari por las dunas al atardecer y la majestuosidad marmórea de la Mezquita Sheikh Zayed en Abu Dhabi.',
    cover_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 7200,
    distance_meters: 180000,
    difficulty: 'easy',
    rating: 4.96,
    review_count: 160,
    likes_count: 510,
    tags: ['Dubái', 'Abu Dhabi', 'Burj Khalifa', 'Lujo', 'Nocturno', 'Rascacielos', 'Desierto'],
    recommended_audience: ['Viajeros modernos', 'Amantes de la arquitectura futurista', 'Parejas'],
    best_season: 'Noviembre a Marzo (invierno árabe con agradables 22-28°C)',
    recommended_schedule: 'Tardes y noches para aprovechar el encendido de luces y evitar el calor diurno',
    meeting_point: 'Dubai Mall / Explanada del Burj Khalifa, Dubái',
    includes: ['Ruta completa en Dubái y Abu Dhabi', 'Guía de observación de fuentes danzantes', 'Horarios de mezquitas y miradores'],
    excludes: ['Boleto a la cima del Burj Khalifa (piso 124/125)', 'Safari en 4x4 por el desierto', 'Transporte privado'],
    recommendations: ['En la Mezquita de Abu Dhabi las mujeres deben llevar túnica abaya que cubra cabello, brazos y tobillos (se puede alquilar o comprar en el centro comercial de acceso)', 'Para el Burj Khalifa reservar horario de puesta de sol (5:00 PM) con semanas de antelación'],
    what_to_bring: ['Ropa elegante para la noche', 'Ropa respetuosa para templos', 'Gafas de sol', 'Cámara con buen rendimiento nocturno'],
    tour_rules: ['Respetar las leyes locales sobre muestras públicas de afecto y consumo de alcohol en lugares autorizados'],
    budget: { currency: 'AED', estimatedPerPersonMin: 900, estimatedPerPersonMax: 2200, notes: 'Burj Khalifa (~179 AED), safari desierto (~180 AED), taxi/metro y cenas con vistas' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: El Gigante del Mundo: Burj Khalifa y Fuentes de Dubái',
        notes: 'Ascenso al piso 124 a 452 metros y espectáculo de chorros de agua iluminados.',
        stops: [
          {
            stop_order: 1,
            name: 'Burj Khalifa y The Dubai Fountain',
            latitude: 25.1972,
            longitude: 55.2744,
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            description: 'El rascacielos más alto del planeta con 828 metros de altura. En su base se extiende un lago artificial donde el sistema de fuentes coreografiadas más grande del mundo lanza chorros de 150 metros al compás de música árabe y clásica con miles de luces LED.',
            activities: ['Subir en el ascensor ultrarrápido al mirador At the Top piso 124/125 (Entrada: ~179 AED / ~$48 USD)', 'Ver el show de fuentes sincronizadas que se celebra gratis cada 30 minutos a partir de las 6:00 PM (Gratis)', 'Cenar shawarma gourmet o mariscos en las terrazas de Souk Al Bahar frente al espectáculo (80 - 160 AED)'],
            tips: ['Los mejores sitios gratuitos para ver las fuentes son el puente que cruza a Souk Al Bahar y la terraza de Apple Dubai Mall'],
            curious_facts: ['Los ascensores del Burj Khalifa suben a 10 metros por segundo (36 km/h), tardando solo 60 segundos en llegar al piso 124'],
            suggested_minutes: 240,
            location_info: { address: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai', priceRange: '$$$ - Mirador y cenas' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Marina de Dubái Iluminada y Playa de JBR',
        notes: 'Canal artificial rodeado de rascacielos iluminados y paseo costero.',
        stops: [
          {
            stop_order: 1,
            name: 'Dubai Marina Walk y Ain Dubai',
            latitude: 25.0805,
            longitude: 55.1403,
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            description: 'El puerto deportivo artificial más grande del mundo flanqueado por más de 200 rascacielos residenciales iluminados de noche. Paseo peatonal de 7 kilómetros bordeado de yates de lujo, lounges al aire libre y la rueda de la fortuna gigante Ain Dubai.',
            activities: ['Crucero nocturno en dhow tradicional de madera con cena buffet navegando por la Marina (120 - 180 AED)', 'Caminar por The Walk en Jumeirah Beach Residence junto a la playa (Gratis)', 'Tomar un cóctel sin alcohol o té helado en un rooftop lounge con vistas panorámicas (45 - 80 AED)'],
            tips: ['Tomar el tranvía de Dubái que conecta la Marina con el metro y la estación de monorraíl de la Palmera'],
            curious_facts: ['La Marina de Dubái fue excavada completamente en el desierto trayendo el agua de mar del Golfo Pérsico a través de un canal de 3 kilómetros'],
            suggested_minutes: 210,
            location_info: { address: 'Dubai Marina Walk, Dubai', priceRange: '$$ - Moderado' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Safari en las Dunas Rojas y Campamento Beduino Nocturno',
        notes: 'Adrenalina en 4x4 al atardecer, cena árabe y estrellas en el desierto.',
        stops: [
          {
            stop_order: 1,
            name: 'Desierto de Al Lahbab (Dunas Rojas) y Campamento',
            latitude: 24.9500,
            longitude: 55.6000,
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            description: 'Expedición hacia el desierto de arena roja en vehículos todoterreno 4x4 practicando *dune bashing* (derrapes sobre dunas de 30 metros). Al anochecer, descanso en un campamento beduino tradicional bajo las estrellas.',
            activities: ['Dune bashing en 4x4 y sandboarding por las dunas rojas (Tour completo con cena: 150 - 250 AED / ~$40 - $68 USD)', 'Paseo en camello al atardecer (Incluido en el safari)', 'Cena barbacoa árabe con espectáculo de danza Tanoura y fuego bajo las estrellas'],
            tips: ['No comer pesado antes del safari en 4x4 para evitar mareos con los movimientos bruscos en las dunas'],
            curious_facts: ['La arena del desierto de Al Lahbab es intensamente roja debido a una alta concentración de óxido de hierro natural en los granos de cuarzo'],
            suggested_minutes: 360,
            location_info: { address: 'Al Lahbab Desert, Dubai', priceRange: '$$ - Safari todo incluido' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Abu Dhabi: La Colosal Gran Mezquita Sheikh Zayed',
        notes: 'Mármol de Carrara blanco, lámparas de cristal de Swarovski y alfombra de récord.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Mezquita Sheikh Zayed y Museo Louvre Abu Dhabi',
            latitude: 24.4128,
            longitude: 54.4750,
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las mezquitas más suntuosas del planeta con 82 cúpulas de mármol blanco, estanques reflectantes y columnas con incrustaciones de nácar y piedras semipreciosas. En la isla Saadiyat, la impresionante cúpula flotante de lluvia de luz del Louvre Abu Dhabi.',
            activities: ['Entrar a la Gran Mezquita y descalzarse sobre la mayor alfombra de nudo hecha a mano del mundo (Entrada gratuita con reserva previa online)', 'Admirar las lámparas de araña de cristal de Swarovski bañado en oro de 24 quilates (Gratis)', 'Visitar el Louvre Abu Dhabi diseñado por Jean Nouvel (Entrada: 63 AED / ~$17 USD)'],
            tips: ['Abu Dhabi queda a 1 hora y 15 minutos en autobús o taxi desde Dubái', 'La mezquita iluminada en tonos azules al anochecer según las fases de la luna es indescriptible'],
            curious_facts: ['La alfombra de la sala principal de oración pesa 35 toneladas y fue tejida a mano por 1.200 artesanas iraníes durante dos años de trabajo'],
            suggested_minutes: 300,
            location_info: { address: 'Al Rawdah, Abu Dhabi', priceRange: '$ - Mezquita gratis' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Dubái Tradicional: Zocos del Oro y las Especias en Deira',
        notes: 'Cruce del canal en barca tradicional abra y despedida cosmopolita.',
        stops: [
          {
            stop_order: 1,
            name: 'Zoco del Oro, Zoco de las Especias y Paseo en Abra',
            latitude: 25.2697,
            longitude: 55.2974,
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            description: 'El contraste con la modernidad: el Dubái antiguo a orillas de la ría Dubai Creek. Escaparates con cientos de kilos de oro macizo de 22 y 24 quilates en el Gold Souk, aromas a azafrán y cardamomo en el Spice Souk, y barcas de madera cruzando el agua.',
            activities: ['Cruzar la ría en una barca de madera tradicional *abra* (Pasaje: 1 AED / ~$0.27 USD)', 'Ver el anillo de oro más pesado del mundo (*Najmat Taiba* de 64 kilos) en el Zoco del Oro (Gratis)', 'Comprar dátiles rellenos de almendra bañados en chocolate y té de azafrán (25 - 60 AED)'],
            tips: ['En los zocos de especias y souvenirs es tradicional y esperado regatear amablemente los precios'],
            curious_facts: ['Todo el oro vendido en el Gold Souk está estrictamente controlado e inspeccionado por el gobierno de Dubái garantizando su autenticidad'],
            suggested_minutes: 180,
            location_info: { address: 'Deira, Al Sabkha, Dubai', priceRange: '$ - Abra 1 AED' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-japon-esencial-tokio-kioto-nara-7d',
    title: 'Japón Esencial: Del Neón Futurista de Tokio a los Santuarios Zen de Kioto',
    country: 'Japón',
    city: 'Tokio',
    type: 'urban',
    tourScope: 'city_to_city',
    description: 'Semana completa que resume la esencia fascinante de Japón. Cruces hipertecnológicos y templos en Tokio, el viaje en tren bala Shinkansen con vistas al Monte Fuji, los diez mil toriis bermellones de Fushimi Inari en Kioto, el bosque de bambú de Arashiyama y los ciervos sagrados libres de Nara.',
    cover_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 10080,
    distance_meters: 580000,
    difficulty: 'moderate',
    rating: 4.99,
    review_count: 275,
    likes_count: 920,
    tags: ['Japón', 'Tokio', 'Kioto', 'Nara', 'Shibuya', 'Fushimi Inari', 'Shinkansen', 'Urbano'],
    recommended_audience: ['Viajeros del mundo', 'Fans de la cultura japonesa', 'Amantes de la gastronomía'],
    best_season: 'Marzo a Mayo (cerezos en flor / Sakura) y Octubre a Noviembre (momiji de otoño)',
    recommended_schedule: 'Templos budistas a primera hora del día (7:30 AM) y barrios de neón por la noche',
    meeting_point: 'Cruce de Shibuya frente a la estatua de Hachiko, Tokio',
    includes: ['Ruta completa conectada por tren bala Shinkansen', 'Guía de transporte con tarjetas Suica / Pasmo', 'Protocolo de templos y santuarios'],
    excludes: ['Boleto de Shinkansen Tokio - Kioto', 'Mirador Shibuya Sky', 'Alquiler de kimono'],
    recommendations: ['Llevar calzado que sea fácil de poner y quitar, ya que en muchos templos y restaurantes tradicionales se entra descalzo', 'Llevar efectivo en yenes (muchas tiendas tradicionales y templos no aceptan tarjetas)'],
    what_to_bring: ['Calcetines limpios y sin roturas', 'Batería externa para el móvil', 'Monedero para monedas japonesas', 'Tarjeta Suica digital en el móvil'],
    tour_rules: ['No comer ni beber mientras se camina por la calle; comer parado junto a la máquina expendedora o local'],
    budget: { currency: 'JPY', estimatedPerPersonMin: 45000, estimatedPerPersonMax: 95000, notes: 'Shinkansen (~14.000 JPY), Shibuya Sky (~2.500 JPY), entradas templos y ramen/sushi' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Tokio Eléctrico: Cruce de Shibuya, Hachiko y Mirador Shibuya Sky',
        notes: 'El cruce peatonal más transitado del mundo y la estatua del perro leal.',
        stops: [
          {
            stop_order: 1,
            name: 'Cruce de Shibuya y Estatua de Hachiko',
            latitude: 35.6595,
            longitude: 139.7005,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'El corazón palpitante del Tokio moderno. Hasta 3.000 personas cruzan simultáneamente en cada cambio de semáforo rodeadas de pantallas gigantescas de neón. Junto a la estación, la entrañable estatua de bronce de Hachiko.',
            activities: ['Cruzar el paso de cebra de Shibuya en diagonal sintiendo la marea humana (Gratis)', 'Foto con la estatua de bronce del perro Hachiko (Gratis)', 'Subir al mirador al aire libre Shibuya Sky en el piso 47 para la vista vertiginosa del cruce (Entrada: ~2.200 - 2.500 JPY / ~$15 USD)'],
            tips: ['Reservar Shibuya Sky en el horario de las 5:00 PM para ver el atardecer y el encendido de los neones nocturnos'],
            curious_facts: ['Hachiko esperó diariamente en esta misma salida de la estación a su dueño, el profesor Ueno, durante casi 10 años después de que este falleciera repentinamente'],
            suggested_minutes: 180,
            location_info: { address: 'Shibuya City, Tokyo 150-0043', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Tradición y Tecnología: Asakusa (Sensō-ji) y Akihabara',
        notes: 'El templo más antiguo de Tokio, faroles rojos gigantes y el reino del anime.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo Sensō-ji y Distrito de Akihabara',
            latitude: 35.7148,
            longitude: 139.7967,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Sensō-ji fue fundado en el año 645 y es el templo budista más venerado de Tokio. Su puerta Kaminarimon luce un farol rojo gigante de 700 kilos. Por la tarde, Akihabara deslumbra con tiendas de electrónica de 8 plantas, manga y figuras de colección.',
            activities: ['Purificarse con el humo de incienso medicinal frente a la pagoda de Sensō-ji (Gratis)', 'Probar dulces tradicionales de melón pan caliente y dango en la calle Nakamise (200 - 500 JPY)', 'Explorar las tiendas de electrónica y recreativas de Akihabara como Mandarake y Radio Kaikan (Gratis)'],
            tips: ['Sacar un papel de la fortuna *Omikuji* en el templo echando una moneda de 100 JPY; si sale mala fortuna se ata a un alambre para dejarla atrás'],
            curious_facts: ['El templo fue erigido después de que dos hermanos pescadores hallaran en el río Sumida una estatua de oro de la diosa Kannon que nunca volvió a sumergirse'],
            suggested_minutes: 240,
            location_info: { address: '2 Chome-3-1 Asakusa, Taito City', priceRange: '$ - Entrada templo gratis' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Santuario Meiji Jingu en el Bosque y Harajuku',
        notes: 'Paz sintoísta entre 100.000 árboles donados y la moda callejera de Takeshita Street.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario Meiji Jingu y Calle Takeshita',
            latitude: 35.6764,
            longitude: 139.6993,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Enorme oasis boscoso de 70 hectáreas en el centro de Tokio. El santuario sintoísta está dedicado al emperador Meiji. A la salida de la estación Harajuku, la calle Takeshita explota con moda juvenil extravagante y crepes dulces gigantes.',
            activities: ['Cruzar bajo el colosal torii de madera de ciprés japonés de 1.500 años (Gratis)', 'Fotografiar el muro ceremonial de barriles de sake decorados donados al emperador (Gratis)', 'Comer una crepe japonesa enrollada con fresas, nata y tarta de queso en Takeshita (600 - 900 JPY)'],
            tips: ['Los fines de semana por la mañana es muy habitual presenciar procesiones solemnes de bodas sintoístas tradicionales con novios en kimono blanco y negro'],
            curious_facts: ['El bosque no existía de forma natural; fue plantado artificialmente en 1920 con más de 100.000 árboles donados por ciudadanos de todo Japón'],
            suggested_minutes: 200,
            location_info: { address: '1-1 Yoyogikamizonocho, Shibuya', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Tren Bala Shinkansen a Kioto y los 10.000 Toriis de Fushimi Inari',
        notes: 'Viaje a 300 km/h viendo el Monte Fuji y el túnel rojo sagrado.',
        stops: [
          {
            stop_order: 1,
            name: 'Tren Shinkansen y Santuario Fushimi Inari-taisha',
            latitude: 34.9671,
            longitude: 135.7727,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Tren bala Shinkansen Tokaido desde Tokio a Kioto (2 horas y 15 minutos). Fushimi Inari es el santuario sintoísta dedicado al dios del arroz y los negocios, famoso por sus túneles serpenteantes de más de 10.000 puertas torii de color bermellón que trepan por la montaña sagrada.',
            activities: ['Comprar un bento en la estación de Tokio para almorzar en el tren bala (~1.200 JPY)', 'Caminar bajo los túneles de toriis bermellones custodiados por estatuas del zorro Kitsune (Entrada gratuita)', 'Paseo al atardecer por las calles de casas de madera de Gion buscando geishas (Gratis)'],
            tips: ['Reservar asiento en el lado derecho (fila E) del tren bala desde Tokio para divisar el Monte Fuji a los 45 minutos de trayecto', 'El santuario nunca cierra; visitarlo al atardecer o noche con farolillos encendidos es una experiencia mágica'],
            curious_facts: ['Cada una de las 10.000 puertas torii fue donada por una empresa o familia japonesa, y lleva grabado en negro el nombre del donante y la fecha'],
            suggested_minutes: 270,
            location_info: { address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto', priceRange: '$$ - Tren bala ~14.000 JPY' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Kinkaku-ji (Pabellón Dorado) y Bosque de Bambú de Arashiyama',
        notes: 'El templo cubierto de láminas de oro y el susurro del bambú verde.',
        stops: [
          {
            stop_order: 1,
            name: 'Kinkaku-ji (Pabellón Dorado) y Arashiyama Bamboo Grove',
            latitude: 35.0394,
            longitude: 135.7292,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Kinkaku-ji es un templo zen de tres plantas cuyas dos plantas superiores están totalmente recubiertas de hojas de oro puro, reflejándose sobre el estanque Kyoko-chi. En Arashiyama, los senderos serpentean entre altísimas cañas de bambú que se mecen con la brisa.',
            activities: ['Fotografiar el reflejo dorado del templo sobre las aguas del estanque (Entrada: 500 JPY / ~$3.5 USD)', 'Pasear en silencio por el sendero del bosque de bambú de Arashiyama (Gratis)', 'Probar helado artesanal de té verde matcha con galleta en el pueblo (450 JPY)'],
            tips: ['Llegar al bosque de bambú antes de las 8:30 AM para disfrutarlo sin muchedumbres y escuchar el crujido del viento entre las cañas'],
            curious_facts: ['El sonido del viento balanceando las cañas de bambú de Arashiyama fue incluido por el Ministerio de Medio Ambiente de Japón en la lista oficial de los "100 paisajes sonoros a preservar"'],
            suggested_minutes: 240,
            location_info: { address: '1 Kinkakujicho, Kita Ward, Kyoto', priceRange: '$ - Entrada 500 JPY' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Los Ciervos Sagrados de Nara y el Gran Buda de Tōdai-ji',
        notes: 'Más de mil ciervos libres que se inclinan en reverencia y el coloso de bronce.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque de Nara y Templo Tōdai-ji (Daibutsu)',
            latitude: 34.6851,
            longitude: 135.8398,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Nara fue la primera capital permanente de Japón (710 d.C.). Más de 1.200 ciervos sika dóciles deambulan libres por el parque como mensajeros de los dioses. El templo Tōdai-ji es el edificio de madera más grande del mundo y alberga el Gran Buda de bronce de 15 metros.',
            activities: ['Comprar galletas de arroz *shika-senbei* para alimentar a los ciervos que hacen reverencias (200 JPY)', 'Entrar a la nave colosal de Tōdai-ji y admirar la estatua de 500 toneladas del Gran Buda (Entrada: 600 JPY)', 'Pasar por el agujero del pilar de madera del templo que otorga iluminación espiritual (Gratis con entrada)'],
            tips: ['El tren Kintetsu desde Kioto llega a la estación Kintetsu-Nara en 35 minutos (760 JPY)'],
            curious_facts: ['Los ciervos de Nara han aprendido a imitar el saludo tradicional japonés inclinando la cabeza antes de recibir su galleta'],
            suggested_minutes: 240,
            location_info: { address: '406-1 Zoshicho, Nara, 630-8211', priceRange: '$ - Entrada 600 JPY' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Mercado de Nishiki en Kioto y Despedida Japonesa',
        notes: 'La cocina de Kioto: brochetas de wagyu, dulces tradicionales y retorno.',
        stops: [
          {
            stop_order: 1,
            name: 'Mercado de Nishiki y Despedida',
            latitude: 35.0050,
            longitude: 135.7645,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Galería techada estrecha de cinco cuadras con más de 130 puestos que opera desde hace más de 400 años. Famoso por sus encurtidos tradicionales, mariscos en brocheta, brochetas de ternera wagyu y té verde ceremonial.',
            activities: ['Degustar brocheta de ternera wagyu tierna A5 flambeada al momento (800 - 1.500 JPY)', 'Comprar latas de té verde matcha ceremonial Uji de primera cosecha (1.000 - 2.500 JPY)', 'Traslado en tren Haruka directo al aeropuerto internacional de Kansai (KIX) o Shinkansen de retorno a Tokio'],
            tips: ['En el mercado está prohibido caminar mientras se come; consumir los alimentos delante del puesto donde se compraron'],
            curious_facts: ['El mercado prosperó en este lugar gracias al agua subterránea fría natural que permitía conservar los pescados frescos antes de la refrigeración eléctrica'],
            suggested_minutes: 150,
            location_info: { address: 'Nakagyo Ward, Kyoto', priceRange: '$$ - Gastronomía callejera' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-tailandia-culinaria-bangkok-krabi-9d',
    title: 'Tailandia de Sabores y Playas: De los Mercados de Bangkok a los Acantilados de Krabi',
    country: 'Tailandia',
    city: 'Bangkok',
    type: 'gastronomic',
    tourScope: 'coastal_islands',
    description: 'Circuito de 9 días que sumerge los sentidos en el reino de Siam. La efervescencia culinaria de los puestos callejeros con estrella Michelin de Bangkok, el Gran Palacio de Buda Esmeralda, los mercados sobre las vías del tren y flotantes, y el paraíso kárstico de aguas turquesas en Railay Beach y las islas Phi Phi.',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 12960,
    distance_meters: 840000,
    difficulty: 'easy',
    rating: 4.96,
    review_count: 190,
    likes_count: 650,
    tags: ['Tailandia', 'Bangkok', 'Krabi', 'Phi Phi', 'Gastronómico', 'Playas', 'Street Food', 'Templos'],
    recommended_audience: ['Foodies', 'Amantes de la playa y snorkel', 'Mochileros de lujo'],
    best_season: 'Noviembre a Abril (temporada seca con mar calmo y cielos despejados)',
    recommended_schedule: 'Templos y palacios a primera hora de la mañana; tours gastronómicos nocturnos',
    meeting_point: 'Wat Phra Kaew / Gran Palacio Real, Bangkok',
    includes: ['Ruta completa de templos y street food', 'Coordenadas de muelles y lanchas tradicionales longtail', 'Itinerario de playas de Krabi'],
    excludes: ['Boleto al Gran Palacio de Bangkok', 'Vuelo doméstico Bangkok - Krabi', 'Tour en lancha rápida a Islas Phi Phi'],
    recommendations: ['Para entrar a los templos reales es obligatorio cubrir hombros y llevar pantalones largos (no valen pañuelos atados)', 'Beber siempre agua embotellada sellada y disfrutar del street food donde haya rotación de clientes locales'],
    what_to_bring: ['Ropa de algodón muy ligera y transpirable', 'Pantalones tipo pescador o lino', 'Bolsa estanca impermeable', 'Protector solar marino'],
    tour_rules: ['Prohibido subirse o tocar las estatuas sagradas de Buda'],
    budget: { currency: 'THB', estimatedPerPersonMin: 12000, estimatedPerPersonMax: 26000, notes: 'Gran Palacio (~500 THB), lancha Phi Phi (~1.500 THB), masajes tradicionales y street food' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Bangkok Real: El Gran Palacio y el Buda de Esmeralda',
        notes: 'Mosaicos de cristal de oro, agujas puntiagudas y el Buda más sagrado de Tailandia.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Palacio Real y Wat Phra Kaew',
            latitude: 13.7500,
            longitude: 100.4913,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El conjunto arquitectónico más sagrado y resplandeciente del país fundado en 1782. Alberga el Wat Phra Kaew con la pequeña estatua tallada en un solo bloque de jade del Buda de Esmeralda y guardianes míticos gigantes de porcelana policromada.',
            activities: ['Visitar el recinto real y el Buda de Esmeralda con vestiduras de oro cambiadas por el rey (Entrada: 500 THB / ~$14 USD)', 'Probar el auténtico Pad Thai con gambas frescas y cacahuete molido en un puesto callejero (60 - 100 THB / ~$2 USD)', 'Paseo en barco público de bandera naranja por el río Chao Phraya (16 THB)'],
            tips: ['Estricto código de vestimenta: no se permite entrar con camisetas sin mangas, mallas ajustadas ni pantalones cortos'],
            curious_facts: ['El rey de Tailandia en persona cambia tres veces al año las vestiduras de oro del Buda de Esmeralda para marcar el inicio del verano, el invierno y la temporada de lluvias'],
            suggested_minutes: 210,
            location_info: { address: 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok', priceRange: '$$ - Entrada 500 THB' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Wat Pho (Buda Reclinado) y el Templo del Amanecer (Wat Arun)',
        notes: 'El Buda dorado de 46 metros, cuna del masaje tailandés y torres de cerámica.',
        stops: [
          {
            stop_order: 1,
            name: 'Wat Pho y Wat Arun sobre el Río Chao Phraya',
            latitude: 13.7437,
            longitude: 100.4889,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Wat Pho alberga el colosal Buda Reclinado recubierto de pan de oro de 46 metros de largo con pies incrustados de nácar. Al otro lado del río se eleva la torre prang de 82 metros de Wat Arun cubierta con miles de piezas de porcelana china.',
            activities: ['Admirar los pies de nácar del Buda y depositar monedas en los 108 cuencos de bronce (Entrada: 300 THB)', 'Disfrutar de un masaje tradicional tailandés de 1 hora en la escuela de masaje del templo (350 - 500 THB)', 'Cruzar en ferry local por 5 THB para subir las escalinatas de Wat Arun (Entrada: 100 THB)'],
            tips: ['El atardecer contemplando la silueta de Wat Arun desde los bares ribereños del lado opuesto es inolvidable'],
            curious_facts: ['Wat Pho es la sede de la primera universidad pública de Tailandia y la cuna histórica donde se sistematizó el masaje tailandés tradicional reconocido por la UNESCO'],
            suggested_minutes: 240,
            location_info: { address: 'Sanam Chai Rd, Wat Arun, Bangkok', priceRange: '$ - Entradas accesibles' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Mercado del Tren de Maeklong y Mercado Flotante',
        notes: 'Puestos de frutas sobre vías activas del tren y canoas cargadas de mangos.',
        stops: [
          {
            stop_order: 1,
            name: 'Mercado del Tren (Rom Hup) y Mercado Flotante Damnoen Saduak',
            latitude: 13.5160,
            longitude: 99.9580,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'En Maeklong los vendedores instalan sus toldos directamente sobre la vía del ferrocarril; cuando suena la campana del tren, recogen los toldos en 30 segundos mientras el convoy pasa rozando las frutas. Cerca, el mercado flotante tradicional con canoas de madera.',
            activities: ['Ver pasar el tren a centímetros de los canastos de fruta (Gratis)', 'Paseo en canoa de madera por los canales del mercado flotante comiendo fideos de bote (200 - 300 THB)', 'Probar el postre nacional Mango Sticky Rice con leche de coco tibia (60 - 100 THB)'],
            tips: ['El tren pasa a horarios exactos (aprox. 8:30, 11:10, 14:30); coordinar la excursión para coincidir'],
            curious_facts: ['Los toldos y toldillos se repliegan tan sincronizadamente que el mercado es apodado popularmente *Talat Rom Hup* ("el mercado de los toldos que se cierran")'],
            suggested_minutes: 270,
            location_info: { address: 'Samut Songkhram / Ratchaburi', priceRange: '$$ - Excursión compartida' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Street Food en Chinatown (Yaowarat) y Noche en Sukhumvit',
        notes: 'El epicentro mundial del street food callejero y luces de rascacielos.',
        stops: [
          {
            stop_order: 1,
            name: 'Calle Yaowarat en Chinatown y Wat Traimit',
            latitude: 13.7380,
            longitude: 100.5130,
            image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'],
            description: 'Al anochecer la avenida Yaowarat se transforma en un río de puestos de comida iluminados por letreros de neón chinos. Sopa de fideos Tom Yum, brochetas satay con salsa de cacahuete y helado de coco en cáscara natural.',
            activities: ['Ver el Buda de Oro macizo de 5.5 toneladas en Wat Traimit (Entrada: 100 THB)', 'Safari gastronómico de puesto en puesto probando dumplings, mariscos salteados y fideos al wok (200 - 400 THB por banquete completo)', 'Paseo nocturno en tuk-tuk con luces de colores por las avenidas de la ciudad (150 - 250 THB)'],
            tips: ['Acordar el precio del tuk-tuk antes de subirse para evitar malentendidos'],
            curious_facts: ['El Buda de oro macizo de Wat Traimit estuvo recubierto de yeso durante dos siglos para ocultarlo de los invasores birmanos; su verdadero oro se descubrió accidentalmente en 1955 cuando cayó de una grúa'],
            suggested_minutes: 210,
            location_info: { address: 'Yaowarat Rd, Samphanthawong, Bangkok', priceRange: '$ - Gastronomía callejera' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Vuelo al Paraíso Marino de Krabi y Playa de Ao Nang',
        notes: 'Vuelo doméstico hacia las costas del mar de Andamán y acantilados kársticos.',
        stops: [
          {
            stop_order: 1,
            name: 'Ao Nang Beach y Atardecer en el Mar de Andamán',
            latitude: 8.0333,
            longitude: 98.8250,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Vuelo de 1 hora y 15 minutos desde Bangkok hacia Krabi. Ao Nang es la base costera rodeada por gigantescas formaciones kársticas de roca caliza que se sumergen verticalmente en el mar turquesa.',
            activities: ['Caminata por la playa de Ao Nang contemplando las lanchas tradicionales longtail amarradas (Gratis)', 'Cena marinera frente al mar: pescado entero al vapor con lima y chile o curry verde tailandés (250 - 450 THB)', 'Masaje de pies con aceites aromáticos junto a la playa (200 THB / ~$6 USD)'],
            tips: ['El taxi regulado desde el aeropuerto de Krabi hasta Ao Nang cuesta 600 THB (fijo)'],
            curious_facts: ['Las montañas kársticas de Krabi son restos de un antiguo arrecife de coral prehistórico que emergió hace millones de años'],
            suggested_minutes: 180,
            location_info: { address: 'Ao Nang, Mueang Krabi District', priceRange: '$$ - Restaurantes de playa' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Península Inaccesible de Railay Beach y Cueva Phra Nang',
        notes: 'Solo accesible en barca: escalada mundial, arena blanca y monos salvajes.',
        stops: [
          {
            stop_order: 1,
            name: 'Railay Beach West y Cueva de la Princesa (Phra Nang Beach)',
            latitude: 8.0110,
            longitude: 98.8390,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Península aislada del continente por acantilados infranqueables a la que solo se puede llegar en barca tradicional longtail. Aguas tranquilas color verde esmeralda, playas de arena finísima y santuarios de pescadores.',
            activities: ['Travesía de 10 minutos en longtail boat desde Ao Nang hasta Railay (100 THB por trayecto)', 'Nadar bajo los acantilados de Phra Nang Beach (Gratis)', 'Alquiler de kayak para rodear los islotes kársticos (200 THB por hora)'],
            tips: ['Para subir a la barca longtail se camina unos pasos dentro del agua hasta las rodillas; llevar calzado de agua o descalzarse'],
            curious_facts: ['La cueva de Phra Nang alberga un santuario donde los pescadores locales dejan ofrendas de madera para pedir buena pesca y protección marina'],
            suggested_minutes: 300,
            location_info: { address: 'Railay Beach, Krabi', priceRange: '$ - Barca 100 THB' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: La Leyenda de las Islas Phi Phi: Maya Bay y Pileh Lagoon',
        notes: 'La playa de la película de Leonardo DiCaprio y aguas turquesas rodeadas de acantilados.',
        stops: [
          {
            stop_order: 1,
            name: 'Maya Bay y Laguna de Pileh (Phi Phi Leh)',
            latitude: 7.6775,
            longitude: 98.7665,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El archipiélago más icónico del mar de Andamán. Maya Bay, protegida por acantilados de 100 metros de altura donde se filmó la película *La Playa*, y la Laguna de Pileh, una piscina natural esmeralda donde el agua parece vidrio fundido.',
            activities: ['Excursión en lancha rápida de día completo desde Krabi con snorkel (1.400 - 2.000 THB + tasa Parque Nacional 400 THB)', 'Snorkel con peces ángel, peces payaso y tiburones punta negra de arrecife inofensivos (Incluido en el tour)', 'Saltar al agua transparente desde la barca en Pileh Lagoon'],
            tips: ['En Maya Bay está estrictamente prohibido bañarse más allá de los tobillos para proteger el ecosistema de tiburones bebé que regresaron tras años de cierre ecológico'],
            curious_facts: ['Maya Bay estuvo cerrada al turismo durante más de tres años para permitir la regeneración total de sus arrecifes de coral dañados'],
            suggested_minutes: 360,
            location_info: { address: 'Ko Phi Phi Leh, Parque Nacional Marino', priceRange: '$$$ - Tour en lancha' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Las Cuatro Islas de Krabi y la Barra de Arena de Koh Poda',
        notes: 'Paseo en lancha tradicional por bancos de arena blanca y snorkel.',
        stops: [
          {
            stop_order: 1,
            name: 'Tup Island, Chicken Island y Koh Poda',
            latitude: 7.9700,
            longitude: 98.8100,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Tour clásico por las islas cercanas de la bahía. Destaca el fenómeno de la marea baja en Tup Island, donde emerge una lengua de arena blanca que une dos islas permitiendo caminar sobre el mar. Koh Poda deslumbra con su monolito de piedra solitario.',
            activities: ['Caminar sobre el banco de arena entre las islas durante la marea baja (*Talay Waek*) (Gratis)', 'Descanso bajo los pinos marítimos de la playa de Koh Poda', 'Almuerzo tipo picnic tailandés servido en la arena con curry Massaman y fruta fresca (Incluido en el tour: ~800 - 1.200 THB)'],
            tips: ['Llevar calzado de agua para cruzar el banco de arena entre piedras y corales rotos'],
            curious_facts: ['Chicken Island (Koh Kai) recibe su nombre por una caprichosa formación de roca caliza en su extremo que se asemeja con asombrosa precisión a la cabeza de un pollo gigante'],
            suggested_minutes: 300,
            location_info: { address: 'Four Islands, Krabi', priceRange: '$$ - Excursión 4 Islas' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Templo de la Cueva del Tigre (Wat Tham Suea) y Despedida',
        notes: 'Ascenso de 1.260 escalones hasta la cumbre panorámica y regreso.',
        stops: [
          {
            stop_order: 1,
            name: 'Wat Tham Suea (Tiger Cave Temple) y Despedida',
            latitude: 8.1278,
            longitude: 98.9242,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Santuario budista enclavado en la selva con una cueva sagrada. En la cima de un risco calizo se alza una colosal estatua dorada de Buda a la que se llega tras subir 1.260 empinados escalones con vistas de 360 grados sobre toda la provincia.',
            activities: ['Subida de superación personal por los 1.260 escalones hasta el santuario de la cima (Entrada gratuita)', 'Ver la huella de tigre en la roca dentro de la cueva sagrada (Gratis)', 'Comprar pasta de curry casera y aceite de coco virgen antes del traslado al aeropuerto'],
            tips: ['Subir temprano a las 7:30 AM con abundante agua; la subida es muy empinada y exigente físicamente pero la vista lo recompensa con creces'],
            curious_facts: ['La cueva toma su nombre de una leyenda según la cual un monje que meditaba en el bosque vivía en armonía con un tigre que habitaba la cueva natural'],
            suggested_minutes: 180,
            location_info: { address: 'Krabi Noi, Mueang Krabi District', priceRange: '$ - Entrada libre' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-turquia-oriente-a-occidente-10d',
    title: 'Turquía de Oriente a Occidente: Estambul, Capadocia y Éfeso',
    country: 'Turquía',
    city: 'Estambul',
    type: 'historical',
    tourScope: 'city_to_city',
    description: 'La gran encrucijada de imperios durante 10 días. Mezquita Azul y Santa Sofía en el Bósforo, el vuelo mágico en globo aerostático al amanecer sobre las chimeneas de hadas de Capadocia, las terrazas de travertino blanco de Pamukkale y las ruinas grecorromanas de Éfeso.',
    cover_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 14400,
    distance_meters: 1100000,
    difficulty: 'moderate',
    rating: 4.98,
    review_count: 220,
    likes_count: 730,
    tags: ['Turquía', 'Estambul', 'Capadocia', 'Pamukkale', 'Éfeso', 'Globos', 'Santa Sofía', 'Bósforo'],
    recommended_audience: ['Amantes de la historia antigua', 'Fotógrafos', 'Viajeros culturales'],
    best_season: 'Abril a Mayo y Septiembre a Octubre (clima templado perfecto para vuelos en globo)',
    recommended_schedule: 'Monumentos tempranos y vuelos en globo a las 5:00 AM para ver el amanecer',
    meeting_point: 'Plaza de Sultanahmet frente a Santa Sofía, Estambul',
    includes: ['Ruta completa de 10 días georreferenciada', 'Información de vuelos en globo certificados', 'Protocolo de vestimenta en mezquitas'],
    excludes: ['Vuelo en globo aerostático en Capadocia', 'Vuelos internos Estambul - Capadocia - Esmirna', 'Entradas oficiales'],
    recommendations: ['Llevar pañuelo para la cabeza las mujeres para ingresar a mezquitas activas y calzado fácil de descalzar', 'Reservar el vuelo en globo para la primera mañana en Capadocia; si se cancela por viento, se puede reprogramar para la siguiente'],
    what_to_bring: ['Ropa abrigada para el amanecer en globo (las mañanas en Capadocia son frías)', 'Zapatos con buen agarre para roca volcánica'],
    tour_rules: ['Respetar los momentos de oración musulmana en las mezquitas'],
    budget: { currency: 'EUR', estimatedPerPersonMin: 800, estimatedPerPersonMax: 1700, notes: 'Santa Sofía (€25), globo Capadocia (~€150-€240), Pamukkale (€30), Éfeso (€40) y vuelos domésticos' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Estambul: Santa Sofía y la Mezquita Azul',
        notes: 'La cúpula bizantina del siglo VI y los azulejos de Iznik en Sultanahmet.',
        stops: [
          {
            stop_order: 1,
            name: 'Santa Sofía (Hagia Sophia) y Mezquita Azul (Sultanahmet)',
            latitude: 41.0086,
            longitude: 28.9802,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'La maravilla bizantina erigida en el 537 d.C. por Justiniano con su colosal cúpula suspendida. Frente a ella se alza la Mezquita Azul del sultán Ahmet I con sus seis minaretes y más de 20.000 azulejos de cerámica turquesa pintados a mano.',
            activities: ['Visitar la galería superior de Santa Sofía y admirar los mosaicos de Cristo Pantocrátor (Entrada: €25)', 'Entrar a la Mezquita Azul descalzándose sobre las alfombras rojas (Entrada gratuita)', 'Tomar té turco en vaso de tulipán con un kebab tradicional de cordero (€8 - €15)'],
            tips: ['Las mujeres deben cubrir su cabello con velo para ingresar; si no llevan, en la entrada prestan o venden pañuelos'],
            curious_facts: ['Santa Sofía fue la iglesia catedral más grande del mundo cristiano durante casi mil años hasta la construcción de la Catedral de Sevilla en 1520'],
            suggested_minutes: 240,
            location_info: { address: 'Sultan Ahmet, Fatih, İstanbul', priceRange: '$$ - Entrada Santa Sofía €25' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Palacio de Topkapi, Cisterna Basílica y Gran Bazar',
        notes: 'El tesoro del sultán con el diamante Cucharero y el laberinto de 4.000 tiendas.',
        stops: [
          {
            stop_order: 1,
            name: 'Palacio de Topkapi, Cisterna Basílica y Gran Bazar',
            latitude: 41.0115,
            longitude: 28.9833,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Sede de los sultanes otomanos durante 400 años con vistas al Bósforo y el Harén real. Cerca, la subterránea Cisterna Basílica con 336 columnas de mármol iluminadas sobre el agua y cabezas de Medusa. El Gran Bazar es el mercado cubierto más antiguo del mundo.',
            activities: ['Visitar las salas de armas y el diamante Cucharero de 86 quilates en Topkapi (Entrada combinada: ~€45)', 'Caminar sobre las pasarelas de la Cisterna Basílica con su atmósfera mágica (Entrada: ~€20)', 'Perderse por las 60 calles del Gran Bazar regateando lámparas de mosaico y especias (Gratis)'],
            tips: ['En el Gran Bazar regatear con respeto: comenzar ofreciendo alrededor del 50-60% del precio inicial pedido'],
            curious_facts: ['Dos de las columnas de la Cisterna Basílica se apoyan sobre bloques de mármol tallados con el rostro de Medusa colocados deliberadamente boca abajo y de lado'],
            suggested_minutes: 300,
            location_info: { address: 'Cankurtaran / Beyazıt, Fatih', priceRange: '$$$ - Entradas históricas' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Crucero por el Bósforo y Vuelo a Capadocia',
        notes: 'Navegando entre Europa y Asia y vuelo nocturno a la tierra de las rocas lunares.',
        stops: [
          {
            stop_order: 1,
            name: 'Crucero por el Estrecho del Bósforo y Torre Gálata',
            latitude: 41.0256,
            longitude: 28.9741,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'El Bósforo separa físicamente Europa de Asia. Navegación en barco pasando junto a palacios otomanos de madera (*yalıs*) y fortalezas medievales. Por la tarde, traslado al aeropuerto para el vuelo a Kayseri o Nevşehir en Capadocia.',
            activities: ['Crucero de 1.5 horas por el Bósforo en ferry público o barco panorámico (€5 - €15)', 'Subir a la Torre Gálata genovesa de 1348 para vista de 360 grados del Cuerno de Oro (€30)', 'Probar el sándwich de pescado a la plancha *balık ekmek* junto al puente de Gálata (€4)'],
            tips: ['Tomar el vuelo de última hora de la tarde a Capadocia para dormir ya en un hotel cueva en Göreme'],
            curious_facts: ['El Bósforo es la única vía fluvial navegable que conecta el Mar Negro con el Mar Mediterráneo'],
            suggested_minutes: 240,
            location_info: { address: 'Eminönü / Karaköy, İstanbul', priceRange: '$$ - Ferry y vuelo' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Capadocia: Vuelo en Globo Aerostático al Amanecer y Göreme',
        notes: 'Cientos de globos sobrevolando los valles de toba volcánica y Museo al Aire Libre.',
        stops: [
          {
            stop_order: 1,
            name: 'Vuelo en Globo sobre Göreme y Museo al Aire Libre',
            latitude: 38.6431,
            longitude: 34.8289,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'La postal cumbre de Turquía. A las 5:30 AM más de 150 globos aerostáticos ascienden simultáneamente sobre el paisaje lunar de Capadocia. Luego, visita al Museo al Aire Libre de Göreme con iglesias rupestres excavadas en la roca con frescos bizantinos del siglo X.',
            activities: ['Vuelo en globo aerostático de 1 hora al amanecer con brindis con champán (€150 - €240 según temporada)', 'Visitar las iglesias rupestres de San Onofre y la Iglesia Oscura (Entrada: €20)', 'Cena tradicional en restaurante cueva: testi kebab (carne cocinada dentro de una vasija de barro sellada que se rompe con fuego ante el comensal: €15 - €25)'],
            tips: ['Abrigarse bien para el despegue matutino del globo; en la cesta a 800 metros de altura hace frío antes de que salga el sol'],
            curious_facts: ['El paisaje de Capadocia se formó por las cenizas volcánicas de los volcanes Erciyes y Hasan hace millones de años, erosionadas por el viento y la lluvia en forma de chimeneas de hadas'],
            suggested_minutes: 300,
            location_info: { address: 'Göreme, Nevşehir, Capadocia', priceRange: '$$$$ - Vuelo en globo' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Ciudad Subterránea de Derinkuyu y Valle de Ihlara',
        notes: 'Ocho pisos bajo tierra para 20.000 personas y cañón con río.',
        stops: [
          {
            stop_order: 1,
            name: 'Ciudad Subterránea de Derinkuyu y Cañón de Ihlara',
            latitude: 38.3736,
            longitude: 34.7347,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Asombrosa obra de ingeniería subterránea que desciende hasta 85 metros de profundidad con 8 niveles visitables. Albergaba establos, pozos de ventilación, capillas y almazaras para proteger a los cristianos primitivos de las invasiones árabes.',
            activities: ['Descender por los túneles estrechos de Derinkuyu cerrados por muelas de molino gigantes de piedra (Entrada: €13)', 'Caminata de 4 km a orillas del río por el cañón de Ihlara con iglesias en los acantilados (€15)', 'Almorzar sobre plataformas de madera flotantes en el río Melendiz (€12)'],
            tips: ['No recomendado para personas con claustrofobia severa debido a los pasadizos angostos'],
            curious_facts: ['Derinkuyu fue descubierta por casualidad en 1963 cuando un habitante local derribó una pared de su sótano y halló una misteriosa habitación que conducía al laberinto subterráneo'],
            suggested_minutes: 270,
            location_info: { address: 'Derinkuyu, Nevşehir', priceRange: '$$ - Excursión tour verde' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Valle del Amor y Castillo de Uçhisar',
        notes: 'Chimeneas gigantes y el punto más alto de Capadocia tallado en la montaña.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Uçhisar y Love Valley (Valle del Amor)',
            latitude: 38.6300,
            longitude: 34.8050,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Enorme peñasco de roca volcánica horadado por cientos de pasadizos que sirvió de fortaleza militar. La cima ofrece la vista panorámica más completa de los valles circundantes.',
            activities: ['Subir a pie a la cima del castillo para contemplar todo el valle de Göreme (€4)', 'Caminata escénica por el Valle del Amor entre chimeneas de hadas de 40 metros (Gratis)', 'Taller artesanal de cerámica en el pueblo alfarero de Avanos (€10)'],
            tips: ['La caminata por el Valle del Amor es plana y accesible; llevar agua y sombrero'],
            curious_facts: ['Las chimeneas de hadas tienen una roca dura de basalto en la punta que protege como un sombrero la toba blanda inferior de la lluvia'],
            suggested_minutes: 200,
            location_info: { address: 'Uçhisar, Nevşehir', priceRange: '$ - Entrada €4' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Pamukkale: El Castillo de Algodón y Hierápolis',
        notes: 'Terrazas de travertino blanco con aguas termales y la piscina de Cleopatra.',
        stops: [
          {
            stop_order: 1,
            name: 'Travertinos de Pamukkale y Piscina Antigua de Cleopatra',
            latitude: 37.9250,
            longitude: 29.1200,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Cascada petrificada de terrazas escalonadas de carbonato de calcio blanco como la nieve que contienen piscinas de aguas termales azul turquesa. Arriba reposan las ruinas de la ciudad balnearia romana de Hierápolis y su teatro monumental.',
            activities: ['Caminar descalzo sobre las terrazas de travertino blanco bañándose en el agua termal a 36°C (Entrada combinada: €30)', 'Nadar entre columnas romanas antiguas sumergidas en la Piscina Antigua de Cleopatra (€10 suplemento)', 'Visitar el teatro romano de Hierápolis con capacidad para 15.000 espectadores'],
            tips: ['Es estrictamente obligatorio descalzarse antes de pisar las terrazas de travertino blanco para no manchar el mineral'],
            curious_facts: ['Las aguas ricas en calcio de Pamukkale se han depositado a lo largo de 14.000 años creando más de 3 kilómetros de terrazas blancas'],
            suggested_minutes: 240,
            location_info: { address: 'Pamukkale, Denizli', priceRange: '$$ - Entrada €30' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Éfeso: La Biblioteca de Celso y el Gran Teatro Romano',
        notes: 'La metrópoli clásica mejor conservada del Mediterráneo oriental.',
        stops: [
          {
            stop_order: 1,
            name: 'Ciudad Arqueológica de Éfeso y Casa de la Virgen María',
            latitude: 37.9400,
            longitude: 27.3400,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las doce ciudades jónicas de la antigüedad. Su monumento cumbre es la monumental fachada de dos plantas de la Biblioteca de Celso de mármol tallado y el Gran Teatro con capacidad para 25.000 personas donde predicó San Pablo.',
            activities: ['Fotografiar la fachada restaurada de la Biblioteca de Celso (Entrada Éfeso: €40)', 'Caminar por la Vía de los Curetes sobre losas de mármol originales (Gratis con entrada)', 'Visita a la humilde Casa de la Virgen María en la colina de Bülbüldağı (€10)'],
            tips: ['Visitar a primera hora de la mañana; no hay sombra en las calles de mármol blanco de Éfeso y el sol refleja fuertemente'],
            curious_facts: ['Éfeso albergaba antiguamente el Templo de Artemisa, una de las Siete Maravillas del Mundo Antiguo original, del que hoy solo sobrevive una solitaria columna'],
            suggested_minutes: 240,
            location_info: { address: 'Selçuk, İzmir', priceRange: '$$ - Entrada €40' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Retorno a Estambul y el Barrio Moderno de Karaköy',
        notes: 'Vuelo a Estambul, arte contemporáneo y baklava de pistacho en Karaköy Güllüoğlu.',
        stops: [
          {
            stop_order: 1,
            name: 'Barrio de Karaköy y Museo de Arte Moderno de Estambul',
            latitude: 41.0230,
            longitude: 28.9800,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Vuelo de retorno desde Esmirna a Estambul. Karaköy es el distrito más moderno y vibrante a orillas del Bósforo, repleto de cafés de especialidad, galerías de arte en antiguos almacenes portuarios y la cuna del mejor baklava del mundo.',
            activities: ['Degustar el auténtico baklava de pistacho de Gaziantep con té turco en Karaköy Güllüoğlu (€6 - €12)', 'Pasear por el complejo costero peatonal de Galataport frente a los barcos (Gratis)', 'Compras de delicias turcas (*lokum*) y cerámica artesanal en las boutiques de Karaköy (€15 - €30)'],
            tips: ['En Karaköy Güllüoğlu pedir el "Havuç Dilimi" (triángulo gigante de baklava relleno de helado de leche de cabra)'],
            curious_facts: ['Karaköy Güllüoğlu produce más de 2 toneladas de baklava artesanal al día con 40 capas de masa filo estirada a mano tan fina que se puede leer un periódico a través de ella'],
            suggested_minutes: 180,
            location_info: { address: 'Kemankeş Karamustafa Paşa, Beyoğlu, İstanbul', priceRange: '$$ - Cafés y dulces' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Bazar de las Especias (Mısır Çarşısı) y Despedida',
        notes: 'Aroma a azafrán, canela y té de manzana antes del traslado al aeropuerto.',
        stops: [
          {
            stop_order: 1,
            name: 'Bazar de las Especias (Mercado Egipcio)',
            latitude: 41.0166,
            longitude: 28.9705,
            image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'],
            description: 'Construido en 1660 con los impuestos del comercio otomano con Egipto. Un festival para los sentidos con montañas cónicas de curry, azafrán iraní, caviar, frutos secos y flores de té que se abren en el agua.',
            activities: ['Comprar té de granada y especias envasadas al vacío para llevar en el equipaje (€10 - €25)', 'Tomar el último café turco preparado sobre arena caliente con una porción de lokum de rosas (€3)', 'Traslado en metro M11 o autobús Havaist al nuevo Aeropuerto Internacional de Estambul (IST) (€6)'],
            tips: ['Hacer que envasen al vacío los quesos y delicias turcas para que no desprendan aroma en el avión'],
            curious_facts: ['Se llamó Mercado Egipcio porque fue financiado con los ingresos y tributos procedentes del eyalato otomano de Egipto'],
            suggested_minutes: 150,
            location_info: { address: 'Rüstem Paşa, Fatih, İstanbul', priceRange: '$ - Compras locales' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-la-gran-travesia-nipona-14d',
    title: 'La Gran Travesía Nipona: De Tokio al Monte Fuji, Alpes, Kioto e Hiroshima',
    country: 'Japón',
    city: 'Tokio',
    type: 'custom',
    tourScope: 'city_to_city',
    description: 'La expedición maestra de 14 días a través de Japón. Megalópolis futurista en Tokio, la silueta sagrada del Monte Fuji en los lagos de Hakone, la aldea feudal de Shirakawa-go en los Alpes Japoneses, la milenaria Kioto, el castillo negro de Matsumoto, la gastronomía callejera de Osaka y el Parque Memorial de la Paz en Hiroshima.',
    cover_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 20160,
    distance_meters: 1750000,
    difficulty: 'moderate',
    rating: 4.99,
    review_count: 310,
    likes_count: 980,
    tags: ['Japón', 'Tokio', 'Monte Fuji', 'Shirakawa-go', 'Kioto', 'Osaka', 'Hiroshima', 'Mega Tour'],
    recommended_audience: ['Viajeros épicos', 'Apasionados de la cultura oriental', 'Fotógrafos'],
    best_season: 'Marzo a Mayo y Octubre a Noviembre',
    recommended_schedule: 'Itinerario fluido conectado por tren bala Shinkansen y pases regionales',
    meeting_point: 'Estación de Tokio / Marunouchi Central, Tokio',
    includes: ['Ruta completa de 14 días interconectada por Shinkansen', 'Puntos estratégicos para divisar el Monte Fuji', 'Guía de aldeas tradicionales gassho-zukuri'],
    excludes: ['Pase de tren JR Pass / billetes de tren bala', 'Entrada al Castillo de Matsumoto y miradores', 'Gastos personales'],
    recommendations: ['Utilizar el servicio de envío de equipaje de hotel a hotel (*Takkyubin*) para viajar solo con mochila de mano en los tramos de montaña', 'Reservar los ryokan con aguas termales onsen con meses de antelación'],
    what_to_bring: ['Adaptador eléctrico de 2 clavijas planas (tipo A)', 'Calzado fácil de descalzar', 'Ropa por capas para los Alpes Japoneses'],
    tour_rules: ['Tatuajes: en muchos onsen tradicionales está prohibido el acceso a personas con tatuajes visibles; cubrir con parches o reservar baño privado'],
    budget: { currency: 'JPY', estimatedPerPersonMin: 120000, estimatedPerPersonMax: 260000, notes: 'Trenes bala (~45.000 JPY total), ryokan tradicional con cena kaiseki, entradas y gastronomía' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Tokio: Shibuya y Mirador Shibuya Sky',
        notes: 'Llegada y primer contacto con el neón futurista de Tokio.',
        stops: [
          {
            stop_order: 1,
            name: 'Cruce de Shibuya y Shibuya Sky',
            latitude: 35.6595,
            longitude: 139.7005,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'El célebre cruce diagonal iluminado y el mirador más alto de Shibuya.',
            activities: ['Cruzar el paso de cebra de Shibuya (Gratis)', 'Subir a Shibuya Sky (2.500 JPY)', 'Ramen tonkotsu en Ichiran (1.000 JPY)'],
            tips: ['Descansar para superar el desfase horario (jet lag)'],
            curious_facts: ['Shibuya registra más de 2 millones de pasajeros diarios en su estación'],
            suggested_minutes: 180,
            location_info: { address: 'Shibuya, Tokio', priceRange: '$$ - Mirador' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Tokio Histórico: Templo Sensō-ji y Akihabara',
        notes: 'El farol rojo de Asakusa y la cultura del anime.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo Sensō-ji y Akihabara',
            latitude: 35.7148,
            longitude: 139.7967,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'El templo más antiguo de Tokio y la meca de la tecnología.',
            activities: ['Visitar Sensō-ji (Gratis)', 'Probar melón pan caliente (300 JPY)', 'Tiendas de figuras en Akihabara (Gratis)'],
            tips: ['Tirar monedas de 5 yenes (go-en) para la buena suerte'],
            curious_facts: ['La moneda de 5 yenes tiene un agujero y simboliza la conexión de destino con las personas'],
            suggested_minutes: 240,
            location_info: { address: 'Asakusa / Akihabara', priceRange: '$ - Entrada gratis' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: El Volcán Sagrado: Hakone y Vistas al Monte Fuji',
        notes: 'Crucero en barco pirata por el lago Ashi y aguas termales sulfurosas de Owakudani.',
        stops: [
          {
            stop_order: 1,
            name: 'Lago Ashi y Valle Volcánico de Owakudani',
            latitude: 35.2410,
            longitude: 139.0200,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Hakone ofrece las vistas más célebres del cono nevado del Monte Fuji reflejado en el lago Ashi. Teleférico sobre fumarolas de azufre activas en Owakudani.',
            activities: ['Crucero por el lago Ashi con el Hakone Freepass (~5.000 JPY pase completo)', 'Comer los famosos huevos negros (*Kuro-tamago*) cocidos en aguas termales (500 JPY)', 'Ver el torii rojo en el agua del Santuario de Hakone (Gratis)'],
            tips: ['La tradición dice que comer un huevo negro añade 7 años de vida'],
            curious_facts: ['La cáscara del huevo se vuelve negra como el carbón por la reacción del hierro y azufre del agua volcánica'],
            suggested_minutes: 270,
            location_info: { address: 'Hakone, Kanagawa', priceRange: '$$ - Hakone Pass' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: El Castillo del Cuervo Negro: Matsumoto',
        notes: 'Uno de los 12 castillos originales de madera de la era samurái.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Matsumoto',
            latitude: 36.2388,
            longitude: 137.9691,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Apodado el "Cuervo Negro" por sus muros de madera oscura. Es el castillo de cinco plantas más antiguo conservado de Japón (construido en 1594).',
            activities: ['Subir las empinadas escaleras de madera del castillo original (Entrada: 700 JPY)', 'Pasear por el foso lleno de carpas koi con los Alpes Japoneses de fondo (Gratis)', 'Probar fideos de soba de trigo sarraceno artesanal (900 - 1.400 JPY)'],
            tips: ['Las escaleras interiores tienen una inclinación de hasta 61 grados; subir con cuidado'],
            curious_facts: ['A diferencia de muchos castillos japoneses que fueron reconstruidos en hormigón tras la guerra, Matsumoto conserva sus vigas de pino de 400 años intactas'],
            suggested_minutes: 180,
            location_info: { address: '4-1 Marunouchi, Matsumoto, Nagano', priceRange: '$ - Entrada 700 JPY' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Los Alpes Japoneses: Aldea Tradicional de Shirakawa-go',
        notes: 'Casas de tejados de paja empinados gassho-zukuri rodeadas de arrozales.',
        stops: [
          {
            stop_order: 1,
            name: 'Aldea Histórica de Shirakawa-go (Ogimachi)',
            latitude: 36.2562,
            longitude: 136.9066,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Patrimonio de la Humanidad por la UNESCO. Aldea aislada en las montañas con casas de madera construidas con techos de paja inclinados a 60 grados para soportar las nevadas más pesadas de Japón.',
            activities: ['Subir al mirador Shiroyama para ver la panorámica de toda la aldea (Gratis)', 'Entrar a la histórica Casa Wada de tres pisos de madera (Entrada: 400 JPY)', 'Probar ternera Hida a la parrilla sobre hoja de magnolia con miso (1.500 - 2.500 JPY)'],
            tips: ['El autobús Nohi Bus conecta Takayama con Shirakawa-go en 50 minutos'],
            curious_facts: ['Gassho-zukuri significa "construido como manos en oración", recordando la forma de las manos unidas rezando'],
            suggested_minutes: 240,
            location_info: { address: 'Ogimachi, Shirakawa, Gifu', priceRange: '$ - Acceso aldea libre' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: La Ciudad de los Samuráis: Kanazawa y Jardín Kenroku-en',
        notes: 'Uno de los tres jardines más perfectos de Japón y pan de oro comestible.',
        stops: [
          {
            stop_order: 1,
            name: 'Jardín Kenroku-en y Barrio de Geishas Higashi Chaya',
            latitude: 36.5621,
            longitude: 136.6625,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Kenroku-en cumple las seis cualidades ideales del paisajismo clásico: espacio, serenidad, artificio, antigüedad, cursos de agua y magníficas vistas. En Higashi Chaya, las casas de té conservan celosías de madera.',
            activities: ['Pasear por los estanques y puentes de piedra de Kenroku-en (Entrada: 320 JPY)', 'Comer un helado cubierto con una hoja entera de pan de oro auténtico (1.000 JPY)', 'Visitar una casa de geishas histórica Shima en Higashi Chaya (500 JPY)'],
            tips: ['Kanazawa produce el 99% de todo el pan de oro artesanal de Japón'],
            curious_facts: ['En invierno los pinos del jardín se sostienen con conos de cuerdas llamados *Yukitsuri* para que el peso de la nieve no quiebre sus ramas'],
            suggested_minutes: 210,
            location_info: { address: '1 Kenrokumachi, Kanazawa, Ishikawa', priceRange: '$ - Entrada jardín 320 JPY' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Tren Shinkansen a Kioto: Los 10.000 Toriis de Fushimi Inari',
        notes: 'Llegada a la capital imperial y el sendero místico en la montaña.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario Fushimi Inari-taisha',
            latitude: 34.9671,
            longitude: 135.7727,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Túneles bermellones infinitos en la montaña sagrada.',
            activities: ['Caminata bajo los toriis (Gratis)', 'Fotografías al atardecer', 'Cena en Gion'],
            tips: ['Llevar calzado deportivo para subir los tramos de escaleras'],
            curious_facts: ['Fushimi Inari cuenta con más de 30.000 santuarios filiales repartidos por todo Japón'],
            suggested_minutes: 200,
            location_info: { address: 'Fushimi Inari, Kioto', priceRange: '$ - Entrada libre' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Kioto Sagrado: Pabellón Dorado y Templo Kiyomizu-dera',
        notes: 'El pabellón de oro sobre el estanque y la terraza de madera sin clavos.',
        stops: [
          {
            stop_order: 1,
            name: 'Kinkaku-ji y Templo Kiyomizu-dera',
            latitude: 34.9949,
            longitude: 135.7850,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Kiyomizu-dera ("Templo del Agua Pura") posee una terraza monumental de vigas de madera de zelkova construida en la ladera sin usar un solo clavo metálico.',
            activities: ['Visitar Kinkaku-ji (500 JPY)', 'Beber de las aguas de la cascada Otowa en Kiyomizu-dera para salud, amor o éxito académico (Entrada: 400 JPY)', 'Pasear por las cuestas empedradas de Ninenzaka y Sannenzaka (Gratis)'],
            tips: ['En la cascada Otowa solo se debe beber de uno de los tres chorros; beber de los tres se considera avaricia'],
            curious_facts: ['La expresión japonesa "saltar desde la terraza de Kiyomizu" equivale en español a "tomar una decisión valiente y definitiva"'],
            suggested_minutes: 270,
            location_info: { address: '1 Chome-294 Kiyomizu, Higashiyama Ward, Kyoto', priceRange: '$ - Entradas templos' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Bosque de Bambú de Arashiyama y Castillo Nijo',
        notes: 'El piso de ruiseñor que canta al pisarlo para alertar de asesinos ninjas.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo Nijo y Arashiyama',
            latitude: 35.0142,
            longitude: 135.7482,
            image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
            description: 'Residencia en Kioto del shōgun Tokugawa Ieyasu. Su palacio Ninomaru cuenta con el célebre "suelo de ruiseñor" (*uguisubari*), tablas de madera que chirrían emitiendo el canto de un pájaro al caminar sobre ellas para evitar ataques sorpresa.',
            activities: ['Caminar descalzo escuchando el canto del suelo de ruiseñor (Entrada: 800 JPY)', 'Paseo por el bosque de bambú de Arashiyama (Gratis)', 'Cruzar el puente histórico Togetsukyo sobre el río Oi'],
            tips: ['Apreciar las pinturas murales originales de tigres en pan de oro de la escuela Kano'],
            curious_facts: ['Las grapas metálicas bajo las tablas rozan los clavos al pisarlas generando el sonido intencionado'],
            suggested_minutes: 240,
            location_info: { address: '541 Nijojocho, Nakagyo Ward, Kyoto', priceRange: '$ - Entrada 800 JPY' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: Ciervos de Nara y Llegada a Osaka de Noche',
        notes: 'El Gran Buda de Tōdai-ji y las luces deslumbrantes de Dotonbori.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Buda de Tōdai-ji y Barrio Dotonbori en Osaka',
            latitude: 34.6687,
            longitude: 135.5013,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Mañana en Nara alimentando a los ciervos y tarde en Osaka, la capital gastronómica de Japón. El canal de Dotonbori estalla de noche con el neón del Glico Man corriendo y figuras tridimensionales gigantes de cangrejos y pulpos.',
            activities: ['Alimentar a los ciervos de Nara y ver el Gran Buda (600 JPY)', 'Foto clásica imitando la pose del atleta de Glico Man en el puente Ebisubashi (Gratis)', 'Comer bolitas calientes de pulpo *Takoyaki* y brochetas fritas *Kushikatsu* (600 - 1.200 JPY)'],
            tips: ['Cuidado con los takoyaki recién hechos: el interior está hirviendo'],
            curious_facts: ['En Osaka la gente saluda diciendo "¿Kari makka?" que significa literalmente "¿Cómo van los negocios?", reflejando su espíritu mercantil histórico'],
            suggested_minutes: 270,
            location_info: { address: 'Dotonbori, Chuo Ward, Osaka', priceRange: '$$ - Comida callejera' }
          }
        ]
      },
      {
        day_number: 11,
        title: 'Día 11: Castillo de Osaka y Shinsekai Retro',
        notes: 'La fortaleza de Toyotomi Hideyoshi y el barrio nostálgico de la Torre Tsutenkaku.',
        stops: [
          {
            stop_order: 1,
            name: 'Castillo de Osaka y Barrio de Shinsekai',
            latitude: 34.6873,
            longitude: 135.5262,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Imponente castillo rodeado de fosos de agua colosales y murallas de bloques de granito ciclópeos. Shinsekai ("Nuevo Mundo") es un barrio retro de 1912 inspirado en París y Coney Island.',
            activities: ['Subir al mirador del Castillo de Osaka con vista a los rascacielos (Entrada: 600 JPY)', 'Tocar las plantas de los pies del dios de la felicidad Billiken en Shinsekai para la buena suerte (Gratis)', 'Comer *Okonomiyaki* (pizza/tortilla japonesa a la plancha) preparado en la mesa (900 - 1.400 JPY)'],
            tips: ['Los fosos del castillo cuentan con árboles de cerezo espectaculares en primavera'],
            curious_facts: ['La piedra más grande del muro del castillo (*Takoishi*) pesa 108 toneladas y fue transportada desde la isla de Shodoshima'],
            suggested_minutes: 210,
            location_info: { address: '1-1 Osakajo, Chuo Ward, Osaka', priceRange: '$ - Entrada 600 JPY' }
          }
        ]
      },
      {
        day_number: 12,
        title: 'Día 12: Hiroshima: El Parque Conmemorativo de la Paz y la Cúpula Genbaku',
        notes: 'Memoria histórica, la llama de la paz eterna y el mensaje de desarme nuclear.',
        stops: [
          {
            stop_order: 1,
            name: 'Cúpula de la Bomba Atómica y Museo Memorial de la Paz de Hiroshima',
            latitude: 34.3955,
            longitude: 132.4536,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Shinkansen desde Osaka a Hiroshima (1 hora y 25 minutos). La Cúpula de la Bomba Atómica (Genbaku Dome) es la única estructura que resistió en pie cerca del epicentro del 6 de agosto de 1945, preservada exactamente como quedó.',
            activities: ['Contemplar en silencio las ruinas de la Cúpula Genbaku (Patrimonio de la Humanidad UNESCO - Gratis)', 'Visitar el conmovedor Museo Conmemorativo de la Paz (Entrada: 200 JPY / ~$1.40 USD)', 'Hacer una grulla de papel origami en el monumento a la niña Sadako Sasaki (Gratis)'],
            tips: ['El museo es de alto impacto emocional; dedicar tiempo para procesar la visita en los jardines del parque'],
            curious_facts: ['La Llama de la Paz arde ininterrumpidamente en el parque desde 1964 y solo se apagará cuando todas las armas nucleares del mundo hayan sido destruidas'],
            suggested_minutes: 240,
            location_info: { address: '1-2 Nakajimacho, Naka Ward, Hiroshima', priceRange: '$ - Entrada museo 200 JPY' }
          }
        ]
      },
      {
        day_number: 13,
        title: 'Día 13: La Isla Sagrada de Miyajima y el Torii Flotante',
        notes: 'Santuario Itsukushima construido sobre pilotes en el mar y ciervos costeros.',
        stops: [
          {
            stop_order: 1,
            name: 'Santuario Itsukushima y el Gran Torii en el Mar (Miyajima)',
            latitude: 34.2960,
            longitude: 132.3197,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Isla sagrada a 10 minutos en ferry desde Hiroshima. Su santuario sintoísta y su colosal torii bermellón de 16 metros de altura están construidos sobre el mar, pareciendo flotar mágicamente durante la marea alta.',
            activities: ['Ferry a la isla de Miyajima (Incluido con JR Pass o 200 JPY)', 'Visitar las pasarelas sobre el agua del santuario Itsukushima (Entrada: 300 JPY)', 'Probar ostras frescas a la parrilla y el pastelito *Momiji Manju* en forma de hoja de arce (300 - 600 JPY)'],
            tips: ['Durante la marea baja se puede caminar a pie hasta la base del torii; durante la marea alta parece flotar en el agua'],
            curious_facts: ['La isla entera era considerada tan sagrada que antiguamente no se permitían nacimientos ni entierros en su territorio para no mancillar la pureza'],
            suggested_minutes: 270,
            location_info: { address: 'Miyajimacho, Hatsukaichi, Hiroshima', priceRange: '$ - Entrada 300 JPY' }
          }
        ]
      },
      {
        day_number: 14,
        title: 'Día 14: Retorno a Tokio en Shinkansen y Despedida en Ginza',
        notes: 'El elegante barrio de Ginza, compras de artesanía japonesa y regreso.',
        stops: [
          {
            stop_order: 1,
            name: 'Distrito de Ginza y Estación de Tokio',
            latitude: 35.6719,
            longitude: 139.7650,
            image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            description: 'Viaje en tren bala Shinkansen de regreso a Tokio. Ginza es el distrito de tiendas insignia, galerías de arte y almacenes centenarios como Wako con su torre de reloj.',
            activities: ['Caminar por Ginza Six y admirar las instalaciones de arte de vanguardia (Gratis)', 'Comprar cuchillos de cocina de acero japonés forjados a mano en Tsukiji (8.000 - 20.000 JPY)', 'Último almuerzo de sushi tradicional nigiri servido por maestro itamae (2.500 - 5.000 JPY)'],
            tips: ['Tomar el tren Narita Express (N\'EX) desde la estación de Tokio al aeropuerto de Narita (1 hora) o monorraíl a Haneda (25 minutos)'],
            curious_facts: ['Ginza significa literalmente "Lugar de la plata", pues aquí se ubicaba la ceca donde se acuñaban las monedas de plata del shogunato en el siglo XVII'],
            suggested_minutes: 180,
            location_info: { address: 'Ginza, Chuo City, Tokyo', priceRange: '$$ - Compras finales' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-egipto-faraonico-guiza-luxor-nilo-8d',
    title: 'Egipto Faraónico: Pirámides de Guiza, Valle de los Reyes y Crucero por el Nilo',
    country: 'Egipto',
    city: 'El Cairo',
    type: 'historical',
    tourScope: 'city_to_city',
    description: 'Expedición de 8 días a través de cinco mil años de historia. Las colosales Pirámides de Guiza y la Gran Esfinge, el Gran Museo Egipcio en El Cairo, crucero por el río Nilo entre templos de dioses y faraones, el Valle de los Reyes en Luxor y la majestuosidad de Abu Simbel rescatado de las aguas.',
    cover_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 11520,
    distance_meters: 980000,
    difficulty: 'moderate',
    rating: 4.97,
    review_count: 230,
    likes_count: 810,
    tags: ['Egipto', 'El Cairo', 'Guiza', 'Pirámides', 'Nilo', 'Luxor', 'Karnak', 'Abu Simbel', 'Faraones'],
    recommended_audience: ['Apasionados de la arqueología', 'Grandes viajeros', 'Aventureros'],
    best_season: 'Octubre a Abril (invierno templado; evitar el calor abrasador de verano que supera 45°C)',
    recommended_schedule: 'Madrugar mucho para visitar templos y pirámides entre las 6:30 AM y las 11:00 AM',
    meeting_point: 'Complejo de las Pirámides de Guiza, El Cairo',
    includes: ['Ruta completa de Guiza a Luxor y Asuán', 'Guía egiptológica de templos faraónicos', 'Ubicación de miradores de pirámides'],
    excludes: ['Boleto de acceso al interior de la Gran Pirámide de Keops', 'Entrada a la tumba de Tutankamón', 'Crucero por el Nilo'],
    recommendations: ['Llevar siempre sombrero de ala ancha, gafas de sol y agua en abundancia', 'Tener billetes pequeños de libras egipcias para propinas (*baksheesh*), una costumbre arraigada en el país'],
    what_to_bring: ['Ropa transpirable de lino en colores claros', 'Calzado cómodo cerrado para arena y piedra', 'Protector solar potente'],
    tour_rules: ['Prohibido escalar o subirse a los bloques de las pirámides (estricta sanción policial)'],
    budget: { currency: 'USD', estimatedPerPersonMin: 650, estimatedPerPersonMax: 1400, notes: 'Pirámides (~$15 USD), Karnak (~$12 USD), Valle de los Reyes (~$16 USD), crucero Nilo y vuelos' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: La Única Maravilla Antigua en Pie: Pirámides de Guiza y la Esfinge',
        notes: 'Keops, Kefrén, Micerino y la guardiana con cuerpo de león y rostro humano.',
        stops: [
          {
            stop_order: 1,
            name: 'Pirámides de Guiza y la Gran Esfinge',
            latitude: 29.9792,
            longitude: 31.1342,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'La Gran Pirámide de Keops fue construida hace más de 4.500 años con 2.3 millones de bloques de piedra caliza y es la única de las Siete Maravillas del Mundo Antiguo que sobrevive. A sus pies vigila la Gran Esfinge tallada en un solo bloque monolítico.',
            activities: ['Caminar alrededor de la Gran Pirámide de Keops (Entrada recinto Guiza: ~540 EGP / ~$11 USD)', 'Entrar a la galería interior de la pirámide de Keops (~900 EGP / ~$19 USD opcional)', 'Fotografiar la Esfinge desde el Templo del Valle de Kefrén (Gratis con entrada)'],
            tips: ['Llegar a las 7:00 AM para entrar en cuanto abren las puertas y evitar los autobuses masivos y el calor ardiente'],
            curious_facts: ['La Gran Pirámide fue la estructura más alta construida por el ser humano durante más de 3.800 años hasta la construcción de la Catedral de Lincoln en 1311'],
            suggested_minutes: 240,
            location_info: { address: 'Al Haram, Giza Governorate', priceRange: '$$ - Entrada recinto' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: El Gran Museo Egipcio y Barrio Copto de El Cairo',
        notes: 'La máscara de oro de Tutankamón y la iglesia colgante del cristianismo primitivo.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Museo Egipcio (GEM) e Iglesia Colgante (Barrio Copto)',
            latitude: 30.0050,
            longitude: 31.1190,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'El mayor museo arqueológico del mundo dedicado a una sola civilización. Custodia el ajuar funerario completo del faraón Tutankamón con más de 5.000 piezas intactas. En el viejo Cairo, el Barrio Copto alberga callejuelas amuralladas e iglesias cristianas del siglo IV.',
            activities: ['Admirar la colosal estatua de Ramsés II de 3.200 años en el atrio del museo (Entrada GEM: ~1.200 EGP / ~$25 USD)', 'Visitar la cripta de la Iglesia de San Sergio donde se refugió la Sagrada Familia en Egipto (Gratis)', 'Probar el plato nacional Koshari (arroz, lentejas, garbanzos, pasta y salsa picante: ~$2 USD)'],
            tips: ['Comprar las entradas al Gran Museo Egipcio en su portal web oficial'],
            curious_facts: ['La máscara funeraria de Tutankamón está hecha de 11 kilos de oro macizo de 23 quilates con incrustaciones de lapislázuli, cornalina y obsidiana'],
            suggested_minutes: 270,
            location_info: { address: 'Giza / Coptic Cairo', priceRange: '$$ - Entrada GEM' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Vuelo a Luxor: El Templo de Karnak y el Bosque de Columnas',
        notes: 'El complejo religioso más colosal jamás construido por la humanidad.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo de Karnak y Templo de Luxor',
            latitude: 25.7188,
            longitude: 32.6573,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'Karnak fue ampliado durante 2.000 años por más de 30 faraones dedicados al dios Amón-Ra. Su Gran Sala Hipóstila cuenta con 134 columnas gigantescas de 24 metros cubiertas de jeroglíficos. De noche, el Templo de Luxor se ilumina junto al río Nilo.',
            activities: ['Caminar entre las 134 columnas de la Sala Hipóstila de Karnak (Entrada: ~450 EGP / ~$9 USD)', 'Pasear por la recién restaurada Avenida de las Esfinges de 3 kilómetros que une Karnak con Luxor (Gratis con entrada)', 'Visitar el Templo de Luxor iluminado en la noche (~400 EGP)'],
            tips: ['Tocar el escarabajo sagrado de piedra de Karnak y darle 7 vueltas en sentido contrario al reloj para pedir un deseo'],
            curious_facts: ['En la Sala Hipóstila de Karnak cabría holgadamente la Catedral de Notre-Dame de París completa'],
            suggested_minutes: 300,
            location_info: { address: 'Karnak, Luxor', priceRange: '$$ - Entradas templos' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: El Valle de los Reyes y Templo Funerario de Hatshepsut',
        notes: 'Tumbas subterráneas excavadas en la montaña desértica con colores vivos intactos.',
        stops: [
          {
            stop_order: 1,
            name: 'Valle de los Reyes y Templo de Hatshepsut',
            latitude: 25.7402,
            longitude: 32.6014,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'Necrópolis secreta donde fueron sepultados los faraones del Imperio Nuevo (Tutankamón, Ramsés II, Seti I). Sus pinturas murales de pigmentos minerales conservan colores brillantes como si hubieran sido pintadas ayer. El Templo de la reina Hatshepsut se integra en tres terrazas colosales al acantilado.',
            activities: ['Descender a 3 tumbas reales incluidas en el boleto general (Entrada: ~600 EGP / ~$12 USD)', 'Entrada especial a la tumba de Tutankamón (KV62) con su momia real en urna de cristal (~500 EGP suplemento)', 'Fotografiar los dos Colosos de Memnón de 18 metros en la llanura (Gratis)'],
            tips: ['La tumba de Ramsés IV y Merenptah tienen corredores amplios y techos astronómicos azules espectaculares'],
            curious_facts: ['Howard Carter descubrió la tumba de Tutankamón en 1922 gracias a que la entrada había quedado sepultada bajo los escombros de la construcción de la tumba vecina de Ramsés VI'],
            suggested_minutes: 300,
            location_info: { address: 'West Bank, Luxor', priceRange: '$$ - Entrada Valle de los Reyes' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: Navegación por el Nilo: Templo de Horus en Edfu',
        notes: 'El templo faraónico mejor conservado de Egipto dedicado al dios halcón.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo de Horus en Edfu',
            latitude: 24.9780,
            longitude: 32.8735,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'Crucero navegando hacia el sur. El templo de Edfu es el monumento de la época ptolemaica más completo de todo Egipto, conservando su techo de piedra original, el pilono de entrada con colosales relieves de Horus y la barca sagrada de cedro en el santuario interior.',
            activities: ['Llegada en carruaje tradicional de caballos desde el muelle del crucero al templo (Incluido en excursiones)', 'Ver la estatua en granito negro del dios halcón Horus con la doble corona del Alto y Bajo Egipto (Entrada: ~450 EGP)', 'Navegar sobre la cubierta del crucero viendo pasar palmerales y pescadores en falucas'],
            tips: ['Subir a la cubierta del barco por la tarde para presenciar el paso por la esclusa de Esna'],
            curious_facts: ['El templo permaneció enterrado bajo 12 metros de arena del desierto y lodo del Nilo durante siglos, lo que lo protegió de la erosión y el expolio'],
            suggested_minutes: 180,
            location_info: { address: 'Edfu, Aswan Governorate', priceRange: '$$ - Incluido en crucero' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Templo Doble de Kom Ombo y Llegada a Asuán',
        notes: 'Dedicado simultáneamente al dios cocodrilo Sobek y al dios halcón Haroeris.',
        stops: [
          {
            stop_order: 1,
            name: 'Templo de Kom Ombo y Museo de los Cocodrilos',
            latitude: 24.4520,
            longitude: 32.9280,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'Edificado en una curva del Nilo donde en la antigüedad se concentraban los cocodrilos sagrados. Su arquitectura es simétrica perfecta con dos entradas, dos santuarios y relieves quirúrgicos de instrumental médico romano antiguo.',
            activities: ['Visita nocturna al templo iluminado a pocos pasos del muelle del crucero (Entrada: ~360 EGP)', 'Entrar al Museo de los Cocodrilos y ver más de 20 momias gigantes de cocodrilos reales del Nilo (Gratis con entrada)', 'Paseo en faluca tradicional de vela blanca por las islas de Asuán al atardecer ($10 - $15 USD)'],
            tips: ['Los relieves de la pared trasera del templo muestran los instrumentos quirúrgicos más antiguos documentados: bisturís, fórceps y tijeras'],
            curious_facts: ['Los sacerdotes de Kom Ombo criaban cocodrilos en estanques sagrados que eran alimentados con carne y vino y adornados con joyas de oro'],
            suggested_minutes: 180,
            location_info: { address: 'Kom Ombo, Aswan Governorate', priceRange: '$ - Entrada templo' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: La Cumbre de Ramsés II: Los Templos Colosales de Abu Simbel',
        notes: 'Los cuatro colosos de 20 metros tallados en la montaña rescatados por la UNESCO.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Templo de Ramsés II y Templo de Nefertari en Abu Simbel',
            latitude: 22.3372,
            longitude: 31.6258,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'La mayor hazaña propagandística y de ingeniería de Ramsés II. Cuatro colosos sedentes de 20 metros tallados en el acantilado frente a Nubia. Al lado, el templo de su amada esposa Nefertari. En los años 60, toda la montaña fue cortada en bloques y reubicada 65 metros más arriba para salvarla del lago Nasser.',
            activities: ['Asombrarse ante la colosal fachada de Ramsés II (Entrada Abu Simbel: ~600 EGP / ~$12 USD)', 'Entrar al santuario interior donde el sol ilumina las estatuas de los dioses solo dos veces al año (Gratis con entrada)', 'Pasear por la orilla del inmenso Lago Nasser'],
            tips: ['La excursión sale en convoy desde Asuán a las 4:00 AM (3 horas por carretera en el desierto) o en vuelo corto de 40 minutos'],
            curious_facts: ['La UNESCO cortó los templos en más de 1.000 bloques gigantes de hasta 30 toneladas cada uno para reensamblarlos milimétricamente en una colina artificial de hormigón'],
            suggested_minutes: 240,
            location_info: { address: 'Abu Simbel, Aswan Governorate', priceRange: '$$$ - Excursión desde Asuán' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Poblado Nubio de Asuán y Retorno a El Cairo',
        notes: 'Casas de colores en el Nilo, especias africanas y vuelo internacional.',
        stops: [
          {
            stop_order: 1,
            name: 'Aldea Nubia de Gharb Soheil y Retorno',
            latitude: 24.0550,
            longitude: 32.8700,
            image_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80'],
            description: 'Pueblo tradicional del pueblo nubio a orillas de la primera catarata del Nilo con casas abovedadas pintadas de vivos azules, amarillos y blancos, donde se conservan tradiciones y música ancestral.',
            activities: ['Paseo en lancha a motor cruzando los rápidos de la primera catarata hacia el poblado ($15 USD)', 'Tomar té de hibisco (*karkadeh*) en una casa tradicional nubia (€2)', 'Vuelo de retorno de Asuán a El Cairo para conexión internacional'],
            tips: ['Excelente lugar para comprar especias de alta calidad como comino negro, incienso y henna natural'],
            curious_facts: ['En muchas casas nubias los habitantes crían pequeños cocodrilos en estanques como símbolo de protección contra el mal de ojo'],
            suggested_minutes: 180,
            location_info: { address: 'Gharb Soheil, Aswan', priceRange: '$ - Visita comunitaria' }
          }
        ]
      }
    ]
  },
  {
    slug: 'vibetour-australia-extrema-barrera-sydney-12d',
    title: 'Australia Extrema: De la Ópera de Sídney a la Gran Barrera de Coral y Selva Tropical',
    country: 'Australia',
    city: 'Sídney',
    type: 'sports',
    tourScope: 'city_to_city',
    description: 'La gran aventura australiana de 12 días. La emblemática Ópera de Sídney y las olas de Bondi Beach, senderismo en las Montañas Azules, buceo y snorkel en el mayor arrecife de coral del planeta en Cairns, y expedición en la milenaria selva tropical de Daintree.',
    cover_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
    ],
    duration_minutes: 17280,
    distance_meters: 2450000,
    difficulty: 'moderate',
    rating: 4.98,
    review_count: 215,
    likes_count: 760,
    tags: ['Australia', 'Sídney', 'Gran Barrera de Coral', 'Cairns', 'Bondi Beach', 'Koalas', 'Aventura', 'Snorkel'],
    recommended_audience: ['Aventureros', 'Amantes de la fauna marina', 'Buceadores y surfistas'],
    best_season: 'Mayo a Octubre (menos humedad y mejor visibilidad submarina en la Gran Barrera)',
    recommended_schedule: 'Actividades al aire libre y deportes acuáticos en las horas de sol',
    meeting_point: 'Sydney Opera House / Circular Quay, Sídney',
    includes: ['Ruta completa de Sídney y Queensland tropical', 'Coordenadas de arrecifes protegidos de la Gran Barrera', 'Guía de senderos costeros y fauna autóctona'],
    excludes: ['Vuelo doméstico Sídney - Cairns', 'Bautizo de buceo con botella en arrecife exterior', 'Ferry y teleférico Skyrail'],
    recommendations: ['El sol en Australia es sumamente fuerte debido a la capa de ozono; usar protector solar 50+ cada dos horas', 'Llevar traje de neopreno/lycra para nadar en el norte tropical'],
    what_to_bring: ['Gafas de sol polarizadas', 'Traje de baño', 'Calzado de trekking ligero', 'Adaptador australiano (tipo I)'],
    tour_rules: ['Estrictamente prohibido tocar o pisar las formaciones de coral vivo en la Gran Barrera'],
    budget: { currency: 'AUD', estimatedPerPersonMin: 1400, estimatedPerPersonMax: 2900, notes: 'Catamarán Gran Barrera (~$250 AUD), vuelos internos, entradas y gastronomía aussie' },
    days: [
      {
        day_number: 1,
        title: 'Día 1: Sídney Icónico: Circular Quay, Ópera y Puente del Puerto',
        notes: 'Las velas de concha de la Ópera y la bahía natural más hermosa del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Sydney Opera House y Sydney Harbour Bridge',
            latitude: -33.8568,
            longitude: 151.2153,
            image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'],
            description: 'Obra cumbre de la arquitectura del siglo XX diseñada por Jørn Utzon con sus velas cerámicas sobre el agua. Enfrente, el colosal arco de acero del Sydney Harbour Bridge ("el perchero").',
            activities: ['Tour guiado por el interior de las salas de conciertos de la Ópera ($43 AUD)', 'Caminar sobre la pasarela peatonal del Harbour Bridge para vista panorámica gratuita de la bahía (Gratis)', 'Tomar una cerveza artesanal australiana en el Opera Bar junto al agua ($12 - $16 AUD)'],
            tips: ['La caminata peatonal por el puente del puerto es completamente gratuita y ofrece una de las mejores vistas del mundo'],
            curious_facts: ['Las conchas del tejado de la Ópera están cubiertas por más de 1.056.000 azulejos de cerámica sueca autolimpiables'],
            suggested_minutes: 210,
            location_info: { address: 'Bennelong Point, Sydney NSW 2000', priceRange: '$$ - Tour ópera' }
          }
        ]
      },
      {
        day_number: 2,
        title: 'Día 2: Surf y Sendero Costero: Bondi to Coogee Walk',
        notes: 'La piscina marina de Bondi Icebergs y acantilados sobre el océano Pacífico.',
        stops: [
          {
            stop_order: 1,
            name: 'Playa de Bondi y Sendero Costero Bondi to Coogee',
            latitude: -33.8915,
            longitude: 151.2767,
            image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'],
            description: 'La playa de surf más célebre de Australia. A su costado, la icónica piscina de agua salada de Bondi Icebergs donde rompen las olas del mar. El sendero costero de 6 kilómetros bordea acantilados dorados y calas vírgenes.',
            activities: ['Nadar en la piscina oceánica de Bondi Icebergs (Entrada: $10 AUD)', 'Caminata escénica de 2 horas por los acantilados de Bondi a Coogee (Gratis)', 'Clase de surf para principiantes en las olas de Bondi ($80 - $110 AUD)'],
            tips: ['Nadar siempre estrictamente entre las banderas rojas y amarillas patrulladas por los salvavidas'],
            curious_facts: ['Bondi Beach es la cuna del primer club de salvamento marítimo del mundo (*Surf Life Saving Club*), fundado en 1907'],
            suggested_minutes: 240,
            location_info: { address: 'Bondi Beach, NSW 2026', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 3,
        title: 'Día 3: Blue Mountains: Las Tres Hermanas y Valles de Eucaliptos',
        notes: 'El cañón azul de niebla de eucalipto y el tren más inclinado del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Three Sisters en Echo Point (Blue Mountains)',
            latitude: -33.7320,
            longitude: 150.3120,
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
            description: 'Parque Nacional a 2 horas en tren desde Sídney. Famoso por las tres agujas de arenisca conocidas como las "Tres Hermanas" que dominan el valle Jamison cubierto por millones de árboles de eucalipto que emiten una bruma azulada.',
            activities: ['Mirador panorámico de Echo Point sobre las Tres Hermanas (Gratis)', 'Bajar al valle en Scenic Railway, el tren de pasajeros más empinado del mundo con 52 grados de pendiente ($55 AUD pase Scenic World)', 'Senderismo entre cascadas en Wentworth Falls (Gratis)'],
            tips: ['El tren de cercanías de NSW TrainLink sale cada hora desde Sydney Central hasta Katoomba ($7 AUD con tarjeta Opal)'],
            curious_facts: ['El color azul que da nombre a las montañas se debe a la evaporación del aceite de las hojas de millones de eucaliptos, que dispersa la luz azul en la atmósfera'],
            suggested_minutes: 300,
            location_info: { address: 'Echo Point Rd, Katoomba NSW 2780', priceRange: '$$ - Tren y miradores' }
          }
        ]
      },
      {
        day_number: 4,
        title: 'Día 4: Vuelo al Norte Tropical: Cairns y la Laguna Costera',
        notes: 'Llegada a Queensland tropical y piscina artificial en el malecón.',
        stops: [
          {
            stop_order: 1,
            name: 'Cairns Esplanade Lagoon',
            latitude: -16.9186,
            longitude: 145.7780,
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
            description: 'Vuelo de 3 horas de Sídney a Cairns, la puerta de entrada a la Gran Barrera de Coral. Su malecón cuenta con una inmensa piscina de agua salada de 4.800 m² pública y segura con arena blanca.',
            activities: ['Baño gratuito en la laguna pública de la Explanada de Cairns (Gratis)', 'Cena de pescado barramundi a la parrilla con ensalada tropical ($30 - $45 AUD)', 'Visitar el mercado nocturno Cairns Night Markets para artesanías aborígenes ($10 - $30 AUD)'],
            tips: ['En la costa de Cairns no se debe nadar en el mar abierto por presencia de cocodrilos marinos y medusas; usar siempre la laguna artificial protegida'],
            curious_facts: ['La laguna de Cairns cuenta con agua de mar filtrada y salvavidas permanentes abierta todo el año sin costo alguno'],
            suggested_minutes: 180,
            location_info: { address: 'Esplanade, Cairns QLD 4870', priceRange: '$ - Acceso gratuito' }
          }
        ]
      },
      {
        day_number: 5,
        title: 'Día 5: La Maravilla Viva: Snorkel en la Gran Barrera de Coral Exterior',
        notes: 'El mayor ser vivo de la Tierra visible desde el espacio.',
        stops: [
          {
            stop_order: 1,
            name: 'Gran Barrera de Coral: Arrecifes Hastings y Saxon',
            latitude: -16.5160,
            longitude: 145.9830,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'El mayor ecosistema de arrecifes del planeta, con 2.300 kilómetros de longitud. Navegación en catamarán de alta velocidad hasta el arrecife exterior con jardines de coral duros y blandos, tortugas marinas verdes, peces payaso y almejas gigantes.',
            activities: ['Snorkel guiado con biólogo marino en el arrecife exterior (Tour catamarán de día completo con almuerzo: ~$220 - $280 AUD)', 'Bautizo de buceo con botella para principiantes con instructor ($80 AUD opcional)', 'Paseo en semisumergible con fondo de cristal para ver los fondos sin mojarse (Incluido en el tour)'],
            tips: ['Tomar una pastilla contra el mareo antes de zarpar en el catamarán; el trayecto por mar abierto puede tener oleaje'],
            curious_facts: ['La Gran Barrera de Coral no es un solo arrecife, sino un laberinto colosal de casi 3.000 arrecifes individuales y 900 islas'],
            suggested_minutes: 360,
            location_info: { address: 'Outer Great Barrier Reef, QLD', priceRange: '$$$$ - Tour arrecife' }
          }
        ]
      },
      {
        day_number: 6,
        title: 'Día 6: Isla Verde (Green Island): Cayo de Coral en la Selva Marina',
        notes: 'Cayo de coral con bosque tropical y playas de arena blanca.',
        stops: [
          {
            stop_order: 1,
            name: 'Green Island y Paseo de Selva Tropical Marina',
            latitude: -16.7600,
            longitude: 145.9740,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
            description: 'Un cayo de arena coralina de 6.000 años de antigüedad que alberga una densa selva tropical en su interior rodeada por arrecifes de coral a escasos metros de la playa.',
            activities: ['Ferry rápido de 45 minutos desde Cairns hasta Green Island ($110 AUD ida y vuelta)', 'Nadar directamente desde la playa entre tortugas marinas que pastan praderas de pastos marinos (Gratis con equipo de snorkel)', 'Caminata autoguiada por el paseo de madera bajo el dosel del bosque tropical (Gratis)'],
            tips: ['Ideal para familias o viajeros que prefieren hacer snorkel desde la comodidad de la playa'],
            curious_facts: ['Es uno de los únicos 300 cayos de coral del mundo que ha desarrollado su propio bosque tropical completo'],
            suggested_minutes: 270,
            location_info: { address: 'Green Island, Great Barrier Reef', priceRange: '$$ - Ferry a la isla' }
          }
        ]
      },
      {
        day_number: 7,
        title: 'Día 7: Teleférico Skyrail y Pueblo Bohemio de Kuranda',
        notes: 'Vuelo en teleférico sobre las copas de la selva tropical más antigua del mundo.',
        stops: [
          {
            stop_order: 1,
            name: 'Skyrail Rainforest Cableway y Cascada Barron Falls',
            latitude: -16.8500,
            longitude: 145.6700,
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
            description: 'Teleférico de 7.5 kilómetros que sobrevuela a escasos metros las copas de los árboles de la selva tropical húmeda declarada Patrimonio Mundial. Paradas en pasarelas sobre la garganta de las cataratas Barron.',
            activities: ['Vuelo panorámico en teleférico Skyrail con cabina de suelo de cristal ($62 AUD)', 'Mirador de la garganta profunda de Barron Falls (Gratis con el teleférico)', 'Pasear por el mercado artesanal de Kuranda y ver koalas en Kuranda Koala Gardens ($22 AUD)'],
            tips: ['Hacer la subida en el teleférico Skyrail y el regreso en el histórico tren escénico Kuranda Scenic Railway de madera'],
            curious_facts: ['La selva tropical de Queensland tiene más de 135 millones de años, siendo significativamente más antigua que la selva del Amazonas'],
            suggested_minutes: 300,
            location_info: { address: 'Kuranda, Queensland', priceRange: '$$ - Teleférico' }
          }
        ]
      },
      {
        day_number: 8,
        title: 'Día 8: Selva Tropical de Daintree y Cabo Tribulación',
        notes: 'Donde la selva tropical se encuentra directamente con el arrecife de coral.',
        stops: [
          {
            stop_order: 1,
            name: 'Parque Nacional Daintree y Cape Tribulation',
            latitude: -16.0833,
            longitude: 145.4667,
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
            description: 'El único lugar de la Tierra donde dos patrimonios mundiales de la UNESCO se tocan físicamente: el arrecife de coral y la selva tropical de Daintree. Hogar del casuario, ave prehistórica gigante en peligro de extinción.',
            activities: ['Crucero de avistamiento de cocodrilos de agua salada salvajes en el río Daintree ($35 AUD)', 'Caminar por las pasarelas de Dubuji entre manglares y helechos milenarios (Gratis)', 'Fotografía en el mirador de Cape Tribulation donde desembarcó el Capitán Cook en 1770 (Gratis)'],
            tips: ['Cruzar el río Daintree a bordo del transbordador por cable Daintree River Ferry ($47 AUD por vehículo ida y vuelta)'],
            curious_facts: ['El casuario (*Casuarius*) desciende directamente de los dinosaurios terópodos y posee una cresta ósea y garras afiladas de 12 centímetros'],
            suggested_minutes: 360,
            location_info: { address: 'Cape Tribulation Rd, QLD 4873', priceRange: '$$ - Excursión selva' }
          }
        ]
      },
      {
        day_number: 9,
        title: 'Día 9: Vuelo a Melbourne: Callejones de Arte Urbano y Cafés de Especialidad',
        notes: 'La capital cultural de Australia: grafitis en Hosier Lane y tranvía histórico.',
        stops: [
          {
            stop_order: 1,
            name: 'Hosier Lane, Federation Square y Flinders Street Station',
            latitude: -37.8167,
            longitude: 144.9690,
            image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'],
            description: 'Vuelo de Cairns a Melbourne. La ciudad de los callejones laberínticos (*laneways*) famosos por su arte urbano cambiante como Hosier Lane, su cultura obsesiva por el café de especialidad y la icónica fachada amarilla de la estación de Flinders Street.',
            activities: ['Fotografiar los murales de arte urbano en constante renovación en Hosier Lane (Gratis)', 'Pedir un café Flat White auténtico en Brother Baba Budan o Patricia Coffee Brewers ($5 AUD)', 'Pasear en el tranvía histórico gratuito City Circle Tram número 35 (Gratis)'],
            tips: ['En el centro de Melbourne (CBD) todo el transporte en tranvía dentro de la "Free Tram Zone" es 100% gratuito'],
            curious_facts: ['Melbourne ha sido elegida siete veces consecutivas como la ciudad con mejor calidad de vida del planeta según el ranking de *The Economist*'],
            suggested_minutes: 210,
            location_info: { address: 'Hosier Ln, Melbourne VIC 3000', priceRange: '$ - Acceso libre' }
          }
        ]
      },
      {
        day_number: 10,
        title: 'Día 10: La Gran Ruta Oceánica: Los Doce Apóstoles en el Océano Austral',
        notes: 'Columnas gigantes de piedra caliza que resisten la furia del mar salvaje.',
        stops: [
          {
            stop_order: 1,
            name: 'Los Doce Apóstoles (Twelve Apostles) en Great Ocean Road',
            latitude: -38.6658,
            longitude: 143.1044,
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
            description: 'Una de las carreteras escénicas costeras más espectaculares del mundo. En Port Campbell se alzan monumentales agujas de roca caliza de hasta 45 metros de altura aisladas en el mar batiendo contra las olas gigantes del Océano Austral.',
            activities: ['Caminar por las pasarelas del mirador de los Doce Apóstoles al atardecer (Gratis)', 'Bajar por los escalones Gibson Steps hasta la arena al pie de los acantilados (Gratis)', 'Avistar koalas salvajes durmiendo en las ramas de eucalipto en Kennett River'],
            tips: ['Excursión de día completo desde Melbourne (aprox. 12 horas con paradas escénicas en tour o coche de alquiler: ~$130 - $180 AUD)'],
            curious_facts: ['La Great Ocean Road fue construida a pico y pala por soldados que regresaron de la Primera Guerra Mundial entre 1919 y 1932 como monumento conmemorativo a sus compañeros caídos'],
            suggested_minutes: 360,
            location_info: { address: 'Great Ocean Rd, Princetown VIC 3269', priceRange: '$$ - Excursión costera' }
          }
        ]
      },
      {
        day_number: 11,
        title: 'Día 11: Los Pingüinos Pequeños de Phillip Island al Atardecer',
        notes: 'Cientos de pingüinos diminutos regresando del mar a sus madrigueras en la arena.',
        stops: [
          {
            stop_order: 1,
            name: 'Phillip Island: El Desfile de Pingüinos (Penguin Parade)',
            latitude: -38.5080,
            longitude: 145.1470,
            image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'],
            description: 'Santuario natural en una isla unida por puente a 90 minutos de Melbourne. Cada día al caer el sol, cientos de pequeños pingüinos azules (*Eudyptula minor*), la especie de pingüino más diminuta del planeta (33 cm), salen del mar en grupos coordinados para alimentar a sus crías.',
            activities: ['Ver el desfile de pingüinos desde las gradas de la playa al anochecer (Entrada general: $30 AUD)', 'Paseo por las pasarelas de Nobbies con vista a los lobos marinos (Gratis)', 'Cena con pescado fresco en el pueblo de Cowes ($25 AUD)'],
            tips: ['Está estrictamente prohibido tomar fotos o vídeos durante el desfile de pingüinos para proteger los ojos sensibles de las aves del flash'],
            curious_facts: ['Los pingüinos azules pesan apenas un kilo y pasan hasta semanas enteras nadando en el mar abierto pescando antes de regresar a tierra'],
            suggested_minutes: 240,
            location_info: { address: '1019 Ventnor Rd, Summerlands VIC 3922', priceRange: '$$ - Entrada $30 AUD' }
          }
        ]
      },
      {
        day_number: 12,
        title: 'Día 12: Real Jardín Botánico de Melbourne y Despedida Australiana',
        notes: 'Pícnic bajo árboles milenarios y traslado al aeropuerto de Tullamarine.',
        stops: [
          {
            stop_order: 1,
            name: 'Royal Botanic Gardens Victoria y Despedida',
            latitude: -37.8304,
            longitude: 144.9796,
            image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
            images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'],
            description: 'Uno de los jardines botánicos más hermosos del mundo con 38 hectáreas de colinas ajardinadas, lagos ornamentales y más de 8.500 especies de plantas de todo el planeta a orillas del río Yarra.',
            activities: ['Paseo por el sendero patrimonial de los aborígenes en el jardín botánico (Gratis)', 'Comprar cremas de aceite de árbol de té y miel de eucalipto de Tasmania ($15 - $35 AUD)', 'Autobús SkyBus directo desde Southern Cross Station hacia el aeropuerto de Melbourne ($22 AUD)'],
            tips: ['El acceso a los jardines botánicos es libre y gratuito todos los días'],
            curious_facts: ['Los jardines fueron fundados en 1846 y conservan árboles plantados en la época victoriana por exploradores botánicos legendarios'],
            suggested_minutes: 150,
            location_info: { address: 'Birdwood Ave, South Yarra VIC 3141', priceRange: '$ - Acceso libre' }
          }
        ]
      }
    ]
  }
]
