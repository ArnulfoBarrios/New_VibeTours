import test, { describe } from 'node:test'
import assert from 'node:assert'
import { suggestHotelsWithOpenAI, suggestPlacesWithOpenAI, getRealDestinationCatalog } from '../src/services/openai.js'

describe('Universal Dynamic Destinations & Hotels Suite', () => {
  test('should return authentic real hotel names for Montería without synthetic placeholders', async () => {
    const hotels = await suggestHotelsWithOpenAI({ destination: 'Montería', country: 'Colombia', budget: 'Moderado' })
    assert.strictEqual(Array.isArray(hotels), true)
    
    for (const h of hotels) {
      assert.ok(h.name)
      assert.doesNotMatch(h.name, /^Hotel Boutique Montería$/i)
      assert.doesNotMatch(h.name, /^Hotel Plaza Montería$/i)
      assert.doesNotMatch(h.name, /^Gran Hotel Montería$/i)
    }
  })

  test('should return authentic real hotel names for Bucaramanga without synthetic placeholders', async () => {
    const hotels = await suggestHotelsWithOpenAI({ destination: 'Bucaramanga', country: 'Colombia', budget: 'Lujo' })
    assert.strictEqual(Array.isArray(hotels), true)
    
    for (const h of hotels) {
      assert.ok(h.name)
      assert.doesNotMatch(h.name, /^Hotel Boutique Bucaramanga$/i)
      assert.doesNotMatch(h.name, /^Hotel Plaza Bucaramanga$/i)
      assert.doesNotMatch(h.name, /^Gran Hotel Bucaramanga$/i)
    }
  })

  test('should return authentic places for any city worldwide using suggestPlacesWithOpenAI', async () => {
    const places = await suggestPlacesWithOpenAI({ destination: 'Montería', country: 'Colombia', count: 6 })
    assert.strictEqual(Array.isArray(places), true)
    assert.ok(places.length > 0)
    for (const p of places) {
      assert.ok(p.name)
      assert.ok(p.name.length > 3)
    }
  })

  test('should construct a rich catalog with at least 4 distinct real places for non-preset destination', async () => {
    const catalog = await getRealDestinationCatalog('Montería', 'Colombia')
    assert.ok(catalog)
    assert.strictEqual(catalog.name, 'Montería')
    assert.strictEqual(Array.isArray(catalog.places), true)
    assert.ok(catalog.places.length >= 4)
    
    for (const place of catalog.places) {
      assert.strictEqual(typeof place, 'string')
      assert.notStrictEqual(place, 'Centro Histórico de Montería')
    }
  })
})
