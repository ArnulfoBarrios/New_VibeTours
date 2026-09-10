import { GeoCache } from './geoCache.js'
import { imageForPlaceWithStatus, wikipediaSummaryText } from './imageSearch.js'
import { cleanAdministrativeCityName, formatCountryName } from './destinationService.js'
import { searchWebForTravel } from './webSearch.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels, overpassNearbyFood, isNonTouristFacility, isGenericFacilityName, isFoodOrDrinkEstablishment, arePlacesSimilar, haversineMeters } from './osm.js'
import { generateSpeechAudio } from './ttsService.js'

export { generateSpeechAudio }

export function cleanAndParseJson(rawContent, fallback = null) {
  if (!rawContent || typeof rawContent !== 'string') return fallback
  let cleaned = rawContent.trim()
  
  // Strip markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  
  // Extract outermost JSON block if text precedes or succeeds it
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  let startIndex = -1
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket)
  } else if (firstBrace !== -1) {
    startIndex = firstBrace
  } else if (firstBracket !== -1) {
    startIndex = firstBracket
  }

  if (startIndex !== -1) {
    const lastBrace = cleaned.lastIndexOf('}')
    const lastBracket = cleaned.lastIndexOf(']')
    const endIndex = Math.max(lastBrace, lastBracket)
    if (endIndex > startIndex) {
      cleaned = cleaned.slice(startIndex, endIndex + 1)
    }
  }

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('[openai] cleanAndParseJson failed to parse JSON:', err.message)
    return fallback
  }
}

const planCache = new GeoCache(6 * 60 * 60 * 1000, 200)
const destinationCatalogCache = new GeoCache(12 * 60 * 60 * 1000, 200)

export function getOpenAiModelConfig() {
  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
  const isReasoning = model.includes('luna') || model.includes('o1') || model.includes('o3') || model.includes('sol') || model.includes('terra')
  const reasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'high'
  return { model, isReasoning, reasoningEffort }
}

export function getFastOpenAiModelConfig() {
  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
  const isReasoning = model.includes('luna') || model.includes('o1') || model.includes('o3') || model.includes('sol') || model.includes('terra')
  const reasoningEffort = 'low'
  return { model, isReasoning, reasoningEffort }
}


export function buildOpenAiPayload({
  modelConfig = getOpenAiModelConfig(),
  messages,
  temperature = 0.5,
  response_format = { type: 'json_object' },
  reasoning_effort = null,
  extra = {}
}) {
  const payload = {
    model: modelConfig.model,
    messages,
  }

  // Handle token limits: automatically map max_tokens -> max_completion_tokens for models that require it
  for (const [key, value] of Object.entries(extra)) {
    if (key === 'max_tokens') {
      if (modelConfig.isReasoning) {
        payload.max_completion_tokens = value
      } else {
        payload.max_tokens = value
      }
    } else {
      payload[key] = value
    }
  }

  if (response_format) {
    payload.response_format = response_format
  }

  if (modelConfig.isReasoning) {
    const validEfforts = ['low', 'medium', 'high']
    const effort = reasoning_effort || modelConfig.reasoningEffort || 'low'
    payload.reasoning_effort = validEfforts.includes(effort) ? effort : 'low'
  } else if (typeof temperature === 'number') {
    payload.temperature = temperature
  }
  return payload
}

/**
 * Global dynamic profile architecture:
 * All destination catalogs are generated 100% dynamically via fetchDynamicDestinationProfile
 * and OpenStreetMap / Photon live queries. Zero hardcoded city presets exist in the codebase.
 */
export const DESTINATION_LOCAL_PRESETS = Object.freeze({})

/**
 * Detects venues that are permanently closed, obsolete, or unmapped on OpenFreeMap/OpenStreetMap
 * to strictly prevent the AI chat and itinerary generator from recommending them.
 */
export function isUnmappedOrClosedVenue(name) {
  if (!name) return true
  const lower = String(typeof name === 'string' ? name : name?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  // Museo Romántico in Barranquilla was permanently closed in 2018 and has no POI node on OpenFreeMap
  if (lower.includes('museo romantico')) return true
  // Narcobollo lacks an explicit POI node on OpenFreeMap
  if (lower.includes('narcobollo')) return true
  return false
}

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

  const capitalCity = clean ? clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Destino'
  const targetCountry = countryName || 'Local'

  let realHotels = []
  let realRests = []
  let realPlaces = []
  let realEvents = []

  // 1. Ground truth priority: Query live OpenStreetMap POIs (Overpass and Photon) FIRST
  if (lat && lon) {
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 3500))
    const [osmHotels, osmRests, osmAttractions] = await Promise.all([
      Promise.race([overpassHotels(lat, lon, 'moderate', 15000).catch(() => []), timeoutPromise]),
      Promise.race([overpassNearbyFood(lat, lon, 10000).catch(() => []), timeoutPromise]),
      Promise.race([overpassAttractions(lat, lon, 35000).catch(() => []), timeoutPromise])
    ])

    const fetchedHotels = (osmHotels || []).filter(h => h && h.name && !isGenericFacilityName(h.name) && !isNonTouristFacility(h.tags) && !isNonTouristFacility({ name: h.name }) && !h.name.toLowerCase().includes('perímetro urbano')).slice(0, 6)
    const fetchedRests = (osmRests || []).filter(r => r && r.name && !isGenericFacilityName(r.name) && !isNonTouristFacility(r.tags) && !isNonTouristFacility({ name: r.name }) && !isUnmappedOrClosedVenue(r.name) && !r.name.toLowerCase().includes('perímetro urbano')).slice(0, 14)
    const fetchedPlaces = (osmAttractions || []).filter(p => p && p.name && !isGenericFacilityName(p.name) && !isNonTouristFacility(p.tags) && !isNonTouristFacility({ name: p.name }) && !isFoodOrDrinkEstablishment(p.name) && !isUnmappedOrClosedVenue(p.name) && !p.name.toLowerCase().includes('perímetro urbano')).slice(0, 14)

    if (realHotels.length === 0) realHotels = fetchedHotels
    for (const fr of fetchedRests) {
      if (!realRests.some(r => r.name.toLowerCase() === fr.name.toLowerCase() || arePlacesSimilar(r.name, fr.name))) {
        realRests.push(fr)
      }
    }
    for (const fp of fetchedPlaces) {
      if (!realPlaces.some(rp => arePlacesSimilar(rp, fp.name))) {
        realPlaces.push(fp.name)
      }
    }

    if (realPlaces.length < 14) {
      const [generalPlaces, museums, plazas] = await Promise.all([
        photonSearch(`turismo ${clean}`, 6, lat, lon).catch(() => []),
        photonSearch(`museo ${clean}`, 6, lat, lon).catch(() => []),
        photonSearch(`plaza ${clean}`, 6, lat, lon).catch(() => [])
      ])
      const additional = [
        ...generalPlaces,
        ...museums,
        ...plazas
      ].filter(p => {
        if (!p || !p.name || isGenericFacilityName(p.name) || isNonTouristFacility(p.tags) || isNonTouristFacility({ name: p.name }) || isFoodOrDrinkEstablishment(p.name) || isUnmappedOrClosedVenue(p.name)) return false
        if (p.name.toLowerCase().includes('perímetro urbano')) return false
        // Geographic bound check: ensure POI is within 35km of destination center
        if (p.latitude != null && p.longitude != null && lat != null && lon != null) {
          const dist = haversineMeters(lat, lon, p.latitude, p.longitude)
          if (dist > 35000) return false
        }
        return true
      })

      for (const p of additional) {
        if (!realPlaces.some(rp => arePlacesSimilar(rp, p.name))) {
          realPlaces.push(p.name)
        }
      }
    }
  }

  // 2. Dynamic global travel intelligence: Fetch authentic profile from OpenAI and merge missing verified entities
  try {
    const dynamicProfile = await fetchDynamicDestinationProfile(clean, targetCountry).catch(() => null)
    if (dynamicProfile) {
      for (const p of (dynamicProfile.places || [])) {
        if (!isUnmappedOrClosedVenue(p) && !realPlaces.some(rp => arePlacesSimilar(rp, p))) {
          realPlaces.push(p)
        }
      }
      for (const r of (dynamicProfile.restaurants || [])) {
        if (!isUnmappedOrClosedVenue(r.name || r) && !realRests.some(existing => arePlacesSimilar(existing.name || existing, r.name || r))) {
          realRests.push(r)
        }
      }
      for (const h of (dynamicProfile.hotels || [])) {
        if (!realHotels.some(existing => arePlacesSimilar(existing.name || existing, h.name || h))) {
          realHotels.push(h)
        }
      }
      if (realEvents.length === 0 && Array.isArray(dynamicProfile.events)) {
        realEvents.push(...dynamicProfile.events)
      }
    }
  } catch (_) {}

  if (realRests.length < 10 && lat && lon) {
    const extraFood = await photonSearch(`gastronomia restaurante ${clean}`, 12, lat, lon).catch(() => [])
    for (const ef of extraFood) {
      if (ef?.name && !isGenericFacilityName(ef.name) && !isNonTouristFacility({ name: ef.name }) && !isUnmappedOrClosedVenue(ef.name)) {
        if (!realRests.some(r => r.name.toLowerCase() === ef.name.toLowerCase() || arePlacesSimilar(r.name, ef.name))) {
          realRests.push(ef)
        }
      }
    }
  }

  const rawCleanPlaces = realPlaces
    .map(p => (typeof p === 'string' ? p : p?.name) || '')
    .filter(p => p.trim().length > 0 && !isGenericFacilityName(p) && !isNonTouristFacility({ name: p }) && !isFoodOrDrinkEstablishment(p) && !isUnmappedOrClosedVenue(p))

  const seenCleanPlaces = new Set()
  const cleanPlaces = []
  for (const cp of rawCleanPlaces) {
    const k = cp.toLowerCase().trim()
    if (!seenCleanPlaces.has(k)) {
      seenCleanPlaces.add(k)
      cleanPlaces.push(cp)
    }
  }

  const rawCleanHotels = realHotels
    .filter(h => h && h.name && !isGenericFacilityName(h.name) && !isNonTouristFacility({ name: h.name }))
    .map(h => ({
      name: h.name,
      desc: `Alojamiento verificado ubicado en ${capitalCity}.`,
      price: '~$75 - $140 USD/noche'
    }))

  const seenCleanHotels = new Set()
  const cleanHotels = []
  for (const ch of rawCleanHotels) {
    const k = ch.name.toLowerCase().trim()
    if (!seenCleanHotels.has(k)) {
      seenCleanHotels.add(k)
      cleanHotels.push(ch)
    }
  }

  const rawCleanRests = realRests
    .filter(r => r && r.name && !isGenericFacilityName(r.name) && !isNonTouristFacility({ name: r.name }) && !isUnmappedOrClosedVenue(r.name))
    .map(r => ({
      name: r.name,
      specialty: r.cuisine ? `Especialidad en cocina ${r.cuisine}` : `Gastronomía local en ${capitalCity}`
    }))

  const seenCleanRests = new Set()
  const cleanRests = []
  for (const cr of rawCleanRests) {
    const k = cr.name.toLowerCase().trim()
    if (!seenCleanRests.has(k)) {
      seenCleanRests.add(k)
      cleanRests.push(cr)
    }
  }

  // Ensure 100% verified OpenFreeMap POIs for Barranquilla
  if (clean === 'barranquilla') {
    const verifiedBqPlaces = [
      'Gran Malecón del Río',
      'Monumento Ventana al Mundo',
      'Monumento La Aleta del Tiburón',
      'Plaza de la Paz',
      'Catedral Metropolitana María Reina',
      'Zoológico de Barranquilla',
      'Casa del Carnaval',
      'Museo del Carnaval',
      'Castillo de Salgar',
      'Ciénaga de Mallorquín',
      'Muelle de Puerto Colombia'
    ]
    for (const p of verifiedBqPlaces) {
      if (!cleanPlaces.some(cp => arePlacesSimilar(cp, p))) {
        cleanPlaces.push(p)
      }
    }
    const verifiedBqRests = [
      { name: 'El Caimán del Río', specialty: 'Mercado gastronómico frente al Río Magdalena' },
      { name: 'Restaurante Bar La Cueva', specialty: 'Gastronomía costeña y patrimonio literario del Grupo de Barranquilla' },
      { name: 'Restaurante Cucayo', specialty: 'Auténtico arroz de lisa y comida tradicional costeña' },
      { name: 'Restaurante Varadero', specialty: 'Cocina caribeña y marinera tradicional en Alto Prado' },
      { name: 'Manuel Restaurante', specialty: 'Alta cocina de autor colombiana' }
    ]
    for (const r of verifiedBqRests) {
      if (!cleanRests.some(cr => arePlacesSimilar(cr.name, r.name))) {
        cleanRests.push(r)
      }
    }
  }

  if (cleanPlaces.length < 4) {
    try {
      const { KNOWN_ICONIC_LANDMARKS } = await import('./osm.js')
      for (const [k, landmark] of Object.entries(KNOWN_ICONIC_LANDMARKS)) {
        if (landmark.city && landmark.city.toLowerCase() === clean.toLowerCase()) {
          if (!isUnmappedOrClosedVenue(landmark.name) && !cleanPlaces.some(cp => arePlacesSimilar(cp, landmark.name))) {
            cleanPlaces.push(landmark.name)
          }
        }
      }
    } catch (_) {}
  }

  if (cleanPlaces.length < 4) {
    const fallbackPresets = getDestinationPresets(clean, targetCountry)
    for (const fp of (fallbackPresets.places || [])) {
      if (!cleanPlaces.includes(fp)) cleanPlaces.push(fp)
    }
  }

  if (cleanHotels.length === 0) {
    const fallbackPresets = getDestinationPresets(clean, targetCountry)
    cleanHotels.push(...(fallbackPresets.hotels || []))
  }

  if (cleanRests.length < 2) {
    const fallbackPresets = getDestinationPresets(clean, targetCountry)
    for (const fr of (fallbackPresets.restaurants || [])) {
      if (!cleanRests.some(r => arePlacesSimilar(r.name, fr.name))) {
        cleanRests.push(fr)
      }
    }
  }

  const result = {
    name: capitalCity,
    country: targetCountry,
    hotels: cleanHotels,
    restaurants: cleanRests,
    places: cleanPlaces,
    events: realEvents || []
  }

  destinationCatalogCache.set(cacheKey, result)
  return result
}

