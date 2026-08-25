export async function imageForPlace(placeName, city, countryOrCategory = 'Colombia', indexSeed = 0, options = {}) {
  // Support both imageForPlace(place, city, country) and imageForPlace(place, city, category, seed, opts)
  const isCountry = typeof countryOrCategory === 'string' && /colombia|m[ée]xico|espa[ñn]a|per[úu]|argentina|chile|brasil|estados unidos|francia|italia/i.test(countryOrCategory)
  const category = isCountry ? '' : countryOrCategory
  const country = options?.country || (isCountry ? countryOrCategory : 'Colombia')
  const mergedOptions = { ...options, country }
  const result = await imageForPlaceWithStatus(placeName, city, category, indexSeed, mergedOptions)
  return result.url
}

export async function imageForPlaceWithStatus(placeName, city, category = '', indexSeed = 0, options = {}) {
  const normalizedCategory = String(category || '').toLowerCase()
  const seed = Number(indexSeed || 0)
  const country = options?.country || 'Colombia'
  const latitude = options?.latitude ?? options?.lat ?? null
  const longitude = options?.longitude ?? options?.lon ?? null
  const contextualQuery = [placeName, city, country].filter(Boolean).join(', ')
  const assignedUrls = options?.assignedUrls instanceof Set ? options.assignedUrls : null

  const isFoodOrDrink = normalizedCategory === 'restaurant' || normalizedCategory === 'food' || normalizedCategory === 'cafe' ||
    /restaurante|comida|asador|bistro|gourmet|cafe|café|bar|pub|pizzeria|chifa/i.test(placeName)

  function isValidDistinct(url) {
    if (!url || typeof url !== 'string') return false
    if (assignedUrls && assignedUrls.has(url)) return false
    return true
  }

  // 0. Para restaurantes y gastronomía local, priorizar directamente imágenes gastronómicas curadas para evitar retratos de personas o cantantes
  if (isFoodOrDrink) {
    let curatedFood = curatedImage(`${placeName} ${city}`, 'restaurant', seed)
    if (assignedUrls && assignedUrls.has(curatedFood)) {
      for (let offset = 1; offset < 10; offset++) {
        const nextCandidate = curatedImage(`${placeName} ${city}`, 'restaurant', seed + offset)
        if (!assignedUrls.has(nextCandidate)) {
          curatedFood = nextCandidate
          break
        }
      }
    }
    assignedUrls?.add(curatedFood)
    return { url: curatedFood, isFallback: true }
  }

  // 1A. Consulta prioritaria a Wikipedia Summary API
  const wikiSummary = await wikipediaSummaryImage(placeName, city)
  if (isValidDistinct(wikiSummary)) {
    assignedUrls?.add(wikiSummary)
    return { url: wikiSummary, isFallback: false }
  }

  // 1B. Búsqueda contextual estricta en Wikimedia Commons
  const wiki = await wikimediaImage(contextualQuery, null, seed) || await wikimediaImage(placeName, null, seed)
  if (isValidDistinct(wiki)) {
    assignedUrls?.add(wiki)
    return { url: wiki, isFallback: false }
  }

  // 1C. Búsqueda estricta contextual en Openverse
  const openverse = await openverseImage(contextualQuery, null, seed) || await openverseImage(`${placeName} ${city}`, null, seed)
  if (isValidDistinct(openverse)) {
    assignedUrls?.add(openverse)
    return { url: openverse, isFallback: false }
  }

  // 1D. Consulta a Pexels API
  if (process.env.PEXELS_API_KEY) {
    const pexels = await pexelsImage(contextualQuery, seed) || await pexelsImage(`${placeName} ${city}`, seed)
    if (isValidDistinct(pexels)) {
      assignedUrls?.add(pexels)
      return { url: pexels, isFallback: false }
    }
  }

  // 1E. GeoSearch en Wikimedia Commons
  if (latitude && longitude && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    const wikiGeo = await wikimediaGeoImage(Number(latitude), Number(longitude), 500, seed)
    if (isValidDistinct(wikiGeo)) {
      assignedUrls?.add(wikiGeo)
      return { url: wikiGeo, isFallback: false }
    }
  }
  
  // 2. Fallback: Buscar imagen de la categoría específica en esa ciudad/región
  if (city) {
    const categoryKeywords = categorySearchKeywords(normalizedCategory)
    const cityWords = getCityWords(city)
    const keyword = categoryKeywords[Math.abs(seed) % categoryKeywords.length]
    const searchQuery = `${keyword} ${city}`
    const requiredGroups = [cityWords, categoryKeywords]
    
    const wikiCity = await wikimediaImage(searchQuery, requiredGroups, seed)
    if (isValidDistinct(wikiCity)) {
      assignedUrls?.add(wikiCity)
      return { url: wikiCity, isFallback: true }
    }
  }

  // 3. Último recurso: Imagen curada según la categoría (rotada con la semilla + offset anti-colisión)
  let curated = curatedImage(`${placeName} ${city} travel`, normalizedCategory, seed)
  if (assignedUrls && assignedUrls.has(curated)) {
    for (let offset = 1; offset < 10; offset++) {
      const nextCandidate = curatedImage(`${placeName} ${city} travel`, normalizedCategory, seed + offset)
      if (!assignedUrls.has(nextCandidate)) {
        curated = nextCandidate
        break
      }
    }
  }
  assignedUrls?.add(curated)
  return { url: curated, isFallback: true }
}

