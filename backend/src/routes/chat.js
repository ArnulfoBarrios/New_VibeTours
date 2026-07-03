import { Router } from 'express'
import crypto from 'crypto'
import { getSession, saveSession, initializeSession } from '../services/chatSession.js'
import { extractChatInformation, generateChatResponse, planWithOpenAI } from '../services/openai.js'
import { geocodePlace, photonSearch, overpassAttractions, overpassHotels } from '../services/osm.js'
import { getWikipediaContext } from '../services/wikipedia.js'
import { optimizeRoute } from '../services/tomtom.js'

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
          if (state.collectedData.travelers === 'Familia' && state.collectedData.hasMinors === null) {
            // Necesitamos saber si hay menores
          }
        }

        // Si no hay ciudad, pero tenemos ubicación del dispositivo
        if (!state.collectedData.city && location?.latitude && location?.longitude) {
          state.currentState = 'SUGGEST_CITY'
          responseText = "He recibido tu ubicación. Buscando destinos cercanos recomendados..."
          // Aquí podríamos generar 3 ciudades cercanas usando Photon o Nominatim (Reverse Geocoding)
          // y pasarlas a OpenAI para que sugiera.
          // Para simplificar, saltamos a pedirle a OpenAI que genere sugerencias.
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
        
        // Obtener lugares reales
        const places = await overpassAttractions(geocode.latitude, geocode.longitude, 10000)
        // TODO: Filtrar por intereses. Por ahora, pasamos todos a la IA.
        state.places = places.slice(0, 10) // Guardamos en el estado temporalmente
        
        // Enriquecer con Wikipedia
        for (const place of state.places) {
          const wiki = await getWikipediaContext(place.name)
          if (wiki) place.history = wiki.extract
        }

        state.currentState = 'HOTEL_SELECTION'
        responseText = "He encontrado excelentes lugares para tu tour. ¿Te gustaría que te recomiende algún hotel basado en tu presupuesto, o ya tienes alojamiento?"
        break
      }

      case 'HOTEL_SELECTION': {
        // Buscar hoteles con OpenStreetMap (Overpass API)
        const extracted = await extractChatInformation(message, state.collectedData)
        if (extracted?.wantsHotel !== false) {
          // Necesitamos las coordenadas de la ciudad
          const geocode = await geocodePlace(state.collectedData.city)
          if (geocode) {
            const hotels = await overpassHotels(geocode.latitude, geocode.longitude, state.collectedData.budget, 10000)
            state.hotels = hotels.slice(0, 3)
            if (hotels.length > 0) {
              responseText = `He encontrado estos hoteles utilizando la base de datos libre: ${hotels.slice(0, 3).map(h => h.name).join(', ')}. ¿Te parece bien alguno, o continuamos con el tour?`
            } else {
              responseText = "No encontré hoteles específicos en mi base de datos libre, pero puedes reservar en tu plataforma favorita. ¿Continuamos con la generación de la ruta?"
            }
          } else {
            responseText = "No pude ubicar la ciudad para buscar hoteles. ¿Continuamos con el tour?"
          }
          state.currentState = 'GENERATE_ROUTE' // Asumimos continuar
        } else {
          state.currentState = 'GENERATE_ROUTE'
          responseText = "Entendido. Procederé a generar la ruta óptima del tour."
        }
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
