import { supabase } from './supabase.js'
import { GeoCache } from './geoCache.js'
import { FALLBACK_DESTINATION_CENTROIDS, haversineDistanceKm, getCanonicalDestinationFromCache } from './destinationService.js'
import { isGenericFacilityName, isLowQualityOrFastFoodVenue } from './open-tourism-service.js'
import { isFoodOrDrinkEstablishment, isPlaceInDifferentCity } from './osm.js'

function resolveCityCentroidForCache(city = '', normCity = '', explicitLat = null, explicitLon = null) {
  if (explicitLat != null && explicitLon != null && Number.isFinite(Number(explicitLat)) && Number.isFinite(Number(explicitLon))) {
    return { latitude: Number(explicitLat), longitude: Number(explicitLon) }
  }
  const key = normCity || normalizeCityKey(city)
  if (key && FALLBACK_DESTINATION_CENTROIDS[key]) {
    return FALLBACK_DESTINATION_CENTROIDS[key]
  }
  const canonical = city ? getCanonicalDestinationFromCache(city) : null
  if (canonical && Number.isFinite(Number(canonical.latitude)) && Number.isFinite(Number(canonical.longitude))) {
    return { latitude: Number(canonical.latitude), longitude: Number(canonical.longitude) }
  }
  return null
}

// In-memory LRU cache fallback (24 hours TTL, up to 1000 places)
export const placesMemoryCache = new GeoCache(24 * 60 * 60 * 1000, 1000)
export const cityCatalogMemoryCache = new GeoCache(24 * 60 * 60 * 1000, 200)

const GENERIC_PREFIXES = /^(restaurante|restaurant|bistro|cafe|café|bar|gastrobar|pizzeria|pizzería|heladeria|heladería|taqueria|taquería|asador|parrilla|hostal|hotel)\s+/i

export function isTestOrDummyPlace(name) {
  if (!name || typeof name !== 'string') return false
  return /\b(test|prueba|dummy|mock|ejemplo)\b/i.test(name)
}

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

function classifyPlaceCategory(name = '', metadata = {}, explicitCategory = '') {
  const tags = metadata?.tags || metadata || {}
  const lowerName = String(name || '').toLowerCase()
  const metaCategory = String(metadata?.category || metadata?.type || metadata?.entityType || '').toLowerCase()
  if (metaCategory === 'hotel' || metaCategory === 'lodging' || /\b(hotel|hostal|hostel|resort|posada|caba[ñn]a|suites)\b/i.test(lowerName)) {
    return 'hotel'
  }
  if (
    metaCategory === 'restaurant' ||
    metaCategory === 'food' ||
    isFoodOrDrinkEstablishment(name, tags) ||
    isLowQualityOrFastFoodVenue(name, tags)
  ) {
    return 'restaurant'
  }
  if (explicitCategory) return explicitCategory
  return 'attraction'
}

/**
 * Looks up a place in memory cache and Supabase places_cache table.
 * @param {string} name - Raw or cleaned place name
 * @param {string} city - Destination city name
 * @returns {Promise<object|null>} Cached place info with coordinates or null
 */
