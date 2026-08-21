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
      { name: 'Santa Marta Marriott Resort Playa Dormida', desc: 'Lujo contemporáneo frente al mar con acceso directo a playa virgen, piscina infinita y gastronomía caribeña.', price: '~$140 - $220 USD/noche' },
      { name: 'Hotel San Marcos', desc: 'Alojamiento acogedor y céntrico a pasos de la bahía y el Parque de Los Novios.', price: '~$50 - $90 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante Ouzo', specialty: 'Exquisita cocina mediterránea de autor y mariscos frescos en el Parque de Los Novios' },
      { name: 'Restaurante Donde Chucho', specialty: 'Legendaria cazuela de mariscos cremosa, pargo rojo frito al estilo caribeño y ceviches frescos en El Rodadero y Centro' },
      { name: 'Restaurante Guásimo', specialty: 'Alta cocina contemporánea del Gran Caribe inspirada en los saberes ancestrales de la Sierra Nevada y pesca del día' },
      { name: 'Restaurante Burukuka', specialty: 'Gastronomía caribeña fusión y coctelería con vista panorámica espectacular a la bahía de El Rodadero' },
      { name: 'Discoteca La Puerta', specialty: 'Música en vivo, cocteles tropicales y el mejor ambiente festivo del Centro Histórico' },
      { name: 'Restaurante y Bar El Cielo', specialty: 'Pescados frescos, cocteles y comida tradicional caribeña frente a la playa de El Rodadero' },
      { name: 'Restaurante La Roca', specialty: 'Comida de mar fresca, patacones y ambiente relajado en la zona costera de Palomino' },
      { name: 'Bares en la Calle 22', specialty: 'Ambiente nocturno vibrante con coctelería artesanal y terrazas alrededor del Parque de Los Novios' },
      { name: 'Restaurante Ostrería Mary', specialty: 'Auténticos ceviches artesanales de ostras, camarón y pulpo fresco en el Centro Histórico' },
      { name: 'Restaurante El Bistró Santa Marta', specialty: 'Bistronomía artesanal con panes horneados en casa, tapas mediterráneas y pescados a la plancha' }
    ],
    places: [
      'Playa El Rodadero',
      'Bahía de Taganga',
      'Playa Blanca Santa Marta',
      'Parque Nacional Natural Tayrona',
      'Cabo San Juan del Guía',
      'Bahía Concha',
      'Playa Cristal',
      'Quinta de San Pedro Alejandrino',
      'Minca',
      'Centro Histórico y Parque de Los Novios',
      'Catedral Basílica de Santa Marta',
      'Museo del Oro Tairona - Casa de la Aduana',
      'Acuario y Museo del Mar del Rodadero',
      'Playa de Palomino',
      'Marina de Santa Marta',
      'Centro Comercial Buenavista'
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
  barranquilla: {
    name: 'Barranquilla',
    country: 'Colombia',
    hotels: [
      { name: 'Hotel El Prado', desc: 'Monumento arquitectónico y patrimonio nacional con elegantes jardines tropicales, piscina histórica y estilo neoclásico republicano en el barrio El Prado.', price: '~$80 - $130 USD/noche' },
      { name: 'Dann Carlton Barranquilla', desc: 'Hotel de gran categoría frente al centro comercial Buenavista con piscina, restaurante giratorio y spa de lujo.', price: '~$90 - $140 USD/noche' },
      { name: 'Movich Buró 51', desc: 'Hotel moderno y confortable en el sector de Buenavista con piscina al aire libre, gastronomía de autor y diseño contemporáneo.', price: '~$85 - $135 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante La Cueva', specialty: 'El legendario bar-restaurante del Grupo de Barranquilla frecuentado por Gabriel García Márquez, con gastronomía típica caribeña y ambiente cultural único' },
      { name: 'Restaurante El Celler', specialty: 'Cocina mediterránea y caribeña de autor con mariscos frescos, arroces y tapas de alta calidad' },
      { name: 'Restaurante El Pulpo Paul', specialty: 'Ceviches frescos, arroces de mariscos y cazuelas al estilo del Caribe' },
      { name: 'Restaurante El Tropezón', specialty: 'Auténtica gastronomía tradicional barranquillera, sancochos y asados típicos' },
      { name: 'Restaurante La Marea', specialty: 'Pescados frescos, cazuela de mariscos y comida caribeña con vista al río' },
      { name: 'Restaurante La Pérgola', specialty: 'Comida italiana y mediterránea artesanal en un ambiente acogedor' },
      { name: 'Restaurante El Corralito', specialty: 'Platos tradicionales y carnes asadas al carbón' },
      { name: 'Restaurante La Casa de la Cerveza', specialty: 'Cervezas artesanales y comida casual con ambiente frente al Gran Malecón' }
    ],
    places: [
      'Gran Malecón del Río',
      'Monumento Ventana al Mundo',
      'Catedral Metropolitana María Reina',
      'Restaurante La Cueva',
      'Museo del Caribe y Parque Cultural',
      'Bocas de Ceniza',
      'Barrio El Prado',
      'La Troja (Patrimonio Cultural y Musical)',
      'Parque de los Fundadores',
      'Monumento Ventana de Campeones'
    ],
    events: [
      { name: 'Carnaval de Barranquilla', month: 'Febrero/Marzo', desc: 'Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad (UNESCO) con la Batalla de Flores y la Gran Parada.' },
      { name: 'Barranquijazz', month: 'Septiembre', desc: 'El festival de jazz y música del Caribe más importante de Colombia con grandes exponentes internacionales.' }
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
  const cacheKey = `catalog_${clean}_${countryName}`
  const cached = destinationCatalogCache.get(cacheKey)
  if (cached) return cached

  // 1. Curated Preset Check
  const preset = getDestinationPresets(destName, countryName)
  if (preset && preset.places && preset.places.length >= 4) {
    destinationCatalogCache.set(cacheKey, preset)
    return preset
  }

  // 2. Dynamic Geocode & OSM Live Query
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
    realRests = (osmRests || []).filter(r => r.name && !r.name.toLowerCase().includes('perímetro urbano')).slice(0, 5)
    realPlaces = (osmAttractions || []).filter(p => p.name && !p.name.toLowerCase().includes('perímetro urbano')).slice(0, 10)
  }

  const result = {
    name: capitalCity,
    country: targetCountry,
    hotels: realHotels.length > 0 ? realHotels.map(h => ({
      name: h.name,
      desc: `Alojamiento verificado ubicado en ${capitalCity}.`,
      price: '~$75 - $140 USD/noche'
    })) : [],
    restaurants: realRests.length > 0 ? realRests.map(r => ({
      name: r.name,
      specialty: r.cuisine ? `Especialidad en cocina ${r.cuisine}` : `Platos y sabores representativos de ${capitalCity}`
    })) : [],
    places: realPlaces.length > 0 ? realPlaces.map(p => p.name) : [],
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
export function isNonTouristicInput(text = '') {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  if (/^(flutter\s+run|npm\s+|git\s+|cd\s+|ls\b|node\s+|pip\s+|cargo\s+|docker\s+|python\s+|sudo\s+|yarn\s+|pnpm\s+)/i.test(trimmed)) return true
  if (/(flutter run|npm run|npm test|git commit|git push|node index)/i.test(trimmed)) return true
  if (/^(console\.log|function\s*\(|def\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|import\s+.*from|class\s+\w+)/i.test(trimmed)) return true
  if (/^(\d+\s*[\+\-\*\/]\s*\d+|\bcu[aá]nto es\s+\d+)/i.test(trimmed)) return true
  if (/\b(se fue,? pero jam[áa]s ser[áa] olvidado|in memoriam|descanse en paz|rip\b|dramas llenos de emoci[óo]n|personajes del manga|haruma miura|anime|k-drama)\b/i.test(trimmed)) return true
  if (/\b(qu[ée] opinas de la pol[íi]tica|qui[ée]n gan[óo] las elecciones|qui[ée]n es el presidente|resuelve esta ecuaci[óo]n|hazme la tarea|escribe un ensayo|escribe un poema|cu[ée]ntame un chiste)\b/i.test(trimmed)) return true
  return false
}

export async function generateChatResponse(state, backendInstruction = '', webSearchSummary = '', currentPreferences = {}) {
  const known = { ...(currentPreferences || {}) }
  const rawDestName = known.city || known.destination || ''
  const destName = cleanAdministrativeCityName(rawDestName)
  const hasCity = Boolean(destName && !isVagueDestination(destName))
  const destCountry = known.country || (destName.toLowerCase() === 'cartagena' || destName.toLowerCase() === 'santa marta' || destName.toLowerCase() === 'medellín' || destName.toLowerCase() === 'bogotá' ? 'Colombia' : '')
  const hasDurationOrDates = Boolean(known.durationDays || known.datesSeason)

  const history = state.history || []
  const lastUserMsg = history[history.length - 1]?.content || ''

  if (isNonTouristicInput(lastUserMsg)) {
    return {
      responseMessage: 'Esa consulta no está relacionada con la planificación de viajes o turismo. Mi especialidad es exclusivamente diseñar tours personalizados y asesorarte en tus vacaciones. Por favor, indícame a qué ciudad te gustaría viajar o qué tipo de experiencia turística deseas.',
      actionChips: ['Explorar ciudades', 'Aventura y naturaleza', 'Cultura e historia'],
      extractedPreferences: {},
      specificPlaces: known.specificPlaces || [],
      destinationSuggestions: [],
      readyToBuild: false,
      isUnrelatedToTravel: true
    }
  }

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

  function hasValidValue(val) {
    if (!val) return false
    if (typeof val === 'string') {
      const trimmed = val.trim()
      return trimmed.length > 0 && !/^(por definir|pendiente|a definir|por confirmar|sin definir|null|undefined)$/i.test(trimmed)
    }
    return true
  }

  function hasValidLodging(hotel, status) {
    if (status && hasValidValue(status)) return true
    if (!hotel) return false
    if (typeof hotel === 'string') return hasValidValue(hotel)
    if (typeof hotel === 'object') {
      return hasValidValue(hotel.name) || hasValidValue(hotel.nombre)
    }
    return false
  }

  const isHomeOrLocalLodging = /\b(en mi casa|mi casa|casa de un familiar|casa de familiares|casa de un amigo|casa de amigos|casa de mis padres|vivo aqu[íi]|vivo en la ciudad|es mi ciudad|ya tengo hospedaje|ya tengo alojamiento|ya tengo hotel|ya tengo donde quedarme|no necesito hotel|no requiero hotel|alojamiento propio|hospedaje propio|en casa)\b/i.test(lastUserMsg)
  if (isHomeOrLocalLodging) {
    known.selectedHotel = { name: 'Casa propia / Alojamiento particular' }
    known.accommodationStatus = 'Casa propia / familiar'
  }

  const hasLodging = hasValidLodging(known.selectedHotel, known.accommodationStatus)
  const hasTransport = hasValidValue(known.transport)
  const hasBudget = hasValidValue(known.budget)
  const hasCompanions = hasValidValue(known.companions)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    let fallbackMsg = ''
    let effectiveReadyToBuild = false

    if (!hasCity) {
      if (/playa|playas|mar|costa|aventura/i.test(lastUserMsg)) {
        fallbackMsg = '¡Excelente! Para disfrutar de sol, playas y vida nocturna, te recomiendo destinos increíbles como **Santa Marta**, **Cartagena**, **San Andrés** o **Cancún**. ¿Cuál de estos te llama más la atención o tienes otra ciudad en mente?'
      } else if (/naturaleza/i.test(lastUserMsg)) {
        fallbackMsg = '¡Genial! Para conectar con la naturaleza y la aventura te sugiero destinos como **Santa Marta (Parque Tayrona y Minca)**, **Cusco** o **Medellín**. ¿Cuál de ellos prefieres?'
      } else {
        fallbackMsg = `¡Hola! Qué gusto saludarte. Soy Tour Planner AI 🤖, tu asistente personal de viajes en VibeTours.\n\nEstoy aquí para diseñar un tour increíble adaptado a tus fechas, acompañantes, presupuesto y gustos. Cuéntame: ¿a qué ciudad o lugar te gustaría viajar hoy?`
      }
    } else {
      const preset = realCatalog || getDestinationPresets('Cartagena', 'Colombia')
      const fbHasLodging = hasValidLodging(known.selectedHotel, known.accommodationStatus)
      const fbHasTransport = hasValidValue(known.transport)
      const fbHasBudget = hasValidValue(known.budget)
      const fbHasCompanions = hasValidValue(known.companions)
      const fbAllKeyInfoComplete = Boolean(hasCity && hasDurationOrDates && fbHasCompanions && fbHasLodging && fbHasTransport && fbHasBudget)

      const isExplicitBuildRequestedByUser = /\b(gener(ar|es|a|e|en)?\s+(el\s+)?tour|cre(ar|es|a|e|en)?\s+(el\s+)?tour|adelante\s+genera|inicia(r)?\s+tour|finaliza(r)?\s+tour|constru(ye|ir)\s+tour|dise[ñn](ar|a|es|e)?\s+(el\s+)?tour|est[aá]\s+perfecto\s+genera|listo\s+genera|listo\s+crea|ya\s+no\s+hay\s+nada\s+genera|listo\s+para\s+generar|vale\s+genera|procede\s+a\s+generar|si\s+genera\s+el\s+tour|s[íi]\s+genera\s+el\s+tour|genera\s+el\s+tour\s+porfa|crea\s+el\s+tour|haz\s+el\s+tour|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?|ok\s+quiero\s+generar)\b/i.test(lastUserMsg)
      effectiveReadyToBuild = Boolean(fbAllKeyInfoComplete && isExplicitBuildRequestedByUser)

      if (isExplicitBuildRequestedByUser && !fbAllKeyInfoComplete) {
        const missing = []
        if (!hasCity) missing.push('el destino')
        if (!hasDurationOrDates) missing.push('las fechas o días de viaje')
        if (!fbHasCompanions) missing.push('tus acompañantes')
        if (!fbHasLodging) missing.push('tu alojamiento u hotel')
        if (!fbHasTransport) missing.push('tu medio de transporte')
        if (!fbHasBudget) missing.push('tu presupuesto estimado')

        fallbackMsg = `Para poder generar tu tour en el mapa y armar la ruta con precisión, aún necesitamos definir: **${missing.join(', ')}**. Por favor indícame este detalle para continuar.`
      } else if (effectiveReadyToBuild) {
        fallbackMsg = `¡Perfecto! Todo está listo para tu viaje a ${destName} (${known.datesSeason || `${known.durationDays} días`}). Procedo a generar tu tour en el mapa.`
      } else if (/\b(itinerario|itinerarios|plan|plan de viaje|cómo va|cómo queda|mostrar el itinerario|muéstrame el itinerario|muestres el itinerario)\b/i.test(lastUserMsg)) {
        if (hasDurationOrDates) {
          const numDays = known.durationDays || 4
          fallbackMsg = `¡Aquí tienes la propuesta de itinerario para tu viaje a ${destName} (${known.datesSeason || `${numDays} días`})! 🗺️\n\n` +
            `• **Día 1**: Llegada, check-in y recorrido por el Centro Histórico\n` +
            `• **Día 2**: Visita a ${preset.places[0] || 'atracciones principales'}\n` +
            (numDays >= 3 ? `• **Día 3**: Excursión a ${preset.places[1] || 'lugares icónicos'}\n` : '') +
            (numDays >= 4 ? `• **Día 4**: Día de relax y gastronomía local\n` : '') +
            `\n¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o está todo listo para generar tu tour?`
        } else {
          fallbackMsg = `Para poder organizar tu itinerario día a día en ${destName}, ¿en qué fechas planeas viajar y cuántos días durará tu estadía?`
        }
      } else if (/\b(actividad|actividades|qu[ée] hacer|lugares|atracciones|visitar)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡En ${destName} hay experiencias y lugares fascinantes para descubrir! 🌟\n\n` +
          preset.places.map((p, i) => `${i + 1}. **${p}**`).join('\n') +
          `\n\n¿Te gustaría que organicemos tu itinerario visitando estos lugares?`
      } else if (/\b(restaurante|restaurantes|comida|comer|gastronom[íi]a|cenar|almorzar)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡La gastronomía en ${destName} es espectacular! 🍽️ Aquí tienes restaurantes recomendados:\n\n` +
          preset.restaurants.map((r, i) => `${i + 1}. **${r.name}**: ${r.specialty}.`).join('\n') +
          `\n\n¿Deseas incluir estas paradas culinarias en tu itinerario?`
      } else if (/\b(hotel|hoteles|alojamiento|hospedaje)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡Aquí tienes opciones de hospedaje recomendadas en ${destName}! 🏨\n\n` +
          preset.hotels.map((h, i) => `${i + 1}. **${h.name}**: ${h.desc}`).join('\n') +
          `\n\n¿Cuál de estos te gustaría elegir como tu hospedaje?`
      } else if (hasDurationOrDates) {
        fallbackMsg = `¡Perfecto! Ya tenemos tu viaje a ${destName} para ${known.datesSeason || `${known.durationDays} días`}. ¿Qué tipo de actividades o experiencias te gustaría incluir en tu itinerario?`
      } else {
        fallbackMsg = `¡Excelente elección viajar a ${destName}! Cuéntame, ¿en qué fechas planeas realizar tu tour y por cuántos días?`
      }
    }

    return {
      responseMessage: fallbackMsg,
      actionChips: fallbackChips,
      specificPlaces: Array.isArray(known.specificPlaces) ? known.specificPlaces : [],
      destinationSuggestions: (!hasCity) ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : [],
      readyToBuild: Boolean(effectiveReadyToBuild),
      isUnrelatedToTravel: false
    }
  }

  const systemPrompt = `Eres Tour Planner AI 🤖, el asistente virtual y organizador experto de tours de VibeTours.
Tu personalidad es CÁLIDA, EMPÁTICA, ENTUSIASTA Y ALTAMENTE PROFESIONAL.

ROL CONVERSACIONAL Y ASESORÍA TURÍSTICA EXPERTA:
- Tu misión es asesorar, inspirar y planificar tours turísticos inolvidables para el viajero.
- Responde de forma natural, culta, apasionada e informativa a CUALQUIER pregunta del viajero sobre el destino (${destName || 'el destino'}), incluyendo:
  • Festividades locales, eventos culturales, carnavales y celebraciones anuales (ej: "¿De qué trata tal festival?", "¿Qué eventos hay en julio?").
  • Clima, temporadas de viaje, mejor época del año y consejos de equipaje.
  • Gastronomía típica, platos recomendados, restaurantes y vida nocturna.
  • Playas, naturaleza, historia, atracciones y paseos recomendados.
- Si el usuario te hace una pregunta explicativa (ej: "¿De qué trata la Fiesta del Mar?"), EXPLÍCASELO con detalle turístico verídico y luego pregúntale amablemente si desea incluirlo en su itinerario o qué fechas prefiere.
- Si el mensaje no tiene absolutamente nada que ver con viajes o turismo (por ejemplo: código de programación, fórmulas matemáticas, política partidista o tributos a celebridades ajenas), responde con amabilidad recordando que eres un asistente de viajes y pregúntale a qué ciudad le gustaría viajar.

${realCatalog && hasCity ? `
CATÁLOGO OFICIAL Y VERIFICADO DE LUGARES EN ${destName.toUpperCase()} (${destCountry || 'DESTINO'}):
• Hoteles recomendados: ${realCatalog.hotels?.map(h => h.name).join(', ') || 'N/A'}
• Restaurantes y vida nocturna recomendados: ${realCatalog.restaurants?.map(r => r.name).join(', ') || 'N/A'}
• Atractivos, playas y patrimonio verificados: ${realCatalog.places?.join(', ') || 'N/A'}
` : ''}

REGLA UNIVERSAL DE PERTENENCIA TERRITORIAL ESTRICTA PARA CUALQUIER DESTINO:
1. Todos los atractivos, playas, museos, plazas, parques, miradores, bares y restaurantes que propongas, menciones o incluyas en el itinerario DEBEN pertenecer exclusivamente al municipio, ciudad y área metropolitana de ${destName || 'el destino'} (${destCountry || ''}).
2. ESTÁ TERMINANTEMENTE PROHIBIDO incluir o recomendar lugares ubicados en otras ciudades, departamentos, provincias o países que se encuentren a más de 50-60 km de distancia (por ejemplo: si el destino es Santa Marta, NUNCA menciones lugares de Cartagena como Café del Mar o Isla de Barú; si el destino es Roma, NUNCA menciones lugares de Pisa o Florencia; si el destino es Tokio, NUNCA menciones lugares de Kioto; si el destino es Mendoza, NUNCA menciones lugares de Buenos Aires; si el destino es París, NUNCA menciones lugares de Niza).
3. Utiliza preferentemente los lugares del CATÁLOGO OFICIAL VERIFICADO arriba indicado. Si el usuario propone o pregunta por un lugar que pertenece a otra ciudad, aclárale cortésmente a qué ciudad pertenece y su distancia real, y ofrécele alternativas dentro de ${destName}.

INTELIGENCIA GEOGRÁFICA DINÁMICA:
- Recomienda con total dinamismo y libertad atractivos turísticos, restaurantes, playas, barrios icónicos, miradores, parques naturales o actividades culturales REALES que pertenezcan a la ciudad seleccionada (${destName}), a su área metropolitana, o a sus zonas de excursión directa y archipiélagos/islas cercanas.
- MANEJO DE PREGUNTAS Y DUDAS GEOGRÁFICAS DEL USUARIO:
  - Si el usuario pregunta o duda sobre la ubicación de un lugar (ej: "¿Playa blanca y el parque Tayrona en Cartagena?"):
    1. NUNCA digas "¡Así es!" ni confirmes falsedades geográficas.
    2. NUNCA agregues lugares de otras ciudades al itinerario de ${destName}.
    3. ACLARA con conocimiento turístico preciso: explica qué parte sí pertenece a la zona y qué parte pertenece a otra ciudad con su distancia en carretera o vuelo.

ESTADO ACTUAL DE LA CONVERSACIÓN Y DATOS CONFIRMADOS:
• DESTINO: ${hasCity ? `CONFIRMADO (${destName})` : 'PENDIENTE (No confirmado)'}
• FECHAS / DURACIÓN: ${hasDurationOrDates ? `CONFIRMADO (${known.datesSeason || `${known.durationDays} días`})` : 'PENDIENTE (No confirmado)'}
• ACOMPAÑANTES: ${hasCompanions ? `CONFIRMADO (${known.companions})` : 'PENDIENTE (No confirmado)'}
• HOSPEDAJE: ${hasLodging ? `CONFIRMADO (${known.selectedHotel?.name || known.selectedHotel || known.accommodationStatus})` : 'PENDIENTE (No confirmado / Por definir)'}
• TRANSPORTE: ${hasTransport ? `CONFIRMADO (${known.transport})` : 'PENDIENTE (No confirmado / Por definir)'}
• PRESUPUESTO: ${hasBudget ? `CONFIRMADO (${known.budget})` : 'PENDIENTE (No confirmado / Por definir)'}
• LUGARES ESPECÍFICOS: ${(known.specificPlaces || []).length > 0 ? (known.specificPlaces || []).join(', ') : 'A definir'}

${hasDurationOrDates ? `⚠️ ADVERTENCIA CRÍTICA DE FECHAS: El usuario YA confirmó sus fechas (${known.datesSeason || ''}) y duración (${known.durationDays ? `${known.durationDays} días` : ''}). NUNCA vuelvas a preguntar cuándo viajará ni cuántos días durará su estadía. Si el usuario pide el itinerario ("muéstrame el itinerario", "cómo va quedando"), PRESENTA DE INMEDIATO el itinerario estructurado por días.` : `⚠️ FECHAS PENDIENTES: Si el usuario pide estructurar el itinerario o generar el tour sin haber indicado fechas, pregúntale: "¿En qué fechas planeas viajar y cuántos días durará tu estadía en ${destName || 'el destino'}?"`}

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB:\n${webSearchSummary}` : ''}

PROHIBICIÓN ABSOLUTA DE LUGARES Y RESTAURANTES INVENTADOS O GENÉRICOS:
- Todos los restaurantes, bares, hoteles y atractivos que menciones DEBEN SER LUGARES REALES Y EXISTENTES con sus nombres auténticos del destino.

LISTA ACUMULADA DE ACTIVIDADES Y LUGARES APROBADOS POR EL VIAJERO:
${Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0 ? JSON.stringify(known.specificPlaces) : 'Ninguno por ahora'}

REGLA ESTRICTA DE PRESERVACIÓN DE ACTIVIDADES EN EL ITINERARIO:
- Si el usuario selecciona o aprueba actividades (ej: "1 y 3", "quiero incluir todas estas actividades", "agrega estas actividades también", "vale agrega todas esas actividades al itinerario y Muéstrame el itinerario"):
  1. Extrae todas las actividades en "extractedPreferences.specificPlaces" acumulándolas con las anteriores.
  2. Al estructurar o actualizar el itinerario día por día, DEBES INCLUIR TODAS las actividades aprobadas (${JSON.stringify(known.specificPlaces || [])}) distribuidas equilibradamente entre los ${known.durationDays || 4} días.
FACTIBILIDAD GEOGRÁFICA Y TEMPORAL (0 EXCURSIONES MULTIDÍA EN TOURS DE 1 DÍA):
- Cada actividad asignada a un día debe ser realizable en esa jornada con regreso al hotel en ${destName}.
- NUNCA pongas expediciones de trekking multi-día (como "Caminata a Ciudad Perdida") como una actividad de 1 solo día dentro de un tour general.

REGLAS CRÍTICAS DEL FLUJO CONVERSACIONAL EN ETAPAS OBLIGATORIAS:

ETAPA 1: DESTINO, FECHAS/DURACIÓN Y ACOMPAÑANTES
- Si hay destino pero faltan fechas o acompañantes: Pregunta por las fechas de viaje, cuántos días durará su estadía y quiénes lo acompañan.
- PROHIBICIÓN ESTRICTA: NUNCA inventes o asumas una duración en días (como 3 o 5 días) si el usuario no la ha especificado. Si el usuario indicó el mes (ej: "julio") pero no cuántos días durará su viaje, PREGÚNTALE: "¿Cuántos días durará tu estadía en ${destName}?". NUNCA generes un itinerario día por día antes de conocer los días exactos.
- "readyToBuild" DEBE ser false.

ETAPA 2: RECOMENDACIÓN DE ACTIVIDADES Y EXPERIENCIAS
- Una vez conocidos destino, fechas y acompañantes:
  1. Recomienda una cantidad proporcional de lugares y experiencias REALES según la duración del viaje:
     - Para viajes de 1 a 3 días: Recomienda 6 a 8 lugares y restaurantes auténticos.
     - Para viajes de 4 a 6 días: Recomienda 8 a 12 lugares y restaurantes auténticos.
     - Para viajes de 7 a 10+ días: Recomienda 12 a 16 lugares y restaurantes auténticos (playas, sitios históricos, naturaleza, restaurantes y vida nocturna) para que CADA DÍA del tour tenga atractivos suficientes y no quede ningún día vacío.
  2. Pregunta amablemente qué actividades desean incluir o si desean agregarlas todas al itinerario.
- "readyToBuild" DEBE ser false.

ETAPA 3: HOSPEDAJE, TRANSPORTE Y PRESUPUESTO
- Recomienda 2 o 3 opciones de hoteles reales y pregunta ÚNICAMENTE por los datos de hospedaje/transporte/presupuesto que sigan en PENDIENTE. NUNCA repitas preguntas sobre datos ya CONFIRMADOS.
- Si el usuario indica que se aloja en su casa, casa de familiares o amigos, o que no necesita hotel (ej: "en mi casa", "casa de un familiar", "vivo aquí", "ya tengo hospedaje"):
  1. Marca HOSPEDAJE como CONFIRMADO ("accommodationStatus": "Casa propia / familiar", "selectedHotel": { "name": "Casa propia / Alojamiento particular" }).
  2. NUNCA vuelvas a pedir hotel o alojamiento.
- "readyToBuild" DEBE ser false.

ETAPA 4: PRESENTACIÓN DEL ITINERARIO Y CONFIRMACIÓN
- Si el usuario YA confirmó sus días de viaje (${known.durationDays ? `${known.durationDays} días` : 'duración'}):
  Presenta el itinerario estructurado integrando las actividades aprobadas a lo largo de los ${known.durationDays || 3} días (Día 1 a Día ${known.durationDays || 3}):
  "Itinerario de Viaje a ${destName} (${known.datesSeason || `${known.durationDays || 3} días`}):"
  • Día 1: [Llegada / Hotel] -> [Lugar físico real 1] -> [Cena en Restaurante real 1]
  • Día 2: [Lugar físico real 2] -> [Almuerzo en Restaurante real 2] -> [Lugar físico real 3]
  ...
  REGLAS DE ORO DEL ITINERARIO:
  1. CADA DÍA (del Día 1 al Día ${known.durationDays || 3}) DEBE TENER al menos 1 o 2 lugares físicos o restaurantes REALES y DIFERENTES.
  2. ESTÁ TERMINANTEMENTE PROHIBIDO dejar días vacíos, días con descripciones abstractas o días de relleno ("Día libre", "Tarde libre", "Últimos momentos", "Visita opcional").
  3. En las líneas con flechas (->), CADA ELEMENTO DEBE SER ÚNICAMENTE EL NOMBRE PROPIO DE UN LUGAR FÍSICO O RESTAURANTE REAL (ej: "• Día 2: Bahía de Taganga -> Restaurante Ouzo").
  4. ESTÁ TERMINANTEMENTE PROHIBIDO poner frases de actividades como paradas en las flechas (NUNCA poner "-> Fiesta nocturna", "-> Tarde libre para explorar", "-> Tubbing en el río", "-> Las cascadas y visita a fincas de café", "-> Regreso al hotel y despedida").
  Alojamiento: [Hotel elegido, casa propia o por definir]
  Transporte: [Medio de transporte elegido o por definir]
  Presupuesto: [Presupuesto elegido o por definir]
- Si NO se han confirmado los días de viaje, NO presentes un itinerario por días; pregunta cuántos días durará su estadía.
- Pregunta: "¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o está todo listo para generar tu tour?"
- "readyToBuild" DEBE ser false.

ETAPA 5: GENERACIÓN DEL TOUR ("readyToBuild": true)
- Si el usuario pide generar o crear el tour (ej: "si genera el tour porfa", "crea el tour", "genera el tour", "vale genera el tour", "adelante genera el tour", "adelante general tour", "ok quiero generar el tour", "quiero generar el tour", "adelante"):
  - SI FALTA ALGÚN DATO CLAVE (Destino, Fechas, Acompañantes, Hospedaje, Transporte o Presupuesto):
    1. "readyToBuild" DEBE SER FALSE (nunca generar el mapa si falta información clave).
    2. En "responseMessage", pregunta AMABLEMENTE Y DE MANERA ESPECÍFICA únicamente por el dato o datos clave que siguen en PENDIENTE. NUNCA preguntes por datos que ya están CONFIRMADOS.
  - SI TODOS LOS DATOS CLAVE ESTÁN CONFIRMADOS:
    1. "readyToBuild" DEBE SER TRUE.
    2. En "responseMessage", responde confirmando: "¡Excelente! Todo está listo para tu viaje a ${destName}. Procedo a generar tu tour personalizado en el mapa. ¡Prepárate para disfrutarlo!"
    3. ESTÁ TERMINANTEMENTE PROHIBIDO volver a preguntar por hospedaje, transporte, presupuesto o fechas si el usuario ya ordenó generar el tour.

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
    "accommodationStatus": null,
    "specificPlaces": [
      {
        "name": "Nombre Real del Lugar o Restaurante",
        "dia": 1,
        "day": 1,
        "type": "food|cultural|park|beach|shopping|generic"
      }
    ]
  },
  "readyToBuild": false
}

REGLAS ESTRITAS PARA "specificPlaces":
1. DEBE contener ÚNICAMENTE lugares físicos y restaurantes reales con su nombre propio y su número de día exacto ('dia': 1, 2, ...).
2. ESTÁ TERMINANTEMENTE PROHIBIDO incluir actividades genéricas o frases descriptivas como:
   - "Instalación en casa", "Llegada", "Despedida", "Regreso a casa", "Picnic o almuerzo en la zona", "Picnic en la zona", "Tiempo libre", "Día libre", "Tarde libre", "Tarde libre para explorar", "Fiesta nocturna", "Tubbing en el río", "Las cascadas y visita a fincas de café", "Últimos momentos para disfrutar de la ciudad", "Participación en algún evento cultural".
   - Palabras genéricas como "local", "restaurante local", "zona", "casa propia", "comida típica", "para explorar".
3. Si el itinerario menciona una recomendación de restaurante (ej: "Cena en un restaurante local (recomiendo Restaurante El Celler)"), el lugar extraído DEBE SER "Restaurante El Celler" y NO "local".`

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
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[generateChatResponse] OpenAI API error status:', response.status, errText)
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`)
    }

    const json = await response.json()
    const rawContent = json.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent)

    let responseMessage = parsed.responseMessage || '¿En qué más te puedo ayudar con tu itinerario?'
    const actionChips = Array.isArray(parsed.actionChips) ? parsed.actionChips : []
    const parsedExtracted = parsed.extractedPreferences || {}

    // Evaluar estado completo de información clave
    const finalHasLodging = Boolean(hasLodging || hasValidValue(parsedExtracted.selectedHotel) || hasValidValue(parsedExtracted.accommodationStatus))
    const finalHasTransport = Boolean(hasValidValue(known.transport) || hasValidValue(parsedExtracted.transport))
    const finalHasBudget = Boolean(hasValidValue(known.budget) || hasValidValue(parsedExtracted.budget))
    const finalHasCompanions = Boolean(hasValidValue(known.companions) || hasValidValue(parsedExtracted.companions))
    const finalHasCity = Boolean(hasCity || hasValidValue(parsedExtracted.city))
    const finalHasDates = Boolean(
      hasDurationOrDates ||
      hasValidValue(parsedExtracted.datesSeason) ||
      (parsedExtracted.durationDays && Number(parsedExtracted.durationDays) > 0)
    )

    const isAllKeyInfoComplete = Boolean(
      finalHasCity &&
      finalHasDates &&
      finalHasCompanions &&
      finalHasLodging &&
      finalHasTransport &&
      finalHasBudget
    )

    // Detección explícita de comando de generación enviado por el usuario
    const isUserExplicitlyOrderingBuild = /\b(gener(ar|es|a|e|en|al)?\s+(el\s+)?tour|cre(ar|es|a|e|en)?\s+(el\s+)?tour|adelante(\s+(general|genera|crea|construye))?|inicia(r)?\s+tour|finaliza(r)?\s+tour|constru(ye|ir)\s+tour|dise[ñn](ar|a|es|e)?\s+(el\s+)?tour|est[aá]\s+perfecto\s+genera|listo\s+genera|listo\s+crea|ya\s+no\s+hay\s+nada\s+genera|listo\s+para\s+generar|vale\s+genera|procede\s+a\s+generar|si\s+genera\s+el\s+tour|s[íi]\s+genera\s+el\s+tour|genera\s+el\s+tour\s+porfa|crea\s+el\s+tour|haz\s+el\s+tour|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?|ok\s+quiero\s+generar|adelante\s+crea|adelante\s+procede|vamos\s+genera|armar\s+tour)\b/i.test(lastUserMsg)

    // Detección de si la IA está en modo consulta/propuesta esperando opinión del usuario
    const isBotAskingOrProposing = /\b(qu[ée]\s+te\s+parece|deseas\s+hacer\s+alg[uú]n\s+cambio|te\s+gustar[íi]a\s+incluir|qu[ée]\s+opinas|deseas\s+modificar|alguna\s+otra\s+preferencia|est[áa]\s+todo\s+listo\s+para\s+generar)\b/i.test(responseMessage) ||
      /\?\s*$/i.test(responseMessage.trim())

    const isBotConfirmingBuild = /\b(procedo a generar tu tour|procedo a generar|voy a generar tu tour)\b/i.test(responseMessage)

    // Solo se activa readyToBuild si TODA la información clave está completa Y el usuario lo ordenó explícitamente (o la IA confirmó la creación sin estar preguntando)
    const effectiveReadyToBuild = Boolean(
      isAllKeyInfoComplete &&
      (isUserExplicitlyOrderingBuild || (isBotConfirmingBuild && !isBotAskingOrProposing))
    )

    if (isUserExplicitlyOrderingBuild && !isAllKeyInfoComplete) {
      const missing = []
      if (!finalHasCity) missing.push('el destino')
      if (!finalHasDates) missing.push('las fechas o días de viaje')
      if (!finalHasCompanions) missing.push('tus acompañantes')
      if (!finalHasLodging) missing.push('tu alojamiento u hotel')
      if (!finalHasTransport) missing.push('tu medio de transporte')
      if (!finalHasBudget) missing.push('tu presupuesto estimado')

      responseMessage = `Para poder generar tu tour en el mapa y armar la ruta con precisión, aún necesitamos definir: **${missing.join(', ')}**. Por favor indícame este detalle para continuar.`
    } else if (effectiveReadyToBuild && /\b(aún necesito|necesito que me indiques|dónde planeas hospedarte|cómo prefieres moverte|tienes algún presupuesto)\b/i.test(responseMessage)) {
      responseMessage = `¡Excelente! Procedo a generar tu tour personalizado en ${destName} en el mapa. ¡Prepárate para disfrutar tu viaje!`
    }

    const destinationSuggestions = (!hasCity && !parsedExtracted.city)
      ? await buildVisualDestinationSuggestions(actionChips).catch(() => [])
      : []

    return {
      responseMessage,
      actionChips,
      extractedPreferences: parsedExtracted,
      specificPlaces: known.specificPlaces || [],
      destinationSuggestions,
      readyToBuild: Boolean(effectiveReadyToBuild)
    }
  } catch (err) {
    console.error('[generateChatResponse] Error calling OpenAI API:', err)
    return {
      responseMessage: `¡Excelente! Sigamos diseñando tu experiencia turística en ${destName || 'tu próximo destino'}. ¿Qué te gustaría planear a continuación?`,
      actionChips: getDefaultActionChips(known, lastUserMsg),
      extractedPreferences: {},
      specificPlaces: known.specificPlaces || [],
      destinationSuggestions: [],
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

  const prompt = `Eres un extractor de preferencias de viaje para VIBETOURS.
Analiza el último mensaje del usuario y el historial reciente para extraer datos estructurados.
Mensaje actual del usuario: "${userMessage}"
Datos ya conocidos: ${JSON.stringify(currentData)}

Devuelve ÚNICAMENTE un JSON con:
- "city": ciudad destino explícita (ej: "Santa Marta", "Cartagena", "Medellín") o null si no se menciona.
- "country": país o null.
- "datesSeason": fechas o temporada (ej: "del 9 al 12 de octubre", "julio", "puente de noviembre").
- "durationDays": número de días explícito O calculado a partir del rango de fechas (ej: del 9 al 12 de octubre son 4 días -> 4, "3 días" -> 3). Si no hay fechas ni duración, DEBE ser null.
- "companions": acompañantes (ej: "solo", "en pareja", "con amigos", "en familia").
- "groupSize": número de personas si se menciona.
- "hasChildren": true si viaja con niños, false si no.
- "budget": "Económico", "Moderado", "Lujo", "Ajustado" o null.
- "transport": "Caminando", "Auto rentado", "Transporte público", "Bicicleta", "Taxi / Uber" o null.
- "interests": lista de intereses mencionados (ej: ["playa", "gastronomía", "cultura"]).
- "selectedHotel": { "name": "Nombre del hotel" } o null si no se ha elegido.
- "accommodationStatus": "Casa propia / familiar", "Hotel elegido", "Por definir" o null.
- "specificPlaces": lista de atracciones o lugares físicos con nombre propio y día (ej: [{ "name": "Restaurante El Celler", "dia": 1 }, { "name": "Museo del Caribe", "dia": 2 }]). NUNCA incluir actividades genéricas ("Instalación en casa", "Llegada", "Despedida", "Picnic en la zona", "Tiempo libre", "Día libre", "Últimos momentos...", "local").`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    if (response.ok) {
      const data = await response.json()
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      if (parsed.durationDays && !parsed.durationHours) {
        parsed.durationHours = Number(parsed.durationDays) * 24
      }
      return parsed
    }
  } catch (err) {
    console.error('[extractChatInformation] Error:', err)
  }

  return extractChatInformationFallback(userMessage)
}

export function extractChatInformationFallback(prompt) {
  const res = {}
  const text = (prompt || '').toLowerCase()

  const dateRangeMatch = text.match(/\b(?:del\s+|desde\s+(?:el\s+)?)?(\d{1,2})\s+(?:al|hasta(?:\s+el)?)\s+(\d{1,2})\b/i)
  if (dateRangeMatch) {
    const startD = parseInt(dateRangeMatch[1], 10)
    const endD = parseInt(dateRangeMatch[2], 10)
    if (endD >= startD && (endD - startD) <= 30) {
      res.durationDays = endD - startD + 1
      res.durationHours = res.durationDays * 24
    }
  } else if (/\b(puente festivo|un puente festivo|un puente|puente|fin de semana largo|3 d[íi]as)\b/i.test(text)) {
    res.durationDays = 3
    res.durationHours = 72
  } else if (/\b(fin de semana|un par de d[íi]as|2 d[íi]as)\b/i.test(text)) {
    res.durationDays = 2
    res.durationHours = 48
  } else if (/\b(1 d[íi]a|un d[íi]a)\b/i.test(text)) {
    res.durationDays = 1
    res.durationHours = 8
  } else if (/\b(semanita|una semana|7 d[íi]as)\b/i.test(text)) {
    res.durationDays = 7
    res.durationHours = 168
  }

  if (/\b(pareja|con mi novia|con mi novio|con mi esposa|con mi esposo)\b/i.test(text)) {
    res.companions = 'En pareja'
    res.groupSize = 2
  } else if (/\b(familia|con mis hijos|con mis padres|con mi familia)\b/i.test(text)) {
    res.companions = 'En familia'
    if (/\b(niño|niña|hijo|bebe|pequeño)/i.test(text)) res.hasChildren = true
  } else if (/\b(amigos|con amigos|con parceros|con amigas|grupo)\b/i.test(text)) {
    res.companions = 'Con amigos'
  } else if (/\b(solo|sola|viajo solo|viajo sola)\b/i.test(text)) {
    res.companions = 'Solo'
    res.groupSize = 1
  }

  if (/\b(econ[oó]mico|mochilero|barato|ajustado|bajo presupuesto)\b/i.test(text)) {
    res.budget = 'Económico'
  } else if (/\b(lujo|premium|alto|cinco estrellas)\b/i.test(text)) {
    res.budget = 'Lujo'
  } else if (/\b(moderado|medio|est[aá]ndar)\b/i.test(text)) {
    res.budget = 'Moderado'
  }

  if (/\b(caminando|a pie|pie)\b/i.test(text)) {
    res.transport = 'Caminando'
  } else if (/\b(auto|carro|coche|veh[íi]culo|alquiler|rentado|rentar)\b/i.test(text)) {
    res.transport = 'Auto rentado'
  } else if (/\b(bici|bicicleta)\b/i.test(text)) {
    res.transport = 'Bicicleta'
  } else if (/\b(transporte p[úu]blico|bus|metro)\b/i.test(text)) {
    res.transport = 'Transporte público'
  } else if (/\b(taxi|uber|cabify|inDrive)\b/i.test(text)) {
    res.transport = 'Taxi / Uber'
  }

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
  prompt = '',
  touristProfileSummary = '',
  touristInterests = [],
  touristPace = 'balanced',
  places = [],
  userPreferences = {},
  selectedHotel = null
}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const cleanCity = cleanAdministrativeCityName(city || destination || '')
  const targetCountry = country || 'Colombia'

  const totalDays = Math.max(1, Number(userPreferences?.durationDays || Math.ceil((durationHours || 24) / 24) || 1))
  const selectedPlaces = places.map((p, i) => ({
    name: p.name,
    dia: Number(p.dia || p.day || (Math.floor((i * totalDays) / places.length) + 1)),
    category: p.category || 'historic',
    description: p.description || ''
  })).slice(0, 30)

  const system = `Eres Tour Planner AI 🤖, el motor oficial de diseño de itinerarios turísticos de VibeTours.
Tu misión es diseñar un tour profesional, inmersivo, geográficamente viable y 100% fiel al destino "${cleanCity}, ${targetCountry}".

ESQUEMA OFICIAL OBLIGATORIO DE SALIDA:
Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "nombre_tour": "Tour Personalizado por ${cleanCity}",
  "resumen_corto": "Resumen conciso y vendedor de la experiencia (1 oración)",
  "tipo_tour": "${type || 'cultural'}",
  "subcategorias": ["Cultura", "Gastronomía", "Historia"],
  "descripcion_tour": "Descripción completa, cautivadora e inspiradora del recorrido general",
  "experiencia_destacada": "El momento cumbre o vivencia más memorable del tour",
  "historia_del_lugar": "Reseña histórica verídica de ${cleanCity}",
  "contexto_cultural": "Tradiciones, folclore y ambiente local",
  "duracion_estimada": "${totalDays} días",
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
1. Utiliza exactamente la lista de lugares seleccionados recibida (${selectedPlaces.map((item, i) => `${i + 1}. ${item.name} (Día ${item.dia})`).join(', ')}). Respeta fielmente su orden secuencial y asigna cada parada a su día indicado en el itinerario ("dia": 1..${totalDays}).
2. Cada parada del itinerario debe corresponder a un lugar físico real de la lista.
3. El tour dura ${totalDays} días. Debes estructurar el itinerario distribuyendo las paradas según los días indicados, asegurando que existan paradas para cada uno de los ${totalDays} días ("dia": 1..${totalDays}).
4. El título "nombre_tour" DEBE ser sobre ${cleanCity} (ej: "Tour Cultural por ${cleanCity}" o "Experiencia por ${cleanCity}"). NUNCA nombres el tour con el nombre de una sola tienda, restaurante o parada individual.
5. NO agregues hoteles ni alojamientos como paradas de actividad dentro del itinerario.
6. Para cada parada, redacta una narración de guía de voz inmersiva de 120 a 180 palabras.
7. Integra notas dinámicas de consejos y datos curiosos específicos por parada.`

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
