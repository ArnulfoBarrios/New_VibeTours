import dotenv from 'dotenv';
import path from 'path';
import { collectTourCandidates } from './src/routes/ai.js';
import { geocodePlace } from './src/services/osm.js';

// Load environmental variables from backend/.env
dotenv.config({ path: path.resolve('.env') });

async function run() {
  console.log('Testing collectTourCandidates for Curití (a small town with sparse geodata)...');
  
  const testInput = {
    destination: 'Curití',
    city: 'Curití',
    country: 'Colombia',
    type: 'cultural'
  };
  
  console.log('Geocoding Curití...');
  const location = await geocodePlace(`${testInput.destination} ${testInput.city} ${testInput.country}`);
  console.log('Location resolved:', location);
  
  if (!location) {
    console.error('FAILED: Could not geocode Curití.');
    return;
  }
  
  console.log('Running collectTourCandidates...');
  const results = await collectTourCandidates(testInput, location);
  
  console.log('Results:');
  console.log(JSON.stringify(results, null, 2));
  
  if (results && results.places && results.places.length >= 3) {
    console.log(`SUCCESS: Found ${results.places.length} candidate places.`);
    console.log('Candidate names:', results.places.map(p => p.name));
    console.log('Candidate source:', results.source);
    
    // Check if they are the AI suggested ones and if they have coordinates
    const hasCoordinates = results.places.every(p => p.latitude !== 0 && p.longitude !== 0);
    console.log('All candidates have valid coordinates:', hasCoordinates);
  } else {
    console.log('FAILED: Could not collect candidates.');
  }
}

run().catch(err => {
  console.error('Error running test:', err);
});
