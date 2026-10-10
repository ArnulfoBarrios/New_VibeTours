import { isCuratedCoastalCoordinateStop } from './coastal-destination-catalog.js'

const OSM_PRIMITIVES = new Set(['node', 'way', 'relation'])
const OSM_SOURCES = /^(?:osm|openstreetmap|osm[_-]?(?:nominatim|overpass)|nominatim|photon)(?:$|[_:-])/i

function normalizedText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function coordinatePair(place) {
  const latitude = Number(place?.latitude ?? place?.lat ?? place?.latitud)
  const longitude = Number(place?.longitude ?? place?.lon ?? place?.lng ?? place?.longitud)
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
}

function osmPrimitive(place) {
  const tags = place?.tags && typeof place.tags === 'object' ? place.tags : {}
  const explicitType = String(
    place?.osmType ?? place?.osm_type ?? place?.geometryType ??
    tags.osmType ?? tags.osm_type ?? tags.geometryType ?? ''
  ).toLowerCase()
  if (OSM_PRIMITIVES.has(explicitType)) return explicitType

  const identities = [
    place?.placeId, place?.place_id, place?.id, place?.osmId, place?.osm_id,
    place?.locationInfo?.place_id, place?.ubicacion?.place_id,
    place?.providerId, place?.providerKey,
    place?.providerIds?.osm, place?.providerIds?.nominatim,
    place?.tags?.place_id, place?.tags?.osm_id,
  ]
  for (const identity of identities) {
    const match = String(identity || '').match(/(?:^|[:/])(node|way|relation)[/:]\d+(?:$|\b)/i)
    if (match) return match[1].toLowerCase()
  }
  return ''
}

function hasOsmIdentity(place) {
  const source = String(
    place?.coordinateSource ?? place?.coordinate_source ?? place?.source ??
    place?.fuente_coordenadas ?? place?.locationInfo?.fuente_coordenadas ??
    place?.ubicacion?.fuente_coordenadas ?? ''
  ).trim()
  const primitive = osmPrimitive(place)
  const cachedOsmIdentity = /^cache/i.test(source) && Boolean(primitive) && [
    place?.placeId, place?.place_id, place?.id, place?.osmId, place?.osm_id,
    place?.locationInfo?.place_id, place?.ubicacion?.place_id,
    place?.providerIds?.osm, place?.providerIds?.nominatim
  ].some(value => /(?:^|[:/])(?:node|way|relation)[/:]\d+(?:$|\b)/i.test(String(value || '')))
  return coordinatePair(place) && Boolean(primitive) && (OSM_SOURCES.test(source) || cachedOsmIdentity)
}

export function isCoastalIslandsTour(value) {
  if (typeof value === 'string') return normalizedText(value) === 'coastal islands'
  return normalizedText(
    value?.tourType ?? value?.tour_type ?? value?.itineraryType ??
    value?.itinerary_type ?? value?.tipo_recorrido ?? value?.type
  ) === 'coastal islands'
}

