import { supabase } from './supabase.js'
import { GeoCache } from './geoCache.js'

// In-memory LRU cache fallback (24 hours TTL, up to 1000 places)
export const placesMemoryCache = new GeoCache(24 * 60 * 60 * 1000, 1000)

const GENERIC_PREFIXES = /^(restaurante|restaurant|bistro|cafe|café|bar|gastrobar|pizzeria|pizzería|heladeria|heladería|taqueria|taquería|asador|parrilla|hostal|hotel)\s+/i

/**
 * Normalizes a place name for consistent cache key comparison.
 * Removes accents, punctuation, generic prefixes, and excessive whitespace.
 * e.g. "Restaurante Cucayo" -> "cucayo"
 * e.g. "Cucayo Sabor Costeño" -> "cucayo sabor costeno"
 */
export function normalizePlaceNameKey(name) {
  if (!name || typeof name !== 'string') return ''
  let cleaned = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  cleaned = cleaned.replace(GENERIC_PREFIXES, '').trim()
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned
}

/**
 * Normalizes a city name for consistent cache key comparison.
 */
export function normalizeCityKey(city) {
  if (!city || typeof city !== 'string') return ''
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generates composite cache key.
 */
function getMemoryCacheKey(normName, normCity) {
  return `place_cache_${normCity}_${normName}`
}

/**
 * Looks up a place in memory cache and Supabase places_cache table.
 * @param {string} name - Raw or cleaned place name
 * @param {string} city - Destination city name
 * @returns {Promise<object|null>} Cached place info with coordinates or null
 */
export async function lookupCachedPlace(name, city = '') {
  const normName = normalizePlaceNameKey(name)
  const normCity = normalizeCityKey(city)
  if (!normName) return null

  const cacheKey = getMemoryCacheKey(normName, normCity)
  const memHit = placesMemoryCache.get(cacheKey)
  if (memHit) {
    return { ...memHit, source: memHit.source || 'cache_memory' }
  }

  if (!supabase) return null

  try {
    let query = supabase
      .from('places_cache')
      .select('name, normalized_name, city, address, latitude, longitude, place_id, source, confidence, metadata')
      .eq('normalized_name', normName)

    if (normCity) {
      query = query.eq('normalized_city', normCity)
    }

    const { data, error } = await query.limit(1).maybeSingle()
    if (error || !data) return null

    const cachedPlace = {
      name: data.name,
      city: data.city,
      address: data.address || '',
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      placeId: data.place_id || '',
      place_id: data.place_id || '',
      source: `cache_db:${data.source}`,
      confidence: Number(data.confidence ?? 1.0),
      metadata: data.metadata || {}
    }

    placesMemoryCache.set(cacheKey, cachedPlace)
    return cachedPlace
  } catch (err) {
    console.warn('[places-cache-service] Lookup error:', err.message)
    return null
  }
}

/**
 * Saves a resolved place to in-memory cache and persists it in Supabase places_cache.
 * @param {object} placeData
 */
export async function saveCachedPlace({
  name,
  city = '',
  address = '',
  latitude,
  longitude,
  placeId = '',
  source = 'manual',
  confidence = 1.0,
  metadata = {}
}) {
  const numLat = Number(latitude)
  const numLon = Number(longitude)
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon) || (numLat === 0 && numLon === 0)) {
    return false
  }

  const normName = normalizePlaceNameKey(name)
  const normCity = normalizeCityKey(city)
  if (!normName) return false

  const placeRecord = {
    name: name.trim(),
    normalized_name: normName,
    city: city.trim(),
    normalized_city: normCity,
    address: address.trim(),
    latitude: numLat,
    longitude: numLon,
    place_id: placeId || '',
    source,
    confidence: Number(confidence ?? 1.0),
    metadata
  }

  const cacheKey = getMemoryCacheKey(normName, normCity)
  placesMemoryCache.set(cacheKey, {
    name: placeRecord.name,
    city: placeRecord.city,
    address: placeRecord.address,
    latitude: numLat,
    longitude: numLon,
    placeId: placeRecord.place_id,
    source: placeRecord.source,
    confidence: placeRecord.confidence
  })

  if (!supabase) return true

  // Persist to Supabase asynchronously without blocking critical path
  try {
    const { error } = await supabase
      .from('places_cache')
      .upsert(placeRecord, { onConflict: 'normalized_name, normalized_city' })

    if (error) {
      console.warn('[places-cache-service] DB Upsert warning:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[places-cache-service] DB Upsert error:', err.message)
    return false
  }
}
