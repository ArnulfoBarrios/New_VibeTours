import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'

import {
  assignCoastalIslandDays,
  isCoastalMappedTouristStop,
  isCoastalOpenStreetMapNode,
  isCoastalTransferStop,
  isCoastalIslandsTour,
  resolveCoastalCatalogEntries,
  resolveChatTourTypeAfterExtraction,
} from '../services/coastal-islands-policy.js'
import { coastalWikipediaSummary } from '../services/imageSearch.js'
import { KNOWN_ICONIC_LANDMARKS, overpassAttractions } from '../services/osm.js'
import {
  buildHotelRecommendationReply,
  DESTINATION_ICONIC_HOTELS,
  DESTINATION_ICONIC_LANDMARKS,
  DESTINATION_ICONIC_RESTAURANTS,
  ensureCompleteOneDayItineraryText,
  sanitizeInternalTravelLanguage,
} from '../services/openai.js'
import { buildFallbackTour, buildTourPlanner, normalizeStop, rebuildCoastalChatItinerary } from '../routes/ai.js'

const originalFetch = globalThis.fetch
after(() => {
  globalThis.fetch = originalFetch
})

function osmPlace(name, primitive, id, latitude, longitude, properties = {}) {
  return {
    name,
    latitude,
    longitude,
    placeId: `${primitive}/${id}`,
    osmType: primitive,
    coordinateSource: 'osm_overpass',
    coordinatesVerified: true,
    tags: {},
    ...properties,
  }
}

const coastalInput = {
  tourType: 'coastal_islands',
  type: 'custom',
  destination: 'Coveñas, Colombia',
  city: 'Coveñas',
  country: 'Colombia',
  durationDays: 4,
  durationHours: 96,
  touristInterests: ['islas', 'playa', 'naturaleza'],
  specificPlaces: [
    { name: 'Isla Múcura', dia: 1 },
    { name: 'Restaurante Palafito', dia: 1 },
    { name: 'Isla Tintipán', dia: 1 },
    { name: 'Islas de San Bernardo', dia: 2 },
    { name: 'Muelle de Coveñas', dia: 2 },
    { name: 'Restaurante inventado en Português', dia: 3 },
    { name: 'Restaurante aislado', dia: 4 },
  ],
}

const coastalCandidates = [
  osmPlace('Isla Múcura', 'way', 100, 9.78, -75.86, { tags: { place: 'island' }, category: 'attraction' }),
  osmPlace('Restaurante Palafito', 'node', 101, 9.78, -75.86, { tags: { amenity: 'restaurant' }, category: 'restaurant' }),
  osmPlace('Isla Tintipán', 'way', 102, 9.79, -75.84, { tags: { place: 'island' }, category: 'attraction' }),
  osmPlace('Islas de San Bernardo', 'relation', 103, 9.77, -75.85, { tags: { place: 'archipelago' }, category: 'attraction' }),
  osmPlace('Muelle de Coveñas', 'node', 104, 9.40, -75.68, { tags: { amenity: 'ferry_terminal' }, category: 'attraction' }),
  {
    ...osmPlace('Restaurante inventado en Português', 'node', 105, 9.42, -75.69, { tags: { amenity: 'restaurant' }, category: 'restaurant' }),
    coordinateSource: 'geoapify',
  },
  osmPlace('Restaurante aislado', 'node', 106, 9.42, -75.69, { tags: { amenity: 'restaurant' }, category: 'restaurant' }),
]

