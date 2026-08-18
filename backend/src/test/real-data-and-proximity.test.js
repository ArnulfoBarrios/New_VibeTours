import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanAdministrativeCityName } from '../services/destinationService.js'
import { getDestinationPresets, DESTINATION_LOCAL_PRESETS, getDefaultActionChips } from '../services/openai.js'

test('cleanAdministrativeCityName should strip administrative prefixes correctly', () => {
  assert.equal(cleanAdministrativeCityName('Perímetro Urbano Santa Marta'), 'Santa Marta')
  assert.equal(cleanAdministrativeCityName('perimetro urbano de santa marta'), 'santa marta')
  assert.equal(cleanAdministrativeCityName('Distrito Turístico, Cultural e Histórico de Santa Marta'), 'Santa Marta')
  assert.equal(cleanAdministrativeCityName('Distrito Capital de Bogotá'), 'Bogotá')
  assert.equal(cleanAdministrativeCityName('Municipio de Medellín'), 'Medellín')
  assert.equal(cleanAdministrativeCityName('Comuna 13 de Medellín'), 'Medellín')
  assert.equal(cleanAdministrativeCityName('Cartagena, Bolívar'), 'Cartagena, Bolívar')
})

test('Santa Marta preset must contain only 100% verified real physical places and events', () => {
  const santaMarta = getDestinationPresets('Santa Marta', 'Colombia')
  assert.ok(santaMarta, 'Santa Marta preset should exist')
  assert.equal(santaMarta.name, 'Santa Marta')
  assert.equal(santaMarta.country, 'Colombia')

  // Verify Real Hotels
  const hotelNames = santaMarta.hotels.map(h => h.name)
  assert.ok(hotelNames.includes('Hotel Irotama Resort'))
  assert.ok(hotelNames.includes('Hotel Boutique Don Pepe'))
  assert.ok(hotelNames.includes('Santa Marta Marriott Resort Playa Dormida'))

  // Must NOT contain generic synthetic template names
  for (const name of hotelNames) {
    assert.notEqual(name, 'Hotel Boutique Santa Marta')
    assert.notEqual(name, 'Gran Hotel Santa Marta')
    assert.notEqual(name, 'Hotel Boutique Perímetro Urbano Santa Marta')
  }

  // Verify Real Restaurants
  const restNames = santaMarta.restaurants.map(r => r.name)
  assert.ok(restNames.includes('Restaurante Donde Chucho'))
  assert.ok(restNames.includes('Restaurante Guásimo'))
  assert.ok(restNames.includes('Restaurante Ostrería Mary'))

  for (const name of restNames) {
    assert.notEqual(name, 'Restaurante Tradicional Santa Marta')
    assert.notEqual(name, 'Mercado Gastronómico Santa Marta')
    assert.notEqual(name, 'Mercado Gastronómico Perímetro Urbano Santa Marta')
  }

  // Verify Real Attractions
  assert.ok(santaMarta.places.includes('Parque Nacional Natural Tayrona'))
  assert.ok(santaMarta.places.includes('Quinta de San Pedro Alejandrino'))
  assert.ok(santaMarta.places.includes('Bahía de Taganga'))

  // Verify Real Events (Fiesta del Mar in July)
  const eventNames = santaMarta.events.map(e => e.name)
  assert.ok(eventNames.includes('Fiesta del Mar'))
  const fiestaDelMar = santaMarta.events.find(e => e.name === 'Fiesta del Mar')
  assert.match(fiestaDelMar.month, /julio/i)

  // Must NOT contain hallucinated festivals like "Festival de la Cultura del Caribe en octubre"
  assert.ok(!eventNames.includes('Festival de la Cultura del Caribe'))
  assert.ok(!eventNames.includes('Festival Internacional de Jazz de Santa Marta'))
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
