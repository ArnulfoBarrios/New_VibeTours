import test from 'node:test'
import assert from 'node:assert/strict'

import {
  geographicScopeFor,
  inferTourType,
} from '../routes/ai.js'

test('a multi-day single-city tour does not become regional because of duration', () => {
  const input = {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 7,
    durationHours: 168,
    type: 'cultural',
  }

  assert.equal(inferTourType(input), 'single_city')
  assert.deepEqual(geographicScopeFor(input), {
    tourType: 'single_city',
    mode: 'single_city',
    maxDistanceKm: 35,
    isRegional: false,
    allowNearbyMunicipalities: true,
  })
})

test('a single-city tour can explicitly include nearby municipalities without opening the whole country', () => {
  const scope = geographicScopeFor({
    city: 'Barranquilla',
    destination: 'Barranquilla y municipios cercanos',
    prompt: 'visitar los alrededores y municipios cercanos',
  })

  assert.equal(scope.tourType, 'single_city')
  assert.equal(scope.maxDistanceKm, 50)
  assert.equal(scope.isRegional, false)
  assert.equal(scope.allowNearbyMunicipalities, true)
})

test('micro-destinations and coastal islands use a regional geography policy', () => {
  const micro = geographicScopeFor({
    city: 'Santa Marta',
    destination: 'Parque Tayrona',
    specificPlaces: ['Minca'],
  })
  const islands = geographicScopeFor({
    city: 'Cartagena',
    destination: 'Islas del Rosario',
  })
  const nearbyIslands = geographicScopeFor({
    city: 'Coveñas',
    destination: 'Coveñas',
    specificPlaces: ['Isla Tintipán', 'Isla Múcura'],
  })

  assert.equal(inferTourType({ destination: 'Parque Tayrona' }), 'micro_destination')
  assert.equal(micro.tourType, 'micro_destination')
  assert.equal(micro.maxDistanceKm, 25)
  assert.equal(micro.isRegional, true)
  assert.equal(islands.tourType, 'coastal_islands')
  assert.equal(islands.maxDistanceKm, 90)
  assert.equal(nearbyIslands.tourType, 'coastal_islands')
  assert.equal(nearbyIslands.maxDistanceKm, 90)
})

test('a remote day stop does not widen an unrelated hub city', () => {
  const fromSantaMarta = geographicScopeFor({
    city: 'Santa Marta',
    destination: 'Santa Marta',
    specificPlaces: ['Parque Tayrona'],
  })
  const fromBarranquilla = geographicScopeFor({
    city: 'Barranquilla',
    destination: 'Barranquilla',
    specificPlaces: ['Parque Tayrona'],
  })

  assert.equal(fromSantaMarta.tourType, 'single_city')
  assert.equal(fromSantaMarta.maxDistanceKm, 35)
  assert.equal(fromBarranquilla.tourType, 'single_city')
  assert.equal(fromBarranquilla.maxDistanceKm, 35)
})

test('city-to-city and location-to-destination trips can cross municipal boundaries', () => {
  const corridor = geographicScopeFor({
    originPlace: 'Barranquilla',
    destinationPlace: 'Santa Marta',
    isMultiCity: true,
    cities: ['Barranquilla', 'Santa Marta'],
  })
  const fromUserLocation = geographicScopeFor({
    city: 'Barranquilla',
    isUserLocationOrigin: true,
    destination: 'Puerto Colombia',
  })

  assert.equal(corridor.tourType, 'city_to_city')
  assert.equal(corridor.mode, 'corridor')
  assert.equal(corridor.maxDistanceKm, 120)
  assert.equal(fromUserLocation.tourType, 'location_to_destination')
  assert.equal(fromUserLocation.maxDistanceKm, 120)
})
