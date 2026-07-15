import dotenv from 'dotenv'
import { collectTourCandidates } from '../routes/ai.js'

// Load environment variables
dotenv.config()

async function runTest() {
  console.log('Testing with a regional / nature destination: Tolú / ecological')
  
  const mockLocation = {
    latitude: 9.5218, // Tolú, Colombia
    longitude: -75.5814,
    city: 'Tolú',
    country: 'Colombia'
  }

  const mockInput = {
    destination: 'Tolú',
    city: 'Tolú',
    country: 'Colombia',
    type: 'ecological',
    durationHours: 24,
    prompt: 'quiero visitar las playas y las islas cercanas de los alrededores'
  }

  try {
    const result = await collectTourCandidates(mockInput, mockLocation)
    console.log(`Success! Found ${result.places.length} places (Source: ${result.source})`)
    console.log('Selected Places preview:')
    result.places.slice(0, 15).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} (Category: ${p.category}, Lat: ${p.latitude}, Lon: ${p.longitude})`)
    })
  } catch (error) {
    console.error('Error during test execution:', error)
  }
}

runTest()
