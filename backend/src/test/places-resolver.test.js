import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePlaceNameKey,
  normalizeCityKey,
  lookupCachedPlace,
  saveCachedPlace,
  placesMemoryCache
} from '../services/places-cache-service.js'
import {
  resolvePlaceWithCascade,
  hasPhysicalAddressPattern
} from '../services/places-resolver.js'

test('normalizePlaceNameKey strips generic restaurant/cafe prefixes and accents', () => {
  assert.equal(normalizePlaceNameKey('Restaurante Cucayo'), 'cucayo')
  assert.equal(normalizePlaceNameKey('Restaurante El Boliche Cebichería'), 'el boliche cebicheria')
  assert.equal(normalizePlaceNameKey('Café San Alberto'), 'san alberto')
  assert.equal(normalizePlaceNameKey('Bar La Cueva'), 'la cueva')
  assert.equal(normalizePlaceNameKey('Taquería El Pastor'), 'el pastor')
  assert.equal(normalizePlaceNameKey('Cucayo Sabor Costeño'), 'cucayo sabor costeno')
})

test('normalizeCityKey normalizes city names consistently', () => {
  assert.equal(normalizeCityKey('Barranquilla'), 'barranquilla')
  assert.equal(normalizeCityKey('Bogotá, D.C.'), 'bogota dc')
  assert.equal(normalizeCityKey('Medellín'), 'medellin')
})

test('hasPhysicalAddressPattern detects Latin American and international street nomenclature', () => {
  assert.ok(hasPhysicalAddressPattern('Cra. 49C # 76-80'))
  assert.ok(hasPhysicalAddressPattern('Carrera 53 con Calle 76'))
  assert.ok(hasPhysicalAddressPattern('Calle 72 No. 45-20'))
  assert.ok(hasPhysicalAddressPattern('Avenida Santander # 12-40'))
  assert.ok(hasPhysicalAddressPattern('Diagonal 45'))
  assert.ok(hasPhysicalAddressPattern('Transversal 23'))

  assert.equal(hasPhysicalAddressPattern(''), false)
  assert.equal(hasPhysicalAddressPattern('Centro histórico'), false)
  assert.equal(hasPhysicalAddressPattern('Frente al parque'), false)
})

test('placesMemoryCache stores and retrieves places correctly', async () => {
  const testPlace = {
    name: 'Restaurante Test Local',
    city: 'Barranquilla',
    address: 'Cra 51B # 80-12',
    latitude: 11.0025,
    longitude: -74.8105,
    placeId: 'test-123',
    source: 'manual'
  }

  const saved = await saveCachedPlace(testPlace)
  assert.ok(saved, 'Place must be saved successfully')

  const cached = await lookupCachedPlace('Test Local', 'Barranquilla')
  assert.ok(cached, 'Cached place must be found with normalized key')
  assert.equal(cached.latitude, 11.0025)
  assert.equal(cached.longitude, -74.8105)
  assert.equal(cached.address, 'Cra 51B # 80-12')
})

test('resolvePlaceWithCascade resolves iconic place and caches it', async () => {
  const result = await resolvePlaceWithCascade({
    name: 'Restaurante Cucayo',
    city: 'Barranquilla',
    country: 'Colombia',
    address: 'Cra 49C # 76-80',
    cityLat: 10.9685,
    cityLon: -74.7813,
    maxDistanceKm: 35
  })

  assert.ok(result, 'Must resolve Cucayo')
  assert.ok(Number.isFinite(result.latitude), 'Latitude must be finite number')
  assert.ok(Number.isFinite(result.longitude), 'Longitude must be finite number')
  assert.ok(result.latitude > 10.9 && result.latitude < 11.1, 'Latitude must be in Barranquilla')
  assert.ok(result.longitude > -74.9 && result.longitude < -74.7, 'Longitude must be in Barranquilla')
  assert.ok(result.coordinatesVerified, 'Must be marked as verified')

  // Second call must hit cache immediately
  const cachedResult = await resolvePlaceWithCascade({
    name: 'Cucayo',
    city: 'Barranquilla'
  })
  assert.ok(cachedResult, 'Second call must hit cache')
  assert.equal(cachedResult.latitude, result.latitude)
  assert.equal(cachedResult.longitude, result.longitude)
})

test('resolvePlaceWithCascade degrades gracefully when place is completely unknown and no API keys configured', async () => {
  // Should return null rather than throwing an unhandled exception
  const result = await resolvePlaceWithCascade({
    name: 'UnkownFictionalPlaceXYZ12345',
    city: 'Barranquilla',
    country: 'Colombia',
    cityLat: 10.9685,
    cityLon: -74.7813
  })

  assert.equal(result, null, 'Unknown fictional place with no match should return null')
})
