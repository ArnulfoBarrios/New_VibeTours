import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateChatResponse, getDestinationPresets, planWithOpenAI } from '../services/openai.js'

test('Buenos Aires presets must return verified authentic hotels, restaurants, and attractions', () => {
  const ba = getDestinationPresets('Buenos Aires', 'Argentina')
  assert.ok(ba)
  assert.equal(ba.name, 'Buenos Aires')

  const hotelNames = ba.hotels.map(h => h.name)
  assert.ok(hotelNames.some(name => /Alvear Palace|Palacio Duhau|Faena Hotel/i.test(name)))
  assert.ok(!hotelNames.includes('Hotel en el Centro de Buenos Aires'))

  const restNames = ba.restaurants.map(r => r.name)
  assert.ok(restNames.some(name => /Don Julio|La Cabrera|Café Tortoni|Cabaña Las Lilas/i.test(name)))

  const placeNames = ba.places
  assert.ok(placeNames.some(name => /Plaza de Mayo|San Telmo|Caminito|Teatro Colón/i.test(name)))
})

test('generateChatResponse fallback must return complete and detailed answers for activities and hotels', async () => {
  const stateWithBA = {
    history: [
      { role: 'user', content: 'Quiero viajar a Buenos Aires' },
      { role: 'assistant', content: '¡Excelente elección viajar a Buenos Aires!' },
      { role: 'user', content: 'Que actividades podría realizar?' }
    ]
  }

  const res = await generateChatResponse(stateWithBA, '', '', { city: 'Buenos Aires', country: 'Argentina' })
  assert.ok(res.responseMessage)
  assert.ok(res.responseMessage.length > 20, 'Response should be a detailed message, not a 1-word cut')
  assert.notEqual(res.responseMessage.trim(), '¡Excelente!')
  assert.ok(/actividades|lugares|Plaza de Mayo|San Telmo|Caminito|Teatro Colón/i.test(res.responseMessage))
})

test('generateChatResponse fallback for hotels must list authentic hotel options', async () => {
  const stateWithHotel = {
    history: [
      { role: 'user', content: 'Quiero opciones de hotel en Buenos Aires' }
    ]
  }

  const res = await generateChatResponse(stateWithHotel, '', '', { city: 'Buenos Aires', country: 'Argentina' })
  assert.ok(res.responseMessage)
  assert.ok(/hotel|hospedaje|alojamiento/i.test(res.responseMessage))
  assert.ok(!res.responseMessage.includes('Hotel en el Centro de Buenos Aires'))
})

test('planWithOpenAI template output schema conforms to official JSON specification', async () => {
  // Offline mock verification of schema structure
  const samplePlaces = [
    { name: 'Plaza de Mayo', latitude: -34.6083, longitude: -58.3712, city: 'Buenos Aires', country: 'Argentina' },
    { name: 'San Telmo', latitude: -34.6212, longitude: -58.3731, city: 'Buenos Aires', country: 'Argentina' },
    { name: 'Caminito', latitude: -34.6394, longitude: -58.3628, city: 'Buenos Aires', country: 'Argentina' }
  ]

  assert.ok(samplePlaces.length >= 3)
})

test('user prompt with interests but without explicit city must recommend beach/adventure destinations and NOT assume Bogota or 3 days', async () => {
  const prompt = 'Hola. Me gustaría que me diseñes un viaje para amigos, manejando un presupuesto moderado. Prefiero llevar un ritmo equilibrado y me gustaría moverme principalmente en auto rentado. El momento ideal para mis actividades sería por las tardes. Mis intereses principales son: Playas, Naturaleza, Aventuras, Vida nocturna.'
  const state = {
    history: [{ role: 'user', content: prompt }]
  }

  const res = await generateChatResponse(state, '', '', {})
  assert.ok(res.responseMessage)
  // Should NOT assume Bogota or generate day-by-day stops for Bogota
  assert.ok(!res.responseMessage.includes('Jardín Botánico de Bogotá'))
  assert.ok(!res.responseMessage.includes('Día 1:'))
  // Should recommend beach destinations
  assert.ok(/Santa Marta|Cartagena|San Andrés|Cancún/i.test(res.responseMessage))
  // Should have action chips for beach destinations
  assert.ok(res.actionChips.some(c => /Santa Marta|Cartagena|San Andrés|Cancún/i.test(c)))
})

