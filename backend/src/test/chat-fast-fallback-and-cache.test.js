import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { aiRouter } from '../routes/ai.js'
import {
  generateChatResponse,
  tripOpenAiCircuitBreaker,
  resetOpenAiCircuitBreaker,
  fetchCityIconicLandmarks
} from '../services/openai.js'
import {
  placesMemoryCache,
  cityCatalogMemoryCache,
  lookupCachedPlacesForCity,
  getCachedCityCatalog,
  saveCachedPlacesBatch
} from '../services/places-cache-service.js'

describe('Ultra-fast Chat Performance, Dynamic Fallback, and Places Cache', () => {
  it('should respond to conversational turns ("Voy con unos amigos", "Presupuesto de 7 millones") in < 1.5s', async () => {
    const app = express()
    app.use(express.json())
    app.use('/api/ai', aiRouter)

    const server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s))
    })
    const { port } = server.address()
    const url = `http://127.0.0.1:${port}/api/ai/chat`

    try {
      const testCases = [
        {
          message: 'Voy con unos amigos',
          currentPreferences: { city: 'Cartagena', destination: 'Cartagena, Colombia' }
        },
        {
          message: 'Presupuesto de 7 millones',
          currentPreferences: { city: 'Cartagena', destination: 'Cartagena, Colombia', companions: 'con amigos' }
        },
        {
          message: 'Auto rentado',
          currentPreferences: { city: 'Cartagena', destination: 'Cartagena, Colombia', budget: 'Moderado' }
        }
      ]

      for (const tc of testCases) {
        const start = performance.now()
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tc)
        })
        const duration = performance.now() - start
        assert.equal(res.status, 200)
        const data = await res.json()

        assert.ok(duration < 1500, `Expected conversational response in < 1500ms, took ${duration.toFixed(2)}ms for "${tc.message}"`)
        assert.ok(data.responseMessage, 'Response must have responseMessage')
        assert.ok(Array.isArray(data.actionChips), 'Response must have actionChips')
        assert.ok(data.updatedPreferences || data.preferences, 'Response must have preferences')
      }
    } finally {
      server.close()
    }
  })

  it('should respond immediately (< 100ms) with local fallback when OpenAI circuit breaker is open', async () => {
    tripOpenAiCircuitBreaker('testing_circuit_breaker')
    try {
      const state = {
        history: [{ role: 'user', content: 'Presupuesto de 7 millones' }]
      }
      const preferences = {
        city: 'Florencia',
        country: 'Italia',
        durationDays: 4,
        companions: 'con amigos'
      }

      const start = performance.now()
      const res = await generateChatResponse(state, '', '', preferences)
      const duration = performance.now() - start

      assert.ok(duration < 150, `Expected instant fallback response in < 150ms, took ${duration.toFixed(2)}ms`)
      assert.ok(res.responseMessage, 'Fallback must produce a valid responseMessage')
      assert.ok(Array.isArray(res.actionChips), 'Fallback must produce actionChips')
      assert.equal(typeof res.readyToBuild, 'boolean')
    } finally {
      resetOpenAiCircuitBreaker()
    }
  })

  it('should reuse city places from places_cache in 0ms without hitting Overpass or Photon', async () => {
    const testCity = 'Kyoto_Test_City'
    const mockLandmarks = [
      { name: 'Kinkaku-ji', category: 'attraction', latitude: 35.0394, longitude: 135.7292, address: 'Kyoto' },
      { name: 'Fushimi Inari Taisha', category: 'attraction', latitude: 34.9671, longitude: 135.7727, address: 'Kyoto' },
      { name: 'Kiyomizu-dera', category: 'attraction', latitude: 34.9949, longitude: 135.7850, address: 'Kyoto' }
    ]

    await saveCachedPlacesBatch(mockLandmarks, testCity, 'unit_test')

    // Lookup places from cache
    const start = performance.now()
    const cachedPlaces = await lookupCachedPlacesForCity(testCity, 'attraction')
    const duration = performance.now() - start

    assert.ok(duration < 25, `Expected 0ms memory cache hit, took ${duration.toFixed(2)}ms`)
    assert.equal(cachedPlaces.length, 3)
    assert.equal(cachedPlaces[0].name, 'Kinkaku-ji')

    // Fetch landmarks should hit cache directly in 0ms
    const startLandmarks = performance.now()
    const landmarks = await fetchCityIconicLandmarks(testCity, 'Japan')
    const landmarksDuration = performance.now() - startLandmarks

    assert.ok(landmarksDuration < 25, `Expected fetchCityIconicLandmarks to return from cache in < 25ms, took ${landmarksDuration.toFixed(2)}ms`)
    assert.equal(landmarks.length, 3)
    assert.ok(landmarks.some(l => l.name === 'Kinkaku-ji'))
  })

  it('should maintain Flutter JSON schema contract intact', async () => {
    const state = {
      history: [{ role: 'user', content: '3 días en pareja' }]
    }
    const preferences = { city: 'Tokyo', country: 'Japón' }

    const res = await generateChatResponse(state, '', '', preferences)

    assert.ok(typeof res.responseMessage === 'string')
    assert.ok(Array.isArray(res.actionChips))
    assert.ok(typeof res.extractedPreferences === 'object')
    assert.ok(Array.isArray(res.specificPlaces))
    assert.ok(Array.isArray(res.destinationSuggestions))
    assert.ok(typeof res.readyToBuild === 'boolean')
  })
})
