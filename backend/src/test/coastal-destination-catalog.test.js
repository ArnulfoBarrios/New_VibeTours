import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ensureCuratedCoastalStopsInItinerary,
  findCuratedCoastalStop,
  getCuratedCoastalDestinationKey,
  getCuratedCoastalStops,
  isCuratedCoastalCoordinateStop,
} from '../services/coastal-destination-catalog.js'
import {
  isCoastalIslandsTour,
  isCoastalMappedTouristStop,
  assignCoastalIslandDays,
} from '../services/coastal-islands-policy.js'
import { extractChatInformationFallback, filterChatSpecificPlacesByOsm } from '../services/openai.js'
import { buildTourPlanner, isValidSpecificPlace, processTourBuild, rebuildCoastalChatItinerary } from '../routes/ai.js'

const EXPECTED_COORDINATES = {
  'Playa Primera Ensenada': [9.406388, -75.669701],
  'Playa Segunda Ensenada': [9.424386, -75.640120],
  'Playa La Coquerita': [9.403899, -75.679372],
  'Playa Bocas de la Ciénaga': [9.436518, -75.629440],
  'Ciénaga La Caimanera': [9.409630, -75.628090],
  'Sector de acceso a la Ciénaga La Caimanera': [9.434738, -75.628461],
  'Parque Especializado La Caimanera': [9.437261, -75.629786],
  'Sector Isla Gallinazo y La Marta': [9.455909, -75.614897],
  'Punta de Piedra': [9.420390, -75.651520],
  'Playa El Francés': [9.566067, -75.573737],
  'Playas de Puerto Viejo': [9.468566, -75.607466],
  'Playas de Palo Blanco': [9.478370, -75.602510],
  'Playa del Malecón y zona de embarcaderos': [9.522041, -75.586262],
  'Plaza Pedro de Heredia, parque principal': [9.524000, -75.584250],
  'Iglesia de Santiago Apóstol / Santiago el Mayor': [9.524001, -75.583651],
  'Casa del Balcón': [9.527500, -75.581258],
  'Parque de las Colombinas': [9.519200, -75.581380],
  'Parque Tolcemento': [9.521510, -75.578490],
  'Sector Playa Hermosa': [9.540110, -75.579220],
  'Ciénaga de la Leche': [9.559360, -75.546810],
  'Boca Guacamaya, entorno de manglares': [9.616670, -75.583330],
  'Ciénaga de Trementino': [9.606340, -75.546410],
  'Isla Tintipán': [9.793790, -75.842970],
  'Isla Múcura': [9.781780, -75.872520],
  'Santa Cruz del Islote': [9.785900, -75.859060],
  'Isla Palma / Salamanquilla': [9.736920, -75.747140],
  'Isla Panda': [9.745593, -75.816413],
  'Isla Mangle / Mangles': [9.763606, -75.787901],
  'Isla Ceycén': [9.696170, -75.853410],
  'Isla Boquerón': [9.694400, -75.703220],
  'Isla Cabruna': [9.742380, -75.684360],
  'Antigua Isla Maravilla / Bajo Maravilla': [9.749380, -75.880020],
}

