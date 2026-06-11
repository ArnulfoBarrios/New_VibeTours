import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toursAsync = ref.watch(toursProvider);
    final eventsAsync = ref.watch(localEventsProvider);
    final user = ref.watch(authUserProvider).valueOrNull;
    final name =
        user?.userMetadata?['full_name']?.toString().split(' ').first ??
        'Explorer';

    return toursAsync.when(
      data: (tours) {
        if (tours.isEmpty) {
          return _EmptyCatalogHome(name: name, eventsAsync: eventsAsync);
        }
        final featured = tours.firstWhere(
          (tour) => tour.city.toLowerCase().contains('tok'),
          orElse: () => tours.first,
        );
        final recommendations = tours
            .where((tour) => tour.id != featured.id)
            .take(5)
            .toList();

        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _HomeHeader(onSearch: () => context.go('/tours')),
                    const SizedBox(height: 34),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Good morning, $name',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _displayLocation(featured),
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(fontSize: 29),
                              ),
                            ],
                          ),
                        ),
                        const _WeatherPill(),
                      ],
                    ),
                    const SizedBox(height: 28),
                    _HeroTourCard(tour: featured),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Tours for you',
                action: TextButton(
                  onPressed: () => context.go('/tours'),
                  child: const Text('View All'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _RecommendationStack(tours: recommendations),
            ),
            const SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Nearby Places',
                action: _WithinDistance(),
              ),
            ),
            const SliverToBoxAdapter(child: _NearbyPlaces()),
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'Upcoming Events'),
            ),
            eventsAsync.when(
              data: (events) {
                if (events.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: _InlineEmptyState(
                      icon: Icons.location_off_rounded,
                      title: 'Sin eventos cercanos',
                      body: 'Activa tu ubicacion para ver agenda de tu zona.',
                    ),
                  );
                }
                final visible = events.take(3).toList();
                return SliverList.separated(
                  itemCount: visible.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 14),
                  itemBuilder: (context, index) => Padding(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      0,
                      20,
                      index == visible.length - 1 ? 124 : 0,
                    ),
                    child: _EventRow(event: visible[index]),
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: SkeletonBox(height: 104),
                ),
              ),
              error: (error, stackTrace) => SliverToBoxAdapter(
                child: _InlineEmptyState(
                  icon: Icons.event_busy_rounded,
                  title: 'Eventos no disponibles',
                  body: error.toString(),
                ),
              ),
            ),
          ],
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            SkeletonBox(height: 48),
            SizedBox(height: 26),
            SkeletonBox(height: 392),
            SizedBox(height: 18),
            SkeletonBox(height: 220),
          ],
        ),
      ),
      error: (error, stackTrace) => EmptyState(
        icon: Icons.cloud_off_rounded,
        title: 'No se pudieron cargar tours',
        body: error.toString(),
      ),
    );
  }

  String _displayLocation(Tour tour) {
    if (tour.city.toLowerCase() == 'tokio') return 'Tokyo, Japan';
    return '${tour.city}, ${tour.country}';
  }
}

class _EmptyCatalogHome extends StatelessWidget {
  const _EmptyCatalogHome({required this.name, required this.eventsAsync});

  final String name;
  final AsyncValue<List<LocalEvent>> eventsAsync;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HomeHeader(onSearch: () => context.go('/tours')),
                const SizedBox(height: 34),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Good morning, $name',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'VibeTours',
                            style: Theme.of(
                              context,
                            ).textTheme.headlineMedium?.copyWith(fontSize: 29),
                          ),
                        ],
                      ),
                    ),
                    const _WeatherPill(),
                  ],
                ),
                const SizedBox(height: 28),
                const EmptyState(
                  icon: Icons.map_outlined,
                  title: 'No hay tours disponibles',
                  body:
                      'El catalogo fue limpiado. Crea un tour manual o con IA desde My Tours.',
                ),
              ],
            ),
          ),
        ),
        const SliverToBoxAdapter(
          child: SectionHeader(
            title: 'Nearby Places',
            action: _WithinDistance(),
          ),
        ),
        const SliverToBoxAdapter(child: _NearbyPlaces()),
        const SliverToBoxAdapter(
          child: SectionHeader(title: 'Upcoming Events'),
        ),
        eventsAsync.when(
          data: (events) {
            if (events.isEmpty) {
              return const SliverToBoxAdapter(
                child: _InlineEmptyState(
                  icon: Icons.location_off_rounded,
                  title: 'Sin eventos cercanos',
                  body: 'Activa tu ubicacion para ver agenda de tu zona.',
                ),
              );
            }
            final visible = events.take(3).toList();
            return SliverList.separated(
              itemCount: visible.length,
              separatorBuilder: (context, index) => const SizedBox(height: 14),
              itemBuilder: (context, index) => Padding(
                padding: EdgeInsets.fromLTRB(
                  20,
                  0,
                  20,
                  index == visible.length - 1 ? 124 : 0,
                ),
                child: _EventRow(event: visible[index]),
              ),
            );
          },
          loading: () => const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: SkeletonBox(height: 104),
            ),
          ),
          error: (error, stackTrace) => SliverToBoxAdapter(
            child: _InlineEmptyState(
              icon: Icons.event_busy_rounded,
              title: 'Eventos no disponibles',
              body: error.toString(),
            ),
          ),
        ),
      ],
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.onSearch});

  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.72),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.12),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(Icons.public_rounded, color: AppTheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            'VibeTours',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppTheme.primaryDeep,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        IconButton(
          tooltip: 'Search',
          onPressed: onSearch,
          icon: const Icon(Icons.search_rounded, color: AppTheme.primaryDeep),
        ),
      ],
    );
  }
}

