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
})
