import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace, buildTourPlanner, deduplicatePlacesByName } from '../routes/ai.js'
import { selectBestPoiResult, geocodePlace } from '../services/osm.js'
import { getRealDestinationCatalog } from '../services/openai.js'

test('isValidSpecificPlace must reject all non-physical activities and descriptive phrases', () => {
  // Descriptive activities and check-ins
  assert.equal(isValidSpecificPlace('Instalación en casa'), false)
  assert.equal(isValidSpecificPlace('instalacion en casa'), false)
  assert.equal(isValidSpecificPlace('Llegada a Barranquilla'), false)
  assert.equal(isValidSpecificPlace('Despedida de Barranquilla'), false)
  assert.equal(isValidSpecificPlace('Regreso a casa'), false)
  assert.equal(isValidSpecificPlace('Picnic o almuerzo en la zona'), false)
  assert.equal(isValidSpecificPlace('Picnic en la zona'), false)
  assert.equal(isValidSpecificPlace('almuerzo en la zona'), false)
  assert.equal(isValidSpecificPlace('Últimos momentos para disfrutar de la ciudad'), false)
  assert.equal(isValidSpecificPlace('ultimos momentos para disfrutar de la ciudad'), false)
  assert.equal(isValidSpecificPlace('Tarde libre para compras o descanso'), false)
  assert.equal(isValidSpecificPlace('Día libre para explorar más de Barranquilla a tu ritmo'), false)
  assert.equal(isValidSpecificPlace('Participación en algún evento cultural'), false)
  assert.equal(isValidSpecificPlace('Día de exploración de la vida nocturna en el barrio El Prado'), false)

  // Generic words/fragments
  assert.equal(isValidSpecificPlace('local'), false)
  assert.equal(isValidSpecificPlace('un restaurante local'), false)
  assert.equal(isValidSpecificPlace('la zona'), false)
  assert.equal(isValidSpecificPlace('zona'), false)
  assert.equal(isValidSpecificPlace('casa propia'), false)
  assert.equal(isValidSpecificPlace('en casa'), false)
  assert.equal(isValidSpecificPlace('casa'), false)
  assert.equal(isValidSpecificPlace('hotel'), false)
  assert.equal(isValidSpecificPlace('alojamiento'), false)

  // Real physical places & restaurants MUST be valid
  assert.equal(isValidSpecificPlace('Restaurante El Celler'), true)
  assert.equal(isValidSpecificPlace('Museo del Caribe'), true)
  assert.equal(isValidSpecificPlace('La Cueva'), true)
  assert.equal(isValidSpecificPlace('Restaurante La Cueva'), true)
  assert.equal(isValidSpecificPlace('Parque Cultural del Caribe'), true)
  assert.equal(isValidSpecificPlace('El Buen Sazón'), true)
  assert.equal(isValidSpecificPlace('Restaurante El Buen Sazón'), true)
  assert.equal(isValidSpecificPlace('Bocas de Ceniza'), true)
  assert.equal(isValidSpecificPlace('Catedral Metropolitana María Reina'), true)
  assert.equal(isValidSpecificPlace('Barrio El Prado'), true)
  assert.equal(isValidSpecificPlace('Restaurante La Pérgola'), true)
  assert.equal(isValidSpecificPlace('Restaurante El Tropezón'), true)
  assert.equal(isValidSpecificPlace('Restaurante La Casa de la Cerveza'), true)
  assert.equal(isValidSpecificPlace('Restaurante El Corralito'), true)
  assert.equal(isValidSpecificPlace('Parque de los Fundadores'), true)
  assert.equal(isValidSpecificPlace('Restaurante El Pórtico'), true)
  assert.equal(isValidSpecificPlace('La Troja'), true)
})

