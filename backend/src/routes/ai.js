import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'

import { imageForPlace, imageForPlaceWithStatus, wikipediaSummaryText, coastalWikipediaSummary } from '../services/imageSearch.js'
import { geocodePlace, overpassAttractions, photonSearch, overpassHotels, overpassNearbyCities, reverseGeocodeUserCountry, reverseGeocodeLocation, overpassNearbyFood, photonFoodFallback, arePlacesSimilar, isNonTouristFacility, isFoodOrDrinkEstablishment, isDistinctNameMatch, hasVerifiedCoordinates, hasOsmMapRecord, canonicalPlaceId, isWithinCoastalCorridorBounds, isWithinCorridor, computeCorridorProjection } from '../services/osm.js'
import { planWithOpenAI, extractLocation, suggestFallbackPlacesWithOpenAI, fetchCityIconicLandmarks, generateCustomPlaceReasons, generateRichPlaceDescriptionsBatch, extractChatInformation, extractChatInformationFallback, generateChatResponse, filterChatSpecificPlacesByOsm, isTemporalOrDurationPhrase, isNonTouristicInput, getDestinationPresets, generateSpeechAudio, buildOpenAiPayload, fetchOpenAiChatCompletion, hasActiveLlm, getActiveLlmKey, cleanAndParseJson, getRealDestinationCatalog, isLodgingName, isLodgingCategoryOrGeneric, isLodgingExplicitlyConfirmed, isExplicitlyChoosingHotel, isLodgingNegationOrUncertainty, isLodgingRecommendationInquiry, formatHotelPriceRange, getHotelPriceDisplay, deterministicJitter, isValidRouteEndpoint, sanitizeInternalTravelLanguage, DESTINATION_ICONIC_LANDMARKS, DESTINATION_ICONIC_RESTAURANTS } from '../services/openai.js'
import { searchWebForTravel } from '../services/webSearch.js'
import { classifyUserIntent, INTENT_TYPES } from '../services/intentClassifier.js'
import { supabase } from '../services/supabase.js'
import { resolveCanonicalDestination, validateCandidateLocation, haversineDistanceKm, cleanAdministrativeCityName, cleanLandmarkOrPlaceName, FALLBACK_DESTINATION_CENTROIDS } from '../services/destinationService.js'
import { resolvePlaceWithCascade } from '../services/places-resolver.js'
import { getCandidateId } from '../services/candidate-catalog.js'
import { lookupCachedPlacesForCity, saveCachedPlacesBatch } from '../services/places-cache-service.js'
import {
  assignCoastalIslandDays,
  isCoastalIslandsTour,
  isCoastalMappedTouristStop,
  isCoastalRestaurant,
  resolveChatTourTypeAfterExtraction
} from '../services/coastal-islands-policy.js'

import {
  enrichPlaceWithOpenData,
  fetchWikivoyageCityGuide,
  buildDeterministicStopDetails,
  arePlaceNamesSemanticallySame,
  estimateRealisticStopDurationMinutes,
  inferStopSubcategory, clusterStopsIntoCoherentDays, areStopsCompatibleInSameDay, inferPlaceMicroSector,
  discoverDynamicCityLandmarks
} from '../services/open-tourism-service.js'
import { searchTomTomPlaces } from '../services/tomtom.js'

export const aiRouter = Router()

function readPlanCandidateId(stop) {
  if (!stop || typeof stop !== 'object') return ''
  return String(
    stop.candidateId ||
    stop.candidate_id ||
    stop.ubicacion?.candidateId ||
    stop.ubicacion?.candidate_id ||
    stop.locationInfo?.candidateId ||
    stop.locationInfo?.candidate_id ||
    ''
  ).trim()
}

const handleSpeech = async (req, res, next) => {
  try {
    const speechSchema = z.object({
      text: z.string().min(1),
      voice: z.string().optional().default('nova'),
      speed: z.number().min(0.25).max(4.0).optional().default(1.06),
      model: z.string().optional().default('tts-1'),
      provider: z.enum(['auto', 'elevenlabs', 'openai', 'edge', 'free']).optional().default('auto')
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
}

import { speechLimiter, tourGenerationLimiter } from '../middleware/rate-limiter.js'

aiRouter.post('/speech', speechLimiter, handleSpeech)
aiRouter.post('/tts', speechLimiter, handleSpeech)

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
    isAmbiguous: z.boolean().optional().default(false),
    // Keep the geographic identity returned by destinationService. Without
    // these fields Zod stripped the micro-destination flag before the planner
    // could decide whether a regional radius was appropriate.
    entityName: z.string().optional(),
    isMicroDestination: z.boolean().optional().default(false),
    category: z.string().optional(),
    type: z.string().optional()
  }).optional(),
  originPlace: z.string().optional(),
  destinationPlace: z.string().optional(),
  isUserLocationOrigin: z.boolean().optional(),
  cities: z.array(z.string()).optional().default([]),
  isMultiCity: z.boolean().optional().default(false),
  isMultiCountry: z.boolean().optional().default(false),
  tourType: z.string().optional(),
  durationHours: z.number().min(1).max(720).optional(),
  durationDays: z.number().min(1).max(30).optional(),
  type: z.string().optional().default('cultural'),
  transport: z.string().optional(),
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
  selectedHotel: z.record(z.any()).nullable().optional(),
  selectedPlaces: z.array(z.any()).optional().default([]),
  specificPlaces: z.array(z.any()).optional().default([])
})

import {
  TOUR_TRIP_TYPES,
  MICRO_DESTINATION_PATTERN,
  COASTAL_ISLAND_PATTERN,
  normalizeTourType,
  inferTourType,
  geographicScopeFor,
} from '../services/destinationService.js'

export {
  TOUR_TRIP_TYPES,
  MICRO_DESTINATION_PATTERN,
  COASTAL_ISLAND_PATTERN,
  normalizeTourType,
  inferTourType,
  geographicScopeFor,
  applyTourType,
}

