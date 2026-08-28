import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/scheduler.dart';
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
    this.additionalWaypoints,
    this.trackingMode = true,
    this.trackingHeading,
    this.fitPadding = const EdgeInsets.fromLTRB(36, 108, 36, 440),
    this.onMapCreated,
    this.onPointSelected,
  });

  final GeoPoint destination;
  final String destinationName;
  final String styleUrl;
  final RoadRouteResult? route;
  final GeoPoint? currentLocation;
  final List<GeoPoint>? additionalWaypoints;
  final bool trackingMode;
  final double? trackingHeading;
  final EdgeInsets fitPadding;
  final void Function(MapLibreMapController)? onMapCreated;
  final void Function(GeoPoint)? onPointSelected;

  @override
  ConsumerState<LiveNavigationMap> createState() => _LiveNavigationMapState();
}

class _LiveNavigationMapState extends ConsumerState<LiveNavigationMap>
    with AutomaticKeepAliveClientMixin, TickerProviderStateMixin {
  MapLibreMapController? _controller;
  bool _styleLoaded = false;
  bool _hasMapError = false;
  Line? _routeLine;
  Line? _travelledRouteLine;
  Circle? _userPuckCircle;
  Circle? _userPuckHalo;
  Circle? _destinationCircle;
  LatLng? _renderedDestination;
  List<LatLng> _fullGeometry = [];
  List<double> _cumulativeDistances = [];
  int _lastSegmentIndex = 0;
  int _retryKey = 0;
  Timer? _loadTimeoutTimer;

  // Walking approach segment annotations tracking
  final List<Line> _walkingLines = [];
  final List<Circle> _walkingDots = [];
  final List<Symbol> _walkingSymbols = [];
  final List<List<LatLng>> _initialWalkingSegments = [];

  // The location provider is intentionally event based to save battery.  These
  // fields turn its sparse updates into continuous map frames instead of moving
  // the puck and camera only when a new GPS fix arrives.
  late final Ticker _motionTicker;
  LatLng? _displayedPosition;
  LatLng? _motionStart;
  LatLng? _motionTarget;
  Duration? _motionStartedAt;
  Duration _motionDuration = Duration.zero;
  DateTime? _lastLocationTargetAt;
  double? _displayedBearing;
  double? _motionStartBearing;
  double? _motionTargetBearing;
  DateTime? _lastRouteTrimAt;
  DateTime? _lastPuckFrameAt;
  DateTime? _lastNativeCameraUpdateAt;
  LatLng? _pendingPuckPosition;
  bool _isUpdatingPuck = false;
  bool _isCreatingTravelledLine = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _motionTicker = createTicker(_onMotionFrame);
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

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  static double _normalizeBearing(double bearing) => (bearing % 360 + 360) % 360;

  static double _lerpBearing(double from, double to, double t) {
    final delta = ((_normalizeBearing(to) - _normalizeBearing(from) + 540) % 360) - 180;
    return _normalizeBearing(from + delta * t);
  }

  void _animateToLocation(LatLng target, double? bearing) {
    final now = DateTime.now();
    final current = _displayedPosition;
    final normalizedBearing = bearing == null ? null : _normalizeBearing(bearing);

    if (current == null) {
      _displayedPosition = target;
      _displayedBearing = normalizedBearing;
      _motionStart = target;
      _motionTarget = target;
      _lastLocationTargetAt = now;
      _renderNavigationFrame(target, _displayedBearing, forceRouteTrim: true);
      return;
    }

    // Estimate the next GPS cadence from the previous fix. The animation lasts
    // most of that cadence, avoiding the "move, freeze, jump" effect when the
    // platform sends fixes every few seconds.
    final previousTargetAt = _lastLocationTargetAt;
    final observedCadenceMs = previousTargetAt == null
        ? 500
        : now.difference(previousTargetAt).inMilliseconds;
    _lastLocationTargetAt = now;
    final durationMs = (observedCadenceMs * 0.95).round().clamp(300, 1200);

    _motionStart = current;
    _motionTarget = target;
    _motionStartedAt = null;
    _motionDuration = Duration(milliseconds: durationMs);
    _motionStartBearing = _displayedBearing ?? normalizedBearing;
    _motionTargetBearing = normalizedBearing ?? _displayedBearing;
    _animateTrackingCamera(
      target,
      normalizedBearing ?? _displayedBearing,
      duration: Duration(milliseconds: durationMs),
    );
    if (!_motionTicker.isActive) _motionTicker.start();
  }

  void _onMotionFrame(Duration elapsed) {
    final start = _motionStart;
    final target = _motionTarget;
    if (start == null || target == null) {
      _motionTicker.stop();
      return;
    }
    _motionStartedAt ??= elapsed;
    final elapsedMs = (elapsed - _motionStartedAt!).inMicroseconds / 1000;
    final rawT = _motionDuration.inMilliseconds == 0
        ? 1.0
        : (elapsedMs / _motionDuration.inMilliseconds).clamp(0.0, 1.0);
    // Ease-out keeps corrections subtle while the camera remains responsive.
    final t = 1 - math.pow(1 - rawT, 3).toDouble();
    final position = LatLng(
      _lerp(start.latitude, target.latitude, t),
      _lerp(start.longitude, target.longitude, t),
    );
    final startBearing = _motionStartBearing;
    final targetBearing = _motionTargetBearing;
    final bearing = startBearing != null && targetBearing != null
        ? _lerpBearing(startBearing, targetBearing, t)
        : targetBearing ?? startBearing;

    _displayedPosition = position;
    _displayedBearing = bearing;
    _renderNavigationFrame(position, bearing);

    if (rawT >= 1) {
      _motionTicker.stop();
    }
  }

  void _renderNavigationFrame(
    LatLng position,
    double? _, {
    bool forceRouteTrim = false,
  }) {
    final now = DateTime.now();
    if (forceRouteTrim ||
        _lastPuckFrameAt == null ||
        now.difference(_lastPuckFrameAt!) >= const Duration(milliseconds: 50)) {
      _lastPuckFrameAt = now;
      _queueUserPuckUpdate(position);
    }
    if (forceRouteTrim ||
        _lastRouteTrimAt == null ||
        now.difference(_lastRouteTrimAt!) >= const Duration(milliseconds: 120)) {
      _lastRouteTrimAt = now;
      _updateTrimmedRouteLine(position, updatePuck: false);
    }
  }

  LatLngBounds _calculateBounds(List<LatLng> points) {
    if (points.isEmpty) {
      return LatLngBounds(
        southwest: const LatLng(0, 0),
        northeast: const LatLng(0, 0),
      );
    }
    final validPoints = points.where((p) =>
      p.latitude >= -90.0 && p.latitude <= 90.0 &&
      p.longitude >= -180.0 && p.longitude <= 180.0 &&
      (p.latitude != 0.0 || p.longitude != 0.0)
    ).toList();

    final pts = validPoints.isNotEmpty ? validPoints : points;
    double minLat = pts.first.latitude;
    double maxLat = pts.first.latitude;
    double minLng = pts.first.longitude;
    double maxLng = pts.first.longitude;

    for (final p in pts) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    double latSpan = maxLat - minLat;
    double lngSpan = maxLng - minLng;
    if (latSpan < 0.008) {
      final mid = (minLat + maxLat) / 2.0;
      minLat = mid - 0.004;
      maxLat = mid + 0.004;
    }
    if (lngSpan < 0.008) {
      final mid = (minLng + maxLng) / 2.0;
      minLng = mid - 0.004;
      maxLng = mid + 0.004;
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
    // Search forward through sequential segments (up to 12 segments ahead for curves and wide avenues)
    final searchEndIdx = math.min(startIdx + 12, _fullGeometry.length - 1);

    int bestSegment = startIdx;
    double minDist = double.infinity;

    for (int i = startIdx; i < searchEndIdx; i++) {
      final a = _fullGeometry[i];
      final b = _fullGeometry[i + 1];

      final proj = _projectPointOntoSegmentMetric(currentPos, a, b);
      final dist = _metricDistanceMeters(currentPos, proj);

      if (dist < minDist) {
        minDist = dist;
        bestSegment = i;
      }
    }

    // Advance segment index when user is within the roadway corridor (up to 65m for multi-lane avenues and roundabouts)
    if (minDist <= 65.0) {
      _lastSegmentIndex = math.max(_lastSegmentIndex, bestSegment);
    }

    final activeSegment = _lastSegmentIndex.clamp(0, _fullGeometry.length - 2);
    final a = _fullGeometry[activeSegment];
    final b = _fullGeometry[activeSegment + 1];
    final activeProj = _projectPointOntoSegmentMetric(currentPos, a, b);

    final remaining = _fullGeometry.sublist(activeSegment + 1);
    final connectorDistance = _metricDistanceMeters(currentPos, activeProj);

    // If user is near the roadway (<= 35m), attach smoothly to GPS puck.
    // If user is off-road (> 35m), start cleanly at road geometry without cutting buildings.
    if (connectorDistance <= 35.0) {
      return [
        if (connectorDistance > 1.0) currentPos,
        activeProj,
        ...remaining,
      ];
    } else {
      if (_lastSegmentIndex == 0) {
        return _fullGeometry;
      }
      return [
        activeProj,
        ...remaining,
      ];
    }
  }

  List<LatLng> _getTravelledGeometry(LatLng currentPos) {
    if (_fullGeometry.length < 2 || _lastSegmentIndex == 0) return const [];

    final activeSegment = _lastSegmentIndex.clamp(0, _fullGeometry.length - 2);
    final activeProj = _projectPointOntoSegmentMetric(
      currentPos,
      _fullGeometry[activeSegment],
      _fullGeometry[activeSegment + 1],
    );

    // Do not draw travelled grey lines if user is off-road (> 65m)
    if (_metricDistanceMeters(currentPos, activeProj) > 65.0) {
      return const [];
    }

    return [..._fullGeometry.take(activeSegment + 1), activeProj];
  }

  Future<void> _createPuckCircles(LatLng currentPos) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;
    try {
      if (_userPuckHalo != null) {
        await controller.removeCircle(_userPuckHalo!);
        _userPuckHalo = null;
      }
      if (_userPuckCircle != null) {
        await controller.removeCircle(_userPuckCircle!);
        _userPuckCircle = null;
      }
    } catch (_) {}

    try {
      _userPuckHalo = await controller.addCircle(
        CircleOptions(
          geometry: currentPos,
          circleRadius: 18,
          circleColor: '#007AFF',
          circleOpacity: 0.20,
        ),
      );
      _userPuckCircle = await controller.addCircle(
        CircleOptions(
          geometry: currentPos,
          circleRadius: 9,
          circleColor: '#007AFF',
          circleOpacity: 1.0,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 3.5,
        ),
      );
    } catch (_) {}
  }

  void _queueUserPuckUpdate(LatLng currentPos) {
    _pendingPuckPosition = currentPos;
    if (_isUpdatingPuck) return;
    unawaited(_flushUserPuckUpdate());
  }

  Future<void> _flushUserPuckUpdate() async {
    _isUpdatingPuck = true;
    try {
      while (_pendingPuckPosition != null) {
        final nextPosition = _pendingPuckPosition!;
        _pendingPuckPosition = null;
        await _updateUserPuck(nextPosition);
      }
    } finally {
      _isUpdatingPuck = false;
    }
  }

  Future<void> _updateUserPuck(LatLng currentPos) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;

    if (_userPuckCircle == null) {
      await _createPuckCircles(currentPos);
    } else {
      try {
        if (_userPuckHalo != null) {
          await controller.updateCircle(
            _userPuckHalo!,
            CircleOptions(geometry: currentPos),
          );
        }
        await controller.updateCircle(
          _userPuckCircle!,
          CircleOptions(geometry: currentPos),
        );
      } catch (_) {
        // If circle was wiped by clearCircles() or map style reload, immediately recreate it!
        _userPuckCircle = null;
        _userPuckHalo = null;
        await _createPuckCircles(currentPos);
      }
    }
  }

  Future<void> _clearWalkingAnnotations() async {
    final controller = _controller;
    if (controller == null) return;
    for (final line in _walkingLines) {
      try {
        await controller.removeLine(line);
      } catch (_) {}
    }
    _walkingLines.clear();
    if (_walkingDots.isNotEmpty) {
      try {
        await controller.removeCircles(_walkingDots);
      } catch (_) {}
      _walkingDots.clear();
    }
    for (final sym in _walkingSymbols) {
      try {
        await controller.removeSymbol(sym);
      } catch (_) {}
    }
    _walkingSymbols.clear();
    _initialWalkingSegments.clear();
  }

  void _updateTrimmedWalkingSegments(LatLng currentPos) {
    final controller = _controller;
    if (controller == null || _initialWalkingSegments.isEmpty) return;

    // If user has advanced onto the main road geometry, clear walking approach graphics
    if (_lastSegmentIndex > 0) {
      unawaited(_clearWalkingAnnotations());
      return;
    }

    // Trim dots that the user has already traversed
    if (_walkingDots.isNotEmpty) {
      final dotsToRemove = <Circle>[];
      for (final dot in _walkingDots) {
        final dotPos = dot.options.geometry;
        if (dotPos != null) {
          final distToUser = _metricDistanceMeters(currentPos, dotPos);
          if (distToUser < 18.0) {
            dotsToRemove.add(dot);
          }
        }
      }
      if (dotsToRemove.isNotEmpty) {
        unawaited(() async {
          try {
            await controller.removeCircles(dotsToRemove);
            _walkingDots.removeWhere((d) => dotsToRemove.contains(d));
          } catch (_) {}
        }());
      }
    }

    // Trim the walking line from currentPos to the connection point
    for (int i = 0; i < _walkingLines.length && i < _initialWalkingSegments.length; i++) {
      final seg = _initialWalkingSegments[i];
      if (seg.length >= 2) {
        final endPoint = seg.last;
        final distToEnd = _metricDistanceMeters(currentPos, endPoint);
        if (distToEnd < 20.0) {
          unawaited(_clearWalkingAnnotations());
          break;
        } else {
          try {
            controller.updateLine(
              _walkingLines[i],
              LineOptions(geometry: [currentPos, endPoint]),
            );
          } catch (_) {}
        }
      }
    }
  }

  void _updateTrimmedRouteLine(
    LatLng currentPos, {
    bool updatePuck = true,
  }) {
    final controller = _controller;
    if (controller == null || _fullGeometry.isEmpty) return;

    if (updatePuck) _queueUserPuckUpdate(currentPos);

    _updateTrimmedWalkingSegments(currentPos);

    if (_routeLine != null) {
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

    final travelled = _getTravelledGeometry(currentPos);
    if (travelled.length >= 2) {
      if (_travelledRouteLine == null) {
        _createTravelledLine(controller, travelled);
      } else {
        try {
          controller.updateLine(
            _travelledRouteLine!,
            LineOptions(geometry: travelled),
          );
        } catch (_) {}
      }
    }
  }

  void _createTravelledLine(
    MapLibreMapController controller,
    List<LatLng> geometry,
  ) {
    if (_isCreatingTravelledLine) return;
    _isCreatingTravelledLine = true;
    unawaited(() async {
      try {
        _travelledRouteLine = await controller.addLine(
          LineOptions(
            geometry: geometry,
            lineColor: '#64748B',
            lineWidth: 7,
            lineOpacity: 0.8,
            lineJoin: 'round',
          ),
        );
      } catch (_) {
        // The map may be re-styling; the next GPS frame can retry safely.
      } finally {
        _isCreatingTravelledLine = false;
      }
    }());
  }

  void _animateTrackingCamera(
    LatLng target,
    double? bearing, {
    Duration duration = const Duration(milliseconds: 700),
  }) {
    final controller = _controller;
    if (controller == null || !_styleLoaded || !widget.trackingMode) return;

    final now = DateTime.now();
    if (_lastNativeCameraUpdateAt != null &&
        now.difference(_lastNativeCameraUpdateAt!) <
            const Duration(milliseconds: 120)) {
      return;
    }
    _lastNativeCameraUpdateAt = now;

    unawaited(
      controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: target,
            zoom: 17.2,
            tilt: 48.0,
            bearing: bearing ?? 0.0,
          ),
        ),
        duration: duration,
      ),
    );
  }

  void _updateCameraPosition() {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;

    if (widget.trackingMode) {
      final target = _displayedPosition ??
          (widget.currentLocation != null
              ? LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude)
              : LatLng(widget.destination.latitude, widget.destination.longitude));

      _animateTrackingCamera(
        target,
        _displayedBearing ?? widget.trackingHeading,
        duration: const Duration(milliseconds: 700),
      );
    } else {
      final currentLocation = widget.currentLocation;
      final currentPos = _displayedPosition ??
          (currentLocation != null
              ? LatLng(currentLocation.latitude, currentLocation.longitude)
              : null);
      final destPos = LatLng(widget.destination.latitude, widget.destination.longitude);

      final boundsPoints = <LatLng>[
        ?currentPos,
        destPos,
        ..._fullGeometry,
        if (widget.additionalWaypoints != null)
          ...widget.additionalWaypoints!.map((p) => LatLng(p.latitude, p.longitude)),
      ];

      if (boundsPoints.isNotEmpty) {
        final bounds = _calculateBounds(boundsPoints);
        unawaited(() async {
          try {
            // First, reset orientation facing North (0.0°) and 2D flat view (0.0° tilt)
            await controller.moveCamera(CameraUpdate.bearingTo(0.0));
            await controller.moveCamera(CameraUpdate.tiltTo(0.0));
            // Then fit the entire route within the viewport with bottom/top padding
            await controller.moveCamera(
              CameraUpdate.newLatLngBounds(
                bounds,
                left: widget.fitPadding.left,
                top: widget.fitPadding.top,
                right: widget.fitPadding.right,
                bottom: widget.fitPadding.bottom,
              ),
            );
          } catch (_) {}
        }());
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
      _routeLine = null;
      _travelledRouteLine = null;
      _isCreatingTravelledLine = false;
      _userPuckCircle = null;
      _userPuckHalo = null;
      _destinationCircle = null;
      _renderedDestination = null;
      _controller?.setStyle(widget.styleUrl);
    }

    if (routeChanged) {
      _renderLiveRoute();
    }

    if (locationChanged && widget.currentLocation != null) {
      final currentPos = LatLng(
        widget.currentLocation!.latitude,
        widget.currentLocation!.longitude,
      );
      _animateToLocation(currentPos, widget.trackingHeading);
      if (!widget.trackingMode) {
        _updateCameraPosition();
      }
    }

    if (trackingChanged || routeChanged || (widget.trackingMode && headingChanged && !locationChanged)) {
      _updateCameraPosition();
    }
  }

  @override
  void dispose() {
    _loadTimeoutTimer?.cancel();
    _motionTicker.dispose();
    super.dispose();
  }

  Future<void> _renderLiveRoute() async {
    final controller = _controller;
    if (controller == null || !_styleLoaded) return;

    final routeGeom = widget.route?.geometry ?? [];
    final currentLocation = widget.currentLocation;
    final currentPos = currentLocation == null
        ? null
        : LatLng(currentLocation.latitude, currentLocation.longitude);
    final destPos = LatLng(widget.destination.latitude, widget.destination.longitude);

    final rawPoints = routeGeom.length >= 2
        ? [for (final p in routeGeom) LatLng(p.latitude, p.longitude)]
        : <LatLng>[];

    _setRouteGeometry(rawPoints);

    // Fit the full geometry before waiting for platform annotation calls.
    // addCircle/addSymbol/addLine are asynchronous and must not delay the
    // fixed-mode camera from showing the entire route.
    if (!widget.trackingMode) {
      _updateCameraPosition();
    }

    final destinationChanged = _renderedDestination == null ||
        _metricDistanceMeters(_renderedDestination!, destPos) > 2;
    if (destinationChanged) {
      try {
        await controller.clearLines();
        await controller.clearCircles();
        await controller.clearSymbols();
      } catch (_) {}
      _routeLine = null;
      _travelledRouteLine = null;
      _userPuckCircle = null;
      _userPuckHalo = null;
      _destinationCircle = null;
      _renderedDestination = destPos;
    } else {
      // Atomic route line cleanup on reroutes to prevent old overlapping polylines
      if (_routeLine != null) {
        try {
          await controller.removeLine(_routeLine!);
        } catch (_) {}
        _routeLine = null;
      }
      if (_travelledRouteLine != null) {
        try {
          await controller.removeLine(_travelledRouteLine!);
        } catch (_) {}
        _travelledRouteLine = null;
      }
    }

    if (currentPos != null) {
      _displayedPosition ??= currentPos;
      _displayedBearing ??= widget.trackingHeading;
      _queueUserPuckUpdate(_displayedPosition!);
    }

    final visualPosition = _displayedPosition ?? currentPos;
    // Always trim the route line ahead of the user position in all camera modes
    final lineGeometry = visualPosition != null && _fullGeometry.length >= 2
        ? _getZeroGapTrimmedGeometry(visualPosition)
        : _fullGeometry;

    // Draw Destination POI marker
    if (_destinationCircle == null) {
      try {
        _destinationCircle = await controller.addCircle(
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
    }

    if (lineGeometry.length >= 2) {
      try {
        if (_routeLine == null) {
          _routeLine = await controller.addLine(
            LineOptions(
              geometry: lineGeometry,
              lineColor: '#007AFF',
              lineWidth: 7,
              lineOpacity: 0.96,
              lineJoin: 'round',
            ),
          );
        } else {
          await controller.updateLine(_routeLine!, LineOptions(geometry: lineGeometry));
        }
      } catch (_) {}
    } else if (_routeLine != null) {
      try {
        await controller.removeLine(_routeLine!);
      } catch (_) {}
      _routeLine = null;
    }

    if (visualPosition != null) {
      final travelled = _getTravelledGeometry(visualPosition);
      if (travelled.length >= 2) {
        try {
          if (_travelledRouteLine == null) {
            _travelledRouteLine = await controller.addLine(
              LineOptions(
                geometry: travelled,
                lineColor: '#64748B',
                lineWidth: 7,
                lineOpacity: 0.8,
                lineJoin: 'round',
              ),
            );
          } else {
            await controller.updateLine(
              _travelledRouteLine!,
              LineOptions(geometry: travelled),
            );
          }
        } catch (_) {}
      }
    }

    // Clear previous walking annotations before drawing new ones
    await _clearWalkingAnnotations();

    // Draw walking / hiking trail approach segments in live navigation
    final walkingSegments = widget.route?.walkingSegments ?? const [];
    for (final walkingSegment in walkingSegments) {
      final segmentPoints = [
        for (final point in walkingSegment)
          LatLng(point.latitude, point.longitude),
      ];
      if (segmentPoints.length > 1) {
        _initialWalkingSegments.add(segmentPoints);
        try {
          final line = await controller.addLine(
            LineOptions(
              geometry: segmentPoints,
              lineColor: '#60A5FA',
              lineWidth: 4,
              lineOpacity: 0.90,
              lineJoin: 'round',
            ),
          );
          _walkingLines.add(line);

          final dots = _generateWalkingDots(segmentPoints);
          if (dots.isNotEmpty) {
            final createdDots = await controller.addCircles([
              for (final dot in dots)
                CircleOptions(
                  geometry: dot,
                  circleRadius: 4.0,
                  circleColor: '#0055FF',
                  circleOpacity: 1.0,
                  circleStrokeWidth: 1.0,
                  circleStrokeColor: '#FFFFFF',
                ),
            ]);
            _walkingDots.addAll(createdDots);
          }
          final trailStart = segmentPoints.first;
          final sym = await controller.addSymbol(
            SymbolOptions(
              geometry: trailStart,
              textField: '🥾',
              textSize: 20,
              textColor: '#FFFFFF',
              textHaloColor: '#000000',
              textHaloWidth: 1.0,
            ),
          );
          _walkingSymbols.add(sym);
        } catch (_) {}
      }
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
              zoom: widget.trackingMode ? 17.2 : 13.5,
              tilt: widget.trackingMode ? 48.0 : 0.0,
              bearing: widget.trackingMode ? (widget.trackingHeading ?? 0.0) : 0.0,
            ),
            compassEnabled: false,
            rotateGesturesEnabled: true,
            myLocationEnabled: false,
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
              _updateCameraPosition();
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

  List<LatLng> _generateWalkingDots(List<LatLng> points) {
    final dots = <LatLng>[];
    if (points.length < 2) return dots;

    for (int i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      final dLat = p2.latitude - p1.latitude;
      final dLng = p2.longitude - p1.longitude;
      final distDeg = math.sqrt(dLat * dLat + dLng * dLng);
      // Dot step ~ 0.00025 degrees (~25 meters)
      const step = 0.00025;
      final numSteps = (distDeg / step).round().clamp(2, 100);
      for (int s = 0; s <= numSteps; s++) {
        final t = s / numSteps;
        dots.add(LatLng(p1.latitude + dLat * t, p1.longitude + dLng * t));
      }
    }
    return dots;
  }
}
