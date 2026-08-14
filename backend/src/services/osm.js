import { GeoCache } from './geoCache.js'

const USER_AGENT = 'VIBETOURS/1.0 contact=ops@vibetours.app'

const geocodeCache = new GeoCache(24 * 60 * 60 * 1000, 500)
const photonCache = new GeoCache(60 * 60 * 1000, 500)
const reverseCache = new GeoCache(24 * 60 * 60 * 1000, 500)
const hotelsCache = new GeoCache(60 * 60 * 1000, 200)
const foodCache = new GeoCache(60 * 60 * 1000, 200)
const citiesCache = new GeoCache(24 * 60 * 60 * 1000, 200)

export async function reverseGeocodeUserCountry(lat, lon) {
  if (!lat || !lon) return null
  const key = `user_country_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`
  const cached = reverseCache.get(key)
  if (cached) return cached

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lon)
    url.searchParams.set('zoom', '10')
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      const data = await response.json()
      if (data && data.address && data.address.country) {
        const country = data.address.country
        reverseCache.set(key, country)
        return country
      }
    }
  } catch (err) {
    console.error('Reverse geocode error:', err)
  }
  return null
}

export async function reverseGeocodeLocation(lat, lon) {
  if (!lat || !lon) return null
  const key = `location_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`
  const cached = reverseCache.get(key)
  if (cached) return cached

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('zoom', '12')
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      const data = await response.json()
      if (data && data.address) {
        let city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || data.address.state || ''
        if (city.toLowerCase().includes('perímetro urbano')) {
          city = city.replace(/perímetro urbano\s*/i, '').trim()
        }
        const country = data.address.country || ''
        const res = {
          city,
          country,
          name: data.display_name || city
        }
        reverseCache.set(key, res)
        return res
      }
    }
  } catch (err) {
    console.error('[osm] Reverse geocode location error:', err)
  }
  return null
}

export function normalizeGeocodeQuery(query) {
  if (!query || typeof query !== 'string') return ''
  let cleaned = query.trim().replace(/^(destino|lugar|ciudad|ubicaci[oó]n|location|destination|pais|pa[íi]s)\s*:\s*/i, '').trim()
  
  // Strip punctuation and dots (e.g. EE.UU. -> EEUU)
  cleaned = cleaned.replace(/[.\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')

  // Map Spanish country names and abbreviations to international OSM English names
  cleaned = cleaned.replace(/\b(ee\s*uu|eeuu|usa|us|estados\s+unidos)\b/gi, 'United States')
  cleaned = cleaned.replace(/\b(uk|reino\s+unido)\b/gi, 'United Kingdom')
  cleaned = cleaned.replace(/\b(francia)\b/gi, 'France')
  cleaned = cleaned.replace(/\b(italia)\b/gi, 'Italy')
  cleaned = cleaned.replace(/\b(españa|espana)\b/gi, 'Spain')
  cleaned = cleaned.replace(/\b(alemania)\b/gi, 'Germany')
  cleaned = cleaned.replace(/\b(japon|japón)\b/gi, 'Japan')
  cleaned = cleaned.replace(/\b(brasil)\b/gi, 'Brazil')
  cleaned = cleaned.replace(/\b(peru|perú)\b/gi, 'Peru')
  cleaned = cleaned.replace(/\b(mexico|méxico)\b/gi, 'Mexico')

  // Map famous Spanish city names to international OSM English names
  cleaned = cleaned.replace(/\bnueva\s+york\b/gi, 'New York')
  cleaned = cleaned.replace(/\bpar[íi]s\b/gi, 'Paris')
  cleaned = cleaned.replace(/\blondres\b/gi, 'London')
  cleaned = cleaned.replace(/\broma\b/gi, 'Rome')
  cleaned = cleaned.replace(/\btokio\b/gi, 'Tokyo')
  cleaned = cleaned.replace(/\bmosc[uú]\b/gi, 'Moscow')
  cleaned = cleaned.replace(/\bvarsovia\b/gi, 'Warsaw')
  cleaned = cleaned.replace(/\batenas\b/gi, 'Athens')
  cleaned = cleaned.replace(/\blisboa\b/gi, 'Lisbon')
  cleaned = cleaned.replace(/\bpraga\b/gi, 'Prague')

  // Remove duplicate tokens while preserving order
  const tokens = cleaned.split(/\s+/).filter(Boolean)
  const uniqueTokens = []
  for (const t of tokens) {
    if (!uniqueTokens.length || uniqueTokens[uniqueTokens.length - 1].toLowerCase() !== t.toLowerCase()) {
      uniqueTokens.push(t)
    }
  }
  return uniqueTokens.join(' ')
}

export function selectBestPoiResult(results, originalQuery = '') {
  if (!Array.isArray(results) || results.length === 0) return null
  const lowerQuery = String(originalQuery || '').toLowerCase()
  const isExplicitTransitQuery = /\b(estaci[oó]n|bus|metro|subway|parada|transit|train|railway|stop)\b/i.test(lowerQuery)

  if (!isExplicitTransitQuery && results.length > 1) {
    const nonTransitMatch = results.find(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || '').toLowerCase()
      const isTransit = ['bus_stop', 'tram_stop', 'station', 'subway', 'railway', 'platform', 'highway'].includes(type) || key === 'highway'
      return !isTransit
    })
    if (nonTransitMatch) return nonTransitMatch
  }

  return results[0]
}


