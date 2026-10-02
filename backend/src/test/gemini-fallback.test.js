import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isOpenAiCircuitOpen,
  tripOpenAiCircuitBreaker,
  resetOpenAiCircuitBreaker,
  getActiveOpenAiKey,
  isGeminiCircuitOpen,
  tripGeminiCircuitBreaker,
  resetGeminiCircuitBreaker,
  getActiveGeminiKey,
  getActiveLlmKey,
  getActiveLlmProvider,
  fetchOpenAiChatCompletion,
  fetchGeminiChatCompletion,
  extractChatInformation,
  generateChatResponse
} from '../services/openai.js'

test('Gemini Fallback & Multi-tier LLM Resilience', async (t) => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY
  const originalGeminiKey = process.env.GEMINI_API_KEY
  const originalFetch = global.fetch

  t.afterEach(() => {
    resetOpenAiCircuitBreaker()
    resetGeminiCircuitBreaker()
    process.env.OPENAI_API_KEY = originalOpenAiKey
    process.env.GEMINI_API_KEY = originalGeminiKey
    global.fetch = originalFetch
  })

  await t.test('getActiveLlmProvider should prioritize OpenAI when healthy', () => {
    process.env.OPENAI_API_KEY = 'sk-valid-openai-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-valid-gemini-key'
    resetOpenAiCircuitBreaker()
    resetGeminiCircuitBreaker()

    assert.equal(getActiveLlmProvider(), 'openai')
    assert.equal(getActiveLlmKey(), 'sk-valid-openai-key')
  })

  await t.test('getActiveLlmProvider should seamlessly switch to Gemini when OpenAI circuit is open', () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-openai-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-valid-gemini-key'
    tripOpenAiCircuitBreaker('insufficient_quota')
    resetGeminiCircuitBreaker()

    assert.equal(isOpenAiCircuitOpen(), true)
    assert.equal(getActiveOpenAiKey(), '')
    assert.equal(getActiveGeminiKey(), 'AIzaSy-valid-gemini-key')
    assert.equal(getActiveLlmProvider(), 'gemini')
    assert.equal(getActiveLlmKey(), 'AIzaSy-valid-gemini-key')
  })

  await t.test('getActiveLlmProvider should fall back to deterministic engine when both providers are unavailable', () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-openai-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-exhausted-gemini-key'
    tripOpenAiCircuitBreaker('insufficient_quota')
    tripGeminiCircuitBreaker('insufficient_quota')

    assert.equal(isOpenAiCircuitOpen(), true)
    assert.equal(isGeminiCircuitOpen(), true)
    assert.equal(getActiveOpenAiKey(), '')
    assert.equal(getActiveGeminiKey(), '')
    assert.equal(getActiveLlmProvider(), 'fallback')
    assert.equal(getActiveLlmKey(), '')
  })

  await t.test('fetchOpenAiChatCompletion should route to Gemini endpoint when OpenAI circuit breaker is tripped', async () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-test-gemini-key'
    tripOpenAiCircuitBreaker('insufficient_quota')

    let interceptedUrl = ''
    let interceptedHeaders = {}
    let interceptedBody = {}

    global.fetch = async (url, init) => {
      interceptedUrl = String(url)
      interceptedHeaders = init.headers || {}
      interceptedBody = JSON.parse(init.body || '{}')

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  responseMessage: 'Hola desde Gemini en Santa Marta',
                  specificPlaces: [{ name: 'Minca', dia: 1, category: 'nature' }],
                  actionChips: ['Ver paradas']
                })
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const payload = {
      model: 'gpt-5.6-luna',
      reasoning_effort: 'low',
      messages: [{ role: 'user', content: 'Tour en Minca' }],
      response_format: { type: 'json_object' }
    }

    const res = await fetchOpenAiChatCompletion({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-exhausted-key' },
      body: JSON.stringify(payload)
    })

    assert.equal(res.status, 200)
    assert.ok(interceptedUrl.includes('generativelanguage.googleapis.com'), `Expected Gemini endpoint, got ${interceptedUrl}`)
    assert.equal(interceptedHeaders.Authorization, 'Bearer AIzaSy-test-gemini-key')
    assert.equal(interceptedBody.model, 'gemini-1.5-flash')
    assert.equal(interceptedBody.reasoning_effort, undefined, 'reasoning_effort should be stripped for Gemini')

    const data = await res.json()
    assert.ok(data.choices?.[0]?.message?.content.includes('Hola desde Gemini'))
  })

  await t.test('fetchOpenAiChatCompletion should failover to Gemini on immediate 429 quota exhaustion', async () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-test-gemini-key'
    resetOpenAiCircuitBreaker()
    resetGeminiCircuitBreaker()

    let callCount = 0
    let requestedUrls = []

    global.fetch = async (url, init) => {
      callCount++
      requestedUrls.push(String(url))

      // First call: OpenAI returns 429 quota exhausted
      if (url.includes('api.openai.com')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'You have no credits remaining. Add credits to continue.',
              type: 'insufficient_quota',
              code: 'credit_balance_exhausted'
            }
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Second call: Gemini fallback succeeds
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    destination: 'Santa Marta',
                    specificPlaces: [{ name: 'Pozo Azul', dia: 1 }]
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      throw new Error(`Unexpected URL: ${url}`)
    }

    const res = await fetchOpenAiChatCompletion({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-exhausted-key' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
    })

    assert.equal(res.status, 200)
    assert.equal(callCount, 2)
    assert.ok(requestedUrls[0].includes('api.openai.com'))
    assert.ok(requestedUrls[1].includes('generativelanguage.googleapis.com'))
    assert.equal(isOpenAiCircuitOpen(), true, 'OpenAI circuit breaker should be tripped after 429')
  })

  await t.test('tripGeminiCircuitBreaker should trigger when Gemini returns 429', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSy-exhausted-gemini'
    resetGeminiCircuitBreaker()

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Resource has been exhausted (e.g. check quota).',
            status: 'RESOURCE_EXHAUSTED',
            code: 429
          }
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )

    const res = await fetchGeminiChatCompletion({ method: 'POST' })
    assert.equal(res.status, 429)
    assert.equal(isGeminiCircuitOpen(), true)
    assert.equal(getActiveGeminiKey(), '')
  })

  await t.test('extractChatInformation and generateChatResponse should smoothly execute with Gemini fallback', async () => {
    process.env.OPENAI_API_KEY = 'sk-exhausted-key'
    process.env.GEMINI_API_KEY = 'AIzaSy-active-gemini-key'
    tripOpenAiCircuitBreaker('insufficient_quota')
    resetGeminiCircuitBreaker()

    global.fetch = async (url) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    destination: 'Santa Marta',
                    city: 'Santa Marta',
                    tourType: 'micro_destination',
                    durationDays: 1,
                    durationHours: 24,
                    transport: 'Carro particular',
                    companions: 'con amigos',
                    budget: 'Moderado',
                    accommodationStatus: 'Alojamiento no requerido / Tour de 1 día',
                    specificPlaces: [
                      { name: 'Minca', dia: 1, category: 'nature' },
                      { name: 'Pozo Azul', dia: 1, category: 'nature' }
                    ]
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
    }

    const extracted = await extractChatInformation('Quiero ir a Minca por 1 día con mis amigos en carro', {})
    assert.equal(extracted.destination, 'Santa Marta')
    assert.equal(extracted.durationDays, 1)
    assert.equal(extracted.companions, 'con amigos')
    assert.ok(extracted.specificPlaces.some(p => p.name === 'Minca'))
  })
})
