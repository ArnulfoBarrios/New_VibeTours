import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'

import { imageForPlace, imageForPlaceWithStatus, wikipediaSummaryText } from '../services/imageSearch.js'
import { geocodePlace, overpassAttractions, photonSearch, overpassHotels, overpassNearbyCities, reverseGeocodeUserCountry, reverseGeocodeLocation, overpassNearbyFood, photonFoodFallback } from '../services/osm.js'
import { planWithOpenAI, extractLocation, suggestFallbackPlacesWithOpenAI, fetchCityIconicLandmarks, generateCustomPlaceReasons, generateRichPlaceDescriptionsBatch, geocodePlacesWithOpenAI, extractChatInformation, generateChatResponse, isNonTouristicInput, getDestinationPresets, generateSpeechAudio, buildOpenAiPayload } from '../services/openai.js'
import { searchWebForTravel } from '../services/webSearch.js'
import { supabase } from '../services/supabase.js'
import { resolveCanonicalDestination, validateCandidateLocation, haversineDistanceKm, cleanAdministrativeCityName } from '../services/destinationService.js'

export const aiRouter = Router()

// Endpoint de síntesis de voz humana mediante ElevenLabs / OpenAI TTS
aiRouter.post('/speech', async (req, res, next) => {
  try {
    const speechSchema = z.object({
      text: z.string().min(1),
      voice: z.string().optional().default('nova'),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
      model: z.string().optional().default('tts-1'),
      provider: z.enum(['auto', 'elevenlabs', 'openai']).optional().default('auto')
    })
    const { text, voice, speed, model, provider } = speechSchema.parse(req.body)
    const audioBuffer = await generateSpeechAudio({ text, voice, speed, model, provider })
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400, immutable'
    })
    res.send(audioBuffer)
  } catch (error) {
    next(error)
  }
})

// Alias /tts para retrocompatibilidad
aiRouter.post('/tts', async (req, res, next) => {
  try {
    const speechSchema = z.object({
      text: z.string().min(1),
      voice: z.string().optional().default('nova'),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
      model: z.string().optional().default('tts-1'),
      provider: z.enum(['auto', 'elevenlabs', 'openai']).optional().default('auto')
    })
    const { text, voice, speed, model, provider } = speechSchema.parse(req.body)
    const audioBuffer = await generateSpeechAudio({ text, voice, speed, model, provider })
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400, immutable'
    })
    res.send(audioBuffer)
  } catch (error) {
    next(error)
  }
})

// Almacenamiento en memoria para trabajos de generación asíncrona
const tourJobs = new Map()

// Limpieza periódica de jobs antiguos (cada hora)
setInterval(() => {
  const now = Date.now()
  for (const [jobId, job] of tourJobs.entries()) {
    if (now - job.createdAt > 3600000) {
      tourJobs.delete(jobId)
    }
  }
}, 3600000).unref()

const requestSchema = z.object({
  destination: z.string().optional().default(''),
  country: z.string().optional().default(''),
  city: z.string().optional().default(''),
  canonicalDestination: z.object({
    displayName: z.string(),
    city: z.string(),
    region: z.string().optional().default(''),
    country: z.string(),
    countryCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    placeId: z.string().optional().default(''),
    isAmbiguous: z.boolean().optional().default(false)
  }).optional(),
  originPlace: z.string().optional(),
  destinationPlace: z.string().optional(),
  isUserLocationOrigin: z.boolean().optional(),
  cities: z.array(z.string()).optional().default([]),
  isMultiCity: z.boolean().optional().default(false),
  durationHours: z.number().min(1).max(720).optional(),
  durationDays: z.number().min(1).max(30).optional(),
  type: z.string().optional().default('cultural'),
  language: z.string().optional().default('es'),
  prompt: z.string().optional().default(''),
  touristProfileSummary: z.string().optional().default(''),
  touristInterests: z.array(z.string()).optional().default([]),
  touristPace: z.string().optional().default('balanced'),
  persist: z.boolean().optional().default(false),
  userId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  budget: z.string().optional(),
  selectedPlaces: z.array(z.any()).optional().default([]),
  specificPlaces: z.array(z.any()).optional().default([])
})

// Clasificador de tipos de entidad universal para evitar que lugares de distinta categoría se confundan entre sí
export function getPlaceEntityType(placeName) {
  if (!placeName || typeof placeName !== 'string') return 'generic'
  const lower = placeName.toLowerCase()
  if (/\b(museo|museum|galer[íi]a de arte|teatro|monumento|estatua|escultura|castillo|fuerte|muralla|bastion|palacio)\b/i.test(lower)) return 'cultural'
  if (/\b(parque|jard[íi]n|jardin|bosque|reserva|sendero|cascada|laguna|lago|mirador|bot[áa]nico|botanico|pueblito)\b/i.test(lower)) return 'park_nature'
  if (/\b(playa|beach|bah[íi]a|bahia|cala|isla|island|cayo|arrecife|muelle|puerto|piscina|cabo|ensenada|playón)\b/i.test(lower)) return 'beach_coastal'
  if (/\b(catedral|bas[íi]lica|basilica|iglesia|capilla|templo|mezquita|sinagoga|santuario)\b/i.test(lower)) return 'religious'
  if (/\b(restaurante|restaurant|bistro|caf[ée]|coffee|bar|gastrobar|asador|pizzer[íi]a|taquer[íi]a|pub|cervecer[íi]a|panader[íi]a|pasteler[íi]a|comida|helader[íi]a|parador|kiosko)\b/i.test(lower)) return 'food'
  if (/\b(centro comercial|mall|shopping|plaza comercial|mercado|bazar)\b/i.test(lower)) return 'shopping'
  if (/\b(estadio|coliseo|arena|zool[óo]gico|zoologico|acuario|parque de diversiones|parque tem[áa]tico)\b/i.test(lower)) return 'entertainment_sports'
  if (/\b(paseo|malec[oó]n|malecon|rambla|avenida|bulevar|callej[oó]n|callejon|plaza|plazoleta)\b/i.test(lower)) return 'urban_promenade'
  return 'generic'
}

// Limpiador de prefijos de actividad para obtener el nombre físico limpio del lugar
export function cleanPlacePhysicalName(placeName) {
  if (!placeName || typeof placeName !== 'string') return ''
  let cleaned = placeName
    .replace(/[*_#•\[\]\(\)]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned.replace(/^(?:tour\s+(?:en\s+barco|en\s+lancha|guiado|panor[áa]mico|por|a|al|hacia)\s+(?:por\s+la|por\s+el|por|la|el|a\s+la|a\s+el|al)?\s*)/i, '')
  cleaned = cleaned.replace(/^(?:paseo\s+(?:en\s+barco|en\s+lancha|en\s+bote|en\s+kayak|en\s+chiva|por|a|al|hacia)\s+(?:por\s+la|por\s+el|por|la|el|a\s+la|a\s+el|al)?\s*)/i, '')
  cleaned = cleaned.replace(/^(?:recorrido\s+(?:por\s+el|por\s+la|por|en\s+el|en\s+la|en|a\s+el|a\s+la|a|al)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:visita\s+(?:guiada\s+)?(?:a\s+la|a\s+el|al|a|por\s+el|por\s+la|por)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:excursi[oó]n\s+(?:a\s+la|a\s+el|al|a|hacia\s+la|hacia\s+el|hacia|por)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:caminata\s+(?:por\s+el|por\s+la|por|hacia\s+el|hacia\s+la|hacia|a\s+el|a\s+la|a|al)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:almuerzo\s+(?:en\s+el|en\s+la|en)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:cena\s+(?:en\s+el|en\s+la|en)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:desayuno\s+(?:en\s+el|en\s+la|en)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:degustaci[oó]n\s+(?:en\s+el|en\s+la|en)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:tarde\s+de\s+playa\s+en\s*)/i, '')
  cleaned = cleaned.replace(/^(?:exploraci[oó]n\s+(?:de\s+la|de\s+el|del|de)\s*)/i, '')
  cleaned = cleaned.replace(/^(?:recorrido\s+hist[óo]rico\s+por\s+(?:el|la)?\s*)/i, '')

  cleaned = cleaned.trim()
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned
}

// Normalizador de clave canónica para fusionar variantes de un mismo lugar (ej: "Restaurante El Bistro" vs "Bistro", "Playa de El Rodadero" vs "El Rodadero")
export function normalizePlaceKey(placeName) {
  if (!placeName || typeof placeName !== 'string') return ''
  const cleaned = cleanPlacePhysicalName(placeName)
  const base = cleaned
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[*_#•\-]/g, ' ') // remove markdown
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim()

  // Remove commercial/hospitality descriptors and action prefixes
  // BUT PRESERVE distinct geographical accident nouns (bahia, cerro, isla, playa, castillo, convento, catedral, plaza, parque)
  const stripped = base
    .replace(/\b(restaurante de la|restaurante del|restaurante de|restaurante el|restaurante la|restaurante los|restaurante las|restaurante|gastrobar de|gastrobar|bar de|bar el|bar la|bar|cafe de|cafe el|cafe la|cafe|discoteca de|discoteca la|discoteca el|discoteca|club de|club|pub de|pub)\b/g, ' ')
    .replace(/\b(la|el|los|las|un|una|unos|unas|del|de|de la|de los)\b/g, ' ') // remove articles
    .replace(/\b(visita a la|visita a|visita al|recorrido por el|recorrido por la|recorrido por|paseo en lancha a|paseo en lancha por|paseo en barco a|paseo en|paseo por|excursion a la|excursion a|excursión a|excursion al|ir a|entrada a|parada en|caminar por|recorrer el|visitar la|visitar el)\b/g, ' ') // remove action prefixes
    .replace(/\s+/g, ' ')
    .trim()

  let result = stripped.length >= 2 ? stripped : base
  if (result === 'playa rodadero') result = 'rodadero'
  return result
}

// Deduplica una lista de nombres de lugares usando su clave canónica y similitud de subcadenas
export function deduplicatePlacesByName(places = []) {
  const result = []
  for (const p of places) {
    if (!p) continue
    let name = typeof p === 'string' ? p.trim() : (p.name || '').trim()
    name = cleanPlacePhysicalName(name)
    const dia = typeof p === 'object' ? (p.dia || p.day) : null
    if (!name || !isValidSpecificPlace(name)) continue
    const key = normalizePlaceKey(name)
    if (!key) continue
    const type = getPlaceEntityType(name)

    const existingIdx = result.findIndex(item => {
      const existingName = typeof item === 'string' ? item : (item.name || '')
      const existingKey = normalizePlaceKey(existingName)
      const existingType = getPlaceEntityType(existingName)
      const existingDia = typeof item === 'object' ? (item.dia || item.day) : null

      // Si tienen categorías explícitas incompatibles (ej: beach_coastal vs cultural, food vs cultural), NUNCA son duplicados
      if (type !== 'generic' && existingType !== 'generic' && type !== existingType) {
        return false
      }

      // Si están en días explícitamente distintos y las claves no son 100% idénticas, no fusionar
      if (dia && existingDia && dia !== existingDia && key !== existingKey) {
        return false
      }

      if (key === existingKey) return true

      // Substring match: only when both keys have multi-word distinctive phrases and significant length
      if (key.length >= 6 && existingKey.length >= 6) {
        const wordsA = key.split(' ').filter(w => w.length >= 3)
        const wordsB = existingKey.split(' ').filter(w => w.length >= 3)
        if (wordsA.length > 1 && wordsB.length > 1) {
          if (key.includes(existingKey) || existingKey.includes(key)) return true
        }
      }
      return false
    })

    const entry = typeof p === 'object' && dia ? { name, dia: Number(dia), day: Number(dia) } : name

    if (existingIdx === -1) {
      result.push(entry)
    } else {
      const existing = result[existingIdx]
      const existingName = typeof existing === 'string' ? existing : (existing.name || '')
      const existingDia = typeof existing === 'object' ? (existing.dia || existing.day) : null
      const finalDia = dia || existingDia
      if (name.length > existingName.length && /[A-Z]/.test(name)) {
        result[existingIdx] = finalDia ? { name, dia: Number(finalDia), day: Number(finalDia) } : name
      } else if (finalDia && typeof result[existingIdx] === 'string') {
        result[existingIdx] = { name: existingName, dia: Number(finalDia), day: Number(finalDia) }
      }
    }
  }
  return result
}

// Filtro estricto que descarta encabezados de días, horas, formatos markdown, metadatos, categorías, eventos temporales, cementerios, canales inaccesibles y ciudades puras
export function isValidSpecificPlace(placeName) {
  if (!placeName || typeof placeName !== 'string') return false
  
  // Limpiar markdown, corchetes, paréntesis, viñetas y espacios conservando guiones internos
  const clean = placeName.replace(/[*_#•\[\]\(\)]/g, '').trim()
  if (clean.length < 3) return false
  const cleanLower = clean.toLowerCase()

  // Descartar opciones o nombres de hotel sugeridos extraídos accidentalmente (ej: "Real", "Las Palmas", "Hotel...")
  if (/^(?:real|las palmas|hotel|hostal|resort|posada|cabaña|cabañas)$/i.test(cleanLower)) {
    return false
  }

  // 1. Descartar encabezados de días y momentos del día
  const isTimeHeader = /^(d[íi]a\s*\d+|day\s*\d+|mañana|tarde|noche|almuerzo|cena|desayuno|madrugada|atardecer)/i.test(clean)
  if (isTimeHeader) return false

  // 1.1 Descartar fragmentos que inician con preposiciones o verbos de propósito ("para explorar", "por la tarde", "hacia el centro")
  if (/^(?:para|por|hacia|desde|hasta)\s+/i.test(cleanLower)) {
    return false
  }

  // 1.2 Descartar frases de actividad descriptiva o transición que inician con verbos o sustantivos de ocio
  if (/^(?:exploraci[oó]n|caf[ée]\s+y\s+cascadas|cascadas\s+en|tarde\s+(?:en|de|libre)|mañana\s+(?:en|de|libre)|d[íi]a\s+(?:en|de|libre)|llegada|despedida|check-in|check-out|instalaci[oó]n|regreso|retorno|traslado|la\s+playa|el\s+mar|las\s+playas|la\s+ciudad|el\s+centro|el\s+hotel)\b/i.test(cleanLower)) {
    return false
  }

  // 2. Descartar comodidades de hoteles, metadatos, acciones y frases meta de viaje
  const isGeographicPlace = /^(?:playa|bah[íi]a|cabo|punta|isla|islas|ensenada|golfo|cerro|mirador|parque|reserva)\s+[a-z]+/i.test(cleanLower)
  if (!isGeographicPlace && !/^(?:la\s+piscina|playa\s+la\s+piscina|piscina\s+natural)\b/i.test(cleanLower)) {
    const isMetaOrAmenity = /\b(hotel|hostal|resort|hospedaje|alojamiento|posada|caba[ñn]a|motel|irotama|zuana|decameron|hilton|marriott|movich|casa la fe|casa isabel|majagua|the meeting point|yivinaca|colonial inn|monaco real|canadiense|imperial|punto de partida|llegada|retorno|despedida|regreso|regreso a casa|regreso al hotel|check|check-in|check-out|checkin|checkout|comodidad|comodidades|comodidades principales|rango de precios|precios?|tarifas?|servicios?|instalaciones|ubicaci[oó]n|estilo|ambiente|desayuno|wifi|sol[aá]rium|habitaciones|detalles|descanso|bailar|actividades|itinerario|ver men[uú]|sugerir|consultar|men[uú]|hotel elegido|hotel acordado|punto de encuentro|restaurante local|atracci[oó]n principal|restaurantes|destinos|por d[íi]a|aeropuerto|airport|notas?|resumen|descripci[óo]n|incluye|no incluye|opciones|presupuesto|transporte|acompañantes|fechas|duraci[oó]n|destino|gastos|medio de transporte)\b/i.test(cleanLower)
    if (isMetaOrAmenity) return false
  }

  // 2.1 Descartar actividades descriptivas de viaje, check-ins, ocio genérico, despedidas o momentos libres
  const isDescriptiveActivity = /\b(instalaci[oó]n|instalacion en casa|en casa|llegada a|bienvenida|despedida de|despedida|regreso a|regreso al hotel|picnic|picnic o almuerzo|picnic en la zona|almuerzo en la zona|comida en la zona|tarde libre|tiempo libre|d[íi]a libre|dia libre|mañana libre|noche libre|compras o descanso|para compras|últimos momentos|ultimos momentos|disfrutar de la ciudad|a tu ritmo|participaci[oó]n en|evento cultural|si hay alguno|relax en|de relax|vida nocturna en|exploraci[oó]n de|descubrir la historia|fiesta nocturna|vida nocturna|noche de fiesta|noche de rumba|rumba|tubbing|tubing|careteo|rafting|canopy|kayak|paddle|senderismo|caminata|cascadas y visita|visita a fincas|fincas de caf[ée]|finca cafetera|fincas cafeteras)\b/i.test(cleanLower)
  if (isDescriptiveActivity && !/\b(restaurante|bar|museo|parque nacional|teatro|catedral|iglesia|bistr[oó]|calle\s+\d+|quinta de|playa\s+[a-z]+|bah[íi]a\s+[a-z]+|cabo\s+[a-z]+|centro comercial)\b/i.test(cleanLower)) {
    return false
  }

  // 2.2 Descartar palabras genéricas o fragmentos sueltos no identificables
  const isGenericFragment = /^(local|un local|el local|restaurante local|un restaurante local|bar local|la zona|zona|en la zona|la ciudad|ciudad|en la ciudad|casa propia|alojamiento propio|en casa|casa|casa de un familiar|casa familiar|para explorar|explorar|fiesta nocturna|las cascadas|cascadas|el r[íi]o|r[íi]o|tubbing en el r[íi]o|tubbing|tubing|la playa|playa|playas|las playas|el mar|la costa|la bahía|la bahia|la montaña|la sierra|el parque|la plaza)$/i.test(cleanLower)
  if (isGenericFragment) return false

  // 2.3 Descartar estructuras físicas genéricas o no turísticas que no son atracciones (canchas de barrio, paradas de bus, pérgolas)
  if (/^(la\s+)?(p[ée]rgola|cancha|cancha sint[ée]tica|cancha de f[uú]tbol|cancha de microf[uú]tbol|parada de bus|estaci[óo]n de bus|quiosco|kiosco|grader[íi]as)$/i.test(cleanLower) ||
      /\b(cancha sint[ée]tica|cancha de f[uú]tbol|parque cancha)\b/i.test(cleanLower)) {
    return false
  }

  // 2.4 Descartar infraestructura industrial (oleoductos, gasoductos, tuberías, refinerías, plantas)
  if (/\b(oleoducto|gasoducto|poliducto|refiner[íi]a|tuber[íi]a|estaci[oó]n de bombeo|planta de tratamiento|patio de tanques|cenit|ecopetrol)\b/i.test(cleanLower)) {
    return false
  }

  // 2.5 Descartar tiendas, supermercados, droguerías, ferreterías y almacenes cotidianos
  if (/\b(supermercado|droguer[íi]a|farmacia|ferreter[íi]a|almac[ée]n de cadena|minimarket|estanco|miscel[aá]nea|bodega de|dep[oó]sito de)\b/i.test(cleanLower)) {
    return false
  }

  // 2.6 Descartar oficinas gremiales, asociaciones y fundaciones administrativas
  if (/\b(association|asociaci[oó]n|fundaci[oó]n|cooperativa|corporaci[oó]n|sindicato|gremio)\b/i.test(cleanLower) && !/\b(parque|museo|teatro|restaurante)\b/i.test(cleanLower)) {
    return false
  }

  // 3. Descartar cementerios y servicios funerarios
  if (/cementerio|camposanto|jardines de cartagena|jardines del recuerdo|jardines de paz|jardin de paz|parque cementerio|graveyard|cemetery|funeraria|morgue|crematorio|mausoleo/i.test(cleanLower)) {
    return false
  }

  // 4. Descartar canales de drenaje, ciénagas inaccesibles en agua y acequias
  if (/canal santa marta|canal del dique|ci[ée]naga grande|ci[ée]naga de la virgen|drenaje|acequia|quebrada|rio frio|r[íi]o fr[íi]o|rio sevilla|r[íi]o sevilla/i.test(cleanLower)) {
    return false
  }

  // 5. Descartar categorías de turismo generales, eventos/festivales y etiquetas temáticas
  const isCategoryOrTheme = /^(gastronom[íi]a|gastronom[íi]a local|cultura|cultura e historia|historia|naturaleza|aventura|aventuras|actividades de aventura|playa|playas|tour de caf[ée]|vida nocturna|compras|entretenimiento|arte|m[úu]sica|deportes?|bienestar|relax|ecoturismo|excursi[óo]n|excursiones|paseo|paseos|bailar|senderismo|buceo|snorkel|avistamiento|degustaci[óo]n|cata|visita|recorrido|actividad|actividades|opciones|imperdibles|destacados|llegada|salida|check|check-in|check-out|checkin|checkout|despedida|aeropuerto|fiesta del mar|fiestas del mar|carnaval|carnavales|festival|festivales|feria|ferias|desfile|desfiles|semana santa|evento|eventos|descripci[óo]n|resumen|notas?|presupuesto|transporte|alojamiento|hospedaje|acompañantes|fechas|duraci[oó]n|destino)$/i.test(cleanLower)
  if (isCategoryOrTheme) return false

  // 6. Descartar si es país o "Ciudad, País"
  if (/, (m[ée]xico|espa[ñn]a|colombia|ee\.?\s*uu\.?|estados unidos|francia|italia|brasil|argentina|per[úu]|chile|reino unido|alemania)\b/i.test(cleanLower)) {
    return false
  }

  // 7. Descartar nombres de ciudades, regiones o departamentos puros o con preposiciones
  const isCityOnly = /^(?:a\s+|en\s+|hacia\s+|por\s+|desde\s+)?(cartagena|barranquilla|medell[íi]n|bogot[áa]|santa marta|canc[úu]n|miami|roma|madrid|barcelona|par[íi]s|toledo|cusco|orlando|nueva york|new york|cali|colombia|magdalena|bol[íi]var|antioquia|distrito tur[íi]stico|distrito)$/i.test(cleanLower)
  if (isCityOnly) return false

  return true
}

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const chatSchema = z.object({
      message: z.string(),
      history: z.array(z.object({ role: z.string(), content: z.string() })).optional().default([]),
      currentPreferences: z.record(z.any()).optional().default({}),
      latitude: z.number().optional(),
      longitude: z.number().optional()
    })
    const { message, history, currentPreferences, latitude, longitude } = chatSchema.parse(req.body)

    // Filtro inmediato de consultas no turísticas: congelar estado, no generar tarjetas ni avanzar tour
    if (isNonTouristicInput(message)) {
      const rejectionMsg = 'Esa consulta no está relacionada con la planificación de viajes o turismo. Mi especialidad es exclusivamente diseñar tours personalizados y asesorarte en tus vacaciones. Por favor, indícame a qué ciudad te gustaría viajar o qué tipo de experiencia turística deseas.'
      return res.json({
        responseMessage: rejectionMsg,
        message: rejectionMsg,
        botMessage: rejectionMsg,
        actionChips: ['Explorar ciudades', 'Aventura y naturaleza', 'Cultura e historia'],
        destinationSuggestions: [],
        readyToBuild: false,
        preferences: currentPreferences,
        updatedPreferences: currentPreferences,
        isUnrelatedToTravel: true
      })
    }

    // Solo usar GPS del usuario como coordenadas iniciales si no hay destino previo confirmado
    if (latitude && longitude && !currentPreferences.canonicalDestination && !currentPreferences.destination && !currentPreferences.city) {
      currentPreferences.latitude = latitude
      currentPreferences.longitude = longitude
    }

    // Si el usuario pide atracciones "cerca de mi zona / cerca de mí" y no hay destino previo, geocodificar su ciudad actual
    if (latitude && longitude && !currentPreferences.destination && !currentPreferences.city && /\b(cerca de mi|cerca de m[íi]|mi zona|mi ubicaci[óo]n|mi ciudad|aqu[íi]|propio pa[íi]s|en mi pa[íi]s|cercano|cercanos)\b/i.test(message)) {
      try {
        const geoResult = await reverseGeocodeLocation(latitude, longitude)
        if (geoResult?.city) {
          const cleanCity = cleanAdministrativeCityName(geoResult.city)
          currentPreferences.city = cleanCity
          currentPreferences.destination = cleanCity
          if (geoResult.country) currentPreferences.country = geoResult.country
        }
      } catch (_) {}
    }

    // 1. Extraer preferencias del último mensaje del usuario usando LLM + Fallback
    const extracted = await extractChatInformation(message, currentPreferences, history)

    // Si la intención es ambigua (ej. "presupuesto" sin contexto), no mutar estado ni inferir transportes
    if (extracted?.isAmbiguousInput && extracted?.intentEval?.needsClarification) {
      const promptText = extracted.intentEval.clarificationPrompt
      const options = extracted.intentEval.options || []
      const chips = options.map(o => (typeof o === 'string' ? o : (o.label || o.id || '')))
      return res.json({
        responseMessage: promptText,
        message: promptText,
        botMessage: promptText,
        intentEval: extracted.intentEval,
        preferences: currentPreferences,
        updatedPreferences: currentPreferences,
        options,
        actionChips: chips.filter(Boolean),
        destinationSuggestions: [],
        readyToBuild: false,
        needsClarification: true
      })
    }

    const prevSpecifics = Array.isArray(currentPreferences.specificPlaces) ? currentPreferences.specificPlaces : []
    const extractedSpecifics = Array.isArray(extracted?.specificPlaces) ? extracted.specificPlaces : []
    const initialCombinedSpecifics = Array.from(new Set([...prevSpecifics, ...extractedSpecifics])).filter(Boolean)

    // Fusionar de forma estrictamente acumulativa: NUNCA sobreescribir valores válidos con null o undefined
    const validExtracted = {}
    if (extracted && typeof extracted === 'object') {
      Object.entries(extracted).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          validExtracted[key] = value
        }
      })
    }

    // Safeguard: Protect confirmed destination from accidental overwrite when user mentions day stops or attractions
    const hasExistingCity = Boolean(currentPreferences.city || currentPreferences.destination)
    const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(message)
    const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a)\b/i.test(message)
    const isExplicitMultiRoute = Boolean(validExtracted.isMultiCity || validExtracted.isMultiCountry || /\b(de\s+[a-záéíóúñ\s]+\s+a\s+[a-záéíóúñ\s]+|ruta\s+entre|road\s*trip)\b/i.test(message))

    if (hasExistingCity && !isExplicitCityChange && !isExplicitMultiRoute) {
      const existingBaseCity = (currentPreferences.destination || currentPreferences.city || '').toLowerCase().trim()
      const newDest = (validExtracted.destination || '').toLowerCase().trim()

      const isSubordinateParkOrAttraction = (dest) => {
        if (!dest) return false
        return /tayrona|minca|guatap[eé]|valle de cocora|islas del rosario|isla bar[uú]|san bernardo|taganga|rodadero/i.test(dest) ||
               /\b(parque|reserva|isla|playa|valle|mirador)\b/i.test(dest)
      }

      if (isSubordinateParkOrAttraction(validExtracted.destination) || (newDest && newDest !== existingBaseCity)) {
        console.info(`[ai/chat] Preserving base hub destination "${currentPreferences.destination || currentPreferences.city}" - keeping mentioned "${validExtracted.destination || validExtracted.city}" as a day stop.`)
        
        if (validExtracted.destination && !/^(santa marta|cartagena|medell[íi]n|bogot[áa])$/i.test(validExtracted.destination)) {
          if (!validExtracted.specificPlaces) validExtracted.specificPlaces = []
          const alreadyHas = validExtracted.specificPlaces.some(p => (typeof p === 'string' ? p : p.name).toLowerCase().includes(validExtracted.destination.toLowerCase()))
          if (!alreadyHas) {
            validExtracted.specificPlaces.push({ name: validExtracted.destination, dia: 2 })
          }
        }
        delete validExtracted.city
        delete validExtracted.destination
        delete validExtracted.canonicalDestination
      }
    }

    const updatedPreferences = {
      ...currentPreferences,
      ...validExtracted
    }
    if (latitude && longitude) {
      updatedPreferences.userGpsLatitude = latitude
      updatedPreferences.userGpsLongitude = longitude
      if (!updatedPreferences.destination && !updatedPreferences.city && !updatedPreferences.canonicalDestination) {
        updatedPreferences.latitude = latitude
        updatedPreferences.longitude = longitude
      }
    }
    if (initialCombinedSpecifics.length > 0) {
      if (isCorrectionOrNegation) {
        const lowerMsg = message.toLowerCase()
        updatedPreferences.specificPlaces = initialCombinedSpecifics.filter(place => {
          const placeName = (typeof place === 'string' ? place : (place?.name || '')).toLowerCase()
          if (!placeName) return false
          return !lowerMsg.includes(placeName)
        })
      } else {
        updatedPreferences.specificPlaces = initialCombinedSpecifics
      }
    }
    delete updatedPreferences.intentEval
    delete updatedPreferences.isAmbiguousInput

    const isOnlyInquiringHotel = /\b(m[aá]s informaci[oó]n|informaci[oó]n del?|informaci[oó]n sobre|detalles del?|cu[eé]ntame m[aá]s|cu[eé]ntame sobre|c[oó]mo es el|qu[eé] tal es el|precios? del?|servicios del?)\b/i.test(message)
    const isExplicitlyChoosingHotel = /\b(confirmar|confirmo|elegir|elijo|escoger|escojo|seleccionar|selecciono|me quedo en|quiero hospedarme en|me hospedo en|este hotel)\b/i.test(message)
    const isHomeOrLocalLodging = /\b(en mi casa|mi casa|casa de un familiar|casa de familiares|casa de un amigo|casa de amigos|casa de mis padres|vivo aqu[íi]|vivo en la ciudad|es mi ciudad|ya tengo hospedaje|ya tengo alojamiento|ya tengo hotel|ya tengo donde quedarme|no necesito hotel|no requiero hotel|alojamiento propio|hospedaje propio|en casa)\b/i.test(message)

    if (isHomeOrLocalLodging) {
      updatedPreferences.selectedHotel = { name: 'Casa propia / Alojamiento particular' }
      updatedPreferences.accommodationStatus = 'Casa propia / familiar'
    } else if (isOnlyInquiringHotel && !isExplicitlyChoosingHotel) {
      if (!currentPreferences.selectedHotel) {
        delete updatedPreferences.selectedHotel
        delete updatedPreferences.accommodationStatus
      }
    }

    if (!updatedPreferences.companions && /\b(nos\s+vamos|nos\s+quedamos|nos\s+hospedamos|tenemos|vamos\s+con|viajamos|somos)\b/i.test(message)) {
      updatedPreferences.companions = 'En grupo'
    }

    // Normalización determinística de duración por expresiones clave y rangos de fechas
    const datesString = `${updatedPreferences.datesSeason || ''} ${message || ''}`
    const dateRangeMatch = datesString.match(/\b(?:del\s+|desde\s+(?:el\s+)?)?(\d{1,2})\s+(?:al|hasta(?:\s+el)?)\s+(\d{1,2})\b/i)
    if (dateRangeMatch) {
      const startD = parseInt(dateRangeMatch[1], 10)
      const endD = parseInt(dateRangeMatch[2], 10)
      if (endD >= startD && (endD - startD) <= 30) {
        const calculatedDays = endD - startD + 1
        updatedPreferences.durationDays = calculatedDays
        updatedPreferences.durationHours = calculatedDays * 24
      }
    } else if (/\b(puente festivo|un puente festivo|un puente|puente|fin de semana largo|3 d[íi]as)\b/i.test(message)) {
      updatedPreferences.durationDays = 3
      updatedPreferences.durationHours = 72
    } else if (/\b(fin de semana|un par de d[íi]as|2 d[íi]as)\b/i.test(message) && !updatedPreferences.durationDays) {
      updatedPreferences.durationDays = 2
      updatedPreferences.durationHours = 48
    } else if (/\b(1 d[íi]a|un d[íi]a)\b/i.test(message) && !updatedPreferences.durationDays) {
      updatedPreferences.durationDays = 1
      updatedPreferences.durationHours = 8
    } else if (/\b(semanita|una semana|7 d[íi]as)\b/i.test(message)) {
      updatedPreferences.durationDays = 7
      updatedPreferences.durationHours = 168
    }

    // Si hay objetos vacíos o nulos, limpiarlos
    Object.keys(updatedPreferences).forEach(key => {
      if (updatedPreferences[key] === null || updatedPreferences[key] === undefined) {
        delete updatedPreferences[key]
      }
    })

    // Resolve Canonical Destination if city/destination is present
    if (updatedPreferences.isMultiCity && updatedPreferences.originPlace && updatedPreferences.destinationPlace) {
      updatedPreferences.destination = `${updatedPreferences.originPlace} a ${updatedPreferences.destinationPlace}`
      updatedPreferences.city = updatedPreferences.destinationPlace
      if (!updatedPreferences.cities || updatedPreferences.cities.length === 0) {
        updatedPreferences.cities = [updatedPreferences.originPlace, updatedPreferences.destinationPlace]
      }
    } else if (updatedPreferences.isMultiCountry && Array.isArray(updatedPreferences.countries) && updatedPreferences.countries.length > 0) {
      updatedPreferences.destination = updatedPreferences.countries.join(' y ')
      updatedPreferences.country = updatedPreferences.countries.join(', ')
    } else {
      let rawDest = updatedPreferences.destination || updatedPreferences.city
      if (rawDest && typeof rawDest === 'string' && rawDest.trim().length > 0) {
        rawDest = cleanAdministrativeCityName(rawDest)
        const canonical = await resolveCanonicalDestination(rawDest)
        if (canonical) {
          // If destination changed, clear previous specific places and hotel to prevent cross-destination pollution
          const prevDest = currentPreferences.canonicalDestination?.entityName || currentPreferences.canonicalDestination?.city || currentPreferences.destination || currentPreferences.city
          const newDest = canonical.entityName || canonical.city
          if (prevDest && newDest && prevDest.toLowerCase() !== newDest.toLowerCase()) {
            delete updatedPreferences.specificPlaces
            delete updatedPreferences.selectedHotel
          }
          if (canonical.isMicroDestination && (currentPreferences.destination || currentPreferences.city) && !isExplicitCityChange) {
            // Keep macro base city, do not let microdestination overwrite it
            updatedPreferences.canonicalDestination = canonical
            updatedPreferences.destination = currentPreferences.destination || currentPreferences.city
            updatedPreferences.city = currentPreferences.city || currentPreferences.destination
          } else {
            updatedPreferences.canonicalDestination = canonical
            updatedPreferences.city = canonical.isMicroDestination ? canonical.entityName : cleanAdministrativeCityName(canonical.city)
            updatedPreferences.destination = canonical.isMicroDestination ? canonical.entityName : (canonical.entityName || canonical.displayName || canonical.city)
          }
          updatedPreferences.country = canonical.country
          updatedPreferences.region = canonical.region
          if (Number.isFinite(canonical.latitude) && Number.isFinite(canonical.longitude)) {
            updatedPreferences.latitude = canonical.latitude
            updatedPreferences.longitude = canonical.longitude
          }
        } else {
          updatedPreferences.destination = rawDest
          updatedPreferences.city = cleanAdministrativeCityName(rawDest)
        }
      }
    }

    // Desambiguación estricta para Cartagena -> Colombia
    if (updatedPreferences.city && /^cartagena$/i.test(updatedPreferences.city.trim()) && (!updatedPreferences.country || /españa|spain/i.test(updatedPreferences.country))) {
      updatedPreferences.city = 'Cartagena'
      updatedPreferences.country = 'Colombia'
      updatedPreferences.destination = 'Cartagena, Bolívar, Colombia'
    }

    // 2. Realizar búsqueda en vivo en la web (Tavily/DDG) si hay destino O si la consulta incluye preguntas sobre fechas, festivos, clima o eventos
    let webSearchResult = null
    const dest = updatedPreferences.canonicalDestination?.displayName || updatedPreferences.city || updatedPreferences.destination
    const isDateOrEventQuery = /\b(festivo|festivos|puente|puentes|clima|evento|eventos|calendario|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto)\b/i.test(message)

    if (dest || isDateOrEventQuery) {
      const searchQuery = isDateOrEventQuery 
        ? `${message} en el municipio de ${dest || 'Colombia'}`
        : `eventos turismo clima atracciones imperdibles en el municipio de ${dest} ${updatedPreferences.datesSeason || ''}`.trim()

      webSearchResult = await searchWebForTravel({
        query: searchQuery,
        city: dest || '',
        destination: dest || '',
        country: updatedPreferences.country || 'Colombia',
        dates: updatedPreferences.datesSeason || ''
      }).catch(err => {
        console.warn('[ai/chat] web search failed:', err.message)
        return null
      })
    }

    // Fetch verified real food / restaurant places if inquiring about dining or if within planning stages
    let nearbyFoodPlaces = []
    const isFoodQuery = /\b(restaurante|restaurantes|comida|comer|almorzar|cenar|gastronom[íi]a|platos|donde comer|d[oó]nde comer)\b/i.test(message)
    const targetLat = updatedPreferences.latitude || updatedPreferences.canonicalDestination?.latitude
    const targetLon = updatedPreferences.longitude || updatedPreferences.canonicalDestination?.longitude
    if (targetLat && targetLon && (isFoodQuery || updatedPreferences.destination)) {
      try {
        nearbyFoodPlaces = await overpassNearbyFood(targetLat, targetLon, 8000).catch(() => [])
        if (!nearbyFoodPlaces || nearbyFoodPlaces.length === 0) {
          nearbyFoodPlaces = await photonFoodFallback(targetLat, targetLon).catch(() => [])
        }
      } catch (err) {
        console.warn('[ai/chat] nearby food search failed:', err.message)
      }
    }

    // 3. Generar respuesta conversacional amigable y cordial con la IA
    const chatState = {
      history: [
        ...history,
        { role: 'user', content: message }
      ]
    }

    const aiResponse = await generateChatResponse(
      chatState,
      `Preferencias del usuario acumuladas: ${JSON.stringify(updatedPreferences)}`,
      webSearchResult?.summary || '',
      updatedPreferences,
      nearbyFoodPlaces
    )

    // Extraer lugares SOLO si ya se eligió la ciudad destino y provienen de elecciones explícitas o de un itinerario estructurado confirmado
    const hasConfirmedCity = Boolean(updatedPreferences.city || updatedPreferences.destination)
    const isAskingCityRecomms = !hasConfirmedCity && /\b(recomien|recomiend|qué me recomiendas|dónde ir|opciones|destinos)\b/i.test(message)
    const extractedFromMsg = []

    if (hasConfirmedCity && !isAskingCityRecomms) {
      function extractPoisFromText(text) {
        if (!text || typeof text !== 'string') return []
        const found = []
        const ACTION_PREFIX_REGEX = /^(?:visita\s+(?:a\s+la|al?|a)?|recorrid(?:o|a)\s+(?:por\s+el?|en\s+el?|por|en)?|explora(?:r|ci[óo]n)?\s+(?:de\s+la|del?|el?|la)?|paseo\s+(?:en\s+lancha\s+a\s+la|en\s+lancha\s+a|en\s+barco\s+a|en\s+lancha\s+por|en\s+lancha|en|por)?|excursi[óo]n\s+(?:a\s+la|al?|a|hacia|por)?|caminata\s+(?:hacia\s+la|hacia|a\s+la|al?|a|por)?|tour\s+(?:en\s+lancha\s+por|por\s+el?|de\s+snorkel\s+en|de\s+degustaci[óo]n\s+gastron[óo]mica|de|por|en)?|explorar\s+la\s+vida\s+nocturna\s+en\s+el?|explorar\s+la\s+vida\s+nocturna\s+en|vida\s+nocturna\s+en\s+el?|vida\s+nocturna\s+en|vida\s+nocturna|cenar\s+en|cenar|almorzar\s+en|almorzar|cena\s+y\s+diversi[oó]n\s+en|cena\s+en\s+un\s+restaurante\s+en|cena\s+en\s+un\s+restaurante\s+t[íi]pico|cena\s+en\s+un\s+restaurante|cena\s+en\s+un\s+local\s+de\s+la|cena\s+en\s+un\s+local|cena\s+en\s+un\s+bar\s+local|cena\s+en\s+un\s+bar|cena\s+de\s+despedida\s+en|cena\s+de\s+despedida|cena\s+en|cena|almuerzo\s+en\s+un\s+restaurante\s+local|almuerzo\s+en\s+un\s+restaurante|almuerzo\s+en\s+el\s+centro|almuerzo\s+en\s+la\s+playa|almuerzo\s+en|almuerzo|noche\s+en|noche|tarde\s+en|tarde\s+de\s+relax\s+en|tarde\s+libre\s+para\s+(?:compras\s+o\s+descanso|compras|descanso|explorar\s+el?|explorar)|tarde\s+libre|d[íi]a\s+de\s+playa\s+en|d[íi]a\s+de\s+relax\s+en|d[íi]a\s+en|d[íi]a\s+libre\s+para\s+explorar[^->\n]*|d[íi]a\s+libre|tiempo\s+libre\s+para\s+visitar\s+el?|tiempo\s+libre\s+para\s+visitar|tiempo\s+libre\s+para\s+explorar|tiempo\s+libre|check-in\s+en|check-in|check-out\s+en|check-out|instalaci[oó]n\s+en\s+(?:casa|el\s+hotel|el\s+alojamiento|hotel)|instalaci[oó]n|picnic\s+(?:o\s+almuerzo\s+en\s+la\s+zona|en\s+la\s+zona|en\s+la\s+playa|en)|[uú]ltimos\s+momentos\s+para\s+(?:disfrutar\s+de\s+la\s+ciudad|disfrutar|explorar)|participaci[oó]n\s+en\s+(?:alg[uú]n\s+)?evento\s+cultural|llegada\s+a\s+la|llegada\s+al?|llegada\s+a|llegada\s*\/\s*hotel[^->\n]*|llegada|salida\s+a|salida\s+de|salida|regreso\s+a\s+casa|regreso\s+a\s+santa\s+marta|regreso\s+a\s+barranquilla|regreso\s+a|regreso\s+y\s+cena\s+de\s+despedida|regreso\s+y\s+cena\s+de|regreso\s+y\s+cena|regreso|despedida\s+de\s+[^->\n]+|despedida)\s+/i

        function cleanAndAddCandidate(rawCandidate, day) {
          if (!rawCandidate || typeof rawCandidate !== 'string') return
          let raw = rawCandidate.trim()

          // 1. Extraer recomendaciones específicas de restaurantes/lugares dentro de paréntesis
          // ej: "Cena en un restaurante local (recomiendo Restaurante El Celler para disfrutar de comida típica)"
          const parentheticalVenueMatch = raw.match(/\((?:recomiendo\s+|recomiendo\s*:\s*|sugiero\s+|como\s+|visita\s+|opci[oó]n\s+)?(Restaurante\s+[^,.)]+|Bar\s+[^,.)]+|Caf[ée]\s+[^,.)]+|Museo\s+[^,.)]+|La\s+[A-ZÁÉÍÓÚÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ]+|El\s+[A-ZÁÉÍÓÚÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i)
          if (parentheticalVenueMatch && parentheticalVenueMatch[1]) {
            const venueName = parentheticalVenueMatch[1].trim()
            if (isValidSpecificPlace(venueName)) {
              found.push(day ? { name: venueName, dia: day, day: day } : venueName)
              return
            }
          }

          let candidate = raw
            .replace(/[*_#\[\]•]/g, ' ')
            .trim()
            .replace(ACTION_PREFIX_REGEX, '')
            .trim()

          // Si el texto tiene explicaciones adicionales tipo ", donde podrás apreciar...", quitarlo
          candidate = candidate.replace(/,\s*(?:donde|donde\s+podr[áa]s|con|para|ideal\s+para|o\s+explorar|famoso\s+por|un\s+lugar\s+emblem[áa]tico).*$/i, '').trim()
          candidate = candidate.replace(/\s+para\s+(?:disfrutar|degustar|conocer|apreciar|explorar|relajarse|descansar).*$/i, '').trim()
          candidate = candidate.replace(/\s*\(famoso\s+por[^)]*\)/i, '').trim()
          candidate = candidate.replace(/\s*\(un\s+lugar\s+emblem[áa]tico[^)]*\)/i, '').trim()

          // Quitar paréntesis explicativos tipo "(si hay partido)" pero preservar si es nombre de lugar
          if (/\s*\((?:si\s+hay|sujeto\s+a|opcional|seg[úu]n|aplica)[^)]*\)/i.test(candidate)) {
            candidate = candidate.replace(/\s*\((?:si\s+hay|sujeto\s+a|opcional|seg[úu]n|aplica)[^)]*\)/i, '').trim()
          } else {
            candidate = candidate.replace(/\s*\([^)]*\)/g, '').trim()
          }
          candidate = candidate.replace(/[.,;!*:]+$/, '').trim()
          candidate = candidate.replace(/^[.,;!*:]+/, '').trim()

          // Si conecta dos lugares con " y el " o " y la " (ej: "Catedral Metropolitana María Reina y el Parque de los Fundadores")
          const isSingleCompoundVenue = /^(?:acuario\s+y\s+museo|restaurante\s+y\s+bar|bar\s+y\s+restaurante|caf[ée]\s+y\s+bar)\b/i.test(candidate)
          if (!isSingleCompoundVenue && /\s+y\s+(?:el\s+|la\s+|los\s+|las\s+)/i.test(candidate)) {
            const subParts = candidate.split(/\s+y\s+(?:el\s+|la\s+|los\s+|las\s+)/i)
            for (const sp of subParts) {
              cleanAndAddCandidate(sp, day)
            }
            return
          }

          if (isValidSpecificPlace(candidate)) {
            found.push(day ? { name: candidate, dia: day, day: day } : candidate)
          }
        }

        const lines = text.split('\n')
        let currentDay = null
        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line) continue

          const dayMatch = line.match(/(?:•|\-|\*|\d+[\.\)])?\s*D[íi]a\s*(\d+)/i)
          if (dayMatch) {
            currentDay = parseInt(dayMatch[1], 10)
          }

          // Omitir líneas de metadatos o parámetros de viaje
          if (/^(?:•|\-|\*|\d+[\.\)])?\s*(?:alojamiento|hospedaje|hotel|transporte|presupuesto|acompañantes|fechas|duraci[óo]n|destino|resumen|notas|gastos|itinerario)\s*:/i.test(line)) {
            continue
          }

          // 1. Extraer elementos separados por flechas (-> o —) en la línea
          if (/->|—|–|>/.test(line)) {
            const content = line.replace(/^(?:•|\-|\*|\d+[\.\)])?\s*D[íi]a\s*\d+\s*:\s*/i, '')
            const parts = content.split(/->|—|–|>/)
            for (const part of parts) {
              cleanAndAddCandidate(part, currentDay)
            }
          } else {
            // 2. Extraer negritas específicas si las hay (**Nombre**)
            const boldRegex = /\*\*([^*\n]{3,60})\*\*/g
            let bm
            let foundBold = false
            while ((bm = boldRegex.exec(line)) !== null) {
              cleanAndAddCandidate(bm[1], currentDay)
              foundBold = true
            }

            // 3. Extraer ítems numerados o con viñetas estándar si no hubo flechas ni negritas
            if (!foundBold) {
              const regex = /^(?:\d+[\.\)]|[•\-\*])\s*(?:(?:🌅|🍽️|🌇|🌙|🌟)?\s*(?:Mañana|Almuerzo|Tarde|Noche|Cena|Visita al?|Recorrido por|Paseo en|Explora(?:r)?|Actividad|Gastronom[íi]a|Check-in|Check-out|Check|Llegada|Salida|Despedida)(?:\s+\d+)?\s*[:—\-]\s*)?\*{0,2}([^:\n\.\(\—]{3,60})\*{0,2}\s*[:—\-]?/i
              const m = line.match(regex)
              if (m && !dayMatch) {
                cleanAndAddCandidate(m[1], currentDay)
              }
            }
          }
        }
        return deduplicatePlacesByName(found)
      }

      // Extraer lugares estructurados devueltos por OpenAI si están disponibles
      if (Array.isArray(aiResponse.extractedPreferences?.specificPlaces) && aiResponse.extractedPreferences.specificPlaces.length > 0) {
        for (const sp of aiResponse.extractedPreferences.specificPlaces) {
          const spName = typeof sp === 'object' ? (sp.name || '') : String(sp)
          const spDay = typeof sp === 'object' ? (sp.dia || sp.day) : null
          if (isValidSpecificPlace(spName)) {
            extractedFromMsg.push(spDay ? { name: spName, dia: Number(spDay), day: Number(spDay) } : spName)
          }
        }
      }

      // Extraer de la respuesta del asistente ÚNICAMENTE si es un itinerario estructurado confirmado
      const isConfirmedItineraryMsg = Boolean(
        aiResponse.readyToBuild ||
        (aiResponse.responseMessage && /\b(itinerario de viaje|itinerario finalizado|itinerario actualizado|d[íi]a 1:)\b/i.test(aiResponse.responseMessage))
      )

      if (isConfirmedItineraryMsg) {
        let pois = extractPoisFromText(aiResponse.responseMessage || '')
        if (pois.length < 2) {
          const recentAssistantMsgs = (history || []).filter(m => m.role === 'assistant' || m.type === 'ai').reverse()
          for (const aMsg of recentAssistantMsgs) {
            const historyPois = extractPoisFromText(aMsg.content || aMsg.text || '')
            if (historyPois.length >= 2) {
              pois = historyPois
              break
            }
          }
        }
        if (pois.length > 0) {
          extractedFromMsg.push(...pois)
        }
      }

      // Si el usuario aceptó en lote ("agregar todas las actividades", "vale agrega todas esas actividades", etc.), extraer de mensajes recientes del asistente
      const isUserAcceptingAll = /\b(agregar|incluir|a[ñn]adir|agrega)\s+(todas|estas|est[aá]s|esas|los|las|mis)?\s*(actividades|lugares|atracciones|restaurantes|recomendaciones|opciones|paradas)?/i.test(message) ||
        /\b(vale\s+agrega|s[íi],?\s*(agrega|incluye|a[ñn]ade)|agrega(r)?\s*(todas|estas|est[aá]s|esas)|incluir\s+todas|agregar\s+est[aá]s|agregar\s+estas)\b/i.test(message)

      if (isUserAcceptingAll) {
        const recentAssistantMsgs = (history || []).filter(m => m.role === 'assistant' || m.type === 'ai')
        for (const aMsg of recentAssistantMsgs) {
          extractedFromMsg.push(...extractPoisFromText(aMsg.content || aMsg.text || ''))
        }
      }
    }

    if (aiResponse.extractedPreferences && typeof aiResponse.extractedPreferences === 'object') {
      Object.entries(aiResponse.extractedPreferences).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '' && !updatedPreferences[k]) {
          updatedPreferences[k] = v
        }
      })
    }

    if (updatedPreferences.city) {
      updatedPreferences.city = cleanAdministrativeCityName(updatedPreferences.city)
    }
    if (updatedPreferences.destination) {
      updatedPreferences.destination = cleanAdministrativeCityName(updatedPreferences.destination)
    }

    if (!hasConfirmedCity || isAskingCityRecomms) {
      delete updatedPreferences.specificPlaces
    } else {
      const isConfirmedItineraryMsg = Boolean(
        aiResponse.readyToBuild ||
        (aiResponse.responseMessage && /\b(itinerario de viaje|itinerario finalizado|itinerario actualizado|d[íi]a 1:)\b/i.test(aiResponse.responseMessage))
      )

      const rawCombined = [
        ...(Array.isArray(updatedPreferences.specificPlaces) ? updatedPreferences.specificPlaces : []),
        ...(Array.isArray(aiResponse.specificPlaces) ? aiResponse.specificPlaces : []),
        ...extractedFromMsg
      ].filter(p => {
        const pName = typeof p === 'object' ? (p.name || '') : String(p)
        return isValidSpecificPlace(pName)
      })

      const combinedSpecifics = isConfirmedItineraryMsg && extractedFromMsg.length >= 2
        ? deduplicatePlacesByName(extractedFromMsg.filter(p => isValidSpecificPlace(typeof p === 'object' ? p.name : p)))
        : deduplicatePlacesByName(rawCombined)

      let validatedSpecifics = combinedSpecifics
      const canonicalDest = updatedPreferences.canonicalDestination || (hasConfirmedCity ? await resolveCanonicalDestination(updatedPreferences.city || updatedPreferences.destination).catch(() => null) : null)
      if (canonicalDest && Number.isFinite(canonicalDest.latitude) && Number.isFinite(canonicalDest.longitude)) {
        const geocodedCheck = await Promise.allSettled(
          combinedSpecifics.map(async p => {
            const pName = typeof p === 'object' ? (p.name || '') : String(p)
            const geo = await geocodePlace(`${pName}, ${canonicalDest.city || updatedPreferences.city || ''}, ${canonicalDest.country || ''}`, canonicalDest.latitude, canonicalDest.longitude).catch(() => null)
            if (geo && !validateCandidateLocation(geo, canonicalDest, 70)) {
              console.warn(`[/ai/chat geofence] Dropping distant hallucinated place "${pName}" for destination "${canonicalDest.city}"`)
              return null
            }
            return p
          })
        )
        validatedSpecifics = geocodedCheck.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
      }

      if (validatedSpecifics.length > 0) {
        updatedPreferences.specificPlaces = validatedSpecifics
      } else {
        delete updatedPreferences.specificPlaces
      }
    }

    res.json({
      responseMessage: aiResponse.responseMessage,
      actionChips: aiResponse.actionChips || [],
      destinationSuggestions: aiResponse.destinationSuggestions || [],
      readyToBuild: Boolean(aiResponse.readyToBuild),
      preferences: updatedPreferences,
      webSearchDone: Boolean(webSearchResult)
    })
  } catch (error) {
    next(error)
  }
})

