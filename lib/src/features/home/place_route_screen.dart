import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/live_navigation_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/road_route_service.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';
import '../shared/location_disclosure_dialog.dart';

class PlaceRouteScreen extends ConsumerStatefulWidget {
  const PlaceRouteScreen({super.key});

  @override
  ConsumerState<PlaceRouteScreen> createState() => _PlaceRouteScreenState();
}

class _PlaceRouteScreenState extends ConsumerState<PlaceRouteScreen> {
  final RoadRouteService _routeService = RoadRouteService();

  StreamSubscription<Position>? _positionSubscription;
  GeoPoint? _currentPoint;
  double? _currentHeading;
  RoadRouteResult? _liveRoute;
  bool _isRouting = false;
  bool _isTrackingMode = true;
  GeoPoint? _initialOverviewPoint;
  bool _hasUserManuallyToggledTracking = false;
  DateTime? _lastRerouteAt;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startLiveNavigation();
    });
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    super.dispose();
  }

  Future<void> _startLiveNavigation() async {
    final service = ref.read(locationServiceProvider);
    final initialPosition = await service.currentPosition();
    if (!mounted) return;

    if (initialPosition != null) {
      setState(() {
        _currentPoint = GeoPoint(
          latitude: initialPosition.latitude,
          longitude: initialPosition.longitude,
        );
      });
      unawaited(_recalculateRoute(force: true));
    }

    final stream = await service.positionStream(distanceFilterMeters: 0);
    if (!mounted || stream == null) return;
    await _positionSubscription?.cancel();
    _positionSubscription = stream.listen(_handlePositionUpdate);
  }

  void _handlePositionUpdate(Position position) {
    final point = GeoPoint(
      latitude: position.latitude,
      longitude: position.longitude,
    );
    if (!mounted) return;

    _currentPoint = point;
    if (position.heading >= 0) {
      _currentHeading = position.heading;
    }

    // Auto-transition to tracking mode when movement is detected
    if (!_isTrackingMode && !_hasUserManuallyToggledTracking) {
      _initialOverviewPoint ??= point;
      final movedDist = Geolocator.distanceBetween(
        _initialOverviewPoint!.latitude,
        _initialOverviewPoint!.longitude,
        point.latitude,
        point.longitude,
      );
      if (position.speed > 0.8 || movedDist > 12.0) {
        _isTrackingMode = true;
      }
    }

    setState(() {});

    final route = _liveRoute;
    if (route == null) {
      _recalculateRoute(force: true);
      return;
    }

    final distanceToRoute = _distanceToRouteMeters(point, route.geometry);
    final now = DateTime.now();
    // Real deviation threshold: 65m to prevent false recalculations on wide avenues
    final deviated = distanceToRoute > 65;

    if (deviated) {
      final last = _lastRerouteAt;
      if (last == null || now.difference(last) > const Duration(seconds: 4)) {
        unawaited(_recalculateRoute(force: true));
      }
    }
  }

  Future<void> _recalculateRoute({bool force = false}) async {
    if (_isRouting && !force) return;
    final place = ref.read(selectedNearbyPlaceProvider);
    if (place == null) return;

    var origin = _currentPoint;
    if (origin == null) {
      final position = await ref.read(locationServiceProvider).currentPosition();
      if (!mounted || position == null) return;
      origin = GeoPoint(latitude: position.latitude, longitude: position.longitude);
      setState(() {
        _currentPoint = origin;
      });
    }

    setState(() => _isRouting = true);

    try {
      final route = await _routeService.resolveRoute(
        [origin, place.location],
        preferLiveTraffic: true,
        forceRefresh: true,
        originHeading: _currentHeading,
      );
      if (!mounted) return;
      setState(() {
        _liveRoute = route;
        _lastRerouteAt = DateTime.now();
        _isRouting = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _isRouting = false);
      }
    }
  }

  double _distanceToRouteMeters(GeoPoint point, List<GeoPoint> route) {
    if (route.isEmpty) return double.infinity;
    if (route.length == 1) {
      return Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        route.first.latitude,
        route.first.longitude,
      );
    }
    var best = double.infinity;
    for (var i = 0; i < route.length - 1; i++) {
      final p1 = route[i];
      final p2 = route[i + 1];
      final d = _distanceToSegmentMeters(point, p1, p2);
      if (d < best) best = d;
    }
    return best;
  }

  double _distanceToSegmentMeters(GeoPoint point, GeoPoint start, GeoPoint end) {
    final dLat = end.latitude - start.latitude;
    final dLng = end.longitude - start.longitude;
    final lenSq = dLat * dLat + dLng * dLng;
    if (lenSq == 0) {
      return Geolocator.distanceBetween(
        point.latitude,
        point.longitude,
        start.latitude,
        start.longitude,
      );
    }
    final t = ((point.latitude - start.latitude) * dLat + (point.longitude - start.longitude) * dLng) / lenSq;
    final clampedT = t.clamp(0.0, 1.0);
    final projLat = start.latitude + clampedT * dLat;
    final projLng = start.longitude + clampedT * dLng;
    return Geolocator.distanceBetween(
      point.latitude,
      point.longitude,
      projLat,
      projLng,
    );
  }

  String _distanceLabel(NearbyPlace place, RoadRouteResult? route) {
    final current = _currentPoint;
    if (route != null && route.distanceMeters > 0) {
      final m = route.distanceMeters;
      if (m >= 1000) return '${(m / 1000).toStringAsFixed(1)} km';
      return '${m.round()} m';
    }
    if (current != null) {
      final m = Geolocator.distanceBetween(
        current.latitude,
        current.longitude,
        place.location.latitude,
        place.location.longitude,
      );
      if (m >= 1000) return '${(m / 1000).toStringAsFixed(1)} km';
      return '${m.round()} m';
    }
    return 'Calculando...';
  }

  String _timeLabel(RoadRouteResult? route) {
    final seconds = route?.travelTimeSeconds;
    if (seconds != null && seconds > 0) {
      final mins = (seconds / 60).round();
      if (mins < 60) return '$mins min';
      return '${mins ~/ 60} h ${mins % 60} min';
    }
    final m = route?.distanceMeters ?? 0;
    if (m > 0) {
      final mins = (m / 1000.0 / 4.2 * 60).round().clamp(1, 120);
      return '$mins min';
    }
    return 'Calculando...';
  }

  @override
  Widget build(BuildContext context) {
    final place = ref.watch(selectedNearbyPlaceProvider);
    final styleUrl = ref.watch(mapStyleProvider);

    if (place == null) {
      return PremiumScaffold(
        safeBottom: true,
        child: EmptyState(
          icon: Icons.place_outlined,
          title: 'Selecciona un lugar',
          body: 'Vuelve a Home y toca una tarjeta de Nearby Places.',
        ),
      );
    }

    return PremiumScaffold(
      child: Stack(
        children: [
          Positioned.fill(
            child: LiveNavigationMap(
              key: ValueKey('nearby-${place.name}-$styleUrl'),
              destination: place.location,
              destinationName: place.name,
              styleUrl: styleUrl,
              fitPadding: const EdgeInsets.fromLTRB(32, 110, 32, 300),
              route: _liveRoute,
              currentLocation: _currentPoint,
              trackingMode: _isTrackingMode,
              trackingHeading: _currentHeading,
            ),
          ),
          Positioned(
            left: 16,
            top: MediaQuery.of(context).padding.top + 8,
            child: IconButton.filledTonal(
              onPressed: () =>
                  context.canPop() ? context.pop() : context.go('/home'),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
          ),
          // Tracking mode toggle / Recenter FAB
          Positioned(
            right: 16,
            bottom: 236 + MediaQuery.of(context).padding.bottom,
            child: FloatingActionButton.extended(
              heroTag: 'nearby_tracking_mode_fab',
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              onPressed: () {
                setState(() {
                  _isTrackingMode = !_isTrackingMode;
                  _hasUserManuallyToggledTracking = true;
                });
              },
              icon: Icon(
                _isTrackingMode ? Icons.explore_rounded : Icons.my_location_rounded,
                color: AppTheme.primary,
              ),
              label: Text(
                _isTrackingMode ? 'Vista general' : 'Seguir ubicación',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 18 + MediaQuery.of(context).padding.bottom,
            child: GlassPanel(
              padding: const EdgeInsets.all(18),
              radius: 28,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppTheme.primary.withValues(
                          alpha: 0.18,
                        ),
                        child: const Icon(
                          Icons.place_rounded,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              place.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              place.type,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Telemetry Strip
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.route_rounded, size: 16, color: AppTheme.primary),
                            const SizedBox(width: 6),
                            Text(
                              _distanceLabel(place, _liveRoute),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 16, color: AppTheme.primary),
                            const SizedBox(width: 6),
                            Text(
                              _timeLabel(_liveRoute),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        if (_isRouting) ...[
                          Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                          const Row(
                            children: [
                              SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 6),
                              Text('Ruta...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: LiquidButton(
                          label: 'Recalcular',
                          icon: Icons.sync_rounded,
                          onPressed: () async {
                            final granted = await checkAndRequestLocationPermission(context, ref);
                            if (granted) {
                              _recalculateRoute(force: true);
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Se requiere ubicación para esta acción.')),
                              );
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      IconButton.filledTonal(
                        tooltip: 'Cerrar',
                        onPressed: () => context.go('/home'),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
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
