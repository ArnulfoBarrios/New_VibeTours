import test from 'node:test'
import assert from 'node:assert/strict'
import { geocodePlace, haversineMeters } from '../services/osm.js'
import { FALLBACK_DESTINATION_CENTROIDS } from '../services/destinationService.js'

test('5 reported screenshot places resolve with meter-level precision', async () => {
  const bqCentroid = FALLBACK_DESTINATION_CENTROIDS['barranquilla']
  const bqLat = bqCentroid.latitude
  const bqLon = bqCentroid.longitude
  const regionalOpts = {
    isRegionalOrNature: true,
    durationDays: 7,
    city: 'Barranquilla',
    country: 'Colombia'
  }

  // 1. Iglesia de San Nicolás de Tolentino (Plaza de San Nicolás)
  const sanNicolas = await geocodePlace('Iglesia de San Nicolás de Tolentino', bqLat, bqLon, regionalOpts)
  assert.ok(sanNicolas, 'San Nicolas must resolve')
  const distSanNicolas = haversineMeters(sanNicolas.latitude, sanNicolas.longitude, 10.9801, -74.7780)
  assert.ok(distSanNicolas < 250, `San Nicolas is ${distSanNicolas}m from authentic church (must be < 250m)`)
  const distSanJose = haversineMeters(sanNicolas.latitude, sanNicolas.longitude, 10.9792, -74.7823)
  assert.ok(distSanJose > 350, 'Must NOT be mistakenly pinned on Iglesia de San Jose')

  // 2. Restaurante Narcobollo (Cra 43 # 84-188)
  const narcobollo = await geocodePlace('Restaurante Narcobollo', bqLat, bqLon, regionalOpts)
  assert.ok(narcobollo, 'Narcobollo must resolve')
  const distNarcobollo = haversineMeters(narcobollo.latitude, narcobollo.longitude, 10.99820, -74.82020)
  assert.ok(distNarcobollo < 100, `Narcobollo is ${distNarcobollo}m from Cra 43 # 84-188 (must be < 100m)`)

  // 3. Restaurante Cucayo (Cra 49C # 76-80)
  const cucayo = await geocodePlace('Restaurante Cucayo', bqLat, bqLon, regionalOpts)
  assert.ok(cucayo, 'Cucayo must resolve')
  const distCucayo = haversineMeters(cucayo.latitude, cucayo.longitude, 10.99986, -74.80920)
  assert.ok(distCucayo < 100, `Cucayo is ${distCucayo}m from Cra 49C # 76-80 (must be < 100m)`)

  // 4. Muelle de Puerto Colombia (Historic Pier)
  const muelle = await geocodePlace('Muelle de Puerto Colombia', bqLat, bqLon, regionalOpts)
  assert.ok(muelle, 'Muelle de Puerto Colombia must resolve')
  const distMuelle = haversineMeters(muelle.latitude, muelle.longitude, 10.9893, -74.9612)
  assert.ok(distMuelle < 200, `Muelle is ${distMuelle}m from pier entrance (must be < 200m)`)

  // 5. Restaurante El Celler (Cra 54 # 75-119)
  const celler = await geocodePlace('Restaurante El Celler', bqLat, bqLon, regionalOpts)
  assert.ok(celler, 'El Celler must resolve')
  const distCeller = haversineMeters(celler.latitude, celler.longitude, 11.0022, -74.8075)
  assert.ok(distCeller < 150, `El Celler is ${distCeller}m from Cra 54 # 75-119 (must be < 150m)`)
})
