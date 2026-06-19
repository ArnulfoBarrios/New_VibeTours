import { Router } from 'express'
import { z } from 'zod'

import { imageForPlace } from '../services/imageSearch.js'
import { geocodePlace, overpassAttractions, photonSearch } from '../services/osm.js'
import { planWithOllama } from '../services/ollama.js'
import { supabase } from '../services/supabase.js'

export const aiRouter = Router()

const requestSchema = z.object({
  destination: z.string().min(1),
  country: z.string().optional().default(''),
  city: z.string().optional().default(''),
  durationHours: z.number().min(1).max(72).default(4),
  type: z.string().optional().default('cultural'),
  language: z.string().optional().default('es'),
  prompt: z.string().optional().default(''),
  touristProfileSummary: z.string().optional().default(''),
  touristInterests: z.array(z.string()).optional().default([]),
  touristPace: z.string().optional().default('balanced'),
  persist: z.boolean().optional().default(false),
  userId: z.string().uuid().optional(),
})

aiRouter.post('/tours/confirm', async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
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
    console.info('[tour-ai] generate:start', { destination: input.destination, city: input.city, country: input.country, durationHours: input.durationHours, type: input.type })
    const location = await geocodePlace(`${input.destination} ${input.city} ${input.country}`)
    console.info('[tour-ai] geocode', location ? { name: location.name, latitude: location.latitude, longitude: location.longitude } : { ok: false })
    const candidatePack = await collectTourCandidates(input, location)
    console.info('[tour-ai] candidates', { raw: candidatePack.rawCount, normalized: candidatePack.places.length, source: candidatePack.source, selectedHint: candidatePack.places.slice(0, 5).map((place) => place.name) })
    const planner = buildTourPlanner(input, location, candidatePack.places)
    console.info('[tour-ai] planner', { selected: planner.selectedPlaces.length, stopTarget: planner.timeProfile.stopTarget, distanceKm: planner.distanceKm, schedule: planner.recommendedSchedule })

    let ollama = null
    let ollamaError = null
    try {
      ollama = await planWithOllama({
        ...input,
        places: planner.selectedPlaces,
        recommendedSchedule: planner.recommendedSchedule,
        timeProfile: planner.timeProfile,
        sourceSummary: { location: location ? { latitude: location.latitude, longitude: location.longitude } : null, candidateSource: candidatePack.source, candidateCount: candidatePack.rawCount, selectedCount: planner.selectedPlaces.length },
      })
      console.info('[tour-ai] ollama', { ok: true, hasItinerary: Array.isArray(ollama?.itinerario), itinerary: Array.isArray(ollama?.itinerario) ? ollama.itinerario.length : 0 })
    } catch (error) {
      ollamaError = error
      console.warn('[tour-ai] ollama', { ok: false, message: error?.message ?? String(error) })
    }

    let sourceTour
    let fallbackReason = null
    if (isValidTourPlan(ollama) && planner.selectedPlaces.length >= 3) {
      sourceTour = ollama
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
    let tour = null
    try {
      const plannedStops = Array.isArray(sourceTour.itinerario) && sourceTour.itinerario.length
        ? sourceTour.itinerario
        : sourceTour.stops ?? []
      const stopTarget = Math.min(8, Math.max(3, plannedStops.length, planner.selectedPlaces.length))
      const normalizedStops = await Promise.all(
        Array.from({ length: stopTarget }, (_, index) => {
          const sourceStop = plannedStops[index] ?? plannedStops[plannedStops.length - 1] ?? null
          const anchorPlace = planner.selectedPlaces[index] ?? planner.selectedPlaces[planner.selectedPlaces.length - 1] ?? null
          return normalizeStop(sourceStop, index, input, anchorPlace, planner.selectedPlaces)
        }),
      )
      const stops = normalizedStops.map((stop) => stop.publicStop)
      const routeStops = normalizedStops.map((stop) => stop.routeStop)
      const coverUrl = stops[0]?.imagenes?.[0] ?? fallbackCover(input.destination)
      tour = {
        id: sourceTour.id?.toString() ?? crypto.randomUUID(),
        nombre_tour: sourceTour.nombre_tour ?? sourceTour.title ?? `${input.city || input.destination} VibeTour AI`,
        resumen_corto:
          sourceTour.resumen_corto ??
          'Experiencia creada para descubrir con una ruta logica, tiempos realistas y paradas variadas.',
        tipo_tour: sourceTour.tipo_tour ?? input.type,
        subcategorias: normalizeList(sourceTour.subcategorias, [typeLabel(input.type)]),
        descripcion_tour:
          sourceTour.descripcion_tour ??
          sourceTour.description ??
          'Ruta creada por VIBETOURS AI con lugares reales, tiempos sugeridos y orden logico.',
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
      res.json({ tour, route })
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
      res.json({ tour: emergencyTour, route: emergencyRoute })
    }
  } catch (error) {
    next(error)
  }
})

