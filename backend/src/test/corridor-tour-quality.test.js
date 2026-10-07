import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidTouristAttraction, getPlaceEntityType, buildTourPlanner, collectCorridorCandidates, orderPlacesAlongRoute, extractPoisFromText } from '../routes/ai.js'
import { isLodgingName, generateChatResponse, extractChatInformationFallback } from '../services/openai.js'
import { inferStopSubcategory } from '../services/open-tourism-service.js'
import { imageForPlace } from '../services/imageSearch.js'
import { computeCorridorProjection, isWithinCorridor, arePlacesSimilar } from '../services/osm.js'
import { cleanLandmarkOrPlaceName } from '../services/destinationService.js'

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

  it('13. location_to_destination clicking "Ver detalles" preserves stops, formats schedule breakdown, and keeps destination landmark intact', async () => {
    // Turn 1: User asks for tour from current location to Ventana al Mundo
    const turn1UserMsg = 'Quiero un tour desde mi ubicación hasta la Ventana al Mundo'
    const turn1Res = await generateChatResponse(
      { history: [{ role: 'user', content: turn1UserMsg }] },
      '',
      '',
      {
        city: 'Barranquilla',
        country: 'Colombia',
        destination: 'Ventana al Mundo',
        destinationPlace: 'Ventana al Mundo',
        tourType: 'location_to_destination',
        originPlace: 'user_current_location',
        isUserLocationOrigin: true,
        userGpsLatitude: 10.9180,
        userGpsLongitude: -74.7640
      },
      []
    )

    const turn1Places = turn1Res.specificPlaces || turn1Res.extractedPreferences?.specificPlaces || []
    assert.ok(turn1Places.length >= 3, `Expected at least 3 stops, got ${turn1Places.length}`)
    // Final stop must be Ventana al Mundo
    const finalTurn1 = turn1Places[turn1Places.length - 1]
    assert.ok(
      (finalTurn1.name || '').toLowerCase().includes('ventana'),
      `Final stop must be Ventana al Mundo, got ${finalTurn1.name}`
    )
    // Origin must NOT be a stop
    assert.ok(
      !turn1Places.some(p => (p.name || '').toLowerCase().includes('ubicaci')),
      'User origin must not be an itinerary stop'
    )

    // Turn 2: User clicks "Ver detalles"
    const turn2UserMsg = 'Ver detalles'
    const turn2Res = await generateChatResponse(
      {
        history: [
          { role: 'user', content: turn1UserMsg },
          { role: 'assistant', content: turn1Res.responseMessage },
          { role: 'user', content: turn2UserMsg }
        ]
      },
      '',
      '',
      {
        city: 'Barranquilla',
        country: 'Colombia',
        destination: 'Ventana al Mundo',
        destinationPlace: 'Ventana al Mundo',
        tourType: 'location_to_destination',
        originPlace: 'user_current_location',
        isUserLocationOrigin: true,
        userGpsLatitude: 10.9180,
        userGpsLongitude: -74.7640,
        specificPlaces: turn1Places
      },
      []
    )

    const turn2Places = turn2Res.specificPlaces || turn2Res.extractedPreferences?.specificPlaces || []
    // Stops must not be emptied or randomized
    assert.equal(turn2Places.length, turn1Places.length, 'Stop count must remain consistent after clicking Ver detalles')
    assert.equal(turn2Places[turn2Places.length - 1].name, finalTurn1.name, 'Final destination stop must remain Ventana al Mundo')

    // Response must contain a detailed schedule breakdown with times
    assert.ok(
      /09:00|10:45|12:30|02:45|04:30|itinerario detallado/i.test(turn2Res.responseMessage),
      `Expected detailed schedule in response, got: ${turn2Res.responseMessage}`
    )
    // Destination name in prompt and extracted preferences must remain Ventana al Mundo
    const extractedDest = turn2Res.extractedPreferences?.destinationPlace || turn2Res.extractedPreferences?.destination
    assert.ok(
      (extractedDest || '').toLowerCase().includes('ventana'),
      `Extracted destination must remain Ventana al Mundo, got ${extractedDest}`
    )
    // Action chips should offer to generate tour on the map
    assert.ok(
      (turn2Res.actionChips || []).some(c => /generar tour/i.test(c)),
      'Action chips must offer Generar tour'
    )
  })

  it('14. Generic location_to_destination corridor ordering: 4 attractions + 1 lunch restaurant in ascending distance order', () => {
    const origin = { latitude: 10.9180, longitude: -74.7640 } // South
    const endPoint = { latitude: 11.0250, longitude: -74.8250 } // North
    const dummyPlaces = [
      { name: 'Target Destination', latitude: 11.0250, longitude: -74.8250, category: 'attraction' },
      { name: 'South Attraction', latitude: 10.9350, longitude: -74.7800, category: 'attraction' },
      { name: 'Midday Restaurant', latitude: 10.9700, longitude: -74.7950, category: 'restaurant', entityType: 'restaurant' },
      { name: 'Mid-North Attraction', latitude: 10.9900, longitude: -74.8050, category: 'attraction' },
      { name: 'Early-Mid Attraction', latitude: 10.9500, longitude: -74.7900, category: 'attraction' }
    ]

    const ordered = orderPlacesAlongRoute(dummyPlaces, origin, endPoint)
    assert.equal(ordered[0].name, 'South Attraction', 'First stop should be closest to origin')
    assert.equal(ordered[1].name, 'Early-Mid Attraction', 'Second stop should follow route progression')
    assert.equal(ordered[2].name, 'Midday Restaurant', 'Restaurant should be in the middle')
    assert.equal(ordered[3].name, 'Mid-North Attraction', 'Fourth stop should precede arrival')
    assert.equal(ordered[4].name, 'Target Destination', 'Target destination should be final stop')
  })

  it('15. extractPoisFromText on Ver detalles messages extracts genuine venues, never timetable labels, and preserves destination last', () => {
    const detailMsg = 'Aquí tienes el itinerario detallado de tu recorrido desde tu ubicación actual hasta **Estadio Moderno Julio Torres**:\n\n' +
      'Día 1: En ruta hacia Estadio Moderno Julio Torres\n\n' +
      '• 🌅 09:00 AM - Mañana: Visita a **Ventana al Mundo**\n' +
      '• 🏛️ 10:45 AM - Media Mañana: Visita a **Caimán del Río**\n' +
      '• 🍽️ 12:30 PM - Almuerzo: Almuerzo en **Restaurante El Pulpo**\n' +
      '• 🌇 02:45 PM - Tarde: Visita a **Museo del Carnaval**\n' +
      '• 🏁 04:30 PM - Llegada a destino: **Estadio Moderno Julio Torres**\n\n' +
      '¿Deseas confirmar este recorrido y generar el tour en el mapa?'

    const pois = extractPoisFromText(detailMsg)
    assert.equal(pois.length, 5, `Expected exactly 5 stops, got ${pois.length}`)

    // 1. No timetable label strings like "Media Mañana", "Almuerzo", "Tarde", "09:00 AM"
    for (const p of pois) {
      const name = typeof p === 'object' ? p.name : p
      assert.ok(!/\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i.test(name), `Stop name must not contain hours: ${name}`)
      assert.ok(!/^(?:media\s+mañana|mañana|almuerzo|tarde|noche|llegada|cierre|parada\s*\d+)$/i.test(name), `Stop name must not be a timetable label: ${name}`)
    }

    // 2. Exact venues extracted
    assert.equal(pois[0].name, 'Ventana al Mundo')
    assert.equal(pois[1].name, 'Caimán del Río')
    assert.equal(pois[2].name, 'Restaurante El Pulpo')
    assert.equal(pois[3].name, 'Museo del Carnaval')
    assert.equal(pois[4].name, 'Estadio Moderno Julio Torres')

    // 3. Destination is strictly the final stop
    assert.equal(pois[pois.length - 1].name, 'Estadio Moderno Julio Torres')
    assert.notEqual(pois[0].name, 'Estadio Moderno Julio Torres', 'Destination must NOT be stop #1')
  })

  it('16. buildTourPlanner prevents (0, 0) coordinates and positions destination at the very end', () => {
    const input = {
      destination: 'Estadio Moderno Julio Torres',
      destinationPlace: 'Estadio Moderno Julio Torres',
      originPlace: 'user_current_location',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      latitude: 10.9254,
      longitude: -74.7958,
      durationHours: 8,
      durationDays: 1,
      selectedPlaces: [
        'Ventana al Mundo',
        'Caimán del Río',
        'Restaurante El Pulpo',
        'Museo del Carnaval',
        'Estadio Moderno Julio Torres'
      ]
    }

    // Test with missing coordinates on one candidate
    const testPlaces = [
      { name: 'Ventana al Mundo', latitude: 11.0331, longitude: -74.8314 },
      { name: 'Caimán del Río', latitude: 11.0180, longitude: -74.7960 },
      { name: 'Restaurante El Pulpo', category: 'restaurant' }, // Missing coords!
      { name: 'Museo del Carnaval', latitude: 10.9900, longitude: -74.7800 },
      { name: 'Estadio Moderno Julio Torres', latitude: 10.9700, longitude: -74.7750 }
    ]

    const planner = buildTourPlanner(input, { latitude: 10.9254, longitude: -74.7958 }, testPlaces)
    assert.ok(planner.selectedPlaces.length >= 4)

    // 1. Destination must be strictly at the end
    const last = planner.selectedPlaces[planner.selectedPlaces.length - 1]
    assert.equal(last.name, 'Estadio Moderno Julio Torres')

    // 2. NO place must have (0, 0) coordinates (no Atlantic ocean Null Island)
    for (const p of planner.selectedPlaces) {
      assert.ok(p.latitude !== 0 || p.longitude !== 0, `Stop ${p.name} must never have (0, 0) coordinates`)
      assert.ok(Number.isFinite(p.latitude), `Stop ${p.name} must have finite latitude`)
      assert.ok(Number.isFinite(p.longitude), `Stop ${p.name} must have finite longitude`)
    }
  })

  it('17. cleanLandmarkOrPlaceName extracts concise landmark titles and arePlacesSimilar recognizes addresses', () => {
    const rawNominatimAddress = 'Estadio Moderno "Julio Torres", 25, Avenida Calle 30, San Roque, Localidad Suroriente, Perímetro Urbano Barranquilla, Barranquilla, Atlántico, RAP Caribe, 080012, Colombia'
    const clean = cleanLandmarkOrPlaceName(rawNominatimAddress)
    assert.equal(clean, 'Estadio Moderno Julio Torres')

    const withQuotes = 'Estadio Moderno "Julio Torres"'
    assert.equal(cleanLandmarkOrPlaceName(withQuotes), 'Estadio Moderno Julio Torres')

    const withCityComma = 'Gran Malecón del Río, Barranquilla'
    assert.equal(cleanLandmarkOrPlaceName(withCityComma), 'Gran Malecón del Río')

    assert.equal(cleanLandmarkOrPlaceName('Ventana al Mundo'), 'Ventana al Mundo')

    // arePlacesSimilar matches raw address with clean venue
    assert.ok(arePlacesSimilar(rawNominatimAddress, 'Estadio Moderno Julio Torres'))
    assert.ok(arePlacesSimilar('Estadio Moderno Julio Torres', rawNominatimAddress))
    assert.ok(arePlacesSimilar(rawNominatimAddress, 'Estadio Moderno'))
  })

  it('18. buildTourPlanner prevents duplicate destination stops when input has raw Nominatim address and specificPlaces has clean name', () => {
    const rawNominatimAddress = 'Estadio Moderno "Julio Torres", 25, Avenida Calle 30, San Roque, Localidad Suroriente, Perímetro Urbano Barranquilla, Barranquilla, Atlántico, RAP Caribe, 080012, Colombia'
    const input = {
      destination: rawNominatimAddress,
      destinationPlace: rawNominatimAddress,
      originPlace: 'user_current_location',
      tourType: 'location_to_destination',
      isUserLocationOrigin: true,
      latitude: 10.9254,
      longitude: -74.7958,
      durationHours: 8,
      durationDays: 1,
      specificPlaces: [
        { name: 'Ventana al Mundo', latitude: 11.0331, longitude: -74.8314 },
        { name: 'Gran Malecón del Río', latitude: 11.0180, longitude: -74.7960 },
        { name: 'Restaurante El Caimán del Río', category: 'restaurant', entityType: 'restaurant', latitude: 11.0180, longitude: -74.7960 },
        { name: 'Catedral Metropolitana María Reina', latitude: 10.9900, longitude: -74.7800 },
        { name: 'Estadio Moderno Julio Torres', latitude: 10.9700, longitude: -74.7750 }
      ]
    }

    const testPlaces = [
      { name: 'Ventana al Mundo', latitude: 11.0331, longitude: -74.8314 },
      { name: 'Gran Malecón del Río', latitude: 11.0180, longitude: -74.7960 },
      { name: 'Restaurante El Caimán del Río', category: 'restaurant', entityType: 'restaurant', latitude: 11.0180, longitude: -74.7960 },
      { name: 'Catedral Metropolitana María Reina', latitude: 10.9900, longitude: -74.7800 },
      { name: 'Estadio Moderno Julio Torres', latitude: 10.9700, longitude: -74.7750 }
    ]

    const planner = buildTourPlanner(input, { latitude: 10.9254, longitude: -74.7958 }, testPlaces)

    // 1. Must NOT produce 6 stops with duplicate stadium
    assert.equal(planner.selectedPlaces.length, 5, `Expected exactly 5 stops, got ${planner.selectedPlaces.length}`)

    // 2. Destination must be strictly at the end, and only appear ONCE
    const stadiumOccurrences = planner.selectedPlaces.filter(p => arePlacesSimilar(p.name, 'Estadio Moderno Julio Torres'))
    assert.equal(stadiumOccurrences.length, 1, 'Estadio Moderno must appear exactly once in the entire tour')

    // 3. Final stop name must be clean and not bloated with raw address
    const lastStop = planner.selectedPlaces[planner.selectedPlaces.length - 1]
    assert.equal(lastStop.name, 'Estadio Moderno Julio Torres')
    assert.ok(!lastStop.name.includes('San Roque'), 'Stop name must not contain street address details')
    assert.ok(!lastStop.name.includes('080012'), 'Stop name must not contain postal code')

    // 4. Intermediate stops must not contain the destination
    const intermediateStops = planner.selectedPlaces.slice(0, 4)
    for (const stop of intermediateStops) {
      assert.ok(!arePlacesSimilar(stop.name, 'Estadio Moderno Julio Torres'), `Intermediate stop "${stop.name}" must not be Estadio Moderno`)
    }
  })
})


