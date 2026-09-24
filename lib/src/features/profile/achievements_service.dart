import 'package:flutter/material.dart';
import '../../core/design/app_theme.dart';
import '../../l10n/generated/app_localizations.dart';

enum AchievementCategory {
  routes,
  reviews,
  community,
  exploration,
  identity,
}

class AchievementItem {
  final String id;
  final IconData icon;
  final Color accentColor;
  final AchievementCategory category;
  final String categoryLabel;
  final String title;
  final String subtitle;
  final String description;
  final int currentValue;
  final int targetValue;

  const AchievementItem({
    required this.id,
    required this.icon,
    required this.accentColor,
    required this.category,
    required this.categoryLabel,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.currentValue,
    required this.targetValue,
  });

  bool get isUnlocked => currentValue >= targetValue;

  double get progress {
    if (targetValue <= 0) return 1.0;
    return (currentValue / targetValue).clamp(0.0, 1.0);
  }
}

class AchievementsService {
  const AchievementsService._();

  static List<AchievementItem> buildAchievements({
    required AppLocalizations l10n,
    required Map<String, dynamic> stats,
    bool hasCustomBio = false,
    bool hasCustomAvatar = false,
  }) {
    final createdCount = (stats['createdTours'] as num?)?.toInt() ?? 0;
    final ratedCount = (stats['toursRated'] as num?)?.toInt() ?? 0;
    final participantsCount = (stats['participants'] as num?)?.toInt() ?? 0;
    final totalStopsExplored = (createdCount * 4) + (ratedCount * 3) + 5;
    final totalKmWalked = (totalStopsExplored * 0.8).round();

    return [
      // 1-5: Route Creation (5 achievements)
      AchievementItem(
        id: 'route_creator_1',
        icon: Icons.map_rounded,
        accentColor: AppTheme.primary,
        category: AchievementCategory.routes,
        categoryLabel: 'Creación de Rutas',
        title: l10n.badgeRouteCreatorTitle,
        subtitle: '$createdCount / 1 tour creado',
        description: l10n.badgeRouteCreatorReason,
        currentValue: createdCount,
        targetValue: 1,
      ),
      AchievementItem(
        id: 'route_creator_3',
        icon: Icons.alt_route_rounded,
        accentColor: AppTheme.primary,
        category: AchievementCategory.routes,
        categoryLabel: 'Creación de Rutas',
        title: 'Arquitecto Urbano',
        subtitle: '$createdCount / 3 tours creados',
        description: 'Diseña y publica al menos 3 tours para la comunidad.',
        currentValue: createdCount,
        targetValue: 3,
      ),
      AchievementItem(
        id: 'route_creator_5',
        icon: Icons.explore_rounded,
        accentColor: AppTheme.primary,
        category: AchievementCategory.routes,
        categoryLabel: 'Creación de Rutas',
        title: 'Cartógrafo Experto',
        subtitle: '$createdCount / 5 tours creados',
        description: 'Alcanza 5 rutas creadas compartiendo tus lugares favoritos.',
        currentValue: createdCount,
        targetValue: 5,
      ),
      AchievementItem(
        id: 'route_creator_10',
        icon: Icons.public_rounded,
        accentColor: AppTheme.primary,
        category: AchievementCategory.routes,
        categoryLabel: 'Creación de Rutas',
        title: 'Maestro de Itinerarios',
        subtitle: '$createdCount / 10 tours creados',
        description: 'Conviértete en referente creando 10 experiencias turísticas.',
        currentValue: createdCount,
        targetValue: 10,
      ),
      AchievementItem(
        id: 'route_creator_20',
        icon: Icons.auto_awesome_rounded,
        accentColor: AppTheme.primary,
        category: AchievementCategory.routes,
        categoryLabel: 'Creación de Rutas',
        title: 'Leyenda de VibeTours',
        subtitle: '$createdCount / 20 tours creados',
        description: 'El máximo reconocimiento para creadores con 20 tours publicados.',
        currentValue: createdCount,
        targetValue: 20,
      ),

      // 6-9: Reviews & Criticism (4 achievements)
      AchievementItem(
        id: 'critic_1',
        icon: Icons.star_rate_rounded,
        accentColor: Colors.amber.shade700,
        category: AchievementCategory.reviews,
        categoryLabel: 'Crítica y Reseñas',
        title: l10n.badgeTouristCriticTitle,
        subtitle: '$ratedCount / 1 reseña dada',
        description: l10n.badgeTouristCriticReason,
        currentValue: ratedCount,
        targetValue: 1,
      ),
      AchievementItem(
        id: 'critic_3',
        icon: Icons.rate_review_rounded,
        accentColor: Colors.amber.shade700,
        category: AchievementCategory.reviews,
        categoryLabel: 'Crítica y Reseñas',
        title: 'Voz del Viajero',
        subtitle: '$ratedCount / 3 reseñas dadas',
        description: 'Comparte tu opinión calificando 3 tours diferentes.',
        currentValue: ratedCount,
        targetValue: 3,
      ),
      AchievementItem(
        id: 'critic_5',
        icon: Icons.reviews_rounded,
        accentColor: Colors.amber.shade700,
        category: AchievementCategory.reviews,
        categoryLabel: 'Crítica y Reseñas',
        title: 'Catador de Experiencias',
        subtitle: '$ratedCount / 5 reseñas dadas',
        description: 'Ayuda a otros viajeros dejando 5 calificaciones detalladas.',
        currentValue: ratedCount,
        targetValue: 5,
      ),
      AchievementItem(
        id: 'critic_10',
        icon: Icons.workspace_premium_rounded,
        accentColor: Colors.amber.shade700,
        category: AchievementCategory.reviews,
        categoryLabel: 'Crítica y Reseñas',
        title: 'Crítico de Élite',
        subtitle: '$ratedCount / 10 reseñas dadas',
        description: 'Alcanza 10 reseñas aportando criterio de calidad a la comunidad.',
        currentValue: ratedCount,
        targetValue: 10,
      ),

      // 10-13: Community Impact (4 achievements)
      AchievementItem(
        id: 'community_1',
        icon: Icons.groups_rounded,
        accentColor: AppTheme.violet,
        category: AchievementCategory.community,
        categoryLabel: 'Impacto en la Comunidad',
        title: l10n.badgeCommunityGuideTitle,
        subtitle: '$participantsCount / 1 participante',
        description: l10n.badgeCommunityGuideReason,
        currentValue: participantsCount,
        targetValue: 1,
      ),
      AchievementItem(
        id: 'community_5',
        icon: Icons.diversity_3_rounded,
        accentColor: AppTheme.violet,
        category: AchievementCategory.community,
        categoryLabel: 'Impacto en la Comunidad',
        title: 'Anfitrión Local',
        subtitle: '$participantsCount / 5 participantes',
        description: 'Logra que 5 viajeros se unan y recorran tus tours.',
        currentValue: participantsCount,
        targetValue: 5,
      ),
      AchievementItem(
        id: 'community_15',
        icon: Icons.record_voice_over_rounded,
        accentColor: AppTheme.violet,
        category: AchievementCategory.community,
        categoryLabel: 'Impacto en la Comunidad',
        title: 'Líder de Expedición',
        subtitle: '$participantsCount / 15 participantes',
        description: 'Guía a 15 participantes a través de tus rutas publicadas.',
        currentValue: participantsCount,
        targetValue: 15,
      ),
      AchievementItem(
        id: 'community_50',
        icon: Icons.emoji_events_rounded,
        accentColor: AppTheme.violet,
        category: AchievementCategory.community,
        categoryLabel: 'Impacto en la Comunidad',
        title: 'Embajador Turístico',
        subtitle: '$participantsCount / 50 participantes',
        description: 'Inspira a 50 viajeros con tus recorridos en VibeTours.',
        currentValue: participantsCount,
        targetValue: 50,
      ),

      // 14-18: Exploration & Distance (5 achievements)
      AchievementItem(
        id: 'stops_10',
        icon: Icons.place_rounded,
        accentColor: Colors.teal,
        category: AchievementCategory.exploration,
        categoryLabel: 'Exploración y Distancia',
        title: 'Primeros Pasos',
        subtitle: '$totalStopsExplored / 10 paradas',
        description: 'Acumula 10 paradas descubiertas entre tus rutas y recorridos.',
        currentValue: totalStopsExplored,
        targetValue: 10,
      ),
      AchievementItem(
        id: 'stops_25',
        icon: Icons.pin_drop_rounded,
        accentColor: Colors.teal,
        category: AchievementCategory.exploration,
        categoryLabel: 'Exploración y Distancia',
        title: 'Cazador de Rincones',
        subtitle: '$totalStopsExplored / 25 paradas',
        description: 'Descubre 25 puntos de interés cultural o turístico.',
        currentValue: totalStopsExplored,
        targetValue: 25,
      ),
      AchievementItem(
        id: 'stops_50',
        icon: Icons.flag_circle_rounded,
        accentColor: Colors.teal,
        category: AchievementCategory.exploration,
        categoryLabel: 'Exploración y Distancia',
        title: 'Conquistador de Paradas',
        subtitle: '$totalStopsExplored / 50 paradas',
        description: 'Alcanza la meta de 50 paradas registradas en tu pasaporte.',
        currentValue: totalStopsExplored,
        targetValue: 50,
      ),
      AchievementItem(
        id: 'km_15',
        icon: Icons.directions_walk_rounded,
        accentColor: Colors.teal,
        category: AchievementCategory.exploration,
        categoryLabel: 'Exploración y Distancia',
        title: 'Caminante Urbano',
        subtitle: '$totalKmWalked / 15 km',
        description: 'Suma al menos 15 kilómetros de recorrido en tu pasaporte.',
        currentValue: totalKmWalked,
        targetValue: 15,
      ),
      AchievementItem(
        id: 'km_40',
        icon: Icons.hiking_rounded,
        accentColor: Colors.teal,
        category: AchievementCategory.exploration,
        categoryLabel: 'Exploración y Distancia',
        title: 'Trotamundos Imparable',
        subtitle: '$totalKmWalked / 40 km',
        description: 'Supera los 40 kilómetros explorando destinos con VibeTours.',
        currentValue: totalKmWalked,
        targetValue: 40,
      ),

      // 19-20: Traveler Identity (2 achievements)
      AchievementItem(
        id: 'identity_bio',
        icon: Icons.edit_note_rounded,
        accentColor: Colors.pinkAccent,
        category: AchievementCategory.identity,
        categoryLabel: 'Identidad del Viajero',
        title: 'Historia que Contar',
        subtitle: hasCustomBio ? 'Biografía completada' : 'Pendiente de completar',
        description: 'Personaliza la sección "Sobre mí" en tu perfil de viajero.',
        currentValue: hasCustomBio ? 1 : 0,
        targetValue: 1,
      ),
      AchievementItem(
        id: 'identity_avatar',
        icon: Icons.account_circle_rounded,
        accentColor: Colors.pinkAccent,
        category: AchievementCategory.identity,
        categoryLabel: 'Identidad del Viajero',
        title: 'Rostro Viajero',
        subtitle: hasCustomAvatar ? 'Foto configurada' : 'Pendiente de subir',
        description: 'Personaliza tu perfil agregando una foto o avatar.',
        currentValue: hasCustomAvatar ? 1 : 0,
        targetValue: 1,
      ),
    ];
  }
}
