import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isMalformedItinerary,
  generateChatResponse,
  isTriviallyGenericHotelName,
  extractStopsFromItineraryText,
  getRealDestinationCatalog
} from '../services/openai.js'

describe('Multi-Day Single-City Itinerary Quality & Empty-Days Prevention', () => {
  it('1. isMalformedItinerary flags empty day headers in multi-day itineraries', () => {
    const brokenItinerary = `¡Hola! Aquí tienes tu propuesta de itinerario para disfrutar en Santa Marta durante 7 días:

Día 1: Santa Marta
• Rodadero

Día 2: Santa Marta

Día 3: Santa Marta

Día 4: Santa Marta

Día 5: Santa Marta

Día 6: Santa Marta

Día 7: Santa Marta

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

    assert.equal(isMalformedItinerary(brokenItinerary), true, 'Must detect empty day headers as malformed')
  })

  it('2. isMalformedItinerary accepts legitimate multi-day itineraries with full stops', () => {
    const validItinerary = `Itinerario de Viaje: Santa Marta (3 días)

Día 1: Santa Marta
• Playa El Rodadero
• Acuario y Museo del Mar del Rodadero
• Restaurante Donde Chucho

Día 2: Santa Marta
• Quinta de San Pedro Alejandrino
• Museo Bolivariano de Arte Contemporáneo
• Restaurante Ouzo

Día 3: Santa Marta
• Bahía de Taganga
• Mirador de Taganga
• Restaurante Babaganoush

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

    assert.equal(isMalformedItinerary(validItinerary), false, 'Legitimate 3-day itinerary must not be flagged')
  })

  it('3. isMalformedItinerary flags itineraries with insufficient stops relative to day count', () => {
    const lowDensityItinerary = `Itinerario de Viaje: Cartagena (4 días)

Día 1: Cartagena
• Torre del Reloj

Día 2: Cartagena
• Castillo de San Felipe

Día 3: Cartagena

Día 4: Cartagena

¿Qué te parece?`

    assert.equal(isMalformedItinerary(lowDensityItinerary), true, 'Must flag itineraries with empty trailing days')
  })

  it('4. generateChatResponse for multi-day tour with all info in one prompt creates full non-empty days', async () => {
    const userPrompt = 'Quiero viajar a Santa Marta durante 7 dias con mi familia, tenemos un presupuesto de 10000000 de pesos colombianos, nos moveremos en carro, ya tenemos alojamiento alla y quiero ir al rodadero'

    const result = await generateChatResponse({
      message: userPrompt,
      history: [],
      userContext: {}
    })

    assert.ok(result?.responseMessage, 'Must return responseMessage')
    assert.equal(isMalformedItinerary(result.responseMessage), false, 'Generated response must never be malformed')

    // Verify all 7 days exist and each day contains bullet points
    const dayMatches = [...result.responseMessage.matchAll(/(?:^|\n)\s*(?:#{1,4}\s*)?D[íi]a\s*(\d+)[:\s]/gi)]
    assert.ok(dayMatches.length >= 7, `Must contain at least 7 days, received ${dayMatches.length}`)

    for (let i = 0; i < dayMatches.length; i++) {
      const startIdx = dayMatches[i].index + dayMatches[i][0].length
      const endIdx = (i + 1 < dayMatches.length)
        ? dayMatches[i + 1].index
        : result.responseMessage.length
      const daySlice = result.responseMessage.slice(startIdx, endIdx)
      const hasBullet = /[•\-\*]\s+[^\n]+/i.test(daySlice)
      assert.ok(hasBullet, `Day ${i + 1} must have stops with bullets`)
    }

    // Verify specific requested place is in Day 1 or in specificPlaces
    const hasRodadero = /rodadero/i.test(result.responseMessage) ||
      (result.specificPlaces || []).some(p => /rodadero/i.test(typeof p === 'string' ? p : p.name))
    assert.ok(hasRodadero, 'User requested place (Rodadero) must be included')
  })

  it('5. generateChatResponse works universally for other cities (e.g. Medellin 4 days)', async () => {
    const userPrompt = 'Quiero ir a Medellín por 4 días en pareja, contamos con un presupuesto moderado, nos moveremos en taxi y ya tenemos alojamiento confirmado'

    const result = await generateChatResponse({
      message: userPrompt,
      history: [],
      userContext: {}
    })

    assert.ok(result?.responseMessage, 'Must return responseMessage')
    assert.equal(isMalformedItinerary(result.responseMessage), false, 'Medellin tour must never be malformed')

    const dayMatches = [...result.responseMessage.matchAll(/(?:^|\n)\s*(?:#{1,4}\s*)?D[íi]a\s*(\d+)[:\s]/gi)]
    assert.ok(dayMatches.length >= 4, `Must contain at least 4 days, received ${dayMatches.length}`)

    for (let i = 0; i < dayMatches.length; i++) {
      const startIdx = dayMatches[i].index + dayMatches[i][0].length
      const endIdx = (i + 1 < dayMatches.length)
        ? dayMatches[i + 1].index
        : result.responseMessage.length
      const daySlice = result.responseMessage.slice(startIdx, endIdx)
      const hasBullet = /[•\-\*]\s+[^\n]+/i.test(daySlice)
      assert.ok(hasBullet, `Day ${i + 1} must have stops with bullets`)
    }
  })

  it('6. isTriviallyGenericHotelName rejects purely generic hotel names and accepts authentic names', () => {
    assert.equal(isTriviallyGenericHotelName('Hotel Cartagena', 'Cartagena'), true, 'Hotel Cartagena must be rejected')
    assert.equal(isTriviallyGenericHotelName('Hostal Cartagena', 'Cartagena'), true, 'Hostal Cartagena must be rejected')
    assert.equal(isTriviallyGenericHotelName('Hotel de Cartagena', 'Cartagena'), true, 'Hotel de Cartagena must be rejected')
    assert.equal(isTriviallyGenericHotelName('Cartagena Hotel', 'Cartagena'), true, 'Cartagena Hotel must be rejected')
    assert.equal(isTriviallyGenericHotelName('Hotel', 'Cartagena'), true, 'Hotel alone must be rejected')
    assert.equal(isTriviallyGenericHotelName('Hostal', 'Medellin'), true, 'Hostal alone must be rejected')
    assert.equal(isTriviallyGenericHotelName('Hotel Medellin', 'Medellín'), true, 'Hotel Medellin must be rejected')

    // Authentic hotels must not be rejected
    assert.equal(isTriviallyGenericHotelName('Hotel Casa La Fe', 'Cartagena'), false, 'Hotel Casa La Fe is authentic')
    assert.equal(isTriviallyGenericHotelName('Hotel Santa Clara', 'Cartagena'), false, 'Hotel Santa Clara is authentic')
    assert.equal(isTriviallyGenericHotelName('Hotel Casa Isabel', 'Cartagena'), false, 'Hotel Casa Isabel is authentic')
    assert.equal(isTriviallyGenericHotelName('Hotel Cartagena Plaza', 'Cartagena'), false, 'Hotel Cartagena Plaza has distinctive name')
    assert.equal(isTriviallyGenericHotelName('Hotel Dann Carlton', 'Bucaramanga'), false, 'Hotel Dann Carlton is authentic')
  })

  it('7. extractStopsFromItineraryText extracts all structured stops across multi-day headers', () => {
    const sampleItinerary = `¡Perfecto! Aquí tienes el itinerario:

Día 1: Cartagena
• Castillo de San Felipe de Barajas: Fortaleza colonial
• Las Bóvedas: Bóvedas históricas
• Restaurante Candé: Comida cartagenera tradicional
• Palacio de la Inquisición: Museo histórico

Día 2: Cartagena
• Torre del Reloj: Entrada a la ciudad
• Santuario de San Pedro Claver: Templo colonial
• Restaurante La Cevicheria: Mariscos frescos
• Café del Mar: Atardecer en las murallas

¿Qué te parece?`

    const stops = extractStopsFromItineraryText(sampleItinerary)
    assert.equal(stops.length, 8, `Must extract exactly 8 stops, extracted ${stops.length}`)
    assert.equal(stops[0].name, 'Castillo de San Felipe de Barajas')
    assert.equal(stops[0].dia, 1)
    assert.equal(stops[0].category, 'attraction')
    assert.equal(stops[2].name, 'Restaurante Candé')
    assert.equal(stops[2].dia, 1)
    assert.equal(stops[2].category, 'restaurant')
    assert.equal(stops[4].name, 'Torre del Reloj')
    assert.equal(stops[4].dia, 2)
  })

  it('8. getRealDestinationCatalog loads authentic iconic hotels for Cartagena', async () => {
    const catalog = await getRealDestinationCatalog('Cartagena', 'Colombia')
    assert.ok(catalog, 'Must return catalog for Cartagena')
    assert.ok(Array.isArray(catalog.hotels), 'catalog.hotels must be an array')
    assert.ok(catalog.hotels.length >= 2, `Cartagena must have at least 2 verified hotels, got ${catalog.hotels.length}`)

    const hotelNames = catalog.hotels.map(h => typeof h === 'string' ? h : h.name)
    assert.ok(!hotelNames.includes('Hotel Cartagena'), 'Must NOT include purely generic Hotel Cartagena')
    const hasIconic = hotelNames.some(name => /casa la fe|santa clara|casa isabel/i.test(name))
    assert.ok(hasIconic, 'Must include authentic curated hotels (Casa La Fe, Santa Clara, or Casa Isabel)')
  })

  it('9. generateChatResponse preserves full 29-stop itinerary from history when user confirms missing transport and budget', async () => {
    // Construct a 7-day 29-stop itinerary text (4-5 stops per day) simulating Turn 1
    const established29StopItinerary = `¡Perfecto! Diseñé un tour de 7 días para disfrutar al máximo Cartagena:

Día 1: Cartagena
• Castillo de San Felipe de Barajas: Imponente fortaleza militar
• Las Bóvedas: Talleres de artesanías en antiguas bóvedas
• Restaurante Candé: Platos típicos cartageneros
• Palacio de la Inquisición: Museo histórico colonial

Día 2: Cartagena
• Torre del Reloj: Acceso a la ciudad amurallada
• Santuario de San Pedro Claver: Claustro e iglesia histórica
• Restaurante La Cevicheria: Frutos del mar
• Café del Mar: Terraza y atardecer sobre la muralla

Día 3: Cartagena
• Convento de la Popa: Mirador en la colina más alta
• Plaza Santo Domingo: Escultura de Botero y tertulia
• Restaurante Celele: Cocina contemporánea del Caribe
• Museo del Oro Zenú: Orfebrería prehispánica

Día 4: Cartagena
• Muelle de los Pegasos: Esculturas míticas junto a la bahía
• Camellón de los Mártires: Paseo histórico
• Restaurante El Boliche Cebichería: Ceviches artesanales
• Parque de Bolívar: Jardines sombreados y fuentes

Día 5: Cartagena
• Barrio Getsemaní: Arte urbano y callejones coloniales
• Plaza de la Trinidad: Vida cultural de barrio
• Restaurante Carmen: Alta cocina cartagenera
• Baluarte de San Ignacio: Vista a la bahía de las Ánimas

Día 6: Cartagena
• Playa de Bocagrande: Arena y sol en el sector moderno
• Paseo Peatonal de Castillogrande: Caminata junto al mar
• Restaurante Nuevo Asia: Gastronomía marina
• Casa Museo Rafael Núñez: Residencia patrimonial del expresidente

Día 7: Cartagena
• Mercado de Bazurto: Mercado popular y gastronomía vernácula
• Ciénaga de la Virgen: Manglares y naturaleza costera
• Parrilla Don Héctor: Asados tradicionales
• Teatro Heredia: Joya arquitectónica republicana
• Plaza Fernández de Madrid: Jardines y descanso

¿Deseas confirmar este recorrido y generar el tour en el mapa?`

    const parsedStops = extractStopsFromItineraryText(established29StopItinerary)
    assert.equal(parsedStops.length, 29, `Established itinerary must have 29 stops, verified: ${parsedStops.length}`)

    // Simulate multi-turn conversation:
    // Turn 1: User asked for 7 days Cartagena, assistant produced 29 stops.
    // Turn 2: User said "Confirmar y generar tour", assistant asked for transport & budget.
    // Turn 3: User answers: "Nos vamos a mover en carro y tenemos un presupuesto moderado."
    const state = {
      message: 'Nos vamos a mover en carro y tenemos un presupuesto moderado',
      history: [
        { role: 'user', content: 'Quiero un tour de 7 días en Cartagena en pareja' },
        { role: 'assistant', content: established29StopItinerary },
        { role: 'user', content: 'Confirmar y generar tour' },
        { role: 'assistant', content: 'Para continuar necesitamos definir: tu medio de transporte y tu presupuesto. ¿Cómo prefieres moverte y qué presupuesto tienes?' }
      ]
    }

    const currentPreferences = {
      city: 'Cartagena',
      country: 'Colombia',
      durationDays: 7,
      datesSeason: '7 días',
      companions: 'En pareja',
      selectedHotel: 'Hotel Casa La Fe',
      accommodationStatus: 'Hotel elegido'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    assert.ok(result, 'Must return result')
    assert.ok(result.specificPlaces, 'Must return specificPlaces')
    assert.ok(result.specificPlaces.length >= 28, `Must preserve full stops pool (expected >= 28, got ${result.specificPlaces.length})`)

    // Verify key stops that were formerly cut are preserved
    const names = result.specificPlaces.map(p => typeof p === 'string' ? p : p.name)
    const hasBazurto = names.some(n => /bazurto/i.test(n))
    const hasCafeDelMar = names.some(n => /café del mar|cafe del mar/i.test(n))
    const hasCienaga = names.some(n => /ciénaga|cienaga/i.test(n))
    assert.ok(hasBazurto, 'Mercado de Bazurto must be preserved')
    assert.ok(hasCafeDelMar, 'Café del Mar must be preserved')
    assert.ok(hasCienaga, 'Ciénaga de la Virgen must be preserved')

    // Itinerary text must NOT be overwritten with an empty or truncated 21-stop recreation
    assert.equal(isMalformedItinerary(result.responseMessage), false)
  })

  it('10. generateChatResponse returns authentic hotel options without duplicates or generic names when user requests hotels', async () => {
    const state = {
      message: 'Recomiéndame hoteles, por favor',
      history: [
        { role: 'user', content: 'Quiero viajar a Cartagena 7 días' },
        { role: 'assistant', content: '¡Excelente! ¿Dónde planeas hospedarte en Cartagena?' }
      ]
    }

    const currentPreferences = {
      city: 'Cartagena',
      country: 'Colombia',
      durationDays: 7,
      transport: 'Auto rentado',
      budget: 'Moderado'
    }

    const result = await generateChatResponse(state, '', '', currentPreferences)

    assert.ok(result?.responseMessage, 'Must return responseMessage')
    assert.ok(!/• \*\*Hotel Cartagena\*\*/i.test(result.responseMessage), 'Must NOT recommend purely generic Hotel Cartagena')

    // Action chips must be deduplicated
    const chips = result.actionChips || []
    const uniqueChips = Array.from(new Set(chips))
    assert.equal(chips.length, uniqueChips.length, 'Action chips must not contain duplicates')
    assert.ok(!chips.includes('Hotel Cartagena'), 'Action chips must not contain purely generic Hotel Cartagena')
  })
})

