import { GeoCache } from './geoCache.js'
import { cleanAdministrativeCityName, formatCountryName, FALLBACK_DESTINATION_CENTROIDS } from './destinationService.js'

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

export function getDistinctSemanticTokens(str) {
  if (!str || typeof str !== 'string') return []
  const clean = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')

  const COMMON_STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a', 'en', 'para', 'por', 'con', 'sin', 'sobre', 'entre',
    'restaurante', 'restaurant', 'bistro', 'cafe', 'bar', 'gastrobar',
    'cebicheria', 'cevicheria', 'pizzeria', 'taqueria', 'panaderia', 'heladeria', 'marisqueria',
    'museo', 'museos', 'museum', 'parque', 'parques', 'plaza', 'plazas',
    'iglesia', 'iglesias', 'parroquia', 'parroquias', 'catedral', 'catedrales',
    'monumento', 'monumentos', 'monument', 'teatro', 'teatros', 'barrio', 'hotel', 'hoteles', 'hostal', 'hostales',
    'playa', 'playas', 'isla', 'islas', 'archipielago', 'cayo', 'cayos',
    'villa', 'villas', 'avenida', 'calle', 'carrera',
    'colombia', 'barranquilla', 'cartagena', 'santa', 'marta', 'bogota', 'medellin',
    'cali', 'covenas', 'puerto',
    'san', 'santo', 'santos', 'saint', 'nuestra', 'senora', 'senor', 'sagrado', 'sagrada', 'sagrados', 'ie'
  ])

  return clean
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !COMMON_STOP_WORDS.has(t))
}

export function isDistinctNameMatch(query, candidateName) {
  if (!query || !candidateName) return false
  const primaryQuery = query.split(',')[0].trim()
  const primaryCandidate = candidateName.split(',')[0].trim()

  const queryTokens = getDistinctSemanticTokens(primaryQuery || query)
  const candClean = primaryCandidate.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (queryTokens.length === 0) {
    const qClean = (primaryQuery || query).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    return candClean.includes(qClean) || qClean.includes(candClean)
  }

  const candTokens = getDistinctSemanticTokens(primaryCandidate)
  const stem = (w) => (w.length > 4 ? w.replace(/(os|as|es|[oae])$/i, '') : w)

  // Check if any distinct query token matches or is contained in a candidate token, or in the candidate primary name
  const hasTokenMatch = queryTokens.some(qt => {
    const sQt = stem(qt)
    if (candTokens.some(ct => {
      if (ct === qt || ct.includes(qt) || qt.includes(ct)) return true
      const sCt = stem(ct)
      return sCt === sQt || sCt.includes(sQt) || sQt.includes(sCt)
    })) return true
    if (candClean.includes(qt) || candClean.includes(sQt)) return true
    return false
  })

  return hasTokenMatch
}

export function selectBestPoiResult(results, originalQuery = '') {
  if (!Array.isArray(results) || results.length === 0) return null
  const lowerQuery = String(originalQuery || '').toLowerCase()
  const isExplicitTransitQuery = /\b(estaci[oó]n|bus|metro|subway|parada|transit|train|railway|stop)\b/i.test(lowerQuery)
  const isFoodQuery = /\b(restaurante|restaurant|bistro|caf[ée]|bar|gastrobar|asador|pizzer[íi]a|taquer[íi]a|pub|cervecer[íi]a|saz[oó]n|comida|helader[íi]a|tropez[oó]n|celler|corralito|cueva|marea|p[ée]rgola|troja|cebicher[íi]a|cevicher[íi]a|marisquer[íi]a|panader[íi]a)\b/i.test(lowerQuery)
  const isIslandQuery = /\b(isla|islas|archipi[ée]lago|cayo|cayos)\b/i.test(lowerQuery)
  const isViewpointQuery = /\b(mirador|viewpoint|lookout|belvedere|observatorio)\b/i.test(lowerQuery)
  const isExplicitFuelQuery = /\b(gasolinera|estaci[oó]n de servicio|combustible|terpel|texaco|esso|mobil|biomax|primax|petrol|fuel)\b/i.test(lowerQuery)
  const isMuseumQuery = /\b(museo|museum|galer[íi]a|museos)\b/i.test(lowerQuery)
  const isParkOrWaterfrontQuery = /\b(malec[oó]n|malecon|parque|plaza|parque natural|reserva)\b/i.test(lowerQuery)
  const isMonumentQuery = /\b(monumento|monument|escultura|estatua|ventana al mundo|aleta del tibur[oó]n|totem|obelisco)\b/i.test(lowerQuery)

  let candidates = [...results]

  if (!isExplicitFuelQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isFuel = type === 'fuel' || key === 'fuel' || /\beds\b|estaci[oó]n de servicio|gasolinera/i.test(name)
      return !isFuel
    })
  }

  // 1. Strict Distinct Name Matching Guard:
  // If originalQuery contains specific semantic tokens (e.g. "Romántico", "Cucayo", "Narcobollo"),
  // we MUST NOT accept a candidate that completely lacks that token (e.g. "Museo del Carnaval").
  if (originalQuery && candidates.length > 0) {
    const qTokens = getDistinctSemanticTokens(originalQuery)
    if (qTokens.length > 0) {
      const matched = candidates.filter(r => isDistinctNameMatch(originalQuery, r.name))
      if (matched.length > 0) {
        candidates = matched
      } else {
        // None of the candidates match the distinct name tokens.
        // Return null to avoid falsely pinning an unrelated landmark.
        return null
      }
    }
  }

  if (isIslandQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isNonIsland = ['boundary', 'highway', 'amenity'].includes(key) ||
        ['administrative', 'neighbourhood', 'suburb', 'residential', 'road', 'street', 'city', 'town', 'school', 'place_of_worship'].includes(type)
      const hasIslandWord = /\b(isla|islas|archipi[ée]lago|cayo|cayos)\b/i.test(name) || type === 'island' || type === 'islet' || (key === 'place' && (type === 'island' || type === 'islet'))
      if (isNonIsland && !hasIslandWord) return false
      return hasIslandWord || type === 'island' || type === 'islet'
    })
  }

  if (isMuseumQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isUnrelatedFacility = ['cinema', 'school', 'college', 'kindergarten', 'university', 'hospital', 'parking'].includes(type) ||
        ['school', 'college', 'university', 'cinema'].includes(key) ||
        /\b(sala de proyecciones|bebedero|laboratorio|facultad|campus|aula|auditorio de|cine colombia|cinemark|royal films)\b/i.test(name)
      if (isUnrelatedFacility) return false

      const hasMuseumSemantic = name.includes('museo') || name.includes('museum') || name.includes('galería') || name.includes('galeria') || type === 'museum' || key === 'tourism'
      return hasMuseumSemantic
    })
  }

  if (isMonumentQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isFuelOrTransit = type === 'fuel' || key === 'fuel' || type === 'bus_stop' || /\beds\b|gasolinera|estaci[oó]n de servicio/i.test(name)
      return !isFuelOrTransit
    })
  }

  if (isParkOrWaterfrontQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || '').toLowerCase()
      const isTransit = type === 'bus_stop' || key === 'highway'
      return !isTransit
    })
  }

  const isReligiousQuery = /\b(iglesia|catedral|bas[íi]lica|parroquia|santuario|templo|convento|ermita)\b/i.test(lowerQuery)
  const isExplicitSchoolQuery = /\b(colegio|escuela|universidad|instituto|ie\b|facultad|campus)\b/i.test(lowerQuery)

  if (isReligiousQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isEduOrMed = ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic', 'pharmacy', 'parking', 'fuel'].includes(type) ||
        ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic'].includes(key) ||
        /\b(colegio|escuela|instituto|ie\b|sede|lic[eé]o|universidad|hospital|cl[íi]nica)\b/i.test(name)
      return !isEduOrMed
    })
  }

  if (isFoodQuery) {
    candidates = candidates.filter(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const key = String(r.tags?.osm_key || r.class || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      const isInstitutionalOrSchool = ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic', 'pharmacy', 'cemetery', 'grave_yard', 'bus_stop', 'station', 'subway', 'railway', 'platform', 'highway', 'parking'].includes(type) ||
        ['school', 'college', 'kindergarten', 'university', 'hospital', 'clinic', 'cemetery'].includes(key) ||
        /\b(colegio|escuela|instituto|liceo|universidad|hospital|cl[íi]nica|cementerio|parroquia|parada de bus)\b/i.test(name)
      if (isInstitutionalOrSchool) return false

      const isNonFoodGeo = ['boundary', 'place', 'highway'].includes(key) ||
        ['administrative', 'neighbourhood', 'suburb', 'pedestrian', 'residential', 'road'].includes(type)
      if (isNonFoodGeo) return false

      return true
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

  if (isReligiousQuery && candidates.length > 1) {
    const directWorshipMatch = candidates.find(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const name = String(r.name || '').toLowerCase()
      return ['place_of_worship', 'church', 'cathedral', 'chapel'].includes(type) ||
        /\b(iglesia|catedral|bas[íi]lica|parroquia|santuario|templo|convento|ermita)\b/i.test(name)
    })
    if (directWorshipMatch) return directWorshipMatch
  }

  const isPierQuery = /\b(muelle|pier|embarcadero)\b/i.test(lowerQuery)
  if (isPierQuery && candidates.length > 1) {
    const directPierMatch = candidates.find(r => {
      const type = String(r.type || r.tags?.osm_value || '').toLowerCase()
      const manMade = String(r.tags?.man_made || '').toLowerCase()
      return type === 'pier' || manMade === 'pier'
    })
    if (directPierMatch) return directPierMatch
  }

  return candidates[0]
}

export function decomposeCompoundPlaceQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return []
  const rawCommaParts = rawQuery.split(',').map(s => s.trim()).filter(Boolean)
  const rawPlacePart = rawCommaParts[0] || ''
  const rawContext = rawCommaParts.slice(1).join(', ')

  const compoundSeparators = /[-—–:\/|]/
  const hasParen = /\(([^)]+)\)/
  const hasSaintSuffix = /\b(?:de\s+)?san(?:ta)?\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\b/i
  const isPierQuery = /^muelle\s+de\s+([^,]+)/i

  if (!compoundSeparators.test(rawPlacePart) && !hasParen.test(rawPlacePart) && !hasSaintSuffix.test(rawPlacePart) && !isPierQuery.test(rawPlacePart)) {
    return []
  }

  const segments = []
  if (compoundSeparators.test(rawPlacePart)) {
    const directSplit = rawPlacePart.split(/\s*[-—–:\/|]\s*/).map(s => s.replace(/[()]/g, '').trim()).filter(Boolean)
    segments.push(...directSplit)

    for (const s of directSplit) {
      const cult = s.match(/\b(museo\s+del\s+oro|quinta\s+de\s+san\s+pedro\s+alejandrino|casa\s+de\s+la\s+aduana|catedral\s+bas[íi]lica|castillo\s+san\s+felipe)\b/i)
      if (cult && cult[0] && cult[0].toLowerCase() !== s.toLowerCase()) {
        segments.push(cult[0].trim())
      }
    }
  }

  const parenMatch = rawPlacePart.match(/\(([^)]+)\)/)
  if (parenMatch && parenMatch[1]) {
    segments.push(parenMatch[1].trim())
  }

  const saintMatch = rawPlacePart.match(hasSaintSuffix)
  if (saintMatch) {
    const prefixMatch = rawPlacePart.match(/^(?:iglesia|parroquia|catedral|bas[íi]lica|santuario|templo|convento)\s+(?:de\s+)?/i)
    const prefix = prefixMatch ? prefixMatch[0] : ''
    segments.push(`${prefix}San ${saintMatch[1]}`.trim())
    segments.push(`San ${saintMatch[1]}`.trim())
  }

  const pierMatch = rawPlacePart.match(isPierQuery)
  if (pierMatch && pierMatch[1]) {
    segments.push(`Muelle ${pierMatch[1].trim()}`)
    segments.push(`Muelle turístico`)
  }

  const queries = []
  const uniqueSegs = [...new Set(segments.filter(s => s.length >= 3))]
  for (const seg of uniqueSegs) {
    if (rawContext) queries.push(`${seg}, ${rawContext}`)
    queries.push(seg)
  }
  return queries
}

