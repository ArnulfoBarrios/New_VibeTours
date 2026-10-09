import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:vibetoursapp/src/core/services/road_route_service.dart';
import 'package:vibetoursapp/src/core/utils/coastal_island_route_policy.dart';
import 'package:vibetoursapp/src/domain/models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('coastal_islands marine routing', () {
    setUp(() => RoadRouteService.clearCache());

    test('recovers a missing coastal subtype from Morrosquillo island stops', () {
      expect(
        isCoastalIslandTourRoute(
          itineraryType: 'express_tour',
          city: 'Coveñas',
          stopNames: const ['Isla Múcura'],
        ),
        isTrue,
      );
      expect(
        isCoastalIslandTourRoute(
          itineraryType: 'single_city',
          city: 'Cartagena',
          stopNames: const ['Isla Barú'],
        ),
        isFalse,
      );
      expect(isCoastalIslandStopName('Islas de San Bernardo'), isFalse);
    });

    test('prefers the port and boat transfer over the fabricated walking leg', () async {
      var walkingRequests = 0;
      final client = MockClient((request) async {
        final uri = request.url;
        if (uri.host == 'overpass.test') {
          final query = request.bodyFields['data'] ?? '';
          if (query.contains('9.41,-75.68')) {
            return http.Response(jsonEncode({
              'elements': [
                {'type': 'node', 'id': 1, 'lat': 9.42, 'lon': -75.68, 'tags': {'name': 'Muelle de Coveñas', 'amenity': 'ferry_terminal'}},
              ],
            }), 200);
          }
          if (query.contains('9.74,-75.82')) {
            return http.Response(jsonEncode({
              'elements': [
                {'type': 'node', 'id': 2, 'lat': 9.74, 'lon': -75.83, 'tags': {'name': 'Muelle de Isla Múcura', 'amenity': 'ferry_terminal'}},
              ],
            }), 200);
          }
          return http.Response('{"elements":[]}', 200);
        }

        if (uri.path.contains('/route/v1/foot/')) {
          walkingRequests++;
          return http.Response('{"code":"NoRoute"}', 404);
        }
        if (uri.path.contains('/route/v1/driving/')) {
          final coordinatePath = uri.path.split('/route/v1/driving/').last;
          final destinationPair = coordinatePath.split(';').last.split(',');
          final requestedDestination = GeoPoint(
            latitude: double.parse(destinationPair[1]),
            longitude: double.parse(destinationPair[0]),
          );
          const island = GeoPoint(latitude: 9.74, longitude: -75.82);
          final isIslandRoute =
              (requestedDestination.latitude - island.latitude).abs() < 0.00001 &&
              (requestedDestination.longitude - island.longitude).abs() < 0.00001;
          final routeEnd = requestedDestination;
          final startPair = coordinatePath.split(';').first.split(',');
          final routeStart = GeoPoint(
            latitude: double.parse(startPair[1]),
            longitude: double.parse(startPair[0]),
          );
          return http.Response(jsonEncode({
            'code': 'Ok',
            'routes': [
              {
                'distance': isIslandRoute ? 6000.0 : 1600.0,
                'duration': isIslandRoute ? 600.0 : 180.0,
                'geometry': {
                  'type': 'LineString',
                  'coordinates': [
                    [routeStart.longitude, routeStart.latitude],
                    [routeEnd.longitude, routeEnd.latitude],
                  ],
                },
              },
            ],
          }), 200);
        }
        return http.Response('{"code":"NoRoute"}', 404);
      });

      final service = RoadRouteService(
        client: client,
        osrmBaseUrl: 'https://router.test',
        overpassUrl: 'https://overpass.test/api/interpreter',
      );
      const mainland = GeoPoint(latitude: 9.41, longitude: -75.68);
      const island = GeoPoint(latitude: 9.74, longitude: -75.82);

      final result = await service.resolveRoute(
        [mainland, island],
        coastalIslands: true,
        coastalIslandDestination: true,
      );

      expect(result.usesMaritimeTransfer, isTrue);
      expect(result.maritimeSegments, hasLength(1));
      expect(result.maritimeSegments.single, hasLength(2));
      expect(result.walkingSegments, isEmpty);
      expect(walkingRequests, 0);
      expect(result.geometry.last.latitude, closeTo(9.42, 0.01));
      expect(result.geometry.last.longitude, closeTo(-75.68, 0.01));
      expect(result.transitAdviceMessage, contains('embarcación'));
      expect(result.transitAdviceMessage, contains('Muelle de Coveñas'));
    });

    test('leaves other routes on the existing generic walking logic', () async {
      final client = MockClient((request) async {
        if (request.url.path.contains('/route/v1/driving/')) {
          final coordinatePath = request.url.path.split('/route/v1/driving/').last;
          final startPair = coordinatePath.split(';').first.split(',');
          final routeStart = GeoPoint(
            latitude: double.parse(startPair[1]),
            longitude: double.parse(startPair[0]),
          );
          return http.Response(jsonEncode({
            'code': 'Ok',
            'routes': [
              {
                'distance': 6000.0,
                'duration': 600.0,
                'geometry': {
                  'type': 'LineString',
                  'coordinates': [
                    [routeStart.longitude, routeStart.latitude],
                    [-75.68, 9.44],
                  ],
                },
              },
            ],
          }), 200);
        }
        return http.Response('{"code":"NoRoute"}', 404);
      });
      final service = RoadRouteService(
        client: client,
        osrmBaseUrl: 'https://router.test',
        overpassUrl: 'https://overpass.test/api/interpreter',
      );

      final result = await service.resolveRoute(
        const [
          GeoPoint(latitude: 9.41, longitude: -75.68),
          GeoPoint(latitude: 9.74, longitude: -75.82),
        ],
      );

      expect(result.usesMaritimeTransfer, isFalse);
      expect(result.walkingSegments, isNotEmpty);
    });

    test('does not label an island transfer as a walk when no mapped port is found', () async {
      var walkingRequests = 0;
      final client = MockClient((request) async {
        if (request.url.host == 'overpass.test') {
          return http.Response('{"elements":[]}', 200);
        }
        if (request.url.path.contains('/route/v1/foot/')) {
          walkingRequests++;
        }
        return http.Response('{"code":"NoRoute"}', 404);
      });
      final service = RoadRouteService(
        client: client,
        osrmBaseUrl: 'https://router.test',
        overpassUrl: 'https://overpass.test/api/interpreter',
      );

      final result = await service.resolveRoute(
        const [
          GeoPoint(latitude: 9.41, longitude: -75.68),
          GeoPoint(latitude: 9.62, longitude: -75.8),
        ],
        coastalIslands: true,
        coastalIslandDestination: true,
      );

      expect(result.usesMaritimeTransfer, isTrue);
      expect(result.walkingSegments, isEmpty);
      expect(walkingRequests, 0);
      expect(result.transitAdviceMessage, isNot(contains('a pie')));
      expect(result.transitAdviceMessage, contains('trayecto por mar'));
    });
  });
}
