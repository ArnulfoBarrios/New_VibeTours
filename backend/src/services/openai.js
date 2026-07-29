import { GeoCache } from './geoCache.js'

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

function sanitizeExtractedLocation(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      is_unrelated: false,
      explicit_destination: '',
      city: '',
      country: '',
      origin_place: null,
      destination_place: null,
      cities: [],
      is_multi_city: false,
      duration_hours: null,
      budget: null,
      companion_type: null,
      suggestions: []
    }
  }
  return {
    is_unrelated: Boolean(raw.is_unrelated),
    explicit_destination: String(raw.explicit_destination ?? '').trim(),
    city: String(raw.city ?? '').trim(),
    country: String(raw.country ?? '').trim(),
    origin_place: raw.origin_place ? String(raw.origin_place).trim() : null,
    destination_place: raw.destination_place ? String(raw.destination_place).trim() : null,
    cities: Array.isArray(raw.cities) ? raw.cities.map(c => String(c).trim()).filter(Boolean) : [],
    is_multi_city: Boolean(raw.is_multi_city),
    duration_hours: typeof raw.duration_hours === 'number' && Number.isFinite(raw.duration_hours) ? raw.duration_hours : null,
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

export async function extractLocation(prompt, lat, lon, userCountry = null) {
  if (!prompt || typeof prompt !== 'string') return null
  const cacheKey = `extract_${prompt.toLowerCase().trim()}_${lat ?? ''}_${lon ?? ''}_${userCountry ?? ''}`
  const cached = locationExtractCache.get(cacheKey)
  if (cached) return cached

  const timeoutMs = 40000
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.warn('[extractLocation] OPENAI_API_KEY no está configurada')
    return null
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
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
          { role: 'system', content: `Eres un asistente experto en viajes. Lee el prompt del usuario.
Determina primero si el mensaje del usuario no tiene sentido, es una secuencia aleatoria de letras/caracteres (ej: "yfyzGgstfuvu", "asdffd"), o si es un tema completamente ajeno a planificar viajes, turismo, tours, hoteles, rutas o geografía (por ejemplo, preguntas de programación, cocina, matemáticas, etc.). Si se da este caso, establece obligatoriamente "is_unrelated" en true. Si es un mensaje coherente relacionado con viajes, turismo o un saludo inicial, establece "is_unrelated" en false.

Si "is_unrelated" es false:
- Si menciona claramente a dónde quiere ir (una o varias ciudades, o una ruta como "Barranquilla a Santa Marta"), PON OBLIGATORIAMENTE ese destino/ruta en "explicit_destination" y deja "suggestions" VACÍO.
- Si el usuario menciona una ruta dentro de una ciudad con un punto de inicio específico (ej. "empieza en el Malecón", "desde el parque X") y/o un punto final específico (ej. "hasta el Estadio", "termine en el Museo Y"), extrae "origin_place" y "destination_place".
- Si el usuario menciona varias ciudades para recorrer (ej. "empieze en Barranquilla y termine en Santa Marta"), extrae un array con todas las ciudades en "cities" (ej: ["Barranquilla", "Santa Marta"]) y marca "is_multi_city" como true. Si es una sola ciudad, "is_multi_city" es false y "cities" contiene esa ciudad.
- ÚNICAMENTE si el usuario NO menciona ninguna ciudad ni lugar a dónde ir, pon "explicit_destination" vacío y recomienda 3 destinos increíbles (ciudades) adaptados a sus gustos en "suggestions".
- Extrae también la duración (ej: "viaje de 3 días" = 72, "tour de 4 horas" = 4) en "duration_hours" (number o null). Nota: Para tours entre múltiples ciudades (is_multi_city = true), si no especifica duración, asigna al menos 48 horas. Para tours de una sola ciudad con origen y fin especificados, si no se indica duración, asigna 8 horas.
- Extrae el presupuesto en "budget" (string: "bajo", "medio", "alto", o null).
- Extrae el tipo de acompañamiento en "companion_type" (string: "solo", "pareja", "familia", "amigos", o null).
${lat && lon ? `IMPORTANTE: El usuario se encuentra en las coordenadas geográficas latitud ${lat}, longitud ${lon}${userCountry ? ` ubicadas en el país de ${userCountry}` : ''}. Si el usuario pide lugares genéricos, DEBEN estar en el mismo país o región cercana. CRÍTICO: Si el usuario menciona una ciudad con homónimos (como "Cartagena" o "Córdoba"), ASUME ESTRICTAMENTE que se refiere a la ciudad ubicada en ${userCountry || 'su país correspondiente a sus coordenadas actuales'}, y rellena el campo "country" con el nombre de ese país. ` : ''}

Devuelve ÚNICAMENTE JSON válido con este esquema:
{
  "is_unrelated": boolean,
  "explicit_destination": string,
  "city": string,
  "country": string,
  "origin_place": string o null,
  "destination_place": string o null,
  "cities": [string],
  "is_multi_city": boolean,
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
    const result = sanitizeExtractedLocation(parsed)
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
}) {
  const cacheKey = `plan_${destination}_${city}_${country}_${type}_${durationHours}_${language}_${selectedHotel?.name ?? ''}`
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

  const selectedPlaces = summarizePlaces(places).slice(0, 12)
  let system = `Eres TourSync AI, una inteligencia artificial de lujo especializada exclusivamente en crear tours turisticos vibrantes, atractivos y altamente personalizados.

Tu respuesta debe ser siempre un unico objeto JSON valido. No agregues markdown, comentarios, etiquetas, explicaciones ni texto fuera del JSON.

Reglas centrales:
- Crea experiencias inmersivas y altamente atractivas. ¡No seas aburrido, estándar ni monótono!
- Prioriza obligatoriamente Puntos de Interés (POIs) turísticos altamente populares, icónicos reales, sitios históricos verificables y joyas turísticas reales. La lista de lugares (selectedPlaces) que recibes representa los puntos más populares, emblemáticos y mejor calificados de la ciudad. Destaca siempre su carácter emblemático, historia y valor cultural en la narración.
- Si la petición del usuario es abierta o general, enfoca el tour como un recorrido clásico e imprescindible por la esencia misma de la ciudad, resaltando por qué cada parada es legendaria. Si la petición es específica, enfoca la narrativa en torno a ese tema de interés, seleccionando lo mejor y más selecto.
- PROHIBIDO INVENTAR: No alucines, no inventes monumentos, museos, restaurantes ni direcciones que no existan en la vida real. Si no conoces una dirección exacta, deja el campo vacío en vez de inventar.
- No uses coordenadas geográficas en el JSON.
- Escribe en ${language}.
- CRÍTICO: La descripción general del tour ("descripcion_tour") debe atrapar al usuario desde la primera línea, tener 150 a 300 palabras, y explicar la vibra de la experiencia.
- CRÍTICO GUÍA DE VOZ INMERSIVA: Cada descripción de parada ("descripcion") DEBE ser una guía de voz completa y envolvente de 80 a 120 palabras. Escribe como si fueras un guía local experto hablando en vivo al oído del turista. Narra la historia fascinante del sitio, los detalles arquitectónicos o naturales que tiene enfrente, anécdotas culturales únicas y sugerencias de 'Qué hacer o qué probar aquí'.
- CRÍTICO: El array de salida "itinerario" debe tener EXACTAMENTE la misma longitud que la lista de lugares seleccionados (selectedPlaces) que recibes. Debes procesar y describir una por una todas las paradas provistas, sin omitir absolutamente ninguna. Si el array selectedPlaces contiene 6 elementos, tu array "itinerario" de salida debe contener exactamente 6 elementos correspondientes, en el mismo orden. No agrupas ni omites nada.
- COBERTURA REGIONAL: No te limites únicamente al centro urbano geocodificado de la ciudad principal. Cuando los lugares seleccionados estén ubicados en los alrededores, debes tejer una ruta regional coherente y atractiva que los integre.
- DETALLE DE TRANSPORTE ESPECIAL: Para aquellas paradas que se encuentren alejadas del centro de la ciudad o requieran un traslado no convencional, DEBES detallar de manera obligatoria y explícita en su descripción el método de transporte necesario y sugerido para llegar allí.
- CRÍTICO: Prohibido usar frases genéricas de transición como "En esta parada...", "Aquí puedes observar...", "Ahora llegamos a...". Usa un Storytelling dinámico.
- Cada parada debe incluir actividades específicas reales, 2 a 5 datos curiosos históricos o culturales verificados y consejos prácticos útiles.
- Ten en cuenta el perfil del viajero cuando exista: ${touristProfileSummary || 'sin perfil adicional'}.
- Intereses del viajero: ${touristInterests.length ? touristInterests.join(', ') : 'no especificados'}.
- Ritmo preferido: ${touristPace}.
- Estima un presupuesto realista en USD.`

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

export async function extractChatInformation(userMessage, currentData) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = `Analiza el mensaje del usuario y extrae la información turística.
Devuelve ÚNICAMENTE un objeto JSON válido con los campos que puedas identificar.
Campos posibles: city, budget (Económico, Moderado, Lujo), travelers (Solo, Pareja, Amigos, Familia), hasMinors (boolean), duration (1 a 7 días), pace (Relajado, Equilibrado, Acelerado), schedule (Mañana, Tarde, Noche, Dinámico), transportation (Caminando, Auto rentado, Taxi, Transporte público), interests (array de strings), wantsHotel (boolean), originPlace (string o null, ej: punto o lugar específico de inicio de la ruta), destinationPlace (string o null, ej: punto o lugar específico final de la ruta).
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
    const json = await response.json()
    return JSON.parse(json.choices?.[0]?.message?.content ?? '{}')
  } catch (err) {
    console.error('[openai] extract error:', err)
    return null
  }
}

export async function generateChatResponse(state, backendInstruction) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return 'Error de conexión con IA.'

  const systemPrompt = `Eres Tour Planner AI, asistente experto en diseño de tours personalizados.
Tu única función es conversar con el usuario para recolectar datos y diseñar su viaje basado en información real.
No eres un chatbot general. Nunca respondas temas políticos, programación, matemáticas, medicina o personales.
Si intenta cambiar de tema responde: "Soy un asistente especializado en la planificación de tours. Puedo ayudarte a diseñar viajes."
INSTRUCCIÓN DEL SISTEMA (CRÍTICA): ${backendInstruction}`

  // Solo enviamos los últimos 3 mensajes para ahorrar tokens
  const recentHistory = state.history.slice(-3).map(m => ({ role: m.role, content: m.content }))

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...recentHistory]
      })
    })
    const json = await response.json()
    return json.choices?.[0]?.message?.content ?? 'Lo siento, no pude procesar tu solicitud.'
  } catch (err) {
    console.error('[openai] chat response error:', err)
    return 'Lo siento, ha ocurrido un error al conectar con la IA.'
  }
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

