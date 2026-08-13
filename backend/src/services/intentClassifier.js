/**
 * Intent Classifier Service for VIBETOURS AI
 * Detects user intent with a confidence score threshold (default 0.70).
 * Handles ambiguous input (e.g. single word "presupuesto") by requesting brief clarification.
 */

const CONFIDENCE_THRESHOLD = 0.70

const INTENT_TYPES = {
  BUDGET_INQUIRY: 'budget_inquiry',
  LODGING_INQUIRY: 'lodging_inquiry',
  TRANSPORT_INQUIRY: 'transport_inquiry',
  ACTIVITY_INQUIRY: 'activity_inquiry',
  RESTAURANT_INQUIRY: 'restaurant_inquiry',
  EVENT_INQUIRY: 'event_inquiry',
  PLAN_TRIP: 'plan_trip',
  ADD_EVENT: 'add_event',
  AMBIGUOUS: 'ambiguous'
}

const CLARIFICATION_OPTIONS = [
  { id: 'budget', label: 'Presupuesto', prompt: 'Cuéntame tu preferencia de presupuesto (Económico, Moderado, Lujo)' },
  { id: 'transport', label: 'Transporte', prompt: '¿Cómo prefieres desplazarte? (Caminando, Transporte público, Auto rentado, Taxi)' },
  { id: 'lodging', label: 'Alojamiento', prompt: '¿Buscas hotel u hostal en tu destino?' },
  { id: 'activities', label: 'Actividades', prompt: '¿Qué tipo de actividades te interesan (cultura, naturaleza, gastronomía)?' },
  { id: 'restaurants', label: 'Restaurantes', prompt: '¿Quieres recomendaciones gastronómicas o lugares para comer?' },
  { id: 'events', label: 'Eventos', prompt: '¿Quieres consultar eventos culturales durante las fechas de tu viaje?' }
]

