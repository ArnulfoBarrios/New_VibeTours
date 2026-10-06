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

export const FALLBACK_DESTINATION_CENTROIDS = {
  'cartagena': { displayName: 'Cartagena, Colombia', city: 'Cartagena', entityName: 'Cartagena', isMicroDestination: false, region: 'Bolívar', country: 'Colombia', countryCode: 'CO', latitude: 10.3997, longitude: -75.5144 },
  'barranquilla': { displayName: 'Barranquilla, Colombia', city: 'Barranquilla', entityName: 'Barranquilla', isMicroDestination: false, region: 'Atlántico', country: 'Colombia', countryCode: 'CO', latitude: 10.9878, longitude: -74.7889 },
  'santa marta': { displayName: 'Santa Marta, Colombia', city: 'Santa Marta', entityName: 'Santa Marta', isMicroDestination: false, region: 'Magdalena', country: 'Colombia', countryCode: 'CO', latitude: 11.2408, longitude: -74.1990 },
  'medellin': { displayName: 'Medellín, Colombia', city: 'Medellín', entityName: 'Medellín', isMicroDestination: false, region: 'Antioquia', country: 'Colombia', countryCode: 'CO', latitude: 6.2442, longitude: -75.5812 },
  'medellín': { displayName: 'Medellín, Colombia', city: 'Medellín', entityName: 'Medellín', isMicroDestination: false, region: 'Antioquia', country: 'Colombia', countryCode: 'CO', latitude: 6.2442, longitude: -75.5812 },
  'bogota': { displayName: 'Bogotá, Colombia', city: 'Bogotá', entityName: 'Bogotá', isMicroDestination: false, region: 'Cundinamarca', country: 'Colombia', countryCode: 'CO', latitude: 4.7110, longitude: -74.0721 },
  'bogotá': { displayName: 'Bogotá, Colombia', city: 'Bogotá', entityName: 'Bogotá', isMicroDestination: false, region: 'Cundinamarca', country: 'Colombia', countryCode: 'CO', latitude: 4.7110, longitude: -74.0721 },
  'cali': { displayName: 'Cali, Colombia', city: 'Cali', entityName: 'Cali', isMicroDestination: false, region: 'Valle del Cauca', country: 'Colombia', countryCode: 'CO', latitude: 3.4516, longitude: -76.5320 },
  'coveñas': { displayName: 'Coveñas, Sucre, Colombia', city: 'Coveñas', entityName: 'Coveñas', isMicroDestination: false, region: 'Sucre', country: 'Colombia', countryCode: 'CO', latitude: 9.4080, longitude: -75.6850 },
  'covenas': { displayName: 'Coveñas, Sucre, Colombia', city: 'Coveñas', entityName: 'Coveñas', isMicroDestination: false, region: 'Sucre', country: 'Colombia', countryCode: 'CO', latitude: 9.4080, longitude: -75.6850 },
  'tolu': { displayName: 'Santiago de Tolú, Sucre, Colombia', city: 'Tolú', entityName: 'Tolú', isMicroDestination: false, region: 'Sucre', country: 'Colombia', countryCode: 'CO', latitude: 9.5264, longitude: -75.5817 },
  'tolú': { displayName: 'Santiago de Tolú, Sucre, Colombia', city: 'Tolú', entityName: 'Tolú', isMicroDestination: false, region: 'Sucre', country: 'Colombia', countryCode: 'CO', latitude: 9.5264, longitude: -75.5817 },
  'san andres': { displayName: 'San Andrés, Colombia', city: 'San Andrés', entityName: 'San Andrés', isMicroDestination: false, region: 'San Andrés y Providencia', country: 'Colombia', countryCode: 'CO', latitude: 12.5847, longitude: -81.7006 },
  'san andrés': { displayName: 'San Andrés, Colombia', city: 'San Andrés', entityName: 'San Andrés', isMicroDestination: false, region: 'San Andrés y Providencia', country: 'Colombia', countryCode: 'CO', latitude: 12.5847, longitude: -81.7006 },
  'cancun': { displayName: 'Cancún, Quintana Roo, México', city: 'Cancún', entityName: 'Cancún', isMicroDestination: false, region: 'Quintana Roo', country: 'México', countryCode: 'MX', latitude: 21.1619, longitude: -86.8515 },
  'cancún': { displayName: 'Cancún, Quintana Roo, México', city: 'Cancún', entityName: 'Cancún', isMicroDestination: false, region: 'Quintana Roo', country: 'México', countryCode: 'MX', latitude: 21.1619, longitude: -86.8515 },
  'parque tayrona': { displayName: 'Parque Nacional Natural Tayrona, Magdalena, Colombia', city: 'Santa Marta', entityName: 'Parque Tayrona', isMicroDestination: true, region: 'Magdalena', country: 'Colombia', countryCode: 'CO', latitude: 11.3142, longitude: -74.0305 },
  'tayrona': { displayName: 'Parque Nacional Natural Tayrona, Magdalena, Colombia', city: 'Santa Marta', entityName: 'Parque Tayrona', isMicroDestination: true, region: 'Magdalena', country: 'Colombia', countryCode: 'CO', latitude: 11.3142, longitude: -74.0305 },
  'minca': { displayName: 'Minca, Santa Marta, Magdalena, Colombia', city: 'Santa Marta', entityName: 'Minca', isMicroDestination: true, region: 'Magdalena', country: 'Colombia', countryCode: 'CO', latitude: 11.1444, longitude: -74.1167 },
  'guatape': { displayName: 'Guatapé, Antioquia, Colombia', city: 'Guatapé', entityName: 'Guatapé', isMicroDestination: true, region: 'Antioquia', country: 'Colombia', countryCode: 'CO', latitude: 6.2333, longitude: -75.1583 },
  'guatapé': { displayName: 'Guatapé, Antioquia, Colombia', city: 'Guatapé', entityName: 'Guatapé', isMicroDestination: true, region: 'Antioquia', country: 'Colombia', countryCode: 'CO', latitude: 6.2333, longitude: -75.1583 },
  'malibu': { displayName: 'Malibu, California, United States', city: 'Malibu', entityName: 'Malibu', isMicroDestination: false, region: 'California', country: 'Estados Unidos', countryCode: 'US', latitude: 34.0259, longitude: -118.7798 },
  'malibu, california': { displayName: 'Malibu, California, United States', city: 'Malibu', entityName: 'Malibu', isMicroDestination: false, region: 'California', country: 'Estados Unidos', countryCode: 'US', latitude: 34.0259, longitude: -118.7798 },
  'roma': { displayName: 'Roma, Lazio, Italia', city: 'Roma', entityName: 'Roma', isMicroDestination: false, region: 'Lazio', country: 'Italia', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964 },
  'rome': { displayName: 'Roma, Lazio, Italia', city: 'Roma', entityName: 'Roma', isMicroDestination: false, region: 'Lazio', country: 'Italia', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964 },
  'tokio': { displayName: 'Tokio, Japón', city: 'Tokio', entityName: 'Tokio', isMicroDestination: false, region: 'Kantō', country: 'Japón', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503 },
  'tokyo': { displayName: 'Tokio, Japón', city: 'Tokio', entityName: 'Tokio', isMicroDestination: false, region: 'Kantō', country: 'Japón', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503 },
  'madrid': { displayName: 'Madrid, España', city: 'Madrid', entityName: 'Madrid', isMicroDestination: false, region: 'Comunidad de Madrid', country: 'España', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 },
  'barcelona': { displayName: 'Barcelona, Cataluña, España', city: 'Barcelona', entityName: 'Barcelona', isMicroDestination: false, region: 'Cataluña', country: 'España', countryCode: 'ES', latitude: 41.3851, longitude: 2.1734 },
  'paris': { displayName: 'París, Francia', city: 'París', entityName: 'París', isMicroDestination: false, region: 'Île-de-France', country: 'Francia', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522 },
  'parís': { displayName: 'París, Francia', city: 'París', entityName: 'París', isMicroDestination: false, region: 'Île-de-France', country: 'Francia', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522 }
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

  if (/perla del caribe/i.test(cleaned)) return 'Santa Marta'
  cleaned = cleaned.replace(/^localidad\s+\d+.*?(?:de\s+|-|\s+)/i, '')
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

export const TOUR_TRIP_TYPES = new Set([
  'micro_destination',
  'coastal_islands',
  'single_city',
  'city_to_city',
  'international_multicity',
  'location_to_destination',
  'express_tour',
])

export const MICRO_DESTINATION_PATTERN = /tayrona|minca|guatap[eé]|valle de cocora|cocora|parque nacional|parque natural|reserva natural|sierra nevada|tatacoa|desierto de la tatacoa|chicamocha|ca[nñ][oó]n|amazonas|eje cafetero|pueblito|monta[nñ]a|cascada|alpin[oa]|alpes|senderismo|mirador|miradores|lago|laguna|volc[aá]n|glaciar|glaciares|bosque|cueva|cuevas|valle\b|geoparque/i
export const COASTAL_ISLAND_PATTERN = /\bislas?\b|\bcayos?\b|\bisland\b|\bislands\b|isla\s+[a-záéíóúñ]+|archipi[eé]lago|islas? del rosario|isla bar[uú]|san bernardo|islas? de san bernardo|coastal islands|island hopping|arrecife|atol[oó]n|costa\b|playas?\b/i

export function normalizeTourType(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  const aliases = {
    microdestino: 'micro_destination',
    micro_destination: 'micro_destination',
    destino_natural: 'micro_destination',
    coastal: 'coastal_islands',
    coastal_islands: 'coastal_islands',
    islas_costeras: 'coastal_islands',
    single_city: 'single_city',
    ciudad_unica: 'single_city',
    express_tour: 'express_tour',
    tour_express: 'express_tour',
    express: 'express_tour',
    tour_rapido: 'express_tour',
    city_to_city: 'city_to_city',
    entre_ciudades: 'city_to_city',
    road_trip: 'city_to_city',
    international_multicity: 'international_multicity',
    multi_ciudad_internacional: 'international_multicity',
    location_to_destination: 'location_to_destination',
    ubicacion_a_destino: 'location_to_destination',
  }

  const result = aliases[normalized] || normalized
  return TOUR_TRIP_TYPES.has(result) ? result : ''
}

export function inferTourType(input = {}, extracted = null) {
  const explicit = normalizeTourType(
    input.tourType || input.tour_type || extracted?.tourType || extracted?.tour_type
  )
  if (explicit) return explicit

  const destinationText = [input.destination, input.city, input.destinationPlace, input.prompt].filter(Boolean).join(' ')
  const placesList = [
    ...(Array.isArray(input.specificPlaces) ? input.specificPlaces : []),
    ...(Array.isArray(input.selectedPlaces) ? input.selectedPlaces : []),
    ...(Array.isArray(input.places) ? input.places : [])
  ]
  const specificText = placesList
    .map(place => typeof place === 'string' ? place : place?.name)
    .filter(Boolean)
    .join(' ')

  if (
    input.isUserLocationOrigin ||
    input.is_user_location_origin ||
    input.originPlace === 'user_current_location' ||
    extracted?.isUserLocationOrigin ||
    extracted?.originPlace === 'user_current_location'
  ) {
    return 'location_to_destination'
  }

  const hasMultipleCities = (Array.isArray(input.cities) && input.cities.length > 1) ||
    (input.originPlace && input.destinationPlace && input.originPlace !== input.destinationPlace)
  const isMultiCountryOrIntl = input.isMultiCountry || input.is_multi_country ||
    (Array.isArray(input.cities) && input.cities.length >= 3) ||
    /\b(internacional|multi[\s-]?pa[íi]s|multi[\s-]?ciudad\s+internacional)\b/i.test(destinationText)

  if (isMultiCountryOrIntl) {
    return 'international_multicity'
  }

  if (
    input.isMultiCity ||
    input.is_multi_city ||
    hasMultipleCities ||
    /\b(road\s*trip|carretera)\b/i.test(destinationText)
  ) {
    return 'city_to_city'
  }

  const normDest = destinationText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const isKnownMicroDest = Boolean(
    input.canonicalDestination?.isMicroDestination ||
    FALLBACK_DESTINATION_CENTROIDS[normDest]?.isMicroDestination ||
    MICRO_DESTINATION_PATTERN.test(destinationText) ||
    (!destinationText && MICRO_DESTINATION_PATTERN.test(specificText)) ||
    input.type === 'natural'
  )

  if (isKnownMicroDest) {
    return 'micro_destination'
  }

  if (COASTAL_ISLAND_PATTERN.test(`${destinationText} ${specificText}`) || input.type === 'costero') {
    return 'coastal_islands'
  }

  const durationDays = Number(input.durationDays || input.duration_days || extracted?.durationDays || (input.durationHours ? Math.ceil(input.durationHours / 24) : 0))
  const isExpressIndicator = /\b(tour\s+express|express|tour\s+r[aá]pido|recorrido\s+r[aá]pido)\b/i.test(destinationText)
  if (durationDays === 1 || isExpressIndicator) {
    return 'express_tour'
  }

  return 'single_city'
}

export function evaluateTourRequirements(input = {}, extracted = null) {
  const merged = { ...input, ...(extracted || {}) }
  const tourType = inferTourType(input, extracted)

  const city = String(merged.city || merged.destination || merged.destinationPlace || '').trim()
  const hasCity = Boolean(city.length >= 2 || (Array.isArray(merged.cities) && merged.cities.length > 0))

  const isExpressOrOneDay = tourType === 'express_tour' ||
    Number(merged.durationDays) === 1 ||
    (Number(merged.durationHours) > 0 && Number(merged.durationHours) <= 24) ||
    /\b(un\s+d[íi]a|1\s+d[íi]a|tour\s+express|express|por\s+el\s+d[íi]a|pasa\s*d[íi]a|pasad[íi]a)\b/i.test(`${merged.datesSeason || ''} ${merged.prompt || ''}`)

  const hasTransport = Boolean(merged.transport && String(merged.transport).trim().length > 0 && !/por definir|pendiente/i.test(String(merged.transport)))
  const hasBudget = Boolean(merged.budget && String(merged.budget).trim().length > 0 && !/por definir|pendiente/i.test(String(merged.budget)))

  // Dates: For 1-day/express tours, dates are optional / not required to build
  const hasDates = isExpressOrOneDay
    ? true
    : Boolean(merged.datesSeason || (Number(merged.durationDays) > 0))

  // Lodging:
  let hasLodging = false
  let lodgingNote = ''

  if (isExpressOrOneDay || tourType === 'location_to_destination' || merged.isUserLocationOrigin) {
    // 1-day tours and corridor/location-to-destination do NOT require lodging
    hasLodging = true
  } else if (tourType === 'international_multicity' || tourType === 'city_to_city') {
    // Multi-city or International tour: Needs lodging strategy across cities
    const isStayingHome = /\b(casa\s+propia|familiar|amigos|casa\s+de|con\s+familia)\b/i.test(String(merged.accommodationStatus || merged.lodging || ''))
    const hasPerCityLodging = Boolean(merged.lodgingsPerCity && typeof merged.lodgingsPerCity === 'object' && Object.keys(merged.lodgingsPerCity).length >= 1)
    const hasExplicitHotelConfirmed = Boolean(
      (merged.selectedHotel && (typeof merged.selectedHotel === 'string' ? merged.selectedHotel.length > 2 : (merged.selectedHotel.name && merged.selectedHotel.name.length > 2))) ||
      /\b(hotel(es)?|alojamiento(s)?|hospedaje(s)?)\s+(elegido(s)?|confirmado(s)?|reservado(s)?)/i.test(String(merged.accommodationStatus || ''))
    )

    if (isStayingHome || hasPerCityLodging || hasExplicitHotelConfirmed) {
      hasLodging = true
    } else {
      hasLodging = false
      lodgingNote = 'alojamiento por ciudad de estadía (o confirmar si te hospedas en hoteles o casa familiar)'
    }
  } else {
    // Single city / micro destination / coastal multi-day tour
    const isStayingHome = /\b(casa\s+propia|familiar|amigos|casa\s+de|con\s+familia)\b/i.test(String(merged.accommodationStatus || merged.lodging || ''))
    const hasHotel = Boolean(
      (merged.selectedHotel && (typeof merged.selectedHotel === 'string' ? merged.selectedHotel.length > 2 : (merged.selectedHotel.name && merged.selectedHotel.name.length > 2))) ||
      /hotel elegido|hotel confirmado|alojamiento confirmado/i.test(String(merged.accommodationStatus || ''))
    )
    hasLodging = isStayingHome || hasHotel
    if (!hasLodging) {
      lodgingNote = 'tu alojamiento u hotel (o confirmar si te hospedas en casa propia/familiar)'
    }
  }

  const missing = []
  if (!hasCity && tourType !== 'location_to_destination') missing.push('el destino')
  if (!hasDates) missing.push('las fechas o días de viaje')
  if (!hasLodging) missing.push(lodgingNote || 'tu alojamiento')
  if (!hasTransport) missing.push('tu medio de transporte')
  if (!hasBudget) missing.push('tu presupuesto')

  const isComplete = missing.length === 0

  return {
    tourType,
    isExpressOrOneDay,
    hasCity,
    hasDates,
    hasLodging,
    hasTransport,
    hasBudget,
    missing,
    isComplete
  }
}

export function geographicScopeFor(input = {}, extracted = null) {
  const tourType = inferTourType(input, extracted)
  const transport = String(input.transport || '').toLowerCase()
  const asksForNearby = /cerca|cercan|alrededores|municipios?|afueras|zona metropolitana|pueblos cercanos/i.test(
    [input.prompt, input.destination, input.city].filter(Boolean).join(' ')
  )

  if (tourType === 'single_city' || tourType === 'express_tour') {
    const isCoastalCorridor = /\b(coveñas|covenas|tol[uú]|san antero|golfo de morrosquillo|san bernardo del viento)\b/i.test(
      [input.prompt, input.destination, input.city].filter(Boolean).join(' ')
    )
    const maxDistanceKm = transport.includes('camin')
      ? 10
      : transport.includes('bicic')
        ? 18
        : (asksForNearby || isCoastalCorridor)
          ? 50
          : 35
    return {
      tourType,
      mode: tourType === 'express_tour' ? 'express_tour' : 'single_city',
      maxDistanceKm,
      isRegional: false,
      allowNearbyMunicipalities: true,
    }
  }

  if (tourType === 'micro_destination') {
    return {
      tourType,
      mode: 'micro_destination',
      maxDistanceKm: 25,
      isRegional: true,
      allowNearbyMunicipalities: false,
    }
  }

  if (tourType === 'coastal_islands') {
    return {
      tourType,
      mode: 'coastal_islands',
      maxDistanceKm: 90,
      isRegional: true,
      allowNearbyMunicipalities: true,
    }
  }

  if (tourType === 'city_to_city' || tourType === 'location_to_destination') {
    return {
      tourType,
      mode: 'corridor',
      maxDistanceKm: 120,
      isRegional: true,
      allowNearbyMunicipalities: true,
    }
  }

  return {
    tourType,
    mode: 'multicity',
    maxDistanceKm: 250,
    isRegional: true,
    allowNearbyMunicipalities: true,
  }
}


export function rankCanonicalCandidate(cand, cleanedQuery = '', options = {}) {
  let score = 0
  const normCleaned = String(cleanedQuery || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const candCityNorm = String(cand.city || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const candEntityNorm = String(cand.entityName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const candCountryNorm = String(cand.country || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const candType = String(cand.type || '').toLowerCase()

  // 1. Settlement Hierarchy (Administrative & Urban prominence)
  // Major cities, administrative boundaries, and towns outrank tiny rural hamlets/villages
  if (['city', 'administrative', 'municipality', 'national_park', 'protected_area'].includes(candType)) {
    score += 60
  } else if (['town', 'suburb'].includes(candType)) {
    score += 40
  } else if (['village'].includes(candType)) {
    score += 15
  } else if (['hamlet', 'isolated_dwelling', 'residential'].includes(candType)) {
    score += 5
  }

  // 1b. Urban Core / City Proper preference over broad territorial municipality boundary polygons
  // In Latin America & OSM, place_rank 14/16 or 'Perímetro Urbano' denotes the real urban downtown core
  // where tourist spots, hotels, and restaurants exist, unlike rural county boundary centroids (place_rank 12)
  if (/per[íi]metro\s+urbano/i.test(cand.rawName || '')) {
    score += 40
  } else if (candType === 'city') {
    score += 30
  } else if (cand.placeRank === 14 || cand.placeRank === 16) {
    score += 25
  }

  // 2. Nominatim Importance (0.0 to 1.0)
  if (typeof cand.importance === 'number' && Number.isFinite(cand.importance)) {
    score += cand.importance * 50
  }

  // 3. Exact Name Matching
  if (candCityNorm === normCleaned || candEntityNorm === normCleaned) {
    score += 35
  } else if (candCityNorm.startsWith(normCleaned) || candEntityNorm.startsWith(normCleaned)) {
    score += 20
  }

  // 4. Preferred / Inferred Country Context
  const countryHint = String(options?.countryHint || options?.preferredCountry || options?.country || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (countryHint) {
    if (candCountryNorm === countryHint || cand.countryCode?.toLowerCase() === countryHint) {
      score += 100
    }
  } else {
    // If no explicit foreign country is requested in query, prioritize Colombia (primary domain) when candidate is in Colombia
    const queryMentionsOtherCountry = /\b(espana|españa|mexico|méxico|argentina|peru|perú|chile|brasil|brazil|estados unidos|usa|francia|italia|alemania|romania|rumania)\b/i.test(normCleaned)
    if (!queryMentionsOtherCountry && (cand.countryCode === 'CO' || candCountryNorm === 'colombia')) {
      score += 45
    }
  }

  // 5. Special entity types (e.g. searching for a park)
  if (/\b(parque|reserva|natural)\b/i.test(normCleaned) && (candType === 'national_park' || candType === 'protected_area')) {
    score += 50
  }

  return score
}

export function getCanonicalDestinationFromCache(query) {
  if (!query || typeof query !== 'string') return null
  const cleaned = cleanAdministrativeCityName(query.trim())
  if (!cleaned) return null
  const cacheKey = `canonical_${cleaned.toLowerCase()}`
  const normKey = `canonical_${cleaned.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()}`
  return canonicalCache.get(cacheKey) || canonicalCache.get(normKey) || null
}

export async function resolveCanonicalDestination(query, options = {}) {
  if (!query || typeof query !== 'string') return null
  let cleaned = query.trim().replace(/^(destino|lugar|ciudad|ubicaci[oó]n|location|destination|pais|pa[íi]s)\s*:\s*/i, '').trim()
  cleaned = cleanAdministrativeCityName(cleaned)
  if (!cleaned) return null

  const cacheKey = `canonical_${cleaned.toLowerCase()}`
  const cached = canonicalCache.get(cacheKey)
  if (cached) return cached

  // Fast-path: If destination is already a known top destination centroid, return immediately in 0ms
  const normKey = cleaned.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const immediateFallback = FALLBACK_DESTINATION_CENTROIDS[normKey] ||
    FALLBACK_DESTINATION_CENTROIDS[cleaned.toLowerCase().trim()] ||
    Object.entries(FALLBACK_DESTINATION_CENTROIDS).find(([k]) => normKey === k || (k.length >= 4 && (normKey === k || normKey.startsWith(k) || k.startsWith(normKey) || normKey.includes(k))))?.[1]

  if (immediateFallback) {
    const result = {
      ...immediateFallback,
      placeId: `canonical_${normKey}`,
      isAmbiguous: false,
      candidates: []
    }
    canonicalCache.set(cacheKey, result)
    return result
  }

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
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(6000) })
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
            type: item.type,
            importance: Number(item.importance) || 0,
            placeRank: Number(item.place_rank) || 30
          }
        }).filter(c => (c.city || c.entityName) && Number.isFinite(c.latitude) && Number.isFinite(c.longitude))

        if (candidateObjects.length > 0) {
          const ranked = [...candidateObjects].sort((a, b) => {
            const scoreB = rankCanonicalCandidate(b, cleaned, options)
            const scoreA = rankCanonicalCandidate(a, cleaned, options)
            return scoreB - scoreA
          })
          let primary = ranked[0]

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
          canonicalCache.set(`canonical_${normKey}`, result)
          if (result.city) {
            const normCityKey = `canonical_${result.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()}`
            canonicalCache.set(normCityKey, result)
          }
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
    photonUrl.searchParams.set('limit', '8')
    const photonRes = await fetch(photonUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(6000) })
    if (photonRes.ok) {
      const pJson = await photonRes.json()
      const features = Array.isArray(pJson.features) ? pJson.features : []
      if (features.length > 0) {
        // Prioritize city settlements over rural hamlets and street names
        const sortedFeatures = [...features].sort((a, b) => {
          const typeScore = (f) => {
            const p = f.properties || {}
            if (p.type === 'city' || p.osm_value === 'city') return 100
            if (p.type === 'administrative' || p.osm_value === 'administrative') return 70
            if (p.type === 'town') return 50
            if (p.type === 'village') return 20
            return 5
          }
          const countryScore = (f) => {
            const cc = (f.properties?.countrycode || '').toLowerCase()
            return cc === 'co' ? 30 : 0
          }
          return (typeScore(b) + countryScore(b)) - (typeScore(a) + countryScore(a))
        })
        const feat = sortedFeatures[0]
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

  // Fallback to precomputed destination centroids if all network providers fail
  const fallback = FALLBACK_DESTINATION_CENTROIDS[normKey] ||
    FALLBACK_DESTINATION_CENTROIDS[cleaned.toLowerCase().trim()] ||
    Object.entries(FALLBACK_DESTINATION_CENTROIDS).find(([k]) => normKey.includes(k) || k.includes(normKey))?.[1]

  if (fallback) {
    const result = {
      ...fallback,
      placeId: `fallback_${normKey}`,
      isAmbiguous: false,
      candidates: []
    }
    canonicalCache.set(cacheKey, result)
    return result
  }

  return null
}

export function validateCandidateLocation(place, canonicalDest, maxDistanceKm = 35) {
  if (!place) return false

  const lat = Number(place.latitude ?? place.lat)
  const lon = Number(place.longitude ?? place.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    return false
  }

  if (!canonicalDest || !Number.isFinite(canonicalDest.latitude) || !Number.isFinite(canonicalDest.longitude)) {
    return true
  }

  // 1. If destination is a micro-destination (e.g. Parque Tayrona, Minca, Guatapé) and caller didn't explicitly allow a broader regional radius, use 18 km
  const allowedRadius = (canonicalDest.isMicroDestination && maxDistanceKm <= 35) ? 18 : maxDistanceKm

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
