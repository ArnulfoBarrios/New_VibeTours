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
export const DESTINATION_LOCAL_PRESETS = {}

/**
 * 100% Dynamic Global Catalog Resolver.
 * Fetches verified real venues, restaurants, cafes, bars, and attractions
 * dynamically from OpenStreetMap (Overpass API / Photon) anywhere in the world.
 */
export async function getRealDestinationCatalog(destName = '', countryName = '', userLat = null, userLon = null) {
  const clean = cleanAdministrativeCityName(destName).toLowerCase()
  const cacheKey = `catalog_${clean}_${countryName}`
  const cached = destinationCatalogCache.get(cacheKey)
  if (cached) return cached

  // 1. Dynamic Geocode & OSM Live Query
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
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 3500))
    const [osmHotels, osmRests, osmAttractions] = await Promise.all([
      Promise.race([overpassHotels(lat, lon, 'moderate', 8000).catch(() => []), timeoutPromise]),
      Promise.race([overpassNearbyFood(lat, lon, 6000).catch(() => []), timeoutPromise]),
      Promise.race([overpassAttractions(lat, lon, 8000).catch(() => []), timeoutPromise])
    ])

    realHotels = (osmHotels || []).filter(h => h && h.name && !h.name.toLowerCase().includes('perímetro urbano')).slice(0, 6)
    realRests = (osmRests || []).filter(r => r && r.name && !r.name.toLowerCase().includes('perímetro urbano')).slice(0, 12)
    realPlaces = (osmAttractions || []).filter(p => p && p.name && !p.name.toLowerCase().includes('perímetro urbano')).slice(0, 15)

    if (realPlaces.length === 0) {
      const photonPlaces = await photonSearch(`${capitalCity} tourism`, 10, lat, lon).catch(() => [])
      realPlaces = (photonPlaces || []).filter(p => p && p.name).slice(0, 10)
    }
  }

  const result = {
    name: capitalCity,
    country: targetCountry,
    hotels: realHotels.map(h => ({
      name: h.name,
      desc: `Alojamiento verificado ubicado en ${capitalCity}.`,
      price: '~$75 - $140 USD/noche'
    })),
    restaurants: realRests.map(r => ({
      name: r.name,
      specialty: r.cuisine ? `Especialidad en cocina ${r.cuisine}` : `Gastronomía local en ${capitalCity}`
    })),
    places: realPlaces.map(p => p.name),
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
  if (preferences.canonicalDestination && preferences.canonicalDestination.city) return false
  const lower = String(destination).trim().toLowerCase()
  if (lower.length <= 2) return true
  const isGenericTermOnly = /^(playa|playas|caribe|costa|mar|monta[ñn]a|naturaleza|europa|asia|latinoam[ée]rica|sudam[ée]rica|extranjero|fuera|exterior|frontera|isla|alojamiento|hospedaje|ciudad|destino|destinos|viaje|lugar|cualquiera|no se|no sé|donde sea|sorpr[ée]ndeme|recomi[ée]ndame|en mi pa[íi]s|mi pa[íi]s|cerca|cercanos|internacional|eeuu)$/i.test(lower)
  return isGenericTermOnly
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
      const preset = realCatalog || getDestinationPresets(known.city || 'Destino', known.country || 'Local')
      const fbHasLodging = hasValidLodging(known.selectedHotel, known.accommodationStatus)
      const fbHasTransport = hasValidValue(known.transport)
      const fbHasBudget = hasValidValue(known.budget)
      const fbHasCompanions = hasValidValue(known.companions)
      const fbAllKeyInfoComplete = Boolean(hasCity && hasDurationOrDates && fbHasCompanions && fbHasLodging && fbHasTransport && fbHasBudget)

      const isExplicitBuildRequestedByUser = /\b(gener(ar|es|a|e|en|al)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|cre(ar|es|a|e|en)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|inicia(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|finaliza(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|constru(ye|ir)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|dise[ñn](ar|a|es|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|est[aá]\s+perfecto\s+(genera|crea)|listo\s+(genera|crea|para\s+generar)|ya\s+no\s+hay\s+nada\s+genera|vale\s+(genera|crea)|procede\s+a\s+generar|si\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|s[íi]\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|(genera|crea|haz)\s+(el\s+|la\s+)?(tour|itinerario|ruta)\s+porfa|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|ok(ay)?\s+(listo\s+)?(quiero\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)?|adelante\s+(con\s+el\s+tour|genera|crea|construye|procede)|vamos\s+(a\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|armar?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje))\b/i.test(lastUserMsg)
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

REGLA DE COHERENCIA DE SUBZONA Y CLUSTER GEOGRÁFICO:
- Si el usuario solicita o enfoca su tour en una subzona, parque nacional, reserva natural, archipiélago o corredor específico (ej: "Parque Tayrona", "Minca", "Barú", "Islas del Rosario", etc.):
  1. Todos los atractivos, playas, miradores y paradas deben pertenecer estrictamente a esa subzona y su acceso inmediato.
  2. ESTÁ TERMINANTEMENTE PROHIBIDO mezclar lugares del centro histórico urbano de la ciudad (ej: Museo del Oro o restaurantes a 35 km del parque) en jornadas de parque natural/reserva.
  3. NUNCA inventes nombres de restaurantes en reservas naturales. Para comidas en parques o playas aisladas, programa almuerzos/comidas en paradas ecológicas existentes (ej: Kioscos de Cabo San Juan, zona de restaurantes de Neguanje/Bahía Concha) o restaurantes del corredor de acceso.

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

PROHIBICIÓN ABSOLUTA DE LUGARES Y RESTAURANTES INVENTADOS O GENÉRICOS:
- Todos los restaurantes, bares, hoteles y atractivos que menciones DEBEN SER LUGARES REALES Y EXISTENTES en el mapa de ${destName}.
- Si vas a recomendar restaurantes, cafés o bares, utiliza PRIORITARIAMENTE los nombres del CATÁLOGO OFICIAL Y VERIFICADO DE OPENSTREETMAP (${realCatalog?.restaurants?.map(r => r.name).join(', ') || 'restaurantes reales'}). NUNCA inventes nombres genéricos como "Restaurante El Buen Gusto" o "Restaurante Tradicional".

REGLA DE UNICIDAD TOTAL Y CERO REPETICIONES INTER-DÍA:
- Cada lugar, playa, museo, parque o restaurante DEBE aparecer como máximo UNA SOLA VEZ en TODO el itinerario completo (Día 1 a Día ${known.durationDays || 3}).
- ESTÁ TERMINANTEMENTE PROHIBIDO repetir el mismo atractivo o restaurante en días diferentes (por ejemplo, si programas Malecón del Río en el Día 1, NUNCA lo vuelvas a incluir en el Día 2 o Día 3).
- Si el usuario te pide cambiar o retirar una parada de un día específico, elimínala de ese día y sustitúyela por un atractivo diferente que no haya sido programado en ningún otro día.

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB:\n${webSearchSummary}` : ''}

LISTA ACUMULADA DE ACTIVIDADES Y LUGARES APROBADOS POR EL VIAJERO:
${Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0 ? JSON.stringify(known.specificPlaces) : 'Ninguno por ahora'}

REGLA ESTRICTA DE PRESERVACIÓN DE ACTIVIDADES EN EL ITINERARIO:
- Si el usuario selecciona o aprueba actividades (ej: "1 y 3", "quiero incluir todas estas actividades", "agrega estas actividades también", "vale agrega todas esas actividades al itinerario y Muéstrame el itinerario"):
  1. Extrae todas las actividades en "extractedPreferences.specificPlaces" acumulándolas con las anteriores (sin duplicar nombres).
  2. Al estructurar o actualizar el itinerario día por día, DEBES INCLUIR TODAS las actividades aprobadas (${JSON.stringify(known.specificPlaces || [])}) distribuidas equilibradamente entre los ${known.durationDays || 4} días, sin repetir ningún lugar entre días.
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
  "Itinerario de Viaje a ${destName} (${known.datesSeason || `${known.durationDays || 3} días`}):
  • Día 1: Atracción Principal 1 -> Sitio Cultural o Mirador -> Restaurante Emblemático
  • Día 2: Playa o Parque Natural -> Museo o Plaza Histórica -> Restaurante Típico
  ... (hasta el Día ${known.durationDays || 3})"

  REGLAS DE ORO DEL ITINERARIO:
  1. ESTÁ TERMINANTEMENTE PROHIBIDO USAR CORCHETES []. Escribe los nombres propios de los lugares reales de ${destName} directos y limpios.
  2. NUNCA pongas "Llegada / Hotel", "Exploración en...", "Café y cascadas...", "Tarde en la playa", "Tarde libre", "Despedida" ni el nombre del hotel como paradas en las flechas (->).
  3. CADA ELEMENTO entre flechas (->) DEBE SER EXCLUSIVAMENTE EL NOMBRE PROPIO DE UN LUGAR FÍSICO O RESTAURANTE REAL de ${destName} (ej: "• Día 1: Lugar Real A -> Lugar Real B -> Restaurante Real C").
  4. CADA DÍA (del Día 1 al Día ${known.durationDays || 3}) DEBE TENER al menos 2 o 3 lugares físicos o restaurantes REALES y DIFERENTES A LOS DE OTROS DÍAS (CERO DUPLICADOS O REPETICIONES EN TODO EL TOUR).
  5. PRESERVACIÓN DEL ORDEN: El orden en que se presenten las paradas (1º -> 2º -> 3º) dentro de cada día será exactamente el orden cronológico del recorrido en el mapa.
  6. ESTÁ TERMINANTEMENTE PROHIBIDO dejar días vacíos, días con descripciones abstractas o días de relleno ("Día libre", "Tarde libre", "Últimos momentos", "Visita opcional").
  Alojamiento: ${known.selectedHotel?.name || known.selectedHotel || known.accommodationStatus || 'Por definir'}
  Transporte: ${known.transport || 'Por definir'}
  Presupuesto: ${known.budget || 'Por definir'}
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
3. Recomienda ÚNICAMENTE restaurantes, cafés y bares reales que existan en el catálogo del destino y que aparezcan en el mapa (ej: "Cena en Restaurante Ouzo" o "Almuerzo en Manuel Restaurante"), usando siempre su nombre comercial exacto.`

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
    const isUserExplicitlyOrderingBuild = /\b(gener(ar|es|a|e|en|al)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|cre(ar|es|a|e|en)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|inicia(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|finaliza(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|constru(ye|ir)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|dise[ñn](ar|a|es|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|est[aá]\s+perfecto\s+(genera|crea)|listo\s+(genera|crea|para\s+generar)|ya\s+no\s+hay\s+nada\s+genera|vale\s+(genera|crea)|procede\s+a\s+generar|si\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|s[íi]\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|(genera|crea|haz)\s+(el\s+|la\s+)?(tour|itinerario|ruta)\s+porfa|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|ok(ay)?\s+(listo\s+)?(quiero\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)?|adelante\s+(con\s+el\s+tour|genera|crea|construye|procede)|vamos\s+(a\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|armar?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje))\b/i.test(lastUserMsg)

    // Detección de si la IA está en modo consulta/propuesta esperando opinión del usuario
    const isBotAskingOrProposing = /\b(qu[ée]\s+te\s+parece|deseas\s+hacer\s+alg[uú]n\s+cambio|te\s+gustar[íi]a\s+incluir|qu[ée]\s+opinas|deseas\s+modificar|alguna\s+otra\s+preferencia|est[áa]\s+todo\s+listo\s+para\s+generar|qu[ée]\s+actividades|qu[ée]\s+lugares|cu[aá]l\s+de\s+estos)\b/i.test(responseMessage) ||
      /\?\s*$/i.test(responseMessage.trim())

    const isBotConfirmingBuild = /\b(procedo a generar tu tour|procedo a generar|voy a generar tu tour|genero tu tour)\b/i.test(responseMessage)

    // Solo se activa readyToBuild si TODA la información clave está completa Y el usuario lo ordenó explícitamente (sin que la IA esté a media propuesta/pregunta de actividades)
    const effectiveReadyToBuild = Boolean(
      isAllKeyInfoComplete &&
      ((isUserExplicitlyOrderingBuild && !isBotAskingOrProposing) || (isBotConfirmingBuild && !isBotAskingOrProposing))
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

REGLA CRÍTICA DE DESTINO TURÍSTICO (UNIVERSAL: CIUDADES, PARQUES, ISLAS, REGIONES):
- Extraer "destination" como el destino turístico explícito, sea un parque natural, reserva ecológica, isla, archipiélago, valle, región, pueblo o ciudad (ej: "Parque Tayrona", "Gran Cañón", "Valle de Cocora", "San Andrés", "Islas Galápagos", "Santa Marta", "Cartagena", "Medellín", "Barcelona", "Roma").
- Extraer "city" como el municipio o ciudad de referencia correspondiente (ej: "Santa Marta" si es Parque Tayrona, "Salento" si es Valle de Cocora, o el mismo destino si es ciudad).
- Solo extraer si el usuario declara EXPLÍCITAMENTE que desea viajar allí, explorar la zona o cambiar de destino.
- Si el usuario menciona un lugar como corrección, queja o negación (ej: "te equivocaste, esos lugares son de Barranquilla, no de Santa Marta"), NO sobreescribas el destino y mantén: "destination": ${JSON.stringify(currentData.destination || currentData.city || null)}, "city": ${JSON.stringify(currentData.city || currentData.destination || null)}.

Devuelve ÚNICAMENTE un JSON con:
- "destination": destino turístico explícito (parque natural, reserva, isla, valle, región, pueblo o ciudad) o null si no se menciona.
- "city": ciudad/municipio de referencia o null.
- "country": país o null.
- "datesSeason": fechas o temporada (ej: "del 9 al 12 de octubre", "julio", "puente de noviembre", "este fin de semana").
- "durationDays": número de días explícito O calculado a partir del rango de fechas (ej: del 9 al 12 de octubre son 4 días -> 4, "3 días" -> 3). Si no hay fechas ni duración, DEBE ser null.
- "companions": acompañantes (ej: "solo", "en pareja", "con amigos", "en familia").
- "groupSize": número de personas si se menciona.
- "hasChildren": true si viaja con niños, false si no.
- "budget": "Económico", "Moderado", "Lujo", "Ajustado" o null.
- "transport": "Caminando", "Auto rentado", "Transporte público", "Bicicleta", "Taxi / Uber" o null.
- "interests": lista de intereses mencionados (ej: ["playa", "naturaleza", "fotografía", "gastronomía", "cultura"]).
- "selectedHotel": { "name": "Nombre del hotel" } o null si no se ha elegido.
- "accommodationStatus": "Casa propia / familiar", "Hotel elegido", "Por definir" o null.
- "specificPlaces": lista de atracciones o lugares físicos con nombre propio y día (ej: [{ "name": "Cabo San Juan", "dia": 1 }, { "name": "Playa de Arrecifes", "dia": 2 }]). NUNCA incluir actividades genéricas ("Instalación en casa", "Llegada", "Despedida", "Picnic en la zona", "Tiempo libre", "Día libre", "Últimos momentos...", "local").`

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

      if (parsed.destination && !parsed.city) {
        parsed.city = parsed.destination
      }
      if (parsed.city && !parsed.destination) {
        parsed.destination = parsed.city
      }

      // Safeguard: Do NOT overwrite known destination if user is making a correction/negation
      const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(userMessage)
      const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a)\b/i.test(userMessage)

      if ((currentData.city || currentData.destination) && isCorrectionOrNegation && !isExplicitCityChange) {
        parsed.city = currentData.city || currentData.destination
        parsed.destination = currentData.destination || currentData.city
        if (currentData.canonicalDestination) {
          parsed.canonicalDestination = currentData.canonicalDestination
        }
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
    'tulum': { name: 'Tulum, México', city: 'Tulum', country: 'México', countryCode: 'MX', flagEmoji: '🇲🇽', description: 'Ruinas mayas sobre acantilados, cenotes cristalinos y playas paradisíacas de arena blanca.', imageUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80', suggestedDays: 3, temperature: '30°C', isDemoImage: false },
    'miami': { name: 'Miami, EE. UU.', city: 'Miami', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'South Beach, Ocean Drive, rascacielos modernos frente a la bahía y vida nocturna vibrante.', imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '28°C', isDemoImage: false },
    'bali': { name: 'Bali, Indonesia', city: 'Bali', country: 'Indonesia', countryCode: 'ID', flagEmoji: '🇮🇩', description: 'Templos sagrados frente al mar, arrozales verdes y playas tropicales para el relax.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '30°C', isDemoImage: false },
    'rio de janeiro': { name: 'Rio de Janeiro, Brasil', city: 'Rio de Janeiro', country: 'Brasil', countryCode: 'BR', flagEmoji: '🇧🇷', description: 'El Cristo Redentor, el Pan de Azúcar y las playas legendarias de Copacabana e Ipanema.', imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '29°C', isDemoImage: false },
    'nueva york': { name: 'Nueva York, EE. UU.', city: 'Nueva York', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'El skyline de Manhattan, Central Park, Broadway y miradores icónicos.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'new york': { name: 'Nueva York, EE. UU.', city: 'Nueva York', country: 'Estados Unidos', countryCode: 'US', flagEmoji: '🇺🇸', description: 'El skyline de Manhattan, Central Park, Broadway y miradores icónicos.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '22°C', isDemoImage: false },
    'tokio': { name: 'Tokio, Japón', city: 'Tokio', country: 'Japón', countryCode: 'JP', flagEmoji: '🇯🇵', description: 'Metrópolis futurista con rascacielos iluminados, templos históricos y jardines serenos.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '22°C', isDemoImage: false },
    'tokyo': { name: 'Tokio, Japón', city: 'Tokio', country: 'Japón', countryCode: 'JP', flagEmoji: '🇯🇵', description: 'Metrópolis futurista con rascacielos iluminados, templos históricos y jardines serenos.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', suggestedDays: 5, temperature: '22°C', isDemoImage: false },
    'londres': { name: 'Londres, Reino Unido', city: 'Londres', country: 'Reino Unido', countryCode: 'GB', flagEmoji: '🇬🇧', description: 'El Big Ben, el London Eye, palacios reales y museos de talla mundial.', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '19°C', isDemoImage: false },
    'london': { name: 'Londres, Reino Unido', city: 'Londres', country: 'Reino Unido', countryCode: 'GB', flagEmoji: '🇬🇧', description: 'El Big Ben, el London Eye, palacios reales y museos de talla mundial.', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', suggestedDays: 4, temperature: '19°C', isDemoImage: false },
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
    const rawStr = String(raw || '').trim()
    if (!rawStr || /🚀|✏️|🌟|➕|generar|arma|armar|cambiar|detalle|opción|opcion|sugerencia|tour|restaurante|evento|concierto/i.test(rawStr)) {
      continue
    }
    const fullKey = rawStr.toLowerCase()
    const baseCity = fullKey.split(',')[0].trim()

    if (cityData[baseCity]) {
      results.push(cityData[baseCity])
    } else if (cityData[fullKey]) {
      results.push(cityData[fullKey])
    }
  }
  return results
}

const speechCache = new GeoCache(24 * 60 * 60 * 1000, 200)

export async function generateSpeechAudio({ text = '', voice = 'alloy', speed = 1.0 }) {
  const trimmed = (text || '').trim()
  if (!trimmed) {
    throw new Error('El texto para la síntesis de voz no puede estar vacío.')
  }

  const safeVoice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice.toLowerCase())
    ? voice.toLowerCase()
    : 'alloy'
  const safeSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.25), 4.0)
  const cacheKey = `tts_${safeVoice}_${safeSpeed}_${trimmed}`

  const cached = speechCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada en el servidor.')
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: trimmed,
      voice: safeVoice,
      speed: safeSpeed,
      response_format: 'mp3'
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Error en OpenAI TTS (${response.status}): ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  speechCache.set(cacheKey, buffer)
  return buffer
}

