import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCanonicalDestination } from '../services/destinationService.js'
import { destinationCoverImage } from '../services/imageSearch.js'

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

describe('Generic Multi-City Integration Test', () => {
  const sampleCities = [
    { input: 'Roma', expectedCountry: 'Italia', expectedLat: 41.9028, expectedLon: 12.4964 },
    { input: 'Tokio', expectedCountry: 'Japón', expectedLat: 35.6762, expectedLon: 139.6503 },
    { input: 'Medellín', expectedCountry: 'Colombia', expectedLat: 6.2442, expectedLon: -75.5812 }
  ]

  for (const cityConfig of sampleCities) {
    it(`should dynamically resolve canonical destination, geofence, and cover image for ${cityConfig.input}`, async () => {
      const canonical = await resolveCanonicalDestination(cityConfig.input)
      assert.ok(canonical, `Canonical destination should be resolved for ${cityConfig.input}`)
      assert.equal(canonical.country, cityConfig.expectedCountry)

      const distFromExpectedKm = haversineMeters(cityConfig.expectedLat, cityConfig.expectedLon, canonical.latitude, canonical.longitude) / 1000
      assert.ok(distFromExpectedKm <= 50, `Coordinates for ${cityConfig.input} should be near expected center (was ${distFromExpectedKm.toFixed(1)} km)`)

      const tripContext = {
        destination: {
          displayName: canonical.displayName,
          city: canonical.city,
          country: canonical.country,
          latitude: canonical.latitude,
          longitude: canonical.longitude
        },
        dateRange: { startDate: '2026-10-10', endDate: '2026-10-15' },
        itinerary: [
          {
            day: 1,
            stops: [
              { name: `Centro Histórico de ${canonical.city}`, latitude: canonical.latitude + 0.005, longitude: canonical.longitude + 0.005 }
            ]
          }
        ]
      }

      const coverUrl = destinationCoverImage(tripContext.destination.city, tripContext.destination.country)
      assert.ok(coverUrl, 'Cover image URL should exist')

      for (const day of tripContext.itinerary) {
        for (const stop of day.stops) {
          assert.notEqual(stop.latitude, 0)
          assert.notEqual(stop.longitude, 0)
          const distKm = haversineMeters(canonical.latitude, canonical.longitude, stop.latitude, stop.longitude) / 1000
          assert.ok(distKm <= 45, `Stop ${stop.name} must be within 45km of ${canonical.city}`)
        }
      }
    })
  }
})