export async function lookupCachedPlace(name, city = '') {
  if (isTestOrDummyPlace(name)) return null
  const normName = normalizePlaceNameKey(name)
  const normCity = normalizeCityKey(city)
  if (!normName) return null

  const centroid = resolveCityCentroidForCache(city, normCity)
  const cacheKey = getMemoryCacheKey(normName, normCity)
  const memHit = placesMemoryCache.get(cacheKey)
  if (memHit) {
    if (isLowQualityOrFastFoodVenue(memHit.name, memHit.metadata?.tags || memHit.tags)) return null
    if (centroid && Number.isFinite(Number(memHit.latitude)) && Number.isFinite(Number(memHit.longitude))) {
      const dist = haversineDistanceKm(centroid.latitude, centroid.longitude, Number(memHit.latitude), Number(memHit.longitude))
      if (dist > 55) return null
      if (city && isPlaceInDifferentCity({ ...memHit, tags: memHit.metadata?.tags || memHit.tags || {} }, city, centroid.latitude, centroid.longitude)) {
        return null
      }
    }
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
    if (isLowQualityOrFastFoodVenue(data.name, data.metadata?.tags || {})) return null

    const lat = Number(data.latitude)
    const lon = Number(data.longitude)
    if (centroid && Number.isFinite(lat) && Number.isFinite(lon)) {
      const dist = haversineDistanceKm(centroid.latitude, centroid.longitude, lat, lon)
      if (dist > 55) return null
      if (city && isPlaceInDifferentCity({ name: data.name, city: data.city, latitude: lat, longitude: lon, tags: data.metadata?.tags || {} }, city, centroid.latitude, centroid.longitude)) {
        return null
      }
    }

    const cachedPlace = {
      name: data.name,
      city: data.city,
      address: data.address || '',
      latitude: lat,
      longitude: lon,
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
 * Looks up all cached places for a given city from memory LRU or Supabase places_cache.
 * @param {string} city - City name
 * @param {string|null} category - Optional filter ('attraction', 'restaurant', 'hotel')
 * @param {number|null} centerLat - Optional destination center latitude
 * @param {number|null} centerLon - Optional destination center longitude
 * @returns {Promise<Array<object>>} List of cached places
 */
export async function lookupCachedPlacesForCity(city = '', category = null, centerLat = null, centerLon = null) {
  const normCity = normalizeCityKey(city)
  if (!normCity) return []

  const centroid = resolveCityCentroidForCache(city, normCity, centerLat, centerLon)
  const filterByCentroidAndQuality = (list = [], targetCat = null) => {
    return (Array.isArray(list) ? list : []).filter(p => {
      if (!p || !p.name || isTestOrDummyPlace(p.name) || isGenericFacilityName(p.name)) return false
      const tags = p.metadata?.tags || p.tags || {}
      if (isLowQualityOrFastFoodVenue(p.name, tags)) return false
      if (targetCat === 'attraction' && isFoodOrDrinkEstablishment(p.name, tags)) return false
      const lat = Number(p?.latitude ?? p?.lat)
      const lon = Number(p?.longitude ?? p?.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
      if (centroid) {
        if (haversineDistanceKm(centroid.latitude, centroid.longitude, lat, lon) > 55) return false
        if (isPlaceInDifferentCity({ ...p, latitude: lat, longitude: lon, tags }, city, centroid.latitude, centroid.longitude)) return false
      }
      return true
    })
  }

  // Check in-memory city catalog cache first (0 ms)
  const cachedCatalog = cityCatalogMemoryCache.get(normCity)
  if (cachedCatalog) {
    const validAll = filterByCentroidAndQuality(cachedCatalog.all || [])
    if (validAll.length > 0 || !centroid) {
      if (category === 'attraction') return filterByCentroidAndQuality(cachedCatalog.places || [], 'attraction')
      if (category === 'restaurant') return filterByCentroidAndQuality(cachedCatalog.restaurants || [], 'restaurant')
      if (category === 'hotel') return filterByCentroidAndQuality(cachedCatalog.hotels || [], 'hotel')
      return validAll
    }
  }

  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('places_cache')
      .select('name, normalized_name, city, address, latitude, longitude, place_id, source, confidence, metadata')
      .eq('normalized_city', normCity)
      .order('confidence', { ascending: false })
      .limit(80)

    if (error || !data || data.length === 0) return []

    const validRows = data.filter(r => {
      if (!r?.name || isTestOrDummyPlace(r.name) || isGenericFacilityName(r.name)) return false
      const tags = r.metadata?.tags || {}
      if (isLowQualityOrFastFoodVenue(r.name, tags)) return false
      const lat = Number(r.latitude)
      const lon = Number(r.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
      if (centroid) {
        const dist = haversineDistanceKm(centroid.latitude, centroid.longitude, lat, lon)
        if (dist > 55) return false
        if (isPlaceInDifferentCity({ name: r.name, city: r.city, latitude: lat, longitude: lon, tags }, city, centroid.latitude, centroid.longitude)) {
          return false
        }
      }
      return true
    })

    const formatted = validRows.map(row => {
      const placeCategory = classifyPlaceCategory(row.name, row.metadata, row.metadata?.category)
      return {
        name: row.name,
        city: row.city || city,
        address: row.address || '',
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        placeId: row.place_id || '',
        place_id: row.place_id || '',
        source: `cache_db:${row.source}`,
        confidence: Number(row.confidence ?? 1.0),
        metadata: row.metadata || {},
        tags: row.metadata?.tags || {},
        category: placeCategory,
        desc: row.metadata?.desc || row.metadata?.description || '',
        stars: String(row.metadata?.stars || '4'),
        cuisine: row.metadata?.cuisine || '',
        coordinatesVerified: true
      }
    })

    const catalog = {
      places: formatted.filter(p => p.category === 'attraction' && !isFoodOrDrinkEstablishment(p.name, p.tags)),
      restaurants: formatted.filter(p => p.category === 'restaurant' && !isLowQualityOrFastFoodVenue(p.name, p.tags)),
      hotels: formatted.filter(p => p.category === 'hotel'),
      all: formatted
    }

    cityCatalogMemoryCache.set(normCity, catalog)

    for (const p of formatted) {
      const normName = normalizePlaceNameKey(p.name)
      if (normName) {
        placesMemoryCache.set(getMemoryCacheKey(normName, normCity), p)
      }
    }

    if (category === 'attraction') return catalog.places
    if (category === 'restaurant') return catalog.restaurants
    if (category === 'hotel') return catalog.hotels
    return formatted
  } catch (err) {
    console.warn('[places-cache-service] City lookup error:', err.message)
    return []
  }
}

/**
 * Returns structured catalog for a city from cache if available.
 * @param {string} city
 * @param {number|null} centerLat
 * @param {number|null} centerLon
 * @returns {Promise<{ places: Array<object>, restaurants: Array<object>, hotels: Array<object> }|null>}
 */
export async function getCachedCityCatalog(city = '', centerLat = null, centerLon = null) {
  const normCity = normalizeCityKey(city)
  if (!normCity) return null

  const centroid = resolveCityCentroidForCache(city, normCity, centerLat, centerLon)
  const filterCatalog = (cat) => {
    if (!cat) return cat
    const validItem = (p, role = '') => {
      if (!p || !p.name || isTestOrDummyPlace(p.name) || isGenericFacilityName(p.name)) return false
      const tags = p.metadata?.tags || p.tags || {}
      if (isLowQualityOrFastFoodVenue(p.name, tags)) return false
      if (role === 'attraction' && isFoodOrDrinkEstablishment(p.name, tags)) return false
      const lat = Number(p?.latitude ?? p?.lat)
      const lon = Number(p?.longitude ?? p?.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
      if (centroid) {
        if (haversineDistanceKm(centroid.latitude, centroid.longitude, lat, lon) > 55) return false
        if (isPlaceInDifferentCity({ ...p, latitude: lat, longitude: lon, tags }, city, centroid.latitude, centroid.longitude)) return false
      }
      return true
    }
    const places = (cat.places || []).filter(p => validItem(p, 'attraction'))
    const restaurants = (cat.restaurants || []).filter(p => validItem(p, 'restaurant'))
    const hotels = (cat.hotels || []).filter(p => validItem(p, 'hotel'))
    const all = (cat.all || []).filter(p => validItem(p))
    return { places, restaurants, hotels, all }
  }

  const memCatalog = filterCatalog(cityCatalogMemoryCache.get(normCity))
  if (memCatalog && (memCatalog.places?.length > 0 || memCatalog.restaurants?.length > 0 || memCatalog.hotels?.length > 0)) {
    return memCatalog
  }

  await lookupCachedPlacesForCity(city, null, centerLat, centerLon)
  const populated = filterCatalog(cityCatalogMemoryCache.get(normCity))
  if (populated && (populated.places?.length > 0 || populated.restaurants?.length > 0 || populated.hotels?.length > 0)) {
    return populated
  }

  return null
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
  if (isTestOrDummyPlace(name) || isGenericFacilityName(name) || isLowQualityOrFastFoodVenue(name, metadata?.tags || metadata)) {
    return false
  }
  const numLat = Number(latitude)
  const numLon = Number(longitude)
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon) || (numLat === 0 && numLon === 0)) {
    return false
  }

  const normName = normalizePlaceNameKey(name)
  const normCity = normalizeCityKey(city)
  if (!normName) return false

  const centroid = resolveCityCentroidForCache(city, normCity)
  if (centroid) {
    if (haversineDistanceKm(centroid.latitude, centroid.longitude, numLat, numLon) > 55) {
      return false
    }
    if (city && isPlaceInDifferentCity({ name, city, latitude: numLat, longitude: numLon, tags: metadata?.tags || {} }, city, centroid.latitude, centroid.longitude)) {
      return false
    }
  }

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
    confidence: placeRecord.confidence,
    category: classifyPlaceCategory(placeRecord.name, metadata)
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

/**
 * Saves a batch of discovered places into in-memory LRU and Supabase places_cache asynchronously.
 * @param {Array<object>} places
 * @param {string} city
 * @param {string} defaultSource
 */
export async function saveCachedPlacesBatch(places = [], city = '', defaultSource = 'dynamic_discovery') {
  if (!Array.isArray(places) || places.length === 0) return false
  const normCity = normalizeCityKey(city)
  const centroid = resolveCityCentroidForCache(city, normCity)

  const records = []
  for (const p of places) {
    const rawName = typeof p === 'string' ? p : (p?.name || p?.nombre || '')
    const pTags = p?.tags || p?.metadata?.tags || {}
    if (isTestOrDummyPlace(rawName) || isGenericFacilityName(rawName) || isLowQualityOrFastFoodVenue(rawName, pTags)) continue
    const normName = normalizePlaceNameKey(rawName)
    if (!normName) continue

    const lat = Number(p?.latitude ?? p?.lat)
    const lon = Number(p?.longitude ?? p?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue
    if (centroid) {
      if (haversineDistanceKm(centroid.latitude, centroid.longitude, lat, lon) > 55) continue
      if (city && isPlaceInDifferentCity({ ...p, name: rawName, latitude: lat, longitude: lon, tags: pTags }, city, centroid.latitude, centroid.longitude)) continue
    }

    const placeCategory = classifyPlaceCategory(rawName, p?.metadata || p, p?.category)
    const record = {
      name: rawName.trim(),
      normalized_name: normName,
      city: (p?.city || city || '').trim(),
      normalized_city: normCity,
      address: String(p?.address || '').trim(),
      latitude: lat,
      longitude: lon,
      place_id: String(p?.placeId || p?.place_id || p?.id || ''),
      source: String(p?.source || defaultSource),
      confidence: Number(p?.confidence ?? 1.0),
      metadata: {
        category: placeCategory,
        desc: p?.desc || p?.description || '',
        stars: String(p?.stars || ''),
        cuisine: p?.cuisine || '',
        tags: pTags,
        ...(p?.metadata || {})
      }
    }

    records.push(record)

    // Store in individual memory cache
    placesMemoryCache.set(getMemoryCacheKey(normName, normCity), {
      name: record.name,
      city: record.city,
      address: record.address,
      latitude: lat,
      longitude: lon,
      placeId: record.place_id,
      source: record.source,
      confidence: record.confidence,
      category: placeCategory,
      tags: pTags,
      coordinatesVerified: true
    })
  }

  if (records.length === 0) return false

  // Update in-memory city catalog cache if present
  if (normCity) {
    const existing = cityCatalogMemoryCache.get(normCity) || { places: [], restaurants: [], hotels: [], all: [] }
    const seenNames = new Set(existing.all.map(x => normalizePlaceNameKey(x.name)))
    for (const rec of records) {
      if (!seenNames.has(rec.normalized_name)) {
        seenNames.add(rec.normalized_name)
        const formatted = {
          name: rec.name,
          city: rec.city,
          address: rec.address,
          latitude: rec.latitude,
          longitude: rec.longitude,
          placeId: rec.place_id,
          source: rec.source,
          confidence: rec.confidence,
          category: rec.metadata.category,
          desc: rec.metadata.desc,
          stars: rec.metadata.stars,
          cuisine: rec.metadata.cuisine,
          tags: rec.metadata.tags || {},
          coordinatesVerified: true
        }
        existing.all.push(formatted)
        if (formatted.category === 'attraction' && !isFoodOrDrinkEstablishment(formatted.name, formatted.tags)) existing.places.push(formatted)
        else if (formatted.category === 'restaurant' && !isLowQualityOrFastFoodVenue(formatted.name, formatted.tags)) existing.restaurants.push(formatted)
        else if (formatted.category === 'hotel') existing.hotels.push(formatted)
      }
    }
    cityCatalogMemoryCache.set(normCity, existing)
  }

  if (!supabase) return true

  // Asynchronously persist to Supabase places_cache table
  // Deduplicate records by unique key (normalized_name + normalized_city) to prevent Postgres ON CONFLICT collision in the same batch
  const uniqueRecordsMap = new Map()
  for (const rec of records) {
    const uniqueKey = `${rec.normalized_name}__${rec.normalized_city}`
    uniqueRecordsMap.set(uniqueKey, rec)
  }
  const uniqueRecords = Array.from(uniqueRecordsMap.values())

  try {
    const { error } = await supabase
      .from('places_cache')
      .upsert(uniqueRecords, { onConflict: 'normalized_name, normalized_city' })

    if (error) {
      console.warn('[places-cache-service] Batch DB Upsert warning:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[places-cache-service] Batch DB Upsert error:', err.message)
    return false
  }
}

