import test from 'node:test'
import assert from 'node:assert/strict'
import { extractChatInformationFallback, generateChatResponse } from '../services/openai.js'
import { inferTourType, geographicScopeFor } from '../services/destinationService.js'

test('Geographic Topologies & Fallback Chat Intelligence', async (t) => {

  await t.test('should recognize micro_destination and extract all preferences in a single turn', () => {
    const prompt = 'Crea un tour al parque Tayrona que dure un fin de semana, nos vamos a quedar en la playa así que no necesitamos alojamiento voy a ir con mi familia y tenemos un presupuesto de 7 millones de pesos'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.destination, 'Parque Tayrona')
    assert.equal(extracted.city, 'Parque Tayrona')
    assert.equal(extracted.tourType, 'micro_destination')
    assert.equal(extracted.durationDays, 2)
    assert.equal(extracted.companions, 'En familia')
    assert.equal(extracted.budget, 'Moderado')
    assert.equal(extracted.accommodationStatus, 'Alojamiento particular / Camping')
  })

  await t.test('should recognize micro_destination from simple destination statement', () => {
    const prompt = 'Voy a ir al parque Tayrona'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.destination, 'Parque Tayrona')
    assert.equal(extracted.tourType, 'micro_destination')
  })

  await t.test('should recognize city_to_city corridor route', () => {
    const prompt = 'Ruta de Medellín a Guatapé para el próximo fin de semana'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.tourType, 'city_to_city')
    assert.equal(extracted.isMultiCity, true)
    assert.equal(extracted.originPlace, 'Medellín')
    assert.equal(extracted.destinationPlace, 'Guatapé')
    assert.equal(extracted.destination, 'Medellín a Guatapé')
  })

  await t.test('should recognize location_to_destination starting from user position', () => {
    const prompt = 'Quiero un viaje desde donde estoy hasta Villa de Leyva'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.tourType, 'location_to_destination')
    assert.equal(extracted.isUserLocationOrigin, true)
    assert.ok(extracted.destination.toLowerCase().includes('villa de leyva'))
  })

  await t.test('should recognize coastal_islands topology', () => {
    const prompt = 'Tour por Tolú y las Islas de San Bernardo por 3 días'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.tourType, 'coastal_islands')
    assert.ok(extracted.destination.toLowerCase().includes('san bernardo') || extracted.destination.toLowerCase().includes('tolú'))
  })

  await t.test('should recognize single_city urban topology', () => {
    const prompt = 'Quiero un tour en Pereira de 3 días con amigos'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.tourType, 'single_city')
    assert.equal(extracted.destination, 'Pereira')
    assert.equal(extracted.companions, 'Con amigos')
  })

  await t.test('should assign correct geographic scope policies for all 6 topologies', () => {
    const microScope = geographicScopeFor({ destination: 'Parque Tayrona' })
    assert.equal(microScope.tourType, 'micro_destination')
    assert.equal(microScope.maxDistanceKm, 25)

    const islandsScope = geographicScopeFor({ destination: 'Islas del Rosario' })
    assert.equal(islandsScope.tourType, 'coastal_islands')
    assert.equal(islandsScope.maxDistanceKm, 90)

    const cityScope = geographicScopeFor({ destination: 'Medellín', transport: 'caminando' })
    assert.equal(cityScope.tourType, 'single_city')
    assert.equal(cityScope.maxDistanceKm, 10)

    const corridorScope = geographicScopeFor({ isMultiCity: true, originPlace: 'Medellín', destinationPlace: 'Guatapé' })
    assert.equal(corridorScope.tourType, 'city_to_city')
    assert.equal(corridorScope.maxDistanceKm, 120)

    const locationScope = geographicScopeFor({ isUserLocationOrigin: true, destination: 'Villa de Leyva' })
    assert.equal(locationScope.tourType, 'location_to_destination')
    assert.equal(locationScope.maxDistanceKm, 120)

    const multicityScope = geographicScopeFor({ isMultiCountry: true, cities: ['Bogotá', 'París'] })
    assert.equal(multicityScope.tourType, 'international_multicity')
    assert.equal(multicityScope.maxDistanceKm, 250)
  })

  await t.test('should respond coherently in chat without looping or asking for generic cities', async () => {
    const userMsg = 'Crea un tour al parque Tayrona que dure un fin de semana, nos vamos a quedar en la playa así que no necesitamos alojamiento voy a ir con mi familia y tenemos un presupuesto de 7 millones de pesos'
    const chatRes = await generateChatResponse({ history: [{ role: 'user', content: userMsg }] }, '', '', {}, [])

    assert.ok(chatRes.responseMessage.includes('Parque Tayrona'), 'Chat must acknowledge Parque Tayrona')
    assert.ok(chatRes.responseMessage.includes('transporte'), 'Chat must ask for missing transport')
    assert.equal(chatRes.extractedPreferences?.tourType, 'micro_destination')
    assert.equal(chatRes.extractedPreferences?.budget, 'Moderado')
    assert.equal(chatRes.extractedPreferences?.companions, 'En familia')
    assert.ok(chatRes.actionChips.some(c => /caminando|auto|transporte/i.test(c)), 'Action chips should offer transport options')
  })

  await t.test('should extract Spanish numbers written as words for duration, budget, and group size', () => {
    const resDays = extractChatInformationFallback('Nos vamos a quedar dos días y vamos el sábado')
    assert.equal(resDays.durationDays, 2)
    assert.equal(resDays.durationHours, 48)

    const resWeeks = extractChatInformationFallback('Queremos un viaje de tres semanas')
    assert.equal(resWeeks.durationDays, 21)

    const resBudgetMod = extractChatInformationFallback('Tenemos un presupuesto de siete millones de pesos')
    assert.equal(resBudgetMod.budget, 'Moderado')

    const resBudgetLux = extractChatInformationFallback('Contamos con veinte millones de presupuesto')
    assert.equal(resBudgetLux.budget, 'Lujo')

    const resGroup = extractChatInformationFallback('Somos cuatro personas viajando juntas')
    assert.equal(resGroup.groupSize, 4)
    assert.equal(resGroup.companions, 'En grupo')
  })

  await t.test('should extract location_to_destination to physical bridge as 1-day excursion without lodging', () => {
    const prompt = 'Crea un tour de mi ubicación hasta el Puente Pumarejo Voy a ir con unos amigos'
    const extracted = extractChatInformationFallback(prompt)

    assert.equal(extracted.tourType, 'location_to_destination')
    assert.equal(extracted.isUserLocationOrigin, true)
    assert.equal(extracted.destination, 'Puente Pumarejo')
    assert.equal(extracted.durationDays, 1)
    assert.equal(extracted.durationHours, 8)
    assert.equal(extracted.accommodationStatus, 'Alojamiento no requerido / Tour de 1 día')
    assert.equal(extracted.companions, 'Con amigos')
  })

  await t.test('should generate 1-day corridor day plan for location_to_destination without asking for lodging', async () => {
    const userMsg = 'Crea un tour de mi ubicación hasta el Puente Pumarejo Voy a ir con unos amigos'
    const chatRes = await generateChatResponse(
      { history: [{ role: 'user', content: userMsg }] },
      '',
      '',
      { userGpsLatitude: 11.018, userGpsLongitude: -74.851 },
      []
    )

    assert.ok(chatRes.responseMessage.includes('Puente Pumarejo'), 'Response should mention Puente Pumarejo')
    assert.ok(!chatRes.responseMessage.toLowerCase().includes('en qué hotel'), 'Should never ask for hotel')
    assert.ok(!chatRes.responseMessage.toLowerCase().includes('tu alojamiento u hotel'), 'Should never ask for hotel')
    assert.ok(chatRes.responseMessage.includes('Itinerario de Viaje: En ruta hacia Puente Pumarejo (1 día)'), 'Should have clean Itinerario de Viaje header')
    assert.ok(chatRes.responseMessage.includes('Día 1: En ruta hacia Puente Pumarejo'), 'Should have clean day header')
    assert.ok(!chatRes.responseMessage.includes('09:00 AM'), 'Should not contain timestamps')
    assert.ok(!chatRes.responseMessage.includes('(Excursión de 1 día)'), 'Should not contain verbose excursion label')
    assert.ok(!chatRes.responseMessage.includes('🌅'), 'Should not contain stop emojis')
    assert.equal(chatRes.extractedPreferences?.tourType, 'location_to_destination')
    assert.equal(chatRes.extractedPreferences?.durationDays, 1)
    assert.ok(Array.isArray(chatRes.specificPlaces) && chatRes.specificPlaces.length >= 2, 'Should provide corridor stops')
    assert.ok(chatRes.actionChips.some(c => c.includes('Generar tour en el mapa')), 'Action chips should offer map tour generation')
  })

  await t.test('should execute applyTourType in ai.js without ReferenceError', async () => {
    const { applyTourType } = await import('../routes/ai.js')
    const tour = applyTourType({ destination: 'Parque Tayrona' })
    assert.equal(tour.tourType, 'micro_destination')

    const routeTour = applyTourType({ isMultiCity: true, originPlace: 'Medellín', destinationPlace: 'Guatapé' })
    assert.equal(routeTour.tourType, 'city_to_city')
  })

})

