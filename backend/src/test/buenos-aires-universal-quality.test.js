import test from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getRealDestinationCatalog, ensureBalancedMultiDayItineraryText, resetOpenAiCircuitBreaker } from '../services/openai.js'
import { isLowQualityOrFastFoodVenue, isGenericFacilityName } from '../services/open-tourism-service.js'
import { isNonTouristFacility } from '../services/osm.js'

test('Universal AI City Discovery & Quality Suite: Buenos Aires', async (t) => {
  await t.test('1. Quality filters strictly reject chains and administrative facilities', () => {
    assert.equal(isLowQualityOrFastFoodVenue('Starbucks'), true, 'Starbucks must be rejected as chain')
    assert.equal(isLowQualityOrFastFoodVenue('McDonald\'s'), true, 'McDonalds must be rejected')
    assert.equal(isLowQualityOrFastFoodVenue('Café Tortoni'), false, 'Café Tortoni must be accepted')
    assert.equal(isLowQualityOrFastFoodVenue('Don Julio'), false, 'Don Julio must be accepted')

    assert.equal(isNonTouristFacility({ name: 'Turismo ISSN' }), true, 'Turismo ISSN must be rejected')
    assert.equal(isNonTouristFacility({ name: 'Lavadero Gran Turismo' }), true, 'Lavadero must be rejected')
    assert.equal(isNonTouristFacility({ name: 'Instituto de Formación Superior en Turismo' }), true, 'Institute must be rejected')
    assert.equal(isNonTouristFacility({ name: 'Cementerio de la Recoleta' }), false, 'Recoleta must be accepted as heritage')
    assert.equal(isNonTouristFacility({ name: 'Teatro Colón' }), false, 'Teatro Colón must be accepted')
    assert.equal(isNonTouristFacility({ name: 'Obelisco' }), false, 'Obelisco must be accepted')

    assert.equal(isGenericFacilityName('Restaurante Bar'), true, 'Restaurante Bar must be flagged generic')
    assert.equal(isGenericFacilityName('Restaurante Chino'), true, 'Restaurante Chino must be flagged generic')
    assert.equal(isGenericFacilityName('Turismo ISSN'), true, 'Turismo ISSN must be flagged generic')
  })

  await t.test('2. getRealDestinationCatalog dynamically discovers iconic landmarks and authentic dining for Buenos Aires', async () => {
    resetOpenAiCircuitBreaker()
    const catalog = await getRealDestinationCatalog('Buenos Aires', 'Argentina', -34.6037, -58.3816, { requestedDays: 7 })
    assert.ok(catalog, 'Catalog must be generated')
    assert.ok(catalog.places.length >= 14, `Expected at least 14 places for 7 days, got ${catalog.places.length}`)
    assert.ok(catalog.restaurants.length >= 7, `Expected at least 7 restaurants for 7 days, got ${catalog.restaurants.length}`)

    const placeNames = catalog.places.map(p => (typeof p === 'string' ? p : p.name).toLowerCase())
    const restNames = catalog.restaurants.map(r => (typeof r === 'string' ? r : r.name).toLowerCase())

    // Must NOT contain low-quality or non-tourist venues
    assert.ok(!placeNames.some(p => p.includes('turismo issn')), 'Must not contain Turismo ISSN')
    assert.ok(!placeNames.some(p => p.includes('lavadero')), 'Must not contain Lavadero')
    assert.ok(!restNames.some(r => r.includes('starbucks')), 'Must not contain Starbucks')

    // Every place must have valid coordinates verified for OpenFreeMap
    for (const p of catalog.places) {
      if (typeof p === 'object') {
        assert.ok(Number.isFinite(p.latitude) && Number.isFinite(p.longitude), `Place ${p.name} must have valid coordinates`)
      }
    }
  })

  await t.test('3. ensureBalancedMultiDayItineraryText guarantees 2 attractions + 1 restaurant for all 7 days', () => {
    const fakeRawItin = `
Aquí tienes tu itinerario para Buenos Aires:

Día 1: Obelisco y Centro
 • Obelisco de Buenos Aires
 • Teatro Colón
 • Café Tortoni

Día 2: Plaza de Mayo y San Telmo
 • Plaza de Mayo
 • Casa Rosada
 • El Federal

Día 3: La Boca y Caminito
 • Caminito
 • Estadio La Bombonera
 • El Obrero

Día 4: Recoleta Cultural
 • Cementerio de la Recoleta
 • Museo Nacional de Bellas Artes
 • La Biela

Día 5: Puerto Madero
 • Puente de la Mujer
 • Fragata Sarmiento

Día 6: Palermo y Jardines
 • Jardín Japonés
 • Rosedal de Palermo

Día 7: Arte y Despedida
 • MALBA
 • Centro Cultural Recoleta

¿Qué te parece este plan?`

    const mockCatalog = {
      places: [
        'Obelisco de Buenos Aires', 'Teatro Colón', 'Plaza de Mayo', 'Casa Rosada',
        'Caminito', 'Estadio La Bombonera', 'Cementerio de la Recoleta', 'Museo Nacional de Bellas Artes',
        'Puente de la Mujer', 'Fragata Sarmiento', 'Jardín Japonés', 'Rosedal de Palermo',
        'MALBA', 'Centro Cultural Recoleta'
      ],
      restaurants: [
        { name: 'Café Tortoni' }, { name: 'El Federal' }, { name: 'El Obrero' },
        { name: 'La Biela' }, { name: 'Don Julio' }, { name: 'La Cabrera' }, { name: 'Cabaña Las Lilas' }
      ]
    }

    const balanced = ensureBalancedMultiDayItineraryText(
      fakeRawItin,
      'Buenos Aires',
      mockCatalog,
      {},
      { numDays: 7 }
    )

    for (let day = 1; day <= 7; day++) {
      const dayRegex = new RegExp(`D[íi]a\\s+${day}[\\s\\S]*?(?=D[íi]a\\s+\\d+|\\n\\n¿|$)`, 'i')
      const match = balanced.match(dayRegex)
      assert.ok(match, `Día ${day} must be present in balanced itinerary`)
      const bulletLines = match[0].split('\n').filter(l => l.trim().startsWith('•'))
      assert.equal(bulletLines.length, 3, `Día ${day} must have exactly 3 stops (2 attractions + 1 restaurant). Got: ${bulletLines.join(', ')}`)
    }
  })
})
