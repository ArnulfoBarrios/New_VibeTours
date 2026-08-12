import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({
    super.key,
    required this.userId,
  });

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(publicUserProfileProvider(userId));

    return PremiumScaffold(
      safeBottom: true,
      child: profileAsync.when(
        data: (profileData) {
          final fullName = profileData['fullName'] as String? ?? 'Viajero VibeTours';
          final avatarUrl = profileData['avatarUrl'] as String? ?? '';
          final bio = profileData['bio'] as String? ?? '';
          final stats = profileData['stats'] as Map<String, dynamic>? ?? {};
          final createdTours = (profileData['createdTours'] as List<dynamic>?)
                  ?.whereType<Tour>()
                  .toList() ??
              <Tour>[];

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: Theme.of(context).colorScheme.surface,
                elevation: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  onPressed: () => context.pop(),
                ),
                title: Text(
                  'Perfil de Viajero',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                centerTitle: true,
              ),
              SliverPadding(
                padding: const EdgeInsets.all(20.0),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Profile Header Card
                    _PublicProfileHeader(
                      fullName: fullName,
                      avatarUrl: avatarUrl,
                      bio: bio,
                    ),
                    const SizedBox(height: 24),

                    // Quick Stats Bar
                    _PublicProfileStatsBar(stats: stats),
                    const SizedBox(height: 28),

                    // Digital Travel Passport
                    _PublicDigitalPassportSection(
                      userName: fullName,
                      stats: stats,
                    ),
                    const SizedBox(height: 32),

                    // Tours Created Section
                    _PublicCreatedToursSection(createdTours: createdTours),
                    const SizedBox(height: 40),
                  ]),
                ),
              ),
            ],
          );
        },
        loading: () => const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        ),
        error: (error, _) => Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded),
              onPressed: () => context.pop(),
            ),
          ),
          body: EmptyState(
            icon: Icons.person_off_rounded,
            title: 'Perfil no disponible',
            body: 'No se pudo cargar la información del viajero.',
          ),
        ),
      ),
    );
  }
}

class _PublicProfileHeader extends StatelessWidget {
  const _PublicProfileHeader({
    required this.fullName,
    required this.avatarUrl,
    required this.bio,
  });

  final String fullName;
  final String avatarUrl;
  final String bio;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassPanel(
      padding: const EdgeInsets.all(24),
      radius: 28,
      child: Column(
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.25),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(50),
              child: avatarUrl.startsWith('data:image')
                  ? Image.memory(
                      base64Decode(avatarUrl.split(',').last),
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          _buildAvatarFallback(fullName),
                    )
                  : avatarUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: avatarUrl,
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              const SkeletonBox(width: 100, height: 100),
                          errorWidget: (context, url, error) =>
                              _buildAvatarFallback(fullName),
                        )
                      : _buildAvatarFallback(fullName),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            fullName,
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.explore_rounded,
                  size: 14,
                  color: AppTheme.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  'Comunidad VibeTours',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          if (bio.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              bio,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.75),
                height: 1.4,
              ),
            ),
          ] else ...[
            const SizedBox(height: 14),
            Text(
              '¡Viajero activo explorando experiencias únicas!',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontStyle: FontStyle.italic,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatarFallback(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'V';
    return Container(
      color: AppTheme.primary.withValues(alpha: 0.15),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: AppTheme.primary,
          ),
        ),
      ),
    );
  }
}

class _PublicProfileStatsBar extends StatelessWidget {
  const _PublicProfileStatsBar({required this.stats});

  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final createdTours = (stats['createdTours'] as num?)?.toInt() ?? 0;
    final participants = (stats['participants'] as num?)?.toInt() ?? 0;
    final toursRated = (stats['toursRated'] as num?)?.toInt() ?? 0;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatTile(
            value: '$createdTours',
            label: 'Tours Creados',
            icon: Icons.map_outlined,
          ),
          Container(
            height: 32,
            width: 1,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
          ),
          _StatTile(
            value: '$participants',
            label: 'Guiados',
            icon: Icons.people_outline_rounded,
          ),
          Container(
            height: 32,
            width: 1,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
          ),
          _StatTile(
            value: '$toursRated',
            label: 'Opiniones',
            icon: Icons.star_outline_rounded,
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppTheme.primary),
            const SizedBox(width: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                fontSize: 11,
              ),
        ),
      ],
    );
  }
}

class _PublicDigitalPassportSection extends StatelessWidget {
  const _PublicDigitalPassportSection({
    required this.userName,
    required this.stats,
  });

  final String userName;
  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final createdCount = (stats['createdTours'] as num?)?.toInt() ?? 0;
    final ratedCount = (stats['toursRated'] as num?)?.toInt() ?? 0;
    final participantsCount = (stats['participants'] as num?)?.toInt() ?? 0;
    final totalStopsExplored = (createdCount * 4) + (ratedCount * 3) + 5;
    final totalKmWalked = (totalStopsExplored * 0.8).toStringAsFixed(1);

