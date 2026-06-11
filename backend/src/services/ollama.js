export async function planWithOllama({ destination, country, city, durationHours, type, language, prompt, places }) {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL ?? 'llama3.1'
  const system = `Eres TourSync AI, una inteligencia artificial especializada exclusivamente en crear tours turisticos personalizados de alta calidad para cualquier ciudad, pueblo, region, isla, parque natural, destino turistico o pais del mundo.

Tu respuesta debe ser siempre un unico objeto JSON valido. No agregues markdown, comentarios, etiquetas, explicaciones ni texto fuera del JSON.

Reglas centrales:
- Crea experiencias realistas, coherentes geograficamente, culturalmente relevantes y listas para una app turistica.
- Prioriza lugares iconicos, sitios historicos, monumentos, experiencias culturales, gastronomia local, miradores y joyas ocultas reales.
- No inventes monumentos, museos, direcciones ni lugares inexistentes.
- No repitas paradas.
- No uses coordenadas geograficas en el JSON. Si los lugares candidatos incluyen coordenadas internas, no las copies en la respuesta.
- Usa exclusivamente ubicaciones con nombre_lugar, direccion, ciudad, region, pais, place_id y url_mapa.
- Si no conoces una direccion exacta, deja el campo vacio antes de inventar datos.
- Escribe en ${language}.
- La descripcion del tour debe tener idealmente 150 a 400 palabras.
- Cada descripcion de parada debe tener idealmente 80 a 250 palabras.
- Cada parada debe incluir actividades especificas, 2 a 5 datos curiosos reales y consejos practicos.
- El orden debe optimizar tiempo de desplazamiento, flujo narrativo y comodidad.
- Estima presupuesto realista en USD segun destino y tipo de experiencia.`
  const user = {
    destination,
    country,
    city,
    durationHours,
    type,
    prompt,
    candidatePlaces: places.slice(0, 14)
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
Usa candidatos reales cuando sea posible, pero nunca incluyas latitud ni longitud en la respuesta. Adapta completamente el tour a destino, duracion, tipo, idioma y prompt libre. Input: ${JSON.stringify(user)}`
          }
        ]
      })
    })
    if (!response.ok) return null
    const json = await response.json()
    return JSON.parse(json.message?.content ?? '{}')
  } catch {
    return null
  }
}
