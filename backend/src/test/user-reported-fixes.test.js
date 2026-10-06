import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractRequestedSpecificPlaces,
  generateChatResponse,
  tripOpenAiCircuitBreaker,
  resetOpenAiCircuitBreaker,
  tripGeminiCircuitBreaker,
  resetGeminiCircuitBreaker
} from '../services/openai.js'
import { resolvePlaceWithCascade } from '../services/places-resolver.js'

describe('Verification of User-Reported Fixes', () => {
  it('1. Extracts "el malecón del río" even with conversational fillers and modal phrasing', () => {
    const prompt = 'Quisiera ver, por ejemplo, el malecón del río, me dicen que es bastante bonito'
    const extracted = extractRequestedSpecificPlaces(prompt)
    assert.ok(extracted.length >= 1, 'Should extract at least 1 place')
    const hasMalecon = extracted.some(p => p.name.toLowerCase().includes('malecón') || p.name.toLowerCase().includes('malecon'))
    assert.ok(hasMalecon, 'Must extract El Malecón del Río')
  })

  it('2. Extracts replacement places when changing stops', () => {
    const prompt = 'Cambiar por Zoológico de Barranquilla'
    const extracted = extractRequestedSpecificPlaces(prompt)
    assert.ok(extracted.length >= 1, 'Should extract at least 1 place')
    assert.ok(extracted[0].name.toLowerCase().includes('zoológico') || extracted[0].name.toLowerCase().includes('zoologico'))
  })

  it('3. Responds to "Cambiar paradas" with alternatives and does not repeat the identical 5 stops', async () => {
    tripOpenAiCircuitBreaker(60000)
    tripGeminiCircuitBreaker('test', 60000)
    try {
      const state = {
        messages: [
          { role: 'user', content: 'Quiero un tour de 1 día en Barranquilla con amigos en auto rentado, moderado' },
          { role: 'assistant', content: 'Itinerario de 5 paradas...', actionChips: ['🗺️ Generar tour en el mapa', 'Cambiar paradas'] },
          { role: 'user', content: 'Cambiar paradas' }
        ]
      }
      const currentPrefs = {
        destination: 'Barranquilla',
        durationDays: 1,
        durationHours: 8,
        transport: 'Auto rentado',
        budget: 'Moderado',
        companions: 'con amigos'
      }

      const res = await generateChatResponse(state, '', '', currentPrefs)
      assert.ok(res.responseMessage.toLowerCase().includes('alternativas'), 'Should offer alternatives')
      assert.ok(res.actionChips.some(c => c.toLowerCase().includes('cambiar por')), 'Should provide "Cambiar por" action chips')
      assert.ok(!res.responseMessage.includes('1. 🕘 09:00 AM - Mañana'), 'Must not repeat full 5-stop itinerary verbatim')
    } finally {
      resetOpenAiCircuitBreaker()
      resetGeminiCircuitBreaker()
    }
  })

  it('4. Food query on 1-day tour does not return hotel action chips', async () => {
    tripOpenAiCircuitBreaker(60000)
    tripGeminiCircuitBreaker('test', 60000)
    try {
      const state = {
        messages: [
          { role: 'user', content: 'Quiero un tour de 1 día en Barranquilla' },
          { role: 'assistant', content: 'Aquí tienes...' },
          { role: 'user', content: 'Ver opciones de comida' }
        ]
      }
      const currentPrefs = {
        destination: 'Barranquilla',
        durationDays: 1,
        durationHours: 8,
        transport: 'Auto rentado',
        budget: 'Moderado',
        companions: 'con amigos'
      }

      const res = await generateChatResponse(state, '', '', currentPrefs)
      assert.ok(!res.actionChips.some(c => /hotel|hospedaje/i.test(c)), 'Must not suggest hotel chips on 1-day tour')
      assert.ok(res.actionChips.some(c => /generar tour|tour en el mapa/i.test(c)), 'Must keep tour generation action chip')
    } finally {
      resetOpenAiCircuitBreaker()
      resetGeminiCircuitBreaker()
    }
  })

  it('5. Resolves Bocas de Ceniza to Tajamar Occidental and avoids commercial restaurant hijacking', async () => {
    const bocasGeo = await resolvePlaceWithCascade({
      name: 'Bocas de Ceniza',
      city: 'Barranquilla',
      country: 'Colombia'
    })
    assert.ok(bocasGeo, 'Must resolve Bocas de Ceniza')
    assert.equal(bocasGeo.latitude, 11.1065, 'Latitude must be 11.1065 (Tajamar Occidental)')
    assert.equal(bocasGeo.longitude, -74.8547, 'Longitude must be -74.8547 (Tajamar Occidental)')
    assert.ok(!bocasGeo.name.toLowerCase().includes('restaurante'), 'Must not be a restaurant')
  })
})
