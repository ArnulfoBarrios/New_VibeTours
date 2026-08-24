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
})