aiRouter.post('/tours/generate', async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
    if (input.city && input.city.trim().length > 0) {
      input.destination = input.city.trim()
    }

    // Serverless environments like Vercel: process synchronously to avoid 404 polling errors
    if (process.env.VERCEL) {
      console.info('[tour-ai] Serverless runtime detected (Vercel). Processing tour generation synchronously.')
      try {
        const result = await processTourGeneration(null, input)
        return res.json({
          status: 'completed',
          message: 'Tour generado con éxito',
          tour: result.tour,
          route: result.route
        })
      } catch (err) {
        console.error('[tour-ai] Synchronous generation failed:', err.message)
        return res.status(500).json({ error: err.message || 'Error al generar el tour.' })
      }
    }

    const jobId = crypto.randomUUID()
    tourJobs.set(jobId, {
      id: jobId,
      status: 'geocoding',
      message: 'Ubicando destino...',
      createdAt: Date.now(),
      tour: null,
      route: null,
      error: null
    })

    // Background processing for persistent node environments
    processTourGeneration(jobId, input).catch((err) => {
      console.error(`[tour-ai] Job ${jobId} failed completely:`, err)
      const job = tourJobs.get(jobId)
      if (job) {
        job.status = 'failed'
        job.message = 'Ocurrió un error inesperado al generar el tour.'
        job.error = String(err)
      }
    })

    res.json({ jobId, status: 'geocoding', message: 'Ubicando destino...' })
  } catch (error) {
    next(error)
  }
})

aiRouter.get('/tours/status/:jobId', (req, res) => {
  const job = tourJobs.get(req.params.jobId)
  if (!job) {
    return res.status(404).json({ error: 'Job no encontrado o expirado' })
  }
  res.json({
    id: job.id,
    status: job.status,
    message: job.message,
    tour: job.tour,
    route: job.route,
    error: job.error
  })
})

aiRouter.post('/tours/recommend', async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
    
    let userCountry = null;
    let revLocation = null;
    if (input.latitude && input.longitude) {
      revLocation = await reverseGeocodeLocation(input.latitude, input.longitude).catch(() => null)
      userCountry = revLocation?.country || await reverseGeocodeUserCountry(input.latitude, input.longitude)
    }
    
    let extracted = null
    if ((!input.destination || !input.durationHours) && input.prompt) {
      extracted = await extractLocation(input.prompt, input.latitude, input.longitude, userCountry)
      if (extracted) {
        if (extracted.is_unrelated === true) {
          return res.json({
            isUnrelated: true,
            message: 'Lo siento, soy un asistente diseñado exclusivamente para planificar tours y viajes. No estoy hecho para ese propósito.'
          })
        }
        if (extracted.explicit_destination && !input.destination) {
          input.destination = extracted.explicit_destination || extracted.city || extracted.country || ''
        }
        if (!input.city && extracted.city) {
          input.city = extracted.city
        }
        if (!input.country && extracted.country) {
          input.country = extracted.country
        }
        if (extracted.origin_place && !input.originPlace) {
          input.originPlace = extracted.origin_place
        }
        if (extracted.is_user_location_origin) {
          input.isUserLocationOrigin = true
          if (!input.originPlace) input.originPlace = 'user_current_location'
        }
        if (extracted.destination_place && !input.destinationPlace) {
          input.destinationPlace = extracted.destination_place
        }
        if (!input.destination && (input.destinationPlace || extracted?.destination_place || extracted?.explicit_destination)) {
          input.destination = input.destinationPlace || extracted?.destination_place || extracted?.explicit_destination || input.city || ''
        }
        if (!input.destination && input.isUserLocationOrigin) {
          if (!input.city && revLocation?.city) input.city = revLocation.city
          if (!input.country && revLocation?.country) input.country = revLocation.country
          if (!input.destination && (revLocation?.city || input.city)) input.destination = revLocation?.city || input.city
        }
        if (extracted.cities && extracted.cities.length > 0 && (!input.cities || input.cities.length === 0)) {
          input.cities = extracted.cities
        }
        if (extracted.is_multi_city && !input.isMultiCity) {
          input.isMultiCity = Boolean(extracted.is_multi_city)
        }
        if (extracted.duration_hours && !input.durationHours) {
          input.durationHours = Number(extracted.duration_hours)
        }
        if (extracted.budget && !input.budget) {
          input.budget = extracted.budget
        }
        if (extracted.companion_type) {
          input.touristProfileSummary = `${input.touristProfileSummary || ''}\nCompañeros de viaje: ${extracted.companion_type}`.trim()
        }
      }
    }
    
    // Classify Tour Type strictly
    const isExplicitUserGpsOrigin = Boolean(extracted?.is_user_location_origin || input?.originPlace === 'user_current_location')
    const hasOriginPlace = Boolean(input.originPlace && input.originPlace !== 'user_current_location')
    const hasDestinationPlace = Boolean(input.destinationPlace)
    const isPointToPointRoute = (isExplicitUserGpsOrigin && hasDestinationPlace) || (hasOriginPlace && hasDestinationPlace)
    const isMultiCityTour = Boolean(extracted?.is_multi_city || input?.isMultiCity || (extracted?.cities && extracted.cities.length >= 2))
    const isDurationSpecifiedInPrompt = Boolean(extracted?.duration_specified || input?.durationSpecified)

    // RULE 1: Point-to-Point A -> B tours NEVER ask for destination or duration
    if (isPointToPointRoute) {
      if (!input.durationHours) {
        input.durationHours = 8 // Default 1 day for point-to-point tours
      }
    }

    // RULE 2: If city/destination is missing and it's NOT point-to-point and NOT multi-city, ASK FOR DESTINATION
    if (!input.destination && !isPointToPointRoute && !isMultiCityTour) {
      const rawSuggestions = (extracted && Array.isArray(extracted.suggestions) && extracted.suggestions.length > 0)
        ? extracted.suggestions
        : [
            { city: "Santa Marta", country: "Colombia", reason: "Playas hermosas cerca del Parque Tayrona." },
            { city: "Cartagena", country: "Colombia", reason: "Ciudad histórica con hermosas playas caribeñas." },
            { city: "Medellín", country: "Colombia", reason: "La ciudad de la eterna primavera llena de cultura." }
          ]

      const settledSuggestions = await Promise.allSettled(
        rawSuggestions.map(async (sugg) => {
          let imageUrl = ''
          try {
            imageUrl = await imageForPlace(sugg.city, sugg.country || '')
          } catch (e) {
            console.error('Error fetching image for suggestion:', e)
          }
          return {
            ...sugg,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'
          }
        })
      )
      const suggestions = settledSuggestions.map((res, i) => 
        res.status === 'fulfilled' ? res.value : {
          ...rawSuggestions[i],
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'
        }
      )

      return res.json({
        needsDestination: true,
        message: '¿A qué ciudad o lugar te gustaría ir? Basado en lo que buscas, aquí tienes algunas recomendaciones:',
        suggestions
      })
    }

    if (!input.durationHours && input.durationDays) {
      input.durationHours = Number(input.durationDays) === 1 ? 8 : Number(input.durationDays) * 24
    }

    // RULE 3: If duration is missing and NOT specified in prompt, ASK FOR DURATION
    if (!isPointToPointRoute && !isDurationSpecifiedInPrompt && !input.durationHours) {
      if (isMultiCityTour) {
        return res.json({
          needsDuration: true,
          isMultiCity: true,
          destination: input.destination,
          city: input.city || input.destination,
          country: input.country || '',
          message: '¿Cuánto tiempo va a durar tu tour entre ciudades? (Mínimo 2 días)',
          suggestions: [
            { label: '2 días', hours: 48 },
            { label: '3 días', hours: 72 },
            { label: '4 días', hours: 96 },
            { label: '5 días', hours: 120 }
          ]
        })
      } else {
        return res.json({
          needsDuration: true,
          isMultiCity: false,
          destination: input.destination,
          city: input.city || input.destination,
          country: input.country || '',
          message: '¿Cuánto tiempo va a durar tu tour?',
          suggestions: [
            { label: '1 día (4 horas)', hours: 4 },
            { label: '1 día', hours: 8 },
            { label: '2 días', hours: 48 },
            { label: '3 días', hours: 72 },
            { label: '4 días', hours: 96 }
          ]
        })
      }
    }
    
    if (input.city && input.city.trim().length > 0 && (!input.destination || input.destination === 'Destino')) {
      input.destination = input.city.trim()
    }
    
    let location = null

    // 1. If explicit valid coordinates were provided in request, use them directly
    if (input.latitude && input.longitude && Number.isFinite(Number(input.latitude)) && Number.isFinite(Number(input.longitude))) {
      location = {
        name: input.canonicalDestination?.displayName || input.destination || input.city,
        latitude: Number(input.latitude),
        longitude: Number(input.longitude),
        city: input.canonicalDestination?.city || input.city || input.destination,
        country: input.canonicalDestination?.country || input.country || '',
        placeId: input.canonicalDestination?.placeId
      }
    }

    // 2. Try geocoding with composite query parts
    if (!location) {
      const queryParts = [...new Set([input.destination, input.city, input.country].filter(Boolean))]
      if (queryParts.length > 0) {
        location = await geocodePlace(queryParts.join(', '))
      }
    }

    // 3. Try geocoding city or destination alone
    if (!location && (input.city || input.destination)) {
      location = await geocodePlace(input.city || input.destination)
    }

    // 4. Try canonical destination resolution
    if (!location && (input.city || input.destination)) {
      const canonical = await resolveCanonicalDestination(input.city || input.destination)
      if (canonical) {
        location = {
          name: canonical.displayName,
          latitude: canonical.latitude,
          longitude: canonical.longitude,
          city: canonical.city,
          country: canonical.country,
          placeId: canonical.placeId
        }
      }
    }

    if (!location) {
      return res.status(400).json({ error: 'No pudimos identificar la ubicación ingresada.' })
    }
    const candidatePack = await collectTourCandidates(input, location)
    if (!candidatePack.places || candidatePack.places.length === 0) {
      return res.status(400).json({ error: 'No encontramos suficientes lugares de interés.' })
    }
    const planner = buildTourPlanner(input, location, candidatePack.places)
    
    // Batch-generate 100% unique custom reasons & rich descriptions for all selected places using OpenAI
    const placeNames = planner.selectedPlaces.map(p => p.name)
    const [customReasonsMap, richDescriptionsMap] = await Promise.all([
      generateCustomPlaceReasons({
        destination: input.destination,
        city: input.city,
        prompt: input.prompt,
        places: placeNames
      }).catch(() => ({})),
      generateRichPlaceDescriptionsBatch({
        destination: input.destination,
        city: input.city,
        country: input.country,
        places: placeNames,
        prompt: input.prompt
      }).catch(() => ({}))
    ])

    const assignedUrls = new Set()
    // We send back the selected places as recommendations with real unique images & rich descriptions
    const recommendations = await Promise.all(
      planner.selectedPlaces.map(async (place, index) => {
        let imageUrl = place.imageUrl || place.images?.[0] || ''
        if (!imageUrl || assignedUrls.has(imageUrl)) {
          try {
            const imgRes = await imageForPlaceWithStatus(place.name, input.city || input.destination || '', place.category, index, {
              country: input.country,
              latitude: place.latitude,
              longitude: place.longitude,
              assignedUrls
            })
            imageUrl = imgRes.url
          } catch (_) {}
        }
        if (!imageUrl) {
          imageUrl = getReliableCategoryFallbackImage(place.name, place.category)
        }
        assignedUrls.add(imageUrl)

        const aiReason = customReasonsMap[place.name] || null
        const richItem = richDescriptionsMap[place.name]
        const richDesc = typeof richItem === 'object' ? (richItem?.descripcion || '') : (richItem || place.description || place.history || '')

        return {
          id: place.placeId || place.id || `rec-${index}`,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          category: place.category || 'turismo',
          imageUrl,
          description: richDesc,
          reason: buildRecommendationReason(place, input, aiReason),
          durationMinutes: place.minutes || 25,
          dia: Number(place.dia || place.day || 1),
          day: Number(place.dia || place.day || 1),
          locationInfo: {
            nombre_lugar: place.name,
            direccion: place.address || '',
            ciudad: place.city || input.city || '',
            region: place.region || '',
            pais: place.country || input.country || '',
            place_id: place.placeId,
            url_mapa: mapUrlFor(place.latitude, place.longitude)
          }
        }
      })
    )
    
    res.json({
      durationHours: input.durationHours,
      destination: input.destination,
      city: input.city,
      country: input.country,
      budget: input.budget,
      recommendations,
      plannerContext: {
        distanceKm: planner.distanceKm,
        recommendedSchedule: planner.recommendedSchedule,
        difficulty: planner.difficulty,
        bestSeason: planner.bestSeason,
        audience: planner.audience,
        subcategories: planner.subcategories,
        accessibility: planner.accessibility,
        petsAllowed: planner.petsAllowed,
        familyFriendly: planner.familyFriendly,
      }
    })
  } catch (error) {
    next(error)
  }
})

