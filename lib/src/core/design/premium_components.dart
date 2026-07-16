import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shimmer/shimmer.dart';

import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import 'app_theme.dart';

String tourTypeL10n(BuildContext context, TourType type) {
  final l10n = AppLocalizations.of(context);
  switch (type) {
    case TourType.urban: return l10n.typeUrban;
    case TourType.historical: return l10n.typeHistorical;
    case TourType.gastronomic: return l10n.typeGastronomic;
    case TourType.cultural: return l10n.typeCultural;
    case TourType.ecological: return l10n.typeEcological;
    case TourType.romantic: return l10n.typeRomantic;
    case TourType.sports: return l10n.typeSports;
    case TourType.night: return l10n.typeNightlife;
    case TourType.family: return l10n.typeFamily;
    case TourType.custom: return l10n.typeCustom;
  }
}

String formatDuration(double hours) {
  final totalMinutes = (hours * 60).round();
  final h = totalMinutes ~/ 60;
  final m = totalMinutes % 60;
  if (h > 0 && m > 0) {
    return '$h h $m min';
  } else if (h > 0) {
    return '$h h';
  } else {
    return '$m min';
  }
}


class PremiumScaffold extends StatelessWidget {
  const PremiumScaffold({
    super.key,
    required this.child,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.safeBottom = false,
  });

  final Widget child;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final bool safeBottom;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      extendBodyBehindAppBar: true,
      appBar: appBar,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomNavigationBar,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor, // Fondo sólido estilo iOS
      body: SafeArea(bottom: safeBottom, child: child),
    );
  }
}

class GlassPanel extends StatelessWidget {
  const GlassPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.radius = 28,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double radius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final highPerformance = ref.watch(highRefreshRateProvider);

        final border = Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.12)
              : Colors.black.withValues(alpha: 0.08),
          width: 1.2,
        );

        final container = Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF1C1C1E).withValues(alpha: highPerformance ? 0.65 : 0.95)
                : const Color(0xFFFFFFFF).withValues(alpha: highPerformance ? 0.70 : 0.98),
            borderRadius: BorderRadius.circular(radius),
            border: border,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.28 : 0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
              BoxShadow(
                color: (isDark ? Colors.black : AppTheme.indigo).withValues(alpha: isDark ? 0.12 : 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(padding: padding, child: child),
        );

        final panel = highPerformance
            ? ClipRRect(
                borderRadius: BorderRadius.circular(radius),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                  child: container,
                ),
              )
            : container;

        return Padding(
          padding: margin ?? EdgeInsets.zero,
          child: onTap == null
              ? panel
              : InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(radius),
                  child: panel,
                ),
        );
      },
    );
  }
}

class InteractiveBounce extends StatefulWidget {
  const InteractiveBounce({
    super.key,
    required this.child,
    this.onTap,
    this.scaleFactor = 0.94,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;

  @override
  State<InteractiveBounce> createState() => _InteractiveBounceState();
}

class _InteractiveBounceState extends State<InteractiveBounce>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(begin: 1.0, end: widget.scaleFactor).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) {
        if (widget.onTap != null) _controller.forward();
      },
      onTapUp: (_) {
        if (widget.onTap != null) {
          _controller.reverse();
          widget.onTap!();
        }
      },
      onTapCancel: () {
        if (widget.onTap != null) _controller.reverse();
      },
      child: ScaleTransition(
        scale: _scale,
        child: widget.child,
      ),
    );
  }
}

class AnimatedRadar extends StatefulWidget {
  const AnimatedRadar({super.key, required this.icon});
  final IconData icon;

  @override
  State<AnimatedRadar> createState() => _AnimatedRadarState();
}

