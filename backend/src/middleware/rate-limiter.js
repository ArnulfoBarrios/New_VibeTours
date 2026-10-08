import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

/**
 * Resolves a unique client identifier for rate limiting.
 * Prioritizes authenticated user identity (Bearer token or userId)
 * to avoid grouping multiple different travelers on the same shared Wi-Fi/NAT.
 */
function resolveClientIdentifier(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return `auth_${authHeader.slice(7, 39)}`
  }

  const userId = req.body?.userId || req.query?.userId
  if (userId && typeof userId === 'string' && userId.length > 5) {
    return `user_${userId}`
  }

  return ipKeyGenerator(req.ip || '127.0.0.1')
}

/**
 * Standard response handler when a rate limit is exceeded.
 */
function createLimitExceededHandler(customMessage) {
  return (req, res /* , next, options */) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: customMessage || 'Has superado el límite de solicitudes. Por favor, espera un momento antes de reintentar.'
    })
  }
}

/**
 * General API limiter for light routes (catalog, discovery, weather).
 * Allows up to 120 requests per minute per client.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientIdentifier,
  validate: { keyGeneratorIpFallback: false },
  handler: createLimitExceededHandler('Demasiadas solicitudes. Por favor, espera un momento.'),
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health' || req.path === '/api/health'
})

/**
 * Heavy AI Tour Generation Limiter.
 * Generation queries multiple external APIs (OpenAI, Overpass, Wikipedia, TomTom).
 * Allows up to 10 requests every 5 minutes per client.
 */
export const tourGenerationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientIdentifier,
  validate: { keyGeneratorIpFallback: false },
  handler: createLimitExceededHandler('Has alcanzado el límite de generaciones de tours por ahora. Por favor, espera unos minutos.')
})

/**
 * Text-to-Speech (TTS) Limiter.
 * Prevents audio synthesis abuse and preserves OpenAI / ElevenLabs quota.
 * Allows up to 40 audio synthesis requests per minute per client.
 */
export const speechLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientIdentifier,
  validate: { keyGeneratorIpFallback: false },
  handler: createLimitExceededHandler('Demasiadas solicitudes de audio simultáneas. Por favor espera un momento.')
})

/**
 * Conversational Assistant (Chat) Limiter.
 * Allows up to 30 chat messages per minute per client.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientIdentifier,
  validate: { keyGeneratorIpFallback: false },
  handler: createLimitExceededHandler('Estás enviando mensajes demasiado rápido. Por favor, espera un momento.')
})
