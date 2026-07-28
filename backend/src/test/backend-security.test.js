import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { toursRouter } from '../routes/tours.js'

test('security middleware blocks unauthorized access to pending tours', async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/tours', toursRouter)

  const server = app.listen(0)
  const port = server.address().port

  try {
    // 1. Unauthenticated GET /api/tours/pending -> should return 401
    const resUnauth = await fetch(`http://localhost:${port}/api/tours/pending`)
    assert.equal(resUnauth.status, 401, 'Unauthenticated request must be blocked with 401')

    // 2. Authenticated with x-admin-secret -> should pass middleware
    const resAuth = await fetch(`http://localhost:${port}/api/tours/pending`, {
      headers: { 'x-admin-secret': 'vibetours-admin-dev-secret' }
    })
    assert.equal(resAuth.status, 200, 'Authenticated request with admin secret should succeed with 200')
    const json = await resAuth.json()
    assert.ok(Array.isArray(json.tours), 'Response should contain tours array')
  } finally {
    server.close()
  }
})

test('security middleware blocks unauthorized moderation PATCH', async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/tours', toursRouter)

  const server = app.listen(0)
  const port = server.address().port

  try {
    const resUnauth = await fetch(`http://localhost:${port}/api/tours/123/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true })
    })
    assert.equal(resUnauth.status, 401, 'Unauthenticated moderation request must return 401')
  } finally {
    server.close()
  }
})
