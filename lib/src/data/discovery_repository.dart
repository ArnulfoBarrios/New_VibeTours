import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
    'torre del reloj': _CorrectedPlace(
      latitude: 10.4231,
      longitude: -75.5501,
      imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80',
    ),
    'plaza de los coches': _CorrectedPlace(
      latitude: 10.4230,
      longitude: -75.5500,
      imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80',
    ),
    'museo del oro': _CorrectedPlace(
      latitude: 10.4234,
      longitude: -75.5512,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    ),
    'plaza santo domingo': _CorrectedPlace(
      latitude: 10.4236,
      longitude: -75.5521,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ),
    'museo de arte moderno': _CorrectedPlace(
      latitude: 10.4222,
      longitude: -75.5518,
      imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=800&q=80',
    ),
    'museo naval': _CorrectedPlace(
      latitude: 10.4218,
      longitude: -75.5524,
      imageUrl: 'https://images.unsplash.com/photo-1566121318594-a4f65f3a4c12?auto=format&fit=crop&w=800&q=80',
    ),
    'catedral de santa catalina': _CorrectedPlace(
      latitude: 10.4235,
      longitude: -75.5506,
      imageUrl: 'https://images.unsplash.com/photo-1548625361-155de6c7f54a?auto=format&fit=crop&w=800&q=80',
    ),
    'ciudad amurallada': _CorrectedPlace(
      latitude: 10.4238,
      longitude: -75.5500,
      imageUrl: 'https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=800&q=80',
    ),
    'museo historico': _CorrectedPlace(
      latitude: 10.4232,
      longitude: -75.5515,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'inquisicion': _CorrectedPlace(
      latitude: 10.4232,
      longitude: -75.5515,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'castillo de san sebastian del pastelillo': _CorrectedPlace(
      latitude: 10.4192,
      longitude: -75.5348,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'pastelillo': _CorrectedPlace(
      latitude: 10.4192,
      longitude: -75.5348,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'plaza de la trinidad': _CorrectedPlace(
      latitude: 10.4208,
      longitude: -75.5458,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ),
    'getsemani': _CorrectedPlace(
      latitude: 10.4208,
      longitude: -75.5458,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ),
    'castillo de san felipe': _CorrectedPlace(
      latitude: 10.4223,
      longitude: -75.5394,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'san felipe': _CorrectedPlace(
      latitude: 10.4223,
      longitude: -75.5394,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    ),
    'islas del rosario': _CorrectedPlace(
      latitude: 10.1772,
      longitude: -75.7482,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ),
    'bocagrande': _CorrectedPlace(
      latitude: 10.4042,
      longitude: -75.5567,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ),
    'obelisco': _CorrectedPlace(
      latitude: 10.4225,
      longitude: -75.5450,
      imageUrl: 'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=800&q=80',
    ),
    'declaracion de independencia': _CorrectedPlace(
      latitude: 10.4225,
      longitude: -75.5450,
      imageUrl: 'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=800&q=80',
    ),
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
    'aeropuerto': _CorrectedPlace(
      latitude: 11.1196,
      longitude: -74.2306,
      imageUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80',
    ),
    'rodadero': _CorrectedPlace(
      latitude: 11.2056,
      longitude: -74.2253,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ),
    'bahía': _CorrectedPlace(
      latitude: 11.2447,
      longitude: -74.2155,
      imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
    ),
    'bahia': _CorrectedPlace(
      latitude: 11.2447,
      longitude: -74.2155,
      imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
    ),
    'basílica': _CorrectedPlace(
      latitude: 11.2436,
      longitude: -74.2117,
      imageUrl: 'https://images.unsplash.com/photo-1548625361-18568c07802b?auto=format&fit=crop&w=800&q=80',
    ),
    'basilica': _CorrectedPlace(
      latitude: 11.2436,
      longitude: -74.2117,
      imageUrl: 'https://images.unsplash.com/photo-1548625361-18568c07802b?auto=format&fit=crop&w=800&q=80',
    ),
    'sierra nevada': _CorrectedPlace(
      latitude: 10.8753,
      longitude: -73.6908,
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    ),
    'tayrona': _CorrectedPlace(
      latitude: 11.3060,
      longitude: -74.0539,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ),
    'taganga': _CorrectedPlace(
      latitude: 11.2672,
      longitude: -74.1906,
      imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    ),
    'ziruma': _CorrectedPlace(
      latitude: 11.2225,
      longitude: -74.2150,
      imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    ),
    'playa blanca': _CorrectedPlace(
      latitude: 11.2186,
      longitude: -74.2341,
      imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&q=80',
    ),
    'novios': _CorrectedPlace(
      latitude: 11.2425,
      longitude: -74.2106,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ),
  };

  static String? findCuratedImageForPlace(String name) {
    final lower = name.toLowerCase();
    for (final entry in _correctedPlaces.entries) {
      if (lower.contains(entry.key)) {
        return entry.value.imageUrl;
      }
    }
    return null;
  }

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
    final lowerName = name.trim().toLowerCase();
    final lowerType = type.trim().toLowerCase();

    // 1. Descartar nombres puramente genéricos de una sola palabra que no aportan suficiente contexto
    const genericSingleWords = [
      'parque', 'puente', 'arroyo', 'plaza', 'lugar', 'calle', 'avenida',
      'camino', 'sendero', 'cancha', 'estadio', 'estacion', 'estación',
      'edificio', 'torre', 'centro', 'local', 'zona', 'sitio', 'punto'
    ];
    if (genericSingleWords.contains(lowerName)) {
      return true;
    }

    // 2. Palabras clave prohibidas en el nombre (infraestructura o servicios no turísticos)
    const blacklistNameKeywords = [
      'cementerio', 'cemetery', 'funeraria', 'jardines del recuerdo', 'jardín del recuerdo',
      'universidad', 'university', 'colegio', 'school', 'hospital', 'clinica', 'clínica',
      'condominio', 'conjunto residencial', 'edificio', 'torre', 'reserva residencial', 'aptos',
      'apartamento', 'consultorio', 'dental', 'odontología', 'médico',
      'arroyo', 'puente', 'bridge', 'canal', 'quebrada', 'caño', 'drenaje',
      'gasolinera', 'estacion de servicio', 'estación de servicio', 'terpel', 'texaco', 'primax',
      'brio', 'petrobras', 'shell', 'esso', 'mobil', 'peaje', 'subestación', 'subestacion',
      'electrificadora', 'transformador', 'taller', 'serviteca', 'lavadero', 'lavado',
      'parqueadero', 'parking', 'estacionamiento', 'farmacia', 'droguería', 'drogueria',
      'drogas', 'rebaja', 'banco', 'cajero', 'atm', 'davivienda', 'bancolombia', 'bbva',
      'efecty', 'supergiros', 'western union', 'ferretería', 'ferreteria', 'panadería',
      'panaderia', 'supermercado', 'miscelánea', 'miscelanea', 'alcaldía', 'notaría',
      'notaria', 'juzgado', 'comisaría', 'comisaria', 'cai', 'estacion de policia',
      'estación de policía'
    ];
    for (final kw in blacklistNameKeywords) {
      if (lowerName.contains(kw)) return true;
    }

    // 3. Tipos o categorías prohibidos
    const blacklistTypeKeywords = [
      'cemetery', 'university', 'college', 'hospital', 'clinic', 'dentist', 'physiotherapist',
      'doctor', 'residential', 'apartment', 'school', 'bridge', 'substation', 'fuel',
      'parking', 'bank', 'atm', 'pharmacy'
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
    final Map<String, LocalEvent> eventMap = {};
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('events')
          .select()
          .order('starts_at', ascending: true);
      
      final events = (response as List)
          .map((item) => LocalEvent.fromJson(item as Map<String, dynamic>))
          .toList();

      for (final e in events) {
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getStringList('local_admin_events') ?? [];
      for (final jsonStr in localJson) {
        final map = jsonDecode(jsonStr) as Map<String, dynamic>;
        final e = LocalEvent.fromJson(map);
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    final list = eventMap.values.toList();
    list.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return list;
  }

  // PRIVATE HELPERS FOR BYPASSING BACKEND

  String _weatherLabel(int code, bool isDay) {
    if (code == 0) return isDay ? 'Soleado' : 'Despejado';
    if (const [1, 2, 3].contains(code)) return isDay ? 'Soleado con nubes' : 'Parcialmente nublado';
    if (const [45, 48].contains(code)) return 'Niebla';
    if (const [51, 53, 55, 56, 57].contains(code)) return isDay ? 'Soleado / Llovizna' : 'Llovizna';
    if (const [61, 63, 65, 66, 67, 80, 81, 82].contains(code)) return 'Lluvia';
    if (const [71, 73, 75, 77, 85, 86].contains(code)) return 'Nieve';
    if (const [95, 96, 99].contains(code)) return 'Tormenta';
    return isDay ? 'Soleado' : 'Despejado';
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
    final placeId = 'search-$index';
    final defaultImg = _getRandomImageUrlForCategory(category, name, placeId: placeId);
    
    final corrected = _correctLocation(name, defaultLat, defaultLng, defaultImg);

    return NearbyPlace(
      id: placeId,
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
            final rawName = tags['official_name']?.toString() ??
                tags['name:es']?.toString() ??
                tags['name']?.toString() ??
                tags['alt_name']?.toString();
            if (rawName == null || rawName.trim().isEmpty) continue;
            var name = rawName.trim();

            // Si el nombre es algo tan genérico como "Parque" o "Plaza", intentar usar un nombre alternativo/marca/operador o descartar
            if (name.toLowerCase() == 'parque' || name.toLowerCase() == 'plaza') {
              final alt = tags['alt_name']?.toString() ??
                  tags['official_name']?.toString() ??
                  tags['brand']?.toString() ??
                  tags['operator']?.toString();
              if (alt != null && alt.trim().isNotEmpty && alt.toLowerCase() != name.toLowerCase()) {
                name = alt.trim().toLowerCase().startsWith(name.toLowerCase()) ? alt.trim() : '$name ${alt.trim()}';
              }
            }

            final defaultLat = _double(element['lat'] ?? (element['center'] as Map?)?['lat']);
            final defaultLon = _double(element['lon'] ?? (element['center'] as Map?)?['lon']);
            final typeStr = tags['tourism']?.toString() ?? tags['historic']?.toString() ?? tags['amenity']?.toString() ?? tags['leisure']?.toString() ?? tags['sport']?.toString() ?? tags['natural']?.toString() ?? 'place';
            if (defaultLat == 0.0 || defaultLon == 0.0) continue;
            if (_isAccommodation(typeStr)) continue;
            if (_isBlacklisted(name, typeStr)) continue;
            
            final category = _classifyAttraction(tags);
            final placeId = 'overpass-${element['id'] ?? idx++}';
            final defaultImg = _getRandomImageUrlForCategory(category, name, placeId: placeId);
            
            final corrected = _correctLocation(name, defaultLat, defaultLon, defaultImg);

            final distance = _distanceMeters(latitude, longitude, corrected.latitude, corrected.longitude);
            places.add(NearbyPlace(
              id: placeId,
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
    final placeId = json['id']?.toString() ?? name;
    final defaultImg = _getRandomImageUrlForCategory(category, name, placeId: placeId);
    
    final defaultLat = _double(position['lat']);
    final defaultLon = _double(position['lon']);
    
    final corrected = _correctLocation(name, defaultLat, defaultLon, defaultImg);
    
    final distance = (userLat != null && userLon != null)
        ? _distanceMeters(userLat, userLon, corrected.latitude, corrected.longitude).round()
        : _int(json['dist']);

    return NearbyPlace(
      id: placeId,
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

  int _hashString(String input) {
    int h = 0;
    for (int i = 0; i < input.codeUnits.length; i++) {
      h = (31 * h + input.codeUnitAt(i)) & 0x7FFFFFFF;
    }
    return h;
  }

  String _getRandomImageUrlForCategory(String category, String name, {String placeId = ''}) {
    final searchStr = '${category.toLowerCase()} ${name.toLowerCase()}';
    final seedStr = '${placeId}_${name}_$category';
    final hash = _hashString(seedStr);

    List<String> pool;

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
      pool = const [
        'https://images.unsplash.com/photo-1548625361-155de6c7f54d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 2. Playas, islas y bahías
    else if (searchStr.contains('playa') ||
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
      pool = const [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 3. Atracciones, entretenimiento, diversiones y parques temáticos (Divercity, etc.)
    else if (searchStr.contains('divercity') ||
        searchStr.contains('atraccion') ||
        searchStr.contains('attraction') ||
        searchStr.contains('theme_park') ||
        searchStr.contains('recreation') ||
        searchStr.contains('recreativa') ||
        searchStr.contains('diversion')) {
      pool = const [
        'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1561489413-985b06da5bee?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 4. Parques verdes, jardines y naturaleza urbana
    else if (searchStr.contains('parque') ||
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
      pool = const [
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 5. Museos y arte
    else if (searchStr.contains('museo') ||
        searchStr.contains('museum') ||
        searchStr.contains('galeria') ||
        searchStr.contains('galería') ||
        searchStr.contains('gallery') ||
        searchStr.contains('art') ||
        searchStr.contains('arte')) {
      pool = const [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 6. Plazas, calles urbanas y paseos
    else if (searchStr.contains('plaza') ||
        searchStr.contains('square') ||
        searchStr.contains('calle') ||
        searchStr.contains('street') ||
        searchStr.contains('avenida') ||
        searchStr.contains('paseo') ||
        searchStr.contains('castellana')) {
      pool = const [
        'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 7. Fallback general urbano / turístico
    else {
      pool = const [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      ];
    }

    return pool[hash % pool.length];
  }
}
