import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:vibetoursapp/src/core/services/road_route_service.dart';
import 'package:vibetoursapp/src/core/utils/transport_utils.dart';
import 'package:vibetoursapp/src/domain/models.dart';

void main() {
  group('RouteTravelMode and transport utils', () {
    test('should map flight keywords to flight travel mode when requested', () {
      expect(routeTravelModeFor('vuelo'), RouteTravelMode.flight);
      expect(routeTravelModeFor('avión'), RouteTravelMode.flight);
      expect(routeTravelModeFor('flight'), RouteTravelMode.flight);
      expect(routeTravelModeFor('aéreo'), RouteTravelMode.flight);
    });

    test('should map public transport keywords to publicTransport travel mode', () {
      expect(routeTravelModeFor('bus'), RouteTravelMode.publicTransport);
      expect(routeTravelModeFor('transporte público'), RouteTravelMode.publicTransport);
      expect(routeTravelModeFor('autobús'), RouteTravelMode.publicTransport);
    });

    test('should default to driving travel mode when preference is car or generic', () {
      expect(routeTravelModeFor('auto rentado'), RouteTravelMode.driving);
      expect(routeTravelModeFor('carro'), RouteTravelMode.driving);
      expect(routeTravelModeFor(''), RouteTravelMode.driving);
    });
  });

  group('RoadRouteService multimodal routing', () {
    test('should maintain road geometry and not force flight when travelMode is driving', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        if (uri.contains('/route/v1/driving/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 913000.0,
                  'duration': 45000.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-74.7964, 10.9639],
                      [-75.0000, 8.0000],
                      [-75.5138, 5.0689],
                    ],
                  },
                }
              ],
            }),
            200,
          );
        }
        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964); // Barranquilla
      const end = GeoPoint(latitude: 5.0689, longitude: -75.5138); // Manizales (~700km direct)

      final result = await service.resolveRoute(
        [start, end],
        travelMode: RouteTravelMode.driving,
      );

      expect(result.usesFlightTransfer, isFalse);
      expect(result.geometry.length, greaterThanOrEqualTo(2));
      expect(result.distanceMeters, 913000.0);
      expect(result.hasFlightAlternative, isTrue);
      expect(result.hasBusAlternative, isTrue);
    });

    test('should calculate extended duration and bus transfer when travelMode is publicTransport for long distance', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        if (uri.contains('photon.komoot.io') && uri.contains('terminal')) {
          return http.Response(
            jsonEncode({
              'features': [
                {
                  'properties': {
                    'name': 'Terminal de Transportes de Barranquilla',
                    'osm_value': 'bus_station',
                  },
                  'geometry': {
                    'coordinates': [-74.7934, 10.9088],
                  },
                }
              ],
            }),
            200,
          );
        }
        if (uri.contains('/route/v1/driving/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 900000.0,
                  'duration': 45000.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-74.7964, 10.9639],
                      [-75.5138, 5.0689],
                    ],
                  },
                }
              ],
            }),
            200,
          );
        }
        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964);
      const end = GeoPoint(latitude: 5.0689, longitude: -75.5138);

      final result = await service.resolveRoute(
        [start, end],
        travelMode: RouteTravelMode.publicTransport,
      );

      expect(result.usesFlightTransfer, isFalse);
      expect(result.usesBusTransfer, isTrue);
      expect(result.busTerminals.isNotEmpty, isTrue);
      expect(result.busTerminals.first.name, 'Terminal de Transportes de Barranquilla');
      // Bus duration must be greater than car duration (~45,000s) due to speed and stops
      expect(result.travelTimeSeconds, greaterThan(45000));
      expect(result.transitAdviceMessage, contains('Terminal de Transportes de Barranquilla'));
    });

    test('should build flight route when travelMode is explicitly flight', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        if (uri.contains('photon.komoot.io') && uri.contains('aeropuerto')) {
          return http.Response(
            jsonEncode({
              'features': [
                {
                  'properties': {
                    'name': 'Aeropuerto Ernesto Cortissoz',
                    'osm_value': 'aerodrome',
                  },
                  'geometry': {
                    'coordinates': [-74.7808, 10.8896],
                  },
                }
              ],
            }),
            200,
          );
        }
        if (uri.contains('/route/v1/driving/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 22000.0,
                  'duration': 1800.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-74.79, 10.96],
                      [-74.78, 10.88],
                    ],
                  },
                }
              ],
            }),
            200,
          );
        }
        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964);
      const end = GeoPoint(latitude: 5.0689, longitude: -75.5138);

      final result = await service.resolveRoute(
        [start, end],
        travelMode: RouteTravelMode.flight,
      );

      expect(result.usesFlightTransfer, isTrue);
      expect(result.airports.isNotEmpty, isTrue);
      expect(result.transitAdviceMessage, contains('Aeropuerto Ernesto Cortissoz'));
    });

    test('should reject distant bus terminals (>65km) and select closest local terminal', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        // Simulate Photon returning Valledupar (~180km away) and Barranquilla (~6km away)
        if (uri.contains('photon.komoot.io')) {
          return http.Response(
            jsonEncode({
              'features': [
                {
                  'properties': {
                    'name': 'Terminal de Transportes de Valledupar',
                    'osm_value': 'bus_station',
                  },
                  'geometry': {
                    'coordinates': [-73.2384, 10.4578], // ~180 km away
                  },
                },
                {
                  'properties': {
                    'name': 'Terminal de Transportes de Barranquilla',
                    'osm_value': 'bus_station',
                  },
                  'geometry': {
                    'coordinates': [-74.7935, 10.9088], // ~6 km away
                  },
                },
              ],
            }),
            200,
          );
        }
        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964); // Barranquilla

      final terminals = await service.findBusTerminalsNear(start, role: 'Terminal salida');

      expect(terminals.isNotEmpty, isTrue);
      expect(terminals.first.name, 'Terminal de Transportes de Barranquilla');
      // Valledupar must NOT be present because it is > 65km
      expect(terminals.any((t) => t.name.contains('Valledupar')), isFalse);
    });

    test('should fallback to curated local terminal when dynamic API returns only distant candidates', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        // Simulate Photon returning only distant candidates from other departments
        if (uri.contains('photon.komoot.io')) {
          return http.Response(
            jsonEncode({
              'features': [
                {
                  'properties': {
                    'name': 'Terminal de Transporte de Sincelejo',
                    'osm_value': 'bus_station',
                  },
                  'geometry': {
                    'coordinates': [-75.3832, 9.2945], // ~180 km away
                  },
                },
              ],
            }),
            200,
          );
        }
        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964); // Barranquilla

      final terminals = await service.findBusTerminalsNear(start, role: 'Terminal salida');

      expect(terminals.isNotEmpty, isTrue);
      expect(terminals.first.name, 'Terminal de Transportes de Barranquilla');
      expect(terminals.any((t) => t.name.contains('Sincelejo')), isFalse);
    });

    test('should build hybrid driving and walking route when destination is off-road and accessible via hiking trail', () async {
      // Mock OSRM driving and foot endpoints
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();

        // Driving route: terminates on the road near trailhead (~3.9km from Pueblito)
        if (uri.contains('/route/v1/driving/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 123000.0,
                  'duration': 5800.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-74.7964, 10.9639], // Barranquilla
                      [-74.1500, 11.2000],
                      [-74.0006, 11.2867], // Calabazo trailhead on road
                    ],
                  },
                }
              ],
              'waypoints': [
                {'location': [-74.7964, 10.9639], 'name': 'Barranquilla', 'distance': 0.0},
                {'location': [-74.0006, 11.2867], 'name': 'Troncal del Caribe', 'distance': 3900.0},
              ],
            }),
            200,
          );
        }

        // Foot route: trail leading from trailhead on road to Pueblito Chairama
        if (uri.contains('routed-foot') || uri.contains('/route/v1/foot/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 9700.0,
                  'duration': 8500.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-74.0006, 11.2867], // Trailhead on road
                      [-73.9950, 11.3000],
                      [-73.9851, 11.3195], // Pueblito Chairama (~50m snap)
                    ],
                  },
                }
              ],
              'waypoints': [
                {'location': [-74.0006, 11.2867], 'name': 'Entrada Calabazo', 'distance': 0.0},
                {'location': [-73.9851, 11.3195], 'name': 'Pueblito Chairama', 'distance': 55.0},
              ],
            }),
            200,
          );
        }

        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 10.9639, longitude: -74.7964); // Barranquilla
      const end = GeoPoint(latitude: 11.3200, longitude: -73.9850); // Pueblito Chairama

      final result = await service.resolveRoute(
        [start, end],
        travelMode: RouteTravelMode.driving,
      );

      // Verify no inappropriate flight or maritime connection was triggered
      expect(result.usesFlightTransfer, isFalse);
      expect(result.usesMaritimeTransfer, isFalse);

      // Verify hybrid road + walking trail geometry
      expect(result.geometry.isNotEmpty, isTrue);
      expect(result.walkingSegments.isNotEmpty, isTrue);
      expect(result.usesWalkingTransfer, isTrue);

      // Verify walking trail starts at the road drop-off point and reaches destination
      final trail = result.walkingSegments.first;
      expect(trail.length, greaterThanOrEqualTo(2));
      expect(trail.first.latitude, closeTo(11.2867, 0.001));
      expect(trail.last.latitude, closeTo(11.3195, 0.001));

      // Verify combined distance and travel duration
      expect(result.distanceMeters, closeTo(132700.0, 100.0));
      expect(result.travelTimeSeconds, 5800 + 8500);

      // Verify user-facing transit advice
      expect(result.transitAdviceMessage, isNotNull);
      expect(result.transitAdviceMessage, contains('sendero'));
      expect(result.transitAdviceMessage, contains('caminata'));
    });

    test('should route pure pedestrian trail when both points are off-road within park', () async {
      final mockClient = MockClient((request) async {
        final uri = request.url.toString();
        // OSRM driving has no road connection between park stops
        if (uri.contains('/route/v1/driving/')) {
          return http.Response('{"code":"NoRoute"}', 404);
        }

        if (uri.contains('routed-foot') || uri.contains('/route/v1/foot/')) {
          return http.Response(
            jsonEncode({
              'code': 'Ok',
              'routes': [
                {
                  'distance': 6000.0,
                  'duration': 5400.0,
                  'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                      [-73.9850, 11.3200], // Pueblito Chairama
                      [-73.9600, 11.3250],
                      [-73.9480, 11.3310], // Cabo San Juan
                    ],
                  },
                }
              ],
            }),
            200,
          );
        }

        return http.Response('{"code":"NotFound"}', 404);
      });

      final service = RoadRouteService(client: mockClient);
      const start = GeoPoint(latitude: 11.3200, longitude: -73.9850); // Pueblito
      const end = GeoPoint(latitude: 11.3310, longitude: -73.9480); // Cabo San Juan

      final result = await service.resolveRoute(
        [start, end],
        travelMode: RouteTravelMode.driving,
      );

      expect(result.usesFlightTransfer, isFalse);
      expect(result.usesMaritimeTransfer, isFalse);
      expect(result.walkingSegments.isNotEmpty, isTrue);
      expect(result.usesWalkingTransfer, isTrue);
      expect(result.distanceMeters, 6000.0);
      expect(result.travelTimeSeconds, 5400);
      expect(result.transitAdviceMessage, contains('Sendero peatonal'));
    });
  });
}
