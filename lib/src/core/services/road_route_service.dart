import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../../domain/models.dart';

enum TrafficSeverity { unavailable, clear, moderate, heavy, severe }

class RoutePortWaypoint {
  const RoutePortWaypoint({
    required this.name,
    required this.location,
    required this.role,
  });

  final String name;
  final GeoPoint location;
  final String role;
}

class RoadRouteResult {
  const RoadRouteResult({
    required this.geometry,
    this.maritimeSegments = const [],
    this.flightSegments = const [],
    this.walkingSegments = const [],
    this.ports = const [],
    this.airports = const [],
    this.usesMaritimeTransfer = false,
    this.usesFlightTransfer = false,
    this.transitAdviceMessage,
    this.usesLiveTraffic = false,
    this.usedFallback = false,
    this.distanceMeters = 0,
    this.travelTimeSeconds,
    this.trafficDelaySeconds,
    this.trafficSeverity = TrafficSeverity.unavailable,
  });

  final List<GeoPoint> geometry;
  final List<List<GeoPoint>> maritimeSegments;
  final List<List<GeoPoint>> flightSegments;
  final List<List<GeoPoint>> walkingSegments;
  final List<RoutePortWaypoint> ports;
  final List<RoutePortWaypoint> airports;
  final bool usesMaritimeTransfer;
  final bool usesFlightTransfer;
  final String? transitAdviceMessage;
  final bool usesLiveTraffic;
  final bool usedFallback;
  final double distanceMeters;
  final int? travelTimeSeconds;
  final int? trafficDelaySeconds;
  final TrafficSeverity trafficSeverity;
}

class RoadRouteService {
  RoadRouteService({
    http.Client? client,
    String osrmBaseUrl = 'https://router.project-osrm.org',
    String overpassUrl = 'https://overpass-api.de/api/interpreter',
    String? tomTomApiKey,
    String tomTomRoutingBaseUrl = 'https://api.tomtom.com',
  }) : _client = client ?? http.Client(),
       _osrmBaseUrl = osrmBaseUrl,
       _overpassUrl = overpassUrl,
       _tomTomApiKey = tomTomApiKey ?? AppConfig.tomTomApiKey,
       _tomTomRoutingBaseUrl = tomTomRoutingBaseUrl;

  final http.Client _client;
  final String _osrmBaseUrl;
  final String _overpassUrl;
  final String _tomTomApiKey;
  final String _tomTomRoutingBaseUrl;

  static final Map<String, Future<RoadRouteResult>> _routeCache = {};
  static final Map<String, Future<List<RoutePortWaypoint>>> _portCache = {};

  bool get hasLiveTrafficProvider => _tomTomApiKey.trim().isNotEmpty;

  Future<RoadRouteResult> resolveRoute(
    List<GeoPoint> points, {
    bool preferLiveTraffic = false,
    bool forceRefresh = false,
    double? originHeading,
  }) {
    if (points.length < 2) {
      return Future.value(RoadRouteResult(geometry: points));
    }
    final key = [
      preferLiveTraffic && hasLiveTrafficProvider ? 'traffic' : 'road',
      points.map(_pointKey).join('|'),
      if (originHeading != null) 'h_${originHeading.round()}',
      if (preferLiveTraffic && hasLiveTrafficProvider)
        DateTime.now().millisecondsSinceEpoch ~/ Duration.millisecondsPerMinute,
    ].join('|');
    if (forceRefresh) {
      return _resolveRoute(
        points,
        preferLiveTraffic: preferLiveTraffic && hasLiveTrafficProvider,
        originHeading: originHeading,
      );
    }
    return _routeCache.putIfAbsent(
      key,
      () => _resolveRoute(
        points,
        preferLiveTraffic: preferLiveTraffic && hasLiveTrafficProvider,
        originHeading: originHeading,
      ),
    );
  }

