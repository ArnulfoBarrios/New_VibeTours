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
  });
}
