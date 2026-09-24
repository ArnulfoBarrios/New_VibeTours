import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAiPlanCandidateIds } from '../services/openai.js'
import { getCandidateId } from '../services/candidate-catalog.js'

const candidates = [
  {
    candidateId: 'mapbox:poi-123',
    name: 'Museo Real',
    latitude: 4.711,
    longitude: -74.072
  },
  {
    candidateId: 'geoapify:place-456',
    name: 'Restaurante Real',
    latitude: 4.712,
    longitude: -74.073
  }
]

test('candidate IDs prefer provider identity over display names or internal IDs', () => {
  assert.equal(getCandidateId({
    name: 'Lugar real',
    id: 'internal-row-id',
    placeId: 'mapbox:poi-123'
  }), 'mapbox:poi-123')
})

test('AI itinerary is accepted only when every stop references a catalog candidate ID', () => {
  assert.equal(validateAiPlanCandidateIds({
    itinerario: [
      { candidateId: 'mapbox:poi-123', nombre: 'Nombre visible 1' },
      { candidateId: 'geoapify:place-456', nombre: 'Nombre visible 2' }
    ]
  }, candidates), true)

  assert.equal(validateAiPlanCandidateIds({
    itinerario: [
      { candidateId: 'mapbox:poi-123', nombre: 'Museo Real' },
      { candidateId: 'inventado:unknown', nombre: 'Lugar inventado' }
    ]
  }, candidates), false)

  assert.equal(validateAiPlanCandidateIds({
    itinerario: [
      { nombre: 'Museo Real' },
      { nombre: 'Restaurante Real' }
    ]
  }, candidates), false)
})
