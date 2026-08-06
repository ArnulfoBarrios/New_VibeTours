import { GeoCache } from './geoCache.js'
import { imageForPlaceWithStatus } from './imageSearch.js'

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
  let system = `Eres TourSync AI, una inteligencia artificial de lujo especializada exclusivamente en crear tours turisticos vibrantes, atractivos y altamente personalizados.

Tu respuesta debe ser siempre un unico objeto JSON valido. No agregues markdown, comentarios, etiquetas, explicaciones ni texto fuera del JSON.

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
- CRÍTICO GUÍA DE VOZ INMERSIVA: Cada descripción de parada ("descripcion") DEBE ser una guía de voz completa y envolvente de 80 a 120 palabras. Escribe como si fueras un guía local experto hablando en vivo al oído del turista. Narra la historia fascinante del sitio, los detalles arquitectónicos o naturales que tiene enfrente, anécdotas culturales únicas y sugerencias de 'Qué hacer o qué probar aquí'.
- CRÍTICO CADA PARADA ES ÚNICA: PROHIBIDO copiar y pegar descripciones o consejos genéricos.
- El array de salida "itinerario" debe tener EXACTAMENTE la misma longitud que la lista de lugares seleccionados (selectedPlaces) que recibes.`

  if (selectedHotel && selectedHotel.name) {
    system += `\n- CRÍTICO: El turista se hospedará o iniciará en el hotel: "${selectedHotel.name}". El "punto_encuentro" (meetingPoint) del tour DEBE ser obligatoriamente este hotel y debes integrarlo de manera relevante al inicio del itinerario.`
  }

  system += `\n- CRÍTICO RUTA CON INICIO Y FIN: Si el usuario especificó un punto de partida y un punto de llegada, la Parada 1 del itinerario DEBE ser el punto de partida especificado y la última Parada DEBE ser el destino final especificado. Las paradas intermedias deben integrarse de forma fluida de camino hacia la meta final.`
  system += `\n- CRÍTICO TOUR MULTICIUDAD / MULTIDÍA: Si el tour abarca más de una ciudad o recorrido de carretera interurbana, las paradas seleccionadas están ordenadas estrictamente desde la ciudad de origen hacia la ciudad de destino. Narra el itinerario respetando esta secuencia progresiva sin hacer retrocesos geográficos ni saltos anacrónicos. Organiza el itinerario dividiendo las paradas de manera equilibrada por días y en los trayectos entre ciudades, detalla las instrucciones del viaje intermunicipal.`

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
      "dia": 1,
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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return extractChatInformationFallback(userMessage)

  const recentHistoryText = (history || []).slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')

  const prompt = `Analiza el último mensaje del usuario Y el historial de conversación reciente para identificar las preferencias turísticas y atracciones mencionadas/aceptadas.
Devuelve ÚNICAMENTE un objeto JSON válido con los campos que logres identificar (mantén los campos no mencionados como null).

CAMPOS Y REGLAS DE INTERPRETACIÓN:
1. "destination" / "city": Nombre de la ciudad o lugar de destino. SI es una región o frase vaga ("Playa en el Caribe", "Montaña", "Europa"), asígnala a "destination" pero mantén "city" como null.
2. "datesSeason": Fechas, mes o época del viaje.
3. "durationDays" (número): Días de duración del tour.
4. "companions": "Solo", "Pareja", "Familia con niños", "Amigos", "Grupo".
5. "hasChildren" (boolean): true si viaja con niños.
6. "budget": "Económico", "Moderado", "Lujo".
7. "transport": "Caminando", "Transporte público", "Auto rentado", "Taxi/Uber".
8. "accommodationStatus": "Ya posee hospedaje", "Quiere buscar hospedaje".
9. "specificPlaces" (array de strings): Nombres de atracciones o lugares específicos que el usuario quiere visitar O que la IA recomendó en los mensajes recientes y el usuario aceptó/interesó (ej: ["Parque Xcaret", "Cenote Dos Ojos", "Isla Cozumel", "Tulum"]).
10. "interests" (array de strings): Intereses.

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
      return extractChatInformationFallback(userMessage)
    }

    const json = await response.json()
    const parsed = safeParseJson(json.choices?.[0]?.message?.content ?? '{}', {})

    // Limpiar claves nulas o vacías extraídas para evitar sobreescribir las preferencias previas en el acumulado
    Object.keys(parsed).forEach(key => {
      if (parsed[key] === null || parsed[key] === undefined || parsed[key] === '') {
        delete parsed[key]
      }
    })

    // Normalización de duración en horas si se extrajo en días
    if (typeof parsed.durationDays === 'number' && parsed.durationDays > 0) {
      parsed.durationHours = parsed.durationDays >= 2 ? parsed.durationDays * 24 : 8
    }

    if (parsed.companions === 'Familia con niños') {
      parsed.hasChildren = true
    }

    return parsed
  } catch (err) {
    console.error('[openai] extract error:', err)
    return extractChatInformationFallback(userMessage)
  }
}

export function extractChatInformationFallback(prompt) {
  if (!prompt || typeof prompt !== 'string') return {}
  const lower = prompt.toLowerCase()
  const result = {}

  if (/\b(fin de semana con puente|puente festivo|fin de semana largo)\b/i.test(lower)) {
    result.durationDays = 3
    result.durationHours = 72
  } else if (/\b(fin de semana|un par de d[íi]as)\b/i.test(lower)) {
    result.durationDays = 2
    result.durationHours = 48
  } else if (/\b(semanita|una semana)\b/i.test(lower)) {
    result.durationDays = 7
    result.durationHours = 168
  }

  if (/\b(ni[ñn]o|ni[ñn]as|hijo|hijas|bebe|familia)\b/i.test(lower)) {
    result.companions = 'Familia con niños'
    result.hasChildren = true
  } else if (/\b(pareja|esposo|esposa|novio|novia)\b/i.test(lower)) {
    result.companions = 'Pareja'
  } else if (/\b(amigos|parceros|panas|grupo)\b/i.test(lower)) {
    result.companions = 'Amigos'
  } else if (/\b(solo|conmigo)\b/i.test(lower)) {
    result.companions = 'Solo'
  }

  if (/\b(ahorrar|econ[oó]mico|barato|poco presupuesto)\b/i.test(lower)) {
    result.budget = 'Económico'
  } else if (/\b(lujo|sin escatimar|5 estrellas|cinco estrellas)\b/i.test(lower)) {
    result.budget = 'Lujo'
  }

  if (/\b(caminando|a pie)\b/i.test(lower)) {
    result.transport = 'Caminando'
  } else if (/\b(carro|auto|veh[íi]culo)\b/i.test(lower)) {
    result.transport = 'Auto rentado'
  } else if (/\b(bus|metro|p[úu]blico)\b/i.test(lower)) {
    result.transport = 'Transporte público'
  } else if (/\b(taxi|uber|cabify)\b/i.test(lower)) {
    result.transport = 'Taxi/Uber'
  }

  if (/\b(tengo (hotel|hospedaje|casa)|quedarme en)\b/i.test(lower)) {
    result.accommodationStatus = 'Ya posee hospedaje'
  } else if (/\b(buscar (hotel|hospedaje)|recomienda (hotel|hospedaje))\b/i.test(lower)) {
    result.accommodationStatus = 'Quiere buscar hospedaje'
  }

  return result
}

export function isVagueDestination(dest = '') {
  if (!dest) return true
  const lower = String(dest).toLowerCase().trim()
  if (lower.length < 3) return true
  const isVagueTerm = /playa|caribe|costa|mar|monta[ñn]a|naturaleza|europa|asia|latinoam[ée]rica|sudam[ée]rica|extranjero|fuera|exterior|frontera|isla|alojamiento|hospedaje/i.test(lower)
  const isSpecificCityName = /cartagena|santa marta|san andr[ée]s|canc[úu]n|punta cana|riviera maya|medell[íi]n|bogot[áa]|cali|barranquilla|eje cafetero|salento|roma|barcelona|madrid|par[íi]s|tokio|nueva york|miami|cabo san lucas|orlando|londres/i.test(lower)
  return isVagueTerm && !isSpecificCityName
}

function getNextMissingPreference(known = {}) {
  const dest = known.city || known.destination
  if (!dest || isVagueDestination(dest)) return 'city'
  if (!known.durationDays && !known.durationHours) return 'duration'
  if (!known.companions) return 'companions'
  if (!known.budget) return 'budget'
  if (!known.transport) return 'transport'
  if (!known.accommodationStatus) return 'accommodationStatus'
  return 'all_completed'
}

function getDefaultActionChips(known = {}, lastMessage = '') {
  const nextMissing = getNextMissingPreference(known)

  if (nextMissing === 'city') {
    const isInternational = /internacional|exterior|otro país|fuera del país|europa|asia|eeuu|usa|extranjero|fuera|viaje internacional/i.test(lastMessage)
    if (isInternational) return ['París', 'Madrid', 'Nueva York', 'Cancún']
    const isBeach = /playa|mar|costa|brisa|isla|relajarme|relajar/i.test(lastMessage)
    if (isBeach) return ['Cartagena', 'Santa Marta', 'San Andrés', 'Cancún']
    const isNature = /naturaleza|bosque|senderismo|ecoturismo|montaña/i.test(lastMessage)
    if (isNature) return ['Eje Cafetero', 'Medellín', 'Santa Marta', 'San Gil']
    return ['Cartagena', 'Medellín', 'Santa Marta', 'Bogotá']
  }

  if (nextMissing === 'duration') return ['Un fin de semana (2-3 días)', '3 días', '1 día completo']
  if (nextMissing === 'companions') return ['En familia con niños', 'Solo', 'En pareja', 'Con amigos']
  if (nextMissing === 'budget') return ['Económico', 'Moderado', 'Lujo']
  if (nextMissing === 'transport') return ['Auto rentado', 'Caminando', 'Transporte público', 'Taxi / Uber']
  if (nextMissing === 'accommodationStatus') return ['Tengo mi propio hospedaje', 'Recomiéndame hoteles']

  // ¡CUANDO YA SE RESPONDIERON TODAS LAS PREGUNTAS!
  return ['🚀 ¡Sí, generar tour ahora!', '✏️ Cambiar un detalle']
}

export async function generateChatResponse(state, backendInstruction, webSearchSummary = '', currentPreferences = {}) {
  const known = currentPreferences || {}
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return {
    responseMessage: '¡Hola! Qué gusto saludarte. Cuéntame: ¿a qué ciudad te gustaría viajar?',
    actionChips: getDefaultActionChips(known),
    destinationSuggestions: (!known.city && !known.destination) ? await buildVisualDestinationSuggestions(getDefaultActionChips(known)).catch(() => []) : [],
    readyToBuild: false
  }

  const recentHistory = (state.history || []).slice(-6).map(m => ({ role: m.role, content: m.content }))
  const lastUserMsg = state.history?.[state.history.length - 1]?.content || ''
  
  const hasCity = Boolean(known.city || known.destination)
  const isAskingCityRecommendations = !hasCity && /\b(recomien|recomiend|qué me recomiendas|que me recomiendas|dónde ir|donde ir|sugiéreme|sugiereme|opciones|destinos|playas|viaje|tour)\b/i.test(lastUserMsg)
  const isAskingHotelRecommendations = hasCity && /\b(recomien|recomiend|hoteles|hotel|alojamiento|dónde hospedarme|dónde quedarme|hospedaje)\b/i.test(lastUserMsg)
  const isExplicitBuild = /\b(generar tour|crear tour|construir tour|listo genera|haz el tour|arma el tour|generar itinerario|crear itinerario|construir itinerario|empezar tour|comenzar tour|sí genera|sí armalo|crealo|hazlo|armalo|armar el tour|armar tour|generar tour ahora)\b/i.test(lastUserMsg)

  const nextMissing = getNextMissingPreference(known)

  let promptInstruction = ''
  if (isExplicitBuild) {
    promptInstruction = `
    EL USUARIO SOLICITÓ EXPLÍCITAMENTE GENERAR SU TOUR.
    Confirma con entusiasmo que estás listo y procedes de inmediato a armar su itinerario perfecto.
    PROHIBIDO incluir listas largas de recomendaciones adicionales aquí.
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
    EL USUARIO SOLICITÓ RECOMENDACIONES DE HOTELES EN ${known.city || known.destination}: "${lastUserMsg}".
    Proporciona 3 excelentes opciones reales de hospedaje en ${known.city || known.destination} acordes a sus preferencias (${known.budget || 'Económico'}).
    AL FINAL DE TU MENSAJE, PREGUNTA SI CON ESTAS OPCIONES REVISADAS YA DESEA PROCEDER A ARMAR SU TOUR AHORA MISMO.
    `
  } else if (nextMissing === 'city') {
    promptInstruction = 'Realiza ÚNICAMENTE la siguiente pregunta al usuario: - 📍 ¿A qué ciudad o lugar te gustaría ir?'
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
    CONFIRMA alegremente la información guardada (${known.city || known.destination}, ${known.durationDays || known.durationHours} días, ${known.companions || 'Solo'}, ${known.budget || 'Económico'}, ${known.transport || 'Auto rentado'})
    Y PREGUNTA EXPLÍCITAMENTE AL USUARIO SI YA DESEA GENERAR EL TOUR AHORA MISMO.
    Ejemplo: "¡Excelente! Ya tenemos toda tu información completa para tu viaje en ${known.city || known.destination} (${known.durationDays || known.durationHours} días). 🎉 ¿Deseas que generemos tu tour ahora mismo?"
    `
  }

  const systemPrompt = `Eres Tour Planner AI 🤖, el asistente virtual de VibeTours.
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
        destinationSuggestions: (nextMissing === 'city') ? await buildVisualDestinationSuggestions(getDefaultActionChips(known, lastUserMsg)).catch(() => []) : [],
        readyToBuild: false
      }
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content ?? '{}'
    const parsed = safeParseJson(content, {
      responseMessage: '¡Excelente! Cuéntame más sobre tu viaje para diseñar el tour ideal.',
      actionChips: getDefaultActionChips(known, lastUserMsg),
      readyToBuild: false
    })

    let chips = Array.isArray(parsed.actionChips) ? parsed.actionChips : []
    const hasGenericChips = chips.some(c => typeof c === 'string' && /sugerencia|opcion|opción/i.test(c))
    
    // Forzar actionChips adecuados a la pregunta faltante actual
    if (chips.length === 0 || hasGenericChips || (nextMissing !== 'city' && chips.some(c => typeof c === 'string' && /cartagena|medellín|bogotá|roma/i.test(c.toLowerCase())))) {
      chips = getDefaultActionChips(known, lastUserMsg)
    }
    parsed.actionChips = chips

    // REGLA ESTRICTA DE INTENCIÓN DE GENERACIÓN: Solo marcar readyToBuild = true si el usuario lo pidió EXPLÍCITAMENTE
    const userExplicitBuildIntent = /\b(generar tour|crear tour|construir tour|listo genera|haz el tour|arma el tour|generar itinerario|crear itinerario|construir itinerario|empezar tour|comenzar tour|sí genera|sí armalo|crealo|hazlo|armalo|armar el tour|armar tour|generar tour ahora)\b/i.test(lastUserMsg)
    if (!userExplicitBuildIntent) {
      parsed.readyToBuild = false
    }

    // REGLA ABSOLUTA DE TARJETAS VISUALES:
    // SOLO mostrar destinationSuggestions si la pregunta actual es la Ciudad (nextMissing === 'city') O si es Hospedaje (nextMissing === 'accommodationStatus')
    if (nextMissing === 'city') {
      parsed.destinationSuggestions = await buildVisualDestinationSuggestions(chips, '')
    } else if (nextMissing === 'accommodationStatus' || chips.some(c => typeof c === 'string' && /hospedaje|hotel|alojamiento/i.test(c))) {
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
    const fallbackSuggs = (nextMissing === 'city') ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : []
    return {
      responseMessage: '¡Hola! Es un placer saludarte. Cuéntame, ¿a qué ciudad te gustaría viajar hoy?',
      actionChips: fallbackChips,
      destinationSuggestions: fallbackSuggs,
      readyToBuild: false
    }
  }
}

export async function buildVisualDestinationSuggestions(cityList = [], defaultCity = '') {
  const filteredList = cityList.filter(c => {
    if (typeof c !== 'string') return false
    const clean = c.trim().toLowerCase()
    if (clean.length < 2) return false
    if (/🚀|✏️|🌟|➕|generar|arma|armar|cambiar|detalle|opción|opcion|sugerencia|tour/i.test(clean)) return false
    return true
  })

  if (filteredList.length === 0) return []

  const cityData = {
    'roma': { name: 'Roma', city: 'Roma', country: 'Italia', countryCode: 'IT', flagEmoji: '🇮🇹', description: 'Conocida por su rica historia, impresionante arquitectura antigua y plazas tranquilas.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=75', suggestedDays: 4, temperature: '26°C', isDemoImage: false },
    'barcelona': { name: 'Barcelona', city: 'Barcelona', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'Famosa por sus obras arquitectónicas de Gaudí y sus hermosos lugares para relajarse como la Playa de la Barceloneta.', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=75', suggestedDays: 4, temperature: '25°C', isDemoImage: false },
    'tokio': { name: 'Tokio', city: 'Tokio', country: 'Japón', countryCode: 'JP', flagEmoji: '🇯🇵', description: 'Una metrópolis moderna que combina rascacielos iluminados con templos históricos y jardines serenos.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=75', suggestedDays: 5, temperature: '22°C', isDemoImage: false },
    'parís': { name: 'París', city: 'París', country: 'Francia', countryCode: 'FR', flagEmoji: '🇫🇷', description: 'La capital del arte, la gastronomía y los museos icónicos junto al río Sena.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=75', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'madrid': { name: 'Madrid', city: 'Madrid', country: 'España', countryCode: 'ES', flagEmoji: '🇪🇸', description: 'Famosa por sus amplios bulevares, palacios reales y museos de arte de clase mundial.', imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'cancún': { name: 'Cancún', city: 'Cancún', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Aguas turquesas del Caribe, playas de arena blanca y zonas de relax absoluto.', imageUrl: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=600&q=75', suggestedDays: 4, temperature: '31°C', isDemoImage: false },
    'cartagena': { name: 'Cartagena', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Ciudad amurallada del Caribe con encanto colonial, playas y ambiente vibrante.', imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '30°C', isDemoImage: false },
    'santa marta': { name: 'Santa Marta', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Puerta de entrada al Parque Tayrona con playas vírgenes y bahías tranquilas.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '29°C', isDemoImage: false },
    'medellín': { name: 'Medellín', city: 'Medellín', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'La ciudad de la eterna primavera con parques ecológicos, cultura y gastronomía.', imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '24°C', isDemoImage: false },
    'san andrés': { name: 'San Andrés', city: 'San Andrés', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Isla del mar de los siete colores, perfecta para snorkel, relax y descanso en familia.', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=75', suggestedDays: 4, temperature: '29°C', isDemoImage: false },
    'eje cafetero': { name: 'Eje Cafetero', city: 'Salento / Armenia', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Paisajes montañosos, palmas de cera gigantes y fincas cafeteras tradicionales.', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '22°C', isDemoImage: false },
    'bogotá': { name: 'Bogotá', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', flagEmoji: '🇨🇴', description: 'Capital cultural con arquitectura histórica en La Candelaria y museos de oro.', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=75', suggestedDays: 3, temperature: '18°C', isDemoImage: false },
    'parque tayrona': { name: 'Parque Tayrona', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🏖️', description: 'Santuario natural con bosques tropicales, bahías cristalinas y arrecifes coralinos.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=75', suggestedDays: 1, temperature: '29°C', isDemoImage: false },
    'minca': { name: 'Minca', city: 'Santa Marta', country: 'Colombia', countryCode: 'CO', flagEmoji: '🌿', description: 'Pueblo de montaña famoso por sus cascadas, fincas de café orgánico y avistamiento de aves.', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=75', suggestedDays: 1, temperature: '23°C', isDemoImage: false },
    'islas del rosario': { name: 'Islas del Rosario', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', flagEmoji: '🏝️', description: 'Archipiélago paradisíaco de aguas cristalinas ideales para snorkel y relax en el mar.', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=75', suggestedDays: 1, temperature: '30°C', isDemoImage: false },
    'playa de bocagrande': { name: 'Playa de Bocagrande', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', flagEmoji: '🌊', description: 'Playa urbana con ambiente vibrante, deportes acuáticos y vista a los rascacielos.', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=75', suggestedDays: 1, temperature: '30°C', isDemoImage: false }
  }

  const result = await Promise.all(
    filteredList.map(async (rawName) => {
      const placeName = String(rawName || '').trim()
      if (!placeName) return null

      const key = placeName.toLowerCase().trim()
      if (cityData[key]) {
        return cityData[key]
      }

      // Consulta dinámica en cascada: Wikipedia (es/en REST API) ➔ Wikimedia Commons ➔ Openverse ➔ Pexels API
      try {
        const imgResult = await imageForPlaceWithStatus(placeName, defaultCity, 'tourism', 0)
        const isDemo = Boolean(imgResult.isFallback)
        const displayTag = isDemo ? 'Imagen Demo' : 'Destino Destacado'

        return {
          name: placeName,
          city: placeName,
          country: displayTag,
          countryCode: isDemo ? 'DEMO' : 'DESTINO',
          flagEmoji: isDemo ? '📷' : '📍',
          description: isDemo
            ? `Atractivo imperdible para explorar en tu viaje: ${placeName}. (Imagen ilustrativa demo).`
            : `Descubre los mejores lugares y experiencias turísticas en ${placeName}.`,
          imageUrl: imgResult.url,
          suggestedDays: 3,
          temperature: '25°C',
          isDemoImage: isDemo
        }
      } catch (err) {
        console.error('[openai] Error buscando imagen dinámica para', placeName, err)
        return {
          name: placeName,
          city: placeName,
          country: 'Imagen Demo',
          countryCode: 'DEMO',
          flagEmoji: '📷',
          description: `Explora las mejores opciones en ${placeName}. (Imagen ilustrativa demo).`,
          imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=75',
          suggestedDays: 3,
          temperature: '24°C',
          isDemoImage: true
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
export async function suggestFallbackPlacesWithOpenAI({ destination, city, country, type, excludeNames = [] }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[suggestFallbackPlacesWithOpenAI] OPENAI_API_KEY is not configured')
    return null
  }

  const targetLocation = `${destination || ''} ${city || ''} ${country || ''}`.trim()
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
CRITICAL: Do NOT invent or hallucinate places that do not exist in real life. Ensure they are physically located in or immediately adjacent to the specified destination.${excludedText}`

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


