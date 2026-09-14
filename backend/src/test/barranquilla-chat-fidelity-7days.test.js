import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractPoisFromText, buildTourPlanner, collectTourCandidates, isValidSpecificPlace } from '../routes/ai.js'
import { geocodePlace } from '../services/osm.js'

const CHAT_ITINERARY_TEXT = `¡Excelente elección! Aquí tienes una propuesta de itinerario de 7 días para disfrutar de Barranquilla:

Día 1:
- Gran Malecón del Río
- Museo del Caribe
- La Cueva Restaurante

Día 2:
- Castillo de Salgar
- Bocas de Ceniza
- Restaurante Narcobollo

Día 3:
- Parque Cultural del Caribe
- Zoológico de Barranquilla
- La Troja

Día 4:
- Catedral Metropolitana María Reina
- Barrio El Prado
- El Prado Restaurante

Día 5:
- Casa del Carnaval
- Parque Washington
- Restaurante Varadero

Día 6:
- Plaza de la Paz
- Malecón de Puerto Colombia
- Restaurante La Casa del Marisco

Día 7:
- Parque Sagrado Corazón
- Caimán del Río
- Restaurante Cucayo`

const EXPECTED_DAYS = {
  1: ['Gran Malecón del Río', 'Museo del Caribe', 'La Cueva Restaurante'],
  2: ['Castillo de Salgar', 'Bocas de Ceniza', 'Restaurante Narcobollo'],
  3: ['Parque Cultural del Caribe', 'Zoológico de Barranquilla', 'La Troja'],
  4: ['Catedral Metropolitana María Reina', 'Barrio El Prado', 'El Prado Restaurante'],
  5: ['Casa del Carnaval', 'Parque Washington', 'Restaurante Varadero'],
  6: ['Plaza de la Paz', 'Malecón de Puerto Colombia', 'Restaurante La Casa del Marisco'],
  7: ['Parque Sagrado Corazón', 'Caimán del Río', 'Restaurante Cucayo']
}

test('1. extractPoisFromText extracts exactly 21 places from chat text, 3 per day for 7 days', () => {
  const pois = extractPoisFromText(CHAT_ITINERARY_TEXT)
  assert.equal(pois.length, 21, `Expected 21 POIs, got ${pois.length}`)

  for (let d = 1; d <= 7; d++) {
    const dayPois = pois.filter(p => Number(p.dia || p.day) === d)
    assert.equal(dayPois.length, 3, `Day ${d} must have exactly 3 POIs, got ${dayPois.length}`)
    const dayNames = dayPois.map(p => p.name)
    assert.deepEqual(dayNames, EXPECTED_DAYS[d], `Day ${d} places mismatch`)
  }
})

test('2. All 21 places from user chat itinerary resolve valid coordinates in Barranquilla', async () => {
  const pois = extractPoisFromText(CHAT_ITINERARY_TEXT)
  const bqLat = 10.9685
  const bqLon = -74.7813

  for (const poi of pois) {
    const geo = await geocodePlace(poi.name, bqLat, bqLon, { city: 'Barranquilla', country: 'Colombia' })
    assert.ok(geo, `Failed to geocode ${poi.name}`)
    assert.ok(geo.latitude != null && geo.longitude != null, `Missing coords for ${poi.name}`)
  }
})

test('3. collectTourCandidates activates fast-path with exactly 21 chat places and no scrapers', async () => {
  const pois = extractPoisFromText(CHAT_ITINERARY_TEXT)
  const input = {
    destination: 'Barranquilla',
    city: 'Barranquilla',
    country: 'Colombia',
    durationDays: 7,
    durationHours: 168,
    specificPlaces: pois
  }
  const location = { latitude: 10.9685, longitude: -74.7813, city: 'Barranquilla', country: 'Colombia' }
  const result = await collectTourCandidates(input, location)

  assert.equal(result.source, 'user-chat-selected-places', 'Must use fast-path user-chat-selected-places')
  assert.equal(result.places.length, 21, `Expected exactly 21 candidate places, got ${result.places.length}`)

  // Ensure NO phantom places are in candidate pack
  const names = result.places.map(p => p.name.toLowerCase())
  assert.ok(!names.some(n => n.includes('san nicolás') || n.includes('san nicolas')), 'Plaza de San Nicolás must not be in tour')
  assert.ok(!names.some(n => n.includes('edgar rentería') || n.includes('edgar renteria')), 'Estadio Edgar Rentería must not be in tour')
})

test('4. buildTourPlanner preserves 1:1 chat fidelity: 7 days, 3 stops/day, zero shifts or phantoms', async () => {
  const pois = extractPoisFromText(CHAT_ITINERARY_TEXT)
  const input = {
    destination: 'Barranquilla',
    city: 'Barranquilla',
    country: 'Colombia',
    durationDays: 7,
    durationHours: 168,
    specificPlaces: pois
  }
  const location = { latitude: 10.9685, longitude: -74.7813, city: 'Barranquilla', country: 'Colombia' }
  const candidatePack = await collectTourCandidates(input, location)
  const planner = buildTourPlanner(input, location, candidatePack.places)

  assert.equal(planner.selectedPlaces.length, 21, `Expected 21 selected places, got ${planner.selectedPlaces.length}`)

  for (let d = 1; d <= 7; d++) {
    const dayPlaces = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === d)
    assert.equal(dayPlaces.length, 3, `Day ${d} must have exactly 3 places, got ${dayPlaces.length}`)
    const dayNames = dayPlaces.map(p => p.name)
    assert.deepEqual(dayNames, EXPECTED_DAYS[d], `Day ${d} sequence does not match chat: ${dayNames.join(', ')} vs ${EXPECTED_DAYS[d].join(', ')}`)
  }

  // Double check NO phantom places
  const allNames = planner.selectedPlaces.map(p => p.name.toLowerCase())
  assert.ok(!allNames.some(n => n.includes('san nicolás') || n.includes('san nicolas')), 'Plaza de San Nicolás must not be present')
  assert.ok(!allNames.some(n => n.includes('edgar rentería') || n.includes('edgar renteria')), 'Estadio Edgar Rentería must not be present')
})