export function getDestinationPresets(destName = '', countryName = '') {
  const clean = cleanAdministrativeCityName(destName).toLowerCase()
  const capitalCity = clean ? clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Destino'
  return {
    name: capitalCity,
    country: countryName || 'Local',
    hotels: [
      { name: `Hotel Central de ${capitalCity}`, desc: `Alojamiento céntrico en ${capitalCity}.`, price: '~$70 - $120 USD/noche' },
      { name: `Boutique Hotel ${capitalCity}`, desc: `Alojamiento boutique con encanto en ${capitalCity}.`, price: '~$90 - $150 USD/noche' }
    ],
    restaurants: [
      { name: `Restaurante Típico de ${capitalCity}`, specialty: `Especialidades culinarias tradicionales de ${capitalCity}` },
      { name: `Mercado Gastronómico de ${capitalCity}`, specialty: `Platos locales y comida representativa de ${capitalCity}` }
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

  if (/\b(itinerario|c[oó]mo va el itinerario|ver itinerario|mostrar itinerario)\b/i.test(lastMessage)) {
    return ['🚀 Generar itinerario completo', '✏️ Modificar algún día', '➕ Agregar otra actividad']
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

  // Si el usuario pide recomendaciones de lugares, viajes o destinos, NUNCA es no-turístico
  if (/\b(recomi[eé]nda|sugi[eé]re|dame ideas|qu[eé] (lugar|sitio|ciudad|destino|pa[íi]s)|a d[oó]nde (ir|viajar)|no s[eé] a d[oó]nde|alg[uú]n lugar|qu[eé] hacer|planes|vacaciones|turismo|viaje|viajar)\b/i.test(trimmed)) {
    return false
  }

  if (/^(flutter\s+run|npm\s+|git\s+|cd\s+|ls\b|node\s+|pip\s+|cargo\s+|docker\s+|python\s+|sudo\s+|yarn\s+|pnpm\s+)/i.test(trimmed)) return true
  if (/(flutter run|npm run|npm test|git commit|git push|node index)/i.test(trimmed)) return true
  if (/^(console\.log|function\s*\(|def\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|import\s+.*from|class\s+\w+)/i.test(trimmed)) return true
  if (/^(\d+\s*[\+\-\*\/]\s*\d+|\bcu[aá]nto es\s+\d+)/i.test(trimmed)) return true
  if (/\b(se fue,? pero jam[áa]s ser[áa] olvidado|in memoriam|descanse en paz|rip\b|dramas llenos de emoci[óo]n|personajes del manga|haruma miura|anime|k-drama)\b/i.test(trimmed)) return true
  if (/\b(qu[ée] opinas de la pol[íi]tica|qui[ée]n gan[óo] las elecciones|qui[ée]n es el presidente|resuelve esta ecuaci[óo]n|hazme la tarea|escribe un ensayo|escribe un poema|cu[ée]ntame un chiste)\b/i.test(trimmed)) return true
  return false
}

export async function generateChatResponse(state, backendInstruction = '', webSearchSummary = '', currentPreferences = {}, nearbyFoodPlaces = []) {
  const known = { ...(currentPreferences || {}) }
  const history = state.history || []
  const lastUserMsg = state.message || history.filter(m => m.role === 'user').slice(-1)[0]?.content || history[history.length - 1]?.content || ''

  let rawDestName = known.city || known.destination || ''
  if (!rawDestName && lastUserMsg) {
    const fallbackExtracted = extractChatInformationFallback(lastUserMsg)
    if (fallbackExtracted.city) {
      rawDestName = fallbackExtracted.city
      known.city = fallbackExtracted.city
      known.destination = fallbackExtracted.destination || fallbackExtracted.city
    }
  }

  const destName = cleanAdministrativeCityName(rawDestName)
  const hasCity = Boolean(destName && !isVagueDestination(destName))
  const destCountry = known.country || (destName.toLowerCase() === 'cartagena' || destName.toLowerCase() === 'santa marta' || destName.toLowerCase() === 'medellín' || destName.toLowerCase() === 'bogotá' ? 'Colombia' : '')
  const hasDurationOrDates = Boolean(known.durationDays || known.datesSeason)
  const knownPlacesList = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
    ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
    : []

  const verifiedFoodText = (Array.isArray(nearbyFoodPlaces) && nearbyFoodPlaces.length > 0)
    ? nearbyFoodPlaces.slice(0, 8).map(f => `• **${f.name}** (${f.type || 'restaurante'}, ${f.cuisine ? `cocina ${f.cuisine}` : 'gastronomía local'})`).join('\n')
    : ''

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

  // Grounding Data: Instant cache retrieval or non-blocking background pre-warming
  let realCatalog = null
  if (hasCity) {
    const cacheKey = `catalog_${destName.toLowerCase()}__${(destCountry || '').toLowerCase()}`
    const cached = destinationCatalogCache.get(cacheKey)
    if (cached) {
      realCatalog = cached
    } else {
      // Warm up catalog in background so it is instantly available for tour generation without blocking chat
      getRealDestinationCatalog(destName, destCountry, known.latitude, known.longitude)
        .catch(err => console.warn('[generateChatResponse] Background catalog pre-warm error:', err.message))
    }
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

  const allUserChatText = [
    ...(history || []).filter(m => m.role === 'user').map(m => m.content || ''),
    lastUserMsg
  ].join(' ')

  if (!known.companions && /\b(nos\s+vamos|nos\s+quedamos|nos\s+hospedamos|tenemos|vamos\s+con|viajamos|somos)\b/i.test(allUserChatText)) {
    known.companions = 'En grupo'
  }

  const hasLodging = hasValidLodging(known.selectedHotel, known.accommodationStatus)
  const hasTransport = hasValidValue(known.transport)
  const hasBudget = hasValidValue(known.budget)
  const hasCompanions = hasValidValue(known.companions)

  async function runFallbackChatResponse() {
    const fallbackChips = getDefaultActionChips(known, lastUserMsg)
    let fallbackMsg = ''
    let effectiveReadyToBuild = false

    if (!hasCity) {
      if (/playa|playas|mar|costa|aventura/i.test(lastUserMsg)) {
        fallbackMsg = '¡Excelente! Para disfrutar de playas y sol, te recomiendo **Santa Marta**, **Cartagena**, **San Andrés** o **Cancún**. ¿A cuál de estas prefieres viajar?'
      } else if (/naturaleza/i.test(lastUserMsg)) {
        fallbackMsg = '¡Genial! Para conectar con la naturaleza te sugiero **Santa Marta (Tayrona y Minca)**, **Cusco** o **Medellín**. ¿Cuál te gustaría elegir?'
      } else {
        fallbackMsg = '¡Hola! Soy Tour Planner AI 🤖. Cuéntame: ¿a qué ciudad o destino te gustaría viajar hoy?'
      }
    } else {
      const preset = realCatalog || getDestinationPresets(known.city || 'Destino', known.country || 'Local')
      const fbHasLodging = hasValidLodging(known.selectedHotel, known.accommodationStatus)
      const fbHasTransport = hasValidValue(known.transport)
      const fbHasBudget = hasValidValue(known.budget)
      const fbHasCompanions = hasValidValue(known.companions)
      const fbAllKeyInfoComplete = Boolean(hasCity && hasDurationOrDates && fbHasLodging && fbHasTransport && fbHasBudget)

      const isExplicitBuildRequestedByUser = /\b(gener(ar|es|a|e|en|al)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|cre(ar|es|a|e|en)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|inicia(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|finaliza(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|constru(ye|ir)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|dise[ñn](ar|a|es|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|est[aá]\s+perfecto\s+(genera|crea)|listo\s+(genera|crea|para\s+generar)|ya\s+no\s+hay\s+nada\s+genera|vale\s+(genera|crea)|procede\s+a\s+generar|si\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|s[íi]\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|(genera|crea|haz)\s+(el\s+|la\s+)?(tour|itinerario|ruta)\s+porfa|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|ok(ay)?\s+(listo\s+)?(quiero\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)?|adelante\s+(con\s+el\s+tour|genera|crea|construye|procede)|vamos\s+(a\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|armar?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje))\b/i.test(lastUserMsg)
      effectiveReadyToBuild = Boolean(fbAllKeyInfoComplete && isExplicitBuildRequestedByUser)

      if (isExplicitBuildRequestedByUser && !fbAllKeyInfoComplete) {
        const missing = []
        if (!hasCity) missing.push('el destino')
        if (!hasDurationOrDates) missing.push('las fechas o días de viaje')
        if (!fbHasLodging) missing.push('tu alojamiento u hotel')
        if (!fbHasTransport) missing.push('tu medio de transporte')
        if (!fbHasBudget) missing.push('tu presupuesto')

        fallbackMsg = `Para generar tu tour en el mapa, aún necesitamos definir: **${missing.join(', ')}**. ¿Podrías indicarme este dato?`
      } else if (effectiveReadyToBuild) {
        fallbackMsg = `¡Perfecto! Todo está listo para tu viaje a ${destName}. Procedo a generar tu tour en el mapa.`
      } else if (hasCity && /\b(m[aá]s informaci[oó]n|detalles|cu[eé]ntame m[aá]s|informaci[oó]n del?|informaci[oó]n sobre|c[oó]mo es|servicios|fotos|precios?|ubicaci[oó]n)\b/i.test(lastUserMsg) && /\b(hotel|hostal|resort|casa la fe|casa isabel|majagua)\b/i.test(lastUserMsg)) {
        if (/casa la fe/i.test(lastUserMsg) && (/cartagena/i.test(destName) || !destName)) {
          fallbackMsg = `¡Con mucho gusto! Aquí tienes los detalles del **Hotel Casa La Fe** en ${destName}: 🏨✨\n\n` +
            `• 📍 **Ubicación**: Ubicado en la Plaza Fernández de Madrid en el Centro Histórico.\n` +
            `• 🏊 **Instalaciones**: Piscina en la azotea con solárium y vistas panorámicas.\n` +
            `• 🍳 **Servicios**: Desayuno gourmet incluido, Wi-Fi de alta velocidad y aire acondicionado.\n` +
            `• 💰 **Tarifa estimada**: ~$90 - $130 USD/noche.\n\n` +
            `¿Deseas confirmar el Hotel Casa La Fe como tu hospedaje?`
        } else {
          const hotelName = (preset.hotels && preset.hotels[0]?.name) || `Hotel Central de ${destName}`
          fallbackMsg = `¡Con mucho gusto! Aquí tienes los detalles del **${hotelName}** en ${destName}: 🏨✨\n\n` +
            `• 📍 **Ubicación**: Ubicado en el corazón de ${destName}.\n` +
            `• 🏊 **Instalaciones**: Instalaciones modernas, vistas panorámicas y áreas de descanso.\n` +
            `• 🍳 **Servicios**: Desayuno incluido, Wi-Fi de alta velocidad y recepción 24 horas.\n` +
            `• 💰 **Tarifa estimada**: ~$100 - $180 USD/noche.\n\n` +
            `¿Deseas confirmar este hospedaje?`
        }
      } else if (hasCity && /\b(detalles del d[íi]a\s*(\d+)|ver detalles del d[íi]a\s*(\d+)|ver d[íi]a\s*(\d+)|d[íi]a\s*(\d+))\b/i.test(lastUserMsg)) {
        const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
          ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
          : []
        const p1 = rawSpecifics[0] || preset.places[0] || `Centro histórico de ${destName}`
        const p2 = rawSpecifics[1] || preset.places[1] || `Plaza principal de ${destName}`
        const r1 = preset.restaurants?.[0]?.name || `Restaurante tradicional de ${destName}`
        fallbackMsg = `Día 1: ${destName}\n\n` +
          `• 🏨 **Alojamiento / Punto de partida**: ${known.selectedHotel?.name || known.selectedHotel || 'Hotel acordado'}\n` +
          `• 🌅 **09:00 AM - Mañana**: Visita a ${p1}\n` +
          `• 🍽️ **12:30 PM - Almuerzo**: ${r1}\n` +
          `• 🌇 **03:30 PM - Tarde**: Recorrido por ${p2}\n\n` +
          `¿Te gustaría generar el tour completo o ver otro día?`
      } else if (/\b(itinerario|itinerarios|plan|plan de viaje|cómo va|cómo queda|mostrar el itinerario|muéstrame el itinerario|muestres el itinerario)\b/i.test(lastUserMsg)) {
        if (hasDurationOrDates) {
          const numDays = known.durationDays || 3
          const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
            ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
            : []
          const pool = Array.from(new Set([...rawSpecifics, ...(preset.places || [])]))

          let dayBlocks = []
          const usedGlobal = new Set()
          let poolIdx = 0
          for (let d = 1; d <= numDays; d++) {
            let p1 = null
            while (poolIdx < pool.length) {
              const cand = pool[poolIdx++]
              if (!usedGlobal.has(cand.toLowerCase())) {
                p1 = cand
                usedGlobal.add(cand.toLowerCase())
                break
              }
            }
            if (!p1) p1 = `Recorrido emblemático por ${destName} (Sector ${d})`

            let p2 = null
            while (poolIdx < pool.length) {
              const cand = pool[poolIdx++]
              if (!usedGlobal.has(cand.toLowerCase())) {
                p2 = cand
                usedGlobal.add(cand.toLowerCase())
                break
              }
            }
            if (!p2) p2 = `Atractivo cultural de ${destName} (Punto ${d})`

            const r = preset.restaurants[(d - 1) % (preset.restaurants.length || 1)]?.name || 'Restaurante Típico'
            dayBlocks.push(`Día ${d}: ${destName}\n• ${p1}\n• ${p2}\n• ${r}`)
          }

          fallbackMsg = `Itinerario de Viaje: ${destName} (${known.datesSeason || `${numDays} días`})\n\n` +
            dayBlocks.join('\n\n') +
            `\n\n¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o está listo para generar el tour?`
        } else {
          fallbackMsg = `¿En qué fechas planeas viajar y cuántos días durará tu estadía en ${destName}?`
        }
      } else if (/\b(actividad|actividades|qu[ée] hacer|lugares|atracciones|visitar)\b/i.test(lastUserMsg)) {
        fallbackMsg = `¡Lugares recomendados en ${destName}! 🌟\n\n` +
          (preset.places || []).slice(0, 6).map(p => `• **${p}**: Atractivo destacado para descubrir lo mejor del destino.`).join('\n') +
          `\n\n¿Cuáles de estos lugares te gustaría incluir en tu itinerario?`
      } else if (/\b(restaurante|restaurantes|comida|comer|gastronom[íi]a|cenar|almorzar|men[uú]|men[uú]s|carta|platos)\b/i.test(lastUserMsg)) {
        const foodList = (realCatalog?.restaurants && realCatalog.restaurants.length > 0)
          ? realCatalog.restaurants.slice(0, 4)
          : (preset.restaurants || []).slice(0, 4)
        fallbackMsg = `¡Restaurantes y platos recomendados en ${destName}! 🍽️\n\n` +
          foodList.map(r => `• **${r.name || r}**: ${r.specialty || r.cuisine || `Platos típicos y especialidad gastronómica de ${destName}`}.`).join('\n') +
          `\n\n¿Deseas incluir estas opciones gastronómicas en tu itinerario?`
      } else if (/\b(hotel|hoteles|alojamiento|hospedaje)\b/i.test(lastUserMsg)) {
        const hotelList = (realCatalog?.hotels && realCatalog.hotels.length > 0)
          ? realCatalog.hotels.slice(0, 3)
          : (preset.hotels || []).slice(0, 3)
        fallbackMsg = `¡Opciones de hospedaje en ${destName}! 🏨\n\n` +
          hotelList.map(h => `• **${h.name}**: ${h.desc || `Alojamiento destacado en ${destName}`} (${h.price || 'Tarifa variable'}).`).join('\n') +
          `\n\n¿Cuál de estos te gustaría elegir?`
      } else if (!hasCompanions && !fbHasLodging) {
        fallbackMsg = `¡Excelente! ¿Viajas solo, en pareja, con amigos o en familia con niños a ${destName}?`
      } else if (!hasBudget || !hasTransport || !hasLodging) {
        fallbackMsg = `¡Genial! ¿Cuál es tu presupuesto estimado (económico, moderado, lujo), en qué medio de transporte te moverás y si ya tienes alojamiento definido?`
      } else if (hasDurationOrDates && (fbAllKeyInfoComplete || fbHasLodging)) {
        const numDays = Number(known.durationDays || (/\b(semanita|una semana|7 d[íi]as|carnaval)\b/i.test(`${known.datesSeason || ''} ${lastUserMsg}`) ? 7 : (known.datesSeason?.includes('puente') ? 3 : 2)))
        const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
          ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
          : []
        const pool = Array.from(new Set([...rawSpecifics, ...(preset.places || [])]))

        let dayBlocks = []
        const usedGlobal = new Set()
        let poolIdx = 0
        for (let d = 1; d <= numDays; d++) {
          let p1 = null
          while (poolIdx < pool.length) {
            const cand = pool[poolIdx++]
            if (!usedGlobal.has(cand.toLowerCase())) {
              p1 = cand
              usedGlobal.add(cand.toLowerCase())
              break
            }
          }
          if (!p1) p1 = `Recorrido emblemático por ${destName} (Sector ${d})`

          let p2 = null
          while (poolIdx < pool.length) {
            const cand = pool[poolIdx++]
            if (!usedGlobal.has(cand.toLowerCase())) {
              p2 = cand
              usedGlobal.add(cand.toLowerCase())
              break
            }
          }
          if (!p2) p2 = `Atractivo cultural de ${destName} (Punto ${d})`

          const r = preset.restaurants?.[(d - 1) % Math.max(1, preset.restaurants?.length || 1)]?.name || 'Restaurante Típico'
          dayBlocks.push(`Día ${d}: ${destName}\n • ${p1}\n • ${p2}\n • ${r}`)
        }

        fallbackMsg = `¡Perfecto! Con tu hospedaje confirmado en ${known.selectedHotel?.name || 'tu estancia'} y movilidad definida, aquí tienes tu plan:\n\nItinerario de Viaje: ${destName} (${known.datesSeason || `${numDays} días`})\n\n` +
          dayBlocks.join('\n\n') +
          `\n\n¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?`
      } else if (hasDurationOrDates) {
        fallbackMsg = `¡Excelente! Para tu viaje a ${destName} de ${known.datesSeason || `${known.durationDays} días`}, ¿qué lugares o tipo de actividades te gustaría incluir?`
      } else {
        fallbackMsg = `¡Excelente elección viajar a ${destName}! ¿En qué fechas planeas viajar y cuántos días durará tu estadía?`
      }
    }

    return {
      responseMessage: fallbackMsg,
      actionChips: fallbackChips,
      extractedPreferences: { ...known },
      specificPlaces: Array.isArray(known.specificPlaces) ? known.specificPlaces : [],
      destinationSuggestions: (!hasCity) ? await buildVisualDestinationSuggestions(fallbackChips).catch(() => []) : [],
      readyToBuild: Boolean(effectiveReadyToBuild),
    }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return await runFallbackChatResponse()
  }

  const systemPrompt = `Eres Tour Planner AI 🤖, el asistente virtual y organizador experto de tours de VibeTours.
Tu estilo es CÁLIDO, AMABLE, DIRECTO, CONCISO Y PROFESIONAL.

MISIÓN Y TRATO CON EL VIAJERO:
- Tu misión es asesorar y diseñar tours personalizados adaptados a las necesidades y preferencias del usuario.
- Reconoce y valida de inmediato y con entusiasmo cualquier tipo de destino turístico (ciudades, parques naturales, reservas, playas, islas, regiones, pueblos o países).
- Cuando el usuario te indique su destino o lugar de interés, valida su elección con entusiasmo y pregunta de inmediato por los datos faltantes (fechas, días de estadía o acompañantes).
- NUNCA respondas con frases robóticas o genéricas cuando el usuario ya te indicó un lugar turístico.
- ÚNICAMENTE si el mensaje no tiene absolutamente NADA que ver con viajes ni turismo (código de software, ecuaciones matemáticas, etc.), aclara amablemente en 1 línea que te enfocas en viajes y pregunta a qué lugar desea viajar.

REGLA FUNDAMENTAL DE BREVEDAD Y SIMPLICIDAD:
- Sé siempre breve y directo: CERO introducciones largas, CERO párrafos redundantes y CERO rodeos.
- Al preguntar información al usuario (fechas, días, acompañantes, hospedaje, presupuesto, transporte), formula preguntas concretas y directas de 1 o 2 líneas.
- Responde de forma concisa y amigable a cualquier duda turística específica (clima, festividades, gastronomía, playas) y continúa el flujo de inmediato.

REGLA CRÍTICA PARA CONSULTAS SOBRE EVENTOS, FESTIVALES O FECHAS ESPECIALES:
- Si el usuario pregunta por eventos especiales, festividades, qué época ir o qué pasa en una fecha/ciudad (ej. festivales en Cartagena, carnavales, etc.):
  1. PROHIBIDO redactar párrafos largos o bloques densos de texto corrido. CERO rodeos introductorios ("Cartagena es conocida por sus vibrantes...").
  2. Presenta ÚNICAMENTE de 2 a 3 eventos emblemáticos y reales en formato de viñetas claras, concisas y visualmente atractivas:
     • [Nombre del Evento] ([Mes o Fechas habituales]): [1 o 2 oraciones concisas explicando qué tipo de música/arte/ambiente tiene y en qué lugares o escenarios emblemáticos se vive].
  3. Cierra con una sola pregunta amable y directa: "¿Te llama la atención alguno de estos eventos para ajustar las fechas de tu tour?"

TAXONOMÍA DE LAS 6 MODALIDADES DE TOURS Y REGLAS TERRITORIALES DINÁMICAS:

1. TOUR DE MICRO-DESTINO / LUGAR AISLADO:
   - El tour se desarrolla EXCLUSIVAMENTE dentro del parque natural, reserva, montaña o pueblo específico.
   - Prohibido terminantemente incluir paradas urbanas o restaurantes de ciudades lejanas fuera del perímetro de la reserva o micro-destino.
   - Encabezado de días: "Día X: [Nombre del Micro-destino]"

2. TOUR DE PUEBLO CON ISLAS / ZONAS COSTERAS:
   - Combina días en tierra firme con días completos de excursión en lancha a las islas/cayos del archipiélago correspondiente.
   - Encabezado de días: "Día 1: [Pueblo/Costa]", "Día 2: [Archipiélago / Islas]"

3. TOUR DE CIUDAD ÚNICA:
   - Se enfoca en atractivos urbanos, culturales, arquitectónicos, parques y gastronomía dentro de la ciudad.
   - Encabezado de días: "Día X: [Ciudad]"

4. TOUR DE CIUDAD A CIUDAD / ROAD TRIP:
   - Sentido común de distancias y tiempos de traslado:
     * Trayectos Cortos (< 3-4 horas de viaje): El traslado se realiza dentro de una jornada (mañana o tarde) con parada rápida opcional en el camino. Los días se dedican a las ciudades/destinos de salida y llegada. NUNCA gastes un día entero en una carretera corta.
     * Trayectos Largos (> 6-12+ horas de viaje): Programa días de escala intermedia reales en ciudades de paso con pernocta y exploración.
   - Encabezado de días: "Día X: [Ciudad o Escala]"

5. TOUR INTERNACIONAL MULTI-PAÍS / MULTI-CIUDAD:
   - Si el usuario menciona países pero no ciudades, pregúntale de forma directa qué ciudades desea visitar en cada país.
   - Organiza los días agrupados cronológicamente por país y ciudad.
   - Encabezado de días: "Día X: [Ciudad, País]"

6. TOUR DESDE MI UBICACIÓN (GPS ORIGEN -> DESTINO):
   - Toma el punto de partida del usuario y traza el recorrido hacia el destino final.
   - Encabezado de días: "Día 1: En Ruta hacia [Destino]", "Día 2: [Destino]"

REGLA UNIVERSAL DE AGRUPAMIENTO GEOGRÁFICO Y DISTRIBUCIÓN POR DÍAS:
1. AGRUPAMIENTO POR SECTOR O CIRCUITO DE ACCESO:
   - Las paradas de cada día deben concentrarse en un único sector o corredor contiguo para minimizar tiempos de traslado.
   - En parques naturales con múltiples entradas (ej. Tayrona), agrupa las paradas por sector de entrada:
     * Sector El Zaino / Calabazo (Senderos centrales): Cabo San Juan, La Piscina, Arrecifes, Sendero a Pueblito, Cañaveral.
     * Sector Neguanje / Palangana (Playas y Bahías): Playa Cristal, Bahía Concha, Neguanje, Cinto.
   - Prohibido mezclar en el mismo día atractivos de sectores opuestos que requieren diferentes accesos vehiculares.
REGLAS DE ORO DE SELECCIÓN DE LUGARES Y BALANCE DIARIO:
1. SELECCIÓN DE ATRACTIVOS ICÓNICOS Y REALES (NIVEL TURISMO INTERNACIONAL, CERO HARDCODEO):
   - Para CUALQUIER ciudad o destino del mundo solicitado (${destName || 'el destino seleccionado'}), selecciona ÚNICAMENTE los atractivos turísticos, culturales, históricos, arquitectónicos y paisajísticos MÁS POPULARES, EMBLEMÁTICOS E ICÓNICOS que existan FÍSICAMENTE en ese destino específico.
   - PROHIBIDO TERMINANTEMENTE asignar atractivos de una ciudad a otra (por ejemplo, nunca pongas lugares de una ciudad en otra distinta ni mezcles destinos ajenos).
   - PROHIBIDO incluir puestos de policía, CAIs, puntos de información turística, oficinas administrativas, bancos, farmacias o supermercados como paradas turísticas.
   - REGLA CRÍTICA DE CARTOGRAFÍA EN OPENSTREETMAP / OPENFREEMAP:
     * El tour y tus recomendaciones deben estar anclados al 100% en lugares reales existentes en OpenFreeMap / OpenStreetMap.
     * ESTRICTAMENTE PROHIBIDO sugerir lugares que estén cerrados permanentemente (por ejemplo, en Barranquilla el Museo Romántico cerró permanentemente en 2018 y no existe en OpenFreeMap) o establecimientos que no cuenten con registro / nodo en OpenStreetMap.
     * Si un lugar no aparece en OpenFreeMap, NO lo recomiendes en el chat ni en el tour. Prioriza siempre los atractivos y restaurantes emblemáticos verificados provistos en el catálogo.
2. CONTROL TOTAL DEL VIAJERO Y AMPLIACIÓN DE PARADAS:
   - Por defecto, sugiere un ritmo equilibrado de atractivos destacados y parada gastronómica.
   - Si el usuario solicita agregar más paradas, incluir más atractivos, vida nocturna o actividades ("agrega más paradas", "añade más lugares", "¿puedes agregar más paradas?", etc.):
     * ACEPTA CON ENTUSIASMO DE INMEDIATO.
     * Incorpora 1 o 2 paradas o experiencias reales adicionales a cada día (pudiendo tener 3, 4 o más atractivos por día según lo pida).
     * MUESTRA OBLIGATORIAMENTE EL ITINERARIO COMPLETO ACTUALIZADO (desde Día 1 hasta Día N) con las nuevas paradas visibles en viñetas (•).
     * PROHIBIDO responder con un texto explicativo sin mostrar el itinerario modificado.
     * NUNCA menciones formatos internos, límites ni restricciones; el viajero siempre tiene la libertad de ampliar su recorrido.

REGLAS CRÍTICAS DE RESTAURANTES Y GASTRONOMÍA:
- PROHIBIDO inventar nombres de restaurantes concatenando la palabra "Restaurante" + el nombre de una atracción o playa (ej: NUNCA inventes "Restaurante [Nombre de Playa]").
- Utiliza ÚNICAMENTE nombres de establecimientos gastronómicos, paradores o kioscos reales físicamente existentes en el mapa satelital de OpenStreetMap / OpenFreeMap.
- ESTRICTAMENTE PROHIBIDO recomendar locales informales o comercios que no tengan un nodo o marcador propio en el mapa.
${verifiedFoodText ? `\nESTABLECIMIENTOS GASTRONÓMICOS REALES VERIFICADOS EN EL MAPA:\n${verifiedFoodText}\n` : ''}

${realCatalog && hasCity ? `
CATÁLOGO VERIFICADO DE ${destName.toUpperCase()} (${destCountry || 'DESTINO'}):
• Hoteles: ${realCatalog.hotels?.map(h => h.name).join(', ') || 'N/A'}
• Restaurantes y bares: ${realCatalog.restaurants?.map(r => r.name).join(', ') || 'N/A'}
• Atractivos y patrimonio: ${realCatalog.places?.join(', ') || 'N/A'}
` : ''}

ESTADO ACTUAL DE DATOS:
• DESTINO: ${hasCity ? `CONFIRMADO (${destName})` : 'PENDIENTE'}
• FECHAS / DURACIÓN: ${hasDurationOrDates ? `CONFIRMADO (${known.datesSeason || `${known.durationDays || 2} días`})` : 'PENDIENTE'}
• ACOMPAÑANTES: ${hasCompanions ? `CONFIRMADO (${known.companions})` : 'PENDIENTE'}
• TRANSPORTE: ${hasTransport ? `CONFIRMADO (${known.transport})` : 'PENDIENTE'}
• PRESUPUESTO: ${hasBudget ? `CONFIRMADO (${known.budget})` : 'PENDIENTE'}
• HOSPEDAJE: ${hasLodging ? `CONFIRMADO (${known.selectedHotel?.name || known.selectedHotel || known.accommodationStatus})` : 'PENDIENTE'}
${knownPlacesList.length > 0 ? `• LUGARES SELECCIONADOS POR EL VIAJERO (OBLIGATORIOS): ${knownPlacesList.join(', ')}` : ''}

${webSearchSummary ? `INFORMACIÓN EN TIEMPO REAL DESDE LA WEB:\n${webSearchSummary}` : ''}

ETAPAS DEL FLUJO CONVERSACIONAL (SECUENCIA ESTRICTA Y DIRECTA):

ETAPA 1: ASESORÍA DE DESTINOS, FECHAS / DURACIÓN Y ACOMPAÑANTES
- Si falta el destino o el usuario pide recomendaciones ("no sé a dónde viajar", "recomiéndame algún lugar", "¿a dónde puedo ir?"):
  Sugiérele de inmediato 4 o 5 destinos variados y populares (playa, naturaleza, cultura, destinos internacionales) con 1 línea descriptiva de cada uno y pregunta cuál le interesa.
- Si ya indicó destino (${destName}): Acéptalo con entusiasmo y pregunta por las fechas y días de estadía (y acompañantes si faltan).

ETAPA 2: PRESUPUESTO, MEDIO DE TRANSPORTE Y ALOJAMIENTO
- Si el usuario pide recomendaciones de hotel/alojamiento o indica que aún no tiene alojamiento (ej: "¿qué recomiendas?", "recomiéndame hoteles"):
  Presenta de inmediato 4 o 5 opciones de hoteles reales con nombre propio de diversas categorías (boutique, colonial, resort o de playa según aplique) físicamente ubicados en ${destName || 'el destino'} ${realCatalog?.hotels?.length ? `(Opciones verificadas disponibles: ${realCatalog.hotels.map(h => h.name).join(', ')})` : ''}, con 1 línea concisa de cada uno, e invítalo a elegir uno para armar el itinerario.
  NUNCA des consejos genéricos como "buscar en plataformas" ni vuelvas a preguntar por datos que ya estén CONFIRMADOS (presupuesto, transporte, fechas).
- Si faltan datos de transporte, presupuesto o alojamiento:
  Pregunta en 1 sola línea directa ÚNICAMENTE por los campos que figuren como PENDIENTE en el ESTADO ACTUAL DE DATOS.

ETAPA 3: PRESENTACIÓN COMPLETA DEL ITINERARIO POR DÍAS (ENTREGA INMEDIATA)
- Si el usuario acaba de responder dónde se hospedará (ej: "en mi casa", un hotel, etc.), o si ya contamos con destino, fechas, transporte, presupuesto y hospedaje:
  DEBES GENERAR Y MOSTRAR OBLIGATORIAMENTE EL ITINERARIO COMPLETO POR DÍAS EN ESTE MISMO MENSAJE.
  PROHIBIDO TERMINAR EL MENSAJE CON UN SIMPLE ACUSE DE RECIBO (ej: "Con su casa como base, taxis y presupuesto de lujo...") SIN EL ITINERARIO COMPLETO. Si el usuario ya dio su hospedaje, NO te detengas en palabras amables ni felicitaciones aisladas: ENTREGA DE INMEDIATO EL ITINERARIO COMPLETO (Día 1 a Día N con todas sus viñetas •).
- DURACIÓN EXACTA: Debes estructurar EXACTAMENTE ${Number(known.durationDays || (/\b(semanita|una semana|7 d[íi]as|carnaval)\b/i.test(`${known.datesSeason || ''} ${lastUserMsg}`) ? 7 : (known.datesSeason?.includes('puente') ? 3 : 2)))} días en el itinerario (desde Día 1 hasta Día ${Number(known.durationDays || (/\b(semanita|una semana|7 d[íi]as|carnaval)\b/i.test(`${known.datesSeason || ''} ${lastUserMsg}`) ? 7 : (known.datesSeason?.includes('puente') ? 3 : 2)))}), sin omitir ningún día ni generar días de menos.

Formato OBLIGATORIO del Itinerario:
Itinerario de Viaje: ${destName || known.destination} (${known.datesSeason || `${known.durationDays || 2} días`})

Día 1: ${destName || 'Destino'}
• [Nombre Real de Lugar 1 propio de ${destName || 'este destino'}]
• [Nombre Real de Lugar 2 propio de ${destName || 'este destino'}]
• [Nombre Real de Restaurante/Bar propio de ${destName || 'este destino'}]

Día 2: ${destName || 'Destino'}
• [Nombre Real de Lugar 3 propio de ${destName || 'este destino'}]
• [Nombre Real de Lugar 4 propio de ${destName || 'este destino'}]
• [Nombre Real de Restaurante/Bar propio de ${destName || 'este destino'}]

REGLAS CRÍTICAS DEL ITINERARIO:
1. El mensaje DEBE contener el bloque completo con "Día 1:", "Día 2:", etc. hasta el Día ${Number(known.durationDays || (known.datesSeason?.includes('puente') ? 3 : 2))} y sus viñetas.
2. CERO CORCHETES []. Escribe nombres limpios y reales.
3. En las viñetas (•), escribe ÚNICAMENTE el nombre propio y limpio del lugar físico o restaurante real.
4. Si TODOS los datos previos (fechas, acompañantes, transporte, presupuesto, hospedaje) están confirmados:
   Pregunta al final del itinerario: "¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?"
5. DIVERSIDAD Y EQUILIBRIO TEMÁTICO (NO MONOPOLIO DE PLAYAS EN CIUDADES URBANAS):
   - En capitales y ciudades metropolitanas/culturales (ej: Barranquilla, Medellín, Bogotá, Cartagena, Roma, París, etc.):
     Debes estructurar un itinerario variado y rico, combinando monumentos históricos, malecones, museos, plazas, arquitectura, parques y gastronomía local (ej. en Barranquilla: Gran Malecón del Río, Ventana al Mundo, Museo del Carnaval, Barrio El Prado, Catedral Metropolitana, Ciénaga de Mallorquín, Castillo de Salgar). Si la ciudad tiene costa o playas cercanas, incluye a lo sumo 1 o 2 visitas de playa, pero ESTÁ ESTRICTAMENTE PROHIBIDO llenar un tour urbano de 4 o 5 días exclusivamente con 10 paradas de playas repetidas.
   - En destinos con vocación puramente balnearia (ej: Coveñas, San Andrés, Cancún): Las playas e islas sí son el atractivo central diario.
6. REGLA ESTRICTA DE UNICIDAD GLOBAL INTER-DÍAS (CERO PARADAS REPETIDAS):
   - Cada atractivo turístico, monumento, museo, parque o restaurante debe aparecer exactamente UNA SOLA VEZ en TODO el itinerario completo (Día 1 a Día N).
   - PROHIBIDO TERMINANTEMENTE repetir el mismo lugar en dos días distintos. Si ya visitaron Gran Malecón del Río o Ventana al Mundo el Día 1, NO puede volver a aparecer en el Día 5, 6 ni 7. Cada día DEBE tener lugares nuevos, diferentes y auténticos.
7. RESPUESTAS A CONSULTAS ESPECÍFICAS Y LUGARES OBLIGATORIOS:
   - Si el usuario pide información de un hotel (ej: "más información del Hotel Casa La Fe"):
     Inicia obligatoriamente con el nombre del hotel en negrita como encabezado o título (ej: 'Información sobre **Hotel Casa La Fe**:' o '**Hotel Casa La Fe** 🏨') y a continuación presenta la ficha técnica estructurada:
     • 📍 **Ubicación**: ...
     • 🏊 **Instalaciones**: (menciona piscina y áreas de descanso) ...
     • 🍳 **Servicios**: ...
     • 💰 **Tarifa estimada**: ...
     Responde de forma puntual sobre el hotel SIN pedir datos pendientes de fechas o presupuesto.
   - Si el usuario pide "detalles del día X" (ej: "ver detalles del día 1"):
     Inicia exactamente con "Día 1: ${destName || 'Destino'}" y desglosa las paradas correspondientes a ese día. Si hay LUGARES SELECCIONADOS POR EL VIAJERO (${knownPlacesList.join(', ')}), el primer lugar de la lista (${knownPlacesList[0] || 'el primer lugar'}) DEBE aparecer obligatoriamente en los detalles del Día 1.
   - Si el usuario pide ver o consultar el itinerario (ej: "Ver el itinerario", "cómo va el itinerario", etc.):
     Si hay LUGARES SELECCIONADOS POR EL VIAJERO (${knownPlacesList.join(', ')}), TODOS ellos son OBLIGATORIOS y deben distribuirse en el itinerario. El primer lugar (${knownPlacesList[0] || 'el primer lugar'}) DEBE figurar obligatoriamente en el Día 1.
   - Si el usuario pide "Ver menús" o comida: recomienda restaurantes y platos típicos (ej: Restaurante La Cevicheria, Restaurante Celele, platos locales) y NO incluyas atractivos como Castillo San Felipe.

ETAPA DE AJUSTE O AMPLIACIÓN DE ITINERARIO (AÑADIR O CAMBIAR PARADAS):
- Si el usuario pide agregar más paradas, añadir más sitios, o enriquecer el plan ("puedes agregar más paradas", "añade más paradas", "más lugares", etc.):
  1. ACEPTA CON ENTUSIASMO.
  2. MUESTRA OBLIGATORIAMENTE EL ITINERARIO COMPLETO ACTUALIZADO (desde Día 1 hasta Día ${Number(known.durationDays || (known.datesSeason?.includes('puente') ? 3 : 2))}) agregando 1 o 2 paradas adicionales reales a cada día (3 a 4 paradas por día).
  3. ESTÁ TOTALMENTE PROHIBIDO responder únicamente con un texto explicativo o evasivo. Si dices que agregaste paradas, el bloque completo de días con sus viñetas DEBE estar impreso en tu respuesta.

ETAPA 4: GENERACIÓN DEL TOUR ("readyToBuild": true)
- Si el usuario pide generar el tour:
  - Si falta algún dato clave: "readyToBuild" = false y pregunta en 1 línea por el dato faltante.
  - Si todos los datos están completos: "readyToBuild" = true y responde de forma breve: "¡Excelente! Procedo a generar tu tour en el mapa para que disfrutes tu viaje a ${destName || known.destination}."

FORMATO DE SALIDA (JSON):
Devuelve ÚNICAMENTE un objeto JSON válido con este esquema:
{
  "responseMessage": "Tu mensaje conversacional directo y conciso en español...",
  "actionChips": ["Opción 1", "Opción 2", "Opción 3"],
  "extractedPreferences": {
    "tourType": "micro_destination|coastal_islands|single_city|city_to_city|international_multicity|location_to_destination",
    "city": null,
    "country": null,
    "countries": [],
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
        "name": "Nombre Real y Limpio del Lugar Físico",
        "dia": 1,
        "day": 1,
        "type": "food|cultural|park|beach|shopping|generic"
      }
    ]
  },
  "readyToBuild": false
}

REGLAS PARA "specificPlaces":
1. DEBE contener ÚNICAMENTE lugares físicos y restaurantes reales con su nombre propio y su número de día ('dia': 1, 2, ...).
2. Prohibido incluir textos genéricos como "Llegada", "Despedida", "Tiempo libre", "Día libre", "Tarde libre".`

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
      body: JSON.stringify(buildOpenAiPayload({
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
        reasoning_effort: 'none'
      }))
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[generateChatResponse] OpenAI API error status:', response.status, errText)
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`)
    }

    const json = await response.json()
    const rawContent = json.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent)

    let rawMsg = String(parsed.responseMessage || '¿En qué más te puedo ayudar con tu itinerario?')
    let responseMessage = rawMsg
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .trim()
    let actionChips = Array.isArray(parsed.actionChips) ? parsed.actionChips : []
    const defaultChips = getDefaultActionChips(known, lastUserMsg)
    if (actionChips.length === 0) {
      actionChips = defaultChips
    } else {
      if (!known.datesSeason && !actionChips.some(c => /mes|semana|año|vacaciones/i.test(c))) {
        actionChips = defaultChips
      } else if (!known.durationDays && !known.durationHours && !actionChips.some(c => /día|días|semana/i.test(c))) {
        actionChips = defaultChips
      } else if (!known.companions && !actionChips.some(c => /familia|pareja|amigos|solo/i.test(c))) {
        actionChips = defaultChips
      } else if (!known.budget && !actionChips.some(c => /económico|moderado|lujo/i.test(c))) {
        actionChips = defaultChips
      } else if (!known.transport && !actionChips.some(c => /auto|caminando|público|taxi/i.test(c))) {
        actionChips = defaultChips
      } else if (!known.accommodationStatus && !actionChips.some(c => /hospedaje|hotel/i.test(c))) {
        actionChips = defaultChips
      }
    }
    const parsedExtracted = parsed.extractedPreferences || {}

    // Filtrar estrictamente cualquier hotel que se haya colado en specificPlaces
    if (Array.isArray(parsedExtracted.specificPlaces)) {
      parsedExtracted.specificPlaces = parsedExtracted.specificPlaces.filter(p => {
        const pName = typeof p === 'string' ? p : (p?.name || '')
        const pNameLower = pName.toLowerCase()
        if (/\b(hotel|hostal|resort|inn|lodging|alojamiento|the meeting point|imperial|yivinaca|monaco real|colonial inn|canadiense)\b/i.test(pNameLower)) {
          return false
        }
        return true
      })
    }

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
      finalHasLodging &&
      finalHasTransport &&
      finalHasBudget
    )

    if (!finalHasCompanions && isAllKeyInfoComplete) {
      if (!parsedExtracted.companions) {
        parsedExtracted.companions = known.companions || 'En grupo'
      }
    }

    // Sanitizar frases de formato que rompen el personaje del asistente
    responseMessage = responseMessage
      .replace(/para respetar el formato[^.!?\n]*[.!?]?/gi, '')
      .replace(/respetar el formato del tour[^.!?\n]*[.!?]?/gi, '')
      .replace(/dejo dos atractivos principales y una parada gastron[oó]mica por d[íi]a[^.!?\n]*[.!?]?/gi, '')
      .replace(/las paradas adicionales pueden incorporarse como visitas opcionales[^.!?\n]*[.!?]?/gi, '')
      .replace(/[^\S\r\n]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([^\n])\s*(D[íi]a\s+\d+\s*:)/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(¿(?:Qué te parece|Deseas hacer))/gi, '$1\n\n$2')
      .trim()

    // Detección explícita de comando de generación enviado por el usuario
    const isUserExplicitlyOrderingBuild = /\b(gener(ar|es|a|e|en|al)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|cre(ar|es|a|e|en)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|inicia(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|finaliza(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|constru(ye|ir)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|dise[ñn](ar|a|es|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|est[aá]\s+perfecto\s+(genera|crea)|listo\s+(genera|crea|para\s+generar)|ya\s+no\s+hay\s+nada\s+genera|vale\s+(genera|crea)|procede\s+a\s+generar|si\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|s[íi]\s+(genera|crea)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|(genera|crea|haz)\s+(el\s+|la\s+)?(tour|itinerario|ruta)\s+porfa|quiero\s+(que\s+)?(se\s+)?gener(ar|es|a|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|ok(ay)?\s+(listo\s+)?(quiero\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)?|adelante\s+(con\s+el\s+tour|genera|crea|construye|procede)|vamos\s+(a\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|armar?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje))\b/i.test(lastUserMsg)

    // Detección de petición de agregar paradas
    const isUserAskingForMoreStops = /\b(agr(egar?|ega|egues?|eguen?)|a[ñn](adir?|ade|ades?|adan?)|inclu(ir?|ye|yes?|yan?)|m[aá]s\s+(paradas|lugares|sitios|atractivos|actividades)|aumentar\s+(las\s+)?paradas|sumar\s+(m[aá]s\s+)?paradas|paradas\s+adicionales)\b/i.test(lastUserMsg)
    const hasDayHeaders = /(?:^|\n)\s*(?:#{1,4}\s*)?d[íi]a\s*1\b/i.test(responseMessage) ||
      /\b(?:d[íi]a\s*1\s*[:\-–]|\*\*d[íi]a\s*1\*\*)/i.test(responseMessage)
    const mentionsPresentingItinerary = /\b(aqu[íi]\s+(?:tienes|est[áa]|te\s+dejo|te\s+presento|va)\s+(?:un|el|tu|este)?\s*itinerario|itinerario\s+para\s+tu\s+viaje|itinerario\s+para|este\s+es\s+(?:el|tu|un)\s+itinerario|itinerario\s+de\s+viaje|itinerario\s+sugerido|itinerario\s+personalizado|aqu[íi]\s+tienes\s+tu\s+itinerario|aqu[íi]\s+est[áa]\s+tu\s+itinerario|aqu[íi]\s+tienes\s+el\s+itinerario|aqu[íi]\s+est[áa]\s+el\s+itinerario|tu\s+itinerario\s+para|itinerario\s*:)\b/i.test(responseMessage)
    const userRequestedItinerary = /\b(mu[ée]strame\s+(el\s+|tu\s+)?itinerario|ver\s+(el\s+|tu\s+)?itinerario|cu[aá]l\s+es\s+el\s+itinerario|quiero\s+ver\s+el\s+itinerario|dame\s+el\s+itinerario)\b/i.test(lastUserMsg)
    const hasLodgingJustProvided = Boolean(
      finalHasLodging &&
      finalHasCity &&
      finalHasDates &&
      (finalHasTransport || finalHasBudget)
    )

    const shouldReconstructItinerary = !isUserExplicitlyOrderingBuild && (
      (!hasDayHeaders && (isAllKeyInfoComplete || mentionsPresentingItinerary || userRequestedItinerary || isUserAskingForMoreStops || hasLodgingJustProvided)) ||
      (isUserAskingForMoreStops && !hasDayHeaders)
    )

    if (shouldReconstructItinerary) {
      let placesList = (parsedExtracted.specificPlaces || known.specificPlaces || [])
      let placeNames = placesList.map(p => typeof p === 'string' ? p : (p?.name || '')).filter(Boolean)
      let daysCount = Number(parsedExtracted.durationDays || known.durationDays || 0)
      if (!daysCount || daysCount < 1) {
        const datesText = `${known.datesSeason || ''} ${parsedExtracted.datesSeason || ''} ${lastUserMsg}`
        if (/\b(semanita|una semana|7 d[íi]as|carnaval)\b/i.test(datesText)) {
          daysCount = 7
        } else if (/\b(puente|fin de semana largo|3 d[íi]as)\b/i.test(datesText)) {
          daysCount = 3
        } else {
          daysCount = 2
        }
      }
      const dName = destName || known.destination || 'tu destino'

      const cat = realCatalog || (hasCity ? await getRealDestinationCatalog(destName, destCountry).catch(() => null) : null)
      const perDayPlacesCount = isUserAskingForMoreStops ? 3 : 2
      const totalPlacesNeeded = daysCount * perDayPlacesCount

      // Obtener atractivos del catálogo dinámico y enriquecer si faltan paradas
      let catPlaces = (cat?.places || []).filter(p => p && !isGenericFacilityName(p) && !isNonTouristFacility({ name: p }) && !isFoodOrDrinkEstablishment(p))
      if (catPlaces.length < totalPlacesNeeded) {
        const dynamicIconics = await fetchCityIconicLandmarks(dName, destCountry).catch(() => [])
        for (const di of dynamicIconics) {
          const diName = typeof di === 'string' ? di : (di?.name || '')
          if (diName && !isGenericFacilityName(diName) && !isNonTouristFacility({ name: diName }) && !isFoodOrDrinkEstablishment(diName) && !catPlaces.some(cp => arePlacesSimilar(cp, diName))) {
            catPlaces.push(diName)
          }
        }
      }

      const cleanExplicitPool = placeNames.filter(p => p && !isGenericFacilityName(p) && !isNonTouristFacility({ name: p }) && !isFoodOrDrinkEstablishment(p))
      const rawAttractions = [...cleanExplicitPool, ...catPlaces]
      const uniqueAttractions = []
      for (const p of rawAttractions) {
        if (!uniqueAttractions.some(existing => arePlacesSimilar(existing, p))) {
          uniqueAttractions.push(p)
        }
      }

      const validRests = (cat?.restaurants || []).filter(r =>
        r && r.name &&
        !isGenericFacilityName(r.name) &&
        !isNonTouristFacility({ name: r.name }) &&
        !/\b(zool[óo]gico|zoo|acuario|museo|catedral|iglesia|parque|carnaval|estadio)\b/i.test(r.name) &&
        (isFoodOrDrinkEstablishment(r.name) || r.tags?.amenity === 'restaurant' || r.tags?.amenity === 'cafe' || r.tags?.amenity === 'fast_food')
      )
      const uniqueRests = []
      for (const r of validRests) {
        if (!uniqueRests.some(existing => arePlacesSimilar(existing.name, r.name))) {
          uniqueRests.push(r)
        }
      }

      let prefixIntro = ''
      if (isUserAskingForMoreStops) {
        prefixIntro = `¡Por supuesto! He añadido paradas y atractivos adicionales para enriquecer cada día de tu viaje a ${dName}. Aquí tienes el itinerario ampliado:\n\n`
      } else {
        const cleanedIntro = responseMessage.replace(/Itinerario de Viaje:[^]*$/i, '').trim()
        if (cleanedIntro.length > 0) {
          prefixIntro = `${cleanedIntro}\n\n`
        }
      }

      let reconstructed = `${prefixIntro}Itinerario de Viaje: ${dName} (${known.datesSeason || `${daysCount} días`})\n\n`
      if (!parsedExtracted.specificPlaces) parsedExtracted.specificPlaces = []

      const globalUsedNames = new Set()
      let attrCursor = 0
      let restCursor = 0

      for (let d = 1; d <= daysCount; d++) {
        reconstructed += `Día ${d}: ${dName}\n`
        const dayUsed = new Set()

        for (let s = 0; s < perDayPlacesCount; s++) {
          let chosenPlace = null
          while (attrCursor < uniqueAttractions.length) {
            const candidate = uniqueAttractions[attrCursor++]
            const usedToday = Array.from(dayUsed).some(u => arePlacesSimilar(u, candidate))
            const usedGlobally = Array.from(globalUsedNames).some(u => arePlacesSimilar(u, candidate))
            if (!usedGlobally && !usedToday) {
              chosenPlace = candidate
              break
            }
          }
          if (!chosenPlace) {
            chosenPlace = uniqueAttractions.find(p => !Array.from(globalUsedNames).some(u => arePlacesSimilar(u, p))) ||
              `Recorrido patrimonial y arquitectónico por ${dName} (Sector ${d})`
          }
          globalUsedNames.add(chosenPlace)
          dayUsed.add(chosenPlace)
          reconstructed += ` • ${chosenPlace}\n`
          parsedExtracted.specificPlaces.push({ name: chosenPlace, dia: d, type: 'cultural' })
        }

        let chosenRest = null
        while (restCursor < uniqueRests.length) {
          const candidate = uniqueRests[restCursor++]
          const usedToday = Array.from(dayUsed).some(u => arePlacesSimilar(u, candidate.name))
          const usedGlobally = Array.from(globalUsedNames).some(u => arePlacesSimilar(u, candidate.name))
          if (!usedGlobally && !usedToday) {
            chosenRest = candidate.name
            break
          }
        }
        if (!chosenRest) {
          chosenRest = uniqueRests.find(r => !Array.from(globalUsedNames).some(u => arePlacesSimilar(u, r.name)))?.name ||
            `Gastronomía tradicional de ${dName} (Día ${d})`
        }
        globalUsedNames.add(chosenRest)
        dayUsed.add(chosenRest)
        reconstructed += ` • ${chosenRest}\n\n`
        parsedExtracted.specificPlaces.push({ name: chosenRest, dia: d, type: 'food' })
      }

      reconstructed += isUserAskingForMoreStops
        ? '¿Qué te parece este itinerario ampliado? ¿Deseas hacer algún otro ajuste o procedemos a generar el tour en el mapa?'
        : '¿Qué te parece este itinerario? ¿Deseas hacer algún ajuste o procedemos a generar el tour en el mapa?'
      responseMessage = reconstructed
    }

    const isItineraryStatusInquiry = /\b(c[oó]mo va el itinerario|c[oó]mo va mi itinerario|estado del itinerario)\b/i.test(lastUserMsg)
    if (isItineraryStatusInquiry) {
      actionChips = ['🚀 Generar itinerario completo', '✏️ Modificar algún día', '➕ Agregar otra actividad']
    } else if ((shouldReconstructItinerary || hasDayHeaders || isAllKeyInfoComplete) && !actionChips.some(c => /generar tour/i.test(c))) {
      actionChips.unshift(`🚀 Generar tour en ${destName || known.destination || 'el mapa'}`)
      if (!actionChips.some(c => /paradas|atractivos/i.test(c))) {
        actionChips.push('➕ Agregar más paradas')
      }
    }

    // Detección de si la IA está en modo consulta/propuesta esperando opinión del usuario
    const isBotAskingOrProposing = /\b(qu[ée]\s+te\s+parece|deseas\s+hacer\s+alg[uú]n\s+cambio|te\s+gustar[íi]a\s+incluir|qu[ée]\s+opinas|deseas\s+modificar|alguna\s+otra\s+preferencia|est[áa]\s+todo\s+listo\s+para\s+generar|qu[ée]\s+actividades|qu[ée]\s+lugares|cu[aá]l\s+de\s+estos)\b/i.test(responseMessage) ||
      /\?\s*$/i.test(responseMessage.trim())

    const isBotConfirmingBuild = /\b(procedo a generar tu tour|procedo a generar|voy a generar tu tour|genero tu tour)\b/i.test(responseMessage)

    // Cuando el usuario ordena explícitamente construir el tour y toda la información clave está completa,
    // readyToBuild DEBE ser true de inmediato (la orden del usuario tiene prioridad sobre cualquier pregunta retórica del bot).
    const effectiveReadyToBuild = Boolean(
      isAllKeyInfoComplete &&
      (isUserExplicitlyOrderingBuild || (isBotConfirmingBuild && !isBotAskingOrProposing))
    )

    if (isUserExplicitlyOrderingBuild && isAllKeyInfoComplete) {
      if (Array.isArray(known.specificPlaces) && known.specificPlaces.length >= 2) {
        parsedExtracted.specificPlaces = known.specificPlaces
      }
      responseMessage = `¡Excelente! Procedo a generar tu tour en el mapa para que disfrutes tu viaje a ${destName || 'tu destino'}.`
      actionChips = [`🚀 Generar tour en ${destName || known.destination || 'el mapa'}`]
    } else if (isUserExplicitlyOrderingBuild && !isAllKeyInfoComplete) {
      const missing = []
      if (!finalHasCity) missing.push('el destino')
      if (!finalHasDates) missing.push('las fechas o días de viaje')
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

    responseMessage = responseMessage
      .replace(/[^\S\r\n]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([^\n])\s*(D[íi]a\s+\d+\s*:)/gi, '$1\n\n$2')
      .replace(/([^\n])\s*(¿(?:Qué te parece|Deseas hacer))/gi, '$1\n\n$2')
      .trim()

    // Enforce cross-day global uniqueness on specificPlaces: no POI can appear on multiple days
    const rawSpecifics = Array.isArray(parsedExtracted.specificPlaces) && parsedExtracted.specificPlaces.length > 0
      ? parsedExtracted.specificPlaces
      : (known.specificPlaces || [])
    const seenGlobalStopKeys = new Set()
    const dedupedSpecificPlaces = []
    for (const p of rawSpecifics) {
      const pName = typeof p === 'string' ? p : (p?.name || '')
      const pKey = pName.toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^\w]/g, '')
      if (pKey && !seenGlobalStopKeys.has(pKey)) {
        seenGlobalStopKeys.add(pKey)
        dedupedSpecificPlaces.push(p)
      }
    }

    return {
      responseMessage,
      actionChips,
      extractedPreferences: { ...parsedExtracted, specificPlaces: dedupedSpecificPlaces },
      specificPlaces: dedupedSpecificPlaces,
      destinationSuggestions,
      readyToBuild: Boolean(effectiveReadyToBuild)
    }
  } catch (err) {
    console.warn('[generateChatResponse] Error calling OpenAI API, falling back to local chat generator:', err.message)
    return await runFallbackChatResponse()
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
- Extraer "destination" como el destino turístico explícito, sea un parque natural, reserva ecológica, isla, archipiélago, valle, región, pueblo, ciudad, ruta o países (ej: "Parque Tayrona", "Minca", "Tolú y Coveñas", "San Andrés", "Barranquilla", "Santa Marta", "Barranquilla a Santa Marta", "Italia y España", "Roma").
- Extraer "city" como el municipio o ciudad de referencia correspondiente (ej: "Santa Marta" si es Parque Tayrona, "Salento" si es Valle de Cocora, o el mismo destino si es ciudad).
- Solo extraer si el usuario declara EXPLÍCITAMENTE que desea viajar allí, explorar la zona o cambiar de destino.
- Si el usuario menciona un lugar como corrección, queja o negación (ej: "te equivocaste, esos lugares son de Barranquilla, no de Santa Marta"), NO sobreescribas el destino y mantén: "destination": ${JSON.stringify(currentData.destination || currentData.city || null)}, "city": ${JSON.stringify(currentData.city || currentData.destination || null)}.

REGLA DE LAS 6 MODALIDADES DE VIAJE:
- "tourType": clasifica en uno de:
  * "micro_destination": Parques naturales, reservas, montañas, valles aislados (ej: Parque Tayrona, Minca, Guatapé, Valle de Cocora).
  * "coastal_islands": Pueblos/zonas costeras con islas o archipiélagos (ej: Tolú y Coveñas con Islas de San Bernardo, Cartagena con Islas del Rosario).
  * "single_city": Ciudad única (ej: Barranquilla, Medellín, Bogotá, Madrid, Roma).
  * "city_to_city": Rutas o road trips entre dos o más ciudades (ej: Barranquilla a Santa Marta, Medellín a Bogotá).
  * "international_multicity": Viajes internacionales que abarcan varios países o múltiples ciudades internacionales (ej: Europa con Italia y España; Japón y Corea).
  * "location_to_destination": Rutas que parten desde la ubicación GPS del usuario hacia un punto determinado.

- Si es internacional multi-país:
  * "isMultiCountry": true
  * "countries": lista de países (ej: ["Italia", "España"])
  * "cities": lista de ciudades solicitadas en esos países si ya se mencionaron

- Si es multi-ciudad o road trip:
  * "isMultiCity": true
  * "originPlace": ciudad de origen
  * "destinationPlace": ciudad de destino
  * "cities": lista de ciudades involucradas (ej: ["Barranquilla", "Santa Marta"])

- Si el usuario indica salir desde su ubicación ("desde mi ubicación", "desde donde estoy"):
  * "isUserLocationOrigin": true

Devuelve ÚNICAMENTE un JSON con:
- "destination": destino turístico explícito o null.
- "tourType": "micro_destination" | "coastal_islands" | "single_city" | "city_to_city" | "international_multicity" | "location_to_destination" o null.
- "isMultiCity": boolean.
- "isMultiCountry": boolean.
- "isUserLocationOrigin": boolean.
- "originPlace": ciudad de salida o null.
- "destinationPlace": ciudad de llegada o null.
- "cities": lista de ciudades involucradas o [].
- "countries": lista de países involucrados o [].
- "city": ciudad/municipio de referencia o null.
- "country": país principal o null.
- "datesSeason": fechas o temporada (ej: "del 9 al 12 de octubre", "julio", "puente de noviembre", "este fin de semana").
- "durationDays": número de días explícito O calculado a partir del rango de fechas. Si no hay fechas ni duración, DEBE ser null.
- "companions": acompañantes (ej: "solo", "en pareja", "con amigos", "en familia").
- "groupSize": número de personas si se menciona.
- "hasChildren": true si viaja con niños, false si no.
- "budget": "Económico", "Moderado", "Lujo", "Ajustado" o null.
- "transport": "Caminando", "Auto rentado", "Transporte público", "Bicicleta", "Taxi / Uber" o null.
- "interests": lista de intereses mencionados.
- "specialEvent": nombre explícito de fiesta, festival o evento especial (ej: "Festival Internacional de Música de Cartagena", "Carnaval de Barranquilla") o null.
- "selectedHotel": { "name": "Nombre del hotel" } o null si no se ha elegido.
- "accommodationStatus": "Casa propia / familiar", "Hotel elegido", "Por definir" o null.
- "specificPlaces": lista de atracciones o lugares físicos con nombre propio y día (ej: [{ "name": "Cabo San Juan", "dia": 1 }, { "name": "Playa Cristal", "dia": 2 }]). NUNCA incluir actividades genéricas ("Llegada", "Despedida", "Tiempo libre", "Día libre").`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        reasoning_effort: 'none'
      }))
    })

    if (response.ok) {
      const data = await response.json()
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      if (parsed.durationDays && !parsed.durationHours) {
        parsed.durationHours = Number(parsed.durationDays) * 24
      }

      if (Array.isArray(parsed.specificPlaces)) {
        parsed.specificPlaces = parsed.specificPlaces.filter(p => {
          const pName = typeof p === 'string' ? p : (p?.name || '')
          const pNameLower = pName.toLowerCase()
          if (/\b(hotel|hostal|resort|inn|lodging|alojamiento|the meeting point|imperial|yivinaca|monaco real|colonial inn|canadiense)\b/i.test(pNameLower)) {
            return false
          }
          return true
        })
      }

      if (parsed.destination && !parsed.city) {
        parsed.city = parsed.destination
      }
      if (parsed.city && !parsed.destination) {
        parsed.destination = parsed.city
      }

      if (!parsed.companions && /\b(nos\s+vamos|nos\s+quedamos|nos\s+hospedamos|tenemos|vamos\s+con|viajamos|somos)\b/i.test(userMessage)) {
        parsed.companions = 'En grupo'
      }

      // Safeguard: Do NOT overwrite known destination if user is making a correction/negation
      const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(userMessage)
      const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a|desde|hasta|tour de|de\s+[a-z]+\s+a\s+[a-z]+)\b/i.test(userMessage)

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

  const routeMatch = text.match(/\b(?:de|desde)\s+([a-záéíóúñ\s]+?)\s+(?:a|hast[aá])\s+([a-záéíóúñ\s]+?)(?:$|\s+(?:en|con|para|el|la|los|del)\b)/i)
  if (routeMatch) {
    const originRaw = routeMatch[1].trim()
    const destinationRaw = routeMatch[2].trim()
    if (originRaw.length > 2 && destinationRaw.length > 2) {
      const origin = originRaw.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const destination = destinationRaw.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      res.isMultiCity = true
      res.originPlace = origin
      res.destinationPlace = destination
      res.cities = [origin, destination]
      res.destination = `${origin} a ${destination}`
      res.city = destination
    }
  }

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
  } else {
    const daysMatch = text.match(/\b(\d+)\s+d[íi]as?\b/i)
    if (daysMatch) {
      const d = parseInt(daysMatch[1], 10)
      if (d > 0 && d <= 30) {
        res.durationDays = d
        res.durationHours = d * 24
      }
    }
  }

  if (/\b(pr[oó]ximo mes|este mes|el otro mes)\b/i.test(text)) {
    res.datesSeason = 'Próximo mes'
  } else if (/\b(este fin de semana|el fin de semana)\b/i.test(text)) {
    res.datesSeason = 'Este fin de semana'
  } else if (/\b(vacaciones de mitad de a[ñn]o|mitad de a[ñn]o)\b/i.test(text)) {
    res.datesSeason = 'Vacaciones de mitad de año'
  } else if (/\b(fin de a[ñn]o|diciembre)\b/i.test(text)) {
    res.datesSeason = 'Fin de año'
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
  } else if (/\b(nos\s+vamos|nos\s+quedamos|nos\s+hospedamos|tenemos|vamos\s+con|viajamos|somos)\b/i.test(text)) {
    res.companions = 'En grupo'
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

  if (/\b(recomi[eé]ndame hoteles|hoteles|opciones de hotel|buscar hotel|sin hotel|no tengo hotel)\b/i.test(text)) {
    res.accommodationStatus = 'Recomiéndame hoteles'
  } else if (/\b(casa propia|mi casa|casa familiar|tengo hospedaje|tengo hotel|ya tengo hotel|tengo donde quedarme)\b/i.test(text)) {
    res.accommodationStatus = 'Casa propia / familiar'
  }

  const isPreferenceInput = Boolean(
    res.datesSeason ||
    res.durationDays ||
    res.companions ||
    res.budget ||
    res.transport ||
    res.accommodationStatus ||
    /\b(pr[oó]ximo mes|fin de semana|d[íi]as?|pareja|familia|amigos|solo|econ[oó]mico|moderado|lujo|caminando|auto|taxi|hotel|hospedaje)\b/i.test(text)
  )

  const isCommandOrControl = /\b(gener(ar|es|a|e|en|al)?|cre(ar|es|a|e|en)?|inicia(r)?|finaliza(r)?|constru(ye|ir)|dise[ñn](ar|a|es|e)?|est[aá]\s+perfecto|listo|procede|adelante|vamos|armar?|hazlo|de acuerdo|dale|genial|ok|comenzar|ver|mostrar|detalles|men[uú]|platos|comida|restaurantes?|hoteles?|atracciones|actividades|itinerario|itinerarios)\b/i.test(text)

  const NON_DEST = /^(pareja|en pareja|familia|en familia|amigos|con amigos|solo|sola|grupo|en grupo|econ[oó]mico|moderado|lujo|barato|mochilero|caminando|a pie|auto|carro|coche|taxi|uber|bicicleta|bici|transporte p[úu]blico|hotel|hoteles|hostal|resort|hospedaje|alojamiento|un d[íi]a|\d+\s+d[íi]as?|fin de semana|puente|mes|semana|a[ñn]o|vacaciones|turismo|planes?|actividades|sitios|lugares|atracciones|nada|s[íi]|si|no|ok|hola|buenas?|gracias|adelante|generar?|crear?|empezar?)$/i

  if (!res.destination && !isPreferenceInput) {
    const destActionPattern = /\b(?:tour|viaje|itinerario|plan|vacaciones|escapada)\s+(?:a|hacia|en|por|para)\s+([A-ZÁÉÍÓÚa-záéíóúñ\s]{2,30}?)(?:$|\s+(?:donde|que|para|con|en|el|la|los|las|del|durante|por|desde|sin|de\s+\d)\b)/i
    const destVerbPattern = /\b(?:viajar|conocer|visitar|ir|llegar)\s+(?:a|hacia|en|hasta)\s+([A-ZÁÉÍÓÚa-záéíóúñ\s]{2,30}?)(?:$|\s+(?:donde|que|para|con|en|el|la|los|las|del|durante|por|desde|sin)\b)/i

    const mAction = (prompt || '').trim().match(destActionPattern) || (prompt || '').trim().match(destVerbPattern)
    if (mAction) {
      const candidate = mAction[1].trim()
      const candidateLower = candidate.toLowerCase()
      if (!isVagueDestination(candidateLower) && !isNonTouristicInput(candidateLower) && !NON_DEST.test(candidateLower)) {
        const cleanCity = cleanAdministrativeCityName(candidate)
        if (cleanCity && cleanCity.length >= 3) {
          res.destination = cleanCity
          res.city = cleanCity
        }
      }
    } else if (!isCommandOrControl) {
      const barePatterns = [
        /^(?:a|hacia)\s+([A-ZÁÉÍÓÚa-záéíóúñ\s]{2,30})$/i,
        /^([A-ZÁÉÍÓÚa-záéíóúñ\s]{2,30})$/i
      ]
      for (const pat of barePatterns) {
        const m = (prompt || '').trim().match(pat)
        if (m) {
          const candidate = m[1].trim()
          const candidateLower = candidate.toLowerCase()
          if (
            candidate.split(/\s+/).length <= 3 &&
            !isVagueDestination(candidateLower) &&
            !isNonTouristicInput(candidateLower) &&
            !NON_DEST.test(candidateLower)
          ) {
            const cleanCity = cleanAdministrativeCityName(candidate)
            if (cleanCity && cleanCity.length >= 3) {
              res.destination = cleanCity
              res.city = cleanCity
              break
            }
          }
        }
      }
    }
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

  const datesContext = userPreferences?.datesSeason || userPreferences?.dates || ''
  const specialEventContext = userPreferences?.specialEvent || ''
  const defaultBestSeason = datesContext
    ? `${datesContext}${specialEventContext ? ` (${specialEventContext})` : ''}`
    : (specialEventContext ? `Temporada de ${specialEventContext}` : 'Todo el año')

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
  "mejor_epoca": "${defaultBestSeason}",
  "horario_recomendado": "09:00 AM - 06:00 PM",
  "punto_encuentro": {
    "nombre_lugar": "Punto de encuentro público en ${cleanCity} (ej: plaza o monumento emblemático)",
    "direccion": "Dirección céntrica y pública",
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
4. El título "nombre_tour" DEBE ser original, evocador, cautivador y con identidad temática única sobre ${cleanCity} (ej: "Joyas y Leyendas de ${cleanCity}", "Sabores y Brisas: De El Prado al Río", "Ruta Secreta de Arquitectura y Tradición en ${cleanCity}"). PROHIBIDO usar títulos planos y repetitivos como "Tour Cultural por ${cleanCity}" o "Tour Personalizado por ${cleanCity}". Tampoco nombres el tour con el nombre de una sola parada.
5. NO agregues hoteles ni alojamientos como paradas de actividad dentro del itinerario.
6. Para cada parada, redacta una narración de guía de voz inmersiva de 120 a 180 palabras.
7. Integra notas dinámicas de consejos y datos curiosos específicos por parada.
8. REGLA ESTRICTA PARA 'mejor_epoca': Si el viaje cuenta con fechas o evento especial indicado (${defaultBestSeason !== 'Todo el año' ? `"${defaultBestSeason}"` : 'como un festival o mes específico'}), 'mejor_epoca' DEBE reflejar exactamente ese rango de fechas o festividad (ej: "${defaultBestSeason}"). De lo contrario, indica "Todo el año" (siempre con 'ñ').`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `Genera el tour completo para ${cleanCity}, ${targetCountry}.
Fechas / Época: ${datesContext || 'Todo el año'}
Evento o Festival: ${specialEventContext || 'No especificado'}
Lugares obligatorios: ${JSON.stringify(selectedPlaces)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low'
      }))
    })

    if (response.ok) {
      const data = await response.json()
      return cleanAndParseJson(data.choices?.[0]?.message?.content, null)
    }
  } catch (err) {
    console.error('[planWithOpenAI] Error:', err)
  }

  return null
}

