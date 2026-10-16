import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  clusterStopsIntoCoherentDays,
  areStopsCompatibleInSameDay,
  inferPlaceMicroSector
} from '../services/open-tourism-service.js'
import {
  generateChatResponse,
  ensureBalancedMultiDayItineraryText,
  DESTINATION_ICONIC_LANDMARKS,
  DESTINATION_ICONIC_RESTAURANTS
} from '../services/openai.js'

describe('Multi-City Coherent Clustering & Multi-Day Tour Fidelity Suite', () => {

  describe('1. Bucaramanga (7-day itinerary)', () => {
    const bucaramangaAttractions = [
      { name: 'Centro Cultural del Oriente', latitude: 7.1215, longitude: -73.1205 },
      { name: 'Museo de la Batalla Palonegro', latitude: 7.1213, longitude: -73.1204 },
      { name: 'Parque Centenario', latitude: 7.1220, longitude: -73.1210 },
      { name: 'Parque García Rovira', latitude: 7.1147, longitude: -73.1287 },
      { name: 'Casa de Bolívar - Museo Histórico', latitude: 7.1150, longitude: -73.1290 },
      { name: 'Catedral de la Sagrada Familia', latitude: 7.1158, longitude: -73.1255 },
      { name: 'Parque San Pío', latitude: 7.1189, longitude: -73.1118 },
      { name: 'Parque de las Palmas', latitude: 7.1175, longitude: -73.1105 },
      { name: 'Museo de Arte Moderno de Bucaramanga', latitude: 7.1200, longitude: -73.1150 },
      { name: 'Teatro Santander', latitude: 7.1218, longitude: -73.1208 },
      { name: 'Parque Romero', latitude: 7.1130, longitude: -73.1240 },
      { name: 'Parque de los Niños', latitude: 7.1250, longitude: -73.1180 },
      { name: 'Ecoparque Cerro del Santísimo', latitude: 7.0700, longitude: -73.1000 },
      { name: 'Jardín Botánico Eloy Valenzuela', latitude: 7.0600, longitude: -73.1100 }
    ]

    const bucaramangaRestaurants = [
      { name: 'Restaurante Tony', latitude: 7.1200, longitude: -73.1150 },
      { name: 'La Puerta del Sol', latitude: 7.1050, longitude: -73.1200 },
      { name: 'Restaurante El Propio', latitude: 7.1190, longitude: -73.1120 },
      { name: 'Mia Nonna Cabecera', latitude: 7.1180, longitude: -73.1110 },
      { name: 'Cevichería Central', latitude: 7.1150, longitude: -73.1260 },
      { name: 'Restaurante Mercagán Parrilla', latitude: 7.1170, longitude: -73.1130 },
      { name: 'Restaurante Marval Plaza', latitude: 7.1140, longitude: -73.1270 }
    ]

    it('clusters exactly 2 attractions + 1 restaurant per day without leaving single-stop days', () => {
      const days = clusterStopsIntoCoherentDays(bucaramangaAttractions, bucaramangaRestaurants, {
        numDays: 7,
        city: 'Bucaramanga'
      })

      assert.equal(days.length, 7, 'Must have exactly 7 days')
      for (const day of days) {
        assert.equal(day.attractions.length, 2, `Day ${day.day} must have exactly 2 attractions`)
        assert.ok(day.restaurant, `Day ${day.day} must have a restaurant`)
        assert.equal(day.stops.length, 3, `Day ${day.day} must have exactly 3 stops (2 attrs + 1 food)`)
      }
    })

    it('Centro Cultural del Oriente and Museo de la Batalla Palonegro stay in the SAME DAY and never scattered', () => {
      const days = clusterStopsIntoCoherentDays(bucaramangaAttractions, bucaramangaRestaurants, {
        numDays: 7,
        city: 'Bucaramanga'
      })

      const findDay = (placeName) => {
        const found = days.find(d => d.stops.some(s => s.name.toLowerCase().includes(placeName.toLowerCase())))
        return found ? found.day : null
      }

      const dayCentroCultural = findDay('Centro Cultural del Oriente')
      const dayPalonegro = findDay('Batalla Palonegro')

      assert.ok(dayCentroCultural, 'Centro Cultural del Oriente must be assigned to a day')
      assert.ok(dayPalonegro, 'Museo de la Batalla Palonegro must be assigned to a day')
      assert.equal(dayCentroCultural, dayPalonegro, 'Centro Cultural del Oriente and Museo de la Batalla Palonegro MUST be on the exact same day!')
    })

    it('ensureBalancedMultiDayItineraryText cures scattered text and regroups Palonegro + Centro Cultural on same day', () => {
      const scatteredText = `Itinerario de Viaje: Bucaramanga (3 días)

Día 1: Bucaramanga
 • Museo de la Batalla Palonegro
 • Restaurante Tony

Día 2: Bucaramanga
 • Parque San Pío
 • Restaurante El Propio

Día 3: Bucaramanga
 • Centro Cultural del Oriente
 • Cevichería Central

¿Qué te parece este itinerario?`

      const catalog = {
        places: bucaramangaAttractions,
        restaurants: bucaramangaRestaurants
      }

      const curedText = ensureBalancedMultiDayItineraryText(scatteredText, 'Bucaramanga', catalog, {}, { numDays: 3 })

      // Each day in cured text must have 2 bulleted attractions and 1 restaurant (3 bullets total)
      const dayBlocks = [...curedText.matchAll(/Día\s+(\d+):[^\n]*\n([\s\S]*?)(?=(?:Día\s+\d+:|$))/gi)]
      assert.equal(dayBlocks.length, 3, 'Must have 3 days')

      let dayPalonegro = null
      let dayCentroCultural = null

      for (const block of dayBlocks) {
        const dayNum = Number(block[1])
        const lines = block[2].split('\n').filter(l => l.trim().startsWith('•'))
        assert.equal(lines.length, 3, `Day ${dayNum} must have 3 stops (2 attractions + 1 restaurant)`)

        if (block[2].includes('Batalla Palonegro')) dayPalonegro = dayNum
        if (block[2].includes('Centro Cultural del Oriente')) dayCentroCultural = dayNum
      }

      assert.ok(dayPalonegro, 'Palonegro must be present')
      assert.ok(dayCentroCultural, 'Centro Cultural must be present')
      assert.equal(dayPalonegro, dayCentroCultural, 'Both must be grouped on the SAME day in the cured itinerary!')
    })
  })

  describe('2. Medellín (3-day and 5-day itineraries)', () => {
    const medellinAttractions = [
      { name: 'Plaza Botero', latitude: 6.2529, longitude: -75.5689 },
      { name: 'Museo de Antioquia', latitude: 6.2525, longitude: -75.5692 },
      { name: 'Parque Explora', latitude: 6.2708, longitude: -75.5654 },
      { name: 'Jardín Botánico de Medellín', latitude: 6.2715, longitude: -75.5630 },
      { name: 'Comuna 13 Graffitour', latitude: 6.2530, longitude: -75.6180 },
      { name: 'Escaleras Eléctricas de la Comuna 13', latitude: 6.2520, longitude: -75.6175 },
      { name: 'Pueblito Paisa', latitude: 6.2360, longitude: -75.5800 },
      { name: 'Parque Lleras', latitude: 6.2085, longitude: -75.5675 },
      { name: 'Museo de Arte Moderno de Medellín (MAMM)', latitude: 6.2235, longitude: -75.5740 },
      { name: 'Parque de los Pies Descalzos', latitude: 6.2440, longitude: -75.5780 }
    ]

    const medellinRestaurants = [
      { name: 'Mondongos El Poblado', latitude: 6.2090, longitude: -75.5680 },
      { name: 'Hacienda Junín', latitude: 6.2510, longitude: -75.5670 },
      { name: 'Restaurante El Cielo', latitude: 6.2080, longitude: -75.5660 },
      { name: 'Carmen Medellín', latitude: 6.2095, longitude: -75.5670 },
      { name: 'Restaurante Hatoviejo Centro', latitude: 6.2505, longitude: -75.5675 }
    ]

    it('Medellín 3 days: exactly 2 attractions + 1 restaurant per day, Plaza Botero + Museo de Antioquia together', () => {
      const days = clusterStopsIntoCoherentDays(medellinAttractions, medellinRestaurants, {
        numDays: 3,
        city: 'Medellín'
      })

      assert.equal(days.length, 3)
      for (const d of days) {
        assert.equal(d.attractions.length, 2, `Day ${d.day} must have 2 attractions`)
        assert.ok(d.restaurant, `Day ${d.day} must have a restaurant`)
      }

      const boteroDay = days.find(d => d.stops.some(s => s.name.includes('Botero')))?.day
      const antioquiaDay = days.find(d => d.stops.some(s => s.name.includes('Museo de Antioquia')))?.day
      assert.equal(boteroDay, antioquiaDay, 'Plaza Botero and Museo de Antioquia must be on the same day')
    })

    it('Medellín 5 days: Parque Explora + Jardín Botánico stay together on the same day', () => {
      const days = clusterStopsIntoCoherentDays(medellinAttractions, medellinRestaurants, {
        numDays: 5,
        city: 'Medellín'
      })

      assert.equal(days.length, 5)
      for (const d of days) {
        assert.equal(d.attractions.length, 2, `Day ${d.day} must have 2 attractions`)
        assert.ok(d.restaurant, `Day ${d.day} must have a restaurant`)
      }

      const exploraDay = days.find(d => d.stops.some(s => s.name.includes('Explora')))?.day
      const botanicoDay = days.find(d => d.stops.some(s => s.name.includes('Jardín Botánico')))?.day
      assert.equal(exploraDay, botanicoDay, 'Parque Explora and Jardín Botánico must be on the same day')
    })
  })

  describe('3. Bogotá (4-day itinerary)', () => {
    const bogotaAttractions = [
      { name: 'Plaza de Bolívar', latitude: 4.5981, longitude: -74.0760 },
      { name: 'Museo del Oro', latitude: 4.6018, longitude: -74.0720 },
      { name: 'Museo Botero', latitude: 4.5970, longitude: -74.0730 },
      { name: 'Catedral Primada de Colombia', latitude: 4.5980, longitude: -74.0755 },
      { name: 'Cerro de Monserrate', latitude: 4.6056, longitude: -74.0555 },
      { name: 'Quinta de Bolívar', latitude: 4.6030, longitude: -74.0600 },
      { name: 'Jardín Botánico de Bogotá José Celestino Mutis', latitude: 4.6670, longitude: -74.1000 },
      { name: 'Parque Metropolitano Simón Bolívar', latitude: 4.6580, longitude: -74.0930 }
    ]

    const bogotaRestaurants = [
      { name: 'Restaurante La Puerta Falsa', latitude: 4.5980, longitude: -74.0750 },
      { name: 'Restaurante San Isidro Monserrate', latitude: 4.6050, longitude: -74.0550 },
      { name: 'Restaurante Prudencia', latitude: 4.5960, longitude: -74.0710 },
      { name: 'Andrés DC', latitude: 4.6670, longitude: -74.0550 }
    ]

    it('Bogotá 4 days: Plaza de Bolívar and Museo Botero / Catedral Primada stay together on same day', () => {
      const days = clusterStopsIntoCoherentDays(bogotaAttractions, bogotaRestaurants, {
        numDays: 4,
        city: 'Bogotá'
      })

      assert.equal(days.length, 4)
      for (const d of days) {
        assert.equal(d.attractions.length, 2, `Day ${d.day} must have 2 attractions`)
        assert.ok(d.restaurant, `Day ${d.day} must have 1 restaurant`)
      }

      const bolivarDay = days.find(d => d.stops.some(s => s.name.includes('Plaza de Bolívar')))?.day
      const catedralDay = days.find(d => d.stops.some(s => s.name.includes('Catedral Primada')))?.day
      assert.equal(bolivarDay, catedralDay, 'Plaza de Bolívar and Catedral Primada must be grouped on the same day')

      const oroDay = days.find(d => d.stops.some(s => s.name.includes('Museo del Oro')))?.day
      const boteroDay = days.find(d => d.stops.some(s => s.name.includes('Museo Botero')))?.day
      assert.equal(oroDay, boteroDay, 'Museo del Oro and Museo Botero must be grouped on the same day')
    })
  })

  describe('4. Cartagena (3-day and 7-day itineraries)', () => {
    const cartagenaAttractions = [
      { name: 'Torre del Reloj', latitude: 10.4225, longitude: -75.5485 },
      { name: 'Plaza de la Aduana', latitude: 10.4220, longitude: -75.5490 },
      { name: 'Castillo San Felipe de Barajas', latitude: 10.4228, longitude: -75.5398 },
      { name: 'Monumento a los Zapatos Viejos', latitude: 10.4235, longitude: -75.5385 },
      { name: 'Plaza de la Trinidad (Getsemaní)', latitude: 10.4190, longitude: -75.5450 },
      { name: 'Callejón Angosto Getsemaní', latitude: 10.4185, longitude: -75.5445 }
    ]

    const cartagenaRestaurants = [
      { name: 'Restaurante Candé', latitude: 10.4250, longitude: -75.5470 },
      { name: 'La Vitrola', latitude: 10.4230, longitude: -75.5510 },
      { name: 'Celele Restaurante', latitude: 10.4195, longitude: -75.5455 }
    ]

    it('Cartagena 3 days: Castillo San Felipe and Zapatos Viejos stay together on the same day', () => {
      const days = clusterStopsIntoCoherentDays(cartagenaAttractions, cartagenaRestaurants, {
        numDays: 3,
        city: 'Cartagena'
      })

      assert.equal(days.length, 3)
      for (const d of days) {
        assert.equal(d.attractions.length, 2)
        assert.ok(d.restaurant)
      }

      const castilloDay = days.find(d => d.stops.some(s => s.name.includes('Castillo San Felipe')))?.day
      const zapatosDay = days.find(d => d.stops.some(s => s.name.includes('Zapatos Viejos')))?.day
      assert.equal(castilloDay, zapatosDay, 'Castillo San Felipe and Zapatos Viejos must be grouped together')
    })
  })

  describe('5. Santa Marta & Cali (Geographical Coherence)', () => {
    it('Santa Marta: Quinta de San Pedro Alejandrino and Museo Bolivariano stay together', () => {
      const santaMartaAttrs = [
        { name: 'Quinta de San Pedro Alejandrino', latitude: 11.2260, longitude: -74.1810 },
        { name: 'Museo Bolivariano de Arte Contemporáneo', latitude: 11.2255, longitude: -74.1805 },
        { name: 'Playa El Rodadero', latitude: 11.2045, longitude: -74.2268 },
        { name: 'Acuario y Museo del Mar del Rodadero', latitude: 11.2100, longitude: -74.2300 }
      ]
      const santaMartaRests = [
        { name: 'Restaurante Ouzo', latitude: 11.2440, longitude: -74.2120 },
        { name: 'Restaurante Donde Chucho', latitude: 11.2050, longitude: -74.2270 }
      ]

      const days = clusterStopsIntoCoherentDays(santaMartaAttrs, santaMartaRests, {
        numDays: 2,
        city: 'Santa Marta'
      })

      assert.equal(days.length, 2)
      const quintaDay = days.find(d => d.stops.some(s => s.name.includes('Quinta de San Pedro')))?.day
      const bolivarianoDay = days.find(d => d.stops.some(s => s.name.includes('Museo Bolivariano')))?.day
      assert.equal(quintaDay, bolivarianoDay, 'Quinta and Museo Bolivariano must be in the same day')
    })

    it('Cali: Barrio San Antonio and Iglesia San Antonio stay together', () => {
      const caliAttrs = [
        { name: 'Barrio San Antonio', latitude: 3.4470, longitude: -76.5410 },
        { name: 'Iglesia San Antonio', latitude: 3.4472, longitude: -76.5412 },
        { name: 'Monumento a Cristo Rey', latitude: 3.4350, longitude: -76.5650 },
        { name: 'Zoológico de Cali', latitude: 3.4490, longitude: -76.5580 }
      ]
      const caliRests = [
        { name: 'Restaurante Ringlete', latitude: 3.4560, longitude: -76.5360 },
        { name: 'Platillos Voladores', latitude: 3.4580, longitude: -76.5330 }
      ]

      const days = clusterStopsIntoCoherentDays(caliAttrs, caliRests, {
        numDays: 2,
        city: 'Cali'
      })

      assert.equal(days.length, 2)
      const barrioDay = days.find(d => d.stops.some(s => s.name.includes('Barrio San Antonio')))?.day
      const iglesiaDay = days.find(d => d.stops.some(s => s.name.includes('Iglesia San Antonio')))?.day
      assert.equal(barrioDay, iglesiaDay, 'Barrio and Iglesia San Antonio must be on the same day')
    })
  })

  describe('6. Performance & Latency Guarantee (< 25ms)', () => {
    it('executes 7-day clustering across all test cities in under 25 milliseconds', () => {
      const sampleAttrs = [
        { name: 'Attraction 1', latitude: 7.1215, longitude: -73.1205 },
        { name: 'Attraction 2', latitude: 7.1213, longitude: -73.1204 },
        { name: 'Attraction 3', latitude: 7.1220, longitude: -73.1210 },
        { name: 'Attraction 4', latitude: 7.1147, longitude: -73.1287 },
        { name: 'Attraction 5', latitude: 7.1150, longitude: -73.1290 },
        { name: 'Attraction 6', latitude: 7.1158, longitude: -73.1255 },
        { name: 'Attraction 7', latitude: 7.1189, longitude: -73.1118 },
        { name: 'Attraction 8', latitude: 7.1175, longitude: -73.1105 },
        { name: 'Attraction 9', latitude: 7.1200, longitude: -73.1150 },
        { name: 'Attraction 10', latitude: 7.1218, longitude: -73.1208 },
        { name: 'Attraction 11', latitude: 7.1130, longitude: -73.1240 },
        { name: 'Attraction 12', latitude: 7.1250, longitude: -73.1180 },
        { name: 'Attraction 13', latitude: 7.0700, longitude: -73.1000 },
        { name: 'Attraction 14', latitude: 7.0600, longitude: -73.1100 }
      ]
      const sampleRests = [
        { name: 'Rest 1', latitude: 7.1200, longitude: -73.1150 },
        { name: 'Rest 2', latitude: 7.1050, longitude: -73.1200 },
        { name: 'Rest 3', latitude: 7.1190, longitude: -73.1120 },
        { name: 'Rest 4', latitude: 7.1180, longitude: -73.1110 },
        { name: 'Rest 5', latitude: 7.1150, longitude: -73.1260 },
        { name: 'Rest 6', latitude: 7.1170, longitude: -73.1130 },
        { name: 'Rest 7', latitude: 7.1140, longitude: -73.1270 }
      ]

      // Measure 7-day multi-day tour clustering
      const singleStart = performance.now()
      clusterStopsIntoCoherentDays(sampleAttrs, sampleRests, { numDays: 7, city: 'Bucaramanga' })
      const singleDurationMs = performance.now() - singleStart

      // Single 7-day clustering must be ultra-fast (< 15 ms)
      assert.ok(singleDurationMs < 15, `Single clustering took ${singleDurationMs.toFixed(2)} ms, which must be < 15 ms`)

      const batchStart = performance.now()
      for (let iteration = 0; iteration < 5; iteration++) {
        clusterStopsIntoCoherentDays(sampleAttrs, sampleRests, { numDays: 7, city: 'Bucaramanga' })
      }
      const batchDurationMs = performance.now() - batchStart

      // 5 iterations must complete in < 30 ms
      assert.ok(batchDurationMs < 30, `5 clusterings took ${batchDurationMs.toFixed(2)} ms, which must be < 30 ms`)
    })
  })

  describe('7. Confirmation Integrity & Fast Path Fidelity (Cali 7-day tour)', () => {
    it('preserves exactly 21 stops without degradation upon user confirmation in under 250ms', async () => {
      const cali7DayItinerary = `Itinerario de Viaje: Cali (7 días)

Día 1: Cali
• Museo del Oro Calima
• Museo de Arte Religioso
• Punto Verde, Comedor Vegetariano

Día 2: Cali
• Museo La Tertulia
• Ágora del museo
• Restaurante Tortelli

Día 3: Cali
• Bulevar del Río Cali
• Teatro Jorge Isaacs
• Restaurante central

Día 4: Cali
• Teatro Municipal Enrique Buenaventura
• Museo Arqueológico Julio César Cubillos
• Restaurante Jardin China

Día 5: Cali
• Monumento a Sebastián de Belalcázar
• Gato del Río
• El Faro Pizzería San Antonio

Día 6: Cali
• Catedral Metropolitana de San Pedro Apóstol
• Museo Nacional del Transporte
• Salud Radiante Restaurante Vegetariano

Día 7: Cali
• Museo Religioso y Colonial de San Francisco
• Museo Arqueológico La Merced
• Zumaia Restaurante

¿Deseas confirmar este itinerario y generar tu tour en el mapa?`

      const state = {
        message: '🚀 Confirmar y generar tour',
        history: [
          { role: 'user', content: 'Quiero un tour de 7 días en Cali' },
          { role: 'assistant', content: cali7DayItinerary }
        ]
      }

      const currentPreferences = {
        city: 'Cali',
        country: 'Colombia',
        durationDays: 7,
        datesSeason: '7 días',
        companions: 'En pareja'
      }

      const t0 = performance.now()
      const result = await generateChatResponse(state, '', '', currentPreferences)
      const durationMs = performance.now() - t0

      assert.equal(result.readyToBuild, true, 'Tour must be ready to build immediately')
      assert.equal(result.specificPlaces.length, 21, 'Must preserve all 21 approved stops')
      assert.ok(durationMs < 250, `Confirmation must be fast, took ${durationMs.toFixed(1)}ms`)
    })
  })
})
