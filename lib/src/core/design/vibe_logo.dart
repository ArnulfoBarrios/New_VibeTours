import 'package:flutter/material.dart';

import 'app_theme.dart';

class VibeLogoMark extends StatelessWidget {
  const VibeLogoMark({super.key, this.size = 34, this.admin = false});

  final double size;
  final bool admin;

  @override
  Widget build(BuildContext context) {
    if (admin) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF2B8CFF), Color(0xFF7FB1FF)],
          ),
          borderRadius: BorderRadius.circular(size * 0.24),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.28),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Icon(
          Icons.dashboard_customize_rounded,
          color: Colors.white,
          size: size * 0.58,
        ),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Transform.scale(
      scale: 1.8,
      child: Image.asset(
        isDark ? 'assets/images/logo_dark.png' : 'assets/images/logo_light.png',
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }
}