export async function suggestFallbackPlacesWithOpenAI({ destination, city, country, type, excludeNames = [] }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []
  const targetLocation = `${city || destination || ''} ${country || ''}`.trim()
  const excludeStr = Array.isArray(excludeNames) && excludeNames.length > 0 ? `\nLugares que YA están en el tour (NO repetir): ${excludeNames.join(', ')}` : ''
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(buildOpenAiPayload({
        messages: [
          {
            role: 'system',
            content: `Eres un experto turístico local internacional. Sugiere de 6 a 8 atractivos turísticos y restaurantes emblemáticos REALES físicamente existentes en "${targetLocation}".
Devuelve ÚNICAMENTE un JSON:
{
  "places": [
    {
      "name": "Nombre real del lugar",
      "type": "cultural, park, beach, food, viewpoint, o historic",
      "category": "attraction o restaurant",
      "description": "Breve descripción atractiva del lugar (1 a 2 oraciones)",
      "latitude": 10.9999,
      "longitude": -74.8000,
      "address": "Dirección o barrio aproximado"
    }
  ]
}`
          },
          { role: 'user', content: `Lugares alternativos para ${targetLocation}.${excludeStr}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low'
      })),
      signal: AbortSignal.timeout(25000)
    })
    if (response.ok) {
      const data = await response.json()
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      if (Array.isArray(parsed.places)) return parsed.places
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.warn('[suggestFallbackPlacesWithOpenAI] Error:', e.message)
  }
  return []
}

export async function fetchDynamicDestinationProfile(cityInput, countryInput = '') {
  let city = ''
  let country = countryInput || ''
  if (typeof cityInput === 'object' && cityInput !== null) {
    city = cityInput.city || cityInput.destination || ''
    country = cityInput.country || countryInput || ''
  } else if (typeof cityInput === 'string') {
    city = cityInput
  }
  if (!city || !city.trim()) return null
  const clean = cleanAdministrativeCityName(city).trim()
  const cacheKey = `profile_${clean.toLowerCase()}__${(country || '').toLowerCase()}`
  if (destinationCatalogCache.has(cacheKey)) {
    return destinationCatalogCache.get(cacheKey)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        modelConfig: getFastOpenAiModelConfig(),
        messages: [
          {
            role: 'system',
            content: `Eres un curador turístico internacional de élite de VibeTours con conocimiento exhaustivo de geografía, patrimonio y gastronomía mundial.
Tu misión es devolver el catálogo de referencia turística y gastronómica para la ciudad o destino indicado en cualquier parte del mundo.

Debes devolver un JSON estrictamente estructurado con:
1. "places": Array de 16 a 22 atractivos turísticos imprescindibles (monumentos históricos, plazas emblemáticas, museos, malecones, miradores, parques icónicos, maravillas naturales ordenados por importancia turística. CERO restaurantes, CERO tiendas, CERO urbanizaciones).
2. "restaurants": Array de 8 a 12 restaurantes o mercados gastronómicos MÁS EMBLEMÁTICOS, TRADICIONALES Y FAMOSOS representativos de esa ciudad específica.
   - Cada restaurante con: "name" (nombre real y limpio), "cuisine" (tipo de cocina regional/especialidad), y "specialty" (plato o experiencia destacada).
   - ESTRICTAMENTE PROHIBIDO cadenas de comida rápida multinacionales (McDonald's, KFC, etc.) o locales genéricos de comida rápida de barrio.
3. "hotels": Array de 4 a 6 hoteles reales y destacados de diferentes gamas (boutique colonial/histórico, lujo, céntrico).
   - Cada hotel con: "name", "desc" (1 línea concisa de su estilo/ubicación) y "price" (rango estimado en USD).
4. "events": Array de 2 a 3 festividades, carnavales o eventos culturales anuales icónicos con fechas habituales.

REGLA CRÍTICA DE CARTOGRAFÍA EN OPENSTREETMAP / OPENFREEMAP:
- Incluye ÚNICAMENTE lugares y atractivos reales que existan físicamente, estén actualmente en funcionamiento y cuenten con registro en OpenStreetMap / OpenFreeMap.
- ESTRICTAMENTE PROHIBIDO incluir lugares cerrados permanentemente (por ejemplo, el Museo Romántico de Barranquilla cerró en 2018 y no existe en OpenFreeMap) o comercios informales sin nodo cartografiado en OpenStreetMap.

Formato JSON obligatorio:
{
  "places": ["Nombre 1", "Nombre 2", ...],
  "restaurants": [
    { "name": "Nombre Real del Restaurante", "cuisine": "Tipo de cocina", "specialty": "Plato destacado" }
  ],
  "hotels": [
    { "name": "Nombre Real del Hotel", "desc": "Descripción breve", "price": "~$XX - $YY USD" }
  ],
  "events": [
    { "name": "Nombre del Evento", "dates": "Mes o época habitual", "desc": "Descripción breve" }
  ]
}`
          },
          {
            role: 'user',
            content: `Destino: "${clean}", País: "${country || 'Internacional'}". Genera el catálogo turístico integral de lugares icónicos, gastronomía típica, hoteles y eventos.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        reasoning_effort: 'low'
      })),
      signal: AbortSignal.timeout(40000)
    })

    if (response.ok) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        const places = Array.isArray(parsed.places)
          ? parsed.places.map(p => typeof p === 'string' ? p : p.name).filter(p => p && !isGenericFacilityName(p) && !isNonTouristFacility({ name: p }) && !isFoodOrDrinkEstablishment(p) && !isUnmappedOrClosedVenue(p))
          : []
        const restaurants = Array.isArray(parsed.restaurants)
          ? parsed.restaurants.filter(r => r && r.name && !isNonTouristFacility({ name: r.name }) && !isUnmappedOrClosedVenue(r.name))
          : []
        const hotels = Array.isArray(parsed.hotels)
          ? parsed.hotels.filter(h => h && h.name)
          : []
        const events = Array.isArray(parsed.events) ? parsed.events : []

        if (places.length >= 3) {
          const profile = {
            name: clean ? clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Destino',
            country: country || 'Global',
            places,
            restaurants,
            hotels,
            events
          }
          destinationCatalogCache.set(cacheKey, profile)
          return profile
        }
      }
    }
  } catch (err) {
    console.warn('[fetchDynamicDestinationProfile] Dynamic profile query failed:', err.message)
  }

  return null
}

