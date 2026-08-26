import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../../core/design/openfree_route_map.dart';
import '../../../core/services/road_route_service.dart';
import '../../../domain/models.dart';

/// High-fidelity animated route preview card for the AI Tour Planner.
///
/// Pre-loads the real cartographic road map in parallel while displaying an
/// engaging AI laser animation tracing the route between stops. Once the animation
/// completes, it seamlessly reveals the fully rendered road map with zero latency.
class AnimatedRoutePreviewCard extends StatefulWidget {
  const AnimatedRoutePreviewCard({
    super.key,
    required this.stops,
    required this.onModifyStops,
    required this.onCreateTour,
    this.isBuilding = false,
    this.mapStyleUrl,
  });

  final List<AiRecommendation> stops;
  final VoidCallback onModifyStops;
  final VoidCallback onCreateTour;
  final bool isBuilding;
  final String? mapStyleUrl;

  @override
  State<AnimatedRoutePreviewCard> createState() =>
      _AnimatedRoutePreviewCardState();
}

class _AnimatedRoutePreviewCardState extends State<AnimatedRoutePreviewCard>
    with TickerProviderStateMixin {
  late final AnimationController _mainController;
  late final AnimationController _pulseController;
  bool _showRealMap = false;
  int _mapAnimKey = 0;

  @override
  void initState() {
    super.initState();

    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _mainController.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        setState(() {
          _showRealMap = true;
        });
      }
    });

    _preWarmRoadRoute();
    _mainController.forward();
  }

  void _preWarmRoadRoute() {
    if (widget.stops.length >= 2) {
      final points = widget.stops
          .map((r) => GeoPoint(latitude: r.latitude, longitude: r.longitude))
          .toList();
      RoadRouteService().resolveRoute(points);
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedRoutePreviewCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.stops != widget.stops && widget.stops.isNotEmpty) {
      _showRealMap = false;
      _mapAnimKey++;
      _preWarmRoadRoute();
      _mainController.reset();
      _mainController.forward();
    }
  }

  @override
  void dispose() {
    _mainController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _replayAnimation() {
    setState(() {
      _showRealMap = false;
      _mapAnimKey++;
    });
    _preWarmRoadRoute();
    _mainController.reset();
    _mainController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final cardBgColor = isDark
        ? const Color(0xFF0F172A)
        : Theme.of(context).colorScheme.surface;

    final borderColor = isDark
        ? const Color(0xFF1E293B)
        : Theme.of(context).dividerColor.withValues(alpha: 0.12);

    final stopCount = widget.stops.length;

    return Container(
      key: const ValueKey('ai_animated_route_card_container'),
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: cardBgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.4)
                : Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header Bar ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 10),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF00E5FF).withValues(alpha: 0.15)
                        : const Color(0xFF2563EB).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF00E5FF).withValues(alpha: 0.3)
                          : const Color(0xFF2563EB).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Icon(
                    Icons.auto_awesome_rounded,
                    size: 16,
                    color: isDark
                        ? const Color(0xFF00E5FF)
                        : const Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$stopCount Paradas Seleccionadas',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _showRealMap
                            ? 'Ruta trazada por caminos reales'
                            : 'Diseñando itinerario inteligente con IA...',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark
                              ? const Color(0xFF94A3B8)
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                // Replay button
                IconButton(
                  tooltip: 'Trazar ruta de nuevo',
                  icon: Icon(
                    Icons.replay_rounded,
                    size: 20,
                    color: isDark
                        ? const Color(0xFF38BDF8)
                        : const Color(0xFF2563EB),
                  ),
                  onPressed: _replayAnimation,
                ),
              ],
            ),
          ),

          // ── Map Container (Parallel Pre-loaded Map & Laser Canvas) ──
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              height: 220,
              width: double.infinity,
              child: Stack(
                children: [
                  // 1. Real Road Map (Pre-warmed in background for instant reveal)
                  Positioned.fill(
                    child: _buildRealMapWithRoads(context),
                  ),
                  // 2. Animated AI Laser Canvas (Overlay on top during initial creation)
                  Positioned.fill(
                    child: IgnorePointer(
                      ignoring: _showRealMap,
                      child: AnimatedOpacity(
                        opacity: _showRealMap ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeInOut,
                        child: _buildAnimatedLaserCanvas(isDark),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Horizontal Stops Chips Ribbon ───────────────────────
          if (widget.stops.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: _buildStopsRibbon(isDark),
            ),

          // ── Action Buttons ──────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(
                        color: isDark
                            ? const Color(0xFF334155)
                            : Colors.blue.shade300,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: Icon(
                      Icons.edit_location_alt_outlined,
                      size: 16,
                      color: isDark
                          ? const Color(0xFF38BDF8)
                          : Colors.blue.shade700,
                    ),
                    label: Text(
                      'Modificar paradas',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? const Color(0xFF38BDF8)
                            : Colors.blue.shade700,
                      ),
                    ),
                    onPressed: widget.onModifyStops,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: isDark
                          ? const Color(0xFF0284C7)
                          : Colors.blue.shade600,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: widget.isBuilding
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(
                            Icons.rocket_launch_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                    label: Text(
                      widget.isBuilding ? 'Creando tour...' : 'Crear tour',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    onPressed: widget.isBuilding ? null : widget.onCreateTour,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedLaserCanvas(bool isDark) {
    return SizedBox(
      key: const ValueKey('animated_laser_canvas_view'),
      height: 220,
      width: double.infinity,
      child: AnimatedBuilder(
        animation: Listenable.merge([_mainController, _pulseController]),
        builder: (context, _) {
          return CustomPaint(
            size: const Size(double.infinity, 220),
            painter: RouteCanvasPainter(
              stops: widget.stops,
              mainProgress: _mainController.value,
              pulseProgress: _pulseController.value,
              isDark: isDark,
            ),
          );
        },
      ),
    );
  }

  Widget _buildRealMapWithRoads(BuildContext context) {
    final points = widget.stops
        .map((r) => GeoPoint(latitude: r.latitude, longitude: r.longitude))
        .toList();
    final labels = widget.stops.map((r) => r.name).toList();
    final stopsAsTourStops = widget.stops
        .map((r) => TourStop(
              id: r.id,
              name: r.name,
              description: r.description,
              location: GeoPoint(latitude: r.latitude, longitude: r.longitude),
              imageUrl: r.imageUrl,
              suggestedMinutes: r.durationMinutes,
              activities: [r.category],
              tips: const [],
              locationInfo: r.locationInfo,
            ))
        .toList();

    return SizedBox(
      key: ValueKey('ai_real_map_view_${widget.stops.length}_$_mapAnimKey'),
      height: 220,
      width: double.infinity,
      child: OpenFreeRouteMap(
        key: ValueKey('ai_openfree_road_map_${widget.stops.length}_$_mapAnimKey'),
        points: points,
        labels: labels,
        stops: stopsAsTourStops,
        styleUrl: widget.mapStyleUrl ??
            'https://tiles.openfreemap.org/styles/bright',
        activeIndex: -1,
        height: 220,
        borderRadius: 0,
        fitPadding: const EdgeInsets.symmetric(horizontal: 36, vertical: 32),
        showNumbers: true,
        useRoadRouting: true,
      ),
    );
  }

  Widget _buildStopsRibbon(bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          for (int i = 0; i < widget.stops.length; i++)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF1E293B).withValues(alpha: 0.7)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [
                                  const Color(0xFF00E5FF),
                                  const Color(0xFF0284C7)
                                ]
                              : [
                                  const Color(0xFF2563EB),
                                  const Color(0xFF1D4ED8)
                                ],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 130),
                      child: Text(
                        widget.stops[i].name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? const Color(0xFFE2E8F0)
                              : const Color(0xFF1E293B),
                        ),
                      ),
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

/// CustomPainter that renders AI vector streets, laser path with
/// dynamic tracer head, and concentric radar pulses during the creation phase.
class RouteCanvasPainter extends CustomPainter {
  RouteCanvasPainter({
    required this.stops,
    required this.mainProgress,
    required this.pulseProgress,
    required this.isDark,
  });

  final List<AiRecommendation> stops;
  final double mainProgress;
  final double pulseProgress;
  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;

    // 1. Canvas Background
    _drawBackground(canvas, size);

    // 2. Vector Streets & Grid Mesh
    final gridOpacity = ((mainProgress - 0.0) / 0.22).clamp(0.0, 1.0);
    _drawVectorGrid(canvas, size, gridOpacity);

    if (stops.isEmpty) return;

    // 3. Project GPS points to Canvas (X, Y)
    final projectedPoints = _projectCoordinates(stops, size);

    if (projectedPoints.length == 1) {
      _drawSingleNode(canvas, projectedPoints.first);
      return;
    }

    // 4. Construct Smooth Route Path
    final routePath = _buildSmoothRoutePath(projectedPoints);
    final pathMetrics = routePath.computeMetrics().toList();
    if (pathMetrics.isEmpty) return;

    final totalLength = pathMetrics.fold<double>(
      0.0,
      (sum, metric) => sum + metric.length,
    );

    // 5. Laser Line Progress
    final laserProgress = Curves.easeInOutCubic
        .transform(((mainProgress - 0.18) / 0.57).clamp(0.0, 1.0));
    final currentDrawnLength = totalLength * laserProgress;

    // Cumulative metric calculation for node activation
    final nodeActivationLengths = _calculateNodeActivationLengths(
      projectedPoints,
      pathMetrics,
    );

    // 6. Draw Drawn Laser Route with Multilayer Glow
    _drawLaserRoute(canvas, pathMetrics, currentDrawnLength);

    // 7. Draw Dynamic Tracer Head
    if (laserProgress > 0.001 && laserProgress < 1.0) {
      _drawTracerHead(canvas, pathMetrics, currentDrawnLength);
    }

    // 8. Draw Nodes & Concentric Radar Pulses
    _drawNodesAndRadar(
      canvas,
      projectedPoints,
      nodeActivationLengths,
      currentDrawnLength,
      laserProgress,
    );
  }

  void _drawBackground(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final Paint bgPaint = Paint();

    if (isDark) {
      bgPaint.shader = ui.Gradient.linear(
        Offset.zero,
        Offset(size.width, size.height),
        const [
          Color(0xFF0B0F17),
          Color(0xFF111827),
          Color(0xFF0A0F1D),
        ],
        const [0.0, 0.5, 1.0],
      );
    } else {
      bgPaint.shader = ui.Gradient.linear(
        Offset.zero,
        Offset(size.width, size.height),
        const [
          Color(0xFFF8FAFC),
          Color(0xFFF1F5F9),
          Color(0xFFE2E8F0),
        ],
        const [0.0, 0.5, 1.0],
      );
    }

    canvas.drawRect(rect, bgPaint);
  }

  void _drawVectorGrid(Canvas canvas, Size size, double opacity) {
    if (opacity <= 0) return;

    final gridPaint = Paint()
      ..color = isDark
          ? const Color(0xFF1E293B).withValues(alpha: 0.45 * opacity)
          : const Color(0xFFCBD5E1).withValues(alpha: 0.5 * opacity)
      ..strokeWidth = 0.8
      ..style = PaintingStyle.stroke;

    final majorStreetPaint = Paint()
      ..color = isDark
          ? const Color(0xFF334155).withValues(alpha: 0.35 * opacity)
          : const Color(0xFF94A3B8).withValues(alpha: 0.35 * opacity)
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke;

    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final streetPath = Path();
    streetPath.moveTo(0, size.height * 0.75);
    streetPath.lineTo(size.width * 0.4, size.height * 0.65);
    streetPath.lineTo(size.width, size.height * 0.2);

    streetPath.moveTo(size.width * 0.15, 0);
    streetPath.lineTo(size.width * 0.35, size.height);

    streetPath.moveTo(size.width * 0.65, 0);
    streetPath.lineTo(size.width * 0.85, size.height);

    canvas.drawPath(streetPath, majorStreetPaint);
  }

  void _drawSingleNode(Canvas canvas, Offset point) {
    final pulseRadius = 12.0 + (pulseProgress * 24.0);
    final pulseAlpha = (1.0 - pulseProgress).clamp(0.0, 1.0) * 0.5;

    final pulsePaint = Paint()
      ..color = isDark
          ? const Color(0xFF00E5FF).withValues(alpha: pulseAlpha)
          : const Color(0xFF2563EB).withValues(alpha: pulseAlpha)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawCircle(point, pulseRadius, pulsePaint);

    final nodeCore = Paint()
      ..color = isDark ? const Color(0xFF00E5FF) : const Color(0xFF2563EB)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(point, 7.0, nodeCore);

    final nodeCenter = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(point, 3.5, nodeCenter);
  }

  List<Offset> _projectCoordinates(List<AiRecommendation> items, Size size) {
    if (items.isEmpty) return [];

    double minLat = items.first.latitude;
    double maxLat = items.first.latitude;
    double minLon = items.first.longitude;
    double maxLon = items.first.longitude;

    for (final s in items) {
      if (s.latitude < minLat) minLat = s.latitude;
      if (s.latitude > maxLat) maxLat = s.latitude;
      if (s.longitude < minLon) minLon = s.longitude;
      if (s.longitude > maxLon) maxLon = s.longitude;
    }

    const double paddingX = 42.0;
    const double paddingY = 38.0;

    final double drawableWidth = math.max(size.width - 2 * paddingX, 10.0);
    final double drawableHeight = math.max(size.height - 2 * paddingY, 10.0);

    final double latDelta = maxLat - minLat;
    final double lonDelta = maxLon - minLon;

    if (latDelta.abs() < 0.00001 && lonDelta.abs() < 0.00001) {
      return items.map((_) => Offset(size.width / 2, size.height / 2)).toList();
    }

    final double midLatRad = ((minLat + maxLat) / 2.0) * (math.pi / 180.0);
    final double cosMidLat = math.cos(midLatRad).abs().clamp(0.2, 1.0);

    final double effectiveLonDelta = math.max(lonDelta * cosMidLat, 0.00005);
    final double effectiveLatDelta = math.max(latDelta, 0.00005);

    final double scale = math.min(
      drawableWidth / effectiveLonDelta,
      drawableHeight / effectiveLatDelta,
    );

    final double fittedWidth = effectiveLonDelta * scale;
    final double fittedHeight = effectiveLatDelta * scale;

    final double offsetX = paddingX + (drawableWidth - fittedWidth) / 2.0;
    final double offsetY = paddingY + (drawableHeight - fittedHeight) / 2.0;

    final List<Offset> result = [];
    for (final s in items) {
      final double normX = (s.longitude - minLon) * cosMidLat;
      final double normY = s.latitude - minLat;

      final double px = offsetX + (normX * scale);
      final double py = offsetY + fittedHeight - (normY * scale);

      result.add(Offset(px, py));
    }

    return result;
  }

  Path _buildSmoothRoutePath(List<Offset> points) {
    final path = Path();
    if (points.isEmpty) return path;

    path.moveTo(points.first.dx, points.first.dy);

    if (points.length == 2) {
      final p0 = points[0];
      final p1 = points[1];
      final mid = Offset((p0.dx + p1.dx) / 2, (p0.dy + p1.dy) / 2);
      final dx = p1.dx - p0.dx;
      final dy = p1.dy - p0.dy;
      final normal = Offset(-dy * 0.15, dx * 0.15);
      final controlPoint = mid + normal;
      path.quadraticBezierTo(controlPoint.dx, controlPoint.dy, p1.dx, p1.dy);
      return path;
    }

    for (int i = 0; i < points.length - 1; i++) {
      final p0 = i > 0 ? points[i - 1] : points[i];
      final p1 = points[i];
      final p2 = points[i + 1];
      final p3 = (i < points.length - 2) ? points[i + 2] : p2;

      final cp1x = p1.dx + (p2.dx - p0.dx) / 6.0;
      final cp1y = p1.dy + (p2.dy - p0.dy) / 6.0;

      final cp2x = p2.dx - (p3.dx - p1.dx) / 6.0;
      final cp2y = p2.dy - (p3.dy - p1.dy) / 6.0;

      path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.dx, p2.dy);
    }

    return path;
  }

  List<double> _calculateNodeActivationLengths(
    List<Offset> points,
    List<ui.PathMetric> metrics,
  ) {
    if (points.isEmpty) return [];
    if (points.length == 1) return [0.0];

    final double totalLength =
        metrics.fold(0.0, (sum, m) => sum + m.length);

    final List<double> lengths = [0.0];
    for (int i = 1; i < points.length; i++) {
      final fraction = i / (points.length - 1);
      lengths.add(totalLength * fraction);
    }
    return lengths;
  }

  void _drawLaserRoute(
    Canvas canvas,
    List<ui.PathMetric> metrics,
    double currentDrawnLength,
  ) {
    if (currentDrawnLength <= 0) return;

    final drawnPath = Path();
    double remaining = currentDrawnLength;

    for (final metric in metrics) {
      if (remaining <= 0) break;
      final extractLen = math.min(remaining, metric.length);
      drawnPath.addPath(metric.extractPath(0.0, extractLen), Offset.zero);
      remaining -= extractLen;
    }

    if (isDark) {
      final ambientGlowPaint = Paint()
        ..color = const Color(0xFF00E5FF).withValues(alpha: 0.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12.0)
        ..strokeWidth = 10.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(drawnPath, ambientGlowPaint);

      final laserHaloPaint = Paint()
        ..color = const Color(0xFF38BDF8).withValues(alpha: 0.7)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5.0)
        ..strokeWidth = 5.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(drawnPath, laserHaloPaint);

      final laserCorePaint = Paint()
        ..color = const Color(0xFF00E5FF)
        ..strokeWidth = 3.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(drawnPath, laserCorePaint);
    } else {
      final ambientGlowPaint = Paint()
        ..color = const Color(0xFF3B82F6).withValues(alpha: 0.35)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6.0)
        ..strokeWidth = 8.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(drawnPath, ambientGlowPaint);

      final laserCorePaint = Paint()
        ..color = const Color(0xFF1D4ED8)
        ..strokeWidth = 3.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      canvas.drawPath(drawnPath, laserCorePaint);
    }
  }

  void _drawTracerHead(
    Canvas canvas,
    List<ui.PathMetric> metrics,
    double currentDrawnLength,
  ) {
    double accumulated = 0.0;
    ui.Tangent? tangent;

    for (final metric in metrics) {
      if (currentDrawnLength <= accumulated + metric.length) {
        final offset = (currentDrawnLength - accumulated).clamp(0.0, metric.length);
        tangent = metric.getTangentForOffset(offset);
        break;
      }
      accumulated += metric.length;
    }

    if (tangent == null) return;
    final pos = tangent.position;

    if (isDark) {
      final auraPaint = Paint()
        ..color = const Color(0xFF00E5FF).withValues(alpha: 0.5)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10.0);
      canvas.drawCircle(pos, 12.0, auraPaint);

      final sparkPaint = Paint()
        ..color = const Color(0xFF38BDF8)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3.0);
      canvas.drawCircle(pos, 6.0, sparkPaint);

      final centerPaint = Paint()..color = Colors.white;
      canvas.drawCircle(pos, 3.5, centerPaint);
    } else {
      final auraPaint = Paint()
        ..color = const Color(0xFF2563EB).withValues(alpha: 0.45)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);
      canvas.drawCircle(pos, 10.0, auraPaint);

      final sparkPaint = Paint()..color = const Color(0xFF1D4ED8);
      canvas.drawCircle(pos, 5.0, sparkPaint);

      final centerPaint = Paint()..color = Colors.white;
      canvas.drawCircle(pos, 2.5, centerPaint);
    }
  }

  void _drawNodesAndRadar(
    Canvas canvas,
    List<Offset> points,
    List<double> nodeActivationLengths,
    double currentDrawnLength,
    double laserProgress,
  ) {
    for (int i = 0; i < points.length; i++) {
      final point = points[i];
      final activationLength = nodeActivationLengths[i];
      final isActivated = currentDrawnLength >= activationLength || laserProgress >= 0.99;

      if (!isActivated) continue;

      _drawConcentricRadarWaves(canvas, point, i);
      _drawNodeBadge(canvas, point, i, isStart: i == 0, isEnd: i == points.length - 1);
    }
  }

  void _drawConcentricRadarWaves(Canvas canvas, Offset point, int index) {
    final phaseShift = (index * 0.25) % 1.0;
    final waveTime1 = (pulseProgress + phaseShift) % 1.0;
    final waveTime2 = (pulseProgress + phaseShift + 0.5) % 1.0;

    void drawWave(double waveProgress) {
      final radius = 8.0 + (waveProgress * 24.0);
      final alpha = (1.0 - waveProgress).clamp(0.0, 1.0) * (isDark ? 0.5 : 0.4);

      final wavePaint = Paint()
        ..color = isDark
            ? const Color(0xFF00E5FF).withValues(alpha: alpha)
            : const Color(0xFF3B82F6).withValues(alpha: alpha)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6;

      canvas.drawCircle(point, radius, wavePaint);
    }

    drawWave(waveTime1);
    drawWave(waveTime2);
  }

  void _drawNodeBadge(
    Canvas canvas,
    Offset point,
    int index, {
    required bool isStart,
    required bool isEnd,
  }) {
    if (isDark) {
      final glowPaint = Paint()
        ..color = isStart
            ? const Color(0xFF10B981).withValues(alpha: 0.6)
            : (isEnd
                ? const Color(0xFFF43F5E).withValues(alpha: 0.6)
                : const Color(0xFF00E5FF).withValues(alpha: 0.6))
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5.0);
      canvas.drawCircle(point, 9.0, glowPaint);

      final ringPaint = Paint()
        ..color = isStart
            ? const Color(0xFF10B981)
            : (isEnd ? const Color(0xFFF43F5E) : const Color(0xFF00E5FF))
        ..style = PaintingStyle.fill;
      canvas.drawCircle(point, 8.0, ringPaint);

      final innerDiskPaint = Paint()
        ..color = const Color(0xFF0F172A)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(point, 6.0, innerDiskPaint);

      final centerPaint = Paint()..color = Colors.white;
      canvas.drawCircle(point, 3.2, centerPaint);
    } else {
      final ringPaint = Paint()
        ..color = isStart
            ? const Color(0xFF059669)
            : (isEnd ? const Color(0xFFE11D48) : const Color(0xFF1D4ED8))
        ..style = PaintingStyle.fill;
      canvas.drawCircle(point, 8.5, ringPaint);

      final innerDiskPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(point, 6.0, innerDiskPaint);

      final centerDotPaint = Paint()
        ..color = isStart
            ? const Color(0xFF059669)
            : (isEnd ? const Color(0xFFE11D48) : const Color(0xFF1D4ED8))
        ..style = PaintingStyle.fill;
      canvas.drawCircle(point, 3.2, centerDotPaint);
    }

    final textSpan = TextSpan(
      text: '${index + 1}',
      style: TextStyle(
        color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF1D4ED8),
        fontSize: 9.0,
        fontWeight: FontWeight.w800,
      ),
    );

    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset(point.dx - textPainter.width / 2, point.dy - 19.0),
    );
  }

  @override
  bool shouldRepaint(covariant RouteCanvasPainter oldDelegate) {
    return oldDelegate.mainProgress != mainProgress ||
        oldDelegate.pulseProgress != pulseProgress ||
        oldDelegate.stops != stops ||
        oldDelegate.isDark != isDark;
  }
}
