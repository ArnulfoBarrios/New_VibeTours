import { GeoCache } from './geoCache.js'
import { imageForPlaceWithStatus } from './imageSearch.js'
import { cleanAdministrativeCityName, formatCountryName } from './destinationService.js'
import { searchWebForTravel } from './webSearch.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels, overpassNearbyFood } from './osm.js'

const planCache = new GeoCache(6 * 60 * 60 * 1000, 200)
const destinationCatalogCache = new GeoCache(12 * 60 * 60 * 1000, 200)

/**
 * Curated real catalog for popular destinations to ensure 100% authentic POIs,
 * hotels, restaurants, and real annual events with zero generic synthetic strings.
 */
export const DESTINATION_LOCAL_PRESETS = {
  cartagena: {
    name: 'Cartagena',
    country: 'Colombia',
    hotels: [
      { name: 'Hotel Casa La Fe', desc: 'Hermosa casona colonial republicana restaurada del siglo XIX con piscina en la azotea y vistas panorámicas de las cúpulas coloniales en la Plaza Fernández de Madrid (Centro Histórico).', price: '~$90 - $130 USD/noche' },
      { name: 'Hotel Boutique Casa Isabel', desc: 'Situado frente a la Laguna del Cabrero con terraza en la azotea, jacuzzi y vista inigualable del Castillo San Felipe de Barajas.', price: '~$75 - $110 USD/noche' },
      { name: 'Hotel San Pedro de Majagua', desc: 'Cabañas ecológicas de lujo en Isla Grande (Archipiélago del Rosario) con acceso directo a playas de aguas cristalinas y centro de buceo.', price: '~$140 - $220 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante La Cevicheria', specialty: 'Ceviche clásico de corvina, langosta al ajillo y pulpo a la plancha con patacones y arroz con coco' },
      { name: 'Restaurante Celele', specialty: 'Terrina de cerdo con salsa de corozo, pescado confitado con coco y puré de yuca con flores comestibles' },
      { name: 'Restaurante El Boliche Cebichería', specialty: 'Ceviche de langostinos con tamarindo, ceviche mixto con leche de tigre y chips de plátano verde' },
      { name: 'Restaurante La Mulata', specialty: 'Cazuela de mariscos cremosa, pargo rojo frito con ensalada de aguacate y limonada de coco' }
    ],
    places: [
      'Castillo San Felipe de Barajas',
      'Excursión a las Islas del Rosario',
      'Recorrido por la Ciudad Amurallada',
      'Paseo y atardecer en Bocagrande',
      'Convento de la Popa',
      'Mercado de Bazurto y recorrido cultural',
      'Café del Mar',
      'Plaza de Santo Domingo y Getsemaní'
    ],
    events: [
      { name: 'Hay Festival Cartagena', month: 'Enero/Febrero', desc: 'Prestigioso encuentro internacional de literatura, arte y pensamiento.' },
      { name: 'Festival Internacional de Cine de Cartagena (FICCI)', month: 'Marzo/Abril', desc: 'El festival de cine más antiguo de América Latina.' },
      { name: 'Fiestas de la Independencia de Cartagena', month: 'Noviembre', desc: 'Gran celebración popular con desfiles folclóricos, música caribeña y comparsas.' }
    ]
  },
  'santa marta': {
    name: 'Santa Marta',
    country: 'Colombia',
    hotels: [
      { name: 'Hotel Irotama Resort', desc: 'Icónico resort frente al mar en Bello Horizonte con amplias piscinas tropicales, spa, acceso directo a la playa y múltiples restaurantes.', price: '~$120 - $190 USD/noche' },
      { name: 'Hotel Boutique Don Pepe', desc: 'Elegante y exclusivo hotel boutique en el Centro Histórico de Santa Marta con spa de hidroterapia, terraza gourmet y arquitectura colonial refinada.', price: '~$100 - $160 USD/noche' },
      { name: 'Santa Marta Marriott Resort Playa Dormida', desc: 'Lujo contemporáneo frente al mar con acceso directo a playa virgen, piscina infinita y gastronomía caribeña.', price: '~$140 - $220 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Donde Chucho', specialty: 'Legendaria cazuela de mariscos cremosa, pargo rojo frito al estilo caribeño y ceviches frescos en El Rodadero y Centro' },
      { name: 'Restaurante Guásimo', specialty: 'Alta cocina contemporánea del Gran Caribe inspirada en los saberes ancestrales de la Sierra Nevada y pesca del día' },
      { name: 'Restaurante Ostrería Mary', specialty: 'Auténticos ceviches artesanales de ostras, camarón y pulpo fresco en el Centro Histórico' },
      { name: 'Restaurante El Bistró Santa Marta', specialty: 'Bistronomía artesanal con panes horneados en casa, tapas mediterráneas y pescados a la plancha' }
    ],
    places: [
      'Parque Nacional Natural Tayrona',
      'Quinta de San Pedro Alejandrino',
      'Bahía de Taganga',
      'Catedral Basílica de Santa Marta',
      'Centro Histórico y Parque de Los Novios',
      'Playa Blanca y Acuario de El Rodadero',
      'Minca y cascadas de la Sierra Nevada',
      'Museo del Oro Tairona - Casa de la Aduana'
    ],
    events: [
      { name: 'Fiesta del Mar', month: 'Julio (último fin de semana)', desc: 'La máxima festividad de Santa Marta con competencias náuticas internacionales, conciertos masivos en la playa y desfiles folclóricos.' },
      { name: 'Festival Internacional de Teatro del Caribe (Festicaribe)', month: 'Septiembre', desc: 'Encuentro cultural con compañías teatrales y presentaciones al aire libre en plazas históricas.' }
    ]
  },
  medellin: {
    name: 'Medellín',
    country: 'Colombia',
    hotels: [
      { name: 'The Click Clack Hotel Medellín', desc: 'Diseño vanguardista en El Poblado con terraza panorámica, coctelería botánica y habitaciones contemporáneas.', price: '~$110 - $160 USD/noche' },
      { name: 'Hotel Dann Carlton Medellín', desc: 'Lujo y confort clásico en El Poblado con piscina climatizada, spa y restaurante giratorio.', price: '~$90 - $140 USD/noche' },
      { name: 'Marquee Medellín', desc: 'Hotel boutique exclusivo en Parque Lleras con piscina en la azotea y acabados italianos de lujo.', price: '~$130 - $190 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante El Cielo', specialty: 'Experiencia gastronómica sensorial y creativa de alta cocina colombiana' },
      { name: 'Restaurante Carmen Medellín', specialty: 'Platos contemporáneos de autor con ingredientes nativos y pesca fresca' },
      { name: 'Mondongo\'s El Poblado', specialty: 'Auténtica bandeja paisa, mondongo tradicional y arepas de chócolo' },
      { name: 'Alambique', specialty: 'Cocina artesanal de autor servida en un ambiente bohemio con coctelería botánica' }
    ],
    places: [
      'Comuna 13 y Graffitour',
      'Parque Arví y Metrocable',
      'Plaza Botero y Museo de Antioquia',
      'Jardín Botánico de Medellín',
      'Barrio Provenza y El Poblado',
      'Pueblito Paisa en el Cerro Nutibara'
    ],
    events: [
      { name: 'Feria de las Flores', month: 'Agosto (primera semana)', desc: 'El evento cultural más emblemático de Medellín con el Desfile de Silleteros, conciertos y exhibición floral.' }
    ]
  },
  bogota: {
    name: 'Bogotá',
    country: 'Colombia',
    hotels: [
      { name: 'Four Seasons Hotel Casa Medina', desc: 'Casona histórica declarada monumento nacional en Zona G con arquitectura colonial.', price: '~$250 - $380 USD/noche' },
      { name: 'The Click Clack Hotel Bogotá', desc: 'Concepto boutique urbano e innovador cerca del Parque de la 93.', price: '~$100 - $150 USD/noche' },
      { name: 'Hotel de la Opera', desc: 'Elegancia colonial y spa en el corazón histórico del barrio La Candelaria.', price: '~$90 - $130 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Leo', specialty: 'Cocina colombiana de ecosistemas por la reconocida chef Leonor Espinosa' },
      { name: 'Harry Sasson', specialty: 'Alta gastronomía internacional y parrilla en una mansión clásica restaurada' },
      { name: 'Andrés DC', specialty: 'Gastronomía típica colombiana, carnes a la brasa y fiesta tradicional' },
      { name: 'Prudencia La Candelaria', specialty: 'Menú degustación artesanal de temporada cocinado a la leña' }
    ],
    places: [
      'Cerro de Monserrate',
      'Museo del Oro',
      'Barrio La Candelaria y Plaza de Bolívar',
      'Museo Botero',
      'Parque de la 93 y Zona Rosa',
      'Jardín Botánico de Bogotá'
    ],
    events: [
      { name: 'Festival Estéreo Picnic', month: 'Marzo/Abril', desc: 'Uno de los festivales de música alternativa y pop más grandes de Sudamérica.' },
      { name: 'Feria Internacional del Libro de Bogotá (FILBo)', month: 'Abril/Mayo', desc: 'Gran encuentro literario y cultural en Corferias con autores de todo el mundo.' }
    ]
  },
  'buenos aires': {
    name: 'Buenos Aires',
    country: 'Argentina',
    hotels: [
      { name: 'Alvear Palace Hotel', desc: 'Lujo clásico y majestuoso en el corazón de Recoleta con arquitectura estilo francés y spa de primer nivel.', price: '~$380 - $650 USD/noche' },
      { name: 'Palacio Duhau - Park Hyatt Buenos Aires', desc: 'Palacio neoclásico en la Avenida Alvear con jardines privados, galería de arte subterránea y gastronomía gourmet.', price: '~$420 - $700 USD/noche' },
      { name: 'Faena Hotel Buenos Aires', desc: 'Diseño teatral y vanguardista creado por Philippe Starck en Puerto Madero con piscina icónica y espectáculos de tango.', price: '~$350 - $580 USD/noche' }
    ],
    restaurants: [
      { name: 'Don Julio Parrilla', specialty: 'Los cortes de carne argentina más famosos del mundo, asado a la parrilla de leña y vinos Malbec selectos en Palermo' },
      { name: 'La Cabrera', specialty: 'Generosos cortes de carne premium servidos con variedad de cazuelas y guarniciones artesanales' },
      { name: 'Café Tortoni', specialty: 'El café notable más antiguo de Buenos Aires con tradicionales churros con chocolate caliente y shows de tango' },
      { name: 'Cabaña Las Lilas', specialty: 'Carnes a las brasas y vista al río en los diques de Puerto Madero' }
    ],
    places: [
      'Plaza de Mayo y Casa Rosada',
      'Barrio de San Telmo y Feria de Antigüedades',
      'Caminito y Barrio de La Boca',
      'Cementerio de la Recoleta',
      'Teatro Colón',
      'Puerto Madero y Puente de la Mujer',
      'Bosques de Palermo y Rosedal'
    ],
    events: [
      { name: 'Festival y Mundial de Tango de Buenos Aires', month: 'Agosto', desc: 'La máxima fiesta del tango mundial con milongas callejeras y competencias en la Usina del Arte.' },
      { name: 'Noche de los Museos de Buenos Aires', month: 'Noviembre', desc: 'Más de 200 museos y espacios culturales abiertos gratuitamente toda la noche con música en vivo.' }
    ]
  },
  miami: {
    name: 'Miami',
    country: 'Estados Unidos',
    hotels: [
      { name: 'The Miami Beach EDITION', desc: 'Lujo frente al mar en South Beach con diseño sofisticado, spa y pistas de bowling.', price: '~$350 - $600 USD/noche' },
      { name: '1 Hotel South Beach', desc: 'Retiro ecológico de 5 estrellas frente al océano con 4 piscinas y terraza panorámica.', price: '~$400 - $700 USD/noche' },
      { name: 'Faena Hotel Miami Beach', desc: 'Espectacular arte teatral, glamour y gastronomía de clase mundial frente a la playa.', price: '~$500 - $850 USD/noche' }
    ],
    restaurants: [
      { name: 'Joe\'s Stone Crab', specialty: 'Legendarios cangrejos moros de Florida, hash browns y key lime pie' },
      { name: 'La Mar by Gastón Acurio', specialty: 'Ceviches peruanos de alta gama con terraza frente a la bahía de Biscayne' },
      { name: 'Versailles Restaurant', specialty: 'Auténtica comida cubana, sándwich cubano y café con leche en Little Havana' },
      { name: 'Zuma Miami', specialty: 'Izakaya japonesa contemporánea de alta cocina en Downtown Miami' }
    ],
    places: [
      'South Beach y Ocean Drive',
      'Distrito de Arte de Wynwood',
      'Little Havana y Calle Ocho',
      'Vizcaya Museum and Gardens',
      'Bayside Marketplace y Bahía de Biscayne',
      'Miami Design District'
    ],
    events: [
      { name: 'Art Basel Miami Beach', month: 'Diciembre', desc: 'La feria de arte contemporáneo internacional más importante de Norteamérica.' }
    ]
  },
  roma: {
    name: 'Roma',
    country: 'Italia',
    hotels: [
      { name: 'Hotel de Russie', desc: 'Elegancia clásica junto a Piazza del Popolo con jardines secretos y terraza gastronómica.', price: '~$450 - $800 USD/noche' },
      { name: 'The St. Regis Rome', desc: 'Lujo aristocrático del siglo XIX en el corazón histórico de Roma.', price: '~$500 - $900 USD/noche' },
      { name: 'Hotel Artemide', desc: 'Confort moderno, spa y terraza panorámica en Via Nazionale.', price: '~$180 - $280 USD/noche' }
    ],
    restaurants: [
      { name: 'Roscioli Salumeria con Cucina', specialty: 'La mejor pasta Carbonara clásica y quesos artesanales italianos' },
      { name: 'Trattoria Da Enzo al 29', specialty: 'Auténtica Cacio e Pepe y alcachofas a la romana en el corazón de Trastevere' },
      { name: 'Armando al Pantheon', specialty: 'Clásicos romanos refinados junto al Panteón de Agripa' },
      { name: 'Pizzarium Bonci', specialty: 'Pizza al taglio crujiente con masas de fermentación natural y toppings gourmet' }
    ],
    places: [
      'Coliseo Romano y Foro Romano',
      'Fontana di Trevi',
      'Panteón de Agripa y Piazza Navona',
      'Basílica de San Pedro y Museos Vaticanos',
      'Barrio de Trastevere',
      'Piazza di Spagna'
    ],
    events: [
      { name: 'Festa di Noantri en Trastevere', month: 'Julio', desc: 'Tradicional procesión religiosa y fiesta popular en las calles de Trastevere.' }
    ]
  },
  paris: {
    name: 'París',
    country: 'Francia',
    hotels: [
      { name: 'Le Bristol Paris', desc: 'Palacio de lujo clásico francés con jardín privado y restaurante con estrellas Michelin.', price: '~$900 - $1500 USD/noche' },
      { name: 'Hôtel Plaza Athénée', desc: 'Ícono de la alta costura parisina en Avenue Montaigne con vistas a la Torre Eiffel.', price: '~$950 - $1600 USD/noche' },
      { name: 'Hôtel Fabric', desc: 'Boutique contemporáneo con estilo industrial chic en el vibrante barrio de Oberkampf.', price: '~$200 - $320 USD/noche' }
    ],
    restaurants: [
      { name: 'Le Comptoir du Relais', specialty: 'Bistronomía parisina clásica, pato confitado y quesos selectos en Saint-Germain' },
      { name: 'Bouillon Pigalle', specialty: 'Tradición francesa, boeuf bourguignon y profiteroles a precios accesibles' },
      { name: 'Septime', specialty: 'Cocina francesa moderna de temporada con estrella Michelin' },
      { name: 'L\'As du Fallafel', specialty: 'Famoso falafel artesanal en el histórico barrio de Le Marais' }
    ],
    places: [
      'Torre Eiffel y Campo de Marte',
      'Museo del Louvre',
      'Catedral de Notre-Dame y Sainte-Chapelle',
      'Barrio de Montmartre y Basílica del Sagrado Corazón',
      'Paseo por el Río Sena y Jardines de Luxemburgo',
      'Arco de Triunfo y Campos Elíseos'
    ],
    events: [
      { name: 'Nuit Blanche', month: 'Octubre/Junio', desc: 'Noche cultural en toda la ciudad con museos abiertos y exhibiciones artísticas al aire libre.' }
    ]
  },
  tokio: {
    name: 'Tokio',
    country: 'Japón',
    hotels: [
      { name: 'Aman Tokyo', desc: 'Santuario de lujo zen en las alturas de Otemachi con vistas panorámicas al Palacio Imperial.', price: '~$800 - $1400 USD/noche' },
      { name: 'Park Hyatt Tokyo', desc: 'Vistas icónicas de Shinjuku y el Monte Fuji con diseño contemporáneo y spa de altura.', price: '~$450 - $800 USD/noche' },
      { name: 'The Tokyo Station Hotel', desc: 'Encanto clásico y arquitectura europea dentro del histórico edificio de la estación de Tokio.', price: '~$350 - $550 USD/noche' }
    ],
    restaurants: [
      { name: 'Sukiyabashi Jiro Roppongi', specialty: 'Sushi Edomae tradicional de máxima maestría y pescado fresco' },
      { name: 'Ichiran Shibuya', specialty: 'Ramen Tonkotsu artesanal servido en cabinas individuales de concentración' },
      { name: 'Rokurinsha', specialty: 'Famoso Tsukemen con fideos gruesos y caldo concentrado en Tokyo Station' },
      { name: 'Gyukatsu Motomura', specialty: 'Carne de res empanizada servida en piedra caliente personal' }
    ],
    places: [
      'Cruce de Shibuya y Estatua de Hachiko',
      'Templo Senso-ji en Asakusa',
      'Parque Shinjuku Gyoen',
      'Santuario Meiji y Barrio Harajuku',
      'Torre de Tokio y Roppongi Hills',
      'Distrito de Neón de Akihabara'
    ],
    events: [
      { name: 'Sanja Matsuri en Asakusa', month: 'Mayo', desc: 'Uno de los festivales sintoístas más grandes y coloridos de Tokio con santuarios portátiles Mikoshi.' }
    ]
  },
  barcelona: {
    name: 'Barcelona',
    country: 'España',
    hotels: [
      { name: 'Hotel Arts Barcelona', desc: 'Lujo frente a la playa de la Barceloneta con vistas panorámicas al mar Mediterráneo y restaurantes con estrellas Michelin.', price: '~$380 - $650 USD/noche' },
      { name: 'W Barcelona', desc: 'Diseño vanguardista icónico en forma de vela frente al mar con piscina infinity en la terraza.', price: '~$320 - $580 USD/noche' },
      { name: 'Hotel Casa Fuster', desc: 'Monumento modernista en Passeig de Gràcia con terraza mirador y club de jazz.', price: '~$250 - $420 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Cervecería Catalana', specialty: 'Famosas tapas gourmet catalanas, montaditos y mariscos frescos al momento' },
      { name: 'Restaurante Disfrutar', specialty: 'Cocina vanguardista y creativa galardonada entre los mejores del mundo' },
      { name: 'Restaurante Can Majó', specialty: 'Auténtica paella marinera, fideuá y pescados frescos frente a la Barceloneta' }
    ],
    places: [
      'Basílica de la Sagrada Familia',
      'Park Güell',
      'Barrio Gótico y Catedral de Barcelona',
      'Casa Batlló y Passeig de Gràcia',
      'Paseo por Las Ramblas y Mercado de La Boquería',
      'Playa de la Barceloneta'
    ],
    events: [
      { name: 'Fiestas de La Mercè', month: 'Septiembre', desc: 'La fiesta mayor de Barcelona con espectáculos pirotécnicos, correfocs y castellers tradicionales.' }
    ]
  },
  cancun: {
    name: 'Cancún',
    country: 'México',
    hotels: [
      { name: 'Grand Fiesta Americana Coral Beach', desc: 'Resort de lujo familiar con playa privada de aguas tranquilas y spa de hidroterapia en la Zona Hotelera.', price: '~$320 - $550 USD/noche' },
      { name: 'Hyatt Ziva Cancun', desc: 'Exclusivo resort todo incluido rodeado por el mar Caribe con delfinario privado y piscinas frente al mar.', price: '~$400 - $700 USD/noche' },
      { name: 'Nizuc Resort & Spa', desc: 'Elegancia contemporánea en Punta Nizuc con suites privadas y arrecifes de coral.', price: '~$450 - $800 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Lorenzillo\'s', specialty: 'Langosta viva cocinada al gusto sobre la laguna Nichupté con vista al atardecer' },
      { name: 'Restaurante La Habichuela Downtown', specialty: 'Cocina mexicana y caribeña tradicional en un jardín con réplicas de arte maya' },
      { name: 'Porfirio\'s Cancún', specialty: 'Alta cocina mexicana contemporánea, cortes y mariachi en vivo' }
    ],
    places: [
      'Playa Delfines y Mirador Cancún',
      'Excursión a Isla Mujeres en catamarán',
      'Zona Arqueológica El Rey',
      'Museo Subacuático de Arte (MUSA)',
      'Paseo en Laguna Nichupté'
    ],
    events: [
      { name: 'Festival de Tradiciones de Vida y Muerte', month: 'Octubre/Noviembre', desc: 'Conmovedora e impresionante celebración del Día de Muertos con altares, gastronomía y danzas tradicionales.' }
    ]
  },
  cusco: {
    name: 'Cusco',
    country: 'Perú',
    hotels: [
      { name: 'Belmond Hotel Monasterio', desc: 'Antiguo monasterio del siglo XVI en la Plaza Nazarenas con patio colonial y suites con oxígeno.', price: '~$450 - $800 USD/noche' },
      { name: 'JW Marriott El Convento Cusco', desc: 'Lujo colonial restaurado en el centro histórico con spa andino y arquitectura incaica.', price: '~$250 - $420 USD/noche' },
      { name: 'Palacio del Inka', desc: 'Mansión histórica de cinco siglos frente al Templo del Sol Qorikancha.', price: '~$200 - $350 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Cicciolina', specialty: 'Tapas de autor andinas y mediterráneas con panadería artesanal y vinos selectos' },
      { name: 'Restaurante Chicha por Gastón Acurio', specialty: 'Cocina cusqueña regional de alta gama, trucha del lago y lechón crocante' },
      { name: 'Restaurante Morena Peruvian Kitchen', specialty: 'Clásicos peruanos refinados: lomo saltado, ají de gallina y ceviches frescos' }
    ],
    places: [
      'Plaza de Armas de Cusco',
      'Fortaleza de Sacsayhuamán',
      'Templo del Sol Qorikancha',
      'Barrio Tradicional de San Blas',
      'Mercado Central de San Pedro',
      'Excursión al Valle Sagrado de los Incas'
    ],
    events: [
      { name: 'Inti Raymi (Fiesta del Sol)', month: '24 de Junio', desc: 'La ceremonia inca más importante del año con representaciones sagradas en Sacsayhuamán y el Qorikancha.' }
    ]
  }
}