export const KNOWN_ICONIC_LANDMARKS = {
  // Cartagena
  'islas del rosario': { name: 'Islas del Rosario, Cartagena', latitude: 10.1772, longitude: -75.7428, city: 'Cartagena', country: 'Colombia' },
  'castillo san felipe de barajas': { name: 'Castillo San Felipe de Barajas', latitude: 10.4237, longitude: -75.5398, city: 'Cartagena', country: 'Colombia' },
  'castillo san felipe': { name: 'Castillo San Felipe de Barajas', latitude: 10.4237, longitude: -75.5398, city: 'Cartagena', country: 'Colombia' },
  'paseo en chiva': { name: 'Paseo en Chiva - Torre del Reloj, Centro Histórico', latitude: 10.4225, longitude: -75.5478, city: 'Cartagena', country: 'Colombia' },
  'cafe del mar': { name: 'Café del Mar, Baluarte de Santo Domingo', latitude: 10.4215, longitude: -75.5539, city: 'Cartagena', country: 'Colombia' },
  'ciudad amurallada': { name: 'Ciudad Amurallada de Cartagena', latitude: 10.4240, longitude: -75.5510, city: 'Cartagena', country: 'Colombia' },
  'centro historico de cartagena': { name: 'Ciudad Amurallada de Cartagena', latitude: 10.4240, longitude: -75.5510, city: 'Cartagena', country: 'Colombia' },
  'bocagrande': { name: 'Bocagrande, Cartagena', latitude: 10.4050, longitude: -75.5550, city: 'Cartagena', country: 'Colombia' },
  'restaurante la cevicheria': { name: 'Restaurante La Cevicheria', latitude: 10.4265, longitude: -75.5475, city: 'Cartagena', country: 'Colombia' },
  'la cevicheria': { name: 'Restaurante La Cevicheria', latitude: 10.4265, longitude: -75.5475, city: 'Cartagena', country: 'Colombia' },
  'restaurante celele': { name: 'Restaurante Celele', latitude: 10.4208, longitude: -75.5458, city: 'Cartagena', country: 'Colombia' },
  'celele': { name: 'Restaurante Celele', latitude: 10.4208, longitude: -75.5458, city: 'Cartagena', country: 'Colombia' },
  'restaurante el boliche cebicheria': { name: 'Restaurante El Boliche Cebichería', latitude: 10.4267, longitude: -75.5482, city: 'Cartagena', country: 'Colombia' },
  'el boliche cebicheria': { name: 'Restaurante El Boliche Cebichería', latitude: 10.4267, longitude: -75.5482, city: 'Cartagena', country: 'Colombia' },

  // Coveñas & Golfo de Morrosquillo
  'isla mucura': { name: 'Isla Múcura, Archipiélago de San Bernardo', latitude: 9.7820, longitude: -75.8305, city: 'Coveñas', country: 'Colombia' },
  'isla tintipan': { name: 'Isla Tintipán, Archipiélago de San Bernardo', latitude: 9.7950, longitude: -75.8450, city: 'Coveñas', country: 'Colombia' },
  'santa cruz del islote': { name: 'Santa Cruz del Islote, Archipiélago de San Bernardo', latitude: 9.7853, longitude: -75.8572, city: 'Coveñas', country: 'Colombia' },
  'isla palma': { name: 'Isla Palma, Archipiélago de San Bernardo', latitude: 9.7420, longitude: -75.6490, city: 'Coveñas', country: 'Colombia' },
  'cienaga de la caimanera': { name: 'Ciénaga de la Caimanera, Coveñas', latitude: 9.4236, longitude: -75.6183, city: 'Coveñas', country: 'Colombia' },
  'parque museo infanteria de marina': { name: 'Parque Museo de la Infantería de Marina, Coveñas', latitude: 9.4080, longitude: -75.6880, city: 'Coveñas', country: 'Colombia' },
  'isla fuerte': { name: 'Isla Fuerte, Bolívar / Córdoba', latitude: 9.3870, longitude: -76.1770, city: 'Coveñas', country: 'Colombia' },
  'playa blanca': { name: 'Playa Blanca, Coveñas', latitude: 9.4120, longitude: -75.6790, city: 'Coveñas', country: 'Colombia' },
  'playa hermosa': { name: 'Playa Hermosa, Coveñas', latitude: 9.4200, longitude: -75.6720, city: 'Coveñas', country: 'Colombia' },
  'restaurante covenas': { name: 'Restaurante Coveñas', latitude: 9.4050, longitude: -75.6830, city: 'Coveñas', country: 'Colombia' },
  'restaurante esmeralda': { name: 'Restaurante Esmeralda', latitude: 9.4070, longitude: -75.6820, city: 'Coveñas', country: 'Colombia' },
  'playa divina': { name: 'Playa Divina, Coveñas', latitude: 9.4080, longitude: -75.6810, city: 'Coveñas', country: 'Colombia' },
  'playa caiman': { name: 'Playa Caimán, Coveñas', latitude: 9.4150, longitude: -75.6750, city: 'Coveñas', country: 'Colombia' },
  'restaurante el montanero': { name: 'Restaurante el Montañero', latitude: 9.4030, longitude: -75.6840, city: 'Coveñas', country: 'Colombia' },
  'playas de punta bolivar': { name: 'Playas de Punta Bolívar', latitude: 9.4580, longitude: -75.6980, city: 'Coveñas', country: 'Colombia' },
  'punta bolivar': { name: 'Playas de Punta Bolívar', latitude: 9.4580, longitude: -75.6980, city: 'Coveñas', country: 'Colombia' },
  'restaurante la fonda antioquena': { name: 'Restaurante La Fonda Antioqueña', latitude: 9.4020, longitude: -75.6850, city: 'Coveñas', country: 'Colombia' },

  // Barranquilla & Área Metropolitana
  'gran malecon': { name: 'Gran Malecón del Río', latitude: 11.0167, longitude: -74.7895, city: 'Barranquilla', country: 'Colombia' },
  'gran malecon del rio': { name: 'Gran Malecón del Río', latitude: 11.0167, longitude: -74.7895, city: 'Barranquilla', country: 'Colombia' },
  'malecon del rio': { name: 'Gran Malecón del Río', latitude: 11.0167, longitude: -74.7895, city: 'Barranquilla', country: 'Colombia' },
  'el caiman del rio': { name: 'El Caimán del Río - Mercado Gastronómico', latitude: 11.0231, longitude: -74.7960, city: 'Barranquilla', country: 'Colombia' },
  'caiman del rio': { name: 'El Caimán del Río - Mercado Gastronómico', latitude: 11.0231, longitude: -74.7960, city: 'Barranquilla', country: 'Colombia' },
  'ventana al mundo': { name: 'Monumento Ventana al Mundo', latitude: 11.03316, longitude: -74.83143, city: 'Barranquilla', country: 'Colombia' },
  'monumento ventana al mundo': { name: 'Monumento Ventana al Mundo', latitude: 11.03316, longitude: -74.83143, city: 'Barranquilla', country: 'Colombia' },
  'aleta del tiburon': { name: 'Monumento La Aleta del Tiburón', latitude: 10.9983, longitude: -74.7728, city: 'Barranquilla', country: 'Colombia' },
  'la aleta del tiburon': { name: 'Monumento La Aleta del Tiburón', latitude: 10.9983, longitude: -74.7728, city: 'Barranquilla', country: 'Colombia' },
  'monumento la aleta del tiburon': { name: 'Monumento La Aleta del Tiburón', latitude: 10.9983, longitude: -74.7728, city: 'Barranquilla', country: 'Colombia' },
  'ventana de campeones': { name: 'Monumento La Aleta del Tiburón', latitude: 10.9983, longitude: -74.7728, city: 'Barranquilla', country: 'Colombia' },
  'museo del caribe': { name: 'Museo Cultural del Caribe', latitude: 10.9863, longitude: -74.7784, city: 'Barranquilla', country: 'Colombia' },
  'museo del caribe gabriel garcia marquez': { name: 'Museo Cultural del Caribe', latitude: 10.9863, longitude: -74.7784, city: 'Barranquilla', country: 'Colombia' },
  'parque cultural del caribe': { name: 'Parque Cultural del Caribe', latitude: 10.9863, longitude: -74.7784, city: 'Barranquilla', country: 'Colombia' },
  'zoologico de barranquilla': { name: 'Zoológico de Barranquilla', latitude: 11.0110, longitude: -74.7980, city: 'Barranquilla', country: 'Colombia' },
  'catedral metropolitana maria reina': { name: 'Catedral Metropolitana María Reina', latitude: 10.9885, longitude: -74.7906, city: 'Barranquilla', country: 'Colombia' },
  'catedral metropolitana': { name: 'Catedral Metropolitana María Reina', latitude: 10.9885, longitude: -74.7906, city: 'Barranquilla', country: 'Colombia' },
  'plaza de la paz': { name: 'Plaza de la Paz', latitude: 10.98802, longitude: -74.78901, city: 'Barranquilla', country: 'Colombia' },
  'parque plaza de la paz': { name: 'Plaza de la Paz', latitude: 10.98802, longitude: -74.78901, city: 'Barranquilla', country: 'Colombia' },
  'casa del carnaval': { name: 'Casa del Carnaval', latitude: 10.9935, longitude: -74.7818, city: 'Barranquilla', country: 'Colombia' },
  'museo del carnaval': { name: 'Museo del Carnaval', latitude: 10.9928, longitude: -74.7876, city: 'Barranquilla', country: 'Colombia' },
  'museo del carnaval de barranquilla': { name: 'Museo del Carnaval', latitude: 10.9928, longitude: -74.7876, city: 'Barranquilla', country: 'Colombia' },
  'castillo de salgar': { name: 'Castillo de Salgar', latitude: 11.0182, longitude: -74.9417, city: 'Puerto Colombia', country: 'Colombia' },
  'cienaga de mallorquin': { name: 'Ecoparque Ciénaga de Mallorquín', latitude: 11.0350, longitude: -74.8445, city: 'Barranquilla', country: 'Colombia' },
  'ecoparque cienaga de mallorquin': { name: 'Ecoparque Ciénaga de Mallorquín', latitude: 11.0350, longitude: -74.8445, city: 'Barranquilla', country: 'Colombia' },
  'bocas de ceniza': { name: 'Bocas de Ceniza - Tajamar Occidental', latitude: 11.1065, longitude: -74.8547, city: 'Barranquilla', country: 'Colombia' },
  'barrio el prado': { name: 'Barrio El Prado, Barranquilla', latitude: 10.9985, longitude: -74.7960, city: 'Barranquilla', country: 'Colombia' },
  'teatro amira de la rosa': { name: 'Teatro Amira de la Rosa', latitude: 10.9935, longitude: -74.7896, city: 'Barranquilla', country: 'Colombia' },
  'plaza de san nicolas': { name: 'Plaza de San Nicolás', latitude: 10.9798, longitude: -74.7774, city: 'Barranquilla', country: 'Colombia' },
  'plaza san nicolas': { name: 'Plaza de San Nicolás', latitude: 10.9798, longitude: -74.7774, city: 'Barranquilla', country: 'Colombia' },
  'parque tomas suri salcedo': { name: 'Parque Tomás Suri Salcedo', latitude: 10.9941, longitude: -74.8043, city: 'Barranquilla', country: 'Colombia' },
  'parque suri salcedo': { name: 'Parque Tomás Suri Salcedo', latitude: 10.9941, longitude: -74.8043, city: 'Barranquilla', country: 'Colombia' },
  'restaurante cucayo': { name: 'Restaurante Cucayo', latitude: 10.99986, longitude: -74.80920, city: 'Barranquilla', country: 'Colombia' },
  'cucayo': { name: 'Restaurante Cucayo', latitude: 10.99986, longitude: -74.80920, city: 'Barranquilla', country: 'Colombia' },
  'cucayo sabor costeno': { name: 'Restaurante Cucayo', latitude: 10.99986, longitude: -74.80920, city: 'Barranquilla', country: 'Colombia' },
  'restaurante narcobollo': { name: 'Restaurante Narcobollo', latitude: 10.99820, longitude: -74.82020, city: 'Barranquilla', country: 'Colombia' },
  'narcobollo': { name: 'Restaurante Narcobollo', latitude: 10.99820, longitude: -74.82020, city: 'Barranquilla', country: 'Colombia' },
  'la cueva': { name: 'Restaurante Bar La Cueva', latitude: 10.9856, longitude: -74.7965, city: 'Barranquilla', country: 'Colombia' },
  'restaurante la cueva': { name: 'Restaurante Bar La Cueva', latitude: 10.9856, longitude: -74.7965, city: 'Barranquilla', country: 'Colombia' },
  'manuel restaurante': { name: 'Manuel Restaurante', latitude: 11.0050, longitude: -74.8115, city: 'Barranquilla', country: 'Colombia' },
  'restaurante manuel': { name: 'Manuel Restaurante', latitude: 11.0050, longitude: -74.8115, city: 'Barranquilla', country: 'Colombia' },
  'varadero': { name: 'Restaurante Varadero', latitude: 11.0014, longitude: -74.8115, city: 'Barranquilla', country: 'Colombia' },
  'restaurante varadero': { name: 'Restaurante Varadero', latitude: 11.0014, longitude: -74.8115, city: 'Barranquilla', country: 'Colombia' },
  'museo romantico': { name: 'Museo Romántico', latitude: 10.99465, longitude: -74.79385, city: 'Barranquilla', country: 'Colombia' },
  'museo romantico de barranquilla': { name: 'Museo Romántico', latitude: 10.99465, longitude: -74.79385, city: 'Barranquilla', country: 'Colombia' },
  'iglesia de la inmaculada concepcion': { name: 'Iglesia de la Inmaculada Concepción', latitude: 10.99881, longitude: -74.79818, city: 'Barranquilla', country: 'Colombia' },
  'parroquia inmaculada concepcion': { name: 'Iglesia de la Inmaculada Concepción', latitude: 10.99881, longitude: -74.79818, city: 'Barranquilla', country: 'Colombia' },
  'inmaculada concepcion': { name: 'Iglesia de la Inmaculada Concepción', latitude: 10.99881, longitude: -74.79818, city: 'Barranquilla', country: 'Colombia' },
  'la inmaculada': { name: 'Iglesia de la Inmaculada Concepción', latitude: 10.99881, longitude: -74.79818, city: 'Barranquilla', country: 'Colombia' },
  'salgarito': { name: 'Salgarito Beach Club', latitude: 11.0205, longitude: -74.9325, city: 'Puerto Colombia', country: 'Colombia' },
  'salgarito beach club': { name: 'Salgarito Beach Club', latitude: 11.0205, longitude: -74.9325, city: 'Puerto Colombia', country: 'Colombia' },
  'restaurante la casa de doris': { name: 'Restaurante La Casa de Doris', latitude: 10.9852, longitude: -74.7795, city: 'Barranquilla', country: 'Colombia' },
  'la casa de doris': { name: 'Restaurante La Casa de Doris', latitude: 10.9852, longitude: -74.7795, city: 'Barranquilla', country: 'Colombia' },
  'casa de doris': { name: 'Restaurante La Casa de Doris', latitude: 10.9852, longitude: -74.7795, city: 'Barranquilla', country: 'Colombia' },
  'nena lela': { name: 'Nena Lela Trattoria', latitude: 11.0223, longitude: -74.8625, city: 'Barranquilla', country: 'Colombia' },
  'muelle de puerto colombia': { name: 'Muelle de Puerto Colombia', latitude: 10.9893, longitude: -74.9612, city: 'Puerto Colombia', country: 'Colombia' },
  'muelle puerto colombia': { name: 'Muelle de Puerto Colombia', latitude: 10.9893, longitude: -74.9612, city: 'Puerto Colombia', country: 'Colombia' },
  'muelle turistico de puerto colombia': { name: 'Muelle de Puerto Colombia', latitude: 10.9893, longitude: -74.9612, city: 'Puerto Colombia', country: 'Colombia' },
  'muelle turistico': { name: 'Muelle de Puerto Colombia', latitude: 10.9893, longitude: -74.9612, city: 'Puerto Colombia', country: 'Colombia' },
  'plaza francisco javier cisneros': { name: 'Plaza Cisneros, Puerto Colombia', latitude: 10.9887, longitude: -74.9597, city: 'Puerto Colombia', country: 'Colombia' },
  'plaza cisneros': { name: 'Plaza Cisneros, Puerto Colombia', latitude: 10.9887, longitude: -74.9597, city: 'Puerto Colombia', country: 'Colombia' },
  'iglesia de san nicolas de tolentino': { name: 'Iglesia de San Nicolás de Tolentino', latitude: 10.9801, longitude: -74.7780, city: 'Barranquilla', country: 'Colombia' },
  'iglesia san nicolas de tolentino': { name: 'Iglesia de San Nicolás de Tolentino', latitude: 10.9801, longitude: -74.7780, city: 'Barranquilla', country: 'Colombia' },
  'iglesia de san nicolas': { name: 'Iglesia de San Nicolás de Tolentino', latitude: 10.9801, longitude: -74.7780, city: 'Barranquilla', country: 'Colombia' },
  'iglesia san nicolas': { name: 'Iglesia de San Nicolás de Tolentino', latitude: 10.9801, longitude: -74.7780, city: 'Barranquilla', country: 'Colombia' },
  'san nicolas de tolentino': { name: 'Iglesia de San Nicolás de Tolentino', latitude: 10.9801, longitude: -74.7780, city: 'Barranquilla', country: 'Colombia' },
  'restaurante el celler': { name: 'Restaurante El Celler', latitude: 11.0022, longitude: -74.8075, city: 'Barranquilla', country: 'Colombia' },
  'el celler': { name: 'Restaurante El Celler', latitude: 11.0022, longitude: -74.8075, city: 'Barranquilla', country: 'Colombia' },
  'celler': { name: 'Restaurante El Celler', latitude: 11.0022, longitude: -74.8075, city: 'Barranquilla', country: 'Colombia' },
  'plaza de la aduana': { name: 'Plaza de la Aduana', latitude: 10.9888, longitude: -74.7791, city: 'Barranquilla', country: 'Colombia' },
  'antigua aduana': { name: 'Complejo Cultural de la Antigua Aduana', latitude: 10.9888, longitude: -74.7791, city: 'Barranquilla', country: 'Colombia' },
  'galeria de la aduana': { name: 'Plaza de la Aduana', latitude: 10.9888, longitude: -74.7791, city: 'Barranquilla', country: 'Colombia' },
  'estacion montoya': { name: 'Estación Montoya', latitude: 10.9895, longitude: -74.7796, city: 'Barranquilla', country: 'Colombia' },
  'nancy cabrera': { name: 'Nancy Cabrera Restaurante y Repostería', latitude: 11.0149, longitude: -74.8267, city: 'Barranquilla', country: 'Colombia' },
  'nancy cabrera restaurante y reposteria': { name: 'Nancy Cabrera Restaurante y Repostería', latitude: 11.0149, longitude: -74.8267, city: 'Barranquilla', country: 'Colombia' },
  'restaurante nancy cabrera': { name: 'Nancy Cabrera Restaurante y Repostería', latitude: 11.0149, longitude: -74.8267, city: 'Barranquilla', country: 'Colombia' },
  'las 5 mentiritas': { name: 'Restaurante y Refresquería Las 5 Mentiritas', latitude: 11.0014, longitude: -74.8128, city: 'Barranquilla', country: 'Colombia' },
  'restaurante y refresqueria las 5 mentiritas': { name: 'Restaurante y Refresquería Las 5 Mentiritas', latitude: 11.0014, longitude: -74.8128, city: 'Barranquilla', country: 'Colombia' },
  'jardines de confucio': { name: 'Restaurante Jardines De Confucio', latitude: 11.0025, longitude: -74.8039, city: 'Barranquilla', country: 'Colombia' },
  'restaurante jardines de confucio': { name: 'Restaurante Jardines De Confucio', latitude: 11.0025, longitude: -74.8039, city: 'Barranquilla', country: 'Colombia' },
  'monstro': { name: 'Restaurante Monstro', latitude: 11.0041, longitude: -74.7950, city: 'Barranquilla', country: 'Colombia' },
  'restaurante monstro': { name: 'Restaurante Monstro', latitude: 11.0041, longitude: -74.7950, city: 'Barranquilla', country: 'Colombia' },
  'hong kung cheng': { name: 'Restaurante Hong Kung Cheng', latitude: 10.9685, longitude: -74.8048, city: 'Barranquilla', country: 'Colombia' },
  'restaurante hong kung cheng': { name: 'Restaurante Hong Kung Cheng', latitude: 10.9685, longitude: -74.8048, city: 'Barranquilla', country: 'Colombia' },
  'restaurante morgan': { name: 'Restaurante morgan', latitude: 10.9689, longitude: -74.8038, city: 'Barranquilla', country: 'Colombia' },
  'morgan': { name: 'Restaurante morgan', latitude: 10.9689, longitude: -74.8038, city: 'Barranquilla', country: 'Colombia' },
  'gran maiz': { name: 'Restaurante gran maiz', latitude: 10.9623, longitude: -74.7919, city: 'Barranquilla', country: 'Colombia' },
  'restaurante gran maiz': { name: 'Restaurante gran maiz', latitude: 10.9623, longitude: -74.7919, city: 'Barranquilla', country: 'Colombia' },
  'restaurante el prado': { name: 'Restaurante El Prado', latitude: 10.9995, longitude: -74.7955, city: 'Barranquilla', country: 'Colombia' },
  'hotel el prado': { name: 'Hotel El Prado', latitude: 10.9995, longitude: -74.7955, city: 'Barranquilla', country: 'Colombia' },
  'la troja': { name: 'La Troja', latitude: 10.9942, longitude: -74.8080, city: 'Barranquilla', country: 'Colombia' },

  // Santa Marta
  'playa el rodadero': { name: 'Playa El Rodadero', latitude: 11.2052, longitude: -74.2285, city: 'Santa Marta', country: 'Colombia' },
  'el rodadero': { name: 'Playa El Rodadero', latitude: 11.2052, longitude: -74.2285, city: 'Santa Marta', country: 'Colombia' },
  'bahia de taganga': { name: 'Bahía de Taganga', latitude: 11.2665, longitude: -74.1925, city: 'Santa Marta', country: 'Colombia' },
  'taganga': { name: 'Bahía de Taganga', latitude: 11.2665, longitude: -74.1925, city: 'Santa Marta', country: 'Colombia' },
  'playa blanca santa marta': { name: 'Playa Blanca, Santa Marta', latitude: 11.2185, longitude: -74.2345, city: 'Santa Marta', country: 'Colombia' },
  'quinta de san pedro alejandrino': { name: 'Quinta de San Pedro Alejandrino', latitude: 11.2281, longitude: -74.1777, city: 'Santa Marta', country: 'Colombia' },
  'parque de los novios': { name: 'Parque de Los Novios', latitude: 11.2422, longitude: -74.2133, city: 'Santa Marta', country: 'Colombia' },
  'catedral de santa marta': { name: 'Catedral Basílica de Santa Marta', latitude: 11.2435, longitude: -74.2111, city: 'Santa Marta', country: 'Colombia' },
  'catedral basilica de santa marta': { name: 'Catedral Basílica de Santa Marta', latitude: 11.2435, longitude: -74.2111, city: 'Santa Marta', country: 'Colombia' },
  'museo del oro tairona': { name: 'Museo del Oro Tairona - Casa de la Aduana', latitude: 11.2450, longitude: -74.2128, city: 'Santa Marta', country: 'Colombia' },
  'casa de la aduana': { name: 'Museo del Oro Tairona - Casa de la Aduana', latitude: 11.2450, longitude: -74.2128, city: 'Santa Marta', country: 'Colombia' },
  'parque nacional natural tayrona': { name: 'Parque Nacional Natural Tayrona', latitude: 11.3060, longitude: -73.9380, city: 'Santa Marta', country: 'Colombia' },
  'parque tayrona': { name: 'Parque Nacional Natural Tayrona', latitude: 11.3060, longitude: -73.9380, city: 'Santa Marta', country: 'Colombia' },
  'tayrona': { name: 'Parque Nacional Natural Tayrona', latitude: 11.3060, longitude: -73.9380, city: 'Santa Marta', country: 'Colombia' },
  'minca': { name: 'Minca, Sierra Nevada', latitude: 11.1440, longitude: -74.1180, city: 'Santa Marta', country: 'Colombia' },
  'restaurante ouzo': { name: 'Restaurante Ouzo', latitude: 11.2422, longitude: -74.2129, city: 'Santa Marta', country: 'Colombia' },
  'ouzo': { name: 'Restaurante Ouzo', latitude: 11.2422, longitude: -74.2129, city: 'Santa Marta', country: 'Colombia' },
  'centro comercial buenavista': { name: 'Centro Comercial Buenavista', latitude: 11.2264, longitude: -74.1734, city: 'Santa Marta', country: 'Colombia' },

  // International Iconic Landmarks
  'museo del prado': { name: 'Museo Nacional del Prado', latitude: 40.4138, longitude: -3.6921, city: 'Madrid', country: 'España' },
  'museo nacional del prado': { name: 'Museo Nacional del Prado', latitude: 40.4138, longitude: -3.6921, city: 'Madrid', country: 'España' },
  'coliseo romano': { name: 'Coliseo Romano', latitude: 41.8902, longitude: 12.4922, city: 'Roma', country: 'Italia' },
  'colosseo': { name: 'Coliseo Romano', latitude: 41.8902, longitude: 12.4922, city: 'Roma', country: 'Italia' },
  'torre eiffel': { name: 'Torre Eiffel', latitude: 48.8584, longitude: 2.2945, city: 'París', country: 'Francia' },
  'sagrada familia': { name: 'Basílica de la Sagrada Família', latitude: 41.4036, longitude: 2.1744, city: 'Barcelona', country: 'España' }
}

