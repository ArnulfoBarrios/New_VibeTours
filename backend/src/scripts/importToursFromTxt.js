import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true })

const inputPath = process.argv[2] ?? 'C:/VibeTours/Tours.txt'
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const rawText = fs.readFileSync(inputPath, 'utf8')
const rawObjects = extractJsonObjects(rawText)
const parsedTours = rawObjects.map((raw) => {
  const repaired = raw.replace(/:\s*parcialmente\s*([,}])/g, ': "parcialmente"$1')
  return JSON.parse(repaired)
})
const tours = dedupeBy(parsedTours, (tour) => slugify(tour.nombre_tour))

const schema = await detectSchema()
schema.ownerId = await resolveOwnerId(schema)
const geocodeCache = new Map()
const imported = []
const geocodeMisses = []

for (const tour of tours) {
  const normalized = normalizeTour(tour)
  const routeStops = []
  for (const [index, stop] of normalized.stops.entries()) {
    const coordinates = await geocodeStop(stop, normalized)
    if (coordinates.missing) geocodeMisses.push(`${normalized.title} -> ${stop.name}`)
    routeStops.push({ ...stop, ...coordinates, order: index })
  }
  const { data, error } = await saveTour(normalized, schema)
  if (error) throw new Error(`Tour save failed for ${normalized.title}: ${error.message}`)

  const deleteResult = await supabase.from('tour_stops').delete().eq('tour_id', data.id)
  if (deleteResult.error) {
    throw new Error(`Stop cleanup failed for ${normalized.title}: ${deleteResult.error.message}`)
  }

  const stopRows = routeStops.map((stop) => toStopRow(data.id, stop, schema))
  if (stopRows.length) {
    const insertResult = await supabase.from('tour_stops').insert(stopRows)
    if (insertResult.error) {
      throw new Error(`Stop insert failed for ${normalized.title}: ${insertResult.error.message}`)
    }
  }

  imported.push({ id: data.id, key: data.slug ?? data.title, title: data.title, stops: stopRows.length })
  console.log(`Imported ${data.title} (${stopRows.length} stops)`)
}

const { data: verifyTours, error: verifyTourError } = await supabase
  .from('tours')
  .select('id, title')
  .in('id', imported.map((tour) => tour.id))
if (verifyTourError) throw new Error(`Verification failed: ${verifyTourError.message}`)

const { data: verifyStops, error: verifyStopError } = await supabase
  .from('tour_stops')
  .select('tour_id')
  .in('tour_id', imported.map((tour) => tour.id))
if (verifyStopError) throw new Error(`Stop verification failed: ${verifyStopError.message}`)

console.log(JSON.stringify({
  sourceBlocks: rawObjects.length,
  parsedTours: parsedTours.length,
  uniqueTours: tours.length,
  databaseTours: verifyTours.length,
  databaseStops: verifyStops.length,
  tourColumns: [...schema.tourColumns],
  stopColumns: [...schema.stopColumns],
  geocodeMisses
}, null, 2))

function extractJsonObjects(input) {
  const objects = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') {
      if (depth === 0) start = index
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        objects.push(input.slice(start, index + 1))
        start = -1
      }
    }
  }
  return objects
}

function dedupeBy(items, keyFor) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    const key = keyFor(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

async function detectSchema() {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  })
  if (!response.ok) throw new Error(`Could not inspect Supabase schema: ${response.status}`)
  const openApi = await response.json()
  const definitions = openApi.definitions ?? openApi.components?.schemas ?? {}
  const tourColumns = new Set(Object.keys(definitions.tours?.properties ?? {}))
  const stopColumns = new Set(Object.keys(definitions.tour_stops?.properties ?? {}))
  if (!tourColumns.size || !stopColumns.size) {
    throw new Error('Could not find tours or tour_stops in Supabase schema.')
  }
  return {
    tourColumns,
    stopColumns,
    hasTour: (column) => tourColumns.has(column),
    hasStop: (column) => stopColumns.has(column)
  }
}

