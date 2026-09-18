import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidSpecificPlace } from '../routes/ai.js'
import { isNonTouristFacility, isGenericFacilityName } from '../services/osm.js'
import {
  getRealDestinationCatalog,
  generateChatResponse,
  isCountryMatch
} from '../services/openai.js'

test('1. isValidSpecificPlace and isNonTouristFacility must strictly reject resting plazas and hospital squares', () => {
  // Urban resting spots and bench areas from OSM
  assert.equal(isValidSpecificPlace('Plaza descanso 3'), false)
  assert.equal(isValidSpecificPlace('Plaza descanso 1'), false)
  assert.equal(isValidSpecificPlace('Plaza descanso'), false)
  assert.equal(isValidSpecificPlace('Parque descanso'), false)
  assert.equal(isValidSpecificPlace('Plazoleta descanso'), false)
  assert.equal(isValidSpecificPlace('descanso 3'), false)

  // Hospital squares
  assert.equal(isValidSpecificPlace('Plaza Hospital'), false)
  assert.equal(isValidSpecificPlace('Plaza Salud'), false)
  assert.equal(isValidSpecificPlace('Plazoleta Hospital'), false)

  // isNonTouristFacility checks
  assert.equal(isNonTouristFacility({ name: 'Plaza descanso 3' }), true)
  assert.equal(isNonTouristFacility({ name: 'Plaza Hospital' }), true)
  assert.equal(isNonTouristFacility({ name: 'Zona de descanso 2' }), true)

  // isGenericFacilityName checks
  assert.equal(isGenericFacilityName('Plaza descanso 3'), true)
  assert.equal(isGenericFacilityName('Plaza Hospital'), true)

  // Legitimate tourist attractions MUST remain valid
  assert.equal(isValidSpecificPlace('Ventana al Mundo'), true)
  assert.equal(isValidSpecificPlace('Gran Malecón del Río'), true)
  assert.equal(isValidSpecificPlace('Casa del Carnaval'), true)
  assert.equal(isValidSpecificPlace('Ciénaga de la Caimanera'), true)
  assert.equal(isValidSpecificPlace('Segunda Ensenada de Coveñas'), true)
})

