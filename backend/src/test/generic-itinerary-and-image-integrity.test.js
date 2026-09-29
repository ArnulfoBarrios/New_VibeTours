import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isTemporalOrDurationPhrase,
  deduplicateChatSpecificPlaces,
  stripHotelStopsFromItineraryText
} from '../services/openai.js'
import {
  isImageSemanticallyCompatible,
  imageForPlaceWithStatus
} from '../services/imageSearch.js'
import { CATEGORY_IMAGE_POOLS } from '../routes/ai.js'

test('isTemporalOrDurationPhrase correctly identifies duration and temporal expressions', () => {
  // Verbal and temporal duration clauses must be identified as duration phrases
  assert.equal(isTemporalOrDurationPhrase('Durar una semana'), true)
  assert.equal(isTemporalOrDurationPhrase('durar una semana'), true)
  assert.equal(isTemporalOrDurationPhrase('Durar 7 días'), true)
  assert.equal(isTemporalOrDurationPhrase('durar 5 dias'), true)
  assert.equal(isTemporalOrDurationPhrase('Una semana'), true)
  assert.equal(isTemporalOrDurationPhrase('1 semana'), true)
  assert.equal(isTemporalOrDurationPhrase('3 días'), true)
  assert.equal(isTemporalOrDurationPhrase('7 dias'), true)
  assert.equal(isTemporalOrDurationPhrase('Quedarme 4 días'), true)
  assert.equal(isTemporalOrDurationPhrase('quedarse 3 dias'), true)
  assert.equal(isTemporalOrDurationPhrase('Estancia de 5 días'), true)
  assert.equal(isTemporalOrDurationPhrase('estadia de 1 semana'), true)
  assert.equal(isTemporalOrDurationPhrase('viaje de 7 dias'), true)

  // Real places and monuments must NOT be identified as duration phrases
  assert.equal(isTemporalOrDurationPhrase('Monumento El Viajero'), false)
  assert.equal(isTemporalOrDurationPhrase('Museo de Arte de Pereira'), false)
  assert.equal(isTemporalOrDurationPhrase('Parque Nacional Natural Tatamá'), false)
  assert.equal(isTemporalOrDurationPhrase('Catedral de Nuestra Señora de la Pobreza'), false)
  assert.equal(isTemporalOrDurationPhrase('Ukumarí Mall de Comidas'), false)
  assert.equal(isTemporalOrDurationPhrase('Lakota'), false)
  assert.equal(isTemporalOrDurationPhrase('Plaza de Bolívar'), false)
})

test('deduplicateChatSpecificPlaces removes spurious duration phrases while keeping valid POIs', () => {
  const places = [
    { name: 'Durar una semana', dia: 1 },
    { name: 'Monumento El Viajero', dia: 1 },
    { name: 'Lakota', dia: 1 },
    { name: '1 semana', dia: 2 },
    { name: 'Museo de Arte de Pereira', dia: 2 }
  ]

  const deduped = deduplicateChatSpecificPlaces(places, 'Pereira')
  const names = deduped.map(p => p.name)

  assert.equal(names.includes('Durar una semana'), false, 'Durar una semana must be filtered out')
  assert.equal(names.includes('1 semana'), false, '1 semana must be filtered out')
  assert.equal(names.includes('Monumento El Viajero'), true, 'Monumento El Viajero must be retained')
  assert.equal(names.includes('Lakota'), true, 'Lakota must be retained')
  assert.equal(names.includes('Museo de Arte de Pereira'), true, 'Museo de Arte de Pereira must be retained')
})

test('stripHotelStopsFromItineraryText strips duration phrase lines from visible itinerary', () => {
  const itinerary = `Día 1: Pereira
 • Durar una semana
 • Monumento El Viajero
 • Lakota

Día 2: Pereira
 • Museo de Arte de Pereira
 • Fonda la gran esquina`

  const sanitized = stripHotelStopsFromItineraryText(itinerary)
  assert.equal(sanitized.includes('Durar una semana'), false, 'Durar una semana must not appear as bullet')
  assert.ok(sanitized.includes('Monumento El Viajero'), 'Monumento El Viajero must be preserved')
  assert.ok(sanitized.includes('Lakota'), 'Lakota must be preserved')
})

test('CATEGORY_IMAGE_POOLS.historic does not contain recognizable foreign landmarks like London Tower Bridge', () => {
  const historicPool = CATEGORY_IMAGE_POOLS.historic || []
  assert.ok(historicPool.length > 0, 'Historic pool must have images')
  for (const url of historicPool) {
    assert.equal(url.includes('photo-1513635269975-59663e0ac1ad'), false, 'London Tower Bridge must not be in historic fallback')
  }
})

test('isImageSemanticallyCompatible rejects sports cars and automotive speedway photos for cultural POIs with "viajero" or "camino"', () => {
  const sportsCarUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'
  const isCompatible = isImageSemanticallyCompatible(sportsCarUrl, 'Monumento El Viajero', 'historic')
  assert.equal(isCompatible, false, 'Sports car photo must be rejected for Monumento El Viajero')
})

test('imageForPlaceWithStatus resolves aesthetic culturally appropriate image for museums and monuments without magazine racks or sports cars', async () => {
  const museumRes = await imageForPlaceWithStatus('Museo de Arte de Pereira', 'Pereira', 'museum', 0)
  assert.ok(museumRes.url, 'Museum must have an image URL')
  assert.equal(museumRes.url.includes('photo-1544816155-12df9643f363'), false, 'Must not be TIME/Newsweek magazine rack')

  const monumentRes = await imageForPlaceWithStatus('Monumento a Mariscal Jorge Robledo', 'Pereira', 'historic', 0)
  assert.ok(monumentRes.url, 'Monument must have an image URL')
  assert.equal(monumentRes.url.includes('photo-1528127269322-539801943592'), false, 'Must not be Asian water pagoda temple')
})
