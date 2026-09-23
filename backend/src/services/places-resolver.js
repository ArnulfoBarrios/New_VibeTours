import { lookupCachedPlace, saveCachedPlace, normalizePlaceNameKey } from './places-cache-service.js'
import { geocodePlace, isDistinctNameMatch } from './osm.js'
import { haversineDistanceKm, cleanAdministrativeCityName } from './destinationService.js'

const DEFAULT_MAX_DISTANCE_KM = 50
const HTTP_TIMEOUT_MS = 4000

/**
 * Validates whether resolved coordinates are within reasonable proximity to the target city.
 */
function isWithinCityBounds(lat, lon, cityLat, cityLon, maxDistanceKm = DEFAULT_MAX_DISTANCE_KM) {
  if (cityLat == null || cityLon == null) return true
  const numLat = Number(lat)
  const numLon = Number(lon)
  const numCityLat = Number(cityLat)
  const numCityLon = Number(cityLon)
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon) || !Number.isFinite(numCityLat) || !Number.isFinite(numCityLon)) {
    return true
  }
  const dist = haversineDistanceKm(numLat, numLon, numCityLat, numCityLon)
  return dist <= maxDistanceKm
}

/**
 * Checks whether an address string looks like a physical street address with nomenclature.
 */
export function hasPhysicalAddressPattern(address) {
  if (!address || typeof address !== 'string') return false
  const lower = address.toLowerCase().trim()
  return /\b(calle|cll|cra|carrera|kra|av|avenida|diagonal|diag|transversal|transv|autopista|v[íi]a|km|manzana|mz|#|no\.?|con|esquina)\b/i.test(lower)
}

/**
 * Queries Mapbox Geocoding & Search API.
 */
async function queryMapboxGeocoding({ query, cityLat, cityLon, maxDistanceKm }) {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim()
  if (!token) return null

  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
    url.searchParams.set('access_token', token)
    url.searchParams.set('limit', '5')
    url.searchParams.set('language', 'es')
    url.searchParams.set('types', 'poi,address,neighborhood,locality')

    if (cityLat != null && cityLon != null && Number.isFinite(Number(cityLat)) && Number.isFinite(Number(cityLon))) {
      url.searchParams.set('proximity', `${cityLon},${cityLat}`)
    }

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
    if (!res.ok) return null

    const data = await res.json()
    const features = Array.isArray(data.features) ? data.features : []
    if (features.length === 0) return null

    // Find best feature matching query and within city proximity
    for (const feat of features) {
      const [lon, lat] = feat.center || []
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue

      if (!isWithinCityBounds(lat, lon, cityLat, cityLon, maxDistanceKm)) continue

      const featName = feat.text || feat.place_name || ''
      return {
        name: featName,
        address: feat.place_name || '',
        latitude: Number(lat),
        longitude: Number(lon),
        placeId: `mapbox:${feat.id || ''}`,
        source: 'mapbox',
        confidence: Number(feat.relevance ?? 0.9)
      }
    }
  } catch (err) {
    console.warn('[places-resolver] Mapbox query error:', err.message)
  }
  return null
}

/**
 * Queries Geoapify Geocoding & Places API.
 */
async function queryGeoapifyGeocoding({ query, cityLat, cityLon, maxDistanceKm }) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim()
  if (!apiKey) return null

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/search')
    url.searchParams.set('text', query)
    url.searchParams.set('apiKey', apiKey)
    url.searchParams.set('limit', '5')
    url.searchParams.set('lang', 'es')

    if (cityLat != null && cityLon != null && Number.isFinite(Number(cityLat)) && Number.isFinite(Number(cityLon))) {
      url.searchParams.set('bias', `proximity:${cityLon},${cityLat}`)
    }

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
    if (!res.ok) return null

    const data = await res.json()
    const features = Array.isArray(data.features) ? data.features : []
    if (features.length === 0) return null

    for (const feat of features) {
      const coords = feat.geometry?.coordinates || []
      const lon = coords[0]
      const lat = coords[1]
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue

      if (!isWithinCityBounds(lat, lon, cityLat, cityLon, maxDistanceKm)) continue

      const props = feat.properties || {}
      return {
        name: props.name || props.formatted || query,
        address: props.formatted || '',
        latitude: Number(lat),
        longitude: Number(lon),
        placeId: `geoapify:${props.place_id || ''}`,
        source: 'geoapify',
        confidence: Number(props.rank?.confidence ?? 0.85)
      }
    }
  } catch (err) {
    console.warn('[places-resolver] Geoapify query error:', err.message)
  }
  return null
}