async function resolveOwnerId(schema) {
  if (!schema.hasTour('owner_id') && !schema.hasTour('created_by')) return null
  const admin = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
  if (!admin.error && admin.data?.[0]?.id) return admin.data[0].id
  const existingTour = await supabase
    .from('tours')
    .select('owner_id, created_by')
    .limit(1)
  const existing = existingTour.data?.[0]
  if (existing?.owner_id) return existing.owner_id
  if (existing?.created_by) return existing.created_by
  const profile = await supabase.from('profiles').select('id').limit(1)
  if (!profile.error && profile.data?.[0]?.id) return profile.data[0].id
  throw new Error('The remote schema requires owner_id/created_by, but no profile exists.')
}

async function saveTour(tour, schema) {
  const row = toTourRow(tour, schema)
  if (schema.hasTour('slug')) {
    return supabase
      .from('tours')
      .upsert(row, { onConflict: 'slug' })
      .select('id, slug, title')
      .single()
  }
  const existing = await supabase
    .from('tours')
    .select('id, title')
    .eq('title', tour.title)
    .limit(1)
  if (existing.error) return { data: null, error: existing.error }
  if (existing.data?.[0]?.id) {
    return supabase
      .from('tours')
      .update(row)
      .eq('id', existing.data[0].id)
      .select('id, title')
      .single()
  }
  return supabase
    .from('tours')
    .insert(row)
    .select('id, title')
    .single()
}

function normalizeTour(tour) {
  const meeting = locationInfo(tour.punto_encuentro)
  const stops = (Array.isArray(tour.itinerario) ? tour.itinerario : []).map((stop) => ({
    name: text(stop.nombre, 'Parada'),
    description: text(stop.descripcion, ''),
    durationMinutes: minutesFrom(stop.duracion_estimada, 30),
    activities: stringList(stop.actividades),
    curiousFacts: stringList(stop.datos_curiosos),
    tips: stringList(stop.consejos),
    images: imageList(stop.imagenes),
    locationInfo: locationInfo(stop.ubicacion)
  }))
  const gallery = imageList(tour.galeria_tour)
  const title = text(tour.nombre_tour, 'Tour sin nombre')
  const type = tourType(tour.tipo_tour ?? tour.categoria_principal)
  const country = meeting.pais || stops[0]?.locationInfo.pais || 'Global'
  const city = meeting.ciudad || stops[0]?.locationInfo.ciudad || 'Global'
  return {
    source: tour,
    slug: slugify(title),
    title,
    country,
    city,
    type,
    description: text(tour.descripcion_tour, tour.resumen_corto ?? ''),
    coverUrl: text(tour.imagen_portada, gallery[0] ?? ''),
    gallery,
    durationMinutes: minutesFrom(tour.duracion_estimada, stops.reduce((sum, stop) => sum + stop.durationMinutes, 0) || 180),
    distanceMeters: metersFrom(tour.distancia_total, 0),
    difficulty: difficulty(tour.nivel_dificultad),
    language: languageCode(tour.idiomas_disponibles?.[0]),
    tags: stringList(tour.etiquetas),
    shortSummary: text(tour.resumen_corto, ''),
    subcategories: stringList(tour.subcategorias),
    featuredExperience: text(tour.experiencia_destacada, ''),
    placeHistory: text(tour.historia_del_lugar, ''),
    culturalContext: text(tour.contexto_cultural, ''),
    availableLanguages: stringList(tour.idiomas_disponibles),
    recommendedAudience: stringList(tour.publico_recomendado),
    bestSeason: text(tour.mejor_epoca, ''),
    recommendedSchedule: text(tour.horario_recomendado, ''),
    meetingPoint: meeting.nombre_lugar,
    meetingPointInfo: meeting,
    includes: stringList(tour.incluye),
    excludes: stringList(tour.no_incluye),
    recommendations: stringList(tour.recomendaciones),
    whatToBring: stringList(tour.que_llevar),
    tourRules: stringList(tour.normas_del_tour),
    keywords: stringList(tour.palabras_clave),
    mainCategory: text(tour.categoria_principal, tour.tipo_tour ?? ''),
    budget: budget(tour.presupuesto_estimado_usd),
    additionalInfo: tour.informacion_adicional ?? {},
    stops
  }
}

