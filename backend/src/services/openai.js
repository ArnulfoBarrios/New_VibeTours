import { GeoCache } from './geoCache.js'
import { imageForPlaceWithStatus } from './imageSearch.js'
import { classifyUserIntent, INTENT_TYPES } from './intentClassifier.js'
import { cleanAdministrativeCityName } from './destinationService.js'
import { searchWebForTravel } from './webSearch.js'

const locationExtractCache = new GeoCache(12 * 60 * 60 * 1000, 300)
const planCache = new GeoCache(6 * 60 * 60 * 1000, 200)

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

function sanitizeExtractedLocation(raw, promptText = '') {
  if (!raw || typeof raw !== 'object') {
    return {
      is_unrelated: false,
      explicit_destination: '',
      city: '',
      country: '',
      origin_place: null,
      destination_place: null,
      is_user_location_origin: false,
      cities: [],
      is_multi_city: false,
      duration_hours: null,
      duration_specified: false,
      budget: null,
      companion_type: null,
      suggestions: []
    }
  }

  let isUnrelated = Boolean(raw.is_unrelated)
  const travelKeywords = /\b(tour|tours|viaje|viajes|viajar|itinerario|recorrido|turismo|tur[íi]stico|lugar|lugares|visitar|pasar|pasarla|divertido|divertirme|entretenido|vacaciones|experiencia|destino|destinos|hotel|hoteles|playa|playas|museo|museos|ciudad|ciudades)\b/i
  if (travelKeywords.test(promptText || '')) {
    isUnrelated = false
  }

  return {
    is_unrelated: isUnrelated,
    explicit_destination: String(raw.explicit_destination ?? '').trim(),
    city: String(raw.city ?? '').trim(),
    country: String(raw.country ?? '').trim(),
    origin_place: raw.origin_place ? String(raw.origin_place).trim() : null,
    destination_place: raw.destination_place ? String(raw.destination_place).trim() : null,
    is_user_location_origin: Boolean(raw.is_user_location_origin),
    cities: Array.isArray(raw.cities) ? raw.cities.map(c => String(c).trim()).filter(Boolean) : [],
    is_multi_city: Boolean(raw.is_multi_city) || (Array.isArray(raw.cities) && raw.cities.length >= 2),
    duration_hours: typeof raw.duration_hours === 'number' && Number.isFinite(raw.duration_hours) ? raw.duration_hours : null,
    duration_specified: Boolean(raw.duration_specified),
    budget: raw.budget ? String(raw.budget).trim() : null,
    companion_type: raw.companion_type ? String(raw.companion_type).trim() : null,
    suggestions: Array.isArray(raw.suggestions)
      ? raw.suggestions.map(s => ({
          city: String(s?.city ?? '').trim(),
          country: String(s?.country ?? '').trim(),
          reason: String(s?.reason ?? '').trim()
        }))
      : []
  }
}

const FAMOUS_CITIES_MAP = {
  'nueva york': { city: 'Nueva York', country: 'Estados Unidos' },
  'new york': { city: 'Nueva York', country: 'Estados Unidos' },
  'ny': { city: 'Nueva York', country: 'Estados Unidos' },
  'nyc': { city: 'Nueva York', country: 'Estados Unidos' },
  'miami': { city: 'Miami', country: 'Estados Unidos' },
  'orlando': { city: 'Orlando', country: 'Estados Unidos' },
  'los angeles': { city: 'Los Ángeles', country: 'Estados Unidos' },
  'los ángeles': { city: 'Los Ángeles', country: 'Estados Unidos' },
  'san francisco': { city: 'San Francisco', country: 'Estados Unidos' },
  'las vegas': { city: 'Las Vegas', country: 'Estados Unidos' },
  'chicago': { city: 'Chicago', country: 'Estados Unidos' },
  'washington': { city: 'Washington D.C.', country: 'Estados Unidos' },
  'parís': { city: 'París', country: 'Francia' },
  'paris': { city: 'París', country: 'Francia' },
  'londres': { city: 'Londres', country: 'Reino Unido' },
  'london': { city: 'Londres', country: 'Reino Unido' },
  'roma': { city: 'Roma', country: 'Italia' },
  'rome': { city: 'Roma', country: 'Italia' },
  'tokio': { city: 'Tokio', country: 'Japón' },
  'tokyo': { city: 'Tokio', country: 'Japón' },
  'madrid': { city: 'Madrid', country: 'España' },
  'barcelona': { city: 'Barcelona', country: 'España' },
  'cancun': { city: 'Cancún', country: 'México' },
  'cancún': { city: 'Cancún', country: 'México' },
  'ciudad de mexico': { city: 'Ciudad de México', country: 'México' },
  'cdmx': { city: 'Ciudad de México', country: 'México' },
  'bogota': { city: 'Bogotá', country: 'Colombia' },
  'bogotá': { city: 'Bogotá', country: 'Colombia' },
  'medellin': { city: 'Medellín', country: 'Colombia' },
  'medellín': { city: 'Medellín', country: 'Colombia' },
  'cartagena': { city: 'Cartagena', country: 'Colombia' },
  'cali': { city: 'Cali', country: 'Colombia' },
  'barranquilla': { city: 'Barranquilla', country: 'Colombia' },
  'santa marta': { city: 'Santa Marta', country: 'Colombia' },
  'buenos aires': { city: 'Buenos Aires', country: 'Argentina' },
  'rio de janeiro': { city: 'Río de Janeiro', country: 'Brasil' },
  'río de janeiro': { city: 'Río de Janeiro', country: 'Brasil' },
  'lima': { city: 'Lima', country: 'Perú' },
  'cusco': { city: 'Cusco', country: 'Perú' },
  'santiago': { city: 'Santiago', country: 'Chile' }
}

export function extractLocationLocalFallback(prompt) {
  if (!prompt || typeof prompt !== 'string') return null
  const p = prompt.trim()
  const lower = p.toLowerCase()

  const isUserGps = /\b(desde mi ubica|donde estoy|mi posici[oó]n|desde aqu[íi]|empieza aqu[íi])\b/i.test(lower)

  let originPlace = null
  let destinationPlace = null
  let isMultiCity = false
  let cities = []

  // Check multi-city pattern: "empieze en X y acabe en Y"
  const multiCityMatch = lower.match(/\b(empieze|empiece|inicie|desde)\s+en\s+([A-ZÁÉÍÓÚa-záéíóú\s]+?)\s+y\s+(acabe|termine|finalice)\s+en\s+([A-ZÁÉÍÓÚa-záéíóú\s]+?)(?=\s+(?:en|el|la|donde|para)|$)/i)
  if (multiCityMatch) {
    isMultiCity = true
    const city1 = multiCityMatch[2].trim()
    const city2 = multiCityMatch[4].trim()
    cities = [city1, city2]
  } else if (isUserGps) {
    originPlace = 'user_current_location'
    const destMatch = lower.match(/\b(hasta|hacia|a|al)\s+([^,.]+)/i)
    if (destMatch) {
      destinationPlace = destMatch[2].replace(/\b(donde|pueda|ver|que|lugares|interesantes|para).*/i, '').trim()
    }
  } else {
    const routeMatch = lower.match(/\b(del|de|desde|partiendo de)\s+(.+?)\s+(al|a|hasta|hacia)\s+(.+)/i)
    if (routeMatch) {
      const origCandidate = routeMatch[2].replace(/\b(tour|viaje)\b/i, '').trim()
      const destCandidate = routeMatch[4].replace(/\b(donde|pueda|ver|que|lugares|interesantes|para).*/i, '').trim()
      if (origCandidate.length > 2 && destCandidate.length > 2) {
        originPlace = origCandidate
        destinationPlace = destCandidate
      }
    }
  }

  let durationHours = null
  let durationSpecified = false
  const daysMatch = lower.match(/\b(\d+)\s*d[íi]as?\b/i)
  const hoursMatch = lower.match(/\b(\d+)\s*horas?\b/i)
  if (daysMatch) {
    durationSpecified = true
    durationHours = parseInt(daysMatch[1], 10) * 24
  } else if (hoursMatch) {
    durationSpecified = true
    durationHours = parseInt(hoursMatch[1], 10)
  }

  let explicitDestination = destinationPlace || (cities.length > 0 ? cities[0] : '')
  let explicitCity = ''
  let explicitCountry = ''

  for (const [key, info] of Object.entries(FAMOUS_CITIES_MAP)) {
    if (lower.includes(key)) {
      explicitDestination = info.city
      explicitCity = info.city
      explicitCountry = info.country
      break
    }
  }

  if (!explicitDestination) {
    const cityMatch = p.match(/\b(a|en|para|hacia)\s+([A-ZÁÉÍÓÚ][a-záéíóú\s]+?)(?=\s+(?:donde|para|con|que|quiero|voy)|$)/i)
    if (cityMatch) {
      const candidate = cityMatch[2].trim()
      const stopWords = ['un', 'una', 'el', 'la', 'los', 'las', 'un ritmo', 'ir', 'estar', 'ver', 'hacer', 'viajar', 'colombia', 'lugar', 'lugares', 'sitio', 'sitios']
      if (!stopWords.includes(candidate.toLowerCase())) {
        explicitDestination = candidate
      }
    }
  }

  return {
    is_unrelated: false,
    explicit_destination: explicitDestination,
    city: explicitCity || explicitDestination,
    country: explicitCountry || (lower.includes('colombia') ? 'Colombia' : ''),
    origin_place: originPlace,
    destination_place: destinationPlace,
    is_user_location_origin: isUserGps,
    cities: cities.length > 0 ? cities : (explicitDestination ? [explicitDestination] : []),
    is_multi_city: isMultiCity,
    duration_hours: durationHours,
    duration_specified: durationSpecified,
    budget: null,
    companion_type: null,
    suggestions: []
  }
}

export async function extractLocation(prompt, lat, lon, userCountry = null) {
  if (!prompt || typeof prompt !== 'string') return null
  const cacheKey = `extract_${prompt.toLowerCase().trim()}_${lat ?? ''}_${lon ?? ''}_${userCountry ?? ''}`
  const cached = locationExtractCache.get(cacheKey)
  if (cached) return cached

  const timeoutMs = 40000
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    return extractLocationLocalFallback(prompt)
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
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
          { role: 'system', content: `Eres un asistente experto en viajes. Lee el prompt del usuario.
Determina primero si el mensaje del usuario no tiene sentido, es una secuencia aleatoria de letras/caracteres (ej: "yfyzGgstfuvu", "asdffd"), o si es un tema completamente ajeno a planificar viajes, turismo, tours, hoteles, rutas o geografía. Si se da este caso, establece obligatoriamente "is_unrelated" en true. Si es un mensaje coherente relacionado con viajes o turismo, establece "is_unrelated" en false.

Si "is_unrelated" es false:
- Si menciona claramente a dónde quiere ir (una o varias ciudades, o una atracción específica como "hasta el Estadio Metropolitano", "al Malecón", "a la playa X"), pon esa ciudad o lugar en "explicit_destination".
- REGLA CRÍTICA DE PAÍS Y METRÓPOLIS: Si la ciudad solicitada es una metrópoli o ciudad mundialmente conocida (ej: "Nueva York", "París", "Roma", "Londres", "Tokio", "Madrid", "Miami", "Cancún"), establece OBLIGATORIAMENTE el país oficial en "country" (ej: "Estados Unidos", "Francia", "Italia", "Reino Unido", "Japón", "España", "México"). NUNCA dejes "country" vacío para ciudades famosas y NUNCA asignes el país del GPS del usuario a la propiedad "country" cuando el destino solicitado es internacional.
- REGLA CRÍTICA DE ORIGEN DESDE GPS: Marca "is_user_location_origin" en true y "origin_place" en "user_current_location" ÚNICAMENTE si el usuario dijo EXPLÍCITAMENTE en su texto frases como "desde mi ubicación", "partiendo de donde estoy", "desde mi posición", "empieza aquí". Si el usuario NO escribió esas palabras, "is_user_location_origin" DEBE SER FALSE.
- Si el usuario menciona una ruta de punto a punto dentro de una ciudad (ej. "del Malecón del Río al Estadio Metropolitano"), extrae "origin_place" (ej. "Malecón del Río") y "destination_place" (ej. "Estadio Metropolitano").
- Si menciona varias ciudades para recorrer (ej. "empieze en Cartagena y termine en Santa Marta"), extrae en "cities" un array con las ciudades (ej: ["Cartagena", "Santa Marta"]) y marca "is_multi_city" en true.
- Detección de duración: Si el usuario especificó explícitamente el tiempo en su mensaje (ej. "de 3 días", "tour de 4 horas", "2 días"), establece "duration_specified" en true y convierte ese tiempo a horas en "duration_hours" (ej: 3 días = 72, 4 horas = 4). Si el usuario NO mencionó el tiempo ni días ni horas, establece "duration_specified" en false y "duration_hours" en null.
- ÚNICAMENTE si el usuario NO menciona ninguna ciudad ni lugar a dónde ir, pon "explicit_destination" vacío y recomienda 3 destinos increíbles (ciudades) adaptados a sus gustos en "suggestions".

Devuelve ÚNICAMENTE JSON válido con este esquema:
{
  "is_unrelated": boolean,
  "explicit_destination": string,
  "city": string,
  "country": string,
  "origin_place": string o null,
  "destination_place": string o null,
  "is_user_location_origin": boolean,
  "cities": [string],
  "is_multi_city": boolean,
  "duration_specified": boolean,
  "duration_hours": number o null,
  "budget": string o null,
  "companion_type": string o null,
  "suggestions": [{ "city": "...", "country": "...", "reason": "..." }]
}` },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!response.ok) {
      console.warn('[extractLocation] non-ok status', response.status)
      return null
    }
    const json = await response.json()
    let content = json.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)
    const result = sanitizeExtractedLocation(parsed, prompt)
    if (result) locationExtractCache.set(cacheKey, result)
    return result
  } catch (err) {
    console.error('[extractLocation] error:', err.message)
    return null
  }
}

