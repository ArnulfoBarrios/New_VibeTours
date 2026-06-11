enum TourType {
  urban,
  historical,
  gastronomic,
  cultural,
  ecological,
  romantic,
  sports,
  night,
  family,
  custom,
}

enum TourDifficulty { easy, moderate, intense }

class GeoPoint {
  const GeoPoint({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
  };
}

class TourLocationInfo {
  const TourLocationInfo({
    required this.nombreLugar,
    required this.direccion,
    required this.ciudad,
    required this.region,
    required this.pais,
    required this.placeId,
    required this.urlMapa,
  });

  final String nombreLugar;
  final String direccion;
  final String ciudad;
  final String region;
  final String pais;
  final String placeId;
  final String urlMapa;

  static const empty = TourLocationInfo(
    nombreLugar: '',
    direccion: '',
    ciudad: '',
    region: '',
    pais: '',
    placeId: '',
    urlMapa: '',
  );

  bool get isEmpty =>
      nombreLugar.isEmpty &&
      direccion.isEmpty &&
      ciudad.isEmpty &&
      region.isEmpty &&
      pais.isEmpty &&
      placeId.isEmpty &&
      urlMapa.isEmpty;

  Map<String, dynamic> toCreationJson() => {
    'nombre_lugar': nombreLugar,
    'direccion': direccion,
    'ciudad': ciudad,
    'region': region,
    'pais': pais,
    'place_id': placeId,
    'url_mapa': urlMapa,
  };
}

class TourBudget {
  const TourBudget({
    required this.low,
    required this.medium,
    required this.high,
  });

  final int low;
  final int medium;
  final int high;

  static const empty = TourBudget(low: 0, medium: 0, high: 0);

  Map<String, dynamic> toCreationJson() => {
    'bajo': low,
    'medio': medium,
    'alto': high,
  };
}

class TourAdditionalInfo {
  const TourAdditionalInfo({
    required this.accesibilidad,
    required this.mascotasPermitidas,
    required this.aptoParaNinos,
    required this.aptoParaAdultosMayores,
  });

  final String accesibilidad;
  final bool mascotasPermitidas;
  final bool aptoParaNinos;
  final bool aptoParaAdultosMayores;

  static const standard = TourAdditionalInfo(
    accesibilidad: 'Consultar condiciones de accesibilidad en cada parada.',
    mascotasPermitidas: false,
    aptoParaNinos: true,
    aptoParaAdultosMayores: true,
  );

  Map<String, dynamic> toCreationJson() => {
    'accesibilidad': accesibilidad,
    'mascotas_permitidas': mascotasPermitidas,
    'apto_para_ninos': aptoParaNinos,
    'apto_para_adultos_mayores': aptoParaAdultosMayores,
  };
}

class TourStop {
  const TourStop({
    required this.id,
    required this.name,
    required this.location,
    required this.imageUrl,
    required this.description,
    required this.activities,
    required this.tips,
    required this.suggestedMinutes,
    this.order = 0,
    this.curiousFacts = const [],
    this.locationInfo = TourLocationInfo.empty,
    this.images = const [],
  });

  final String id;
  final String name;
  final GeoPoint location;
  final String imageUrl;
  final String description;
  final List<String> activities;
  final List<String> tips;
  final int suggestedMinutes;
  final int order;
  final List<String> curiousFacts;
  final TourLocationInfo locationInfo;
  final List<String> images;

  TourStop copyWith({int? order}) => TourStop(
    id: id,
    name: name,
    location: location,
    imageUrl: imageUrl,
    description: description,
    activities: activities,
    tips: tips,
    suggestedMinutes: suggestedMinutes,
    order: order ?? this.order,
    curiousFacts: curiousFacts,
    locationInfo: locationInfo,
    images: images,
  );