function destinationKey(value) {
  return cleanAdministrativeCityName(String(value || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function applyTourType(input, extracted = null) {
  input.tourType = inferTourType(input, extracted)
  return input
}


// Clasificador de tipos de entidad universal para evitar que lugares de distinta categoría se confundan entre sí
export function getPlaceEntityType(placeName) {
  if (!placeName || typeof placeName !== 'string') return 'generic'
  const lower = placeName.toLowerCase()
  if (/\b(museo|museum|galer[íi]a de arte|teatro|monumento|estatua|escultura|castillo|fuerte|muralla|bastion|palacio|puente|bridge)\b/i.test(lower)) return 'cultural'
  if (/\b(parque|jard[íi]n|jardin|bosque|reserva|sendero|cascada|laguna|lago|mirador|bot[áa]nico|botanico|pueblito|ecoparque|ci[eé]naga)\b/i.test(lower)) return 'park_nature'
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
    .replace(/[*_#•\[\]\(\)"“”«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim()
  }

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

// La clave de presentación puede variar (por ejemplo, Casa/Museo del
// Carnaval), pero la clave física debe ser única para planificar y guardar el
// tour. Para lugares no incluidos en identidades canónicas se conserva la
// normalización general existente.
export function canonicalPlaceKey(placeName, city = '') {
  const canonicalId = canonicalPlaceId(placeName, city)
  return canonicalId ? `canonical:${canonicalId}` : `name:${normalizePlaceKey(placeName)}`
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
    const identityKey = canonicalPlaceKey(name)
    if (!key) continue
    const type = getPlaceEntityType(name)

    const existingIdx = result.findIndex(item => {
      const existingName = typeof item === 'string' ? item : (item.name || '')
      const existingKey = normalizePlaceKey(existingName)
      const existingIdentityKey = canonicalPlaceKey(existingName)
      const existingType = getPlaceEntityType(existingName)
      const existingDia = typeof item === 'object' ? (item.dia || item.day) : null

      if (key === existingKey) return true
      if (identityKey.startsWith('canonical:') && identityKey === existingIdentityKey) return true

      // Si tienen categorías explícitas incompatibles (ej: beach_coastal vs cultural, food vs cultural), NUNCA son duplicados
      if (type !== 'generic' && existingType !== 'generic' && type !== existingType) {
        return false
      }

      // NUNCA fusionar un restaurante/establecimiento gastronómico con un lugar no gastronómico
      const isFoodA = type === 'food' || isFoodOrDrinkEstablishment(name)
      const isFoodB = existingType === 'food' || isFoodOrDrinkEstablishment(existingName)
      if (isFoodA !== isFoodB) {
        return false
      }

      // Si están en días explícitamente distintos y las claves no son 100% idénticas, no fusionar
      if (dia != null && existingDia != null && Number(dia) !== Number(existingDia) && key !== existingKey) {
        return false
      }

      // Substring match: only when both keys have multi-word distinctive phrases and significant length
      if (key.length >= 6 && existingKey.length >= 6) {
        const wordsA = key.split(' ').filter(w => w.length >= 3)
        const wordsB = existingKey.split(' ').filter(w => w.length >= 3)
        if (wordsA.length > 1 && wordsB.length > 1) {
          if (key.includes(existingKey) || existingKey.includes(key) || arePlaceNamesSemanticallySame(name, existingName)) return true
        }
      }
      return false
    })

    const entry = typeof p === 'object'
      ? {
          ...p,
          name,
          ...(dia ? { dia: Number(dia), day: Number(dia) } : {})
        }
      : name

    if (existingIdx === -1) {
      result.push(entry)
    } else {
      const existing = result[existingIdx]
      const existingName = typeof existing === 'string' ? existing : (existing.name || '')
      const existingDia = typeof existing === 'object' ? (existing.dia || existing.day) : null
      // Cuando dos alias apuntan al mismo lugar, conservar el primer día
      // asignado para no mover una parada por una segunda mención de la IA.
      const finalDia = existingDia ?? dia
      if (name.length > existingName.length && /[A-Z]/.test(name)) {
        result[existingIdx] = (typeof p === 'object' || typeof existing === 'object')
          ? {
              ...(typeof existing === 'object' ? existing : {}),
              ...(typeof p === 'object' ? p : {}),
              name,
              ...(finalDia ? { dia: Number(finalDia), day: Number(finalDia) } : {})
            }
          : (finalDia ? { name, dia: Number(finalDia), day: Number(finalDia) } : name)
      } else if (typeof result[existingIdx] === 'object' || typeof p === 'object') {
        result[existingIdx] = {
          ...(typeof p === 'object' ? p : {}),
          ...(typeof result[existingIdx] === 'object' ? result[existingIdx] : {}),
          name: existingName,
          ...(finalDia ? { dia: Number(finalDia), day: Number(finalDia) } : {})
        }
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
  const cleanAscii = cleanLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
  const isGenericFragment = /^(local|un local|el local|restaurante|el restaurante|un restaurante|bar|el bar|un bar|caf[ée]|el caf[ée]|un caf[ée]|restaurante local|un restaurante local|bar local|la zona|zona|en la zona|la ciudad|ciudad|en la ciudad|casa propia|alojamiento propio|en casa|casa|casa de un familiar|casa familiar|para explorar|explorar|fiesta nocturna|las cascadas|cascadas|el r[íi]o|r[íi]o|tubbing en el r[íi]o|tubbing|tubing|la playa|playa|playas|las playas|el mar|la costa|la bahía|la bahia|la montaña|la sierra|el parque|la plaza)$/i.test(cleanLower)
  if (isGenericFragment) return false

  // 2.2.1 Descartar frases superlativas o genéricas cualitativas (ej. "los lugares más bonitos", "mejores atractivos", "sitios turísticos")
  if (/\b(?:lugares|sitios|atractivos|puntos|zonas|rincones)\s+(?:m[aá]s|mejores|bonitos|lindos|bellos|populares|tur[íi]sticos|emblem[aá]ticos|destacados|principales)\b/i.test(cleanLower) ||
      /\b(?:los\s+|las\s+)?(?:mejores|principales|m[aá]s\s+(?:bonitos|lindos|bellos|populares|destacados))\s+(?:lugares|sitios|atractivos|puntos|zonas)\b/i.test(cleanLower)) {
    return false
  }

  // 2.3 Descartar estructuras físicas genéricas o no turísticas que no son atracciones (canchas de barrio, paradas de bus, pérgolas)
  if (/^(la\s+)?(p[ée]rgola|cancha|cancha sint[ée]tica|cancha de f[uú]tbol|cancha de microf[uú]tbol|parada de bus|estaci[óo]n de bus|quiosco|kiosco|grader[íi]as)$/i.test(cleanLower) ||
      /\b(cancha sint[ée]tica|cancha de f[uú]tbol|parque cancha)\b/i.test(cleanLower)) {
    return false
  }

  // 2.3.1 Descartar infraestructura de descanso urbano, bancas de descanso o plazoletas hospitalarias
  if (
    /\b(plaza|parque|plazoleta|zona|area)\s+(?:descanso(?:\s*\d+)?|hospital|salud|clinica|ips|eps)\b/i.test(cleanLower) ||
    /\bdescanso\s*\d+\b/i.test(cleanLower) ||
    /\bplaza\s+descanso\b/i.test(cleanLower) ||
    /\bplaza\s+hospital\b/i.test(cleanLower)
  ) {
    return false
  }

  // 2.4 Descartar infraestructura industrial (oleoductos, gasoductos, tuberías, refinerías, plantas)
  if (/\b(oleoducto|gasoducto|poliducto|refiner[íi]a|tuber[íi]a|estaci[oó]n de bombeo|planta de tratamiento|patio de tanques|cenit|ecopetrol)\b/i.test(cleanLower)) {
    return false
  }

  // 2.5 Descartar tiendas, supermercados, droguerías, ferreterías y almacenes cotidianos
  if (/\b(supermercado|drogueria|farmacia|ferreteria|almacen|almacen de cadena|minimarket|estanco|miscelanea|bodega de|deposito de|alkosto|exito|carulla|olimpica|jumbo|makro|pricesmart|tiendas d1|d1|tiendas ara|ara|homecenter|falabella|sodimac|panamericana)\b/i.test(cleanAscii) ||
      /\b(supermercado|droguer[íi]a|farmacia|ferreter[íi]a|almac[ée]n|minimarket|estanco|miscel[aá]nea|alkosto|carulla|jumbo|makro|pricesmart|tiendas d1|d1|tiendas ara|homecenter|falabella)\b/i.test(cleanLower)) {
    return false
  }

  // 2.6 Descartar agencias de viajes comerciales, operadores turísticos y venta de pasajes
  if (/\b(agencia\s+de\s+viajes?|viajes\s+y\s+turismo|turismo\s+internacional|tour\s+operator|travel\s+agency|travel\s+and\s+tours?|operador\s+tur[ií]stico|operadores\s+tur[ií]sticos|mayorista\s+de\s+turismo|venta\s+de\s+tiquetes|ticket\s+office|asesores?\s+de\s+viajes?)\b/i.test(cleanLower)) {
    return false
  }

  // 2.7 Descartar denominaciones genéricas aisladas sin nombre propio distintivo
  if (/^(?:parque\s+nacional|plaza\s+de\s+mercado|plaza\s+de\s+mercado\s+central|centro\s+comercial|zona\s+rosa|centro\s+historico|centro)$/i.test(cleanLower)) {
    return false
  }

  // 2.8 Descartar oficinas gremiales, asociaciones y fundaciones administrativas
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

  // 5.1 Descartar fiestas, carnavales y festivales de calendario a menos que indiquen una sede física permanente (casa, museo, centro, parque, plaza)
  if (/\b(carnaval\s+de|festival\s+de|feria\s+de|fiesta\s+del?|reinado\s+de|desfile\s+de)\b/i.test(cleanLower)) {
    const isPhysicalVenue = /\b(museo|casa|centro|parque|plaza|sala|galer[íi]a|teatro|estadio|concha|complejo)\b/i.test(cleanLower)
    if (!isPhysicalVenue) return false
  }

  // 5.2 Descartar sedes universitarias, facultades y dependencias académicas no turísticas
  if (/\b(universidad\s+sim[oó]n\s+bol[íi]var|sede\s+\d+|facultad\s+de|instituto\s+t[ée]cnico|sena\s+-\s+hoteler[íi]a)\b/i.test(cleanLower)) {
    const isMajorHeritage = /\b(jard[íi]n\s+bot[áa]nico|museo|bellas\s+artes|teatro)\b/i.test(cleanLower)
    if (!isMajorHeritage) return false
  }

  // 6. Descartar si es país o "Ciudad, País"
  if (/, (m[ée]xico|espa[ñn]a|colombia|ee\.?\s*uu\.?|estados unidos|francia|italia|brasil|argentina|per[úu]|chile|reino unido|alemania)\b/i.test(cleanLower)) {
    return false
  }

  // 7. Descartar nombres de ciudades, regiones o departamentos puros o con preposiciones
  const isCityOnly = /^(?:a\s+|en\s+|hacia\s+|por\s+|desde\s+)?(cartagena|barranquilla|medell[íi]n|bogot[áa]|santa marta|canc[úu]n|miami|roma|madrid|barcelona|par[íi]s|toledo|cusco|orlando|nueva york|new york|cali|colombia|magdalena|bol[íi]var|antioquia|distrito tur[íi]stico|distrito)$/i.test(cleanLower)
  if (isCityOnly) return false

  // 8. Descartar horarios, etapas temporales del día y etiquetas de parada aisladas
  if (/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i.test(cleanLower) ||
      /^(\d{1,2}:\d{2}\s*(?:am|pm)?\s*[-–—]?\s*)?(?:media\s+mañana|mañana|almuerzo|tarde|noche|llegada\s*\/\s*cierre|cierre|llegada\s+a\s+destino|parada\s+\d+)$/i.test(cleanLower)) {
    return false
  }

  return true
}

// Extrae paradas estructuradas y sus días correspondientes a partir del texto generado en el chat
export function extractPoisFromText(text) {
  if (!text || typeof text !== 'string') return []
  const found = []
  const ACTION_PREFIX_REGEX = /^(?:visita\s+(?:a\s+la|al?|a)?|recorrid(?:o|a)\s+(?:por\s+el?|en\s+el?|por|en)?|explora(?:r|ci[óo]n)?\s+(?:de\s+la|del?|el?|la)?|paseo\s+(?:en\s+lancha\s+a\s+la|en\s+lancha\s+a|en\s+barco\s+a|en\s+lancha\s+por|en\s+lancha|en|por)?|excursi[óo]n\s+(?:a\s+la|al?|a|hacia|por)?|caminata\s+(?:hacia\s+la|hacia|a\s+la|al?|a|por)?|tour\s+(?:en\s+lancha\s+por|por\s+el?|de\s+snorkel\s+en|de\s+degustaci[óo]n\s+gastron[óo]mica|de|por|en)?|explorar\s+la\s+vida\s+nocturna\s+en\s+el?|explorar\s+la\s+vida\s+nocturna\s+en|vida\s+nocturna\s+en\s+el?|vida\s+nocturna\s+en|vida\s+nocturna|cenar\s+en|cenar|almorzar\s+en|almorzar|cena\s+y\s+diversi[oó]n\s+en|cena\s+en\s+un\s+restaurante\s+en|cena\s+en\s+un\s+restaurante\s+t[íi]pico|cena\s+en\s+un\s+restaurante|cena\s+en\s+un\s+local\s+de\s+la|cena\s+en\s+un\s+local|cena\s+en\s+un\s+bar\s+local|cena\s+en\s+un\s+bar|cena\s+de\s+despedida\s+en|cena\s+de\s+despedida|cena\s+en|cena|almuerzo\s+en\s+un\s+restaurante\s+local|almuerzo\s+en\s+un\s+restaurante|almuerzo\s+en\s+el\s+centro|almuerzo\s+en\s+la\s+playa|almuerzo\s+en|almuerzo|noche\s+en|noche|tarde\s+en|tarde\s+de\s+relax\s+en|tarde\s+libre\s+para\s+(?:compras\s+o\s+descanso|compras|descanso|explorar\s+el?|explorar)|tarde\s+libre|d[íi]a\s+de\s+playa\s+en|d[íi]a\s+de\s+relax\s+en|d[íi]a\s+en|d[íi]a\s+libre\s+para\s+explorar[^->\n]*|d[íi]a\s+libre|tiempo\s+libre\s+para\s+visitar\s+el?|tiempo\s+libre\s+para\s+visitar|tiempo\s+libre\s+para\s+explorar|tiempo\s+libre|check-in\s+en|check-in|check-out\s+en|check-out|instalaci[oó]n\s+en\s+(?:casa|el\s+hotel|el\s+alojamiento|hotel)|instalaci[oó]n|picnic\s+(?:o\s+almuerzo\s+en\s+la\s+zona|en\s+la\s+zona|en\s+la\s+playa|en)|[uú]ltimos\s+momentos\s+para\s+(?:disfrutar\s+de\s+la\s+ciudad|disfrutar|explorar)|participaci[oó]n\s+en\s+(?:alg[uú]n\s+)?evento\s+cultural|llegada\s+a\s+la|llegada\s+al?|llegada\s+a|llegada\s*\/\s*hotel[^->\n]*|llegada|salida\s+a|salida\s+de|salida|regreso\s+a\s+casa|regreso\s+a\s+santa\s+marta|regreso\s+a\s+barranquilla|regreso\s+a|regreso\s+y\s+cena\s+de\s+despedida|regreso\s+y\s+cena\s+de|regreso\s+y\s+cena|regreso|despedida\s+de\s+[^->\n]+|despedida)\s+/i

  function cleanAndAddCandidate(rawCandidate, day) {
    if (!rawCandidate || typeof rawCandidate !== 'string') return
    let raw = rawCandidate
      .replace(/^(?:•|\-|\*|\d+[\.\)])\s*/, '')
      .replace(/^[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D\s]+/u, '')
      .trim()

    // 0. Descartar si es exclusivamente una etiqueta de horario o etapa del día
    const isPureStageOrTime = /\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i.test(raw) ||
      /^(\d{1,2}:\d{2}\s*(?:am|pm)?\s*[-–—]?\s*)?(?:media\s+mañana|mañana|almuerzo|tarde|noche|llegada\s*\/\s*cierre|cierre|parada\s+\d+)$/i.test(raw)
    if (isPureStageOrTime) {
      const colonIdx = raw.indexOf(':')
      if (colonIdx !== -1) {
        const afterColon = raw.slice(colonIdx + 1).trim()
        if (afterColon) {
          cleanAndAddCandidate(afterColon, day)
        }
      }
      return
    }

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

    // Stop extracting stops if we reach an alternatives or suggestions section
    if (
      /\b(?:aqu[íi]\s+tienes\s+(?:algunas\s+)?(?:excelentes\s+)?alternativas|alternativas(?:\s+disponibles)?|otras\s+alternativas|sugerencias|lugares\s+recomendados|opciones\s+recomendadas|opciones\s+de\s+(?:comida|restaurante|alojamiento)|restaurantes\s+recomendados|hoteles\s+recomendados)\b/i.test(line) ||
      (found.length > 0 && /^(?:ind[íi]came\s+cu[aá]l|¿deseas\s+confirmar|¿te\s+gusta|¿qu[ée]\s+te\s+parece|¿est[áa]\s+todo\s+listo)\b/i.test(line))
    ) {
      break
    }

    const dayMatch = line.match(/(?:•|\-|\*|\d+[\.\)])?\s*D[íi]a\s*(\d+)/i)
    if (dayMatch) {
      currentDay = parseInt(dayMatch[1], 10)
      if (!line.includes('->') && !line.includes('—') && !line.includes('–')) {
        continue
      }
    }

    // Omitir líneas de metadatos o parámetros de viaje
    if (/^(?:•|\-|\*|\d+[\.\)])?\s*(?:alojamiento|hospedaje|hotel|transporte|presupuesto|acompañantes|fechas|duraci[óo]n|destino|resumen|notas|gastos|itinerario)\s*:/i.test(line)) {
      continue
    }

    // CRITICAL: Únicamente procesar líneas con viñetas (•, -, *), numeradas (1., 2.) o con flechas (->)
    // Nunca extraer negritas de oraciones conversacionales o de saludo (ej. "Diseñé un tour hasta **Destino**...")
    const isBulletOrNumbered = /^(?:•|\-|\*|\d+[\.\)])/.test(line)
    const hasSequenceArrow = /->|—|–|>/.test(line)
    if (!isBulletOrNumbered && !hasSequenceArrow) {
      continue
    }

    // 1. Extraer elementos separados por flechas (-> o —) en la línea
    if (hasSequenceArrow) {
      const content = line.replace(/^(?:•|\-|\*|\d+[\.\)])?\s*D[íi]a\s*\d+\s*:\s*/i, '')
      const parts = content.split(/->|—|–|>/)
      for (const part of parts) {
        cleanAndAddCandidate(part, currentDay)
      }
    } else {
      // Limpiar viñeta y prefijos de horario/etapa
      let content = line.replace(/^(?:•|\-|\*|\d+[\.\)])\s*/, '')
      content = content.replace(/^[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D\s]+/u, '')
      content = content.replace(/^(?:(?:\*\*)?\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–—]?\s*(?:[^\n:*]{2,30})?(?:\*\*)?\s*[:—\-]\s*)/i, '')

      // 2. Extraer negritas específicas si las hay (**Nombre**)
      const boldRegex = /\*\*([^*\n]{3,60})\*\*/g
      let bm
      let foundBold = false
      while ((bm = boldRegex.exec(content)) !== null) {
        const boldCand = bm[1].replace(ACTION_PREFIX_REGEX, '').trim()
        if (isValidSpecificPlace(boldCand)) {
          cleanAndAddCandidate(boldCand, currentDay)
          foundBold = true
        }
      }

      // 3. Extraer contenido limpio de la viñeta si no hubo negritas
      if (!foundBold) {
        cleanAndAddCandidate(content, currentDay)
      }
    }
  }
  return deduplicatePlacesByName(found)
}

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const chatSchema = z.object({
      message: z.string(),
      history: z.array(z.object({ role: z.string(), content: z.string() })).optional().default([]),
      currentPreferences: z.record(z.any()).optional().default({}),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      currency: z.string().optional().default('cop')
    })
    const { message, history, currentPreferences, latitude, longitude, currency } = chatSchema.parse(req.body)
    const effectiveCurrency = (currency || currentPreferences.currency || 'cop').toLowerCase()
    currentPreferences.currency = effectiveCurrency

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

    // Precalentar en paralelo los datos que el flujo normal necesitará
    // después. Solo disparamos la búsqueda de catálogo pesado cuando el usuario
    // explícitamente confirme o solicite armar el itinerario / tour.
    const isExplicitBuildOrItineraryRequest = Boolean(
      currentPreferences?.readyToBuild ||
      /\b(gener(ar|es|a|e|en|al)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|cre(ar|es|a|e|en)?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|plan|mapa)|inicia(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|finaliza(r)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|constru(ye|ir)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|dise[ñn](ar|a|es|e)?\s+(el\s+|la\s+)?(tour|itinerario|ruta)|armar?\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje)|adelante\s+(con\s+el\s+tour|genera|crea|construye|procede)|vamos\s+(a\s+)?(generar|crear)\s+(el\s+|la\s+)?(tour|itinerario|ruta)|c[oó]mo\s+(va|queda)\s+(el\s+|mi\s+)?itinerario|mostrar?\s+(el\s+|mi\s+)?itinerario|mu[eé]strame\s+(el\s+|mi\s+)?itinerario|ver\s+(el\s+|mi\s+)?itinerario|plan\s+de\s+viaje|detalles\s+del\s+d[íi]a)\b/i.test(message)
    )
    const quickExtracted = extractChatInformationFallback(message)
    const isLocationRequestEarly = Boolean(
      quickExtracted?.tourType === 'location_to_destination' ||
      quickExtracted?.isUserLocationOrigin ||
      (quickExtracted?.originPlace === 'user_current_location') ||
      /\b(desde\s+mi\s+ubicaci[oó]n|de\s+mi\s+ubicaci[oó]n|saliendo\s+de\s+mi\s+ubicaci[oó]n|desde\s+donde\s+estoy|desde\s+aqu[íi]|desde\s+ac[aá])\b/i.test(message)
    )
    const existingCanonical = currentPreferences.canonicalDestination
    const preloadDestination = existingCanonical?.city ||
      existingCanonical?.entityName ||
      currentPreferences.city ||
      currentPreferences.destination ||
      quickExtracted?.city ||
      quickExtracted?.destination ||
      ''
    const preloadDestinationKey = destinationKey(preloadDestination)
    const existingCanonicalIsUsable = Boolean(
      existingCanonical &&
      Number.isFinite(Number(existingCanonical.latitude)) &&
      Number.isFinite(Number(existingCanonical.longitude))
    )
    const canonicalWarmup = (isLocationRequestEarly || !preloadDestinationKey)
      ? Promise.resolve(null)
      : (existingCanonicalIsUsable
        ? Promise.resolve(existingCanonical)
        : resolveCanonicalDestination(preloadDestination).catch(() => null))
    const catalogWarmup = (!isLocationRequestEarly && isExplicitBuildOrItineraryRequest && preloadDestinationKey)
      ? canonicalWarmup.then(canonical => {
          if (!canonical || !Number.isFinite(Number(canonical.latitude)) || !Number.isFinite(Number(canonical.longitude))) {
            return null
          }
          return getRealDestinationCatalog(
            canonical.city || canonical.entityName || preloadDestination,
            canonical.country || currentPreferences.country || 'Colombia',
            Number(canonical.latitude),
            Number(canonical.longitude),
            {
              requestedDays: Number(currentPreferences.durationDays || quickExtracted?.durationDays || 0),
              tourType: currentPreferences.tourType || quickExtracted?.tourType
            }
          ).catch(() => null)
        })
      : Promise.resolve(null)

    // 1. Extraer preferencias de forma ultrarrápida (single-pass: intención + extracción determinista en 0ms)
    const intentEval = classifyUserIntent(message, currentPreferences)
    if (intentEval?.intent === INTENT_TYPES.AMBIGUOUS && intentEval?.needsClarification) {
      const promptText = intentEval.clarificationPrompt
      const options = intentEval.options || []
      const chips = options.map(o => (typeof o === 'string' ? o : (o.label || o.id || '')))
      return res.json({
        responseMessage: promptText,
        message: promptText,
        botMessage: promptText,
        intentEval,
        preferences: currentPreferences,
        updatedPreferences: currentPreferences,
        options,
        actionChips: chips.filter(Boolean),
        destinationSuggestions: [],
        readyToBuild: false,
        needsClarification: true
      })
    }

    const extracted = extractChatInformationFallback(message)

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
    // Discard any bogus destination/city extracted from verbs or money phrases (e.g. "mover", "pesos", "nos vamos")
    if (validExtracted.destination && !isValidRouteEndpoint(validExtracted.destination)) {
      delete validExtracted.destination
      delete validExtracted.canonicalDestination
    }
    if (validExtracted.city && !isValidRouteEndpoint(validExtracted.city)) {
      delete validExtracted.city
    }
    if (validExtracted.originPlace && !isValidRouteEndpoint(validExtracted.originPlace)) {
      delete validExtracted.originPlace
      validExtracted.isMultiCity = false
    }
    if (validExtracted.destinationPlace && !isValidRouteEndpoint(validExtracted.destinationPlace)) {
      delete validExtracted.destinationPlace
      validExtracted.isMultiCity = false
    }

    // Safeguard: Protect confirmed destination from accidental overwrite when user mentions day stops or attractions
    const hasExistingCity = Boolean(currentPreferences.city || currentPreferences.destination)
    const isCorrectionOrNegation = /\b(te equivocaste|es de|son de|queda en|quedan en|no es de|no son de|no queda en|no quedan en|confusi[oó]n|en realidad|pertenece a|pertenecen a|equivocaci[oó]n|eso est[aá] en)\b/i.test(message)
    const isExplicitCityChange = /\b(cambiemos a|cambiar a|cambiar destino|nuevo destino|mejor vamos a|ahora quiero ir a|vamos mejor a|prefiero ir a)\b/i.test(message)
    const isExplicitMultiRoute = Boolean(
      (validExtracted.isMultiCity || validExtracted.isMultiCountry) &&
      isValidRouteEndpoint(validExtracted.originPlace) &&
      isValidRouteEndpoint(validExtracted.destinationPlace) &&
      /\b(tour\s+(?:de|desde)|ruta\s+(?:de|desde|entre)|road\s*trip|viaje\s+(?:de|desde)|de\s+[a-záéíóúñ]{3,20}\s+a\s+[a-záéíóúñ]{3,20})\b/i.test(message)
    )
    const isExplicitLocationToDestination = Boolean(
      currentPreferences.tourType === 'location_to_destination' ||
      currentPreferences.isUserLocationOrigin ||
      (currentPreferences.originPlace === 'user_current_location') ||
      validExtracted.tourType === 'location_to_destination' ||
      validExtracted.isUserLocationOrigin ||
      (validExtracted.originPlace === 'user_current_location') ||
      /\b(desde\s+mi\s+ubicaci[oó]n|de\s+mi\s+ubicaci[oó]n|saliendo\s+de\s+mi\s+ubicaci[oó]n|desde\s+donde\s+estoy|desde\s+aqu[íi]|desde\s+ac[aá])\b/i.test(message)
    )

    if (isExplicitLocationToDestination) {
      validExtracted.tourType = 'location_to_destination'
      validExtracted.isUserLocationOrigin = true
      validExtracted.originPlace = 'user_current_location'
      validExtracted.durationDays = 1
      validExtracted.durationHours = 8
      validExtracted.accommodationStatus = 'Alojamiento no requerido / Tour de 1 día'
      delete validExtracted.selectedHotel
      delete currentPreferences.selectedHotel
      delete currentPreferences.accommodationStatus
      if (!currentPreferences.transport && !validExtracted.transport) {
        validExtracted.transport = 'Vehículo / Taxi'
      }
      if (!currentPreferences.budget && !validExtracted.budget) {
        validExtracted.budget = 'Moderado'
      }
      const newCorridorDest = validExtracted.destination || validExtracted.destinationPlace
      if (newCorridorDest) {
        currentPreferences.destination = newCorridorDest
        currentPreferences.destinationPlace = newCorridorDest
        currentPreferences.city = validExtracted.city || newCorridorDest
        delete currentPreferences.canonicalDestination
        currentPreferences.specificPlaces = []
        validExtracted.destination = newCorridorDest
        validExtracted.destinationPlace = newCorridorDest
        validExtracted.city = validExtracted.city || newCorridorDest
        validExtracted.specificPlaces = []
      }
    }

    if (hasExistingCity && !isExplicitCityChange && !isExplicitMultiRoute && !isExplicitLocationToDestination) {
      const existingBaseCity = (currentPreferences.destination || currentPreferences.city || '').toLowerCase().trim()
      const newDest = (validExtracted.destination || '').toLowerCase().trim()

      const isSubordinateParkOrAttraction = (dest) => {
        if (!dest) return false
        return /tayrona|minca|guatap[eé]|valle de cocora|islas del rosario|isla bar[uú]|san bernardo|taganga|rodadero/i.test(dest) ||
               /\b(parque|reserva|isla|playa|valle|mirador)\b/i.test(dest)
      }

      if (isSubordinateParkOrAttraction(validExtracted.destination) || (newDest && newDest !== existingBaseCity)) {
        console.info(`[ai/chat] Preserving base hub destination "${currentPreferences.destination || currentPreferences.city}" - keeping mentioned "${validExtracted.destination || validExtracted.city}" as a day stop.`)
        
        if (validExtracted.destination && !/^(santa marta|cartagena|medell[íi]n|bogot[áa])$/i.test(validExtracted.destination) && isValidRouteEndpoint(validExtracted.destination)) {
          if (!validExtracted.specificPlaces) validExtracted.specificPlaces = []
          const alreadyHas = validExtracted.specificPlaces.some(p => (typeof p === 'string' ? p : p.name).toLowerCase().includes(validExtracted.destination.toLowerCase()))
          if (!alreadyHas) {
            validExtracted.specificPlaces.push({ name: validExtracted.destination, dia: 2 })
          }
        }
        delete validExtracted.city
        delete validExtracted.destination
        delete validExtracted.canonicalDestination
        delete validExtracted.originPlace
        delete validExtracted.destinationPlace
        delete validExtracted.cities
        validExtracted.isMultiCity = false
      }
    } else if (!hasExistingCity && validExtracted.destination) {
      const isSubordinateParkOrAttraction = (dest) => {
        if (!dest) return false
        return /tayrona|minca|guatap[eé]|valle de cocora|islas del rosario|isla bar[uú]|san bernardo|taganga|rodadero/i.test(dest) ||
               /\b(parque|reserva|isla|playa|valle|mirador)\b/i.test(dest)
      }
      if (isSubordinateParkOrAttraction(validExtracted.destination)) {
        let catalogHub = null
        if (!validExtracted.city || isSubordinateParkOrAttraction(validExtracted.city)) {
          const lowerM = message.toLowerCase()
          for (const [k, c] of Object.entries(FALLBACK_DESTINATION_CENTROIDS)) {
            if (!c.isMicroDestination && k.length > 3 && new RegExp(`\\b${k}\\b`, 'i').test(lowerM)) {
              catalogHub = c.city || c.entityName
              break
            }
          }
        }
        const hubInMessage = message.match(/\b(santa marta|cartagena|medell[íi]n|bogot[áa]|barranquilla|cali|bucaramanga|pereira)\b/i)
        const detectedHub = (validExtracted.city && !isSubordinateParkOrAttraction(validExtracted.city))
          ? validExtracted.city
          : (catalogHub || (hubInMessage ? hubInMessage[1] : null))

        if (detectedHub) {
          console.info(`[ai/chat] Promoting base hub city "${detectedHub}" as primary destination and saving "${validExtracted.destination}" as specific place.`)
          if (!validExtracted.specificPlaces) validExtracted.specificPlaces = []
          const alreadyHas = validExtracted.specificPlaces.some(p => (typeof p === 'string' ? p : p.name).toLowerCase().includes(validExtracted.destination.toLowerCase()))
          if (!alreadyHas) {
            const targetDay = Number(validExtracted.durationDays) === 1 ? 1 : 2
            validExtracted.specificPlaces.push({ name: validExtracted.destination, dia: targetDay, day: targetDay })
          }
          validExtracted.destination = cleanAdministrativeCityName(detectedHub)
          validExtracted.city = cleanAdministrativeCityName(detectedHub)
          delete validExtracted.canonicalDestination
        }
      }
    }

    const updatedPreferences = {
      ...currentPreferences,
      ...validExtracted
    }
    const priorDestinationKey = destinationKey(
      currentPreferences.canonicalDestination?.city ||
      currentPreferences.canonicalDestination?.entityName ||
      currentPreferences.city ||
      currentPreferences.destination
    )
    const mergedDestinationKey = destinationKey(
      updatedPreferences.canonicalDestination?.city ||
      updatedPreferences.canonicalDestination?.entityName ||
      updatedPreferences.city ||
      updatedPreferences.destination
    )
    const destinationChanged = Boolean(
      priorDestinationKey && mergedDestinationKey && priorDestinationKey !== mergedDestinationKey
    )
    const conversationUserText = [
      ...(Array.isArray(history) ? history.filter(item => item?.role === 'user').map(item => item.content || item.text || '') : []),
      message
    ].join(' ')
    const resolvedChatTourType = resolveChatTourTypeAfterExtraction(
      currentPreferences,
      validExtracted,
      conversationUserText,
      { destinationChanged }
    )
    if (destinationChanged && !resolvedChatTourType) {
      delete updatedPreferences.tourType
    } else {
      updatedPreferences.tourType = resolvedChatTourType || updatedPreferences.tourType
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
    const isChoosingHotel = isExplicitlyChoosingHotel(message)
    const isHomeOrLocalLodging = /\b(en mi casa|mi casa|casa de un familiar|casa de familiares|casa de un amigo|casa de amigos|casa de mis padres|vivo aqu[íi]|vivo en la ciudad|es mi ciudad|ya tengo hospedaje|ya tengo alojamiento|ya tengo hotel|ya tengo donde quedarme|no necesito hotel|no requiero hotel|alojamiento propio|hospedaje propio|en casa)\b/i.test(message)
    const lastAssistantMsgForLodging = [...(history || [])].reverse().find(h => h && (h.role === 'assistant' || h.role === 'bot'))?.content || ''
    const isNegatedOrAskingLodging = isLodgingNegationOrUncertainty(message) || isLodgingRecommendationInquiry(message, lastAssistantMsgForLodging)

    // Check for ordinal choice mapping to previously offered hotels
    const ordinalMatch = message.trim().match(/^(?:(?:ok\s+|perfecto\s+|listo\s+)?(?:el\s+(primero|segundo|tercero)|la\s+(primera|segunda|tercera)(?:\s+opci[oó]n)?|opci[oó]n\s*([1-3])|([1-3])))\b/i)
    if (ordinalMatch && !isLodgingExplicitlyConfirmed(updatedPreferences.selectedHotel, updatedPreferences.accommodationStatus) && !isNegatedOrAskingLodging) {
      const lastAssistantMsg = lastAssistantMsgForLodging
      if (lastAssistantMsg) {
        let targetIndex = 0
        const word = (ordinalMatch[1] || ordinalMatch[2] || ordinalMatch[3] || ordinalMatch[4] || '').toLowerCase()
        if (word === 'primero' || word === 'primera' || word === '1') targetIndex = 0
        else if (word === 'segundo' || word === 'segunda' || word === '2') targetIndex = 1
        else if (word === 'tercero' || word === 'tercera' || word === '3') targetIndex = 2

        const hotelOptions = []
        const bulletMatches = lastAssistantMsg.matchAll(/(?:^[•\-\*]|\d+\.)\s*(?:\*\*)?([^\n:\*]+?)(?:\*\*)?\s*:/gm)
        for (const m of bulletMatches) {
          const candidate = m[1]?.trim()
          if (candidate && candidate.length > 2 && candidate.length < 60 && !/^(d[íi]a|itinerario|mañana|tarde|noche|nota|precio)/i.test(candidate)) {
            hotelOptions.push(candidate)
          }
        }
        if (hotelOptions[targetIndex]) {
          updatedPreferences.selectedHotel = { name: hotelOptions[targetIndex] }
          updatedPreferences.accommodationStatus = 'Hotel elegido'
        }
      }
    }

    if (typeof updatedPreferences.selectedHotel === 'string' && updatedPreferences.selectedHotel.trim()) {
      updatedPreferences.selectedHotel = { name: updatedPreferences.selectedHotel.trim() }
    }
    if (updatedPreferences.selectedHotel?.name) {
      updatedPreferences.selectedHotel.name = updatedPreferences.selectedHotel.name
        .replace(/\s+(?:est[aá]\s+bien|me\s+parece\s+bien|me\s+gusta|por\s+favor|gracias|porfa|listo)$/i, '')
        .trim()
    }

    if (isChoosingHotel && updatedPreferences.selectedHotel?.name && !isNegatedOrAskingLodging) {
      updatedPreferences.accommodationStatus = 'Hotel elegido'
    }

    if (isHomeOrLocalLodging) {
      updatedPreferences.selectedHotel = { name: 'Casa propia / Alojamiento particular' }
      updatedPreferences.accommodationStatus = 'Casa propia / familiar'
    } else if (isNegatedOrAskingLodging) {
      delete updatedPreferences.selectedHotel
      updatedPreferences.accommodationStatus = 'Recomiéndame hoteles'
    } else if (isOnlyInquiringHotel && !isChoosingHotel) {
      if (!currentPreferences.selectedHotel) {
        delete updatedPreferences.selectedHotel
        delete updatedPreferences.accommodationStatus
      }
    } else if (isLodgingCategoryOrGeneric(message)) {
      delete updatedPreferences.selectedHotel
      updatedPreferences.accommodationStatus = 'Por definir'
      updatedPreferences.lodgingTypePreference = message.trim()
    }

    if (updatedPreferences.selectedHotel?.name && isLodgingCategoryOrGeneric(updatedPreferences.selectedHotel.name)) {
      if (!updatedPreferences.lodgingTypePreference) {
        updatedPreferences.lodgingTypePreference = updatedPreferences.selectedHotel.name
      }
      delete updatedPreferences.selectedHotel
      updatedPreferences.accommodationStatus = 'Por definir'
    }

    updatedPreferences.currency = effectiveCurrency

    if (!updatedPreferences.companions && /\b(nos\s+vamos|nos\s+quedamos|nos\s+hospedamos|tenemos|vamos\s+con|viajamos|somos)\b/i.test(message)) {
      updatedPreferences.companions = 'En grupo'
    }

    // Normalización determinística de duración por expresiones clave y rangos de fechas
    const isPhysicalBridge = /\bpuente\s+(?:pumarejo|boyac[aá]|navarro|occidente|guayaquil|colgante|roncador|san\s+jorge|peatonal|vehicular|[a-z]{3,})/i.test(message) ||
      /\bpuente\b/i.test(updatedPreferences.destination || '') ||
      /\bpuente\b/i.test(currentPreferences.destination || '')

    if (isExplicitLocationToDestination || updatedPreferences.tourType === 'location_to_destination' || updatedPreferences.isUserLocationOrigin) {
      updatedPreferences.durationDays = 1
      updatedPreferences.durationHours = 8
      updatedPreferences.accommodationStatus = 'Alojamiento no requerido / Tour de 1 día'
      delete updatedPreferences.selectedHotel
    } else {
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
      } else if (!isPhysicalBridge && /\b(puente festivo|un puente festivo|un puente|puente|fin de semana largo|3 d[íi]as)\b/i.test(message)) {
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
    }

    // Si hay objetos vacíos o nulos, limpiarlos
    Object.keys(updatedPreferences).forEach(key => {
      if (updatedPreferences[key] === null || updatedPreferences[key] === undefined) {
        delete updatedPreferences[key]
      }
    })

    // Resolve Canonical Destination if city/destination is present
    if (updatedPreferences.isMultiCity && (!isValidRouteEndpoint(updatedPreferences.originPlace) || !isValidRouteEndpoint(updatedPreferences.destinationPlace))) {
      updatedPreferences.isMultiCity = false
      delete updatedPreferences.originPlace
      delete updatedPreferences.destinationPlace
      delete updatedPreferences.cities
      if (currentPreferences.destination) {
        updatedPreferences.destination = currentPreferences.destination
        updatedPreferences.city = currentPreferences.city || currentPreferences.destination
      }
    }

    if (updatedPreferences.isMultiCity && updatedPreferences.originPlace && updatedPreferences.destinationPlace && isValidRouteEndpoint(updatedPreferences.originPlace) && isValidRouteEndpoint(updatedPreferences.destinationPlace)) {
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
        const rawDestinationKey = destinationKey(rawDest)
        const currentCanonicalKey = destinationKey(
          currentPreferences.canonicalDestination?.city ||
          currentPreferences.canonicalDestination?.entityName ||
          currentPreferences.destination ||
          currentPreferences.city
        )
        let canonical = null
        if (isExplicitLocationToDestination || updatedPreferences.tourType === 'location_to_destination' || updatedPreferences.isUserLocationOrigin) {
          const userLat = Number(latitude ?? currentPreferences.latitude ?? updatedPreferences.latitude ?? 0)
          const userLon = Number(longitude ?? currentPreferences.longitude ?? updatedPreferences.longitude ?? 0)
          const landmarkGeo = await geocodePlace(rawDest, userLat || null, userLon || null, {
            country: updatedPreferences.country || currentPreferences.country || ''
          }).catch(() => null)
          if (landmarkGeo?.latitude && landmarkGeo?.longitude) {
            const resolvedCity = cleanAdministrativeCityName(landmarkGeo.city) || cleanAdministrativeCityName(rawDest)
            const cleanEntity = cleanLandmarkOrPlaceName(landmarkGeo.name || rawDest) || rawDest
            canonical = {
              displayName: cleanEntity,
              city: resolvedCity,
              entityName: cleanEntity,
              isMicroDestination: false,
              region: '',
              country: landmarkGeo.country || currentPreferences.country || 'Colombia',
              countryCode: 'CO',
              latitude: Number(landmarkGeo.latitude),
              longitude: Number(landmarkGeo.longitude),
              placeId: landmarkGeo.placeId || '',
              isAmbiguous: false,
              candidates: []
            }
          }
        }
        if (!canonical) {
          canonical = (
            existingCanonicalIsUsable &&
            currentCanonicalKey === rawDestinationKey
          )
            ? existingCanonical
            : preloadDestinationKey === rawDestinationKey
              ? await canonicalWarmup
              : await resolveCanonicalDestination(rawDest)
        }
        if (canonical) {
          // If destination changed, clear previous specific places and hotel to prevent cross-destination pollution
          const isLocationToDest = Boolean(
            isExplicitLocationToDestination ||
            updatedPreferences.tourType === 'location_to_destination' ||
            currentPreferences.tourType === 'location_to_destination' ||
            updatedPreferences.isUserLocationOrigin ||
            currentPreferences.isUserLocationOrigin
          )
          const prevDest = isLocationToDest
            ? (currentPreferences.destinationPlace || currentPreferences.destination || currentPreferences.canonicalDestination?.entityName || currentPreferences.city)
            : (currentPreferences.canonicalDestination?.entityName || currentPreferences.canonicalDestination?.city || currentPreferences.destination || currentPreferences.city)
          const newDest = isLocationToDest
            ? cleanLandmarkOrPlaceName(canonical.entityName || rawDest || canonical.displayName || canonical.city)
            : (canonical.entityName || canonical.city)
          if (prevDest && newDest && prevDest.toLowerCase() !== newDest.toLowerCase() && !isLocationToDest) {
            delete updatedPreferences.specificPlaces
            delete updatedPreferences.selectedHotel
          }
          if (isLocationToDest) {
            updatedPreferences.canonicalDestination = canonical
            const rawTarget = canonical.entityName || rawDest || canonical.displayName || updatedPreferences.destinationPlace || currentPreferences.destinationPlace || currentPreferences.destination
            const landmarkTarget = cleanLandmarkOrPlaceName(rawTarget) || rawTarget
            updatedPreferences.destination = landmarkTarget
            updatedPreferences.destinationPlace = landmarkTarget
            updatedPreferences.city = cleanAdministrativeCityName(canonical.city) || cleanAdministrativeCityName(landmarkTarget)
            updatedPreferences.tourType = 'location_to_destination'
            updatedPreferences.isUserLocationOrigin = true
            updatedPreferences.durationDays = 1
            updatedPreferences.durationHours = 8
            updatedPreferences.accommodationStatus = 'Alojamiento no requerido / Tour de 1 día'
          } else if (canonical.isMicroDestination && (currentPreferences.destination || currentPreferences.city) && !isExplicitCityChange && !isExplicitLocationToDestination) {
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
          if (latitude && longitude) {
            updatedPreferences.userGpsLatitude = Number(latitude)
            updatedPreferences.userGpsLongitude = Number(longitude)
          }
        } else {
          updatedPreferences.destination = rawDest
          updatedPreferences.city = cleanAdministrativeCityName(rawDest)
        }
      }
    }

    // Desambiguación para Cartagena si no se especificó país
    if (updatedPreferences.city && /^cartagena$/i.test(updatedPreferences.city.trim()) && !updatedPreferences.country) {
      updatedPreferences.city = 'Cartagena'
      updatedPreferences.country = 'Colombia'
      updatedPreferences.destination = 'Cartagena, Bolívar, Colombia'
    }

    // Si el destino es el mismo, dejamos que el catálogo precalentado termine
    // mientras la extracción de preferencias ya estaba ejecutándose. Así
    // generateChatResponse reutiliza el caché sin cambiar su contenido.
    const updatedDestinationKey = destinationKey(
      updatedPreferences.canonicalDestination?.city ||
      updatedPreferences.canonicalDestination?.entityName ||
      updatedPreferences.city ||
      updatedPreferences.destination
    )
    const warmedCanonical = updatedDestinationKey && preloadDestinationKey
      ? await canonicalWarmup
      : null
    const warmedCanonicalKey = destinationKey(
      warmedCanonical?.city || warmedCanonical?.entityName
    )
    if (updatedDestinationKey && (
      updatedDestinationKey === preloadDestinationKey ||
      updatedDestinationKey === warmedCanonicalKey
    )) {
      const isExplicitItineraryRequest = /\b(itinerario|itinerarios|plan de viaje|cómo va el itinerario|mostrar el itinerario|muéstrame el itinerario|ver el itinerario|detalles del d[íi]a|ver d[íi]a|d[íi]a\s*\d+)\b/i.test(message)
      const isExplicitHotelInquiry = /\b(recomi[eé]ndame hoteles|qu[eé] hoteles|opciones de hotel|d[oó]nde hospedarm[eé]|d[oó]nde quedarm[eé]|recomiendas alg[uú]n hotel|informaci[oó]n del? hotel)\b/i.test(message)
      const isExplicitAttractionInquiry = /\b(qu[eé] lugares|qu[eé] sitios|qu[eé] atracciones|qu[eé] ver|qu[eé] hacer|sitios tur[íi]sticos|lugares tur[íi]sticos)\b/i.test(message)
      const isExplicitBuildRequest = /\b(generar|genera|crear|crea|construye|iniciar|finaliza|armar)\s+(el\s+|la\s+)?(tour|itinerario|ruta|viaje|mapa)\b/i.test(message)
      const needsCatalogImmediate = isExplicitItineraryRequest || isExplicitHotelInquiry || isExplicitAttractionInquiry || isExplicitBuildRequest || Boolean(updatedPreferences?.readyToBuild)

      if (needsCatalogImmediate) {
        await catalogWarmup
      }
    }

    // 2. Realizar búsqueda en vivo solo si el usuario pregunta explícitamente
    // por fechas, clima, festivos o eventos. Una conversación normal no debe
    // esperar una búsqueda externa antes de poder responder.
    let webSearchResult = null
    const dest = updatedPreferences.canonicalDestination?.displayName || updatedPreferences.city || updatedPreferences.destination
    const isDateOrEventQuery = /\b(festivo|festivos|puente|puentes|clima|evento|eventos|calendario|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|feria|carnaval)\b/i.test(message)
    const shouldSearchWeb = isDateOrEventQuery

    if (shouldSearchWeb) {
      const searchQuery = `${message} en ${dest || 'Colombia'}`

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
      if (webSearchResult) {
        updatedPreferences.webSearchDone = true
      }
    }

    // Fetch verified real food / restaurant places if inquiring about dining or if within planning stages
    let nearbyFoodPlaces = []
    const isFoodQuery = /\b(restaurante|restaurantes|comida|comer|almorzar|cenar|gastronom[íi]a|platos|donde comer|d[oó]nde comer)\b/i.test(message)
    const targetLat = updatedPreferences.latitude || updatedPreferences.canonicalDestination?.latitude
    const targetLon = updatedPreferences.longitude || updatedPreferences.canonicalDestination?.longitude
    if (targetLat && targetLon && isFoodQuery) {
      try {
        const destCity = updatedPreferences.city || updatedPreferences.destination || ''
        const cachedFood = destCity ? await lookupCachedPlacesForCity(destCity, 'restaurant') : []
        if (cachedFood && cachedFood.length > 0) {
          nearbyFoodPlaces = cachedFood
        } else {
          nearbyFoodPlaces = await overpassNearbyFood(targetLat, targetLon, 4000).catch(() => [])
          if (!nearbyFoodPlaces || nearbyFoodPlaces.length === 0) {
            nearbyFoodPlaces = await photonFoodFallback(targetLat, targetLon).catch(() => [])
          }
          if (nearbyFoodPlaces && nearbyFoodPlaces.length > 0 && destCity) {
            saveCachedPlacesBatch(nearbyFoodPlaces, destCity, 'osm_food').catch(() => {})
          }
        }
      } catch (err) {
        console.warn('[ai/chat] nearby food search failed:', err.message)
      }
    }


    // 3. Generar respuesta conversacional amigable y cordial con la IA
    const recentHistory = (history || [])
      .filter(item => item && typeof item.content === 'string' && item.content.trim())
      .slice(-10)
    const lastHistoryItem = recentHistory[recentHistory.length - 1]
    const historyAlreadyHasMessage = lastHistoryItem?.role === 'user' && lastHistoryItem.content.trim() === message.trim()
    const chatState = {
      history: historyAlreadyHasMessage
        ? recentHistory
        : [...recentHistory, { role: 'user', content: message }]
    }

    const aiResponse = await generateChatResponse(
      chatState,
      `Preferencias del usuario acumuladas: ${JSON.stringify(updatedPreferences)}`,
      webSearchResult?.summary || '',
      updatedPreferences,
      nearbyFoodPlaces
    )
    let finalResponseMessage = aiResponse.responseMessage

    // Extraer lugares SOLO si ya se eligió la ciudad destino y provienen de elecciones explícitas o de un itinerario estructurado confirmado
    const hasConfirmedCity = Boolean(updatedPreferences.city || updatedPreferences.destination)
    const isAskingCityRecomms = !hasConfirmedCity && /\b(recomien|recomiend|qué me recomiendas|dónde ir|opciones|destinos)\b/i.test(message)
    const extractedFromMsg = []

    if (hasConfirmedCity && !isAskingCityRecomms) {
      // Extraer de la respuesta del asistente ÚNICAMENTE si es un itinerario estructurado confirmado
      const isConfirmedItineraryMsg = Boolean(
        aiResponse.readyToBuild ||
        (aiResponse.responseMessage && (
          /\b(itinerario\s+de\s+viaje|itinerario\s+finalizado|itinerario\s+actualizado|actualizado\s+(?:tu|el)?\s*itinerario|itinerario\s+con\b|recorrido\s+de\s+\d+\s+paradas|tour\s+(?:completo\s+)?de\s+1\s+d[íi]a|d[íi]a\s*1\s*:)\b/i.test(aiResponse.responseMessage) ||
          /(?:^|\n)\s*1\.\s+\*\*?[A-ZÁÉÍÓÚÑ]/i.test(aiResponse.responseMessage)
        ))
      )

      let confirmedPois = []
      if (isConfirmedItineraryMsg) {
        confirmedPois = extractPoisFromText(aiResponse.responseMessage || '')
        if (confirmedPois.length < 2) {
          const recentAssistantMsgs = (history || []).filter(m => m.role === 'assistant' || m.type === 'ai').reverse()
          for (const aMsg of recentAssistantMsgs) {
            const historyPois = extractPoisFromText(aMsg.content || aMsg.text || '')
            if (historyPois.length >= 2) {
              confirmedPois = historyPois
              break
            }
          }
        }
      }

      if (isConfirmedItineraryMsg && confirmedPois.length >= 2) {
        // SSOT: El itinerario estructurado visible en el mensaje del chat es la verdad absoluta.
        // Reconciliar confirmedPois con aiResponse.extractedPreferences.specificPlaces y el catálogo para conservar coordenadas y tipado de restaurante.
        const chatCity = updatedPreferences.city || updatedPreferences.destination || ''
        const chatCountry = updatedPreferences.country || ''
        const itineraryDays = confirmedPois.map(p => Number(p.dia || p.day || 1)).filter(d => d > 0)
        const maxDay = itineraryDays.length > 0 ? Math.max(...itineraryDays) : 0
        if (maxDay >= 1) {
          updatedPreferences.durationDays = maxDay
          updatedPreferences.durationHours = maxDay === 1 ? 8 : maxDay * 24
        }

        const isLocationRoute = Boolean(
          isExplicitLocationToDestination ||
          updatedPreferences.tourType === 'location_to_destination' ||
          updatedPreferences.isUserLocationOrigin ||
          updatedPreferences.originPlace === 'user_current_location' ||
          aiResponse.extractedPreferences?.tourType === 'location_to_destination' ||
          aiResponse.extractedPreferences?.isUserLocationOrigin ||
          (history || []).some(h => {
            const txt = (h.content || h.text || '').toLowerCase()
            return txt.includes('location_to_destination') || txt.includes('desde mi ubicación') || txt.includes('desde mi ubicacion') || txt.includes('desde mi posición') || txt.includes('desde mi posicion')
          })
        )
        const chatCatalog = (!isLocationRoute && chatCity) ? await getRealDestinationCatalog(chatCity, chatCountry, updatedPreferences.latitude, updatedPreferences.longitude, { requestedDays: maxDay || 7, tourType: updatedPreferences.tourType }).catch(() => null) : null
        const aiSpecifics = Array.isArray(aiResponse.extractedPreferences?.specificPlaces)
          ? aiResponse.extractedPreferences.specificPlaces
          : []

        // Agrupar paradas por día para identificar la parada gastronómica
        const dayStopsMap = new Map()
        for (const p of confirmedPois) {
          const d = Number(p.dia || p.day || 1)
          if (!dayStopsMap.has(d)) dayStopsMap.set(d, [])
          dayStopsMap.get(d).push(p)
        }

        const enrichedPois = confirmedPois.map(poi => {
          const poiName = (poi.name || '').trim()
          const poiDay = Number(poi.dia || poi.day || 1)
          const dayStops = dayStopsMap.get(poiDay) || []
          const stopIndexInDay = dayStops.indexOf(poi)
          const isLastStopInDay = stopIndexInDay === (dayStops.length - 1) && dayStops.length >= 3

          const aiMatch = aiSpecifics.find(sp => {
            const spName = typeof sp === 'object' ? (sp.name || '') : String(sp)
            const spDay = typeof sp === 'object' ? Number(sp.dia || sp.day || 1) : null
            return (spDay == null || spDay === poiDay) && arePlacesSimilar(spName, poiName)
          }) || aiSpecifics.find(sp => {
            const spName = typeof sp === 'object' ? (sp.name || '') : String(sp)
            return arePlacesSimilar(spName, poiName)
          })

          let catalogCoords = null
          if (chatCatalog?.coordinatesMap) {
            const mapped = chatCatalog.coordinatesMap[poiName.toLowerCase().trim()]
            if (mapped && Number.isFinite(Number(mapped.latitude)) && Number.isFinite(Number(mapped.longitude))) {
              catalogCoords = {
                latitude: Number(mapped.latitude),
                longitude: Number(mapped.longitude),
                coordinateSource: mapped.coordinateSource || 'osm',
                coordinatesVerified: true
              }
            }
          }

          const isCatalogRestaurant = chatCatalog?.restaurants?.some(r => {
            const rName = typeof r === 'string' ? r : (r?.name || '')
            return arePlacesSimilar(rName, poiName)
          })
          const isFoodPattern = isFoodOrDrinkEstablishment(poiName) || /restaurante|bistro|caf[ée]|comida|asador|gourmet|bar|pub|ostras|ostrer[íi]a|mariscos|del\s+sabor/i.test(poiName)
          const isNonDiningVenue = !/^(?:restaurante|caf[ée]|bistro|asador)\s+/i.test(poiName) && /\b(museo|zoo|acuario|catedral|iglesia|parque|carnaval|estadio|monumento|teatro|puente|bridge|ecoparque|ci[eé]naga|sendero|mirador|malec[oó]n|malecon|playa|estatua|obelisco|paseo|plaza|plazoleta|calle|avenida|bulevar)\b/i.test(poiName)
          const isDestinationPlace = arePlacesSimilar(poiName, updatedPreferences.destination || '') ||
            arePlacesSimilar(poiName, updatedPreferences.destinationPlace || '') ||
            Boolean(updatedPreferences.destination && poiName.toLowerCase().includes(updatedPreferences.destination.toLowerCase()))

          const isAiRestaurant = Boolean(aiMatch && (aiMatch.isRestaurant || aiMatch.type === 'food' || aiMatch.category === 'restaurant' || aiMatch.entityType === 'restaurant'))
          const isDining = !isNonDiningVenue && !isDestinationPlace && (isAiRestaurant || isCatalogRestaurant || isFoodPattern || (!isLocationRoute && isLastStopInDay))

          const resolvedLat = (aiMatch && Number.isFinite(Number(aiMatch.latitude))) ? Number(aiMatch.latitude) : catalogCoords?.latitude
          const resolvedLon = (aiMatch && Number.isFinite(Number(aiMatch.longitude))) ? Number(aiMatch.longitude) : catalogCoords?.longitude

          return {
            ...poi,
            ...(aiMatch && typeof aiMatch === 'object' ? aiMatch : {}),
            name: poiName,
            dia: poiDay,
            day: poiDay,
            type: isDining ? 'food' : (aiMatch?.type || 'cultural'),
            category: isDining ? 'restaurant' : (aiMatch?.category || 'attraction'),
            entityType: isDining ? 'restaurant' : (aiMatch?.entityType || 'attraction'),
            isRestaurant: Boolean(isDining),
            ...(Number.isFinite(resolvedLat) && Number.isFinite(resolvedLon) ? {
              latitude: resolvedLat,
              longitude: resolvedLon,
              coordinateSource: aiMatch?.coordinateSource || catalogCoords?.coordinateSource || 'osm',
              coordinatesVerified: true
            } : {})
          }
        })

        if (isLocationRoute && aiSpecifics.length >= 3) {
          extractedFromMsg.push(...aiSpecifics)
        } else {
          extractedFromMsg.push(...enrichedPois)
        }
      } else {
        // Extraer lugares estructurados devueltos por OpenAI si están disponibles
        if (Array.isArray(aiResponse.extractedPreferences?.specificPlaces) && aiResponse.extractedPreferences.specificPlaces.length > 0) {
          for (const sp of aiResponse.extractedPreferences.specificPlaces) {
            const spName = typeof sp === 'object' ? (sp.name || '') : String(sp)
            const spDay = typeof sp === 'object' ? (sp.dia || sp.day) : null
            if (isValidSpecificPlace(spName)) {
              extractedFromMsg.push(typeof sp === 'object' ? {
                ...sp,
                name: spName,
                ...(spDay ? { dia: Number(spDay), day: Number(spDay) } : {})
              } : spName)
            }
          }
        }
        if (confirmedPois.length > 0) {
          extractedFromMsg.push(...confirmedPois)
        }
      }

      // Si el usuario aceptó en lote ("agregar todas las actividades", "vale agrega todas esas actividades", etc.), extraer de mensajes recientes del asistente
      const isUserAcceptingAll = /\b(agregar|incluir|a[ñn]adir|agrega)\s+(todas|estas|est[aá]s|esas|los|las|mis)?\s*(actividades|lugares|atracciones|restaurantes|recomendaciones|opciones|paradas)?/i.test(message) ||
        /\b(vale\s+agrega|s[íi],?\s*(agrega|incluye|a[ñn]ade)|agrega(r)?\s*(todas|estas|est[aá]s|esas)|incluir\s+todas|agregar\s+est[aá]s|agregar\s+estas)\b/i.test(message)

      if (isUserAcceptingAll && (!isConfirmedItineraryMsg || confirmedPois.length < 2)) {
        const recentAssistantMsgs = (history || []).filter(m => m.role === 'assistant' || m.type === 'ai')
        for (const aMsg of recentAssistantMsgs) {
          extractedFromMsg.push(...extractPoisFromText(aMsg.content || aMsg.text || ''))
        }
      }
    }

    if (aiResponse.extractedPreferences && typeof aiResponse.extractedPreferences === 'object') {
      Object.entries(aiResponse.extractedPreferences).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          if (k === 'selectedHotel' || k === 'accommodationStatus') {
            const hVal = k === 'selectedHotel' ? v : (aiResponse.extractedPreferences.selectedHotel || updatedPreferences.selectedHotel)
            const sVal = k === 'accommodationStatus' ? v : (aiResponse.extractedPreferences.accommodationStatus || updatedPreferences.accommodationStatus)
            if (isNegatedOrAskingLodging) {
              delete updatedPreferences.selectedHotel
              updatedPreferences.accommodationStatus = 'Recomiéndame hoteles'
            } else if (isLodgingExplicitlyConfirmed(hVal, sVal)) {
              updatedPreferences[k] = v
              if (k === 'selectedHotel' && (!updatedPreferences.accommodationStatus || updatedPreferences.accommodationStatus === 'Por definir')) {
                updatedPreferences.accommodationStatus = 'Hotel elegido'
              }
            }
          } else if (!updatedPreferences[k] || updatedPreferences[k] === 'Por definir') {
            updatedPreferences[k] = v
          }
        }
      })
    }

    if (isNegatedOrAskingLodging) {
      delete updatedPreferences.selectedHotel
      updatedPreferences.accommodationStatus = 'Recomiéndame hoteles'
    }

    // SSOT: Ensure durationDays matches the maximum day specified in any extracted itinerary places
    const allSpecificDays = [
      ...extractedFromMsg.map(p => Number(p.dia || p.day || 0)),
      ...(Array.isArray(updatedPreferences.specificPlaces) ? updatedPreferences.specificPlaces.map(p => Number(p.dia || p.day || 0)) : [])
    ].filter(d => d > 0)
    const maxSpecificDay = allSpecificDays.length > 0 ? Math.max(...allSpecificDays) : 0
    if (maxSpecificDay >= 1 && (!updatedPreferences.durationDays || updatedPreferences.durationDays < maxSpecificDay)) {
      updatedPreferences.durationDays = maxSpecificDay
      updatedPreferences.durationHours = maxSpecificDay === 1 ? 8 : maxSpecificDay * 24
    }

    if (updatedPreferences.city) {
      updatedPreferences.city = cleanAdministrativeCityName(updatedPreferences.city)
    }
    if (updatedPreferences.destination) {
      updatedPreferences.destination = cleanAdministrativeCityName(updatedPreferences.destination)
    }

    const isLocationRoute = Boolean(
      isExplicitLocationToDestination ||
      updatedPreferences.tourType === 'location_to_destination' ||
      updatedPreferences.isUserLocationOrigin
    )

    if ((!hasConfirmedCity || isAskingCityRecomms) && !isLocationRoute) {
      delete updatedPreferences.specificPlaces
    } else {
      const isConfirmedItineraryMsg = Boolean(
        aiResponse.readyToBuild ||
        (aiResponse.responseMessage && (
          /\b(itinerario\s+de\s+viaje|itinerario\s+finalizado|itinerario\s+actualizado|actualizado\s+(?:tu|el)?\s*itinerario|itinerario\s+con\b|recorrido\s+de\s+\d+\s+paradas|tour\s+(?:completo\s+)?de\s+1\s+d[íi]a|d[íi]a\s*1\s*:)\b/i.test(aiResponse.responseMessage) ||
          /(?:^|\n)\s*1\.\s+\*\*?[A-ZÁÉÍÓÚÑ]/i.test(aiResponse.responseMessage)
        ))
      )

      const rawCombined = [
        ...(Array.isArray(updatedPreferences.specificPlaces) ? updatedPreferences.specificPlaces : []),
        ...(Array.isArray(aiResponse.specificPlaces) ? aiResponse.specificPlaces : []),
        ...extractedFromMsg
      ].filter(p => {
        const pName = typeof p === 'object' ? (p.name || '') : String(p)
        return isValidSpecificPlace(pName) && !isNonTouristFacility({ name: pName })
      })

      const combinedSpecifics = (isConfirmedItineraryMsg && extractedFromMsg.length >= 2)
        ? deduplicatePlacesByName(extractedFromMsg.filter(p => {
            const pName = typeof p === 'object' ? (p.name || '') : String(p)
            return isValidSpecificPlace(pName) && !isNonTouristFacility({ name: pName })
          }))
        : ((Array.isArray(aiResponse.specificPlaces) && aiResponse.specificPlaces.length >= 2)
          ? deduplicatePlacesByName(aiResponse.specificPlaces.filter(p => {
              const pName = typeof p === 'object' ? (p.name || '') : String(p)
              return isValidSpecificPlace(pName) && !isNonTouristFacility({ name: pName })
            }))
          : deduplicatePlacesByName(rawCombined))

      let validatedSpecifics = combinedSpecifics
      if (validatedSpecifics.length > 0 && updatedPreferences.city && !isLocationRoute) {
        validatedSpecifics = await filterChatSpecificPlacesByOsm(
          validatedSpecifics,
          updatedPreferences.city,
          updatedPreferences.country || '',
          updatedPreferences.selectedHotel || null,
          { tourType: updatedPreferences.tourType }
        )
      }
      if (isLocationRoute && validatedSpecifics.length >= 2) {
        const destName = updatedPreferences.destinationPlace || updatedPreferences.destination || ''
        if (destName) {
          const destIdx = validatedSpecifics.findIndex(p => {
            const pName = typeof p === 'object' ? (p.name || '') : String(p)
            return arePlacesSimilar(pName, destName)
          })
          if (destIdx !== -1 && destIdx !== validatedSpecifics.length - 1) {
            const [destItem] = validatedSpecifics.splice(destIdx, 1)
            validatedSpecifics.push(destItem)
          }
        }
      }
      if (validatedSpecifics.length > 0) {
        if (isCoastalIslandsTour(updatedPreferences)) {
          validatedSpecifics = assignCoastalIslandDays(
            validatedSpecifics,
            updatedPreferences.durationDays || 1
          )
        }
        updatedPreferences.specificPlaces = validatedSpecifics
      } else {
        delete updatedPreferences.specificPlaces
      }
    }

    if (isCoastalIslandsTour(updatedPreferences) && /(?:Itinerario de Viaje:|(?:^|\n)\s*D[ií]a\s*1\s*:)/i.test(finalResponseMessage || '')) {
      const coastalStops = updatedPreferences.specificPlaces || []
      finalResponseMessage = rebuildCoastalChatItinerary(
        finalResponseMessage,
        coastalStops,
        updatedPreferences.city || updatedPreferences.destination || 'Coveñas',
        updatedPreferences.durationDays || 1
      )
      aiResponse.specificPlaces = coastalStops
      if (coastalStops.length === 0) aiResponse.readyToBuild = false
      if (aiResponse.extractedPreferences && typeof aiResponse.extractedPreferences === 'object') {
        aiResponse.extractedPreferences.specificPlaces = coastalStops
      }
    }

    const isOneDayTour = Number(updatedPreferences.durationDays) === 1 || Number(updatedPreferences.durationHours) <= 12 || (aiResponse.extractedPreferences && Number(aiResponse.extractedPreferences.durationDays) === 1)
    const effectiveReadyToBuild = (isLocationRoute || isOneDayTour)
      ? Boolean(aiResponse.readyToBuild)
      : (Boolean(aiResponse.readyToBuild) && isLodgingExplicitlyConfirmed(updatedPreferences.selectedHotel, updatedPreferences.accommodationStatus))

    if (isCoastalIslandsTour(updatedPreferences) || isCoastalIslandsTour(aiResponse.extractedPreferences)) {
      finalResponseMessage = sanitizeInternalTravelLanguage(
        finalResponseMessage,
        updatedPreferences.city || updatedPreferences.destination || ''
      )
    }

    res.json({
      responseMessage: finalResponseMessage,
      actionChips: aiResponse.actionChips || [],
      destinationSuggestions: aiResponse.destinationSuggestions || [],
      readyToBuild: effectiveReadyToBuild,
      preferences: updatedPreferences,
      updatedPreferences,
      destination: updatedPreferences.destination,
      destinationPlace: updatedPreferences.destinationPlace,
      webSearchDone: Boolean(webSearchResult)
    })
  } catch (error) {
    next(error)
  }
})

