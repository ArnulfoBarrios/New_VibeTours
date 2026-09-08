import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace, buildTourPlanner, deduplicatePlacesByName } from '../routes/ai.js'
import { selectBestPoiResult, geocodePlace, arePlacesSimilar, isNonTouristFacility } from '../services/osm.js'
import { getRealDestinationCatalog, generateChatResponse } from '../services/openai.js'
import { imageForPlaceWithStatus } from '../services/imageSearch.js'

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
  // Must NOT contain residential subdivisions or traffic roundabouts
  assert.ok(!bq.places.some(p => /urbanizaci[oó]n|condominio|mirador del mar/i.test(p)))
})

test('generateChatResponse responds to explicit build order "adelante crea el tour" with readyToBuild true and no crash', async () => {
  const state = {
    history: [
      { role: 'assistant', content: 'Día 1: Barranquilla\n • Gran Malecón del Río\n • Ventana al Mundo\n • Restaurante Narcobollo\n\n¿Te parece este itinerario? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?' },
      { role: 'user', content: 'adelante crea el tour' }
    ]
  }
  const known = {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    datesSeason: 'febrero en carnaval',
    durationDays: 7,
    selectedHotel: 'Hotel Barranquilla Plaza',
    transport: 'a pie y taxi',
    budget: 'moderado',
    companions: 'en pareja',
    specificPlaces: [
      { name: 'Gran Malecón del Río', dia: 1, day: 1 },
      { name: 'Ventana al Mundo', dia: 1, day: 1 },
      { name: 'Restaurante Narcobollo', dia: 1, day: 1 }
    ]
  }
  const res = await generateChatResponse(state, '', '', known)
  assert.ok(res)
  assert.equal(res.readyToBuild, true)
  assert.ok(!res.responseMessage.includes('¿Qué te gustaría planear a continuación?'))
  assert.ok(res.responseMessage.includes('Procedo a generar') || res.responseMessage.includes('generar tu tour'))
  assert.ok(Array.isArray(res.specificPlaces) && res.specificPlaces.length > 0)
})

test('arePlacesSimilar correctly links duplicate POIs across crossed typologies', () => {
  // Same cultural complex under different prefixes
  assert.equal(arePlacesSimilar('Museo del Caribe', 'Parque Cultural del Caribe'), true)
  assert.equal(arePlacesSimilar('Parque Cultural del Caribe', 'Museo del Caribe'), true)

  // Religious building and its directly adjoining plaza
  assert.equal(arePlacesSimilar('Iglesia de San Nicolás de Tolentino', 'Plaza de San Nicolás'), true)
  assert.equal(arePlacesSimilar('Plaza de San Nicolás', 'Iglesia de San Nicolás'), true)

  // Landmark rotonda vs monument name
  assert.equal(arePlacesSimilar('Ventana al Mundo', 'Rotonda Ventana al Mundo'), true)
  assert.equal(arePlacesSimilar('Monumento Ventana al Mundo', 'Ventana al Mundo'), true)

  // Distinct POIs sharing generic words must NEVER be considered similar
  assert.equal(arePlacesSimilar('Catedral Metropolitana', 'Puente Pumarejo'), false)
  assert.equal(arePlacesSimilar('Restaurante El Caimán del Río', 'Gran Malecón del Río'), false)
  assert.equal(arePlacesSimilar('Restaurante La Cueva', 'La Troja'), false)
  assert.equal(arePlacesSimilar('Zoológico de Barranquilla', 'Museo Romántico'), false)
})

test('isNonTouristFacility rejects ephemeral calendar events and keeps permanent physical venues', () => {
  // Ephemeral annual festival/carnival without physical venue anchor
  assert.equal(isNonTouristFacility({ name: 'Carnaval de Barranquilla' }), true)
  assert.equal(isNonTouristFacility({ name: 'Festival de la Leyenda Vallenata' }), true)

  // Permanent physical museums, venues, and parks associated with traditions
  assert.equal(isNonTouristFacility({ name: 'Casa del Carnaval' }), false)
  assert.equal(isNonTouristFacility({ name: 'Museo del Carnaval' }), false)
  assert.equal(isNonTouristFacility({ name: 'Parque del Arte' }), false)
})

test('imageForPlaceWithStatus isolates cultural attractions from food/restaurant imagery', async () => {
  // Even if category was accidentally passed as food or restaurant, zoos/carnivals must not be treated as food
  const zooRes = await imageForPlaceWithStatus('Zoológico de Barranquilla', 'Barranquilla', 'food', 0)
  assert.ok(zooRes.url)
  // Curated food URLs contain restaurant/food keywords
  assert.ok(!zooRes.url.includes('restaurant') || !zooRes.url.includes('food'))

  const catRes = await imageForPlaceWithStatus('Catedral Metropolitana María Reina', 'Barranquilla', 'restaurant', 0)
  assert.ok(catRes.url)
})

test('buildTourPlanner orders stops within each day by proximity from first anchor stop', () => {
  const input = {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    durationHours: 24,
    specificPlaces: [
      { name: 'Catedral Metropolitana', dia: 1, day: 1 },
      { name: 'Restaurante Bocas de Cenizas', dia: 1, day: 1 }, // Far north
      { name: 'Plaza de la Paz', dia: 1, day: 1 } // Right across the street from Catedral
    ]
  }

  // Catedral is at (10.988, -74.792), Plaza de la Paz is at (10.989, -74.792) (~100m away), Bocas is far at (11.08, -74.84) (~12km away)
  const places = [
    { name: 'Catedral Metropolitana', dia: 1, day: 1, latitude: 10.988, longitude: -74.792, category: 'requested' },
    { name: 'Restaurante Bocas de Cenizas', dia: 1, day: 1, latitude: 11.080, longitude: -74.840, category: 'requested' },
    { name: 'Plaza de la Paz', dia: 1, day: 1, latitude: 10.989, longitude: -74.792, category: 'requested' }
  ]

  const planner = buildTourPlanner(input, null, places)
  // First place must stay Catedral Metropolitana (the chat's anchor)
  assert.equal(planner.selectedPlaces[0].name, 'Catedral Metropolitana')
  // Second place MUST be Plaza de la Paz (100m away), NOT the far restaurant (12km away)!
  assert.equal(planner.selectedPlaces[1].name, 'Plaza de la Paz')
  // Third place is the far restaurant
  assert.equal(planner.selectedPlaces[2].name, 'Restaurante Bocas de Cenizas')
})


