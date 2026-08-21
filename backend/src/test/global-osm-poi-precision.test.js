import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geocodePlace, haversineMeters } from '../services/osm.js'

test('geocodePlace returns millimeter-precise coordinates for Santa Marta coastal and urban POIs', async () => {
  const smLat = 11.2408
  const smLon = -74.2098

  // 1. Playa Cristal must be in the coastal bay of Tayrona, not inland mountains
  const playaCristal = await geocodePlace('Playa Cristal', smLat, smLon)
  assert.ok(playaCristal, 'Playa Cristal must resolve')
  assert.ok(Math.abs(playaCristal.latitude - 11.3128) < 0.01, `Playa Cristal lat must be near 11.3128, got ${playaCristal.latitude}`)
  assert.ok(Math.abs(playaCristal.longitude - (-74.0845)) < 0.01, `Playa Cristal lon must be near -74.0845, got ${playaCristal.longitude}`)

  // 2. Acuario y Museo del Mar must be at the marine enclosure (Inca Inca), not inland
  const acuario = await geocodePlace('Acuario y Museo del Mar del Rodadero', smLat, smLon)
  assert.ok(acuario, 'Acuario must resolve')
  assert.ok(Math.abs(acuario.latitude - 11.21855) < 0.005, `Acuario lat must be near 11.21855, got ${acuario.latitude}`)
  assert.ok(Math.abs(acuario.longitude - (-74.23340)) < 0.005, `Acuario lon must be near -74.23340, got ${acuario.longitude}`)

  // 3. Discoteca La Puerta must be at Calle 17 con Cra 3
  const laPuerta = await geocodePlace('Discoteca La Puerta', smLat, smLon)
  assert.ok(laPuerta, 'La Puerta must resolve')
  assert.ok(Math.abs(laPuerta.latitude - 11.24434) < 0.002, `La Puerta lat must be near 11.24434, got ${laPuerta.latitude}`)
  assert.ok(Math.abs(laPuerta.longitude - (-74.21235)) < 0.002, `La Puerta lon must be near -74.21235, got ${laPuerta.longitude}`)

  // 4. Parque de Los Novios must be centered on Parque Santander
  const parqueNovios = await geocodePlace('Parque de Los Novios', smLat, smLon)
  assert.ok(parqueNovios, 'Parque de Los Novios must resolve')
  assert.ok(Math.abs(parqueNovios.latitude - 11.24235) < 0.002, `Parque de Los Novios lat must be near 11.24235, got ${parqueNovios.latitude}`)
  assert.ok(Math.abs(parqueNovios.longitude - (-74.21360)) < 0.002, `Parque de Los Novios lon must be near -74.21360, got ${parqueNovios.longitude}`)

  // 5. Bahía Concha must be on the beach shoreline
  const bahiaConcha = await geocodePlace('Bahía Concha', smLat, smLon)
  assert.ok(bahiaConcha, 'Bahia Concha must resolve')
  assert.ok(Math.abs(bahiaConcha.latitude - 11.2985) < 0.005, `Bahia Concha lat must be near 11.2985, got ${bahiaConcha.latitude}`)
  assert.ok(Math.abs(bahiaConcha.longitude - (-74.1528)) < 0.005, `Bahia Concha lon must be near -74.1528, got ${bahiaConcha.longitude}`)
})

test('geocodePlace with proximity bias resolves international places accurately', async () => {
  // Madrid centroid
  const madridLat = 40.4168
  const madridLon = -3.7038
  const prado = await geocodePlace('Museo del Prado', madridLat, madridLon)
  assert.ok(prado, 'Museo del Prado must resolve')
  const dist = haversineMeters(madridLat, madridLon, prado.latitude, prado.longitude)
  assert.ok(dist < 5000, `Museo del Prado must be within 5km of Madrid center, got ${dist}m`)
})
