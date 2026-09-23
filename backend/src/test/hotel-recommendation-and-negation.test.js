import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractChatInformationFallback,
  generateChatResponse,
  isLodgingNegationOrUncertainty,
  isLodgingRecommendationInquiry,
  isExplicitlyChoosingHotel,
  isLodgingCategoryOrGeneric,
  isLodgingExplicitlyConfirmed
} from '../services/openai.js'

test('Hotel Recommendation and Negation Unit Tests', async (t) => {
  await t.test('isLodgingNegationOrUncertainty accurately detects negative or uncertain phrasing', () => {
    assert.equal(isLodgingNegationOrUncertainty('No tenemos hotel definido dame recomendaciones'), true)
    assert.equal(isLodgingNegationOrUncertainty('aún no sabemos dónde nos vamos a quedar que recomiendas?'), true)
    assert.equal(isLodgingNegationOrUncertainty('No sabemos que recomiendas?'), true)
    assert.equal(isLodgingNegationOrUncertainty('no tengo hotel'), true)
    assert.equal(isLodgingNegationOrUncertainty('sin hotel aún'), true)
    assert.equal(isLodgingNegationOrUncertainty('todavía no tenemos hospedaje'), true)
    assert.equal(isLodgingNegationOrUncertainty('dónde nos vamos a quedar'), true)

    // Positive hotel selections should NOT be flagged as negation
    assert.equal(isLodgingNegationOrUncertainty('Me quedo en el Hotel Dann Carlton'), false)
    assert.equal(isLodgingNegationOrUncertainty('El primero'), false)
    assert.equal(isLodgingNegationOrUncertainty('Hotel El Prado'), false)
  })

  await t.test('isLodgingRecommendationInquiry detects direct inquiry and contextual replies', () => {
    // Direct requests
    assert.equal(isLodgingRecommendationInquiry('aún no sabemos dónde nos vamos a quedar que recomiendas?'), true)
    assert.equal(isLodgingRecommendationInquiry('No tenemos hotel definido dame recomendaciones'), true)
    assert.equal(isLodgingRecommendationInquiry('recomiéndame hoteles en Barranquilla'), true)
    assert.equal(isLodgingRecommendationInquiry('opciones de hotel'), true)

    // Contextual reply following bot hotel inquiry
    const botPrompt = '¿En qué hotel o alojamiento se hospedarán en Barranquilla?'
    assert.equal(isLodgingRecommendationInquiry('No sabemos que recomiendas?', botPrompt), true)
    assert.equal(isLodgingRecommendationInquiry('no sé, qué recomiendas?', botPrompt), true)
    assert.equal(isLodgingRecommendationInquiry('qué recomiendas?', botPrompt), true)
  })

  await t.test('isExplicitlyChoosingHotel is blocked when message is a negation or inquiry', () => {
    assert.equal(isExplicitlyChoosingHotel('No tenemos hotel definido dame recomendaciones'), false)
    assert.equal(isExplicitlyChoosingHotel('aún no sabemos dónde nos vamos a quedar que recomiendas?'), false)
    assert.equal(isExplicitlyChoosingHotel('No sabemos que recomiendas?'), false)

    // Affirmative choices should succeed
    assert.equal(isExplicitlyChoosingHotel('Elijo el Hotel Dann Carlton Barranquilla'), true)
    assert.equal(isExplicitlyChoosingHotel('Me quedo con el Hotel El Prado'), true)
    assert.equal(isExplicitlyChoosingHotel('Ok el primero'), true)
  })

  await t.test('extractChatInformationFallback NEVER extracts fake hotel names on negation or recommendation requests', () => {
    const ext1 = extractChatInformationFallback('No tenemos hotel definido dame recomendaciones')
    assert.equal(ext1.selectedHotel, undefined)
    assert.notEqual(ext1.accommodationStatus, 'Hotel elegido')
    assert.equal(ext1.accommodationStatus, 'Recomiéndame hoteles')

    const ext2 = extractChatInformationFallback('Nos vamos a mover en carro tenemos un presupuesto de 7 millones de pesos y aún no sabemos dónde nos vamos a quedar que recomiendas?')
    assert.equal(ext2.selectedHotel, undefined)
    assert.equal(ext2.transport, 'Auto rentado')
    assert.equal(ext2.budget, 'Moderado')
    assert.notEqual(ext2.accommodationStatus, 'Hotel elegido')
    assert.equal(ext2.accommodationStatus, 'Recomiéndame hoteles')

    const ext3 = extractChatInformationFallback('No sabemos que recomiendas?')
    assert.equal(ext3.selectedHotel, undefined)
    assert.notEqual(ext3.accommodationStatus, 'Hotel elegido')
    assert.equal(ext3.accommodationStatus, 'Recomiéndame hoteles')

    // Valid hotel selection should still be extracted properly
    const extValid = extractChatInformationFallback('Me quedo en el Hotel Dann Carlton')
    assert.equal(extValid.selectedHotel, 'Hotel Dann Carlton')
    assert.equal(extValid.accommodationStatus, 'Hotel elegido')
  })

  await t.test('Multi-turn conversation flow matches expected user experience and presents hotels', async () => {
    const msgs = [
      'Crea un tour a Barranquilla',
      'Voy con amigos',
      'Nos vamos a mover en carro tenemos un presupuesto de 7 millones de pesos y aún no sabemos dónde nos vamos a quedar que recomiendas?'
    ]

    let prefs = {}
    let history = []

    for (const msg of msgs) {
      const extracted = extractChatInformationFallback(msg)
      prefs = { ...prefs, ...extracted }
      const res = await generateChatResponse(
        { history: [...history, { role: 'user', content: msg }] },
        '',
        '',
        prefs
      )
      history.push({ role: 'user', content: msg })
      history.push({ role: 'assistant', content: res.responseMessage })

      if (msg === msgs[2]) {
        // Turn 3: User asked where to stay and provided transport & budget
        assert.equal(prefs.transport, 'Auto rentado')
        assert.equal(prefs.budget, 'Moderado')
        assert.equal(prefs.selectedHotel, undefined)
        assert.notEqual(prefs.accommodationStatus, 'Hotel elegido')

        // Bot message must contain hotel recommendations
        assert.match(res.responseMessage, /opciones recomendadas|Opciones de hospedaje/i)
        assert.match(res.responseMessage, /Hotel Dann Carlton|Hotel El Prado|GHL Hotel/i)

        // Action chips should offer the recommended hotels
        assert.ok(res.actionChips.some(c => /Hotel Dann Carlton|Hotel El Prado|GHL/i.test(c)))
        assert.ok(res.actionChips.some(c => /casa propia|familiar/i.test(c)))
      }
    }
  })
})