const VERIFIED_HIGH_PRECISION_POIS = [
  { key: 'castillo san felipe', lat: 10.4237, lon: -75.5398, name: 'Castillo San Felipe de Barajas', city: 'Cartagena', country: 'Colombia' },
  { key: 'islas del rosario', lat: 10.1772, lon: -75.7428, name: 'Islas del Rosario (Isla Grande)', city: 'Cartagena', country: 'Colombia' },
  { key: 'isla del rosario', lat: 10.1772, lon: -75.7428, name: 'Islas del Rosario (Isla Grande)', city: 'Cartagena', country: 'Colombia' },
  { key: 'isla grande', lat: 10.1772, lon: -75.7428, name: 'Isla Grande (Islas del Rosario)', city: 'Cartagena', country: 'Colombia' },
  { key: 'ciudad amurallada', lat: 10.4243, lon: -75.5516, name: 'Ciudad Amurallada', city: 'Cartagena', country: 'Colombia' },
  { key: 'centro historico', lat: 10.4243, lon: -75.5516, name: 'Centro Histórico', city: 'Cartagena', country: 'Colombia' },
  { key: 'centro histórico', lat: 10.4243, lon: -75.5516, name: 'Centro Histórico', city: 'Cartagena', country: 'Colombia' },
  { key: 'bocagrande', lat: 10.4045, lon: -75.5568, name: 'Bocagrande', city: 'Cartagena', country: 'Colombia' },
  { key: 'convento de la popa', lat: 10.4216, lon: -75.5244, name: 'Convento de la Popa', city: 'Cartagena', country: 'Colombia' },
  { key: 'cerro de la popa', lat: 10.4216, lon: -75.5244, name: 'Convento de la Popa', city: 'Cartagena', country: 'Colombia' },
  { key: 'mercado de bazurto', lat: 10.4185, lon: -75.5188, name: 'Mercado de Bazurto', city: 'Cartagena', country: 'Colombia' },
  { key: 'getsemani', lat: 10.4208, lon: -75.5458, name: 'Getsemaní', city: 'Cartagena', country: 'Colombia' },
  { key: 'getsemaní', lat: 10.4208, lon: -75.5458, name: 'Getsemaní', city: 'Cartagena', country: 'Colombia' },
  { key: 'paseo en chiva', lat: 10.4223, lon: -75.5475, name: 'Paseo en Chiva (Salida Muelle de los Pegasos)', city: 'Cartagena', country: 'Colombia' },
  { key: 'chiva rumbera', lat: 10.4223, lon: -75.5475, name: 'Chiva Rumbera (Salida Muelle de los Pegasos)', city: 'Cartagena', country: 'Colombia' },
  { key: 'tour en chiva', lat: 10.4223, lon: -75.5475, name: 'Tour en Chiva (Salida Muelle de los Pegasos)', city: 'Cartagena', country: 'Colombia' },
  { key: 'chiva', lat: 10.4223, lon: -75.5475, name: 'Paseo en Chiva (Salida Muelle de los Pegasos)', city: 'Cartagena', country: 'Colombia' },
  { key: 'cafe del mar', lat: 10.4215, lon: -75.5539, name: 'Café del Mar (Baluarte Santo Domingo)', city: 'Cartagena', country: 'Colombia' },
  { key: 'café del mar', lat: 10.4215, lon: -75.5539, name: 'Café del Mar (Baluarte Santo Domingo)', city: 'Cartagena', country: 'Colombia' },
  { key: 'bahia de cartagena', lat: 10.4030, lon: -75.5440, name: 'Bahía de Cartagena (Paseo Marítimo)', city: 'Cartagena', country: 'Colombia' },
  { key: 'bahía de cartagena', lat: 10.4030, lon: -75.5440, name: 'Bahía de Cartagena (Paseo Marítimo)', city: 'Cartagena', country: 'Colombia' },
  { key: 'la cevicheria', lat: 10.4262, lon: -75.5487, name: 'Restaurante La Cevicheria', city: 'Cartagena', country: 'Colombia' },
  { key: 'restaurante la cevicheria', lat: 10.4262, lon: -75.5487, name: 'Restaurante La Cevicheria', city: 'Cartagena', country: 'Colombia' },
  { key: 'celele', lat: 10.4206, lon: -75.5441, name: 'Restaurante Celele', city: 'Cartagena', country: 'Colombia' },
  { key: 'restaurante celele', lat: 10.4206, lon: -75.5441, name: 'Restaurante Celele', city: 'Cartagena', country: 'Colombia' },
  { key: 'el boliche', lat: 10.4278, lon: -75.5472, name: 'Restaurante El Boliche Cebichería', city: 'Cartagena', country: 'Colombia' },
  { key: 'restaurante el boliche', lat: 10.4278, lon: -75.5472, name: 'Restaurante El Boliche Cebichería', city: 'Cartagena', country: 'Colombia' },
  { key: 'la mulata', lat: 10.4247, lon: -75.5482, name: 'Restaurante La Mulata', city: 'Cartagena', country: 'Colombia' },
  { key: 'restaurante la mulata', lat: 10.4247, lon: -75.5482, name: 'Restaurante La Mulata', city: 'Cartagena', country: 'Colombia' },
  { key: 'hotel casa la fe', lat: 10.4258, lon: -75.5480, name: 'Hotel Casa La Fe', city: 'Cartagena', country: 'Colombia' },
  { key: 'hotel boutique casa isabel', lat: 10.4265, lon: -75.5395, name: 'Hotel Boutique Casa Isabel', city: 'Cartagena', country: 'Colombia' },
  { key: 'hotel san pedro de majagua', lat: 10.1755, lon: -75.7360, name: 'Hotel San Pedro de Majagua', city: 'Cartagena', country: 'Colombia' }
]

