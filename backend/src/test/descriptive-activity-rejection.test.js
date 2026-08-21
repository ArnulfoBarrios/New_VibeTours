import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace } from '../routes/ai.js'

test('isValidSpecificPlace must reject all descriptive activities, hotel names, and generic phrases from screenshot', () => {
  // Rejections
  assert.equal(isValidSpecificPlace('[Llegada / Hotel Irotama]'), false)
  assert.equal(isValidSpecificPlace('Llegada / Hotel Irotama'), false)
  assert.equal(isValidSpecificPlace('Hotel Irotama'), false)
  assert.equal(isValidSpecificPlace('Irotama'), false)
  assert.equal(isValidSpecificPlace('Exploración en Palomino'), false)
  assert.equal(isValidSpecificPlace('[Exploración en Palomino]'), false)
  assert.equal(isValidSpecificPlace('Café y cascadas en Minca'), false)
  assert.equal(isValidSpecificPlace('[Café y cascadas en Minca]'), false)
  assert.equal(isValidSpecificPlace('Tarde libre'), false)
  assert.equal(isValidSpecificPlace('[Tarde libre]'), false)
  assert.equal(isValidSpecificPlace('Tarde en la playa'), false)
  assert.equal(isValidSpecificPlace('[Tarde en la playa]'), false)
  assert.equal(isValidSpecificPlace('la playa'), false)
  assert.equal(isValidSpecificPlace('playa'), false)
  assert.equal(isValidSpecificPlace('el mar'), false)
  assert.equal(isValidSpecificPlace('Despedida'), false)
  assert.equal(isValidSpecificPlace('[Despedida]'), false)

  // Authentic places must be ACCEPTED
  assert.equal(isValidSpecificPlace('Playa El Rodadero'), true)
  assert.equal(isValidSpecificPlace('Restaurante Ouzo'), true)
  assert.equal(isValidSpecificPlace('Cabo San Juan del Guía'), true)
  assert.equal(isValidSpecificPlace('Restaurante Donde Chucho'), true)
  assert.equal(isValidSpecificPlace('Bahía de Taganga'), true)
  assert.equal(isValidSpecificPlace('Playa Cristal'), true)
  assert.equal(isValidSpecificPlace('Quinta de San Pedro Alejandrino'), true)
  assert.equal(isValidSpecificPlace('Restaurante Burukuka'), true)
  assert.equal(isValidSpecificPlace('Museo del Oro Tairona'), true)
  assert.equal(isValidSpecificPlace('Playa de Palomino'), true)
  assert.equal(isValidSpecificPlace('Discoteca La Puerta'), true)
  assert.equal(isValidSpecificPlace('Centro Comercial Buenavista'), true)
  assert.equal(isValidSpecificPlace('Restaurante Ostrería Mary'), true)
})
