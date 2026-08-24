import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractChatInformationFallback } from '../services/openai.js'

describe('Cross-City Isolation & Destination Guard Tests', () => {
  it('should NOT overwrite confirmed destination when user sends a correction or complaint mentioning another city', () => {
    const currentPreferences = {
      city: 'Santa Marta',
      destination: 'Santa Marta',
      country: 'Colombia',
      durationDays: 2,
      companions: 'Con amigos'
    }

    const correctionMsg = 'te equivocaste, el Malecón del Río, la Catedral y Bocas de Ceniza son de Barranquilla, no de Santa Marta'
    
    const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(correctionMsg)
    const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a)\b/i.test(correctionMsg)

    assert.equal(isCorrectionOrNegation, true)
    assert.equal(isExplicitCityChange, false)

    // Simulate merge logic
    const extracted = { city: 'Barranquilla' } // If LLM blindly extracted Barranquilla
    const validExtracted = { ...extracted }

    if (currentPreferences.city && validExtracted.city && validExtracted.city.toLowerCase() !== currentPreferences.city.toLowerCase()) {
      if (isCorrectionOrNegation && !isExplicitCityChange) {
        delete validExtracted.city
        delete validExtracted.destination
      }
    }

    const updated = { ...currentPreferences, ...validExtracted }
    assert.equal(updated.city, 'Santa Marta', 'Destination should remain Santa Marta')
  })

  it('should allow city change when user explicitly requests a destination change', () => {
    const currentPreferences = {
      city: 'Santa Marta',
      destination: 'Santa Marta'
    }

    const changeMsg = 'Mejor cambiemos a Medellín para las vacaciones'
    const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(changeMsg)
    const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a)\b/i.test(changeMsg)

    assert.equal(isExplicitCityChange, true)

    const extracted = { city: 'Medellín', destination: 'Medellín' }
    const validExtracted = { ...extracted }

    if (currentPreferences.city && validExtracted.city && validExtracted.city.toLowerCase() !== currentPreferences.city.toLowerCase()) {
      if (isCorrectionOrNegation && !isExplicitCityChange) {
        delete validExtracted.city
        delete validExtracted.destination
      }
    }

    const updated = { ...currentPreferences, ...validExtracted }
    assert.equal(updated.city, 'Medellín', 'Destination should change to Medellín')
  })

  it('should purge rejected places from specificPlaces when user notes they belong to another city', () => {
    const currentSpecifics = [
      'Playa Blanca',
      'El Rodadero',
      'Malecón del Río',
      'Catedral Metropolitana María Reina',
      'Bocas de Ceniza'
    ]

    const correctionMsg = 'te equivocaste, el Malecón del Río, la Catedral Metropolitana María Reina y Bocas de Ceniza son de Barranquilla'
    const lowerMsg = correctionMsg.toLowerCase()

    const filtered = currentSpecifics.filter(place => {
      const placeName = (typeof place === 'string' ? place : (place?.name || '')).toLowerCase()
      if (!placeName) return false
      return !lowerMsg.includes(placeName)
    })

    assert.deepEqual(filtered, ['Playa Blanca', 'El Rodadero'])
  })
})
