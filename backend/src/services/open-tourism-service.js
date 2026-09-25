import { GeoCache } from './geoCache.js'

const USER_AGENT = 'VIBETOURS/1.0 (https://vibetours.app; ops@vibetours.app)'
const placeEnrichmentCache = new GeoCache(24 * 60 * 60 * 1000, 600)
const cityGuideCache = new GeoCache(24 * 60 * 60 * 1000, 200)
const cityLandmarksDiscoveryCache = new GeoCache(24 * 60 * 60 * 1000, 300)

const ICONIC_TOURIST_PARK_KEYWORDS = /\b(ronda|lineal|malec[oó]n|sim[oó]n\s+bol[ií]var|bol[ií]var|principal|central|mayor|nacional|natural|ecol[oó]gico|cultural|bot[aá]nico|arqueol[oó]gico|hist[oó]rico|museo|mirador|centenario|fundadores|santander|nari[nñ]o|caldas|sucre|c[oó]rdoba|del\s+agua|de\s+los\s+novios|de\s+la\s+paz|del\s+r[ií]o|tayrona|esp[ií]ritu\s+del\s+manglar|bicentenario|alameda)\b/i

const NEIGHBORHOOD_PARK_MARKERS = /\b(biosaludable|infantil|polideportivo|cancha|urbanizaci[oó]n|conjunto|etapa|manzana|lote|barrio|comuna|vereda|glorieta|separador|parqueadero|zona\s+verde|circunvalar|\d+\s+con\s+[a-záéíóúñ0-9]+|calle\s+\d+|carrera\s+\d+|cra\.?\s*\d+|cll\.?\s*\d+|las\s+golondrinas|de\s+los\s+sue[nñ]os|balboa|brizalia)\b/i

const HIGH_VALUE_LANDMARK_KEYWORDS = /\b(ronda\s+del|malec[oó]n|muelle\s+tur[ií]stico|muelle|catedral|bas[ií]lica|santuario|museo|monumento|castillo|fuerte|muralla|mirador|pueblito|plaza\s+cultural|pasaje\s+del\s+sol|pasaje\s+comercial|pasaje\s+de\s+las\s+flores|centro\s+hist[oó]rico|puente\s+met[aá]lico|puente\s+segundo\s+centenario|jard[ií]n\s+bot[aá]nico|teatro|palacio|acueducto|telef[eé]rico|acantilado|volc[aá]n|ci[eé]naga|bah[ií]a|isla|playa)\b/i

const LOW_QUALITY_FOOD_MARKERS = /\b(comidas?\s+r[aá]pidas?|fast\s*food|frituras?|fritanga|perros?\s+calientes?|salchipapas?|asadero\s+de\s+pollo|pollo\s+broaster|arepas?\s+rellenas?|empanadas?|panader[ií]a|reposter[ií]a|helader[ií]a\s+de\s+barrio|kiosko|kiosco|puesto\s+de|billar|estadero|tienda|granero|fruver|supermercado|minimercado|droguer[ií]a|cafeter[ií]a\s+escolar|el\s+lobo|minuto\s+de\s+dios|canta\s+claro)\b/i