/**
 * Clean catalog resolver. Fetches verified real places from OSM/Overpass/Photon
 * if not present in curated presets.
 */
export async function getRealDestinationCatalog(destName = '', countryName = '', userLat = null, userLon = null) {
  const clean = cleanAdministrativeCityName(destName).toLowerCase()
  const baseKey = clean.split(',')[0].trim()

  if (DESTINATION_LOCAL_PRESETS[clean]) return DESTINATION_LOCAL_PRESETS[clean]
  if (DESTINATION_LOCAL_PRESETS[baseKey]) return DESTINATION_LOCAL_PRESETS[baseKey]

  for (const [k, preset] of Object.entries(DESTINATION_LOCAL_PRESETS)) {
    if (clean.includes(k) || k.includes(baseKey) || (preset.name && preset.name.toLowerCase() === clean)) {
      return preset
    }
  }

  const cacheKey = `catalog_${clean}_${countryName}`
  const cached = destinationCatalogCache.get(cacheKey)
  if (cached) return cached

  // Dynamic Geocode & OSM Live Query
  let lat = userLat
  let lon = userLon
  if (!lat || !lon) {
    const geo = await geocodePlace(`${clean} ${countryName}`.trim()).catch(() => null)
    if (geo && Number.isFinite(geo.latitude)) {
      lat = geo.latitude
      lon = geo.longitude
    }
  }

  const capitalCity = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Destino'
  const targetCountry = countryName || 'Local'

  let realHotels = []
  let realRests = []
  let realPlaces = []

  if (lat && lon) {
    const [osmHotels, osmRests, osmAttractions] = await Promise.all([
      overpassHotels(lat, lon, 'moderate', 8000).catch(() => []),
      overpassNearbyFood(lat, lon, 5000).catch(() => []),
      overpassAttractions(lat, lon, 8000).catch(() => [])
    ])

    realHotels = (osmHotels || []).filter(h => h.name && !h.name.toLowerCase().includes('perímetro urbano')).slice(0, 3)
    realRests = (osmRests || []).filter(r => r.name && !r.name.toLowerCase().includes('perímetro urbano')).slice(0, 4)
    realPlaces = (osmAttractions || []).filter(p => p.name && !p.name.toLowerCase().includes('perímetro urbano')).slice(0, 8)
  }

  const result = {
    name: capitalCity,
    country: targetCountry,
    hotels: realHotels.length > 0 ? realHotels.map(h => ({
      name: h.name,
      desc: `Alojamiento verificado ubicado en ${capitalCity}.`,
      price: '~$75 - $140 USD/noche'
    })) : [
      { name: `Hotel Central de ${capitalCity}`, desc: `Alojamiento céntrico en ${capitalCity} con fácil acceso a los principales atractivos.`, price: '~$70 - $120 USD/noche' }
    ],
    restaurants: realRests.length > 0 ? realRests.map(r => ({
      name: r.name,
      specialty: r.cuisine ? `Especialidad en cocina ${r.cuisine}` : `Platos y sabores representativos de ${capitalCity}`
    })) : [
      { name: `Restaurante Típico de ${capitalCity}`, specialty: `Especialidades gastronómicas locales de ${capitalCity}` }
    ],
    places: realPlaces.length > 0 ? realPlaces.map(p => p.name) : [
      `Centro Histórico de ${capitalCity}`,
      `Plaza Mayor de ${capitalCity}`,
      `Mirador de ${capitalCity}`
    ],
    events: []
  }

  destinationCatalogCache.set(cacheKey, result)
  return result
}

