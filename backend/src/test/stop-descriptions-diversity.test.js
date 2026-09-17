import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateRichPlaceDescriptionsBatch } from '../services/openai.js'
import { normalizeStop } from '../routes/ai.js'

describe('Stop Descriptions and Activities Diversity (Ventana de Campeones Standard)', () => {
  it('should generate diverse, non-identical descriptions across multiple stops of the same category', async () => {
    const stops = [
      'Playa Primera Coveñas',
      'Playa Segunda Coveñas',
      'Playa Blanca Coveñas'
    ]

    const result = await generateRichPlaceDescriptionsBatch({
      destination: 'Coveñas',
      city: 'Coveñas',
      places: stops
    })

    const descriptions = stops.map(s => result[s]?.descripcion).filter(Boolean)
    assert.equal(descriptions.length, 3, 'Should produce descriptions for all 3 stops')

    // None should contain forbidden formulaic cliches
    for (const desc of descriptions) {
      assert.ok(!desc.includes('es un sitio ideal para'), 'Must not contain formulaic "es un sitio ideal para"')
      assert.ok(!desc.includes('durante el recorrido te sugerimos enfocar tu atención en'), 'Must not contain formulaic focus advice')
    }

    // Descriptions should not be completely identical
    const uniqueDescs = new Set(descriptions)
    assert.ok(uniqueDescs.size > 1, 'Multiple beaches must not have 100% identical descriptions')
  })

  it('should generate distinct, tangible activities across different stops', async () => {
    const stops = [
      'Playa Primera Coveñas',
      'Paseo Marítimo Coveñas',
      'Ciénaga de la Caimanera'
    ]

    const result = await generateRichPlaceDescriptionsBatch({
      destination: 'Coveñas',
      city: 'Coveñas',
      places: stops
    })

    const act1 = result['Playa Primera Coveñas']?.actividades || []
    const act2 = result['Paseo Marítimo Coveñas']?.actividades || []
    const act3 = result['Ciénaga de la Caimanera']?.actividades || []

    assert.ok(act1.length >= 2, 'Stop 1 should have at least 2 activities')
    assert.ok(act2.length >= 2, 'Stop 2 should have at least 2 activities')
    assert.ok(act3.length >= 2, 'Stop 3 should have at least 2 activities')

    // Activities for beach, promenade and wetland should be distinct
    const firstActs = [act1[0], act2[0], act3[0]]
    const uniqueFirstActs = new Set(firstActs)
    assert.equal(uniqueFirstActs.size, 3, 'First activity across distinct stop types should be unique')
  })

  it('should normalize stops without formulaic cliches when fallback description is used', async () => {
    const rawStop = {
      nombre: 'Paseo Marítimo Coveñas',
      categoria: 'promenade',
      latitude: 9.4069,
      longitude: -75.6983,
      coordinatesVerified: true
    }

    const input = {
      destination: 'Coveñas, Colombia',
      city: 'Coveñas',
      type: 'custom'
    }

    const normalized = await normalizeStop(rawStop, 0, input, null, [rawStop], 1, {})
    const desc = normalized.publicStop.descripcion
    assert.ok(desc && desc.length > 20, 'Description should be present and substantial')
    assert.ok(!desc.includes('es un sitio ideal para'), 'Must not contain "es un sitio ideal para"')
    assert.ok(!desc.includes('durante el recorrido te sugerimos enfocar tu atención en'), 'Must not contain "durante el recorrido..."')
  })
})
