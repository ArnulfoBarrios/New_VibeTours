const CURATED_SOURCE = 'curated_coastal'

function normalizePlaceName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeDestination(value) {
  const normalized = normalizePlaceName(value)
  const covenas = /\bcovenas\b/.test(normalized)
  const tolu = /\btolu\b/.test(normalized)
  if (covenas === tolu) return ''
  return covenas ? 'covenas' : 'tolu'
}

const COVENAS_STOPS = Object.freeze([
  { id: 'playa-primera-ensenada', name: 'Playa Primera Ensenada', latitude: 9.406388, longitude: -75.669701, kind: 'beach' },
  { id: 'playa-segunda-ensenada', name: 'Playa Segunda Ensenada', latitude: 9.424386, longitude: -75.640120, kind: 'beach' },
  { id: 'playa-la-coquerita', name: 'Playa La Coquerita', latitude: 9.403899, longitude: -75.679372, kind: 'beach' },
  { id: 'playa-bocas-de-la-cienaga', name: 'Playa Bocas de la Ciénaga', latitude: 9.436518, longitude: -75.629440, kind: 'beach' },
  { id: 'cienaga-la-caimanera', name: 'Ciénaga La Caimanera', latitude: 9.409630, longitude: -75.628090, kind: 'nature' },
  { id: 'acceso-cienaga-la-caimanera', name: 'Sector de acceso a la Ciénaga La Caimanera', latitude: 9.434738, longitude: -75.628461, kind: 'access' },
  { id: 'parque-especializado-la-caimanera', name: 'Parque Especializado La Caimanera', latitude: 9.437261, longitude: -75.629786, kind: 'nature' },
  { id: 'isla-gallinazo-y-la-marta', name: 'Sector Isla Gallinazo y La Marta', latitude: 9.455909, longitude: -75.614897, kind: 'nature' },
  { id: 'punta-de-piedra', name: 'Punta de Piedra', latitude: 9.420390, longitude: -75.651520, kind: 'coast' },
])

const TOLU_STOPS = Object.freeze([
  { id: 'playa-el-frances', name: 'Playa El Francés', latitude: 9.566067, longitude: -75.573737, kind: 'beach' },
  { id: 'playas-de-puerto-viejo', name: 'Playas de Puerto Viejo', latitude: 9.468566, longitude: -75.607466, kind: 'beach' },
  { id: 'playas-de-palo-blanco', name: 'Playas de Palo Blanco', latitude: 9.478370, longitude: -75.602510, kind: 'beach' },
  { id: 'playa-del-malecon-y-embarcaderos', name: 'Playa del Malecón y zona de embarcaderos', latitude: 9.522041, longitude: -75.586262, kind: 'beach' },
  { id: 'plaza-pedro-de-heredia', name: 'Plaza Pedro de Heredia, parque principal', latitude: 9.524000, longitude: -75.584250, kind: 'plaza' },
  { id: 'iglesia-santiago-apostol', name: 'Iglesia de Santiago Apóstol / Santiago el Mayor', latitude: 9.524001, longitude: -75.583651, kind: 'cultural' },
  { id: 'casa-del-balcon', name: 'Casa del Balcón', latitude: 9.527500, longitude: -75.581258, kind: 'cultural' },
  { id: 'parque-de-las-colombinas', name: 'Parque de las Colombinas', latitude: 9.519200, longitude: -75.581380, kind: 'park' },
  { id: 'parque-tolcemento', name: 'Parque Tolcemento', latitude: 9.521510, longitude: -75.578490, kind: 'park' },
  { id: 'sector-playa-hermosa', name: 'Sector Playa Hermosa', latitude: 9.540110, longitude: -75.579220, kind: 'beach' },
  { id: 'cienaga-de-la-leche', name: 'Ciénaga de la Leche', latitude: 9.559360, longitude: -75.546810, kind: 'nature' },
  { id: 'boca-guacamaya-manglares', name: 'Boca Guacamaya, entorno de manglares', latitude: 9.616670, longitude: -75.583330, kind: 'nature' },
  { id: 'cienaga-de-trementino', name: 'Ciénaga de Trementino', latitude: 9.606340, longitude: -75.546410, kind: 'nature' },
])

