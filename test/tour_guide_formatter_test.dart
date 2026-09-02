import 'package:flutter_test/flutter_test.dart';
import 'package:vibetoursapp/src/core/utils/tour_guide_formatter.dart';
import 'package:vibetoursapp/src/domain/models.dart';

void main() {
  test('TourGuideFormatter converts roman numerals and abbreviations', () {
    const raw = 'Construido en el siglo XVII en la av. Pedro de Heredia a 500 m del centro.';
    final clean = TourGuideFormatter.normalizePhonetics(raw);
    expect(clean.contains('siglo diecisiete'), isTrue);
    expect(clean.contains('avenida Pedro de Heredia'), isTrue);
    expect(clean.contains('500 metros'), isTrue);
  });

  test('TourGuideFormatter creates warm guide narration for stop', () {
    const stop = TourStop(
      id: 'stop_1',
      name: 'Atracción: Castillo San Felipe de Barajas',
      location: GeoPoint(latitude: 10.42, longitude: -75.53),
      imageUrl: '',
      description: 'Gran fortaleza militar construida en el siglo XVII.',
      activities: ['Historia', 'Fotografía'],
      tips: ['Lleva agua y sombrero para protegerte del sol'],
      suggestedMinutes: 30,
    );

    final narration = TourGuideFormatter.formatStopNarration(stop, stopIndex: 0, totalStops: 3);
    expect(narration.startsWith('¡Hola y bienvenidos a Castillo San Felipe de Barajas!'), isTrue);
    expect(narration.contains('siglo diecisiete'), isTrue);
    expect(narration.contains('Un consejo para tu visita: Lleva agua y sombrero para protegerte del sol.'), isTrue);
  });
}