test('2. isCountryMatch correctly validates target countries and rejects foreign countries', () => {
  assert.equal(isCountryMatch('Colombia', 'Colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'República de Colombia'), true)
  assert.equal(isCountryMatch('Colombia', 'Brasil'), false)
  assert.equal(isCountryMatch('Colombia', 'Brazil'), false)
  assert.equal(isCountryMatch('Colombia', 'España'), false)
  assert.equal(isCountryMatch('Colombia', 'Spain'), false)
})

test('3. getRealDestinationCatalog for Barranquilla prioritizes iconic landmarks in top positions', async () => {
  const catalog = await getRealDestinationCatalog('Barranquilla', 'Colombia')
  assert.ok(catalog, 'Catalog must be generated for Barranquilla')
  assert.ok(Array.isArray(catalog.places), 'catalog.places must be an array')
  assert.ok(catalog.places.length >= 8, `Expected at least 8 places, got ${catalog.places.length}`)

  // Top positions MUST contain premier iconic landmarks
  const topPlaces = catalog.places.slice(0, 8)
  const hasVentana = topPlaces.some(p => p.toLowerCase().includes('ventana al mundo'))
  const hasMalecon = topPlaces.some(p => p.toLowerCase().includes('malecon') || p.toLowerCase().includes('malecón'))
  const hasCarnaval = topPlaces.some(p => p.toLowerCase().includes('carnaval'))

  assert.ok(hasVentana, `Top places should contain Ventana al Mundo, got: ${topPlaces.join(', ')}`)
  assert.ok(hasMalecon, `Top places should contain Gran Malecón, got: ${topPlaces.join(', ')}`)
  assert.ok(hasCarnaval, `Top places should contain Casa del Carnaval, got: ${topPlaces.join(', ')}`)

  // Must NOT contain non-tourist resting squares or hospital plazas
  for (const place of catalog.places) {
    assert.ok(!/\bdescanso\b/i.test(place), `Catalog should not contain resting areas: ${place}`)
    assert.ok(!/\bplaza\s+hospital\b/i.test(place), `Catalog should not contain hospital plazas: ${place}`)
  }

  // Restaurants must be local (no cross-city leak like Cartagena's La Mulata)
  for (const rest of catalog.restaurants) {
    const rName = typeof rest === 'string' ? rest : rest.name
    assert.ok(!rName.toLowerCase().includes('la mulata'), `Barranquilla should not have Cartagena restaurant: ${rName}`)
  }
})

test('4. getRealDestinationCatalog for Coveñas incorporates Golfo de Morrosquillo regional corridor', async () => {
  const catalog = await getRealDestinationCatalog('Coveñas', 'Colombia')
  assert.ok(catalog, 'Catalog must be generated for Coveñas')
  assert.ok(Array.isArray(catalog.places), 'catalog.places must be an array')
  assert.ok(catalog.places.length >= 8, `Expected at least 8 places for multi-day tour, got ${catalog.places.length}`)

  // Regional corridor attractions MUST be present
  const allPlacesStr = catalog.places.join(' | ').toLowerCase()
  const hasCaimanera = allPlacesStr.includes('caimanera')
  const hasSanBernardo = allPlacesStr.includes('san bernardo') || allPlacesStr.includes('mucura') || allPlacesStr.includes('múcura')
  const hasTolu = allPlacesStr.includes('tolu') || allPlacesStr.includes('tolú')

  assert.ok(hasCaimanera, `Coveñas catalog must feature Ciénaga de la Caimanera, got: ${catalog.places.join(', ')}`)
  assert.ok(hasSanBernardo, `Coveñas catalog must feature Islas de San Bernardo, got: ${catalog.places.join(', ')}`)
  assert.ok(hasTolu, `Coveñas catalog must feature Santiago de Tolú corridor, got: ${catalog.places.join(', ')}`)

  // Restaurants MUST NOT contain Brazilian or Spanish venues
  for (const rest of catalog.restaurants) {
    const rName = typeof rest === 'string' ? rest : rest.name
    assert.ok(!/\b(?:Nordest[aã]o|Cal\s+Bandarra|Vers[aá]\s+Gastronomia|Albertu's)\b/i.test(rName),
      `Coveñas should not contain foreign restaurant: ${rName}`
    )
  }
})

test('5. generateChatResponse detects malformed all-restaurant days and reconstructs balanced 7-day tour for Coveñas', async () => {
  const malformedBotMessage = `¡Excelente! Aquí tienes tu itinerario para Coveñas:

Día 1: Coveñas
• Playa Caimán
• Segunda Ensenada de Coveñas
• La Fragata

Día 2: Coveñas
• Playa Divina
• Playa La Coquerita
• El Gran Pez

Día 3: Coveñas
• Playa Palo Blanco
• Punta de Piedra
• Sabores del Mar

Día 4: Coveñas
• Restaurante La Caimanera
• Restaurante Coveñas
• Gastronomia e Bar Restaurante Nordestão

Día 5: Coveñas
• Restaurante Versá Gastronomia
• Restaurante Gastronomia El Buzo
• Lucia – Restaurante Caney Gastronómico

Día 6: Coveñas
• Restaurante Cal Bandarra
• Espaço Gastronômico Cultural Albertu's Restaurante
• Restaurante del Salón Gastronómico "Terra"

Día 7: Coveñas
• Restaurante Panorama Gastronómico
• Restaurante Las Acacias

¿Qué te parece este itinerario? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?`

  const state = {
    history: [
      { role: 'user', content: 'Quiero un tour de 7 días a Coveñas con mi pareja, presupuesto moderado, auto rentado y ya tenemos hotel' },
      { role: 'assistant', content: malformedBotMessage }
    ],
    message: 'Muéstrame el itinerario completo'
  }

  const preferences = {
    city: 'Coveñas',
    destination: 'Coveñas',
    country: 'Colombia',
    durationDays: 7,
    datesSeason: '7 días',
    companions: 'En pareja',
    budget: 'Moderado',
    transport: 'Auto rentado',
    selectedHotel: { name: 'Hotel Palma Linda' },
    accommodationStatus: 'Hotel elegido'
  }

  const result = await generateChatResponse(state, '', '', preferences)
  assert.ok(result.responseMessage, 'Must return responseMessage')

  // Check that all 7 days exist
  for (let d = 1; d <= 7; d++) {
    assert.ok(result.responseMessage.includes(`Día ${d}:`), `Itinerary must contain Día ${d}:`)
  }

  // Zero foreign Brazilian or Catalan restaurants
  assert.ok(!/\b(?:Nordest[aã]o|Cal\s+Bandarra|Vers[aá]\s+Gastronomia|Albertu's)\b/i.test(result.responseMessage),
    'Itinerary must have zero foreign Brazilian/Catalan restaurants'
  )

  // Zero resting plazas
  assert.ok(!/\bPlaza\s+descanso\b/i.test(result.responseMessage), 'Itinerary must not contain Plaza descanso')

  // Days 4-7 must have real attractions, NOT 3 restaurants per day
  const lines = result.responseMessage.split('\n')
  let currentDay = ''
  const dayLinesMap = {}
  for (const l of lines) {
    const m = l.match(/^(Día\s+\d+:)/i)
    if (m) {
      currentDay = m[1]
      dayLinesMap[currentDay] = []
    } else if (currentDay && l.trim().startsWith('•')) {
      dayLinesMap[currentDay].push(l.trim())
    }
  }

  for (let d = 1; d <= 7; d++) {
    const dayStops = dayLinesMap[`Día ${d}:`] || []
    assert.ok(dayStops.length >= 2, `Día ${d} must have at least 2 stops, got ${dayStops.length}`)
    // Must NOT be all restaurants
    const restCount = dayStops.filter(s => /\b(?:restaurante|gastronom[íi]a|bar|caf[ée])\b/i.test(s)).length
    assert.ok(restCount <= 1, `Día ${d} should have at most 1 restaurant stop, got ${restCount}: ${dayStops.join(', ')}`)
  }
})
