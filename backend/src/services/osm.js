const USER_AGENT = 'VIBETOURS/1.0 contact=ops@vibetours.app'

export async function geocodePlace(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', query)
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (!response.ok) return null
  const [result] = await response.json()
  if (!result) return null
  return {
    name: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon)
  }
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
    longitude: feature.geometry.coordinates[0]
  }))
}

export async function overpassAttractions(latitude, longitude, radius = 4500) {
  const query = `
    [out:json][timeout:25];
    (
      node(around:${radius},${latitude},${longitude})["tourism"];
      node(around:${radius},${latitude},${longitude})["historic"];
      node(around:${radius},${latitude},${longitude})["amenity"~"museum|theatre|arts_centre|marketplace"];
      way(around:${radius},${latitude},${longitude})["tourism"];
      way(around:${radius},${latitude},${longitude})["historic"];
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
      const type = element.tags?.tourism ?? element.tags?.historic ?? element.tags?.amenity ?? 'place'
      if (!lat || !lon || !name) return null
      if (isAccommodation(type)) return null
      return {
        name,
        latitude: lat,
        longitude: lon,
        type
      }
    })
    .filter(Boolean)
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