export function classifyUserIntent(userMessage = '', currentContext = {}) {
  const text = String(userMessage || '').trim()
  const lower = text.toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)
  const hasDestination = Boolean(currentContext.city || currentContext.destination || currentContext.canonicalDestination)

  // 1. Contextual Intent: If a destination/city is already chosen, category queries and chips are explicit inquiries for that city
  if (hasDestination) {
    if (/^(hotel|hoteles|alojamiento|hospedaje|d[oó]nde hospedarme|buscar hotel|opciones de hotel)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.LODGING_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }
    if (/^(restaurante|restaurantes|comida|comer|d[oó]nde comer|gastronom[íi]a|platos t[íi]picos|ver restaurantes)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.RESTAURANT_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }
    if (/^(evento|eventos|festival|festivales|concierto|conciertos|eventos locales|consultar eventos)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.EVENT_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }
    if (/\b(actividad|actividades|atracciones|lugares|qu[eé] hacer|sitios tur[íi]sticos|actividades acu[aá]ticas|tours? culturales?|aventura|naturaleza|playa|vida nocturna|snorkel|buceo|senderismo)\b/i.test(lower)) {
      return {
        intent: INTENT_TYPES.ACTIVITY_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }
    if (/^(transporte|auto|carro|coche|veh[íi]culo|c[oó]mo moverme)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.TRANSPORT_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }
    if (/^(presupuesto|budget|costo|cu[aá]nto cuesta)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.BUDGET_INQUIRY,
        confidence: 0.90,
        needsClarification: false
      }
    }

    // Any other selection or phrase in a destination context should proceed to the LLM
    return {
      intent: INTENT_TYPES.PLAN_TRIP,
      confidence: 0.85,
      needsClarification: false
    }
  }

  // 2. Single word or incomplete vague query WITHOUT destination
  if (words.length <= 1) {
    if (/^(presupuesto|budget)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.40,
        needsClarification: true,
        clarificationPrompt: '¿Qué estilo de presupuesto prefieres para tu viaje?',
        options: [
          { id: 'budget_eco', label: 'Económico' },
          { id: 'budget_mod', label: 'Moderado' },
          { id: 'budget_lux', label: 'Lujo' }
        ]
      }
    }
    if (/^(auto|carro|veh[íi]culo|transporte)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.45,
        needsClarification: true,
        clarificationPrompt: '¿Cuál será tu medio de transporte principal durante el tour?',
        options: [
          { id: 'trans_car', label: 'Auto rentado' },
          { id: 'trans_walk', label: 'Caminando' },
          { id: 'trans_pub', label: 'Transporte público' },
          { id: 'trans_taxi', label: 'Taxi / Uber' }
        ]
      }
    }
    if (/^(hotel|hoteles|alojamiento|hospedaje)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.45,
        needsClarification: true,
        clarificationPrompt: '¿Deseas que busquemos opciones de hotel o ya tienes alojamiento reservado?',
        options: [
          { id: 'lodging_yes', label: 'Recomiéndame hoteles' },
          { id: 'lodging_no', label: 'Tengo mi propio hospedaje' }
        ]
      }
    }
    if (/^(evento|eventos|festival|concierto|eventos locales)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.45,
        needsClarification: true,
        clarificationPrompt: 'Para consultar eventos, ¿a qué ciudad te gustaría viajar y en qué fechas?',
        options: [
          { id: 'city_cartagena', label: 'Cartagena' },
          { id: 'city_medellin', label: 'Medellín' },
          { id: 'city_miami', label: 'Miami' },
          { id: 'city_cancun', label: 'Cancún' }
        ]
      }
    }
    if (/^(restaurante|restaurantes|comida|gastronom[íi]a)$/i.test(lower)) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.45,
        needsClarification: true,
        clarificationPrompt: '¿Para qué ciudad te gustaría consultar opciones de restaurantes y gastronomía?',
        options: [
          { id: 'city_cartagena', label: 'Cartagena' },
          { id: 'city_medellin', label: 'Medellín' },
          { id: 'city_miami', label: 'Miami' },
          { id: 'city_cancun', label: 'Cancún' }
        ]
      }
    }

    if (text.length < 4) {
      return {
        intent: INTENT_TYPES.AMBIGUOUS,
        confidence: 0.30,
        needsClarification: true,
        clarificationPrompt: 'Por favor cuéntame a qué ciudad te gustaría viajar o qué tipo de experiencia buscas.',
        options: [
          { id: 'beach', label: 'Playa y Sol' },
          { id: 'culture', label: 'Cultura e Historia' },
          { id: 'adventure', label: 'Aventura y Naturaleza' }
        ]
      }
    }
  }

  // 3. Explicit Add Event intent
  if (/\b(agrega|agregar|a[ñn]adir|incluir|guarda|guardar)\b/i.test(lower) && /\b(evento|festival|concierto|feria|espectaculo|actividad)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.ADD_EVENT,
      confidence: 0.90,
      needsClarification: false,
      extractedSubject: text.replace(/\b(agrega|agregar|a[ñn]adir|incluir|guarda|guardar|al itinerario|al tour)\b/gi, '').trim()
    }
  }

  // 4. Clear Intent Detection Patterns
  if (/\b(quiero ir a|viajar a|conocer|visitar|armar un tour|planear viaje|itinerario para|crea un tour|tour por)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PLAN_TRIP,
      confidence: 0.92,
      needsClarification: false
    }
  }

  if (/\b(evento|eventos|festival|festivales|concierto|festivos|agenda cultural|que hay para hacer el)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.EVENT_INQUIRY,
      confidence: 0.88,
      needsClarification: false
    }
  }

  if (/\b(dónde hospedarme|buscar hotel|opciones de hotel|reserva de hotel|hospedaje|alojamiento)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.LODGING_INQUIRY,
      confidence: 0.85,
      needsClarification: false
    }
  }

  if (/\b(cuanto cuesta|presupuesto de|presupuesto economico|presupuesto moderado|presupuesto de lujo|costo estimado|mi presupuesto es)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUDGET_INQUIRY,
      confidence: 0.82,
      needsClarification: false
    }
  }

  if (/\b(como moverme|rentar auto|alquilar coche|transporte publico|ir en metro|ir en bus|tomar taxi|ir caminando)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.TRANSPORT_INQUIRY,
      confidence: 0.85,
      needsClarification: false
    }
  }

  if (/\b(donde comer|restaurantes|comida tipica|gastronomia|platos tipicos|mejores cafes)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.RESTAURANT_INQUIRY,
      confidence: 0.86,
      needsClarification: false
    }
  }

  if (/\b(que hacer|atracciones|museos|parques|lugares imperdibles|sitios turisticos)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.ACTIVITY_INQUIRY,
      confidence: 0.85,
      needsClarification: false
    }
  }

  // Default fallback check with thresholding
  const estimatedConfidence = words.length >= 3 ? 0.72 : 0.45
  if (estimatedConfidence < CONFIDENCE_THRESHOLD) {
    return {
      intent: INTENT_TYPES.AMBIGUOUS,
      confidence: estimatedConfidence,
      needsClarification: true,
      clarificationPrompt: '¿En qué aspecto de tu viaje te gustaría concentrarte ahora?',
      options: CLARIFICATION_OPTIONS
    }
  }

  return {
    intent: INTENT_TYPES.PLAN_TRIP,
    confidence: estimatedConfidence,
    needsClarification: false
  }
}

export { INTENT_TYPES, CLARIFICATION_OPTIONS, CONFIDENCE_THRESHOLD }
