const PROVIDER_ENV_KEYS = Object.freeze({
  openai: 'OPENAI_API_KEY',
  mapbox: 'MAPBOX_ACCESS_TOKEN',
  geoapify: 'GEOAPIFY_API_KEY',
  tomtom: 'TOMTOM_API_KEY'
})

function valueIsConfigured(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function looksLikeProviderKey(provider, value) {
  const key = String(value || '').trim()
  if (!key) return false
  if (provider === 'openai') return /^sk-[A-Za-z0-9_-]+$/.test(key)
  if (provider === 'mapbox') return /^(?:pk|sk)\.[A-Za-z0-9._-]+$/.test(key)
  if (provider === 'geoapify') return key.length >= 20
  if (provider === 'tomtom') return key.length >= 16
  return true
}

/**
 * Returns provider configuration without exposing credential values.
 * This is safe to use in health checks, logs and tests.
 */
export function getProviderStatus(env = process.env) {
  return Object.fromEntries(Object.entries(PROVIDER_ENV_KEYS).map(([provider, envKey]) => {
    const value = env?.[envKey]
    return [provider, {
      envKey,
      configured: valueIsConfigured(value),
      formatValid: looksLikeProviderKey(provider, value)
    }]
  }))
}

export function getMissingProviderKeys(env = process.env, providers = Object.keys(PROVIDER_ENV_KEYS)) {
  const status = getProviderStatus(env)
  return providers
    .filter(provider => status[provider] && (!status[provider].configured || !status[provider].formatValid))
    .map(provider => status[provider].envKey)
}

export function logProviderStatus(logger = console, env = process.env) {
  const status = getProviderStatus(env)
  const summary = Object.entries(status)
    .map(([provider, value]) => `${provider}=${value.configured && value.formatValid ? 'configured' : 'missing_or_invalid'}`)
    .join(' ')
  logger.info(`[provider-config] ${summary}`)
  return status
}

export { PROVIDER_ENV_KEYS }
