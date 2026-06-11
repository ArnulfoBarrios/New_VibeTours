import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../services/supabase.js'

export const toursRouter = Router()

toursRouter.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      res.json({ tours: [] })
      return
    }
    const { data, error } = await supabase
      .from('tours')
      .select('*, tour_stops(*)')
      .order('rating', { ascending: false })
      .limit(100)
    if (error) throw error
    const tours = data
      .filter((tour) => tour.is_published === true || tour.status === 'approved')
      .filter((tour) => matchesTourFilter(tour, req.query))
    res.json({ tours })
  } catch (error) {
    next(error)
  }
})

function matchesTourFilter(tour, query) {
  const source = tour.pending_edit_snapshot && typeof tour.pending_edit_snapshot === 'object'
    ? tour.pending_edit_snapshot
    : {}
  const meeting = source.punto_encuentro ?? {}
  const country = tour.country ?? meeting.pais ?? ''
  const city = tour.city ?? meeting.ciudad ?? ''
  const type = tour.type ?? source.tipo_tour ?? ''
  if (query.country && country !== query.country) return false
  if (query.city && city !== query.city) return false
  if (query.type && type !== query.type) return false
  return true
}

toursRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      city: z.string().min(1),
      country: z.string().min(1),
      type: z.string().min(1),
      description: z.string().min(10),
      cover_url: z.string().url(),
      stops: z.array(z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number()
      })).min(1)
    })
    const tour = schema.parse(req.body)
    if (!supabase) {
      res.status(202).json({ tour: { ...tour, id: crypto.randomUUID(), demo: true } })
      return
    }
    const { data, error } = await supabase
      .from('tours')
      .insert(tour)
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ tour: data })
  } catch (error) {
    next(error)
  }
})
