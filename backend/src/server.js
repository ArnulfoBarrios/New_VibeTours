import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { aiRouter } from './routes/ai.js'
import { chatRouter } from './routes/chat.js'
import { discoveryRouter } from './routes/discovery.js'
import { toursRouter } from './routes/tours.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

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