test('selectBestPoiResult must reject educational/school facilities when querying food entities', () => {
  const schoolResult = {
    name: 'Colegio Buen Consejo',
    type: 'school',
    class: 'amenity',
    tags: { osm_value: 'school', osm_key: 'amenity' },
    latitude: 10.9950,
    longitude: -74.8050
  }
  const foodResult = {
    name: 'Restaurante El Buen Sazón',
    type: 'restaurant',
    class: 'amenity',
    tags: { osm_value: 'restaurant', osm_key: 'amenity' },
    latitude: 10.9955,
    longitude: -74.8055
  }

  // When both exist, must pick the restaurant, never the school
  const picked = selectBestPoiResult([schoolResult, foodResult], 'El Buen Sazón')
  assert.ok(picked)
  assert.equal(picked.name, 'Restaurante El Buen Sazón')

  // When only a school is returned for a food query, must return null (reject school)
  const rejected = selectBestPoiResult([schoolResult], 'El Buen Sazón')
  assert.equal(rejected, null)
})

test('geocodePlace resolves Barranquilla POIs dynamically with proximity bias', async () => {
  const bqLat = 10.9685
  const bqLon = -74.7813
  const granMalecon = await geocodePlace('Gran Malecon', bqLat, bqLon)
  assert.ok(granMalecon)
  assert.ok(granMalecon.name.toLowerCase().includes('male') || granMalecon.name.toLowerCase().includes('malé'))
})

test('buildTourPlanner preserves day assignments without moving Day 2 places into Day 1', () => {
  const input = {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 8,
    durationHours: 192,
    specificPlaces: [
      { name: 'Manuel Restaurante', dia: 1, day: 1 },
      { name: 'Museo del Caribe', dia: 2, day: 2 },
      { name: 'La Cueva', dia: 2, day: 2 },
      { name: 'Parque Cultural del Caribe', dia: 2, day: 2 },
      { name: 'Restaurante Cucayo', dia: 2, day: 2 },
      { name: 'Bocas de Ceniza', dia: 3, day: 3 },
      { name: 'Restaurante Donde Erika', dia: 3, day: 3 },
      { name: 'Catedral Metropolitana María Reina', dia: 4, day: 4 },
      { name: 'Barrio El Prado', dia: 4, day: 4 },
      { name: 'Varadero Pescados & Mariscos', dia: 4, day: 4 },
      { name: 'Restaurante Palo de Mango', dia: 4, day: 4 },
      { name: 'Caimán del Río', dia: 5, day: 5 },
      { name: 'Mi Bohío Puerto Rico', dia: 6, day: 6 },
      { name: 'Parque de los Fundadores', dia: 6, day: 6 },
      { name: 'Narcobollo', dia: 6, day: 6 },
      { name: 'La Troja', dia: 7, day: 7 }
    ]
  }

  const places = input.specificPlaces.map(p => ({
    name: p.name,
    dia: p.dia,
    day: p.day,
    latitude: 10.99,
    longitude: -74.80,
    category: 'requested',
    tags: { requested_place: 'true' }
  }))

  const planner = buildTourPlanner(input, { latitude: 10.99, longitude: -74.80, city: 'Barranquilla' }, places)
  assert.ok(planner.selectedPlaces.length >= 15)

  // Day 1 must contain ONLY Manuel Restaurante
  const day1Places = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 1)
  assert.equal(day1Places.length, 1)
  assert.equal(day1Places[0].name, 'Manuel Restaurante')

  // Day 2 must contain Museo del Caribe, La Cueva, Parque Cultural del Caribe, Restaurante Cucayo
  const day2Places = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 2)
  assert.equal(day2Places.length, 4)
  const day2Names = day2Places.map(p => p.name)
  assert.ok(day2Names.includes('Museo del Caribe'))
  assert.ok(day2Names.includes('La Cueva'))
  assert.ok(day2Names.includes('Parque Cultural del Caribe'))
  assert.ok(day2Names.includes('Restaurante Cucayo'))

  // La Cueva must NEVER be in Day 1
  assert.ok(!day1Places.some(p => p.name === 'La Cueva'))
})

test('getRealDestinationCatalog resolves dynamic catalog for Barranquilla without static presets', async () => {
  const bq = await getRealDestinationCatalog('Barranquilla', 'Colombia')
  assert.ok(bq)
  assert.equal(bq.name, 'Barranquilla')
  assert.ok(Array.isArray(bq.places))
  assert.ok(Array.isArray(bq.restaurants))
  assert.ok(Array.isArray(bq.hotels))
})