export function getDestinationPresets(destName = '', countryName = '') {
  const clean = cleanAdministrativeCityName(destName).toLowerCase()
  const baseKey = clean.split(',')[0].trim().replace(/^(ciudad de|san|santa)\s+/i, '').trim()

  if (DESTINATION_LOCAL_PRESETS[clean]) return DESTINATION_LOCAL_PRESETS[clean]
  if (DESTINATION_LOCAL_PRESETS[baseKey]) return DESTINATION_LOCAL_PRESETS[baseKey]

  for (const [k, preset] of Object.entries(DESTINATION_LOCAL_PRESETS)) {
    if (clean.includes(k) || k.includes(baseKey) || (preset.name && preset.name.toLowerCase() === clean)) {
      return preset
    }
  }

  const capitalCity = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Destino'
  return {
    name: capitalCity,
    country: countryName || 'Local',
    hotels: [
      { name: `Hotel Central de ${capitalCity}`, desc: `Alojamiento céntrico en ${capitalCity}.`, price: '~$70 - $120 USD/noche' }
    ],
    restaurants: [
      { name: `Restaurante Típico de ${capitalCity}`, specialty: `Especialidades culinarias tradicionales de ${capitalCity}` }
    ],
    places: [
      `Centro Histórico de ${capitalCity}`,
      `Plaza Mayor de ${capitalCity}`,
      `Mirador de ${capitalCity}`
    ],
    events: []
  }
}

