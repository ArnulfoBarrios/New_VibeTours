import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractChatInformationFallback,
  generateChatResponse
} from '../services/openai.js'
import { isValidSpecificPlace } from '../routes/ai.js'

test('1. extractChatInformationFallback rejects superlative and generic noun phrases as stops', () => {
  const ext = extractChatInformationFallback(
    'Quiero hacer un tour a Barranquilla de un día con mis amigos, quiero conocer los lugares más bonitos'
  )
  assert.equal(ext.city, 'Barranquilla')
  assert.equal(ext.durationDays, 1)
  assert.match(ext.companions, /amigos|grupo/i)
  assert.ok(
    !ext.specificPlaces || ext.specificPlaces.length === 0,
    'Debe rechazar "los lugares más bonitos" como parada específica'
  )
  assert.equal(isValidSpecificPlace('Lugares más bonitos'), false)
  assert.equal(isValidSpecificPlace('Los mejores lugares'), false)
})

test('2. generateChatResponse asks for transport and budget when missing on 1-day tour', async () => {
  const state = {
    history: [{ role: 'user', content: 'Quiero hacer un tour a Barranquilla de un día con mis amigos' }]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo'
  })

  assert.equal(res.readyToBuild, false)
  assert.match(res.responseMessage, /transporte/i)
  assert.match(res.responseMessage, /presupuesto/i)
  assert.doesNotMatch(res.responseMessage, /hotel|alojamiento/i)
  assert.ok(res.actionChips.some(c => /auto|taxi/i.test(c)))
  assert.ok(res.actionChips.some(c => /económico|moderado/i.test(c)))
})

test('3. generateChatResponse creates 5 stops with midday lunch and proper grammar for 1-day tour', async () => {
  const state = {
    history: [{ role: 'user', content: 'vamos en auto rentado y presupuesto moderado' }]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo',
    transport: 'Auto rentado',
    budget: 'Moderado'
  })

  assert.equal(res.readyToBuild, false)
  // Must not have grammatical flaw "con en grupo"
  assert.doesNotMatch(res.responseMessage, /con\s+en\s+grupo/i)
  // Must preserve all 5 stops without deleting them in sanitizer
  assert.match(res.responseMessage, /1\.\s+.*09:00\s+AM/i)
  assert.match(res.responseMessage, /2\.\s+.*11:00\s+AM/i)
  assert.match(res.responseMessage, /3\.\s+.*12:30\s+PM.*almuerzo/i)
  assert.match(res.responseMessage, /4\.\s+.*03:00\s+PM/i)
  assert.match(res.responseMessage, /5\.\s+.*05:30\s+PM/i)
})

test('4. generateChatResponse triggers readyToBuild: true when user confirms build for 1-day tour', async () => {
  const state = {
    history: [
      { role: 'user', content: 'vamos en auto rentado y presupuesto moderado' },
      { role: 'assistant', content: 'He preparado un recorrido de 5 paradas...' },
      { role: 'user', content: 'Si crea el tour porfa' }
    ]
  }
  const res = await generateChatResponse(state, '', '', {
    city: 'Barranquilla',
    destination: 'Barranquilla',
    durationDays: 1,
    companions: 'En grupo',
    transport: 'Auto rentado',
    budget: 'Moderado'
  })

  assert.equal(res.readyToBuild, true)
  assert.match(res.responseMessage, /generar tu tour/i)
})
