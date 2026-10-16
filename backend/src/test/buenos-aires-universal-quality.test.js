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

  await t.test('4. ensureBalancedMultiDayItineraryText eliminates repeated restaurants across days (e.g. Barbetta, Sylvia\'s Restaurant) and guarantees 2 attractions + 1 restaurant without duplicates', () => {
    const rawNewYorkItin = `
Aquí tienes tu itinerario para Nueva York:

Día 1: Midtown y Broadway
 • Central Park
 • Barbetta
 • Sylvia's Restaurant

Día 2: Rascacielos Icónicos
 • Empire State Building
 • Top of the Rock

Día 3: Museos y Cultura
 • The Metropolitan Museum of Art
 • Solomon R. Guggenheim Museum
 • Barbetta

Día 4: Downtown y Memorial
 • National September 11 Memorial & Museum
 • One World Trade Center
 • Delmonico's

Día 5: Brooklyn y Vistas
 • Brooklyn Bridge
 • DUMBO Manhattan Bridge View
 • Lombardi's Pizza

Día 6: Estatua de la Libertad e Historia
 • Estatua de la Libertad
 • Ellis Island
 • Sarge's Delicatessen

Día 7: Hudson Yards y High Line
 • High Line
 • The Vessel
 • Peter Luger Steak House

¿Qué te parece este plan?`

    const mockCatalog = {
      places: [
        'Central Park', 'Empire State Building', 'Top of the Rock',
        'The Metropolitan Museum of Art', 'Solomon R. Guggenheim Museum',
        'National September 11 Memorial & Museum', 'One World Trade Center',
        'Brooklyn Bridge', 'DUMBO Manhattan Bridge View',
        'Estatua de la Libertad', 'Ellis Island',
        'High Line', 'The Vessel', 'Times Square'
      ],
      restaurants: [
        { name: 'Barbetta' },
        { name: 'Sylvia\'s Restaurant' },
        { name: 'Delmonico\'s' },
        { name: 'Lombardi\'s Pizza' },
        { name: 'Sarge\'s Delicatessen' },
        { name: 'Peter Luger Steak House' },
        { name: 'Katz\'s Delicatessen' }
      ]
    }

    const parsedExtracted = {
      specificPlaces: [
        { name: 'Barbetta', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Sylvia\'s Restaurant', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Delmonico\'s', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Lombardi\'s Pizza', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Sarge\'s Delicatessen', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Peter Luger Steak House', category: 'restaurant', entityType: 'restaurant' },
        { name: 'Katz\'s Delicatessen', category: 'restaurant', entityType: 'restaurant' }
      ]
    }

    const balanced = ensureBalancedMultiDayItineraryText(
      rawNewYorkItin,
      'Nueva York',
      mockCatalog,
      parsedExtracted,
      { numDays: 7 }
    )

    // Check Barbetta count in the balanced text
    const barbettaMatches = balanced.match(/Barbetta/gi) || []
    assert.equal(barbettaMatches.length, 1, `Barbetta must only appear ONCE in the entire itinerary, but appeared ${barbettaMatches.length} times`)

    const sylviaMatches = balanced.match(/Sylvia's Restaurant/gi) || []
    assert.equal(sylviaMatches.length, 1, `Sylvia's Restaurant must only appear ONCE, but appeared ${sylviaMatches.length} times`)

    const allStops = []
    for (let day = 1; day <= 7; day++) {
      const dayRegex = new RegExp(`D[íi]a\\s+${day}[\\s\\S]*?(?=D[íi]a\\s+\\d+|\\n\\n¿|$)`, 'i')
      const match = balanced.match(dayRegex)
      assert.ok(match, `Día ${day} must be present in balanced itinerary`)
      const bulletLines = match[0].split('\n').filter(l => l.trim().startsWith('•'))
      assert.equal(bulletLines.length, 3, `Día ${day} must have exactly 3 stops (2 attractions + 1 restaurant). Got: ${bulletLines.join(', ')}`)

      for (const b of bulletLines) {
        const placeName = b.replace(/^[•\s]+/, '').trim()
        assert.ok(!allStops.includes(placeName), `Place "${placeName}" was duplicated across days!`)
        allStops.push(placeName)
      }
    }

    assert.equal(allStops.length, 21, `Expected exactly 21 unique stops for 7 days, got ${allStops.length}`)

    // Check parsedExtracted.specificPlaces has all 21 items with proper categories
    assert.ok(Array.isArray(parsedExtracted.specificPlaces), 'parsedExtracted.specificPlaces must be an array')
    assert.equal(parsedExtracted.specificPlaces.length, 21, `Expected 21 specificPlaces, got ${parsedExtracted.specificPlaces.length}`)
    const foodStops = parsedExtracted.specificPlaces.filter(p => p.category === 'restaurant')
    assert.equal(foodStops.length, 7, `Expected exactly 7 restaurant specificPlaces, got ${foodStops.length}`)
    const attrStops = parsedExtracted.specificPlaces.filter(p => p.category === 'attraction')
    assert.equal(attrStops.length, 14, `Expected exactly 14 attraction specificPlaces, got ${attrStops.length}`)
  })
})
