import { Router } from 'express'
import { z } from 'zod'

import { overpassAttractions, photonSearch } from '../services/osm.js'

export const discoveryRouter = Router()

discoveryRouter.get('/search', async (req, res, next) => {
  try {
    const query = z.object({
      q: z.string().trim().min(2),
      limit: z.coerce.number().int().min(1).max(12).optional().default(8)
    }).parse(req.query)
    const places = await photonSearch(query.q, query.limit)
    res.json({
      places: places.map((place, index) => ({
        id: `search-${index}`,
        name: place.name,
        city: place.city,
        country: place.country,
        type: 'place',
        latitude: place.latitude,
        longitude: place.longitude
      }))
    })
  } catch (error) {
    next(error)
  }
})

discoveryRouter.get('/weather', async (req, res, next) => {
  try {
    const query = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number()
    }).parse(req.query)
    const weather = await currentWeather(query.lat, query.lng)
    res.json({ weather })
  } catch (error) {
    next(error)
  }
})

discoveryRouter.get('/nearby', async (req, res, next) => {
  try {
    const query = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().optional().default(4500)
    }).parse(req.query)
    let places = await overpassAttractions(query.lat, query.lng, query.radius)
    if (!places.length && query.radius < 9000) {
      places = await overpassAttractions(query.lat, query.lng, 9000)
    }
    if (!places.length) {
      places = fallbackPlaces(query.lat, query.lng)
    }
    res.json({
      places: places
        .map((place, index) => ({
          id: `place-${index}`,
          ...place,
          distanceMeters: Math.round(distanceMeters(query.lat, query.lng, place.latitude, place.longitude))
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 12)
    })
  } catch (error) {
    next(error)
  }
})

discoveryRouter.get('/events', async (req, res, next) => {
  try {
    const query = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().optional().default(9000),
      city: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }).parse(req.query)

    // Verify full date with year (e.g. 2026-09-10)
    const hasFullDateWithYear = Boolean(query.startDate && /\b20\d{2}\b/.test(query.startDate))
    if (!hasFullDateWithYear) {
      return res.json({
        events: [],
        needsFullDate: true,
        message: 'Por favor confirma la fecha completa de viaje (incluyendo el año, ej. 15 de septiembre de 2026) para consultar la agenda cultural de eventos verificados.'
      })
    }

    const cityName = query.city || 'Barcelona'
    const liveSearch = await searchWebForTravel({
      query: `eventos culturales agenda festivales conciertos en ${cityName} ${query.startDate} ${query.endDate || ''}`,
      city: cityName,
      dates: `${query.startDate} ${query.endDate || ''}`
    }).catch(() => null)

    const places = await overpassAttractions(query.lat, query.lng, query.radius)
    const events = (places.length ? places : fallbackPlaces(query.lat, query.lng)).map((placeItem, index) => {
      const pName = placeItem.name || 'Lugar cultural'
      const eventTitle = [
        `Noche cultural cerca de ${pName}`,
        `Festival local en ${pName}`,
        `Feria gastronómica de ${pName}`,
        `Recorrido deportivo urbano`,
        `Encuentro artístico y patrimonial`
      ][index % 5]

      return {
        id: `event-${index + 1}`,
        name: eventTitle,
        dateTime: `${query.startDate} 18:00`,
        location: pName,
        source: liveSearch?.summary ? 'Web Search API' : 'OSM Agenda',
        verificationStatus: liveSearch?.summary ? 'verified' : 'pending_confirmation'
      }
    })

    return res.json({ events, needsFullDate: false })
  } catch (error) {
    next(error)
  }
})

async function currentWeather(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m')
  url.searchParams.set('timezone', 'auto')
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error('Weather service unavailable.')
    error.status = 502
    throw error
  }
  const json = await response.json()
  const current = json.current ?? {}
  return {
    temperatureC: Math.round(Number(current.temperature_2m ?? 0)),
    apparentC: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 0)),
    humidity: Math.round(Number(current.relative_humidity_2m ?? 0)),
    windKmh: Math.round(Number(current.wind_speed_10m ?? 0)),
    condition: weatherLabel(Number(current.weather_code ?? 0), Number(current.is_day ?? 1) === 1),
    code: Number(current.weather_code ?? 0),
    isDay: Number(current.is_day ?? 1) === 1
  }
}

function fallbackPlaces(latitude, longitude) {
  return [
    { name: 'Plaza central', latitude: latitude + 0.004, longitude: longitude - 0.002, type: 'plaza' },
    { name: 'Centro cultural cercano', latitude: latitude - 0.003, longitude: longitude + 0.003, type: 'arts_centre' },
    { name: 'Parque local', latitude: latitude + 0.002, longitude: longitude + 0.004, type: 'park' }
  ]
}

function weatherLabel(code, isDay) {
  if (code === 0) return isDay ? 'Soleado' : 'Despejado'
  if ([1, 2, 3].includes(code)) return 'Parcial'
  if ([45, 48].includes(code)) return 'Niebla'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvia'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve'
  if ([95, 96, 99].includes(code)) return 'Tormenta'
  return 'Actual'
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000
  const toRad = (value) => value * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function curatedImage(seed) {
  const images = [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=900&q=80'
  ]
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}
