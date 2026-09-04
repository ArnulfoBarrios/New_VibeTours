import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geocodePlacesWithOpenAI } from '../services/openai.js'
import { isPhotonCircuitOpen, tripPhotonCircuit, photonSearch } from '../services/osm.js'

test('Photon circuit breaker trips and resets properly', () => {
  // Initially circuit should be closed (unless tripped recently)
  tripPhotonCircuit(100) // 100ms
  assert.equal(isPhotonCircuitOpen(), true)
  
  // While open, photonSearch should return immediately with empty array without network call
  return new Promise((resolve) => {
    setTimeout(async () => {
      assert.equal(isPhotonCircuitOpen(), false)
      resolve()
    }, 150)
  })
})

test('geocodePlacesWithOpenAI dynamically resolves coordinates for places in Barranquilla', async () => {
  const result = await geocodePlacesWithOpenAI({
    city: 'Barranquilla',
    country: 'Colombia',
    places: ['Gran Malecón del Río', 'Ventana al Mundo', 'Museo del Carnaval']
  })

  assert.ok(result && typeof result === 'object', 'Result must be a non-null object')
  const malecon = result['Gran Malecón del Río'] || Object.entries(result).find(([k]) => k.includes('Malecón'))?.[1]
  const ventana = result['Ventana al Mundo'] || Object.entries(result).find(([k]) => k.includes('Ventana'))?.[1]
  const carnaval = result['Museo del Carnaval'] || Object.entries(result).find(([k]) => k.includes('Carnaval'))?.[1]

  assert.ok(malecon, 'Gran Malecón del Río coordinates must be resolved')
  assert.ok(Number.isFinite(malecon.latitude), 'Latitude must be a valid number')
  assert.ok(Number.isFinite(malecon.longitude), 'Longitude must be a valid number')
  // Barranquilla is roughly lat: ~10.8 - 11.2, lon: ~ -75.1 - -74.6
  assert.ok(malecon.latitude >= 10.8 && malecon.latitude <= 11.2, `Malecon lat out of bounds: ${malecon.latitude}`)
  assert.ok(malecon.longitude >= -75.1 && malecon.longitude <= -74.6, `Malecon lon out of bounds: ${malecon.longitude}`)

  assert.ok(ventana, 'Ventana al Mundo coordinates must be resolved')
  assert.ok(ventana.latitude >= 10.8 && ventana.latitude <= 11.2, `Ventana lat out of bounds: ${ventana.latitude}`)
  assert.ok(ventana.longitude >= -75.1 && ventana.longitude <= -74.6, `Ventana lon out of bounds: ${ventana.longitude}`)

  assert.ok(carnaval, 'Museo del Carnaval coordinates must be resolved')
  assert.ok(carnaval.latitude >= 10.8 && carnaval.latitude <= 11.2, `Carnaval lat out of bounds: ${carnaval.latitude}`)
  assert.ok(carnaval.longitude >= -75.1 && carnaval.longitude <= -74.6, `Carnaval lon out of bounds: ${carnaval.longitude}`)
})