export async function planWithOpenAI({
  destination,
  country,
  city,
  durationHours,
  type,
  language,
  prompt,
  places,
  touristProfileSummary = '',
  touristInterests = [],
  touristPace = 'balanced',
  recommendedSchedule = '',
  timeProfile = {},
  selectedHotel = null,
  webSearchSummary = '',
  userPreferences = {}
}) {
  const cacheKey = `plan_${destination}_${city}_${country}_${type}_${durationHours}_${language}_${selectedHotel?.name ?? ''}_${userPreferences.companions ?? ''}_${userPreferences.budget ?? ''}`
  const cached = planCache.get(cacheKey)
  if (cached) {
    console.info('[openai] Returning cached tour plan from GeoCache')
    return cached
  }

  const timeoutMs = Number.parseInt(process.env.OPENAI_TIMEOUT_MS ?? '', 10) || 120000
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.warn('[planWithOpenAI] OPENAI_API_KEY no está configurada')
    return null
  }

  const selectedPlaces = summarizePlaces(places).slice(0, 25)
  let system = `Eres "Tour Planner AI" 🤖, el motor inteligente de planificación turística y navegación de VibeTours.
Tu misión es diseñar tours e itinerarios reales, lógicamente viables, geográficamente coherentes y sin errores.
================================================================================
🚨 REGLAS ESTRICTAS DE INTEGRIDAD GEOGRÁFICA Y ESTRUCTURA (ANTI-ALUCINACIÓN) 🚨
================================================================================
1. PROHIBICIÓN ABSOLUTA DE PARADAS FALSAS O METADATOS:
   - JAMÁS generes, catalogues ni extraigas como paradas de tour elementos de estructura como:
     * Títulos de días: "Día 1", "Día 2", "Día 3", "Day 1", etc.
     * Franjas horarias o marcadores de tiempo: "Mañana", "Tarde", "Noche", "Cena", "Almuerzo", "Atardecer".
     * Emojis de tiempo: "🌅", "🍽️", "🌇", "🌙".
     * Categorías o comodidades genéricas: "Alojamiento", "Punto de partida", "Paseo", "Descanso", "Bailar".
   - Cada parada DEBE ser un NOMBRE PROPIO de un lugar turístico físico, monumento, plaza, museo, parque o restaurante real y existente.
2. COHERENCIA DE RUTAS TERRESTRES Y LOGÍSTICA MARÍTIMA:
   - Si el itinerario incluye una atracción insular o marítima (ej: Islas del Rosario, Isla Barú, Isla Grande, etc.):
     * NO intentes trazar una ruta terrestre a través del mar.
     * La parada continental de partida DEBE ser el muelle o puerto de embarque oficial (ej: "Muelle de La Bodeguita, Cartagena").
     * Asigna a las excursiones marítimas una duración realista de medio día o día completo (4 a 6 horas), NUNCA paradas de 1 a 15 minutos.
   - Las paradas de un mismo día deben estar a una distancia caminable o en transporte local lógico dentro de la misma zona urbana.
3. OPTIMIZACIÓN ESPACIAL Y ORDEN SECUENCIAL (CERO ZIGZAG):
   - Agrupa las paradas por proximidad geográfica dentro de cada día.
   - Ordena las paradas siguiendo una secuencia continua y fluida de viaje (ej: Centro Histórico ➔ Getsemaní ➔ Castillo San Felipe), evitando retrocesos absurdos de un extremo al otro de la ciudad.
4. DEDUPLICACIÓN ESTRICTA DE RESTAURANTES Y ATRACCIONES:
   - Cada restaurante o atracción debe aparecer EXACTAMENTE UNA VEZ en todo el itinerario.
   - Normaliza los nombres eliminando prefijos redundantemente: "Restaurante Celele" y "Celele" son el mismo lugar. Asigna 1 solo restaurante por comida/día.
5. CONTEXTO LOCAL EN DESCRIPCIONES E IMÁGENES:
   - Todas las descripciones deben ser narraciones culturales del sitio real en la ciudad destino indicada (${city || destination}, ${country || 'Colombia'}).
   - Para barrios históricos (ej: Getsemaní en Cartagena), describe el barrio colonial, su arte urbano y ambiente local (PROHIBIDO asociarlo con referencias bíblicas de Jerusalén o templos de otros países).

REGLAS CRÍTICAS DE BALANCE DUAL (ICÓNICO + PREFERENCIAS):
- BALANCE PERFECTO: Combina las atracciones turísticas MÁS EMBLEMÁTICAS, FAMOSAS Y POPULARES de la ciudad (los lugares imperdibles) con las preferencias específicas indicadas por el usuario.
- ADAPTACIÓN A LAS RESPUESTAS DEL USUARIO:
  * Acompañantes (${userPreferences.companions || 'no especificado'}): Si viaja con niños o personas mayores, adapta el ritmo, incluye consejos de sombras/descansos y facilidades para niños.
  * Presupuesto (${userPreferences.budget || 'Moderado'}): Ajusta las actividades, entradas recomendadas y sugerencias gastronómicas al nivel de presupuesto del usuario.
  * Transporte (${userPreferences.transport || 'Caminando/Auto'}): Detalla instrucciones de traslado según el medio de transporte preferido.
  * Fechas/Época (${userPreferences.datesSeason || 'Temporada habitual'}): Integra eventos reales, clima y consejos según la temporada indicada.
  * Hospedaje (${userPreferences.accommodationStatus || 'Sin especificar'}): Si hay hotel seleccionado o punto de encuentro, inicia o finaliza el recorrido allí.
  * Lugares específicos solicitados (${(userPreferences.specificPlaces || []).join(', ') || 'ninguno'}): DEBEN estar obligatoriamente en las paradas del tour.

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB (Eventos, Clima, Precios reales):\n${webSearchSummary}\n` : ''}

REGLAS DE CONTENIDO:
- PROHIBIDO INVENTAR: No alucines lugares inexistentes.
- CRÍTICO LÍMITES TURÍSTICOS REGIONALES UNIVERSALES: Puedes incluir atracciones icónicas, parques naturales, playas o excursiones de un día ubicadas dentro del área metropolitana o región turística habitual de "${city || destination}, ${country || ''}" (hasta ~40 km, como Parque Tayrona o Minca para Santa Marta, Guatapé para Medellín, Islas del Rosario para Cartagena). Queda PROHIBIDO incluir atracciones ubicadas en un centro urbano o metrópoli DISTANTE totalmente diferente (ej: no incluir atracciones de Cartagena en un tour de Barranquilla, ni atracciones de Bogotá en un tour de Medellín).
- Escribe en ${language}.
- CRÍTICO GUÍA DE VOZ INMERSIVA: Cada descripción de parada ("descripcion") DEBE ser una guía de voz completa y envolvente de 120 a 180 palabras. Escribe como si fueras un guía local experto hablando en vivo al oído del turista. Narra la historia fascinante del sitio, los detalles arquitectónicos o naturales que tiene enfrente, anécdotas culturales únicas y sugerencias de 'Qué hacer o qué probar aquí'.
- CRÍTICO CADA PARADA ES ÚNICA: PROHIBIDO copiar y pegar descripciones o consejos genéricos.
- CRÍTICO DURACIONES REALISTAS: Queda estrictamente PROHIBIDO asignar duraciones de menos de 20 minutos a cualquier parada. Para museos, galerías, castillos y recintos históricos (ej: Palacio de la Inquisición, Museo del Oro, Cerro de la Popa, Museo Naval), asigna entre 45 y 90 minutos de visita. Para monumentos o plazas al aire libre, asigna entre 25 y 40 minutos.
- CRÍTICO LOGÍSTICA DE ISLAS Y EXCURSIONES MARÍTIMAS: Si el itinerario incluye una atracción insular o marítima alejada (ej: Islas del Rosario, Isla Barú o Playa Blanca desde Cartagena), esta actividad representa una excursión de medio día o día completo. Asigna a esta actividad suficiente tiempo (mínimo 4 a 6 horas en el itinerario del día) y detalla que la partida se realiza desde el muelle de embarque (ej: Muelle de la Bodeguita). Queda PROHIBIDO asignarle duraciones relámpago de 20 o 30 minutos intercaladas en caminatas urbanas del mismo día.
- El array de salida "itinerario" debe tener EXACTAMENTE la misma longitud que la lista de lugares seleccionados (selectedPlaces) que recibes.`

  if (selectedHotel && selectedHotel.name) {
    system += `\n- CRÍTICO: El turista se hospedará o iniciará en el hotel: "${selectedHotel.name}". El "punto_encuentro" (meetingPoint) del tour DEBE ser obligatoriamente este hotel.`
  }

  system += `\n- CRÍTICO RUTA CON INICIO Y FIN: Si el usuario especificó un punto de partida y un punto de llegada, la Parada 1 del itinerario DEBE ser el punto de partida especificado y la última Parada DEBE ser el destino final especificado. Las paradas intermedias deben integrarse de forma fluida de camino hacia la meta final.`
  system += `\n- CRÍTICO TOUR MULTICIUDAD / MULTIDÍA: Si el tour abarca más de una ciudad o recorrido de carretera interurbana, las paradas seleccionadas están ordenadas strictly desde la ciudad de origen hacia la ciudad de destino. Narra el itinerario respetando esta secuencia progresiva sin hacer retrocesos geográficos ni saltos anacrónicos. Organiza el itinerario dividiendo las paradas de manera equilibrada por días y en los trayectos entre ciudades, detalla las instrucciones del viaje intermunicipal.`

  const routeBrief = {
    destination,
    country,
    city,
    durationHours,
    type,
    prompt,
    touristProfileSummary,
    touristInterests,
    touristPace,
    recommendedSchedule,
    timeProfile,
    selectedPlaces
  }

  const makeRequest = async (attempt) => {
    try {
      console.info(`[openai] request attempt ${attempt}`, { model: 'gpt-4o-mini', selectedPlaces: selectedPlaces.length, destination, city, country, durationHours, type })
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(new Error(`OpenAI request timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs)
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
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
            {
              role: 'user',
              content: `Genera un tour profesional con este esquema exacto de claves:
{
  "nombre_tour": "",
  "resumen_corto": "",
  "tipo_tour": "",
  "subcategorias": [],
  "descripcion_tour": "",
  "experiencia_destacada": "",
  "historia_del_lugar": "",
  "contexto_cultural": "",
  "duracion_estimada": "",
  "distancia_total": "",
  "nivel_dificultad": "",
  "idiomas_disponibles": [],
  "publico_recomendado": [],
  "mejor_epoca": "",
  "horario_recomendado": "",
  "punto_encuentro": {
    "nombre_lugar": "",
    "direccion": "",
    "ciudad": "",
    "region": "",
    "pais": "",
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
      "nombre": "",
      "descripcion": "",
      "duracion_estimada": "",
      "actividades": [],
      "datos_curiosos": [],
      "consejos": [],
      "ubicacion": {
        "nombre_lugar": "",
        "direccion": "",
        "ciudad": "",
        "region": "",
        "pais": "",
        "latitud": 0.0,
        "longitud": 0.0,
        "place_id": "",
        "url_mapa": ""
      },
      "imagenes": []
    }
  ],
  "orden_paradas": [],
  "incluye": [],
  "no_incluye": [],
  "recomendaciones": [],
  "que_llevar": [],
  "normas_del_tour": [],
  "etiquetas": [],
  "palabras_clave": [],
  "categoria_principal": "",
  "presupuesto_estimado_usd": {
    "bajo": 0,
    "medio": 0,
    "alto": 0
  },
  "informacion_adicional": {
    "accesibilidad": "",
    "mascotas_permitidas": false,
    "apto_para_ninos": true,
    "apto_para_adultos_mayores": true
  }
}

No inventes lugares fuera de la lista proporcionada.
DEBES usar EXACTAMENTE la lista de lugares seleccionados (selectedPlaces) como el itinerario final y mantenerte estrictamente fiel al orden lógico sugerido.
Cada parada de la lista proporcionada debe estar en tu respuesta, sin agregar ni quitar ninguna.
Si el tour dura varios días (durationHours >= 24), distribuye las paradas de manera equilibrada asignándoles el campo "dia" (por ejemplo: 1, 2, 3...) según su orden.
Input: ${JSON.stringify(routeBrief)}`,
            },
          ],
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.warn(`[openai] non-ok on attempt ${attempt}`, { status: response.status, statusText: response.statusText, text: text.slice(0, 400) })
        return { ok: false, error: 'non-ok status' }
      }
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content ?? '{}'
      try {
        const parsed = JSON.parse(content)
        console.info(`[openai] parsed successfully on attempt ${attempt}`, { hasItinerary: Array.isArray(parsed.itinerario), itinerary: Array.isArray(parsed.itinerario) ? parsed.itinerario.length : 0 })
        return { ok: true, data: parsed }
      } catch (parseError) {
        console.warn(`[openai] parse-error on attempt ${attempt}`, { message: parseError?.message ?? String(parseError) })
        return { ok: false, error: 'parse error' }
      }
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? `OpenAI request timed out after ${Math.round(timeoutMs / 1000)}s`
        : error?.message ?? String(error)
      console.warn(`[openai] request-failed on attempt ${attempt}`, { message })
      return { ok: false, error: message }
    }
  }

  let result = await makeRequest(1)
  if (result.ok && result.data) {
    planCache.set(cacheKey, result.data)
    return result.data
  }

  console.info('[openai] Retrying generation after failure...')
  result = await makeRequest(2)
  if (result.ok && result.data) {
    planCache.set(cacheKey, result.data)
    return result.data
  }

  return null
}

