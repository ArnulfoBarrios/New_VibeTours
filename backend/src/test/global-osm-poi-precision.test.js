import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geocodePlace, haversineMeters } from '../services/osm.js'

test('geocodePlace with proximity bias resolves urban and coastal POIs without hardcoded presets', async () => {
  const smLat = 11.2408
  const smLon = -74.2098

  // 1. Parque de Los Novios in Santa Marta
  const parqueNovios = await geocodePlace('Parque de Los Novios', smLat, smLon)
  assert.ok(parqueNovios, 'Parque de Los Novios must resolve')
  const distNovios = haversineMeters(smLat, smLon, parqueNovios.latitude, parqueNovios.longitude)
  assert.ok(distNovios < 5000, `Parque de Los Novios must be in Santa Marta, got ${distNovios}m`)

  // 2. Taganga
  const taganga = await geocodePlace('Taganga', smLat, smLon)
  assert.ok(taganga, 'Taganga must resolve')
  const distTaganga = haversineMeters(smLat, smLon, taganga.latitude, taganga.longitude)
  assert.ok(distTaganga < 15000, `Taganga must be near Santa Marta, got ${distTaganga}m`)
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