class _WeatherPill extends ConsumerWidget {
  const _WeatherPill();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherAsync = ref.watch(weatherProvider);
    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      radius: 14,
      child: weatherAsync.when(
        data: (weather) {
          if (weather == null) {
            return const _WeatherContent(
              icon: Icons.location_searching_rounded,
              title: '-- C',
              subtitle: 'Ubicacion',
            );
          }
          return _WeatherContent(
            icon: _weatherIcon(weather),
            title: '${weather.temperatureC} C',
            subtitle: weather.condition,
          );
        },
        loading: () => const _WeatherContent(
          icon: Icons.cloud_sync_rounded,
          title: '-- C',
          subtitle: 'Clima',
        ),
        error: (error, stackTrace) => const _WeatherContent(
          icon: Icons.cloud_off_rounded,
          title: '-- C',
          subtitle: 'Clima',
        ),
      ),
    );
  }

  IconData _weatherIcon(WeatherSnapshot weather) {
    if ([61, 63, 65, 80, 81, 82].contains(weather.code)) {
      return Icons.water_drop_rounded;
    }
    if ([95, 96, 99].contains(weather.code)) {
      return Icons.thunderstorm_rounded;
    }
    if ([45, 48].contains(weather.code)) return Icons.foggy;
    if ([1, 2, 3].contains(weather.code)) {
      return Icons.cloud_queue_rounded;
    }
    return weather.isDay ? Icons.wb_sunny_outlined : Icons.nightlight_round;
  }
}

class _WeatherContent extends StatelessWidget {
  const _WeatherContent({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppTheme.primary),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ],
    );
  }
}

class _HeroTourCard extends StatelessWidget {
  const _HeroTourCard({required this.tour});

  final Tour tour;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 430,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            bottom: 28,
            child: _ImageCard(
              tour: tour,
              borderRadius: 30,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(32, 0, 32, 52),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: const [
                        _HeroChip(label: "EDITOR'S PICK", filled: true),
                        _HeroChip(label: '98% Vibe Match'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      tour.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(color: Colors.white, fontSize: 30),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      tour.description,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 0,
            child: GlassPanel(
              padding: const EdgeInsets.fromLTRB(20, 10, 10, 10),
              radius: 999,
              onTap: () => context.go('/ai'),
              child: Row(
                children: [
                  Icon(
                    Icons.travel_explore_rounded,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      'Where to next?',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                  FilledButton(
                    onPressed: () => context.go('/ai'),
                    style: FilledButton.styleFrom(
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(14),
                      backgroundColor: AppTheme.primary,
                    ),
                    child: const Icon(Icons.arrow_forward_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 320.ms).slideY(begin: 0.035, end: 0);
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.label, this.filled = false});

  final String label;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: filled ? AppTheme.primary : Colors.white.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        child: Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(color: Colors.white, fontSize: 11),
        ),
      ),
    );
  }
}

class _RecommendationStack extends StatelessWidget {
  const _RecommendationStack({required this.tours});

  final List<Tour> tours;

  @override
  Widget build(BuildContext context) {
    if (tours.isEmpty) return const SizedBox.shrink();
    final first = tours[0];
    final second = tours.length > 1 ? tours[1] : first;
    final third = tours.length > 2 ? tours[2] : first;
    final fourth = tours.length > 3 ? tours[3] : second;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _SmallTourCard(tour: first, height: 202, large: true),
          const SizedBox(height: 16),
          _SmallTourCard(tour: second, height: 92),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _SmallTourCard(tour: third, height: 104)),
              const SizedBox(width: 16),
              Expanded(child: _SmallTourCard(tour: fourth, height: 104)),
            ],
          ),
        ],
      ),
    );
  }
}