export async function geocodePlace(query, lat = null, lon = null) {
  if (!query || typeof query !== 'string') return null
  const normalizedQuery = normalizeGeocodeQuery(query)
  if (!normalizedQuery) return null

  const key = `geocode_${normalizedQuery.toLowerCase().trim()}_${lat ?? ''}_${lon ?? ''}`
  const cached = geocodeCache.get(key)
  if (cached) return cached

  // 0. High Precision Verified POIs lookup
  const qLower = normalizedQuery.toLowerCase()
  const verified = VERIFIED_HIGH_PRECISION_POIS.find(poi => qLower.includes(poi.key) || poi.key.includes(qLower))
  if (verified) {
    const res = {
      name: verified.name,
      latitude: verified.lat,
      longitude: verified.lon,
      city: verified.city,
      country: verified.country
    }
    geocodeCache.set(key, res)
    return res
  }

  // 1. Try global Photon search first (without lat/lon) to avoid local user GPS proximity
  // bias distorting major international city lookups (e.g. user in Colombia/Mexico searching "Nueva York").
  try {
    const globalResults = await photonSearch(normalizedQuery, 5, null, null)
    const photonGlobal = selectBestPoiResult(globalResults, query)
    if (photonGlobal && Number.isFinite(photonGlobal.latitude) && Number.isFinite(photonGlobal.longitude)) {
      const res = {
        name: photonGlobal.name,
        latitude: Number(photonGlobal.latitude),
        longitude: Number(photonGlobal.longitude),
        city: photonGlobal.city || '',
        country: photonGlobal.country || ''
      }
      geocodeCache.set(key, res)
      return res
    }
  } catch (err) {
    console.warn('[geocodePlace] Global Photon search failed:', err.message)
  }

  // 2. Try with lat/lon proximity bias if provided and global search returned nothing
  if (lat && lon) {
    try {
      const proxResults = await photonSearch(normalizedQuery, 5, lat, lon)
      const photonProx = selectBestPoiResult(proxResults, query)
      if (photonProx && Number.isFinite(photonProx.latitude) && Number.isFinite(photonProx.longitude)) {
        const res = {
          name: photonProx.name,
          latitude: Number(photonProx.latitude),
          longitude: Number(photonProx.longitude),
          city: photonProx.city || '',
          country: photonProx.country || ''
        }
        geocodeCache.set(key, res)
        return res
      }
    } catch (err) {
      console.warn('[geocodePlace] Proximity Photon search failed:', err.message)
    }
  }

  // 3. Fallback to Nominatim if Photon fails or returns no results
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '3')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', normalizedQuery)
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (response.ok) {
      const results = await response.json()
      const [result] = Array.isArray(results) ? results : []
      if (result) {
        const address = result.address || {}
        const city = address.city || address.town || address.village || address.municipality || address.county || ''
        const country = address.country || ''
        const res = {
          name: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          city,
          country
        }
        geocodeCache.set(key, res)
        return res
      }
    }
  } catch (err) {
    console.warn('[geocodePlace] Nominatim search failed:', err.message)
  }

  return null
}

