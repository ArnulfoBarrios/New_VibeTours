import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { extractChatInformation } from '../services/openai.js'
import { aiRouter } from '../routes/ai.js'

describe('Chat and Stop Alternatives Performance Tests', () => {
  it('should resolve confirmation messages via fast-path in under 50ms without OpenAI network calls', async () => {
    const confirmationPhrases = [
      'sí',
      'perfecto, genera el tour',
      'adelante con el tour',
      'listo',
      'dale',
      'vamos a generar el tour'
    ]

    for (const phrase of confirmationPhrases) {
      const startTime = performance.now()
      const result = await extractChatInformation(phrase, { city: 'Coveñas' }, [])
      const durationMs = performance.now() - startTime

      assert.ok(durationMs < 50, `Expected resolution in < 50ms, took ${durationMs.toFixed(2)}ms for "${phrase}"`)
      assert.ok(result !== null && typeof result === 'object', 'Result must be a valid object')
    }
  })

  it('should resolve local lodging shortcuts via fast-path in under 50ms', async () => {
    const lodgingPhrases = [
      'en mi casa',
      'alojamiento propio',
      'ya tengo hotel',
      'hotel económico',
      'hostal'
    ]

    for (const phrase of lodgingPhrases) {
      const startTime = performance.now()
      const result = await extractChatInformation(phrase, { city: 'Cartagena' }, [])
      const durationMs = performance.now() - startTime

      assert.ok(durationMs < 50, `Expected fast-path under 50ms, took ${durationMs.toFixed(2)}ms for "${phrase}"`)
      assert.ok(result !== null && typeof result === 'object', 'Result must be an object')
    }
  })

  it('should resolve stop addition requests via fast-path in under 50ms', async () => {
    const controlPhrases = [
      'agrega más paradas',
      'añade más paradas',
      'más lugares',
      'opción 1'
    ]

    for (const phrase of controlPhrases) {
      const startTime = performance.now()
      const result = await extractChatInformation(phrase, { city: 'Santa Marta' }, [])
      const durationMs = performance.now() - startTime

      assert.ok(durationMs < 50, `Expected fast-path under 50ms, took ${durationMs.toFixed(2)}ms for "${phrase}"`)
      assert.ok(result !== null && typeof result === 'object', 'Result must be an object')
    }
  })

  it('should return alternatives rapidly and leverage memory cache on subsequent calls', async () => {
    const app = express()
    app.use(express.json())
    app.use('/api/ai', aiRouter)

    const server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s))
    })
    const { port } = server.address()
    const url = `http://127.0.0.1:${port}/api/ai/tours/alternatives`

    try {
      const payload = {
        request: {
          city: 'Coveñas',
          destination: 'Coveñas',
          country: 'Colombia',
          type: 'cultural'
        },
        currentPlaces: [
          { name: 'Playa Primera Coveñas', latitude: 9.4069, longitude: -75.6983 }
        ],
        excludeIds: []
      }

      // First call (populates cache or performs parallel resolution)
      const res1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      assert.equal(res1.status, 200, 'HTTP status should be 200')
      const data1 = await res1.json()
      assert.ok(Array.isArray(data1.alternatives), 'Alternatives should be an array')

      // Second call (hits memory cache)
      const cacheStartTime = performance.now()
      const res2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const cacheDurationMs = performance.now() - cacheStartTime

      assert.equal(res2.status, 200, 'HTTP status should be 200')
      const data2 = await res2.json()
      assert.ok(Array.isArray(data2.alternatives), 'Cached alternatives should be an array')

      // Cached response should be served well under 100ms
      assert.ok(
        cacheDurationMs < 100,
        `Cached response should return in < 100ms, took ${cacheDurationMs.toFixed(2)}ms`
      )

      // Verified stops should not include duplicate current places
      for (const alt of data2.alternatives) {
        assert.notEqual(
          alt.name.toLowerCase().trim(),
          'playa primera coveñas',
          'Alternatives must not duplicate existing places'
        )
      }
    } finally {
      await new Promise(resolve => server.close(resolve))
    }
  })
})
