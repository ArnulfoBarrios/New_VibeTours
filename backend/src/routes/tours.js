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

toursRouter.get('/pending', async (req, res, next) => {
  try {
    if (!supabase) {
      res.json({ tours: [] })
      return
    }
    // Query for pending tours with proper filtering
    const { data, error } = await supabase
      .from('tours')
      .select('*, tour_stops(*)')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching pending tours:', error)
      throw error
    }

    const tours = data && Array.isArray(data) ? data : []
    res.json({ tours })
  } catch (error) {
    console.error('Pending tours endpoint error:', error.message)
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
      .insert({
        ...tour,
        created_by: tour.created_by ?? tour.owner_id ?? null,
        is_published: false,
        moderation_status: 'pending'
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ tour: data })
  } catch (error) {
    next(error)
  }
})

toursRouter.patch('/:id/moderate', async (req, res, next) => {
  try {
    const schema = z.object({
      approved: z.boolean(),
    })
    const { approved } = schema.parse(req.body)
    if (!supabase) {
      res.status(202).json({ ok: true, demo: true })
      return
    }
    const payload = {
      is_published: approved,
      moderation_status: approved ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('tours')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ tour: data })
  } catch (error) {
    next(error)
  }
})
