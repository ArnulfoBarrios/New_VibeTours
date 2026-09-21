import 'dart:math' as math;
import 'package:geolocator/geolocator.dart';
import '../../domain/models.dart';

/// Service that computes a realistic affinity percentage (0% to 100%)
/// combining the user's travel preferences with geographical accessibility.
class AffinityCalculator {
  const AffinityCalculator._();

  /// Calculates the final affinity percentage for a [tour] based on the user's
  /// [profile] and current [userPosition].
  ///
  /// Returns an integer percentage between 15% and 99%.
  static int calculateTourAffinity({
    required Tour tour,
    TouristProfileV2? profile,
    Position? userPosition,
  }) {
    final double profileScore = _computeProfileScore(tour, profile);
    final double locationFactor = _computeLocationFactor(tour, userPosition);

    final double rawAffinity = profileScore * locationFactor;
    return rawAffinity.round().clamp(15, 99);
  }

  /// Calculates profile compatibility score on a 0-100 scale.
  static double _computeProfileScore(Tour tour, TouristProfileV2? profile) {
    if (profile == null || profile.interests.isEmpty) {
      // Neutral fallback for users who haven't completed their profile yet
      // Based on tour quality (rating & review credibility)
      final ratingPart = (tour.rating * 14.0).clamp(50.0, 70.0);
      final reviewsPart = tour.reviewCount > 0 ? math.min(15.0, tour.reviewCount * 1.5) : 5.0;
      return (ratingPart + reviewsPart).clamp(60.0, 88.0);
    }

    double score = 35.0; // Base score

    // 1. Interest vs Tour Type & Subcategories (up to 35 pts)
    final matchingTypes = _mapInterestsToTourTypes(profile.interests);
    if (matchingTypes.contains(tour.type)) {
      score += 25.0;
    }

    // Check tags, keywords, and subcategories for semantic matches
    final profileInterestNames = profile.interests.map((i) => i.name.toLowerCase()).toSet();
    final tourMetadataTokens = [
      ...tour.tags.map((t) => t.toLowerCase()),
      ...tour.keywords.map((k) => k.toLowerCase()),
      ...tour.subcategories.map((s) => s.toLowerCase()),
    ];

    bool hasTagMatch = false;
    for (final token in tourMetadataTokens) {
      for (final interest in profileInterestNames) {
        if (token.contains(interest) || _isSemanticMatch(token, interest)) {
          hasTagMatch = true;
          break;
        }
      }
      if (hasTagMatch) break;
    }
    if (hasTagMatch) {
      score += 10.0;
    }

    // 2. Audience / Companion match (up to 15 pts)
    final companion = profile.companionType.toLowerCase();
    final traveler = profile.travelerType.toLowerCase();
    final tourAudiences = tour.recommendedAudience.map((a) => a.toLowerCase()).toList();

    if (tourAudiences.any((a) => a.contains(companion) || a.contains(traveler))) {
      score += 15.0;
    } else if (tourAudiences.isEmpty) {
      score += 8.0; // General audience
    }

    // 3. Children consideration (up to 10 pts or -20 penalty)
    if (profile.hasChildren) {
      final isKidsFriendly = tour.additionalInfo.aptoParaNinos ||
          tourAudiences.any((a) => a.contains('niño') || a.contains('familia') || a.contains('family'));
      if (isKidsFriendly) {
        score += 10.0;
      } else {
        score -= 30.0; // Severe penalty: not suitable for traveling with children
      }
    } else {
      score += 5.0;
    }

    // 4. Pace vs Difficulty & Duration (up to 10 pts)
    final pace = profile.preferredPace.toLowerCase();
    if (pace.contains('relajad')) {
      if (tour.difficulty == TourDifficulty.easy || tour.durationHours <= 3.0) {
        score += 10.0;
      } else if (tour.difficulty == TourDifficulty.intense) {
        score -= 5.0;
      } else {
        score += 5.0;
      }
    } else if (pace.contains('intens')) {
      if (tour.difficulty == TourDifficulty.intense || tour.durationHours >= 4.0) {
        score += 10.0;
      } else {
        score += 5.0;
      }
    } else {
      // Equilibrado
      score += 8.0;
    }

    // 5. Budget preference (up to 10 pts)
    final budget = profile.budget.toLowerCase();
    if (budget.contains('económ') || budget.contains('econom')) {
      if (tour.budget.low > 0 || tour.budget.medium <= 35) {
        score += 10.0;
      } else {
        score += 4.0;
      }
    } else if (budget.contains('lujo')) {
      if (tour.budget.high > 80) {
        score += 10.0;
      } else {
        score += 6.0;
      }
    } else {
      // Moderado
      score += 8.0;
    }

    return score.clamp(20.0, 100.0);
  }

