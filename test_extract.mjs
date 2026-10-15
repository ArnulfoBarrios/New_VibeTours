import { generateChatResponse } from './backend/src/services/openai.js'

const msg = 'Quiero un tour desde mi ubicacion a Guatape por 1 dia en auto con amigos, presupuesto moderado'
const known = { userGpsLatitude: 10.9685, userGpsLongitude: -74.7813 }
const res = await generateChatResponse(msg, known, [])
console.log('Result:', JSON.stringify(res, null, 2))
