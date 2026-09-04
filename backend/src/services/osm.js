import { GeoCache } from './geoCache.js'
import { cleanAdministrativeCityName, formatCountryName } from './destinationService.js'

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
        const country = formatCountryName(data.address.country, data.address.country_code)
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
        city = cleanAdministrativeCityName(city)
        const countryRaw = data.address.country || ''
        const country = formatCountryName(countryRaw, data.address.country_code)
        const res = {
          city,
          country,
          name: city ? (country ? `${city}, ${country}` : city) : cleanAdministrativeCityName(data.display_name)
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
  const isFoodQuery = /\b(restaurante|restaurant|bistro|caf[ée]|bar|gastrobar|asador|pizzer[íi]a|taquer[íi]a|pub|cervecer[íi]a|saz[oó]n|comida|helader[íi]a|tropez[oó]n|celler|corralito|cueva|marea|p[ée]rgola|troja)\b/i.test(lowerQuery)
  const isViewpointQuery = /\b(mirador|viewpoint|lookout|belvedere|observatorio)\b/i.test(lowerQuery)

  let candidates = [...results]

  if (isFoodQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isInstitutionalOrSchool = ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic', 'pharmacy', 'cemetery', 'grave_yard', 'bus_stop', 'station', 'subway', 'railway', 'platform', 'highway', 'parking'].includes(type) ||
        ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic', 'cemetery'].includes(key) ||
        /\b(colegio|escuela|instituto|liceo|universidad|hospital|cl[íi]nica|cementerio|parroquia|parada de bus)\b/i.test(name)
      return !isInstitutionalOrSchool
    })
  } else if (!isExplicitTransitQuery && candidates.length > 1) {
    const nonTransitMatch = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || '').toLowerCase()
      const isTransit = ['bus_stop', 'tram_stop', 'station', 'subway', 'railway', 'platform', 'highway'].includes(type) || key === 'highway'
      return !isTransit
    })
    if (nonTransitMatch.length > 0) {
      candidates = nonTransitMatch
    }
  }

  if (candidates.length === 0) return null

  if (isViewpointQuery && candidates.length > 1) {
    const directViewpointMatch = candidates.find(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      return type === 'viewpoint' || key === 'tourism' || name.includes('mirador') || name.includes('viewpoint')
    })
    if (directViewpointMatch) return directViewpointMatch
  }

  if (isFoodQuery && candidates.length > 1) {
    const directFoodMatch = candidates.find(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      return ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court', 'ice_cream', 'biergarten'].includes(type)
    })
    if (directFoodMatch) return directFoodMatch
  }

  return candidates[0]
}


