import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace } from '../routes/ai.js'
import { isNonTouristFacility, isGenericFacilityName, KNOWN_ICONIC_LANDMARKS } from '../services/osm.js'
import {
  DESTINATION_ICONIC_LANDMARKS,
  DESTINATION_ICONIC_RESTAURANTS,
  getRealDestinationCatalog,
  isCountryMatch
} from '../services/openai.js'

test('1. isValidSpecificPlace and isNonTouristFacility must strictly reject resting plazas and hospital squares', () => {
  // Urban resting spots and bench areas from OSM
  assert.equal(isValidSpecificPlace('Plaza descanso 3'), false)
  assert.equal(isValidSpecificPlace('Plaza descanso 1'), false)
  assert.equal(isValidSpecificPlace('Plaza descanso'), false)
  assert.equal(isValidSpecificPlace('Parque descanso'), false)
  assert.equal(isValidSpecificPlace('Plazoleta descanso'), false)
  assert.equal(isValidSpecificPlace('descanso 3'), false)

  // Hospital squares
  assert.equal(isValidSpecificPlace('Plaza Hospital'), false)
  assert.equal(isValidSpecificPlace('Plaza Salud'), false)
  assert.equal(isValidSpecificPlace('Plazoleta Hospital'), false)

  // isNonTouristFacility checks
  assert.equal(isNonTouristFacility({ name: 'Plaza descanso 3' }), true)
  assert.equal(isNonTouristFacility({ name: 'Plaza Hospital' }), true)
  assert.equal(isNonTouristFacility({ name: 'Zona de descanso 2' }), true)

  // isGenericFacilityName checks
  assert.equal(isGenericFacilityName('Plaza descanso 3'), true)
  assert.equal(isGenericFacilityName('Plaza Hospital'), true)

  // Legitimate tourist attractions MUST remain valid
  assert.equal(isValidSpecificPlace('Ventana al Mundo'), true)
  assert.equal(isValidSpecificPlace('Gran Malecón del Río'), true)
  assert.equal(isValidSpecificPlace('Casa del Carnaval'), true)
  assert.equal(isValidSpecificPlace('Ciénaga de la Caimanera'), true)
  assert.equal(isValidSpecificPlace('Segunda Ensenada de Coveñas'), true)
})

test('2. isCountryMatch correctly validates target countries and rejects foreign countries', () => {
  assert.equal(isCountryMatch('Colombia', 'Colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'República de Colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'Brasil'), false)
  assert.equal(isCountryMatch('Colombia', 'Brazil'), false)
  assert.equal(isCountryMatch('Colombia', 'España'), false)
  assert.equal(isCountryMatch('Colombia', 'Spain'), false)
})

test('3. getRealDestinationCatalog for Barranquilla prioritizes iconic landmarks in top positions', async () => {
  const catalog = await getRealDestinationCatalog('Barranquilla', 'Colombia')
  assert.ok(catalog, 'Catalog must be generated for Barranquilla')
  assert.ok(Array.isArray(catalog.places), 'catalog.places must be an array')
  assert.ok(catalog.places.length >= 8, `Expected at least 8 places, got ${catalog.places.length}`)

  // Top positions MUST contain premier iconic landmarks
  const topPlaces = catalog.places.slice(0, 8)
  const hasVentana = topPlaces.some(p => p.toLowerCase().includes('ventana al mundo'))
  const hasMalecon = topPlaces.some(p => p.toLowerCase().includes('malecon') || p.toLowerCase().includes('malecón'))
  const hasCarnaval = topPlaces.some(p => p.toLowerCase().includes('carnaval'))

  assert.ok(hasVentana, `Top places should contain Ventana al Mundo, got: ${topPlaces.join(', ')}`)
  assert.ok(hasMalecon, `Top places should contain Gran Malecón, got: ${topPlaces.join(', ')}`)
  assert.ok(hasCarnaval, `Top places should contain Casa del Carnaval, got: ${topPlaces.join(', ')}`)

  // Must NOT contain non-tourist resting squares or hospital plazas
  for (const place of catalog.places) {
    assert.ok(!/\bdescanso\b/i.test(place), `Catalog should not contain resting areas: ${place}`)
    assert.ok(!/\bplaza\s+hospital\b/i.test(place), `Catalog should not contain hospital plazas: ${place}`)
  }

  // Restaurants must be local (no cross-city leak like Cartagena's La Mulata)
  for (const rest of catalog.restaurants) {
    const rName = typeof rest === 'string' ? rest : rest.name
    assert.ok(!rName.toLowerCase().includes('la mulata'), `Barranquilla should not have Cartagena restaurant: ${rName}`)
  }
})

test('4. Coveñas and Tolú no longer have static attraction, restaurant, or coordinate fallbacks', () => {
  for (const key of ['covenas', 'coveñas', 'tolu', 'santiago de tolu']) {
    assert.equal(DESTINATION_ICONIC_LANDMARKS[key], undefined)
  }
  for (const key of ['covenas', 'coveñas', 'golfo de morrosquillo']) {
    assert.equal(DESTINATION_ICONIC_RESTAURANTS[key], undefined)
  }
  for (const key of ['islas de san bernardo', 'isla mucura', 'isla tintipan', 'restaurante covenas', 'playa divina']) {
    assert.equal(KNOWN_ICONIC_LANDMARKS[key], undefined)
  }
})