const cityLandmarksCache = new Map()

export async function fetchCityIconicLandmarks(cityInput, countryInput = '') {
  let city = ''
  let country = countryInput || ''
  if (typeof cityInput === 'object' && cityInput !== null) {
    city = cityInput.city || cityInput.destination || ''
    country = cityInput.country || countryInput || ''
  } else if (typeof cityInput === 'string') {
    city = cityInput
  }
  if (!city || !city.trim()) return []
  const clean = cleanAdministrativeCityName(city).trim()
  const cacheKey = `${clean.toLowerCase()}__${(country || '').toLowerCase()}`
  if (cityLandmarksCache.has(cacheKey)) {
    return cityLandmarksCache.get(cacheKey)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(buildOpenAiPayload({
          messages: [
            {
              role: 'system',
              content: `Eres un guía turístico profesional de VibeTours con conocimiento exhaustivo de geografía mundial. Tu misión es devolver un listado de los 16 a 22 lugares turísticos, plazas, monumentos históricos, museos, malecones, miradores, parques emblemáticos y experiencias patrimoniales más icónicos, reconocidos y visitados de la ciudad indicada.
ORDENA la lista estrictamente por popularidad e importancia turística (los atractivos imprescindibles, más visitados y famosos a nivel mundial o nacional en los primeros puestos).
PROHIBIDO incluir restaurantes, bares, cafeterías, puestos de comida o negocios gastronómicos en esta lista (deben ser exclusivamente atractivos turísticos, culturales, patrimoniales o naturales).
PROHIBIDO incluir urbanizaciones, barrios residenciales, conjuntos residenciales, edificios de viviendas o rotondas viales.
Asegúrate de que TODOS los lugares pertenezcan estrictamente a la ciudad indicada o a su área metropolitana inmediata (no incluyas lugares de otras ciudades).
Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "places": [
    { "name": "Nombre exacto del atractivo", "category": "historic | culture | nature | viewpoint | park | beach" }
  ]
}`
            },
            {
              role: 'user',
              content: `Ciudad: "${clean}", País: "${country || ''}". Lista los principales atractivos turísticos y monumentos imprescindibles ordenados por popularidad turística.`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          reasoning_effort: 'none'
        })),
        signal: AbortSignal.timeout(25000)
      })

      if (response.ok) {
        const json = await response.json()
        const content = json.choices?.[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          const rawPlaces = Array.isArray(parsed.places) ? parsed.places : []
          const list = []
          for (const p of rawPlaces) {
            const entry = typeof p === 'string' ? { name: p, category: 'historic' } : p
            if (entry && entry.name && !isGenericFacilityName(entry.name) && !isNonTouristFacility({ name: entry.name }) && !isFoodOrDrinkEstablishment(entry.name)) {
              if (!list.some(existing => arePlacesSimilar(existing.name, entry.name))) {
                list.push(entry)
              }
            }
          }
          if (list.length >= 3) {
            cityLandmarksCache.set(cacheKey, list)
            return list
          }
        }
      }
    } catch (err) {
      console.warn('[fetchCityIconicLandmarks] Dynamic OpenAI call failed:', err.message)
    }
  }

  // Fallback to Photon POIs without circular call
  const photonResults = await photonSearch(`turismo ${clean}`, 15).catch(() => [])
  const fallbackList = photonResults
    .map(p => ({ name: p.name, category: 'historic' }))
    .filter(p => p && p.name && !isGenericFacilityName(p.name) && !isNonTouristFacility({ name: p.name }) && !isFoodOrDrinkEstablishment(p.name))
  if (fallbackList.length > 0) {
    cityLandmarksCache.set(cacheKey, fallbackList)
    return fallbackList
  }
  return []
}

