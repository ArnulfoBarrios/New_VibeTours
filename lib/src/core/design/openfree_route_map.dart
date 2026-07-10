import 'dart:async';
import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../services/road_route_service.dart';
import '../../domain/models.dart';

class OpenFreeRouteMap extends StatefulWidget {
  const OpenFreeRouteMap({
    super.key,
    required this.points,
    required this.styleUrl,
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
  }) {
    return OpenFreeRouteMap(
      key: key,
      points: [for (final stop in stops) stop.location],
      labels: [for (final stop in stops) stop.name],
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
    );
  }

  final List<GeoPoint> points;
  final List<String> labels;
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

  @override
  State<OpenFreeRouteMap> createState() => _OpenFreeRouteMapState();
}

class _OpenFreeRouteMapState extends State<OpenFreeRouteMap> {
  final RoadRouteService _routeService = RoadRouteService();
  MapLibreMapController? _controller;
  bool _styleLoaded = false;
  bool _hasFitRoute = false;
  int _drawRequest = 0;
  Timer? _animationTimer;

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

  void _cancelAnimationTimer() {
    _animationTimer?.cancel();
    _animationTimer = null;
  }

  @override
  void didUpdateWidget(covariant OpenFreeRouteMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeChanged =
        oldWidget.points != widget.points ||
        oldWidget.styleUrl != widget.styleUrl ||
        oldWidget.routeOverride != widget.routeOverride;
    
    final isIncremental = _isIncrementalUpdate(oldWidget.points, widget.points);

    if (routeChanged) {
      if (!isIncremental) {
        _hasFitRoute = false;
      }
    }
    if (routeChanged || oldWidget.activeIndex != widget.activeIndex) {
      _drawRoute(
        focusActiveStop:
            oldWidget.activeIndex != widget.activeIndex && !routeChanged,
        isIncremental: isIncremental,
      );
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
              bearing: widget.trackingHeading ?? 0.0,
            ),
          ),
          duration: const Duration(milliseconds: 1000),
        );
      } else if (!widget.trackingMode) {
        _hasFitRoute = false;
        _drawRoute();
      }
    } else if (widget.trackingMode && widget.currentLocation != null && widget.currentLocation != oldWidget.currentLocation) {
      _controller?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(widget.currentLocation!.latitude, widget.currentLocation!.longitude),
            zoom: 18.0,
            tilt: 60.0,
            bearing: widget.trackingHeading ?? 0.0,
          ),
        ),
        duration: const Duration(milliseconds: 1000),
      );
    }
  }

  @override
  void dispose() {
    _cancelAnimationTimer();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final center = widget.points.isEmpty
        ? const GeoPoint(latitude: 10.9878, longitude: -74.7889)
        : widget.points.first;
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: MapLibreMap(
          styleString: widget.styleUrl,
          initialCameraPosition: CameraPosition(
            target: LatLng(center.latitude, center.longitude),
            zoom: widget.points.length > 1 ? 13 : 15,
          ),
          compassEnabled: true,
          rotateGesturesEnabled: false,
          myLocationEnabled: widget.myLocationEnabled,
          onMapCreated: (controller) {
            _controller = controller;
          },
          onStyleLoadedCallback: () {
            _styleLoaded = true;
            _drawRoute();
          },
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
      await _paintRoute(
        widget.routeOverride!,
        focusActiveStop: focusActiveStop,
        fitRoute: true,
        isIncremental: isIncremental,
      );
      return;
    }
    if (!shouldResolveRoadRoute) return;
    final resolvedRoute = await _routeService.resolveRoute(widget.points);
    if (!mounted || requestId != _drawRequest) return;
    await _paintRoute(
      resolvedRoute,
      focusActiveStop: focusActiveStop,
      fitRoute: true,
      isIncremental: isIncremental,
    );
    if (resolvedRoute.geometry.isEmpty) {
      await _paintRoute(
        RoadRouteResult(geometry: widget.points),
        focusActiveStop: focusActiveStop,
        fitRoute: true,
        isIncremental: isIncremental,
      );
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
    
    _cancelAnimationTimer();

    final points = [
      for (final point in widget.points)
        LatLng(point.latitude, point.longitude),
    ];
    List<LatLng> routePoints = [
      for (final point in route.geometry)
        LatLng(point.latitude, point.longitude),
    ];
    final portPoints = [
      for (final port in route.ports)
        LatLng(port.location.latitude, port.location.longitude),
    ];
    final activeIndex = widget.activeIndex.clamp(0, points.length - 1).toInt();
    final currentLocation = widget.currentLocation;
    final currentPoint = currentLocation == null
        ? null
        : LatLng(currentLocation.latitude, currentLocation.longitude);
        
    if (widget.routeOverride != null && routePoints.isNotEmpty && currentPoint != null) {
      int closestIndex = 0;
      double minDist = double.infinity;
      for (int i = 0; i < routePoints.length; i++) {
        final d = _distanceSquared(currentPoint, routePoints[i]);
        if (d < minDist) {
          minDist = d;
          closestIndex = i;
        }
      }
      if (closestIndex > 0) {
        routePoints = [currentPoint, ...routePoints.skip(closestIndex)];
      }
    }

    await controller.clearLines();
    await controller.clearCircles();
    await controller.clearSymbols();

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

      // Pre-draw previous stops immediately without pop animation
      for (int i = 0; i < points.length - 1; i++) {
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
        drawnStops.add(i);
      }
    }

    for (final maritimeSegment in route.maritimeSegments) {
      final segmentPoints = [
        for (final point in maritimeSegment)
          LatLng(point.latitude, point.longitude),
      ];
      if (segmentPoints.length > 1) {
        await controller.addLine(
          LineOptions(
            geometry: segmentPoints,
            lineColor: '#FF9F0A',
            lineWidth: 5,
            lineOpacity: 0.94,
            lineJoin: 'round',
          ),
        );
      }
    }

    if (widget.showPortWaypoints && portPoints.isNotEmpty) {
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
    }

    if (currentPoint != null) {
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
          final completedLinePoints = routePoints.sublist(0, splitIndex + 1);
          Line? mainLine;
          if (completedLinePoints.length > 1) {
            mainLine = await controller.addLine(
              LineOptions(
                geometry: completedLinePoints,
                lineColor: _routeColor(route),
                lineWidth: 6,
                lineOpacity: 0.96,
                lineJoin: 'round',
              ),
            );
          }

          final newSegmentPoints = routePoints.sublist(splitIndex);
          if (newSegmentPoints.length > 1) {
            int currentSegmentIndex = 1;
            final totalNewPoints = newSegmentPoints.length;
            final stepSize = (totalNewPoints / 25).ceil();

            if (mainLine == null) {
              mainLine = await controller.addLine(
                LineOptions(
                  geometry: [newSegmentPoints[0], newSegmentPoints[1]],
                  lineColor: _routeColor(route),
                  lineWidth: 6,
                  lineOpacity: 0.96,
                  lineJoin: 'round',
                ),
              );
              currentSegmentIndex = 2;
            }

            _animationTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) async {
              if (!mounted || _controller == null) {
                timer.cancel();
                return;
              }

              currentSegmentIndex += stepSize;
              if (currentSegmentIndex >= totalNewPoints) {
                timer.cancel();
                _animationTimer = null;

                if (mounted && mainLine != null) {
                  await controller.updateLine(
                    mainLine,
                    lineOptions,
                  );
                  await _drawNewStopWithEffect(points.last, points.length - 1, activeIndex);
                }
                return;
              }

              final visibleGeometry = [
                ...completedLinePoints,
                ...newSegmentPoints.sublist(1, currentSegmentIndex),
              ];

              if (mounted && mainLine != null) {
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
              }
            });
          } else {
            await _drawNewStopWithEffect(points.last, points.length - 1, activeIndex);
          }
        } else {
          // Normal full tracing animation starting from stop 0
          if (!drawnStops.contains(0) && points.isNotEmpty) {
            await _drawNewStopWithEffect(points.first, 0, activeIndex);
            drawnStops.add(0);
          }

          final line = await controller.addLine(
            LineOptions(
              geometry: [routePoints[0], routePoints[1]],
              lineColor: _routeColor(route),
              lineWidth: 6,
              lineOpacity: 0.96,
              lineJoin: 'round',
            ),
          );

          int currentPoints = 2;
          final totalPoints = routePoints.length;
          final stepSize = (totalPoints / 35).ceil();

          _animationTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) async {
            if (!mounted || _controller == null) {
              timer.cancel();
              return;
            }

            currentPoints += stepSize;
            if (currentPoints >= totalPoints) {
              timer.cancel();
              _animationTimer = null;

              if (mounted) {
                await controller.updateLine(line, lineOptions);
                for (int i = 0; i < points.length; i++) {
                  if (!drawnStops.contains(i)) {
                    await _drawNewStopWithEffect(points[i], i, activeIndex);
                    drawnStops.add(i);
                  }
                }
              }
              return;
            }

            if (mounted) {
              await controller.updateLine(
                line,
                LineOptions(
                  geometry: routePoints.sublist(0, currentPoints),
                  lineColor: _routeColor(route),
                  lineWidth: 6,
                  lineOpacity: 0.96,
                  lineJoin: 'round',
                ),
              );

              for (int i = 0; i < points.length; i++) {
                if (!drawnStops.contains(i) && currentPoints >= stopIndices[i]) {
                  await _drawNewStopWithEffect(points[i], i, activeIndex);
                  drawnStops.add(i);
                }
              }
            }
          });
        }
      } else {
        await controller.addLine(lineOptions);
        for (int i = 0; i < points.length; i++) {
          await _drawNewStopWithEffect(points[i], i, activeIndex);
        }
      }
    } else {
      if (points.isNotEmpty) {
        await _drawNewStopWithEffect(points.first, 0, activeIndex);
      }
    }

    if (points.length == 1) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(points.first, 16),
        duration: const Duration(milliseconds: 450),
      );
      return;
    }
    
    if (widget.trackingMode && currentPoint != null) {
      _hasFitRoute = true;
      await controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: currentPoint,
            zoom: 18.0,
            tilt: 60.0,
            bearing: widget.trackingHeading ?? 0.0,
          ),
        ),
        duration: const Duration(milliseconds: 650),
      );
    } else if (fitRoute && !_hasFitRoute) {
      _hasFitRoute = true;
      final boundsPoints = [
        if (routePoints.isNotEmpty) ...routePoints else ...points,
        ...points,
        ...portPoints,
        ?currentPoint,
      ];
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
    } else if (focusActiveStop) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(points[activeIndex], 15),
        duration: const Duration(milliseconds: 450),
      );
    }
  }

  Future<void> _drawNewStopWithEffect(LatLng location, int index, int activeIndex) async {
    final controller = _controller;
    if (controller == null || !mounted) return;

    final isActive = index == activeIndex;
    final finalRadius = isActive ? 11.0 : 8.0;
    final finalStrokeWidth = isActive ? 4.0 : 2.5;
    final circleColor = isActive ? '#007AFF' : '#FFFFFF';

    // Start with a small scale circle
    final circle = await controller.addCircle(
      CircleOptions(
        geometry: location,
        circleRadius: 3.0,
        circleColor: circleColor,
        circleOpacity: 0.98,
        circleStrokeColor: '#007AFF',
        circleStrokeWidth: 1.0,
      ),
    );

    // Dynamic pop-in scale animation (overshoot scale-up and settle down)
    await Future.delayed(const Duration(milliseconds: 60));
    if (!mounted) return;
    await controller.updateCircle(
      circle,
      CircleOptions(
        circleRadius: finalRadius * 1.3,
        circleStrokeWidth: finalStrokeWidth * 1.2,
      ),
    );

    await Future.delayed(const Duration(milliseconds: 60));
    if (!mounted) return;
    await controller.updateCircle(
      circle,
      CircleOptions(
        circleRadius: finalRadius,
        circleStrokeWidth: finalStrokeWidth,
      ),
    );

    if (widget.showNumbers) {
      await controller.addSymbol(
        SymbolOptions(
          geometry: location,
          textField: '${index + 1}',
          textSize: isActive ? 13.0 : 11.0,
          textColor: isActive ? '#FFFFFF' : '#007AFF',
          textHaloColor: isActive ? '#007AFF' : '#FFFFFF',
          textHaloWidth: 1.2,
        ),
      );
    }
  }

  LatLngBounds _boundsFor(List<LatLng> points) {
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
    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  double _distanceSquared(LatLng p1, LatLng p2) {
    final dLat = p1.latitude - p2.latitude;
    final dLng = p1.longitude - p2.longitude;
    return dLat * dLat + dLng * dLng;
  }

  String _routeColor(RoadRouteResult route) {
    if (!route.usesLiveTraffic) return '#007AFF';
    return switch (route.trafficSeverity) {
      TrafficSeverity.clear => '#34C759',
      TrafficSeverity.moderate => '#FFD60A',
      TrafficSeverity.heavy => '#FF9F0A',
      TrafficSeverity.severe => '#FF3B30',
      TrafficSeverity.unavailable => '#007AFF',
    };
  }
}
