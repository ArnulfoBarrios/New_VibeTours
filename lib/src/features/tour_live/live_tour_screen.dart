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
          final liveRoute = _liveRouteStopIndex == _activeStop
              ? _liveRoute
              : null;
          final mapPoints = _mapPointsFor(stop);
          return Stack(
            children: [
              Positioned.fill(
                child: OpenFreeRouteMap(
                  key: ValueKey('${tour.id}-$mapStyle'),
                  points: mapPoints,
                  labels: [
                    if (_currentPoint != null) 'Tu ubicacion',
                    stop.name,
                  ],
                  activeIndex: _currentPoint == null ? 0 : 1,
                  styleUrl: mapStyle,
                  height: MediaQuery.of(context).size.height,
                  borderRadius: 0,
                  fitPadding: const EdgeInsets.fromLTRB(36, 108, 36, 360),
                  showNumbers: _currentPoint == null,
                  myLocationEnabled: true,
                  routeOverride: liveRoute,
                  currentLocation: _currentPoint,
                  useRoadRouting: liveRoute == null,
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
              Positioned(
                left: 16,
                right: 16,
                bottom: 18,
                child: GlassPanel(
                  padding: const EdgeInsets.all(16),
                  child: Column(
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
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _LiveChip(
                            icon: Icons.route_rounded,
                            label: _distanceLabel(tour, progress, liveRoute),
                          ),
                          _LiveChip(
                            icon: Icons.schedule_rounded,
                            label: _timeLabel(tour, progress, liveRoute),
                          ),
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
                              final userTours = ref.read(userToursProvider).valueOrNull?.manualTours ?? [];
                              final isOwnTour = userTours.any((t) => t.id == tour.id) || tour.id.startsWith('manual-');
                              
                              if (isOwnTour) {
                                context.pop(); // User's own tour, just exit
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
                              });
                              _recalculateRoute(tour, force: true);
                            }
                          },
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
    final stopIndex = _activeStop;
    final destination = tour.stops[stopIndex].location;
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
    setState(() {
      _liveRoute = route;
      _liveRouteStopIndex = stopIndex;
      _lastRerouteAt = DateTime.now();
      _lastTrafficRefreshAt = DateTime.now();
      _isRouting = false;
      _isOffRoute = false;
    });
  }

  bool _canReroute(DateTime now) {
    final last = _lastRerouteAt;
    return !_isRouting &&
        (last == null || now.difference(last) > const Duration(seconds: 18));
  }

  List<GeoPoint> _mapPointsFor(TourStop stop) {
    final origin = _currentPoint;
    if (origin == null) return [stop.location];
    return [origin, stop.location];
  }

  GeoPoint _pointFromPosition(Position position) {
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }

  String _distanceLabel(Tour tour, double progress, RoadRouteResult? route) {
    final meters = route?.distanceMeters ?? 0;
    if (meters > 0) {
      return '${(meters / 1000).toStringAsFixed(1)} km restantes';
    }
    return '${(tour.distanceKm * (1 - progress)).toStringAsFixed(1)} km restantes';
  }

  String _timeLabel(Tour tour, double progress, RoadRouteResult? route) {
    final seconds = route?.travelTimeSeconds;
    if (seconds != null && seconds > 0) return _formatDuration(seconds);
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
