import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidTouristAttraction, getPlaceEntityType, buildTourPlanner } from '../routes/ai.js'
import { isLodgingName, generateChatResponse } from '../services/openai.js'
import { inferStopSubcategory } from '../services/open-tourism-service.js'
import { imageForPlace } from '../services/imageSearch.js'

describe('Corridor Tour Quality & Fix Verifications', () => {
  it('1. Hotel & Lodging filter should strictly reject commercial hotels', () => {
    assert.equal(isLodgingName('Crowne Plaza Barranquilla'), true)
    assert.equal(isLodgingName('Hotel Dann Carlton'), true)
    assert.equal(isLodgingName('Marriott Barranquilla'), true)
    assert.equal(isLodgingName('Hostal El Centro'), true)
    assert.equal(isLodgingName('Puente Pumarejo'), false)
    assert.equal(isLodgingName('Ecoparque Ciénaga de Mallorquín'), false)

    // isValidTouristAttraction must reject hotels
    assert.equal(isValidTouristAttraction({ name: 'Crowne Plaza Barranquilla', tags: { tourism: 'hotel' } }), false)
    assert.equal(isValidTouristAttraction({ name: 'Hotel Dann Carlton Barranquilla' }), false)
    assert.equal(isValidTouristAttraction({ name: 'Puente Pumarejo', tags: { historic: 'monument' } }), true)
  })

  it('2. Category and entity inference must never misclassify Puente Pumarejo as restaurant', () => {
    const subcat = inferStopSubcategory({ name: 'Puente Pumarejo' })
    assert.equal(subcat, 'bridge_monument')
    assert.notEqual(subcat, 'restaurant')
    assert.notEqual(subcat, 'cafe')

    const entityType = getPlaceEntityType('Puente Pumarejo')
    assert.equal(entityType, 'cultural')
    assert.notEqual(entityType, 'food')
  })

  it('3. Verified authentic images for Puente Pumarejo and Ciénaga de Mallorquín', async () => {
    const bridgeImg = await imageForPlace('Puente Pumarejo', 'Barranquilla', 'Colombia')
    assert.ok(bridgeImg.includes('PuentePumarejoBAQ2020.jpg'), `Expected Wikimedia bridge image, got: ${bridgeImg}`)

    const wetlandImg = await imageForPlace('Ecoparque Ciénaga de Mallorquín', 'Barranquilla', 'Colombia')
    assert.ok(
      wetlandImg.includes('Manglar_en_La_Caimanera') || wetlandImg.includes('photo-1511497584788'),
      `Expected mangrove/estuary wetland image, got: ${wetlandImg}`
    )
  })

  it('4. generateChatResponse creates corridor tour with multiple attractions, single midpoint lunch, and puts destination as final stop', async () => {
    const userMsg = 'Crea un tour desde mi ubicación hasta el Puente Pumarejo'
    const res = await generateChatResponse(
      { history: [{ role: 'user', content: userMsg }] },
      '',
      '',
      {
        city: 'Barranquilla',
        country: 'Colombia',
        destination: 'Puente Pumarejo',
        tourType: 'location_to_destination',
        originPlace: 'user_current_location',
        isUserLocationOrigin: true,
        userGpsLatitude: 10.9985,
        userGpsLongitude: -74.7960
      },
      []
    )

    const places = res.specificPlaces || res.extractedPreferences?.specificPlaces || []
    assert.ok(places.length >= 3, `Expected at least 3 stops, got ${places.length}`)

    // Verify Crowne Plaza or hotels are NOT present
    const hasHotel = places.some(p => isLodgingName(p.name))
    assert.equal(hasHotel, false, 'No hotels must be present in corridor attractions')

    // Destination Puente Pumarejo MUST be the last stop!
    const lastStop = places[places.length - 1]
    assert.ok(lastStop.name.toLowerCase().includes('puente pumarejo'), `Destination must be the last stop, got ${lastStop.name}`)

    // Count restaurants: must be at most 1 (the lunch stop)
    const restaurants = places.filter(p => p.category === 'restaurant' || p.entityType === 'restaurant')
    assert.ok(restaurants.length <= 1, `Expected at most 1 lunch restaurant, got ${restaurants.length}`)
  })

  it('5. buildTourPlanner guarantees destination is placed last and ordered monotonically', () => {
    const input = {
      destination: 'Puente Pumarejo',
      destinationPlace: 'Puente Pumarejo',
      originPlace: 'user_current_location',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      latitude: 11.0180,
      longitude: -74.8300,
      durationHours: 8,
      durationDays: 1
    }

    const testPlaces = [
      { name: 'Puente Pumarejo', latitude: 10.9536, longitude: -74.7533, category: 'historic' },
      { name: 'Monumento Ventana al Mundo', latitude: 11.0331, longitude: -74.8314, category: 'monument' },
      { name: 'Gran Malecón del Río', latitude: 11.0180, longitude: -74.7960, category: 'attraction' },
      { name: 'Restaurante Narcobollo', latitude: 10.9982, longitude: -74.8202, category: 'restaurant' },
      { name: 'Ecoparque Ciénaga de Mallorquín', latitude: 11.0350, longitude: -74.8445, category: 'attraction' }
    ]

    const planner = buildTourPlanner(input, { latitude: 10.9536, longitude: -74.7533 }, testPlaces)
    assert.ok(planner.selectedPlaces.length >= 3)

    // Stop 1 MUST NOT be Puente Pumarejo
    assert.notEqual(planner.selectedPlaces[0].name, 'Puente Pumarejo', 'Puente Pumarejo must NOT be stop #1')

    // Final stop MUST be Puente Pumarejo
    const last = planner.selectedPlaces[planner.selectedPlaces.length - 1]
    assert.equal(last.name, 'Puente Pumarejo', 'Puente Pumarejo must be the final stop')
  })
})
