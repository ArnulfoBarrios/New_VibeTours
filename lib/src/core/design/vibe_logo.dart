import 'package:flutter/material.dart';

import 'app_theme.dart';

class VibeLogoMark extends StatelessWidget {
  const VibeLogoMark({super.key, this.size = 34, this.admin = false});

  final double size;
  final bool admin;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: admin
              ? const [Color(0xFF2B8CFF), Color(0xFF7FB1FF)]
              : const [AppTheme.primary, AppTheme.indigo],
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
        admin ? Icons.dashboard_customize_rounded : Icons.travel_explore,
        color: Colors.white,
        size: size * 0.58,
      ),
    );
  }
}