describe('curated coastal destination coordinates', () => {
  it('keeps the exception scoped to Coveñas and Tolú and uses the supplied coordinates', () => {
    const covenas = getCuratedCoastalStops('Coveñas, Sucre')
    const tolu = getCuratedCoastalStops('Santiago de Tolú')

    assert.equal(getCuratedCoastalDestinationKey('coveñas'), 'covenas')
    assert.equal(getCuratedCoastalDestinationKey('Santiago de Tolú'), 'tolu')
    assert.equal(getCuratedCoastalDestinationKey('Cartagena'), '')
    assert.equal(getCuratedCoastalDestinationKey('Coveñas y Tolú'), '')
    assert.equal(covenas.length, 19)
    assert.equal(tolu.length, 23)

    for (const stop of [...covenas, ...tolu]) {
      const expected = EXPECTED_COORDINATES[stop.name]
      assert.ok(expected, `unexpected curated stop: ${stop.name}`)
      assert.deepEqual([stop.latitude, stop.longitude], expected, stop.name)
      assert.equal(stop.coordinateSource, 'curated_coastal')
      assert.equal(isCuratedCoastalCoordinateStop(stop, stop.city), true)
    }
    assert.equal(Object.keys(EXPECTED_COORDINATES).length, 32)
  })

  it('rejects altered coordinates and an archipelago overview as a tourist stop', () => {
    const island = findCuratedCoastalStop('Isla Múcura', 'Coveñas')
    assert.ok(island)
    assert.equal(isCoastalMappedTouristStop(island), true)
    assert.equal(isCoastalMappedTouristStop({ ...island, name: 'Islas de San Bernardo' }), false)
    assert.equal(isCuratedCoastalCoordinateStop({ ...island, latitude: island.latitude + 0.01 }, 'Coveñas'), false)
    assert.equal(isCuratedCoastalCoordinateStop({ ...island, coordinateSource: 'osm' }, 'Coveñas'), false)
    assert.equal(findCuratedCoastalStop('Salamanquilla', 'Coveñas')?.name, 'Isla Palma / Salamanquilla')
  })

  it('keeps a listed malecón tourist stop while continuing to reject generic port infrastructure', async () => {
    const malecón = findCuratedCoastalStop('Playa del Malecón y zona de embarcaderos', 'Tolú')
    assert.ok(malecón)
    assert.equal(isValidSpecificPlace(malecón.name), true)
    assert.equal(isCoastalMappedTouristStop(malecón), true)
    assert.equal(findCuratedCoastalStop('Santiago el Mayor', 'Santiago de Tolú')?.name,
      'Iglesia de Santiago Apóstol / Santiago el Mayor')
    assert.equal(findCuratedCoastalStop('Plaza Pedro de Heredia', 'Tolú')?.name,
      'Plaza Pedro de Heredia, parque principal')

    const [resolved] = await filterChatSpecificPlacesByOsm(
      [{ name: malecón.name, dia: 1 }],
      'Santiago de Tolú',
      'Colombia',
      null,
      { tourType: 'coastal_islands' },
    )
    assert.equal(resolved.candidateId, malecón.candidateId)
    assert.equal(resolved.latitude, 9.522041)
    assert.equal(resolved.longitude, -75.586262)

    assert.equal(isCoastalMappedTouristStop({
      name: 'Muelle de Tolú',
      latitude: 9.522,
      longitude: -75.586,
      coordinateSource: 'osm',
      placeId: 'node/4455',
      osmType: 'node',
      category: 'attraction',
      tags: { amenity: 'ferry_terminal' },
    }), false)
  })

  it('resolves a chat stop from the curated catalog without asking OSM to geocode it', async () => {
    const [resolved] = await filterChatSpecificPlacesByOsm(
      [{ name: 'Playa Primera Ensenada', dia: 2, activities: ['Caminar por la playa'] }],
      'Coveñas',
      'Colombia',
      null,
      { tourType: 'coastal_islands' },
    )

    assert.equal(resolved.name, 'Playa Primera Ensenada')
    assert.equal(resolved.latitude, 9.406388)
    assert.equal(resolved.longitude, -75.669701)
    assert.equal(resolved.dia, 2)
    assert.deepEqual(resolved.activities, ['Caminar por la playa'])
  })

  it('adds local points and separate individual island stops to a multi-day itinerary', () => {
    const itinerary = assignCoastalIslandDays(
      ensureCuratedCoastalStopsInItinerary([], 'Coveñas', 4),
      4,
    )
    const localStops = itinerary.filter(stop => stop.curatedSection === 'covenas')
    const islands = itinerary.filter(stop => stop.curatedSection === 'islands')

    assert.ok(localStops.length >= 6)
    assert.equal(islands.length, 3)
    assert.equal(new Set(islands.map(stop => stop.dia)).size, 3)
    assert.deepEqual([...new Set(itinerary.map(stop => stop.dia))].sort((a, b) => a - b), [1, 2, 3, 4])
    assert.equal(itinerary.some(stop => stop.name === 'Islas de San Bernardo'), false)
    assert.ok(itinerary.every(stop => stop.candidateId && stop.coordinatesVerified))
  })

  it('extracts 4-day Coveñas prompt with private house lodging and populates all 4 days with curated Coveñas and island stops', () => {
    const prompt = 'Quiero crear un tour a Coveñas, en donde pueda ver los lugares más importantes de la zona. Voy a durar 4 días, voy a ir con unos amigos y me voy a mover en taxi. Tenemos un presupuesto de unos 10 millones y nos vamos a quedar en una casa que tenemos allá.'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.city, 'Coveñas')
    assert.equal(extracted.durationDays, 4)
    assert.equal(extracted.accommodationStatus, 'Casa propia / familiar')
    assert.equal(extracted.transport, 'Taxi / Uber')
    assert.equal(extracted.budget, 'Lujo')
    assert.equal(extracted.companions, 'Con amigos')
    assert.equal(extracted.tourType, 'coastal_islands')

    const partialAiStops = [
      findCuratedCoastalStop('Ciénaga La Caimanera', 'Coveñas'),
      findCuratedCoastalStop('Playa Segunda Ensenada', 'Coveñas'),
    ].map((stop, idx) => ({ ...stop, dia: idx + 1, day: idx + 1 }))

    const fullStops = assignCoastalIslandDays(
      ensureCuratedCoastalStopsInItinerary(partialAiStops, 'Coveñas', extracted.durationDays),
      extracted.durationDays,
    )
    const rebuiltChat = rebuildCoastalChatItinerary(
      '¡Qué gran plan! Te comento con total transparencia que en nuestro catálogo actual no contamos con atractivos ni restaurantes verificados dentro del casco urbano de Coveñas.\n\nItinerario de Viaje: Coveñas (2 días)\n\nDía 1: Coveñas\n• Ciénaga La Caimanera\n\nDía 2: Coveñas\n• Playa Segunda Ensenada\n\n¿Deseas confirmar este itinerario y generar tu tour en el mapa?',
      fullStops,
      'Coveñas',
      extracted.durationDays,
    )

    assert.equal(rebuiltChat.includes('catálogo actual'), false)
    assert.match(rebuiltChat, /Itinerario de Viaje: Coveñas \(4 días\)/)
    assert.match(rebuiltChat, /Día 1: Coveñas/)
    assert.match(rebuiltChat, /Día 2: Coveñas/)
    assert.match(rebuiltChat, /Día 3: Coveñas/)
    assert.match(rebuiltChat, /Día 4: Coveñas/)
    assert.match(rebuiltChat, /Playa Primera Ensenada/)
    assert.match(rebuiltChat, /Playa La Coquerita/)
    assert.match(rebuiltChat, /Isla Tintipán/)
    assert.match(rebuiltChat, /Isla Múcura/)
    assert.match(rebuiltChat, /Santa Cruz del Islote/)
  })

  it('limits automatic islands to one per day while preserving explicitly requested islands', () => {
    const catalog = getCuratedCoastalStops('Coveñas')
    const selectedIslands = catalog
      .filter(stop => stop.curatedSection === 'islands')
      .slice(0, 4)
      .map(stop => ({ ...stop, dia: 1, day: 1 }))
    const automatic = assignCoastalIslandDays(
      ensureCuratedCoastalStopsInItinerary([], 'Coveñas', 4),
      4,
    ).filter(stop => stop.curatedSection === 'islands')
    assert.equal(automatic.length, 3)
    assert.equal(new Set(automatic.map(stop => stop.dia)).size, 3)

    const explicitlyRequested = selectedIslands.map(stop => ({
      ...stop,
      rawTags: { requested_place: 'true' },
    }))
    const preserved = ensureCuratedCoastalStopsInItinerary(explicitlyRequested, 'Coveñas', 2)
    assert.equal(preserved.filter(stop => stop.curatedSection === 'islands').length, 4)
  })

  it('keeps the curated places in the selected coastal map tour and leaves other tour types dynamic', () => {
    const candidates = getCuratedCoastalStops('Santiago de Tolú')
    const planner = buildTourPlanner({
      tourType: 'coastal_islands',
      type: 'custom',
      destination: 'Santiago de Tolú',
      city: 'Santiago de Tolú',
      country: 'Colombia',
      durationDays: 4,
      durationHours: 96,
      specificPlaces: [],
      selectedPlaces: [],
    }, null, candidates)
    const selected = planner.selectedPlaces
    const local = selected.filter(stop => stop.curatedSection === 'tolu')
    const islands = selected.filter(stop => stop.curatedSection === 'islands')

    assert.ok(local.length >= 1)
    assert.ok(new Set(local.map(stop => stop.dia)).size > 1)
    assert.equal(islands.length, 3)
    assert.equal(new Set(islands.map(stop => stop.dia)).size, islands.length)
    assert.ok(islands.every(stop => isCuratedCoastalCoordinateStop(stop, 'Santiago de Tolú')))
    assert.equal(isCoastalIslandsTour({ tourType: 'express_tour', destination: 'Santiago de Tolú' }), false)
    assert.equal(getCuratedCoastalStops('Cartagena').length, 0)
  })

  it('builds a 4-day Coveñas tour without 500 error when confirmedPlaces are serialized via Flutter AiRecommendation.toJson()', async () => {
    const previousFetch = globalThis.fetch
    globalThis.fetch = async () => ({ ok: false, json: async () => ({}) })
    try {
      const itinerary = assignCoastalIslandDays(
        ensureCuratedCoastalStopsInItinerary([], 'Coveñas', 4),
        4,
      )
      // Simulate Flutter AiRecommendation.fromJson -> AiRecommendation.toJson()
      const flutterConfirmedPlaces = itinerary.map((place, index) => ({
        id: place.placeId || `rec-${index}`,
        name: String(place.name || '').includes(',') ? String(place.name).split(',')[0].trim() : place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        coordinateSource: place.coordinateSource,
        coordinatesVerified: true,
        category: place.category || 'turismo',
        imageUrl: '',
        description: place.description || '',
        reason: 'Seleccionado en el mapa',
        durationMinutes: place.minutes || 60,
        dia: place.dia,
        day: place.day,
        locationInfo: {
          nombre_lugar: place.name,
          direccion: '',
          ciudad: 'Coveñas',
          region: 'Sucre',
          pais: 'Colombia',
          place_id: place.placeId,
          fuente_coordenadas: place.coordinateSource,
          coordenadas_verificadas: true,
          url_mapa: '',
        },
      }))

      assert.ok(flutterConfirmedPlaces.every(p => isCoastalMappedTouristStop(p)))

      const built = await processTourBuild(
        null,
        {
          destination: 'Coveñas, Colombia',
          city: 'Coveñas',
          country: 'Colombia',
          tourType: 'coastal_islands',
          type: 'custom',
          durationDays: 4,
          durationHours: 96,
          language: 'es',
        },
        flutterConfirmedPlaces,
        {},
      )

      assert.ok(built?.tour)
      const builtStops = built.tour.itinerario || built.tour.stops || []
      assert.equal(builtStops.length, flutterConfirmedPlaces.length)
      const builtDays = [...new Set(builtStops.map(stop => stop.dia || stop.day))].sort((a, b) => a - b)
      assert.deepEqual(builtDays, [1, 2, 3, 4])
    } finally {
      globalThis.fetch = previousFetch
    }
  })
})
