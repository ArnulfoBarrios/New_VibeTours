import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../shared/location_disclosure_dialog.dart';

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
            physics: const BouncingScrollPhysics(),
            cacheExtent: 1500,
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
                  if (tour.ownerId != null && tour.ownerId != ref.watch(authUserProvider).valueOrNull?.id)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
                      onSelected: (value) {
                        final isLogged = ref.read(isAuthenticatedProvider);
                        if (!isLogged) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Debes iniciar sesión para realizar esta acción.'),
                              backgroundColor: Colors.redAccent,
                            ),
                          );
                          return;
                        }
                        if (value == 'report') {
                          _showReportDialog(context, ref, tour);
                        } else if (value == 'block') {
                          _showBlockDialog(context, ref, tour);
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'report',
                          child: Text('Reportar Tour'),
                        ),
                        const PopupMenuItem(
                          value: 'block',
                          child: Text('Bloquear Creador'),
                        ),
                      ],
                    ),
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

                      if (currentHeight > 330.0) {
                        scale = currentHeight / 330.0;
                      } else {
                        final double scrollProgress = ((330.0 - currentHeight) / (330.0 - kToolbarHeight)).clamp(0.0, 1.0);
                        translation = scrollProgress * 60.0;
                        fadeProgress = (1.0 - scrollProgress * 1.5).clamp(0.0, 1.0);
                      }

                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          Transform.translate(
                            offset: Offset(0, -translation),
                            child: Transform.scale(
                              scale: scale,
                              alignment: Alignment.center,
                              child: CachedNetworkImage(
                                imageUrl: tour.coverUrl,
                                fit: BoxFit.cover,
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
                              onPressed: () => _startTourFlow(context, ref, tour),
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
                          physics: const BouncingScrollPhysics(),
                          cacheExtent: 800,
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

    if (hasHotel || !context.mounted) {
      ref.read(selectedTourProvider.notifier).state = tour;
      if (context.mounted) {
        await NavigationTransitionOverlay.show(context);
        if (context.mounted) {
          context.push('/live/${tour.id}');
        }
      }
      return;
    }

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

    if (wantHotel != true || !context.mounted) {
      ref.read(selectedTourProvider.notifier).state = tour;
      if (context.mounted) {
        await NavigationTransitionOverlay.show(context);
        if (context.mounted) {
          context.push('/live/${tour.id}');
        }
      }
      return;
    }

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

    if (hotels == null || hotels.isEmpty || !context.mounted) {
      ref.read(selectedTourProvider.notifier).state = tour;
      if (context.mounted) {
        await NavigationTransitionOverlay.show(context);
        if (context.mounted) {
          context.push('/live/${tour.id}');
        }
      }
      return;
    }

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

    if (selectedHotel == null || !context.mounted) {
      ref.read(selectedTourProvider.notifier).state = tour;
      if (context.mounted) {
        await NavigationTransitionOverlay.show(context);
        if (context.mounted) {
          context.push('/live/${tour.id}');
        }
      }
      return;
    }

    // Add hotel stops to tour and start
    final modifiedTour = _addHotelToTour(tour, selectedHotel);
    ref.read(selectedTourProvider.notifier).state = modifiedTour;
    if (context.mounted) {
      await NavigationTransitionOverlay.show(context);
      if (context.mounted) {
        context.push('/live/${modifiedTour.id}');
      }
    }
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
                  httpHeaders: const {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  },
                  placeholder: (context, url) =>
                      const SkeletonBox(width: 76, height: 76),
                  errorWidget: (context, url, error) => CachedNetworkImage(
                    imageUrl: _getRandomTravelImage(stop.name),
                    width: 76,
                    height: 76,
                    fit: BoxFit.cover,
                    errorWidget: (c, u, e) => TravelImageFallback(
                      title: stop.name,
                      icon: Icons.place_rounded,
                    ),
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
          size: const Size(2, double.infinity),
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
          const Expanded(
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

            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
              ),
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
