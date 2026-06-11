import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../domain/models.dart';
import 'app_theme.dart';

class RoutePreviewMap extends StatelessWidget {
  const RoutePreviewMap({
    super.key,
    required this.points,
    this.labels = const [],
    this.activeIndex = 0,
    this.height = 220,
    this.padding = const EdgeInsets.all(18),
    this.visualStyle = 'standard',
  });

  factory RoutePreviewMap.fromStops({
    Key? key,
    required List<TourStop> stops,
    int activeIndex = 0,
    double height = 220,
    EdgeInsets padding = const EdgeInsets.all(18),
    String visualStyle = 'standard',
  }) {
    return RoutePreviewMap(
      key: key,
      points: [for (final stop in stops) stop.location],
      labels: [for (final stop in stops) stop.name],
      activeIndex: activeIndex,
      height: height,
      padding: padding,
      visualStyle: visualStyle,
    );
  }

  final List<GeoPoint> points;
  final List<String> labels;
  final int activeIndex;
  final double height;
  final EdgeInsets padding;
  final String visualStyle;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(26),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: CustomPaint(
          painter: _RoutePreviewPainter(
            points: points,
            labels: labels,
            activeIndex: activeIndex,
            isDark: isDark,
            padding: padding,
            visualStyle: visualStyle,
          ),
        ),
      ),
    );
  }
}

class _RoutePreviewPainter extends CustomPainter {
  const _RoutePreviewPainter({
    required this.points,
    required this.labels,
    required this.activeIndex,
    required this.isDark,
    required this.padding,
    required this.visualStyle,
  });

  final List<GeoPoint> points;
  final List<String> labels;
  final int activeIndex;
  final bool isDark;
  final EdgeInsets padding;
  final String visualStyle;

  @override
  void paint(Canvas canvas, Size size) {
    _paintBackground(canvas, size);
    final offsets = _project(size);
    _paintRoads(canvas, size);
    if (offsets.length > 1) _paintRoute(canvas, offsets);
    for (var i = 0; i < offsets.length; i++) {
      _paintStop(
        canvas,
        offsets[i],
        i,
        i == activeIndex.clamp(0, offsets.length - 1),
      );
      _paintLabel(canvas, offsets[i], i);
    }
  }

  void _paintBackground(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? const [Color(0xFF051629), Color(0xFF0A233A), Color(0xFF020A13)]
            : _lightColors(),
      ).createShader(rect);
    canvas.drawRect(rect, paint);

    final waterPaint = Paint()
      ..color = AppTheme.primary.withValues(alpha: isDark ? 0.18 : 0.12)
      ..style = PaintingStyle.fill;
    final water = Path()
      ..moveTo(size.width * 0.70, 0)
      ..cubicTo(
        size.width * 0.58,
        size.height * 0.28,
        size.width * 0.86,
        size.height * 0.48,
        size.width * 0.70,
        size.height,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(water, waterPaint);
  }

  List<Color> _lightColors() {
    if (visualStyle.contains('satellite')) {
      return const [Color(0xFFDDEAD7), Color(0xFFB9D0B2), Color(0xFF7FA184)];
    }
    if (visualStyle.contains('dark')) {
      return const [Color(0xFF07111F), Color(0xFF10243A), Color(0xFF07111F)];
    }
    return const [Color(0xFFEAF4FF), Color(0xFFF9FBFF), Color(0xFFDDEEFF)];
  }

  void _paintRoads(Canvas canvas, Size size) {
    final roadPaint = Paint()
      ..color = (isDark ? Colors.white : AppTheme.primaryDeep).withValues(
        alpha: isDark ? 0.13 : 0.14,
      )
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    for (var i = 0; i < 5; i++) {
      final y = (size.height / 6) * (i + 1);
      final path = Path()
        ..moveTo(-20, y)
        ..quadraticBezierTo(size.width * 0.34, y - 22, size.width + 20, y + 10);
      canvas.drawPath(path, roadPaint);
    }
    for (var i = 0; i < 4; i++) {
      final x = (size.width / 5) * (i + 1);
      final path = Path()
        ..moveTo(x, -20)
        ..quadraticBezierTo(
          x + 24,
          size.height * 0.45,
          x - 12,
          size.height + 20,
        );
      canvas.drawPath(path, roadPaint);
    }
  }

