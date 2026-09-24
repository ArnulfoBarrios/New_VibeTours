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
  if (hotels.length > 0) {
    assert.ok(hotels.every(h => h.name && typeof h.name === 'string'), 'All hotels must have a non-empty name')
  }
})

test('getRealDestinationCatalog includes hotels for Bucaramanga via dynamic resolution', async () => {
  const catalog = await getRealDestinationCatalog('Bucaramanga', 'Colombia')

  assert.ok(catalog, 'Catalog must be returned for Bucaramanga')
  assert.ok(Array.isArray(catalog.hotels), 'Catalog hotels must be an array')
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
  assert.ok(res.actionChips && res.actionChips.length >= 1, 'Action chips should contain options')
})
