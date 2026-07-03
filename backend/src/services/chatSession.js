import { supabase } from './supabase.js'

// Fallback in memory in case DB is not yet created or disconnected during dev
const memorySessions = new Map()

export async function getSession(sessionId) {
  if (!supabase) return memorySessions.get(sessionId) || null

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.warn('[chatSession] Failed to fetch from DB, falling back to memory:', error.message)
      return memorySessions.get(sessionId) || null
    }

    return data
  } catch (err) {
    console.error('[chatSession] DB connection error:', err.message)
    return memorySessions.get(sessionId) || null
  }
}

export async function saveSession(sessionId, stateData) {
  const payload = {
    session_id: sessionId,
    current_state: stateData.currentState,
    collected_data: stateData.collectedData,
    history: stateData.history,
    updated_at: new Date().toISOString()
  }

  if (!supabase) {
    memorySessions.set(sessionId, payload)
    return payload
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert(payload, { onConflict: 'session_id' })
      .select()
      .single()

    if (error) {
      console.warn('[chatSession] Failed to save to DB, falling back to memory:', error.message)
      memorySessions.set(sessionId, payload)
      return payload
    }
    
    return data
  } catch (err) {
    console.error('[chatSession] DB save error:', err.message)
    memorySessions.set(sessionId, payload)
    return payload
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