function safeParseJson(raw, fallback = {}) {
  if (!raw || typeof raw !== 'string') return fallback
  try {
    let clean = raw.trim()
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }
    return JSON.parse(clean)
  } catch (err) {
    console.warn('[safeParseJson] parse error, attempting regex extraction:', err.message)
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (_) {}
    }
    return fallback
  }
}

export async function extractChatInformation(userMessage, currentData = {}, history = []) {
  // First evaluate user intent confidence & ambiguity
  const intentEval = classifyUserIntent(userMessage, currentData)
  if (intentEval.needsClarification) {
    return {
      intentEval,
      isAmbiguousInput: true
    }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallback = extractChatInformationFallback(userMessage)
    return { ...fallback, intentEval }
  }

  const recentHistoryText = (history || []).slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')

  const prompt = `Analiza el último mensaje del usuario Y el historial de conversación reciente para identificar las preferencias turísticas y atracciones mencionadas/aceptadas.
Devuelve ÚNICAMENTE un objeto JSON válido con los campos que logres identificar con ALTA CONFIANZA. NO INFIERAS campos de frases de una sola palabra o sin contexto (mantén los campos no mencionados como null).

CAMPOS Y REGLAS DE INTERPRETACIÓN:
1. "destination" / "city": Nombre de la ciudad o lugar de destino (ej: "Cartagena", "Medellín", "Bogotá", "Santa Marta"). Si el usuario dice "Cartagena", el país es "Colombia".
2. "datesSeason": Fechas, mes o época del viaje (ej: "Próximo mes", "15 al 20 de Septiembre", "Vacaciones de fin de año", "Este fin de semana").
3. "durationDays" (número): Días de duración del tour. Si el usuario dice "un puente festivo", "puente festivo", "un puente", "puente", "fin de semana largo", asigna durationDays = 3 y durationHours = 72. Si dice "fin de semana" o "2 días", asigna durationDays = 2 y durationHours = 48. Si dice "1 día", asigna durationDays = 1 y durationHours = 8. Si dice "una semana", asigna durationDays = 7 y durationHours = 168.
4. "companions": "Solo", "Pareja", "Familia con niños", "Amigos", "Grupo".
5. "hasChildren" (boolean): true si viaja con niños.
6. "budget": "Económico", "Moderado", "Lujo". Solo extraer si hay contexto claro (ej. "mi presupuesto es económico").
7. "transport": "Caminando", "Transporte público", "Auto rentado", "Taxi/Uber". Solo extraer si hay intención explícita de medio de transporte.
8. "selectedHotel": Objeto { "name": "Nombre del hotel" } ÚNICAMENTE si el usuario EXPLÍCITAMENTE ELIGE, RESERVA o CONFIRMA hospedarse en ese hotel (ej: "Elijo Hotel Casa La Fe", "Confirmo Hotel Casa La Fe", "Me quedo en Hotel Casa La Fe", "Quiero hospedarme en Hotel Casa La Fe"). Si el usuario SOLO ESTÁ PIDIENDO INFORMACIÓN, DETALLES, SERVICIOS O PRECIOS (ej: "Dame más información sobre...", "Dame información sobre...", "Cuéntame del...", "Qué tal es el..."), "selectedHotel" DEBE SER NULL.
9. "accommodationStatus": "Ya posee hospedaje", "Quiere buscar hospedaje", o "Hospedaje confirmado en <nombre del hotel>" (ÚNICAMENTE si el usuario lo confirmó explícitamente).
10. "specificPlaces" (array de strings): Nombres de atracciones o restaurantes específicos dentro de la ciudad (NUNCA nombres de ciudades ni países ni hoteles).
11. "interests" (array de strings): Intereses.

HISTORIAL DE CONVERSACIÓN RECIENTE:
${recentHistoryText}

ÚLTIMO MENSAJE DEL USUARIO: "${userMessage}"`

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

    if (!response.ok) {
      const fallback = extractChatInformationFallback(userMessage)
      return { ...fallback, intentEval }
    }

    const json = await response.json()
    const parsed = safeParseJson(json.choices?.[0]?.message?.content ?? '{}', {})

    // Clean null or empty fields
    Object.keys(parsed).forEach(key => {
      if (parsed[key] === null || parsed[key] === undefined || parsed[key] === '') {
        delete parsed[key]
      }
    })

    // Normalización de duración por expresiones idiomáticas
    if (/\b(puente festivo|un puente festivo|un puente|puente|fin de semana largo)\b/i.test(userMessage)) {
      parsed.durationDays = 3
      parsed.durationHours = 72
    } else if (/\b(fin de semana|2 d[íi]as)\b/i.test(userMessage) && !parsed.durationDays) {
      parsed.durationDays = 2
      parsed.durationHours = 48
    } else if (typeof parsed.durationDays === 'number' && parsed.durationDays > 0) {
      parsed.durationHours = parsed.durationDays >= 2 ? parsed.durationDays * 24 : 8
    }

    if (parsed.companions === 'Familia con niños') {
      parsed.hasChildren = true
    }

    const isOnlyInquiringHotel = /\b(m[aá]s informaci[oó]n|informaci[oó]n del?|informaci[oó]n sobre|detalles del?|cu[eé]ntame m[aá]s|cu[eé]ntame sobre|c[oó]mo es el|qu[eé] tal es el|precios? del?|servicios del?)\b/i.test(userMessage)
    const isExplicitlyChoosingHotel = /\b(confirmar|confirmo|elegir|elijo|escoger|escojo|seleccionar|selecciono|me quedo en|quiero hospedarme en|me hospedo en|este hotel)\b/i.test(userMessage)

    if (isOnlyInquiringHotel && !isExplicitlyChoosingHotel) {
      delete parsed.selectedHotel
      delete parsed.accommodationStatus
    } else if (parsed.selectedHotel) {
      const hotelName = typeof parsed.selectedHotel === 'string' ? parsed.selectedHotel : parsed.selectedHotel.name
      if (hotelName) {
        parsed.selectedHotel = { name: hotelName }
        parsed.accommodationStatus = `Hospedaje confirmado en ${hotelName}`
      }
    }

    return { ...parsed, intentEval }
  } catch (err) {
    console.error('[openai] extract error:', err)
    const fallback = extractChatInformationFallback(userMessage)
    return { ...fallback, intentEval }
  }
}

export function extractChatInformationFallback(prompt) {
  if (!prompt || typeof prompt !== 'string') return {}
  const lower = prompt.trim().toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)
  const result = {}

  // If input is ambiguous or a single keyword like "presupuesto", do not infer transport or budget values blindly
  if (words.length <= 1) {
    if (/^(hotel|hostal|casa)\s+/i.test(prompt)) {
      result.selectedHotel = { name: prompt.trim() }
      result.accommodationStatus = `Hospedaje confirmado en ${prompt.trim()}`
    }
    return result
  }

  // Dates / Season extraction
  if (/\b(pr[oó]ximo mes|siguiente mes)\b/i.test(lower)) {
    result.datesSeason = 'Próximo mes'
  } else if (/\b(vacaciones de fin de a[ñn]o|fin de a[ñn]o|diciembre|enero)\b/i.test(lower)) {
    result.datesSeason = 'Fin de año'
  } else if (/\b(vacaciones de mitad de a[ñn]o|mitad de a[ñn]o|junio|julio)\b/i.test(lower)) {
    result.datesSeason = 'Vacaciones de mitad de año'
  } else if (/\b(semana santa|pascua)\b/i.test(lower)) {
    result.datesSeason = 'Semana Santa'
  } else if (/\b(este fin de semana)\b/i.test(lower)) {
    result.datesSeason = 'Este fin de semana'
  }

  if (/\b(fin de semana con puente|puente festivo|un puente festivo|un puente|puente|fin de semana largo|3 d[íi]as)\b/i.test(lower)) {
    result.durationDays = 3
    result.durationHours = 72
  } else if (/\b(fin de semana|un par de d[íi]as|2 d[íi]as)\b/i.test(lower)) {
    result.durationDays = 2
    result.durationHours = 48
  } else if (/\b(1 d[íi]a|un d[íi]a)\b/i.test(lower)) {
    result.durationDays = 1
    result.durationHours = 8
  } else if (/\b(semanita|una semana|7 d[íi]as)\b/i.test(lower)) {
    result.durationDays = 7
    result.durationHours = 168
  }

  if (/\b(ni[ñn]o|ni[ñn]as|hijo|hijas|bebe|familia con ni[ñn]os)\b/i.test(lower)) {
    result.companions = 'Familia con niños'
    result.hasChildren = true
  } else if (/\b(pareja|esposo|esposa|novio|novia)\b/i.test(lower)) {
    result.companions = 'Pareja'
  } else if (/\b(amigos|parceros|panas|grupo)\b/i.test(lower)) {
    result.companions = 'Amigos'
  } else if (/\b(viajo solo|voy solo|conmigo mismo)\b/i.test(lower)) {
    result.companions = 'Solo'
  }

  if (/\b(presupuesto (ahorrar|econ[oó]mico|barato|bajo))\b/i.test(lower)) {
    result.budget = 'Económico'
  } else if (/\b(presupuesto (lujo|alto|sin escatimar|5 estrellas))\b/i.test(lower)) {
    result.budget = 'Lujo'
  } else if (/\b(presupuesto (moderado|medio|normal))\b/i.test(lower)) {
    result.budget = 'Moderado'
  }

  if (/\b(ir caminando|desplazarse a pie)\b/i.test(lower)) {
    result.transport = 'Caminando'
  } else if (/\b(rentar auto|alquilar coche|alquilar carro|rentar veh[íi]culo)\b/i.test(lower)) {
    result.transport = 'Auto rentado'
  } else if (/\b(usar (bus|metro|transporte p[úu]blico))\b/i.test(lower)) {
    result.transport = 'Transporte público'
  } else if (/\b(tomar (taxi|uber|cabify))\b/i.test(lower)) {
    result.transport = 'Taxi/Uber'
  }

  const isOnlyInquiringHotel = /\b(m[aá]s informaci[oó]n|informaci[oó]n del?|informaci[oó]n sobre|detalles del?|cu[eé]ntame m[aá]s|c[oó]mo es el|qu[eé] tal es el|precios? del?|servicios del?)\b/i.test(lower)
  if (!isOnlyInquiringHotel) {
    if (/\b(hotel|hostal|casa|resort)\s+[a-z0-9\s]+/i.test(lower) || /^(hotel|hostal|casa)\s+/i.test(prompt)) {
      const hotelMatch = prompt.match(/\b(Hotel\s+[A-Za-z0-9\s]+|Hostal\s+[A-Za-z0-9\s]+|Casa\s+[A-Za-z0-9\s]+)/i)
      if (hotelMatch) {
        result.selectedHotel = { name: hotelMatch[0].trim() }
        result.accommodationStatus = `Hospedaje confirmado en ${hotelMatch[0].trim()}`
      }
    } else if (/\b(tengo (hotel|hospedaje|casa)|ya tengo|quedarme en|reserva)\b/i.test(lower)) {
      result.accommodationStatus = 'Ya posee hospedaje'
    } else if (/\b(buscar (hotel|hoteles|hospedaje|alojamiento)|quiero quedarme en hotel)\b/i.test(lower)) {
      result.accommodationStatus = 'Quiere buscar hospedaje'
    }
  }

  return result
}

export function isVagueDestination(dest, known = {}) {
  if (!dest) return true
  if (known.canonicalDestination && known.canonicalDestination.city) return false
  const lower = String(dest).toLowerCase().trim()
  if (lower.length < 2) return true
  const isGenericTermOnly = /^(playa|playas|caribe|costa|mar|monta[ñn]a|naturaleza|europa|asia|latinoam[ée]rica|sudam[ée]rica|extranjero|fuera|exterior|frontera|isla|alojamiento|hospedaje|ciudad|destino|lugar)$/i.test(lower)
  return isGenericTermOnly
}

function getNextMissingPreference(known = {}) {
  const dest = known.city || known.destination
  if (!dest || isVagueDestination(dest, known)) return 'city'
  if (!known.datesSeason) return 'datesSeason'
  if (!known.durationDays && !known.durationHours) return 'duration'
  if (!known.companions) return 'companions'
  if (!known.budget) return 'budget'
  if (!known.transport) return 'transport'
  if (!known.accommodationStatus) return 'accommodationStatus'
  return 'all_completed'
}