class _SmallTourCard extends StatelessWidget {
  const _SmallTourCard({
    required this.tour,
    required this.height,
    this.large = false,
  });

  final Tour tour;
  final double height;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: _ImageCard(
        tour: tour,
        borderRadius: 22,
        onTap: () => context.push('/tours/${tour.id}'),
        child: Padding(
          padding: EdgeInsets.all(large ? 24 : 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (large)
                Text(
                  tourTypeLabel(tour.type).toUpperCase(),
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Colors.white70,
                    fontSize: 11,
                  ),
                ),
              Text(
                tour.title,
                maxLines: large ? 2 : 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontSize: large ? 23 : 18,
                ),
              ),
              if (large) ...[
                const SizedBox(height: 6),
                Text(
                  '${tour.durationHours.toStringAsFixed(1)}h - ${(tour.rating * 20).round()}% Match',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.78),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageCard extends StatelessWidget {
  const _ImageCard({
    required this.tour,
    required this.child,
    required this.borderRadius,
    this.onTap,
  });

  final Tour tour;
  final Widget child;
  final double borderRadius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Stack(
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
                  Colors.black.withValues(alpha: 0.02),
                  Colors.black.withValues(alpha: 0.18),
                  Colors.black.withValues(alpha: 0.72),
                ],
              ),
            ),
          ),
          child,
          if (onTap != null)
            Positioned.fill(
              child: Material(
                color: Colors.transparent,
                child: InkWell(onTap: onTap),
              ),
            ),
        ],
      ),
    );
  }
}

class _WithinDistance extends StatelessWidget {
  const _WithinDistance();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.near_me_outlined,
          size: 15,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 4),
        Text('Within 5km', style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class _NearbyPlaces extends ConsumerWidget {
  const _NearbyPlaces();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placesAsync = ref.watch(nearbyPlacesProvider);
    return placesAsync.when(
      data: (places) {
        if (places.isEmpty) {
          return const _InlineEmptyState(
            icon: Icons.location_off_rounded,
            title: 'Sin lugares cercanos',
            body: 'Activa tu ubicacion para descubrir lugares a tu alrededor.',
          );
        }
        return SizedBox(
          height: 196,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: places.take(8).length,
            separatorBuilder: (context, index) => const SizedBox(width: 22),
            itemBuilder: (context, index) {
              final place = places[index];
              return InkWell(
                borderRadius: BorderRadius.circular(24),
                onTap: () {
                  ref.read(selectedNearbyPlaceProvider.notifier).state = place;
                  context.push('/place-route');
                },
                child: SizedBox(
                  width: 280,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(22),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              TravelImageFallback(
                                title: place.name,
                                icon: Icons.place_rounded,
                              ),
                              Positioned(
                                right: 12,
                                top: 12,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.82),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 7,
                                    ),
                                    child: Text(
                                      _distance(place.distanceMeters),
                                      style: Theme.of(
                                        context,
                                      ).textTheme.labelLarge,
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 12,
                                bottom: 12,
                                child: CircleAvatar(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  child: const Icon(Icons.route_rounded),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Text(
                          place.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Text(
                          place.type,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20),
        child: SkeletonBox(height: 160),
      ),
      error: (error, stackTrace) => _InlineEmptyState(
        icon: Icons.near_me_disabled_rounded,
        title: 'Lugares no disponibles',
        body: error.toString(),
      ),
    );
  }

  String _distance(int meters) {
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(1)} km';
    return '$meters m';
  }
}

class _EventRow extends StatelessWidget {
  const _EventRow({required this.event});

  final LocalEvent event;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.all(20),
      radius: 0,
      child: Row(
        children: [
          _DateBadge(date: event.startsAt),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  '${event.category} - ${_time(event.startsAt)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right_rounded, color: AppTheme.primary),
        ],
      ),
    );
  }

  static String _time(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _DateBadge extends StatelessWidget {
  const _DateBadge({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: AppTheme.indigo.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.indigo.withValues(alpha: 0.20)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            months[date.month - 1],
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: AppTheme.indigo,
              fontSize: 11,
            ),
          ),
          Text(
            '${date.day}',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(color: AppTheme.indigo),
          ),
        ],
      ),
    );
  }
}

class _InlineEmptyState extends StatelessWidget {
  const _InlineEmptyState({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: GlassPanel(
        radius: 22,
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 3),
                  Text(body, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
