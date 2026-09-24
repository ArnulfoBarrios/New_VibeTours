import { suggestPlacesWithOpenAI, suggestHotelsWithOpenAI, fetchCityIconicLandmarks } from './src/services/openai.js'

async function debug() {
  console.log('--- Testing suggestHotelsWithOpenAI ---')
  const hotels = await suggestHotelsWithOpenAI({ destination: 'Montería', country: 'Colombia', budget: 'Moderado' })
  console.log('Hotels Montería:', hotels)

  console.log('\n--- Testing suggestPlacesWithOpenAI ---')
  const places = await suggestPlacesWithOpenAI({ destination: 'Montería', country: 'Colombia', count: 6 })
  console.log('Places Montería:', places)

  console.log('\n--- Testing fetchCityIconicLandmarks ---')
  const iconics = await fetchCityIconicLandmarks('Montería', 'Colombia')
  console.log('Iconics Montería:', iconics)
}

debug().catch(console.error)