/** Preserve coastal safeguards when extraction labels an island day as express. */
export function resolveChatTourTypeAfterExtraction(current = {}, extracted = {}, conversationText = '', options = {}) {
  const currentType = normalizedText(current?.tourType ?? current?.tour_type ?? current?.type).replace(/\s+/g, '_')
  const extractedType = normalizedText(extracted?.tourType ?? extracted?.tour_type ?? extracted?.type).replace(/\s+/g, '_')
  const routeTypes = new Set(['location_to_destination', 'city_to_city', 'international_multicity'])
  if (routeTypes.has(currentType)) return currentType
  if (routeTypes.has(extractedType)) return extractedType

  const explicitCoastal = extractedType === 'coastal_islands' ||
    (currentType === 'coastal_islands' && !options.destinationChanged)
  const destinationNames = [
    conversationText,
    current?.city,
    current?.destination,
    current?.destinationPlace,
    current?.canonicalDestination?.city,
    current?.canonicalDestination?.entityName,
    extracted?.city,
    extracted?.destination,
    extracted?.destinationPlace,
    extracted?.canonicalDestination?.city,
    extracted?.canonicalDestination?.entityName,
  ]
  const hasMorrosquilloDestination = destinationNames.some(value =>
    /\b(covenas|tolu|san antero|golfo de morrosquillo)\b/.test(normalizedText(value))
  )
  const savedStopNames = [
    ...(Array.isArray(current?.specificPlaces) ? current.specificPlaces : []),
    ...(Array.isArray(extracted?.specificPlaces) ? extracted.specificPlaces : []),
  ].map(place => typeof place === 'string' ? place : place?.name || '')
  const islandIntent = /\b(islas?|islotes?|cayos?|archipi[eé]lago|island\s+hopping|isla\s+m[uú]cura|isla\s+tintip[aá]n|san\s+bernardo)\b/i.test(
    [conversationText, ...savedStopNames].join(' ')
  )
  const coastalSightseeingIntent = /\b(lugares?|sitios?|atracciones?|visitar|ver|conocer|playas?|tur[ií]sticos?|bonit[oa]s?)\b/i.test(conversationText)
  if (explicitCoastal || (!options.destinationChanged && hasMorrosquilloDestination && (islandIntent || coastalSightseeingIntent))) {
    return 'coastal_islands'
  }
  if (options.destinationChanged) return extractedType
  return extractedType || currentType || ''
}

export function isCoastalRestaurant(place) {
  const tags = place?.rawTags ?? place?.tags ?? {}
  const category = normalizedText(
    place?.category ?? place?.entityType ?? place?.entity_type ?? place?.type ??
    place?.providerCategory ?? place?.provider_category
  )
  const name = normalizedText(place?.name ?? place?.nombre)
  return Boolean(
    place?.isRestaurant === true || place?.is_restaurant === true ||
    category === 'restaurant' || category === 'cafe' || category === 'food' ||
    ['restaurant', 'cafe', 'bar', 'pub', 'fast food', 'food court'].includes(normalizedText(tags.amenity)) ||
    Boolean(tags.cuisine) ||
    /\b(restaurante|restaurant|cafeteria|cafe|bistro|bar|pub|comida|gastronom|mariscos|cevicheria|pizzeria|asador|gourmet)\b/.test(name)
  )
}

export function isCoastalArchipelagoOverview(placeOrName) {
  const name = normalizedText(typeof placeOrName === 'string'
    ? placeOrName
    : placeOrName?.name ?? placeOrName?.nombre)
  return /^(?:archipielago de )?islas de san bernardo$/.test(name) ||
    /^(?:archipielago de san bernardo|san bernardo archipielago)$/.test(name) ||
    /^(?:san bernardo )?archipelago(?: of)? san bernardo$/.test(name)
}

export function isCoastalTransferStop(placeOrName) {
  const place = typeof placeOrName === 'string' ? null : placeOrName
  const tags = place?.rawTags ?? place?.tags ?? {}
  const isRestaurant = place && isCoastalRestaurant(place)
  if (isRestaurant) return false
  const name = normalizedText(typeof placeOrName === 'string'
    ? placeOrName
    : place?.name ?? place?.nombre)
  return /\b(puerto|muelle|embarcadero|marina|terminal maritimo|ferry terminal)\b/.test(name) ||
    tags.waterway === 'ferry_terminal' || tags.amenity === 'ferry_terminal' ||
    tags.leisure === 'marina' || tags.amenity === 'marina'
}

export function isCoastalIslandStop(place) {
  const name = normalizedText(place?.name ?? place?.nombre)
  const tags = place?.rawTags ?? place?.tags ?? {}
  return tags.place === 'island' || tags.natural === 'island' ||
    tags.place === 'islet' || tags.natural === 'islet' ||
    /\b(isla|islas|islote|islotes|island|islands|islet|cayo|cayos|archipielago)\b/.test(name)
}