aiRouter.post('/tours/generate', tourGenerationLimiter, async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
    applyTourType(input)
    if (input.city && input.city.trim().length > 0 && !input.destinationPlace && !input.isMultiCity && (!input.cities || input.cities.length <= 1)) {
      input.destination = input.city.trim()
    }

    // Default to synchronous generation to avoid 404 polling errors and container-freezing on serverless runtimes
    const runAsync = req.body.async === true
    if (!runAsync) {
      console.info('[tour-ai] Processing tour generation synchronously.')
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
    applyTourType(input)
    
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
        if (!input.tourType && (extracted.tourType || extracted.tour_type)) {
          input.tourType = extracted.tourType || extracted.tour_type
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

    // Extraction can add the origin/destination, cities or user-GPS origin.
    // Resolve the topology again after those fields are known.
    applyTourType(input, extracted)
    
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

    // 1. If explicit destination city exists, resolve canonical city center first to anchor tour correctly
    if (input.canonicalDestination && Number.isFinite(input.canonicalDestination.latitude) && Number.isFinite(input.canonicalDestination.longitude)) {
      location = {
        name: input.canonicalDestination.displayName,
        latitude: input.canonicalDestination.latitude,
        longitude: input.canonicalDestination.longitude,
        city: input.canonicalDestination.city,
        country: input.canonicalDestination.country || '',
        placeId: input.canonicalDestination.placeId
      }
    } else if (input.destination || input.city) {
      const cityQuery = input.city || input.destination
      const canonical = await resolveCanonicalDestination(cityQuery).catch(() => null)
      if (canonical && Number.isFinite(canonical.latitude) && Number.isFinite(canonical.longitude)) {
        location = {
          name: canonical.displayName,
          latitude: canonical.latitude,
          longitude: canonical.longitude,
          city: canonical.city,
          country: canonical.country || '',
          placeId: canonical.placeId
        }
        input.canonicalDestination = canonical
      }
    }

    // 2. If no destination city center resolved yet, use explicit request GPS coordinates
    if (!location && input.latitude && input.longitude && Number.isFinite(Number(input.latitude)) && Number.isFinite(Number(input.longitude))) {
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
    
    // Batch-generate 100% unique custom reasons for all selected places using fast AI
    const placeNames = planner.selectedPlaces.map(p => p.name)
    // Las razones personalizadas enriquecen la tarjeta, pero no deben bloquear
    // el resultado principal si el proveedor tarda. buildRecommendationReason
    // conserva una explicación determinística como respaldo.
    const customReasonsMap = await Promise.race([
      generateCustomPlaceReasons({
        destination: input.destination,
        city: input.city,
        prompt: input.prompt,
        places: placeNames
      }).catch(() => ({})),
      new Promise(resolve => setTimeout(() => resolve({}), 3500))
    ])

    const assignedUrls = new Set()
    // We send back the selected places as recommendations with real unique images & custom reasons
    const recommendations = await Promise.all(
      planner.selectedPlaces.map(async (place, index) => {
        let imageUrl = place.imageUrl || place.images?.[0] || ''
        if (!imageUrl || assignedUrls.has(imageUrl)) {
          try {
            const imgRes = await Promise.race([
              imageForPlaceWithStatus(place.name, input.city || input.destination || '', place.category, index, {
                country: input.country,
                latitude: place.latitude,
                longitude: place.longitude,
                assignedUrls
              }),
              new Promise(resolve => setTimeout(() => resolve({ url: '', isFallback: true }), 2500))
            ])
            imageUrl = imgRes.url
          } catch (_) {}
        }
        if (!imageUrl) {
          imageUrl = getReliableCategoryFallbackImage(place.name, place.category, assignedUrls)
        }
        assignedUrls.add(imageUrl)

        const aiReason = customReasonsMap[place.name] || null
        const placeDesc = place.description || place.history || ''

        return {
          id: place.placeId || place.id || `rec-${index}`,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          coordinateSource: place.coordinateSource || place.coordinate_source || '',
          coordinatesVerified: isVerifiedCoordinatePlace(place),
          category: place.category || 'turismo',
          imageUrl,
          description: placeDesc,
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
            fuente_coordenadas: place.coordinateSource || place.coordinate_source || '',
            coordenadas_verificadas: isVerifiedCoordinatePlace(place),
            url_mapa: mapUrlFor(place.latitude, place.longitude)
          }
        }
      })
    )

    // Precalentar alternativas con los candidatos no seleccionados del tour (< 50ms)
    try {
      const selectedNames = new Set(planner.selectedPlaces.map(p => normalizeKey(p.name)))
      const unselected = (candidatePack.places || [])
        .filter(p => p && p.name && !selectedNames.has(normalizeKey(p.name)))
        .slice(0, 15)

      if (unselected.length > 0) {
        const destCity = input.city || input.destination || location?.city || ''
        const destCountry = input.country || location?.country || ''
      const preheated = unselected.map((p, idx) => ({
          id: getCandidateId(p),
          candidateId: getCandidateId(p),
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          coordinateSource: p.coordinateSource || p.coordinate_source || 'osm-verified',
          coordinatesVerified: isVerifiedCoordinatePlace(p),
          category: p.category || input.type || 'attraction',
          imageUrl: p.imageUrl || '',
          description: p.description || p.history || fallbackDescByCategory(p.category, destCity),
          reason: p.description || fallbackDescByCategory(p.category, destCity),
          durationMinutes: p.minutes || 35,
          locationInfo: {
            nombre_lugar: p.name,
            direccion: p.address || `${destCity}, ${destCountry}`,
            ciudad: destCity,
            region: p.region || destCity,
            pais: destCountry,
            candidateId: getCandidateId(p),
            place_id: getCandidateId(p),
            fuente_coordenadas: p.coordinateSource || p.coordinate_source || 'osm-verified',
            coordenadas_verificadas: true,
            url_mapa: mapUrlFor(p.latitude, p.longitude)
          }
        }))

        const cKey = `${destCity.toLowerCase().trim()}:${(input.destination || destCity).toLowerCase().trim()}:${(input.type || 'cultural').toLowerCase().trim()}`
        const cityOnlyKey = `${destCity.toLowerCase().trim()}::${(input.type || 'cultural').toLowerCase().trim()}`
        alternativesCache.set(cKey, { alternatives: preheated, timestamp: Date.now() })
        alternativesCache.set(cityOnlyKey, { alternatives: preheated, timestamp: Date.now() })
      }
    } catch (e) {
      console.warn('[recommend] Failed to preheat alternatives cache:', e.message)
    }
    
    res.json({
      durationHours: input.durationHours,
      destination: input.destination,
      city: input.city,
      country: input.country,
      tourType: input.tourType,
      budget: input.budget,
      recommendations,
      plannerContext: {
        tourType: input.tourType,
        geographicScope: geographicScopeFor(input),
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
    applyTourType(input, plannerContext)
    
    const destQuery = input.city || input.destination || ''
    const firstPlaceWithCoords = Array.isArray(places) ? places.find(p => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude))) : null
    if (firstPlaceWithCoords) {
      input.latitude = input.latitude || Number(firstPlaceWithCoords.latitude)
      input.longitude = input.longitude || Number(firstPlaceWithCoords.longitude)
      input.city = input.city || firstPlaceWithCoords.city || firstPlaceWithCoords.locationInfo?.ciudad || destQuery
      input.country = input.country || firstPlaceWithCoords.country || firstPlaceWithCoords.locationInfo?.pais || 'Colombia'
      if (!input.canonicalDestination) {
        input.canonicalDestination = {
          displayName: input.city,
          city: input.city,
          country: input.country,
          latitude: input.latitude,
          longitude: input.longitude,
          placeId: String(firstPlaceWithCoords.placeId || firstPlaceWithCoords.id || '')
        }
      }
    } else if ((!input.latitude || !input.longitude || !input.city || !input.country) && destQuery) {
      const canonical = await resolveCanonicalDestination(destQuery).catch(() => null)
      if (canonical) {
        input.canonicalDestination = canonical
        input.latitude = input.latitude || canonical.latitude
        input.longitude = input.longitude || canonical.longitude
        input.city = input.city || canonical.city
        input.country = input.country || canonical.country
      } else {
        const location = await geocodePlace(destQuery).catch(() => null)
        if (location) {
          input.city = input.city || location.city || ''
          input.country = input.country || location.country || ''
          input.latitude = input.latitude || location.latitude
          input.longitude = input.longitude || location.longitude
        }
      }
    }

    // Default to synchronous tour build to avoid 404 polling errors and container-freezing on serverless runtimes
    const runAsync = req.body.async === true
    if (!runAsync) {
      console.info('[tour-ai] Processing tour build synchronously.')
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

export function fallbackDescByCategory(category = '', cityName = '') {
  const lower = (category || '').toLowerCase()
  const cityStr = cityName ? ` en ${cityName}` : ''
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('gastronom')) {
    return `Reconocido espacio gastronómico${cityStr} para deleitarse con la cocina y sabores locales.`
  }
  if (lower.includes('park') || lower.includes('nature') || lower.includes('trail') || lower.includes('beach') || lower.includes('playa')) {
    return `Entorno al aire libre y de naturaleza${cityStr}, ideal para pasear y disfrutar del paisaje.`
  }
  if (lower.includes('museum') || lower.includes('museo') || lower.includes('art') || lower.includes('culture') || lower.includes('historic')) {
    return `Parada cultural e histórica imprescindible${cityStr} para conocer su patrimonio y memoria.`
  }
  if (lower.includes('viewpoint') || lower.includes('mirador')) {
    return `Punto panorámico${cityStr} con vistas privilegiadas del entorno y la ciudad.`
  }
  return `Lugar de interés destacado${cityStr} para sumergirse en la vida local, cultura y ambiente.`
}

const ALTERNATIVES_CACHE_TTL = 20 * 60 * 1000 // 20 minutes
const alternativesCache = new Map()

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

    // 1. Identificar ciudad y destino sin bloqueos innecesarios de red si ya vienen provistos
    let rawCity = input.city || input.destination || firstPlace?.city || firstPlace?.locationInfo?.ciudad || ''
    let revLocation = null
    if (!rawCity || rawCity.length > 30 || /\b(catedral|hotel|restaurante|parada|museo|parque|recorrido|tour)\b/i.test(rawCity)) {
      if (lat && lon) {
        revLocation = await reverseGeocodeLocation(lat, lon).catch(() => null)
      }
      rawCity = revLocation?.city || firstPlace?.city || firstPlace?.locationInfo?.ciudad || ''
    }
    const city = cleanAdministrativeCityName(rawCity).trim()
    const country = input.country || revLocation?.country || firstPlace?.country || firstPlace?.locationInfo?.pais || ''
    const destination = (input.destination && input.destination.length < 30 && input.destination !== 'Destino' && !/\b(catedral|hotel|restaurante|museo)\b/i.test(input.destination))
      ? input.destination
      : city

    console.info('[alternatives] Identified destination city:', { city, country, destination, lat, lon })

    const currentKeys = new Set(
      currentPlaces.map(p => normalizeKey(p.name || '')).filter(Boolean)
    )
    const currentIds = new Set(
      [
        ...currentPlaces.map(p => (p.id || p.placeId || '').toLowerCase().trim()),
        ...excludeIds.map(id => (id || '').toLowerCase().trim())
      ].filter(Boolean)
    )

    const isDuplicatePlace = (name, pId) => {
      if (!name && !pId) return true
      const normKey = normalizeKey(name || '')
      if (normKey && currentKeys.has(normKey)) return true
      if (pId && currentIds.has(String(pId).toLowerCase().trim())) return true
      for (const cp of currentPlaces) {
        if (arePlacesSimilar(cp, name)) return true
      }
      return false
    }

    const isQualityTouristPlace = (p) => {
      if (!p || !p.name) return false
      const n = (p.name || '').toLowerCase().trim()
      if (n.length < 3) return false
      if (n === city.toLowerCase() || n === `${city.toLowerCase()}, ${country.toLowerCase()}` || n.includes(`${city.toLowerCase()} ${city.toLowerCase()}`)) {
        return false
      }
      if (/\b(aeropuerto|airport|terminal de transporte|terminal de buses|estaci[oó]n de servicio|gasolinera|hospital|cl[íi]nica|parqueadero|parking|alcald[íi]a|gobernaci[oó]n|cementerio|carulla|éxito|exito|olímpica|olimpica|d1|ara|alkosto|jumbo|makro|pricesmart|homecenter|falabella|sodimac|panamericana|banco|cajero)\b/i.test(n)) {
        return false
      }
      if (/^(v[íi]a\s+|carretera\s+|autopista\s+|calle\s+|carrera\s+|diagonal\s+|transversal\s+)/i.test(n) || /\s+-\s+/.test(n)) {
        return false
      }
      return isValidSpecificPlace(p.name)
    }

    // 2. Comprobar caché en memoria para respuesta instantánea (< 50ms)
    const cityKey = city.toLowerCase().trim()
    const destKey = (destination || '').toLowerCase().trim()
    const typeKey = (input.type || 'cultural').toLowerCase().trim()
    const cacheKey = `${cityKey}:${destKey}:${typeKey}`

    const possibleKeys = [
      cacheKey,
      `${cityKey}::${typeKey}`,
      `${destKey}::${typeKey}`,
      cityKey,
      destKey
    ].filter(Boolean)

    for (const k of possibleKeys) {
      const cachedEntry = alternativesCache.get(k)
      if (cachedEntry && (Date.now() - cachedEntry.timestamp < ALTERNATIVES_CACHE_TTL)) {
        const available = cachedEntry.alternatives.filter(alt => !isDuplicatePlace(alt.name, alt.id))
        if (available.length >= 3) {
          console.info('[alternatives] Returning cached alternatives for key:', k)
          for (let i = 0; i < Math.min(available.length, 10); i++) {
            const alt = available[i]
            if (!alt.imageUrl) {
              alt.imageUrl = await Promise.race([
                imageForPlace(alt.name, city, alt.category, i, {
                  country,
                  latitude: alt.latitude,
                  longitude: alt.longitude
                }),
                new Promise(res => setTimeout(() => res(''), 1500))
              ]).catch(() => '')
              if (!alt.imageUrl) {
                alt.imageUrl = getReliableCategoryFallbackImage(alt.name, alt.category)
              }
            }
          }
          return res.json({ alternatives: available.slice(0, 10) })
        }
      }
    }

    let centerLat = (lat != null && Number.isFinite(Number(lat))) ? Number(lat) : (revLocation?.latitude || null)
    let centerLon = (lon != null && Number.isFinite(Number(lon))) ? Number(lon) : (revLocation?.longitude || null)

    if ((centerLat == null || centerLon == null) && (city || destination)) {
      const canonical = await resolveCanonicalDestination(city || destination).catch(() => null)
      if (canonical?.latitude && canonical?.longitude) {
        centerLat = canonical.latitude
        centerLon = canonical.longitude
      }
    }

    const excludeNameList = Array.from(currentKeys).filter(n => n.length > 2)

    // 3. Fallback dinámico unificado: construir pool de candidatos sin saturar redes públicas
    const candidatePool = []
    
    // Primero, si existen presets locales cargados en memoria, agregarlos directamente
    const cleanKey = cleanAdministrativeCityName(destination || city).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
    const presetPlaces = DESTINATION_ICONIC_LANDMARKS[cleanKey] || []
    for (const p of presetPlaces) {
      const pName = typeof p === 'string' ? p : p?.name
      if (pName && !isDuplicatePlace(pName) && isQualityTouristPlace({ name: pName })) {
        candidatePool.push(typeof p === 'object' ? p : { name: pName, category: 'attraction' })
      }
    }
    const presetRests = DESTINATION_ICONIC_RESTAURANTS[cleanKey] || []
    for (const r of presetRests) {
      if (r?.name && !isDuplicatePlace(r.name)) {
        candidatePool.push({ name: r.name, category: 'restaurant', specialty: r.specialty })
      }
    }

    // Si aún faltan candidatos para llegar a 8, consultar a OpenAI en UNA sola llamada estructurada
    if (candidatePool.length < 8) {
      const aiPlaces = await suggestFallbackPlacesWithOpenAI({
        destination,
        city,
        country,
        type: input.type || 'cultural',
        excludeNames: [...excludeNameList, ...candidatePool.map(c => c.name)]
      }).catch(() => [])

      for (const p of aiPlaces) {
        if (p && p.name && !isDuplicatePlace(p.name, p.id || p.placeId) && isQualityTouristPlace(p)) {
          if (!candidatePool.some(cp => arePlacesSimilar(cp.name, p.name))) {
            candidatePool.push(p)
          }
        }
      }
    }

    // 4. Geocodificar y enriquecer candidatos en PARALELO
    const candidateSlice = candidatePool.slice(0, 10)
    const settledAlternatives = await Promise.allSettled(
      candidateSlice.map(async (item, i) => {
        let realLat = (item.latitude != null && Number.isFinite(Number(item.latitude))) ? Number(item.latitude) : null
        let realLon = (item.longitude != null && Number.isFinite(Number(item.longitude))) ? Number(item.longitude) : null
        let landmark = null

        if (isVerifiedCoordinatePlace(item) && hasUsableCoordinates(item.latitude, item.longitude)) {
          realLat = Number(item.latitude)
          realLon = Number(item.longitude)
          landmark = item
        } else if (!realLat || !realLon || !hasUsableCoordinates(realLat, realLon)) {
          landmark = await geocodePlace(`${item.name}, ${city}`, centerLat, centerLon).catch(() => null)
          if (landmark && hasUsableCoordinates(landmark.latitude, landmark.longitude)) {
            realLat = Number(landmark.latitude)
            realLon = Number(landmark.longitude)
          }
        }

        if (!realLat || !realLon || !hasUsableCoordinates(realLat, realLon)) {
          if (centerLat != null && centerLon != null) {
            const jitter = deterministicJitter(item.name || `alt-${i}`, centerLat, centerLon, 0.015)
            realLat = jitter.latitude
            realLon = jitter.longitude
          } else {
            return null
          }
        }

        const category = item.category || item.type || input.type || 'attraction'
        let imageUrl = item.imageUrl || item.images?.[0] || ''
        if (!imageUrl) {
          try {
            imageUrl = await Promise.race([
              imageForPlace(item.name, city, category, i, {
                country,
                latitude: realLat,
                longitude: realLon
              }),
              new Promise(res => setTimeout(() => res(''), 1500))
            ]).catch(() => '')
          } catch (_) {}
        }
        if (!imageUrl) {
          imageUrl = getReliableCategoryFallbackImage(item.name, category)
        }

        const richDesc = item.description || item.specialty || item.reason || fallbackDescByCategory(category, city)
        return {
          id: item.placeId || item.id || `rec-${Date.now()}-${i}`,
          name: item.name,
          latitude: realLat,
          longitude: realLon,
          coordinateSource: landmark?.coordinateSource || landmark?.coordinate_source || 'osm-verified',
          coordinatesVerified: true,
          category,
          imageUrl,
          description: richDesc,
          reason: richDesc,
          durationMinutes: item.minutes || 35,
          locationInfo: {
            nombre_lugar: item.name,
            direccion: item.address || landmark?.address || `${city}, ${country}`,
            ciudad: city,
            region: city,
            pais: country,
            place_id: landmark?.placeId || landmark?.place_id || item.placeId || item.id || '',
            fuente_coordenadas: landmark?.coordinateSource || landmark?.coordinate_source || 'osm-verified',
            coordenadas_verificadas: true,
            url_mapa: mapUrlFor(realLat, realLon)
          }
        }
      })
    )

    const alternatives = settledAlternatives
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)

    if (alternatives.length > 0) {
      alternativesCache.set(cacheKey, { alternatives, timestamp: Date.now() })
      alternativesCache.set(cityKey, { alternatives, timestamp: Date.now() })
    }

    res.json({ alternatives: alternatives.slice(0, 10) })
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
      budget: z.string().optional().default('moderate'),
      currency: z.string().optional().default('cop')
    })
    const { latitude, longitude, budget, currency } = hotelSchema.parse(req.body)
    
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
      hotels: hotels.slice(0, 5).map(h => ({
        ...h,
        priceDisplay: getHotelPriceDisplay(h, currency)
      })),
      hasVerifiedResults: true
    })
  } catch (error) {
    next(error)
  }
})