export function getDefaultActionChips(known = {}, lastMessage = '') {
  const destName = known.city || known.destination
  const hasCity = Boolean(destName)
  const isAskingRestaurants = hasCity && /\b(restaurante|restaurantes|comer|d[oó]nde comer|gastronom[íi]a|comida)\b/i.test(lastMessage)
  const isAskingEvents = hasCity && /\b(evento|eventos|festival|festivales|concierto|eventos locales)\b/i.test(lastMessage)
  const isAskingActivities = hasCity && /\b(actividad|actividades|qu[eé] hacer|atracciones|lugares|ver|visitar)\b/i.test(lastMessage)
  const isAskingHotel = hasCity && /\b(hotel|hoteles|alojamiento|hospedaje)\b/i.test(lastMessage)
  const isAskingItineraryStatus = hasCity && /\b(itinerario|revisar itinerario|revisar el itinerario|revisa itinerario|ver itinerario|ver el itinerario|c[oó]mo va el itinerario|mu[eé]strame el tour|mu[eé]strame el itinerario|qu[eé] llevamos planeado|qu[eé] llevamos|c[oó]mo vamos|resumen del itinerario|ver tour|desglose del tour|plan actual|quiero ver el itinerario|ver itinerario actualizado|itinerario actualizado|ver itinerario completo|itinerario completo)\b/i.test(lastMessage)

  if (isAskingItineraryStatus) {
    return ['🚀 Generar itinerario completo', '✏️ Modificar algún día', '➕ Agregar otra actividad']
  }
  if (isAskingRestaurants) {
    return ['➕ Agregar 1 restaurante por día', `🚀 Generar tour en ${destName}`, '🎯 Ver actividades']
  }
  if (isAskingActivities) {
    return ['➕ Agregar todas las actividades', `🚀 Generar tour en ${destName}`, '🍽️ Ver restaurantes']
  }
  if (isAskingEvents) {
    return [`🚀 Generar tour en ${destName}`, '🍽️ Ver restaurantes', '🎯 Ver actividades']
  }
  if (isAskingHotel) {
    return [`🚀 Generar tour en ${destName}`, '🍽️ Ver restaurantes', '🎯 Ver actividades']
  }

  const nextMissing = getNextMissingPreference(known)

  if (nextMissing === 'city') {
    const isDomesticOrNearby = /cercan|cerca|en mi zona|mi zona|mi ciudad|mi pa[íi]s|propio pa[íi]s|dentro del pa[íi]s|nacional|colombia/i.test(lastMessage)
    const isHistory = /hist[óo]rica|historia|patrimonio|monumento|antigua|museo|cultural/i.test(lastMessage) || /hist[óo]rica/i.test(String(known.destination || '')) || /hist[óo]rica/i.test(String(known.city || ''))
    const isInternational = /internacional|exterior|otro país|fuera del país|europa|asia|eeuu|usa|extranjero|fuera|viaje internacional/i.test(lastMessage)
    const isBeach = /playa|mar|costa|brisa|isla|relajarme|relajar/i.test(lastMessage)
    const isNature = /naturaleza|bosque|senderismo|ecoturismo|montaña/i.test(lastMessage)

    if (isDomesticOrNearby && !isInternational) {
      const userLat = Number(known.latitude)
      const userLon = Number(known.longitude)
      if (userLat > 10 && userLat < 12 && userLon > -76 && userLon < -72) {
        return ['Santa Marta', 'Taganga', 'Minca', 'Cartagena']
      }
      return ['Santa Marta', 'Cartagena', 'Medellín', 'Bogotá']
    }

    if (isInternational) return ['París', 'Madrid', 'Nueva York', 'Cancún']
    if (isBeach) return ['Santa Marta', 'Cartagena', 'San Andrés', 'Taganga']
    if (isNature) return ['Minca', 'Parque Tayrona', 'Eje Cafetero', 'Medellín']
    if (isHistory) return ['Cartagena', 'Santa Marta', 'Bogotá', 'Villa de Leyva']
    return ['Santa Marta', 'Cartagena', 'Medellín', 'Bogotá']
  }

  if (nextMissing === 'datesSeason') return ['Próximo mes', 'Este fin de semana', 'Vacaciones de mitad de año', 'Fin de año']
  if (nextMissing === 'duration') return ['Un fin de semana (2-3 días)', '3 días', '1 día completo']
  if (nextMissing === 'companions') return ['En familia con niños', 'Solo', 'En pareja', 'Con amigos']
  if (nextMissing === 'budget') return ['Económico', 'Moderado', 'Lujo']
  if (nextMissing === 'transport') return ['Auto rentado', 'Caminando', 'Transporte público', 'Taxi / Uber']
  if (nextMissing === 'accommodationStatus') return ['Tengo mi propio hospedaje', 'Recomiéndame hoteles']

  // ¡CUANDO YA SE RESPONDIERON TODAS LAS PREGUNTAS!
  return [`🚀 Generar tour en ${destName || 'mi destino'}`, '✏️ Cambiar un detalle']
}

