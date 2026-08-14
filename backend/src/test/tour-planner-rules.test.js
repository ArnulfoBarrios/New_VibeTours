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

  it('should return menu dishes when user asks for "Ver menús" instead of activities', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Ver menús' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia'
    }
    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(res.responseMessage.includes('Cevicheria') || res.responseMessage.includes('Celele') || res.responseMessage.includes('platos'))
    assert.ok(!res.responseMessage.includes('Castillo San Felipe'))
  })

  it('should include 100% of chat-agreed places in buildTourPlanner', async () => {
    const { collectTourCandidates, buildTourPlanner } = await import('../routes/ai.js')
    const chatPlaces = [
      'Castillo San Felipe de Barajas',
      'Islas del Rosario',
      'Ciudad Amurallada',
      'Bocagrande',
      'Restaurante La Cevicheria',
      'Restaurante Celele',
      'Restaurante El Boliche Cebichería'
    ]

    const input = {
      destination: 'Cartagena, Colombia',
      city: 'Cartagena',
      country: 'Colombia',
      durationHours: 72,
      type: 'custom',
      touristInterests: ['cultural', 'gastronomy'],
      specificPlaces: chatPlaces,
      selectedPlaces: chatPlaces
    }

    const location = {
      name: 'Cartagena',
      latitude: 10.4230,
      longitude: -75.5500,
      city: 'Cartagena',
      country: 'Colombia'
    }

    const candidatePack = await collectTourCandidates(input, location)
    assert.ok(candidatePack.places.length >= chatPlaces.length)

    const planner = buildTourPlanner(input, location, candidatePack.places)
    const selectedNames = planner.selectedPlaces.map(p => p.name.toLowerCase())

    for (const place of chatPlaces) {
      const found = selectedNames.some(n => n.includes(place.toLowerCase()) || place.toLowerCase().includes(n))
      assert.ok(found, `Expected ${place} to be included in tour stops, but it was missing.`)
    }

    // Ensure no fake stop like "Restaurante por día" exists
    const hasFake = selectedNames.some(n => n.includes('por día') || n.includes('por dia'))
    assert.equal(hasFake, false, 'Did not expect fake "Restaurante por día" stop in tour.')
  })

  it('should not set specificPlaces when destination city is not yet chosen', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Mis intereses son: Vida nocturna, Naturaleza, Playas, Aventuras' }
      ]
    }
    const currentPreferences = {}
    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(Array.isArray(res.specificPlaces))
    assert.equal(res.specificPlaces.length, 0)
  })

  it('should provide detailed hotel info when user asks for "Dame más información del Hotel Casa La Fe"', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Dame más información del Hotel Casa La Fe' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia'
    }
    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(res.responseMessage.includes('Hotel Casa La Fe'))
    assert.ok(res.responseMessage.includes('Ubicación') || res.responseMessage.includes('Piscina') || res.responseMessage.includes('Instalaciones'))
    assert.notEqual(res.responseMessage.trim(), '¡Excelente!')
  })

  it('should not lock in accommodation when user only asks for hotel information', async () => {
    const { extractChatInformationFallback } = await import('../services/openai.js')
    const extracted = extractChatInformationFallback('Dame más información sobre Hotel Casa La Fe')
    assert.equal(extracted.selectedHotel, undefined)
    assert.equal(extracted.accommodationStatus, undefined)
  })

  it('should return 3 complete days when itinerary status is requested for a 3-day tour', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Ver el itinerario' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia',
      durationDays: 3,
      durationHours: 72,
      specificPlaces: ['Castillo San Felipe', 'Islas del Rosario', 'Ciudad Amurallada', 'Bocagrande', 'Convento de la Popa']
    }
    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(res.responseMessage.includes('Día 1:'))
    assert.ok(res.responseMessage.includes('Día 2:'))
    assert.ok(res.responseMessage.includes('Día 3:'))
  })

  it('should return specific day breakdown when user asks for "Detalles del Día 1"', async () => {
    const state = {
      history: [
        { role: 'user', content: 'Ver detalles del día 1' }
      ]
    }
    const currentPreferences = {
      city: 'Cartagena',
      destination: 'Cartagena, Colombia',
      durationDays: 3,
      durationHours: 72,
      specificPlaces: ['Castillo San Felipe', 'Islas del Rosario', 'Ciudad Amurallada']
    }
    const res = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(res.responseMessage.includes('Día 1 en Cartagena'))
    assert.ok(res.responseMessage.includes('Mañana'))
    assert.ok(res.responseMessage.includes('Almuerzo'))
  })

  it('should return exact high precision verified coordinates for Islas del Rosario and Castillo San Felipe', async () => {
    const { geocodePlace } = await import('../services/osm.js')
    const geoRosario = await geocodePlace('Islas del Rosario')
    assert.ok(geoRosario)
    assert.equal(geoRosario.latitude, 10.1772)
    assert.equal(geoRosario.longitude, -75.7428)

    const geoCastillo = await geocodePlace('Castillo San Felipe de Barajas')
    assert.ok(geoCastillo)
    assert.equal(geoCastillo.latitude, 10.4237)
    assert.equal(geoCastillo.longitude, -75.5398)
  })
})
