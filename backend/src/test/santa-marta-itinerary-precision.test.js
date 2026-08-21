import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace, buildTourPlanner, deduplicatePlacesByName } from '../routes/ai.js'
import { geocodePlace } from '../services/osm.js'
import { getDestinationPresets } from '../services/openai.js'

test('isValidSpecificPlace must reject Santa Marta activity fragments and non-places', () => {
  // Activity phrases and prepositional fragments from the chat
  assert.equal(isValidSpecificPlace('para explorar'), false)
  assert.equal(isValidSpecificPlace('Tarde libre para explorar'), false)
  assert.equal(isValidSpecificPlace('Fiesta nocturna'), false)
  assert.equal(isValidSpecificPlace('fiesta nocturna'), false)
  assert.equal(isValidSpecificPlace('Las cascadas y visita a fincas de café'), false)
  assert.equal(isValidSpecificPlace('Tubbing en el río'), false)
  assert.equal(isValidSpecificPlace('tubbing en el río'), false)
  assert.equal(isValidSpecificPlace('Regreso al hotel y despedida'), false)
  assert.equal(isValidSpecificPlace('Regreso al hotel'), false)
  assert.equal(isValidSpecificPlace('Instalación en casa'), false)
  assert.equal(isValidSpecificPlace('Llegada / Hotel San Marcos'), false)

  // Real physical places & venues MUST be accepted
  assert.equal(isValidSpecificPlace('Playa El Rodadero'), true)
  assert.equal(isValidSpecificPlace('Restaurante y Bar El Cielo'), true)
  assert.equal(isValidSpecificPlace('Bahía de Taganga'), true)
  assert.equal(isValidSpecificPlace('Restaurante Ouzo'), true)
  assert.equal(isValidSpecificPlace('Parque Nacional Natural Tayrona'), true)
  assert.equal(isValidSpecificPlace('Cabo San Juan'), true)
  assert.equal(isValidSpecificPlace('Quinta de San Pedro Alejandrino'), true)
  assert.equal(isValidSpecificPlace('Playa Concha'), true)
  assert.equal(isValidSpecificPlace('Bares en la Calle 22'), true)
  assert.equal(isValidSpecificPlace('Minca'), true)
  assert.equal(isValidSpecificPlace('Playa de Palomino'), true)
  assert.equal(isValidSpecificPlace('Restaurante La Roca'), true)
  assert.equal(isValidSpecificPlace('Centro Comercial Buenavista'), true)
})

test('geocodePlace returns verified high-precision coordinates for Santa Marta POIs', async () => {
  const rodadero = await geocodePlace('Playa El Rodadero, Santa Marta')
  assert.ok(rodadero)
  assert.equal(rodadero.city, 'Santa Marta')
  assert.ok(rodadero.latitude > 11.19 && rodadero.latitude < 11.22)

  const taganga = await geocodePlace('Bahía de Taganga, Santa Marta')
  assert.ok(taganga)
  assert.equal(taganga.city, 'Santa Marta')
  assert.ok(taganga.latitude > 11.25 && taganga.latitude < 11.28)

  const ouzo = await geocodePlace('Restaurante Ouzo, Santa Marta')
  assert.ok(ouzo)
  assert.equal(ouzo.city, 'Santa Marta')
  assert.ok(ouzo.latitude > 11.23 && ouzo.latitude < 11.26)

  const tayrona = await geocodePlace('Parque Nacional Natural Tayrona, Santa Marta')
  assert.ok(tayrona)
  assert.equal(tayrona.city, 'Santa Marta')

  const quinta = await geocodePlace('Quinta de San Pedro Alejandrino, Santa Marta')
  assert.ok(quinta)
  assert.equal(quinta.city, 'Santa Marta')

  const buenavista = await geocodePlace('Centro Comercial Buenavista, Santa Marta')
  assert.ok(buenavista)
  assert.equal(buenavista.city, 'Santa Marta')
})

test('buildTourPlanner preserves Santa Marta day assignments without shifting Taganga to Day 1', () => {
  const input = {
    city: 'Santa Marta',
    destination: 'Santa Marta',
    durationDays: 8,
    durationHours: 192,
    specificPlaces: [
      { name: 'Playa El Rodadero', dia: 1, day: 1 },
      { name: 'Restaurante y Bar El Cielo', dia: 1, day: 1 },
      { name: 'Bahía de Taganga', dia: 2, day: 2 },
      { name: 'Restaurante Ouzo', dia: 2, day: 2 },
      { name: 'Parque Nacional Natural Tayrona', dia: 3, day: 3 },
      { name: 'Cabo San Juan', dia: 3, day: 3 },
      { name: 'Quinta de San Pedro Alejandrino', dia: 4, day: 4 },
      { name: 'Playa Concha', dia: 4, day: 4 },
      { name: 'Bares en la Calle 22', dia: 5, day: 5 },
      { name: 'Minca', dia: 6, day: 6 },
      { name: 'Playa de Palomino', dia: 7, day: 7 },
      { name: 'Restaurante La Roca', dia: 7, day: 7 },
      { name: 'Centro Comercial Buenavista', dia: 8, day: 8 }
    ]
  }

  const places = input.specificPlaces.map(p => ({
    name: p.name,
    dia: p.dia,
    day: p.day,
    latitude: 11.24,
    longitude: -74.21,
    category: 'requested',
    tags: { requested_place: 'true' }
  }))

  const planner = buildTourPlanner(input, { latitude: 11.24, longitude: -74.21, city: 'Santa Marta' }, places)
  assert.ok(planner.selectedPlaces.length >= 13)

  // Day 1 must contain ONLY Playa El Rodadero and Restaurante y Bar El Cielo
  const day1Places = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 1)
  assert.equal(day1Places.length, 2)
  const day1Names = day1Places.map(p => p.name)
  assert.ok(day1Names.includes('Playa El Rodadero'))
  assert.ok(day1Names.includes('Restaurante y Bar El Cielo'))
  assert.ok(!day1Names.includes('Bahía de Taganga'))

  // Day 2 must contain Bahía de Taganga and Restaurante Ouzo
  const day2Places = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 2)
  assert.equal(day2Places.length, 2)
  const day2Names = day2Places.map(p => p.name)
  assert.ok(day2Names.includes('Bahía de Taganga'))
  assert.ok(day2Names.includes('Restaurante Ouzo'))

  // Day 8 must contain Centro Comercial Buenavista
  const day8Places = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 8)
  assert.equal(day8Places.length, 1)
  assert.equal(day8Places[0].name, 'Centro Comercial Buenavista')
})