export async function geocodePlace(query, lat = null, lon = null) {
  if (!query || typeof query !== 'string') return null
  const normalizedQuery = normalizeGeocodeQuery(query)
  if (!normalizedQuery) return null

  const key = `geocode_${normalizedQuery.toLowerCase().trim()}_${lat ?? ''}_${lon ?? ''}`
  const cached = geocodeCache.get(key)
  if (cached) return cached

  const normLower = normalizedQuery.toLowerCase().trim()
  const rawClean = String(query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const KNOWN_ICONIC_LANDMARKS = {
    'islas del rosario': { name: 'Islas del Rosario, Cartagena', latitude: 10.1772, longitude: -75.7428, city: 'Cartagena', country: 'Colombia' },
    'castillo san felipe de barajas': { name: 'Castillo San Felipe de Barajas', latitude: 10.4237, longitude: -75.5398, city: 'Cartagena', country: 'Colombia' },
    'castillo san felipe': { name: 'Castillo San Felipe de Barajas', latitude: 10.4237, longitude: -75.5398, city: 'Cartagena', country: 'Colombia' },
    'paseo en chiva': { name: 'Paseo en Chiva - Torre del Reloj, Centro Histórico', latitude: 10.4225, longitude: -75.5478, city: 'Cartagena', country: 'Colombia' },
    'cafe del mar': { name: 'Café del Mar, Baluarte de Santo Domingo', latitude: 10.4215, longitude: -75.5539, city: 'Cartagena', country: 'Colombia' },
    'isla mucura': { name: 'Isla Múcura, Archipiélago de San Bernardo', latitude: 9.7820, longitude: -75.8305, city: 'Coveñas', country: 'Colombia' },
    'isla tintipan': { name: 'Isla Tintipán, Archipiélago de San Bernardo', latitude: 9.7950, longitude: -75.8450, city: 'Coveñas', country: 'Colombia' },
    'santa cruz del islote': { name: 'Santa Cruz del Islote, Archipiélago de San Bernardo', latitude: 9.7853, longitude: -75.8572, city: 'Coveñas', country: 'Colombia' },
    'isla palma': { name: 'Isla Palma, Archipiélago de San Bernardo', latitude: 9.7420, longitude: -75.6490, city: 'Coveñas', country: 'Colombia' },
    'cienaga de la caimanera': { name: 'Ciénaga de la Caimanera, Coveñas', latitude: 9.4580, longitude: -75.6200, city: 'Coveñas', country: 'Colombia' },
    'parque museo infanteria de marina': { name: 'Parque Museo de la Infantería de Marina, Coveñas', latitude: 9.4080, longitude: -75.6880, city: 'Coveñas', country: 'Colombia' },
    'isla fuerte': { name: 'Isla Fuerte, Bolívar / Córdoba', latitude: 9.3870, longitude: -76.1770, city: 'Coveñas', country: 'Colombia' }
  }

  if (KNOWN_ICONIC_LANDMARKS[normLower] || KNOWN_ICONIC_LANDMARKS[rawClean]) {
    const res = KNOWN_ICONIC_LANDMARKS[normLower] || KNOWN_ICONIC_LANDMARKS[rawClean]
    geocodeCache.set(key, res)
    return res
  }

  // 1. If lat and lon are provided, perform proximity search FIRST to bind results directly to the destination area
  if (lat && lon) {
    try {
      const proxResults = await photonSearch(normalizedQuery, 8, lat, lon)
      const photonProx = selectBestPoiResult(proxResults, query)
      if (photonProx && Number.isFinite(photonProx.latitude) && Number.isFinite(photonProx.longitude)) {
        const dMeters = haversineMeters(lat, lon, photonProx.latitude, photonProx.longitude)
        if (dMeters <= 75000) {
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
      }
    } catch (err) {
      console.warn('[geocodePlace] Proximity Photon search failed:', err.message)
    }
  }

  // 2. Global Photon search
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

  // 3. Fallback to Nominatim if Photon fails or returns no results
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '3')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', normalizedQuery)
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(1500)
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

  // 4. Dynamic OpenAI geocode fallback if OSM providers fail
  if (process.env.OPENAI_API_KEY) {
    try {
      const { geocodePlacesWithOpenAI } = await import('./openai.js')
      const aiResults = await geocodePlacesWithOpenAI({
        places: [query],
        centerLat: lat,
        centerLon: lon
      })
      const foundAi = aiResults?.[query] || Object.values(aiResults || {})[0]
      if (foundAi && Number.isFinite(foundAi.latitude) && Number.isFinite(foundAi.longitude)) {
        const res = {
          name: query,
          latitude: Number(foundAi.latitude),
          longitude: Number(foundAi.longitude),
          city: '',
          country: ''
        }
        geocodeCache.set(key, res)
        return res
      }
    } catch (_) {}
  }

  return null
}

let photonCircuitOpenUntil = 0

export function isPhotonCircuitOpen() {
  return Date.now() < photonCircuitOpenUntil
}

export function tripPhotonCircuit(durationMs = (process.env.NODE_ENV === 'test' ? 2000 : 15000)) {
  photonCircuitOpenUntil = Date.now() + durationMs
  console.warn(`[osm] Photon circuit breaker tripped for ${durationMs / 1000}s`)
}

export async function photonSearch(query, limit = 8, lat = null, lon = null) {
  if (!query || isPhotonCircuitOpen()) return []
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
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        tripPhotonCircuit(process.env.NODE_ENV === 'test' ? 2000 : 15000)
      }
      return []
    }
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
  } catch (err) {
    tripPhotonCircuit(process.env.NODE_ENV === 'test' ? 2000 : 15000)
    return []
  }
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const attractionsCache = new Map()
const CACHE_TTL_MS = 30 * 60 * 1000