  /// Calculates the geographical accessibility factor (0.20 to 1.00).
  ///
  /// Tours in the user's city or nearby region get a multiplier of 0.90 - 1.0.
  /// Tours in other continents (Australia, Europe, etc.) get reduced to 0.20 - 0.35.
  static double _computeLocationFactor(Tour tour, Position? userPosition) {
    if (userPosition != null) {
      final tourCenter = tour.center;
      final double distanceMeters = Geolocator.distanceBetween(
        userPosition.latitude,
        userPosition.longitude,
        tourCenter.latitude,
        tourCenter.longitude,
      );
      final double distanceKm = distanceMeters / 1000.0;

      if (distanceKm <= 50) {
        // Same city or immediate metropolitan area: 100% accessible
        return 1.0;
      } else if (distanceKm <= 150) {
        // Regional day trip (e.g. Barranquilla <-> Cartagena / Santa Marta)
        return 0.95;
      } else if (distanceKm <= 500) {
        // Medium domestic distance
        return 0.88;
      } else if (distanceKm <= 1200) {
        // Longer domestic travel within the same country
        return 0.80;
      } else if (distanceKm <= 2500) {
        // Neighboring countries / continental region
        return 0.55;
      } else {
        // Intercontinental / opposite side of the world (e.g. Australia, Europe, USA from Colombia)
        // Decays smoothly to ~0.22 for 14,000 km
        return math.max(0.20, 0.20 + 0.15 * (2500.0 / distanceKm));
      }
    }

    // Fallback if GPS position is unavailable
    final isColombiaTour = tour.country.toLowerCase().contains('colombia') ||
        ['barranquilla', 'cartagena', 'bogotá', 'bogota', 'medellín', 'medellin', 'santa marta', 'cali']
            .contains(tour.city.toLowerCase());

    if (isColombiaTour) {
      return 0.88;
    }
    // Remote foreign tour without GPS
    return 0.30;
  }

  static Set<TourType> _mapInterestsToTourTypes(List<TouristInterest> interests) {
    final types = <TourType>{};
    for (final interest in interests) {
      switch (interest) {
        case TouristInterest.beaches:
          types.add(TourType.romantic);
          break;
        case TouristInterest.nature:
        case TouristInterest.adventures:
          types.add(TourType.ecological);
          types.add(TourType.sports);
          break;
        case TouristInterest.museums:
        case TouristInterest.monuments:
          types.add(TourType.cultural);
          types.add(TourType.historical);
          break;
        case TouristInterest.gastronomy:
        case TouristInterest.nightlife:
          types.add(TourType.gastronomic);
          types.add(TourType.night);
          break;
        case TouristInterest.familyActivities:
          types.add(TourType.family);
          break;
        case TouristInterest.shopping:
          types.add(TourType.custom);
          break;
      }
    }
    return types;
  }

  static bool _isSemanticMatch(String token, String interest) {
    const synonyms = {
      'beaches': ['playa', 'mar', 'costa', 'isla', 'arena', 'beach'],
      'nature': ['naturaleza', 'parque', 'selva', 'bosque', 'rio', 'ecoturismo', 'nature'],
      'adventures': ['aventura', 'senderismo', 'trekking', 'extremo', 'adrenalina', 'adventure'],
      'museums': ['museo', 'galeria', 'arte', 'exposicion', 'museum'],
      'monuments': ['monumento', 'historico', 'patrimonio', 'arquitectura', 'catedral', 'castillo'],
      'gastronomy': ['gastronomia', 'comida', 'culinario', 'restaurante', 'cata', 'sabores', 'food'],
      'nightlife': ['noche', 'nocturno', 'bar', 'fiesta', 'coctel', 'night'],
      'familyactivities': ['familia', 'niños', 'parque de diversiones', 'kids', 'family'],
      'shopping': ['compras', 'mercado', 'artesanias', 'tienda', 'shopping'],
    };

    final list = synonyms[interest] ?? [];
    return list.any((word) => token.contains(word));
  }
}
