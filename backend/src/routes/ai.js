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
  persist: z.boolean().optional().default(false),
  userId: z.string().uuid().optional()
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
        center: geocode
      }
    })
  } catch (error) {
    next(error)
  }
})

aiRouter.post('/tours/generate', async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body)
    const location = await geocodePlace(`${input.destination} ${input.city} ${input.country}`)
    const candidates = location
      ? await overpassAttractions(location.latitude, location.longitude)
      : await photonSearch(`${input.destination} ${input.city}`)
    const places = candidates.length
      ? candidates.slice(0, 8)
      : fallbackPlaces(input, location)
    const ollama = await planWithOllama({ ...input, places })
    const plannedStops = Array.isArray(ollama?.itinerario) && ollama.itinerario.length
      ? ollama.itinerario
      : Array.isArray(ollama?.stops) && ollama.stops.length
        ? ollama.stops
        : places.slice(0, 6).map((place, index) => ({
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        description: `${place.name} aporta contexto local, identidad cultural y una experiencia caminable dentro de ${input.city || input.destination}.`,
        activities: ['Explorar', 'Fotografiar', 'Escuchar narracion guiada'],
        tips: ['Revisa horarios', 'Respeta zonas residenciales'],
        suggestedMinutes: 25 + index * 8
      }))
    const normalizedStops = await Promise.all(
      plannedStops.slice(0, 8).map((stop, index) => normalizeStop(stop, index, input))
    )
    const stops = normalizedStops.map((stop) => stop.publicStop)
    const routeStops = normalizedStops.map((stop) => stop.routeStop)
    const coverUrl = stops[0]?.imagenes?.[0] ?? fallbackCover(input.destination)
    const tour = {
      id: crypto.randomUUID(),
      nombre_tour: ollama?.nombre_tour ?? ollama?.title ?? `${input.city || input.destination} VibeTour AI`,
      resumen_corto: ollama?.resumen_corto ?? `Experiencia ${input.type} creada para descubrir ${input.city || input.destination} con una ruta logica y paradas relevantes.`,
      tipo_tour: ollama?.tipo_tour ?? input.type,
      subcategorias: normalizeList(ollama?.subcategorias, [input.type]),
      descripcion_tour: ollama?.descripcion_tour ?? ollama?.description ?? 'Ruta creada por VIBETOURS AI con lugares reales, tiempos sugeridos y orden logico.',
      experiencia_destacada: ollama?.experiencia_destacada ?? `Recorrido continuo por puntos clave de ${input.city || input.destination}.`,
      historia_del_lugar: ollama?.historia_del_lugar ?? '',
      contexto_cultural: ollama?.contexto_cultural ?? '',
      duracion_estimada: ollama?.duracion_estimada ?? `${input.durationHours} horas`,
      distancia_total: ollama?.distancia_total ?? `${Number(ollama?.distanceKm ?? Math.max(3.5, stops.length * 0.9)).toFixed(1)} km`,
      nivel_dificultad: ollama?.nivel_dificultad ?? 'Media',
      idiomas_disponibles: normalizeList(ollama?.idiomas_disponibles, [input.language]),
      publico_recomendado: normalizeList(ollama?.publico_recomendado, ['Viajeros curiosos', 'Parejas', 'Familias']),
      mejor_epoca: ollama?.mejor_epoca ?? 'Todo el ano',
      horario_recomendado: ollama?.horario_recomendado ?? 'Manana o tarde con buena luz natural',
      punto_encuentro: normalizeLocationInfo(ollama?.punto_encuentro, stops[0], input),
      imagen_portada: coverUrl,
      galeria_tour: unique(stops.flatMap((stop) => stop.imagenes)).slice(0, 8),
      itinerario: stops,
      orden_paradas: stops.map((stop, index) => ({ orden: index + 1, nombre: stop.nombre })),
      incluye: normalizeList(ollama?.incluye, ['Guia digital', 'Ruta en mapa interactivo', 'Recomendaciones por parada']),
      no_incluye: normalizeList(ollama?.no_incluye, ['Transporte privado', 'Entradas a recintos pagos']),
      recomendaciones: normalizeList(ollama?.recomendaciones, ['Lleva agua', 'Usa calzado comodo', 'Confirma horarios locales']),
      que_llevar: normalizeList(ollama?.que_llevar, ['Agua', 'Calzado comodo', 'Bateria suficiente']),
      normas_del_tour: normalizeList(ollama?.normas_del_tour, ['Respeta las normas locales', 'No ingreses a zonas restringidas', 'Cuida el patrimonio cultural']),
      etiquetas: normalizeList(ollama?.etiquetas ?? ollama?.tags, ['AI Planner', input.type, input.city || input.destination]),
      palabras_clave: normalizeList(ollama?.palabras_clave, [input.destination, input.city, input.country, input.type]),
      categoria_principal: ollama?.categoria_principal ?? input.type,
      presupuesto_estimado_usd: normalizeBudget(ollama?.presupuesto_estimado_usd, input),
      informacion_adicional: {
        accesibilidad: ollama?.informacion_adicional?.accesibilidad ?? 'Consultar condiciones de accesibilidad en cada parada.',
        mascotas_permitidas: ollama?.informacion_adicional?.mascotas_permitidas ?? false,
        apto_para_ninos: ollama?.informacion_adicional?.apto_para_ninos ?? true,
        apto_para_adultos_mayores: ollama?.informacion_adicional?.apto_para_adultos_mayores ?? true
      }
    }
    const route = {
      durationHours: input.durationHours,
      distanceKm: Number(ollama?.distanceKm ?? Math.max(3.5, stops.length * 0.9)),
      stops: routeStops
    }
    if (input.persist && supabase && input.userId) {
      await persistTour(tour, route, input, input.userId)
    }
    res.json({ tour, route })
  } catch (error) {
    next(error)
  }
})