function toTourRow(tour, schema) {
  const row = {}
  setIf(schema.hasTour('slug'), row, 'slug', tour.slug)
  setIf(schema.hasTour('owner_id'), row, 'owner_id', schema.ownerId)
  setIf(schema.hasTour('created_by'), row, 'created_by', schema.ownerId)
  setIf(schema.hasTour('approved_by'), row, 'approved_by', schema.ownerId)
  setIf(schema.hasTour('approved_at'), row, 'approved_at', new Date().toISOString())
  setIf(schema.hasTour('title'), row, 'title', tour.title)
  setIf(schema.hasTour('country'), row, 'country', tour.country)
  setIf(schema.hasTour('city'), row, 'city', tour.city)
  setIf(schema.hasTour('type'), row, 'type', legacyType(tour.type))
  setIf(schema.hasTour('description'), row, 'description', tour.description)
  setIf(schema.hasTour('cover_url'), row, 'cover_url', tour.coverUrl || tour.gallery[0] || fallbackImage(tour.slug))
  setIf(schema.hasTour('cover_image_url'), row, 'cover_image_url', tour.coverUrl || tour.gallery[0] || fallbackImage(tour.slug))
  setIf(schema.hasTour('gallery'), row, 'gallery', tour.gallery)
  setIf(schema.hasTour('gallery_image_urls'), row, 'gallery_image_urls', tour.gallery)
  setIf(schema.hasTour('duration_minutes'), row, 'duration_minutes', tour.durationMinutes)
  setIf(schema.hasTour('estimated_minutes'), row, 'estimated_minutes', tour.durationMinutes)
  setIf(schema.hasTour('distance_meters'), row, 'distance_meters', tour.distanceMeters)
  setIf(schema.hasTour('difficulty'), row, 'difficulty', tour.difficulty)
  setIf(schema.hasTour('language'), row, 'language', tour.language)
  setIf(schema.hasTour('rating'), row, 'rating', 4.8)
  setIf(schema.hasTour('review_count'), row, 'review_count', 0)
  setIf(schema.hasTour('likes_count'), row, 'likes_count', 0)
  setIf(schema.hasTour('tags'), row, 'tags', tour.tags.length ? tour.tags : [tour.city, tour.country, tour.mainCategory].filter(Boolean))
  setIf(schema.hasTour('status'), row, 'status', 'approved')
  setIf(schema.hasTour('pending_edit_snapshot'), row, 'pending_edit_snapshot', tour.source)
  setIf(schema.hasTour('is_ai_generated'), row, 'is_ai_generated', true)
  setIf(schema.hasTour('is_published'), row, 'is_published', true)
  setIf(schema.hasTour('is_private'), row, 'is_private', false)
  setIf(schema.hasTour('price'), row, 'price', 0)
  setIf(schema.hasTour('currency'), row, 'currency', 'USD')
  setIf(schema.hasTour('included_items'), row, 'included_items', tour.includes)
  setIf(schema.hasTour('excluded_items'), row, 'excluded_items', tour.excludes)
  setIf(schema.hasTour('meeting_point'), row, 'meeting_point', tour.meetingPoint)
  setIf(schema.hasTour('recommendations'), row, 'recommendations', recommendationsText(tour))
  setIf(schema.hasTour('minor_friendly'), row, 'minor_friendly', tour.additionalInfo.apto_para_ninos !== false)
  setIf(schema.hasTour('tour_profile'), row, 'tour_profile', tourProfile(tour))
  setIf(schema.hasTour('popularity_score'), row, 'popularity_score', 80)
  setIf(schema.hasTour('trend_score'), row, 'trend_score', 65)
  setIf(schema.hasTour('creation_json'), row, 'creation_json', tour.source)
  setIf(schema.hasTour('available_languages'), row, 'available_languages', tour.availableLanguages)
  setIf(schema.hasTour('recommended_audience'), row, 'recommended_audience', tour.recommendedAudience)
  setIf(schema.hasTour('best_season'), row, 'best_season', tour.bestSeason)
  setIf(schema.hasTour('recommended_schedule'), row, 'recommended_schedule', tour.recommendedSchedule)
  setIf(schema.hasTour('includes'), row, 'includes', tour.includes)
  setIf(schema.hasTour('excludes'), row, 'excludes', tour.excludes)
  setIf(schema.hasTour('additional_info'), row, 'additional_info', tour.additionalInfo)
  setIf(schema.hasTour('short_summary'), row, 'short_summary', tour.shortSummary)
  setIf(schema.hasTour('subcategories'), row, 'subcategories', tour.subcategories)
  setIf(schema.hasTour('featured_experience'), row, 'featured_experience', tour.featuredExperience)
  setIf(schema.hasTour('place_history'), row, 'place_history', tour.placeHistory)
  setIf(schema.hasTour('cultural_context'), row, 'cultural_context', tour.culturalContext)
  setIf(schema.hasTour('meeting_point_info'), row, 'meeting_point_info', tour.meetingPointInfo)
  setIf(schema.hasTour('what_to_bring'), row, 'what_to_bring', tour.whatToBring)
  setIf(schema.hasTour('tour_rules'), row, 'tour_rules', tour.tourRules)
  setIf(schema.hasTour('keywords'), row, 'keywords', tour.keywords)
  setIf(schema.hasTour('main_category'), row, 'main_category', tour.mainCategory)
  setIf(schema.hasTour('budget'), row, 'budget', tour.budget)
  return row
}

