import { Router } from 'express'
import { z } from 'zod'

import { calculateRoute, normalizeRouteMode } from '../services/route-calculator.js'

export const routesRouter = Router()

const routeRequestSchema = z.object({
  points: z.array(z.object({
    latitude: z.number().finite(),
    longitude: z.number().finite()
  })).min(2).max(25),
  mode: z.enum(['driving', 'walking', 'cycling', 'taxi']).optional().default('driving')
})

routesRouter.post('/calculate', async (req, res, next) => {
  try {
    const input = routeRequestSchema.parse(req.body)
    const route = await calculateRoute({
      points: input.points,
      mode: normalizeRouteMode(input.mode)
    })

    if (!route) {
      res.status(503).json({
        error: 'route_unavailable',
        message: 'No se pudo calcular una ruta terrestre verificada.'
      })
      return
    }

    res.json(route)
  } catch (error) {
    next(error)
  }
})
