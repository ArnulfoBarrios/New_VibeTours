import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractChatInformationFallback,
  extractRequestedSpecificPlaces,
  generateChatResponse
} from '../services/openai.js'
import { isValidSpecificPlace } from '../routes/ai.js'
import { inferTourType, evaluateTourRequirements } from '../services/destinationService.js'

test('1. extractChatInformationFallback rejects superlative and generic noun phrases as stops', () => {
  const ext = extractChatInformationFallback(
    'Quiero hacer un tour a Barranquilla de un día con mis amigos, quiero conocer los lugares más bonitos'
  )
  assert.equal(ext.city, 'Barranquilla')
  assert.equal(ext.durationDays, 1)
  assert.match(ext.companions, /amigos|grupo/i)
  assert.ok(
    !ext.specificPlaces || ext.specificPlaces.length === 0,
    'Debe rechazar "los lugares más bonitos" como parada específica'
  )
  assert.equal(isValidSpecificPlace('Lugares más bonitos'), false)
  assert.equal(isValidSpecificPlace('Los mejores lugares'), false)
})

test('2. generateChatResponse asks for transport and budget when missing on 1-day tour', async () => {
  const state = {
    history: [{ role: 'user', content: 'Quiero hacer un tour a Barranquilla de un día con mis amigos' }]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo'
  })

  assert.equal(res.readyToBuild, false)
  assert.match(res.responseMessage, /transporte/i)
  assert.match(res.responseMessage, /presupuesto/i)
  assert.doesNotMatch(res.responseMessage, /hotel|alojamiento/i)
  assert.ok(res.actionChips.some(c => /auto|taxi/i.test(c)))
  assert.ok(res.actionChips.some(c => /económico|moderado/i.test(c)))
})

test('3. generateChatResponse creates 5 stops with midday lunch and proper grammar for 1-day tour', async () => {
  const state = {
    history: [{ role: 'user', content: 'vamos en auto rentado y presupuesto moderado' }]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo',
    transport: 'Auto rentado',
    budget: 'Moderado'
  })

  assert.equal(res.readyToBuild, false)
  // Must not have grammatical flaw "con en grupo"
  assert.doesNotMatch(res.responseMessage, /con\s+en\s+grupo/i)
  // Must preserve all 5 stops without deleting them in sanitizer
  const bullets = (res.responseMessage.match(/[•\-\*]\s+[^\n]+/g) || [])
  assert.ok(bullets.length >= 4, `Expected at least 4-5 stops in 1-day itinerary, got ${bullets.length}`)
  assert.ok(bullets.some(b => /Cucayo|restaurante/i.test(b)), 'Must include midday lunch stop')
})

test('4. generateChatResponse triggers readyToBuild: true when user confirms build for 1-day tour', async () => {
  const state = {
    history: [
      { role: 'user', content: 'vamos en auto rentado y presupuesto moderado' },
      { role: 'assistant', content: 'He preparado un recorrido de 5 paradas...' },
      { role: 'user', content: 'Si crea el tour porfa' }
    ]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo',
    transport: 'Auto rentado',
    budget: 'Moderado'
  })

  assert.equal(res.readyToBuild, true)
  assert.match(res.responseMessage, /generar tu tour/i)
})

test('5. extractRequestedSpecificPlaces extracts place cleanly even with conversational fillers like "por ejemplo"', () => {
  const prompt = 'Ahora mismo estoy con unos amigos y quiero ir a, por ejemplo, al Malecón, me han dicho que es bastante famoso'
  const extracted = extractRequestedSpecificPlaces(prompt)
  assert.ok(extracted.length >= 1, 'Debe haber extraído al menos 1 lugar')
  assert.equal(extracted[0].name, 'Malecón')

  const fallback = extractChatInformationFallback(prompt)
  assert.ok(fallback.specificPlaces && fallback.specificPlaces.length >= 1)
  assert.equal(fallback.specificPlaces[0].name, 'Malecón')
})

test('6. extractRequestedSpecificPlaces preserves exact order of multi-stop sequence', () => {
  const prompt = 'Primero quiero ir al Malecón, luego a Bocas de Ceniza y después a la Casa del Carnaval'
  const extracted = extractRequestedSpecificPlaces(prompt)
  assert.equal(extracted.length, 3, 'Debe haber extraído exactamente 3 paradas')
  assert.equal(extracted[0].name, 'Malecón')
  assert.equal(extracted[1].name, 'Bocas de Ceniza')
  assert.equal(extracted[2].name, 'Casa del Carnaval')
})

test('7. inferTourType identifies 1-day intra-city tours as express_tour', () => {
  const input = {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    prompt: 'Me encuentro en Barranquilla con unos amigos quiero hacer un tour de un dia para ver los lugares mas importantes de la ciudad'
  }
  const type = inferTourType(input)
  assert.equal(type, 'express_tour')
})

test('8. evaluateTourRequirements allows express / 1-day tours to complete WITHOUT dates and WITHOUT lodging', () => {
  const check = evaluateTourRequirements({
    city: 'Barranquilla',
    tourType: 'express_tour',
    transport: 'Taxi / Uber',
    budget: 'Moderado'
  })
  assert.equal(check.isComplete, true, '1-day tour must complete without dates or lodging')
  assert.equal(check.hasLodging, true)
  assert.equal(check.hasDates, true)
  assert.deepEqual(check.missing, [])
})

test('9. evaluateTourRequirements enforces lodging and dates for single-city multi-day tours', () => {
  const missingLodgingCheck = evaluateTourRequirements({
    city: 'Barranquilla',
    tourType: 'single_city',
    durationDays: 3,
    transport: 'Auto rentado',
    budget: 'Moderado'
  })
  assert.equal(missingLodgingCheck.isComplete, false, 'Multi-day tour must require lodging')
  assert.equal(missingLodgingCheck.hasLodging, false)
  assert.ok(missingLodgingCheck.missing.some(m => /alojamiento|hotel/i.test(m)))

  const completeCheck = evaluateTourRequirements({
    city: 'Barranquilla',
    tourType: 'single_city',
    durationDays: 3,
    transport: 'Auto rentado',
    budget: 'Moderado',
    accommodationStatus: 'casa propia'
  })
  assert.equal(completeCheck.isComplete, true, 'Multi-day tour with casa propia must complete')
})

test('10. evaluateTourRequirements enforces lodging strategy for multi-city / international tours', () => {
  const multiCityMissing = evaluateTourRequirements({
    cities: ['Bogotá', 'Medellín'],
    tourType: 'city_to_city',
    durationDays: 5,
    transport: 'Avión / Bus',
    budget: 'Moderado'
  })
  assert.equal(multiCityMissing.isComplete, false, 'Multi-city without lodging strategy must NOT complete')
  assert.ok(multiCityMissing.missing.some(m => /alojamiento/i.test(m)))

  const multiCityComplete = evaluateTourRequirements({
    cities: ['Bogotá', 'Medellín'],
    tourType: 'city_to_city',
    durationDays: 5,
    transport: 'Avión / Bus',
    budget: 'Moderado',
    accommodationStatus: 'Hoteles reservados en cada ciudad'
  })
  assert.equal(multiCityComplete.isComplete, true, 'Multi-city with confirmed lodging per city must complete')
})


