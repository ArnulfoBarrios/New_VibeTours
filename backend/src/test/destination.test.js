import 'dotenv/config'
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveCanonicalDestination, validateCandidateLocation, haversineDistanceKm } from '../services/destinationService.js'
import { collectTourCandidates } from '../routes/ai.js'

test('resolveCanonicalDestination normalizes Malibu queries cleanly', async () => {
  const result = await resolveCanonicalDestination('Malibu, California')
  assert.ok(result, 'Result should be defined')
  assert.equal(result.city, 'Malibu')
  assert.equal(result.countryCode, 'US')
  assert.equal(result.country, 'Estados Unidos')
  assert.ok(result.displayName.includes('Malibu'), 'displayName should include Malibu')
  assert.ok(Number.isFinite(result.latitude), 'latitude should be finite')
  assert.ok(Number.isFinite(result.longitude), 'longitude should be finite')
})

test('resolveCanonicalDestination extracts enclosing city for POIs/Hotels', async () => {
  const result = await resolveCanonicalDestination('The M Malibu')
  assert.ok(result, 'Result should be defined')
  assert.equal(result.city, 'Malibu')
  assert.equal(result.countryCode, 'US')
  assert.equal(result.country, 'Estados Unidos')
})

test('validateCandidateLocation filters out cross-country noise and far places', () => {
  const malibuCanonical = {
    displayName: 'Malibu, California, Estados Unidos',
    city: 'Malibu',
    region: 'California',
    country: 'Estados Unidos',
    countryCode: 'US',
    latitude: 34.0259,
    longitude: -118.7798
  }

  // Valid POI in Malibu (Getty Villa)
  const validPoi = {
    name: 'Getty Villa',
    latitude: 34.0459,
    longitude: -118.5661,
    country: 'Estados Unidos',
    countryCode: 'US'
  }
  assert.equal(validateCandidateLocation(validPoi, malibuCanonical, 35), true)

  // POI in Costa Rica (Puriscal)
  const costaRicaPoi = {
    name: 'Museo de Historia Natural de Puriscal',
    latitude: 9.8497,
    longitude: -84.3144,
    country: 'Costa Rica',
    countryCode: 'CR'
  }
  assert.equal(validateCandidateLocation(costaRicaPoi, malibuCanonical, 35), false)

  // POI in Samar, Philippines
  const samarPoi = {
    name: 'Parque Central de Mercedes',
    latitude: 11.1000,
    longitude: 125.6000,
    country: 'Filipinas',
    countryCode: 'PH'
  }
  assert.equal(validateCandidateLocation(samarPoi, malibuCanonical, 35), false)

  // POI over 100km away
  const farPoi = {
    name: 'San Diego Zoo',
    latitude: 32.7357,
    longitude: -117.1490,
    country: 'Estados Unidos',
    countryCode: 'US'
  }
  assert.equal(validateCandidateLocation(farPoi, malibuCanonical, 35), false)
})

test('Integration Test: Malibu California flow contains 0 Costa Rica/Mercedes/Samar POIs', async () => {
  const canonical = await resolveCanonicalDestination('Malibu, California')
  assert.ok(canonical, 'Canonical destination must resolve')

  const input = {
    destination: canonical.displayName,
    city: canonical.city,
    country: canonical.country,
    canonicalDestination: canonical,
    type: 'cultural',
    durationHours: 24,
    prompt: 'Tour cultural por Malibu California'
  }

  const location = {
    name: canonical.displayName,
    latitude: canonical.latitude,
    longitude: canonical.longitude,
    city: canonical.city,
    country: canonical.country,
    placeId: canonical.placeId
  }

  const pack = await collectTourCandidates(input, location)
  assert.ok(Array.isArray(pack.places), 'Places should be an array')

  const forbiddenWords = ['costa rica', 'puriscal', 'mercedes', 'san josé', 'alajuela', 'heredia', 'samar', 'filipinas']
  for (const place of pack.places) {
    const nameLower = place.name.toLowerCase()
    for (const forbidden of forbiddenWords) {
      assert.equal(nameLower.includes(forbidden), false, `Place "${place.name}" contains forbidden keyword "${forbidden}"`)
    }
    // Verify distance from Malibu center is within 65km
    const dist = haversineDistanceKm(canonical.latitude, canonical.longitude, place.latitude, place.longitude)
    assert.ok(dist <= 65, `Place "${place.name}" is ${dist.toFixed(1)}km away from Malibu (>65km)`)
  }
})
