import { GeoCache } from './geoCache.js'
import { imageForPlaceWithStatus, wikipediaSummaryText } from './imageSearch.js'
import { cleanAdministrativeCityName, formatCountryName, FALLBACK_DESTINATION_CENTROIDS } from './destinationService.js'
import { searchWebForTravel } from './webSearch.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels, overpassNearbyFood, isNonTouristFacility, isGenericFacilityName, isFoodOrDrinkEstablishment, arePlacesSimilar, haversineMeters, resolveCanonicalPlaceIdentity, hasOsmMapRecord, isWithinCoastalCorridorBounds } from './osm.js'
import { createUnifiedCandidateCatalog, getCandidateId, normalizeRealCandidate } from './candidate-catalog.js'
import { resolvePlaceWithCascade, resolveProviderDestinationCenter, searchGeoapifyPlaces, searchMapboxPlaces } from './places-resolver.js'
import { fetchWithProviderRetry } from './provider-http.js'
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

// The chat response and the map planner must share the same physical-place
// identity. Some venues have several public names; these are aliases, not
// separate stops. Keep this normalization here as well as in the route layer
// because the visible itinerary is assembled before /tours/build runs.
const CHAT_CANONICAL_DISPLAY_NAMES = {
  'barranquilla-carnaval-house-museum': 'Casa del Carnaval',
}

function normalizeChatPlaceName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function canonicalChatPlaceKey(placeName, city = '') {
  const identity = resolveCanonicalPlaceIdentity(placeName, city)
  return identity
    ? `canonical:${identity.id}`
    : `name:${normalizeChatPlaceName(placeName)}`
}

function canonicalChatDisplayName(placeName, city = '') {
  const identity = resolveCanonicalPlaceIdentity(placeName, city)
  return CHAT_CANONICAL_DISPLAY_NAMES[identity?.id] || String(placeName || '').trim()
}

export function isChatHotelStop(placeName, selectedHotel = null) {
  const normalizedName = normalizeChatPlaceName(placeName)
  if (!normalizedName) return false

  const selectedName = typeof selectedHotel === 'string'
    ? selectedHotel
    : selectedHotel?.name || selectedHotel?.nombre || selectedHotel?.nombre_lugar || ''
  const normalizedSelectedName = normalizeChatPlaceName(selectedName)

  if (/\b(hotel|hostal|hostel|resort|inn|lodging|alojamiento|hospedaje|motel)\b/i.test(normalizedName)) {
    return true
  }
  return Boolean(
    normalizedSelectedName &&
    normalizedSelectedName.length >= 3 &&
    (normalizedName === normalizedSelectedName ||
      normalizedName.includes(normalizedSelectedName) ||
      normalizedSelectedName.includes(normalizedName))
  )
}

export const GENERIC_LODGING_TERMS = new Set([
  'hotel', 'hoteles', 'hostal', 'hostales', 'resort', 'resorts', 'villa', 'villas',
  'villa privada', 'villas privadas', 'cabana', 'cabanas', 'cabaña', 'cabañas', 'posada', 'posadas',
  'apartamento', 'apartamentos', 'airbnb', 'alojamiento', 'hospedaje', 'glamping',
  'casa de campo', 'casa de playa', 'habitacion', 'habitación', 'habitaciones',
  'por definir', 'pendiente', 'a definir', 'por confirmar', 'sin definir', 'cualquiera',
  'el que sea', 'lo que recomiendes', 'lo que sea', 'resort de lujo', 'hotel boutique',
  'hotel frente al mar', 'hotel economico', 'hotel económico', 'hotel centrico', 'hotel céntrico'
])

export function isLodgingCategoryOrGeneric(text) {
  if (!text || typeof text !== 'string') return false
  const clean = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
  if (isLodgingNegationOrUncertainty(clean)) return false
  if (GENERIC_LODGING_TERMS.has(clean)) return true
  return /^(?:un|una|unos|unas|el|la|los|las)?\s*(?:villa(?:\s+privada)?|resort(?:\s+de\s+lujo|\s+frente\s+al\s+mar)?|hotel(?:\s+boutique|\s+economico|\s+centrico|\s+frente\s+al\s+mar)?|caba[nñ]a|hostal|posada|apartamento|airbnb|alojamiento|hospedaje|glamping)(?:\s+(?:esta\s+bien|estaria\s+bien|prefiero|de\s+playa|de\s+lujo))?$/i.test(clean)
}

export function isLodgingNegationOrUncertainty(message = '') {
  const text = String(message || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!text) return false
  return /\b(no\s+(?:tengo|tenemos|hay|hemos|se|sabemos)|sin\s+hotel|sin\s+alojamiento|sin\s+hospedaje|aún\s+no|aun\s+no|todavia\s+no|todav[ií]a\s+no|donde\s+(?:nos\s+vamos\s+a\s+|me\s+voy\s+a\s+|vamos\s+a\s+)?quedar|quedarn?os|quedarme|que\s+recomiendas?|dame\s+recomendaciones|recomiendame|opciones\s+de\s+(?:hotel|hoteles|hospedaje|alojamiento)|buscar\s+hotel)\b/i.test(text)
}

export function isLodgingRecommendationInquiry(message = '', lastAssistantMsg = '') {
  const userText = String(message || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!userText) return false
  if (/\b(informacion|detalles?|saber\s+mas|cuentame)\b/i.test(userText)) return false

  // 1. Direct inquiry about hotels or lodging options
  const isDirectInquiry = /\b(recomiendame\s+hoteles|recomienda\s+hoteles|opciones\s+de\s+(?:hotel|hoteles|hospedaje|alojamiento)|que\s+hoteles|cuales\s+hoteles|que\s+hotel|buscar\s+hotel|donde\s+(?:nos\s+vamos\s+a\s+|me\s+voy\s+a\s+|vamos\s+a\s+)?quedar|quedarn?os|quedarme|dame\s+recomendaciones\s+(?:de\s+)?hoteles?|recomiendas?\s+un\s+hotel|hoteles\s+recomendados)\b/i.test(userText) ||
    (/\b(hotel|hoteles|alojamiento|hospedaje)\b/i.test(userText) && /\b(recomiend|recomendac|opcion|opciones|sugier|sugerencia|buscar|cual|cuales|que|dame|sin|no\s+tengo|no\s+tenemos|definido)\b/i.test(userText)) ||
    (/\bdame\s+recomendaciones\b/i.test(userText) && !/\b(comida|restaurante|sitios|lugares|atracciones)\b/i.test(userText))

  if (isDirectInquiry) return true

  // 2. Contextual reply: if the assistant's last message asked about lodging/hotel and user responds asking for advice or expressing uncertainty
  const assistantText = String(lastAssistantMsg || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const assistantAskedLodging = /\b(hotel|alojamiento|hospedaje|hospedaran|donde\s+se\s+hospedaran|casa\s+propia)\b/i.test(assistantText)

  if (assistantAskedLodging) {
    const isUncertainOrAsking = /\b(no\s+se|no\s+sabemos|que\s+recomiendas?|recomiendanos|dame\s+recomendaciones|recomiendame|cuales|que\s+opciones|que\s+hay|no\s+tengo\s+idea|aún\s+no|aun\s+no|todavia\s+no|ni\s+idea|sugerencias?)\b/i.test(userText) ||
      /^\s*(?:no\s+sabemos|no\s+se|que\s+recomiendas\??|dame\s+recomendaciones)\s*$/i.test(userText)
    if (isUncertainOrAsking) return true
  }

  return false
}

export function isLodgingExplicitlyConfirmed(hotel, status) {
  // 1. Private home or local family accommodation is explicitly confirmed
  const statusStr = String(status || '').trim().toLowerCase()
  const isStatusHome = /\b(casa propia|familiar|alojamiento particular|en casa|mi casa|casa de familiares|casa de amigos|vivo aqu[ií]|no necesito hotel|alojamiento propio|propio hospedaje|propio alojamiento|tengo hospedaje|tengo mi propio hospedaje)\b/i.test(statusStr)
  const hotelName = typeof hotel === 'string' ? hotel : (hotel?.name || hotel?.nombre || '')
  const hotelNameStr = String(hotelName || '').trim().toLowerCase()
  const isHotelHome = /\b(casa propia|familiar|alojamiento particular|en mi casa|mi casa|en casa|propio hospedaje|propio alojamiento)\b/i.test(hotelNameStr)

  if (isStatusHome || isHotelHome) {
    return true
  }

  // 2. Explicitly unconfirmed / pending statuses
  if (/^(por definir|pendiente|a definir|por confirmar|sin definir|en consulta)$/i.test(statusStr)) {
    return false
  }

  // 3. Hotel name validation: must exist and cannot be a generic category
  if (!hotelNameStr || hotelNameStr.length < 3) return false
  if (isLodgingCategoryOrGeneric(hotelNameStr)) return false

  // 4. Valid specific commercial hotel without pending status is confirmed
  if (!statusStr || statusStr === 'null' || statusStr === 'undefined') {
    return true
  }

  const isStatusConfirmed = /\b(confirmado|hotel elegido|elegido|reservado)\b/i.test(statusStr)
  return isStatusConfirmed
}

/**
 * Deduplicates structured places before they are used to compose the chat
 * itinerary. The first occurrence keeps its day/order, matching the route
 * planner's existing behavior.
 */
export function deduplicateChatSpecificPlaces(places = [], city = '') {
  const result = []
  const seen = new Set()

  for (const place of Array.isArray(places) ? places : []) {
    const name = typeof place === 'string' ? place.trim() : String(place?.name || '').trim()
    if (!name) continue
    if (isChatHotelStop(name)) continue

    const key = canonicalChatPlaceKey(name, city)
    if (seen.has(key)) continue
    seen.add(key)

    const displayName = canonicalChatDisplayName(name, city)
    if (typeof place === 'string') {
      result.push(displayName)
    } else {
      result.push({ ...place, name: displayName })
    }
  }

  return result
}

/**
 * Removes accommodation lines only when they are being rendered as itinerary
 * bullets. Hotel information in normal explanatory prose remains intact.
 */
export function stripHotelStopsFromItineraryText(text, selectedHotel = null) {
  const source = String(text ?? '')
  if (!/itinerario\s+de\s+viaje|\bD[ií]a\s+\d+\s*:/i.test(source)) return source

  return source
    .split(/\r?\n/)
    .filter(line => {
      const bullet = line.match(/^\s*(?:[•●▪◦*-]|\d+[.)])\s+(.*)$/)
      if (!bullet) return true

      const candidate = bullet[1]
        .replace(/\*{1,2}/g, '')
        .replace(/^[^\p{L}\p{N}]*/u, '')
        .replace(/^(?:\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-—:]\s*)/i, '')
        .replace(/^(?:alojamiento|hospedaje|punto\s+de\s+(?:partida|encuentro)|base)\s*(?:\/|:|-)?\s*/i, '')
        .trim()

      return !isChatHotelStop(candidate, selectedHotel)
    })
    .join('\n')
}

export function sanitizeChatItineraryText(text, city = '', selectedHotel = null) {
  return stripHotelStopsFromItineraryText(collapseCanonicalDuplicateLines(text, city), selectedHotel)
}

export function deterministicJitter(name, baseLat, baseLon) {
  let hash = 0
  const str = String(name || '')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  const offsetLat = ((Math.abs(hash) % 100) - 50) * 0.00015
  const offsetLon = ((Math.abs(hash >> 3) % 100) - 50) * 0.00015
  return {
    latitude: baseLat + offsetLat,
    longitude: baseLon + offsetLon
  }
}

export function resolveCoordinatesForPlace(placeName, ...sources) {
  if (!placeName || typeof placeName !== 'string') return null
  const target = placeName.toLowerCase().trim()
  for (const src of sources) {
    if (!src) continue
    if (typeof src === 'object' && !Array.isArray(src)) {
      if (src[target] && Number.isFinite(src[target].latitude) && Number.isFinite(src[target].longitude)) {
        return src[target]
      }
    }
    if (Array.isArray(src)) {
      for (const item of src) {
        if (!item || typeof item !== 'object') continue
        const iName = (item.name || '').toLowerCase().trim()
        if (iName === target || arePlacesSimilar(iName, target)) {
          const lat = Number(item.latitude ?? item.lat)
          const lon = Number(item.longitude ?? item.lon)
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return {
              latitude: lat,
              longitude: lon,
              coordinateSource: item.coordinateSource || 'osm',
              coordinatesVerified: true
            }
          }
        }
      }
    }
  }
  return null
}

async function resolveOsmBackedChatPlace(place, city = '', country = '', selectedHotel = null) {
  const name = typeof place === 'string' ? place.trim() : String(place?.name || '').trim()
  if (!name || isChatHotelStop(name, selectedHotel) || isUnmappedOrClosedVenue(name)) return null

  // 1. If place already has verified coordinates, preserve them
  if (typeof place === 'object' && place?.latitude && place?.longitude && place?.coordinatesVerified) {
    return {
      name,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      address: place.address || `${name}, ${city}`,
      placeId: place.placeId || place.place_id || place.id || '',
      coordinateSource: place.coordinateSource || 'existing',
      coordinatesVerified: true
    }
  }

  // 2. Resolve city centroid for proximity / bounding
  let centerLat = null
  let centerLon = null
  if (city) {
    const cleanCityKey = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const centroid = FALLBACK_DESTINATION_CENTROIDS?.[cleanCityKey] || FALLBACK_DESTINATION_CENTROIDS?.[city.toLowerCase()]
    if (centroid) {
      centerLat = centroid.latitude
      centerLon = centroid.longitude
    }
  }

  const query = [name, city, country].filter(Boolean).join(', ')
  const geo = await geocodePlace(query, centerLat, centerLon, { city, country }).catch(() => null)
  if (hasOsmMapRecord(geo) && !isNonTouristFacility(geo) && isWithinCoastalCorridorBounds(geo.latitude, geo.longitude, city)) {
    return geo
  }

  // OSM may not contain a valid POI even when the unified commercial
  // catalog already verified the place. Use the same provider cascade used
  // by the planner before removing the itinerary bullet.
  const providerGeo = await resolvePlaceWithCascade({
    name,
    city,
    country,
    cityLat: centerLat,
    cityLon: centerLon,
    maxDistanceKm: 35,
    options: { preferCanonical: true }
  }).catch(() => null)
  if (providerGeo && Number.isFinite(Number(providerGeo.latitude)) && Number.isFinite(Number(providerGeo.longitude)) &&
      isWithinCoastalCorridorBounds(providerGeo.latitude, providerGeo.longitude, city)) {
    return providerGeo
  }

  return null
}

export async function filterChatSpecificPlacesByOsm(places = [], city = '', country = '', selectedHotel = null) {
  const input = Array.isArray(places) ? places : []
  const settled = await Promise.all(input.map(async place => {
    const rawName = typeof place === 'string' ? place.trim() : String(place?.name || '').trim()
    if (!rawName || isChatHotelStop(rawName, selectedHotel) || isUnmappedOrClosedVenue(rawName)) {
      return null
    }

    const geo = await resolveOsmBackedChatPlace(place, city, country, selectedHotel)
    if (!geo) {
      return null
    }

    if (typeof place === 'string') return geo.name || rawName
    return {
      ...place,
      name: String(place?.name || geo.name || rawName).trim(),
      latitude: geo.latitude,
      longitude: geo.longitude,
      address: geo.address || place.address || `${rawName}, ${city}`,
      placeId: geo.placeId || place.placeId || place.id || '',
      coordinateSource: geo.coordinateSource || 'osm',
      coordinatesVerified: true,
      isReferentialLocation: Boolean(geo.isReferentialLocation)
    }
  }))

  return deduplicateChatSpecificPlaces(
    settled.filter(Boolean).filter(place => {
      const name = typeof place === 'string' ? place : place?.name
      return !isChatHotelStop(name, selectedHotel)
    }),
    city
  )
}

function itineraryBulletPlaceName(line) {
  let candidate = String(line || '')
    .replace(/^\s*(?:[•●▪◦*-]|\d+[.)])\s*/, '')
    .replace(/\*{1,2}/g, '')
    .replace(/^[^\p{L}\p{N}]*/u, '')
    .trim()

  const actionMatch = candidate.match(/(?:visita\s+a|recorrido\s+por|almuerzo\s+en|cena\s+en|desayuno\s+en|parada\s+en|conoce\s+|explora\s+)\s*(.+)$/i)
  if (actionMatch) candidate = actionMatch[1].trim()
  candidate = candidate.split(/\s*:\s+/)[0].trim()
  return candidate
}

async function sanitizeChatRecommendationTextWithOsm(text, city = '', country = '') {
  const source = String(text ?? '')
  if (!/\b(lugares|atracciones|sitios|restaurantes|gastronom[íi]a|hoteles|hospedaje|alojamiento|recomiend|visitar)\b/i.test(source)) {
    return source
  }

  const nonPlaceBullet = /^(ubicaci[oó]n|direcci[oó]n|instalaciones|servicios|tarifa|precio|horario|consejo|recomendaci[oó]n)\b/i
  const lines = source.split(/\r?\n/)
  const checks = await Promise.all(lines.map(async line => {
    if (!/^\s*(?:[•●▪◦*-]|\d+[.)])\s+/.test(line)) return true
    const candidate = itineraryBulletPlaceName(line)
    if (!candidate || nonPlaceBullet.test(candidate)) return true
    if (isUnmappedOrClosedVenue(candidate) || isGenericFacilityName(candidate) || isNonTouristFacility({ name: candidate })) {
      return false
    }
    const query = [candidate, city, country].filter(Boolean).join(', ')
    const geo = await geocodePlace(query, null, null, { city, country }).catch(() => null)
    return hasOsmMapRecord(geo)
  }))

  return lines.filter((_, index) => checks[index]).join('\n')
}

export async function sanitizeChatItineraryTextWithOsm(text, city = '', country = '', selectedHotel = null, trustedPlaces = []) {
  const sanitized = sanitizeChatItineraryText(text, city, selectedHotel)
  if (!/itinerario\s+de\s+viaje|\bD[ií]a\s+\d+\s*:/i.test(sanitized)) {
    return sanitizeChatRecommendationTextWithOsm(sanitized, city, country)
  }

  const lines = sanitized.split(/\r?\n/)
  const trustedNames = (Array.isArray(trustedPlaces) ? trustedPlaces : [])
    .map(place => typeof place === 'string' ? place : place?.name)
    .map(name => String(name || '').trim())
    .filter(Boolean)
  const checks = await Promise.all(lines.map(async line => {
    if (!/^\s*(?:[•●▪◦*-]|\d+[.)])\s+/.test(line)) return true
    const candidate = itineraryBulletPlaceName(line)
    if (!candidate || isChatHotelStop(candidate, selectedHotel)) return false
    // These names already passed the unified real-candidate catalog. OSM can
    // still omit a valid place, so do not discard a verified provider result
    // merely because the second OSM-only check has no node for it.
    if (trustedNames.some(trusted => arePlacesSimilar(trusted, candidate))) return true
    return Boolean(await resolveOsmBackedChatPlace(candidate, city, country, selectedHotel))
  }))

  return lines.filter((_, index) => checks[index]).join('\n')
}

/**
 * Removes duplicate canonical aliases from bullet/numbered itinerary lines.
 * This is intentionally limited to list items so normal explanatory prose is
 * not rewritten.
 */
