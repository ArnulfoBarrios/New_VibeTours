import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/utils/image_utils.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../../core/services/ad_service.dart';
import '../../core/services/sqlite-service.dart';
import '../shared/location_disclosure_dialog.dart';
import '../tour_live/tour_rating_dialog.dart';
import 'widgets/image_viewer_dialog.dart';

String formatTourDuration(Tour tour) {
  final maxDay = tour.stops.isEmpty
      ? 1
      : tour.stops.map((s) => s.day).reduce((a, b) => a > b ? a : b);
  if (maxDay > 1) {
    return '$maxDay días';
  }
  if (tour.durationHours >= 24) {
    final days = (tour.durationHours / 24).round();
    return '$days días';
  }
  return formatDuration(tour.durationHours);
}

class TourDetailScreen extends ConsumerWidget {
  const TourDetailScreen({super.key, required this.tourId});

  final String tourId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final toursAsync = ref.watch(toursProvider);
    final mapStyle = ref.watch(mapStyleProvider);
    final localTours = ref.watch(userToursProvider).valueOrNull?.manualTours;
    return toursAsync.when(
      data: (tours) {
        final selected = ref.watch(selectedTourProvider);
        final availableTours = [...?localTours, ...tours];
        if (availableTours.isEmpty) {
          return const PremiumScaffold(
            safeBottom: true,
            child: EmptyState(
              icon: Icons.map_outlined,
              title: 'Tour no disponible',
              body: 'No hay tours disponibles en el catálogo.',
            ),
          );
        }
        final Tour? matchedInAvailable = availableTours.where((item) => item.id == tourId).firstOrNull;
        final tour = (selected?.id == tourId)
            ? selected!
            : (matchedInAvailable ?? selected ?? availableTours.first);
        final favorites = ref.watch(favoriteTourIdsProvider);
        final isFavorite = favorites.contains(tour.id);
        final commentsAsync = ref.watch(tourCommentsProvider(tour.id));
        final comments = commentsAsync.valueOrNull ?? [];
        final displayRating = comments.isNotEmpty
            ? (comments.map((c) => c.rating).reduce((a, b) => a + b) / comments.length).toStringAsFixed(1)
            : 'S/C';
        final displayCommentsCount = comments.isNotEmpty ? comments.length : tour.reviewCount;
        return PremiumScaffold(
          safeBottom: true,
          bottomNavigationBar: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.92),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 18,
                  offset: const Offset(0, -4),
                ),
              ],
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.15),
                ),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: LiquidButton(
                      label: l10n.startTour,
                      icon: Icons.navigation_rounded,
                      onPressed: () => _startTourFlow(context, ref, tour),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    tooltip: 'Escuchar Muestra Narrada (Audio Preview)',
                    onPressed: () => _playTeaserAudio(context, tour),
                    icon: const Icon(Icons.spatial_audio_off_rounded, color: Colors.blueAccent),
                  ),
                  const SizedBox(width: 6),
                  IconButton.filledTonal(
                    tooltip: l10n.save,
                    onPressed: () {
                      final next = <String>{...favorites};
                      if (isFavorite) {
                        next.remove(tour.id);
                      } else {
                        next.add(tour.id);
                      }
                      ref.read(favoriteTourIdsProvider.notifier).state = next;
                    },
                    icon: Icon(
                      isFavorite ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                      color: isFavorite ? AppTheme.violet : null,
                    ),
                  ),
                ],
              ),
            ),
          ),
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 330,
                pinned: true,
                stretch: true,
                backgroundColor: Colors.transparent,
                leading: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                actions: [
                  _TourOptionsMenuButton(tour: tour, ref: ref),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [
                    StretchMode.zoomBackground,
                  ],
                  background: LayoutBuilder(
                    builder: (context, constraints) {
                      final double currentHeight = constraints.maxHeight;
                      double scale = 1.0;
                      double translation = 0.0;
                      double fadeProgress = 1.0;

                      if (currentHeight.isFinite && !currentHeight.isNaN) {
                        if (currentHeight > 330.0) {
                          scale = (currentHeight / 330.0).clamp(1.0, 2.5);
                        } else {
                          final double scrollProgress = ((330.0 - currentHeight) / (330.0 - kToolbarHeight)).clamp(0.0, 1.0);
                          translation = scrollProgress * 60.0;
                          fadeProgress = (1.0 - scrollProgress * 1.5).clamp(0.0, 1.0);
                        }
                      }

                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          Transform.translate(
                            offset: Offset(0, -translation),
                            child: Transform.scale(
                              scale: scale,
                              alignment: Alignment.center,
                              child: tour.coverUrl.trim().isEmpty
                                  ? TravelImageFallback(title: tour.title)
                                  : CachedNetworkImage(
                                      imageUrl: optimizeImageUrl(tour.coverUrl),
                                      fit: BoxFit.cover,
                                      memCacheWidth: 600,
                                      maxWidthDiskCache: 800,
                                      httpHeaders: const {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                      },
                                      placeholder: (context, url) => const SkeletonBox(),
                                      errorWidget: (context, url, error) => CachedNetworkImage(
                                        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
                                        fit: BoxFit.cover,
                                        errorWidget: (c, u, e) => TravelImageFallback(title: tour.title),
                                      ),
                                    ),
                            ),
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
                            child: Opacity(
                              opacity: fadeProgress,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    tour.title,
                                    style: Theme.of(context).textTheme.headlineMedium
                                        ?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
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
                          ),
                        ],
                      );
                    },
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
                            value: '${(!tour.distanceKm.isFinite || tour.distanceKm.isNaN) ? '0.0' : tour.distanceKm.toStringAsFixed(1)} km',
                            label: l10n.distance,
                          ),
                          _Metric(
                            icon: Icons.schedule_rounded,
                            value: formatTourDuration(tour),
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
                      // Metadatos clave: Época, Horario y Punto de encuentro
                      _buildQuickSpecsCard(context, tour),
                      const SizedBox(height: 18),
                      // Público recomendado e Idiomas disponibles
                      _buildAudienceAndLanguagesSection(context, tour),
                      const SizedBox(height: 18),
                      if (tour.stops.isNotEmpty) ...[
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
                      ],
                      // ¿Qué incluye y qué NO incluye?
                      _buildIncludesExcludesSection(context, tour),
                      const SizedBox(height: 18),
                      // Accesibilidad y Aptitudes (Mascotas, Niños, Adultos Mayores)
                      _buildAccessibilityAndSuitabilitySection(context, tour),
                      const SizedBox(height: 18),
                      // Recomendaciones y Consejos
                      if (tour.recommendations.isNotEmpty || tour.whatToBring.isNotEmpty || tour.tourRules.isNotEmpty) ...[
                        _buildRecommendationsSection(context, tour),
                        const SizedBox(height: 18),
                      ],
                      SectionHeader(title: l10n.gallery),
                      SizedBox(
                        height: 96,
                        child: ListView.separated(
                          physics: const BouncingScrollPhysics(),
                          scrollDirection: Axis.horizontal,
                          itemCount: tour.gallery.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(width: 10),
                          itemBuilder: (context, index) => GestureDetector(
                            onTap: () => ImageViewerDialog.show(
                              context,
                              images: tour.gallery,
                              initialIndex: index,
                              title: tour.title,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: tour.gallery[index].trim().isEmpty
                                  ? TravelImageFallback(title: tour.title)
                                  : CachedNetworkImage(
                                      imageUrl: tour.gallery[index],
                                      width: 132,
                                      fit: BoxFit.cover,
                                      httpHeaders: const {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                      },
                                      placeholder: (context, url) =>
                                          const SkeletonBox(width: 132),
                                      errorWidget: (context, url, error) => CachedNetworkImage(
                                        imageUrl: _getRandomTravelImage(tour.title + index.toString()),
                                        width: 132,
                                        fit: BoxFit.cover,
                                        errorWidget: (c, u, e) => TravelImageFallback(title: tour.title),
                                      ),
                                    ),
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
                        _StopsTimelineList(tour: tour),
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
                      Builder(
                        builder: (context) {
                          final currentUser = ref.watch(authServiceProvider).currentUser;
                          final canRate = tour.canBeRatedBy(currentUser?.id);
                          final commentsList = ref.watch(tourCommentsProvider(tour.id)).valueOrNull ?? [];
                          final userComment = commentsList.where((c) => c.userId == currentUser?.id).firstOrNull;

                          return SectionHeader(
                            title: 'Opiniones de Viajeros',
                            action: canRate
                                ? TextButton.icon(
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        barrierDismissible: false,
                                        builder: (context) => TourRatingDialog(
                                          tour: tour,
                                          existingRating: userComment != null
                                              ? UserTourRating(comment: userComment, tour: tour)
                                              : null,
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.star_rounded, size: 18, color: Colors.amber),
                                    label: Text(
                                      userComment != null ? 'Editar opinión' : 'Calificar',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                  )
                                : null,
                          );
                        },
                      ),
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
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const PremiumScaffold(
        safeBottom: true,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => PremiumScaffold(
        safeBottom: true,
        child: EmptyState(
          icon: Icons.error_outline_rounded,
          title: 'Tour no disponible',
          body: error.toString(),
        ),
      ),
    );
  }

  Widget _buildAiDraftBanner(BuildContext context, WidgetRef ref, Tour tour) {
    final isLoggedIn = ref.watch(isAuthenticatedProvider);

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
            isLoggedIn
                ? 'Este tour fue generado dinámicamente y aún no está guardado. Elige cómo deseas conservarlo:'
                : 'Este tour fue generado por IA. Inicia sesión para guardarlo en tu cuenta o publicarlo:',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
          ),
          const SizedBox(height: 16),
          if (!isLoggedIn)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push('/login');
                },
                icon: const Icon(Icons.login_rounded),
                label: const Text('Iniciar sesión para guardar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            )
          else
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
                              content: Text('El tour se ha publicado exitosamente.'),
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


  Future<void> _startTourFlow(BuildContext context, WidgetRef ref, Tour tour) async {
    final granted = await checkAndRequestLocationPermission(context, ref);
    if (!granted) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Se requiere ubicación para iniciar el tour.')),
        );
      }
      return;
    }

    final currentUser = ref.read(authServiceProvider).currentUser;
    if (currentUser != null) {
      try {
        await ref.read(tourRepositoryProvider).joinTour(tour.id);
        ref.invalidate(userStatsProvider);
        ref.invalidate(tourParticipantsProvider);
      } catch (e) {
        debugPrint('Error auto-joining tour: $e');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error al registrar participación: $e'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    }

    final hasHotel = tour.stops.any((s) => s.id == 'hotel_start' || s.id == 'hotel_end' || s.name.toLowerCase().contains('hotel'));

    // Si el tour dura 1 día o menos (y no abarca múltiples días), no solicitar ni recomendar hotel
    final maxDay = tour.stops.isEmpty ? 1 : tour.stops.map((s) => s.day).reduce((a, b) => a > b ? a : b);
    final isSingleDay = maxDay <= 1 && tour.durationHours <= 24.0;

    if (hasHotel || isSingleDay) {
      if (!context.mounted) return;
      await _navigateToLiveTour(context, ref, tour);
      return;
    }

    if (!context.mounted) return;
    // Show dialog: Do you want to add a hotel?
    final wantHotel = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Deseas agregar tu hotel de alojamiento?'),
        content: const Text(
          'Podemos buscar y agregar tu hotel de alojamiento como punto de inicio y retorno del recorrido.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No, iniciar directamente'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sí, buscar hotel'),
          ),
        ],
      ),
    );

    if (wantHotel != true) {
      if (!context.mounted) return;
      await _navigateToLiveTour(context, ref, tour);
      return;
    }

    if (!context.mounted) return;
    // Show loading and fetch hotels
    final hotels = await showDialog<List<dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => FutureBuilder<List<dynamic>>(
        future: ref.read(tourRepositoryProvider).fetchHotels(
          latitude: tour.stops.first.location.latitude,
          longitude: tour.stops.first.location.longitude,
          budget: 'moderate',
        ),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const AlertDialog(
              title: Text('Buscando hoteles cercanos...'),
              content: SizedBox(
                height: 80,
                child: Center(child: CircularProgressIndicator()),
              ),
            );
          }
          if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
            return AlertDialog(
              title: const Text('No se encontraron hoteles'),
              content: const Text('No pudimos encontrar hoteles cercanos en este momento.'),
              actions: [
                FilledButton(
                  onPressed: () => Navigator.pop(context, <dynamic>[]),
                  child: const Text('Continuar sin hotel'),
                ),
              ],
            );
          }
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pop(context, snapshot.data);
          });
          return const SizedBox.shrink();
        },
      ),
    );

    if (hotels == null || hotels.isEmpty) {
      if (!context.mounted) return;
      await _navigateToLiveTour(context, ref, tour);
      return;
    }

    if (!context.mounted) return;
    // Show hotel selection list
    final selectedHotel = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecciona tu hotel'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: hotels.length,
            itemBuilder: (context, index) {
              final h = Map<String, dynamic>.from(hotels[index]);
              return ListTile(
                leading: const Icon(Icons.hotel_rounded),
                title: Text(h['name'] ?? 'Hotel'),
                subtitle: Text(h['address'] ?? h['direccion'] ?? 'Dirección no disponible'),
                onTap: () => Navigator.pop(context, h),
              );
            },
          ),
        ),
      ),
    );

    if (selectedHotel == null) {
      if (!context.mounted) return;
      await _navigateToLiveTour(context, ref, tour);
      return;
    }

    if (!context.mounted) return;
    final modifiedTour = _addHotelToTour(tour, selectedHotel);
    await _navigateToLiveTour(context, ref, modifiedTour);
  }

  Future<void> _navigateToLiveTour(BuildContext context, WidgetRef ref, Tour tourToStart) async {
    ref.read(selectedTourProvider.notifier).state = tourToStart;
    if (!context.mounted) return;

    // Trigger Interstitial Video Ad before launching the live tour navigation
    AdService.instance.showInterstitialAd(
      onAdClosed: () async {
        if (context.mounted) {
          await NavigationTransitionOverlay.show(context);
          if (context.mounted) {
            context.push('/live/${tourToStart.id}');
          }
        }
      },
    );
  }

  Tour _addHotelToTour(Tour tour, Map<String, dynamic> hotel) {
    final hotelName = hotel['name']?.toString() ?? 'Hotel';
    final hotelLat = double.tryParse(hotel['latitude']?.toString() ?? '') ?? 0.0;
    final hotelLon = double.tryParse(hotel['longitude']?.toString() ?? '') ?? 0.0;
    final hotelAddress = hotel['address']?.toString() ?? hotel['direccion']?.toString() ?? '';

    final hotelStart = TourStop(
      id: 'hotel_start',
      name: '$hotelName (Salida)',
      location: GeoPoint(latitude: hotelLat, longitude: hotelLon),
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      description: 'Punto de partida y alojamiento en $hotelName.',
      activities: const ['Check-in', 'Salida del tour'],
      tips: const ['Llevar agua y calzado cómodo'],
      suggestedMinutes: 15,
      order: 0,
      day: 1,
      locationInfo: TourLocationInfo(
        nombreLugar: hotelName,
        direccion: hotelAddress,
        ciudad: tour.city,
        region: '',
        pais: tour.country,
        placeId: hotel['id']?.toString() ?? 'hotel-start',
        urlMapa: 'https://maps.google.com/?q=$hotelLat,$hotelLon',
      ),
    );

    final rawStops = tour.stops.asMap().entries.map((entry) {
      return entry.value.copyWith(order: entry.key + 1);
    }).toList();

    final maxDay = rawStops.isEmpty ? 1 : rawStops.map((s) => s.day).reduce((a, b) => a > b ? a : b);
    final hotelEnd = TourStop(
      id: 'hotel_end',
      name: '$hotelName (Retorno)',
      location: GeoPoint(latitude: hotelLat, longitude: hotelLon),
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      description: 'Fin del recorrido y retorno a tu alojamiento en $hotelName.',
      activities: const ['Retorno', 'Descanso'],
      tips: const ['Planifica tu cena y descanso'],
      suggestedMinutes: 15,
      order: rawStops.length + 1,
      day: maxDay,
      locationInfo: TourLocationInfo(
        nombreLugar: hotelName,
        direccion: hotelAddress,
        ciudad: tour.city,
        region: '',
        pais: tour.country,
        placeId: hotel['id']?.toString() ?? 'hotel-end',
        urlMapa: 'https://maps.google.com/?q=$hotelLat,$hotelLon',
      ),
    );

    final List<TourStop> nextStops = [hotelStart, ...rawStops, hotelEnd];

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
      stops: nextStops,
      isPublished: tour.isPublished,
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

  Widget _buildQuickSpecsCard(BuildContext context, Tour tour) {
    final bestSeasonText = tour.bestSeason.isNotEmpty ? tour.bestSeason : 'Todo el año';
    final recommendedScheduleText = tour.recommendedSchedule.isNotEmpty ? tour.recommendedSchedule : 'Mañana o tarde con buena luz natural';
    final meetingPointText = tour.meetingPoint.isNotEmpty
        ? tour.meetingPoint
        : (tour.meetingPointInfo.nombreLugar.isNotEmpty
            ? tour.meetingPointInfo.nombreLugar
            : (tour.stops.isNotEmpty ? tour.stops.first.name : 'Punto inicial del recorrido'));

    return GlassPanel(
      child: Column(
        children: [
          _SpecRow(
            icon: Icons.wb_sunny_outlined,
            iconColor: Colors.amber,
            title: 'Mejor época para ir',
            value: bestSeasonText,
          ),
          const Divider(height: 20, thickness: 0.5),
          _SpecRow(
            icon: Icons.access_time_rounded,
            iconColor: Colors.blueAccent,
            title: 'Horario recomendado',
            value: recommendedScheduleText,
          ),
          const Divider(height: 20, thickness: 0.5),
          _SpecRow(
            icon: Icons.flag_rounded,
            iconColor: AppTheme.violet,
            title: 'Punto de encuentro',
            value: meetingPointText,
          ),
        ],
      ),
    );
  }

  Widget _buildAudienceAndLanguagesSection(BuildContext context, Tour tour) {
    final audiences = tour.recommendedAudience.isNotEmpty
        ? tour.recommendedAudience
        : ['Familias', 'Parejas', 'Viajeros curiosos'];
    final languages = tour.availableLanguages.isNotEmpty
        ? tour.availableLanguages
        : [tour.language.toUpperCase()];

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.people_outline_rounded, size: 20, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                'Público Recomendado',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: audiences.map((aud) {
              return Chip(
                label: Text(aud, style: const TextStyle(fontSize: 12)),
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                side: BorderSide.none,
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.translate_rounded, size: 20, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                'Idiomas Disponibles',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: languages.map((lang) {
              return Chip(
                label: Text(lang, style: const TextStyle(fontSize: 12)),
                backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                side: BorderSide.none,
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildIncludesExcludesSection(BuildContext context, Tour tour) {
    final includes = tour.includes.isNotEmpty
        ? tour.includes
        : ['Guía digital interactiva', 'Ruta en mapa interactivo', 'Recomendaciones por parada'];
    final excludes = tour.excludes.isNotEmpty
        ? tour.excludes
        : ['Transporte privado', 'Entradas a recintos pagos no especificados', 'Gastos personales'];

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Qué incluye el tour?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          ...includes.map((inc) => Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.green, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(inc, style: Theme.of(context).textTheme.bodyMedium)),
                  ],
                ),
              )),
          const SizedBox(height: 16),
          Text(
            'No incluye',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          ...excludes.map((exc) => Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.remove_circle_outline_rounded, color: Colors.redAccent, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(exc, style: Theme.of(context).textTheme.bodyMedium)),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildAccessibilityAndSuitabilitySection(BuildContext context, Tour tour) {
    final info = tour.additionalInfo;
    final accesibilidad = info.accesibilidad.isNotEmpty
        ? info.accesibilidad
        : 'Consultar condiciones de accesibilidad en cada parada.';

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.accessible_rounded, size: 20, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                'Accesibilidad e Información Adicional',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            accesibilidad,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _FeatureBadge(
                icon: Icons.pets_rounded,
                label: info.mascotasPermitidas ? 'Mascotas permitidas' : 'Sin mascotas',
                isPositive: info.mascotasPermitidas,
              ),
              _FeatureBadge(
                icon: Icons.child_care_rounded,
                label: info.aptoParaNinos ? 'Apto para niños' : 'No recomendado niños',
                isPositive: info.aptoParaNinos,
              ),
              _FeatureBadge(
                icon: Icons.elderly_rounded,
                label: info.aptoParaAdultosMayores ? 'Apto adultos mayores' : 'Requiere alto esfuerzo físico',
                isPositive: info.aptoParaAdultosMayores,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationsSection(BuildContext context, Tour tour) {
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb_outline_rounded, size: 20, color: Colors.amber),
              const SizedBox(width: 8),
              Text(
                'Recomendaciones Generales',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...tour.recommendations.map((rec) => Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Expanded(child: Text(rec, style: Theme.of(context).textTheme.bodyMedium)),
                  ],
                ),
              )),
          if (tour.whatToBring.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Qué llevar',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              tour.whatToBring.join(', '),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ],
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
            Text(value, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(label, style: Theme.of(context).textTheme.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

void _showStopDetailsSheet(BuildContext context, TourStop stop) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      final allImages = stop.images.isNotEmpty
          ? stop.images
          : [if (stop.imageUrl.isNotEmpty) stop.imageUrl];

      final recommendations = stop.tips.isNotEmpty
          ? stop.tips
          : [
              'Planifica tu visita con anticipación para aprovechar mejor el tiempo.',
              'Lleva agua, calzado cómodo y protección solar para el recorrido.',
              'Captura los mejores momentos y consulta a guías locales.',
            ];

      return DraggableScrollableSheet(
        initialChildSize: 0.78,
        minChildSize: 0.45,
        maxChildSize: 0.94,
        expand: false,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Stop Cover Photo with Tap to Zoom
                  if (stop.imageUrl.isNotEmpty)
                    GestureDetector(
                      onTap: () => ImageViewerDialog.show(
                        context,
                        images: allImages,
                        title: stop.name,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Stack(
                          children: [
                            CachedNetworkImage(
                              imageUrl: stop.imageUrl,
                              height: 180,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorWidget: (c, u, e) => Container(
                                height: 180,
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                child: const Icon(Icons.place_rounded, size: 48, color: AppTheme.primary),
                              ),
                            ),
                            Positioned(
                              top: 12,
                              right: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.65),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Icon(Icons.zoom_in_rounded, color: Colors.white, size: 16),
                                    SizedBox(width: 4),
                                    Text('Ver fotos', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Stop Title & Duration
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          stop.name.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim(),
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      Chip(
                        avatar: const Icon(Icons.timer_outlined, size: 16),
                        label: Text('${stop.suggestedMinutes} min'),
                        backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Voice Guide (Audioguía de IA) Interactive Bar
                  Consumer(
                    builder: (context, ref, _) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.primary.withValues(alpha: 0.15),
                              Colors.cyan.withValues(alpha: 0.08),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppTheme.primary.withValues(alpha: 0.35),
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () async {
                              final voiceService = ref.read(voiceGuideProvider);
                              final cleanName = stop.name.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();
                              final cleanDesc = stop.description.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();
                              final narrateText = cleanDesc.isNotEmpty && cleanDesc != cleanName
                                  ? '$cleanName. $cleanDesc'
                                  : '$cleanName es uno de los atractivos imperdibles en este recorrido. Disfruta de su riqueza histórica, cultural y arquitectura visual.';
                              await voiceService.speak(narrateText);
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: const BoxDecoration(
                                      color: AppTheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.record_voice_over_rounded, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Escuchar Audioguía de la Parada',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        Text(
                                          'Narración con IA de la historia y recomendaciones',
                                          style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7)),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.stop_circle_outlined, color: Colors.redAccent),
                                    tooltip: 'Detener audio',
                                    onPressed: () async {
                                      await ref.read(voiceGuideProvider).stop();
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // General Description Section
                  Builder(
                    builder: (context) {
                      final cleanName = stop.name.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();
                      final cleanDesc = stop.description.replaceAll(RegExp(r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*', caseSensitive: false), '').trim();
                      final finalDesc = cleanDesc.isNotEmpty && cleanDesc != cleanName
                          ? cleanDesc
                          : 'Disfruta de $cleanName, un destacado punto de interés con historia, arquitectura y gran valor cultural en esta experiencia.';

                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Theme.of(context).dividerColor.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: const [
                                Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Descripción General',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              finalDesc,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.4),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 18),

                  // Recommendations Section
                  Row(
                    children: const [
                      Icon(Icons.lightbulb_rounded, color: Colors.amber, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Recomendaciones de la Parada',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...recommendations.map((rec) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('💡 ', style: TextStyle(fontSize: 14)),
                            Expanded(
                              child: Text(
                                rec,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 14),

                  // Stop Gallery Thumbnails if available
                  if (allImages.length > 1) ...[
                    const Text(
                      'Galería de la parada',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 80,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: allImages.length,
                        separatorBuilder: (c, i) => const SizedBox(width: 8),
                        itemBuilder: (c, i) => GestureDetector(
                          onTap: () => ImageViewerDialog.show(
                            context,
                            images: allImages,
                            initialIndex: i,
                            title: stop.name,
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: allImages[i],
                              width: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Activities
                  if (stop.activities.isNotEmpty) ...[
                    const Text('Actividades recomendadas', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: stop.activities
                          .map((act) => Chip(
                                label: Text(act),
                                backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
                              ))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      );
    },
  );
}

class _StopTile extends StatelessWidget {
  const _StopTile({required this.stop});

  final TourStop stop;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      onTap: () => _showStopDetailsSheet(context, stop),
      padding: const EdgeInsets.all(12),
      radius: 22,
      child: Row(
        children: [
          SizedBox(
            width: 76,
            height: 76,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Builder(
                builder: (context) {
                  final displayUrl = stop.displayImageUrl;
                  return displayUrl.isEmpty
                      ? TravelImageFallback(
                          title: stop.name,
                          icon: Icons.place_rounded,
                        )
                      : CachedNetworkImage(
                          imageUrl: displayUrl,
                          width: 76,
                          height: 76,
                          fit: BoxFit.cover,
                          httpHeaders: const {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                          },
                          placeholder: (context, url) =>
                              const SkeletonBox(width: 76, height: 76),
                          errorWidget: (context, url, error) => TravelImageFallback(
                            title: stop.name,
                            icon: Icons.place_rounded,
                          ),
                        );
                },
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

class _AnimatedPathPainter extends CustomPainter {
  _AnimatedPathPainter({
    required this.progress,
    required this.color,
  });

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.4)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    final dashHeight = 8.0;
    final dashSpace = 6.0;
    final totalSpacing = dashHeight + dashSpace;
    
    double startY = (progress * totalSpacing) - totalSpacing;
    
    while (startY < size.height) {
      if (startY + dashHeight > 0) {
        canvas.drawLine(
          Offset(size.width / 2, startY.clamp(0, size.height)),
          Offset(size.width / 2, (startY + dashHeight).clamp(0, size.height)),
          paint,
        );
      }
      startY += totalSpacing;
    }
  }

  @override
  bool shouldRepaint(covariant _AnimatedPathPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

class _MovingDashedLine extends StatefulWidget {
  const _MovingDashedLine();

  @override
  State<_MovingDashedLine> createState() => _MovingDashedLineState();
}

class _MovingDashedLineState extends State<_MovingDashedLine> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: const Size(2, 44),
          painter: _AnimatedPathPainter(
            progress: _controller.value,
            color: AppTheme.primary,
          ),
        );
      },
    );
  }
}

class _TimelineConnector extends StatelessWidget {
  const _TimelineConnector({
    required this.index,
    required this.isFirst,
    required this.isLast,
    required this.emoji,
  });

  final int index;
  final bool isFirst;
  final bool isLast;
  final String emoji;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 2,
          height: 12,
          color: isFirst ? Colors.transparent : AppTheme.primary.withValues(alpha: 0.3),
        ),
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primary,
                AppTheme.violet,
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Center(
            child: emoji.isNotEmpty
                ? Text(emoji, style: const TextStyle(fontSize: 16))
                : Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
          ),
        ),
        if (!isLast)
          const SizedBox(
            height: 44,
            child: _MovingDashedLine(),
          ),
      ],
    );
  }
}

class _StopsTimelineList extends StatelessWidget {
  const _StopsTimelineList({required this.tour});
  final Tour tour;

  @override
  Widget build(BuildContext context) {
    final Map<int, List<TourStop>> stopsByDay = {};
    for (final stop in tour.stops) {
      stopsByDay.putIfAbsent(stop.day, () => []).add(stop);
    }
    
    final sortedDays = stopsByDay.keys.toList()..sort();
    int absoluteIndex = 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final day in sortedDays) ...[
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
          ...stopsByDay[day]!.map((stop) {
            final currIndex = absoluteIndex++;
            final isLast = currIndex == tour.stops.length - 1;
            final isFirst = currIndex == 0;
            final emoji = _getStopEmoji(stop);

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _TimelineConnector(
                  index: currIndex,
                  isFirst: isFirst,
                  isLast: isLast,
                  emoji: emoji,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _StopTile(stop: stop)
                        .animate(delay: (currIndex.clamp(0, 4) * 80).ms)
                        .fadeIn(duration: 350.ms)
                        .slideX(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
                  ),
                ),
              ],
            );
          }),
        ],
      ],
    );
  }
}

String _getStopEmoji(TourStop stop) {
  final name = stop.name.toLowerCase();
  final desc = stop.description.toLowerCase();
  final activities = stop.activities.map((a) => a.toLowerCase()).join(' ');
  final text = '$name $desc $activities';

  if (text.contains('playa') || text.contains('mar ') || text.contains('ola') || text.contains('beach') || text.contains('coast') || text.contains('bahía') || text.contains('bay') || text.contains('isla') || text.contains('island')) {
    return '🌊';
  }
  if (text.contains('templo') || text.contains('monumento') || text.contains('históri') || text.contains('museo') || text.contains('catedral') || text.contains('iglesia') || text.contains('castle') || text.contains('temple') || text.contains('museum') || text.contains('ruina') || text.contains('ruins')) {
    return '🏛️';
  }
  if (text.contains('restaurante') || text.contains('comida') || text.contains('cena') || text.contains('almuerzo') || text.contains('gastronom') || text.contains('restaurant') || text.contains('food') || text.contains('café') || text.contains('cafe') || text.contains('bar ') || text.contains('pub')) {
    return '🍴';
  }
  if (text.contains('naturaleza') || text.contains('bosque') || text.contains('reserva') || text.contains('parque') || text.contains('eco') || text.contains('sender') || text.contains('hiking') || text.contains('forest') || text.contains('park') || text.contains('jardín') || text.contains('garden')) {
    return '🌳';
  }
  if (text.contains('compras') || text.contains('centro comercial') || text.contains('shopping') || text.contains('mall') || text.contains('mercado') || text.contains('market') || text.contains('tienda') || text.contains('store')) {
    return '🛍️';
  }
  if (text.contains('teatro') || text.contains('concierto') || text.contains('show') || text.contains('música') || text.contains('arte') || text.contains('art ') || text.contains('cultur')) {
    return '🎭';
  }
  return '';
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
              Expanded(
                child: GestureDetector(
                  onTap: comment.userId.isNotEmpty
                      ? () => context.push('/user-profile/${comment.userId}')
                      : null,
                  behavior: HitTestBehavior.opaque,
                  child: Row(
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
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    comment.userName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right_rounded, size: 16, color: AppTheme.primary),
                              ],
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
                    ],
                  ),
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
          if (comment.photos.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: comment.photos.length,
                itemBuilder: (context, photoIndex) {
                  final photoUrl = comment.photos[photoIndex];
                  final isBase64 = photoUrl.startsWith('data:image');
                  return Container(
                    margin: const EdgeInsets.only(right: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: isBase64
                          ? Image.memory(
                              base64Decode(photoUrl.split(',').last),
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                            )
                          : CachedNetworkImage(
                              imageUrl: photoUrl,
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              errorWidget: (context, url, error) =>
                                  const Icon(Icons.broken_image_rounded),
                            ),
                    ),
                  );
                },
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

class _SpecRow extends StatelessWidget {
  const _SpecRow({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.grey.shade400),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FeatureBadge extends StatelessWidget {
  const _FeatureBadge({
    required this.icon,
    required this.label,
    required this.isPositive,
  });

  final IconData icon;
  final String label;
  final bool isPositive;

  @override
  Widget build(BuildContext context) {
    final color = isPositive ? Colors.green : Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}

String _getRandomTravelImage(String seed) {
  final images = [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80',
  ];
  final int hash = seed.codeUnits.isEmpty
      ? 0
      : seed.codeUnits.reduce((a, b) => a + b);
  return images[hash % images.length];
}

void _showExportOptionsModal(BuildContext context, Tour tour) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Exportar o Compartir Ruta',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Selecciona cómo deseas exportar este itinerario:',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.map_rounded, color: Colors.green),
                ),
                title: const Text('Abrir en Google Maps', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Genera la ruta paso a paso con waypoints en Google Maps'),
                onTap: () {
                  Navigator.pop(context);
                  _exportToGoogleMaps(context, tour);
                },
              ),
              const Divider(height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.share_rounded, color: Colors.blue),
                ),
                title: const Text('Compartir Itinerario por Texto', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Envía el resumen del tour por WhatsApp o redes sociales'),
                onTap: () {
                  Navigator.pop(context);
                  _shareTourItinerary(tour);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      );
    },
  );
}

Future<void> _exportToGoogleMaps(BuildContext context, Tour tour) async {
  if (tour.stops.isEmpty) return;

  final origin = '${tour.stops.first.location.latitude},${tour.stops.first.location.longitude}';
  final destination = '${tour.stops.last.location.latitude},${tour.stops.last.location.longitude}';

  String waypoints = '';
  if (tour.stops.length > 2) {
    waypoints = tour.stops
        .skip(1)
        .take(tour.stops.length - 2)
        .map((s) => '${s.location.latitude},${s.location.longitude}')
        .join('|');
  }

  final queryParameters = <String, String>{
    'api': '1',
    'origin': origin,
    'destination': destination,
    'travelmode': 'walking',
    if (waypoints.isNotEmpty) 'waypoints': waypoints,
  };

  final uri = Uri.https('www.google.com', '/maps/dir/', queryParameters);

  try {
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    }
  } catch (e) {
    debugPrint('[export-maps] Error: $e');
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir Google Maps.')),
      );
    }
  }
}

void _shareTourItinerary(Tour tour) {
  final buffer = StringBuffer();
  final durationMins = (tour.durationHours * 60).round();
  buffer.writeln('🗺️ *${tour.title}* (${tour.city}, ${tour.country})');
  buffer.writeln('⏱️ Duración: $durationMins mins | 🏃 Dificultad: ${tour.difficulty.name}');
  buffer.writeln('\n📍 *Paradas del Itinerario:*');
  for (int i = 0; i < tour.stops.length; i++) {
    final stop = tour.stops[i];
    buffer.writeln('${i + 1}. *${stop.name}*: ${stop.description}');
  }
  buffer.writeln('\n✨ ¡Descubierto con la app VIBETOURS!');
  SharePlus.instance.share(ShareParams(text: buffer.toString()));
}

Future<void> _playTeaserAudio(BuildContext context, Tour tour) async {
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();

  final tts = FlutterTts();
  await tts.setLanguage('es-ES');
  await tts.setPitch(1.0);
  await tts.setSpeechRate(0.5);

  tts.setCompletionHandler(() {
    messenger.hideCurrentSnackBar();
  });
  tts.setCancelHandler(() {
    messenger.hideCurrentSnackBar();
  });

  final firstStop = tour.stops.isNotEmpty ? tour.stops.first.name : tour.city;
  final sampleText = 'Bienvenido a ${tour.title} en ${tour.city}. Este recorrido te llevará a conocer fascinantes sitios como $firstStop. ${tour.description}';

  if (context.mounted) {
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.spatial_audio_rounded, color: Colors.lightBlueAccent),
            const SizedBox(width: 10),
            Expanded(child: Text('Reproduciendo muestra de audio para ${tour.title}...')),
          ],
        ),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Detener',
          onPressed: () {
            tts.stop();
            messenger.hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  await tts.speak(sampleText);
}

void _showReportDialog(BuildContext context, WidgetRef ref, Tour tour) {
  String selectedReason = 'Spam';
  final TextEditingController detailsController = TextEditingController();

  showDialog(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Reportar Tour'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButton<String>(
              value: selectedReason,
              isExpanded: true,
              items: ['Spam', 'Contenido Ofensivo', 'Fraude', 'Violencia', 'Otro']
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setState(() => selectedReason = v!),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: detailsController,
              decoration: const InputDecoration(
                labelText: 'Detalles adicionales (opcional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              final nav = Navigator.of(context);
              final scaffold = ScaffoldMessenger.of(context);
              try {
                await ref.read(moderationRepositoryProvider).reportContent(
                  tourId: tour.id,
                  reportedUserId: tour.ownerId,
                  reason: selectedReason,
                  details: detailsController.text,
                );
                nav.pop();
                scaffold.showSnackBar(const SnackBar(content: Text('Reporte enviado correctamente.')));
              } catch (e) {
                scaffold.showSnackBar(const SnackBar(content: Text('Error al enviar reporte.')));
              }
            },
            child: const Text('Enviar'),
          ),
        ],
      ),
    ),
  );
}

void _showBlockDialog(BuildContext context, WidgetRef ref, Tour tour) {
  if (tour.ownerId == null) return;
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Bloquear Creador'),
      content: const Text(
          'Si bloqueas al creador de este tour, dejarás de ver sus tours y comentarios. ¿Estás seguro?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () async {
            final nav = Navigator.of(context);
            final router = GoRouter.of(context);
            final scaffold = ScaffoldMessenger.of(context);
            try {
              await ref.read(blockedUsersProvider.notifier).blockUser(tour.ownerId!);
              nav.pop();
              if (router.canPop()) {
                router.pop();
              } else {
                router.go('/');
              }
              scaffold.showSnackBar(const SnackBar(content: Text('Usuario bloqueado.')));
            } catch (e) {
              scaffold.showSnackBar(const SnackBar(content: Text('Error al bloquear usuario.')));
            }
          },
          child: const Text('Bloquear'),
        ),
      ],
    ),
  );
}

class _TourOptionsMenuButton extends StatefulWidget {
  final Tour tour;
  final WidgetRef ref;
  const _TourOptionsMenuButton({required this.tour, required this.ref});

  @override
  State<_TourOptionsMenuButton> createState() => _TourOptionsMenuButtonState();
}

class _TourOptionsMenuButtonState extends State<_TourOptionsMenuButton> {
  bool _isOfflineSaved = false;
  final _sqlite = SqliteService();

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  Future<void> _checkStatus() async {
    final saved = await _sqlite.isTourSavedOffline(widget.tour.id);
    if (mounted) setState(() => _isOfflineSaved = saved);
  }

  Future<void> _toggleDownload() async {
    final messenger = ScaffoldMessenger.of(context);
    if (_isOfflineSaved) {
      await _sqlite.removeOfflineTour(widget.tour.id);
      if (mounted) {
        setState(() => _isOfflineSaved = false);
        messenger.showSnackBar(
          const SnackBar(content: Text('Tour eliminado de la memoria offline.')),
        );
      }
    } else {
      await _sqlite.saveOfflineTour(widget.tour);
      if (mounted) {
        setState(() => _isOfflineSaved = true);
        messenger.showSnackBar(
          const SnackBar(
            content: Text('¡Tour descargado exitosamente para uso offline!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authUser = widget.ref.watch(authUserProvider).valueOrNull;
    final isOwner = (widget.tour.ownerId != null && widget.tour.ownerId == authUser?.id) ||
        widget.tour.id.startsWith('ai-') ||
        widget.tour.isAiGenerated;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: IconButton.filledTonal(
        onPressed: null,
        style: IconButton.styleFrom(
          backgroundColor: Colors.black.withValues(alpha: 0.35),
        ),
        icon: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          onSelected: (value) async {
            if (value == 'download') {
              await _toggleDownload();
            } else if (value == 'share') {
              _showExportOptionsModal(context, widget.tour);
            } else if (value == 'report') {
              final isLogged = widget.ref.read(isAuthenticatedProvider);
              if (!isLogged) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Debes iniciar sesión para realizar esta acción.'),
                    backgroundColor: Colors.redAccent,
                  ),
                );
                return;
              }
              _showReportDialog(context, widget.ref, widget.tour);
            } else if (value == 'block') {
              final isLogged = widget.ref.read(isAuthenticatedProvider);
              if (!isLogged) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Debes iniciar sesión para realizar esta acción.'),
                    backgroundColor: Colors.redAccent,
                  ),
                );
                return;
              }
              _showBlockDialog(context, widget.ref, widget.tour);
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'download',
              child: Row(
                children: [
                  Icon(
                    _isOfflineSaved ? Icons.download_done_rounded : Icons.download_rounded,
                    color: _isOfflineSaved ? Colors.green : null,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(_isOfflineSaved ? 'Descargado offline' : 'Guardar offline'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'share',
              child: Row(
                children: [
                  Icon(Icons.ios_share_rounded, size: 20),
                  SizedBox(width: 12),
                  Text('Compartir o Exportar'),
                ],
              ),
            ),
            if (!isOwner) ...[
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'report',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined, color: Colors.redAccent, size: 20),
                    SizedBox(width: 12),
                    Text('Reportar Tour', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'block',
                child: Row(
                  children: [
                    Icon(Icons.block_rounded, color: Colors.redAccent, size: 20),
                    SizedBox(width: 12),
                    Text('Bloquear Creador', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
