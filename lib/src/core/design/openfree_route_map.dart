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

  @override
  State<OpenFreeRouteMap> createState() => _OpenFreeRouteMapState();
}

class _OpenFreeRouteMapState extends State<OpenFreeRouteMap> {
  final RoadRouteService _routeService = RoadRouteService();
  MapLibreMapController? _controller;
  bool _styleLoaded = false;
  bool _hasFitRoute = false;
  int _drawRequest = 0;

  @override
  void didUpdateWidget(covariant OpenFreeRouteMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeChanged =
        oldWidget.points != widget.points ||
        oldWidget.styleUrl != widget.styleUrl ||
        oldWidget.routeOverride != widget.routeOverride;
    if (routeChanged) {
      _hasFitRoute = false;
    }
    if (routeChanged || oldWidget.activeIndex != widget.activeIndex) {
      _drawRoute(
        focusActiveStop:
            oldWidget.activeIndex != widget.activeIndex && !routeChanged,
      );
    }
  }

  @override
  void dispose() {
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

  Future<void> _drawRoute({bool focusActiveStop = false}) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded || widget.points.isEmpty) return;
    final requestId = ++_drawRequest;
    final shouldResolveRoadRoute =
        widget.routeOverride == null &&
        widget.useRoadRouting &&
        widget.points.length > 1;
    final fallbackRoute = RoadRouteResult(geometry: widget.points);
    await _paintRoute(
      fallbackRoute,
      focusActiveStop: focusActiveStop,
      fitRoute: !shouldResolveRoadRoute,
    );
    if (widget.routeOverride != null) {
      await _paintRoute(
        widget.routeOverride!,
        focusActiveStop: focusActiveStop,
        fitRoute: true,
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
    );
  }

  Future<void> _paintRoute(
    RoadRouteResult route, {
    required bool focusActiveStop,
    required bool fitRoute,
  }) async {
    final controller = _controller;
    if (controller == null || !_styleLoaded || widget.points.isEmpty) return;
    final points = [
      for (final point in widget.points)
        LatLng(point.latitude, point.longitude),
    ];
    final routePoints = [
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
    await controller.clearLines();
    await controller.clearCircles();
    await controller.clearSymbols();
    if (routePoints.length > 1) {
      await controller.addLine(
        LineOptions(
          geometry: routePoints,
          lineColor: _routeColor(route),
          lineWidth: 6,
          lineOpacity: 0.96,
          lineJoin: 'round',
        ),
      );
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
    await controller.addCircles([
      for (var index = 0; index < points.length; index++)
        CircleOptions(
          geometry: points[index],
          circleRadius: index == activeIndex ? 11 : 8,
          circleColor: index == activeIndex ? '#007AFF' : '#FFFFFF',
          circleOpacity: 0.98,
          circleStrokeColor: '#007AFF',
          circleStrokeWidth: index == activeIndex ? 4 : 2.5,
        ),
    ]);
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
    if (widget.showNumbers) {
      await controller.addSymbols([
        for (var index = 0; index < points.length; index++)
          SymbolOptions(
            geometry: points[index],
            textField: '${index + 1}',
            textSize: index == activeIndex ? 13 : 11,
            textColor: index == activeIndex ? '#FFFFFF' : '#007AFF',
            textHaloColor: index == activeIndex ? '#007AFF' : '#FFFFFF',
            textHaloWidth: 1.2,
          ),
      ]);
    }
    if (points.length == 1) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(points.first, 16),
        duration: const Duration(milliseconds: 450),
      );
      return;
    }
    if (fitRoute && !_hasFitRoute) {
      _hasFitRoute = true;
      final boundsPoints = [
        if (routePoints.isNotEmpty) ...routePoints else ...points,
        ...points,
        ...portPoints,
        ?currentPoint,
      ];
      await controller.animateCamera(
        CameraUpdate.newLatLngBounds(
          _boundsFor(boundsPoints),
          left: widget.fitPadding.left,
          top: widget.fitPadding.top,
          right: widget.fitPadding.right,
          bottom: widget.fitPadding.bottom,
        ),
        duration: const Duration(milliseconds: 650),
      );
    } else if (focusActiveStop) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(points[activeIndex], 15),
        duration: const Duration(milliseconds: 450),
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
