import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isOpenAiCircuitOpen,
  tripOpenAiCircuitBreaker,
  resetOpenAiCircuitBreaker,
  getActiveOpenAiKey,
  fetchOpenAiChatCompletion
} from '../services/openai.js'
import {
  composeDeterministicTourGuideScript,
  buildDeterministicStopDetails,
  rankAndFilterTouristAttractions,
  rankAndFilterTouristRestaurants,
  parseLandmarksFromWikitext,
  arePlaceNamesSemanticallySame,
  estimateRealisticStopDurationMinutes,
  inferStopSubcategory,
  enrichPlaceWithOpenData,
  clusterStopsIntoCoherentDays,
  areStopsCompatibleInSameDay
} from '../services/open-tourism-service.js'
import { buildTourPlanner, buildFallbackTour } from '../routes/ai.js'
import { generateSpeechAudio, resetOpenAiTtsCircuitBreaker } from '../services/ttsService.js'

test('should trip the circuit breaker and disable getActiveOpenAiKey when OpenAI returns 429 insufficient_quota', async () => {
  const originalKey = process.env.OPENAI_API_KEY
  const originalFetch = global.fetch

  try {
    process.env.OPENAI_API_KEY = 'sk-test-exhausted-key'
    resetOpenAiCircuitBreaker()
    assert.equal(isOpenAiCircuitOpen(), false)
    assert.equal(getActiveOpenAiKey(), 'sk-test-exhausted-key')

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'You exceeded your current quota, please check your plan and billing details.',
            type: 'insufficient_quota',
            code: 'insufficient_quota'
          }
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )

    const res = await fetchOpenAiChatCompletion({ method: 'POST' })
    assert.equal(res.status, 429)
    assert.equal(isOpenAiCircuitOpen(), true)
    assert.equal(getActiveOpenAiKey(), '')
  } finally {
    resetOpenAiCircuitBreaker()
    process.env.OPENAI_API_KEY = originalKey
    global.fetch = originalFetch
  }
})

test('should compose a rich first-person tour guide script from OpenStreetMap and Wikipedia data when OpenAI is unavailable', () => {
  const samplePlace = {
    name: 'Castillo de San Felipe de Barajas',
    category: 'historic',
    city: 'Cartagena',
    shortDescription: 'fortaleza militar colonial española del siglo XVII',
    history:
      'El Castillo de San Felipe de Barajas es una fortificación localizada en la ciudad de Cartagena de Indias en Colombia. Fue construido en 1657 sobre el cerro de San Lázaro para defender la ciudad de ataques piratas.',
    rawTags: {
      wikidata: 'Q575663',
      start_date: '1657',
      architect: 'Antonio de Arévalo',
      opening_hours: 'Mo-Su 08:00-18:00',
      heritage: '1'
    }
  }

  const script = composeDeterministicTourGuideScript(samplePlace, {
    city: 'Cartagena',
    stopIndex: 0
  })
  const details = buildDeterministicStopDetails(samplePlace, {
    city: 'Cartagena',
    stopIndex: 0
  })

  assert.ok(script.includes('Castillo de San Felipe de Barajas'))
  assert.ok(script.includes('1657'))
  assert.ok(script.includes('Antonio de Arévalo'))
  assert.ok(script.split(/\s+/).length >= 45)
  assert.ok(details.curiousFacts.length >= 1)
  assert.ok(details.tips.some((t) => t.includes('08:00-18:00')))
})

