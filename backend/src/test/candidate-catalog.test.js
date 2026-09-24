import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mergeRealCandidates,
  normalizeRealCandidate,
  validateCandidateIdentityAndCategory
} from '../services/candidate-catalog.js'

test('candidate catalog rejects names without trusted coordinates', () => {
  assert.equal(normalizeRealCandidate({ name: 'Lugar Inventado' }, {
    category: 'attraction',
    destination: 'Montería',
    country: 'Colombia'
  }), null)

  assert.equal(normalizeRealCandidate({
    name: 'Restaurante Genérico',
    latitude: 8.75,
    longitude: -75.88,
    coordinateSource: 'ai'
  }, {
    category: 'restaurant',
    destination: 'Montería',
    country: 'Colombia'
  }), null)
})

test('candidate catalog rejects a restaurant from the attraction catalog', () => {
  assert.equal(normalizeRealCandidate({
    name: 'Restaurante El Patio',
    latitude: 8.75,
    longitude: -75.88,
    coordinateSource: 'mapbox'
  }, {
    category: 'attraction',
    destination: 'Montería',
    country: 'Colombia'
  }), null)
})

test('candidate catalog merges the same place across providers and keeps evidence', () => {
  const osm = normalizeRealCandidate({
    name: 'Castillo San Felipe',
    latitude: 10.4229,
    longitude: -75.5375,
    placeId: 'way/123',
    coordinateSource: 'osm',
    address: 'Cartagena de Indias'
  }, {
    category: 'attraction',
    destination: 'Cartagena',
    country: 'Colombia'
  })
  const mapbox = normalizeRealCandidate({
    name: 'Castillo de San Felipe de Barajas',
    latitude: 10.4228,
    longitude: -75.5374,
    placeId: 'mapbox:poi.456',
    coordinateSource: 'mapbox',
    address: 'Cartagena, Bolívar'
  }, {
    category: 'attraction',
    destination: 'Cartagena',
    country: 'Colombia'
  })

  assert.ok(osm)
  assert.ok(mapbox)
  const [merged] = mergeRealCandidates([osm, mapbox])
  assert.equal(merged.sourceCount, 2)
  assert.deepEqual(new Set(merged.sources), new Set(['osm', 'mapbox']))
  assert.equal(merged.providerEvidence.length, 2)
  assert.equal(merged.verificationStatus, 'verified')
})

test('hotels are catalog bases and not itinerary attractions', () => {
  const hotel = normalizeRealCandidate({
    name: 'Hotel Real Cartagena',
    latitude: 10.4,
    longitude: -75.5,
    coordinateSource: 'geoapify',
    placeId: 'geoapify:hotel-1'
  }, {
    category: 'hotel',
    destination: 'Cartagena',
    country: 'Colombia'
  })

  assert.ok(hotel)
  assert.equal(hotel.category, 'hotel')
  assert.equal(hotel.isAccommodationBase, true)
})

test('strict validation rejects a provider category that contradicts the requested role', () => {
  const wrongCategory = normalizeRealCandidate({
    name: 'Museo del Caribe',
    latitude: 10.99,
    longitude: -74.8,
    placeId: 'geoapify:restaurant-1',
    coordinateSource: 'geoapify',
    tags: { geoapifyCategories: ['catering.restaurant'] }
  }, {
    category: 'attraction',
    destination: 'Barranquilla',
    country: 'Colombia'
  })

  assert.equal(wrongCategory, null)
})

test('strict validation exposes identity and category evidence for accepted candidates', () => {
  const validation = validateCandidateIdentityAndCategory({
    name: 'Castillo San Felipe',
    latitude: 10.4229,
    longitude: -75.5375,
    placeId: 'osm:way/123',
    address: 'Cartagena de Indias',
    coordinateSource: 'osm',
    providerType: 'castle',
    tags: { historic: 'castle' }
  }, {
    category: 'attraction',
    destination: 'Cartagena',
    country: 'Colombia',
    centerLat: 10.42,
    centerLon: -75.54,
    radiusKm: 35
  })

  assert.equal(validation.ok, true)
  assert.equal(validation.identityStatus, 'strong')
  assert.equal(validation.categoryStatus, 'compatible')
  assert.ok(validation.canonicalId)
  assert.ok(validation.categoryEvidence.includes('type:castle'))
})
