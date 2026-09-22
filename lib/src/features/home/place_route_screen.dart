import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/live_navigation_map.dart';
import '../../core/design/premium_components.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/road_route_service.dart';
import '../../core/utils/transport_utils.dart';
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
  bool _isOffRoute = false;
  bool _isTrackingMode = false;
  GeoPoint? _initialOverviewPoint;
  bool _hasUserManuallyToggledTracking = false;
  DateTime? _lastRerouteAt;
  DateTime? _lastTrafficRefreshAt;
  int _routeRequestToken = 0;
  bool _isTrafficRefreshing = false;
  bool _hasInitialAccurateRoute = false;
  bool _hasNotifiedArrival = false;
  RouteTravelMode _travelMode = RouteTravelMode.driving;

  @override
  void initState() {
    super.initState();
    final profileTransport =
        ref.read(touristProfileProvider).valueOrNull?.transportPreference;
    _travelMode = routeTravelModeFor(profileTransport);

    final cached = ref.read(currentPositionProvider).valueOrNull;
    if (cached != null) {
      _currentPoint = GeoPoint(latitude: cached.latitude, longitude: cached.longitude);
      if (cached.speed >= 1.0 && cached.heading >= 0) {
        _currentHeading = cached.heading;
      }
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _startLiveNavigation();
      }
    });
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    super.dispose();
  }

  Future<void> _startLiveNavigation() async {
    final service = ref.read(locationServiceProvider);
    final place = ref.read(selectedNearbyPlaceProvider);
    // Start live high-accuracy satellite stream with foreground service for background alerts
    final stream = await service.positionStream(
      distanceFilterMeters: 0,
      enableForegroundService: true,
      foregroundTitle: place != null ? 'Rumbo a ${place.name}' : 'Navegación en curso - VibeTours',
      foregroundText: 'VibeTours te avisará cuando estés cerca de tu destino.',
    );
    if (mounted && stream != null) {
      await _positionSubscription?.cancel();
      _positionSubscription = stream.listen(_handlePositionUpdate);
    }

    final initialPosition = await service.currentPosition();
    if (!mounted) return;

    if (initialPosition != null) {
      setState(() {
        _currentPoint ??= _pointFromPosition(initialPosition);
        if (_currentHeading == null &&
            initialPosition.speed >= 1.0 &&
            initialPosition.heading >= 0) {
          _currentHeading = initialPosition.heading;
        }
      });

      // When the stream is active, wait for its first reliable fix. The
      // one-shot currentPosition can be stale and would otherwise produce a
      // first route that is immediately replaced by a second route.
      if (stream == null &&
          initialPosition.accuracy <= 25.0 &&
          !_hasInitialAccurateRoute) {
        _hasInitialAccurateRoute = true;
        await _recalculateRoute(force: true);
      }
    }

    // Safety fallback: if no fix arrives within 1.5 seconds, calculate route with best available point
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted && !_hasInitialAccurateRoute && _liveRoute == null && _currentPoint != null) {
        _hasInitialAccurateRoute = true;
        unawaited(_recalculateRoute(force: true));
      }
    });
  }

  GeoPoint _pointFromPosition(Position position) {
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }

  void _handlePositionUpdate(Position position) {
    final point = _pointFromPosition(position);
    if (!mounted) return;

    _currentPoint = point;
    if (position.speed >= 1.0 && position.heading >= 0) {
      if (_currentHeading == null ||
          ((position.heading - _currentHeading!).abs() > 5.0 &&
           (360.0 - (position.heading - _currentHeading!).abs()) > 5.0)) {
        _currentHeading = position.heading;
      }
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
      if (position.speed >= 1.2 || movedDist >= 15.0) {
        _isTrackingMode = true;
      }
    }

    setState(() {});

    final place = ref.read(selectedNearbyPlaceProvider);
    if (place == null) return;

    final distanceToDest = Geolocator.distanceBetween(
      point.latitude,
      point.longitude,
      place.location.latitude,
      place.location.longitude,
    );
    if (distanceToDest <= 45.0 && !_hasNotifiedArrival) {
      _hasNotifiedArrival = true;
      NotificationService.instance.showProximityNotification(
        title: '🏁 ¡Has llegado a ${place.name}!',
        body: 'Estás muy cerca de tu destino seleccionado en Lugares cercanos.',
        id: 1100,
        payload: 'place:${place.name}',
      );
    }

    // The first route must use a reliable stream fix.
    if (!_hasInitialAccurateRoute) {
      if (position.accuracy > 25.0) return;
      _hasInitialAccurateRoute = true;
      if (!_isRouting) {
        unawaited(_recalculateRoute(force: true));
      }
      return;
    }

    final route = _liveRoute;
    if (route == null) {
      if (_canReroute(DateTime.now())) {
        unawaited(_recalculateRoute(force: true));
      }
      return;
    }

    final distanceToRoute = _distanceToRouteMeters(point, route.geometry);
    final isOffRoute = distanceToRoute > 60;
    if (isOffRoute) {
      if (_canReroute(DateTime.now(), isOffRoute: true)) {
        unawaited(_recalculateRoute(force: true, markOffRoute: true));
      }
    } else {
      final now = DateTime.now();
      final routeSupportsLiveTraffic =
          _travelMode == RouteTravelMode.driving ||
          _travelMode == RouteTravelMode.taxi;
      final refreshTraffic =
          routeSupportsLiveTraffic &&
          _routeService.hasLiveTrafficProvider &&
          now.difference(
                _lastTrafficRefreshAt ?? DateTime.fromMillisecondsSinceEpoch(0),
              ) >
              const Duration(minutes: 2);
      if (refreshTraffic && !_isTrafficRefreshing && route.geometry.length >= 2) {
        unawaited(
          _refreshTrafficInBackground(
            baseRoute: route,
            origin: point,
            destination: place.location,
            placeName: place.name,
            requestToken: _routeRequestToken,
            travelMode: _travelMode,
          ),
        );
      }
    }
  }

  bool _canReroute(DateTime now, {bool isOffRoute = false}) {
    if (_isRouting) return false;
    final last = _lastRerouteAt;
    if (last == null) return true;
    final minInterval = isOffRoute
        ? const Duration(seconds: 15)
        : const Duration(seconds: 30);
    return now.difference(last) > minInterval;
  }

  Future<void> _recalculateRoute({
    bool force = false,
    bool markOffRoute = false,
  }) async {
    if (_isRouting) return;
    final place = ref.read(selectedNearbyPlaceProvider);
    if (place == null) return;

    var origin = _currentPoint;
    if (origin == null) {
      final position = await ref.read(locationServiceProvider).currentPosition();
      if (!mounted || position == null) return;
      origin = _pointFromPosition(position);
      setState(() {
        _currentPoint = origin;
      });
    }

    final destination = place.location;

    // Validate non-zero coordinates before navigation
    final isZeroOrigin = origin.latitude == 0 && origin.longitude == 0;
    final isZeroDest = destination.latitude == 0 && destination.longitude == 0;
    if (isZeroOrigin || isZeroDest) {
      return;
    }

    setState(() {
      _isRouting = true;
      _isOffRoute = markOffRoute;
    });

    final requestToken = ++_routeRequestToken;
    final travelMode = _travelMode;
    late final RoadRouteResult route;

    try {
      route = await _routeService
          .resolveRoute(
            [origin, destination],
            // Get the road geometry first. Traffic is requested below in the
            // background so the first visible route is not delayed or replaced.
            preferLiveTraffic: false,
            forceRefresh: force,
            originHeading: _currentHeading,
            travelMode: travelMode,
          )
          .timeout(const Duration(seconds: 8));
    } catch (error) {
      debugPrint('[nearby-route] Error calculando ruta: $error');
      if (mounted && requestToken == _routeRequestToken) {
        setState(() {
          _isRouting = false;
        });
      }
      return;
    }

    if (!mounted || requestToken != _routeRequestToken) return;

    final currentPlace = ref.read(selectedNearbyPlaceProvider);
    if (currentPlace?.name != place.name) {
      setState(() => _isRouting = false);
      return;
    }

    setState(() {
      _liveRoute = route;
      _lastRerouteAt = DateTime.now();
      _lastTrafficRefreshAt = DateTime.now();
      _isRouting = false;
      _isOffRoute = false;
    });

    final supportsLiveTraffic =
        _routeService.hasLiveTrafficProvider &&
        (travelMode == RouteTravelMode.driving ||
            travelMode == RouteTravelMode.taxi);
    if (supportsLiveTraffic && route.geometry.length >= 2) {
      unawaited(
        _refreshTrafficInBackground(
          baseRoute: route,
          origin: origin,
          destination: destination,
          placeName: place.name,
          requestToken: requestToken,
          travelMode: travelMode,
        ),
      );
    }
  }

  Future<void> _refreshTrafficInBackground({
    required RoadRouteResult baseRoute,
    required GeoPoint origin,
    required GeoPoint destination,
    required String placeName,
    required int requestToken,
    required RouteTravelMode travelMode,
  }) async {
    if (_isTrafficRefreshing) return;
    _isTrafficRefreshing = true;
    _lastTrafficRefreshAt = DateTime.now();
    try {
      final trafficRoute = await _routeService.resolveRoute(
        [origin, destination],
        preferLiveTraffic: true,
        forceRefresh: true,
        originHeading: _currentHeading,
        travelMode: travelMode,
      );

      final currentPlace = ref.read(selectedNearbyPlaceProvider);
      if (!mounted ||
          requestToken != _routeRequestToken ||
          !identical(_liveRoute, baseRoute) ||
          currentPlace?.name != placeName ||
          !trafficRoute.usesLiveTraffic) {
        return;
      }

      // Traffic may return a different alternative geometry. Keep the road
      // geometry already shown to the user and import only its ETA/status.
      setState(() {
        _liveRoute = baseRoute.withTrafficFrom(trafficRoute);
        _lastTrafficRefreshAt = DateTime.now();
      });
    } catch (error) {
      debugPrint('[nearby-traffic] Error actualizando trafico: $error');
    } finally {
      _isTrafficRefreshing = false;
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
      final delay = route?.trafficDelaySeconds ?? 0;
      final totalSecs = seconds + delay;
      final mins = (totalSecs / 60).round().clamp(1, 999);
      if (mins < 60) return '$mins min';
      return '${mins ~/ 60} h ${mins % 60} min';
    }
    final m = route?.distanceMeters ?? 0;
    if (m > 0) {
      final speedKmh = switch (route?.travelMode ?? _travelMode) {
        RouteTravelMode.walking => 4.2,
        RouteTravelMode.cycling => 15.0,
        RouteTravelMode.publicTransport => 22.0,
        RouteTravelMode.taxi => 28.0,
        RouteTravelMode.driving => 35.0,
      };
      final mins = (m / 1000.0 / speedKmh * 60).round().clamp(1, 180);
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
              fitPadding: const EdgeInsets.fromLTRB(32, 110, 32, 280),
              route: _liveRoute,
              currentLocation: _currentPoint,
              trackingMode: _isTrackingMode,
              trackingHeading: _currentHeading,
              showRecenterFab: false,
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
          // Unified responsive layout: FAB sits securely directly above GlassPanel
          Positioned(
            left: 16,
            right: 16,
            bottom: 18 + MediaQuery.of(context).padding.bottom,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                FloatingActionButton.extended(
                  heroTag: 'nearby_tracking_mode_fab',
                  elevation: 4,
                  backgroundColor: Theme.of(context).colorScheme.surface,
                  foregroundColor: AppTheme.primary,
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
                const SizedBox(height: 12),
                GlassPanel(
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
                        if (_isOffRoute) ...[
                          Text('•', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3))),
                          const Row(
                            children: [
                              Icon(Icons.alt_route_rounded, size: 14, color: Colors.orange),
                              SizedBox(width: 4),
                              Text('Desvío...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.orange)),
                            ],
                          ),
                        ] else if (_isRouting) ...[
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
                  const SizedBox(height: 10),
                  // Travel mode selector
                  Center(
                    child: SegmentedButton<RouteTravelMode>(
                      showSelectedIcon: false,
                      style: const ButtonStyle(
                        visualDensity: VisualDensity.compact,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      segments: const [
                        ButtonSegment(
                          value: RouteTravelMode.driving,
                          icon: Icon(Icons.directions_car_rounded, size: 18),
                          label: Text('Auto', style: TextStyle(fontSize: 12)),
                        ),
                        ButtonSegment(
                          value: RouteTravelMode.taxi,
                          icon: Icon(Icons.local_taxi_rounded, size: 18),
                          label: Text('Taxi', style: TextStyle(fontSize: 12)),
                        ),
                        ButtonSegment(
                          value: RouteTravelMode.cycling,
                          icon: Icon(Icons.directions_bike_rounded, size: 18),
                          label: Text('Bici', style: TextStyle(fontSize: 12)),
                        ),
                        ButtonSegment(
                          value: RouteTravelMode.walking,
                          icon: Icon(Icons.directions_walk_rounded, size: 18),
                          label: Text('Pie', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                      selected: {_travelMode},
                      onSelectionChanged: (newSelection) {
                        if (newSelection.isNotEmpty && newSelection.first != _travelMode) {
                          setState(() {
                            _travelMode = newSelection.first;
                            _liveRoute = null;
                          });
                          _recalculateRoute(force: true);
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
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
          ],
        ),
      ),
    ],
  ),
);
  }
}
