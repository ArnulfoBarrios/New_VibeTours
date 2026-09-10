import crypto from 'crypto'
import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../services/supabase.js'
import { requireAdminRole } from '../middleware/authMiddleware.js'

export const toursRouter = Router()

toursRouter.get('/', async (req, res, next) => {
  try {
    if (!supabase) {
      res.json({ tours: [] })
      return
    }
    let dbQuery = supabase
      .from('tours')
      .select('*, tour_stops(*)')
      .or('is_published.eq.true,status.eq.approved')
      .order('rating', { ascending: false })
      .limit(100)

    if (req.query.city) dbQuery = dbQuery.ilike('city', `%${req.query.city}%`)
    if (req.query.country) dbQuery = dbQuery.ilike('country', `%${req.query.country}%`)
    if (req.query.type) dbQuery = dbQuery.eq('type', req.query.type)

    const { data, error } = await dbQuery
    if (error) throw error
    const tours = (data || []).filter((tour) => matchesTourFilter(tour, req.query))
    res.json({ tours })
  } catch (error) {
    next(error)
  }
})

toursRouter.get('/pending', requireAdminRole, async (req, res, next) => {
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

function sanitizeText(input) {
  if (typeof input !== 'string') return ''
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim()
}

toursRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3).transform(sanitizeText),
      city: z.string().min(1).transform(sanitizeText),
      country: z.string().min(1).transform(sanitizeText),
      type: z.string().min(1).transform(sanitizeText),
      description: z.string().min(10).transform(sanitizeText),
      cover_url: z.string().url(),
      stops: z.array(z.object({
        name: z.string().transform(sanitizeText),
        latitude: z.number(),
        longitude: z.number()
      })).min(1)
    })
    const { stops, ...tourData } = schema.parse(req.body)
    if (!supabase) {
      res.status(202).json({ tour: { ...tourData, stops, id: crypto.randomUUID(), demo: true } })
      return
    }
    const { data: newTour, error: tourError } = await supabase
      .from('tours')
      .insert({
        ...tourData,
        created_by: req.user?.id ?? null,
        is_published: false,
        moderation_status: 'pending'
      })
      .select()
      .single()
    if (tourError) throw tourError

    if (Array.isArray(stops) && stops.length > 0) {
      const stopsPayload = stops.map((stop, index) => ({
        tour_id: newTour.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        order: index
      }))
      const { data: createdStops, error: stopsError } = await supabase
        .from('tour_stops')
        .insert(stopsPayload)
        .select()
      if (stopsError) {
        console.warn('[tours] Error inserting tour_stops:', stopsError.message)
      }
      newTour.tour_stops = createdStops || []
    }

    res.status(201).json({ tour: newTour })
  } catch (error) {
    next(error)
  }
})

toursRouter.patch('/:id/moderate', requireAdminRole, async (req, res, next) => {
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
