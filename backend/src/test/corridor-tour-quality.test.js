import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidTouristAttraction, getPlaceEntityType, buildTourPlanner, collectCorridorCandidates } from '../routes/ai.js'
import { isLodgingName, generateChatResponse, extractChatInformationFallback } from '../services/openai.js'
import { inferStopSubcategory } from '../services/open-tourism-service.js'
import { imageForPlace } from '../services/imageSearch.js'
import { computeCorridorProjection, isWithinCorridor } from '../services/osm.js'

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

  it('6. extractChatInformationFallback handles sentences with periods and punctuation cleanly', () => {
    const promptWithDot = 'Crea un tour desde mi Ubicación hasta el Paseo Bolívar.'
    const extracted = extractChatInformationFallback(promptWithDot)
    assert.equal(extracted.tourType, 'location_to_destination')
    assert.equal(extracted.isUserLocationOrigin, true)
    assert.equal(extracted.originPlace, 'user_current_location')
    assert.equal(extracted.destination, 'Paseo Bolívar')
    assert.equal(extracted.destinationPlace, 'Paseo Bolívar')

    const promptExclamation = 'Haz un recorrido desde donde estoy al Gran Malecón del Río!'
    const extracted2 = extractChatInformationFallback(promptExclamation)
    assert.equal(extracted2.tourType, 'location_to_destination')
    assert.equal(extracted2.destination, 'Gran Malecón Del Río')
  })

  it('7. generateChatResponse overrides old sticky destination when a new corridor route is requested', async () => {
    const userMsg = 'Crea un tour desde mi Ubicación hasta el Paseo Bolívar.'
    // State previously had Puerto Colombia stored
    const previousStateWithPuertoColombia = {
      destination: 'Malecón de Puerto Colombia',
      city: 'Puerto Colombia',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      userGpsLatitude: 11.0041,
      userGpsLongitude: -74.8070,
      canonicalDestination: {
        displayName: 'Puerto Colombia, Atlántico',
        city: 'Puerto Colombia',
        latitude: 10.9878,
        longitude: -74.9547
      }
    }

    const res = await generateChatResponse(
      { history: [{ role: 'user', content: userMsg }] },
      '',
      '',
      previousStateWithPuertoColombia,
      []
    )

    // The response message and itinerary must be for Paseo Bolívar, NOT Puerto Colombia
    assert.ok(
      res.responseMessage.toLowerCase().includes('paseo bolívar') || res.responseMessage.toLowerCase().includes('paseo bolivar'),
      `Response should mention Paseo Bolívar, got: ${res.responseMessage}`
    )
    assert.ok(
      !res.responseMessage.toLowerCase().includes('hacia puerto colombia'),
      `Response must NOT route towards Puerto Colombia`
    )

    const places = res.specificPlaces || res.extractedPreferences?.specificPlaces || []
    assert.ok(places.length >= 2, `Expected at least 2 stops, got ${places.length}`)

    // Puerto Colombia places like Castillo de Salgar or Salgarito Beach Club must NOT be present
    const hasSalgar = places.some(p => p.name.toLowerCase().includes('salgar') || p.name.toLowerCase().includes('puerto colombia'))
    assert.equal(hasSalgar, false, 'Stops heading to Paseo Bolívar must never include Puerto Colombia or Salgar')

    // Last stop must be Paseo Bolívar
    const lastStop = places[places.length - 1]
    assert.ok(
      lastStop.name.toLowerCase().includes('paseo bolívar') || lastStop.name.toLowerCase().includes('paseo bolivar'),
      `Final stop must be Paseo Bolívar, got: ${lastStop.name}`
    )
  })

  it('8. buildTourPlanner faithfully preserves chat-confirmed selectedPlaces and NEVER includes Tu ubicación actual as a stop', () => {
    const input = {
      destination: 'Estadio Moderno Julio Torres',
      destinationPlace: 'Estadio Moderno Julio Torres',
      originPlace: 'user_current_location',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      latitude: 11.0180,
      longitude: -74.8500,
      durationHours: 8,
      durationDays: 1,
      selectedPlaces: [
        'Ecoparque Ciénaga de Mallorquín',
        'Parque Sagrado Corazón',
        'Restaurante El Celler',
        'Parque Washington',
        'La Troja',
        'Estadio Moderno Julio Torres'
      ]
    }

    // Candidate pack from live Overpass query returns unrelated POIs along corridor
    const overpassPlaces = [
      { name: 'Museo Mapuka', latitude: 11.0195, longitude: -74.8505, category: 'museum' },
      { name: 'Monumento a Jose Martí', latitude: 11.0020, longitude: -74.8250, category: 'monument' },
      { name: 'Museo Bibliográfico de Autores del Caribe', latitude: 10.9950, longitude: -74.8100, category: 'museum' },
      { name: 'Mirador de la Riviera', latitude: 10.9900, longitude: -74.8050, category: 'viewpoint' },
      { name: 'Zoológico de Barranquilla', latitude: 11.0080, longitude: -74.8020, category: 'attraction' }
    ]

    const planner = buildTourPlanner(input, { latitude: 11.0180, longitude: -74.8500 }, overpassPlaces)

    const stopNames = planner.selectedPlaces.map(p => p.name)

    // 1. "Tu ubicación actual" MUST NEVER be a stop in the tour
    const hasUserLocationStop = stopNames.some(name => name.toLowerCase().includes('tu ubicación') || name.toLowerCase().includes('tu ubicacion'))
    assert.equal(hasUserLocationStop, false, '"Tu ubicación actual" must NOT appear as a tourist stop')

    // 2. Chat-confirmed places must ALL be preserved in the generated tour (SSOT)
    assert.ok(stopNames.some(n => n.includes('Ciénaga de Mallorquín') || n.includes('Mallorquín')), 'Must include Ciénaga de Mallorquín')
    assert.ok(stopNames.some(n => n.includes('Sagrado Corazón')), 'Must include Parque Sagrado Corazón')
    assert.ok(stopNames.some(n => n.includes('El Celler')), 'Must include Restaurante El Celler')
    assert.ok(stopNames.some(n => n.includes('Parque Washington')), 'Must include Parque Washington')
    assert.ok(stopNames.some(n => n.includes('La Troja')), 'Must include La Troja')
    assert.ok(stopNames.some(n => n.includes('Estadio Moderno Julio Torres')), 'Must include Estadio Moderno Julio Torres')

    // 3. Destination must ALWAYS be the final stop
    const finalStop = planner.selectedPlaces[planner.selectedPlaces.length - 1]
    assert.equal(finalStop.name, 'Estadio Moderno Julio Torres', 'Destination must be the final stop')
  })

  it('9. collectCorridorCandidates excludes user origin from selected array and injects chat places', async () => {
    const input = {
      destination: 'Estadio Moderno Julio Torres',
      destinationPlace: 'Estadio Moderno Julio Torres',
      originPlace: 'user_current_location',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      latitude: 11.0180,
      longitude: -74.8500,
      city: 'Barranquilla',
      country: 'Colombia',
      selectedPlaces: [
        'Parque Sagrado Corazón',
        'La Troja',
        'Estadio Moderno Julio Torres'
      ]
    }

    const corridorResults = await collectCorridorCandidates(input, { latitude: 11.0180, longitude: -74.8500, city: 'Barranquilla', country: 'Colombia' })

    // "Tu ubicación actual" must NOT be in the returned candidates list as an attraction
    const hasUserLoc = corridorResults.some(p => (p.name || '').toLowerCase().includes('tu ubicación') || (p.name || '').toLowerCase().includes('tu ubicacion'))
    assert.equal(hasUserLoc, false, 'User location origin must not be included in candidate list')

    // Injected chat places must be present
    const names = corridorResults.map(p => p.name)
    assert.ok(names.some(n => n.includes('La Troja')), 'La Troja should be in corridor candidates')
    assert.ok(names.some(n => n.includes('Sagrado Corazón')), 'Parque Sagrado Corazón should be in corridor candidates')
  })

  it('10. Universal corridor projection rejects opposite-direction or severe-detour landmarks (e.g. Puente Pumarejo) while accepting valid route stops', () => {
    const startPlace = { name: 'Soledad Terminal', latitude: 10.9254, longitude: -74.7958 }
    const endPlace = { name: 'Gran Malecón del Río', latitude: 11.0050, longitude: -74.7800 }

    // Puente Pumarejo is far east (~4km cross-track on an ~8.9km route vector) - MUST be rejected!
    const pumarejo = { name: 'Puente Pumarejo', latitude: 10.9536, longitude: -74.7533 }
    const projPumarejo = computeCorridorProjection(pumarejo, startPlace, endPlace)
    assert.ok(projPumarejo.crossTrackMeters > 3000, `Puente Pumarejo cross-track must be > 3000m, was ${projPumarejo.crossTrackMeters}`)
    assert.equal(isWithinCorridor(pumarejo, startPlace, endPlace), false, 'Puente Pumarejo must be rejected by isWithinCorridor')
    assert.equal(isWithinCorridor(pumarejo, startPlace, endPlace, true), false, 'Puente Pumarejo must be rejected even in relaxed corridor')

    // Malambo is south (opposite direction to the northward trip to Malecón) - MUST be rejected (t < 0)
    const malambo = { name: 'Malambo Centro', latitude: 10.8600, longitude: -74.7700 }
    const projMalambo = computeCorridorProjection(malambo, startPlace, endPlace)
    assert.ok(projMalambo.t < 0, 'Malambo must have negative forward projection t')
    assert.equal(isWithinCorridor(malambo, startPlace, endPlace), false, 'Backward place must be rejected')

    // Museo del Atlántico is on the forward corridor (t ~ 0.73, crossTrack < 1500m) - MUST be accepted!
    const museoAtlantico = { name: 'Museo del Atlántico', latitude: 10.9840, longitude: -74.7797 }
    const projMuseo = computeCorridorProjection(museoAtlantico, startPlace, endPlace)
    assert.ok(projMuseo.t > 0.5 && projMuseo.t < 0.9, 'Museo del Atlántico must be along the travel progression')
    assert.ok(projMuseo.crossTrackMeters < 1500, 'Museo del Atlántico cross-track must be within corridor')
    assert.equal(isWithinCorridor(museoAtlantico, startPlace, endPlace), true, 'Museo del Atlántico must be accepted')
  })

  it('11. generateChatResponse for Soledad to Gran Malecón tour never suggests Puente Pumarejo and maintains forward monotonic progress', async () => {
    const userMsg = 'Crea un tour desde mi ubicación hasta el Gran Malecón del Río'
    const res = await generateChatResponse(
      { history: [{ role: 'user', content: userMsg }] },
      '',
      '',
      {
        city: 'Barranquilla',
        country: 'Colombia',
        destination: 'Gran Malecón del Río',
        tourType: 'location_to_destination',
        originPlace: 'user_current_location',
        isUserLocationOrigin: true,
        userGpsLatitude: 10.9254,
        userGpsLongitude: -74.7958
      },
      []
    )

    const places = res.specificPlaces || res.extractedPreferences?.specificPlaces || []
    assert.ok(places.length >= 2, `Expected at least 2 stops, got ${places.length}`)

    // 1. Puente Pumarejo MUST NEVER appear as a stop
    const hasPumarejo = places.some(p => (p.name || '').toLowerCase().includes('pumarejo'))
    assert.equal(hasPumarejo, false, 'Puente Pumarejo must NEVER appear as a detour stop when heading to Gran Malecón')

    // 2. Final stop MUST be Gran Malecón del Río
    const lastStop = places[places.length - 1]
    assert.ok(
      (lastStop.name || '').toLowerCase().includes('malecón') || (lastStop.name || '').toLowerCase().includes('malecon'),
      `Final stop must be Gran Malecón del Río, got ${lastStop.name}`
    )
  })

  it('12. Paseo Bolívar and Parque Suri Salcedo resolution, non-dining categorization, and authentic imagery', async () => {
    const { resolvePlaceWithCascade } = await import('../services/places-resolver.js')
    const { imageForPlaceWithStatus } = await import('../services/imageSearch.js')

    // 1. Resolve Paseo Bolívar dynamically via cascade
    const resolvedPaseo = await resolvePlaceWithCascade('Paseo Bolívar', 'Barranquilla', 'Colombia')
    assert.ok(resolvedPaseo, 'Paseo Bolívar must be resolvable')
    assert.ok(Math.abs(resolvedPaseo.latitude - 10.983) < 0.01, `Latitude should be near 10.983, got ${resolvedPaseo.latitude}`)
    assert.ok(Math.abs(resolvedPaseo.longitude - (-74.777)) < 0.01, `Longitude should be near -74.777, got ${resolvedPaseo.longitude}`)

    // 2. Categorization: Paseo Bolívar must NEVER be dining
    const subcat = inferStopSubcategory({ name: 'Paseo Bolívar' })
    assert.notEqual(subcat, 'restaurant')
    assert.notEqual(subcat, 'cafe')

    const entityType = getPlaceEntityType('Paseo Bolívar')
    assert.notEqual(entityType, 'food')

    // 3. Authentic images
    const paseoImg = await imageForPlaceWithStatus('Paseo Bolívar', 'Barranquilla', 'historic', 0)
    assert.ok(paseoImg.url && !paseoImg.url.includes('photo-1544025162'), 'Paseo Bolívar must not have ribs food photo')

    const suriImg = await imageForPlaceWithStatus('Parque Tomás Suri Salcedo', 'Barranquilla', 'nature', 0)
    assert.ok(suriImg.url && !suriImg.url.includes('photo-1506744038136-46273834b3fb'), 'Parque Suri Salcedo must not have Yosemite mountain photo')
  })
})

