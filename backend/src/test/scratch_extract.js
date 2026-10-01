import { extractPoisFromText } from '../routes/ai.js'

const text = `¡Perfecto! Diseñé un tour de 1 día desde tu ubicación hasta Parque Alegra Barranquilla, pasando por atractivos en el camino:

Itinerario de Viaje: En ruta hacia Parque Alegra Barranquilla (1 día)

Día 1: En ruta hacia Parque Alegra Barranquilla
• Ecoparque Ciénaga de Mallorquín
• Parque Sagrado Corazón
• El Caimán del Río - Mercado Gastronómico
• Parque Washington
• La Troja
• Parque Alegra Barranquilla

¿Qué te parece este recorrido? ¿Deseas hacer algún cambio o procedemos a generar el tour en el mapa?`

console.log(extractPoisFromText(text))
