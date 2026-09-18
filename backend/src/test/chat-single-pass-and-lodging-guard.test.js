import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { generateChatResponse, isLodgingExplicitlyConfirmed } from '../services/openai.js'
import { aiRouter } from '../routes/ai.js'

describe('Chat Single-Pass and Lodging Guardrail Tests', () => {
  it('should suppress itinerary generation and demand lodging when lodging is pending', async () => {
    // Simulated state after user provided transport and budget, but NOT hotel
    const state = {
      message: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos',
      history: [
        { role: 'user', content: 'Crea un tour a Barranquilla' },
        { role: 'assistant', content: '¡Excelente! ¿Qué fechas o cuántos días viajarás y con quién?' },
        { role: 'user', content: 'Voy a ir el 10 de octubre y voy a quedarme una semana voy con unos amigos' },
        { role: 'assistant', content: '¡Perfecto! ¿Qué transporte usarán, cuál es su presupuesto y dónde se hospedarán?' },
        { role: 'user', content: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos' }
      ]
    }

    const currentPreferences = {
      city: 'Barranquilla',
      destination: 'Barranquilla',
      country: 'Colombia',
      datesSeason: '10 de octubre',
      durationDays: 7,
      companions: 'Con amigos',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: null,
      accommodationStatus: 'Por definir'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    // 1. Must NOT emit day headers (Día 1, Día 2, etc.)
    assert.equal(/Día\s*1\s*:/i.test(result.responseMessage), false, 'Must NOT contain Day 1 header when lodging is pending')
    assert.equal(/Itinerario de Viaje/i.test(result.responseMessage), false, 'Must NOT contain Itinerary header when lodging is pending')

    // 2. Must ask for hotel or lodging
    assert.ok(/hotel|hospedaje|alojamiento/i.test(result.responseMessage), 'Must ask for hotel or lodging')

    // 3. Must NOT offer "Generar tour" in actionChips
    assert.equal(result.actionChips.some(c => /generar tour/i.test(c)), false, 'Action chips must NOT include "Generar tour"')
    assert.ok(result.actionChips.some(c => /casa propia|familiar|hoteles|hospedaje/i.test(c)), 'Action chips must offer lodging options')

    // 4. readyToBuild must be false
    assert.equal(result.readyToBuild, false, 'readyToBuild must be false')
  })

  it('should reject build order and request missing lodging when user orders tour creation prematurely', async () => {
    const state = {
      message: 'Ok crea el tour',
      history: [
        { role: 'user', content: 'Crea un tour a Barranquilla' },
        { role: 'assistant', content: '¡Excelente! ¿Qué fechas o cuántos días viajarás y con quién?' },
        { role: 'user', content: 'Voy a ir el 10 de octubre y voy a quedarme una semana voy con unos amigos' },
        { role: 'assistant', content: '¡Perfecto! ¿Qué transporte usarán, cuál es su presupuesto y dónde se hospedarán?' },
        { role: 'user', content: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos' },
        { role: 'assistant', content: '¡Perfecto! ¿En qué hotel o alojamiento se hospedarán?' },
        { role: 'user', content: 'Ok crea el tour' }
      ]
    }

    const currentPreferences = {
      city: 'Barranquilla',
      destination: 'Barranquilla',
      country: 'Colombia',
      datesSeason: '10 de octubre',
      durationDays: 7,
      companions: 'Con amigos',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: null,
      accommodationStatus: 'Por definir'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    // 1. readyToBuild MUST be false
    assert.equal(result.readyToBuild, false, 'readyToBuild must be false when lodging is missing')

    // 2. Bot must NOT say "Procedo a generar tu tour"
    assert.equal(/procedo a generar/i.test(result.responseMessage), false, 'Must NOT falsely confirm generating the tour')

    // 3. Bot must explicitly point out that lodging is missing
    assert.ok(/alojamiento|hotel|hospedaje/i.test(result.responseMessage), 'Must inform user that lodging is required')

    // 4. Action chips must offer lodging options, NOT "Generar tour"
    assert.equal(result.actionChips.some(c => /generar tour/i.test(c)), false, 'Must NOT offer "Generar tour" action chip')
  })

  it('should allow tour generation when lodging is confirmed (hotel with name or home)', async () => {
    const state = {
      message: 'Ok crea el tour',
      history: [
        { role: 'user', content: 'Crea un tour a Barranquilla' },
        { role: 'assistant', content: '¡Excelente! ¿Qué fechas o cuántos días viajarás y con quién?' },
        { role: 'user', content: 'Voy a ir el 10 de octubre y voy a quedarme una semana voy con unos amigos' },
        { role: 'assistant', content: '¡Perfecto! ¿Qué transporte usarán, cuál es su presupuesto y dónde se hospedarán?' },
        { role: 'user', content: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos' },
        { role: 'assistant', content: '¡Perfecto! ¿En qué hotel o alojamiento se hospedarán?' },
        { role: 'user', content: 'Nos hospedaremos en el Hotel Dann Carlton' },
        { role: 'assistant', content: '¡Excelente! Aquí tienes el itinerario...' },
        { role: 'user', content: 'Ok crea el tour' }
      ]
    }

    const currentPreferences = {
      city: 'Barranquilla',
      destination: 'Barranquilla',
      country: 'Colombia',
      datesSeason: '10 de octubre',
      durationDays: 7,
      companions: 'Con amigos',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: { name: 'Hotel Dann Carlton' },
      accommodationStatus: 'Hotel elegido',
      specificPlaces: [
        { name: 'Gran Malecón del Río', dia: 1 },
        { name: 'Casa del Carnaval', dia: 2 }
      ]
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    // With confirmed lodging and build order:
    assert.equal(result.readyToBuild, true, 'readyToBuild must be true when all key info and lodging are confirmed')
    assert.ok(/procedo a generar/i.test(result.responseMessage), 'Bot confirms tour generation')
  })

  it('should process /api/ai/chat in single-pass with correct preferences without second LLM extraction', async () => {
    const app = express()
    app.use(express.json())
    app.use('/api/ai', aiRouter)

    const server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s))
    })
    const port = server.address().port

    try {
      const payload = {
        message: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos',
        currentPreferences: {
          city: 'Barranquilla',
          destination: 'Barranquilla',
          datesSeason: '10 de octubre',
          durationDays: 7,
          companions: 'Con amigos',
          accommodationStatus: 'Por definir'
        },
        history: []
      }

      const res = await fetch(`http://localhost:${port}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      assert.equal(res.status, 200, 'Chat endpoint must return HTTP 200')
      const data = await res.json()

      assert.ok(data.responseMessage, 'Must return responseMessage')
      assert.equal(data.readyToBuild, false, 'readyToBuild must be false when lodging is undefined')
      assert.equal(data.preferences.transport, 'Auto rentado', 'Transport must be extracted')
      assert.ok(data.preferences.budget, 'Budget must be extracted')
    } finally {
      await new Promise(resolve => server.close(resolve))
    }
  })

  it('should never place hotel names as daily attraction stops in the reconstructed itinerary', async () => {
    const state = {
      message: 'Nos hospedaremos en el Hotel Dann Carlton',
      history: [
        { role: 'user', content: 'Crea un tour a Barranquilla' },
        { role: 'assistant', content: '¡Excelente! ¿Qué fechas o cuántos días viajarás y con quién?' },
        { role: 'user', content: 'Voy a ir el 10 de octubre y voy a quedarme una semana voy con unos amigos' },
        { role: 'assistant', content: '¡Perfecto! ¿Qué transporte usarán, cuál es su presupuesto y dónde se hospedarán?' },
        { role: 'user', content: 'Nos vamos a mover en carro y tenemos un presupuesto de 7 millones de pesos' },
        { role: 'assistant', content: '¡Perfecto! ¿En qué hotel o alojamiento se hospedarán?' },
        { role: 'user', content: 'Nos hospedaremos en el Hotel Dann Carlton' }
      ]
    }

    const currentPreferences = {
      city: 'Barranquilla',
      destination: 'Barranquilla',
      country: 'Colombia',
      datesSeason: '10 de octubre',
      durationDays: 7,
      companions: 'Con amigos',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: { name: 'Hotel Dann Carlton' },
      accommodationStatus: 'Hotel elegido'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    // Verify that hotels like Crowne Plaza, Dann Carlton, etc. are NOT placed as attraction stops in specificPlaces
    const specificNames = (result.extractedPreferences?.specificPlaces || [])
      .map(p => (typeof p === 'string' ? p : p.name).toLowerCase())

    const forbiddenHotels = ['crowne plaza', 'hotel dann carlton', 'dann carlton', 'hotel', 'hostal', 'resort']
    for (const h of forbiddenHotels) {
      assert.equal(
        specificNames.some(name => name.includes(h) && !name.includes('plaza de la paz')),
        false,
        `Attractions must NOT include hotel "${h}"`
      )
    }
  })

  it('should handle hotel declaration and inquiry without dropping hotel or truncating itinerary', async () => {
    // 1. isLodgingExplicitlyConfirmed accepts hotel name even when status enum is null/undefined
    assert.equal(isLodgingExplicitlyConfirmed('Hotel Palma Linda', null), true)
    assert.equal(isLodgingExplicitlyConfirmed('Hotel Palma Linda', undefined), true)
    assert.equal(isLodgingExplicitlyConfirmed({ name: 'Hotel Linda Palma' }, null), true)
    assert.equal(isLodgingExplicitlyConfirmed('Hotel Palma Linda', 'Por definir'), false)

    // 2. Chat with hotel declared and budget provided should output full itinerary and NOT re-ask for lodging
    const state = {
      message: 'Tenemos un presupuesto moderado',
      history: [
        { role: 'user', content: 'Crea un tour a Coveñas por 4 días con amigos' },
        { role: 'assistant', content: '¡Excelente! ¿Qué transporte usarán, cuál es su presupuesto y dónde se hospedarán?' },
        { role: 'user', content: 'Nos vamos a mover en carro y nos vamos a quedar en el Hotel Linda Palma' },
        { role: 'assistant', content: '¡Perfecto! Registré transporte en carro y el Hotel Palma Linda como alojamiento. ¿Cuál es su presupuesto aproximado?' },
        { role: 'user', content: 'Tenemos un presupuesto moderado' }
      ]
    }

    const currentPreferences = {
      city: 'Coveñas',
      destination: 'Coveñas',
      country: 'Colombia',
      durationDays: 4,
      companions: 'En grupo',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: 'Hotel Palma Linda',
      accommodationStatus: 'Hotel elegido'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    // Must have Day 1 headers
    assert.ok(/Día\s*1\s*:/i.test(result.responseMessage), 'Itinerary must include Day 1')
    // Must NOT ask for hotel again
    assert.equal(
      /¿En qué hotel o alojamiento se hospedarán/i.test(result.responseMessage),
      false,
      'Must NOT ask for hotel when hotel is already confirmed'
    )
    // Must NOT truncate with trailing colon
    assert.equal(/:\s*$/.test(result.responseMessage.trim()), false, 'Must not end in dangling colon')

    // 3. Asking "Dónde está el itinerario?" must deliver the full itinerary without asking for hotel
    const inquiryState = {
      message: 'Dónde está el itinerario?',
      history: [
        ...state.history,
        { role: 'assistant', content: result.responseMessage },
        { role: 'user', content: 'Dónde está el itinerario?' }
      ]
    }

    const inquiryResult = await generateChatResponse(inquiryState, '', '', currentPreferences)
    assert.ok(/Día\s*1\s*:/i.test(inquiryResult.responseMessage), 'Itinerary inquiry must return Day 1')
    assert.equal(
      /¿En qué hotel o alojamiento se hospedarán/i.test(inquiryResult.responseMessage),
      false,
      'Must NOT ask for hotel when user asks where the itinerary is'
    )
  })

  it('should never produce duplicate stops in the same day and strictly separate attractions and restaurants in chat itinerary for multi-day tours (e.g. Coveñas 7 days)', async () => {
    const state = {
      message: 'Muéstrame el itinerario para Coveñas',
      history: [
        { role: 'user', content: 'Quiero viajar a Coveñas por 7 días con amigos' },
        { role: 'assistant', content: '¡Excelente! ¿Dónde se hospedarán?' },
        { role: 'user', content: 'Nos quedaremos en Hotel Palma Linda, nos moveremos en carro particular y presupuesto moderado' },
        { role: 'assistant', content: 'Hospedaje confirmado en Hotel Palma Linda.' },
        { role: 'user', content: 'Muéstrame el itinerario para Coveñas' }
      ]
    }

    const currentPreferences = {
      city: 'Coveñas',
      destination: 'Coveñas',
      country: 'Colombia',
      datesSeason: 'octubre',
      durationDays: 7,
      companions: 'En grupo',
      transport: 'Auto rentado',
      budget: 'Moderado',
      selectedHotel: 'Hotel Palma Linda',
      accommodationStatus: 'Hotel elegido'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)
    assert.ok(result.responseMessage.includes('Día 1: Coveñas'), 'Must include Day 1')

    const daySections = result.responseMessage.split(/Día\s+\d+\s*:\s*[^\n]+/)
    assert.ok(daySections.length >= 7, 'Must have at least 7 day blocks')

    for (let i = 1; i < daySections.length; i++) {
      const dayText = daySections[i].split(/(?:¿Qué te parece|Deseas hacer)/)[0]
      const bullets = dayText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•') || line.startsWith('-'))
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(Boolean)

      const seenToday = new Set()
      for (const bullet of bullets) {
        const lower = bullet.toLowerCase()
        assert.equal(
          seenToday.has(lower),
          false,
          `Day ${i} contains duplicate stop: "${bullet}". Full day stops: ${bullets.join(', ')}`
        )
        seenToday.add(lower)
      }
    }
  })
})

