import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'

import {
  assignCoastalIslandDays,
  isCoastalMappedTouristStop,
  isCoastalOpenStreetMapNode,
  isCoastalTransferStop,
} from '../services/coastal-islands-policy.js'
import { coastalWikipediaSummary } from '../services/imageSearch.js'
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
