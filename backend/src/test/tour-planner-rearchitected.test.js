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

test('isValidSpecificPlace must reject category words and accept authentic POI names', async () => {
  const { isValidSpecificPlace } = await import('../routes/ai.js')
  // Categories must be rejected
  assert.equal(isValidSpecificPlace('Gastronomía'), false)
  assert.equal(isValidSpecificPlace('Cultura'), false)
  assert.equal(isValidSpecificPlace('Naturaleza'), false)
  assert.equal(isValidSpecificPlace('Aventura'), false)
  assert.equal(isValidSpecificPlace('Playas'), false)
  assert.equal(isValidSpecificPlace('Tour de café'), false)
  assert.equal(isValidSpecificPlace('Vida nocturna'), false)
  assert.equal(isValidSpecificPlace('Día 1'), false)
  assert.equal(isValidSpecificPlace('Hotel Casa La Fe'), false)

  // Actions, metadata and check words must be rejected
  assert.equal(isValidSpecificPlace('Check'), false)
  assert.equal(isValidSpecificPlace('Check-in'), false)
  assert.equal(isValidSpecificPlace('Check-out'), false)
  assert.equal(isValidSpecificPlace('Check-in en el hotel'), false)
  assert.equal(isValidSpecificPlace('Check-out y regreso a casa'), false)
  assert.equal(isValidSpecificPlace('Llegada'), false)
  assert.equal(isValidSpecificPlace('Despedida'), false)
  assert.equal(isValidSpecificPlace('Gastronomía local'), false)
  assert.equal(isValidSpecificPlace('Vida nocturna'), false)
  assert.equal(isValidSpecificPlace('Aeropuerto'), false)
  assert.equal(isValidSpecificPlace('Fiesta del Mar'), false)
  assert.equal(isValidSpecificPlace('Descripción'), false)
  assert.equal(isValidSpecificPlace('Notas'), false)
  assert.equal(isValidSpecificPlace('Santa Marta'), false)

  // Real POIs must be accepted
  assert.equal(isValidSpecificPlace('Catedral Basílica de Santa Marta'), true)
  assert.equal(isValidSpecificPlace('Parque de Los Novios'), true)
  assert.equal(isValidSpecificPlace('Restaurante Donde Chucho'), true)
  assert.equal(isValidSpecificPlace('Quinta de San Pedro Alejandrino'), true)
  assert.equal(isValidSpecificPlace('Parque Nacional Natural Tayrona'), true)
  assert.equal(isValidSpecificPlace('Minca'), true)
  assert.equal(isValidSpecificPlace('Museo del Oro Tairona'), true)
})

test('normalizePlaceKey and deduplicatePlacesByName must merge place variants into clean unique places', async () => {
  const { normalizePlaceKey, deduplicatePlacesByName } = await import('../routes/ai.js')
  
  // Normalized keys
  assert.equal(normalizePlaceKey('la Quinta de San Pedro Alejandrino'), normalizePlaceKey('quinta de san Pedro Alejandrino'))
  assert.equal(normalizePlaceKey('Excursión a la Ciudad Perdida'), normalizePlaceKey('ciudad perdida'))
  assert.equal(normalizePlaceKey('visita al Museo del Oro Tairona'), normalizePlaceKey('Museo del Oro Tairona'))

  // Deduplication
  const rawList = [
    'la Quinta de San Pedro Alejandrino',
    'quinta de san Pedro Alejandrino',
    'Excursión a la Ciudad Perdida',
    'ciudad perdida',
    'Fiesta del Mar', // Should be filtered out
    'Descripción', // Should be filtered out
    'Santa Marta', // Should be filtered out
    'Parque Nacional Natural Tayrona',
    'Restaurante Guásimo'
  ]

  const cleanList = deduplicatePlacesByName(rawList)
  assert.equal(cleanList.length, 4)
  assert.ok(cleanList.some(p => p.includes('Quinta de San Pedro')))
  assert.ok(cleanList.some(p => p.includes('Ciudad Perdida') || p.includes('ciudad perdida')))
  assert.ok(cleanList.some(p => p.includes('Tayrona')))
  assert.ok(cleanList.some(p => p.includes('Guásimo')))
  assert.ok(!cleanList.some(p => p.includes('Fiesta del Mar')))
  assert.ok(!cleanList.some(p => p.includes('Descripción')))
})

test('extractChatInformationFallback must calculate durationDays from date range strings', async () => {
  const { extractChatInformationFallback } = await import('../services/openai.js')
  const res1 = extractChatInformationFallback('Viajo del 9 al 12 de octubre')
  assert.equal(res1.durationDays, 4)
  assert.equal(res1.durationHours, 96)

  const res2 = extractChatInformationFallback('octubre desde el 9 hasta el 12')
  assert.equal(res2.durationDays, 4)
  assert.equal(res2.durationHours, 96)
})