    final badges = [
      _PublicBadgeData(
        icon: Icons.map_rounded,
        title: l10n.badgeRouteCreatorTitle,
        subtitle: l10n.badgeRouteCreatorSubtitle(createdCount),
        isUnlocked: createdCount > 0,
      ),
      _PublicBadgeData(
        icon: Icons.star_rate_rounded,
        title: l10n.badgeTouristCriticTitle,
        subtitle: l10n.badgeTouristCriticSubtitle(ratedCount),
        isUnlocked: ratedCount > 0,
      ),
      _PublicBadgeData(
        icon: Icons.groups_rounded,
        title: l10n.badgeCommunityGuideTitle,
        subtitle: l10n.badgeCommunityGuideSubtitle(participantsCount),
        isUnlocked: participantsCount > 0,
      ),
      _PublicBadgeData(
        icon: Icons.verified_user_rounded,
        title: l10n.badgeVibeExplorerTitle,
        subtitle: l10n.badgeVibeExplorerSubtitle,
        isUnlocked: true,
      ),
    ];

    final unlockedCount = badges.where((b) => b.isUnlocked).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              l10n.digitalPassportTitle,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 4),
                  Text(
                    l10n.explorerLevel,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GlassPanel(
          padding: const EdgeInsets.all(20),
          radius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.flight_takeoff_rounded,
                          color: AppTheme.primary, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        'VIBETOURS PASSPORT',
                        style: TextStyle(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6),
                          fontSize: 11,
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '#VT-2026',
                    style: TextStyle(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.5),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                userName.toUpperCase(),
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 14),
              Divider(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withValues(alpha: 0.1)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _PassportStatItem(
                    icon: Icons.directions_walk_rounded,
                    value: '$totalKmWalked km',
                    label: l10n.statsTravelled,
                  ),
                  _PassportStatItem(
                    icon: Icons.place_rounded,
                    value: '$totalStopsExplored',
                    label: l10n.statsStops,
                  ),
                  _PassportStatItem(
                    icon: Icons.workspace_premium_rounded,
                    value: '$unlockedCount / ${badges.length}',
                    label: l10n.statsBadges,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text(
          l10n.achievementBadges,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (int i = 0; i < badges.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                _PublicBadgeChip(badge: badges[i]),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _PassportStatItem extends StatelessWidget {
  const _PassportStatItem({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.primary, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}

class _PublicBadgeData {
  const _PublicBadgeData({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isUnlocked,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool isUnlocked;
}

class _PublicBadgeChip extends StatelessWidget {
  const _PublicBadgeChip({required this.badge});

  final _PublicBadgeData badge;

  @override
  Widget build(BuildContext context) {
    final opacity = badge.isUnlocked ? 1.0 : 0.45;
    return Opacity(
      opacity: opacity,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: badge.isUnlocked
              ? AppTheme.primary.withValues(alpha: 0.1)
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: badge.isUnlocked
                ? AppTheme.primary.withValues(alpha: 0.3)
                : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              badge.icon,
              size: 20,
              color: badge.isUnlocked ? AppTheme.primary : Colors.grey,
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  badge.title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: badge.isUnlocked
                        ? Theme.of(context).colorScheme.onSurface
                        : Colors.grey,
                  ),
                ),
                Text(
                  badge.subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PublicCreatedToursSection extends ConsumerWidget {
  const _PublicCreatedToursSection({required this.createdTours});

  final List<Tour> createdTours;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Tours Creados (${createdTours.length})',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (createdTours.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              children: [
                Icon(Icons.explore_off_outlined, size: 28, color: Colors.grey),
                SizedBox(height: 8),
                Text(
                  'Este viajero aún no ha publicado tours públicos.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: createdTours.length,
            itemBuilder: (context, index) {
              final tour = createdTours[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      ref.read(selectedTourProvider.notifier).state = tour;
                      context.push('/tours/${tour.id}');
                    },
                    child: GlassPanel(
                      padding: const EdgeInsets.all(14),
                      radius: 20,
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: tour.coverUrl.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: tour.coverUrl,
                                    width: 60,
                                    height: 60,
                                    fit: BoxFit.cover,
                                    errorWidget: (context, url, error) =>
                                        Container(
                                      width: 60,
                                      height: 60,
                                      color: AppTheme.primary.withValues(alpha: 0.1),
                                      child: const Icon(Icons.tour_rounded,
                                          color: AppTheme.primary),
                                    ),
                                  )
                                : Container(
                                    width: 60,
                                    height: 60,
                                    color: AppTheme.primary.withValues(alpha: 0.1),
                                    child: const Icon(Icons.tour_rounded,
                                        color: AppTheme.primary),
                                  ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tour.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.star_rounded,
                                        size: 14, color: Colors.amber),
                                    const SizedBox(width: 4),
                                    Text(
                                      tour.rating.toStringAsFixed(1),
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Icon(Icons.place_outlined,
                                        size: 14,
                                        color: theme.colorScheme.onSurface
                                            .withValues(alpha: 0.5)),
                                    const SizedBox(width: 2),
                                    Expanded(
                                      child: Text(
                                        tour.city,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: theme.colorScheme.onSurface
                                              .withValues(alpha: 0.6),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}
