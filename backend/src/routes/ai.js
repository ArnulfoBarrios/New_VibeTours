import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'

import { imageForPlace, imageForPlaceWithStatus } from '../services/imageSearch.js'
import { geocodePlace, overpassAttractions, photonSearch, overpassHotels, overpassNearbyCities, reverseGeocodeUserCountry, overpassNearbyFood } from '../services/osm.js'
import { planWithOpenAI, extractLocation, suggestFallbackPlacesWithOpenAI } from '../services/openai.js'
import { supabase } from '../services/supabase.js'

export const aiRouter = Router()

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
}, 3600000)

const requestSchema = z.object({
  destination: z.string().optional().default(''),
  country: z.string().optional().default(''),
  city: z.string().optional().default(''),
  durationHours: z.number().min(1).max(120).optional(),
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
  budget: z.string().optional()
})

aiRouter.post('/tours/confirm', async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
    if (input.city && input.city.trim().length > 0) {
      input.destination = input.city.trim()
    }
    const geocode = await geocodePlace(`${input.destination} ${input.city} ${input.country}`)
    res.json({
      detected: {
        city: input.city || geocode?.name?.split(',')[0] || input.destination,
        country: input.country || 'Detectado por Nominatim',
        type: input.type,
        durationHours: input.durationHours,
        center: geocode,
      },
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

    // Procesamiento en background
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
    if (input.latitude && input.longitude) {
      userCountry = await reverseGeocodeUserCountry(input.latitude, input.longitude)
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
    
    if (!input.destination) {
      const rawSuggestions = (extracted && Array.isArray(extracted.suggestions) && extracted.suggestions.length > 0)
        ? extracted.suggestions
        : [
            { city: "Santa Marta", country: "Colombia", reason: "Playas hermosas cerca del Parque Tayrona." },
            { city: "Cartagena", country: "Colombia", reason: "Ciudad histórica con hermosas playas caribeñas." },
            { city: "Medellín", country: "Colombia", reason: "La ciudad de la eterna primavera llena de cultura." }
          ]

      const suggestions = await Promise.all(
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

      return res.json({
        needsDestination: true,
        message: '¿A qué lugar te gustaría ir? Basado en lo que buscas, aquí tienes algunas recomendaciones:',
        suggestions
      })
    }
    
    if (!input.durationHours) {
      return res.json({
        needsDuration: true,
        message: '¿Cuánto tiempo te gustaría que dure tu viaje o recorrido?',
        suggestions: [
          { label: '4 horas', hours: 4 },
          { label: '1 día (8 horas)', hours: 8 },
          { label: '3 días', hours: 72 },
          { label: '5 días', hours: 120 }
        ]
      })
    }
    
    if (input.city && input.city.trim().length > 0) {
      input.destination = input.city.trim()
    }
    const location = await geocodePlace(`${input.destination} ${input.city} ${input.country}`)
    if (!location) {
      return res.status(400).json({ error: 'No pudimos identificar la ubicación ingresada.' })
    }
    const candidatePack = await collectTourCandidates(input, location)
    if (!candidatePack.places || candidatePack.places.length === 0) {
      return res.status(400).json({ error: 'No encontramos suficientes lugares de interés.' })
    }
    const planner = buildTourPlanner(input, location, candidatePack.places)
    
    // We send back the selected places as recommendations
    const recommendations = planner.selectedPlaces.map(place => ({
      id: place.placeId,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category,
      imageUrl: place.imageUrl || place.images?.[0] || '',
      description: place.description || place.history || '',
      reason: buildRecommendationReason(place, input.type),
      durationMinutes: place.minutes || 25,
      locationInfo: {
        nombre_lugar: place.name,
        direccion: place.address || '',
        ciudad: place.city || input.city || '',
        region: place.region || '',
        pais: place.country || input.country || '',
        place_id: place.placeId,
        url_mapa: mapUrlFor(place.latitude, place.longitude)
      }
    }))
    
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
    const location = await geocodePlace(`${input.destination} ${input.city} ${input.country}`, input.latitude, input.longitude)
    if (!location) {
      return res.status(400).json({ error: 'Ubicación no encontrada' })
    }
    const candidatePack = await collectTourCandidates(input, location)
    const planner = buildTourPlanner(input, location, candidatePack.places)
    
    const currentIds = new Set(currentPlaces.map(p => p.id || p.placeId))
    const exclusions = new Set(excludeIds)
    
    const sortedCandidates = candidatePack.places.sort((a, b) => (b.score || 0) - (a.score || 0))
    const alternatives = sortedCandidates
      .filter(place => !currentIds.has(place.placeId) && !exclusions.has(place.placeId))
      .slice(0, 5)
      .map(place => ({
        id: place.placeId,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
        imageUrl: place.imageUrl || place.images?.[0] || '',
        description: place.description || place.history || '',
        reason: 'Excelente alternativa que mantiene la coherencia de la ruta.',
        durationMinutes: place.minutes || 25,
        locationInfo: {
          nombre_lugar: place.name,
          direccion: place.address || '',
          ciudad: place.city || input.city || '',
          region: place.region || '',
          pais: place.country || input.country || '',
          place_id: place.placeId,
          url_mapa: mapUrlFor(place.latitude, place.longitude)
        }
      }))
      
    res.json({ alternatives })
  } catch (error) {
    next(error)
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
      hotels = [
        {
          id: 'fallback-hotel-1',
          name: 'Vibe Hotel & Suites',
          latitude: latitude + 0.002,
          longitude: longitude - 0.001,
          stars: '4',
          type: 'hotel',
          address: 'Avenida del Libertador, Centro'
        },
        {
          id: 'fallback-hotel-2',
          name: 'Hostal del Sol',
          latitude: latitude - 0.001,
          longitude: longitude + 0.003,
          stars: '3',
          type: 'hotel',
          address: 'Calle Turística Principal'
        },
        {
          id: 'fallback-hotel-3',
          name: 'Grand Horizon Resort',
          latitude: latitude + 0.0015,
          longitude: longitude + 0.0015,
          stars: '5',
          type: 'hotel',
          address: 'Frente a la Playa, Bahía'
        }
      ]
    }
    
    hotels.sort((a, b) => {
      const aStars = parseInt(a.stars || '0')
      const bStars = parseInt(b.stars || '0')
      return bStars - aStars
    })

    res.json({ hotels: hotels.slice(0, 5) })
  } catch (error) {
    next(error)
  }
})

async function processTourBuild(jobId, input, confirmedPlaces, plannerContext) {
  const updateJob = (updates) => {
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

    let ollama = null
    let ollamaError = null
    const shouldAskOllama = shouldUseOllama(input, planner)
    try {
      if (!shouldAskOllama) {
        console.info('[tour-ai] openai-skipped (build)')
      } else {
        ollama = await planWithOpenAI({
          ...input,
          places: planner.selectedPlaces,
          recommendedSchedule: planner.recommendedSchedule,
          timeProfile: planner.timeProfile,
          selectedHotel: plannerContext?.selectedHotel,
          sourceSummary: { location: null, candidateSource: 'user-confirmed', candidateCount: confirmedPlaces.length, selectedCount: confirmedPlaces.length },
        })
      }
    } catch (error) {
      ollamaError = error
    }

    let sourceTour
    let fallbackReason = null
    if (isValidTourPlan(ollama) && planner.selectedPlaces.length >= 2) {
      sourceTour = validateTourQuality(ollama, planner, input)
    } else {
      fallbackReason = 'ollama_unavailable'
      sourceTour = await buildFallbackTour(planner, input)
    }
    
    updateJob({ status: 'validating', message: 'Validando estructura y calidad del recorrido...' })
    
    // We reuse the assembly logic
    const stopsTarget = planner.selectedPlaces.length
    const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
    const stops = await Promise.all(
      Array.from({ length: stopsTarget }, (_, index) => {
        const sourceStop = Array.isArray(sourceTour.itinerario) ? sourceTour.itinerario[index] : null
        const anchorPlace = planner.selectedPlaces[index]
        const calculatedDay = Math.floor((index * totalDays) / stopsTarget) + 1
        return normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay)
      })
    )
    
    const publicStops = stops.map(s => s.publicStop)
    const routeStops = stops.map(s => s.routeStop)
    const coverUrl = await imageForPlace(input.city || input.destination, input.country || "").catch(() => fallbackCover(input.destination))
    
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
      mejor_epoca: sourceTour.mejor_epoca ?? planner.bestSeason,
      horario_recomendado: sourceTour.horario_recomendado ?? planner.recommendedSchedule,
      punto_encuentro: plannerContext?.selectedHotel 
        ? {
            nombre_lugar: plannerContext.selectedHotel.name,
            direccion: plannerContext.selectedHotel.tags?.['addr:street'] || plannerContext.selectedHotel.address || '',
            ciudad: input.city || '',
            region: '',
            pais: input.country || '',
            latitud: Number(plannerContext.selectedHotel.latitude),
            longitud: Number(plannerContext.selectedHotel.longitude),
            place_id: plannerContext.selectedHotel.id?.toString() || '',
            url_mapa: mapUrlFor(plannerContext.selectedHotel.latitude, plannerContext.selectedHotel.longitude)
          }
        : normalizeLocationInfo(sourceTour.punto_encuentro, publicStops[0], input),
      imagen_portada: coverUrl,
      galeria_tour: unique([...normalizeList(sourceTour.galeria_tour, []), ...publicStops.flatMap(s => s.imagenes)]).slice(0, 8),
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
  } catch (error) {
    console.error('[tour-ai] fatal process error (build)', error)
    updateJob({ status: 'failed', message: 'Error fatal durante la generación.', error: String(error) })
  }
}

