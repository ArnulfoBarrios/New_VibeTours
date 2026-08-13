import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isVagueDestination } from '../services/openai.js'

describe('Chat Memory & Context Unit Test', () => {
  it('should NOT classify confirmed cities (Tulum, Rio de Janeiro, Bali, etc.) as vague destinations', () => {
    assert.equal(isVagueDestination('Tulum, México'), false)
    assert.equal(isVagueDestination('Rio de Janeiro'), false)
    assert.equal(isVagueDestination('Bali, Indonesia'), false)
    assert.equal(isVagueDestination('Tokio'), false)
  })

  it('should preserve canonical destination even for short names', () => {
    const knownContext = {
      city: 'Tulum',
      destination: 'Tulum, México',
      canonicalDestination: {
        city: 'Tulum',
        country: 'México',
        latitude: 20.2114,
        longitude: -87.4654
      }
    }

    assert.equal(isVagueDestination(knownContext.city, knownContext), false)
  })

  it('should ONLY classify generic terms like "playas" or "montaña" as vague destinations when no canonical city exists', () => {
    assert.equal(isVagueDestination('playas'), true)
    assert.equal(isVagueDestination('naturaleza'), true)
    assert.equal(isVagueDestination('alojamiento'), true)
  })
})