function sanitizeVoiceText(text = '') {
  return String(text || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitIntoSentences(text = '') {
  return sanitizeVoiceText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18)
}

function normalizeTextKey(text = '') {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isNeighborhoodOrMinorPark(name = '', tags = {}, wikipediaTrusted = false) {
  const cleanName = String(name || '').trim()
  if (!cleanName) return true
  if (NEIGHBORHOOD_PARK_MARKERS.test(cleanName)) return true

  const mergedTags = { ...(tags || {}) }
  const hasDedicatedWikidata = Boolean(mergedTags.wikidata || mergedTags['brand:wikidata'])
  if (HIGH_VALUE_LANDMARK_KEYWORDS.test(cleanName)) return false

  const isParkNamed = /^(parque|plazoleta|zona\s+recreativa)\b/i.test(cleanName) || String(mergedTags.leisure || '').toLowerCase() === 'park'
  if (isParkNamed) {
    if (ICONIC_TOURIST_PARK_KEYWORDS.test(cleanName) || hasDedicatedWikidata) return false
    return true
  }

  if (wikipediaTrusted) return false
  const hasTourismTag = ['attraction', 'museum', 'viewpoint', 'theme_park', 'zoo', 'aquarium', 'gallery', 'artwork'].includes(
    String(mergedTags.tourism || '').toLowerCase()
  )
  const hasHistoricTag = Boolean(mergedTags.historic)
  if (hasTourismTag || hasHistoricTag) return false
  return false
}

export function isLowQualityOrFastFoodVenue(name = '', tags = {}) {
  const cleanName = String(name || '').trim()
  if (!cleanName) return true
  if (LOW_QUALITY_FOOD_MARKERS.test(cleanName)) return true
  const amenity = String(tags?.amenity || '').toLowerCase()
  if (amenity === 'fast_food') return true
  return false
}

export function scoreTouristAttraction(place = {}, wikipediaKeySet = new Set()) {
  const name = String(place.name || place.nombre || '').trim()
  if (!name) return -1000
  const tags = { ...(place.tags || {}), ...(place.rawTags || {}) }
  const normName = normalizeTextKey(name)

  const isWikiMatched =
    place.fromWikipediaDiscovery === true ||
    wikipediaKeySet.has(normName) ||
    Array.from(wikipediaKeySet).some((wk) => wk.length >= 6 && (normName.includes(wk) || wk.includes(normName)))

  if (isNeighborhoodOrMinorPark(name, tags, isWikiMatched)) {
    return -120
  }

  let score = 10
  if (isWikiMatched) score += 120
  if (tags.wikidata || tags.wikipedia) score += 90
  if (HIGH_VALUE_LANDMARK_KEYWORDS.test(name)) score += 75

  const tourism = String(tags.tourism || '').toLowerCase()
  const historic = String(tags.historic || '').toLowerCase()
  const amenity = String(tags.amenity || '').toLowerCase()
  if (['attraction', 'museum', 'viewpoint', 'theme_park', 'zoo', 'gallery'].includes(tourism)) score += 65
  if (['monument', 'memorial', 'cathedral', 'castle', 'fort', 'archaeological_site', 'heritage'].includes(historic)) score += 65
  if (['arts_centre', 'theatre', 'ferry_terminal'].includes(amenity)) score += 45
  if (ICONIC_TOURIST_PARK_KEYWORDS.test(name)) score += 50
  if (tags.opening_hours || tags.website || tags.image || tags.wikimedia_commons) score += 20

  return score
}

export function rankAndFilterTouristAttractions(places = [], wikipediaLandmarks = []) {
  const wikiSet = new Set(
    (wikipediaLandmarks || []).map((item) => normalizeTextKey(typeof item === 'string' ? item : item?.name || '')).filter(Boolean)
  )

  const scored = (places || [])
    .filter((p) => p && (p.name || p.nombre))
    .map((p) => ({
      ...p,
      touristScore: scoreTouristAttraction(p, wikiSet)
    }))

  const highQuality = scored.filter((p) => p.touristScore > 0)
  const sourceList = highQuality.length >= 3 ? highQuality : scored.filter((p) => !NEIGHBORHOOD_PARK_MARKERS.test(p.name || ''))

  const sorted = sourceList.sort((a, b) => b.touristScore - a.touristScore)
  const deduped = []
  for (const item of sorted) {
    const itemName = String(item.name || item.nombre || '').trim()
    const itemCity = String(item.city || '').trim()
    if (!deduped.some((existing) => arePlaceNamesSemanticallySame(existing.name || existing.nombre, itemName, itemCity))) {
      deduped.push(item)
    }
  }
  return deduped
}

export function scoreTouristRestaurant(rest = {}) {
  const name = String(rest.name || rest.nombre || '').trim()
  if (!name || isLowQualityOrFastFoodVenue(name, rest.tags || rest.rawTags)) return -200
  const tags = { ...(rest.tags || {}), ...(rest.rawTags || {}) }

  let score = 20
  if (tags.cuisine) score += 35
  if (tags.website || tags['contact:website'] || tags['contact:instagram']) score += 25
  if (tags.opening_hours) score += 20
  if (/\b(restaurante|parrilla|asados|marisquer[ií]a|cevicher[ií]a|gastrobar|bistro|cocina|campestre|mercado\s+gastron[oó]mico|terraza|caim[aá]n|pasaje\s+del\s+sol)\b/i.test(name)) {
    score += 25
  }
  return score
}

export function rankAndFilterTouristRestaurants(restaurants = []) {
  return (restaurants || [])
    .filter((r) => r && (r.name || r.nombre) && !isLowQualityOrFastFoodVenue(r.name || r.nombre, r.tags || r.rawTags))
    .map((r) => ({ ...r, culinaryScore: scoreTouristRestaurant(r) }))
    .filter((r) => r.culinaryScore > 0)
    .sort((a, b) => b.culinaryScore - a.culinaryScore)
}

function cleanExtractedLandmarkCandidate(raw = '', city = '') {
  let cleaned = String(raw || '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^/]*\/>/gi, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:Archivo|File|Imagen|Image|Categoría|Category):[^\]]+\]\]/gi, '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/^[\s*•\-–—:;,.]+/, '')
    .trim()

  cleaned = cleaned
    .split(/\s*(?:,\s*(?:ubicad|situad|zona\s+rosa|donde|el\s+cual|la\s+cual|es\s+un|es\s+el|es\s+la|sede\s+de|conocid)|;\s*|\.\s+|\s+en\s+el\s+barrio)/i)[0]
    .replace(/^(?:el|la|los|las|un|una)\s+/i, (match) => {
      return /^(?:el\s+puente|la\s+ronda|la\s+catedral|el\s+muelle|el\s+malec[oó]n)/i.test(cleaned)
        ? ''
        : match
    })
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[.;:,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length < 5 || cleaned.length > 68) return ''
  const normCity = normalizeTextKey(city)
  const normCleaned = normalizeTextKey(cleaned)
  if (!normCleaned || normCleaned === normCity) return ''

  if (/\b(municipio|departamento|colombia|habitantes|kil[oó]metros|temperatura|universidad|colegio|cl[ií]nica|hospital|aeropuerto|terminal\s+de\s+transporte|alcald[ií]a|gobernaci[oó]n|peri[oó]dico|emisora|canal|elecciones|dane| siglo\s+[ivx]+|am[eé]rica\s+latina)\b/i.test(cleaned)) {
    return ''
  }

  const hasLandmarkPrefix = /^(ronda\b|parque\b|catedral\b|iglesia\b|bas[ií]lica\b|muelle\b|malec[oó]n\b|mirador\b|museo\b|monumento\b|plaza\b|plazoleta\b|puente\b|pasaje\b|pueblito\b|avenida\s+primera\b|centro\s+hist[oó]rico\b|centro\s+cultural\b|castillo\b|fuerte\b|jard[ií]n\b|teatro\b|antiguo\s+mercado\b|mercado\s+p[uú]blico\b)/i.test(cleaned)
  if (!hasLandmarkPrefix && !HIGH_VALUE_LANDMARK_KEYWORDS.test(cleaned)) {
    return ''
  }

  if (NEIGHBORHOOD_PARK_MARKERS.test(cleaned)) return ''
  return cleaned
}

function classifyDiscoveredLandmark(name = '') {
  const lower = String(name).toLowerCase()
  if (/\b(museo|centro\s+cultural|pueblito|plaza\s+cultural|teatro)\b/.test(lower)) return 'culture'
  if (/\b(ronda|parque|jard[ií]n|ci[eé]naga|reserva|ecoparque)\b/.test(lower)) return 'park'
  if (/\b(mirador|muelle|malec[oó]n|puente|avenida\s+primera)\b/.test(lower)) return 'viewpoint'
  if (/\b(playa|isla|bah[ií]a)\b/.test(lower)) return 'beach'
  return 'historic'
}

function capitalizeFirstLetter(str = '') {
  const trimmed = String(str || '').trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function parseLandmarksFromWikitext(wikitext = '', city = '') {
  if (!wikitext) return []
  const candidates = []

  const sectionRegex = /==+\s*(Turismo|Sitios de inter[eé]s|Lugares de inter[eé]s|Atractivos tur[ií]sticos|Patrimonio|Cultura|Religi[oó]n|Arquitectura|Parques|Monumentos)\s*==+([\s\S]*?)(?=\n==[^=]|$)/gi
  let match
  const targetBlocks = []
  while ((match = sectionRegex.exec(wikitext)) !== null) {
    targetBlocks.push({ title: match[1].toLowerCase(), body: match[2] })
  }
  targetBlocks.sort((a, b) => {
    const aIsTourism = /turismo|sitios|lugares|atractivos|patrimonio/.test(a.title) ? 0 : 1
    const bIsTourism = /turismo|sitios|lugares|atractivos|patrimonio/.test(b.title) ? 0 : 1
    return aIsTourism - bIsTourism
  })

  const combinedText = targetBlocks.length > 0
    ? targetBlocks.map((b) => b.body).join('\n')
    : wikitext.slice(0, 18000)

  const inlinePattern = /\b((?:[Pp]arque(?:\s+[Ll]ineal)?|[Rr]onda|[Mm]alec[oó]n|[Mm]uelle(?:\s+[Tt]ur[ií]stico)?|[Cc]atedral|[Bb]as[ií]lica|[Mm]useo|[Mm]onumento|[Pp]laza(?:\s+[Cc]ultural)?|[Mm]irador|[Pp]asaje|[Pp]ueblito|[Cc]astillo|[Ff]uerte|[Pp]uente(?:\s+[Mm]et[aá]lico|\s+[Ss]egundo\s+[Cc]entenario)?|[Aa]venida\s+Primera|[Aa]ntiguo\s+[Mm]ercado\s+[Pp][uú]blico)\s+(?:de\s+|del\s+|la\s+|las\s+|los\s+|al\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,42})/g
  let inlineMatch
  while ((inlineMatch = inlinePattern.exec(combinedText)) !== null) {
    const cleaned = cleanExtractedLandmarkCandidate(capitalizeFirstLetter(inlineMatch[1]), city)
    if (cleaned) candidates.push(capitalizeFirstLetter(cleaned))
  }

  const bulletLines = combinedText.match(/^\s*[*•]\s*.+$/gm) || []
  for (const line of bulletLines) {
    const cleaned = cleanExtractedLandmarkCandidate(line, city)
    if (cleaned) candidates.push(capitalizeFirstLetter(cleaned))
  }

  return candidates
}

async function fetchCityWikipediaWikitext(city = '', country = '', lang = 'es') {
  const queries = [
    country ? `${city} (${country})` : '',
    city
  ].filter(Boolean)

  for (const q of queries) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(3500)
      })
      if (!searchRes.ok) continue
      const searchData = await searchRes.json()
      const hit = (searchData?.query?.search || []).find((item) => {
        const normTitle = normalizeTextKey(item.title)
        const normTarget = normalizeTextKey(city)
        return normTitle === normTarget || normTitle.startsWith(`${normTarget} `)
      }) || searchData?.query?.search?.[0]

      if (!hit?.title) continue

      const parseUrl = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(hit.title)}&prop=wikitext&format=json&origin=*`
      const parseRes = await fetch(parseUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(4000)
      })
      if (!parseRes.ok) continue
      const parseData = await parseRes.json()
      const wikitext = parseData?.parse?.wikitext?.['*']
      if (wikitext) return wikitext
    } catch {
      // Try next query
    }
  }
  return ''
}

async function fetchWikipediaGeoSearchLandmarks(lat, lon, city = '', lang = 'es') {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return []
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${Number(lat)}|${Number(lon)}&gsradius=10000&gslimit=35&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.query?.geosearch || [])
      .map((item) => {
        const cleaned = cleanExtractedLandmarkCandidate(item.title, city)
        if (!cleaned) return null
        return {
          name: cleaned,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          source: 'wikipedia-geosearch'
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

const GENERIC_PLACE_MODIFIERS = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e', 'a', 'al', 'con', 'para', 'por', 'sobre', 'un', 'una',
  'metalico', 'turistico', 'turistica', 'principal', 'central', 'mayor', 'metropolitano', 'metropolitana',
  'municipal', 'distrital', 'nacional', 'departamental', 'regional', 'norte', 'sur', 'este', 'oeste', 'oriental', 'occidental',
  'antiguo', 'antigua', 'nuevo', 'nueva', 'gran', 'pequeno', 'pequena', 'primer', 'primero', 'primera',
  'simon', 'general', 'libertador', 'doctor', 'san', 'santa', 'santo', 'nuestra', 'senora', 'ciudad', 'municipio'
])

const EPONYMOUS_HERO_TOKENS = new Set([
  'bolivar', 'santander', 'narino', 'caldas', 'sucre', 'cordoba', 'mutis', 'rojas', 'pinilla',
  'garcia', 'rovira', 'jeronimo', 'sagrada', 'familia', 'chiquinquira', 'morrorico'
])

function getEntityFamily(name = '') {
  const lower = normalizeTextKey(name)
  if (/\b(restaurante|restaurant|vegetariano|vegano|creperia|pizzeria|parrilla|asador|asados|bistro|gastrobar|cevicheria|cebicheria|marisqueria|trattoria|steakhouse|piqueteadero|comedor|cocina|sazon|fogon|taqueria|cafeteria|cafe|heladeria|pasteleria|panaderia)\b/.test(lower)) return 'food'
  if (/\b(museo|museum|galeria|centro cultural|casa museo|quinta)\b/.test(lower)) return 'museum'
  if (/\b(catedral|basilica|iglesia|parroquia|capilla|santuario|convento|ermita|templo)\b/.test(lower)) return 'religious'
  if (/\b(ronda|malecon|muelle|embarcadero|costanera|bulevar del rio|paseo del rio)\b/.test(lower)) return 'riverwalk'
  if (/\b(puente)\b/.test(lower)) return 'bridge'
  if (/\b(parque|jardin botanico|ecoparque|reserva)\b/.test(lower)) return 'park'
  if (/\b(plaza|plazoleta|pasaje|pueblito|mercado)\b/.test(lower)) return 'plaza'
  if (/\b(mirador|ventana|cerro|teleferico)\b/.test(lower)) return 'viewpoint'
  if (/\b(playa|isla|cayo|bahia|ensenada)\b/.test(lower)) return 'beach'
  return 'landmark'
}

export function extractDistinctivePlaceTokens(name = '', city = '') {
  const cityTokens = new Set(normalizeTextKey(city).split(/\s+/).filter(Boolean))
  return normalizeTextKey(name)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !GENERIC_PLACE_MODIFIERS.has(token) && !cityTokens.has(token))
}

export function arePlaceNamesSemanticallySame(nameA = '', nameB = '', city = '') {
  const normA = normalizeTextKey(nameA)
  const normB = normalizeTextKey(nameB)
  if (!normA || !normB) return false
  if (normA === normB) return true

  const famA = getEntityFamily(nameA)
  const famB = getEntityFamily(nameB)
  if ((famA === 'food') !== (famB === 'food')) return false

  const tokensA = extractDistinctivePlaceTokens(nameA, city)
  const tokensB = extractDistinctivePlaceTokens(nameB, city)
  if (tokensA.length === 0 || tokensB.length === 0) {
    return normA.includes(normB) || normB.includes(normA)
  }

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const intersection = tokensA.filter((t) => setB.has(t))

  // 1. Exact token match after stripping intermediate modifiers (e.g. "Puente Metálico Gustavo Rojas Pinilla" vs "Puente Gustavo Rojas Pinilla", "Parque Simón Bolívar" vs "Parque Bolívar")
  if (intersection.length === Math.min(setA.size, setB.size)) {
    const sameFamilyOrCompatible =
      famA === famB ||
      (famA === 'park' && famB === 'plaza') ||
      (famA === 'plaza' && famB === 'park') ||
      (famA === 'riverwalk' && famB === 'park') ||
      (famA === 'park' && famB === 'riverwalk')
    if (sameFamilyOrCompatible) return true
  }

  // 2. Shared 2+ non-generic proper tokens (e.g. "Gustavo Rojas Pinilla", "San Jerónimo", "Sagrada Familia")
  const nonTypeIntersection = intersection.filter(
    (t) => !['parque', 'plaza', 'museo', 'casa', 'puente', 'catedral', 'iglesia', 'pasaje', 'ronda', 'malecon', 'mirador', 'restaurante', 'arte'].includes(t)
  )
  if (nonTypeIntersection.length >= 2) return true

  // 3. Shared eponymous hero/patron (e.g. "Parque Bolívar" and "Museo Casa Bolívar" or "Plaza Bolívar" in the same tour)
  if (nonTypeIntersection.length === 1 && EPONYMOUS_HERO_TOKENS.has(nonTypeIntersection[0])) {
    return true
  }

  return false
}

export function inferStopSubcategory(place = {}) {
  const name = String(place.name || place.nombre || '').trim()
  const rawCat = String(place.category || place.categoria || place.type || '').toLowerCase()
  const tags = { ...(place.tags || {}), ...(place.rawTags || {}) }
  const amenity = String(tags.amenity || '').toLowerCase()
  const tourism = String(tags.tourism || '').toLowerCase()
  const historic = String(tags.historic || '').toLowerCase()
  const leisure = String(tags.leisure || '').toLowerCase()
  const lower = normalizeTextKey(name)

  if (
    /\b(caf[ée]|cafeter[ií]a|panader[ií]a|pasteler[ií]a|reposter[ií]a|helader[ií]a|postres|dulcer[ií]a|chocolater[ií]a)\b/i.test(name) ||
    amenity === 'cafe' ||
    rawCat === 'cafe'
  ) {
    return 'cafe'
  }
  if (
    /\b(restaurante|restaurant|vegetariano|vegano|creper[ií]a|pizzer[ií]a|parrilla|asador|asados|bistro|gastrobar|cevicher[ií]a|cebicher[ií]a|marisquer[ií]a|trattoria|steakhouse|piqueteadero|comedor|cocina|saz[oó]n|fog[oó]n|taquer[ií]a|sushi|wok|mercado\s+gastron[oó]mico|caim[aá]n\s+del\s+r[ií]o)\b/i.test(name) ||
    ['restaurant', 'food_court', 'bar', 'pub'].includes(amenity) ||
    ['restaurant', 'food', 'gastronomic'].includes(rawCat)
  ) {
    return 'restaurant'
  }
  if (/\b(castillo|fuerte|fortaleza|muralla|baluarte|bater[ií]a)\b/i.test(name) || ['castle', 'fort', 'citywalls'].includes(historic)) {
    return 'fortress'
  }
  if (
    /\b(museo|museum|casa\s+museo|galer[ií]a|centro\s+cultural|quinta\s+de|planetario|acuario)\b/i.test(name) ||
    ['museum', 'gallery', 'aquarium'].includes(tourism) ||
    rawCat === 'museum'
  ) {
    return 'museum'
  }
  if (
    /\b(catedral|bas[ií]lica|iglesia|parroquia|capilla|santuario|convento|ermita|templo|monasterio)\b/i.test(name) ||
    ['cathedral', 'church', 'monastery'].includes(historic) ||
    amenity === 'place_of_worship' ||
    rawCat === 'religious'
  ) {
    return 'religious'
  }
  if (/\b(ronda|malec[oó]n|muelle|embarcadero|costanera|bulevar\s+del\s+r[ií]o|paseo\s+del\s+r[ií]o|avenida\s+del\s+r[ií]o)\b/i.test(name)) {
    return 'riverwalk'
  }
  if (/\b(playa|isla|cayo|bah[ií]a|ensenada|punta|bocana)\b/i.test(name) || rawCat === 'beach') {
    return 'beach'
  }
  if (
    /\b(jard[ií]n\s+bot[aá]nico|ecoparque|reserva|parque\s+natural|parque\s+nacional|parque\s+ecol[oó]gico|parque\s+del\s+agua|parque\s+de\s+las\s+cigarras|parque\s+la\s+flora|ca[nñ][oó]n|ci[eé]naga|volc[aá]n|cascada|zool[oó]gico|bioparque)\b/i.test(name) ||
    tourism === 'zoo' ||
    tourism === 'theme_park'
  ) {
    return 'nature_park'
  }
  if (/\b(mirador|viewpoint|ventana|cerro\s+del\s+sant[ií]simo|telef[eé]rico|farall[oó]n)\b/i.test(name) || tourism === 'viewpoint' || rawCat === 'viewpoint') {
    return 'viewpoint'
  }
  if (/\b(puente|monumento|estatua|escultura|obelisco|arco|torre\s+del\s+reloj|reloj\s+p[uú]blico)\b/i.test(name) || historic === 'monument') {
    return 'bridge_monument'
  }
  if (/\b(plaza|plazoleta|pasaje|pueblito|mercado\s+p[uú]blico|centro\s+hist[oó]rico|calle|barrio)\b/i.test(name)) {
    return 'plaza'
  }
  if (/\b(parque)\b/i.test(lower) || leisure === 'park' || rawCat === 'park') {
    return 'urban_park'
  }
  return 'plaza'
}

export function estimateRealisticStopDurationMinutes(place = {}, stopIndex = 0) {
  const name = String(place.name || place.nombre || '').trim()
  const subcat = inferStopSubcategory(place)
  const hash = Math.abs(
    name.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0) + stopIndex * 17
  )

  const durationPools = {
    nature_park: [80, 90, 105, 120],
    beach: [90, 105, 120],
    fortress: [70, 80, 90],
    museum: [60, 70, 75, 85, 90],
    restaurant: [60, 65, 70, 75],
    riverwalk: [50, 55, 60, 70],
    viewpoint: [40, 45, 50, 55],
    urban_park: [35, 40, 45, 50],
    cafe: [35, 40, 45],
    religious: [30, 35, 40, 45],
    plaza: [30, 35, 40, 45],
    bridge_monument: [20, 25, 30, 35]
  }

  const pool = durationPools[subcat] || [35, 40, 50, 60]
  return pool[hash % pool.length]
}

export async function discoverDynamicCityLandmarks(city = '', country = '', lat = null, lon = null, lang = 'es') {
  const cleanCity = String(city || '').trim()
  if (!cleanCity) return []

  const cacheKey = `wiki_landmarks_${lang}_${normalizeTextKey(cleanCity)}_${normalizeTextKey(country)}`
  const cached = cityLandmarksDiscoveryCache.get(cacheKey)
  if (cached) return cached

  const [wikitext, geoItems] = await Promise.all([
    fetchCityWikipediaWikitext(cleanCity, country, lang),
    fetchWikipediaGeoSearchLandmarks(lat, lon, cleanCity, lang)
  ])

  const geoMap = new Map()
  for (const g of geoItems) {
    geoMap.set(normalizeTextKey(g.name), g)
  }

  const parsedFromArticle = parseLandmarksFromWikitext(wikitext, cleanCity)
  const combinedRaw = [...parsedFromArticle, ...geoItems.map((g) => g.name)]

  const hasCenterCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
  const rawList = []
  let idx = 0
  for (const name of combinedRaw) {
    if (isNeighborhoodOrMinorPark(name, {}, false)) continue
    const key = normalizeTextKey(name)
    if (!key) continue
    const isDuplicate = rawList.some((existing) => arePlaceNamesSemanticallySame(existing.name, name, cleanCity))
    if (isDuplicate) continue

    const matchedGeo = geoMap.get(key)
    const angle = (idx * 137.5 * Math.PI) / 180
    const radiusDeg = 0.0022 + (idx % 4) * 0.0008
    const fallbackLat = hasCenterCoords ? Number((Number(lat) + Math.cos(angle) * radiusDeg).toFixed(6)) : null
    const fallbackLon = hasCenterCoords ? Number((Number(lon) + Math.sin(angle) * radiusDeg).toFixed(6)) : null
    idx++

    const item = {
      name,
      category: classifyDiscoveredLandmark(name),
      subcategory: inferStopSubcategory({ name }),
      fromWikipediaDiscovery: true,
      latitude: matchedGeo?.latitude ?? fallbackLat,
      longitude: matchedGeo?.longitude ?? fallbackLon,
      source: matchedGeo ? 'wikipedia-geosearch' : 'wikipedia-tourism'
    }
    item.priorityScore = scoreTouristAttraction(item) + (/\b(ronda\s+del|malec[oó]n|catedral|muelle|museo|sim[oó]n\s+bol[ií]var|plaza\s+cultural|pasaje\s+del\s+sol|pueblito|castillo)\b/i.test(name) ? 45 : 0)
    rawList.push(item)
  }

  rawList.sort((a, b) => b.priorityScore - a.priorityScore)

  // Diversify so parks don't monopolize the top slots before cathedrals, piers, and museums
  const landmarks = []
  const categoryCount = {}
  const deferred = []
  for (const item of rawList) {
    const count = categoryCount[item.category] || 0
    if (item.category === 'park' && count >= 2) {
      deferred.push(item)
    } else {
      categoryCount[item.category] = count + 1
      landmarks.push(item)
    }
  }
  landmarks.push(...deferred)

  if (landmarks.length > 0) {
    cityLandmarksDiscoveryCache.set(cacheKey, landmarks)
  }
  return landmarks
}

function extractOsmMetadata(place = {}) {
  const tags = { ...(place.tags || {}), ...(place.rawTags || {}) }
  return {
    wikidataId: String(tags.wikidata || tags['brand:wikidata'] || '').trim(),
    wikipediaTag: String(tags.wikipedia || '').trim(),
    openingHours: String(tags.opening_hours || '').trim(),
    architect: String(tags.architect || tags['architect:name'] || '').trim(),
    startDate: String(tags.start_date || tags.year_of_construction || '').trim(),
    cuisine: String(tags.cuisine || '').replace(/;/g, ', ').trim(),
    heritage: Boolean(tags.heritage || tags['heritage:operator'] || tags.unesco),
    fee: String(tags.fee || '').toLowerCase(),
    website: String(tags.website || tags['contact:website'] || '').trim()
  }
}

function isGenericMunicipalitySummary(summary = {}, placeName = '', city = '') {
  if (!summary) return true
  const normTitle = normalizeTextKey(summary.title || '')
  const normCity = normalizeTextKey(city || '')
  const normPlace = normalizeTextKey(placeName || '')

  // Reject if the Wikipedia article title is simply the city or region name (e.g. "Bucaramanga", "Montería", "Santander")
  if (normCity && (normTitle === normCity || normTitle === `municipio de ${normCity}` || normTitle === `area metropolitana de ${normCity}` || normTitle === `historia de ${normCity}`)) {
    return true
  }

  // Reject if the extract or description talks about a municipality/capital instead of the specific POI
  const desc = String(summary.description || '').toLowerCase()
  const extract = String(summary.extract || '').toLowerCase()
  if (
    /\b(capital\s+del\s+departamento|municipio\s+colombiano|municipio\s+de\s+colombia|ciudad\s+colombiana|departamento\s+de\s+colombia)\b/i.test(desc) ||
    /^[^.]{0,65}\bes\s+un\s+municipio\s+(?:colombiano|de\s+)/i.test(extract) ||
    /^[^.]{0,65}\bes\s+la\s+capital\s+del\s+departamento/i.test(extract)
  ) {
    return true
  }

  // Require at least one distinctive non-city token overlap between placeName and the Wikipedia article title
  const placeTokens = extractDistinctivePlaceTokens(placeName, city)
  if (placeTokens.length > 0) {
    const hasOverlap = placeTokens.some((token) => normTitle.includes(token))
    if (!hasOverlap && normTitle !== normPlace) return true
  }

  return false
}

export async function fetchWikidataEntitySummary(wikidataId, lang = 'es') {
  if (!wikidataId || !/^Q\d+$/i.test(wikidataId)) return null

  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}&format=json&props=labels|descriptions|sitelinks&languages=${lang}|es|en&origin=*`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (!response.ok) return null

    const data = await response.json()
    const entity = data?.entities?.[wikidataId]
    if (!entity) return null

    const description =
      entity.descriptions?.[lang]?.value ||
      entity.descriptions?.es?.value ||
      entity.descriptions?.en?.value ||
      ''
    const wikiSiteKey = `${lang}wiki`
    const wikiTitle =
      entity.sitelinks?.[wikiSiteKey]?.title ||
      entity.sitelinks?.eswiki?.title ||
      entity.sitelinks?.enwiki?.title ||
      ''
    const resolvedLang = entity.sitelinks?.[wikiSiteKey]
      ? lang
      : entity.sitelinks?.eswiki
        ? 'es'
        : 'en'

    return { description, wikiTitle, resolvedLang }
  } catch {
    return null
  }
}