  Map<String, dynamic> toCreationJson(int index) => {
    'parada': index + 1,
    'nombre': name,
    'descripcion': description,
    'duracion_estimada': _minutesLabel(suggestedMinutes),
    'actividades': activities,
    'datos_curiosos': curiousFacts,
    'consejos': tips,
    'ubicacion': locationInfo.toCreationJson(),
    'imagenes': images.isEmpty ? [if (imageUrl.isNotEmpty) imageUrl] : images,
  };
}

class Tour {
  const Tour({
    required this.id,
    required this.title,
    required this.country,
    required this.city,
    required this.type,
    required this.description,
    required this.coverUrl,
    required this.gallery,
    required this.durationHours,
    required this.distanceKm,
    required this.rating,
    required this.reviewCount,
    required this.likes,
    required this.difficulty,
    required this.language,
    required this.tags,
    required this.stops,
    this.isPublished = true,
    this.isAiGenerated = false,
    this.shortSummary = '',
    this.subcategories = const [],
    this.featuredExperience = '',
    this.placeHistory = '',
    this.culturalContext = '',
    this.availableLanguages = const [],
    this.recommendedAudience = const [],
    this.bestSeason = '',
    this.recommendedSchedule = '',
    this.meetingPoint = '',
    this.meetingPointInfo = TourLocationInfo.empty,
    this.includes = const [],
    this.excludes = const [],
    this.recommendations = const [],
    this.whatToBring = const [],
    this.tourRules = const [],
    this.keywords = const [],
    this.mainCategory = '',
    this.budget = TourBudget.empty,
    this.additionalInfo = TourAdditionalInfo.standard,
  });

  final String id;
  final String title;
  final String country;
  final String city;
  final TourType type;
  final String description;
  final String coverUrl;
  final List<String> gallery;
  final double durationHours;
  final double distanceKm;
  final double rating;
  final int reviewCount;
  final int likes;
  final TourDifficulty difficulty;
  final String language;
  final List<String> tags;
  final List<TourStop> stops;
  final bool isPublished;
  final bool isAiGenerated;
  final String shortSummary;
  final List<String> subcategories;
  final String featuredExperience;
  final String placeHistory;
  final String culturalContext;
  final List<String> availableLanguages;
  final List<String> recommendedAudience;
  final String bestSeason;
  final String recommendedSchedule;
  final String meetingPoint;
  final TourLocationInfo meetingPointInfo;
  final List<String> includes;
  final List<String> excludes;
  final List<String> recommendations;
  final List<String> whatToBring;
  final List<String> tourRules;
  final List<String> keywords;
  final String mainCategory;
  final TourBudget budget;
  final TourAdditionalInfo additionalInfo;

  GeoPoint get center => stops.isEmpty
      ? const GeoPoint(latitude: 10.9878, longitude: -74.7889)
      : stops.first.location;

  Map<String, dynamic> toCreationJson() => {
    'nombre_tour': title,
    'resumen_corto': shortSummary.isEmpty ? description : shortSummary,
    'tipo_tour': tourTypeLabel(type),
    'subcategorias': subcategories.isEmpty ? tags : subcategories,
    'descripcion_tour': description,
    'experiencia_destacada': featuredExperience,
    'historia_del_lugar': placeHistory,
    'contexto_cultural': culturalContext,
    'duracion_estimada': _hoursLabel(durationHours),
    'distancia_total': _distanceLabel(distanceKm),
    'nivel_dificultad': difficultyLabel(difficulty),
    'idiomas_disponibles': availableLanguages.isEmpty
        ? [language]
        : availableLanguages,
    'publico_recomendado': recommendedAudience,
    'mejor_epoca': bestSeason,
    'horario_recomendado': recommendedSchedule,
    'punto_encuentro': _meetingPointJson(),
    'imagen_portada': coverUrl,
    'galeria_tour': gallery,
    'itinerario': [
      for (final entry in stops.asMap().entries)
        entry.value.toCreationJson(entry.key),
    ],
    'orden_paradas': [
      for (final entry in stops.asMap().entries)
        {'orden': entry.key + 1, 'nombre': entry.value.name},
    ],
    'incluye': includes,
    'no_incluye': excludes,
    'recomendaciones': recommendations,
    'que_llevar': whatToBring,
    'normas_del_tour': tourRules,
    'etiquetas': tags,
    'palabras_clave': keywords,
    'categoria_principal': mainCategory.isEmpty
        ? tourTypeLabel(type)
        : mainCategory,
    'presupuesto_estimado_usd': budget.toCreationJson(),
    'informacion_adicional': additionalInfo.toCreationJson(),
  };