aiRouter.post('/tours/build', async (req, res, next) => {
  try {
    const buildSchema = z.object({
      request: requestSchema,
      places: z.array(z.any()), // The confirmed places
      plannerContext: z.record(z.any()).optional()
    })
    const { request: input, places, plannerContext } = buildSchema.parse(req.body)
    
    if ((!input.city || !input.country) && input.destination) {
      const location = await geocodePlace(input.destination)
      if (location) {
        input.city = location.city || ''
        input.country = location.country || ''
      }
    }

    // Serverless environments like Vercel: process synchronously to avoid 404 polling errors
    const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME)
    if (isServerless) {
      console.info('[tour-ai] Serverless runtime detected. Processing tour build synchronously.')
      try {
        const result = await processTourBuild(null, input, places, plannerContext)
        return res.json({
          status: 'completed',
          message: 'Tour generado con éxito',
          tour: result.tour,
          route: result.route
        })
      } catch (err) {
        console.error('[tour-ai] Synchronous tour build failed:', err.message)
        return res.status(500).json({ error: err.message || 'Error al generar el tour.' })
      }
    }
    
    const jobId = crypto.randomUUID()
    tourJobs.set(jobId, {
      id: jobId,
      status: 'generating_narrative',
      message: 'Creando narración única del tour con IA...',
      createdAt: Date.now(),
      tour: null,
      route: null,
      error: null
    })

    processTourBuild(jobId, input, places, plannerContext).catch((err) => {
      console.error(`[tour-ai] Job ${jobId} failed completely:`, err)
      const job = tourJobs.get(jobId)
      if (job) {
        job.status = 'failed'
        job.message = 'Ocurrió un error inesperado al generar el tour.'
        job.error = String(err)
      }
    })

    res.json({ jobId, status: 'generating_narrative', message: 'Construyendo tour...' })
  } catch (error) {
    next(error)
  }
})

aiRouter.post('/tours/alternatives', async (req, res, next) => {
  try {
    const altSchema = z.object({
      request: requestSchema,
      currentPlaces: z.array(z.any()),
      excludeIds: z.array(z.string()).optional()
    })
    const { request: input, currentPlaces, excludeIds = [] } = altSchema.parse(req.body)

    const firstPlace = currentPlaces.length > 0 ? currentPlaces[0] : null
    const lat = input.latitude || firstPlace?.latitude
    const lon = input.longitude || firstPlace?.longitude

    // 1. Reverse Geocode exact location from coordinates if available
    let revLocation = null
    if (lat && lon) {
      revLocation = await reverseGeocodeLocation(lat, lon).catch(() => null)
    }

    const city = input.city || revLocation?.city || firstPlace?.locationInfo?.ciudad || 'Santa Marta'
    const country = input.country || revLocation?.country || firstPlace?.locationInfo?.pais || 'Colombia'
    const destination = (input.destination && input.destination.length < 30 && input.destination !== 'Destino')
      ? input.destination
      : city

    console.info('[alternatives] Identified destination city:', { city, country, destination, lat, lon })

    // 2. Geocode exact city location
    let location = await geocodePlace(`${city} ${country}`, lat, lon).catch(() => null)
    if (!location && lat && lon) {
      location = {
        name: city,
        latitude: lat,
        longitude: lon,
        city,
        country
      }
    }

    const currentKeys = new Set(
      currentPlaces.map(p => normalizeKey(p.name || '')).filter(Boolean)
    )
    const currentIds = new Set(
      [
        ...currentPlaces.map(p => (p.id || p.placeId || '').toLowerCase().trim()),
        ...excludeIds.map(id => (id || '').toLowerCase().trim())
      ].filter(Boolean)
    )

    // 3. Fast Parallel Search: Photon POIs + Real AI alternatives in parallel
    const excludeNameList = Array.from(currentKeys).filter(n => n.length > 2)
    const [photonPlaces, aiSuggestions] = await Promise.all([
      (async () => {
        if (!location?.latitude) return []
        try {
          return await photonTourAttractions({
            city,
            country,
            latitude: location.latitude,
            longitude: location.longitude,
            limit: 12
          })
        } catch (_) {
          return []
        }
      })(),
      suggestFallbackPlacesWithOpenAI({
        destination,
        city,
        country,
        type: input.type || 'cultural',
        excludeNames: excludeNameList
      }).catch(() => [])
    ])

    const isDuplicatePlace = (name, pId) => {
      if (!name && !pId) return true
      const normKey = normalizeKey(name || '')
      if (normKey && currentKeys.has(normKey)) return true
      if (pId && currentIds.has(String(pId).toLowerCase().trim())) return true
      return false
    }

    const isQualityTouristPlace = (p) => {
      if (!p || !p.name) return false
      const n = (p.name || '').toLowerCase().trim()
      if (n.length < 3) return false
      if (n === city.toLowerCase() || n === `${city.toLowerCase()}, ${country.toLowerCase()}` || n.includes(`${city.toLowerCase()} ${city.toLowerCase()}`)) {
        return false
      }
      if (/\b(aeropuerto|airport|terminal de transporte|terminal de buses|estaci[oó]n de servicio|gasolinera|hospital|cl[íi]nica|parqueadero|parking|alcald[íi]a|gobernaci[oó]n|cementerio|carulla|éxito|olímpica|d1|ara|banco|cajero)\b/i.test(n)) {
        return false
      }
      if (/^(v[íi]a\s+|carretera\s+|autopista\s+|calle\s+|carrera\s+|diagonal\s+|transversal\s+)/i.test(n) || /\s+-\s+/.test(n)) {
        return false
      }
      return isValidSpecificPlace(p.name)
    }

    let available = (photonPlaces || []).filter(place => {
      return isQualityTouristPlace(place) && !isDuplicatePlace(place.name, place.placeId || place.id)
    })

    const rawAiList = Array.isArray(aiSuggestions)
      ? aiSuggestions
      : (Array.isArray(aiSuggestions?.places) ? aiSuggestions.places : [])

    if (rawAiList.length > 0) {
      const centerLat = location?.latitude ?? lat ?? 11.2408
      const centerLon = location?.longitude ?? lon ?? -74.2110

      const validAiItems = rawAiList
        .filter(item => item?.name && !isDuplicatePlace(item.name, null) && isQualityTouristPlace(item))
        .slice(0, 6)

      const geocodedAiItems = await Promise.all(
        validAiItems.map(async (item, i) => {
          const geo = await geocodePlace(`${item.name} ${city} ${country}`, centerLat, centerLon).catch(() => null)
          const realLat = (geo && hasUsableCoordinates(geo.latitude, geo.longitude))
            ? geo.latitude
            : (centerLat + (i + 1) * 0.003 * (i % 2 === 0 ? 1 : -1))
          const realLon = (geo && hasUsableCoordinates(geo.latitude, geo.longitude))
            ? geo.longitude
            : (centerLon + (i + 1) * 0.003 * (i % 2 === 0 ? -1 : 1))

          return {
            placeId: `ai-real-${Date.now()}-${i}`,
            name: item.name,
            latitude: realLat,
            longitude: realLon,
            address: geo?.name || `${city}, ${country}`,
            city: geo?.city || city,
            country: geo?.country || country,
            category: item.category || item.type || input.type || 'tourism',
            description: item.description || `Bienvenido a ${item.name}, uno de los puntos imperdibles de ${city}.`,
            reason: item.description || `Atractivo imperdible recomendado para visitar en ${city}.`,
            minutes: 35
          }
        })
      )

      available.push(...geocodedAiItems)
    }

    // 5. Build rich alternative DTOs with REAL geocoded coordinates, unique AI reasons & images for each place
    const candidatePlaces = available.slice(0, 8)
    const placeNames = candidatePlaces.map(p => p.name)
    const [customReasonsMap, richDescriptionsMap] = await Promise.all([
      generateCustomPlaceReasons({
        destination: destination || city,
        city,
        prompt: input.prompt,
        places: placeNames
      }).catch(() => ({})),
      generateRichPlaceDescriptionsBatch({
        destination: destination || city,
        city,
        country,
        places: placeNames
      }).catch(() => ({}))
    ])

    const alternatives = await Promise.all(
      candidatePlaces.map(async (place) => {
        const realLat = place.latitude
        const realLon = place.longitude

        let imageUrl = place.imageUrl || place.images?.[0] || ''
        if (!imageUrl) {
          try {
            imageUrl = await imageForPlace(place.name, city).catch(() => '')
          } catch (e) {
            console.warn('[alternatives] Image fetch error for place:', place.name)
          }
        }
        if (!imageUrl) {
          imageUrl = getReliableCategoryFallbackImage(place.name, place.category)
        }

        const aiReason = customReasonsMap[place.name] || place.reason || null
        const richDesc = richDescriptionsMap[place.name] || place.description || `Explora ${place.name}, una parada imprescindible en ${city} llena de cultura e historia local.`
        return {
          id: place.placeId || place.id || place.name,
          name: place.name,
          latitude: realLat,
          longitude: realLon,
          category: place.category || 'turismo',
          imageUrl,
          description: richDesc,
          reason: buildRecommendationReason(place, { city, country, destination }, aiReason),
          durationMinutes: place.minutes || 30,
          locationInfo: {
            nombre_lugar: place.name,
            direccion: place.address || `${city}, ${country}`,
            ciudad: city,
            region: city,
            pais: country,
            place_id: place.placeId || place.id || '',
            url_mapa: mapUrlFor(realLat, realLon)
          }
        }
      })
    )

    res.json({ alternatives })
  } catch (error) {
    console.error('[alternatives] error:', error)
    res.json({ alternatives: [] })
  }
})

aiRouter.post('/tours/hotels', async (req, res, next) => {
  try {
    const hotelSchema = z.object({
      latitude: z.number(),
      longitude: z.number(),
      budget: z.string().optional().default('moderate')
    })
    const { latitude, longitude, budget } = hotelSchema.parse(req.body)
    
    let hotels = await overpassHotels(latitude, longitude, budget, 15000)
    
    if (!hotels || hotels.length === 0) {
      return res.json({
        hotels: [],
        hasVerifiedResults: false,
        message: 'No se encontraron alojamientos verificados en este radio. Te sugerimos ampliar el radio de búsqueda, cambiar las fechas o modificar tu preferencia de presupuesto.',
        suggestions: [
          'Ampliar radio de búsqueda',
          'Cambiar preferencia de presupuesto',
          'Modificar fechas del viaje'
        ]
      })
    }
    
    hotels.sort((a, b) => {
      const aStars = parseInt(a.stars || '0')
      const bStars = parseInt(b.stars || '0')
      return bStars - aStars
    })

    res.json({
      hotels: hotels.slice(0, 5),
      hasVerifiedResults: true
    })
  } catch (error) {
    next(error)
  }
})

async function processTourBuild(jobId, input, confirmedPlaces, plannerContext) {
  const isSync = !jobId
  const updateJob = (updates) => {
    if (isSync) return
    const job = tourJobs.get(jobId)
    if (job) Object.assign(job, updates)
  }

  try {
    const planner = {
      selectedPlaces: confirmedPlaces.map((p, i) => ({
        ...p,
        placeId: p.id,
        order: i,
        minutes: p.durationMinutes
      })),
      ...plannerContext,
      distanceKm: estimateRouteDistance(confirmedPlaces, null),
      timeProfile: {
        durationHours: input.durationHours,
        stopTarget: confirmedPlaces.length,
        pace: input.touristPace,
        hasProfile: Boolean(input.touristProfileSummary || input.touristInterests.length),
      }
    }

    let aiTour = null
    let aiError = null
    const shouldAskAiPlanner = shouldUseAiPlanner(input, planner)
    try {
      if (!shouldAskAiPlanner) {
        console.info('[tour-ai] ai-planner-skipped (build)')
      } else {
        const dest = input.city || input.destination
        const webSearchResult = await searchWebForTravel({
          city: dest,
          destination: dest,
          country: input.country || '',
          dates: plannerContext?.datesSeason || ''
        }).catch(() => null)

        aiTour = await planWithOpenAI({
          ...input,
          places: planner.selectedPlaces,
          recommendedSchedule: planner.recommendedSchedule,
          timeProfile: planner.timeProfile,
          selectedHotel: plannerContext?.selectedHotel,
          webSearchSummary: webSearchResult?.summary || '',
          userPreferences: plannerContext || {},
          sourceSummary: { location: null, candidateSource: 'user-confirmed', candidateCount: confirmedPlaces.length, selectedCount: confirmedPlaces.length },
        })
      }
    } catch (error) {
      aiError = error
    }

    let sourceTour
    let fallbackReason = null
    if (isValidTourPlan(aiTour) && planner.selectedPlaces.length >= 2) {
      sourceTour = validateTourQuality(aiTour, planner, input)
    } else {
      fallbackReason = 'ai_planner_unavailable'
      sourceTour = await buildFallbackTour(planner, input)
    }
    
    updateJob({ status: 'validating', message: 'Validando estructura y calidad del recorrido...' })
    
    const hasSpecificChatPlaces = Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length > 0 &&
      (planner.selectedPlaces.some(p => p.category === 'requested' || p.tags?.requested_place === 'true') || planner.selectedPlaces.length >= (sourceTour.itinerario?.length || 0))

    const plannedStops = hasSpecificChatPlaces
      ? planner.selectedPlaces
      : (Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length ? sourceTour.itinerario : (sourceTour.stops ?? planner.selectedPlaces))
    const stopsTarget = plannedStops.length > 0 ? plannedStops.length : planner.selectedPlaces.length
    const totalDays = Math.max(1, Number(input.durationDays || Math.ceil(input.durationHours / 24) || 1))
    const settledStops = await Promise.allSettled(
      Array.from({ length: stopsTarget }, (_, index) => {
        const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
        const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
        const sourceDay = sourceStop?.dia ? Number(sourceStop.dia) : (sourceStop?.day ? Number(sourceStop.day) : (anchorPlace?.dia ? Number(anchorPlace.dia) : (anchorPlace?.day ? Number(anchorPlace.day) : null)))
        const calculatedDay = sourceDay || (Math.floor((index * totalDays) / stopsTarget) + 1)
        return normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay)
      })
    )
    const rawStops = settledStops.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
    
    // Preservar estrictamente el orden secuencial cronológico por días
    const seenKeys = new Set()
    const normalizedStops = []
    const hotelNameLower = String(input.selectedHotel?.name || plannerContext?.selectedHotel?.name || '').toLowerCase()
    
    for (const item of rawStops) {
      const name = item.publicStop.nombre
      const nameLower = (item.routeStop?.name || name || '').toLowerCase()
      if (/hotel|hospedaje|resort|hostal|movich/i.test(nameLower) && (nameLower.includes('movich') || (hotelNameLower.length >= 3 && (hotelNameLower.includes(nameLower) || nameLower.includes(hotelNameLower))))) {
        continue
      }
      const itemDay = item.publicStop.dia || 1
      const itemType = getPlaceEntityType(name)
      const nameKey = `${normalizeKey(name)}__${itemType}__d${itemDay}`
      if (!seenKeys.has(nameKey)) {
        seenKeys.add(nameKey)
        normalizedStops.push(item)
      }
    }
    
    const publicStops = normalizedStops.map(s => s.publicStop)
    const routeStops = normalizedStops.map(s => s.routeStop)
    const coverUrl = await imageForPlace(input.city || input.destination, input.country || "").catch(() => fallbackCover(input.destination))
    
    let hotelPuntoEncuentro = null
    const chosenHotel = input.selectedHotel || plannerContext?.selectedHotel
    if (chosenHotel?.name) {
      let hLat = Number(chosenHotel.latitude)
      let hLon = Number(chosenHotel.longitude)
      let hAddr = chosenHotel.tags?.['addr:street'] || chosenHotel.address || ''
      if (!hLat || !hLon || isNaN(hLat) || isNaN(hLon)) {
        const query = `${chosenHotel.name}, ${input.city || input.destination || ''} ${input.country || ''}`.trim()
        const geo = await geocodePlace(query, input.latitude, input.longitude).catch(() => null)
        if (geo?.latitude && geo?.longitude) {
          hLat = geo.latitude
          hLon = geo.longitude
          if (!hAddr && geo.name) hAddr = geo.name
        }
      }
      if (hLat && hLon && !isNaN(hLat) && !isNaN(hLon)) {
        hotelPuntoEncuentro = {
          nombre_lugar: chosenHotel.name,
          direccion: hAddr,
          ciudad: input.city || input.destination || '',
          region: '',
          pais: input.country || '',
          latitud: hLat,
          longitud: hLon,
          place_id: chosenHotel.id?.toString() || '',
          url_mapa: mapUrlFor(hLat, hLon)
        }
      }
    }

    const tour = {
      id: `ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      nombre_tour: sourceTour.nombre_tour ?? sourceTour.title ?? `${input.city || input.destination} VibeTour AI`,
      resumen_corto: sourceTour.resumen_corto ?? 'Experiencia creada a medida.',
      tipo_tour: sourceTour.tipo_tour ?? input.type,
      subcategorias: normalizeList(sourceTour.subcategorias, [typeLabel(input.type)]),
      descripcion_tour: sourceTour.descripcion_tour ?? 'Ruta interactiva creada con IA.',
      experiencia_destacada: sourceTour.experiencia_destacada ?? `Recorrido continuo por ${input.destination}.`,
      historia_del_lugar: sourceTour.historia_del_lugar ?? '',
      contexto_cultural: sourceTour.contexto_cultural ?? '',
      duracion_estimada: sourceTour.duracion_estimada ?? `${input.durationHours} horas`,
      distancia_total: sourceTour.distancia_total ?? `${Number(planner.distanceKm).toFixed(1)} km`,
      nivel_dificultad: sourceTour.nivel_dificultad ?? planner.difficulty,
      idiomas_disponibles: normalizeList(sourceTour.idiomas_disponibles, [input.language]),
      publico_recomendado: normalizeAudience(sourceTour.publico_recomendado, input.type, input.touristInterests),
      mejor_epoca: (sourceTour.mejor_epoca || plannerContext?.datesSeason || planner.bestSeason || 'Todo el año').toString().replace(/\bano\b/gi, 'año'),
      horario_recomendado: sourceTour.horario_recomendado ?? planner.recommendedSchedule,
      punto_encuentro: hotelPuntoEncuentro || normalizeLocationInfo(sourceTour.punto_encuentro, publicStops[0], input),
      imagen_portada: coverUrl,
      galeria_tour: unique([
        ...publicStops.flatMap(s => s.imagenes).filter(img => img && !img.includes('photo-1469854523086') && !img.includes('photo-1507525428034')),
        coverUrl,
        ...normalizeList(sourceTour.galeria_tour, [])
      ]).slice(0, 8),
      itinerario: publicStops,
      orden_paradas: publicStops.map(s => s.nombre),
      incluye: normalizeList(sourceTour.incluye, defaultIncludes(input.type)),
      no_incluye: normalizeList(sourceTour.no_incluye, defaultExcludes()),
      recomendaciones: normalizeList(sourceTour.recomendaciones, defaultRecommendations()),
      que_llevar: normalizeList(sourceTour.que_llevar, defaultWhatToBring(input.type)),
      normas_del_tour: normalizeList(sourceTour.normas_del_tour, defaultRules()),
      etiquetas: normalizeList(sourceTour.etiquetas, ['AI Builder', typeLabel(input.type), input.city || input.destination]),
      palabras_clave: normalizeList(sourceTour.palabras_clave, [input.destination, input.type]),
      categoria_principal: sourceTour.categoria_principal ?? input.type,
      presupuesto_estimado_usd: normalizeBudget(sourceTour.presupuesto_estimado_usd, input),
      informacion_adicional: {
        accesibilidad: sourceTour.informacion_adicional?.accesibilidad ?? planner.accessibility,
        mascotas_permitidas: sourceTour.informacion_adicional?.mascotas_permitidas ?? planner.petsAllowed,
        apto_para_ninos: sourceTour.informacion_adicional?.apto_para_ninos ?? planner.familyFriendly,
        apto_para_adultos_mayores: sourceTour.informacion_adicional?.apto_para_adultos_mayores ?? true,
      },
    }
    
    const route = {
      durationHours: input.durationHours,
      distanceKm: Number(planner.distanceKm),
      stops: routeStops,
    }
    
    if (input.persist && supabase && input.userId) {
      await persistTour(tour, route, input, input.userId)
    }
    updateJob({ status: 'completed', message: 'Tour generado con éxito', tour, route })
    return { tour, route }
  } catch (error) {
    console.error('[tour-ai] fatal process error (build)', error)
    updateJob({ status: 'failed', message: 'Error fatal durante la generación.', error: String(error) })
    if (isSync) throw error
  }
}

async function processTourGeneration(jobId, input) {
  const isSync = !jobId
  const updateJob = (updates) => {
    if (isSync) return
    const job = tourJobs.get(jobId)
    if (job) Object.assign(job, updates)
  }

  try {
    console.info('[tour-ai] generate:start', { jobId: jobId || 'sync', destination: input.destination, city: input.city, country: input.country, durationHours: input.durationHours, type: input.type })
    
    let canonicalDest = input.canonicalDestination
    if (!canonicalDest || !canonicalDest.latitude || !canonicalDest.longitude) {
      const queryParts = [...new Set([input.destination, input.city, input.country].filter(Boolean))]
      canonicalDest = await resolveCanonicalDestination(queryParts.join(', '))
    }

    if (!canonicalDest || !canonicalDest.latitude || !canonicalDest.longitude) {
      const msg = 'No pudimos identificar y validar la ubicación ingresada. Intenta con un nombre de ciudad más específico.'
      updateJob({ status: 'failed', message: msg })
      if (isSync) throw new Error(msg)
      return
    }

    if (canonicalDest.isAmbiguous) {
      const msg = `El destino "${input.destination}" tiene varias coincidencias posibles. Por favor confirma cuál deseas visitar.`
      updateJob({ status: 'ambiguous_destination', message: msg, candidates: canonicalDest.candidates })
      if (isSync) {
        const err = new Error(msg)
        err.isAmbiguous = true
        err.candidates = canonicalDest.candidates
        throw err
      }
      return
    }

    // Anchor input to canonical destination
    input.canonicalDestination = canonicalDest
    input.destination = canonicalDest.displayName
    input.city = canonicalDest.city
    input.country = canonicalDest.country
    input.region = canonicalDest.region

    const location = {
      name: canonicalDest.displayName,
      latitude: canonicalDest.latitude,
      longitude: canonicalDest.longitude,
      city: canonicalDest.city,
      country: canonicalDest.country,
      placeId: canonicalDest.placeId
    }

    console.info('[tour-ai] canonical geocode', { name: location.name, latitude: location.latitude, longitude: location.longitude })

    updateJob({ status: 'selecting_places', message: 'Seleccionando los mejores lugares turísticos...' })
    const candidatePack = await collectTourCandidates(input, location)
    console.info('[tour-ai] candidates', { raw: candidatePack.rawCount, normalized: candidatePack.places.length, source: candidatePack.source, selectedHint: candidatePack.places.slice(0, 5).map((place) => place.name) })
    
    if (!candidatePack.places || candidatePack.places.length === 0) {
      const msg = `No encontramos suficientes lugares de interés válidos en ${canonicalDest.displayName} para generar un tour.`
      updateJob({ status: 'failed', message: msg })
      if (isSync) throw new Error(msg)
      return
    }

    const planner = buildTourPlanner(input, location, candidatePack.places)
    console.info('[tour-ai] planner', { selected: planner.selectedPlaces.length, stopTarget: planner.timeProfile.stopTarget, distanceKm: planner.distanceKm, schedule: planner.recommendedSchedule })

    updateJob({ status: 'generating_narrative', message: 'Creando narración única del tour con IA...' })

    let aiTour = null
    let aiError = null
    const shouldAskAiPlanner = shouldUseAiPlanner(input, planner)
    try {
      if (!shouldAskAiPlanner) {
        console.info('[tour-ai] ai-planner-skipped', { reason: aiPlannerSkipReason(input, planner), durationHours: input.durationHours, selectedPlaces: planner.selectedPlaces.length })
      } else {
        aiTour = await planWithOpenAI({
          ...input,
          places: planner.selectedPlaces,
          recommendedSchedule: planner.recommendedSchedule,
          timeProfile: planner.timeProfile,
          sourceSummary: { location: location ? { latitude: location.latitude, longitude: location.longitude } : null, candidateSource: candidatePack.source, candidateCount: candidatePack.rawCount, selectedCount: planner.selectedPlaces.length },
        })
      }
      console.info('[tour-ai] openai', { ok: true, skipped: !shouldAskAiPlanner, hasItinerary: Array.isArray(aiTour?.itinerario), itinerary: Array.isArray(aiTour?.itinerario) ? aiTour.itinerario.length : 0 })
    } catch (error) {
      aiError = error
      console.warn('[tour-ai] openai-error', { ok: false, message: error?.message ?? String(error) })
    }

    let sourceTour
    let fallbackReason = null
    if (isValidTourPlan(aiTour) && planner.selectedPlaces.length >= 3) {
      sourceTour = validateTourQuality(aiTour, planner, input)
    } else {
      fallbackReason = !aiTour
        ? 'ai_planner_unavailable'
        : !Array.isArray(aiTour?.itinerario)
          ? 'ai_missing_itinerary'
          : aiTour.itinerario.length < 3
            ? 'ai_too_few_stops'
            : planner.selectedPlaces.length < 3
              ? 'too_few_real_candidates'
              : 'unknown_fallback'
      sourceTour = await buildFallbackTour(planner, input)
    }
    console.info('[tour-ai] plan-source', { usedFallback: sourceTour.id?.toString?.()?.startsWith('ai-') ?? false, itinerary: Array.isArray(sourceTour.itinerario) ? sourceTour.itinerario.length : 0, fallbackReason, aiError: aiError ? (aiError.message ?? String(aiError)) : null })
    
    updateJob({ status: 'validating', message: 'Validando estructura y calidad del recorrido...' })
    
    let tour = null
    try {
      const hasSpecificChatPlaces = Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length > 0 &&
        (planner.selectedPlaces.some(p => p.category === 'requested' || p.tags?.requested_place === 'true') || planner.selectedPlaces.length >= (sourceTour.itinerario?.length || 0))

      const plannedStops = hasSpecificChatPlaces
        ? planner.selectedPlaces
        : (Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length ? sourceTour.itinerario : (sourceTour.stops ?? planner.selectedPlaces))
      const stopTarget = plannedStops.length > 0 ? plannedStops.length : Math.min(30, Math.max(3, planner.selectedPlaces.length))
      const totalDays = Math.max(1, Number(input.durationDays || Math.ceil(input.durationHours / 24) || 1))
      
      const plannedPlaceNames = plannedStops.map(p => typeof p === 'string' ? p : (p?.name || p?.nombre || '')).filter(Boolean)
      const richDescriptionsMap = await generateRichPlaceDescriptionsBatch({
        destination: input.destination,
        city: input.city,
        country: input.country,
        places: plannedPlaceNames,
        prompt: input.prompt
      }).catch(() => ({}))

      const assignedUrls = new Set()
      const settledStops = await Promise.allSettled(
        Array.from({ length: stopTarget }, (_, index) => {
          const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
          const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
          const sourceDay = sourceStop?.dia ? Number(sourceStop.dia) : (anchorPlace?.dia ? Number(anchorPlace.dia) : null)
          const calculatedDay = sourceDay || (Math.floor((index * totalDays) / stopTarget) + 1)
          return normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay, {
            descriptionsMap: richDescriptionsMap,
            assignedUrls
          })
        }),
      )
      const rawNormalized = settledStops.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
      
      // Preservar estrictamente el orden secuencial cronológico por días
      const seenKeys = new Set()
      const normalizedStops = []
      const hotelNameLower = String(input.selectedHotel?.name || plannerContext?.selectedHotel?.name || '').toLowerCase()
      
      for (const item of rawNormalized) {
        const name = item.publicStop.nombre
        const nameLower = (item.routeStop?.name || name || '').toLowerCase()
        if (/hotel|hospedaje|resort|hostal|movich/i.test(nameLower) && (nameLower.includes('movich') || (hotelNameLower.length >= 3 && (hotelNameLower.includes(nameLower) || nameLower.includes(hotelNameLower))))) {
          continue
        }
        const itemDay = item.publicStop.dia || 1
        const itemType = getPlaceEntityType(name)
        const nameKey = `${normalizeKey(name)}__${itemType}__d${itemDay}`
        if (!seenKeys.has(nameKey)) {
          seenKeys.add(nameKey)
          normalizedStops.push(item)
        }
      }
      
      const stops = normalizedStops.map((stop) => stop.publicStop)
      const routeStops = normalizedStops.map((stop) => stop.routeStop)
      const coverUrl = await imageForPlace(input.city || input.destination, input.country || "").catch(() => fallbackCover(input.destination))
      tour = {
        id: `ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        nombre_tour: sourceTour.nombre_tour ?? sourceTour.title ?? `${input.city || input.destination} VibeTour AI`,
        resumen_corto:
          sourceTour.resumen_corto ??
          'Experiencia creada para descubrir con una ruta lógica, tiempos realistas y paradas variadas.',
        tipo_tour: sourceTour.tipo_tour ?? input.type,
        subcategorias: normalizeList(sourceTour.subcategorias, [typeLabel(input.type)]),
        descripcion_tour:
          sourceTour.descripcion_tour ??
          sourceTour.description ??
          'Ruta creada por VIBETOURS AI con lugares reales, tiempos sugeridos y orden lógico.',
        experiencia_destacada:
          sourceTour.experiencia_destacada ??
          `Recorrido continuo por puntos clave de ${input.destination}.`,
        historia_del_lugar: sourceTour.historia_del_lugar ?? '',
        contexto_cultural: sourceTour.contexto_cultural ?? '',
        duracion_estimada: sourceTour.duracion_estimada ?? `${input.durationHours} horas`,
        distancia_total:
          sourceTour.distancia_total ??
          `${Number(sourceTour.distanceKm ?? planner.distanceKm).toFixed(1)} km`,
        nivel_dificultad: sourceTour.nivel_dificultad ?? planner.difficulty,
        idiomas_disponibles: normalizeList(sourceTour.idiomas_disponibles, [input.language]),
        publico_recomendado: normalizeAudience(
          sourceTour.publico_recomendado,
          input.type,
          input.touristInterests,
        ),
        mejor_epoca: (sourceTour.mejor_epoca || planner.bestSeason || 'Todo el año').toString().replace(/\bano\b/gi, 'año'),
        horario_recomendado: sourceTour.horario_recomendado ?? planner.recommendedSchedule,
        punto_encuentro: normalizeLocationInfo(sourceTour.punto_encuentro, stops[0], input),
        imagen_portada: sourceTour.imagen_portada ?? sourceTour.coverUrl ?? coverUrl,
        galeria_tour: unique([
          ...stops.flatMap((stop) => stop.imagenes).filter(img => img && !img.includes('photo-1469854523086') && !img.includes('photo-1507525428034')),
          coverUrl,
          ...(normalizeList(sourceTour.galeria_tour, [])),
        ]).slice(0, 8),
        itinerario: stops,
        orden_paradas: stops.map((stop) => stop.nombre),
        incluye: normalizeList(sourceTour.incluye, defaultIncludes(input.type)),
        no_incluye: normalizeList(sourceTour.no_incluye, defaultExcludes()),
        recomendaciones: normalizeList(sourceTour.recomendaciones, defaultRecommendations()),
        que_llevar: normalizeList(sourceTour.que_llevar, defaultWhatToBring(input.type)),
        normas_del_tour: normalizeList(sourceTour.normas_del_tour, defaultRules()),
        etiquetas: normalizeList(sourceTour.etiquetas ?? sourceTour.tags, [
          'AI Planner',
          typeLabel(input.type),
          input.city || input.destination,
        ]),
        palabras_clave: normalizeList(sourceTour.palabras_clave, [
          input.destination,
          input.city,
          input.country,
          input.type,
          ...input.touristInterests,
        ]),
        categoria_principal: sourceTour.categoria_principal ?? input.type,
        presupuesto_estimado_usd: normalizeBudget(sourceTour.presupuesto_estimado_usd, input),
        informacion_adicional: {
          accesibilidad:
            sourceTour.informacion_adicional?.accesibilidad ??
            planner.accessibility,
          mascotas_permitidas:
            sourceTour.informacion_adicional?.mascotas_permitidas ?? planner.petsAllowed,
          apto_para_ninos:
            sourceTour.informacion_adicional?.apto_para_ninos ?? planner.familyFriendly,
          apto_para_adultos_mayores:
            sourceTour.informacion_adicional?.apto_para_adultos_mayores ?? true,
        },
      }
      const route = {
        durationHours: input.durationHours,
        distanceKm: Number(sourceTour.distanceKm ?? planner.distanceKm),
        stops: routeStops,
      }
      if (input.persist && supabase && input.userId) {
        await persistTour(tour, route, input, input.userId)
      }
      updateJob({ status: 'completed', message: 'Tour generado con éxito', tour, route })
      if (isSync) return { tour, route }
    } catch (assemblyError) {
      console.error('[tour-ai] assembly-failed', { message: assemblyError?.message ?? String(assemblyError), fallbackReason, ollamaError: ollamaError ? (ollamaError.message ?? String(ollamaError)) : null })
      const emergencyTour = buildEmergencyTour(input, planner, fallbackReason)
      const emergencyRoute = {
        durationHours: input.durationHours,
        distanceKm: Number(planner.distanceKm),
        stops: emergencyTour.itinerario.map((stop, index) => ({
          name: stop.nombre,
          latitude: planner.selectedPlaces[index]?.latitude ?? 0,
          longitude: planner.selectedPlaces[index]?.longitude ?? 0,
          imageUrl: stop.imagenes?.[0] ?? '',
          description: stop.descripcion,
          activities: stop.actividades,
          tips: stop.consejos,
          suggestedMinutes: minutesFromLabel(stop.duracion_estimada),
        })),
      }
      updateJob({ status: 'completed', message: 'Tour recuperado parcialmente (modo offline)', tour: emergencyTour, route: emergencyRoute })
      if (isSync) return { tour: emergencyTour, route: emergencyRoute }
    }
  } catch (error) {
    console.error('[tour-ai] fatal process error', error)
    updateJob({ status: 'failed', message: 'Error fatal durante la generación.', error: String(error) })
    if (isSync) throw error
  }
}

