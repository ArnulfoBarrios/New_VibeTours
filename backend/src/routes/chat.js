import { Router } from 'express'
import crypto from 'crypto'
import { getSession, saveSession, initializeSession } from '../services/chatSession.js'
import { extractChatInformation, generateChatResponse, planWithOpenAI } from '../services/openai.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels } from '../services/osm.js'
import { getWikipediaContext } from '../services/wikipedia.js'
import { optimizeRoute } from '../services/tomtom.js'
import { collectTourCandidates } from './ai.js'

export const chatRouter = Router()

// Constantes de campos obligatorios
const REQUIRED_FIELDS = [
  'city',
  'budget',
  'travelers',
  'duration',
  'pace',
  'schedule',
  'transportation',
  'interests'
]

chatRouter.post('/start', async (req, res, next) => {
  try {
    const sessionId = crypto.randomUUID()
    const state = initializeSession(sessionId)
    await saveSession(sessionId, state)

    const responseText = "¡Hola! Soy Tour Planner AI, tu asistente experto en diseño de tours. Para empezar a crear una experiencia increíble, cuéntame: ¿a qué ciudad te gustaría viajar?"

    state.history.push({ role: 'assistant', content: responseText })
    await saveSession(sessionId, state)

    res.json({
      sessionId,
      state: state.currentState,
      message: responseText
    })
  } catch (error) {
    next(error)
  }
})

chatRouter.post('/message', async (req, res, next) => {
  try {
    const { sessionId, message, location } = req.body
    if (!sessionId || (!message && !location)) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (sessionId, message/location).' })
    }

    let state = await getSession(sessionId)
    if (!state) {
      return res.status(404).json({ error: 'Sesión no encontrada.' })
    }

    state.history.push({ role: 'user', content: message || 'Ubicación enviada.' })

    let responseText = ''

    // MÁQUINA DE ESTADOS
    switch (state.currentState) {
      case 'WELCOME':
      case 'COLLECT_INFORMATION': {
        // Extraer info con OpenAI
        const extracted = await extractChatInformation(message, state.collectedData)
        if (extracted) {
          // Merge datos
          Object.assign(state.collectedData, extracted)
        }
        if (location?.latitude && location?.longitude) {
          state.collectedData.latitude = location.latitude
          state.collectedData.longitude = location.longitude
          if (!state.collectedData.city) {
            const revGeo = await reverseGeocodeLocation(location.latitude, location.longitude).catch(() => null)
            if (revGeo?.city) {
              state.collectedData.city = revGeo.city
              if (revGeo.country) state.collectedData.country = revGeo.country
            }
          }
        }

        // Verificar campos faltantes
        const missing = REQUIRED_FIELDS.filter(f => !state.collectedData[f])
        if (state.collectedData.travelers === 'Familia' && state.collectedData.hasMinors === null) {
          missing.push('hasMinors')
        }

        if (missing.length > 0) {
          state.currentState = 'COLLECT_INFORMATION'
          // Pedir al modelo que pregunte el PRIMER campo faltante
          const fieldToAsk = missing[0]
          responseText = await generateChatResponse(state, `Falta el campo: ${fieldToAsk}. Pregúntale al usuario por este dato específico sin pedir más de una cosa a la vez. No inventes lugares ni hables de cosas no turísticas.`)
        } else {
          // Ya tenemos todo, transicionar a GENERATE_STOPS
          state.currentState = 'GENERATE_STOPS'
          responseText = "¡Perfecto! Tengo toda la información necesaria. Dame un momento mientras busco los mejores lugares reales para tu tour..."
        }
        break
      }

      case 'SUGGEST_CITY': {
        // El usuario respondió a una sugerencia
        const extracted = await extractChatInformation(message, state.collectedData)
        if (extracted?.city) {
          state.collectedData.city = extracted.city
          state.currentState = 'COLLECT_INFORMATION'
          responseText = await generateChatResponse(state, `El usuario seleccionó la ciudad ${extracted.city}. Evalúa si faltan datos y pregúntalos, o confirma.`)
        } else {
          responseText = await generateChatResponse(state, 'El usuario no seleccionó ninguna ciudad clara. Vuelve a preguntarle a qué ciudad quiere ir.')
        }
        break
      }

      case 'GENERATE_STOPS': {
        // En un flujo real, aquí dispararíamos un job asíncrono. Para simplificar:
        const geocode = await geocodePlace(state.collectedData.city)
        if (!geocode) {
          state.currentState = 'COLLECT_INFORMATION'
          state.collectedData.city = null
          responseText = "No pude encontrar esa ciudad en la base de datos. ¿Podrías verificar el nombre o darme más detalles?"
          break
        }
        
        // Obtener lugares reales filtrados turísticamente
        const candidatePack = await collectTourCandidates(state.collectedData, geocode)
        state.places = (candidatePack.places || []).slice(0, 10)
        
        // Enriquecer con Wikipedia
        for (const place of state.places) {
          const wiki = await getWikipediaContext(place.name)
          if (wiki) place.history = wiki.extract
        }

        state.currentState = 'GENERATE_ROUTE'
        responseText = "He encontrado excelentes lugares para tu tour. Procediendo a generar la ruta óptima..."
        break
      }

      case 'GENERATE_ROUTE': {
        // Optimizar ruta
        const optimized = await optimizeRoute(state.places)
        state.places = optimized

        state.currentState = 'GENERATE_JSON'
        responseText = "Generando el documento final del tour..."
        // Trigger de la generación final
        break
      }

      case 'GENERATE_JSON': {
        // Aquí llamaríamos a planWithOpenAI con la data final recolectada
        const finalTour = await planWithOpenAI({
          destination: state.collectedData.city,
          budget: state.collectedData.budget,
          places: state.places,
          // ... otros campos recolectados
        })
        state.finalTour = finalTour
        state.currentState = 'FINISHED'
        responseText = "¡Tu tour ha sido generado con éxito!"
        break
      }

      default:
        responseText = "El tour ya ha sido generado. Puedes verlo en tu panel principal."
        break
    }

    state.history.push({ role: 'assistant', content: responseText })
    await saveSession(sessionId, state)

    res.json({
      sessionId,
      state: state.currentState,
      message: responseText,
      tour: state.finalTour
    })
  } catch (error) {
    next(error)
  }
})
