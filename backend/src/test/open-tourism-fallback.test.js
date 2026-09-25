import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isOpenAiCircuitOpen,
  tripOpenAiCircuitBreaker,
  resetOpenAiCircuitBreaker,
  getActiveOpenAiKey,
  fetchOpenAiChatCompletion
} from '../services/openai.js'
import {
  composeDeterministicTourGuideScript,
  buildDeterministicStopDetails
} from '../services/open-tourism-service.js'
import { buildTourPlanner, buildFallbackTour } from '../routes/ai.js'
import { generateSpeechAudio, resetOpenAiTtsCircuitBreaker } from '../services/ttsService.js'

test('should trip the circuit breaker and disable getActiveOpenAiKey when OpenAI returns 429 insufficient_quota', async () => {
  const originalKey = process.env.OPENAI_API_KEY
  const originalFetch = global.fetch

  try {
    process.env.OPENAI_API_KEY = 'sk-test-exhausted-key'
    resetOpenAiCircuitBreaker()
    assert.equal(isOpenAiCircuitOpen(), false)
    assert.equal(getActiveOpenAiKey(), 'sk-test-exhausted-key')

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'You exceeded your current quota, please check your plan and billing details.',
            type: 'insufficient_quota',
            code: 'insufficient_quota'
          }
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )

    const res = await fetchOpenAiChatCompletion({ method: 'POST' })
    assert.equal(res.status, 429)
    assert.equal(isOpenAiCircuitOpen(), true)
    assert.equal(getActiveOpenAiKey(), '')
  } finally {
    resetOpenAiCircuitBreaker()
    process.env.OPENAI_API_KEY = originalKey
    global.fetch = originalFetch
  }
})

test('should compose a rich first-person tour guide script from OpenStreetMap and Wikipedia data when OpenAI is unavailable', () => {
  const samplePlace = {
    name: 'Castillo de San Felipe de Barajas',
    category: 'historic',
    city: 'Cartagena',
    shortDescription: 'fortaleza militar colonial española del siglo XVII',
    history:
      'El Castillo de San Felipe de Barajas es una fortificación localizada en la ciudad de Cartagena de Indias en Colombia. Fue construido en 1657 sobre el cerro de San Lázaro para defender la ciudad de ataques piratas.',
    rawTags: {
      wikidata: 'Q575663',
      start_date: '1657',
      architect: 'Antonio de Arévalo',
      opening_hours: 'Mo-Su 08:00-18:00',
      heritage: '1'
    }
  }

  const script = composeDeterministicTourGuideScript(samplePlace, {
    city: 'Cartagena',
    stopIndex: 0
  })
  const details = buildDeterministicStopDetails(samplePlace, {
    city: 'Cartagena',
    stopIndex: 0
  })

  assert.ok(script.includes('Castillo de San Felipe de Barajas'))
  assert.ok(script.includes('1657'))
  assert.ok(script.includes('Antonio de Arévalo'))
  assert.ok(script.split(/\s+/).length >= 45)
  assert.ok(details.curiousFacts.length >= 1)
  assert.ok(details.tips.some((t) => t.includes('08:00-18:00')))
})

test('should build a complete tour with enriched stops and coordinates when buildFallbackTour is invoked without OpenAI', async () => {
  const originalFetch = global.fetch
  try {
    global.fetch = async (url) => {
      const urlStr = String(url)
      if (urlStr.includes('wikipedia.org') || urlStr.includes('wikivoyage.org')) {
        return new Response(
          JSON.stringify({
            title: 'Cartagena de Indias',
            description: 'Ciudad histórica amurallada en el Caribe colombiano',
            extract:
              'Cartagena de Indias es un distrito turístico y cultural fundado en 1533, famoso por sus murallas coloniales y arquitectura patrimonial.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('{}', { status: 200 })
    }

    const input = {
      destination: 'Cartagena',
      city: 'Cartagena',
      country: 'Colombia',
      durationHours: 24,
      type: 'cultural',
      language: 'es',
      touristInterests: ['Historia', 'Arquitectura']
    }
    const places = [
      {
        id: 'osm:node:101',
        candidateId: 'osm:node:101',
        name: 'Torre del Reloj',
        category: 'historic',
        latitude: 10.4236,
        longitude: -75.5494,
        address: 'Plaza de los Coches, Cartagena',
        city: 'Cartagena',
        country: 'Colombia',
        rawTags: { start_date: '1888', opening_hours: '24/7' }
      },
      {
        id: 'osm:node:102',
        candidateId: 'osm:node:102',
        name: 'Museo del Oro Zenú',
        category: 'museum',
        latitude: 10.4229,
        longitude: -75.5512,
        address: 'Parque Bolívar, Cartagena',
        city: 'Cartagena',
        country: 'Colombia',
        rawTags: { fee: 'no' }
      }
    ]

    const planner = buildTourPlanner(input, { latitude: 10.4236, longitude: -75.5494 }, places)
    const fallbackTour = await buildFallbackTour(planner, input)

    assert.ok(fallbackTour)
    assert.ok(Array.isArray(fallbackTour.itinerario))
    assert.equal(fallbackTour.itinerario.length, 2)
    assert.equal(fallbackTour.itinerario[0].ubicacion.latitud, 10.4236)
    assert.equal(fallbackTour.itinerario[0].ubicacion.longitud, -75.5494)
    assert.ok(fallbackTour.itinerario[0].descripcion.includes('Torre del Reloj'))
    assert.ok(fallbackTour.historia_del_lugar.includes('1533'))
  } finally {
    global.fetch = originalFetch
  }
})

test('should synthesize an MP3 audio buffer using free neural TTS when OpenAI TTS quota is exhausted', async () => {
  resetOpenAiTtsCircuitBreaker()
  const audioBuffer = await generateSpeechAudio({
    text: '¡Bienvenido a Cartagena de Indias! Estamos frente a la emblemática Torre del Reloj.',
    voice: 'nova',
    speed: 1.06,
    provider: 'free'
  })

  assert.ok(Buffer.isBuffer(audioBuffer))
  assert.ok(audioBuffer.length > 500, `Expected non-empty MP3 buffer, got ${audioBuffer.length} bytes`)
})