/**
 * Resolves a place or tour stop using the Waterfall Cascade Strategy:
 * 1. Cache (Supabase / Memory)
 * 2. OSM / Photon / Nominatim
 * 3. Mapbox Search API (Fallback 1)
 * 4. Geoapify Places API (Fallback 2)
 * 5. Street Nomenclature / AI Address Geocoding
 *
 * Persists any newly resolved coordinates to cache.
 */
export async function resolvePlaceWithCascade({
  name,
  city = '',
  country = 'Colombia',
  address = '',
  cityLat = null,
  cityLon = null,
  maxDistanceKm = DEFAULT_MAX_DISTANCE_KM,
  options = {}
}) {
  if (!name || typeof name !== 'string') return null
  const cleanName = name.trim()
  const cleanCity = cleanAdministrativeCityName(city || '')

  // -------------------------------------------------------------
  // Tier 1: Supabase / Memory Cache Lookup
  // -------------------------------------------------------------
  const cached = await lookupCachedPlace(cleanName, cleanCity)
  if (cached && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude) && !(cached.latitude === 0 && cached.longitude === 0)) {
    if (isWithinCityBounds(cached.latitude, cached.longitude, cityLat, cityLon, maxDistanceKm)) {
      return {
        name: cached.name || cleanName,
        city: cleanCity,
        address: cached.address || '',
        latitude: cached.latitude,
        longitude: cached.longitude,
        placeId: cached.placeId || '',
        place_id: cached.placeId || '',
        coordinateSource: cached.source || 'cache',
        coordinatesVerified: true
      }
    }
  }

  // Common search strings
  const fullSearchQuery = cleanCity ? `${cleanName}, ${cleanCity}, ${country}` : `${cleanName}, ${country}`
  const citySearchQuery = cleanCity ? `${cleanName}, ${cleanCity}` : cleanName

  // -------------------------------------------------------------
  // Tier 2: OpenStreetMap / Photon / Nominatim
  // -------------------------------------------------------------
  const osmResult = await geocodePlace(fullSearchQuery, cityLat, cityLon, {
    city: cleanCity,
    destination: cleanCity,
    ...options
  }).catch(() => null)

  if (osmResult && Number.isFinite(osmResult.latitude) && Number.isFinite(osmResult.longitude)) {
    if (isWithinCityBounds(osmResult.latitude, osmResult.longitude, cityLat, cityLon, maxDistanceKm)) {
      const resolved = {
        name: cleanName,
        city: cleanCity,
        address: osmResult.address || osmResult.name || '',
        latitude: Number(osmResult.latitude),
        longitude: Number(osmResult.longitude),
        placeId: osmResult.placeId || osmResult.place_id || '',
        place_id: osmResult.placeId || osmResult.place_id || '',
        coordinateSource: osmResult.coordinateSource || 'osm',
        coordinatesVerified: true
      }
      saveCachedPlace({ ...resolved, source: 'osm' }).catch(() => {})
      return resolved
    }
  }

  // -------------------------------------------------------------
  // Tier 3: Mapbox Search / Geocoding API
  // -------------------------------------------------------------
  const mapboxResult = await queryMapboxGeocoding({
    query: fullSearchQuery,
    cityLat,
    cityLon,
    maxDistanceKm
  })

  if (mapboxResult) {
    const resolved = {
      name: cleanName,
      city: cleanCity,
      address: mapboxResult.address,
      latitude: mapboxResult.latitude,
      longitude: mapboxResult.longitude,
      placeId: mapboxResult.placeId,
      place_id: mapboxResult.placeId,
      coordinateSource: 'mapbox',
      coordinatesVerified: true
    }
    saveCachedPlace({ ...resolved, source: 'mapbox' }).catch(() => {})
    return resolved
  }

  // -------------------------------------------------------------
  // Tier 4: Geoapify Places API
  // -------------------------------------------------------------
  const geoapifyResult = await queryGeoapifyGeocoding({
    query: fullSearchQuery,
    cityLat,
    cityLon,
    maxDistanceKm
  })

  if (geoapifyResult) {
    const resolved = {
      name: cleanName,
      city: cleanCity,
      address: geoapifyResult.address,
      latitude: geoapifyResult.latitude,
      longitude: geoapifyResult.longitude,
      placeId: geoapifyResult.placeId,
      place_id: geoapifyResult.placeId,
      coordinateSource: 'geoapify',
      coordinatesVerified: true
    }
    saveCachedPlace({ ...resolved, source: 'geoapify' }).catch(() => {})
    return resolved
  }

  // -------------------------------------------------------------
  // Tier 5: Physical Street Address Geocoding (Nomenclature)
  // -------------------------------------------------------------
  if (hasPhysicalAddressPattern(address)) {
    const addressQuery = cleanCity ? `${address}, ${cleanCity}, ${country}` : `${address}, ${country}`

    // 5a. Mapbox address lookup
    const mapboxAddress = await queryMapboxGeocoding({
      query: addressQuery,
      cityLat,
      cityLon,
      maxDistanceKm
    })
    if (mapboxAddress) {
      const resolved = {
        name: cleanName,
        city: cleanCity,
        address: mapboxAddress.address,
        latitude: mapboxAddress.latitude,
        longitude: mapboxAddress.longitude,
        placeId: mapboxAddress.placeId,
        place_id: mapboxAddress.placeId,
        coordinateSource: 'ai_address:mapbox',
        coordinatesVerified: true
      }
      saveCachedPlace({ ...resolved, source: 'ai_address' }).catch(() => {})
      return resolved
    }

    // 5b. Geoapify address lookup
    const geoapifyAddress = await queryGeoapifyGeocoding({
      query: addressQuery,
      cityLat,
      cityLon,
      maxDistanceKm
    })
    if (geoapifyAddress) {
      const resolved = {
        name: cleanName,
        city: cleanCity,
        address: geoapifyAddress.address,
        latitude: geoapifyAddress.latitude,
        longitude: geoapifyAddress.longitude,
        placeId: geoapifyAddress.placeId,
        place_id: geoapifyAddress.placeId,
        coordinateSource: 'ai_address:geoapify',
        coordinatesVerified: true
      }
      saveCachedPlace({ ...resolved, source: 'ai_address' }).catch(() => {})
      return resolved
    }

    // 5c. OSM address lookup
    const osmAddress = await geocodePlace(addressQuery, cityLat, cityLon, {
      city: cleanCity,
      destination: cleanCity,
      ...options
    }).catch(() => null)
    if (osmAddress && Number.isFinite(osmAddress.latitude) && Number.isFinite(osmAddress.longitude)) {
      if (isWithinCityBounds(osmAddress.latitude, osmAddress.longitude, cityLat, cityLon, maxDistanceKm)) {
        const resolved = {
          name: cleanName,
          city: cleanCity,
          address: osmAddress.address || address,
          latitude: Number(osmAddress.latitude),
          longitude: Number(osmAddress.longitude),
          placeId: osmAddress.placeId || osmAddress.place_id || '',
          place_id: osmAddress.placeId || osmAddress.place_id || '',
          coordinateSource: 'ai_address:osm',
          coordinatesVerified: true
        }
        saveCachedPlace({ ...resolved, source: 'ai_address' }).catch(() => {})
        return resolved
      }
    }
  }

  return null
}
