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
    return [
      for (final item in items.take(12))
        _nearbyPlaceFromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  Future<List<NearbyPlace>> searchPlaces(String query) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return const [];
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
      name: json['name']?.toString() ?? 'Lugar cercano',
      type: _typeLabel(json['type']?.toString() ?? 'place'),
      distanceMeters: _int(json['distanceMeters']),
      location: GeoPoint(
        latitude: _double(json['latitude']),
        longitude: _double(json['longitude']),
      ),
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
}