function toStopRow(tourId, stop, schema) {
  const position = stop.order + 1
  const metadata = {
    source: 'Tours.txt',
    location_info: stop.locationInfo,
    activities: stop.activities,
    datos_curiosos: stop.curiousFacts,
    consejos: stop.tips
  }
  const row = {}
  setIf(schema.hasStop('tour_id'), row, 'tour_id', tourId)
  setIf(schema.hasStop('stop_order'), row, 'stop_order', position)
  setIf(schema.hasStop('position'), row, 'position', position)
  setIf(schema.hasStop('name'), row, 'name', stop.name)
  setIf(schema.hasStop('custom_name'), row, 'custom_name', stop.name)
  setIf(schema.hasStop('description'), row, 'description', stop.description)
  setIf(schema.hasStop('custom_description'), row, 'custom_description', stop.description)
  setIf(schema.hasStop('latitude'), row, 'latitude', stop.latitude)
  setIf(schema.hasStop('longitude'), row, 'longitude', stop.longitude)
  setIf(schema.hasStop('image_url'), row, 'image_url', stop.images[0] ?? '')
  setIf(schema.hasStop('image_urls'), row, 'image_urls', stop.images)
  setIf(schema.hasStop('activities'), row, 'activities', stop.activities)
  setIf(schema.hasStop('tips'), row, 'tips', stop.tips)
  setIf(schema.hasStop('notes'), row, 'notes', notesText(stop))
  setIf(schema.hasStop('suggested_minutes'), row, 'suggested_minutes', stop.durationMinutes)
  setIf(schema.hasStop('estimated_minutes'), row, 'estimated_minutes', stop.durationMinutes)
  setIf(schema.hasStop('minor_friendly'), row, 'minor_friendly', true)
  setIf(schema.hasStop('image_source'), row, 'image_source', stop.images.length ? 'source_json' : 'fallback')
  setIf(schema.hasStop('image_quality_score'), row, 'image_quality_score', stop.images.length ? 80 : 30)
  setIf(schema.hasStop('image_metadata'), row, 'image_metadata', metadata)
  setIf(schema.hasStop('curious_facts'), row, 'curious_facts', stop.curiousFacts)
  setIf(schema.hasStop('location_info'), row, 'location_info', stop.locationInfo)
  setIf(schema.hasStop('images'), row, 'images', stop.images)
  return row
}

function setIf(condition, row, column, value) {
  if (condition && value !== undefined) row[column] = value
}

function legacyType(type) {
  if (type === 'ecological') return 'eco'
  if (type === 'gastronomic') return 'gastronomic'
  if (type === 'historical') return 'historic'
  if (type === 'romantic') return 'romantic'
  if (type === 'sports') return 'adventure'
  if (type === 'night') return 'nightlife'
  if (type === 'family') return 'family'
  if (type === 'urban') return 'urban'
  if (type === 'cultural') return 'custom'
  return 'custom'
}

