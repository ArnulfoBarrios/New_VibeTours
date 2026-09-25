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

  return sourceList.sort((a, b) => b.touristScore - a.touristScore)
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
  const seen = new Set()
  const rawList = []
  let idx = 0
  for (const name of combinedRaw) {
    if (isNeighborhoodOrMinorPark(name, {}, false)) continue
    const key = normalizeTextKey(name)
    if (!key || seen.has(key)) continue
    const isDuplicate = Array.from(seen).some((existing) => existing.includes(key) || key.includes(existing))
    if (isDuplicate) continue
    seen.add(key)

    const matchedGeo = geoMap.get(key)
    const angle = (idx * 137.5 * Math.PI) / 180
    const radiusDeg = 0.0022 + (idx % 4) * 0.0008
    const fallbackLat = hasCenterCoords ? Number((Number(lat) + Math.cos(angle) * radiusDeg).toFixed(6)) : null
    const fallbackLon = hasCenterCoords ? Number((Number(lon) + Math.sin(angle) * radiusDeg).toFixed(6)) : null
    idx++

    const item = {
      name,
      category: classifyDiscoveredLandmark(name),
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

async function searchWikipediaSummaryByQuery(query, lang = 'es') {
  if (!query) return null

  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1&origin=*`
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500)
    })
    if (!response.ok) return null

    const data = await response.json()
    const firstHit = data?.query?.search?.[0]?.title
    if (!firstHit) return null

    return fetchWikipediaSummaryByTitle(firstHit, lang)
  } catch {
    return null
  }
}

export async function enrichPlaceWithOpenData(place = {}, city = '', lang = 'es') {
  const placeName = String(place.name || place.nombre || '').trim()
  if (!placeName) return { ...place }

  const cacheKey = `open_poi_${lang}_${city.toLowerCase()}_${placeName.toLowerCase()}`
  const cached = placeEnrichmentCache.get(cacheKey)
  if (cached) return { ...place, ...cached }

  const osmMeta = extractOsmMetadata(place)
  let wikiSummary = null
  let shortDescription = osmMeta.wikidataId ? '' : (place.shortDescription || '')

  if (osmMeta.wikipediaTag) {
    const [tagLang, tagTitle] = osmMeta.wikipediaTag.includes(':')
      ? osmMeta.wikipediaTag.split(':')
      : [lang, osmMeta.wikipediaTag]
    wikiSummary = await fetchWikipediaSummaryByTitle(tagTitle, tagLang || lang)
  }

  if (!wikiSummary && osmMeta.wikidataId) {
    const wikidataInfo = await fetchWikidataEntitySummary(osmMeta.wikidataId, lang)
    if (wikidataInfo?.description) shortDescription = wikidataInfo.description
    if (wikidataInfo?.wikiTitle) {
      wikiSummary = await fetchWikipediaSummaryByTitle(wikidataInfo.wikiTitle, wikidataInfo.resolvedLang)
    }
  }

  if (!wikiSummary) {
    const searchQuery = city ? `${placeName} ${city}` : placeName
    wikiSummary = await searchWikipediaSummaryByQuery(searchQuery, lang)
  }

  const enrichedFields = {
    history: wikiSummary?.extract || place.history || place.description || '',
    shortDescription: shortDescription || wikiSummary?.description || place.shortDescription || '',
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

function selectOpeningHook(placeName, category, city, index = 0) {
  const hooksByCategory = {
    museum: [
      `¡Qué alegría llegar juntos a ${placeName}, uno de los guardianes de la memoria cultural de ${city}!`,
      `Frente a nosotros se alza ${placeName}, un espacio imprescindible para comprender el alma artística e histórica de ${city}.`
    ],
    park: [
      `Respira profundo, porque acabamos de entrar en ${placeName}, el pulmón natural y punto de encuentro favorito en ${city}.`,
      `¡Bienvenido a ${placeName}! Este oasis al aire libre nos regala una pausa refrescante en pleno corazón de ${city}.`
    ],
    food: [
      `¡Prepárate para despertar todos los sentidos en ${placeName}, una parada gastronómica con muchísimo sabor local en ${city}!`,
      `Llegamos al rincón perfecto para saborear la tradición culinaria de ${city}: estamos en ${placeName}.`
    ],
    beach: [
      `Siente la brisa marina de ${placeName}, uno de los escenarios costeros más cautivadores de ${city}.`,
      `¡Mira ese horizonte! Estamos en ${placeName}, donde el mar y la energía de ${city} se encuentran.`
    ],
    default: [
      `¡Qué emoción estar aquí contigo! Frente a nosotros tenemos ${placeName}, una joya emblemática que define el carácter de ${city}.`,
      `Detengámonos un momento para admirar ${placeName}, uno de los rincones con mayor personalidad e historia de ${city}.`,
      `¡Bienvenido a la parada número ${index + 1} de nuestra ruta! Estamos frente a ${placeName}, un referente indiscutible de ${city}.`
    ]
  }

  const key = hooksByCategory[category] ? category : 'default'
  const options = hooksByCategory[key]
  return options[index % options.length]
}

function buildMetadataSentence(osmMeta = {}, shortDescription = '') {
  const details = []
  if (shortDescription) {
    details.push(`reconocido como ${shortDescription.toLowerCase()}`)
  }
  if (osmMeta.startDate) {
    details.push(`cuyos orígenes datan de ${osmMeta.startDate}`)
  }
  if (osmMeta.architect) {
    details.push(`diseñado con la huella arquitectónica de ${osmMeta.architect}`)
  }
  if (osmMeta.heritage) {
    details.push('distinguido por su alto valor patrimonial e histórico')
  }
  if (osmMeta.cuisine) {
    details.push(`famoso por su propuesta de cocina ${osmMeta.cuisine}`)
  }
  if (details.length === 0) return ''
  return `Este lugar es especialmente valorado por ser un punto ${details.join(', ')}.`
}

function buildObservationClosing(category, osmMeta = {}, city = '') {
  const scheduleNote = osmMeta.openingHours
    ? `Ten en cuenta su horario habitual (${osmMeta.openingHours}) para aprovechar la visita sin prisas.`
    : 'Tómate unos minutos para recorrer sus alrededores con calma y capturar los mejores ángulos fotográficos.'

  if (category === 'food') {
    return `Te sugiero degustar las especialidades de la casa y conversar con los locales para descubrir los ingredientes auténticos de ${city}. ${scheduleNote}`
  }
  if (category === 'park' || category === 'beach') {
    return `Observa cómo la naturaleza y la vida local conviven en armonía mientras disfrutas del ambiente relajado del lugar. ${scheduleNote}`
  }
  return `Fíjate en las texturas de su arquitectura, los detalles de su entorno y el movimiento cotidiano que le da vida a este sector de ${city}. ${scheduleNote}`
}

export function composeDeterministicTourGuideScript(place = {}, context = {}) {
  const placeName = String(place.name || place.nombre || 'este lugar emblemático').trim()
  const city = String(context.city || place.city || context.destination || 'la ciudad').trim()
  const category = String(place.category || 'historic').toLowerCase()
  const stopIndex = Number(context.stopIndex || 0)
  const osmMeta = place.osmMeta || extractOsmMetadata(place)

  const openingHook = selectOpeningHook(placeName, category, city, stopIndex)
  const historySentences = splitIntoSentences(place.history || place.description || '')
  const coreHistory = historySentences.length > 0
    ? historySentences.slice(0, 2).join(' ')
    : `${placeName} forma parte esencial del tejido urbano y cultural de ${city}, atrayendo tanto a residentes como a viajeros que buscan experiencias auténticas.`

  const metadataSentence = buildMetadataSentence(osmMeta, place.shortDescription)
  const closingSentence = buildObservationClosing(category, osmMeta, city)

  return [openingHook, coreHistory, metadataSentence, closingSentence]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildDeterministicStopDetails(place = {}, context = {}) {
  const osmMeta = place.osmMeta || extractOsmMetadata(place)
  const city = String(context.city || place.city || context.destination || 'la ciudad').trim()
  const description = composeDeterministicTourGuideScript(place, context)
  const historySentences = splitIntoSentences(place.history || '')

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
    curiousFacts.push(
      `${place.name} es uno de los puntos verificados cartográficamente más representativos en el circuito turístico de ${city}.`
    )
  }

  const tips = []
  if (osmMeta.openingHours) {
    tips.push(`Horario reportado: ${osmMeta.openingHours}.`)
  }
  if (osmMeta.fee === 'yes') {
    tips.push('Este recinto puede requerir boleto o contribución de entrada; ten efectivo o tarjeta a mano.')
  } else {
    tips.push('Dedica entre 30 y 45 minutos para apreciar los detalles arquitectónicos y el ambiente local.')
  }

  return {
    description,
    curiousFacts: curiousFacts.slice(0, 3),
    tips: tips.slice(0, 2)
  }
}