async function fetchOverpassWithMirrors(query, timeoutMs = 1200) {
  const fetchPromises = OVERPASS_SERVERS.map(async (serverUrl) => {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(timeoutMs)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${serverUrl}`)
    return await response.json()
  })

  try {
    return await Promise.any(fetchPromises)
  } catch {
    return null
  }
}

export async function overpassAttractions(latitude, longitude, radius = 8000) {
  const effectiveRadius = Math.min(Math.max(radius, 8000), 52000)
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
      node(around:${effectiveRadius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre|ferry_terminal"];
      node(around:${effectiveRadius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      node(around:${effectiveRadius},${latitude},${longitude})["natural"~"beach|water"];
      node(around:${effectiveRadius},${latitude},${longitude})["place"~"island|islet"];
      node(around:${effectiveRadius},${latitude},${longitude})["boundary"="national_park"];
      way(around:${effectiveRadius},${latitude},${longitude})["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
      way(around:${effectiveRadius},${latitude},${longitude})["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
      way(around:${effectiveRadius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre|ferry_terminal"];
      way(around:${effectiveRadius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      way(around:${effectiveRadius},${latitude},${longitude})["natural"~"beach|water"];
      way(around:${effectiveRadius},${latitude},${longitude})["place"~"island|islet"];
      way(around:${effectiveRadius},${latitude},${longitude})["boundary"="national_park"];
      relation(around:${effectiveRadius},${latitude},${longitude})["place"~"island|islet"];
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
      console.warn('[osm] overpassAttractions returned empty or timed out, using multi-category Photon fallback...')
      const [generalTourism, museums, parks] = await Promise.all([
        photonSearch('turismo', 8, latitude, longitude).catch(() => []),
        photonSearch('museo', 6, latitude, longitude).catch(() => []),
        photonSearch('parque', 6, latitude, longitude).catch(() => [])
      ])
      const combined = [
        ...generalTourism,
        ...museums,
        ...parks
      ]
      const seen = new Set()
      results = []
      for (const item of combined) {
        if (!item || !item.name || isNonTouristFacility(item.tags) || isNonTouristFacility({ name: item.name })) continue
        const k = item.name.toLowerCase().trim()
        if (!seen.has(k)) {
          seen.add(k)
          results.push({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            type: item.type ?? 'attraction',
            category: 'attraction',
            tags: item.tags || {}
          })
        }
      }
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

export function isNonTouristFacility(tags = {}) {
  if (!tags) return false
  if (tags.office || tags.industrial || tags.shop || tags.craft) return true
  if (tags.man_made === 'pipeline' || tags.pipeline || tags.man_made === 'storage_tank' || tags.man_made === 'works') return true

  const name = String(tags.name ?? '').toLowerCase()
  if (
    /\b(oleoducto|gasoducto|poliducto|refiner[íi]a|tuber[íi]a|estaci[oó]n de bombeo|planta de tratamiento|patio de tanques|cenit|ecopetrol)\b/i.test(name) ||
    /\b(supermercado|tienda|droguer[íi]a|farmacia|ferreter[íi]a|almac[ée]n|panader[íi]a|carnicer[íi]a|minimarket|estanco|miscel[aá]nea|bodega|dep[oó]sito)\b/i.test(name) ||
    /\b(association|asociaci[oó]n|fundaci[oó]n|cooperativa|corporaci[oó]n|sindicato|gremio|oficina)\b/i.test(name) ||
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
    name.includes('gas natural') ||
    name.includes('cementerio') ||
    name.includes('camposanto') ||
    name.includes('jardines de paz') ||
    name.includes('funeraria') ||
    name.includes('canal santa marta') ||
    name.includes('ciénaga grande') ||
    name.includes('cienaga grande') ||
    name.includes('drenaje') ||
    name.includes('acequia')
  ) {
    return true
  }

  const landuse = String(tags.landuse ?? '').toLowerCase()
  if (['industrial', 'residential', 'commercial', 'construction', 'quarry', 'cemetery', 'retail'].includes(landuse)) {
    return true
  }

  const amenity = String(tags.amenity ?? '').toLowerCase()
  if ([
    'university', 'school', 'college', 'kindergarten',
    'bank', 'atm', 'pharmacy', 'dentist', 'doctors', 'hospital', 'clinic',
    'police', 'post_office', 'townhall', 'courthouse', 'embassy',
    'fuel', 'car_wash', 'parking', 'bus_station', 'utility', 'waste_disposal',
    'grave_yard', 'crematorium', 'funeral_hall', 'mortuary'
  ].includes(amenity)) {
    return true
  }

  const waterway = String(tags.waterway ?? '').toLowerCase()
  if (['canal', 'drain', 'ditch', 'stream', 'waste_disposal'].includes(waterway)) {
    return true
  }

  const natural = String(tags.natural ?? '').toLowerCase()
  if (['water', 'wetland', 'bay', 'shoal'].includes(natural) && tags.tourism !== 'attraction' && tags.leisure !== 'beach_resort' && tags.natural !== 'beach') {
    return true
  }

  const building = String(tags.building ?? '').toLowerCase()
  if (['office', 'industrial', 'commercial', 'residential', 'warehouse'].includes(building)) return true
  return false
}

export function isValidHotelCandidate(name, tags = {}) {
  if (!name || typeof name !== 'string') return false
  const clean = name.trim()
  if (clean.length < 4) return false
  const lower = clean.toLowerCase()
  if (/^(hotel|hostel|resort|posada|cabaña|cabañas|alojamiento|motel)$/i.test(lower)) return false
  if (/abandonado|abandoned|cerrado|closed|demolido|ruinas|disused|antiguo|ex\s*hotel|antiguo\s*hotel|en\s*desuso|fuera\s*de\s*servicio/i.test(lower)) return false
  if (tags.abandoned === 'yes' || tags.disused === 'yes' || tags.historic === 'ruins' || tags.status === 'abandoned') return false
  return true
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
          if (lat == null || lon == null || !name || !isValidHotelCandidate(name, element.tags)) return null
          
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
    const json = await fetchOverpassWithMirrors(query, 1500)
    if (json && json.elements && json.elements.length > 0) {
      const results = (json.elements ?? [])
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
      if (results.length > 0) return results
    }
  } catch (error) {
    console.warn('[osm] overpassNearbyFood query failed:', error.message)
  }
  return photonFoodFallback(latitude, longitude)
}

export async function photonFoodFallback(latitude, longitude) {
  try {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', 'restaurant')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('limit', '12')
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return []
    const json = await response.json()
    return (json.features ?? [])
      .map((feature) => {
        const name = feature.properties.name
        const lat = feature.geometry.coordinates[1]
        const lon = feature.geometry.coordinates[0]
        if (!name || lat == null || lon == null) return null
        return {
          id: feature.properties.osm_id ? String(feature.properties.osm_id) : `photon-food-${Math.random().toString(36).slice(2, 9)}`,
          name,
          latitude: lat,
          longitude: lon,
          type: 'restaurant',
          cuisine: feature.properties.cuisine || null,
          tags: feature.properties
        }
      })
      .filter(Boolean)
  } catch (err) {
    console.warn('[osm] photonFoodFallback error:', err.message)
    return []
  }
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
        if (!name || lat == null || lon == null || !isValidHotelCandidate(name, feature.properties)) return null
        
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

export function haversineMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

