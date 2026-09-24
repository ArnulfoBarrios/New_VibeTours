import {
  arePlacesSimilar,
  haversineMeters,
  isFoodOrDrinkEstablishment,
  isGenericFacilityName,
  isNonTouristFacility,
  isValidHotelCandidate,
  overpassAttractions,
  overpassHotels,
  overpassNearbyFood
} from './osm.js'
import { normalizePlaceNameKey } from './places-cache-service.js'
import {
  resolvePlaceWithCascade,
  searchGeoapifyPlaces,
  searchMapboxPlaces
} from './places-resolver.js'

const TRUSTED_SOURCES = new Set([
  'osm',
  'photon',
  'nominatim',
  'mapbox',
  'geoapify',
  'curated',
  'cache',
  'cache_memory',
  'cache_db'
])

const CATEGORY_LIMITS = Object.freeze({
  attraction: 40,
  restaurant: 30,
  hotel: 20
})

const MAPBOX_QUERIES = Object.freeze({
  attraction: ['tourism', 'museum', 'historic landmark', 'park', 'viewpoint', 'beach'],
  restaurant: ['restaurant', 'local cuisine', 'cafe'],
  hotel: ['hotel', 'hostel', 'resort', 'accommodation']
})

const GEOAPIFY_CATEGORIES = Object.freeze({
  attraction: [
    'tourism.sights',
    'tourism.attraction',
    'tourism.museum',
    'tourism.viewpoint',
    'leisure.park',
    'natural.beach'
  ],
  restaurant: [
    'catering.restaurant',
    'catering.cafe',
    'catering.bar',
    'catering.fast_food'
  ],
  hotel: [
    'accommodation.hotel',
    'accommodation.hostel',
    'accommodation.resort',
    'accommodation.guest_house'
  ]
})

const ATTRACTION_TYPES = new Set([
  'museum', 'gallery', 'viewpoint', 'attraction', 'theme_park', 'zoo', 'aquarium',
  'monument', 'memorial', 'ruins', 'castle', 'archaeological_site', 'church',
  'cathedral', 'city_gate', 'fort', 'heritage', 'park', 'garden', 'nature_reserve',
  'beach', 'island', 'islet', 'national_park', 'arts_centre', 'marketplace',
  'theatre', 'ferry_terminal'
])

const RESTAURANT_TYPES = new Set([
  'restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court', 'biergarten',
  'ice_cream', 'confectionery'
])

const HOTEL_TYPES = new Set([
  'hotel', 'hostel', 'guest_house', 'resort', 'motel', 'chalet', 'camp_site',
  'caravan_site', 'accommodation'
])

function normalizeIdentityText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function asSignalList(value) {
  if (Array.isArray(value)) return value.flatMap(item => asSignalList(item))
  if (value == null) return []
  return String(value)
    .split(/[;,|]/)
    .map(item => normalizeIdentityText(item))
    .filter(Boolean)
}

