/**
 * Service to perform live web search using Tavily API (free tier 1000 requests/mo)
 * with graceful fallbacks (DuckDuckGo HTML scraping/API or empty result if offline).
 */
export async function searchWebForTravel({ query, destination, city, country, dates }) {
  const tavilyApiKey = process.env.TAVILY_API_KEY
  const searchQuery = query || `eventos turismo clima atracciones imperdibles en ${city || destination} ${country || ''} ${dates || ''}`.trim()

  console.info(`[webSearch] Searching live web for travel info: "${searchQuery}"`)

  if (tavilyApiKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchQuery,
          search_depth: 'basic',
          include_answer: true,
          max_results: 4
        })
      })

      if (response.ok) {
        const data = await response.json()
        const answer = data.answer || ''
        const results = (data.results || []).map(r => `${r.title}: ${r.content}`).join('\n')
        console.info('[webSearch] Tavily search succeeded')
        return {
          source: 'tavily',
          summary: answer ? `${answer}\n${results}` : results
        }
      } else {
        console.warn(`[webSearch] Tavily API response non-ok: ${response.status}`)
      }
    } catch (err) {
      console.error('[webSearch] Tavily API error:', err.message)
    }
  }

  // Fallback: DuckDuckGo Instant Answer API (Free, no key required)
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`
    const ddgRes = await fetch(ddgUrl)
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json()
      const abstract = ddgData.AbstractText || ''
      const topics = (ddgData.RelatedTopics || [])
        .slice(0, 3)
        .map(t => t.Text)
        .filter(Boolean)
        .join('. ')

      if (abstract || topics) {
        console.info('[webSearch] DuckDuckGo search fallback succeeded')
        return {
          source: 'duckduckgo',
          summary: `${abstract} ${topics}`.trim()
        }
      }
    }
  } catch (err) {
    console.warn('[webSearch] DuckDuckGo fallback error:', err.message)
  }

  return {
    source: 'none',
    summary: `Información de turismo para ${city || destination}: Atracciones populares, restaurantes locales e hitos icónicos.`
  }
}
