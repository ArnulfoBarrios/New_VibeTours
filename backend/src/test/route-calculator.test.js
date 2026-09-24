import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateRoute,
  normalizeRoutePoints,
  parseGeoapifyRouteResponse,
  parseMapboxRouteResponse
} from '../services/route-calculator.js'

const mapboxPayload = {
  routes: [{
    distance: 1250,
    duration: 300,
    geometry: {
      type: 'LineString',
      coordinates: [[-74.072, 4.711], [-74.073, 4.712]]
    }
  }]
}

test('route calculator parses Mapbox geometry without changing coordinate order', () => {
  const result = parseMapboxRouteResponse(mapboxPayload)
  assert.equal(result.provider, 'mapbox')
  assert.deepEqual(result.geometry, [
    { latitude: 4.711, longitude: -74.072 },
    { latitude: 4.712, longitude: -74.073 }
  ])
  assert.equal(result.distanceMeters, 1250)
  assert.equal(result.travelTimeSeconds, 300)
})

test('route calculator parses Geoapify fallback geometry', () => {
  const result = parseGeoapifyRouteResponse({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { distance: 980, time: 240 },
      geometry: {
        type: 'LineString',
        coordinates: [[-74.072, 4.711], [-74.074, 4.713]]
      }
    }]
  })
  assert.equal(result.provider, 'geoapify')
  assert.equal(result.distanceMeters, 980)
  assert.equal(result.travelTimeSeconds, 240)
  assert.equal(result.geometry.length, 2)
})

test('route calculator uses Mapbox first and Geoapify when Mapbox fails', async () => {
  const originalFetch = globalThis.fetch
  const originalMapboxToken = process.env.MAPBOX_ACCESS_TOKEN
  const originalGeoapifyKey = process.env.GEOAPIFY_API_KEY
  const calls = []

  try {
    process.env.MAPBOX_ACCESS_TOKEN = 'test-mapbox-token'
    process.env.GEOAPIFY_API_KEY = ''
    globalThis.fetch = async url => {
      calls.push(String(url))
      return { ok: true, json: async () => mapboxPayload }
    }

    const mapboxRoute = await calculateRoute({
      points: [{ latitude: 4.711, longitude: -74.072 }, { latitude: 4.712, longitude: -74.073 }],
      mode: 'walking'
    })
    assert.equal(mapboxRoute.provider, 'mapbox')
    assert.match(calls[0], /mapbox\/walking/)

    calls.length = 0
    process.env.MAPBOX_ACCESS_TOKEN = ''
    process.env.GEOAPIFY_API_KEY = 'test-geoapify-key'
    globalThis.fetch = async url => {
      calls.push(String(url))
      return {
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          features: [{
            properties: { distance: 900, time: 180 },
            geometry: { type: 'LineString', coordinates: [[-74.072, 4.711], [-74.073, 4.712]] }
          }]
        })
      }
    }
    const geoapifyRoute = await calculateRoute({
      points: [{ latitude: 4.711, longitude: -74.072 }, { latitude: 4.712, longitude: -74.073 }],
      mode: 'cycling'
    })
    assert.equal(geoapifyRoute.provider, 'geoapify')
    assert.match(calls[0], /api\.geoapify\.com\/v1\/routing/)
    assert.match(calls[0], /mode=bicycle/)
  } finally {
    globalThis.fetch = originalFetch
    if (originalMapboxToken == null) delete process.env.MAPBOX_ACCESS_TOKEN
    else process.env.MAPBOX_ACCESS_TOKEN = originalMapboxToken
    if (originalGeoapifyKey == null) delete process.env.GEOAPIFY_API_KEY
    else process.env.GEOAPIFY_API_KEY = originalGeoapifyKey
  }
})

test('route calculator rejects invalid or null-island points before calling providers', () => {
  assert.deepEqual(normalizeRoutePoints([
    { latitude: 0, longitude: 0 },
    { latitude: 4.711, longitude: -74.072 },
    { latitude: 95, longitude: -74.073 }
  ]), [{ latitude: 4.711, longitude: -74.072 }])
})
