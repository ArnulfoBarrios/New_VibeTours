import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import 'achievements_service.dart';

enum _AchievementFilter { all, unlocked, locked }

class AchievementsScreen extends ConsumerStatefulWidget {
  const AchievementsScreen({
    super.key,
    this.customStats,
    this.customHasBio,
    this.customHasAvatar,
    this.userName,
  });

  final Map<String, dynamic>? customStats;
  final bool? customHasBio;
  final bool? customHasAvatar;
  final String? userName;

  @override
  ConsumerState<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends ConsumerState<AchievementsScreen> {
  _AchievementFilter _selectedFilter = _AchievementFilter.all;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    final user = ref.watch(authUserProvider).valueOrNull;
    final metadata = user?.userMetadata ?? {};
    final defaultBio = metadata['bio']?.toString().trim() ?? '';
    final defaultAvatar = metadata['custom_avatar_url']?.toString().trim() ??
        metadata['avatar_url']?.toString().trim() ??
        '';

    final stats = widget.customStats ?? ref.watch(userStatsProvider).valueOrNull ?? {};
    final hasBio = widget.customHasBio ?? defaultBio.isNotEmpty;
    final hasAvatar = widget.customHasAvatar ?? defaultAvatar.isNotEmpty;

    final allAchievements = AchievementsService.buildAchievements(
      l10n: l10n,
      stats: stats,
      hasCustomBio: hasBio,
      hasCustomAvatar: hasAvatar,
    );

    final unlockedList = allAchievements.where((a) => a.isUnlocked).toList();
    final lockedList = allAchievements.where((a) => !a.isUnlocked).toList();

    final filteredAchievements = switch (_selectedFilter) {
      _AchievementFilter.all => allAchievements,
      _AchievementFilter.unlocked => unlockedList,
      _AchievementFilter.locked => lockedList,
    };

    final totalCount = allAchievements.length;
    final unlockedCount = unlockedList.length;
    final overallProgress = totalCount == 0 ? 0.0 : unlockedCount / totalCount;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.pop();
            }
          },
        ),
        title: Text(
          widget.userName != null
              ? 'Logros de ${widget.userName}'
              : l10n.achievementBadges,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _AchievementsSummaryHeader(
                  unlockedCount: unlockedCount,
                  totalCount: totalCount,
                  overallProgress: overallProgress,
                ),
                const SizedBox(height: 20),
                _FilterChipsRow(
                  selectedFilter: _selectedFilter,
                  allCount: totalCount,
                  unlockedCount: unlockedCount,
                  lockedCount: lockedList.length,
                  onSelected: (filter) {
                    setState(() {
                      _selectedFilter = filter;
                    });
                  },
                ),
                const SizedBox(height: 20),
                if (filteredAchievements.isEmpty)
                  _EmptyFilterState(filter: _selectedFilter)
                else
                  ..._buildCategorizedList(context, filteredAchievements),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCategorizedList(
    BuildContext context,
    List<AchievementItem> items,
  ) {
    final theme = Theme.of(context);
    final grouped = <AchievementCategory, List<AchievementItem>>{};

    for (final item in items) {
      grouped.putIfAbsent(item.category, () => []).add(item);
    }

    final widgets = <Widget>[];
    for (final entry in grouped.entries) {
      final categoryItems = entry.value;
      if (categoryItems.isEmpty) continue;

      final unlockedInCategory = categoryItems.where((i) => i.isUnlocked).length;
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 10, top: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                categoryItems.first.categoryLabel,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                '$unlockedInCategory / ${categoryItems.length}',
                style: TextStyle(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      );

      for (final achievement in categoryItems) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _AchievementDetailCard(achievement: achievement),
          ),
        );
      }
      widgets.add(const SizedBox(height: 8));
    }

    return widgets;
  }
}

class _AchievementsSummaryHeader extends StatelessWidget {
  const _AchievementsSummaryHeader({
    required this.unlockedCount,
    required this.totalCount,
    required this.overallProgress,
  });

