import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyUserIntent, INTENT_TYPES } from '../services/intentClassifier.js'
import { extractChatInformationFallback } from '../services/openai.js'

describe('Intent Classification Unit Tests', () => {
  it('should classify "presupuesto" as ambiguous and request clarification without inferring transport', () => {
    const result = classifyUserIntent('presupuesto')
    assert.equal(result.intent, INTENT_TYPES.AMBIGUOUS)
    assert.equal(result.needsClarification, true)
    assert.ok(result.confidence < 0.70)
    assert.ok(result.options && result.options.length > 0)
    assert.equal(result.options[0].label, 'Presupuesto')
  })

  it('should NOT infer auto rentado or budget from single word "presupuesto"', () => {
    const extracted = extractChatInformationFallback('presupuesto')
    assert.equal(extracted.transport, undefined)
    assert.equal(extracted.budget, undefined)
  })

  it('should classify explicit "rentar auto" as transport_inquiry with high confidence', () => {
    const result = classifyUserIntent('Quiero rentar auto para el viaje')
    assert.equal(result.intent, INTENT_TYPES.TRANSPORT_INQUIRY)
    assert.equal(result.needsClarification, false)
    assert.ok(result.confidence >= 0.70)
  })

  it('should classify "agregar festival cultural al itinerario" as add_event', () => {
    const result = classifyUserIntent('Por favor agrega el festival de música al itinerario')
    assert.equal(result.intent, INTENT_TYPES.ADD_EVENT)
    assert.equal(result.needsClarification, false)
    assert.ok(result.confidence >= 0.70)
  })

  it('should classify "quiero viajar a Barcelona" as plan_trip', () => {
    const result = classifyUserIntent('Quiero viajar a Barcelona en septiembre')
    assert.equal(result.intent, INTENT_TYPES.PLAN_TRIP)
    assert.equal(result.needsClarification, false)
    assert.ok(result.confidence >= 0.70)
  })
})
