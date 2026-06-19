const USER_AGENT = 'VIBETOURS/1.0 contact=ops@vibetours.app'
export async function geocodePlace(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '3')
  url.searchParams.set('q', query)
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (response.ok) {
      const results = await response.json()
      const [result] = Array.isArray(results) ? results : []
      if (result) {
        return {
          name: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon)
        }
      }
    }
  } catch {
    // Fall through to Photon below.
  }

  const photonResults = await photonSearch(query, 1)
  const [photon] = photonResults
  if (photon && Number.isFinite(photon.latitude) && Number.isFinite(photon.longitude)) {
    return {
      name: photon.name,
      latitude: Number(photon.latitude),
      longitude: Number(photon.longitude),
    }
  }
  return null
}


export async function photonSearch(query, limit = 8) {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
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
      node(around:${radius},${latitude},${longitude})["tourism"];
      node(around:${radius},${latitude},${longitude})["historic"];
      node(around:${radius},${latitude},${longitude})["amenity"~"museum|theatre|arts_centre|marketplace|restaurant|cafe|food_court|pub|bar|nightclub"];
      node(around:${radius},${latitude},${longitude})["leisure"~"park|garden|sports_centre|stadium|pitch|track|fitness_centre|playground|nature_reserve"];
      node(around:${radius},${latitude},${longitude})["sport"];
      node(around:${radius},${latitude},${longitude})["natural"~"beach|wood|tree|water|peak|cliff|grassland"];
      way(around:${radius},${latitude},${longitude})["tourism"];
      way(around:${radius},${latitude},${longitude})["historic"];
      way(around:${radius},${latitude},${longitude})["amenity"~"marketplace|restaurant|cafe|food_court|pub|bar|nightclub"];
      way(around:${radius},${latitude},${longitude})["leisure"~"park|garden|sports_centre|stadium|pitch|track|fitness_centre|playground|nature_reserve"];
      way(around:${radius},${latitude},${longitude})["sport"];
      way(around:${radius},${latitude},${longitude})["natural"~"beach|wood|water|peak|cliff|grassland"];
    );
    out center tags 35;
  `
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
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      const name = element.tags?.name
      const type = element.tags?.tourism ?? element.tags?.historic ?? element.tags?.amenity ?? element.tags?.leisure ?? element.tags?.sport ?? element.tags?.natural ?? 'place'
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
    .slice(0, 20)
}

function classifyAttraction(tags = {}) {
  const tourism = String(tags.tourism ?? '').toLowerCase()
  const historic = String(tags.historic ?? '').toLowerCase()
  const amenity = String(tags.amenity ?? '').toLowerCase()
  const leisure = String(tags.leisure ?? '').toLowerCase()
  const natural = String(tags.natural ?? '').toLowerCase()
  const sport = String(tags.sport ?? '').toLowerCase()

  if (['museum', 'gallery', 'arts_centre'].includes(amenity) || tourism === 'museum') return 'museum'
  if (['monument', 'memorial', 'ruins', 'castle', 'archaeological_site'].includes(historic)) return 'historic'
  if (['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].includes(tourism)) return tourism
  if (amenity === 'marketplace') return 'market'
  if (['sports_centre', 'stadium', 'pitch', 'track', 'fitness_centre'].includes(leisure) || sport) return 'sports'
  if (['park', 'garden', 'nature_reserve', 'forest'].includes(leisure) || ['tree', 'wood', 'grassland', 'beach'].includes(natural)) return 'nature'
  if (['restaurant', 'cafe', 'food_court', 'pub', 'bar', 'nightclub'].includes(amenity)) return amenity
  if (['cathedral', 'church', 'temple', 'mosque'].includes(historic)) return 'religious'
  return tourism || historic || amenity || leisure || natural || 'place'
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