function providerSignals(candidate) {
  const tags = candidate?.tags && typeof candidate.tags === 'object' ? candidate.tags : {}
  const type = normalizeIdentityText(candidate?.providerType || candidate?.type)
  // `category` is the internal role requested by the planner, not provider
  // evidence. Only providerCategory/type and raw provider tags count here.
  const providerCategory = normalizeIdentityText(candidate?.providerCategory)
  const tourism = normalizeIdentityText(tags.tourism)
  const historic = normalizeIdentityText(tags.historic)
  const leisure = normalizeIdentityText(tags.leisure)
  const natural = normalizeIdentityText(tags.natural)
  const place = normalizeIdentityText(tags.place)
  const boundary = normalizeIdentityText(tags.boundary)
  const amenity = normalizeIdentityText(tags.amenity)
  const geoapifyCategories = asSignalList(tags.geoapifyCategories)
  const mapboxPlaceTypes = asSignalList(tags.mapboxPlaceTypes)
  const mapboxCategory = asSignalList(tags.mapboxCategory || tags.category)
  const query = normalizeIdentityText(tags.query)

  const attraction = []
  const restaurant = []
  const hotel = []
  const add = (list, reason) => {
    if (reason && !list.includes(reason)) list.push(reason)
  }

  if (ATTRACTION_TYPES.has(type)) add(attraction, `type:${type}`)
  if (ATTRACTION_TYPES.has(providerCategory)) add(attraction, `category:${providerCategory}`)
  if (ATTRACTION_TYPES.has(tourism)) add(attraction, `tourism:${tourism}`)
  if (ATTRACTION_TYPES.has(historic)) add(attraction, `historic:${historic}`)
  if (ATTRACTION_TYPES.has(leisure)) add(attraction, `leisure:${leisure}`)
  if (ATTRACTION_TYPES.has(natural)) add(attraction, `natural:${natural}`)
  if (ATTRACTION_TYPES.has(place)) add(attraction, `place:${place}`)
  if (boundary === 'national park' || boundary === 'national_park') add(attraction, 'boundary:national_park')
  if (geoapifyCategories.some(value => value.startsWith('tourism.') || value.startsWith('tourism ') || value.startsWith('leisure.') || value.startsWith('leisure '))) {
    add(attraction, 'geoapify:tourism_or_leisure')
  }
  if (mapboxPlaceTypes.some(value => value === 'poi' || value === 'landmark')) {
    if (/\b(tourism|museum|historic|landmark|park|viewpoint|beach)\b/.test(query)) add(attraction, `mapbox:${query}`)
  }
  if (/\b(castillo|fuerte|museo|parque|plaza|mirador|monumento|monument|playa|beach|catedral|iglesia|teatro|jardin|isla|fortaleza|palacio|patrimonio)\b/.test(normalizeIdentityText(candidate?.name))) {
    add(attraction, 'name:tourist_landmark')
  }

  if (RESTAURANT_TYPES.has(type)) add(restaurant, `type:${type}`)
  if (RESTAURANT_TYPES.has(providerCategory)) add(restaurant, `category:${providerCategory}`)
  if (RESTAURANT_TYPES.has(amenity)) add(restaurant, `amenity:${amenity}`)
  if (tags.cuisine) add(restaurant, 'osm:cuisine')
  if (geoapifyCategories.some(value => value.startsWith('catering.') || value.startsWith('catering '))) add(restaurant, 'geoapify:catering')
  if (mapboxPlaceTypes.some(value => value === 'poi') && /\b(restaurant|local cuisine|cafe)\b/.test(query)) {
    add(restaurant, `mapbox:${query}`)
  }
  if (isFoodOrDrinkEstablishment(candidate?.name)) add(restaurant, 'name:food_or_drink')

  if (HOTEL_TYPES.has(type)) add(hotel, `type:${type}`)
  if (HOTEL_TYPES.has(providerCategory)) add(hotel, `category:${providerCategory}`)
  if (HOTEL_TYPES.has(normalizeIdentityText(tags.tourism))) add(hotel, `tourism:${normalizeIdentityText(tags.tourism)}`)
  if (geoapifyCategories.some(value => value.startsWith('accommodation.') || value.startsWith('accommodation '))) add(hotel, 'geoapify:accommodation')
  if (mapboxPlaceTypes.some(value => value === 'poi') && /\b(hotel|hostel|resort|accommodation)\b/.test(query)) {
    add(hotel, `mapbox:${query}`)
  }
  if (/\b(hotel|hostel|resort|posada|motel|alojamiento|guest house|caba[nñ]a)\b/.test(normalizeIdentityText(candidate?.name))) {
    add(hotel, 'name:accommodation')
  }

  return { attraction, restaurant, hotel }
}

function canonicalCandidateId(candidate, category) {
  const source = normalizeSource(candidate?.coordinateSource || candidate?.source)
  const placeId = candidateSourceId(candidate)
  if (placeId) return `${source || 'provider'}:${placeId}`
  return `${source || 'provider'}:${category}:${candidateNameKey(candidate?.name)}:${Number(candidate?.latitude).toFixed(5)},${Number(candidate?.longitude).toFixed(5)}`
}

/**
 * Strict gate for the unified catalog. A candidate must identify one physical
 * place and carry provider/category evidence compatible with its destination
 * role. It is intentionally independent of the language model.
 */
