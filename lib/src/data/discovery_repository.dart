import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../domain/models.dart';

class _CorrectedPlace {
  const _CorrectedPlace({
    required this.latitude,
    required this.longitude,
    this.imageUrl,
  });

  final double latitude;
  final double longitude;
  final String? imageUrl;
}

class _ParsedLocation {
  const _ParsedLocation({
    required this.latitude,
    required this.longitude,
    required this.imageUrl,
  });

  final double latitude;
  final double longitude;
  final String imageUrl;
}

class DiscoveryRepository {
  static const Map<String, _CorrectedPlace> _correctedPlaces = {
    'joe arroyo': _CorrectedPlace(
      latitude: 10.9948286,
      longitude: -74.806177,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/be/EstatuaJoeArroyoBarranquilla.jpg',
    ),
    'isla salamanca': _CorrectedPlace(
      latitude: 10.9782,
      longitude: -74.7478,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Parque_Natural_Isla_Salamanca.jpg',
    ),
    'bocas de ceniza': _CorrectedPlace(
      latitude: 11.1065,
      longitude: -74.8511,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Barranquilla%2C_el_mar_desde_las_Bocas_de_Cenizas-20050625.jpg',
    ),
    'shakira': _CorrectedPlace(
      latitude: 11.0279,
      longitude: -74.7924,
      imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80',
    ),
    'ventana al mundo': _CorrectedPlace(
      latitude: 11.03313,
      longitude: -74.83142,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Ventanalmundo.jpg',
    ),
    'ventana de campeones': _CorrectedPlace(
      latitude: 10.9842,
      longitude: -74.7761,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Ventana_de_Campeones.jpg',
    ),
    'aleta del tiburón': _CorrectedPlace(
      latitude: 10.9842,
      longitude: -74.7761,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Ventana_de_Campeones.jpg',
    ),
    'museo del caribe': _CorrectedPlace(
      latitude: 10.9822,
      longitude: -74.7844,
      imageUrl: 'https://images.unsplash.com/photo-1554816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    ),
    'catedral metropolitana': _CorrectedPlace(
      latitude: 10.9888,
      longitude: -74.7889,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Barranquilla_Catedral.jpg',
    ),
    'plaza de la paz': _CorrectedPlace(
      latitude: 10.989,
      longitude: -74.789,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Barranquilla_Catedral.jpg',
    ),
    'castillo de salgar': _CorrectedPlace(
      latitude: 11.0223,
      longitude: -74.9488,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Castillo_de_Salgar.jpg',
    ),
    'gran malecon': _CorrectedPlace(
      latitude: 11.0258,
      longitude: -74.7986,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/GranMalecon1.jpg',
    ),
    'malecón del río': _CorrectedPlace(
      latitude: 11.0258,
      longitude: -74.7986,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/GranMalecon1.jpg',
    ),
    'zoologico': _CorrectedPlace(
      latitude: 11.0102,
      longitude: -74.7942,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Barranquilla_Zool%C3%B3gico_Flamencos.jpg',
    ),
    'zoológico': _CorrectedPlace(
      latitude: 11.0102,
      longitude: -74.7942,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Barranquilla_Zool%C3%B3gico_Flamencos.jpg',
    ),
  };

  _ParsedLocation _correctLocation(String name, double defaultLat, double defaultLon, String defaultImg) {
    final lower = name.toLowerCase();
    for (final entry in _correctedPlaces.entries) {
      if (lower.contains(entry.key)) {
        return _ParsedLocation(
          latitude: entry.value.latitude,
          longitude: entry.value.longitude,
          imageUrl: entry.value.imageUrl ?? defaultImg,
        );
      }
    }
    return _ParsedLocation(
      latitude: defaultLat,
      longitude: defaultLon,
      imageUrl: defaultImg,
    );
  }

  bool _isBlacklisted(String name, String type) {
    final lowerName = name.toLowerCase();
    final lowerType = type.toLowerCase();
    final blacklistNameKeywords = const [
      'cementerio', 'cemetery', 'funeraria', 'jardines del recuerdo', 'jardín del recuerdo',
      'universidad', 'university', 'colegio', 'school', 'hospital', 'clinica', 'clínica',
      'condominio', 'conjunto residencial', 'edificio', 'torre', 'reserva residencial', 'aptos',
      'apartamento', 'consultorio', 'dental', 'odontología', 'médico'
    ];
    for (final kw in blacklistNameKeywords) {
      if (lowerName.contains(kw)) return true;
    }
    final blacklistTypeKeywords = const [
      'cemetery', 'university', 'college', 'hospital', 'clinic', 'dentist', 'physiotherapist',
      'doctor', 'residential', 'apartment', 'school'
    ];
    for (final kw in blacklistTypeKeywords) {
      if (lowerType.contains(kw)) return true;
    }
    return false;
  }

  Future<WeatherSnapshot?> weather({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final url = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=$latitude'
        '&longitude=$longitude'
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m'
        '&timezone=auto'
      );
      final response = await http.get(url).timeout(const Duration(seconds: 8));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final current = json['current'] as Map<String, dynamic>? ?? const {};
        final code = _int(current['weather_code']);
        final isDay = _int(current['is_day']) == 1;
        
        return WeatherSnapshot(
          locationName: 'Ubicación actual',
          temperatureC: _int(current['temperature_2m']),
          apparentC: _int(current['apparent_temperature'] ?? current['temperature_2m']),
          humidity: _int(current['relative_humidity_2m']),
          windKmh: _int(current['wind_speed_10m']),
          condition: _weatherLabel(code, isDay),
          code: code,
          isDay: isDay,
        );
      }
    } catch (_) {
      // Fall through to return null
    }
    return null;
  }

  Future<List<NearbyPlace>> nearbyPlaces({
    required double latitude,
    required double longitude,
  }) async {
    final tomtomPlaces = await _nearbyTomTomPlaces(latitude: latitude, longitude: longitude);
    if (tomtomPlaces.isNotEmpty) {
      return tomtomPlaces;
    }
    final overpassPlaces = await _nearbyOverpassPlaces(latitude, longitude);
    if (overpassPlaces.isNotEmpty) {
      return overpassPlaces;
    }
    return _fallbackPlaces(latitude: latitude, longitude: longitude);
  }

  Future<List<NearbyPlace>> searchPlaces(String query) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return const [];
    final tomTomResults = await _searchTomTomPlaces(trimmed);
    if (tomTomResults.isNotEmpty) {
      return tomTomResults;
    }
    try {
      final uri = Uri.parse('https://photon.komoot.io/api/').replace(
        queryParameters: {'q': trimmed, 'limit': '8'},
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 8));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final features = json['features'] as List<dynamic>? ?? const [];
        final List<NearbyPlace> places = [];
        for (int i = 0; i < features.length; i++) {
          if (features[i] is Map) {
            final place = _nearbyPlaceFromPhotonFeature(Map<String, dynamic>.from(features[i] as Map), i);
            if (!_isBlacklisted(place.name, place.type)) {
              places.add(place);
            }
          }
        }
        return places;
      }
    } catch (_) {
      // Fall through
    }
    return const [];
  }

  Future<List<LocalEvent>> localEvents({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final places = await nearbyPlaces(latitude: latitude, longitude: longitude);
      if (places.isNotEmpty) {
        return [
          for (int i = 0; i < places.length && i < 8; i++)
            LocalEvent(
              id: 'event-$i',
              title: _eventTitle(i, places[i].name),
              city: places[i].category,
              category: const ['Concierto', 'Festival', 'Feria', 'Deportivo', 'Cultural'][i % 5],
              startsAt: DateTime.now().add(Duration(days: i + 1)),
              imageUrl: places[i].imageUrl.isNotEmpty ? places[i].imageUrl : _getRandomImageUrlForCategory(places[i].category, places[i].name),
              location: places[i].location,
            )
        ];
      }
    } catch (_) {
      // Fall through
    }
    return _fallbackEvents(latitude: latitude, longitude: longitude);
  }

  // PRIVATE HELPERS FOR BYPASSING BACKEND

  String _weatherLabel(int code, bool isDay) {
    if (code == 0) return isDay ? 'Soleado' : 'Despejado';
    if (const [1, 2, 3].contains(code)) return 'Parcial';
    if (const [45, 48].contains(code)) return 'Niebla';
    if (const [51, 53, 55, 56, 57].contains(code)) return 'Llovizna';
    if (const [61, 63, 65, 66, 67, 80, 81, 82].contains(code)) return 'Lluvia';
    if (const [71, 73, 75, 77, 85, 86].contains(code)) return 'Nieve';
    if (const [95, 96, 99].contains(code)) return 'Tormenta';
    return 'Actual';
  }

  NearbyPlace _nearbyPlaceFromPhotonFeature(Map<String, dynamic> feature, int index) {
    final properties = feature['properties'] is Map ? Map<String, dynamic>.from(feature['properties'] as Map) : const <String, dynamic>{};
    final geometry = feature['geometry'] is Map ? Map<String, dynamic>.from(feature['geometry'] as Map) : const <String, dynamic>{};
    final coordinates = geometry['coordinates'] is List ? geometry['coordinates'] as List : const [];
    final name = properties['name']?.toString() ?? properties['city']?.toString() ?? 'Lugar';
    final typeStr = properties['osm_value']?.toString() ?? properties['type']?.toString() ?? 'place';
    final defaultLat = coordinates.length > 1 ? _double(coordinates[1]) : 0.0;
    final defaultLng = coordinates.isNotEmpty ? _double(coordinates[0]) : 0.0;
    final category = _classifyAttraction(properties);
    final defaultImg = _getRandomImageUrlForCategory(category, name);
    
    final corrected = _correctLocation(name, defaultLat, defaultLng, defaultImg);

    return NearbyPlace(
      id: 'search-$index',
      name: name,
      type: _typeLabel(typeStr),
      distanceMeters: 0,
      location: GeoPoint(latitude: corrected.latitude, longitude: corrected.longitude),
      category: category,
      imageUrl: corrected.imageUrl,
      thumbnailUrl: corrected.imageUrl,
      statusLabel: 'Disponible',
      isOpenNow: true,
    );
  }

  Future<List<NearbyPlace>> _nearbyOverpassPlaces(double latitude, double longitude) async {
    const radius = 4500;
    final query = '''
      [out:json][timeout:25];
      (
        node(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
        node(around:$radius,$latitude,$longitude)["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
        node(around:$radius,$latitude,$longitude)["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
        node(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve"];
        way(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"];
        way(around:$radius,$latitude,$longitude)["historic"~"monument|memorial|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage"];
        way(around:$radius,$latitude,$longitude)["amenity"~"arts_centre|marketplace|restaurant|cafe|pub|bar|nightclub|theatre"];
        way(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve"];
      );
      out center tags 35;
    ''';
    try {
      final response = await http.post(
        Uri.parse('https://overpass-api.de/api/interpreter'),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'VIBETOURS/1.0 contact=ops@vibetours.app'
        },
        body: {'data': query},
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final elements = json['elements'] as List<dynamic>? ?? const [];
        final List<NearbyPlace> places = [];
        int idx = 0;
        for (final element in elements) {
          if (element is Map) {
            final tags = element['tags'] is Map ? Map<String, dynamic>.from(element['tags'] as Map) : const <String, dynamic>{};
            final name = tags['name']?.toString();
            final defaultLat = _double(element['lat'] ?? (element['center'] as Map?)?['lat']);
            final defaultLon = _double(element['lon'] ?? (element['center'] as Map?)?['lon']);
            final typeStr = tags['tourism']?.toString() ?? tags['historic']?.toString() ?? tags['amenity']?.toString() ?? tags['leisure']?.toString() ?? tags['sport']?.toString() ?? tags['natural']?.toString() ?? 'place';
            if (name == null || defaultLat == 0.0 || defaultLon == 0.0) continue;
            if (_isAccommodation(typeStr)) continue;
            if (_isBlacklisted(name, typeStr)) continue;
            
            final category = _classifyAttraction(tags);
            final defaultImg = _getRandomImageUrlForCategory(category, name);
            
            final corrected = _correctLocation(name, defaultLat, defaultLon, defaultImg);

            final distance = _distanceMeters(latitude, longitude, corrected.latitude, corrected.longitude);
            places.add(NearbyPlace(
              id: 'overpass-${element['id'] ?? idx++}',
              name: name,
              type: _typeLabel(typeStr),
              distanceMeters: distance.round(),
              location: GeoPoint(latitude: corrected.latitude, longitude: corrected.longitude),
              category: category,
              imageUrl: corrected.imageUrl,
              thumbnailUrl: corrected.imageUrl,
              statusLabel: 'Abierto',
              isOpenNow: true,
            ));
          }
        }
        places.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));
        return places.toList();
      }
    } catch (_) {
      // Fall through
    }
    return const [];
  }

  double _distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    const radius = 6371000.0;
    double toRad(double value) => value * 3.141592653589793 / 180.0;
    final dLat = toRad(lat2 - lat1);
    final dLon = toRad(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(toRad(lat1)) * cos(toRad(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    return 2 * radius * atan2(sqrt(a), sqrt(1 - a));
  }

  String _classifyAttraction(Map<String, dynamic> tags) {
    final tourism = tags['tourism']?.toString().toLowerCase() ?? '';
    final historic = tags['historic']?.toString().toLowerCase() ?? '';
    final amenity = tags['amenity']?.toString().toLowerCase() ?? '';
    final leisure = tags['leisure']?.toString().toLowerCase() ?? '';
    final natural = tags['natural']?.toString().toLowerCase() ?? '';
    final sport = tags['sport']?.toString().toLowerCase() ?? '';

    if (const ['museum', 'gallery', 'arts_centre'].contains(amenity) || tourism == 'museum') return 'museum';
    if (const ['monument', 'memorial', 'ruins', 'castle', 'archaeological_site'].contains(historic)) return 'historic';
    if (const ['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].contains(tourism)) return tourism;
    if (amenity == 'marketplace') return 'market';
    if (const ['sports_centre', 'stadium', 'pitch', 'track', 'fitness_centre'].contains(leisure) || sport.isNotEmpty) return 'sports';
    if (const ['park', 'garden', 'nature_reserve', 'forest'].contains(leisure) || const ['tree', 'wood', 'grassland', 'beach'].contains(natural)) return 'nature';
    if (const ['restaurant', 'cafe', 'food_court', 'pub', 'bar', 'nightclub'].contains(amenity)) return amenity;
    if (const ['cathedral', 'church', 'temple', 'mosque'].contains(historic)) return 'religious';
    return tourism.isNotEmpty ? tourism : (historic.isNotEmpty ? historic : (amenity.isNotEmpty ? amenity : (leisure.isNotEmpty ? leisure : (natural.isNotEmpty ? natural : 'place'))));
  }

  bool _isAccommodation(String type) {
    return const [
      'hotel',
      'hostel',
      'guest_house',
      'apartment',
      'motel',
      'camp_site',
      'caravan_site',
      'chalet'
    ].contains(type.toLowerCase());
  }

  String _eventTitle(int index, String place) {
    final titles = [
      'Noche cultural cerca de $place',
      'Festival local en $place',
      'Feria gastronómica de $place',
      'Recorrido deportivo urbano',
      'Encuentro artístico y patrimonial'
    ];
    return titles[index % titles.length];
  }



  List<NearbyPlace> _fallbackPlaces({
    required double latitude,
    required double longitude,
  }) {
    return [
      NearbyPlace(
        id: 'fallback-current',
        name: 'Tu zona actual',
        type: 'Ubicacion',
        distanceMeters: 0,
        location: GeoPoint(latitude: latitude, longitude: longitude),
        category: 'Ubicacion',
        statusLabel: 'Disponible ahora',
        isOpenNow: true,
      ),
      NearbyPlace(
        id: 'fallback-attraction',
        name: 'Punto de interes cercano',
        type: 'Atraccion',
        distanceMeters: 450,
        location: GeoPoint(
          latitude: latitude + 0.002,
          longitude: longitude + 0.002,
        ),
        category: 'Atraccion',
      ),
      NearbyPlace(
        id: 'fallback-market',
        name: 'Zona gastronomica',
        type: 'Mercado',
        distanceMeters: 900,
        location: GeoPoint(
          latitude: latitude - 0.003,
          longitude: longitude + 0.0015,
        ),
        category: 'Mercado',
      ),
      NearbyPlace(
        id: 'fallback-viewpoint',
        name: 'Mirador local',
        type: 'Mirador',
        distanceMeters: 1350,
        location: GeoPoint(
          latitude: latitude + 0.004,
          longitude: longitude - 0.002,
        ),
        category: 'Mirador',
      ),
    ];
  }

  List<LocalEvent> _fallbackEvents({
    required double latitude,
    required double longitude,
  }) {
    return [
      LocalEvent(
        id: 'fallback-event-1',
        title: 'Evento local de fin de semana',
        city: 'Cerca de ti',
        category: 'Cultural',
        startsAt: DateTime.now().add(const Duration(days: 1, hours: 3)),
        imageUrl: '',
        location: GeoPoint(latitude: latitude, longitude: longitude),
      ),
      LocalEvent(
        id: 'fallback-event-2',
        title: 'Feria y experiencia gastronómica',
        city: 'Cerca de ti',
        category: 'Gastronómica',
        startsAt: DateTime.now().add(const Duration(days: 2, hours: 5)),
        imageUrl: '',
        location: GeoPoint(
          latitude: latitude + 0.001,
          longitude: longitude + 0.001,
        ),
      ),
    ];
  }

  String _typeLabel(String type) {
    return switch (type) {
      'museum' => 'Museo',
      'theatre' => 'Teatro',
      'arts_centre' => 'Arte',
      'marketplace' => 'Mercado',
      'viewpoint' => 'Mirador',
      'attraction' => 'Atraccion',
      'memorial' => 'Memoria',
      'monument' => 'Monumento',
      _ => type.replaceAll('_', ' '),
    };
  }

  int _int(Object? value) {
    if (value is num) return value.round();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  double _double(Object? value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  Future<List<NearbyPlace>> _searchTomTomPlaces(String query) async {
    final key = AppConfig.tomTomApiKey.trim();
    if (key.isEmpty) return const [];
    try {
      final encodedQuery = Uri.encodeComponent(query);
      final uri =
          Uri.parse(
            'https://api.tomtom.com/search/2/search/$encodedQuery.json',
          ).replace(
            queryParameters: {
              'key': key,
              'typeahead': 'true',
              'limit': '8',
              'openingHours': 'nextSevenDays',
              'language': 'es-ES',
            },
          );
      final response = await http
          .get(uri, headers: const {'User-Agent': 'VIBETOURS/1.0'})
          .timeout(const Duration(seconds: 8));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return const [];
      }
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final results = json['results'] as List<dynamic>? ?? const [];
      final List<NearbyPlace> places = [];
      for (final item in results) {
        if (item is Map) {
          final place = _tomTomPlaceFromJson(Map<String, dynamic>.from(item));
          if (!_isBlacklisted(place.name, place.type)) {
            places.add(place);
          }
        }
      }
      return places.take(8).toList();
    } catch (_) {
      return const [];
    }
  }

  NearbyPlace _tomTomPlaceFromJson(
    Map<String, dynamic> json, {
    double? userLat,
    double? userLon,
  }) {
    final poi = json['poi'] is Map
        ? Map<String, dynamic>.from(json['poi'] as Map)
        : const <String, dynamic>{};
    final address = json['address'] is Map
        ? Map<String, dynamic>.from(json['address'] as Map)
        : const <String, dynamic>{};
    final position = json['position'] is Map
        ? Map<String, dynamic>.from(json['position'] as Map)
        : const <String, dynamic>{};
    final categories = poi['categories'] is List
        ? List<String>.from(
            (poi['categories'] as List).map((item) => item.toString()),
          )
        : const <String>[];
    final category = categories.isEmpty ? 'Atraccion' : _typeLabel(categories.first);
    final name = poi['name']?.toString() ??
        address['freeformAddress']?.toString() ??
        querySafe(address['municipality']);
    final defaultImg = _getRandomImageUrlForCategory(category, name);
    
    final defaultLat = _double(position['lat']);
    final defaultLon = _double(position['lon']);
    
    final corrected = _correctLocation(name, defaultLat, defaultLon, defaultImg);
    
    final distance = (userLat != null && userLon != null)
        ? _distanceMeters(userLat, userLon, corrected.latitude, corrected.longitude).round()
        : _int(json['dist']);

    return NearbyPlace(
      id: json['id']?.toString() ?? '',
      name: name,
      type: categories.isEmpty ? 'Atraccion' : _typeLabel(categories.first),
      distanceMeters: distance,
      location: GeoPoint(
        latitude: corrected.latitude,
        longitude: corrected.longitude,
      ),
      category: category,
      imageUrl: corrected.imageUrl,
      thumbnailUrl: corrected.imageUrl,
      statusLabel: 'Abierto',
      isOpenNow: true,
    );
  }

  String querySafe(Object? value) {
    return value?.toString().trim().isNotEmpty == true
        ? value.toString().trim()
        : 'Lugar';
  }


  Future<List<NearbyPlace>> _nearbyTomTomPlaces({
    required double latitude,
    required double longitude,
  }) async {
    final key = AppConfig.tomTomApiKey.trim();
    if (key.isEmpty) return const [];
    try {
      final uri = Uri.parse(
        'https://api.tomtom.com/search/2/nearbySearch/.json',
      ).replace(
        queryParameters: {
          'key': key,
          'lat': latitude.toString(),
          'lon': longitude.toString(),
          'radius': '5000',
          'limit': '12',
          'language': 'es-ES',
          'categorySet': '7376,9362,7318',
        },
      );
      final response = await http
          .get(uri, headers: const {'User-Agent': 'VIBETOURS/1.0'})
          .timeout(const Duration(seconds: 8));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return const [];
      }
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final results = json['results'] as List<dynamic>? ?? const [];
      final List<NearbyPlace> places = [];
      for (final item in results) {
        if (item is Map) {
          final place = _tomTomPlaceFromJson(
            Map<String, dynamic>.from(item),
            userLat: latitude,
            userLon: longitude,
          );
          if (!_isBlacklisted(place.name, place.type)) {
            places.add(place);
          }
        }
      }
      return places;
    } catch (_) {
      return const [];
    }
  }

  String _getRandomImageUrlForCategory(String category, String name) {
    final searchStr = '${category.toLowerCase()} ${name.toLowerCase()}';
    
    // 1. Iglesias, templos y catedrales
    if (searchStr.contains('iglesia') ||
        searchStr.contains('catedral') ||
        searchStr.contains('templo') ||
        searchStr.contains('church') ||
        searchStr.contains('cathedral') ||
        searchStr.contains('temple') ||
        searchStr.contains('basilica') ||
        searchStr.contains('basílica') ||
        searchStr.contains('capilla') ||
        searchStr.contains('chapel') ||
        searchStr.contains('santuario')) {
      return 'https://images.unsplash.com/photo-1548625361-155de6c7f54d?auto=format&fit=crop&w=500&q=80';
    }
    
    // 2. Playas, islas y bahías
    if (searchStr.contains('playa') ||
        searchStr.contains('beach') ||
        searchStr.contains('bahia') ||
        searchStr.contains('bahía') ||
        searchStr.contains('bay') ||
        searchStr.contains('mar') ||
        searchStr.contains('ocean') ||
        searchStr.contains('oceano') ||
        searchStr.contains('costa') ||
        searchStr.contains('coast') ||
        searchStr.contains('isla') ||
        searchStr.contains('island') ||
        searchStr.contains('puerto') ||
        searchStr.contains('port')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80';
    }
    
    // 3. Castillos, palacios y ruinas arqueológicas
    if (searchStr.contains('castillo') ||
        searchStr.contains('castle') ||
        searchStr.contains('palacio') ||
        searchStr.contains('palace') ||
        searchStr.contains('ruina') ||
        searchStr.contains('ruins') ||
        searchStr.contains('fortaleza') ||
        searchStr.contains('fortress') ||
        searchStr.contains('arqueo')) {
      return 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=500&q=80';
    }
    
    // 4. Parques, jardines y lagos
    if (searchStr.contains('parque') ||
        searchStr.contains('park') ||
        searchStr.contains('jardin') ||
        searchStr.contains('jardín') ||
        searchStr.contains('garden') ||
        searchStr.contains('bosque') ||
        searchStr.contains('forest') ||
        searchStr.contains('lago') ||
        searchStr.contains('lake') ||
        searchStr.contains('rio') ||
        searchStr.contains('río') ||
        searchStr.contains('river') ||
        searchStr.contains('laguna')) {
      return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80';
    }

    // 5. Cascadas y ríos de montaña
    if (searchStr.contains('cascada') ||
        searchStr.contains('waterfall') ||
        searchStr.contains('salto')) {
      return 'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=500&q=80';
    }

    // 6. Museos y galerías de arte
    if (searchStr.contains('museo') ||
        searchStr.contains('museum') ||
        searchStr.contains('galeria') ||
        searchStr.contains('galería') ||
        searchStr.contains('gallery') ||
        searchStr.contains('exposicion') ||
        searchStr.contains('art') ||
        searchStr.contains('arte')) {
      return 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80';
    }

    // 7. Miradores y vistas panorámicas
    if (searchStr.contains('mirador') ||
        searchStr.contains('viewpoint') ||
        searchStr.contains('vista') ||
        searchStr.contains('outlook') ||
        searchStr.contains('panoramica') ||
        searchStr.contains('skyline')) {
      return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=500&q=80';
    }

    // 8. Plazas urbanas y calles históricas
    if (searchStr.contains('plaza') ||
        searchStr.contains('square') ||
        searchStr.contains('calle') ||
        searchStr.contains('street') ||
        searchStr.contains('avenida') ||
        searchStr.contains('boulevard') ||
        searchStr.contains('paseo')) {
      return 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=500&q=80';
    }

    // 9. Teatros y auditorios
    if (searchStr.contains('teatro') ||
        searchStr.contains('theatre') ||
        searchStr.contains('auditorio') ||
        searchStr.contains('cinema') ||
        searchStr.contains('cine') ||
        searchStr.contains('show')) {
      return 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=500&q=80';
    }

    // 10. Monumentos y estatuas históricas
    if (searchStr.contains('monumento') ||
        searchStr.contains('monument') ||
        searchStr.contains('estatua') ||
        searchStr.contains('statue') ||
        searchStr.contains('memorial') ||
        searchStr.contains('obelisco')) {
      return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=500&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80';
  }
}
