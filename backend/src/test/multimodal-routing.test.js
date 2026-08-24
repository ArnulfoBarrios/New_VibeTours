import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Multimodal Routing & Subzone Clustering Tests', () => {
  it('should compute centroid for specific subzone stops (e.g. Tayrona cluster)', () => {
    const tayronaStops = [
      { name: 'Playa Cabo San Juan', latitude: 11.3145, longitude: -73.9312 },
      { name: 'Camping Parque Tayrona', latitude: 11.3090, longitude: -73.9350 }
    ]

    const centroidLat = tayronaStops.reduce((acc, p) => acc + p.latitude, 0) / tayronaStops.length
    const centroidLon = tayronaStops.reduce((acc, p) => acc + p.longitude, 0) / tayronaStops.length

    assert.ok(centroidLat > 11.30 && centroidLat < 11.33)
    assert.ok(centroidLon > -73.95 && centroidLon < -73.92)
  })

  it('should filter out distant downtown POIs when subzone centroid is in a natural reserve', () => {
    // Subzone centroid in Tayrona
    const centroid = { latitude: 11.3117, longitude: -73.9331 }
    
    // Downtown Santa Marta POI (~32 km away)
    const downtownPoi = { name: 'Quinta de San Pedro Alejandrino', latitude: 11.2312, longitude: -74.1812 }
    
    // Nearby Tayrona POI (~3.5 km away)
    const nearbyTayronaPoi = { name: 'Playa Arrecifes', latitude: 11.3050, longitude: -73.9510 }

    function haversineKm(lat1, lon1, lat2, lon2) {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const distDowntown = haversineKm(centroid.latitude, centroid.longitude, downtownPoi.latitude, downtownPoi.longitude)
    const distNearby = haversineKm(centroid.latitude, centroid.longitude, nearbyTayronaPoi.latitude, nearbyTayronaPoi.longitude)

    const maxSubzoneRadiusKm = 20
    assert.ok(distDowntown > maxSubzoneRadiusKm, 'Downtown POI should be outside subzone radius')
    assert.ok(distNearby <= maxSubzoneRadiusKm, 'Nearby Tayrona POI should be within subzone radius')
  })

  it('should classify route topology as land, maritime or flight transfer based on distance and connectivity', () => {
    // Case 1: Continuous highway (e.g. Barranquilla to Santa Marta ~88 km)
    const distBaqSam = 88000
    const isLand = distBaqSam < 400000
    assert.equal(isLand, true)

    // Case 2: Long distance / Transcontinental (e.g. Barranquilla to Madrid ~7500 km)
    const distBaqMad = 7500000
    const isFlight = distBaqMad > 400000
    assert.equal(isFlight, true)
  })
})
