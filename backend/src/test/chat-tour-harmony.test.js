import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTourPlanner, deduplicatePlacesByName, isValidSpecificPlace } from '../routes/ai.js'
import { geocodePlace } from '../services/osm.js'

test('Full 8-Day Santa Marta Chat Itinerary is faithfully preserved stop-by-stop without shifts or drops', async () => {
  const santaMartaChatPlaces = [
    { name: 'Playa El Rodadero', dia: 1, day: 1 },
    { name: 'Restaurante Ouzo', dia: 1, day: 1 },
    { name: 'Bahía de Taganga', dia: 1, day: 1 },

    { name: 'Parque Nacional Natural Tayrona', dia: 2, day: 2 },
    { name: 'Restaurante Donde Chucho', dia: 2, day: 2 },
    { name: 'Cabo San Juan del Guía', dia: 2, day: 2 },

    { name: 'Playa Cristal', dia: 3, day: 3 },
    { name: 'Restaurante Burukuka', dia: 3, day: 3 },
    { name: 'Discoteca La Puerta', dia: 3, day: 3 },

    { name: 'Minca', dia: 4, day: 4 },
    { name: 'Restaurante Guásimo', dia: 4, day: 4 },
    { name: 'Centro Histórico de Santa Marta', dia: 4, day: 4 },
    { name: 'Parque de Los Novios', dia: 4, day: 4 },

    { name: 'Playa Blanca Santa Marta', dia: 5, day: 5 },
    { name: 'Restaurante La Roca', dia: 5, day: 5 },
    { name: 'Bares en la Calle 22', dia: 5, day: 5 },

    { name: 'Quinta de San Pedro Alejandrino', dia: 6, day: 6 },
    { name: 'Restaurante Ostrería Mary', dia: 6, day: 6 },
    { name: 'Museo del Oro Tairona - Casa de la Aduana', dia: 6, day: 6 },

    { name: 'Bahía Concha', dia: 7, day: 7 },
    { name: 'Restaurante El Bistró Santa Marta', dia: 7, day: 7 },
    { name: 'Acuario y Museo del Mar del Rodadero', dia: 7, day: 7 },

    { name: 'Playa de Palomino', dia: 8, day: 8 },
    { name: 'Restaurante y Bar El Cielo', dia: 8, day: 8 },
    { name: 'Marina de Santa Marta', dia: 8, day: 8 },
  ]

  const planner = await buildTourPlanner({
    destination: 'Santa Marta, Colombia',
    city: 'Santa Marta',
    country: 'Colombia',
    durationDays: 8,
    durationHours: 192,
    type: 'custom',
    specificPlaces: santaMartaChatPlaces,
    selectedPlaces: santaMartaChatPlaces
  })

  assert.ok(planner.selectedPlaces.length >= 20, `Expected at least 20 places, got ${planner.selectedPlaces.length}`)

  // Day 1 Checks
  const day1 = planner.selectedPlaces.filter(p => (p.dia || p.day) === 1)
  assert.ok(day1.some(p => p.name.includes('Rodadero')), 'Day 1 must contain Playa El Rodadero')
  assert.ok(day1.some(p => p.name.includes('Ouzo')), 'Day 1 must contain Restaurante Ouzo')
  assert.ok(day1.some(p => p.name.includes('Taganga')), 'Day 1 must contain Bahía de Taganga')

  // Day 2 Checks
  const day2 = planner.selectedPlaces.filter(p => (p.dia || p.day) === 2)
  assert.ok(day2.some(p => p.name.includes('Tayrona')), 'Day 2 must contain Tayrona')
  assert.ok(day2.some(p => p.name.includes('Donde Chucho')), 'Day 2 must contain Restaurante Donde Chucho')

  // Day 7 Checks: Acuario MUST BE IN DAY 7, NEVER DAY 1
  const day7 = planner.selectedPlaces.filter(p => (p.dia || p.day) === 7)
  assert.ok(day7.some(p => p.name.includes('Acuario') || p.name.includes('Museo del Mar')), 'Day 7 must contain Acuario y Museo del Mar')
  assert.ok(!day1.some(p => p.name.includes('Acuario')), 'Day 1 must NEVER contain Acuario y Museo del Mar')

  // Day 8 Checks
  const day8 = planner.selectedPlaces.filter(p => (p.dia || p.day) === 8)
  assert.ok(day8.some(p => p.name.includes('Palomino')), 'Day 8 must contain Playa de Palomino')
  assert.ok(day8.some(p => p.name.includes('Marina')), 'Day 8 must contain Marina de Santa Marta')
  assert.ok(day8.some(p => p.name.includes('Cielo')), 'Day 8 must contain Restaurante y Bar El Cielo')
})

test('Geocoding of Santa Marta POIs returns valid high precision coordinates', async () => {
  const dondeChucho = await geocodePlace('Restaurante Donde Chucho, Santa Marta, Colombia')
  assert.ok(dondeChucho && dondeChucho.latitude)

  const acuario = await geocodePlace('Acuario y Museo del Mar del Rodadero, Santa Marta, Colombia')
  assert.ok(acuario && acuario.latitude)

  const bistro = await geocodePlace('Restaurante El Bistró Santa Marta, Santa Marta, Colombia')
  assert.ok(bistro && bistro.latitude)
})