class _AnimatedRadarState extends State<AnimatedRadar> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      width: 100,
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (int i = 0; i < 3; i++)
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                final progress = (_controller.value + i / 3.0) % 1.0;
                return Container(
                  width: 32 + progress * 68,
                  height: 32 + progress * 68,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.primary.withValues(alpha: 0.16 * (1.0 - progress)),
                    border: Border.all(
                      color: AppTheme.primary.withValues(alpha: 0.35 * (1.0 - progress)),
                      width: 1.5,
                    ),
                  ),
                );
              },
            ),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primary,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Icon(widget.icon, size: 28, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class TravelImageFallback extends StatelessWidget {
  const TravelImageFallback({super.key, required this.title, this.icon});

  final String title;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? const [Color(0xFF061428), Color(0xFF112B44)]
              : const [Color(0xFFEAF4FF), Color(0xFFCFE4FF)],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _FallbackPatternPainter(isDark: isDark)),
          Center(
            child: Icon(
              icon ?? Icons.travel_explore_rounded,
              color: AppTheme.primary.withValues(alpha: isDark ? 0.72 : 0.54),
              size: 38,
            ),
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 14,
            child: Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: isDark ? Colors.white70 : AppTheme.primaryDeep,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FallbackPatternPainter extends CustomPainter {
  const _FallbackPatternPainter({required this.isDark});

  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = (isDark ? Colors.white : AppTheme.primary).withValues(
        alpha: isDark ? 0.06 : 0.08,
      )
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;
    for (var i = 0; i < 7; i++) {
      final y = size.height * (i + 1) / 8;
      canvas.drawLine(Offset(0, y), Offset(size.width, y - 18), paint);
    }
    for (var i = 0; i < 5; i++) {
      final x = size.width * (i + 1) / 6;
      canvas.drawLine(Offset(x, 0), Offset(x - 16, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _FallbackPatternPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}

class LiquidButton extends StatelessWidget {
  const LiquidButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isPrimary = true,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final childWidget = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: 8),
        Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
      ],
    );

    final Widget button;
    if (isPrimary) {
      button = FilledButton(
        onPressed: onPressed != null ? () {} : null,
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          backgroundColor: AppTheme.primary,
        ),
        child: childWidget,
      ).animate(target: onPressed == null ? 0 : 1).fadeIn();
    } else {
      button = OutlinedButton(
        onPressed: onPressed != null ? () {} : null,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        child: childWidget,
      );
    }

    return InteractiveBounce(
      onTap: onPressed,
      child: IgnorePointer(
        child: button,
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.action,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class TourCard extends StatelessWidget {
  const TourCard({
    super.key,
    required this.tour,
    this.compact = false,
    this.onTap,
  });

  final Tour tour;
  final bool compact;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final height = compact ? 210.0 : 286.0;
    return Container(
      width: compact ? 260 : double.infinity,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: tour.coverUrl,
              fit: BoxFit.cover,
              placeholder: (context, url) => const SkeletonBox(),
              errorWidget: (context, url, error) =>
                  TravelImageFallback(title: tour.title),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.05),
                    Colors.black.withValues(alpha: 0.4),
                    Colors.black.withValues(alpha: 0.8),
                  ],
                  stops: const [0.0, 0.4, 0.7, 1.0],
                ),
              ),
            ),
            Positioned(
              top: 14,
              left: 14,
              child: _CardChip(
                icon: Icons.auto_awesome_rounded,
                label: tour.isAiGenerated ? 'AI' : tourTypeL10n(context, tour.type),
              ),
            ),
            if (tour.reviewCount > 0)
              Positioned(
                right: 14,
                top: 14,
                child: _CardChip(
                  icon: Icons.star_rounded,
                  label: tour.rating.toStringAsFixed(1),
                ),
              ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tour.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      shadows: const [
                        Shadow(blurRadius: 18, color: Colors.black54),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _MetaPill(
                        Icons.place_rounded,
                        '${tour.city}, ${tour.country}',
                      ),
                      _MetaPill(
                        Icons.schedule_rounded,
                        formatDuration(tour.durationHours),
                      ),
                      _MetaPill(
                        Icons.route_rounded,
                        '${tour.stops.length} paradas',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Positioned.fill(
              child: Material(
                color: Colors.transparent,
                child: InkWell(onTap: onTap, child: const SizedBox.expand()),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 260.ms).slideY(begin: 0.04, end: 0);
  }
}

class _CardChip extends StatelessWidget {
  const _CardChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.22),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.white.withValues(alpha: 0.32)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: Colors.white),
                const SizedBox(width: 5),
                Text(
                  label,
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill(this.icon, this.label);

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white70, size: 14),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.9),
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.height, this.width});

  final double? height;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      highlightColor: Theme.of(context).colorScheme.surface,
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}

class VibeBottomNav extends StatelessWidget {
  const VibeBottomNav({
    super.key,
    required this.currentIndex,
    required this.onChanged,
  });

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: onChanged,
          backgroundColor: Theme.of(context).colorScheme.surface.withValues(alpha: 0.85),
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: [
            BottomNavigationBarItem(icon: const Icon(Icons.explore_outlined), activeIcon: const Icon(Icons.explore_rounded), label: l10n.explore),
            BottomNavigationBarItem(icon: const Icon(Icons.chat_bubble_outline_rounded), activeIcon: const Icon(Icons.chat_bubble_rounded), label: 'Chat'),
            BottomNavigationBarItem(icon: const Icon(Icons.beach_access_outlined), activeIcon: const Icon(Icons.beach_access_rounded), label: 'Tours'),
            BottomNavigationBarItem(icon: const Icon(Icons.person_outline_rounded), activeIcon: const Icon(Icons.person_rounded), label: l10n.profile),
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      margin: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedRadar(icon: icon),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
