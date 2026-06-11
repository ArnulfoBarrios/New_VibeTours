import 'dotenv/config'

import { buildSeedTours } from '../data/seedTours.js'
import { requireSupabase } from '../services/supabase.js'

const supabase = requireSupabase()
const tours = buildSeedTours()

for (const tour of tours) {
  const { stops, slug, ...tourRow } = tour
  const { data, error } = await supabase
    .from('tours')
    .upsert({ slug, ...tourRow, is_published: true }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (error) throw error
  await supabase.from('tour_stops').delete().eq('tour_id', data.id)
  const { error: stopsError } = await supabase.from('tour_stops').insert(
    stops.map((stop) => ({
      tour_id: data.id,
      ...stop
    }))
  )
  if (stopsError) throw stopsError
  console.log(`Seeded ${tour.title}`)
}

console.log(`Seed complete: ${tours.length} tours`)
