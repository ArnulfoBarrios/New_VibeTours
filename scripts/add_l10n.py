import json
import os

es_path = 'lib/src/l10n/app_es.arb'
en_path = 'lib/src/l10n/app_en.arb'

def add_keys(path, new_keys):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in new_keys.items():
        data[k] = v
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

es_keys = {
  "prefTravelPreferences": "Preferencias de viaje",
  "prefStepOf": "Paso {current} de {total}",
  "@prefStepOf": { "placeholders": { "current": {}, "total": {} } },
  "prefCompleteProfile": "Completar Perfil",
  "prefNext": "Siguiente",
  "prefSolo": "Solo",
  "prefCouple": "Pareja",
  "prefFriends": "Amigos",
  "prefFamily": "Familia",
  "prefBudgetEcon": "Económico",
  "prefBudgetMod": "Moderado",
  "prefBudgetLux": "Lujo",
  "prefTransWalk": "Caminando",
  "prefTransPub": "Transporte Público",
  "prefTransCar": "Auto Rentado",
  "prefTransTaxi": "Taxis/Apps",
  "prefTimeMorn": "Mañanas",
  "prefTimeAft": "Tardes",
  "prefTimeEve": "Noches",
  "prefIntBeaches": "Playas",
  "prefIntNature": "Naturaleza",
  "prefIntMuseums": "Museos",
  "prefIntMonuments": "Monumentos históricos",
  "prefIntGastronomy": "Gastronomía",
  "prefIntShopping": "Compras",
  "prefIntNightlife": "Vida nocturna",
  "prefIntAdventures": "Aventuras",
  "prefIntFamActivities": "Actividades familiares",
  "prefTitleTraveler": "Tipo de Viajero",
  "prefSubTraveler": "¿Con quién sueles viajar?",
  "prefTitleBudget": "Presupuesto Ideal",
  "prefSubBudget": "¿Cuál es tu presupuesto promedio por viaje?",
  "prefTitlePace": "Ritmo de Viaje",
  "prefSubPace": "¿Cómo prefieres vivir tus días de tour?",
  "prefPaceRelaxed": "Ritmo Relajado",
  "prefPaceRelaxedDesc": "Un lugar por día, mucho tiempo libre.",
  "prefPaceBalanced": "Ritmo Equilibrado",
  "prefPaceBalancedDesc": "Combinación ideal de visitas y descansos.",
  "prefPaceFast": "Ritmo Acelerado",
  "prefPaceFastDesc": "Ver lo más posible, sin parar.",
  "prefTitleTransport": "Modo de Transporte",
  "prefSubTransport": "¿Cómo prefieres moverte en el destino?",
  "prefTitleTime": "Horario Preferido",
  "prefSubTime": "¿En qué momento del día prefieres hacer tours?",
  "prefTitleInterests": "Tus Intereses",
  "prefSubInterests": "¿Qué te apasiona descubrir?",
  "prefTitleLocation": "Permisos de Ubicación",
  "prefSubLocation": "Para sugerirte lugares cercanos y optimizar tus rutas, necesitamos acceso a tu ubicación.",
  "prefBtnLocation": "Permitir Acceso",
  "prefAiPrompt": "Hola. Me gustaría que me diseñes un viaje para {traveler}, manejando un presupuesto {budget}. Prefiero llevar un ritmo {pace} y me gustaría moverme principalmente en {transport}. El momento ideal para mis actividades sería por las {time}. Mis intereses principales son: {interests}.",
  "@prefAiPrompt": { "placeholders": { "traveler": {}, "budget": {}, "pace": {}, "transport": {}, "time": {}, "interests": {} } }
}

en_keys = {
  "prefTravelPreferences": "Travel preferences",
  "prefStepOf": "Step {current} of {total}",
  "@prefStepOf": { "placeholders": { "current": {}, "total": {} } },
  "prefCompleteProfile": "Complete Profile",
  "prefNext": "Next",
  "prefSolo": "Solo",
  "prefCouple": "Couple",
  "prefFriends": "Friends",
  "prefFamily": "Family",
  "prefBudgetEcon": "Economic",
  "prefBudgetMod": "Moderate",
  "prefBudgetLux": "Luxury",
  "prefTransWalk": "Walking",
  "prefTransPub": "Public Transport",
  "prefTransCar": "Rental Car",
  "prefTransTaxi": "Taxis/Apps",
  "prefTimeMorn": "Mornings",
  "prefTimeAft": "Afternoons",
  "prefTimeEve": "Evenings",
  "prefIntBeaches": "Beaches",
  "prefIntNature": "Nature",
  "prefIntMuseums": "Museums",
  "prefIntMonuments": "Historical monuments",
  "prefIntGastronomy": "Gastronomy",
  "prefIntShopping": "Shopping",
  "prefIntNightlife": "Nightlife",
  "prefIntAdventures": "Adventures",
  "prefIntFamActivities": "Family activities",
  "prefTitleTraveler": "Traveler Type",
  "prefSubTraveler": "Who do you usually travel with?",
  "prefTitleBudget": "Ideal Budget",
  "prefSubBudget": "What is your average budget per trip?",
  "prefTitlePace": "Travel Pace",
  "prefSubPace": "How do you prefer to experience your tour days?",
  "prefPaceRelaxed": "Relaxed Pace",
  "prefPaceRelaxedDesc": "One place a day, lots of free time.",
  "prefPaceBalanced": "Balanced Pace",
  "prefPaceBalancedDesc": "Ideal mix of visits and breaks.",
  "prefPaceFast": "Fast Pace",
  "prefPaceFastDesc": "See as much as possible, non-stop.",
  "prefTitleTransport": "Transport Mode",
  "prefSubTransport": "How do you prefer to get around?",
  "prefTitleTime": "Preferred Time",
  "prefSubTime": "When do you prefer to do tours?",
  "prefTitleInterests": "Your Interests",
  "prefSubInterests": "What are you passionate about discovering?",
  "prefTitleLocation": "Location Permissions",
  "prefSubLocation": "To suggest nearby places and optimize your routes, we need access to your location.",
  "prefBtnLocation": "Allow Access",
  "prefAiPrompt": "Hi. I'd like you to design a trip for {traveler}, with a {budget} budget. I prefer a {pace} pace and would like to get around mainly by {transport}. The ideal time for my activities would be in the {time}. My main interests are: {interests}.",
  "@prefAiPrompt": { "placeholders": { "traveler": {}, "budget": {}, "pace": {}, "transport": {}, "time": {}, "interests": {} } }
}

add_keys(es_path, es_keys)
add_keys(en_path, en_keys)
print("Done")
