import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import path from 'path'

import { aiRouter } from './routes/ai.js'
import { chatRouter } from './routes/chat.js'
import { discoveryRouter } from './routes/discovery.js'
import { toursRouter } from './routes/tours.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        "font-src": ["'self'", "fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:"],
      },
    },
  })
)
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')))

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    name: 'VIBETOURS API',
    now: new Date().toISOString()
  })
})

app.use('/api/tours', toursRouter)
app.use('/api/ai', aiRouter)
app.use('/api/chat', chatRouter)
app.use('/api/discovery', discoveryRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((error, req, res, next) => {
  console.error('[express-error]', error)
  const status = error.status ?? (error.name === 'ZodError' ? 400 : 500)
  res.status(status).json({
    error: error.message ?? 'Internal server error',
    issues: error.issues
  })
})

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`VIBETOURS API listening on http://localhost:${port}`)
  })
}

export default app

