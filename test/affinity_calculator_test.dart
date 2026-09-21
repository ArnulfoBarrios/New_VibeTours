import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:vibetoursapp/src/core/services/affinity_calculator.dart';
import 'package:vibetoursapp/src/domain/models.dart';

void main() {
  group('AffinityCalculator Tests', () {
    // User in Barranquilla, Colombia
    final userInBarranquilla = Position(
      latitude: 10.96854,
      longitude: -74.78132,
      timestamp: DateTime.now(),
      accuracy: 10.0,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );

    // Profile: Nature & Adventure, Solo traveler, Relaxed pace
    const adventureProfile = TouristProfileV2(
      travelerType: 'Solo',
      budget: 'Moderado',
      companionType: 'Solo',
      hasChildren: false,
      interests: [TouristInterest.nature, TouristInterest.adventures],
      preferredPace: 'Relajado',
      transportPreference: 'Caminando',
      preferredTimeOfDay: 'Mañanas',
      aiSummary: 'Viajero aventurero',
    );

    // Tour 1: Local tour in Barranquilla / Puerto Colombia (Ecological)
    const localColombiaTour = Tour(
      id: 'tour-colombia-1',
      title: 'Ecoturismo en Manglares de Barranquilla y Bocas de Ceniza',
      country: 'Colombia',
      city: 'Barranquilla',
      type: TourType.ecological,
      description: 'Hermoso recorrido ecológico por los manglares del Magdalena.',
      coverUrl: 'https://example.com/cover1.jpg',
      gallery: [],
      durationHours: 2.5,
      distanceKm: 5.0,
      rating: 4.8,
      reviewCount: 42,
      likes: 30,
      difficulty: TourDifficulty.easy,
      language: 'es',
      tags: ['naturaleza', 'rio', 'ecoturismo'],
      stops: [
        TourStop(
          id: 'stop-1',
          name: 'Bocas de Ceniza',
          location: GeoPoint(latitude: 11.0500, longitude: -74.8500),
          imageUrl: '',
          description: '',
          activities: [],
          tips: [],
          suggestedMinutes: 60,
        ),
      ],
      recommendedAudience: ['solo', 'aventureros'],
    );

    // Tour 2: International tour in Sydney, Australia (Extreme Adventure)
    const remoteAustraliaTour = Tour(
      id: 'tour-australia-1',
      title: 'Australia Extrema: De la Ópera de Sídney a la Gran Barrera de Coral',
      country: 'Australia',
      city: 'Sídney',
      type: TourType.ecological,
      description: 'Aventura extrema de 12 días en Australia.',
      coverUrl: 'https://example.com/cover2.jpg',
      gallery: [],
      durationHours: 8.0,
      distanceKm: 50.0,
      rating: 5.0,
      reviewCount: 150,
      likes: 120,
      difficulty: TourDifficulty.intense,
      language: 'en',
      tags: ['naturaleza', 'aventura'],
      stops: [
        TourStop(
          id: 'stop-sydney',
          name: 'Sydney Opera',
          location: GeoPoint(latitude: -33.8568, longitude: 151.2153),
          imageUrl: '',
          description: '',
          activities: [],
          tips: [],
          suggestedMinutes: 60,
        ),
      ],
      recommendedAudience: ['solo', 'aventureros'],
    );

    test('Local Colombian tour has much higher affinity than remote Australia tour for a user in Colombia', () {
      final localAffinity = AffinityCalculator.calculateTourAffinity(
        tour: localColombiaTour,
        profile: adventureProfile,
        userPosition: userInBarranquilla,
      );

      final remoteAffinity = AffinityCalculator.calculateTourAffinity(
        tour: remoteAustraliaTour,
        profile: adventureProfile,
        userPosition: userInBarranquilla,
      );

      expect(localAffinity, greaterThanOrEqualTo(85), reason: 'Local tour should have high affinity');
      expect(remoteAffinity, lessThanOrEqualTo(35), reason: 'Remote tour on the other side of the planet should have penalized affinity');
      expect(localAffinity, greaterThan(remoteAffinity * 2), reason: 'Local tour should have more than double the affinity of Australia');
    });

    test('Tour not suitable for children gets penalized when user travels with children', () {
      const familyProfile = TouristProfileV2(
        travelerType: 'Familia',
        budget: 'Moderado',
        companionType: 'Familia',
        hasChildren: true,
        interests: [TouristInterest.nature],
        preferredPace: 'Relajado',
        transportPreference: 'Auto Rentado',
        preferredTimeOfDay: 'Mañanas',
        aiSummary: '',
      );

      const adultOnlyTour = Tour(
        id: 'tour-adult',
        title: 'Ruta Nocturna de Bares y Aventura Extrema',
        country: 'Colombia',
        city: 'Barranquilla',
        type: TourType.ecological,
        description: 'Exclusivo para adultos.',
        coverUrl: '',
        gallery: [],
        durationHours: 3.0,
        distanceKm: 3.0,
        rating: 4.5,
        reviewCount: 10,
        likes: 5,
        difficulty: TourDifficulty.moderate,
        language: 'es',
        tags: ['naturaleza'],
        stops: [
          TourStop(
            id: 'stop-1',
            name: 'Punto local',
            location: GeoPoint(latitude: 10.97, longitude: -74.78),
            imageUrl: '',
            description: '',
            activities: [],
            tips: [],
            suggestedMinutes: 30,
          ),
        ],
        additionalInfo: TourAdditionalInfo(
          accesibilidad: '',
          mascotasPermitidas: false,
          aptoParaNinos: false,
          aptoParaAdultosMayores: false,
        ),
        recommendedAudience: ['adultos'],
      );

      final affinity = AffinityCalculator.calculateTourAffinity(
        tour: adultOnlyTour,
        profile: familyProfile,
        userPosition: userInBarranquilla,
      );

      // Should be significantly lower due to children incompatibility
      expect(affinity, lessThan(60));
    });

    test('Fallback location factor prioritizes Colombia tours even when GPS position is null', () {
      final colombiaAffinityNoGps = AffinityCalculator.calculateTourAffinity(
        tour: localColombiaTour,
        profile: adventureProfile,
        userPosition: null,
      );

      final australiaAffinityNoGps = AffinityCalculator.calculateTourAffinity(
        tour: remoteAustraliaTour,
        profile: adventureProfile,
        userPosition: null,
      );

      expect(colombiaAffinityNoGps, greaterThan(australiaAffinityNoGps));
      expect(colombiaAffinityNoGps, greaterThanOrEqualTo(75));
      expect(australiaAffinityNoGps, lessThanOrEqualTo(35));
    });
  });
}