export const DESTINATION_LOCAL_PRESETS = {
  cartagena: {
    name: 'Cartagena',
    country: 'Colombia',
    hotels: [
      { name: 'Hotel Casa La Fe', desc: 'Hermosa casona colonial republicana restaurada del siglo XIX con piscina en la azotea, solárium y vistas panorámicas de las cúpulas coloniales en la Plaza Fernández de Madrid (Centro Histórico).', price: '~$90 - $130 USD/noche' },
      { name: 'Hotel Boutique Casa Isabel', desc: 'Situado frente a la Laguna del Cabrero con terraza en la azotea, jacuzzi y vista panorámica inigualable del atardecer sobre la laguna y el Castillo San Felipe.', price: '~$75 - $110 USD/noche' },
      { name: 'Hotel San Pedro de Majagua', desc: 'Cabañas ecológicas de lujo en Isla Grande (Archipiélago del Rosario) con acceso directo a dos playas privadas de aguas cristalinas y centro de buceo PADI.', price: '~$140 - $220 USD/noche' }
    ],
    restaurants: [
      { name: 'Restaurante La Cevicheria', specialty: 'Ceviche clásico de corvina, langosta al ajillo, pulpo a la plancha con patacones y arroz marinero' },
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
      'Paseo en Chiva',
      'Café del Mar',
      'Plaza de Santo Domingo y Getsemaní'
    ],
    events: [
      { name: 'Hay Festival Cartagena', month: 'Enero/Febrero', desc: 'Prestigioso encuentro internacional de literatura, arte, ciencia y pensamiento en el Centro Histórico.' },
      { name: 'Festival Internacional de Cine de Cartagena (FICCI)', month: 'Marzo/Abril', desc: 'El festival de cine más antiguo de América Latina dedicado a la cinematografía iberoamericana.' },
      { name: 'Fiestas de la Independencia de Cartagena', month: 'Noviembre', desc: 'Gran celebración popular con desfiles de comparsas, música caribeña y reinados tradicionales.' }
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
      { name: 'Fiesta del Mar', month: 'Julio (último fin de semana)', desc: 'La máxima festividad de Santa Marta que celebra el aniversario de la ciudad con competencias náuticas internacionales, conciertos masivos en la playa y desfiles folclóricos.' },
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
  const targetCountry = countryName || 'Local'

  return {
    name: capitalCity,
    country: targetCountry,
    hotels: [
      { name: `Hotel en el Centro de ${capitalCity}`, desc: `Alojamiento céntrico y confortable en ${capitalCity} con fácil acceso a los principales atractivos.`, price: '~$70 - $120 USD/noche' },
      { name: `Gran Alojamiento ${capitalCity}`, desc: `Estancia de primer nivel con atención de calidad y desayuno en ${capitalCity}.`, price: '~$90 - $150 USD/noche' },
      { name: `Hospedaje Familiar ${capitalCity}`, desc: `Ambiente acogedor ideal para descansar en ${capitalCity}.`, price: '~$50 - $90 USD/noche' }
    ],
    restaurants: [
      { name: `Restaurante Típico en ${capitalCity}`, specialty: `Especialidades culinarias y recetas tradicionales de ${capitalCity}` },
      { name: `Bistró Local de ${capitalCity}`, specialty: `Platos destacados con ingredientes frescos de la región` },
      { name: `Sabores Auténticos de ${capitalCity}`, specialty: `Variedad de recetas y platos locales tradicionales` }
    ],
    places: [
      `Centro Histórico de ${capitalCity}`,
      `Plaza Mayor de ${capitalCity}`,
      `Mirador de ${capitalCity}`,
      `Parque Principal de ${capitalCity}`
    ],
    events: []
  }
}

export async function generateChatResponse(state, backendInstruction, webSearchSummary = '', currentPreferences = {}) {
  const known = currentPreferences || {}
  const recentHistory = (state.history || []).slice(-6).map(m => ({ role: m.role, content: m.content }))
  const lastUserMsg = state.history?.[state.history.length - 1]?.content || ''
  const hasCity = Boolean(known.city || known.destination)
  const rawDestName = known.city || known.destination || ''
  const destName = cleanAdministrativeCityName(rawDestName)
  const destCountry = known.country || ''
  const presets = getDestinationPresets(destName, destCountry)

  const isAskingItineraryStatus = hasCity && /\b(itinerario|revisar itinerario|revisar el itinerario|revisa itinerario|ver itinerario|ver el itinerario|c[oó]mo va el itinerario|mu[eé]strame el tour|mu[eé]strame el itinerario|qu[eé] llevamos planeado|qu[eé] llevamos|c[oó]mo vamos|resumen del itinerario|ver tour|desglose del tour|plan actual|quiero ver el itinerario|ver itinerario actualizado|itinerario actualizado|ver itinerario completo|itinerario completo)\b/i.test(lastUserMsg)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    let fallbackMsg = '¡Hola! Qué gusto saludarte. Cuéntame: ¿a qué ciudad te gustaría viajar?'
    const isAskingHotelInfoFallback = hasCity && /\b(m[aá]s informaci[oó]n|detalles|cu[eé]ntame m[aá]s|informaci[oó]n del?|informaci[oó]n sobre|c[oó]mo es|servicios|fotos|precios?|ubicaci[oó]n)\b/i.test(lastUserMsg) && /\b(hotel|hostal|resort|casa la fe|casa isabel|majagua|edition|faena|st\.?\s*regis|artemide|bristol|ath[ée]n[ée]e|fabric|aman|hyatt)\b/i.test(lastUserMsg)
    const isAskingHotelRecommendationsFallback = hasCity && !known.selectedHotel && !isAskingHotelInfoFallback && /\b(hotel|hoteles|alojamiento|d[oó]nde hospedarme|d[oó]nde quedarme|hospedaje|opciones de hotel|opciones de hospedaje|buscar hotel|buscar hospedaje|recomi[eé]ndame hoteles|qu[eé] hoteles)\b/i.test(lastUserMsg)
    const isAskingSpecificDayFallback = hasCity && /\b(detalles del d[íi]a\s*(\d+)|ver detalles del d[íi]a\s*(\d+)|ver d[íi]a\s*(\d+)|d[íi]a\s*(\d+))\b/i.test(lastUserMsg)
    const isAskingMenusFallback = hasCity && /\b(men[uú]|men[uú]s|carta|platos|ver men[uú]s|qu[eé] sirven)\b/i.test(lastUserMsg)
    const isAskingRestaurantsFallback = hasCity && /\b(restaurante|restaurantes|comer|d[oó]nde comer|gastronom[íi]a|comida)\b/i.test(lastUserMsg)
    
    if (isAskingHotelInfoFallback) {
      const hotelObj = presets.hotels[0]
      fallbackMsg = `¡Con mucho gusto! Aquí tienes los detalles del **${hotelObj.name}** en ${destName}: 🏨✨\n\n` +
        `• 📍 **Ubicación y Estilo**: ${hotelObj.desc}\n` +
        `• 🍳 **Servicios**: Desayuno gourmet incluido, Wi-Fi de alta velocidad, aire acondicionado y recepción 24 horas.\n` +
        `• 💰 **Tarifa estimada**: ${hotelObj.price}.\n\n` +
        `¿Deseas confirmar el ${hotelObj.name} como tu hospedaje?`
      return {
        responseMessage: fallbackMsg,
        actionChips: [`✅ Confirmar ${hotelObj.name}`, '🏨 Ver otras opciones de hotel', '🎯 Sugerir actividades'],
        specificPlaces: (hasCity && Array.isArray(known.specificPlaces)) ? known.specificPlaces : [],
        destinationSuggestions: [],
        readyToBuild: false
      }
    } else if (isAskingHotelRecommendationsFallback) {
      fallbackMsg = `¡Qué emoción que busques opciones de hospedaje en ${destName}! 🎉 Aquí te dejo tres excelentes recomendaciones adaptadas a tu presupuesto (${known.budget || 'Moderado'}):\n\n` +
        presets.hotels.map((h, i) => `${i + 1}. **${h.name}**: ${h.desc}`).join('\n') +
        `\n\n¿Cuál de estos te gustaría elegir como tu hospedaje?`
      return {
        responseMessage: fallbackMsg,
        actionChips: presets.hotels.map(h => h.name),
        specificPlaces: (hasCity && Array.isArray(known.specificPlaces)) ? known.specificPlaces : [],
        destinationSuggestions: [],
        readyToBuild: false
      }
    } else if (isAskingSpecificDayFallback) {
      const match = lastUserMsg.match(/\b(d[íi]a\s*(\d+)|detalles\s+del\s+d[íi]a\s*(\d+))\b/i)
      const dayNum = parseInt(match?.[2] || match?.[3] || '1', 10)
      const hotel = known.selectedHotel?.name || known.selectedHotel || presets.hotels[0].name
      const acts = presets.places
      const rests = presets.restaurants

      fallbackMsg = `**Detalles del Día ${dayNum} en ${destName}:** ☀️🏛️\n\n` +
        `• 🏨 **Alojamiento / Punto de partida**: ${hotel}\n` +
        `• 🌅 **09:00 AM - Mañana**: Visita a ${acts[0] || 'Atracción principal'}\n` +
        `• 🍽️ **12:30 PM - Almuerzo**: ${rests[0]?.name || 'Restaurante local'} (${rests[0]?.specialty || 'Gastronomía típica'})\n` +
        `• 🌇 **03:30 PM - Tarde**: Recorrido por ${acts[2] || acts[1] || 'Paseo cultural'}\n` +
        `• 🌙 **07:30 PM - Noche**: Cena y recorrido nocturno por ${acts[3] || 'Centro histórico'}\n\n` +
        `¿Te gustaría generar el tour completo o ver otro día?`
      return {
        responseMessage: fallbackMsg,
        actionChips: [`🚀 Generar tour en ${destName}`, '📋 Ver itinerario completo', '✏️ Modificar este día'],
        specificPlaces: (hasCity && Array.isArray(known.specificPlaces)) ? known.specificPlaces : [],
        destinationSuggestions: [],
        readyToBuild: false
      }
    } else if (isAskingMenusFallback) {
      fallbackMsg = `¡Aquí tienes los platos destacados de los restaurantes recomendados en ${destName}! 🍲✨\n\n` +
        presets.restaurants.map(r => `• **${r.name.replace(/^Restaurante\s+/i, '')}**: ${r.specialty}.`).join('\n') +
        `\n\n¿Deseas agregar estos restaurantes a tu itinerario?`
    } else if (isAskingRestaurantsFallback) {
      fallbackMsg = `¡Aquí tienes excelentes opciones de restaurantes en ${destName}! 🍽️✨\n\n` +
        presets.restaurants.map((r, i) => `${i + 1}. **${r.name}**: ${r.specialty}.`).join('\n') +
        `\n\n¿Te gustaría incluir estas opciones en tu itinerario?`
    } else if (isAskingItineraryStatus) {
      const places = (known.specificPlaces || []).length > 0 ? known.specificPlaces : presets.places
      const isThreeDays = known.durationDays === 3 || (known.durationHours && known.durationHours >= 72)
      const hotel = known.selectedHotel?.name || known.selectedHotel || presets.hotels[0].name
      fallbackMsg = `¡Aquí tienes el desglose de lo que llevamos planeado para tu viaje en ${destName}! 🗺️\n\n` +
        `**Día 1:**\n` +
        `- 🏨 **Alojamiento / Punto de partida**: ${hotel}\n` +
        `- 🌅 **Mañana**: Visita a ${places[0] || presets.places[0]}\n` +
        `- 🍽️ **Almuerzo**: ${presets.restaurants[0]?.name || 'Restaurante Local'}\n` +
        `- 🌇 **Tarde**: ${places[2] || presets.places[2] || presets.places[1]}\n` +
        `- 🌙 **Noche / Cena**: Experiencia gastronómica y vida nocturna\n\n` +
        `**Día 2:**\n` +
        `- 🏨 **Alojamiento**: ${hotel}\n` +
        `- 🌅 **Mañana / Tarde**: ${places[1] || presets.places[1]}\n` +
        `- 🍽️ **Almuerzo**: ${presets.restaurants[1]?.name || 'Restaurante Gourmet'}\n` +
        `- 🌇 **Tarde**: ${places[3] || presets.places[3] || presets.places[2]}\n` +
        `- 🌙 **Noche / Cena**: ${presets.restaurants[2]?.name || 'Restaurante Destacado'}\n\n`
      
      if (isThreeDays) {
        fallbackMsg += `**Día 3:**\n` +
          `- 🏨 **Alojamiento**: ${hotel}\n` +
          `- 🌅 **Mañana**: Recorrido por ${places[4] || presets.places[4] || presets.places[0]}\n` +
          `- 🍽️ **Almuerzo**: ${presets.restaurants[3]?.name || presets.restaurants[0]?.name}\n` +
          `- 🌇 **Tarde**: Recorrido cultural y de compras\n` +
          `- 🌙 **Noche / Cena**: Cena de despedida y paseo nocturno\n\n`
      }
      fallbackMsg += `¿Deseas generar el itinerario completo o modificar algún día?`
    }
    return {
      responseMessage: fallbackMsg,
      actionChips: fallbackChips,
      specificPlaces: (hasCity && Array.isArray(known.specificPlaces)) ? known.specificPlaces : [],
      destinationSuggestions: (!known.city && !known.destination) ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : [],
      readyToBuild: false
    }
  }

  const isAskingCityRecommendations = !hasCity && /\b(recomien|recomiend|qué me recomiendas|que me recomiendas|dónde ir|donde ir|sugiéreme|sugiereme|opciones|destinos|playas|viaje|tour)\b/i.test(lastUserMsg)
  const isAskingHotelInfo = hasCity && /\b(m[aá]s informaci[oó]n|detalles|cu[eé]ntame m[aá]s|informaci[oó]n del?|informaci[oó]n sobre|c[oó]mo es|servicios|fotos|precios?|ubicaci[oó]n|instalaciones|qu[eé] ofrece)\b/i.test(lastUserMsg) && /\b(hotel|hostal|resort|casa la fe|casa isabel|majagua|edition|faena|st\.?\s*regis|artemide|bristol|ath[ée]n[ée]e|fabric|aman|hyatt)\b/i.test(lastUserMsg)
  const isAskingHotelRecommendations = hasCity && !known.selectedHotel && !isAskingHotelInfo && /\b(hotel|hoteles|alojamiento|dónde hospedarme|dónde quedarme|hospedaje|opciones de hotel|opciones de hospedaje|buscar hotel|buscar hospedaje|recomi[eé]ndame hoteles)\b/i.test(lastUserMsg)
  const isHotelSelected = !isAskingHotelInfo && Boolean(known.selectedHotel && /\b(hotel|hostal|resort|casa)\b/i.test(lastUserMsg))
  const isAcceptingSuggestions = hasCity && /\b(agregar todas|incluir todas|agregar estas|incluir estas|agregar los restaurantes|agregar las actividades|s[íi],?\s*agrega|s[íi],?\s*incluye|agrega los 3|agregar los 3|a[ñn]adir todas|a[ñn]adir estas|agregar 1 restaurante|agregar restaurante por d[íi]a)\b/i.test(lastUserMsg)
  const isAskingMenus = hasCity && /\b(men[uú]|men[uú]s|carta|platos|ver men[uú]s|qu[eé] sirven)\b/i.test(lastUserMsg)
  const isAskingRestaurants = hasCity && !isAcceptingSuggestions && !isAskingMenus && /\b(restaurante|restaurantes|comer|d[oó]nde comer|donde comer|gastronom[íi]a|comida|cenar|desayuno|almuerzo|cena|ver qu[eé] restaurantes hay|qu[eé] restaurantes hay|consultar restaurantes|consultar restaurantes locales)\b/i.test(lastUserMsg)
  const isAskingActivities = hasCity && !isAcceptingSuggestions && !isAskingRestaurants && !isAskingMenus && !isAskingItineraryStatus && !isAskingHotelInfo && /\b(actividad|actividades|actividades acu[aá]ticas|tours? culturales?|qu[eé] hacer|que hacer|atracciones|lugares tur[íi]sticos|sitios tur[íi]sticos|lugares para visitar|imperdibles|snorkel|playa|aventura|naturaleza|quiero explorar actividades|sugerir actividades)\b/i.test(lastUserMsg)
  const isAskingEvents = hasCity && /\b(evento|eventos|festival|festivales|fiesta|concierto|agenda|carnaval|eventos locales|consultar eventos)\b/i.test(lastUserMsg)
  const isExplicitBuild = /\b(genera(r)?(\s+el)?\s+(tour|itinerario)|crea(r)?(\s+el)?\s+(tour|itinerario)|arma(r)?(\s+el)?\s+(tour|itinerario)|haz(\s+el)?\s+(tour|itinerario)|construir\s+(el\s+)?(tour|itinerario)|finalizar|comenzar(\s+el)?\s+tour|empezar(\s+el)?\s+tour|listo genera|s[íi],?\s*genera|s[íi],?\s*arma|cr[eé]alo|h[aá]zlo|[aá]rmalo|generar\s+ahora|genera\s+ahora|confirmar tour|confirmar itinerario|adelante genera el tour|adelante genera)\b/i.test(lastUserMsg)

  const nextMissing = getNextMissingPreference(known)

  let promptInstruction = ''
  if (isExplicitBuild) {
    promptInstruction = `
    EL USUARIO SOLICITÓ EXPLÍCITAMENTE GENERAR SU TOUR ("${lastUserMsg}").
    ESTÁ ESTRICTAMENTE PROHIBIDO volver a preguntar si desea generar el tour o hacer preguntas redundantes.
    Confirma con entusiasmo que su tour está siendo generado y preparado a la perfección.
    PROHIBIDO incluir preguntas redundantes o listas vacías de confirmación.
    `
  } else if (isAcceptingSuggestions) {
    promptInstruction = `
    EL USUARIO ACABA DE ACEPTAR O SOLICITAR AGREGAR LAS SUGERENCIAS RECIENTES A SU TOUR ("${lastUserMsg}").
    Confirma con entusiasmo que todas esas actividades y restaurantes han sido guardados e integrados con éxito en su plan de viaje.
    ESTÁ ESTRICTAMENTE PROHIBIDO volver a preguntar si desea agregarlas o pedir confirmación otra vez.
    Pregunta amablemente qué le gustaría hacer a continuación (por ejemplo: consultar eventos, ver el itinerario o generar el tour completo).
    `
  } else if (isAskingHotelInfo) {
    promptInstruction = `
    EL USUARIO ESTÁ PIDIENDO MÁS INFORMACIÓN Y DETALLES DE UN HOTEL ESPECÍFICO ("${lastUserMsg}").
    DESTINO CONFIRMADO: ${destName}, ${destCountry || presets.country}.
    OBLIGATORIO: Debes redactar en el cuerpo del mensaje una descripción completa, atractiva y detallada del hotel consultado:
    - 🏨 Ubicación exacta y tipo de casona/arquitectura.
    - 🌟 Comodidades principales (piscina en la azotea, vistas panorámicas, desayuno gourmet incluido, Wi-Fi, aire acondicionado, solárium).
    - 💰 Rango de precios aproximado por noche.
    ESTÁ ESTRICTAMENTE PROHIBIDO responder con mensajes cortados o vacíos como solo "¡Excelente!".
    Al final, pregúntale amablemente si desea confirmar este hotel como su hospedaje o explorar otras opciones.
    `
  } else if (isAskingMenus) {
    promptInstruction = `
    EL USUARIO SOLICITÓ INFORMACIÓN DE LOS MENÚS Y ESPECIALIDADES DE LOS RESTAURANTES ("${lastUserMsg}").
    DESTINO CONFIRMADO: ${destName}, ${destCountry || presets.country}.
    OBLIGATORIO: Debes redactar en el cuerpo del mensaje los platos emblemáticos y especialidades de los mejores restaurantes de la ciudad (${presets.restaurants.map(r => r.name).join(', ')}).
    ESTÁ TERMINANTEMENTE PROHIBIDO hablar de atracciones turísticas o tours en esta respuesta. Habla EXCLUSIVAMENTE de gastronomía, platos y menús.
    `
  } else if (isHotelSelected) {
    promptInstruction = `
    EL USUARIO ACABA DE CONFIRMAR SU HOTEL: "${known.selectedHotel?.name || known.selectedHotel}".
    Confirma alegremente que el ${known.selectedHotel?.name || known.selectedHotel} ha sido guardado como su punto de partida y hospedaje en ${destName}.
    ESTÁ ESTRICTAMENTE PROHIBIDO volver a recomendar hoteles.
    Invítalo a generar su tour o a agregar alguna actividad o restaurante si lo desea.
    `
  } else if (isAskingItineraryStatus) {
    const placesList = Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0 ? known.specificPlaces : presets.places.slice(0, 5)
    promptInstruction = `
    EL USUARIO SOLICITÓ CONSULTAR EL ESTADO DEL ITINERARIO O VER SU TOUR ("${lastUserMsg}").
    ESTÁ ESTRICTAMENTE PROHIBIDO responder con mensajes preliminares vacíos o sólo introductorios esperando confirmación.
    DEBES generar y mostrar INMEDIATAMENTE el desglose completo organizado por días (Día 1, Día 2, Día 3...) con viñetas claras que especifiquen:
    - 🏨 **Alojamiento / Punto de partida**: Hotel elegido (${known.selectedHotel?.name || known.selectedHotel || 'Hotel acordado / Punto de encuentro'}).
    - 🌅 **Mañana**: Actividad o atracción confirmada de la lista acumulada de lugares acordados (${placesList.join(', ') || 'Atracciones principales'}).
    - 🍽️ **Almuerzo**: Restaurante seleccionado para ese día (diferente en cada día, asignar 1 restaurante por día de los acordados).
    - 🌇 **Tarde**: Actividad o paseo cultural/playa confirmado.
    - 🌙 **Noche / Cena**: Restaurante o experiencia de vida nocturna.

    PROHIBIDO OMITIR atracciones y restaurantes acordados en chat: ${JSON.stringify(known.specificPlaces || [])}.
    Al final del desglose, incluye una invitación a continuar con los botones de acción rápida.
    `
  } else if (isAskingCityRecommendations) {
    promptInstruction = `
    EL USUARIO SOLICITÓ RECOMENDACIONES DE DESTINOS/CIUDADES ("${lastUserMsg}").
    AÚN NO HA ELEGIDO UNA CIUDAD DESTINO.
    Recomienda con entusiasmo 3 a 4 ciudades o regiones maravillosas adaptadas a sus gustos.
    PREGUNTA EXPLÍCITAMENTE CUÁL DE ESTAS CIUDADES PREFIERE ELEGIR PARA SU VIAJE.
    PROHIBIDO preguntar si desea armar el tour ahora mismo antes de que escoja la ciudad.
    `
  } else if (isAskingHotelRecommendations) {
    promptInstruction = `
    EL USUARIO SOLICITÓ RECOMENDACIONES DE HOTELES EN ${destName}, ${destCountry || presets.country}: "${lastUserMsg}".
    DESTINO CONFIRMADO: ${destName}, ${destCountry || presets.country}.
    Proporciona 3 excelentes opciones reales de hospedaje en ${destName}, ${destCountry || presets.country} acordes a su presupuesto (${known.budget || 'Moderado'}).
    OBLIGATORIO: Debes redactar en el cuerpo del mensaje la lista numerada con los 3 hoteles y una breve descripción de cada uno (${presets.hotels.map(h => h.name).join(', ')}). ESTÁ ESTRICTAMENTE PROHIBIDO dejar el mensaje cortado en dos puntos ":" sin listar los hoteles.
    OBLIGATORIO: En "actionChips" debes incluir los nombres exactos de los 3 hoteles recomendados (ej: ${JSON.stringify(presets.hotels.map(h => h.name))}).
    `
  } else if (isAskingEvents) {
    promptInstruction = `
    EL USUARIO CONSULTÓ POR EVENTOS Y FESTIVALES EN ${destName}, ${destCountry || presets.country} PARA SUS FECHAS (${known.datesSeason || 'su viaje'}): "${lastUserMsg}".
    DESTINO CONFIRMADO: ${destName}, ${destCountry || presets.country}.
    
    REGLAS ESTRICTAS PARA EVENTOS:
    1. OBLIGATORIO: Debes redactar un mensaje COMPLETO. ESTÁ PROHIBIDO dejar el mensaje cortado en dos puntos ":" sin texto.
    2. EVALUACIÓN DE FECHAS:
       - Si en las fechas del viaje (${known.datesSeason || 'próximamente'}) HAY festivales o eventos especiales reales en la ciudad: lístalos con fecha exacta, nombre y descripción breve.
       - Si en esas fechas NO hay eventos o festivales especiales programados: INFÓRMALO con total amabilidad y honestidad ("Para estas fechas no hay festivales especiales programados..."), y a continuación INFORMA cuáles son los festivales y eventos más emblemáticos de la ciudad a lo largo del año con sus meses.
    3. Invita al usuario a continuar con el armado de su tour o a explorar la gastronomía y actividades.
    `
  } else if (isAskingActivities) {
    promptInstruction = `
    EL USUARIO SOLICITÓ RECOMENDACIONES DE ACTIVIDADES EN ${destName}: "${lastUserMsg}".
    DESTINO CONFIRMADO: ${destName}.
    OBLIGATORIO: Debes redactar en el texto del mensaje una lista numerada con 3 a 4 actividades y lugares imperdibles (${presets.places.slice(0, 4).join(', ')}) con una breve descripción de cada una.
    ESTÁ ESTRICTAMENTE PROHIBIDO terminar el mensaje cortado en dos puntos ":".
    `
  } else if (isAskingRestaurants) {
    promptInstruction = `
    EL USUARIO SOLICITÓ RECOMENDACIONES DE RESTAURANTES EN ${destName}: "${lastUserMsg}".
    DESTINO CONFIRMADO: ${destName}.
    OBLIGATORIO: Debes redactar en el texto del mensaje una lista numerada con 3 a 4 restaurantes emblemáticos reales (${presets.restaurants.map(r => r.name).join(', ')}) con su especialidad culinaria.
    ESTÁ ESTRICTAMENTE PROHIBIDO terminar el mensaje cortado en dos puntos ":".
    OBLIGATORIO: Mantén consistencia exacta de los nombres de los restaurantes en el texto y en las opciones.
    `
  } else if (nextMissing === 'city') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 📍 ¿A qué ciudad o lugar te gustaría ir?'
  } else if (nextMissing === 'datesSeason') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 📅 ¿En qué fechas, mes o época del año tienes planeado realizar tu viaje?'
  } else if (nextMissing === 'duration') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - ⏳ ¿Cuántos días va a durar tu tour?'
  } else if (nextMissing === 'companions') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 👥 ¿Viajarás solo, en pareja, con amigos o en familia con niños?'
  } else if (nextMissing === 'budget') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 💰 ¿Qué estilo de presupuesto tienes en mente? (Económico, Moderado, Lujo)'
  } else if (nextMissing === 'transport') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 🚗 ¿Cuál será tu medio de transporte principal durante el tour? (Auto rentado, Caminando, Transporte público, Taxi)'
  } else if (nextMissing === 'accommodationStatus') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 🏨 ¿Ya tienes hospedaje reservado o deseas que te recomendemos opciones de hotel?'
  } else {
    promptInstruction = `
    ¡YA TENEMOS TODAS LAS PREFERENCIAS COMPLETAS DE CADA PREGUNTA!
    PROHIBIDO hacer más preguntas.
    CONFIRMA alegremente la información guardada (${destName}, fechas: ${known.datesSeason || 'Por definir'}, ${known.durationDays || known.durationHours} días, ${known.companions || 'Solo'}, ${known.budget || 'Económico'}, ${known.transport || 'Auto rentado'})
    Y PREGUNTA EXPLÍCITAMENTE AL USUARIO SI YA DESEA GENERAR EL TOUR AHORA MISMO.
    Ejemplo: "¡Excelente! Ya tenemos toda tu información completa para tu viaje en ${destName} (${known.durationDays || known.durationHours} días). 🎉 ¿Deseas que generemos tu tour ahora mismo?"
    `
  }

  const systemPrompt = `Eres Tour Planner AI 🤖, el asistente virtual y motor de planificación de VibeTours.
Tu personalidad es EXTREMADAMENTE CORDIAL, CÁLIDA, EMPÁTICA Y ENTUSIASTA. Saluda amablemente al usuario y celebra sus elecciones.

OBJETIVO PRINCIPAL:
Guiar amablemente al usuario para conocer los detalles de su viaje antes de diseñar el tour perfecto.

PREFERENCIAS YA RECOPILADAS Y CONFIRMADAS HASTA EL MOMENTO:
${JSON.stringify(known, null, 2)}

REGLAS ABSOLUTAS E INVIOLABLES DE COMPORTAMIENTO:
1. SIEMPRE agradece o haz un comentario amigable sobre lo que el usuario acaba de responder.
2. REGLA DE ORO DE NO REPETICIÓN: JAMÁS, bajo ninguna circunstancia, vuelvas a preguntar una preferencia que YA APARECE en "PREFERENCIAS YA RECOPILADAS". Si una preferencia ya está recopilada, ESTÁ PROHIBIDO VOLVER A PREGUNTAR POR ELLA.
3. ${promptInstruction}

REGLAS PARA actionChips (BOTONES DE RESPUESTA RÁPIDA):
- actionChips DEBE contener de 2 a 4 OPCIONES REALES Y ÚTILES.
- JAMÁS devuelvas el texto literal "Sugerencia 1", "Sugerencia 2" o "Opción 1".

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB:\n${webSearchSummary}\n` : ''}
${backendInstruction ? `INSTRUCCIÓN DEL SISTEMA:\n${backendInstruction}\n` : ''}