export async function fetchWikipediaSummaryByTitle(title, lang = 'es') {
  if (!title) return null

  try {
    const cleanTitle = String(title).replace(/^[a-z]{2}:/i, '').trim()
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (!response.ok) return null

    const summary = await response.json()
    if (!summary?.extract || summary.type === 'disambiguation') return null

    return {
      title: summary.title || cleanTitle,
      description: summary.description || '',
      extract: sanitizeVoiceText(summary.extract),
      imageUrl: summary.originalimage?.source || summary.thumbnail?.source || ''
    }
  } catch {
    return null
  }
}

async function searchWikipediaSummaryByQuery(query, lang = 'es', placeName = '', city = '') {
  if (!query) return null

  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=5&origin=*`
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (!response.ok) return null

    const data = await response.json()
    const hits = data?.query?.search || []
    for (const hit of hits) {
      if (!hit?.title) continue
      const candidateSummary = await fetchWikipediaSummaryByTitle(hit.title, lang)
      if (candidateSummary && !isGenericMunicipalitySummary(candidateSummary, placeName, city)) {
        return candidateSummary
      }
    }
    return null
  } catch {
    return null
  }
}

export async function enrichPlaceWithOpenData(place = {}, city = '', lang = 'es') {
  const placeName = String(place.name || place.nombre || '').trim()
  if (!placeName) return { ...place }

  const cacheKey = `open_poi_v2_${lang}_${city.toLowerCase()}_${placeName.toLowerCase()}`
  const cached = placeEnrichmentCache.get(cacheKey)
  if (cached) return { ...place, ...cached }

  const osmMeta = extractOsmMetadata(place)
  const subcategory = inferStopSubcategory(place)
  let wikiSummary = null
  let shortDescription = osmMeta.wikidataId ? '' : (place.shortDescription || '')

  // Do not search Wikipedia articles for local restaurants/cafes (which would match unrelated pages)
  const isDiningVenue = subcategory === 'restaurant' || subcategory === 'cafe'

  if (!isDiningVenue && osmMeta.wikipediaTag) {
    const [tagLang, tagTitle] = osmMeta.wikipediaTag.includes(':')
      ? osmMeta.wikipediaTag.split(':')
      : [lang, osmMeta.wikipediaTag]
    const candidate = await fetchWikipediaSummaryByTitle(tagTitle, tagLang || lang)
    if (candidate && !isGenericMunicipalitySummary(candidate, placeName, city)) {
      wikiSummary = candidate
    }
  }

  if (!isDiningVenue && !wikiSummary && osmMeta.wikidataId) {
    const wikidataInfo = await fetchWikidataEntitySummary(osmMeta.wikidataId, lang)
    if (wikidataInfo?.description && !/\b(municipio|capital\s+del\s+departamento)\b/i.test(wikidataInfo.description)) {
      shortDescription = wikidataInfo.description
    }
    if (wikidataInfo?.wikiTitle) {
      const candidate = await fetchWikipediaSummaryByTitle(wikidataInfo.wikiTitle, wikidataInfo.resolvedLang)
      if (candidate && !isGenericMunicipalitySummary(candidate, placeName, city)) {
        wikiSummary = candidate
      }
    }
  }

  if (!isDiningVenue && !wikiSummary) {
    const searchQuery = city ? `${placeName} ${city}` : placeName
    wikiSummary = await searchWikipediaSummaryByQuery(searchQuery, lang, placeName, city)
  }

  const cleanHistory =
    place.history && !/\bes\s+un\s+municipio\s+colombiano\b/i.test(place.history)
      ? place.history
      : ''

  const enrichedFields = {
    subcategory,
    history: wikiSummary?.extract || cleanHistory || '',
    shortDescription: shortDescription || wikiSummary?.description || '',
    imageUrl: place.imageUrl || wikiSummary?.imageUrl || '',
    images: Array.isArray(place.images) && place.images.length > 0
      ? place.images
      : (wikiSummary?.imageUrl ? [wikiSummary.imageUrl] : []),
    osmMeta
  }

  placeEnrichmentCache.set(cacheKey, enrichedFields)
  return { ...place, ...enrichedFields }
}

export async function fetchWikivoyageCityGuide(city = '', country = '', lang = 'es') {
  const cleanCity = String(city || '').trim()
  if (!cleanCity) return null

  const cacheKey = `city_guide_${lang}_${cleanCity.toLowerCase()}`
  const cached = cityGuideCache.get(cacheKey)
  if (cached) return cached

  let extract = ''
  try {
    const voyageUrl = `https://${lang}.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(cleanCity)}`
    const response = await fetch(voyageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (response.ok) {
      const data = await response.json()
      extract = sanitizeVoiceText(data?.extract || '')
    }
  } catch {
    // Fallback to Wikipedia summary below
  }

  if (!extract) {
    const wikiCity = await fetchWikipediaSummaryByTitle(cleanCity, lang)
    extract = wikiCity?.extract || ''
  }

  const guide = {
    cityHistory: extract || `${cleanCity} es uno de los destinos más representativos de ${country || 'la región'}, reconocido por su riqueza histórica, su arquitectura y su vibrante vida cultural.`,
    culturalContext: `En ${cleanCity}, la vida cotidiana gira en torno a sus espacios históricos, su gastronomía tradicional y la hospitalidad de su gente. Recorrer sus calles permite apreciar el contraste entre patrimonio y modernidad.`,
    recommendations: [
      `Lleva calzado cómodo e hidratación para recorrer los puntos patrimoniales de ${cleanCity}.`,
      'Aprovecha las primeras horas de la mañana o el final de la tarde para disfrutar de la mejor luz fotográfica y un clima más fresco.',
      'Consulta los horarios locales de museos y templos antes de ingresar y apoya a los artesanos y comercios locales.'
    ]
  }

  cityGuideCache.set(cacheKey, guide)
  return guide
}

