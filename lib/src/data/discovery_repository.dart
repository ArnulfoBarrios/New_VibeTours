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
    if (items.isEmpty) {
      return _fallbackPlaces(latitude: latitude, longitude: longitude);
    }
    return [
      for (final item in items.take(12))
        _nearbyPlaceFromJson(Map<String, dynamic>.from(item as Map)),
    ];
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
    return NearbyPlace(
      id: json['id']?.toString() ?? '',
      name:
          poi['name']?.toString() ??
          address['freeformAddress']?.toString() ??
          querySafe(address['municipality']),
      type: categories.isEmpty ? 'Lugar' : _typeLabel(categories.first),
      distanceMeters: _int(json['dist']),
      location: GeoPoint(
        latitude: _double(position['lat']),
        longitude: _double(position['lon']),
      ),
      category: categories.isEmpty ? 'Lugar' : _typeLabel(categories.first),
      statusLabel: 'Resultado TomTom',
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
}
