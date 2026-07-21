const USER_AGENT = 'VIBETOURS/1.0 contact=ops@vibetours.app'

export async function reverseGeocodeUserCountry(lat, lon) {
  if (!lat || !lon) return null
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lon)
    url.searchParams.set('zoom', '10')
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      const data = await response.json()
      if (data && data.address && data.address.country) {
        return data.address.country
      }
    }
  } catch (err) {
    console.error('Reverse geocode error:', err)
  return null
}

export async function reverseGeocodeLocation(lat, lon) {
  if (!lat || !lon) return null
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('zoom', '12')
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) {
      const data = await response.json()
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || data.address.state || ''
        const country = data.address.country || ''
        return {
          city,
          country,
          name: data.display_name || city
        }
      }
    }
  } catch (err) {
    console.error('[osm] Reverse geocode location error:', err)
  }
  return null
}

export async function geocodePlace(query, lat = null, lon = null) {
  // 1. Try Photon first as it has better search relevance for natural language
  // and prioritizes larger regions/cities over small shops or POIs with the same name.
  try {
    const photonResults = await photonSearch(query, 1, lat, lon)
    const [photon] = photonResults
    if (photon && Number.isFinite(photon.latitude) && Number.isFinite(photon.longitude)) {
      return {
        name: photon.name,
        latitude: Number(photon.latitude),
        longitude: Number(photon.longitude),
        city: photon.city || '',
        country: photon.country || ''
      }
    }
  } catch (err) {
    console.warn('[geocodePlace] Photon search failed:', err.message)
  }

  // 2. Fallback to Nominatim if Photon fails or returns no results
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '3')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', query)
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (response.ok) {
      const results = await response.json()
      const [result] = Array.isArray(results) ? results : []
      if (result) {
        const address = result.address || {}
        const city = address.city || address.town || address.village || address.municipality || address.county || ''
        const country = address.country || ''
        return {
          name: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          city,
          country
        }
      }
    }
  } catch (err) {
    console.warn('[geocodePlace] Nominatim search failed:', err.message)
  }

  return null
}


export async function photonSearch(query, limit = 8, lat = null, lon = null) {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
  if (lat && lon) {
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
  }
  const response = await fetch(url)
  if (!response.ok) return []
  const json = await response.json()
  return (json.features ?? []).map((feature) => ({
    name: feature.properties.name ?? feature.properties.city ?? query,
    city: feature.properties.city,
    country: feature.properties.country,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    type: feature.properties.osm_value ?? feature.properties.type ?? 'place',
    tags: feature.properties
  }))
}

