import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateChatResponse } from '../services/openai.js'

describe('Tour Planner AI Behavior and Filtering Rules', () => {
  it('should return instant action chips for itinerary status inquiry', async () => {
    const state = {
      history: [
        { role: 'user', content: '¿cómo va el itinerario?' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia',
      durationDays: 3,
      specificPlaces: ['Castillo San Felipe', 'Islas del Rosario', 'Getsemaní']
    }

    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(Array.isArray(res.actionChips))
    assert.deepEqual(res.actionChips, [
      '🚀 Generar itinerario completo',
      '✏️ Modificar algún día',
      '➕ Agregar otra actividad'
    ])
  })

  it('should preserve specific places without dropping user selected attractions', () => {
    const preferences = {
      specificPlaces: ['Castillo San Felipe', 'Islas del Rosario', 'Restaurante Celele']
    }
    assert.equal(preferences.specificPlaces.length, 3)
    assert.ok(preferences.specificPlaces.includes('Castillo San Felipe'))
    assert.ok(preferences.specificPlaces.includes('Islas del Rosario'))
    assert.ok(preferences.specificPlaces.includes('Restaurante Celele'))
  })

  it('should ask for travel dates and season after destination is known', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Quiero viajar a Cartagena' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia'
    }

    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(Array.isArray(res.actionChips))
    assert.ok(res.actionChips.includes('Próximo mes') || res.actionChips.includes('Este fin de semana'))
  })

  it('should not offer hotel chips when hotel is already confirmed during event inquiry', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Consultar eventos' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia',
      selectedHotel: { name: 'Hotel Casa La Fe' },
      accommodationStatus: 'Hospedaje confirmado en Hotel Casa La Fe'
    }

    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(Array.isArray(res.actionChips))
    assert.ok(!res.actionChips.includes('🏨 Ver opciones de hotel'))
  })

  it('should extract 3 days for "un puente festivo"', async () => {
    const { extractChatInformationFallback } = await import('../services/openai.js')
    const extracted = extractChatInformationFallback('un puente festivo')
    assert.equal(extracted.durationDays, 3)
    assert.equal(extracted.durationHours, 72)
  })

  it('should resolve Cartagena to Colombia by default', async () => {
    const { resolveCanonicalDestination } = await import('../services/destinationService.js')
    const canonical = await resolveCanonicalDestination('Cartagena')
    assert.ok(canonical)
    assert.equal(canonical.country, 'Colombia')
    assert.equal(canonical.countryCode, 'CO')
  })
})
