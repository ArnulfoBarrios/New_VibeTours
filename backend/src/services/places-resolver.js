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
    url.searchParams.set('types', 'poi,address')

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

      // Reject generic city centroids, countries, or regions
      const placeTypes = Array.isArray(feat.place_type) ? feat.place_type : []
      if (placeTypes.length > 0 && placeTypes.every(t => ['place', 'locality', 'country', 'region', 'district'].includes(t))) {
        continue
      }

      const featName = feat.text || feat.place_name || ''
      return {
        name: featName,
        address: feat.place_name || '',
        latitude: Number(lat),
        longitude: Number(lon),
        placeId: `mapbox:${feat.id || ''}`,
        source: 'mapbox',
        confidence: Number(feat.relevance ?? 0.9),
        providerType: placeTypes[0] || '',
        tags: {
          mapboxPlaceTypes: placeTypes,
          mapboxCategory: feat.properties?.category || ''
        }
      }
    }
  } catch (err) {
    console.warn('[places-resolver] Mapbox query error:', err.message)
  }
  return null
}

/**
 * Discovers several POIs from Mapbox for the unified candidate catalog.
 * This is intentionally separate from resolvePlaceWithCascade: resolving one
 * requested name and discovering a destination catalog have different needs.
 */
export async function searchMapboxPlaces({
  queries = [],
  cityLat = null,
  cityLon = null,
  maxDistanceKm = DEFAULT_MAX_DISTANCE_KM
}) {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim()
  const cleanQueries = [...new Set((Array.isArray(queries) ? queries : [queries])
    .map(query => String(query || '').trim())
    .filter(Boolean))]
  if (!token || cleanQueries.length === 0) return []

  const results = await Promise.all(cleanQueries.map(async query => {
    try {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
      url.searchParams.set('access_token', token)
      url.searchParams.set('limit', '10')
      url.searchParams.set('language', 'es')
      url.searchParams.set('types', 'poi,address')
      if (cityLat != null && cityLon != null && Number.isFinite(Number(cityLat)) && Number.isFinite(Number(cityLon))) {
        url.searchParams.set('proximity', `${cityLon},${cityLat}`)
      }

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
      if (!response.ok) return []
      const data = await response.json()
      return (Array.isArray(data.features) ? data.features : []).map(feature => {
        const [longitude, latitude] = feature.center || []
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null
        if (!isWithinCityBounds(latitude, longitude, cityLat, cityLon, maxDistanceKm)) return null

        const placeTypes = Array.isArray(feature.place_type) ? feature.place_type : []
        if (placeTypes.length > 0 && placeTypes.every(type => ['place', 'locality', 'country', 'region', 'district', 'postcode'].includes(type))) {
          return null
        }

        const context = Array.isArray(feature.context) ? feature.context : []
        const cityContext = context.find(item => ['place', 'locality', 'municipality'].includes(String(item.id || '').split('.')[0]))
        const countryContext = context.find(item => String(item.id || '').startsWith('country.'))
        return {
          name: feature.text || feature.place_name || query,
          address: feature.place_name || '',
          city: cityContext?.text || '',
          country: countryContext?.text || '',
          latitude: Number(latitude),
          longitude: Number(longitude),
          placeId: feature.id ? `mapbox:${feature.id}` : '',
          place_id: feature.id ? `mapbox:${feature.id}` : '',
          coordinateSource: 'mapbox',
          coordinate_source: 'mapbox',
          coordinatesVerified: true,
          coordinates_verified: true,
          relevance: Number(feature.relevance ?? 0),
          providerType: placeTypes[0] || '',
          providerCategory: feature.properties?.category || '',
          tags: {
            mapboxPlaceTypes: placeTypes,
            mapboxCategory: feature.properties?.category || '',
            query
          }
        }
      }).filter(Boolean)
    } catch (err) {
      console.warn('[places-resolver] Mapbox discovery error:', err.message)
      return []
    }
  }))

  return results.flat()
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
      // Reject generic city centroids or non-specific boundaries
      const resultType = props.result_type || ''
      if (['city', 'country', 'state', 'county', 'postcode'].includes(resultType)) {
        continue
      }

      return {
        name: props.name || props.formatted || query,
        address: props.formatted || '',
        latitude: Number(lat),
        longitude: Number(lon),
        placeId: `geoapify:${props.place_id || ''}`,
        source: 'geoapify',
        confidence: Number(props.rank?.confidence ?? 0.85),
        providerType: props.result_type || '',
        providerCategory: Array.isArray(props.categories) ? props.categories.join(',') : '',
        tags: props
      }
    }
  } catch (err) {
    console.warn('[places-resolver] Geoapify query error:', err.message)
  }
  return null
}