async function wikipediaSummaryImage(placeName, city = '', country = '') {
  if (!placeName || typeof placeName !== 'string') return null
  const raw = placeName.trim()
  if (raw.length < 3) return null

  const cleaned = raw.replace(/\(.*?\)/g, '').replace(/_/g, ' ').trim()
  const cleanCity = String(city || '').replace(/_/g, ' ').trim()
  const cleanCountry = String(country || '').replace(/_/g, ' ').trim()

  // 1. Search in Spanish Wikipedia with full destination context
  try {
    const searchQuery = `${cleaned} ${cleanCity} ${cleanCountry}`.trim()
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*`
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
    if (sRes.ok) {
      const sJson = await sRes.json()
      const topHit = sJson?.query?.search?.[0]
      if (topHit && topHit.title) {
        const slug = encodeURIComponent(topHit.title.replace(/\s+/g, '_'))
        const sumUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`
        const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
        if (sumRes.ok) {
          const sumJson = await sumRes.json()
          const imageUrl = sumJson.originalimage?.source || sumJson.thumbnail?.source
          if (imageUrl) {
            const lower = imageUrl.toLowerCase()
            const isUnusable = [
              '.svg', 'flag', 'bandera', 'escudo', 'coat_of_arms', 'coat of arms', 'blason', 'stemma',
              'seal', 'logo', 'icon', 'symbol', 'map', 'mapa', 'location', 'diagram', 'chart',
              'portrait', 'stamp', 'monochrome', 'drawing', 'sketch', 'illustration', 'bw_'
            ].some(k => lower.includes(k))
            if (!isUnusable) {
              return imageUrl
            }
          }
        }
      }
    }
  } catch {}

  // 2. Direct slug variations in es.wikipedia.org ONLY
  const variations = [
    ...(cleanCity ? [`${cleaned} (${cleanCity})`, `${cleaned}, ${cleanCity}`] : []),
    cleaned
  ].filter((v, i, arr) => v && v.length >= 3 && arr.indexOf(v) === i)

  for (const varName of variations) {
    try {
      const slug = encodeURIComponent(varName.trim().replace(/\s+/g, '_'))
      const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`
      const response = await fetch(url, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
      if (!response.ok) continue
      const json = await response.json()
      if (json.type === 'standard' || json.type === 'normal') {
        const imageUrl = json.originalimage?.source || json.thumbnail?.source
        if (imageUrl) {
          const lower = imageUrl.toLowerCase()
          const isUnusable = [
            '.svg', 'flag', 'bandera', 'escudo', 'coat_of_arms', 'coat of arms', 'blason', 'stemma',
            'seal', 'logo', 'icon', 'symbol', 'map', 'mapa', 'location', 'diagram', 'chart',
            'portrait', 'stamp', 'monochrome', 'drawing', 'sketch', 'illustration', 'bw_'
          ].some(k => lower.includes(k))
          if (!isUnusable) {
            return imageUrl
          }
        }
      }
    } catch {}
  }
  return null
}

export async function wikipediaSummaryText(placeName, city = '', country = '') {
  if (!placeName || typeof placeName !== 'string') return null
  const raw = placeName.trim()
  if (raw.length < 3) return null

  const cleaned = raw.replace(/\(.*?\)/g, '').replace(/_/g, ' ').trim()
  const cleanCity = String(city || '').replace(/_/g, ' ').trim()
  const cleanCountry = String(country || '').replace(/_/g, ' ').trim()

  // 1. Search in Spanish Wikipedia with full destination context
  try {
    const searchQuery = `${cleaned} ${cleanCity} ${cleanCountry}`.trim()
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*`
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
    if (sRes.ok) {
      const sJson = await sRes.json()
      const topHit = sJson?.query?.search?.[0]
      if (topHit && topHit.title) {
        const topTitleLower = topHit.title.toLowerCase()
        const cleanLower = cleaned.toLowerCase()
        const placeWords = cleanLower.split(/\s+/).filter(w => w.length >= 3 && !/^(parque|playa|sendero|cabo|bahia|bahía|hotel|isla|restaurante|el|la|los|las|de|del|en)$/i.test(w))
        const isBroadMismatch = (topTitleLower.includes('parque nacional') && !cleanLower.includes('parque nacional')) ||
                                (cleanCity && topTitleLower === cleanCity.toLowerCase())
        const hasSpecificWordMatch = placeWords.length === 0 || placeWords.some(w => topTitleLower.includes(w))

        if (!isBroadMismatch && hasSpecificWordMatch) {
          const slug = encodeURIComponent(topHit.title.replace(/\s+/g, '_'))
          const sumUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`
          const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
          if (sumRes.ok) {
            const sumJson = await sumRes.json()
            if (sumJson.extract && sumJson.extract.length > 40 && !sumJson.extract.includes('puede referirse a')) {
              const extractLower = sumJson.extract.toLowerCase()
              const isEnglish = /\b(is the|is a|was a|located in|town of|municipality of)\b/i.test(extractLower)
              const isForeignMismatch = (cleanCountry.toLowerCase() === 'colombia' || cleanCity.toLowerCase() === 'cartagena') &&
                (extractLower.includes('lanzarote') || extractLower.includes('canarias') || extractLower.includes('españa') || extractLower.includes('alicante'))
              if (!isEnglish && !isForeignMismatch) {
                return sumJson.extract
              }
            }
          }
        }
      }
    }
  } catch {}

  // 2. Direct slug variations in es.wikipedia.org ONLY
  const variations = [
    ...(cleanCity ? [`${cleaned} (${cleanCity})`, `${cleaned}, ${cleanCity}`] : []),
    cleaned
  ].filter((v, i, arr) => v && v.length >= 3 && arr.indexOf(v) === i)

  for (const varName of variations) {
    try {
      const slug = encodeURIComponent(varName.trim().replace(/\s+/g, '_'))
      const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`
      const response = await fetch(url, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
      if (!response.ok) continue
      const json = await response.json()
      if (json.type === 'standard' || json.type === 'normal') {
        if (json.extract && json.extract.length > 40 && !json.extract.includes('puede referirse a')) {
          const extractLower = json.extract.toLowerCase()
          const isEnglish = /\b(is the|is a|was a|located in|town of|municipality of)\b/i.test(extractLower)
          const isForeignMismatch = (cleanCountry.toLowerCase() === 'colombia' || cleanCity.toLowerCase() === 'cartagena') &&
            (extractLower.includes('lanzarote') || extractLower.includes('canarias') || extractLower.includes('españa') || extractLower.includes('alicante'))
          if (!isEnglish && !isForeignMismatch) {
            return json.extract
          }
        }
      }
    } catch {}
  }
  return null
}

async function wikimediaGeoImage(lat, lon, radiusMeters = 1000, indexSeed = 0) {
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('generator', 'geosearch')
    url.searchParams.set('ggscoord', `${lat}|${lon}`)
    url.searchParams.set('ggsradius', String(radiusMeters))
    url.searchParams.set('ggslimit', '10')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')

    const response = await fetch(url, { headers: { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' } })
    if (!response.ok) return null
    const json = await response.json()
    const pages = Object.values(json.query?.pages ?? {})

    const validPages = pages.filter((page) => {
      const title = page.title ?? ''
      const imageUrl = page.imageinfo?.[0]?.url ?? ''
      if (!imageUrl) return false
      
      const titleLower = title.toLowerCase()
      const isInvalidType = ['map', 'flag', 'bandera', 'logo', 'icon', 'symbol', 'location', 'mapa', 'coat_of_arms'].some(term => titleLower.includes(term))
      if (isInvalidType) return false

      return isImageTitleRelevant(title, '', null, imageUrl)
    })

    if (validPages.length === 0) return null
    const chosenPage = validPages[Math.abs(indexSeed) % validPages.length]
    return chosenPage?.imageinfo?.[0]?.url ?? null
  } catch {
    return null
  }
}

async function pexelsImage(query, indexSeed = 0) {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null
  try {
    const url = new URL('https://api.pexels.com/v1/search')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', '5')
    url.searchParams.set('orientation', 'landscape')

    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
        'User-Agent': 'VIBETOURS/1.0'
      }
    })
    if (!response.ok) return null
    const json = await response.json()
    const photos = json.photos ?? []
    if (photos.length === 0) return null

    const chosen = photos[Math.abs(indexSeed) % photos.length]
    return chosen?.src?.large2x || chosen?.src?.large || chosen?.src?.medium || null
  } catch {
    return null
  }
}

async function wikimediaImage(query, requiredGroups = null, indexSeed = 0) {
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('generator', 'search')
    url.searchParams.set('gsrsearch', query)
    url.searchParams.set('gsrnamespace', '6')
    url.searchParams.set('gsrlimit', '8')
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    const pages = Object.values(json.query?.pages ?? {})
    
    // Filtrar todos los resultados relevantes
    const relevantPages = pages.filter((page) => {
      const title = page.title ?? ''
      const imageUrl = page.imageinfo?.[0]?.url ?? ''
      return imageUrl && isImageTitleRelevant(title, query, requiredGroups, imageUrl)
    })
    
    if (relevantPages.length === 0) return null
    
    // Rotar imagen según la semilla para evitar repeticiones
    const chosenPage = relevantPages[Math.abs(indexSeed) % relevantPages.length]
    return chosenPage?.imageinfo?.[0]?.url ?? null
  } catch {
    return null
  }
}

async function openverseImage(query, requiredGroups = null, indexSeed = 0) {
  try {
    const url = new URL('https://api.openverse.engineering/v1/images/')
    url.searchParams.set('q', query)
    url.searchParams.set('page_size', '8')
    url.searchParams.set('license_type', 'commercial,modification')
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    
    // Filtrar todos los resultados relevantes
    const relevantMatches = (json.results ?? []).filter((result) => {
      const title = result.title ?? ''
      const imageUrl = result.url ?? result.thumbnail ?? ''
      return imageUrl && isImageTitleRelevant(title, query, requiredGroups, imageUrl)
    })
    
    if (relevantMatches.length === 0) return null
    
    // Rotar imagen según la semilla
    const chosenMatch = relevantMatches[Math.abs(indexSeed) % relevantMatches.length]
    return chosenMatch ? (chosenMatch.url ?? chosenMatch.thumbnail) : null
  } catch {
    return null
  }
}

function isImageTitleRelevant(title, query, requiredGroups = null, url = '') {
  if (!title) return false
  
  const titleLower = title.toLowerCase()
  const urlLower = (url || '').toLowerCase()
  
  // Filter out non-photo image types like maps, flags, logos, coats of arms, location diagrams
  const isInvalidType = ['map', 'mapa', 'flag', 'bandera', 'logo', 'icon', 'symbol', 'coat_of_arms', 'escudo', 'location_map', 'chart', 'diagram'].some(term => titleLower.includes(term) || urlLower.includes(term))
  if (isInvalidType) return false

  // Validar extensión del archivo
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const hasValidExtension = validExtensions.some(ext => 
    titleLower.endsWith(ext) || 
    urlLower.endsWith(ext) || 
    urlLower.includes(ext + '?') || 
    urlLower.includes(ext + '/')
  )
  if (!hasValidExtension) return false
  
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

function curatedImage(seed, category, indexSeed = 0) {
  const categoryImages = {
    beach: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
    ],
    trail: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    restaurant: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    ],
    cafe: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=600&q=75',
    ],
    market: [
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1488459718432-36c552ff77aa?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=75',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1486591978090-58e619d37fe7?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=75',
    ],
    museum: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1566121318594-a4f65f3a4c12?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1531243269054-5ebf6f3b0b6b?auto=format&fit=crop&w=600&q=75',
    ],
    historic: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1524874056196-53d7153a8ed9?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=600&q=75',
    ],
    religious: [
      'https://images.unsplash.com/photo-1548625361-155de6c7f54a?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1545637939-aa7f9e8dc9f0?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1590076212870-13f63901b0f1?auto=format&fit=crop&w=600&q=75',
    ],
    nature: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=75',
    ],
    viewpoint: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=75',
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1526676023771-736b6b7729b2?auto=format&fit=crop&w=600&q=75',
    ],
    default: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=75',
    ]
  }

  const seedLower = String(seed || '').toLowerCase()
  let targetCategory = category
  if (/playa|beach|bah[íi]a|bahia|cala|cabo|piscina|isla|arrecife|ensenada|costa/i.test(seedLower)) {
    targetCategory = 'beach'
  } else if (/sendero|pueblito|trek|camino|hiking|bosque|chairama/i.test(seedLower)) {
    targetCategory = 'trail'
  } else if (/restaurante|comida|cafe|café|bistro|bar|parador|kiosko|asador|gourmet|gastronom/i.test(seedLower)) {
    targetCategory = 'restaurant'
  }

  // 1. Si la categoría es específica, servir foto temática rotada
  const specificCategories = ['beach', 'trail', 'restaurant', 'cafe', 'market', 'nightlife', 'museum', 'religious', 'sports', 'nature', 'viewpoint', 'historic']
  const finalCategory = specificCategories.includes(targetCategory) ? targetCategory : 'default'
  
  if (finalCategory !== 'default') {
    const list = categoryImages[finalCategory]
    const idx = Math.abs(Number(indexSeed || 0)) % list.length
    return list[idx]
  }

  // 2. Solo para vistas panorámicas generales o portadas, verificar la ciudad
  const cityLower = String(seed || '').toLowerCase()
  if (cityLower.includes('tulum')) {
    return 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80' // Tulum Mayan cliff & turquoise sea
  } else if (cityLower.includes('miami')) {
    return 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80' // Miami South Beach / Biscayne Bay skyline
  } else if (cityLower.includes('cancun') || cityLower.includes('cancún')) {
    return 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80' // Cancun Caribbean turquoise beach
  } else if (cityLower.includes('barcelona')) {
    return 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80' // Sagrada Familia & Barcelona skyline
  } else if (cityLower.includes('madrid')) {
    return 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80' // Madrid Gran Via / Cibeles
  } else if (cityLower.includes('paris') || cityLower.includes('parís')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80' // Paris Eiffel Tower
  } else if (cityLower.includes('roma') || cityLower.includes('rome')) {
    return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80' // Colosseum Rome
  } else if (cityLower.includes('tokio') || cityLower.includes('tokyo')) {
    return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80' // Tokyo Skyline & Mount Fuji view
  } else if (cityLower.includes('new york') || cityLower.includes('nueva york')) {
    return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80' // New York Manhattan skyline
  } else if (cityLower.includes('bali')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80' // Bali scenic temple
  } else if (cityLower.includes('rio de janeiro') || cityLower.includes('rio')) {
    return 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80' // Rio Christ & Sugarloaf Bay
  } else if (cityLower.includes('londres') || cityLower.includes('london')) {
    return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80' // London Big Ben
  } else if (cityLower.includes('cusco') || cityLower.includes('cuzco') || cityLower.includes('machu')) {
    return 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80' // Machu Picchu / Cusco
  } else if (cityLower.includes('bogota') || cityLower.includes('bogotá')) {
    return 'https://images.unsplash.com/photo-1584305574647-0cc949a2da9f?auto=format&fit=crop&w=1200&q=80' // Bogota Monserrate
  } else if (cityLower.includes('medellin') || cityLower.includes('medellín')) {
    return 'https://images.unsplash.com/photo-1599388301549-3714578b820a?auto=format&fit=crop&w=1200&q=80' // Medellin
  } else if (cityLower.includes('cartagena')) {
    return 'https://images.unsplash.com/photo-1583531352515-888413146611?auto=format&fit=crop&w=1200&q=80' // Cartagena
  } else if (cityLower.includes('santa marta')) {
    return 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80' // Santa Marta Tayrona
  } else if (cityLower.includes('san andres') || cityLower.includes('san andrés')) {
    return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80' // San Andres Island
  }

  const list = categoryImages.default
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) + indexSeed
  return list[Math.abs(hash) % list.length]
}

export function destinationCoverImage(city = '', country = '') {
  return curatedImage(`${city} ${country}`, 'historic', 0)
}