  Map<String, dynamic> _meetingPointJson() {
    if (!meetingPointInfo.isEmpty) {
      return meetingPointInfo.toCreationJson();
    }
    return {
      'nombre_lugar': meetingPoint,
      'direccion': '',
      'ciudad': city,
      'region': '',
      'pais': country,
      'place_id': '',
      'url_mapa': '',
    };
  }
}

class NearbyPlace {
  const NearbyPlace({
    required this.name,
    required this.type,
    required this.distanceMeters,
    required this.location,
  });

  final String name;
  final String type;
  final int distanceMeters;
  final GeoPoint location;
}

class WeatherSnapshot {
  const WeatherSnapshot({
    required this.temperatureC,
    required this.apparentC,
    required this.humidity,
    required this.windKmh,
    required this.condition,
    required this.code,
    required this.isDay,
  });

  final int temperatureC;
  final int apparentC;
  final int humidity;
  final int windKmh;
  final String condition;
  final int code;
  final bool isDay;
}

class LocalEvent {
  const LocalEvent({
    required this.id,
    required this.title,
    required this.city,
    required this.category,
    required this.startsAt,
    required this.imageUrl,
    required this.location,
  });

  final String id;
  final String title;
  final String city;
  final String category;
  final DateTime startsAt;
  final String imageUrl;
  final GeoPoint location;
}

class TouristProfile {
  const TouristProfile({
    required this.interests,
    required this.preferredPace,
    required this.favoriteCountries,
    required this.aiSummary,
  });

  final List<String> interests;
  final String preferredPace;
  final List<String> favoriteCountries;
  final String aiSummary;

  bool get isReady => interests.isNotEmpty;

  TouristProfile copyWith({
    List<String>? interests,
    String? preferredPace,
    List<String>? favoriteCountries,
    String? aiSummary,
  }) => TouristProfile(
    interests: interests ?? this.interests,
    preferredPace: preferredPace ?? this.preferredPace,
    favoriteCountries: favoriteCountries ?? this.favoriteCountries,
    aiSummary: aiSummary ?? this.aiSummary,
  );

  static const empty = TouristProfile(
    interests: [],
    preferredPace: 'balanced',
    favoriteCountries: [],
    aiSummary: '',
  );
}

class AiTourRequest {
  const AiTourRequest({
    required this.destination,
    required this.country,
    required this.city,
    required this.durationHours,
    required this.type,
    required this.language,
    required this.prompt,
  });

  final String destination;
  final String country;
  final String city;
  final double durationHours;
  final TourType type;
  final String language;
  final String prompt;

  Map<String, dynamic> toJson() => {
    'destination': destination,
    'country': country,
    'city': city,
    'durationHours': durationHours,
    'type': type.name,
    'language': language,
    'prompt': prompt,
  };
}

String tourTypeLabel(TourType type) {
  switch (type) {
    case TourType.urban:
      return 'Urbano';
    case TourType.historical:
      return 'Historico';
    case TourType.gastronomic:
      return 'Gastronomico';
    case TourType.cultural:
      return 'Cultural';
    case TourType.ecological:
      return 'Ecologico';
    case TourType.romantic:
      return 'Romantico';
    case TourType.sports:
      return 'Deportivo';
    case TourType.night:
      return 'Nocturno';
    case TourType.family:
      return 'Familiar';
    case TourType.custom:
      return 'Personalizado';
  }
}

String difficultyLabel(TourDifficulty difficulty) {
  switch (difficulty) {
    case TourDifficulty.easy:
      return 'Facil';
    case TourDifficulty.moderate:
      return 'Media';
    case TourDifficulty.intense:
      return 'Intensa';
  }
}

String _hoursLabel(double hours) {
  final rounded = hours.toStringAsFixed(
    hours.truncateToDouble() == hours ? 0 : 1,
  );
  return '$rounded horas';
}

String _distanceLabel(double kilometers) {
  if (kilometers <= 0) return 'Por calcular';
  return '${kilometers.toStringAsFixed(1)} km';
}

String _minutesLabel(int minutes) {
  if (minutes < 60) return '$minutes minutos';
  final hours = minutes / 60;
  return '${hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1)} horas';
}
