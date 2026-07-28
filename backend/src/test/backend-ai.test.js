import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizePlaces } from '../services/openai.js'
import { overpassAttractions } from '../services/osm.js'

test('summarizePlaces formats places accurately', () => {
  const places = [
    { name: 'Castillo de San Felipe', city: 'Cartagena', country: 'Colombia', category: 'historic', distanceMeters: 1200, score: 95 },
    { name: 'Playa Blanca', city: 'Cartagena', country: 'Colombia', type: 'beach', distanceMeters: 5000, score: 90 }
  ]
  const summary = summarizePlaces(places)
  assert.equal(summary.length, 2)
  assert.equal(summary[0].order, 1)
  assert.equal(summary[0].name, 'Castillo de San Felipe')
  assert.equal(summary[0].type, 'historic')
  assert.equal(summary[1].type, 'beach')
})

test('overpassAttractions handles coordinates gracefully', async () => {
  // Coordinates for Cartagena, Colombia (10.3997, -75.5144)
  const results = await overpassAttractions(10.3997, -75.5144, 2000)
  assert.ok(Array.isArray(results), 'Results should be an array')
  console.log(`[test] overpassAttractions returned ${results.length} POIs`)
})
