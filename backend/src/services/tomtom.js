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
