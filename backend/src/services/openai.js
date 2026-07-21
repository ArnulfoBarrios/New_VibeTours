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

export async function extractLocation(prompt, lat, lon, userCountry = null) {
  if (!prompt || typeof prompt !== 'string') return null
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
- Si menciona claramente a dónde quiere ir, ponlo en "explicit_destination" y "suggestions" vacío.
- Si NO menciona a dónde quiere ir, pon "explicit_destination" vacío y recomienda 3 destinos increíbles (ciudades) adaptados a sus gustos en "suggestions".
- Extrae también la duración (ej: "viaje de 3 días" = 72, "tour de 4 horas" = 4) en "duration_hours" (number o null).
- Extrae el presupuesto en "budget" (string: "bajo", "medio", "alto", o null).
- Extrae el tipo de acompañamiento en "companion_type" (string: "solo", "pareja", "familia", "amigos", o null).
${lat && lon ? `IMPORTANTE: El usuario se encuentra en las coordenadas geográficas latitud ${lat}, longitud ${lon}${userCountry ? ` ubicadas en el país de ${userCountry}` : ''}. Si el usuario pide lugares genéricos, DEBEN estar en el mismo país o región cercana. CRÍTICO: Si el usuario menciona una ciudad con homónimos (como "Cartagena" o "Córdoba"), ASUME ESTRICTAMENTE que se refiere a la ciudad ubicada en ${userCountry || 'su país correspondiente a sus coordenadas actuales'}, y rellena el campo "country" con el nombre de ese país. ` : ''}

Devuelve ÚNICAMENTE JSON válido con este esquema:
{
  "is_unrelated": boolean,
  "explicit_destination": string,
  "city": string,
  "country": string,
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
    return JSON.parse(content)
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
  const timeoutMs = Number.parseInt(process.env.OPENAI_TIMEOUT_MS ?? '', 10) || 120000
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.warn('[planWithOpenAI] OPENAI_API_KEY no está configurada')
    return null
  }

  const selectedPlaces = summarizePlaces(places).slice(0, 30)
  let system = `Eres TourSync AI, una inteligencia artificial de lujo especializada exclusivamente en crear tours turisticos vibrantes, atractivos y altamente personalizados.

Tu respuesta debe ser siempre un unico objeto JSON valido. No agregues markdown, comentarios, etiquetas, explicaciones ni texto fuera del JSON.

Reglas centrales:
- Crea experiencias inmersivas y altamente atractivas. ¡No seas aburrido, estándar ni monótono!
- Prioriza obligatoriamente Puntos de Interés (POIs) turísticos altamente populares, icónicos reales, sitios históricos verificables y joyas turísticas reales. La lista de lugares (selectedPlaces) que recibes representa los puntos más populares, emblemáticos y mejor calificados de la ciudad. Destaca siempre su carácter emblemático, historia y valor cultural en la narración.
- Si la petición del usuario es abierta o general, enfoca el tour como un recorrido clásico e imprescindible por la esencia misma de la ciudad, resaltando por qué cada parada es legendaria. Si la petición es específica, enfoca la narrativa en torno a ese tema de interés, seleccionando lo mejor y más selecto.
- PROHIBIDO INVENTAR: No alucines, no inventes monumentos, museos, restaurantes ni direcciones que no existan en la vida real. Si no conoces una dirección exacta, deja el campo vacío en vez de inventar.
- No uses coordenadas geográficas en el JSON.
- Escribe en ${language}.
- CRÍTICO: La descripción general del tour ("descripcion_tour") debe atrapar al usuario desde la primera línea, tener 150 a 400 palabras, y explicar la vibra de la experiencia.
- CRÍTICO: Cada descripción de parada ("descripcion") DEBE tener entre 80 y 150 palabras, escrita como un guía local experto y apasionado. Además de la historia vibrante, DEBE INCLUIR listas con guiones (-) para sugerir 'Qué hacer aquí' o 'Dónde comer cerca' de forma concisa.
- CRÍTICO: El array de salida "itinerario" debe tener EXACTAMENTE la misma longitud que la lista de lugares seleccionados (selectedPlaces) que recibes. Debes procesar y describir una por una todas las paradas provistas, sin omitir absolutamente ninguna. Si el array selectedPlaces contiene 6 elementos, tu array "itinerario" de salida debe contener exactamente 6 elementos correspondientes, en el mismo orden. No agrupas ni omites nada.
- COBERTURA REGIONAL: No te limites únicamente al centro urbano geocodificado de la ciudad principal. Cuando los lugares seleccionados estén ubicados en los alrededores, debes tejer una ruta regional coherente y atractiva que los integre (por ejemplo, conectar el centro histórico de Santa Marta con el Parque Tayrona o el Rodadero; o Tolú con el archipiélago de San Bernardo y playas de Coveñas).
- DETALLE DE TRANSPORTE ESPECIAL: Para aquellas paradas que se encuentren alejadas del centro de la ciudad o requieran un traslado no convencional, DEBES detallar de manera obligatoria y explícita en su descripción el método de transporte necesario y sugerido para llegar allí (por ejemplo, especificar claramente frases como "tomar una lancha desde el muelle de Tolú para ir a Isla Palma", "viajar en autobús intermunicipal", o "realizar una caminata guiada por senderos ecológicos").
- CRÍTICO: Prohibido usar frases genéricas de transición como "En esta parada...", "Aquí puedes observar...", "Ahora llegamos a...", "Continuamos nuestro tour hacia...". Usa un Storytelling dinámico.
- Cada parada debe incluir actividades específicas reales, 2 a 5 datos curiosos históricos o culturales verificados y consejos prácticos útiles.
- Ten en cuenta el perfil del viajero cuando exista: ${touristProfileSummary || 'sin perfil adicional'}.
- Intereses del viajero: ${touristInterests.length ? touristInterests.join(', ') : 'no especificados'}.
- Ritmo preferido: ${touristPace}.
- Estima un presupuesto realista en USD.`

  if (selectedHotel && selectedHotel.name) {
    system += `\n- CRÍTICO: El turista se hospedará o iniciará en el hotel: "${selectedHotel.name}". El "punto_encuentro" (meetingPoint) del tour DEBE ser obligatoriamente este hotel y debes integrarlo de manera relevante al inicio del itinerario.`
  }

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
  if (result.ok && result.data) return result.data

  console.info('[openai] Retrying generation after failure...')
  result = await makeRequest(2)
  if (result.ok && result.data) return result.data

  return null
}

export async function extractChatInformation(userMessage, currentData) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = `Analiza el mensaje del usuario y extrae la información turística.
Devuelve ÚNICAMENTE un objeto JSON válido con los campos que puedas identificar.
Campos posibles: city, budget (Económico, Moderado, Lujo), travelers (Solo, Pareja, Amigos, Familia), hasMinors (boolean), duration (1 a 7 días), pace (Relajado, Equilibrado, Acelerado), schedule (Mañana, Tarde, Noche, Dinámico), transportation (Caminando, Auto rentado, Taxi, Transporte público), interests (array de strings), wantsHotel (boolean).
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
export async function suggestFallbackPlacesWithOpenAI({ destination, city, country, type }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[suggestFallbackPlacesWithOpenAI] OPENAI_API_KEY is not configured')
    return null
  }

  const targetLocation = `${destination || ''} ${city || ''} ${country || ''}`.trim()
  
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
CRITICAL: Do NOT invent or hallucinate places that do not exist in real life. Ensure they are physically located in or immediately adjacent to the specified destination.`

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


