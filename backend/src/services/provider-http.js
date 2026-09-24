const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function wait(milliseconds) {
  if (!milliseconds) return Promise.resolve()
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function retryDelay(attempt, response) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, numberFromEnv('PROVIDER_RETRY_MAX_DELAY_MS', 1500))
  }

  const base = numberFromEnv(
    'PROVIDER_RETRY_DELAY_MS',
    process.env.NODE_ENV === 'test' ? 0 : 250
  )
  const max = numberFromEnv('PROVIDER_RETRY_MAX_DELAY_MS', 1500)
  return Math.min(max, base * (2 ** attempt))
}

function timeoutSignal(timeoutMs) {
  if (typeof AbortSignal?.timeout === 'function') return AbortSignal.timeout(timeoutMs)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

/**
 * Fetches an external provider with bounded retries for transient failures.
 * Authentication errors and other permanent 4xx responses are returned once.
 * A null result means the provider could not be reached after all attempts.
 */
export async function fetchWithProviderRetry(input, init = {}, {
  attempts = 3,
  timeoutMs = 4500,
  onRetry = null
} = {}) {
  const totalAttempts = Math.max(1, Number(attempts) || 1)
  let lastError = null

  for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: timeoutSignal(timeoutMs)
      })

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === totalAttempts - 1) {
        return response
      }

      const delay = retryDelay(attempt, response)
      onRetry?.({ attempt: attempt + 1, status: response.status, delay })
      await wait(delay)
    } catch (error) {
      lastError = error
      if (attempt === totalAttempts - 1) break
      const delay = retryDelay(attempt)
      onRetry?.({ attempt: attempt + 1, error, delay })
      await wait(delay)
    }
  }

  return lastError ? null : null
}

export function isRetryableProviderStatus(status) {
  return RETRYABLE_STATUS_CODES.has(Number(status))
}