IMPORTANTE: Devuelve un objeto JSON con este formato exacto:
{
  "responseMessage": "Tu mensaje amigable, ameno y cordial para el usuario.",
  "actionChips": ["Opciones útiles acorde a la pregunta actual"],
  "specificPlaces": ["Nombres exactos de lugares, atracciones o restaurantes propuestos en este mensaje"],
  "readyToBuild": false
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, ...recentHistory]
      })
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[openai] chat response OpenAI API non-200 status:', response.status, errText)
      return {
        responseMessage: '¡Hola! Con mucho gusto te ayudo a planear tu viaje. ¿A qué ciudad o lugar te gustaría viajar?',
        actionChips: getDefaultActionChips(known, lastUserMsg),
        destinationSuggestions: (!hasCity && nextMissing === 'city') ? await buildVisualDestinationSuggestions(getDefaultActionChips(known, lastUserMsg)).catch(() => []) : [],
        readyToBuild: false
      }
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content ?? '{}'
    const parsed = safeParseJson(content, {
      responseMessage: '¡Excelente! Cuéntame más sobre tu viaje para diseñar el tour ideal.',
      actionChips: getDefaultActionChips(known, lastUserMsg),
      specificPlaces: [],
      readyToBuild: false
    })

    let chips = Array.isArray(parsed.actionChips) ? parsed.actionChips : []
    const hasGenericChips = chips.some(c => typeof c === 'string' && /sugerencia|opcion|opción/i.test(c))
    
    // Forzar actionChips adecuados a la pregunta faltante actual
    if (chips.length === 0 || hasGenericChips || (nextMissing !== 'city' && chips.some(c => typeof c === 'string' && /cartagena|medellín|bogotá|roma/i.test(c.toLowerCase())))) {
      chips = getDefaultActionChips(known, lastUserMsg)
    }
    parsed.actionChips = chips

    if (isAskingHotelInfo) {
      const msg = String(parsed.responseMessage || '').trim()
      if (msg.length < 80 || msg.toLowerCase().startsWith('¡excelente!')) {
        let matchedHotel = presets.hotels.find(h => new RegExp(h.name.replace(/hotel\s+|boutique\s+/gi, '').trim(), 'i').test(lastUserMsg))
        if (!matchedHotel) matchedHotel = presets.hotels[0]

        parsed.responseMessage = `¡Con mucho gusto! Aquí tienes todos los detalles del **${matchedHotel.name}** en ${destName}: 🏨✨\n\n` +
          `• 📍 **Ubicación y Estilo**: ${matchedHotel.desc}\n` +
          `• 🏊 **Instalaciones y Servicios**: Desayuno gourmet incluido, Wi-Fi de alta velocidad, aire acondicionado y recepción 24 horas.\n` +
          `• 💰 **Tarifa estimada**: ${matchedHotel.price}.\n\n` +
          `¿Te gustaría confirmar el ${matchedHotel.name} como tu hospedaje o prefieres ver otra opción?`
        parsed.actionChips = [`✅ Elegir ${matchedHotel.name}`, '🏨 Ver otras opciones de hotel', '🎯 Sugerir actividades']
      }
    }

    const isAskingHotel = hasCity && !known.selectedHotel && !isAskingHotelInfo && /\b(hotel|hoteles|alojamiento|hospedaje|opciones de hotel|opciones de hospedaje|buscar hotel|buscar hospedaje|recomi[eé]ndame hoteles)\b/i.test(lastUserMsg)
    if (isAskingHotel) {
      const msg = String(parsed.responseMessage || '').trim()
      const isCutOffOrEmpty = msg.endsWith(':') || (!msg.includes('1.') && !msg.includes('2.'))
      if (isCutOffOrEmpty) {
        parsed.responseMessage = `¡Qué emoción que busques opciones de hospedaje en ${destName}! 🎉 Aquí te dejo tres excelentes recomendaciones adaptadas a tu presupuesto (${known.budget || 'Moderado'}):\n\n` +
          presets.hotels.map((h, i) => `${i + 1}. **${h.name}**: ${h.desc}`).join('\n') +
          `\n\n¿Cuál de estos te gustaría elegir como tu hospedaje?`
        parsed.actionChips = presets.hotels.map(h => h.name)
      }
    }

    if (isAskingRestaurants) {
      const msg = String(parsed.responseMessage || '').trim()
      const isCutOffOrEmpty = msg.endsWith(':') || (!msg.includes('1.') && !msg.includes('2.'))
      if (isCutOffOrEmpty) {
        parsed.responseMessage = `¡Perfecto! Aquí tienes las mejores recomendaciones gastronómicas en ${destName} que no te puedes perder! 🍽️✨\n\n` +
          presets.restaurants.map((r, i) => `${i + 1}. **${r.name}**: ${r.specialty}.`).join('\n') +
          `\n\n¿Te gustaría incluir estas opciones gastronómicas en tu itinerario?`
        parsed.actionChips = ['➕ Agregar 1 restaurante por día', '📋 Ver menús', `🚀 Generar tour en ${destName}`]
        parsed.specificPlaces = presets.restaurants.map(r => r.name)
      }
    }

    if (isAskingMenus) {
      parsed.responseMessage = `¡Aquí tienes los platos y especialidades destacadas de los restaurantes recomendados en ${destName}! 🍲✨\n\n` +
        presets.restaurants.map(r => `• **${r.name.replace(/^Restaurante\s+/i, '')}**: ${r.specialty}.`).join('\n') +
        `\n\n¿Deseas agregar estos restaurantes a los días de tu tour o consultar actividades?`
      parsed.actionChips = ['➕ Agregar 1 restaurante por día', '🎯 Sugerir actividades', `🚀 Generar tour en ${destName}`]
    }

    const isAskingSpecificDay = hasCity && /\b(detalles del d[íi]a\s*(\d+)|ver detalles del d[íi]a\s*(\d+)|ver d[íi]a\s*(\d+)|d[íi]a\s*(\d+))\b/i.test(lastUserMsg)
    if (isAskingSpecificDay) {
      const match = lastUserMsg.match(/\b(d[íi]a\s*(\d+)|detalles\s+del\s+d[íi]a\s*(\d+))\b/i)
      const dayNum = parseInt(match?.[2] || match?.[3] || '1', 10)
      const hotel = known.selectedHotel?.name || known.selectedHotel || presets.hotels[0].name
      const rawPlaces = Array.isArray(known.specificPlaces) ? known.specificPlaces.filter(p => !/restaurante por d[íi]a|hotel/i.test(p)) : []
      const acts = rawPlaces.filter(p => !/restaurante|cevicheria|celele|boliche|mulata|bistr[oó]|trattoria|boulangerie|izakaya|bar/i.test(p))
      const rests = rawPlaces.filter(p => /restaurante|cevicheria|celele|boliche|mulata|bistr[oó]|trattoria|boulangerie|izakaya|bar/i.test(p))

      const poolActs = acts.length >= 2 ? acts : presets.places
      const poolRests = rests.length >= 2 ? rests : presets.restaurants.map(r => r.name)

      let dayContent = ''
      if (dayNum === 1) {
        dayContent = `**Detalles del Día 1 en ${destName}:** ☀️🏛️\n\n` +
          `• 🏨 **Alojamiento / Punto de partida**: ${hotel}\n` +
          `• 🌅 **09:00 AM - Mañana**: Visita a ${poolActs[0] || presets.places[0]}\n` +
          `• 🍽️ **12:30 PM - Almuerzo**: ${poolRests[0] || presets.restaurants[0]?.name}\n` +
          `• 🌇 **03:30 PM - Tarde**: ${poolActs[2] || poolActs[1] || presets.places[2] || 'Recorrido cultural'}\n` +
          `• 🌙 **07:30 PM - Noche**: Cena y recorrido nocturno\n\n`
      } else if (dayNum === 2) {
        dayContent = `**Detalles del Día 2 en ${destName}:** 🏝️🌊\n\n` +
          `• 🏨 **Alojamiento**: ${hotel}\n` +
          `• 🌅 **08:30 AM - Mañana / Tarde**: ${poolActs[1] || presets.places[1]}\n` +
          `• 🍽️ **01:00 PM - Almuerzo**: ${poolRests[1] || presets.restaurants[1]?.name}\n` +
          `• 🌇 **04:30 PM - Tarde**: ${poolActs[3] || poolActs[2] || presets.places[3] || 'Paseo panorámico'}\n` +
          `• 🌙 **08:00 PM - Noche**: Cena en ${poolRests[2] || presets.restaurants[2]?.name}\n\n`
      } else {
        dayContent = `**Detalles del Día 3 en ${destName}:** 🌄✨\n\n` +
          `• 🏨 **Alojamiento**: ${hotel}\n` +
          `• 🌅 **09:00 AM - Mañana**: Visita panorámica a ${poolActs[4] || presets.places[4] || presets.places[0]}\n` +
          `• 🍽️ **12:30 PM - Almuerzo**: ${poolRests[3] || poolRests[0] || presets.restaurants[0]?.name}\n` +
          `• 🌇 **03:00 PM - Tarde**: ${poolActs[5] || presets.places[5] || 'Recorrido cultural y compras'}\n` +
          `• 🌙 **07:00 PM - Noche**: Cena de despedida y paseo nocturno\n\n`
      }
      dayContent += `¿Te gustaría generar el tour completo o ver otro día?`
      parsed.responseMessage = dayContent
      parsed.actionChips = [`🚀 Generar tour en ${destName}`, '📋 Ver itinerario completo', '✏️ Modificar este día']
    } else if (isAskingItineraryStatus) {
      const msg = String(parsed.responseMessage || '').trim()
      const isThreeDays = known.durationDays === 3 || (known.durationHours && known.durationHours >= 72)
      const lacksDays = !msg.includes('Día 1') && !msg.includes('Dia 1')
      const lacksDay3 = isThreeDays && (!msg.includes('Día 3') && !msg.includes('Dia 3'))
      
      if (lacksDays || lacksDay3 || msg.endsWith(':') || msg.length < 150) {
        const hotel = known.selectedHotel?.name || known.selectedHotel || presets.hotels[0].name
        const rawPlaces = Array.isArray(known.specificPlaces) ? known.specificPlaces.filter(p => !/restaurante por d[íi]a|hotel/i.test(p)) : []
        const acts = rawPlaces.filter(p => !/restaurante|cevicheria|celele|boliche|mulata|bistr[oó]|trattoria|boulangerie|izakaya|bar/i.test(p))
        const rests = rawPlaces.filter(p => /restaurante|cevicheria|celele|boliche|mulata|bistr[oó]|trattoria|boulangerie|izakaya|bar/i.test(p))

        const distinctActs = Array.from(new Set(acts))
        for (const def of presets.places) {
          if (!distinctActs.some(a => a.toLowerCase().includes(def.toLowerCase()) || def.toLowerCase().includes(a.toLowerCase()))) {
            distinctActs.push(def)
          }
        }

        const distinctRests = Array.from(new Set(rests))
        for (const def of presets.restaurants.map(r => r.name)) {
          if (!distinctRests.some(r => r.toLowerCase().includes(def.toLowerCase()) || def.toLowerCase().includes(r.toLowerCase()))) {
            distinctRests.push(def)
          }
        }

        const act1 = distinctActs[0] || presets.places[0]
        const act2 = distinctActs[1] || presets.places[1]
        const act3 = distinctActs[2] || presets.places[2]
        const act4 = distinctActs[3] || presets.places[3] || presets.places[0]
        const act5 = distinctActs[4] || presets.places[4] || presets.places[1]
        const act6 = distinctActs[5] || presets.places[5] || presets.places[2]

        const rest1 = distinctRests[0] || presets.restaurants[0]?.name
        const rest2 = distinctRests[1] || presets.restaurants[1]?.name
        const rest3 = distinctRests[2] || presets.restaurants[2]?.name
        const rest4 = distinctRests[3] || presets.restaurants[3]?.name || presets.restaurants[0]?.name
        
        let fullItinerary = `¡Aquí tienes tu itinerario detallado día a día para tu viaje en ${destName}! 🗺️✨\n\n` +
          `**Día 1:**\n` +
          `- 🏨 **Alojamiento / Punto de partida**: ${hotel}\n` +
          `- 🌅 **Mañana**: Visita a ${act1}\n` +
          `- 🍽️ **Almuerzo**: ${rest1}\n` +
          `- 🌇 **Tarde**: ${act3}\n` +
          `- 🌙 **Noche / Cena**: Experiencia gastronómica y vida nocturna\n\n` +
          `**Día 2:**\n` +
          `- 🏨 **Alojamiento**: ${hotel}\n` +
          `- 🌅 **Mañana / Tarde**: ${act2}\n` +
          `- 🍽️ **Almuerzo**: ${rest2}\n` +
          `- 🌇 **Tarde**: ${act4}\n` +
          `- 🌙 **Noche / Cena**: ${rest3}\n\n`
        
        if (isThreeDays) {
          fullItinerary += `**Día 3:**\n` +
            `- 🏨 **Alojamiento**: ${hotel}\n` +
            `- 🌅 **Mañana**: Recorrido panorámico y visita a ${act5}\n` +
            `- 🍽️ **Almuerzo**: ${rest4}\n` +
            `- 🌇 **Tarde**: ${act6}\n` +
            `- 🌙 **Noche / Cena**: Cena de despedida y paseo nocturno al atardecer\n\n`
        }

        fullItinerary += `¿Deseas generar el tour definitivo o modificar algún detalle?`
        parsed.responseMessage = fullItinerary
        parsed.actionChips = [`🚀 Generar tour en ${destName}`, '✏️ Modificar algún día', '➕ Agregar otra actividad']
      }
    }

    // REGLA ESTRICTA DE INTENCIÓN DE GENERACIÓN: Si el usuario solicitó generar o finalizar el tour
    const userExplicitBuildIntent = /\b(genera(r)?(\s+el)?\s+(tour|itinerario)|crea(r)?(\s+el)?\s+(tour|itinerario)|arma(r)?(\s+el)?\s+(tour|itinerario)|haz(\s+el)?\s+(tour|itinerario)|construir\s+(el\s+)?(tour|itinerario)|finalizar|comenzar(\s+el)?\s+tour|empezar(\s+el)?\s+tour|listo genera|s[íi],?\s*genera|s[íi],?\s*arma|cr[eé]alo|h[aá]zlo|[aá]rmalo|generar\s+ahora|genera\s+ahora|confirmar tour|confirmar itinerario)\b/i.test(lastUserMsg)
    if (userExplicitBuildIntent) {
      parsed.readyToBuild = true
      parsed.actionChips = []
      parsed.destinationSuggestions = []
    } else {
      parsed.readyToBuild = false
      parsed.destinationSuggestions = (!hasCity && nextMissing === 'city')
        ? await buildVisualDestinationSuggestions(chips).catch(() => [])
        : []
    }

    if (!hasCity || nextMissing === 'city') {
      parsed.specificPlaces = []
    }

    if (!hasCity && nextMissing === 'city') {
      parsed.destinationSuggestions = await buildVisualDestinationSuggestions(chips, '')
    } else if (nextMissing === 'accommodationStatus' && !known.accommodationStatus && !isAskingHotel) {
      parsed.destinationSuggestions = [
        {
          name: 'Recomiéndame hoteles',
          city: 'Opciones de Hotel',
          country: 'Hospedaje',
          countryCode: 'HOTEL',
          flagEmoji: '🏨',
          description: 'Te recomendaremos las mejores opciones de hoteles cómodos según tu presupuesto.',
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=75',
          suggestedDays: 3,
          temperature: '28°C'
        },
        {
          name: 'Tengo mi propio hospedaje',
          city: 'Alojamiento Propio',
          country: 'Hospedaje',
          countryCode: 'HOME',
          flagEmoji: '🏠',
          description: 'Utilizarás tu propio hospedaje o alojamiento reservado para el tour.',
          imageUrl: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=75',
          suggestedDays: 3,
          temperature: '28°C'
        }
      ]
    } else {
      parsed.destinationSuggestions = []
    }

    return parsed
  } catch (err) {
    console.error('[openai] chat response error:', err)
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    const fallbackSuggs = (!hasCity && nextMissing === 'city') ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : []
    return {
      responseMessage: '¡Hola! Es un placer saludarte. Cuéntame, ¿a qué ciudad te gustaría viajar hoy?',
      actionChips: fallbackChips,
      destinationSuggestions: fallbackSuggs,
      readyToBuild: false
    }
  }
}

