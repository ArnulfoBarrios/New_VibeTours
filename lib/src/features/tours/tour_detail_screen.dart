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
                      else
                        for (final stop in tour.stops) _StopTile(stop: stop),
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
            child: CachedNetworkImage(
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
