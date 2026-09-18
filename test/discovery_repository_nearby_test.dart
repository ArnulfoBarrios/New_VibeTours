import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/data/discovery_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;

  group('DiscoveryRepository Nearby Places', () {
    final repository = DiscoveryRepository();

    test('should return deduplicated places and exclude extinct sites like Juana de Arco', () async {
      // Coordinates around Barranquilla north (Riomar / Buenavista)
      final places = await repository.nearbyPlaces(
        latitude: 11.0185,
        longitude: -74.8285,
      );

      expect(places, isNotEmpty);


      // Verify that extinct / demolished places are excluded
      final names = places.map((p) => p.name.toLowerCase()).toList();
      expect(names.contains('estadio juana de arco'), isFalse,
          reason: 'Demolished Estadio Juana de Arco should be filtered out');

      // Verify that non-emblematic residential neighborhoods are filtered out
      expect(names.contains('el golf'), isFalse,
          reason: 'Ordinary residential neighborhood El Golf should be filtered out');
      expect(names.contains('ciudad jardín'), isFalse,
          reason: 'Ordinary residential subdivision Ciudad Jardín should be filtered out');

      // Verify that universities and educational institutions are filtered out
      expect(names.contains('corporación universitaria americana'), isFalse,
          reason: 'Universities should be filtered out from tourist places');

      // Verify spatial deduplication: no two places within 70 meters
      for (int i = 0; i < places.length; i++) {
        for (int j = i + 1; j < places.length; j++) {
          final p1 = places[i];
          final p2 = places[j];
          final distance = repository.distanceMeters(
            p1.location.latitude,
            p1.location.longitude,
            p2.location.latitude,
            p2.location.longitude,
          );
          expect(distance > 70.0, isTrue,
              reason: 'Places "${p1.name}" and "${p2.name}" are duplicates at distance ${distance.toStringAsFixed(1)}m');
        }
      }

      // Verify place types are in Spanish, not raw English TomTom categories
      for (final place in places) {
        expect(
          place.type.toLowerCase().contains('important tourist attraction'),
          isFalse,
          reason: 'Place "${place.name}" should have Spanish type, not "Important Tourist Attraction"',
        );
        expect(
          place.type.toLowerCase().contains('park recreation area'),
          isFalse,
          reason: 'Place "${place.name}" should have Spanish type, not "Park Recreation Area"',
        );
      }

      // Verify secular places do not have religious icon/church images
      for (final place in places) {
        if (place.category != 'religious') {
          final lowerImg = place.imageUrl.toLowerCase();
          expect(lowerImg.contains('vladimirskaya'), isFalse,
              reason: 'Place "${place.name}" should not use religious icon painting');
        }
      }
    }, timeout: const Timeout(Duration(seconds: 30)));
  });
}
