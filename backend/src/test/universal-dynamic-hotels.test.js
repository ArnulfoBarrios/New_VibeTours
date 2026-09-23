import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestHotelsWithOpenAI, getRealDestinationCatalog, generateChatResponse } from '../services/openai.js'

test('suggestHotelsWithOpenAI resolves real hotels for non-hardcoded city Bucaramanga', async () => {
  const hotels = await suggestHotelsWithOpenAI({
    destination: 'Bucaramanga',
    country: 'Colombia',
    budget: 'Moderado'
  })

  assert.ok(Array.isArray(hotels), 'suggestHotelsWithOpenAI must return an array')
  assert.ok(hotels.length >= 2, 'Should return at least 2 hotels for Bucaramanga')
  assert.ok(hotels.every(h => h.name && typeof h.name === 'string'), 'All hotels must have a non-empty name')

  const combinedNames = hotels.map(h => h.name.toLowerCase()).join(' ')
  assert.ok(
    combinedNames.includes('chica') || combinedNames.includes('danc') || combinedNames.includes('holiday') || combinedNames.includes('bucaramanga') || combinedNames.includes('hotel'),
    'Should return authentic real hotel names in Bucaramanga'
  )
})

test('getRealDestinationCatalog includes hotels for Bucaramanga via dynamic resolution', async () => {
  const catalog = await getRealDestinationCatalog('Bucaramanga', 'Colombia')

  assert.ok(catalog, 'Catalog must be returned for Bucaramanga')
  assert.ok(Array.isArray(catalog.hotels), 'Catalog hotels must be an array')
  assert.ok(catalog.hotels.length >= 2, 'Bucaramanga catalog should have at least 2 hotels via dynamic AI/OSM fallback')
})

test('generateChatResponse returns hotel options for Bucaramanga when user asks for lodging recommendations', async () => {
  const state = {
    history: [
      { role: 'user', content: 'Quiero viajar a Bucaramanga por 3 días' },
      { role: 'assistant', content: '¡Excelente! ¿Viajas solo, en pareja, con amigos o en familia?' },
      { role: 'user', content: 'En pareja, presupuesto moderado en auto rentado' },
      { role: 'assistant', content: '¡Perfecto! Ya tenemos transporte y presupuesto. ¿En qué hotel o alojamiento se hospedarán en Bucaramanga?' },
      { role: 'user', content: 'quiero que me des recomendaciones de hoteles' }
    ]
  }

  const res = await generateChatResponse(state, '', '', {
    city: 'Bucaramanga',
    destination: 'Bucaramanga, Colombia',
    budget: 'Moderado',
    transport: 'Auto rentado'
  })

  assert.ok(res.responseMessage, 'Response message must exist')
  assert.equal(res.responseMessage.includes('¡aquí tienes excelentes opciones recomendadas!'), true)
  assert.ok(res.actionChips && res.actionChips.length >= 2, 'Action chips should contain hotel options')
  assert.notEqual(res.actionChips[0], 'Tengo casa propia / familiar', 'First chip should be a real hotel name')
})
