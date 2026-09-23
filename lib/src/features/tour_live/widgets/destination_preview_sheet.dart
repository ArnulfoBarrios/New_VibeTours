import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/design/app_theme.dart';
import '../../../core/design/premium_components.dart';
import '../../../core/utils/image_utils.dart';
import '../../../domain/models.dart';

/// Modal bottom sheet showing rich visual cues and destination preview
/// to orient tourists before and upon arrival.
class DestinationPreviewSheet extends StatefulWidget {
  const DestinationPreviewSheet({
    super.key,
    required this.stop,
    required this.stopIndex,
    required this.totalStops,
    this.day = 1,
    this.remainingDistanceMeters,
    required this.onArrived,
  });

  final TourStop stop;
  final int stopIndex;
  final int totalStops;
  final int day;
  final double? remainingDistanceMeters;
  final VoidCallback onArrived;

  static Future<void> show({
    required BuildContext context,
    required TourStop stop,
    required int stopIndex,
    required int totalStops,
    int day = 1,
    double? remainingDistanceMeters,
    required VoidCallback onArrived,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DestinationPreviewSheet(
        stop: stop,
        stopIndex: stopIndex,
        totalStops: totalStops,
        day: day,
        remainingDistanceMeters: remainingDistanceMeters,
        onArrived: onArrived,
      ),
    );
  }

  @override
  State<DestinationPreviewSheet> createState() => _DestinationPreviewSheetState();
}

class _DestinationPreviewSheetState extends State<DestinationPreviewSheet> {
  int _activeImageIndex = 0;
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<String> get _allImages {
    final list = <String>[];
    if (widget.stop.displayImageUrl.trim().isNotEmpty) {
      list.add(widget.stop.displayImageUrl.trim());
    }
    for (final img in widget.stop.images) {
      final trimmed = img.trim();
      if (trimmed.isNotEmpty && !list.contains(trimmed)) {
        list.add(trimmed);
      }
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final images = _allImages;
    final mediaQuery = MediaQuery.of(context);
    final systemBottomPadding = mediaQuery.padding.bottom;
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final screenHeight = mediaQuery.size.height;
    final bottomOffset = math.max(systemBottomPadding, 16.0) + 8.0 + keyboardInset;

    return Container(
      constraints: BoxConstraints(maxHeight: screenHeight * 0.86),
      padding: EdgeInsets.fromLTRB(20, 12, 20, bottomOffset),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2028) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header: Stop badge and close button
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'Día ${widget.day} • Parada ${widget.stopIndex + 1}/${widget.totalStops}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
              const Spacer(),
              if (widget.remainingDistanceMeters != null)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.near_me_rounded, size: 14, color: AppTheme.primary),
                      const SizedBox(width: 4),
                      Text(
                        widget.remainingDistanceMeters! < 1000
                            ? '${widget.remainingDistanceMeters!.round()} m'
                            : '${(widget.remainingDistanceMeters! / 1000).toStringAsFixed(1)} km',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),

          // Scrollable place details
          Flexible(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 6),
                  Text(
                    widget.stop.name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Image visual preview banner / carousel
                  _buildImagePreview(images, theme),
                  const SizedBox(height: 16),

                  // Visual clues card: What to look for
                  _buildVisualCluesCard(theme),
                  const SizedBox(height: 14),

                  // Description
                  if (widget.stop.description.trim().isNotEmpty) ...[
                    Text(
                      'Acerca de este lugar',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.stop.description.trim(),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.45,
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // Recommended activities
                  if (widget.stop.activities.isNotEmpty) ...[
                    Text(
                      'Actividades recomendadas',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: widget.stop.activities.map((activity) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_rounded, size: 14, color: AppTheme.primary),
                              const SizedBox(width: 5),
                              Text(
                                activity,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // Suggested duration
                  if (widget.stop.suggestedMinutes > 0)
                    Row(
                      children: [
                        Icon(Icons.schedule_rounded, size: 16, color: AppTheme.primary),
                        const SizedBox(width: 6),
                        Text(
                          'Tiempo estimado de visita: ${widget.stop.suggestedMinutes} minutos',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),
          // Action Buttons
          Row(
            children: [
              Expanded(
                flex: 3,
                child: LiquidButton(
                  label: 'Ya llegué aquí',
                  icon: Icons.pin_drop_rounded,
                  isPrimary: true,
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onArrived();
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                  ),
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.map_rounded, size: 18),
                  label: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text('Volver a ruta'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview(List<String> images, ThemeData theme) {
    if (images.isEmpty) {
      return Container(
        height: 170,
        width: double.infinity,
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_camera_rounded, size: 42, color: theme.colorScheme.primary),
            const SizedBox(height: 8),
            Text(
              'Sin fotos previas disponibles',
              style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: SizedBox(
            height: 190,
            width: double.infinity,
            child: PageView.builder(
              controller: _pageController,
              itemCount: images.length,
              onPageChanged: (idx) => setState(() => _activeImageIndex = idx),
              itemBuilder: (context, index) {
                final url = images[index];
                return CachedNetworkImage(
                  imageUrl: optimizeImageUrl(url, width: 800, quality: 80),
                  fit: BoxFit.cover,
                  placeholder: (context, _) => Container(
                    color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                    child: const Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                    child: const Center(
                      child: Icon(Icons.broken_image_rounded, size: 36, color: Colors.grey),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(images.length, (idx) {
              final isSelected = idx == _activeImageIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isSelected ? 16 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primary
                      : theme.colorScheme.onSurface.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }

  Widget _buildVisualCluesCard(ThemeData theme) {
    final tips = widget.stop.tips;
    final facts = widget.stop.curiousFacts;

    // Build visual recognition text
    final visualHints = <String>[];
    for (final tip in tips) {
      if (tip.trim().isNotEmpty) visualHints.add(tip.trim());
    }
    if (visualHints.isEmpty) {
      for (final fact in facts) {
        if (fact.trim().isNotEmpty) visualHints.add(fact.trim());
      }
    }
    if (visualHints.isEmpty) {
      visualHints.add(
        'Busca la fachada principal, accesos peatonales y letreros identificativos de ${widget.stop.name}.',
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.visibility_rounded, size: 18, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                '¿Cómo reconocer el lugar al llegar?',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...visualHints.take(2).map((hint) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '• ',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                      fontSize: 13,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      hint,
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
