import 'dotenv/config'

import { getMissingProviderKeys, logProviderStatus } from '../services/provider-config.js'

const status = logProviderStatus()
const required = ['openai', 'mapbox', 'geoapify']
const missing = getMissingProviderKeys(process.env, required)

async function checkLiveProvider(provider) {
  const timeout = AbortSignal.timeout(7000)
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: timeout
      })
      return { ok: response.ok, status: response.status }
    }

    if (provider === 'mapbox') {
      const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/Bogota%20Colombia.json')
      url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN)
      url.searchParams.set('limit', '1')
      const response = await fetch(url, { signal: timeout })
      return { ok: response.ok, status: response.status }
    }

    if (provider === 'geoapify') {
      const url = new URL('https://api.geoapify.com/v1/geocode/search')
      url.searchParams.set('text', 'Bogota Colombia')
      url.searchParams.set('apiKey', process.env.GEOAPIFY_API_KEY)
      url.searchParams.set('limit', '1')
      const response = await fetch(url, { signal: timeout })
      return { ok: response.ok, status: response.status }
    }

    return { ok: false, status: null }
  } catch (error) {
    return { ok: false, status: null, error: error.name || 'network_error' }
  }
}

const live = process.argv.includes('--live')
const liveStatus = live
  ? Object.fromEntries(await Promise.all(required.map(async provider => [provider, await checkLiveProvider(provider)])))
  : undefined

console.log(JSON.stringify({
  checked: required,
  providers: Object.fromEntries(required.map(provider => [provider, status[provider]])),
  ...(live ? { live: liveStatus } : {}),
  ok: missing.length === 0 && (!live || Object.values(liveStatus).every(item => item.ok)),
  missing
}, null, 2))

if (missing.length > 0 || (live && Object.values(liveStatus).some(item => !item.ok))) process.exitCode = 1
