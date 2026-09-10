import { supabase } from './supabase.js'

import { GeoCache } from './geoCache.js'

// Fallback in memory with TTL and max entries
const memorySessions = new GeoCache(24 * 60 * 60 * 1000, 500)

function formatSession(raw) {
  if (!raw) return null
  const collected = raw.collected_data || raw.collectedData || {}
  return {
    sessionId: raw.session_id || raw.sessionId,
    currentState: raw.current_state || raw.currentState || 'WELCOME',
    current_state: raw.current_state || raw.currentState || 'WELCOME',
    collectedData: collected,
    collected_data: collected,
    history: raw.history || [],
    places: raw.places || collected.places || [],
    finalTour: raw.finalTour || collected.finalTour || null
  }
}

export async function getSession(sessionId) {
  if (!supabase) {
    return formatSession(memorySessions.get(sessionId))
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.warn('[chatSession] Failed to fetch from DB, falling back to memory:', error.message)
      return formatSession(memorySessions.get(sessionId))
    }

    return formatSession(data)
  } catch (err) {
    console.error('[chatSession] DB connection error:', err.message)
    return formatSession(memorySessions.get(sessionId))
  }
}

export async function saveSession(sessionId, stateData) {
  const collected = {
    ...(stateData.collectedData || stateData.collected_data || {}),
    places: stateData.places || [],
    finalTour: stateData.finalTour || null
  }
  const payload = {
    session_id: sessionId,
    current_state: stateData.currentState || stateData.current_state || 'WELCOME',
    collected_data: collected,
    history: stateData.history || [],
    updated_at: new Date().toISOString()
  }

  memorySessions.set(sessionId, payload)

  if (!supabase) {
    return formatSession(payload)
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert(payload, { onConflict: 'session_id' })
      .select()
      .single()

    if (error) {
      console.warn('[chatSession] Failed to save to DB, using memory:', error.message)
      return formatSession(payload)
    }
    
    return formatSession(data)
  } catch (err) {
    console.error('[chatSession] DB save error:', err.message)
    return formatSession(payload)
  }
}

export function initializeSession(sessionId) {
  return {
    sessionId,
    currentState: 'WELCOME',
    collectedData: {
      city: null,
      budget: null,
      travelers: null,
      hasMinors: null,
      duration: null,
      pace: null,
      schedule: null,
      transportation: null,
      interests: []
    },
    history: []
  }
}