function buildEmergencyTour(input, planner, fallbackReason = 'unknown') {
  const city = input.city || input.destination || 'Destino'
  const country = input.country || 'Global'
  const templates = typeFallbackLabels(input.type, city)
  const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
  const stops = templates.map((label, index) => ({
    dia: Math.floor((index * totalDays) / templates.length) + 1,
    parada: index + 1,
    nombre: label.name,
    descripcion: `${label.name} funciona como parada de respaldo mientras se recupera la IA.`,
    duracion_estimada: `${25 + (index * 10)} minutos`,
    actividades: buildActivities({ name: label.name }, input.type),
    datos_curiosos: buildCuriousFacts({ name: label.name }, input.type),
    consejos: buildTips({ name: label.name }, input.type),
    ubicacion: {
      nombre_lugar: label.name,
      direccion: city,
      ciudad: city,
      region: '',
      pais: country,
      place_id: `${normalizeKey(label.name)}-fallback`,
      url_mapa: '',
    },
    imagenes: [fallbackCover(label.name)],
  }))
  return {
    id: `ai-emergency-${Date.now()}`,
    nombre_tour: buildTourTitle(input, planner),
    resumen_corto: `${buildShortSummary(input, planner)}. Fallback: respuesta generada sin Ollama.`,
    tipo_tour: input.type,
    subcategorias: planner.subcategorias,
    descripcion_tour: buildTourDescription(input, planner),
    experiencia_destacada: buildFeaturedExperience(input, planner),
    historia_del_lugar: planner.selectedPlaces[0]?.history ?? '',
    contexto_cultural: buildCulturalContext(input, planner),
    duracion_estimada: `${input.durationHours} horas`,
    distancia_total: `${planner.distanceKm.toFixed(1)} km`,
    nivel_dificultad: planner.difficulty,
    idiomas_disponibles: [input.language],
    publico_recomendado: planner.audience,
    mejor_epoca: planner.bestSeason,
    horario_recomendado: planner.recommendedSchedule,
    punto_encuentro: normalizeLocationInfo(null, stops[0], input),
    imagen_portada: fallbackCover(input.destination),
    galeria_tour: stops.flatMap((stop) => stop.imagenes).slice(0, 8),
    itinerario: stops,
    orden_paradas: stops.map((stop) => stop.nombre),
    incluye: defaultIncludes(input.type),
    no_incluye: defaultExcludes(),
    recomendaciones: defaultRecommendations(),
    que_llevar: defaultWhatToBring(input.type),
    normas_del_tour: defaultRules(),
    etiquetas: ['AI Planner', typeLabel(input.type), city],
    palabras_clave: unique([input.destination, input.city, input.country, input.type, ...input.touristInterests]),
    categoria_principal: input.type,
    presupuesto_estimado_usd: normalizeBudget(null, input),
    informacion_adicional: {
      accesibilidad: planner.accessibility,
      mascotas_permitidas: planner.petsAllowed,
      apto_para_ninos: planner.familyFriendly,
      apto_para_adultos_mayores: true,
    },
  }
}

async function buildFallbackTour(planner, input) {
  const coverUrl = planner.selectedPlaces[0]?.imageUrl ?? fallbackCover(input.destination)
  const gallery = unique(planner.selectedPlaces.flatMap((place) => place.images)).slice(0, 8)
  const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
  const stopsPerDay = Math.ceil(planner.selectedPlaces.length / totalDays)

  const itinerary = planner.selectedPlaces.map((place, index) => ({
    dia: Math.floor(index / stopsPerDay) + 1,
    parada: index + 1,
    nombre: place.name,
    descripcion: buildStopDescription(place, input),
    duracion_estimada: `${place.minutes} minutos`,
    actividades: buildActivities(place, input.type),
    datos_curiosos: buildCuriousFacts(place, input.type),
    consejos: buildTips(place, input.type),
    ubicacion: {
      nombre_lugar: place.name,
      direccion: place.address,
      ciudad: place.city ?? input.city ?? '',
      region: place.region ?? '',
      pais: place.country ?? input.country ?? '',
      place_id: place.placeId,
      url_mapa: mapUrlFor(place.latitude, place.longitude),
    },
    imagenes: place.images,
  }))
  return {
    id: `ai-${Date.now()}`,
    nombre_tour: buildTourTitle(input, planner),
    resumen_corto: buildShortSummary(input, planner),
    tipo_tour: input.type,
    subcategorias: planner.subcategorias,
    descripcion_tour: buildTourDescription(input, planner),
    experiencia_destacada: buildFeaturedExperience(input, planner),
    historia_del_lugar: planner.selectedPlaces[0]?.history ?? '',
    contexto_cultural: buildCulturalContext(input, planner),
    duracion_estimada: `${input.durationHours} horas`,
    distancia_total: `${planner.distanceKm.toFixed(1)} km`,
    nivel_dificultad: planner.difficulty,
    idiomas_disponibles: [input.language],
    publico_recomendado: planner.audience,
    mejor_epoca: planner.bestSeason,
    horario_recomendado: planner.recommendedSchedule,
    punto_encuentro: normalizeLocationInfo(null, itinerary[0], input),
    imagen_portada: coverUrl,
    galeria_tour: gallery,
    itinerario: itinerary,
    orden_paradas: itinerary.map((stop) => stop.nombre),
    incluye: defaultIncludes(input.type),
    no_incluye: defaultExcludes(),
    recomendaciones: defaultRecommendations(),
    que_llevar: defaultWhatToBring(input.type),
    normas_del_tour: defaultRules(),
    etiquetas: ['AI Planner', typeLabel(input.type), input.city || input.destination],
    palabras_clave: unique([input.destination, input.city, input.country, input.type, ...input.touristInterests]),
    categoria_principal: input.type,
    presupuesto_estimado_usd: normalizeBudget(null, input),
    informacion_adicional: {
      accesibilidad: planner.accessibility,
      mascotas_permitidas: planner.petsAllowed,
      apto_para_ninos: planner.familyFriendly,
      apto_para_adultos_mayores: true,
    },
  }
}

export function buildTourPlanner(input, location = null, places = []) {
  const origin = location ? { latitude: location.latitude, longitude: location.longitude } : null
  const candidatePlaces = Array.isArray(places) && places.length > 0
    ? places
    : (Array.isArray(input.specificPlaces) && input.specificPlaces.length > 0 ? input.specificPlaces : (Array.isArray(input.selectedPlaces) ? input.selectedPlaces : []))
  const normalized = uniqueByName(
    candidatePlaces.map((place, index) => normalizeCandidate(place, index, input, origin)),
  ).filter((place) => place.name)

  const isCorridorRoute = Boolean(input.originPlace || input.destinationPlace)
  let selectedPlaces = []
  const requestedCount = normalized.filter(p => 
    p.rawTags?.requested_place === 'true' || 
    p.category === 'requested' || 
    (Array.isArray(input.specificPlaces) && input.specificPlaces.some(sp => normalizeKey(sp) === normalizeKey(p.name) || normalizeKey(p.name).includes(normalizeKey(sp)))) ||
    (Array.isArray(input.selectedPlaces) && input.selectedPlaces.some(sp => normalizeKey(sp) === normalizeKey(p.name) || normalizeKey(p.name).includes(normalizeKey(sp))))
  ).length
  const baseStopTarget = stopCountForDuration(input.durationHours)
  const stopTarget = Math.max(baseStopTarget, requestedCount + (input.durationHours >= 48 ? 3 : 1))

  if (isCorridorRoute) {
    const startPlaceCandidate = normalized.find(p => p.rawTags?.start_point === 'true' || p.type === 'start_point' || (input.originPlace && normalizeKey(p.name) === normalizeKey(input.originPlace)))
    const endPlaceCandidate = normalized.find(p => p.rawTags?.end_point === 'true' || p.type === 'end_point' || (input.destinationPlace && normalizeKey(p.name) === normalizeKey(input.destinationPlace)))

    let intermediates = normalized.filter(p => 
      (!startPlaceCandidate || normalizeKey(p.name) !== normalizeKey(startPlaceCandidate.name)) &&
      (!endPlaceCandidate || normalizeKey(p.name) !== normalizeKey(endPlaceCandidate.name)) &&
      isWithinCorridor(p, startPlaceCandidate, endPlaceCandidate)
    )

    if (intermediates.length < 2) {
      intermediates = normalized.filter(p => 
        (!startPlaceCandidate || normalizeKey(p.name) !== normalizeKey(startPlaceCandidate.name)) &&
        (!endPlaceCandidate || normalizeKey(p.name) !== normalizeKey(endPlaceCandidate.name)) &&
        isWithinCorridor(p, startPlaceCandidate, endPlaceCandidate, true)
      )
    }

    if (intermediates.length < 2 && startPlaceCandidate && endPlaceCandidate) {
      const candidatesWithDetour = normalized
        .filter(p => 
          normalizeKey(p.name) !== normalizeKey(startPlaceCandidate.name) &&
          normalizeKey(p.name) !== normalizeKey(endPlaceCandidate.name)
        )
        .map(p => ({
          ...p,
          detourKm: computeDetourDistance(p, startPlaceCandidate, endPlaceCandidate)
        }))
        .sort((a, b) => a.detourKm - b.detourKm)
      
      intermediates = candidatesWithDetour.slice(0, 3)
    }

    const scoredIntermediates = intermediates
      .map(p => ({ ...p, score: scorePlace(p, input) }))
      .sort((a, b) => b.score - a.score)

    const reservedCount = (startPlaceCandidate ? 1 : 0) + (endPlaceCandidate ? 1 : 0)
    const neededIntermediates = Math.max(1, Math.min(scoredIntermediates.length, stopTarget - reservedCount))
    let pickedIntermediates = scoredIntermediates.slice(0, neededIntermediates)

    if (startPlaceCandidate && endPlaceCandidate) {
      pickedIntermediates = orderPlacesAlongRoute(pickedIntermediates, startPlaceCandidate, endPlaceCandidate)
      selectedPlaces = [startPlaceCandidate, ...pickedIntermediates, endPlaceCandidate]
    } else if (startPlaceCandidate) {
      selectedPlaces = [startPlaceCandidate, ...pickedIntermediates]
    } else if (endPlaceCandidate) {
      selectedPlaces = [...pickedIntermediates, endPlaceCandidate]
    } else {
      selectedPlaces = pickedIntermediates
    }
  } else {
    const scored = normalized
      .map((place) => ({
        ...place,
        score: scorePlace(place, input),
      }))

    const refList = (Array.isArray(input.specificPlaces) && input.specificPlaces.length > 0)
      ? input.specificPlaces
      : (Array.isArray(input.selectedPlaces) ? input.selectedPlaces : [])

    const getName = (x) => typeof x === 'string' ? x : (x?.name || '')
    function isPlaceMatching(nameA, nameB) {
      if (!nameA || !nameB) return false
      const keyA = normalizePlaceKey(nameA)
      const keyB = normalizePlaceKey(nameB)
      if (!keyA || !keyB) return false
      if (keyA === keyB) return true
      const typeA = getPlaceEntityType(nameA)
      const typeB = getPlaceEntityType(nameB)
      if (typeA !== 'generic' && typeB !== 'generic' && typeA !== typeB) {
        return false
      }
      const minLen = Math.min(keyA.length, keyB.length)
      const maxLen = Math.max(keyA.length, keyB.length)
      if (minLen >= 4 && (keyA.includes(keyB) || keyB.includes(keyA))) {
        if (minLen / maxLen >= 0.6 || typeA === typeB) {
          return true
        }
      }
      return false
    }

    const requestedPlaces = []
    const otherPlaces = []

    for (const p of scored) {
      const isRequested = p.rawTags?.requested_place === 'true' || 
                          p.category === 'requested' || 
                          (refList.length > 0 && refList.some(sp => isPlaceMatching(p.name, getName(sp))))
      if (isRequested) {
        requestedPlaces.push(p)
      } else {
        otherPlaces.push(p)
      }
    }

    if (requestedPlaces.length >= 1) {
      requestedPlaces.sort((a, b) => {
        const idxA = refList.findIndex(item => isPlaceMatching(a.name, getName(item)))
        const idxB = refList.findIndex(item => isPlaceMatching(b.name, getName(item)))
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
      })

      const totalDays = Math.max(1, Number(input.durationDays || Math.ceil((input.durationHours || 24) / 24) || 1))
      selectedPlaces = requestedPlaces.map((p, i) => {
        // Prioritize exact matchedRef first, then p.dia, then substring match
        const exactRef = refList.find(item => normalizePlaceKey(getName(item)) === normalizePlaceKey(p.name))
        const matchedRef = exactRef || refList.find(item => isPlaceMatching(p.name, getName(item)))
        const dayFromRef = typeof matchedRef === 'object' ? (matchedRef?.day || matchedRef?.dia) : null
        const assignedDay = dayFromRef != null
          ? Number(dayFromRef)
          : (p.dia != null ? Number(p.dia) : (p.day != null ? Number(p.day) : Math.min(totalDays, Math.floor((i * totalDays) / requestedPlaces.length) + 1)))
        return {
          ...p,
          dia: Number(assignedDay),
          day: Number(assignedDay)
        }
      })

      // Ordenar estrictamente por día y dentro del día preservar el orden secuencial exacto del chat
      selectedPlaces.sort((a, b) => {
        const dayDiff = (Number(a.dia || a.day || 1) - Number(b.dia || b.day || 1))
        if (dayDiff !== 0) return dayDiff
        const idxA = refList.findIndex(item => isPlaceMatching(a.name, getName(item)))
        const idxB = refList.findIndex(item => isPlaceMatching(b.name, getName(item)))
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
      })
    } else {
      scored.sort((a, b) => b.score - a.score)
      selectedPlaces = selectPlaces(scored, stopTarget, input)
      if (selectedPlaces.length < Math.min(3, scored.length) && scored.length >= 3) {
        const expanded = scored.filter((place) => !selectedPlaces.some((picked) => normalizeKey(picked.name) === normalizeKey(place.name)))
        selectedPlaces.push(...expanded.slice(0, Math.max(0, Math.min(stopTarget, 3) - selectedPlaces.length)))
      }
    }

    // Filtrar cualquier coincidencia con el hotel/alojamiento para que no aparezca como parada turística
    const hotelName = String(input.selectedHotel?.name || '').toLowerCase()
    if (hotelName && hotelName.length >= 3) {
      selectedPlaces = selectedPlaces.filter(p => {
        const pNameLower = (p.name || '').toLowerCase()
        return !pNameLower.includes(hotelName) && !hotelName.includes(pNameLower)
      })
    }

    const isMultiCityRoute = input.isMultiCity || (Array.isArray(input.cities) && input.cities.length > 1)
    if (isMultiCityRoute && selectedPlaces.length > 1) {
      const firstPlace = selectedPlaces[0]
      const lastPlace = selectedPlaces[selectedPlaces.length - 1]
      let startLoc = location ? { latitude: location.latitude, longitude: location.longitude } : { latitude: firstPlace.latitude, longitude: firstPlace.longitude }
      let endLoc = { latitude: lastPlace.latitude, longitude: lastPlace.longitude }

      if (Array.isArray(input.cities) && input.cities.length > 1) {
        const startCity = input.cities[0]
        const endCity = input.cities[input.cities.length - 1]
        const cityAPlaces = selectedPlaces.filter(p => p.city && normalizeKey(p.city).includes(normalizeKey(startCity)))
        const cityBPlaces = selectedPlaces.filter(p => p.city && normalizeKey(p.city).includes(normalizeKey(endCity)))
        if (cityAPlaces.length > 0) {
          startLoc = { latitude: cityAPlaces[0].latitude, longitude: cityAPlaces[0].longitude }
        }
        if (cityBPlaces.length > 0) {
          endLoc = { latitude: cityBPlaces[cityBPlaces.length - 1].latitude, longitude: cityBPlaces[cityBPlaces.length - 1].longitude }
        }
      }

      selectedPlaces = orderPlacesAlongRoute(selectedPlaces, startLoc, endLoc)
    } else if (selectedPlaces.length > 1 && requestedPlaces.length < 2) {
      const totalDays = Math.max(1, Math.ceil((input.durationHours || 24) / 24))
      if (totalDays <= 1) {
        selectedPlaces = sortPlacesByProximity(selectedPlaces, origin)
      } else {
        const chunkSize = Math.ceil(selectedPlaces.length / totalDays)
        const chunked = []
        for (let d = 0; d < totalDays; d++) {
          const chunk = selectedPlaces.slice(d * chunkSize, (d + 1) * chunkSize)
          if (chunk.length > 0) {
            chunked.push(...sortPlacesByProximity(chunk, d === 0 ? origin : null))
          }
        }
        selectedPlaces = chunked.length > 0 ? chunked : selectedPlaces
      }
    }
  }

  const distanceKm = estimateRouteDistance(selectedPlaces, origin)
  const recommendedSchedule = recommendedScheduleFor(input, selectedPlaces.length)
  const difficulty = input.durationHours <= 3.5
    ? 'Facil'
    : input.durationHours <= 6.5
      ? 'Media'
      : 'Intensa'
  return {
    selectedPlaces: selectedPlaces.map((place, index) => ({
      ...place,
      order: index,
      minutes: estimateStopMinutes(place, input.durationHours, selectedPlaces.length, index),
    })),
    distanceKm,
    recommendedSchedule,
    difficulty,
    bestSeason: bestSeasonFor(input.type, input.datesSeason || input.dates, input.specialEvent),
    audience: audienceFor(input.type, input.touristInterests),
    subcategories: subcategoriesFor(input.type, selectedPlaces),
    accessibility: accessibilityFor(input.type),
    petsAllowed: input.type === 'ecological' || input.type === 'family',
    familyFriendly: input.type !== 'night',
    timeProfile: {
      durationHours: input.durationHours,
      stopTarget,
      pace: input.touristPace,
      hasProfile: Boolean(input?.touristProfileSummary || (Array.isArray(input?.touristInterests) && input.touristInterests.length)),
    },
  }
}

function normalizeCandidate(place, index, input, origin) {
  const name = place.name?.toString().trim() || `${input.destination} parada ${index + 1}`
  const latitude = Number(place.latitude ?? 0)
  const longitude = Number(place.longitude ?? 0)
  const distanceMeters = origin ? haversineMeters(origin.latitude, origin.longitude, latitude, longitude) : 0
  const category = normalizeCategory(place)
  const broadGroup = groupForCategory(category, input.type)
  const tags = normalizeTags(place.tags)
  const images = unique([
    place.imageUrl,
    ...(Array.isArray(place.images) ? place.images : []),
  ].filter(Boolean))
  return {
    name,
    latitude,
    longitude,
    distanceMeters,
    category,
    broadGroup,
    tags,
    rawTags: place.tags || {},
    city: place.city,
    country: place.country,
    region: place.region,
    address: place.address ?? '',
    placeId: place.placeId ?? place.id ?? place.name ?? `${name}-${index}`,
    imageUrl: images[0] ?? '',
    images,
    history: place.history ?? place.description ?? '',
    dia: place.dia != null ? Number(place.dia) : (place.day != null ? Number(place.day) : null),
    day: place.dia != null ? Number(place.dia) : (place.day != null ? Number(place.day) : null),
    score: 0,
  }
}

function scorePlace(place, input) {
  const isRequested = place.rawTags?.requested_place === 'true' || 
                      place.category === 'requested' || 
                      (Array.isArray(input.specificPlaces) && input.specificPlaces.some(sp => normalizeKey(sp) === normalizeKey(place.name) || normalizeKey(place.name).includes(normalizeKey(sp)))) ||
                      (Array.isArray(input.selectedPlaces) && input.selectedPlaces.some(sp => normalizeKey(sp) === normalizeKey(place.name) || normalizeKey(place.name).includes(normalizeKey(sp))))

  if (isRequested) {
    return 10000 // TOP PRIORITY: 100% inclusion for user/chat requested places
  }

  const distanceKm = place.distanceMeters / 1000
  if (distanceKm > 45 && !place.isUserSelected) {
    return -9999
  }
  const typeScore = typeAffinityScore(input.type, place.category, place.name, place.tags)
  const popularityScore = popularityScoreFor(place, input)
  const proximityScore = proximityScoreFor(distanceKm)
  const diversityScore = diversityBoostFor(input.type, place.category, place.name)
  const profileScore = profileScoreFor(input, place)
  const cityScore = importantPlaceScore(place, input)
  const mismatchPenalty = typeMismatchPenalty(input.type, place.category, place.name, input.prompt)
  
  // Penalizar fuertemente lugares genéricos (ej. "Lugar", "Punto turístico")
  let genericPenalty = 0
  if (/^(lugar|punto|sitio|parada|destino) \d+$/i.test(place.name) || place.category === 'place') {
    genericPenalty = 50
  }

  // Detección de prompt general/abierto
  const isGeneral = isGeneralOrOpenPrompt(input)
  
  // Calcular boost por palabras clave del prompt específico
  const themeBoost = isGeneral ? 0 : keywordAffinityScore(input.prompt, place)
  
  let finalScore = 0
  if (isGeneral) {
    // Si es un prompt general, la popularidad turística (wikidata/wikipedia/monumentos) es prioritaria
    const tags = place.rawTags || place.tags
    const wikiBoost = (tags && (tags.wikidata || tags.wikipedia)) ? 30 : 0
    finalScore = (typeScore * 6) + (cityScore * 6) + (popularityScore * 16) + (proximityScore * 2) + (diversityScore * 2) + wikiBoost - mismatchPenalty - genericPenalty
  } else {
    // Si es específico, el boost temático y la afinidad de categoría tienen el mayor peso, 
    // pero la popularidad actúa como criterio de desempate/calidad importante
    finalScore = (typeScore * 8) + (cityScore * 6) + (popularityScore * 8) + (proximityScore * 3) + (diversityScore * 3) + (profileScore * 4) + themeBoost - mismatchPenalty - genericPenalty
  }

  // Special regional boost for the San Bernardo Archipelago islands when the destination is Tolú or Coveñas
  const destClean = normalizeKey(input.destination || input.city || '')
  if (destClean.includes('tolu') || destClean.includes('covenas') || destClean.includes('coveñas')) {
    const placeName = String(place.name || '').toLowerCase()
    const isIslandStop = 
      place.tags?.place === 'island' || 
      place.type === 'island' || 
      /isla|island|mucura|múcura|tintipan|tintipán|palma|san-bernardo|boqueron|boquerón|isleta|faro/i.test(placeName)
      
    if (isIslandStop) {
      finalScore += 45 // Substantial boost to prioritize islands over minor mainland stops
    }
  }

  return finalScore
}

function selectPlaces(scoredPlaces, targetCount, input) {
  const selected = []
  const seen = new Set()

  // 1. ALWAYS include 100% of requested / specific places first!
  for (const place of scoredPlaces) {
    const isRequested = place.rawTags?.requested_place === 'true' || 
                        place.category === 'requested' || 
                        place.score >= 5000
    if (isRequested) {
      const key = normalizeKey(place.name)
      if (!seen.has(key)) {
        selected.push(place)
        seen.add(key)
      }
    }
  }

  // 2. Fill remaining target quota with best contextual matches
  const aligned = scoredPlaces.filter((place) => isAlignedWithTourType(input.type, place.category, place.name))
  const preferredQuota = Math.min(targetCount, Math.max(0, Math.ceil(targetCount * preferredQuotaFor(input.type))))

  while (selected.length < targetCount && seen.size < scoredPlaces.length) {
    let best = null
    let bestScore = -Infinity
    const mustPreferAligned = selected.length < preferredQuota && aligned.some((place) => !seen.has(normalizeKey(place.name)))
    const pool = mustPreferAligned ? aligned : scoredPlaces
    for (const candidate of pool) {
      const key = normalizeKey(candidate.name)
      if (seen.has(key)) continue
      const contextualScore = contextualScoreFor(candidate, selected, input)
      if (contextualScore > bestScore) {
        best = candidate
        bestScore = contextualScore
      }
    }
    if (!best) break
    selected.push(best)
    seen.add(normalizeKey(best.name))
  }
  return selected
}

function contextualScoreFor(candidate, selected, input) {
  let score = candidate.score
  if (!selected.length) return score
  const last = selected[selected.length - 1]
  const lastGroup = last.broadGroup
  const sameCategory = last.category === candidate.category
  const sameGroup = lastGroup === candidate.broadGroup
  const distanceFromLastKm = haversineMeters(last.latitude, last.longitude, candidate.latitude, candidate.longitude) / 1000

  // Detect if the tour is regional or nature-oriented
  const isRegionalOrNature = 
    input.type === 'ecological' || 
    input.type === 'sports' || 
    (input.durationHours && input.durationHours >= 12) ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.prompt || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.destination || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.city || '');

  if (sameCategory) score -= 30
  if (sameGroup) score -= 14
  
  if (isRegionalOrNature) {
    // For regional or nature tours, larger distances are normal and expected
    if (distanceFromLastKm < 3) score += 14
    else if (distanceFromLastKm < 8) score += 8
    else if (distanceFromLastKm > 30) score -= 10
  } else {
    if (distanceFromLastKm < 0.7) score += 14
    else if (distanceFromLastKm < 1.8) score += 8
    else if (distanceFromLastKm > 6) score -= 12
  }

  if (input.durationHours <= 3.5) {
    score -= distanceFromLastKm * 4
  } else if (input.durationHours > 6.5) {
    score += sameGroup ? -3 : 5
  }
  return score
}

function estimateRouteDistance(selectedPlaces, origin) {
  if (!selectedPlaces.length) return 0
  let total = 0
  if (origin) {
    total += haversineMeters(origin.latitude, origin.longitude, selectedPlaces[0].latitude, selectedPlaces[0].longitude)
  }
  for (let index = 1; index < selectedPlaces.length; index += 1) {
    const prev = selectedPlaces[index - 1]
    const current = selectedPlaces[index]
    total += haversineMeters(prev.latitude, prev.longitude, current.latitude, current.longitude)
  }
  return Math.max(1.2, total / 1000)
}

function estimateStopMinutes(place, durationHours, totalStops, index) {
  const totalMinutes = durationHours * 60
  const transitMinutes = Math.max(12, (totalStops - 1) * (durationHours <= 3.5 ? 8 : 12))
  const available = Math.max(35, totalMinutes - transitMinutes)
  const base = available / totalStops
  const emphasis = index === 0 ? 1.15 : index < 2 && durationHours > 4 ? 1.08 : 0.95
  const categoryBoost = ['museum', 'historic', 'attraction', 'market', 'restaurant', 'park', 'nightclub', 'bar'].includes(place.category)
    ? 1.08
    : 1
  const minutes = Math.round(base * emphasis * categoryBoost)
  return clamp(minutes, durationHours <= 3.5 ? 20 : 25, durationHours >= 8 ? 70 : 55)
}

function recommendedScheduleFor(input, stopCount) {
  const start = input.type === 'night'
    ? 19 * 60
    : input.type === 'ecological'
      ? 8 * 60 + 30
      : 9 * 60
  const end = start + Math.round((input.durationHours * 60) + Math.max(0, (stopCount - 1) * 10))
  return `${formatTime(start)} - ${formatTime(end)}`
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function stopCountForDuration(durationHours) {
  if (durationHours <= 3.5) return 3
  if (durationHours <= 5.5) return 4
  if (durationHours <= 7) return 5
  if (durationHours <= 10) return 6
  if (durationHours <= 24) return 8
  if (durationHours <= 48) return 12
  if (durationHours <= 72) return 16
  return 20
}

function normalizeCategory(place) {
  const category = String(place.category ?? place.type ?? '').toLowerCase()
  const name = String(place.name ?? '').toLowerCase()
  const tags = normalizeTags(place.tags)
  const merged = (category + ' ' + name + ' ' + tags.join(' ')).toLowerCase()
  if (/(stadium|sports_centre|sport|pitch|arena|track|fitness|cancha|estadio|deporte|running|ciclismo)/.test(merged)) return 'sports'
  if (/(museum|gallery|arts? centre|art|museo|galeria)/.test(merged)) return 'museum'
  if (/(marketplace|market|mercado|plaza de mercado)/.test(merged)) return 'market'
  if (/(restaurant|restaurante|food|comida|ceviche|arepa|cocina|bistro|bakery|panaderia)/.test(merged)) return 'restaurant'
  if (/(cafe|coffee|cafeteria)/.test(merged)) return 'cafe'
  if (/(bar|pub|nightclub|discoteca|terraza|rooftop)/.test(merged)) return 'nightlife'
  if (/(park|garden|reserve|nature|trail|forest|beach|viewpoint|parque|jardin|sendero|playa|mirador|malecon|river|rio)/.test(merged)) return merged.includes('viewpoint') || merged.includes('mirador') ? 'viewpoint' : merged.includes('trail') || merged.includes('sendero') ? 'trail' : 'nature'
  if (/(zoo|aquarium|playground|family|children|ninos|infantil)/.test(merged)) return 'family'
  if (/(church|cathedral|mosque|temple|catedral|iglesia)/.test(merged)) return 'religious'
  if (/(historic|monument|memorial|ruins|castle|archaeological|heritage|monumento|histori|patrimonio|plaza)/.test(merged)) return 'historic'
  return category || 'place'
}

function groupForCategory(category, type) {
  if (['museum', 'historic', 'religious'].includes(category)) return 'heritage'
  if (['restaurant', 'cafe', 'market'].includes(category)) return 'food'
  if (['sports'].includes(category)) return 'sports'
  if (['nature', 'viewpoint', 'trail'].includes(category)) return 'nature'
  if (['nightlife'].includes(category)) return 'night'
  if (['family'].includes(category)) return 'family'
  if (type === 'night') return 'night'
  if (type === 'gastronomic') return 'food'
  if (type === 'ecological') return 'nature'
  if (type === 'historical') return 'heritage'
  return 'urban'
}

function typeAffinityScore(type, category, name, tags = []) {
  const text = (category + ' ' + name + ' ' + (Array.isArray(tags) ? tags.join(' ') : '')).toLowerCase()
  const rules = {
    historical: ['museum', 'historic', 'religious', 'heritage', 'monument', 'memorial', 'plaza', 'catedral'],
    gastronomic: ['restaurant', 'cafe', 'market', 'food', 'bakery', 'bar', 'mercado', 'cocina', 'restaurante'],
    ecological: ['nature', 'park', 'trail', 'viewpoint', 'forest', 'beach', 'reserve', 'malecon', 'rio'],
    night: ['nightlife', 'bar', 'pub', 'nightclub', 'event', 'theatre', 'terraza', 'rooftop'],
    family: ['family', 'park', 'museum', 'zoo', 'aquarium', 'playground', 'plaza'],
    cultural: ['museum', 'historic', 'gallery', 'theatre', 'monument', 'plaza', 'carnaval', 'catedral'],
    urban: ['historic', 'museum', 'viewpoint', 'market', 'square', 'plaza', 'malecon', 'avenida'],
    romantic: ['viewpoint', 'cafe', 'park', 'beach', 'garden', 'malecon'],
    sports: ['sports', 'stadium', 'arena', 'pitch', 'track', 'park', 'trail', 'beach', 'estadio'],
    custom: ['museum', 'historic', 'market', 'park', 'viewpoint'],
  }
  return scoreFromTerms(text, rules[type] ?? rules.custom, 10)
}

function isGeneralOrOpenPrompt(input) {
  const prompt = (input.prompt || '').trim().toLowerCase()
  
  // Si no hay prompt o es muy corto, es abierto
  if (!prompt || prompt.length < 12) {
    return true
  }
  
  // Lista de términos genéricos
  const genericTerms = [
    'pasar un buen rato', 'conocer la ciudad', 'caminar', 'turismo', 'viaje', 'hacer turismo',
    'ver cosas', 'dar una vuelta', 'explorar', 'lo mejor de', 'lo mas popular', 'lo más popular',
    'sitios importantes', 'puntos de interes', 'puntos de interés', 'que ver', 'visitar', 'que hacer',
    'tour general', 'tour basico', 'tour básico', 'todo un poco', 'pasear', 'dar un paseo',
    'conocer un poco', 'sitios emblematicos', 'sitios emblemáticos', 'atracciones principales',
    'have a good time', 'explore', 'sightseeing', 'general tour', 'best of', 'popular places',
    'tourist spots', 'top things', 'things to do', 'visit', 'walk around', 'stroll'
  ]
  
  // Si coincide con alguna frase genérica o abierta
  if (genericTerms.some(term => prompt.includes(term))) {
    return true
  }
  
  // Si no hay intereses definidos y el prompt no contiene palabras clave específicas de categorías
  const specificKeywords = [
    'cafe', 'café', 'coffee', 'museo', 'museum', 'gallery', 'galeria', 'galería', 'restaurante',
    'restaurant', 'food', 'comida', 'gastronomi', 'bar', 'pub', 'discoteca', 'club', 'nightlife',
    'rumba', 'cerveza', 'beer', 'parque', 'park', 'nature', 'naturaleza', 'playa', 'beach',
    'sender', 'trail', 'hike', 'deporte', 'sport', 'stadium', 'estadio', 'compras', 'shopping',
    'mall', 'tienda', 'shop', 'iglesia', 'church', 'catedral', 'cathedral', 'templo', 'temple',
    'historico', 'histórico', 'monument', 'monumento', 'castillo', 'castle', 'teatro', 'theatre',
    'concierto', 'concert'
  ]
  
  const hasSpecificKeyword = specificKeywords.some(keyword => prompt.includes(keyword))
  const hasInterests = input.touristInterests && input.touristInterests.length > 0
  
  if (!hasSpecificKeyword && !hasInterests) {
    return true
  }
  
  return false
}

function keywordAffinityScore(promptText, place) {
  if (!promptText || promptText.length < 3) return 0
  
  const cleanPrompt = promptText.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // quitar puntuación
    .trim()
  
  // Ignorar palabras comunes (stop words) en español e inglés
  const stopWords = new Set([
    'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'un', 'una', 'para', 'con', 'no', 'por', 'lo', 'como', 'mas', 'más',
    'que', 'quiero', 'gustaria', 'gustaría', 'quisiera', 'visitar', 'conocer', 'ir', 'ver', 'tour', 'ruta', 'viaje', 'ciudad',
    'the', 'of', 'in', 'and', 'to', 'a', 'for', 'with', 'on', 'at', 'by', 'an', 'i', 'want', 'like', 'visit', 'know', 'go', 'see', 'trip', 'city'
  ])
  
  const words = cleanPrompt.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word))
  if (words.length === 0) return 0
  
  const name = String(place.name || '').toLowerCase()
  const category = String(place.category || '').toLowerCase()
  const tags = place.rawTags || place.tags
  const tagsText = Array.isArray(tags) ? tags.join(' ') : (tags ? Object.values(tags).join(' ') : '')
  const placeText = `${name} ${category} ${tagsText}`.toLowerCase()
  
  let matches = 0
  for (const word of words) {
    if (placeText.includes(word)) {
      matches += 1
    }
    // Mapeo inteligente de sinónimos semánticos
    if ((word.startsWith('gastronom') || word === 'comer' || word === 'comida' || word === 'rico' || word === 'cena' || word === 'almuerzo') && 
        (category === 'restaurant' || category === 'cafe' || category === 'market')) {
      matches += 1.5
    }
    if ((word === 'cafe' || word === 'café' || word === 'coffee' || word === 'desayuno') && category === 'cafe') {
      matches += 1.5
    }
    if ((word === 'museo' || word === 'museum' || word === 'arte' || word === 'historia' || word === 'cultura') && 
        (category === 'museum' || category === 'historic')) {
      matches += 1.5
    }
    if ((word === 'parque' || word === 'park' || word === 'naturaleza' || word === 'verde' || word === 'bosque') && 
        (category === 'nature' || category === 'viewpoint')) {
      matches += 1.5
    }
    if ((word === 'isla' || word === 'islas' || word === 'island' || word === 'islands' || word === 'archipielago' || word === 'archipiélago' || word === 'cayo' || word === 'cayos') && 
        (place.tags?.place === 'island' || place.type === 'island' || place.category === 'nature' || /isla|island|mucura|múcura|tintipan|tintipán|palma|san-bernardo|boqueron|boquerón|isleta|faro/i.test(name))) {
      matches += 3.0
    }
    if ((word === 'playa' || word === 'playas' || word === 'beach' || word === 'beaches' || word === 'mar' || word === 'sea' || word === 'costa' || word === 'coast') && 
        (place.tags?.natural === 'beach' || place.type === 'beach' || /playa|beach|coveñas|morrosquillo|punta|bello/i.test(name))) {
      matches += 2.0
    }
  }
  
  return matches * 30
}