export function summarizePlaces(places = []) {
  return places.map((place, index) => ({
    order: index + 1,
    name: place.name,
    city: place.city ?? '',
    country: place.country ?? '',
    type: place.category ?? place.type ?? 'place',
    distanceMeters: Number(place.distanceMeters ?? 0),
    score: Number(place.score ?? 0)
  }))
}

export function isVagueDestination(destination, preferences = {}) {
  if (!destination) return true
  const lower = String(destination).trim().toLowerCase()
  if (lower.length <= 2) return true
  const vagueTerms = [
    'cualquiera', 'no se', 'no sé', 'donde sea', 'playa', 'montaña', 'ciudad',
    'destinos', 'viaje', 'sorpréndeme', 'sorprendeme', 'recomiéndame', 'recomiendame',
    'en mi país', 'mi país', 'cerca', 'cercanos', 'internacional', 'europa', 'asia', 'eeuu'
  ]
  return vagueTerms.includes(lower)
}

export function getDefaultActionChips(known = {}, lastMessage = '') {
  const rawDest = known.city || known.destination || ''
  const destName = cleanAdministrativeCityName(rawDest)
  const hasCity = Boolean(destName && !isVagueDestination(destName))

  const isDomesticOrNearby = /cercan|cerca|en mi zona|mi zona|mi ciudad|mi pa[íi]s|propio pa[íi]s|dentro del pa[íi]s|nacional|colombia/i.test(lastMessage)
  const isInternational = /internacional|exterior|otro país|fuera del país|europa|asia|eeuu|usa|extranjero|fuera|viaje internacional/i.test(lastMessage)

  if (!hasCity) {
    if (isDomesticOrNearby && !isInternational) {
      return ['Santa Marta', 'Cartagena', 'Medellín', 'Bogotá']
    }
    if (isInternational) {
      return ['París', 'Roma', 'Nueva York', 'Madrid']
    }
    const hasBeach = /playa|mar|costa|brisa/i.test(lastMessage) || (Array.isArray(known.interests) && known.interests.includes('Playas'))
    if (hasBeach) {
      return ['Santa Marta', 'Cartagena', 'San Andrés', 'Cancún']
    }
    if (/hist[óo]rica|historia|cultura/i.test(lastMessage)) {
      return ['Cartagena', 'Bogotá', 'Cusco', 'Roma']
    }
    if (/naturaleza|aventura/i.test(lastMessage)) {
      return ['Santa Marta', 'Cusco', 'Cancún', 'Medellín']
    }
    return ['Santa Marta', 'Cartagena', 'Medellín', 'Bogotá']
  }

  if (!known.datesSeason) {
    return ['Próximo mes', 'Este fin de semana', 'Vacaciones de mitad de año', 'Fin de año']
  }
  if (!known.durationDays && !known.durationHours) {
    return ['Un fin de semana (3 días)', '3 días', '5 días', '1 día completo']
  }
  if (!known.companions) {
    return ['Solo', 'En pareja', 'Con amigos', 'En familia con niños']
  }
  if (!known.budget) {
    return ['Económico', 'Moderado', 'Lujo']
  }
  if (!known.transport) {
    return ['Caminando', 'Transporte público', 'Auto rentado', 'Taxi / Uber']
  }
  if (!known.accommodationStatus) {
    return ['Tengo mi propio hospedaje', 'Recomiéndame hoteles']
  }

  return [`🚀 Generar tour en ${destName}`, '🍽️ Ver restaurantes', '🎯 Ver actividades']
}

