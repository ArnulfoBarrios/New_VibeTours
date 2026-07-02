import re

path = 'lib/src/features/profile/tourist_preferences_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'flutter_gen/gen_l10n/app_localizations.dart' not in content:
    content = content.replace(
        "import '../../state/app_state.dart';", 
        "import '../../state/app_state.dart';\nimport 'package:flutter_gen/gen_l10n/app_localizations.dart';"
    )

# We will just write a function to map the English strings.
mapping = """
  String _tx(String key) {
    final l = AppLocalizations.of(context)!;
    switch (key) {
      case 'Solo': return l.prefSolo;
      case 'Pareja': return l.prefCouple;
      case 'Amigos': return l.prefFriends;
      case 'Familia': return l.prefFamily;
      case 'Económico': return l.prefBudgetEcon;
      case 'Moderado': return l.prefBudgetMod;
      case 'Lujo': return l.prefBudgetLux;
      case 'Relajado': return l.prefPaceRelaxed;
      case 'Equilibrado': return l.prefPaceBalanced;
      case 'Intenso': return l.prefPaceFast;
      case 'Caminando': return l.prefTransWalk;
      case 'Transporte Público': return l.prefTransPub;
      case 'Auto Rentado': return l.prefTransCar;
      case 'Taxis/Apps': return l.prefTransTaxi;
      case 'Mañanas': return l.prefTimeMorn;
      case 'Tardes': return l.prefTimeAft;
      case 'Noches': return l.prefTimeEve;
      case 'Playas': return l.prefIntBeaches;
      case 'Naturaleza': return l.prefIntNature;
      case 'Museos': return l.prefIntMuseums;
      case 'Monumentos históricos': return l.prefIntMonuments;
      case 'Gastronomía': return l.prefIntGastronomy;
      case 'Compras': return l.prefIntShopping;
      case 'Vida nocturna': return l.prefIntNightlife;
      case 'Aventuras': return l.prefIntAdventures;
      case 'Actividades familiares': return l.prefIntFamActivities;
      default: return key;
    }
  }
"""

if "String _tx(String key)" not in content:
    content = content.replace("void dispose() {", mapping + "\n  @override\n  void dispose() {")

# Replacing translations in UI
replacements = [
    ("'Paso ${_currentPage + 1} de 7'", "AppLocalizations.of(context)!.prefStepOf((_currentPage + 1).toString(), '7')"),
    ("_currentPage == 6 ? 'Completar Perfil' : 'Siguiente'", "_currentPage == 6 ? AppLocalizations.of(context)!.prefCompleteProfile : AppLocalizations.of(context)!.prefNext"),
    
    # Titles and Subtitles
    ("'¿Con quién viajas?'", "AppLocalizations.of(context)!.prefTitleTraveler"),
    ("'Ayúdanos a adaptar las recomendaciones al tamaño de tu grupo.'", "AppLocalizations.of(context)!.prefSubTraveler"),
    ("title: type,", "title: _tx(type),"),
    ("'¿Viajas con niños?'", "AppLocalizations.of(context)!.localeName == 'en' ? 'Traveling with kids?' : '¿Viajas con niños?'"),
    
    ("'Tu presupuesto ideal'", "AppLocalizations.of(context)!.prefTitleBudget"),
    ("'Nos ayudará a sugerirte restaurantes, compras y actividades adecuadas.'", "AppLocalizations.of(context)!.prefSubBudget"),
    ("title: b,", "title: _tx(b),"),
    
    ("'Ritmo de viaje'", "AppLocalizations.of(context)!.prefTitlePace"),
    ("'¿Prefieres tomarte tu tiempo o verlo todo?'", "AppLocalizations.of(context)!.prefSubPace"),
    ("title: 'Relajado',", "title: AppLocalizations.of(context)!.prefPaceRelaxed,"),
    ("subtitle: 'Pocas actividades por día, mucho tiempo libre.',", "subtitle: AppLocalizations.of(context)!.prefPaceRelaxedDesc,"),
    ("title: 'Equilibrado',", "title: AppLocalizations.of(context)!.prefPaceBalanced,"),
    ("subtitle: 'Una buena mezcla entre actividades y descanso.',", "subtitle: AppLocalizations.of(context)!.prefPaceBalancedDesc,"),
    ("title: 'Intenso',", "title: AppLocalizations.of(context)!.prefPaceFast,"),
    ("subtitle: 'Días llenos de acción para ver lo máximo posible.',", "subtitle: AppLocalizations.of(context)!.prefPaceFastDesc,"),
    
    ("'Transporte'", "AppLocalizations.of(context)!.prefTitleTransport"),
    ("'¿Cómo prefieres moverte por los lugares que visitas?'", "AppLocalizations.of(context)!.prefSubTransport"),
    ("title: t,", "title: _tx(t),"),
    
    ("'Horario Preferido'", "AppLocalizations.of(context)!.prefTitleTime"),
    ("'¿En qué momento del día prefieres realizar actividades turísticas?'", "AppLocalizations.of(context)!.prefSubTime"),
    
    ("'Tus Intereses'", "AppLocalizations.of(context)!.prefTitleInterests"),
    ("'Selecciona al menos 3 que te apasionen'", "AppLocalizations.of(context)!.prefSubInterests"),
    ("label: Text(interest", "label: Text(_tx(interest)"),
    
    ("'Permiso de Ubicación'", "AppLocalizations.of(context)!.prefTitleLocation"),
    ("'Para sugerirte lugares cercanos y guiarte durante los recorridos, necesitamos acceso a tu ubicación.'", "AppLocalizations.of(context)!.prefSubLocation"),
    ("'Permitir Acceso'", "AppLocalizations.of(context)!.prefBtnLocation"),
]

for old, new in replacements:
    content = content.replace(old, new)

# AI Prompt Template
old_prompt = """final prompt = 'Hola. Me gustaría que me diseñes un viaje para ${_travelerType.toLowerCase()}, manejando un presupuesto ${_budget.toLowerCase()}. Prefiero llevar un ritmo ${_preferredPace.toLowerCase()} y me gustaría moverme principalmente en ${_transportPreference.toLowerCase()}. El momento ideal para mis actividades sería por las ${_preferredTimeOfDay.toLowerCase()}. Mis intereses principales son: ${_interests.join(', ')}.';"""
new_prompt = """final l10n = AppLocalizations.of(context)!;
      final prompt = l10n.prefAiPrompt(
        _tx(_travelerType).toLowerCase(),
        _tx(_budget).toLowerCase(),
        _tx(_preferredPace).toLowerCase(),
        _tx(_transportPreference).toLowerCase(),
        _tx(_preferredTimeOfDay).toLowerCase(),
        _interests.map((i) => _tx(i)).join(', ')
      );"""
content = content.replace(old_prompt, new_prompt)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete")