export function matchIconicLandmark(query, normalizedQuery, centerLat = null, centerLon = null, maxDistanceMeters = 75000) {
  if (!query && !normalizedQuery) return null
  const normLower = String(normalizedQuery || query || '').toLowerCase().trim()
  const rawClean = String(query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const strippedCity = normLower.replace(/,\s*(barranquilla|santa marta|cartagena|coveñas|covenas|medellin|medellín|bogota|bogotá|colombia)/gi, '').trim()
  const unaccentedStripped = strippedCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const unaccentedQuery = normLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const pureQuery = unaccentedStripped.split(',')[0].trim()

  const landmarkMatch = KNOWN_ICONIC_LANDMARKS[normLower] ||
    KNOWN_ICONIC_LANDMARKS[unaccentedQuery] ||
    KNOWN_ICONIC_LANDMARKS[rawClean] ||
    KNOWN_ICONIC_LANDMARKS[strippedCity] ||
    KNOWN_ICONIC_LANDMARKS[unaccentedStripped] ||
    KNOWN_ICONIC_LANDMARKS[pureQuery] ||
    Object.entries(KNOWN_ICONIC_LANDMARKS).find(([k]) => {
      const kClean = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return pureQuery === kClean ||
             unaccentedStripped === kClean ||
             unaccentedQuery === kClean ||
             (kClean.length >= 5 && pureQuery.includes(kClean)) ||
             (pureQuery.length >= 5 && kClean.includes(pureQuery))
    })?.[1]

  if (landmarkMatch) {
    let isValidInRegion = true
    if (centerLat != null && centerLon != null) {
      const dist = haversineMeters(centerLat, centerLon, landmarkMatch.latitude, landmarkMatch.longitude)
      isValidInRegion = dist <= maxDistanceMeters
    }
    if (isValidInRegion) {
      return landmarkMatch
    }
  }
  return null
}

export function getRegionalBoundingBox(lat, lon, options = {}) {
  if (lat == null || lon == null) return null
  const numLat = Number(lat)
  const numLon = Number(lon)
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon)) return null

  // Adaptive regional bounding box:
  // - Micro-destination: delta ~0.15 (~16 km)
  // - Regional / Nature / Multiday / Sports / Ecological: delta ~0.55 (~60 km)
  // - Standard urban / metropolitan coastal: delta ~0.35 (~38 km)
  let delta = 0.35
  if (options.isMicroDestination || options.isMicroDest) {
    delta = 0.15
  } else if (
    options.isRegionalOrNature ||
    options.durationDays >= 2 ||
    options.durationHours >= 24 ||
    options.type === 'ecological' ||
    options.type === 'sports' ||
    options.type === 'adventure' ||
    options.type === 'regional'
  ) {
    delta = 0.55
  }

  const minLon = Number((numLon - delta).toFixed(4))
  const maxLon = Number((numLon + delta).toFixed(4))
  const minLat = Number((numLat - delta).toFixed(4))
  const maxLat = Number((numLat + delta).toFixed(4))

  return {
    delta,
    minLon,
    maxLon,
    minLat,
    maxLat,
    photonBbox: `${minLon},${minLat},${maxLon},${maxLat}`,
    nominatimViewbox: `${minLon},${maxLat},${maxLon},${minLat}`
  }
}

