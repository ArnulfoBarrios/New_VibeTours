import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isWithinCoastalCorridorBounds,
  matchIconicLandmark,
  KNOWN_ICONIC_LANDMARKS
} from '../services/osm.js'
import {
  filterChatSpecificPlacesByOsm,
  isMalformedItinerary,
  DESTINATION_ICONIC_RESTAURANTS
} from '../services/openai.js'

describe('OpenFreeMap Node Grounding & Corridor Bounds Precision', () => {
  it('1. isWithinCoastalCorridorBounds strictly filters inland cities while preserving coastal corridor', () => {
    // Morrosquillo coastal corridor POIs (MUST PASS)
    assert.equal(isWithinCoastalCorridorBounds(9.40, -75.68, 'Coveñas'), true, 'Coveñas beach must pass')
    assert.equal(isWithinCoastalCorridorBounds(9.3629242, -75.7795488, 'Coveñas'), true, 'San Antero volcano must pass')
    assert.equal(isWithinCoastalCorridorBounds(9.4312, -75.6415, 'Coveñas'), true, 'Caimanera dock must pass')
    assert.equal(isWithinCoastalCorridorBounds(9.5255, -75.5840, 'Santiago de Tolú'), true, 'Tolú malecon must pass')
    assert.equal(isWithinCoastalCorridorBounds(9.7420, -75.6490, 'Coveñas'), true, 'Isla Palma must pass')
    assert.equal(isWithinCoastalCorridorBounds(9.3870, -76.1770, 'Coveñas'), true, 'Isla Fuerte must pass')

    // Inland cities leaking into Coveñas (MUST FAIL)
    // Sincelejo (lon -75.39 > -75.48)
    assert.equal(isWithinCoastalCorridorBounds(9.288, -75.405, 'Coveñas'), false, 'Sincelejo must be strictly blocked')
    assert.equal(isWithinCoastalCorridorBounds(9.300, -75.390, 'Golfo de Morrosquillo'), false, 'Sincelejo east corridor must fail')

    // Lorica / Momil (lat 9.24 < 9.32)
    assert.equal(isWithinCoastalCorridorBounds(9.241, -75.814, 'Coveñas'), false, 'Lorica must be strictly blocked')
    assert.equal(isWithinCoastalCorridorBounds(9.238, -75.670, 'Coveñas'), false, 'Momil must be strictly blocked')

    // Cartagena / far north leakage (lat > 9.85)
    assert.equal(isWithinCoastalCorridorBounds(10.39, -75.48, 'Coveñas'), false, 'Cartagena must be blocked')

    // Other cities (unconstrained)
    assert.equal(isWithinCoastalCorridorBounds(10.9685, -74.7813, 'Barranquilla'), true, 'Barranquilla is unconstrained')
    assert.equal(isWithinCoastalCorridorBounds(6.2442, -75.5812, 'Medellín'), true, 'Medellín is unconstrained')
  })

  it('2. Iconic landmarks match exact OpenFreeMap / OSM nodes and coordinates', () => {
    // Volcan de Lodo exact node N/4757121230
    const volcan = matchIconicLandmark('volcan de lodo', 'volcan de lodo')
    assert.ok(volcan, 'Volcán de Lodo must be matched')
    assert.equal(volcan.latitude, 9.3629242, 'Volcán de Lodo latitude must be exact node coordinate')
    assert.equal(volcan.longitude, -75.7795488, 'Volcán de Lodo longitude must be exact node coordinate')
    assert.equal(volcan.placeId, 'N/4757121230', 'Volcán de Lodo must point to OSM node N/4757121230')

    // Ciénaga de la Caimanera tourist dock
    const caimanera = matchIconicLandmark('cienaga de la caimanera', 'cienaga de la caimanera')
    assert.ok(caimanera, 'Caimanera must be matched')
    assert.equal(caimanera.latitude, 9.4312, 'Caimanera must be at tourist embarcadero')
    assert.equal(caimanera.longitude, -75.6415, 'Caimanera must be at tourist embarcadero')

    // Malecón de Santiago de Tolú beachfront
    const malecon = matchIconicLandmark('malecon de santiago de tolu', 'malecon de santiago de tolu')
    assert.ok(malecon, 'Tolú Malecón must be matched')
    assert.equal(malecon.latitude, 9.5255, 'Tolú Malecón latitude')
    assert.equal(malecon.longitude, -75.5840, 'Tolú Malecón longitude')

    // Punta de Piedra (Coveñas coast, NOT Lorica)
    const punta = matchIconicLandmark('punta de piedra', 'punta de piedra')
    assert.ok(punta, 'Punta de Piedra must be matched')
    assert.equal(punta.latitude, 9.4670, 'Punta de Piedra latitude must be on Coveñas coast')
    assert.equal(punta.longitude, -75.6170, 'Punta de Piedra longitude must be on Coveñas coast')
    assert.equal(isWithinCoastalCorridorBounds(punta.latitude, punta.longitude, 'Coveñas'), true)
  })

  it('3. Iconic restaurants do not include hotels or chalets such as La Fragata', () => {
    const covenasRests = DESTINATION_ICONIC_RESTAURANTS['coveñas'] || []
    assert.ok(covenasRests.length > 0, 'Coveñas iconic restaurants must exist')

    const hasFragata = covenasRests.some(r => /la fragata/i.test(r.name))
    assert.equal(hasFragata, false, 'La Fragata (chalet/hotel) must NOT be in iconic restaurants')

    const hasGranPez = covenasRests.some(r => /el gran pez/i.test(r.name))
    assert.equal(hasGranPez, false, 'El Gran Pez must NOT be in iconic restaurants')

    const hasDondeValerio = covenasRests.some(r => /donde valerio/i.test(r.name))
    assert.equal(hasDondeValerio, true, 'Donde Valerio en Tolú must be included')
  })

  it('4. isMalformedItinerary detects fictitious or misplaced venues', () => {
    assert.equal(isMalformedItinerary('Día 1: Visita al Parque Principal de Coveñas'), true, 'Must detect Parque Principal de Coveñas')
    assert.equal(isMalformedItinerary('Almuerzo en Restaurante La Fragata'), true, 'Must detect Restaurante La Fragata')
    assert.equal(isMalformedItinerary('Cena en Restaurante El Gran Pez'), true, 'Must detect Restaurante El Gran Pez')
    assert.equal(isMalformedItinerary('Cena en Restaurante La Iguana'), true, 'Must detect Restaurante La Iguana')

    assert.equal(isMalformedItinerary('Día 1:\n• Mañana: Visita a la Ciénaga de la Caimanera\n• Tarde: Segunda Ensenada\n• Noche: Restaurante Donde Valerio'), false, 'Legitimate itinerary must pass')
  })

  it('5. filterChatSpecificPlacesByOsm drops non-existent places and retains verified OSM places', async () => {
    const mixedPlaces = [
      { name: 'Segunda Ensenada', dia: 1 },
      { name: 'Parque Principal de Coveñas', dia: 2 },
      { name: 'Restaurante Totalmente Inexistente 999', dia: 2 }
    ]

    const filtered = await filterChatSpecificPlacesByOsm(mixedPlaces, 'Coveñas', 'Colombia')
    const names = filtered.map(p => typeof p === 'string' ? p : p.name)

    assert.ok(names.includes('Segunda Ensenada'), 'Segunda Ensenada must be kept')
    assert.ok(!names.some(n => /parque principal de coveñas/i.test(n)), 'Parque Principal de Coveñas must NOT be kept')
    assert.ok(!names.some(n => /restaurante totalmente inexistente/i.test(n)), 'Unmapped place must NOT be kept')

    for (const p of filtered) {
      assert.ok(typeof p.latitude === 'number', 'Latitude must be number')
      assert.ok(typeof p.longitude === 'number', 'Longitude must be number')
      assert.equal(isWithinCoastalCorridorBounds(p.latitude, p.longitude, 'Coveñas'), true, 'Must be within coastal corridor')
    }
  })
})
