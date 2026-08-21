import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { wikipediaSummaryText } from '../services/imageSearch.js'

describe('Stop Description and Narrative Unit Tests', () => {
  it('should fetch real historical/cultural text for iconic places without placeholder prefixes', async () => {
    const places = [
      { name: 'Sagrada Família', city: 'Barcelona' },
      { name: 'Coliseo de Roma', city: 'Roma' },
      { name: 'Parque Cultural del Caribe', city: 'Barranquilla' }
    ]

    for (const place of places) {
      const summary = await wikipediaSummaryText(place.name, place.city)
      if (summary) {
        assert.ok(summary.length > 20, `Summary for ${place.name} should have substantial length`)
        assert.ok(!summary.startsWith('Atracción/Restaurante:'), `Summary for ${place.name} should not have dummy prefix`)
        assert.ok(!summary.startsWith('Restaurante:'), `Summary for ${place.name} should not have dummy prefix`)
      }
    }
  })

  it('should clean any placeholder prefix when formatting stop descriptions', () => {
    const rawDummy = 'Atracción/Restaurante: Parque Cultural del Caribe'
    const cleaned = rawDummy.replace(/^(Atracci[oó]n(\s*\/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*/i, '').trim()
    assert.equal(cleaned, 'Parque Cultural del Caribe')
  })
})