function getDeterministicHash(str = '', offset = 0) {
  let h = offset * 31
  for (let i = 0; i < str.length; i++) {
    h = (h * 33 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function selectOpeningHook(placeName, subcategory, city, index = 0) {
  const hooksBySubcategory = {
    museum: [
      `¡Qué alegría llegar juntos a ${placeName}, uno de los guardianes más valiosos de la memoria artística y cultural de ${city}!`,
      `Frente a nosotros se abre ${placeName}, un recinto dedicado a preservar el arte, los relatos y el patrimonio que han forjado la identidad de ${city}.`,
      `Acabamos de llegar a ${placeName}, una parada cultural imprescindible donde cada sala revela una faceta única de la historia de ${city}.`,
      `Adentrémonos en ${placeName}, un espacio fascinante que resguarda piezas y colecciones fundamentales del legado de ${city}.`
    ],
    fortress: [
      `¡Mira la imponencia de ${placeName}! Estamos ante uno de los bastiones históricos más emblemáticos de ${city}.`,
      `Llegamos a ${placeName}, escenario de antiguos relatos defensivos y joya monumental del patrimonio de ${city}.`
    ],
    religious: [
      `Detengámonos frente a la fachada de ${placeName}, uno de los templos más admirados por su valor espiritual y arquitectónico en ${city}.`,
      `¡Bienvenido a ${placeName}! Este santuario histórico marca el pulso tradicional y patrimonial del centro de ${city}.`,
      `Observa la solemnidad y los detalles constructivos de ${placeName}, un referente arquitectónico e histórico de ${city}.`
    ],
    riverwalk: [
      `Siente la brisa junto al agua porque acabamos de entrar en ${placeName}, el corredor peatonal y paisajístico más querido de ${city}.`,
      `¡Qué vista tan especial! Estamos recorriendo ${placeName}, donde la naturaleza ribereña y la vida social de ${city} se dan la mano.`,
      `Caminemos sin prisa por ${placeName}, el paseo al aire libre por excelencia para contemplar el entorno acuático de ${city}.`
    ],
    nature_park: [
      `Respira profundo el aire puro: hemos llegado a ${placeName}, un verdadero santuario ecológico y de biodiversidad en ${city}.`,
      `¡Bienvenido a ${placeName}! Aquí los senderos arbolados, el sonido del agua y la flora nativa nos desconectan del ritmo urbano de ${city}.`
    ],
    urban_park: [
      `Hagamos una pausa bajo los árboles de ${placeName}, uno de los parques más tradicionales y llenos de vida ciudadana en ${city}.`,
      `¡Bienvenido a ${placeName}! Este pulmón verde en el corazón de ${city} ha sido punto de encuentro de generaciones enteras.`,
      `Disfruta la sombra y el ambiente acogedor de ${placeName}, un espacio abierto que refleja la cotidianidad auténtica de ${city}.`
    ],
    restaurant: [
      `¡Llegó el momento de consentir el paladar en ${placeName}, una parada gastronómica pensada para saborear la cocina de ${city}!`,
      `Hagamos una pausa deliciosa en ${placeName}, uno de los rincones culinarios recomendados en nuestra ruta por ${city}.`,
      `¡Prepárate para disfrutar de los mejores sabores en ${placeName}! Nada completa mejor un recorrido por ${city} que una buena experiencia en la mesa.`,
      `Bienvenido a ${placeName}, el lugar ideal de nuestro itinerario para sentarse con calma, recargar energías y degustar preparaciones frescas en ${city}.`
    ],
    cafe: [
      `El aroma nos guía hasta ${placeName}, el rincón perfecto para una pausa dulce o un buen café durante nuestro paseo por ${city}.`,
      `Hagamos un descanso reconfortante en ${placeName}, un espacio acogedor para conversar y probar delicias artesanales en ${city}.`
    ],
    viewpoint: [
      `¡Prepara tu cámara porque estamos en ${placeName}, una de las balconadas panorámicas más espectaculares de ${city}!`,
      `Mira hacia el horizonte desde ${placeName}: desde este punto privilegiado se domina toda la geografía y el perfil urbano de ${city}.`
    ],
    bridge_monument: [
      `Frente a nosotros se levanta ${placeName}, un hito de ingeniería y memoria urbana que identifica el paisaje de ${city}.`,
      `Contemplemos de cerca ${placeName}, una obra representativa que conecta la historia y el desarrollo de ${city}.`
    ],
    beach: [
      `Siente la brisa marina de ${placeName}, uno de los escenarios costeros más cautivadores de ${city}.`,
      `¡Mira ese horizonte! Estamos en ${placeName}, donde el mar y la energía caribeña de ${city} se encuentran.`
    ],
    plaza: [
      `¡Qué emoción estar aquí contigo! Pisamos el suelo histórico de ${placeName}, epicentro cívico y cultural de ${city}.`,
      `Detengámonos en el corazón de ${placeName}, un escenario abierto donde convergen la historia, el comercio y la tradición de ${city}.`,
      `¡Bienvenido a ${placeName}! Este punto neurálgico reúne la arquitectura tradicional y el espíritu acogedor de ${city}.`
    ]
  }

  const pool = hooksBySubcategory[subcategory] || hooksBySubcategory.plaza
  const pickIdx = (getDeterministicHash(placeName, index) + index) % pool.length
  return pool[pickIdx]
}

function buildFallbackCoreNarrative(placeName, subcategory, city, stopIndex = 0) {
  const narrativesBySubcategory = {
    museum: [
      `A través de sus exposiciones permanentes y temporales, este museo permite explorar de cerca las expresiones plásticas, reliquias y documentos que narran la evolución cultural de la región.`,
      `Sus salas ofrecen un recorrido íntimo por el talento artístico y el patrimonio histórico local, convirtiéndolo en una visita enriquecedora para comprender las raíces de ${city}.`,
      `Cada rincón del recinto está curado para despertar la curiosidad del visitante, exhibiendo obras y testimonios visuales que dialogan entre el pasado y el presente de ${city}.`
    ],
    fortress: [
      `Sus muros de piedra, pasadizos y emplazamiento estratégico fueron concebidos para vigilar el territorio, conservando intacta la huella de los siglos pasados.`
    ],
    religious: [
      `El interior del templo destaca por la serenidad de sus naves, sus detalles de arte sacro y la devoción histórica que lo ha acompañado desde su fundación en ${city}.`,
      `Su diseño arquitectónico, sus vitrales y sus altares conservan siglos de tradición religiosa y maestría artesanal en pleno corazón de ${city}.`
    ],
    riverwalk: [
      `A lo largo de sus senderos peatonales sombreados es común avistar fauna silvestre entre las copas de los árboles mientras las embarcaciones surcan tranquilamente las aguas.`,
      `Este corredor ecológico e integrador transformó la relación de ${city} con su río, ofreciendo jardines, plazoletas culturales y miradores ideales para caminar al aire libre.`
    ],
    nature_park: [
      `Sus jardines cuidadosamente conservados, espejos de agua y colecciones botánicas albergan decenas de especies nativas que brindan un microclima fresco durante todo el día.`
    ],
    urban_park: [
      `Rodeado de frondosos árboles, senderos adoquinados y edificios históricos, este parque es el escenario donde los habitantes de ${city} se reúnen a conversar y disfrutar de la brisa.`,
      `Sus zonas verdes, monumentos conmemorativos y bancas tradicionales invitan a bajar el ritmo del viaje y observar de cerca el pulso auténtico de la comunidad local.`
    ],
    restaurant: [
      `Su propuesta culinaria destaca por el cuidado en la selección de ingredientes frescos, ofreciendo recetas llenas de sabor y una atención cálida pensada para disfrutar sin prisas.`,
      `Tanto residentes como viajeros visitan este establecimiento por su ambiente acogedor, la sazón auténtica de su cocina y el esmero en la presentación de cada plato.`,
      `Es una parada ideal dentro del recorrido para sentarse a la mesa, degustar especialidades preparadas al momento y compartir una charla amena antes de continuar explorando ${city}.`
    ],
    cafe: [
      `Sus preparaciones recién hechas, bebidas aromáticas y repostería tradicional lo convierten en una parada obligada para recargar energías a mitad de jornada.`
    ],
    viewpoint: [
      `La elevación natural del terreno regala una vista despejada de 360 grados, ideal para apreciar el contraste entre las montañas, los barrios tradicionales y el trazado moderno de ${city}.`
    ],
    bridge_monument: [
      `Su estructura se ha consolidado como un símbolo visual de ${city}, siendo testigo del paso de generaciones y un punto fotográfico de gran carácter urbano.`
    ],
    beach: [
      `Sus aguas cálidas, su arena suave y el vaivén de las olas crean el escenario perfecto para desconectar frente al paisaje litoral de ${city}.`
    ],
    plaza: [
      `Su trazado abierto, enmarcado por construcciones de valor patrimonial y pasajes peatonales, ha sido testigo de los acontecimientos sociales y culturales más importantes de ${city}.`,
      `Al caminar por sus costados descubrirás el dinamismo comercial, las fachadas históricas y la calidez espontánea que distingue a la gente de ${city}.`
    ]
  }

  const pool = narrativesBySubcategory[subcategory] || narrativesBySubcategory.plaza
  const pickIdx = getDeterministicHash(placeName, stopIndex + 7) % pool.length
  return pool[pickIdx]
}

function buildMetadataSentence(osmMeta = {}, shortDescription = '', subcategory = 'plaza') {
  const details = []
  if (
    shortDescription &&
    !/\b(municipio\s+colombiano|capital\s+del\s+departamento|ciudad\s+de\s+colombia)\b/i.test(shortDescription)
  ) {
    details.push(`reconocido como ${shortDescription.toLowerCase()}`)
  }
  if (osmMeta.startDate) {
    details.push(`cuyos orígenes se remontan a ${osmMeta.startDate}`)
  }
  if (osmMeta.architect) {
    details.push(`concebido con el sello arquitectónico de ${osmMeta.architect}`)
  }
  if (osmMeta.heritage && subcategory !== 'restaurant' && subcategory !== 'cafe') {
    details.push('declarado bien de interés patrimonial e histórico')
  }
  if (osmMeta.cuisine) {
    details.push(`especializado en cocina ${osmMeta.cuisine}`)
  }
  if (details.length === 0) return ''
  return `Este sitio destaca especialmente por ser un referente ${details.join(', ')}.`
}

function buildObservationClosing(placeName, subcategory, osmMeta = {}, city = '', durationMinutes = 45, stopIndex = 0) {
  const scheduleNote = osmMeta.openingHours
    ? `Recuerda que su horario habitual es ${osmMeta.openingHours}.`
    : ''

  const closingsBySubcategory = {
    restaurant: [
      `Te sugiero dedicar unos ${durationMinutes} minutos para ordenar con tranquilidad, probar las recomendaciones de la casa y acompañar la comida con una bebida refrescante. ${scheduleNote}`,
      `Aprovecha esta parada de ${durationMinutes} minutos para descansar los pies, saborear cada preparación sin afanes y pedir sugerencias sobre el plato estrella del día. ${scheduleNote}`,
      `Disfruta de esta experiencia gastronómica durante unos ${durationMinutes} minutos; es el momento perfecto para deleitarse con los sabores locales de ${city}. ${scheduleNote}`
    ],
    cafe: [
      `Tómate unos ${durationMinutes} minutos para disfrutar de una bebida recién preparada y probar los acompañamientos artesanales del lugar. ${scheduleNote}`
    ],
    museum: [
      `Te recomiendo destinar alrededor de ${durationMinutes} minutos para recorrer sus salas con calma, leer las fichas curatoriales y apreciar las obras más emblemáticas de la colección. ${scheduleNote}`,
      `Dedica unos ${durationMinutes} minutos a explorar sus galerías interiores sin prisa, prestando especial atención a las piezas centrales que narran la memoria de ${city}. ${scheduleNote}`
    ],
    fortress: [
      `Reserva cerca de ${durationMinutes} minutos para ascender por sus rampas, explorar sus baluartes y contemplar las vistas defensivas sobre ${city}. ${scheduleNote}`
    ],
    religious: [
      `Dedica unos ${durationMinutes} minutos para ingresar en silencio, admirar la altura de sus bóvedas y observar los retablos y detalles artísticos del templo. ${scheduleNote}`,
      `Con unos ${durationMinutes} minutos podrás recorrer tanto el atrio exterior como las naves interiores para apreciar su atmósfera solemne. ${scheduleNote}`
    ],
    riverwalk: [
      `Te sugiero caminar durante unos ${durationMinutes} minutos por sus senderos junto al río, disfrutar de la brisa fresca y detenerte en sus miradores sobre el agua. ${scheduleNote}`,
      `Reserva alrededor de ${durationMinutes} minutos para pasear bajo la sombra de los árboles ribereños y tomar fotografías panorámicas del cauce. ${scheduleNote}`
    ],
    nature_park: [
      `Destina cerca de ${durationMinutes} minutos para recorrer sus senderos ecológicos, hidratarte bien y observar la riqueza de su flora y fauna nativa. ${scheduleNote}`
    ],
    urban_park: [
      `Dedica unos ${durationMinutes} minutos a pasear por sus senderos arbolados, descansar un momento en sus bancas y observar la vida local que rodea el parque. ${scheduleNote}`,
      `Con unos ${durationMinutes} minutos tendrás el tiempo ideal para recorrer sus jardines, admirar sus monumentos centrales y disfrutar del aire libre. ${scheduleNote}`
    ],
    viewpoint: [
      `Reserva unos ${durationMinutes} minutos para contemplar la panorámica completa de ${city} y capturar fotografías con la mejor luz del día. ${scheduleNote}`
    ],
    bridge_monument: [
      `Dedica entre 20 y ${durationMinutes} minutos para apreciarlo desde distintos ángulos fotográficos y observar cómo se integra con el paisaje de ${city}. ${scheduleNote}`
    ],
    beach: [
      `Disfruta durante unos ${durationMinutes} minutos de la brisa marina, el sonido de las olas y el ambiente relajado frente al mar. ${scheduleNote}`
    ],
    plaza: [
      `Dedica unos ${durationMinutes} minutos a recorrer el perímetro de la plaza, observar los detalles de sus fachadas y sentir el ambiente cívico de ${city}. ${scheduleNote}`,
      `Con unos ${durationMinutes} minutos podrás caminar con calma por sus pasajes peatonales y capturar excelentes fotografías del entorno urbano. ${scheduleNote}`
    ]
  }

  const pool = closingsBySubcategory[subcategory] || closingsBySubcategory.plaza
  const pickIdx = getDeterministicHash(placeName, stopIndex + 13) % pool.length
  return pool[pickIdx].trim()
}

export function buildSubcategoryActivities(placeName = '', subcategory = 'plaza', city = '') {
  const activitiesMap = {
    restaurant: [
      `Degustar los platos principales y especialidades culinarias de ${placeName}`,
      `Acompañar el almuerzo o cena con bebidas naturales o refrescos típicos de ${city}`,
      `Disfrutar de una pausa gastronómica relajada en mesa para recargar energías durante el tour`
    ],
    cafe: [
      `Probar el café de especialidad, infusiones o postres artesanales de ${placeName}`,
      `Hacer una pausa refrescante y conversar en un ambiente acogedor`,
      `Degustar amasijos o bocados tradicionales de la panadería y repostería local`
    ],
    museum: [
      `Recorrer las salas de exhibición permanente y colecciones artísticas de ${placeName}`,
      `Leer las reseñas históricas y apreciar de cerca las piezas patrimoniales más representativas`,
      `Consultar la programación de muestras temporales y talleres culturales del museo`
    ],
    fortress: [
      `Explorar las murallas, baluartes y corredores históricos de ${placeName}`,
      `Contemplar las vistas estratégicas de ${city} desde las plataformas superiores`,
      `Conocer las historias de defensa y arquitectura militar del recinto`
    ],
    religious: [
      `Apreciar la arquitectura sacra, altares, vitrales y cúpulas de ${placeName}`,
      `Recorrer las naves interiores con respeto y observar sus detalles de arte religioso`,
      `Fotografiar la fachada principal y el entorno histórico desde el atrio exterior`
    ],
    riverwalk: [
      `Caminar por el sendero ecológico y peatonal de ${placeName} junto al río`,
      `Observar la flora ribereña, aves locales y fauna silvestre que habita en los árboles`,
      `Contemplar el paisaje fluvial desde las barandas y plazoletas del corredor`
    ],
    nature_park: [
      `Recorrer los senderos ecológicos, puentes y espejos de agua de ${placeName}`,
      `Observar las especies botánicas nativas y aves del ecosistema local`,
      `Realizar una pausa de descanso y fotografía de naturaleza bajo la sombra`
    ],
    urban_park: [
      `Pasear bajo los árboles frondosos y senderos peatonales de ${placeName}`,
      `Observar las esculturas conmemorativas y el entorno urbano que enmarca el parque`,
      `Disfrutar del ambiente ciudadano y tomar un descanso al aire libre`
    ],
    viewpoint: [
      `Contemplar la vista panorámica de ${city} y su relieve montañoso desde ${placeName}`,
      `Tomar fotografías de gran angular del horizonte urbano y natural`,
      `Identificar desde la altura los principales puntos de referencia de la ciudad`
    ],
    bridge_monument: [
      `Admirar la estructura y diseño emblemático de ${placeName}`,
      `Capturar fotografías desde las mejores perspectivas peatonales del entorno`,
      `Conocer el significado histórico y urbano de este hito para ${city}`
    ],
    beach: [
      `Caminar por la orilla del mar y disfrutar de la brisa costera en ${placeName}`,
      `Relajarse frente al oleaje y contemplar el paisaje marítimo`,
      `Probar refrescos o pasabocas locales junto a la playa`
    ],
    plaza: [
      `Recorrer a pie el espacio abierto y los pasajes peatonales de ${placeName}`,
      `Observar la arquitectura circundante y la dinámica comercial y cultural del sector`,
      `Capturar fotografías del ambiente local y de los detalles emblemáticos del lugar`
    ]
  }

  return activitiesMap[subcategory] || activitiesMap.plaza
}

export function buildSubcategoryTips(placeName = '', subcategory = 'plaza', durationMinutes = 45, osmMeta = {}) {
  const tips = []
  if (osmMeta?.openingHours) {
    tips.push(`Horario reportado del lugar: ${osmMeta.openingHours}.`)
  }

  if (subcategory === 'restaurant') {
    tips.push(`Reserva alrededor de ${durationMinutes} minutos para ordenar y disfrutar tus platos sin prisa; pregunta al mesero por la recomendación o menú especial del día.`)
    tips.push('Si visitas en hora pico de almuerzo (12:30 p.m. a 2:00 p.m.) o cena, llegar unos minutos antes te asegurará la mejor mesa.')
  } else if (subcategory === 'cafe') {
    tips.push(`Dedica unos ${durationMinutes} minutos para disfrutar tu bebida o postre con calma y aprovechar para hidratarte.`)
  } else if (subcategory === 'museum' || subcategory === 'fortress') {
    tips.push(`Destina cerca de ${durationMinutes} minutos para recorrer todas las salas con calma; recuerda verificar si se permite fotografía sin flash en el interior.`)
    if (osmMeta?.fee === 'yes') {
      tips.push('Ten efectivo o tarjeta a mano para la boletería de ingreso.')
    }
  } else if (subcategory === 'religious') {
    tips.push(`Planea una visita de unos ${durationMinutes} minutos; se recomienda vestir de forma cómoda y respetuosa e ingresar en silencio si hay ceremonia en curso.`)
  } else if (subcategory === 'riverwalk' || subcategory === 'nature_park') {
    tips.push(`Dedica alrededor de ${durationMinutes} minutos para el recorrido a pie; lleva hidratación, protector solar y calzado cómodo para caminar.`)
  } else if (subcategory === 'urban_park' || subcategory === 'plaza') {
    tips.push(`Con unos ${durationMinutes} minutos podrás recorrer tranquilamente ${placeName}, descansar a la sombra y apreciar el ambiente local.`)
  } else if (subcategory === 'viewpoint') {
    tips.push(`Reserva unos ${durationMinutes} minutos; el final de la tarde o las primeras horas de la mañana ofrecen la luz más limpia para fotos panorámicas.`)
  } else {
    tips.push(`Dedica alrededor de ${durationMinutes} minutos para apreciar cada detalle de ${placeName} y su entorno.`)
  }

  return tips.slice(0, 2)
}

export function composeDeterministicTourGuideScript(place = {}, context = {}) {
  const placeName = String(place.name || place.nombre || 'este lugar emblemático').trim()
  const city = String(context.city || place.city || context.destination || 'la ciudad').trim()
  const subcategory = place.subcategory || inferStopSubcategory(place)
  const stopIndex = Number(context.stopIndex || 0)
  const durationMinutes = Number(context.durationMinutes || place.suggestedMinutes || estimateRealisticStopDurationMinutes(place, stopIndex))
  const osmMeta = place.osmMeta || extractOsmMetadata(place)

  const openingHook = selectOpeningHook(placeName, subcategory, city, stopIndex)

  const rawHistory = String(place.history || place.description || '').trim()
  const isCleanHistory =
    rawHistory.length > 25 &&
    !/\b(es\s+un\s+municipio\s+colombiano|capital\s+del\s+departamento)\b/i.test(rawHistory) &&
    subcategory !== 'restaurant' &&
    subcategory !== 'cafe'

  const historySentences = isCleanHistory ? splitIntoSentences(rawHistory) : []
  const coreHistory = historySentences.length > 0
    ? historySentences.slice(0, 2).join(' ')
    : buildFallbackCoreNarrative(placeName, subcategory, city, stopIndex)

  const metadataSentence = buildMetadataSentence(osmMeta, place.shortDescription, subcategory)
  const closingSentence = buildObservationClosing(placeName, subcategory, osmMeta, city, durationMinutes, stopIndex)

  return [openingHook, coreHistory, metadataSentence, closingSentence]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildDeterministicStopDetails(place = {}, context = {}) {
  const placeName = String(place.name || place.nombre || 'este lugar').trim()
  const osmMeta = place.osmMeta || extractOsmMetadata(place)
  const city = String(context.city || place.city || context.destination || 'la ciudad').trim()
  const subcategory = place.subcategory || inferStopSubcategory(place)
  const stopIndex = Number(context.stopIndex || 0)
  const durationMinutes = Number(context.durationMinutes || place.suggestedMinutes || estimateRealisticStopDurationMinutes(place, stopIndex))

  const description = composeDeterministicTourGuideScript(place, {
    ...context,
    durationMinutes
  })

  const rawHistory = String(place.history || '').trim()
  const isCleanHistory =
    rawHistory.length > 25 &&
    !/\b(es\s+un\s+municipio\s+colombiano|capital\s+del\s+departamento)\b/i.test(rawHistory) &&
    subcategory !== 'restaurant' &&
    subcategory !== 'cafe'
  const historySentences = isCleanHistory ? splitIntoSentences(rawHistory) : []

  const curiousFacts = []
  if (historySentences.length >= 3) {
    curiousFacts.push(historySentences[2])
  }
  if (osmMeta.startDate || osmMeta.architect) {
    curiousFacts.push(
      `Registro patrimonial en OpenStreetMap/Wikidata: ${[
        osmMeta.startDate ? `época o apertura en ${osmMeta.startDate}` : '',
        osmMeta.architect ? `arquitectura vinculada a ${osmMeta.architect}` : ''
      ].filter(Boolean).join(', ')}.`
    )
  }
  if (curiousFacts.length === 0) {
    if (subcategory === 'restaurant' || subcategory === 'cafe') {
      curiousFacts.push(
        `${placeName} destaca dentro de la oferta gastronómica de ${city} por mantener recetas frescas y un servicio cercano muy valorado por los comensales locales.`
      )
    } else if (subcategory === 'museum') {
      curiousFacts.push(
        `${placeName} cumple un papel fundamental en la preservación del patrimonio artístico y la memoria histórica de ${city}.`
      )
    } else {
      curiousFacts.push(
        `${placeName} es uno de los puntos verificados cartográficamente más representativos dentro del circuito turístico de ${city}.`
      )
    }
  }

  const activities = buildSubcategoryActivities(placeName, subcategory, city)
  const tips = buildSubcategoryTips(placeName, subcategory, durationMinutes, osmMeta)

  const category =
    subcategory === 'cafe'
      ? 'cafe'
      : subcategory === 'restaurant'
        ? 'restaurant'
        : subcategory === 'museum'
          ? 'museum'
          : subcategory === 'religious'
            ? 'religious'
            : subcategory === 'viewpoint'
              ? 'viewpoint'
              : ['riverwalk', 'nature_park', 'urban_park', 'beach'].includes(subcategory)
                ? 'nature'
                : 'historic'

  return {
    category,
    subcategory,
    durationMinutes,
    durationText: `${durationMinutes} minutos`,
    description,
    activities,
    curiousFacts: curiousFacts.slice(0, 3),
    tips
  }
}

export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)
  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2)) {
    return null
  }
  if (nLat1 === 0 && nLon1 === 0) return null
  if (nLat2 === 0 && nLon2 === 0) return null

  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(nLat2 - nLat1)
  const dLon = toRad(nLon2 - nLon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function inferPlaceMicroSector(place = {}, cityCenter = null, city = '') {
  const rawName = String(typeof place === 'string' ? place : (place?.name || place?.nombre || '')).trim()
  const rawAddress = String(typeof place === 'object' ? (place?.address || place?.direccion || '') : '').trim()
  const normText = normalizeTextKey(`${rawName} ${rawAddress}`)
  const normCity = normalizeTextKey(city)

  let sectorTag = null

  if (/\b(tayrona|chairama|cabo\s+san\s+juan|canaveral|arrecifes|neguanje|bahia\s+concha|playa\s+cristal|pueblito\s+tairona)\b/.test(normText)) {
    sectorTag = 'tayrona'
  } else if (/\b(minca|pozo\s+azul|marinka|sierra\s+nevada|campano)\b/.test(normText)) {
    sectorTag = 'minca'
  } else if (/\b(san\s+pedro\s+alejandrino|museo\s+bolivariano|quinta\s+de\s+san\s+pedro)\b/.test(normText)) {
    sectorTag = 'san_pedro_alejandrino'
  } else if (/\b(rodadero|playa\s+blanca|acuario\s+y\s+museo\s+del\s+mar|inca\s+inca|gaira)\b/.test(normText)) {
    sectorTag = 'rodadero_corridor'
  } else if (/\b(taganga|playa\s+grande|dumbira)\b/.test(normText)) {
    sectorTag = 'taganga'
  } else if (/\b(islas\s+del\s+rosario|isla\s+grande|oceanario|isla\s+del\s+encanto)\b/.test(normText)) {
    sectorTag = 'islas_del_rosario'
  } else if (/\b(isla\s+baru|playa\s+blanca\s+baru|cholon|aviario\s+nacional)\b/.test(normText)) {
    sectorTag = 'baru'
  } else if (/\b(islas\s+de\s+san\s+bernardo|isla\s+mucura|isla\s+tintipan|santa\s+cruz\s+del\s+islote|isla\s+palma)\b/.test(normText)) {
    sectorTag = 'san_bernardo'
  } else if (/\b(guatape|piedra\s+del\s+penol|penol)\b/.test(normText)) {
    sectorTag = 'guatape_penol'
  } else if (/\b(canon\s+del\s+chicamocha|panachi|parque\s+nacional\s+del\s+chicamocha|mesa\s+de\s+los\s+santos)\b/.test(normText)) {
    sectorTag = 'chicamocha'
  } else {
    // Universal sub-locality detector: e.g. "Museo ... de [Sublocality]" or "[Place], [Sublocality]"
    const commaParts = rawName.split(',').map((s) => normalizeTextKey(s)).filter(Boolean)
    if (commaParts.length >= 2) {
      const suffix = commaParts[commaParts.length - 1]
      if (suffix && suffix.length >= 4 && suffix !== normCity && !normCity.includes(suffix)) {
        sectorTag = `sub_${suffix.replace(/\s+/g, '_')}`
      }
    }
  }

  const lat = Number(place?.latitude ?? place?.lat)
  const lon = Number(place?.longitude ?? place?.lon)
  const centerLat = Number(cityCenter?.latitude ?? cityCenter?.lat)
  const centerLon = Number(cityCenter?.longitude ?? cityCenter?.lon)

  const distFromCenterKm = calculateHaversineKm(centerLat, centerLon, lat, lon)

  const isPeripheralByKeywords =
    Boolean(sectorTag && !['san_pedro_alejandrino', 'rodadero_corridor'].includes(sectorTag)) ||
    /\b(parque\s+nacional|pnn|reserva\s+natural|sierra\s+nevada|isla|islas|archipielago|canon|volcan|nevado|paramo|cascada|cataratas|corregimiento|vereda)\b/.test(normText)

  const isPeripheralExcursion =
    isPeripheralByKeywords || (distFromCenterKm != null && distFromCenterKm > 8.0)

  return {
    sectorTag,
    distFromCenterKm,
    isPeripheralExcursion
  }
}

export function areStopsCompatibleInSameDay(stopA, stopB, cityCenter = null, city = '') {
  if (!stopA || !stopB) return false
  const infoA = inferPlaceMicroSector(stopA, cityCenter, city)
  const infoB = inferPlaceMicroSector(stopB, cityCenter, city)

  // 1. If both belong to the exact same named micro-sector or complex (e.g. Minca + Museo del Cacao de Minca,
  // Tayrona + Museo Chairama, Quinta de San Pedro + Museo Bolivariano, Rodadero + Playa Blanca), they ARE compatible!
  if (infoA.sectorTag && infoB.sectorTag && infoA.sectorTag === infoB.sectorTag) {
    return true
  }

  // 2. If they belong to DIFFERENT named sectors (e.g. Tayrona vs Minca, Rodadero vs Taganga, Playa Blanca vs Museo Bolivariano),
  // they CANNOT be combined on the same day.
  if (infoA.sectorTag && infoB.sectorTag && infoA.sectorTag !== infoB.sectorTag) {
    return false
  }

  // 3. If either stop is a peripheral excursion (e.g. Tayrona, Minca, Taganga, Islas) and the other does NOT share
  // its micro-sector tag, verify strict physical proximity (<= 4.5 km); otherwise reject.
  const distKm = calculateHaversineKm(
    stopA?.latitude ?? stopA?.lat,
    stopA?.longitude ?? stopA?.lon,
    stopB?.latitude ?? stopB?.lat,
    stopB?.longitude ?? stopB?.lon
  )

  if (infoA.isPeripheralExcursion || infoB.isPeripheralExcursion) {
    if (distKm != null) {
      return distKm <= 4.5
    }
    return false
  }

  // 4. If one has a specific sub-sector tag (like san_pedro_alejandrino or rodadero_corridor) and the other is far
  if ((infoA.sectorTag || infoB.sectorTag) && distKm != null && distKm > 4.0) {
    return false
  }

  // 5. Urban stops: require <= 5.5 km between stops on the same day
  if (distKm != null) {
    return distKm <= 5.5
  }

  return true
}

export function clusterStopsIntoCoherentDays(attractions = [], restaurants = [], options = {}) {
  const numDays = Math.max(1, Number(options.numDays || 1))
  const city = String(options.city || options.destination || '').trim()
  const coordsMap = options.coordinatesMap || {}
  const candidatePool = Array.isArray(options.candidatePlaces) ? options.candidatePlaces : []

  function enrichWithCoords(rawItem, defaultType = 'attraction') {
    if (!rawItem) return null
    const name = String(typeof rawItem === 'string' ? rawItem : (rawItem.name || rawItem.nombre || '')).trim()
    if (!name) return null

    let lat = Number(rawItem?.latitude ?? rawItem?.lat)
    let lon = Number(rawItem?.longitude ?? rawItem?.lon)
    let address = String(rawItem?.address || rawItem?.direccion || '').trim()

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
      const lower = name.toLowerCase().trim()
      const direct = coordsMap[lower]
      if (direct && Number.isFinite(Number(direct.latitude)) && Number.isFinite(Number(direct.longitude))) {
        lat = Number(direct.latitude)
        lon = Number(direct.longitude)
      } else {
        const match = candidatePool.find(
          (c) => c?.name && arePlaceNamesSemanticallySame(c.name, name, city) && Number.isFinite(Number(c.latitude))
        )
        if (match) {
          lat = Number(match.latitude)
          lon = Number(match.longitude)
          address = address || match.address || ''
        }
      }
    }

    return {
      ...(typeof rawItem === 'object' ? rawItem : {}),
      name,
      latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
      longitude: Number.isFinite(lon) && lon !== 0 ? lon : null,
      address,
      entityType: defaultType
    }
  }

  // Deduplicate attractions while preserving order
  const cleanAttractions = []
  for (const raw of attractions) {
    const item = enrichWithCoords(raw, 'attraction')
    if (!item) continue
    if (cleanAttractions.some((existing) => arePlaceNamesSemanticallySame(existing.name, item.name, city))) {
      continue
    }
    cleanAttractions.push(item)
  }

  const cleanRestaurants = []
  for (const raw of restaurants) {
    const item = enrichWithCoords(raw, 'restaurant')
    if (!item) continue
    if (cleanAttractions.some((a) => arePlaceNamesSemanticallySame(a.name, item.name, city))) continue
    if (cleanRestaurants.some((r) => arePlaceNamesSemanticallySame(r.name, item.name, city))) continue
    cleanRestaurants.push(item)
  }

  // Sort restaurants so full meal venues appear before pure pastry/cake/ice-cream shops
  cleanRestaurants.sort((a, b) => {
    const isDessertA = /\b(postres|ponques|reposteria|pasteleria|heladeria|dulceria)\b/i.test(normalizeTextKey(a.name))
    const isDessertB = /\b(postres|ponques|reposteria|pasteleria|heladeria|dulceria)\b/i.test(normalizeTextKey(b.name))
    if (isDessertA !== isDessertB) return isDessertA ? 1 : -1
    return 0
  })

  // Resolve urban center using passed cityCenter or median of valid attraction coordinates
  let cityCenter = options.cityCenter
  if (!cityCenter || !Number.isFinite(Number(cityCenter.latitude)) || !Number.isFinite(Number(cityCenter.longitude))) {
    const withCoords = cleanAttractions.filter((a) => a.latitude != null && a.longitude != null)
    if (withCoords.length > 0) {
      const sortedLats = withCoords.map((a) => a.latitude).sort((x, y) => x - y)
      const sortedLons = withCoords.map((a) => a.longitude).sort((x, y) => x - y)
      const mid = Math.floor(withCoords.length / 2)
      cityCenter = { latitude: sortedLats[mid], longitude: sortedLons[mid] }
    }
  }

  const usedIndices = new Set()
  const clusters = []

  // Pass 1: Lock together attractions that share the exact same named micro-sector or complex
  // (e.g. Minca + Museo del Cacao de Minca; Tayrona + Museo Chairama; Quinta de San Pedro + Museo Bolivariano; Rodadero + Playa Blanca)
  for (let i = 0; i < cleanAttractions.length; i++) {
    if (usedIndices.has(i)) continue
    const stopA = cleanAttractions[i]
    const infoA = inferPlaceMicroSector(stopA, cityCenter, city)
    if (!infoA.sectorTag) continue

    let partnerIdx = -1
    for (let j = i + 1; j < cleanAttractions.length; j++) {
      if (usedIndices.has(j)) continue
      const stopB = cleanAttractions[j]
      const infoB = inferPlaceMicroSector(stopB, cityCenter, city)
      if (infoB.sectorTag === infoA.sectorTag) {
        partnerIdx = j
        break
      }
    }

    if (partnerIdx !== -1) {
      usedIndices.add(i)
      usedIndices.add(partnerIdx)
      clusters.push([stopA, cleanAttractions[partnerIdx]])
    }
  }

  // Calculate how many additional pairs we can form without starving any of the numDays days of at least 1 attraction
  const remainingCount = cleanAttractions.length - usedIndices.size
  const currentTotalClusters = clusters.length + remainingCount
  let maxExtraPairs = Math.max(0, currentTotalClusters - numDays)

  // Pass 2: Pair remaining urban/compatible attractions by minimum distance (<= 5.5 km) while respecting maxExtraPairs
  for (let i = 0; i < cleanAttractions.length; i++) {
    if (usedIndices.has(i)) continue
    const stopA = cleanAttractions[i]
    usedIndices.add(i)

    if (maxExtraPairs <= 0) {
      clusters.push([stopA])
      continue
    }

    let bestPartnerIdx = -1
    let bestDistKm = Infinity

    for (let j = i + 1; j < cleanAttractions.length; j++) {
      if (usedIndices.has(j)) continue
      const stopB = cleanAttractions[j]
      if (!areStopsCompatibleInSameDay(stopA, stopB, cityCenter, city)) continue

      const distKm = calculateHaversineKm(stopA.latitude, stopA.longitude, stopB.latitude, stopB.longitude)
      const effectiveDist = distKm != null ? distKm : 2.5
      if (effectiveDist < bestDistKm) {
        bestDistKm = effectiveDist
        bestPartnerIdx = j
      }
    }

    if (bestPartnerIdx !== -1) {
      usedIndices.add(bestPartnerIdx)
      maxExtraPairs--
      clusters.push([stopA, cleanAttractions[bestPartnerIdx]])
    } else {
      clusters.push([stopA])
    }
  }

  // If same-sector pairing produced fewer clusters than numDays, split urban 2-stop clusters before ever leaving a day empty
  while (clusters.length < numDays) {
    const splittableIdx = clusters.findIndex((c) => {
      if (c.length < 2) return false
      const info0 = inferPlaceMicroSector(c[0], cityCenter, city)
      return !info0.isPeripheralExcursion
    })
    if (splittableIdx === -1) break
    const [first, second] = clusters[splittableIdx]
    clusters.splice(splittableIdx, 1, [first], [second])
  }

  // Build final day plans (1..numDays) and assign the closest restaurant to each day's cluster centroid
  const usedRests = new Set()
  const days = []

  for (let d = 1; d <= numDays; d++) {
    const dayAttractions = clusters[d - 1] || []
    let dayLat = null
    let dayLon = null
    const coordsInDay = dayAttractions.filter((a) => a.latitude != null && a.longitude != null)
    if (coordsInDay.length > 0) {
      dayLat = coordsInDay.reduce((acc, a) => acc + a.latitude, 0) / coordsInDay.length
      dayLon = coordsInDay.reduce((acc, a) => acc + a.longitude, 0) / coordsInDay.length
    } else if (cityCenter) {
      dayLat = cityCenter.latitude
      dayLon = cityCenter.longitude
    }

    let chosenRest = null
    let bestRestDist = Infinity
    for (const rest of cleanRestaurants) {
      const restKey = rest.name.toLowerCase()
      if (usedRests.has(restKey)) continue
      if (dayAttractions.some((a) => arePlaceNamesSemanticallySame(a.name, rest.name, city))) continue

      const dist = calculateHaversineKm(dayLat, dayLon, rest.latitude, rest.longitude)
      const scoreDist = dist != null ? dist : 15
      if (scoreDist < bestRestDist) {
        bestRestDist = scoreDist
        chosenRest = rest
      }
    }

    if (chosenRest) {
      usedRests.add(chosenRest.name.toLowerCase())
    }

    const allDayStops = [...dayAttractions, ...(chosenRest ? [chosenRest] : [])].map((stop) => ({
      ...stop,
      dia: d,
      day: d
    }))

    days.push({
      day: d,
      attractions: dayAttractions,
      restaurant: chosenRest,
      stops: allDayStops
    })
  }

  return days
}


