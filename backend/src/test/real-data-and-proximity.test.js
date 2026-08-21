import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanAdministrativeCityName } from '../services/destinationService.js'
import { getRealDestinationCatalog, getDefaultActionChips } from '../services/openai.js'

test('cleanAdministrativeCityName should strip administrative prefixes correctly', () => {
  assert.equal(cleanAdministrativeCityName('Perímetro Urbano Santa Marta'), 'Santa Marta')
  assert.equal(cleanAdministrativeCityName('perimetro urbano de santa marta'), 'santa marta')
  assert.equal(cleanAdministrativeCityName('Distrito Turístico, Cultural e Histórico de Santa Marta'), 'Santa Marta')
  assert.equal(cleanAdministrativeCityName('Distrito Capital de Bogotá'), 'Bogotá')
  assert.equal(cleanAdministrativeCityName('Municipio de Medellín'), 'Medellín')
  assert.equal(cleanAdministrativeCityName('Comuna 13 de Medellín'), 'Medellín')
  assert.equal(cleanAdministrativeCityName('Cartagena, Bolívar'), 'Cartagena, Bolívar')
})

test('Santa Marta dynamic catalog must resolve verified real physical places and restaurants from OSM', async () => {
  const santaMarta = await getRealDestinationCatalog('Santa Marta', 'Colombia')
  assert.ok(santaMarta, 'Santa Marta dynamic catalog should exist')
  assert.equal(santaMarta.name, 'Santa Marta')
  assert.equal(santaMarta.country, 'Colombia')

  // Verify Real Hotels array
  assert.ok(Array.isArray(santaMarta.hotels))
  // Verify Real Restaurants array
  assert.ok(Array.isArray(santaMarta.restaurants))
  // Verify Real Attractions array
  assert.ok(Array.isArray(santaMarta.places))
})

test('Proximity & domestic query must propose local destinations and never foreign ones', () => {
  const domesticChips = getDefaultActionChips(
    { latitude: 11.24, longitude: -74.20, userCountry: 'Colombia' },
    'Quiero explorar un destino dentro de mi propio país'
  )

  // Must propose domestic destinations (Santa Marta, Taganga, Minca, Cartagena, Medellín, Bogotá)
  assert.ok(domesticChips.length >= 3)
  assert.ok(domesticChips.some(c => /santa marta|taganga|minca|cartagena|medell[íi]n|bogot[áa]/i.test(c)))

  // Must NOT include foreign cities
  assert.ok(!domesticChips.includes('Playa del Carmen'))
  assert.ok(!domesticChips.includes('Valparaíso'))
  assert.ok(!domesticChips.includes('España'))
  assert.ok(!domesticChips.includes('París'))
})

test('International query must propose foreign destinations', () => {
  const intlChips = getDefaultActionChips(
    { latitude: 11.24, longitude: -74.20 },
    'Quiero hacer un viaje internacional fuera del país'
  )
  assert.ok(intlChips.includes('París') || intlChips.includes('Madrid') || intlChips.includes('Nueva York'))
})