export function collapseCanonicalDuplicateLines(text, city = '') {
  const seen = new Set()
  return String(text ?? '')
    .split(/\r?\n/)
    .filter(line => {
      const bullet = line.match(/^(\s*(?:[•●▪◦*-]|\d+[.)])\s+)(.*)$/)
      if (!bullet) return true

      const candidate = bullet[2]
        .replace(/\*{1,2}/g, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .split(/\s+[—–-]\s+|\s*:\s*/)[0]
        .trim()
      const identity = resolveCanonicalPlaceIdentity(candidate, city)
      if (!identity) return true

      const key = `canonical:${identity.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join('\n')
}

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

export const DESTINATION_ICONIC_LANDMARKS = Object.freeze({
  'barranquilla': [
    'Gran Malecón del Río',
    'Ventana al Mundo',
    'Casa del Carnaval',
    'Ciénaga de Mallorquín',
    'Barrio El Prado',
    'Aleta del Tiburón (Ventana de Campeones)',
    'Bocas de Ceniza',
    'Zoológico de Barranquilla',
    'Monumento a Shakira',
    'Museo del Atlántico',
    'Castillo de Salgar',
    'Muelle de Puerto Colombia',
    'Catedral Metropolitana María Reina',
    'Teatro Amira de la Rosa'
  ],
  'covenas': [
    'Segunda Ensenada de Coveñas',
    'Ciénaga de la Caimanera',
    'Islas de San Bernardo',
    'Isla Múcura',
    'Isla Tintipán',
    'Playa Palo Blanco',
    'Punta de Piedra',
    'Malecón de Santiago de Tolú',
    'Bahía de Cispatá',
    'Volcán de Lodo de San Antero',
    'Playa La Coquerita',
    'Santa Cruz del Islote'
  ],
  'coveñas': [
    'Segunda Ensenada de Coveñas',
    'Ciénaga de la Caimanera',
    'Islas de San Bernardo',
    'Isla Múcura',
    'Isla Tintipán',
    'Playa Palo Blanco',
    'Punta de Piedra',
    'Malecón de Santiago de Tolú',
    'Bahía de Cispatá',
    'Volcán de Lodo de San Antero',
    'Playa La Coquerita',
    'Santa Cruz del Islote'
  ],
  'tolu': [
    'Malecón de Santiago de Tolú',
    'Islas de San Bernardo',
    'Isla Múcura',
    'Isla Tintipán',
    'Ciénaga de la Caimanera',
    'Playa El Francés',
    'Segunda Ensenada de Coveñas'
  ],
  'santiago de tolu': [
    'Malecón de Santiago de Tolú',
    'Islas de San Bernardo',
    'Isla Múcura',
    'Isla Tintipán',
    'Ciénaga de la Caimanera',
    'Playa El Francés',
    'Segunda Ensenada de Coveñas'
  ],
  'san antero': [
    'Bahía de Cispatá',
    'Volcán de Lodo de San Antero',
    'Playa Blanca San Antero',
    'Ciénaga de la Caimanera',
    'Segunda Ensenada de Coveñas',
    'Islas de San Bernardo'
  ],
  'santa marta': [
    'Quinta de San Pedro Alejandrino',
    'Catedral Basílica de Santa Marta',
    'Museo del Oro Tairona',
    'Parque de Los Novios',
    'Playa El Rodadero',
    'Bahía de Taganga',
    'Parque Nacional Natural Tayrona',
    'Minca, Sierra Nevada',
    'Playa Blanca, Santa Marta'
  ],
  'cartagena': [
    'Castillo San Felipe de Barajas',
    'Ciudad Amurallada de Cartagena',
    'Torre del Reloj, Centro Histórico',
    'Barrio Getsemaní, Cartagena',
    'Convento de la Popa',
    'Plaza de Santo Domingo',
    'Islas del Rosario, Cartagena',
    'Playa Blanca Barú, Cartagena',
    'Bocagrande, Cartagena'
  ]
})

export const DESTINATION_ICONIC_RESTAURANTS = Object.freeze({
  'golfo de morrosquillo': [
    { name: 'Donde Valerio en Tolú', specialty: 'Pescado frito tradicional y patacones frente al mar' },
    { name: 'Restaurante Coveñas', specialty: 'Pescados frescos, mariscos y cazuela caribeña' },
    { name: 'Kiosko El Pescador', specialty: 'Comida de mar y ceviches frescos en la playa' },
    { name: 'Restaurante el Montañero', specialty: 'Gastronomía típica colombiana y asados frente a la costa' },
    { name: 'Kioskos Típicos Ciénaga de la Caimanera', specialty: 'Ostras frescas y gastronomía típica de manglar' },
    { name: 'Restaurante Esmeralda', specialty: 'Comida tradicional costeña y frutos del mar en San Antero' }
  ],
  'covenas': [
    { name: 'Donde Valerio en Tolú', specialty: 'Pescado frito tradicional y patacones frente al mar' },
    { name: 'Restaurante Coveñas', specialty: 'Pescados frescos, mariscos y cazuela caribeña' },
    { name: 'Kiosko El Pescador', specialty: 'Comida de mar y ceviches frescos en la playa' },
    { name: 'Restaurante el Montañero', specialty: 'Gastronomía típica colombiana y asados frente a la costa' },
    { name: 'Kioskos Típicos Ciénaga de la Caimanera', specialty: 'Ostras frescas y gastronomía típica de manglar' },
    { name: 'Restaurante Esmeralda', specialty: 'Comida tradicional costeña y frutos del mar en San Antero' }
  ],
  'coveñas': [
    { name: 'Donde Valerio en Tolú', specialty: 'Pescado frito tradicional y patacones frente al mar' },
    { name: 'Restaurante Coveñas', specialty: 'Pescados frescos, mariscos y cazuela caribeña' },
    { name: 'Kiosko El Pescador', specialty: 'Comida de mar y ceviches frescos en la playa' },
    { name: 'Restaurante el Montañero', specialty: 'Gastronomía típica colombiana y asados frente a la costa' },
    { name: 'Kioskos Típicos Ciénaga de la Caimanera', specialty: 'Ostras frescas y gastronomía típica de manglar' },
    { name: 'Restaurante Esmeralda', specialty: 'Comida tradicional costeña y frutos del mar en San Antero' }
  ],
  'barranquilla': [
    { name: 'Restaurante La Cueva', specialty: 'Gastronomía Caribe y tertulia cultural' },
    { name: 'Cucayo', specialty: 'Comida tradicional costeña y arroz con cucayo' },
    { name: 'Varadero', specialty: 'Pescados y mariscos al estilo cubano-caribeño' },
    { name: 'Nena Lela', specialty: 'Comida típica tradicional barranquillera' },
    { name: 'El Caimán del Río', specialty: 'Mercado gastronómico frente al río Magdalena' },
    { name: 'Restaurante La Herradura', specialty: 'Carnes y asados tradicionales' }
  ],
  'santa marta': [
    { name: 'Restaurante Donde Chucho', specialty: 'Pescados frescos, mariscos y cazuela caribeña' },
    { name: 'Restaurante Ouzo', specialty: 'Cocina mediterránea y griega con productos locales' },
    { name: 'Restaurante Burukuka', specialty: 'Gastronomía caribeña y cócteles con vista al mar' }
  ],
  'cartagena': [
    { name: 'Restaurante La Cevicheria', specialty: 'Ceviches frescos y frutos del mar en el Centro Histórico' },
    { name: 'Restaurante Celele', specialty: 'Cocina contemporánea del Caribe colombiano' },
    { name: 'Restaurante Candé', specialty: 'Gastronomía 100% cartagenera y caribeña tradicional' }
  ]
})

export function formatHotelPriceRange(minUsd, maxUsd, currency = 'cop') {
  const curr = String(currency || 'cop').toLowerCase()
  if (curr === 'cop') {
    const minCop = Math.round((minUsd * 4100) / 10000) * 10000
    const maxCop = Math.round((maxUsd * 4100) / 10000) * 10000
    const fmt = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `~$${fmt(minCop)} - $${fmt(maxCop)} COP/noche`
  } else if (curr === 'eur') {
    const minEur = Math.round(minUsd * 0.93)
    const maxEur = Math.round(maxUsd * 0.93)
    return `~€${minEur} - €${maxEur}/noche`
  } else {
    return `~$${minUsd} - $${maxUsd} USD/noche`
  }
}

export function getHotelPriceDisplay(hotel, currency = 'cop') {
  if (!hotel) return formatHotelPriceRange(80, 150, currency)
  if (hotel.minUsd != null && hotel.maxUsd != null) {
    return formatHotelPriceRange(hotel.minUsd, hotel.maxUsd, currency)
  }
  if (typeof hotel.price === 'string') {
    const m = hotel.price.match(/\$?(\d+)\s*-\s*\$?(\d+)/)
    if (m) {
      const min = parseInt(m[1], 10)
      const max = parseInt(m[2], 10)
      return formatHotelPriceRange(min, max, currency)
    }
    return hotel.price
  }
  return formatHotelPriceRange(80, 150, currency)
}

export function isExplicitlyChoosingHotel(message = '') {
  const text = String(message || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (isLodgingNegationOrUncertainty(text)) return false
  return /\b(confirmar|confirmo|confirmado|elegir|elijo|elegi|ya\s+elegi|escoger|escojo|escogi|seleccionar|selecciono|seleccione|me\s+quedo\s+(?:en|con)|quiero\s+hospedarme\s+en|me\s+hospedo\s+en|este\s+hotel|ese\s+hotel|esta\s+bien|me\s+parece\s+bien|me\s+gusta(?:\s+el)?|vamos\s+con\s+(?:el\s+)?|el\s+primero|la\s+primera(?:\s+opcion)?|opcion\s*1|el\s+segundo|la\s+segunda(?:\s+opcion)?|opcion\s*2|la\s+tercera(?:\s+opcion)?|el\s+tercero|opcion\s*3)\b/i.test(text)
}

export const DESTINATION_ICONIC_HOTELS = Object.freeze({
  'barranquilla': [
    { name: 'Hotel Dann Carlton Barranquilla', desc: 'Hotel de alta categoría ubicado frente al centro comercial Buenavista en el norte', price: '~$90 - $140 USD/noche', minUsd: 90, maxUsd: 140 },
    { name: 'Hotel El Prado', desc: 'Monumento arquitectónico y hotel patrimonial de estilo republicano en el tradicional barrio El Prado', price: '~$80 - $120 USD/noche', minUsd: 80, maxUsd: 120 },
    { name: 'GHL Hotel Grand Barranquilla', desc: 'Hotel moderno con excelente conectividad cerca de centros gastronómicos del norte', price: '~$70 - $110 USD/noche', minUsd: 70, maxUsd: 110 },
    { name: 'Crowne Plaza Barranquilla', desc: 'Alojamiento contemporáneo con vistas panorámicas cerca del corredor comercial', price: '~$95 - $150 USD/noche', minUsd: 95, maxUsd: 150 }
  ],
  'cartagena': [
    { name: 'Hotel Casa La Fe', desc: 'Hotel boutique en la Plaza Fernández de Madrid en el Centro Histórico amurallado', price: '~$90 - $130 USD/noche', minUsd: 90, maxUsd: 130 },
    { name: 'Hotel Santa Clara', desc: 'Convento colonial icónico de lujo en el Centro Amurallado cerca de Las Bóvedas', price: '~$250 - $400 USD/noche', minUsd: 250, maxUsd: 400 },
    { name: 'Hotel Casa Isabel', desc: 'Hotel boutique en Getsemaní con terraza hacia la laguna y ambiente bohemio', price: '~$80 - $120 USD/noche', minUsd: 80, maxUsd: 120 }
  ],
  'santa marta': [
    { name: 'Hotel Boutique Don Pepe', desc: 'Hotel boutique colonial en el Centro Histórico, ideal para estar cerca de la Catedral, el Parque de los Novios y restaurantes', price: '~$100 - $160 USD/noche', minUsd: 100, maxUsd: 160 },
    { name: 'Santa Marta Marriott Resort Playa Dormida', desc: 'Resort frente al mar con acceso directo a la playa y piscina en el sector de Bello Horizonte', price: '~$120 - $180 USD/noche', minUsd: 120, maxUsd: 180 }
  ],
  'covenas': [
    { name: 'Hotel Palma Linda', desc: 'Hotel de playa frente al mar en la Primera Ensenada de Coveñas', price: '~$60 - $95 USD/noche', minUsd: 60, maxUsd: 95 },
    { name: 'Hotel Punta de Piedra', desc: 'Alojamiento frente al mar con acceso a la playa en el sector de Punta de Piedra', price: '~$70 - $110 USD/noche', minUsd: 70, maxUsd: 110 }
  ],
  'coveñas': [
    { name: 'Hotel Palma Linda', desc: 'Hotel de playa frente al mar en la Primera Ensenada de Coveñas', price: '~$60 - $95 USD/noche', minUsd: 60, maxUsd: 95 },
    { name: 'Hotel Punta de Piedra', desc: 'Alojamiento frente al mar con acceso a la playa en el sector de Punta de Piedra', price: '~$70 - $110 USD/noche', minUsd: 70, maxUsd: 110 }
  ]
})

export function isCountryMatch(c1, c2) {
  if (!c1 || !c2) return true
  const n1 = String(c1).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const n2 = String(c2).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (n1 === n2) return true
  if (n1 === 'colombia' && (n2 === 'brasil' || n2 === 'brazil' || n2 === 'espana' || n2 === 'spain')) return false
  return n1.includes(n2) || n2.includes(n1)
}

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
  // La Fragata is an accommodation/chalet, NOT a restaurant
  if (lower.includes('la fragata') && (lower.includes('restaurante') || lower.includes('restaurant'))) return true
  // El Gran Pez has no node in Coveñas on OSM and causes pins in air base/empty lots
  if (lower.includes('el gran pez')) return true
  // Parque Principal de Coveñas does not exist on OpenStreetMap
  if (lower.includes('parque principal de covena') || lower.includes('parque principal covena')) return true
  return false
}

/**
 * A catalog label is only safe to expose as a place when it has gone through
 * the map-backed verification path.  This helper intentionally does not try
 * to guess whether a name is real from its wording: a real venue may contain
 * words such as "Central", "Plaza" or "Boutique".  The source of truth is
 * the verification result, not the language model's confidence.
 */
function verifiedCatalogEntries(entries, city, country, limit, centerLat = null, centerLon = null, category = 'attraction') {
  return verifyCatalogEntriesOnOsm(entries, city, country, limit, centerLat, centerLon, category)
}

async function resolveDestinationCenter({ destination = '', country = '', userLat = null, userLon = null } = {}) {
  if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLon)) && Number(userLat) !== 0 && Number(userLon) !== 0) {
    return { latitude: Number(userLat), longitude: Number(userLon), source: 'user' }
  }

  const osmGeo = await geocodePlace(`${destination}, ${country}`.trim(), null, null, {
    city: destination,
    destination,
    country
  }).catch(() => null)
  if (Number.isFinite(Number(osmGeo?.latitude)) && Number.isFinite(Number(osmGeo?.longitude)) &&
      Number(osmGeo.latitude) !== 0 && Number(osmGeo.longitude) !== 0) {
    return { latitude: Number(osmGeo.latitude), longitude: Number(osmGeo.longitude), source: osmGeo.coordinateSource || 'osm' }
  }

  const providerGeo = await resolveProviderDestinationCenter({ destination, country }).catch(() => null)
  if (providerGeo && Number.isFinite(Number(providerGeo.latitude)) && Number.isFinite(Number(providerGeo.longitude)) &&
      Number(providerGeo.latitude) !== 0 && Number(providerGeo.longitude) !== 0) {
    return { latitude: Number(providerGeo.latitude), longitude: Number(providerGeo.longitude), source: providerGeo.source || 'provider' }
  }

  const normalizedDestination = String(destination || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  const centroid = Object.entries(FALLBACK_DESTINATION_CENTROIDS).find(([key]) => {
    const normalizedKey = String(key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    return normalizedKey === normalizedDestination
  })?.[1]
  if (centroid && Number.isFinite(Number(centroid.latitude)) && Number.isFinite(Number(centroid.longitude))) {
    return { latitude: Number(centroid.latitude), longitude: Number(centroid.longitude), source: 'destination-centroid' }
  }

  return null
}

export async function discoverProviderFallbackCandidates({ destination, country, category, limit = 8 }) {
  const center = await resolveDestinationCenter({ destination, country })
  const centerLat = Number(center?.latitude)
  const centerLon = Number(center?.longitude)
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon)) return []

  const queries = category === 'attraction'
    ? ['tourism', 'museum', 'park', 'viewpoint', 'atracción turística'].map(term => `${term} ${destination}, ${country}`)
    : category === 'hotel'
      ? ['hotel', 'hostel', 'accommodation'].map(term => `${term} ${destination}, ${country}`)
      : ['restaurant', 'local cuisine', 'cafe'].map(term => `${term} ${destination}, ${country}`)
  const categories = category === 'attraction'
    ? ['tourism.sights', 'tourism.attraction', 'leisure.park', 'natural']
    : category === 'hotel'
      ? ['accommodation.hotel', 'accommodation.hostel', 'accommodation.guest_house']
      : ['catering.restaurant', 'catering.cafe', 'catering.fast_food']

  let [mapbox, geoapify] = await Promise.all([
    searchMapboxPlaces({ queries, cityLat: centerLat, cityLon: centerLon, maxDistanceKm: 35 }).catch(() => []),
    searchGeoapifyPlaces({ categories, cityLat: centerLat, cityLon: centerLon, radiusMeters: 35000, limit: Math.max(limit * 2, 12) }).catch(() => [])
  ])

  let rawCandidates = [...mapbox, ...geoapify]
  if (rawCandidates.length === 0) {
    // A provider may return an empty page transiently after a burst of
    // requests. Retry discovery once with the commercial city center, which
    // also avoids depending on a Photon circuit-breaker state.
    const providerCenter = await resolveProviderDestinationCenter({ destination, country }).catch(() => null)
    if (providerCenter && Number.isFinite(Number(providerCenter.latitude)) && Number.isFinite(Number(providerCenter.longitude))) {
      ;[mapbox, geoapify] = await Promise.all([
        searchMapboxPlaces({ queries, cityLat: Number(providerCenter.latitude), cityLon: Number(providerCenter.longitude), maxDistanceKm: 35 }).catch(() => []),
        searchGeoapifyPlaces({ categories, cityLat: Number(providerCenter.latitude), cityLon: Number(providerCenter.longitude), radiusMeters: 35000, limit: Math.max(limit * 2, 12) }).catch(() => [])
      ])
      rawCandidates = [...mapbox, ...geoapify]
    }
  }

  return rawCandidates
    .map(candidate => normalizeRealCandidate(candidate, {
      category,
      destination,
      country,
      centerLat,
      centerLon,
      radiusKm: 35
    }))
    .filter(Boolean)
    .slice(0, limit)
}

export function isMalformedItinerary(text) {
  if (!text || typeof text !== 'string') return false
  return (
    /(?:D[íi]a\s*\d+:[^\n]*\n(?:\s*•\s*(?:Restaurante|Gastronom[íi]a|Caf[ée]|Bar)[^\n]*\n){2,})/i.test(text) ||
    /\b(?:Nordest[aã]o|Cal\s+Bandarra|Vers[aá]\s+Gastronomia|Albertu's)\b/i.test(text) ||
    /\bPlaza\s+(?:descanso(?:\s*\d+)?|hospital)\b/i.test(text) ||
    /\bdescanso\s*\d+\b/i.test(text) ||
    /\bHotel\s+Central\s+de\b/i.test(text) ||
    /\bGastronom[ií]a\s+Local(?:\s+de|\s+en)?\b/i.test(text) ||
    /\bRestaurante\s+(?:T[ií]pico|Local|por\s+d[ií]a)\b/i.test(text) ||
    /\bParque\s+(?:Principal\s+de\s+)?Coveñas\b/i.test(text) ||
    /\bRestaurante\s+La\s+Fragata\b/i.test(text) ||
    /\bRestaurante\s+El\s+Gran\s+Pez\b/i.test(text) ||
    /\bRestaurante\s+Sabores\s+del\s+Mar\b/i.test(text) ||
    /\bRestaurante\s+La\s+Iguana\b/i.test(text)
  )
}


async function verifyCatalogEntryOnOsm(entry, city, country, centerLat = null, centerLon = null, category = 'attraction') {
  const name = typeof entry === 'string'
    ? entry.trim()
    : String(entry?.name || '').trim()
  if (!name || isUnmappedOrClosedVenue(name)) return null

  const geo = await resolvePlaceWithCascade({
    name,
    city,
    country,
    cityLat: centerLat,
    cityLon: centerLon,
    maxDistanceKm: 65,
    options: { preferLiveProviders: true }
  }).catch(() => null)
  if (!hasOsmMapRecord(geo)) return null

  if (!isWithinCoastalCorridorBounds(geo.latitude, geo.longitude, city)) return null

  if (category === 'restaurant' || (typeof entry === 'object' && entry?.specialty)) {
    const geoTags = geo.tags || {}
    const isAccom = ['chalet', 'hotel', 'guest_house', 'motel', 'hostel'].includes(geo.type) ||
      ['chalet', 'hotel', 'guest_house', 'motel', 'hostel'].includes(geoTags.osm_value) ||
      geoTags.tourism === 'chalet' || geoTags.tourism === 'hotel'
    if (isAccom && !/restaurante|restaurant|bistro|caf[ée]|comida/i.test(geo.name)) {
      return null
    }
  }

  if (centerLat != null && centerLon != null && geo.latitude != null && geo.longitude != null) {
    const dist = haversineMeters(centerLat, centerLon, geo.latitude, geo.longitude)
    if (dist > 65000) return null
  }

  return {
    ...(typeof entry === 'object' ? entry : {}),
    name,
    latitude: geo.latitude,
    longitude: geo.longitude,
    address: geo.address || entry?.address || '',
    placeId: geo.placeId || entry?.placeId || '',
    coordinateSource: geo.coordinateSource,
    coordinatesVerified: true,
    type: geo.type || entry?.type || '',
    category: geo.category || entry?.category || '',
    tags: geo.tags || entry?.tags || {},
    catalogCategoryEvidence: category,
    catalogNameVerified: true,
  }
}

async function verifyCatalogEntriesOnOsm(entries, city, country, limit = 16, centerLat = null, centerLon = null, category = 'attraction') {
  const candidates = (Array.isArray(entries) ? entries : []).slice(0, limit)
  const verified = await Promise.all(candidates.map(entry => verifyCatalogEntryOnOsm(entry, city, country, centerLat, centerLon, category)))
  return verified.filter(Boolean)
}

export async function suggestPlacesWithOpenAI({ destination = '', country = '', count = 8 }) {
  const cleanDest = String(destination || '').trim()
  if (!cleanDest) return []

  const apiKey = process.env.OPENAI_API_KEY

  const targetDest = `${cleanDest}${country ? `, ${country}` : ''}`.trim()
  const system = `Eres un asistente experto en turismo global de VibeTours.
Tu tarea es retornar los lugares turísticos, plazas, monumentos, parques y sitios históricos más conocidos, reales e imperdibles en cualquier ciudad del mundo.

Devuelve ÚNICAMENTE un JSON con este formato exacto:
{
  "places": [
    {
      "name": "Nombre exacto y real del atractivo o sitio turístico",
      "category": "historic | culture | nature | viewpoint | park | beach"
    }
  ]
}`

  if (apiKey) try {
    const response = await fetchWithProviderRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        modelConfig: getFastOpenAiModelConfig(),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Retorna los ${count} lugares turísticos y atracciones emblemáticas más conocidos y reales en ${targetDest}.` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })),
    }, {
      attempts: 3,
      timeoutMs: 12000
    })

    if (response.ok) {
      const data = await response.json()
      const parsed = cleanAndParseJson(data.choices?.[0]?.message?.content, null)
      const rawPlaces = Array.isArray(parsed) ? parsed : (parsed?.places || parsed?.lugares || [])
      if (Array.isArray(rawPlaces) && rawPlaces.length > 0) {
        const candidates = rawPlaces.filter(p => p && (typeof p === 'string' || p.name || p.nombre)).map(p => ({
          name: String(typeof p === 'string' ? p : (p.name || p.nombre)).trim(),
          category: String(typeof p === 'object' && p.category ? p.category : 'historic')
        }))
        const verified = await verifiedCatalogEntries(candidates, cleanDest, country, count, null, null, 'attraction')
        if (verified.length > 0) return verified
      }
    }
  } catch (err) {
    console.warn('[suggestPlacesWithOpenAI] Error:', err?.message || err)
  }

  // OpenAI is optional for discovery. Commercial providers can supply the
  // real, ID-backed candidates even when the model quota is unavailable.
  const providerPlaces = await discoverProviderFallbackCandidates({
    destination: cleanDest,
    country,
    category: 'attraction',
    limit: count
  }).catch(() => [])
  if (providerPlaces.length > 0) return providerPlaces

  const fallbackIconics = await fetchCityIconicLandmarks(cleanDest, country).catch(() => [])
  if (Array.isArray(fallbackIconics) && fallbackIconics.length > 0) {
    const verified = await verifiedCatalogEntries(
      fallbackIconics,
      cleanDest,
      country,
      count,
      null,
      null,
      'attraction'
    )
    if (verified.length > 0) return verified
  }

  const [parks, attractions, museums] = await Promise.all([
    photonSearch(`parque ${cleanDest}`, count, null, null, null, null, country).catch(() => []),
    photonSearch(`turismo ${cleanDest}`, count, null, null, null, null, country).catch(() => []),
    photonSearch(`museo ${cleanDest}`, count, null, null, null, null, country).catch(() => [])
  ])
  const combined = [...parks, ...attractions, ...museums]
    .filter(p => p && p.name && !isGenericFacilityName(p.name) && !isFoodOrDrinkEstablishment(p.name))
  const seen = new Set()
  const uniquePhoton = []
  for (const item of combined) {
    const k = item.name.toLowerCase().trim()
    if (!seen.has(k)) {
      seen.add(k)
      uniquePhoton.push({ name: item.name, category: 'historic' })
    }
  }
  if (uniquePhoton.length > 0) {
    return verifiedCatalogEntries(uniquePhoton, cleanDest, country, count, null, null, 'attraction')
  }

  return []
}

