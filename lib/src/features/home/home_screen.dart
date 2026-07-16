import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _requestNotifications();
    });
  }

  Future<void> _requestNotifications() async {
    try {
      await FirebaseMessaging.instance.requestPermission();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final toursAsync = ref.watch(recommendedToursProvider);
    final user = ref.watch(authUserProvider).valueOrNull;
    final weatherAsync = ref.watch(weatherProvider);
    final placesAsync = ref.watch(nearbyPlacesProvider);
    final eventsAsync = ref.watch(localEventsProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: toursAsync.when(
        data: (tours) {
          if (tours.isEmpty) {
            return Center(
              child: Text(l10n.noToursAvailable, style: const TextStyle(fontWeight: FontWeight.w700)),
            );
          }
          final heroTour = tours.first;
          final restTours = tours.skip(1).toList();
          final metadata = user?.userMetadata;
          final defaultName = Localizations.localeOf(context).languageCode == 'es' ? 'viajero' : 'traveler';
          final name = metadata != null ? (metadata['custom_full_name'] ?? metadata['full_name'] ?? metadata['name'] ?? defaultName) : defaultName;
          final firstName = name.toString().split(' ').first;
          
          // Capitalizar la primera letra si es 'viajero' o 'traveler'
          final finalName = (firstName == 'viajero' || firstName == 'traveler') 
              ? '${firstName[0].toUpperCase()}${firstName.substring(1)}'
              : firstName;

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            cacheExtent: 1500,
            slivers: [
              SliverToBoxAdapter(
                child: _HeaderSection(
                  userName: finalName,
                  weatherAsync: weatherAsync,
                ),
              ),
              SliverToBoxAdapter(
                child: _HeroTourSection(tour: heroTour),
              ),
              SliverToBoxAdapter(
                child: _ToursForYouSection(tours: restTours),
              ),
              SliverToBoxAdapter(
                child: _NearbyPlacesSection(placesAsync: placesAsync),
              ),
              SliverToBoxAdapter(
                child: _UpcomingEventsSection(eventsAsync: eventsAsync),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const EmptyState(
              icon: Icons.wifi_off_rounded,
              title: 'Sin conexión',
              body: '¡Vaya! Parece que no podemos conectar con los servidores ahora mismo. Verifica tu conexión a internet y vuelve a intentarlo.',
            ),
      ),
    );
  }
}

class _HeaderSection extends StatelessWidget {
  final String userName;
  final AsyncValue<WeatherSnapshot?> weatherAsync;

  const _HeaderSection({required this.userName, required this.weatherAsync});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${l10n.goodMorning}, $userName',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
          // Weather badge
          weatherAsync.when(
            data: (weather) {
              if (weather == null) return const SizedBox.shrink();
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Icon(
                      weather.isDay ? Icons.wb_sunny_rounded : Icons.nights_stay_rounded,
                      color: weather.isDay ? Colors.orange.shade400 : Colors.indigo,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${weather.temperatureC}°C',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
                        ),
                        Text(
                          weather.condition,
                          style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _HeroTourSection extends ConsumerStatefulWidget {
  final Tour tour;
  const _HeroTourSection({required this.tour});

  @override
  ConsumerState<_HeroTourSection> createState() => _HeroTourSectionState();
}

class _HeroTourSectionState extends ConsumerState<_HeroTourSection> {
  final _promptController = TextEditingController();

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  void _submitPrompt() {
    final text = _promptController.text.trim();
    if (text.isNotEmpty) {
      _promptController.clear();
      ref.read(aiPromptProvider.notifier).state = text;
      context.go('/creator');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          GestureDetector(
            onTap: () => context.push('/tours/${widget.tour.id}'),
            child: Container(
              width: double.infinity,
              height: 380, // Taller size
              margin: const EdgeInsets.only(bottom: 24), // Space for floating input
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(32),
                image: DecorationImage(
                  image: CachedNetworkImageProvider(widget.tour.coverUrl),
                  fit: BoxFit.cover,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(32),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.8),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 24,
                    right: 24,
                    bottom: 60, // Leave room so input doesn't overlap text
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                l10n.editorsChoice,
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                "98% ${l10n.vibeMatchAffinity}",
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.tour.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.tour.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 16,
            right: 16,
            child: GlassPanel(
              radius: 24,
              padding: const EdgeInsets.all(8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10, left: 10),
                    child: Icon(Icons.auto_awesome, color: Colors.grey.shade600, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: TextField(
                        controller: _promptController,
                        minLines: 1,
                        maxLines: 4,
                        style: const TextStyle(fontSize: 15),
                        decoration: InputDecoration(
                          hintText: l10n.whereToNext,
                          hintStyle: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 4),
                        ),
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _submitPrompt(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _submitPrompt,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: AppTheme.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToursForYouSection extends StatelessWidget {
  final List<Tour> tours;
  const _ToursForYouSection({required this.tours});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (tours.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.toursForYou,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface),
              ),
              TextButton(
                onPressed: () => context.go('/tours'),
                child: Text(l10n.viewAll, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (tours.isNotEmpty) _buildStaggeredGrid(context),
        ],
      ),
    );
  }

  Widget _buildStaggeredGrid(BuildContext context) {
    final t1 = tours.isNotEmpty ? tours[0] : null;
    final t2 = tours.length > 1 ? tours[1] : null;
    final t3 = tours.length > 2 ? tours[2] : null;
    final t4 = tours.length > 3 ? tours[3] : null;

    return Column(
      children: [
        if (t1 != null) _StaggeredTourCard(tour: t1, height: 220, isLarge: true),
        const SizedBox(height: 12),
        if (t2 != null) _StaggeredTourCard(tour: t2, height: 100, isLarge: false),
        const SizedBox(height: 12),
        Row(
          children: [
            if (t3 != null) Expanded(child: _StaggeredTourCard(tour: t3, height: 120, isLarge: false, alignBottom: true)),
            if (t3 != null && t4 != null) const SizedBox(width: 12),
            if (t4 != null) Expanded(child: _StaggeredTourCard(tour: t4, height: 120, isLarge: false, alignBottom: true)),
          ],
        ),
      ],
    );
  }
}

class _StaggeredTourCard extends StatelessWidget {
  final Tour tour;
  final double height;
  final bool isLarge;
  final bool alignBottom;

  const _StaggeredTourCard({
    required this.tour,
    required this.height,
    required this.isLarge,
    this.alignBottom = false,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GestureDetector(
      onTap: () => context.push('/tours/${tour.id}'),
      child: Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          image: DecorationImage(
            image: CachedNetworkImageProvider(tour.coverUrl),
            fit: BoxFit.cover,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: isLarge ? 0.7 : 0.6),
              ],
            ),
          ),
          padding: const EdgeInsets.all(16),
          alignment: alignBottom ? Alignment.bottomCenter : Alignment.bottomLeft,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: alignBottom ? CrossAxisAlignment.center : CrossAxisAlignment.start,
            children: [
              if (isLarge) ...[
                Text(
                  tourTypeLabel(tour.type).toUpperCase(),
                  style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1),
                ),
                const SizedBox(height: 4),
              ],
              Text(
                tour.title,
                textAlign: alignBottom ? TextAlign.center : TextAlign.left,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: isLarge ? 22 : 16,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                ),
              ),
              if (!alignBottom) ...[
                const SizedBox(height: 4),
                Text(
                  '${formatDuration(tour.durationHours)} • ${90 + (tour.title.length % 10)}% ${l10n.matchAffinity}',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _NearbyPlacesSection extends ConsumerWidget {
  final AsyncValue<List<NearbyPlace>> placesAsync;
  const _NearbyPlacesSection({required this.placesAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    return placesAsync.when(
      data: (places) {
        if (places.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.nearbyPlaces,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface),
                    ),
                    Row(
                      children: [
                        Icon(Icons.near_me_outlined, size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Text('A menos de 5km', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 180,
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  cacheExtent: 800,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: places.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 16),
                  itemBuilder: (context, index) {
                    final place = places[index];
                    return SizedBox(
                      width: 220,
                      child: InkWell(
                        onTap: () {
                          ref.read(selectedNearbyPlaceProvider.notifier).state = place;
                          context.push('/place-route');
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(20),
                                  image: place.imageUrl.isNotEmpty
                                      ? DecorationImage(
                                          image: CachedNetworkImageProvider(place.imageUrl),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                ),
                                alignment: Alignment.topRight,
                                padding: const EdgeInsets.all(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${(place.distanceMeters / 1000).toStringAsFixed(1)} km',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              place.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
                            ),
                            Text(
                              place.category.isEmpty ? place.type : place.category,
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _UpcomingEventsSection extends StatelessWidget {
  final AsyncValue<List<LocalEvent>> eventsAsync;
  const _UpcomingEventsSection({required this.eventsAsync});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return eventsAsync.when(
      data: (events) {
        if (events.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.upcomingEvents,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface),
              ),
              const SizedBox(height: 16),
              ...events.take(3).map((event) => _EventTile(event: event)),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _EventTile extends StatelessWidget {
  final LocalEvent event;
  const _EventTile({required this.event});

  @override
  Widget build(BuildContext context) {
    final month = _monthName(event.startsAt.month);
    final day = event.startsAt.day.toString();
    final timeStr = '${event.startsAt.hour.toString().padLeft(2, '0')}:${event.startsAt.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(month, style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w800)),
                Text(day, style: const TextStyle(color: AppTheme.primary, fontSize: 20, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Theme.of(context).colorScheme.onSurface),
                ),
                const SizedBox(height: 4),
                Text(
                  '${event.category} • $timeStr',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppTheme.primary),
        ],
      ),
    );
  }

  String _monthName(int m) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[m - 1];
  }
}
