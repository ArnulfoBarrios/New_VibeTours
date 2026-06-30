function summarizePlaces(places = []) {
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

export async function extractLocation(prompt) {
  if (!prompt || typeof prompt !== 'string') return null
  const timeoutMs = 40000
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL ?? 'llama3.1'
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: 'Eres un asistente experto en viajes. Lee el prompt del usuario. Si menciona claramente a dónde quiere ir, ponlo en "explicit_destination" y "suggestions" vacío. Si NO menciona a dónde quiere ir, pon "explicit_destination" vacío y recomienda 3 destinos increíbles (ciudades) adaptados a sus gustos en "suggestions". Devuelve ÚNICAMENTE JSON válido con: "explicit_destination" (string), "city" (string), "country" (string), "suggestions": [{ "city": "...", "country": "...", "reason": "..." }]' },
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
    let content = json.message?.content ?? '{}'
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(content)
  } catch (err) {
    console.error('[extractLocation] error:', err.message)
    return null
  }
}

export async function planWithOllama({
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
}) {
  const timeoutMs = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '', 10) || 90000
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL ?? 'llama3.1'
  const selectedPlaces = summarizePlaces(places).slice(0, 8)
  const system = `Eres TourSync AI, una inteligencia artificial especializada exclusivamente en crear tours turisticos personalizados de alta calidad para cualquier ciudad, pueblo, region, isla, parque natural, destino turistico o pais del mundo.

Tu respuesta debe ser siempre un unico objeto JSON valido. No agregues markdown, comentarios, etiquetas, explicaciones ni texto fuera del JSON.

Reglas centrales:
- Crea experiencias realistas, coherentes geograficamente, culturalmente relevantes y listas para una app turistica.
- Prioriza lugares iconicos, sitios historicos, monumentos, experiencias culturales, gastronomia local, miradores y joyas ocultas reales.
- No inventes monumentos, museos, direcciones ni lugares inexistentes.
- No repitas paradas ni pongas dos paradas consecutivas de la misma familia si hay alternativas mejores.
- No uses coordenadas geograficas en el JSON.
- Usa exclusivamente ubicaciones con nombre_lugar, direccion, ciudad, region, pais, place_id y url_mapa.
- Si no conoces una direccion exacta, deja el campo vacio antes de inventar datos.
- Escribe en ${language}.
- La descripcion del tour debe tener idealmente 150 a 400 palabras.
- CRITICO: Cada descripcion de parada DEBE tener entre 150 y 350 palabras. Debes actuar como un guía turístico apasionado y experto. Para cada parada incluye la historia del lugar, recomendaciones gastronómicas cercanas o platos recomendados, y detalles de qué hacer exactamente.
- CRITICO: Prohibido usar frases genericas de transicion como "En esta parada...", "Aqui puedes observar...", "Ahora llegamos a...", "Continuamos nuestro tour hacia...". Escribe la narracion de forma directa y cautivadora, como una guia de voz profesional.
- Cada parada debe incluir actividades especificas, 2 a 5 datos curiosos reales y consejos practicos.
- El orden debe optimizar tiempo de desplazamiento, flujo narrativo y comodidad.
- Adapta el tono de la narrativa al tipo de tour (historico, cultural, gastronomico, ecologico, nocturno, aventurero).
- Si el tiempo disponible es reducido, concentra el itinerario en 2 a 3 paradas muy representativas y minimiza traslados.
- Si el tiempo disponible es amplio, agrega lugares complementarios, experiencias locales y al menos una parada menos conocida pero relevante.
- Asegura diversidad: evita itinerarios monotonos, paradas repetitivas y secuencias de lugares demasiado parecidos.
- Ten en cuenta el perfil del viajero cuando exista: ${touristProfileSummary || 'sin perfil adicional'}.
- Intereses del viajero: ${touristInterests.length ? touristInterests.join(', ') : 'no especificados'}.
- Ritmo preferido: ${touristPace}.
- Usa el horario recomendado y la ventana de tiempo para diseñar el flujo del tour.
- Estima presupuesto realista en USD segun destino y tipo de experiencia.`

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
      console.info(`[ollama] request attempt ${attempt}`, { baseUrl, model, selectedPlaces: selectedPlaces.length, destination, city, country, durationHours, type })
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(new Error(`Ollama request timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs)
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
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
    "place_id": "",
    "url_mapa": ""
  },
  "imagen_portada": "",
  "galeria_tour": [],
  "itinerario": [
    {
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
Input: ${JSON.stringify(routeBrief)}`,
            },
          ],
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.warn(`[ollama] non-ok on attempt ${attempt}`, { status: response.status, statusText: response.statusText, text: text.slice(0, 400) })
        return { ok: false, error: 'non-ok status' }
      }
      const json = await response.json()
      const content = json.message?.content ?? '{}'
      try {
        const parsed = JSON.parse(content)
        console.info(`[ollama] parsed successfully on attempt ${attempt}`, { hasItinerary: Array.isArray(parsed.itinerario), itinerary: Array.isArray(parsed.itinerario) ? parsed.itinerario.length : 0 })
        return { ok: true, data: parsed }
      } catch (parseError) {
        console.warn(`[ollama] parse-error on attempt ${attempt}`, { message: parseError?.message ?? String(parseError) })
        return { ok: false, error: 'parse error' }
      }
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? `Ollama request timed out after ${Math.round(timeoutMs / 1000)}s`
        : error?.message ?? String(error)
      console.warn(`[ollama] request-failed on attempt ${attempt}`, { message })
      return { ok: false, error: message }
    }
  }

  // Intento 1
  let result = await makeRequest(1)
  if (result.ok && result.data) return result.data

  // Reintento
  console.info('[ollama] Retrying generation after failure...')
  result = await makeRequest(2)
  if (result.ok && result.data) return result.data

  return null
}