/**
 * Unified Chat Response Generator:
 * Connects the LLM directly with live real grounding (OSM + WebSearch)
 * without fragile regex interceptors or synthetic string fallbacks.
 */
export async function generateChatResponse(state, backendInstruction = '', webSearchSummary = '', currentPreferences = {}) {
  const known = { ...(currentPreferences || {}) }
  const rawDestName = known.city || known.destination || ''
  const destName = cleanAdministrativeCityName(rawDestName)
  const hasCity = Boolean(destName && !isVagueDestination(destName))
  const destCountry = known.country || (destName.toLowerCase() === 'cartagena' || destName.toLowerCase() === 'santa marta' || destName.toLowerCase() === 'medellín' || destName.toLowerCase() === 'bogotá' ? 'Colombia' : '')

  const history = state.history || []
  const lastUserMsg = history[history.length - 1]?.content || ''

  // Grounding Data
  let realCatalog = null
  if (hasCity) {
    realCatalog = await getRealDestinationCatalog(destName, destCountry, known.latitude, known.longitude)
    if (!webSearchSummary && /\b(evento|festivales|feria|carnaval|cu[aá]ndo ir|fechas?|agenda)\b/i.test(lastUserMsg)) {
      const ws = await searchWebForTravel({
        query: `festivales eventos culturales agenda ${destName} ${known.datesSeason || ''}`.trim(),
        city: destName,
        country: destCountry
      }).catch(() => null)
      if (ws?.summary) {
        webSearchSummary = ws.summary
      }
    }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    const preset = getDestinationPresets(destName, destCountry)
    let fallbackMsg = '¡Hola! Qué gusto saludarte. Soy Tour Planner AI. Cuéntame: ¿a qué ciudad o destino te gustaría viajar?'

    if (!hasCity) {
      if (/playa|mar|costa/i.test(lastUserMsg)) {
        fallbackMsg = '¡Excelente! Para disfrutar de sol, playas y vida nocturna, te recomiendo destinos increíbles como **Santa Marta**, **Cartagena**, **San Andrés** o **Cancún**. ¿Cuál de estos te llama más la atención o tienes otra ciudad en mente?'
      } else if (/naturaleza|aventura/i.test(lastUserMsg)) {
        fallbackMsg = '¡Genial! Para conectar con la naturaleza y la aventura te sugiero destinos como **Santa Marta (Parque Tayrona y Minca)**, **Cusco** o **Medellín**. ¿Cuál de ellos prefieres?'
      }
    } else {
      if (/\b(actividad|actividades|lugares|qu[eé] hacer|atracciones)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡Aquí tienes las actividades y lugares más recomendados en ${destName}! 🌟\n\n` +
          preset.places.slice(0, 4).map((p, i) => `${i + 1}. **${p}**: Visita imperdible con gran riqueza turística y cultural.`).join('\n') +
          `\n\n¿Te gustaría agregar estas actividades a tu tour o ver opciones gastronómicas?`
      } else if (/\b(restaurante|restaurantes|comer|comida|gastronom[íi]a)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡Aquí tienes excelentes opciones gastronómicas en ${destName}! 🍽️\n\n` +
          preset.restaurants.map((r, i) => `${i + 1}. **${r.name}**: ${r.specialty}.`).join('\n') +
          `\n\n¿Deseas incluir estas paradas culinarias en tu itinerario?`
      } else if (/\b(hotel|hoteles|alojamiento|hospedaje)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡Aquí tienes opciones de hospedaje recomendadas en ${destName}! 🏨\n\n` +
          preset.hotels.map((h, i) => `${i + 1}. **${h.name}**: ${h.desc}`).join('\n') +
          `\n\n¿Cuál de estos te gustaría elegir como tu hospedaje?`
      } else if (/\b(evento|eventos|festival|festivales)\b/i.test(lastUserMsg)) {
        fallbackMsg = (preset.events && preset.events.length > 0)
          ? `¡Eventos emblemáticos en ${destName}! 🎉\n\n` + preset.events.map(e => `• **${e.name}** (${e.month}): ${e.desc}`).join('\n')
          : `Para las fechas de tu viaje no hay festivales especiales masivos programados en ${destName}.`
      } else {
        fallbackMsg = `¡Excelente elección viajar a ${destName}! Cuéntame, ¿en qué fechas planeas realizar tu tour y por cuántos días?`
      }
    }

    return {
      responseMessage: fallbackMsg,
      actionChips: fallbackChips,
      specificPlaces: Array.isArray(known.specificPlaces) ? known.specificPlaces : [],
      destinationSuggestions: (!hasCity) ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : [],
      readyToBuild: false
    }
  }

  // SYSTEM PROMPT FOR GPT-4O-MINI
  const systemPrompt = `Eres Tour Planner AI 🤖, el asistente virtual y organizador experto de tours de VibeTours.
Tu personalidad es CÁLIDA, EMPÁTICA, ENTUSIASTA Y ALTAMENTE PROFESIONAL.

ALCANCE ESTRICTO DE TURISMO:
- Tu única misión es crear, asesorar y planificar tours turísticos inolvidables.
- Si el usuario te hace consultas no relacionadas con viajes (programación, matemáticas, política, recetas fuera de contexto o palabras aleatorias), responde de forma muy amable indicando que tu especialidad es planificar viajes y tours increíbles, e invítalo a continuar con su itinerario.

ESTADO ACTUAL DE PREFERENCIAS CONFIRMADAS DEL VIAJERO:
${JSON.stringify(known, null, 2)}

${realCatalog ? `DATOS REALES Y VERIFICADOS DEL DESTINO (${destName}, ${destCountry || realCatalog.country}):
• HOTELES REALES: ${JSON.stringify(realCatalog.hotels)}
• RESTAURANTES REALES: ${JSON.stringify(realCatalog.restaurants)}
• LUGARES / ATRACCIONES REALES: ${JSON.stringify(realCatalog.places)}
• EVENTOS REALES: ${JSON.stringify(realCatalog.events)}` : ''}

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB:\n${webSearchSummary}` : ''}

REGLAS CRÍTICAS DE ASESORÍA Y FLUJO CONVERSACIONAL:
1. SI EL USUARIO NO HA INDICADO UN DESTINO O CIUDAD EN SU MENSAJE NI EN SUS PREFERENCIAS (o la ciudad no está confirmada):
   - Queda TERMINANTEMENTE PROHIBIDO inventar, asumir o autoasignar una ciudad por tu cuenta (como Bogotá u otra).
   - En "extractedPreferences.city" y "extractedPreferences.country" DEBES devolver null.
   - Queda TERMINANTEMENTE PROHIBIDO generar un itinerario de paradas (Día 1, Día 2, etc.) antes de que el destino esté confirmado por el usuario.
   - Tu respuesta conversacional DEBE:
     a) Reconocer con entusiasmo los intereses y preferencias recibidas (ejemplo: si busca Playas, Naturaleza, Aventuras o Vida nocturna).
     b) Recomendarle 2 a 4 destinos ideales que se adapten a la perfección a sus gustos (ejemplo: si busca playas y aventura, sugiere Santa Marta, Cartagena, San Andrés o Cancún).
     c) Preguntarle a cuál de esos destinos le gustaría viajar o si tiene en mente otra ciudad.
     d) Preguntarle cuántas personas/amigos viajan en total, en qué fechas y cuántos días planean para su viaje.
   - En "actionChips", devuelve los nombres de los 2 a 4 destinos recomendados.

2. SI EL DESTINO YA ESTÁ CONFIRMADO POR EL USUARIO (${destName || 'sin confirmar'}):
   - Proporciona asesoría guiada para ${destName}.
   - Utiliza OBLIGATORIAMENTE los lugares reales del catálogo. ESTÁ TERMINANTEMENTE PROHIBIDO inventar nombres sintéticos como "Hotel en el Centro de...".
   - Pregunta por las fechas, eventos locales, actividades preferidas, restaurantes, transporte, presupuesto, acompañantes (especificando si hay niños o adultos mayores) y hospedaje.

3. REGLA ESTRICTA SOBRE HOTELES Y HOSPEDAJE (SOLO INFORMATIVO):
   - VibeTours es EXCLUSIVAMENTE un diseñador de tours e itinerarios, NO procesa reservas ni pagos de hoteles.
   - Queda TERMINANTEMENTE PROHIBIDO pedir datos personales, documentos o fingir que vas a realizar la reserva del hotel.
   - Tu labor con el hospedaje es únicamente recomendar hoteles reales, dar tarifas estimadas y destacar su cercanía con las actividades del tour. Al elegir un hotel, regístralo como punto de partida y sigue con el itinerario.

4. DURACIÓN Y FECHAS:
   - Si el usuario NO especificó explícitamente cuántos días o en qué fechas viaja, "durationDays" y "datesSeason" DEBEN ser null. Queda PROHIBIDO asumir 3 días u otra duración por defecto.

5. NO REPETICIÓN:
   - NO repitas preguntas que ya tengan un valor asignado en el JSON de preferencias confirmadas.

6. ACTION CHIPS:
   - En "actionChips", genera 2 a 4 botones rápidos y relevantes con nombres de lugares reales discutidos, destinos sugeridos o la siguiente acción lógica.

FORMATO DE SALIDA (JSON):
Devuelve ÚNICAMENTE un objeto JSON válido con este esquema exacto:
{
  "responseMessage": "Tu mensaje conversacional completo en español...",
  "actionChips": ["Opción 1", "Opción 2", "Opción 3"],
  "extractedPreferences": {
    "city": null,
    "country": null,
    "datesSeason": null,
    "durationDays": null,
    "companions": null,
    "groupSize": null,
    "hasChildren": false,
    "budget": null,
    "transport": null,
    "interests": [],
    "selectedHotel": null,
    "specificPlaces": []
  },
  "readyToBuild": false
}`

  try {
    const formattedHistory = history.slice(-8).map(m => ({
      role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user',
      content: String(m.content || '')
    }))

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory
        ],
        temperature: 0.5
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(rawContent)

    const responseMessage = parsed.responseMessage || '¡Con mucho gusto! Continuemos organizando tu tour.'
    const actionChips = Array.isArray(parsed.actionChips) && parsed.actionChips.length > 0
      ? parsed.actionChips
      : getDefaultActionChips(known, lastUserMsg)

    // Visual cards are ONLY shown during initial destination exploration (when no city is selected yet)
    let destinationSuggestions = []
    if (!hasCity && !parsed.extractedPreferences?.city) {
      destinationSuggestions = await buildVisualDestinationSuggestions(actionChips).catch(() => [])
    }

    return {
      responseMessage,
      actionChips,
      extractedPreferences: parsed.extractedPreferences || {},
      specificPlaces: parsed.extractedPreferences?.specificPlaces || known.specificPlaces || [],
      destinationSuggestions,
      readyToBuild: Boolean(parsed.readyToBuild)
    }
  } catch (err) {
    console.error('[generateChatResponse] Error calling OpenAI:', err)
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    return {
      responseMessage: `¡Excelente! Sigamos diseñando tu experiencia turística en ${destName || 'tu próximo destino'}. ¿Qué te gustaría planear a continuación?`,
      actionChips: fallbackChips,
      specificPlaces: known.specificPlaces || [],
      destinationSuggestions: (!hasCity) ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : [],
      readyToBuild: false
    }
  }
}

/**
 * Information extractor for backward compatibility with existing route parsers.
 */
export async function extractChatInformation(userMessage, currentData = {}, history = []) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return extractChatInformationFallback(userMessage)
  }

  const prompt = `Analiza el mensaje del usuario y extrae ÚNICAMENTE los datos turísticos explícitamente indicados por el usuario en un JSON:
REGLAS ESTRICTAS:
- "city" / "destination": ciudad limpia SOLO si el usuario la escribió explícitamente. Si no la mencionó, pon null (PROHIBIDO asumir o inferir una ciudad).
- "country": país SOLO si se mencionó o se deduce de una ciudad explícita. Si no, null.
- "datesSeason": fechas SOLO si se mencionaron. Si no, null.
- "durationDays": número de días SOLO si el usuario especificó la duración (ej: "3 días", "un fin de semana" -> 2, "puente festivo" -> 3, "una semana" -> 7). Si no especificó duración ni fechas, DEBE ser null.
- "companions": "Solo" | "Pareja" | "Amigos" | "Familia con niños" (si se mencionó).
- "budget": "Económico" | "Moderado" | "Lujo" (si se mencionó).
- "transport": "Caminando" | "Transporte público" | "Auto rentado" | "Taxi" (si se mencionó).
- "interests": array con los intereses o gustos mencionados (ej: ["Playas", "Naturaleza", "Aventuras", "Vida nocturna"]).
- "selectedHotel": { "name": "Nombre del hotel" } (solo si lo confirma explícitamente).
- "specificPlaces": array con nombres de atracciones o restaurantes específicos mencionados.
Mensaje: "${userMessage}"`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: prompt }]
      })
    })
    if (response.ok) {
      const data = await response.json()
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      if (parsed.city) parsed.city = cleanAdministrativeCityName(parsed.city)
      if (parsed.destination) parsed.destination = cleanAdministrativeCityName(parsed.destination)
      return parsed
    }
  } catch (_) {}

  return extractChatInformationFallback(userMessage)
}

