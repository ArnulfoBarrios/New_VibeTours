import { fetchWithProviderRetry } from './provider-http.js'

const ROUTE_TIMEOUT_MS = 8000

function finiteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeRouteMode(value = 'driving') {
  const mode = String(value || 'driving').trim().toLowerCase()
  if (mode === 'walking' || mode === 'walk') return 'walking'
  if (mode === 'cycling' || mode === 'bike' || mode === 'bicycle') return 'cycling'
  return 'driving'
}

export function normalizeRoutePoints(points = []) {
  if (!Array.isArray(points)) return []
  return points.map(point => ({
    latitude: finiteNumber(point?.latitude ?? point?.lat),
    longitude: finiteNumber(point?.longitude ?? point?.lon ?? point?.lng)
  })).filter(point => (
    point.latitude != null && point.longitude != null &&
    point.latitude >= -90 && point.latitude <= 90 &&
    point.longitude >= -180 && point.longitude <= 180 &&
    !(point.latitude === 0 && point.longitude === 0)
  ))
}

function haversineMeters(left, right) {
  const earthRadius = 6371000
  const toRadians = value => value * Math.PI / 180
  const dLat = toRadians(right.latitude - left.latitude)
  const dLon = toRadians(right.longitude - left.longitude)
  const lat1 = toRadians(left.latitude)
  const lat2 = toRadians(right.latitude)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function geometryPoints(rawGeometry) {
  if (!rawGeometry || typeof rawGeometry !== 'object') return []
  const coordinates = rawGeometry.coordinates
  if (!Array.isArray(coordinates)) return []

  const flattened = []
  const visit = value => {
    if (!Array.isArray(value)) return
    if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
      const longitude = Number(value[0])
      const latitude = Number(value[1])
      if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        flattened.push({ latitude, longitude })
      }
      return
    }
    for (const child of value) visit(child)
  }
  visit(coordinates)
  return flattened
}

function routeResult({ geometry, distanceMeters, travelTimeSeconds, provider }) {
  if (!Array.isArray(geometry) || geometry.length < 2) return null
  const calculatedDistance = geometry.slice(1).reduce((total, point, index) => (
    total + haversineMeters(geometry[index], point)
  ), 0)
  return {
    geometry,
    distanceMeters: Number.isFinite(Number(distanceMeters)) && Number(distanceMeters) > 0
      ? Number(distanceMeters)
      : calculatedDistance,
    travelTimeSeconds: Number.isFinite(Number(travelTimeSeconds)) && Number(travelTimeSeconds) > 0
      ? Math.round(Number(travelTimeSeconds))
      : null,
    provider,
    usesLiveTraffic: false
  }
}

export function parseMapboxRouteResponse(payload) {
  const route = Array.isArray(payload?.routes) ? payload.routes[0] : null
  if (!route) return null
  return routeResult({
    geometry: geometryPoints(route.geometry),
    distanceMeters: route.distance,
    travelTimeSeconds: route.duration,
    provider: 'mapbox'
  })
}

export function parseGeoapifyRouteResponse(payload) {
  const feature = Array.isArray(payload?.features) ? payload.features[0] : payload
  if (!feature) return null
  const properties = feature.properties || {}
  return routeResult({
    geometry: geometryPoints(feature.geometry),
    distanceMeters: properties.distance ?? properties.distance_meters,
    travelTimeSeconds: properties.time ?? properties.duration ?? properties.duration_seconds,
    provider: 'geoapify'
  })
}

async function fetchJson(url) {
  const response = await fetchWithProviderRetry(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'VibeTours/1.0' },
  }, {
    attempts: 3,
    timeoutMs: ROUTE_TIMEOUT_MS
  })
  if (!response?.ok) return null
  return response.json().catch(() => null)
}

async function routeWithMapbox(points, mode) {
  const token = String(process.env.MAPBOX_ACCESS_TOKEN || '').trim()
  if (!token) return null
  const profile = mode === 'walking'
    ? 'mapbox/walking'
    : mode === 'cycling'
      ? 'mapbox/cycling'
      : 'mapbox/driving'
  const coordinates = points.map(point => `${point.longitude},${point.latitude}`).join(';')
  const url = new URL(`https://api.mapbox.com/directions/v5/${profile}/${coordinates}`)
  url.searchParams.set('overview', 'full')
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('steps', 'true')
  url.searchParams.set('alternatives', 'true')
  url.searchParams.set('access_token', token)
  return parseMapboxRouteResponse(await fetchJson(url))
}

async function routeWithGeoapify(points, mode) {
  const apiKey = String(process.env.GEOAPIFY_API_KEY || '').trim()
  if (!apiKey) return null
  const geoapifyMode = mode === 'walking' ? 'walk' : mode === 'cycling' ? 'bicycle' : 'drive'
  const waypoints = points.map(point => `${point.latitude},${point.longitude}`).join('|')
  const url = new URL('https://api.geoapify.com/v1/routing')
  url.searchParams.set('waypoints', waypoints)
  url.searchParams.set('mode', geoapifyMode)
  url.searchParams.set('details', 'route_details')
  url.searchParams.set('apiKey', apiKey)
  return parseGeoapifyRouteResponse(await fetchJson(url))
}

/**
 * Calculates geometry on the server so provider keys never reach the mobile
 * app. Mapbox is preferred, Geoapify is the provider fallback, and the
 * client keeps its existing OSRM fallback when both are unavailable.
 */
export async function calculateRoute({ points = [], mode = 'driving' } = {}) {
  const normalizedPoints = normalizeRoutePoints(points)
  if (normalizedPoints.length < 2 || normalizedPoints.length > 25) return null
  const normalizedMode = normalizeRouteMode(mode)

  const mapboxRoute = await routeWithMapbox(normalizedPoints, normalizedMode).catch(() => null)
  if (mapboxRoute) return mapboxRoute

  return routeWithGeoapify(normalizedPoints, normalizedMode).catch(() => null)
}
