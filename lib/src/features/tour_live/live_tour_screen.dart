import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/road_route_service.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import 'tour_rating_dialog.dart';

class LiveTourScreen extends ConsumerStatefulWidget {
  const LiveTourScreen({super.key, required this.tourId});

  final String tourId;

  @override
  ConsumerState<LiveTourScreen> createState() => _LiveTourScreenState();
}

class _LiveTourScreenState extends ConsumerState<LiveTourScreen> {
  final RoadRouteService _routeService = RoadRouteService();

  StreamSubscription<Position>? _positionSubscription;
  Tour? _navigationTour;
  GeoPoint? _currentPoint;
  RoadRouteResult? _liveRoute;
  DateTime? _lastRerouteAt;
  DateTime? _lastTrafficRefreshAt;
  int? _liveRouteStopIndex;
  int _activeStop = 0;
  bool _handsFree = false;
  bool _isRouting = false;
  bool _isOffRoute = false;
  bool _locationStreamRequested = false;
  bool _noLandRouteAvailable = false;
  bool _isTrackingMode = false;
  bool _navigatingToHotel = false;
  double? _currentHeading;

  TourStop? _findHotelStop(Tour tour) {
    for (final stop in tour.stops) {
      if (stop.id == 'hotel_end') return stop;
    }
    for (final stop in tour.stops) {
      if (stop.id == 'hotel_start') return stop;
    }
    for (final stop in tour.stops.reversed) {
      if (stop.name.toLowerCase().contains('hotel')) return stop;
    }
    return null;
  }

