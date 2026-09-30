import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../../domain/models.dart';

enum TrafficSeverity { unavailable, clear, moderate, heavy, severe }

enum RouteTravelMode { driving, walking, cycling, publicTransport, taxi, flight }

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
    this.busTerminals = const [],
    this.usesMaritimeTransfer = false,
    this.usesFlightTransfer = false,
    this.usesBusTransfer = false,
    this.hasFlightAlternative = false,
    this.hasBusAlternative = false,
    this.transitAdviceMessage,
    this.usesLiveTraffic = false,
    this.usedFallback = false,
    this.distanceMeters = 0,
    this.travelTimeSeconds,
    this.trafficDelaySeconds,
    this.trafficSeverity = TrafficSeverity.unavailable,
    this.travelMode = RouteTravelMode.driving,
  });

  final List<GeoPoint> geometry;
  final List<List<GeoPoint>> maritimeSegments;
  final List<List<GeoPoint>> flightSegments;
  final List<List<GeoPoint>> walkingSegments;
  final List<RoutePortWaypoint> ports;
  final List<RoutePortWaypoint> airports;
  final List<RoutePortWaypoint> busTerminals;
  final bool usesMaritimeTransfer;
  final bool usesFlightTransfer;
  final bool usesBusTransfer;
  final bool hasFlightAlternative;
  final bool hasBusAlternative;
  final String? transitAdviceMessage;
  final bool usesLiveTraffic;
  final bool usedFallback;
  final double distanceMeters;
  final int? travelTimeSeconds;
  final int? trafficDelaySeconds;
  final TrafficSeverity trafficSeverity;
  final RouteTravelMode travelMode;

  bool get usesWalkingTransfer => walkingSegments.isNotEmpty;

  /// Keeps the already-rendered road geometry while importing only the
  /// traffic metadata from a later live-traffic request.
  RoadRouteResult withTrafficFrom(RoadRouteResult trafficRoute) {
    return RoadRouteResult(
      geometry: geometry,
      maritimeSegments: maritimeSegments,
      flightSegments: flightSegments,
      walkingSegments: walkingSegments,
      ports: ports,
      airports: airports,
      busTerminals: busTerminals,
      usesMaritimeTransfer: usesMaritimeTransfer,
      usesFlightTransfer: usesFlightTransfer,
      usesBusTransfer: usesBusTransfer,
      hasFlightAlternative: hasFlightAlternative,
      hasBusAlternative: hasBusAlternative,
      transitAdviceMessage: transitAdviceMessage,
      usesLiveTraffic: trafficRoute.usesLiveTraffic,
      usedFallback: usedFallback,
      distanceMeters: distanceMeters,
      travelTimeSeconds: trafficRoute.travelTimeSeconds ?? travelTimeSeconds,
      trafficDelaySeconds: trafficRoute.trafficDelaySeconds,
      trafficSeverity: trafficRoute.trafficSeverity,
      travelMode: travelMode,
    );
  }
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
  static final Map<String, Future<RoadRouteResult>> _inFlightRoutes = {};
  static final Map<String, Future<List<RoutePortWaypoint>>> _portCache = {};

  static void clearCache() {
    _routeCache.clear();
    _inFlightRoutes.clear();
    _portCache.clear();
  }

  bool get hasLiveTrafficProvider => _tomTomApiKey.trim().isNotEmpty;

  Future<RoadRouteResult> resolveRoute(
    List<GeoPoint> points, {
    bool preferLiveTraffic = false,
    bool forceRefresh = false,
    double? originHeading,
    RouteTravelMode travelMode = RouteTravelMode.driving,
  }) {
    if (points.length < 2) {
      return Future.value(RoadRouteResult(geometry: points));
    }
    final key = [
      preferLiveTraffic && hasLiveTrafficProvider ? 'traffic' : 'road',
      travelMode.name,
      points.map(_pointKey).join('|'),
      if (originHeading != null) 'h_${originHeading.round()}',
      if (preferLiveTraffic && hasLiveTrafficProvider)
        DateTime.now().millisecondsSinceEpoch ~/ Duration.millisecondsPerMinute,
    ].join('|');
    final inFlight = _inFlightRoutes[key];
    if (inFlight != null) return inFlight;

    final cached = _routeCache[key];
    if (!forceRefresh && cached != null) return cached;

    final future = _resolveRoute(
      points,
      preferLiveTraffic: preferLiveTraffic && hasLiveTrafficProvider,
      originHeading: originHeading,
      travelMode: travelMode,
    );
    _inFlightRoutes[key] = future;
    if (!forceRefresh) _routeCache[key] = future;

    return _removeInFlightWhenComplete(key, future);
  }

  Future<RoadRouteResult> _removeInFlightWhenComplete(
    String key,
    Future<RoadRouteResult> future,
  ) async {
    try {
      return await future;
    } finally {
      if (identical(_inFlightRoutes[key], future)) {
        _inFlightRoutes.remove(key);
      }
    }
  }

  Future<RoadRouteResult> _resolveRoute(
    List<GeoPoint> points, {
    required bool preferLiveTraffic,
    double? originHeading,
    required RouteTravelMode travelMode,
  }) async {
    final geometry = <GeoPoint>[];
    final maritimeSegments = <List<GeoPoint>>[];
    final flightSegments = <List<GeoPoint>>[];
    final walkingSegments = <List<GeoPoint>>[];
    final ports = <RoutePortWaypoint>[];
    final airports = <RoutePortWaypoint>[];
    final busTerminals = <RoutePortWaypoint>[];
    var usesMaritimeTransfer = false;
    var usesFlightTransfer = false;
    var usesBusTransfer = false;
    var hasFlightAlternative = false;
    var hasBusAlternative = false;
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

      final isFlightMode = travelMode == RouteTravelMode.flight;
      final isBusMode = travelMode == RouteTravelMode.publicTransport;
      final isIntercity = directDistance > 80000;

      // 1. Explicit Flight Mode requested by the user
      if (isFlightMode) {
        final flightRoute = await _buildFlightAwareRoute(start, end);
        if (flightRoute != null) {
          _appendGeometry(geometry, flightRoute.geometry);
          flightSegments.addAll(flightRoute.flightSegments);
          airports.addAll(flightRoute.airports);
          usesFlightTransfer = true;
          hasBusAlternative = true;
          transitAdviceMessage = flightRoute.transitAdviceMessage;
          totalDistanceMeters += flightRoute.distanceMeters;
          totalTravelTimeSeconds += (directDistance / 220).round(); // ~800 km/h flight speed
          continue;
        }
      }

      // 2. Road / Driving route for driving, bus, taxi, cycling, walking
      _DrivingRoute? roadRoute;
      if (preferLiveTraffic &&
          (travelMode == RouteTravelMode.driving ||
              travelMode == RouteTravelMode.taxi)) {
        roadRoute = await _fetchTomTomTrafficRoute(
          start,
          end,
          originHeading: legHeading,
          travelMode: travelMode,
        );
      }
      roadRoute ??= await _fetchDrivingRoute(
        start,
        end,
        originHeading: legHeading,
        travelMode: travelMode,
      );

      // 2.1 Check for hiking / walking trail approach when destination is off-road
      if (roadRoute != null && travelMode != RouteTravelMode.flight && travelMode != RouteTravelMode.walking) {
        final hybrid = await _tryResolveHikingTrail(
          start: start,
          end: end,
          roadRoute: roadRoute,
          originHeading: legHeading,
          travelMode: travelMode,
        );
        if (hybrid != null) {
          _appendGeometry(geometry, hybrid.driving.geometry);
          walkingSegments.add(hybrid.walking.geometry);
          totalDistanceMeters += hybrid.driving.distanceMeters + hybrid.walking.distanceMeters;
          totalTravelTimeSeconds += (hybrid.driving.travelTimeSeconds ?? 0) + (hybrid.walking.travelTimeSeconds ?? 0);
          totalTrafficDelaySeconds += hybrid.driving.trafficDelaySeconds ?? 0;
          usesLiveTraffic = usesLiveTraffic || hybrid.driving.usesLiveTraffic;
          transitAdviceMessage = _formatWalkingAdvice(
            hybrid.walking.distanceMeters,
            hybrid.walking.travelTimeSeconds,
          );
          continue;
        }
      }

      // 2.2 Pure walking route if both points are off-road within pedestrian distance
      if ((roadRoute == null || travelMode == RouteTravelMode.walking) &&
          travelMode != RouteTravelMode.flight &&
          directDistance <= 35000) {
        var pureWalking = _tomTomApiKey.trim().isNotEmpty
            ? await _fetchTomTomPedestrianRoute(start, end)
            : null;
        pureWalking ??= await _fetchWalkingRoute(start, end);
        if (pureWalking != null && !pureWalking.hasFerrySegment && pureWalking.geometry.isNotEmpty) {
          _appendGeometry(geometry, pureWalking.geometry);
          walkingSegments.add(pureWalking.geometry);
          totalDistanceMeters += pureWalking.distanceMeters;
          totalTravelTimeSeconds += pureWalking.travelTimeSeconds ?? 0;
          final km = (pureWalking.distanceMeters / 1000).toStringAsFixed(1);
          transitAdviceMessage = '🥾 Tramo a pie: Sendero peatonal hacia el destino (~$km km).';
          continue;
        }
      }

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

        // Custom duration & advice for Bus mode:
        if (isBusMode && isIntercity) {
          final busDuration = _calculateBusTravelTimeSeconds(
            roadRoute.distanceMeters,
            roadRoute.travelTimeSeconds,
          );
          totalTravelTimeSeconds += busDuration;
          usesBusTransfer = true;

          final departureTerminals = await _findBusTerminalsNear(start, role: 'Terminal salida');
          final arrivalTerminals = await _findBusTerminalsNear(end, role: 'Terminal llegada');
          if (departureTerminals.isNotEmpty) {
            busTerminals.addAll(departureTerminals);
          }
          if (arrivalTerminals.isNotEmpty) {
            busTerminals.addAll(arrivalTerminals);
          }

          if (departureTerminals.isNotEmpty && arrivalTerminals.isNotEmpty) {
            final depName = departureTerminals.first.name;
            final arrName = arrivalTerminals.first.name;
            transitAdviceMessage = '🚌 Conexión en autobús: Aborda en $depName hacia $arrName.';
          } else if (departureTerminals.isNotEmpty) {
            final depName = departureTerminals.first.name;
            transitAdviceMessage = '🚌 Conexión en autobús: Dirígete a $depName para abordar tu viaje.';
          } else {
            transitAdviceMessage = '🚌 Ruta terrestre en autobús intermunicipal con paradas técnicas.';
          }
        } else {
          totalTravelTimeSeconds += roadRoute.travelTimeSeconds ?? 0;
        }

        totalTrafficDelaySeconds += roadRoute.trafficDelaySeconds ?? 0;
        usesLiveTraffic = usesLiveTraffic || roadRoute.usesLiveTraffic;

        // Flag long-distance travel alternatives (e.g. flight or bus)
        if (directDistance > 250000) {
          hasFlightAlternative = true;
          if (!isBusMode) {
            hasBusAlternative = true;
          }
        }
        continue;
      }

      // 3. Fallbacks when no direct land connection exists (e.g. islands, water bodies)
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
      } else {
        // True physical transfer required (e.g. San Andrés Island or overseas without ferries)
        final flightRoute = (isFlightMode || (roadRoute == null && directDistance > 200000))
            ? await _buildFlightAwareRoute(start, end)
            : null;
        if (flightRoute != null) {
          _appendGeometry(geometry, flightRoute.geometry);
          flightSegments.addAll(flightRoute.flightSegments);
          airports.addAll(flightRoute.airports);
          usesFlightTransfer = true;
          transitAdviceMessage = flightRoute.transitAdviceMessage;
          totalDistanceMeters += flightRoute.distanceMeters;
          totalTravelTimeSeconds += (directDistance / 220).round();
          continue;
        } else if (roadRoute != null) {
          _appendGeometry(geometry, roadRoute.geometry);
          totalDistanceMeters += roadRoute.distanceMeters;
          totalTravelTimeSeconds += roadRoute.travelTimeSeconds ?? 0;
          totalTrafficDelaySeconds += roadRoute.trafficDelaySeconds ?? 0;
          usesLiveTraffic = usesLiveTraffic || roadRoute.usesLiveTraffic;
        } else {
          totalDistanceMeters += _distanceMeters(start, end);
          usedFallback = true;
        }
      }
    }

    return RoadRouteResult(
      geometry: geometry,
      maritimeSegments: maritimeSegments,
      flightSegments: flightSegments,
      walkingSegments: walkingSegments,
      ports: _dedupePorts(ports),
      airports: _dedupePorts(airports),
      busTerminals: _dedupePorts(busTerminals),
      usesMaritimeTransfer: usesMaritimeTransfer,
      usesFlightTransfer: usesFlightTransfer,
      usesBusTransfer: usesBusTransfer,
      hasFlightAlternative: hasFlightAlternative,
      hasBusAlternative: hasBusAlternative,
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
      travelMode: travelMode,
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

    final advice = '✈️ Conexión aérea: Dirígete a ${startAirport?.name ?? "tu aeropuerto de salida"} para abordar tu vuelo hacia ${endAirport?.name ?? "el destino"}.';

    return RoadRouteResult(
      geometry: geometry,
      flightSegments: [[airStart, airEnd]],
      airports: airports,
      usesFlightTransfer: true,
      transitAdviceMessage: advice,
      distanceMeters: _geometryDistanceMeters(geometry),
    );
  }

  static final List<({String name, double lat, double lon})> _curatedAirports = [
    (name: 'Aeropuerto Ernesto Cortissoz (BAQ)', lat: 10.8896, lon: -74.7808),
    (name: 'Aeropuerto Rafael Núñez (CTG)', lat: 10.4424, lon: -75.5130),
    (name: 'Aeropuerto Simón Bolívar (SMR)', lat: 11.1198, lon: -74.2306),
    (name: 'Aeropuerto El Dorado (BOG)', lat: 4.7016, lon: -74.1469),
    (name: 'Aeropuerto José María Córdova (MDE)', lat: 6.1645, lon: -75.4276),
    (name: 'Aeropuerto Olaya Herrera (EOH)', lat: 6.2206, lon: -75.5906),
    (name: 'Aeropuerto Alfonso Bonilla Aragón (CLO)', lat: 3.5432, lon: -76.3816),
    (name: 'Aeropuerto Palonegro (BGA)', lat: 7.1265, lon: -73.1848),
    (name: 'Aeropuerto Matecaña (PEI)', lat: 4.8125, lon: -75.7394),
    (name: 'Aeropuerto Camilo Daza (CUC)', lat: 7.9276, lon: -72.5116),
    (name: 'Aeropuerto Gustavo Rojas Pinilla (ADZ)', lat: 12.5833, lon: -81.7106),
    (name: 'Aeropuerto Los Garzones (MTR)', lat: 8.8242, lon: -75.8267),
    (name: 'Aeropuerto Alfonso López Pumarejo (VUP)', lat: 10.4350, lon: -73.2494),
    (name: 'Aeropuerto Antonio Nariño (PSO)', lat: 1.3964, lon: -77.2911),
    (name: 'Aeropuerto El Edén (AXM)', lat: 4.4528, lon: -75.7664),
    (name: 'Aeropuerto Benito Salas (NVA)', lat: 2.9502, lon: -75.2940),
    (name: 'Aeropuerto Almirante Padilla (RCH)', lat: 11.5264, lon: -72.9261),
    (name: 'Aeropuerto Vanguardia (VVC)', lat: 4.1683, lon: -73.6144),
    (name: 'Aeropuerto Perales (IBE)', lat: 4.4214, lon: -75.1333),
  ];

  static final List<({String name, double lat, double lon})> _curatedBusTerminals = [
    // Costa Caribe
    (name: 'Terminal de Transportes de Barranquilla', lat: 10.9088, lon: -74.7935),
    (name: 'Terminal de Transportes de Cartagena', lat: 10.3842, lon: -75.4590),
    (name: 'Terminal de Transportes de Santa Marta', lat: 11.2185, lon: -74.1952),
    (name: 'Terminal de Transportes de Valledupar', lat: 10.4578, lon: -73.2384),
    (name: 'Terminal de Transportes de Montería', lat: 8.7554, lon: -75.8622),
    (name: 'Terminal de Transportes de Sincelejo', lat: 9.2889, lon: -75.4055),
    (name: 'Terminal de Transportes de Riohacha', lat: 11.5283, lon: -72.9090),
    // Bogotá y Cundinamarca
    (name: 'Terminal de Transporte de Bogotá - Salitre', lat: 4.6534, lon: -74.1137),
    (name: 'Terminal de Transporte del Norte - Bogotá', lat: 4.7702, lon: -74.0435),
    (name: 'Terminal de Transporte del Sur - Bogotá', lat: 4.5822, lon: -74.1610),
    // Antioquia y Eje Cafetero
    (name: 'Terminal de Transportes del Norte - Medellín', lat: 6.2736, lon: -75.5684),
    (name: 'Terminal de Transportes del Sur - Medellín', lat: 6.2131, lon: -75.5861),
    (name: 'Terminal de Transportes de Pereira', lat: 4.8105, lon: -75.6888),
    (name: 'Terminal de Transportes de Manizales', lat: 5.0450, lon: -75.4950),
    (name: 'Terminal de Transportes de Armenia', lat: 4.5262, lon: -75.6845),
    // Santanderes
    (name: 'Terminal de Transportes de Bucaramanga', lat: 7.0945, lon: -73.1362),
    (name: 'Terminal de Transportes de Cúcuta', lat: 7.9048, lon: -72.5028),
    // Tolima y Huila
    (name: 'Terminal de Transportes de Ibagué', lat: 4.4326, lon: -75.2260),
    (name: 'Terminal de Transportes de Neiva', lat: 2.9463, lon: -75.2890),
    // Valle, Cauca y Nariño
    (name: 'Terminal de Transportes de Cali', lat: 3.4650, lon: -76.5255),
    (name: 'Terminal de Transportes de Popayán', lat: 2.4533, lon: -76.6025),
    (name: 'Terminal de Transportes de Pasto', lat: 1.2052, lon: -77.2750),
    // Llanos y Boyacá
    (name: 'Terminal de Transportes de Villavicencio', lat: 4.1287, lon: -73.6331),
    (name: 'Terminal de Transportes Juana Velasco de Gallo - Tunja', lat: 5.5458, lon: -73.3486),
  ];

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

    // 1. Curated major national airports within 95 km
    for (final airport in _curatedAirports) {
      final loc = GeoPoint(latitude: airport.lat, longitude: airport.lon);
      if (_distanceMeters(point, loc) <= 95000) {
        candidateList.add(
          RoutePortWaypoint(
            name: airport.name,
            location: loc,
            role: role,
          ),
        );
      }
    }

    // 2. Photon Spatial Geocoding (fast and ranked by user coordinates)
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

          final loc = GeoPoint(latitude: lat, longitude: lon);
          // Strict geographic proximity: reject results further than 95 km
          if (_distanceMeters(point, loc) > 95000) continue;

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
                location: loc,
                role: role,
              ),
            );
          }
        }
      }
    } catch (_) {}

    // 3. Overpass API fallback if Photon and curated list had no candidates
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
            final loc = GeoPoint(latitude: lat, longitude: lon);
            if (_distanceMeters(point, loc) > 95000) continue;
            final tags = raw['tags'] as Map<String, dynamic>? ?? const {};
            final name = tags['name'] ?? tags['name:es'] ?? tags['name:en'] ?? 'Aeropuerto';
            candidateList.add(
              RoutePortWaypoint(
                name: name.toString(),
                location: loc,
                role: role,
              ),
            );
          }
        }
      } catch (_) {}
    }

    // 4. Nominatim fallback if still empty
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
            final loc = GeoPoint(latitude: lat, longitude: lon);
            if (_distanceMeters(point, loc) > 95000) continue;
            final name = (raw['name'] ?? raw['display_name']?.toString().split(',').first ?? 'Aeropuerto').toString();
            candidateList.add(RoutePortWaypoint(name: name, location: loc, role: role));
          }
        }
      } catch (_) {}
    }

    // 5. Regional fallback if empty (expand curated search to 180 km)
    if (candidateList.isEmpty) {
      for (final airport in _curatedAirports) {
        final loc = GeoPoint(latitude: airport.lat, longitude: airport.lon);
        if (_distanceMeters(point, loc) <= 180000) {
          candidateList.add(
            RoutePortWaypoint(
              name: airport.name,
              location: loc,
              role: role,
            ),
          );
        }
      }
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

  final Map<String, List<RoutePortWaypoint>> _busTerminalsDynamicCache = {};

  Future<List<RoutePortWaypoint>> findBusTerminalsNear(
    GeoPoint point, {
    required String role,
  }) => _findBusTerminalsNear(point, role: role);

  Future<List<RoutePortWaypoint>> _findBusTerminalsNear(
    GeoPoint point, {
    required String role,
  }) async {
    final cacheKey = '${point.latitude.toStringAsFixed(1)},${point.longitude.toStringAsFixed(1)}';
    if (_busTerminalsDynamicCache.containsKey(cacheKey)) {
      return _busTerminalsDynamicCache[cacheKey]!;
    }

    final candidateList = <RoutePortWaypoint>[];

    // 1. Curated major Colombian bus terminals within 65 km
    for (final term in _curatedBusTerminals) {
      final loc = GeoPoint(latitude: term.lat, longitude: term.lon);
      if (_distanceMeters(point, loc) <= 65000) {
        candidateList.add(
          RoutePortWaypoint(
            name: term.name,
            location: loc,
            role: role,
          ),
        );
      }
    }

    // 2. Photon Spatial Geocoding (fast and ranked by user coordinates)
    try {
      final photonUrl = Uri.parse(
        'https://photon.komoot.io/api/?q=terminal+de+transporte&lat=${point.latitude}&lon=${point.longitude}&limit=10',
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

          final loc = GeoPoint(latitude: lat, longitude: lon);
          // Strict geographic proximity: reject results further than 65 km
          if (_distanceMeters(point, loc) > 65000) continue;

          final osmValue = properties['osm_value']?.toString() ?? '';
          final name = properties['name']?.toString() ?? '';
          final lowerName = name.toLowerCase();

          final isBusStation = osmValue == 'bus_station' || osmValue == 'bus_terminal';
          final hasTerminalName = lowerName.contains('terminal') ||
              lowerName.contains('central de autobuses') ||
              lowerName.contains('estación de autobuses');
          final isIgnored = lowerName.contains('aeropuerto') || lowerName.contains('airport');

          if ((isBusStation || hasTerminalName) && !isIgnored && name.isNotEmpty) {
            candidateList.add(
              RoutePortWaypoint(
                name: name,
                location: loc,
                role: role,
              ),
            );
          }
        }
      }
    } catch (_) {}

    // 3. Nominatim bounded fallback if still empty
    if (candidateList.isEmpty) {
      try {
        final nominatimUrl = Uri.parse(
          'https://nominatim.openstreetmap.org/search?q=terminal+de+transporte&format=json&limit=5&bounded=1&viewbox=${point.longitude - 0.6},${point.latitude + 0.6},${point.longitude + 0.6},${point.latitude - 0.6}',
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
            final loc = GeoPoint(latitude: lat, longitude: lon);
            if (_distanceMeters(point, loc) > 65000) continue;
            final name = (raw['name'] ?? raw['display_name']?.toString().split(',').first ?? 'Terminal de Transporte').toString();
            candidateList.add(RoutePortWaypoint(name: name, location: loc, role: role));
          }
        }
      } catch (_) {}
    }

    // 4. Overpass API fallback if still empty
    if (candidateList.isEmpty) {
      final query = '''
[out:json][timeout:5];
(
  node(around:60000,${point.latitude},${point.longitude})["amenity"="bus_station"];
  way(around:60000,${point.latitude},${point.longitude})["amenity"="bus_station"];
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
            final loc = GeoPoint(latitude: lat, longitude: lon);
            if (_distanceMeters(point, loc) > 65000) continue;
            final tags = raw['tags'] as Map<String, dynamic>? ?? const {};
            final name = tags['name'] ?? tags['name:es'] ?? tags['name:en'] ?? 'Terminal de Transporte';
            candidateList.add(
              RoutePortWaypoint(
                name: name.toString(),
                location: loc,
                role: role,
              ),
            );
          }
        }
      } catch (_) {}
    }

    // 5. Regional fallback if empty (expand curated search to 150 km)
    if (candidateList.isEmpty) {
      for (final term in _curatedBusTerminals) {
        final loc = GeoPoint(latitude: term.lat, longitude: term.lon);
        if (_distanceMeters(point, loc) <= 150000) {
          candidateList.add(
            RoutePortWaypoint(
              name: term.name,
              location: loc,
              role: role,
            ),
          );
        }
      }
    }

    if (candidateList.isNotEmpty) {
      candidateList.sort(
        (a, b) => _distanceMeters(point, a.location)
            .compareTo(_distanceMeters(point, b.location)),
      );
      final deduped = _dedupePorts(candidateList);
      _busTerminalsDynamicCache[cacheKey] = deduped;
      return deduped;
    }

    return const [];
  }

  /// Calculates realistic intermunicipal bus travel duration.
  ///
  /// Intermunicipal buses operate under speed limits (~50-55 km/h avg),
  /// require terminal boarding buffers (30m), and mandatory technical
  /// stops for driver rest and passenger meals on long trips.
  int _calculateBusTravelTimeSeconds(double distanceMeters, int? baseDrivingSeconds) {
    if (distanceMeters <= 30000) {
      // Urban transit
      return baseDrivingSeconds != null
          ? (baseDrivingSeconds * 1.35).round()
          : (distanceMeters / (22.0 * 1000 / 3600)).round();
    }

    // Cruising speed ~52 km/h (14.44 m/s) on national highways/mountain terrain
    final double cruisingSeconds = distanceMeters / 14.44;

    // Terminal boarding & departure buffer: 30 minutes
    const int boardingBuffer = 1800;

    // Technical rest stops: ~40 minutes every 200 km beyond the first 100 km
    final int restStops = math.max(0, ((distanceMeters - 100000) / 200000).floor());
    final int restStopsDuration = restStops * 2400;

    return (cruisingSeconds + boardingBuffer + restStopsDuration).round();
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
      if (startRoad != null) {
        _appendGeometry(geometry, startRoad.geometry);
      }
    } else {
      _appendGeometry(geometry, [start]);
    }

    // Do not append seaStart -> seaEnd or the road after the arrival port to
    // the single land geometry. Concatenating those disconnected sections
    // would make MapLibre draw a false straight connector across the water.

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
    RouteTravelMode travelMode = RouteTravelMode.driving,
  }) async {
    final profile = switch (travelMode) {
      RouteTravelMode.walking => 'foot',
      RouteTravelMode.cycling => 'bike',
      _ => 'car',
    };
    final baseUrls = <String>[
      if (profile == 'car') _osrmBaseUrl,
      'https://routing.openstreetmap.de/routed-$profile',
      if (profile != 'car') 'https://routing.openstreetmap.de/routed-car',
    ];

    final hasHeading = originHeading != null && originHeading >= 0;
    final headingParam = hasHeading ? '&bearings=${originHeading.round()},80;' : '';

    final modePath = profile == 'foot'
        ? 'foot'
        : (profile == 'bike' ? 'bike' : 'driving');
    final radiusOptions = <String>[
      'radiuses=250;250',
      'radiuses=350;unlimited',
      '',
    ];

    for (final baseUrl in baseUrls) {
      for (final radiusParam in radiusOptions) {
        final radiusQuery = radiusParam.isNotEmpty ? '&$radiusParam' : '';
        final uri = Uri.parse(
          '$baseUrl/route/v1/$modePath/'
          '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
          '?overview=full&geometries=geojson&steps=true&alternatives=true&continue_straight=true$radiusQuery$headingParam',
        );
        try {
          final response = await _client
              .get(uri, headers: const {'User-Agent': 'VibeTours/1.0'})
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
    }

    // Keep the existing OSRM/OpenStreetMap geometry as the primary route so
    // the current map drawing remains unchanged. Commercial providers are a
    // server-side fallback for places where the public routing graph cannot
    // resolve the leg; their credentials never reach the mobile app.
    return _fetchBackendRoute(
      start,
      end,
      travelMode: travelMode,
    );
  }

  Future<_DrivingRoute?> _fetchWalkingRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final baseUrls = <String>[
      'https://routing.openstreetmap.de/routed-foot',
      _osrmBaseUrl,
    ];
    for (final baseUrl in baseUrls) {
      final isRoutedFoot = baseUrl.contains('routed-foot');
      final modePath = isRoutedFoot ? 'foot' : 'driving';
      final uri = Uri.parse(
        '$baseUrl/route/v1/$modePath/'
        '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
        '?overview=full&geometries=geojson&steps=true',
      );
      try {
        final response = await _client
            .get(uri, headers: const {'User-Agent': 'VibeTours/1.0'})
            .timeout(const Duration(seconds: 5));
        if (response.statusCode < 200 || response.statusCode >= 300) continue;
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        if (decoded['code'] != 'Ok') continue;
        final routes = decoded['routes'] as List<dynamic>? ?? const [];
        if (routes.isEmpty) continue;
        final item = routes.first as Map<String, dynamic>;
        final geometry = _parseGeoJsonGeometry(item['geometry']);
        if (geometry.length < 2) continue;
        return _DrivingRoute(
          geometry: geometry,
          distanceMeters: (item['distance'] as num?)?.toDouble() ?? 0,
          travelTimeSeconds: (item['duration'] as num?)?.round(),
          trafficDelaySeconds: null,
          usesLiveTraffic: false,
          hasFerrySegment: _containsFerryStep(item),
        );
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  Future<_DrivingRoute?> _fetchTomTomPedestrianRoute(
    GeoPoint start,
    GeoPoint end,
  ) async {
    final key = _tomTomApiKey.trim();
    if (key.isEmpty) return null;

    final locations =
        '${start.latitude},${start.longitude}:${end.latitude},${end.longitude}';
    final uri = Uri.parse(
      '$_tomTomRoutingBaseUrl/routing/1/calculateRoute/$locations/json',
    ).replace(
      queryParameters: {
        'key': key,
        'travelMode': 'pedestrian',
        'routeType': 'fastest',
      },
    );

    try {
      final response = await _client
          .get(uri, headers: const {'User-Agent': 'VibeTours/1.0'})
          .timeout(const Duration(seconds: 6));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return null;
      }
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final routes = decoded['routes'] as List<dynamic>? ?? const [];
      if (routes.isEmpty) return null;

      final firstRoute = routes.first as Map<String, dynamic>;
      final legs = firstRoute['legs'] as List<dynamic>? ?? const [];
      if (legs.isEmpty) return null;

      final rawPoints =
          (legs.first as Map<String, dynamic>)['points'] as List<dynamic>? ??
              const [];
      if (rawPoints.length < 2) return null;

      final geometry = <GeoPoint>[];
      for (final p in rawPoints) {
        if (p is Map<String, dynamic>) {
          final lat = (p['latitude'] as num?)?.toDouble();
          final lon = (p['longitude'] as num?)?.toDouble();
          if (lat != null && lon != null) {
            geometry.add(GeoPoint(latitude: lat, longitude: lon));
          }
        }
      }
      if (geometry.length < 2) return null;

      if (_distanceMeters(start, geometry.first) > 30) {
        geometry.insert(0, start);
      }
      if (_distanceMeters(geometry.last, end) > 30) {
        geometry.add(end);
      }

      final dist = _geometryDistanceMeters(geometry);
      final walkSeconds = ((dist / 1000) * 900).round();

      return _DrivingRoute(
        geometry: geometry,
        distanceMeters: dist,
        travelTimeSeconds: walkSeconds,
        trafficDelaySeconds: null,
        usesLiveTraffic: false,
        hasFerrySegment: false,
      );
    } catch (_) {
      return null;
    }
  }

  Future<({_DrivingRoute driving, _DrivingRoute walking})?> _tryResolveHikingTrail({
    required GeoPoint start,
    required GeoPoint end,
    required _DrivingRoute roadRoute,
    double? originHeading,
    RouteTravelMode travelMode = RouteTravelMode.driving,
  }) async {
    final roadEnd = roadRoute.geometry.last;
    final roadEndDist = _distanceMeters(roadEnd, end);
    if (roadEndDist <= 250) return null;

    _DrivingRoute? walkingRoute;

    // 1. Attempt TomTom Pedestrian route (accurate mountain & park trail network)
    if (_tomTomApiKey.trim().isNotEmpty) {
      walkingRoute = await _fetchTomTomPedestrianRoute(roadEnd, end);
    }

    // 2. Attempt OSRM routed-foot (verify destination is actually reached)
    if (walkingRoute == null) {
      final forward = await _fetchWalkingRoute(roadEnd, end);
      if (forward != null &&
          !forward.hasFerrySegment &&
          forward.geometry.isNotEmpty &&
          _distanceMeters(forward.geometry.last, end) <= 850 &&
          forward.distanceMeters >= 150) {
        walkingRoute = forward;
      } else {
        final reverse = await _fetchWalkingRoute(end, roadEnd);
        if (reverse != null &&
            !reverse.hasFerrySegment &&
            reverse.geometry.isNotEmpty) {
          final reversedGeo = reverse.geometry.reversed.toList();
          if (_distanceMeters(reversedGeo.last, end) <= 850 &&
              reverse.distanceMeters >= 150) {
            final dist = reverse.distanceMeters > 0
                ? reverse.distanceMeters
                : _geometryDistanceMeters(reversedGeo);
            walkingRoute = _DrivingRoute(
              geometry: reversedGeo,
              distanceMeters: dist,
              travelTimeSeconds:
                  reverse.travelTimeSeconds ?? ((dist / 1000) * 900).round(),
              trafficDelaySeconds: null,
              usesLiveTraffic: false,
              hasFerrySegment: false,
            );
          }
        }
      }
    }

    // 3. Guaranteed trail approach fallback directly to destination
    if (walkingRoute == null ||
        walkingRoute.hasFerrySegment ||
        walkingRoute.geometry.isEmpty) {
      if (roadEndDist <= 40000) {
        final walkSeconds = ((roadEndDist / 1000) * 900).round();
        walkingRoute = _DrivingRoute(
          geometry: [roadEnd, end],
          distanceMeters: roadEndDist,
          travelTimeSeconds: walkSeconds,
          trafficDelaySeconds: null,
          usesLiveTraffic: false,
          hasFerrySegment: false,
        );
      } else {
        return null;
      }
    }

    // 4. Ensure seamless continuous geometry from car drop-off to destination
    final walkingGeo = List<GeoPoint>.from(walkingRoute.geometry);
    if (walkingGeo.isNotEmpty) {
      if (_distanceMeters(roadEnd, walkingGeo.first) > 30) {
        walkingGeo.insert(0, roadEnd);
      }
      if (_distanceMeters(walkingGeo.last, end) > 30) {
        walkingGeo.add(end);
      }
    }

    final totalWalkDist = walkingRoute.distanceMeters > 0
        ? walkingRoute.distanceMeters
        : _geometryDistanceMeters(walkingGeo);
    final totalWalkSeconds = walkingRoute.travelTimeSeconds ??
        ((totalWalkDist / 1000) * 900).round();
    final sanitizedWalking = _DrivingRoute(
      geometry: walkingGeo,
      distanceMeters: totalWalkDist > 0 ? totalWalkDist : roadEndDist,
      travelTimeSeconds: totalWalkSeconds > 0 ? totalWalkSeconds : 60,
      trafficDelaySeconds: null,
      usesLiveTraffic: false,
      hasFerrySegment: false,
    );

    return (driving: roadRoute, walking: sanitizedWalking);
  }

  String _formatWalkingAdvice(double distanceMeters, int? travelTimeSeconds) {
    final km = (distanceMeters / 1000).toStringAsFixed(1);
    final minutes = ((travelTimeSeconds ?? 0) / 60).round();
    final durationStr = minutes >= 60
        ? '${minutes ~/ 60} h ${minutes % 60} min'
        : '$minutes min';
    return '🚗 Conduce por carretera hasta el punto de acceso y continúa 🥾 a pie por el sendero hacia tu destino (~$km km, $durationStr de caminata).';
  }

  Future<_DrivingRoute?> _fetchBackendRoute(
    GeoPoint start,
    GeoPoint end, {
    required RouteTravelMode travelMode,
  }) async {
    final payload = jsonEncode({
      'points': [
        {'latitude': start.latitude, 'longitude': start.longitude},
        {'latitude': end.latitude, 'longitude': end.longitude},
      ],
      'mode': travelMode.name,
    });

    for (final configuredBase in AppConfig.apiBaseUrls) {
      final baseUrl = configuredBase.replaceFirst(RegExp(r'/+$'), '');
      if (baseUrl.isEmpty) continue;
      try {
        final response = await _client
            .post(
              Uri.parse('$baseUrl/routes/calculate'),
              headers: const {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: payload,
            )
            .timeout(const Duration(seconds: 5));
        if (response.statusCode < 200 || response.statusCode >= 300) continue;

        final decoded = jsonDecode(response.body);
        if (decoded is! Map<String, dynamic>) continue;
        final rawGeometry = decoded['geometry'];
        if (rawGeometry is! List) continue;
        final geometry = <GeoPoint>[];
        for (final rawPoint in rawGeometry) {
          if (rawPoint is! Map<String, dynamic>) continue;
          final latitude = (rawPoint['latitude'] as num?)?.toDouble();
          final longitude = (rawPoint['longitude'] as num?)?.toDouble();
          if (latitude == null || longitude == null) continue;
          geometry.add(GeoPoint(latitude: latitude, longitude: longitude));
        }
        if (geometry.length < 2) continue;

        return _DrivingRoute(
          geometry: geometry,
          distanceMeters:
              (decoded['distanceMeters'] as num?)?.toDouble() ??
              _geometryDistanceMeters(geometry),
          travelTimeSeconds: (decoded['travelTimeSeconds'] as num?)?.round(),
          trafficDelaySeconds: null,
          usesLiveTraffic: decoded['usesLiveTraffic'] == true,
          hasFerrySegment: decoded['hasFerrySegment'] == true,
        );
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
    RouteTravelMode travelMode = RouteTravelMode.driving,
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
            'travelMode': travelMode == RouteTravelMode.taxi ? 'taxi' : 'car',
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
      final exists = unique.any((item) {
        final dist = _distanceMeters(item.location, port.location);
        if (dist < 800) return true;
        final cleanA = item.name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
        final cleanB = port.name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
        if (cleanA.isNotEmpty && cleanB.isNotEmpty && dist < 3000 && (cleanA.contains(cleanB) || cleanB.contains(cleanA))) {
          return true;
        }
        return false;
      });
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