async function normalizeStop(stop, index, input) {
  const ubicacion = stop.ubicacion ?? {}
  const name = stop.nombre ?? stop.name ?? ubicacion.nombre_lugar ?? `${input.destination} parada ${index + 1}`
  const latitude = numberValue(ubicacion.latitud ?? stop.latitude, 0)
  const longitude = numberValue(ubicacion.longitud ?? stop.longitude, 0)
  const images = normalizeList(stop.imagenes, [])
  const image = images[0] ?? stop.imageUrl ?? await imageForPlace(name, input.city || input.destination)
  const publicStop = {
    parada: index + 1,
    nombre: name,
    descripcion: stop.descripcion ?? stop.description ?? `${name} es una parada relevante dentro de la ruta.`,
    duracion_estimada: stop.duracion_estimada ?? `${stop.suggestedMinutes ?? 25} minutos`,
    actividades: normalizeList(stop.actividades ?? stop.activities, ['Explorar', 'Fotografiar']),
    datos_curiosos: normalizeList(stop.datos_curiosos, [`${name} fue seleccionado por su relevancia local.`]),
    consejos: normalizeList(stop.consejos ?? stop.tips, ['Confirma horarios locales antes de llegar']),
    ubicacion: {
      nombre_lugar: ubicacion.nombre_lugar ?? name,
      direccion: ubicacion.direccion ?? stop.address ?? '',
      ciudad: ubicacion.ciudad ?? input.city ?? '',
      region: ubicacion.region ?? '',
      pais: ubicacion.pais ?? input.country ?? '',
      place_id: ubicacion.place_id ?? placeIdFor(name, latitude, longitude),
      url_mapa: ubicacion.url_mapa ?? mapUrlFor(latitude, longitude)
    },
    imagenes: unique([image, ...images])
  }
  const routeStop = {
    name,
    latitude,
    longitude,
    imageUrl: publicStop.imagenes[0],
    description: publicStop.descripcion,
    activities: publicStop.actividades,
    tips: publicStop.consejos,
    suggestedMinutes: minutesFromLabel(publicStop.duracion_estimada)
  }
  return { publicStop, routeStop }
}

function fallbackPlaces(input, location) {
  const latitude = location?.latitude ?? 0
  const longitude = location?.longitude ?? 0
  return [{
    name: input.destination || input.city || 'Punto turistico',
    latitude,
    longitude,
    type: 'tourism'
  }]
}

function fallbackCover(seed) {
  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
  ]
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}

async function persistTour(tour, route, input, userId) {
  const { data, error } = await supabase
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
      additional_info: tour.informacion_adicional
    })
    .select('id')
    .single()
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
    stop_order: index
    }
  })
  const { error: stopError } = await supabase.from('tour_stops').insert(stops)
  if (stopError) throw stopError
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
      url_mapa: value.url_mapa ?? value.urlMapa ?? firstStop?.ubicacion?.url_mapa ?? ''
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
    url_mapa: firstStop?.ubicacion?.url_mapa ?? ''
  }
}

function normalizeBudget(value, input) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      bajo: numberValue(value.bajo ?? value.low, 0),
      medio: numberValue(value.medio ?? value.medium, 0),
      alto: numberValue(value.alto ?? value.high, 0)
    }
  }
  const base = input.type === 'gastronomic' ? 35 : input.type === 'ecological' ? 25 : 20
  return {
    bajo: base,
    medio: base * 2,
    alto: base * 4
  }
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return fallback
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
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

function placeIdFor(name, latitude, longitude) {
  return `${name}-${latitude}-${longitude}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapUrlFor(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}