  Future<RoadRouteResult> _resolveRoute(
    List<GeoPoint> points, {
    required bool preferLiveTraffic,
    double? originHeading,
  }) async {
    final geometry = <GeoPoint>[];
    final maritimeSegments = <List<GeoPoint>>[];
    final flightSegments = <List<GeoPoint>>[];
    final walkingSegments = <List<GeoPoint>>[];
    final ports = <RoutePortWaypoint>[];
    final airports = <RoutePortWaypoint>[];
    var usesMaritimeTransfer = false;
    var usesFlightTransfer = false;
    var usedFallback = false;
    var usesLiveTraffic = false;
    var totalDistanceMeters = 0.0;
    var totalTravelTimeSeconds = 0;
    var totalTrafficDelaySeconds = 0;
    String? transitAdviceMessage;

    for (var index = 0; index < points.length - 1; index++) {
      final start = points[index];
      final end = points[index + 1];
      final isFirstLeg = index == 0;
      final legHeading = isFirstLeg ? originHeading : null;
      final directDistance = _distanceMeters(start, end);

      // Long-distance / Intercontinental transfer (> 400 km): Build Flight-aware route
      if (directDistance > 400000) {
        final flightRoute = await _buildFlightAwareRoute(start, end);
        if (flightRoute != null) {
          _appendGeometry(geometry, flightRoute.geometry);
          flightSegments.addAll(flightRoute.flightSegments);
          airports.addAll(flightRoute.airports);
          usesFlightTransfer = true;
          transitAdviceMessage = flightRoute.transitAdviceMessage;
          totalDistanceMeters += flightRoute.distanceMeters;
          totalTravelTimeSeconds += (directDistance / 220).round(); // ~800 km/h flight speed
          continue;
        }
      }

      _DrivingRoute? roadRoute;
      if (preferLiveTraffic) {
        roadRoute = await _fetchTomTomTrafficRoute(start, end, originHeading: legHeading);
      }
      roadRoute ??= await _fetchDrivingRoute(start, end, originHeading: legHeading);

      final requiresPortTransfer =
          roadRoute == null ||
          _looksLikeMaritimeTransfer(roadRoute, start, end);

      if (!requiresPortTransfer) {
        final roadGeo = roadRoute.geometry;
        List<GeoPoint> fullLegGeometry = [];
        if (roadGeo.isNotEmpty) {
          final firstPoint = roadGeo.first;
          final lastPoint = roadGeo.last;
          
          if (_distanceMeters(start, firstPoint) <= 15) {
            fullLegGeometry.add(start);
          }

          _appendGeometry(fullLegGeometry, roadGeo);

          if (_distanceMeters(lastPoint, end) <= 15) {
            fullLegGeometry.add(end);
          }
        } else {
          fullLegGeometry = [start, end];
        }

        _appendGeometry(geometry, fullLegGeometry.isEmpty ? [start, end] : fullLegGeometry);
        totalDistanceMeters += roadRoute.distanceMeters;
        totalTravelTimeSeconds += roadRoute.travelTimeSeconds ?? 0;
        totalTrafficDelaySeconds += roadRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || roadRoute.usesLiveTraffic;
        continue;
      }

      final maritimeRoute = await _buildMaritimeAwareRoute(start, end);
      if (maritimeRoute != null) {
        _appendGeometry(geometry, maritimeRoute.geometry);
        maritimeSegments.addAll(maritimeRoute.maritimeSegments);
        ports.addAll(maritimeRoute.ports);
        usesMaritimeTransfer = true;
        transitAdviceMessage = '⛵ Tramo marítimo requerido: Dirigiéndote al muelle para tomar la embarcación hacia tu destino.';
        totalDistanceMeters += maritimeRoute.distanceMeters;
        totalTravelTimeSeconds += maritimeRoute.travelTimeSeconds ?? 0;
        totalTrafficDelaySeconds += maritimeRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || maritimeRoute.usesLiveTraffic;
      } else if (roadRoute != null) {
        final roadGeo = roadRoute.geometry;
        List<GeoPoint> fullLegGeometry = [];
        if (roadGeo.isNotEmpty) {
          final firstPoint = roadGeo.first;
          final lastPoint = roadGeo.last;
          if (_distanceMeters(start, firstPoint) <= 15) {
            fullLegGeometry.add(start);
          }
          _appendGeometry(fullLegGeometry, roadGeo);
          if (_distanceMeters(lastPoint, end) <= 15) {
            fullLegGeometry.add(end);
          }
        } else {
          fullLegGeometry = [start, end];
        }
        _appendGeometry(geometry, fullLegGeometry.isEmpty ? [start, end] : fullLegGeometry);
        totalDistanceMeters += roadRoute.distanceMeters;
        totalTravelTimeSeconds += roadRoute.travelTimeSeconds ?? 0;
        totalTrafficDelaySeconds += roadRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || roadRoute.usesLiveTraffic;
      } else {
        // Pedestrian / trail off-road access segment
        walkingSegments.add([start, end]);
        _appendGeometry(geometry, [start, end]);
        totalDistanceMeters += _distanceMeters(start, end);
        usedFallback = true;
      }
    }

    return RoadRouteResult(
      geometry: geometry.isEmpty ? points : geometry,
      maritimeSegments: maritimeSegments,
      flightSegments: flightSegments,
      walkingSegments: walkingSegments,
      ports: _dedupePorts(ports),
      airports: _dedupePorts(airports),
      usesMaritimeTransfer: usesMaritimeTransfer,
      usesFlightTransfer: usesFlightTransfer,
      transitAdviceMessage: transitAdviceMessage,
      usesLiveTraffic: usesLiveTraffic,
      usedFallback: usedFallback,
      distanceMeters: totalDistanceMeters,
      travelTimeSeconds: totalTravelTimeSeconds == 0
          ? null
          : totalTravelTimeSeconds,
      trafficDelaySeconds: usesLiveTraffic ? totalTrafficDelaySeconds : null,
      trafficSeverity: usesLiveTraffic
          ? _trafficSeverity(totalTrafficDelaySeconds, totalTravelTimeSeconds)
          : TrafficSeverity.unavailable,
    );
  }