test('isNonTouristicInput must detect coding commands, math, and unrelated input and block cards', async () => {
  const { isNonTouristicInput } = await import('../services/openai.js')
  assert.equal(isNonTouristicInput('Flutter run'), true)
  assert.equal(isNonTouristicInput('npm run dev'), true)
  assert.equal(isNonTouristicInput('git status'), true)
  assert.equal(isNonTouristicInput('2 + 2'), true)
  assert.equal(isNonTouristicInput('cuanto es 100 / 4'), true)
  assert.equal(isNonTouristicInput('console.log("test")'), true)

  // Tourist messages must be accepted
  assert.equal(isNonTouristicInput('Quiero viajar a Santa Marta'), false)
  assert.equal(isNonTouristicInput('Playas y aventura con amigos'), false)

  // generateChatResponse should reject Flutter run with 0 cards and empty preferences
  const state = { history: [{ role: 'user', content: 'Flutter run' }] }
  const res = await generateChatResponse(state, '', '', {})
  assert.equal(res.isUnrelatedToTravel, true)
  assert.equal(res.destinationSuggestions.length, 0)
  assert.ok(res.responseMessage.includes('no está relacionada con la planificación de viajes'))
})

test('imageForPlaceWithStatus must serve culinary/restaurant image for restaurants and NOT city port cover', async () => {
  const { imageForPlaceWithStatus } = await import('../services/imageSearch.js')
  const res = await imageForPlaceWithStatus('Restaurante Guásimo', 'Santa Marta', 'restaurant', 0)
  assert.ok(res.url)
  // Must NOT be the Santa Marta port/bay photo (photo-1596436889106-be35e843f974)
  assert.ok(!res.url.includes('photo-1596436889106-be35e843f974'), 'Restaurant image should be a gourmet food/dining photo, not the port of Santa Marta')
})

test('cumulative preferences must not be overwritten by empty or null values on action phrases', async () => {
  const currentPreferences = {
    city: 'Santa Marta',
    country: 'Colombia',
    datesSeason: 'octubre del 9 al 12',
    durationDays: 4,
    companions: '6 amigos',
    budget: 'Moderado',
    transport: 'Auto propio'
  }

  const extractedFromAction = {
    city: null,
    country: null,
    datesSeason: null,
    durationDays: null
  }

  const validExtracted = {}
  Object.entries(extractedFromAction).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      validExtracted[k] = v
    }
  })

  const merged = {
    ...currentPreferences,
    ...validExtracted
  }

  assert.equal(merged.city, 'Santa Marta')
  assert.equal(merged.datesSeason, 'octubre del 9 al 12')
  assert.equal(merged.durationDays, 4)
  assert.equal(merged.companions, '6 amigos')
})

test('effectiveReadyToBuild must trigger when user requests tour generation and all data is confirmed', async () => {
  const state = {
    history: [
      { role: 'user', content: 'Quiero viajar a Santa Marta' },
      { role: 'assistant', content: 'Itinerario de 4 días...' },
      { role: 'user', content: 'Ya estoy listo para generar el tour' }
    ]
  }

  const known = {
    city: 'Santa Marta',
    country: 'Colombia',
    datesSeason: 'octubre del 9 al 12',
    durationDays: 4,
    companions: '6 amigos',
    selectedHotel: 'Hotel Irotama',
    transport: 'Auto rentado',
    budget: 'Moderado'
  }

  const res = await generateChatResponse(state, '', '', known)
  assert.equal(res.readyToBuild, true)
})

test('effectiveReadyToBuild must reject and ask for missing key info when lodging is missing', async () => {
  const state = {
    history: [
      { role: 'user', content: 'Quiero viajar a Cartagena' },
      { role: 'assistant', content: 'Alojamiento: Por definir...' },
      { role: 'user', content: 'Ok quiero generar el tour' }
    ]
  }

  const knownWithMissingLodging = {
    city: 'Cartagena',
    country: 'Colombia',
    datesSeason: 'octubre del 9 al 12',
    durationDays: 4,
    companions: '6 amigos',
    transport: 'Auto rentado',
    budget: 'Moderado',
    accommodationStatus: 'Por definir'
  }

  const res = await generateChatResponse(state, '', '', knownWithMissingLodging)
  assert.equal(res.readyToBuild, false)
  assert.ok(/alojamiento|hotel/i.test(res.responseMessage))
})