export function validateCandidateIdentityAndCategory(candidate, {
  category,
  destination = '',
  country = '',
  centerLat = null,
  centerLon = null,
  radiusKm = 35
} = {}) {
  const reasons = []
  const name = readCandidateName(candidate)
  const { latitude, longitude } = readCandidateCoordinates(candidate || {})
  const source = normalizeSource(candidate?.coordinateSource ?? candidate?.coordinate_source ?? candidate?.source)
  const placeId = candidateSourceId(candidate)
  const address = String(candidate?.address || candidate?.formatted || '').trim()
  const signals = providerSignals({ ...candidate, name })
  const catalogCategory = normalizeIdentityText(candidate?.catalogCategoryEvidence)
  if (catalogCategory === normalizeIdentityText(category) && candidate?.catalogNameVerified === true) {
    signals[category] = [...(signals[category] || []), `catalog:verified_${category}_name`]
  }
  const requestedSignals = signals[category] || []
  const categoryConflicts = Object.entries(signals)
    .filter(([candidateCategory, values]) => candidateCategory !== category && values.length > 0)
    .map(([candidateCategory]) => candidateCategory)
  const trustedCatalogRole = catalogCategory === normalizeIdentityText(category) &&
    candidate?.catalogNameVerified === true &&
    requestedSignals.some(signal => !signal.startsWith('catalog:'))

  if (!name || isGenericFacilityName(name)) reasons.push('identity:name_missing_or_generic')
  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) reasons.push('identity:coordinates_missing')
  if (!isTrustedSource(source)) reasons.push('identity:untrusted_source')
  const providerCoordinatesVerified = candidate?.rawCoordinatesVerified === true || candidate?.coordinatesVerified === true
  if (!placeId && !address && !providerCoordinatesVerified) reasons.push('identity:no_provider_id_address_or_verified_coordinates')
  if (!candidateDistanceWithin({ latitude, longitude }, centerLat, centerLon, radiusKm)) reasons.push('identity:outside_destination_radius')

  const candidateCountry = normalizeIdentityText(candidate?.country)
  const targetCountry = normalizeIdentityText(country)
  if (candidateCountry && targetCountry && !candidateCountry.includes(targetCountry) && !targetCountry.includes(candidateCountry)) {
    reasons.push('identity:country_mismatch')
  }

  if (categoryConflicts.length > 0 && !trustedCatalogRole) reasons.push(`category:conflict_with_${categoryConflicts.join('_')}`)
  if (requestedSignals.length === 0) reasons.push(`category:no_${category}_evidence`)

  if (reasons.length > 0) {
    return {
      ok: false,
      reason: reasons[0],
      reasons,
      signals,
      identityStatus: 'rejected',
      categoryStatus: 'rejected'
    }
  }

  const identityStatus = placeId && address
    ? 'strong'
    : placeId || address
      ? 'verified'
      : 'provider_coordinates'
  const identityConfidence = placeId && address ? 0.98 : placeId ? 0.9 : 0.82
  const categoryConfidence = requestedSignals.some(signal => signal.startsWith('type:') || signal.startsWith('geoapify:') || signal.startsWith('amenity:') || signal.startsWith('tourism:'))
    ? 0.98
    : 0.88

  return {
    ok: true,
    reason: '',
    reasons: [],
    signals,
    canonicalId: canonicalCandidateId({ ...candidate, name, placeId, coordinateSource: source, latitude, longitude }, category),
    identityStatus,
    identityConfidence,
    categoryStatus: 'compatible',
    categoryConfidence,
    categoryEvidence: requestedSignals
  }
}

function normalizeSource(value, fallback = '') {
  const source = String(value || fallback || '').trim().toLowerCase()
  if (!source) return ''
  if (source.startsWith('ai_address:')) return source.slice('ai_address:'.length)
  if (source.startsWith('cache_db:')) return 'cache_db'
  if (source.startsWith('cache_')) return source
  return source.split(':')[0]
}