  final Map<String, List<RoutePortWaypoint>> _airportsDynamicCache = {};

  Future<RoadRouteResult?> _buildFlightAwareRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final startAirports = await _findAirportsNear(start, role: 'Aeropuerto salida');
    final endAirports = await _findAirportsNear(end, role: 'Aeropuerto llegada');
    final startAirport = startAirports.isNotEmpty ? startAirports.first : null;
    final endAirport = endAirports.isNotEmpty ? endAirports.first : null;

    final geometry = <GeoPoint>[];
    final airports = <RoutePortWaypoint>[?startAirport, ?endAirport];
    final airStart = startAirport?.location ?? start;
    final airEnd = endAirport?.location ?? end;

    // Ground leg from user origin to departure airport (if found dynamically)
    if (startAirport != null && _distanceMeters(start, airStart) > 200) {
      final startRoad = await _fetchDrivingRoute(start, airStart);
      _appendGeometry(geometry, startRoad?.geometry ?? [start, airStart]);
    } else {
      _appendGeometry(geometry, [start]);
    }

    final advice = '✈️ Conexión aérea requerida: Dirígete a ${startAirport?.name ?? "tu aeropuerto de salida"} para abordar tu vuelo hacia ${endAirport?.name ?? "el destino"}.';

    return RoadRouteResult(
      geometry: geometry,
      flightSegments: [[airStart, airEnd]],
      airports: airports,
      usesFlightTransfer: true,
      transitAdviceMessage: advice,
      distanceMeters: _geometryDistanceMeters(geometry),
    );
  }

  Future<List<RoutePortWaypoint>> findAirportsNear(
    GeoPoint point, {
    required String role,
  }) => _findAirportsNear(point, role: role);

  Future<List<RoutePortWaypoint>> _findAirportsNear(
    GeoPoint point, {
    required String role,
  }) async {
    final cacheKey = '${point.latitude.toStringAsFixed(1)},${point.longitude.toStringAsFixed(1)}';
    if (_airportsDynamicCache.containsKey(cacheKey)) {
      return _airportsDynamicCache[cacheKey]!;
    }

    final candidateList = <RoutePortWaypoint>[];

    // 1. Photon Spatial Geocoding (fastest and ranked by user coordinates)
    try {
      final photonUrl = Uri.parse(
        'https://photon.komoot.io/api/?q=aeropuerto&lat=${point.latitude}&lon=${point.longitude}&limit=10',
      );
      final response = await _client.get(
        photonUrl,
        headers: const {'User-Agent': 'VibeTours/1.0'},
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final features = decoded['features'] as List<dynamic>? ?? const [];
        for (final item in features) {
          if (item is! Map<String, dynamic>) continue;
          final properties = item['properties'] as Map<String, dynamic>? ?? const {};
          final geometry = item['geometry'] as Map<String, dynamic>? ?? const {};
          final coords = geometry['coordinates'] as List<dynamic>? ?? const [];
          if (coords.length < 2) continue;
          final lon = (coords[0] as num?)?.toDouble();
          final lat = (coords[1] as num?)?.toDouble();
          if (lat == null || lon == null) continue;

          final osmValue = properties['osm_value']?.toString() ?? '';
          final type = properties['type']?.toString() ?? '';
          final name = properties['name']?.toString() ?? '';

          // Filter out bus stops, train stations, and unrelated administrative regions
          final isAerodrome = osmValue == 'aerodrome' || osmValue == 'terminal' || type == 'aerodrome';
          final hasAirportName = name.toLowerCase().contains('aeropuerto') || name.toLowerCase().contains('airport');
          final isIgnored = osmValue == 'bus_stop' || osmValue == 'station' || osmValue == 'administrative';

          if ((isAerodrome || hasAirportName) && !isIgnored && name.isNotEmpty) {
            candidateList.add(
              RoutePortWaypoint(
                name: name,
                location: GeoPoint(latitude: lat, longitude: lon),
                role: role,
              ),
            );
          }
        }
      }
    } catch (_) {}

    // 2. Overpass API fallback if Photon had no candidates
    if (candidateList.isEmpty) {
      final query = '''
[out:json][timeout:5];
(
  node(around:95000,${point.latitude},${point.longitude})["aeroway"="aerodrome"];
  way(around:95000,${point.latitude},${point.longitude})["aeroway"="aerodrome"];
);
out center tags 10;
''';
      try {
        final response = await _client
            .post(
              Uri.parse(_overpassUrl),
              headers: const {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'VIBETOURS/1.0',
              },
              body: {'data': query},
            )
            .timeout(const Duration(seconds: 4));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final decoded = jsonDecode(response.body) as Map<String, dynamic>;
          final elements = decoded['elements'] as List<dynamic>? ?? const [];
          for (final raw in elements) {
            if (raw is! Map<String, dynamic>) continue;
            final lat = (raw['lat'] as num?)?.toDouble() ??
                ((raw['center'] as Map<String, dynamic>?)?['lat'] as num?)?.toDouble();
            final lon = (raw['lon'] as num?)?.toDouble() ??
                ((raw['center'] as Map<String, dynamic>?)?['lon'] as num?)?.toDouble();
            if (lat == null || lon == null) continue;
            final tags = raw['tags'] as Map<String, dynamic>? ?? const {};
            final name = tags['name'] ?? tags['name:es'] ?? tags['name:en'] ?? 'Aeropuerto';
            candidateList.add(
              RoutePortWaypoint(
                name: name.toString(),
                location: GeoPoint(latitude: lat, longitude: lon),
                role: role,
              ),
            );
          }
        }
      } catch (_) {}
    }

    // 3. Nominatim fallback if still empty
    if (candidateList.isEmpty) {
      try {
        final nominatimUrl = Uri.parse(
          'https://nominatim.openstreetmap.org/search?q=aeropuerto&format=json&limit=5&bounded=1&viewbox=${point.longitude - 1.2},${point.latitude + 1.2},${point.longitude + 1.2},${point.latitude - 1.2}',
        );
        final nomResponse = await _client.get(
          nominatimUrl,
          headers: const {'User-Agent': 'VibeTours/1.0'},
        ).timeout(const Duration(seconds: 4));
        if (nomResponse.statusCode == 200) {
          final nomDecoded = jsonDecode(nomResponse.body) as List<dynamic>;
          for (final raw in nomDecoded) {
            if (raw is! Map<String, dynamic>) continue;
            final lat = double.tryParse(raw['lat']?.toString() ?? '');
            final lon = double.tryParse(raw['lon']?.toString() ?? '');
            if (lat == null || lon == null) continue;
            final name = (raw['name'] ?? raw['display_name']?.toString().split(',').first ?? 'Aeropuerto').toString();
            candidateList.add(RoutePortWaypoint(name: name, location: GeoPoint(latitude: lat, longitude: lon), role: role));
          }
        }
      } catch (_) {}
    }

    if (candidateList.isNotEmpty) {
      // Sort strictly by distance to the user's origin point
      candidateList.sort(
        (a, b) => _distanceMeters(point, a.location)
            .compareTo(_distanceMeters(point, b.location)),
      );
      final deduped = _dedupePorts(candidateList);
      _airportsDynamicCache[cacheKey] = deduped;
      return deduped;
    }

    return const [];
  }

  Future<RoadRouteResult?> _buildMaritimeAwareRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final startPorts = await _findPortsNear(start, role: 'Puerto salida');
    final endPorts = await _findPortsNear(end, role: 'Puerto llegada');
    final startPort = startPorts.isEmpty ? null : startPorts.first;
    final endPort = endPorts.isEmpty ? null : endPorts.first;
    if (startPort == null && endPort == null) return null;

    final geometry = <GeoPoint>[];
    final ports = <RoutePortWaypoint>[?startPort, ?endPort];
    final seaStart = startPort?.location ?? start;
    final seaEnd = endPort?.location ?? end;

    if (startPort != null && _distanceMeters(start, seaStart) > 180) {
      final startRoad = await _fetchDrivingRoute(start, seaStart);
      _appendGeometry(geometry, startRoad?.geometry ?? [start, seaStart]);
    } else {
      _appendGeometry(geometry, [start]);
    }

    if (_distanceMeters(seaStart, seaEnd) > 120) {
      _appendGeometry(geometry, [seaStart, seaEnd]);
    }

    if (endPort != null && _distanceMeters(seaEnd, end) > 180) {
      final endRoad = await _fetchDrivingRoute(seaEnd, end);
      _appendGeometry(geometry, endRoad?.geometry ?? [seaEnd, end]);
    } else {
      _appendGeometry(geometry, [end]);
    }

    final portName = startPort?.name ?? 'el muelle de embarque';
    return RoadRouteResult(
      geometry: geometry,
      maritimeSegments: [
        if (_distanceMeters(seaStart, seaEnd) > 120) [seaStart, seaEnd],
      ],
      ports: ports,
      usesMaritimeTransfer: true,
      transitAdviceMessage: '⛵ Tramo marítimo requerido: La ruta terrestre te llevará hasta $portName, donde podrás abordar la embarcación hacia tu destino.',
      distanceMeters: _geometryDistanceMeters(geometry),
    );
  }

  Future<_DrivingRoute?> _fetchDrivingRoute(
    GeoPoint start,
    GeoPoint end, {
    double? originHeading,
  }) async {
    final baseUrls = [
      _osrmBaseUrl,
      'https://routing.openstreetmap.de/routed-car',
    ];

    for (final baseUrl in baseUrls) {
      final uri = Uri.parse(
        '$baseUrl/route/v1/driving/'
        '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
        '?overview=full&geometries=geojson&steps=true&alternatives=true&continue_straight=true&radiuses=250;250',
      );
      try {
        final response = await _client
            .get(uri)
            .timeout(const Duration(seconds: 5));
        if (response.statusCode < 200 || response.statusCode >= 300) {
          continue;
        }
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        if (decoded['code'] != 'Ok') continue;
        final routes = decoded['routes'] as List<dynamic>? ?? const [];
        if (routes.isEmpty) continue;

        final candidates = <_DrivingRoute>[];
        for (final item in routes) {
          if (item is Map<String, dynamic>) {
            final geometry = _parseGeoJsonGeometry(item['geometry']);
            if (geometry.length < 2) continue;
            candidates.add(_DrivingRoute(
              geometry: geometry,
              distanceMeters: (item['distance'] as num?)?.toDouble() ?? 0,
              travelTimeSeconds: (item['duration'] as num?)?.round(),
              trafficDelaySeconds: null,
              usesLiveTraffic: false,
              hasFerrySegment: _containsFerryStep(item),
            ));
          }
        }

        final best = _selectBestBalancedRoute(candidates);
        if (best != null) return best;
      } on Object {
        continue;
      }
    }
    return null;
  }

  Future<_DrivingRoute?> _fetchTomTomTrafficRoute(
    GeoPoint start,
    GeoPoint end, {
    double? originHeading,
  }) async {
    final key = _tomTomApiKey.trim();
    if (key.isEmpty) return null;
    final locations =
        '${start.latitude},${start.longitude}:${end.latitude},${end.longitude}';
    final directDistance = _distanceMeters(start, end);
    final isIntraUrban = directDistance < 35000;

    final uri =
        Uri.parse(
          '$_tomTomRoutingBaseUrl/routing/1/calculateRoute/$locations/json',
        ).replace(
          queryParameters: {
            'key': key,
            'traffic': 'true',
            'routeType': 'fastest',
            'travelMode': 'car',
            'maxAlternatives': '2',
            if (isIntraUrban) 'avoid': 'unpavedRoads',
            'computeTravelTimeFor': 'all',
            'instructionsType': 'text',
            if (originHeading != null && originHeading >= 0)
              'heading': originHeading.round().toString(),
          },
        );
    try {
      final response = await _client
          .get(uri, headers: const {'User-Agent': 'VIBETOURS/1.0'})
          .timeout(const Duration(seconds: 10));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return null;
      }
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final routes = decoded['routes'] as List<dynamic>? ?? const [];
      if (routes.isEmpty) return null;

      final candidates = <_DrivingRoute>[];
      for (final item in routes) {
        if (item is Map<String, dynamic>) {
          final geometry = _parseTomTomRouteGeometry(item);
          if (geometry.length < 2) continue;
          final summary = item['summary'] as Map<String, dynamic>? ?? const {};
          candidates.add(_DrivingRoute(
            geometry: geometry,
            distanceMeters:
                (summary['lengthInMeters'] as num?)?.toDouble() ??
                _geometryDistanceMeters(geometry),
            travelTimeSeconds: (summary['travelTimeInSeconds'] as num?)?.round(),
            trafficDelaySeconds:
                (summary['trafficDelayInSeconds'] as num?)?.round() ?? 0,
            usesLiveTraffic: true,
            hasFerrySegment: _containsFerryStep(item),
          ));
        }
      }

      return _selectBestBalancedRoute(candidates);
    } on Object {
      return null;
    }
  }

  _DrivingRoute? _selectBestBalancedRoute(List<_DrivingRoute> candidates) {
    if (candidates.isEmpty) return null;
    if (candidates.length == 1) return candidates.first;

    final minDistance = candidates
        .map((c) => c.distanceMeters)
        .reduce((a, b) => a < b ? a : b);

    _DrivingRoute best = candidates.first;
    double bestScore = double.infinity;

    for (final candidate in candidates) {
      final distKm = candidate.distanceMeters / 1000.0;
      final timeMin = (candidate.travelTimeSeconds ?? 0) / 60.0;
      final distanceRatio = candidate.distanceMeters / math.max(minDistance, 1.0);

      // Distance sanity filter:
      // If a highway bypass adds > 30% extra distance for minimal time savings,
      // apply a steep penalty to favor the direct urban avenue.
      double detourPenalty = 0.0;
      if (distanceRatio > 1.30) {
        detourPenalty = (distanceRatio - 1.0) * 30.0;
      }

      final score = timeMin + (distKm * 0.5) + detourPenalty;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return best;
  }


  static final List<RoutePortWaypoint> _curatedFallbackPorts = [
    RoutePortWaypoint(
      name: 'Muelle de la Bodeguita (Cartagena)',
      location: const GeoPoint(latitude: 10.4206, longitude: -75.5539),
      role: 'Puerto de Embarque',
    ),
    RoutePortWaypoint(
      name: 'Muelle Turístico de Cartagena',
      location: const GeoPoint(latitude: 10.4190, longitude: -75.5525),
      role: 'Puerto de Embarque',
    ),
  ];

  Future<List<RoutePortWaypoint>> _findPortsNear(
    GeoPoint point, {
    required String role,
  }) async {
    final key = '${_pointKey(point)}|$role';
    return _portCache.putIfAbsent(key, () async {
      for (final radius in const [5000, 15000, 40000, 90000]) {
        final ports = await _fetchPorts(
          point,
          role: role,
          radiusMeters: radius,
        );
        if (ports.isNotEmpty) return ports;
      }
      final fallback = _curatedFallbackPorts.where((p) {
        return _distanceMeters(point, p.location) <= 50000;
      }).toList();
      if (fallback.isNotEmpty) return fallback;
      return const [];
    });
  }

  Future<List<RoutePortWaypoint>> _fetchPorts(
    GeoPoint point, {
    required String role,
    required int radiusMeters,
  }) async {
    final query =
        '''
[out:json][timeout:14];
(
  node(around:$radiusMeters,${point.latitude},${point.longitude})["amenity"="ferry_terminal"];
  way(around:$radiusMeters,${point.latitude},${point.longitude})["amenity"="ferry_terminal"];
  node(around:$radiusMeters,${point.latitude},${point.longitude})["leisure"="marina"];
  way(around:$radiusMeters,${point.latitude},${point.longitude})["leisure"="marina"];
  node(around:$radiusMeters,${point.latitude},${point.longitude})["man_made"="pier"];
  way(around:$radiusMeters,${point.latitude},${point.longitude})["man_made"="pier"];
  node(around:$radiusMeters,${point.latitude},${point.longitude})["harbour"];
  way(around:$radiusMeters,${point.latitude},${point.longitude})["harbour"];
  node(around:$radiusMeters,${point.latitude},${point.longitude})["seamark:type"="harbour"];
  way(around:$radiusMeters,${point.latitude},${point.longitude})["seamark:type"="harbour"];
);
out center tags 30;
''';
    try {
      final response = await _client
          .post(
            Uri.parse(_overpassUrl),
            headers: const {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'VIBETOURS/1.0',
            },
            body: {'data': query},
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return const [];
      }
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final elements = decoded['elements'] as List<dynamic>? ?? const [];
      final ports = <RoutePortWaypoint>[];
      for (final raw in elements) {
        if (raw is! Map<String, dynamic>) continue;
        final lat =
            (raw['lat'] as num?)?.toDouble() ??
            ((raw['center'] as Map<String, dynamic>?)?['lat'] as num?)
                ?.toDouble();
        final lon =
            (raw['lon'] as num?)?.toDouble() ??
            ((raw['center'] as Map<String, dynamic>?)?['lon'] as num?)
                ?.toDouble();
        if (lat == null || lon == null) continue;
        final tags = raw['tags'] as Map<String, dynamic>? ?? const {};
        final name = _portName(tags, role);
        ports.add(
          RoutePortWaypoint(
            name: name,
            location: GeoPoint(latitude: lat, longitude: lon),
            role: role,
          ),
        );
      }
      ports.sort(
        (a, b) => _distanceMeters(
          point,
          a.location,
        ).compareTo(_distanceMeters(point, b.location)),
      );
      return _dedupePorts(ports);
    } on Object {
      return const [];
    }
  }

  bool _looksLikeMaritimeTransfer(
    _DrivingRoute route,
    GeoPoint start,
    GeoPoint end,
  ) {
    if (route.hasFerrySegment) return true;
    final directDistance = _distanceMeters(start, end);
    if (route.distanceMeters <= 0) return true;

    // If the driving route terminates far from destination (e.g. boat-only beaches like Playa Cristal)
    if (route.geometry.isNotEmpty) {
      final roadEndDist = _distanceMeters(route.geometry.last, end);
      if (roadEndDist > 450) return true;
    }

    if (directDistance < 3000) return false;
    if (route.distanceMeters / directDistance > 3.5) return true;
    return false;
  }

  List<GeoPoint> _parseGeoJsonGeometry(Object? rawGeometry) {
    if (rawGeometry is! Map<String, dynamic>) return const [];
    final coordinates =
        rawGeometry['coordinates'] as List<dynamic>? ?? const [];
    return [
      for (final item in coordinates)
        if (item is List && item.length >= 2)
          GeoPoint(
            latitude: (item[1] as num).toDouble(),
            longitude: (item[0] as num).toDouble(),
          ),
    ];
  }

  List<GeoPoint> _parseTomTomRouteGeometry(Map<String, dynamic> route) {
    final points = <GeoPoint>[];
    final legs = route['legs'] as List<dynamic>? ?? const [];
    for (final rawLeg in legs) {
      if (rawLeg is! Map<String, dynamic>) continue;
      final rawPoints = rawLeg['points'] as List<dynamic>? ?? const [];
      for (final rawPoint in rawPoints) {
        if (rawPoint is! Map<String, dynamic>) continue;
        final lat = (rawPoint['latitude'] as num?)?.toDouble();
        final lon = (rawPoint['longitude'] as num?)?.toDouble();
        if (lat == null || lon == null) continue;
        points.add(GeoPoint(latitude: lat, longitude: lon));
      }
    }
    return points;
  }

  bool _containsFerryStep(Map<String, dynamic> route) {
    final routeText = jsonEncode(route).toLowerCase();
    return routeText.contains('ferry') ||
        routeText.contains('transbordador') ||
        routeText.contains('boat') ||
        routeText.contains('terminal marit');
  }

  static String _portName(Map<String, dynamic> tags, String role) {
    final rawName =
        tags['name'] ??
        tags['official_name'] ??
        tags['alt_name'] ??
        tags['short_name'];
    final name = rawName?.toString().trim();
    if (name != null && name.isNotEmpty) return name;
    return role;
  }

  static List<RoutePortWaypoint> _dedupePorts(List<RoutePortWaypoint> ports) {
    final unique = <RoutePortWaypoint>[];
    for (final port in ports) {
      final exists = unique.any(
        (item) => _distanceMeters(item.location, port.location) < 80,
      );
      if (!exists) unique.add(port);
    }
    return unique;
  }

  static void _appendGeometry(
    List<GeoPoint> target,
    Iterable<GeoPoint> points,
  ) {
    for (final point in points) {
      if (target.isEmpty || _distanceMeters(target.last, point) > 8) {
        target.add(point);
      }
    }
  }

  static double _geometryDistanceMeters(List<GeoPoint> geometry) {
    if (geometry.length < 2) return 0;
    var distance = 0.0;
    for (var index = 0; index < geometry.length - 1; index++) {
      distance += _distanceMeters(geometry[index], geometry[index + 1]);
    }
    return distance;
  }

  static TrafficSeverity _trafficSeverity(int delaySeconds, int travelSeconds) {
    if (travelSeconds <= 0 || delaySeconds <= 0) return TrafficSeverity.clear;
    final delayRatio = delaySeconds / travelSeconds;
    if (delaySeconds >= 1800 || delayRatio >= 0.45) {
      return TrafficSeverity.severe;
    }
    if (delaySeconds >= 900 || delayRatio >= 0.28) {
      return TrafficSeverity.heavy;
    }
    if (delaySeconds >= 240 || delayRatio >= 0.12) {
      return TrafficSeverity.moderate;
    }
    return TrafficSeverity.clear;
  }

  static String _pointKey(GeoPoint point) {
    return '${point.latitude.toStringAsFixed(5)},'
        '${point.longitude.toStringAsFixed(5)}';
  }

  static double _distanceMeters(GeoPoint a, GeoPoint b) {
    const radius = 6371000.0;
    final dLat = _radians(b.latitude - a.latitude);
    final dLon = _radians(b.longitude - a.longitude);
    final lat1 = _radians(a.latitude);
    final lat2 = _radians(b.latitude);
    final hav =
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1) *
            math.cos(lat2) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    return radius * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav));
  }

  static double _radians(double degrees) => degrees * math.pi / 180;
}

class _DrivingRoute {
  const _DrivingRoute({
    required this.geometry,
    required this.distanceMeters,
    required this.travelTimeSeconds,
    required this.trafficDelaySeconds,
    required this.usesLiveTraffic,
    required this.hasFerrySegment,
  });

  final List<GeoPoint> geometry;
  final double distanceMeters;
  final int? travelTimeSeconds;
  final int? trafficDelaySeconds;
  final bool usesLiveTraffic;
  final bool hasFerrySegment;
}
