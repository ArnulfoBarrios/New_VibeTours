import { GeoCache } from './geoCache.js'

const canonicalCache = new GeoCache(24 * 60 * 60 * 1000, 500)
const USER_AGENT = 'VIBETOURS/1.0 contact=ops@vibetours.app'

const COUNTRY_NAME_MAP = {
  'united states': 'Estados Unidos',
  'united kingdom': 'Reino Unido',
  'spain': 'España',
  'france': 'Francia',
  'germany': 'Alemania',
  'italy': 'Italia',
  'japan': 'Japón',
  'brazil': 'Brasil',
  'peru': 'Perú',
  'mexico': 'México',
  'colombia': 'Colombia',
  'costa rica': 'Costa Rica',
  'philippines': 'Filipinas',
  'canada': 'Canadá',
  'argentina': 'Argentina',
  'chile': 'Chile'
}

const COUNTRY_CODE_MAP = {
  'us': 'US',
  'usa': 'US',
  'es': 'ES',
  'co': 'CO',
  'cr': 'CR',
  'ph': 'PH',
  'mx': 'MX',
  'fr': 'FR',
  'it': 'IT',
  'uk': 'GB',
  'gb': 'GB',
  'de': 'DE',
  'jp': 'JP',
  'br': 'BR',
  'pe': 'PE',
  'ar': 'AR',
  'cl': 'CL',
  'ca': 'CA'
}

export function formatCountryName(countryRaw, countryCodeRaw = '') {
  if (!countryRaw && !countryCodeRaw) return ''
  const code = (countryCodeRaw || '').trim().toUpperCase()
  const lower = (countryRaw || '').trim().toLowerCase()

  if (COUNTRY_NAME_MAP[lower]) return COUNTRY_NAME_MAP[lower]
  if (code === 'US') return 'Estados Unidos'
  if (code === 'ES') return 'España'
  if (code === 'GB' || code === 'UK') return 'Reino Unido'
  if (code === 'CO') return 'Colombia'
  if (code === 'CR') return 'Costa Rica'
  if (code === 'PH') return 'Filipinas'
  if (code === 'MX') return 'México'
  if (code === 'FR') return 'Francia'
  if (code === 'IT') return 'Italia'
  if (code === 'DE') return 'Alemania'
  if (code === 'JP') return 'Japón'

  return countryRaw ? countryRaw.trim() : code
}

export function formatCountryCode(countryCodeRaw, countryRaw = '') {
  if (countryCodeRaw) return countryCodeRaw.trim().toUpperCase()
  const lower = (countryRaw || '').trim().toLowerCase()
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (lower === key) return code
  }
  return ''
}