export async function fetchCityIconicLandmarks({ destination, city, country, type = 'cultural', interests = [], prompt = '' }) {
  const targetCity = city || destination || ''
  const targetCountry = country || ''
  if (!targetCity) return []

  const cacheKey = `landmarks_${targetCity.toLowerCase().trim()}_${targetCountry.toLowerCase().trim()}_${type}`
  const cached = landmarkCache.get(cacheKey)
  if (cached) return cached

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[fetchCityIconicLandmarks] OPENAI_API_KEY is not configured')
    return []
  }

  const systemPrompt = `Eres un experto mundial en geografía, viajes y turismo.
El usuario quiere conocer la ciudad o destino "${targetCity}"${targetCountry ? ` ubicado en "${targetCountry}"` : ''}.
Tu objetivo es listar los 10 a 15 atracciones e hitos turísticos MÁS FAMOSOS, EMBLEMÁTICOS, ICÓNICOS, CULTURALES, RECREATIVOS Y DE ENTRETENIMIENTO que existen físicamente en "${targetCity}" y sus inmediaciones inmediatas.

REGLAS CRÍTICAS DE CALIDAD TURÍSTICA:
1. Incluye únicamente verdaderos puntos de interés turístico: monumentos célebres, malecones, plazas icónicas, miradores, museos principales, ecoparques, estadios deportivos destacados, teatros, centros comerciales emblemáticos de entretenimiento y paseos peatonales famosos.
2. PROHIBIDO ABSOLUTAMENTE incluir: plantas industriales, zonas francas, puertos de carga, empresas o marcas corporativas, centros de bodegas, fábricas, conjuntos residenciales, urbanizaciones o corregimientos/límites vagos sin un local turístico específico.
3. Si el usuario especificó intereses o un tema (${interests.join(', ') || prompt || type}), incluye lugares destacados relacionados a ese tema, pero siempre asegurando que sean lugares emblemáticos y turísticos reales.

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
          { role: 'user', content: `List 12 iconic tourist landmarks for "${targetCity}, ${targetCountry}"` }
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


