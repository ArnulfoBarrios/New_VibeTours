import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function haversineMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000
  const toRad = (value) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function validateGeographicConsistency(pois, centerLat, centerLon, maxRadiusKm = 45) {
  for (const poi of pois) {
    if (poi.latitude === 0 && poi.longitude === 0) {
      return { valid: false, reason: `POI ${poi.name} has invalid 0,0 coordinates` }
    }
    const distKm = haversineMeters(centerLat, centerLon, poi.latitude, poi.longitude) / 1000
    if (distKm > maxRadiusKm) {
      return { valid: false, reason: `POI ${poi.name} is ${distKm.toFixed(1)} km away, exceeding ${maxRadiusKm} km limit` }
    }
  }
  return { valid: true }
}

function checkAnomalousSegmentJump(pois, maxJumpKm = 100) {
  for (let i = 0; i < pois.length - 1; i++) {
    const p1 = pois[i]
    const p2 = pois[i + 1]
    const jumpKm = haversineMeters(p1.latitude, p1.longitude, p2.latitude, p2.longitude) / 1000
    if (jumpKm > maxJumpKm) {
      return { hasAnomaly: true, segmentIndex: i, jumpKm }
    }
  }
  return { hasAnomaly: false }
}

describe('Geographic Validation Unit Tests', () => {
  const barcelonaCenter = { lat: 41.3879, lon: 2.1699 }

  it('should accept POIs within Barcelona 45km radius', () => {
    const validPois = [
      { name: 'Sagrada Familia', latitude: 41.4036, longitude: 2.1744 },
      { name: 'Parc Güell', latitude: 41.4145, longitude: 2.1527 },
      { name: 'La Rambla', latitude: 41.3809, longitude: 2.1732 }
    ]
    const res = validateGeographicConsistency(validPois, barcelonaCenter.lat, barcelonaCenter.lon, 45)
    assert.equal(res.valid, true)
  })

  it('should reject POIs outside Barcelona radius (e.g. Madrid or Caribbean)', () => {
    const invalidPois = [
      { name: 'Sagrada Familia', latitude: 41.4036, longitude: 2.1744 },
      { name: 'Plaza Mayor Madrid', latitude: 40.4154, longitude: -3.7074 }
    ]
    const res = validateGeographicConsistency(invalidPois, barcelonaCenter.lat, barcelonaCenter.lon, 45)
    assert.equal(res.valid, false)
  })

  it('should reject POIs with 0,0 null island coordinates', () => {
    const nullIslandPois = [
      { name: 'Valid Stop', latitude: 41.4036, longitude: 2.1744 },
      { name: 'Corrupted Stop', latitude: 0, longitude: 0 }
    ]
    const res = validateGeographicConsistency(nullIslandPois, barcelonaCenter.lat, barcelonaCenter.lon, 45)
    assert.equal(res.valid, false)
  })

  it('should detect intercontinental/anomalous jumps > 100km', () => {
    const routePois = [
      { name: 'Barcelona Stop 1', latitude: 41.3879, longitude: 2.1699 },
      { name: 'Anomalous Jump to Miami', latitude: 25.7617, longitude: -80.1918 }
    ]
    const res = checkAnomalousSegmentJump(routePois, 100)
    assert.equal(res.hasAnomaly, true)
    assert.ok(res.jumpKm > 1000)
  })
})
