export async function optimizeRoute(places) {
  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey || places.length < 2) return places

  try {
    // TomTom Waypoint Optimization API expects locations in a specific format
    // For a generic routing, we can use the Calculate Route API with waypoints
    const coordinates = places.map(p => `${p.latitude},${p.longitude}`).join(':')
    
    // Using Routing API with computeBestOrder=true
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${coordinates}/json?key=${apiKey}&computeBestOrder=true&routeType=fastest`
    
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[tomtom] Routing failed, returning original order', response.status)
      return places
    }
    
    const data = await response.json()
    if (data.optimizedWaypoints && data.optimizedWaypoints.length > 0) {
      // The first and last points are fixed in TomTom computeBestOrder (origin and destination)
      // The optimizedWaypoints array only contains the intermediate points.
      // So order will be: Origin -> optimizedWaypoints -> Destination
      
      const optimizedPlaces = [places[0]] // Origin
      
      for (const wp of data.optimizedWaypoints) {
        // wp.providedIndex represents the index from the original intermediate points (0-based)
        // Since original list has Origin at 0, intermediate points start at 1.
        optimizedPlaces.push(places[wp.providedIndex + 1])
      }
      
      optimizedPlaces.push(places[places.length - 1]) // Destination
      
      return optimizedPlaces
    }
    
    return places
  } catch (err) {
    console.error('[tomtom] error:', err.message)
    return places
  }
}
