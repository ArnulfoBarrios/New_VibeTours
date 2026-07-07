import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class TourDetailScreen extends ConsumerWidget {
  const TourDetailScreen({super.key, required this.tourId});

  final String tourId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final toursAsync = ref.watch(toursProvider);
    final mapStyle = ref.watch(mapStyleProvider);
    final localTours = ref.watch(userToursProvider).valueOrNull?.manualTours;
    return PremiumScaffold(
      safeBottom: true,
      child: toursAsync.when(
        data: (tours) {
          final selected = ref.watch(selectedTourProvider);
          final availableTours = [...?localTours, ...tours];
          if (availableTours.isEmpty) {
            return const EmptyState(
              icon: Icons.map_outlined,
              title: 'Tour no disponible',
              body: 'No hay tours disponibles en el catalogo.',
            );
          }
          final tour = selected?.id == tourId
              ? selected!
              : availableTours.firstWhere(
                  (item) => item.id == tourId,
                  orElse: () => availableTours.first,
                );
          final favorites = ref.watch(favoriteTourIdsProvider);
          final isFavorite = favorites.contains(tour.id);
          final commentsAsync = ref.watch(tourCommentsProvider(tour.id));
          final comments = commentsAsync.valueOrNull ?? [];
          final displayRating = comments.isNotEmpty
              ? (comments.map((c) => c.rating).reduce((a, b) => a + b) / comments.length).toStringAsFixed(1)
              : 'S/C';
          final displayCommentsCount = comments.isNotEmpty ? comments.length : tour.reviewCount;
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 330,
                pinned: true,
                backgroundColor: Colors.transparent,
                leading: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: tour.coverUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const SkeletonBox(),
                        errorWidget: (context, url, error) =>
                            TravelImageFallback(title: tour.title),
                      ),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.10),
                              Colors.black.withValues(alpha: 0.76),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        right: 20,
                        bottom: 24,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tour.title,
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(color: Colors.white),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${tour.city}, ${tour.country}',
                              style: Theme.of(context).textTheme.bodyLarge
                                  ?.copyWith(color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (tour.id.startsWith('ai-')) ...[
                        _buildAiDraftBanner(context, ref, tour),
                        const SizedBox(height: 16),
                      ],
                      Row(
                        children: [
                          _Metric(
                            icon: Icons.star_rounded,
                            value: displayRating,
                            label: l10n.rating,
                          ),
                          _Metric(
                            icon: Icons.route_rounded,
                            value: '${tour.distanceKm.toStringAsFixed(1)} km',
                            label: l10n.distance,
                          ),
                          _Metric(
                            icon: Icons.schedule_rounded,
                            value: formatDuration(tour.durationHours),
                            label: l10n.duration,
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      GlassPanel(
                        child: Text(
                          tour.description,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ),
                      const SizedBox(height: 18),
                      GlassPanel(
                        padding: const EdgeInsets.all(10),
                        radius: 28,
                        child: OpenFreeRouteMap.fromStops(
                          stops: tour.stops,
                          styleUrl: mapStyle,
                          height: 230,
                          fitPadding: const EdgeInsets.all(34),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Expanded(
                            child: LiquidButton(
                              label: l10n.startTour,
                              icon: Icons.navigation_rounded,
                              onPressed: () {
                                ref.read(selectedTourProvider.notifier).state =
                                    tour;
                                context.push('/live/${tour.id}');
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          IconButton.filledTonal(
                            tooltip: l10n.save,
                            onPressed: () {
                              final next = <String>{...favorites};
                              if (isFavorite) {
                                next.remove(tour.id);
                              } else {
                                next.add(tour.id);
                              }
                              ref.read(favoriteTourIdsProvider.notifier).state =
                                  next;
                            },
                            icon: Icon(
                              isFavorite
                                  ? Icons.bookmark_rounded
                                  : Icons.bookmark_border_rounded,
                            ),
                          ),
                          IconButton.filledTonal(
                            tooltip: l10n.share,
                            onPressed: () => SharePlus.instance.share(
                              ShareParams(
                                text:
                                    'VIBETOURS: ${tour.title} en ${tour.city}',
                              ),
                            ),
                            icon: const Icon(Icons.ios_share_rounded),
                          ),
                        ],
                      ),
                      SectionHeader(title: l10n.gallery),
                      SizedBox(
                        height: 96,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: tour.gallery.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(width: 10),
                          itemBuilder: (context, index) => ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: CachedNetworkImage(
                              imageUrl: tour.gallery[index],
                              width: 132,
                              fit: BoxFit.cover,
                              placeholder: (context, url) =>
                                  const SkeletonBox(width: 132),
                              errorWidget: (context, url, error) =>
                                  TravelImageFallback(title: tour.title),
                            ),
                          ),
                        ),
                      ),
                      SectionHeader(title: l10n.stops),
                      if (tour.stops.isEmpty)
                        const EmptyState(
                          icon: Icons.place_outlined,
                          title: 'Sin paradas',
                          body: 'Este tour aun no tiene paradas cargadas.',
                        )
                      else ...[
                        ...() {
                          final Map<int, List<TourStop>> stopsByDay = {};
                          for (final stop in tour.stops) {
                            stopsByDay.putIfAbsent(stop.day, () => []).add(stop);
                          }
                          
                          final sortedDays = stopsByDay.keys.toList()..sort();
                          final showDays = sortedDays.length > 1 || tour.durationHours >= 24;
                          
                          return [
                            for (final day in sortedDays) ...[
                              if (showDays) ...[
                                Padding(
                                  padding: const EdgeInsets.only(top: 14, bottom: 8),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                                        ),
                                        child: Text(
                                          'Día $day',
                                          style: const TextStyle(
                                            color: AppTheme.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Divider(
                                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15),
                                          thickness: 1,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              for (final stop in stopsByDay[day]!)
                                _StopTile(stop: stop),
                            ],
                          ];
                        }(),
                      ],
                      const SizedBox(height: 24),
                      GlassPanel(
                        child: Row(
                          children: [
                            const Icon(
                              Icons.favorite_rounded,
                              color: AppTheme.violet,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                '${tour.likes} ${l10n.love} - $displayCommentsCount comentarios',
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      SectionHeader(title: 'Opiniones de Viajeros'),
                      const SizedBox(height: 8),
                      ref.watch(tourCommentsProvider(tour.id)).when(
                            data: (comments) {
                              if (comments.isEmpty) {
                                return Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Column(
                                    children: [
                                      Icon(Icons.rate_review_outlined, size: 28, color: Colors.grey),
                                      SizedBox(height: 8),
                                      Text(
                                        'Aun no hay opiniones sobre este tour.',
                                        style: TextStyle(color: Colors.grey, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                );
                              }
                              return ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: comments.length,
                                itemBuilder: (context, index) {
                                  return _ReviewTile(comment: comments[index]);
                                },
                              );
                            },
                            loading: () => const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16.0),
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            error: (err, _) => Text(
                              'Error al cargar opiniones: $err',
                              style: const TextStyle(color: Colors.redAccent),
                            ),
                          ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          icon: Icons.error_outline_rounded,
          title: 'Tour no disponible',
          body: error.toString(),
        ),
      ),
    );
  }

  Widget _buildAiDraftBanner(BuildContext context, WidgetRef ref, Tour tour) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppTheme.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Borrador temporal de IA',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Este tour fue generado dinámicamente y aún no está guardado. Elige cómo deseas conservarlo:',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    try {
                      final personalTour = _copyTour(tour, isPublished: false);
                      final saved = await ref.read(userToursProvider.notifier).saveTour(personalTour);
                      ref.read(selectedTourProvider.notifier).state = saved;
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Guardado en tus tours personales exitosamente.'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Error al guardar: $e'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.lock_outline_rounded),
                  label: const Text('Guardar Personal'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                    foregroundColor: Theme.of(context).colorScheme.onSurfaceVariant,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    try {
                      final publicTour = _copyTour(tour, isPublished: true);
                      final saved = await ref.read(userToursProvider.notifier).saveTour(publicTour);
                      ref.read(selectedTourProvider.notifier).state = saved;
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Enviado a revisión para el catálogo público.'),
                            backgroundColor: AppTheme.primary,
                          ),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Error al publicar: $e'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.public_rounded),
                  label: const Text('Publicar Catálogo'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Tour _copyTour(Tour tour, {required bool isPublished}) {
    return Tour(
      id: tour.id,
      title: tour.title,
      country: tour.country,
      city: tour.city,
      type: tour.type,
      description: tour.description,
      coverUrl: tour.coverUrl,
      gallery: tour.gallery,
      durationHours: tour.durationHours,
      distanceKm: tour.distanceKm,
      rating: tour.rating,
      reviewCount: tour.reviewCount,
      likes: tour.likes,
      difficulty: tour.difficulty,
      language: tour.language,
      tags: tour.tags,
      stops: tour.stops,
      isPublished: isPublished,
      isAiGenerated: tour.isAiGenerated,
      shortSummary: tour.shortSummary,
      subcategories: tour.subcategories,
      featuredExperience: tour.featuredExperience,
      placeHistory: tour.placeHistory,
      culturalContext: tour.culturalContext,
      availableLanguages: tour.availableLanguages,
      recommendedAudience: tour.recommendedAudience,
      bestSeason: tour.bestSeason,
      recommendedSchedule: tour.recommendedSchedule,
      meetingPoint: tour.meetingPoint,
      meetingPointInfo: tour.meetingPointInfo,
      includes: tour.includes,
      excludes: tour.excludes,
      recommendations: tour.recommendations,
      whatToBring: tour.whatToBring,
      tourRules: tour.tourRules,
      keywords: tour.keywords,
      mainCategory: tour.mainCategory,
      budget: tour.budget,
      additionalInfo: tour.additionalInfo,
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GlassPanel(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.all(12),
        radius: 20,
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primary),
            const SizedBox(height: 6),
            Text(value, style: Theme.of(context).textTheme.titleMedium),
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _StopTile extends StatelessWidget {
  const _StopTile({required this.stop});

  final TourStop stop;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      radius: 22,
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: stop.imageUrl,
                  width: 76,
                  height: 76,
                  fit: BoxFit.cover,
                  placeholder: (context, url) =>
                      const SkeletonBox(width: 76, height: 76),
                  errorWidget: (context, url, error) => TravelImageFallback(
                    title: stop.name,
                    icon: Icons.place_rounded,
                  ),
                ),
                if (stop.isFallbackImage)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      color: Colors.black54,
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      alignment: Alignment.center,
                      child: const Text(
                        'Demo',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(stop.name, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${stop.suggestedMinutes} min - ${stop.activities.isNotEmpty ? stop.activities.first : 'Explorar'}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.comment});
  final TourComment comment;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: comment.userAvatarUrl.startsWith('data:image')
                    ? Image.memory(
                        base64Decode(comment.userAvatarUrl.split(',').last),
                        width: 38,
                        height: 38,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const CircleAvatar(radius: 19, child: Icon(Icons.person_outline_rounded)),
                      )
                    : CachedNetworkImage(
                        imageUrl: comment.userAvatarUrl,
                        width: 38,
                        height: 38,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const SkeletonBox(width: 38, height: 38),
                        errorWidget: (context, url, error) => CircleAvatar(
                          radius: 19,
                          backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                          child: Text(
                            comment.userName.isNotEmpty ? comment.userName[0].toUpperCase() : 'U',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                          ),
                        ),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment.userName,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          Icons.star_rounded,
                          size: 14,
                          color: index < comment.rating ? Colors.amber : Colors.grey.shade300,
                        );
                      }),
                    ),
                  ],
                ),
              ),
              Text(
                _formatDate(comment.createdAt),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.45),
                    ),
              ),
            ],
          ),
          if (comment.body.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              comment.body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.35,
                  ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
