const tourProfiles = [
  {
    type: 'cultural',
    title: 'Museos, arte y memoria',
    focus: 'arte, identidad local y patrimonio vivo',
    stopIndexes: [1, 6, 7, 4, 3],
    activities: ['Visitar espacios culturales', 'Fotografiar detalles urbanos', 'Escuchar narracion guiada'],
    tips: ['Reserva tiempo para salas y exposiciones', 'Consulta horarios de museos']
  },
  {
    type: 'historical',
    title: 'Historia esencial',
    focus: 'origenes, arquitectura y memoria historica',
    stopIndexes: [6, 7, 4, 2, 8],
    activities: ['Recorrer hitos patrimoniales', 'Comparar arquitectura antigua y moderna', 'Identificar relatos locales'],
    tips: ['Haz el recorrido con luz de dia', 'Lleva calzado comodo para caminar']
  },
  {
    type: 'gastronomic',
    title: 'Sabores locales',
    focus: 'mercados, cocina tipica y zonas de encuentro',
    stopIndexes: [5, 8, 0, 4, 9],
    activities: ['Probar sabores locales', 'Visitar zonas de encuentro', 'Guardar recomendaciones culinarias'],
    tips: ['Pregunta por platos de temporada', 'Lleva efectivo para compras pequenas']
  },
  {
    type: 'urban',
    title: 'Ritmo urbano',
    focus: 'barrios caminables, miradores y vida cotidiana',
    stopIndexes: [0, 3, 5, 4, 8],
    activities: ['Caminar avenidas y plazas', 'Tomar fotos de ciudad', 'Explorar comercios locales'],
    tips: ['Evita horas de trafico fuerte', 'Usa bloqueador y agua']
  },
  {
    type: 'ecological',
    title: 'Naturaleza cercana',
    focus: 'paisaje, aire libre y pausas tranquilas',
    stopIndexes: [2, 0, 3, 5, 4],
    activities: ['Disfrutar espacios abiertos', 'Observar paisaje', 'Hacer pausas de descanso'],
    tips: ['Revisa clima antes de salir', 'No dejes residuos']
  },
  {
    type: 'family',
    title: 'Plan familiar',
    focus: 'paradas seguras, ritmo suave y actividades para todos',
    stopIndexes: [0, 3, 1, 5, 7],
    activities: ['Recorrer sin afan', 'Hacer fotos familiares', 'Tomar descansos programados'],
    tips: ['Lleva agua y snacks', 'Planea una pausa cada hora']
  }
]

const cities = [
  ['Barranquilla', 'Colombia', 4, 11.0191, -74.8007, ['Gran Malecon del Rio', 'Museo del Caribe', 'Castillo de Salgar', 'Ventana al Mundo', 'Barrio El Prado', 'Caiman del Rio', 'Antigua Aduana', 'Catedral Metropolitana Maria Reina', 'Paseo Bolivar', 'Mercado Barranquillita']],
  ['Cartagena', 'Colombia', 4, 10.4236, -75.5501, ['Torre del Reloj', 'Castillo San Felipe', 'Plaza Santo Domingo', 'Getsemani', 'Las Bovedas']],
  ['Santa Marta', 'Colombia', 4, 11.2408, -74.2122, ['Parque de los Novios', 'Quinta de San Pedro Alejandrino', 'Bahia de Santa Marta', 'Taganga', 'El Rodadero']],
  ['Bogota', 'Colombia', 4, 4.6059, -74.055, ['Monserrate', 'Museo del Oro', 'La Candelaria', 'Plaza de Bolivar', 'Parque Simon Bolivar']],
  ['Medellin', 'Colombia', 4, 6.2526, -75.5683, ['Plaza Botero', 'Comuna 13', 'Jardin Botanico', 'Pueblito Paisa', 'Parque Arvi']],
  ['Cali', 'Colombia', 3, 3.4358, -76.5656, ['Cristo Rey', 'San Antonio', 'Zoologico de Cali', 'Boulevard del Rio', 'Gato de Tejada']],
  ['Bucaramanga', 'Colombia', 3, 7.1193, -73.1227, ['Parque del Agua', 'Catedral Sagrada Familia', 'Parque Garcia Rovira', 'Cerro del Santisimo', 'Mesa de los Santos']],
  ['Villa de Leyva', 'Colombia', 3, 5.6333, -73.5244, ['Plaza Mayor', 'Casa Terracota', 'Museo El Fosil', 'Pozos Azules', 'Santo Ecce Homo']],
  ['San Andres', 'Colombia', 3, 12.5992, -81.6897, ['Johnny Cay', 'Hoyo Soplador', 'La Piscinita', 'Cueva de Morgan', 'San Luis']],
  ['Guatape', 'Colombia', 3, 6.2206, -75.1785, ['Piedra del Penol', 'Malecon de Guatape', 'Plazoleta de los Zocalos', 'Represa de Guatape', 'Calle del Recuerdo']],
  ['Paris', 'Francia', 1, 48.8584, 2.2945, ['Torre Eiffel', 'Museo del Louvre', 'Notre-Dame', 'Montmartre', 'Jardin de Luxemburgo']],
  ['Roma', 'Italia', 1, 41.8902, 12.4922, ['Coliseo', 'Foro Romano', 'Fontana di Trevi', 'Panteon', 'Piazza Navona']],
  ['Londres', 'Reino Unido', 1, 51.5007, -0.1246, ['Big Ben', 'London Eye', 'Tower Bridge', 'British Museum', 'Covent Garden']],
  ['Nueva York', 'Estados Unidos', 1, 40.758, -73.9855, ['Times Square', 'Central Park', 'Brooklyn Bridge', 'Statue of Liberty', 'High Line']],
  ['Tokio', 'Japon', 1, 35.6595, 139.7005, ['Shibuya Crossing', 'Senso-ji', 'Tokyo Skytree', 'Meiji Shrine', 'Ueno Park']],
  ['Kioto', 'Japon', 1, 34.9671, 135.7727, ['Fushimi Inari', 'Kinkaku-ji', 'Arashiyama Bamboo Grove', 'Gion', 'Kiyomizu-dera']],
  ['Seul', 'Corea del Sur', 1, 37.5796, 126.977, ['Gyeongbokgung', 'Bukchon Hanok Village', 'N Seoul Tower', 'Myeongdong', 'Dongdaemun Design Plaza']],
  ['Ciudad de Mexico', 'Mexico', 1, 19.4326, -99.1332, ['Zocalo', 'Palacio de Bellas Artes', 'Templo Mayor', 'Chapultepec', 'Coyoacan']],
  ['Barcelona', 'Espana', 1, 41.4036, 2.1744, ['Sagrada Familia', 'Park Guell', 'Casa Batllo', 'Barrio Gotico', 'La Rambla']],
  ['Dubai', 'Emiratos Arabes Unidos', 1, 25.1972, 55.2744, ['Burj Khalifa', 'Dubai Mall', 'Dubai Creek', 'Jumeirah Beach', 'Al Fahidi']],
  ['Estambul', 'Turquia', 1, 41.0086, 28.9802, ['Santa Sofia', 'Mezquita Azul', 'Gran Bazar', 'Palacio Topkapi', 'Torre Galata']],
  ['Bangkok', 'Tailandia', 1, 13.75, 100.4913, ['Grand Palace', 'Wat Arun', 'Wat Pho', 'Chatuchak Market', 'Chao Phraya']],
  ['Singapur', 'Singapur', 1, 1.2834, 103.8607, ['Marina Bay Sands', 'Gardens by the Bay', 'Merlion Park', 'Chinatown', 'Sentosa']],
  ['Praga', 'Republica Checa', 1, 50.0865, 14.4114, ['Puente de Carlos', 'Castillo de Praga', 'Plaza Ciudad Vieja', 'Reloj Astronomico', 'Mala Strana']],
  ['Sidney', 'Australia', 1, -33.8568, 151.2153, ['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach', 'The Rocks', 'Royal Botanic Garden']]
]

