export async function imageForPlace(placeName, city) {
  const result = await imageForPlaceWithStatus(placeName, city)
  return result.url
}

export async function imageForPlaceWithStatus(placeName, city) {
  const wiki = await wikimediaImage(placeName)
  if (wiki) return { url: wiki, isFallback: false }
  const openverse = await openverseImage(`${placeName} ${city}`)
  if (openverse) return { url: openverse, isFallback: false }
  
  // Fallback: Buscar imagen de la ciudad/región
  if (city) {
    const wikiCity = await wikimediaImage(city)
    if (wikiCity) return { url: wikiCity, isFallback: true }
    const openverseCity = await openverseImage(city)
    if (openverseCity) return { url: openverseCity, isFallback: true }
  }

  return { url: curatedImage(`${placeName} ${city} travel`), isFallback: true }
}

async function wikimediaImage(query) {
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', query)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '5')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    const pages = Object.values(json.query?.pages ?? {})
    
    // Buscar la primera página que tenga título relevante
    const bestPage = pages.find((page) => {
      const title = page.title ?? ''
      return isImageTitleRelevant(title, query)
    })
    
    return bestPage?.imageinfo?.[0]?.url ?? null
  } catch {
    return null
  }
}

async function openverseImage(query) {
  try {
    const url = new URL('https://api.openverse.engineering/v1/images/')
    url.searchParams.set('q', query)
    url.searchParams.set('page_size', '5')
    url.searchParams.set('license_type', 'commercial,modification')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    
    // Buscar el primer resultado relevante
    const bestMatch = (json.results ?? []).find((result) => {
      const title = result.title ?? ''
      return isImageTitleRelevant(title, query)
    })
    
    return bestMatch ? (bestMatch.url ?? bestMatch.thumbnail) : null
  } catch {
    return null
  }
}

function isImageTitleRelevant(title, query) {
  if (!title || !query) return false
  
  const titleLower = title.toLowerCase()
  const queryWords = query.toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => {
      const stopWords = new Set([
        'del', 'las', 'los', 'con', 'por', 'para', 'una', 'uno', 'the', 'and', 'for', 'with',
        'bar', 'cafe', 'hotel', 'restaurante', 'restaurant', 'plaza', 'parque', 'museum', 'museo',
        'iglesia', 'church', 'playa', 'beach', 'mirador', 'viewpoint', 'aeropuerto', 'airport',
        'estacion', 'station', 'supermercado', 'supermarket', 'centro', 'mall', 'tienda', 'shop',
        'tourism', 'attraction', 'turismo', 'atraccion', 'landmark', 'place', 'monumento', 'monument'
      ])
      return !stopWords.has(word)
    })
    
  if (queryWords.length === 0) return true
  
  return queryWords.some(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp('\\b' + escaped + '\\b', 'i')
    return regex.test(titleLower)
  })
}

function curatedImage(seed) {
  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80'
  ]
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return images[Math.abs(hash) % images.length]
}
