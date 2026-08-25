import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../services/road_route_service.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';
import 'premium_components.dart';
import 'app_theme.dart';

class OpenFreeRouteMap extends ConsumerStatefulWidget {
  const OpenFreeRouteMap({
    super.key,
    required this.points,
    required this.styleUrl,
    this.stops,
    this.labels = const [],
    this.activeIndex = 0,
    this.height = 220,
    this.borderRadius = 26,
    this.fitPadding = const EdgeInsets.fromLTRB(34, 44, 34, 44),
    this.showNumbers = true,
    this.myLocationEnabled = false,
    this.useRoadRouting = true,
    this.showPortWaypoints = true,
    this.routeOverride,
    this.currentLocation,
    this.trackingMode = false,
    this.trackingHeading,
    this.focusOnLast = false,
    this.onMapCreated,
    this.onPointSelected,
  });

  factory OpenFreeRouteMap.fromStops({
    Key? key,
    required List<TourStop> stops,
    required String styleUrl,
    int activeIndex = 0,
    double height = 220,
    double borderRadius = 26,
    EdgeInsets fitPadding = const EdgeInsets.fromLTRB(34, 44, 34, 44),
    bool showNumbers = true,
    bool myLocationEnabled = false,
    bool useRoadRouting = true,
    bool showPortWaypoints = true,
    RoadRouteResult? routeOverride,
    GeoPoint? currentLocation,
    bool trackingMode = false,
    double? trackingHeading,
    bool focusOnLast = false,
    void Function(MapLibreMapController)? onMapCreated,
    void Function(GeoPoint)? onPointSelected,
  }) {
    return OpenFreeRouteMap(
      key: key,
      points: [for (final stop in stops) stop.location],
      labels: [for (final stop in stops) stop.name],
      stops: stops,
      styleUrl: styleUrl,
      activeIndex: activeIndex,
      height: height,
      borderRadius: borderRadius,
      fitPadding: fitPadding,
      showNumbers: showNumbers,
      myLocationEnabled: myLocationEnabled,
      useRoadRouting: useRoadRouting,
      showPortWaypoints: showPortWaypoints,
      routeOverride: routeOverride,
      currentLocation: currentLocation,
      trackingMode: trackingMode,
      trackingHeading: trackingHeading,
      focusOnLast: focusOnLast,
      onMapCreated: onMapCreated,
      onPointSelected: onPointSelected,
    );
  }

  final List<GeoPoint> points;
  final List<String> labels;
  final List<TourStop>? stops;
  final String styleUrl;
  final int activeIndex;
  final double height;
  final double borderRadius;
  final EdgeInsets fitPadding;
  final bool showNumbers;
  final bool myLocationEnabled;
  final bool useRoadRouting;
  final bool showPortWaypoints;
  final RoadRouteResult? routeOverride;
  final GeoPoint? currentLocation;
  final bool trackingMode;
  final double? trackingHeading;
  final bool focusOnLast;
  final void Function(MapLibreMapController)? onMapCreated;
  final void Function(GeoPoint)? onPointSelected;

  @override
  ConsumerState<OpenFreeRouteMap> createState() => _OpenFreeRouteMapState();
}

