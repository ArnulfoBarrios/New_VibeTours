import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveCanonicalDestination,
  rankCanonicalCandidate
} from '../services/destinationService.js'
import { geocodePlace } from '../services/osm.js'
import {
  generateChatResponse,
  isLodgingRecommendationInquiry
} from '../services/openai.js'

test('should resolve Cúcuta as Colombia with authentic coordinates and not as a Romanian village', async () => {
  const canonical = await resolveCanonicalDestination('Cucuta')
  assert.ok(canonical, 'Canonical destination should be resolved')
  assert.equal(canonical.country, 'Colombia')
  assert.equal(canonical.countryCode, 'CO')
  assert.ok(canonical.latitude > 7.0 && canonical.latitude < 8.5, `Latitude should be near Cucuta: ${canonical.latitude}`)
  assert.ok(canonical.longitude < -72.0 && canonical.longitude > -73.0, `Longitude should be near Cucuta: ${canonical.longitude}`)

  const osmGeo = await geocodePlace('Cucuta')
  assert.ok(osmGeo, 'OSM geocodePlace should resolve Cucuta')
  assert.equal(osmGeo.country, 'Colombia')
  assert.ok(osmGeo.latitude > 7.0 && osmGeo.latitude < 8.5)
  assert.ok(osmGeo.longitude < -72.0 && osmGeo.longitude > -73.0)
})

test('should rank cities and administrative centers above tiny foreign villages in rankCanonicalCandidate', () => {
  const candRo = {
    city: 'Cucuta',
    entityName: 'Cucuta',
    type: 'village',
    category: 'place',
    country: 'România',
    countryCode: 'RO',
    importance: 0.46
  }
  const candCo = {
    city: 'Cúcuta',
    entityName: 'Cúcuta',
    type: 'administrative',
    category: 'boundary',
    country: 'Colombia',
    countryCode: 'CO',
    importance: 0.54
  }

  const scoreRo = rankCanonicalCandidate(candRo, 'Cucuta')
  const scoreCo = rankCanonicalCandidate(candCo, 'Cucuta')

  assert.ok(scoreCo > scoreRo, `Cúcuta Colombia score (${scoreCo}) must exceed Cucuta Romania score (${scoreRo})`)
})

test('should identify lodging recommendation inquiries correctly', () => {
  assert.equal(isLodgingRecommendationInquiry('No sabemos dónde quedarnos que recomiendas?'), true)
  assert.equal(isLodgingRecommendationInquiry('Que hotel recomiendas?'), true)
  assert.equal(isLodgingRecommendationInquiry('recomiendame hoteles'), true)
  assert.equal(isLodgingRecommendationInquiry('¿Qué hotel recomiendas para quedarnos?'), true)
  assert.equal(isLodgingRecommendationInquiry('me voy a quedar en mi casa'), false)
})

test('should break lodging loop and provide options or guidance when user asks for hotel recommendations', async () => {
  const state = {
    messages: [
      { role: 'user', content: 'Quiero viajar a Cucuta' },
      { role: 'assistant', content: '¡Perfecto! Ya tenemos transporte y presupuesto. ¿En qué hotel o alojamiento se hospedarán en Cucuta? (o indícame si te quedas en casa propia / familiar).' },
      { role: 'user', content: 'Que hotel recomiendas?' }
    ],
    collectedData: {
      city: 'Cúcuta',
      destination: 'Cúcuta',
      country: 'Colombia',
      transport: 'Auto rentado',
      budget: 'Moderado',
      accommodationStatus: 'Recomiéndame hoteles'
    }
  }

  const response = await generateChatResponse(state, '', '', state.collectedData, [])
  assert.ok(response && response.responseMessage)
  // Must NOT repeat the exact loop question asking where they will stay
  assert.equal(
    response.responseMessage.includes('¿En qué hotel o alojamiento se hospedarán en'),
    false,
    'Bot must not repeat the lodging inquiry when asked for recommendations'
  )
  // Must provide either recommended hotels or guidance
  const hasRecommendationsOrGuidance = response.responseMessage.includes('opciones recomendadas') ||
    response.responseMessage.includes('hospedaje') ||
    response.responseMessage.includes('centro')
  assert.ok(hasRecommendationsOrGuidance, 'Bot must provide lodging recommendations or guidance')
})

test('should generate a full 6-day itinerary for Cúcuta without Romanian church or truncated days', async () => {
  const state = {
    messages: [
      { role: 'user', content: 'Quiero viajar a Cucuta' },
      { role: 'assistant', content: '¡Perfecto! Ya tenemos transporte y presupuesto. ¿En qué hotel o alojamiento se hospedarán en Cucuta? (o indícame si te quedas en casa propia / familiar).' },
      { role: 'user', content: 'me voy a quedar en mi casa' },
      { role: 'assistant', content: '¡Excelente elección viajar a Cucuta! ¿En qué fechas planeas viajar y cuántos días durará tu estadía?' },
      { role: 'user', content: 'Voy a ir mañana y voy a durar 6 días' }
    ],
    collectedData: {
      city: 'Cúcuta',
      destination: 'Cúcuta',
      country: 'Colombia',
      durationDays: 6,
      transport: 'Auto rentado',
      budget: 'Moderado',
      accommodationStatus: 'Casa propia / familiar'
    }
  }

  const response = await generateChatResponse(state, '', '', state.collectedData, [])
  assert.ok(response && response.responseMessage)
  // Must contain all 6 days
  for (let d = 1; d <= 6; d++) {
    assert.ok(
      response.responseMessage.includes(`Día ${d}:`),
      `Itinerary must contain Día ${d}`
    )
  }
  // Must NOT contain foreign Romanian church
  assert.equal(
    response.responseMessage.includes('greco-ortodoxă'),
    false,
    'Itinerary must not contain Romanian church'
  )
})