export function buildSeedTours() {
  const tours = []
  let id = 1
  for (const [city, country, count, lat, lng, stops] of cities) {
    for (let i = 0; i < count; i++) {
      const profile = tourProfiles[i % tourProfiles.length]
      const routeStops = pickStops(stops, profile, i)
      tours.push({
        slug: `vibetour-${String(id).padStart(2, '0')}`,
        title: `${city}: ${profile.title}`,
        country,
        city,
        type: profile.type,
        description: `Ruta ${labelType(profile.type).toLowerCase()} por ${city}, centrada en ${profile.focus}. El orden evita repeticiones y combina paradas principales con contexto local.`,
        cover_url: curatedImage(`${city} ${profile.type} ${profile.focus}`),
        gallery: [
          curatedImage(`${city} ${profile.type} architecture`),
          curatedImage(`${city} ${profile.type} local experience`),
          curatedImage(`${city} ${profile.type} travel`)
        ],
        duration_minutes: 160 + (i * 55) + routeStops.length * 18,
        distance_meters: 3600 + (i * 850) + routeStops.length * 420,
        difficulty: ['easy', 'moderate', 'intense'][id % 3],
        language: id % 2 === 0 ? 'es' : 'en',
        rating: 4.55 + ((id % 5) * 0.08),
        review_count: 42 + id * 9,
        likes_count: 120 + id * 17,
        tags: [labelType(profile.type), country, city, profile.focus],
        stops: routeStops.map((name, order) => {
          const stopName = name && name.trim() !== '' && name.toLowerCase() !== 'parada' 
            ? name 
            : `Atracción ${order + 1} del recorrido`;
          const stopDescription = `${stopName} es un emblemático punto de interés en ${city}. Se integra a este recorrido ${labelType(profile.type).toLowerCase()} para enriquecer tu experiencia gracias a su valor cultural y su conexión con ${profile.focus}.`;
          return {
            name: stopName,
            latitude: Number((lat + ((order - 2) * 0.006)).toFixed(6)),
            longitude: Number((lng + ((order % 2 === 0 ? 1 : -1) * 0.006 * (order + 1))).toFixed(6)),
            image_url: curatedImage(`${stopName} ${city} ${profile.type}`),
            description: stopDescription,
            activities: profile.activities,
            tips: profile.tips,
            suggested_minutes: 25 + order * 8,
            stop_order: order
          };
        })
      })
      id += 1
    }
  }
  return tours
}

function pickStops(stops, profile) {
  const selected = profile.stopIndexes
    .map((index) => stops[index % stops.length])
    .filter(Boolean)
  const unique = [...new Set(selected)]
  for (const stop of stops) {
    if (!unique.includes(stop)) unique.push(stop)
  }
  return unique.slice(0, Math.min(stops.length, 6))
}

function labelType(type) {
  return {
    cultural: 'Cultural',
    historical: 'Historico',
    gastronomic: 'Gastronomico',
    urban: 'Urbano',
    ecological: 'Ecologico',
    family: 'Familiar'
  }[type] ?? 'Personalizado'
}

function curatedImage(seed) {
  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80'
  ]
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}