const SAN_BERNARDO_ISLANDS = Object.freeze([
  { id: 'isla-tintipan', name: 'Isla Tintipán', latitude: 9.793790, longitude: -75.842970 },
  { id: 'isla-mucura', name: 'Isla Múcura', latitude: 9.781780, longitude: -75.872520 },
  { id: 'santa-cruz-del-islote', name: 'Santa Cruz del Islote', latitude: 9.785900, longitude: -75.859060 },
  { id: 'isla-palma-salamanquilla', name: 'Isla Palma / Salamanquilla', latitude: 9.736920, longitude: -75.747140 },
  { id: 'isla-panda', name: 'Isla Panda', latitude: 9.745593, longitude: -75.816413 },
  { id: 'isla-mangle', name: 'Isla Mangle / Mangles', latitude: 9.763606, longitude: -75.787901 },
  { id: 'isla-ceycen', name: 'Isla Ceycén', latitude: 9.696170, longitude: -75.853410 },
  { id: 'isla-boqueron', name: 'Isla Boquerón', latitude: 9.694400, longitude: -75.703220 },
  { id: 'isla-cabruna', name: 'Isla Cabruna', latitude: 9.742380, longitude: -75.684360 },
  { id: 'bajo-maravilla', name: 'Antigua Isla Maravilla / Bajo Maravilla', latitude: 9.749380, longitude: -75.880020 },
])

function toCandidate(stop, destinationKey, destinationName) {
  const isIsland = stop.section === 'islands'
  const id = `${CURATED_SOURCE}:${stop.section}:${stop.id}`
  const naturalTag = isIsland ? 'island' : stop.kind === 'beach' ? 'beach' : ''
  const tags = {
    tourism: 'attraction',
    curated_coastal: 'true',
    ...(naturalTag ? { natural: naturalTag } : {}),
    ...(isIsland ? { place: 'island' } : {}),
    ...(stop.kind === 'park' ? { leisure: 'park' } : {}),
  }

  return {
    id,
    placeId: id,
    candidateId: id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
    city: isIsland ? destinationName : destinationName,
    country: 'Colombia',
    region: 'Sucre',
    address: `${stop.name}, ${destinationName}, Sucre, Colombia`,
    coordinateSource: CURATED_SOURCE,
    coordinatesVerified: true,
    category: 'attraction',
    entityType: 'attraction',
    type: isIsland ? 'island' : 'attraction',
    providerType: isIsland ? 'island' : 'attraction',
    providerCategory: 'attraction',
    catalogCategoryEvidence: 'attraction',
    catalogNameVerified: true,
    curatedDestinationKey: destinationKey,
    curatedSection: stop.section,
    curatedStopId: stop.id,
    tags,
  }
}

const ALL_STOPS = [
  ...COVENAS_STOPS.map(stop => ({ ...stop, section: 'covenas' })),
  ...TOLU_STOPS.map(stop => ({ ...stop, section: 'tolu' })),
  ...SAN_BERNARDO_ISLANDS.map(stop => ({ ...stop, section: 'islands', kind: 'island' })),
]

const STOPS_BY_ID = new Map(ALL_STOPS.map(stop => [
  `${CURATED_SOURCE}:${stop.section}:${stop.id}`,
  stop,
]))

function matchesCuratedRecord(place, stop) {
  if (!place || !stop) return false
  const expectedId = `${CURATED_SOURCE}:${stop.section}:${stop.id}`
  const placeId = String(place.candidateId ?? place.candidate_id ?? place.placeId ?? place.place_id ?? place.id ?? '').trim()
  const source = String(place.coordinateSource ?? place.coordinate_source ?? place.source ?? '').trim().toLowerCase()
  const latitude = Number(place.latitude ?? place.lat ?? place.latitud)
  const longitude = Number(place.longitude ?? place.lon ?? place.lng ?? place.longitud)
  return placeId === expectedId && source === CURATED_SOURCE &&
    normalizePlaceName(place.name ?? place.nombre) === normalizePlaceName(stop.name) &&
    Math.abs(latitude - stop.latitude) < 0.000001 &&
    Math.abs(longitude - stop.longitude) < 0.000001
}

export function getCuratedCoastalDestinationKey(destination) {
  return normalizeDestination(destination)
}

