import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateChatResponse, getDestinationPresets, DESTINATION_LOCAL_PRESETS } from '../services/openai.js'

describe('AI Rule Unification and International Destination Isolation', () => {
  it('should provide localized hotel info for international destinations without Cartagena leaks', async () => {
    // Test Miami
    const miamiState = {
      history: [{ role: 'user', content: 'Dame más información del hotel' }]
    }
    const miamiPrefs = {
      city: 'Miami',
      destination: 'Miami, Estados Unidos'
    }
    const miamiRes = await generateChatResponse(miamiState, '', '', miamiPrefs)
    assert.ok(miamiRes.responseMessage.includes('Miami'))
    assert.ok(!miamiRes.responseMessage.toLowerCase().includes('cartagena'))
    assert.ok(!miamiRes.responseMessage.toLowerCase().includes('plaza fernández de madrid'))
    assert.ok(!miamiRes.responseMessage.toLowerCase().includes('castillo san felipe'))

    // Test Paris
    const parisState = {
      history: [{ role: 'user', content: '¿Qué hoteles recomiendas?' }]
    }
    const parisPrefs = {
      city: 'París',
      destination: 'París, Francia'
    }
    const parisRes = await generateChatResponse(parisState, '', '', parisPrefs)
    assert.ok(parisRes.responseMessage.includes('París') || parisRes.responseMessage.includes('Paris'))
    assert.ok(!parisRes.responseMessage.includes('Casa La Fe'))
    assert.ok(!parisRes.responseMessage.includes('San Pedro de Majagua'))

    // Test Tokyo
    const tokyoState = {
      history: [{ role: 'user', content: 'Ver restaurantes' }]
    }
    const tokyoPrefs = {
      city: 'Tokio',
      destination: 'Tokio, Japón'
    }
    const tokyoRes = await generateChatResponse(tokyoState, '', '', tokyoPrefs)
    assert.ok(tokyoRes.responseMessage.includes('Tokio') || tokyoRes.responseMessage.includes('Tokyo'))
    assert.ok(!tokyoRes.responseMessage.includes('Cevicheria'))
    assert.ok(!tokyoRes.responseMessage.includes('Celele'))
  })

  it('should provide localized day breakdown for Rome without Cartagena POIs', async () => {
    const romeState = {
      history: [{ role: 'user', content: 'Ver detalles del día 1' }]
    }
    const romePrefs = {
      city: 'Roma',
      destination: 'Roma, Italia',
      durationDays: 3,
      durationHours: 72
    }
    const romeRes = await generateChatResponse(romeState, '', '', romePrefs)
    assert.ok(romeRes.responseMessage.includes('Día 1 en Roma') || romeRes.responseMessage.includes('Dia 1 en Roma'))
    assert.ok(!romeRes.responseMessage.includes('Castillo San Felipe'))
    assert.ok(!romeRes.responseMessage.includes('Islas del Rosario'))
    assert.ok(!romeRes.responseMessage.includes('Getsemaní'))
  })

  it('should support dynamic generic presets for unlisted global cities', () => {
    const preset = getDestinationPresets('Sydney', 'Australia')
    assert.ok(preset)
    assert.equal(preset.name, 'Sydney')
    assert.equal(preset.country, 'Australia')
    assert.ok(preset.hotels.length >= 3)
    assert.ok(preset.restaurants.length >= 3)
    assert.ok(preset.places.length >= 3)
    assert.ok(preset.hotels[0].name.includes('Sydney'))
  })

  it('should properly progress through chat questions without infinite loops', async () => {
    // Missing dates
    const state1 = { history: [{ role: 'user', content: 'Cartagena' }] }
    const prefs1 = { city: 'Cartagena', destination: 'Cartagena, Colombia' }
    const res1 = await generateChatResponse(state1, '', '', prefs1)
    assert.ok(res1.actionChips.some(c => /mes|semana|año|vacaciones/i.test(c)))

    // Missing duration
    const prefs2 = { ...prefs1, datesSeason: 'Próximo mes' }
    const res2 = await generateChatResponse(state1, '', '', prefs2)
    assert.ok(res2.actionChips.some(c => /día|días|semana/i.test(c)))

    // Missing companions
    const prefs3 = { ...prefs2, durationDays: 3, durationHours: 72 }
    const res3 = await generateChatResponse(state1, '', '', prefs3)
    assert.ok(res3.actionChips.some(c => /familia|pareja|amigos|solo/i.test(c)))

    // Missing budget
    const prefs4 = { ...prefs3, companions: 'En pareja' }
    const res4 = await generateChatResponse(state1, '', '', prefs4)
    assert.ok(res4.actionChips.some(c => /económico|moderado|lujo/i.test(c)))

    // Missing transport
    const prefs5 = { ...prefs4, budget: 'Moderado' }
    const res5 = await generateChatResponse(state1, '', '', prefs5)
    assert.ok(res5.actionChips.some(c => /auto|caminando|público|taxi/i.test(c)))

    // Missing accommodation
    const prefs6 = { ...prefs5, transport: 'Caminando' }
    const res6 = await generateChatResponse(state1, '', '', prefs6)
    assert.ok(res6.actionChips.some(c => /hospedaje|hotel/i.test(c)))

    // All complete
    const prefs7 = { ...prefs6, accommodationStatus: 'Recomiéndame hoteles' }
    const res7 = await generateChatResponse(state1, '', '', prefs7)
    assert.ok(res7.actionChips.some(c => /generar tour/i.test(c)))
  })

  it('should preserve complete stop descriptions without destructive keyword replacement in validateTourQuality', async () => {
    const { validateTourQuality } = await import('../routes/ai.js')
    const sampleTour = {
      itinerario: [
        {
          nombre: 'Coliseo Romano',
          descripcion: 'El Coliseo Romano es un majestuoso anfiteatro construido en el siglo I d.C., símbolo del poder del Imperio Romano donde se realizaban combates de gladiadores y espectáculos públicos para más de cincuenta mil espectadores.',
          duracion_estimada: '60 minutos',
          dia: 1
        },
        {
          nombre: 'Fontana di Trevi',
          descripcion: 'En esta parada histórica admiramos la Fontana di Trevi, una monumental fuente barroca diseñada por Nicola Salvi con esculturas esculpidas de Neptuno y figuras míticas en el corazón de Roma.',
          duracion_estimada: '45 minutos',
          dia: 1
        }
      ]
    }
    const planner = { selectedPlaces: [{ name: 'Coliseo Romano' }, { name: 'Fontana di Trevi' }] }
    const input = { city: 'Roma' }

    const validated = validateTourQuality(sampleTour, planner, input)
    assert.ok(Array.isArray(validated.itinerario))
    assert.equal(validated.itinerario.length, 2)
    // Verify words weren't chopped mid-sentence
    assert.ok(validated.itinerario[1].descripcion.includes('Fontana di Trevi'))
    assert.ok(validated.itinerario[1].descripcion.includes('monumental fuente barroca'))
  })
})
