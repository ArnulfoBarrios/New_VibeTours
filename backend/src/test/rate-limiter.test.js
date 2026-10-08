import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { generalApiLimiter } from '../middleware/rate-limiter.js'

test('rate-limiter middleware enforces limits and returns HTTP 429 when threshold exceeded', async () => {
  const app = express()
  app.set('trust proxy', 1)

  // Fast test limiter: limit 3 requests per 1000ms
  const testLimiter = rateLimit({
    windowMs: 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    handler: (req, res) => {
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests'
      })
    }
  })

  app.get('/test-limit', testLimiter, (req, res) => {
    res.json({ ok: true })
  })

  const server = app.listen(0)
  const port = server.address().port

  try {
    // 1st request -> 200
    const res1 = await fetch(`http://localhost:${port}/test-limit`)
    assert.equal(res1.status, 200)

    // 2nd request -> 200
    const res2 = await fetch(`http://localhost:${port}/test-limit`)
    assert.equal(res2.status, 200)

    // 3rd request -> 200
    const res3 = await fetch(`http://localhost:${port}/test-limit`)
    assert.equal(res3.status, 200)

    // 4th request -> 429 Rate Limit Exceeded
    const res4 = await fetch(`http://localhost:${port}/test-limit`)
    assert.equal(res4.status, 429, '4th request must be blocked with 429')

    const body4 = await res4.json()
    assert.equal(body4.error, 'rate_limit_exceeded')
  } finally {
    server.close()
  }
})

test('generalApiLimiter allows health checks without consuming rate quota', async () => {
  const app = express()
  app.set('trust proxy', 1)
  app.use(generalApiLimiter)

  app.get('/health', (req, res) => res.json({ ok: true }))
  app.get('/api/health', (req, res) => res.json({ ok: true }))

  const server = app.listen(0)
  const port = server.address().port

  try {
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`http://localhost:${port}/health`)
      assert.equal(res.status, 200)
    }
  } finally {
    server.close()
  }
})
