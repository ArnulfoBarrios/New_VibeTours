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
- Cada descripcion de parada debe tener idealmente 80 a 250 palabras.
- Cada parada debe incluir actividades especificas, 2 a 5 datos curiosos reales y consejos practicos.
- El orden debe optimizar tiempo de desplazamiento, flujo narrativo y comodidad.
- Si el tiempo disponible es reducido, concentra el itinerario en 2 a 3 paradas muy representativas y minimiza traslados.
- Si el tiempo disponible es amplio, agrega lugares complementarios, experiencias locales y al menos una parada menos conocida pero relevante.
- Adapta la ruta al tipo de tour:
  - Historico: museos, monumentos y centros historicos.
  - Gastronomico: restaurantes, mercados y cafeterias emblematicas.
  - Ecologico: parques, reservas y senderos.
  - Nocturno: bares, discotecas y eventos nocturnos.
  - Familiar: lugares aptos para menores, actividades educativas y espacios recreativos.
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

  try {
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

No inventes lugares fuera de la lista de candidatos si ya hay suficientes opciones reales.
Usa la lista de candidatos como base del recorrido y mantente fiel al orden logico sugerido.
No repitas categorias similares de forma consecutiva.
Input: ${JSON.stringify(routeBrief)}`,
          },
        ],
      }),
    })
    if (!response.ok) return null
    const json = await response.json()
    return JSON.parse(json.message?.content ?? '{}')
  } catch {
    return null
  }
}