function recommendationsText(tour) {
  return [
    `Destino: ${tour.city}, ${tour.country}.`,
    `Duracion sugerida: ${tour.source.duracion_estimada ?? `${tour.durationMinutes} minutos`}.`,
    `Tipo de experiencia: ${tour.mainCategory || tour.type}.`,
    tour.bestSeason ? `Mejor epoca: ${tour.bestSeason}.` : '',
    tour.recommendedSchedule ? `Horario recomendado: ${tour.recommendedSchedule}.` : '',
    ...tour.recommendations,
    ...tour.whatToBring.map((item) => `Llevar: ${item}.`)
  ].filter(Boolean).join('\n')
}

function notesText(stop) {
  return [
    stop.activities.length ? `Actividades: ${stop.activities.join(', ')}` : '',
    stop.curiousFacts.length ? `Datos curiosos: ${stop.curiousFacts.join(' | ')}` : '',
    stop.tips.length ? `Consejos: ${stop.tips.join(' | ')}` : ''
  ].filter(Boolean).join('\n')
}

function tourProfile(tour) {
  const textValue = normalizeKey([
    tour.type,
    tour.mainCategory,
    ...tour.subcategories,
    ...tour.tags,
    ...tour.keywords
  ].join(' '))
  const score = (keys) => keys.some((key) => textValue.includes(key)) ? 100 : 35
  return {
    culture: score(['cultur', 'patrimonial', 'tradicion']),
    history: score(['hist', 'imperial', 'colonial', 'monument']),
    nature: score(['eco', 'natur', 'parque', 'rio', 'playa', 'sierra', 'desierto']),
    gastronomy: score(['gastronom', 'cafe', 'comida', 'mercado']),
    photography: score(['foto', 'mirador', 'panoram']),
    architecture: score(['arquitect', 'iglesia', 'catedral', 'palacio']),
    nightlife: score(['noct', 'salsa', 'noche']),
    sports: score(['deport', 'futbol']),
    museums: score(['museo', 'galeria']),
    shopping: score(['compras', 'mercado', 'artesania']),
    family: tour.recommendedAudience.some((item) => normalizeKey(item).includes('famil')) ? 100 : 50
  }
}

async function geocodeStop(stop, tour) {
  const manual = manualCoordinates(stop.name)
  if (manual) return { ...manual, missing: false }
  const query = [
    stop.locationInfo.nombre_lugar || stop.name,
    stop.locationInfo.direccion,
    stop.locationInfo.ciudad || tour.city,
    stop.locationInfo.region,
    stop.locationInfo.pais || tour.country
  ].filter(Boolean).join(', ')
  const key = normalizeKey(query)
  if (geocodeCache.has(key)) return geocodeCache.get(key)
  const result = await photonGeocode(query) ?? await nominatimGeocode(query)
  const value = result
    ? { latitude: result.latitude, longitude: result.longitude, missing: false }
    : { latitude: 0, longitude: 0, missing: true }
  geocodeCache.set(key, value)
  return value
}

function manualCoordinates(name) {
  const coordinates = {
    'torre eiffel': { latitude: 48.8584, longitude: 2.2945 },
    'museo del louvre': { latitude: 48.8606, longitude: 2.3376 },
    'montmartre y basilica del sagrado corazon': { latitude: 48.8867, longitude: 2.3431 },
    'times square': { latitude: 40.7580, longitude: -73.9855 },
    'estatua de la libertad': { latitude: 40.6892, longitude: -74.0445 },
    'puente de brooklyn': { latitude: 40.7061, longitude: -73.9969 },
    'observatorio one world': { latitude: 40.7130, longitude: -74.0132 },
    'abadia de westminster': { latitude: 51.4993, longitude: -0.1273 },
    'torre del reloj': { latitude: 10.4236, longitude: -75.5507 },
    'finca cafetera tradicional': { latitude: 4.6404, longitude: -75.5709 },
    'pueblo de filandia': { latitude: 4.6750, longitude: -75.6583 },
    'experiencia gastronomica cafetera': { latitude: 4.6370, longitude: -75.5707 },
    'mirador serrania de la macarena': { latitude: 2.2645, longitude: -73.7949 },
    'piscina del turista': { latitude: 2.2660, longitude: -73.7930 },
    'antigua aduana': { latitude: 10.9873, longitude: -74.7850 },
    'mirador del atardecer en el rodadero': { latitude: 11.2036, longitude: -74.2267 }
  }
  return coordinates[normalizeKey(name)] ?? null
}