export async function geocodePlace(query, lat = null, lon = null, options = {}) {
  if (!query || typeof query !== 'string') return null
  const normalizedQuery = normalizeGeocodeQuery(query)
  if (!normalizedQuery) return null

  const key = `geocode_${normalizedQuery.toLowerCase().trim()}_${lat ?? ''}_${lon ?? ''}`
  const cached = geocodeCache.get(key)
  if (cached) return cached

  const resolveCityFromPhoton = (item) => {
    const rawCounty = cleanAdministrativeCityName(item?.tags?.county || '')
    const rawCity = cleanAdministrativeCityName(item?.city || item?.tags?.city || '')
    if (rawCounty && normalizedQuery.toLowerCase().includes(rawCounty.toLowerCase())) {
      return rawCounty
    }
    return rawCity || rawCounty || ''
  }

  // 1. Resolve search center coordinates
  let centerLat = (lat != null && Number.isFinite(Number(lat))) ? Number(lat) : null
  let centerLon = (lon != null && Number.isFinite(Number(lon))) ? Number(lon) : null

  if (centerLat == null || centerLon == null) {
    let detectedCity = options?.city || options?.destination || ''
    if (!detectedCity) {
      const commaParts = query.split(',').map(s => s.trim())
      if (commaParts.length > 1) {
        detectedCity = commaParts[1]
      }
    }
    if (!detectedCity) {
      const knownCities = Object.keys(FALLBACK_DESTINATION_CENTROIDS)
      const qLower = query.toLowerCase()
      for (const kc of knownCities) {
        if (qLower.includes(kc)) {
          detectedCity = kc
          break
        }
      }
    }
    if (detectedCity) {
      const cleanCityKey = detectedCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const fallbackCentroid = FALLBACK_DESTINATION_CENTROIDS[cleanCityKey] || FALLBACK_DESTINATION_CENTROIDS[detectedCity.toLowerCase()]
      if (fallbackCentroid) {
        centerLat = fallbackCentroid.latitude
        centerLon = fallbackCentroid.longitude
      }
    }
  }

  const regionalBbox = (centerLat != null && centerLon != null) ? getRegionalBoundingBox(centerLat, centerLon, options) : null
  const maxDistanceMeters = regionalBbox ? (regionalBbox.delta * 111000 * 1.45) : 75000

  // Early check: High-confidence curated landmarks (Zero-latency exact coordinates)
  const earlyLandmark = matchIconicLandmark(query, normalizedQuery, centerLat, centerLon, maxDistanceMeters)
  if (earlyLandmark) {
    geocodeCache.set(key, earlyLandmark)
    return earlyLandmark
  }

  // 2. Candidate query variations
  const queryCandidates = [normalizedQuery]
  const commaParts = normalizedQuery.split(',').map(s => s.trim()).filter(Boolean)
  if (commaParts.length > 1 && commaParts[0].length >= 3 && !queryCandidates.includes(commaParts[0])) {
    queryCandidates.push(commaParts[0])
  }
  const decomposed = decomposeCompoundPlaceQuery(query)
  for (const dq of decomposed) {
    const normDq = normalizeGeocodeQuery(dq)
    if (normDq && !queryCandidates.includes(normDq)) {
      queryCandidates.push(normDq)
    }
  }

  // 3. Photon Search with Bounding Box & Proximity Bias
  for (const qc of queryCandidates) {
    try {
      const proxResults = await photonSearch(
        qc,
        8,
        centerLat,
        centerLon,
        regionalBbox ? regionalBbox.photonBbox : null
      )
      const photonProx = selectBestPoiResult(proxResults, query)
      if (photonProx && Number.isFinite(photonProx.latitude) && Number.isFinite(photonProx.longitude)) {
        const dMeters = (centerLat != null && centerLon != null)
          ? haversineMeters(centerLat, centerLon, photonProx.latitude, photonProx.longitude)
          : 0
        if (centerLat == null || dMeters <= maxDistanceMeters) {
          const res = {
            name: photonProx.name,
            latitude: Number(photonProx.latitude),
            longitude: Number(photonProx.longitude),
            city: resolveCityFromPhoton(photonProx),
            country: photonProx.country || ''
          }
          geocodeCache.set(key, res)
          return res
        }
      }
    } catch (err) {
      console.warn('[geocodePlace] Photon proximity search error:', err.message)
    }
  }

  // 4. Global Photon Search (only when no bounding box / destination center exists)
  if (!regionalBbox) {
    try {
      for (const qc of queryCandidates) {
        const globalResults = await photonSearch(qc, 5, null, null, null)
        const photonGlobal = selectBestPoiResult(globalResults, query)
        if (photonGlobal && Number.isFinite(photonGlobal.latitude) && Number.isFinite(photonGlobal.longitude)) {
          const res = {
            name: photonGlobal.name,
            latitude: Number(photonGlobal.latitude),
            longitude: Number(photonGlobal.longitude),
            city: resolveCityFromPhoton(photonGlobal),
            country: photonGlobal.country || ''
          }
          geocodeCache.set(key, res)
          return res
        }
      }
    } catch (err) {
      console.warn('[geocodePlace] Global Photon search error:', err.message)
    }
  }

  // 5. Nominatim Fallback with bounded viewbox
  if (!options?.skipNominatim) {
    const isExplicitFuelQuery = /\b(gasolinera|estaci[oó]n de servicio|combustible|terpel|texaco|esso|mobil|biomax|primax|petrol|fuel)\b/i.test(normalizedQuery)
    const nominatimQueries = [...queryCandidates]
    if (commaParts.length > 1) {
      const simplifiedFeature = normalizedQuery.replace(/\b(bah[íi]a de|playa de|cabo|isla|archipi[ée]lago de|monumento al?|monumento de|monumento|barrio)\s+/gi, '').trim()
      if (simplifiedFeature && simplifiedFeature !== normalizedQuery && simplifiedFeature.length > 3 && !nominatimQueries.includes(simplifiedFeature)) {
        nominatimQueries.push(simplifiedFeature)
      }
    }

    for (const nq of nominatimQueries) {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('limit', '5')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('q', nq)
      if (regionalBbox) {
        url.searchParams.set('viewbox', regionalBbox.nominatimViewbox)
        url.searchParams.set('bounded', '1')
      }

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          const results = await response.json()
          const validResult = (Array.isArray(results) ? results : []).find(r => {
            const type = String(r.type || '').toLowerCase()
            const category = String(r.category || '').toLowerCase()
            const name = String(r.display_name || '').toLowerCase()
            const isFuel = type === 'fuel' || category === 'fuel' || /\beds\b|estaci[oó]n de servicio/i.test(name)
            if (isFuel && !isExplicitFuelQuery) return false
            const isUtility = ['waste_disposal', 'vending_machine', 'atm', 'car_wash', 'toilet', 'bench'].includes(type)
            if (isUtility) return false

            const isFoodQuery = /\b(restaurante|restaurant|bistro|caf[ée]|bar|gastrobar|asador|pizzer[íi]a|taquer[íi]a|pub|cervecer[íi]a|saz[oó]n|comida|helader[íi]a|tropez[oó]n|celler|corralito|cueva|marea|p[ée]rgola|troja|cebicher[íi]a|cevicher[íi]a|marisquer[íi]a|panader[íi]a)\b/i.test(query)
            if (isFoodQuery) {
              const isNonFoodGeo = ['boundary', 'place', 'highway'].includes(category) ||
                ['administrative', 'neighbourhood', 'suburb', 'pedestrian', 'residential', 'road'].includes(type)
              if (isNonFoodGeo) return false
            }

            const isIslandQuery = /\b(isla|islas|archipi[ée]lago|cayo|cayos)\b/i.test(query)
            if (isIslandQuery) {
              const isNonIsland = ['boundary', 'highway', 'amenity'].includes(category) ||
                ['administrative', 'neighbourhood', 'suburb', 'residential', 'road', 'street', 'city', 'town', 'school', 'place_of_worship'].includes(type)
              const hasIslandWord = /\b(isla|islas|archipi[ée]lago|cayo|cayos)\b/i.test(name) || type === 'island' || type === 'islet'
              if (isNonIsland && !hasIslandWord) return false
              if (!hasIslandWord && type !== 'island' && type !== 'islet') return false
            }

            if (query && !isDistinctNameMatch(query, r.display_name || r.name || '')) return false
            return true
          })

          if (validResult) {
            const rLat = Number(validResult.lat)
            const rLon = Number(validResult.lon)
            const dMeters = (centerLat != null && centerLon != null)
              ? haversineMeters(centerLat, centerLon, rLat, rLon)
              : 0
            if (centerLat == null || dMeters <= maxDistanceMeters) {
              const address = validResult.address || {}
              const county = cleanAdministrativeCityName(address.county || '')
              const matchedContextCity = commaParts.length > 1 ? cleanAdministrativeCityName(commaParts[1]) : ''
              let rawCity = address.city || ''
              if (county && matchedContextCity && county.toLowerCase() === matchedContextCity.toLowerCase()) {
                rawCity = county
              }
              if (!rawCity) {
                rawCity = address.town || address.village || address.municipality || address.county || matchedContextCity || ''
              }
              const city = cleanAdministrativeCityName(rawCity)
              const country = address.country || ''
              const res = {
                name: validResult.display_name,
                latitude: rLat,
                longitude: rLon,
                city,
                country
              }
              geocodeCache.set(key, res)
              return res
            }
          }
        }
      } catch (err) {
        console.warn('[geocodePlace] Nominatim search error:', err.message)
      }
    }
  }

  // 6. High-confidence Seed Landmark Fallback (Only for local venues unmapped in OSM)
  // Strictly validated against regional bounds so out-of-city landmarks NEVER match
  const normLower = normalizedQuery.toLowerCase().trim()
  const rawClean = String(query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const strippedCity = normLower.replace(/,\s*(barranquilla|santa marta|cartagena|coveñas|covenas|medellin|medellín|bogota|bogotá|colombia)/gi, '').trim()
  const unaccentedStripped = strippedCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const unaccentedQuery = normLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const pureQuery = unaccentedStripped.split(',')[0].trim()

  const landmarkMatch = KNOWN_ICONIC_LANDMARKS[normLower] ||
    KNOWN_ICONIC_LANDMARKS[unaccentedQuery] ||
    KNOWN_ICONIC_LANDMARKS[rawClean] ||
    KNOWN_ICONIC_LANDMARKS[strippedCity] ||
    KNOWN_ICONIC_LANDMARKS[unaccentedStripped] ||
    KNOWN_ICONIC_LANDMARKS[pureQuery] ||
    Object.entries(KNOWN_ICONIC_LANDMARKS).find(([k]) => {
      const kClean = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return pureQuery === kClean ||
             unaccentedStripped === kClean ||
             unaccentedQuery === kClean ||
             pureQuery.startsWith(kClean) ||
             kClean.startsWith(pureQuery)
    })?.[1]

  if (landmarkMatch) {
    let isValidInRegion = true
    if (centerLat != null && centerLon != null) {
      const dist = haversineMeters(centerLat, centerLon, landmarkMatch.latitude, landmarkMatch.longitude)
      isValidInRegion = dist <= maxDistanceMeters
    }
    if (isValidInRegion) {
      geocodeCache.set(key, landmarkMatch)
      return landmarkMatch
    }
  }

  return null
}