  void _startHotelNavigation() {
    final tour = _navigationTour;
    if (tour == null) return;
    setState(() {
      _navigatingToHotel = true;
      _liveRoute = null;
      _liveRouteStopIndex = null;
    });
    _recalculateRoute(tour, force: true);
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final toursAsync = ref.watch(toursProvider);
    final mapStyle = ref.watch(mapStyleProvider);
    return PremiumScaffold(
      child: toursAsync.when(
        data: (tours) {
          final selected = ref.watch(selectedTourProvider);
          final tour = selected?.id == widget.tourId
              ? selected!
              : tours.firstWhere(
                  (item) => item.id == widget.tourId,
                  orElse: () => tours.first,
                );
          final stop = tour.stops[_activeStop];
          final progress = (_activeStop + 1) / tour.stops.length;
          _navigationTour = tour;
          _scheduleLiveNavigation(tour);
          final liveRoute = (_navigatingToHotel && _liveRouteStopIndex == -1) ||
                            (!_navigatingToHotel && _liveRouteStopIndex == _activeStop)
              ? _liveRoute
              : null;
          final mapPoints = _mapPointsFor(stop);
          return Stack(
            children: [
              Positioned.fill(
                child: OpenFreeRouteMap(
                  key: ValueKey('${tour.id}-$mapStyle-${_navigatingToHotel ? "hotel" : "stop"}'),
                  points: mapPoints,
                  labels: [
                    if (_currentPoint != null) 'Tu ubicacion',
                    _navigatingToHotel
                        ? (_findHotelStop(tour)?.name ?? 'Hotel')
                        : stop.name,
                  ],
                  activeIndex: _currentPoint == null ? 0 : 1,
                  styleUrl: mapStyle,
                  height: MediaQuery.of(context).size.height,
                  borderRadius: 0,
                  fitPadding: const EdgeInsets.fromLTRB(36, 108, 36, 360),
                  showNumbers: _currentPoint == null,
                  myLocationEnabled: true,
                  routeOverride: _noLandRouteAvailable || liveRoute == null ? const RoadRouteResult(geometry: []) : liveRoute,
                  currentLocation: _currentPoint,
                  useRoadRouting: false,
                  trackingMode: _isTrackingMode,
                  trackingHeading: _currentHeading,
                ),
              ),
              Positioned(
                right: 16,
                top: MediaQuery.of(context).padding.top + 8,
                child: FloatingActionButton.small(
                  heroTag: 'tracking_btn',
                  backgroundColor: Theme.of(context).colorScheme.surface,
                  onPressed: () {
                    setState(() {
                      _isTrackingMode = !_isTrackingMode;
                    });
                  },
                  child: Icon(
                    _isTrackingMode ? Icons.map_rounded : Icons.explore_rounded,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              Positioned(
                left: 16,
                top: MediaQuery.of(context).padding.top + 8,
                child: IconButton.filledTonal(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
              if (_findHotelStop(tour) != null && !_navigatingToHotel)
                Positioned(
                  right: 16,
                  bottom: 270,
                  child: FloatingActionButton.extended(
                    heroTag: 'return_hotel_fab',
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    onPressed: _startHotelNavigation,
                    icon: const Icon(Icons.hotel_rounded),
                    label: const Text('Regresar al hotel'),
                  ),
                ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 18,
                child: GlassPanel(
                  padding: const EdgeInsets.all(16),
                  child: _navigatingToHotel
                      ? _buildHotelNavigationPanel(context, tour)
                      : _buildStandardNavigationPanel(context, tour, stop, progress, liveRoute, l10n),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          icon: Icons.map_rounded,
          title: 'Mapa no disponible',
          body: error.toString(),
        ),
      ),
    );
  }

  void _scheduleLiveNavigation(Tour tour) {
    if (!_locationStreamRequested) {
      _locationStreamRequested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) unawaited(_startLiveNavigation());
      });
    }
    if (_liveRouteStopIndex != _activeStop && !_isRouting) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) unawaited(_recalculateRoute(tour, force: true));
      });
    }
  }

  Future<void> _startLiveNavigation() async {
    final service = ref.read(locationServiceProvider);
    final initialPosition = await service.currentPosition();
    if (!mounted) return;
    if (initialPosition != null) {
      setState(() {
        _currentPoint = _pointFromPosition(initialPosition);
      });
      final tour = _navigationTour;
      if (tour != null) {
        await _recalculateRoute(tour, force: true);
      }
    }
    final stream = await service.positionStream(distanceFilterMeters: 10);
    if (!mounted || stream == null) return;
    await _positionSubscription?.cancel();
    _positionSubscription = stream.listen(_handlePositionUpdate);
  }

  void _handlePositionUpdate(Position position) {
    final point = _pointFromPosition(position);
    if (!mounted) return;
    setState(() {
      _currentPoint = point;
      if (position.heading > 0) {
        _currentHeading = position.heading;
      }
    });
    final tour = _navigationTour;
    if (tour == null || tour.stops.isEmpty) return;
    final route = _liveRouteStopIndex == _activeStop ? _liveRoute : null;
    final distanceToRoute = route == null
        ? double.infinity
        : _distanceToRouteMeters(point, route.geometry);
    final now = DateTime.now();
    final refreshTraffic =
        route != null &&
        _routeService.hasLiveTrafficProvider &&
        now.difference(
              _lastTrafficRefreshAt ?? DateTime.fromMillisecondsSinceEpoch(0),
            ) >
            const Duration(minutes: 2);
    final deviated = distanceToRoute > 85;
    if (deviated || refreshTraffic || route == null) {
      if (_canReroute(now)) {
        if (deviated) {
          setState(() {
            _isOffRoute = true;
          });
        }
        unawaited(
          _recalculateRoute(
            tour,
            force: route == null || refreshTraffic,
            markOffRoute: deviated,
          ),
        );
      }
    }
  }

  Future<void> _recalculateRoute(
    Tour tour, {
    bool force = false,
    bool markOffRoute = false,
  }) async {
    if (_isRouting && !force) return;
    var origin = _currentPoint;
    if (origin == null) {
      final position = await ref
          .read(locationServiceProvider)
          .currentPosition();
      if (!mounted || position == null) return;
      origin = _pointFromPosition(position);
      setState(() {
        _currentPoint = origin;
      });
    }
    if (tour.stops.isEmpty) return;
    final stopIndex = _navigatingToHotel ? -1 : _activeStop;
    final hotelStop = _findHotelStop(tour);
    if (_navigatingToHotel && hotelStop == null) return;
    final destination = _navigatingToHotel ? hotelStop!.location : tour.stops[_activeStop].location;
    setState(() {
      _isRouting = true;
      _isOffRoute = markOffRoute;
    });
    final route = await _routeService.resolveRoute(
      [origin, destination],
      preferLiveTraffic: true,
      forceRefresh: true,
    );
    if (!mounted) return;
    
    final directDist = Geolocator.distanceBetween(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude,
    );
    
    bool isUnreachable = route.usedFallback && directDist > 20000;
    
    if (route.geometry.isNotEmpty) {
      final snapStart = Geolocator.distanceBetween(
        origin.latitude, origin.longitude,
        route.geometry.first.latitude, route.geometry.first.longitude,
      );
      if (snapStart > 50000) {
        isUnreachable = true;
      }
    }
    
    if (route.usesMaritimeTransfer && directDist > 500000) {
      isUnreachable = true;
    }

    setState(() {
      _liveRoute = route;
      _liveRouteStopIndex = stopIndex;
      _lastRerouteAt = DateTime.now();
      _lastTrafficRefreshAt = DateTime.now();
      _isRouting = false;
      _isOffRoute = false;
      _noLandRouteAvailable = isUnreachable;
    });
  }

  bool _canReroute(DateTime now) {
    final last = _lastRerouteAt;
    return !_isRouting &&
        (last == null || now.difference(last) > const Duration(seconds: 18));
  }

  List<GeoPoint> _mapPointsFor(TourStop stop) {
    final origin = _currentPoint;
    final destination = _navigatingToHotel
        ? (_findHotelStop(_navigationTour!)?.location ?? stop.location)
        : stop.location;
    if (origin == null) return [destination];
    return [origin, destination];
  }

  GeoPoint _pointFromPosition(Position position) {
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }

  String _distanceLabel(Tour tour, double progress, RoadRouteResult? route) {
    final meters = route?.distanceMeters ?? 0;
    if (meters > 0) {
      return '${(meters / 1000).toStringAsFixed(1)} km restantes';
    }
    if (_navigatingToHotel) return 'Por calcular';
    return '${(tour.distanceKm * (1 - progress)).toStringAsFixed(1)} km restantes';
  }

  String _timeLabel(Tour tour, double progress, RoadRouteResult? route) {
    final seconds = route?.travelTimeSeconds;
    if (seconds != null && seconds > 0) return _formatDuration(seconds);
    if (_navigatingToHotel) return 'Calculando...';
    final fallbackMinutes = ((tour.durationHours * 60) * (1 - progress))
        .round();
    return '$fallbackMinutes min';
  }

  String _trafficLabel(RoadRouteResult? route) {
    if (_isRouting) return 'Calculando trafico';
    if (!_routeService.hasLiveTrafficProvider) return 'Sin trafico en vivo';
    if (route == null || !route.usesLiveTraffic) return 'Trafico pendiente';
    final delayMinutes = ((route.trafficDelaySeconds ?? 0) / 60).round();
    final status = switch (route.trafficSeverity) {
      TrafficSeverity.clear => 'Trafico fluido',
      TrafficSeverity.moderate => 'Trafico moderado',
      TrafficSeverity.heavy => 'Trafico pesado',
      TrafficSeverity.severe => 'Trafico critico',
      TrafficSeverity.unavailable => 'Trafico no disponible',
    };
    if (delayMinutes <= 0) return status;
    return '$status +$delayMinutes min';
  }

  String _formatDuration(int seconds) {
    final minutes = (seconds / 60).round();
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final remaining = minutes % 60;
    if (remaining == 0) return '$hours h';
    return '$hours h $remaining min';
  }

  double _distanceToRouteMeters(GeoPoint point, List<GeoPoint> route) {
    if (route.isEmpty) return double.infinity;
    var best = double.infinity;
    for (final routePoint in route) {
      final distance = Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        routePoint.latitude,
        routePoint.longitude,
      );
      if (distance < best) best = distance;
    }
    return best;
  }

  Widget _buildHotelNavigationPanel(BuildContext context, Tour tour) {
    final hotelStop = _findHotelStop(tour);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Regresando al hotel',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            Icon(Icons.hotel_rounded, color: Theme.of(context).colorScheme.primary),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          hotelStop?.name ?? 'Hotel de alojamiento',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.route_rounded,
                label: _distanceLabel(tour, 0, _liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.schedule_rounded,
                label: _timeLabel(tour, 0, _liveRoute),
              ),
            if (_isOffRoute || _isRouting)
              _LiveChip(
                icon: Icons.alt_route_rounded,
                label: _isRouting ? 'Actualizando ruta' : 'Desvio detectado',
              ),
            if (_currentPoint != null)
              const _LiveChip(
                icon: Icons.gps_fixed_rounded,
                label: 'GPS live',
              )
            else
              const _LiveChip(
                icon: Icons.gps_not_fixed_rounded,
                label: 'Buscando GPS',
              ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: 'Reanudar Tour',
                icon: Icons.play_arrow_rounded,
                isPrimary: true,
                onPressed: () {
                  setState(() {
                    _navigatingToHotel = false;
                    _liveRoute = null;
                    _liveRouteStopIndex = null;
                  });
                  _recalculateRoute(tour, force: true);
                },
              ),
            ),
            const SizedBox(width: 10),
            IconButton.filledTonal(
              tooltip: 'Recalcular ruta al hotel',
              onPressed: () => _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStandardNavigationPanel(
    BuildContext context,
    Tour tour,
    TourStop stop,
    double progress,
    RoadRouteResult? liveRoute,
    AppLocalizations l10n,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                stop.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            Text('${_activeStop + 1}/${tour.stops.length}'),
          ],
        ),
        const SizedBox(height: 10),
        LinearProgressIndicator(
          value: progress,
          minHeight: 8,
          borderRadius: BorderRadius.circular(999),
        ),
        const SizedBox(height: 12),
        if (_noLandRouteAvailable)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Icon(Icons.directions_off_rounded, color: Theme.of(context).colorScheme.onErrorContainer),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No se puede calcular la ruta debido a que no hay ruta terrestre disponible.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.route_rounded,
                label: _distanceLabel(tour, progress, liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.schedule_rounded,
                label: _timeLabel(tour, progress, liveRoute),
              ),
            if (!_noLandRouteAvailable)
              _LiveChip(
                icon: Icons.traffic_rounded,
                label: _trafficLabel(liveRoute),
              ),
            if (_isOffRoute || _isRouting)
              _LiveChip(
                icon: Icons.alt_route_rounded,
                label: _isRouting
                    ? 'Actualizando ruta'
                    : 'Desvio detectado',
              ),
            if (_currentPoint != null)
              const _LiveChip(
                icon: Icons.gps_fixed_rounded,
                label: 'GPS live',
              )
            else
              const _LiveChip(
                icon: Icons.gps_not_fixed_rounded,
                label: 'Buscando GPS',
              ),
          ],
        ),
        if (!_noLandRouteAvailable)
          const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: LiquidButton(
                label: l10n.voiceGuide,
                icon: Icons.record_voice_over_rounded,
                onPressed: () async {
                  await ref.read(voiceGuideProvider).narrateStop(stop);
                },
              ),
            ),
            const SizedBox(width: 10),
            IconButton.filledTonal(
              tooltip: l10n.handsFree,
              onPressed: () => setState(() {
                _handsFree = !_handsFree;
              }),
              icon: Icon(
                _handsFree
                    ? Icons.hearing_rounded
                    : Icons.hearing_disabled_rounded,
              ),
            ),
            IconButton.filledTonal(
              tooltip: l10n.recalculate,
              onPressed: () =>
                  _recalculateRoute(tour, force: true),
              icon: const Icon(Icons.sync_rounded),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: LiquidButton(
            label: _activeStop == tour.stops.length - 1 ? 'Terminar tour' : l10n.nextStop,
            icon: _activeStop == tour.stops.length - 1 ? Icons.flag_rounded : Icons.arrow_forward_rounded,
            isPrimary: _activeStop == tour.stops.length - 1,
            onPressed: () {
              if (_activeStop == tour.stops.length - 1) {
                final currentUser = ref.read(authServiceProvider).currentUser;
                
                if (currentUser == null) {
                  context.pop(); // Invitados no pueden calificar
                  return;
                }

                final userTours = ref.read(userToursProvider).valueOrNull?.manualTours ?? [];
                final isOwnTour = userTours.any((t) => t.id == tour.id) || tour.id.startsWith('manual-');
                
                final userRatings = ref.read(userRatingsProvider(currentUser.id)).valueOrNull ?? [];
                final hasRated = userRatings.any((r) => r.tour.id == tour.id);
                
                if (isOwnTour || hasRated) {
                  context.pop(); // Si es su propio tour o ya lo calificó, simplemente salir
                } else {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => TourRatingDialog(tour: tour),
                  );
                }
              } else {
                setState(() {
                  _activeStop =
                      ((_activeStop + 1) % tour.stops.length)
                          .toInt();
                  _liveRoute = null;
                  _liveRouteStopIndex = null;
                  _isOffRoute = false;
                  _noLandRouteAvailable = false;
                });
                _recalculateRoute(tour, force: true);
              }
            },
          ),
        ),
      ],
    );
  }
}

class _LiveChip extends StatelessWidget {
  const _LiveChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16, color: AppTheme.primary),
      label: Text(label),
      visualDensity: VisualDensity.compact,
    );
  }
}