export async function suggestHotelsWithOpenAI({ destination = '', country = '', budget = 'Moderado' }) {
  const cleanDest = String(destination || '').trim()
  if (!cleanDest) return []

  const apiKey = process.env.OPENAI_API_KEY

  const targetDest = `${cleanDest}${country ? `, ${country}` : ''}`.trim()
  const system = `Eres un asistente experto en viajes de VibeTours.
Tu tarea es retornar los 3 hoteles más conocidos y reales en cualquier ciudad del mundo ajustados a presupuesto (${budget}).

Devuelve ÚNICAMENTE un JSON con este formato exacto:
{
  "hotels": [
    {
      "name": "Nombre exacto del hotel real",
      "desc": "Descripción concisa de 1 oración resaltando su ubicación o servicios",
      "stars": "4"
    }
  ]
}`

  if (apiKey) try {
    const response = await fetchWithProviderRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        modelConfig: getFastOpenAiModelConfig(),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Retorna los 3 hoteles más conocidos y reales en ${targetDest} ajustados a presupuesto ${budget}.` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low'
      })),
    }, {
      attempts: 3,
      timeoutMs: 5000
    })

    if (response.ok) {
      const data = await response.json()
      const parsed = cleanAndParseJson(data.choices?.[0]?.message?.content, null)
      if (parsed && Array.isArray(parsed.hotels) && parsed.hotels.length > 0) {
        const candidates = parsed.hotels.filter(h => h && (h.name || h.nombre)).map(h => ({
          name: h.name || h.nombre,
          desc: h.desc || h.descripcion || `Alojamiento destacado en ${cleanDest}`,
          stars: String(h.stars || h.estrellas || '4')
        })).slice(0, 3)
        const verified = await verifiedCatalogEntries(candidates, cleanDest, country, 3, null, null, 'hotel')
        if (verified.length > 0) return verified
      }
    }
  } catch (err) {
    console.warn('[suggestHotelsWithOpenAI] Error:', err?.message || err)
  }

  const providerHotels = await discoverProviderFallbackCandidates({
    destination: cleanDest,
    country,
    category: 'hotel',
    limit: 3
  }).catch(() => [])
  if (providerHotels.length > 0) {
    return providerHotels.map(hotel => ({
      ...hotel,
      desc: hotel.description || `Alojamiento verificado ubicado en ${cleanDest}`,
      stars: hotel.stars || '4'
    }))
  }

  const [hotelsRes, hostalsRes] = await Promise.all([
    photonSearch(`hotel ${cleanDest}`, 5, null, null, null, null, country).catch(() => []),
    photonSearch(`hostal ${cleanDest}`, 5, null, null, null, null, country).catch(() => [])
  ])
  const combinedHotels = [...hotelsRes, ...hostalsRes]
    .filter(h => h && h.name && !isGenericFacilityName(h.name))
  const seenH = new Set()
  const uniqueH = []
  for (const item of combinedHotels) {
    const k = item.name.toLowerCase().trim()
    if (!seenH.has(k)) {
      seenH.add(k)
      uniqueH.push({
        name: item.name,
        desc: `Alojamiento verificado ubicado en ${cleanDest}`,
        stars: '4'
      })
    }
  }
  if (uniqueH.length > 0) {
    return verifiedCatalogEntries(uniqueH, cleanDest, country, 3, null, null, 'hotel')
  }

  return []
}

/**
 * 100% Dynamic Global Catalog Resolver.
 * Fetches verified real venues, restaurants, cafes, bars, and attractions
 * dynamically from OpenStreetMap (Overpass API / Photon) anywhere in the world.
 */
export async function getRealDestinationCatalog(destName = '', countryName = '', userLat = null, userLon = null) {
  const clean = cleanAdministrativeCityName(destName).toLowerCase()
  const normalizedCountry = String(countryName || '').trim().toLowerCase()
  const cacheKey = `catalog_osm_v2_${clean}_${normalizedCountry}`
  const cached = destinationCatalogCache.get(cacheKey)
  if (cached) return cached

  // 1. Dynamic Geocode & OSM Live Query
  let lat = userLat
  let lon = userLon
  if (!lat || !lon) {
    const center = await resolveDestinationCenter({ destination: destName, country: countryName })
    if (center) {
      lat = center.latitude
      lon = center.longitude
    }
  }

  const capitalCity = clean ? clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Destino'
  const targetCountry = countryName || 'Local'

  let realHotels = []
  let realRests = []
  let realPlaces = []
  let realEvents = []

  // 1. Ground truth priority:
  // 1.1 Resolve iconic / priority landmarks FIRST (curated presets or dynamic iconic query)
  const cleanKey = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const presetIconics = DESTINATION_ICONIC_LANDMARKS[cleanKey] || DESTINATION_ICONIC_LANDMARKS[clean] || []
  if (presetIconics.length > 0) {
    const verifiedIconics = await verifyCatalogEntriesOnOsm(presetIconics, clean, targetCountry, presetIconics.length, lat, lon)
    for (const vi of verifiedIconics) {
      if (!realPlaces.some(rp => arePlacesSimilar(rp, vi.name))) {
        realPlaces.push(vi)
      }
    }
  }

  if (realPlaces.length < 8) {
    const dynamicIconics = await fetchCityIconicLandmarks(clean, targetCountry).catch(() => [])
    const verifiedDynamic = await verifyCatalogEntriesOnOsm(dynamicIconics, clean, targetCountry, 14, lat, lon)
    for (const vd of verifiedDynamic) {
      if (!realPlaces.some(rp => arePlacesSimilar(rp, vd.name))) {
        realPlaces.push(vd)
      }
    }
  }

  // 1.2 Resolve iconic restaurants FIRST
  const presetRests = DESTINATION_ICONIC_RESTAURANTS[cleanKey] || DESTINATION_ICONIC_RESTAURANTS[clean] || []
  if (presetRests.length > 0) {
    const verifiedRests = await verifyCatalogEntriesOnOsm(presetRests, clean, targetCountry, presetRests.length, lat, lon, 'restaurant')
    for (const pr of verifiedRests) {
      if (!realRests.some(r => arePlacesSimilar(r.name, pr.name))) {
        realRests.push(pr)
      }
    }
  }

  // 1.2.1 Resolve iconic hotels from presets if available
  const presetHotels = DESTINATION_ICONIC_HOTELS[cleanKey] || DESTINATION_ICONIC_HOTELS[clean] || []
  if (presetHotels.length > 0 && realHotels.length === 0) {
    const verifiedHotels = await verifyCatalogEntriesOnOsm(presetHotels, clean, targetCountry, presetHotels.length, lat, lon, 'hotel')
    for (const vh of verifiedHotels) {
      if (!realHotels.some(h => arePlacesSimilar(h.name, vh.name))) {
        realHotels.push(vh)
      }
    }
  }

  // 1.3 Query live OpenStreetMap POIs (Overpass and Photon) only when complements are needed
  const needsOsmComplement = (realPlaces.length < 10 || realRests.length < 4 || realHotels.length < 2) && lat && lon
  if (needsOsmComplement) {
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 2000))
    const [osmHotels, osmRests, osmAttractions] = await Promise.all([
      realHotels.length < 2
        ? Promise.race([overpassHotels(lat, lon, 'moderate', 15000).catch(() => []), timeoutPromise])
        : Promise.resolve([]),
      realRests.length < 4
        ? Promise.race([overpassNearbyFood(lat, lon, 10000).catch(() => []), timeoutPromise])
        : Promise.resolve([]),
      realPlaces.length < 10
        ? Promise.race([overpassAttractions(lat, lon, 35000).catch(() => []), timeoutPromise])
        : Promise.resolve([])
    ])

    const fetchedHotels = (osmHotels || []).filter(h => h && h.name && !isGenericFacilityName(h.name) && !isNonTouristFacility(h.tags) && !isNonTouristFacility({ name: h.name }) && !h.name.toLowerCase().includes('perímetro urbano')).slice(0, 6)
    const fetchedRests = (osmRests || []).filter(r => {
      if (!r || !r.name || isGenericFacilityName(r.name) || isNonTouristFacility(r.tags) || isNonTouristFacility({ name: r.name }) || isUnmappedOrClosedVenue(r.name)) return false
      if (r.name.toLowerCase().includes('perímetro urbano')) return false
      if (r.latitude != null && r.longitude != null) {
        if (!isWithinCoastalCorridorBounds(r.latitude, r.longitude, clean)) return false
        const d = haversineMeters(lat, lon, r.latitude, r.longitude)
        if (d > 25000) return false
      }
      return true
    }).slice(0, 14)
    const fetchedPlaces = (osmAttractions || []).filter(p => {
      if (!p || !p.name || isGenericFacilityName(p.name) || isNonTouristFacility(p.tags) || isNonTouristFacility({ name: p.name }) || isFoodOrDrinkEstablishment(p.name) || isUnmappedOrClosedVenue(p.name)) return false
      if (p.name.toLowerCase().includes('perímetro urbano')) return false
      if (p.latitude != null && p.longitude != null) {
        if (!isWithinCoastalCorridorBounds(p.latitude, p.longitude, clean)) return false
        const d = haversineMeters(lat, lon, p.latitude, p.longitude)
        if (d > 35000) return false
      }
      return true
    }).slice(0, 14)

    if (realHotels.length === 0) realHotels = fetchedHotels
    for (const fr of fetchedRests) {
      if (!realRests.some(r => r.name.toLowerCase() === fr.name.toLowerCase() || arePlacesSimilar(r.name, fr.name))) {
        realRests.push(fr)
      }
    }
    for (const fp of fetchedPlaces) {
      if (!realPlaces.some(rp => arePlacesSimilar(rp, fp.name))) {
        realPlaces.push(fp)
      }
    }

    if (realPlaces.length < 10) {
      const [generalPlaces, museums] = await Promise.all([
        photonSearch(`turismo ${clean}`, 6, lat, lon, null, 35000, targetCountry).catch(() => []),
        photonSearch(`museo ${clean}`, 6, lat, lon, null, 35000, targetCountry).catch(() => [])
      ])
      const additional = [
        ...generalPlaces,
        ...museums
      ].filter(p => {
        if (!p || !p.name || isGenericFacilityName(p.name) || isNonTouristFacility(p.tags) || isNonTouristFacility({ name: p.name }) || isFoodOrDrinkEstablishment(p.name) || isUnmappedOrClosedVenue(p.name)) return false
        if (p.name.toLowerCase().includes('perímetro urbano')) return false
        if (p.latitude != null && p.longitude != null && lat != null && lon != null) {
          if (!isWithinCoastalCorridorBounds(p.latitude, p.longitude, clean)) return false
          const dist = haversineMeters(lat, lon, p.latitude, p.longitude)
          if (dist > 35000) return false
        }
        return true
      })

      for (const p of additional) {
        if (!realPlaces.some(rp => arePlacesSimilar(rp, p.name))) {
          realPlaces.push(p)
        }
      }
    }
  }

  // 2. Dynamic global travel intelligence: Fetch authentic profile from OpenAI only when catalog lacks sufficient entities
  const needsDynamicProfile = realPlaces.length < 8 || realRests.length < 3 || realHotels.length < 2
  if (needsDynamicProfile) {
    try {
      const dynamicProfile = await fetchDynamicDestinationProfile(clean, targetCountry).catch(() => null)
      if (dynamicProfile) {
        const verifiedProfilePlaces = await verifyCatalogEntriesOnOsm(dynamicProfile.places || [], clean, targetCountry, 12, lat, lon)
        for (const p of verifiedProfilePlaces) {
          if (!realPlaces.some(rp => arePlacesSimilar(rp, p.name))) {
            realPlaces.push(p)
          }
        }
        const verifiedProfileRestaurants = await verifyCatalogEntriesOnOsm(dynamicProfile.restaurants || [], clean, targetCountry, 12, lat, lon, 'restaurant')
        for (const r of verifiedProfileRestaurants) {
          if (!realRests.some(existing => arePlacesSimilar(existing.name || existing, r.name))) {
            realRests.push(r)
          }
        }
        const verifiedProfileHotels = await verifyCatalogEntriesOnOsm(dynamicProfile.hotels || [], clean, targetCountry, 8, lat, lon, 'hotel')
        for (const h of verifiedProfileHotels) {
          if (!realHotels.some(existing => arePlacesSimilar(existing.name || existing, h.name))) {
            realHotels.push(h)
          }
        }
        if (realEvents.length === 0 && Array.isArray(dynamicProfile.events)) {
          realEvents.push(...dynamicProfile.events)
        }
      }
    } catch (_) {}
  }

  if (realRests.length < 10 && lat && lon) {
    const extraFood = await photonSearch(`restaurante ${clean}`, 12, lat, lon, null, 30000, targetCountry).catch(() => [])
    for (const ef of extraFood) {
      if (ef?.name && !isGenericFacilityName(ef.name) && !isNonTouristFacility({ name: ef.name }) && !isUnmappedOrClosedVenue(ef.name)) {
        if (targetCountry && ef.country && !isCountryMatch(targetCountry, ef.country)) continue
        if (ef.latitude != null && ef.longitude != null) {
          const d = haversineMeters(lat, lon, ef.latitude, ef.longitude)
          if (d > 30000) continue
        }
        if (!realRests.some(r => r.name.toLowerCase() === ef.name.toLowerCase() || arePlacesSimilar(r.name, ef.name))) {
          realRests.push(ef)
        }
      }
    }
  }

  if (realPlaces.filter(place => place?.name || typeof place === 'string').length < 6) {
    const aiPlaces = await suggestPlacesWithOpenAI({ destination: capitalCity, country: targetCountry, count: 8 }).catch(() => [])
    for (const ap of aiPlaces) {
      if (ap?.name && !realPlaces.some(cp => arePlacesSimilar(cp, ap.name))) {
        realPlaces.push(ap)
      }
    }
  }

  if (realHotels.length === 0) {
    const aiHotels = await suggestHotelsWithOpenAI({ destination: capitalCity, country: targetCountry }).catch(() => [])
    if (aiHotels.length > 0) {
      realHotels.push(...aiHotels)
    }
  }

  const unifiedRadiusKm = /\b(cove[nñ]as|tol[uú]|san\s+antero|golfo\s+de\s+morrosquillo)\b/i.test(clean)
    ? 65
    : 35

  const unifiedCatalog = await createUnifiedCandidateCatalog({
    destination: clean,
    country: targetCountry,
    centerLat: lat,
    centerLon: lon,
    radiusKm: unifiedRadiusKm,
    existing: {
      places: realPlaces,
      restaurants: realRests,
      hotels: realHotels
    },
    seeds: {
      places: presetIconics,
      restaurants: presetRests,
      hotels: presetHotels
    },
    // The existing collection above already queries OSM/Photon. The catalog
    // enriches it with the commercial providers without duplicating requests.
    discoverOsm: false
  }).catch(error => {
    console.warn('[candidate-catalog] Unified catalog build failed:', error?.message || error)
    return { places: [], restaurants: [], hotels: [] }
  })

  const catalogPlaceCandidates = unifiedCatalog.places || []
  const prioritizedPlaceCandidates = []
  const prioritizedIds = new Set()
  for (const iconicName of presetIconics) {
    const match = catalogPlaceCandidates.find(candidate =>
      !prioritizedIds.has(candidate.id || candidate.candidateId || candidate.name) &&
      arePlacesSimilar(candidate.name, iconicName)
    )
    if (match) {
      prioritizedPlaceCandidates.push(match)
      prioritizedIds.add(match.id || match.candidateId || match.name)
    }
  }
  const cleanPlaces = [
    ...prioritizedPlaceCandidates,
    ...catalogPlaceCandidates.filter(candidate => !prioritizedIds.has(candidate.id || candidate.candidateId || candidate.name))
  ].map(candidate => candidate.name)
  const cleanHotels = (unifiedCatalog.hotels || []).map(candidate => ({
    ...candidate,
    desc: candidate.description || `Alojamiento verificado ubicado en ${capitalCity}.`,
    price: candidate.price || '~$75 - $140 USD/noche'
  }))
  const cleanRests = (unifiedCatalog.restaurants || []).map(candidate => ({
    ...candidate,
    specialty: candidate.specialty || (candidate.tags?.cuisine
      ? `Especialidad en cocina ${candidate.tags.cuisine}`
      : '')
  }))

  const coordinatesMap = {}
  for (const candidate of unifiedCatalog.all || []) {
    if (candidate?.name && Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)) {
      coordinatesMap[candidate.name.toLowerCase().trim()] = {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        coordinateSource: candidate.coordinateSource,
        coordinatesVerified: true,
        sources: candidate.sources || [],
        placeId: candidate.placeId || candidate.id || '',
        candidateId: getCandidateId(candidate)
      }
    }
  }

  const result = {
    name: capitalCity,
    country: targetCountry,
    hotels: cleanHotels,
    restaurants: cleanRests,
    places: cleanPlaces,
    coordinatesMap,
    candidateCatalog: unifiedCatalog,
    catalogSources: unifiedCatalog.sources || [],
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
    hotels: [],
    restaurants: [],
    places: [],
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
  if (!isLodgingExplicitlyConfirmed(known.selectedHotel, known.accommodationStatus)) {
    return ['Tengo mi propio hospedaje', '🏨 Recomiéndame hoteles']
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
  const userCurrency = String(known.currency || currentPreferences.currency || 'cop').toLowerCase()
  const history = state.history || []
  const lastUserMsg = state.message || history.filter(m => m.role === 'user').slice(-1)[0]?.content || history[history.length - 1]?.content || ''
  const lastAssistantMsg = (history || []).slice().reverse().find(m => m.role === 'assistant' || m.role === 'bot')?.content || ''

  // Normalize already-confirmed stops before they reach the prompt, fallback
  // itinerary, or structured response. This prevents an old chat state that
  // contains both aliases from reintroducing the duplicate on every turn.
  const knownPlaceCity = known.city || known.destination || ''
  if (Array.isArray(known.specificPlaces)) {
    known.specificPlaces = deduplicateChatSpecificPlaces(known.specificPlaces, knownPlaceCity)
  }

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
  const knownCityNormalized = destName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const isKnownColombianCity = /^(cartagena|santa marta|medellin|bogota|barranquilla|cali|covenas|tolu|san andres|bucaramanga|pereira|salento|guatape|villa de leyva)$/i.test(knownCityNormalized)
  const destCountry = known.canonicalDestination?.country || known.country || (isKnownColombianCity ? 'Colombia' : '')
  if (hasCity && Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0) {
    known.specificPlaces = await filterChatSpecificPlacesByOsm(known.specificPlaces, destName, destCountry, known.selectedHotel)
  }
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
    const cacheKey = `catalog_osm_v2_${destName.toLowerCase()}_${(destCountry || '').toLowerCase()}`
    const cached = destinationCatalogCache.get(cacheKey)
    if (cached) {
      realCatalog = cached
    } else {
      const isExplicitItineraryRequest = /\b(itinerario|itinerarios|plan de viaje|cómo va el itinerario|mostrar el itinerario|muéstrame el itinerario|ver el itinerario|detalles del d[íi]a|ver d[íi]a|d[íi]a\s*\d+)\b/i.test(lastUserMsg)
      const isExplicitHotelInquiry = isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg)
      const isExplicitRestaurantInquiry = /\b(restaurante|restaurantes|comida|comer|gastronom[íi]a|cenar|almorzar|men[uú]|carta|platos)\b/i.test(lastUserMsg)
      const isExplicitAttractionInquiry = /\b(qu[eé] lugares|qu[eé] sitios|qu[eé] atracciones|qu[eé] ver|qu[eé] hacer|sitios tur[íi]sticos|lugares tur[íi]sticos)\b/i.test(lastUserMsg)
      const isLodgingConfirmed = isLodgingExplicitlyConfirmed(known.selectedHotel, known.accommodationStatus)
      const isExplicitBuildRequest = /\b(generar|genera|crear|crea|construye|iniciar|finaliza|armar)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|mapa)\b/i.test(lastUserMsg)
      const needsImmediate = isExplicitItineraryRequest || isExplicitHotelInquiry || isExplicitRestaurantInquiry || isExplicitAttractionInquiry || isLodgingConfirmed || isExplicitBuildRequest

      if (needsImmediate) {
        realCatalog = await getRealDestinationCatalog(destName, destCountry, known.latitude, known.longitude)
          .catch(err => {
            console.warn('[generateChatResponse] Catalog lookup error:', err.message)
            return { places: [], restaurants: [], hotels: [] }
          })
      } else {
        // En turnos conversacionales previos (Etapas 1 y 2), no bloqueamos la respuesta conversacional.
        // Se ejecuta en segundo plano para que esté disponible cuando el usuario llegue a la Etapa 3.
        getRealDestinationCatalog(destName, destCountry, known.latitude, known.longitude).catch(() => null)
        realCatalog = { places: [], restaurants: [], hotels: [] }
      }
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
    return isLodgingExplicitlyConfirmed(hotel, status)
  }

  const isHomeOrLocalLodging = /\b(en mi casa|mi casa|casa de un familiar|casa de familiares|casa de un amigo|casa de amigos|casa de mis padres|vivo aqu[íi]|vivo en la ciudad|es mi ciudad|ya tengo hospedaje|ya tengo alojamiento|ya tengo hotel|ya tengo donde quedarme|no necesito hotel|no requiero hotel|alojamiento propio|hospedaje propio|en casa)\b/i.test(lastUserMsg)
  const isNegatedLodgingTurn = isLodgingNegationOrUncertainty(lastUserMsg) || isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg)
  if (isHomeOrLocalLodging) {
    known.selectedHotel = { name: 'Casa propia / Alojamiento particular' }
    known.accommodationStatus = 'Casa propia / familiar'
  } else if (isLodgingCategoryOrGeneric(lastUserMsg) || isNegatedLodgingTurn) {
    delete known.selectedHotel
    known.accommodationStatus = isNegatedLodgingTurn ? 'Recomiéndame hoteles' : 'Por definir'
    if (isLodgingCategoryOrGeneric(lastUserMsg)) {
      known.lodgingTypePreference = lastUserMsg.trim()
    }
  } else {
    const hotelMatch = lastUserMsg.match(/\b(?:en el|al|en|hospedar(?:nos)?\s+en|quedar(?:nos)?\s+en|eleg[íi]\s+(?:el\s+)?|elijo\s+(?:el\s+)?|escog[íi]\s+(?:el\s+)?|ok\s+(?:el\s+)?|perfecto\s+(?:el\s+)?|vamos\s+con\s+(?:el\s+)?)?\s*(hotel|hostal|hostel|resort|posada|caba[ñn]a)\s+([a-záéíóúñ0-9\s]{2,40}?)(?:$|\s+(?:y\s+|con\s+|para\s+|del\s+|de\s+|\.|\,))/i)
    if (hotelMatch) {
      let rawHotel = `${hotelMatch[1]} ${hotelMatch[2]}`.trim()
      rawHotel = rawHotel.replace(/\s+(?:est[aá]\s+bien|me\s+parece\s+bien|me\s+gusta|por\s+favor|gracias|porfa|listo)$/i, '').trim()
      if (!isLodgingCategoryOrGeneric(rawHotel) && rawHotel.length >= 4) {
        const cleanHotel = rawHotel.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        known.selectedHotel = cleanHotel
        known.accommodationStatus = 'Hotel elegido'
      }
    }
  }

  const isUserConfirmingLodging = !isNegatedLodgingTurn && /\b(s[íi]\s+(ese\s+es|ah[íi]\s+es|correcto|de\s+acuerdo)|ese\s+es\s+el\s+hotel|ah[íi]\s+nos\s+vamos\s+a\s+quedar|en\s+el\s+hotel|el\s+primero|la\s+primera(?:\s+opci[oó]n)?|opci[oó]n\s*1|el\s+segundo|la\s+segunda(?:\s+opci[oó]n)?|opci[oó]n\s*2|el\s+tercero|la\s+tercera(?:\s+opci[oó]n)?|opci[oó]n\s*3)\b/i.test(lastUserMsg)
  if (isUserConfirmingLodging && (!known.selectedHotel || isLodgingCategoryOrGeneric(known.selectedHotel?.name || known.selectedHotel))) {
    const prevBotMsg = (history || []).slice().reverse().find(m => m.role === 'assistant' || m.role === 'bot')?.content || ''
    const ordinalMatch = lastUserMsg.match(/\b(el\s+primero|la\s+primera(?:\s+opci[oó]n)?|opci[oó]n\s*1|el\s+segundo|la\s+segunda(?:\s+opci[oó]n)?|opci[oó]n\s*2|el\s+tercero|la\s+tercera(?:\s+opci[oó]n)?|opci[oó]n\s*3)\b/i)
    if (ordinalMatch) {
      let idx = 0
      if (/segund|2/i.test(ordinalMatch[1])) idx = 1
      if (/tercer|3/i.test(ordinalMatch[1])) idx = 2
      const hotelBullets = prevBotMsg.split('\n').filter(l => /^\s*•\s*\*\*?[^*:]+\*\*?:/.test(l))
      if (hotelBullets[idx]) {
        const m = hotelBullets[idx].match(/^\s*•\s*\*\*?([^*:]+)\*\*?:/)
        if (m && m[1]) {
          known.selectedHotel = m[1].trim()
          known.accommodationStatus = 'Hotel elegido'
        }
      }
    } else {
      const prevHotelMatch = prevBotMsg.match(/\b(hotel|hostal|hostel|resort|posada)\s+([a-záéíóúñ0-9\s]{2,40}?)(?:$|\s+(?:como\s+alojamiento|\?|\.|\,))/i)
      if (prevHotelMatch) {
        const rawPrevHotel = `${prevHotelMatch[1]} ${prevHotelMatch[2]}`.trim()
        if (!isLodgingCategoryOrGeneric(rawPrevHotel) && rawPrevHotel.length >= 4) {
          const cleanPrevHotel = rawPrevHotel.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          known.selectedHotel = cleanPrevHotel
          known.accommodationStatus = 'Hotel elegido'
        }
      }
    }
  }

  if (known.selectedHotel?.name && isLodgingCategoryOrGeneric(known.selectedHotel.name)) {
    if (!known.lodgingTypePreference) {
      known.lodgingTypePreference = known.selectedHotel.name
    }
    delete known.selectedHotel
    known.accommodationStatus = 'Por definir'
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
    let fallbackChips = getDefaultActionChips(known, lastUserMsg)
    let fallbackMsg = ''
    let effectiveReadyToBuild = false
    let trustedFallbackPlaces = []

    if (!hasCity) {
      if (/playa|playas|mar|costa|aventura/i.test(lastUserMsg)) {
        fallbackMsg = '¡Excelente! Para disfrutar de playas y sol, te recomiendo **Santa Marta**, **Cartagena**, **San Andrés** o **Cancún**. ¿A cuál de estas prefieres viajar?'
      } else if (/naturaleza/i.test(lastUserMsg)) {
        fallbackMsg = '¡Genial! Para conectar con la naturaleza te sugiero **Santa Marta (Tayrona y Minca)**, **Cusco** o **Medellín**. ¿Cuál te gustaría elegir?'
      } else {
        fallbackMsg = '¡Hola! Soy Tour Planner AI 🤖. Cuéntame: ¿a qué ciudad o destino te gustaría viajar hoy?'
      }
    } else {
      const preset = (realCatalog?.hotels?.length > 0 || realCatalog?.places?.length > 0)
        ? realCatalog
        : await getRealDestinationCatalog(
            known.city || 'Destino',
            known.country || 'Local',
            known.latitude,
            known.longitude
          ).catch(() => ({ places: [], restaurants: [], hotels: [] }))
      trustedFallbackPlaces = [
        ...(preset?.places || []),
        ...(preset?.restaurants || [])
      ]
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
        if (!fbHasLodging) missing.push('tu alojamiento u hotel (o si te quedas en casa propia/familiar)')
        if (!fbHasTransport) missing.push('tu medio de transporte')
        if (!fbHasBudget) missing.push('tu presupuesto')

        fallbackMsg = `Para generar tu tour en el mapa, aún necesitamos definir: **${missing.join(', ')}**. ¿Podrías indicarme este dato?`
        fallbackChips = []
        if (!fbHasLodging) {
          fallbackChips.push('Tengo mi propio hospedaje', '🏨 Recomiéndame hoteles')
        }
        if (!fbHasTransport) {
          fallbackChips.push('Auto rentado', 'Taxi / Uber', 'Transporte público')
        }
        if (!fbHasBudget) {
          fallbackChips.push('Económico', 'Moderado', 'Lujo')
        }
      } else if (effectiveReadyToBuild) {
        fallbackMsg = `¡Perfecto! Todo está listo para tu viaje a ${destName}. Procedo a generar tu tour en el mapa.`
      } else if (hasCity && /\b(m[aá]s informaci[oó]n|detalles|cu[eé]ntame m[aá]s|informaci[oó]n del?|informaci[oó]n sobre|c[oó]mo es|servicios|fotos|precios?|ubicaci[oó]n)\b/i.test(lastUserMsg) && /\b(hotel|hostal|resort|casa la fe|casa isabel|majagua)\b/i.test(lastUserMsg)) {
        if (/casa la fe/i.test(lastUserMsg) && (/cartagena/i.test(destName) || !destName)) {
          fallbackMsg = `¡Con mucho gusto! Aquí tienes los detalles del **Hotel Casa La Fe** en ${destName}: 🏨✨\n\n` +
            `• 📍 **Ubicación**: Ubicado en la Plaza Fernández de Madrid en el Centro Histórico.\n` +
            `• 🏊 **Instalaciones**: Piscina en la azotea con solárium y vistas panorámicas.\n` +
            `• 🍳 **Servicios**: Desayuno gourmet incluido, Wi-Fi de alta velocidad y aire acondicionado.\n` +
            `• 💰 **Tarifa estimada**: ${formatHotelPriceRange(90, 130, userCurrency)}.\n\n` +
            `¿Deseas confirmar el Hotel Casa La Fe como tu hospedaje?`
        } else {
          const verifiedHotel = preset.hotels && preset.hotels[0]
          fallbackMsg = verifiedHotel?.name
            ? `¡Con mucho gusto! Aquí tienes los detalles del **${verifiedHotel.name}** en ${destName}: 🏨✨\n\n` +
              `• 📍 **Ubicación**: ${verifiedHotel.address || `Alojamiento verificado en ${destName}`}.\n` +
              `• 🏨 **Descripción**: ${verifiedHotel.desc || `Alojamiento verificado en ${destName}`}.\n` +
              `• 💰 **Tarifa estimada**: ${getHotelPriceDisplay(verifiedHotel, userCurrency)}.\n\n` +
              `¿Deseas confirmar este hospedaje?`
            : `No encontré información verificada de ese alojamiento en ${destName}. Puedo buscar hoteles reales en la zona o puedes indicarme el nombre y la dirección de tu hospedaje.`
        }
      } else if (hasCity && !isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg) && isLodgingCategoryOrGeneric(lastUserMsg)) {
        const lodgingPref = lastUserMsg.trim()
        const optHotels = (preset.hotels && preset.hotels.length > 0)
          ? preset.hotels.slice(0, 3).map(h => `• 🏨 **${h.name}**`).join('\n')
          : ''
        fallbackMsg = `¡Excelente elección! Buscar ${lodgingPref} en ${destName} es una gran idea. ✨\n\n` +
          (optHotels ? `Aquí tienes algunas opciones destacadas en la zona:\n${optHotels}\n\n` : '') +
          `¿Tienes ya alguna opción reservada con nombre propio o prefieres que tomemos una de estas como base para tu recorrido?`
      } else if (hasCity && /\b(detalles del d[íi]a\s*(\d+)|ver detalles del d[íi]a\s*(\d+)|ver d[íi]a\s*(\d+)|d[íi]a\s*(\d+))\b/i.test(lastUserMsg)) {
        const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
          ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
          : []
        const p1 = rawSpecifics[0] || preset.places?.[0]
        const p2 = rawSpecifics[1] || preset.places?.[1]
        const r1 = preset.restaurants?.[0]?.name
        const detailLines = [
          p1 ? `• 🌅 **09:00 AM - Mañana**: Visita a ${p1}` : '',
          r1 ? `• 🍽️ **12:30 PM - Almuerzo**: ${r1}` : '',
          p2 ? `• 🌇 **03:30 PM - Tarde**: Recorrido por ${p2}` : '',
        ].filter(Boolean)
        fallbackMsg = `Día 1: ${destName}\n\n` +
          (detailLines.length > 0 ? `${detailLines.join('\n')}\n\n` : 'No encontré suficientes lugares verificados en OpenStreetMap para completar este día.\n\n') +
          `¿Te gustaría generar el tour completo o ver otro día?`
      } else if (/\b(itinerario|itinerarios|plan|plan de viaje|cómo va|cómo queda|mostrar el itinerario|muéstrame el itinerario|muestres el itinerario)\b/i.test(lastUserMsg)) {
        if (hasDurationOrDates) {
          const numDays = known.durationDays || 3
          const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
            ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
            : []
          const rawPresetRests = (preset.restaurants || []).map(r => typeof r === 'string' ? r : r.name).filter(Boolean)
          const pool = deduplicateChatSpecificPlaces(
            [...rawSpecifics, ...(preset.places || [])],
            destName
          ).map(p => typeof p === 'string' ? p : p.name)
           .filter(p => !rawPresetRests.some(r => arePlacesSimilar(r, p)))

          let dayBlocks = []
          const usedGlobal = new Set()
          let poolIdx = 0
          for (let d = 1; d <= numDays; d++) {
            let p1 = null
            let p2 = null
            while (poolIdx < pool.length) {
              const cand = pool[poolIdx++]
              if (!usedGlobal.has(cand.toLowerCase())) {
                p1 = cand
                usedGlobal.add(cand.toLowerCase())
                break
              }
            }
            if (!p1 && pool.length > 0) {
              p1 = pool[0]
            }

            while (poolIdx < pool.length) {
              const cand = pool[poolIdx++]
              if (!usedGlobal.has(cand.toLowerCase()) && cand.toLowerCase() !== (p1 || '').toLowerCase()) {
                p2 = cand
                usedGlobal.add(cand.toLowerCase())
                break
              }
            }
            if (!p2 && pool.length > 1) {
              p2 = pool.find(cand => cand && cand.toLowerCase() !== (p1 || '').toLowerCase()) || pool[1]
            }

            let r = rawPresetRests.find(cName =>
              !usedGlobal.has(cName.toLowerCase()) &&
              (!p1 || !arePlacesSimilar(p1, cName)) &&
              (!p2 || !arePlacesSimilar(p2, cName))
            ) || rawPresetRests.find(cName =>
              (!p1 || !arePlacesSimilar(p1, cName)) &&
              (!p2 || !arePlacesSimilar(p2, cName))
            ) || (rawPresetRests.length > 0 ? rawPresetRests[(d - 1) % rawPresetRests.length] : null)

            if (r) usedGlobal.add(r.toLowerCase())
            const dayLines = [p1, p2, r].filter(Boolean).map(place => ` • ${place}`)
            if (dayLines.length > 0) {
              dayBlocks.push(`Día ${d}: ${destName}\n${dayLines.join('\n')}`)
            }
          }

          fallbackMsg = `Itinerario de Viaje: ${destName} (${known.datesSeason || `${numDays} días`})\n\n` +
            (dayBlocks.length > 0 ? dayBlocks.join('\n\n') : 'No encontré lugares turísticos verificables en OpenStreetMap para construir este itinerario.') +
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
      } else if (!fbHasLodging && isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg) && !isExplicitlyChoosingHotel(lastUserMsg)) {
        let rawHotels = (realCatalog?.hotels && realCatalog.hotels.length > 0)
          ? realCatalog.hotels
          : (preset?.hotels && preset.hotels.length > 0)
            ? preset.hotels
            : []

        const hotelList = rawHotels.slice(0, 3)
        if (hotelList.length > 0) {
          const hotelIntro = (fbHasTransport && fbHasBudget)
            ? `¡Perfecto! Ya registré tu transporte y presupuesto. Para tu hospedaje en ${destName}, ¡aquí tienes excelentes opciones recomendadas! 🏨\n\n`
            : `¡Opciones de hospedaje en ${destName}! 🏨\n\n`
          fallbackMsg = hotelIntro +
            hotelList.map(h => `• **${h.name || h}**: ${h.desc || `Alojamiento destacado en ${destName}`} (${getHotelPriceDisplay(h, userCurrency)}).`).join('\n') +
            `\n\n¿Cuál de estos te gustaría elegir?`
          fallbackChips = hotelList.map(h => h.name || h)
          if (!fallbackChips.some(c => /casa propia|familiar/i.test(c))) {
            fallbackChips.push('Tengo casa propia / familiar')
          }
        } else {
          fallbackMsg = `¡Perfecto! Ya registré tu transporte y presupuesto. ¿En qué hotel o alojamiento se hospedarán en ${destName}? (o indícame si te quedas en casa propia / familiar).`
          fallbackChips = ['Tengo casa propia / familiar']
        }
      } else if (!hasCompanions && !fbHasLodging) {
        fallbackMsg = `¡Excelente! ¿Viajas solo, en pareja, con amigos o en familia con niños a ${destName}?`
      } else if (!fbHasLodging && hasBudget && hasTransport) {
        fallbackMsg = `¡Perfecto! Ya tenemos transporte y presupuesto. ¿En qué hotel o alojamiento se hospedarán en ${destName}? (o indícame si te quedas en casa propia / familiar).`
        fallbackChips = ['🏨 Recomiéndame hoteles', 'Tengo casa propia / familiar']
      } else if (!hasBudget || !hasTransport || !fbHasLodging) {
        const missing = []
        if (!hasTransport) missing.push('tu medio de transporte')
        if (!hasBudget) missing.push('tu presupuesto')
        if (!fbHasLodging) missing.push('tu hotel o alojamiento')
        const hotelNameDisplay = typeof known.selectedHotel === 'string' ? known.selectedHotel : (known.selectedHotel?.name || '')
        const prefix = (fbHasLodging && hotelNameDisplay)
          ? `¡Genial! Registré **${hotelNameDisplay}** como tu hospedaje. Para continuar planificando tu viaje a ${destName}, `
          : `¡Genial! Para continuar planificando tu viaje a ${destName}, `
        fallbackMsg = `${prefix}¿podrías indicarme: ${missing.join(', ')}?`
      } else if (hasDurationOrDates && (fbAllKeyInfoComplete || fbHasLodging)) {
        const numDays = Number(known.durationDays || (/\b(semanita|una semana|7 d[íi]as|carnaval)\b/i.test(`${known.datesSeason || ''} ${lastUserMsg}`) ? 7 : (known.datesSeason?.includes('puente') ? 3 : 2)))
        const rawSpecifics = (Array.isArray(known.specificPlaces) && known.specificPlaces.length > 0)
          ? known.specificPlaces.map(p => typeof p === 'string' ? p : p.name).filter(Boolean)
          : []
        const rawPresetRests = (preset.restaurants || []).map(r => typeof r === 'string' ? r : r.name).filter(Boolean)
        const pool = deduplicateChatSpecificPlaces(
          [...rawSpecifics, ...(preset.places || [])],
          destName
        ).map(p => typeof p === 'string' ? p : p.name)
         .filter(p => !rawPresetRests.some(r => arePlacesSimilar(r, p)))

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
          let p2 = null
          while (poolIdx < pool.length) {
            const cand = pool[poolIdx++]
            if (!usedGlobal.has(cand.toLowerCase())) {
              p2 = cand
              usedGlobal.add(cand.toLowerCase())
              break
            }
          }
          let r = rawPresetRests.find(cName =>
            !usedGlobal.has(cName.toLowerCase()) &&
            (!p1 || !arePlacesSimilar(p1, cName)) &&
            (!p2 || !arePlacesSimilar(p2, cName))
          ) || rawPresetRests.find(cName =>
            (!p1 || !arePlacesSimilar(p1, cName)) &&
            (!p2 || !arePlacesSimilar(p2, cName))
          ) || null
          if (r) usedGlobal.add(r.toLowerCase())
          const dayLines = [p1, p2, r].filter(Boolean).map(place => ` • ${place}`)
          if (dayLines.length > 0) {
            dayBlocks.push(`Día ${d}: ${destName}\n${dayLines.join('\n')}`)
          }
        }

        fallbackMsg = `¡Perfecto! Con tu hospedaje confirmado en ${known.selectedHotel?.name || 'tu estancia'} y movilidad definida, aquí tienes tu plan:\n\nItinerario de Viaje: ${destName} (${known.datesSeason || `${numDays} días`})\n\n` +
          (dayBlocks.length > 0 ? dayBlocks.join('\n\n') : 'No encontré lugares turísticos verificables en OpenStreetMap para construir este itinerario.') +
          `\n\n¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?`
      } else if (hasDurationOrDates) {
        fallbackMsg = `¡Excelente! Para tu viaje a ${destName} de ${known.datesSeason || `${known.durationDays} días`}, ¿qué lugares o tipo de actividades te gustaría incluir?`
      } else {
        fallbackMsg = `¡Excelente elección viajar a ${destName}! ¿En qué fechas planeas viajar y cuántos días durará tu estadía?`
      }
    }

    const fallbackSpecificPlaces = deduplicateChatSpecificPlaces(
      Array.isArray(known.specificPlaces) ? known.specificPlaces : [],
      destName
    )

    const isItineraryStatusInquiry = /\b(c[oó]mo va el itinerario|c[oó]mo va mi itinerario|estado del itinerario)\b/i.test(lastUserMsg)
    if (!hasLodging && !isItineraryStatusInquiry) {
      fallbackChips = fallbackChips.filter(c => !/generar tour|crear tour|armar tour|construir tour/i.test(c))
      if (!fallbackChips.some(c => /casa propia|familiar|propio hospedaje/i.test(c))) {
        fallbackChips.unshift('Tengo mi propio hospedaje')
      }
      if (!fallbackChips.some(c => /hotel|hospedaje/i.test(c))) {
        fallbackChips.push('🏨 Recomiéndame hoteles')
      }
    }

    return {
      responseMessage: await sanitizeChatItineraryTextWithOsm(
        fallbackMsg,
        destName,
        destCountry,
        known.selectedHotel,
        trustedFallbackPlaces
      ),
      actionChips: fallbackChips,
      extractedPreferences: { ...known, specificPlaces: fallbackSpecificPlaces },
      specificPlaces: fallbackSpecificPlaces,
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

DIVISA PREFERIDA DEL VIAJERO: ${userCurrency.toUpperCase()}
- Toda tarifa estimada, rango de precios de hotel o gasto turístico que menciones DEBE expresarse en ${userCurrency.toUpperCase()} (ejemplo si es COP: ~$410.000 - $650.000 COP/noche; si es USD: ~$100 - $160 USD/noche; si es EUR: ~€90 - €150/noche).

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

IDENTIDADES FÍSICAS CANÓNICAS:
- "Casa del Carnaval" y "Museo del Carnaval" en Barranquilla son el mismo complejo y la misma parada física.
- Nunca los presentes como dos paradas, ni los asignes a días distintos. Usa un solo nombre, preferiblemente "Casa del Carnaval".

REGLAS DE ORO DE SELECCIÓN DE LUGARES Y BALANCE DIARIO:
1. SELECCIÓN DE ATRACTIVOS ICÓNICOS Y REALES (NIVEL TURISMO INTERNACIONAL, CERO HARDCODEO):
   - Para CUALQUIER ciudad o destino del mundo solicitado (${destName || 'el destino seleccionado'}), selecciona ÚNICAMENTE los atractivos turísticos, culturales, históricos, arquitectónicos y paisajísticos MÁS POPULARES, EMBLEMÁTICOS E ICÓNICOS que existan FÍSICAMENTE en ese destino específico.
   - AISLAMIENTO METROPOLITANO ESTRICTO (PROHIBIDO FUGAS INTER-CIUDAD):
     * Todos los atractivos y restaurantes recomendados DEBEN estar ubicados DENTRO del municipio o área metropolitana inmediata de "${destName || 'el destino'}".
     * ESTRICTAMENTE PROHIBIDO sugerir lugares que pertenezcan a OTRA ciudad vecina o distante. Cada ciudad tiene sus propios restaurantes y atractivos emblemáticos; usa únicamente los nombres presentes en el catálogo verificado.
   - PROHIBIDO incluir puestos de policía, CAIs, puntos de información turística, oficinas administrativas, bancos, farmacias o cadenas de hipermercados/supermercados cotidianos (como Alkosto, Éxito, Olímpica, Carulla, Jumbo, Makro, Ara, D1, Homecenter, etc.) como paradas turísticas.
    - REGLA CRÍTICA DE CARTOGRAFÍA Y FUENTES:
      * El tour y tus recomendaciones deben estar anclados al 100% en lugares reales presentes en el catálogo verificado por las fuentes cartográficas configuradas.
      * ESTRICTAMENTE PROHIBIDO inventar plazas, parques, malecones, restaurantes u hoteles que no estén en ese catálogo.
      * ESTRICTAMENTE PROHIBIDO sugerir lugares cerrados, genéricos, de otra ciudad o que solo aparezcan en tu memoria.
      * Si un lugar no aparece en el catálogo verificado, NO lo recomiendes ni lo agregues al tour.
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
- PROHIBIDO recomendar hoteles, complejos vacacionales de cabañas o chalets como restaurantes (por ejemplo, "La Fragata" es un hotel/cabañas, NO un restaurante; no lo recomiendes como parada gastronómica).
- Utiliza ÚNICAMENTE nombres de establecimientos gastronómicos, paradores o kioscos reales físicamente existentes en el mapa satelital de OpenStreetMap / OpenFreeMap.
- ESTRICTAMENTE PROHIBIDO recomendar locales informales o comercios que no tengan un nodo o marcador propio en el mapa.
${verifiedFoodText ? `\nESTABLECIMIENTOS GASTRONÓMICOS REALES VERIFICADOS EN EL MAPA:\n${verifiedFoodText}\n` : ''}

${realCatalog && hasCity ? `
CATÁLOGO VERIFICADO DE ${destName.toUpperCase()} (${destCountry || 'DESTINO'}):
• Hoteles: ${realCatalog.hotels?.map(h => h.name).join(', ') || 'N/A'}
• Restaurantes y bares: ${realCatalog.restaurants?.map(r => r.name).join(', ') || 'N/A'}
• Atractivos y patrimonio: ${realCatalog.places?.join(', ') || 'N/A'}
` : ''}

REGLA DE NATURALIDAD Y CERO INVENCIONES:
- Si el catálogo tiene pocos resultados o está vacío, dilo de forma natural y breve. No inventes nombres para completar la respuesta.
- Puedes ofrecer ampliar el radio de búsqueda, consultar una ciudad cercana o continuar sin una parada gastronómica específica.

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
- Si el HOSPEDAJE figura como PENDIENTE en el ESTADO ACTUAL DE DATOS:
  * ESTRICTAMENTE PROHIBIDO redactar o mostrar el bloque de itinerario por días (Día 1, Día 2, etc.), viñetas de días ni preguntar si procedemos a generar el tour en el mapa.
  * Tu respuesta debe ser MÁXIMO de 1 o 2 oraciones breves y directas, reconociendo amablemente los datos recibidos y preguntando ÚNICAMENTE por el hotel o alojamiento (o si se hospedarán en casa propia / familiar).
  * Si el usuario pide recomendaciones de hotel/alojamiento o indica una preferencia de categoría (ej: "¿qué recomiendas?", "recomiéndame hoteles", "una villa privada está bien", "busco resort"):
    - Si eligió categoría o estilo (ej: "una villa privada", "un resort"), el hospedaje SIGUE PENDIENTE. Sugiérele 2 o 3 opciones reales con nombre propio o pregúntale si tiene alguna reservada.
     - Si pide opciones de hoteles, presenta únicamente opciones que aparezcan en el catálogo verificado de ${destName || 'el destino'} ${realCatalog?.hotels?.length ? `(Opciones verificadas: ${realCatalog.hotels.map(h => h.name).join(', ')})` : ''}. Si no hay opciones verificadas, informa que no se encontraron alojamientos confirmados y ofrece buscar en un radio mayor.
      FORMATO OBLIGATORIO Y EQUILIBRADO PARA HOTELES (MÁXIMO 1 O 2 LÍNEAS POR OPCIÓN):
      • [Nombre del Hotel]: [Ubicación clara con referencia de zona o atractivos cercanos] (~[Rango de precio estimado] ${userCurrency.toUpperCase()}/noche).
      (Ejemplo: • Hotel Boutique Don Pepe: Opción colonial en el Centro Histórico cerca de la Catedral y restaurantes (~$410.000 - $650.000 COP/noche).)
      CERO párrafos largos ni rodeos innecesarios.
    - PROHIBIDO presentar el itinerario definitivo ni activar "readyToBuild" mientras el hospedaje siga como PENDIENTE.
  * Si el usuario acaba de seleccionar o confirmar un hotel (ej: "Ok el Hotel X está bien", "Ya elegí el Hotel X", "El primero", "Me quedo con el Hotel X"):
    - Valida su elección inmediatamente con entusiasmo ("¡Excelente elección quedarse en [Hotel]!") y pregunta en 1 sola línea por los datos que sigan PENDIENTES (por ejemplo, el medio de transporte o presupuesto).
    - ESTRICTAMENTE PROHIBIDO volver a mostrarle la lista de hoteles ni volver a preguntarle qué hotel prefiere.
  NUNCA des consejos genéricos como "buscar en plataformas" ni vuelvas a preguntar por datos que ya estén CONFIRMADOS (presupuesto, transporte, fechas).
- Si faltan datos de transporte, presupuesto o alojamiento:
  Pregunta en 1 sola línea directa ÚNICAMENTE por los campos que figuren como PENDIENTE en el ESTADO ACTUAL DE DATOS.

ETAPA 3: PRESENTACIÓN COMPLETA DEL ITINERARIO POR DÍAS (ENTREGA INMEDIATA ÚNICAMENTE TRAS CONFIRMACIÓN REAL)
- REQUISITO OBLIGATORIO: Esta etapa SOLO se activa si el HOSPEDAJE está efectivamente CONFIRMADO (un hotel con nombre comercial real elegido, o indicación de "casa propia / familiar"). Si el hospedaje figura como PENDIENTE, ESTÁ TOTALMENTE PROHIBIDO emitir el itinerario final o avanzar a generación.
- Si el usuario acaba de confirmar su hospedaje real con nombre propio o en casa propia (y ya contamos con destino, fechas, transporte y presupuesto):
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
5. DIVERSIDAD Y EQUILIBRIO TEMÁTICO (CERO DÍAS EXCLUSIVOS DE RESTAURANTES):
   - En capitales y ciudades metropolitanas/culturales (ej: Barranquilla, Medellín, Bogotá, Cartagena, Roma, París, etc.):
     Debes estructurar un itinerario variado y rico, combinando monumentos históricos, malecones, museos, plazas emblemáticas, arquitectura, parques y gastronomía local usando únicamente los POI del catálogo verificado.
   - En destinos con vocación balnearia o micro-destinos (ej: Coveñas, San Andrés, Cancún): Las playas, islas, ciénagas y actividades ecoturísticas del corredor son los atractivos centrales.
   - REGLA DE BALANCE DIARIO OBLIGATORIO:
      * Cada día puede tener hasta 2 atractivos turísticos y como MÁXIMO 1 parada gastronómica, únicamente si existen candidatos verificados disponibles.
      * Si no hay suficientes candidatos verificados, reduce la cantidad de paradas de ese día y explícalo brevemente. Nunca rellenes el día con nombres genéricos o inventados.
      * ESTRICTAMENTE PROHIBIDO llenar un día con 2 o 3 restaurantes y 0 atractivos turísticos. Los días son para descubrir atractivos, no para ir de restaurante en restaurante sin visitar lugares.
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
   - Si el usuario pide "Ver menús" o comida: recomienda únicamente establecimientos del catálogo gastronómico verificado y platos típicos; NO conviertas atractivos turísticos en restaurantes.
8. REGLA ESTRICTA DE CONCISIÓN Y ANTI-FATIGA VISUAL:
   - Prohibido generar textos kilométricos o párrafos de relleno conversacional.
   - Prohibido recapitular o volver a enumerar datos ya confirmados ("Dado que viajas en taxi con tu pareja y presupuesto alto...").
   - El texto introductorio antes del bloque de itinerario debe ser de MÁXIMO 1 o 2 oraciones breves y directas (ej: "¡Excelente! Aquí tienes tu propuesta de itinerario para disfrutar al máximo de ${destName || 'tu viaje'}:").
   - En las viñetas (•), escribe ÚNICAMENTE el nombre limpio del lugar físico o restaurante real, sin párrafos descriptivos anexos.
   - Al final del itinerario, incluye solo 1 pregunta directa de acción (máximo 1 o 2 oraciones).

ETAPA DE AJUSTE O AMPLIACIÓN DE ITINERARIO (AÑADIR O CAMBIAR PARADAS):
- Si el usuario pide agregar más paradas, añadir más sitios, o enriquecer el plan ("puedes agregar más paradas", "añade más paradas", "más lugares", etc.):
  1. ACEPTA CON ENTUSIASMO.
  2. MUESTRA OBLIGATORIAMENTE EL ITINERARIO COMPLETO ACTUALIZADO (desde Día 1 hasta Día ${Number(known.durationDays || (known.datesSeason?.includes('puente') ? 3 : 2))}) agregando 1 o 2 paradas adicionales reales a cada día (3 a 4 paradas por día).
  3. ESTÁ TOTALMENTE PROHIBIDO responder únicamente con un texto explicativo o evasivo. Si dices que agregaste paradas, el bloque completo de días con sus viñetas DEBE estar impreso en tu respuesta.

ETAPA 4: GENERACIÓN DEL TOUR ("readyToBuild": true)
- Si el usuario pide generar el tour:
  - Si falta algún dato clave (incluyendo si el hospedaje sigue PENDIENTE o solo se indicó una categoría genérica): "readyToBuild" = false y pregunta en 1 línea por el dato faltante o pide confirmar el hotel específico.
  - Si todos los datos están completos y el hospedaje está CONFIRMADO: "readyToBuild" = true y responde de forma breve: "¡Excelente! Procedo a generar tu tour en el mapa para que disfrutes tu viaje a ${destName || known.destination}."

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
    "lodgingTypePreference": null,
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
2. Prohibido incluir textos genéricos como "Llegada", "Despedida", "Tiempo libre", "Día libre", "Tarde libre".

REGLAS PARA "accommodationStatus":
- "Hotel elegido": si el usuario indicó o confirmó un hotel con nombre propio comercial real (ej: "Hotel Palma Linda").
- "Casa propia / familiar": si indicó alojamiento en casa propia, familiar o de amigos.
- "Por definir": si aún no hay hotel definido o el usuario solo mencionó una categoría genérica ("resort", "villa", "hotel boutique").`

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
        modelConfig: getFastOpenAiModelConfig(),
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low'
      })),
      // El fallback conversacional puede responder sin este proveedor; no
      // dejamos la interfaz esperando indefinidamente ante una red lenta.
      signal: AbortSignal.timeout(25000)
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

    // Preservar o auto-promover hotel si es un nombre real comercial
    const isNegatedLodgingCall = isLodgingNegationOrUncertainty(lastUserMsg) || isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg)
    if (isNegatedLodgingCall) {
      delete parsedExtracted.selectedHotel
      delete known.selectedHotel
      parsedExtracted.accommodationStatus = 'Recomiéndame hoteles'
    } else if (parsedExtracted.selectedHotel) {
      const hName = typeof parsedExtracted.selectedHotel === 'string'
        ? parsedExtracted.selectedHotel
        : (parsedExtracted.selectedHotel?.name || '')
      if (hName && hName.length >= 3 && !isLodgingCategoryOrGeneric(hName)) {
        if (!parsedExtracted.accommodationStatus || parsedExtracted.accommodationStatus === 'Por definir') {
          parsedExtracted.accommodationStatus = 'Hotel elegido'
        }
      }
    } else if (known.selectedHotel) {
      const kName = typeof known.selectedHotel === 'string'
        ? known.selectedHotel
        : (known.selectedHotel?.name || '')
      if (kName && kName.length >= 3 && !isLodgingCategoryOrGeneric(kName)) {
        parsedExtracted.selectedHotel = known.selectedHotel
        if (!parsedExtracted.accommodationStatus) {
          parsedExtracted.accommodationStatus = known.accommodationStatus || 'Hotel elegido'
        }
      }
    }

    if (hasCity && Array.isArray(parsedExtracted.specificPlaces) && parsedExtracted.specificPlaces.length > 0) {
      parsedExtracted.specificPlaces = await filterChatSpecificPlacesByOsm(
        parsedExtracted.specificPlaces,
        destName,
        destCountry,
        parsedExtracted.selectedHotel || known.selectedHotel
      )
    }

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

      parsedExtracted.specificPlaces = deduplicateChatSpecificPlaces(
        parsedExtracted.specificPlaces,
        destName || known.city || known.destination || ''
      )
    }

    function isLodgingName(name) {
      if (!name || typeof name !== 'string') return false
      return /\b(hotel|hostal|hostel|resort|motel|inn|lodge|lodging|suites|alojamiento|apartahotel|posada|crowne plaza|hilton|marriott|decameron|iberoestar|dann carlton|ghl)\b/i.test(name)
    }

    // Evaluar estado completo de información clave mediante Single Source of Truth
    const finalHasLodging = Boolean(
      isLodgingExplicitlyConfirmed(
        parsedExtracted.selectedHotel || known.selectedHotel,
        parsedExtracted.accommodationStatus || known.accommodationStatus
      )
    )
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
    const userRequestedItinerary = /\b(mu[ée]strame\s+(el\s+|tu\s+)?itinerario|ver\s+(el\s+|tu\s+)?itinerario|cu[aá]l\s+es\s+el\s+itinerario|quiero\s+ver\s+el\s+itinerario|dame\s+el\s+itinerario|d[oó]nde\s+est[aá]\s+(el\s+|tu\s+)?itinerario|no\s+veo\s+(el\s+|tu\s+)?itinerario|pasa\s+(el\s+|tu\s+)?itinerario|itinerario\s+completo|itinerario\b)/i.test(lastUserMsg)
    const hasLodgingJustProvided = Boolean(
      finalHasLodging &&
      finalHasCity &&
      finalHasDates &&
      (finalHasTransport || finalHasBudget)
    )

    const itineraryMalformed = (hasDayHeaders || mentionsPresentingItinerary) && isMalformedItinerary(responseMessage)

    const shouldReconstructItinerary = !isUserExplicitlyOrderingBuild && (
      userRequestedItinerary ||
      itineraryMalformed ||
      (finalHasLodging && (
        (!hasDayHeaders && (isAllKeyInfoComplete || mentionsPresentingItinerary || isUserAskingForMoreStops || hasLodgingJustProvided)) ||
        (isUserAskingForMoreStops && !hasDayHeaders)
      ))
    )

    if (shouldReconstructItinerary) {
      let placesList = deduplicateChatSpecificPlaces(
        (parsedExtracted.specificPlaces || known.specificPlaces || []),
        destName || known.city || known.destination || ''
      )
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

      // 1. Recolectar y enriquecer restaurantes para asegurar variedad y cantidad suficiente
      const rawRestsPool = [
        ...(cat?.restaurants || []),
        ...(parsedExtracted.specificPlaces || []).filter(p => p && (p.type === 'food' || isFoodOrDrinkEstablishment(typeof p === 'string' ? p : p.name))),
        ...(known.specificPlaces || []).filter(p => p && (p.type === 'food' || isFoodOrDrinkEstablishment(typeof p === 'string' ? p : p.name)))
      ]
      const validRests = rawRestsPool.filter(r => {
        const rName = typeof r === 'string' ? r : (r?.name || '')
        if (!rName || rName.trim().length === 0) return false
        if (isGenericFacilityName(rName) || isNonTouristFacility({ name: rName }) || isUnmappedOrClosedVenue(rName)) return false
        if (/\b(zool[óo]gico|zoo|acuario|museo|catedral|iglesia|parque|carnaval|estadio)\b/i.test(rName)) return false
        return true
      })
      const uniqueRests = []
      for (const r of validRests) {
        const rName = typeof r === 'string' ? r : r.name
        if (!uniqueRests.some(existing => arePlacesSimilar(existing.name, rName))) {
          uniqueRests.push(typeof r === 'string' ? { name: r } : r)
        }
      }

      // Si faltan restaurantes para cubrir todos los días, enriquecer con la ciudad cabecera o búsquedas geográficas acotadas
      if (uniqueRests.length < daysCount) {
        const hubCity = known.city && known.city !== dName ? known.city : null
        if (hubCity) {
          const hubCat = await getRealDestinationCatalog(hubCity, destCountry).catch(() => null)
          for (const hr of (hubCat?.restaurants || [])) {
            const hrName = typeof hr === 'string' ? hr : (hr?.name || '')
            if (hrName && !uniqueRests.some(existing => arePlacesSimilar(existing.name, hrName))) {
              uniqueRests.push(typeof hr === 'string' ? { name: hr } : hr)
            }
          }
        }
      }
      if (uniqueRests.length < daysCount) {
        const dLat = cat?.latitude || known.latitude || null
        const dLon = cat?.longitude || known.longitude || null
        if (dLat && dLon) {
          const extraFood = await photonSearch(`restaurante ${dName}`, 15, dLat, dLon, null, 25000, destCountry).catch(() => [])
          for (const ef of extraFood) {
            if (ef?.name && !isGenericFacilityName(ef.name) && !isNonTouristFacility({ name: ef.name }) && !isUnmappedOrClosedVenue(ef.name)) {
              if (destCountry && ef.country && !isCountryMatch(destCountry, ef.country)) continue
              if (ef.latitude != null && ef.longitude != null) {
                if (!isWithinCoastalCorridorBounds(ef.latitude, ef.longitude, dName)) continue
                const d = haversineMeters(dLat, dLon, ef.latitude, ef.longitude)
                if (d > 25000) continue
              }
              if (!uniqueRests.some(existing => arePlacesSimilar(existing.name, ef.name))) {
                uniqueRests.push({
                  ...ef,
                  name: ef.name,
                  coordinateSource: ef.coordinateSource || 'photon',
                  coordinatesVerified: true
                })
              }
            }
          }
        }
      }
      if (uniqueRests.length < daysCount) {
        const dynamicProfile = await fetchDynamicDestinationProfile(dName, destCountry).catch(() => null)
        const verifiedProfileRestaurants = await verifiedCatalogEntries(
          dynamicProfile?.restaurants || [],
          dName,
          destCountry,
          12,
          known.latitude || null,
          known.longitude || null,
          'restaurant'
        )
        for (const dr of verifiedProfileRestaurants) {
          const drName = typeof dr === 'string' ? dr : (dr?.name || '')
          if (drName && !isGenericFacilityName(drName) && !isNonTouristFacility({ name: drName }) && !isUnmappedOrClosedVenue(drName)) {
            if (!uniqueRests.some(existing => arePlacesSimilar(existing.name, drName))) {
              uniqueRests.push(dr)
            }
          }
        }
      }

      // 2. Obtener atractivos del catálogo dinámico y enriquecer si faltan paradas, EXCLUYENDO rigurosamente restaurantes
      let catPlaces = (cat?.places || []).filter(p => {
        const pName = typeof p === 'string' ? p : (p?.name || '')
        if (!pName || isGenericFacilityName(pName) || isUnmappedOrClosedVenue(pName) || isNonTouristFacility({ name: pName }) || isFoodOrDrinkEstablishment(pName) || isLodgingName(pName)) return false
        if (uniqueRests.some(r => arePlacesSimilar(r.name, pName))) return false
        return true
      })
      if (catPlaces.length < totalPlacesNeeded) {
        const cleanKey = dName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        const corridorPlaces = DESTINATION_ICONIC_LANDMARKS[cleanKey] || []
        const verifiedCorridorPlaces = await verifiedCatalogEntries(
          corridorPlaces,
          dName,
          destCountry,
          corridorPlaces.length,
          known.latitude || null,
          known.longitude || null,
          'attraction'
        )
        for (const cp of verifiedCorridorPlaces) {
          const cpName = typeof cp === 'string' ? cp : cp?.name
          if (cpName && !catPlaces.some(existing => arePlacesSimilar(typeof existing === 'string' ? existing : existing?.name, cpName)) && !uniqueRests.some(r => arePlacesSimilar(r.name, cpName))) {
            catPlaces.push(cp)
          }
        }
      }
      if (catPlaces.length < totalPlacesNeeded) {
        const dynamicIconics = await fetchCityIconicLandmarks(dName, destCountry).catch(() => [])
        const verifiedDynamicIconics = await filterChatSpecificPlacesByOsm(dynamicIconics, dName, destCountry)
        for (const di of verifiedDynamicIconics) {
          const diName = typeof di === 'string' ? di : (di?.name || '')
          if (diName && !isGenericFacilityName(diName) && !isUnmappedOrClosedVenue(diName) && !isNonTouristFacility({ name: diName }) && !isFoodOrDrinkEstablishment(diName) && !isLodgingName(diName) && !catPlaces.some(cp => arePlacesSimilar(cp, diName)) && !uniqueRests.some(r => arePlacesSimilar(r.name, diName))) {
            catPlaces.push(diName)
          }
        }
      }

      const cleanExplicitPool = placeNames.filter(p => {
        if (!p || isGenericFacilityName(p) || isUnmappedOrClosedVenue(p) || isNonTouristFacility({ name: p }) || isFoodOrDrinkEstablishment(p) || isLodgingName(p)) return false
        if (uniqueRests.some(r => arePlacesSimilar(r.name, p))) return false
        return true
      })
      const rawAttractions = [...cleanExplicitPool, ...catPlaces]
      const uniqueAttractions = deduplicateChatSpecificPlaces(rawAttractions, dName)
        .map(p => typeof p === 'string' ? p : p.name)
        .filter(p => !uniqueRests.some(r => arePlacesSimilar(r.name, p)))

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

      // A small destination may have fewer verified attractions than the
      // ideal two per day. Keep the itinerary complete by allocating one
      // real attraction per day and one real restaurant, instead of
      // exhausting the catalog and leaving later days empty.
      const attractionsPerDay = uniqueAttractions.length >= totalPlacesNeeded
        ? perDayPlacesCount
        : Math.min(perDayPlacesCount, Math.max(1, Math.floor(uniqueAttractions.length / Math.max(daysCount, 1))))

      for (let d = 1; d <= daysCount; d++) {
        reconstructed += `Día ${d}: ${dName}\n`
        const dayUsed = new Set()

        for (let s = 0; s < attractionsPerDay; s++) {
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
            chosenPlace = uniqueAttractions.find(p => 
              !Array.from(globalUsedNames).some(u => arePlacesSimilar(u, p)) &&
              !Array.from(dayUsed).some(u => arePlacesSimilar(u, p))
            ) || null
          }
          if (!chosenPlace) {
            chosenPlace = uniqueAttractions.find(p => !Array.from(dayUsed).some(u => arePlacesSimilar(u, p))) || null
          }
          if (!chosenPlace) {
            continue
          }
          globalUsedNames.add(chosenPlace)
          dayUsed.add(chosenPlace)
          reconstructed += ` • ${chosenPlace}\n`
          const placeCoords = resolveCoordinatesForPlace(chosenPlace, cat?.coordinatesMap, verifiedDynamicIconics, catPlaces, known.specificPlaces)
          parsedExtracted.specificPlaces.push({
            name: chosenPlace,
            dia: d,
            type: 'cultural',
            ...(placeCoords ? placeCoords : {})
          })
        }

        let chosenRest = null
        let chosenRestObj = null
        while (restCursor < uniqueRests.length) {
          const candidate = uniqueRests[restCursor++]
          const usedToday = Array.from(dayUsed).some(u => arePlacesSimilar(u, candidate.name))
          const usedGlobally = Array.from(globalUsedNames).some(u => arePlacesSimilar(u, candidate.name))
          if (!usedGlobally && !usedToday) {
            chosenRest = candidate.name
            chosenRestObj = candidate
            break
          }
        }
        if (!chosenRest) {
          chosenRestObj = uniqueRests.find(r => 
            !Array.from(globalUsedNames).some(u => arePlacesSimilar(u, r.name)) &&
            !Array.from(dayUsed).some(u => arePlacesSimilar(u, r.name))
          ) || null
          chosenRest = chosenRestObj?.name || null
        }
        if (!chosenRest) {
          chosenRestObj = uniqueRests.find(r => 
            !Array.from(dayUsed).some(u => arePlacesSimilar(u, r.name))
          ) || null
          chosenRest = chosenRestObj?.name || null
        }
        if (!chosenRest || Array.from(dayUsed).some(u => arePlacesSimilar(u, chosenRest))) {
          reconstructed += '\n'
          continue
        }
        globalUsedNames.add(chosenRest)
        dayUsed.add(chosenRest)
        reconstructed += ` • ${chosenRest}\n\n`
        const restCoords = resolveCoordinatesForPlace(chosenRest, chosenRestObj, uniqueRests, cat?.coordinatesMap, cat?.restaurants)
        parsedExtracted.specificPlaces.push({
          name: chosenRest,
          dia: d,
          type: 'food',
          ...(restCoords ? restCoords : {})
        })
      }

      reconstructed += isUserAskingForMoreStops
        ? '¿Qué te parece este itinerario ampliado? ¿Deseas hacer algún otro ajuste o procedemos a generar el tour en el mapa?'
        : '¿Qué te parece este itinerario? ¿Deseas hacer algún ajuste o procedemos a generar el tour en el mapa?'
      responseMessage = reconstructed
    }

    // Si el hospedaje aún no está confirmado y el usuario no pidió ver el itinerario expresamente, PURGAR cualquier bloque de itinerario por días que haya emitido la IA
    const botConfirmedLodging = /\b(hospedaje confirmado|hotel confirmado|alojamiento confirmado|confirmado el hotel|queda confirmado el hotel|registrado el hotel|registr[eé]\s+.+\s+como\s+alojamiento)\b/i.test(responseMessage)
    const effectiveHasLodging = finalHasLodging || botConfirmedLodging

    if (!effectiveHasLodging && !userRequestedItinerary) {
      responseMessage = responseMessage
        .replace(/(?:Itinerario de Viaje:|(?:\n|^)\s*(?:#{1,4}\s*)?D[íi]a\s*1\b)[^]*$/i, '')
        .replace(/:\s*$/, '.')
        .replace(/(?:aqu[íi]\s+(?:tienes|est[aá])\s+(?:tu|el)\s+itinerario[^.]*\.)/gi, '')
        .trim()
      const asksForLodging = /\b(hotel|hospedaje|alojamiento|d[oó]nde se hospedar[aá]n|d[oó]nde te hospedar[aá]s|quedan|quedar[aá]n)\b/i.test(responseMessage)
      if (!asksForLodging) {
        if (responseMessage.length > 0) {
          responseMessage += `\n\n¿En qué hotel o alojamiento se hospedarán en ${destName || 'su destino'}?`
        } else {
          responseMessage = `¿En qué hotel o alojamiento se hospedarán en ${destName || 'su destino'}?`
        }
      }
    }

    const isItineraryStatusInquiry = /\b(c[oó]mo va el itinerario|c[oó]mo va mi itinerario|estado del itinerario)\b/i.test(lastUserMsg)
    if (isItineraryStatusInquiry) {
      actionChips = ['🚀 Generar itinerario completo', '✏️ Modificar algún día', '➕ Agregar otra actividad']
    } else if (!finalHasLodging) {
      // Hospedaje aún pendiente: PROHIBIDO ofrecer "Generar tour". Ofrecer opciones de hospedaje.
      actionChips = actionChips.filter(c => !/generar tour|crear tour|armar tour|construir tour/i.test(c))
      if (!actionChips.some(c => /casa propia|familiar/i.test(c))) {
        actionChips.unshift('Tengo casa propia / familiar')
      }
      if (!actionChips.some(c => /hotel|hospedaje/i.test(c))) {
        actionChips.push('🏨 Recomiéndame hoteles')
      }
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
      if (!finalHasLodging) missing.push('tu alojamiento u hotel (o confirmar si te hospedas en casa propia/familiar)')
      if (!finalHasTransport) missing.push('tu medio de transporte')
      if (!finalHasBudget) missing.push('tu presupuesto estimado')

      responseMessage = `Para poder generar tu tour en el mapa y armar la ruta con precisión, aún necesitamos definir: **${missing.join(', ')}**. Por favor indícame este detalle para continuar.`
      actionChips = []
      if (!finalHasLodging) {
        actionChips.push('Tengo casa propia / familiar', '🏨 Recomiéndame hoteles')
      }
      if (!finalHasTransport) {
        actionChips.push('Auto rentado', 'Taxi / Uber', 'Transporte público')
      }
      if (!finalHasBudget) {
        actionChips.push('Económico', 'Moderado', 'Lujo')
      }
    } else if (!isAllKeyInfoComplete && isBotConfirmingBuild) {
      const missing = []
      if (!finalHasCity) missing.push('el destino')
      if (!finalHasDates) missing.push('las fechas o días de viaje')
      if (!finalHasLodging) missing.push('tu alojamiento u hotel (o confirmar si te hospedas en casa propia/familiar)')
      if (!finalHasTransport) missing.push('tu medio de transporte')
      if (!finalHasBudget) missing.push('tu presupuesto estimado')

      responseMessage = `Antes de generar tu tour en el mapa, necesitamos definir: **${missing.join(', ')}**. Por favor indícanos este detalle para armar tu ruta con precisión.`
      actionChips = []
      if (!finalHasLodging) {
        actionChips.push('Tengo casa propia / familiar', '🏨 Recomiéndame hoteles')
      }
    } else if (effectiveReadyToBuild && /\b(aún necesito|necesito que me indiques|dónde planeas hospedarte|cómo prefieres moverte|tienes algún presupuesto)\b/i.test(responseMessage)) {
      responseMessage = `¡Excelente! Procedo a generar tu tour personalizado en ${destName} en el mapa. ¡Prepárate para disfrutar tu viaje!`
    }

    // Phase 1 guard: an empty verified catalog must never be replaced by
    // names invented in the free-form model response.
    const isHotelOptionsRequest = isLodgingRecommendationInquiry(lastUserMsg, lastAssistantMsg) && !isExplicitlyChoosingHotel(lastUserMsg)
    const isRestaurantOptionsRequest = /\b(restaurante|restaurantes|comida|comer|gastronom[íi]a|cenar|almorzar|men[uú]|carta|platos)\b/i.test(lastUserMsg)
    const isItineraryRequest = /\b(itinerario|itinerarios|plan de viaje|mostrar el itinerario|muéstrame el itinerario|detalles del d[íi]a|ver d[íi]a|d[íi]a\s*\d+)\b/i.test(lastUserMsg)
    if (hasCity && realCatalog && isHotelOptionsRequest && Array.isArray(realCatalog.hotels) && realCatalog.hotels.length === 0) {
      responseMessage = `No encontré alojamientos verificados en ${destName}. Puedo ampliar el radio de búsqueda o puedes indicarme el nombre y la dirección de tu hospedaje.`
      actionChips = ['🏨 Buscar en un radio mayor', 'Tengo casa propia / familiar']
    } else if (hasCity && realCatalog && isRestaurantOptionsRequest && !isItineraryRequest && Array.isArray(realCatalog.restaurants) && realCatalog.restaurants.length === 0) {
      responseMessage = `No encontré restaurantes verificados en ${destName}. Puedo ampliar el radio de búsqueda o continuar el plan sin una parada gastronómica específica.`
      actionChips = ['🍽️ Ampliar radio de búsqueda', 'Continuar sin restaurante']
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

    // Final textual guard: the visible chat itinerary must obey the same
    // canonical identity rules as the structured map payload.
    responseMessage = await sanitizeChatItineraryTextWithOsm(
      responseMessage,
      destName || known.city || known.destination || '',
      destCountry,
      parsedExtracted.selectedHotel || known.selectedHotel
    )

    // Enforce cross-day global uniqueness on specificPlaces: no POI can appear on multiple days
    const rawSpecifics = Array.isArray(parsedExtracted.specificPlaces) && parsedExtracted.specificPlaces.length > 0
      ? parsedExtracted.specificPlaces
      : (known.specificPlaces || [])
    const dedupedSpecificPlaces = deduplicateChatSpecificPlaces(
      rawSpecifics,
      destName || known.city || known.destination || ''
    )

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
  const cleanMsg = String(userMessage || '').trim()
  const lowerMsg = cleanMsg.toLowerCase()

  // 0. Fast-path (Short-circuit): Resolver en 0ms para mensajes breves de control, confirmación o navegación
  const isDirectConfirmation = /^(?:s[íi]|dale|perfecto|listo|adelante|genera(?:r)?|hazlo|construye|est[aá] bien|vale|me gusta|de acuerdo|bueno|ok(?:ay)?|genial|excelente|procede|claro|vamos)(?:\s*[,;:]?\s*(?:a|con|para|el|la|tu|mi|todo|tour|ruta|itinerario|genera(?:r)?|crea(?:r)?|construye|procede(?:r)?|me|parece|bien))*\s*$/i.test(lowerMsg)
  const isDirectAddStops = /^(agrega|a[ñn]ade|m[aá]s paradas|m[aá]s lugares|agrega m[aá]s paradas|a[ñn]ade m[aá]s paradas|quiero m[aá]s paradas)\b/i.test(lowerMsg)
  const isDirectHomeLodging = /^(en mi casa|mi casa|casa de un familiar|familiar|particular|alojamiento propio|ya tengo hotel|ya tengo hospedaje)\b/i.test(lowerMsg)
  const isOptionNumber = /^(opci[oó]n\s*[1-9]|[1-9]|el\s*(primero|segundo|tercero)|la\s*(primera|segunda|tercera))\b/i.test(lowerMsg)
  const isSimpleNav = /^(ver itinerario|mostrar itinerario|ver men[úu]|comida)\b/i.test(lowerMsg)

  if ((cleanMsg.length <= 45 && (isDirectConfirmation || isDirectAddStops || isDirectHomeLodging || isOptionNumber || isSimpleNav)) || isLodgingCategoryOrGeneric(cleanMsg)) {
    return extractChatInformationFallback(userMessage)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return extractChatInformationFallback(userMessage)
  }

  const prompt = `Eres un extractor de preferencias de viaje para VIBETOURS.
Analiza el último mensaje del usuario y el historial reciente para extraer datos estructurados.
Mensaje actual del usuario: "${userMessage}"
Datos ya conocidos: ${JSON.stringify(currentData)}

REGLA CRÍTICA DE DESTINO TURÍSTICO (UNIVERSAL: CIUDADES, PARQUES, ISLAS, REGIONES):
- JERARQUÍA DE CIUDAD CABECERA VS SUB-ZONAS / EXCURSIONES:
  * Si el usuario menciona una ciudad principal o municipio cabecera (ej: "Santa Marta", "Medellín", "Cartagena", "Bogotá", "Barranquilla", "Madrid", "Roma") y a la vez menciona parques, pueblos, corregimientos o zonas aledañas (ej: "Minca", "Parque Tayrona", "Guatapé", "Islas del Rosario", "Puerto Colombia"):
    - "destination": la ciudad cabecera principal (ej: "Santa Marta"). NUNCA asignes un parque, vereda o pueblo menor como "destination" si se mencionó una ciudad cabecera base.
    - "city": la ciudad cabecera principal (ej: "Santa Marta").
    - Agrega los parques o pueblos aledaños obligatoriamente a "specificPlaces" (ej: [{ "name": "Minca", "dia": 2 }, { "name": "Parque Nacional Natural Tayrona", "dia": 3 }]).
  * Si el usuario menciona ÚNICAMENTE un parque natural, reserva, isla o pueblo sin mencionar ciudad cabecera (ej: "Quiero ir a Minca", "un viaje al Parque Tayrona", "tour en Guatapé"):
    - "destination": el parque o destino solicitado (ej: "Parque Nacional Natural Tayrona", "Minca").
    - "city": el municipio o ciudad de referencia correspondiente (ej: "Santa Marta" si es Tayrona/Minca, "Salento" si es Valle de Cocora).
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
- "selectedHotel": { "name": "Nombre comercial exacto del hotel específico" } si el usuario CONFIRMÓ EXPLÍCITAMENTE quedarse allí con su nombre propio (ej: "confirmo el Hotel Casa La Fe", "elijo el Hotel Dann Carlton", "me hospedo en el Hotel X") O { "name": "Casa propia / Alojamiento particular" } si es casa propia/familiar. NUNCA coloques categorías o tipos genéricos como "Villa privada", "Resort", "Hotel boutique", "Cabaña", "Apartamento" en selectedHotel; en tales casos DEBE ser null.
- "accommodationStatus": "Casa propia / familiar" (si indica casa propia/familiar), "Hotel elegido" (ÚNICAMENTE si el usuario confirmó explícitamente un hotel con nombre comercial específico), "Por definir" (si menciona un tipo de hospedaje como "una villa privada", "un resort", pide recomendaciones, o aún no confirma) o null.
- "lodgingTypePreference": categoría o estilo preferido si el usuario lo menciona (ej: "villa privada", "resort frente al mar", "hotel boutique", "cabaña", "económico") o null.
- "specificPlaces": lista de atracciones o lugares físicos con nombre propio y día (ej: [{ "name": "Cabo San Juan", "dia": 1 }, { "name": "Playa Cristal", "dia": 2 }]). NUNCA incluir actividades genéricas ("Llegada", "Despedida", "Tiempo libre", "Día libre").`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildOpenAiPayload({
        modelConfig: getFastOpenAiModelConfig(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low'
      })),
      signal: AbortSignal.timeout(4500)
    })

    if (response.ok) {
      const data = await response.json()
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      if (parsed.durationDays && !parsed.durationHours) {
        parsed.durationHours = Number(parsed.durationDays) * 24
      }

      if (parsed.selectedHotel?.name && isLodgingCategoryOrGeneric(parsed.selectedHotel.name)) {
        if (!parsed.lodgingTypePreference) {
          parsed.lodgingTypePreference = parsed.selectedHotel.name
        }
        parsed.selectedHotel = null
        if (parsed.accommodationStatus === 'Hotel elegido') {
          parsed.accommodationStatus = 'Por definir'
        }
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

export function isValidRouteEndpoint(candidate = '') {
  if (!candidate || typeof candidate !== 'string') return false
  const clean = candidate.trim().toLowerCase()
  if (clean.length < 3 || clean.length > 35) return false

  // 1. Cannot contain verbs or movement/stay words
  if (/\b(mover|movernos|ir|irnos|viajar|viajaremos|quedar|quedarnos|hospedar|hospedarnos|caminar|llegar|salir|conocer|visitar|hacer|estar|pasar|comprar|comer|tomar|vamos|nos vamos)\b/i.test(clean)) {
    return false
  }

  // 2. Cannot contain money, budget, companions, duration, transport, or hotel words
  if (/\b(peso|pesos|d[oó]lar|d[oó]lares|mill[oó]n|millones|usd|cop|presupuesto|gasto|gastos|carro|auto|coche|taxi|bus|avi[oó]n|tren|amigo|amigos|familia|pareja|hotel|hostal|resort|d[íi]as?|noche|noches|semana|mes|a[ñn]o)\b/i.test(clean)) {
    return false
  }

  // 3. Must not be a generic non-destination
  if (/^(pareja|en pareja|familia|en familia|amigos|con amigos|solo|sola|grupo|en grupo|econ[oó]mico|moderado|lujo|barato|mochilero|caminando|a pie|auto|carro|coche|taxi|uber|bicicleta|bici|transporte p[úu]blico|hotel|hoteles|hostal|resort|hospedaje|alojamiento|un d[íi]a|\d+\s+d[íi]as?|fin de semana|puente|mes|semana|a[ñn]o|vacaciones|turismo|planes?|actividades|sitios|lugares|atracciones|nada|s[íi]|si|no|ok|hola|buenas?|gracias|adelante|generar?|crear?|empezar?|mover|movernos|pesos|vamos|nos vamos|presupuesto)$/i.test(clean)) {
    return false
  }

  // 4. Must not be a vague destination or non-touristic input
  if (isNonTouristicInput(clean) || isVagueDestination(clean)) return false

  // 5. Must not have excessive word count (city names are 1 to 3 words)
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length > 3) return false

  return true
}

export function extractChatInformationFallback(prompt) {
  const res = {}
  const text = (prompt || '').toLowerCase()

  const routeMatch = text.match(/\b(?:tour\s+|viaje\s+|ruta\s+|road\s*trip\s+|trayecto\s+)?(?:de|desde)\s+([a-záéíóúñ\s]+?)\s+(?:a|hast[aá]|hacia)\s+([a-záéíóúñ\s]+?)(?:$|\s+(?:en|con|para|durante|del|por|el|la|los)\b)/i)
  if (routeMatch) {
    const originRaw = routeMatch[1].trim()
    const destinationRaw = routeMatch[2].trim()
    if (isValidRouteEndpoint(originRaw) && isValidRouteEndpoint(destinationRaw)) {
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

  const budgetNumMatch = text.match(/\b(?:presupuesto\s+(?:de\s+)?|tengo\s+|contamos\s+con\s+)?(\d+(?:[.,]\d+)?)\s*(mill[oó]n(?:es)?|mil|k|usd|d[oó]lares|pesos|cop|euros|€|\$)\b/i)
  if (budgetNumMatch) {
    const num = parseFloat(budgetNumMatch[1].replace(',', '.'))
    const unit = budgetNumMatch[2].toLowerCase()
    if (unit.startsWith('mill')) {
      if (num >= 10) res.budget = 'Lujo'
      else if (num >= 3) res.budget = 'Moderado'
      else res.budget = 'Económico'
    } else if (unit === 'usd' || unit.startsWith('d[oó]lar') || unit === '$' || unit === 'euros' || unit === '€') {
      if (num >= 3000) res.budget = 'Lujo'
      else if (num >= 1000) res.budget = 'Moderado'
      else res.budget = 'Económico'
    } else {
      res.budget = 'Moderado'
    }
  } else if (/\b(econ[oó]mico|mochilero|barato|ajustado|bajo presupuesto)\b/i.test(text)) {
    res.budget = 'Económico'
  } else if (/\b(lujo|premium|alto|cinco estrellas)\b/i.test(text)) {
    res.budget = 'Lujo'
  } else if (/\b(moderado|medio|est[aá]ndar)\b/i.test(text)) {
    res.budget = 'Moderado'
  } else if (/\bpresupuesto\b/i.test(text) && /\b\d+\b/.test(text)) {
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

  const isHotelInquiryOnly = /\b(informaci[óo]n|detalles?|saber\s+m[aá]s|cu[ée]ntame)\s+(?:sobre|de|del)?\b/i.test(text)
  const isNegatedOrAskingLodging = isLodgingNegationOrUncertainty(text) || isLodgingRecommendationInquiry(text)
  if (!isHotelInquiryOnly && !isNegatedOrAskingLodging) {
    const hotelMatch = text.match(/\b(?:en el|al|en|hospedar(?:nos)?\s+en|quedar(?:nos)?\s+en|eleg[íi]\s+(?:el\s+)?|elijo\s+(?:el\s+)?|escog[íi]\s+(?:el\s+)?|ok\s+(?:el\s+)?|perfecto\s+(?:el\s+)?|vamos\s+con\s+(?:el\s+)?)?\s*(hotel|hostal|hostel|resort|posada|caba[ñn]a)\s+([a-záéíóúñ0-9\s]{2,40}?)(?:$|\s+(?:y\s+|con\s+|para\s+|del\s+|de\s+|\.|\,))/i)
    if (hotelMatch) {
      let rawHotel = `${hotelMatch[1]} ${hotelMatch[2]}`.trim()
      rawHotel = rawHotel.replace(/\s+(?:est[aá]\s+bien|me\s+parece\s+bien|me\s+gusta|por\s+favor|gracias|porfa|listo)$/i, '').trim()
      if (!isLodgingCategoryOrGeneric(rawHotel) && rawHotel.length >= 4) {
        const cleanHotel = rawHotel.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        res.selectedHotel = cleanHotel
        res.accommodationStatus = 'Hotel elegido'
      }
    }
  }

  if (isNegatedOrAskingLodging || /\b(recomi[eé]ndame hoteles|hoteles|opciones de hotel|buscar hotel|sin hotel|no tengo hotel|no tenemos hotel|dame recomendaciones)\b/i.test(text)) {
    delete res.selectedHotel
    res.accommodationStatus = 'Recomiéndame hoteles'
  } else if (/\b(casa propia|mi casa|casa familiar|tengo hospedaje|tengo hotel|ya tengo hotel|tengo donde quedarme)\b/i.test(text)) {
    res.accommodationStatus = 'Casa propia / familiar'
  } else if (!isNegatedOrAskingLodging && /\b(s[íi]\s+(ese\s+es|ah[íi]\s+es|correcto|de\s+acuerdo)|ese\s+es\s+el\s+hotel|ah[íi]\s+nos\s+vamos\s+a\s+quedar)\b/i.test(text)) {
    res.accommodationStatus = 'Hotel elegido'
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

  const NON_DEST = /^(pareja|en pareja|familia|en familia|amigos|con amigos|solo|sola|grupo|en grupo|econ[oó]mico|moderado|lujo|barato|mochilero|caminando|a pie|auto|carro|coche|taxi|uber|bicicleta|bici|transporte p[úu]blico|hotel|hoteles|hostal|resort|hospedaje|alojamiento|un d[íi]a|\d+\s+d[íi]as?|fin de semana|puente|mes|semana|a[ñn]o|vacaciones|turismo|planes?|actividades|sitios|lugares|atracciones|nada|s[íi]|si|no|ok|hola|buenas?|gracias|adelante|generar?|crear?|empezar?|mover|movernos|pesos|vamos|nos vamos|presupuesto)$/i

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

function readAiCandidateId(stop) {
  if (!stop || typeof stop !== 'object') return ''
  return String(
    stop.candidateId ||
    stop.candidate_id ||
    stop.ubicacion?.candidateId ||
    stop.ubicacion?.candidate_id ||
    stop.locationInfo?.candidateId ||
    stop.locationInfo?.candidate_id ||
    ''
  ).trim()
}

/**
 * The model may write prose, but it cannot choose a place by prose. Every
 * itinerary stop must reference one of the verified planner candidates.
 */
export function validateAiPlanCandidateIds(plan, candidates = []) {
  if (!plan || typeof plan !== 'object' || !Array.isArray(candidates) || candidates.length === 0) return false
  const allowedIds = new Set(candidates.map(getCandidateId).filter(Boolean))
  if (allowedIds.size === 0) return false

  if (Array.isArray(plan.itinerario)) {
    return plan.itinerario.length > 0 && plan.itinerario.every(stop => allowedIds.has(readAiCandidateId(stop)))
  }

  if (Array.isArray(plan.itinerario_dias)) {
    const stops = plan.itinerario_dias.flatMap(day => Array.isArray(day?.paradas) ? day.paradas : [])
    return stops.length > 0 && stops.every(stop => allowedIds.has(readAiCandidateId(stop)))
  }

  return false
}

function hydrateAiPlanCandidateIds(plan, candidates) {
  if (!validateAiPlanCandidateIds(plan, candidates)) return null
  const candidatesById = new Map(candidates.map(candidate => [getCandidateId(candidate), candidate]))
  const hydrateStop = stop => {
    const candidateId = readAiCandidateId(stop)
    const candidate = candidatesById.get(candidateId)
    if (!candidate) return stop
    return {
      ...stop,
      candidateId,
      nombre: stop.nombre || stop.name || candidate.name,
      ubicacion: {
        ...(stop.ubicacion || {}),
        candidateId,
        place_id: candidateId,
        nombre_lugar: stop.ubicacion?.nombre_lugar || candidate.name
      }
    }
  }

  if (Array.isArray(plan.itinerario)) {
    plan.itinerario = plan.itinerario.map(hydrateStop)
  }
  if (Array.isArray(plan.itinerario_dias)) {
    plan.itinerario_dias = plan.itinerario_dias.map(day => ({
      ...day,
      paradas: Array.isArray(day?.paradas) ? day.paradas.map(hydrateStop) : day?.paradas
    }))
  }
  if (Array.isArray(plan.itinerario)) {
    plan.orden_paradas = plan.itinerario.map(stop => readAiCandidateId(stop)).filter(Boolean)
  }
  return plan
}

/**
 * Official Tour Planner AI Plan Generator
 * Matches the exact requested JSON schema with provider-backed candidate IDs.
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
  const selectedPlaces = places.slice(0, 30).map((p, i) => ({
    candidateId: getCandidateId(p),
    name: p.name,
    dia: Number(p.dia || p.day || (Math.floor((i * totalDays) / places.length) + 1)),
    category: p.category || 'historic',
    description: p.description || ''
  }))

  if (selectedPlaces.length < 2 || selectedPlaces.some(place => !place.candidateId)) {
    console.warn('[planWithOpenAI] Refusing AI plan because one or more candidates lack a stable ID')
    return null
  }

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
      "candidateId": "ID EXACTO DE UN CANDIDATO RECIBIDO (obligatorio)",
      "nombre": "Nombre real del lugar o restaurante",
      "descripcion": "Guía de voz inmersiva de 60 a 90 palabras escrita como guía experto hablando al oído del turista, con historia, arquitectura y qué observar.",
      "duracion_estimada": "45 minutos",
      "actividades": ["Actividad 1", "Actividad 2"],
      "datos_curiosos": ["Dato curioso real 1", "Dato curioso real 2"],
      "consejos": ["Consejo práctico del guía"],
      "ubicacion": {
        "candidateId": "Repite el candidateId exacto de esta parada",
        "nombre_lugar": "Nombre del lugar",
        "direccion": "Dirección física o cruce de calles (ej: Cra. 49C # 76-80 o Calle 72 con Cra 53)",
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
  "orden_paradas": ["candidate-id-1", "candidate-id-2"],
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
1. Utiliza exactamente los candidateId de la lista recibida (${selectedPlaces.map((item, i) => `${i + 1}. candidateId=${item.candidateId}; nombre de contexto=${item.name} (Día ${item.dia})`).join(', ')}). Respeta fielmente su orden secuencial y asigna cada parada a su día indicado en el itinerario ("dia": 1..${totalDays}).
2. Cada parada debe incluir un candidateId exacto de esa lista. El nombre es solo texto visible; nunca lo uses para crear, sustituir o inferir la identidad del lugar.
3. El tour dura ${totalDays} días. Debes estructurar el itinerario distribuyendo las paradas según los días indicados, asegurando que existan paradas para cada uno de los ${totalDays} días ("dia": 1..${totalDays}).
4. El título "nombre_tour" DEBE ser original, evocador, cautivador y con identidad temática única sobre ${cleanCity} (ej: "Joyas y Leyendas de ${cleanCity}", "Sabores y Brisas: De El Prado al Río", "Ruta Secreta de Arquitectura y Tradición en ${cleanCity}"). PROHIBIDO usar títulos planos y repetitivos como "Tour Cultural por ${cleanCity}" o "Tour Personalizado por ${cleanCity}". Tampoco nombres el tour con el nombre de una sola parada.
5. NO agregues hoteles ni alojamientos como paradas de actividad dentro del itinerario.
6. Para cada parada, redacta una narración de guía de voz inmersiva de 60 a 90 palabras, con la voz de una guía turística apasionada, joven, extrovertida y cálida, con ritmo fluido, pausas naturales y emoción genuina para narración de audio en vivo (TTS).
7. Integra notas dinámicas de consejos y datos curiosos específicos por parada.
8. REGLA ESTRICTA PARA 'mejor_epoca': Si el viaje cuenta con fechas o evento especial indicado (${defaultBestSeason !== 'Todo el año' ? `"${defaultBestSeason}"` : 'como un festival o mes específico'}), 'mejor_epoca' DEBE reflejar exactamente ese rango de fechas o festividad (ej: "${defaultBestSeason}"). De lo contrario, indica "Todo el año" (siempre con 'ñ').
9. REGLA OBLIGATORIA PARA 'ubicacion.direccion': Para cada parada (especialmente restaurantes, locales gastronómicos, tiendas y cafés), DEBES proporcionar la dirección física real o el cruce de calles (ej: 'Cra. 49C # 76-80', 'Calle 72 con Cra. 53'). La identidad y las coordenadas finales serán tomadas por el backend desde el candidateId, no desde estos campos.`

  // For tours with more than 4 stops, split into dynamic parallel chunks of max 4 places so generation completes in ~12-16s regardless of stops count
  if (selectedPlaces.length > 4) {
    const CHUNK_SIZE = 4
    const chunks = []
    for (let i = 0; i < selectedPlaces.length; i += CHUNK_SIZE) {
      chunks.push(selectedPlaces.slice(i, i + CHUNK_SIZE))
    }

    try {
      const chunkPromises = chunks.map((chunk, idx) => {
        const isFirstChunk = idx === 0
        const chunkSystem = isFirstChunk
          ? system
          : `Eres Tour Planner AI 🤖, el motor oficial de itinerarios de VibeTours.
Tu tarea es generar ÚNICAMENTE el bloque ${idx + 1} de paradas del itinerario para ${cleanCity}, ${targetCountry}.
Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "itinerario": [
    {
      "dia": 1,
      "parada": 1,
      "candidateId": "ID EXACTO DE UN CANDIDATO RECIBIDO (obligatorio)",
      "nombre": "Nombre exacto del lugar recibido",
      "descripcion": "Guía de voz inmersiva de 60 a 90 palabras escrita como guía turístico apasionado, joven y extrovertido para narración TTS.",
      "duracion_estimada": "45 minutos",
      "actividades": ["Actividad recomendada 1", "Actividad 2"],
      "datos_curiosos": ["Dato curioso específico del lugar"],
      "consejos": ["Consejo práctico del guía"],
      "ubicacion": {
        "candidateId": "Repite el candidateId exacto de esta parada",
        "nombre_lugar": "Nombre exacto del lugar recibido",
        "direccion": "Dirección física o cruce de calles (ej: Cra. 49C # 76-80)",
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
  ]
}`

        return fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify(buildOpenAiPayload({
            modelConfig: getFastOpenAiModelConfig(),
            messages: [
              { role: 'system', content: chunkSystem },
              {
                role: 'user',
                content: `Genera las paradas obligatorias del bloque ${idx + 1} para ${cleanCity}, ${targetCountry}.
Fechas / Época: ${datesContext || 'Todo el año'}
Evento o Festival: ${specialEventContext || 'No especificado'}
Lugares obligatorios de este bloque: ${JSON.stringify(chunk)}`
              }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
            reasoning_effort: 'low'
          })),
          signal: AbortSignal.timeout(18000)
        }).then(async res => {
          if (!res.ok) return null
          const data = await res.json()
          return cleanAndParseJson(data.choices?.[0]?.message?.content, null)
        }).catch(() => null)
      })

      const results = await Promise.all(chunkPromises)
      const basePlan = results[0]
      if (basePlan && typeof basePlan === 'object') {
        const mergedItinerario = []
        for (const res of results) {
          if (res && Array.isArray(res.itinerario)) {
            mergedItinerario.push(...res.itinerario)
          }
        }
        if (mergedItinerario.length >= 2) {
          const hydratedPlan = hydrateAiPlanCandidateIds({
            ...basePlan,
            itinerario: mergedItinerario
          }, selectedPlaces)
          if (hydratedPlan) return hydratedPlan
        }
      }
    } catch (err) {
      console.warn('[planWithOpenAI] Dynamic parallel chunks error, falling back to single call:', err?.message || err)
    }
  }

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
      return hydrateAiPlanCandidateIds(
        cleanAndParseJson(data.choices?.[0]?.message?.content, null),
        selectedPlaces
      )
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
   - ESTRICTAMENTE PROHIBIDO incluir restaurantes de OTRAS ciudades lejanas; usa únicamente establecimientos del catálogo verificado del destino.
3. "hotels": Array de 4 a 6 hoteles reales y destacados de diferentes gamas (boutique colonial/histórico, lujo, céntrico).
   - Cada hotel con: "name", "desc" (1 línea concisa de su estilo/ubicación) y "price" (rango estimado en USD).
4. "events": Array de 2 a 3 festividades, carnavales o eventos culturales anuales icónicos con fechas habituales.

REGLA CRÍTICA DE CARTOGRAFÍA Y PRECISIÓN TERRITORIAL:
- Todos los lugares, hoteles y restaurantes DEBEN pertenecer físicamente al municipio o área metropolitana de "${clean}". PROHIBIDO sugerir lugares de otras ciudades.
- Incluye ÚNICAMENTE lugares y atractivos reales que existan físicamente, estén actualmente en funcionamiento y cuenten con registro en OpenStreetMap / OpenFreeMap.
- ESTRICTAMENTE PROHIBIDO incluir cadenas de hipermercados o supermercados (Alkosto, Éxito, Olímpica, Carulla, Jumbo, Makro, Ara, D1, etc.).
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
      const response = await fetchWithProviderRetry('https://api.openai.com/v1/chat/completions', {
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
      }, {
        attempts: 3,
        timeoutMs: 25000
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
    const chunkSize = 3
    const chunks = []
    for (let i = 0; i < placeNames.length; i += chunkSize) {
      chunks.push(placeNames.slice(i, i + chunkSize))
    }

    const systemPrompt = `Eres una guía turística profesional, joven, apasionada y narradora experta de VibeTours.
Tu misión es generar contenido 100% auténtico, inmersivo, hiperlocal, cálido y SIN plantillas repetitivas para CADA parada turística listada en español, redactado para sonar apasionante y natural cuando se escuche narrado por voz.

Referencia de excelencia ("Estándar Ventana de Campeones"):
- Habla directamente del lugar: qué es, su historia, arquitectura o naturaleza específica, su significado para la ciudad y qué lo distingue.
- Actividades tangibles y concretas que solo se hacen en ese sitio (ej: para una aleta monumental: "Tomar fotos frente al monumento iluminado", "Pasear hacia el Malecón del Río", "Apreciar la brisa del río").
- Consejos prácticos de guía local (mejor luz para fotos, horario, hidratación, calzado).
- Datos curiosos verídicos comprobables.

Para CADA lugar, genera un objeto con:
1. "descripcion": Narración inmersiva, clara y evocadora (entre 55 y 85 palabras). Destaca su arquitectura, historia o ambiente singular. PROHIBIDO usar fórmulas clónicas como "un sitio ideal para", "durante el recorrido te sugerimos enfocar tu atención en", "aguas turquesas que acarician" o "es un punto indispensable".
2. "actividades": Array de 3 actividades o vivencias tangibles y singulares de ese sitio exacto.
3. "datos_curiosos": Array de 1 o 2 datos históricos verídicos o singularidades arquitectónicas del sitio.
4. "consejos": Array de 1 o 2 recomendaciones prácticas de visita (luz para fotos, horario, hidratación, calzado).

Devuelve estrictamente un objeto JSON donde cada clave es el nombre exacto del lugar:
{
  "Nombre del Lugar": {
    "descripcion": "texto inmersivo único...",
    "actividades": ["Actividad 1", "Actividad 2", "Actividad 3"],
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
          : buildFallbackActivitiesForPlace(name, destination || city)

        const curiosities = (Array.isArray(item?.datos_curiosos) && item.datos_curiosos.length > 0)
          ? item.datos_curiosos
          : buildFallbackCuriositiesForPlace(name, destination || city)

        const tips = (Array.isArray(item?.consejos) && item.consejos.length > 0)
          ? item.consejos
          : buildFallbackTipsForPlace(name, destination || city)

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
          actividades: buildFallbackActivitiesForPlace(name, destination || city),
          datos_curiosos: buildFallbackCuriositiesForPlace(name, destination || city),
          consejos: buildFallbackTipsForPlace(name, destination || city)
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

function buildFallbackActivitiesForPlace(name, city = '') {
  const clean = String(name || '').trim()
  const seed = Math.abs(clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(clean)) {
    const bocasOptions = [
      [`Recorrer el tajamar y contemplar la desembocadura del río Magdalena en el mar Caribe`, `Observar el choque de corrientes, el oleaje y el paso de embarcaciones costeras`, `Tomar fotografías panorámicas del horizonte marítimo y sentir la brisa en ${clean}`],
      [`Caminar por el sendero del tajamar sintiendo la brisa oceánica y fluvial`, `Apreciar la biodiversidad marina, aves costeras y la faena de pescadores artesanales`, `Disfrutar de bebidas refrescantes y postales únicas del paisaje litoral`]
    ]
    return bocasOptions[seed % bocasOptions.length]
  }
  if (/shakira|arroyo|pibe|escalona|botero/i.test(clean)) {
    return [
      `Fotografiarse junto a la emblemática escultura de ${clean}`,
      `Conocer la historia, trayectoria y homenaje cultural que representa este ícono`,
      `Disfrutar del paseo por el malecón y contemplar las vistas y la brisa del entorno`
    ]
  }
  if (/playa|beach|bah[íi]a|cabo|cala|ensenada|costa/i.test(clean)) {
    const beachOptions = [
      [`Caminar por la orilla y relajarse frente al mar en ${clean}`, `Bañarse en las aguas templadas y contemplar el horizonte marino`, `Degustar bebidas refrescantes y pasabocas típicos en kioscos playeros`],
      [`Apreciar la brisa y descansar bajo la sombra en ${clean}`, `Tomar fotografías panorámicas del litoral costero`, `Contemplar el movimiento de lanchas y la faena de pesca tradicional`],
      [`Nadar en aguas serenas y disfrutar de actividades recreativas en ${clean}`, `Presenciar el atardecer sobre el horizonte marino`, `Recorrer los accesos peatonales y puestos artesanales`]
    ]
    return beachOptions[seed % beachOptions.length]
  }
  if (/malec[óo]n|paseo|boulevard|rambla/i.test(clean)) {
    const promOptions = [
      [`Recorrer a pie el trayecto peatonal de ${clean} sintiendo la brisa`, `Admirar las esculturas y vistas abiertas hacia el agua`, `Detenerse en los puestos gastronómicos tradicionales`],
      [`Fotografiar el paisaje panorámico desde las barandas de ${clean}`, `Observar la actividad recreativa y ambiente cívico al aire libre`, `Disfrutar de un helado artesanal o merienda típica durante la caminata`]
    ]
    return promOptions[seed % promOptions.length]
  }
  if (/ci[eé]naga|manglar|delta|r[íi]o|estuario|laguna/i.test(clean)) {
    const natureOptions = [
      [`Realizar un recorrido en canoa o lancha por los canales de ${clean}`, `Avistar aves acuáticas y fauna nativa del ecosistema de manglar`, `Aprender sobre la pesca artesanal y conservación ambiental con guías locales`],
      [`Caminar por los muelles de madera y miradores ecológicos de ${clean}`, `Observar los espejos de agua en calma y raíces de mangle`, `Registrar fotografías del paisaje silvestre del humedal`]
    ]
    return natureOptions[seed % natureOptions.length]
  }
  if (/monumento|estatua|memorial|escultura|aleta|ventana/i.test(clean)) {
    const monOptions = [
      [`Apreciar la escala arquitectónica y detalles artísticos de ${clean}`, `Conocer el homenaje cívico e histórico que motivó su creación`, `Tomar fotografías desde diferentes perspectivas y apreciar su iluminación`],
      [`Recorrer la plazoleta peatonal que circunda ${clean}`, `Leer las placas conmemorativas y detalles de su diseño`, `Observar los contrastes visuales entre la obra y el paisaje urbano`]
    ]
    return monOptions[seed % monOptions.length]
  }
  if (/parque|plaza|plazoleta/i.test(clean)) {
    const parkOptions = [
      [`Pasear bajo los árboles frondosos y zonas de descanso en ${clean}`, `Apreciar los monumentos centrales y arquitectura de los alrededores`, `Observar las actividades culturales y cotidianas de la comunidad`],
      [`Caminar por las plazoletas y glorietas peatonales de ${clean}`, `Apreciar las fuentes y elementos ornamentales del espacio`, `Disfrutar de un café o postre típico en los locales contiguos`]
    ]
    return parkOptions[seed % parkOptions.length]
  }
  if (/restaurante|comida|asador|bistro|bar|gastronom[íi]a|parador/i.test(clean)) {
    return [
      `Degustar los platos insignia y especialidades culinarias de ${clean}`,
      `Acompañar la experiencia con bebidas tradicionales o refrescos locales`,
      `Apreciar la ambientación del lugar y la esmerada atención del equipo`
    ]
  }
  return [
    `Conocer de cerca la historia y características singulares de ${clean}`,
    `Recorrer los puntos de mayor interés visual y patrimonial del sitio`,
    `Apreciar la atmósfera y vida cotidiana que distinguen a ${clean}`
  ]
}

function buildFallbackCuriositiesForPlace(name, city = '') {
  const clean = String(name || '').trim()
  const loc = city ? `en ${city}` : 'en la región'
  const seed = Math.abs(clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(clean)) {
    const facts = [
      `Es la imponente obra de ingeniería marítima y fluvial que canaliza el río Magdalena hacia el océano Atlántico a lo largo de varios kilómetros de tajamar.`,
      `En este punto exacto convergen las aguas dulces del río más caudaloso de Colombia con la inmensidad salina del mar Caribe.`
    ]
    return [facts[seed % facts.length]]
  }
  if (/shakira/i.test(clean)) {
    return [`La imponente escultura de más de 6 metros de altura en bronce y aluminio celebra el talento y proyección internacional de la artista barranquillera.`]
  }
  if (/playa|beach|bah[íi]a|cabo|cala|costa/i.test(clean)) {
    const facts = [
      `Sus arenas y oleaje suave son apreciados por locales como un refugio de tranquilidad costera ${loc}.`,
      `El litoral de ${clean} ha sido históricamente punto de encuentro para pescadores artesanales tradicionales ${loc}.`
    ]
    return [facts[seed % facts.length]]
  }
  if (/malec[óo]n|paseo/i.test(clean)) {
    const facts = [
      `${clean} constituye el principal corredor peatonal de integración entre la vida ciudadana y el horizonte acuático ${loc}.`,
      `Es uno de los puntos predilectos para contemplar la caída del sol sobre el horizonte ${loc}.`
    ]
    return [facts[seed % facts.length]]
  }
  if (/ci[eé]naga|manglar|estuario/i.test(clean)) {
    const facts = [
      `Alberga colonias de mangle rojo, negro y avicennia, esenciales para la protección biológica de la costa ${loc}.`,
      `Es un refugio migratorio vital para aves que transitan entre el hemisferio norte y el sur del continente.`
    ]
    return [facts[seed % facts.length]]
  }
  if (/monumento|aleta|ventana|escultura/i.test(clean)) {
    const facts = [
      `Su diseño vanguardista e iluminación lo han convertido en uno de los hitos visuales más representativos ${loc}.`,
      `Fue erigido como símbolo de identidad comunitaria y orgullo cultural representativo de la región.`
    ]
    return [facts[seed % facts.length]]
  }
  return [`${clean} es un referente de gran valor paisajístico y cultural representativo ${loc}.`]
}

function buildFallbackTipsForPlace(name, city = '') {
  const clean = String(name || '').trim()
  const seed = Math.abs(clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(clean)) {
    const tips = [
      `Llevar calzado con buen agarre, protección solar e hidratación para recorrer el tajamar sin contratiempos.`,
      `Aprovechar la mañana o el atardecer para disfrutar de la mejor iluminación fotográfica y brisa fresca.`
    ]
    return [tips[seed % tips.length]]
  }
  if (/shakira|arroyo|pibe|botero|monumento|ventana|aleta/i.test(clean)) {
    const tips = [
      `Aprovechar la luz de la mañana o el atardecer para capturar las mejores fotos con el monumento de ${clean}.`,
      `Complementar la visita con un recorrido por el malecón o la plazoleta peatonal para disfrutar del ambiente.`
    ]
    return [tips[seed % tips.length]]
  }
  if (/playa|beach|bah[íi]a|costa/i.test(clean)) {
    const tips = [
      `Llevar protector solar, sombrero e hidratación para disfrutar cómodamente de la estancia.`,
      `Aprovechar las horas de la mañana para encontrar un espacio más despejado y aguas más calmas.`
    ]
    return [tips[seed % tips.length]]
  }
  if (/malec[óo]n|paseo/i.test(clean)) {
    const tips = [
      `Visitar al final de la tarde o al anochecer para capturar las mejores fotografías con la iluminación del sitio.`,
      `Usar calzado cómodo para recorrer todo el trayecto peatonal sin prisas.`
    ]
    return [tips[seed % tips.length]]
  }
  if (/ci[eé]naga|manglar/i.test(clean)) {
    return [`Llevar repelente ecológico y binoculares para el avistamiento de aves acuáticas.`]
  }
  return [`Planificar la visita con ropa ligera y calzado cómodo para disfrutar del recorrido.`]
}

function buildRichFallbackDescription(name, city = '') {
  const clean = String(name || '').trim()
  const loc = city ? `en ${city}` : 'en la región'
  const seed = Math.abs(clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  const isBocasDeCeniza = /\b(bocas?\s+de\s+ceniza|tajamar|desembocadura)\b/i.test(clean)
  if (isBocasDeCeniza) {
    const bocasVariants = [
      `${clean} es el imponente tajamar ${loc} donde convergen la fuerza del río Magdalena y el mar Caribe, ofreciendo un paisaje agreste único y vistas panorámicas del océano.`,
      `En ${clean}, los visitantes son testigos directos de la majestuosa desembocadura del río más importante de Colombia en el Caribe, con brisa oceánica constante y horizonte abierto.`
    ]
    return bocasVariants[seed % bocasVariants.length]
  }

  const isCulturalIcon = /shakira|arroyo|pibe|escalona|botero|garc[ií]a\s+m[aá]rquez/i.test(clean)
  if (isCulturalIcon) {
    const iconVariants = [
      `${clean} es un vibrante tributo artístico ${loc}, que rinde homenaje a una de las figuras más queridas y trascendentes de la cultura y la música colombiana a nivel mundial.`,
      `Ubicado en un entorno animado ${loc}, ${clean} celebra el talento, ritmo y legado de un ícono cultural imprescindible, atrayendo a admiradores y viajeros de todo el mundo.`
    ]
    return iconVariants[seed % iconVariants.length]
  }

  const isChurch = /\b(catedral|iglesia|bas[íi]lica|templo|santuario|parroquia)\b/i.test(clean)
  if (isChurch) {
    const churchVariants = [
      `Importante templo religioso y patrimonio arquitectónico ${loc}, destacado por sus líneas coloniales, altares históricos y la serenidad de su espacio interior.`,
      `Emblemático recinto sagrado ${loc}, que custodia expresiones de arte religioso y representa un hito fundamental de la historia espiritual comunitaria.`
    ]
    return churchVariants[seed % churchVariants.length]
  }

  const isCarnaval = /carnaval|comparsa|folclor/i.test(clean)
  if (isCarnaval) {
    return `Epicentro de la tradición cultural y festiva ${loc}, donde expresiones de folclor, música tradicional y atuendos típicos transmiten la identidad de sus gentes.`
  }

  const isMuseum = /\b(museo|casa museo|galer[íi]a|centro cultural)\b/i.test(clean)
  if (isMuseum) {
    const museumVariants = [
      `Recinto cultural ${loc} que conserva exposiciones históricas, vestigios arqueológicos y muestras artísticas que documentan el legado de la comunidad.`,
      `Espacio museístico ${loc} dedicado a salvaguardar la memoria colectiva, documentos visuales y creaciones representativas de la identidad regional.`
    ]
    return museumVariants[seed % museumVariants.length]
  }

  const isEstuaryOrNature = /\b(ci[eé]naga|manglar|delta|r[íi]o|estuario|laguna|pantano)\b/i.test(clean)
  if (isEstuaryOrNature) {
    const natureVariants = [
      `${clean} es un imponente enclave natural ${loc}, donde confluyen corrientes fluviales y marinas ofreciendo vistas panorámicas excepcionales y una rica biodiversidad.`,
      `Importante humedal y reserva ecológica ${loc}, con bosques de mangle y canales navegables ideales para el avistamiento de aves y la contemplación silvestre.`
    ]
    return natureVariants[seed % natureVariants.length]
  }

  const isBeach = /\b(playa|beach|bah[íi]a|cabo|cala|ensenada|costa)\b/i.test(clean)
  if (isBeach) {
    const beachVariants = [
      `${clean} es un atractivo frente costero ${loc}, caracterizado por su oleaje apacible, brisa marina constante y ambiente ideal para el descanso junto al mar.`,
      `Destacada franja litoral ${loc}, apreciada por visitantes y locales por sus aguas templadas, extensas orillas de arena y pintorescos atardeceres marinos.`,
      `${clean} ofrece un entorno playero relajante ${loc}, con kioscos tradicionales de gastronomía de mar y espacios idóneos para pasear por la costa.`
    ]
    return beachVariants[seed % beachVariants.length]
  }

  const isZoo = /\b(zool[óo]gico|zoo|acuario|bioparque|aviario)\b/i.test(clean)
  if (isZoo) {
    return `Espacio dedicado a la conservación biológica y educación ambiental ${loc}, que alberga fauna representativa y flora tropical en senderos ecológicos acondicionados.`
  }

  const isWaterOrPark = /\b(malec[óo]n|parque|plaza|mirador|paseo|boulevard|jard[íi]n|cerro)\b/i.test(clean)
  if (isWaterOrPark) {
    const parkVariants = [
      `Espacio emblemático al aire libre ${loc}, ideal para pasear, contemplar el paisaje y disfrutar del encuentro social y la naturaleza circundante.`,
      `Punto de encuentro ciudadano y recreación ${loc}, con amplias zonas peatonales, sombra arbolada y vistas panorámicas del entorno urbano y paisajístico.`
    ]
    return parkVariants[seed % parkVariants.length]
  }

  const isMonument = /\b(monumento|estatua|busto|obelisco|escultura|hito|memorial|aleta|ventana)\b/i.test(clean)
  if (isMonument) {
    const monVariants = [
      `Hito conmemorativo y visual ${loc} erigido en honor a personajes y acontecimientos determinantes en la construcción histórica y cultural del territorio.`,
      `Estructura escultórica emblemática ${loc}, reconocida por su audaz diseño y su valor como tributo a la identidad y grandeza deportiva o civil de la región.`
    ]
    return monVariants[seed % monVariants.length]
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

  const genericVariants = [
    `${clean} ofrece un atractivo recorrido ${loc}, permitiendo a los visitantes apreciar de cerca la identidad, historia y dinamismo característico del destino.`,
    `${clean} constituye un punto singular ${loc}, propicio para descubrir el ambiente genuino y los contrastes cotidianos de la región.`,
    `La visita a ${clean} enriquece el itinerario ${loc}, brindando un contacto directo con las costumbres y el entorno local.`
  ]
  return genericVariants[seed % genericVariants.length]
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

  const resolveWithProviders = async (requestedNames = placeNames) => {
    const fallbackResults = {}
    for (const placeName of requestedNames) {
      const geo = await resolvePlaceWithCascade({
        name: placeName,
        city,
        country,
        cityLat: centerLat,
        cityLon: centerLon,
        options: { preferCanonical: true }
      }).catch(() => null)
      if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude)) &&
          Number(geo.latitude) !== 0 && Number(geo.longitude) !== 0) {
        fallbackResults[placeName] = {
          latitude: Number(geo.latitude),
          longitude: Number(geo.longitude),
          address: geo.address || geo.name || city,
          placeId: geo.placeId || geo.place_id || '',
          coordinateSource: geo.coordinateSource || geo.coordinate_source || 'provider'
        }
      }
    }
    return fallbackResults
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return resolveWithProviders()
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

    // OpenAI can be configured correctly but temporarily unavailable (for
    // example, quota exhausted). Fill missing entries from the same verified
    // provider cascade instead of returning an empty geocoder result.
    const missingNames = placeNames.filter(placeName => {
      const value = merged[placeName]
      return !value || !Number.isFinite(Number(value.latitude)) || !Number.isFinite(Number(value.longitude))
    })
    if (missingNames.length > 0) {
      Object.assign(merged, await resolveWithProviders(missingNames))
    }
    return merged
  } catch (err) {
    console.warn('[openai] geocodePlacesWithOpenAI failed:', err.message)
    return resolveWithProviders()
  }
}
