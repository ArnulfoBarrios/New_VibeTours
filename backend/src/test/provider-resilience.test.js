import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchWithProviderRetry } from '../services/provider-http.js'
import {
  buildProgressiveSearchQueries,
  searchGeoapifyPlaces,
  searchMapboxPlaces
} from '../services/places-resolver.js'

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

test('progressive search starts precise and then broadens the query', () => {
  assert.deepEqual(buildProgressiveSearchQueries({
    name: 'Museo del Río',
    city: 'Mompox',
    country: 'Colombia',
    address: 'Calle 12 # 3-10'
  }), [
    'Museo del Río, Mompox, Colombia',
    'Museo del Río, Mompox',
    'Museo del Río, Colombia',
    'Museo del Río',
    'Calle 12 # 3-10, Mompox, Colombia',
    'Calle 12 # 3-10, Mompox'
  ])
})

test('provider retry retries transient failures and stops after a successful response', async () => {
  let calls = 0
  const originalFetch = global.fetch
  try {
    global.fetch = async () => {
      calls += 1
      return calls < 3 ? jsonResponse({ error: 'temporary' }, 503) : jsonResponse({ ok: true })
    }
    const response = await fetchWithProviderRetry('https://provider.test/resource', {}, {
      attempts: 3,
      timeoutMs: 100,
      onRetry: () => {}
    })
    assert.equal(response?.ok, true)
    assert.equal(calls, 3)
  } finally {
    global.fetch = originalFetch
  }
})

test('Mapbox discovery retries and returns a verified POI', async () => {
  const originalFetch = global.fetch
  const originalToken = process.env.MAPBOX_ACCESS_TOKEN
  let calls = 0
  try {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test-token'
    global.fetch = async () => {
      calls += 1
      if (calls < 3) return jsonResponse({ error: 'temporary' }, 503)
      return jsonResponse({
        features: [{
          id: 'poi.mompox-museum',
          text: 'Museo de Mompox',
          place_name: 'Museo de Mompox, Mompox, Colombia',
          center: [-74.426, 9.241],
          place_type: ['poi'],
          relevance: 0.96,
          properties: { category: 'museum' },
          context: [{ id: 'place.1', text: 'Mompox' }, { id: 'country.1', text: 'Colombia' }]
        }]
      })
    }

    const result = await searchMapboxPlaces({
      queries: ['museo Mompox Colombia'],
      cityLat: 9.241,
      cityLon: -74.426,
      maxDistanceKm: 5
    })
    assert.equal(result.length, 1)
    assert.equal(result[0].placeId, 'mapbox:poi.mompox-museum')
    assert.equal(calls, 3)
  } finally {
    global.fetch = originalFetch
    if (originalToken == null) delete process.env.MAPBOX_ACCESS_TOKEN
    else process.env.MAPBOX_ACCESS_TOKEN = originalToken
  }
})

test('provider result from another city is rejected by the discovery radius', async () => {
  const originalFetch = global.fetch
  const originalToken = process.env.MAPBOX_ACCESS_TOKEN
  try {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test-token'
    global.fetch = async () => jsonResponse({
      features: [{
        id: 'poi.other-city',
        text: 'Museo de Roma',
        place_name: 'Museo de Roma, Italia',
        center: [12.4922, 41.8902],
        place_type: ['poi'],
        properties: { category: 'museum' }
      }]
    })
    const result = await searchMapboxPlaces({
      queries: ['museo Mompox Colombia'],
      cityLat: 9.241,
      cityLon: -74.426,
      maxDistanceKm: 5
    })
    assert.deepEqual(result, [])
  } finally {
    global.fetch = originalFetch
    if (originalToken == null) delete process.env.MAPBOX_ACCESS_TOKEN
    else process.env.MAPBOX_ACCESS_TOKEN = originalToken
  }
})

test('provider with no results returns an empty discovery list without synthetic places', async () => {
  const originalFetch = global.fetch
  const originalKey = process.env.GEOAPIFY_API_KEY
  try {
    process.env.GEOAPIFY_API_KEY = '12345678901234567890'
    global.fetch = async () => jsonResponse({ features: [] })
    const result = await searchGeoapifyPlaces({
      categories: ['tourism.sights'],
      cityLat: 9.241,
      cityLon: -74.426,
      radiusMeters: 5000,
      limit: 10
    })
    assert.deepEqual(result, [])
  } finally {
    global.fetch = originalFetch
    if (originalKey == null) delete process.env.GEOAPIFY_API_KEY
    else process.env.GEOAPIFY_API_KEY = originalKey
  }
})