  void _paintRoute(Canvas canvas, List<Offset> offsets) {
    final shadow = Paint()
      ..color = Colors.black.withValues(alpha: isDark ? 0.36 : 0.16)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 13
      ..style = PaintingStyle.stroke;
    final line = Paint()
      ..shader = const LinearGradient(
        colors: [AppTheme.primary, AppTheme.indigo],
      ).createShader(Rect.fromPoints(offsets.first, offsets.last))
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 7
      ..style = PaintingStyle.stroke;

    final path = Path()..moveTo(offsets.first.dx, offsets.first.dy);
    for (var i = 1; i < offsets.length; i++) {
      final previous = offsets[i - 1];
      final current = offsets[i];
      final control = Offset(
        (previous.dx + current.dx) / 2,
        (previous.dy + current.dy) / 2 - 24,
      );
      path.quadraticBezierTo(control.dx, control.dy, current.dx, current.dy);
    }
    canvas.drawPath(path, shadow);
    canvas.drawPath(path, line);
  }

  void _paintStop(Canvas canvas, Offset offset, int index, bool active) {
    final radius = active ? 17.0 : 13.0;
    canvas.drawCircle(
      offset.translate(0, 3),
      radius + 3,
      Paint()..color = Colors.black.withValues(alpha: 0.18),
    );
    canvas.drawCircle(
      offset,
      radius + 3,
      Paint()..color = Colors.white.withValues(alpha: active ? 0.95 : 0.78),
    );
    canvas.drawCircle(
      offset,
      radius,
      Paint()..color = active ? AppTheme.primary : AppTheme.primaryDeep,
    );

    final textPainter = TextPainter(
      text: TextSpan(
        text: '${index + 1}',
        style: TextStyle(
          color: Colors.white,
          fontSize: active ? 14 : 12,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    textPainter.paint(
      canvas,
      offset - Offset(textPainter.width / 2, textPainter.height / 2),
    );
  }

  void _paintLabel(Canvas canvas, Offset offset, int index) {
    if (index >= labels.length || labels[index].isEmpty) return;
    final label = labels[index];
    final textPainter = TextPainter(
      maxLines: 1,
      ellipsis: '...',
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: isDark ? Colors.white : const Color(0xFF14213D),
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: 112);
    final labelOffset = offset.translate(18, -28);
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        labelOffset.dx - 8,
        labelOffset.dy - 4,
        textPainter.width + 16,
        textPainter.height + 8,
      ),
      const Radius.circular(999),
    );
    canvas.drawRRect(
      rect,
      Paint()
        ..color = (isDark ? Colors.black : Colors.white).withValues(
          alpha: 0.76,
        ),
    );
    textPainter.paint(canvas, labelOffset);
  }

  List<Offset> _project(Size size) {
    if (points.isEmpty) return const [];
    if (points.length == 1) return [Offset(size.width / 2, size.height / 2)];

    final minLat = points.map((point) => point.latitude).reduce(math.min);
    final maxLat = points.map((point) => point.latitude).reduce(math.max);
    final minLng = points.map((point) => point.longitude).reduce(math.min);
    final maxLng = points.map((point) => point.longitude).reduce(math.max);
    final latRange = math.max(maxLat - minLat, 0.0001);
    final lngRange = math.max(maxLng - minLng, 0.0001);
    final rect = Rect.fromLTWH(
      padding.left,
      padding.top,
      size.width - padding.horizontal,
      size.height - padding.vertical,
    );

    return [
      for (final point in points)
        Offset(
          rect.left + ((point.longitude - minLng) / lngRange) * rect.width,
          rect.bottom - ((point.latitude - minLat) / latRange) * rect.height,
        ),
    ];
  }

  @override
  bool shouldRepaint(covariant _RoutePreviewPainter oldDelegate) {
    return oldDelegate.points != points ||
        oldDelegate.activeIndex != activeIndex ||
        oldDelegate.isDark != isDark ||
        oldDelegate.visualStyle != visualStyle;
  }
}
