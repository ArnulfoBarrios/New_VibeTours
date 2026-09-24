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
import 'achievements_screen.dart';
import 'achievements_service.dart';

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
                      hasCustomBio: bio.trim().isNotEmpty,
                      hasCustomAvatar: avatarUrl.trim().isNotEmpty,
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
    this.hasCustomBio = false,
    this.hasCustomAvatar = false,
  });

  final String userName;
  final Map<String, dynamic> stats;
  final bool hasCustomBio;
  final bool hasCustomAvatar;

  void _openAchievementsScreen(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AchievementsScreen(
          customStats: stats,
          customHasBio: hasCustomBio,
          customHasAvatar: hasCustomAvatar,
          userName: userName.split(' ').first,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final createdCount = (stats['createdTours'] as num?)?.toInt() ?? 0;
    final ratedCount = (stats['toursRated'] as num?)?.toInt() ?? 0;
    final totalStopsExplored = (createdCount * 4) + (ratedCount * 3) + 5;
    final totalKmWalked = (totalStopsExplored * 0.8).toStringAsFixed(1);

    final badges = AchievementsService.buildAchievements(
      l10n: l10n,
      stats: stats,
      hasCustomBio: hasCustomBio,
      hasCustomAvatar: hasCustomAvatar,
    );

    final unlockedCount = badges.where((b) => b.isUnlocked).length;
    final progressValue = badges.isEmpty ? 0.0 : unlockedCount / badges.length;

    final previewBadges = [...badges]..sort((a, b) {
        if (a.isUnlocked == b.isUnlocked) return 0;
        return a.isUnlocked ? -1 : 1;
      });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.digitalPassportTitle,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        GlassPanel(
          padding: const EdgeInsets.all(22),
          radius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.flight_takeoff_rounded,
                          color: AppTheme.primary,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'VIBETOURS PASSPORT',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                          fontSize: 11,
                          letterSpacing: 1.6,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '#VT-2026',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                'TITULAR DEL PASAPORTE',
                style: TextStyle(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                userName.toUpperCase(),
                style: TextStyle(
                  color: theme.colorScheme.onSurface,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 18),
              Divider(
                height: 1,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.08),
              ),
              const SizedBox(height: 18),
              IntrinsicHeight(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Expanded(
                      child: _PassportStatItem(
                        icon: Icons.directions_walk_rounded,
                        accentColor: AppTheme.primary,
                        value: '$totalKmWalked km',
                        label: l10n.statsTravelled,
                      ),
                    ),
                    VerticalDivider(
                      width: 1,
                      thickness: 1,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.08),
                    ),
                    Expanded(
                      child: _PassportStatItem(
                        icon: Icons.place_rounded,
                        accentColor: AppTheme.violet,
                        value: '$totalStopsExplored',
                        label: l10n.statsStops,
                      ),
                    ),
                    VerticalDivider(
                      width: 1,
                      thickness: 1,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.08),
                    ),
                    Expanded(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => _openAchievementsScreen(context),
                        child: _PassportStatItem(
                          icon: Icons.workspace_premium_rounded,
                          accentColor: Colors.amber.shade700,
                          value: '$unlockedCount / ${badges.length}',
                          label: l10n.statsBadges,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _openAchievementsScreen(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Progreso de medallas ($unlockedCount/${badges.length})',
                            style: TextStyle(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                '${(progressValue * 100).round()}%',
                                style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.chevron_right_rounded,
                                size: 16,
                                color: AppTheme.primary,
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: progressValue,
                          minHeight: 6,
                          backgroundColor: theme.colorScheme.onSurface.withValues(alpha: 0.08),
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              l10n.achievementBadges,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            TextButton.icon(
              onPressed: () => _openAchievementsScreen(context),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              icon: const Icon(Icons.grid_view_rounded, size: 15, color: AppTheme.primary),
              label: Text(
                'Ver los ${badges.length} logros',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (int i = 0; i < previewBadges.take(6).length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                _PublicBadgeChip(
                  badge: previewBadges[i],
                  onTap: () => _openAchievementsScreen(context),
                ),
              ],
              const SizedBox(width: 10),
              InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => _openAchievementsScreen(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.arrow_forward_rounded, size: 18, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Ver todos (${badges.length})',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
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
    required this.accentColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color accentColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: accentColor.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: accentColor, size: 18),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w900,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}

class _PublicBadgeChip extends StatelessWidget {
  const _PublicBadgeChip({
    required this.badge,
    required this.onTap,
  });

  final AchievementItem badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUnlocked = badge.isUnlocked;
    final activeColor = badge.accentColor;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isUnlocked
              ? activeColor.withValues(alpha: 0.08)
              : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isUnlocked
                ? activeColor.withValues(alpha: 0.28)
                : theme.colorScheme.onSurface.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isUnlocked
                    ? activeColor.withValues(alpha: 0.15)
                    : theme.colorScheme.onSurface.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                badge.icon,
                size: 18,
                color: isUnlocked
                    ? activeColor
                    : theme.colorScheme.onSurface.withValues(alpha: 0.4),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      badge.title,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isUnlocked
                            ? theme.colorScheme.onSurface
                            : theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      isUnlocked ? Icons.check_circle_rounded : Icons.lock_outline_rounded,
                      size: 13,
                      color: isUnlocked
                          ? activeColor
                          : theme.colorScheme.onSurface.withValues(alpha: 0.35),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  badge.subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isUnlocked
                        ? activeColor
                        : theme.colorScheme.onSurface.withValues(alpha: 0.45),
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
