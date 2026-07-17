import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  try {
    // 1. Get Arnulfo's user profile
    console.log('--- USER PROFILE ---')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%thearnulfo@gmail.com%')
    
    if (userError) throw userError
    console.log('Users found:', users)

    if (users.length === 0) {
      console.log('No user found with email thearnulfo@gmail.com')
      process.exit(0)
    }

    const userId = users[0].id
    console.log(`Using user ID: ${userId}`)

    // 2. Count tours owned by this user
    console.log('--- TOURS OWNED BY USER ---')
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, title, city, owner_id, created_by, moderation_status, is_published')
      .or(`owner_id.eq.${userId},created_by.eq.${userId}`)
    
    if (toursError) throw toursError
    console.log(`Tours count: ${tours.length}`)
    console.log('Tours:', tours)

    // 3. Count total tours in the database
    console.log('--- TOTAL TOURS IN DATABASE ---')
    const { count, error: countError } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
    
    if (countError) throw countError
    console.log(`Total tours: ${count}`)

    // 4. Query pg_policies to see active RLS policies on tours
    console.log('--- ACTIVE RLS POLICIES ON TOURS ---')
    try {
      const { data: rawPolicies, error: rawPoliciesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'tours')
      if (rawPoliciesError) throw rawPoliciesError
      console.log('Policies found in pg_policies:', rawPolicies)
    } catch (e) {
      console.log('Could not query pg_policies directly:', e.message)
    }

    // 5. Query tour_participants table to verify existence and count
    console.log('--- TOUR PARTICIPANTS ---')
    try {
      const { count, error: participantsError } = await supabase
        .from('tour_participants')
        .select('*', { count: 'exact', head: true })
      if (participantsError) throw participantsError
      console.log(`Tour participants count: ${count}`)
    } catch (e) {
      console.error('Error querying tour_participants:', e.message)
    }

    // 6. Query admin_account table to verify existence and count
    console.log('--- ADMIN ACCOUNT ---')
    try {
      const { count, error: adminError } = await supabase
        .from('admin_account')
        .select('*', { count: 'exact', head: true })
      if (adminError) throw adminError
      console.log(`Admin accounts count: ${count}`)
    } catch (e) {
      console.error('Error querying admin_account:', e.message)
    }

  } catch (err) {
    console.error('Database check failed:', err)
  }
}

run()