/**
 * Local, coordinate-backed exception for the two requested towns. All San
 * Bernardo islands are candidates for either town; callers decide which fit
 * the trip duration and user interests.
 */
export function getCuratedCoastalStops(destination) {
  const destinationKey = normalizeDestination(destination)
  if (!destinationKey) return []
  const destinationName = destinationKey === 'covenas' ? 'Coveñas' : 'Santiago de Tolú'
  const townStops = destinationKey === 'covenas' ? COVENAS_STOPS : TOLU_STOPS
  return [
    ...townStops.map(stop => toCandidate({ ...stop, section: destinationKey }, destinationKey, destinationName)),
    ...SAN_BERNARDO_ISLANDS.map(stop => toCandidate({ ...stop, section: 'islands', kind: 'island' }, destinationKey, destinationName)),
  ]
}

export function findCuratedCoastalStop(name, destination) {
  const normalizedName = normalizePlaceName(name)
  if (!normalizedName) return null
  return getCuratedCoastalStops(destination).find(stop =>
    normalizePlaceName(stop.name) === normalizedName ||
    stop.name.split(/[\/,]/).some(alias => normalizePlaceName(alias) === normalizedName)
  ) || null
}

export function isCuratedCoastalCoordinateStop(place, destination = '') {
  if (!place) return false
  const destinationKey = normalizeDestination(destination || place.curatedDestinationKey || '')
  if (!destinationKey || normalizeDestination(place.curatedDestinationKey || destinationKey) !== destinationKey) return false
  const placeId = String(place.candidateId ?? place.candidate_id ?? place.placeId ?? place.place_id ?? place.id ?? '').trim()
  const stop = STOPS_BY_ID.get(placeId)
  if (!matchesCuratedRecord(place, stop)) return false
  return stop.section === destinationKey || stop.section === 'islands'
}

export function isCuratedCoastalCandidate(place) {
  const placeId = String(place?.candidateId ?? place?.candidate_id ?? place?.placeId ?? place?.place_id ?? place?.id ?? '').trim()
  const stop = STOPS_BY_ID.get(placeId)
  return Boolean(stop && matchesCuratedRecord(place, stop))
}