function buildEmergencyTour(input, planner, fallbackReason = 'unknown') {
  const city = input.city || input.destination || 'Destino'
  const country = input.country || 'Global'
  const templates = typeFallbackLabels(input.type, city)
  const stops = templates.map((label, index) => ({
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
    subcategorias: planner.subcategories,
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
  const itinerary = planner.selectedPlaces.map((place, index) => ({
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
    subcategorias: planner.subcategories,
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
  const typeScore = typeAffinityScore(input.type, place.category, place.name)
  const popularityScore = popularityScoreFor(place)
  const proximityScore = proximityScoreFor(distanceKm)
  const diversityScore = diversityBoostFor(input.type, place.category, place.name)
  const profileScore = profileScoreFor(input, place)
  return (typeScore * 5) + (popularityScore * 4) + (proximityScore * 3) + (diversityScore * 3) + (profileScore * 4)
}

function selectPlaces(scoredPlaces, targetCount, input) {
  const selected = []
  const seen = new Set()
  const minCount = Math.min(3, scoredPlaces.length)
  while (selected.length < targetCount && seen.size < scoredPlaces.length) {
    let best = null
    let bestScore = -Infinity
    for (const candidate of scoredPlaces) {
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
    if (selected.length >= minCount && selected.length >= targetCount) break
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

  if (sameCategory) score -= 30
  if (sameGroup) score -= 14
  if (distanceFromLastKm < 0.7) score += 14
  else if (distanceFromLastKm < 1.8) score += 8
  else if (distanceFromLastKm > 6) score -= 12

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
  if (durationHours <= 8) return 5
  return 6
}

function normalizeCategory(place) {
  const category = String(place.category ?? place.type ?? '').toLowerCase()
  const name = String(place.name ?? '').toLowerCase()
  const tags = normalizeTags(place.tags)
  const merged = `${category} ${name} ${tags.join(' ')}`
  if (/(museum|gallery|arts? centre|art)/.test(merged)) return 'museum'
  if (/(historic|monument|memorial|ruins|castle|archaeological|heritage)/.test(merged)) return 'historic'
  if (/(restaurant|cafe|coffee|market|food|bar|pub|nightclub|bistro|bakery)/.test(merged)) return merged.includes('nightclub') || merged.includes('bar') ? 'nightlife' : merged.includes('market') ? 'market' : merged.includes('cafe') || merged.includes('coffee') ? 'cafe' : 'restaurant'
  if (/(park|garden|reserve|nature|trail|forest|beach|viewpoint)/.test(merged)) return merged.includes('viewpoint') ? 'viewpoint' : merged.includes('trail') ? 'trail' : 'nature'
  if (/(zoo|aquarium|playground|family|children)/.test(merged)) return 'family'
  if (/(church|cathedral|mosque|temple)/.test(merged)) return 'religious'
  return category || 'place'
}

function groupForCategory(category, type) {
  if (['museum', 'historic', 'religious'].includes(category)) return 'heritage'
  if (['restaurant', 'cafe', 'market'].includes(category)) return 'food'
  if (['nature', 'viewpoint', 'trail'].includes(category)) return 'nature'
  if (['nightlife'].includes(category)) return 'night'
  if (['family'].includes(category)) return 'family'
  if (type === 'night') return 'night'
  if (type === 'gastronomic') return 'food'
  if (type === 'ecological') return 'nature'
  if (type === 'historical') return 'heritage'
  return 'urban'
}

function typeAffinityScore(type, category, name) {
  const text = `${category} ${name}`.toLowerCase()
  const rules = {
    historical: ['museum', 'historic', 'religious', 'heritage', 'monument', 'memorial'],
    gastronomic: ['restaurant', 'cafe', 'market', 'food', 'bakery', 'bar'],
    ecological: ['nature', 'park', 'trail', 'viewpoint', 'forest', 'beach', 'reserve'],
    night: ['nightlife', 'bar', 'pub', 'nightclub', 'event', 'theatre'],
    family: ['family', 'park', 'museum', 'zoo', 'aquarium', 'playground'],
    cultural: ['museum', 'historic', 'gallery', 'theatre', 'monument'],
    urban: ['historic', 'museum', 'viewpoint', 'market', 'square'],
    romantic: ['viewpoint', 'cafe', 'park', 'beach', 'garden'],
    sports: ['trail', 'park', 'stadium', 'arena', 'beach', 'viewpoint'],
    custom: ['museum', 'historic', 'market', 'park', 'viewpoint'],
  }
  return scoreFromTerms(text, rules[type] ?? rules.custom, 10)
}

function popularityScoreFor(place) {
  const text = `${place.category} ${place.name}`.toLowerCase()
  let score = 3
  if (text.includes('museum')) score += 4
  if (text.includes('historic') || text.includes('heritage')) score += 4
  if (text.includes('monument') || text.includes('memorial')) score += 3
  if (text.includes('market')) score += 3
  if (text.includes('park') || text.includes('viewpoint')) score += 2
  if (text.includes('restaurant') || text.includes('cafe')) score += 2
  if (text.includes('nightclub') || text.includes('bar')) score += 2
  return clamp(score, 1, 10)
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
  const mode = {
    historical: 'centros historicos, museos y monumentos',
    gastronomic: 'mercados, restaurantes y cafeterias emblematicas',
    ecological: 'parques, reservas y miradores naturales',
    night: 'bares, eventos y escenas nocturnas',
    family: 'espacios educativos, recreativos y aptos para menores',
    cultural: 'museos, galerias y espacios patrimoniales',
  }[input.type] ?? 'paradas autenticas y variadas'
  return `Experiencia ${typeLabel(input.type).toLowerCase()} pensada para ${input.durationHours} horas, con foco en ${mode} y una secuencia logica que reduce traslados innecesarios.`
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

function buildStopDescription(place, input) {
  const intro = {
    historical: 'Parada clave para comprender la historia local y la arquitectura del entorno.',
    gastronomic: 'Parada pensada para probar sabores representativos y entender la escena culinaria.',
    ecological: 'Parada ideal para conectar con el paisaje y caminar con calma.',
    night: 'Parada con energia nocturna y ambiente social activo.',
    family: 'Parada segura y dinamica, ideal para aprender y disfrutar en grupo.',
  }[input.type] ?? 'Parada relevante dentro de la ruta.'
  return `${place.name} es ${intro} Su ubicacion cerca de otros puntos afines ayuda a mantener un recorrido fluido y equilibrado.`
}

function buildActivities(place, type) {
  const byType = {
    historical: ['Recorrer', 'Escuchar narrativa historica', 'Fotografiar detalles arquitectonicos'],
    gastronomic: ['Degustar especialidades locales', 'Comparar sabores', 'Conversar con comerciantes'],
    ecological: ['Caminar', 'Observar fauna o flora', 'Tomar descansos breves'],
    night: ['Explorar ambiente nocturno', 'Tomar algo', 'Disfrutar musica o evento'],
    family: ['Participar en actividades educativas', 'Jugar', 'Tomar fotos en grupo'],
  }
  return byType[type] ?? ['Explorar', 'Fotografiar', 'Aprender del lugar']
}

function buildCuriousFacts(place, type) {
  return unique([
    `${place.name} fue incluido por su relevancia ${typeLabel(type).toLowerCase()} y su cercania al eje principal de la ruta.`,
    `La secuencia de paradas busca equilibrar iconos conocidos con experiencias complementarias.`,
  ]).slice(0, 3)
}

function buildTips(place, type) {
  const tips = {
    night: ['Confirma horarios y politica de acceso', 'Mantente en zonas bien iluminadas'],
    ecological: ['Lleva agua y calzado comodo', 'Revisa el clima antes de salir'],
    gastronomic: ['Reserva si es un local popular', 'Pregunta por platos de temporada'],
    family: ['Verifica instalaciones y servicios', 'Planifica pausas cortas para menores'],
  }
  return tips[type] ?? ['Revisa horarios de apertura', 'Llega unos minutos antes', 'Lleva bateria suficiente']
}

function isValidTourPlan(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.itinerario) && value.itinerario.length >= 3)
}

async function normalizeStop(stop, index, input, anchorPlace = null, candidatePlaces = []) {
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
  const durationText = source.duracion_estimada ?? `${source.suggestedMinutes ?? 25} minutos`
  const images = normalizeList(source.imagenes ?? source.images, [])
  const image = images[0] ?? source.imageUrl ?? await imageForPlace(resolvedName, input.city || input.destination).catch(() => "")
  const publicStop = {
    parada: index + 1,
    nombre: resolvedName,
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

async function collectTourCandidates(input, location) {
  const query = `${input.destination} ${input.city} ${input.country}`.trim()
  const photonPlaces = await photonSearch(query, 16)
  const overpassPrimary = location ? await overpassAttractions(location.latitude, location.longitude, 4500) : []
  const overpassWide = location ? await overpassAttractions(location.latitude, location.longitude, 9000) : []
  const pool = [...overpassPrimary, ...overpassWide, ...photonPlaces]
  const normalizedPool = uniqueByName(pool)
    .filter((place) => place && place.name)
    .filter((place) => hasUsableCoordinates(place.latitude, place.longitude) || place.city || place.country)
  const selected = normalizedPool.length >= 3
    ? normalizedPool
    : buildSyntheticFallbackPlaces(input, location)
  const source = normalizedPool.length >= 3
    ? (location ? 'overpass+photon' : 'photon')
    : 'synthetic-fallback'
  return { rawCount: pool.length, places: selected, source }
}

function isCandidateNearDestination(place, input, location) {
  if (!location) return true
  const latitude = numberValue(place.latitude, NaN)
  const longitude = numberValue(place.longitude, NaN)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
  const cityKey = normalizeKey(place.city)
  const countryKey = normalizeKey(place.country)
  const inputCityKey = normalizeKey(input.city)
  const inputCountryKey = normalizeKey(input.country)
  const cityMatch = Boolean(inputCityKey && cityKey && (cityKey === inputCityKey || cityKey.includes(inputCityKey) || inputCityKey.includes(cityKey)))
  const countryMatch = Boolean(inputCountryKey && countryKey && (countryKey === inputCountryKey || countryKey.includes(inputCountryKey) || inputCountryKey.includes(countryKey)))
  if (cityMatch || countryMatch) return true
  if (!hasCoordinates) return false
  const distanceKm = haversineMeters(location.latitude, location.longitude, latitude, longitude) / 1000
  return distanceKm <= 45
}

function findCandidatePlace(name, candidatePlaces, anchorPlace) {
  const key = normalizeKey(name)
  if (!key) return anchorPlace
  const exact = candidatePlaces.find((place) => normalizeKey(place.name) === key)
  if (exact) return exact
  const contains = candidatePlaces.find((place) => {
    const placeKey = normalizeKey(place.name)
    return placeKey.includes(key) || key.includes(placeKey)
  })
  return contains ?? anchorPlace
}

async function resolveStopCoordinates({ source, input, name, fallbackPlace }) {
  if (hasUsableCoordinates(fallbackPlace?.latitude, fallbackPlace?.longitude)) {
    return {
      latitude: fallbackPlace.latitude,
      longitude: fallbackPlace.longitude,
    }
  }

  const sourceLatitude = numberValue(source.latitude ?? source.ubicacion?.latitud, NaN)
  const sourceLongitude = numberValue(source.longitude ?? source.ubicacion?.longitud, NaN)
  if (hasUsableCoordinates(sourceLatitude, sourceLongitude)) {
    return {
      latitude: sourceLatitude,
      longitude: sourceLongitude,
    }
  }

  const geocoded = await geocodePlace(`${name} ${input.city} ${input.country}`.trim())
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
        { name: `Cafeteria emblem�tica de ${city}`, type: 'cafe', category: 'cafe', latOffset: -0.001, lonOffset: 0.0014 },
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
        { name: `Punto panor�mico de ${city}`, type: 'viewpoint', category: 'viewpoint', latOffset: 0.0012, lonOffset: -0.0008 },
      ]
    case 'family':
      return [
        { name: `Parque familiar de ${city}`, type: 'family', category: 'family', latOffset: 0.001, lonOffset: 0 },
        { name: `Museo interactivo de ${city}`, type: 'museum', category: 'museum', latOffset: -0.001, lonOffset: 0.001 },
        { name: `Plaza principal de ${city}`, type: 'historic', category: 'historic', latOffset: 0.0015, lonOffset: -0.001 },
      ]
    default:
      return [
        { name: `Centro hist�rico de ${city}`, type: 'historic', category: 'historic', latOffset: 0.001, lonOffset: 0 },
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
        }
      })
      const { error: stopError } = await supabase.from('tour_stops').insert(stops)
      if (stopError) throw stopError
    })
}





