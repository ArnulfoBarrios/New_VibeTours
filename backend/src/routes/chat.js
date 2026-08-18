import { Router } from 'express'
import crypto from 'crypto'
import { getSession, saveSession, initializeSession } from '../services/chatSession.js'
import { extractChatInformation, generateChatResponse, planWithOpenAI } from '../services/openai.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels, reverseGeocodeLocation } from '../services/osm.js'
import { getWikipediaContext } from '../services/wikipedia.js'
import { optimizeRoute } from '../services/tomtom.js'
import { collectTourCandidates } from './ai.js'
import { resolveCanonicalDestination } from '../services/destinationService.js'

export const chatRouter = Router()

// Constantes de campos obligatorios canónicos
const REQUIRED_FIELDS = [
  'city',
  'datesSeason',
  'durationDays',
  'companions',
  'budget',
  'transport',
  'accommodationStatus'
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
    let actionChips = []

    // MÁQUINA DE ESTADOS UNIFICADA
    switch (state.currentState) {
      case 'WELCOME':
      case 'COLLECT_INFORMATION': {
        // Extraer info con OpenAI
        const extracted = await extractChatInformation(message, state.collectedData, state.history)
        if (extracted) {
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

        // Normalizar destino si viene en city
        if (state.collectedData.city && !state.collectedData.destination) {
          state.collectedData.destination = state.collectedData.city
        }

        // Verificar campos faltantes
        const missing = REQUIRED_FIELDS.filter(f => !state.collectedData[f])

        if (missing.length > 0) {
          state.currentState = 'COLLECT_INFORMATION'
          const fieldToAsk = missing[0]
          const chatRes = await generateChatResponse(
            state,
            `Falta el campo: ${fieldToAsk}. Pregúntale al usuario por este dato específico de manera cordial sin pedir más de una cosa a la vez.`,
            '',
            state.collectedData
          )
          responseText = typeof chatRes === 'string' ? chatRes : (chatRes.responseMessage || chatRes.message || '')
          actionChips = chatRes.actionChips || []
        } else {
          state.currentState = 'GENERATE_STOPS'
          responseText = "¡Perfecto! Tengo toda la información necesaria. Dame un momento mientras busco los mejores lugares reales para tu tour..."
        }
        break
      }

      case 'SUGGEST_CITY': {
        const extracted = await extractChatInformation(message, state.collectedData, state.history)
        if (extracted?.city) {
          state.collectedData.city = extracted.city
          state.collectedData.destination = extracted.city
          state.currentState = 'COLLECT_INFORMATION'
          const chatRes = await generateChatResponse(state, `El usuario seleccionó la ciudad ${extracted.city}. Evalúa si faltan datos y pregúntalos, o confirma.`, '', state.collectedData)
          responseText = typeof chatRes === 'string' ? chatRes : (chatRes.responseMessage || chatRes.message || '')
          actionChips = chatRes.actionChips || []
        } else {
          const chatRes = await generateChatResponse(state, 'El usuario no seleccionó ninguna ciudad clara. Vuelve a preguntarle a qué ciudad quiere ir.', '', state.collectedData)
          responseText = typeof chatRes === 'string' ? chatRes : (chatRes.responseMessage || chatRes.message || '')
          actionChips = chatRes.actionChips || []
        }
        break
      }

      case 'GENERATE_STOPS': {
        const canonical = await resolveCanonicalDestination(state.collectedData.city || state.collectedData.destination)
        if (!canonical) {
          state.currentState = 'COLLECT_INFORMATION'
          state.collectedData.city = null
          responseText = "No pude encontrar esa ciudad en la base de datos. ¿Podrías verificar el nombre o darme más detalles?"
          break
        }
        
        state.collectedData.canonicalDestination = canonical
        state.collectedData.city = canonical.city
        state.collectedData.country = canonical.country
        state.collectedData.destination = canonical.displayName

        const locationData = {
          name: canonical.displayName,
          latitude: canonical.latitude,
          longitude: canonical.longitude,
          city: canonical.city,
          country: canonical.country,
          placeId: canonical.placeId
        }

        // Obtener lugares reales filtrados turísticamente
        const candidatePack = await collectTourCandidates(state.collectedData, locationData)
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
        const optimized = await optimizeRoute(state.places)
        state.places = optimized

        state.currentState = 'GENERATE_JSON'
        responseText = "Generando el documento final del tour..."
        break
      }

      case 'GENERATE_JSON': {
        const durHours = state.collectedData.durationHours || (state.collectedData.durationDays ? state.collectedData.durationDays * 24 : 8)
        const finalTour = await planWithOpenAI({
          destination: state.collectedData.destination || state.collectedData.city,
          city: state.collectedData.city,
          country: state.collectedData.country,
          durationHours: durHours,
          type: state.collectedData.type || 'cultural',
          language: 'es',
          places: state.places,
          selectedHotel: state.collectedData.selectedHotel,
          userPreferences: state.collectedData
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
      actionChips,
      tour: state.finalTour
    })
  } catch (error) {
    next(error)
  }
})