export async function photonSearch(query, limit = 8, lat = null, lon = null) {
  if (!query) return []
  const key = `photon_${query.toLowerCase().trim()}_${limit}_${lat ?? ''}_${lon ?? ''}`
  const cached = photonCache.get(key)
  if (cached) return cached

  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
  if (lat && lon) {
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
  }
  const response = await fetch(url)
  if (!response.ok) return []
  const json = await response.json()
  const results = (json.features ?? []).map((feature) => ({
    name: feature.properties.name ?? feature.properties.city ?? query,
    city: feature.properties.city,
    country: feature.properties.country,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    type: feature.properties.osm_value ?? feature.properties.type ?? 'place',
    tags: feature.properties
  }))
  if (results.length > 0) {
    photonCache.set(key, results)
  }
  return results
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const attractionsCache = new Map()
const CACHE_TTL_MS = 30 * 60 * 1000

async function fetchOverpassWithMirrors(query, timeoutMs = 3500) {
  for (const serverUrl of OVERPASS_SERVERS) {
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(timeoutMs)
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.warn(`[osm] Overpass mirror (${serverUrl}) timed out or failed:`, err.message)
    }
  }
  return null
}

export async function overpassAttractions(latitude, longitude, radius = 4500) {
  const effectiveRadius = Math.min(radius, 12000)
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${effectiveRadius}`
  const cached = attractionsCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  const query = `
    [out:json][timeout:10];
    (
      node(around:${effectiveRadius},${latitude},${longitude})["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
      node(around:${effectiveRadius},${latitude},${longitude})["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
      node(around:${effectiveRadius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
      node(around:${effectiveRadius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      node(around:${effectiveRadius},${latitude},${longitude})["natural"~"beach|water"];
      node(around:${effectiveRadius},${latitude},${longitude})["place"="island"];
      node(around:${effectiveRadius},${latitude},${longitude})["boundary"="national_park"];
      way(around:${effectiveRadius},${latitude},${longitude})["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
      way(around:${effectiveRadius},${latitude},${longitude})["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
      way(around:${effectiveRadius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
      way(around:${effectiveRadius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      way(around:${effectiveRadius},${latitude},${longitude})["natural"~"beach|water"];
      way(around:${effectiveRadius},${latitude},${longitude})["place"="island"];
      way(around:${effectiveRadius},${latitude},${longitude})["boundary"="national_park"];
      relation(around:${effectiveRadius},${latitude},${longitude})["place"="island"];
      relation(around:${effectiveRadius},${latitude},${longitude})["boundary"="national_park"];
    );
    out center tags 80;
  `
  try {
    const json = await fetchOverpassWithMirrors(query, 3500)
    let results = []
    if (json && json.elements) {
      results = json.elements
        .map((element) => {
          const lat = element.lat ?? element.center?.lat
          const lon = element.lon ?? element.center?.lon
          const name = element.tags?.name
          const type = element.tags?.tourism ?? element.tags?.historic ?? element.tags?.amenity ?? element.tags?.leisure ?? element.tags?.sport ?? element.tags?.natural ?? element.tags?.place ?? element.tags?.boundary ?? 'place'
          if (lat == null || lon == null || !name) return null
          if (isAccommodation(type) || isNonTouristFacility(element.tags)) return null
          return {
            name,
            latitude: lat,
            longitude: lon,
            type,
            category: classifyAttraction(element.tags),
            tags: element.tags
          }
        })
        .filter(Boolean)
        .slice(0, 60)
    }

    if (results.length === 0) {
      console.warn('[osm] overpassAttractions returned empty or timed out, using Photon fallback...')
      const photonItems = await photonSearch('turismo', 15, latitude, longitude)
      results = photonItems.map((item) => ({
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type ?? 'attraction',
        category: 'attraction',
        tags: {}
      }))
    }

    if (results.length > 0) {
      attractionsCache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL_MS })
    }

    return results
  } catch (error) {
    console.error('[osm] overpassAttractions error:', error.message)
    return []
  }
}

export async function overpassNearbyCities(latitude, longitude, radius = 100000) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["place"~"city|town"]["wikipedia"];
    );
    out center tags 15;
  `
  try {
    const json = await fetchOverpassWithMirrors(query, 3500)
    if (!json) return []
    return (json.elements ?? [])
      .map((element) => {
        const name = element.tags?.name
        if (!name) return null
        return {
          name,
          latitude: element.lat,
          longitude: element.lon
        }
      })
      .filter(Boolean)
  } catch (error) {
    console.error('[osm] overpassNearbyCities error:', error.message)
    return []
  }
}

function classifyAttraction(tags = {}) {
  const tourism = String(tags.tourism ?? '').toLowerCase()
  const historic = String(tags.historic ?? '').toLowerCase()
  const amenity = String(tags.amenity ?? '').toLowerCase()
  const leisure = String(tags.leisure ?? '').toLowerCase()
  const natural = String(tags.natural ?? '').toLowerCase()
  const sport = String(tags.sport ?? '').toLowerCase()
  const place = String(tags.place ?? '').toLowerCase()
  const boundary = String(tags.boundary ?? '').toLowerCase()

  if (['museum', 'gallery', 'arts_centre'].includes(amenity) || tourism === 'museum') return 'museum'
  if (['monument', 'memorial', 'ruins', 'castle', 'archaeological_site'].includes(historic)) return 'historic'
  if (['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].includes(tourism)) return tourism
  if (amenity === 'marketplace') return 'market'
  if (['sports_centre', 'stadium', 'pitch', 'track', 'fitness_centre'].includes(leisure) || sport) return 'sports'
  if (
    ['park', 'garden', 'nature_reserve', 'forest'].includes(leisure) || 
    ['tree', 'wood', 'grassland', 'beach', 'water'].includes(natural) ||
    place === 'island' ||
    boundary === 'national_park'
  ) return 'nature'
  if (['restaurant', 'cafe', 'food_court', 'pub', 'bar', 'nightclub'].includes(amenity)) return amenity
  if (['cathedral', 'church', 'temple', 'mosque'].includes(historic)) return 'religious'
  return tourism || historic || amenity || leisure || natural || place || boundary || 'place'
}

function isAccommodation(type) {
  return [
    'hotel',
    'hostel',
    'guest_house',
    'apartment',
    'motel',
    'camp_site',
    'caravan_site',
    'chalet'
  ].includes(type)
}

function isNonTouristFacility(tags = {}) {
  if (!tags) return false
  if (tags.office || tags.industrial) return true

  const name = String(tags.name ?? '').toLowerCase()
  if (
    name.includes('aguas de') ||
    name.includes('acueducto') ||
    name.includes('alcantarillado') ||
    name.includes('servicios publicos') ||
    name.includes('s.a. e.s.p.') ||
    name.includes('secretaria de') ||
    name.includes('notaria') ||
    name.includes('camara de comercio') ||
    name.includes('tránsito') ||
    name.includes('subestacion') ||
    name.includes('gas natural')
  ) {
    return true
  }

  const landuse = String(tags.landuse ?? '').toLowerCase()
  if (['industrial', 'residential', 'commercial', 'construction', 'quarry'].includes(landuse)) {
    return true
  }

  const amenity = String(tags.amenity ?? '').toLowerCase()
  if ([
    'university', 'school', 'college', 'kindergarten',
    'bank', 'atm', 'pharmacy', 'dentist', 'doctors', 'hospital', 'clinic',
    'police', 'post_office', 'townhall', 'courthouse', 'embassy',
    'fuel', 'car_wash', 'parking', 'bus_station', 'utility', 'waste_disposal'
  ].includes(amenity)) {
    return true
  }
  const building = String(tags.building ?? '').toLowerCase()
  if (['office', 'industrial', 'commercial', 'residential', 'warehouse'].includes(building)) return true
  return false
}

export async function overpassHotels(latitude, longitude, budget = 'moderate', radius = 4500) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["tourism"~"hotel|hostel"];
      way(around:${radius},${latitude},${longitude})["tourism"~"hotel|hostel"];
    );
    out center tags 25;
  `
  try {
    const json = await fetchOverpassWithMirrors(query, 3500)
    if (json) {
      const elements = (json.elements ?? [])
        .map((element) => {
          const lat = element.lat ?? element.center?.lat
          const lon = element.lon ?? element.center?.lon
          const name = element.tags?.name
          if (lat == null || lon == null || !name) return null
          
          let stars = element.tags?.stars
          if (!stars) {
            if (budget === 'economic') {
              stars = '3'
            } else if (budget === 'luxury') {
              stars = '5'
            } else {
              stars = '4'
            }
          }

          return {
            id: element.id,
            name,
            latitude: lat,
            longitude: lon,
            stars,
            type: 'hotel',
            tags: element.tags
          }
        })
        .filter(Boolean)
      
      if (elements.length > 0) return elements
    }
  } catch (error) {
    console.warn('[osm] overpassHotels query failed or timed out, falling back to Photon search:', error.message)
  }

  return photonHotelsFallback(latitude, longitude, budget)
}

/**
 * Search for nearby food/restaurant places via Overpass API.
 * Used by the voice route assistant for the SEARCH_RESTAURANTS action.
 */
export async function overpassNearbyFood(latitude, longitude, radius = 1000) {
  const query = `
    [out:json][timeout:15];
    (
      node(around:${radius},${latitude},${longitude})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];
      way(around:${radius},${latitude},${longitude})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];
    );
    out center tags 20;
  `
  try {
    const json = await fetchOverpassWithMirrors(query, 3000)
    if (json) {
      return (json.elements ?? [])
        .map((element) => {
          const lat = element.lat ?? element.center?.lat
          const lon = element.lon ?? element.center?.lon
          const name = element.tags?.name
          if (lat == null || lon == null || !name) return null
          return {
            id: element.id,
            name,
            latitude: lat,
            longitude: lon,
            type: element.tags?.amenity ?? 'restaurant',
            cuisine: element.tags?.cuisine ?? null,
            address: element.tags?.['addr:street'] ?? null,
            tags: element.tags
          }
        })
        .filter(Boolean)
        .slice(0, 10)
    }
  } catch (error) {
    console.warn('[osm] overpassNearbyFood query failed:', error.message)
  }
  return []
}

async function photonHotelsFallback(latitude, longitude, budget) {
  try {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', 'hotel')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('limit', '10')
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return []
    const json = await response.json()
    return (json.features ?? [])
      .map((feature) => {
        const name = feature.properties.name
        const lat = feature.geometry.coordinates[1]
        const lon = feature.geometry.coordinates[0]
        if (!name || lat == null || lon == null) return null
        
        let stars = feature.properties.stars
        if (!stars) {
          if (budget === 'economic') {
            stars = '3'
          } else if (budget === 'luxury') {
            stars = '5'
          } else {
            stars = '4'
          }
        }
        
        return {
          id: feature.properties.osm_id ? String(feature.properties.osm_id) : `photon-${Math.random().toString(36).slice(2, 9)}`,
          name,
          latitude: lat,
          longitude: lon,
          stars: String(stars),
          type: 'hotel',
          tags: feature.properties
        }
      })
      .filter(Boolean)
  } catch (err) {
    console.warn('[osm] photonHotelsFallback error:', err.message)
    return []
  }
}