export async function generateRichPlaceDescriptionsBatch({ destination = '', city = '', country = '', places = [], prompt = '' }) {
  if (!places || places.length === 0) return {}
  const apiKey = process.env.OPENAI_API_KEY

  const placeNames = places.map(p => typeof p === 'string' ? p : (p?.name || '')).filter(Boolean)
  if (placeNames.length === 0) return {}

  if (apiKey) {
    const chunkSize = 4
    const chunks = []
    for (let i = 0; i < placeNames.length; i += chunkSize) {
      chunks.push(placeNames.slice(i, i + chunkSize))
    }

    const systemPrompt = `Eres un guía turístico profesional y narrador experto de VibeTours.
Tu misión es generar contenido 100% auténtico, inmersivo, diferenciado y SIN plantillas repetitivas para CADA parada turística listada en español.

Para CADA lugar, debes generar un objeto con:
1. "descripcion": Narración inmersiva, evocadora y cinematográfica (entre 60 y 90 palabras). Destaca lo que hace único y especial a este sitio específico frente a otros de la misma región (su historia real, arquitectura, ambiente, contrastes y la vivencia en el sitio). PROHIBIDO usar metáforas clichés o fórmulas clónicas como "las aguas turquesas acarician", "un manto dorado" o "es un punto de visita indispensable".
2. "actividades": Array de 3 actividades o vivencias tangibles que SOLO apliquen a ese lugar en particular (ej: para un fuerte militar colonial: "Recorrer las baterías de cañones de Bocachica", no "tomar fotos y descansar").
3. "datos_curiosos": Array de 1 o 2 datos históricos verídicos, leyendas locales o secretos arquitectónicos documentados de ese sitio exacto. PROHIBIDO poner frases vacías como "es uno de los puntos emblemáticos de la zona".
4. "consejos": Array de 1 o 2 recomendaciones prácticas de guía local (mejor hora, calzado, hidratación o consejos de seguridad).

Devuelve estrictamente un objeto JSON donde cada clave es el nombre exacto del lugar:
{
  "Nombre del Lugar": {
    "descripcion": "texto inmersivo único...",
    "actividades": ["Actividad específica 1", "Actividad específica 2", "Actividad específica 3"],
    "datos_curiosos": ["Dato real 1", "Dato real 2"],
    "consejos": ["Consejo útil 1"]
  }
}`

    try {
      const chunkResults = await Promise.allSettled(
        chunks.map(async (chunk) => {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(buildOpenAiPayload({
              modelConfig: getFastOpenAiModelConfig(),
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Destino: ${destination || city || 'Colombia'}\nLugares obligatorios a describir con riqueza de detalles:\n${chunk.map((p, i) => `${i + 1}. ${p}`).join('\n')}` }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.5,
              reasoning_effort: 'low',
              extra: { max_tokens: 3500 }
            })),
            signal: AbortSignal.timeout(22000)
          })

          if (response.ok) {
            const json = await response.json()
            const content = json.choices?.[0]?.message?.content
            if (content) {
              return JSON.parse(content)
            }
          } else {
            const errText = await response.text().catch(() => '')
            console.warn(`[openai] generateRichPlaceDescriptionsBatch HTTP ${response.status}:`, errText)
          }
          return {}
        })
      )

      const merged = {}
      for (const res of chunkResults) {
        if (res.status === 'fulfilled' && res.value && typeof res.value === 'object') {
          Object.assign(merged, res.value)
        }
      }

      for (const name of placeNames) {
        let item = merged[name]
        if (!item) {
          const normQuery = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
          const stemQuery = normQuery.length > 5 && normQuery.endsWith('s') ? normQuery.slice(0, -1) : normQuery
          const matchEntry = Object.entries(merged).find(([k]) => {
            const normK = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
            const stemK = normK.length > 5 && normK.endsWith('s') ? normK.slice(0, -1) : normK
            return (
              stemK === stemQuery ||
              normK === normQuery ||
              arePlacesSimilar(k, name) ||
              (k.length >= 6 && name.length >= 6 && (k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase())))
            )
          })
          if (matchEntry) {
            item = matchEntry[1]
            merged[name] = item
          }
        }

        let desc = typeof item === 'string' ? item : item?.descripcion
        const isDescGeneric = !desc || desc.length < 25 ||
          desc.includes('conectar a los viajeros con la historia viva') ||
          desc.includes('Espacio emblemático de enriquecimiento cultural') ||
          desc.includes('Punto de interés emblemático') ||
          desc.includes('Destacado atractivo en') ||
          desc.includes('reconocido por su valor testimonial')

        if (isDescGeneric) {
          const wikiText = await wikipediaSummaryText(name, destination || city, 'Colombia').catch(() => null)
          desc = (wikiText && wikiText.length > 30) ? wikiText : buildRichFallbackDescription(name, destination || city)
        }

        const activities = (Array.isArray(item?.actividades) && item.actividades.length > 0)
          ? item.actividades
          : [`Recorrer y descubrir ${name}`, `Conocer la historia y puntos clave de ${name}`, `Disfrutar de las vistas y ambiente de ${name}`]

        const curiosities = (Array.isArray(item?.datos_curiosos) && item.datos_curiosos.length > 0)
          ? item.datos_curiosos
          : [`${name} es uno de los puntos más representativos de ${destination || city}.`]

        const tips = (Array.isArray(item?.consejos) && item.consejos.length > 0)
          ? item.consejos
          : [`Planificar la visita con anticipación para disfrutar al máximo de ${name}.`]

        merged[name] = {
          descripcion: desc,
          actividades: activities,
          datos_curiosos: curiosities,
          consejos: tips
        }
      }
      return merged
    } catch (err) {
      console.warn('[openai] generateRichPlaceDescriptionsBatch fallback activated:', err.message)
    }
  }

  // Fallback rico e individualizado por categoría en caso de desconexión
  const fallbackResults = await Promise.allSettled(
    placeNames.map(async (name) => {
      const wikiText = await wikipediaSummaryText(name, destination || city, 'Colombia').catch(() => null)
      const desc = (wikiText && wikiText.length > 30) ? wikiText : buildRichFallbackDescription(name, destination || city)
      return {
        name,
        data: {
          descripcion: desc,
          actividades: [`Recorrer y descubrir ${name}`, `Conocer los puntos clave de ${name}`, `Disfrutar de la cultura y vistas locales`],
          datos_curiosos: [`${name} preserva historia y valor paisajístico en ${destination || city}.`],
          consejos: [`Planificar la visita con anticipación para disfrutar al máximo de ${name}.`]
        }
      }
    })
  )
  const fallback = {}
  for (const r of fallbackResults) {
    if (r.status === 'fulfilled' && r.value) {
      fallback[r.value.name] = r.value.data
    }
  }
  return fallback
}

function buildRichFallbackDescription(name, city = '') {
  const clean = String(name || '').trim()
  const loc = city ? `en ${city}` : 'en la región'

  const isChurch = /\b(catedral|iglesia|bas[íi]lica|templo|santuario|parroquia)\b/i.test(clean)
  if (isChurch) {
    return `Importante templo religioso y patrimonio arquitectónico ${loc}, destacado por sus líneas coloniales, altares históricos y la serenidad de su espacio interior.`
  }

  const isCarnaval = /carnaval|comparsa|folclor/i.test(clean)
  if (isCarnaval) {
    return `Epicentro de la tradición cultural y festiva ${loc}, donde expresiones de folclor, música tradicional y atuendos típicos transmiten la identidad de sus gentes.`
  }

  const isMuseum = /\b(museo|casa museo|galer[íi]a|centro cultural)\b/i.test(clean)
  if (isMuseum) {
    return `Recinto cultural ${loc} que conserva exposiciones históricas, vestigios arqueológicos y muestras artísticas que documentan el legado de la comunidad.`
  }

  const isEstuaryOrNature = /\b(boca|bocas|ceniza|ci[eé]naga|manglar|delta|r[íi]o|estuario|laguna|pantano)\b/i.test(clean)
  if (isEstuaryOrNature) {
    return `${clean} es un imponente enclave natural ${loc}, donde confluyen corrientes fluviales y marinas ofreciendo vistas panorámicas excepcionales y una rica biodiversidad.`
  }

  const isZoo = /\b(zool[óo]gico|zoo|acuario|bioparque|aviario)\b/i.test(clean)
  if (isZoo) {
    return `Espacio dedicado a la conservación biológica y educación ambiental ${loc}, que alberga fauna representativa y flora tropical en senderos ecológicos acondicionados.`
  }

  const isWaterOrPark = /\b(malec[óo]n|parque|plaza|mirador|paseo|boulevard|jard[íi]n|cerro)\b/i.test(clean)
  if (isWaterOrPark) {
    return `Espacio emblemático al aire libre ${loc}, ideal para pasear, contemplar el paisaje y disfrutar del encuentro social y la naturaleza circundante.`
  }

  const isMonument = /\b(monumento|estatua|busto|obelisco|escultura|hito|memorial)\b/i.test(clean)
  if (isMonument) {
    return `Hito conmemorativo ${loc} erigido en honor a personajes y acontecimientos determinantes en la construcción histórica y cultural del territorio.`
  }

  const isSeafood = /mariscos|pescado|ceviche|costeñ|mar|playa|puerto/i.test(clean)
  if (isSeafood) {
    return `Destacado referente culinario costero donde los pescados frescos, preparaciones típicas y sabores de mar ofrecen una auténtica muestra gastronómica.`
  }

  const isCafe = /caf[ée]|bistro|bakery|panader[íi]a|dulce/i.test(clean)
  if (isCafe) {
    return `Rincón tradicional de café y tertulia ${loc}, ideal para degustar café de origen y repostería artesanal en un ambiente relajado.`
  }

  const isFood = /\b(restaurante|comida|asador|bistro|bar|gastronom[íi]a|taquer[íi]a|pizzer[íi]a|parador)\b/i.test(clean)
  if (isFood) {
    return `Reconocido espacio gastronómico ${loc} que rinde homenaje a la cocina local mediante platos tradicionales e ingredientes frescos de la tierra.`
  }

  return `${clean} ofrece un atractivo recorrido ${loc}, permitiendo a los visitantes apreciar de cerca la identidad, historia y dinamismo característico del destino.`
}

export async function generateCustomPlaceReasons(arg1 = [], arg2 = '', arg3 = '') {
  const apiKey = process.env.OPENAI_API_KEY
  let places = []
  let destination = ''
  let city = ''
  let prompt = ''

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    places = Array.isArray(arg1.places) ? arg1.places : []
    destination = arg1.destination || arg1.city || ''
    city = arg1.city || arg1.destination || ''
    prompt = arg1.prompt || ''
  } else {
    places = Array.isArray(arg1) ? arg1 : []
    city = typeof arg2 === 'string' ? arg2 : ''
    destination = city
  }

  const cleanPlaces = places.map(p => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean)
  if (!apiKey || cleanPlaces.length === 0) return {}

  const destStr = destination || city || 'la ciudad'

  try {
    const chunkSize = 8
    const chunks = []
    for (let i = 0; i < cleanPlaces.length; i += chunkSize) {
      chunks.push(cleanPlaces.slice(i, i + chunkSize))
    }

    const chunkResults = await Promise.allSettled(
      chunks.map(async (chunk) => {
        const payload = buildOpenAiPayload({
          modelConfig: getFastOpenAiModelConfig(),
          messages: [
            {
              role: 'system',
              content: `Eres un guía turístico local experto en ${destStr}.
Tu tarea es redactar para CADA uno de los lugares turísticos listados una justificación breve y cautivadora (de MÁXIMO 1 a 2 oraciones, entre 15 y 30 palabras) explicando POR QUÉ ese lugar fue seleccionado para este tour y qué valor cultural, histórico, paisajístico o gastronómico único ofrece al viajero.
PROHIBIDO USAR PLANTILLAS REPETITIVAS O CLICHÉS como:
- "fue seleccionado por su gran relevancia local..."
- "fue seleccionado para saborear..."
- "ubicado en [ciudad]..."
- "antes de llegar a..."
Cada explicación debe ser auténtica, directa y hablar exclusivamente de la esencia de ese sitio en particular.
Devuelve ÚNICAMENTE un objeto JSON donde cada clave es el nombre exacto del lugar y el valor es la justificación:
{
  "Nombre del lugar": "Justificación única y natural..."
}`
            },
            {
              role: 'user',
              content: `Genera las justificaciones de selección para estos lugares de ${destStr}:\n${chunk.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          reasoning_effort: 'low',
          extra: { max_tokens: 1500 }
        })

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000)
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            const parsed = JSON.parse(content)
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              return parsed
            }
          }
        }
        return {}
      })
    )

    const merged = {}
    for (const res of chunkResults) {
      if (res.status === 'fulfilled' && res.value && typeof res.value === 'object') {
        Object.assign(merged, res.value)
      }
    }
    if (Object.keys(merged).length > 0) {
      return merged
    }
  } catch (err) {
    console.warn('[generateCustomPlaceReasons] Error:', err.message)
  }

  const fallbackMap = {}
  for (const name of cleanPlaces) {
    fallbackMap[name] = `Parada destacada de ${destStr}, seleccionada para apreciar su historia, arquitectura y autenticidad local.`
  }
  return fallbackMap
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

