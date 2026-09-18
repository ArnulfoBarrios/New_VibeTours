import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildTourPlanner } from '../routes/ai.js'
import { isNonTouristFacility } from '../services/osm.js'
import { filterChatSpecificPlacesByOsm, deterministicJitter } from '../services/openai.js'

describe('Chat to Tour SSOT Consistency Unit Tests', () => {
  it('should automatically expand totalDays to match max day from specificPlaces when durationDays was initially smaller', () => {
    const chatStops = [
      { name: 'Playa Primera Coveñas', day: 1, dia: 1 },
      { name: 'Parque Principal Coveñas', day: 2, dia: 2 },
      { name: 'Ciénaga de la Caimanera', day: 3, dia: 3 },
      { name: 'Paseo Marítimo Coveñas', day: 4, dia: 4 }
    ]

    const planner = buildTourPlanner({
      city: 'Coveñas',
      destination: 'Coveñas, Sucre, Colombia',
      durationDays: 2,
      durationHours: 48,
      specificPlaces: chatStops
    })

    assert.equal(planner.totalDays, 4, 'Tour totalDays should expand to 4 based on chat itinerary')
    assert.equal(planner.selectedPlaces.length, 4, 'All 4 chat stops should be preserved in planner')
    
    const day4Stops = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === 4)
    assert.equal(day4Stops.length, 1, 'Day 4 stop must exist in the planner')
    assert.equal(day4Stops[0].name, 'Paseo Marítimo Coveñas')
  })

  it('should reject military facilities when checking non-tourist places in OSM', () => {
    assert.equal(isNonTouristFacility({ name: 'Base de Entrenamiento de Infanteria de Marina' }), true)
    assert.equal(isNonTouristFacility({ name: 'Batallón de Infantería No. 1' }), true)
    assert.equal(isNonTouristFacility({ name: 'Base Naval ARC' }), true)
    assert.equal(isNonTouristFacility({ tags: { amenity: 'military' } }), true)

    assert.equal(isNonTouristFacility({ name: 'Castillo San Felipe de Barajas' }), false)
    assert.equal(isNonTouristFacility({ name: 'Fuerte de San Fernando' }), false)
    assert.equal(isNonTouristFacility({ name: 'Playa Blanca Coveñas' }), false)
  })

  it('should strictly discard unmapped places that do not exist in OSM and retain real OSM places', async () => {
    const rawChatPlaces = [
      { name: 'Paseo Marítimo Totalmente Inexistente 12345', dia: 1, day: 1 },
      { name: 'Playa Inventada Sin Registro Cartográfico', dia: 2, day: 2 }
    ]

    const filtered = await filterChatSpecificPlacesByOsm(rawChatPlaces, 'Coveñas')
    assert.equal(filtered.length, 0, 'Unmapped places must be strictly dropped to avoid synthetic coordinates')

    const realChatPlaces = [
      { name: 'Segunda Ensenada', dia: 1, day: 1 },
      { name: 'Ciénaga de la Caimanera', dia: 2, day: 2 }
    ]
    const filteredReal = await filterChatSpecificPlacesByOsm(realChatPlaces, 'Coveñas')
    assert.equal(filteredReal.length, 2, 'Real OSM places must be preserved')
    for (const place of filteredReal) {
      assert.ok(typeof place.latitude === 'number' && !Number.isNaN(place.latitude), 'Latitude must be numeric')
      assert.ok(typeof place.longitude === 'number' && !Number.isNaN(place.longitude), 'Longitude must be numeric')
      assert.equal(place.coordinatesVerified, true, 'coordinatesVerified must be true')
    }
  })

  it('should produce deterministic coordinates for the same place name and centroid', () => {
    const c1 = deterministicJitter('Paseo Marítimo', 9.4069, -75.6983)
    const c2 = deterministicJitter('Paseo Marítimo', 9.4069, -75.6983)
    const c3 = deterministicJitter('Otro Lugar', 9.4069, -75.6983)

    assert.equal(c1.latitude, c2.latitude)
    assert.equal(c1.longitude, c2.longitude)
    assert.notEqual(c1.latitude, c3.latitude)
  })
})
