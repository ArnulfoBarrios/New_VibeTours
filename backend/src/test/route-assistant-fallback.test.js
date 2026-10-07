import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { aiRouter } from '../routes/ai.js'
import {
  resetOpenAiCircuitBreaker,
  resetGeminiCircuitBreaker,
  tripOpenAiCircuitBreaker
} from '../services/openai.js'

test('Route Assistant Resilience & Fallback Suite', async (t) => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY
  const originalGeminiKey = process.env.GEMINI_API_KEY
  const originalFetch = global.fetch

  const app = express()
  app.use(express.json())
  app.use('/api/ai', aiRouter)

  const server = app.listen(0)
  const port = server.address().port
  const endpoint = `http://127.0.0.1:${port}/api/ai/chat/route-assistant`

  t.after(() => {
    server.close()
    process.env.OPENAI_API_KEY = originalOpenAiKey
    process.env.GEMINI_API_KEY = originalGeminiKey
    global.fetch = originalFetch
    resetOpenAiCircuitBreaker()
    resetGeminiCircuitBreaker()
  })

  await t.test('should return 503 when no LLM key is available', async () => {
    process.env.OPENAI_API_KEY = ''
    process.env.GEMINI_API_KEY = ''
    resetOpenAiCircuitBreaker()
    resetGeminiCircuitBreaker()

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuery: '¿Dónde puedo comer?'
      })
    })

    assert.equal(res.status, 503)
    const json = await res.json()
    assert.equal(json.isRelatedToTravel, false)
    assert.equal(json.responseText, 'El asistente de voz no está disponible en este momento.')
  })

  await t.test('should fallback to Gemini when OpenAI quota is exhausted', async () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-openai-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-active-gemini-key'
    tripOpenAiCircuitBreaker('insufficient_quota')
    resetGeminiCircuitBreaker()

    let geminiCalled = false

    global.fetch = async (url, init) => {
      const urlStr = String(url)
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        geminiCalled = true
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    isRelatedToTravel: true,
                    responseText: '¡De una! Te tengo varias opciones de restaurantes deliciosos cerca.',
                    actionType: 'SEARCH_RESTAURANTS',
                    searchQuery: 'restaurantes'
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // If OpenAI is called directly, simulate 429
      if (urlStr.includes('api.openai.com')) {
        return new Response(
          JSON.stringify({ error: { message: 'Quota exhausted', code: 'insufficient_quota' } }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return originalFetch(url, init)
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuery: 'Quiero comer algo rico',
        latitude: 10.9685,
        longitude: -74.7813,
        tourContext: {
          city: 'Barranquilla',
          country: 'Colombia'
        }
      })
    })

    assert.equal(res.status, 200)
    assert.equal(geminiCalled, true, 'Gemini endpoint should have been called as fallback')

    const data = await res.json()
    assert.equal(data.isRelatedToTravel, true)
    assert.equal(data.actionType, 'SEARCH_RESTAURANTS')
    assert.ok(data.responseText.includes('restaurantes'))
  })
})