  final int unlockedCount;
  final int totalCount;
  final double overallProgress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final percentage = (overallProgress * 100).round();

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: AppTheme.primary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$unlockedCount de $totalCount logros desbloqueados',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      unlockedCount == totalCount
                          ? '¡Felicidades! Has completado todos los logros.'
                          : 'Sigue creando rutas, calificando y explorando para completar tu pasaporte.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progreso total',
                style: TextStyle(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '$percentage%',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: overallProgress,
              minHeight: 8,
              backgroundColor: theme.colorScheme.onSurface.withValues(alpha: 0.08),
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChipsRow extends StatelessWidget {
  const _FilterChipsRow({
    required this.selectedFilter,
    required this.allCount,
    required this.unlockedCount,
    required this.lockedCount,
    required this.onSelected,
  });

  final _AchievementFilter selectedFilter;
  final int allCount;
  final int unlockedCount;
  final int lockedCount;
  final ValueChanged<_AchievementFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterPill(
            label: 'Todos ($allCount)',
            isSelected: selectedFilter == _AchievementFilter.all,
            onTap: () => onSelected(_AchievementFilter.all),
          ),
          const SizedBox(width: 8),
          _FilterPill(
            label: 'Desbloqueados ($unlockedCount)',
            isSelected: selectedFilter == _AchievementFilter.unlocked,
            onTap: () => onSelected(_AchievementFilter.unlocked),
          ),
          const SizedBox(width: 8),
          _FilterPill(
            label: 'Por desbloquear ($lockedCount)',
            isSelected: selectedFilter == _AchievementFilter.locked,
            onTap: () => onSelected(_AchievementFilter.locked),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primary
              : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppTheme.primary
                : theme.colorScheme.onSurface.withValues(alpha: 0.08),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected
                ? Colors.white
                : theme.colorScheme.onSurface.withValues(alpha: 0.75),
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _AchievementDetailCard extends StatelessWidget {
  const _AchievementDetailCard({required this.achievement});

  final AchievementItem achievement;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUnlocked = achievement.isUnlocked;
    final accent = achievement.accentColor;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isUnlocked
            ? accent.withValues(alpha: 0.07)
            : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isUnlocked
              ? accent.withValues(alpha: 0.3)
              : theme.colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isUnlocked
                      ? accent.withValues(alpha: 0.16)
                      : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  achievement.icon,
                  color: isUnlocked
                      ? accent
                      : theme.colorScheme.onSurface.withValues(alpha: 0.38),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            achievement.title,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: isUnlocked
                                  ? theme.colorScheme.onSurface
                                  : theme.colorScheme.onSurface.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isUnlocked
                                ? accent.withValues(alpha: 0.14)
                                : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isUnlocked
                                    ? Icons.check_circle_rounded
                                    : Icons.lock_outline_rounded,
                                size: 12,
                                color: isUnlocked
                                    ? accent
                                    : theme.colorScheme.onSurface.withValues(alpha: 0.45),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isUnlocked ? 'Desbloqueado' : 'Bloqueado',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isUnlocked
                                      ? accent
                                      : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      achievement.description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                achievement.subtitle,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isUnlocked
                      ? accent
                      : theme.colorScheme.onSurface.withValues(alpha: 0.55),
                ),
              ),
              Text(
                '${(achievement.progress * 100).round()}%',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isUnlocked
                      ? accent
                      : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LinearProgressIndicator(
              value: achievement.progress,
              minHeight: 5,
              backgroundColor: theme.colorScheme.onSurface.withValues(alpha: 0.08),
              valueColor: AlwaysStoppedAnimation<Color>(
                isUnlocked ? accent : accent.withValues(alpha: 0.55),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyFilterState extends StatelessWidget {
  const _EmptyFilterState({required this.filter});

  final _AchievementFilter filter;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Icon(
            filter == _AchievementFilter.unlocked
                ? Icons.emoji_events_outlined
                : Icons.workspace_premium_rounded,
            size: 36,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 10),
          Text(
            filter == _AchievementFilter.unlocked
                ? 'Aún no tienes logros desbloqueados en esta vista.'
                : '¡Ya has desbloqueado todos los logros disponibles!',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}
