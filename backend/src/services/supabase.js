import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    const error = new Error('Supabase service role is not configured.')
    error.status = 503
    throw error
  }
  return supabase
}
