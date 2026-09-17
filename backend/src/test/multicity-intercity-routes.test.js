import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractChatInformationFallback } from '../services/openai.js'

describe('Multi-City & Inter-City Route Extraction Tests', () => {
  it('should extract origin and destination from "Crea un tour desde Barranquilla hasta Santa Marta"', () => {
    const result = extractChatInformationFallback('Crea un tour desde Barranquilla hasta Santa Marta')
    assert.equal(result.isMultiCity, true)
    assert.equal(result.originPlace, 'Barranquilla')
    assert.equal(result.destinationPlace, 'Santa Marta')
    assert.deepEqual(result.cities, ['Barranquilla', 'Santa Marta'])
    assert.equal(result.destination, 'Barranquilla a Santa Marta')
  })

  it('should extract origin and destination from "Tour de Bogotá a Medellín"', () => {
    const result = extractChatInformationFallback('Tour de Bogotá a Medellín')
    assert.equal(result.isMultiCity, true)
    assert.equal(result.originPlace, 'Bogotá')
    assert.equal(result.destinationPlace, 'Medellín')
    assert.deepEqual(result.cities, ['Bogotá', 'Medellín'])
    assert.equal(result.destination, 'Bogotá a Medellín')
  })

  it('should extract origin and destination from "Road trip de Madrid a Barcelona para 3 días"', () => {
    const result = extractChatInformationFallback('Road trip de Madrid a Barcelona para 3 días')
    assert.equal(result.isMultiCity, true)
    assert.equal(result.originPlace, 'Madrid')
    assert.equal(result.destinationPlace, 'Barcelona')
    assert.deepEqual(result.cities, ['Madrid', 'Barcelona'])
    assert.equal(result.durationDays, 3)
  })

  it('should NOT treat budget or movement phrases like "de 7 millones de pesos y nos vamos a mover en carro" as a multi-city route', () => {
    const result1 = extractChatInformationFallback('Tenemos un presupuesto de 7 millones de pesos y nos vamos a mover en carro')
    assert.equal(result1.isMultiCity, undefined)
    assert.notEqual(result1.city, 'Mover')
    assert.notEqual(result1.destination, 'Pesos Y Nos Vamos a Mover')

    const result2 = extractChatInformationFallback('Nos vamos a mover en carro y nos vamos a quedar en el Hotel Linda Palma')
    assert.equal(result2.isMultiCity, undefined)
    assert.notEqual(result2.city, 'Mover')
  })
})