async function photonGeocode(query) {
  try {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', query)
    url.searchParams.set('limit', '1')
    const response = await fetchWithTimeout(url, { timeoutMs: 9000 })
    if (!response.ok) return null
    const json = await response.json()
    const feature = json.features?.[0]
    if (!feature) return null
    return {
      latitude: Number(feature.geometry.coordinates[1]),
      longitude: Number(feature.geometry.coordinates[0])
    }
  } catch {
    return null
  }
}

async function nominatimGeocode(query) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    url.searchParams.set('q', query)
    const response = await fetchWithTimeout(url, {
      timeoutMs: 9000,
      headers: { 'User-Agent': 'VIBETOURS/1.0 contact=ops@vibetours.app' }
    })
    if (!response.ok) return null
    const json = await response.json()
    const result = json[0]
    if (!result) return null
    return {
      latitude: Number(result.lat),
      longitude: Number(result.lon)
    }
  } catch {
    return null
  }
}

async function fetchWithTimeout(url, { timeoutMs, headers } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { headers, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function locationInfo(value) {
  const item = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    nombre_lugar: text(item.nombre_lugar ?? item.nombreLugar, ''),
    direccion: text(item.direccion, ''),
    ciudad: text(item.ciudad, ''),
    region: text(item.region, ''),
    pais: text(item.pais, ''),
    place_id: text(item.place_id ?? item.placeId, ''),
    url_mapa: text(item.url_mapa ?? item.urlMapa, '')
  }
}

function imageList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => typeof item === 'string' ? item : item?.url)
    .filter((item) => typeof item === 'string' && item.trim())
}

function stringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function text(value, fallback) {
  const result = value == null ? '' : String(value).trim()
  return result || fallback
}

function tourType(value) {
  const key = normalizeKey(value ?? '')
  if (key.includes('gastronom')) return 'gastronomic'
  if (key.includes('histor')) return 'historical'
  if (key.includes('ecolog') || key.includes('natur')) return 'ecological'
  if (key.includes('romant')) return 'romantic'
  if (key.includes('deport')) return 'sports'
  if (key.includes('noct')) return 'night'
  if (key.includes('famil')) return 'family'
  if (key.includes('urban')) return 'urban'
  if (key.includes('cultur')) return 'cultural'
  return 'custom'
}

function difficulty(value) {
  const key = normalizeKey(value ?? '')
  if (key.includes('intens') || key.includes('dificil') || key.includes('alta')) return 'intense'
  if (key.includes('media') || key.includes('moder')) return 'moderate'
  return 'easy'
}

function languageCode(value) {
  const key = normalizeKey(value ?? '')
  if (key.includes('ingles') || key.includes('english')) return 'en'
  return 'es'
}

function minutesFrom(value, fallback) {
  if (typeof value === 'number') return Math.round(value)
  const textValue = String(value ?? '').toLowerCase()
  if (textValue.includes('dia')) return 8 * 60
  const match = textValue.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return fallback
  const number = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(number)) return fallback
  if (textValue.includes('hora')) return Math.round(number * 60)
  return Math.round(number)
}

function metersFrom(value, fallback) {
  if (typeof value === 'number') return Math.round(value * 1000)
  const textValue = String(value ?? '').toLowerCase()
  const match = textValue.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return fallback
  const number = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(number)) return fallback
  if (textValue.includes('metro') && !textValue.includes('k')) return Math.round(number)
  return Math.round(number * 1000)
}

function budget(value) {
  const item = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    bajo: number(item.bajo ?? item.low, 0),
    medio: number(item.medio ?? item.medium, 0),
    alto: number(item.alto ?? item.high, 0)
  }
}

function number(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function fallbackImage(seed) {
  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
  ]
  return images[Math.abs(hash(seed)) % images.length]
}

function slugify(value) {
  return normalizeKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeKey(value) {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function hash(value) {
  return [...String(value)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}