/**
 * Discovers POIs from Geoapify Places API for the unified candidate catalog.
 */
export async function searchGeoapifyPlaces({
  categories = [],
  cityLat = null,
  cityLon = null,
  radiusMeters = 35000,
  limit = 50
}) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim()
  const cleanCategories = [...new Set((Array.isArray(categories) ? categories : [categories])
    .map(category => String(category || '').trim())
    .filter(Boolean))]
  if (!apiKey || cleanCategories.length === 0 || !Number.isFinite(Number(cityLat)) || !Number.isFinite(Number(cityLon))) return []

  try {
    const url = new URL('https://api.geoapify.com/v2/places')
    url.searchParams.set('categories', cleanCategories.join(','))
    url.searchParams.set('filter', `circle:${Number(cityLon)},${Number(cityLat)},${Number(radiusMeters)}`)
    url.searchParams.set('bias', `proximity:${Number(cityLon)},${Number(cityLat)}`)
    url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 50, 1), 100)))
    url.searchParams.set('lang', 'es')
    url.searchParams.set('apiKey', apiKey)

    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
    if (!response.ok) return []
    const data = await response.json()
    return (Array.isArray(data.features) ? data.features : []).map(feature => {
      const [longitude, latitude] = feature.geometry?.coordinates || []
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null
      const props = feature.properties || {}
      const categoriesFromProvider = Array.isArray(props.categories) ? props.categories : []
      return {
        name: props.name || props.address_line1 || props.formatted || '',
        address: props.formatted || [props.address_line1, props.address_line2].filter(Boolean).join(', '),
        city: props.city || props.municipality || '',
        country: props.country || '',
        latitude: Number(latitude),
        longitude: Number(longitude),
        placeId: props.place_id ? `geoapify:${props.place_id}` : '',
        place_id: props.place_id ? `geoapify:${props.place_id}` : '',
        coordinateSource: 'geoapify',
        coordinate_source: 'geoapify',
        coordinatesVerified: true,
        coordinates_verified: true,
        relevance: Number(props.rank?.confidence ?? props.rank?.popularity ?? 0),
        providerType: props.result_type || '',
        providerCategory: categoriesFromProvider.join(','),
        tags: { geoapifyCategories: categoriesFromProvider, ...props }
      }
    }).filter(Boolean)
  } catch (err) {
    console.warn('[places-resolver] Geoapify discovery error:', err.message)
    return []
  }
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
  // Tier 2: Mapbox Search / Geocoding API (Live commercial POIs & addresses)
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
      coordinatesVerified: true,
      providerType: mapboxResult.providerType || '',
      providerCategory: mapboxResult.providerCategory || '',
      tags: mapboxResult.tags || {}
    }
    saveCachedPlace({ ...resolved, source: 'mapbox' }).catch(() => {})
    return resolved
  }

  // -------------------------------------------------------------
  // Tier 3: Geoapify Places API (Live commercial backup)
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
      coordinatesVerified: true,
      providerType: geoapifyResult.providerType || '',
      providerCategory: geoapifyResult.providerCategory || '',
      tags: geoapifyResult.tags || {}
    }
    saveCachedPlace({ ...resolved, source: 'geoapify' }).catch(() => {})
    return resolved
  }

  // -------------------------------------------------------------
  // Tier 4: OpenStreetMap / Photon / Nominatim
  // -------------------------------------------------------------
  const osmResult = await geocodePlace(fullSearchQuery, cityLat, cityLon, {
    city: cleanCity,
    destination: cleanCity,
    preferLiveProviders: true,
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
        coordinatesVerified: true,
        providerType: osmResult.type || '',
        providerCategory: osmResult.category || '',
        tags: osmResult.tags || {}
      }
      saveCachedPlace({ ...resolved, source: 'osm' }).catch(() => {})
      return resolved
    }
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
        coordinatesVerified: true,
        providerType: mapboxAddress.providerType || '',
        providerCategory: mapboxAddress.providerCategory || '',
        tags: mapboxAddress.tags || {}
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
        coordinatesVerified: true,
        providerType: geoapifyAddress.providerType || '',
        providerCategory: geoapifyAddress.providerCategory || '',
        tags: geoapifyAddress.tags || {}
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
          coordinatesVerified: true,
          providerType: osmAddress.type || '',
          providerCategory: osmAddress.category || '',
          tags: osmAddress.tags || {}
        }
        saveCachedPlace({ ...resolved, source: 'ai_address' }).catch(() => {})
        return resolved
      }
    }
  }

  return null
}