export async function overpassAttractions(latitude, longitude, radius = 4500) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
      node(around:${radius},${latitude},${longitude})["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
      node(around:${radius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
      node(around:${radius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      node(around:${radius},${latitude},${longitude})["natural"~"beach|water"];
      node(around:${radius},${latitude},${longitude})["place"="island"];
      node(around:${radius},${latitude},${longitude})["boundary"="national_park"];
      way(around:${radius},${latitude},${longitude})["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
      way(around:${radius},${latitude},${longitude})["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
      way(around:${radius},${latitude},${longitude})["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
      way(around:${radius},${latitude},${longitude})["leisure"~"park|garden|nature_reserve"];
      way(around:${radius},${latitude},${longitude})["natural"~"beach|water"];
      way(around:${radius},${latitude},${longitude})["place"="island"];
      way(around:${radius},${latitude},${longitude})["boundary"="national_park"];
      relation(around:${radius},${latitude},${longitude})["place"="island"];
      relation(around:${radius},${latitude},${longitude})["boundary"="national_park"];
    );
    out center tags 80;
  `
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(8000)
    })
    if (!response.ok) return []
    const json = await response.json()
    return (json.elements ?? [])
      .map((element) => {
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      const name = element.tags?.name
      const type = element.tags?.tourism ?? element.tags?.historic ?? element.tags?.amenity ?? element.tags?.leisure ?? element.tags?.sport ?? element.tags?.natural ?? element.tags?.place ?? element.tags?.boundary ?? 'place'
      if (lat == null || lon == null || !name) return null
      if (isAccommodation(type)) return null
      return {
        name,
        latitude: lat,
        longitude: lon,
        type,
        category: classifyAttraction(element.tags),
        tags: element.tags
      }
    })
      .filter(Boolean)
      .slice(0, 60)
  } catch (error) {
    console.error('[osm] overpassAttractions error:', error.message)
    return []
  }
}

export async function overpassNearbyCities(latitude, longitude, radius = 100000) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["place"~"city|town"]["wikipedia"];
    );
    out center tags 15;
  `
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({ data: query })
    })
    if (!response.ok) return []
    const json = await response.json()
    return (json.elements ?? [])
      .map((element) => {
      const name = element.tags?.name
      if (!name) return null
      return {
        name,
        latitude: element.lat,
        longitude: element.lon
      }
    })
      .filter(Boolean)
  } catch (error) {
    console.error('[osm] overpassNearbyCities error:', error.message)
    return []
  }
}

function classifyAttraction(tags = {}) {
  const tourism = String(tags.tourism ?? '').toLowerCase()
  const historic = String(tags.historic ?? '').toLowerCase()
  const amenity = String(tags.amenity ?? '').toLowerCase()
  const leisure = String(tags.leisure ?? '').toLowerCase()
  const natural = String(tags.natural ?? '').toLowerCase()
  const sport = String(tags.sport ?? '').toLowerCase()
  const place = String(tags.place ?? '').toLowerCase()
  const boundary = String(tags.boundary ?? '').toLowerCase()

  if (['museum', 'gallery', 'arts_centre'].includes(amenity) || tourism === 'museum') return 'museum'
  if (['monument', 'memorial', 'ruins', 'castle', 'archaeological_site'].includes(historic)) return 'historic'
  if (['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].includes(tourism)) return tourism
  if (amenity === 'marketplace') return 'market'
  if (['sports_centre', 'stadium', 'pitch', 'track', 'fitness_centre'].includes(leisure) || sport) return 'sports'
  if (
    ['park', 'garden', 'nature_reserve', 'forest'].includes(leisure) || 
    ['tree', 'wood', 'grassland', 'beach', 'water'].includes(natural) ||
    place === 'island' ||
    boundary === 'national_park'
  ) return 'nature'
  if (['restaurant', 'cafe', 'food_court', 'pub', 'bar', 'nightclub'].includes(amenity)) return amenity
  if (['cathedral', 'church', 'temple', 'mosque'].includes(historic)) return 'religious'
  return tourism || historic || amenity || leisure || natural || place || boundary || 'place'
}

function isAccommodation(type) {
  return [
    'hotel',
    'hostel',
    'guest_house',
    'apartment',
    'motel',
    'camp_site',
    'caravan_site',
    'chalet'
  ].includes(type)
}

export async function overpassHotels(latitude, longitude, budget = 'moderate', radius = 4500) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["tourism"~"hotel|hostel"];
      way(around:${radius},${latitude},${longitude})["tourism"~"hotel|hostel"];
    );
    out center tags 25;
  `
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(4000)
    })
    if (response.ok) {
      const json = await response.json()
      const elements = (json.elements ?? [])
        .map((element) => {
          const lat = element.lat ?? element.center?.lat
          const lon = element.lon ?? element.center?.lon
          const name = element.tags?.name
          if (lat == null || lon == null || !name) return null
          
          let stars = element.tags?.stars
          if (!stars) {
            if (budget === 'economic') {
              stars = '3'
            } else if (budget === 'luxury') {
              stars = '5'
            } else {
              stars = '4'
            }
          }

          return {
            id: element.id,
            name,
            latitude: lat,
            longitude: lon,
            stars,
            type: 'hotel',
            tags: element.tags
          }
        })
        .filter(Boolean)
      
      if (elements.length > 0) return elements
    }
  } catch (error) {
    console.warn('[osm] overpassHotels query failed or timed out, falling back to Photon search:', error.message)
  }

  return photonHotelsFallback(latitude, longitude, budget)
}

/**
 * Search for nearby food/restaurant places via Overpass API.
 * Used by the voice route assistant for the SEARCH_RESTAURANTS action.
 */
export async function overpassNearbyFood(latitude, longitude, radius = 1000) {
  const query = `
    [out:json][timeout:15];
    (
      node(around:${radius},${latitude},${longitude})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];
      way(around:${radius},${latitude},${longitude})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];
    );
    out center tags 20;
  `
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) return []
    const json = await response.json()
    return (json.elements ?? [])
      .map((element) => {
        const lat = element.lat ?? element.center?.lat
        const lon = element.lon ?? element.center?.lon
        const name = element.tags?.name
        if (lat == null || lon == null || !name) return null
        return {
          name,
          latitude: lat,
          longitude: lon,
          type: element.tags?.amenity ?? 'restaurant',
          cuisine: element.tags?.cuisine ?? null,
          address: element.tags?.['addr:street'] ?? null
        }
      })
      .filter(Boolean)
      .slice(0, 8)
  } catch (error) {
    console.error('[osm] overpassNearbyFood error:', error.message)
    return []
  }
}

async function photonHotelsFallback(latitude, longitude, budget) {
  try {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', 'hotel')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('limit', '10')
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return []
    const json = await response.json()
    return (json.features ?? [])
      .map((feature) => {
        const name = feature.properties.name
        const lat = feature.geometry.coordinates[1]
        const lon = feature.geometry.coordinates[0]
        if (!name || lat == null || lon == null) return null
        
        let stars = feature.properties.stars
        if (!stars) {
          if (budget === 'economic') {
            stars = '3'
          } else if (budget === 'luxury') {
            stars = '5'
          } else {
            stars = '4'
          }
        }
        
        return {
          id: feature.properties.osm_id ? String(feature.properties.osm_id) : `photon-${Math.random().toString(36).slice(2, 9)}`,
          name,
          latitude: lat,
          longitude: lon,
          stars: String(stars),
          type: 'hotel',
          tags: feature.properties
        }
      })
      .filter(Boolean)
  } catch (err) {
    console.warn('[osm] photonHotelsFallback error:', err.message)
    return []
  }
}