export async function buildVisualDestinationSuggestions(cityList = [], defaultCity = '') {
  const nonCityKeywords = /🚀|✏️|🌟|➕|🍽️|🏨|🎉|🎯|generar|arma|armar|cambiar|detalle|opción|opcion|sugerencia|tour|restaurante|restaurantes|evento|eventos|concierto|conciertos|festival|festivales|actividad|actividades|hospedaje|alojamiento|hotel|hoteles|comida|gastronom/i

  const filteredList = cityList.filter(c => {
    if (typeof c !== 'string') return false
    const clean = c.trim().toLowerCase()
    if (clean.length < 2) return false
    if (nonCityKeywords.test(clean)) return false
    return true
  })

  if (filteredList.length === 0) return []

  const cityData = {
    'tulum': { name: 'Tulum, México', city: 'Tulum', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Ruinas mayas sobre acantilados, cenotes cristalinos y playas paradisíacas de arena blanca.', imageUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '30°C', isDemoImage: false },
    'miami': { name: 'Miami, EE. UU.', city: 'Miami', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'South Beach, Ocean Drive, rascacielos modernos frente a la bahía y vida nocturna vibrante.', imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '28°C', isDemoImage: false },
    'barcelona': { name: 'Barcelona, España', city: 'Barcelona', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'La Sagrada Familia de Gaudí, el Park Güell y la vibrante Playa de la Barceloneta.', imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '25°C', isDemoImage: false },
    'cancún': { name: 'Cancún, México', city: 'Cancún', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Aguas turquesas del Caribe, playas de arena blanca y zonas de aventura y descanso.', imageUrl: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '31°C', isDemoImage: false },
    'cancun': { name: 'Cancún, México', city: 'Cancún', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Aguas turquesas del Caribe, playas de arena blanca y zonas de aventura y descanso.', imageUrl: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '31°C', isDemoImage: false },
    'roma': { name: 'Roma, Italia', city: 'Roma', country: 'Italia', countryCode: 'IT', flagEmoji: '🇮🇹', description: 'El Coliseo Romano, la Fontana di Trevi y plazas históricas llenas de encanto y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '26°C', isDemoImage: false },
    'tokio': { name: 'Tokio, Japón', city: 'Tokio', country: 'Japón', countryCode: 'JP', flagEmoji: '🇯🇵', description: 'Metrópolis futurista que combina rascacielos de neón con templos tradicionales y jardines zen.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '22°C', isDemoImage: false },
    'tokyo': { name: 'Tokio, Japón', city: 'Tokio', country: 'Japón', countryCode: 'JP', flagEmoji: '🇯🇵', description: 'Metrópolis futurista que combina rascacielos de neón con templos tradicionales y jardines zen.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '22°C', isDemoImage: false },
    'parís': { name: 'París, Francia', city: 'París', country: 'Francia', countryCode: 'FR', flagEmoji: '🇫🇷', description: 'La Torre Eiffel, el Museo del Louvre y paseos románticos por el río Sena.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'paris': { name: 'París, Francia', city: 'París', country: 'Francia', countryCode: 'FR', flagEmoji: '🇫🇷', description: 'La Torre Eiffel, el Museo del Louvre y paseos románticos por el río Sena.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'madrid': { name: 'Madrid, España', city: 'Madrid', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'La Gran Vía, el Palacio Real y museos de arte de primer nivel como El Prado.', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'bali': { name: 'Bali, Indonesia', city: 'Bali', country: 'Indonesia', countryCode: 'ID', flagEmoji: '🇮🇩', description: 'Templos sagrados frente al mar, arrozales verdes y playas tropicales para el relax.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '30°C', isDemoImage: false },
    'rio de janeiro': { name: 'Rio de Janeiro, Brasil', city: 'Rio de Janeiro', country: 'Brasil', countryCode: 'BR', flagEmoji: '🇧🇷', description: 'El Cristo Redentor, el Pan de Azúcar y las playas legendarias de Copacabana e Ipanema.', imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '29°C', isDemoImage: false },
    'nueva york': { name: 'Nueva York, EE. UU.', city: 'Nueva York', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'El skyline de Manhattan, Central Park, Broadway y los miradores más famosos del mundo.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'new york': { name: 'Nueva York, EE. UU.', city: 'Nueva York', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'El skyline de Manhattan, Central Park, Broadway y los miradores más famosos del mundo.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'londres': { name: 'Londres, Reino Unido', city: 'Londres', country: 'Reino Unido', countryCode: 'GB', flagEmoji: '🇬🇧', description: 'El Big Ben, el London Eye, palacios reales y museos de talla mundial.', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '19°C', isDemoImage: false },
    'london': { name: 'Londres, Reino Unido', city: 'Londres', country: 'Reino Unido', countryCode: 'GB', flagEmoji: '🇬🇧', description: 'El Big Ben, el London Eye, palacios reales y museos de talla mundial.', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '19°C', isDemoImage: false },
    'cusco': { name: 'Cusco, Perú', city: 'Cusco', country: 'Perú', countryCode: 'PE', flagEmoji: '🇵🇪', description: 'Capital del imperio Inca, puerta de entrada a Machu Picchu y plazas coloniales andinas.', imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '18°C', isDemoImage: false },
    'cartagena': { name: 'Cartagena, Colombia', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Ciudad amurallada del Caribe con encanto colonial, playas y ambiente vibrante.', imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '30°C', isDemoImage: false },
    'santa marta': { name: 'Santa Marta, Colombia', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Puerta de entrada al Parque Tayrona con playas vírgenes, Sierra Nevada y bahías tranquilas.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '29°C', isDemoImage: false },
    'taganga': { name: 'Taganga, Colombia', city: 'Taganga', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Pueblo tradicional de pescadores en una hermosa bahía con atardeceres mágicos y buceo.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80', suggestedDays: 2, temperature: '30°C', isDemoImage: false },
    'minca': { name: 'Minca, Colombia', city: 'Minca', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital ecológica de la Sierra Nevada con cascadas cristalinas, avistamiento de aves y café artesanal.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', suggestedDays: 2, temperature: '22°C', isDemoImage: false },
    'parque tayrona': { name: 'Parque Tayrona, Colombia', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Playas paradisíacas de arena dorada rodeadas de exuberante selva tropical y senderos naturales.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80', suggestedDays: 2, temperature: '29°C', isDemoImage: false },
    'medellín': { name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'La ciudad de la eterna primavera con parques ecológicos, cultura y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'medellin': { name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'La ciudad de la eterna primavera con parques ecológicos, cultura y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'san andrés': { name: 'San Andrés, Colombia', city: 'San Andrés', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Isla del mar de los siete colores, perfecta para snorkel, relax y descanso en familia.', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '29°C', isDemoImage: false },
    'bogotá': { name: 'Bogotá, Colombia', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital cultural con arquitectura histórica en La Candelaria y museos de oro.', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '18°C', isDemoImage: false },
    'bogota': { name: 'Bogotá, Colombia', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital cultural con arquitectura histórica en La Candelaria y museos de oro.', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '18°C', isDemoImage: false },
    'villa de leyva': { name: 'Villa de Leyva, Colombia', city: 'Villa de Leyva', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Pueblo colonial con la plaza empedrada más grande de Sudamérica y viñedos.', imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80', suggestedDays: 2, temperature: '19°C', isDemoImage: false },
    'eje cafetero': { name: 'Eje Cafetero, Colombia', city: 'Eje Cafetero', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Paisajes de cafetales, el Valle del Cocora con sus palmas de cera gigantes y pueblos coloridos.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '23°C', isDemoImage: false },
    'san gil': { name: 'San Gil, Colombia', city: 'San Gil', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital del turismo de aventura con rafting en el río Fonce y senderos ecológicos.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '26°C', isDemoImage: false }
  }

  const result = await Promise.all(
    filteredList.map(async (rawName) => {
      const placeName = String(rawName || '').trim()
      if (!placeName) return null

      // Extraer nombre base de ciudad (ej. "Tulum, México" -> "tulum", "Miami, EE. UU." -> "miami")
      const baseCity = placeName.split(',')[0].trim().toLowerCase()
      const fullKey = placeName.toLowerCase().trim()

      if (cityData[baseCity]) {
        return cityData[baseCity]
      }
      if (cityData[fullKey]) {
        return cityData[fullKey]
      }

      // Consulta dinámica en cascada filtrando banderas/escudos
      try {
        const imgResult = await imageForPlaceWithStatus(`${baseCity} skyline landmark travel`, defaultCity, 'tourism', 0)
        const isDemo = Boolean(imgResult.isFallback)
        const coverUrl = isDemo ? destinationCoverImage(baseCity) : imgResult.url

        return {
          name: placeName,
          city: baseCity.charAt(0).toUpperCase() + baseCity.slice(1),
          country: 'Destino Destacado',
          countryCode: 'DESTINO',
          flagEmoji: '📍',
          description: `Descubre los mejores lugares emblemáticos y experiencias turísticas en ${placeName}.`,
          imageUrl: coverUrl,
          suggestedDays: 4,
          temperature: '26°C',
          isDemoImage: false
        }
      } catch (err) {
        console.error('[openai] Error buscando imagen para', placeName, err)
        return {
          name: placeName,
          city: placeName,
          country: 'Destino Destacado',
          countryCode: 'DESTINO',
          flagEmoji: '📍',
          description: `Descubre los mejores lugares y experiencias turísticas en ${placeName}.`,
          imageUrl: destinationCoverImage(baseCity),
          suggestedDays: 4,
          temperature: '25°C',
          isDemoImage: false
        }
      }
    })
  )

  return result.filter(Boolean)
}

/**
 * Suggest 3 real, physical tourist attractions/POIs for destinations where
 * traditional maps (Overpass/Photon) do not yield enough candidates.
 */
export async function suggestFallbackPlacesWithOpenAI({ destination, city, country, type, excludeNames = [], canonicalDestination }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[suggestFallbackPlacesWithOpenAI] OPENAI_API_KEY is not configured')
    return null
  }

  const targetLocation = canonicalDestination?.displayName || `${destination || ''} ${city || ''} ${country || ''}`.trim()
  const excludedText = excludeNames.length > 0 ? `\nCRITICAL: Do NOT suggest any of these places as they are already included or excluded: ${excludeNames.join(', ')}.` : ''

  const systemPrompt = `You are a world-class travel and geography expert. The user wants to plan a "${type}" tour in "${targetLocation}".
Unfortunately, the local geographic database does not return enough landmarks or places for this location.
You must suggest exactly 3 real, physically existing points of interest (POIs), tourist attractions, viewpoints, museums, monuments, plazas, parks, or iconic local spots that actually exist in or very close to "${targetLocation}".
Return ONLY a valid JSON object matching this exact schema:
{
  "places": [
    {
      "name": "Real name of the place of interest",
      "type": "place type (e.g. museum, historic, viewpoint, nature, restaurant, cafe, market, nightlife, family)",
      "category": "place category (e.g. museum, historic, viewpoint, nature, restaurant, cafe, market, nightlife, family)",
      "description": "A very brief explanation of why this spot is worth visiting."
    }
  ]
}
CRITICAL: Do NOT invent or hallucinate places that do not exist in real life. Ensure they are physically located in or immediately adjacent to ${targetLocation}. Do NOT suggest places from another country or city.${excludedText}`

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Suggest 3 real places for "${targetLocation}"` }
        ]
      })
    })

    if (response.ok) {
      const json = await response.json()
      const content = JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
      if (Array.isArray(content.places) && content.places.length > 0) {
        return content.places.slice(0, 5)
      }
    } else {
      console.warn('[suggestFallbackPlacesWithOpenAI] OpenAI responded with non-ok status:', response.status)
    }
  } catch (err) {
    console.error('[suggestFallbackPlacesWithOpenAI] Error calling OpenAI API:', err.message)
  }
  return null
}

const landmarkCache = new GeoCache(24 * 60 * 60 * 1000, 300)

export async function fetchCityIconicLandmarks({ destination, city, country, type = 'cultural', interests = [], prompt = '', durationHours = 24 }) {
  const targetCity = city || destination || ''
  const targetCountry = country || ''
  if (!targetCity) return []

  const count = (durationHours && Number(durationHours) >= 48) ? 25 : 18
  const cacheKey = `landmarks_${targetCity.toLowerCase().trim()}_${targetCountry.toLowerCase().trim()}_${type}_${count}`
  const cached = landmarkCache.get(cacheKey)
  if (cached) return cached

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[fetchCityIconicLandmarks] OPENAI_API_KEY is not configured')
    return []
  }

  const systemPrompt = `Eres un experto mundial en geografía, viajes y turismo.
El usuario quiere conocer la ciudad o destino "${targetCity}"${targetCountry ? ` ubicado en "${targetCountry}"` : ''}.
Tu objetivo es listar las ${count} atracciones e hitos turísticos MÁS FAMOSOS, EMBLEMÁTICOS, ICÓNICOS, CULTURALES, RECREATIVOS Y DE ENTRETENIMIENTO que existen físicamente en "${targetCity}" y sus inmediaciones inmediatas.

REGLAS CRÍTICAS DE CALIDAD TURÍSTICA:
1. Incluye únicamente verdaderos puntos de interés turístico: monumentos célebres, malecones, plazas icónicas, miradores, museos principales, ecoparques, estadios deportivos destacados, teatros, centros comerciales emblemáticos de entretenimiento y paseos peatonales famosos.
2. PROHIBIDO ABSOLUTAMENTE incluir: nombres genéricos como "Parada 1", "Parada 2", o zonas francas, empresas o fábricas.
3. Cada hito debe tener su NOMBRE REAL Y EXACTO en la vida real.

Devuelve ÚNICAMENTE un objeto JSON válido con este esquema:
{
  "landmarks": [
    {
      "name": "Nombre real y exacto del hito o lugar turístico",
      "type": "tipo (ej. monument, viewpoint, park, museum, stadium, mall, historic, beach, market)",
      "category": "categoría (ej. historic, nature, viewpoint, sports, museum, entertainment, market)",
      "description": "Una breve frase explicando por qué es emblemático e imperdible en esta ciudad."
    }
  ]
}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
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
          { role: 'user', content: `List ${count} distinct real iconic tourist landmarks for "${targetCity}, ${targetCountry}"` }
        ]
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (response.ok) {
      const json = await response.json()
      const content = JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
      if (Array.isArray(content.landmarks) && content.landmarks.length > 0) {
        landmarkCache.set(cacheKey, content.landmarks)
        return content.landmarks
      }
    }
  } catch (err) {
    console.error('[fetchCityIconicLandmarks] Error fetching landmarks:', err.message)
  }

  return []
}

const reasonCache = new GeoCache(24 * 60 * 60 * 1000, 500)

export async function generateCustomPlaceReasons({ destination = '', city = '', prompt = '', places = [] }) {
  if (!Array.isArray(places) || places.length === 0) return {}

  const targetCity = city || destination || 'Destino'
  const apiKey = process.env.OPENAI_API_KEY
  
  const result = {}
  const missingPlaces = []

  for (const place of places) {
    const pName = typeof place === 'string' ? place : place?.name
    if (!pName) continue
    const cacheKey = `reason_${targetCity.toLowerCase().trim()}_${pName.toLowerCase().trim()}`
    const cached = reasonCache.get(cacheKey)
    if (cached) {
      result[pName] = cached
    } else {
      missingPlaces.push(pName)
    }
  }

  if (missingPlaces.length === 0 || !apiKey) {
    return result
  }

  const systemPrompt = `Eres un guía turístico experto en geografía mundial.
El usuario realiza un viaje en "${targetCity}" hacia "${destination || targetCity}".
Se te da una lista de lugares turísticos específicos.

TU TAREA:
Para CADA lugar de la lista, escribe una breve frase explicativa (15 a 25 palabras) que sea 100% ÚNICA, FASCINANTE y ESPECÍFICA sobre ESE monumento o hito físico.

REGLAS OBLIGATORIAS:
1. Explica qué hace único a ESE lugar físico en particular (su historia real, arquitectura, ambiente, mar, vistas o sazón).
2. PROHIBIDO ABSOLUTAMENTE usar frases genéricas de relleno como "Una parada estratégica...", "Aporta variedad visual...", "Un sitio de gran relevancia...".
3. Aunque haya varias iglesias, varios parques o varias playas, CADA EXPLICACIÓN DEBE SER 100% DIFERENTE Y ESPECÍFICA para ese lugar exacto.

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "reasons": {
    "Nombre del Lugar 1": "Frase única y fascinante específica sobre este lugar.",
    "Nombre del Lugar 2": "Frase única y fascinante específica sobre este lugar."
  }
}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
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
          { role: 'user', content: `Lugares en ${targetCity}: ${JSON.stringify(missingPlaces)}` }
        ]
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (response.ok) {
      const json = await response.json()
      const content = JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
      const reasons = content.reasons || {}
      for (const [pName, reasonText] of Object.entries(reasons)) {
        if (typeof reasonText === 'string' && reasonText.trim().length > 10) {
          const cacheKey = `reason_${targetCity.toLowerCase().trim()}_${pName.toLowerCase().trim()}`
          reasonCache.set(cacheKey, reasonText.trim())
          result[pName] = reasonText.trim()
        }
      }
    }
  } catch (err) {
    console.warn('[generateCustomPlaceReasons] OpenAI fetch error:', err.message)
  }

  return result
}