export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return Infinity
  }
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function cleanAdministrativeCityName(rawName = '') {
  if (!rawName || typeof rawName !== 'string') return ''
  let cleaned = rawName.trim()

  cleaned = cleaned.replace(/^(per[íi]metro\s+urbano\s+(de\s+)?)/i, '')
  cleaned = cleaned.replace(/^(distrito\s+tur[íi]stico(?:[,\s]+cultural\s+e\s+hist[óo]rico)?\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(distrito\s+especial[,\s]+industrial\s+y\s+portuario\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(distrito\s+capital\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(distrito\s+especial\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(municipio\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(comuna\s+\d+\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(ciudad\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(área\s+metropolitana\s+de\s+)/i, '')
  cleaned = cleaned.replace(/^(area\s+metropolitana\s+de\s+)/i, '')
  cleaned = cleaned.replace(/,\s*(distrito\s+capital|d\.?\s*c\.?|per[íi]metro\s+urbano)$/i, '')
  cleaned = cleaned.replace(/\s+de\s+indias$/i, '')

  return cleaned.trim()
}

export async function resolveCanonicalDestination(query, options = {}) {
  if (!query || typeof query !== 'string') return null
  let cleaned = query.trim().replace(/^(destino|lugar|ciudad|ubicaci[oó]n|location|destination|pais|pa[íi]s)\s*:\s*/i, '').trim()
  cleaned = cleanAdministrativeCityName(cleaned)
  if (!cleaned) return null

  const cacheKey = `canonical_${cleaned.toLowerCase()}`
  const cached = canonicalCache.get(cacheKey)
  if (cached) return cached

  // Normalize query for Nominatim
  let normalizedQuery = cleaned
    .replace(/\b(ee\s*uu|eeuu|usa|us|estados\s+unidos)\b/gi, 'United States')
    .replace(/\b(españa|espana)\b/gi, 'Spain')
    .replace(/\b(reino\s+unido|uk)\b/gi, 'United Kingdom')

  if (/^cartagena$/i.test(normalizedQuery.trim()) || /^cartagena de indias$/i.test(normalizedQuery.trim())) {
    normalizedQuery = 'Cartagena, Colombia'
  } else if (/\btayrona\b/i.test(normalizedQuery) && !/parque nacional natural/i.test(normalizedQuery)) {
    normalizedQuery = 'Parque Nacional Natural Tayrona, Colombia'
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', normalizedQuery)

  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      const rawResults = await response.json()
      if (Array.isArray(rawResults) && rawResults.length > 0) {
        // Discard commercial shops/malls, highways/services, and parking lots when searching for tourist destinations
        const validResults = rawResults.filter(item => {
          if (item.category === 'shop' || item.type === 'mall') return false
          if (item.category === 'highway' && item.type === 'service') return false
          if (item.category === 'amenity' && (item.type === 'parking' || item.type === 'fuel')) return false
          return true
        })
        const results = validResults.length > 0 ? validResults : rawResults

        const candidateObjects = results.map(item => {
          const address = item.address || {}
          let rawCity = address.city || address.town || address.village || address.municipality || address.county || address.state_district || ''
          const city = cleanAdministrativeCityName(rawCity) || cleanAdministrativeCityName(cleaned)
          const region = address.state || address.region || address.county || ''
          const countryRaw = address.country || ''
          const countryCode = (address.country_code || '').toUpperCase()
          const country = formatCountryName(countryRaw, countryCode)
          const lat = Number(item.lat)
          const lon = Number(item.lon)

          // Format clean displayName e.g. "Parque Nacional Natural Tayrona, Santa Marta, Colombia" or "Santa Marta, Magdalena, Colombia"
          const entity = item.name ? cleanAdministrativeCityName(item.name.split(',')[0]) : ''
          const isEntityDifferentFromCity = Boolean(entity && city && entity.toLowerCase() !== city.toLowerCase())
          const isMicro = Boolean(
            item.category === 'boundary' && item.type === 'national_park' ||
            item.category === 'leisure' && (item.type === 'nature_reserve' || item.type === 'park') ||
            isEntityDifferentFromCity ||
            /\b(parque|reserva|isla|islas|playa|valle|cayo|archipi[ée]lago|embalse|lago|laguna|cañ[oó]n|sierra|nevado)\b/i.test(cleaned) ||
            /\b(parque|reserva|isla|islas|playa|valle|cayo|archipi[ée]lago|embalse|lago|laguna|cañ[oó]n|sierra|nevado)\b/i.test(entity)
          )
          const firstPart = isEntityDifferentFromCity ? `${entity}, ${city}` : (city || entity || cleaned)
          const displayParts = [firstPart, (region && region !== city && !firstPart.includes(region)) ? region : '', country].filter(Boolean)
          const displayName = displayParts.join(', ')

          return {
            displayName,
            city: city || cleaned,
            entityName: isMicro ? (entity || cleaned) : (entity || city || cleaned),
            isMicroDestination: isMicro,
            region,
            country,
            countryCode,
            latitude: lat,
            longitude: lon,
            placeId: String(item.place_id || item.osm_id || `${lat}_${lon}`),
            rawName: item.name || item.display_name,
            category: item.category,
            type: item.type
          }
        }).filter(c => (c.city || c.entityName) && Number.isFinite(c.latitude) && Number.isFinite(c.longitude))

        if (candidateObjects.length > 0) {
          let primary = candidateObjects[0]
          // Prioritize national park or protected area if searching for a park
          const parkMatch = candidateObjects.find(c => c.category === 'boundary' && (c.type === 'national_park' || c.type === 'protected_area'))
          if (parkMatch && /\b(parque|reserva|natural)\b/i.test(cleaned)) {
            primary = parkMatch
          }
          if (/^cartagena$/i.test(cleaned) && !/españa|spain|murcia/i.test(cleaned)) {
            const colMatch = candidateObjects.find(c => c.countryCode === 'CO' || c.country === 'Colombia')
            if (colMatch) primary = colMatch
          }

          // Check for ambiguity across candidates with distinct countries/regions
          const distinctDestinations = []
          for (const cand of candidateObjects) {
            const exists = distinctDestinations.some(d => 
              d.countryCode === cand.countryCode && d.region === cand.region && d.city.toLowerCase() === cand.city.toLowerCase()
            )
            if (!exists) {
              distinctDestinations.push(cand)
            }
          }

          const isAmbiguous = distinctDestinations.length > 1 && 
            !cleaned.toLowerCase().includes(primary.region.toLowerCase()) && 
            !cleaned.toLowerCase().includes(primary.country.toLowerCase())

          const result = {
            displayName: primary.displayName,
            city: primary.city,
            entityName: primary.entityName,
            isMicroDestination: Boolean(primary.isMicroDestination),
            region: primary.region,
            country: primary.country,
            countryCode: primary.countryCode,
            latitude: primary.latitude,
            longitude: primary.longitude,
            placeId: primary.placeId,
            isAmbiguous,
            candidates: isAmbiguous ? distinctDestinations : []
          }

          canonicalCache.set(cacheKey, result)
          return result
        }
      }
    }
  } catch (err) {
    console.warn('[destinationService] Nominatim resolution failed:', err.message)
  }

  // Fallback to Photon if Nominatim fails or returns nothing
  try {
    const photonUrl = new URL('https://photon.komoot.io/api/')
    photonUrl.searchParams.set('q', normalizedQuery)
    photonUrl.searchParams.set('limit', '5')
    const photonRes = await fetch(photonUrl, { signal: AbortSignal.timeout(4000) })
    if (photonRes.ok) {
      const pJson = await photonRes.json()
      const feat = pJson.features?.[0]
      if (feat && feat.geometry?.coordinates) {
        const props = feat.properties || {}
        let rawCity = props.city || props.town || props.village || props.municipality || props.county || ''
        if (!rawCity && (props.type === 'city' || props.osm_value === 'city')) rawCity = props.name
        const city = cleanAdministrativeCityName(rawCity) || cleanAdministrativeCityName(cleaned)
        const countryCode = (props.countrycode || '').toUpperCase()
        const country = formatCountryName(props.country || '', countryCode)
        const result = {
          displayName: props.name ? `${props.name}, ${country}` : cleaned,
          city,
          entityName: props.name || city,
          isMicroDestination: false,
          region: props.state || '',
          country,
          countryCode,
          latitude: feat.geometry.coordinates[1],
          longitude: feat.geometry.coordinates[0],
          placeId: props.osm_id,
          isAmbiguous: false,
          candidates: []
        }
        canonicalCache.set(cacheKey, result)
        return result
      }
    }
  } catch (err) {
    console.warn('[destinationService] Photon fallback failed:', err.message)
  }

  // Fallback to OpenAI if both OSM providers fail
  if (process.env.OPENAI_API_KEY) {
    try {
      const { geocodePlacesWithOpenAI } = await import('./openai.js')
      const aiResults = await geocodePlacesWithOpenAI({ places: [cleaned] })
      const aiPlace = aiResults?.[cleaned] || Object.values(aiResults || {})[0]
      if (aiPlace && Number.isFinite(aiPlace.latitude) && Number.isFinite(aiPlace.longitude)) {
        const addr = String(aiPlace.address || '')
        let city = cleanAdministrativeCityName(cleaned)
        if (/\bmalibu\b/i.test(cleaned) || /\bmalibu\b/i.test(addr)) city = 'Malibu'
        else if (/\bcartagena\b/i.test(cleaned) || /\bcartagena\b/i.test(addr)) city = 'Cartagena'
        else if (/\bbarranquilla\b/i.test(cleaned) || /\bbarranquilla\b/i.test(addr)) city = 'Barranquilla'
        else if (/\bsanta marta\b/i.test(cleaned) || /\bsanta marta\b/i.test(addr)) city = 'Santa Marta'
        else if (/\bmedell[ií]n\b/i.test(cleaned) || /\bmedell[ií]n\b/i.test(addr)) city = 'Medellín'
        else if (/\bbogot[aá]\b/i.test(cleaned) || /\bbogot[aá]\b/i.test(addr)) city = 'Bogotá'
        else if (addr.includes(',')) {
          const parts = addr.split(',').map(s => s.trim())
          city = cleanAdministrativeCityName(parts[parts.length - 2] || parts[0])
        }

        let country = ''
        let countryCode = ''
        if (/estados unidos|united states|\busa\b|\bca\b|\bcalifornia\b/i.test(addr) || /california|florida|new york/i.test(cleaned)) {
          country = 'Estados Unidos'
          countryCode = 'US'
        } else if (/colombia/i.test(addr) || /colombia/i.test(cleaned)) {
          country = 'Colombia'
          countryCode = 'CO'
        }

        const result = {
          displayName: `${cleaned}${city && !cleaned.includes(city) ? `, ${city}` : ''}${country ? `, ${country}` : ''}`,
          city,
          entityName: cleanAdministrativeCityName(cleaned),
          isMicroDestination: false,
          region: '',
          country,
          countryCode,
          latitude: Number(aiPlace.latitude),
          longitude: Number(aiPlace.longitude),
          placeId: `ai_${Date.now()}`,
          isAmbiguous: false,
          candidates: []
        }
        canonicalCache.set(cacheKey, result)
        return result
      }
    } catch (_) {}
  }

  return null
}

export function validateCandidateLocation(place, canonicalDest, maxDistanceKm = 35) {
  if (!place || !canonicalDest) return false

  const lat = Number(place.latitude ?? place.lat)
  const lon = Number(place.longitude ?? place.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    return false
  }

  // 1. If destination is a micro-destination (e.g. Parque Tayrona, Minca, Guatapé), use a strict radius (18 km) around the park/entity center
  const allowedRadius = canonicalDest.isMicroDestination ? 18 : maxDistanceKm

  // 2. Haversine distance check from canonical center
  const distKm = haversineDistanceKm(canonicalDest.latitude, canonicalDest.longitude, lat, lon)
  if (distKm > allowedRadius) {
    console.warn(`[validateCandidateLocation] Discarding "${place.name}" (${distKm.toFixed(1)} km > ${allowedRadius} km from ${canonicalDest.displayName})`)
    return false
  }

  // 2. Country mismatch check
  const placeCountryCode = formatCountryCode(place.countryCode || place.country_code, place.country)
  if (placeCountryCode && canonicalDest.countryCode) {
    if (placeCountryCode !== canonicalDest.countryCode) {
      console.warn(`[validateCandidateLocation] Discarding "${place.name}" country mismatch (${placeCountryCode} !== ${canonicalDest.countryCode})`)
      return false
    }
  }

  // 3. Reject known cross-country noise keywords if canonical country is not Costa Rica / Philippines
  const canonicalCountryLower = (canonicalDest.country || '').toLowerCase()
  if (!canonicalCountryLower.includes('costa rica')) {
    const forbidden = ['costa rica', 'puriscal', 'san josé, costa rica', 'alajuela', 'heredia', 'samar', 'philippines']
    const nameLower = (place.name || '').toLowerCase()
    const addrLower = (place.address || '').toLowerCase()
    for (const word of forbidden) {
      if (nameLower.includes(word) || addrLower.includes(word)) {
        console.warn(`[validateCandidateLocation] Discarding "${place.name}" containing forbidden keyword "${word}"`)
        return false
      }
    }
  }

  return true
}