test('should build a complete tour with enriched stops and coordinates when buildFallbackTour is invoked without OpenAI', async () => {
  const originalFetch = global.fetch
  try {
    global.fetch = async (url) => {
      const urlStr = String(url)
      if (urlStr.includes('wikipedia.org') || urlStr.includes('wikivoyage.org')) {
        return new Response(
          JSON.stringify({
            title: 'Cartagena de Indias',
            description: 'Ciudad histórica amurallada en el Caribe colombiano',
            extract:
              'Cartagena de Indias es un distrito turístico y cultural fundado en 1533, famoso por sus murallas coloniales y arquitectura patrimonial.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('{}', { status: 200 })
    }

    const input = {
      destination: 'Cartagena',
      city: 'Cartagena',
      country: 'Colombia',
      durationHours: 24,
      type: 'cultural',
      language: 'es',
      touristInterests: ['Historia', 'Arquitectura']
    }
    const places = [
      {
        id: 'osm:node:101',
        candidateId: 'osm:node:101',
        name: 'Torre del Reloj',
        category: 'historic',
        latitude: 10.4236,
        longitude: -75.5494,
        address: 'Plaza de los Coches, Cartagena',
        city: 'Cartagena',
        country: 'Colombia',
        rawTags: { start_date: '1888', opening_hours: '24/7' }
      },
      {
        id: 'osm:node:102',
        candidateId: 'osm:node:102',
        name: 'Museo del Oro Zenú',
        category: 'museum',
        latitude: 10.4229,
        longitude: -75.5512,
        address: 'Parque Bolívar, Cartagena',
        city: 'Cartagena',
        country: 'Colombia',
        rawTags: { fee: 'no' }
      }
    ]

    const planner = buildTourPlanner(input, { latitude: 10.4236, longitude: -75.5494 }, places)
    const fallbackTour = await buildFallbackTour(planner, input)

    assert.ok(fallbackTour)
    assert.ok(Array.isArray(fallbackTour.itinerario))
    assert.equal(fallbackTour.itinerario.length, 2)
    assert.equal(fallbackTour.itinerario[0].ubicacion.latitud, 10.4236)
    assert.equal(fallbackTour.itinerario[0].ubicacion.longitud, -75.5494)
    assert.ok(fallbackTour.itinerario[0].descripcion.includes('Torre del Reloj'))
    assert.ok(fallbackTour.historia_del_lugar.includes('1533'))
  } finally {
    global.fetch = originalFetch
  }
})

test('should synthesize an MP3 audio buffer using free neural TTS when OpenAI TTS quota is exhausted', async () => {
  resetOpenAiTtsCircuitBreaker()
  const audioBuffer = await generateSpeechAudio({
    text: '¡Bienvenido a Cartagena de Indias! Estamos frente a la emblemática Torre del Reloj.',
    voice: 'nova',
    speed: 1.06,
    provider: 'free'
  })

  assert.ok(Buffer.isBuffer(audioBuffer))
  assert.ok(audioBuffer.length > 500, `Expected non-empty MP3 buffer, got ${audioBuffer.length} bytes`)
})

test('should reject neighborhood parks and rank iconic attractions at the top when scoring city POIs', () => {
  const rawPois = [
    { name: 'Parque Balboa', tags: { leisure: 'park' } },
    { name: 'Parque Brizalia', tags: { leisure: 'park' } },
    { name: 'Parque Biosaludable 35 con Circunvalar', tags: { leisure: 'park' } },
    { name: 'Parque las Golondrinas', tags: { leisure: 'park' } },
    { name: 'Ronda del Sinú', tags: { leisure: 'park', tourism: 'attraction', wikidata: 'Q6111942' } },
    { name: 'Catedral de San Jerónimo', tags: { historic: 'cathedral', wikidata: 'Q5758565' } },
    { name: 'Museo Zenú de Arte Contemporáneo', tags: { tourism: 'museum' } },
    { name: 'Muelle turístico en el río Sinú', tags: { man_made: 'pier', tourism: 'attraction' } },
    { name: 'Parque Simón Bolívar', tags: { leisure: 'park', historic: 'memorial' } }
  ]
  const wikiLandmarks = [
    'Ronda del Sinú',
    'Museo Zenú de Arte Contemporáneo',
    'Catedral de San Jerónimo',
    'Muelle turístico en el río Sinú',
    'Parque Simón Bolívar'
  ]

  const ranked = rankAndFilterTouristAttractions(rawPois, wikiLandmarks)
  const names = ranked.map((item) => item.name)

  assert.ok(!names.includes('Parque Balboa'))
  assert.ok(!names.includes('Parque Brizalia'))
  assert.ok(!names.includes('Parque Biosaludable 35 con Circunvalar'))
  assert.ok(!names.includes('Parque las Golondrinas'))
  assert.ok(names.includes('Ronda del Sinú'))
  assert.ok(names.includes('Catedral de San Jerónimo'))
  assert.ok(names.includes('Museo Zenú de Arte Contemporáneo'))
  assert.ok(names.includes('Muelle turístico en el río Sinú'))
  assert.ok(names.includes('Parque Simón Bolívar'))
})

test('should reject fast-food stalls and rank authentic culinary restaurants when scoring food venues', () => {
  const rawFood = [
    { name: 'Restaurante Comidas Rápidas el Lobo', tags: { amenity: 'fast_food' } },
    { name: 'Minuto de Dios Restaurante Maritza', tags: { amenity: 'restaurant' } },
    { name: 'Restaurante Brasa Caribe', tags: { amenity: 'restaurant', cuisine: 'regional;steak_house', opening_hours: '11:30-22:00' } },
    { name: 'RUTA 29 PARRILLA RESTAURANTE', tags: { amenity: 'restaurant', cuisine: 'grill' } }
  ]

  const ranked = rankAndFilterTouristRestaurants(rawFood)
  const names = ranked.map((r) => r.name)

  assert.ok(!names.includes('Restaurante Comidas Rápidas el Lobo'))
  assert.ok(!names.includes('Minuto de Dios Restaurante Maritza'))
  assert.equal(names[0], 'Restaurante Brasa Caribe')
  assert.ok(names.includes('RUTA 29 PARRILLA RESTAURANTE'))
})

test('should extract iconic tourist landmarks from city Wikipedia wikitext sections when parsing article', () => {
  const sampleWikitext = `
== Turismo ==
El principal atractivo es el '''[[Parque Ronda del Sinú]]''', junto al '''Muelle turístico en el río Sinú'''.
También destacan el '''Museo Zenú de Arte Contemporáneo''', la '''[[Catedral de San Jerónimo]]''', el '''Pueblito Cordobés''' y el '''Pasaje del Sol'''.
`
  const extracted = parseLandmarksFromWikitext(sampleWikitext, 'Montería')
  assert.ok(extracted.some((item) => /Ronda del Sinú/i.test(item)))
  assert.ok(extracted.some((item) => /Museo Zenú de Arte Contemporáneo/i.test(item)))
  assert.ok(extracted.some((item) => /Catedral de San Jerónimo/i.test(item)))
  assert.ok(extracted.some((item) => /Pueblito Cordobés/i.test(item)))
  assert.ok(extracted.some((item) => /Pasaje del Sol/i.test(item)))
})

test('should detect semantic duplicate place names with modifier variations across any city', () => {
  assert.equal(
    arePlaceNamesSemanticallySame(
      'Puente Metálico Gustavo Rojas Pinilla',
      'Puente Gustavo Rojas Pinilla',
      'Bucaramanga'
    ),
    true
  )
  assert.equal(
    arePlaceNamesSemanticallySame(
      'Parque Bolívar',
      'Museo Casa Bolívar Bucaramanga',
      'Bucaramanga'
    ),
    true
  )
  assert.equal(
    arePlaceNamesSemanticallySame(
      'Parque Bolívar',
      'Parque Simón Bolívar',
      'Bucaramanga'
    ),
    true
  )
  assert.equal(
    arePlaceNamesSemanticallySame(
      'Ronda del Sinú',
      'Parque Ronda del Sinú Norte',
      'Montería'
    ),
    true
  )
  assert.equal(
    arePlaceNamesSemanticallySame(
      'Museo de Arte Moderno de Bucaramanga',
      'Catedral de la Sagrada Familia',
      'Bucaramanga'
    ),
    false
  )
})

test('should block generic city Wikipedia summaries from contaminating stop descriptions and produce distinct narratives', async () => {
  const originalFetch = global.fetch
  try {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          title: 'Bucaramanga',
          description: 'Capital del departamento de Santander, Colombia',
          extract:
            'Bucaramanga es un municipio colombiano, capital del departamento de Santander.Está ubicada al noreste del país sobre la Cordillera Oriental.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

    const stopA = await enrichPlaceWithOpenData(
      { name: 'Museo de Arte Religioso', category: 'museum', city: 'Bucaramanga' },
      'Bucaramanga',
      'es'
    )
    const stopB = await enrichPlaceWithOpenData(
      { name: 'Museo de Arte Moderno de Bucaramanga', category: 'museum', city: 'Bucaramanga' },
      'Bucaramanga',
      'es'
    )
    const stopC = await enrichPlaceWithOpenData(
      { name: 'Parque Bolívar', category: 'park', city: 'Bucaramanga' },
      'Bucaramanga',
      'es'
    )

    const detailsA = buildDeterministicStopDetails(stopA, { city: 'Bucaramanga', stopIndex: 0 })
    const detailsB = buildDeterministicStopDetails(stopB, { city: 'Bucaramanga', stopIndex: 1 })
    const detailsC = buildDeterministicStopDetails(stopC, { city: 'Bucaramanga', stopIndex: 2 })

    assert.ok(!detailsA.description.includes('Bucaramanga es un municipio colombiano'))
    assert.ok(!detailsB.description.includes('Bucaramanga es un municipio colombiano'))
    assert.ok(!detailsC.description.includes('Bucaramanga es un municipio colombiano'))
    assert.notEqual(detailsA.description, detailsB.description)
    assert.notEqual(detailsB.description, detailsC.description)
  } finally {
    global.fetch = originalFetch
  }
})

test('should assign realistic and varied stop durations based on venue subcategory and classify restaurants accurately', () => {
  const restaurantPlace = { name: "Vegetariano D' Pacha Mama", city: 'Bucaramanga', tags: {} }
  const museumPlace = { name: 'Museo de Arte Moderno de Bucaramanga', category: 'museum', city: 'Bucaramanga' }
  const riverwalkPlace = { name: 'Ronda del Sinú', category: 'park', city: 'Montería' }
  const viewpointPlace = { name: 'Mirador Palonegro', category: 'viewpoint', city: 'Bucaramanga' }

  assert.equal(inferStopSubcategory(restaurantPlace), 'restaurant')
  assert.equal(inferStopSubcategory(museumPlace), 'museum')
  assert.equal(inferStopSubcategory(riverwalkPlace), 'riverwalk')
  assert.equal(inferStopSubcategory(viewpointPlace), 'viewpoint')

  const restaurantMins = estimateRealisticStopDurationMinutes(restaurantPlace, 0)
  const museumMins = estimateRealisticStopDurationMinutes(museumPlace, 1)
  const riverwalkMins = estimateRealisticStopDurationMinutes(riverwalkPlace, 2)
  const viewpointMins = estimateRealisticStopDurationMinutes(viewpointPlace, 3)

  assert.ok(restaurantMins >= 60 && restaurantMins <= 75, `Expected 60-75 min for restaurant, got ${restaurantMins}`)
  assert.ok(museumMins >= 70 && museumMins <= 90, `Expected 70-90 min for museum, got ${museumMins}`)
  assert.ok(riverwalkMins >= 55 && riverwalkMins <= 70, `Expected 55-70 min for riverwalk, got ${riverwalkMins}`)
  assert.ok(viewpointMins >= 25 && viewpointMins <= 40, `Expected 25-40 min for viewpoint, got ${viewpointMins}`)

  const restaurantDetails = buildDeterministicStopDetails(restaurantPlace, { city: 'Bucaramanga', stopIndex: 0 })
  assert.equal(restaurantDetails.category, 'restaurant')
  assert.ok(
    restaurantDetails.activities.some((act) => /menú|plato|sazón|degustar|culinari/i.test(act)),
    'Expected restaurant activities to be gastronomic'
  )
  assert.ok(
    !restaurantDetails.activities.some((act) => /patrimonial|arquitectónicos/i.test(act)),
    'Expected restaurant activities not to mention patrimonial architecture'
  )
  assert.ok(
    restaurantDetails.tips.some((tip) => tip.includes(`${restaurantDetails.durationMinutes} minutos`)),
    'Expected tip duration to match stop durationMinutes exactly'
  )
})

test('should cluster stops geographically by day and never mix distant excursions like Tayrona and Minca on the same day', () => {
  const santaMartaAttractions = [
    { name: 'Quinta de San Pedro Alejandrino', latitude: 11.2286, longitude: -74.1772 },
    { name: 'Catedral Basílica de Santa Marta', latitude: 11.2442, longitude: -74.2116 },
    { name: 'Museo del Oro Tairona', latitude: 11.2458, longitude: -74.2141 },
    { name: 'Parque de Los Novios', latitude: 11.2421, longitude: -74.2128 },
    { name: 'Playa El Rodadero', latitude: 11.2045, longitude: -74.2268 },
    { name: 'Bahía de Taganga', latitude: 11.2667, longitude: -74.1917 },
    { name: 'Parque Nacional Natural Tayrona', latitude: 11.3145, longitude: -73.9562 },
    { name: 'Minca, Sierra Nevada', latitude: 11.1436, longitude: -74.1169 },
    { name: 'Playa Blanca, Santa Marta', latitude: 11.2192, longitude: -74.2389 },
    { name: 'Museo Bolivariano de Arte Contemporáneo', latitude: 11.2289, longitude: -74.1769 },
    { name: 'Museo del Cacao y la Fábrica Artesanal de Chocolate de Minca', latitude: 11.1441, longitude: -74.1162 },
    { name: 'Museo Chairama', latitude: 11.3082, longitude: -73.9315 }
  ]

  const santaMartaRestaurants = [
    { name: 'Frutoss Restaurante Vegetariano', latitude: 11.2425, longitude: -74.2119 },
    { name: 'La Popular Restaurante', latitude: 11.2419, longitude: -74.2132 },
    { name: 'Restaurante el Paraiso', latitude: 11.2051, longitude: -74.2261 },
    { name: 'Boca Del Monte', latitude: 11.2431, longitude: -74.2111 },
    { name: 'Josefina La Co', latitude: 11.2412, longitude: -74.2121 },
    { name: 'Mil Carnes', latitude: 11.2295, longitude: -74.1812 },
    { name: 'Postres Y Ponques Don Jacobo', latitude: 11.2399, longitude: -74.2085 }
  ]

  const cityCenter = { latitude: 11.2435, longitude: -74.2119 }

  assert.equal(
    areStopsCompatibleInSameDay(
      { name: 'Parque Nacional Natural Tayrona', latitude: 11.3145, longitude: -73.9562 },
      { name: 'Minca, Sierra Nevada', latitude: 11.1436, longitude: -74.1169 },
      cityCenter,
      'Santa Marta'
    ),
    false
  )
  assert.equal(
    areStopsCompatibleInSameDay(
      { name: 'Playa El Rodadero', latitude: 11.2045, longitude: -74.2268 },
      { name: 'Bahía de Taganga', latitude: 11.2667, longitude: -74.1917 },
      cityCenter,
      'Santa Marta'
    ),
    false
  )

  const days = clusterStopsIntoCoherentDays(santaMartaAttractions, santaMartaRestaurants, {
    numDays: 7,
    city: 'Santa Marta',
    cityCenter
  })

  assert.equal(days.length, 7)

  const findDayOf = (targetName) => {
    const found = days.find((d) => d.stops.some((s) => s.name === targetName))
    return found ? found.day : null
  }

  const dayTayrona = findDayOf('Parque Nacional Natural Tayrona')
  const dayMinca = findDayOf('Minca, Sierra Nevada')
  const dayCacaoMinca = findDayOf('Museo del Cacao y la Fábrica Artesanal de Chocolate de Minca')
  const dayChairama = findDayOf('Museo Chairama')
  const dayQuinta = findDayOf('Quinta de San Pedro Alejandrino')
  const dayBolivariano = findDayOf('Museo Bolivariano de Arte Contemporáneo')
  const dayRodadero = findDayOf('Playa El Rodadero')
  const dayPlayaBlanca = findDayOf('Playa Blanca, Santa Marta')
  const dayTaganga = findDayOf('Bahía de Taganga')

  // Never mix Tayrona and Minca on the same day
  assert.notEqual(dayTayrona, dayMinca)
  // Group Minca and Museo del Cacao de Minca on the exact same day
  assert.equal(dayMinca, dayCacaoMinca)
  // Group Parque Tayrona and Museo Chairama on the exact same day
  assert.equal(dayTayrona, dayChairama)
  // Group Quinta de San Pedro Alejandrino and Museo Bolivariano on the exact same day
  assert.equal(dayQuinta, dayBolivariano)
  // Group Playa El Rodadero and Playa Blanca on the exact same day, separate from Taganga
  assert.equal(dayRodadero, dayPlayaBlanca)
  assert.notEqual(dayRodadero, dayTaganga)

  // Every single day (Day 1 to Day 7) must have at least 1 real tourist attraction (not just a bakery)
  for (const dayPlan of days) {
    assert.ok(
      dayPlan.attractions.length >= 1,
      `Expected Day ${dayPlan.day} to have at least 1 tourist attraction, got ${dayPlan.attractions.length}`
    )
  }
})



