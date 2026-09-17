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
})

