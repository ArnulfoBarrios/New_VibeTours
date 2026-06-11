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
    this.ports = const [],
    this.usesMaritimeTransfer = false,
    this.usesLiveTraffic = false,
    this.usedFallback = false,
    this.distanceMeters = 0,
    this.travelTimeSeconds,
    this.trafficDelaySeconds,
    this.trafficSeverity = TrafficSeverity.unavailable,
  });

  final List<GeoPoint> geometry;
  final List<List<GeoPoint>> maritimeSegments;
  final List<RoutePortWaypoint> ports;
  final bool usesMaritimeTransfer;
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
  }) {
    if (points.length < 2) {
      return Future.value(RoadRouteResult(geometry: points));
    }
    final key = [
      preferLiveTraffic && hasLiveTrafficProvider ? 'traffic' : 'road',
      points.map(_pointKey).join('|'),
      if (preferLiveTraffic && hasLiveTrafficProvider)
        DateTime.now().millisecondsSinceEpoch ~/ Duration.millisecondsPerMinute,
    ].join('|');
    if (forceRefresh) {
      return _resolveRoute(
        points,
        preferLiveTraffic: preferLiveTraffic && hasLiveTrafficProvider,
      );
    }
    return _routeCache.putIfAbsent(
      key,
      () => _resolveRoute(
        points,
        preferLiveTraffic: preferLiveTraffic && hasLiveTrafficProvider,
      ),
    );
  }

  Future<RoadRouteResult> _resolveRoute(
    List<GeoPoint> points, {
    required bool preferLiveTraffic,
  }) async {
    final geometry = <GeoPoint>[];
    final maritimeSegments = <List<GeoPoint>>[];
    final ports = <RoutePortWaypoint>[];
    var usesMaritimeTransfer = false;
    var usedFallback = false;
    var usesLiveTraffic = false;
    var totalDistanceMeters = 0.0;
    var totalTravelTimeSeconds = 0;
    var totalTrafficDelaySeconds = 0;

    for (var index = 0; index < points.length - 1; index++) {
      final start = points[index];
      final end = points[index + 1];
      final roadRoute = preferLiveTraffic
          ? await _fetchTomTomTrafficRoute(start, end)
          : await _fetchDrivingRoute(start, end);
      final requiresPortTransfer =
          roadRoute == null ||
          _looksLikeMaritimeTransfer(roadRoute, start, end);

      if (!requiresPortTransfer) {
        _appendGeometry(geometry, roadRoute.geometry);
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
        totalDistanceMeters += maritimeRoute.distanceMeters;
        totalTravelTimeSeconds += maritimeRoute.travelTimeSeconds ?? 0;
        totalTrafficDelaySeconds += maritimeRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || maritimeRoute.usesLiveTraffic;
      } else if (roadRoute != null) {
        _appendGeometry(geometry, roadRoute.geometry);
        totalDistanceMeters += roadRoute.distanceMeters;
        totalTravelTimeSeconds += roadRoute.travelTimeSeconds ?? 0;
        totalTrafficDelaySeconds += roadRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || roadRoute.usesLiveTraffic;
      } else {
        _appendGeometry(geometry, [start, end]);
        totalDistanceMeters += _distanceMeters(start, end);
        usedFallback = true;
      }
    }

    return RoadRouteResult(
      geometry: geometry.isEmpty ? points : geometry,
      maritimeSegments: maritimeSegments,
      ports: _dedupePorts(ports),
      usesMaritimeTransfer: usesMaritimeTransfer,
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

    return RoadRouteResult(
      geometry: geometry,
      maritimeSegments: [
        if (_distanceMeters(seaStart, seaEnd) > 120) [seaStart, seaEnd],
      ],
      ports: ports,
      usesMaritimeTransfer: true,
      distanceMeters: _geometryDistanceMeters(geometry),
    );
  }

  Future<_DrivingRoute?> _fetchDrivingRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final uri = Uri.parse(
      '$_osrmBaseUrl/route/v1/driving/'
      '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
      '?overview=full&geometries=geojson&steps=true&alternatives=false',
    );
    try {
      final response = await _client
          .get(uri)
          .timeout(const Duration(seconds: 9));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return null;
      }
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      if (decoded['code'] != 'Ok') return null;
      final routes = decoded['routes'] as List<dynamic>? ?? const [];
      if (routes.isEmpty) return null;
      final route = routes.first as Map<String, dynamic>;
      final geometry = _parseGeoJsonGeometry(route['geometry']);
      if (geometry.length < 2) return null;
      return _DrivingRoute(
        geometry: geometry,
        distanceMeters: (route['distance'] as num?)?.toDouble() ?? 0,
        travelTimeSeconds: (route['duration'] as num?)?.round(),
        trafficDelaySeconds: null,
        usesLiveTraffic: false,
        hasFerrySegment: _containsFerryStep(route),
      );
    } on Object {
      return null;
    }
  }

  Future<_DrivingRoute?> _fetchTomTomTrafficRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final key = _tomTomApiKey.trim();
    if (key.isEmpty) return null;
    final locations =
        '${start.latitude},${start.longitude}:${end.latitude},${end.longitude}';
    final uri =
        Uri.parse(
          '$_tomTomRoutingBaseUrl/routing/1/calculateRoute/$locations/json',
        ).replace(
          queryParameters: {
            'key': key,
            'traffic': 'true',
            'routeType': 'fastest',
            'travelMode': 'car',
            'computeTravelTimeFor': 'all',
            'instructionsType': 'text',
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
      final route = routes.first as Map<String, dynamic>;
      final geometry = _parseTomTomRouteGeometry(route);
      if (geometry.length < 2) return null;
      final summary = route['summary'] as Map<String, dynamic>? ?? const {};
      return _DrivingRoute(
        geometry: geometry,
        distanceMeters:
            (summary['lengthInMeters'] as num?)?.toDouble() ??
            _geometryDistanceMeters(geometry),
        travelTimeSeconds: (summary['travelTimeInSeconds'] as num?)?.round(),
        trafficDelaySeconds:
            (summary['trafficDelayInSeconds'] as num?)?.round() ?? 0,
        usesLiveTraffic: true,
        hasFerrySegment: _containsFerryStep(route),
      );
    } on Object {
      return null;
    }
  }

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
    if (directDistance < 20000) return false;
    if (route.distanceMeters <= 0) return false;
    return route.distanceMeters / directDistance > 8;
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
