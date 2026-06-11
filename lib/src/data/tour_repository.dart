import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/app_config.dart';
import '../domain/models.dart';

class TourRepository {
  TourRepository({SupabaseClient? client});

  static const _emptyRequest = AiTourRequest(
    destination: '',
    country: '',
    city: '',
    durationHours: 1,
    type: TourType.custom,
    language: 'es',
    prompt: '',
  );

  Future<List<Tour>> getTours() async {
    for (final apiBaseUrl in AppConfig.apiBaseUrls) {
      try {
        final response = await http
            .get(Uri.parse('$apiBaseUrl/tours'))
            .timeout(const Duration(seconds: 25));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          final items = json['tours'] is List
              ? json['tours'] as List<dynamic>
              : const <dynamic>[];
          return [
            for (final item in items)
              if (item is Map)
                _tourFromDatabaseJson(Map<String, dynamic>.from(item)),
          ];
        }
      } catch (_) {
        // Try the next configured base URL.
      }
    }
    return const [];
  }

  Future<List<Tour>> searchTours({
    String? country,
    String? city,
    TourType? type,
  }) async {
    final tours = await getTours();
    return tours.where((tour) {
      final countryOk =
          country == null || country.isEmpty || tour.country == country;
      final cityOk = city == null || city.isEmpty || tour.city == city;
      final typeOk = type == null || tour.type == type;
      return countryOk && cityOk && typeOk;
    }).toList();
  }

  Future<Tour> generateAiTour(AiTourRequest request) async {
    for (final apiBaseUrl in AppConfig.apiBaseUrls) {
      try {
        final response = await http
            .post(
              Uri.parse('$apiBaseUrl/ai/tours/generate'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(request.toJson()),
            )
            .timeout(const Duration(seconds: 35));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return _tourFromAiJson(
            json['tour'] as Map<String, dynamic>,
            request,
            json['route'] is Map
                ? Map<String, dynamic>.from(json['route'] as Map)
                : null,
          );
        }
      } catch (_) {
        // Try the next configured base URL, then fall back offline.
      }
    }
    return Tour(
      id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
      title: '${request.city} VibeTour AI',
      country: request.country.isEmpty ? 'Global' : request.country,
      city: request.city.isEmpty ? request.destination : request.city,
      type: request.type,
      description:
          'Tour generado por IA con ruta logica, paradas variadas, tiempos de traslado estimados y narrativa personalizada para ${request.destination}.',
      coverUrl: _curatedImage('${request.destination} cover'),
      gallery: [_curatedImage('${request.destination} gallery')],
      durationHours: request.durationHours,
      distanceKm: 0,
      rating: 4.9,
      reviewCount: 0,
      likes: 0,
      difficulty: TourDifficulty.moderate,
      language: request.language,
      tags: ['AI Planner', tourTypeLabel(request.type), request.city],
      shortSummary: 'Ruta IA inicial para ${request.destination}.',
      subcategories: [tourTypeLabel(request.type)],
      featuredExperience: 'Planificacion guiada para ${request.destination}.',
      placeHistory: '',
      culturalContext: '',
      availableLanguages: [request.language],
      recommendedAudience: const ['Viajeros curiosos', 'Parejas', 'Familias'],
      bestSeason: 'Todo el ano',
      recommendedSchedule: 'Manana o tarde con buena luz natural',
      meetingPoint: request.destination,
      includes: const [
        'Guia digital',
        'Ruta en mapa interactivo',
        'Recomendaciones por parada',
      ],
      excludes: const ['Transporte privado', 'Entradas a recintos pagos'],
      recommendations: const [
        'Lleva agua y bateria suficiente',
        'Confirma horarios de acceso antes de salir',
      ],
      whatToBring: const ['Agua', 'Calzado comodo', 'Bateria suficiente'],
      tourRules: const [
        'Respeta las normas locales',
        'No ingreses a zonas restringidas',
      ],
      keywords: [
        request.destination,
        request.city,
        tourTypeLabel(request.type),
      ],
      mainCategory: tourTypeLabel(request.type),
      budget: const TourBudget(low: 0, medium: 0, high: 0),
      additionalInfo: TourAdditionalInfo.standard,
      stops: [
        TourStop(
          id: 'ai-stop-empty',
          name: request.destination,
          location: const GeoPoint(latitude: 0, longitude: 0),
          imageUrl: _curatedImage(request.destination),
          description:
              'Punto inicial generado sin catalogo local disponible. Conecta el backend de IA para obtener paradas reales.',
          activities: const ['Planificar ruta'],
          curiousFacts: const [
            'La IA necesita datos del backend para enriquecer esta parada.',
          ],
          tips: const ['Activa el backend de IA para resultados completos'],
          locationInfo: TourLocationInfo(
            nombreLugar: request.destination,
            direccion: request.destination,
            ciudad: request.city,
            region: '',
            pais: request.country,
            placeId: 'offline-${request.destination.hashCode.abs()}',
            urlMapa: '',
          ),
          images: [_curatedImage(request.destination)],
          suggestedMinutes: 30,
        ),
      ],
      isAiGenerated: true,
      isPublished: false,
    );
  }

  Tour _tourFromAiJson(
    Map<String, dynamic> json,
    AiTourRequest request, [
    Map<String, dynamic>? route,
  ]) {
    final stopsJson =
        (json['itinerario'] as List<dynamic>?) ??
        (json['stops'] as List<dynamic>?) ??
        const [];
    final legacyStops = route?['stops'] is List
        ? route!['stops'] as List<dynamic>
        : json['stops'] is List
        ? json['stops'] as List<dynamic>
        : const <dynamic>[];
    final stops = stopsJson.asMap().entries.map((entry) {
      final item = entry.value as Map<String, dynamic>;
      final legacy =
          legacyStops.length > entry.key && legacyStops[entry.key] is Map
          ? Map<String, dynamic>.from(legacyStops[entry.key] as Map)
          : const <String, dynamic>{};
      final location = item['ubicacion'] is Map
          ? Map<String, dynamic>.from(item['ubicacion'] as Map)
          : const <String, dynamic>{};
      final name =
          item['nombre']?.toString() ??
          item['name']?.toString() ??
          'Parada ${entry.key + 1}';
      final imageSeed = '$name ${request.city}';
      final images = _stringList(item['imagenes']).isEmpty
          ? [_imageUrl(item['imageUrl'], imageSeed)]
          : _stringList(
              item['imagenes'],
            ).map((url) => _imageUrl(url, imageSeed)).toList();
      return TourStop(
        id: 'ai-stop-${entry.key}',
        name: name,
        location: GeoPoint(
          latitude: _doubleValue(
            location['latitud'] ?? item['latitude'] ?? legacy['latitude'],
            0,
          ),
          longitude: _doubleValue(
            location['longitud'] ?? item['longitude'] ?? legacy['longitude'],
            0,
          ),
        ),
        imageUrl: images.first,
        description:
            item['descripcion']?.toString() ??
            item['description']?.toString() ??
            '',
        activities: _stringList(item['actividades'] ?? item['activities']),
        curiousFacts: _stringList(item['datos_curiosos']),
        tips: _stringList(item['consejos'] ?? item['tips']),
        locationInfo: TourLocationInfo(
          nombreLugar:
              location['nombre_lugar']?.toString() ??
              location['nombreLugar']?.toString() ??
              name,
          direccion: location['direccion']?.toString() ?? '',
          ciudad: location['ciudad']?.toString() ?? request.city,
          region: location['region']?.toString() ?? '',
          pais: location['pais']?.toString() ?? request.country,
          placeId:
              location['place_id']?.toString() ??
              location['placeId']?.toString() ??
              'ai-${entry.key}',
          urlMapa:
              location['url_mapa']?.toString() ??
              location['urlMapa']?.toString() ??
              '',
        ),
        images: images,
        suggestedMinutes: _minutesFromValue(
          item['duracion_estimada'] ?? item['suggestedMinutes'],
          30,
        ),
        order: entry.key,
      );
    }).toList();
    final gallery = _stringList(json['galeria_tour'] ?? json['gallery']);
    return Tour(
      id:
          json['id']?.toString() ??
          'ai-${DateTime.now().millisecondsSinceEpoch}',
      title:
          json['nombre_tour']?.toString() ??
          json['title']?.toString() ??
          '${request.city} VibeTour AI',
      country: json['country']?.toString() ?? request.country,
      city: json['city']?.toString() ?? request.city,
      type: request.type,
      description:
          json['descripcion_tour']?.toString() ??
          json['description']?.toString() ??
          'Ruta creada por VIBETOURS AI.',
      coverUrl: _imageUrl(
        json['imagen_portada'] ?? json['coverUrl'],
        '${request.city} cover',
      ),
      gallery: gallery.isEmpty
          ? [_curatedImage('${request.city} gallery')]
          : gallery.asMap().entries.map((entry) {
              return _imageUrl(entry.value, '${request.city} ${entry.key}');
            }).toList(),
      durationHours: _hoursFromValue(
        json['duracion_estimada'] ?? json['durationHours'],
        request.durationHours,
      ),
      distanceKm: _kilometersFromValue(
        json['distancia_total'] ?? json['distanceKm'],
        5,
      ),
      rating: 4.9,
      reviewCount: 0,
      likes: 0,
      difficulty: _difficultyFromText(json['nivel_dificultad']),
      language: request.language,
      tags: _stringList(json['etiquetas'] ?? json['tags']),
      shortSummary: json['resumen_corto']?.toString() ?? '',
      subcategories: _stringList(json['subcategorias']),
      featuredExperience: json['experiencia_destacada']?.toString() ?? '',
      placeHistory: json['historia_del_lugar']?.toString() ?? '',
      culturalContext: json['contexto_cultural']?.toString() ?? '',
      availableLanguages: _stringList(json['idiomas_disponibles']).isEmpty
          ? [request.language]
          : _stringList(json['idiomas_disponibles']),
      recommendedAudience: _stringList(json['publico_recomendado']),
      bestSeason: json['mejor_epoca']?.toString() ?? '',
      recommendedSchedule: json['horario_recomendado']?.toString() ?? '',
      meetingPoint: _meetingPointLabel(json['punto_encuentro']),
      meetingPointInfo: _locationInfo(json['punto_encuentro'], request),
      includes: _stringList(json['incluye']),
      excludes: _stringList(json['no_incluye']),
      recommendations: _stringList(json['recomendaciones']),
      whatToBring: _stringList(json['que_llevar']),
      tourRules: _stringList(json['normas_del_tour']),
      keywords: _stringList(json['palabras_clave']),
      mainCategory: json['categoria_principal']?.toString() ?? '',
      budget: _budget(json['presupuesto_estimado_usd']),
      additionalInfo: _additionalInfo(json['informacion_adicional']),
      stops: stops,
      isAiGenerated: true,
      isPublished: false,
    );
  }

  Tour _tourFromDatabaseJson(Map<String, dynamic> json) {
    final source = json['pending_edit_snapshot'] is Map
        ? Map<String, dynamic>.from(json['pending_edit_snapshot'] as Map)
        : json;
    final stopsRaw = json['tour_stops'] is List
        ? json['tour_stops'] as List<dynamic>
        : const <dynamic>[];
    final sortedStops =
        [
          for (final item in stopsRaw)
            if (item is Map) Map<String, dynamic>.from(item),
        ]..sort((a, b) {
          final aOrder = _intValue(a['stop_order'] ?? a['position'], 0);
          final bOrder = _intValue(b['stop_order'] ?? b['position'], 0);
          return aOrder.compareTo(bOrder);
        });
    final stops = sortedStops.asMap().entries.map((entry) {
      final item = entry.value;
      final metadata = item['image_metadata'] is Map
          ? Map<String, dynamic>.from(item['image_metadata'] as Map)
          : const <String, dynamic>{};
      final locationInfo = _locationInfo(
        metadata['location_info'] ?? item['location_info'],
        _emptyRequest,
      );
      final images = _stringList(
        item['image_urls'] ?? item['images'] ?? item['image_url'],
      );
      return TourStop(
        id: item['id']?.toString() ?? 'db-stop-${entry.key}',
        name:
            item['name']?.toString() ??
            item['custom_name']?.toString() ??
            'Parada ${entry.key + 1}',
        location: GeoPoint(
          latitude: _doubleValue(item['latitude'], 0),
          longitude: _doubleValue(item['longitude'], 0),
        ),
        imageUrl: images.isEmpty ? '' : images.first,
        description:
            item['description']?.toString() ??
            item['custom_description']?.toString() ??
            '',
        activities: _stringList(metadata['activities'] ?? item['activities']),
        curiousFacts: _stringList(
          metadata['datos_curiosos'] ??
              metadata['curiousFacts'] ??
              item['curious_facts'],
        ),
        tips: _stringList(metadata['consejos'] ?? item['tips']),
        locationInfo: locationInfo,
        images: images,
        suggestedMinutes: _intValue(
          item['suggested_minutes'] ?? item['estimated_minutes'],
          30,
        ),
        order: entry.key,
      );
    }).toList();
    final gallery = _stringList(
      source['galeria_tour'] ?? json['gallery'] ?? json['gallery_image_urls'],
    );
    final meetingInfo = _locationInfo(source['punto_encuentro'], _emptyRequest);
    final city =
        json['city']?.toString() ??
        meetingInfo.ciudad.ifEmpty(
          stops.firstOrNull?.locationInfo.ciudad ?? '',
        );
    final country =
        json['country']?.toString() ??
        meetingInfo.pais.ifEmpty(stops.firstOrNull?.locationInfo.pais ?? '');
    return Tour(
      id:
          json['id']?.toString() ??
          'db-${DateTime.now().microsecondsSinceEpoch}',
      title:
          source['nombre_tour']?.toString() ??
          json['title']?.toString() ??
          'Tour',
      country: country.ifEmpty('Global'),
      city: city.ifEmpty('Global'),
      type: _tourTypeFromText(source['tipo_tour'] ?? json['type']),
      description:
          source['descripcion_tour']?.toString() ??
          json['description']?.toString() ??
          '',
      coverUrl: _imageUrl(
        source['imagen_portada'] ??
            json['cover_url'] ??
            json['cover_image_url'],
        json['title']?.toString() ?? 'tour',
      ),
      gallery: gallery.isEmpty
          ? _stringList(json['gallery_image_urls'])
          : gallery.map((item) => _imageUrl(item, 'gallery')).toList(),
      durationHours: _hoursFromValue(
        source['duracion_estimada'] ??
            json['durationHours'] ??
            json['estimated_minutes'],
        3,
      ),
      distanceKm: _kilometersFromValue(
        source['distancia_total'] ?? json['distanceKm'],
        0,
      ),
      rating: _doubleValue(json['rating'], 4.8),
      reviewCount: _intValue(json['review_count'], 0),
      likes: _intValue(json['likes_count'], 0),
      difficulty: _difficultyFromText(
        source['nivel_dificultad'] ?? json['difficulty'],
      ),
      language: json['language']?.toString() ?? 'es',
      tags: _stringList(source['etiquetas'] ?? json['tags']),
      shortSummary: source['resumen_corto']?.toString() ?? '',
      subcategories: _stringList(source['subcategorias']),
      featuredExperience: source['experiencia_destacada']?.toString() ?? '',
      placeHistory: source['historia_del_lugar']?.toString() ?? '',
      culturalContext: source['contexto_cultural']?.toString() ?? '',
      availableLanguages: _stringList(source['idiomas_disponibles']),
      recommendedAudience: _stringList(source['publico_recomendado']),
      bestSeason: source['mejor_epoca']?.toString() ?? '',
      recommendedSchedule: source['horario_recomendado']?.toString() ?? '',
      meetingPoint: _meetingPointLabel(source['punto_encuentro']),
      meetingPointInfo: meetingInfo,
      includes: _stringList(source['incluye'] ?? json['included_items']),
      excludes: _stringList(source['no_incluye'] ?? json['excluded_items']),
      recommendations: _stringList(source['recomendaciones']),
      whatToBring: _stringList(source['que_llevar']),
      tourRules: _stringList(source['normas_del_tour']),
      keywords: _stringList(source['palabras_clave']),
      mainCategory: source['categoria_principal']?.toString() ?? '',
      budget: _budget(source['presupuesto_estimado_usd']),
      additionalInfo: _additionalInfo(source['informacion_adicional']),
      stops: stops,
      isAiGenerated: true,
      isPublished: json['is_published'] == true || json['status'] == 'approved',
    );
  }

  List<String> _stringList(Object? value) {
    if (value is List) {
      return [
        for (final item in value)
          if (item is Map && item['url'] != null)
            item['url'].toString()
          else
            item.toString(),
      ];
    }
    if (value is String && value.trim().isNotEmpty) {
      return value
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList();
    }
    return const [];
  }

  double _doubleValue(Object? value, double fallback) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  int _minutesFromValue(Object? value, int fallback) {
    if (value is num) return value.round();
    final text = value?.toString().toLowerCase() ?? '';
    final number = RegExp(r'(\d+(?:[.,]\d+)?)').firstMatch(text)?.group(1);
    final parsed = double.tryParse(number?.replaceAll(',', '.') ?? '');
    if (parsed == null) return fallback;
    if (text.contains('hora')) return (parsed * 60).round();
    return parsed.round();
  }

  double _hoursFromValue(Object? value, double fallback) {
    if (value is num) {
      return value > 24 ? value.toDouble() / 60 : value.toDouble();
    }
    final text = value?.toString().toLowerCase() ?? '';
    final number = RegExp(r'(\d+(?:[.,]\d+)?)').firstMatch(text)?.group(1);
    final parsed = double.tryParse(number?.replaceAll(',', '.') ?? '');
    if (parsed == null) return fallback;
    if (text.contains('min')) return parsed / 60;
    return parsed;
  }

  double _kilometersFromValue(Object? value, double fallback) {
    if (value is num) return value.toDouble();
    final text = value?.toString().toLowerCase() ?? '';
    final number = RegExp(r'(\d+(?:[.,]\d+)?)').firstMatch(text)?.group(1);
    final parsed = double.tryParse(number?.replaceAll(',', '.') ?? '');
    if (parsed == null) return fallback;
    if (text.contains('metro')) return parsed / 1000;
    return parsed;
  }

  TourDifficulty _difficultyFromText(Object? value) {
    final text = value?.toString().toLowerCase() ?? '';
    if (text.contains('intens') ||
        text.contains('alta') ||
        text.contains('hard')) {
      return TourDifficulty.intense;
    }
    if (text.contains('media') ||
        text.contains('moder') ||
        text.contains('inter')) {
      return TourDifficulty.moderate;
    }
    return TourDifficulty.easy;
  }

  TourType _tourTypeFromText(Object? value) {
    final text = value?.toString().toLowerCase() ?? '';
    if (text.contains('eco') || text.contains('natur')) {
      return TourType.ecological;
    }
    if (text.contains('gastr') || text.contains('food')) {
      return TourType.gastronomic;
    }
    if (text.contains('hist')) return TourType.historical;
    if (text.contains('romant')) return TourType.romantic;
    if (text.contains('sport') ||
        text.contains('deport') ||
        text.contains('adventure')) {
      return TourType.sports;
    }
    if (text.contains('night') || text.contains('noct')) return TourType.night;
    if (text.contains('famil')) return TourType.family;
    if (text.contains('urban')) return TourType.urban;
    if (text.contains('cultur')) return TourType.cultural;
    return TourType.custom;
  }

  TourAdditionalInfo _additionalInfo(Object? value) {
    if (value is! Map) return TourAdditionalInfo.standard;
    final json = Map<String, dynamic>.from(value);
    return TourAdditionalInfo(
      accesibilidad:
          json['accesibilidad']?.toString() ??
          TourAdditionalInfo.standard.accesibilidad,
      mascotasPermitidas: json['mascotas_permitidas'] == true,
      aptoParaNinos: json['apto_para_ninos'] == false ? false : true,
      aptoParaAdultosMayores: json['apto_para_adultos_mayores'] == false
          ? false
          : true,
    );
  }

  TourLocationInfo _locationInfo(Object? value, AiTourRequest request) {
    if (value is! Map) return TourLocationInfo.empty;
    final json = Map<String, dynamic>.from(value);
    return TourLocationInfo(
      nombreLugar:
          json['nombre_lugar']?.toString() ??
          json['nombreLugar']?.toString() ??
          '',
      direccion: json['direccion']?.toString() ?? '',
      ciudad: json['ciudad']?.toString() ?? request.city,
      region: json['region']?.toString() ?? '',
      pais: json['pais']?.toString() ?? request.country,
      placeId:
          json['place_id']?.toString() ?? json['placeId']?.toString() ?? '',
      urlMapa:
          json['url_mapa']?.toString() ?? json['urlMapa']?.toString() ?? '',
    );
  }

  String _meetingPointLabel(Object? value) {
    if (value is Map) {
      return value['nombre_lugar']?.toString() ??
          value['nombreLugar']?.toString() ??
          value['direccion']?.toString() ??
          '';
    }
    return value?.toString() ?? '';
  }

  TourBudget _budget(Object? value) {
    if (value is! Map) return TourBudget.empty;
    final json = Map<String, dynamic>.from(value);
    return TourBudget(
      low: _intValue(json['bajo'] ?? json['low'], 0),
      medium: _intValue(json['medio'] ?? json['medium'], 0),
      high: _intValue(json['alto'] ?? json['high'], 0),
    );
  }

  int _intValue(Object? value, int fallback) {
    if (value is num) return value.round();
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  String _imageUrl(Object? value, String seed) {
    final url = value is Map
        ? value['url']?.toString() ?? ''
        : value?.toString() ?? '';
    if (url.isEmpty || url.contains('source.unsplash.com')) {
      return _curatedImage(seed);
    }
    return url;
  }

  String _curatedImage(String seed) {
    const images = [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    ];
    final hash = seed.codeUnits.fold<int>(0, (sum, code) => sum + code);
    return images[hash.abs() % images.length];
  }
}

extension _StringFallback on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