export async function processTourBuild(jobId, input, confirmedPlaces, plannerContext) {
  const isSync = !jobId
  const updateJob = (updates) => {
    if (isSync) return
    const job = tourJobs.get(jobId)
    if (job) Object.assign(job, updates)
  }

  const destQuery = input.city || input.destination || ''
  const firstConfirmedWithCoords = Array.isArray(confirmedPlaces) ? confirmedPlaces.find(p => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude))) : null
  if (firstConfirmedWithCoords) {
    input.latitude = input.latitude || Number(firstConfirmedWithCoords.latitude)
    input.longitude = input.longitude || Number(firstConfirmedWithCoords.longitude)
    input.city = input.city || firstConfirmedWithCoords.city || firstConfirmedWithCoords.locationInfo?.ciudad || destQuery
    input.country = input.country || firstConfirmedWithCoords.country || firstConfirmedWithCoords.locationInfo?.pais || 'Colombia'
    if (!input.canonicalDestination) {
      input.canonicalDestination = {
        displayName: input.city,
        city: input.city,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
        placeId: String(firstConfirmedWithCoords.placeId || firstConfirmedWithCoords.id || '')
      }
    }
  } else if ((!input.latitude || !input.longitude || !input.canonicalDestination) && destQuery) {
    const canonical = await resolveCanonicalDestination(destQuery).catch(() => null)
    if (canonical) {
      input.canonicalDestination = canonical
      input.latitude = input.latitude || canonical.latitude
      input.longitude = input.longitude || canonical.longitude
      input.city = input.city || canonical.city
      input.country = input.country || canonical.country
    }
  }

  try {
    const isUserOrigin = Boolean(input.isUserLocationOrigin || input.originPlace === 'user_current_location' || input.tourType === 'location_to_destination')
    const cleanConfirmedPlaces = isUserOrigin
      ? (Array.isArray(confirmedPlaces) ? confirmedPlaces : []).filter(p => {
          const pName = (p?.name || '').toLowerCase()
          return !pName.includes('tu ubicación') && !pName.includes('tu ubicacion') && p?.type !== 'start_point'
        })
      : (Array.isArray(confirmedPlaces) ? confirmedPlaces : [])

    const planner = {
      selectedPlaces: cleanConfirmedPlaces.map((p, i) => ({
        ...p,
        placeId: p.placeId || p.locationInfo?.place_id || p.id,
        order: i,
        minutes: p.durationMinutes
      })),
      ...plannerContext,
      distanceKm: estimateRouteDistance(cleanConfirmedPlaces, null),
      timeProfile: {
        durationHours: input.durationHours,
        stopTarget: cleanConfirmedPlaces.length,
        pace: input.touristPace,
        hasProfile: Boolean(input.touristProfileSummary || input.touristInterests?.length),
      }
    }

    let aiTour = null
    let aiError = null
    const shouldAskAiPlanner = shouldUseAiPlanner(input, planner)
    try {
      if (!shouldAskAiPlanner) {
        console.info('[tour-ai] ai-planner-skipped (build)')
      } else {
        aiTour = await planWithOpenAI({
          ...input,
          places: planner.selectedPlaces,
          recommendedSchedule: planner.recommendedSchedule,
          timeProfile: planner.timeProfile,
          selectedHotel: plannerContext?.selectedHotel,
          // Las consultas actuales (clima, eventos o fechas) se hacen en el
          // chat cuando el usuario las solicita. Repetirlas aquí retrasa la
          // creación sin modificar la geometría ni las paradas seleccionadas.
          webSearchSummary: '',
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
    
    const hasConfirmedPlaces = Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length > 0

    const plannedStops = hasConfirmedPlaces
      ? planner.selectedPlaces.map((p) => {
          if (Array.isArray(sourceTour?.itinerario)) {
            const matchedAiStop = sourceTour.itinerario.find((aiS) => {
              const placeCandidateId = getCandidateId(p)
              const aiCandidateId = readPlanCandidateId(aiS)
              if (placeCandidateId || aiCandidateId) return Boolean(placeCandidateId && aiCandidateId && placeCandidateId === aiCandidateId)
              const aiName = aiS.nombre || aiS.name || ''
              return arePlacesSimilar(aiName, p.name) ||
                     normalizePlaceKey(aiName) === normalizePlaceKey(p.name) ||
                     aiName.toLowerCase().includes(p.name.toLowerCase()) ||
                     p.name.toLowerCase().includes(aiName.toLowerCase())
            })
            if (matchedAiStop) {
              return {
                ...p,
                descripcion: (matchedAiStop.descripcion && matchedAiStop.descripcion.length > 30) ? matchedAiStop.descripcion : p.description,
                actividades: (Array.isArray(matchedAiStop.actividades) && matchedAiStop.actividades.length > 0) ? matchedAiStop.actividades : p.activities,
                datos_curiosos: (Array.isArray(matchedAiStop.datos_curiosos) && matchedAiStop.datos_curiosos.length > 0) ? matchedAiStop.datos_curiosos : p.curiousFacts,
                consejos: (Array.isArray(matchedAiStop.consejos) && matchedAiStop.consejos.length > 0) ? matchedAiStop.consejos : p.tips,
              }
            }
          }
          return p
        })
      : (Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length ? sourceTour.itinerario : (sourceTour.stops ?? planner.selectedPlaces))
    const stopsTarget = plannedStops.length > 0 ? plannedStops.length : planner.selectedPlaces.length
    const maxPlannedDay = Math.max(...plannedStops.map(p => Number(p.dia || p.day || 0)), 0)
    const totalDays = Math.max(1, Number(input.durationDays || Math.ceil(input.durationHours / 24) || 1), maxPlannedDay)
    
    const plannedPlaceNames = plannedStops.map(p => typeof p === 'string' ? p : (p?.name || p?.nombre || '')).filter(Boolean)
    const hasRichAiDescriptions = !fallbackReason &&
      Array.isArray(sourceTour?.itinerario) &&
      sourceTour.itinerario.length > 0 &&
      plannedStops.every(p => {
        const desc = p?.descripcion || p?.description
        return typeof desc === 'string' && desc.trim().length > 30 && !isGenericDescription(desc, p?.name || p?.nombre)
      })

    const richDescriptionsMap = hasRichAiDescriptions
      ? {}
      : await Promise.race([
          generateRichPlaceDescriptionsBatch({
            destination: input.destination,
            city: input.city,
            country: input.country,
            places: plannedPlaceNames,
            prompt: input.prompt
          }).catch((err) => {
            console.warn('[tour-ai] generateRichPlaceDescriptionsBatch build error:', err?.message || err)
            return {}
          }),
          new Promise(resolve => setTimeout(() => resolve({}), 12000))
        ])

    const assignedUrls = new Set()
    const settledStops = await Promise.all(
      Array.from({ length: stopsTarget }, async (_, index) => {
        const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
        const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
        const sourceDay = sourceStop?.dia ? Number(sourceStop.dia) : (sourceStop?.day ? Number(sourceStop.day) : (anchorPlace?.dia ? Number(anchorPlace.dia) : (anchorPlace?.day ? Number(anchorPlace.day) : null)))
        const calculatedDay = sourceDay || (Math.floor((index * totalDays) / stopsTarget) + 1)
        try {
          const normalized = await normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay, {
            descriptionsMap: richDescriptionsMap,
            assignedUrls
          })
          return { status: 'fulfilled', value: normalized }
        } catch (err) {
          return { status: 'rejected', reason: err }
        }
      })
    )

    const rejectedStop = settledStops.find(result => result.status === 'rejected')
    if (rejectedStop) {
      throw rejectedStop.reason instanceof Error
        ? rejectedStop.reason
        : new Error('No pudimos confirmar una o más ubicaciones del tour.')
    }
    const rawStops = settledStops.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
    
    // Preservar estrictamente el orden secuencial cronológico por días
    const seenKeys = new Set()
    const normalizedStops = []
    const selectedHotel = input.selectedHotel || plannerContext?.selectedHotel || null
    
    for (const item of rawStops) {
      const name = item.publicStop.nombre
      const nameLower = (item.routeStop?.name || name || '').toLowerCase()
      if (isAccommodationStopName(nameLower, selectedHotel)) {
        continue
      }
      const nameKey = canonicalPlaceKey(name, input.city || input.destination)
      if (!seenKeys.has(nameKey)) {
        seenKeys.add(nameKey)
        normalizedStops.push(item)
      }
    }
    
    const publicStops = normalizedStops.map(s => s.publicStop)
    const routeStops = normalizedStops.map(s => s.routeStop)
    const targetCity = input.city || input.destination || ''
    const targetCountry = input.country || 'Colombia'
    let coverUrl = await imageForPlace(targetCity, targetCity, targetCountry).catch(() => null)
    if (!coverUrl || coverUrl.includes('fallback')) {
      const cityFallback = fallbackCover(targetCity || input.destination)
      if (cityFallback) {
        coverUrl = cityFallback
      } else if (planner?.selectedPlaces?.[0]?.imageUrl && !planner.selectedPlaces[0].imageUrl.includes('fallback')) {
        coverUrl = planner.selectedPlaces[0].imageUrl
      } else {
        coverUrl = fallbackCover(input.destination || targetCity)
      }
    }
    
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

    const publicMeetingPoint = normalizeLocationInfo(sourceTour.punto_encuentro, publicStops[0], input)

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
      punto_encuentro: hotelPuntoEncuentro || publicMeetingPoint,
      public_punto_encuentro: publicMeetingPoint,
      imagen_portada: coverUrl,
      galeria_tour: deduplicateImageUrls([
        ...publicStops.flatMap(s => s.imagenes).filter(img => img && !img.includes('photo-1469854523086') && !img.includes('photo-1507525428034')),
        coverUrl,
        ...normalizeList(sourceTour.galeria_tour, [])
      ]).slice(0, 8),
      itinerario: publicStops,
      orden_paradas: publicStops.map(s => s.candidateId).filter(Boolean),
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
      user_hotel: hotelPuntoEncuentro || (chosenHotel ? {
        nombre_lugar: chosenHotel.name,
        latitud: Number(chosenHotel.latitude) || 0,
        longitud: Number(chosenHotel.longitude) || 0,
        direccion: chosenHotel.address || ''
      } : null),
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
      let targetQuery = input.destination
      if (input.isMultiCity && Array.isArray(input.cities) && input.cities.length > 0) {
        targetQuery = input.cities[0]
      } else if (input.destinationPlace) {
        targetQuery = input.destinationPlace
      }
      const queryParts = [...new Set([targetQuery, input.city, input.country].filter(Boolean))]
      canonicalDest = await resolveCanonicalDestination(queryParts.join(', '), { countryHint: input.country })
    }

    if (canonicalDest && canonicalDest.isAmbiguous && input.country && Array.isArray(canonicalDest.candidates)) {
      const countryNorm = input.country.toLowerCase().trim()
      const matchedCand = canonicalDest.candidates.find(c => 
        c.country?.toLowerCase()?.includes(countryNorm) || 
        countryNorm.includes(c.country?.toLowerCase() || '') ||
        c.countryCode?.toLowerCase() === countryNorm
      )
      if (matchedCand) {
        canonicalDest = matchedCand
        canonicalDest.isAmbiguous = false
      }
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
    if (!input.isMultiCity && (!Array.isArray(input.cities) || input.cities.length <= 1)) {
      input.destination = canonicalDest.displayName
      input.city = canonicalDest.city
      input.country = canonicalDest.country || input.country
      input.region = canonicalDest.region
    }

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
      const hasConfirmedPlaces = Array.isArray(planner.selectedPlaces) && planner.selectedPlaces.length > 0

      const plannedStops = hasConfirmedPlaces
        ? planner.selectedPlaces.map((p) => {
              if (Array.isArray(sourceTour?.itinerario)) {
                const matchedAiStop = sourceTour.itinerario.find((aiS) => {
                  const placeCandidateId = getCandidateId(p)
                  const aiCandidateId = readPlanCandidateId(aiS)
                  if (placeCandidateId || aiCandidateId) return Boolean(placeCandidateId && aiCandidateId && placeCandidateId === aiCandidateId)
                  const aiName = aiS.nombre || aiS.name || ''
                return arePlacesSimilar(aiName, p.name) ||
                       normalizePlaceKey(aiName) === normalizePlaceKey(p.name) ||
                       aiName.toLowerCase().includes(p.name.toLowerCase()) ||
                       p.name.toLowerCase().includes(aiName.toLowerCase())
              })
              if (matchedAiStop) {
                return {
                  ...p,
                  descripcion: (matchedAiStop.descripcion && matchedAiStop.descripcion.length > 30) ? matchedAiStop.descripcion : p.description,
                  actividades: (Array.isArray(matchedAiStop.actividades) && matchedAiStop.actividades.length > 0) ? matchedAiStop.actividades : p.activities,
                  datos_curiosos: (Array.isArray(matchedAiStop.datos_curiosos) && matchedAiStop.datos_curiosos.length > 0) ? matchedAiStop.datos_curiosos : p.curiousFacts,
                  consejos: (Array.isArray(matchedAiStop.consejos) && matchedAiStop.consejos.length > 0) ? matchedAiStop.consejos : p.tips,
                }
              }
            }
            return p
          })
        : (Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length ? sourceTour.itinerario : (sourceTour.stops ?? planner.selectedPlaces))
      const stopTarget = plannedStops.length > 0 ? plannedStops.length : Math.min(30, Math.max(3, planner.selectedPlaces.length))
      const maxPlannedDay = Math.max(...plannedStops.map(p => Number(p.dia || p.day || 0)), 0)
      const totalDays = Math.max(1, Number(input.durationDays || Math.ceil(input.durationHours / 24) || 1), maxPlannedDay)
      
      const plannedPlaceNames = plannedStops.map(p => typeof p === 'string' ? p : (p?.name || p?.nombre || '')).filter(Boolean)
      const hasRichAiDescriptions = !fallbackReason &&
        Array.isArray(sourceTour?.itinerario) &&
        sourceTour.itinerario.length > 0 &&
        plannedStops.every(p => {
          const desc = p?.descripcion || p?.description
          return typeof desc === 'string' && desc.trim().length > 30 && !isGenericDescription(desc, p?.name || p?.nombre)
        })

      const richDescriptionsMap = hasRichAiDescriptions
        ? {}
        : await Promise.race([
            generateRichPlaceDescriptionsBatch({
              destination: input.destination,
              city: input.city,
              country: input.country,
              places: plannedPlaceNames,
              prompt: input.prompt
            }).catch((err) => {
              console.warn('[tour-ai] generateRichPlaceDescriptionsBatch generate error:', err?.message || err)
              return {}
            }),
            new Promise(resolve => setTimeout(() => resolve({}), 12000))
          ])

      const assignedUrls = new Set()
      const settledStops = await Promise.all(
        Array.from({ length: stopTarget }, async (_, index) => {
          const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
          const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
          const sourceDay = sourceStop?.dia ? Number(sourceStop.dia) : (sourceStop?.day ? Number(sourceStop.day) : (anchorPlace?.dia ? Number(anchorPlace.dia) : (anchorPlace?.day ? Number(anchorPlace.day) : null)))
          const calculatedDay = sourceDay || (Math.floor((index * totalDays) / stopTarget) + 1)
          try {
            const normalized = await normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay, {
              descriptionsMap: richDescriptionsMap,
              assignedUrls
            })
            return { status: 'fulfilled', value: normalized }
          } catch (err) {
            return { status: 'rejected', reason: err }
          }
        })
      )
      const rejectedStop = settledStops.find(result => result.status === 'rejected')
      if (rejectedStop) {
        throw rejectedStop.reason instanceof Error
          ? rejectedStop.reason
          : new Error('No pudimos confirmar una o más ubicaciones del tour.')
      }
      const rawNormalized = settledStops.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
      
      // Preservar estrictamente el orden secuencial cronológico por días
      const seenKeys = new Set()
      const normalizedStops = []
      const selectedHotel = input.selectedHotel || null
      
      for (const item of rawNormalized) {
        const name = item.publicStop.nombre
        const nameLower = (item.routeStop?.name || name || '').toLowerCase()
        if (isAccommodationStopName(nameLower, selectedHotel)) {
          continue
        }
        const nameKey = canonicalPlaceKey(name, input.city || input.destination)
        if (!seenKeys.has(nameKey)) {
          seenKeys.add(nameKey)
          normalizedStops.push(item)
        }
      }
      
      const stops = normalizedStops.map((stop) => stop.publicStop)
      const routeStops = normalizedStops.map((stop) => stop.routeStop)
      const targetCity = input.city || input.destination || ''
      const targetCountry = input.country || 'Colombia'
      const isCoastalItinerary = isCoastalIslandsTour(input)
      const firstStop = stops[0]
      const coverUrl = isCoastalItinerary
        ? (firstStop?.imagenes?.[0] || getReliableCategoryFallbackImage(firstStop?.nombre || targetCity, 'island'))
        : ((planner?.selectedPlaces?.[0]?.imageUrl && !planner.selectedPlaces[0].imageUrl.includes('fallback'))
          ? planner.selectedPlaces[0].imageUrl
          : (await imageForPlace(targetCity, targetCity, targetCountry).catch(() => null) || fallbackCover(input.destination || targetCity)))

      let hotelPuntoEncuentro = null
      if (selectedHotel?.name) {
        let hLat = Number(selectedHotel.latitude)
        let hLon = Number(selectedHotel.longitude)
        let hAddr = selectedHotel.tags?.['addr:street'] || selectedHotel.address || ''
        if (!hLat || !hLon || Number.isNaN(hLat) || Number.isNaN(hLon)) {
          const query = `${selectedHotel.name}, ${input.city || input.destination || ''} ${input.country || ''}`.trim()
          const geo = await geocodePlace(query, input.latitude, input.longitude).catch(() => null)
          if (geo?.latitude && geo?.longitude) {
            hLat = geo.latitude
            hLon = geo.longitude
            if (!hAddr && geo.address) hAddr = geo.address
          }
        }
        if (hLat && hLon && !Number.isNaN(hLat) && !Number.isNaN(hLon)) {
          hotelPuntoEncuentro = {
            nombre_lugar: selectedHotel.name,
            direccion: hAddr,
            ciudad: input.city || input.destination || '',
            region: '',
            pais: input.country || '',
            latitud: hLat,
            longitud: hLon,
            place_id: selectedHotel.id?.toString() || '',
            url_mapa: mapUrlFor(hLat, hLon)
          }
        }
      }
      const publicMeetingPoint = normalizeLocationInfo(sourceTour.punto_encuentro, stops[0], input)
      tour = {
        id: `ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        nombre_tour: sourceTour.nombre_tour ?? sourceTour.title ?? `${input.city || input.destination} VibeTour AI`,
        resumen_corto:
          sourceTour.resumen_corto ??
          'Experiencia creada para descubrir con una ruta lógica, tiempos realistas y paradas variadas.',
        tipo_tour: sourceTour.tipo_tour ?? input.type,
        tipo_recorrido: input.tourType || '',
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
        punto_encuentro: hotelPuntoEncuentro || publicMeetingPoint,
        public_punto_encuentro: publicMeetingPoint,
        imagen_portada: isCoastalItinerary
          ? coverUrl
          : (sourceTour.imagen_portada ?? sourceTour.coverUrl ?? coverUrl),
        imagen_portada_es_demo: isCoastalItinerary && Boolean(firstStop?.isDemoImage),
        galeria_tour: deduplicateImageUrls([
          ...stops.flatMap((stop) => stop.imagenes).filter(img => img && !img.includes('photo-1469854523086') && !img.includes('photo-1507525428034')),
          coverUrl,
          ...(isCoastalItinerary ? [] : normalizeList(sourceTour.galeria_tour, [])),
        ]).slice(0, 8),
        itinerario: stops,
        orden_paradas: stops.map((stop) => stop.candidateId).filter(Boolean),
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
        user_hotel: hotelPuntoEncuentro,
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
      if (assemblyError?.code === 'UNVERIFIED_STOP_LOCATION') {
        throw assemblyError
      }
      console.error('[tour-ai] assembly-failed', { message: assemblyError?.message ?? String(assemblyError), fallbackReason, ollamaError: ollamaError ? (ollamaError.message ?? String(ollamaError)) : null })
      const emergencyTour = await buildEmergencyTour(input, planner, fallbackReason, sourceTour)
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

async function buildEmergencyTour(input, planner, fallbackReason = 'unknown', sourceTour = null) {
  const city = input.city || input.destination || 'Destino'
  const country = input.country || 'Global'
  const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
  const isCoastalItinerary = isCoastalIslandsTour(input)
  const selectedPlaces = Array.isArray(planner.selectedPlaces) ? planner.selectedPlaces : []
  const coastalDetails = isCoastalItinerary
    ? await Promise.all(selectedPlaces.map(place => coastalWikipediaSummary(place.name, city, country).catch(() => null)))
    : []
  const stops = selectedPlaces.map((place, index) => {
    const candidateId = getCandidateId(place)
    const aiStop = (sourceTour?.itinerario || []).find(stop =>
      readPlanCandidateId(stop) === candidateId || arePlacesSimilar(stop?.nombre || stop?.name || '', place.name)
    )
    const image = isCoastalItinerary
      ? getReliableCategoryFallbackImage(place.name, place.category || 'island')
      : null
    const wiki = coastalDetails[index]
    return {
      dia: Number(place.dia || place.day || (Math.floor((index * totalDays) / Math.max(1, selectedPlaces.length)) + 1)),
      parada: index + 1,
      candidateId,
      nombre: place.name,
      descripcion: wiki?.text || aiStop?.descripcion || buildStopDescription(place, input),
      descripcion_fuente: wiki?.text ? 'wikipedia' : (aiStop?.descripcion ? 'ai' : 'generated_fallback'),
      wikipedia_url: wiki?.url || '',
      duracion_estimada: `${25 + (index * 10)} minutos`,
      actividades: Array.isArray(aiStop?.actividades) && aiStop.actividades.length > 0
        ? aiStop.actividades
        : buildActivities(place, input.type),
      datos_curiosos: buildCuriousFacts(place, input.type),
      consejos: buildTips(place, input.type),
      ...(isCoastalItinerary ? { isFallbackImage: true, isDemoImage: true, isReferenceImage: true } : {}),
      ubicacion: {
        nombre_lugar: place.name,
        direccion: place.address || city,
        ciudad: place.city || city,
        region: place.region || '',
        pais: place.country || country,
        candidateId,
        place_id: candidateId || place.placeId || place.id || '',
        latitud: place.latitude,
        longitud: place.longitude,
        url_mapa: mapUrlFor(place.latitude, place.longitude),
      },
      imagenes: isCoastalItinerary ? [image] : (place.images || []),
    }
  })
  const coastalCover = isCoastalItinerary
    ? (stops[0]?.imagenes?.[0] || getReliableCategoryFallbackImage(city, 'island'))
    : fallbackCover(input.destination)
  return {
    id: `ai-emergency-${Date.now()}`,
    nombre_tour: buildTourTitle(input, planner),
    resumen_corto: `${buildShortSummary(input, planner)}. Fallback: respuesta generada sin Ollama.`,
    tipo_tour: input.type,
    tipo_recorrido: input.tourType || '',
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
    imagen_portada: coastalCover,
    imagen_portada_es_demo: isCoastalItinerary,
    galeria_tour: deduplicateImageUrls(stops.flatMap((stop) => stop.imagenes)).slice(0, 8),
    itinerario: stops,
    orden_paradas: stops.map((stop) => stop.candidateId).filter(Boolean),
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

export async function buildFallbackTour(planner, input) {
  const targetCity = input.city || input.destination || ''
  const targetLang = input.language || 'es'
  const isCoastalItinerary = isCoastalIslandsTour(input)
  // Coastal stop descriptions and photos are resolved by normalizeStop against
  // the actual island/restaurant. Avoid duplicate city-level lookups here.
  const [enrichedPlaces, cityGuide] = isCoastalItinerary
    ? [planner.selectedPlaces || [], null]
    : await Promise.all([
        Promise.all(
          (planner.selectedPlaces || []).map((place, index) =>
            enrichPlaceWithOpenData(place, targetCity, targetLang, input.country || '')
              .then((enriched) => {
                const openDetails = buildDeterministicStopDetails(enriched, {
                  city: targetCity,
                  destination: input.destination,
                  stopIndex: index
                })
                return {
                  ...place,
                  ...enriched,
                  openDescription: openDetails.description,
                  openCuriousFacts: openDetails.curiousFacts,
                  openTips: openDetails.tips, openActivities: openDetails.activities, openDurationText: openDetails.durationText
                }
              })
              .catch(() => place)
          )
        ),
        fetchWikivoyageCityGuide(targetCity, input.country || '', targetLang).catch(() => null)
      ])
  planner.selectedPlaces = enrichedPlaces
  const coverUrl = isCoastalItinerary
    ? getReliableCategoryFallbackImage(planner.selectedPlaces[0]?.name || targetCity, planner.selectedPlaces[0]?.category || 'island')
    : (planner.selectedPlaces[0]?.imageUrl ?? fallbackCover(input.destination))
  const gallery = deduplicateImageUrls(planner.selectedPlaces.flatMap((place) => place.images)).slice(0, 8)
  const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
  const stopsPerDay = Math.ceil(planner.selectedPlaces.length / totalDays)

  const itinerary = planner.selectedPlaces.map((place, index) => ({
    dia: Number(place.dia || place.day || (Math.floor(index / stopsPerDay) + 1)),
    parada: index + 1,
    candidateId: getCandidateId(place),
    nombre: place.name,
    descripcion: place.openDescription || buildStopDescription(place, input),
    duracion_estimada: place.openDurationText || `${place.minutes} minutos`,
    actividades: place.openActivities?.length > 0 ? place.openActivities : buildActivities(place, input.type),
    datos_curiosos: place.openCuriousFacts?.length > 0 ? place.openCuriousFacts : buildCuriousFacts(place, input.type),
    consejos: place.openTips?.length > 0 ? place.openTips : buildTips(place, input.type),
    ubicacion: {
      nombre_lugar: place.name,
      direccion: place.address,
      ciudad: place.city ?? input.city ?? '',
      region: place.region ?? '',
      pais: place.country ?? input.country ?? '',
      candidateId: getCandidateId(place),
      place_id: getCandidateId(place) || place.placeId || place.id || '',
      latitud: Number(place.latitude || 0),
      longitud: Number(place.longitude || 0),
      url_mapa: mapUrlFor(place.latitude, place.longitude),
    },
    imagenes: place.images,
  }))
  return {
    id: `ai-${Date.now()}`,
    nombre_tour: buildTourTitle(input, planner),
    resumen_corto: buildShortSummary(input, planner),
    tipo_tour: input.type,
    tipo_recorrido: input.tourType || '',
    subcategorias: planner.subcategorias,
    descripcion_tour: buildTourDescription(input, planner),
    experiencia_destacada: buildFeaturedExperience(input, planner),
    historia_del_lugar: cityGuide?.cityHistory || planner.selectedPlaces[0]?.history || '',
    contexto_cultural: cityGuide?.culturalContext || buildCulturalContext(input, planner),
    duracion_estimada: `${input.durationHours} horas`,
    distancia_total: `${planner.distanceKm.toFixed(1)} km`,
    nivel_dificultad: planner.difficulty,
    idiomas_disponibles: [input.language],
    publico_recomendado: planner.audience,
    mejor_epoca: planner.bestSeason,
    horario_recomendado: planner.recommendedSchedule,
    punto_encuentro: normalizeLocationInfo(null, itinerary[0], input),
    imagen_portada: coverUrl,
    imagen_portada_es_demo: isCoastalItinerary,
    galeria_tour: gallery,
    itinerario: itinerary,
    orden_paradas: itinerary.map((stop) => stop.candidateId).filter(Boolean),
    incluye: defaultIncludes(input.type),
    no_incluye: defaultExcludes(),
    recomendaciones: cityGuide?.recommendations?.length > 0 ? cityGuide.recommendations : defaultRecommendations(),
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
  const isCoastalIslands = isCoastalIslandsTour(input)
  const origin = location ? { latitude: location.latitude, longitude: location.longitude } : null
  const refList = (Array.isArray(input.specificPlaces) && input.specificPlaces.length > 0)
    ? input.specificPlaces
    : (Array.isArray(input.selectedPlaces) ? input.selectedPlaces : [])

  let candidatePlaces = Array.isArray(places) && places.length > 0 ? [...places] : []
  if (candidatePlaces.length === 0 && !isCoastalIslands) {
    candidatePlaces = [...refList]
  } else if (refList.length > 0) {
    for (const ref of refList) {
      const refName = typeof ref === 'string' ? ref.trim() : String(ref?.name || '').trim()
      if (!refName) continue
      const refKey = normalizePlaceKey(refName)
      const exactMatch = candidatePlaces.find(p => normalizePlaceKey(p.name || '') === refKey)
      const existing = exactMatch || candidatePlaces.find(p => arePlacesSimilar(p.name || '', refName))
      if (existing) {
        if (typeof ref === 'object') {
          if (isCoastalIslands) {
            // Keep the mapped candidate's identity and coordinates canonical;
            // chat text may contribute its requested day and generated content.
            for (const key of ['dia', 'day', 'description', 'descripcion', 'activities', 'actividades', 'tips', 'consejos', 'suggestedMinutes', 'duracion_estimada']) {
              if (ref[key] != null) existing[key] = ref[key]
            }
            existing.rawTags = { ...(existing.rawTags || {}), requested_place: 'true' }
            existing.isRequested = true
          } else {
            Object.assign(existing, {
              ...ref,
              rawTags: { ...(existing.rawTags || {}), requested_place: 'true' },
              isRequested: true,
            })
          }
        } else {
          existing.isRequested = true
          existing.rawTags = { ...(existing.rawTags || {}), requested_place: 'true' }
        }
      } else {
        if (isCoastalIslands) continue
        const item = typeof ref === 'object' ? { ...ref } : { name: refName }
        item.rawTags = { ...(item.rawTags || {}), requested_place: 'true' }
        item.isRequested = true
        candidatePlaces.push(item)
      }
    }
  }

  // Island-coast tours only use actual OSM features. This keeps ports out of
  // the tourist-stop list and prevents an unmapped chat mention from inheriting
  // the destination centroid as its coordinates.
  if (isCoastalIslands) {
    candidatePlaces = candidatePlaces.filter(isCoastalMappedTouristStop)
  }

  const normalized = uniqueByName(
    candidatePlaces.map((place, index) => normalizeCandidate(place, index, input, origin)),
  ).filter((place) => place.name && (!isCoastalIslands || isCoastalMappedTouristStop(place)))

  const originStr = String(input.originPlace || '').trim()
  const destStr = String(input.destinationPlace || input.destination || input.city || '').trim()
  const isLocationToDestTour = Boolean(
    input.tourType === 'location_to_destination' ||
    input.isUserLocationOrigin ||
    input.originPlace === 'user_current_location'
  )
  const isIntraCityOrSingleCity = !isLocationToDestTour && Boolean(
    input.tourType === 'single_city' ||
    input.tourType === 'express_tour' ||
    (originStr && destStr && normalizeKey(originStr) === normalizeKey(destStr))
  )

  const isCorridorRoute = isLocationToDestTour || (!isIntraCityOrSingleCity && Boolean(
    input.tourType === 'city_to_city' ||
    input.tourType === 'location_to_destination' ||
    (input.isUserLocationOrigin && !isIntraCityOrSingleCity) ||
    (input.originPlace === 'user_current_location' && !isIntraCityOrSingleCity) ||
    (originStr && destStr && normalizeKey(originStr) !== normalizeKey(destStr))
  ))
  let selectedPlaces = []
  const isUserOrigin = Boolean(input.isUserLocationOrigin || input.originPlace === 'user_current_location' || input.tourType === 'location_to_destination')

  const requestedCount = normalized.filter(p => 
    p.rawTags?.requested_place === 'true' || 
    p.category === 'requested' || 
    (refList.length > 0 && refList.some(sp => arePlacesSimilar(typeof sp === 'object' ? sp.name : sp, p.name)))
  ).length
  const baseStopTarget = stopCountForDuration(input.durationHours)
  const stopTarget = requestedCount >= 2
    ? requestedCount
    : Math.max(baseStopTarget, requestedCount)

  if (isCorridorRoute) {
    const rawDestName = input.destinationPlace || input.destination || ''
    const cleanDest = cleanLandmarkOrPlaceName(rawDestName)
    const destName = cleanDest || rawDestName
    const destKey = normalizeKey(destName)
    
    // Origin place candidate (only used as a tourist stop if genuine landmark, NOT user current location)
    const startPlaceCandidate = normalized.find(p => 
      p.rawTags?.start_point === 'true' || 
      p.type === 'start_point' || 
      (input.originPlace && normalizeKey(p.name) === normalizeKey(input.originPlace))
    ) || (Number.isFinite(Number(input.latitude)) && Number.isFinite(Number(input.longitude)) ? { name: 'Tu ubicación actual', latitude: Number(input.latitude), longitude: Number(input.longitude), type: 'start_point' } : null)

    // End place candidate (Destination)
    let endPlaceCandidate = normalized.find(p => 
      p.rawTags?.end_point === 'true' || 
      p.type === 'end_point' || 
      (destKey && normalizeKey(p.name) === destKey) || 
      (cleanDest && arePlacesSimilar(p.name, cleanDest)) ||
      (rawDestName && arePlacesSimilar(p.name, rawDestName)) ||
      (destKey.length >= 4 && normalizeKey(p.name).includes(destKey))
    )
    if (!endPlaceCandidate && destName) {
      const refDest = refList.find(r => arePlacesSimilar(typeof r === 'object' ? r.name : r, destName) || arePlacesSimilar(typeof r === 'object' ? r.name : r, cleanDest))
      const lat = (refDest && Number.isFinite(Number(refDest.latitude))) ? Number(refDest.latitude) : Number(location?.latitude || 0)
      const lon = (refDest && Number.isFinite(Number(refDest.longitude))) ? Number(refDest.longitude) : Number(location?.longitude || 0)
      endPlaceCandidate = normalizeCandidate({
        name: cleanDest || destName,
        latitude: lat,
        longitude: lon,
        type: 'end_point',
        category: 'attraction',
        rawTags: { end_point: 'true', requested_place: 'true' }
      }, 0, input, origin)
    }

    const startLoc = {
      latitude: Number(input.latitude ?? location?.latitude ?? startPlaceCandidate?.latitude ?? 0),
      longitude: Number(input.longitude ?? location?.longitude ?? startPlaceCandidate?.longitude ?? 0)
    }
    const endLoc = endPlaceCandidate ? {
      latitude: Number(endPlaceCandidate.latitude ?? location?.latitude ?? 0),
      longitude: Number(endPlaceCandidate.longitude ?? location?.longitude ?? 0)
    } : null

    // Intermediates candidate pool: EXCLUDE startPlaceCandidate (if user location) and endPlaceCandidate
    let intermediates = normalized.filter(p => {
      const isStart = (isUserOrigin && (normalizeKey(p.name).includes('tu ubicacion') || p.type === 'start_point' || p.rawTags?.start_point === 'true')) ||
        (startPlaceCandidate && (normalizeKey(p.name) === normalizeKey(startPlaceCandidate.name) || arePlacesSimilar(p.name, startPlaceCandidate.name)))
      const isEnd = (endPlaceCandidate && (normalizeKey(p.name) === normalizeKey(endPlaceCandidate.name) || arePlacesSimilar(p.name, endPlaceCandidate.name))) ||
        (destName && arePlacesSimilar(p.name, destName)) ||
        (cleanDest && arePlacesSimilar(p.name, cleanDest)) ||
        (rawDestName && arePlacesSimilar(p.name, rawDestName)) ||
        (destKey.length >= 4 && normalizeKey(p.name) === destKey)
      return !isStart && !isEnd
    })

    // If we have requested places from the chat (SSOT):
    const requestedIntermediates = []
    const otherIntermediates = []
    for (const p of intermediates) {
      const isRequested = p.rawTags?.requested_place === 'true' ||
                          p.category === 'requested' ||
                          refList.some(sp => arePlacesSimilar(typeof sp === 'object' ? sp.name : sp, p.name))
      if (isRequested) {
        requestedIntermediates.push(p)
      } else {
        otherIntermediates.push(p)
      }
    }

    let pickedIntermediates = []
    if (requestedIntermediates.length >= 1) {
      requestedIntermediates.sort((a, b) => {
        const idxA = refList.findIndex(item => arePlacesSimilar(typeof item === 'object' ? item.name : item, a.name))
        const idxB = refList.findIndex(item => arePlacesSimilar(typeof item === 'object' ? item.name : item, b.name))
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
      })

      pickedIntermediates = [...requestedIntermediates]
      const reservedCount = (endPlaceCandidate ? 1 : 0) + (!isUserOrigin && startPlaceCandidate ? 1 : 0)
      if (pickedIntermediates.length < stopTarget - reservedCount) {
        const scoredOther = otherIntermediates
          .filter(p => isWithinCorridor(p, startPlaceCandidate, endPlaceCandidate, true))
          .map(p => ({ ...p, score: scorePlace(p, input) }))
          .sort((a, b) => b.score - a.score)
        const needed = stopTarget - reservedCount - pickedIntermediates.length
        pickedIntermediates.push(...scoredOther.slice(0, needed))
      }
    } else {
      let corridorIntermediates = intermediates.filter(p => isWithinCorridor(p, startPlaceCandidate, endPlaceCandidate))
      if (corridorIntermediates.length < 2) {
        corridorIntermediates = intermediates.filter(p => isWithinCorridor(p, startPlaceCandidate, endPlaceCandidate, true))
      }
      if (corridorIntermediates.length < 2 && startPlaceCandidate && endPlaceCandidate) {
        const candidatesWithDetour = intermediates.map(p => ({
          ...p,
          detourKm: computeDetourDistance(p, startPlaceCandidate, endPlaceCandidate)
        })).sort((a, b) => a.detourKm - b.detourKm)
        corridorIntermediates = candidatesWithDetour.slice(0, 4)
      }
      const scored = corridorIntermediates
        .map(p => ({ ...p, score: scorePlace(p, input) }))
        .sort((a, b) => b.score - a.score)
      const reservedCount = (!isUserOrigin && startPlaceCandidate ? 1 : 0) + (endPlaceCandidate ? 1 : 0)
      const neededIntermediates = Math.max(1, Math.min(scored.length, stopTarget - reservedCount))
      pickedIntermediates = scored.slice(0, neededIntermediates)
    }

    if (startLoc && endLoc && pickedIntermediates.length > 1) {
      pickedIntermediates = orderPlacesAlongRoute(pickedIntermediates, startLoc, endLoc)
    }

    selectedPlaces = []
    if (startPlaceCandidate && !isUserOrigin && !normalizeKey(startPlaceCandidate.name).includes('tu ubicacion')) {
      selectedPlaces.push(startPlaceCandidate)
    }
    for (const inter of pickedIntermediates) {
      if (endPlaceCandidate && arePlacesSimilar(inter.name, endPlaceCandidate.name)) continue
      if (cleanDest && arePlacesSimilar(inter.name, cleanDest)) continue
      if (destName && arePlacesSimilar(inter.name, destName)) continue
      selectedPlaces.push(inter)
    }
    if (endPlaceCandidate) {
      const finalEndName = cleanDest || cleanLandmarkOrPlaceName(endPlaceCandidate.name) || endPlaceCandidate.name
      selectedPlaces.push({
        ...endPlaceCandidate,
        name: finalEndName,
        address: endPlaceCandidate.address || (endPlaceCandidate.name !== finalEndName ? endPlaceCandidate.name : '')
      })
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
      const normA = nameA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const normB = nameB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      if (normA === normB) return true
      const invA = /^restaurante\s+/.test(normA) ? normA.replace(/^restaurante\s+/, '') + ' restaurante' : normA.replace(/\s+restaurante$/, '')
      const invB = /^restaurante\s+/.test(normB) ? normB.replace(/^restaurante\s+/, '') + ' restaurante' : normB.replace(/\s+restaurante$/, '')
      if (normA === invB || normB === invA) return true
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

      const maxRequestedDay = Math.max(
        ...requestedPlaces.map(p => Number(p.dia || p.day || 0)),
        ...refList.map(item => Number(typeof item === 'object' ? (item.dia || item.day || 0) : 0)),
        0
      )
      const baseDays = Math.max(1, Number(input.durationDays || Math.ceil((input.durationHours || 24) / 24) || 1))
      const totalDays = Math.max(baseDays, maxRequestedDay)
      if (totalDays > baseDays) {
        input.durationDays = totalDays
        input.durationHours = totalDays === 1 ? 8 : totalDays * 24
      }
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

      if (isCoastalIslands) {
        selectedPlaces = assignCoastalIslandDays(selectedPlaces, totalDays)
      }

      // Ordenar estrictamente por día y dentro del día preservar el orden secuencial exacto del chat
      selectedPlaces.sort((a, b) => {
        const dayDiff = (Number(a.dia || a.day || 1) - Number(b.dia || b.day || 1))
        if (dayDiff !== 0) return dayDiff
        const idxA = refList.findIndex(item => isPlaceMatching(a.name, getName(item)))
        const idxB = refList.findIndex(item => isPlaceMatching(b.name, getName(item)))
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
      })

      // Optimizar la ruta intra-día por proximidad manteniendo fija la primera parada del día como ancla
      const daysMap = new Map()
      for (const p of selectedPlaces) {
        const dayKey = Number(p.dia || p.day || 1)
        if (!daysMap.has(dayKey)) daysMap.set(dayKey, [])
        daysMap.get(dayKey).push(p)
      }

      const isFoodStop = (p) => {
        if (!p || !p.name) return false
        const isAttraction = /\b(zool[oó]gico|zoologico|zoo|acuario|bioparque|museo|museum|casa\s+museo|galer[ií]a|catedral|cathedral|bas[ií]lica|iglesia|parroquia|templo|santuario|castillo|castle|fuerte|fort|muralla|baluarte|malec[oó]n|malecon|ronda|muelle|mirador|viewpoint|monumento|monument|estatua|obelisco|teatro|parque|ecoparque|ci[eé]naga|laguna|playa|isla|puente|bridge)\b/i.test(p.name)
        if (isAttraction) return false
        return getPlaceEntityType(p.name) === 'food' || p.category === 'restaurant' || p.category === 'cafe' || p.type === 'food' || p.isRestaurant === true
      }

      // Invariant: Guarantee all days 1..totalDays exist without gaps and have balanced stops
      const usedNames = new Set(selectedPlaces.map(p => normalizePlaceKey(p.name)))
      const availableAttractions = otherPlaces.filter(p => !isFoodStop(p) && isValidTouristAttraction(p, input))
      const availableRestaurants = [
        ...otherPlaces.filter(p => isFoodStop(p)),
        ...candidatePlaces.filter(p => isFoodStop(p) && !selectedPlaces.some(sp => isPlaceMatching(sp.name, p.name)))
      ]

      for (let d = 1; d <= totalDays; d++) {
        if (!daysMap.has(d)) {
          daysMap.set(d, [])
        }
        const dayPlaces = daysMap.get(d)

        // 1. Backfill attractions if day is empty or underfilled (< 2 attractions)
        const currentAttractions = dayPlaces.filter(p => !isFoodStop(p))
        const attractionsPerDay = isCoastalIslands ? 0 : 2
        while (currentAttractions.length < attractionsPerDay && availableAttractions.length > 0) {
          const cand = availableAttractions.shift()
          if (!cand || !cand.name) continue
          const key = normalizePlaceKey(cand.name)
          if (!usedNames.has(key)) {
            usedNames.add(key)
            const filled = { ...cand, dia: d, day: d, category: cand.category || 'attraction' }
            dayPlaces.unshift(filled)
            currentAttractions.push(filled)
          }
        }

        // 2. Add 1 restaurant if day has no restaurant and restaurants are available
        const hasFood = dayPlaces.some(p => isFoodStop(p))
        if (!isCoastalIslands && !hasFood && availableRestaurants.length > 0) {
          const restIdx = availableRestaurants.findIndex(r => !usedNames.has(normalizePlaceKey(r.name)))
          if (restIdx !== -1) {
            const [rest] = availableRestaurants.splice(restIdx, 1)
            usedNames.add(normalizePlaceKey(rest.name))
            dayPlaces.push({
              ...rest,
              dia: d,
              day: d,
              category: 'restaurant',
              entityType: 'restaurant',
              type: 'food',
              isRestaurant: true
            })
          }
        }
      }

      const reorderedByDay = []
      for (let d = 1; d <= totalDays; d++) {
        const dayPlaces = daysMap.get(d) || []
        if (dayPlaces.length === 0) continue
        if (isCoastalIslands && !dayPlaces.some(p => !isFoodStop(p))) continue

        const isDayFullySpecified = refList.length > 0 && dayPlaces.every(p => refList.some(r => isPlaceMatching(p.name, getName(r))))
        if (!isLocationToDestTour && !isDayFullySpecified && dayPlaces.length >= 3 && dayPlaces.some(p => p.latitude && p.longitude)) {
          // Lunch / restaurant stop belongs in the middle of the day's itinerary (e.g. Stop 3 out of 5)
          const foodIdx = dayPlaces.findIndex((p) => isFoodStop(p))
          if (foodIdx !== -1) {
            const reordered = [...dayPlaces]
            const [foodItem] = reordered.splice(foodIdx, 1)
            const midIndex = Math.floor(reordered.length / 2)
            reordered.splice(midIndex, 0, foodItem)
            reorderedByDay.push(...reordered)
            continue
          }
        }
        reorderedByDay.push(...dayPlaces)
      }
      // Preservar fielmente el orden y la distribución de días acordados en el chat
      selectedPlaces = reorderedByDay
    } else {
      scored.sort((a, b) => b.score - a.score)
      selectedPlaces = selectPlaces(scored, stopTarget, input)
      if (selectedPlaces.length < Math.min(3, scored.length) && scored.length >= 3) {
        const expanded = scored.filter((place) => !selectedPlaces.some((picked) => normalizeKey(picked.name) === normalizeKey(place.name)))
        selectedPlaces.push(...expanded.slice(0, Math.max(0, Math.min(stopTarget, 3) - selectedPlaces.length)))
      }
    }

    if (isCoastalIslands && requestedPlaces.length === 0) {
      const totalDays = Math.max(1, Number(input.durationDays || Math.ceil((input.durationHours || 24) / 24) || 1))
      selectedPlaces = assignCoastalIslandDays(selectedPlaces, totalDays)
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
    } else if (selectedPlaces.length > 1 && requestedPlaces.length === 0) {
      const isCorridorOrLocationToDest = isLocationToDestTour || (!isIntraCityOrSingleCity && Boolean(
        isCorridorRoute || input.tourType === 'location_to_destination' || input.isUserLocationOrigin
      ))
      if (!isCorridorOrLocationToDest) {
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
          const attrs = selectedPlaces.filter(p => getPlaceEntityType(p.name) !== 'food' && p.category !== 'restaurant' && p.category !== 'cafe'); const rests = selectedPlaces.filter(p => getPlaceEntityType(p.name) === 'food' || p.category === 'restaurant' || p.category === 'cafe'); const clustered = clusterStopsIntoCoherentDays(attrs, rests, { numDays: totalDays, city: input.city || input.destination, cityCenter: origin }); const clusteredFlat = clustered.flatMap(dp => sortPlacesByProximity(dp.stops, dp.day === 1 ? origin : null)); selectedPlaces = clusteredFlat.length > 0 ? clusteredFlat : (chunked.length > 0 ? chunked : selectedPlaces)
        }
      }
    }
  }

  const isCorridorOrLocationToDest = isLocationToDestTour || (!isIntraCityOrSingleCity && Boolean(
    isCorridorRoute || input.tourType === 'location_to_destination' || input.isUserLocationOrigin
  ))
  if (isCorridorOrLocationToDest && selectedPlaces.length > 0) {
    if (isUserOrigin) {
      selectedPlaces = selectedPlaces.filter(p => 
        !normalizeKey(p.name).includes('tu ubicacion') && 
        p.type !== 'start_point' && 
        p.rawTags?.user_current_location !== 'true'
      )
    }

    const rawDestName = input.destinationPlace || input.destination || ''
    const cleanDest = cleanLandmarkOrPlaceName(rawDestName)
    const destName = cleanDest || rawDestName
    const destKey = normalizeKey(destName)
    if (destName) {
      // Find ALL places matching the destination to completely avoid duplicate entries
      const matchingIndices = []
      for (let i = 0; i < selectedPlaces.length; i++) {
        const p = selectedPlaces[i]
        const k = normalizeKey(p.name || '')
        if (k === destKey || 
            arePlacesSimilar(p.name, destName) || 
            arePlacesSimilar(p.name, cleanDest) || 
            arePlacesSimilar(p.name, rawDestName) ||
            (destKey.length >= 4 && (k.includes(destKey) || destKey.includes(k)))) {
          matchingIndices.push(i)
        }
      }

      let destStop = null
      if (matchingIndices.length > 0) {
        const bestIdx = matchingIndices[matchingIndices.length - 1]
        const origStop = selectedPlaces[bestIdx]
        const cleanStopName = cleanDest || cleanLandmarkOrPlaceName(origStop.name) || origStop.name
        destStop = {
          ...origStop,
          name: cleanStopName,
          address: origStop.address || (origStop.name !== cleanStopName ? origStop.name : '')
        }
        selectedPlaces = selectedPlaces.filter((_, idx) => !matchingIndices.includes(idx))
      } else {
        const refDest = refList.find(r => arePlacesSimilar(typeof r === 'object' ? r.name : r, destName) || arePlacesSimilar(typeof r === 'object' ? r.name : r, cleanDest))
        const lat = (refDest && Number.isFinite(Number(refDest.latitude))) ? Number(refDest.latitude) : Number(location?.latitude || 0)
        const lon = (refDest && Number.isFinite(Number(refDest.longitude))) ? Number(refDest.longitude) : Number(location?.longitude || 0)
        destStop = normalizeCandidate({
          name: cleanDest || destName,
          latitude: lat,
          longitude: lon,
          type: 'end_point',
          category: 'attraction',
          rawTags: { end_point: 'true', requested_place: 'true' }
        }, 0, input, origin)
      }

      // Ensure no remaining intermediate has a similar name to the destination stop
      selectedPlaces = selectedPlaces.filter(p => 
        !arePlacesSimilar(p.name, destStop.name) && 
        !arePlacesSimilar(p.name, destName) && 
        !arePlacesSimilar(p.name, cleanDest)
      )

      selectedPlaces.push(destStop)
    }
    const userStartLat = Number(input.latitude ?? location?.latitude)
    const userStartLon = Number(input.longitude ?? location?.longitude)
    if (Number.isFinite(userStartLat) && Number.isFinite(userStartLon) && selectedPlaces.length > 1) {
      const startLoc = { latitude: userStartLat, longitude: userStartLon }
      const lastStop = selectedPlaces[selectedPlaces.length - 1]
      const endLoc = { latitude: lastStop.latitude, longitude: lastStop.longitude }
      const intermediates = selectedPlaces.slice(0, selectedPlaces.length - 1)
      if (intermediates.length > 1 && Number.isFinite(lastStop.latitude) && Number.isFinite(lastStop.longitude)) {
        const orderedIntermediates = orderPlacesAlongRoute(intermediates, startLoc, endLoc)
        selectedPlaces = [...orderedIntermediates, lastStop]
      }
    }
  }

  // Pure intra-city or single-city tours: rigorously filter out any ghost start/end points
  if (isIntraCityOrSingleCity && selectedPlaces.length > 0) {
    selectedPlaces = selectedPlaces.filter(p => {
      const pKey = normalizeKey(p.name || '')
      if (pKey === 'tu ubicacion actual' || pKey === 'tu ubicacion' || p.type === 'start_point' || p.rawTags?.user_current_location === 'true') {
        return false
      }
      if (destStr && (pKey === normalizeKey(destStr) || pKey === normalizeKey(input.city || '')) && p.category !== 'restaurant') {
        return false
      }
      return true
    })
  }

  const distanceKm = estimateRouteDistance(selectedPlaces, origin)
  const recommendedSchedule = recommendedScheduleFor(input, selectedPlaces.length)
  const difficulty = input.durationHours <= 3.5
    ? 'Facil'
    : input.durationHours <= 6.5
      ? 'Media'
      : 'Intensa'
  return {
    totalDays: Math.max(1, Number(input.durationDays || Math.ceil((input.durationHours || 24) / 24) || 1)),
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

export function rebuildCoastalChatItinerary(sourceText, stops, destination, requestedDays = 1) {
  const text = String(sourceText || '').trim()
  const marker = /Itinerario de Viaje:|(?:^|\n)\s*D[ií]a\s*1\s*:/i.exec(text)
  if (!marker) return text

  const start = marker.index + (text.slice(marker.index).startsWith('\n') ? 1 : 0)
  const rawIntro = text.slice(0, start).trim()
  const containsInternalCatalogDiagnostic = /\b(?:cat[aá]logo\s+verificado|lugares\s+confirmados?\s+en\s+el\s+mapa|nombres\s+(?:legibles|confirmados)\s+de|openstreetmap|openfreemap|\bOSM\b)\b/i.test(rawIntro)
  const intro = containsInternalCatalogDiagnostic ? '' : rawIntro
  const confirmation = text.match(/¿Deseas confirmar este itinerario(?: ampliado)? y generar tu tour en el mapa\?/i)?.[0] || ''
  const days = new Map()
  for (const stop of Array.isArray(stops) ? stops : []) {
    const name = String(stop?.name || stop?.nombre || '').trim()
    if (!name) continue
    const day = Math.max(1, Number(stop?.dia || stop?.day || 1))
    if (!days.has(day)) days.set(day, [])
    days.get(day).push(name)
  }

  if (days.size === 0) {
    const notice = `No encontré suficientes opciones para proponer un itinerario confiable en ${destination}. ¿Quieres que amplíe la búsqueda a zonas cercanas?`
    return [intro, notice].filter(Boolean).join('\n\n')
  }

  const totalDays = Math.max(Number(requestedDays) || 1, ...days.keys())
  const blocks = [...days.entries()]
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([day, names]) => `Día ${day}: ${destination}\n${names.map(name => `• ${name}`).join('\n')}`)
  const header = `Itinerario de Viaje: ${destination} (${totalDays} ${totalDays === 1 ? 'día' : 'días'})`
  return [intro, header, ...blocks, confirmation].filter(Boolean).join('\n\n')
}

function normalizeCandidate(place, index, input, origin) {
  const name = place.name?.toString().trim() || `${input.destination} parada ${index + 1}`
  let latitude = Number(place.latitude)
  let longitude = Number(place.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
    const infoLat = Number(place.locationInfo?.latitud ?? place.locationInfo?.latitude)
    const infoLon = Number(place.locationInfo?.longitud ?? place.locationInfo?.longitude)
    if (Number.isFinite(infoLat) && Number.isFinite(infoLon) && !(infoLat === 0 && infoLon === 0)) {
      latitude = infoLat
      longitude = infoLon
    } else if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude) && !(origin.latitude === 0 && origin.longitude === 0)) {
      latitude = origin.latitude
      longitude = origin.longitude
    } else if (input && Number.isFinite(Number(input.latitude)) && Number.isFinite(Number(input.longitude)) && !(Number(input.latitude) === 0 && Number(input.longitude) === 0)) {
      latitude = Number(input.latitude)
      longitude = Number(input.longitude)
    } else {
      latitude = 0
      longitude = 0
    }
  }
  const distanceMeters = origin ? haversineMeters(origin.latitude, origin.longitude, latitude, longitude) : 0
  const category = normalizeCategory(place)
  const broadGroup = groupForCategory(category, input.type)
  const tags = normalizeTags(place.tags)
  const osmIdentity = String(place.placeId ?? place.place_id ?? place.osmId ?? place.osm_id ?? '')
  const parsedOsmType = osmIdentity.match(/(?:^|[:/])(node|way|relation)[/:]\d+(?:$|\b)/i)?.[1]?.toLowerCase()
  const osmType = String(place.osmType ?? place.osm_type ?? place.geometryType ?? tags.osmType ?? tags.osm_type ?? parsedOsmType ?? '').toLowerCase()
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
    placeId: place.placeId ?? place.place_id ?? place.id ?? '',
    osmType,
    osm_type: osmType,
    osmId: place.osmId ?? place.osm_id ?? (parsedOsmType ? osmIdentity.match(/(?:^|[:/])(?:node|way|relation)[/:](\d+)/i)?.[1] : ''),
    candidateId: getCandidateId({
      ...place,
      placeId: place.placeId ?? place.place_id ?? place.id ?? '',
      latitude,
      longitude
    }),
    coordinateSource: place.coordinateSource ?? place.coordinate_source ?? '',
    coordinatesVerified: isVerifiedCoordinatePlace(place),
    coordinates_verified: isVerifiedCoordinatePlace(place),
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

  // Significant boost for certified iconic tourism attractions (Wikipedia, TomTom, iconic landmarks)
  if (place.fromWikipediaDiscovery || place.source === 'wikipedia-geosearch' || place.source === 'wikipedia-discovery' || place.tags?.from_wikipedia || place.tags?.iconic_landmark) {
    finalScore += 250
  }
  if (place.coordinateSource === 'tomtom' || place.source === 'tomtom' || place.tags?.tomtom_landmark) {
    finalScore += 200
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
      if (seen.has(key) || selected.some(s => arePlaceNamesSemanticallySame(s.name, candidate.name, input.city || input.destination))) continue
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

  // Long duration does not make a single-city tour regional. Use the
  // explicitly resolved geographic topology instead.
  const isRegionalOrNature = geographicScopeFor(input).isRegional

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
  return estimateRealisticStopDurationMinutes(place, index)
  const isDining = place?.category === 'restaurant' || isFoodOrDrinkEstablishment(place?.name || '')
  if (isDining) {
    if (durationHours <= 3.5) return 45
    return 65
  }
  const totalMinutes = durationHours * 60
  const transitMinutes = Math.max(12, (totalStops - 1) * (durationHours <= 3.5 ? 8 : 12))
  const available = Math.max(35, totalMinutes - transitMinutes)
  const base = available / totalStops
  const emphasis = index === 0 ? 1.15 : index < 2 && durationHours > 4 ? 1.08 : 0.95
  const categoryBoost = ['museum', 'historic', 'attraction', 'market', 'park', 'nightclub', 'bar'].includes(place?.category)
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
  if (durationHours <= 5) return 4
  if (durationHours <= 24) return 5
  if (durationHours <= 48) return 10
  if (durationHours <= 72) return 15
  return Math.max(15, Math.ceil((durationHours || 24) / 24) * 5)
}

function normalizeCategory(place) {
  const category = String(place.category ?? place.type ?? '').toLowerCase()
  const name = String(place.name ?? '').toLowerCase()
  const tags = normalizeTags(place.tags)
  const isCulturalPOI = /\b(zool[óo]gico|zoologico|zoo|acuario|bioparque|museo|museum|galer[íi]a|catedral|cathedral|iglesia|church|templo|temple|bas[íi]lica|parque|park|plaza|plazoleta|paseo|calle|avenida|bulevar|monumento|monument|malec[óo]n|malecon|teatro|theatre|carnaval|estadio|stadium|sendero|playa|mirador)\b/i.test(name)
  const isExplicitDiningName = !isCulturalPOI && (category === 'restaurant' || category === 'food' || String(place.entityType || '').toLowerCase() === 'restaurant' || /\b(restaurante|restaurant|vegetariano|vegano|creper[íi]a|bistro|caf[ée]|cafeter[íi]a|bar|gastrobar|pizzer[íi]a|asador|asados|parrilla|taquer[íi]a|panader[íi]a|pasteler[íi]a|reposter[íi]a|helader[íi]a|marisquer[íi]a|ostras|ostrer[íi]a|mariscos|del\s+sabor|cazuela|pescado|arroz|fritos|cevicher[íi]a|cebicher[íi]a|trattoria|steakhouse|piqueteadero|comedor|saz[oó]n|fog[oó]n)\b/i.test(name))
  if (isExplicitDiningName) {
    return /\b(caf[ée]|cafeter[íi]a|panader[íi]a|pasteler[íi]a|reposter[íi]a|helader[íi]a)\b/i.test(name) ? 'cafe' : 'restaurant'
  }

  const merged = (category + ' ' + name + ' ' + tags.join(' ')).toLowerCase()
  if (/(stadium|sports_centre|sport|pitch|arena|track|fitness|cancha|estadio|deporte|running|ciclismo)/.test(merged)) return 'sports'
  if (/(museum|gallery|arts? centre|art|museo|galeria)/.test(merged)) return 'museum'
  if (/(zoo|aquarium|playground|family|children|ninos|infantil)/.test(merged)) return 'family'
  if (/(church|cathedral|mosque|temple|catedral|iglesia)/.test(merged)) return 'religious'
  if (/(historic|monument|memorial|ruins|castle|archaeological|heritage|monumento|histori|patrimonio|plaza)/.test(merged)) return 'historic'
  if (/(park|garden|reserve|nature|trail|forest|beach|viewpoint|parque|jardin|sendero|playa|mirador|malecon|river|rio)/.test(merged)) {
    return merged.includes('viewpoint') || merged.includes('mirador') ? 'viewpoint' : merged.includes('trail') || merged.includes('sendero') ? 'trail' : 'nature'
  }
  if (!isCulturalPOI || isExplicitDiningName) {
    if (/(marketplace|market|mercado|plaza de mercado)/.test(merged)) return 'market'
    if (/(restaurant|restaurante|food|comida|ceviche|arepa|cocina|bistro|bakery|panaderia)/.test(merged)) return 'restaurant'
    if (/(cafe|coffee|cafeteria)/.test(merged)) return 'cafe'
    if (/(bar|pub|nightclub|discoteca|terraza|rooftop)/.test(merged)) return 'nightlife'
  }
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
  const city = normalizeKey(input.city || input.destination || '')
  const text = normalizeKey(place?.name || '')
  let score = 0

  // 1. Worldwide encyclopedic prominence (Wikidata / Wikipedia tags from OpenStreetMap)
  const tags = place?.rawTags || place?.tags
  if (tags && (tags.wikidata || tags.wikipedia)) {
    score += 6
  }

  // 2. Dynamic iconic landmarks for this destination (any city in the world)
  const dynamicLandmarks = input?.plannerContext?.dynamicLandmarks || input?.dynamicLandmarks || []
  if (Array.isArray(dynamicLandmarks) && dynamicLandmarks.length > 0) {
    const isLandmark = dynamicLandmarks.some(l => {
      const lName = normalizeKey(typeof l === 'string' ? l : (l?.name || ''))
      return lName && (text.includes(lName) || lName.includes(text))
    })
    if (isLandmark) score += 6
  }

  // 3. Fallback compatibility seeds
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
  if (matches.length > 0) score += matches.length * 4

  return clamp(score, 0, 10)
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
  const creativeVariations = {
    historical: [
      `Huellas y Memorias de ${city}`,
      `Ruta del Patrimonio y Leyendas en ${city}`,
      `Secretos Coloniales y Memoria Viva de ${city}`
    ],
    gastronomic: [
      `Sabores de Barrio y Fogones de ${city}`,
      `Ruta del Paladar: Tradición Culinaria en ${city}`,
      `Sazón y Tradición Gastronómica en ${city}`
    ],
    ecological: [
      `Ruta Verde y Brisas Naturales de ${city}`,
      `Senderos y Paisajes Escondidos de ${city}`,
      `Oasis Urbano y Ecosistemas de ${city}`
    ],
    night: [
      `Luces, Ritmo y Noche Bohemia en ${city}`,
      `Bajo las Estrellas: Vida Nocturna de ${city}`,
      `Ecos y Terrazas: La Noche en ${city}`
    ],
    family: [
      `Aventura en Familia: Descubriendo ${city}`,
      `Ruta de Parques, Cultura y Diversión en ${city}`,
      `Tesoros Urbanos para Todas las Edades en ${city}`
    ],
    cultural: [
      `Joyas, Arte y Tradiciones de ${city}`,
      `Cultura Viva: De Plazas a Murales en ${city}`,
      `Ecos de Identidad y Patrimonio en ${city}`
    ],
    romantic: [
      `Rincones Románticos y Miradores de ${city}`,
      `Atesorando Recuerdos: Paseo para Dos en ${city}`,
      `Magia y Atardeceres en ${city}`
    ],
    sports: [
      `Ruta Activa y Pasión Deportiva en ${city}`,
      `Paso a Paso por la Energía Urbana de ${city}`
    ],
    urban: [
      `Contrastes, Calles y Pulso Urbano de ${city}`,
      `Explorando la Auténtica Esencia de ${city}`,
      `De Barrio en Barrio: El Ritmo de ${city}`
    ],
    custom: [
      `Inmersión Total: Lo Mejor de ${city}`,
      `Experiencia Inolvidable por ${city}`,
      `Tesoros Imperdibles en ${city}`
    ]
  }

  const list = creativeVariations[input.type] || creativeVariations.custom
  const seed = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (planner?.selectedPlaces?.length || 0)
  const index = Math.abs(seed) % list.length
  return list[index]
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
  }[input.type] ?? 'paradas auténticas, bien conectadas y culturalmente relevantes'

  const durationDays = input.durationDays || (input.durationHours >= 24 ? Math.ceil(input.durationHours / 24) : 0)
  const durationLabel = durationDays >= 2
    ? `A lo largo de ${durationDays} días de recorrido`
    : (input.durationHours ? `Durante una jornada completa de ${input.durationHours} horas` : 'A lo largo del recorrido')

  return `Este itinerario por ${city}${country} ha sido diseñado para ofrecer una experiencia integral y enriquecedora en el destino. ${durationLabel}, la ruta articula ${mode}, organizando el itinerario con coherencia geográfica para minimizar desplazamientos y maximizar el tiempo en cada parada. Entre los puntos más destacados de la ruta figuran ${places || input.destination}, seleccionados para brindar una perspectiva auténtica que combina historia, naturaleza, cultura y la vibrante vida local.`
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

function buildStopDescription(place, input = {}) {
  const seed = place.name || ''
  const inputObj = (typeof input === 'object' && input !== null) ? input : { type: input }

  let realDetail = ''
  if (place.history && place.history.trim().length > 15) {
    realDetail = place.history.trim()
  } else if (place.rawTags?.description && place.rawTags.description.trim().length > 15) {
    realDetail = place.rawTags.description.trim()
  } else {
    const rawCat = place.category || place.type || 'lugar'
    const dynamicDesc = generateDynamicDescription(place.name, rawCat, inputObj.city || inputObj.destination)
    if (dynamicDesc && dynamicDesc.trim().length > 25) {
      realDetail = dynamicDesc
    } else {
      realDetail = buildRecommendationReason(place, inputObj)
    }
  }

  if (realDetail && !/[.!?]$/.test(realDetail)) {
    realDetail += '.'
  }

  if (realDetail.length < 130) {
    const action = stopActionFor(inputObj.type, place.category, seed)
    const stopTips = buildTips(place, inputObj.type)
    const tipSentence = (stopTips && stopTips.length > 0) ? ` Se sugiere ${stopTips[0].toLowerCase()}.` : ''
    
    const variants = [
      `${realDetail} Excelente parada para ${action}.${tipSentence}`,
      `${realDetail} Punto destacado para ${action}.${tipSentence}`,
      `${realDetail} Espacio propicio para ${action}.${tipSentence}`,
      `${realDetail}${tipSentence}`
    ]
    return selectDeterministic(variants, seed)
  }

  return realDetail
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

export const CATEGORY_IMAGE_POOLS = {
  beach_island: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop',
  ],
  historic: [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
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
    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop',
  ],
  bakery_cafe: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop',
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-ce74f458149e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop',
  ],
  general: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?w=800&auto=format&fit=crop',
  ]
}

export function getReliableCategoryFallbackImage(name = '', category = '', assignedUrls = null) {
  const normCat = (category || '').toLowerCase()
  const normName = (name || '').toLowerCase()

  let poolKey = 'general'
  if (normName.includes('panader') || normName.includes('pan') || normName.includes('bakery') || normName.includes('pasteler') || normName.includes('reposter')) {
    poolKey = 'bakery_cafe'
  } else if (normCat.includes('restaurant') || normCat.includes('cafe') || normCat.includes('gastronomy') || normCat.includes('food') || normName.includes('restaurante') || normName.includes('mercado') || normName.includes('bar') || isFoodOrDrinkEstablishment(name)) {
    poolKey = 'gastronomy'
  } else if (normCat.includes('beach') || normCat.includes('island') || normCat.includes('playa') || normCat.includes('isla') || /\b(isla|islas|cayos?|playa|playas|bahia|bah[íi]a)\b/i.test(normName)) {
    poolKey = 'beach_island'
  } else if (normCat.includes('historic') || normCat.includes('museum') || normCat.includes('church') || normCat.includes('monument') || normName.includes('catedral') || normName.includes('museo') || normName.includes('castillo') || normName.includes('plaza')) {
    poolKey = 'historic'
  } else if (normCat.includes('nature') || normCat.includes('park') || normCat.includes('garden') || normName.includes('parque') || normName.includes('jardin') || normName.includes('bosque')) {
    poolKey = 'nature'
  } else if (normCat.includes('viewpoint') || normCat.includes('mirador') || normName.includes('mirador') || normName.includes('malecon')) {
    poolKey = 'viewpoint'
  }

  const pool = CATEGORY_IMAGE_POOLS[poolKey] || CATEGORY_IMAGE_POOLS.general
  const seed = (name + category).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  let selected = pool[seed % pool.length]
  if (assignedUrls && assignedUrls.has(selected)) {
    for (let offset = 1; offset < pool.length; offset++) {
      const candidate = pool[(seed + offset) % pool.length]
      if (!assignedUrls.has(candidate)) {
        selected = candidate
        break
      }
    }
  }
  return selected
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

  const isDining = normCat.includes('restaurant') || normCat.includes('cafe') || normCat.includes('food') || normName.includes('restaurante') || isFoodOrDrinkEstablishment(placeName)
  if (isDining) {
    return `${placeName} es un referente culinario reconocido para deleitarse con la auténtica gastronomía y sazón tradicional de ${city}.`
  }

  if (normCat.includes('island') || normCat.includes('beach') || /\b(isla|islas|cayos?|playa|playas|bahia|bah[íi]a)\b/i.test(normName)) {
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
  return true
}

function aiPlannerSkipReason(input, planner) {
  if (process.env.DISABLE_AI_PLANNER === 'true') return 'disabled_by_env'
  if (input.durationHours > 168) return 'long_tour_uses_deterministic_planner'
  if (planner.selectedPlaces.length > 30) return 'too_many_places_for_ai_planner'
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
  const allowedCandidateIds = new Set(
    (planner?.selectedPlaces || []).map(getCandidateId).filter(Boolean)
  )
  const enforceCandidateIds = allowedCandidateIds.size > 0

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
    const candidateId = readPlanCandidateId(stop)
    if (enforceCandidateIds && (!candidateId || !allowedCandidateIds.has(candidateId))) return false
    const name = stop.nombre || stop.name || ''
    if (!isValidSpecificPlace(name)) return false
    let key = candidateId ? `candidate:${candidateId}` : (normalizePlaceKey(name) || normalizeKey(name))
    key = key.replace(/\b(septiembre|september|9\s*11|11\s*s)\b/g, '911memorial')
    if (!key || seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })

  return tour
}

export function isGenericDescription(desc, name = '') {
  if (!desc || typeof desc !== 'string') return true
  const clean = desc.trim()
  if (clean.length < 25) return true
  if (name && clean.toLowerCase() === String(name).trim().toLowerCase()) return true
  const genericPatterns = [
    'un punto de gran interés recomendado',
    'gran valor patrimonial de',
    'identidad auténtica',
    'conectar a los viajeros con la historia viva',
    'Espacio emblemático de enriquecimiento cultural',
    'Punto de interés emblemático',
    'Destacado atractivo en',
    'Reconocido establecimiento culinario',
    'es un lugar emblemático de gran interés',
    'es un destacado establecimiento gastronómico',
    'es una parada emblemática de',
    'elegida para enriquecer tu recorrido',
    'autenticidad local',
    'funciona como parada de respaldo',
    'destaca por sus paisajes costeros',
    'tesoro arquitectónico y cultural imprescindible',
    'resguarda la memoria, el arte y el legado',
    'brinda un entorno natural y sombreado',
    'referente culinario reconocido para deleitarse',
    'panorámica excepcional de',
    'posee una notable relevancia histórica',
    'parada destacada para conocer',
    'sorprende por sus espejos de agua serenos',
    'es un hito conmemorativo y visual icónico',
    'ofrece un atractivo recorrido',
    'es un punto de notable interés',
    'conocer este lugar enriquece la visita'
  ]
  return genericPatterns.some(p => clean.toLowerCase().includes(p.toLowerCase()))
}

function generateDynamicDescription(name, category, city) {
  const cleanName = String(name || '').replace(/_/g, ' ').trim()
  const loc = city ? `en ${city}` : 'en la zona'
  const seed = Math.abs(cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(cleanName)) {
    const variants = [
      `${cleanName} es el imponente tajamar ${loc} donde convergen la fuerza del río Magdalena y el mar Caribe, ofreciendo un paisaje agreste único y vistas panorámicas del océano.`,
      `En ${cleanName}, los visitantes son testigos directos del choque de aguas del río más importante de Colombia al desembocar en el Caribe, con brisa marina constante y horizonte abierto.`,
      `${cleanName} ofrece una experiencia paisajística memorable ${loc}, ideal para sentir el viento oceánico, observar barcos de gran calado y apreciar la confluencia entre río y mar.`
    ]
    return variants[seed % variants.length]
  }
  if (/shakira|arroyo|pibe|escalona|botero|garc[ií]a\s+m[aá]rquez/i.test(cleanName)) {
    const variants = [
      `${cleanName} es un vibrante tributo artístico ${loc}, que rinde homenaje a una de las figuras más queridas y trascendentes de la cultura y la música colombiana a nivel mundial.`,
      `Ubicado en un entorno animado ${loc}, ${cleanName} celebra el talento, ritmo y legado de un ícono cultural imprescindible, atrayendo a admiradores y viajeros de todo el mundo.`,
      `${cleanName} destaca como uno de los puntos fotográficos y culturales más alegres ${loc}, inmortalizando el orgullo artístico regional en una escultura llena de dinamismo.`
    ]
    return variants[seed % variants.length]
  }
  if (/restaurante|comida|cafe|café|bistro|bar|parador|kiosko|asador|gourmet|gastronom/i.test(cleanName) || /food|restaurant|gastronom/i.test(category)) {
    const variants = [
      `${cleanName} es un referente culinario ${loc}, donde destacan recetas tradicionales, ingredientes frescos y una esmerada sazón local.`,
      `En ${cleanName}, los visitantes disfrutan de una experiencia gastronómica representativa ${loc}, con platos autóctonos y un ambiente acogedor.`,
      `${cleanName} deleita a locales y viajeros ${loc} con sabores característicos de la cocina regional y preparaciones preparadas al momento.`
    ]
    return variants[seed % variants.length]
  }
  if (/sendero|pueblito|trek|camino|hiking|bosque|reserva|chairama/i.test(cleanName) || /trail|nature|park/i.test(category)) {
    const variants = [
      `${cleanName} es una fascinante ruta de senderismo y patrimonio natural ${loc}, rodeada de vegetación nativa y miradores panorámicos.`,
      `Este sendero por ${cleanName} sumerge a los excursionistas en la biodiversidad ${loc}, con caminos sombreados y puntos de observación privilegiados.`,
      `${cleanName} ofrece una caminata enriquecedora ${loc}, ideal para apreciar el ecosistema, aves locales y formaciones naturales únicas.`
    ]
    return variants[seed % variants.length]
  }
  if (/playa|beach|bah[íi]a|bahia|cala|cabo|piscina|isla|arrecife|ensenada|costa/i.test(cleanName) || /beach|playa|coastal/i.test(category)) {
    const variants = [
      `${cleanName} es un atractivo frente costero ${loc}, conocido por su oleaje apacible, brisa marina y espacio para desconectarse frente al mar.`,
      `Las aguas templadas y la extensión de arena en ${cleanName} la convierten en un punto predilecto ${loc} para descansar y pasear por el litoral.`,
      `${cleanName} destaca en el litoral de ${city || 'la región'} por su ambiente marinero, opciones de descanso bajo sombra y vistas amplias del horizonte.`
    ]
    return variants[seed % variants.length]
  }
  if (/malec[óo]n|paseo|boulevard|rambla/i.test(cleanName)) {
    const variants = [
      `${cleanName} es uno de los paseos peatonales más dinámicos ${loc}, ideal para recorrer junto a la brisa y disfrutar de la vida social y comercial.`,
      `Caminar por ${cleanName} permite apreciar la confluencia entre el paisaje marítimo y la energía urbana de ${city || 'la ciudad'}.`,
      `${cleanName} ofrece un trayecto panorámico al aire libre ${loc}, frecuentado por viajeros para tomar fotografías y contemplar el atardecer.`
    ]
    return variants[seed % variants.length]
  }
  if (/ci[eé]naga|manglar|delta|r[íi]o|estuario|laguna|pantano/i.test(cleanName)) {
    const variants = [
      `${cleanName} es un valioso humedal y enclave ecológico ${loc}, hogar de avifauna acuática y bosques de manglar de gran importancia ambiental.`,
      `En ${cleanName} convergen corrientes acuáticas que sustentan una rica biodiversidad ${loc}, ofreciendo recorridos en canoa y avistamiento de fauna.`,
      `${cleanName} sorprende por sus espejos de agua serenos y canales rodeados de mangles ${loc}, brindando un contacto genuino con la naturaleza nativa.`
    ]
    return variants[seed % variants.length]
  }
  if (/monumento|estatua|escultura|hito|memorial|aleta|ventana/i.test(cleanName)) {
    const variants = [
      `${cleanName} es un hito escultórico y visual icónico ${loc}, creado para celebrar la identidad, cultura y legado de la comunidad.`,
      `La arquitectura y significado de ${cleanName} lo sitúan entre los puntos más fotografiados y emblemáticos de ${city || 'la zona'}.`,
      `${cleanName} rinde tributo a la historia y expresiones creativas ${loc}, convirtiéndose en un símbolo contemporáneo de encuentro e identidad.`
    ]
    return variants[seed % variants.length]
  }
  if (/museo|museum|galeria|gallery|exhibición/i.test(cleanName) || /museo|arte/i.test(category)) {
    const variants = [
      `${cleanName} resguarda valiosas colecciones históricas y artísticas ${loc}, ofreciendo un recorrido pedagógico por la memoria regional.`,
      `Visitar ${cleanName} permite comprender las raíces culturales, sucesos históricos y patrimonio patrimonial custodiado ${loc}.`,
      `${cleanName} exhibe piezas arqueológicas, artísticas o testimoniales que ilustran el desarrollo y costumbres de ${city || 'este territorio'}.`
    ]
    return variants[seed % variants.length]
  }
  if (/parque|plaza|plazoleta/i.test(cleanName)) {
    const variants = [
      `${cleanName} es el corazón cívico y de encuentro ${loc}, con sombra de árboles frondosos y una vibrante atmósfera comunitaria.`,
      `En ${cleanName}, los visitantes encuentran un punto de pausa agradable rodeado de arquitectura representativa y vida local cotidiana.`,
      `${cleanName} reúne historia y cotidianidad ${loc}, siendo el epicentro tradicional donde confluyen paseantes y tertulias locales.`
    ]
    return variants[seed % variants.length]
  }

  const genericVariants = [
    `${cleanName} ofrece un atractivo recorrido ${loc}, permitiendo apreciar de cerca la identidad, historia y carácter del destino.`,
    `${cleanName} es un punto de notable interés ${loc}, ideal para conocer vivencias auténticas y contrastes propios de la región.`,
    `Conocer ${cleanName} enriquece la visita ${loc}, ofreciendo una mirada representativa sobre las costumbres y entorno de la zona.`
  ]
  return genericVariants[seed % genericVariants.length]
}

function generateDynamicTips(name, category, city) {
  const cleanName = String(name || '').replace(/_/g, ' ').trim()
  const seed = cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(cleanName)) {
    return [
      `Llevar calzado cerrado y cómodo con buen agarre, protector solar e hidratación para caminar por ${cleanName}.`,
      `Aprovechar las horas de la mañana o el final de la tarde para disfrutar de la brisa marina y capturar las mejores fotos del encuentro entre río y mar.`
    ]
  }
  if (/shakira|arroyo|pibe|escalona|botero|aleta|ventana/i.test(cleanName)) {
    return [
      `Aprovechar la luz de la mañana o el atardecer para capturar las mejores fotos frente al monumento de ${cleanName}.`,
      `Combinar la visita con un agradable paseo por el malecón o la plazoleta peatonal para disfrutar del ambiente local.`
    ]
  }
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
  const isMonumentOrHeritage = /monumento|estatua|busto|obelisco|memorial|rotario|leones|iglesia|catedral|plaza|parque|escultura|hito/i.test(cleanName)
  if (!isMonumentOrHeritage && (/\b(bar|discoteca|nightclub|pub|rumba|salsa|cantina)\b/i.test(cleanName) || /nightlife|bar/i.test(category))) {
    return [
      `Llegar temprano para encontrar buena ubicación cerca de la pista o música en vivo en ${cleanName}.`,
      `Cuidar las pertenencias personales y coordinar el transporte de regreso con anticipación.`
    ]
  }
  if (isMonumentOrHeritage) {
    return [
      `Apreciar con calma los detalles artísticos, placas conmemorativas y simbolismos históricos en ${cleanName}.`,
      `Aprovechar la luz de la mañana o el atardecer para capturar las mejores fotografías del monumento.`
    ]
  }

  // Comida y Gastronomía variada
  if (/cafe|café|bistro|bakery|panader[íi]a/i.test(cleanName)) {
    return [
      `Acompañar la pausa con un café de origen y consultar por las especialidades de repostería artesanal en ${cleanName}.`,
      `Elegir un asiento cómodo para observar el ambiente local y recargar energías para el resto del tour.`
    ]
  }
  if (/mariscos|pescado|ceviche|costeñ/i.test(cleanName)) {
    return [
      `Preguntar por la pesca fresca del día o una cazuela marinera insignia en ${cleanName}.`,
      `Acompañar los sabores del mar con bebidas cítricas refrescantes como limonada de coco o jugo natural.`
    ]
  }
  if (/asador|parrilla|carnes|steak/i.test(cleanName)) {
    return [
      `Consultar el punto de cocción sugerido para los cortes emblemáticos de ${cleanName}.`,
      `Probar las guarniciones tradicionales como arepas asadas o papas criollas al vapor.`
    ]
  }
  if (/zool[óo]gico|zoologico|zoo|acuario|bioparque|fauna|bot[aá]nico/i.test(cleanName)) {
    return [
      `Recorrer los senderos de hábitats y aprender sobre los programas de conservación y bienestar animal en ${cleanName}.`,
      `Llevar calzado cómodo, hidratación y respetar las indicaciones de no alimentar a las especies.`
    ]
  }
  const isCulturalPOI = /\b(zool[óo]gico|zoologico|zoo|acuario|museo|catedral|iglesia|parque|carnaval|monumento|estatua|estadio|plaza|mirador|malec[óo]n|teatro|playa|sendero|biblioteca)\b/i.test(cleanName)
  if (!isCulturalPOI && (/restaurante|comida|parador|kiosko|gourmet|gastronom/i.test(cleanName) || /food|restaurant/i.test(category))) {
    const foodVariants = [
      [
        `Preguntar al anfitrión por el plato más representativo o la receta estrella de ${cleanName}.`,
        `Dejar espacio para probar los postres o dulces típicos elaborados en el lugar.`
      ],
      [
        `Llegar con apetito para compartir varias entradas antes de ordenar el plato fuerte en ${cleanName}.`,
        `Consultar las opciones de jugos de frutas exóticas de temporada disponibles.`
      ],
      [
        `Si visitas en grupo, ordenar preparaciones al centro de la mesa en ${cleanName} para degustar variedad.`,
        `Verificar si disponen de terraza o zona ventilada para una velada más placentera.`
      ]
    ]
    return foodVariants[Math.abs(seed) % foodVariants.length]
  }

  // Museos y Cultura variada
  if (/carnaval|folclor|comparsa/i.test(cleanName)) {
    return [
      `Apreciar la destreza artesanal de las máscaras de madera y los trajes de comparsa en ${cleanName}.`,
      `Disfrutar de las salas sonoras interactivas para identificar los ritmos de cumbia y tambora.`
    ]
  }
  if (/biblioteca|library|museo|museum|galeria/i.test(cleanName)) {
    const museumVariants = [
      [
        `Consultar en el ingreso si disponen de audioguías o mapa de salas para optimizar la visita en ${cleanName}.`,
        `Apreciar con calma las obras principales antes de recorrer las exposiciones temporales.`
      ],
      [
        `Dedicar tiempo a leer las reseñas de contexto histórico para entender el valor de cada pieza en ${cleanName}.`,
        `Tomar nota de los detalles arquitectónicos del edificio que acoge la exhibición.`
      ],
      [
        `Aprovechar las visitas guiadas por mediadores culturales en ${cleanName} para descubrir anécdotas ocultas.`,
        `Respetar las políticas sobre el uso de flash fotográfico dentro de las salas.`
      ]
    ]
    return museumVariants[Math.abs(seed) % museumVariants.length]
  }
  if (/puente|bridge|mirador|vessel|tower|observatorio/i.test(cleanName)) {
    return [
      `Aprovechar la hora dorada o el atardecer para capturar las mejores panorámicas desde ${cleanName}.`,
      `Llevar una prenda ligera si sube el viento en zonas altas.`
    ]
  }
  if (/estatua|libertad|statue|monumento|memorial|plaza|catedral|iglesia|fuerte|castillo/i.test(cleanName)) {
    return [
      `Apreciar los detalles artísticos y placas conmemorativas de ${cleanName}.`,
      `Iniciar el recorrido con buena luz natural para obtener óptimas fotografías.`
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
  const seed = Math.abs(cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

  if (/bocas?\s+de\s+ceniza|tajamar|desembocadura/i.test(cleanName)) {
    const bocasVariants = [
      [
        `Recorrer el tajamar y contemplar la desembocadura del río Magdalena en el mar Caribe`,
        `Observar el choque de corrientes, el oleaje y el paso de embarcaciones costeras`,
        `Tomar fotografías panorámicas del horizonte marítimo y la brisa en ${cleanName}`
      ],
      [
        `Caminar por el sendero del tajamar sintiendo la brisa oceánica y fluvial`,
        `Apreciar la biodiversidad marina, aves costeras y la faena de pescadores artesanales`,
        `Disfrutar de bebidas refrescantes y postales únicas del paisaje litoral`
      ]
    ]
    return bocasVariants[seed % bocasVariants.length]
  }
  if (/shakira|arroyo|pibe|escalona|botero/i.test(cleanName)) {
    return [
      `Fotografiarse junto a la emblemática escultura de ${cleanName}`,
      `Conocer la historia, trayectoria y homenaje cultural que representa este ícono`,
      `Disfrutar del paseo por el malecón y contemplar las vistas y la brisa del entorno`
    ]
  }
  if (/playa|beach|bah[íi]a|cala|cabo|ensenada/i.test(cleanName)) {
    const beachVariants = [
      [
        `Caminar por la orilla y relajarse frente al mar en ${cleanName}`,
        `Bañarse en las aguas templadas y contemplar el horizonte marino`,
        `Disfrutar de refrescos o preparaciones marinas en los quioscos locales`
      ],
      [
        `Apreciar la brisa y descansar en zona de sombra en ${cleanName}`,
        `Hacer un recorrido costero para capturar postales del paisaje litoral`,
        `Degustar bebidas tradicionales y contemplar el zarpe de pescadores`
      ],
      [
        `Nadar en aguas serenas y practicar actividades recreativas en ${cleanName}`,
        `Apreciar el atardecer y el juego de colores sobre el horizonte costero`,
        `Recorrer los senderos de acceso y puestos artesanales playeros`
      ]
    ]
    return beachVariants[seed % beachVariants.length]
  }
  if (/malec[óo]n|paseo|boulevard|rambla/i.test(cleanName)) {
    const promenadeVariants = [
      [
        `Recorrer a pie el trayecto peatonal de ${cleanName} disfrutando de la brisa`,
        `Apreciar las esculturas, fuentes y vistas abiertas hacia el agua`,
        `Detenerse en los puntos de encuentro y puestos gastronómicos tradicionales`
      ],
      [
        `Fotografiar la panorámica ribereña o marítima desde las barandas de ${cleanName}`,
        `Observar la dinámica cívica y actividades deportivas al aire libre`,
        `Disfrutar de un helado artesanal o merienda típica durante la caminata`
      ]
    ]
    return promenadeVariants[seed % promenadeVariants.length]
  }
  if (/ci[eé]naga|manglar|laguna|pantano/i.test(cleanName)) {
    const wetlandVariants = [
      [
        `Embarcar en un recorrido en canoa o lancha por los canales de ${cleanName}`,
        `Avistar aves acuáticas autóctonas y fauna propia del ecosistema de manglar`,
        `Aprender sobre el equilibrio ecológico y la pesca tradicional con guías locales`
      ],
      [
        `Recorrer los muelles de madera y senderos ecológicos de ${cleanName}`,
        `Observar la flora halófita y los espejos de agua en calma`,
        `Registrar fotografías de los túneles naturales formados por las raíces de mangle`
      ]
    ]
    return wetlandVariants[seed % wetlandVariants.length]
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

  // Actividades gastronómicas variadas
  if (/cafe|café|bistro|bakery/i.test(cleanName)) {
    return [
      `Saborear café artesanal de especialidad y preparaciones calientes en ${cleanName}`,
      `Elegir bocados de pastelería fresca o repostería local`,
      `Disfrutar de un momento de descanso y lectura en el acogedor salón`
    ]
  }
  if (/restaurante|comida|asador|parador|kiosko|gastrobar/i.test(cleanName)) {
    const foodActivityVariants = [
      [
        `Deleitarse con la sazón y recetas representativas de ${cleanName}`,
        `Acompañar la comida con refrescos naturales o bebidas tradicionales`,
        `Conectar con la hospitalidad del equipo y la cultura culinaria del sitio`
      ],
      [
        `Degustar las entradas de autor y platos fuertes insignia en ${cleanName}`,
        `Descubrir los secretos de preparación conversando con el personal`,
        `Apreciar el diseño ambiental y la propuesta gastronómica del establecimiento`
      ],
      [
        `Compartir una mesa festiva con variedad de platillos típicos en ${cleanName}`,
        `Probar los postres artesanales y digestivos tradicionales`,
        `Capturar recuerdos fotográficos del ambiente y la presentación de los platos`
      ]
    ]
    return foodActivityVariants[seed % foodActivityVariants.length]
  }

  // Actividades en museos y recintos culturales variados
  if (/carnaval|folclor/i.test(cleanName)) {
    return [
      `Descubrir la historia de las comparsas, disfraces e insignias en ${cleanName}`,
      `Escuchar los testimonios de los portadores de la tradición cultural`,
      `Tomar fotos junto a las carrozas y figuras monumentales de la fiesta`
    ]
  }
  if (/biblioteca|library|museo|museum|galeria/i.test(cleanName)) {
    const museumActivityVariants = [
      [
        `Recorrer las salas de exhibición permanente y colecciones de ${cleanName}`,
        `Aprender sobre los momentos y personajes históricos clave de la región`,
        `Apreciar la curaduría artística y elementos patrimoniales expuestos`
      ],
      [
        `Explorar la cronología y documentos visuales custodiados en ${cleanName}`,
        `Profundizar en la evolución social y artística a través de las obras`,
        `Descubrir detalles arquitectónicos del inmueble que alberga el acervo`
      ],
      [
        `Interpretar los mensajes y técnicas de los creadores en ${cleanName}`,
        `Participar de las proyecciones o estaciones interactivas del recinto`,
        `Visitar la sala de memoria para comprender el impacto cultural de la colección`
      ]
    ]
    return museumActivityVariants[seed % museumActivityVariants.length]
  }
  if (/puente|bridge/i.test(cleanName)) {
    return [
      `Cruzar el paso peatonal con vistas panorámicas de la ciudad`,
      `Apreciar la ingeniería y detalles arquitectónicos de ${cleanName}`,
      `Capturar fotografías del skyline y el entorno fluvial o marítimo`
    ]
  }
  if (/monumento|estatua|memorial|escultura|aleta|ventana/i.test(cleanName)) {
    const monumentVariants = [
      [
        `Apreciar la escala monumental y los detalles escultóricos de ${cleanName}`,
        `Conocer el homenaje y significado cívico que inspiró su construcción`,
        `Tomar fotografías desde distintos ángulos y apreciar su iluminación`
      ],
      [
        `Recorrer la rotonda o plazoleta que rodea ${cleanName}`,
        `Leer las inscripciones conmemorativas y detalles arquitectónicos`,
        `Apreciar los contrastes visuales entre el monumento y el entorno urbano`
      ]
    ]
    return monumentVariants[seed % monumentVariants.length]
  }
  if (/parque|park|plaza|garden/i.test(cleanName)) {
    const parkVariants = [
      [
        `Pasear con tranquilidad bajo las arboledas de ${cleanName}`,
        `Descansar en las áreas verdes y bancos integrados con la vida urbana`,
        `Observar las actividades culturales y cotidianas locales`
      ],
      [
        `Caminar por los senderos peatonales y glorietas de ${cleanName}`,
        `Apreciar las fuentes, esculturas y elementos arquitectónicos centrales`,
        `Disfrutar de un refrigerio o café al aire libre en los alrededores`
      ]
    ]
    return parkVariants[seed % parkVariants.length]
  }

  const genericVariants = [
    [
      `Conocer de cerca la historia y características de ${cleanName}`,
      `Recorrer los puntos de mayor interés visual y patrimonial`,
      `Apreciar la atmósfera y el dinamismo cotidiano del lugar`
    ],
    [
      `Pasear por los alrededores y disfrutar del entorno de ${cleanName}`,
      `Tomar fotos panorámicas y detalles representativos del sitio`,
      `Interactuar con la comunidad y conocer anécdotas de la zona`
    ]
  ]
  return genericVariants[seed % genericVariants.length]
}

async function isPlaceBelongingToCity(placeName, targetCity = '', lat = null, lon = null, targetCityCoords = null, options = {}) {
  const normPlace = String(placeName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normCity = String(targetCity || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // 1. Verificación por distancia radial desde el centro del destino. La
  // duración no amplía el alcance: un tour de varios días en una sola ciudad
  // sigue limitado a esa ciudad y sus municipios cercanos.
  const maxRadiusKm = Number.isFinite(Number(options.maxDistanceKm))
    ? Number(options.maxDistanceKm)
    : (options.isRegional ? 80 : 35)
  if (lat && lon && targetCityCoords?.latitude && targetCityCoords?.longitude) {
    const distKm = haversineMeters(targetCityCoords.latitude, targetCityCoords.longitude, lat, lon) / 1000
    if (distKm > maxRadiusKm) {
      console.warn(`[UniversalGeoBoundary] Rechazado "${placeName}" (${distKm.toFixed(1)} km) por exceder ${maxRadiusKm} km del centro de "${targetCity}"`)
      return false
    }
  }

  // 2. Mapeo preventivo para atracciones exclusivas de centros urbanos lejanos
  const CITY_EXCLUSIVE_LANDMARKS = {
    'cartagena': ['bocagrande', 'castillo san felipe', 'getsemani', 'islas del rosario', 'baru', 'la popa'],
    'barranquilla': ['malecon del rio', 'ventana al mundo', 'boca de ceniza', 'casa del carnaval', 'edgar renteria'],
    'santa marta': ['tayrona', 'rodadero', 'taganga', 'minca', 'quinta de san pedro', 'museo bolivariano'],
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

export async function normalizeStop(stop, index, input, anchorPlace = null, candidatePlaces = [], calculatedDay = null, options = {}) {
  const source = stop && typeof stop === 'object' ? stop : {}
  const ubicacion = source.ubicacion ?? source.locationInfo ?? {}
  const isCoastalStop = isCoastalIslandsTour(input)
  const candidateIndex = (index < candidatePlaces.length) ? index : (candidatePlaces.length > 0 ? (index % candidatePlaces.length) : 0)
  const positionalFallback = candidatePlaces[candidateIndex] ?? anchorPlace ?? candidatePlaces[0] ?? null

  let rawName = [source.nombre, source.name, ubicacion.nombre_lugar]
      .map((value) => value == null ? "" : value.toString().trim())
      .find((value) => value.length > 0) ?? ''

  const sourceCandidateId = readPlanCandidateId(source)
  const idMatchedPlace = sourceCandidateId
    ? candidatePlaces.find(candidate => getCandidateId(candidate) === sourceCandidateId)
    : null
  if (sourceCandidateId && !idMatchedPlace) {
    const error = new Error(`La parada referencia un candidateId desconocido: "${sourceCandidateId}".`)
    error.code = 'UNKNOWN_CANDIDATE_ID'
    error.candidateId = sourceCandidateId
    throw error
  }

  const normalizedRawName = normalizePlaceKey(rawName)
  const exactNameMatchedPlace = normalizedRawName
    ? candidatePlaces.find(candidate => normalizePlaceKey(candidate?.name || '') === normalizedRawName)
    : null
  const candidateFallback = isCoastalStop
    ? (idMatchedPlace || exactNameMatchedPlace)
    : positionalFallback
  const isGenericPlaceholder = !rawName || /parada \d+/i.test(rawName) || /^(parada|lugar|punto|sitio|stop)\s*\d+$/i.test(rawName)
  const sourceName = isGenericPlaceholder ? (candidateFallback?.name ?? (isCoastalStop ? '' : `${input.destination} ${index + 1}`)) : rawName
  const matchedPlace = isCoastalStop
    ? (idMatchedPlace || exactNameMatchedPlace)
    : (idMatchedPlace || findCandidatePlace(sourceName, candidatePlaces))

  if (isCoastalStop && (!matchedPlace || !isCoastalMappedTouristStop(matchedPlace))) {
    const error = new Error(`La parada "${sourceName || rawName || 'sin nombre'}" no coincide con un lugar costero confirmado en el mapa.`)
    error.code = 'UNMAPPED_COASTAL_STOP'
    error.placeName = sourceName || rawName
    throw error
  }

  const startPlace = candidatePlaces[0] ?? null
  const endPlace = candidatePlaces[candidatePlaces.length - 1] ?? null
  let coordinates = isCoastalStop
    ? {
        latitude: Number(matchedPlace.latitude),
        longitude: Number(matchedPlace.longitude),
        address: matchedPlace.address || '',
        placeId: matchedPlace.placeId || matchedPlace.place_id || matchedPlace.id || '',
        coordinatesVerified: true,
        coordinateSource: matchedPlace.coordinateSource || matchedPlace.coordinate_source || matchedPlace.source || ''
      }
    : await resolveStopCoordinates({
        source,
        input,
        name: sourceName,
        matchedPlace,
        fallbackPlace: candidateFallback,
        startPlace,
        endPlace,
      })
  if (!coordinates || coordinates.unresolved || !hasUsableCoordinates(coordinates.latitude, coordinates.longitude)) {
    if (candidateFallback && hasUsableCoordinates(candidateFallback.latitude, candidateFallback.longitude)) {
      coordinates = {
        latitude: Number(candidateFallback.latitude),
        longitude: Number(candidateFallback.longitude),
        placeId: getCandidateId(candidateFallback) || candidateFallback.placeId || candidateFallback.id || '',
        place_id: getCandidateId(candidateFallback) || candidateFallback.placeId || candidateFallback.id || '',
        coordinatesVerified: true,
        coordinateSource: 'candidate-fallback'
      }
    } else {
      const error = new Error(`No pudimos confirmar la ubicación real de "${sourceName}" en ${input.city || input.destination}.`)
      error.code = 'UNVERIFIED_STOP_LOCATION'
      error.placeName = sourceName
      throw error
    }
  }
  let resolvedName = cleanPlacePhysicalName(sourceName || matchedPlace?.name || candidateFallback?.name || `${input.destination}`)
  const cityCenterCoords = (input.canonicalDestination?.latitude && input.canonicalDestination?.longitude)
    ? input.canonicalDestination
    : (input.latitude && input.longitude ? { latitude: input.latitude, longitude: input.longitude } : candidatePlaces[0])
  const geoScope = geographicScopeFor(input)
  const isRegionalOrNature = geoScope.isRegional
  const isValidCityPlace = await isPlaceBelongingToCity(
    resolvedName,
    input.city || input.destination,
    coordinates.latitude,
    coordinates.longitude,
    cityCenterCoords,
    {
      isRegional: isRegionalOrNature,
      maxDistanceKm: geoScope.maxDistanceKm,
      durationDays: input.durationDays,
    }
  )
  const isCandidateSelectedByUser = candidatePlaces.some(p => arePlacesSimilar(p?.name || '', sourceName) || arePlacesSimilar(p?.name || '', resolvedName) || (p?.name && resolvedName && ((p.name.toLowerCase().includes(resolvedName.toLowerCase())) || resolvedName.toLowerCase().includes(p.name.toLowerCase()))))
  if (/parada \d+/i.test(resolvedName) || /^(parada|lugar|punto|sitio|stop)\s*\d+$/i.test(resolvedName) || (!isValidCityPlace && !isCandidateSelectedByUser)) {
    const fallbackIsValid = candidateFallback &&
      (isVerifiedCoordinatePlace(candidateFallback) || candidateFallback.coordinatesVerified || candidateFallback.id || candidateFallback.placeId || candidateFallback.place_id) &&
      hasUsableCoordinates(candidateFallback.latitude, candidateFallback.longitude) &&
      validateCandidateLocation(candidateFallback, cityCenterCoords, geoScope.maxDistanceKm)
    if (!fallbackIsValid && !isCandidateSelectedByUser) {
      const error = new Error(`No pudimos confirmar la ubicación real de "${sourceName}" dentro del alcance del tour.`)
      error.code = 'OUT_OF_SCOPE_STOP_LOCATION'
      error.placeName = sourceName
      throw error
    }
    coordinates = {
      latitude: Number(candidateFallback.latitude),
      longitude: Number(candidateFallback.longitude),
      address: candidateFallback.address || '',
      placeId: candidateFallback.placeId || candidateFallback.place_id || '',
      coordinateSource: candidateFallback.coordinateSource || candidateFallback.coordinate_source || '',
      coordinatesVerified: true,
    }
    resolvedName = cleanPlacePhysicalName(candidateFallback.name || `${input.destination}`)
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

  const isGenericDesc = isGenericDescription(description, resolvedName)
  let wikipediaUrl = ''
  let descriptionSource = description && !isGenericDesc ? 'ai' : 'generated_fallback'
  let coastalWikiPromise = null

  if (isCoastalStop) {
    coastalWikiPromise = coastalWikipediaSummary(
      resolvedName,
      input.city || input.destination,
      input.country
    ).catch(() => null)
    if (isGenericDesc) {
      const rawCat = matchedPlace?.category || candidateFallback?.category || source.categoria || source.category || source.type || 'lugar'
      description = generateDynamicDescription(resolvedName, rawCat, input.city || input.destination)
      descriptionSource = 'wikipedia_not_found'
    }
  } else if (isGenericDesc) {
    if (richObj?.descripcion && !isGenericDescription(richObj.descripcion, resolvedName)) {
      description = richObj.descripcion
    } else {
      const wikiText = await wikipediaSummaryText(resolvedName, input.city || input.destination, input.country).catch(() => null)
      if (wikiText && wikiText.length > 30) {
        description = wikiText
      } else {
        const rawCat = matchedPlace?.category || candidateFallback?.category || source.categoria || source.category || source.type || 'lugar'
        description = generateDynamicDescription(resolvedName, rawCat, input.city || input.destination)
      }
    }
  }
  
  const realisticMinutes = Number(richObj?.suggestedMinutes) || estimateRealisticStopDurationMinutes({ name: resolvedName, category: matchedPlace?.category || candidateFallback?.category || source.categoria || source.category, tags: source.tags || matchedPlace?.tags }, index)
  let durationText = richObj?.duracion_estimada ?? ((source.duracion_estimada && !/^(25|45)\s*minutos$/i.test(String(source.duracion_estimada).trim())) ? source.duracion_estimada : `${realisticMinutes} minutos`)
  let minutes = minutesFromLabel(durationText)
  const isMuseumOrGallery = /museo|palacio|galer[ií]a|fuerte|castillo|inquisici[oó]n|naval/i.test(resolvedName)
  if (isMuseumOrGallery && minutes < 45) {
    minutes = 45
    durationText = "45 minutos"
  } else if (minutes < 20) {
    const fallbackMins = Math.max(25, matchedPlace?.minutes ?? candidateFallback?.minutes ?? source.suggestedMinutes ?? 25)
    durationText = `${fallbackMins} minutos`
  }

  const images = normalizeList(source.imagenes ?? source.images, [])
  const cityFallback = input.city ? `${input.city}, ${input.country || ''}`.trim().replace(/,\s*$/, '') : input.destination
  
  const rawCategory = source.categoria || source.category || source.type || matchedPlace?.category || candidateFallback?.category || ''
  const placeCategory = normalizeCategory({
    category: rawCategory,
    name: resolvedName,
    tags: source.etiquetas || source.tags || []
  })
  
  const isVerifiedPhoto = (url) => typeof url === 'string' && (url.includes('wikimedia.org') || url.includes('wikipedia.org'))
  const verifiedImageFromList = images.find(isVerifiedPhoto) || ''
  const isSourceFallback = Boolean(source.isFallbackImage || source.isDemoImage || source.isReferenceImage)
  const existingImageUrl = !isCoastalStop && (!isSourceFallback && source.imageUrl && !source.imageUrl.includes('photo-1469854523086-cc02fe5d8800'))
    ? source.imageUrl
    : (!isCoastalStop ? (verifiedImageFromList || source.imageUrl || matchedPlace?.imageUrl || candidateFallback?.imageUrl || coordinates?.imageUrl || '') : '')
  let image = ''
  let isFallbackImg = false

  // Si ya tenemos una URL válida de imagen verificada o de la fase previa, reutilizarla directamente sin consultar APIs externas
  if (existingImageUrl && !existingImageUrl.includes('photo-1469854523086-cc02fe5d8800') && (!options?.assignedUrls || !options.assignedUrls.has(existingImageUrl))) {
    image = existingImageUrl
    isFallbackImg = isSourceFallback && !isVerifiedPhoto(existingImageUrl)
    options?.assignedUrls?.add(image)
  } else {
    const imageStatus = await Promise.race([
      imageForPlaceWithStatus(resolvedName, cityFallback, placeCategory, index, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        country: input.country,
        assignedUrls: options?.assignedUrls
      }),
      new Promise(resolve => setTimeout(() => resolve({ url: "", isFallback: true }), 4500))
    ]).catch(() => ({ url: "", isFallback: true }))
    image = imageStatus.url || existingImageUrl
    isFallbackImg = imageStatus.isFallback
    if (!image && isCoastalStop) {
      image = getReliableCategoryFallbackImage(resolvedName, placeCategory, options?.assignedUrls)
      isFallbackImg = true
    }
    if (image) options?.assignedUrls?.add(image)
  }

  // Look up Wikipedia while the image provider is working, keeping the
  // additional coastal enrichment inside one parallel latency window.
  if (isCoastalStop) {
    const wikiPage = await coastalWikiPromise
    if (wikiPage?.text) {
      description = wikiPage.text
      wikipediaUrl = wikiPage.url || ''
      descriptionSource = 'wikipedia'
    } else if (!isGenericDesc && description) {
      descriptionSource = 'wikipedia_not_found_ai_fallback'
    }
  }

  // Normalizar lista de actividades priorizando las generadas específicamente para este lugar por la IA
  let rawActivities = normalizeList(richObj?.actividades ?? source.actividades ?? source.activities, [])
  if (!isCoastalStop && rawName && rawName.toLowerCase() !== resolvedName.toLowerCase() && rawName.length > 5) {
    const activityPhrase = rawName.trim()
    if (!rawActivities.includes(activityPhrase)) {
      rawActivities = [activityPhrase, ...rawActivities]
    }
  }
  const genericActivityKeywords = [
    'explorar el lugar con calma',
    'tomar fotografias',
    'tomar fotografías',
    'leer senales o placas del entorno',
    'leer señales o placas del entorno',
    'preparar la siguiente parada'
  ]
  const isGenericActivities = rawActivities.length === 0 || 
                              (rawActivities.length <= 2 && rawActivities.every(a => a.toLowerCase() === 'explorar' || a.toLowerCase() === 'fotografiar')) ||
                              (rawActivities.length <= 4 && rawActivities.every(a => genericActivityKeywords.some(g => a.toLowerCase().includes(g))));
  if (isGenericActivities) {
    rawActivities = generateDynamicActivities(resolvedName, rawCategory)
  }

  // Normalizar lista de consejos evitando el aviso genérico de horarios
  let rawTips = normalizeList(richObj?.consejos ?? source.consejos ?? source.tips, [])
  const genericTipKeywords = [
    'revisar los horarios de apertura del lugar',
    'llegar con anticipación para disfrutar sin prisas',
    'llevar suficiente batería en el móvil para fotos y navegación',
    'confirma horarios',
    'horarios locales'
  ]
  const isGenericTips = rawTips.length === 0 || 
                        rawTips.every(t => genericTipKeywords.some(g => t.toLowerCase().includes(g)));
  if (isGenericTips) {
    rawTips = generateDynamicTips(resolvedName, rawCategory)
  }

  const rawFacts = normalizeList(richObj?.datos_curiosos ?? source.datos_curiosos, [])
  const datos_curiosos = rawFacts.length > 0
    ? rawFacts
    : [`${resolvedName} posee una notable relevancia histórica, arquitectónica y cultural en ${input.city || input.destination}.`]

  const sourceDay = Number(source.dia ?? source.day ?? matchedPlace?.dia ?? matchedPlace?.day ?? candidateFallback?.dia ?? candidateFallback?.day ?? anchorPlace?.dia ?? anchorPlace?.day ?? 0)
  const stopDay = (sourceDay > 0) ? sourceDay : (calculatedDay !== null ? calculatedDay : 1)

  const publicStop = {
    parada: index + 1,
    dia: stopDay,
    candidateId: getCandidateId(matchedPlace) || sourceCandidateId || getCandidateId(candidateFallback),
    nombre: resolvedName,
    isFallbackImage: isFallbackImg,
    isDemoImage: isFallbackImg,
    isReferenceImage: isFallbackImg,
    descripcion: description,
    descripcion_fuente: descriptionSource,
    wikipedia_url: wikipediaUrl,
    duracion_estimada: durationText,
    actividades: rawActivities,
    datos_curiosos,
    consejos: rawTips,
    ubicacion: {
      nombre_lugar: resolvedName,
      direccion: coordinates.address ?? matchedPlace?.address ?? ubicacion.direccion ?? source.address ?? "",
      ciudad: matchedPlace?.city ?? ubicacion.ciudad ?? input.city ?? "",
      region: matchedPlace?.region ?? ubicacion.region ?? "",
      pais: matchedPlace?.country ?? ubicacion.pais ?? input.country ?? "",
      latitud: coordinates.latitude,
      longitud: coordinates.longitude,
      candidateId: getCandidateId(matchedPlace) || sourceCandidateId || getCandidateId(candidateFallback),
      place_id: coordinates.placeId ?? coordinates.place_id ?? getCandidateId(matchedPlace) ?? matchedPlace?.placeId ?? matchedPlace?.place_id ?? ubicacion.place_id ?? placeIdFor(resolvedName, coordinates.latitude, coordinates.longitude),
      fuente_coordenadas: coordinates.coordinateSource || coordinates.coordinate_source || matchedPlace?.coordinateSource || matchedPlace?.coordinate_source || '',
      coordenadas_verificadas: coordinates.coordinatesVerified === true,
      url_mapa: matchedPlace?.urlMapa ?? ubicacion.url_mapa ?? mapUrlFor(coordinates.latitude, coordinates.longitude),
    },
    imagenes: deduplicateImageUrls([
      ...(isVerifiedPhoto(image) ? [image] : []),
      ...(isCoastalStop ? [] : images),
      ...(image && !isVerifiedPhoto(image) ? [image] : [])
    ]),
  }
  const primaryStopImage = publicStop.imagenes[0] || image || ''
  const isVerifiedPrimary = isVerifiedPhoto(primaryStopImage)
  const routeStop = {
    name: resolvedName,
    candidateId: getCandidateId(matchedPlace) || sourceCandidateId || getCandidateId(candidateFallback),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    coordinateSource: coordinates.coordinateSource || coordinates.coordinate_source || '',
    coordinatesVerified: coordinates.coordinatesVerified === true,
    imageUrl: primaryStopImage,
    isFallbackImage: isFallbackImg && !isVerifiedPrimary,
    isDemoImage: isFallbackImg && !isVerifiedPrimary,
    isReferenceImage: isFallbackImg && !isVerifiedPrimary,
    description: publicStop.descripcion,
    activities: publicStop.actividades,
    tips: publicStop.consejos,
    suggestedMinutes: minutesFromLabel(publicStop.duracion_estimada),
  }
  return { publicStop, routeStop }
}

export async function resolveStopCoordinates({ source, input, name, matchedPlace = null, fallbackPlace = null, startPlace = null, endPlace = null }) {
  const sourceLocation = source.locationInfo ?? source.ubicacion ?? {}
  const sourceLatitude = numberValue(source.latitude ?? sourceLocation.latitud ?? sourceLocation.latitude, NaN)
  const sourceLongitude = numberValue(source.longitude ?? sourceLocation.longitud ?? sourceLocation.longitude, NaN)

  const isCorridor = Boolean(input.originPlace && input.destinationPlace && startPlace && endPlace)
  let canonicalDest = input.canonicalDestination
  if (!canonicalDest && hasUsableCoordinates(input.latitude, input.longitude)) {
    canonicalDest = {
      latitude: input.latitude,
      longitude: input.longitude,
      displayName: input.city || input.destination,
      city: input.city,
      country: input.country
    }
  }
  const cleanCity = cleanAdministrativeCityName(input.city || input.destination || '')
  if (!canonicalDest && cleanCity) {
    canonicalDest = await resolveCanonicalDestination(cleanCity).catch(() => null)
    if (canonicalDest) {
      input.canonicalDestination = canonicalDest
      if (!input.latitude) input.latitude = canonicalDest.latitude
      if (!input.longitude) input.longitude = canonicalDest.longitude
    }
  }
  const destLat = canonicalDest?.latitude ?? input.latitude ?? null
  const destLon = canonicalDest?.longitude ?? input.longitude ?? null

  const geoScope = geographicScopeFor(input)
  const isRegionalOrNature = geoScope.isRegional
  const isMicroDest = Boolean(canonicalDest?.isMicroDestination)
  const geocodeOpts = {
    isRegionalOrNature,
    isMicroDest,
    durationDays: input.durationDays,
    maxDistanceKm: geoScope.maxDistanceKm,
    city: cleanCity,
    destination: input.destination,
    // Prefer a verified canonical identity when one exists, then fall back
    // to Mapbox/Geoapify/OSM discovery for places unknown to the catalog.
    preferCanonical: true
  }

  // 1. A candidate from the confirmed places list is safe to reuse when it has usable coordinates and not marked as AI-geocoded.
  const hasMatchedUsableCoords = hasUsableCoordinates(matchedPlace?.latitude, matchedPlace?.longitude)
  const isAiGeocoded = matchedPlace?.tags?.ai_geocoded === 'true' || matchedPlace?.tags?.ai_geocoded === true || matchedPlace?.coordinateSource === 'ai'
  const hasProvenance = Boolean(isVerifiedCoordinatePlace(matchedPlace) || matchedPlace?.id || matchedPlace?.placeId || matchedPlace?.place_id || matchedPlace?.coordinatesVerified)
  if (matchedPlace && hasMatchedUsableCoords && !isAiGeocoded && hasProvenance) {
    const isNearby = !canonicalDest || validateCandidateLocation(matchedPlace, canonicalDest, geoScope.maxDistanceKm)
    if (isNearby && (!isCorridor || isWithinCorridor(matchedPlace, startPlace, endPlace))) {
      return {
        latitude: Number(matchedPlace.latitude),
        longitude: Number(matchedPlace.longitude),
        place_id: getCandidateId(matchedPlace) || matchedPlace.placeId || matchedPlace.place_id || matchedPlace.id || '',
        placeId: getCandidateId(matchedPlace) || matchedPlace.placeId || matchedPlace.place_id || matchedPlace.id || '',
        coordinateSource: matchedPlace.coordinateSource || matchedPlace.coordinate_source || 'osm',
        coordinatesVerified: true
      }
    }
  }

  // 2. Reuse coordinates received from the client only if the backend marked
  // them as provider-backed (or they carry a trusted provider source).
  const sourceCoordinatePlace = {
    ...source,
    ...sourceLocation,
    latitude: sourceLatitude,
    longitude: sourceLongitude,
    placeId: source.placeId || source.place_id || sourceLocation.placeId || sourceLocation.place_id,
    place_id: source.place_id || source.placeId || sourceLocation.place_id || sourceLocation.placeId,
    coordinateSource: source.coordinateSource || source.coordinate_source || sourceLocation.fuente_coordenadas,
    coordinatesVerified: source.coordinatesVerified ?? source.coordinates_verified ?? sourceLocation.coordenadas_verificadas
  }
  const isExplicitlyVerifiedSource = isVerifiedCoordinatePlace(sourceCoordinatePlace)
  if (isExplicitlyVerifiedSource && hasUsableCoordinates(sourceLatitude, sourceLongitude)) {
    const candidateCoord = {
      latitude: sourceLatitude,
      longitude: sourceLongitude,
      name,
      place_id: sourceCoordinatePlace.place_id || '',
      placeId: sourceCoordinatePlace.placeId || sourceCoordinatePlace.place_id || '',
      coordinateSource: sourceCoordinatePlace.coordinateSource || sourceCoordinatePlace.coordinate_source || '',
      coordinatesVerified: true
    }
    const isNearby = !canonicalDest || validateCandidateLocation(candidateCoord, canonicalDest, geoScope.maxDistanceKm)
    if (isNearby && (!isCorridor || isWithinCorridor(candidateCoord, startPlace, endPlace))) {
      return candidateCoord
    }
  }

  // 3. GEOCODIFICACIÓN EN CASCADA (Supabase Cache -> OSM/Photon -> Mapbox -> Geoapify -> AI Physical Address)
  const cleanName = cleanPlacePhysicalName(name) || name
  const sourceAddress = sourceLocation.direccion || sourceLocation.address || source.direccion || source.address || ''

  let geocoded = await resolvePlaceWithCascade({
    name: cleanName,
    city: cleanCity,
    country: input.country || 'Colombia',
    address: sourceAddress,
    cityLat: destLat,
    cityLon: destLon,
    maxDistanceKm: geoScope.maxDistanceKm,
    options: geocodeOpts
  }).catch(() => null)

  if (!geocoded) {
    const searchQuery = `${cleanName}, ${cleanCity}, ${input.country || ''}`.trim().replace(/,\s*$/, '')
    geocoded = await geocodePlace(searchQuery, destLat, destLon, geocodeOpts).catch(() => null)
    if (!geocoded && cleanCity && !cleanName.toLowerCase().includes(cleanCity.toLowerCase())) {
      geocoded = await geocodePlace(`${cleanName}, ${cleanCity}`, destLat, destLon, geocodeOpts).catch(() => null)
    }
    if (!geocoded && destLat && destLon) {
      geocoded = await geocodePlace(cleanName, destLat, destLon, geocodeOpts).catch(() => null)
    }
  }

  if (geocoded && hasUsableCoordinates(geocoded.latitude, geocoded.longitude)) {
    const isNearby = !canonicalDest || validateCandidateLocation(geocoded, canonicalDest, geoScope.maxDistanceKm)
    if (isNearby && (!isCorridor || isWithinCorridor(geocoded, startPlace, endPlace))) {
      return {
        latitude: Number(geocoded.latitude),
        longitude: Number(geocoded.longitude),
        place_id: geocoded.placeId || geocoded.place_id || '',
        placeId: geocoded.placeId || geocoded.place_id || '',
        coordinateSource: geocoded.coordinateSource || geocoded.coordinate_source || '',
        coordinatesVerified: true,
        address: geocoded.address || geocoded.name || sourceAddress || ''
      }
    }
  }

  // 4. Si el geocodificador no lo encontró pero fallbackPlace coincide con el nombre de la parada
  if (fallbackPlace && isVerifiedCoordinatePlace(fallbackPlace) && hasUsableCoordinates(fallbackPlace.latitude, fallbackPlace.longitude)) {
    const isNameMatch = arePlacesSimilar(fallbackPlace.name, name) ||
      normalizePlaceKey(fallbackPlace.name) === normalizePlaceKey(name)
    if (isNameMatch) {
      const isNearby = !canonicalDest || validateCandidateLocation(fallbackPlace, canonicalDest, geoScope.maxDistanceKm)
      if (isNearby && (!isCorridor || isWithinCorridor(fallbackPlace, startPlace, endPlace))) {
        return {
          latitude: Number(fallbackPlace.latitude),
          longitude: Number(fallbackPlace.longitude),
          place_id: fallbackPlace.placeId || fallbackPlace.place_id || '',
          placeId: fallbackPlace.placeId || fallbackPlace.place_id || '',
          coordinateSource: fallbackPlace.coordinateSource || fallbackPlace.coordinate_source || '',
          coordinatesVerified: true,
          wasFallback: false
        }
      }
    }
  }

  // 5. Centro oficial verificado de la ciudad destino
  let cityCenterLat = canonicalDest?.latitude || input.latitude
  let cityCenterLon = canonicalDest?.longitude || input.longitude
  if (!hasUsableCoordinates(cityCenterLat, cityCenterLon) && cleanCity) {
    const cGeo = await geocodePlace(cleanCity).catch(() => null)
    if (cGeo && hasUsableCoordinates(cGeo.latitude, cGeo.longitude)) {
      cityCenterLat = cGeo.latitude
      cityCenterLon = cGeo.longitude
    }
  }
  if (!hasUsableCoordinates(cityCenterLat, cityCenterLon)) {
    cityCenterLat = 0
    cityCenterLon = 0
  }

  return {
    latitude: 0,
    longitude: 0,
    wasFallback: true,
    unresolved: true,
    coordinateSource: 'unresolved',
    coordinatesVerified: false
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
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().replace(/^[\s\[\]"\'`]+/, '').replace(/[\s\[\]"\'`]+$/, '')).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim()
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim().replace(/^[\s\[\]"\'`]+/, '').replace(/[\s\[\]"\'`]+$/, '')).filter(Boolean)
        }
      } catch (_) {}
    }
    return trimmed
      .split(',')
      .map((item) => item.trim().replace(/^[\s\[\]"\'`]+/, '').replace(/[\s\[\]"\'`]+$/, ''))
      .filter(Boolean)
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

export function deduplicateImageUrls(values = []) {
  if (!Array.isArray(values)) return []
  const seen = new Set()
  const result = []

  for (const item of values) {
    if (!item || typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) continue

    let key = trimmed
    try {
      const url = new URL(trimmed)
      if (url.hostname.includes('unsplash.com')) {
        const parts = url.pathname.split('/')
        key = `unsplash_${parts[parts.length - 1]}`
      } else if (url.hostname.includes('wikimedia.org')) {
        const parts = url.pathname.split('/')
        const filename = parts.find(p => /\.(jpe?g|png|webp|svg)$/i.test(p)) || parts[parts.length - 1]
        key = `wiki_${filename.toLowerCase()}`
      } else {
        key = `${url.hostname}${url.pathname}`.toLowerCase().replace(/\/$/, '')
      }
    } catch {
      key = trimmed.split('?')[0].split('#')[0].toLowerCase()
    }

    if (!seen.has(key)) {
      seen.add(key)
      result.push(trimmed)
    }
  }

  return result
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
  const seen = new Set(); const kept = []
  return values.filter((value) => {
    if (!value || !value.name) return false
    const rawType = (value.type || value.category || '').toLowerCase()
    const isFood = rawType.includes('food') || rawType.includes('restaurant') || /restaurante|cafe|bistro|bar|comida/i.test(value.name)
    const typePrefix = isFood ? 'food' : 'attraction'
    const key = `${typePrefix}_${canonicalPlaceKey(value.name, value.city || '')}`
    const fuzzyKey = `${typePrefix}_${fuzzyNormalizeKey(value.name)}`
    if (seen.has(key) || (fuzzyKey.length > 5 && seen.has(fuzzyKey)) || kept.some(k => arePlaceNamesSemanticallySame(k.name, value.name, value.city || k.city || ''))) return false
    seen.add(key); kept.push(value)
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

export { isWithinCorridor }

export function sortPlacesByProximity(places, origin = null) {
  if (!Array.isArray(places) || places.length <= 1) return places
  if (places.length <= 2 && (!origin || !origin.latitude || !origin.longitude)) return places
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

  const mapped = places.map((place) => {
    const proj = computeCorridorProjection(place, startLoc, endLoc)
    const t = proj ? proj.t : 0
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

    const cityCountry = (input.isMultiCountry || input.is_multi_country) ? '' : (input.country || '')
    const cityGeo = await geocodePlace(`${cityName} ${cityCountry}`.trim())
    if (cityGeo) cityGeos.push({ city: cityName, geo: cityGeo })

    let overpass = []
    let photon = []
    if (cityGeo) {
      overpass = await overpassAttractions(cityGeo.latitude, cityGeo.longitude, 12000)
      photon = await photonSearch(`${cityName} ${cityCountry}`.trim(), 15)
    }
    
    let wikiLandmarks = []
    let tomtomLandmarks = []
    if (cityGeo) {
      const [wRes, tRes] = await Promise.all([
        discoverDynamicCityLandmarks(cityName, (input.isMultiCountry ? '' : input.country) || '', cityGeo.latitude, cityGeo.longitude).catch(() => []),
        searchTomTomPlaces({ category: 'museum', lat: cityGeo.latitude, lon: cityGeo.longitude, limit: 6 }).catch(() => [])
      ])
      wikiLandmarks = wRes || []
      tomtomLandmarks = tRes || []
    }

    const geocodedWiki = await Promise.all(
      wikiLandmarks.map(async (item) => {
        let pLat = Number(item.latitude)
        let pLon = Number(item.longitude)
        let pSource = item.source || 'wikipedia-discovery'
        if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
          const geo = await geocodePlace(`${item.name}, ${cityName}`).catch(() => null)
          if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
            pLat = Number(geo.latitude)
            pLon = Number(geo.longitude)
            pSource = geo.coordinateSource || 'osm'
          }
        }
        if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
          return {
            name: item.name,
            latitude: pLat,
            longitude: pLon,
            type: 'tourism',
            category: item.category || 'historic',
            city: cityName,
            country: input.country || '',
            address: item.address || `${item.name}, ${cityName}`,
            description: item.description || '',
            coordinateSource: pSource,
            coordinatesVerified: true,
            fromWikipediaDiscovery: true,
            placeId: item.placeId || ''
          }
        }
        return null
      })
    ).then(res => res.filter(Boolean))

    const cleanTomTom = (tomtomLandmarks || [])
      .filter(p => !isNonTouristFacility({ name: p.name }))
      .map(p => ({ ...p, city: cityName }))

    let pool = [...geocodedIconics, ...geocodedWiki, ...cleanTomTom, ...overpass, ...photon]
    let valid = uniqueByName(pool)
      .filter((place) => place && place.name)
      .filter((place) => !isNonTouristFacility({ name: place.name }))
      .filter((place) => isValidTouristAttraction(place, { ...input, city: cityName }))

    // Enforce strict 35km radius from the city centroid to avoid homonyms in other countries (e.g. Pragal in Portugal)
    if (cityGeo && Number.isFinite(Number(cityGeo.latitude)) && Number.isFinite(Number(cityGeo.longitude))) {
      valid = valid.filter(place => {
        if (!place.latitude || !place.longitude) return false
        const distKm = haversineMeters(cityGeo.latitude, cityGeo.longitude, place.latitude, place.longitude) / 1000
        return distKm <= 35
      })
    }

    const capped = valid.slice(0, 5).map(p => ({ ...p, city: cityName }))
    allPlaces.push(...capped)
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

export async function collectCorridorCandidates(input, location) {
  const city = location?.city || input.city || ''
  const country = location?.country || input.country || ''
  
  let startPlace = null
  let endPlace = null
  
  if (input.originPlace === 'user_current_location' || input.isUserLocationOrigin || input.tourType === 'location_to_destination') {
    let userLat = Number(input.latitude ?? 0)
    let userLon = Number(input.longitude ?? 0)
    if (!userLat && location?.latitude) userLat = Number(location.latitude)
    if (!userLon && location?.longitude) userLon = Number(location.longitude)
    if (userLat && userLon) {
      const revGeo = await reverseGeocodeLocation(userLat, userLon).catch(() => null)
      const userCity = revGeo?.city || city
      const userCountry = revGeo?.country || country
      const placeName = revGeo?.name ? `Tu ubicación actual (${revGeo.name})` : (userCity ? `Tu ubicación actual (${userCity})` : 'Tu ubicación actual')
      startPlace = {
        name: placeName,
        latitude: userLat,
        longitude: userLon,
        category: 'origin',
        type: 'start_point',
        city: userCity,
        country: userCountry,
        coordinateSource: 'osm',
        coordinatesVerified: true,
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
  
  const targetDest = input.destinationPlace || input.destination
  if (targetDest) {
    let destGeo = null
    if (location?.latitude && location?.longitude && (location.name?.toLowerCase().includes(targetDest.toLowerCase()) || targetDest.toLowerCase().includes(location.name?.toLowerCase()))) {
      destGeo = location
    } else {
      destGeo = await geocodePlace(`${targetDest} ${city} ${country}`)
    }
    if (destGeo) {
      endPlace = {
        name: targetDest,
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
    const midTasks = steps.map(async (ratio) => {
      const midLat = latA + (latB - latA) * ratio
      const midLon = lonA + (lonB - lonA) * ratio
      try {
        const [attractions, foodSpots] = await Promise.all([
          overpassAttractions(midLat, midLon, 3500).catch(() => []),
          overpassNearbyFood(midLat, midLon, 2500).catch(() => [])
        ])
        return [...attractions, ...foodSpots]
      } catch (err) {
        return []
      }
    })
    const midResults = await Promise.race([
      Promise.allSettled(midTasks),
      new Promise(resolve => setTimeout(resolve, 2000))
    ])
    if (Array.isArray(midResults)) {
      for (const res of midResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          pool.push(...res.value)
        }
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
            placeId: geo.placeId || geo.place_id || '',
            coordinateSource: geo.coordinateSource || geo.coordinate_source || 'osm',
            coordinatesVerified: true,
            type: item.type || 'tourism',
            category: item.category || 'historic',
            city: geo.city || city,
            country: geo.country || country,
            address: geo.name || `${city}, ${item.name}`,
            description: item.description || '',
            tags: {
              iconic_landmark: 'true',
              grounded_geocoded: 'true',
              coordinates_verified: 'true',
              coordinate_source: geo.coordinateSource || geo.coordinate_source || 'osm'
            }
          }
        }
        return null
      })
    )
    const geocodedIconics = geocodedSettled.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
    pool.push(...geocodedIconics)
  }

  // 4. Inject explicit requested/selected places from chat itinerary (SSOT)
  const refList = (Array.isArray(input.specificPlaces) && input.specificPlaces.length > 0)
    ? input.specificPlaces
    : (Array.isArray(input.selectedPlaces) ? input.selectedPlaces : [])

  if (refList.length > 0) {
    const geocodedRefs = await Promise.allSettled(
      refList.map(async (item) => {
        const placeName = typeof item === 'string' ? item.trim() : String(item?.name || '').trim()
        if (!placeName) return null
        const normRefName = normalizeKey(placeName)
        if (normRefName.includes('tu ubicacion')) return null

        let lat = typeof item === 'object' && Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null
        let lon = typeof item === 'object' && Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null
        let coordSource = typeof item === 'object' ? (item.coordinateSource || 'osm') : 'osm'
        let placeId = typeof item === 'object' ? (item.placeId || '') : ''

        if (lat == null || lon == null) {
          const geo = await geocodePlace(`${placeName} ${city} ${country}`.trim()).catch(() => null)
          if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
            lat = Number(geo.latitude)
            lon = Number(geo.longitude)
            coordSource = geo.coordinateSource || 'osm'
            placeId = geo.placeId || ''
          }
        }

        if (lat != null && lon != null) {
          const rawCat = typeof item === 'object' ? (item.category || item.type || 'attraction') : 'attraction'
          const isFood = typeof item === 'object' ? (item.isRestaurant || item.type === 'food' || item.category === 'restaurant') : isFoodOrDrinkEstablishment(placeName)
          return {
            ...(typeof item === 'object' ? item : {}),
            name: placeName,
            latitude: lat,
            longitude: lon,
            coordinateSource: coordSource,
            coordinatesVerified: true,
            placeId,
            category: isFood ? 'restaurant' : rawCat,
            type: isFood ? 'food' : (typeof item === 'object' && item.type ? item.type : 'attraction'),
            isRestaurant: Boolean(isFood),
            tags: {
              ...(typeof item === 'object' && item.tags ? item.tags : {}),
              requested_place: 'true',
              grounded_geocoded: 'true',
              coordinates_verified: 'true',
              coordinate_source: coordSource
            }
          }
        }
        return null
      })
    )
    const validRefs = geocodedRefs.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
    pool.push(...validRefs)
  }

  let intermediates = uniqueByName(pool)
    .filter((place) => place && place.name)
    .filter((place) => place.tags?.requested_place === 'true' || isValidTouristAttraction(place, input))
    .filter((place) => place.tags?.requested_place === 'true' || isWithinCorridor(place, startPlace, endPlace))
  
  if (startPlace) {
    intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(startPlace.name))
  }
  if (endPlace) {
    intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(endPlace.name))
  }

  if (intermediates.length < 2 && startPlace && endPlace) {
    intermediates = uniqueByName(pool)
      .filter((place) => place && place.name)
      .filter((place) => place.tags?.requested_place === 'true' || isValidTouristAttraction(place, input))
      .filter((place) => place.tags?.requested_place === 'true' || isWithinCorridor(place, startPlace, endPlace, true))
    if (startPlace) {
      intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(startPlace.name))
    }
    if (endPlace) {
      intermediates = intermediates.filter(p => normalizeKey(p.name) !== normalizeKey(endPlace.name))
    }
  }

  if (intermediates.length < 2 && endPlace) {
    const endLat = endPlace.latitude
    const endLon = endPlace.longitude
    const endCity = endPlace.city || city || input.destination || ''
    const [wikiLandmarks, tomtomLandmarks] = await Promise.all([
      discoverDynamicCityLandmarks(endCity, country, endLat, endLon).catch(() => []),
      searchTomTomPlaces({ category: 'museum', lat: endLat, lon: endLon, limit: 4 }).catch(() => [])
    ])
    for (const item of [...wikiLandmarks, ...tomtomLandmarks]) {
      let pLat = Number(item.latitude)
      let pLon = Number(item.longitude)
      if (Number.isFinite(pLat) && Number.isFinite(pLon) && !intermediates.some(ex => arePlacesSimilar(ex.name, item.name)) && (!endPlace || !arePlacesSimilar(endPlace.name, item.name))) {
        intermediates.push({
          name: item.name,
          latitude: pLat,
          longitude: pLon,
          type: 'tourism',
          category: item.category || 'historic',
          city: endCity,
          country,
          address: item.address || `${item.name}, ${endCity}`,
          description: item.description || '',
          coordinateSource: item.coordinateSource || 'osm',
          coordinatesVerified: true,
          placeId: item.placeId || ''
        })
      }
    }
  }

  // Sort intermediates monotonically by forward progress t along route corridor
  if (startPlace && endPlace) {
    intermediates.sort((a, b) => {
      const projA = computeCorridorProjection(a, startPlace, endPlace)
      const projB = computeCorridorProjection(b, startPlace, endPlace)
      const tA = projA ? projA.t : haversineMeters(startPlace.latitude, startPlace.longitude, a.latitude, a.longitude)
      const tB = projB ? projB.t : haversineMeters(startPlace.latitude, startPlace.longitude, b.latitude, b.longitude)
      return tA - tB
    })
  } else if (startPlace && Number.isFinite(startPlace.latitude) && Number.isFinite(startPlace.longitude)) {
    intermediates.sort((a, b) => {
      const distA = haversineMeters(startPlace.latitude, startPlace.longitude, a.latitude, a.longitude)
      const distB = haversineMeters(startPlace.latitude, startPlace.longitude, b.latitude, b.longitude)
      return distA - distB
    })
  }

  const isUserOrigin = Boolean(input.isUserLocationOrigin || input.originPlace === 'user_current_location' || input.tourType === 'location_to_destination')
  const selected = []
  if (startPlace && !isUserOrigin && !normalizeKey(startPlace.name).includes('tu ubicacion')) {
    selected.push(startPlace)
  }
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
    const osmMultiCityPlaces = multiCityPlaces.filter(hasOsmMapRecord)
    if (osmMultiCityPlaces.length >= 3) {
      return { rawCount: osmMultiCityPlaces.length, places: osmMultiCityPlaces, source: 'multi-city-geodata' }
    }
  }

  // Case B: Origin and/or Destination specified route within city
  if (input.originPlace || input.destinationPlace || input.tourType === 'location_to_destination' || input.isUserLocationOrigin) {
    if (!input.durationHours) {
      input.durationHours = 8 // Default 1 day (8h)
    }
    const corridorPlaces = await collectCorridorCandidates(input, location)
    const osmCorridorPlaces = corridorPlaces.filter(hasOsmMapRecord)
    if (osmCorridorPlaces.length >= 2) {
      return { rawCount: osmCorridorPlaces.length, places: osmCorridorPlaces, source: 'corridor-route-geodata' }
    }
  }

  // Case C: Standard single-city tour
  const geoScope = geographicScopeFor(input)
  const isMicroDest = geoScope.tourType === 'micro_destination' || Boolean(input.canonicalDestination?.isMicroDestination)

  const city = isMicroDest
    ? (input.canonicalDestination?.entityName || input.destination || location?.city || input.city || '')
    : (location?.city || input.city || input.destination || '')
  let country = location?.country || input.country || ''

  let canonicalDest = input.canonicalDestination
  if (!canonicalDest && (city || input.destination)) {
    canonicalDest = await resolveCanonicalDestination(city || input.destination, { countryHint: country }).catch(() => null)
  }
  if (!country && canonicalDest?.country) {
    country = canonicalDest.country
  }

  // Obtenemos primero las coordenadas del centro del destino para validar el radio
  const cityGeo = (location?.latitude && location?.longitude)
    ? location
    : (canonicalDest?.latitude && canonicalDest?.longitude)
      ? canonicalDest
      : await geocodePlace(`${city} ${country}`.trim()).catch(() => null)
  let cityCenterLat = cityGeo?.latitude ?? canonicalDest?.latitude ?? null
  let cityCenterLon = cityGeo?.longitude ?? canonicalDest?.longitude ?? null

  // If cityCenterLat is still unresolved, check input GPS or known fallback centroids
  if (cityCenterLat == null && input.latitude && input.longitude) {
    cityCenterLat = Number(input.latitude)
    cityCenterLon = Number(input.longitude)
  }

  if (cityCenterLat == null) {
    const normC = (city || input.destination || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const fallbackCentroid = FALLBACK_DESTINATION_CENTROIDS[normC] ||
      FALLBACK_DESTINATION_CENTROIDS[normC.replace(/^(san|santa|el|la|los|las)\s+/, '')] ||
      Object.entries(FALLBACK_DESTINATION_CENTROIDS).find(([k]) => normC === k || (k.length >= 4 && normC.includes(k)))?.[1]
    if (fallbackCentroid) {
      cityCenterLat = fallbackCentroid.latitude
      cityCenterLon = fallbackCentroid.longitude
    }
  }

  if (!canonicalDest && cityCenterLat != null && cityCenterLon != null) {
    canonicalDest = {
      latitude: cityCenterLat,
      longitude: cityCenterLon,
      displayName: city,
      city,
      country
    }
  }

  // Geographic reach comes from the trip topology, not the number of days
  // or the thematic tour type.
  const isRegionalOrNature = geoScope.isRegional

  const maxCityRadiusKm = geoScope.maxDistanceKm

  function isWithinCityBounds(lat, lon, maxDistanceKm = maxCityRadiusKm) {
    if (!cityCenterLat || !cityCenterLon || !lat || !lon) return true
    if (!isWithinCoastalCorridorBounds(lat, lon, city)) {
      console.warn(`[collectTourCandidates] Omitiendo parada fuera del corredor costero (${lat}, ${lon} en ${city})`)
      return false
    }
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
    return isValidSpecificPlace(pName) && !isTemporalOrDurationPhrase(pName)
  })

  // If cityCenterLat is still unresolved, check the first specific place with coordinates
  if (cityCenterLat == null) {
    const firstWithCoords = rawSpecifics.find(p => p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)))
    if (firstWithCoords) {
      cityCenterLat = Number(firstWithCoords.latitude)
      cityCenterLon = Number(firstWithCoords.longitude)
    }
  }

  const mergedSpecifics = deduplicatePlacesByName(rawSpecifics)

  let geocodedSpecifics = []
  if (mergedSpecifics.length > 0) {
    const destLat = canonicalDest?.latitude ?? cityCenterLat ?? null
    const destLon = canonicalDest?.longitude ?? cityCenterLon ?? null
    const hasUnresolvedSpecifics = mergedSpecifics.some(p => !p || typeof p !== 'object' || !p.coordinatesVerified || !Number.isFinite(Number(p.latitude)))
    const catalog = (hasUnresolvedSpecifics && destLat != null && destLon != null)
      ? await getRealDestinationCatalog(city, country, destLat, destLon, { requestedDays: input.durationDays, tourType: input.tourType }).catch(() => null)
      : null

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
        if (!isValidSpecificPlace(placeName) || isTemporalOrDurationPhrase(placeName) || isNonTouristFacility({ name: placeName })) return null

        // If rawPlace already has verified coordinates from chat SSOT, preserve and reuse them directly
        let geo = null
        if (rawPlace && typeof rawPlace === 'object' && Number.isFinite(Number(rawPlace.latitude)) && Number.isFinite(Number(rawPlace.longitude)) && rawPlace.coordinatesVerified) {
          const rawLat = Number(rawPlace.latitude)
          const rawLon = Number(rawPlace.longitude)
          if (!isWithinCoastalCorridorBounds(rawLat, rawLon, city)) {
            console.warn(`[collectTourCandidates] Discarding place outside coastal corridor: ${placeName} (${rawLat}, ${rawLon} en ${city})`)
            return null
          }
          geo = {
            name: placeName,
            latitude: rawLat,
            longitude: rawLon,
            city: rawPlace.city || city,
            country: rawPlace.country || country,
            address: rawPlace.address || `${placeName}, ${city}`,
            placeId: rawPlace.placeId || rawPlace.id || '',
            coordinateSource: rawPlace.coordinateSource || 'osm',
            coordinatesVerified: true,
            isReferentialLocation: Boolean(rawPlace.isReferentialLocation)
          }
        }

        const isExplicitDining = (rawPlace && typeof rawPlace === 'object' && (rawPlace.isRestaurant || rawPlace.type === 'food' || rawPlace.category === 'restaurant' || rawPlace.entityType === 'restaurant')) || isFoodOrDrinkEstablishment(placeName) || /restaurante|bistro|caf[ée]|comida|asador|gourmet|bar|pub|ostras|ostrer[íi]a|mariscos|del\s+sabor/i.test(placeName)
        const isCulturalVenue = /\b(museo|zoo|acuario|catedral|iglesia|parque|carnaval|estadio|monumento|teatro)\b/i.test(placeName)
        const isRestaurant = isExplicitDining && (!isCulturalVenue || (rawPlace && typeof rawPlace === 'object' && rawPlace.isRestaurant))
        const destLat = canonicalDest?.latitude ?? cityCenterLat ?? null
        const destLon = canonicalDest?.longitude ?? cityCenterLon ?? null

        const regionalOpts = {
          isRegionalOrNature,
          isMicroDest: Boolean(isMicroDest || canonicalDest?.isMicroDestination),
          durationDays: input.durationDays,
          maxDistanceKm: geoScope.maxDistanceKm,
          city,
          country
        }

        // 2. Check preloaded catalog coordinatesMap (0 network calls)
        if (!geo && catalog?.coordinatesMap) {
          const mapped = catalog.coordinatesMap[placeName.toLowerCase().trim()]
          if (mapped && validateCandidateLocation(mapped, canonicalDest, geoScope.maxDistanceKm)) {
            geo = {
              name: placeName,
              latitude: mapped.latitude,
              longitude: mapped.longitude,
              city: mapped.city || city,
              country: mapped.country || country,
              address: mapped.address || `${placeName}, ${city}`,
              placeId: mapped.placeId || '',
              coordinateSource: mapped.coordinateSource || 'osm',
              coordinatesVerified: true
            }
          }
        }

        // 3. Check preloaded catalog pool for restaurants or places (0 network calls)
        if (!geo && catalog) {
          const pool = isExplicitDining ? (catalog.restaurants || []) : (catalog.places || [])
          const match = pool.find(item => {
            const iName = typeof item === 'string' ? item : item?.name
            return iName && (iName.toLowerCase().trim() === placeName.toLowerCase().trim() || arePlacesSimilar(iName, placeName))
          })
          if (match && typeof match === 'object') {
            const mLat = Number(match.latitude ?? match.lat)
            const mLon = Number(match.longitude ?? match.lon)
            if (Number.isFinite(mLat) && Number.isFinite(mLon) && validateCandidateLocation({ latitude: mLat, longitude: mLon, name: placeName }, canonicalDest, geoScope.maxDistanceKm)) {
              geo = {
                name: placeName,
                latitude: mLat,
                longitude: mLon,
                city,
                country,
                address: match.address || `${placeName}, ${city}`,
                placeId: match.placeId || match.id || '',
                coordinateSource: match.coordinateSource || 'osm',
                coordinatesVerified: true
              }
            }
          }
        }

        // 4. Cascade geocoding (Cache -> Mapbox -> Geoapify -> OSM -> AI Physical Address)
        if (!geo) {
          const cleanPName = cleanPlacePhysicalName(placeName) || placeName
          const rawAddress = (typeof rawPlace === 'object' ? (rawPlace.address || rawPlace.direccion || rawPlace.ubicacion?.direccion) : '') || ''
          geo = await resolvePlaceWithCascade({
            name: cleanPName,
            city,
            country: country || canonicalDest?.country || 'Colombia',
            address: rawAddress,
            cityLat: destLat,
            cityLon: destLon,
            maxDistanceKm: geoScope.maxDistanceKm,
            options: { preferCanonical: true, ...regionalOpts }
          }).catch(() => null)

          if (!geo) {
            const searchQuery = `${cleanPName}, ${city}`.trim()
            geo = await Promise.race([
              geocodePlace(searchQuery, destLat, destLon, regionalOpts).catch(() => null),
              new Promise(resolve => setTimeout(() => resolve(null), 1500))
            ])
          }
          if (geo && !hasOsmMapRecord(geo)) {
            geo = null
          }
          if (geo && !validateCandidateLocation(geo, canonicalDest, geoScope.maxDistanceKm)) {
            geo = null
          }
        }

        // 5. Strict rejection of unlocatable or out-of-bounds places (zero synthetic jitter coordinates)
        if (!geo || !validateCandidateLocation(geo, canonicalDest, geoScope.maxDistanceKm)) {
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
            const maxBound = geoScope.maxDistanceKm
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
            subcategory: isRestaurant ? 'restaurant' : (rawPlace?.subcategory || undefined),
            isRestaurant: Boolean(isRestaurant),
            entityType: isRestaurant ? 'restaurant' : (rawPlace?.entityType || 'attraction'),
            dia: placeDay,
            day: placeDay,
            city: geo.city || city,
            country: geo.country || country,
            address: geo?.address || geo?.name || `${placeName}, ${geo?.city || city}`,
            description: '',
            placeId: geo.placeId || geo.place_id || geo.id || '',
            coordinateSource: geo.coordinateSource || geo.coordinate_source || 'osm',
            coordinatesVerified: true,
            tags: {
              requested_place: 'true',
              grounded_geocoded: 'true',
              coordinates_verified: 'true',
              coordinate_source: geo.coordinateSource || geo.coordinate_source || 'osm'
            }
          }
        }
        return null
      })
    )

    geocodedSpecifics = specificSettled
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(Boolean)

    // Retry unresolved requested places only through map-backed geocoding.
    const geocodedNames = new Set(geocodedSpecifics.map(p => p.name.toLowerCase()))
    const missingSpecifics = mergedSpecifics.filter(raw => {
      const name = typeof raw === 'string' ? raw : (raw?.name || '')
      return name && !geocodedNames.has(name.toLowerCase())
    })

    if (missingSpecifics.length > 0) {
      console.info(`[collectTourCandidates] ${missingSpecifics.length} specific places missing coordinates after first pass. Resolving via strict grounded geocoding...`)
      const destLat = canonicalDest?.latitude ?? cityCenterLat ?? null
      const destLon = canonicalDest?.longitude ?? cityCenterLon ?? null
      const regionalOpts = {
          isRegionalOrNature,
          isMicroDest: Boolean(isMicroDest || canonicalDest?.isMicroDestination),
          durationDays: input.durationDays,
          maxDistanceKm: geoScope.maxDistanceKm,
          city,
          country
      }

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
        if (!placeName || !isValidSpecificPlace(placeName) || isNonTouristFacility({ name: placeName })) continue

        const cleanPName = cleanPlacePhysicalName(placeName) || placeName
        let directGeo = (raw && typeof raw === 'object' && Number.isFinite(Number(raw.latitude)) && Number.isFinite(Number(raw.longitude)) && raw.coordinatesVerified) ? { name: placeName, latitude: Number(raw.latitude), longitude: Number(raw.longitude), city, country, address: raw.address || `${placeName}, ${city}`, coordinateSource: raw.coordinateSource || 'osm', coordinatesVerified: true } : null

        // 1. Fast check against preloaded catalog coordinatesMap (0 network calls)
        if (catalog?.coordinatesMap) {
          const mapped = catalog.coordinatesMap[cleanPName.toLowerCase().trim()] || catalog.coordinatesMap[placeName.toLowerCase().trim()]
          if (mapped && validateCandidateLocation(mapped, canonicalDest, geoScope.maxDistanceKm)) {
            directGeo = {
              name: placeName,
              latitude: mapped.latitude,
              longitude: mapped.longitude,
              city,
              country,
              address: `${placeName}, ${city}`,
              coordinateSource: mapped.coordinateSource || 'osm',
              coordinatesVerified: true
            }
          }
        }

        // 2. Cascade geocoding attempt (Cache -> Mapbox -> Geoapify -> OSM -> AI Physical Address)
        if (!directGeo) {
          const rawAddress = (typeof raw === 'object' ? (raw.address || raw.direccion || raw.ubicacion?.direccion) : '') || ''
          directGeo = await resolvePlaceWithCascade({
            name: cleanPName,
            city,
            country: country || canonicalDest?.country || 'Colombia',
            address: rawAddress,
            cityLat: destLat,
            cityLon: destLon,
            maxDistanceKm: geoScope.maxDistanceKm,
            options: regionalOpts
          }).catch(() => null)

          if (!directGeo) {
            directGeo = await Promise.race([
              geocodePlace(`${cleanPName}, ${city}`.trim(), destLat, destLon, regionalOpts).catch(() => null),
              new Promise(resolve => setTimeout(() => resolve(null), 1200))
            ])
          }
        }

        if (directGeo && !hasOsmMapRecord(directGeo)) {
          directGeo = null
        }

        const tagSource = directGeo?.coordinateSource || directGeo?.coordinate_source || 'osm'

        let finalLat = null
        let finalLon = null
        let address = directGeo?.name || `${placeName}, ${city}`

        if (directGeo && Number.isFinite(directGeo.latitude) && Number.isFinite(directGeo.longitude)) {
          if (validateCandidateLocation(directGeo, canonicalDest, geoScope.maxDistanceKm)) {
            finalLat = Number(directGeo.latitude)
            finalLon = Number(directGeo.longitude)
          }
        }

        // Strict policy: Discard unlocatable venues without random synthetic replacements
        if (finalLat == null || finalLon == null) {
          console.warn(`[collectTourCandidates] Discarding unlocatable candidate "${placeName}" in ${city}. No dynamic replacement or synthetic coordinates allowed.`)
          continue
        }

        const isExplicitDining = (typeof raw === 'object' && (raw.isRestaurant || raw.category === 'restaurant' || raw.type === 'food' || raw.entityType === 'restaurant')) || isFoodOrDrinkEstablishment(placeName) || /restaurante|bistro|caf[ée]|comida|asador|gourmet|bar|pub|ostras|ostrer[íi]a|mariscos|del\s+sabor/i.test(placeName)
        const isCulturalVenue = /\b(museo|zoo|acuario|catedral|iglesia|parque|carnaval|estadio|monumento|teatro)\b/i.test(placeName)
        const isRestaurant = isExplicitDining && (!isCulturalVenue || (typeof raw === 'object' && raw.isRestaurant))
        geocodedSpecifics.push({
          name: placeName,
          latitude: finalLat,
          longitude: finalLon,
          type: isRestaurant ? 'restaurant' : 'tourism',
          category: isRestaurant ? 'restaurant' : 'requested',
          subcategory: isRestaurant ? 'restaurant' : (raw?.subcategory || undefined),
          isRestaurant: Boolean(isRestaurant),
          entityType: isRestaurant ? 'restaurant' : (raw?.entityType || 'attraction'),
          dia: placeDay,
          day: placeDay,
          city: directGeo?.city || city,
          country: directGeo?.country || country,
          address,
          description: '',
          placeId: directGeo?.placeId || directGeo?.place_id || directGeo?.id || '',
          coordinateSource: directGeo?.coordinateSource || directGeo?.coordinate_source || tagSource,
          coordinatesVerified: true,
          tags: {
            requested_place: 'true',
            grounded_geocoded: 'true',
            coordinates_verified: 'true',
            coordinate_source: directGeo?.coordinateSource || directGeo?.coordinate_source || tagSource,
            ...(isRestaurant ? { is_restaurant: 'true', category: 'restaurant' } : {})
          }
        })
      }
    }

    // Fast-path: Si el usuario ya seleccionó paradas específicas en el chat y
    // todas quedaron geocodificadas (o sustituidas por un POI local verificado),
    // retornar directamente ahorrando múltiples llamadas lentas y timeouts a
    // Overpass/Photon/OpenAI. Nunca devolver una lista parcial: eso hacía que
    // una parada, y con ella todo un día del itinerario, desapareciera.
    if (geocodedSpecifics.length >= 2 && geocodedSpecifics.length >= mergedSpecifics.length) {
      console.info(`[collectTourCandidates] Fast-path: Successfully geocoded ${geocodedSpecifics.length}/${mergedSpecifics.length} user selected stops directly. Skipping generic city scrapers.`)
      return {
        rawCount: geocodedSpecifics.length,
        places: geocodedSpecifics,
        source: 'user-chat-selected-places'
      }
    }
  }

  // 1. Fetch top iconic landmarks (OpenAI or Open-Source Tourism discovery)
  const targetCity = isMicroDest ? (input.canonicalDestination?.entityName || input.destination || city) : city
  const searchLat = input.canonicalDestination?.latitude || location?.latitude || cityCenterLat
  const searchLon = input.canonicalDestination?.longitude || location?.longitude || cityCenterLon

  const [iconicLandmarks, wikiLandmarks, tomtomResults] = await Promise.all([
    fetchCityIconicLandmarks(
      targetCity,
      country,
      searchLat,
      searchLon,
      15
    ).catch(() => []),
    discoverDynamicCityLandmarks(targetCity, country, searchLat, searchLon).catch(() => []),
    (searchLat && searchLon) ? Promise.all([
      searchTomTomPlaces({ category: 'museum', lat: searchLat, lon: searchLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => []),
      searchTomTomPlaces({ category: 'historic_building', lat: searchLat, lon: searchLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => []),
      searchTomTomPlaces({ category: 'park_recreation_area', lat: searchLat, lon: searchLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => []),
      searchTomTomPlaces({ query: targetCity, lat: searchLat, lon: searchLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => [])
    ]).then(res => res.flat()).catch(() => []) : Promise.resolve([])
  ])

  let geocodedIconics = []
  if (Array.isArray(iconicLandmarks) && iconicLandmarks.length > 0) {
    const geocodedSettled = await Promise.allSettled(
      iconicLandmarks.map(async (item) => {
        const searchQuery = `${item.name} ${city} ${country}`.trim()
        const geo = await geocodePlace(searchQuery, cityCenterLat, cityCenterLon, {
          city,
          country,
          isRegionalOrNature,
          maxDistanceKm: geoScope.maxDistanceKm,
        })
        if (geo && hasOsmMapRecord(geo) && (geo.latitude || geo.longitude) && isWithinCityBounds(geo.latitude, geo.longitude)) {
          return {
            name: item.name,
            latitude: geo.latitude,
            longitude: geo.longitude,
            type: item.type || 'tourism',
            category: item.category || 'historic',
            city,
            country,
            address: geo.address || geo.name || `${city}, ${item.name}`,
            placeId: geo.placeId || geo.place_id || '',
            coordinateSource: geo.coordinateSource || geo.coordinate_source || '',
            coordinatesVerified: true,
            description: item.description || '',
            tags: {
              iconic_landmark: 'true',
              coordinate_source: geo.coordinateSource || geo.coordinate_source || '',
              coordinates_verified: 'true'
            }
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

  const cleanTomTom = (tomtomResults || []).map(p => ({
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    type: p.category || 'tourism',
    category: p.category || 'historic',
    city,
    country,
    address: p.address || `${p.name}, ${city}`,
    placeId: p.placeId || '',
    coordinateSource: 'tomtom',
    coordinatesVerified: true,
    tags: { tomtom_landmark: 'true', coordinate_source: 'tomtom', coordinates_verified: 'true' }
  })).filter(p => !isNonTouristFacility({ name: p.name }) && !isNonTouristFacility(p.tags))

  const geocodedWikiSettled = await Promise.allSettled(
    (wikiLandmarks || []).map(async (item) => {
      let pLat = Number(item.latitude)
      let pLon = Number(item.longitude)
      let pSource = item.source || 'wikipedia-geosearch'
      if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
        const searchQuery = `${item.name}, ${city}, ${country}`.trim()
        const geo = await geocodePlace(searchQuery, searchLat, searchLon, {
          city,
          country,
          isRegionalOrNature,
          maxDistanceKm: geoScope.maxDistanceKm
        }).catch(() => null)
        if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
          pLat = Number(geo.latitude)
          pLon = Number(geo.longitude)
          pSource = geo.coordinateSource || 'osm'
        }
      }
      if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
        const candidate = {
          name: item.name,
          latitude: pLat,
          longitude: pLon,
          type: item.type || 'tourism',
          category: item.category || 'historic',
          subcategory: item.subcategory,
          city,
          country,
          address: item.address || `${item.name}, ${city}`,
          placeId: item.placeId || '',
          coordinateSource: pSource,
          coordinatesVerified: true,
          description: item.description || '',
          fromWikipediaDiscovery: true,
          tags: {
            from_wikipedia: 'true',
            coordinate_source: pSource,
            coordinates_verified: 'true'
          }
        }
        if (hasOsmMapRecord(candidate) && isValidTouristAttraction(candidate, input)) {
          return candidate
        }
      }
      return null
    })
  )
  const geocodedWiki = geocodedWikiSettled
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean)

  const query = `${input.destination} ${city} ${country}`.trim()
  const photonPlaces = await photonSearch(query, 30).catch(() => [])

  const radiusWide = Math.round(geoScope.maxDistanceKm * 1000)

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
  
  // Prioritize specific chat places, geocoded iconic landmarks, Wikipedia POIs, and TomTom POIs first in the pool
  let pool = [...geocodedSpecifics, ...geocodedIconics, ...geocodedWiki, ...cleanTomTom, ...overpassPlaces, ...photonPlaces]

  // Proximity filter against subzone centroid to prevent mixing distant downtown POIs with nature reserves
  if (validSpecifics.length > 0 && searchCenterLat && searchCenterLon) {
    pool = pool.filter(place => {
      if (!hasUsableCoordinates(place.latitude, place.longitude)) return false
      const distToCentroid = haversineMeters(place.latitude, place.longitude, searchCenterLat, searchCenterLon) / 1000
      return distToCentroid <= (isRegionalOrNature ? Math.min(geoScope.maxDistanceKm, 22) : Math.min(geoScope.maxDistanceKm, 12))
    })
  }
  
  function dedupeByProximity(places, minDistanceMeters = 50) {
    const result = []
    for (const p of places) {
      if (!p || !p.name) continue
      const pKey = normalizePlaceKey(p.name)
      const pIdentityKey = canonicalPlaceKey(p.name, p.city || city)
      const pType = getPlaceEntityType(p.name)
      const pDay = p.dia || p.day
      
      const existingIdx = result.findIndex(item => {
        const itemKey = normalizePlaceKey(item.name)
        const itemIdentityKey = canonicalPlaceKey(item.name, item.city || city)
        const itemType = getPlaceEntityType(item.name)
        const itemDay = item.dia || item.day

        // Un mismo complejo físico no debe convertirse en dos paradas sólo
        // porque la IA alternó entre su nombre institucional y comercial.
        if (pIdentityKey.startsWith('canonical:') && pIdentityKey === itemIdentityKey) {
          return true
        }

        // 1. Nunca mezclar lugares asignados a días diferentes
        if (pDay != null && itemDay != null && Number(pDay) !== Number(itemDay)) {
          return false
        }

        // 2. Coincidencia exacta de clave de nombre
        if (pKey === itemKey || arePlaceNamesSemanticallySame(p.name, item.name, city)) return true
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
    .filter((place) => hasOsmMapRecord(place))
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
    const specificKeys = new Set(geocodedSpecifics.map(p => canonicalPlaceKey(p.name, p.city || city)))
    const remainder = normalizedPool.filter(p => !specificKeys.has(canonicalPlaceKey(p.name, p.city || city)))
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
          if (geo && hasOsmMapRecord(geo) && validateCandidateLocation(geo, input.canonicalDestination || location, geoScope.maxDistanceKm)) {
            return {
              name: item.name,
              latitude: geo.latitude,
              longitude: geo.longitude,
            type: item.type || 'tourism',
            category: item.category || input.type || 'historic',
            city,
            country,
            address: geo.address || geo.name || `${city}, ${item.name}`,
            placeId: geo.placeId || geo.place_id || '',
            coordinateSource: geo.coordinateSource || geo.coordinate_source || '',
            coordinatesVerified: true,
            description: item.description || '',
            tags: {
              ai_generated_fallback: 'true',
              coordinate_source: geo.coordinateSource || geo.coordinate_source || '',
              coordinates_verified: 'true'
            }
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

  selected = selected.filter(hasOsmMapRecord)

  if (selected.length < 3) {
    console.info('[tour-ai] Activating open-source tourism & TomTom discovery fallback for:', { destination: input.destination, city, country })
    const centerLat = canonicalDest?.latitude ?? cityCenterLat ?? location?.latitude
    const centerLon = canonicalDest?.longitude ?? cityCenterLon ?? location?.longitude
    
    // 1. Wikipedia & Wikivoyage dynamic landmarks
    const wikiLandmarks = await discoverDynamicCityLandmarks(city || input.destination, country, centerLat, centerLon).catch(() => [])
    
    // 2. TomTom POI search for museums, parks, historic buildings and landmarks
    const tomtomResults = await Promise.all([
      searchTomTomPlaces({ category: 'museum', lat: centerLat, lon: centerLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 8 }).catch(() => []),
      searchTomTomPlaces({ category: 'historic_building', lat: centerLat, lon: centerLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => []),
      searchTomTomPlaces({ category: 'park_recreation_area', lat: centerLat, lon: centerLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 6 }).catch(() => []),
      searchTomTomPlaces({ query: `${city || input.destination}`, lat: centerLat, lon: centerLon, radiusMeters: Math.round(geoScope.maxDistanceKm * 1000), limit: 8 }).catch(() => [])
    ])
    const tomtomLandmarks = tomtomResults.flat()

    const openDataCandidates = [...wikiLandmarks, ...tomtomLandmarks]
    if (openDataCandidates.length > 0) {
      const regionalOpts = {
        isRegionalOrNature,
        isMicroDest: Boolean(isMicroDest || canonicalDest?.isMicroDestination),
        durationDays: input.durationDays,
        maxDistanceKm: geoScope.maxDistanceKm,
        city,
        country
      }
      const geocodedOpenData = await Promise.allSettled(
        openDataCandidates.map(async (item) => {
          let pLat = Number(item.latitude)
          let pLon = Number(item.longitude)
          let pSource = item.coordinateSource || 'osm'
          if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
            const searchQuery = `${item.name}, ${city}, ${country}`.trim()
            const geo = await geocodePlace(searchQuery, centerLat, centerLon, regionalOpts).catch(() => null)
            if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
              pLat = Number(geo.latitude)
              pLon = Number(geo.longitude)
              pSource = geo.coordinateSource || 'osm'
            }
          }
          if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
            const candidateObj = {
              name: item.name,
              latitude: pLat,
              longitude: pLon,
              type: item.type || 'tourism',
              category: item.category || 'historic',
              subcategory: item.subcategory,
              city,
              country,
              address: item.address || `${item.name}, ${city}`,
              placeId: item.placeId || '',
              coordinateSource: pSource,
              coordinatesVerified: true,
              description: item.description || '',
              tags: {
                open_tourism_fallback: 'true',
                coordinate_source: pSource,
                coordinates_verified: 'true'
              }
            }
            if (hasOsmMapRecord(candidateObj) && validateCandidateLocation(candidateObj, canonicalDest || location, geoScope.maxDistanceKm)) {
              return candidateObj
            }
          }
          return null
        })
      )
      const validOpenData = geocodedOpenData
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean)

      if (validOpenData.length > 0) {
        selected = uniqueByName([...selected, ...validOpenData])
        source = 'open-tourism-tomtom-fallback'
      }
    }
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

  // 0.000 Bloqueo absoluto de marcas y nombres de alojamiento/hoteles (Crowne Plaza, Dann Carlton, etc.)
  if (isLodgingName(nameLower) || isLodgingCategoryOrGeneric(nameLower) || place.category === 'hotel' || place.tags?.tourism === 'hotel' || place.tags?.tourism === 'hostel' || place.tags?.tourism === 'motel' || place.tags?.tourism === 'guest_house') {
    return false
  }

  // 0.001 Bloqueo de estructuras físicas genéricas o no turísticas (pérgolas, canchas de barrio, paradas de bus)
  if (/^(la\s+)?(p[ée]rgola|cancha|cancha sint[ée]tica|cancha de f[uú]tbol|cancha de microf[uú]tbol|parada de bus|estaci[óo]n de bus|quiosco|kiosco|grader[íi]as)$/i.test(nameLower) ||
      /\b(cancha sint[ée]tica|cancha de f[uú]tbol|parque cancha)\b/i.test(nameLower)) {
    return false
  }

  // 0.002 Bloqueo absoluto de estaciones policiales, CAI, puntos de información burocráticos y oficinas
  if (/\b(polic[íi]a|police|cai|punto de informaci[óo]n|tourist information|oficina de informaci[óo]n|oficina de turismo|alcald[íi]a|juzgado|notar[íi]a|embajada|consulado|banco|atm|cajero|supermercado|farmacia|droguer[íi]a|hospital|cl[íi]nica)\b/i.test(nameLower) ||
      /\b(agencia\s+de\s+viajes?|viajes\s+y\s+turismo|turismo\s+internacional|tour\s+operator|travel\s+agency|travel\s+and\s+tours?|operador\s+tur[ií]stico|operadores\s+tur[ií]sticos|mayorista\s+de\s+turismo|venta\s+de\s+tiquetes|ticket\s+office|asesores?\s+de\s+viajes?)\b/i.test(nameLower) ||
      /^(?:parque\s+nacional|plaza\s+de\s+mercado|plaza\s+de\s+mercado\s+central|centro\s+comercial|zona\s+rosa|centro\s+historico|centro)$/i.test(nameLower) ||
      place.tags?.tourism === 'travel_agency' ||
      place.tags?.shop === 'travel_agency' ||
      place.tags?.office === 'travel_agency' ||
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
    if (isLodgingName(nameLower) || isLodgingCategoryOrGeneric(nameLower) || place.category === 'hotel' || place.tags?.tourism === 'hotel') {
      return false
    }
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
  const isIconicBridgeOrAttraction = /\b(puente pumarejo|puente de boyac[aá]|puente de occidente|puente colgante|golden gate|brooklyn bridge|tower bridge|ponte vecchio)\b/i.test(nameLower) || place.tags?.historic === 'monument' || place.tags?.tourism === 'attraction'
  if (!isIconicBridgeOrAttraction) {
    if (
      /aeropuerto|airport|terminal de transporte|terminal de buses|terminal terrestre|corredor vial|variante|troncal|autopista|via |vía |calle |carrera |avenida |diagonal |transversal |puente |road |street |highway /i.test(nameLower) ||
      /^via |^vía |^calle |^carrera |^avenida |^diagonal |^transversal |^variante |^puente |^autopista |^road |^street |^highway /i.test(nameLower) ||
      /via$|vía$|calle$|carrera$|avenida$|diagonal$|transversal$|variante$|puente$|autopista$|road$|street$|highway$/i.test(nameLower)
    ) {
      return false
    }
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

  const geoScope = geographicScopeFor(input)
  const maxDistanceKm = geoScope.maxDistanceKm
  return validateCandidateLocation(place, canonicalDest, maxDistanceKm)
}

function findCandidatePlace(name, candidatePlaces, anchorPlace = null) {
  if (!name || !Array.isArray(candidatePlaces) || candidatePlaces.length === 0) return null
  const key = normalizeKey(name)
  if (!key) return null
  
  // 1. Coincidencia exacta
  const exact = candidatePlaces.find((place) => normalizeKey(place.name) === key)
  if (exact) return exact

  // 2. Coincidencia por identidad física canónica (ej. Casa/Museo del Carnaval)
  const canonicalKey = canonicalPlaceKey(name, anchorPlace?.city || '')
  if (canonicalKey.startsWith('canonical:')) {
    const canonicalMatch = candidatePlaces.find((place) =>
      canonicalPlaceKey(place.name, place.city || anchorPlace?.city || '') === canonicalKey
    )
    if (canonicalMatch) return canonicalMatch
  }

  // 3. Coincidencia normalizada de clave de lugar
  const normKey = normalizePlaceKey(name)
  if (normKey) {
    const keyMatch = candidatePlaces.find((place) => normalizePlaceKey(place.name) === normKey)
    if (keyMatch) return keyMatch
  }

  // 4. Coincidencia por similitud profunda
  const similar = candidatePlaces.find((place) => arePlacesSimilar(place.name, name))
  if (similar) return similar
  
  // 5. Coincidencia donde el candidato contiene la parada (Ej: Parada "Catedral", Candidato "Catedral de Santa Marta")
  const candidateContainsStop = candidatePlaces.find((place) => {
    const placeKey = normalizeKey(place.name)
    return placeKey.includes(key) && key.length >= 6
  })
  if (candidateContainsStop) return candidateContainsStop

  // 6. Coincidencia donde la parada contiene al candidato, sólo si no es un término genérico muy corto
  const stopContainsCandidate = candidatePlaces.find((place) => {
    const placeKey = normalizeKey(place.name)
    if (placeKey.length < 6) return false
    return key.includes(placeKey)
  })
  if (stopContainsCandidate) return stopContainsCandidate

  return null
}



function hasUsableCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
}

function isVerifiedCoordinatePlace(place) {
  if (!place || typeof place !== 'object') return false
  return hasVerifiedCoordinates(place) || hasVerifiedCoordinates(place.locationInfo)
}



function fallbackCover(seed = 'travel') {
  const safeSeed = String(seed || 'travel').toLowerCase()
  if (safeSeed.includes('santa marta')) {
    return 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80' // Santa Marta Tayrona coast
  }
  if (safeSeed.includes('cartagena')) {
    return 'https://images.unsplash.com/photo-1583531352515-888413146611?auto=format&fit=crop&w=1200&q=80' // Cartagena colonial
  }
  if (safeSeed.includes('barranquilla')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' // Gran Malecón / Caribe
  }
  if (safeSeed.includes('medellin') || safeSeed.includes('medellín')) {
    return 'https://images.unsplash.com/photo-1599388301549-3714578b820a?auto=format&fit=crop&w=1200&q=80'
  }
  if (safeSeed.includes('bogota') || safeSeed.includes('bogotá')) {
    return 'https://images.unsplash.com/photo-1584305574647-0cc949a2da9f?auto=format&fit=crop&w=1200&q=80'
  }
  const images = [
    'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80',
  ]
  const hash = [...safeSeed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
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

function isAccommodationStopName(value, selectedHotel = null) {
  const name = String(value || '').trim().toLowerCase()
  if (!name) return false
  if (/\b(hotel|hostal|hostel|resort|inn|lodging|alojamiento|hospedaje|motel)\b/i.test(name)) {
    return true
  }

  const selectedName = String(
    selectedHotel?.name || selectedHotel?.nombre || selectedHotel?.nombre_lugar || selectedHotel || ''
  ).trim().toLowerCase()
  return selectedName.length >= 3 && (
    name === selectedName ||
    name.includes(selectedName) ||
    selectedName.includes(name)
  )
}

function placeIdFor(name, latitude, longitude) {
  return `${name}-${latitude}-${longitude}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function persistTour(tour, route, input, userId) {
  const firstPublicStop = (tour.itinerario || []).find(stop => !isAccommodationStopName(stop?.nombre))
  const publicMeetingPoint = tour.public_punto_encuentro || (
    isAccommodationStopName(tour.punto_encuentro?.nombre_lugar, tour.user_hotel)
      ? (firstPublicStop?.ubicacion || {})
      : (tour.punto_encuentro || {})
  )
  const { user_hotel: _privateHotel, public_punto_encuentro: _publicMarker, ...publicTour } = tour
  const publicCreationJson = {
    ...publicTour,
    punto_encuentro: publicMeetingPoint,
  }

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
      creation_json: publicCreationJson,
      short_summary: tour.resumen_corto,
      subcategories: tour.subcategorias,
      featured_experience: tour.experiencia_destacada,
      place_history: tour.historia_del_lugar,
      cultural_context: tour.contexto_cultural,
      available_languages: tour.idiomas_disponibles,
      recommended_audience: tour.publico_recomendado,
      best_season: tour.mejor_epoca,
      recommended_schedule: tour.horario_recomendado,
      meeting_point: publicMeetingPoint?.nombre_lugar ?? '',
      meeting_point_info: publicMeetingPoint,
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
          // Accommodation is a private navigation base, never a public tourist stop.
          if (isAccommodationStopName(stopNameLower, tour.user_hotel)) return null

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
            is_fallback_image: Boolean(stop.isFallbackImage || stop.isDemoImage || stop.isReferenceImage),
            is_demo_image: Boolean(stop.isFallbackImage || stop.isDemoImage || stop.isReferenceImage),
            is_reference_image: Boolean(stop.isFallbackImage || stop.isDemoImage || stop.isReferenceImage),
            // Include image_metadata containing day details so the UI loads day groups correctly
            image_metadata: {
              dia: stop.dia ?? 1,
              day: stop.dia ?? 1,
              activities: stop.actividades,
              datos_curiosos: stop.datos_curiosos,
              consejos: stop.consejos,
              location_info: stop.ubicacion,
              isFallbackImage: Boolean(stop.isFallbackImage || stop.isDemoImage || stop.isReferenceImage),
              isDemoImage: Boolean(stop.isFallbackImage || stop.isDemoImage || stop.isReferenceImage),
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

const ROUTE_ASSISTANT_SYSTEM_PROMPT = `Eres la voz de VibeTours: una guía turística profesional colombiana, joven adulta, muy extrovertida, alegre, carismática y aventurera. Te apasiona viajar, descubrir nuevos lugares y acompañar al usuario paso a paso en su recorrido como una amiga experta.

PERSONALIDAD Y TONO DE VOZ:
- Hablas con energía, calidez, entusiasmo y confianza. Tu vibra es cercana, espontánea y divertida.
- Tienes un acento colombiano con una sutil musicalidad paisa en la entonación y calidez de tus frases, pero con pronunciación impecable y perfectamente clara para cualquier hispanohablante.
- Ritmo dinámico, fluido y con chispa. Usa signos de puntuación naturales (comas y signos de admiración) para generar pausas y cadencia de respiración orgánica al ser leído en voz alta por el sintetizador de voz (TTS).
- REGLAS DE LENGUAJE ESTRICTAS:
  * Prohibido sonar robótica, fría o corporativa.
  * Prohibido el acento paisa exagerado o caricaturesco: NO abuses de modismos como "parce", "pues", "mor" ni jergas forzadas.
  * Prohibido sonar infantil, sobreactuada o agresiva.
  * Mantén siempre la amabilidad, la empatía y la frescura (ejemplos: "¡De una! Ya mismo te busco...", "¡Qué delicia! Mira, muy cerca de aquí tienes...", "¡Listo, te tengo la ruta perfecta!", "¡Qué gran parada elegiste!").

TOLERANCIA A ENTRADA DE VOZ (SPEECH-TO-TEXT):
- La consulta del usuario proviene directamente de un micrófono mediante reconocimiento de voz en la calle. Puede contener errores fonéticos, homófonos (ej: "a dónde" transcrito como "adonde", nombres de sitios mal segmentados o con ortografía aproximada como "montserrate" por "Monserrate", "candelaria" por "La Candelaria", o palabras omitidas por ruido ambiental).
- Infiere con empatía e inteligencia la verdadera intención turística del viajero sin juzgar ni señalar el error.

CLASIFICACIÓN:
- Si la consulta es sobre viajes, turismo, comida/restaurantes, lugares de interés, navegación, regreso al hotel o casa, clima, cultura, etc. → isRelatedToTravel: true.
- Si es ajena al viaje (matemáticas, programación, política, etc.) → isRelatedToTravel: false.

ACCIONES DISPONIBLES (actionType):
1. "SEARCH_RESTAURANTS": el usuario tiene hambre, busca comida, restaurantes, cafés o bares en la zona. (Importante: la búsqueda se realiza alrededor de la posición del usuario).
2. "SEARCH_PLACES": el usuario busca lugares interesantes, atractivos turísticos, miradores, plazas, parques o sitios para ver cerca de su posición.
   - Extrae en "searchQuery" el término o nombre concreto del lugar buscado (ej: "estadio", "parque", "museo", "mirador", "malecón", "playa").
3. "RETURN_TO_ACCOMMODATION": el usuario quiere regresar a su hotel, alojamiento o casa, y YA existe un hotel en el contexto O el usuario indicó el nombre/dirección de su hotel en el mensaje actual.
   - Extrae el nombre o dirección en "destinationAddress" si el usuario lo mencionó.
4. "REQUEST_ACCOMMODATION_LOCATION": el usuario dice que quiere volver a su hotel/alojamiento/casa, pero NO hay ningún hotel en el contexto y NO dio ningún nombre ni dirección.
   - Tu responseText DEBE preguntar con calidez y cercanía: "¡Claro que sí! Cuéntame, ¿en qué hotel o dirección te estás quedando para llevarte de inmediato?"
5. "SET_ACCOMMODATION": el usuario quiere cambiar, actualizar o registrar su hotel o alojamiento (ej: "cambié de hotel a [nombre]", "ahora me hospedo en [nombre]", "mi nuevo hotel es [nombre]", "actualiza mi alojamiento a [nombre]").
   - Extrae el nuevo nombre o dirección en "destinationAddress".
   - Tu responseText DEBE confirmar con entusiasmo: "¡Listo! Ya guardé tu alojamiento en [nombre]."
6. "DESCRIBE_CURRENT_POI": el usuario pide información, historia o curiosidades sobre la parada actual.
7. "CHANGE_DESTINATION": el usuario quiere cambiar de parada o ir a otro punto del recorrido.
   - Extrae en "destinationAddress" el nombre concreto del nuevo destino o lugar solicitado.
8. null: consulta informativa general (clima, tips, etc.).

RESPUESTA (responseText):
- En tu voz colombiana cálida, optimista y aventurera.
- Máximo 1 o 2 oraciones breves y contundentes (el viajero va caminando y necesita escuchar la respuesta con total agilidad).
Devuelve ÚNICAMENTE un JSON válido con este esquema:
{
  "isRelatedToTravel": boolean,
  "responseText": "string",
  "actionType": "SEARCH_RESTAURANTS" | "SEARCH_PLACES" | "RETURN_TO_ACCOMMODATION" | "REQUEST_ACCOMMODATION_LOCATION" | "SET_ACCOMMODATION" | "DESCRIBE_CURRENT_POI" | "CHANGE_DESTINATION" | null,
  "searchQuery": "string", // opcional, término o lugar específico para SEARCH_PLACES
  "destinationAddress": "string" // opcional, si el usuario dio una dirección o nombre de hotel explícito
}`

aiRouter.post('/chat/route-assistant', async (req, res, next) => {
  try {
    const { userQuery, latitude, longitude, tourContext } = routeAssistantSchema.parse(req.body)
    if (!hasActiveLlm()) {
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
      const payload = buildOpenAiPayload({
        messages: [
          { role: 'system', content: ROUTE_ASSISTANT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        reasoning_effort: 'low'
      })

      const response = await fetchOpenAiChatCompletion({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getActiveLlmKey()}`
        },
        body: JSON.stringify(payload)
      }, { attempts: 2, timeoutMs: 15000 })

      if (response && response.ok) {
        const json = await response.json()
        const content = json.choices?.[0]?.message?.content
        if (content) {
          aiResult = cleanAndParseJson(content, null)
        }
      } else if (response) {
        const errBody = await response.text().catch(() => '')
        console.warn(`[route-assistant] LLM HTTP ${response.status} error:`, errBody)
      }
    } catch (err) {
      console.warn('[route-assistant] LLM call error:', err.message)
    }

    if (!aiResult) {
      return res.json({
        isRelatedToTravel: true,
        responseText: 'No logré procesar tu solicitud con el asistente de voz. Por favor, intenta de nuevo.',
        actionType: null
      })
    }

    let nearbyPlaces = []
    let targetDestination = null

    let centerLat = latitude ?? tourContext?.hotelLat ?? tourContext?.latitude ?? null
    let centerLon = longitude ?? tourContext?.hotelLon ?? tourContext?.longitude ?? null

    if ((centerLat == null || centerLon == null) && (tourContext?.city || tourContext?.destination)) {
      const canonical = await resolveCanonicalDestination(tourContext.city || tourContext.destination).catch(() => null)
      if (canonical?.latitude && canonical?.longitude) {
        centerLat = canonical.latitude
        centerLon = canonical.longitude
      }
    }

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
      const cleanTerm = (aiResult.searchQuery || '').trim() ||
        userQuery.replace(/\b(busca|buscar|encuentra|d[oó]nde est[aá]|donde queda|mu[eé]strame|ver|lugares|atracciones|paradas)\b/gi, '').trim() ||
        'turismo'

      try {
        const photonSpots = await photonSearch(cleanTerm, 10, centerLat, centerLon)
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
          nearbyPlaces = await overpassAttractions(centerLat, centerLon, 3500)
        } catch (_) {}
      }

      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        try {
          const fallbackSpots = await photonSearch('parque plaza museo mirador', 8, centerLat, centerLon)
          if (fallbackSpots && fallbackSpots.length > 0) {
            nearbyPlaces = fallbackSpots.map(p => ({
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
              type: 'attraction'
            }))
          }
        } catch (_) {}
      }
    }

    // 3. Manejo de CHANGE_DESTINATION. The client needs a real coordinate,
    // not only a spoken confirmation, so resolve the requested place before
    // returning the structured action.
    if (aiResult.isRelatedToTravel && aiResult.actionType === 'CHANGE_DESTINATION') {
      const requestedDestination = String(aiResult.destinationAddress || '').trim() ||
        userQuery
          .replace(/^\s*(?:quiero|prefiero|mejor|cambia(?:r)?|ll[eé]vame|llevame|vamos|ir)\s+/i, '')
          .replace(/^\s*(?:el\s+)?(?:destino|parada|ruta)\s*(?:a|hacia|por)?\s*/i, '')
          .replace(/^\s*(?:a|hacia)\s+/i, '')
          .trim()

      if (!requestedDestination) {
        aiResult.actionType = null
        aiResult.responseText = '¿A qué lugar quieres cambiar el destino?'
      } else {
        const query = `${requestedDestination}, ${tourContext?.city || ''} ${tourContext?.country || ''}`.trim()
        const geo = await geocodePlace(query, centerLat, centerLon).catch(() => null)
        if (geo?.latitude != null && geo?.longitude != null) {
          targetDestination = {
            name: geo.name || requestedDestination,
            latitude: geo.latitude,
            longitude: geo.longitude,
            address: requestedDestination,
            type: 'attraction'
          }
        } else {
          aiResult.actionType = null
          aiResult.responseText = `No pude ubicar "${requestedDestination}". ¿Puedes decirme el nombre o la dirección con más detalle?`
        }
      }
    }

    // 4. Manejo de RETURN_TO_ACCOMMODATION / REQUEST_ACCOMMODATION_LOCATION / SET_ACCOMMODATION
    if (aiResult.isRelatedToTravel && (aiResult.actionType === 'RETURN_TO_ACCOMMODATION' || aiResult.actionType === 'REQUEST_ACCOMMODATION_LOCATION' || aiResult.actionType === 'SET_ACCOMMODATION')) {
      if (aiResult.actionType === 'SET_ACCOMMODATION') {
        const hotelNameOrAddr = (aiResult.destinationAddress || '').trim() ||
          userQuery.replace(/\b(cambi[eé]|cambiar|ahora|nuevo|hotel|alojamiento|hospedaje|me hospedo en|estoy en el hotel)\b/gi, '').trim()
        if (hotelNameOrAddr) {
          const query = `${hotelNameOrAddr}, ${tourContext?.city || ''} ${tourContext?.country || ''}`.trim()
          const geo = await geocodePlace(query, centerLat, centerLon).catch(() => null)
          if (geo?.latitude && geo?.longitude) {
            targetDestination = {
              name: geo.name || hotelNameOrAddr,
              latitude: geo.latitude,
              longitude: geo.longitude,
              address: hotelNameOrAddr,
              type: 'hotel'
            }
          } else {
            targetDestination = {
              name: hotelNameOrAddr,
              latitude: centerLat,
              longitude: centerLon,
              address: hotelNameOrAddr,
              type: 'hotel'
            }
          }
        }
      } else {
        const hasHotelInContext = Boolean(tourContext.hotelLat && tourContext.hotelLon) || Boolean(tourContext.hotelName && tourContext.hotelName.trim().length > 0)
        const hasAddressInQuery = Boolean(aiResult.destinationAddress && aiResult.destinationAddress.trim().length > 0)

        if (!hasHotelInContext && !hasAddressInQuery) {
          aiResult.actionType = 'REQUEST_ACCOMMODATION_LOCATION'
          targetDestination = null
          if (!aiResult.responseText || aiResult.responseText.length < 10) {
            aiResult.responseText = '¿En qué hotel o dirección te estás hospedando para guiarte hasta allá?'
          }
        } else {
          aiResult.actionType = 'RETURN_TO_ACCOMMODATION'
          if (aiResult.destinationAddress) {
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
            } else if (centerLat != null && centerLon != null) {
              targetDestination = {
                name: aiResult.destinationAddress,
                latitude: centerLat,
                longitude: centerLon,
                address: aiResult.destinationAddress,
                type: 'hotel'
              }
            }
          }
          if (!targetDestination && tourContext.hotelLat && tourContext.hotelLon) {
            targetDestination = {
              name: tourContext.hotelName || 'Alojamiento',
              latitude: tourContext.hotelLat,
              longitude: tourContext.hotelLon,
              address: tourContext.hotelAddress || '',
              type: 'hotel'
            }
          } else if (!targetDestination && tourContext.hotelName) {
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

// ─────────────────────────────────────────────────────────────
// Audio Transcription Endpoint (Groq Whisper / ElevenLabs Scribe / OpenAI Whisper)
// POST /api/ai/audio/transcribe
// ─────────────────────────────────────────────────────────────
aiRouter.post('/audio/transcribe', async (req, res, next) => {
  try {
    const groqKey = process.env.GROQ_API_KEY
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    const openAiKey = process.env.OPENAI_API_KEY

    const { audioBase64, format = 'm4a', prompt, language = 'es' } = req.body || {}
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 es requerido' })
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const filename = `recording.${format}`
    const mimeType = format === 'mp3' ? 'audio/mpeg' : (format === 'wav' ? 'audio/wav' : 'audio/m4a')
    const defaultPrompt = prompt || 'VibeTours Colombia: la Cordialidad, Murillo, Calle 30, Vía 40, Circunvalar, Gran Malecón, Simón Bolívar, Barranquilla, Bogotá, Medellín, Cartagena, Santa Marta, Cali, Bucaramanga, San Andrés, crea un tour, desde mi ubicación, ruta, viaje, itinerario, lugares emblemáticos, sitios turísticos, transporte, vehículo, carro, presupuesto, tour.'

    // 1. Prioridad: Groq Cloud Whisper Large v3 (100% Gratuito, ultra-preciso)
    if (groqKey) {
      try {
        const blob = new Blob([audioBuffer], { type: mimeType })
        const formData = new FormData()
        formData.append('file', blob, filename)
        formData.append('model', 'whisper-large-v3')
        if (language) formData.append('language', language)
        formData.append('temperature', '0.0')
        formData.append('prompt', defaultPrompt)

        const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`
          },
          body: formData
        })

        if (groqResponse.ok) {
          const data = await groqResponse.json()
          if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
            console.log('[Whisper] Transcripción exitosa con Groq:', data.text.trim())
            return res.json({ text: data.text.trim(), provider: 'groq' })
          }
        } else {
          console.warn('[Whisper] Groq error:', await groqResponse.text())
        }
      } catch (err) {
        console.warn('[Whisper] Groq request error:', err)
      }
    }

    // 2. Fallback: ElevenLabs Scribe STT
    if (elevenLabsKey) {
      try {
        const blob = new Blob([audioBuffer], { type: mimeType })
        const formData = new FormData()
        formData.append('file', blob, filename)
        formData.append('model_id', 'scribe_v1')
        formData.append('language_code', language || 'es')

        const elevenResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsKey
          },
          body: formData
        })

        if (elevenResponse.ok) {
          const data = await elevenResponse.json()
          if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
            console.log('[Whisper] Transcripción exitosa con ElevenLabs Scribe:', data.text.trim())
            return res.json({ text: data.text.trim(), provider: 'elevenlabs' })
          }
        } else {
          console.warn('[Whisper] ElevenLabs STT error:', await elevenResponse.text())
        }
      } catch (err) {
        console.warn('[Whisper] ElevenLabs request error:', err)
      }
    }

    // 3. Fallback: OpenAI Whisper
    if (openAiKey) {
      try {
        const blob = new Blob([audioBuffer], { type: mimeType })
        const formData = new FormData()
        formData.append('file', blob, filename)
        formData.append('model', 'whisper-1')
        if (language) formData.append('language', language)
        formData.append('prompt', defaultPrompt)

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`
          },
          body: formData
        })

        if (whisperResponse.ok) {
          const data = await whisperResponse.json()
          return res.json({ text: data.text.trim(), provider: 'openai' })
        } else {
          console.warn('[Whisper] OpenAI error:', await whisperResponse.text())
        }
      } catch (err) {
        console.warn('[Whisper] OpenAI request error:', err)
      }
    }

    return res.status(503).json({
      error: 'No hay proveedores de transcripción disponibles. Configura GROQ_API_KEY en el servidor.'
    })
  } catch (error) {
    console.error('[Whisper] Transcribe endpoint fatal error:', error)
    next(error)
  }
})

