import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateCandidateLocation, resolveCanonicalDestination, haversineDistanceKm } from '../services/destinationService.js'
import { getRealDestinationCatalog } from '../services/openai.js'
import { geocodePlace } from '../services/osm.js'

test('Universal Geofencing: Haversine distance rejects cross-city hallucinations automatically', () => {
  // Santa Marta center: lat 11.24, lon -74.21
  const santaMartaDest = {
    displayName: 'Santa Marta, Magdalena, Colombia',
    city: 'Santa Marta',
    country: 'Colombia',
    countryCode: 'CO',
    latitude: 11.2408,
    longitude: -74.2110
  }

  // Local Santa Marta places (Distance < 40 km) -> MUST BE ACCEPTED
  const rodadero = { name: 'Playa El Rodadero', latitude: 11.2065, longitude: -74.2272, country: 'Colombia', countryCode: 'CO' }
  const tayrona = { name: 'Parque Nacional Natural Tayrona', latitude: 11.3100, longitude: -73.9600, country: 'Colombia', countryCode: 'CO' }
  const minca = { name: 'Minca', latitude: 11.1435, longitude: -74.1165, country: 'Colombia', countryCode: 'CO' }

  assert.equal(validateCandidateLocation(rodadero, santaMartaDest, 70), true)
  assert.equal(validateCandidateLocation(tayrona, santaMartaDest, 70), true)
  assert.equal(validateCandidateLocation(minca, santaMartaDest, 70), true)

  // Cartagena places (Distance ~220 km > 70 km) -> MUST BE REJECTED AUTOMATICALLY
  const cafeDelMarCartagena = { name: 'Café del Mar (Cartagena)', latitude: 10.4230, longitude: -75.5530, country: 'Colombia', countryCode: 'CO' }
  const sanFelipeCartagena = { name: 'Castillo San Felipe de Barajas', latitude: 10.4225, longitude: -75.5390, country: 'Colombia', countryCode: 'CO' }
  const baruCartagena = { name: 'Playa Blanca Barú', latitude: 10.2150, longitude: -75.6020, country: 'Colombia', countryCode: 'CO' }

  assert.equal(validateCandidateLocation(cafeDelMarCartagena, santaMartaDest, 70), false)
  assert.equal(validateCandidateLocation(sanFelipeCartagena, santaMartaDest, 70), false)
  assert.equal(validateCandidateLocation(baruCartagena, santaMartaDest, 70), false)
})

test('Universal Geofencing: Global destinations (Rome vs Pisa, Tokyo vs Kyoto)', () => {
  // Rome center: lat 41.9028, lon 12.4964
  const romeDest = {
    displayName: 'Roma, Lazio, Italia',
    city: 'Roma',
    country: 'Italia',
    countryCode: 'IT',
    latitude: 41.9028,
    longitude: 12.4964
  }

  const colosseum = { name: 'Colosseo', latitude: 41.8902, longitude: 12.4922, countryCode: 'IT' }
  const vatican = { name: 'Basilica di San Pietro', latitude: 41.9029, longitude: 12.4534, countryCode: 'IT' }
  const pisaTower = { name: 'Torre di Pisa', latitude: 43.7230, longitude: 10.3966, countryCode: 'IT' } // ~260 km away

  assert.equal(validateCandidateLocation(colosseum, romeDest, 60), true)
  assert.equal(validateCandidateLocation(vatican, romeDest, 60), true)
  assert.equal(validateCandidateLocation(pisaTower, romeDest, 60), false)
})

test('getRealDestinationCatalog returns structured local catalog for any destination', async () => {
  const smCatalog = await getRealDestinationCatalog('Santa Marta', 'Colombia')
  assert.ok(smCatalog)
  assert.ok(Array.isArray(smCatalog.places))
  assert.ok(smCatalog.places.length >= 4)
  assert.ok(Array.isArray(smCatalog.restaurants))
  assert.ok(smCatalog.restaurants.length >= 2)
})
