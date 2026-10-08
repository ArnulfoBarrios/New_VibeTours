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

test('11. generateChatResponse on 1-day tour expands stops when user requests "Agregar más lugares"', async () => {
  const initialItinerary = `Itinerario de Viaje: Santa Marta (1 día)

Día 1: Santa Marta
• Parque de Los Novios
• Catedral Basílica de Santa Marta
• Restaurante Donde Chucho
• Quinta de San Pedro Alejandrino
• Sendero Peatonal El Ziruma

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

  const state = {
    history: [
      { role: 'user', content: 'vamos en carro y presupuesto de lujo a Santa Marta' },
      { role: 'assistant', content: initialItinerary },
      { role: 'user', content: 'Agregar más lugares' }
    ]
  }

  const res = await generateChatResponse(state, '', '', {
    city: 'Santa Marta',
    destination: 'Santa Marta',
    durationDays: 1,
    companions: 'Con amigos',
    transport: 'Carro',
    budget: 'Lujo'
  })

  assert.equal(res.readyToBuild, false)
  // Must contain an expanded itinerary with at least 6 stops
  const bullets = (res.responseMessage.match(/[•\-\*]\s+[^\n]+/g) || [])
  assert.ok(bullets.length >= 6, `Expected at least 6 stops in expanded 1-day tour, got ${bullets.length}: ${res.responseMessage}`)
  // Must not contain "Monumento Nacional"
  assert.ok(!res.responseMessage.toLowerCase().includes('monumento nacional'), 'Must not include generic Monumento Nacional')
  assert.ok(Array.isArray(res.specificPlaces) && res.specificPlaces.length >= 6, 'specificPlaces must be updated to at least 6 stops')
})

test('12. isGenericFacilityName rejects orphan "Monumento Nacional" and generic labels', async () => {
  const { isGenericFacilityName } = await import('../services/osm.js')
  assert.equal(isGenericFacilityName('Monumento Nacional'), true)
  assert.equal(isGenericFacilityName('Patrimonio Cultural'), true)
  assert.equal(isGenericFacilityName('Centro Histórico'), true)
  assert.equal(isGenericFacilityName('Parque Nacional'), true)
  assert.equal(isGenericFacilityName('Quinta de San Pedro Alejandrino'), false)
  assert.equal(isGenericFacilityName('Catedral Basílica de Santa Marta'), false)
})

test('13. clusterStopsIntoCoherentDays on 1-day tour does not mix distant peripheral Tayrona into urban cluster', async () => {
  const { clusterStopsIntoCoherentDays } = await import('../services/open-tourism-service.js')
  const attractions = [
    { name: 'Parque de Los Novios', latitude: 11.2435, longitude: -74.2115 },
    { name: 'Catedral Basílica de Santa Marta', latitude: 11.2443, longitude: -74.2104 },
    { name: 'Quinta de San Pedro Alejandrino', latitude: 11.2330, longitude: -74.1802 },
    { name: 'Camellón Rodrigo de Bastidas', latitude: 11.2450, longitude: -74.2140 },
    { name: 'Parque Nacional Natural Tayrona', latitude: 11.3120, longitude: -73.9310 }
  ]
  const restaurants = [
    { name: 'Restaurante Donde Chucho', latitude: 11.2430, longitude: -74.2110 }
  ]
  const clustered = clusterStopsIntoCoherentDays(attractions, restaurants, {
    numDays: 1,
    city: 'Santa Marta',
    allowExpandedDay: true
  })
  assert.equal(clustered.length, 1)
  const stopNames = clustered[0].stops.map(s => s.name)
  assert.ok(!stopNames.some(n => /Tayrona/i.test(n)), 'Tayrona must not be included in a 1-day urban tour')
  assert.ok(stopNames.length >= 5, 'Must keep available compatible urban stops')
})