export function isCoastalOpenStreetMapNode(place) {
  return hasOsmIdentity(place) && osmPrimitive(place) === 'node'
}

export function isCoastalMappedTouristStop(place) {
  const name = String(place?.name ?? place?.nombre ?? '').trim()
  const curated = isCuratedCoastalCoordinateStop(
    place,
    place?.curatedDestinationKey ?? place?.city ?? place?.destination ??
    place?.locationInfo?.ciudad ?? place?.ubicacion?.ciudad ?? ''
  )
  if (!name || (!hasOsmIdentity(place) && !curated)) return false
  if (isCoastalArchipelagoOverview(name) || (!curated && isCoastalTransferStop(place))) return false
  return !isCoastalRestaurant(place) || isCoastalOpenStreetMapNode(place)
}

function coastalCatalogNameKey(value) {
  return normalizedText(value)
}

/**
 * Rehydrates legacy name-only coastal catalogs from their mapped candidate
 * records. Plain names are never trusted as stop locations.
 */
export function resolveCoastalCatalogEntries(entries, candidateCatalog = {}, kind = 'places') {
  const isRestaurantList = kind === 'restaurants'
  const candidatePool = [
    ...(Array.isArray(candidateCatalog?.[kind]) ? candidateCatalog[kind] : []),
    ...(Array.isArray(candidateCatalog?.all) ? candidateCatalog.all : []),
  ].filter(candidate => candidate && typeof candidate === 'object')
  const result = []
  const seen = new Set()

  for (const entry of Array.isArray(entries) ? entries : []) {
    const entryName = typeof entry === 'string'
      ? entry.trim()
      : String(entry?.name ?? entry?.nombre ?? '').trim()
    if (!entryName) continue

    const canonical = typeof entry === 'object' && isCoastalMappedTouristStop(entry)
      ? entry
      : candidatePool.find(candidate =>
          coastalCatalogNameKey(candidate?.name ?? candidate?.nombre) === coastalCatalogNameKey(entryName) &&
          isCoastalMappedTouristStop(candidate)
        )
    if (!canonical) continue
    if (isRestaurantList !== isCoastalRestaurant(canonical)) continue

    const key = coastalCatalogNameKey(canonical.name ?? canonical.nombre)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(canonical)
  }

  return result
}

export function assignCoastalIslandDays(stops, requestedDays = 1) {
  const items = (Array.isArray(stops) ? stops : [])
    .filter(stop => stop && typeof stop === 'object')
    .map((stop, index) => ({ ...stop, __coastalOrder: index }))
  const maxRequestedDay = Math.max(
    1,
    Number(requestedDays) || 1,
    ...items.map(stop => Number(stop.dia ?? stop.day ?? 0) || 0)
  )
  const islandDays = new Set()

  for (const stop of items) {
    const preferredDay = Math.max(1, Math.min(maxRequestedDay, Number(stop.dia ?? stop.day ?? 1) || 1))
    let assignedDay = preferredDay
    if (isCoastalIslandStop(stop) && !isCoastalRestaurant(stop)) {
      if (islandDays.has(assignedDay)) {
        assignedDay = Array.from({ length: maxRequestedDay }, (_, index) => index + 1)
          .find(day => !islandDays.has(day)) ?? preferredDay
      }
      islandDays.add(assignedDay)
    }
    stop.dia = assignedDay
    stop.day = assignedDay
  }

  const attractionDays = new Set(items
    .filter(stop => !isCoastalRestaurant(stop))
    .map(stop => Number(stop.dia || stop.day || 1)))
  const filtered = items.filter(stop => !isCoastalRestaurant(stop) || attractionDays.has(Number(stop.dia || stop.day || 1)))
  return filtered
    .sort((a, b) => Number(a.dia || a.day || 1) - Number(b.dia || b.day || 1) || a.__coastalOrder - b.__coastalOrder)
    .map(({ __coastalOrder, ...stop }) => stop)
}
