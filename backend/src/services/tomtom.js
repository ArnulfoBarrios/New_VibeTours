export async function optimizeRoute(places) {
  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey || !Array.isArray(places) || places.length < 3) return places

  // Filter places that have valid finite coordinates
  const validPlaces = places.filter(p => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
  if (validPlaces.length < 3) return places

  try {
    const coordinates = validPlaces.map(p => `${p.latitude},${p.longitude}`).join(':')
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${coordinates}/json?key=${apiKey}&computeBestOrder=true&routeType=fastest`
    
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!response.ok) {
      console.warn('[tomtom] Routing failed, returning original order', response.status)
      return places
    }
    
    const data = await response.json()
    if (data.optimizedWaypoints && data.optimizedWaypoints.length > 0) {
      // Sort waypoints by their optimized order (optimizedIndex)
      const sortedWaypoints = [...data.optimizedWaypoints].sort((a, b) => (a.optimizedIndex ?? 0) - (b.optimizedIndex ?? 0))
      
      const optimizedPlaces = [validPlaces[0]] // Origin
      for (const wp of sortedWaypoints) {
        if (wp.providedIndex != null && validPlaces[wp.providedIndex + 1]) {
          optimizedPlaces.push(validPlaces[wp.providedIndex + 1])
        }
      }
      optimizedPlaces.push(validPlaces[validPlaces.length - 1]) // Destination
      
      return optimizedPlaces
    }
    
    return places
  } catch (err) {
    console.error('[tomtom] error:', err.message)
    return places
  }
}

export async function searchTomTomPlaces({ query = '', category = '', lat = null, lon = null, radiusMeters = 10000, limit = 10 } = {}) {
  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey) return []
  try {
    let url = ''
    const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
    if (category && hasCoords) {
      url = `https://api.tomtom.com/search/2/categorySearch/${encodeURIComponent(category)}.json?key=${apiKey}&lat=${Number(lat)}&lon=${Number(lon)}&radius=${radiusMeters}&limit=${limit}`
    } else if (query && hasCoords) {
      url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&lat=${Number(lat)}&lon=${Number(lon)}&radius=${radiusMeters}&limit=${limit}`
    } else if (query) {
      url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=${limit}`
    } else {
      return []
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(4500) })
    if (!response.ok) return []
    const data = await response.json()
    const results = Array.isArray(data.results) ? data.results : []
    return results.map(r => {
      const name = r.poi?.name || r.address?.freeformAddress || ''
      const pLat = r.position?.lat
      const pLon = r.position?.lon
      if (!name || !Number.isFinite(pLat) || !Number.isFinite(pLon)) return null
      return {
        name,
        latitude: pLat,
        longitude: pLon,
        address: r.address?.freeformAddress || name,
        category: category || (r.poi?.categories?.[0] || 'attraction'),
        coordinateSource: 'tomtom',
        coordinatesVerified: true,
        placeId: `tomtom:${r.id || ''}`
      }
    }).filter(Boolean)
  } catch (err) {
    console.warn('[tomtom] search error:', err.message)
    return []
  }
}