function popularityScoreFor(place, input = {}) {
  const name = String(place.name || '').toLowerCase()
  const category = String(place.category || '').toLowerCase()
  const text = (category + ' ' + name).toLowerCase()
  let score = 3
  
  if (text.includes('museum')) score += 8
  if (text.includes('historic') || text.includes('heritage') || text.includes('archaeological')) score += 8
  if (text.includes('monument') || text.includes('memorial') || text.includes('castle') || text.includes('fortress') || text.includes('alcazar')) {
    score += input.type === 'gastronomic' || input.type === 'sports' ? 0 : 8
  }
  if (text.includes('palace') || text.includes('palacio') || text.includes('basilica') || text.includes('basílica') || text.includes('catedral') || text.includes('cathedral')) {
    score += 8
  }
  if (text.includes('market') || text.includes('marketplace')) score += 6
  if (text.includes('park') || text.includes('viewpoint') || text.includes('nature_reserve') || text.includes('mirador')) score += 6
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('coffee')) score += 3
  if (text.includes('sports') || text.includes('stadium') || text.includes('arena')) score += 5
  if (text.includes('nightclub') || text.includes('bar') || text.includes('pub')) score += 3

  // Mayor peso para etiquetas turísticas principales de OSM
  const tags = place.rawTags || place.tags
  if (tags && typeof tags === 'object' && !Array.isArray(tags)) {
    const tourism = String(tags.tourism || '').toLowerCase()
    const historic = String(tags.historic || '').toLowerCase()
    if (['museum', 'gallery', 'theme_park', 'attraction', 'aquarium', 'zoo', 'viewpoint'].includes(tourism)) {
      score += 10
    }
    if (['monument', 'castle', 'fort', 'archaeological_site', 'ruins', 'city_gate'].includes(historic)) {
      score += 10
    }
    if (tags.heritage) {
      score += 8
    }
    // Boost masivo si tiene wikidata o wikipedia (indicador clave de POI icónico)
    if (tags.wikidata || tags.wikipedia) {
      score += 20
    }
  }
  
  return clamp(score, 1, 40)
}

function proximityScoreFor(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 5
  if (distanceKm <= 0.5) return 10
  if (distanceKm <= 1.5) return 8
  if (distanceKm <= 3) return 5
  if (distanceKm <= 6) return 2
  return -Math.min(8, distanceKm)
}

function diversityBoostFor(type, category, name) {
  const text = `${type} ${category} ${name}`.toLowerCase()
  if (type === 'historical' && /museum|historic|religious/.test(text)) return 6
  if (type === 'gastronomic' && /restaurant|cafe|market/.test(text)) return 6
  if (type === 'ecological' && /park|nature|trail|viewpoint/.test(text)) return 6
  if (type === 'night' && /bar|nightlife|nightclub|event/.test(text)) return 6
  if (type === 'family' && /family|park|museum|zoo|aquarium/.test(text)) return 6
  if (type === 'cultural' && /museum|historic|gallery|theatre|square/.test(text)) return 5
  return 1
}

function preferredQuotaFor(type) {
  if (['gastronomic', 'sports', 'ecological', 'night'].includes(type)) return 0.75
  if (['family', 'romantic'].includes(type)) return 0.6
  return 0.45
}

function isAlignedWithTourType(type, category, name) {
  const text = (category + ' ' + name).toLowerCase()
  const aligned = {
    gastronomic: /restaurant|cafe|market|food|bakery|bar|mercado|cocina|restaurante/,
    sports: /sports|stadium|arena|pitch|track|park|trail|beach|estadio|cancha/,
    ecological: /nature|park|trail|viewpoint|forest|beach|reserve|malecon|rio/,
    night: /nightlife|bar|pub|nightclub|theatre|terraza|rooftop/,
    family: /family|park|museum|zoo|aquarium|playground|plaza/,
    romantic: /viewpoint|cafe|park|beach|garden|malecon/,
    historical: /museum|historic|religious|heritage|monument|memorial|plaza|catedral/,
    cultural: /museum|historic|gallery|theatre|monument|plaza|carnaval|catedral/,
    urban: /historic|museum|viewpoint|market|plaza|malecon|avenida|square/,
  }
  return (aligned[type] ?? /museum|historic|market|park|viewpoint/).test(text)
}

function typeMismatchPenalty(type, category, name, promptText = '') {
  const text = (category + ' ' + name).toLowerCase()
  const cleanPrompt = String(promptText || '').toLowerCase()
  
  if (type === 'gastronomic' && /historic|monument|memorial|religious|museum/.test(text)) return 180
  if (type === 'sports' && /historic|monument|memorial|religious|museum/.test(text)) return 180
  if (type === 'ecological' && /restaurant|cafe|bar|nightlife|monument/.test(text)) {
    // If the user explicitly asks for food/gastronomy in their prompt, do not penalize food options
    if (/comida|comer|gastronom|restaurante|cafe|cena|almuerzo|plato|probar/i.test(cleanPrompt) && /restaurant|cafe/.test(text)) {
      return 0
    }
    // If it's a coastal/island spot that happens to be tagged as restaurant/bar, reduce penalty
    if (/playa|beach|isla|island|cayo|mucura|múcura|tintipan|tintipán|palma|punta|faro/i.test(text)) {
      return 20
    }
    return 140
  }
  if (type === 'night' && /museum|religious|trail/.test(text)) return 140
  return 0
}

function importantPlaceScore(place, input) {
  const city = normalizeKey(input.city || input.destination)
  const text = normalizeKey(place.name)
  const catalog = {
    cartagena: ['torre-del-reloj', 'san-felipe', 'murallas', 'getsemani', 'santo-domingo', 'museo-del-oro', 'catedral', 'plaza-de-los-coches', 'blas-de-lezo', 'india-catalina'],
    barranquilla: ['plaza-de-la-paz', 'catedral', 'paseo-bolivar', 'antigua-aduana', 'museo-del-caribe', 'barrio-abajo', 'casa-del-carnaval', 'gran-malecon', 'ventana-al-mundo', 'cumbia', 'edgar-renteria'],
    'santa-marta': ['parque-de-los-novios', 'catedral', 'parque-bolivar', 'museo-del-oro', 'malecon', 'quinta-de-san-pedro', 'taganga', 'rodadero'],
    cali: ['san-antonio', 'gato-del-rio', 'ermita', 'bulevar-del-rio', 'plazoleta-jairo-varela', 'museo-la-tertulia'],
    medellin: ['plaza-botero', 'pueblito-paisa', 'parque-explora', 'jardin-botanico', 'comuna-13', 'parque-berrio'],
    bogota: ['plaza-de-bolivar', 'museo-del-oro', 'monserrate', 'la-candelaria', 'chorrorro-de-quevedo', 'botero'],
  }
  const keys = Object.keys(catalog).filter((key) => city.includes(key) || key.includes(city))
  const matches = keys.flatMap((key) => catalog[key]).filter((term) => text.includes(term))
  return clamp(matches.length * 4, 0, 10)
}

function profileScoreFor(input, place) {
  const summary = `${input?.touristProfileSummary || ''} ${(Array.isArray(input?.touristInterests) ? input.touristInterests : []).join(' ')}`.toLowerCase()
  if (!summary.trim()) return 0
  const terms = {
    historia: ['historic', 'museum', 'heritage', 'monument', 'religious'],
    cultura: ['museum', 'gallery', 'historic', 'theatre'],
    comida: ['restaurant', 'cafe', 'market', 'food', 'bakery'],
    naturaleza: ['park', 'nature', 'trail', 'viewpoint', 'beach'],
    noche: ['bar', 'nightlife', 'nightclub', 'event'],
    familia: ['family', 'park', 'museum', 'zoo', 'aquarium'],
  }
  let score = 0
  for (const [key, list] of Object.entries(terms)) {
    if (summary.includes(key) && list.some((term) => `${place.category} ${place.name}`.toLowerCase().includes(term))) {
      score += 3
    }
  }
  return score
}

function bestSeasonFor(type, datesSeason = null, specialEvent = null) {
  if (specialEvent && typeof specialEvent === 'string' && specialEvent.trim().length > 0) {
    return datesSeason ? `${datesSeason} (${specialEvent})` : `Temporada de ${specialEvent}`
  }
  if (datesSeason && typeof datesSeason === 'string' && datesSeason.trim().length > 0) {
    return datesSeason.trim()
  }
  switch (type) {
    case 'ecological':
      return 'Temporada seca o clima estable'
    case 'night':
      return 'Todo el año, preferiblemente fines de semana'
    case 'gastronomic':
      return 'Todo el año'
    default:
      return 'Todo el año'
  }
}

function audienceFor(type, interests = []) {
  const base = ['Viajeros curiosos', 'Parejas']
  if (type === 'family') return ['Familias', 'Viajeros curiosos', ...base]
  if (type === 'night') return ['Adultos', 'Parejas', 'Grupos de amigos']
  if (type === 'gastronomic') return ['Foodies', 'Parejas', 'Grupos de amigos']
  if (type === 'ecological') return ['Amantes de la naturaleza', 'Parejas', 'Viajeros activos']
  if (Array.isArray(interests) && interests.length) return ['Viajeros curiosos', ...interests.slice(0, 3)]
  return base
}

function subcategoriesFor(type, selectedPlaces) {
  const categories = unique(selectedPlaces.map((place) => place.category))
  const labels = [typeLabel(type), ...categories.map((category) => categoryLabel(category))]
  return unique(labels).filter(Boolean)
}

function accessibilityFor(type) {
  if (type === 'ecological') return 'Verificar tramos de sendero y desnivel antes de reservar.'
  if (type === 'night') return 'Comprobar restricciones de acceso por edad y horarios.'
  if (type === 'family') return 'Ideal para carritos y pausas frecuentes segun la sede.'
  return 'Consultar accesibilidad exacta en cada parada.'
}

function buildTourTitle(input, planner) {
  const city = cleanAdministrativeCityName(input.city || input.destination || 'Destino')
  const labels = {
    historical: 'Histórico por',
    gastronomic: 'Sabores de',
    ecological: 'Ruta Verde por',
    night: 'Nocturno por',
    family: 'Familiar por',
    cultural: 'Cultural por',
    romantic: 'Romántico por',
    sports: 'Activo por',
    urban: 'Urbano por',
    custom: 'Personalizado por',
  }
  const prefix = labels[input.type] || 'Personalizado por'
  return `Tour ${prefix} ${city}`.replace(/\s+/g, ' ').trim()
}

function buildShortSummary(input, planner) {
  return `Tour ${typeLabel(input.type)} con ${planner.selectedPlaces.length} paradas seleccionadas por distancia, relevancia y variedad.`
}

function buildTourDescription(input, planner) {
  const city = input.city || input.destination
  const country = input.country ? ', ' + input.country : ''
  const places = planner.selectedPlaces.slice(0, 5).map((place) => place.name).join(', ')
  const mode = {
    historical: 'patrimonio, plazas, iglesias, museos y memoria urbana',
    gastronomic: 'mercados, cafeterias, restaurantes, dulces, bebidas locales y conversaciones alrededor de la mesa',
    ecological: 'parques, malecones, miradores, senderos suaves y espacios para respirar el paisaje',
    night: 'terrazas, bares, musica, calles iluminadas y puntos seguros para vivir la ciudad despues del atardecer',
    family: 'espacios abiertos, museos faciles de recorrer y paradas educativas con descansos comodos',
    cultural: 'historia local, arquitectura, arte popular, plazas vivas y simbolos urbanos',
    sports: 'escenarios deportivos, parques activos, zonas para caminar y lugares ligados al orgullo deportivo local',
    urban: 'calles representativas, plazas, edificios publicos, malecones y contrastes cotidianos',
    romantic: 'miradores, cafes, plazas tranquilas y rincones pensados para caminar sin prisa',
  }[input.type] ?? 'paradas autenticas, bien conectadas y culturalmente relevantes'
  return 'Este recorrido por ' + city + country + ' esta disenado para sentirse como un tour completo y no como una lista suelta de puntos en el mapa. Durante ' + input.durationHours + ' horas, la ruta combina ' + mode + ', manteniendo un orden logico para reducir traslados innecesarios y aprovechar mejor cada parada. El itinerario toma como base lugares reales cercanos al destino seleccionado y prioriza puntos reconocibles de la ciudad antes de sumar experiencias complementarias. Entre las paradas destacadas aparecen ' + (places || input.destination) + ', articuladas para que el viajero entienda que puede ver, hacer, probar o fotografiar en cada lugar. La experiencia busca parecerse a un tour guiado profesional: empieza con un punto de referencia claro, desarrolla una narrativa segun el tipo de tour y cierra con recomendaciones practicas para disfrutar el recorrido con seguridad y buen ritmo.'
}

function buildFeaturedExperience(input, planner) {
  const first = planner.selectedPlaces[0]?.name ?? input.destination
  const second = planner.selectedPlaces[1]?.name
  if (second) return `${first} y ${second} como eje narrativo del recorrido.`
  return `Recorrido guiado por ${first}.`
}

function buildCulturalContext(input, planner) {
  if (input.type === 'historical') return 'Se prioriza patrimonio, memoria urbana y contexto de origen.'
  if (input.type === 'gastronomic') return 'Se enfoca en cocina local, mercados y habitos cotidianos.'
  if (input.type === 'ecological') return 'Se destaca el valor ambiental, paisajistico y de conservacion.'
  if (input.type === 'night') return 'Se mezcla cultura nocturna, movilidad segura y puntos de ambiente local.'
  if (input.type === 'family') return 'Se enfoca en experiencias inclusivas, educativas y seguras para todos.'
  return `Ruta adaptada a ${planner.selectedPlaces.length} puntos de interes con narrativa local.`
}

function getDeterministicIndex(seed, length) {
  if (!seed || length <= 0) return 0
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Math.abs(hash) % length
}

function selectDeterministic(array, seed) {
  if (!Array.isArray(array) || array.length === 0) return ''
  const index = getDeterministicIndex(seed, array.length)
  return array[index]
}

function buildStopDescription(place, input) {
  const seed = place.name || ''
  const action = stopActionFor(input.type, place.category, seed)
  const focus = stopFocusFor(input.type, place.category, seed)
  
  // Obtener información real del lugar si está disponible en history, tags o descriptions
  let realDetail = ''
  if (place.history && place.history.trim().length > 10) {
    realDetail = place.history.trim()
  } else if (place.rawTags?.description && place.rawTags.description.trim().length > 10) {
    realDetail = place.rawTags.description.trim()
  } else {
    realDetail = buildRecommendationReason(place, input.type)
  }

  // Asegurar que termine en punto si no lo tiene
  if (realDetail && !/[.!?]$/.test(realDetail)) {
    realDetail += '.'
  }

  // Construir consejos personalizados para esta parada
  const stopTips = buildTips(place, input.type)
  let tipsText = ''
  if (stopTips && stopTips.length > 0) {
    tipsText = ` Como consejo para tu parada: ${stopTips[0]}.`
    if (stopTips[1]) {
      tipsText += ` También te recomendamos ${stopTips[1].toLowerCase()}.`
    }
  }

  const templates = [
    `${place.name} es un sitio ideal para ${action}. Durante el recorrido, te sugerimos enfocar tu atención en ${focus}. ${realDetail}${tipsText}`,
    `Te recomendamos visitar ${place.name}, un espacio excelente para ${action}. En esta parada, te sugerimos centrarte en ${focus}. ${realDetail}${tipsText}`,
    `${place.name} te ofrece la oportunidad perfecta para ${action}. Durante tu estancia, es ideal prestar atención a ${focus}. ${realDetail}${tipsText}`,
    `Una parada clave en nuestro itinerario es ${place.name}, donde podrás ${action}. Te aconsejamos enfocar tu visita en ${focus}. ${realDetail}${tipsText}`,
    `Explora ${place.name}, un lugar destacado para ${action}. Aprovecha para centrar tu atención en ${focus}. ${realDetail}${tipsText}`
  ]

  return selectDeterministic(templates, seed)
}

function buildActivities(place, type) {
  const byType = {
    historical: ['Recorrer el entorno con foco en arquitectura y memoria', 'Identificar detalles de epoca, placas o esculturas', 'Tomar fotografias desde angulos amplios', 'Comparar el lugar con la siguiente parada de la ruta'],
    gastronomic: ['Probar una especialidad local o bebida tradicional', 'Preguntar por ingredientes de temporada', 'Comparar sabores entre paradas', 'Observar la dinamica del mercado o local'],
    ecological: ['Caminar a ritmo suave', 'Observar paisaje, sombra, agua o vegetacion', 'Hacer una pausa para hidratacion', 'Registrar fotos sin salirse de las zonas permitidas'],
    night: ['Explorar el ambiente nocturno de forma segura', 'Elegir una bebida o snack local', 'Escuchar musica o actividad del entorno', 'Confirmar horarios antes de permanecer mas tiempo'],
    family: ['Hacer una pausa comoda para el grupo', 'Buscar una actividad educativa o visual', 'Tomar fotos familiares', 'Verificar banos, sombra y zonas de descanso'],
    sports: ['Caminar o trotar un tramo corto si el espacio lo permite', 'Reconocer la historia deportiva del lugar', 'Tomar fotos del escenario o del entorno activo', 'Hacer una pausa de hidratacion'],
    cultural: ['Leer el espacio desde su historia local', 'Fotografiar arquitectura, arte o vida cotidiana', 'Conversar sobre tradiciones del barrio', 'Conectar la parada con el relato general del tour'],
  }
  return byType[type] ?? ['Explorar el lugar con calma', 'Tomar fotografias', 'Leer senales o placas del entorno', 'Preparar la siguiente parada']
}

function buildCuriousFacts(place, type) {
  const label = typeLabel(type).toLowerCase()
  return unique([
    place.name + ' fue elegido porque aporta valor ' + label + ' al recorrido, no solo por estar cerca en el mapa.',
    'Esta parada ayuda a variar el ritmo del tour y evita que todas las visitas sean del mismo tipo.',
    'Su categoria principal es ' + (categoryLabel(place.category || 'place') || 'Punto local') + ', por eso cumple una funcion especifica dentro de la ruta.',
  ]).slice(0, 3)
}

const CATEGORY_IMAGE_POOLS = {
  beach_island: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop',
  ],
  historic: [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&auto=format&fit=crop',
  ],
  nature: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop',
  ],
  gastronomy: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop',
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-ce74f458149e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
  ],
  general: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop',
  ]
}

export function getReliableCategoryFallbackImage(name = '', category = '') {
  const normCat = (category || '').toLowerCase()
  const normName = (name || '').toLowerCase()

  let poolKey = 'general'
  if (normCat.includes('beach') || normCat.includes('island') || normCat.includes('playa') || normCat.includes('isla') || normName.includes('isla') || normName.includes('cayo') || normName.includes('playa') || normName.includes('bahia')) {
    poolKey = 'beach_island'
  } else if (normCat.includes('historic') || normCat.includes('museum') || normCat.includes('church') || normCat.includes('monument') || normName.includes('catedral') || normName.includes('museo') || normName.includes('castillo') || normName.includes('plaza')) {
    poolKey = 'historic'
  } else if (normCat.includes('nature') || normCat.includes('park') || normCat.includes('garden') || normName.includes('parque') || normName.includes('jardin') || normName.includes('bosque')) {
    poolKey = 'nature'
  } else if (normCat.includes('restaurant') || normCat.includes('cafe') || normCat.includes('gastronomy') || normName.includes('restaurante') || normName.includes('mercado') || normName.includes('bar')) {
    poolKey = 'gastronomy'
  } else if (normCat.includes('viewpoint') || normCat.includes('mirador') || normName.includes('mirador') || normName.includes('malecon')) {
    poolKey = 'viewpoint'
  }

  const pool = CATEGORY_IMAGE_POOLS[poolKey] || CATEGORY_IMAGE_POOLS.general
  const seed = (name + category).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return pool[seed % pool.length]
}

export function buildRecommendationReason(place, input = {}, aiReason = null) {
  if (aiReason && typeof aiReason === 'string' && aiReason.trim().length > 10) {
    return aiReason.trim()
  }

  const category = place.category || place.type || 'place'
  const placeName = place.name || ''
  const city = input.city || input.destination || 'este destino'
  const isStart = place.rawTags?.start_point === 'true' || place.type === 'start_point'
  const isEnd = place.rawTags?.end_point === 'true' || place.type === 'end_point'

  if (isStart) {
    return `Punto de encuentro y partida seleccionado estratégicamente para dar inicio a tu recorrido por ${city}.`
  }

  if (isEnd) {
    return `Broche de oro y punto culminante elegido para cerrar con una experiencia memorable tu visita a ${city}.`
  }

  const normCat = category.toLowerCase()
  const normName = placeName.toLowerCase()

  if (normCat.includes('island') || normCat.includes('beach') || normName.includes('isla') || normName.includes('cayo') || normName.includes('playa')) {
    return `${placeName} destaca por sus paisajes costeros, aguas cristalinas y atmósfera marina única para relajarse.`
  }

  if (normName.includes('malecon') || normName.includes('mirador') || normCat.includes('viewpoint')) {
    return `${placeName} ofrece una panorámica excepcional de ${city}, perfecta para admirar el horizonte, tomar fotos y sentir la brisa.`
  }

  if (normName.includes('catedral') || normName.includes('iglesia') || normCat.includes('religious') || place.rawTags?.historic === 'church') {
    return `${placeName} es un tesoro arquitectónico y cultural imprescindible para comprender la historia viva de ${city}.`
  }

  if (normCat.includes('museum') || normName.includes('museo')) {
    return `${placeName} resguarda la memoria, el arte y el legado histórico más representativo de la región.`
  }

  if (normCat.includes('nature') || normCat.includes('park') || normName.includes('parque')) {
    return `${placeName} brinda un entorno natural y sombreado ideal para pasear al aire libre y conectar con la biodiversidad local.`
  }

  if (normCat.includes('restaurant') || normCat.includes('cafe') || normName.includes('restaurante')) {
    return `${placeName} es un referente culinario reconocido para deleitarse con la auténtica gastronomía y sazón tradicional de ${city}.`
  }

  return `${placeName} es una parada emblemática de ${city}, elegida para enriquecer tu recorrido con historia, cultura y autenticidad local.`
}

function buildTips(place, type) {
  const category = place.category || 'place'
  
  // Consejos específicos por categoría
  if (category === 'museum') {
    return ['Revisar los horarios de exhibiciones especiales', 'Aprovechar las guías interactivas o audioguías del recinto', 'Evitar usar flash al tomar fotografías']
  }
  if (category === 'historic' || category === 'religious') {
    return ['Apreciar en silencio los detalles arquitectónicos e históricos', 'Llevar vestimenta adecuada y respetar las normas locales', 'Tomar fotos sin perturbar el ambiente de respeto']
  }
  if (category === 'viewpoint') {
    return ['Preparar tu cámara para capturar las espectaculares vistas panorámicas', 'Visitar durante las horas doradas como el amanecer o atardecer', 'Llevar abrigo si visitas en horas de la tarde por el viento']
  }
  if (category === 'nature' || category === 'park') {
    return ['Llevar agua para mantenerte hidratado y usar protector solar', 'Seguir los senderos señalizados para proteger el entorno natural', 'Llevar repelente para insectos']
  }
  if (category === 'restaurant' || category === 'cafe' || category === 'market') {
    return ['Preguntar por la especialidad de la casa o plato del día', 'Llevar algo de efectivo por si algunos puestos no aceptan tarjeta', 'Consultar si requieren reserva previa si es muy concurrido']
  }

  // Consejos por tipo de tour
  const tips = {
    night: ['Confirmar los horarios de cierre y políticas de acceso', 'Mantenerse en zonas bien iluminadas y transitadas', 'Evitar traslados largos a pie al final de la noche'],
    ecological: ['Llevar suficiente agua y calzado cómodo para caminar', 'Revisar el pronóstico del clima antes de iniciar la caminata', 'Respetar los senderos, jardines y zonas restringidas'],
    gastronomic: ['Reservar si el local es pequeño o muy popular', 'Preguntar por ingredientes locales y platos de temporada', 'Dejar espacio para probar algo en las siguientes paradas de la ruta'],
    family: ['Verificar la ubicación de baños, zonas de sombra y descanso', 'Planificar pausas cortas para los menores del grupo', 'Evitar las horas de mayor radiación solar si el recorrido es al aire libre'],
    sports: ['Llevar hidratación y ropa deportiva cómoda', 'No invadir canchas o zonas de entrenamiento privadas', 'Consultar si hay eventos locales que puedan restringir el acceso'],
  }

  return tips[type] ?? ['Revisar los horarios de apertura del lugar', 'Llegar con anticipación para disfrutar sin prisas', 'Llevar suficiente batería en el móvil para fotos y navegación']
}

function stopActionFor(type, category, seed) {
  let options = []
  if (type === 'gastronomic') {
    options = category === 'market' 
      ? [
          'probar sabores locales y ver como se mueve la cocina cotidiana',
          'explorar los puestos tradicionales de comida y degustar bocados autóctonos',
          'sumergirte en los aromas locales y descubrir ingredientes frescos de la región'
        ]
      : [
          'hacer una pausa de sabor, comparar preparaciones y descubrir productos locales',
          'deleitar tu paladar con recetas locales y disfrutar de un ambiente gastronómico acogedor',
          'degustar una especialidad de la zona y relajarte mientras saboreas la gastronomía local'
        ]
  } else if (type === 'sports') {
    options = category === 'sports'
      ? [
          'conocer un escenario deportivo o un punto de actividad física local',
          'apreciar las instalaciones deportivas y sentir la energía del movimiento local',
          'visitar un punto de encuentro para el deporte y la recreación activa'
        ]
      : [
          'mantener una ruta activa con caminata, vista urbana y descanso breve',
          'estirar las piernas con una caminata ligera y disfrutar del dinamismo del entorno',
          'disfrutar de un trayecto activo que combina ejercicio moderado y puntos de interés'
        ]
  } else if (type === 'ecological') {
    options = [
      'caminar, observar el paisaje y bajar el ritmo del recorrido',
      'conectar con la naturaleza, respirar aire puro y apreciar la biodiversidad',
      'disfrutar de senderos verdes y relajarte rodeado de un entorno natural único'
    ]
  } else if (type === 'night') {
    options = [
      'vivir el ambiente social del destino con una lógica segura de movilidad',
      'disfrutar de la iluminación nocturna, el ocio local y la vida nocturna',
      'explorar la vibrante atmósfera nocturna y descubrir el encanto de la ciudad tras el atardecer'
    ]
  } else if (type === 'family') {
    options = [
      'aprender y descansar sin exigir demasiado al grupo',
      'disfrutar de actividades aptas para todas las edades y relajarse en familia',
      'compartir un momento agradable con espacios amplios y entretenimiento educativo'
    ]
  } else if (type === 'cultural') {
    options = [
      'leer la historia, la arquitectura y las costumbres visibles en el espacio',
      'apreciar el legado patrimonial, las expresiones artísticas y las tradiciones del barrio',
      'descubrir la riqueza histórica y conectar con las raíces culturales de este rincón'
    ]
  } else {
    options = [
      'entender mejor el destino desde una experiencia concreta',
      'descubrir un rincón auténtico de la ciudad y sumergirte en su día a día',
      'explorar una parada representativa con una atmósfera singular y gran valor local',
      'conectar con la esencia del lugar y contemplar sus detalles más interesantes'
    ]
  }
  return selectDeterministic(options, seed)
}

function stopFocusFor(type, category, seed) {
  let options = []
  if (type === 'gastronomic') {
    options = category === 'market'
      ? [
          'identificar ingredientes, aromas, puestos tradicionales y platos que representan la ciudad',
          'observar la dinámica de compra-venta, hablar con los mercaderes y probar frutas exóticas',
          'descubrir las hierbas locales, los condimentos típicos y las recetas transmitidas de generación en generación'
        ]
      : [
          'elegir una preparación local, preguntar por su origen y comparar sabores con otras paradas',
          'disfrutar del menú o plato recomendado, apreciar la sazón local y descansar un momento',
          'saborear bebidas tradicionales, conocer su método de elaboración y conversar sobre las tradiciones culinarias'
        ]
  } else if (type === 'sports') {
    options = category === 'sports'
      ? [
          'observar el escenario, su relación con equipos o prácticas locales y el movimiento de los aficionados',
          'apreciar el diseño del recinto deportivo, las actividades recreativas y la vitalidad del área',
          'conocer los logros históricos asociados a este lugar y el entusiasmo de quienes lo visitan'
        ]
      : [
          'aprovechar el espacio para caminar, hidratarse y mantener el cuerpo activo',
          'observar el paso de los peatones, estirar las piernas y tomar aire fresco',
          'disfrutar del dinamismo de la ruta a pie y registrar fotos del entorno activo'
        ]
  } else if (type === 'ecological') {
    options = [
      'observar sombra, brisa, vegetación, agua o panoramas y cuidar el entorno mientras se avanza',
      'identificar especies de árboles, escuchar las aves y respetar las zonas de reserva ecológica',
      'capturar fotos del paisaje verde, buscar miradores naturales y disfrutar del silencio'
    ]
  } else if (type === 'night') {
    options = [
      'revisar horarios, seguridad, música, iluminación y opciones para quedarse sin perder el control de la ruta',
      'disfrutar del ambiente festivo, los cócteles locales y la música de fondo de forma responsable',
      'apreciar las fachadas iluminadas, buscar calles concurridas y seguras, y sentir la vibra de la noche'
    ]
  } else if (type === 'family') {
    options = [
      'buscar puntos de descanso, baños, sombra, explicaciones simples y actividades visuales',
      'aprovechar las áreas de juegos, organizar fotos grupales y caminar a un ritmo cómodo para todos',
      'explicar curiosidades de forma divertida, buscar zonas seguras y evitar tumultos'
    ]
  } else if (type === 'cultural') {
    options = [
      'mirar detalles de fachada, plazas, arte urbano, vida cotidiana y símbolos del barrio',
      'identificar placas conmemorativas, estilos arquitectónicos y la huella histórica del lugar',
      'observar las interacciones de los residentes, el arte expuesto y sumergirte en la memoria del destino'
    ]
  } else {
    options = [
      'recorrer el lugar, fotografiarlo y entender por qué aparece en la secuencia del tour',
      'apreciar las particularidades arquitectónicas, el ritmo cotidiano y tomar hermosas fotografías',
      'buscar pequeños detalles que revelan la identidad local y contemplar el entorno relajadamente',
      'observar el movimiento de la gente, respirar la atmósfera del sitio y capturar imágenes del paisaje'
    ]
  }
  return selectDeterministic(options, seed)
}

function shouldUseAiPlanner(input, planner) {
  if (process.env.DISABLE_AI_PLANNER === 'true') return false
  if (input.durationHours > 168) return false
  if (planner.selectedPlaces.length > 30) return false
  if (Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length >= 3 && (input.specificPlaces?.length || input.selectedPlaces?.length)) {
    return false
  }
  return true
}

function aiPlannerSkipReason(input, planner) {
  if (process.env.DISABLE_AI_PLANNER === 'true') return 'disabled_by_env'
  if (input.durationHours > 168) return 'long_tour_uses_deterministic_planner'
  if (planner.selectedPlaces.length > 30) return 'too_many_places_for_ai_planner'
  if (Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length >= 3 && (input.specificPlaces?.length || input.selectedPlaces?.length)) {
    return 'user_selected_chat_places_already_complete'
  }
  return 'not_skipped'
}

