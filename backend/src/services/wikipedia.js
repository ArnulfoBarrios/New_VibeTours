export async function getWikipediaContext(query) {
  if (!query) return null
  
  try {
    // 1. Buscar el título más relevante
    const headers = { 'User-Agent': 'VIBETOURS/1.0 (ops@vibetours.app)' }
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`
    const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(4000) })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    
    if (!searchData.query?.search?.length) return null
    
    const title = searchData.query.search[0].title
    
    // 2. Obtener el extracto
    const summaryUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summaryRes = await fetch(summaryUrl, { headers, signal: AbortSignal.timeout(4000) })
    if (!summaryRes.ok) return null
    
    const summaryData = await summaryRes.json()
    
    return {
      title: summaryData.title,
      extract: summaryData.extract
    }
  } catch (err) {
    console.error('[wikipedia] fetch error:', err.message)
    return null
  }
}