let photonCircuitOpenUntil = 0

export function isPhotonCircuitOpen() {
  return Date.now() < photonCircuitOpenUntil
}

export function tripPhotonCircuit(durationMs = (process.env.NODE_ENV === 'test' ? 2000 : 10000)) {
  photonCircuitOpenUntil = Date.now() + durationMs
  console.warn(`[osm] Photon circuit breaker tripped for ${durationMs / 1000}s`)
}

export async function photonSearch(query, limit = 8, lat = null, lon = null, bbox = null) {
  if (!query || isPhotonCircuitOpen()) return []
  const key = `photon_${query.toLowerCase().trim()}_${limit}_${lat ?? ''}_${lon ?? ''}_${bbox ?? ''}`
  const cached = photonCache.get(key)
  if (cached) return cached

  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
  if (bbox) {
    url.searchParams.set('bbox', bbox)
  }
  if (lat && lon) {
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
  }
  try {
    const timeoutMs = process.env.NODE_ENV === 'test' ? 4000 : 3500
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        tripPhotonCircuit(process.env.NODE_ENV === 'test' ? 2000 : 15000)
      }
      return []
    }
    const json = await response.json()
    const results = (json.features ?? []).map((feature) => ({
      name: feature.properties.name ?? feature.properties.city ?? query,
      city: cleanAdministrativeCityName(feature.properties.city || feature.properties.state || ''),
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
    if (err.name === 'TimeoutError' || err.name === 'AbortError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
      tripPhotonCircuit(process.env.NODE_ENV === 'test' ? 2000 : 10000)
    }
    return []
  }
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const attractionsCache = new GeoCache(30 * 60 * 1000, 300)

async function fetchOverpassWithMirrors(query, timeoutMs = 4000) {
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
    } catch {
      // Continue to next mirror sequentially
    }
  }
  return null
}

