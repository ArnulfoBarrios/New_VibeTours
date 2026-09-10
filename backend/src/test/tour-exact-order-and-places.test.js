import test from 'node:test'
import assert from 'node:assert/strict'
import { collectTourCandidates, buildTourPlanner, normalizeStop } from '../routes/ai.js'

test('Tour Planner preserves 100% of chat stops, their assigned days and exact sequential order', async (t) => {
  const specificPlaces = [
    { name: 'Gran Malecón del Río', dia: 1 },
    { name: 'Ventana al Mundo', dia: 1 },
    { name: 'Nancy Cabrera Restaurante y Repostería', dia: 1 },
    { name: 'Narcobollo', dia: 2 },
    { name: 'Museo del Carnaval', dia: 2 },
    { name: 'Restaurante y Refresquería Las 5 Mentiritas', dia: 2 },
    { name: 'La Cueva', dia: 3 },
    { name: 'Barrio El Prado', dia: 3 },
    { name: 'Restaurante Jardines De Confucio', dia: 3 },
    { name: 'Zoológico de Barranquilla', dia: 4 },
    { name: 'Catedral Metropolitana María Reina', dia: 4 },
    { name: 'Restaurante Monstro', dia: 4 },
    { name: 'Iglesia de San Nicolás de Tolentino', dia: 5 },
    { name: 'Plaza de la Aduana', dia: 5 },
    { name: 'Restaurante Hong Kung Cheng', dia: 5 },
    { name: 'Estación Montoya', dia: 6 },
    { name: 'Cucayo', dia: 6 },
    { name: 'Restaurante morgan', dia: 6 },
    { name: 'Ciénaga de Mallorquín', dia: 7 },
    { name: 'Bocas de Cenizas', dia: 7 },
    { name: 'Restaurante gran maiz', dia: 7 }
  ]

  const input = {
    destination: 'Barranquilla, Atlántico, Colombia',
    city: 'Barranquilla',
    country: 'Colombia',
    durationDays: 7,
    durationHours: 168,
    type: 'custom',
    specificPlaces,
    selectedPlaces: specificPlaces
  }

  const location = {
    name: 'Barranquilla',
    latitude: 10.9685,
    longitude: -74.7813,
    city: 'Barranquilla',
    country: 'Colombia'
  }

  const candidatePack = await collectTourCandidates(input, location)
  assert.equal(candidatePack.places.length, 21, 'Candidate pack must preserve all 21 places')

  const planner = buildTourPlanner(input, location, candidatePack.places)
  assert.equal(planner.selectedPlaces.length, 21, 'Planner must select exactly the 21 confirmed places')

  // Verify that each day contains precisely the 3 places in the exact sequential order of the chat
  for (let d = 1; d <= 7; d++) {
    const expectedForDay = specificPlaces.filter(p => p.dia === d).map(p => p.name)
    const actualForDay = planner.selectedPlaces.filter(p => Number(p.dia || p.day) === d).map(p => p.name)

    assert.equal(actualForDay.length, 3, 'Day ' + d + ' must contain exactly 3 stops')
    assert.deepEqual(actualForDay, expectedForDay, 'Day ' + d + ' must preserve exact sequential order')
  }

  // Verify that normalizeStop resolves all 21 places with authentic coordinates
  for (let i = 0; i < planner.selectedPlaces.length; i++) {
    const p = planner.selectedPlaces[i]
    const normalized = await normalizeStop(p, i, input, null, planner.selectedPlaces, p.dia)
    assert.ok(normalized.publicStop, 'Stop ' + p.name + ' must normalize')
    assert.equal(normalized.publicStop.dia, p.dia, 'Stop ' + p.name + ' must have day ' + p.dia)
    assert.ok(Number.isFinite(normalized.publicStop.ubicacion.latitud), 'Stop ' + p.name + ' must have valid latitude')
    assert.ok(Number.isFinite(normalized.publicStop.ubicacion.longitud), 'Stop ' + p.name + ' must have valid longitude')
  }
})