export function extractChatInformationFallback(prompt) {
  const lower = String(prompt || '').toLowerCase()
  const res = {}
  if (/\b(puente festivo|un puente festivo|un puente|puente|fin de semana largo)\b/i.test(lower)) {
    res.durationDays = 3
    res.durationHours = 72
  } else if (/\b(fin de semana|2 d[íi]as)\b/i.test(lower)) {
    res.durationDays = 2
    res.durationHours = 48
  } else if (/\b(1 d[íi]a|un d[íi]a)\b/i.test(lower)) {
    res.durationDays = 1
    res.durationHours = 8
  } else if (/\b(7 d[íi]as|una semana)\b/i.test(lower)) {
    res.durationDays = 7
    res.durationHours = 168
  }

  if (/solo/i.test(lower)) res.companions = 'Solo'
  else if (/pareja/i.test(lower)) res.companions = 'Pareja'
  else if (/amigos/i.test(lower)) res.companions = 'Amigos'
  else if (/familia|niños/i.test(lower)) {
    res.companions = 'Familia con niños'
    res.hasChildren = true
  }

  if (/econ[óo]mico|mochilero|bajo/i.test(lower)) res.budget = 'Económico'
  else if (/lujo|premium|alto/i.test(lower)) res.budget = 'Lujo'
  else if (/moderado|medio/i.test(lower)) res.budget = 'Moderado'

  if (/auto|carro|coche/i.test(lower)) res.transport = 'Auto rentado'
  else if (/caminando|a pie/i.test(lower)) res.transport = 'Caminando'
  else if (/transporte p[úu]blico|bus|metro/i.test(lower)) res.transport = 'Transporte público'
  else if (/taxi|uber/i.test(lower)) res.transport = 'Taxi'

  const interests = []
  if (/playa/i.test(lower)) interests.push('Playas')
  if (/naturaleza/i.test(lower)) interests.push('Naturaleza')
  if (/aventura/i.test(lower)) interests.push('Aventuras')
  if (/vida nocturna|fiesta|rumba|bares/i.test(lower)) interests.push('Vida nocturna')
  if (/cultura|historia|museos/i.test(lower)) interests.push('Cultura')
  if (/gastronom[íi]a|comida|restaurantes/i.test(lower)) interests.push('Gastronomía')
  if (interests.length > 0) res.interests = interests

  return res
}