async function processTourGeneration(jobId, input) {
  const updateJob = (updates) => {
    const job = tourJobs.get(jobId)
    if (job) Object.assign(job, updates)
  }

  try {
    console.info('[tour-ai] generate:start', { jobId, destination: input.destination, city: input.city, country: input.country, durationHours: input.durationHours, type: input.type })
    const location = await geocodePlace(`${input.destination} ${input.city} ${input.country}`)
    console.info('[tour-ai] geocode', location ? { name: location.name, latitude: location.latitude, longitude: location.longitude } : { ok: false })
    
    if (!location) {
      updateJob({ status: 'failed', message: 'No pudimos identificar la ubicación ingresada. Intenta con un nombre más específico o conocido.' })
      return
    }

    updateJob({ status: 'selecting_places', message: 'Seleccionando los mejores lugares turísticos...' })
    const candidatePack = await collectTourCandidates(input, location)
    console.info('[tour-ai] candidates', { raw: candidatePack.rawCount, normalized: candidatePack.places.length, source: candidatePack.source, selectedHint: candidatePack.places.slice(0, 5).map((place) => place.name) })
    
    if (!candidatePack.places || candidatePack.places.length === 0) {
      updateJob({ status: 'failed', message: 'No encontramos suficientes lugares de interés en este destino para generar un tour válido.' })
      return
    }

    const planner = buildTourPlanner(input, location, candidatePack.places)
    console.info('[tour-ai] planner', { selected: planner.selectedPlaces.length, stopTarget: planner.timeProfile.stopTarget, distanceKm: planner.distanceKm, schedule: planner.recommendedSchedule })

    updateJob({ status: 'generating_narrative', message: 'Creando narración única del tour con IA...' })

    let ollama = null
    let ollamaError = null
    const shouldAskOllama = shouldUseOllama(input, planner)
    try {
      if (!shouldAskOllama) {
        console.info('[tour-ai] openai-skipped', { reason: ollamaSkipReason(input, planner), durationHours: input.durationHours, selectedPlaces: planner.selectedPlaces.length })
      } else {
        ollama = await planWithOpenAI({
          ...input,
          places: planner.selectedPlaces,
          recommendedSchedule: planner.recommendedSchedule,
          timeProfile: planner.timeProfile,
          sourceSummary: { location: location ? { latitude: location.latitude, longitude: location.longitude } : null, candidateSource: candidatePack.source, candidateCount: candidatePack.rawCount, selectedCount: planner.selectedPlaces.length },
        })
      }
      console.info('[tour-ai] openai', { ok: true, skipped: !shouldAskOllama, hasItinerary: Array.isArray(ollama?.itinerario), itinerary: Array.isArray(ollama?.itinerario) ? ollama.itinerario.length : 0 })
    } catch (error) {
      ollamaError = error
      console.warn('[tour-ai] ollama', { ok: false, message: error?.message ?? String(error) })
    }

    let sourceTour
    let fallbackReason = null
    if (isValidTourPlan(ollama) && planner.selectedPlaces.length >= 3) {
      sourceTour = validateTourQuality(ollama, planner, input)
    } else {
      fallbackReason = !ollama
        ? 'ollama_unavailable'
        : !Array.isArray(ollama?.itinerario)
          ? 'ollama_missing_itinerary'
          : ollama.itinerario.length < 3
            ? 'ollama_too_few_stops'
            : planner.selectedPlaces.length < 3
              ? 'too_few_real_candidates'
              : 'unknown_fallback'
      sourceTour = await buildFallbackTour(planner, input)
    }
    console.info('[tour-ai] plan-source', { usedFallback: sourceTour.id?.toString?.()?.startsWith('ai-') ?? false, itinerary: Array.isArray(sourceTour.itinerario) ? sourceTour.itinerario.length : 0, fallbackReason, ollamaError: ollamaError ? (ollamaError.message ?? String(ollamaError)) : null })
    
    updateJob({ status: 'validating', message: 'Validando estructura y calidad del recorrido...' })
    
    let tour = null
    try {
      const plannedStops = Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length
        ? sourceTour.itinerario
        : sourceTour.stops ?? []
      const stopTarget = Math.min(30, Math.max(3, plannedStops.length, planner.selectedPlaces.length))
      const totalDays = Math.max(1, Math.ceil(input.durationHours / 24))
      const normalizedStops = await Promise.all(
        Array.from({ length: stopTarget }, (_, index) => {
          const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
          const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
          const calculatedDay = Math.floor((index * totalDays) / stopTarget) + 1
          return normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces, calculatedDay)
        }),
      )
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
        mejor_epoca: sourceTour.mejor_epoca ?? planner.bestSeason,
        horario_recomendado: sourceTour.horario_recomendado ?? planner.recommendedSchedule,
        punto_encuentro: normalizeLocationInfo(sourceTour.punto_encuentro, stops[0], input),
        imagen_portada: sourceTour.imagen_portada ?? sourceTour.coverUrl ?? coverUrl,
        galeria_tour: unique([
          ...(normalizeList(sourceTour.galeria_tour, [])),
          ...stops.flatMap((stop) => stop.imagenes),
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
    }
  } catch (error) {
    console.error('[tour-ai] fatal process error', error)
    updateJob({ status: 'failed', message: 'Error fatal durante la generación.', error: String(error) })
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

function buildTourPlanner(input, location, places) {
  const origin = location ? { latitude: location.latitude, longitude: location.longitude } : null
  const normalized = uniqueByName(
    places.map((place, index) => normalizeCandidate(place, index, input, origin)),
  ).filter((place) => place.name)
  const scored = normalized
    .map((place) => ({
      ...place,
      score: scorePlace(place, input),
    }))
    .sort((a, b) => b.score - a.score)
  const stopTarget = stopCountForDuration(input.durationHours)
  const selectedPlaces = selectPlaces(scored, stopTarget, input)
  if (selectedPlaces.length < Math.min(3, scored.length) && scored.length >= 3) {
    const expanded = scored.filter((place) => !selectedPlaces.some((picked) => normalizeKey(picked.name) === normalizeKey(place.name)))
    selectedPlaces.push(...expanded.slice(0, Math.max(0, Math.min(stopTarget, 3) - selectedPlaces.length)))
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
    bestSeason: bestSeasonFor(input.type),
    audience: audienceFor(input.type, input.touristInterests),
    subcategories: subcategoriesFor(input.type, selectedPlaces),
    accessibility: accessibilityFor(input.type),
    petsAllowed: input.type === 'ecological' || input.type === 'family',
    familyFriendly: input.type !== 'night',
    timeProfile: {
      durationHours: input.durationHours,
      stopTarget,
      pace: input.touristPace,
      hasProfile: Boolean(input.touristProfileSummary || input.touristInterests.length),
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
    score: 0,
  }
}

function scorePlace(place, input) {
  const distanceKm = place.distanceMeters / 1000
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

  return finalScore
}

function selectPlaces(scoredPlaces, targetCount, input) {
  const selected = []
  const seen = new Set()
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
  const summary = `${input.touristProfileSummary} ${input.touristInterests.join(' ')}`.toLowerCase()
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

function bestSeasonFor(type) {
  switch (type) {
    case 'ecological':
      return 'Temporada seca o clima estable'
    case 'night':
      return 'Todo el ano, preferiblemente fines de semana'
    case 'gastronomic':
      return 'Todo el ano'
    default:
      return 'Todo el ano'
  }
}

function audienceFor(type, interests) {
  const base = ['Viajeros curiosos', 'Parejas']
  if (type === 'family') return ['Familias', 'Viajeros curiosos', ...base]
  if (type === 'night') return ['Adultos', 'Parejas', 'Grupos de amigos']
  if (type === 'gastronomic') return ['Foodies', 'Parejas', 'Grupos de amigos']
  if (type === 'ecological') return ['Amantes de la naturaleza', 'Parejas', 'Viajeros activos']
  if (interests.length) return ['Viajeros curiosos', ...interests.slice(0, 3)]
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
  const place = planner.selectedPlaces[0]?.name ?? input.destination
  const labels = {
    historical: 'Historico',
    gastronomic: 'Sabores de',
    ecological: 'Ruta Verde',
    night: 'Nocturno',
    family: 'Familiar',
    cultural: 'Cultural',
    romantic: 'Romantico',
    sports: 'Activo',
    urban: 'Urbano',
    custom: 'Experiencia',
  }
  return `${labels[input.type] ?? 'Experiencia'} ${place}`.trim()
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

function buildRecommendationReason(place, type) {
  const category = place.category || 'place'
  const tags = place.rawTags || place.tags || {}
  const seed = place.name || ''
  
  if (tags.description) {
    return tags.description
  }

  let options = []
  if (category === 'museum') {
    options = [
      'Un espacio fascinante para sumergirse en la cultura local a través de sus piezas históricas y galerías.',
      'Un templo del saber y la memoria donde cada objeto narra un capítulo crucial del desarrollo local.',
      'Ideal para los amantes del arte y la historia que buscan una mirada profunda a las colecciones de la región.'
    ]
  } else if (category === 'historic' || tags.historic) {
    options = [
      'Una joya patrimonial que resguarda la memoria, arquitectura e identidad histórica del lugar.',
      'Un testimonio vivo del pasado que conserva intactos sus detalles constructivos y su valor simbólico.',
      'Un rincón cargado de leyendas y acontecimientos históricos que marcaron el devenir de la comunidad.'
    ]
  } else if (category === 'viewpoint' || tags.tourism === 'viewpoint') {
    options = [
      'Una parada obligatoria para capturar las vistas panorámicas más espectaculares y tomar fotografías increíbles.',
      'El balcón perfecto de la ciudad para contemplar el horizonte y entender su distribución geográfica.',
      'Un punto elevado estratégico que ofrece una perspectiva inigualable del paisaje circundante.'
    ]
  } else if (category === 'nature' || category === 'park' || tags.leisure === 'park') {
    options = [
      'Un rincón fresco y verde, ideal para caminar con tranquilidad y respirar el aire de la ciudad.',
      'Un pulmón urbano que regala un respiro de tranquilidad frente al bullicio cotidiano.',
      'Un remanso de paz perfecto para desconectar, caminar bajo la sombra de árboles centenarios y relajarse.'
    ]
  } else if (category === 'restaurant' || category === 'cafe' || tags.amenity === 'restaurant') {
    options = [
      'El punto perfecto para deleitarse con la cocina típica y los sabores locales de la región.',
      'Un rincón culinario de gran reputación donde la tradición y los ingredientes de calidad se encuentran.',
      'El lugar ideal para recargar energías disfrutando de recetas locales elaboradas con cariño y maestría.'
    ]
  } else if (category === 'religious' || tags.historic === 'church' || tags.historic === 'cathedral') {
    options = [
      'Un templo emblemático de gran valor espiritual, estético y arquitectónico para la comunidad.',
      'Un monumento sacro que destaca por su solemnidad, obras de arte sacro e imponentes fachadas.',
      'Un espacio de silencio y contemplación que refleja la fe, el arte y la historia constructiva de la región.'
    ]
  } else if (type === 'gastronomic') {
    options = [
      'Seleccionado especialmente por su ambiente gastronómico único y su oferta de sabores auténticos.',
      'Un punto de referencia para los amantes del buen comer, reconocido por su sazón tradicional.',
      'Una parada ideal para saborear bocados típicos que definen la identidad de esta tierra.'
    ]
  } else if (type === 'ecological') {
    options = [
      'Un entorno enriquecedor que te conecta directamente con la biodiversidad y el paisaje de la zona.',
      'Un sendero ideal para la contemplación ecológica y el aprecio por la conservación ambiental.',
      'Una inmersión verde que te permite admirar la flora y fauna características de este territorio.'
    ]
  } else if (type === 'cultural') {
    options = [
      'Un epicentro artístico o social ideal para comprender las expresiones cotidianas de los residentes.',
      'Un espacio donde la identidad local cobra vida a través de eventos, arte urbano o interacciones.',
      'Una parada perfecta para descifrar las costumbres locales y el espíritu comunitario de este sector.'
    ]
  } else {
    options = [
      'Un sitio de gran relevancia local seleccionado para complementar la temática del recorrido.',
      'Ideal para comprender el estilo de vida de la zona y tomar fotos espectaculares de la arquitectura.',
      'Una parada estratégica que aporta variedad visual y dinamismo al itinerario.',
      'Un punto de interés bien valorado que añade un matiz de historia y autenticidad al recorrido.',
      'Una localización singular que ilustra de manera perfecta la cotidianidad y el color local del destino.'
    ]
  }
  return selectDeterministic(options, seed)
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

function shouldUseOllama(input, planner) {
  if (process.env.DISABLE_OLLAMA === 'true') return false
  if (input.durationHours > 168) return false
  if (planner.selectedPlaces.length > 30) return false
  return true
}

function ollamaSkipReason(input, planner) {
  if (process.env.DISABLE_OLLAMA === 'true') return 'disabled_by_env'
  if (input.durationHours > 168) return 'long_tour_uses_deterministic_planner'
  if (planner.selectedPlaces.length > 30) return 'too_many_places_for_local_model'
  return 'not_skipped'
}

function isValidTourPlan(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.itinerario) && value.itinerario.length >= 3)
}

function validateTourQuality(tour, planner, input) {
  if (!tour || !Array.isArray(tour.itinerario)) return tour

  // Verificar frases genéricas prohibidas y descripciones cortas
  const forbiddenPhrases = [
    'en esta parada', 'aqui puedes', 'ahora llegamos', 
    'continuamos nuestro', 'el proximo destino', 'llegamos a'
  ]

  tour.itinerario = tour.itinerario.map((stop, index) => {
    let description = stop.descripcion || ''
    let isBadQuality = false

    // Solo considerar baja calidad si está vacía o tiene menos de 15 palabras
    if (!description || description.trim().split(/\s+/).length < 15) {
      isBadQuality = true
    }

    const lowerDesc = description.toLowerCase()
    for (const phrase of forbiddenPhrases) {
      if (lowerDesc.includes(phrase)) {
        // Remover la frase si es posible
        description = description.replace(new RegExp(phrase, 'gi'), '')
      }
    }

    if (isBadQuality) {
      // Reemplazar descripción con fallback dinámico específico si Ollama/OpenAI falló
      const fallbackPlace = planner.selectedPlaces[index] || planner.selectedPlaces[0]
      if (fallbackPlace) {
        stop.descripcion = buildStopDescription(fallbackPlace, input)
      }
    } else {
      stop.descripcion = description.trim()
    }

    return stop
  })

  // Detectar paradas repetidas consecutivas
  tour.itinerario = tour.itinerario.filter((stop, index, arr) => {
    if (index === 0) return true
    const prev = arr[index - 1]
    return normalizeKey(stop.nombre) !== normalizeKey(prev.nombre)
  })

  return tour
}

async function normalizeStop(stop, index, input, anchorPlace = null, candidatePlaces = [], calculatedDay = null) {
  const source = stop && typeof stop === 'object' ? stop : {}
  const ubicacion = source.ubicacion ?? source.locationInfo ?? {}
  const sourceName = [source.nombre, source.name, ubicacion.nombre_lugar]
      .map((value) => value == null ? "" : value.toString().trim())
      .find((value) => value.length > 0) ?? `${input.destination} parada ${index + 1}`
  const matchedPlace = findCandidatePlace(sourceName, candidatePlaces, anchorPlace)
  const fallbackPlace = matchedPlace ?? anchorPlace ?? null
  const coordinates = await resolveStopCoordinates({
    source,
    input,
    name: sourceName,
    fallbackPlace,
  })
  const resolvedName = fallbackPlace?.name ?? sourceName
  const description = source.descripcion ?? source.description ?? `${resolvedName} es una parada relevante dentro de la ruta.`
  
  let durationText = source.duracion_estimada ?? `${source.suggestedMinutes ?? 25} minutos`
  const minutes = minutesFromLabel(durationText)
  // Evitar tiempos absurdos de 1-2 minutos en paradas que merecen más tiempo
  if (minutes < 15) {
    const fallbackMins = fallbackPlace?.minutes ?? source.suggestedMinutes ?? 25
    durationText = `${fallbackMins} minutos`
  }

  const images = normalizeList(source.imagenes ?? source.images, [])
  const cityFallback = input.city ? `${input.city}, ${input.country || ''}`.trim().replace(/,\s*$/, '') : input.destination
  
  // Obtener la categoría dinámicamente usando el nombre y propiedades del objeto AI (source)
  const rawCategory = source.categoria || source.category || source.type || fallbackPlace?.category || fallbackPlace?.type || ''
  const placeCategory = normalizeCategory({
    category: rawCategory,
    name: resolvedName,
    tags: source.etiquetas || source.tags || []
  })
  
  // Pasar 'index' como semilla para evitar imágenes idénticas en paradas de la misma categoría
  const imageStatus = await imageForPlaceWithStatus(resolvedName, cityFallback, placeCategory, index).catch(() => ({ url: "", isFallback: true }))
  const image = images[0] ?? source.imageUrl ?? imageStatus.url
  const publicStop = {
    parada: index + 1,
    dia: calculatedDay !== null ? calculatedDay : Number(source.dia ?? 1),
    nombre: resolvedName,
    isFallbackImage: imageStatus.isFallback && !images[0] && !source.imageUrl,
    descripcion: description,
    duracion_estimada: durationText,
    actividades: normalizeList(source.actividades ?? source.activities, ["Explorar", "Fotografiar"]),
    datos_curiosos: normalizeList(source.datos_curiosos, [`${resolvedName} fue seleccionado por su relevancia local.`]),
    consejos: normalizeList(source.consejos ?? source.tips, ["Confirma horarios locales antes de llegar"]),
    ubicacion: {
      nombre_lugar: fallbackPlace?.name ?? ubicacion.nombre_lugar ?? resolvedName,
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

function uniqueByName(values) {
  const seen = new Set()
  return values.filter((value) => {
    const key = normalizeKey(value.name)
    if (seen.has(key)) return false
    seen.add(key)
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
  if (typeof value === 'number') return Math.round(value)
  const text = String(value ?? '').toLowerCase()
  const match = text.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return 25
  const parsed = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(parsed)) return 25
  return text.includes('hora') ? Math.round(parsed * 60) : Math.round(parsed)
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

export async function collectTourCandidates(input, location) {
  const city = location?.city || input.city || ''
  const country = location?.country || input.country || ''
  const query = `${input.destination} ${city} ${country}`.trim()
  const photonPlaces = await photonSearch(query, 30)

  // Check if it is a regional or nature-oriented tour
  const isRegionalOrNature = 
    input.type === 'ecological' || 
    input.type === 'sports' || 
    (input.durationHours && input.durationHours >= 12) ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.prompt || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.destination || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(city);

  const radiusPrimary = isRegionalOrNature ? 15000 : 4500
  const radiusWide = isRegionalOrNature ? 45000 : 9000

  const overpassPrimary = location ? await overpassAttractions(location.latitude, location.longitude, radiusPrimary) : []
  const overpassWide = location ? await overpassAttractions(location.latitude, location.longitude, radiusWide) : []
  const pool = [...overpassPrimary, ...overpassWide, ...photonPlaces]
  const normalizedPool = uniqueByName(pool)
    .filter((place) => place && place.name)
    .filter((place) => hasUsableCoordinates(place.latitude, place.longitude) || place.city || place.country)
    .filter((place) => isCandidateNearDestination(place, input, location))
    .filter((place) => isValidTouristAttraction(place, input))

  let selected = normalizedPool
  let source = normalizedPool.length >= 3 
    ? (location ? 'overpass+photon' : 'photon') 
    : 'synthetic-fallback'

  if (normalizedPool.length < 3) {
    console.info('[tour-ai] Lack of geodata candidates. Fetching real suggestions from OpenAI...', { destination: input.destination, city, country })
    const aiFallbacks = await suggestFallbackPlacesWithOpenAI({
      destination: input.destination,
      city,
      country,
      type: input.type
    })

    if (aiFallbacks && aiFallbacks.length >= 3) {
      const centerLat = location?.latitude ?? 0
      const centerLon = location?.longitude ?? 0
      const baseName = input.city || input.destination || 'Destino'
      
      selected = aiFallbacks.map((item, index) => {
        // Small offsets around city center to prevent overlapping prior to geocoding
        const latOffset = index === 0 ? 0.001 : (index === 1 ? -0.001 : 0.0015)
        const lonOffset = index === 0 ? 0 : (index === 1 ? 0.001 : -0.001)
        return {
          name: item.name,
          latitude: centerLat + latOffset,
          longitude: centerLon + lonOffset,
          type: item.type || 'tourism',
          category: item.category || input.type || 'historic',
          city: input.city,
          country: input.country,
          address: `${baseName}, ${item.name}`,
          description: item.description || '',
          tags: { ai_generated_fallback: 'true' }
        }
      })
      source = 'ai-suggested-fallback'
      console.info('[tour-ai] Successfully loaded AI-suggested POIs:', selected.map(p => p.name))
    } else {
      console.warn('[tour-ai] Failed to get fallback places from AI. Using synthetic fallbacks.')
      selected = buildSyntheticFallbackPlaces(input, location)
    }
  }

  return { rawCount: pool.length, places: selected, source }
}

function isValidTouristAttraction(place, input) {
  if (!place || !place.name) return false
  
  const name = place.name.trim()
  const nameKey = normalizeKey(name)
  const cityKey = normalizeKey(input.city)
  const destKey = normalizeKey(input.destination)
  const countryKey = normalizeKey(input.country)
  
  // 1. Excluir si el nombre es exactamente el de la ciudad, destino o país
  if (nameKey === cityKey || nameKey === destKey || nameKey === countryKey) return false
  
  // 2. Excluir nombres genéricos que no representan una atracción única
  const genericNames = new Set([
    'restaurante', 'restaurant', 'cafe', 'bar', 'hotel', 'hostal', 'plaza', 'parque', 'museum', 'museo',
    'iglesia', 'church', 'playa', 'beach', 'mirador', 'viewpoint', 'aeropuerto', 'airport',
    'estacion', 'station', 'supermercado', 'supermarket', 'centro', 'mall', 'tienda', 'shop',
    'tourism', 'attraction', 'turismo', 'atraccion'
  ])
  if (genericNames.has(nameKey)) return false
  
  // 3. Excluir combinaciones genéricas de "centro"
  if (nameKey === `centro-de-${cityKey}` || nameKey === `centro-${cityKey}` || nameKey === `${cityKey}-centro`) return false
  
  // 4. Excluir límites administrativos, distritos o barrios
  const osmKey = place.tags?.osm_key || ''
  const osmVal = place.tags?.osm_value || place.type || ''
  if (osmKey === 'boundary' || osmKey === 'place' && ['city', 'town', 'village', 'suburb', 'neighbourhood', 'state', 'country', 'continent', 'locality', 'isolated_dwelling'].includes(osmVal)) {
    return false
  }
  if (osmVal === 'administrative') return false
  
  return true
}

function isCandidateNearDestination(place, input, location) {
  if (!location) return true
  const latitude = numberValue(place.latitude, NaN)
  const longitude = numberValue(place.longitude, NaN)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
  if (!hasCoordinates) return false
  const distanceKm = haversineMeters(location.latitude, location.longitude, latitude, longitude) / 1000

  // Detect if the tour is regional or nature-oriented to allow a wider radius filter
  const isRegionalOrNature = 
    input.type === 'ecological' || 
    input.type === 'sports' || 
    (input.durationHours && input.durationHours >= 12) ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.prompt || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.destination || '') ||
    /regional|naturaleza|alrededores|excursión|excursion|field|nature|beach|playa|isla|island|ecoturismo|senderismo|trekking/i.test(input.city || '');

  const maxDistance = isRegionalOrNature ? 50 : 45
  if (distanceKm > maxDistance) return false

  // If it's far from the center (>12 km), only allow nature, coastal, islands, viewpoints or beaches
  if (distanceKm > 12) {
    const category = String(place.category || '').toLowerCase()
    const type = String(place.type || '').toLowerCase()
    const name = String(place.name || '').toLowerCase()
    
    const isEcoOrCoastal = 
      ['nature', 'viewpoint'].includes(category) || 
      ['beach', 'water', 'island', 'national_park', 'nature_reserve', 'park', 'forest', 'sea'].includes(type) ||
      /playa|beach|isla|island|cayo|archipielago|archipiélago|bahia|bahía|ciénaga|cienaga|reserva|parque|mirador|viewpoint|punta|faro|cabo|morrosquillo|san-bernardo|mucura|múcura|tintipan|tintipán|palma|boqueron|boquerón|isleta|coveñas/i.test(name) ||
      (place.tags && (place.tags.natural || place.tags.water || place.tags.place === 'island' || place.tags.boundary === 'national_park'))
      
    if (!isEcoOrCoastal) {
      return false
    }
  }

  return true
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

async function resolveStopCoordinates({ source, input, name, fallbackPlace }) {
  const sourceLatitude = numberValue(source.latitude ?? source.ubicacion?.latitud, NaN)
  const sourceLongitude = numberValue(source.longitude ?? source.ubicacion?.longitud, NaN)
  if (hasUsableCoordinates(sourceLatitude, sourceLongitude)) {
    return {
      latitude: sourceLatitude,
      longitude: sourceLongitude,
    }
  }

  if (hasUsableCoordinates(fallbackPlace?.latitude, fallbackPlace?.longitude)) {
    return {
      latitude: fallbackPlace.latitude,
      longitude: fallbackPlace.longitude,
    }
  }

  const geocoded = await geocodePlace(`${name} ${input.city} ${input.country}`.trim(), input.latitude, input.longitude)
  if (geocoded && hasUsableCoordinates(geocoded.latitude, geocoded.longitude)) {
    return {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    }
  }

  return {
    latitude: fallbackPlace?.latitude ?? sourceLatitude ?? 0,
    longitude: fallbackPlace?.longitude ?? sourceLongitude ?? 0,
  }
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
      const stops = tour.itinerario.map((stop, index) => {
        const routeStop = route.stops[index] ?? {}
        return {
          tour_id: data.id,
          position: index + 1,
          name: stop.nombre,
          latitude: routeStop.latitude ?? 0,
          longitude: routeStop.longitude ?? 0,
          image_url: stop.imagenes[0],
          description: stop.descripcion,
          activities: stop.actividades,
          tips: stop.consejos,
          curious_facts: stop.datos_curiosos,
          location_info: stop.ubicacion,
          images: stop.imagenes,
          suggested_minutes: minutesFromLabel(stop.duracion_estimada),
          stop_order: index,
          is_fallback_image: stop.isFallbackImage || false,
        }
      })
      const { error: stopError } = await supabase.from('tour_stops').insert(stops)
      if (stopError) throw stopError
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
    country: z.string().optional().default('')
  }).optional().default({})
})

const ROUTE_ASSISTANT_SYSTEM_PROMPT = `Eres VibeTours Voice, un asistente de voz especializado EXCLUSIVAMENTE en ayudar a turistas durante un recorrido turístico activo. Tu única función es responder preguntas relacionadas con el viaje, el turismo, el destino actual, restaurantes, puntos de interés y navegación.

CLASIFICACIÓN OBLIGATORIA:
- Si la pregunta es sobre viajes, turismo, gastronomía, puntos de interés, navegación, clima, moneda local, idioma, historia del lugar, cultura, transporte, hoteles o cualquier tema relacionado al destino turístico → isRelatedToTravel: true.
- Si la pregunta es sobre matemáticas, programación, medicina, política, entretenimiento no relacionado al viaje, o cualquier tema ajeno al turismo → isRelatedToTravel: false.

ACCIÓNES DISPONIBLES (actionType):
- "SEARCH_RESTAURANTS": el usuario pregunta por comida, restaurantes, cafés, bares o lugares para comer.
- "RETURN_TO_ACCOMMODATION": el usuario quiere regresar al hotel o alojamiento.
- "DESCRIBE_CURRENT_POI": el usuario pide información, historia o curiosidades sobre el punto de interés actual.
- "CHANGE_DESTINATION": el usuario quiere cambiar de parada o ir a otro lugar del tour.
- null: la acción es solo informativa (clima, moneda, tips, etc.) o la consulta no es válida.

RESPUESTA: Siempre en español colombiano, amigable, conciso (máximo 2 oraciones). Si isRelatedToTravel es false, rechaza educadamente sin revelar detalles técnicos. CRÍTICO: Si la acción es "SEARCH_RESTAURANTS", indica en tu respuesta de voz que vas a buscar comida en su ubicación actual o zona actual (no menciones la siguiente parada, ya que la búsqueda se realiza alrededor de la posición del usuario).

Devuelve ÚNICAMENTE un objeto JSON válido con este esquema exacto:
{
  "isRelatedToTravel": boolean,
  "responseText": "string",
  "actionType": "SEARCH_RESTAURANTS" | "RETURN_TO_ACCOMMODATION" | "DESCRIBE_CURRENT_POI" | "CHANGE_DESTINATION" | null
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
      latitude != null ? `Coordenadas del usuario: ${latitude}, ${longitude}` : ''
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
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: ROUTE_ASSISTANT_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.4
        }),
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

    // If SEARCH_RESTAURANTS and we have coordinates, enrich the response with real places
    let nearbyFood = []
    if (
      aiResult.isRelatedToTravel &&
      aiResult.actionType === 'SEARCH_RESTAURANTS' &&
      latitude != null &&
      longitude != null
    ) {
      nearbyFood = await overpassNearbyFood(latitude, longitude, 1000)
    }

    return res.json({
      isRelatedToTravel: aiResult.isRelatedToTravel,
      responseText: aiResult.responseText,
      actionType: aiResult.actionType ?? null,
      nearbyPlaces: nearbyFood.length > 0 ? nearbyFood : undefined
    })
  } catch (error) {
    next(error)
  }
})