class _OpenFreeRouteMapState extends ConsumerState<OpenFreeRouteMap>
    with AutomaticKeepAliveClientMixin, TickerProviderStateMixin {
  final RoadRouteService _routeService = RoadRouteService();
  MapLibreMapController? _controller;
  bool _styleLoaded = false;
  bool _hasMapError = false;
  bool _hasFitRoute = false;
  int _drawRequest = 0;
  int _currentAnimationId = 0;
  int _retryKey = 0;
  Timer? _loadTimeoutTimer;
  Line? _mainRouteLine;
  List<LatLng> _fullRouteGeometry = [];
  GeoPoint? _lastLocation;
  double? _lastCalculatedHeading;
  int _lastMatchedIndex = 0;

  late final AnimationController _smoothPosController;
  LatLng? _animStartPos;
  LatLng? _animTargetPos;

  double _getEffectiveHeading() {
    if (widget.trackingHeading != null && widget.trackingHeading! > 0) {
      return widget.trackingHeading!;
    }
    return _lastCalculatedHeading ?? 0.0;
  }

  void _updateCalculatedHeading(GeoPoint newLocation) {
    if (_lastLocation != null) {
      final distSq = _distanceSquared(
        LatLng(_lastLocation!.latitude, _lastLocation!.longitude),
        LatLng(newLocation.latitude, newLocation.longitude),
      );
      if (distSq > 0.0000001) {
        final startLat = _lastLocation!.latitude * (math.pi / 180.0);
        final startLng = _lastLocation!.longitude * (math.pi / 180.0);
        final endLat = newLocation.latitude * (math.pi / 180.0);
        final endLng = newLocation.longitude * (math.pi / 180.0);
        final dLng = endLng - startLng;
        final y = math.sin(dLng) * math.cos(endLat);
        final x = math.cos(startLat) * math.sin(endLat) - math.sin(startLat) * math.cos(endLat) * math.cos(dLng);
        final bearing = math.atan2(y, x) * (180.0 / math.pi);
        _lastCalculatedHeading = (bearing + 360.0) % 360.0;
      }
    }
    _lastLocation = newLocation;
  }

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _startMapLoadTimeout();
    _smoothPosController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    )..addListener(() {
        if (_animStartPos != null && _animTargetPos != null && mounted) {
          final t = _smoothPosController.value;
          final lerpedLat =
              _animStartPos!.latitude +
              (_animTargetPos!.latitude - _animStartPos!.latitude) * t;
          final lerpedLng =
              _animStartPos!.longitude +
              (_animTargetPos!.longitude - _animStartPos!.longitude) * t;
          _updateTrimmedRouteLine(LatLng(lerpedLat, lerpedLng));
        }
      });
  }

  void _startMapLoadTimeout() {
    _loadTimeoutTimer?.cancel();
    _loadTimeoutTimer = Timer(const Duration(seconds: 12), () {
      if (mounted && !_styleLoaded) {
        setState(() {
          _hasMapError = true;
        });
      }
    });
  }

  void _retryMapLoad() {
    setState(() {
      _hasMapError = false;
      _styleLoaded = false;
      _retryKey++;
    });
    _startMapLoadTimeout();
  }

  bool _isIncrementalUpdate(List<GeoPoint> oldPoints, List<GeoPoint> newPoints) {
    if (oldPoints.isEmpty || newPoints.length <= oldPoints.length) {
      return false;
    }
    for (int i = 0; i < oldPoints.length; i++) {
      if (oldPoints[i].latitude != newPoints[i].latitude ||
          oldPoints[i].longitude != newPoints[i].longitude) {
        return false;
      }
    }
    return true;
  }

  LatLng _projectPointOntoSegmentMetric(LatLng p, LatLng a, LatLng b) {
    final latRad = (a.latitude + b.latitude) / 2.0 * (math.pi / 180.0);
    final cosLat = math.cos(latRad);

    final dx = (b.longitude - a.longitude) * cosLat;
    final dy = b.latitude - a.latitude;

    if (dx == 0 && dy == 0) return a;

    final wx = (p.longitude - a.longitude) * cosLat;
    final wy = p.latitude - a.latitude;

    final t = (wx * dx + wy * dy) / (dx * dx + dy * dy);
    final clampedT = t.clamp(0.0, 1.0);

    return LatLng(
      a.latitude + clampedT * (b.latitude - a.latitude),
      a.longitude + clampedT * (b.longitude - a.longitude),
    );
  }

  double _metricDistanceMeters(LatLng p1, LatLng p2) {
    final latRad = (p1.latitude + p2.latitude) / 2.0 * (math.pi / 180.0);
    final cosLat = math.cos(latRad);
    final dLat = (p1.latitude - p2.latitude) * 111320.0;
    final dLng = (p1.longitude - p2.longitude) * 111320.0 * cosLat;
    return math.sqrt(dLat * dLat + dLng * dLng);
  }

  List<LatLng> _trimRouteGeometry(List<LatLng> geometry, LatLng currentPos) {
    if (geometry.length < 2) return geometry;

    final startIdx = _lastMatchedIndex.clamp(0, geometry.length - 2);
    final endIdx = math.min(startIdx + 25, geometry.length - 1);

    int bestIndex = startIdx;
    double minDistanceMeters = double.infinity;

    for (int i = startIdx; i < endIdx; i++) {
      final p1 = geometry[i];
      final p2 = geometry[i + 1];

      final proj = _projectPointOntoSegmentMetric(currentPos, p1, p2);
      final distMeters = _metricDistanceMeters(currentPos, proj);

      if (distMeters < minDistanceMeters) {
        minDistanceMeters = distMeters;
        bestIndex = i;
      }
    }

    if (minDistanceMeters < 120.0) {
      _lastMatchedIndex = math.max(_lastMatchedIndex, bestIndex);
    }

    final activeIndex = _lastMatchedIndex.clamp(0, geometry.length - 2);
    final p1 = geometry[activeIndex];
    final p2 = geometry[activeIndex + 1];
    final activeProj = _projectPointOntoSegmentMetric(currentPos, p1, p2);

    final remaining = geometry.sublist(activeIndex + 1);
    return [activeProj, ...remaining];
  }

  void _updateTrimmedRouteLine(LatLng currentPos) {
    final controller = _controller;
    if (controller == null || _mainRouteLine == null || _fullRouteGeometry.isEmpty) return;

    final trimmed = _trimRouteGeometry(_fullRouteGeometry, currentPos);
    if (trimmed.length >= 2) {
      try {
        controller.updateLine(
          _mainRouteLine!,
          LineOptions(
            geometry: trimmed,
          ),
        );
      } catch (e) {
        debugPrint('Error updating trimmed route line: $e');
      }
    }
  }

  @override
  void didUpdateWidget(covariant OpenFreeRouteMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeChanged =
        oldWidget.points != widget.points ||
        oldWidget.styleUrl != widget.styleUrl ||
        oldWidget.routeOverride != widget.routeOverride;
    
    final locationChanged = oldWidget.currentLocation != widget.currentLocation;
    final headingChanged = oldWidget.trackingHeading != widget.trackingHeading;
    final isIncremental = _isIncrementalUpdate(oldWidget.points, widget.points);

    if (oldWidget.styleUrl != widget.styleUrl) {
      _styleLoaded = false;
      if (_controller != null) {
        _controller!.setStyle(widget.styleUrl);
      }
    }

    if (routeChanged) {
      if (!isIncremental) {
        _hasFitRoute = false;
      }
      _drawRoute(
        focusActiveStop: oldWidget.activeIndex != widget.activeIndex && !routeChanged,
        isIncremental: isIncremental,
      );
    } else if (oldWidget.activeIndex != widget.activeIndex) {
      _drawRoute(
        focusActiveStop: true,
        isIncremental: isIncremental,
      );
    }

    if (locationChanged && widget.currentLocation != null) {
      _updateCalculatedHeading(widget.currentLocation!);
      final newPos = LatLng(
        widget.currentLocation!.latitude,
        widget.currentLocation!.longitude,
      );
      if (_animTargetPos != null) {
        _animStartPos = _animTargetPos;
      } else {
        _animStartPos = newPos;
      }
      _animTargetPos = newPos;
      _smoothPosController.forward(from: 0.0);
    }

    final trackingChanged = oldWidget.trackingMode != widget.trackingMode;
    if (trackingChanged) {
      if (widget.trackingMode && widget.currentLocation != null) {
        _controller?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude),
              zoom: 18.0,
              tilt: 60.0,
              bearing: _getEffectiveHeading(),
            ),
          ),
          duration: const Duration(milliseconds: 500),
        );
      } else if (!widget.trackingMode) {
        _hasFitRoute = false;
        _drawRoute();
      }
    } else if (widget.trackingMode && widget.currentLocation != null && (locationChanged || headingChanged)) {
      _controller?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude),
            zoom: 18.0,
            tilt: 60.0,
            bearing: _getEffectiveHeading(),
          ),
        ),
        duration: const Duration(milliseconds: 500),
      );
    }
  }

  @override
  void dispose() {
    _loadTimeoutTimer?.cancel();
    _smoothPosController.dispose();
    _currentAnimationId++;
    super.dispose();
  }

  Widget _buildStyleSelector() {
    final styleOption = ref.watch(mapStyleOptionProvider);
    IconData icon;
    switch (styleOption) {
      case MapStyleOption.auto:
        icon = Icons.hdr_auto_rounded;
        break;
      case MapStyleOption.day:
        icon = Icons.light_mode_rounded;
        break;
      case MapStyleOption.night:
        icon = Icons.dark_mode_rounded;
        break;
      case MapStyleOption.satellite:
        icon = Icons.satellite_alt_rounded;
        break;
    }

    return MenuAnchor(
      builder: (context, controller, child) => InteractiveBounce(
        onTap: () => controller.isOpen ? controller.close() : controller.open(),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.black.withValues(alpha: 0.6)
                : Colors.white.withValues(alpha: 0.75),
            shape: BoxShape.circle,
            border: Border.all(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white.withValues(alpha: 0.12)
                  : Colors.black.withValues(alpha: 0.08),
            ),
          ),
          child: Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        ),
      ),
      menuChildren: [
        _buildStyleMenuItem(MapStyleOption.auto, 'Auto (Sincronizado)', Icons.hdr_auto_rounded),
        _buildStyleMenuItem(MapStyleOption.day, 'Claro (Día)', Icons.light_mode_rounded),
        _buildStyleMenuItem(MapStyleOption.night, 'Oscuro (Noche)', Icons.dark_mode_rounded),
        _buildStyleMenuItem(MapStyleOption.satellite, 'Satélite', Icons.satellite_alt_rounded),
      ],
    );
  }

  Widget _buildStyleMenuItem(MapStyleOption option, String label, IconData icon) {
    final current = ref.watch(mapStyleOptionProvider);
    final isSelected = current == option;
    return MenuItemButton(
      onPressed: () => ref.read(mapStyleOptionProvider.notifier).setOption(option),
      leadingIcon: Icon(icon, size: 18, color: isSelected ? AppTheme.primary : null),
      child: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? AppTheme.primary : null,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final center = widget.points.isEmpty
        ? const GeoPoint(latitude: 10.9878, longitude: -74.7889)
        : (widget.focusOnLast ? widget.points.last : widget.points.first);
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: Stack(
          children: [
            KeyedSubtree(
              key: ValueKey('map_$_retryKey'),
              child: MapLibreMap(
                styleString: widget.styleUrl,
                initialCameraPosition: CameraPosition(
                  target: LatLng(center.latitude, center.longitude),
                  zoom: widget.focusOnLast ? 16 : (widget.points.length > 1 ? 13 : 15),
                ),
                compassEnabled: true,
                rotateGesturesEnabled: false,
                myLocationEnabled: widget.myLocationEnabled,
                onMapCreated: (controller) {
                  _controller = controller;
                  controller.onCircleTapped.add((circle) {
                    final latLng = circle.options.geometry;
                    if (latLng != null && widget.onPointSelected != null) {
                      widget.onPointSelected!(GeoPoint(
                        latitude: latLng.latitude,
                        longitude: latLng.longitude,
                      ));
                    }
                  });
                  if (widget.onMapCreated != null) {
                    widget.onMapCreated!(controller);
                  }
                },
                onStyleLoadedCallback: () {
                  _loadTimeoutTimer?.cancel();
                  if (mounted) {
                    setState(() {
                      _styleLoaded = true;
                      _hasMapError = false;
                    });
                  }
                  _drawRoute();
                },
              ),
            ),
            IgnorePointer(
              ignoring: _styleLoaded || _hasMapError,
              child: AnimatedOpacity(
                opacity: _styleLoaded ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 350),
                child: _buildMapSkeleton(),
              ),
            ),
            if (_hasMapError) _buildMapErrorOverlay(),
            if (_styleLoaded)
              Positioned(
                top: 12,
                right: 12,
                child: _buildStyleSelector(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(widget.borderRadius),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Cargando mapa...',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapErrorOverlay() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(widget.borderRadius),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.map_outlined,
              size: 32,
              color: Theme.of(context).colorScheme.error.withValues(alpha: 0.8),
            ),
            const SizedBox(height: 8),
            Text(
              'No se pudo cargar el estilo del mapa',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: _retryMapLoad,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Reintentar mapa', style: TextStyle(fontSize: 12)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _drawRoute({bool focusActiveStop = false, bool isIncremental = false}) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded || widget.points.isEmpty) return;
    final requestId = ++_drawRequest;
    final shouldResolveRoadRoute =
        widget.routeOverride == null &&
        widget.useRoadRouting &&
        widget.points.length > 1;
    if (widget.routeOverride != null) {
      try {
        await _paintRoute(
          widget.routeOverride!,
          focusActiveStop: focusActiveStop,
          fitRoute: true,
          isIncremental: isIncremental,
        );
      } catch (e) {
        debugPrint('Error painting route override: $e');
      }
      return;
    }

    if (!shouldResolveRoadRoute) {
      try {
        await _paintRoute(
          RoadRouteResult(geometry: widget.points),
          focusActiveStop: focusActiveStop,
          fitRoute: !_hasFitRoute,
          isIncremental: isIncremental,
        );
      } catch (e) {
        debugPrint('Error painting fallback route: $e');
      }
      return;
    }
    
    try {
      final resolvedRoute = await _routeService.resolveRoute(widget.points);
      if (!mounted || requestId != _drawRequest) return;
      
      if (resolvedRoute.geometry.isNotEmpty) {
        try {
          await _paintRoute(
            resolvedRoute,
            focusActiveStop: focusActiveStop,
            fitRoute: !_hasFitRoute,
            isIncremental: isIncremental,
          );
        } catch (e) {
          debugPrint('Error painting resolved route: $e');
        }
      }
    } catch (_) {
      try {
        await _paintRoute(
          RoadRouteResult(geometry: widget.points),
          focusActiveStop: focusActiveStop,
          fitRoute: !_hasFitRoute,
          isIncremental: isIncremental,
        );
      } catch (e) {
        debugPrint('Error painting fallback route on failure: $e');
      }
    }
  }

  Future<void> _paintRoute(
    RoadRouteResult route, {
    required bool focusActiveStop,
    required bool fitRoute,
    bool isIncremental = false,
  }) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded || widget.points.isEmpty) return;
    
    final animId = ++_currentAnimationId;
    _mainRouteLine = null;
    _lastMatchedIndex = 0;

    final points = [
      for (final point in widget.points)
        LatLng(point.latitude, point.longitude),
    ];
    
    _fullRouteGeometry = [
      for (final point in route.geometry)
        LatLng(point.latitude, point.longitude),
    ];
    if (_fullRouteGeometry.isEmpty) {
      _fullRouteGeometry = points;
    }

    final currentLocation = widget.currentLocation;
    final currentPoint = currentLocation == null
        ? null
        : LatLng(currentLocation.latitude, currentLocation.longitude);

    List<LatLng> routePoints = _fullRouteGeometry;
    if (currentPoint != null && _fullRouteGeometry.length >= 2) {
      routePoints = _trimRouteGeometry(_fullRouteGeometry, currentPoint);
    }

    final portPoints = [
      for (final port in route.ports)
        LatLng(port.location.latitude, port.location.longitude),
    ];
    final activeIndex = widget.activeIndex.clamp(0, points.length - 1).toInt();

    try {
      await controller.clearLines();
      await controller.clearCircles();
      await controller.clearSymbols();
    } catch (_) {}

    if (animId != _currentAnimationId || !mounted) return;

    // Map stops to their closest indices on the road geometry
    final stopIndices = <int>[];
    for (final stop in points) {
      int closestIndex = 0;
      double minDist = double.infinity;
      for (int i = 0; i < routePoints.length; i++) {
        final dist = _distanceSquared(stop, routePoints[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }
      stopIndices.add(closestIndex);
    }

    final drawnStops = <int>{};

    int splitIndex = 0;
    if (isIncremental && routePoints.isNotEmpty && points.length > 1) {
      final lastStopPoint = points[points.length - 2];
      double minDist = double.infinity;
      for (int i = 0; i < routePoints.length; i++) {
        final dist = _distanceSquared(lastStopPoint, routePoints[i]);
        if (dist < minDist) {
          minDist = dist;
          splitIndex = i;
        }
      }
      splitIndex = splitIndex.clamp(0, routePoints.length - 1);

      // Pre-draw previous stops immediately without pop animation
      for (int i = 0; i < points.length - 1; i++) {
        try {
          await controller.addCircle(
            CircleOptions(
              geometry: points[i],
              circleRadius: i == activeIndex ? 11 : 8,
              circleColor: i == activeIndex ? '#007AFF' : '#FFFFFF',
              circleOpacity: 0.98,
              circleStrokeColor: '#007AFF',
              circleStrokeWidth: i == activeIndex ? 4 : 2.5,
            ),
          );
          if (widget.showNumbers) {
            await controller.addSymbol(
              SymbolOptions(
                geometry: points[i],
                textField: '${i + 1}',
                textSize: i == activeIndex ? 13 : 11,
                textColor: i == activeIndex ? '#FFFFFF' : '#007AFF',
                textHaloColor: i == activeIndex ? '#007AFF' : '#FFFFFF',
                textHaloWidth: 1.2,
              ),
            );
          }
        } catch (_) {}
        drawnStops.add(i);
      }
    }

    if (animId != _currentAnimationId || !mounted) return;

    for (final maritimeSegment in route.maritimeSegments) {
      final segmentPoints = [
        for (final point in maritimeSegment)
          LatLng(point.latitude, point.longitude),
      ];
      if (segmentPoints.length > 1) {
        try {
          await controller.addLine(
            LineOptions(
              geometry: segmentPoints,
              lineColor: '#FF9F0A',
              lineWidth: 5,
              lineOpacity: 0.94,
              lineJoin: 'round',
            ),
          );
        } catch (_) {}
      }
    }

    // Draw walking / hiking trail approach segments with Google Maps-style dotted trail
    for (final walkingSegment in route.walkingSegments) {
      final segmentPoints = [
        for (final point in walkingSegment)
          LatLng(point.latitude, point.longitude),
      ];
      if (segmentPoints.length > 1) {
        try {
          await controller.addLine(
            LineOptions(
              geometry: segmentPoints,
              lineColor: '#80B3FF',
              lineWidth: 3.5,
              lineOpacity: 0.85,
              lineJoin: 'round',
            ),
          );
          final dots = _generateWalkingDots(segmentPoints);
          if (dots.isNotEmpty) {
            await controller.addCircles([
              for (final dot in dots)
                CircleOptions(
                  geometry: dot,
                  circleRadius: 3.5,
                  circleColor: '#0055FF',
                  circleOpacity: 0.98,
                  circleStrokeWidth: 0,
                ),
            ]);
          }
        } catch (_) {}
      }
    }

    if (widget.showPortWaypoints && portPoints.isNotEmpty) {
      try {
        await controller.addCircles([
          for (final point in portPoints)
            CircleOptions(
              geometry: point,
              circleRadius: 9,
              circleColor: '#FF9F0A',
              circleOpacity: 0.98,
              circleStrokeColor: '#FFFFFF',
              circleStrokeWidth: 2.5,
            ),
        ]);
        await controller.addSymbols([
          for (var index = 0; index < route.ports.length; index++)
            SymbolOptions(
              geometry: portPoints[index],
              textField: 'P',
              textSize: 12,
              textColor: '#FFFFFF',
              textHaloColor: '#FF9F0A',
              textHaloWidth: 1.2,
            ),
        ]);
      } catch (_) {}
    }

    // Draw manual location indicator ONLY when native MapLibre location puck is disabled
    if (currentPoint != null && !widget.myLocationEnabled) {
      try {
        await controller.addCircles([
          CircleOptions(
            geometry: currentPoint,
            circleRadius: 18,
            circleColor: '#34C759',
            circleOpacity: 0.18,
            circleStrokeColor: '#34C759',
            circleStrokeWidth: 1.2,
          ),
          CircleOptions(
            geometry: currentPoint,
            circleRadius: 10,
            circleColor: '#34C759',
            circleOpacity: 0.98,
            circleStrokeColor: '#FFFFFF',
            circleStrokeWidth: 3,
          ),
        ]);
      } catch (_) {}
    }

    if (routePoints.length > 1) {
      final lineOptions = LineOptions(
        geometry: routePoints,
        lineColor: _routeColor(route),
        lineWidth: 6,
        lineOpacity: 0.96,
        lineJoin: 'round',
      );

      if (widget.routeOverride == null) {
        if (isIncremental) {
          final completedLinePoints = routePoints.sublist(0, (splitIndex + 1).clamp(1, routePoints.length));
          Line? mainLine;
          if (completedLinePoints.length > 1) {
            try {
              mainLine = await controller.addLine(
                LineOptions(
                  geometry: completedLinePoints,
                  lineColor: _routeColor(route),
                  lineWidth: 6,
                  lineOpacity: 0.96,
                  lineJoin: 'round',
                ),
              );
            } catch (_) {}
          }

          final newSegmentPoints = routePoints.sublist(splitIndex);
          if (newSegmentPoints.length > 1) {
            int currentSegmentIndex = 1;
            final totalNewPoints = newSegmentPoints.length;
            final stepSize = (totalNewPoints / 25).ceil();

            if (mainLine == null) {
              try {
                mainLine = await controller.addLine(
                  LineOptions(
                    geometry: [newSegmentPoints[0], newSegmentPoints[1]],
                    lineColor: _routeColor(route),
                    lineWidth: 6,
                    lineOpacity: 0.96,
                    lineJoin: 'round',
                  ),
                );
              } catch (_) {}
              currentSegmentIndex = 2;
            }

            while (mounted && animId == _currentAnimationId) {
              currentSegmentIndex += stepSize;
              if (currentSegmentIndex >= totalNewPoints) {
                if (mainLine != null) {
                  try {
                    await controller.updateLine(mainLine, lineOptions);
                  } catch (_) {}
                  _drawNewStopWithEffect(points.last, points.length - 1, activeIndex, animId);
                }
                break;
              }

              final visibleGeometry = [
                ...completedLinePoints,
                ...newSegmentPoints.sublist(1, currentSegmentIndex.clamp(1, newSegmentPoints.length)),
              ];

              if (mainLine != null) {
                try {
                  await controller.updateLine(
                    mainLine,
                    LineOptions(
                      geometry: visibleGeometry,
                      lineColor: _routeColor(route),
                      lineWidth: 6,
                      lineOpacity: 0.96,
                      lineJoin: 'round',
                    ),
                  );
                } catch (_) {}
              }

              await Future.delayed(const Duration(milliseconds: 16));
            }
            _mainRouteLine = mainLine;
          } else {
            _drawNewStopWithEffect(points.last, points.length - 1, activeIndex, animId);
            _mainRouteLine = mainLine;
          }
        } else {
          // Normal full tracing animation starting from stop 0
          if (!drawnStops.contains(0) && points.isNotEmpty) {
            _drawNewStopWithEffect(points.first, 0, activeIndex, animId);
            drawnStops.add(0);
          }

          Line? line;
          try {
            line = await controller.addLine(
              LineOptions(
                geometry: [routePoints[0], routePoints[1]],
                lineColor: _routeColor(route),
                lineWidth: 6,
                lineOpacity: 0.96,
                lineJoin: 'round',
              ),
            );
          } catch (_) {}

          int currentPoints = 2;
          final totalPoints = routePoints.length;
          final stepSize = (totalPoints / 35).ceil();

          while (mounted && animId == _currentAnimationId) {
            currentPoints += stepSize;
            if (currentPoints >= totalPoints) {
              if (line != null) {
                try {
                  await controller.updateLine(line, lineOptions);
                } catch (_) {}
              }
              for (int i = 0; i < points.length; i++) {
                if (!drawnStops.contains(i)) {
                  _drawNewStopWithEffect(points[i], i, activeIndex, animId);
                  drawnStops.add(i);
                }
              }
              break;
            }

            if (line != null) {
              try {
                final endIdx = currentPoints.clamp(1, routePoints.length);
                await controller.updateLine(
                  line,
                  LineOptions(
                    geometry: routePoints.sublist(0, endIdx),
                    lineColor: _routeColor(route),
                    lineWidth: 6,
                    lineOpacity: 0.96,
                    lineJoin: 'round',
                  ),
                );
              } catch (_) {}

              for (int i = 0; i < points.length; i++) {
                if (!drawnStops.contains(i) && currentPoints >= stopIndices[i]) {
                  _drawNewStopWithEffect(points[i], i, activeIndex, animId);
                  drawnStops.add(i);
                }
              }
            }

            await Future.delayed(const Duration(milliseconds: 16));
          }
          _mainRouteLine = line;
        }
      } else {
        try {
          _mainRouteLine = await controller.addLine(lineOptions);
        } catch (_) {}
        for (int i = 0; i < points.length; i++) {
          _drawNewStopWithEffect(points[i], i, activeIndex, animId);
        }
      }
    } else {
      if (points.isNotEmpty) {
        _drawNewStopWithEffect(points.first, 0, activeIndex, animId);
      }
    }
    if (widget.trackingMode && currentPoint != null) {
      _hasFitRoute = true;
      try {
        await controller.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: currentPoint,
              zoom: 18.0,
              tilt: 60.0,
              bearing: _getEffectiveHeading(),
            ),
          ),
          duration: const Duration(milliseconds: 650),
        );
      } catch (_) {}
    } else if (fitRoute && !_hasFitRoute) {
      _hasFitRoute = true;
      if (widget.focusOnLast && widget.points.isNotEmpty) {
        try {
          await controller.animateCamera(
            CameraUpdate.newLatLngZoom(
              LatLng(widget.points.last.latitude, widget.points.last.longitude),
              16.0,
            ),
            duration: const Duration(milliseconds: 800),
          );
        } catch (_) {}
      } else {
        final boundsPoints = [
          if (routePoints.isNotEmpty) ...routePoints else ...points,
          ...points,
          ...portPoints,
          ?currentPoint,
        ];
        try {
          final pos = await controller.queryCameraPosition();
          if (pos != null && (pos.tilt > 0 || pos.bearing != 0)) {
            await controller.animateCamera(
              CameraUpdate.newCameraPosition(
                CameraPosition(
                  target: pos.target,
                  zoom: pos.zoom,
                  tilt: 0.0,
                  bearing: 0.0,
                ),
              ),
              duration: const Duration(milliseconds: 300),
            );
          }
          
          final animDuration = isIncremental ? 1100 : 650;
          await controller.animateCamera(
            CameraUpdate.newLatLngBounds(
              _boundsFor(boundsPoints),
              left: widget.fitPadding.left,
              top: widget.fitPadding.top,
              right: widget.fitPadding.right,
              bottom: widget.fitPadding.bottom,
            ),
            duration: Duration(milliseconds: animDuration),
          );
        } catch (_) {}
      }
    } else if (points.length == 1 && currentPoint == null) {
      try {
        await controller.animateCamera(
          CameraUpdate.newLatLngZoom(points.first, 16),
          duration: const Duration(milliseconds: 450),
        );
      } catch (_) {}
    } else if (focusActiveStop) {
      try {
        await controller.animateCamera(
          CameraUpdate.newLatLngZoom(points[activeIndex], 15),
          duration: const Duration(milliseconds: 450),
        );
      } catch (_) {}
    }
  }

  Future<void> _drawNewStopWithEffect(LatLng location, int index, int activeIndex, int animId) async {
    final controller = _controller;
    if (controller == null || !mounted || animId != _currentAnimationId) return;

    final isSinglePoint = widget.points.length == 1;
    final isActive = index == activeIndex || isSinglePoint;
    final finalRadius = isSinglePoint ? 14.0 : (isActive ? 11.0 : 8.0);
    final finalStrokeWidth = isSinglePoint ? 4.0 : (isActive ? 4.0 : 2.5);
    final circleColor = isSinglePoint ? '#FF3B30' : (isActive ? '#007AFF' : '#FFFFFF');
    final strokeColor = isSinglePoint ? '#FFFFFF' : '#007AFF';

    Circle? circle;
    try {
      // Start very small for pop-in birth
      circle = await controller.addCircle(
        CircleOptions(
          geometry: location,
          circleRadius: finalRadius * 0.15,
          circleColor: circleColor,
          circleOpacity: 0.98,
          circleStrokeColor: strokeColor,
          circleStrokeWidth: finalStrokeWidth * 0.15,
        ),
      );
    } catch (_) {}

    if (circle == null || animId != _currentAnimationId || !mounted) return;

    // Fast elastic overshoot interpolation steps at 60fps (16ms delays)
    final steps = [0.45, 0.85, 1.25, 1.35, 1.15, 1.0];
    for (final scale in steps) {
      await Future.delayed(const Duration(milliseconds: 16));
      if (!mounted || animId != _currentAnimationId) return;
      try {
        if (controller.circles.contains(circle)) {
          await controller.updateCircle(
            circle,
            CircleOptions(
              circleRadius: finalRadius * scale,
              circleStrokeWidth: finalStrokeWidth * (scale > 1.0 ? 1.1 : scale),
            ),
          );
        }
      } catch (_) {}
    }

    if (animId != _currentAnimationId || !mounted) return;
    
    final emoji = isSinglePoint
        ? '📍'
        : ((widget.stops != null && index < widget.stops!.length)
            ? _getStopEmoji(widget.stops![index])
            : '');
    final label = isSinglePoint
        ? '📍 Ubicación Exacta'
        : (widget.showNumbers
            ? (emoji.isNotEmpty ? '$emoji ${index + 1}' : '${index + 1}')
            : emoji);

    if (label.isNotEmpty) {
      try {
        await controller.addSymbol(
          SymbolOptions(
            geometry: location,
            textField: label,
            textSize: isSinglePoint ? 14.0 : (isActive ? 13.0 : 11.0),
            textColor: isSinglePoint ? '#FF3B30' : (isActive ? '#FFFFFF' : '#007AFF'),
            textHaloColor: '#FFFFFF',
            textHaloWidth: 2.0,
            textOffset: const Offset(0, 1.2),
          ),
        );
      } catch (_) {}
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

  LatLngBounds _boundsFor(List<LatLng> points) {
    if (points.isEmpty) {
      return LatLngBounds(
        southwest: const LatLng(0, 0),
        northeast: const LatLng(0, 0),
      );
    }
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;
    for (final point in points.skip(1)) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }
    if ((maxLat - minLat).abs() < 0.0001 && (maxLng - minLng).abs() < 0.0001) {
      minLat -= 0.001;
      maxLat += 0.001;
      minLng -= 0.001;
      maxLng += 0.001;
    }
    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  List<LatLng> _generateWalkingDots(List<LatLng> points) {
    final dots = <LatLng>[];
    if (points.length < 2) return dots;

    for (int i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      final dLat = p2.latitude - p1.latitude;
      final dLng = p2.longitude - p1.longitude;
      final distDeg = math.sqrt(dLat * dLat + dLng * dLng);
      // Dot step ~ 0.00035 degrees (~35-40 meters)
      const step = 0.00035;
      final numSteps = (distDeg / step).round().clamp(1, 80);
      for (int s = 0; s <= numSteps; s++) {
        final t = s / numSteps;
        dots.add(LatLng(p1.latitude + dLat * t, p1.longitude + dLng * t));
      }
    }
    return dots;
  }

  double _distanceSquared(LatLng p1, LatLng p2) {
    final dLat = p1.latitude - p2.latitude;
    final dLng = p1.longitude - p2.longitude;
    return dLat * dLat + dLng * dLng;
  }

  String _routeColor(RoadRouteResult route) {
    return '#007AFF';
  }
}