function toFiniteCoordinate(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function readCandidateCoordinates(raw) {
  return {
    latitude: toFiniteCoordinate(raw?.latitude ?? raw?.lat ?? raw?.latitud),
    longitude: toFiniteCoordinate(raw?.longitude ?? raw?.lon ?? raw?.lng ?? raw?.longitud)
  }
}

function readCandidateName(raw) {
  if (typeof raw === 'string') return raw.trim()
  return String(raw?.name ?? raw?.nombre ?? '').trim()
}

function candidateSourceId(raw) {
  return String(raw?.placeId ?? raw?.place_id ?? raw?.osmId ?? raw?.osm_id ?? raw?.id ?? '').trim()
}

/**
 * Returns the identifier that may be sent across the AI/planner boundary.
 * Names are deliberately not used as identifiers. When a provider does not
 * expose an ID, the verified coordinate pair remains deterministic enough to
 * keep the candidate addressable without inventing a place name.
 */
export function getCandidateId(raw) {
  const explicit = String(
    raw?.candidateId ??
    raw?.candidate_id ??
    raw?.canonicalId ??
    raw?.placeId ??
    raw?.place_id ??
    raw?.locationInfo?.candidateId ??
    raw?.locationInfo?.candidate_id ??
    raw?.locationInfo?.place_id ??
    raw?.ubicacion?.candidateId ??
    raw?.ubicacion?.candidate_id ??
    raw?.ubicacion?.place_id ??
    raw?.id ??
    ''
  ).trim()
  if (explicit) return explicit
  const { latitude, longitude } = readCandidateCoordinates(raw || {})
  if (latitude == null || longitude == null || (latitude === 0 && longitude === 0)) return ''
  const source = normalizeSource(raw?.coordinateSource ?? raw?.coordinate_source ?? raw?.source, 'coordinates') || 'coordinates'
  return `${source}:${latitude.toFixed(5)},${longitude.toFixed(5)}`
}

function candidateNameKey(name) {
  return normalizePlaceNameKey(name) || String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isTrustedSource(source) {
  if (!source) return false
  return TRUSTED_SOURCES.has(source) || source.startsWith('cache')
}

function isCandidateAllowed(candidate, category) {
  const name = candidate.name
  if (!name || isGenericFacilityName(name)) return false
  const tags = { ...(candidate.tags || {}), name }
  if (isNonTouristFacility(tags)) return false

  if (category === 'attraction') {
    if (isFoodOrDrinkEstablishment(name)) return false
  } else if (category === 'hotel') {
    if (!isValidHotelCandidate(name, tags)) return false
  } else if (category === 'restaurant') {
    if (/\b(hotel|hostel|resort|hospital|cl[ií]nica|farmacia|supermercado)\b/i.test(name)) return false
  }

  return true
}

function candidateDistanceWithin(candidate, centerLat, centerLon, radiusKm) {
  if (centerLat == null || centerLon == null) return true
  const distance = haversineMeters(centerLat, centerLon, candidate.latitude, candidate.longitude)
  return Number.isFinite(distance) && distance <= radiusKm * 1000
}

/**
 * Converts any provider result into the one internal candidate shape used by
 * the planner. Names without map coordinates are deliberately discarded.
 */
export function normalizeRealCandidate(raw, {
  category,
  destination = '',
  country = '',
  sourceHint = '',
  centerLat = null,
  centerLon = null,
  radiusKm = 35
} = {}) {
  const name = readCandidateName(raw)
  const { latitude, longitude } = readCandidateCoordinates(raw || {})
  if (!name || latitude == null || longitude == null || (latitude === 0 && longitude === 0)) return null

  const source = normalizeSource(raw?.coordinateSource ?? raw?.coordinate_source ?? raw?.source, sourceHint)
  if (!isTrustedSource(source)) return null

  const candidate = {
    name,
    category,
    city: String(raw?.city || destination || '').trim(),
    country: String(raw?.country || country || '').trim(),
    address: String(raw?.address || raw?.formatted || '').trim(),
    latitude,
    longitude,
    placeId: candidateSourceId(raw),
    coordinateSource: source,
    coordinatesVerified: true,
    rawCoordinatesVerified: raw?.coordinatesVerified === true || raw?.coordinates_verified === true,
    tags: raw?.tags && typeof raw.tags === 'object' ? raw.tags : {},
    providerType: String(raw?.providerType || raw?.type || '').trim(),
    providerCategory: String(raw?.providerCategory || raw?.category || '').trim(),
    catalogCategoryEvidence: String(raw?.catalogCategoryEvidence || '').trim(),
    catalogNameVerified: raw?.catalogNameVerified === true,
    description: String(raw?.desc || raw?.description || '').trim(),
    specialty: String(raw?.specialty || '').trim(),
    stars: raw?.stars == null ? '' : String(raw.stars),
    price: String(raw?.price || '').trim(),
    relevance: Number(raw?.relevance ?? raw?.score ?? 0)
  }

  if (!candidateDistanceWithin(candidate, centerLat, centerLon, radiusKm)) return null
  if (!isCandidateAllowed(candidate, category)) return null

  const validation = validateCandidateIdentityAndCategory(candidate, {
    category,
    destination,
    country,
    centerLat,
    centerLon,
    radiusKm
  })
  if (!validation.ok) return null

  const sourceId = candidate.placeId || `${source}:${candidateNameKey(name)}:${latitude.toFixed(5)},${longitude.toFixed(5)}`
  const distanceMeters = centerLat == null || centerLon == null
    ? null
    : Math.round(haversineMeters(centerLat, centerLon, latitude, longitude))

  return {
    ...candidate,
    id: sourceId,
    candidateId: sourceId,
    canonicalId: validation.canonicalId,
    sourceIds: candidate.placeId ? [candidate.placeId] : [],
    sources: [source],
    providerEvidence: [{
      source,
      placeId: candidate.placeId,
      name,
      latitude,
      longitude,
      categoryEvidence: validation.categoryEvidence
    }],
    sourceCount: 1,
    confidence: Math.min(0.99, (validation.identityConfidence + validation.categoryConfidence) / 2),
    verificationStatus: 'verified',
    identityStatus: validation.identityStatus,
    identityConfidence: validation.identityConfidence,
    categoryStatus: validation.categoryStatus,
    categoryConfidence: validation.categoryConfidence,
    categoryEvidence: validation.categoryEvidence,
    distanceMeters,
    isAccommodationBase: category === 'hotel',
    nameKey: candidateNameKey(name)
  }
}

function candidatesReferToSamePlace(left, right) {
  if (!left || !right || left.category !== right.category) return false
  const leftSourceId = left.placeId || left.sourceIds?.[0]
  const rightSourceId = right.placeId || right.sourceIds?.[0]
  if (left.sources?.[0] === right.sources?.[0] && leftSourceId && rightSourceId && leftSourceId !== rightSourceId) {
    return false
  }
  if (leftSourceId && rightSourceId && left.sources?.length === 1 && right.sources?.length === 1 &&
      left.sources[0] === right.sources[0] && leftSourceId === rightSourceId) {
    return true
  }

  if (left.canonicalId && right.canonicalId && left.canonicalId === right.canonicalId) return true

  const distanceMeters = haversineMeters(left.latitude, left.longitude, right.latitude, right.longitude)
  if (!Number.isFinite(distanceMeters)) return false
  if (left.nameKey === right.nameKey) return distanceMeters <= 250
  return distanceMeters <= 180 && arePlacesSimilar(left.name, right.name)
}

function mergeCandidateRecords(left, right) {
  const preferRight = (!left.address && right.address) ||
    (!left.placeId && right.placeId) ||
    (right.relevance > left.relevance && right.sources?.[0] !== 'curated')
  const primary = preferRight ? right : left
  const secondary = preferRight ? left : right
  const sources = [...new Set([...(left.sources || []), ...(right.sources || [])])]
  const sourceIds = [...new Set([...(left.sourceIds || []), ...(right.sourceIds || [])].filter(Boolean))]
  const providerEvidence = [...(left.providerEvidence || []), ...(right.providerEvidence || [])]
  const sourceCount = sources.length

  return {
    ...primary,
    address: primary.address || secondary.address || '',
    city: primary.city || secondary.city || '',
    country: primary.country || secondary.country || '',
    description: primary.description || secondary.description || '',
    specialty: primary.specialty || secondary.specialty || '',
    stars: primary.stars || secondary.stars || '',
    price: primary.price || secondary.price || '',
    sources,
    sourceIds,
    providerEvidence,
    sourceCount,
    canonicalId: primary.canonicalId || secondary.canonicalId,
    candidateId: primary.candidateId || secondary.candidateId || primary.id || secondary.id || '',
    providerType: primary.providerType || secondary.providerType || '',
    providerCategory: primary.providerCategory || secondary.providerCategory || '',
    catalogCategoryEvidence: primary.catalogCategoryEvidence || secondary.catalogCategoryEvidence || '',
    catalogNameVerified: primary.catalogNameVerified || secondary.catalogNameVerified || false,
    categoryEvidence: [...new Set([...(left.categoryEvidence || []), ...(right.categoryEvidence || [])])],
    identityStatus: primary.identityStatus === 'strong' || secondary.identityStatus === 'strong'
      ? 'strong'
      : primary.identityStatus || secondary.identityStatus || 'verified',
    identityConfidence: Math.max(left.identityConfidence || 0, right.identityConfidence || 0),
    categoryStatus: 'compatible',
    categoryConfidence: Math.max(left.categoryConfidence || 0, right.categoryConfidence || 0),
    confidence: Math.min(0.99, Math.max(left.confidence || 0, right.confidence || 0) + ((sourceCount - 1) * 0.05)),
    verificationStatus: 'verified',
    isAccommodationBase: primary.category === 'hotel',
    nameKey: primary.nameKey
  }
}

/**
 * Deduplicates candidates across OSM, Photon, Mapbox and Geoapify while
 * preserving provider evidence for debugging and future ranking decisions.
 */
export function mergeRealCandidates(records = [], options = {}) {
  const merged = []
  for (const record of records) {
    if (!record) continue
    const matchIndex = merged.findIndex(existing => candidatesReferToSamePlace(existing, record))
    if (matchIndex === -1) {
      merged.push(record)
    } else {
      merged[matchIndex] = mergeCandidateRecords(merged[matchIndex], record)
    }
  }

  const { centerLat = null, centerLon = null, limit = 40 } = options
  return merged
    .map((candidate, index) => ({ ...candidate, _catalogOrder: index }))
    .sort((left, right) => {
      if (right.sourceCount !== left.sourceCount) return right.sourceCount - left.sourceCount
      if (right.confidence !== left.confidence) return right.confidence - left.confidence
      if (left.distanceMeters != null && right.distanceMeters != null && left.distanceMeters !== right.distanceMeters) {
        return left.distanceMeters - right.distanceMeters
      }
      return left._catalogOrder - right._catalogOrder
    })
    .slice(0, limit)
    .map(({ _catalogOrder, ...candidate }) => candidate)
}

function asCandidateArray(value) {
  return Array.isArray(value) ? value : []
}

function providerQueries(destination, country, category) {
  const target = `${destination}${country ? `, ${country}` : ''}`.trim()
  return (MAPBOX_QUERIES[category] || []).map(term => `${term} ${target}`.trim())
}

async function resolveSeedCandidates(seedList, category, context) {
  const seeds = asCandidateArray(seedList)
    .map(seed => typeof seed === 'string' ? { name: seed } : seed)
    .filter(seed => readCandidateName(seed))
    .slice(0, category === 'attraction' ? 12 : 8)

  const resolved = await Promise.all(seeds.map(async seed => {
    const seedRoleEvidence = {
      catalogCategoryEvidence: category,
      catalogNameVerified: true
    }
    const alreadyResolved = normalizeRealCandidate({ ...seed, ...seedRoleEvidence }, { ...context, category, sourceHint: 'osm' })
    if (alreadyResolved) return alreadyResolved

    const result = await resolvePlaceWithCascade({
      name: readCandidateName(seed),
      city: context.destination,
      country: context.country,
      cityLat: context.centerLat,
      cityLon: context.centerLon,
      maxDistanceKm: context.radiusKm,
      options: { preferLiveProviders: true }
    }).catch(() => null)
    return normalizeRealCandidate({ ...seed, ...(result || {}), ...seedRoleEvidence }, {
      ...context,
      category,
      sourceHint: result?.coordinateSource || 'osm'
    })
  }))

  return resolved.filter(Boolean)
}

async function discoverProviderCandidates({ destination, country, centerLat, centerLon, radiusKm }) {
  const centerAvailable = Number.isFinite(Number(centerLat)) && Number.isFinite(Number(centerLon))
  if (!centerAvailable) return { attraction: [], restaurant: [], hotel: [] }

  const categoryTasks = ['attraction', 'restaurant', 'hotel'].map(async category => {
    const [mapbox, geoapify] = await Promise.all([
      searchMapboxPlaces({
        queries: providerQueries(destination, country, category),
        cityLat: centerLat,
        cityLon: centerLon,
        maxDistanceKm: radiusKm
      }).catch(() => []),
      searchGeoapifyPlaces({
        categories: GEOAPIFY_CATEGORIES[category],
        cityLat: centerLat,
        cityLon: centerLon,
        radiusMeters: radiusKm * 1000,
        limit: category === 'attraction' ? 60 : 40
      }).catch(() => [])
    ])

    return {
      category,
      records: [...mapbox, ...geoapify]
        .map(raw => normalizeRealCandidate(raw, {
          category,
          destination,
          country,
          centerLat,
          centerLon,
          radiusKm
        }))
        .filter(Boolean)
    }
  })

  const discovered = await Promise.all(categoryTasks)
  return discovered.reduce((acc, item) => {
    acc[item.category] = item.records
    return acc
  }, { attraction: [], restaurant: [], hotel: [] })
}

async function discoverOsmCandidates({ centerLat, centerLon, radiusKm }) {
  if (!Number.isFinite(Number(centerLat)) || !Number.isFinite(Number(centerLon))) {
    return { attraction: [], restaurant: [], hotel: [] }
  }

  const [attractions, restaurants, hotels] = await Promise.all([
    overpassAttractions(centerLat, centerLon, radiusKm * 1000).catch(() => []),
    overpassNearbyFood(centerLat, centerLon, Math.min(radiusKm * 1000, 12000)).catch(() => []),
    overpassHotels(centerLat, centerLon, 'moderate', Math.min(radiusKm * 1000, 15000)).catch(() => [])
  ])

  const normalize = (records, category) => records
    .map(raw => normalizeRealCandidate(raw, {
      category,
      sourceHint: 'osm',
      centerLat,
      centerLon,
      radiusKm
    }))
    .filter(Boolean)

  return {
    attraction: normalize(attractions, 'attraction'),
    restaurant: normalize(restaurants, 'restaurant'),
    hotel: normalize(hotels, 'hotel')
  }
}

/**
 * Builds the single source of truth consumed by the itinerary planner.
 * Existing candidates can be supplied by the current OSM pipeline; the
 * catalog then enriches them with Mapbox/Geoapify discovery and resolves
 * named seeds through the same provider cascade.
 */
export async function createUnifiedCandidateCatalog({
  destination = '',
  country = '',
  centerLat = null,
  centerLon = null,
  radiusKm = 35,
  existing = {},
  seeds = {},
  discoverOsm = false
} = {}) {
  const context = { destination, country, centerLat, centerLon, radiusKm }
  const osmCandidates = discoverOsm
    ? await discoverOsmCandidates(context)
    : { attraction: [], restaurant: [], hotel: [] }
  const providerCandidates = await discoverProviderCandidates(context)

  const existingByCategory = {
    attraction: asCandidateArray(existing.attractions || existing.places),
    restaurant: asCandidateArray(existing.restaurants),
    hotel: asCandidateArray(existing.hotels)
  }
  const seedsByCategory = {
    attraction: asCandidateArray(seeds.attractions || seeds.places),
    restaurant: asCandidateArray(seeds.restaurants),
    hotel: asCandidateArray(seeds.hotels)
  }

  const catalog = {}
  for (const category of ['attraction', 'restaurant', 'hotel']) {
    const current = existingByCategory[category]
      .map(raw => normalizeRealCandidate(raw, {
        ...context,
        category,
        sourceHint: 'osm'
      }))
      .filter(Boolean)
    const resolvedNameKeys = new Set(current.map(candidate => candidate.nameKey))
    const unresolvedSeeds = seedsByCategory[category].filter(seed => {
      const name = readCandidateName(seed)
      return name && !resolvedNameKeys.has(candidateNameKey(name))
    })
    const seedsResolved = await resolveSeedCandidates(unresolvedSeeds, category, context)
    const merged = mergeRealCandidates([
      ...current,
      ...seedsResolved,
      ...osmCandidates[category],
      ...providerCandidates[category]
    ], {
      centerLat,
      centerLon,
      limit: CATEGORY_LIMITS[category]
    })
    catalog[category] = merged
  }

  const all = [...catalog.attraction, ...catalog.restaurant, ...catalog.hotel]
  return {
    destination,
    country,
    center: Number.isFinite(Number(centerLat)) && Number.isFinite(Number(centerLon))
      ? { latitude: Number(centerLat), longitude: Number(centerLon) }
      : null,
    sources: [...new Set(all.flatMap(candidate => candidate.sources || []))],
    places: catalog.attraction,
    attractions: catalog.attraction,
    restaurants: catalog.restaurant,
    hotels: catalog.hotel,
    all
  }
}