function isValidTourPlan(value) {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value.itinerario) && value.itinerario.length >= 2) return true
  if (Array.isArray(value.itinerario_dias) && value.itinerario_dias.length > 0) {
    const flat = value.itinerario_dias.flatMap(d => (d.paradas || []).map(p => ({
      ...p,
      nombre: p.nombre_lugar || p.nombre || p.name,
      descripcion: p.descripcion_guia || p.descripcion || p.description,
      duracion_estimada: p.duracion_minutos ? `${p.duracion_minutos} minutos` : (p.duracion_estimada || '45 minutos'),
      dia: d.dia || 1
    })))
    if (flat.length >= 2) {
      value.itinerario = flat
      return true
    }
  }
  return false
}

export function validateTourQuality(tour, planner, input) {
  if (!tour || !Array.isArray(tour.itinerario)) return tour

  tour.itinerario = tour.itinerario.map((stop, index) => {
    let description = String(stop.descripcion || '').trim()
    let isBadQuality = false

    // Solo considerar baja calidad si está vacía o tiene menos de 20 palabras
    if (!description || description.split(/\s+/).filter(Boolean).length < 20) {
      isBadQuality = true
    }

    if (isBadQuality) {
      // Reemplazar descripción con fallback dinámico específico si OpenAI falló
      const fallbackPlace = planner.selectedPlaces[index] || planner.selectedPlaces[0]
      if (fallbackPlace) {
        stop.descripcion = buildStopDescription(fallbackPlace, input)
      }
    } else {
      stop.descripcion = description
    }

    return stop
  })

  // Detectar y eliminar paradas no válidas (metadatos/encabezados de días) y repetidas en todo el itinerario
  const seenKeys = new Set()
  tour.itinerario = tour.itinerario.filter((stop) => {
    const name = stop.nombre || stop.name || ''
    if (!isValidSpecificPlace(name)) return false
    let key = normalizeKey(name)
    key = key.replace(/\b(septiembre|september|9\s*11|11\s*s)\b/g, '911memorial')
    if (!key || seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })

  return tour
}

function generateDynamicDescription(name, category, city) {
  const cleanName = String(name || '').replace(/_/g, ' ').trim()
  const loc = city ? `en ${city}` : 'en la zona'

  if (/restaurante|comida|cafe|café|bistro|bar|parador|kiosko|asador|gourmet|gastronom/i.test(cleanName) || /food|restaurant|gastronom/i.test(category)) {
    return `${cleanName} es un destacado establecimiento gastronómico ${loc}, ideal para degustar exquisitos sabores autóctonos, preparaciones tradicionales y disfrutar de una experiencia culinaria inolvidable.`
  }
  if (/sendero|pueblito|trek|camino|hiking|bosque|reserva|chairama/i.test(cleanName) || /trail|nature|park/i.test(category)) {
    return `${cleanName} es una fascinante ruta de senderismo y patrimonio natural ${loc}, rodeada de exuberante vegetación tropical, miradores panorámicos y vestigios culturales de gran valor.`
  }
  if (/playa|beach|bah[íi]a|bahia|cala|cabo|piscina|isla|arrecife|ensenada|costa/i.test(cleanName) || /beach|playa|coastal/i.test(category)) {
    return `${cleanName} cautiva por sus impresionantes paisajes costeros, arenas doradas y aguas cristalinas ${loc}, ofreciendo un entorno perfecto para el descanso, el mar y la conexión con la naturaleza.`
  }
  if (/convención|convention|congreso|eventos/i.test(cleanName) || /convention/i.test(category)) {
    return `${cleanName} es un emblemático centro de eventos y exposiciones ${loc}, reconocido por albergar importantes cumbres internacionales, conferencias corporativas y eventos culturales de primer nivel.`
  }
  if (/mall|plaza comercial|centro comercial|shopping|outlet/i.test(cleanName) || /compras|shopping/i.test(category)) {
    return `${cleanName} es uno de los centros comerciales y gastronómicos más concurridos ${loc}, ofreciendo tiendas de marcas exclusivas, boutiques locales, restaurantes frente al mar y áreas de esparcimiento.`
  }
  if (/cantina|bar|club|discoteca|pub|roe|wabo|karaoke|nightlife/i.test(cleanName) || /vida nocturna|bar/i.test(category)) {
    return `${cleanName} es un legendario ícono de la vida nocturna y el entretenimiento ${loc}, famoso por sus espectáculos de música en vivo, ambiente festivo, cócteles artesanales y vibrante gastronomía local.`
  }
  if (/marina|puerto|dock|embarcadero|puerto deportivo/i.test(cleanName) || /marina|puerto/i.test(category)) {
    return `${cleanName} constituye el corazón náutico ${loc}, punto de partida de excursiones marítimas, yates de lujo y paseos hacia los acantilados, rodeado de un animado malecón comercial.`
  }
  if (/faro|lighthouse/i.test(cleanName)) {
    return `${cleanName} destaca por su histórica presencia en el litoral marítimo ${loc}, guiando a la navegación sobre las costas y brindando una de las panorámicas fotográficas más hermosas sobre el océano.`
  }
  if (/arco|arch|formación/i.test(cleanName)) {
    return `${cleanName} representa uno de los monumentos naturales más espectaculares e icónicos ${loc}, tallado por la fuerza del mar y el viento donde se encuentran grandes corrientes oceánicas.`
  }
  if (/museo|museum|galeria|gallery|exhibición/i.test(cleanName) || /museo|arte/i.test(category)) {
    return `${cleanName} resguarda valiosas colecciones históricas, artesanales y artísticas ${loc}, ofreciendo recorridos educativos que conectan a los visitantes con la historia y herencia cultural del lugar.`
  }
  if (/parque|park|garden|jardin|reserva/i.test(cleanName) || /naturaleza/i.test(category)) {
    return `${cleanName} es un verdadero pulmón verde y santuario natural ${loc}, ideal para caminatas, contemplación del paisaje y actividades al aire libre rodeado de flora y fauna local.`
  }

  return `${cleanName} es un lugar emblemático de gran interés ${loc}, destacado por su valor histórico, cultural y las experiencias únicas que ofrece a los viajeros.`
}

function generateDynamicTips(name, category, city) {
  const cleanName = String(name || '').replace(/_/g, ' ').trim()
  if (/playa|beach|bah[íi]a|bahia|cala|cabo|piscina|isla|arrecife|ensenada|costa/i.test(cleanName) || /beach|playa|coastal/i.test(category)) {
    return [
      `Llevar protección solar, toalla e hidratación para disfrutar de ${cleanName}.`,
      `Respetar las indicaciones de los salvavidas y consultar por zonas seguras para nadar.`
    ]
  }
  if (/sendero|pueblito|trek|camino|hiking|bosque|reserva|chairama/i.test(cleanName) || /trail|nature|park/i.test(category)) {
    return [
      `Usar calzado con buen agarre, ropa transpirable y llevar repelente para recorrer ${cleanName}.`,
      `Transitar exclusivamente por las rutas marcadas y regresar antes del anochecer.`
    ]
  }
  if (/bar|discoteca|club|nightclub|pub|rumba|salsa|cantina/i.test(cleanName) || /nightlife|bar/i.test(category)) {
    return [
      `Llegar temprano para encontrar buena ubicación cerca de la pista o música en vivo en ${cleanName}.`,
      `Cuidar las pertenencias personales y coordinar el transporte de regreso con anticipación.`
    ]
  }
  if (/restaurante|comida|cafe|café|bistro|parador|kiosko|asador|gourmet|gastronom/i.test(cleanName) || /food|restaurant/i.test(category)) {
    return [
      `Preguntar por el plato insignia o las recomendaciones del chef de ${cleanName}.`,
      `Consultar si admiten reservaciones previas en horas pico para evitar esperas.`
    ]
  }
  if (/biblioteca|library|museo|museum|galeria/i.test(cleanName)) {
    return [
      `Consultar las exposiciones temporales y salas principales en ${cleanName}.`,
      `Aprovechar las visitas guiadas o audioguías para conocer la historia detrás de cada pieza.`
    ]
  }
  if (/puente|bridge|mirador|vessel|tower|observatorio/i.test(cleanName)) {
    return [
      `Aprovechar la hora dorada o el atardecer para capturar las mejores panorámicas desde ${cleanName}.`,
      `Llevar una prenda ligera si sube el viento en zonas altas.`
    ]
  }
  if (/estatua|libertad|statue|monumento|memorial|plaza|catedral|iglesia|fuerte|castillo/i.test(cleanName)) {
    return [
      `Apreciar los detalles arquitectónicos y placas conmemorativas de ${cleanName}.`,
      `Iniciar el recorrido por la mañana para obtener fotografías con óptima iluminación natural.`
    ]
  }
  if (/opera|teatro|theatre/i.test(cleanName)) {
    return [
      `Admirar la arquitectura del vestíbulo y consultar la cartelera cultural de ${cleanName}.`,
      `Llegar con anticipación a la apertura de puertas para recorrer el recinto.`
    ]
  }
  if (/parque|park|garden/i.test(cleanName)) {
    return [
      `Caminar a ritmo pausado y disfrutar de las zonas de descanso arboladas en ${cleanName}.`,
      `Aprovechar para hidratarse y observar la vida local y cotidiana del sector.`
    ]
  }
  return [
    `Conocer la historia y atractivos circundantes que hacen especial a ${cleanName}.`,
    `Planificar la visita con tiempo suficiente para apreciar el entorno y la vida local.`
  ]
}

function generateDynamicActivities(name, category) {
  const cleanName = String(name || '').replace(/_/g, ' ').trim()
  if (/playa|beach|bah[íi]a|cala|cabo|ensenada/i.test(cleanName)) {
    return [
      `Caminar y relajarse junto a la orilla de ${cleanName}`,
      `Bañarse en las aguas y contemplar el horizonte marino en ${cleanName}`,
      `Apreciar la brisa y la atmósfera costera de ${cleanName}`
    ]
  }
  if (/isla|cayo|archipi[eé]lago/i.test(cleanName)) {
    return [
      `Llegada y desembarco para recorrer los alrededores de ${cleanName}`,
      `Descubrir las playas vírgenes y senderos rústicos de ${cleanName}`,
      `Degustar la gastronomía insular tradicional frente al mar`
    ]
  }
  if (/sendero|pueblito|trek|camino|hiking|bosque|reserva|cerro/i.test(cleanName)) {
    return [
      `Recorrer los senderos naturales hacia los miradores de ${cleanName}`,
      `Observar la flora, fauna y formaciones geológicas autóctonas`,
      `Fotografiar el paisaje panorámico desde las alturas de ${cleanName}`
    ]
  }
  if (/restaurante|comida|cafe|bistro|bar|parador|kiosko|asador|gastrobar/i.test(cleanName)) {
    return [
      `Degustar los platillos y especialidades culinarias de ${cleanName}`,
      `Probar las bebidas tradicionales y postres locales`,
      `Disfrutar del ambiente acogedor y hospitalidad de ${cleanName}`
    ]
  }
  if (/biblioteca|library|museo|museum|galeria/i.test(cleanName)) {
    return [
      `Recorrer las salas de exhibición permanente y colecciones de ${cleanName}`,
      `Aprender sobre los momentos y personajes históricos clave`,
      `Apreciar el diseño y la curaduría artística de ${cleanName}`
    ]
  }
  if (/puente|bridge/i.test(cleanName)) {
    return [
      `Cruzar el paso peatonal con vistas panorámicas de la ciudad`,
      `Apreciar la ingeniería y detalles arquitectónicos de ${cleanName}`,
      `Capturar fotografías del skyline y el entorno fluvial o marítimo`
    ]
  }
  if (/estatua|monumento|memorial|plaza|catedral|iglesia|fuerte|castillo/i.test(cleanName)) {
    return [
      `Contemplar la majestuosidad histórica y arquitectura de ${cleanName}`,
      `Conocer los hitos y eventos coloniales o patrióticos vinculados`,
      `Tomar fotos de la fachada y plazas emblemáticas circundantes`
    ]
  }
  if (/parque|park|garden/i.test(cleanName)) {
    return [
      `Pasear con tranquilidad por las arboledas y avenidas de ${cleanName}`,
      `Descansar en las áreas verdes integradas con la vida urbana`,
      `Observar las actividades culturales y cotidianas locales`
    ]
  }
  return [
    `Visitar y explorar los rincones destacados de ${cleanName}`,
    `Conocer el valor cultural y la identidad de ${cleanName}`,
    `Disfrutar del ambiente característico y las vistas del lugar`
  ]
}

async function isPlaceBelongingToCity(placeName, targetCity = '', lat = null, lon = null, targetCityCoords = null) {
  const normPlace = String(placeName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normCity = String(targetCity || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // 1. Verificación por distancia radial esférica desde el centro del municipio/región turística (máximo 45 km para excursiones de día)
  if (lat && lon && targetCityCoords?.latitude && targetCityCoords?.longitude) {
    const distKm = haversineMeters(targetCityCoords.latitude, targetCityCoords.longitude, lat, lon) / 1000
    if (distKm > 45) {
      console.warn(`[UniversalGeoBoundary] Rechazado "${placeName}" (${distKm.toFixed(1)} km) por exceder 45 km del centro de "${targetCity}"`)
      return false
    }
  }

  // 2. Mapeo preventivo para atracciones exclusivas de centros urbanos lejanos
  const CITY_EXCLUSIVE_LANDMARKS = {
    'cartagena': ['bocagrande', 'castillo san felipe', 'getsemani', 'islas del rosario', 'baru', 'la popa'],
    'barranquilla': ['malecon del rio', 'ventana al mundo', 'boca de ceniza', 'casa del carnaval', 'edgar renteria'],
    'santa marta': ['tayrona', 'rodadero', 'taganga', 'minca', 'quinta de san pedro'],
    'medellin': ['comuna 13', 'pueblito paisa', 'parque botero', 'el penol', 'guatape'],
    'bogota': ['monserrate', 'la candelaria', 'plaza de bolivar', 'zipaquira']
  }

  for (const [cityKey, landmarks] of Object.entries(CITY_EXCLUSIVE_LANDMARKS)) {
    if (!normCity.includes(cityKey)) {
      if (landmarks.some(l => normPlace.includes(l))) {
        return false
      }
    }
  }

  // 3. Geocodificación inversa dinámica si hay coordenadas
  if (lat && lon) {
    try {
      const geo = await reverseGeocode(lat, lon)
      if (geo && geo.city) {
        const placeCityNorm = String(geo.city).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (normCity.length >= 3 && placeCityNorm.length >= 3 && !placeCityNorm.includes(normCity) && !normCity.includes(placeCityNorm)) {
          if (targetCityCoords?.latitude) {
            const distKm = haversineMeters(targetCityCoords.latitude, targetCityCoords.longitude, lat, lon) / 1000
            if (distKm > 45) return false
          }
        }
      }
    } catch (_) {}
  }

  return true
}

function sanitizeStopTitle(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Parada del Tour'
  let name = rawName.trim()
  if (name.toUpperCase().includes('OBELISCO: MONUMENTO A LA DECLARACIÓN DE INDEPENDENCIA')) {
    return 'Obelisco de la Independencia'
  }
  name = name.replace(/^OBELISCO:\s*/i, 'Obelisco: ')
  if (name.length > 50) {
    const parts = name.split(/[:\-\–\—]/)
    if (parts[0].trim().length >= 8) {
      name = parts[0].trim()
    } else {
      name = name.substring(0, 48).trim() + '...'
    }
  }
  return name
}

async function normalizeStop(stop, index, input, anchorPlace = null, candidatePlaces = [], calculatedDay = null, options = {}) {
  const source = stop && typeof stop === 'object' ? stop : {}
  const ubicacion = source.ubicacion ?? source.locationInfo ?? {}
  const candidateIndex = (index < candidatePlaces.length) ? index : (candidatePlaces.length > 0 ? (index % candidatePlaces.length) : 0)
  const candidateFallback = candidatePlaces[candidateIndex] ?? anchorPlace ?? candidatePlaces[0] ?? null

  let rawName = [source.nombre, source.name, ubicacion.nombre_lugar]
      .map((value) => value == null ? "" : value.toString().trim())
      .find((value) => value.length > 0) ?? ''

  const isGenericPlaceholder = !rawName || /parada \d+/i.test(rawName) || /^(parada|lugar|punto|sitio|stop)\s*\d+$/i.test(rawName)
  const sourceName = isGenericPlaceholder ? (candidateFallback?.name ?? `${input.destination} ${index + 1}`) : rawName

  const matchedPlace = findCandidatePlace(sourceName, candidatePlaces, anchorPlace)
  const fallbackPlace = matchedPlace ?? candidateFallback ?? anchorPlace ?? null
  const startPlace = candidatePlaces[0] ?? null
  const endPlace = candidatePlaces[candidatePlaces.length - 1] ?? null
  const coordinates = await resolveStopCoordinates({
    source,
    input,
    name: sourceName,
    fallbackPlace,
    startPlace,
    })
  let resolvedName = cleanPlacePhysicalName(sourceName || fallbackPlace?.name || candidateFallback?.name || `${input.destination}`)
  const isValidCityPlace = await isPlaceBelongingToCity(resolvedName, input.city || input.destination, coordinates.latitude, coordinates.longitude, candidatePlaces[0])
  if (/parada \d+/i.test(resolvedName) || /^(parada|lugar|punto|sitio|stop)\s*\d+$/i.test(resolvedName) || !isValidCityPlace) {
    resolvedName = cleanPlacePhysicalName(candidateFallback?.name || fallbackPlace?.name || `${input.destination}`)
  }
  let richData = options?.descriptionsMap?.[resolvedName] || options?.descriptionsMap?.[sourceName]
  if (!richData && options?.descriptionsMap && typeof options.descriptionsMap === 'object') {
    const cleanTarget = resolvedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const cleanSource = (sourceName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const foundKey = Object.keys(options.descriptionsMap).find(k => {
      const cleanK = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return cleanK === cleanTarget || cleanK === cleanSource ||
             (cleanTarget.length >= 5 && cleanK.includes(cleanTarget)) ||
             (cleanK.length >= 5 && cleanTarget.includes(cleanK))
    })
    if (foundKey) {
      richData = options.descriptionsMap[foundKey]
    }
  }
  const richObj = (richData && typeof richData === 'object') ? richData : null

  let description = richObj?.descripcion || (typeof richData === 'string' ? richData : '') || source.descripcion || source.description || ''
  description = description.replace(/^(Atracci[oó]n(\s*\/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*/i, '').trim()

  const isGenericDesc = !description || 
                         description.trim().length < 25 || 
                         (description.toLowerCase() === resolvedName.toLowerCase()) ||
                         description.includes('un punto de gran interés recomendado') ||
                         description.includes('gran valor patrimonial de') ||
                         description.includes('identidad auténtica');

  if (isGenericDesc) {
    const wikiText = await wikipediaSummaryText(resolvedName, input.city || input.destination, input.country).catch(() => null)
    if (wikiText && wikiText.length > 30) {
      description = wikiText
    } else {
      const rawCat = fallbackPlace?.category || source.categoria || source.category || source.type || 'lugar'
      description = generateDynamicDescription(resolvedName, rawCat, input.city || input.destination)
    }
  }
  
  let durationText = source.duracion_estimada ?? `${source.suggestedMinutes ?? 25} minutos`
  let minutes = minutesFromLabel(durationText)
  const isMuseumOrGallery = /museo|palacio|galer[ií]a|fuerte|castillo|inquisici[oó]n|naval/i.test(resolvedName)
  if (isMuseumOrGallery && minutes < 45) {
    minutes = 45
    durationText = "45 minutos"
  } else if (minutes < 20) {
    const fallbackMins = Math.max(25, fallbackPlace?.minutes ?? source.suggestedMinutes ?? 25)
    durationText = `${fallbackMins} minutos`
  }

  const images = normalizeList(source.imagenes ?? source.images, [])
  const cityFallback = input.city ? `${input.city}, ${input.country || ''}`.trim().replace(/,\s*$/, '') : input.destination
  
  const rawCategory = source.categoria || source.category || source.type || fallbackPlace?.category || fallbackPlace?.type || ''
  const placeCategory = normalizeCategory({
    category: rawCategory,
    name: resolvedName,
    tags: source.etiquetas || source.tags || []
  })
  
  const imageStatus = await imageForPlaceWithStatus(resolvedName, cityFallback, placeCategory, index, {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    country: input.country,
    assignedUrls: options?.assignedUrls
  }).catch(() => ({ url: "", isFallback: true }))
  
  // Priorizar siempre la foto REAL obtenida de Wikipedia/Wikimedia/Openverse/Pexels si no es fallback genérico
  let image = imageStatus.url
  if (imageStatus.isFallback && (images[0] || source.imageUrl)) {
    image = images[0] || source.imageUrl
  }
  if (!image) {
    image = imageStatus.url
  }

  // Normalizar lista de actividades priorizando las generadas específicamente para este lugar por la IA
  let rawActivities = normalizeList(richObj?.actividades ?? source.actividades ?? source.activities, [])
  if (rawName && rawName.toLowerCase() !== resolvedName.toLowerCase() && rawName.length > 5) {
    const activityPhrase = rawName.trim()
    if (!rawActivities.includes(activityPhrase)) {
      rawActivities = [activityPhrase, ...rawActivities]
    }
  }
  const isGenericActivities = rawActivities.length === 0 || 
                              (rawActivities.length <= 2 && rawActivities.every(a => a.toLowerCase() === 'explorar' || a.toLowerCase() === 'fotografiar'));
  if (isGenericActivities) {
    rawActivities = generateDynamicActivities(resolvedName, rawCategory)
  }

  // Normalizar lista de consejos evitando el aviso genérico de horarios
  let rawTips = normalizeList(richObj?.consejos ?? source.consejos ?? source.tips, [])
  const isGenericTips = rawTips.length === 0 || 
                        rawTips.every(t => t.includes('Confirma horarios') || t.includes('horarios locales'));
  if (isGenericTips) {
    rawTips = generateDynamicTips(resolvedName, rawCategory, input.city || input.destination)
  }

  // Normalizar datos curiosos con anécdotas e historia real de la IA
  const rawCuriousFacts = normalizeList(richObj?.datos_curiosos ?? source.datos_curiosos, [])
  const validCuriousFacts = rawCuriousFacts.filter(f => typeof f === 'string' && f.trim().length > 15 && !f.includes('es uno de los puntos emblemáticos más destacados'))
  const datos_curiosos = validCuriousFacts.length > 0 
    ? validCuriousFacts 
    : [`${resolvedName} posee una notable relevancia histórica, arquitectónica y cultural en ${input.city || input.destination}.`]

  const sourceDay = Number(source.dia ?? source.day ?? fallbackPlace?.dia ?? fallbackPlace?.day ?? anchorPlace?.dia ?? anchorPlace?.day ?? 0)
  const stopDay = (sourceDay > 0) ? sourceDay : (calculatedDay !== null ? calculatedDay : 1)

  const publicStop = {
    parada: index + 1,
    dia: stopDay,
    nombre: resolvedName,
    isFallbackImage: imageStatus.isFallback && !images[0] && !source.imageUrl,
    descripcion: description,
    duracion_estimada: durationText,
    actividades: rawActivities,
    datos_curiosos,
    consejos: rawTips,
    ubicacion: {
      nombre_lugar: cleanPlacePhysicalName(fallbackPlace?.name ?? ubicacion.nombre_lugar ?? resolvedName),
      direccion: fallbackPlace?.address ?? ubicacion.direccion ?? source.address ?? "",
      ciudad: fallbackPlace?.city ?? ubicacion.ciudad ?? input.city ?? "",
      region: fallbackPlace?.region ?? ubicacion.region ?? "",
      pais: fallbackPlace?.country ?? ubicacion.pais ?? input.country ?? "",
      latitud: coordinates.latitude,
      longitud: coordinates.longitude,
      place_id: fallbackPlace?.placeId ?? ubicacion.place_id ?? placeIdFor(resolvedName, coordinates.latitude, coordinates.longitude),
      url_mapa: fallbackPlace?.urlMapa ?? ubicacion.url_mapa ?? mapUrlFor(coordinates.latitude, coordinates.longitude),
    },
    imagenes: unique([image, ...images]),
  }
  const routeStop = {
    name: publicStop.ubicacion.nombre_lugar,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    imageUrl: publicStop.imagenes[0],
    description: publicStop.descripcion,
    activities: publicStop.actividades,
    tips: publicStop.consejos,
    suggestedMinutes: minutesFromLabel(publicStop.duracion_estimada),
  }
  return { publicStop, routeStop }
}

async function resolveStopCoordinates({ source, input, name, fallbackPlace, startPlace = null, endPlace = null }) {
  const sourceLatitude = numberValue(source.latitude ?? source.ubicacion?.latitud, NaN)
  const sourceLongitude = numberValue(source.longitude ?? source.ubicacion?.longitud, NaN)

  const isCorridor = Boolean(startPlace && endPlace)
  const canonicalDest = input.canonicalDestination || (hasUsableCoordinates(input.latitude, input.longitude) ? {
    latitude: input.latitude,
    longitude: input.longitude,
    displayName: input.city || input.destination,
    city: input.city,
    country: input.country
  } : null)

  // 1. Validar si las coordenadas de origen ya son válidas y están dentro del área metropolitana
  if (hasUsableCoordinates(sourceLatitude, sourceLongitude)) {
    const candidateCoord = { latitude: sourceLatitude, longitude: sourceLongitude, name }
    const isNearby = !canonicalDest || validateCandidateLocation(candidateCoord, canonicalDest, 50)
    if (isNearby && (!isCorridor || isWithinCorridor(candidateCoord, startPlace, endPlace))) {
      return candidateCoord
    }
  }

  // 2. Geocodificar nombre de parada anclado al destino
  const cleanCity = cleanAdministrativeCityName(input.city || input.destination || '')
  const searchQuery = `${name}, ${cleanCity}, ${input.country || ''}`.trim().replace(/,\s*$/, '')
  const geocoded = await geocodePlace(searchQuery, input.latitude, input.longitude).catch(() => null)

  if (geocoded && hasUsableCoordinates(geocoded.latitude, geocoded.longitude)) {
    const isNearby = !canonicalDest || validateCandidateLocation(geocoded, canonicalDest, 50)
    if (isNearby && (!isCorridor || isWithinCorridor(geocoded, startPlace, endPlace))) {
      return {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        place_id: geocoded.place_id || ''
      }
    }
  }

  // 3. Si existe fallbackPlace y está en la misma ciudad
  if (fallbackPlace && hasUsableCoordinates(fallbackPlace.latitude, fallbackPlace.longitude)) {
    const isNearby = !canonicalDest || validateCandidateLocation(fallbackPlace, canonicalDest, 50)
    if (isNearby && (!isCorridor || isWithinCorridor(fallbackPlace, startPlace, endPlace))) {
      return {
        latitude: fallbackPlace.latitude,
        longitude: fallbackPlace.longitude,
        place_id: fallbackPlace.place_id || '',
        wasFallback: true
      }
    }
  }

  // 4. Centro oficial verificado de la ciudad destino
  const cityCenterLat = canonicalDest?.latitude || input.latitude || (cleanCity.toLowerCase() === 'santa marta' ? 11.2408 : 10.4230)
  const cityCenterLon = canonicalDest?.longitude || input.longitude || (cleanCity.toLowerCase() === 'santa marta' ? -74.2122 : -75.5500)

  return {
    latitude: cityCenterLat,
    longitude: cityCenterLon,
    wasFallback: true
  }
}

function normalizeLocationInfo(value, firstStop, input) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      nombre_lugar: value.nombre_lugar ?? value.nombreLugar ?? firstStop?.nombre ?? input.destination,
      direccion: value.direccion ?? '',
      ciudad: value.ciudad ?? input.city ?? '',
      region: value.region ?? '',
      pais: value.pais ?? input.country ?? '',
      place_id: value.place_id ?? value.placeId ?? firstStop?.ubicacion?.place_id ?? '',
      url_mapa: value.url_mapa ?? value.urlMapa ?? firstStop?.ubicacion?.url_mapa ?? '',
    }
  }
  const name = typeof value === 'string' && value.trim()
    ? value.trim()
    : firstStop?.nombre ?? input.destination
  return {
    nombre_lugar: name,
    direccion: firstStop?.ubicacion?.direccion ?? '',
    ciudad: firstStop?.ubicacion?.ciudad ?? input.city ?? '',
    region: firstStop?.ubicacion?.region ?? '',
    pais: firstStop?.ubicacion?.pais ?? input.country ?? '',
    place_id: firstStop?.ubicacion?.place_id ?? '',
    url_mapa: firstStop?.ubicacion?.url_mapa ?? '',
  }
}

function normalizeBudget(value, input) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      bajo: numberValue(value.bajo ?? value.low, 0),
      medio: numberValue(value.medio ?? value.medium, 0),
      alto: numberValue(value.alto ?? value.high, 0),
    }
  }
  const base = input.type === 'gastronomic' ? 35 : input.type === 'ecological' ? 25 : 20
  return {
    bajo: base,
    medio: base * 2,
    alto: base * 4,
  }
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return fallback
}

function normalizeAudience(value, type, interests) {
  const fallback = audienceFor(type, interests)
  return normalizeList(value, fallback)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function fuzzyNormalizeKey(name) {
  return normalizeKey(name)
    .replace(/^playa/g, '')
    .replace(/^centrocomercial/g, 'cc')
    .replace(/^parque/g, '')
    .replace(/^museo/g, '')
    .replace(/^bahiade/g, '')
}

function uniqueByName(values) {
  const seen = new Set()
  return values.filter((value) => {
    if (!value || !value.name) return false
    const rawType = (value.type || value.category || '').toLowerCase()
    const isFood = rawType.includes('food') || rawType.includes('restaurant') || /restaurante|cafe|bistro|bar|comida/i.test(value.name)
    const typePrefix = isFood ? 'food' : 'attraction'
    const key = `${typePrefix}_${normalizeKey(value.name)}`
    const fuzzyKey = `${typePrefix}_${fuzzyNormalizeKey(value.name)}`
    if (seen.has(key) || (fuzzyKey.length > 5 && seen.has(fuzzyKey))) return false
    seen.add(key)
    if (fuzzyKey.length > 5) seen.add(fuzzyKey)
    return true
  })
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase()).filter(Boolean)
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => {
      if (entry == null || entry === false) return []
      return [key.toLowerCase(), String(entry).toLowerCase()]
    })
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
  }
  return []
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function scoreFromTerms(text, terms, max = 10) {
  const matched = terms.filter((term) => text.includes(term)).length
  return clamp(matched * 3, 0, max)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function numberValue(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function minutesFromLabel(value) {
  if (typeof value === 'number') return Math.max(20, Math.round(value))
  const text = String(value ?? '').toLowerCase()
  const match = text.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return 25
  const parsed = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(parsed)) return 25
  const mins = text.includes('hora') ? Math.round(parsed * 60) : Math.round(parsed)
  return Math.max(20, mins)
}

function typeLabel(type) {
  switch (type) {
    case 'urban':
      return 'Urbano'
    case 'historical':
      return 'Historico'
    case 'gastronomic':
      return 'Gastronomico'
    case 'cultural':
      return 'Cultural'
    case 'ecological':
      return 'Ecologico'
    case 'romantic':
      return 'Romantico'
    case 'sports':
      return 'Deportivo'
    case 'night':
      return 'Nocturno'
    case 'family':
      return 'Familiar'
    default:
      return 'Personalizado'
  }
}

function categoryLabel(category) {
  switch (category) {
    case 'museum':
      return 'Museos'
    case 'historic':
      return 'Patrimonio'
    case 'restaurant':
      return 'Restaurantes'
    case 'cafe':
      return 'Cafeterias'
    case 'market':
      return 'Mercados'
    case 'nature':
      return 'Naturaleza'
    case 'viewpoint':
      return 'Miradores'
    case 'trail':
      return 'Senderos'
    case 'nightlife':
      return 'Vida nocturna'
    case 'family':
      return 'Familiar'
    case 'religious':
      return 'Religioso'
    default:
      return category ? category[0].toUpperCase() + category.slice(1) : ''
  }
}

function defaultIncludes(type) {
  switch (type) {
    case 'gastronomic':
      return ['Degustaciones guiadas', 'Ruta a pie', 'Recomendaciones culinarias'];
    case 'ecological':
      return ['Senderos suaves', 'Miradores naturales', 'Consejos de seguridad'];
    case 'night':
      return ['Ambiente nocturno', 'Paradas con bebidas', 'Ruta segura'];
    case 'family':
      return ['Actividades para todas las edades', 'Pausas de descanso', 'Espacios abiertos'];
    default:
      return ['Guia digital', 'Ruta en mapa', 'Narrativa contextual'];
  }
}

function defaultExcludes() {
  return ['Transporte privado', 'Entradas no incluidas', 'Consumos personales'];
}

function defaultRecommendations() {
  return ['Lleva agua y bateria', 'Confirma horarios locales', 'Usa calzado comodo'];
}

function defaultWhatToBring(type) {
  const items = ['Agua', 'Telefono cargado', 'Calzado comodo'];
  if (type === 'ecological') items.push('Protector solar');
  if (type === 'night') items.push('Documento de identificacion');
  return items;
}

function defaultRules() {
  return ['Respeta las normas locales', 'No ingreses a zonas restringidas', 'Sigue el orden de la ruta'];
}


function fallbackPlaces(input, location) {
  const latitude = location?.latitude ?? 0
  const longitude = location?.longitude ?? 0
  return [{
    name: input.destination || input.city || 'Punto turistico',
    latitude,
    longitude,
    type: 'tourism',
    category: input.type,
  }]
}

export function computeDetourDistance(place, startPlace, endPlace) {
  if (!place || !startPlace || !endPlace) return 0
  const pLat = Number(place.latitude ?? place.lat ?? 0)
  const pLon = Number(place.longitude ?? place.lon ?? 0)
  const startLat = Number(startPlace.latitude ?? startPlace.lat ?? 0)
  const startLon = Number(startPlace.longitude ?? startPlace.lon ?? 0)
  const endLat = Number(endPlace.latitude ?? endPlace.lat ?? 0)
  const endLon = Number(endPlace.longitude ?? endPlace.lon ?? 0)

  if (!pLat || !pLon || !startLat || !startLon || !endLat || !endLon) return 0

  const routeDistKm = haversineMeters(startLat, startLon, endLat, endLon) / 1000
  const distFromStartKm = haversineMeters(pLat, pLon, startLat, startLon) / 1000
  const distFromEndKm = haversineMeters(pLat, pLon, endLat, endLon) / 1000

  return (distFromStartKm + distFromEndKm) - routeDistKm
}

export function isWithinCorridor(place, startPlace, endPlace, relaxed = false) {
  if (!place || (!startPlace && !endPlace)) return true
  const pLat = Number(place.latitude ?? place.lat ?? 0)
  const pLon = Number(place.longitude ?? place.lon ?? 0)
  if (!pLat || !pLon) return false

  const startLat = startPlace ? Number(startPlace.latitude ?? startPlace.lat ?? 0) : null
  const startLon = startPlace ? Number(startPlace.longitude ?? startPlace.lon ?? 0) : null
  const endLat = endPlace ? Number(endPlace.latitude ?? endPlace.lat ?? 0) : null
  const endLon = endPlace ? Number(endPlace.longitude ?? endPlace.lon ?? 0) : null

  if (startLat !== null && startLon !== null && endLat !== null && endLon !== null) {
    const routeDistMeters = haversineMeters(startLat, startLon, endLat, endLon)
    const routeDistKm = routeDistMeters / 1000

    const distFromStartKm = haversineMeters(pLat, pLon, startLat, startLon) / 1000
    const distFromEndKm = haversineMeters(pLat, pLon, endLat, endLon) / 1000

    const detourKm = (distFromStartKm + distFromEndKm) - routeDistKm

    const maxDetourKm = relaxed
      ? Math.max(8.0, routeDistKm * 0.6)
      : (routeDistKm <= 35 
          ? Math.min(4.5, Math.max(1.5, routeDistKm * 0.35))
          : Math.min(25.0, routeDistKm * 0.35))

    if (detourKm > maxDetourKm) {
      return false
    }

    if (!relaxed) {
      const pCity = place.city ? normalizeKey(place.city) : ''
      const sCity = startPlace.city ? normalizeKey(startPlace.city) : ''
      const eCity = endPlace.city ? normalizeKey(endPlace.city) : ''

      if (pCity && sCity && eCity && sCity === eCity) {
        if (!pCity.includes(sCity) && !sCity.includes(pCity)) {
          return false
        }
      }
    }
  }

  return true
}

export function sortPlacesByProximity(places, origin = null) {
  if (!Array.isArray(places) || places.length <= 2) return places
  const unvisited = [...places]
  const ordered = []

  let current = null
  if (origin && origin.latitude && origin.longitude) {
    let nearestIndex = 0
    let minDistance = Infinity
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineMeters(origin.latitude, origin.longitude, unvisited[i].latitude, unvisited[i].longitude)
      if (d < minDistance) {
        minDistance = d
        nearestIndex = i
      }
    }
    current = unvisited.splice(nearestIndex, 1)[0]
    ordered.push(current)
  } else {
    current = unvisited.shift()
    ordered.push(current)
  }

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let minDistance = Infinity
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineMeters(current.latitude, current.longitude, unvisited[i].latitude, unvisited[i].longitude)
      if (d < minDistance) {
        minDistance = d
        nearestIndex = i
      }
    }
    current = unvisited.splice(nearestIndex, 1)[0]
    ordered.push(current)
  }

  return ordered
}

