import { generateChatResponse } from './src/services/openai.js'

async function run() {
  const t0 = Date.now()
  console.log('[bench] Starting generateChatResponse for Pereira confirm...')
  const prefs = {
    destination: 'Pereira',
    city: 'Pereira',
    country: 'Colombia',
    durationDays: 2,
    companions: 'En pareja',
    budget: 'Moderado',
    accommodationStatus: 'Casa propia / familiar',
    specificPlaces: [
      { name: 'Plaza de Bolívar', dia: 1 },
      { name: 'Catedral de Nuestra Señora de la Pobreza', dia: 1 },
      { name: 'Bioparque Ukumarí', dia: 2 }
    ]
  }

  const res = await generateChatResponse(
    { history: [{ role: 'user', content: '🚀 Confirmar y generar tour' }] },
    `Preferencias: ${JSON.stringify(prefs)}`,
    '',
    prefs
  )
  console.log(`[bench] Finished in ${Date.now() - t0}ms`)
  console.log('readyToBuild:', res.readyToBuild)
  console.log('actionChips:', res.actionChips)
  console.log('responseMessage:\n', res.responseMessage)
}

run().catch(console.error)
