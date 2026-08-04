import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../services/road_route_service.dart';
import '../../domain/models.dart';

class LiveNavigationMap extends ConsumerStatefulWidget {
  const LiveNavigationMap({
    super.key,
    required this.destination,
    required this.destinationName,
    required this.styleUrl,
    this.route,
    this.currentLocation,
    this.trackingMode = true,
    this.trackingHeading,
    this.fitPadding = const EdgeInsets.fromLTRB(36, 108, 36, 360),
    this.onMapCreated,
    this.onPointSelected,
  });

  final GeoPoint destination;
  final String destinationName;
  final String styleUrl;
  final RoadRouteResult? route;
  final GeoPoint? currentLocation;
  final bool trackingMode;
  final double? trackingHeading;
  final EdgeInsets fitPadding;
  final void Function(MapLibreMapController)? onMapCreated;
  final void Function(GeoPoint)? onPointSelected;

  @override
  ConsumerState<LiveNavigationMap> createState() => _LiveNavigationMapState();
}

class _LiveNavigationMapState extends ConsumerState<LiveNavigationMap> with AutomaticKeepAliveClientMixin {
  MapLibreMapController? _controller;
  bool _styleLoaded = false;
  bool _hasMapError = false;
  Line? _routeLine;
  List<LatLng> _fullGeometry = [];
  List<double> _cumulativeDistances = [];
  int _lastSegmentIndex = 0;
  int _retryKey = 0;
  Timer? _loadTimeoutTimer;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _startMapLoadTimeout();
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

