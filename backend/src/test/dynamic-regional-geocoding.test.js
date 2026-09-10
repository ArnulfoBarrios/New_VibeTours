import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getRegionalBoundingBox,
  geocodePlace,
  haversineMeters
} from '../services/osm.js'

test('getRegionalBoundingBox computes adaptive regional bounding boxes correctly', () => {
  const bqLat = 10.9685
  const bqLon = -74.7813

  // 1. Standard urban bounding box (delta 0.35)
  const urbanBox = getRegionalBoundingBox(bqLat, bqLon)
  assert.ok(urbanBox)
  assert.equal(urbanBox.delta, 0.35)
  assert.equal(urbanBox.minLon, -75.1313)
  assert.equal(urbanBox.maxLon, -74.4313)
  assert.equal(urbanBox.minLat, 10.6185)
  assert.equal(urbanBox.maxLat, 11.3185)
  assert.equal(urbanBox.photonBbox, '-75.1313,10.6185,-74.4313,11.3185')
  assert.equal(urbanBox.nominatimViewbox, '-75.1313,11.3185,-74.4313,10.6185')

  // 2. Micro-destination bounding box (delta 0.15)
  const microBox = getRegionalBoundingBox(bqLat, bqLon, { isMicroDest: true })
  assert.equal(microBox.delta, 0.15)
  assert.equal(microBox.minLon, -74.9313)
  assert.equal(microBox.maxLon, -74.6313)

  // 3. Regional / Nature / Multiday bounding box (delta 0.55)
  const regionalBox = getRegionalBoundingBox(bqLat, bqLon, { isRegionalOrNature: true })
  assert.equal(regionalBox.delta, 0.55)
  assert.equal(regionalBox.minLon, -75.3313)
  assert.equal(regionalBox.maxLon, -74.2313)
})

test('Dynamic Regional Geocoding: Santa Marta regional ecosystem (Tayrona, Minca, Taganga, Rodadero)', async () => {
  const smLat = 11.2408
  const smLon = -74.1990
  const smOpts = { isRegionalOrNature: true, city: 'Santa Marta' }

  // 1. Parque Tayrona (30 km outside city)
  const tayrona = await geocodePlace('Parque Tayrona', smLat, smLon, smOpts)
  assert.ok(tayrona, 'Parque Tayrona must be dynamically resolved')
  const distTayrona = haversineMeters(smLat, smLon, tayrona.latitude, tayrona.longitude) / 1000
  assert.ok(distTayrona >= 10 && distTayrona <= 45, `Tayrona must be 10-45 km from city center, got ${distTayrona.toFixed(1)} km`)

  // 2. Minca (Sierra Nevada foothills, 18 km outside city)
  const minca = await geocodePlace('Minca', smLat, smLon, smOpts)
  assert.ok(minca, 'Minca must be dynamically resolved')
  const distMinca = haversineMeters(smLat, smLon, minca.latitude, minca.longitude) / 1000
  assert.ok(distMinca >= 10 && distMinca <= 35, `Minca must be 10-35 km from city center, got ${distMinca.toFixed(1)} km`)

  // 3. Taganga
  const taganga = await geocodePlace('Taganga', smLat, smLon, smOpts)
  assert.ok(taganga, 'Taganga must be dynamically resolved')
  const distTaganga = haversineMeters(smLat, smLon, taganga.latitude, taganga.longitude) / 1000
  assert.ok(distTaganga < 15, `Taganga must be < 15 km from city center, got ${distTaganga.toFixed(1)} km`)

  // 4. Quinta de San Pedro Alejandrino
  const quinta = await geocodePlace('Quinta de San Pedro Alejandrino', smLat, smLon, smOpts)
  assert.ok(quinta, 'Quinta de San Pedro Alejandrino must be dynamically resolved')
})

test('Dynamic Regional Geocoding: Barranquilla metropolitan coastal ecosystem (Salgar, Ventana al Mundo, Zoo)', async () => {
  const bqLat = 10.9685
  const bqLon = -74.7813
  const bqOpts = { city: 'Barranquilla' }

  // 1. Castillo de Salgar (Coastal Puerto Colombia, ~15 km from center)
  const salgar = await geocodePlace('Castillo de Salgar', bqLat, bqLon, bqOpts)
  assert.ok(salgar, 'Castillo de Salgar must be dynamically resolved')
  const distSalgar = haversineMeters(bqLat, bqLon, salgar.latitude, salgar.longitude) / 1000
  assert.ok(distSalgar >= 10 && distSalgar <= 25, `Castillo de Salgar must be ~10-25 km from Barranquilla center, got ${distSalgar.toFixed(1)} km`)

  // 2. Ventana al Mundo
  const ventana = await geocodePlace('Ventana al Mundo', bqLat, bqLon, bqOpts)
  assert.ok(ventana, 'Ventana al Mundo must be dynamically resolved')
  const distVentana = haversineMeters(bqLat, bqLon, ventana.latitude, ventana.longitude) / 1000
  assert.ok(distVentana < 12, `Ventana al Mundo must be < 12 km, got ${distVentana.toFixed(1)} km`)

  // 3. Zoológico de Barranquilla
  const zoo = await geocodePlace('Zoológico de Barranquilla', bqLat, bqLon, bqOpts)
  assert.ok(zoo, 'Zoológico de Barranquilla must be dynamically resolved')
  const distZoo = haversineMeters(bqLat, bqLon, zoo.latitude, zoo.longitude) / 1000
  assert.ok(distZoo < 10, `Zoo must be < 10 km, got ${distZoo.toFixed(1)} km`)
})

test('Dynamic Regional Geocoding: Strict rejection of out-of-city places', async () => {
  const bqLat = 10.9685
  const bqLon = -74.7813
  const bqOpts = { city: 'Barranquilla' }

  // 1. El Boliche Cebichería is in Cartagena, NOT Barranquilla.
  // Must return null (rejecting the neighbourhood 'El Boliche' in Barranquilla).
  const bolicheInBq = await geocodePlace('El Boliche Cebichería', bqLat, bqLon, bqOpts)
  assert.equal(bolicheInBq, null, 'El Boliche Cebichería must be rejected in Barranquilla')

  // 2. Islas del Rosario is in Cartagena, NOT Barranquilla
  const rosarioInBq = await geocodePlace('Islas del Rosario', bqLat, bqLon, bqOpts)
  assert.equal(rosarioInBq, null, 'Islas del Rosario must be rejected in Barranquilla')

  // 3. Zoológico de Barranquilla is NOT in Santa Marta
  const smLat = 11.2408
  const smLon = -74.1990
  const zooInSm = await geocodePlace('Zoológico de Barranquilla', smLat, smLon, { city: 'Santa Marta' })
  assert.equal(zooInSm, null, 'Zoológico de Barranquilla must be rejected in Santa Marta')
})
