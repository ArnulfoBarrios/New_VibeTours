import { GeoCache } from './geoCache.js'

const USER_AGENT = 'VIBETOURS/1.0 (https://vibetours.app; ops@vibetours.app)'
const placeEnrichmentCache = new GeoCache(24 * 60 * 60 * 1000, 600)
const cityGuideCache = new GeoCache(24 * 60 * 60 * 1000, 200)

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