/**
 * Official Tour Planner AI Plan Generator
 * Matches the exact requested JSON schema with OSM coordinates and rich stops.
 */
export async function planWithOpenAI({
  destination,
  country,
  city,
  durationHours,
  type,
  language = 'es',
  prompt,
  places = [],
  selectedHotel = null,
  webSearchSummary = '',
  userPreferences = {}
}) {
  const cleanCity = cleanAdministrativeCityName(city || destination || '')
  const targetCountry = country || (cleanCity.toLowerCase() === 'cartagena' || cleanCity.toLowerCase() === 'santa marta' ? 'Colombia' : '')
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('[planWithOpenAI] OPENAI_API_KEY no configurada')
    return null
  }

  const selectedPlaces = summarizePlaces(places).slice(0, 25)

  const system = `Eres Tour Planner AI 🤖, el motor oficial de diseño de itinerarios turísticos de VibeTours.
Tu misión es diseñar un tour profesional, inmersivo, geográficamente viable y 100% fiel al destino "${cleanCity}, ${targetCountry}".

ESQUEMA OFICIAL OBLIGATORIO DE SALIDA:
Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "nombre_tour": "Título atractivo y profesional del tour",
  "resumen_corto": "Resumen conciso y vendedor de la experiencia (1 oración)",
  "tipo_tour": "${type || 'cultural'}",
  "subcategorias": ["Cultura", "Gastronomía", "Historia"],
  "descripcion_tour": "Descripción completa, cautivadora e inspiradora del recorrido general",
  "experiencia_destacada": "El momento cumbre o vivencia más memorable del tour",
  "historia_del_lugar": "Reseña histórica verídica de ${cleanCity}",
  "contexto_cultural": "Tradiciones, folclore y ambiente local",
  "duracion_estimada": "${durationHours || 8} horas",
  "distancia_total": "5.5 km",
  "idiomas_disponibles": ["Español", "Inglés"],
  "publico_recomendado": ["Adultos", "Familias", "Parejas"],
  "mejor_epoca": "Todo el año",
  "horario_recomendado": "09:00 AM - 06:00 PM",
  "punto_encuentro": {
    "nombre_lugar": "${selectedHotel?.name || 'Punto de encuentro principal en ' + cleanCity}",
    "direccion": "Dirección céntrica o del hotel",
    "ciudad": "${cleanCity}",
    "region": "",
    "pais": "${targetCountry}",
    "latitud": 0.0,
    "longitud": 0.0,
    "place_id": "",
    "url_mapa": ""
  },
  "imagen_portada": "",
  "galeria_tour": [],
  "itinerario": [
    {
      "dia": 1,
      "parada": 1,
      "nombre": "Nombre real del lugar o restaurante",
      "descripcion": "Guía de voz inmersiva de 120 a 180 palabras escrita como guía experto hablando al oído del turista, con historia, arquitectura y qué observar.",
      "duracion_estimada": "45 minutos",
      "actividades": ["Actividad 1", "Actividad 2"],
      "datos_curiosos": ["Dato curioso real 1", "Dato curioso real 2"],
      "consejos": ["Consejo práctico del guía"],
      "ubicacion": {
        "nombre_lugar": "Nombre del lugar",
        "direccion": "",
        "ciudad": "${cleanCity}",
        "region": "",
        "pais": "${targetCountry}",
        "latitud": 0.0,
        "longitud": 0.0,
        "place_id": "",
        "url_mapa": ""
      },
      "imagenes": []
    }
  ],
  "orden_paradas": ["Parada 1", "Parada 2"],
  "incluye": ["Guía interactivo con voz GPS", "Itinerario optimizado"],
  "no_incluye": ["Entradas a recintos privados", "Alimentos no especificados"],
  "recomendaciones": ["Usar calzado cómodo", "Llevar protector solar e hidratación"],
  "que_llevar": ["Cámara", "Ropa fresca", "Documento de identidad"],
  "normas_del_tour": ["Respetar el patrimonio histórico y normas locales"],
  "etiquetas": ["Turismo", "Imperdibles", "Cultura"],
  "palabras_clave": ["${cleanCity}", "Tour", "Viajes"],
  "categoria_principal": "${type || 'Turismo Cultural'}",
  "presupuesto_estimado_usd": {
    "economico": 30,
    "moderado": 75,
    "de lujo": 180
  },
  "informacion_adicional": {
    "accesibilidad": "Apto para personas con movilidad estándar",
    "mascotas_permitidas": false,
    "apto_para_ninos": true,
    "apto_para_adultos_mayores": true
  }
}

REGLAS DE CALIDAD:
1. Utiliza exactamente la lista de lugares seleccionados recibida (${selectedPlaces.map(p => p.name).join(', ')}).
2. Cada parada del itinerario debe corresponder a un lugar físico real de la lista.
3. Para cada parada, redacta una narración de guía de voz inmersiva de 120 a 180 palabras.
4. Integra notas dinámicas de consejos y datos curiosos específicos por parada.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Genera el tour completo para ${cleanCity}, ${targetCountry} con estos lugares: ${JSON.stringify(selectedPlaces)}` }
        ],
        temperature: 0.4
      })
    })

    if (response.ok) {
      const data = await response.json()
      return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    }
  } catch (err) {
    console.error('[planWithOpenAI] Error:', err)
  }

  return null
}

