import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStop } from '../routes/ai.js'
import { haversineMeters } from '../services/osm.js'

test('normalizeStop overrides OpenAI hallucinated coordinates with authentic landmark coordinates', async () => {
  const input = {
    destination: 'Barranquilla',
    city: 'Barranquilla',
    country: 'Colombia',
    durationDays: 7,
    durationHours: 168,
    canonicalDestination: {
      latitude: 10.9685,
      longitude: -74.7813,
      displayName: 'Barranquilla',
      city: 'Barranquilla',
      country: 'Colombia'
    }
  }

  // 1. Iglesia de San Nicolás de Tolentino with hallucinated San José church coordinates
  const stopSanNicolas = {
    nombre: 'Iglesia de San Nicolás de Tolentino',
    dia: 4,
    descripcion: 'Templo católico histórico en el centro de la ciudad.',
    ubicacion: {
      nombre_lugar: 'Iglesia de San Nicolás',
      latitud: 10.9792, // San José hallucination
      longitud: -74.7823
    }
  }
  const normSanNicolas = await normalizeStop(stopSanNicolas, 3, input, null, [])
  assert.ok(normSanNicolas?.publicStop?.ubicacion, 'San Nicolas stop must be normalized')
  const distSanNicolas = haversineMeters(normSanNicolas.publicStop.ubicacion.latitud, normSanNicolas.publicStop.ubicacion.longitud, 10.9801, -74.7780)
  assert.ok(distSanNicolas < 200, `San Nicolas resolved at ${distSanNicolas}m from Plaza San Nicolas (must be < 200m)`)
  const distSanJose = haversineMeters(normSanNicolas.publicStop.ubicacion.latitud, normSanNicolas.publicStop.ubicacion.longitud, 10.9792, -74.7823)
  assert.ok(distSanJose > 350, 'Must NOT retain hallucinated San Jose church coordinates')

  // 2. Restaurante Narcobollo with hallucinated Cra 50 coordinates
  const stopNarcobollo = {
    nombre: 'Restaurante Narcobollo',
    dia: 5,
    descripcion: 'Establecimiento de gastronomía tradicional costeña.',
    ubicacion: {
      nombre_lugar: 'Narcobollo',
      latitud: 11.0010, // Cra 50 hallucination
      longitud: -74.8150
    }
  }
  const normNarcobollo = await normalizeStop(stopNarcobollo, 4, input, null, [])
  assert.ok(normNarcobollo?.publicStop?.ubicacion, 'Narcobollo stop must be normalized')
  const distNarcobollo = haversineMeters(normNarcobollo.publicStop.ubicacion.latitud, normNarcobollo.publicStop.ubicacion.longitud, 11.0053, -74.8213)
  assert.ok(distNarcobollo < 100, `Narcobollo resolved at ${distNarcobollo}m from Cra 43 # 84-188 (must be < 100m)`)

  // 3. Restaurante Cucayo with hallucinated Cra 47 coordinates
  const stopCucayo = {
    nombre: 'Restaurante Cucayo',
    dia: 6,
    descripcion: 'Cocina típica del Caribe colombiano.',
    ubicacion: {
      nombre_lugar: 'Cucayo',
      latitud: 10.9990, // Cra 47 hallucination
      longitud: -74.8100
    }
  }
  const normCucayo = await normalizeStop(stopCucayo, 5, input, null, [])
  assert.ok(normCucayo?.publicStop?.ubicacion, 'Cucayo stop must be normalized')
  const distCucayo = haversineMeters(normCucayo.publicStop.ubicacion.latitud, normCucayo.publicStop.ubicacion.longitud, 10.9972, -74.8095)
  assert.ok(distCucayo < 100, `Cucayo resolved at ${distCucayo}m from Cra 49C # 76-08 (must be < 100m)`)

  // 4. Muelle de Puerto Colombia with hallucinated open-sea coordinates
  const stopMuelle = {
    nombre: 'Muelle de Puerto Colombia',
    dia: 7,
    descripcion: 'Muelle histórico en la costa del Atlántico.',
    ubicacion: {
      nombre_lugar: 'Muelle de Puerto Colombia',
      latitud: 10.9850, // Hallucination in the sea
      longitud: -74.9850
    }
  }
  const normMuelle = await normalizeStop(stopMuelle, 6, input, null, [])
  assert.ok(normMuelle?.publicStop?.ubicacion, 'Muelle stop must be normalized')
  const distMuelle = haversineMeters(normMuelle.publicStop.ubicacion.latitud, normMuelle.publicStop.ubicacion.longitud, 10.9893, -74.9612)
  assert.ok(distMuelle < 500, `Muelle resolved at ${distMuelle}m from shore pier (must be < 500m)`)
  const distSea = haversineMeters(normMuelle.publicStop.ubicacion.latitud, normMuelle.publicStop.ubicacion.longitud, 10.9850, -74.9850)
  assert.ok(distSea > 1000, 'Must NOT be in the middle of the sea')

  // 5. Restaurante El Celler with hallucinated Cra 55 coordinates
  const stopCeller = {
    nombre: 'Restaurante El Celler',
    dia: 7,
    descripcion: 'Alta gastronomía española y mediterránea.',
    ubicacion: {
      nombre_lugar: 'El Celler',
      latitud: 11.0050, // Cra 55 hallucination
      longitud: -74.8090
    }
  }
  const normCeller = await normalizeStop(stopCeller, 7, input, null, [])
  assert.ok(normCeller?.publicStop?.ubicacion, 'El Celler stop must be normalized')
  const distCeller = haversineMeters(normCeller.publicStop.ubicacion.latitud, normCeller.publicStop.ubicacion.longitud, 11.0022, -74.8075)
  assert.ok(distCeller < 100, `El Celler resolved at ${distCeller}m from Cra 54 # 75-119 (must be < 100m)`)
})