export function orderPlacesAlongRoute(places, startLoc, endLoc) {
  if (!places || places.length <= 1 || !startLoc || !endLoc) return places

  const latA = Number(startLoc.latitude ?? startLoc.lat ?? 0)
  const lonA = Number(startLoc.longitude ?? startLoc.lon ?? 0)
  const latB = Number(endLoc.latitude ?? endLoc.lat ?? 0)
  const lonB = Number(endLoc.longitude ?? endLoc.lon ?? 0)

  const dLat = latB - latA
  const dLon = lonB - lonA
  const lenSq = dLat * dLat + dLon * dLon

  if (lenSq < 1e-7) return places

  const mapped = places.map((place) => {
    const pLat = Number(place.latitude ?? 0)
    const pLon = Number(place.longitude ?? 0)
    const t = ((pLat - latA) * dLat + (pLon - lonA) * dLon) / lenSq
    return { place, t }
  })

  mapped.sort((a, b) => a.t - b.t)
  return mapped.map((item) => item.place)
}

async function collectMultiCityCandidates(input) {
  const cities = input.cities && input.cities.length > 0 ? input.cities : [input.city].filter(Boolean)
  let allPlaces = []
  const cityGeos = []
  
  for (const cityName of cities) {
    // 1. Fetch top iconic landmarks from OpenAI global geography knowledge for THIS city
    const iconicLandmarks = await fetchCityIconicLandmarks({
      destination: cityName,
      city: cityName,
      country: input.country,
      type: input.type,
      interests: input.touristInterests,
      prompt: input.prompt
    })

    let geocodedIconics = []
    if (Array.isArray(iconicLandmarks) && iconicLandmarks.length > 0) {
      const geocodedSettled = await Promise.allSettled(
        iconicLandmarks.map(async (item) => {
          const searchQuery = `${item.name} ${cityName} ${input.country || ''}`.trim()
          const geo = await geocodePlace(searchQuery)
          if (geo && (geo.latitude || geo.longitude)) {
            return {
              name: item.name,
              latitude: geo.latitude,
              longitude: geo.longitude,
              type: item.type || 'tourism',
              category: item.category || 'historic',
              city: cityName,
              country: input.country,
              address: geo.name || `${cityName}, ${item.name}`,
              description: item.description || '',
              tags: { iconic_landmark: 'true' }
            }
          }
          return null
        })
      )
      geocodedIconics = geocodedSettled
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean)
        .filter(place => isValidTouristAttraction(place, { ...input, city: cityName }))
    }

    const cityGeo = await geocodePlace(`${cityName} ${input.country || ''}`)
    if (cityGeo) cityGeos.push({ city: cityName, geo: cityGeo })

    let overpass = []
    let photon = []
    if (cityGeo) {
      overpass = await overpassAttractions(cityGeo.latitude, cityGeo.longitude, 12000)
      photon = await photonSearch(`${cityName} ${input.country || ''}`, 15)
    }
    
    const pool = [...geocodedIconics, ...overpass, ...photon]
    const valid = uniqueByName(pool)
      .filter((place) => place && place.name)
      .filter((place) => isValidTouristAttraction(place, { ...input, city: cityName }))
      .slice(0, 5)
      .map(p => ({ ...p, city: cityName }))
    
    allPlaces.push(...valid)
  }

  // 2. Search for en-route POIs in the highway corridor between City 1 and City N
  if (cityGeos.length >= 2) {
    const startGeo = cityGeos[0].geo
    const endGeo = cityGeos[cityGeos.length - 1].geo
    const midPoints = [
      {
        latitude: startGeo.latitude + (endGeo.latitude - startGeo.latitude) * 0.33,
        longitude: startGeo.longitude + (endGeo.longitude - startGeo.longitude) * 0.33,
      },
      {
        latitude: startGeo.latitude + (endGeo.latitude - startGeo.latitude) * 0.66,
        longitude: startGeo.longitude + (endGeo.longitude - startGeo.longitude) * 0.66,
      }
    ]

    for (const midPoint of midPoints) {
      try {
        const enRouteOverpass = await overpassAttractions(midPoint.latitude, midPoint.longitude, 18000)
        const validEnRoute = uniqueByName(enRouteOverpass)
          .filter((place) => place && place.name)
          .filter((place) => isValidTouristAttraction(place, input))
          .slice(0, 3)
          .map(p => ({ ...p, isEnRoute: true, city: `${cityGeos[0].city} - ${cityGeos[cityGeos.length - 1].city} (Carretera)` }))
        allPlaces.push(...validEnRoute)
      } catch (e) {
        console.warn('[multi-city] En-route POI fetch failed:', e.message)
      }
    }
  }

  return uniqueByName(allPlaces)
}

async function collectCorridorCandidates(input, location) {
  const city = location?.city || input.city || ''
  const country = location?.country || input.country || ''
  
  let startPlace = null
  let endPlace = null
  
  if (input.originPlace === 'user_current_location' || input.isUserLocationOrigin) {
    let userLat = Number(input.latitude ?? location?.latitude ?? 0)
    let userLon = Number(input.longitude ?? location?.longitude ?? 0)
    if (userLat && userLon) {
      const revGeo = await reverseGeocodeLocation(userLat, userLon).catch(() => null)
      const userCity = revGeo?.city || city
      const userCountry = revGeo?.country || country
      const placeName = revGeo?.name ? `Tu ubicación actual (${revGeo.name})` : (userCity ? `Tu ubicación actual (${userCity})` : 'Tu ubicación actual')
      startPlace = {
        name: placeName,
        latitude: userLat,
        longitude: userLon,
        category: 'attraction',
        type: 'start_point',
        city: userCity,
        country: userCountry,
        tags: { start_point: 'true', user_current_location: 'true' }
      }
    }
  } else if (input.originPlace) {
    const originGeo = await geocodePlace(`${input.originPlace} ${city} ${country}`)
    if (originGeo) {
      startPlace = {
        name: input.originPlace,
        latitude: originGeo.latitude,
        longitude: originGeo.longitude,
        category: 'attraction',
        type: 'start_point',
        city,
        country,
        tags: { start_point: 'true' }
      }
    }
  }
  
  if (input.destinationPlace) {
    const destGeo = await geocodePlace(`${input.destinationPlace} ${city} ${country}`)
    if (destGeo) {
      endPlace = {
        name: input.destinationPlace,
        latitude: destGeo.latitude,
        longitude: destGeo.longitude,
        category: 'attraction',
        type: 'end_point',
        city,
        country,
        tags: { end_point: 'true' }
      }
    }
  }

  const pool = []

  // 1. Fetch POIs at spatial midpoints along the route corridor between startPlace and endPlace
  if (startPlace && endPlace) {
    const latA = startPlace.latitude
    const lonA = startPlace.longitude
    const latB = endPlace.latitude
    const lonB = endPlace.longitude

    const steps = [0.25, 0.50, 0.75]
    for (const ratio of steps) {
      const midLat = latA + (latB - latA) * ratio
      const midLon = lonA + (lonB - lonA) * ratio
      try {
        const attractions = await overpassAttractions(midLat, midLon, 6000)
        pool.push(...attractions)
        const foodSpots = await overpassNearbyFood(midLat, midLon, 4000)
        pool.push(...foodSpots)
      } catch (err) {
        console.warn('[corridor] Midpoint fetch error:', err.message)
      }
    }
  }

  // 2. Also search primary location and general city search
  const query = `${input.destination || ''} ${city} ${country}`.trim()
  const photonPlaces = await photonSearch(query, 30)
  const overpassPlaces = location ? await overpassAttractions(location.latitude, location.longitude, 10000) : []
  pool.push(...overpassPlaces, ...photonPlaces)

  // 3. Fetch iconic city landmarks if pool is small
  const iconicLandmarks = await fetchCityIconicLandmarks({
    destination: input.destination || city,
    city,
    country,
    type: input.type,
    interests: input.touristInterests,
    prompt: input.prompt
  })
  if (Array.isArray(iconicLandmarks) && iconicLandmarks.length > 0) {
    const geocodedSettled = await Promise.allSettled(
      iconicLandmarks.map(async (item) => {
        const searchQuery = `${item.name} ${city} ${country}`.trim()
        const geo = await geocodePlace(searchQuery)
        if (geo && (geo.latitude || geo.longitude)) {
          return {
            name: item.name,
            latitude: geo.latitude,
            longitude: geo.longitude,
            type: item.type || 'tourism',
            category: item.category || 'historic',
            city,
            country,
            address: geo.name || `${city}, ${item.name}`,
            description: item.description || '',
            tags: { iconic_landmark: 'true' }
          }
        }
        return null
      })
    )
    const geocodedIconics = geocodedSettled.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
    pool.push(...geocodedIconics)
  }

  let intermediates = uniqueByName(pool)
    .filter((place) => place && place.name)
    .filter((place) => isValidTouristAttraction(place, input))
    .filter((place) => isWithinCorridor(place, startPlace, endPlace))
  
  if (startPlace) {
    intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(startPlace.name))
  }
  if (endPlace) {
    intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(endPlace.name))
  }

  const selected = []
  if (startPlace) selected.push(startPlace)
  selected.push(...intermediates)
  if (endPlace) selected.push(endPlace)

  return selected
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function collectTourCandidates(input, location) {
  // Case A: Multi-city tour (e.g. Santa Marta -> Cartagena)
  if (input.isMultiCity || (Array.isArray(input.cities) && input.cities.length > 1)) {
    if (!input.durationHours || input.durationHours < 24) {
      input.durationHours = Math.max(48, (input.cities?.length || 2) * 24)
    }
    const multiCityPlaces = await collectMultiCityCandidates(input)
    if (multiCityPlaces.length >= 3) {
      return { rawCount: multiCityPlaces.length, places: multiCityPlaces, source: 'multi-city-geodata' }
    }
  }

  // Case B: Origin and/or Destination specified route within city
  if (input.originPlace || input.destinationPlace) {
    if (!input.durationHours) {
      input.durationHours = 8 // Default 1 day (8h)
    }
    const corridorPlaces = await collectCorridorCandidates(input, location)
    if (corridorPlaces.length >= 2) {
      return { rawCount: corridorPlaces.length, places: corridorPlaces, source: 'corridor-route-geodata' }
    }
  }

  // Case C: Standard single-city tour
  const isMicroDest = Boolean(
    input.canonicalDestination?.isMicroDestination ||
    /tayrona|minca|guatapé|guatape|islas del rosario|isla barú|isla baru|san bernardo/i.test(input.destination || '') ||
    /tayrona|minca|guatapé|guatape|islas del rosario|isla barú|isla baru|san bernardo/i.test(input.city || '')
  )

  const city = isMicroDest
    ? (input.canonicalDestination?.entityName || input.destination || location?.city || '')
    : (location?.city || input.city || '')
  const country = location?.country || input.country || ''

  // Obtenemos primero las coordenadas del centro del destino para validar el radio
  const cityGeo = (location?.latitude && location?.longitude) ? location : await geocodePlace(`${city} ${country}`.trim()).catch(() => null)
  const cityCenterLat = cityGeo?.latitude
  const cityCenterLon = cityGeo?.longitude

  // Check if it is a regional or nature-oriented tour
  const isRegionalOrNature = 
    input.type === 'ecological' || 
    input.type === 'sports' || 
    (input.durationHours && input.durationHours >= 12) ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.prompt || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.destination || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(city);

  const isMultiDay = Boolean((input.durationDays && input.durationDays >= 2) || (input.durationHours && input.durationHours >= 24))
  const isWalkingOrUrban = input.transport === 'Caminando' || input.transport === 'Bicicleta' || input.type === 'cultural' || input.type === 'historic'
  const maxCityRadiusKm = isMicroDest ? 14 : ((isRegionalOrNature || isMultiDay) ? 65 : (isWalkingOrUrban ? 4.5 : 15))

  function isWithinCityBounds(lat, lon, maxDistanceKm = maxCityRadiusKm) {
    if (!cityCenterLat || !cityCenterLon || !lat || !lon) return true
    const dist = getDistanceKm(cityCenterLat, cityCenterLon, lat, lon)
    if (dist > maxDistanceKm) {
      console.warn(`[collectTourCandidates] Omitiendo parada lejana (${dist.toFixed(1)} km > ${maxDistanceKm} km del centro de ${city})`)
      return false
    }
    return true
  }

  // Geocode any specific places requested or discussed in chat
  const rawSpecifics = [
    ...(Array.isArray(input.specificPlaces) ? input.specificPlaces : []),
    ...(Array.isArray(input.selectedPlaces) ? input.selectedPlaces : [])
  ].filter(p => {
    const pName = typeof p === 'string' ? p : (p?.name || '')
    return isValidSpecificPlace(pName)
  })

  const mergedSpecifics = deduplicatePlacesByName(rawSpecifics)

  let geocodedSpecifics = []
  if (mergedSpecifics.length > 0) {
    const canonicalDest = input.canonicalDestination || (cityCenterLat ? {
      latitude: cityCenterLat,
      longitude: cityCenterLon,
      displayName: city,
      city,
      country
    } : null)

    let preGeocodedAi = {}
    if (mergedSpecifics.length >= 3 && process.env.OPENAI_API_KEY) {
      const allNames = mergedSpecifics.map(p => {
        if (typeof p === 'string') {
          const str = p.trim()
          if (str.startsWith('{') && str.includes('name:')) {
            const m = str.match(/name\s*:\s*([^,\}]+)/)
            return m ? m[1].trim() : str
          }
          return str
        }
        return p?.name || ''
      }).filter(pName => isValidSpecificPlace(pName))

      if (allNames.length > 0) {
        preGeocodedAi = await geocodePlacesWithOpenAI({
          city,
          country,
          places: allNames,
          centerLat: canonicalDest?.latitude ?? cityCenterLat,
          centerLon: canonicalDest?.longitude ?? cityCenterLon
        }).catch(() => ({}))
      }
    }

    const specificSettled = await Promise.allSettled(
      mergedSpecifics.map(async (rawPlace, index) => {
        let placeName = ''
        let placeDay = null
        if (typeof rawPlace === 'string') {
          const str = rawPlace.trim()
          if (str.startsWith('{') && str.includes('name:')) {
            const m = str.match(/name\s*:\s*([^,\}]+)/)
            placeName = m ? m[1].trim() : str
            const d = str.match(/(?:dia|day)\s*:\s*(\d+)/)
            if (d) placeDay = parseInt(d[1], 10)
          } else {
            placeName = str
          }
        } else if (rawPlace && typeof rawPlace === 'object') {
          placeName = (rawPlace.name || '').trim()
          placeDay = rawPlace.dia || rawPlace.day || null
        }
        if (!isValidSpecificPlace(placeName)) return null

        const entityType = getPlaceEntityType(placeName)
        const isRestaurant = entityType === 'food' || /restaurante|bistro|cafe|comida|asador|gourmet|bar|pub/i.test(placeName)
        
        let geo = null
        const destLat = canonicalDest?.latitude ?? cityCenterLat ?? null
        const destLon = canonicalDest?.longitude ?? cityCenterLon ?? null

        // Step A: Si OpenAI pre-geocodificó este lugar por lote, verificarlo con máxima prioridad
        const aiCoord = preGeocodedAi[placeName] ||
          Object.entries(preGeocodedAi).find(([k]) => k.toLowerCase() === placeName.toLowerCase() ||
            placeName.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(placeName.toLowerCase()))?.[1]

        if (aiCoord && Number.isFinite(aiCoord.latitude) && Number.isFinite(aiCoord.longitude)) {
          const candidate = {
            name: placeName,
            latitude: Number(aiCoord.latitude),
            longitude: Number(aiCoord.longitude),
            city,
            country
          }
          if (validateCandidateLocation(candidate, canonicalDest, 70)) {
            geo = candidate
          }
        }

        // Tier 0: Consulta directa con contexto de ciudad y país con sesgo de proximidad al destino
        if (!geo && /pueblito|chairama/i.test(placeName)) {
          geo = await geocodePlace('Pueblito Tayrona', destLat, destLon).catch(() => null)
          if (!geo) geo = await geocodePlace('El Pueblito Chairama', destLat, destLon).catch(() => null)
        }
        if (!geo) {
          const searchQuery = `${placeName}, ${city}, ${country}`.trim().replace(/,\s*$/, '')
          geo = await geocodePlace(searchQuery, destLat, destLon).catch(() => null)
        }
        if (!geo && destLat && destLon) {
          geo = await geocodePlace(placeName, destLat, destLon).catch(() => null)
        }

        // Tier 1: Consulta directa con contexto de ciudad y país con sesgo de proximidad al destino
        if (!geo || !validateCandidateLocation(geo, canonicalDest, 70)) {
          const searchQuery = `${placeName}, ${city}, ${country}`.trim().replace(/,\s*$/, '')
          geo = await geocodePlace(searchQuery, destLat, destLon).catch(() => null)
        }

        // Tier 2: Búsqueda con clasificador canónico universal según el tipo de entidad
        if (!geo || !validateCandidateLocation(geo, canonicalDest, 70)) {
          const cleanedPlace = placeName.replace(/^(?:el|la|los|las)\s+/i, '').trim()
          
          if (/pueblito|chairama/i.test(cleanedPlace)) {
            geo = await geocodePlace('Pueblito Tayrona', destLat, destLon).catch(() => null)
          } else if (entityType === 'shopping') {
            geo = await geocodePlace(`Centro Comercial ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`${cleanedPlace} Mall, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'food') {
            geo = await geocodePlace(`Restaurante ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Bar ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Café ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Discoteca ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Gastrobar ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'beach_coastal') {
            geo = await geocodePlace(`Playa ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Playas de ${cleanedPlace}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Bahía ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Cabo ${cleanedPlace}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Malecón ${cleanedPlace}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`${cleanedPlace}, ${country}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'cultural') {
            geo = await geocodePlace(`Museo ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Acuario ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Teatro ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'religious') {
            geo = await geocodePlace(`Catedral ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Iglesia ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'urban_promenade' || entityType === 'park_nature') {
            geo = await geocodePlace(`Parque ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Paseo ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Plaza ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Gran Malecón ${cleanedPlace}, ${city}`, destLat, destLon).catch(() => null)
          } else if (entityType === 'entertainment_sports') {
            geo = await geocodePlace(`Acuario ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Estadio ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
            if (!geo) geo = await geocodePlace(`Zoológico ${cleanedPlace}, ${city}, ${country}`, destLat, destLon).catch(() => null)
          }

          if (!geo) geo = await geocodePlace(`${cleanedPlace}, ${city}`, destLat, destLon).catch(() => null)
          if (!geo) geo = await geocodePlace(`${cleanedPlace}, Centro, ${city}`, destLat, destLon).catch(() => null)
        }

        if (!geo || !validateCandidateLocation(geo, canonicalDest, 70)) {
          // If direct geocode failed, attempt category-based search for real verified POIs in the municipality
          if (destLat && destLon) {
            if (entityType === 'food') {
              const nearbyFood = await overpassNearbyFood(destLat, destLon, 15000).catch(() => [])
              const validFood = nearbyFood.find(f => validateCandidateLocation(f, canonicalDest, 45))
              if (validFood) {
                geo = {
                  name: validFood.name,
                  latitude: validFood.latitude,
                  longitude: validFood.longitude,
                  city,
                  country
                }
              }
            } else if (entityType === 'beach_coastal' || entityType === 'nature') {
              const nearbyBeaches = await photonSearch(`${city} playa`, 5, destLat, destLon).catch(() => [])
              const validBeach = nearbyBeaches.find(b => validateCandidateLocation(b, canonicalDest, 45))
              if (validBeach) {
                geo = {
                  name: validBeach.name,
                  latitude: validBeach.latitude,
                  longitude: validBeach.longitude,
                  city,
                  country
                }
              }
            } else if (/discoteca|bar|club|nightclub|pub|rumba|fiesta|vida nocturna/i.test(placeName)) {
              const nearbyClubs = await photonSearch(`${city} discoteca`, 6, destLat, destLon).catch(() => [])
              const validClub = nearbyClubs.find(b => validateCandidateLocation(b, canonicalDest, 45))
              if (validClub) {
                geo = {
                  name: validClub.name,
                  latitude: validClub.latitude,
                  longitude: validClub.longitude,
                  city,
                  country
                }
              } else {
                // Dynamically fetch a real verified venue in this city via AI without hardcoding
                const aiVenue = await suggestFallbackPlacesWithOpenAI({
                  destination: `${placeName} en ${city}`,
                  city,
                  country,
                  type: 'nightlife'
                }).then(list => list?.[0]).catch(() => null)
                if (aiVenue) {
                  const geoAi = await geocodePlace(`${aiVenue.name}, ${city}, ${country}`, destLat, destLon).catch(() => null)
                  if (geoAi && validateCandidateLocation(geoAi, canonicalDest, 50)) {
                    geo = {
                      name: aiVenue.name,
                      latitude: geoAi.latitude,
                      longitude: geoAi.longitude,
                      city,
                      country
                    }
                  }
                }
              }
            }
          }
        }

        if (!geo || !validateCandidateLocation(geo, canonicalDest, 70)) {
          console.warn(`[tour-ai] Discarding unverified or out-of-bounds place "${placeName}" in ${city}. No synthetic coordinates generated.`)
          return null
        }

        const finalLat = geo.latitude
        const finalLon = geo.longitude

        if (finalLat && finalLon) {
          const originLat = location?.latitude || canonicalDest?.latitude
          const originLon = location?.longitude || canonicalDest?.longitude
          if (originLat && originLon) {
            const distKm = haversineMeters(finalLat, finalLon, originLat, originLon) / 1000
            const isCoastalOrMarine = isRegionalOrNature || /cove[ñn]as|tol[uú]|cartagena|santa marta|san andr[eé]s|canc[uú]n/i.test(city) || /isla|playa|bah[íi]a|caimanera|archipi[eé]lago/i.test(placeName)
            const maxBound = (isMicroDest || canonicalDest?.isMicroDestination) ? 18 : (isCoastalOrMarine ? 65 : 45)
            if (distKm > maxBound) {
              console.warn(`[tour-ai] Discarding specific place "${placeName}" (${distKm.toFixed(1)}km from ${city}) because it exceeds boundary (${maxBound}km).`)
              return null
            }
          }

          return {
            name: placeName,
            latitude: finalLat,
            longitude: finalLon,
            type: isRestaurant ? 'restaurant' : 'tourism',
            category: isRestaurant ? 'restaurant' : 'requested',
            dia: placeDay,
            day: placeDay,
            city,
            country,
            address: geo?.name || `${placeName}, ${city}`,
            description: '',
            tags: { requested_place: 'true' }
          }
        }
        return null
      })
    )

    geocodedSpecifics = specificSettled
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(Boolean)

    // Dynamic AI Geocoding Fallback: If any requested places failed OSM lookup, batch-geocode them dynamically with OpenAI
    const geocodedNames = new Set(geocodedSpecifics.map(p => p.name.toLowerCase()))
    const missingSpecifics = mergedSpecifics.filter(raw => {
      const name = typeof raw === 'string' ? raw : (raw?.name || '')
      return name && !geocodedNames.has(name.toLowerCase())
    })

    if (missingSpecifics.length > 0) {
      console.info(`[collectTourCandidates] ${missingSpecifics.length} specific places missing coordinates after OSM lookup. Resolving dynamically via OpenAI geocoding fallback...`)
      const missingNames = missingSpecifics.map(p => typeof p === 'string' ? p : (p?.name || '')).filter(Boolean)
      const aiCoords = await geocodePlacesWithOpenAI({
        city,
        country,
        places: missingNames,
        centerLat: canonicalDest?.latitude ?? cityCenterLat,
        centerLon: canonicalDest?.longitude ?? cityCenterLon
      }).catch(() => ({}))

      for (const raw of missingSpecifics) {
        let placeName = ''
        let placeDay = null
        if (typeof raw === 'string') {
          const str = raw.trim()
          if (str.startsWith('{') && str.includes('name:')) {
            const m = str.match(/name\s*:\s*([^,\}]+)/)
            placeName = m ? m[1].trim() : str
            const d = str.match(/(?:dia|day)\s*:\s*(\d+)/)
            if (d) placeDay = parseInt(d[1], 10)
          } else {
            placeName = str
          }
        } else if (raw && typeof raw === 'object') {
          placeName = (raw.name || '').trim()
          placeDay = raw.dia || raw.day || null
        }
        if (!placeName) continue

        const coords = aiCoords[placeName] ||
                       Object.entries(aiCoords).find(([k]) => k.toLowerCase() === placeName.toLowerCase() ||
                                                              placeName.toLowerCase().includes(k.toLowerCase()) ||
                                                              k.toLowerCase().includes(placeName.toLowerCase()))?.[1]

        if (coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)) {
          const entityType = getPlaceEntityType(placeName)
          const isRestaurant = entityType === 'food' || /restaurante|bistro|cafe|comida|asador|gourmet|bar|pub/i.test(placeName)
          geocodedSpecifics.push({
            name: placeName,
            latitude: Number(coords.latitude),
            longitude: Number(coords.longitude),
            type: isRestaurant ? 'restaurant' : 'tourism',
            category: isRestaurant ? 'restaurant' : 'requested',
            dia: placeDay,
            day: placeDay,
            city,
            country,
            address: coords.address || `${placeName}, ${city}`,
            description: '',
            tags: { requested_place: 'true', ai_geocoded: 'true' }
          })
        }
      }
    }

    // Day Anchor Alignment: Si una parada usó fallback de cuadrante y su compañera de día tiene coordenadas precisas,
    // ajustar el pin hacia la zona de su compañera
    for (const p of geocodedSpecifics) {
      if (p.address.startsWith(`${p.name}, ${city}`) && p.dia) {
        const anchorMate = geocodedSpecifics.find(other => other !== p && other.dia === p.dia && !other.address.startsWith(`${other.name}, ${city}`))
        if (anchorMate) {
          p.latitude = anchorMate.latitude + 0.0015
          p.longitude = anchorMate.longitude + 0.0015
        }
      }
    }

    // Fast-path: Si el usuario ya seleccionó paradas específicas en el chat y todas están geocodificadas con éxito,
    // retornar directamente ahorrando múltiples llamadas lentas y timeouts a Overpass/Photon/OpenAI
    if (geocodedSpecifics.length >= 3) {
      console.info(`[collectTourCandidates] Fast-path: Successfully geocoded ${geocodedSpecifics.length} user selected stops directly. Skipping generic city scrapers.`)
      return {
        rawCount: geocodedSpecifics.length,
        places: geocodedSpecifics,
        source: 'user-chat-selected-places'
      }
    }
  }

  // 1. Fetch top iconic landmarks from OpenAI global geography knowledge
  const iconicLandmarks = await fetchCityIconicLandmarks(
    isMicroDest ? (input.canonicalDestination?.entityName || input.destination || city) : city,
    country
  )

  let geocodedIconics = []
  if (Array.isArray(iconicLandmarks) && iconicLandmarks.length > 0) {
    const geocodedSettled = await Promise.allSettled(
      iconicLandmarks.map(async (item) => {
        const searchQuery = `${item.name} ${city} ${country}`.trim()
        const geo = await geocodePlace(searchQuery)
        if (geo && (geo.latitude || geo.longitude) && isWithinCityBounds(geo.latitude, geo.longitude)) {
          return {
            name: item.name,
            latitude: geo.latitude,
            longitude: geo.longitude,
            type: item.type || 'tourism',
            category: item.category || 'historic',
            city,
            country,
            address: geo.name || `${city}, ${item.name}`,
            description: item.description || '',
            tags: { iconic_landmark: 'true' }
          }
        }
        return null
      })
    )
    geocodedIconics = geocodedSettled
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(Boolean)
      .filter(place => isValidTouristAttraction(place, input))
  }

  const query = `${input.destination} ${city} ${country}`.trim()
  const photonPlaces = await photonSearch(query, 30).catch(() => [])

  const radiusPrimary = isRegionalOrNature ? 15000 : 4500
  const radiusWide = isRegionalOrNature ? 55000 : 9000

  // Calculate subzone centroid if user has specific requested places (e.g. Tayrona cluster, Minca, etc.)
  let searchCenterLat = input.canonicalDestination?.latitude || location?.latitude || cityCenterLat
  let searchCenterLon = input.canonicalDestination?.longitude || location?.longitude || cityCenterLon

  const validSpecifics = geocodedSpecifics.filter(p => hasUsableCoordinates(p.latitude, p.longitude))
  if (validSpecifics.length > 0) {
    searchCenterLat = validSpecifics.reduce((acc, p) => acc + p.latitude, 0) / validSpecifics.length
    searchCenterLon = validSpecifics.reduce((acc, p) => acc + p.longitude, 0) / validSpecifics.length
    console.info(`[collectTourCandidates] Using subzone centroid (${searchCenterLat.toFixed(4)}, ${searchCenterLon.toFixed(4)}) derived from ${validSpecifics.length} user selected stops.`)
  }

  const overpassPlaces = (searchCenterLat && searchCenterLon)
    ? await overpassAttractions(searchCenterLat, searchCenterLon, radiusWide).catch(() => [])
    : []
  
  // Prioritize specific chat places and geocoded iconic landmarks first in the pool
  let pool = [...geocodedSpecifics, ...geocodedIconics, ...overpassPlaces, ...photonPlaces]

  // Proximity filter against subzone centroid to prevent mixing distant downtown POIs with nature reserves
  if (validSpecifics.length > 0 && searchCenterLat && searchCenterLon) {
    pool = pool.filter(place => {
      if (!hasUsableCoordinates(place.latitude, place.longitude)) return false
      const distToCentroid = haversineMeters(place.latitude, place.longitude, searchCenterLat, searchCenterLon) / 1000
      return distToCentroid <= (isRegionalOrNature ? 22 : 12)
    })
  }
  
  function dedupeByProximity(places, minDistanceMeters = 50) {
    const result = []
    for (const p of places) {
      if (!p || !p.name) continue
      const pKey = normalizePlaceKey(p.name)
      const pType = getPlaceEntityType(p.name)
      const pDay = p.dia || p.day
      
      const existingIdx = result.findIndex(item => {
        const itemKey = normalizePlaceKey(item.name)
        const itemType = getPlaceEntityType(item.name)
        const itemDay = item.dia || item.day

        // 1. Nunca mezclar lugares asignados a días diferentes
        if (pDay != null && itemDay != null && Number(pDay) !== Number(itemDay)) {
          return false
        }

        // 2. Coincidencia exacta de clave de nombre
        if (pKey === itemKey) return true
        if (pKey.length >= 5 && itemKey.length >= 5 && (pKey.includes(itemKey) || itemKey.includes(pKey))) {
          return true
        }

        // 3. Deduplicación por proximidad sólo si comparten el MISMO tipo de entidad y están a menos de 50 metros
        if (hasUsableCoordinates(item.latitude, item.longitude) && hasUsableCoordinates(p.latitude, p.longitude)) {
          const dist = haversineMeters(item.latitude, item.longitude, p.latitude, p.longitude)
          if (dist < minDistanceMeters && pType === itemType && (itemKey.includes(pKey) || pKey.includes(itemKey))) {
            return true
          }
        }
        return false
      })

      if (existingIdx === -1) {
        result.push(p)
      } else {
        const existing = result[existingIdx]
        if (p.name.length > existing.name.length && /[A-Z]/.test(p.name)) {
          result[existingIdx] = {
            ...p,
            dia: p.dia || existing.dia,
            day: p.day || existing.day
          }
        }
      }
    }
    return result
  }

  const normalizedPool = dedupeByProximity(uniqueByName(pool))
    .filter((place) => place && place.name)
    .filter((place) => hasUsableCoordinates(place.latitude, place.longitude) || place.city || place.country)
    .filter((place) => isCandidateNearDestination(place, input, location))
    .filter((place) => isValidTouristAttraction(place, input))

  let selected = normalizedPool
  let source = normalizedPool.length >= 3 
    ? (location ? 'overpass+photon' : 'photon') 
    : 'synthetic-fallback'

  if (geocodedSpecifics.length >= 2 || (geocodedSpecifics.length >= 1 && input.durationDays)) {
    selected = dedupeByProximity(geocodedSpecifics)
    source = 'chat-confirmed-places'
  } else if (geocodedSpecifics.length > 0) {
    const specificKeys = new Set(geocodedSpecifics.map(p => normalizePlaceKey(p.name)))
    const remainder = normalizedPool.filter(p => !specificKeys.has(normalizePlaceKey(p.name)))
    selected = dedupeByProximity([...geocodedSpecifics, ...remainder])
    source = 'chat-augmented-places'
  }

  if (selected.length < 3 && normalizedPool.length < 3) {
    console.info('[tour-ai] Lack of geodata candidates. Fetching real suggestions from OpenAI...', { destination: input.destination, city, country })
    const aiFallbacks = await suggestFallbackPlacesWithOpenAI({
      destination: input.destination,
      city,
      country,
      type: input.type,
      canonicalDestination: input.canonicalDestination
    })

    if (aiFallbacks && aiFallbacks.length >= 1) {
      const geocodedFallbacks = await Promise.allSettled(
        aiFallbacks.map(async (item) => {
          const searchQuery = `${item.name} ${city} ${country}`.trim()
          const geo = await geocodePlace(searchQuery).catch(() => null)
          if (geo && validateCandidateLocation(geo, input.canonicalDestination || location, 35)) {
            return {
              name: item.name,
              latitude: geo.latitude,
              longitude: geo.longitude,
              type: item.type || 'tourism',
              category: item.category || input.type || 'historic',
              city,
              country,
              address: geo.name || `${city}, ${item.name}`,
              description: item.description || '',
              tags: { ai_generated_fallback: 'true' }
            }
          }
          return null
        })
      )
      const validFallbacks = geocodedFallbacks
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean)

      if (validFallbacks.length > 0) {
        selected = uniqueByName([...normalizedPool, ...validFallbacks])
        source = 'ai-suggested-fallback'
        console.info('[tour-ai] Successfully validated AI-suggested POIs:', validFallbacks.map(p => p.name))
      }
    }
  }

  if (input.selectedHotel && input.selectedHotel.name) {
    const hotelNameLower = String(input.selectedHotel.name).toLowerCase()
    selected = selected.filter(p => {
      const pNameLower = (p.name || '').toLowerCase()
      return !pNameLower.includes(hotelNameLower) && !hotelNameLower.includes(pNameLower)
    })
  }

  if (selected.length < 3) {
    console.warn('[tour-ai] Insufficient validated POIs for destination:', input.destination)
    return { rawCount: pool.length, places: [], source: 'insufficient-validated-pois' }
  }

  return { rawCount: pool.length, places: selected, source }
}