export function ensureCuratedCoastalStopsInItinerary(stops, destination, requestedDays = 1) {
  const catalog = getCuratedCoastalStops(destination)
  if (catalog.length === 0) return Array.isArray(stops) ? stops : []

  const destinationKey = normalizeDestination(destination)
  const totalDays = Math.max(1, Number(requestedDays) || 1)
  let result = (Array.isArray(stops) ? stops : []).map(stop => ({ ...stop }))
  const normalizeDay = stop => Math.max(1, Number(stop?.dia ?? stop?.day ?? 1) || 1)
  const isIslandStop = stop => stop?.curatedSection === 'islands' || (
    !stop?.curatedSection && /\b(isla|islas|islote|island|islet|cayo)\b/i.test(String(stop?.name ?? stop?.nombre ?? '')) &&
    !/^islas? de san bernardo$/.test(normalizePlaceName(stop?.name ?? stop?.nombre))
  )
  const isExplicitlyRequested = stop => stop?.isRequested === true ||
    stop?.rawTags?.requested_place === 'true' || stop?.tags?.requested_place === 'true' ||
    stop?.category === 'requested'
  const hasSimilar = (name, candidate) => {
    const candidateName = normalizePlaceName(candidate?.name ?? candidate?.nombre)
    const targetName = normalizePlaceName(name)
    return targetName === candidateName ||
      (targetName.length >= 7 && candidateName.length >= 7 && (targetName.includes(candidateName) || candidateName.includes(targetName)))
  }
  const leastLoadedDay = (preferWithoutIsland = false) => {
    const occupiedIslandDays = new Set(result
      .filter(stop => /\b(isla|islas|islote|island|islet|cayo)\b/i.test(String(stop?.name ?? stop?.nombre ?? '')) &&
        !/^islas de san bernardo$/.test(normalizePlaceName(stop?.name ?? stop?.nombre)))
      .map(normalizeDay))
    const dayLoads = Array.from({ length: totalDays }, (_, index) => ({
      day: index + 1,
      load: result.filter(stop => normalizeDay(stop) === index + 1).length,
      hasIsland: occupiedIslandDays.has(index + 1),
    }))
    return (preferWithoutIsland ? dayLoads.filter(day => !day.hasIsland) : dayLoads)
      .sort((left, right) => left.load - right.load || left.day - right.day)[0]?.day
      ?? dayLoads.sort((left, right) => left.load - right.load || left.day - right.day)[0]?.day
      ?? 1
  }
  const addToLeastLoadedDay = candidate => {
    const preferredDay = leastLoadedDay(true)
    result.push({ ...candidate, dia: preferredDay, day: preferredDay })
  }

  for (const stop of result) {
    if (stop.dia != null || stop.day != null) continue
    const day = leastLoadedDay(isIslandStop(stop))
    stop.dia = day
    stop.day = day
  }

  const islandStops = catalog.filter(stop => stop.curatedSection === 'islands')
  const targetIslandCount = Math.min(totalDays, 3)
  const islandIndexes = result
    .map((stop, index) => isIslandStop(stop) ? index : -1)
    .filter(index => index >= 0)
  const requestedIslandCount = islandIndexes.filter(index => isExplicitlyRequested(result[index])).length
  const islandLimit = Math.max(targetIslandCount, requestedIslandCount)
  if (islandIndexes.length > islandLimit) {
    const priorityById = new Map(islandStops.map((stop, index) => [stop.candidateId, index]))
    const rankedIslandIndexes = [...islandIndexes].sort((left, right) => {
      const leftStop = result[left]
      const rightStop = result[right]
      const leftRequested = isExplicitlyRequested(leftStop)
      const rightRequested = isExplicitlyRequested(rightStop)
      if (leftRequested !== rightRequested) return leftRequested ? -1 : 1
      const leftRank = priorityById.get(leftStop.candidateId ?? leftStop.placeId) ?? Number.MAX_SAFE_INTEGER
      const rightRank = priorityById.get(rightStop.candidateId ?? rightStop.placeId) ?? Number.MAX_SAFE_INTEGER
      return leftRank - rightRank || left - right
    })
    const keptIslandIndexes = new Set(rankedIslandIndexes.slice(0, islandLimit))
    result = result.filter((stop, index) => !isIslandStop(stop) || keptIslandIndexes.has(index))
  }

  const curatedTownStops = catalog.filter(stop => stop.curatedSection === destinationKey)
  let currentIslandCount = result.filter(stop =>
    isIslandStop(stop)
  ).length

  for (const island of islandStops) {
    if (currentIslandCount >= targetIslandCount) break
    if (result.some(stop => hasSimilar(island.name, stop))) continue
    addToLeastLoadedDay(island)
    currentIslandCount++
  }

  // Ensure automatic islands sit on distinct days before balancing local mainland stops
  const usedIslandDays = new Set()
  for (const stop of result) {
    if (!isIslandStop(stop)) continue
    let d = Math.min(totalDays, normalizeDay(stop))
    if (usedIslandDays.has(d)) {
      d = Array.from({ length: totalDays }, (_, index) => index + 1)
        .find(day => !usedIslandDays.has(day)) ?? d
    }
    usedIslandDays.add(d)
    stop.dia = d
    stop.day = d
  }

  const hasCuratedTownStop = result.some(stop => curatedTownStops.some(candidate => hasSimilar(candidate.name, stop)))
  if (!hasCuratedTownStop && curatedTownStops[0]) {
    const firstDay = 1
    result.unshift({ ...curatedTownStops[0], dia: firstDay, day: firstDay })
  }

  // Populate each day of the itinerary with curated local stops so multi-day trips
  // cover the destination's beaches, ciénagas and coastal landmarks across all days.
  for (let day = 1; day <= totalDays; day++) {
    const dayHasIsland = result.some(stop => normalizeDay(stop) === day && isIslandStop(stop))
    const minStopsForDay = totalDays === 1 ? 2 : (dayHasIsland ? 2 : 3)
    while (result.filter(stop => normalizeDay(stop) === day).length < minStopsForDay) {
      const nextTownStop = curatedTownStops.find(candidate =>
        !result.some(existing => hasSimilar(candidate.name, existing))
      )
      if (!nextTownStop) break
      result.push({ ...nextTownStop, dia: day, day: day })
    }
  }

  return result
}