  LatLngBounds _calculateBounds(List<LatLng> points) {
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  void _setRouteGeometry(List<LatLng> newPoints) {
    _fullGeometry = List.from(newPoints);
    _cumulativeDistances = [0.0];
    double total = 0.0;

    for (int i = 0; i < _fullGeometry.length - 1; i++) {
      final d = _metricDistanceMeters(_fullGeometry[i], _fullGeometry[i + 1]);
      total += d;
      _cumulativeDistances.add(total);
    }

    _lastSegmentIndex = 0;
  }

  List<LatLng> _getZeroGapTrimmedGeometry(LatLng currentPos) {
    if (_fullGeometry.length < 2) return _fullGeometry;

    final startIdx = _lastSegmentIndex.clamp(0, _fullGeometry.length - 2);
    final endIdx = math.min(startIdx + 25, _fullGeometry.length - 1);

    int bestSegment = startIdx;
    double minDist = double.infinity;

    for (int i = startIdx; i < endIdx; i++) {
      final a = _fullGeometry[i];
      final b = _fullGeometry[i + 1];

      final proj = _projectPointOntoSegmentMetric(currentPos, a, b);
      final dist = _metricDistanceMeters(currentPos, proj);

      if (dist < minDist) {
        minDist = dist;
        bestSegment = i;
      }
    }

    if (minDist < 120.0) {
      _lastSegmentIndex = math.max(_lastSegmentIndex, bestSegment);
    }

    final activeSegment = _lastSegmentIndex.clamp(0, _fullGeometry.length - 2);
    final a = _fullGeometry[activeSegment];
    final b = _fullGeometry[activeSegment + 1];
    final activeProj = _projectPointOntoSegmentMetric(currentPos, a, b);

    final remaining = _fullGeometry.sublist(activeSegment + 1);
    return [activeProj, ...remaining];
  }

  void _updateTrimmedRouteLine(LatLng currentPos) {
    final controller = _controller;
    if (controller == null || _routeLine == null || _fullGeometry.isEmpty) return;

    final trimmed = _getZeroGapTrimmedGeometry(currentPos);
    if (trimmed.length >= 2) {
      try {
        controller.updateLine(
          _routeLine!,
          LineOptions(
            geometry: trimmed,
          ),
        );
      } catch (e) {
        debugPrint('Error updating live navigation line: $e');
      }
    }
  }

  void _updateCameraPosition() {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;

    if (widget.trackingMode) {
      final target = widget.currentLocation != null
          ? LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude)
          : LatLng(widget.destination.latitude, widget.destination.longitude);

      controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: target,
            zoom: 17.5,
            tilt: 55.0,
            bearing: widget.trackingHeading ?? 0.0,
          ),
        ),
        duration: const Duration(milliseconds: 500),
      );
    } else {
      final currentLocation = widget.currentLocation;
      final currentPos = currentLocation != null
          ? LatLng(currentLocation.latitude, currentLocation.longitude)
          : null;
      final destPos = LatLng(widget.destination.latitude, widget.destination.longitude);

      final activeRemainingPoints = currentPos != null && _fullGeometry.length >= 2
          ? _getZeroGapTrimmedGeometry(currentPos)
          : _fullGeometry;

      final boundsPoints = <LatLng>[
        ?currentPos,
        destPos,
        ...activeRemainingPoints,
      ];

      if (boundsPoints.isNotEmpty) {
        final bounds = _calculateBounds(boundsPoints);

        controller.animateCamera(
          CameraUpdate.newLatLngBounds(
            bounds,
            left: widget.fitPadding.left,
            top: widget.fitPadding.top,
            right: widget.fitPadding.right,
            bottom: widget.fitPadding.bottom,
          ),
          duration: const Duration(milliseconds: 600),
        );
      }
    }
  }

  @override
  void didUpdateWidget(covariant LiveNavigationMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeChanged = oldWidget.route != widget.route ||
        oldWidget.destination != widget.destination ||
        oldWidget.styleUrl != widget.styleUrl;
    final locationChanged = oldWidget.currentLocation != widget.currentLocation;
    final headingChanged = oldWidget.trackingHeading != widget.trackingHeading;
    final trackingChanged = oldWidget.trackingMode != widget.trackingMode;

    if (oldWidget.styleUrl != widget.styleUrl) {
      _styleLoaded = false;
      _controller?.setStyle(widget.styleUrl);
    }

    if (routeChanged) {
      _renderLiveRoute();
    } else if (locationChanged && widget.currentLocation != null) {
      final currentPos = LatLng(
        widget.currentLocation!.latitude,
        widget.currentLocation!.longitude,
      );
      _updateTrimmedRouteLine(currentPos);
    }

    if (trackingChanged || (widget.trackingMode && (locationChanged || headingChanged)) || (!widget.trackingMode && locationChanged)) {
      _updateCameraPosition();
    }
  }

  @override
  void dispose() {
    _loadTimeoutTimer?.cancel();
    super.dispose();
  }

  Future<void> _renderLiveRoute() async {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;

    _routeLine = null;

    final routeGeom = widget.route?.geometry ?? [];
    final currentLocation = widget.currentLocation;
    final currentPos = currentLocation == null
        ? null
        : LatLng(currentLocation.latitude, currentLocation.longitude);
    final destPos = LatLng(widget.destination.latitude, widget.destination.longitude);

    final rawPoints = routeGeom.isNotEmpty
        ? [for (final p in routeGeom) LatLng(p.latitude, p.longitude)]
        : currentPos != null
            ? [currentPos, destPos]
            : [destPos];

    _setRouteGeometry(rawPoints);

    try {
      await controller.clearLines();
      await controller.clearCircles();
      await controller.clearSymbols();
    } catch (_) {}

    final lineGeometry = currentPos != null && _fullGeometry.length >= 2
        ? _getZeroGapTrimmedGeometry(currentPos)
        : _fullGeometry;

    // Draw Destination POI marker
    try {
      await controller.addCircle(
        CircleOptions(
          geometry: destPos,
          circleRadius: 12,
          circleColor: '#007AFF',
          circleOpacity: 0.98,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 3,
        ),
      );
      await controller.addSymbol(
        SymbolOptions(
          geometry: destPos,
          textField: '1',
          textSize: 13,
          textColor: '#FFFFFF',
          textHaloColor: '#007AFF',
          textHaloWidth: 1.2,
        ),
      );
    } catch (_) {}

    if (lineGeometry.length >= 2) {
      try {
        _routeLine = await controller.addLine(
          LineOptions(
            geometry: lineGeometry,
            lineColor: '#007AFF',
            lineWidth: 6,
            lineOpacity: 0.96,
            lineJoin: 'round',
          ),
        );
      } catch (_) {}
    }

    _updateCameraPosition();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final initialTarget = widget.currentLocation != null
        ? LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude)
        : LatLng(widget.destination.latitude, widget.destination.longitude);

    return Stack(
      children: [
        KeyedSubtree(
          key: ValueKey('live_map_$_retryKey'),
          child: MapLibreMap(
            styleString: widget.styleUrl,
            initialCameraPosition: CameraPosition(
              target: initialTarget,
              zoom: 17.5,
              tilt: 55.0,
              bearing: widget.trackingHeading ?? 0.0,
            ),
            compassEnabled: true,
            rotateGesturesEnabled: true,
            myLocationEnabled: true,
            onMapCreated: (controller) {
              _controller = controller;
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
              _renderLiveRoute();
            },
          ),
        ),
        if (!_styleLoaded && !_hasMapError)
          Container(
            color: Theme.of(context).colorScheme.surface,
            child: const Center(child: CircularProgressIndicator()),
          ),
        if (_hasMapError)
          Container(
            color: Theme.of(context).colorScheme.surface,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.map_outlined, size: 36, color: Colors.orange),
                  const SizedBox(height: 8),
                  const Text('Error cargando el mapa de navegación'),
                  TextButton.icon(
                    onPressed: _retryMapLoad,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reintentar'),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
