import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildVisualDestinationSuggestions } from '../services/openai.js'
import { destinationCoverImage } from '../services/imageSearch.js'

describe('Visual Destination Cards Unit Tests', () => {
  it('should return scenic photos and no SVG flags/escudos for suggested cities', async () => {
    const list = ['Tulum, México', 'Miami, EE. UU.', 'Barcelona, España', 'Cancún, México', 'Bali, Indonesia']
    const suggestions = await buildVisualDestinationSuggestions(list)

    assert.equal(suggestions.length, 5)

    for (const item of suggestions) {
      assert.ok(item.imageUrl, `imageUrl should exist for ${item.name}`)
      assert.ok(!item.imageUrl.toLowerCase().includes('.svg'), `imageUrl should not be SVG for ${item.name}`)
      assert.ok(!item.imageUrl.toLowerCase().includes('flag'), `imageUrl should not be a flag for ${item.name}`)
      assert.ok(!item.imageUrl.toLowerCase().includes('escudo'), `imageUrl should not be an escudo for ${item.name}`)
      assert.ok(item.imageUrl.startsWith('https://'), `imageUrl should be HTTPS for ${item.name}`)
    }

    // Specific destination checks
    const miami = suggestions.find(s => s.name.includes('Miami'))
    assert.ok(miami.imageUrl.includes('photo-'), 'Miami should have a real scenic photo')

    const barcelona = suggestions.find(s => s.name.includes('Barcelona'))
    assert.ok(barcelona.imageUrl.includes('photo-'), 'Barcelona should have a real scenic landmark photo')

    const tulum = suggestions.find(s => s.name.includes('Tulum'))
    assert.ok(tulum.imageUrl.includes('photo-'), 'Tulum should have a real scenic landmark photo')
  })

  it('should provide scenic cover image fallbacks for various cities', () => {
    const tulumCover = destinationCoverImage('Tulum', 'México')
    assert.ok(tulumCover && !tulumCover.includes('.svg'), 'Tulum cover must be scenic photo')

    const miamiCover = destinationCoverImage('Miami', 'Estados Unidos')
    assert.ok(miamiCover && !miamiCover.includes('.svg'), 'Miami cover must be scenic photo')

    const bcnCover = destinationCoverImage('Barcelona', 'España')
    assert.ok(bcnCover && !bcnCover.includes('.svg'), 'Barcelona cover must be scenic photo')
  })

  it('should filter out non-destination terms like Restaurantes, Eventos locales, Conciertos and action buttons', async () => {
    const list = ['Restaurantes...', 'Eventos locales', 'Conciertos', 'Festivales culinarios', '🚀 Generar tour en Miami', '🏨 Ver opciones de hotel']
    const suggestions = await buildVisualDestinationSuggestions(list)
    assert.equal(suggestions.length, 0, 'No non-destination categories should be converted into destination cards')
  })
})
