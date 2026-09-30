import test from 'node:test'
import assert from 'node:assert/strict'
import { isNonTouristFacility, isGenericFacilityName, arePlacesSimilar } from '../services/osm.js'
import { isValidSpecificPlace, isValidTouristAttraction, canonicalPlaceKey } from '../routes/ai.js'
import { canonicalChatPlaceKey } from '../services/openai.js'
import { isImageSemanticallyCompatible, isWikiTitleRelevant, imageForPlace } from '../services/imageSearch.js'
import { clusterStopsIntoCoherentDays } from '../services/open-tourism-service.js'

test('Universal Tour Planner Fidelity & Anti-Degradation Suite', async (t) => {
  await t.test('1. Universal rejection of travel agencies and commercial booking offices', () => {
    // OSM tags
    assert.equal(isNonTouristFacility({ name: 'Viajes Globales', tags: { tourism: 'travel_agency' } }), true)
    assert.equal(isNonTouristFacility({ name: 'World Tours', tags: { shop: 'travel_agency' } }), true)
    assert.equal(isNonTouristFacility({ name: 'Commercial Tickets', tags: { office: 'travel_agency' } }), true)

    // Names in multiple languages and formats
    assert.equal(isNonTouristFacility({ name: 'Agencia de Viajes y Turismo Internacional' }), true)
    assert.equal(isNonTouristFacility({ name: 'Tour Operator Colombia' }), true)
    assert.equal(isNonTouristFacility({ name: 'Venta de Tiquetes Aéreos' }), true)
    assert.equal(isNonTouristFacility({ name: 'Asesores de Viajes del Norte' }), true)

    // isValidSpecificPlace and isValidTouristAttraction rejection
    assert.equal(isValidSpecificPlace('Agencia de Viajes Destinos'), false)
    assert.equal(isValidSpecificPlace('Tour Operator Local'), false)
    assert.equal(isValidTouristAttraction({ name: 'Agencia de Viajes Express', tags: {} }), false)
    assert.equal(isValidTouristAttraction({ name: 'Venta de tiquetes', tags: { tourism: 'travel_agency' } }), false)

    // Legitimate landmarks should still be valid
    assert.equal(isValidSpecificPlace('Catedral de San José'), true)
    assert.equal(isValidSpecificPlace('Parque Santander'), true)
    assert.equal(isValidTouristAttraction({ name: 'Parque Santander', tags: { leisure: 'park' } }), true)
  })

  await t.test('2. Universal rejection of isolated generic facility names', () => {
    assert.equal(isGenericFacilityName('Parque Nacional'), true)
    assert.equal(isGenericFacilityName('Plaza de Mercado'), true)
    assert.equal(isGenericFacilityName('Centro Comercial'), true)
    assert.equal(isGenericFacilityName('Centro Histórico'), true)

    assert.equal(isValidSpecificPlace('Parque Nacional'), false)
    assert.equal(isValidSpecificPlace('Centro Comercial'), false)

    // But specific proper names are preserved
    assert.equal(isGenericFacilityName('Parque Nacional Natural Tayrona'), false)
    assert.equal(isValidSpecificPlace('Parque Santander'), true)
  })

  await t.test('3. Connector-insensitive deduplication ("Malecón Cúcuta" vs "Malecón de Cúcuta")', () => {
    assert.equal(arePlacesSimilar('Malecón Cúcuta', 'Malecón de Cúcuta'), true)
    assert.equal(arePlacesSimilar('Plaza Mayor', 'Plaza de la Mayor'), true)
    assert.equal(arePlacesSimilar('Mirador del Valle', 'Mirador Valle'), true)

    // Canonical keys should collide
    const keyWithConnector = canonicalChatPlaceKey('Malecón de Cúcuta')
    const keyWithoutConnector = canonicalChatPlaceKey('Malecón Cúcuta')
    assert.equal(keyWithConnector, keyWithoutConnector)
  })

  await t.test('4. Continuous day invariant (1..numDays) in day clustering', () => {
    const sparseAttractions = [
      { name: 'Monumento Cristo Rey', latitude: 7.89, longitude: -72.50 },
      { name: 'Parque Santander', latitude: 7.88, longitude: -72.51 },
      { name: 'Biblioteca Julio Pérez Ferrero', latitude: 7.885, longitude: -72.505 },
      { name: 'Casa Natal de Santander', latitude: 7.83, longitude: -72.45 },
      { name: 'Templo Histórico', latitude: 7.835, longitude: -72.455 }
    ]
    const restaurants = [
      { name: 'Restaurante El Paisa', latitude: 7.89, longitude: -72.50 },
      { name: 'Restaurante Spezia', latitude: 7.88, longitude: -72.51 }
    ]

    const numDays = 7
    const clusteredDays = clusterStopsIntoCoherentDays(sparseAttractions, restaurants, {
      numDays,
      city: 'Cúcuta',
      candidatePlaces: sparseAttractions
    })

    // Must generate exactly 7 continuous days (Day 1 through Day 7)
    assert.equal(clusteredDays.length, 7)
    for (let d = 1; d <= numDays; d++) {
      const dayObj = clusteredDays.find((cd) => cd.day === d)
      assert.ok(dayObj, `Day ${d} must exist in clustered days`)
      assert.ok(dayObj.stops.length > 0, `Day ${d} must have at least one stop`)
    }
  })

  await t.test('5. Image compatibility & rejection of sports club badges/emblems', async () => {
    // Rejection of graphics/logos/crests
    assert.equal(isImageSemanticallyCompatible('https://example.com/logo_deportivo.png', 'Cúcuta'), false)
    assert.equal(isImageSemanticallyCompatible('https://example.com/escudo_centenario.png', 'Cúcuta'), false)
    assert.equal(isImageSemanticallyCompatible('https://example.com/badge_crest.jpg', 'Cúcuta'), false)
    assert.equal(isImageSemanticallyCompatible('https://example.com/Cucuta_Deportivo_Centenario_2024.png', 'Cúcuta'), false)

    // Rejection of sports club article titles for city/destination searches
    assert.equal(isWikiTitleRelevant('Cúcuta Deportivo', 'Cúcuta', 'Cúcuta'), false)
    assert.equal(isWikiTitleRelevant('Sevilla Fútbol Club', 'Sevilla', 'Sevilla'), false)
    assert.equal(isWikiTitleRelevant('Real Madrid Club de Fútbol', 'Madrid', 'Madrid'), false)
    assert.equal(isWikiTitleRelevant('Gobierno de Cúcuta', 'Cúcuta', 'Cúcuta'), false)

    // Acceptance of actual city and landmark articles
    assert.equal(isWikiTitleRelevant('Cúcuta', 'Cúcuta', 'Cúcuta'), true)
    assert.equal(isWikiTitleRelevant('Parque Santander (Cúcuta)', 'Parque Santander', 'Cúcuta'), true)

    // Universal resolution of Cúcuta cover image must be a scenic city photo, never the football badge
    const coverUrl = await imageForPlace('Cúcuta', 'Cúcuta', 'Colombia')
    assert.ok(coverUrl, 'Cover URL must be found')
    assert.equal(coverUrl.includes('Deportivo'), false, 'Cover must not be a football club badge')
    assert.equal(coverUrl.includes('Centenario'), false, 'Cover must not be centenario football emblem')
    assert.ok(coverUrl.includes('Panor') || coverUrl.includes('San_Jos'), 'Cover should be a panoramic view of the city')
  })
})
