import 'dotenv/config'

import { requireSupabase } from '../services/supabase.js'

const supabase = requireSupabase()

console.log('Seeding disabled for system tours. VibeTours now operates strictly with user-created tours.')