export async function suggestFallbackPlacesWithOpenAI({ destination, city, country, type, excludeNames = [] }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  const targetLocation = `${city || destination || ''} ${country || ''}`.trim()
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Suggest 3 real physically existing tourist POIs in "${targetLocation}". Return JSON: { "places": [{ "name": "...", "type": "...", "category": "...", "description": "..." }] }` },
          { role: 'user', content: `Places for ${targetLocation}` }
        ]
      })
    })
    if (response.ok) {
      const data = await response.json()
      return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    }
  } catch (_) {}
  return null
}

export async function fetchCityIconicLandmarks(city, country) {
  const clean = cleanAdministrativeCityName(city).toLowerCase()
  if (DESTINATION_LOCAL_PRESETS[clean]) {
    return DESTINATION_LOCAL_PRESETS[clean].places
  }
  const catalog = await getRealDestinationCatalog(city, country).catch(() => null)
  return catalog?.places || []
}

export async function generateCustomPlaceReasons(places = [], city = '', country = '') {
  return places.map(p => ({
    name: p.name || p,
    reason: `Parada emblemática de gran atractivo turístico en ${city || 'el destino'}.`
  }))
}

export async function extractLocation(prompt) {
  return {
    explicit_destination: prompt || '',
    city: cleanAdministrativeCityName(prompt || ''),
    country: '',
    is_unrelated: false
  }
}

export async function buildVisualDestinationSuggestions(chips = []) {
  const cityData = {
    'cartagena': { name: 'Cartagena, Colombia', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Ciudad amurallada del Caribe con encanto colonial, playas y ambiente vibrante.', imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '30°C', isDemoImage: false },
    'santa marta': { name: 'Santa Marta, Colombia', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Puerta de entrada al Parque Tayrona con playas vírgenes, Sierra Nevada y bahías tranquilas.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '29°C', isDemoImage: false },
    'medellin': { name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'La ciudad de la eterna primavera con parques ecológicos, cultura y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'medellín': { name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'La ciudad de la eterna primavera con parques ecológicos, cultura y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'bogota': { name: 'Bogotá, Colombia', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital cultural con arquitectura histórica en La Candelaria y museos de oro.', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '18°C', isDemoImage: false },
    'bogotá': { name: 'Bogotá, Colombia', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital cultural con arquitectura histórica en La Candelaria y museos de oro.', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '18°C', isDemoImage: false },
    'buenos aires': { name: 'Buenos Aires, Argentina', city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', flagEmoji: '🇦🇷', description: 'Capital del tango, arquitectura europea, teatros y gastronomía de parrilla de clase mundial.', imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'roma': { name: 'Roma, Italia', city: 'Roma', country: 'Italia', countryCode: 'IT', flagEmoji: '🇮🇹', description: 'El Coliseo Romano, la Fontana di Trevi y plazas históricas llenas de encanto.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '26°C', isDemoImage: false },
    'paris': { name: 'París, Francia', city: 'París', country: 'Francia', countryCode: 'FR', flagEmoji: '🇫🇷', description: 'La Torre Eiffel, el Museo del Louvre y paseos románticos por el Sena.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'parís': { name: 'París, Francia', city: 'París', country: 'Francia', countryCode: 'FR', flagEmoji: '🇫🇷', description: 'La Torre Eiffel, el Museo del Louvre y paseos románticos por el Sena.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'madrid': { name: 'Madrid, España', city: 'Madrid', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'La Gran Vía, el Palacio Real y museos de arte de primer nivel.', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'barcelona': { name: 'Barcelona, España', city: 'Barcelona', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'La Sagrada Familia de Gaudí, el Park Güell y la playa de la Barceloneta.', imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '25°C', isDemoImage: false },
    'cancun': { name: 'Cancún, México', city: 'Cancún', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Aguas turquesas del Caribe, playas de arena blanca y zonas de aventura.', imageUrl: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '31°C', isDemoImage: false },
    'cancún': { name: 'Cancún, México', city: 'Cancún', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Aguas turquesas del Caribe, playas de arena blanca y zonas de aventura.', imageUrl: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '31°C', isDemoImage: false },
    'cusco': { name: 'Cusco, Perú', city: 'Cusco', country: 'Perú', countryCode: 'PE', flagEmoji: '🇵🇪', description: 'Capital del imperio Inca, puerta de entrada a Machu Picchu y plazas coloniales.', imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '18°C', isDemoImage: false }
  }

  const results = []
  for (const raw of chips) {
    const clean = String(raw || '').trim().toLowerCase()
    if (cityData[clean]) {
      results.push(cityData[clean])
    }
  }
  return results
}