export async function overpassAttractions(latitude, longitude, radius = 8000) {
  const effectiveRadius = Math.min(Math.max(radius, 8000), 52000)
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${effectiveRadius}`
  const cached = attractionsCache.get(cacheKey)
  if (cached) {
    return cached
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
          if (isAccommodation(type) || isNonTouristFacility(element.tags) || isFoodOrDrinkEstablishment(name)) return null
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
        if (!item || !item.name || isNonTouristFacility(item.tags) || isNonTouristFacility({ name: item.name }) || isFoodOrDrinkEstablishment(item.name)) continue
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
      attractionsCache.set(cacheKey, results)
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

export function isGenericFacilityName(rawName = '') {
  if (!rawName || typeof rawName !== 'string') return true
  const clean = rawName.trim().toLowerCase()
  if (clean.length < 3) return true
  const genericList = [
    'restaurante', 'restaurant', 'bar', 'café', 'cafe', 'cafetería', 'cafeteria',
    'comidas rápidas', 'comidas rapidas', 'fast food', 'hotel', 'hostal', 'hostel',
    'posada', 'alojamiento', 'atractivo', 'monumento', 'parque', 'plaza', 'mirador',
    'tienda', 'panadería', 'panaderia', 'kiosko', 'kiosco', 'puesto', 'estadero'
  ]
  if (genericList.includes(clean)) return true
  if (/^(restaurante|restaurant|bar|café|cafe|hotel|hostal|atractivo)\s*#?\d*$/i.test(clean)) return true
  return false
}

export function isFoodOrDrinkEstablishment(name = '') {
  if (!name || typeof name !== 'string') return false
  return /\b(restaurante|restaurant|parrilla|asador|bistro|pizzer[íi]a|panader[íi]a|pasteler[íi]a|cafeter[íi]a|caf[ée]|bar|gastrobar|chifa|refresquer[íi]a|taquer[íi]a|cervecer[íi]a|pub|helader[íi]a|marisquer[íi]a|comidas\s+r[aá]pidas|burger|piqueos|piquer[íi]a|piqueteadero)\b/i.test(name)
}

export function isNonTouristFacility(tags = {}) {
  if (!tags) return false
  if (tags.office || tags.industrial || tags.shop || tags.craft) return true
  if (tags.man_made === 'pipeline' || tags.pipeline || tags.man_made === 'storage_tank' || tags.man_made === 'works') return true

  if (tags.place === 'neighbourhood' || tags.place === 'suburb' || tags.place === 'quarter' || tags.place === 'isolated_dwelling') return true
  if (tags.junction === 'roundabout' || tags.highway === 'roundabout') return true

  const rawName = String(tags.name ?? '').toLowerCase()
  const name = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (isGenericFacilityName(rawName) || isGenericFacilityName(name)) return true
  if (/\b(carnaval|festival|fiesta|feria|desfile|reinado)\b/i.test(name)) {
    const isPhysicalVenue = /\b(museo|casa|centro|parque|plaza|sala|galeria|teatro|estadio|concha|complejo)\b/i.test(name)
    if (!isPhysicalVenue) return true
  }
  if (
    /\b(oleoducto|gasoducto|poliducto|refineria|tuberia|estacion de bombeo|planta de tratamiento|patio de tanques|cenit|ecopetrol)\b/i.test(name) ||
    /\b(supermercado|tienda|drogueria|farmacia|ferreteria|almacen|panaderia|carniceria|minimarket|estanco|miscelanea|bodega|deposito)\b/i.test(name) ||
    /\b(alkosto|exito|carulla|olimpica|jumbo|makro|pricesmart|tiendas d1|d1|tiendas ara|ara|homecenter|falabella|sodimac|panamericana)\b/i.test(name) ||
    /\b(parque industrial|zona franca|parque empresarial|poligono industrial|complejo logistico|centro logistico|bodegas|parque logistico)\b/i.test(name) ||
    /\b(rotario|club rotario|club de leones|club social|asociacion|fundacion|cooperativa|corporacion|sindicato|gremio|oficina)\b/i.test(name) ||
    /\b(urbanizacion|condominio|conjunto\s+residencial|complejo\s+residencial|torre\s+residencial|viviendas|barrio\s+residencial|rotonda|glorieta|retorno\s+vial|intercambiador\s+vial|redoma)\b/i.test(name) ||
    /\b(etapa\s+\d+|manzana\s+[a-z\d]+|bloque\s+\d+|apto\b|apartamentos|torre\s+\d+)\b/i.test(name) ||
    /\b(mirador\s+del\s+mar\s+[ivx\d]+)\b/i.test(name) ||
    /\b(universidad\s+simon\s+bolivar|sede\s+\d+|facultad\s+de|instituto\s+tecnico|sena\s+-\s+hoteleria)\b/i.test(name) ||
    name.includes('aguas de') ||
    name.includes('acueducto') ||
    name.includes('alcantarillado') ||
    name.includes('servicios publicos') ||
    name.includes('s.a. e.s.p.') ||
    name.includes('secretaria de') ||
    name.includes('notaria') ||
    name.includes('camara de comercio') ||
    name.includes('transito') ||
    name.includes('subestacion') ||
    name.includes('gas natural') ||
    name.includes('cementerio') ||
    name.includes('camposanto') ||
    name.includes('jardines de paz') ||
    name.includes('funeraria') ||
    name.includes('canal santa marta') ||
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
        .filter(r => {
          const n = r.name.toLowerCase()
          if (/\b(chino|chifa|hong\s*kung|asia|oriental|confucio)\b/i.test(n)) return false
          if (/\b(comida r[áa]pida|frituras|panader[íi]a|asadero de pollo|pollo broaster|arepas|hamburguesas el|salchipapas|perros calientes)\b/i.test(n)) return false
          if (isNonTouristFacility(r.tags) || isNonTouristFacility({ name: r.name })) return false
          return true
        })
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
          cuisine: feature.properties.cuisine ?? null,
          address: feature.properties.street ?? null,
          tags: feature.properties
        }
      })
      .filter(Boolean)
      .filter(r => {
        const n = r.name.toLowerCase()
        if (/\b(chino|chifa|hong\s*kung|asia|oriental|confucio)\b/i.test(n)) return false
        if (/\b(comida r[áa]pida|frituras|panader[íi]a|asadero de pollo|pollo broaster|arepas|hamburguesas el|salchipapas|perros calientes)\b/i.test(n)) return false
        if (isNonTouristFacility(r.tags) || isNonTouristFacility({ name: r.name })) return false
        return true
      })
      .slice(0, 10)
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

export function arePlacesSimilar(a, b) {
  if (!a || !b) return false
  const strA = typeof a === 'string' ? a : (a?.name || '')
  const strB = typeof b === 'string' ? b : (b?.name || '')
  if (!strA || !strB) return false

  const clean = (str) =>
    str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const normA = clean(strA)
  const normB = clean(strB)
  if (!normA || !normB) return false
  if (normA === normB) return true

  // Direct containment for sufficiently long strings
  if (normA.length >= 8 && normB.length >= 8 && (normA.includes(normB) || normB.includes(normA))) {
    return true
  }

  // Strip cross-typology prefixes to extract geographic/landmark core
  const stripPrefix = (str) =>
    str.replace(
      /^(?:gran\s+|nuevo\s+|nueva\s+|antiguo\s+|antigua\s+)?(?:ecoparque|parque\s+ecologico|parque\s+cultural|centro\s+cultural|parque\s+rotonda|plaza\s+rotonda|casa\s+museo|casa|sala|sitio|centro|iglesia|catedral|basilica|templo|parroquia|santuario|plaza|parque|museo|monumento|estatua|busto|obelisco|malecon|mirador|playa|teatro|jardin|puerto|rotonda|glorieta|urbanizacion|paseo|boulevard|reserva\s+natural|reserva)\s+(?:de\s+|del?\s+|y\s+|la\s+|las\s+|el\s+|los\s+|a\s+la\s+|al\s+)?/gi,
      ''
    ).replace(
      /\s+(?:de\s+|en\s+)?(?:barranquilla|santa\s+marta|cartagena|bogota|medellin|cali|colombia)$/gi,
      ''
    ).trim()

  const pA = stripPrefix(normA)
  const pB = stripPrefix(normB)

  if (pA && pB) {
    if (pA === pB && pA.length >= 4) return true
    if (pA.length >= 5 && pB.length >= 5 && (pA.includes(pB) || pB.includes(pA))) return true
  }

  // Check token overlap for distinctive words (length >= 4)
  const stopWords = new Set(['para', 'sobre', 'hacia', 'entre', 'donde', 'desde', 'hasta', 'norte', 'sur', 'este', 'oeste', 'centro', 'sector', 'ciudad'])
  const tokensA = normA.split(' ').filter(t => t.length >= 4 && !stopWords.has(t))
  const tokensB = normB.split(' ').filter(t => t.length >= 4 && !stopWords.has(t))
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const common = tokensA.filter(t => tokensB.includes(t))
    if (common.length >= 2 && (common.length / Math.min(tokensA.length, tokensB.length) >= 0.75)) {
      return true
    }
  }

  return false
}