export function isValidTouristAttraction(place, input) {
  if (!place || !place.name) return false

  const name = place.name.trim()
  const nameKey = normalizeKey(name)
  const nameLower = name.toLowerCase()

  // 0. Bloqueo estricto de metadatos (Presupuesto, Transporte, Alojamiento), comodidades y metadatos de hotel
  if (/\b(presupuesto|transporte|alojamiento|hospedaje|acompañantes|duraci[oó]n|fechas|destino|comodidad|comodidades|comodidades principales|rango de precios|precios?|tarifas?|servicios?|instalaciones|ubicaci[oó]n|hotel|hostal|resort|caba[ñn]a|caba[ñn]as|posada|oleoducto|gasoducto|barrio|sector residencial|urbanizaci[oó]n)\b/i.test(nameLower) && !/^(?:playa|bah[íi]a|isla)\s+[a-z]+/i.test(nameLower)) {
    return false
  }

  // 0.001 Bloqueo de estructuras físicas genéricas o no turísticas (pérgolas, canchas de barrio, paradas de bus)
  if (/^(la\s+)?(p[ée]rgola|cancha|cancha sint[ée]tica|cancha de f[uú]tbol|cancha de microf[uú]tbol|parada de bus|estaci[óo]n de bus|quiosco|kiosco|grader[íi]as)$/i.test(nameLower) ||
      /\b(cancha sint[ée]tica|cancha de f[uú]tbol|parque cancha)\b/i.test(nameLower)) {
    return false
  }

  // 0.002 Bloqueo absoluto de estaciones policiales, CAI, puntos de información burocráticos y oficinas
  if (/\b(polic[íi]a|police|cai|punto de informaci[óo]n|tourist information|oficina de informaci[óo]n|oficina de turismo|alcald[íi]a|juzgado|notar[íi]a|embajada|consulado|banco|atm|cajero|supermercado|farmacia|droguer[íi]a|hospital|cl[íi]nica)\b/i.test(nameLower) ||
      place.tags?.amenity === 'police' ||
      place.tags?.information === 'office' ||
      place.tags?.place === 'neighbourhood' ||
      place.tags?.place === 'suburb' ||
      place.tags?.tourism === 'chalet' ||
      place.tags?.tourism === 'guest_house') {
    return false
  }

  // 0.0 Bloqueo absoluto de cementerios, funerarias, canales inaccesibles y ciudades puras (aplica incluso si vino de chat)
  if (/cementerio|camposanto|jardines de cartagena|jardines del recuerdo|jardines de paz|jardin de paz|parque cementerio|graveyard|cemetery|funeraria|morgue|crematorio|mausoleo/i.test(nameLower)) {
    return false
  }
  if (/canal santa marta|canal del dique|ci[ée]naga grande|ci[ée]naga de la virgen|drenaje|acequia|quebrada|rio frio|r[íi]o fr[íi]o|rio sevilla|r[íi]o sevilla/i.test(nameLower) ||
      place.tags?.waterway === 'canal' ||
      place.tags?.waterway === 'drain' ||
      place.tags?.waterway === 'ditch') {
    return false
  }
  if (/^(santa marta|cartagena|barranquilla|medell[íi]n|bogot[áa]|canc[úu]n|miami|roma|madrid|barcelona|par[íi]s|cusco|cali|colombia|magdalena|bol[íi]var|antioquia|distrito tur[íi]stico|distrito|el poblado|poblado|bocagrande|el rodadero|costazul)$/i.test(nameLower)) {
    return false
  }

  // 0.1 EXCEPCIÓN DE ORO: Si es un lugar o restaurante acordado en el chat / seleccionado por el usuario, SIEMPRE es válido
  const isRequestedByChat = place.rawTags?.requested_place === 'true' || 
                           place.category === 'requested' || 
                           place.isUserSelected === true ||
                           (Array.isArray(input?.specificPlaces) && input.specificPlaces.some(sp => {
                             const spName = typeof sp === 'string' ? sp : (sp?.name || '')
                             const k = normalizePlaceKey(spName)
                             return k && (k === nameKey || nameKey.includes(k) || k.includes(nameKey))
                           })) ||
                           (Array.isArray(input?.selectedPlaces) && input.selectedPlaces.some(sp => {
                             const spName = typeof sp === 'string' ? sp : (sp?.name || '')
                             const k = normalizePlaceKey(spName)
                             return k && (k === nameKey || nameKey.includes(k) || k.includes(nameKey))
                           }))

  if (isRequestedByChat) {
    return true
  }

  const cityKey = normalizeKey(input?.city)
  const destKey = normalizeKey(input?.destination)
  const countryKey = normalizeKey(input?.country)
  
  // 1. Exclude if name matches city, destination or country exactly
  if (nameKey === cityKey || nameKey === destKey || nameKey === countryKey) return false
  
  // 2. Exclude generic words that do not represent a unique attraction
  const genericNames = new Set([
    'restaurante', 'restaurant', 'cafe', 'bar', 'hotel', 'hostal', 'plaza', 'parque', 'museum', 'museo',
    'iglesia', 'church', 'playa', 'beach', 'mirador', 'viewpoint', 'aeropuerto', 'airport',
    'estacion', 'station', 'supermercado', 'supermarket', 'centro', 'mall', 'tienda', 'shop',
    'tourism', 'attraction', 'turismo', 'atraccion'
  ])
  if (genericNames.has(nameKey)) return false
  
  // 3. Exclude generic combinations of "center"
  if (nameKey === `centro-de-${cityKey}` || nameKey === `centro-${cityKey}` || nameKey === `${cityKey}-centro`) return false
  
  // 4. Exclude administrative boundaries, suburbs or regions
  const osmKey = place.tags?.osm_key || ''
  const osmVal = place.tags?.osm_value || place.type || ''
  if (osmKey === 'boundary' || osmKey === 'place' && ['city', 'town', 'village', 'suburb', 'neighbourhood', 'state', 'country', 'continent', 'locality', 'isolated_dwelling'].includes(osmVal)) {
    return false
  }
  if (osmVal === 'administrative') return false

  // 5. Exclude transport infrastructure, airports, terminals, roads, highways, corridors, bypasses or streets
  if (
    /aeropuerto|airport|terminal de transporte|terminal de buses|terminal terrestre|corredor vial|variante|troncal|autopista|via |vía |calle |carrera |avenida |diagonal |transversal |puente |road |street |highway /i.test(nameLower) ||
    /^via |^vía |^calle |^carrera |^avenida |^diagonal |^transversal |^variante |^puente |^autopista |^road |^street |^highway /i.test(nameLower) ||
    /via$|vía$|calle$|carrera$|avenida$|diagonal$|transversal$|variante$|puente$|autopista$|road$|street$|highway$/i.test(nameLower)
  ) {
    return false
  }

  // 6. Exclude administrative, municipality, courts or police offices
  if (/alcaldia|alcaldía|municipalidad|gobernacion|gobernación|juzgado|fiscalia|fiscalía|notaria|notaría|policia|policía|bomberos|defensa civil|ejercito|ejército|armada/i.test(nameLower)) {
    return false
  }

  // 7. Exclude educational centers (schools, universities, kindergartens, campus, institutes, private gyms)
  // unless explicitly classified as a historic site or museum
  const isHistoricOrMuseum = place.category === 'museum' || place.category === 'historic' || place.tags?.historic || place.tags?.tourism === 'museum'
  if (!isHistoricOrMuseum && /colegio|escuela|school|institucion educativa|institución educativa|universidad|university|sena|jardin infantil|jardín infantil|campus|facultad|instituto|aspaen|gimnasio cartagena|gimnasio|gym|fitness|crossfit|academia/i.test(nameLower)) {
    return false
  }

  // 8. Exclude healthcare centers (hospitals, clinics, dentist, pharmacies)
  if (/hospital|clinica|clínica|salud|eps|ips|consultorio|odontologia|odontología|drogueria|droguería|farmacia/i.test(nameLower)) {
    return false
  }

  // 9. Exclude utilities, trash or telecommunication offices (Aguas de Cartagena, acueductos, gas, etc.)
  if (/aguas de cartagena|acueducto|alcantarillado|electricaribe|afinia|epm|gas natural|surtigas|electrificadora|aseo|limpieza|claro|tigo|movistar/i.test(nameLower)) {
    return false
  }

  // 10. Exclude corporate companies, private businesses, law firms, real estate, tech/consulting offices, factories, industrial plants, refineries
  if (
    /\bs\.a\b|\bs\.a\.s\b|\bltda\b|\binc\b|\bcorp\b|\bllc\b|empresa|consultora|consultoria|inmobiliaria|asesores|comercializadora|distribuidora|oficina|despacho|tecnologia|software|logistica|servicios integrales|grupo empresarial|planta|fabrica|fábrica|corrugado|zona franca|sociedad portuaria|terminal de carga|termoelectrica|termoeléctrica|cantera|taller|bodega|industria|industrial|plant|factory|warehouse|freight|corporate center|reficar|cb&i|cbi|refineria|refinería|quimica|química|planta termica|planta térmica/i.test(nameLower)
  ) {
    return false
  }

  // 11. Exclude residential complexes, housing developments, housing areas
  if (
    /conjunto|residencial|urbanizacion|urbanización|barrio|condominio|edificio residencial|residential complex|housing complex|residential area/i.test(nameLower)
  ) {
    return false
  }

  // 12. Exclude specific non-tourist industrial brands and maritime/port operators
  if (
    /holcim|smurfit|vopak|compas|dimar|argos|tecnoglass|termobarranquilla|ecopetrol/i.test(nameLower)
  ) {
    return false
  }

  // 13. Exclude cemeteries and graveyards
  if (/cementerio|camposanto|jardines de cartagena|jardines del recuerdo|jardines de paz|jardin de paz|parque cementerio|graveyard|cemetery|funeraria|morgue/i.test(nameLower)) {
    return false
  }

  // 14. Exclude inaccessible waterways, drainage canals, raw swamps, irrigation canals
  if (/canal santa marta|ci[ée]naga grande|drenaje|acequia|quebrada|rio frio|r[íi]o fr[íi]o|rio sevilla|r[íi]o sevilla/i.test(nameLower)) {
    return false
  }

  // 14. Exclude banks, ATMs, financial entities, gas stations, parking lots
  if (/\bbanco\b|bancolombia|davivienda|bbva|cajero|atm|fiduciaria|financiera|gasolinera|estacionamiento|parqueadero/i.test(nameLower)) {
    return false
  }

  // 15. Exclude open water bodies, generic bays, seas, or maritime polygons (Paradas en tierra firme únicamente)
  if (
    /^(bah[íi]a|bay|mar |mar$|oc[eé]ano|ocean|golfo|gulf|ensenada|cove)\b/i.test(nameLower) ||
    /bah[íi]a de |bay of |mar caribe|bah[íi]a interna|bah[íi]a de cartagena/i.test(nameLower) ||
    place.tags?.natural === 'bay' ||
    place.tags?.natural === 'water' ||
    place.tags?.place === 'sea'
  ) {
    return false
  }

  // 16. Exclude commercial boat rental, yacht charter, jet ski, flyboard and equipment rental agencies
  if (
    /boat rental|yacht rental|jet ski|flyboard|alquiler de yates|alquiler de botes|renta de botes|charter|yate|lancha|bote privado/i.test(nameLower) ||
    place.tags?.shop === 'rental' ||
    place.tags?.amenity === 'boat_rental'
  ) {
    return false
  }

  // 17. Exclude neighborhood non-historic churches, chapels, and evangelical/pentecostal congregations
  if (
    !isHistoricOrMuseum &&
    /pentecost[eé]s|misionero mundial|sal[oó]n del reino|testigos de jehov[aá]|adventista|asamblea de dios|iglesia cristiana|movimiento misionero|tabern[aá]culo|parroquia|capilla de barrio|misi[oó]n cristiana/i.test(nameLower)
  ) {
    return false
  }

  // 18. Exclude hotels, resorts, hostels, and convention centers from being tourist attraction stops
  const isHotelOrResort = /hotel|resort|hostal|hostel|centro de convenciones|estelar /i.test(nameLower)
  if (isHotelOrResort && !place.tags?.requested_place && !isHistoricOrMuseum) {
    return false
  }
  
  return true
}

function isCandidateNearDestination(place, input, location) {
  if (!location) return true
  if (place.tags?.requested_place === 'true' || place.category === 'requested' || place.isUserSelected === true) {
    return true
  }
  const canonicalDest = input.canonicalDestination || (location.latitude && location.longitude ? {
    displayName: location.name || `${location.city}, ${location.country}`,
    city: location.city || input.city,
    country: location.country || input.country,
    countryCode: location.countryCode || '',
    latitude: location.latitude,
    longitude: location.longitude
  } : null)

  if (!canonicalDest) return true

  const isRegionalOrNature = 
    input.type === 'ecological' || 
    input.type === 'sports' || 
    (input.durationHours && input.durationHours >= 12) ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.prompt || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.destination || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.city || '')

  const maxDistanceKm = isRegionalOrNature ? 65 : 35
  return validateCandidateLocation(place, canonicalDest, maxDistanceKm)
}

function findCandidatePlace(name, candidatePlaces, anchorPlace) {
  const key = normalizeKey(name)
  if (!key) return anchorPlace
  
  // 1. Coincidencia exacta
  const exact = candidatePlaces.find((place) => normalizeKey(place.name) === key)
  if (exact) return exact
  
  // 2. Coincidencia donde el candidato contiene la parada (Ej: Parada "Catedral", Candidato "Catedral de Santa Marta")
  const candidateContainsStop = candidatePlaces.find((place) => {
    const placeKey = normalizeKey(place.name)
    return placeKey.includes(key)
  })
  if (candidateContainsStop) return candidateContainsStop

  // 3. Coincidencia donde la parada contiene al candidato, sólo si no es un término genérico muy corto
  const stopContainsCandidate = candidatePlaces.find((place) => {
    const placeKey = normalizeKey(place.name)
    if (placeKey.length < 6) return false
    return key.includes(placeKey)
  })
  if (stopContainsCandidate) return stopContainsCandidate

  return anchorPlace
}



function hasUsableCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
}

function buildSyntheticFallbackPlaces(input, location) {
  const centerLat = location?.latitude ?? 0
  const centerLon = location?.longitude ?? 0
  const baseName = input.city || input.destination || 'Destino'
  const labels = typeFallbackLabels(input.type, baseName)
  return labels.map((label, index) => ({
    name: label.name,
    latitude: centerLat + label.latOffset,
    longitude: centerLon + label.lonOffset,
    type: label.type,
    category: label.category,
    city: input.city,
    country: input.country,
    address: `${baseName} ${index + 1}`,
    tags: { fallback: 'true' },
  }))
}

function typeFallbackLabels(type, baseName) {
  const city = baseName || 'Destino'
  switch (type) {
    case 'gastronomic':
      return [
        { name: `Mercado central de ${city}`, type: 'market', category: 'market', latOffset: 0.0012, lonOffset: 0 },
        { name: `Cafetería emblemática de ${city}`, type: 'cafe', category: 'cafe', latOffset: -0.001, lonOffset: 0.0014 },
        { name: `Ruta de sabores de ${city}`, type: 'restaurant', category: 'restaurant', latOffset: 0.0015, lonOffset: -0.001 },
      ]
    case 'ecological':
      return [
        { name: `Parque natural de ${city}`, type: 'nature', category: 'nature', latOffset: 0.002, lonOffset: 0 },
        { name: `Mirador de ${city}`, type: 'viewpoint', category: 'viewpoint', latOffset: -0.0015, lonOffset: 0.0015 },
        { name: `Sendero de ${city}`, type: 'trail', category: 'trail', latOffset: 0.001, lonOffset: -0.0015 },
      ]
    case 'night':
      return [
        { name: `Centro nocturno de ${city}`, type: 'nightlife', category: 'nightlife', latOffset: 0.0008, lonOffset: 0 },
        { name: `Bar o terraza de ${city}`, type: 'bar', category: 'nightlife', latOffset: -0.001, lonOffset: 0.0012 },
        { name: `Punto panorámico de ${city}`, type: 'viewpoint', category: 'viewpoint', latOffset: 0.0012, lonOffset: -0.0008 },
      ]
    case 'family':
      return [
        { name: `Parque familiar de ${city}`, type: 'family', category: 'family', latOffset: 0.001, lonOffset: 0 },
        { name: `Museo interactivo de ${city}`, type: 'museum', category: 'museum', latOffset: -0.001, lonOffset: 0.001 },
        { name: `Plaza principal de ${city}`, type: 'historic', category: 'historic', latOffset: 0.0015, lonOffset: -0.001 },
      ]
    default:
      return [
        { name: `Centro histórico de ${city}`, type: 'historic', category: 'historic', latOffset: 0.001, lonOffset: 0 },
        { name: `Museo o monumento de ${city}`, type: 'museum', category: 'museum', latOffset: -0.001, lonOffset: 0.001 },
        { name: `Mirador o plaza de ${city}`, type: 'viewpoint', category: 'viewpoint', latOffset: 0.0015, lonOffset: -0.001 },
      ]
  }
}

function fallbackCover(seed) {
  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  ]
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000
  const toRad = (value) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function mapUrlFor(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

function placeIdFor(name, latitude, longitude) {
  return `${name}-${latitude}-${longitude}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function persistTour(tour, route, input, userId) {
  return supabase
    .from('tours')
    .insert({
      owner_id: userId,
      created_by: userId,
      title: tour.nombre_tour,
      country: input.country,
      city: input.city || input.destination,
      type: input.type,
      description: tour.descripcion_tour,
      cover_url: tour.imagen_portada,
      gallery: tour.galeria_tour,
      duration_minutes: Math.round(route.durationHours * 60),
      distance_meters: Math.round(route.distanceKm * 1000),
      is_ai_generated: true,
      is_published: false,
      moderation_status: 'pending',
      tags: tour.etiquetas,
      creation_json: tour,
      short_summary: tour.resumen_corto,
      subcategories: tour.subcategorias,
      featured_experience: tour.experiencia_destacada,
      place_history: tour.historia_del_lugar,
      cultural_context: tour.contexto_cultural,
      available_languages: tour.idiomas_disponibles,
      recommended_audience: tour.publico_recomendado,
      best_season: tour.mejor_epoca,
      recommended_schedule: tour.horario_recomendado,
      meeting_point: tour.punto_encuentro?.nombre_lugar ?? '',
      meeting_point_info: tour.punto_encuentro,
      includes: tour.incluye,
      excludes: tour.no_incluye,
      recommendations: tour.recomendaciones,
      what_to_bring: tour.que_llevar,
      tour_rules: tour.normas_del_tour,
      keywords: tour.palabras_clave,
      main_category: tour.categoria_principal,
      budget: tour.presupuesto_estimado_usd,
      additional_info: tour.informacion_adicional,
    })
    .select('id')
    .single()
    .then(async ({ data, error }) => {
      if (error) throw error
      const filteredStops = tour.itinerario
        .map((stop, index) => {
          const routeStop = route.stops[index] ?? {}
          const stopNameLower = (stop.nombre || "").toLowerCase()
          // Exclude hotel stops from the start or the end of the tour
          const isHotel = stopNameLower.includes('hotel') && (index === 0 || index === tour.itinerario.length - 1)
          if (isHotel) return null

          return {
            name: stop.nombre,
            latitude: routeStop.latitude ?? 0,
            longitude: routeStop.longitude ?? 0,
            image_url: stop.imagenes?.[0] ?? '',
            description: stop.descripcion,
            activities: stop.actividades,
            tips: stop.consejos,
            curious_facts: stop.datos_curiosos,
            location_info: stop.ubicacion,
            images: stop.imagenes,
            suggested_minutes: minutesFromLabel(stop.duracion_estimada),
            is_fallback_image: stop.isFallbackImage || false,
            // Include image_metadata containing day details so the UI loads day groups correctly
            image_metadata: {
              dia: stop.dia ?? 1,
              day: stop.dia ?? 1,
              activities: stop.actividades,
              datos_curiosos: stop.datos_curiosos,
              consejos: stop.consejos,
              location_info: stop.ubicacion
            }
          }
        })
        .filter(stop => stop !== null)

      // Recalculate index and orders to prevent gaps
      const finalStops = filteredStops.map((stop, index) => ({
        tour_id: data.id,
        position: index + 1,
        stop_order: index,
        ...stop
      }))

      if (finalStops.length > 0) {
        const { error: stopError } = await supabase.from('tour_stops').insert(finalStops)
        if (stopError) throw stopError
      }
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Voice Assistant — POST /api/ai/chat/route-assistant
// Classifies the user's voice query and returns a travel-scoped response
// with a structured actionType for the Flutter client to execute.
// ─────────────────────────────────────────────────────────────────────────────
const routeAssistantSchema = z.object({
  userQuery: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tourContext: z.object({
    currentStopName: z.string().optional().default(''),
    city: z.string().optional().default(''),
    country: z.string().optional().default(''),
    hotelName: z.string().optional().default(''),
    hotelAddress: z.string().optional().default(''),
    hotelLat: z.number().optional(),
    hotelLon: z.number().optional()
  }).optional().default({})
})

const ROUTE_ASSISTANT_SYSTEM_PROMPT = `Eres VibeTours Voice, un asistente de voz turístico y amigable que acompaña a turistas durante un recorrido turístico activo. Tu función es responder preguntas sobre el recorrido, gastronomía, puntos de interés, navegación y retorno al alojamiento/hotel/casa.

CLASIFICACIÓN:
- Si la consulta es sobre viajes, turismo, comida/restaurantes, lugares de interés, navegación, regreso al hotel o casa, clima, cultura, etc. → isRelatedToTravel: true.
- Si es ajena al viaje (matemáticas, programación, política, etc.) → isRelatedToTravel: false.

ACCIONES DISPONIBLES (actionType):
1. "SEARCH_RESTAURANTS": el usuario tiene hambre, busca comida, restaurantes, cafés o bares en la zona. (Importante: la búsqueda se realiza alrededor de la posición del usuario).
2. "SEARCH_PLACES": el usuario busca lugares interesantes, atractivos turísticos, miradores, plazas, parques o sitios para ver cerca de su posición.
3. "RETURN_TO_ACCOMMODATION": el usuario quiere regresar a su hotel, alojamiento o casa, o está mencionando/respondiendo el nombre de su hotel o dirección (ej: "Hotel Boutique Casa Carolina", "mi hotel es Casa Carolina", "calle 84 # 51B", "llévame al hotel").
   - Si en el contexto ya existe un hotel confirmado (hotelName / hotelAddress / hotelLat), confírmale de inmediato y con entusiasmo que trazas la ruta hacia su hotel (menciona el nombre del hotel en responseText). NUNCA le pidas la dirección ni el nombre si ya está en el contexto.
   - Si el usuario menciona o responde el nombre de un hotel, hostal o una dirección (ej: "Hotel Boutique Casa Carolina", "mi casa en...", "calle 84 # 51B"), clasifícalo de inmediato como "RETURN_TO_ACCOMMODATION", extrae el nombre o dirección en "destinationAddress" y confirma que trazas la ruta hacia allá.
   - Solo si NO hay ningún hotel en el contexto y el usuario dijo únicamente "llévame a mi hotel / quiero ir a mi hotel" sin mencionar ningún nombre ni dirección, pídele amablemente que te indique el nombre de su hotel.
4. "DESCRIBE_CURRENT_POI": el usuario pide información, historia o curiosidades sobre la parada actual.
5. "CHANGE_DESTINATION": el usuario quiere cambiar de parada o ir a otro punto del recorrido.
6. null: consulta informativa general (clima, tips, etc.).

RESPUESTA (responseText): En español colombiano/latinoamericano, natural, cálido, conciso (máximo 2 oraciones).
Devuelve ÚNICAMENTE un JSON válido con este esquema:
{
  "isRelatedToTravel": boolean,
  "responseText": "string",
  "actionType": "SEARCH_RESTAURANTS" | "SEARCH_PLACES" | "RETURN_TO_ACCOMMODATION" | "DESCRIBE_CURRENT_POI" | "CHANGE_DESTINATION" | null,
  "destinationAddress": "string" // opcional, si el usuario dio una dirección explícita
}`

aiRouter.post('/chat/route-assistant', async (req, res, next) => {
  try {
    const { userQuery, latitude, longitude, tourContext } = routeAssistantSchema.parse(req.body)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return res.status(503).json({
        isRelatedToTravel: false,
        responseText: 'El asistente de voz no está disponible en este momento.',
        actionType: null
      })
    }

    const contextInfo = [
      tourContext?.currentStopName ? `Parada actual: ${tourContext.currentStopName}` : '',
      tourContext?.city ? `Ciudad: ${tourContext.city}` : '',
      tourContext?.country ? `País: ${tourContext.country}` : '',
      tourContext?.hotelName ? `Hotel/Alojamiento confirmado: ${tourContext.hotelName}${tourContext.hotelAddress ? ` (${tourContext.hotelAddress})` : ''}` : '',
      latitude != null ? `Coordenadas actuales del usuario: ${latitude}, ${longitude}` : ''
    ].filter(Boolean).join('. ')

    const userMessage = contextInfo
      ? `Contexto del tour — ${contextInfo}.\n\nPregunta del usuario: "${userQuery}"`
      : `Pregunta del usuario: "${userQuery}"`

    let aiResult = null
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(buildOpenAiPayload({
          messages: [
            { role: 'system', content: ROUTE_ASSISTANT_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          extra: { max_tokens: 300 }
        })),
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (response.ok) {
        const json = await response.json()
        const raw = json.choices?.[0]?.message?.content ?? '{}'
        aiResult = JSON.parse(raw)
      }
    } catch (err) {
      console.warn('[route-assistant] OpenAI call failed:', err.message)
    }

    // Fallback si la IA no respondió
    if (!aiResult || typeof aiResult.isRelatedToTravel !== 'boolean') {
      aiResult = {
        isRelatedToTravel: false,
        responseText: 'Lo siento, no pude procesar tu consulta en este momento. Intenta de nuevo.',
        actionType: null
      }
    }

    let nearbyPlaces = []
    let targetDestination = null

    const centerLat = latitude ?? (tourContext?.hotelLat || 11.0041)
    const centerLon = longitude ?? (tourContext?.hotelLon || -74.8070)

    // 1. Manejo de SEARCH_RESTAURANTS
    if (aiResult.isRelatedToTravel && aiResult.actionType === 'SEARCH_RESTAURANTS') {
      try {
        nearbyPlaces = await overpassNearbyFood(centerLat, centerLon, 1200)
      } catch (_) {}

      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        try {
          nearbyPlaces = await photonFoodFallback(centerLat, centerLon)
        } catch (_) {}
      }
    }

    // 2. Manejo de SEARCH_PLACES
    if (aiResult.isRelatedToTravel && aiResult.actionType === 'SEARCH_PLACES') {
      try {
        const photonSpots = await photonSearch('tourism attraction viewpoint', 10, centerLat, centerLon)
        if (photonSpots && photonSpots.length > 0) {
          nearbyPlaces = photonSpots.map(p => ({
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            type: 'attraction'
          }))
        }
      } catch (_) {}

      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        try {
          nearbyPlaces = await overpassAttractions(centerLat, centerLon, 2500)
        } catch (_) {}
      }
    }

    // 3. Manejo de RETURN_TO_ACCOMMODATION
    if (aiResult.isRelatedToTravel && aiResult.actionType === 'RETURN_TO_ACCOMMODATION') {
      if (tourContext.hotelLat && tourContext.hotelLon) {
        targetDestination = {
          name: tourContext.hotelName || 'Alojamiento',
          latitude: tourContext.hotelLat,
          longitude: tourContext.hotelLon,
          address: tourContext.hotelAddress || '',
          type: 'hotel'
        }
      } else if (aiResult.destinationAddress) {
        const query = `${aiResult.destinationAddress}, ${tourContext.city || ''} ${tourContext.country || ''}`.trim()
        const geo = await geocodePlace(query, centerLat, centerLon).catch(() => null)
        if (geo?.latitude && geo?.longitude) {
          targetDestination = {
            name: aiResult.destinationAddress,
            latitude: geo.latitude,
            longitude: geo.longitude,
            address: aiResult.destinationAddress,
            type: 'hotel'
          }
        }
      } else if (tourContext.hotelName) {
        const query = `${tourContext.hotelName}, ${tourContext.city || ''} ${tourContext.country || ''}`.trim()
        const geo = await geocodePlace(query, centerLat, centerLon).catch(() => null)
        if (geo?.latitude && geo?.longitude) {
          targetDestination = {
            name: tourContext.hotelName,
            latitude: geo.latitude,
            longitude: geo.longitude,
            address: tourContext.hotelAddress || tourContext.hotelName,
            type: 'hotel'
          }
        }
      }
    }

    return res.json({
      isRelatedToTravel: aiResult.isRelatedToTravel,
      responseText: aiResult.responseText,
      actionType: aiResult.actionType ?? null,
      nearbyPlaces: (nearbyPlaces && nearbyPlaces.length > 0) ? nearbyPlaces : undefined,
      targetDestination: targetDestination ?? undefined
    })
  } catch (error) {
    next(error)
  }
})