describe('coastal_islands stop policy', () => {
  it('does not use Coveñas/Tolú presets to backfill coastal stops or invent an unmapped meal', () => {
    const island = coastalCandidates[0]
    const catalog = {
      places: ['Isla Múcura', 'Islas de San Bernardo', 'Playa Divina'],
      restaurants: ['Restaurante Las Acacias'],
      candidateCatalog: {
        places: [island],
        restaurants: [],
      },
    }
    const parsed = {}
    const response = ensureCompleteOneDayItineraryText(
      'Itinerario de Viaje: Coveñas (este sábado)\n\nDía 1: Coveñas\n• Islas de San Bernardo\n• Playa Divina\n• Restaurante Las Acacias\n\n¿Deseas confirmar el itinerario?',
      'Coveñas',
      catalog,
      parsed,
      '',
      { tourType: 'coastal_islands' },
    )

    assert.match(response, /Isla Múcura/)
    assert.doesNotMatch(response, /Islas de San Bernardo|Playa Divina|Las Acacias|Almuerzo tradicional/)
    assert.deepEqual(parsed.specificPlaces.map(place => place.name), ['Isla Múcura'])
    assert.equal(parsed.specificPlaces[0].placeId, island.placeId)
  })

  it('removes unverified Coveñas/Tolú attraction and restaurant presets', () => {
    assert.equal(DESTINATION_ICONIC_LANDMARKS.covenas, undefined)
    assert.equal(DESTINATION_ICONIC_LANDMARKS.coveñas, undefined)
    assert.equal(DESTINATION_ICONIC_LANDMARKS.tolu, undefined)
    assert.equal(DESTINATION_ICONIC_LANDMARKS['santiago de tolu'], undefined)
    assert.equal(DESTINATION_ICONIC_RESTAURANTS.covenas, undefined)
    assert.equal(DESTINATION_ICONIC_RESTAURANTS.coveñas, undefined)
    assert.equal(DESTINATION_ICONIC_RESTAURANTS['golfo de morrosquillo'], undefined)
    assert.ok(DESTINATION_ICONIC_HOTELS.covenas.some(hotel => hotel.name === 'Hotel Palma Linda'))
    assert.equal(KNOWN_ICONIC_LANDMARKS['isla mucura'], undefined)
    assert.equal(KNOWN_ICONIC_LANDMARKS['islas de san bernardo'], undefined)
  })

  it('keeps coastal policy when one-day extraction downgrades it to express', () => {
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'coastal_islands' },
      { tourType: 'express_tour' },
      'Ya tenemos hotel',
    ), 'coastal_islands')
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'express_tour' },
      { tourType: 'express_tour' },
      'Quiero ver las islas alrededor de Coveñas',
    ), 'coastal_islands')
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'express_tour', city: 'Coveñas', specificPlaces: [{ name: 'Isla Múcura', dia: 1 }] },
      { tourType: 'express_tour' },
      'Ya tenemos el hotel',
    ), 'coastal_islands')
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'express_tour', city: 'Cartagena', specificPlaces: [{ name: 'Isla Barú', dia: 1 }] },
      { tourType: 'express_tour' },
      'Ya tenemos el hotel',
    ), 'express_tour')
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'coastal_islands' },
      { tourType: 'express_tour' },
      'Un tour de un día',
      { destinationChanged: true },
    ), 'express_tour')
    assert.equal(resolveChatTourTypeAfterExtraction(
      { tourType: 'coastal_islands' },
      {},
      'Un tour de un día',
      { destinationChanged: true },
    ), '')
  })

  it('removes internal catalog diagnostics when rebuilding an empty coastal itinerary', () => {
    const rebuilt = rebuildCoastalChatItinerary(
      'Los lugares confirmados en el mapa de Coveñas no contienen nombres confirmados de islas.\n\nItinerario de Viaje: Coveñas (1 día)\n\nDía 1: Coveñas\n• Isla Múcura',
      [],
      'Coveñas',
      1,
    )
    assert.doesNotMatch(rebuilt, /lugares confirmados en el mapa|nombres confirmados de islas|Itinerario de Viaje|Isla Múcura/)
    assert.match(rebuilt, /No encontré suficientes opciones/)
  })

  it('queries mapped islands and beaches from OSM within the coastal corridor', async () => {
    const originalFetch = globalThis.fetch
    let overpassQuery = ''
    globalThis.fetch = async (_url, options = {}) => {
      overpassQuery = options.body?.get?.('data') || ''
      return new Response(JSON.stringify({
        elements: [{
          type: 'node',
          id: 987654321,
          lat: 9.7818,
          lon: -75.8723,
          tags: { name: 'Isla Múcura', place: 'islet', tourism: 'attraction' }
        }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const places = await overpassAttractions(9.47213, -75.71234, 65000, { coastalIslands: true })
      assert.match(overpassQuery, /\["natural"~"beach\|island\|islet"\]/)
      assert.match(overpassQuery, /\["place"~"island\|islet"\]/)
      assert.ok(places.some(place => place.name === 'Isla Múcura' && place.placeId === 'node/987654321'))
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('accepts mapped attractions and OSM restaurant nodes, while rejecting ungrounded or structural stops', () => {
    const island = coastalCandidates[0]
    const restaurantNode = coastalCandidates[1]
    const restaurantWay = osmPlace('Restaurante sobre way', 'way', 110, 9.78, -75.86, {
      tags: { amenity: 'restaurant' },
      category: 'restaurant',
    })

    assert.equal(isCoastalMappedTouristStop(island), true)
    assert.equal(isCoastalOpenStreetMapNode(restaurantNode), true)
    assert.equal(isCoastalMappedTouristStop(restaurantNode), true)
    assert.equal(isCoastalMappedTouristStop(restaurantWay), false)
    assert.equal(isCoastalMappedTouristStop(coastalCandidates[3]), false)
    assert.equal(isCoastalMappedTouristStop(coastalCandidates[4]), false)
    assert.equal(isCoastalMappedTouristStop(coastalCandidates[5]), false)
    assert.equal(isCoastalTransferStop('Muelle de Coveñas'), true)
  })

  it('rehydrates legacy coastal catalog names only from their exact mapped candidate', () => {
    const catalog = {
      places: [
        'Isla Múcura',
        'Islas de San Bernardo',
        'Muelle de Coveñas',
        'Playa sin registro',
      ],
      restaurants: ['Restaurante Palafito', 'Restaurante sin nodo'],
      candidateCatalog: {
        places: [coastalCandidates[0], coastalCandidates[3], coastalCandidates[4]],
        restaurants: [coastalCandidates[1]],
      },
    }

    assert.deepEqual(
      resolveCoastalCatalogEntries(catalog.places, catalog.candidateCatalog, 'places').map(place => place.name),
      ['Isla Múcura'],
    )
    assert.deepEqual(
      resolveCoastalCatalogEntries(catalog.restaurants, catalog.candidateCatalog, 'restaurants').map(place => place.name),
      ['Restaurante Palafito'],
    )
  })

  it('lists every available hotel in the chat message and buttons from one list', () => {
    const reply = buildHotelRecommendationReply('Coveñas', [
      { name: 'Estela del Mar' },
      { name: 'Hotel Stiphen' },
      { name: 'Hotel Unión' },
    ])
    const listedNames = [...reply.responseMessage.matchAll(/^• (.+)$/gm)].map(match => match[1])

    assert.deepEqual(listedNames, ['Estela del Mar', 'Hotel Stiphen', 'Hotel Unión'])
    assert.deepEqual(reply.actionChips.slice(0, 3), listedNames)
    assert.equal(reply.responseMessage.includes('catálogo'), false)
  })

  it('removes internal catalog diagnostics from traveler-facing text', () => {
    const message = sanitizeInternalTravelLanguage(
      'El catálogo verificado no muestra nombres legibles de playas ni islas de Coveñas, así que prefiero no inventar paradas. No encontré lugares en OpenStreetMap. ¿Amplío la búsqueda?',
      'Coveñas',
    )

    assert.equal(message.includes('catálogo verificado'), false)
    assert.equal(message.includes('nombres legibles'), false)
    assert.equal(message.includes('OpenStreetMap'), false)
    assert.match(message, /lugares confirmados en Coveñas/)
    assert.match(message, /¿Amplío la búsqueda\?/)

    const alternateDiagnostic = sanitizeInternalTravelLanguage(
      'El catálogo verificado de Coveñas no contiene atractivos ni restaurantes confirmados; ¿deseas ampliar la búsqueda?',
      'Coveñas',
    )
    assert.equal(alternateDiagnostic.includes('catálogo verificado'), false)
    assert.equal(alternateDiagnostic.includes('no contiene'), false)
  })

  it('moves islands to separate days and drops restaurant-only days', () => {
    const assigned = assignCoastalIslandDays([
      { ...coastalCandidates[0], dia: 1 },
      { ...coastalCandidates[1], dia: 1 },
      { ...coastalCandidates[2], dia: 1 },
      { ...coastalCandidates[6], dia: 4 },
    ], 4)

    const islandDays = assigned
      .filter(stop => /isla/i.test(stop.name))
      .map(stop => stop.dia)
    assert.deepEqual(islandDays, [1, 2])
    assert.equal(assigned.some(stop => stop.name === 'Restaurante Palafito' && stop.dia === 1), true)
    assert.equal(assigned.some(stop => stop.name === 'Restaurante aislado'), false)
  })

  it('keeps the chat proposal identical to the verified stops used by the tour planner', () => {
    const planner = buildTourPlanner(
      { ...coastalInput, specificPlaces: coastalInput.specificPlaces.slice(0, 5) },
      { latitude: 9.4, longitude: -75.68 },
      coastalCandidates,
    )
    const plannedNames = planner.selectedPlaces.map(stop => stop.name)
    const chat = rebuildCoastalChatItinerary(
      'Itinerario de Viaje: Coveñas (4 días)\n\nDía 1: Coveñas\n• Isla Múcura\n• Isla Tintipán\n¿Deseas confirmar este itinerario y generar tu tour en el mapa?',
      planner.selectedPlaces,
      'Coveñas',
      4,
    )
    const displayedNames = [...chat.matchAll(/^• (.+)$/gm)].map(match => match[1])

    assert.deepEqual(displayedNames, plannedNames)
    assert.equal(chat.includes('Muelle de Coveñas'), false)
    assert.equal(chat.includes('Islas de San Bernardo'), false)
  })

  it('does not apply OSM-node restrictions to other tour types', () => {
    const nonCoastalPlace = {
      name: 'Museo de la Ciudad',
      latitude: 10.4,
      longitude: -75.5,
      placeId: 'commercial:city-museum',
      coordinateSource: 'mapbox',
      coordinatesVerified: true,
      category: 'attraction',
    }
    for (const tourType of ['single_city', 'express_tour', 'micro_destination']) {
      const planner = buildTourPlanner({
        ...coastalInput,
        tourType,
        durationDays: 1,
        durationHours: 8,
        specificPlaces: [{ name: nonCoastalPlace.name, dia: 1 }],
      }, { latitude: 10.4, longitude: -75.5 }, [nonCoastalPlace])

      assert.ok(
        planner.selectedPlaces.some(stop => stop.name === nonCoastalPlace.name),
        `${tourType} should keep its existing non-OSM candidate policy`,
      )
    }
    for (const tourType of ['city_to_city', 'international_multicity', 'location_to_destination']) {
      assert.equal(isCoastalIslandsTour({ tourType }), false, `${tourType} must not enter coastal policy`)
    }
  })

  it('does not trust AI-supplied OSM-shaped metadata when the mapped candidate catalog is empty', () => {
    const fabricatedStop = osmPlace('Restaurante aislado sin catálogo', 'node', 987654321, 9.42, -75.69, {
      tags: { amenity: 'restaurant' },
      category: 'restaurant',
    })
    const planner = buildTourPlanner({
      ...coastalInput,
      specificPlaces: [fabricatedStop],
    }, { latitude: 9.4, longitude: -75.68 }, [])

    assert.deepEqual(planner.selectedPlaces, [])
  })

  it('keeps mapped coastal coordinates even when the AI response provides different coordinates', async () => {
    const previousFetch = globalThis.fetch
    globalThis.fetch = async () => ({ ok: false, json: async () => ({}) })
    try {
      const island = {
        ...coastalCandidates[0],
        name: 'Isla Testigo de Coordenadas',
      }
      const normalized = await normalizeStop({
        nombre: island.name,
        latitude: 9.42,
        longitude: -75.68,
      }, 0, {
        ...coastalInput,
        latitude: 9.4,
        longitude: -75.68,
      }, null, [island], null, {})

      assert.equal(normalized.publicStop.ubicacion.latitud, island.latitude)
      assert.equal(normalized.publicStop.ubicacion.longitud, island.longitude)
      assert.equal(normalized.publicStop.ubicacion.coordenadas_verificadas, true)
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('rejects an unmapped coastal stop instead of attaching a different candidate coordinate', async () => {
    await assert.rejects(
      () => normalizeStop({ nombre: 'Restaurante inventado en Português' }, 0, coastalInput, null, [coastalCandidates[0]], null, {}),
      error => error.code === 'UNMAPPED_COASTAL_STOP',
    )
  })

  it('finds the page summary from Wikipedia, caches it, and does one summary request', async () => {
    let requestCount = 0
    globalThis.fetch = async input => {
      requestCount++
      const url = new URL(String(input))
      if (url.pathname.endsWith('/w/api.php')) {
        return {
          ok: true,
          json: async () => ({ query: { search: [{ title: 'Isla Múcura', snippet: 'Isla Múcura, archipiélago colombiano.' }] } }),
        }
      }
      if (url.pathname.includes('/api/rest_v1/page/summary/')) {
        return {
          ok: true,
          json: async () => ({
            title: 'Isla Múcura',
            extract: 'Isla Múcura es una isla del archipiélago de San Bernardo, en el Caribe colombiano.',
            content_urls: { desktop: { page: 'https://es.wikipedia.org/wiki/Isla_M%C3%BAcura' } },
          }),
        }
      }
      return { ok: false, json: async () => ({}) }
    }

    const first = await coastalWikipediaSummary('Isla Múcura', 'Coveñas', 'Colombia')
    const second = await coastalWikipediaSummary('Isla Múcura', 'Coveñas', 'Colombia')

    assert.equal(first?.title, 'Isla Múcura')
    assert.match(first?.url || '', /wikipedia\.org/)
    assert.equal(first?.text, second?.text)
    assert.equal(requestCount, 2)
  })

  it('uses a place-specific Wikipedia description and AI activities, while marking a restaurant photo as demo', async () => {
    const previousFetch = globalThis.fetch
    const wikiDescription = 'Isla Maravilla de Prueba es una isla coralina del Caribe colombiano.'
    const wikiImage = 'https://upload.wikimedia.org/wikipedia/commons/isla_maravilla_prueba.jpg'
    globalThis.fetch = async input => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/w/api.php')) {
        return {
          ok: true,
          json: async () => ({ query: { search: [{ title: 'Isla Maravilla de Prueba', snippet: wikiDescription }] } }),
        }
      }
      if (url.pathname.includes('/api/rest_v1/page/summary/')) {
        return {
          ok: true,
          json: async () => ({
            title: 'Isla Maravilla de Prueba',
            extract: wikiDescription,
            thumbnail: { source: wikiImage },
            content_urls: { desktop: { page: 'https://es.wikipedia.org/wiki/Isla_Maravilla_de_Prueba' } },
          }),
        }
      }
      return { ok: false, json: async () => ({}) }
    }

    try {
      const island = osmPlace('Isla Maravilla de Prueba', 'way', 987654321, 9.41, -75.68, {
        tags: { place: 'island' },
        category: 'attraction',
      })
      const activities = ['Nadar en aguas tranquilas', 'Observar el arrecife desde una zona autorizada']
      const normalizedIsland = await normalizeStop({
        nombre: island.name,
        candidateId: island.placeId,
        imagenes: ['https://example.invalid/unrelated-restaurant-photo.jpg'],
        descripcion: 'Descripción genérica del lugar.',
      }, 0, {
        ...coastalInput,
        latitude: 9.41,
        longitude: -75.68,
      }, null, [island], null, {
        descriptionsMap: {
          [island.name]: {
            descripcion: 'Descripción original específica de IA.',
            actividades: activities,
          },
        },
      })

      const restaurant = osmPlace('Restaurante Demo Node Test', 'node', 987654322, 9.41, -75.68, {
        tags: { amenity: 'restaurant' },
        category: 'restaurant',
      })
      const normalizedRestaurant = await normalizeStop({
        nombre: restaurant.name,
        candidateId: restaurant.placeId,
      }, 0, {
        ...coastalInput,
        latitude: 9.41,
        longitude: -75.68,
      }, null, [restaurant], null, {
        descriptionsMap: {
          [restaurant.name]: {
            descripcion: 'Un comedor costero con cocina local propia.',
            actividades: ['Probar pescado preparado al estilo de la región'],
          },
        },
      })

      assert.equal(normalizedIsland.publicStop.descripcion, wikiDescription)
      assert.equal(normalizedIsland.publicStop.descripcion_fuente, 'wikipedia')
      assert.equal(normalizedIsland.publicStop.wikipedia_url, 'https://es.wikipedia.org/wiki/Isla_Maravilla_de_Prueba')
      assert.deepEqual(normalizedIsland.publicStop.actividades, activities)
      assert.equal(normalizedIsland.publicStop.imagenes.includes('https://example.invalid/unrelated-restaurant-photo.jpg'), false)
      assert.equal(normalizedIsland.publicStop.isDemoImage, false)
      assert.equal(normalizedRestaurant.publicStop.isDemoImage, true)
      assert.equal(normalizedRestaurant.routeStop.isDemoImage, true)
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  it('keeps deterministic itinerary assembly fast for four day requests', t => {
    const samples = []
    for (let run = 0; run < 20; run++) {
      const start = performance.now()
      buildTourPlanner(coastalInput, { latitude: 9.4, longitude: -75.68 }, coastalCandidates)
      samples.push(performance.now() - start)
    }
    const averageMs = samples.reduce((sum, value) => sum + value, 0) / samples.length
    t.diagnostic(`20 local planner builds averaged ${averageMs.toFixed(2)}ms each`)
    assert.ok(averageMs < 250, `local planner assembly averaged ${averageMs.toFixed(2)}ms`)
  })

  it('builds the coastal fallback without extra provider lookups and identifies the demo cover', async t => {
    const planner = buildTourPlanner(
      { ...coastalInput, specificPlaces: coastalInput.specificPlaces.slice(0, 3) },
      { latitude: 9.4, longitude: -75.68 },
      coastalCandidates,
    )
    const previousFetch = globalThis.fetch
    let providerRequests = 0
    globalThis.fetch = async () => {
      providerRequests++
      throw new Error('The coastal fallback should not make duplicate provider requests')
    }

    try {
      const startedAt = performance.now()
      const fallback = await buildFallbackTour(planner, coastalInput)
      const elapsedMs = performance.now() - startedAt

      assert.equal(fallback.tipo_recorrido, 'coastal_islands')
      assert.equal(fallback.imagen_portada_es_demo, true)
      assert.equal(providerRequests, 0)
      t.diagnostic(`coastal fallback built locally in ${elapsedMs.toFixed(2)}ms`)
      assert.ok(elapsedMs < 250, `coastal fallback took ${elapsedMs.toFixed(2)}ms`)
    } finally {
      globalThis.fetch = previousFetch
    }
  })
})