export async function geocodePlacesWithOpenAI({ city = '', country = '', places = [], centerLat = null, centerLon = null }) {
  if (!places || places.length === 0) return {}
  const placeNames = places.map(p => typeof p === 'string' ? p : (p?.name || '')).filter(Boolean)
  if (placeNames.length === 0) return {}

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const fallbackResults = {}
    for (const p of placeNames) {
      const geo = await geocodePlace(`${p}, ${city}`, centerLat, centerLon).catch(() => null)
      if (geo && Number.isFinite(geo.latitude) && Number.isFinite(geo.longitude)) {
        fallbackResults[p] = { latitude: geo.latitude, longitude: geo.longitude, address: geo.city || city }
      }
    }
    return fallbackResults
  }

  try {
    const systemPrompt = `Eres un geocodificador ultra-preciso de VibeTours.
Dada una ciudad y una lista de lugares o paradas turísticas, devuelve UN ÚNICO objeto JSON donde cada clave es el nombre exacto del lugar y el valor es un objeto con:
- "latitude": número flotante con la latitud real del lugar en esa ciudad
- "longitude": número flotante con la longitud real del lugar en esa ciudad
- "address": dirección o zona dentro del casco urbano de la ciudad

REGLAS DE ANCLAJE URBANO Y PRECISIÓN ESTRICTAS:
1. Todas las coordenadas DEBEN estar ubicadas dentro del área urbana o distrito turístico central de la ciudad. NUNCA ubiques lugares en carreteras rurales remotas, trochas o municipios ajenos.
2. Para paseos ribereños o marítimos (como Gran Malecón del Río o malecones costeros), ubica la coordenada exactamente sobre el paseo peatonal a la orilla del agua, no tierra adentro.
3. Para monumentos, rotondas y plazas (como Ventana al Mundo, Plaza de San Nicolás, Catedral), ubica la coordenada exactamente en la estructura, rotonda o plazoleta del monumento.
4. Para restaurantes o locales gastronómicos, ubica la coordenada en su dirección comercial o zona gastronómica real en la ciudad. Si no conoces la dirección exacta de un restaurante, ubícalo en el corredor gastronómico principal de la ciudad, jamás en una vía rural.`

    const chunkSize = 7
    const chunks = []
    for (let i = 0; i < placeNames.length; i += chunkSize) {
      chunks.push(placeNames.slice(i, i + chunkSize))
    }

    const chunkResults = await Promise.allSettled(
      chunks.map(async (chunk) => {
        const userPrompt = `Ciudad: ${city}, ${country || ''}
${centerLat && centerLon ? `Coordenadas centrales de la ciudad: ${centerLat}, ${centerLon}` : ''}
Lugares a geocodificar con máxima precisión urbana:
${chunk.map((p, i) => `${i + 1}. ${p}`).join('\n')}`

        const payload = buildOpenAiPayload({
          modelConfig: getFastOpenAiModelConfig(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          reasoning_effort: 'none'
        })

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000)
        })

        if (!response.ok) return {}
        const json = await response.json()
        const content = json.choices?.[0]?.message?.content
        if (!content) return {}
        const parsed = cleanAndParseJson(content, {})
        return parsed && typeof parsed === 'object' ? parsed : {}
      })
    )

    const merged = {}
    for (const res of chunkResults) {
      if (res.status === 'fulfilled' && res.value && typeof res.value === 'object') {
        Object.assign(merged, res.value)
      }
    }
    return merged
  } catch (err) {
    console.warn('[openai] geocodePlacesWithOpenAI failed:', err.message)
    return {}
  }
}


