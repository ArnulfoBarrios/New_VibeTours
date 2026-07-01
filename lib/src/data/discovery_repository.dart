import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../domain/models.dart';

class DiscoveryRepository {
  Future<WeatherSnapshot?> weather({
    required double latitude,
    required double longitude,
  }) async {
    final json = await _get('/discovery/weather', latitude, longitude);
    if (json == null) return null;
    final weather = json['weather'] as Map<String, dynamic>? ?? const {};
    return WeatherSnapshot(
      locationName: json['locationName']?.toString() ?? 'Tokyo, Japan',
      temperatureC: _int(weather['temperatureC']),
      apparentC: _int(weather['apparentC']),
      humidity: _int(weather['humidity']),
      windKmh: _int(weather['windKmh']),
      condition: weather['condition']?.toString() ?? 'Actual',
      code: _int(weather['code']),
      isDay: weather['isDay'] != false,
    );
  }

  Future<List<NearbyPlace>> nearbyPlaces({
    required double latitude,
    required double longitude,
  }) async {
    final json = await _get('/discovery/nearby', latitude, longitude);
    final items = json?['places'] as List<dynamic>? ?? const [];
    if (items.isNotEmpty) {
      return [
        for (final item in items.take(12))
          _nearbyPlaceFromJson(Map<String, dynamic>.from(item as Map)),
      ];
    }
    final tomtomPlaces = await _nearbyTomTomPlaces(latitude: latitude, longitude: longitude);
    if (tomtomPlaces.isNotEmpty) {
      return tomtomPlaces;
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
    for (final baseUrl in AppConfig.apiBaseUrls) {
      try {
        final uri = Uri.parse(
          '$baseUrl/discovery/search',
        ).replace(queryParameters: {'q': trimmed, 'limit': '8'});
        final response = await http
            .get(uri)
            .timeout(const Duration(seconds: 8));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          final items = json['places'] as List<dynamic>? ?? const [];
          return [
            for (final item in items.take(8))
              _nearbyPlaceFromJson(Map<String, dynamic>.from(item as Map)),
          ];
        }
      } catch (_) {
        continue;
      }
    }
    return const [];
  }

  Future<List<LocalEvent>> localEvents({
    required double latitude,
    required double longitude,
  }) async {
    final json = await _get('/discovery/events', latitude, longitude);
    final items = json?['events'] as List<dynamic>? ?? const [];
    if (items.isEmpty) {
      return _fallbackEvents(latitude: latitude, longitude: longitude);
    }
    return [
      for (final item in items.take(8))
        _eventFromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  Future<Map<String, dynamic>?> _get(
    String path,
    double latitude,
    double longitude,
  ) async {
    for (final baseUrl in AppConfig.apiBaseUrls) {
      try {
        final uri = Uri.parse('$baseUrl$path').replace(
          queryParameters: {
            'lat': latitude.toString(),
            'lng': longitude.toString(),
          },
        );
        final response = await http
            .get(uri)
            .timeout(const Duration(seconds: 8));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return jsonDecode(response.body) as Map<String, dynamic>;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  NearbyPlace _nearbyPlaceFromJson(Map<String, dynamic> json) {
    return NearbyPlace(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Lugar cercano',
      type: _typeLabel(json['type']?.toString() ?? 'place'),
      distanceMeters: _int(json['distanceMeters']),
      location: GeoPoint(
        latitude: _double(json['latitude']),
        longitude: _double(json['longitude']),
      ),
      imageUrl: json['imageUrl']?.toString() ?? '',
      thumbnailUrl:
          json['thumbnailUrl']?.toString() ??
          json['imageUrl']?.toString() ??
          '',
      category:
          json['category']?.toString() ??
          _typeLabel(json['type']?.toString() ?? 'place'),
      rating: _nullableDouble(json['rating']),
      isOpenNow: _nullableBool(json['isOpenNow']),
      statusLabel: json['statusLabel']?.toString() ?? 'Horario no disponible',
    );
  }

  LocalEvent _eventFromJson(Map<String, dynamic> json) {
    return LocalEvent(
      id: json['id']?.toString() ?? 'event',
      title: json['title']?.toString() ?? 'Evento local',
      city: json['category']?.toString() ?? 'Cerca de ti',
      category: json['category']?.toString() ?? 'Local',
      startsAt:
          DateTime.tryParse(json['startsAt']?.toString() ?? '') ??
          DateTime.now().add(const Duration(days: 1)),
      imageUrl: json['imageUrl']?.toString() ?? '',
      location: GeoPoint(
        latitude: _double(json['latitude']),
        longitude: _double(json['longitude']),
      ),
    );
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
      return [
        for (final item in results.take(8))
          if (item is Map)
            _tomTomPlaceFromJson(Map<String, dynamic>.from(item)),
      ];
    } catch (_) {
      return const [];
    }
  }

  NearbyPlace _tomTomPlaceFromJson(Map<String, dynamic> json) {
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
    final imageUrl = _getRandomImageUrlForCategory(category, name);
    return NearbyPlace(
      id: json['id']?.toString() ?? '',
      name: name,
      type: categories.isEmpty ? 'Atraccion' : _typeLabel(categories.first),
      distanceMeters: _int(json['dist']),
      location: GeoPoint(
        latitude: _double(position['lat']),
        longitude: _double(position['lon']),
      ),
      category: category,
      imageUrl: imageUrl,
      thumbnailUrl: imageUrl,
      statusLabel: 'Abierto',
      isOpenNow: true,
    );
  }

  String querySafe(Object? value) {
    return value?.toString().trim().isNotEmpty == true
        ? value.toString().trim()
        : 'Lugar';
  }

  double? _nullableDouble(Object? value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  bool? _nullableBool(Object? value) {
    if (value is bool) return value;
    final text = value?.toString().toLowerCase();
    if (text == 'true') return true;
    if (text == 'false') return false;
    return null;
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
          'categorySet': '7376,9362,9376,7318,7300,9379,9350,9382',
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
      return [
        for (final item in results)
          if (item is Map)
            _tomTomPlaceFromJson(Map<String, dynamic>.from(item)),
      ];
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
