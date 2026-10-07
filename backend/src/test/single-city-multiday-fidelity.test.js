import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isMalformedItinerary, generateChatResponse } from '../services/openai.js'

describe('Multi-Day Single-City Itinerary Quality & Empty-Days Prevention', () => {
  it('1. isMalformedItinerary flags empty day headers in multi-day itineraries', () => {
    const brokenItinerary = `¡Hola! Aquí tienes tu propuesta de itinerario para disfrutar en Santa Marta durante 7 días:

Día 1: Santa Marta
• Rodadero

Día 2: Santa Marta

Día 3: Santa Marta

Día 4: Santa Marta

Día 5: Santa Marta

Día 6: Santa Marta

Día 7: Santa Marta

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

    assert.equal(isMalformedItinerary(brokenItinerary), true, 'Must detect empty day headers as malformed')
  })

  it('2. isMalformedItinerary accepts legitimate multi-day itineraries with full stops', () => {
    const validItinerary = `Itinerario de Viaje: Santa Marta (3 días)

Día 1: Santa Marta
• Playa El Rodadero
• Acuario y Museo del Mar del Rodadero
• Restaurante Donde Chucho

Día 2: Santa Marta
• Quinta de San Pedro Alejandrino
• Museo Bolivariano de Arte Contemporáneo
• Restaurante Ouzo

Día 3: Santa Marta
• Bahía de Taganga
• Mirador de Taganga
• Restaurante Babaganoush

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

    assert.equal(isMalformedItinerary(validItinerary), false, 'Legitimate 3-day itinerary must not be flagged')
  })

  it('3. isMalformedItinerary flags itineraries with insufficient stops relative to day count', () => {
    const lowDensityItinerary = `Itinerario de Viaje: Cartagena (4 días)

Día 1: Cartagena
• Torre del Reloj

Día 2: Cartagena
• Castillo de San Felipe

Día 3: Cartagena

Día 4: Cartagena

¿Qué te parece?`

    assert.equal(isMalformedItinerary(lowDensityItinerary), true, 'Must flag itineraries with empty trailing days')
  })

  it('4. generateChatResponse for multi-day tour with all info in one prompt creates full non-empty days', async () => {
    const userPrompt = 'Quiero viajar a Santa Marta durante 7 dias con mi familia, tenemos un presupuesto de 10000000 de pesos colombianos, nos moveremos en carro, ya tenemos alojamiento alla y quiero ir al rodadero'

    const result = await generateChatResponse({
      message: userPrompt,
      history: [],
      userContext: {}
    })

    assert.ok(result?.responseMessage, 'Must return responseMessage')
    assert.equal(isMalformedItinerary(result.responseMessage), false, 'Generated response must never be malformed')

    // Verify all 7 days exist and each day contains bullet points
    const dayMatches = [...result.responseMessage.matchAll(/(?:^|\n)\s*(?:#{1,4}\s*)?D[íi]a\s*(\d+)[:\s]/gi)]
    assert.ok(dayMatches.length >= 7, `Must contain at least 7 days, received ${dayMatches.length}`)

    for (let i = 0; i < dayMatches.length; i++) {
      const startIdx = dayMatches[i].index + dayMatches[i][0].length
      const endIdx = (i + 1 < dayMatches.length)
        ? dayMatches[i + 1].index
        : result.responseMessage.length
      const daySlice = result.responseMessage.slice(startIdx, endIdx)
      const hasBullet = /[•\-\*]\s+[^\n]+/i.test(daySlice)
      assert.ok(hasBullet, `Day ${i + 1} must have stops with bullets`)
    }

    // Verify specific requested place is in Day 1 or in specificPlaces
    const hasRodadero = /rodadero/i.test(result.responseMessage) ||
      (result.specificPlaces || []).some(p => /rodadero/i.test(typeof p === 'string' ? p : p.name))
    assert.ok(hasRodadero, 'User requested place (Rodadero) must be included')
  })

  it('5. generateChatResponse works universally for other cities (e.g. Medellin 4 days)', async () => {
    const userPrompt = 'Quiero ir a Medellín por 4 días en pareja, contamos con un presupuesto moderado, nos moveremos en taxi y ya tenemos alojamiento confirmado'

    const result = await generateChatResponse({
      message: userPrompt,
      history: [],
      userContext: {}
    })

    assert.ok(result?.responseMessage, 'Must return responseMessage')
    assert.equal(isMalformedItinerary(result.responseMessage), false, 'Medellin tour must never be malformed')

    const dayMatches = [...result.responseMessage.matchAll(/(?:^|\n)\s*(?:#{1,4}\s*)?D[íi]a\s*(\d+)[:\s]/gi)]
    assert.ok(dayMatches.length >= 4, `Must contain at least 4 days, received ${dayMatches.length}`)

    for (let i = 0; i < dayMatches.length; i++) {
      const startIdx = dayMatches[i].index + dayMatches[i][0].length
      const endIdx = (i + 1 < dayMatches.length)
        ? dayMatches[i + 1].index
        : result.responseMessage.length
      const daySlice = result.responseMessage.slice(startIdx, endIdx)
      const hasBullet = /[•\-\*]\s+[^\n]+/i.test(daySlice)
      assert.ok(hasBullet, `Day ${i + 1} must have stops with bullets`)
    }
  })
})

