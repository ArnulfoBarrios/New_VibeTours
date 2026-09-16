import test from 'node:test'
import assert from 'node:assert/strict'

import { canonicalPlaceKey, deduplicatePlacesByName } from '../routes/ai.js'
import { collapseCanonicalDuplicateLines, deduplicateChatSpecificPlaces } from '../services/openai.js'
import { canonicalPlaceId, resolveCanonicalPlaceIdentity } from '../services/osm.js'

test('Casa del Carnaval y Museo del Carnaval comparten una identidad física', () => {
  assert.equal(canonicalPlaceId('Casa del Carnaval', 'Barranquilla'), 'barranquilla-carnaval-house-museum')
  assert.equal(canonicalPlaceId('Museo del Carnaval, Barranquilla, Colombia'), 'barranquilla-carnaval-house-museum')
  assert.equal(
    canonicalPlaceKey('Casa del Carnaval', 'Barranquilla'),
    canonicalPlaceKey('Museo del Carnaval', 'Barranquilla'),
  )

  const identity = resolveCanonicalPlaceIdentity('Museo del Carnaval', 'Barranquilla')
  assert.equal(identity?.geocodeQuery, 'Casa del Carnaval, Barranquilla, Colombia')
})

test('la deduplicación fusiona los alias del complejo aunque la IA les asigne días distintos', () => {
  const places = deduplicatePlacesByName([
    { name: 'Casa del Carnaval', dia: 2, day: 2 },
    { name: 'Museo del Carnaval', dia: 3, day: 3 },
  ])

  assert.equal(places.length, 1)
  assert.match(places[0].name, /Carnaval/)
  assert.equal(places[0].dia, 2)
})

test('la respuesta textual del chat no muestra Casa y Museo del Carnaval como paradas distintas', () => {
  const structured = deduplicateChatSpecificPlaces([
    { name: 'Museo del Carnaval', dia: 2 },
    { name: 'Casa del Carnaval', dia: 2 },
  ], 'Barranquilla')
  assert.equal(structured.length, 1)
  assert.equal(structured[0].name, 'Casa del Carnaval')

  const itinerary = [
    'Día 2: Barranquilla',
    '• Museo del Carnaval',
    '• Casa del Carnaval',
    '• La Cueva',
  ].join('\n')
  const collapsed = collapseCanonicalDuplicateLines(itinerary, 'Barranquilla')
  assert.equal((collapsed.match(/Carnaval/gi) || []).length, 1)
  assert.match(collapsed, /La Cueva/)
})
