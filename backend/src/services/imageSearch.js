export async function imageForPlace(placeName, city, category = '') {
  const result = await imageForPlaceWithStatus(placeName, city, category)
  return result.url
}

export async function imageForPlaceWithStatus(placeName, city, category = '') {
  const normalizedCategory = String(category || '').toLowerCase()

  // 1. Búsqueda estricta del lugar específico
  const wiki = await wikimediaImage(placeName)
  if (wiki) return { url: wiki, isFallback: false }
  const openverse = await openverseImage(`${placeName} ${city}`)
  if (openverse) return { url: openverse, isFallback: false }
  
  // 2. Fallback: Buscar imagen de la categoría específica en esa ciudad/región
  if (city) {
    const categoryKeywords = categorySearchKeywords(normalizedCategory)
    const cityWords = getCityWords(city)
    
    // Usar la palabra clave principal de la categoría para evitar consultas sobrecargadas
    const searchQuery = `${categoryKeywords[0]} ${city}`
    const requiredGroups = [cityWords, categoryKeywords]
    
    const wikiCity = await wikimediaImage(searchQuery, requiredGroups)
    if (wikiCity) return { url: wikiCity, isFallback: true }
    
    const openverseCity = await openverseImage(searchQuery, requiredGroups)
    if (openverseCity) return { url: openverseCity, isFallback: true }

    // Fallback secundario de la ciudad si no hay nada de la categoría
    const wikiJustCity = await wikimediaImage(city, [cityWords])
    if (wikiJustCity) return { url: wikiJustCity, isFallback: true }
  }

  // 3. Último recurso: Imagen curada según la categoría para que esté relacionada
  return { url: curatedImage(`${placeName} ${city} travel`, normalizedCategory), isFallback: true }
}

async function wikimediaImage(query, requiredGroups = null) {
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', query)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '8') // incrementamos a 8 para tener más candidatos
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    const pages = Object.values(json.query?.pages ?? {})
    
    const bestPage = pages.find((page) => {
      const title = page.title ?? ''
      const imageUrl = page.imageinfo?.[0]?.url ?? ''
      return isImageTitleRelevant(title, query, requiredGroups, imageUrl)
    })
    
    return bestPage?.imageinfo?.[0]?.url ?? null
  } catch {
    return null
  }
}

async function openverseImage(query, requiredGroups = null) {
  try {
    const url = new URL('https://api.openverse.engineering/v1/images/')
    url.searchParams.set('q', query)
    url.searchParams.set('page_size', '8')
    url.searchParams.set('license_type', 'commercial,modification')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    
    const bestMatch = (json.results ?? []).find((result) => {
      const title = result.title ?? ''
      const imageUrl = result.url ?? result.thumbnail ?? ''
      return isImageTitleRelevant(title, query, requiredGroups, imageUrl)
    })
    
    return bestMatch ? (bestMatch.url ?? bestMatch.thumbnail) : null
  } catch {
    return null
  }
}

function isImageTitleRelevant(title, query, requiredGroups = null, url = '') {
  if (!title) return false
  
  const titleLower = title.toLowerCase()
  const urlLower = (url || '').toLowerCase()
  
  // Validar extensión del archivo (evitar PDFs u otros archivos no imagen)
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const hasValidExtension = validExtensions.some(ext => 
    titleLower.endsWith(ext) || 
    urlLower.endsWith(ext) || 
    urlLower.includes(ext + '?') || 
    urlLower.includes(ext + '/')
  )
  if (!hasValidExtension) return false
  
  // Si tenemos grupos de palabras obligatorias (para búsquedas de fallback de categorías)
  if (requiredGroups && requiredGroups.length > 0) {
    return requiredGroups.every(group => {
      const words = group.map(w => w.toLowerCase())
      return words.some(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp('\\b' + escaped + '\\b', 'i')
        return regex.test(titleLower)
      })
    })
  }
  
  // Validación por defecto basada en la query
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

function getCityWords(city) {
  return city.toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['colombia', 'spain', 'espana', 'mexico', 'argentina', 'peru', 'chile', 'ecuador', 'venezuela'].includes(word))
}

function categorySearchKeywords(category) {
  const mapping = {
    restaurant: ['restaurant', 'food', 'cafe', 'comida', 'dinner', 'lunch', 'restaurante', 'gastronomia', 'plato', 'cena'],
    cafe: ['cafe', 'coffee', 'cafeteria', 'bakery', 'panaderia', 'reposteria'],
    market: ['market', 'mercado', 'plaza', 'bazar', 'bazaar'],
    nightlife: ['bar', 'pub', 'nightclub', 'discoteca', 'terraza', 'rooftop', 'copas', 'tragos'],
    museum: ['museum', 'gallery', 'art', 'museo', 'galeria', 'arte', 'exhibicion'],
    historic: ['castle', 'monument', 'ruins', 'monumento', 'historico', 'muralla', 'baluarte', 'plaza', 'ruinas'],
    religious: ['church', 'cathedral', 'temple', 'catedral', 'iglesia', 'templo', 'capilla', 'santuario'],
    nature: ['park', 'nature', 'forest', 'reserve', 'jardin', 'sendero', 'playa', 'beach', 'rio', 'river', 'lake', 'lago', 'parque'],
    viewpoint: ['viewpoint', 'landscape', 'panorama', 'mirador', 'vista', 'paisaje'],
    sports: ['stadium', 'arena', 'cancha', 'estadio', 'deporte', 'sports'],
  }
  return mapping[category] || ['tourism', 'travel', 'turismo', 'viaje', 'landmark', 'atractivo']
}

function curatedImage(seed, category) {
  const categoryImages = {
    restaurant: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
    ],
    cafe: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    ],
    market: [
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1488459718432-36c552ff77aa?auto=format&fit=crop&w=900&q=80',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    ],
    museum: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=900&q=80',
    ],
    historic: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=900&q=80',
    ],
    religious: [
      'https://images.unsplash.com/photo-1548625361-155de6c7f54a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=900&q=80',
    ],
    nature: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
    viewpoint: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=900&q=80',
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80',
    ],
    default: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    ]
  }

  const list = categoryImages[category] || categoryImages.default
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return list[Math.abs(hash) % list.length]
}
