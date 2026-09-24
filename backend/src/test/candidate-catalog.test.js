import test from 'node:test'
import assert from 'node:assert/strict'
import {
  candidatesReferToSamePlace,
  createUnifiedCandidateCatalog,
  getProviderIdentity,
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

test('a destination without a preset and a small city can build a real candidate catalog', async () => {
  const catalog = await createUnifiedCandidateCatalog({
    destination: 'Santa Cruz de Mompox',
    country: 'Colombia',
    centerLat: 9.241,
    centerLon: -74.426,
    discoverProviders: false,
    existing: {
      places: [{
        name: 'Iglesia de Santa Bárbara',
        placeId: 'mapbox:mompox-santa-barbara',
        coordinateSource: 'mapbox',
        providerType: 'church',
        latitude: 9.2412,
        longitude: -74.4259,
        address: 'Mompox, Colombia'
      }],
      restaurants: [{
        name: 'Restaurante Momposino',
        placeId: 'geoapify:mompox-food-1',
        coordinateSource: 'geoapify',
        providerType: 'restaurant',
        providerCategory: 'restaurant',
        latitude: 9.2415,
        longitude: -74.4261,
        address: 'Mompox, Colombia'
      }]
    }
  })

  assert.equal(catalog.destination, 'Santa Cruz de Mompox')
  assert.equal(catalog.places.length, 1)
  assert.equal(catalog.restaurants.length, 1)
  assert.equal(catalog.places[0].candidateId, 'mapbox:mompox-santa-barbara')
})

test('provider IDs are normalized and retained independently of visible names', () => {
  assert.deepEqual(getProviderIdentity({
    placeId: 'mapbox:poi.123',
    coordinateSource: 'mapbox'
  }), { source: 'mapbox', id: 'poi.123', key: 'mapbox:poi.123' })
})

test('two names for the same physical place merge through a canonical identity', () => {
  const casa = normalizeRealCandidate({
    name: 'Casa del Carnaval',
    placeId: 'osm:way/1',
    coordinateSource: 'osm',
    providerType: 'museum',
    latitude: 10.989,
    longitude: -74.788,
    address: 'Barranquilla, Colombia'
  }, { category: 'attraction', destination: 'Barranquilla', country: 'Colombia' })
  const museo = normalizeRealCandidate({
    name: 'Museo del Carnaval',
    placeId: 'mapbox:poi.2',
    coordinateSource: 'mapbox',
    providerType: 'museum',
    latitude: 10.9891,
    longitude: -74.7881,
    address: 'Barranquilla, Colombia'
  }, { category: 'attraction', destination: 'Barranquilla', country: 'Colombia' })

  assert.ok(casa)
  assert.ok(museo)
  assert.equal(casa.canonicalId, 'canonical:barranquilla-carnaval-house-museum')
  assert.equal(candidatesReferToSamePlace(casa, museo), true)
  const [merged] = mergeRealCandidates([casa, museo])
  assert.equal(merged.sourceCount, 2)
  assert.equal(merged.providerIds.osm, 'way/1')
  assert.equal(merged.providerIds.mapbox, 'poi.2')
})

test('two places with similar words remain distinct when provider IDs and coordinates differ', () => {
  const ventana = normalizeRealCandidate({
    name: 'Ventana al Mundo',
    placeId: 'mapbox:poi.ventana-mundo',
    coordinateSource: 'mapbox',
    providerType: 'monument',
    latitude: 11.019,
    longitude: -74.833,
    address: 'Barranquilla, Colombia'
  }, { category: 'attraction', destination: 'Barranquilla', country: 'Colombia' })
  const aleta = normalizeRealCandidate({
    name: 'Aleta del Tiburón (Ventana de Campeones)',
    placeId: 'geoapify:poi.aleta-tiburon',
    coordinateSource: 'geoapify',
    providerType: 'monument',
    latitude: 11.006,
    longitude: -74.817,
    address: 'Barranquilla, Colombia'
  }, { category: 'attraction', destination: 'Barranquilla', country: 'Colombia' })

  assert.ok(ventana)
  assert.ok(aleta)
  assert.equal(candidatesReferToSamePlace(ventana, aleta), false)
  assert.equal(mergeRealCandidates([ventana, aleta]).length, 2)
})
